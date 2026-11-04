# Limereel — Product Spec

**Status:** Ideation complete · wireframes v0.2, design.md and animation.md done · **Date:** 2026-11-03
**Owner:** Product/UX (the user). The development agent owns technical decisions.
**Companion files:** `wireframes.html` (layouts) · `design.md` (visual system) · `animation.md` (motion) · `brand/` (logo files + usage in `brand/README.md`).
**Stack (decided):** SELISE Blocks standard: React 18, TypeScript, Vite, Tailwind, TanStack Query, `@seliseblocks/client`, plus **Motion** for animation. Known trade-off: a single-page app, so weaker Google indexing than server rendering; accepted for the MVP.

> This spec covers *what* to build and *why*. It is not a visual design. Wherever this file and a
> later wireframe disagree, the wireframe wins.

---

## 1. Product in one line

A responsive movie website (desktop and mobile) for **English-language films**. People search for a film, read its details and reviews, and, once logged in, rate it, review it and track it. Its signature feature: **spoiler-safe reviews**.

It's the same kind of product as IMDb, but its own brand. **Do not use IMDb's name, logo, colours or layout.**

---

## 2. Personas

| Persona | Who | Goal | Implication |
|---|---|---|---|
| **Maya**, "what should I watch tonight?" | Casual viewer, phone, evenings | Pick a good film in under 5 minutes | Fast search, glanceable score, one-line verdicts, trailer. **Everything readable without login.** |
| **Daniel**, active reviewer | Film enthusiast, 3–4 films a week | Record his opinions and be read | Quick rating, spoiler tag, helpful votes, profile history |
| **Priya**, spoiler-wary fan | Waits for big releases | Judge a film without spoilers | Spoilers hidden by default; "Seen it" reveals them |

**Rule that follows:** ask for login only at the moment someone rates, reviews, votes, saves or marks a film as seen. Never for browsing or reading.

---

## 3. Scope

### MVP (build first)
- Home (trending, new releases, top rated)
- Search with live suggestions
- Browse by genre / year / top rated
- Movie detail page
- Sign up / log in (Blocks IAM hosted login)
- Rate a film (1–10)
- One-line verdict + optional long review, with a spoiler toggle
- Read reviews (spoilers blurred by default)
- TMDB credit in the footer

### Next
- Watchlist
- "Seen it" (auto-reveals spoilers for that film)
- "Helpful" votes on reviews (sort by most helpful)
- "Report spoiler" on reviews
- User profile (my ratings, my reviews, watchlist)
- Edit / delete own review

### Later (not now)
- Taste match ("users who rate like you loved…")
- User-made lists, following reviewers
- Light theme

---

## 4. Movie data: TMDB

- **Source:** [TMDB API](https://developer.themoviedb.org/). All film metadata (title, poster, backdrop, plot, cast, crew, genres, runtime, release date, trailer, TMDB rating) comes from TMDB. **We do not store our own copy of the film catalogue.**
- **Our own data** is only what users create: ratings, reviews, votes, watchlist, seen-it, reports (section 6).
- **Join key:** the TMDB movie id.
- **Attribution (required):** the footer shows the TMDB logo and this notice: *"This product uses the TMDB API but is not endorsed or certified by TMDB."* Follow TMDB's logo guidelines.
- **Licence:** TMDB is free for non-commercial use. **Any monetisation (ads, subscriptions) needs a TMDB commercial agreement first.**
- **API key security:** the TMDB key must **never** be in the browser bundle. `VITE_*` variables are public. Send TMDB calls through a server-side layer that adds the key (a Blocks Logic proxy, or a function). The dev agent decides which.

### 4.1 Catalogue rule (the "English only" filter)

A film is shown **only if both** of these hold:
1. `original_language === "en"`
2. **No** production country is India (`IN`)

- UK, Canadian, Australian and other English-language films **are included**. This is **not** US-only.
- The rule must be **one config value** (language + excluded countries), because it is expected to change later.
- **The filter applies everywhere** films appear: search, suggestions, browse, home rails, "similar films", and direct URLs. A direct link to an excluded film shows the "not in our catalogue" state, not the film.
- **Technical note for dev:** search results include `original_language` but not production countries, which are only on the detail record. Pick an approach that keeps search fast, and confirm TMDB's current parameters at build time instead of relying on this note. Options: language-filter the results immediately and check country on detail; enrich and cache; or use the discover endpoints where they fit.

---

## 5. Site map and routes

```
/                      Home
/search?q=             Search results
/browse                Browse (genre / year / top rated / new)
/movie/:tmdbId         Movie detail
/movie/:tmdbId/reviews All reviews for a film
/movie/:tmdbId/review  Write / edit my review   (login required)
/login/callback        Hosted-login return       (handled by Blocks auth)
/me                    My profile               (login required)
/me/watchlist          My watchlist             (login required)
/u/:username           Public profile of a reviewer
```

The global header has the logo, a search bar, Browse, and Log in or the user's avatar.
The global footer has the TMDB credit, About, Terms and Privacy.

---

## 6. Data model (user-generated data only)

All records are keyed by `tmdbMovieId` + `userId`. Field limits are defaults and may change.

| Entity | Fields | Rules |
|---|---|---|
| **Rating / Review** (one record) | `userId`, `tmdbMovieId`, `score` (int 1–10, required), `verdict` (≤ 120 chars, optional), `body` (≤ 5,000 chars, optional), `hasSpoilers` (bool), `helpfulCount`, `createdAt`, `updatedAt` | **One per user per film.** Rating again updates the existing record. A rating alone is valid. |
| **HelpfulVote** | `userId`, `reviewId`, `createdAt` | One per user per review. No voting on your own review. Can be undone. |
| **WatchlistItem** | `userId`, `tmdbMovieId`, `addedAt` | Unique per user + film. |
| **SeenItem** | `userId`, `tmdbMovieId`, `seenAt` | Unique per user + film. Seen → spoilers on that film auto-reveal for this user. |
| **SpoilerReport** | `reporterId`, `reviewId`, `createdAt` | One per user per review. Moderation is out of MVP scope; just store the reports. |

**Community score** = mean of all `score` values for a film, shown with its vote count. Hide it below **3 ratings** and show "Not enough ratings yet" instead.

**Access (dev to design):**
- Reviews, scores and public profiles must be **readable by logged-out visitors**. Note that this repo's Blocks rules lock schemas to access level User by default, so anonymous reads need a deliberate solution.
- Only the author can edit or delete their review. Watchlist and seen-it are private to their owner.
- Validate every limit above **on the server**, not just in the form.

---

## 7. Screens

Every screen handles **loading, empty, error and success**. Interactive elements also handle **hover, focus, active and disabled**.

### 7.1 Home
- Hero: a carousel of 6 featured trending films, one every 7s, with pause, arrows and dots (backdrop, title, our score, CTA to the detail page)
- Rails: Trending now · New releases · Top rated by our community · Browse by genre chips
- Loading: skeleton cards · Error: "Movie info is taking a break, try again shortly" + Retry

### 7.2 Search
- Live suggestions after 2+ characters (debounced), showing poster thumb, title and year
- Results: poster, title, year, our score, TMDB score
- **Empty:** "No films match '…'" + Trending suggestions
- **Excluded title:** "We focus on English-language films, so this title isn't here." + Trending · Browse genres

### 7.3 Browse
- Filters: genre, release year/decade, sort (top rated / newest / most reviewed)
- Paginated or infinite grid of poster cards

### 7.4 Movie detail (the most important screen; every flow passes through it)
Content, in priority order:
1. Poster, title, year, runtime, genres
2. **Scores:** our community score (accent colour, with vote count) + TMDB score (neutral badge). The two must look visibly different.
3. Primary actions: **Rate** · **+ Watchlist** · **Seen it**
4. **Top 3 one-line verdicts** (most helpful)
5. Plot, trailer, director, top cast
6. Reviews preview → "All reviews"
7. If I've reviewed it: **my review pinned on top** (Edit · Delete)

States: new film with no reviews → TMDB score + "Be the first to rate this".

### 7.5 Write / edit review
Steps on one screen, in order:
1. Score 1–10 (**saved immediately** on tap)
2. One-line verdict (optional, prompted: "Sum it up in a line")
3. Long review (optional, expandable)
4. Spoiler toggle: "Contains spoilers"
5. Post → back to detail with my review pinned

Keep the draft if posting fails, show Retry, and never lose the text. Keep the draft while offline.

### 7.6 Reviews list
- Sort: Most helpful (default) · Newest · Highest · Lowest
- Each review: avatar, name, score, verdict, body, date, Helpful (count), Report spoiler
- **Spoiler reviews:** blurred block → tap → "Reveal spoiler?" confirm → shown. Auto-revealed if I marked the film Seen.

### 7.7 Profile (`/me`, `/u/:username`)
- Avatar, name, counts (ratings, reviews)
- Tabs: Ratings · Reviews · Watchlist (own profile only)
- Empty: "No reviews yet. Find a film to rate" → Search

### 7.8 Login prompt
- **Desktop:** a centred dialog. **Mobile:** a bottom sheet. Either way it is not a new page: "Sign in to rate this film" with Log in / Sign up, and the film stays visible behind it.

---

## 8. Key flows

### Flow 1: Find and decide (Maya)
```
Home ─► Search (live suggestions) ─► Results ─► Movie detail
  └─► Browse ─────────────────────────────────┘    ├─ glance scores, read top verdicts
                                                   ├─ watch trailer
                                                   └─ + Watchlist ─► (login? → Flow 4)
```

### Flow 2: Rate and review (Daniel)
```
Detail ─► Rate ─► (login? → Flow 4) ─► pick 1–10 ─► saved ✓
   ─► optional verdict ─► optional long review ─► spoiler toggle ─► Post
   ─► back on Detail, my review pinned (Edit · Delete)
```

### Flow 3: Spoiler-safe check (Priya)
```
Detail ─► Reviews ─► spoiler review blurred ─► tap ─► "Reveal spoiler?" ─► shown
Seen it ✓ ─► all spoilers on this film auto-reveal for me
Every review ─► "Report spoiler"
```

### Flow 4: Login interruption (everyone)
```
Tap Rate / Watchlist / Seen it / Helpful
 ─► dialog (desktop) / bottom sheet (mobile): "Sign in to …"
 ─► hosted login (user briefly leaves the site)
 ─► return to the SAME film, SAME scroll position, action COMPLETED ✓
```
**Must:** save the pending action (for example "rate 8 on film 123") **before** redirecting, and complete it on return. Show "Signing you in…" while the page reloads after the redirect. If the user comes back and has to repeat the action, that's a bug.

### Flow 5: Searching for an excluded film
```
Search excluded title ─► "We focus on English-language films…" ─► Trending · Browse genres
```

---

## 9. Cross-cutting states

| Situation | Behaviour |
|---|---|
| New film, no reviews | TMDB score + "Be the first to rate this" |
| < 3 community ratings | "Not enough ratings yet" instead of a score |
| Slow connection | Smallest suitable TMDB image size first; skeleton placeholders |
| Offline | "You're offline" banner; unsent review drafts are kept |
| TMDB unavailable | Friendly error + Retry; our own data (reviews) still shown if possible |
| Post / vote fails | Keep input; show Retry; don't show success that didn't happen |
| Not logged in, protected action | Flow 4 |

---

## 10. Design direction (working; not final)

Directional only. **The full design rules live in `design.md` (tokens, type, components) and `animation.md` (motion). If they disagree with this section, those files win.** Use tokens / CSS variables for every value.

**Working palette, "After Hours"** (dark-first):

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0E1116` | Page background |
| `--color-surface` | `#181C23` | Cards, sheets |
| `--color-text` | `#F2F2F0` | Primary text |
| `--color-text-muted` | `#9BA1A6` | Secondary text |
| `--color-accent` | `#C6F432` | Primary actions + **our** community score only |
| TMDB score | neutral grey badge | Must never compete with our score |

**Principles:**
- **Content first.** Posters and backdrops lead, and the interface chrome recedes.
- **Lime has one job:** actions and our score. Don't use it for decoration.
- Bold, slightly condensed headings for film titles; calm, readable text for reviews; verdicts shown large, like pull-quotes.
- **The spoiler blur is the brand signature:** frosted, tap to reveal.
- Responsive website: desktop layouts use the width (sidebars, multi-column grids); on phones, keep Rate / Review within thumb reach.
- **Avoid:** yellow-on-black (IMDb), red (Netflix / Rotten Tomatoes), green/orange dots (Letterboxd).
- Fonts are not chosen yet.

---

## 11. Quality bar

- **Accessibility:** WCAG 2.1 AA, semantic HTML, full keyboard support, visible focus. The spoiler reveal and the rating control must be keyboard- and screen-reader-operable. Posters need alt text (the film title).
- **Responsive:** one website that adapts from desktop (~1280px) down to phone (~375px), with no horizontal scroll. Desktop and mobile layouts are both first-class; see wireframes.html.
- **Performance:** responsive image sizes from TMDB, lazy-load below-the-fold rails, debounced search.

---

## 12. Constraints and non-goals

- No IMDb name, branding or look-alike UI.
- No Indian-produced films and no non-English-language films (section 4.1).
- No monetisation before a TMDB commercial agreement.
- No admin or moderation UI in MVP. Spoiler reports are stored only.
- No secrets in the frontend.

---

## 13. Open items

| Item | Owner | Default if undecided |
|---|---|---|
| Wireframes for all screens | Product/UX | Done: `wireframes.html` v0.2 (desktop + mobile) |
| Final palette and fonts | Product/UX | `design.md`: After Hours tokens, Archivo + Inter (defaults) |
| Product name and logo | Product/UX | Name: **Limereel** (domain/trademark check pending). Logo: horizontal lockup (slice-reel symbol + "limereel" wordmark, tight spacing) chosen; symbol alone for favicon/app icon. See `logo-concepts.html` → "In use" |
| TMDB call layer (proxy vs function) | Dev | Dev's choice. Key stays server-side. |
| Anonymous read access to reviews | Dev | Must work. Approach is dev's choice. |
| How the community score is calculated (live vs stored) | Dev | Dev's choice |
