# Raj Mohan Transport Services — Product Prompt

This document describes the end-to-end requirements and constraints for the "Raj Mohan Transport Services" website. It guides designers, engineers, and AI agents to build features consistently. Update this file as the proprietor adds new requirements.

We are integrating Supabase as the backend-as-a-service for authentication, database (Postgres with RLS), storage, and optional realtime updates. The website should connect to Supabase for user auth and data operations.

## Current project status (2025-10-05)

Done (MVP scaffolding):

- Next.js App Router project (TypeScript) with `src/app` as the source of truth; top-level `app/*` files are shims re-exporting `src/app/*`.
- Global styles and utilities in `src/app/globals.css`; page transition effects in a small client component.
- Supabase setup: browser client helper (`@/utils/supabase/client`), server helper for SSR (`@/utils/supabase/server`), middleware helper; environment keys via `.env.local`.
- Path alias configured: `@/*` resolves to project root (see `tsconfig.json`).
- Auth pages wired to Supabase client helper: `src/app/login`, `src/app/register`, `src/app/forgot-password` with graceful fallback to demo behavior if env keys are missing. Admin sign-up/login is gated by allowed email domains and/or explicit admin emails.
- Landing page (`src/app/page.tsx`) is an async server component; contains an optional Supabase read example.
- Admin page includes an SSR guard enforcing admin role; Customer dashboard scaffolded.
- Admin dashboard upgraded: live map, KPI cards (trucks, shipments, contracts), date/grain controls (hour/day/month/year), analytics charts (Shipments by Status, Shipments/Range, Trucks by Status, Distance/Range, Revenue/Range), quick actions (Create Contract, Export CSV), and a Recent Shipments table.
- CSV export: `/src/app/admin/export/shipments/route.ts` provides a CSV export of shipments filtered by `start`/`end` query params.
- Contracts page wired to Supabase with Active/Expired filters and a minimal "Create Contract" stub form.

In progress / not yet implemented:

- Supabase schema exists in `supabase/schema.sql` and seed in `supabase/seed.sql`; ensure they are applied to your Supabase project to enable live data. Pages assume `profiles`, `trucks`, `shipments`, `contracts`, and `telemetry` tables with RLS.
- Role-based redirect post-login is handled via `profiles.role` with admin gating by domain and explicit email allowlist; SSR guard protects `/admin`.
- GPS map and realtime telemetry implemented with a client-only Leaflet component and Supabase Realtime; admin vs client visibility enforced. Client map fetch uses a safe two-step query (shipments → truck_ids → trucks) to avoid implicit joins and reduce errors when FKs or RLS are not fully configured. Error logging improved to surface `message/details/hint`.
- Telemetry-derived KPIs (on-time %, idling hours, average speed) and broader analytics (fuel, halts, speed segments, geo segments) — planned next.
- Date-range picker UI (custom start/end) in addition to quick range buttons — planned.
- Notifications/Dispatch flows outlined but not implemented.

Notes on scope: “Complete the whole project” includes database schema, RLS policies, realtime, routing APIs, and multiple admin/client features which require coordinated DB provisioning and UI wiring. The foundation is in place; the remaining work is enumerated below under “Next milestones” with concrete, incremental steps.

## Vision

A transport logistics/trucking platform serving both consumers (clients) and the company (admins). Admins manage fleet, contracts, analytics, and live tracking. Clients book shipments, track orders, and manage invoices.

## Roles and access

- Admin: Company staff with access to fleet tracking, contracts, analytics, client management, and system settings. Only admins may log in to the admin section.
- Client/Consumer: Customers who can log in to book, track, and manage their shipments and payments.

## Information architecture

- Public landing: Welcome/home, login/register, guest explore.
- Client area: Customer dashboard (orders, tracking, rate calculator, documents, support).
- Admin area: Admin dashboard (live fleet map, analytics, contracts, client intake, ops KPIs).
- Contracts module: List, detail, analytics of time-based contracts (monthly/yearly), renewal alerts, attached documents.

## Core features

1. Live Location Catalog (GPS)
   - Ingest data from physical GPS devices installed in trucks (hardware trackers or driver app). Support a polling adapter and a realtime adapter.
      - Frontend map: Leaflet.js component renders live truck markers. Admins see full telemetry and "More info" popup; clients see only truck plate/identifier and current package location.
   - GPS hardware integration: create an adapter that posts telemetry to the Supabase `telemetry` table (truck_id, ts, lat, lng, speed, status). Realtime subscriptions move markers instantly.
   - Continuously update truck status: running/halt, speed, heading, ignition, last updated time, current lat/lng.
   - Normalize device payloads into a unified Telemetry model; dedupe bursts and store downsampled history for analytics.
   - Display on a map (per-truck and fleet overview) with status badges (running/halt/offline) and last update age.
   - Edge cases: device offline, stale data, GPS jitter, time skew. Provide graceful fallbacks and flags.

2. Client and Contract Intake
   - Admin UI to create clients (name, contacts, GST, billing terms) and contracts (SLA, start/end dates, lanes, base rates, documents).
   - Intake workflow: draft → review → activate; upload contract docs (PDF/Images) to storage with metadata and versioning.
   - Contracts visible in an admin sidebar and list page with filters (active/expired/future) and quick links to detail views.
   - RLS ensures only admins can create/update; clients can only read their own contracts.

3. Estimates
   - Compute ETA, estimated cost, and efficiency metrics for planned/active routes.
   - Provide a rate calculator: inputs distance (km), weight (MT), optional vehicle class and service level; pricing model configurable at client or contract level.
   - Efficiency: show load factor, detour percentage, on-time likelihood (based on historical speeds), and CO2 estimate (optional).

4. Routing
   - Use routing algorithms (Dijkstra/A*, Contraction Hierarchies) or external APIs (Mapbox/OSRM/Google) to find best routes.
   - Show multiple routes with distance, ETA, tolls (if available), and historical speed segments; pick default by weighted score.
   - Include dynamic constraints: vehicle class/height restrictions, traffic, weather (future), and toll optimization.

5. Secure Database
   - Backing store: Supabase (Postgres) with RLS and policies for all tables.
   - Rigorous security: least-privilege roles; encrypted secrets; parameterized queries; audit logs; PITR backups; schema migrations tracked; alerting on policy bypass attempts.
   - Entities: trucks, telemetry, clients, contracts, shipments, invoices, users/roles, drivers, vehicles, routes, analytics aggregates.

6. Analytics Dashboard (filterable by hour/day/month/year)
   - Time filters: hour/day/month/year; aggregate windows (1h/6h/24h/7d/30d/custom).
   - Truck analytics: fuel usage, idling vs running hours, breakdown count, distances, speeds, high/low speed segments by geofence.
   - Location analytics: top sources/destinations, distances, route choices, regional density heatmaps.
   - Client analytics: volume, revenue, on-time %, cancellations, disputes.
   - Freight analytics: weight/volume distributions, average load factor, efficiency, vehicle match quality.
   - Export/print and CSV downloads for reports.

7. Driver Management, Dispatch, and Notifications
   - Driver registry with status (available, busy, off-duty), current location (via device/phone), skills/vehicle class, and active contracts.
   - Smart assignment: when a client creates a shipment/order, select the best driver/truck based on proximity to pickup, capacity, duty status, current workload, SLA window, and historical reliability.
   - Offer lifecycle: create a dispatch offer to the selected driver(s); driver can Accept/Reject considering ongoing contracts and legal duty limits.
   - Notifications: admin-to-driver and system-to-driver push via multiple channels (in-app realtime, SMS, WhatsApp, email; pluggable provider); audit each notification.
   - Fallbacks: if primary driver rejects or times out, auto-escalate to the next ranked driver; if no one accepts within SLA, alert admin.
   - Visibility: admin console to monitor offers, responses, and auto-assignments; client sees ETA once a driver accepts.

Reasoning:

- Optimizes for on-time pickup while respecting compliance (duty hours) and ongoing commitments; minimizes deadhead distance and improves fleet utilization.
- Multi-criteria selection beats naive nearest-driver because capacity, availability windows, and service SLAs matter as much as location.

## Non-functional requirements

- Security: Role-based access control; secure auth; HTTPS; secrets vaulted; input validation.
- Reliability: Graceful degradation if telemetry temporarily drops; retries; caching for maps/analytics queries.
- Performance: Map interactions <100ms pan/zoom; analytics queries under practical SLAs.
- Observability: Structured logs, basic metrics, and error reporting.

## Data model (initial sketch)

- User(id, role[admin|client], name, email, hash, clientId?)
- Client(id, name, contacts[], gst, billingTerms)
- Truck(id, plate, deviceId, status, lastLocation{lat,lng}, speed, lastUpdated)
- Contract(id, clientId, startAt, endAt, lanes[], baseRates, documents[])
- Shipment(id, clientId, contractId?, truckId?, origin, destination, distanceKm, weightMT, status, eta, cost)
- Telemetry(id, truckId, ts, lat, lng, speed, status)

Driver & dispatch additions (Supabase):

- Driver(id, user_id references profiles, name, phone, status['available','busy','off-duty'], home_base, skills jsonb, vehicle_id uuid nullable)
- Vehicle(id, plate, type, capacity_mt, attrs jsonb)
- DriverLocation(driver_id, ts, lat, lng, speed) — optional if not piggybacking on Truck telemetry
- DispatchOffer(id, shipment_id, driver_id, rank int, status['pending','accepted','rejected','expired'], expires_at, created_at)
- Notification(id, user_id, type['dispatch','system','reminder'], channel['inapp','sms','email','whatsapp'], payload jsonb, status['queued','sent','failed','read'], created_at, read_at)

Consumer booking and recommendation

- Booking(id, client_id, source_city, destination_city, material, weight_mt, pickup_date, special_instructions, status['draft','submitted','approved','rejected','in_transit','delivered'])
- Vehicle recommendation: choose vehicle by capacity_mt, lane restrictions, contract terms, and historical acceptance. Persist chosen class on shipment.

Communication

- Chat rooms (shipment_id or driver-admin room), messages with sender_id, ts, content; optional audio call sessions with status and duration metadata. Keep media keys off-client.

RLS: drivers may see only their own offers and notifications; clients see only their shipments; admins see all.

## API surface (to be implemented)

### Supabase-first approach

- Use `@supabase/supabase-js` from the client for auth and simple CRUD (with RLS-enforced policies).
- For complex logic or sensitive operations, add Supabase Edge Functions later.

### If/when adding a custom API

- Auth: /api/auth/login, /api/auth/logout, /api/auth/forgot, /api/auth/reset (proxy to Supabase where applicable)
- GPS: /api/trucks, /api/trucks/:id, /api/trucks/:id/location (SSE/WebSocket)
- Contracts: /api/contracts, /api/contracts/:id
- Clients: /api/clients, /api/clients/:id
- Shipments: /api/shipments, /api/shipments/:id
- Analytics: /api/analytics/overview?range=..., /api/analytics/trucks, /api/analytics/locations, /api/analytics/clients
- Routing: /api/routes?origin=..&dest=..&algorithm=dijkstra|astar

### Dispatch workflow APIs

- POST /api/shipments/:id/dispatch — run selection and create DispatchOffer(s) with ranked candidates.
- POST /api/dispatch/:offerId/accept — driver accepts; mark shipment assigned and set driver/truck.
- POST /api/dispatch/:offerId/reject — driver rejects; move to next candidate or escalate after timeout.
- GET /api/dispatch/:offerId — get offer status; used by driver clients.
- Realtime: broadcast offer updates on channel `dispatch:driver:{driver_id}` and shipment updates on `shipment:{id}`.

Selection algorithm rationale

- Score candidate drivers d by: S = w1·proximity + w2·availability + w3·capacity_fit + w4·workload_inv + w5·sla_match + w6·reliability.
- Proximity: haversine distance to pickup; Availability: status and duty time window; Capacity fit: matches vehicle capacity/type; Workload_inv: prefer lower current workload; SLA match: ability to meet pickup ETA; Reliability: historical acceptance/on-time rate.
- Tie-breaking via nearest ETA and least detour from current path.

## UI pages (current + to add)

Current Next.js pages (source of truth):

- Landing: `src/app/page.tsx` — SSR-enabled landing, optional Supabase read example.
- Login: `src/app/login/page.tsx` — client component using `@/utils/supabase/client` to sign in; demo fallback if env missing.
- Register: `src/app/register/page.tsx` — client component using `@/utils/supabase/client` to sign up; demo fallback.
- Forgot password: `src/app/forgot-password/page.tsx` — client component using `@/utils/supabase/client` to send reset email with redirect.
- Customer dashboard: `src/app/dashboard/customer/page.tsx` — UI scaffold; shows guest mode if `?guest=true` (to be wired).
- Admin dashboard: `src/app/admin/page.tsx` — live fleet map, KPI cards, date/grain filters, analytics charts, quick actions, CSV export, and recent shipments.
- Contracts: `src/app/contracts/page.tsx` — Active/Expired filters and a minimal Create Contract stub form (writes to Supabase when schema exists).

Legacy static HTML prototypes (kept for reference):

- `src/login and reg/*.html`, `src/Dasboard/customer.html` — original prototypes; not served by Next.js. Keep paths consistent if referenced, or plan removal after full migration.

End-to-end flows snapshot (current behavior):

- Sign Up → Creates a Supabase user (when env set) and redirects to dashboard (role toggle in UI for demo).
- Login → Signs in via Supabase (when env set); redirects based on selected role (demo). Profile-based redirect is a next step.
- Forgot Password → Sends reset email via Supabase with redirect back to `/login` (when env set); otherwise shows success message.
- Guest → Visiting `/dashboard/customer?guest=true` should show a guest view (to be finalized); nav should preserve the `guest=true` param.

Driver-facing UI (to add)

- Driver portal/app: view active offers, accept/reject with reason, see assignments, navigate to pickup, mark arrival/departure, upload PoD.
- Notifications center: shows recent dispatch/system notifications with read/unread state; updates via realtime.

## Navigation and UX patterns

- Use the existing fade transition (`.page-transition` + `handlePageTransition(url)`) for all intra-site navigation.
- Preserve `?guest=true` for guest flows; show/hide auth actions accordingly.
- Keep brand and typography consistent (Cinzel/Playfair Display, #ff4d00 accents, #dedede backgrounds).

## Implementation notes for the current repo

- Framework: Next.js (App Router) with TypeScript. Source pages live in `src/app/*`. The top-level `app/*` only re-export from `src/app/*` to avoid duplication.
- Styling: Global utilities in `src/app/globals.css`. Page transition effects via a small client component.
- Mapping: `src/components/map/LeafletMap.client.tsx` is the client-only Leaflet component. It fetches initial trucks and subscribes to Supabase Realtime on `telemetry` to update positions. The layout includes Leaflet CSS via CDN. In Server Components (like the admin page), import this client component directly — do not wrap with `next/dynamic({ ssr:false })`.
- Supabase: Use `@/utils/supabase/client` in client components, `@/utils/supabase/server` for SSR with cookies, and middleware helper if needed. Do not expose service role keys.
   - Admin gating: set `NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS` and/or `NEXT_PUBLIC_ADMIN_EMAILS` to control who can be admin. Ensure `profiles` has a self-insert RLS policy so sign-ups can upsert their own profile rows.
- Environment: Configure `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Path alias: `@/*` resolves to the project root (see `tsconfig.json`).
- Legacy static HTML: Kept under `src/Dasboard` and `src/login and reg` for reference; Next.js routes do not serve them.

How to run locally:

```bash
npm install
npm run dev
# App at http://localhost:3000
```

Minimal configuration required to enable real auth:

- Create a Supabase project and set `.env.local` with your public URL and anon key.
- Ensure the redirect URLs are allowed in Supabase auth settings (e.g., `http://localhost:3000`).

Dispatch implementation notes

- Start with a simple nearest-available selection (distance + available status). Evolve weights/config in a table (e.g., dispatch_config) for tunable scoring.
- Use Supabase Realtime to notify drivers in-app; for SMS/WhatsApp/email, enqueue records in `Notification` and process via an Edge Function and provider (e.g., Twilio/WhatsApp Business, SendGrid) — keep provider keys server-side.
- Enforce constraints in database: unique accepted offer per shipment; triggers to auto-expire offers after `expires_at`.
- For privacy and RLS, drivers only subscribe to their own dispatch channels; clients subscribe only to their shipments.

### Supabase schema sketch (initial)

- profiles(id uuid PK references auth.users, role text check in ['admin','client'], name text, client_id uuid nullable)
- clients(id uuid PK, name text, contacts jsonb, gst text, billing_terms text)
- trucks(id uuid PK, plate text, device_id text, status text, last_lat double, last_lng double, speed numeric, last_updated timestamptz)
- telemetry(id bigint PK, truck_id uuid references trucks, ts timestamptz, lat double, lng double, speed numeric, status text)
- contracts(id uuid PK, client_id uuid references clients, start_at date, end_at date, lanes jsonb, base_rates jsonb, documents jsonb)
- shipments(id uuid PK, client_id uuid references clients, contract_id uuid references contracts, truck_id uuid references trucks, origin text, destination text, distance_km numeric, weight_mt numeric, status text, eta timestamptz, cost numeric)

Telemetry ingestion adapter

- Hardware → Adapter → Supabase: An adapter process polls or receives webhooks from GPS devices and writes rows into `telemetry(truck_id, ts, lat, lng, speed, status)`. The UI listens on a Supabase Realtime channel for INSERT events and moves markers. Admins see detailed telemetry + More info; clients see limited info (model + current coordinates for their shipments' assigned trucks only).

RLS policies: clients can only see their rows; admins can see all.

## Next milestones to complete the MVP

1. Auth completion and role routing

- Create `profiles` table keyed by `auth.users.id` with `role in ['admin','client']`.
- After sign-in, read profile and redirect: admin → `/admin`, client → `/dashboard/customer`.
- Add a lightweight profile bootstrap on sign-up.

1. Contracts module wired to Supabase

- Create `contracts` table with RLS: admins read all; clients read where `client_id` matches.
- Fetch and render contracts list in `src/app/contracts/page.tsx` with filters for active/expired.

1. Shipments table for customer dashboard

- Create `shipments` table with RLS; render a paginated table in `src/app/dashboard/customer/page.tsx`.
- Add basic filters (status/date) and a rate calculator using a simple pricing model.

1. GPS and telemetry (placeholder → real)

- Replace map placeholder with a JS map SDK (e.g., MapLibre/Mapbox/Google as per licensing).
- Backed with a `trucks` + `telemetry` table; optionally subscribe to realtime updates.

1. Notifications and dispatch (phase 1)

- Implement `dispatch_offers` and `notifications` tables; basic offer creation and accept/reject endpoints (Edge Functions) or server actions.
- In-app realtime notifications via Supabase Realtime channels.

1. Hardening and polish

2. Client intake and approval flow

- Add a customer booking form (source, destination, weight, material, pickup date, contract duration, notes).
- Recommend a vehicle class based on weight and lane; show rate estimate inline.
- Admin review/approve/reject booking; on approval, convert to shipment and notify client.

1. Analytics (phase 1)

- Create basic aggregates: per-truck kms, idling vs running hours, average speed.
- Add a date-range selector and simple charts (via CDN Chart.js) on the admin dashboard.

- Enforce RLS and policies; add error states and loading skeletons.
- Add simple tests for critical flows and a minimal README.

Acceptance criteria for MVP “complete”:

- Users can register, log in, reset password; admins route to `/admin`, clients to `/dashboard/customer`.
- Contracts render from Supabase with filters and RLS.
- Customer dashboard shows shipments from Supabase.
- Basic map shows truck positions (static or realtime) from DB.
- No secrets in client; RLS enforced.

## Future extensions (append as requested by proprietor)

- Automated invoicing and GST-compliant billing.
- Driver app integration (HOS, fuel receipts, breakdown reporting).
- Geofencing alerts for specific lanes and client SLAs.
- Multi-tenant support if needed.

---
Update this document whenever new requirements are shared. Include date, author, and a short rationale for each addition.

Last updated: 2025-10-05 — Captured current implementation status, corrected repo implementation notes to Next.js App Router, and outlined concrete milestones to reach MVP completion using the existing Supabase-first plan.
