-- Settings Tables Migration
-- Creates tables for user settings, notification preferences, and system configuration

-- User Settings Table
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text,
  company_name text,
  emergency_contact text,
  theme text default 'light' check (theme in ('light', 'dark', 'auto')),
  accent_color text default '#ff4d00',
  font_size text default 'medium' check (font_size in ('small', 'medium', 'large')),
  view_density text default 'comfortable' check (view_density in ('compact', 'comfortable')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table user_settings enable row level security;

-- RLS Policies for user_settings
drop policy if exists "user_settings self read" on user_settings;
create policy "user_settings self read" on user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "user_settings self insert" on user_settings;
create policy "user_settings self insert" on user_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_settings self update" on user_settings;
create policy "user_settings self update" on user_settings
  for update using (auth.uid() = user_id);

-- Notification Preferences Table
create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email_booking_confirmation boolean default true,
  email_shipment_updates boolean default true,
  email_payment_reminders boolean default true,
  email_weekly_summary boolean default false,
  inapp_enabled boolean default true,
  inapp_sound boolean default true,
  inapp_desktop boolean default false,
  notification_frequency text default 'instant' check (notification_frequency in ('instant', 'hourly', 'daily')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table notification_preferences enable row level security;

-- RLS Policies for notification_preferences
drop policy if exists "notification_preferences self read" on notification_preferences;
create policy "notification_preferences self read" on notification_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "notification_preferences self insert" on notification_preferences;
create policy "notification_preferences self insert" on notification_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "notification_preferences self update" on notification_preferences;
create policy "notification_preferences self update" on notification_preferences
  for update using (auth.uid() = user_id);

-- System Configuration Table (Admin Only)
create table if not exists system_config (
  id uuid primary key default gen_random_uuid(),
  config_key text not null unique,
  config_value jsonb not null,
  config_type text not null check (config_type in ('pricing', 'operational', 'system')),
  description text,
  updated_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table system_config enable row level security;

-- RLS Policies for system_config (Admin only)
drop policy if exists "system_config admin read" on system_config;
create policy "system_config admin read" on system_config
  for select using (public.is_admin(auth.uid()));

drop policy if exists "system_config admin update" on system_config;
create policy "system_config admin update" on system_config
  for update using (public.is_admin(auth.uid()));

drop policy if exists "system_config admin insert" on system_config;
create policy "system_config admin insert" on system_config
  for insert with check (public.is_admin(auth.uid()));

-- Insert default system configuration values
insert into system_config (config_key, config_value, config_type, description)
values
  ('fuel_price_per_liter', '105', 'operational', 'Current diesel price per liter in INR'),
  ('gst_percentage', '18', 'pricing', 'GST rate percentage'),
  ('toll_percentage', '5', 'pricing', 'Estimated toll as percentage of base price'),
  ('loading_charges', '500', 'pricing', 'Fixed loading/unloading charges in INR'),
  ('time_buffer_percentage', '20', 'operational', 'Buffer percentage for ETA calculations'),
  ('vehicle_rates', '{
    "Truck (3T)": {
      "baseRate": 15,
      "minimumCharge": 1500,
      "fuelEfficiency": 6,
      "driverCostPerDay": 800,
      "maintenanceCostPerKm": 2
    },
    "Truck (6T)": {
      "baseRate": 20,
      "minimumCharge": 2500,
      "fuelEfficiency": 5,
      "driverCostPerDay": 1000,
      "maintenanceCostPerKm": 3
    },
    "Truck (9T)": {
      "baseRate": 25,
      "minimumCharge": 3500,
      "fuelEfficiency": 4.5,
      "driverCostPerDay": 1200,
      "maintenanceCostPerKm": 4
    },
    "Trailer (18T)": {
      "baseRate": 35,
      "minimumCharge": 5000,
      "fuelEfficiency": 3.5,
      "driverCostPerDay": 1500,
      "maintenanceCostPerKm": 6
    },
    "Trailer (25T)": {
      "baseRate": 45,
      "minimumCharge": 7000,
      "fuelEfficiency": 3,
      "driverCostPerDay": 1800,
      "maintenanceCostPerKm": 8
    }
  }', 'pricing', 'Vehicle-specific rates and operational costs')
on conflict (config_key) do nothing;

-- Create indexes for performance
create index if not exists idx_user_settings_user_id on user_settings(user_id);
create index if not exists idx_notification_preferences_user_id on notification_preferences(user_id);
create index if not exists idx_system_config_type on system_config(config_type);

-- Update timestamp trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
drop trigger if exists update_user_settings_updated_at on user_settings;
create trigger update_user_settings_updated_at
  before update on user_settings
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_notification_preferences_updated_at on notification_preferences;
create trigger update_notification_preferences_updated_at
  before update on notification_preferences
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_system_config_updated_at on system_config;
create trigger update_system_config_updated_at
  before update on system_config
  for each row
  execute function update_updated_at_column();

-- Grant access
grant usage on schema public to anon, authenticated;
grant select, insert, update on user_settings to authenticated;
grant select, insert, update on notification_preferences to authenticated;
grant select on system_config to authenticated;
