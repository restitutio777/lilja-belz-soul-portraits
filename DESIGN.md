# DESIGN.md, Lilja Belz, Soul Portraits

## Theme
Warm paper light theme. Scene: a person in soft daylight by a window, unhurried, gently
seen. Calm and intimate, never clinical. Not dark.

## Color (OKLCH)
| Role | Token | Value |
|---|---|---|
| Paper background | --paper | oklch(0.972 0.008 75) |
| Paper raised | --paper-2 | oklch(0.948 0.012 72) |
| Ink (text) | --ink | oklch(0.255 0.014 55) |
| Ink soft | --ink-soft | oklch(0.435 0.018 52) |
| Hairline | --line | oklch(0.86 0.012 68) |
| Accent clay | --clay | oklch(0.585 0.088 44) |
| Accent clay deep (small text) | --clay-deep | oklch(0.5 0.092 42) |
| Deep band | --night | oklch(0.255 0.02 52) |

Strategy: restrained, warm tinted neutrals plus one earthy clay accent. One deep band
(About) for rhythm and intimacy. Never pure #000 or #fff.

## Typography
- Display: Fraunces (variable, optical sizing), weights 300 to 400, tight tracking.
- Body and labels: Hanken Grotesk, 300 to 600.
- Eyebrows: 0.74rem, uppercase, 0.22em tracking, clay-deep.
- Body measure capped near 60ch. Fluid scale via clamp(), contrast >= 1.25 between steps.

## Layout
- Centered shell, max 1240px, fluid side padding.
- Asymmetric hero (text / tall 4:5 portrait).
- Portfolio: CSS columns masonry, 3 / 2 / 1 across breakpoints.
- Ablauf: numbered editorial rows with hairline dividers, large serif numerals (no cards).
- Raum: asymmetric editorial collage, copy plus a square detail stacked beside one tall image.
- About: deep band, photo plus text plus pull quote.
- Beratung: two columns, definition list of facts (no cards).
- Generous, varied vertical rhythm.

## Motion
- Scroll reveal: opacity and translateY, ease-out-expo, gentle stagger. No layout animation.
- Image hover: subtle scale plus desaturate to full color.
- Sticky header gains paper background and hairline on scroll.
- Scroll spy: the header nav marks the section in view with a quiet clay hairline.
- Full prefers-reduced-motion support.

## Image treatment
Unify mixed source photos with a subtle warm desaturation baseline; restore full color on
hover in the gallery. Adds a quiet, fine art cohesion.

## Bans honored
No side-stripe borders, no gradient text, no decorative glassmorphism, no hero-metric
template, no identical icon-card grids, no modals, no em dashes in copy.
