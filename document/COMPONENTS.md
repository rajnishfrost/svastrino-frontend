# Shared Components & Theming

Reusable pieces in `common_component/`. User-site components under `user/`,
admin under `admin/`.

## User chrome

### Navbar — `common_component/user/Navbar/Navbar.jsx`
The top navigation for the public site.
- Brand (always Svastrino, links home) + main links: **Skill Build** (green pill
  dropdown → Nirmaan), **Mentoring ▾**, **Book Online**, **Resources ▾**, **Blog**,
  **Contact**.
- On the Nirmaan page (`isNirmaan = pathname.startsWith('/skill-build/nirmaan')`)
  the Skill-Build pill is replaced by a plain **Home** link.
- **Auth-aware right side:**
  - Logged out → **Login** button.
  - Logged in → **`ProfileMenu`**: an avatar (Google photo, else initials in a navy
    circle; falls back to initials if the photo fails to load) that opens a dropdown
    → **Dashboard · Settings · Sign out**. Click-outside closes it; on mobile it
    renders inline in the hamburger drawer.
- Fully responsive: collapses to a hamburger drawer ≤ 940px.
- Sub-components in the same file: `SkillBuildDropdown`, `Dropdown`, `ProfileMenu`,
  and inline SVG icons.

### Footer — `common_component/user/Footer/Footer.jsx`
Brand lockup + link columns (Mentoring / Explore / Company). The Nirmaan link uses
`/skill-build/nirmaan`.

### PageHero — `common_component/user/PageHero/PageHero.jsx`
Reusable header band at the top of inner pages.
- **Props:** `eyebrow` (small uppercase label), `title` (H1), `subtitle`,
  `children` (optional CTA rendered in `.page-hero-actions`).
- Used by About, Mentoring, BookOnline, Resources, Blog, Contact. (Home and Nirmaan
  have bespoke heroes.)

### ScrollToTop — `common_component/user/ScrollToTop/ScrollToTop.jsx`
Renders `null`; scrolls to top on route change (`useLocation` + `useEffect`). Skips
scrolling when the URL has a `#hash` (preserves in-page anchors). Mounted once in `App`.

### StrengthMeter — `common_component/user/StrengthMeter/StrengthMeter.jsx`
Password strength bar + label. Self-contained — pass `pw` and `name`; it computes
the score via `utils/password.js`. Used by Signup, ResetPassword, and Settings so
the meter is identical everywhere.

### ConnectionState — `common_component/user/ConnectionState/ConnectionState.jsx`
Friendly empty-state for a failed data load: `error`, `onRetry`, `label` props.
Classifies the error via `api/client.js#isNetworkError` — connectivity failures
(fetch TypeError / `navigator.onLine === false`) render a wifi-off icon +
"You're offline"; anything with an HTTP `status` renders an alert icon +
"Something went wrong loading {label}". Both variants show a "Try again" button,
and the offline variant **auto-retries on the `online` event**. Used by every
API-driven public page (Blog, BlogPost, Mentoring, Resources, CourseDetail),
each of which re-runs its fetch effect via a `reloadKey` counter.

### OfflineBanner — `common_component/user/OfflineBanner/OfflineBanner.jsx`
Thin sticky navy bar ("You're offline — some content may be unavailable…") with a
pulsing amber dot, driven purely by the browser `online`/`offline` events.
Mounted once above the Navbar in `PublicSite`, so it appears site-wide the moment
connectivity drops and disappears on reconnect.

### PaymentGuard — `common_component/user/PaymentGuard/PaymentGuard.jsx`
The screen that covers everything while money is moving. Mounted by **Checkout**
and **Book Online**, driven by a `payPhase` state on each — never by their `busy`
flag, which is also true while a coupon is priced.

| `phase` | Draws | Why |
|---|---|---|
| `'preparing'` | full block | we are creating the order |
| `'gateway'` | **nothing** | Cashfree's modal owns the screen; a second backdrop on top would cover the card form. The unload guard stays armed |
| `'confirming'` | full block | the money has moved and the server is confirming it — the stretch that must not be interrupted |
| `null` | nothing | not paying; no listeners |

While it is up: pointer events are swallowed by the overlay, `Tab` and `Escape`
are trapped so the focus ring cannot walk onto the buttons behind it, the body
stops scrolling, and `beforeunload` makes the browser ask before a refresh or a
tab close. Verified against the real checkout: six clicks and six `Enter`
presses during confirmation produced exactly **one** `/payments/verify` call.

The copy is fixed — *"Please do not refresh the page or close the window."* — and
sits in its own amber box because it is the only thing on that screen the
customer has to act on. Colours come from the semantic tokens, so it arrives
navy-and-crimson on the main site and brown-and-green under `.theme-nirmaan`.

Adding a third payment flow? Give it a `payPhase`, set the three phases around
the same three moments, and render `<PaymentGuard phase={payPhase} />` at the top
of its tree.

## Route guards
| Component | Redirects when… | Wraps |
|---|---|---|
| `user/ProtectedRoute` | not logged in → `/login` (keeps `state.from`) | `/dashboard`, `/settings` |
| `user/GuestRoute` | logged in → `/dashboard` (or `state.from`) | `/login` |
| `admin/AdminProtectedRoute` | no admin token → `/admin/login` | all `/admin/*` |

All three read from `AuthContext` / `adminTokenStore` and show a "Loading…" state
while the initial auth check runs.

## Admin chrome
- **AdminLayout** — sidebar + top bar shell around admin pages; `navOpen` state drives
  the mobile hamburger + backdrop; top bar has a "View site ↗" link.
- **AdminSidebar** — `NAV` array of `NavLink`s (Dashboard, Blogs, Success Stories,
  Quick News, Courses, Mentoring, Bookings, Users). "Sign out" clears the admin token.
  Most targets aren't routed yet (future modules).

---

## Theming (design tokens)
Three stylesheets in `styles/`. **`theme.css` is the single source of truth.**

### `theme.css` — tokens on `:root`
- **Brand palette:** `--navy #0f2c5c`, `--navy-dark #0a1f43`, `--blue #2f7ae5`,
  `--blue-dark #1c5fc4`, `--blue-light #eaf2fd`; neutrals `--gray-50…800`, `--white`.
- **Semantic aliases (use THESE in components):** `--color-text`, `--color-heading`,
  `--color-text-muted`, `--color-bg`, `--color-surface`, `--color-surface-border`,
  `--color-primary`/`-hover`/`--color-on-primary`, `--color-accent`/`-hover`/`-soft`,
  `--color-inverse-bg`/`-text`, `--color-danger`, `--color-success`, `--color-warning`.
- **Nirmaan raw palette** (also here): `--nirmaan-brown/green/olive/cream…`.
- **Badges:** `--badge-svastrino` (navy), `--badge-nirmaan` (green).
- **Fonts:** `--font-sans` (Inter), `--font-serif` (Poppins), `--font-deva`.
- **Scale:** `--radius-sm/…/pill`, `--shadow-sm/md/lg`, `--space-1…7`,
  `--container-max 1200px`, `--container-pad 24px`, `--nav-height 68px`,
  `--transition-fast/transition`.

### `global.css` — base + utility classes (built on tokens)
Reset + sticky-footer shell; `.container`, `.section`/`.section--alt`,
`.section-eyebrow/-title/-sub`, `.text-center`; `.btn` + `.btn-primary/-accent/-secondary/-large`;
`.card`; `.badge` + `.badge--svastrino/--nirmaan`; `.grid` + `.grid-2/3/4`
(responsive: 2-col ≤900px, 1-col ≤600px).

### `nirmaan.css` — `.theme-nirmaan` re-skin
A single `.theme-nirmaan { … }` block that **remaps the same token names**
(`--navy`, `--blue`, `--color-primary`, surfaces, shadows, serif font) onto the
green/brown/cream Nirmaan palette. Because components only reference token names,
nothing else changes. The **Nirmaan page** toggles `document.body.classList`
add/remove `theme-nirmaan` in a `useEffect` — the whole app re-skins on that page
and reverts on leave. This is the only place the theme flips.

> **Golden rule:** style with `var(--token)`, never raw hex/px. That's what makes
> the one-class re-skin possible.
