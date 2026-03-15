# Project Research Summary

**Project:** VBI Website — Static Site Enhancement
**Domain:** Professional institute website — podcast transcription pipeline, serverless form endpoints, structured data
**Researched:** 2026-03-15
**Confidence:** HIGH

## Executive Summary

The VBI site is a complete 114-file static HTML site on GitHub Pages that needs three focused capability additions: (1) podcast transcripts for all 101 Libsyn episodes, (2) working Cloudflare Workers form endpoints for contact, partner inquiry, and newsletter, and (3) schema.org structured data for events and podcast content. None of these require a framework, build tool, or CMS — the recommended approach is an offline Python transcription pipeline, three independently deployed Cloudflare Workers, and inline JSON-LD blocks added directly to HTML files. The architecture is deliberately simple: everything either runs once locally and produces static output, or runs at the edge per user action. No new server infrastructure is needed.

The recommended stack is well-established and fully verified. faster-whisper (Python) is the clear choice for batch transcription: 4x faster than the original Whisper with identical accuracy and no FFmpeg dependency. Cloudflare Workers with Resend replace the MailChannels free tier that ended in August 2024. All three capabilities are independently deliverable, but HTTPS enablement is a prerequisite for forms and structured data validation — it must come first.

The primary risks are operational rather than architectural: API secrets committed to the public repo, CORS misconfiguration masking real Worker errors, the CNAME file being overwritten during the QA push that breaks HTTPS, and Whisper hallucinations or HTML injection errors corrupting episode pages. Every one of these is preventable with explicit process steps built into each phase. The project has a clear, low-risk path to completion if sequenced correctly.

## Key Findings

### Recommended Stack

The VBI stack is intentionally minimal — no framework, no build toolchain, no CMS. The three new capabilities each have a clearly superior tool choice. For transcription, faster-whisper 1.2.1 with the `large-v3` model running in Python 3.11 is the right call: it handles the 101-episode batch job locally, supports VAD-based pre-filtering that prevents hallucinations, and requires no FFmpeg. For form endpoints, Cloudflare Workers (Wrangler 4.x) with Resend as the email delivery layer is the officially recommended path — MailChannels free tier ended August 2024 and is no longer viable. For structured data, there is no library: inline `<script type="application/ld+json">` blocks in each page's `<head>` are the correct, zero-dependency approach.

**Core technologies:**
- `faster-whisper` 1.2.1: batch podcast transcription — 4x faster than openai/whisper, no FFmpeg, VAD pre-filtering for quality
- `feedparser` 6.x + `requests` 2.x: Libsyn RSS parsing and audio download — standard Python, handles enclosure URLs cleanly
- Cloudflare Workers (Wrangler 4.x): serverless form endpoints — edge deployment, free tier covers all VBI volume
- Resend (npm, latest): transactional email from Workers — 3,000 emails/month free, officially recommended by Cloudflare
- Schema.org JSON-LD (inline): structured data — no library needed, Google's recommended format

### Expected Features

All P1 features are already in PROJECT.md as active requirements. There are no gaps between research findings and project scope. The MVP is well-defined.

**Must have (table stakes — P1):**
- HTTPS enabled on GitHub Pages — prerequisite for forms, structured data validation, and browser trust
- 109 QA-fixed files pushed — stable baseline before adding transcripts or schema on top
- Working contact form (Cloudflare Worker) — basic professional reachability
- All 101 podcast transcripts (inline HTML) — accessibility compliance, SEO, core content value
- PodcastEpisode + PodcastSeries schema.org markup — Google podcast rich results
- Event schema.org JSON-LD on events page — Google event rich results
- Social media footer links with real URLs — eliminates amateur placeholder `#` hrefs
- Partner logos on partners page — eliminates placeholder boxes
- Founder headshot on about page — organizational credibility

**Should have (differentiators — P2):**
- Partner inquiry form (separate Cloudflare Worker) — routes partner interest separately from contact
- Newsletter signup form with double opt-in — ongoing member engagement, GDPR-compliant

**Defer (v2+):**
- Timestamped transcript navigation — only worthwhile if per-episode audio player is also embedded
- Key takeaways block per episode — requires human review pass on all 101 episodes
- Transcript H2 section headings — second-pass enhancement once raw transcripts are live

### Architecture Approach

The architecture has three layers that never overlap: an offline build-time layer (Python scripts that run locally, produce modified HTML, and push to git), a static hosting layer (GitHub Pages serving raw HTML with zero backend), and a Cloudflare edge layer (three Workers handling cross-origin form POSTs). Each layer is independently operable. Transcripts are baked into episode HTML at build time — not loaded via JavaScript at runtime — which means one HTTP request per page, full SEO crawlability, and no JavaScript dependency for content. Workers are deployed one per form endpoint to isolate failures and simplify debugging.

**Major components:**
1. Transcription pipeline (`scripts/transcribe/`) — Python: feedparser fetches Libsyn RSS, requests downloads audio, faster-whisper transcribes, inject_transcripts.py writes into episode HTML
2. Structured data injector (`scripts/structured_data/`) — Python: reads episode metadata, generates JSON-LD blocks, inserts into `<head>` of episode and events pages
3. Cloudflare Workers (`workers/contact/`, `workers/partner/`, `workers/newsletter/`) — JS: receive cross-origin POST, validate, send email via Resend, return JSON with CORS headers on every response
4. Browser form handler (`js/main.js`) — vanilla `fetch()`: intercepts form submit, POSTs JSON to Worker URL, displays confirmation or error message
5. GitHub Pages (static hosting) — unchanged, serves all HTML/CSS/JS/assets; CNAME file at repo root maintains custom domain

### Critical Pitfalls

1. **API secrets in wrangler.toml** — use `wrangler secret put RESEND_API_KEY` only; never put credentials in `[vars]`; add `.dev.vars` to `.gitignore` before creating the file
2. **Worker JS errors masquerade as CORS errors** — wrap entire Worker `fetch` handler in `try/catch`; always return CORS headers even on error responses; use `curl` to distinguish Worker crashes from actual CORS issues
3. **CNAME file overwritten on QA push — HTTPS breaks** — `git pull` before pushing QA files to ensure CNAME is present locally; verify repo Settings > Pages shows green domain check after push
4. **Transcript HTML injection corrupts episode pages** — use BeautifulSoup + `html.escape()` rather than string replacement; test on one episode before batch-processing all 101
5. **Whisper hallucinations on music/silence** — enable VAD pre-filtering in faster-whisper; manually review first/last 60 seconds of 5–10 transcripts before committing all 101 pages

## Implications for Roadmap

Based on research, the dependency chain is clear and dictates phase ordering. HTTPS must precede forms and schema validation. A stable HTML baseline must precede transcript injection. Workers can be developed in parallel with transcription. Assets (logos, headshot) are purely additive and can slot in anywhere.

### Phase 1: Baseline Deployment and HTTPS

**Rationale:** Everything else depends on a stable, HTTPS-enabled, publicly accessible site. The 109 QA-fixed files establish the clean HTML baseline; HTTPS unblocks forms (cross-origin requires HTTPS) and schema validation (Google Search Console indexes only HTTPS). This phase is a prerequisite blocker — nothing else should land in production before it completes.

**Delivers:** Clean 114-file HTML site live at `https://vbi.narenlife.com` with valid SSL certificate

**Addresses:** "Push 109 QA-fixed files" and "Enable HTTPS" from PROJECT.md active requirements

**Avoids:**
- CNAME file overwritten (verify before and after push; check Pages settings)
- HTTPS not enabling due to GoDaddy DNS conflicts (audit for conflicting A records; remove and re-add custom domain if certificate provisioning stalls)

**Research flag:** No deeper research needed — well-documented GitHub Pages patterns.

---

### Phase 2: Cloudflare Workers Form Endpoints

**Rationale:** Forms can be developed in parallel with Phase 1 and deployed once HTTPS is live. Establishing the secret management pattern (wrangler secret, not wrangler.toml vars) before writing any Worker code is non-negotiable given the public repo. The contact form should be shipped first as the simplest; partner inquiry and newsletter follow the same pattern.

**Delivers:** Working contact, partner inquiry, and newsletter forms with email delivery via Resend; spam protection via Cloudflare Turnstile and honeypot fields; rate limiting (5 submissions/IP/hour)

**Uses:** Wrangler 4.x, Resend npm SDK, vanilla fetch() in main.js

**Implements:** Static Form → Edge Worker → Email pattern (three independent Workers, one per endpoint)

**Avoids:**
- Secrets in wrangler.toml — use `wrangler secret put` for all credentials
- CORS errors masking Worker crashes — try/catch wrapper + CORS headers on every response path
- OPTIONS preflight not handled — add explicit OPTIONS handler as first check in every Worker

**Research flag:** No deeper research needed — Cloudflare Workers + Resend pattern is well-documented with official tutorials.

---

### Phase 3: Podcast Transcription Pipeline

**Rationale:** Transcription is the highest-volume task (101 episodes) and the most error-prone due to file sizes, hallucinations, and HTML injection risks. It should run after the baseline is stable so transcripts are injected into final, clean episode pages. It can run in parallel with Phase 2 development. The pipeline is a one-time offline operation — build it once, validate on 1 episode, then batch all 101.

**Delivers:** 101 episode HTML pages with inline transcript sections; ready for structured data injection in Phase 4

**Uses:** faster-whisper 1.2.1 (Python 3.11), feedparser, requests, BeautifulSoup for HTML injection, tqdm for progress tracking

**Implements:** Offline Pipeline → Static Output pattern

**Avoids:**
- Whisper 25 MB file size trap — audit all file sizes before downloading; re-encode oversized files to 64 kbps mono
- Transcript HTML injection errors — use BeautifulSoup + html.escape(); test on 1 episode; preserve originals in git before batch
- Hallucinations — enable VAD pre-filtering; QA review of 10+ transcripts before committing
- Batch failure with no recovery — write progress log; skip already-completed episodes on retry

**Research flag:** No deeper research needed for the pipeline itself. If the host machine is CPU-only and runtime is unacceptable, consider a short research spike on cloud-based faster-whisper options (Modal, RunPod).

---

### Phase 4: Structured Data (Schema.org)

**Rationale:** JSON-LD injection runs after transcripts are finalized so episode descriptions can reference transcript content accurately. Event schema can be done any time events page content is final. PodcastSeries schema (hub page) must be done before PodcastEpisode schema since episodes reference the series via `partOfSeries`.

**Delivers:** 101 episode pages with PodcastEpisode JSON-LD; podcast hub page with PodcastSeries JSON-LD; events page with Event JSON-LD; Google rich results eligible for all three types

**Implements:** JSON-LD in `<head>` for structured data pattern; inject_schema.py for batch episode injection

**Avoids:**
- Schema with incorrect required fields — validate every page type through Google Rich Results Test before committing; Event requires `name`, `startDate`, and `location` at minimum
- Stale structured data — ensure episode titles, dates, and URLs in JSON-LD match the live page content

**Research flag:** No deeper research needed — schema.org and Google structured data documentation is authoritative and well-documented.

---

### Phase 5: Assets and Content Polish

**Rationale:** Partner logos and founder headshot are purely additive and entirely dependent on external asset delivery. They cannot be staged without the actual files. This phase is last because it has no technical dependencies but has external blockers (asset approval). Social media link verification is also here — simple but requires confirming active VBI profiles on each platform.

**Delivers:** Partners page with real logos; About page with founder headshot; Footer with working social media links to 4 verified platforms

**Addresses:** Remaining P1 items from PROJECT.md; eliminates all visible placeholder content

**Avoids:**
- Partner logos pushed without alt text or correct dimensions — WebP conversion, explicit width/height, and alt text required before push
- Social links pointing to wrong or inactive accounts — verify each URL returns the correct VBI profile

**Research flag:** No research needed — purely content and asset work.

---

### Phase Ordering Rationale

- **HTTPS first** because browser mixed-content policy blocks cross-origin form submissions from HTTP pages, and Google Search Console will not validate structured data on HTTP pages. This is a hard dependency, not a preference.
- **Workers second** (parallel to Phase 1 development) because Worker code can be written and tested locally before the production domain is HTTPS — but only deployed to production after Phase 1 completes.
- **Transcription third** because it modifies the episode HTML files that Phase 4's schema injector will also read — running transcription first means schema injection operates on final page content.
- **Schema fourth** because PodcastEpisode schema benefits from having accurate transcript descriptions already in the page; also, schema validation requires HTTPS (Phase 1 dependency).
- **Assets last** because they are externally blocked and purely additive — sequencing them last avoids blocking other work on external dependencies.

### Research Flags

Phases with standard, well-documented patterns (no additional research needed):
- **Phase 1:** GitHub Pages HTTPS + custom domain — official documentation covers every scenario
- **Phase 2:** Cloudflare Workers + Resend — Cloudflare's own tutorial is the source of truth
- **Phase 3:** faster-whisper batch transcription — well-documented; only spike needed is if CPU runtime is unacceptable
- **Phase 4:** schema.org JSON-LD — schema.org and Google Search documentation are authoritative
- **Phase 5:** Assets and content — no technical research needed

Phases that may need a limited research spike during execution:
- **Phase 3 (optional):** If the host machine has no GPU and 50+ hours of audio runtime is unacceptable, a 1-hour spike on cloud-based Whisper options (Modal, RunPod) is warranted before committing to CPU batch.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All tools verified against official docs and PyPI; faster-whisper version 1.2.1 confirmed; Wrangler v4.73.0 confirmed; MailChannels sunset confirmed |
| Features | HIGH | Feature set directly matches PROJECT.md active requirements; W3C WAI and Google documentation consulted for accessibility and SEO claims |
| Architecture | HIGH | Cloudflare Workers and GitHub Pages patterns verified against official docs; MEDIUM on Whisper pipeline tooling (community consensus, multiple sources) |
| Pitfalls | HIGH | Critical pitfalls verified against official Cloudflare, GitHub Pages, and OpenAI documentation; community reports corroborate MailChannels and CORS issues |

**Overall confidence: HIGH**

### Gaps to Address

- **Recipient email address:** ARCHITECTURE.md notes the recipient email for form Workers is "TBD." This must be confirmed before Workers can be deployed. Address in Phase 2 planning.
- **Host machine hardware:** Transcription strategy (CPU vs. GPU path, model choice between `large-v3` and `turbo`) depends on the machine running the pipeline. Address at Phase 3 kickoff — a brief hardware check determines the right compute_type and expected runtime.
- **Cloudflare Email send_email binding availability:** The native `send_email` Worker binding was in private beta as of September 2025. If not available for the VBI Cloudflare account, fall back to Resend REST API via `fetch()`. Verify at Phase 2 start.
- **Partner logo and headshot asset status:** FEATURES.md flags these as external dependencies. They cannot be staged until files are provided. Track as a parallel external action item from project kickoff.
- **Social media profile URLs:** Footer social links require confirmed active VBI profile URLs for Twitter/X, LinkedIn, Instagram, and Facebook. Verify before Phase 5.

## Sources

### Primary (HIGH confidence)
- [faster-whisper PyPI + GitHub (SYSTRAN/faster-whisper)](https://github.com/SYSTRAN/faster-whisper) — version 1.2.1, architecture, quantization, VAD batching
- [Cloudflare Workers: Send Emails with Resend](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/) — official tutorial; Resend as recommended provider
- [Wrangler v4 changelog](https://developers.cloudflare.com/changelog/post/2025-03-13-wrangler-v4/) — v4.0.0 release, Node compatibility
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) — CORS, secrets, error handling
- [Google Search: Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event) — required properties for rich results
- [Schema.org Event / PodcastEpisode / PodcastSeries](https://schema.org/) — canonical property references
- [GitHub Pages: securing with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) — HTTPS provisioning, DNS requirements
- [GitHub Pages: troubleshooting custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages) — CNAME pitfalls
- [W3C WAI Transcripts guide](https://www.w3.org/WAI/media/av/transcripts/) — accessibility requirements; inline preferred over downloadable
- [Resend Pricing](https://resend.com/pricing) — 3,000 emails/month free tier
- [MailChannels free tier sunset announcement](https://blog.mailchannels.com/mailchannels-enables-free-email-sending-for-cloudflare-workers-customers/) — free tier ended August 31, 2024
- [Cloudflare Workers Rate Limiting GA](https://developers.cloudflare.com/changelog/post/2025-09-19-ratelimit-workers-ga/) — rate limiting available for form Workers
- [Libsyn RSS feed help](https://help.libsynsupport.com/hc/en-us/articles/360041220911-The-RSS-Feed) — RSS URL format and enclosure structure

### Secondary (MEDIUM confidence)
- [Modal: Choosing Whisper variants](https://modal.com/blog/choosing-whisper-variants) — faster-whisper vs WhisperX comparison
- [WhisperX speaker diarization](https://brasstranscripts.com/blog/whisper-speaker-diarization-guide) — hallucination patterns and VAD benefits
- [Batch downloading and transcribing podcast episodes (2025)](https://hsu.cy/2025/08/poddl/) — community transcription pipeline patterns
- [LifeLearn — Schema markup for veterinary websites (2025)](https://www.lifelearn.com/2025/07/17/what-is-schema-markup-why-it-matters-for-veterinary-seo/) — domain-specific SEO context

---
*Research completed: 2026-03-15*
*Ready for roadmap: yes*
