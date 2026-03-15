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

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405, env);
    }

    try {
      const body = await request.json();
      const { name, email, subject, message, phone } = body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return jsonResponse(
          { ok: false, error: "All fields are required" },
          400,
          env
        );
      }

      // Basic email format check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse(
          { ok: false, error: "Invalid email address" },
          400,
          env
        );
      }

      const resend = new Resend(env.RESEND_API_KEY);

      // Build email body
      let textBody = `Name: ${name}\nEmail: ${email}\n`;
      if (phone) {
        textBody += `Phone: ${phone}\n`;
      }
      textBody += `Subject: ${subject}\n\nMessage:\n${message}`;

      const { data, error } = await resend.emails.send({
        from: `VBI Website <${env.FROM_EMAIL}>`,
        to: [env.TO_EMAIL],
        replyTo: email,
        subject: `Contact Form: ${subject} - ${name}`,
        text: textBody,
      });

      if (error) {
        console.error("Resend error:", JSON.stringify(error));
        return jsonResponse(
          { ok: false, error: "Failed to send message. Please try again." },
          500,
          env
        );
      }

      return jsonResponse({ ok: true }, 200, env);
    } catch (err) {
      console.error("Worker error:", err.message);
      return jsonResponse(
        { ok: false, error: "Something went wrong. Please try again." },
        500,
        env
      );
    }
  },
};
