# VBI Website — Completion & Enhancement

## What This Is

The Veterinary Business Institute (VBI) website — a professional web presence for VBI featuring a homepage, about page, membership info, partner directory, events, contact page, podcast hub with 101 episode pages, and supporting infrastructure. The site is live at vbi.narenlife.com on GitHub Pages. It needs QA fixes pushed, HTTPS enabled, podcast episodes transcribed, form endpoints built, real assets integrated, and structured data added.

## Core Value

The VBI website must present VBI as a credible, professional institute for veterinary business education — every page must work, look polished, and serve its purpose.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Push 109 QA-fixed files to GitHub (canonical URLs, rel=noopener, navigation fixes, favicon, meta tags)
- [ ] Enable HTTPS on GitHub Pages for vbi.narenlife.com
- [ ] Clean up PAT tokens after deployment
- [ ] Transcribe all 101 podcast episodes using Whisper (audio from Libsyn)
- [ ] Add transcripts to each podcast episode page
- [ ] Build contact form endpoint via Cloudflare Workers
- [ ] Build partner inquiry form endpoint via Cloudflare Workers
- [ ] Build newsletter signup endpoint via Cloudflare Workers
- [ ] Add real social media links to footer icons (Twitter, LinkedIn, Instagram, Facebook)
- [ ] Replace 8 partner logo placeholders with real logos on partners page
- [ ] Add Naren Arulrajah's headshot to the about page
- [ ] Add schema.org Event structured data to events page

### Out of Scope

- Redesign or rebuild from scratch — existing 114-file static site is the foundation
- CMS or dynamic backend — site stays static HTML on GitHub Pages
- Mobile app — web only
- E-commerce or payment processing — not part of VBI's current needs
- Blog/content management system — static pages are sufficient

## Context

- **Existing site:** 114 HTML files, css/style.css (1498 lines), js/main.js (687 lines)
- **Hosting:** GitHub Pages (narulraj283/vbi-website repo, main branch), custom domain vbi.narenlife.com
- **DNS:** GoDaddy, CNAME record "vbi" pointing to narulraj283.github.io
- **Backend infra:** Cloudflare (will host form Workers)
- **Podcast:** 101 episodes on Libsyn (show ID: 481140), audio at traffic.libsyn.com
- **Apple Podcasts ID:** 1712053291
- **Brand:** Teal #0D7377, Navy #1B2A4A, Orange #E8913A, Light BG #F0F7F7, Inter + Playfair Display fonts
- **Only promotional link allowed:** ekwa.com/msm (marketing strategy meeting)
- **Founder:** Naren Arulrajah, CEO of Ekwa.com — headshot to be sourced from web (with approval)
- **QA audit:** 34 issues found, all 109 files fixed locally but not yet pushed
- **GitHub repo ID:** 1173087644
- **Source repo path:** ~/Documents/Claude/AnjaleeClaude/VBI/02-Website/vbi-repo/

## Constraints

- **Hosting:** GitHub Pages (static only) — no server-side rendering
- **Forms:** Must use Cloudflare Workers — no third-party form services
- **Brand:** Must follow VBI brand guidelines (colors, fonts, ekwa.com/msm as only promo link)
- **Quality:** Everything must be A+ quality — this represents a professional institute
- **Assets:** Partner logos and Naren's photo need to be sourced/confirmed before integration
- **Email:** Form submission recipient email TBD — will be provided when forms are built

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep static HTML on GitHub Pages | Existing 114-file site is complete and functional | — Pending |
| Cloudflare Workers for forms | Already using Cloudflare for backend, keeps infra unified | — Pending |
| Whisper for podcast transcription | Industry standard for audio-to-text, handles 101 episodes | — Pending |
| All 101 transcripts are must-have | Complete podcast archive is core to VBI's content value | — Pending |

---
*Last updated: 2026-03-15 after initialization*
