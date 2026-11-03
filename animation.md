# Animation & Motion — Limereel

**Status:** v0.1 · **Date:** 2026-11-03
**Read with:** `design.md` (tokens, components), `SPEC.md` (flows), `wireframes.html` (layouts).

> Goal: the site should feel **swift and smooth**. Motion explains what just happened (this poster *became* this page, this rating *was saved*). It never makes anyone wait.

---

## 1. Principles

1. **Fast first.** Most animations run 150–300ms. Nothing blocks navigation or input while it plays.
2. **Purposeful.** Every animation does one of three jobs: show **where something came from**, **confirm an action**, or **soften a change of state**. If it does none of these, cut it.
3. **Interruptible.** A user can click, scroll or go back mid-animation, and the animation follows instead of finishing first.
4. **Cheap to render.** Animate only `transform` (move, scale) and `opacity`. These stay smooth on mid-range phones. The few exceptions are listed in §6.
5. **Respect reduced motion.** When users ask their device for less motion, movement becomes a simple fade or nothing (§5).
6. **Consistent.** All timing comes from the motion tokens in §3. No one-off durations.

---

## 2. Tools

| Tool | Use it for |
|---|---|
| **Motion** (`motion`, formerly Framer Motion) | The poster → detail shared-element transition, page transitions, the dialog/sheet, toasts, rating feedback, tab underline, list enter/exit. **Approved as a dependency.** |
| **Plain CSS transitions** | Hover and press states on buttons, cards and chips; focus; colour changes. Cheaper than JavaScript for simple state changes. |
| **CSS keyframes** | Skeleton shimmer, spinner. |

Setup rules:
- Load Motion lightly: use `LazyMotion` with the `domAnimation` feature set and the lightweight `m.*` components, so it doesn't slow the first page load. Add `domMax` only on routes that need layout animations (shared-element transitions).
- Wrap the app in `<MotionConfig reducedMotion="user">`, so Motion respects the OS setting automatically.
- Put motion tokens (§3) in one module and import them. Never type durations or easings inline.

---

## 3. Motion tokens

### 3.1 Durations

| Token | ms | Use |
|---|---|---|
| `--motion-instant` | 100 | Colour and opacity on hover/press, focus |
| `--motion-fast` | 150 | Buttons, chips, card hover lift, dropdown open |
| `--motion-base` | 220 | Page content enter, toast, tab underline |
| `--motion-slow` | 320 | Dialog/sheet, spoiler reveal, shared poster → detail |
| `--motion-image` | 400 | Image fade-in after load |

**Exits are faster than entrances:** about 70% of the entrance duration. Things leave quickly so they never block the next thing.

### 3.2 Easings

| Token | Curve | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Most movement |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Things appearing (decelerate in) |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving (accelerate out) |
| `--ease-linear` | `linear` | Shimmer, spinner only |

### 3.3 Springs (Motion)

| Name | Config | Use |
|---|---|---|
| `spring.snappy` | `{ type: "spring", stiffness: 500, damping: 34 }` | Rating pop, toggles, press feedback |
| `spring.smooth` | `{ type: "spring", stiffness: 300, damping: 32 }` | Shared poster → detail, sheet slide-up, tab underline |
| `spring.gentle` | `{ type: "spring", stiffness: 180, damping: 26 }` | Toast enter |

Springs should **not visibly bounce** on large elements. A slight settle is fine on small ones (rating number, ✓).

### 3.4 Distances

| Token | Value | Use |
|---|---|---|
| `--move-xs` | 4px | Hover lift, dropdown enter |
| `--move-sm` | 8px | Page content enter, toast enter |
| `--move-md` | 16px | Banner enter |
| Sheet | 100% of its height | Mobile sheet from the bottom |

---

## 4. Animation catalogue

Each entry: **trigger → what moves → timing → notes.**

### 4.1 Poster → movie detail (signature transition)
- **Trigger:** clicking a poster card (from Home rails, Browse, Search results or Similar films).
- **What moves:** the clicked poster **grows and travels** into the detail page's poster position. The rest of the detail page fades in around it (opacity 0 → 1, `--move-sm` up).
- **Timing:** poster `spring.smooth` (about 320ms). Surrounding content `--motion-base`, starting 60ms after the poster begins.
- **How:** Motion `layoutId={"poster-" + tmdbId}` on both posters (shared-element / layout animation).
- **Fallbacks:**
  - Direct link, refresh, or the poster not on screen: no shared motion, just the standard page enter (§4.2).
  - Back navigation: the reverse (detail poster → card), but only if the card is still on screen. Otherwise fade.
- **Don't** wait for the detail data before starting. The poster moves immediately, using the image already loaded, and the details fill in as skeletons or content.

### 4.2 Page transitions (all other navigation)
- **Enter:** content opacity 0 → 1 and translateY `--move-sm` → 0, `--motion-base`, `--ease-enter`.
- **Exit:** opacity 1 → 0, `--motion-fast` × 0.7, no movement.
- The header and footer **don't animate**. They stay put, so the site feels stable.
- Restore scroll position on Back. Scroll to the top on new pages.

### 4.3 Header search suggestions
- **Open:** dropdown opacity 0 → 1, translateY −`--move-xs` → 0, `--motion-fast`.
- **Items:** stagger 20ms each, 5 items maximum. Never re-stagger while typing; only the first open staggers.
- **Close:** opacity only, 100ms.
- The search input's focus border animates its colour over `--motion-instant`.

### 4.4 Poster cards & rails (hover/press)
- **Hover (pointer devices only, `@media (hover: hover)`):** poster `translateY(-4px) scale(1.03)` plus slightly brighter, `--motion-fast`, `--ease-standard`.
- **Press:** `scale(0.97)`, `--motion-instant`.
- **Rails:** native horizontal scroll with `scroll-snap`. On desktop, arrow buttons scroll by one "page" with `behavior: "smooth"`.
- **Don't** animate cards entering on scroll ("fade-in on scroll"). It slows browsing and costs smoothness.

### 4.5 Images
- Posters and backdrops fade in when loaded: opacity 0 → 1, `--motion-image`. Their box is already sized (see `design.md` §4.4), so nothing shifts.
- Cached images (already loaded) show **instantly**, without a fade.

### 4.6 Skeleton shimmer
- A soft highlight sweeps across skeleton blocks: a gradient translating from −100% to 100%, 1.4s, `--ease-linear`, infinite.
- The highlight is at most 6% lighter than `--color-surface`. It should be subtle, not flashing.
- **Reduced motion:** no sweep. Use a static block, or opacity pulsing between 0.6 and 1 over 2s.

### 4.7 Rating control (1–10)
- **Select:** the chosen number scales 1 → 1.15 → 1 with `spring.snappy`, and its fill changes to lime over `--motion-instant`.
- **"Saved ✓":** fades in and moves up from `--move-xs`, `--motion-fast`, appearing **only after the server confirms**. If the save fails, show the error state (no ✓).
- **Changing rating:** the previous selection fades back to default over `--motion-instant`.

### 4.8 Spoiler reveal (signature)
- **Reveal → confirm:** the "Reveal" button crossfades into the "Reveal spoiler? Cancel / Reveal" confirm, `--motion-fast`.
- **Confirmed reveal:** the content's blur animates 12px → 0 while the frosted cover fades out, over `--motion-slow` with `--ease-standard`.
- **"I've seen it" toggle:** every spoiler on the page reveals the same way, staggered 40ms (maximum 6 staggered, the rest reveal together).
- Animating blur is one of the allowed exceptions (§6), because it's a single small element at a time.
- **Reduced motion:** a plain crossfade, blurred → clear, 150ms, no blur animation.

### 4.9 Buttons & toggles
- **Hover:** background or border colour, `--motion-instant`.
- **Press:** `scale(0.97)`, `--motion-instant`, then release.
- **Toggle on** (+ Watchlist → ✓ Watchlist, Seen it → ✓ Seen): the icon swaps with a quick scale (0.6 → 1, `spring.snappy`) and the label crossfades.
- **Loading:** the label crossfades to a spinner. The button never changes width.

### 4.10 Helpful vote
- The count ticks up or down with a vertical number roll: the old number exits upward and the new one enters from below, `--motion-fast`.
- The button gets a brief `spring.snappy` press.

### 4.11 Login dialog (desktop) / sheet (mobile)
- **Backdrop:** opacity 0 → 1, `--motion-base`.
- **Desktop dialog enter:** opacity 0 → 1 and scale 0.96 → 1, `--motion-slow`, `--ease-enter`. Exit: opacity plus scale to 0.98, about 200ms.
- **Mobile sheet enter:** translateY 100% → 0 with `spring.smooth`. Exit: slide down at about 220ms. Dragging the handle down past 30% of its height, or flicking down, dismisses it.
- Focus moves into the dialog **after** the enter animation starts. Don't wait for it to finish.

### 4.12 "Signing you in…" (return from hosted login)
- A simple spinner (0.9s per turn, linear) with a text label, fading in after **300ms**, so fast sign-ins never flash it.
- On completion: the page content fades in, then the toast confirms the completed action (§4.13).

### 4.13 Toast
- **Enter:** translateY `--move-sm` → 0 and opacity 0 → 1, `spring.gentle`.
- **Exit:** opacity plus translateY 4px down, about 160ms.
- **Stacking:** a new toast pushes older ones up (layout animation, `spring.smooth`). Show 3 at most.
- **Timing:** auto-dismisses after 4s, paused while hovered or focused.

### 4.14 Tabs (profile) & sort chips
- The active tab underline **slides** to the new tab (Motion `layoutId="tab-underline"`, `spring.smooth`).
- The tab panel content crossfades, `--motion-fast`.
- Sort chips change colour over `--motion-instant`. The review list reorders with a layout animation (`spring.smooth`), 20 items at most. Larger lists just swap.

### 4.15 Banners (offline, post failed)
- **Enter:** height auto-expand plus opacity, `--motion-base` (Motion `AnimatePresence` with height animation). Height is the one allowed layout animation here, because the banner pushes content down deliberately.
- **Exit:** reverse, `--motion-fast`.

### 4.16 My review appearing after posting
- Returning to the detail page, the newly pinned "Your review" card enters with opacity plus translateY `--move-sm` and a lime border, which settles to its normal border over 1.2s, so the eye finds it.

### 4.17 Hero (home)
- The backdrop fades in (§4.5). **No** Ken Burns zoom, parallax or autoplaying video. They cost data and smoothness and distract from the content.

---

## 5. Reduced motion (`prefers-reduced-motion: reduce`)

| Normal | Reduced |
|---|---|
| Movement (translate, scale, shared-element) | Removed. Opacity crossfade at 150ms, or instant |
| Spring pops (rating, toggles) | Instant state change |
| Blur animation (spoiler) | 150ms crossfade |
| Skeleton shimmer | Static, or slow opacity pulse |
| Spinner | Static icon plus "Loading…" text |
| Smooth scroll on rail arrows | Instant jump |

- Motion handles its part via `MotionConfig reducedMotion="user"`. CSS animations must also be wrapped in `@media (prefers-reduced-motion: reduce)`.
- **Never remove the information**, only the motion. "Saved ✓" still appears, toasts still show.

---

## 6. Performance rules

1. Animate **only `transform` and `opacity`**. Allowed exceptions:
   - `filter: blur` on **one spoiler block at a time** (§4.8)
   - `height` for banners (§4.15)
   - Motion `layout` / `layoutId` animations (shared poster, tab underline, toast stack, review reorder)
2. **Never animate** `width`, `top`, `left`, `margin`, `box-shadow` or `background-position` on large areas. (The skeleton shimmer uses a translated pseudo-element, not `background-position`.)
3. `will-change` only during an animation, never left on permanently.
4. **No scroll-linked animations** in MVP (parallax, scroll-triggered reveals).
5. **Navigation is never delayed** by an exit animation by more than about 100ms.
6. **Target:** 60fps on a mid-range Android phone. Test in Chrome DevTools with **4× CPU throttling**, and if a transition drops frames there, simplify it.
7. Prefetch a film's data when the user hovers its card on desktop or it enters the screen on mobile, so the shared-element transition lands on real content.

---

## 7. Don'ts

- Don't bounce large elements or anything carrying text.
- Don't stagger long lists (more than 6 items) or re-stagger on every update.
- Don't autoplay trailers or video.
- Don't animate on page load beyond the image fade-ins.
- Don't let an animation hide an error. If the action failed, show the error, not a ✓.
- Don't use motion as the only signal. Every state change also has a visual or text state.

---

## 8. Definition of done (motion)

- [ ] All durations, easings and springs come from the tokens in §3.
- [ ] Poster → detail shared transition works from every poster source, with fallbacks for direct links and Back.
- [ ] Every interactive component has hover, press and focus feedback (CSS, `--motion-instant` / `--motion-fast`).
- [ ] Reduced motion tested by switching the OS setting on: no movement, all information still shown.
- [ ] 4× CPU throttle test: no visible jank on poster → detail, sheet, or spoiler reveal.
- [ ] No animation delays clicks, typing or navigation.
