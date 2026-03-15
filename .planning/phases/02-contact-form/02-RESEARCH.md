# Phase 2: Contact Form - Research

**Researched:** 2026-03-15
**Domain:** Cloudflare Workers + Resend email delivery for static HTML contact form
**Confidence:** HIGH

## Summary

Phase 2 implements a contact form on the existing static HTML site at https://vbi.narenlife.com. The site already has a `/contact/` page with form fields (Full Name, Email, Phone, Subject dropdown, Message, newsletter checkbox). The implementation requires: (1) a Cloudflare Worker that receives POST requests and sends email via Resend, (2) client-side JavaScript to intercept form submission and POST to the Worker, and (3) visible success/error feedback to the user.

The stack is well-established: Resend SDK v6.9.x works natively in Cloudflare Workers with the `nodejs_compat` flag. Cloudflare's own documentation provides a tutorial for this exact pattern. The domain `narenlife.com` is already on Cloudflare DNS (account: Naren@ekwa.com), which simplifies Resend domain verification since SPF/DKIM/DMARC records are added in the same Cloudflare dashboard.

**Primary recommendation:** Deploy a single dedicated Cloudflare Worker for the contact form using the Resend SDK, with secrets managed via `wrangler secret`. Use vanilla `fetch()` in client-side JS to POST JSON to the Worker and show inline success/error messages.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FORM-01 | User can submit contact form with name, email, subject, and message fields | Existing contact page has these fields; client-side JS intercepts submit, serializes to JSON, POSTs to Worker URL |
| FORM-02 | Contact form sends email notification to configured recipient via Cloudflare Worker + Resend | Resend SDK 6.9.x in Worker; recipient stored as `wrangler secret`; Resend domain verification via Cloudflare DNS |
| FORM-03 | User sees success/error feedback after form submission (no silent failures) | Client-side fetch handler shows inline success message on 200, specific error message on failure; Worker returns JSON with status |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Wrangler CLI | 4.x (latest) | Create, develop, test, and deploy the Cloudflare Worker | Official Cloudflare CLI; required for `wrangler secret` management and `wrangler deploy` |
| resend (npm) | 6.9.x | Send transactional email from the Worker | Official Resend SDK; works in Cloudflare Workers with `nodejs_compat` flag; 3,000 emails/month free tier |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | The Worker is a single-file ~60-line script; no router, no framework needed for one endpoint |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend SDK | Direct `fetch()` to `https://api.resend.com/emails` | Avoids SDK dependency but loses type safety and error handling; SDK is only 192 KB |
| Separate Worker per form | Single Worker with path routing (or Hono) | Single Worker is simpler for Phase 2 (one form); separate Workers better when Phase 3 adds partner form |
| JSON body POST | HTML `<form>` with `action` URL (FormData) | JSON POST gives better control over error handling in JS; FormData requires redirect-based flow |

**Installation:**
```bash
# In a new workers/contact/ directory
npm init -y
npm install wrangler@latest resend
```

## Architecture Patterns

### Recommended Project Structure
```
workers/
  contact/
    src/
      index.js          # Worker entry point (~60 lines)
    wrangler.toml       # Worker config (name, compatibility_date, vars)
    .dev.vars           # Local dev secrets (gitignored)
    package.json
```

The Worker lives outside the main site repo files. It is deployed independently via `wrangler deploy`.

### Pattern 1: Static Form + Edge Worker + Email

**What:** The existing HTML `<form>` on `/contact/` is enhanced with a JavaScript `submit` event listener. On submit, JS prevents default, serializes fields to JSON, and POSTs to the Worker URL. The Worker validates, sends email via Resend, and returns JSON. JS displays the result inline.

**When to use:** Any form on a static site (GitHub Pages) that must send email without a traditional backend.

**Key flow:**
```
User fills form -> JS intercepts submit -> fetch() POST to Worker URL
  -> Worker receives JSON body
  -> Worker validates required fields (name, email, subject, message)
  -> Worker calls Resend SDK to send email
  -> Worker returns { ok: true } or { ok: false, error: "message" }
  -> JS shows success or error message to user
```

**Example (Worker):**
```javascript
// Source: Cloudflare Workers + Resend official tutorial pattern
import { Resend } from "resend";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://vbi.narenlife.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method not allowed" }),
        { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    try {
      const body = await request.json();

      // Validate required fields
      const { name, email, subject, message } = body;
      if (!name || !email || !subject || !message) {
        return new Response(
          JSON.stringify({ ok: false, error: "All fields are required" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const resend = new Resend(env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: `VBI Website <${env.FROM_EMAIL}>`,
        to: [env.TO_EMAIL],
        replyTo: email,
        subject: `Contact Form: ${subject} - ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      });

      if (error) {
        return new Response(
          JSON.stringify({ ok: false, error: "Failed to send message. Please try again." }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
  },
};
```

### Pattern 2: Client-Side Form Submission with Feedback

**What:** Vanilla JavaScript intercepts the form submit, disables the button, shows a loading state, POSTs to the Worker, then shows success or error inline.

**Example (client-side JS):**
```javascript
// Added to the contact page or js/main.js
const form = document.querySelector('[data-form="contact"]');
const feedback = document.getElementById("form-feedback");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  feedback.textContent = "";
  feedback.className = "";

  const data = {
    name: form.querySelector('[name="name"]').value,
    email: form.querySelector('[name="email"]').value,
    subject: form.querySelector('[name="subject"]').value,
    message: form.querySelector('[name="message"]').value,
  };

  try {
    const res = await fetch("https://contact-form.<account>.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (result.ok) {
      feedback.textContent = "Message sent successfully! We'll respond within 1-2 business days.";
      feedback.className = "form-success";
      form.reset();
    } else {
      feedback.textContent = result.error || "Failed to send message. Please try again.";
      feedback.className = "form-error";
    }
  } catch (err) {
    feedback.textContent = "Network error. Please check your connection and try again.";
    feedback.className = "form-error";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message";
  }
});
```

### Pattern 3: wrangler.toml Configuration

```toml
name = "vbi-contact-form"
main = "src/index.js"
compatibility_date = "2026-03-13"
compatibility_flags = ["nodejs_compat"]

[vars]
FROM_EMAIL = "contact@narenlife.com"
# TO_EMAIL stored as secret, not here
# RESEND_API_KEY stored as secret, not here
```

### Anti-Patterns to Avoid

- **Omitting CORS headers on error responses:** The browser reports a CORS error instead of the actual error. Always include CORS headers on EVERY response including 400, 500, etc.
- **Storing API keys in wrangler.toml [vars]:** Use `wrangler secret put` for RESEND_API_KEY and TO_EMAIL. Only non-sensitive values like FROM_EMAIL go in [vars].
- **Using `Access-Control-Allow-Origin: *`:** Lock to `https://vbi.narenlife.com` to prevent abuse from other origins.
- **Skipping try/catch in the Worker:** An unhandled exception returns no CORS headers, which browsers report as a CORS error rather than the real error.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery | Direct SMTP or raw API calls | Resend SDK | Handles retries, authentication, error parsing; 192 KB package |
| CORS handling | Ad-hoc header injection | Centralized CORS_HEADERS constant applied to every response | Inconsistent CORS headers are the #1 debugging nightmare |
| Form validation (server) | Complex regex validation | Basic truthy checks + let Resend validate email format | Over-validating server-side adds complexity; Resend rejects invalid emails |
| Secret management | Environment variables in code | `wrangler secret put` | Encrypted at rest; never in source control |

**Key insight:** The Worker is intentionally simple (~60 lines). Complexity belongs in the client-side UX (loading states, error messages), not in the Worker.

## Common Pitfalls

### Pitfall 1: Resend Domain Not Verified - Emails Silently Fail
**What goes wrong:** Worker returns success but no email arrives. Resend requires domain verification (SPF/DKIM records) before it will deliver from that domain.
**Why it happens:** Developer deploys Worker and tests before adding DNS records for Resend.
**How to avoid:** Add Resend domain verification DNS records FIRST, wait for verification to complete, THEN deploy and test the Worker. Since narenlife.com DNS is on Cloudflare, records are added in the same dashboard.
**Warning signs:** Resend API returns success but email never arrives; Resend dashboard shows "bounced" or "not delivered."

### Pitfall 2: Worker Errors Masquerade as CORS Errors
**What goes wrong:** Any unhandled exception in the Worker causes the browser to report a CORS error instead of the actual error.
**Why it happens:** When the Worker crashes before sending a response, no CORS headers are present, so the browser blocks the response.
**How to avoid:** Wrap the entire fetch handler in try/catch; always return CORS headers even from error paths. Test with `curl -X POST` to isolate Worker errors from CORS issues.
**Warning signs:** Form fails with CORS error immediately after a code change; curl to the Worker URL reveals a non-JSON error.

### Pitfall 3: FROM_EMAIL Address Not on Verified Domain
**What goes wrong:** Resend rejects the send request because the `from` address uses a domain not verified in Resend.
**Why it happens:** Using a personal email or different domain as the sender instead of the verified narenlife.com domain.
**How to avoid:** The `from` field MUST use an address on the Resend-verified domain (e.g., `contact@narenlife.com` or a subdomain like `noreply@mail.narenlife.com`).
**Warning signs:** Resend API returns error about unverified domain; 403 status from Resend API.

### Pitfall 4: Missing nodejs_compat Flag
**What goes wrong:** Worker fails to deploy or crashes at runtime with "module not found" errors because the Resend SDK uses Node.js APIs.
**Why it happens:** The `nodejs_compat` compatibility flag is not set in wrangler.toml.
**How to avoid:** Include `compatibility_flags = ["nodejs_compat"]` and set `compatibility_date` to 2024-09-23 or later in wrangler.toml.
**Warning signs:** Deploy error mentioning missing Node.js modules; runtime error about `crypto` or `buffer`.

### Pitfall 5: Recipient Email Hardcoded Instead of Secret
**What goes wrong:** The recipient email is in source code or wrangler.toml [vars], visible in the public GitHub repo.
**Why it happens:** It feels like a non-sensitive value, but email addresses attract spam when exposed.
**How to avoid:** Store TO_EMAIL as a wrangler secret: `npx wrangler secret put TO_EMAIL`.
**Warning signs:** `git grep` shows an email address in tracked files.

## Code Examples

### Complete wrangler.toml
```toml
# Source: Cloudflare Workers + Resend tutorial pattern
name = "vbi-contact-form"
main = "src/index.js"
compatibility_date = "2026-03-13"
compatibility_flags = ["nodejs_compat"]

[vars]
FROM_EMAIL = "contact@narenlife.com"
ALLOWED_ORIGIN = "https://vbi.narenlife.com"
```

### Secret Setup Commands
```bash
# Run these AFTER wrangler deploy (or use wrangler dev for local testing)
npx wrangler secret put RESEND_API_KEY
# Enter the Resend API key when prompted

npx wrangler secret put TO_EMAIL
# Enter the recipient email when prompted (TBD - must be confirmed)
```

### Local Development (.dev.vars)
```
RESEND_API_KEY=re_test_xxxxxxxxxxxx
TO_EMAIL=test@example.com
```

### Testing with curl (bypasses CORS for debugging)
```bash
curl -X POST https://vbi-contact-form.<account>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://vbi.narenlife.com" \
  -d '{"name":"Test","email":"test@example.com","subject":"Test Subject","message":"Test message"}'
```

### Resend Domain Verification DNS Records
```
# Added in Cloudflare DNS for narenlife.com
# Resend provides these exact values during domain setup:
# 1. SPF TXT record
# 2. DKIM CNAME records (resend._domainkey)
# 3. DMARC TXT record (optional but recommended)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MailChannels free tier (no auth) | Resend SDK (API key auth) | Aug 2024 (MailChannels sunset) | Must use Resend or paid alternative; MailChannels 401 errors on new accounts |
| Wrangler v3 | Wrangler v4 | March 2025 | v4 is current; use `wrangler@latest`; v3 supported until Q1 2026 |
| `addEventListener('fetch', ...)` pattern | `export default { async fetch() }` module pattern | 2023+ | Module Workers are the current standard; old Service Worker syntax still works but is legacy |
| Manual Node.js polyfills in Workers | `nodejs_compat` flag | Sept 2024+ | Resend SDK works out of the box with the flag; no manual polyfills needed |

**Deprecated/outdated:**
- MailChannels free tier: Ended Aug 31, 2024. Do not use.
- `wrangler init`: Replaced by `npm create cloudflare@latest` (C3).
- Service Worker syntax (`addEventListener`): Use module `export default` syntax instead.

## Open Questions

1. **Recipient email address (TO_EMAIL)**
   - What we know: Must be configured as a wrangler secret, not hardcoded
   - What's unclear: The actual email address is TBD per STATE.md
   - Recommendation: Use a placeholder secret; plan tasks so Worker is deployable and testable with any email; the actual address is set via `wrangler secret put TO_EMAIL` at deploy time

2. **Resend sending domain: root vs subdomain**
   - What we know: Resend recommends using a subdomain (e.g., `mail.narenlife.com`) for sending to keep reputation separate
   - What's unclear: Whether to use `contact@narenlife.com` (root) or `noreply@mail.narenlife.com` (subdomain)
   - Recommendation: Use root domain `contact@narenlife.com` for simplicity since this is a low-volume contact form, not marketing email. Subdomain adds DNS complexity with minimal benefit at this scale.

3. **Existing contact page HTML structure**
   - What we know: Page exists at `/contact/` with fields for Full Name, Email, Phone, Subject (dropdown), Message, and newsletter checkbox. The subject dropdown has 8 options (General Inquiry, Membership Question, Partnership Opportunity, Events & Webinars, Podcast Guest Request, Media Inquiry, Feedback & Suggestions, Technical Support).
   - What's unclear: Exact field `name` attributes and HTML structure (since the site code is deployed but not in this working directory)
   - Recommendation: First task should inspect the live page source to identify exact field names and IDs before writing the JS handler

4. **Phone number and newsletter checkbox**
   - What we know: The contact page has optional Phone and newsletter checkbox fields
   - What's unclear: Should these be included in the email notification? Should newsletter signup trigger a separate action?
   - Recommendation: Include phone in the email body if provided (optional field). Ignore newsletter checkbox for Phase 2 (newsletter is Phase 4 per REQUIREMENTS.md).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual + curl (no test framework detected in project) |
| Config file | none -- see Wave 0 |
| Quick run command | `curl -X POST <worker-url> -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","subject":"Test","message":"Hello"}'` |
| Full suite command | Manual verification: submit form on live site, check email delivery |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FORM-01 | User submits form with name, email, subject, message | smoke | `curl -s -o /dev/null -w "%{http_code}" -X POST <worker-url> -H "Content-Type: application/json" -d '{"name":"T","email":"t@t.com","subject":"S","message":"M"}'` (expect 200) | No -- Wave 0 |
| FORM-02 | Email delivered to recipient via Resend | integration/manual | Submit form, check recipient inbox within 60 seconds | No -- manual |
| FORM-03 | User sees success message on 200, error message on failure | e2e/manual | Submit form in browser, visually confirm feedback message | No -- manual |

### Sampling Rate
- **Per task commit:** curl smoke test to Worker endpoint
- **Per wave merge:** Full browser submission test on live site
- **Phase gate:** Form submitted on https://vbi.narenlife.com/contact/, email received, success message shown

### Wave 0 Gaps
- [ ] `workers/contact/` directory and `package.json` -- project scaffolding
- [ ] `.dev.vars` file for local development secrets
- [ ] Shell script for curl smoke tests against the Worker

## Sources

### Primary (HIGH confidence)
- [Cloudflare Workers + Resend tutorial](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/) -- official tutorial, SDK usage, secret management
- [Resend API reference](https://resend.com/docs/api-reference/emails/send-email) -- email send endpoint, required/optional fields
- [Resend Cloudflare DNS setup](https://resend.com/docs/knowledge-base/cloudflare) -- domain verification, SPF/DKIM records
- [Cloudflare Workers CORS example](https://developers.cloudflare.com/workers/examples/cors-header-proxy/) -- OPTIONS handling pattern
- [Wrangler configuration docs](https://developers.cloudflare.com/workers/wrangler/configuration/) -- secrets vs vars, compatibility flags
- [resend npm package](https://www.npmjs.com/package/resend) -- v6.9.3 confirmed current, 192 KB, MIT license

### Secondary (MEDIUM confidence)
- [Cory Dransfeldt contact form Worker](https://www.coryd.dev/posts/2024/building-a-contact-form-with-a-cloudflare-worker) -- real-world pattern with honeypot and rate limiting
- [Cloudflare Node.js compatibility blog](https://blog.cloudflare.com/nodejs-workers-2025/) -- nodejs_compat flag improvements through 2025
- [Resend Cloudflare Workers example repo](https://github.com/resend/resend-cloudflare-workers-example) -- official example wrangler.toml

### Tertiary (LOW confidence)
- Live site inspection of https://vbi.narenlife.com/contact/ -- form fields observed but exact HTML attribute names not confirmed (fetched via WebFetch, not raw source)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Cloudflare's own docs recommend Resend; SDK v6.9.x confirmed working with Workers
- Architecture: HIGH -- pattern is well-documented by Cloudflare and multiple community sources
- Pitfalls: HIGH -- CORS, secret management, domain verification issues are extensively documented
- Existing page structure: MEDIUM -- observed via WebFetch but exact field names need verification from source

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable domain; Resend SDK and Wrangler are actively maintained but API is stable)
