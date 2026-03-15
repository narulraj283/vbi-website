/**
 * Shared security module for VBI form Workers.
 * Provides Turnstile verification, honeypot detection, and KV-based rate limiting.
 */

export async function verifyTurnstile(token, secretKey, ip) {
  if (!token) {
    return { ok: false, error: "Missing verification token" };
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip: ip,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      return { ok: true };
    }

    return { ok: false, error: "Bot verification failed" };
  } catch (err) {
    console.error("Turnstile verification error:", err.message);
    return { ok: false, error: "Bot verification failed" };
  }
}

export function isHoneypot(body) {
  return Boolean(body._gotcha);
}

export async function checkRateLimit(env, ip, limit = 5, windowSeconds = 3600) {
  const key = `ip:${ip}`;

  try {
    const current = await env.RATE_LIMIT.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      return { ok: false, remaining: 0 };
    }

    await env.RATE_LIMIT.put(key, String(count + 1), {
      expirationTtl: windowSeconds,
    });

    return { ok: true, remaining: limit - count - 1 };
  } catch (err) {
    console.error("Rate limit error:", err.message);
    // Fail open — don't block legitimate users if KV has issues
    return { ok: true, remaining: limit };
  }
}
