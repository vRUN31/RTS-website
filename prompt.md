# Raj Mohan Transport Services — Product Prompt

This document describes the end-to-end requirements and constraints for the "Raj Mohan Transport Services" website. It guides designers, engineers, and AI agents to build features consistently. Update this file as the proprietor adds new requirements.

We are integrating Supabase as the backend-as-a-service for authentication, database (Postgres with RLS), storage, and optional realtime updates. The website should connect to Supabase for user auth and data operations.

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
   - Ingest data from physical GPS devices installed in trucks.
   - Continuously update truck status: running/halt, speed, last updated time, current location.
   - Display on a map (per truck and fleet overview) with status badges.

2. Client and Contract Intake
   - Interface to create new clients and new contracts with full details (client profile, contact, SLA, start/end dates, lanes, rates, documents).
   - Contracts visible in a left panel item "Contracts" (admin). Clicking routes to a contracts page listing all contracts with filters and links to details.

3. Estimates
   - Compute Estimated Time of Arrival (ETA), estimated cost, and efficiency metrics for planned or active routes.
   - Expose a rate calculator for distance (km) and weight (MT) with a configurable pricing model.

4. Routing
   - Use routing algorithms (e.g., Dijkstra/A*) or external APIs to find best routes between source and destination.
   - Show multiple route choices with distance, ETA, tolls (if available), and historical speed segments.

5. Secure Database
   - Backing store: Supabase (Postgres) with Row Level Security (RLS) and policies.
   - Apply rigorous security: least-privilege roles, encrypted secrets, parameterized queries, audited access, regular backups.
   - Store trucks, locations, telemetry, clients, contracts, shipments, invoices, users/roles.

6. Analytics Dashboard (filterable by hour/day/month/year)
   - Truck analytics: Fuel usage (diesel), halts and running hours, breakdowns, distances, speeds, high-speed/low-speed segments by location.
   - Location analytics: Top sources/destinations, distances, route choices, regional client density.
   - Client analytics: Volume, revenue, on-time %, cancellations, dispute rates.
   - Freight analytics: Weight/volume distributions, average load factor, efficiency.

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

## UI pages (current + to add)

- Landing: `src/login and reg/home.html` — buttons link to Register/Login; Guest opens customer dashboard with `?guest=true`.
- Login: `src/login and reg/login.html` — replace mock users with `supabase.auth.signInWithPassword`; fetch profile role and route accordingly.
- Forgot password: `src/login and reg/forgot_password.html` — replace mocked OTP with `supabase.auth.resetPasswordForEmail` + redirect flow.
- Customer dashboard: `src/Dasboard/customer.html` — map placeholder, orders table, cost, rate calculator, support, documents, about.
- Admin dashboard (to add): `src/Dasboard/admin.html` — fleet live map, KPIs, recent contracts, left nav with "Contracts".
- Contracts page (to add): `src/Dasboard/contracts.html` — list, filters (active/expired), detail view, renewal actions.

## Navigation and UX patterns

- Use the existing fade transition (`.page-transition` + `handlePageTransition(url)`) for all intra-site navigation.
- Preserve `?guest=true` for guest flows; show/hide auth actions accordingly.
- Keep brand and typography consistent (Cinzel/Playfair Display, #ff4d00 accents, #dedede backgrounds).

## Implementation notes for the current repo

- The site is static HTML. Serve over a static server during development. For Supabase, include a central `src/config/supabase.js` exporting the client using Public URL + Anon key (no service role in client).
- Directory quirks: `src/Dasboard` (misspelling) and `src/login and reg` (contains a space). Keep paths consistent or plan a rename migration.
- When adding new pages, co-locate simple CSS in-page to match existing convention; extract later if we formalize a framework.

### Supabase schema sketch (initial)

- profiles(id uuid PK references auth.users, role text check in ['admin','client'], name text, client_id uuid nullable)
- clients(id uuid PK, name text, contacts jsonb, gst text, billing_terms text)
- trucks(id uuid PK, plate text, device_id text, status text, last_lat double, last_lng double, speed numeric, last_updated timestamptz)
- telemetry(id bigint PK, truck_id uuid references trucks, ts timestamptz, lat double, lng double, speed numeric, status text)
- contracts(id uuid PK, client_id uuid references clients, start_at date, end_at date, lanes jsonb, base_rates jsonb, documents jsonb)
- shipments(id uuid PK, client_id uuid references clients, contract_id uuid references contracts, truck_id uuid references trucks, origin text, destination text, distance_km numeric, weight_mt numeric, status text, eta timestamptz, cost numeric)

RLS policies: clients can only see their rows; admins can see all.

## Future extensions (append as requested by proprietor)

- Automated invoicing and GST-compliant billing.
- Driver app integration (HOS, fuel receipts, breakdown reporting).
- Geofencing alerts for specific lanes and client SLAs.
- Multi-tenant support if needed.

---
Update this document whenever new requirements are shared. Include date, author, and a short rationale for each addition.
