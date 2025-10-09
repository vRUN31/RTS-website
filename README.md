# Raj Mohan Transport Services (RTS)

Next.js 15 App Router app with Supabase for auth, database, and realtime. It provides role-based admin/client flows, live fleet map, analytics, bookings, and basic truck/driver management.

## What’s in here (Oct 2025)

Completed
- Next.js App Router + TypeScript + Supabase integration
- Auth with role-based gating (profiles.role in ['admin','client']) and admin allowlist by domain/email
- Admin dashboard (/admin) with:
  - KPI cards, recent shipments, Leaflet map (full fleet view)
  - Date range and grain filters, CSV export (admin/export/shipments)
  - Manage Book Truck Requests with Approve/Reject actions
- Analytics (/admin/analytics) charts via a client component
- Client dashboard (/dashboard/customer) with scoped shipments and limited map
- Contracts list (/contracts) with Active/Expired filter
- Manage Trucks (/manage-trucks) that persists to Supabase
- Top-level route shims to avoid 404s and normalize legacy URLs

Recent updates
- Fixed route inconsistencies: added app/admin/analytics and app/manage-trucks shims; legacy /admin-analytics now redirects to /admin/analytics
- Navigation: for admins, Dashboard → /admin and Analytics → /admin/analytics; “Home” hidden (brand navigates home)
- Approval UX: Approve opens a responsive Assign Truck modal; Reject updates immediately
- Approval logic: creates a shipment with basic validation and enrichment (ETA, cost, contract)
- Schema hardened and idempotent: added public.is_admin(uid) helper, RLS policies use DROP IF EXISTS + CREATE, indexes guarded
- Client/server boundary fixes: extracted the page-level modal listener into a dedicated Client Component `src/components/admin/OpenAssignTruckModalListener.client.tsx` and imported it in `src/app/admin/page.tsx` (fixes “useState only works in Client Components”)
- Hydration fix for table modal: Assign Truck modal renders via a portal attached to `document.body` to avoid putting a `<div>` inside `<tbody>`; see `src/components/admin/AssignTruckModal.client.tsx`
- Schema guard: ensured `trucks.location` exists via idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `supabase/schema.sql`; `drivers` table and `trucks.driver_id` linkage included

Static HTML prototypes are still available under `src/Dasboard` and `src/login and reg` for reference.

## Quick start

1) Configure env

- Copy `.env.local.example` to `.env.local` and fill:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS` (comma-separated domains)
  - `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated emails)

2) Install and run

```bash
npm install
npm run dev
```

Alternatively, using Bun:

```bash
bun install
bun run dev
```

The dev server runs on port 3000 when available.

## Supabase setup

1) Create a project on Supabase and get the URL + anon key
2) Apply schema: open Supabase SQL editor and run `supabase/schema.sql`
3) Seed minimal data
- Insert a `clients` row
- Create a user (Auth) → insert into `profiles` with id = auth user id, role = 'admin' or 'client', and optional client_id for clients
- Optional: insert trucks, drivers; set `trucks.driver_id` for linking

Tables of interest (high-level)

- profiles(id, role, name, email, client_id)
- clients(id, name, ...)
- contracts(id, client_id, start_at, end_at, ...)
- shipments(id, client_id, contract_id, truck_id, origin, destination, status, eta, cost, created_at)
- trucks(id, plate, status, location, driver_id, ...)
- drivers(id, name, phone, license, ...)
- telemetry(id, truck_id, ts, lat, lng, speed, status)
- bookings(id, user_id, client_id, vehicle_type, source_city, destination_city, weight_mt, pickup_date, status)

RLS summary (admin highlights)

- Profiles: self read/update/insert; admin read via public.is_admin()
- Clients/Contracts/Shipments/Trucks/Telemetry: admin read; shipments admin insert
- Bookings: client insert/select; admin read/update
- Drivers: admin read

## Core routes and workflows

Auth and role routing

- `/login`, `/register`: Supabase auth with admin allowlist
- Role bootstrap → route admin → `/admin`, client → `/dashboard/customer`

Admin dashboard `/admin`

- Guarded SSR; shows KPIs, map, recent shipments, bookings table
- Approve opens Assign Truck modal: pick a truck (with driver details) and submit
- Reject marks booking rejected

Analytics `/admin/analytics`

- Server-side metrics with client charts

Manage Trucks `/manage-trucks`

- Add/remove trucks persisted in Supabase (id, plate, status, location)

Admin link Drivers ↔ Trucks `/admin/manage-trucks`

- Admin-only SSR page to assign `trucks.driver_id`

Contracts `/contracts`

- Browse and filter contracts client-side

Exports `/admin/export/shipments`

- CSV export for shipments by date range

Route stability and redirects
- app/* shims re-export src/app/* pages to keep `/admin`, `/admin/analytics`, `/manage-trucks` stable
- Middleware normalizes legacy paths (`/manage-truck`, `/admin/manage-truck`, `/admin/manage-trucks`) → `/manage-trucks`
- `/admin-analytics` redirects → `/admin/analytics`

## Maps and realtime

Leaflet client component: `src/components/map/LeafletMap.client.tsx`
- Admin sees full fleet and telemetry detail
- Client sees only limited information linked to their shipments

Realtime: insert into `telemetry(truck_id, ts, lat, lng, speed, status)` → UI subscribes and updates markers

GPS ingestion: small adapter process writes to telemetry; `trucks` and `shipments` link data to the map

## UI and responsiveness

- Global styles in `src/app/globals.css` with responsive table and modal patterns
- Assign Truck modal is scrollable, resizes with viewport, and hides non-essential columns on small screens
- Top nav for admin hides “Home”; the brand links home
 - Modal trigger pattern: the Approve button dispatches a window event handled by `src/components/admin/OpenAssignTruckModalListener.client.tsx`, which mounts the modal outside the table via a portal

## Troubleshooting

- Missing names/emails in admin bookings table: ensure `profiles.name` or `profiles.email` exists for the user; the UI prefers name ⇒ email ⇒ short id
- 404 for `/admin/analytics` or `/manage-trucks`: confirm top-level shims exist under `app/admin/analytics` and `app/manage-trucks`
- RLS blocks admin actions: verify `public.is_admin(uid)` function and admin policies are applied from `schema.sql`
- Map not rendering: check Leaflet CSS link in `src/app/layout.tsx` and env configuration

- TypeError: useState only works in Client Components
  - Cause: A React hook was used inside a Server Component file.
  - Fix: Move hook-using logic into a `.client.tsx` component and import it from the server page. This repo uses `src/components/admin/OpenAssignTruckModalListener.client.tsx` and imports it in `src/app/admin/page.tsx`.

- Hydration error: “div inside tbody” when opening the modal from a table row
  - Cause: Rendering a modal container within a `<tbody>` breaks DOM invariants.
  - Fix: Render the modal via a portal appended to `document.body`. See `src/components/admin/AssignTruckModal.client.tsx` for the portal pattern.

- Supabase error: column "location" of relation "trucks" does not exist
  - Cause: The database did not yet have the `trucks.location` column.
  - Fix: Apply `supabase/schema.sql` which includes `ALTER TABLE trucks ADD COLUMN IF NOT EXISTS location text;` and re-run the app.

## Roadmap (near-term)

- Driver records UI (off-nav) with create/edit; optional documents upload
- Rich truck status model (running, halt, maintenance, offline), filters and bulk actions
- ETA from routing service (Mapbox/OSRM/Google) and cost estimation
- Client intake: vehicle recommendation by weight and lane
- Analytics expansion: date/grain presets, KPIs, charts (fuel, halts, distance, revenue), CSVs
- In-app notifications using Supabase Realtime `notifications`
- Documents via Supabase Storage (contracts, invoices)

## Notes

- Keep service_role secrets out of client code; only anon key in browser
- Prefer two-step fetches for RLS-safe reads (e.g., shipments → truck_ids → trucks)
- For Server Components, import client components like Leaflet directly; avoid `next/dynamic({ ssr:false })` in RSC
