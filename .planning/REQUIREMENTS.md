# Requirements: VBI Website

**Defined:** 2026-03-15
**Core Value:** Deliver A+ quality content that practice owners, veterinarians, and practice managers love — and that industry experts recognize as top-tier

## v1 Requirements

Requirements for site completion. Each maps to roadmap phases.

### Deployment

- [ ] **DEPL-01**: Push 109 QA-fixed files to GitHub (canonical URLs, rel=noopener, navigation fixes, favicon, meta tags)
- [ ] **DEPL-02**: Enable HTTPS on GitHub Pages for vbi.narenlife.com with valid SSL certificate
- [ ] **DEPL-03**: Verify CNAME file preserved after push (vbi.narenlife.com domain stays active)
- [ ] **DEPL-04**: Clean up PAT tokens after successful deployment

### Forms

- [ ] **FORM-01**: User can submit contact form with name, email, subject, and message fields
- [ ] **FORM-02**: Contact form sends email notification to configured recipient via Cloudflare Worker + Resend
- [ ] **FORM-03**: User sees success/error feedback after form submission (no silent failures)
- [ ] **FORM-04**: User can submit partner inquiry form with business name, contact info, and inquiry details
- [ ] **FORM-05**: Partner inquiry form routes to configured recipient via separate Cloudflare Worker
- [ ] **FORM-06**: User can sign up for newsletter with email address
- [ ] **FORM-07**: Newsletter signup sends double opt-in confirmation email via Cloudflare Worker + Resend
- [ ] **FORM-08**: All forms protected against spam via Cloudflare Turnstile + honeypot field
- [ ] **FORM-09**: All forms rate-limited (5 submissions per IP per hour)
- [ ] **FORM-10**: Form Worker secrets stored via wrangler secret (never in wrangler.toml or repo)

### Podcast Transcription

- [ ] **PODC-01**: All 101 podcast episodes transcribed from Libsyn audio using faster-whisper
- [ ] **PODC-02**: Transcripts displayed inline on each episode page (not download-only)
- [ ] **PODC-03**: Transcripts include speaker labels (Host/Guest format) for multi-speaker episodes
- [ ] **PODC-04**: Transcripts HTML-escaped and safely injected via BeautifulSoup (no XSS risk)
- [ ] **PODC-05**: VAD pre-filtering enabled to prevent Whisper hallucinations on silence/music
- [ ] **PODC-06**: Transcription pipeline validates output on 1 episode before batch-processing all 101

### Structured Data

- [ ] **SCHM-01**: Events page has valid schema.org Event JSON-LD markup (name, startDate, location)
- [ ] **SCHM-02**: Podcast hub page has valid schema.org PodcastSeries JSON-LD markup
- [ ] **SCHM-03**: Each of 101 episode pages has valid schema.org PodcastEpisode JSON-LD markup
- [ ] **SCHM-04**: Each PodcastEpisode references PodcastSeries via partOfSeries property
- [ ] **SCHM-05**: All structured data passes Google Rich Results Test validation

### Assets & Content

- [ ] **ASST-01**: Partners page displays 8 real partner logos (SVG or PNG with alt text)
- [ ] **ASST-02**: About page displays Naren Arulrajah's professional headshot
- [ ] **ASST-03**: Footer social media icons link to verified, active VBI profiles (Twitter/X, LinkedIn, Instagram, Facebook)
- [ ] **ASST-04**: All images have proper alt text, dimensions, and are optimized for web

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Podcast Enhancements

- **PODC-07**: Timestamped transcript navigation — clicking timestamp jumps to audio moment
- **PODC-08**: Key takeaways block above transcript for each episode
- **PODC-09**: Transcript sections with H2 headings for topic segmentation
- **PODC-10**: Apple Podcasts link on each episode page and hub page

### Content Enhancements

- **CONT-01**: Event schema with subEvent support for multi-session events

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Site redesign or rebuild | Existing 114-file static site is the foundation — enhance, don't replace |
| CMS or admin interface | Static HTML is the architecture; no recurring content editing needed |
| Mobile app | Web only for this milestone |
| E-commerce / payments | Not part of VBI's current needs |
| Third-party form services (Formspree, Netlify) | Cloudflare Workers is the decided backend — keeps infra unified |
| Transcript PDF downloads | No SEO value; W3C WAI recommends inline HTML over downloadable |
| Live social media feed widgets | Privacy concerns, breaks frequently, degrades page speed |
| Auto-generated show notes | Quality too inconsistent without human review; reputational risk |
| Collapsible/accordion transcripts | Hides content from search crawlers; undermines SEO value |
| reCAPTCHA v2 checkbox | Accessibility barrier; uses Cloudflare Turnstile instead |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPL-01 | Phase 1 | Pending |
| DEPL-02 | Phase 1 | Pending |
| DEPL-03 | Phase 1 | Pending |
| DEPL-04 | Phase 1 | Pending |
| FORM-01 | Phase 2 | Pending |
| FORM-02 | Phase 2 | Pending |
| FORM-03 | Phase 2 | Pending |
| FORM-04 | Phase 3 | Pending |
| FORM-05 | Phase 3 | Pending |
| FORM-06 | Phase 4 | Pending |
| FORM-07 | Phase 4 | Pending |
| FORM-08 | Phase 5 | Pending |
| FORM-09 | Phase 5 | Pending |
| FORM-10 | Phase 5 | Pending |
| PODC-01 | Phase 7 | Pending |
| PODC-02 | Phase 7 | Pending |
| PODC-03 | Phase 6 | Pending |
| PODC-04 | Phase 6 | Pending |
| PODC-05 | Phase 6 | Pending |
| PODC-06 | Phase 6 | Pending |
| SCHM-01 | Phase 8 | Pending |
| SCHM-02 | Phase 9 | Pending |
| SCHM-03 | Phase 9 | Pending |
| SCHM-04 | Phase 9 | Pending |
| SCHM-05 | Phase 9 | Pending |
| ASST-01 | Phase 10 | Pending |
| ASST-02 | Phase 10 | Pending |
| ASST-03 | Phase 10 | Pending |
| ASST-04 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after roadmap creation — traceability updated to fine-grained 10-phase structure*
