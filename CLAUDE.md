# CLAUDE.md

Orientation for an AI session working in this repo. Read this first, then the
doc it points you to for the task at hand.

## What this repo is (read this carefully)

It plays **two roles at once**:

1. **A live production site** — the portfolio of portrait photographer Lilia
   Belz ("Soul Portraits"), at https://soulportraits-six.vercel.app.
2. **A reseller template** — the same code is marked as a GitHub *template*, so
   each new client photographer gets an isolated copy (own repo, Vercel project,
   domain, login). See `RESELLER.md`.

Because of role 2, keep the **engine** (Eleventy build, `api/` backend, admin
UI) generic and configurable; only `src/_data/site.json`, branding tokens, and
a few assets are client-specific. Don't hardcode "Lilia Belz" into the engine.

### Template vs. clients — how changes propagate

- Improvements committed here flow to **new** clients the moment they click
  "Use this template" (they get a snapshot of `main` at that time).
- **Existing** client copies are independent repos. They do **not** auto-update.
  A backend/engine fix has to be propagated to them manually (cherry-pick or a
  shared-branch merge). So engine changes are most valuable *before* clients are
  created; afterwards, treat propagation as a deliberate step.

## Architecture

- **Static site**, built by **Eleventy** from a single content file
  `src/_data/site.json` into `_site/`. Template: `src/index.njk`. Design system:
  `src/styles.css` (`:root` OKLCH tokens). Progressive-enhancement JS:
  `src/script.js`.
- **Editing backend** (no DB, no third-party CMS): Vercel serverless functions
  in `api/` + a branded admin at `/admin` (`src/admin/`). Saving commits
  `site.json` back to the repo via the GitHub API → Vercel rebuilds. GitHub *is*
  the datastore. Details in `BACKEND.md`.
- **Hosting**: Vercel. Push to `main` → production deploy. `vercel.json` sets the
  build command, caching, and security headers.

## Commands

```bash
npm install
npm run dev      # Eleventy dev server on http://localhost:8080 (site only)
npm run build    # build to _site/
node --check <file.js>   # syntax-check a function/admin script (no test suite)
```

> The `api/` functions only run on Vercel, **not** under `npm run dev`. To
> exercise the backend locally use `vercel dev`. Backend/admin logic is
> browser/serverless-only, so it's best verified on a Vercel **preview**
> deployment (every PR gets one), not in CI.

## Documentation map

| File | What it covers |
| --- | --- |
| `CLAUDE.md` | this orientation |
| `README.md` | site overview, stack, local preview, launch checklist |
| `PRODUCT.md` | brand purpose, audience, tone, anti-references |
| `DESIGN.md` | design system / visual language |
| `BACKEND.md` | editing backend, env vars, security, image upload |
| `RESELLER.md` | per-client onboarding checklist (the product) |
| `NEXT_SESSION.md` | rolling handover: current state + open points |

When you finish a chunk of work, update `NEXT_SESSION.md` so the next session
starts cleanly.

## Security model (summary; full detail in BACKEND.md)

- Single admin from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`); session is an
  HMAC-signed, HttpOnly/Secure/SameSite=Lax cookie (`AUTH_SECRET`, 8 h).
- **Fails closed**: missing env vars → login refused (503), no defaults, no
  backdoor. Never reintroduce default credentials or a fallback secret.
- `/api/login` is **rate-limited** per IP (`api/_lib.js`). Global when a shared
  store is configured (Vercel KV / Upstash via `KV_REST_API_URL` +
  `KV_REST_API_TOKEN`), otherwise an in-memory per-instance fallback; either way
  it degrades to in-memory rather than blocking a legit login if the store fails.
- `CONTENT_GITHUB_TOKEN` is **server-side only**; never expose it to the browser.
  Use a fine-grained token scoped to the single repo (Contents: read & write).
- Every `api/` route that reads/writes content checks `getSession(req)` first.

## Conventions & gotchas

- **Branches/PRs**: never commit straight to `main`; branch, push, open a PR.
  Match the squash-merge `(#N)` history. Commits are co-authored by Claude with
  committer email `noreply@anthropic.com` (run `git config user.email
  noreply@anthropic.com && git config user.name Claude` if a commit shows as
  unverified).
- **UI strings are German.** Keep new admin/UI copy in German.
- **Images**: the admin optimises on upload (downscale to 2400 px long edge,
  re-encode to WebP) and stores the resulting width/height in `site.json`. If
  you touch image handling, keep stored dimensions matching the actual file or
  the layout's aspect-ratio boxes break.
- **Env auto-detection**: `repo()`/`branch()` in `api/_lib.js` default to
  Vercel's Git system vars so forked client copies need no `CONTENT_REPO`/
  `CONTENT_BRANCH`. Preserve this zero-config behaviour.

## Fonts

Aktuell: **Fraunces** (Display) und **Hanken Grotesk** (Body), beide lokal als
WOFF2 in `src/fonts/`, per `@font-face` in `src/styles.css` mit
`unicode-range`-Split (latin / latin-ext) eingebunden. Im CSS wird nie der
Fontname benutzt, sondern die Tokens `--font-display` / `--font-body`
(`src/styles.css`, `:root`). Beim Fontwechsel nur `@font-face` und die beiden
Tokens anfassen — nicht die Regeln darunter.

Weitere Schriften liegen zentral in `~/Desktop/Sanity-Websites/Organic-fonts/`
(`webfonts/*.woff2`, `webfonts/fonts.css` als `@font-face`-Vorlage,
`README-Webfonts.md` mit Zeichensatz- und Lizenzstatus, `convert-fonts.py` für
neue OTF/TTF). Nur WOFF2, kein WOFF/TTF-Fallback.

**Lizenz ist hier kritischer als in anderen Projekten.** Dieses Repo ist ein
GitHub-Template: jede Client-Kopie liefert die Font-Datei an ihre eigenen
Besucher aus, also auf kommerziellen Kundenseiten. Fraunces und Hanken sind
OFL (`src/fonts/OFL.txt`) und deshalb unproblematisch. Aus der
Organic-fonts-Sammlung sind **Ambar Pearl** (non-commercial) und **Aylia**
(Demo) hier ausgeschlossen; bei Acheria, Natacha, Rollandio und Antesa lag
keine Lizenzdatei bei — vor dem Einbau EULA prüfen, Stichwort „Webfont /
@font-face embedding". Im Zweifel Google Fonts, Fontshare oder Velvetyne.

Zeichensatz prüfen: Natacha und Rollandio haben kein ß, Antesa und Aylia keine
Umlaute. Fehlt ein Zeichen, mischt der Browser wortlos eine Ersatzschrift dazu.
Da die UI-Texte deutsch sind, betrifft das hier fast jede Headline.

Wird eine Schrift getauscht, diesen Abschnitt mitpflegen.

<!-- cloud-local-sync -->
## Cloud ↔ Local: immer überall up to date

Der Betreiber arbeitet in diesem und anderen Projekten mal lokal, mal als Cloud-Session (Claude Code on the web). Beide Seiten sollen immer denselben Stand haben:

- Am Session-Start `git pull` — auf dem neuesten Stand beginnen.
- Am Ende jeder Arbeitsphase / vor Sessionende alles committen und pushen. Nichts Wichtiges nur uncommitted lokal liegen lassen.
- Cloud-Sessions sehen NUR den Git-Stand: keine uncommitteten Änderungen, NICHT das lokale Auto-Memory unter `~/.claude/`. Was die andere Seite wissen muss, gehört committet in versionierte Dateien (CLAUDE.md, ggf. `memory/`, Docs, Code).
