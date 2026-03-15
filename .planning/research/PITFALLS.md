# Pitfalls Research

**Domain:** Static site enhancement — podcast transcription at scale, Cloudflare Workers form endpoints, GitHub Pages deployment
**Researched:** 2026-03-15
**Confidence:** HIGH (GitHub Pages/Cloudflare Workers official docs verified; Whisper findings from official OpenAI docs + community)

---

## Critical Pitfalls

### Pitfall 1: API Secrets Committed to Git via wrangler.toml

**What goes wrong:**
Developer puts email API keys (Resend, SendGrid) directly in `wrangler.toml` `[vars]` section instead of using `wrangler secret`. The file gets committed to the narulraj283/vbi-website repo and the API key is publicly exposed.

**Why it happens:**
`wrangler.toml` is where all other config lives, so it feels like the natural place for credentials. The distinction between `[vars]` (plaintext, committed) and secrets (encrypted, never in files) is easy to miss when first using Wrangler.

**How to avoid:**
- Use `wrangler secret put RESEND_API_KEY` for any API key or credential
- Use `.dev.vars` for local development (gitignored by default)
- Only use `[vars]` in `wrangler.toml` for non-sensitive config like `ALLOWED_ORIGIN` or feature flags
- Add `.dev.vars` to `.gitignore` before creating the file

**Warning signs:**
- wrangler.toml contains any value that looks like an API key (`sk_...`, `SG.`, etc.)
- Running `git diff --staged` shows credential-like strings in config files
- CI/CD pipeline secrets scanner flags the commit

**Phase to address:**
Cloudflare Workers form endpoint phase — establish secret management pattern before writing any Worker code.

---

### Pitfall 2: Worker Code Errors Masquerade as CORS Errors

**What goes wrong:**
A bug anywhere in the Worker (JSON parse failure, undefined variable, missing import) causes the Worker to crash. The browser reports a CORS error, not the actual error. The developer spends hours debugging CORS when the real problem is a JavaScript exception inside the Worker.

**Why it happens:**
When the Worker crashes before it can send a response with proper CORS headers, the browser sees a network failure and attributes it to CORS policy. The actual error only appears in the Cloudflare Workers dashboard logs, not in browser devtools.

**How to avoid:**
- Wrap the entire `fetch` handler body in a `try/catch`
- Always return a proper CORS response even from the error handler
- Check Cloudflare dashboard "Real-time Logs" before assuming any submission issue is a CORS problem
- Test the Worker endpoint directly with `curl` (no browser CORS) to isolate Worker errors from CORS errors

**Warning signs:**
- Form submission fails with CORS error immediately after making a code change
- `curl -X POST https://worker-url/...` returns a non-JSON error response
- Browser devtools shows the OPTIONS preflight succeeding but POST failing

**Phase to address:**
Cloudflare Workers form endpoint phase — establish error handling wrapper before adding business logic.

---

### Pitfall 3: CNAME File Absent or Overwritten — HTTPS Certificate Never Issues

**What goes wrong:**
The GitHub Pages site loses its custom domain (`vbi.narenlife.com`) because the `CNAME` file is missing from the repo root. Without it, GitHub Pages stops serving the custom domain, Let's Encrypt cannot issue or renew the certificate, and the site either goes down or falls back to `narulraj283.github.io` over HTTP.

**Why it happens:**
When pushing the 109 QA-fixed files via `git push`, if the local working copy doesn't include the `CNAME` file (it may only exist in the remote repo from a prior GitHub UI configuration), the push overwrites the remote and removes it. This is the #1 cause of "custom domain stopped working after a push" on GitHub Pages.

**How to avoid:**
- Before pushing, `git pull` first to ensure the CNAME file is present locally
- Verify `CNAME` file exists at repo root with exactly `vbi.narenlife.com` as its sole content (no trailing newlines, no extra text)
- The filename must be uppercase `CNAME`, not `cname`
- After pushing, confirm in GitHub repo Settings > Pages that the custom domain is still set and shows a green checkmark

**Warning signs:**
- `git status` shows `CNAME` as deleted or not tracked
- GitHub Pages settings show custom domain field blank after a push
- `https://vbi.narenlife.com` shows a certificate error or GitHub 404 page

**Phase to address:**
Initial deployment phase (pushing 109 QA-fixed files) — verify CNAME before and after the push.

---

### Pitfall 4: Whisper Audio Files Exceed 25 MB — Batch Fails Silently

**What goes wrong:**
Libsyn podcast episodes vary widely in length. Any episode over ~60 minutes at standard podcast bitrates will exceed Whisper API's 25 MB file size limit. The API rejects the file, the batch script either crashes or silently skips it, and the transcript for that episode is never generated — but the script reports "done."

**Why it happens:**
Developers download all 101 audio files and submit them to Whisper API without checking file sizes first. The 25 MB limit is not surfaced prominently in the Whisper API docs and is easy to miss until a batch run fails mid-way.

**How to avoid:**
- Check file sizes before submitting: any file over 24 MB must be pre-processed
- Re-encode oversized files to a lower bitrate (64 kbps mono is sufficient for speech) using `ffmpeg` before submission — this rarely affects transcription quality
- The local Whisper model (run via `whisper` CLI or `faster-whisper`) has no file size limit and is the better choice for a one-time 101-episode batch
- Track which episodes succeeded/failed with a log file per episode

**Warning signs:**
- Audio files in the batch range from 20 MB to 80+ MB
- API error logs contain `"Invalid file size"` or HTTP 413 responses
- Episode count in output transcripts is less than 101

**Phase to address:**
Podcast transcription phase — run a file size audit as the first step before any transcription work begins.

---

### Pitfall 5: Transcript Integration Breaks Episode Page HTML Structure

**What goes wrong:**
Inserting 101 transcripts into HTML episode pages produces malformed HTML — unescaped characters (`<`, `>`, `&`, `"`) in transcript text break the page structure, or the script inserts raw text outside any container element. Pages look broken in browsers, and the transcript text may render as garbage or disappear entirely.

**Why it happens:**
Whisper outputs plain text. A naive script that does string concatenation to inject this text into HTML (e.g., `page_html.replace('{{transcript}}', transcript_text)`) will not escape HTML special characters. Even one episode with `&amp;` or a speaker saying "click <here>" corrupts the page.

**How to avoid:**
- Parse the HTML with a proper library (Python's `html.parser`, `BeautifulSoup`, or equivalent) rather than string replacement
- Escape all transcript content with `html.escape()` before insertion
- Validate 3–5 output pages in a browser before running the full 101-episode batch
- Preserve original pages as a backup before running the injection script

**Warning signs:**
- Test page renders with raw angle brackets visible in the transcript section
- Browser inspector shows malformed DOM structure in transcript container
- Pages that were previously valid now fail HTML validation

**Phase to address:**
Podcast transcription phase — test the injection script on a single episode page before batch processing.

---

### Pitfall 6: Whisper Hallucinations on Silence, Intros, and Background Music

**What goes wrong:**
Whisper generates plausible-sounding but completely fabricated text when given audio segments that are mostly silence, background music, or low-quality intro jingles. These hallucinations appear as real transcript content and are impossible to distinguish visually from legitimate transcription.

**Why it happens:**
Whisper's model was trained to always produce output. On segments with no clear speech, it fills the gap with probable-sounding text drawn from its training data. Podcast intros with music are particularly prone to this.

**How to avoid:**
- Review the first and last 60 seconds of several transcripts manually — intro/outro hallucinations are most common there
- For the VBI podcast specifically, if episodes have a consistent intro segment, trim that portion before submission (or accept that the first ~30 seconds of transcript may be noise)
- Use `faster-whisper` with Voice Activity Detection (VAD) pre-filtering to skip non-speech segments before submitting to the model
- Flag anomalous segments: any "transcript sentence" under 5 words in isolation at the start/end of a file warrants human review

**Warning signs:**
- Transcript begins with generic phrases unrelated to the episode topic
- Short nonsensical sentences appearing at regular intervals throughout the transcript
- Different episodes with identical opening text despite different content

**Phase to address:**
Podcast transcription phase — include a QA review step after batch transcription before HTML integration.

---

### Pitfall 7: GitHub Pages HTTPS Not Enabling Due to DNS Conflict

**What goes wrong:**
The "Enforce HTTPS" checkbox in GitHub Pages settings is grayed out or clicking it has no effect. The site serves over HTTP indefinitely, and the SSL certificate is never provisioned. This is the exact scenario the project is currently in (HTTPS enable is a listed active requirement).

**Why it happens:**
GitHub Pages uses Let's Encrypt and can only provision the certificate after DNS verification passes. The most common blockers are: (a) conflicting DNS records at GoDaddy (extra A records alongside the CNAME), (b) CAA records that don't permit `letsencrypt.org`, or (c) the DNS check is stuck and needs to be reset. GoDaddy sometimes adds A records automatically when a CNAME is set, creating a conflict.

**How to avoid:**
- Audit the GoDaddy DNS zone for `vbi.narenlife.com` and remove any A or AAAA records that conflict with the CNAME record
- Check whether the domain has CAA records; if so, ensure `letsencrypt.org` is listed
- If the "Enforce HTTPS" button remains stuck after DNS is clean, remove the custom domain from GitHub Pages settings and re-add it — this restarts the certificate provisioning job
- Wait up to 24 hours after any DNS change before concluding provisioning has failed

**Warning signs:**
- "Enforce HTTPS" checkbox is present but grayed out with "Not yet available" message
- GitHub Pages settings show a DNS check warning even after the CNAME is correctly set
- `dig vbi.narenlife.com` returns both a CNAME and A records simultaneously

**Phase to address:**
Initial deployment phase — HTTPS enablement must be verified before announcing the site as live.

---

### Pitfall 8: Cloudflare Workers Not Handling OPTIONS Pre-flight — All Form Submissions Blocked

**What goes wrong:**
The contact, partner inquiry, and newsletter form Workers accept POST requests but return a 405 or no response for OPTIONS requests. Every cross-origin form submission from `vbi.narenlife.com` fails immediately with a CORS error before the data ever reaches the Worker's business logic.

**Why it happens:**
The browser always sends an OPTIONS pre-flight request before a cross-origin POST. Workers that only match `request.method === 'POST'` in their handler ignore the OPTIONS request entirely, and the Worker runtime returns a default error response without CORS headers, blocking the actual POST from ever being sent.

**How to avoid:**
- Add an explicit OPTIONS handler as the first check in every Worker's `fetch` handler, returning 204 with the full CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`)
- Set `Access-Control-Allow-Origin` to `https://vbi.narenlife.com` specifically — not `*` — to prevent the form endpoint from being abused by other origins
- Test with a real browser on the actual domain, not just `curl` (curl skips pre-flight)

**Warning signs:**
- Browser devtools Network tab shows an OPTIONS request with a non-200 response
- Form submission fails immediately without any POST request appearing in devtools
- Worker logs show no activity when form is submitted

**Phase to address:**
Cloudflare Workers form endpoint phase — include OPTIONS handling in the Worker boilerplate before writing per-form logic.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode recipient email in Worker code | Fast to ship | Changing email requires re-deploy; email is visible in public repo if committed | Never — use `wrangler secret` |
| Skip rate limiting on form Workers | Simpler code | Spam floods email inbox; email API quota gets consumed; sending domain may be flagged | Never for public endpoints |
| Run Whisper transcription all at once without progress logging | Simpler script | If the run fails at episode 87, no way to resume; must restart from scratch | Never for 100+ file batches |
| String-replace to inject transcripts into HTML | Fast to write | HTML injection errors corrupt pages; unescaped characters break structure | Never — use HTML-aware tooling |
| Use `wrangler.toml [vars]` for API keys | Convenient | API keys exposed in version control | Never |
| Skip HTTPS enforcement until "later" | Unblocks other work | Mixed content warnings block asset loading; SEO ranking penalty; user trust issue | Never — must be resolved before launch |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Libsyn audio download | Downloading all 101 episodes simultaneously with no delay | Add a 1–2 second delay between downloads; parse the RSS feed for direct MP3 URLs rather than scraping episode pages |
| Whisper API | Submitting files without checking size | Audit all file sizes first; re-encode files over 20 MB to 64 kbps mono with ffmpeg before submission |
| Resend / SendGrid | Using Node.js SDK library in Cloudflare Workers | Use the HTTP REST API directly via `fetch()` — the Node.js SDK uses `fs` and `crypto` modules unavailable in V8 isolates |
| GitHub Pages HTTPS | Expecting certificate immediately after enabling custom domain | Allow 24 hours; if stuck, remove and re-add custom domain in Pages settings to restart provisioning |
| Cloudflare Workers + GitHub Pages (CORS) | Setting `Access-Control-Allow-Origin: *` | Set to `https://vbi.narenlife.com` to restrict to the actual origin |
| Schema.org Event structured data | Adding JSON-LD with incorrect required fields | Validate with Google's Rich Results Test before deploying; Event requires `name`, `startDate`, and `location` at minimum |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unoptimized transcript HTML (large inline text blocks) | Pages with transcripts are slow to load; Google PageSpeed score drops | Keep transcript text in a `<details>` collapsed section or lazy-load it; minify HTML output | At 101 pages with transcripts averaging 5,000+ words |
| All 101 transcripts generated without resume checkpoint | Batch script crashes at episode N; must restart from episode 1 | Write a progress log; skip already-completed episodes on retry | Any point in a 101-file batch run |
| Images on partner/about page not optimized | Page load time degrades; Core Web Vitals drop | Convert partner logos and headshots to WebP; set explicit `width` and `height` attributes | Immediately for any image over 200 KB |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No honeypot field on contact/partner inquiry forms | Bot submissions flood the email inbox immediately on launch | Add a hidden `<input name="website">` field; Worker rejects any submission where this field is populated |
| No rate limiting on form Workers | Abuse drains email API quota; sending domain may be blocklisted | Use Cloudflare Workers Rate Limiting (now GA as of Sept 2025) — limit to 5 submissions per IP per hour |
| Recipient email address hardcoded in Worker source | Email address is exposed if the repo is public or becomes public | Store recipient email as a `wrangler secret`, not in code or `wrangler.toml` |
| Missing SPF/DKIM/DMARC on sending domain | Form submission emails land in spam; users never receive confirmation | Verify DNS records for the sending domain before go-live; test with mail-tester.com |
| PAT tokens left in environment after deployment | GitHub Personal Access Token can be used to push malicious code to the repo | Revoke PAT immediately after the initial 109-file push (listed in PROJECT.md as an active requirement) |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Form shows no success/error state after submission | User submits twice; doesn't know if message was received | JavaScript `fetch` handler must display "Message sent" on 200 and "Something went wrong" on error — never silently succeed or fail |
| Transcript walls of text without structure | Readers cannot scan or navigate long transcripts | Wrap transcript in a `<details><summary>View Transcript</summary>...</details>` so it's collapsed by default; page still benefits from SEO indexing |
| Broken social media links in footer | Users click and hit 404 or wrong profiles; professionalism undermined | Verify each of the 4 social links (Twitter, LinkedIn, Instagram, Facebook) returns the correct VBI profile before pushing |
| Partner logo placeholders still visible at launch | Partners notice their logo is absent; reflects poorly on VBI | Source and confirm all 8 partner logos before pushing to production; a missing logo is worse than a styled placeholder |
| Form submission with no email confirmation to sender | User has no record that contact was received; they follow up repeatedly | Worker should send an auto-reply to the submitter — not just forward to VBI inbox |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Podcast transcripts added to pages:** Verify `<meta name="description">` for each episode page was also updated to reference transcript content — not just the raw transcript block
- [ ] **Cloudflare Workers deployed:** Verify the production Worker URL is pointed to by the form `action` attribute in HTML — not a localhost or staging URL left over from testing
- [ ] **HTTPS enabled:** "Enforce HTTPS" checkbox checked in GitHub Pages settings AND verified by loading `https://vbi.narenlife.com` in an incognito browser window without warnings
- [ ] **Social media links updated:** Each footer icon links to a real, currently-active VBI profile (not a placeholder `href="#"` or wrong account)
- [ ] **Schema.org structured data valid:** Events page JSON-LD validated through Google Rich Results Test — not just visually reviewed
- [ ] **Partner logos displaying correctly:** Each of the 8 logos has appropriate `alt` text, correct `width`/`height`, and renders without distortion on both desktop and mobile
- [ ] **PAT tokens revoked:** GitHub Personal Access Token used for initial deployment has been deleted from GitHub account settings
- [ ] **Form Worker CORS locked to production domain:** Worker's `Access-Control-Allow-Origin` is `https://vbi.narenlife.com`, not `*` or a development URL

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| API key committed to git | HIGH | Immediately rotate the key at the provider (Resend/SendGrid dashboard); force-push or use `git filter-repo` to scrub commit history; add key as wrangler secret instead |
| CNAME file overwritten — site down | MEDIUM | Re-add `CNAME` file to repo root with correct domain; push; re-enter custom domain in GitHub Pages settings; wait up to 24 hours for HTTPS re-provisioning |
| Transcript HTML injection corrupted pages | MEDIUM | Restore original episode pages from git history (`git checkout HEAD -- episodes/`); fix the injection script; rerun on a single page to verify before batch |
| Whisper batch failed mid-run | LOW | Check progress log for last successful episode; rerun script starting from the next episode; do not delete successfully completed transcripts |
| Worker returns CORS error on all submissions | LOW | Check Cloudflare dashboard Real-time Logs for actual error; add try/catch; redeploy; test with curl to verify Worker is returning valid JSON |
| HTTPS certificate stuck / not provisioning | LOW | Remove custom domain in GitHub Pages settings; wait 5 minutes; re-add; wait up to 24 hours |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| API secrets committed to git | Cloudflare Workers setup (pre-code) | `git grep` finds no API keys in any tracked file |
| Worker errors masquerade as CORS | Cloudflare Workers form endpoint build | curl test returns valid JSON; browser test confirms form submits successfully |
| CNAME file overwritten | Initial GitHub Pages deployment | `git log --oneline -- CNAME` shows file in latest commit; Pages settings shows green domain check |
| Whisper files exceed 25 MB | Podcast transcription (pre-download audit) | File size report shows all episodes under 25 MB, or oversized files re-encoded |
| Transcript HTML injection errors | Podcast transcription (single episode test) | 5 random episode pages pass HTML validation and render correctly in browser |
| Whisper hallucinations | Podcast transcription (QA review step) | Spot-check of 10 transcripts shows coherent opening paragraphs aligned to episode topic |
| GitHub Pages HTTPS not enabling | Initial deployment phase | `https://vbi.narenlife.com` loads in incognito with valid certificate; no mixed content warnings |
| OPTIONS pre-flight not handled | Cloudflare Workers form endpoint build | Browser Network tab shows OPTIONS returning 204 before POST |
| PAT tokens not revoked | Post-deployment cleanup phase | GitHub Settings > Developer settings shows no active PATs created for this deployment |

---

## Sources

- [OpenAI Whisper API speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text) — official file size limits, prompting guidance
- [OpenAI Whisper batch transcription discussion](https://github.com/openai/whisper/discussions/662) — batching behavior, sequential vs. chunked algorithms
- [Optimize Whisper AI for large batch audio transcription](https://prosperasoft.com/blog/openai/whisper-ai/whisper-batch-transcription/)
- [Whisper hallucinations and accuracy issues](https://brasstranscripts.com/blog/whisperx-vs-competitors-accuracy-benchmark)
- [WhisperX speaker diarization guide](https://brasstranscripts.com/blog/whisper-speaker-diarization-guide)
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) — module-level state, ctx pitfalls
- [Cloudflare Workers Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) — secrets vs. vars
- [Send Emails with Resend — Cloudflare Workers docs](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/)
- [Cloudflare Workers Rate Limiting GA](https://developers.cloudflare.com/changelog/post/2025-09-19-ratelimit-workers-ga/)
- [Building a contact form with Cloudflare Workers](https://www.coryd.dev/posts/2024/building-a-contact-form-with-a-cloudflare-worker)
- [Secure production contact form with Cloudflare Workers](https://medium.com/@philip.mutua/how-i-built-a-secure-production-ready-contact-form-api-using-cloudflare-workers-5a3b87e576c6)
- [Creating a Cloudflare Worker contact form — CORS debugging](https://www.flynsarmy.com/2020/04/creating-a-cloudflare-worker-contact-form/)
- [GitHub Pages — troubleshooting custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)
- [GitHub Pages — securing with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [GitHub Pages — managing custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Custom domain HTTPS not available discussion](https://github.com/orgs/community/discussions/184514)
- [Batch downloading and transcribing podcast episodes (2025)](https://hsu.cy/2025/08/poddl/)

---
*Pitfalls research for: VBI static site enhancement — Whisper transcription, Cloudflare Workers forms, GitHub Pages deployment*
*Researched: 2026-03-15*
