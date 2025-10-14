-- Migration: Add settings and preferences tables
-- Creates user_settings, notification_preferences, and system_config tables

BEGIN;

-- User settings table (profile, appearance, language)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile settings
  phone text,
  profile_picture_url text,
  company_name text,
  emergency_contact text,
  
  -- Appearance settings
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  accent_color text DEFAULT '#ff4d00',
  font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  view_density text DEFAULT 'comfortable' CHECK (view_density IN ('compact', 'comfortable')),
  
  -- Language & Region
  language text DEFAULT 'en' CHECK (language IN ('en', 'hi', 'mr')),
  date_format text DEFAULT 'DD/MM/YYYY',
  time_zone text DEFAULT 'Asia/Kolkata',
  distance_unit text DEFAULT 'km' CHECK (distance_unit IN ('km', 'miles')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email notifications
  email_booking_confirmation boolean DEFAULT true,
  email_shipment_updates boolean DEFAULT true,
  email_payment_reminders boolean DEFAULT true,
  email_weekly_summary boolean DEFAULT false,
  
  -- In-app notifications
  inapp_enabled boolean DEFAULT true,
  inapp_sound boolean DEFAULT true,
  inapp_desktop boolean DEFAULT false,
  
  -- Notification frequency
  notification_frequency text DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'hourly', 'daily')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- System configuration table (admin only)
CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  config_type text NOT NULL CHECK (config_type IN ('pricing', 'operational', 'email', 'integration')),
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insert default system configurations
INSERT INTO public.system_config (config_key, config_value, config_type, description)
VALUES
  ('fuel_price_per_liter', '105'::jsonb, 'operational', 'Current diesel price per liter in INR'),
  ('gst_percentage', '18'::jsonb, 'pricing', 'GST tax percentage'),
  ('toll_percentage', '5'::jsonb, 'pricing', 'Toll charges as percentage of base price'),
  ('loading_charges', '500'::jsonb, 'pricing', 'Fixed loading/unloading charges in INR'),
  ('time_buffer_percentage', '20'::jsonb, 'operational', 'Buffer percentage for time calculations'),
  ('vehicle_rates', '{
    "Pickup (1.5T)": {"baseRate": 12, "minimumCharge": 800, "maintenanceCostPerKm": 2, "driverCostPerDay": 1500, "fuelEfficiency": 12},
    "LCV (3.5T)": {"baseRate": 18, "minimumCharge": 1200, "maintenanceCostPerKm": 3, "driverCostPerDay": 1800, "fuelEfficiency": 10},
    "Truck (9T)": {"baseRate": 25, "minimumCharge": 2000, "maintenanceCostPerKm": 5, "driverCostPerDay": 2000, "fuelEfficiency": 6},
    "Truck (16T)": {"baseRate": 35, "minimumCharge": 3000, "maintenanceCostPerKm": 7, "driverCostPerDay": 2500, "fuelEfficiency": 4},
    "Trailer (25T)": {"baseRate": 45, "minimumCharge": 4500, "maintenanceCostPerKm": 10, "driverCostPerDay": 3000, "fuelEfficiency": 3}
  }'::jsonb, 'pricing', 'Vehicle pricing and operational data')
ON CONFLICT (config_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert their own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for system_config (admin only)
DROP POLICY IF EXISTS "Admins can view system config" ON public.system_config;
CREATE POLICY "Admins can view system config" ON public.system_config
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update system config" ON public.system_config;
CREATE POLICY "Admins can update system config" ON public.system_config
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert system config" ON public.system_config;
CREATE POLICY "Admins can insert system config" ON public.system_config
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_type ON public.system_config(config_type);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_config_updated_at ON public.system_config;
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
