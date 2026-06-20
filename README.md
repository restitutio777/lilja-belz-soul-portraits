# Lilja Belz, Soul Portraits

A one-page portfolio and landing page for portrait photographer Lilja Belz. Static site,
no build step, deployed on Vercel.

## What this is
Soul Portraits are process focused portrait sessions: the encounter and the experience of
being truly seen, not just the resulting photos. Lilja shares the link after meeting
someone in person, so they can feel what a session is about and get in touch.

## Stack
Plain HTML, CSS, and a small progressive-enhancement script. No framework, no build.
Fonts: Fraunces and Hanken Grotesk via Google Fonts.

## Local preview
Open `index.html` directly, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 5173
```

## Structure
```
index.html      markup and content (German)
styles.css      design system and layout
script.js       scroll reveals, sticky header, mobile menu
images/         portfolio and about photos
favicon.svg
vercel.json     caching and security headers
robots.txt, sitemap.xml
PRODUCT.md, DESIGN.md  brand and design context
```

## Before going fully live, replace the placeholders
1. **Images.** Everything in `images/` is a licensed Unsplash placeholder. Swap in Lilja's
   own work. Keep similar aspect ratios and update the `width`/`height` attributes in
   `index.html` to the new pixel ratios (prevents layout shift).
   - Hero: `images/p07.jpg`. About: `images/p02.jpg`. Social preview: `og.jpg` (1200x630).
   - The gallery applies a subtle unifying filter (`grayscale .22 sepia .06`) so the mixed
     placeholders feel cohesive. Once Lilja's own color-graded work is in, dial this down
     in `styles.css` (`.gallery-item img` and `.about-media img`) so her palette shows.
2. **Email.** `hallo@liljabelz.de` appears in `index.html` (contact button and Impressum).
3. **Impressum and Datenschutz.** Footer contains placeholder legal text. German sites
   require a complete Impressum; fill in name, address, and a real privacy notice.
4. **Site URL.** Absolute URLs use the `__SITE_URL__` token in `index.html`, `robots.txt`,
   and `sitemap.xml`. These are set to the deployment URL at deploy time. If you move to a
   custom domain, replace the token with that domain and redeploy.
5. **Instagram or other links.** Optional; add to the contact and footer sections.

## Deploy
Connected to Vercel. Pushing to the default branch triggers a production deploy.
```bash
vercel --prod   # or use the Vercel dashboard / git integration
```
