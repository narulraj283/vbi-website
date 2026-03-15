---
phase: 01-baseline-deployment
plan: 02
status: complete
completed: 2026-03-15
duration: ~5 minutes
---

# Plan 01-02 Summary: Enable HTTPS and Clean Up PAT

## What was done

1. **HTTPS verified and Enforce HTTPS enabled**
   - `curl -sI https://vbi.narenlife.com` → HTTP/2 200
   - GitHub Pages Settings → "Enforce HTTPS" checkbox checked (was unchecked)
   - `curl -sI http://vbi.narenlife.com` → 301 Moved Permanently → https://vbi.narenlife.com/
   - No mixed content (0 non-w3.org http:// references)
   - QA fixes confirmed live (canonical URLs, rel="noopener" on episode pages)

2. **PAT token revoked**
   - Deleted `vbi-website-deploy` fine-grained PAT from github.com/settings/personal-access-tokens
   - Confirmed deletion — token no longer appears in list

## Verification

All Phase 1 acceptance criteria met:

| Check | Result |
|-------|--------|
| HTTPS loads | HTTP/2 200 |
| HTTP redirects | 301 → https |
| Mixed content | 0 |
| QA fixes live | canonical + noopener confirmed |
| DNS correct | vbi.narenlife.com → narulraj283.github.io |
| Enforce HTTPS | Checked with green checkmark |
| PAT cleanup | Token deleted |
