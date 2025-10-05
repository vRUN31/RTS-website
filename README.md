# Raj Mohan Transport Services (RTS)

Next.js App Router app with Supabase for auth and data. Static HTML prototypes remain under `src/Dasboard` and `src/login and reg` for reference while we migrate.

## Quick start

1. Copy `.env.local.example` to `.env.local` and set:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS` (comma-separated domains allowed to sign up/login as admin; e.g., `rts.co.in,example.com`)
    - `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated explicit admin emails; e.g., `chopadeshyam8@gmail.com,owner@rts.co.in`)
2. Install deps
3. Start dev server

## Supabase setup (optional but recommended)

1. Create a new project at supabase.com and grab the Project URL and anon key.
2. Apply schema:
    - Open the SQL editor in Supabase and run `supabase/schema.sql`.
3. Seed minimal data:
    - Insert a row into `clients` and then create a user via Auth. Add a `profiles` row with `id` = the auth user id and `client_id` referencing your client; set `role` to `client` or `admin`.

## Routes and auth

- `/login` and `/register` use Supabase client auth when env vars are set.
    - Admin email gate: Admin can sign up/login only if their email domain is in `NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS` OR their email is explicitly listed in `NEXT_PUBLIC_ADMIN_EMAILS`.
    - On sign-up/login, we bootstrap/read `profiles.role` and route: admin → `/admin`, client → `/dashboard/customer`.
    - Admin page has an SSR route guard that checks the logged-in user's `profiles.role` and redirects non-admins to `/dashboard/customer`.
- `/contracts` reads from the `contracts` table with an Active/Expired filter.
- `/dashboard/customer` shows shipments for the logged-in user's client when linked via `profiles.client_id`. Includes text and status filters.
    - Live map: shows limited info for clients — truck model and current real-time location of their packages only.
  
## Live map and GPS (Leaflet + Supabase)

- We use Leaflet.js for maps. The client-only component is in `src/components/map/LeafletMap.client.tsx`.
    - In Server Components (e.g., `src/app/admin/page.tsx`), import this client component directly; do NOT use `next/dynamic` with `ssr: false` in an RSC. Instead, rely on the `"use client"` directive inside the component itself.
    - In Client Components (e.g., `src/app/dashboard/customer/page.tsx`), dynamic import is acceptable.
- Admin view (`/admin`): full fleet map with live updates and a "More info" popup (truck status, speed, updated time).
- Client view (`/dashboard/customer`): limited map showing only the assigned truck plate/identifier and the real-time location for their shipments.

Realtime updates

- Telemetry rows inserted into `telemetry(truck_id, ts, lat, lng, speed, status)` trigger a Supabase Realtime INSERT event.
- The UI subscribes to that channel and moves markers accordingly.

GPS hardware adapter

- Implement a small adapter (server-side service or edge function) that receives data from your GPS hardware (polling API or webhook) and writes into the Supabase `telemetry` table.
- Link your trucks in the `trucks` table (plate, model, device_id) and associate shipments with `truck_id` to enable client map visibility.

## Notes

- The top-level `app/` directory re-exports pages from `src/app/` to keep legacy routes working.
- Avoid committing service_role keys. Only use the anon key in the browser.

## Troubleshooting

- Missing env: Pages will fall back to placeholders; set `.env.local` to enable live data.
- Auth login succeeds but no redirect: Ensure `profiles.role` exists for the user.
- Dashboard shows no shipments: Ensure `profiles.client_id` is set and there are rows in `shipments` with that `client_id`.
- Map not rendering: verify Leaflet CSS is loaded in `src/app/layout.tsx` and that env vars are set so the component can query Supabase.
- No real-time updates: confirm the adapter is inserting into `telemetry` and that Supabase Realtime is enabled for the project.
- RLS error inserting profile: make sure the `profiles` table has a self-insert policy:
    - `create policy "profiles self insert" on profiles for insert with check (auth.uid() = id);`
