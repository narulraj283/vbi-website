# Roadmap: VBI Website — Completion & Enhancement

## Overview

The VBI site is a complete 114-file static HTML site on GitHub Pages that needs four focused capability additions pushed to production: a stable HTTPS-enabled deployment baseline, three working form endpoints via Cloudflare Workers, podcast transcripts for all 101 Libsyn episodes, and schema.org structured data for events and podcast content. The roadmap progresses from deployment foundation through form-by-form delivery, transcription pipeline then batch, structured data by page type, and finally external asset integration. Everything is independently verifiable at each phase boundary.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Baseline Deployment** - Push 109 QA-fixed files and enable HTTPS on vbi.narenlife.com
- [ ] **Phase 2: Contact Form** - Build and deploy contact form Cloudflare Worker with email delivery
- [ ] **Phase 3: Partner Inquiry Form** - Build and deploy partner inquiry Cloudflare Worker
- [ ] **Phase 4: Newsletter Signup Form** - Build and deploy newsletter Worker with double opt-in
- [ ] **Phase 5: Form Security Infrastructure** - Spam protection, rate limiting, and secrets management across all forms
- [ ] **Phase 6: Transcription Pipeline** - Build faster-whisper pipeline with VAD, speaker labels, and single-episode validation
- [ ] **Phase 7: Batch Transcript Injection** - Transcribe all 101 episodes and inject transcripts into episode HTML pages
- [ ] **Phase 8: Events Structured Data** - Add schema.org Event JSON-LD to events page
- [ ] **Phase 9: Podcast Structured Data** - Add PodcastSeries and PodcastEpisode JSON-LD to hub and all 101 episode pages
- [ ] **Phase 10: Assets & Content** - Integrate real partner logos, founder headshot, and social media footer links

## Phase Details

### Phase 1: Baseline Deployment
**Goal**: The live site at https://vbi.narenlife.com serves all 109 QA-fixed pages over HTTPS with a valid SSL certificate and the custom domain intact
**Depends on**: Nothing (first phase)
**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04
**Success Criteria** (what must be TRUE):
  1. Visiting https://vbi.narenlife.com shows a padlock in the browser — no mixed content warnings
  2. All QA fixes are live: canonical URLs resolve correctly, rel=noopener on external links, favicon visible, navigation links work
  3. The custom domain vbi.narenlife.com continues to serve the site after the push (CNAME not overwritten)
  4. GitHub Pages Settings shows the custom domain with a green "DNS check successful" status
  5. PAT tokens used for deployment have been rotated or revoked
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Fix DNS and push 109 QA-fixed files to GitHub
- [x] 01-02-PLAN.md — Enable HTTPS and clean up PAT tokens

### Phase 2: Contact Form
**Goal**: Visitors to the contact page can send a message and receive feedback confirming delivery
**Depends on**: Phase 1
**Requirements**: FORM-01, FORM-02, FORM-03
**Success Criteria** (what must be TRUE):
  1. A visitor can fill out name, email, subject, and message fields and submit the contact form
  2. The configured recipient receives an email notification with the submitted content within seconds
  3. The visitor sees a clear success message after submission — no silent failures or blank screen
  4. If the Worker or email delivery fails, the visitor sees a specific error message (not a success message)
**Plans**: 2 plans
Plans:
- [ ] 02-01-PLAN.md — Create Worker project and update contact page HTML/JS for form submission
- [ ] 02-02-PLAN.md — Deploy Worker, configure Resend, and verify end-to-end email delivery

### Phase 3: Partner Inquiry Form
**Goal**: Prospective partners can submit a business inquiry that routes to a separate recipient inbox
**Depends on**: Phase 1
**Requirements**: FORM-04, FORM-05
**Success Criteria** (what must be TRUE):
  1. A visitor can fill out business name, contact info, and inquiry details on the partner page and submit
  2. The partner inquiry is delivered to the configured recipient via its own dedicated Cloudflare Worker
  3. Partner inquiries do not arrive mixed with general contact messages — they are routed separately
**Plans**: 2 plans
Plans:
- [ ] 03-01-PLAN.md — Create Partner Worker project and update partners page HTML/JS for form submission
- [ ] 03-02-PLAN.md — Deploy Partner Worker, configure secrets, and verify end-to-end email delivery

### Phase 4: Newsletter Signup Form
**Goal**: Visitors can subscribe to the VBI newsletter and receive a double opt-in confirmation email
**Depends on**: Phase 1
**Requirements**: FORM-06, FORM-07
**Success Criteria** (what must be TRUE):
  1. A visitor can enter their email address and submit the newsletter signup form
  2. The subscriber receives a double opt-in confirmation email within seconds of submitting
  3. The signup form provides feedback (success or error) after submission — never silent
**Plans**: 2 plans
Plans:
- [ ] 04-01-PLAN.md — Create newsletter Worker with double opt-in and update homepage footer form
- [ ] 04-02-PLAN.md — Deploy newsletter Worker, configure Resend audience, and verify end-to-end double opt-in

### Phase 5: Form Security Infrastructure
**Goal**: All three form Workers are protected against spam and abuse, with credentials stored securely
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: FORM-08, FORM-09, FORM-10
**Success Criteria** (what must be TRUE):
  1. Each form is protected by Cloudflare Turnstile and a honeypot field — bots are rejected before email delivery
  2. Each Worker enforces rate limiting: no single IP can submit more than 5 times per hour
  3. All Worker secrets (API keys, recipient emails) are stored via wrangler secret — not visible in wrangler.toml, source code, or git history
**Plans**: TBD

### Phase 6: Transcription Pipeline
**Goal**: A working, validated transcription pipeline that correctly processes one episode end-to-end before batch runs
**Depends on**: Phase 1
**Requirements**: PODC-03, PODC-04, PODC-05, PODC-06
**Success Criteria** (what must be TRUE):
  1. The pipeline downloads audio from a Libsyn episode URL, transcribes it with faster-whisper, and produces a clean HTML transcript
  2. The transcript output on the test episode includes Host/Guest speaker labels for multi-speaker segments
  3. VAD pre-filtering is active — the pipeline does not hallucinate text over silence or music intros
  4. Transcript text is HTML-escaped via BeautifulSoup before injection — no raw user content reaches the page
  5. The single-episode validation run completes without errors and the resulting episode page renders correctly in a browser
**Plans**: TBD

### Phase 7: Batch Transcript Injection
**Goal**: All 101 VBI podcast episode pages display inline transcripts sourced from Libsyn audio
**Depends on**: Phase 6
**Requirements**: PODC-01, PODC-02
**Success Criteria** (what must be TRUE):
  1. All 101 episode pages on the live site display a transcript section inline — not as a downloadable file
  2. Every transcript is readable without JavaScript — the content is baked into the HTML
  3. No episode page is broken or malformed after transcript injection — all 101 pages load and render correctly
**Plans**: TBD

### Phase 8: Events Structured Data
**Goal**: The VBI events page is eligible for Google rich results via valid schema.org Event markup
**Depends on**: Phase 1
**Requirements**: SCHM-01
**Success Criteria** (what must be TRUE):
  1. The events page `<head>` contains a `<script type="application/ld+json">` block with valid schema.org Event markup
  2. The Event JSON-LD includes at minimum: name, startDate, and location for each event
  3. The events page passes Google Rich Results Test validation with no errors
**Plans**: TBD

### Phase 9: Podcast Structured Data
**Goal**: The podcast hub and all 101 episode pages carry valid schema.org JSON-LD making the VBI podcast eligible for Google podcast rich results
**Depends on**: Phase 7, Phase 8
**Requirements**: SCHM-02, SCHM-03, SCHM-04, SCHM-05
**Success Criteria** (what must be TRUE):
  1. The podcast hub page `<head>` contains a valid PodcastSeries JSON-LD block with series name, description, and URL
  2. Each of the 101 episode pages contains a valid PodcastEpisode JSON-LD block with episode name, date published, and audio URL
  3. Every PodcastEpisode JSON-LD includes a `partOfSeries` property referencing the PodcastSeries
  4. A sample of episode pages passes Google Rich Results Test validation — no errors on tested pages
**Plans**: TBD

### Phase 10: Assets & Content
**Goal**: All visible placeholder content is replaced with real assets — partner logos, founder headshot, and working social media links
**Depends on**: Phase 1
**Requirements**: ASST-01, ASST-02, ASST-03, ASST-04
**Success Criteria** (what must be TRUE):
  1. The partners page shows 8 real partner logos (SVG or PNG) with descriptive alt text — no placeholder boxes
  2. The about page shows Naren Arulrajah's professional headshot (not a placeholder or missing image)
  3. The four footer social icons (Twitter/X, LinkedIn, Instagram, Facebook) link to verified, active VBI profiles — not `#`
  4. All new images have explicit width/height attributes, appropriate alt text, and are optimized for web delivery
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Baseline Deployment | 2/2 | Complete | 2026-03-15 |
| 2. Contact Form | 1/2 | In Progress|  |
| 3. Partner Inquiry Form | 0/2 | Not started | - |
| 4. Newsletter Signup Form | 0/2 | Not started | - |
| 5. Form Security Infrastructure | 0/TBD | Not started | - |
| 6. Transcription Pipeline | 0/TBD | Not started | - |
| 7. Batch Transcript Injection | 0/TBD | Not started | - |
| 8. Events Structured Data | 0/TBD | Not started | - |
| 9. Podcast Structured Data | 0/TBD | Not started | - |
| 10. Assets & Content | 0/TBD | Not started | - |
