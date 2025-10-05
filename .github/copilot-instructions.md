# AI agent instructions for RTS-website

This repo contains a Next.js App Router app (TypeScript) under `src/app` and legacy static HTML prototypes under `src/Dasboard` and `src/login and reg` (kept for reference). The canonical app is the Next.js one. We integrate Supabase for authentication, database (tables, storage), and realtime.

## Big picture
- Entry: `src/login and reg/home.html` (landing with Sign Up, Login, Guest).
- Auth: `src/login and reg/login.html` checks a local `dummyUsers` array, role toggle (admin/customer) only affects copy; success redirects to dashboard.
- Dashboard: `src/Dasboard/customer.html` (folder spelled "Dasboard"). Contains live map placeholder, orders table, cost/payment, rate calculator, support, documents, about.
- Forgot password: `src/login and reg/forgot_password.html` mocks email/OTP flow client-side.

## Run & debug
- Use `npm run dev` (Turbopack enabled) to run Next.js locally.
- Env vars in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Top-level `app/*` shims re-export from `src/app/*` to keep routes stable.

### Supabase quickstart
- Use the shared helpers: `@/utils/supabase/client` for client components and `@/utils/supabase/server` for SSR components. Do not hardcode keys in pages.
- Store only the anon key in the browser; never expose service_role.

## Conventions
- Styling is centralized in `src/app/globals.css` (brand `#ff4d00`, backgrounds `#dedede`/`#f6f6f6`, fonts Cinzel/Playfair Display). Avoid inline styles.
- Client pages use a small `Effects` component for page transitions.
- Preserve `?guest=true` across routes in customer flows when applicable.

### Supabase conventions
- Auth: use `supabase.auth.signInWithPassword` and then read `profiles.role` to route admin → `/admin`, client → `/dashboard/customer`.
- Profiles: `profiles` keyed by `auth.users.id`, with `role in ('admin','client')` and optional `client_id`.
- Password reset: `supabase.auth.resetPasswordForEmail(email, { redirectTo: <site-url>/reset })`.

## Adding features/pages (Next.js)
- Admin area: `src/app/admin/page.tsx`.
- Contracts: `src/app/contracts/page.tsx` backed by Supabase `contracts` with active/expired filters.
- Customer dashboard: `src/app/dashboard/customer/page.tsx` backed by `shipments` with filters.
- Map: replace `.live-map` with a real map (Leaflet/MapLibre) as a client component.

Supabase-backed features (incremental):
- Live GPS/Telemetry: `trucks` and `telemetry` tables; subscribe to realtime topics for map updates.
- Contracts list/detail: fetch from `contracts`, filter active/expired, RLS per client.
- Shipments: back orders table with `shipments`, scoped by `profiles.client_id`.
- Realtime: subscribe to `notifications` for in-app updates.

Client intake and approvals
- Add a booking form (source, destination, weight, material, pickup date, duration, notes) with vehicle recommendation by weight/capacity.
- Admin reviews and approves bookings → convert to `shipments` and notify client.

Routing and ETA
- Use routing algorithms/APIs (OSRM/Mapbox/Google) for route choices, distances, ETA, and optionally tolls.

Analytics
- Date-range filters; charts for trucks (fuel, halts, distances, speeds), locations (top origins/destinations, route choices), and clients (volume, revenue).

## Integration points (future-ready)
- GPS: Poll/subscribe to `/api/trucks/:id/location` for status (running/halt/speed) and show on the map with badges.
- Analytics: Add date-range filters (hours/days/months/years) and charts (fuel, halts, breakdowns, distance, speed, geo segments) via a CDN chart lib (e.g., Chart.js).
- Routing: Provide multiple route options and ETA/cost using a pathfinding algorithm service; encapsulate behind a module/API call. Respect vehicle class constraints.
- Security: No secrets or real credentials in client. Centralize future API base URLs in a config and use secure auth when backend exists.

Supabase-specific
- Security model: enable Row Level Security (RLS) on all tables. Define policies that allow users to access only their rows; admins can access broader scopes.
- Secrets: store the Supabase URL and anon key in an environment-specific config not checked into VCS (or a single `config.example.js` with placeholders). For static hosting, instruct deploy platform to inject runtime config if possible.

## Examples in code
- Login success → route by `profiles.role`.
- Contracts page → reads from Supabase with Active/Expired filter.
- Customer dashboard → reads shipments scoped by `profiles.client_id`.

## Pitfalls
- Keep alias imports stable (`@/*` → repo root). Top-level `app/*` must only re-export from `src/app/*`.
- Avoid inline secrets; never commit service_role.

If a request conflicts with current patterns (e.g., renaming folders), propose minimal, consistent changes and ask for confirmation before large refactors.
