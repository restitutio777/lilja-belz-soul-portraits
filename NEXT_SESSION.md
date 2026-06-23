# Handover / Open points

State as of the last session, so a fresh session can continue cleanly.

## What exists and works (verified)
- **Live site (production, branch `main`):** https://soulportraits-six.vercel.app
  Rendered by **Eleventy** from a single content file `src/_data/site.json`.
- **Custom editing backend** (no third-party CMS, no database):
  - Branded admin at `/admin` (`src/admin/`), email+password login, HMAC session cookie.
  - Vercel functions in `api/`: `login`, `logout`, `content` (GET/PUT), `upload`.
  - Saving commits `site.json` to the repo via the GitHub API → Vercel rebuilds.
  - Image upload commits to `src/images/` and auto-derives dimensions + blur-up.
  - **Verified on production:** login, content save, image upload, and the
    front-end updating after a save all work.
- Note: the earlier “front doesn’t update” was the Vercel **preview** protection
  bypass link pinning the browser to an old deployment — not a real bug. On the
  real domain it updates normally.

## Branches / PRs
- `main` — live production.
- `claude/reseller-template` — **PR #7 (draft)**: reseller hardening
  (zero-config repo/branch via Vercel Git vars, fail-closed auth, private-repo
  support, generic admin header, `RESELLER.md`).
- `claude/tender-babbage-fsjnc1` — merged into main (PR #6), can be ignored.

## Open points (need the user)

1. **SECURITY — do before merging PR #7.** The live admin currently relies on
   built-in default credentials in a public repo. Set in the Vercel project
   (scope **Production**), then redeploy:
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET` (`openssl rand -hex 32`)
   PR #7 makes auth *fail closed*, so these must be set or the live login stops
   working after that merge. `CONTENT_GITHUB_TOKEN` is already set (Production).

2. **Merge PR #7** once step 1 is done → enables the reseller-ready, hardened
   version on production.

3. **Clean live test content** (currently on the public site): brand tagline is
   the test value “Soul Portraits 4 U” (should be “Soul Portraits”), and a test
   image (an agricultural/cow photo) is in the portfolio. Fix via `/admin` or
   ask the next session to revert it (a commit to `main` → production deploy).

4. **Mark the repo as a GitHub template** (Settings → *Template repository*).
   Cannot be done via the available API tools — manual one-time toggle. Enables
   “Use this template” for client copies.

5. **First client clone (optional):** follow `RESELLER.md` end to end to validate
   the per-client flow (template → Vercel import → env vars → branding → domain).

## Key files
- `src/_data/site.json` — all content (edited via `/admin`).
- `src/index.njk` — template; `src/styles.css` — design tokens (`:root`) for branding.
- `src/robots.njk` / `src/sitemap.njk` — rendered to `/robots.txt` and `/sitemap.xml`;
  their URLs follow `site.meta.site_url`, so a domain change needs no edits here,
  only updating `site.meta.site_url` (and pointing the Vercel domain).
- `api/_lib.js` — auth + GitHub read/write helpers; `api/{login,logout,content,upload}.js`.
- `.eleventy.js`, `vercel.json` — build & hosting config.
- `BACKEND.md` — backend + env vars. `RESELLER.md` — per-client setup.
