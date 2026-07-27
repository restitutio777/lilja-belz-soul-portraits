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

LICENSE UNRESOLVED. The download shipped without a licence file, so there is
no EULA text to include here. A desktop licence does not by itself permit
@font-face embedding, and this repo is a GitHub template: every client copy
serves this file to its own visitors on a commercial site. Before launching a
client copy, check the EULA on the source page ("webfont / @font-face
embedding"). If it is not covered: buy a webfont licence, convert the affected
headlines to SVG outlines, or point --font-display in ../styles.css back at
Fraunces.
