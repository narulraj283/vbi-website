---
phase: 04-newsletter-signup-form
plan: 01
subsystem: api
tags: [cloudflare-workers, resend, newsletter, double-opt-in, hmac, web-crypto]

# Dependency graph
requires:
  - phase: 01-baseline-deployment
    provides: Live site at vbi.narenlife.com with GitHub Pages
provides:
  - Newsletter Cloudflare Worker with POST /subscribe and GET /confirm endpoints
  - HMAC-signed confirmation tokens with 24h expiry using Web Crypto
  - Homepage footer form wired to newsletter Worker
  - Double opt-in flow via Resend emails and audiences API
affects: [04-02-deploy, 05-form-security]

# Tech tracking
tech-stack:
  added: [resend (audiences API), web-crypto (HMAC-SHA256)]
  patterns: [double-opt-in with signed tokens, base64url token encoding, HTML response for browser navigation endpoints]

key-files:
  created: [workers/newsletter/src/index.js, workers/newsletter/package.json, workers/newsletter/wrangler.toml, workers/newsletter/.gitignore]
  modified: [index.html, js/main.js]

key-decisions:
  - "HMAC-SHA256 via Web Crypto for token signing (no external JWT library needed)"
  - "Token format: base64url(payload).base64url(signature) with 24h expiry"
  - "GET /confirm returns HTML pages (browser navigation) while POST /subscribe returns JSON with CORS"
  - "Reused corsHeaders/jsonResponse pattern from contact Worker for consistency"

patterns-established:
  - "Double opt-in flow: POST creates signed token, email contains confirm link, GET verifies and adds to audience"
  - "HTML responses for user-facing browser endpoints (confirm page), JSON for API endpoints (subscribe)"
  - "showNewsletterFeedback() pattern for form feedback with success/error CSS classes"

requirements-completed: [FORM-06, FORM-07]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 4 Plan 01: Newsletter Worker + Homepage Form Summary

**Newsletter Cloudflare Worker with HMAC-signed double opt-in flow via Resend, and homepage footer form wired to POST /subscribe**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T17:21:22Z
- **Completed:** 2026-03-15T17:23:49Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Newsletter Worker with POST /subscribe (validates email, generates HMAC token, sends confirmation via Resend)
- GET /confirm endpoint that verifies HMAC signature and expiry, adds subscriber to Resend audience, returns HTML confirmation page
- Homepage footer form upgraded from non-functional div to proper form element with real Worker submission and feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold newsletter Worker project with double opt-in endpoints** - `ba9a903` (feat)
2. **Task 2: Update homepage footer form and newsletter JS handler** - `dc2af00` (feat)

## Files Created/Modified
- `workers/newsletter/src/index.js` - Newsletter Worker with /subscribe and /confirm endpoints, HMAC token signing/verification
- `workers/newsletter/package.json` - Worker project with resend dependency
- `workers/newsletter/wrangler.toml` - Worker config with name, vars (FROM_EMAIL, ALLOWED_ORIGIN, CONFIRM_URL)
- `workers/newsletter/.gitignore` - Excludes node_modules, .dev.vars, .wrangler
- `index.html` - Footer newsletter form wrapped in proper form element with feedback div
- `js/main.js` - initNewsletterForm() replaced with real Worker submission handler

## Decisions Made
- Used Web Crypto HMAC-SHA256 for token signing instead of a JWT library (simpler, no extra dependency, works natively in Workers)
- Token format is base64url(payload).base64url(signature) with JSON payload containing email and 24h expiry
- GET /confirm returns HTML pages (not JSON) since it is accessed via browser navigation from email links
- CORS headers applied only to POST /subscribe and OPTIONS, not to GET /confirm (browser navigation does not need CORS)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - Worker secrets (RESEND_API_KEY, RESEND_AUDIENCE_ID, CONFIRM_SECRET) will be configured during Plan 04-02 deploy.

## Next Phase Readiness
- Worker code is ready for deployment via `wrangler deploy`
- Secrets to configure: RESEND_API_KEY, RESEND_AUDIENCE_ID, CONFIRM_SECRET
- CONFIRM_URL in wrangler.toml may need updating if actual Workers subdomain differs from placeholder
- Homepage form JS points to placeholder Worker URL (https://vbi-newsletter.naren-ekwa.workers.dev)

---
*Phase: 04-newsletter-signup-form*
*Completed: 2026-03-15*

## Self-Check: PASSED
- All 4 created files verified on disk
- Both task commits (ba9a903, dc2af00) verified in git log
- SUMMARY.md exists at expected path
