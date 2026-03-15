# Phase 1: Baseline Deployment - Research

**Researched:** 2026-03-15
**Domain:** GitHub Pages deployment, custom domain DNS, HTTPS/SSL provisioning, git push authentication
**Confidence:** HIGH

## Summary

Phase 1 pushes 109 QA-fixed HTML files to the existing GitHub Pages repository at `narulraj283/vbi-website`, ensures the custom domain `vbi.narenlife.com` resolves correctly with HTTPS, and cleans up authentication tokens afterward. The repo already has one commit on `main` with the original site, and the CNAME file exists locally with the correct contents. All 109 modifications are currently unstaged in the working tree.

**Critical finding during research:** DNS lookup for `vbi.narenlife.com` currently returns **NXDOMAIN** -- the GoDaddy CNAME record for the `vbi` subdomain is missing or misconfigured. The parent domain `narenlife.com` resolves (to `172.64.80.1`), and GitHub Pages IS configured with the custom domain (visiting `narulraj283.github.io/vbi-website/` redirects to `http://vbi.narenlife.com`), but without a working CNAME record at GoDaddy, HTTPS provisioning cannot start. This DNS issue is the first thing that must be resolved.

**Primary recommendation:** Fix the GoDaddy DNS CNAME record first, then push 109 files in a single commit preserving the CNAME file, wait for GitHub Pages to detect the push and provision an SSL certificate, enable "Enforce HTTPS", and finally revoke any PAT token used.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPL-01 | Push 109 QA-fixed files to GitHub (canonical URLs, rel=noopener, navigation fixes, favicon, meta tags) | Git status confirms exactly 109 modified files (3,276 insertions, 2,845 deletions). Push requires authentication via macOS Keychain credential or PAT. Single commit on main branch triggers GitHub Pages rebuild. |
| DEPL-02 | Enable HTTPS on GitHub Pages for vbi.narenlife.com with valid SSL certificate | DNS currently broken (NXDOMAIN). GoDaddy CNAME record must point `vbi` to `narulraj283.github.io`. After DNS propagation (5-60 min), GitHub auto-provisions Let's Encrypt cert. "Enforce HTTPS" checkbox becomes available up to 1 hour after DNS check passes. |
| DEPL-03 | Verify CNAME file preserved after push (vbi.narenlife.com domain stays active) | CNAME file exists in local repo with correct content (`vbi.narenlife.com`). Must be included in the commit. Verify after push via GitHub Pages Settings showing green "DNS check successful". |
| DEPL-04 | Clean up PAT tokens after successful deployment | If a PAT is created for the push, it must be revoked at github.com/settings/tokens after successful deployment. If macOS Keychain credential is already valid, no new PAT may be needed. |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| git | system | Version control, push to GitHub | Already installed, repo already initialized |
| GitHub Pages | N/A | Static site hosting | Already configured, deploying from main at root |
| Let's Encrypt (via GitHub) | N/A | SSL certificate | Automatic when custom domain DNS is correct |
| GoDaddy DNS | N/A | CNAME record for subdomain | Domain registrar already in use for narenlife.com |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| curl | system | Verify HTTPS and site availability | Post-deployment verification |
| nslookup/dig | system | DNS verification | Before and after CNAME configuration |
| macOS Keychain | system | Git credential storage | Already configured as git credential helper |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| macOS Keychain auth | PAT token in URL | PAT requires creation, rotation, and revocation -- Keychain is simpler if credentials exist |
| gh CLI auth | manual git push | gh CLI is not installed; installing it adds unnecessary scope for a one-time push |

**No installation needed** -- all tools are already available on the system.

## Architecture Patterns

### Recommended Deployment Flow
```
1. Fix DNS (GoDaddy)     --> CNAME vbi -> narulraj283.github.io
2. Wait for propagation  --> nslookup vbi.narenlife.com returns narulraj283.github.io
3. git add + commit      --> Single commit with all 109 files
4. git push origin main  --> Triggers GitHub Pages rebuild
5. Verify CNAME intact   --> GitHub Settings > Pages shows green checkmark
6. Enable HTTPS          --> Check "Enforce HTTPS" checkbox
7. Verify padlock        --> curl -sI https://vbi.narenlife.com shows 200 + valid cert
8. Revoke PAT            --> If one was created
```

### Pattern 1: Single Atomic Commit for All QA Fixes
**What:** Stage and commit all 109 modified files in one commit, then push
**When to use:** When all changes are part of a single logical unit (QA fixes applied together)
**Why:** Keeps git history clean; makes rollback trivial (`git revert` one commit); avoids partial deployment states

### Pattern 2: DNS-First, Push-Second
**What:** Ensure DNS is resolving before pushing code changes
**When to use:** When GitHub Pages custom domain and HTTPS are requirements
**Why:** GitHub Pages checks DNS when the custom domain is set. If DNS resolves correctly before the push, the SSL certificate provisioning starts immediately after deploy. If DNS is broken, HTTPS enablement is blocked indefinitely.

### Anti-Patterns to Avoid
- **Pushing without verifying CNAME is in the commit:** The CNAME file must be part of the committed files. If it's missing from the local working tree, `git push` will remove it from the remote, breaking the custom domain.
- **Force-pushing or resetting:** There's one commit of history. A force push risks losing the CNAME file or the existing commit. Use a normal `git add` + `git commit` + `git push`.
- **Creating a PAT with broad scopes:** If a PAT is needed, scope it to `repo` only. Do not grant `admin:org`, `delete_repo`, or other unnecessary permissions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSL certificate | Manual cert generation or Cloudflare proxy | GitHub Pages built-in Let's Encrypt | Automatic, free, no maintenance, renews automatically |
| DNS verification | Manual dig commands with custom scripts | GitHub Pages Settings DNS check indicator | Green checkmark is the authoritative status |
| Credential management | Storing PAT in env vars or files | macOS Keychain (already configured) | Secure, automatic, system-integrated |

## Common Pitfalls

### Pitfall 1: CNAME File Overwritten or Missing After Push
**What goes wrong:** The push removes the CNAME file from the remote repo, causing GitHub Pages to lose the custom domain configuration. The site stops serving at `vbi.narenlife.com`.
**Why it happens:** The CNAME file was added via GitHub UI and exists only on the remote. If the local repo was cloned before the CNAME was added, or a force push overwrites it, it disappears.
**How to avoid:** The CNAME file already exists in the local working tree with correct content (`vbi.narenlife.com`). Verify it is tracked by git and included in the commit. After pushing, check GitHub Settings > Pages for the green domain checkmark.
**Warning signs:** `git status` does not show CNAME as tracked. GitHub Pages Settings shows empty custom domain field after push.

### Pitfall 2: DNS Not Resolving (NXDOMAIN) -- ACTIVE RIGHT NOW
**What goes wrong:** `vbi.narenlife.com` returns NXDOMAIN. GitHub Pages cannot verify the domain, cannot provision SSL, and "Enforce HTTPS" remains grayed out indefinitely.
**Why it happens:** The CNAME record at GoDaddy for the `vbi` subdomain is missing or misconfigured. Confirmed during research: `nslookup vbi.narenlife.com` returns `NXDOMAIN` as of 2026-03-15.
**How to avoid:** Log into GoDaddy DNS management for `narenlife.com`. Add (or fix) a CNAME record: Host = `vbi`, Points to = `narulraj283.github.io`. TTL can be default (1 hour). Wait 5-60 minutes for propagation. Verify with `nslookup vbi.narenlife.com`.
**Warning signs:** `nslookup vbi.narenlife.com` returns NXDOMAIN or SERVFAIL.

### Pitfall 3: "Enforce HTTPS" Checkbox Grayed Out
**What goes wrong:** DNS check passes (green checkmark) but HTTPS toggle remains unavailable. The site serves over HTTP only.
**Why it happens:** Let's Encrypt certificate provisioning is queued but not yet complete. Can take up to 1 hour. Can also be caused by: conflicting A/AAAA records alongside the CNAME, CAA records that don't permit `letsencrypt.org`, or a stuck provisioning job.
**How to avoid:** After DNS check shows green, wait up to 1 hour. If still grayed out: remove custom domain from Pages settings, wait 30 seconds, re-add it. This restarts the certificate provisioning. Check for conflicting DNS records at GoDaddy (no A records for the `vbi` subdomain should exist).
**Warning signs:** "Enforce HTTPS" says "Not yet available for your site" for more than 1 hour after green DNS check.

### Pitfall 4: Mixed Content Warnings After HTTPS
**What goes wrong:** HTTPS is enabled but the browser shows warnings or no padlock because the HTML references HTTP resources (images, scripts, stylesheets).
**Why it happens:** Hardcoded `http://` URLs in HTML files for assets, links, or embedded content.
**How to avoid:** The 109 QA-fixed files should already use relative URLs or `https://` for external resources. Verify with: open the site in Chrome, check Console for "Mixed Content" warnings. The canonical URLs in the QA fixes should already point to `https://vbi.narenlife.com/`.
**Warning signs:** Browser address bar shows "Not Secure" or broken padlock icon despite HTTPS being enabled.

### Pitfall 5: Git Push Authentication Failure
**What goes wrong:** `git push` fails with 403 Forbidden or authentication prompt.
**Why it happens:** No valid credential in macOS Keychain for `github.com`, or an expired/revoked token.
**How to avoid:** Try `git push` first -- if macOS Keychain has a valid credential, it will work without prompting. If it fails: create a fine-grained PAT at github.com/settings/tokens with `repo` scope only, and use it when prompted. The `osxkeychain` credential helper will cache it automatically.
**Warning signs:** `git push` prompts for username/password or returns 403.

## Code Examples

### Verify DNS Resolution Before Proceeding
```bash
# Must return narulraj283.github.io (or its IP) -- NOT NXDOMAIN
nslookup vbi.narenlife.com
# Expected: Non-authoritative answer showing CNAME to narulraj283.github.io
```

### Stage and Push All QA Fixes
```bash
cd ~/AnjaleeClaude/VBI/02-Website/vbi-repo/

# Verify CNAME file is present and correct
cat CNAME
# Expected output: vbi.narenlife.com

# Stage all 109 modified files
git add -A

# Verify CNAME is in the staged changes (should NOT show as deleted)
git status | grep CNAME
# Expected: no output (CNAME is unchanged/tracked) or "new file: CNAME"

# Commit
git commit -m "Apply QA fixes across 109 pages

- Fix canonical URLs to use https://vbi.narenlife.com
- Add rel=noopener to all external links
- Fix navigation links across all pages
- Add favicon reference to all pages
- Update meta tags for SEO"

# Push
git push origin main
```

### Verify HTTPS After Deployment
```bash
# Check HTTP -> HTTPS redirect
curl -sI http://vbi.narenlife.com | head -5
# Expected: HTTP/1.1 301 with Location: https://vbi.narenlife.com/

# Check HTTPS certificate
curl -sI https://vbi.narenlife.com | head -10
# Expected: HTTP/2 200 with valid response

# Check for mixed content (open in browser, check console)
# Or use curl to check the HTML for http:// references:
curl -s https://vbi.narenlife.com | grep -i 'http://' | head -5
# Expected: no output (no http:// references in the HTML)
```

### Revoke PAT Token (if created)
```
1. Go to https://github.com/settings/tokens
2. Find the token created for this deployment
3. Click "Delete" and confirm
4. Verify it no longer appears in the token list
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Password auth for git push | PAT or OAuth via gh CLI | Aug 2021 | Must use token-based auth |
| Manual SSL cert upload | Automatic Let's Encrypt via GitHub Pages | 2018 | Zero manual cert management |
| HTTP-only GitHub Pages | HTTPS enforced by default for new sites | 2018 | Must check "Enforce HTTPS" for existing custom domains |

## Open Questions

1. **GoDaddy CNAME Record Status**
   - What we know: DNS for `vbi.narenlife.com` returns NXDOMAIN. The parent domain resolves. GitHub Pages is configured to use the custom domain.
   - What's unclear: Whether the CNAME record was never created, was deleted, or is misconfigured. Only the GoDaddy DNS management panel can confirm.
   - Recommendation: This is a manual step requiring GoDaddy login. The planner should include it as the first task, flagged as a user action item that cannot be automated.

2. **Existing Git Credentials in macOS Keychain**
   - What we know: `credential.helper = osxkeychain` is configured globally. The remote is HTTPS.
   - What's unclear: Whether valid credentials for `github.com` are stored in the Keychain. A push attempt will reveal this.
   - Recommendation: Try `git push` first. If it fails, create a fine-grained PAT with minimal scope.

3. **Mixed Content in QA-Fixed Files**
   - What we know: 109 files have been modified with QA fixes including canonical URL updates.
   - What's unclear: Whether all internal/external resource references use HTTPS or relative URLs.
   - Recommendation: After deployment, check browser console for mixed content warnings. If found, fix and push a follow-up commit.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (no automated test framework -- static HTML deployment) |
| Config file | none |
| Quick run command | `curl -sI https://vbi.narenlife.com` |
| Full suite command | See verification script below |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPL-01 | 109 QA-fixed files are live on GitHub Pages | smoke | `curl -s https://vbi.narenlife.com \| grep -c 'rel="noopener"'` (should be > 0) | N/A |
| DEPL-02 | HTTPS with valid SSL certificate | smoke | `curl -sI https://vbi.narenlife.com \| grep "HTTP/2 200"` | N/A |
| DEPL-03 | CNAME file preserved, custom domain active | smoke | `curl -sI https://narulraj283.github.io/vbi-website/ \| grep "location.*vbi.narenlife.com"` | N/A |
| DEPL-04 | PAT tokens revoked | manual-only | Manual check at github.com/settings/tokens | N/A -- requires browser login |

### Sampling Rate
- **Per task commit:** `curl -sI https://vbi.narenlife.com` (confirm site is reachable)
- **Per wave merge:** Full verification: DNS + HTTPS + mixed content + CNAME check
- **Phase gate:** All four smoke tests pass; PAT manually confirmed revoked

### Wave 0 Gaps
None -- no test framework needed. All verifications are curl-based smoke tests or manual browser checks.

## Sources

### Primary (HIGH confidence)
- [GitHub Pages: Securing with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) -- HTTPS provisioning, enforce checkbox, Let's Encrypt
- [GitHub Pages: Troubleshooting Custom Domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages) -- CNAME pitfalls, DNS check, certificate stuck
- [GitHub Pages: Managing Custom Domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) -- CNAME file, subdomain setup
- [GitHub: Managing Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) -- PAT creation, fine-grained vs classic, revocation

### Secondary (MEDIUM confidence)
- [GitHub Community Discussion #184514](https://github.com/orgs/community/discussions/184514) -- HTTPS not available even after DNS check successful; remove/re-add domain fix
- [GitHub Community Discussion #44160](https://github.com/orgs/community/discussions/44160) -- DNS check successful but can't enforce HTTPS
- [Torq Software: GitHub Enforce HTTPS Greyed Out](https://torqsoftware.com/blog/2025/2025-10-24-github-enforce-https-greyed-out/) -- CAA records, conflicting DNS entries

### Verified During Research (direct observation)
- `nslookup vbi.narenlife.com` returns NXDOMAIN (confirmed 2026-03-15)
- `nslookup narenlife.com` returns `172.64.80.1` (parent domain resolves)
- `curl -sI https://narulraj283.github.io/vbi-website/` returns 301 redirect to `http://vbi.narenlife.com/` (GitHub Pages custom domain IS configured)
- Local repo at `~/AnjaleeClaude/VBI/02-Website/vbi-repo/` has 109 modified files, CNAME file present with `vbi.narenlife.com`
- Git credential helper is `osxkeychain`
- `gh` CLI is not installed
- Remote is `https://github.com/narulraj283/vbi-website.git`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- GitHub Pages, git, curl are all system tools with no version ambiguity
- Architecture: HIGH -- Single commit + push to GitHub Pages is the simplest possible deployment pattern
- Pitfalls: HIGH -- DNS issue confirmed via live testing; CNAME/HTTPS pitfalls well-documented in official GitHub docs and community discussions

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable domain -- GitHub Pages patterns rarely change)
