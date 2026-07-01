# IMPROVEMENT_PLAN.md — "Unique & amazing" roadmap

A concrete, phased plan to elevate the Soul Portraits site from "polished template"
to "unmistakably personal". Written so a fresh Claude (Opus/Sonnet) session can
execute it phase by phase without further briefing.

**Read first:** `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `NEXT_SESSION.md`.

## Non-negotiable constraints (apply to every phase)

1. **Engine stays generic** (reseller template). All new content lives in
   `src/_data/site.json`; no "Lilja" hardcoded in `src/index.njk`, `src/styles.css`,
   `src/script.js`, `api/`, or `src/admin/`. New sections must degrade gracefully
   (render nothing) when their `site.json` key is absent, so old client copies and
   fresh template copies both work.
2. **Admin parity**: every new `site.json` field must be editable at `/admin`
   (`src/admin/admin.js` + `index.html`). German labels, matching the existing
   editor patterns. A field the photographer can't edit herself is a regression.
3. **Design bans stay in force** (see DESIGN.md): no cards-with-icons grids, no
   gradient text, no glassmorphism, no modals, no em dashes in copy, never pure
   #000/#fff. Warm paper light theme, Fraunces + Hanken Grotesk, OKLCH tokens only.
4. **All visitor-facing and admin copy in German.** Du-Form, quiet tone
   (feinfühlig, ruhig, edel — see PRODUCT.md).
5. **Progressive enhancement + `prefers-reduced-motion`** for anything scripted.
   The page must be fully usable without JS.
6. **Security model untouched**: no new unauthenticated write endpoints, no
   secrets in the browser, auth keeps failing closed.
7. **Workflow**: one phase = one branch = one PR (squash-merge, `(#N)` style).
   Verify with `npm run build` locally; anything backend/admin on a Vercel
   preview deployment. Update `NEXT_SESSION.md` (and `DESIGN.md`/`BACKEND.md`
   where relevant) at the end of each phase.

---

## Phase 1 — Signature feature: personalized greeting (the "being seen" moment)

**Why this is the differentiator.** The link is sent one-to-one after a personal
encounter (PRODUCT.md). No template competitor does this: Lilja appends a name to
the URL and the page greets that person. The site's promise ("Gesehen werden, wie
du wirklich bist") starts before the first scroll.

**Behavior**
- Lilja shares e.g. `https://…/?für=Anna` (also accept `fuer` and `name` as keys).
- With a valid name, a quiet greeting line appears in the hero above the eyebrow,
  e.g. rendered from a template string: `"Schön, dass du hier bist, {name}."`
- No/invalid param → nothing renders, zero layout shift for normal visitors.

**Implementation**
- `site.json` → `hero.greeting_enabled: true`, `hero.greeting_template:
  "Schön, dass du hier bist, {name}."`
- `src/index.njk`: an empty `<p class="hero-greeting" data-greeting-template="…"
  hidden></p>` slot (only emitted when enabled).
- `src/script.js`: read the param via `URLSearchParams`; sanitize strictly —
  Unicode letters (umlauts!), spaces, hyphens, apostrophe; max ~30 chars; trim;
  capitalize first letter. Insert with `textContent` only (XSS-safe). Reveal with
  the existing `.reveal` mechanics; reserve height via CSS (`min-height` on the
  slot when enabled) to avoid CLS.
- CSS: italic Fraunces, clay-deep, slightly larger than the eyebrow; fade-in
  respecting reduced motion.
- Admin: toggle + template text field in the Hero panel, plus a small
  **link helper**: a name input + "Persönlichen Link kopieren" button that builds
  `site_url + '/?für=' + encodeURIComponent(name)` and copies it to the clipboard.
  This is the feature's real UX — Lilja creates the links in 5 seconds.

**Acceptance**
- `?für=Änne-Marie` greets correctly; `?für=<script>` renders nothing;
  overly long / URL-junk names render nothing; no CLS (check preview);
  page identical to today when the feature is off or no param present.

## Phase 2 — "Stimmen" section (quiet testimonials)

**Why.** Visitors decide on trust and emotion. Voices of former sitters — who
were also "not photo people" — are the strongest quiet proof, and the section
type is reusable for every future client photographer.

**Implementation**
- `site.json` → new optional `stimmen` block:
  ```json
  "stimmen": {
    "eyebrow": "Stimmen",
    "title": "Was Menschen nach einer Begegnung sagen",
    "flow_intro": "Und was davon bleibt",
    "items": [
      { "quote": "Ich bin nicht gern vor der Kamera. Bei Lilja habe ich das nach zehn Minuten vergessen.", "name": "Anna", "context": "Soul Portrait, Frühjahr 2026" },
      { "quote": "Ich habe zum ersten Mal ein Foto von mir, das sich nach mir anfühlt.", "name": "Miriam", "context": "Soul Portrait" },
      { "quote": "Es war weniger ein Fototermin als ein sehr ruhiges, ehrliches Gespräch. Die Bilder erzählen genau davon.", "name": "Jonas", "context": "Soul Portrait" }
    ]
  }
  ```
  (Placeholder quotes — clearly to be replaced with real ones; keep first names
  only, note in admin help text that written consent is needed.)
- `src/index.njk`: section between **Raum** and **Über mich** (guarded with
  `{% if site.stimmen %}`), plus its own flow divider. Editorial treatment, no
  cards: large Fraunces quotes with a hairline between entries, name + context as
  a small uppercase attribution line — visually kin to the existing `.about-quote`
  and `.steps` styling.
- CSS in `src/styles.css`; entries use the existing `.reveal` stagger.
- Admin: list editor (add / remove / move up-down / edit) following the pattern
  used for portfolio items and Ablauf steps in `src/admin/admin.js`.

**Acceptance:** section renders with 1–4 quotes and disappears entirely when
`stimmen` is absent; scroll-spy/nav untouched (no nav entry needed — it's a
between-sections breath, not a destination); admin round-trip (edit → save →
rebuild) verified on a Vercel preview.

## Phase 3 — "Fragen" section (gentle FAQ for nervous visitors)

**Why.** The audience is "curious, a little vulnerable, not photo people". Their
unspoken objections ("Ich bin nicht fotogen", "Was ziehe ich an?") currently go
unanswered. Answering them softly converts hesitation into a message — and a
`FAQPage` JSON-LD block improves search/AI-answer presence.

**Implementation**
- `site.json` → optional `fragen` block: eyebrow `"Fragen"`, title
  `"Was du vielleicht gerade denkst"`, items array. Draft Q&As (to refine):
  1. „Ich bin überhaupt nicht fotogen.“ → Niemand muss das sein; ein Soul
     Portrait sucht keinen perfekten Winkel, sondern einen wahren Moment.
  2. „Was soll ich anziehen?“ → Etwas, worin du dich zu Hause fühlst; wir
     besprechen es im Vorgespräch.
  3. „Ich weiß nicht, ob ich mich vor der Kamera entspannen kann.“ → Genau dafür
     ist die Begegnung da; wir haben Zeit, und nichts muss.
  4. „Wie lange dauert es, bis ich meine Bilder sehe?“ → In der Regel zwei bis
     drei Wochen; sorgfältig ausgewählt und behutsam bearbeitet.
  5. „Muss ich mich vorher festlegen?“ → Nein, das Vorgespräch ist unverbindlich.
- Markup: `<details>/<summary>` list (works without JS), styled as hairline rows
  with a Fraunces question line and a small clay `+` that rotates on open — no
  accordion cards. Section placed between **Beratung** and the closing flow
  divider, guarded like `stimmen`.
- `src/index.njk` head: emit `FAQPage` JSON-LD from the same data
  (only when `fragen` exists).
- Admin: list editor as in Phase 2.

**Acceptance:** keyboard accessible, works with JS off, JSON-LD validates
(Rich Results test on the preview URL), section optional.

## Phase 4 — Kontakt: lower the threshold

**Why.** A bare `mailto:` is the single conversion point and it fails silently on
machines without a mail client. Keep the one-clear-action principle but make it
robust and give a second quiet channel.

**Implementation**
- Next to the existing mail button: a small "E-Mail-Adresse kopieren" text button
  (Clipboard API, `navigator.clipboard` with fallback selection; confirmation
  text „Kopiert." appears inline for 2 s). JS-gated: hidden without JS.
- `site.json` → optional `brand.phone` and `kontakt.channels` (e.g.
  `{ "label": "Signal", "url": "https://signal.me/…" }` array). Render as quiet
  text links under the hint — only if present. No icons grid.
- Update JSON-LD `ProfessionalService` with `email` (and `telephone` if set).
- Admin: fields in the Kontakt panel.

**Acceptance:** copy button works on the preview (https context), nothing
renders for absent optional fields, mailto unchanged.

## Phase 5 — Craft polish (the details people feel but don't name)

Small, quiet upgrades; one PR, individually skippable:

- **Paper grain:** a very subtle tiled SVG noise (inline data-URI,
  `opacity ≈ 0.025`) on `body::before`, `pointer-events: none`. Makes the paper
  theme tactile. Must not affect contrast or performance.
- **Hero breath:** an extremely slow (≥ 40 s) scale 1.0 → 1.03 on the hero image,
  paused under `prefers-reduced-motion`.
- **Typography:** `text-wrap: balance` on headings, `text-wrap: pretty` on body
  where supported; `hanging-punctuation: first` on the about quote (Safari) —
  progressive, no fallback needed.
- **Selection color:** clay on paper (`::selection`).
- **Custom 404** (`src/404.njk` → `/404.html`, Vercel serves it automatically):
  brand-toned „Diese Seite gibt es nicht. Aber dich gibt es." + link home.
  Strings from a new optional `site.json` `notfound` block with defaults.
- **Print stylesheet:** hide nav/flow/cues so the page prints like a small
  portfolio sheet (a nice touch when someone prints it for a partner/parent).

**Acceptance:** Lighthouse (preview) stays ≥ current scores; reduced-motion
audit passes; 404 works on the preview deployment.

## Phase 6 — Engine: responsive images (`srcset`)

**Why.** Every image ships at full stored width (up to 2400 px) even to phones —
and the link is opened on a phone first. Biggest remaining performance win, and
it benefits all future template clients.

**Implementation (choose A; B only if A conflicts with admin flow)**
- **A (build-time, no admin changes):** use `@11ty/eleventy-img` in
  `.eleventy.js` via an async shortcode/transform for gallery/raum/hero images:
  generate 480/800/1200/1600 WebP variants into `_site/images/`, emit
  `srcset` + `sizes` (gallery ≈ `(min-width: 1024px) 33vw, (min-width: 640px)
  50vw, 100vw`). Keep the stored width/height attributes so aspect-ratio boxes
  and LQIP behavior are unchanged. Cache `.cache/` and make sure the Vercel
  build command tolerates it (build time will grow — measure).
- **B (upload-time):** extend the admin upload to also produce an 800 px variant
  and store `image_small`. Only if A proves impractical on Vercel.
- Keep zero-config for forks (no new env vars).

**Acceptance:** visual output identical at desktop; phone downloads the small
variant (check the preview's network panel); build passes on Vercel; LCP
improves or holds; `BACKEND.md`/`DESIGN.md` updated.

## Explicitly rejected (do not add)

- **Lightbox/modal gallery** — DESIGN.md bans modals; the masonry IS the viewing
  experience.
- **Pricing tables, packages, booking calendar widgets** — against the brand
  (one action: get in touch).
- **Contact form with backend mailer** — adds env vars/secrets per client and a
  spam surface; the mailto + copy + optional channels (Phase 4) covers it.
- **Dark mode** — the warm paper theme is the brand.
- **Analytics/tracking** — the Datenschutz promise ("keine Cookies, kein
  Tracking") is itself a feature.

## Suggested order & sizing

| Phase | Value | Size | Depends on |
|---|---|---|---|
| 1 Personal greeting | very high (signature) | S–M | — |
| 2 Stimmen | high (trust) | M | — |
| 3 Fragen + FAQ JSON-LD | high (conversion, SEO) | M | — |
| 4 Kontakt threshold | medium-high | S | — |
| 5 Craft polish | medium (feel) | S | — |
| 6 Responsive images | high (perf, engine) | M–L | — |

All phases are independent; 1 → 2 → 3 → 4 → 5 → 6 is the recommended order.
