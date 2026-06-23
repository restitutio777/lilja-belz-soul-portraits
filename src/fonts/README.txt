Self-hosted web fonts
======================

These WOFF2 files are served locally (instead of via Google Fonts) so no
visitor data is sent to Google when the page loads. They are subsetted to the
"latin" and "latin-ext" Unicode ranges and are variable fonts (weight axis; the
Fraunces files also carry the optical-size and italic axes).

Both families are licensed under the SIL Open Font License, Version 1.1
(full text in OFL.txt):

- Fraunces — Copyright 2018 The Fraunces Project Authors
  https://github.com/undercasetype/Fraunces
- Hanken Grotesk — Copyright 2021 The Hanken Grotesk Project Authors
  https://github.com/marcologous/hanken-grotesk

To regenerate / change weights, request the variable CSS from Google Fonts with
a modern-browser User-Agent, keep the latin + latin-ext @font-face blocks, and
download the referenced WOFF2 files into this folder (see the @font-face block
at the top of ../styles.css).
