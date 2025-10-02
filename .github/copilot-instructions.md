# AI agent instructions for RTS-website

This repo is a static HTML prototype for a transport logistics website (Raj Mohan Transport Services). There is no configured backend; flows are client-side and use placeholder data. The `package.json` lists React/Next scripts but no React app exists in `src`—treat this as a static site unless we explicitly migrate.

We are beginning integration with Supabase for authentication, database (tables, storage), and realtime where applicable. Until a full migration, wire minimal supabase-js calls from static pages, keeping secrets out of the client.

## Big picture
- Entry: `src/login and reg/home.html` (landing with Sign Up, Login, Guest).
- Auth: `src/login and reg/login.html` checks a local `dummyUsers` array, role toggle (admin/customer) only affects copy; success redirects to dashboard.
- Dashboard: `src/Dasboard/customer.html` (folder spelled "Dasboard"). Contains live map placeholder, orders table, cost/payment, rate calculator, support, documents, about.
- Forgot password: `src/login and reg/forgot_password.html` mocks email/OTP flow client-side.

## Run & debug
- Ignore `react-scripts`/`next` in `package.json` for now. Serve statically (VS Code Live Server or any static server) from repo root or `src/`.
- Paths are relative across `src/login and reg` and `src/Dasboard`; keep the space and misspelling consistent.
- Use browser devtools; there are no tests.

### Supabase quickstart (prototype)
- Create a tiny `src/config/supabase.js` that exports a Supabase client via the public URL + anon key read from a single config file (do NOT hardcode in pages). Example usage pattern in pages: import the client and call `supabase.auth.signInWithPassword(...)`.
- For purely static hosting, inline type="module" scripts may import `./config/supabase.js` relatively.
- Never commit service_role keys; only client anon keys may be referenced by the browser.

## Conventions
- Styling lives in a `<style>` tag per page; brand color `#ff4d00`, backgrounds `#dedede`/`#f6f6f6`; fonts via Google Fonts (Cinzel, Playfair Display); Font Awesome via CDN.
- Page transitions: each page defines `.page-transition` and `handlePageTransition(url)`. Replace inline `onclick` navigations with event listeners calling `handlePageTransition`.
- Guest mode: `customer.html` shows Login/Register only if URL has `?guest=true`. Preserve this param when navigating from home.
- Reuse navbar/header/footer patterns from `customer.html` for new pages.

### Supabase conventions (prototype)
- Centralize config: `src/config/supabase.js` (or `.ts` if we later migrate). Provide a single `getSupabaseClient()`.
- Auth flow: replace `dummyUsers` in `login.html` with `supabase.auth.signInWithPassword({ email, password })`. On success, route by role (admin/client) stored on the user’s profile table.
- User profile/role: store role in a `profiles` table keyed by `auth.users.id`. Read it after login and redirect accordingly.
- Password reset: replace the mocked OTP in `forgot_password.html` with `supabase.auth.resetPasswordForEmail(email, { redirectTo: <site-url>/reset })`.

## Adding features/pages
- Admin area: add `src/Dasboard/admin.html` mirroring `customer.html`; change `login.html` to route admins there.
- Contracts: create `src/Dasboard/contracts.html`; add a left-panel or navbar link in admin and route with the transition helper.
- Map: replace the `.live-map` placeholder with a real map SDK when integrating tracking.

Supabase-backed features (incremental):
- Contracts list/detail: fetch from `contracts` table; filter by active/expired. Use RLS to restrict visibility.
- Orders/Shipments table: back `orders table` in `customer.html` with `shipments` table. Add lightweight fetch & render.
- Realtime: optional; subscribe to `trucks`/`telemetry` with Supabase Realtime channels to update live map.

## Integration points (future-ready)
- GPS: Poll/subscribe to `/api/trucks/:id/location` for status (running/halt/speed) and show on the map with badges.
- Analytics: Add date-range filters (hours/days/months/years) and charts (fuel, halts, breakdowns, distance, speed, geo segments) via a CDN chart lib (e.g., Chart.js).
- Routing: Provide multiple route options and ETA/cost using a pathfinding algorithm service; encapsulate behind a module/API call.
- Security: No secrets or real credentials in client. Centralize future API base URLs in a config and use secure auth when backend exists.

Supabase-specific
- Security model: enable Row Level Security (RLS) on all tables. Define policies that allow users to access only their rows; admins can access broader scopes.
- Secrets: store the Supabase URL and anon key in an environment-specific config not checked into VCS (or a single `config.example.js` with placeholders). For static hosting, instruct deploy platform to inject runtime config if possible.

## Examples in code
- Home guest button -> `../Dasboard/customer.html?guest=true` via `handlePageTransition`.
- Login success -> `../Dasboard/customer.html` after checking `dummyUsers`.
- Transition rewiring: `home.html` converts `button[onclick]` to event listeners calling `handlePageTransition`.

## Pitfalls
- Relative links must account for space in `login and reg` and misspelling `Dasboard`.
- `npm start` won’t work as a React app until we migrate; serve statically instead.

If a request conflicts with current patterns (e.g., renaming folders), propose minimal, consistent changes and ask for confirmation before large refactors.
