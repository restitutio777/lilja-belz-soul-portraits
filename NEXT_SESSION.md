# Handover / Open points

State as of the last session, so a fresh session can continue cleanly.

## What exists and works (verified)
- **Live site (production, branch `main`):** https://soulportraits-six.vercel.app
  Rendered by **Eleventy** from a single content file `src/_data/site.json`.
- **Custom editing backend** (no third-party CMS, no database):
  - Branded admin at `/admin` (`src/admin/`), email+password login, HMAC session cookie.
  - Vercel functions in `api/`: `login`, `logout`, `content` (GET/PUT), `upload`.
  - Saving commits `site.json` to the repo via the GitHub API → Vercel rebuilds.
  - Image upload optimises on the client (downscale → WebP), commits to
    `src/images/`, and stores width/height + a blur-up placeholder.
  - **Verified on production:** login, content save, image upload, and the
    front-end updating after a save all work.
- **Auth env vars are set** in Vercel (Production): `ADMIN_EMAIL`,
  `ADMIN_PASSWORD`, `AUTH_SECRET`, `CONTENT_GITHUB_TOKEN`. Auth fails closed if
  they were ever removed.
- **Repo is a GitHub template** (reseller model — see `RESELLER.md`).

### Engine hardening shipped (PR #10, on `main`, deployed & verified live)
- **Login throttle** can use a shared store: set `KV_REST_API_URL` +
  `KV_REST_API_TOKEN` (Vercel KV / Upstash) for a global limit that survives
  cold starts; otherwise it falls back to the in-memory per-instance limiter
  (fail-open on KV errors). KV is **optional** — login works without it.
- **`robots.txt` / `sitemap.xml`** are rendered from `src/robots.njk` /
  `src/sitemap.njk` and follow `site.meta.site_url` (no hardcoded host).
- **Impressum/Datenschutz scaffold** (§ 5 DDG, DSGVO) in
  `footer.impressum_html` with `[bracketed]` placeholders — structure only,
  must be filled with real data (see open point 2).
- **Self-hosted fonts**: Fraunces + Hanken Grotesk served from `src/fonts/`
  (subsetted variable WOFF2); no Google Fonts request anywhere (site + admin).

## Branches / PRs
- `main` — live production (latest: PR #10).
- PRs #6–#10 are merged. Older feature branches can be ignored/deleted.

## Open points (need the user / real content)

1. **Real photos** instead of the Unsplash placeholders — hero, about, the OG
   image (`src/og.jpg`, 1200×630), and the gallery. Paths live in `site.json`;
   easiest to swap via `/admin` (it optimises on upload).
2. **Fill the Impressum/Datenschutz scaffold** with real, legally valid data:
   replace every `[placeholder]` in `footer.impressum_html` (name, address,
   contact, USt-IdNr if any) and have it reviewed. The scaffold is **not** legal
   advice. (Google-Fonts paragraph is already gone — fonts are self-hosted.)
3. **`brand.email`** — `hallo@liljabelz.de` is a placeholder; set the real
   address (used for the contact mailto link).
4. **Own domain** in Vercel, then set `site.meta.site_url` accordingly
   (robots.txt/sitemap.xml follow it automatically; no other edits needed).
5. **Optional — global login throttle:** add a Vercel KV / Upstash store and set
   `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Production), then redeploy.
6. **Optional — colour-grading filter:** if Lilja's own colour-graded images go
   in, revisit any image filters in `styles.css` (`.gallery-item img` /
   `.about-media img`) so they don't double-process her grade.

## Key files
- `src/_data/site.json` — all content (edited via `/admin`).
- `src/index.njk` — template; `src/styles.css` — design tokens (`:root`) for branding.
- `src/robots.njk` / `src/sitemap.njk` — rendered to `/robots.txt` and `/sitemap.xml`;
  their URLs follow `site.meta.site_url`, so a domain change needs no edits here,
  only updating `site.meta.site_url` (and pointing the Vercel domain).
- `src/fonts/` — self-hosted WOFF2 + OFL license; `@font-face` at the top of
  `src/styles.css` (mirrored in `src/admin/admin.css`).
- `api/_lib.js` — auth + login throttle + GitHub read/write helpers;
  `api/{login,logout,content,upload}.js`.
- `.eleventy.js`, `vercel.json` — build & hosting config.
- `BACKEND.md` — backend + env vars. `RESELLER.md` — per-client setup.
