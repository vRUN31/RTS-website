-- Supabase schema for RTS-website MVP
-- Run in Supabase SQL editor. Enable RLS on all tables and adjust policies as needed.

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin','client')),
  name text,
  email text,
  client_id uuid,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert with check (auth.uid() = id);

-- Helper: boolean check without referencing profiles policies recursively
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.profiles p
    where p.id = $1 and p.role = 'admin'
  );
$fn$;
grant execute on function public.is_admin(uuid) to anon, authenticated;

-- Allow admins to read all profiles (needed for admin dashboards) without recursion
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles admin read'
  ) then
    create policy "profiles admin read" on public.profiles
      for select using (public.is_admin(auth.uid()));
  end if;
end $$;

-- Backward-compatible migration helpers
alter table if exists profiles
  add column if not exists email text;
create index if not exists idx_profiles_email on profiles(email);

-- clients (admin-managed)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contacts jsonb,
  gst text,
  billing_terms text,
  created_at timestamptz default now()
);

alter table clients enable row level security;

-- admins can do everything (idempotent)
drop policy if exists "clients admin all" on public.clients;
create policy "clients admin all" on public.clients for all using (
  public.is_admin(auth.uid())
) with check (public.is_admin(auth.uid()));

-- contracts
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  start_at date not null,
  end_at date not null,
  lanes jsonb,
  base_rates jsonb,
  documents jsonb,
  created_at timestamptz default now()
);

alter table contracts enable row level security;

drop policy if exists "contracts admin read" on public.contracts;
create policy "contracts admin read" on public.contracts for select using (
  public.is_admin(auth.uid())
);
drop policy if exists "contracts client read" on public.contracts;
create policy "contracts client read" on public.contracts for select using (
  exists (
    select 1 from profiles p
    join clients c on p.client_id = c.id
    where p.id = auth.uid() and contracts.client_id = c.id and p.role = 'client'
  )
);

-- shipments
create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  contract_id uuid references contracts(id),
  truck_id uuid,
  origin text,
  destination text,
  distance_km numeric,
  weight_mt numeric,
  status text,
  eta timestamptz,
  delivered_at timestamptz,
  cost numeric,
  created_at timestamptz default now()
);

alter table shipments enable row level security;

drop policy if exists "shipments admin read" on public.shipments;
create policy "shipments admin read" on public.shipments for select using (
  public.is_admin(auth.uid())
);
drop policy if exists "shipments client read" on public.shipments;
create policy "shipments client read" on public.shipments for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'client' and p.client_id = shipments.client_id
  )
);

-- Allow admins to create shipments during booking approvals
drop policy if exists "shipments admin insert" on public.shipments;
create policy "shipments admin insert" on public.shipments for insert with check (
  public.is_admin(auth.uid())
);

-- trucks
create table if not exists trucks (
  id uuid primary key default gen_random_uuid(),
  plate text,
  device_id text,
  status text,
  location text,
  last_lat double precision,
  last_lng double precision,
  speed numeric,
  last_updated timestamptz,
  created_at timestamptz default now()
);

alter table trucks enable row level security;
drop policy if exists "trucks admin read" on public.trucks;
create policy "trucks admin read" on public.trucks for select using (
  public.is_admin(auth.uid())
);
drop policy if exists "trucks admin insert" on public.trucks;
create policy "trucks admin insert" on public.trucks for insert with check (
  public.is_admin(auth.uid())
);
drop policy if exists "trucks admin update" on public.trucks;
create policy "trucks admin update" on public.trucks for update using (
  public.is_admin(auth.uid())
) with check (public.is_admin(auth.uid()));
drop policy if exists "trucks admin delete" on public.trucks;
create policy "trucks admin delete" on public.trucks for delete using (
  public.is_admin(auth.uid())
);

-- drivers (store driver details, linked optionally from trucks)
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  license_no text,
  license_expiry date,
  experience_years int,
  address text,
  emergency_contact text,
  created_at timestamptz default now()
);

alter table drivers enable row level security;
drop policy if exists "drivers admin read" on public.drivers;
create policy "drivers admin read" on public.drivers for select using (
  public.is_admin(auth.uid())
);

-- Backfill association from trucks to drivers
alter table if exists public.trucks
  add column if not exists driver_id uuid references public.drivers(id);

-- telemetry
create table if not exists telemetry (
  id bigint generated by default as identity primary key,
  truck_id uuid references trucks(id) on delete cascade,
  ts timestamptz not null,
  lat double precision,
  lng double precision,
  speed numeric,
  status text
);

alter table telemetry enable row level security;
drop policy if exists "telemetry admin read" on public.telemetry;
create policy "telemetry admin read" on public.telemetry for select using (
  public.is_admin(auth.uid())
);

-- Backward-compatible: ensure columns exist before indexing (for legacy DBs)
alter table if exists public.shipments
  add column if not exists eta timestamptz;
alter table if exists public.shipments
  add column if not exists delivered_at timestamptz;
-- Ensure trucks.location exists for legacy DBs
alter table if exists public.trucks
  add column if not exists location text;

-- Helpful indexes for analytics
create index if not exists idx_shipments_created_at on public.shipments(created_at);
create index if not exists idx_shipments_eta_delivered on public.shipments(eta, delivered_at);
create index if not exists idx_telemetry_truck_ts on public.telemetry(truck_id, ts);

-- dispatch_offers
create table if not exists dispatch_offers (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references shipments(id) on delete cascade,
  driver_id uuid not null,
  rank int not null,
  status text not null check (status in ('pending','accepted','rejected','expired')),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table dispatch_offers enable row level security;

-- notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text check (type in ('dispatch','system','reminder')),
  channel text check (channel in ('inapp','sms','email','whatsapp')),
  payload jsonb,
  status text check (status in ('queued','sent','failed','read')),
  created_at timestamptz default now(),
  read_at timestamptz
);

alter table notifications enable row level security;

-- helper view or policy for notifications (self read)
drop policy if exists "notifications self read" on public.notifications;
create policy "notifications self read" on public.notifications for select using (
  user_id = auth.uid()
);

-- bookings (client intake)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  vehicle_type text,
  source_city text not null,
  destination_city text not null,
  material text,
  weight_mt numeric,
  pickup_date date,
  notes text,
  status text not null default 'submitted' check (status in ('draft','submitted','approved','rejected','in_transit','delivered')),
  created_at timestamptz default now()
);

alter table bookings enable row level security;

drop policy if exists "bookings admin read" on public.bookings;
create policy "bookings admin read" on public.bookings for select using (
  public.is_admin(auth.uid())
);
drop policy if exists "bookings admin update" on public.bookings;
create policy "bookings admin update" on public.bookings for update using (
  public.is_admin(auth.uid())
) with check (public.is_admin(auth.uid()));
drop policy if exists "bookings client read" on public.bookings;
create policy "bookings client read" on public.bookings for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role = 'client'
      and (
        (p.client_id is not null and bookings.client_id = p.client_id)
        or (bookings.user_id = auth.uid())
      )
  )
);
drop policy if exists "bookings client insert" on public.bookings;
create policy "bookings client insert" on public.bookings for insert with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role = 'client'
      and (
        (p.client_id is not null and bookings.client_id = p.client_id)
        or (bookings.user_id = auth.uid())
      )
  )
);

create index if not exists idx_bookings_client_created on bookings(client_id, created_at);

-- Ensure vehicle_type exists for legacy databases
alter table if exists bookings
  add column if not exists vehicle_type text;
