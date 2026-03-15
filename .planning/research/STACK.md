# Stack Research

**Domain:** Static site enhancement — podcast transcription, serverless form endpoints, structured data
**Researched:** 2026-03-15
**Confidence:** HIGH (all recommendations verified against official docs or PyPI)

---

## Context

The VBI site is already built: 114 static HTML files on GitHub Pages. This document covers only
the three new capability areas being added:

1. **Podcast transcription** — 101 Libsyn episodes transcribed locally via Whisper
2. **Form endpoints** — Contact, partner inquiry, newsletter via Cloudflare Workers + Resend
3. **Structured data** — schema.org Event JSON-LD on the events page

Nothing here requires a framework, build tool, or bundler. Each capability is self-contained.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| faster-whisper | 1.2.1 | Local audio-to-text transcription | 4x faster than openai/whisper at same accuracy via CTranslate2; no FFmpeg required (uses PyAV); supports 8-bit quantization to cut memory; VAD-based batching for bulk jobs |
| feedparser | 6.x | Parse Libsyn RSS feed to get episode audio URLs | Standard Python RSS parser; handles Libsyn's RSS format natively; extracts `enclosure` URLs (the direct audio file links) cleanly |
| requests | 2.x | Download audio files from traffic.libsyn.com | Standard HTTP; simpler than urllib for binary streaming downloads with progress |
| Wrangler CLI | 4.x (latest 4.73.0) | Deploy and manage Cloudflare Workers | Official Cloudflare CLI; v4 released March 13 2025; use `npm i wrangler@latest` per project |
| resend (npm) | latest | Send transactional email from Workers | Officially recommended by Cloudflare (replaces MailChannels free tier which ended Aug 2024); 3,000 emails/month free; simple SDK; 1 line to send |
| schema.org JSON-LD | N/A (inline script) | Event structured data on events page | Google-recommended format; `<script type="application/ld+json">` block; no library needed for static HTML |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tqdm | 4.x | Progress bars for batch transcription | Use in the transcription script to track progress across 101 episodes |
| python-dotenv | 1.x | Manage environment variables for the transcription script | Use if storing Libsyn slug or output path config outside the script |
| hono (npm) | 4.x | Lightweight Worker router | Use if the Worker needs to handle multiple form routes (contact, partner, newsletter) under one deployment; avoid if each Worker is a single-endpoint file |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Python 3.11 | Runtime for transcription pipeline | faster-whisper supports 3.9–3.11; avoid 3.12+ until CTranslate2 confirms support |
| Node.js 18+ LTS | Runtime for Wrangler CLI | Wrangler v4 requires Node >=16.17.0; use 18 LTS for stability |
| uv or pip + venv | Python dependency management | Create an isolated venv for the transcription pipeline to avoid polluting global env |
| Google Rich Results Test | Validate Event schema | https://search.google.com/test/rich-results — run after adding JSON-LD |

---

## Installation

```bash
# --- Python: Transcription pipeline ---
python3.11 -m venv .venv
source .venv/bin/activate

pip install faster-whisper feedparser requests tqdm

# --- Node: Cloudflare Workers ---
# Per-project install (Cloudflare's recommended approach)
npm init -y
npm install wrangler@latest resend
```

---

## Capability Breakdown

### 1. Podcast Transcription Pipeline

**Architecture:** Local Python script, run once, outputs 101 `.txt` transcript files.

**Flow:**
```
Libsyn RSS feed (feedparser) → audio URLs → requests download → faster-whisper transcribe → .txt file per episode
```

**Model choice:** Use `large-v3` for best accuracy. Whisper handles veterinary/business vocabulary
reasonably well zero-shot. The `turbo` variant is an option if the machine is CPU-only and time is
tight, but for a one-time batch job accuracy matters more than speed.

**Libsyn RSS URL for show 481140:**
```
https://feeds.libsyn.com/481140/rss
```
Alternatively the slug-based URL if known: `https://<slug>.libsyn.com/rss`. The numeric feed ID
form is more reliable for scripting. Verify by opening in browser first.

**Audio file location:** Episodes stream from `traffic.libsyn.com`. The RSS `<enclosure>` tag
contains the direct MP3 URL. Download each file, transcribe, delete the audio, keep the `.txt`.

**CPU vs GPU:** On Apple Silicon (M-series), faster-whisper runs via CPU path with good
performance. CUDA 12 + cuDNN 9 required for GPU acceleration on Linux/Windows.

---

### 2. Cloudflare Workers Form Endpoints

**Architecture:** Three Workers (or one Worker with routing), each accepts a POST with JSON body,
sends email via Resend, returns JSON.

**Email provider: Resend**
- Free tier: 3,000 emails/month — more than sufficient for contact/partner/newsletter volume
- MailChannels free tier ended August 31, 2024; new accounts require paid MailChannels API key
- Resend is now the path Cloudflare's own documentation points to
- DNS domain verification required (add TXT/SPF records in GoDaddy)

**Worker structure per form:**
```javascript
// wrangler.toml: set RESEND_API_KEY as a secret
// npx wrangler secret put RESEND_API_KEY

import { Resend } from 'resend';

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }
    // Parse body, send email, return JSON
  }
}
```

**CORS:** Must handle OPTIONS preflight explicitly. Set `Access-Control-Allow-Origin` to
`https://vbi.narenlife.com` (not `*`) for production — restricts submissions to the VBI domain.

**Deployment:** Each Worker gets a `*.workers.dev` URL. Point form `action` (or JS `fetch` target)
to that URL. No custom domain needed for Workers endpoints.

---

### 3. Schema.org Event Structured Data

**No library needed.** Embed a `<script type="application/ld+json">` block directly in the events
page HTML. JSON-LD keeps structured data separate from the visual HTML, which is Google's
recommended approach.

**Minimum required properties for Google Event rich results:**
- `@type: "Event"`
- `name`
- `startDate` (ISO 8601 with timezone, e.g., `2026-06-15T09:00-05:00`)
- `location` (Place with PostalAddress, or VirtualLocation for online events)
- `eventStatus` (`https://schema.org/EventScheduled`)
- `eventAttendanceMode`

**Validate with:** https://search.google.com/test/rich-results after deploying.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| faster-whisper | openai/whisper (original) | 4x slower, higher memory, requires FFmpeg system install; no practical advantage for a batch job |
| faster-whisper | OpenAI Whisper API ($0.006/min) | 101 episodes × ~30 min avg = ~$18 minimum; unnecessary cost for a one-time local job; also sends audio to OpenAI servers |
| faster-whisper | WhisperX | Adds speaker diarization and word-level timestamps; valuable for multi-speaker interviews but adds complexity (requires pyannote-audio, HuggingFace token); VBI podcasts are likely single-host monologue |
| Resend | MailChannels | Free tier ended Aug 2024; now requires paid account; 401 errors reported in 2025; community recommends Resend |
| Resend | Sendgrid / Amazon SES | Higher setup complexity, more credentials to manage; Resend has simpler SDK and Cloudflare native tutorial |
| feedparser | requests + xml.etree | feedparser handles RSS edge cases (malformed XML, encoding) automatically; no reason to parse raw XML manually |
| inline JSON-LD | Microdata | JSON-LD is Google's recommended format; Microdata embeds data in HTML attributes and is harder to maintain |
| inline JSON-LD | schema markup service/plugin | No CMS here; static HTML embeds are simpler and have no dependencies |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| MailChannels (free tier) | Free tier ended August 31, 2024; new accounts require paid API key; 401 errors being reported | Resend |
| openai-whisper (PyPI package) | 4x slower than faster-whisper; requires system FFmpeg; higher RAM usage; identical output quality | faster-whisper |
| Netlify Forms / Formspree / Basin | PROJECT.md explicitly prohibits third-party form services; must use Cloudflare Workers | Cloudflare Workers + Resend |
| React/Vue for form handling | No build toolchain exists; static HTML site; adding a JS framework for three form submissions is massive overkill | Vanilla `fetch()` in the existing js/main.js |
| Node.js transcription (whisper.node etc.) | Community wrappers lag behind Python releases; faster-whisper Python is the canonical maintained path | faster-whisper Python |
| Whisper `tiny` or `base` models | Accuracy suffers significantly on domain-specific vocabulary (veterinary business terms); accuracy loss not worth the speed gain for a one-time batch | `large-v3` |

---

## Stack Patterns by Variant

**If the host machine has a GPU (CUDA 12 + cuDNN 9):**
- Pass `device="cuda"` and `compute_type="float16"` to `faster-whisper.WhisperModel()`
- Expect 10–20x real-time transcription speed
- 101 episodes @ 30 min avg = ~50 hours audio = approximately 2-5 hours wall time on GPU

**If the host machine is CPU-only (including Apple Silicon M-series):**
- Pass `device="cpu"` and `compute_type="int8"` to reduce memory
- Expect ~1–2x real-time speed on Apple M2/M3
- 50 hours audio = estimate 50–100 hours wall time; run overnight in batches
- `large-v3` is still preferred; fall back to `turbo` only if runtime is unacceptable

**If the three forms need different recipient emails:**
- Deploy three separate Workers, each with its own `TO_EMAIL` environment variable
- Avoids routing logic complexity in a single Worker

**If the three forms can share one recipient email:**
- Deploy one Worker, use URL path routing (or a `formType` field in the POST body) to set the
  subject line; simpler infrastructure

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| faster-whisper 1.2.1 | Python 3.9–3.11 | Python 3.12 not confirmed; use 3.11 |
| faster-whisper 1.2.1 | ctranslate2 (bundled) | GPU: requires CUDA 12 + cuDNN 9 |
| wrangler 4.x | Node.js 18+ LTS | v4 released March 13, 2025; v3 supported until Q1 2026 |
| resend (npm) | Cloudflare Workers runtime | Use `import { Resend } from 'resend'`; no CommonJS require |

---

## Sources

- [faster-whisper PyPI](https://pypi.org/project/faster-whisper/) — version 1.2.1, Python requirements (HIGH confidence)
- [SYSTRAN/faster-whisper GitHub](https://github.com/SYSTRAN/faster-whisper) — architecture, quantization, batching details (HIGH confidence)
- [Cloudflare Workers: Send Emails with Resend](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/) — official tutorial, Resend as recommended email provider (HIGH confidence)
- [Resend Pricing](https://resend.com/pricing) — 3,000 emails/month free tier confirmed (HIGH confidence)
- [MailChannels free tier sunset announcement](https://blog.mailchannels.com/mailchannels-enables-free-email-sending-for-cloudflare-workers-customers/) — free tier ended Aug 31, 2024 (HIGH confidence)
- [Wrangler v4 changelog](https://developers.cloudflare.com/changelog/post/2025-03-13-wrangler-v4/) — v4.0.0 released March 13, 2025; latest 4.73.0 (HIGH confidence)
- [Cloudflare Workers CORS examples](https://developers.cloudflare.com/workers/examples/cors-header-proxy/) — OPTIONS preflight handling pattern (HIGH confidence)
- [Google Search: Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event) — required properties for rich results (HIGH confidence)
- [Schema.org Event type](https://schema.org/Event) — canonical property reference, V29.4 (HIGH confidence)
- [Schema.org PodcastEpisode type](https://schema.org/PodcastEpisode) — transcript via `text` property (MEDIUM confidence — no dedicated transcript property exists)
- [Libsyn RSS feed help](https://help.libsynsupport.com/hc/en-us/articles/360041220911-The-RSS-Feed) — RSS URL format and enclosure structure (HIGH confidence)
- [feedparser PyPI](https://pypi.org/project/feedparser/) — RSS parsing library, Libsyn compatibility (HIGH confidence)
- [Modal: Choosing Whisper variants](https://modal.com/blog/choosing-whisper-variants) — faster-whisper vs WhisperX comparison (MEDIUM confidence)

---

*Stack research for: VBI Website — podcast transcription, Cloudflare Workers forms, structured data*
*Researched: 2026-03-15*
