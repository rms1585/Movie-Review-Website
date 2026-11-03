# Design System — Limereel

**Status:** v0.1 working direction · **Date:** 2026-11-03
**Read with:** `SPEC.md` (what to build), `wireframes.html` (layout), `animation.md` (motion).
**Owner:** Product/UX decides visuals. The developer implements them exactly, using the tokens below.

> Rules for the developer:
> - Every colour, size, space, radius and duration comes from a **token** (a named CSS variable). **Never hardcode a visual value.**
> - If something you need isn't covered here, add a token and flag it, rather than inventing a one-off.

---

## 1. Design principles

1. **Content first.** Posters and backdrops are the colour on the page. The interface stays dark and quiet so the artwork leads.
2. **One accent, one job.** Signal lime is used only for **primary actions** and **our community score**. Never for decoration, never for body text.
3. **Glanceable decisions.** A visitor should know "is it good?" within 2 seconds of landing on a film: score, verdicts, then detail.
4. **Spoiler-safe is the brand.** The frosted spoiler block is the signature visual. It must look deliberate and premium, not like a broken image.
5. **Fast beats fancy.** If an effect costs load time or smoothness on a mid-range phone, cut it.
6. **Responsive website.** Desktop (~1280px) and mobile (~375px) are both first-class. See `wireframes.html` for both layouts of every screen.

---

## 2. Colour: "After Hours" (dark theme)

Dark-first. A light theme is out of scope for now (SPEC §3, Later), but tokens are named by **role**, so adding one later means redefining values, not renaming anything.

### 2.1 Core tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0E1116` | Page background |
| `--color-surface` | `#181C23` | Cards, panels, header |
| `--color-surface-raised` | `#222832` | Dialogs, sheets, dropdowns, hover on surface |
| `--color-border` | `#2C333E` | Dividers, card outlines, input borders |
| `--color-border-strong` | `#3D4552` | Hover borders, outlined buttons |
| `--color-text` | `#F2F2F0` | Primary text |
| `--color-text-muted` | `#9BA1A6` | Secondary text, metadata, captions |
| `--color-text-disabled` | `#5C636B` | Disabled labels (not used for anything that must be read) |
| `--color-accent` | `#C6F432` | Primary buttons, our score, focus ring, active states |
| `--color-accent-hover` | `#D4F75E` | Primary button hover |
| `--color-accent-pressed` | `#AFDB1F` | Primary button active/pressed |
| `--color-on-accent` | `#0E1116` | Text and icons on lime (never white on lime) |
| `--color-overlay` | `rgba(8, 10, 13, 0.72)` | Backdrop behind dialogs and sheets |
| `--color-scrim` | `linear-gradient(to top, #0E1116 0%, rgba(14,17,22,0.6) 45%, rgba(14,17,22,0) 100%)` | Over backdrops, so text on images stays readable |

### 2.2 Feedback tokens

| Token | Value | Use |
|---|---|---|
| `--color-error` | `#FF6B6B` | Error text, error borders, "Couldn't post" |
| `--color-error-surface` | `#2A1719` | Error banner background |
| `--color-warning` | `#F5B841` | Offline banner, warnings. **Small use only**: amber-on-dark at scale reads as IMDb |
| `--color-warning-surface` | `#2A2314` | Warning banner background |
| `--color-success` | `--color-accent` | Success reuses lime **plus a ✓ icon**, so success is never signalled by colour alone |

### 2.3 Score colours (critical distinction)

| Score | Style |
|---|---|
| **Our community score** | Lime fill (`--color-accent`), dark text (`--color-on-accent`), bold |
| **TMDB score** | No fill, 1px `--color-border-strong` outline, `--color-text-muted` text, with a "TMDB" label |
| **Not enough ratings** | Same style as the TMDB badge, text "Not enough ratings yet" |

The two scores must be distinguishable **without colour** too: filled vs outlined, plus the label.

### 2.4 Contrast (WCAG 2.1 AA, checked)

| Pair | Ratio | Pass for |
|---|---|---|
| `--color-text` on `--color-bg` | ~17:1 | All text |
| `--color-text-muted` on `--color-surface` | ~6.5:1 | All text |
| `--color-text-muted` on `--color-surface-raised` | ~5.7:1 | All text |
| `--color-accent` on `--color-bg` | ~14.8:1 | All text, focus ring |
| `--color-on-accent` on `--color-accent` | ~14.8:1 | Button labels, score |
| `--color-error` on `--color-bg` | ~6.8:1 | All text |
| `--color-error` on `--color-error-surface` | ~6.1:1 | Banner text |
| `--color-warning` on `--color-warning-surface` | ~8.8:1 | Banner text |

`--color-text-disabled` is intentionally below AA. Use it only for disabled controls, which WCAG exempts.

### 2.5 Avoid (distinctiveness)

- Yellow-on-black as a brand pairing (IMDb)
- Red as a brand or accent colour (Netflix, Rotten Tomatoes). Red only means **error**.
- Green/orange/blue dot motifs (Letterboxd)

---

## 3. Typography

**Fonts.** These are defaults the UX owner may change; both are free on Google Fonts:
- **Display / headings:** **Archivo**, a variable font. Use its width axis at `wdth 80` (slightly condensed) and weights 700–800. It gives film titles a poster-like punch.
- **Body / UI:** **Atkinson Hyperlegible Next**, weights 400, 500 and 600. It was designed by the Braille Institute so that easily confused characters (I, l, 1, O, 0) look clearly different, making it one of the most readable fonts for low-vision readers. It was chosen over Inter, Schibsted Grotesk, Instrument Sans and Onest in `font-compare.html`. Archivo carries the brand personality; the body font carries readability.
- Load with `font-display: swap`, and only the weights listed. Each extra weight adds load time.

### 3.1 Type scale

The scale steps by about 1.25× or more between heading levels, so the hierarchy is clear.

| Token | Size / line-height | Font | Use |
|---|---|---|---|
| `--text-display` | 48 / 52 (desktop) · 32 / 36 (mobile) | Archivo 800 | Hero film title |
| `--text-h1` | 36 / 42 (desktop) · 26 / 32 (mobile) | Archivo 800 | Film title on detail, page titles |
| `--text-h2` | 24 / 30 (desktop) · 20 / 26 (mobile) | Archivo 700 | Section titles ("Top verdicts", rails) |
| `--text-h3` | 18 / 24 | Atkinson Hyperlegible Next 600 | Card titles, dialog titles |
| `--text-verdict` | 20 / 28 (desktop) · 17 / 24 (mobile) | Atkinson Hyperlegible Next 600, italic off | One-line verdict pull-quotes |
| `--text-body` | 16 / 26 | Atkinson Hyperlegible Next 400 | Review text, plot |
| `--text-ui` | 14 / 20 | Atkinson Hyperlegible Next 500 | Buttons, chips, inputs, metadata |
| `--text-caption` | 12 / 16 | Atkinson Hyperlegible Next 500 | Badges, counters, timestamps |

Rules:
- Body text never goes below 16px, and review text is never smaller than plot text.
- Line length for reviews and plot: **max 70ch**.
- Film titles may truncate to 2 lines on cards (with an ellipsis); the full title goes in the `title` attribute.
- No all-caps body. All-caps is allowed only for `--text-caption` labels, with 0.04em letter spacing.

---

## 4. Spacing, layout and shape

### 4.1 Spacing scale (4px base)

`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 20 · `--space-6` 24 · `--space-8` 32 · `--space-10` 40 · `--space-12` 48 · `--space-16` 64

- Inside cards, panels and buttons: at least `--space-3`. Text never touches a container edge.
- Between page sections: `--space-10` (desktop), `--space-8` (mobile).

### 4.2 Layout

| Token | Value |
|---|---|
| `--content-max` | 1120px (content column, centred) |
| `--gutter` | 16px (mobile) · 32px (≥ 768px) |
| `--sidebar-w` | 300px (detail and reviews side panel) |
| `--filters-w` | 220px (browse filters) |

**Breakpoints:** `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. The desktop layouts in `wireframes.html` start at **768px**.

**Grids:**
- Browse posters: 3 columns (mobile) → 4 (`md`) → 5 (`lg`+).
- Rails: horizontal scroll, about 3 visible cards on mobile and about 7 on desktop.

### 4.3 Shape and elevation

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Badges, posters in rows |
| `--radius-md` | 10px | Cards, inputs, buttons |
| `--radius-lg` | 16px | Dialogs, panels |
| `--radius-sheet` | 20px 20px 0 0 | Mobile bottom sheet |
| `--radius-pill` | 999px | Chips, search bar |

**Elevation on dark** comes from **lighter surfaces**, not shadows: bg → surface → surface-raised. A single soft shadow is allowed on floating layers only (dropdowns, dialogs, toasts): `--shadow-float: 0 12px 32px rgba(0,0,0,0.45)`.

### 4.4 Image ratios

| Image | Ratio | Note |
|---|---|---|
| Poster | 2:3 | Always reserve the space, so nothing jumps when it loads |
| Backdrop | 16:9 (mobile) · fixed 380–420px height, cropped (desktop) | Always under `--color-scrim` when text sits on it |
| Avatar / cast | 1:1, circle | |

---

## 5. Images from TMDB

- **Always request the smallest size that fits.** TMDB sizes: posters `w92, w154, w185, w342, w500, w780`; backdrops `w300, w780, w1280`; profiles `w45, w185`.
- Use `srcset` and `sizes`, so phones never download desktop images.
- **Placeholders:** before an image loads, show its box in `--color-surface` with the correct ratio. Fade the image in (see `animation.md`).
- **Missing poster:** show a `--color-surface-raised` box with the film title in `--text-ui`. Never a broken-image icon.
- Lazy-load everything below the fold. The hero backdrop and the detail poster load eagerly.
- **Alt text:** the poster's alt is "{Title} poster". Decorative backdrops use `alt=""`.

---

## 6. Iconography

- **One** outline icon set, 1.5px stroke, sized 16 / 20 / 24. Suggested: **Lucide**. That's a new dependency, so it needs the UX owner's approval.
- Icons sit next to a text label wherever space allows. Icon-only buttons (close, avatar) must have an `aria-label`.

---

## 7. Components

Every interactive component defines **default, hover, focus-visible, active/pressed, disabled**, plus **loading** where it triggers a request.

**Focus ring (all components):** a 2px `--color-accent` outline with a 2px offset. Never remove it, never rely on hover alone.
**Touch targets:** at least 44 × 44px on mobile, even when the visual element is smaller.

### 7.1 Buttons

| Variant | Default | Hover | Pressed | Disabled |
|---|---|---|---|---|
| **Primary** (Rate, Post, Log in) | lime fill, `--color-on-accent` text | `--color-accent-hover` | `--color-accent-pressed` + scale 0.97 | 40% opacity, no hover |
| **Secondary** (Watchlist, Seen it, Cancel) | transparent, 1px `--color-border-strong`, text colour | `--color-surface-raised` fill | scale 0.97 | 40% opacity |
| **Ghost / link** (See all, Edit) | text only, underline on hover | underline | — | muted |

- Height 44px (md) or 36px (sm). Padding `--space-3` / `--space-5`. `--radius-md`. Label `--text-ui` 600.
- **Loading:** keep the width fixed, swap the label for a small spinner plus a visually hidden "Posting…" for screen readers, and disable it.
- **Toggled** (✓ Watchlist, ✓ Seen): secondary style with a lime ✓ icon and `aria-pressed="true"`.
- **Only one primary button per view** (Rate on detail, Post on write review).

### 7.2 Score badges
See §2.3.
- **Large** (detail): `--text-h3`, padding 6/12, `--radius-sm`, with the vote count in `--text-caption`.
- **Small** (cards): `--text-caption`, padding 2/6.
- Format: one decimal for averages (`8.4`), integers for a person's score (`8`). Vote counts abbreviate above 999 (`1.2k`).

### 7.3 Poster card
- Poster (2:3, `--radius-sm`) → title (`--text-ui` 600, max 2 lines) → year · our score badge · TMDB badge.
- The whole card is one link (one tab stop).
- Hover (desktop): lift and brighten the poster; see `animation.md`. Focus: ring around the poster.
- Skeleton: poster box + 2 text bars in `--color-surface`.

### 7.4 Rails
- A section title (`--text-h2`) with a "See all" ghost link on the right.
- Horizontal scroll with snap points. On desktop, arrow buttons appear on hover. The keyboard can scroll it.

### 7.5 Header
- Sticky, `--color-surface` at 90% opacity with a background blur, and a 1px bottom border.
- Desktop: logo · Home · Browse · search (centred, max 520px) · Log in / avatar. Mobile: logo · Browse · Log in, with search on its own row.
- **Search:** pill shape, `--color-bg` fill, 1px border, lime border when focused. Suggestions open in a `--color-surface-raised` dropdown with `--shadow-float`.

### 7.6 Chips (genre, sort, filters)
- Pill, 32px high, 1px border. **Selected:** lime border + lime text (not a lime fill, which is reserved for primary actions and our score).

### 7.7 Rating control (1–10)
- 10 square buttons: one row on desktop, 2 × 5 on mobile. Each is 44px or larger.
- Semantics: `role="radiogroup"` with radios. Arrow keys move the selection, and the number keys 1–9 plus 0 (= 10) select directly.
- Selected: lime fill, `--color-on-accent` text. Hover: `--color-surface-raised`.
- After selecting, "Saved ✓" appears next to the label (polite live region).

### 7.8 Spoiler block (signature)
- The text sits behind a **frosted layer**: content blurred (12px), with a `--color-surface` tint at 40%.
- Centred inside it: an eye-off icon, the label "Contains spoilers", and a secondary button "Reveal".
- Reveal → an inline confirm ("Reveal spoiler?" with Cancel / Reveal) → content shown.
- Blurred content is hidden from screen readers (`aria-hidden`) until it's revealed. The button reads "Reveal spoiler in Mia's review".
- "I've seen it" or Seen ✓ reveals every spoiler on that film for this user.

### 7.9 Review card
- `--color-surface`, `--radius-md`, `--space-4` padding.
- Meta row: avatar 28px · name (`--text-ui` 600) · score badge (small) · time (`--text-caption` muted).
- Verdict (`--text-verdict`) → body (`--text-body`, collapsed to 4 lines with "Read more").
- Footer: Helpful (count) · Report spoiler, as ghost buttons in `--text-caption`.
- **My review:** the same card with a 1px `--color-accent` border and a "Your review" label, pinned first.

### 7.10 Verdict quote (Top verdicts)
- A 3px lime left rule, `--text-verdict`, with the attribution below in `--text-caption` muted.

### 7.11 Dialog (desktop) / Bottom sheet (mobile)
- `--color-surface-raised`, `--radius-lg` (dialog) or `--radius-sheet` (sheet), `--shadow-float`, over `--color-overlay`.
- Dialog: 420px wide, centred. Sheet: full width, with a drag handle.
- Focus is trapped inside, Esc closes it, and focus returns to the button that opened it. The title is linked with `aria-labelledby`.

### 7.12 Toast
- `--color-surface-raised` with a lime ✓ icon. Bottom-right on desktop, bottom full-width on mobile.
- Auto-dismisses after 4s, pauses on hover or focus, and is announced via `role="status"`.

### 7.13 Banners (offline, post failed)
- Full-width inside the content column, with an icon, a message and an optional action. Uses the error and warning surfaces from §2.2.

### 7.14 Skeletons
- `--color-surface` blocks with the exact shape of the content they replace. Shimmer is defined in `animation.md`.

### 7.15 Empty states
- A centred icon, a title (`--text-h3`), one muted line, and **one next action**. Never a dead end.

### 7.16 Footer
- `--color-bg` with a top border. The TMDB logo is placed per TMDB's brand rules, alongside the notice *"This product uses the TMDB API but is not endorsed or certified by TMDB."*, followed by About · Terms · Privacy.

---

## 8. Accessibility checklist (WCAG 2.1 AA)

- [ ] Every colour pair meets §2.4. Nothing relies on colour alone (scores, success, selection).
- [ ] Visible lime focus ring on everything focusable.
- [ ] The full flow works by keyboard: search → film → rate → review → post.
- [ ] Headings follow order (h1 → h2 → h3) on every page.
- [ ] Dialogs trap focus and return it on close.
- [ ] Live regions for "Saved ✓", toasts and form errors.
- [ ] Touch targets ≥ 44px.
- [ ] `prefers-reduced-motion` honoured (see `animation.md`).
- [ ] Zooming to 200% doesn't break the layout.

---

## 9. Implementation notes

- Define all tokens as CSS variables in **one** stylesheet (`src/app/styles.css`), and map Tailwind's theme to those variables. Components use the Tailwind names or the variables, **never raw hex or px values**.
- Name tokens by role (`--color-surface`), not by appearance (`--dark-grey`).
- Build components once and reuse them. A new variant means updating the component, not copying it.

---

## 10. Do / Don't

| Do | Don't |
|---|---|
| Let posters provide the colour | Add gradients or decorative colour to the UI chrome |
| Use lime for the primary action and our score | Use lime for links, icons or headings |
| Show both scores with different styles | Show a TMDB score styled like ours |
| Reserve image space before it loads | Let content jump as posters arrive |
| Give every empty state a next action | Show "Nothing here" with no way forward |
| Keep one primary button per view | Put two lime buttons side by side |
