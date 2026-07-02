# Handover / Open points

State as of the last session, so a fresh session can continue cleanly.

## In progress: "Unique & amazing" Ausbauplan (IMPROVEMENT_PLAN.md)

`IMPROVEMENT_PLAN.md` (merged via PR #17) lays out 6 independent phases, one
PR each. Being executed in order.

- **Phase 1 — personalized greeting: shipped.** `?für=Name` (also `fuer`,
  `name`) greets in the hero from `hero.greeting_template`, gated by
  `hero.greeting_enabled` (default `false`, so behavior is unchanged until a
  photographer turns it on in `/admin`). Sanitization (Unicode letters only,
  max 30 chars, `textContent` insertion) and admin round-trip (checkbox,
  template field, "Persönlichen Link kopieren" helper) verified on preview.
- **Phase 2 — Stimmen (quiet testimonials): shipped, but no content yet.**
  Optional `site.json` `stimmen` block (eyebrow/title/flow_intro/items) renders
  a section between Raum and Über mich, guarded on `site.stimmen.items.length`
  so it stays fully invisible until real quotes exist (`stimmen` key is absent
  in `site.json` today — the plan's draft quotes were **not** seeded in, since
  attributing fabricated testimonials to named people on the live production
  site would be deceptive). Admin has a list editor under "Stimmen" with an
  explicit consent reminder in the field label. **Open: Lilja needs to collect
  real testimonials with written consent and add them via `/admin` to activate
  the section.**
- **Phase 3 — Fragen (gentle FAQ + JSON-LD): shipped, with real content.**
  Optional `site.json` `fragen` block (eyebrow/title/items with
  question/answer), rendered as `<details>/<summary>` hairline rows between
  Beratung and the closing flow (no nav entry, same as Stimmen). A `FAQPage`
  JSON-LD block is emitted in `<head>` from the same data (via Nunjucks'
  `dump` filter for safe JSON string escaping — don't switch that back to
  plain `{{ }}` interpolation, it'll HTML-escape quotes into the JSON).
  Shipped with the plan's 5 draft Q&As as real, live content (unlike Phase 2's
  testimonials, these are ordinary FAQ copy in Lilja's own voice, not
  attributed customer statements, so there's no fabrication concern).
- **Phase 4 — Kontakt threshold lowering: shipped.** A JS-gated
  "E-Mail-Adresse kopieren" button next to the mailto CTA (Clipboard API with
  an `execCommand` fallback, inline "Kopiert."/"Kopieren fehlgeschlagen."
  feedback that clears after 2s); hidden entirely without JS (`.js
  .copy-email` gate, same pattern as the gallery blur-up). Optional
  `brand.phone` (tel: link) and `kontakt.channels` (array of
  `{label, url}`, e.g. Signal/WhatsApp) render as quiet underlined text
  links under the hint, separated by a CSS `a + a::before` dot — only if
  present, nothing renders for absent fields. `ProfessionalService` JSON-LD
  now includes `email` (always) and `telephone` (if `brand.phone` set).
  Admin: phone field in "Marke", channels list editor in "Kontakt".
- **Phase 5 — Craft polish: shipped.** New: hero image now has a very slow
  (46s, alternate, ±3% scale) "breathing" zoom, frozen via the existing
  reduced-motion block; `hanging-punctuation: first` on `.about-quote`
  (Safari-only, no fallback needed); a custom `src/404.njk` → `/404.html`
  (Vercel serves it automatically for unmatched routes) with copy from a new
  optional `site.json` `notfound` block (title/text/link_label, defaulted via
  Nunjucks `or` so old forks without the key still render something sane);
  a minimal print stylesheet hiding header/mobile-nav/flow/scroll-cue/skip-link.
  Skipped as already present before this phase: paper-grain overlay
  (`body::after`, opacity 0.035) and clay `::selection` — both already existed
  on `main`, re-implementing would have duplicated/conflicted with them.
- Phase 6 (responsive images) — see `IMPROVEMENT_PLAN.md` for scope, not
  started yet unless a later entry in this file says otherwise.

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

## Feature roadmap

`IMPROVEMENT_PLAN.md` holds a phased plan (personal greeting, Stimmen, Fragen,
Kontakt polish, craft details, responsive images) written for a fresh session to
execute one phase per PR. Start there for feature work.

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
