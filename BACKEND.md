# Editing backend (custom)

A small, self-hosted editing backend. No third-party CMS, no external database:
the admin UI writes the single content file (`src/_data/site.json`) back to the
repository via the GitHub API, and Vercel rebuilds the site.

```
src/admin/            our own admin UI (login + editor), served at /admin
  index.html
  admin.css
  admin.js
api/                  Vercel serverless functions
  _lib.js             shared helpers (session signing, GitHub read/write)
  login.js            POST /api/login   email + password -> session cookie
  logout.js           POST /api/logout
  content.js          GET/PUT /api/content   read & commit site.json
```

Auth is a single admin (email + password) held in environment variables; the
session is a signed, HttpOnly cookie (HMAC, 8 h). Saving commits to the
configured branch, which triggers a Vercel deploy.

Failed logins are **rate-limited per IP** (6 tries per 15 min, then a 15 min
lockout with `429` + `Retry-After`), implemented in `api/_lib.js`.

- **With `KV_REST_API_URL` + `KV_REST_API_TOKEN` set** (Vercel KV / Upstash
  Redis), the throttle is backed by that shared store, so the limit is enforced
  **globally** across all serverless instances and survives cold starts. Add it
  via Vercel → Storage → KV (or the Upstash integration); the vars are injected
  automatically, then redeploy. No code or extra dependency needed — the
  functions call the Redis REST API directly.
- **Without KV**, it falls back to an in-memory limiter, per warm serverless
  instance rather than global. This needs zero infrastructure and still raises
  brute-force cost a lot, so a fresh client clone works out of the box.
- If a KV call ever errors, the request **degrades to the in-memory limiter**
  rather than failing the login — the store is best-effort, never a hard
  dependency for signing in.

## Environment variables (set in Vercel)

[Vercel → Project → Settings → Environment Variables](https://vercel.com/bolteds-projects/soulportraits/settings/environment-variables)

| Variable | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | login email of the single admin (**required**) |
| `ADMIN_PASSWORD` | login password (**required**) |
| `AUTH_SECRET` | random string for signing the session cookie, e.g. `openssl rand -hex 32` (**required**) |
| `CONTENT_GITHUB_TOKEN` | GitHub token with **Contents: read & write** on this repo (**required to save**) |
| `CONTENT_BRANCH` | optional. Defaults to the deployed branch (Vercel `VERCEL_GIT_COMMIT_REF`), i.e. `main` in production |
| `CONTENT_REPO` | optional. Defaults to this project's repo (Vercel `VERCEL_GIT_REPO_OWNER/SLUG`) |
| `KV_REST_API_URL` | optional. Vercel KV / Upstash Redis REST endpoint — enables the **global** login throttle (see below). Injected automatically by the Vercel KV / Upstash integration |
| `KV_REST_API_TOKEN` | optional. Token for the KV REST endpoint. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are accepted as aliases |

Without `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `AUTH_SECRET` the backend fails closed:
login is refused. `CONTENT_REPO` / `CONTENT_BRANCH` rarely need setting — they are
auto-detected from Vercel, which makes forked client copies work with no config.

Create a fine-grained GitHub token (scoped to just this repo, Contents:
read & write): [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)

After setting or changing variables, **redeploy** so the functions pick them up.

## Using it

Open `/admin` on the deployed site, sign in, edit, Save. Saving commits to
`CONTENT_BRANCH`; the site redeploys automatically (one to two minutes).

> The `api/` functions only run on Vercel, not in `npm run dev` (which serves
> the static build only). To run the whole thing locally, use `vercel dev`.

## What's editable

The whole site: brand, meta/SEO, hero, intro, portfolio (with image list),
process steps, the room, about, guidance facts, contact and footer/legal.

**Images** are uploaded straight from the editor: the browser reads the file,
derives its pixel dimensions and a tiny blur-up placeholder automatically, and
the file is committed to `src/images/` via `POST /api/upload`. The new path is
stored in `site.json`. (Endpoint: `api/upload.js`.)

Before upload the browser **optimises** the image on a canvas: it downscales
anything larger than 2400 px on the long edge and re-encodes to WebP (≈82 %
quality, JPEG fallback), so full-resolution camera files don't bloat the repo
or the page. Already-small images are kept as-is, and SVG/GIF pass through
untouched. The editor shows the resulting dimensions, format and size (and a
warning if the source is under 1200 px); the stored width/height reflect the
optimised image so the layout stays correct.
