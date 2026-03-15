---
phase: 2
slug: contact-form
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | curl + shell scripts (static site + Cloudflare Worker) |
| **Config file** | none — manual curl commands |
| **Quick run command** | `curl -s -o /dev/null -w "%{http_code}" https://vbi.narenlife.com/contact/` |
| **Full suite command** | `bash .planning/phases/02-contact-form/test-contact.sh` |
| **Estimated runtime** | ~10 seconds |

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
| 02-01-01 | 01 | 1 | FORM-01 | integration | `curl -X POST Worker-URL` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | FORM-02 | integration | `curl + check email delivery` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | FORM-03 | integration | `curl + check response body` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Cloudflare Worker project scaffolded with wrangler
- [ ] Resend API key configured as Worker secret
- [ ] Domain verified in Resend for sending

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email received in inbox | FORM-02 | Requires inbox access | Submit form, check recipient inbox within 30s |
| Success/error UI feedback | FORM-03 | Visual verification | Submit form, verify success message appears on page |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
