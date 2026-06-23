# Reselling this as a product

Each client is a fully isolated copy: own repository, own Vercel project, own
domain, own login. You brand the front end; the editing backend (`/admin` +
`api/`) works the same everywhere. No shared infrastructure, no per-client CMS
fees.

## Per-client checklist

### 1. Create the client repository
Make this repo a **GitHub template** (Settings → *Template repository*), then use
*“Use this template”* for each client. (Fork or duplicate works too.) Private
repos are supported — the backend reads via the API when a token is set.

### 2. Import to Vercel
Vercel → *Add New Project* → import the client repo → Deploy. Build command and
output directory are already set in `vercel.json`. Nothing else to configure:
the backend auto-detects the repo and branch from Vercel’s Git variables.

### 3. Environment variables (per project)
Set in the new Vercel project → Settings → Environment Variables (scope: at
least **Production**):

| Variable | Value |
| --- | --- |
| `ADMIN_EMAIL` | the photographer’s login email |
| `ADMIN_PASSWORD` | a strong password |
| `AUTH_SECRET` | random string (`openssl rand -hex 32`) |
| `CONTENT_GITHUB_TOKEN` | token with **Contents: read & write** on the client repo |

`CONTENT_REPO` and `CONTENT_BRANCH` are optional — they default to the project’s
own repo and deployed branch. Redeploy once after setting the variables.

> Without these the admin fails closed (no login), which is the safe default.

### 4. Brand the front end
- **Colours & fonts:** `src/styles.css` `:root` tokens — adjust `--paper*`
  (background), `--ink*` (text), `--clay*` (accent), and `--font-display` /
  `--font-body`. (Colours are OKLCH.)
- **Fonts (loading):** update the Google Fonts `<link>` in `src/index.njk` to
  match the chosen typefaces.
- **Wordmark, copy, images, email:** all in `/admin` (or `src/_data/site.json`).
- **Favicon / social image:** replace `src/favicon.svg`,
  `src/apple-touch-icon.png`, `src/og.jpg`.

### 5. Domain
Add the client’s custom domain in Vercel (free). Update `meta.site_url` in the
admin, and `src/robots.txt` / `src/sitemap.xml` to the new domain.

### 6. Hand over
Give the photographer their `/admin` URL plus the `ADMIN_EMAIL` and password.
They edit; every save commits and redeploys automatically.

## What changes per client (summary)

| Concern | Where |
| --- | --- |
| Content (text, images) | `/admin` → `src/_data/site.json` |
| Colours & fonts | `src/styles.css` `:root`, fonts link in `src/index.njk` |
| Brand name / email | `/admin` (brand.*) |
| Favicon / OG image | `src/favicon.svg`, `src/apple-touch-icon.png`, `src/og.jpg` |
| Domain & SEO URLs | Vercel domain, `meta.site_url`, robots/sitemap |
| Login & token | Vercel environment variables |

Everything else — the editor, the build, the deploy flow — is shared and needs
no per-client code changes.
