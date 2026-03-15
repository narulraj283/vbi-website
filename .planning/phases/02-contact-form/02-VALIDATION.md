---
phase: 2
slug: contact-form
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | curl + shell commands (static site + Cloudflare Worker) |
| **Config file** | none — manual curl commands |
| **Quick run command** | `curl -s -o /dev/null -w "%{http_code}" https://vbi.narenlife.com/contact/` |
| **Full suite command** | `curl -s -w "\n%{http_code}" -X POST https://vbi-contact-form.naren-ekwa.workers.dev -H "Content-Type: application/json" -H "Origin: https://vbi.narenlife.com" -d '{"name":"Suite Test","email":"test@example.com","subject":"general","message":"Full suite verification"}'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | FORM-01 | static | `grep "resend.emails.send" workers/contact/src/index.js` | Plan 01 Task 1 creates it | ⬜ pending |
| 02-01-02 | 01 | 1 | FORM-02 | static | `grep 'data-form="contact"' contact/index.html` | Plan 01 Task 2 creates it | ⬜ pending |
| 02-01-03 | 01 | 1 | FORM-03 | static | `grep 'form-feedback' js/main.js && grep 'form-error' js/main.js` | Plan 01 Task 3 creates it | ⬜ pending |
| 02-02-01 | 02 | 2 | FORM-02 | integration | `curl -s -X POST https://vbi-contact-form.naren-ekwa.workers.dev -H "Content-Type: application/json" -d '{"name":"Test","email":"t@t.com","subject":"general","message":"test"}'` | Deployed by Plan 02 Task 2 | ⬜ pending |
| 02-02-02 | 02 | 2 | FORM-03 | integration | `curl -s -X POST https://vbi-contact-form.naren-ekwa.workers.dev -H "Content-Type: application/json" -d '{"name":"","email":"","subject":"","message":""}' \| grep "All fields are required"` | Deployed by Plan 02 Task 2 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 infrastructure is satisfied by Plan 01 task execution:

- [x] Cloudflare Worker project scaffolded with wrangler (Plan 01 Task 1 creates `workers/contact/` project)
- [ ] Resend API key configured as Worker secret (Plan 02 Task 1 checkpoint — requires human action)
- [ ] Domain verified in Resend for sending (Plan 02 Task 1 checkpoint — requires human action)

No pre-existing test infrastructure is needed before plan execution. The Worker scaffold IS the test target, and it is created by Plan 01 Task 1. Integration tests (curl against live URL) become runnable after Plan 02 Task 2 deploys the Worker.

*Wave 0 is complete: all test scaffolds are created by plan tasks, not by a separate prerequisite.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email received in inbox | FORM-02 | Requires inbox access | Submit form, check recipient inbox within 30s |
| Success/error UI feedback | FORM-03 | Visual verification | Submit form, verify success message appears on page |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
