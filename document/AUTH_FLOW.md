# Auth Flow (frontend view)

How the client drives authentication. Backend details: `../server/document/AUTH_AND_SECURITY.md`.

## Pieces involved
- `context/AuthContext.jsx` — holds `user`, exposes `login/logout/refresh`.
- `api/client.js` — `api()` wrapper + `tokenStore` (user) / `adminTokenStore` (admin).
- `hooks/useGoogleAuth.js` — Google Identity Services popup → access token.
- `utils/password.js` + `StrengthMeter` — shared password policy/UI.
- Pages: `Login`, `VerifyEmail`, `ResetPassword`, `Settings`; guards `ProtectedRoute`,
  `GuestRoute`.

## Token lifecycle
- On login/signup-verify/google/reset, the server returns a JWT → `login(token, user)`
  stores it in `localStorage` (`svastrino_token`) and sets `user` in context.
- `AuthProvider` on mount: if a token exists, fetch `GET /user/profile`; on failure
  it clears the token. `ProtectedRoute`/`GuestRoute` wait on `loading`.
- `logout()` clears the token + user (used by the Navbar ProfileMenu "Sign out").

## 1. Signup → verify → login (the gated flow)
```
/login (signup mode)
  → POST /user/auth/signup { name, email, password, phone }
  → 201, NO token   → Login shows "Verify your email" panel (with Resend)
Email link  →  /verify-email?token=…
  → POST /user/auth/verify-email { token }
  → success → redirect /login?verified=1  (Login shows a green banner)
/login (login mode)
  → POST /user/auth/login → { token, user } → login() → /dashboard
```
If a user tries to log in before verifying, the server returns
`403 code:EMAIL_NOT_VERIFIED` and Login switches to the same verify panel (Resend →
`POST /user/auth/resend-verification`).

## 2. Google sign-in
```
Login "Continue with Google"
  → useGoogleAuth().signIn()  (GIS popup, implicit flow) → accessToken
  → POST /user/auth/google { accessToken } → { token, user } → login() → /dashboard
```
Needs `VITE_GOOGLE_CLIENT_ID` (same id as the server's `GOOGLE_CLIENT_ID`).
Server-side the token's audience is checked and the account is linked/created.

## 3. Forgot / reset password
```
/login "Forgot password?"  (own forgotBusy state)
  → POST /user/auth/forgot-password { email } → generic "check your inbox"
Email link  →  /reset-password?token=…
  → GET  /user/auth/reset-info?token=…  → { email, name }   (personalises + feeds strength check)
  → POST /user/auth/reset-password { token, password } → { token, user } → login() → /dashboard
```

## 4. Change password / update profile (logged in)
`Settings → Account`:
- Edit name/phone → `PATCH /user/profile` → `refresh()`.
- Change/set password → `POST /user/change-password` → `refresh()`.
  (Google-only accounts show "Set password" — no current password required.)

## Route protection
- `GuestRoute` wraps `/login` → a logged-in user is bounced to `/dashboard`.
- `ProtectedRoute` wraps `/dashboard`, `/settings` → a logged-out user is sent to
  `/login` with `state.from` so they return after logging in.

## Admin (separate)
Admin uses its own token (`svastrino_admin_token` via `adminTokenStore`) and
`AdminProtectedRoute` (token-presence only for now). `AdminLogin` →
`POST /admin/auth/login`. Admin and user tokens never mix — the server rejects a
user token on admin routes and vice-versa (JWT `role` claim).

## Password policy (identical everywhere)
Signup, ResetPassword, and Settings all call `validatePassword(pw, name)` and render
`<StrengthMeter pw name />`. Rule: **min 8 · strength score ≥ 2 · must not contain the
user's name or email.** The server re-checks with the same rule, so client validation
is UX only — never the security boundary.
