# Rajmohan Transport Services (RTS) 🚛

> **Enterprise-grade transportation management system** built with Next.js 15, TypeScript, and Supabase. Provides role-based workflows, real-time tracking, analytics, and comprehensive fleet management.

---

## 📋 Table of Contents

- [Project Status](#-project-status)
- [What's Working](#-whats-working-fully-implemented)
- [What's Not Working](#-whats-not-working-pending-implementation)
- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Feature Roadmap](#-feature-roadmap)
- [Documentation](#-documentation)

---

## 🎯 Project Status

**Last Updated:** October 15, 2025  
**Version:** 2.0  
**Status:** ✅ **Production-Ready Core Features** | 🚧 **Advanced Features In Progress**

---

## ✅ What's Working (Fully Implemented)

### 🔐 Authentication & Authorization
- ✅ **Supabase Auth Integration**
  - Email/password authentication
  - Role-based access control (Admin/Client)
  - Admin allowlist by domain/email (`NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS`)
  - Profile management with RLS policies
  - Password reset flow
  - Guest mode for browsing
- ✅ **Token Management**
  - Auto-refresh handling
  - Invalid token cleanup
  - Session persistence
  - Auth state listeners

### 👨‍💼 Admin Features

#### 📊 Admin Dashboard (`/admin`)
- ✅ **KPI Cards**
  - Total shipments, revenue, active trucks, idling hours
  - Date range filters (hour/day/month/year)
  - Real-time data updates
- ✅ **Live Fleet Map**
  - Full fleet visibility with Leaflet integration
  - Truck status, speed, location
  - Telemetry data visualization
- ✅ **Booking Management**
  - View pending bookings
  - Approve with truck assignment modal
  - Reject bookings with notifications
  - Trip confirmation with driver details
  - Real-time booking updates
- ✅ **Recent Shipments Table**
  - Origin, destination, status, dates
  - Sortable columns
  - Quick filters

#### 📈 Analytics Dashboard (`/admin/analytics`)
- ✅ **Interactive Charts** (Chart.js)
  - Shipments by status (doughnut)
  - Shipments per month (bar)
  - Trucks by status (doughnut)
  - Distance traveled per month (line)
  - Revenue per month (line)
  - Profit/Loss per truck (horizontal bar)
- ✅ **Performance Summary Cards**
  - Total trucks, profitable trucks
  - Loss-making trucks, fleet efficiency
- ✅ **Real-time Data**
  - Auto-refresh every 30 seconds
  - Live database subscriptions
  - Dark mode support

#### 🚛 Fleet Management (`/admin/fleet`)
- ✅ **Truck Management**
  - Add/edit/delete trucks
  - Display code, plate, status, vehicle type
  - Driver assignment
  - Location tracking
  - Status filters (Running/Halt/Offline/Maintenance)
  - Search functionality
  - Statistics dashboard
- ✅ **Driver Management**
  - Add/edit drivers
  - Link drivers to trucks
  - Phone and email tracking
  - Driver performance metrics
- ✅ **Trip History**
  - View all trips per truck
  - Origin, destination, status
  - Distance, cost, dates
  - Shipment linking
- ✅ **Maintenance Records**
  - Schedule maintenance
  - Track completion
  - Cost tracking (estimated vs actual)
  - Priority levels (Low/Medium/High/Critical)
  - Status tracking
- ✅ **Fuel Records**
  - Log fuel entries
  - Fuel efficiency (km/liter)
  - Cost tracking
  - Receipt numbers
- ✅ **Route Optimization**
  - Pre-calculated routes
  - Optimization strategies (fastest/shortest/economical/balanced)
  - Distance and duration estimates
  - Cost calculations
  - Usage tracking

#### 🚚 Manage Trucks (`/admin/manage-trucks`)
- ✅ **CRUD Operations**
  - Add trucks with display code, plate, status
  - Edit truck details
  - Delete trucks
  - Bulk operations support
- ✅ **Driver Linking**
  - Assign/unassign drivers
  - View driver details inline
  - Driver availability status

#### 📄 Contracts (`/contracts`)
- ✅ **Contract Management**
  - List all contracts
  - Filter by status (Active/Expired/All)
  - Create new contracts (Admin only)
  - Client info, dates, rates, terms
  - Contract linking to shipments
- ✅ **Contract Details**
  - Start/end dates
  - Payment terms, billing cycle
  - Rate per km, total value
  - Routes and vehicle types

#### 📤 Data Export
- ✅ **CSV Export** (`/admin/export/shipments`)
  - Export shipments by date range
  - All shipment fields included
  - Formatted for Excel/Sheets

#### 💬 Support System
- ✅ **Admin Support Chat** (`/admin/support`)
  - Instagram-style chat interface
  - Real-time messaging
  - Dark mode support
  - Notification badges
  - Message timestamps
  - Auto-scroll

### 👤 Client Features

#### 📊 Client Dashboard (`/dashboard/customer`)
- ✅ **Enhanced Booking Form**
  - Interactive route map with autocomplete
  - Source/destination selection
  - Vehicle type selection (with icons)
  - Material type, weight (MT)
  - Pickup date selector
  - Notes field
  - **Dynamic distance/time calculation** (OSRM API)
  - **Route visualization** with markers
  - Recommended vehicle by weight
  - Cost estimation
- ✅ **My Bookings Section**
  - View recent bookings
  - Status tracking
  - "View All →" link to bookings page
- ✅ **My Shipments Table**
  - Origin, destination, status, ETA, cost
  - Search and filter (All/Pending/In Transit/Delivered)
  - Real-time updates
- ✅ **Live Tracking Map**
  - Package location (limited view)
  - Truck identifier
  - Real-time position updates
- ✅ **Quick Stats**
  - Total shipments, delivered, in transit
- ✅ **FAQ Section**
  - Expandable details
  - Common questions answered
- ✅ **Help Resources**
  - User guide link
  - Contact info
  - Quick help buttons
- ✅ **Support Chat**
  - Same as admin chat
  - Connect with admin support
  - Real-time messaging
- ✅ **Issue Reporting**
  - Report issues with shipments
  - Attach details
  - Issue tracking
- ✅ **Dark Mode**
  - 20+ custom animations
  - Full CSS variables support
  - Smooth transitions
  - Persistent preference

#### 📋 Bookings Page (`/bookings`)
- ✅ **Comprehensive Booking View**
  - All past and current bookings
  - Search by ID, source, destination
  - Filter by status (All/Active/Past)
  - Dark mode support
- ✅ **Booking Cards**
  - Route display with colored status badges
  - Booking details (vehicle, weight, pickup date)
  - Created date
  - "View Details" button
- ✅ **Booking Details Modal**
  - Floating overlay window
  - Route visualization (start/end points)
  - Booking information grid
  - Shipment information (if approved)
  - Truck details and ETA
  - Notes display
  - Action buttons (Track on Map, Close)
  - Click-outside-to-close
  - Mobile-responsive
- ✅ **Real-time Updates**
  - Supabase subscriptions
  - Live status changes
  - Notification on approval/rejection

### 🎨 UI/UX Features
- ✅ **Global Theme System**
  - Light/Dark mode toggle
  - Persistent preference (localStorage)
  - CSS variables for easy theming
  - Smooth transitions
- ✅ **Responsive Design**
  - Mobile, tablet, desktop layouts
  - Adaptive navigation
  - Touch-friendly controls
  - Responsive tables and modals
- ✅ **Visual Enhancements**
  - 20+ keyframe animations
  - Gradient backgrounds
  - Glow effects in dark mode
  - Loading states
  - Empty states
  - Error handling
- ✅ **Component Library**
  - Reusable buttons, cards, panels
  - Status badges
  - Modals (Assign Truck, Trip Confirmation, Booking Details)
  - Chat components
  - Map components
  - Form components
- ✅ **Navigation**
  - Top navigation bar
  - User menu dropdown
  - Role-based menu items
  - Guest mode support
  - Theme toggle button
  - Notification badges

### 🗺️ Maps & Tracking
- ✅ **Leaflet Integration**
  - Client-side rendering (no SSR issues)
  - Custom marker icons
  - Popups with truck details
  - Auto-fit bounds
  - India-centered (20.5937, 78.9629)
- ✅ **Admin Map View**
  - Full fleet visibility
  - Truck plate, status, speed
  - Last updated timestamp
  - "More info" details section
- ✅ **Client Map View**
  - Limited to client's shipments
  - Truck identifier only
  - Real-time package location
- ✅ **Route Planning Map** (Booking Form)
  - Address autocomplete (Nominatim API)
  - Source/destination markers
  - Route visualization (OSRM API)
  - Distance and duration display
  - Debounced search
  - Mobile-friendly
- ✅ **Real-time Telemetry**
  - Subscribe to `telemetry` table
  - Live marker updates
  - Speed, status changes
  - No page refresh needed

### 💾 Database & Backend
- ✅ **Supabase Setup**
  - Tables: profiles, clients, contracts, shipments, trucks, drivers, telemetry, bookings, trips, maintenance_records, driver_performance, fuel_records, optimized_routes, user_settings, notification_preferences, system_config
  - RLS policies for all tables
  - Admin helper function: `public.is_admin(uid)`
  - Indexes for performance
- ✅ **API Routes**
  - `/api/bookings/approve` - Approve booking and create shipment
  - `/api/bookings/reject` - Reject booking with reason
  - `/api/drivers` - Create drivers (admin-only)
  - `/api/admin/export/shipments` - CSV export
- ✅ **Real-time Subscriptions**
  - Bookings changes
  - Telemetry updates
  - Notifications
- ✅ **Row-Level Security**
  - Profiles: self read/update/insert; admin read all
  - Shipments: admin read/write; client read own
  - Bookings: client insert/read own; admin read/update all
  - Trucks, Drivers, Maintenance, Fuel, Routes: admin-only
  - Telemetry: admin write; all read

### 📧 Notifications
- ✅ **Real-time Notifications**
  - Booking approval notifications
  - Booking rejection notifications
  - In-app notification display
  - Supabase Realtime integration
- ✅ **Notification Badges**
  - Chat notification counts
  - Unread message indicators
  - Real-time updates

### 🔧 Settings
- ✅ **User Settings Page** (`/settings`)
  - Profile settings (phone, company, emergency contact)
  - Appearance (theme, accent color, font size, view density)
  - Language & Region (en/hi/mr, date format, timezone)
  - Notification preferences (email, SMS, in-app)
  - Password change
  - Data export

---

## ❌ What's Not Working (Pending Implementation)

### 🚧 In Progress

#### 🔔 Advanced Notifications
- ⏳ **Email Notifications**
  - Driver trip assignment emails
  - Booking confirmation emails
  - Shipment status update emails
  - *Status:* Infrastructure ready, templates needed
- ⏳ **SMS Notifications**
  - OTP verification
  - Critical alerts
  - *Status:* Third-party integration pending

#### 📄 Document Management
- ⏳ **Supabase Storage Integration**
  - Contract document uploads
  - Invoice PDFs
  - Driver license scans
  - Truck insurance documents
  - *Status:* Schema ready, UI pending

#### 🧮 Advanced Analytics
- ⏳ **Custom Reports**
  - Date range filters with presets
  - Export to PDF/Excel
  - Scheduled report generation
  - *Status:* UI 50% complete
- ⏳ **Financial Reports**
  - Profit margins per client
  - Operating cost breakdowns
  - Fuel efficiency trends
  - *Status:* Database functions ready

#### 🗺️ Route Intelligence
- ⏳ **ETA Prediction**
  - Real routing service integration (Mapbox/Google)
  - Traffic consideration
  - Weather impact
  - *Status:* API integration pending
- ⏳ **Cost Optimization**
  - Toll calculation
  - Fuel-efficient routes
  - Multi-stop optimization
  - *Status:* Algorithm design phase

### 🔴 Not Started

#### 📦 Client Intake Flow
- ❌ **Vehicle Recommendation System**
  - Weight-based suggestions
  - Capacity validation
  - Lane availability check
  - *Priority:* Medium

#### 📊 Advanced Truck Status
- ❌ **Rich Status Model**
  - Running/Halt/Maintenance/Offline states
  - Bulk status updates
  - Status history tracking
  - *Priority:* Medium

#### 💰 Payment Integration
- ❌ **Payment Gateway**
  - Razorpay/Stripe integration
  - Invoice generation
  - Payment tracking
  - *Priority:* High (Q1 2026)

#### 📱 Mobile App
- ❌ **Driver Mobile App**
  - Trip acceptance
  - GPS tracking
  - Document scanning
  - *Priority:* High (Q2 2026)
- ❌ **Client Mobile App**
  - Booking on-the-go
  - Real-time tracking
  - Push notifications
  - *Priority:* Medium (Q3 2026)

#### 🤖 Automation
- ❌ **Auto-Assignment**
  - AI-based truck assignment
  - Load optimization
  - Driver availability matching
  - *Priority:* Low (Future)

#### 📈 Business Intelligence
- ❌ **Predictive Analytics**
  - Demand forecasting
  - Maintenance prediction
  - Cost trend analysis
  - *Priority:* Low (Future)

---

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


## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ or **Bun** runtime
- **Supabase** account (free tier works)
- **Git** for cloning

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd RTS-website
npm install  # or bun install
```

### 2. Environment Setup

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Admin Allowlist (comma-separated)
NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS=rajmohantransport.com,admin.rts.in
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,ceo@example.com

# Optional: Third-party APIs
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### 3. Supabase Database Setup

1. **Create Tables**:
   ```bash
   # Run schema.sql in Supabase SQL Editor
   cat supabase/schema.sql
   # Copy contents to SQL Editor → Run
   ```

2. **Seed Data** (optional):
   ```bash
   # Run seed.sql for sample data
   cat supabase/seed.sql
   ```

3. **Enable Realtime**:
   - Go to Database → Replication
   - Enable for: `bookings`, `telemetry`, `notifications`

### 4. Run Development Server

```bash
npm run dev
# Opens on http://localhost:3000
```

### 5. Login/Register

- **Admin**: Use email with domain from `NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS`
- **Client**: Any valid email
- **Guest**: Click "Continue as Guest" (limited access)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - App Router, Server/Client Components, TypeScript
- **React 18** - Hooks (useState, useEffect, useCallback, useRef)
- **CSS** - Modules, custom properties (CSS variables), dark mode
- **Leaflet.js** - Interactive maps
- **Chart.js** - Analytics charts (doughnut, bar, line)

### Backend
- **Supabase** - Authentication, PostgreSQL, Row-Level Security, Realtime
- **Next.js API Routes** - Server-side logic (`/api/*`)
- **PostgreSQL** - 15+ tables with RLS policies

### External Services
- **OpenStreetMap** - Base map tiles
- **Nominatim API** - Address autocomplete (geocoding)
- **OSRM API** - Route calculation, distance/time estimation

### Dev Tools
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Turbopack** - Fast dev bundler (Next.js 15)

---

## 📁 Architecture

### Project Structure

```
/RTS-website
├── app/                       # Top-level route shims (re-export from src/app)
│   ├── page.tsx              # Home redirect
│   ├── layout.tsx            # Root layout
│   ├── admin/
│   ├── bookings/
│   ├── contracts/
│   ├── dashboard/
│   └── ...
├── src/
│   ├── app/                  # Canonical Next.js app
│   │   ├── _*.client.tsx     # Global client components (effects, nav, topbar)
│   │   ├── globals.css       # Global styles + dark mode
│   │   ├── layout.tsx        # Root layout with Leaflet CSS
│   │   ├── page.tsx          # Landing/login redirect
│   │   ├── admin/            # Admin routes
│   │   │   ├── page.tsx      # Admin dashboard
│   │   │   ├── analytics/    # Analytics dashboard
│   │   │   ├── export/       # CSV export API
│   │   │   └── manage-trucks/ # Fleet management
│   │   ├── bookings/         # Client bookings page
│   │   │   ├── page.tsx
│   │   │   └── bookings.css
│   │   ├── contracts/        # Contracts list
│   │   ├── dashboard/
│   │   │   └── customer/     # Client dashboard
│   │   ├── forgot-password/  # Password reset
│   │   ├── login/            # Login page
│   │   ├── register/         # Signup page
│   │   └── settings/         # User settings
│   ├── components/           # Reusable components
│   │   ├── admin/
│   │   │   ├── AdminAnalytics.client.tsx
│   │   │   └── BookingActionRow.client.tsx
│   │   └── map/
│   │       └── LeafletMap.client.tsx
│   ├── config/
│   │   └── supabase.ts       # Supabase config
│   ├── types/
│   │   └── global.d.ts       # TypeScript types
│   ├── utils/
│   │   └── supabase/
│   │       ├── client.ts     # Client-side Supabase
│   │       └── server.ts     # Server-side Supabase
│   ├── middleware.ts         # Auth middleware
│   └── Dasboard/             # Legacy static HTML (reference only)
├── supabase/
│   ├── schema.sql            # Database schema (idempotent)
│   └── seed.sql              # Sample data
├── Documents/                # Feature documentation (66+ files)
├── .env.local.example        # Environment template
├── next.config.mjs           # Next.js config
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

### Core Routes & Workflows

#### Public Routes
- `/` - Landing page → redirects to `/login` or `/dashboard/customer` if authenticated
- `/login` - Email/password login with role selection (admin/client)
- `/register` - Signup with profile creation
- `/forgot-password` - Password reset flow

#### Admin Routes (requires `profiles.role = 'admin'`)
- `/admin` - Main dashboard with KPIs, map, bookings, shipments
- `/admin/analytics` - Charts and performance metrics
- `/admin/fleet` - Fleet management (trucks, drivers, trips, maintenance, fuel, routes)
- `/admin/manage-trucks` - Quick truck CRUD interface
- `/admin/support` - Support chat with clients
- `/admin/export/shipments` - CSV export API

#### Client Routes (requires `profiles.role = 'client'`)
- `/dashboard/customer` - Client dashboard with bookings, shipments, map, chat
- `/bookings` - All bookings with search, filter, modal details
- `/contracts` - Contracts list with filters

#### Shared Routes
- `/settings` - User settings (profile, appearance, notifications)
- `/contracts` - Contracts list (admin sees all, client sees own)

### Database Schema

#### Core Tables
- **profiles** - User profiles (id, role, client_id, phone, company, emergency_contact)
- **clients** - Client organizations (id, name, contact_person, address, gstn)
- **users** - Supabase auth.users table (managed by Supabase)

#### Logistics Tables
- **bookings** - Client booking requests (id, user_id, client_id, vehicle_type, source_city, destination_city, material, weight_mt, pickup_date, notes, status, created_at)
- **shipments** - Approved bookings converted to shipments (id, booking_id, truck_id, contract_id, origin, destination, status, eta, cost, distance_km, delivered_at)
- **contracts** - Client contracts (id, client_id, start_date, end_date, rate_per_km, total_value, payment_terms)

#### Fleet Tables
- **trucks** - Fleet vehicles (id, display_code, plate_number, vehicle_type, status, driver_id, location)
- **drivers** - Drivers (id, name, phone, email, license_number, status)
- **telemetry** - Real-time GPS data (truck_id, ts, lat, lng, speed, status)
- **trips** - Trip records (id, truck_id, shipment_id, driver_id, origin, destination, status, distance_km, start_time, end_time, cost)
- **maintenance_records** - Maintenance logs (id, truck_id, type, scheduled_date, completion_date, cost_estimated, cost_actual, priority, status)
- **fuel_records** - Fuel logs (id, truck_id, trip_id, date, liters, cost, odometer_reading, location, receipt_number, efficiency_km_per_liter)
- **driver_performance** - Performance metrics (id, driver_id, trip_id, rating, on_time_delivery, fuel_efficiency, safety_score, feedback)
- **optimized_routes** - Pre-calculated routes (id, source_city, destination_city, waypoints JSONB, distance_km, duration_hours, optimization_strategy, cost_estimate, alternative_routes JSONB)

#### System Tables
- **notifications** - In-app notifications (id, user_id, title, message, type, read, created_at)
- **user_settings** - User preferences (user_id, theme, language, notification_prefs JSONB)
- **notification_preferences** - Notification channels (user_id, email_enabled, sms_enabled, push_enabled)
- **system_config** - System-wide config (key, value JSONB)

#### RLS Policies
- **Admin Helper**: `public.is_admin(uid UUID)` returns `TRUE` if user's profile has role='admin'
- **Profiles**: Self read/update/insert; admin read all
- **Shipments**: Admin read/write; client read own (via client_id)
- **Bookings**: Client insert/read own; admin read/update all
- **Trucks, Drivers, Maintenance, Fuel, Routes**: Admin-only
- **Telemetry**: Admin write; all read (for map)
- **Contracts**: Admin read/write; client read own
- **Notifications**: Self read/write; admin can write to any user

### Real-time Subscriptions

#### Bookings
```typescript
const channel = supabase
  .channel('bookings-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookings',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Booking changed:', payload);
    loadBookings(); // Refresh data
  })
  .subscribe();
```

#### Telemetry (Live Map)
```typescript
const channel = supabase
  .channel('telemetry-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'telemetry'
  }, (payload) => {
    updateMarkerPosition(payload.new);
  })
  .subscribe();
```

#### Notifications
```typescript
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    showNotification(payload.new);
  })
  .subscribe();
```

---

## 🗺️ Feature Roadmap

### ✅ Phase 1: Core Platform (Completed - Oct 2025)
- [x] Authentication with role-based access
- [x] Admin dashboard with KPIs
- [x] Client dashboard with bookings
- [x] Bookings management (create, approve, reject)
- [x] Fleet management (trucks, drivers)
- [x] Contracts module
- [x] Basic analytics dashboard
- [x] Live fleet map with Leaflet
- [x] Dark mode throughout
- [x] Real-time updates

### 🚧 Phase 2: Enhanced Features (In Progress - Nov-Dec 2025)
- [x] Bookings page with modal details (Oct 2025)
- [x] Chat system (Instagram-style)
- [x] Fleet management expansion (trips, maintenance, fuel)
- [x] Route optimization module
- [x] Profit/loss analytics per truck
- [ ] Email notifications (templates pending)
- [ ] Document uploads with Supabase Storage
- [ ] Advanced analytics reports
- [ ] ETA prediction with routing service integration

### 📋 Phase 3: Business Intelligence (Q1 2026)
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Automated invoicing
- [ ] Custom report builder with PDF export
- [ ] Financial analytics (margins, cost breakdowns)
- [ ] Fuel efficiency trends
- [ ] Vehicle recommendation engine
- [ ] Toll calculation and route optimization
- [ ] Multi-stop route optimization

### 🚀 Phase 4: Automation & Mobile (Q2-Q3 2026)
- [ ] Driver mobile app (React Native/Flutter)
  - Trip acceptance
  - GPS tracking
  - Document scanning
  - Real-time communication
- [ ] Client mobile app
  - Booking on-the-go
  - Real-time tracking
  - Push notifications
- [ ] AI-based truck auto-assignment
- [ ] Load optimization algorithms
- [ ] Predictive maintenance alerts

### 🌟 Phase 5: Advanced Intelligence (Q4 2026+)
- [ ] Demand forecasting
- [ ] Cost trend analysis
- [ ] Driver performance AI scoring
- [ ] Route learning from historical data
- [ ] Customer portal with self-service
- [ ] Multi-language support (Hindi, Marathi expansion)
- [ ] Voice commands for drivers
- [ ] IoT sensor integration (temperature, load sensors)

---

## 📚 Documentation

### Feature Documentation (66+ files in `/Documents`)

#### Implementation Guides
- `BOOKINGS_IMPLEMENTATION.md` - Bookings page features, testing, troubleshooting
- `FLEET_SETUP_GUIDE.md` - Fleet management setup steps
- `ROUTE_BOOKING_README.md` - Route booking with map integration
- `USER_GUIDE_IMPLEMENTATION.md` - User guide page
- `BOOKING_APPROVAL_SYSTEM.md` - Admin booking approval workflow
- `TRIP-CONFIRMATION-SYSTEM.md` - Trip confirmation process

#### Feature Documentation
- `CHAT_FEATURE_DOCUMENTATION.md` - Chat system architecture
- `CONTRACT_FEATURES.md` - Contract management features
- `FLEET_MANAGEMENT_FEATURES.md` - Fleet module overview
- `VEHICLE_TYPE_FEATURE.md` - Vehicle type selection
- `EMAIL_NOTIFICATION_SYSTEM.md` - Notification infrastructure
- `DYNAMIC_DISTANCE_TIME.md` - Distance/time calculation

#### Visual Guides
- `CHAT_VISUAL_GUIDE.md` - Chat UI screenshots
- `ROUTE_MAP_VISUAL_GUIDE.md` - Map interaction guide
- `THEME_TOGGLE_VISUAL_GUIDE.md` - Dark mode usage

#### Quick References
- `CHAT_QUICK_REFERENCE.md` - Chat system quick ref
- `FLEET_QUICK_REFERENCE.md` - Fleet management quick ref
- `BOOKING_TESTING_GUIDE.md` - Booking testing checklist
- `QUICK_START_TESTING_GUIDE.md` - Overall testing guide

#### Fix Documentation
- `API_ROUTE_FIX.md` - API route troubleshooting
- `FIX_REFRESH_TOKEN_ERROR.md` - Auth token fix
- `FLEET_404_FIX.md` - Fleet page routing fix
- `FIX_CONTRACTS_RLS_POLICIES.md` - Contract RLS fix

### Schema Documentation
- `BOOKINGS_SCHEMA_GUIDE.md` - Bookings table structure, RLS policies
- `supabase/schema.sql` - Complete database schema with comments
- `supabase/seed.sql` - Sample data for testing

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **ETA Calculation**: Route distance/time currently uses OSRM for display only. No traffic or real-time routing integration yet.
2. **Document Uploads**: Schema supports document_url fields but Supabase Storage integration pending.
3. **Email Templates**: Notification infrastructure ready but email templates need design.
4. **Driver UI**: Driver management exists in admin panel but no dedicated driver mobile app yet.
5. **Payment Integration**: No payment gateway integrated; manual invoicing required.
6. **Advanced Analytics**: Basic charts working; custom report builder and PDF export pending.

### Known Bugs
- None critical at this time

### Performance Notes
- **Real-time Subscriptions**: Can impact performance with 100+ concurrent users. Consider throttling or batching updates for scale.
- **Map Markers**: With 50+ trucks, map can slow down. Consider clustering markers.
- **CSV Export**: Large exports (5000+ shipments) may timeout. Add pagination or background job.

---

## 🧪 Testing Checklist

### Authentication
- [ ] Register new client account
- [ ] Register admin (with allowlisted email)
- [ ] Login with email/password
- [ ] Password reset flow
- [ ] Guest mode browsing
- [ ] Token refresh on session expiry

### Admin Dashboard
- [ ] View KPI cards
- [ ] Filter bookings by date range
- [ ] Approve booking with truck assignment
- [ ] Reject booking with reason
- [ ] View recent shipments
- [ ] Live fleet map with markers
- [ ] Real-time booking updates

### Client Dashboard
- [ ] Create new booking with route map
- [ ] View booking status
- [ ] Track shipments on map
- [ ] Search and filter shipments
- [ ] View booking details modal
- [ ] Receive approval/rejection notifications
- [ ] Use support chat

### Bookings Page
- [ ] Load all bookings
- [ ] Search by ID/source/destination
- [ ] Filter by status (All/Active/Past)
- [ ] Open details modal
- [ ] Close modal (button + click outside)
- [ ] Dark mode styling
- [ ] Mobile responsive layout

### Fleet Management
- [ ] Add/edit/delete truck
- [ ] Assign driver to truck
- [ ] View trip history
- [ ] Log maintenance record
- [ ] Add fuel record
- [ ] View optimized routes

### Analytics
- [ ] View all charts (7 types)
- [ ] Filter by date range
- [ ] Export CSV
- [ ] Dark mode charts

### Real-time Features
- [ ] Booking status updates without refresh
- [ ] Live map marker movement
- [ ] Chat messages appear instantly
- [ ] Notification badges update

### UI/UX
- [ ] Toggle dark/light mode
- [ ] Responsive on mobile, tablet, desktop
- [ ] Animations smooth
- [ ] Loading states display
- [ ] Error handling works
- [ ] Empty states show

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with clear commit messages
3. Test locally with `npm run dev`
4. Run linter: `npm run lint`
5. Create pull request

### Code Standards
- **TypeScript**: Use strict typing; avoid `any`
- **Components**: Use `"use client"` only when needed (state, effects, browser APIs)
- **Styling**: Prefer CSS modules or scoped styles; use CSS variables for theming
- **RLS**: Always add RLS policies to new tables
- **Real-time**: Use Supabase subscriptions for live updates
- **Error Handling**: Always handle errors gracefully with user-friendly messages

### Adding New Features
1. **Database Changes**: Update `supabase/schema.sql` (idempotent)
2. **API Routes**: Add in `src/app/api/` with proper auth checks
3. **Components**: Create in `src/components/` with `.client.tsx` suffix if needed
4. **Documentation**: Update README and add file in `/Documents`
5. **Testing**: Add to testing checklist above

---

## 📞 Support & Contact

- **Issues**: Open GitHub issue with `[BUG]` or `[FEATURE]` prefix
- **Email**: support@rajmohantransport.com (if applicable)
- **Documentation**: See `/Documents` folder for detailed guides

---

## 📜 License

[Your License Here - e.g., MIT]

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing framework
- **Supabase** - Backend-as-a-Service
- **Leaflet.js** - Open-source mapping
- **OpenStreetMap** - Map data
- **Chart.js** - Beautiful charts

---

## 🔒 Security Notes

- Keep `service_role` secrets out of client code; only use `anon key` in browser
- Prefer two-step fetches for RLS-safe reads (e.g., shipments → truck_ids → trucks)
- For Server Components, import client components like Leaflet directly; avoid `next/dynamic({ ssr:false })` in RSC
- Always validate user input on server-side API routes
- Use Supabase RLS as primary security layer; never trust client-side checks alone

---

Sample Architechure diagram:
```mermaid
graph TD
    subgraph "End Users"
        direction LR
        Admin[<i class='fa fa-user-shield'></i> Admin User]
        Customer[<i class='fa fa-user'></i> Customer]
    end

    subgraph "External Systems"
        direction LR
        TruckGPS[<i class='fa fa-truck'></i> Truck GPS Device]
    end

    subgraph "Frontend Layer (Client-Side)"
        Browser[<i class='fa fa-window-maximize'></i> User's Browser]
    end

    subgraph "Web Server / Hosting"
        NextJS[<i class='fa fa-server'></i> Next.js on Vercel]
        NextJS_Server[Server Components &<br/>Server Actions]
        NextJS_Client[Client Components<br/>(e.g., Maps, Forms)]
        NextJS_Auth[Authentication Logic<br/>(Role-based routing)]
    end

    subgraph "Backend-as-a-Service (Supabase)"
        Supabase_Auth[<i class='fa fa-fingerprint'></i> Supabase Auth]
        Supabase_DB[<i class='fa fa-database'></i> PostgreSQL Database<br/>- Shipments<br/>- Contracts<br/>- Telemetry]
        Supabase_Realtime[<i class='fa fa-broadcast-tower'></i> Supabase Realtime]
        Supabase_Storage[<i class='fa fa-file-archive'></i> Supabase Storage<br/>(For Documents)]
    end

    %% User Interactions
    Admin ---|1. Accesses via HTTPS| Browser
    Customer ---|1. Accesses via HTTPS| Browser
    Browser <-->|2. Renders UI &<br/>Sends Requests| NextJS

    %% Next.js Internal Flow
    NextJS --- NextJS_Server
    NextJS --- NextJS_Client
    NextJS --- NextJS_Auth

    %% Authentication Flow
    NextJS_Auth ---|3. Authenticates User| Supabase_Auth
    Supabase_Auth -->|4. Returns User Session & Role| NextJS_Auth

    %% Data Flow for Server Components (e.g., loading dashboards)
    NextJS_Server ---|5. Fetches Data (Contracts, Shipments)| Supabase_DB
    Supabase_DB -->|6. Returns Data| NextJS_Server

    %% Real-time Map Flow
    NextJS_Client --|>| Browser
    Browser ---|7. Subscribes to Telemetry| Supabase_Realtime
    TruckGPS --|>| Supabase_DB
    Supabase_DB -- notifies --> Supabase_Realtime
    Supabase_Realtime ---|8. Pushes Live GPS Updates| Browser

    %% Link to Font Awesome for Icons
    linkStyle default text-decoration:none,fill:transparent,stroke:transparent;

    classDef default fill:#2d3436,stroke:#dfe6e9,stroke-width:2px,color:#dfe6e9;
    classDef subgraph fill:#1e272e,color:#dfe6e9;
    class Admin,Customer,TruckGPS,Browser,NextJS fill:#0984e3,color:white;
    class Supabase_Auth,Supabase_DB,Supabase_Realtime,Supabase_Storage fill:#38a169,color:white;
```

**Built with ❤️ for Rajmohan Transport Services**
