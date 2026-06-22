# Lilja Belz, Soul Portraits

A one-page portfolio and landing page for portrait photographer Lilja Belz. Static site,
no build step, deployed on Vercel.

## What this is
Soul Portraits are process focused portrait sessions: the encounter and the experience of
being truly seen, not just the resulting photos. Lilja shares the link after meeting
someone in person, so they can feel what a session is about and get in touch.

## Stack
Static site built with [Eleventy](https://www.11ty.dev/) from a single content file,
plus a small Git-based CMS ([Sveltia CMS](https://sveltiacms.app/)) at `/admin` so the
photographer can edit text and images herself. CSS and a small progressive-enhancement
script, no front-end framework. Fonts: Fraunces and Hanken Grotesk via Google Fonts.

Content lives in **one place**: `src/_data/site.json`. The Eleventy template renders it
into the same static HTML as before. Editing in `/admin` commits to Git; Vercel rebuilds.

See **[SETUP.md](SETUP.md)** for local editing, the GitHub login for the photographer,
and how to reuse this as a product for other photographers.

## Local preview
```bash
npm install
npm run dev     # Eleventy on http://localhost:8080
```
To edit content locally, open `http://localhost:8080/admin/` in a Chromium browser
(no login needed). To just build: `npm run build` (output in `_site/`).

## Structure
```
src/
  index.njk         template (renders site.json into HTML)
  _data/site.json   ← all content (German)
  admin/            Sveltia CMS: index.html + config.yml
  styles.css        design system and layout
  script.js         scroll reveals, sticky header, mobile menu
  images/           portfolio and about photos
  favicon.svg, apple-touch-icon.png, og.jpg
  robots.txt, sitemap.xml
.eleventy.js        build config (src → _site)
vercel.json         build command, caching and security headers
PRODUCT.md, DESIGN.md, SETUP.md  brand, design, and setup context
```

## Before going fully live, replace the placeholders
Most of this is now editable in `/admin` (or directly in `src/_data/site.json`).
1. **Images.** Everything in `src/images/` is a licensed Unsplash placeholder. Swap in
   Lilja's own work. Keep similar aspect ratios; for gallery images set width/height (in
   the editor or JSON) to the new pixel ratios to prevent layout shift.
   - Hero: `src/images/p07.jpg`. About: `src/images/lilja.jpg`. Social preview: `src/og.jpg` (1200x630).
   - The gallery applies a subtle unifying filter (`grayscale .22 sepia .06`) so the mixed
     placeholders feel cohesive. Once Lilja's own color-graded work is in, dial this down
     in `src/styles.css` (`.gallery-item img` and `.about-media img`) so her palette shows.
2. **Email.** Edit *Marke → E-Mail* in `/admin` (used by the contact button and Impressum).
3. **Impressum and Datenschutz.** Field *Fußzeile & Recht*. German sites require a complete
   Impressum; fill in name, address, and a real privacy notice.
4. **Site URL.** Field *Meta & SEO → Seiten-URL*; set it to the real domain. (`robots.txt`
   and `sitemap.xml` still carry the deploy URL and can be updated when moving domains.)
5. **Instagram or other links.** Optional; add to the contact and footer sections.

See **[SETUP.md](SETUP.md)** for the full editing, login, and reseller walkthrough.

## Deploy
Connected to Vercel. Pushing to the default branch triggers a production deploy; Vercel
runs `npm run build` and serves `_site/` (configured in `vercel.json`).
```bash
vercel --prod   # or use the Vercel dashboard / git integration
```
