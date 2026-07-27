#!/usr/bin/env python3
"""
Renders src/og.jpg — the link-preview card (1200x630).

Typographic, no photo: the claim in Acheria over paper, brand line in Hanken
Grotesk. Every glyph is converted to an SVG path here, so rasterising needs no
fonts installed on the machine and the result is byte-stable.

Setup:  pip install fonttools brotli   (plus sharp, already in node_modules)
Run:    python3 tools/build-og-image.py
        -> writes tools/og.svg (gitignored intermediate) and src/og.jpg

Change the wording in CONTENT below; sizes are in the 1200x630 coordinate
space. Re-run after a font swap, otherwise the card keeps the old typeface.
"""
import subprocess
import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.varLib.instancer import instantiateVariableFont
except ImportError:
    sys.exit("Fehlt: pip install fonttools brotli")

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "src" / "fonts"

W, H = 1200, 630
PAPER = "#f9f5f0"
INK = "#28211c"
INK_SOFT = "#5a4f48"
CLAY_DEEP = "#8f5037"
LINE = "#d6d0c9"

# Wording of the card. Keep the claim to two short lines — anything longer
# stops being readable at the size link previews are actually shown.
CONTENT = {
    "eyebrow": "SOUL PORTRAITS",
    "claim": ["Gesehen werden,", "wie du wirklich bist."],
    "brand": "Lilia Belz",
    "brand_sub": "FEINFÜHLIGE PORTRÄTFOTOGRAFIE",
}


class Face:
    """A font ready to hand out glyph outlines in SVG user units."""

    def __init__(self, path, weight=None):
        self.font = TTFont(path)
        if weight is not None and "fvar" in self.font:
            # Pin the variable axis: a static instance keeps the outlines
            # honest instead of relying on the renderer to interpolate.
            self.font = instantiateVariableFont(self.font, {"wght": weight})
        self.upem = self.font["head"].unitsPerEm
        self.cmap = self.font.getBestCmap()
        self.glyphset = self.font.getGlyphSet()
        self.hmtx = self.font["hmtx"]

    def name_for(self, char):
        name = self.cmap.get(ord(char))
        if name is None:
            raise SystemExit(
                f"Zeichen {char!r} fehlt im Font — Text aendern oder Font wechseln."
            )
        return name

    def kerning_free_advance(self, char):
        return self.hmtx[self.name_for(char)][0]

    def text_paths(self, text, size, x, y, tracking=0.0):
        """Return (svg path data, total advance width) for `text`.

        `y` is the baseline. `tracking` is in em, like CSS letter-spacing.
        """
        scale = size / self.upem
        track = tracking * size
        pen_x = x
        parts = []
        for char in text:
            if char == " ":
                pen_x += self.kerning_free_advance(" ") * scale + track
                continue
            name = self.name_for(char)
            pen = SVGPathPen(self.glyphset)
            self.glyphset[name].draw(pen)
            d = pen.getCommands()
            if d:
                # SVG y grows downward, font y grows upward.
                parts.append(
                    f'<path d="{d}" transform="translate({pen_x:.2f} {y:.2f}) '
                    f'scale({scale:.6f} {-scale:.6f})"/>'
                )
            pen_x += self.kerning_free_advance(char) * scale + track
        return "".join(parts), pen_x - x - track

    def width(self, text, size, tracking=0.0):
        return self.text_paths(text, size, 0, 0, tracking)[1]


def group(paths, fill):
    return f'<g fill="{fill}">{paths}</g>'


def build_svg():
    acheria = Face(FONTS / "acheria-regular.woff2")
    # 600 for the tracked small caps: at 15px the 300..600 variable range
    # needs the top end to stay legible against paper.
    hanken = Face(FONTS / "hanken-normal-latin.woff2", weight=600)
    hanken_regular = Face(FONTS / "hanken-normal-latin.woff2", weight=400)

    margin = 96
    out = []

    # Eyebrow, top left.
    eyebrow_size = 15
    paths, _ = hanken.text_paths(
        CONTENT["eyebrow"], eyebrow_size, margin, margin + eyebrow_size, tracking=0.22
    )
    out.append(group(paths, CLAY_DEEP))

    # Claim, two lines, optically centred in the card's upper two thirds.
    claim_size = 74
    line_height = 104
    first_baseline = 276
    for i, line in enumerate(CONTENT["claim"]):
        paths, _ = acheria.text_paths(
            line, claim_size, margin, first_baseline + i * line_height, tracking=0.005
        )
        out.append(group(paths, INK))

    # Hairline above the brand block, the same 1px rule the site uses.
    rule_y = 446
    out.append(
        f'<rect x="{margin}" y="{rule_y}" width="{W - 2 * margin}" height="1" fill="{LINE}"/>'
    )

    # Brand name in the display face, sub line in tracked Hanken.
    brand_size = 32
    paths, _ = acheria.text_paths(
        CONTENT["brand"], brand_size, margin, rule_y + 66, tracking=0.045
    )
    out.append(group(paths, INK))

    sub_size = 13
    paths, _ = hanken.text_paths(
        CONTENT["brand_sub"], sub_size, margin, rule_y + 100, tracking=0.22
    )
    out.append(group(paths, INK_SOFT))

    body = "\n  ".join(out)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">\n'
        f'  <rect width="{W}" height="{H}" fill="{PAPER}"/>\n'
        f"  {body}\n"
        f"</svg>\n"
    )


def main():
    # Intermediate stays out of src/ so Eleventy never mistakes it for an asset.
    svg_path = ROOT / "tools" / "og.svg"
    jpg_path = ROOT / "src" / "og.jpg"
    svg_path.write_text(build_svg(), encoding="utf-8")

    # sharp ships with eleventy-img, so no extra dependency for the raster step.
    script = (
        "const sharp=require('sharp');"
        f"sharp('{svg_path}').jpeg({{quality:88,chromaSubsampling:'4:4:4'}})"
        f".toFile('{jpg_path}').then(i=>console.log('og.jpg',i.width+'x'+i.height,"
        "Math.round(i.size/1024)+' KB'));"
    )
    subprocess.run(["node", "-e", script], cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
