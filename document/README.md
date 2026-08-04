# Svastrino Client — Developer Documentation

React (Vite) frontend for the Svastrino career-mentoring & Skill-Build (Nirmaan)
platform. One unified user account powers Mentoring + Skill-Build; a separate
`/admin` area has its own chrome and token.

> New here? Read: **README → ARCHITECTURE → PAGES → COMPONENTS → AUTH_FLOW → OFFLINE_AND_PLAYER**.
> (Backend docs live in `../server/document/`.)

---

## Tech stack
| Concern | Choice |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | react-router-dom 6 |
| Phone input | react-international-phone (country picker) |
| Google sign-in | Google Identity Services (loaded on demand) |
| Styling | Plain CSS + CSS custom-property design tokens (no UI lib) |
| State | React Context (auth) + local component state (no Redux) |

## Run it
```bash
cd client
npm install
# create .env.local (see below)
npm run dev      # Vite dev server → http://localhost:5174
npm run build    # production build → dist/
npm run preview  # preview the build
```
In dev, Vite **proxies `/api` → http://localhost:5060** (the backend) — see
`vite.config.js`. So the backend must be running too.

## Environment (`.env.local`, git-ignored)
```
VITE_API_BASE=/api                     # API base; /api is proxied in dev
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com   # must match server GOOGLE_CLIENT_ID
```

## Folder structure
```
client/src/
├── main.jsx                 # React root: Router + AuthProvider + global CSS
├── App.jsx                  # ALL routes (public site + admin area)
├── api/client.js            # fetch wrapper + token stores (user/admin)
├── context/AuthContext.jsx  # signed-in user state + login/logout/refresh
├── hooks/useGoogleAuth.js   # loads GIS, returns { ready, signIn }
├── utils/password.js        # shared password policy (score + validate)
├── styles/
│   ├── theme.css            # design tokens (single source of truth)
│   ├── global.css           # base styles + reusable classes (.btn/.card/.grid…)
│   └── nirmaan.css          # .theme-nirmaan scoped palette (green/brown/cream)
├── common_component/
│   ├── user/                # Navbar, Footer, PageHero, ScrollToTop,
│   │                        # ProtectedRoute, GuestRoute, StrengthMeter
│   └── admin/               # AdminLayout, AdminSidebar, AdminProtectedRoute
└── pages/
    ├── user/                # homepage, about, mentoring, bookonline, nirmaan,
    │                        # resources, blog, contact, login (+reset/verify),
    │                        # dashboard, settings, notfound
    └── admin/               # loginpage, dashboardpage
```

## App shell (`App.jsx`)
- `ScrollToTop` runs once (scrolls to top on route change).
- **`PublicSite`** wraps the public routes in `Navbar` + `Footer` chrome.
- The **`/admin`** area is a separate `Routes` block wrapped in
  `AdminProtectedRoute` + `AdminLayout` (its own sidebar chrome).
- Route guards: `ProtectedRoute` (must be logged in — `/dashboard`, `/settings`),
  `GuestRoute` (must be logged out — `/login`), `AdminProtectedRoute` (admin token).

See **PAGES.md** for the full route → page table and **ARCHITECTURE.md** for the
auth/data/theming design.

## Conventions
- **No API calls inside page components' render** — use the `api()` wrapper
  (`api/client.js`) and, for the signed-in user, `useAuth()` from the context.
- **Never hard-code colors/spacing** — use the `--token` custom properties from
  `theme.css` (see COMPONENTS.md → Theming). This is what lets the Nirmaan page
  re-skin the whole app with one class.
- Static/marketing pages keep their content in module-level `const` arrays
  (`PROGRAMS`, `POINTS`, `SECTIONS`, …), ready to swap for API data later.
