# Raj Mohan Transport Services (RTS)

Next.js 15 App Router application with Supabase for authentication and data management. Features role-based access control, live GPS tracking, and analytics dashboard for transport logistics management.

## Current Status (October 2025)

**✅ Completed MVP Features:**
- Next.js 15 App Router with TypeScript and Supabase integration
- Authentication system with role-based routing (admin/client)
- Admin dashboard with live fleet map, KPI cards, and analytics
- Customer dashboard with shipment tracking and limited map view
- Contracts management with Active/Expired filtering
- CSV export functionality for shipments
- Responsive UI with conditional navigation (TopShell component)
- Enhanced logout with proper backend synchronization
- Leaflet.js integration for live GPS tracking
- Real-time updates via Supabase Realtime

**🔧 Recent Fixes:**
- Next.js 15 compatibility for async searchParams
- Conditional header rendering (hidden on home, register, admin routes)
- Improved logout flow with proper state clearing and home redirect
- Build stability and error handling improvements

Static HTML prototypes remain under `src/Dasboard` and `src/login and reg` for reference during migration.

## Quick start

1. Copy `.env.local.example` to `.env.local` and set:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS` (comma-separated domains allowed to sign up/login as admin; e.g., `rts.co.in,example.com`)
    - `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated explicit admin emails; e.g., `chopadeshyam8@gmail.com,owner@rts.co.in`)
2. Install deps
3. Install deps:

    npm install

4. Start dev server (PowerShell / CMD on Windows):

    npm run dev

    - The Next.js dev server will attempt to use port 3000 by default. If port 3000 is occupied the server will automatically pick the next available port (for example 3001). The terminal log will show which port it's using.

5. Quick test notes

- To test the static HTML prototypes open `src/Dasboard/customer.html` and `src/login and reg/*.html` directly in your browser or serve them via the dev server while you iterate.
- Guest mode: append `?guest=true` to dashboard URLs to simulate a guest user. The Book Truck flow will show an in-UI dialog preventing booking for guests.

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

## Architecture Notes

- **Next.js 15 Compatibility**: Updated for async searchParams and latest React 18 patterns
- **Conditional Navigation**: TopShell component provides selective header rendering based on route
- **File Structure**: Top-level `app/` directory re-exports pages from `src/app/` to maintain route stability
- **Security**: Avoid committing service_role keys. Only use the anon key in the browser
- **State Management**: Enhanced logout with proper Supabase state synchronization

## Development Roadmap

**🚧 Pending Implementation:**
- Complete Supabase schema deployment with RLS policies
- GPS hardware adapter for real telemetry ingestion
- Driver management and dispatch system
- Consumer booking with vehicle recommendation
- Advanced analytics and reporting features
- Routing algorithms and ETA calculations
- In-app notification system
- Document management and storage
- Communication features (chat, calls)

## Troubleshooting

- **Build errors**: Recent Next.js 15 compatibility issues have been resolved for searchParams
- **Missing env**: Pages will fall back to placeholders; set `.env.local` to enable live data
- **Auth login succeeds but no redirect**: Ensure `profiles.role` exists for the user
- **Dashboard shows no shipments**: Ensure `profiles.client_id` is set and there are rows in `shipments` with that `client_id`
- **Map not rendering**: Verify Leaflet CSS is loaded in `src/app/layout.tsx` and that env vars are set so the component can query Supabase
- **No real-time updates**: Confirm the adapter is inserting into `telemetry` and that Supabase Realtime is enabled for the project
- **RLS error inserting profile**: Make sure the `profiles` table has a self-insert policy:
    - `create policy "profiles self insert" on profiles for insert with check (auth.uid() = id);`
- **Logout not redirecting**: Enhanced logout now properly clears state and redirects to home page
- **Header showing on landing pages**: TopShell component now conditionally hides navigation on home, register, and admin routes
