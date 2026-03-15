import { Resend } from "resend";
import { verifyTurnstile, isHoneypot, checkRateLimit } from "../../shared/security.js";

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

      // --- Security checks ---
      if (isHoneypot(body)) {
        return jsonResponse({ ok: true }, 200, env);
      }

      const turnstileResult = await verifyTurnstile(
        body["cf-turnstile-response"],
        env.TURNSTILE_SECRET_KEY,
        request.headers.get("CF-Connecting-IP")
      );
      if (!turnstileResult.ok) {
        return jsonResponse({ ok: false, error: turnstileResult.error }, 403, env);
      }

      const rateResult = await checkRateLimit(env, request.headers.get("CF-Connecting-IP"));
      if (!rateResult.ok) {
        return jsonResponse({ ok: false, error: "Too many submissions. Please try again later." }, 429, env);
      }

      const { company_name, contact_name, contact_email, contact_phone, category, interest_level, message } = body;

      // Validate required fields
      if (!company_name || !contact_name || !contact_email || !contact_phone || !category || !interest_level || !message) {
        return jsonResponse(
          { ok: false, error: "All fields are required" },
          400,
          env
        );
      }

      // Basic email format check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
        return jsonResponse(
          { ok: false, error: "Invalid email address" },
          400,
          env
        );
      }

      const resend = new Resend(env.RESEND_API_KEY);

      // Build email body with all partner inquiry details
      const textBody = [
        `Company: ${company_name}`,
        `Contact: ${contact_name}`,
        `Email: ${contact_email}`,
        `Phone: ${contact_phone}`,
        `Category: ${category}`,
        `Interest Level: ${interest_level}`,
        ``,
        `Message:`,
        message,
      ].join("\n");

      const { data, error } = await resend.emails.send({
        from: `VBI Website <${env.FROM_EMAIL}>`,
        to: [env.TO_EMAIL],
        replyTo: contact_email,
        subject: `Partner Inquiry: ${company_name} - ${category}`,
        text: textBody,
      });

      if (error) {
        console.error("Resend error:", JSON.stringify(error));
        return jsonResponse(
          { ok: false, error: "Failed to send inquiry. Please try again." },
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
