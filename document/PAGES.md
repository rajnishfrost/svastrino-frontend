# Page Reference

Every route in `App.jsx`, the component that renders it, and what it does.
Legend: **Guard** — 🔓 public · 🔐 user (ProtectedRoute) · 🚪 guest-only (GuestRoute) · 🛡️ admin.

## Route map
| Path | Page | Guard |
|---|---|---|
| `/` | Home | 🔓 |
| `/about` | About | 🔓 |
| `/mentoring` | Mentoring | 🔓 |
| `/book-online` | BookOnline | 🔓 |
| `/skill-build/nirmaan` | Nirmaan | 🔓 |
| `/resources` | Resources | 🔓 |
| `/career-library/:slug` | CourseDetail | 🔓 |
| `/legal/:slug` | LegalPage | 🔓 |
| `/blog` | Blog | 🔓 |
| `/blog/:slug` | BlogPost | 🔓 |
| `/contact` | Contact | 🔓 |
| `/login` | Login (login + signup) | 🚪 |
| `/verify-email` | VerifyEmail | 🔓 |
| `/reset-password` | ResetPassword | 🔓 |
| `/dashboard` | Dashboard | 🔐 |
| `/settings` | Settings | 🔐 |
| `*` | NotFound | 🔓 |
| `/admin/login` | AdminLogin | 🔓 |
| `/admin` | AdminDashboard | 🛡️ |

---

## Public content pages

### Home — `/`  · `pages/user/homepage/Home.jsx`
Thin composer rendering three section components (no state):
- **Hero** (`sections/Hero.jsx`) — bespoke hero band; H1, subtitle, two CTAs
  (Book a Session → `/book-online`, Explore Nirmaan → `/skill-build/nirmaan`), stat card.
- **ProgramsPreview** (`sections/ProgramsPreview.jsx`) — `PROGRAMS` array (4 mentoring
  programs) → cards in `grid-4`; "View all mentoring programs" → `/mentoring`.
- **WhySvastrino** (`sections/WhySvastrino.jsx`) — `POINTS` array (3 value props) → `grid-3`.

### About — `/about` · `pages/user/aboutpage/About.jsx`
`PageHero` + story, founder card, 5-step approach, milestones and vision/mission.
Real Svastrino copy held in local `APPROACH` / `MILESTONES` arrays — **static on
purpose**: page prose changes rarely, so it isn't worth a DB round-trip.

### Mentoring — `/mentoring` · `pages/user/mentoringpage/Mentoring.jsx`
`PageHero` (with a "Book Online" CTA) + programs fetched from
`GET /api/user/content/programs`. Each `.mentoring-card` shows duration/sessions/mode
and an "Enquire" link → `/book-online`; "View details" lazy-loads
`GET /content/programs/:slug` (cached in a `details` map) to reveal
*Choose this program if…*, the stage-by-stage journey, benefits and any brochure.
Program `slug`s are anchor targets for `/mentoring#…` hash links. Featured
testimonials load from `GET /content/testimonials?featured=true`.

### BookOnline — `/book-online` · `pages/user/bookonlinepage/BookOnline.jsx`
The mentoring booking wizard (public — guests can book). Four steps per the spec:
**Date & time** (month calendar limited to the T+3 … +2-months window, Mondays
closed; 2-hour slot chips from `GET /user/mentoring/slots?date=`) → **Your
details** (guest name/email/phone → `POST /user/auth/guest` auto-creates the
account + session; `EMAIL_EXISTS` → login prompt; coupon + fee lines) →
**Verify** (full summary) → **Payment** (existing quote → order → verify stack,
then `POST /user/mentoring/bookings`). Only the FIRST booking of a program is
paid — for owned programs (`GET /user/mentoring/my`) the flow shows "Program
purchased ✓", skips the payment step and books free. `SLOT_TAKEN` (incl. the
paid-then-sniped race) returns to the calendar without re-charging. Entry
points: `?program=<sku>` preselects; `&reschedule=<bookingId>` (from the
dashboard) reschedules instead of booking. Wizard state is mirrored into query
params so the login round-trip resumes where it left off.

### Nirmaan — `/skill-build/nirmaan` · `pages/user/nirmaanpage/Nirmaan.jsx`
The Skill-Build product detail page. On mount adds `theme-nirmaan` to `<body>`
(green/brown/cream theme), removes on unmount. Renders section components in order:
- **Hero** · **Benefits** · **HowItWorks** · **Packages** · **Scholarship**
  (all in `sections/`). `CTA` and `Testimonials` sections exist but are currently
  not rendered.
- **Packages** (`sections/Packages.jsx`) reads tiers from `nirmaanpage/packages.js`
  (Discover / Clarity / Launch — content mirrors the SRS §9). Each CTA → `/login`.
- **Scholarship** (`sections/Scholarship.jsx`) — the institution scholarship
  competition (SRS §4.13): a partner school/college runs a test; top scorer wins the
  full package free. 4-step explainer + "Partner with us" → `/contact`.

### Resources — `/resources` · `pages/user/resourcespage/Resources.jsx`
`PageHero` + four tabs — **Career Library**, **FAQ's**, **Quick News**,
**Success Stories** — loaded on mount from `/api/user/content` (`career-library`,
`faqs`, `testimonials`) plus `GET /api/user/blogs/latest?limit=3` for a "Latest
reading" strip. The initial tab is read from `window.location.hash`, so
`/resources#faqs` deep-links straight in. FAQs render as an accordion grouped by
section; one open at a time via `openFaq`. Career Library course names are links
→ `/career-library/:slug`. **Quick News** loads lazily on first visit to its tab
(`GET /content/news`, 30 per page) and appends via a "Load more" button.

### LegalPage — `/legal/:slug` · `pages/user/legalpage/LegalPage.jsx`
Policy pages (`terms-of-use`, `privacy-policy`, `cancellations-and-refunds`) from
`GET /api/user/content/pages/:slug` — `PageHero` + "Last updated" line + the
markdown body through `common_component/user/Markdown`. Linked from the footer
bottom bar. `404` renders a "Page not found" panel.

### CourseDetail — `/career-library/:slug` · `pages/user/careerlibrarypage/CourseDetail.jsx`
A course/career detail page from `GET /api/user/content/courses/:slug` — overview
(in the `PageHero`), stream chips, qualities, career cards with India/global
salary, top institutes (India + International) and a numbered career ladder, plus
a mentoring CTA. `404` renders a "Course not found" panel.

### Blog — `/blog` · `pages/user/blogpage/Blog.jsx`
Listing backed by `GET /api/user/blogs` (12 per page). **`useSearchParams` is the
source of truth** for `category`, `q` and `page`, so filters and pages are
shareable and survive a refresh; changing a filter resets to page 1. The filter bar
is built from `GET /blogs/categories` (name + count). Cards show the **owner badge**
(`badge--svastrino` / `badge--nirmaan`), cover image, excerpt, date and reading time.

### BlogPost — `/blog/:slug` · `pages/user/blogpage/BlogPost.jsx`
Article page from `GET /api/user/blogs/:slug`. Renders `post.body` (markdown)
through `common_component/user/Markdown` and appends a Model-Session CTA and up to
3 related posts. A `404` renders a "Post not found" panel rather than an error.

### Contact — `/contact` · `pages/user/contactpage/Contact.jsx`
`PageHero` + a form card + real contact details (phone, email, the three offices
and social links) held in local constants. `useState(false)` `sent`; submit is
intercepted (`preventDefault`) and shows a thank-you — **no backend yet**
(future `/api/user/contact`).

### NotFound — `*` · `pages/user/notfoundpage/NotFound.jsx`
404 code, heading, and a "Back to home" link. Static (no `PageHero`).

---

## Auth pages

### Login (login + signup) — `/login` · `pages/user/loginpage/Login.jsx`
One component, two modes (`mode` = `'login' | 'signup'`). Guarded by `GuestRoute`
(logged-in users are redirected away).
- **Login:** email + password → `POST /user/auth/login` → `login(token, user)` →
  navigate to `from`/`/dashboard`. `403 EMAIL_NOT_VERIFIED` switches to a
  **verify-email panel** (resend option) instead of erroring.
- **Signup:** name, email, phone (react-international-phone), password + confirm.
  Validates via shared `validatePassword` + `<StrengthMeter />`. On success the
  account is created **unverified** (no auto-login) → shows the "check your inbox"
  verify panel.
- **Forgot password:** inline — enter email, `POST /user/auth/forgot-password`
  (own `forgotBusy` state so it doesn't flip the Log-in button).
- **Google:** `useGoogleAuth().signIn()` → `POST /user/auth/google`.
- Reads `?verified=1|0` (set by the verify redirect) to show a success/expired banner.

### VerifyEmail — `/verify-email` · `pages/user/loginpage/VerifyEmail.jsx`
Reached from the emailed link (`?token=…`). On mount POSTs the token to
`/user/auth/verify-email`, shows verifying → success → redirect to `/login?verified=1`
(or an error with a "Go to login" action). Guarded against StrictMode double-run.

### ResetPassword — `/reset-password` · `pages/user/loginpage/ResetPassword.jsx`
Reached from the reset link (`?token=…`). Fetches `GET /user/auth/reset-info` to
show the target email and feed name/email into the strength check. New password +
confirm (shared `validatePassword` + `<StrengthMeter />`) → `POST /user/auth/reset-password`
→ logs in → dashboard.

---

## Signed-in user pages (🔐)

### Dashboard — `/dashboard` · `pages/user/dashboardpage/Dashboard.jsx`
Greeting + stacked sections, each heading-then-card:
- **Mentoring** — one card per owned program (`GET /user/mentoring/my`) with a
  session table: **Session # · Appointment (IST) · Session update · Tasks** —
  update/tasks are written by the admin in Admin → Mentoring. Unbooked rows show
  "Not booked yet" with a **Book →** link on the next-in-line session
  (`/book-online?program=<sku>`); booked future sessions ≥2 days away get
  **Reschedule** (`&reschedule=<bookingId>`). Card footer: "Book session N →".
- **Skill Build** — real enrollments (`GET /user/payments/enrollments`) with
  progress bar → "Continue learning" → `/learn/<slug>`.

### Settings — `/settings` · `pages/user/settingspage/Settings.jsx`
URL-driven tabs (`?tab=account|orders`, `&order=<id>` for detail):
- **Account** (`AccountPanel`) — avatar/name/email header + inline editors:
  edit **name** and **phone** (`PATCH /user/profile`), change/set **password**
  (`POST /user/change-password`, with `<StrengthMeter />`). Uses `refresh()` after saves.
  Email shows a Verified/Unverified badge; phone shows verified status.
- **Orders** — list + single-order detail (via the `order` query param). Currently
  placeholder data pending the orders API.

### Learn — `/learn/:slug` · `pages/user/learnpage/Learn.jsx`
The course player (drip-scheduled — see server `LEARNING_SYSTEM.md`):
- **Start screen + consent** the first time (course begins on confirm; Video 1 opens
  immediately, then 6 daily questions per video, next video after them).
- **Custom YouTube-style player** (`HlsPlayer.jsx`) — adaptive 144p→max, gear menu
  (quality + speed), mute/volume, fullscreen, seek locked until the first 90% watch,
  moving e-mail watermark, pause+cover on tab switch.
- Below the video: timestamped **notes** (click to jump), the **question panel**
  ("Question X of 6", one visible, next opens tomorrow), worksheet, report strip
  (target vs actual days), and **"Save for offline"** (quality picker + progress).
- Offline: keeps rendering from cache, queues answers/90%-marks (outbox) and shows
  a pending-sync banner. Details: **OFFLINE_AND_PLAYER.md**.

### Downloads — `/downloads` · `pages/user/downloadspage/Downloads.jsx`
Videos saved for offline (localStorage + Cache Storage — renders with zero
network): title, course, actual quality, size, saved date; Play → `/learn/:slug`;
Remove clears the cached segments. Linked from the navbar profile menu.

---

## Admin pages (🛡️)

### AdminLogin — `/admin/login` · `pages/admin/loginpage/AdminLogin.jsx`
Email + password → `POST /admin/auth/login` → `adminTokenStore.set(token)` →
navigate to `/admin`. Separate token from the user site.

### AdminDashboard — `/admin` · `pages/admin/dashboardpage/AdminDashboard.jsx`
Inside `AdminLayout` (sidebar + top bar). Static scaffold: a `STATS` tile row
(mostly `—` placeholders) + a "Getting started" panel. Sidebar links (Blogs, Courses,
Users, …) point to routes not yet defined — future admin modules.

> The admin area is an intentional **scaffold**: only the dashboard is routed, the
> guard is token-presence only, and stats are not yet fetched.
