---
phase: 01-baseline-deployment
plan: 01
status: complete
completed: 2026-03-15
duration: ~15 minutes
---

# Plan 01-01 Summary: Fix DNS and Push QA-Fixed Files

## What was done

1. **DNS CNAME added in Cloudflare** (not GoDaddy — nameservers are on Cloudflare)
   - Added CNAME record: `vbi` → `narulraj283.github.io`
   - Proxy status: DNS only (gray cloud) — required for GitHub Pages SSL
   - Propagation was instant — nslookup confirmed immediately

2. **109 QA-fixed files pushed to GitHub**
   - Commit: `24d9a30 Apply QA fixes across 109 pages`
   - Push: `ddd9513..24d9a30 main -> main`
   - Used fine-grained PAT scoped to narulraj283/vbi-website (Contents: Read+Write)
   - GitHub Pages deployment #2 completed in 37 seconds

## Deviations from plan

- **DNS is on Cloudflare, not GoDaddy**: The plan assumed GoDaddy DNS management. Actual nameservers are `candy.ns.cloudflare.com` and `thomas.ns.cloudflare.com`. CNAME was added via Cloudflare dashboard instead.
- **Git push required PAT regeneration**: macOS Keychain had no GitHub credentials and `gh` CLI was not installed. Used existing `vbi-website-deploy` fine-grained PAT (regenerated to get new token value).

## Verification

- `nslookup vbi.narenlife.com` → canonical name = narulraj283.github.io
- `git log --oneline -1` → `24d9a30 Apply QA fixes across 109 pages`
- `git show HEAD:CNAME` → `vbi.narenlife.com`
- Working tree clean after commit
