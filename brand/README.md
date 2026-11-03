# Limereel brand assets

The logo files for the build. Concept history: `../logo-concepts.html`. Colours and fonts: `../design.md`.

> Status: **working logo**, good enough to build with. A designer will refine it before launch. Swapping files here later must not need code changes, so always reference these files or the component below rather than copying the shapes.

## Files

| File | Use |
|---|---|
| `limereel-symbol.svg` | The slice-reel symbol in `currentColor`. **Inline it** (as a React component), so CSS sets the colour. |
| `limereel-symbol-lime.svg` | Lime symbol for `<img>` use on dark backgrounds (an `<img>` can't inherit colour) |
| `limereel-symbol-ink.svg` | Dark symbol for `<img>` use on light backgrounds |
| `favicon.svg` | Browser tab icon: lime symbol on a dark rounded square |

## The logo: horizontal lockup

The logo is the **symbol + the word "limereel"**, side by side. It is built in code, not as one image:

```
[symbol]·limereel
```

| Part | Spec |
|---|---|
| Symbol | `limereel-symbol.svg` inline, colour `--color-accent` (lime) |
| Wordmark | The text `limereel`, lowercase, **Archivo 800**, `font-variation-settings: "wdth" 78`, letter-spacing `-0.01em`, colour `--color-text` |
| Size | Symbol height = **1.15 ×** the wordmark font size (header: 28px symbol, 24px text) |
| Gap | **0.18 ×** the symbol height (header: 5px). Scale it with size; don't fix it in px |
| Alignment | Symbol vertically centred on the wordmark's x-height |
| Link | The whole lockup links to Home, with `aria-label="Limereel home"` |

**Why the wordmark is live text, not an image:** an SVG loaded through `<img>` can't use web fonts, so a text-in-SVG logo would fall back to Arial. Live text in Archivo (already loaded for headings) renders correctly and stays sharp. The designer will later supply an outlined version (letters converted to shapes) for places with no web fonts, like social preview images and emails.

## Where each version goes

| Place | Version |
|---|---|
| Site header (desktop and mobile) | Lockup |
| Footer | Lockup, smaller (20px symbol) |
| Browser tab | `favicon.svg` |
| Apple touch icon, PWA icon, social avatar | `favicon.svg` exported to PNG at 180, 192 and 512px during the build |
| Loading screens, empty states | Symbol only |

## Rules

- **Minimum sizes:** symbol 16px, lockup 96px wide.
- **Clear space:** keep at least half the symbol's width empty around the lockup.
- **Colours:** lime symbol + light text on dark backgrounds (default), or all-ink on light backgrounds. Nothing else.
- **Don't** stretch, rotate, recolour the segments separately, add shadows or gradients, or put the logo on busy poster or backdrop images without a dark scrim.
- **Motion:** `animation.md` covers any logo animation. The logo never loops or spins.
