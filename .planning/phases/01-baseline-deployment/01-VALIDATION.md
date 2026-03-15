---
phase: 1
slug: baseline-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (no test framework — static HTML site) |
| **Config file** | none |
| **Quick run command** | `curl -sI https://vbi.narenlife.com \| head -5` |
| **Full suite command** | `curl -sI https://vbi.narenlife.com && nslookup vbi.narenlife.com && git -C ~/Documents/Claude/AnjaleeClaude/VBI/02-Website/vbi-repo log --oneline -1` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `curl -sI https://vbi.narenlife.com | head -5`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must show HTTPS 200 + correct DNS
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | DEPL-01 | manual | `git -C ~/Documents/Claude/AnjaleeClaude/VBI/02-Website/vbi-repo log --oneline -1` | N/A | ⬜ pending |
| 1-01-02 | 01 | 1 | DEPL-03 | manual | `git -C ~/Documents/Claude/AnjaleeClaude/VBI/02-Website/vbi-repo show HEAD:CNAME` | N/A | ⬜ pending |
| 1-02-01 | 02 | 2 | DEPL-02 | cli | `curl -sI https://vbi.narenlife.com \| grep -i "HTTP/"` | N/A | ⬜ pending |
| 1-02-02 | 02 | 2 | DEPL-02 | cli | `nslookup vbi.narenlife.com` | N/A | ⬜ pending |
| 1-03-01 | 03 | 3 | DEPL-04 | manual | Verify PAT tokens deleted in GitHub settings | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework needed — Phase 1 is deployment ops verified via CLI tools (curl, nslookup, git).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HTTPS padlock visible | DEPL-02 | Browser UI check — cannot automate padlock icon | Open https://vbi.narenlife.com in Chrome, verify padlock in address bar |
| GitHub Pages DNS green check | DEPL-03 | GitHub Settings UI | Visit github.com/narulraj283/vbi-website/settings/pages, verify green "DNS check successful" |
| PAT token revoked | DEPL-04 | GitHub Settings UI | Visit github.com/settings/personal-access-tokens, confirm token deleted |
| No mixed content warnings | DEPL-02 | Browser console check | Open DevTools Console on https://vbi.narenlife.com, verify no mixed content warnings |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
