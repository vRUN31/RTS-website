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
 - Admin gating: only allow admin sign-up/login when `email` domain is in `NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS` or the exact `email` is listed in `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated).

## Conventions
- Styling is centralized in `src/app/globals.css` (brand `#ff4d00`, backgrounds `#dedede`/`#f6f6f6`, fonts Cinzel/Playfair Display). Avoid inline styles.
- Client pages use a small `Effects` component for page transitions.
- Preserve `?guest=true` across routes in customer flows when applicable.

### Supabase conventions
- Auth: use `supabase.auth.signInWithPassword` and then read or bootstrap `profiles.role` to route admin → `/admin`, client → `/dashboard/customer`. Admin role requires `email` domain in `NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS`.
- Profiles: `profiles` keyed by `auth.users.id`, with `role in ('admin','client')` and optional `client_id`.
- Password reset: `supabase.auth.resetPasswordForEmail(email, { redirectTo: <site-url>/reset })`.

## Adding features/pages (Next.js)
- Admin area: `src/app/admin/page.tsx`.
- Contracts: `src/app/contracts/page.tsx` backed by Supabase `contracts` with Active/Expired filters and a minimal Create Contract stub.
- Customer dashboard: `src/app/dashboard/customer/page.tsx` backed by `shipments` with filters.
- Map: Leaflet client component at `src/components/map/LeafletMap.client.tsx`. Admins see full telemetry and a "More info" section; clients see only truck plate/identifier and real-time package location. In Server Components (e.g., admin page), import the client component directly. Do not use `next/dynamic` with `ssr: false` in Server Components.

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
- Admin dashboard includes date-range and grain filters (hour/day/month/year), KPI cards, and charts (Shipments by Status, Shipments/Month, Trucks by Status, Distance/Month, Revenue/Month) via a client component.
- Quick actions: Quick range buttons, Create Contract shortcut, and CSV export of shipments filtered by range.

## Integration points (future-ready)
- GPS: Poll/subscribe to `/api/trucks/:id/location` for status (running/halt/speed) and show on the map with badges.
	- Adapter: a small process receives GPS hardware updates (polling/webhook) and writes to `telemetry(truck_id, ts, lat, lng, speed, status)`. UI listens on Supabase Realtime INSERT and moves markers.
- Analytics: Add date-range filters (hours/days/months/years) and charts (fuel, halts, breakdowns, distance, speed, geo segments) via a CDN chart lib (e.g., Chart.js).
- Routing: Provide multiple route options and ETA/cost using a pathfinding algorithm service; encapsulate behind a module/API call. Respect vehicle class constraints.
- Security: No secrets or real credentials in client. Centralize future API base URLs in a config and use secure auth when backend exists.

Supabase-specific
- Security model: enable Row Level Security (RLS) on all tables. Define policies that allow users to access only their rows; admins can access broader scopes.
 - Profiles RLS: add a self-insert policy so users can upsert their own profile row: `create policy "profiles self insert" on profiles for insert with check (auth.uid() = id);`
- Secrets: store the Supabase URL and anon key in an environment-specific config not checked into VCS (or a single `config.example.js` with placeholders). For static hosting, instruct deploy platform to inject runtime config if possible.

## Examples in code
- Login success → route by `profiles.role`.
- Contracts page → reads from Supabase with Active/Expired filter.
- Customer dashboard → reads shipments scoped by `profiles.client_id`; map shows limited truck info.
- Admin dashboard → embeds `LeafletMap.client` showing full fleet, KPI cards, recent shipments, date/grain filters, quick actions (create contract, CSV export), and multiple analytics charts rendered via Chart.js.

## Pitfalls
- Keep alias imports stable (`@/*` → repo root). Top-level `app/*` must only re-export from `src/app/*`.
- Avoid inline secrets; never commit service_role.
 - Leaflet is client-only: include CSS in `src/app/layout.tsx`. In Server Components, do not use `next/dynamic({ ssr:false })`; import the client component directly since it has `"use client"`.
 - When fetching client-visible trucks for the map, avoid implicit joins unless FKs and RLS are configured accordingly. Prefer a two-step fetch: (1) `shipments` → truck_ids (not null), (2) `trucks` → where id in truck_ids.

Troubleshooting map errors

- If you see `{}` in the console from `LeafletMap.client.tsx`, it means the thrown error object was not enumerable. The component now logs a richer message using `e.message`, `e.details`, and `e.hint` when available. Ensure env vars are set and RLS policies allow the reads being attempted.

If a request conflicts with current patterns (e.g., renaming folders), propose minimal, consistent changes and ask for confirmation before large refactors.
