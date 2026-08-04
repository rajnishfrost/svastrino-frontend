# Client Architecture

## Entry & providers (`main.jsx`)
```
<BrowserRouter>
  <AuthProvider>        # loads the signed-in user, exposes login/logout/refresh
    <App />
  </AuthProvider>
</BrowserRouter>
```
Global CSS imported here: `styles/global.css` (which `@import`s `theme.css`) and
`styles/nirmaan.css`.

## Routing (`App.jsx`)
Two worlds, one router:

| Area | Chrome | Guard |
|---|---|---|
| Public site (`/`, `/about`, `/mentoring`, `/skill-build/nirmaan`, …) | `Navbar` + `Footer` (`PublicSite`) | none / `ProtectedRoute` / `GuestRoute` |
| Admin (`/admin/*`) | `AdminLayout` (sidebar) | `AdminProtectedRoute` |

Guards (all in `common_component/user|admin/`):
- **`ProtectedRoute`** — redirects to `/login` (with `state.from`) if not logged in.
  Wraps `/dashboard`, `/settings`.
- **`GuestRoute`** — redirects a logged-in user away from `/login` to their
  dashboard (or `state.from`).
- **`AdminProtectedRoute`** — redirects to `/admin/login` if no admin token.

## Data layer (`api/client.js`)
A tiny fetch wrapper is the ONLY way pages talk to the backend:
```js
api(path, { method = 'GET', body, auth }) // auth: false | 'user' | 'admin'
```
- Base URL = `VITE_API_BASE || '/api'` (proxied to the backend in dev).
- `auth: 'user'` attaches the user JWT (`svastrino_token`); `auth: 'admin'` attaches
  the admin JWT (`svastrino_admin_token`). Two separate `localStorage` stores:
  `tokenStore` and `adminTokenStore`.
- Non-2xx responses throw an `Error` with `.status` and (when present) `.code`
  (e.g. `EMAIL_NOT_VERIFIED`), and message from the server's `{ error }`.

## Auth state (`context/AuthContext.jsx`)
- On mount, if a user token exists it fetches `GET /user/profile` and stores the
  `user`. Exposes:
  - `user` — the signed-in user DTO (or `null`)
  - `loading` — while the initial profile fetch runs (guards read this)
  - `login(token, user)` — persist token + set user (after login/signup/google)
  - `logout()` — clear token + user
  - `refresh()` — re-fetch the profile (used after profile/password updates)
- Consume with `useAuth()`. Admin auth is **separate** (token-only, no context yet).

## Google sign-in (`hooks/useGoogleAuth.js`)
Loads the Google Identity Services script once and returns `{ ready, configured,
signIn }`. `signIn()` opens the Google popup (implicit flow) and resolves with an
**access token**, which the Login page POSTs to `/user/auth/google` for
server-side verification. Needs `VITE_GOOGLE_CLIENT_ID`.

## Password policy (`utils/password.js`) — shared, single source
`scorePassword(pw, name)`, `passwordContainsName`, `validatePassword(pw, name)`,
and `STRENGTH_LABEL`. Used by **Signup, Reset password, and Settings** so all three
enforce the same rule (min 8 · strength ≥ 2 · no name/email), and all render the
same `<StrengthMeter />`. The server re-validates with an identical rule.

## Theming (design tokens)
- `styles/theme.css` defines every color/font/space/radius as a `:root` custom
  property (e.g. `--navy`, `--color-accent`, `--space-4`, `--radius-lg`). Components
  reference tokens, never raw values.
- `styles/global.css` builds reusable classes on those tokens: `.container`,
  `.section`/`.section--alt`, `.btn`+variants, `.card`, `.badge`, `.grid`/`.grid-2/3/4`
  (responsive at 900px/600px).
- `styles/nirmaan.css` = a single `.theme-nirmaan` block that **remaps the same
  token names** onto a green/brown/cream palette. The **Nirmaan page** toggles
  `document.body.classList` add/remove `theme-nirmaan` in a `useEffect`, so the
  entire app (navbar, footer, buttons) re-skins on that page and reverts on leave.
  This is the only place the theme flips.

## State strategy
- **Global:** only auth (Context). Everything else is local `useState`.
- **URL as state:** `/settings` uses query params (`?tab=…&order=…`) so tabs and the
  open order are deep-linkable and refresh-safe (`useSearchParams`).
- No Redux/Zustand — the app is intentionally light.
