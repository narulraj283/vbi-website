# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-15)

**Core value:** Deliver A+ quality content that practice owners, veterinarians, and practice managers love — and that industry experts recognize as top-tier
**Current focus:** Phase 8 — Events Structured Data (complete)

## Current Position

Phase: 8 of 10 (Events Structured Data)
Plan: 1 of 1 in current phase (complete)
Status: Phase complete
Last activity: 2026-03-15 — Plan 08-01 complete (Events JSON-LD structured data)

Progress: [██████░░░░] 55%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~5 minutes
- Total execution time: ~28 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Baseline Deployment | 2/2 | ~20 min | ~10 min |
| 2. Contact Form | 1/TBD | ~3 min | ~3 min |
| 3. Partner Inquiry Form | 1/2 | ~2 min | ~2 min |
| 4. Newsletter Signup Form | 1/2 | ~2 min | ~2 min |
| 8. Events Structured Data | 1/1 | ~1 min | ~1 min |

**Recent Trend:**
- Last 5 plans: Plan 02-01 (~3 min), Plan 03-01 (~2 min), Plan 04-01 (~2 min), Plan 08-01 (~1 min)
- Trend: Fast (code generation + structured data)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Keep static HTML on GitHub Pages — no rebuild
- [Init]: Cloudflare Workers + Resend for forms (MailChannels free tier ended Aug 2024)
- [Init]: faster-whisper 1.2.1 for transcription — 4x faster than openai/whisper, no FFmpeg, VAD support
- [Init]: All 101 transcripts are must-have — complete archive is core content value
- [Phase 1]: DNS is on Cloudflare (not GoDaddy) — nameservers: candy.ns.cloudflare.com, thomas.ns.cloudflare.com
- [Phase 1]: Cloudflare account: Naren@ekwa.com — has narenlife.com, dermobrain.com, ekwaai.com zones
- [Phase 1]: GitHub account: narulraj283 — repo is narulraj283/vbi-website
- [Phase 2]: Worker URL placeholder naren-ekwa.workers.dev -- actual subdomain confirmed during deploy
- [Phase 2]: CORS origin locked to env.ALLOWED_ORIGIN (dynamic, not hardcoded)
- [Phase 2]: Phone optional in email body; newsletter checkbox deferred to Phase 4
- [Phase 3]: Partner Worker URL placeholder uses naren-ekwa.workers.dev -- actual subdomain confirmed during deploy
- [Phase 3]: FROM_EMAIL uses partners@narenlife.com to distinguish from contact@narenlife.com
- [Phase 3]: agree_contact checkbox is client-side only -- not sent to Worker
- [Phase 4]: HMAC-SHA256 via Web Crypto for newsletter confirmation tokens (no JWT library)
- [Phase 4]: Token format base64url(payload).base64url(signature) with 24h expiry
- [Phase 4]: GET /confirm returns HTML (browser navigation), POST /subscribe returns JSON with CORS
- [Phase 8]: Plain JSON array of Event objects (each with own @context/@type) for JSON-LD -- no @graph wrapper
- [Phase 8]: JSON-LD structured data pattern: single script block in head, array of schema.org objects

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2/3/4]: Recipient email address for form Workers is TBD — must be confirmed before Workers deploy
- [Phase 6/7]: Host machine hardware unknown — need to check CPU vs GPU before committing to compute_type and expected runtime
- [Phase 10]: Partner logos (8) and Naren headshot are external dependencies — cannot stage without actual files
- [Phase 10]: Social media profile URLs for VBI Twitter/X, LinkedIn, Instagram, Facebook need verification

## Session Continuity

Last session: 2026-03-15
Stopped at: Completed 08-01-PLAN.md (Events JSON-LD structured data)
Resume file: None
