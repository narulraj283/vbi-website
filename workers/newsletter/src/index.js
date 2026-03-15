import { Resend } from "resend";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "", // Set dynamically from env.ALLOWED_ORIGIN
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function corsHeaders(env) {
  return {
    ...CORS_HEADERS,
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
  };
}

function jsonResponse(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(env), "Content-Type": "application/json" },
  });
}

// --- Base64url helpers ---

function toBase64Url(buffer) {
  var bytes = new Uint8Array(buffer);
  var binary = "";
  for (var i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  var base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  var pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  var binary = atob(base64);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- HMAC key helper ---

async function getHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// --- Token helpers ---

async function createToken(email, secret) {
  var payload = JSON.stringify({ email: email, exp: Date.now() + 86400000 }); // 24h expiry
  var payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  var key = await getHmacKey(secret);
  var signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  var signatureB64 = toBase64Url(signature);
  return payloadB64 + "." + signatureB64;
}

async function verifyToken(token, secret) {
  var parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid token format" };
  }
  var payloadB64 = parts[0];
  var signatureB64 = parts[1];

  var key = await getHmacKey(secret);
  var signatureBytes = fromBase64Url(signatureB64);
  var valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(payloadB64)
  );

  if (!valid) {
    return { valid: false, error: "Invalid signature" };
  }

  var payloadBytes = fromBase64Url(payloadB64);
  var payload = JSON.parse(new TextDecoder().decode(payloadBytes));

  if (payload.exp < Date.now()) {
    return { valid: false, error: "expired" };
  }

  return { valid: true, email: payload.email };
}

// --- HTML response helpers ---

function htmlPage(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - VBI Newsletter</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; color: #333; }
    .container { text-align: center; max-width: 480px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #2c5f2d; margin-bottom: 1rem; }
    p { line-height: 1.6; }
    a { color: #2c5f2d; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}

// --- Main handler ---

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var path = url.pathname;

    // CORS preflight — only for POST /subscribe
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    // POST /subscribe — accept email, send confirmation
    if (request.method === "POST" && path === "/subscribe") {
      return handleSubscribe(request, env);
    }

    // GET /confirm?token=... — verify token, add to audience
    if (request.method === "GET" && path === "/confirm") {
      return handleConfirm(url, env);
    }

    return jsonResponse({ ok: false, error: "Not found" }, 404, env);
  },
};

async function handleSubscribe(request, env) {
  try {
    var body = await request.json();
    var email = body.email;

    // Validate email
    if (!email || typeof email !== "string") {
      return jsonResponse({ ok: false, error: "Email is required" }, 400, env);
    }

    email = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ ok: false, error: "Invalid email address" }, 400, env);
    }

    // Generate signed confirmation token
    var token = await createToken(email, env.CONFIRM_SECRET);
    var confirmUrl = env.CONFIRM_URL + "/confirm?token=" + encodeURIComponent(token);

    // Send confirmation email via Resend
    var resend = new Resend(env.RESEND_API_KEY);
    var { data, error } = await resend.emails.send({
      from: "VBI Newsletter <" + env.FROM_EMAIL + ">",
      to: [email],
      subject: "Confirm your VBI newsletter subscription",
      html: buildConfirmationEmail(confirmUrl),
    });

    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      return jsonResponse(
        { ok: false, error: "Failed to send confirmation email. Please try again." },
        500,
        env
      );
    }

    return jsonResponse(
      { ok: true, message: "Check your email to confirm your subscription" },
      200,
      env
    );
  } catch (err) {
    console.error("Subscribe error:", err.message);
    return jsonResponse(
      { ok: false, error: "Something went wrong. Please try again." },
      500,
      env
    );
  }
}

async function handleConfirm(url, env) {
  var token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      htmlPage("Error", "<h1>Missing Token</h1><p>No confirmation token provided.</p><p><a href=\"https://vbi.narenlife.com\">Return to VBI</a></p>"),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    var result = await verifyToken(token, env.CONFIRM_SECRET);

    if (!result.valid) {
      if (result.error === "expired") {
        return new Response(
          htmlPage("Link Expired", "<h1>Link Expired</h1><p>This confirmation link has expired. Please sign up again.</p><p><a href=\"https://vbi.narenlife.com\">Return to VBI</a></p>"),
          { status: 410, headers: { "Content-Type": "text/html" } }
        );
      }
      return new Response(
        htmlPage("Invalid Link", "<h1>Invalid Link</h1><p>This confirmation link is not valid.</p><p><a href=\"https://vbi.narenlife.com\">Return to VBI</a></p>"),
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    // Add subscriber to Resend audience
    var resend = new Resend(env.RESEND_API_KEY);
    await resend.contacts.create({
      email: result.email,
      audienceId: env.RESEND_AUDIENCE_ID,
    });

    return new Response(
      htmlPage("Subscribed!", "<h1>You're Subscribed!</h1><p>Welcome to the VBI newsletter. You'll receive our latest insights and opportunities.</p><p><a href=\"https://vbi.narenlife.com\">Return to VBI</a></p>"),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("Confirm error:", err.message);
    return new Response(
      htmlPage("Error", "<h1>Something Went Wrong</h1><p>Please try signing up again.</p><p><a href=\"https://vbi.narenlife.com\">Return to VBI</a></p>"),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

function buildConfirmationEmail(confirmUrl) {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2c5f2d;">Confirm Your Subscription</h2>
  <p>Thanks for subscribing to the VBI newsletter! Please confirm your email by clicking the link below:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${confirmUrl}" style="background-color: #2c5f2d; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; display: inline-block; font-weight: bold;">Confirm Email</a>
  </p>
  <p style="color: #666; font-size: 0.9em;">This link expires in 24 hours.</p>
  <p style="color: #666; font-size: 0.9em;">If you didn't request this, you can ignore this email.</p>
</div>`;
}
