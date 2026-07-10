# Lilia Belz, Soul Portraits

A one-page portfolio and landing page for portrait photographer Lilia Belz. Static site,
no build step, deployed on Vercel.

## What this is
Soul Portraits are process focused portrait sessions: the encounter and the experience of
being truly seen, not just the resulting photos. Lilia shares the link after meeting
someone in person, so they can feel what a session is about and get in touch.

## Stack
Static site built with [Eleventy](https://www.11ty.dev/) from a single content file.
CSS and a small progressive-enhancement script, no front-end framework. Fonts: Fraunces
and Hanken Grotesk, self-hosted (WOFF2 in `src/fonts/`), so no visitor data is sent to Google.

Content lives in **one place**: `src/_data/site.json`. The Eleventy template renders it
into static HTML. A custom editing backend (in progress) will write to this content; for
now content is edited in the JSON file directly. Vercel rebuilds on push.

## Local preview
```bash
npm install
npm run dev     # Eleventy on http://localhost:8080
```
To just build: `npm run build` (output in `_site/`).

## Structure
```
src/
  index.njk         template (renders site.json into HTML)
  _data/site.json   ← all content (German)
  styles.css        design system and layout
  script.js         scroll reveals, sticky header, mobile menu
  images/           portfolio and about photos
  favicon.svg, apple-touch-icon.png, og.jpg
  robots.txt, sitemap.xml
.eleventy.js        build config (src → _site)
vercel.json         build command, caching and security headers
PRODUCT.md, DESIGN.md  brand and design context
```

## Before going fully live, replace the placeholders
Edit these in `src/_data/site.json`.
1. **Images.** Everything in `src/images/` is a licensed Unsplash placeholder. Swap in
   Lilia's own work. Keep similar aspect ratios; for gallery images set width/height to the
   new pixel ratios to prevent layout shift.
   - Hero: `src/images/p07.jpg`. About: `src/images/lilja.jpg`. Social preview: `src/og.jpg` (1200x630).
   - The gallery applies a subtle unifying filter (`grayscale .22 sepia .06`) so the mixed
     placeholders feel cohesive. Once Lilia's own color-graded work is in, dial this down
     in `src/styles.css` (`.gallery-item img` and `.about-media img`) so her palette shows.
2. **Email.** `brand.email` (used by the contact button and Impressum).
3. **Impressum and Datenschutz.** `footer.impressum_html`. German sites require a complete
   Impressum; fill in name, address, and a real privacy notice.
4. **Site URL.** `meta.site_url`; set it to the real domain. (`robots.txt` and `sitemap.xml`
   still carry the deploy URL and can be updated when moving domains.)
5. **Instagram or other links.** Optional; add to the contact and footer sections.

## Deploy
Connected to Vercel. Pushing to the default branch triggers a production deploy; Vercel
runs `npm run build` and serves `_site/` (configured in `vercel.json`).
```bash
vercel --prod   # or use the Vercel dashboard / git integration
```
