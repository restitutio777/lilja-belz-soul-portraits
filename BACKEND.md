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

## Environment variables (set in Vercel)

[Vercel → Project → Settings → Environment Variables](https://vercel.com/bolteds-projects/soulportraits/settings/environment-variables)

| Variable | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | login email of the single admin |
| `ADMIN_PASSWORD` | login password |
| `AUTH_SECRET` | random string for signing the session cookie (e.g. `openssl rand -hex 32`) |
| `CONTENT_GITHUB_TOKEN` | GitHub token with **Contents: read & write** on this repo |
| `CONTENT_BRANCH` | branch to commit to. `main` for production; the feature branch while testing on a preview |
| `CONTENT_REPO` | optional, defaults to `restitutio777/lilja-belz-soul-portraits` |

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
