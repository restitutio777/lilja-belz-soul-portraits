Self-hosted web fonts
======================

These WOFF2 files are served locally (instead of via Google Fonts) so no
visitor data is sent to Google when the page loads.

fraunces-*.woff2, hanken-*.woff2 — serif text and body
------------------------------------------------------
Subsetted to the "latin" and "latin-ext" Unicode ranges, variable fonts
(weight axis; the Fraunces files also carry the optical-size and italic axes).
Both are licensed under the SIL Open Font License, Version 1.1 (full text in
OFL.txt):

- Fraunces — Copyright 2018 The Fraunces Project Authors
  https://github.com/undercasetype/Fraunces
- Hanken Grotesk — Copyright 2021 The Hanken Grotesk Project Authors
  https://github.com/marcologous/hanken-grotesk

To regenerate / change weights, request the variable CSS from Google Fonts with
a modern-browser User-Agent, keep the latin + latin-ext @font-face blocks, and
download the referenced WOFF2 files into this folder (see the @font-face block
at the top of ../styles.css).

acheria-regular.woff2 — headings
---------------------------------
Display face by Muflieart, one static weight (400), no italic, 173 glyphs
including the full German umlauts and eszett. Not subsetted, not variable.
Converted from acheria.regular.otf with the fontTools script in
~/Desktop/Sanity-Websites/Organic-fonts/.

LICENCE: FREE DEMO, PERSONAL USE ONLY — NOT CLEARED FOR COMMERCIAL USE.

The designer states: "ONLY for PERSONAL USE. NO COMMERCIAL USE ALLOWED!"
(checked 2026-07-27 at fontspace.com/acheria-font-f152843 and muflieart.com).
This file comes from that free download, which is why no licence file
accompanies it.

The current deployment is an unadvertised preview, not a client-facing site.
Before any commercial launch a licence has to be bought at
https://muflieart.com/product/acheria-modern-soft-serif/ :

  Standard  $19    1 brand, websites — webfont embedding not spelled out,
                   ask the foundry (nurhabibmuflihin@gmail.com) first
  Logo      $250   logo / brand identity only
  Extended  $500   "web & app embedding" + "paid digital templates",
                   multi-project — the tier this reseller template needs
  Corporate $2500  unlimited brands

Purchases ship OTF/TTF/WOFF; convert to WOFF2 yourself.

Until then the fallback is one line in ../styles.css — Fraunces is already
next in the stack:

  --font-display: "Fraunces", Georgia, "Times New Roman", serif;

then drop the Acheria @font-face block, this .woff2, and the preload in
../index.njk.
