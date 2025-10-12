-- ========================================
-- FLEET MANAGEMENT FEATURES MIGRATION
-- Date: 2025-10-12
-- Features: Trip History, Maintenance, Driver Performance, Fuel, Route Optimization
-- ========================================

-- 1. TRIP HISTORY TABLE
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    
    -- Trip Details
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    
    -- Distance & Duration
    planned_distance_km NUMERIC(10, 2),
    actual_distance_km NUMERIC(10, 2),
    planned_duration_hours NUMERIC(10, 2),
    actual_duration_hours NUMERIC(10, 2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    
    -- Route
    route_json JSONB, -- Stores route coordinates and waypoints
    
    -- Fuel & Cost
    fuel_consumed_liters NUMERIC(10, 2),
    fuel_cost NUMERIC(10, 2),
    toll_cost NUMERIC(10, 2),
    total_cost NUMERIC(10, 2),
    
    -- Performance Metrics
    avg_speed_kmh NUMERIC(10, 2),
    max_speed_kmh NUMERIC(10, 2),
    idle_time_minutes INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MAINTENANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
    
    -- Maintenance Details
    maintenance_type VARCHAR(100) NOT NULL, -- oil_change, tire_rotation, brake_service, engine_repair, etc.
    description TEXT,
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    next_service_date DATE,
    
    -- Odometer
    odometer_reading INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, critical
    
    -- Cost
    estimated_cost NUMERIC(10, 2),
    actual_cost NUMERIC(10, 2),
    
    -- Service Provider
    service_provider VARCHAR(255),
    mechanic_name VARCHAR(255),
    
    -- Parts & Labor
    parts_used JSONB, -- Array of parts with costs
    labor_hours NUMERIC(10, 2),
    
    -- Notes
    notes TEXT,
    attachments JSONB, -- Array of file URLs
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DRIVER PERFORMANCE TABLE
CREATE TABLE IF NOT EXISTS driver_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Trip Statistics
    total_trips INTEGER DEFAULT 0,
    completed_trips INTEGER DEFAULT 0,
    cancelled_trips INTEGER DEFAULT 0,
    
    -- Distance & Time
    total_distance_km NUMERIC(10, 2) DEFAULT 0,
    total_driving_hours NUMERIC(10, 2) DEFAULT 0,
    total_idle_hours NUMERIC(10, 2) DEFAULT 0,
    
    -- Performance Metrics
    avg_speed_kmh NUMERIC(10, 2),
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    on_time_percentage NUMERIC(5, 2),
    
    -- Safety Metrics
    incidents INTEGER DEFAULT 0,
    accidents INTEGER DEFAULT 0,
    speeding_violations INTEGER DEFAULT 0,
    harsh_braking_count INTEGER DEFAULT 0,
    harsh_acceleration_count INTEGER DEFAULT 0,
    
    -- Fuel Efficiency
    total_fuel_consumed_liters NUMERIC(10, 2) DEFAULT 0,
    avg_fuel_efficiency_kmpl NUMERIC(10, 2),
    
    -- Ratings
    customer_rating NUMERIC(3, 2), -- 0.00 to 5.00
    safety_score INTEGER, -- 0 to 100
    efficiency_score INTEGER, -- 0 to 100
    overall_score INTEGER, -- 0 to 100
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate periods
    UNIQUE(driver_id, period_start, period_end)
);

-- 4. FUEL TRACKING TABLE
CREATE TABLE IF NOT EXISTS fuel_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    
    -- Fuel Details
    fuel_type VARCHAR(50) NOT NULL, -- diesel, petrol, cng, electric
    quantity_liters NUMERIC(10, 2) NOT NULL,
    price_per_liter NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    
    -- Location
    station_name VARCHAR(255),
    location VARCHAR(255),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    
    -- Odometer
    odometer_reading INTEGER,
    
    -- Payment
    payment_method VARCHAR(50), -- cash, card, fuel_card
    receipt_number VARCHAR(100),
    
    -- Fuel Efficiency
    distance_since_last_fill NUMERIC(10, 2),
    fuel_efficiency_kmpl NUMERIC(10, 2),
    
    -- Timestamp
    filled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ROUTE OPTIMIZATION TABLE
CREATE TABLE IF NOT EXISTS optimized_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Route Details
    route_name VARCHAR(255),
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    waypoints JSONB, -- Array of intermediate stops
    
    -- Route Coordinates
    route_coordinates JSONB NOT NULL, -- Array of [lat, lng] pairs
    
    -- Distance & Duration
    total_distance_km NUMERIC(10, 2) NOT NULL,
    estimated_duration_hours NUMERIC(10, 2) NOT NULL,
    
    -- Cost Estimates
    estimated_fuel_cost NUMERIC(10, 2),
    estimated_toll_cost NUMERIC(10, 2),
    estimated_total_cost NUMERIC(10, 2),
    
    -- Optimization Metrics
    optimization_criteria VARCHAR(50) DEFAULT 'fastest', -- fastest, shortest, economical, balanced
    traffic_considered BOOLEAN DEFAULT true,
    toll_roads_allowed BOOLEAN DEFAULT true,
    
    -- Alternative Routes
    alternative_routes JSONB, -- Array of alternative route objects
    
    -- Usage
    times_used INTEGER DEFAULT 0,
    avg_actual_duration_hours NUMERIC(10, 2),
    avg_actual_cost NUMERIC(10, 2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_truck_id ON trips(truck_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time);
CREATE INDEX IF NOT EXISTS idx_trips_shipment_id ON trips(shipment_id);

-- Maintenance indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_truck_id ON maintenance_records(truck_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_records(priority);

-- Driver performance indexes
CREATE INDEX IF NOT EXISTS idx_driver_performance_driver_id ON driver_performance(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_performance_period ON driver_performance(period_start, period_end);

-- Fuel records indexes
CREATE INDEX IF NOT EXISTS idx_fuel_truck_id ON fuel_records(truck_id);
CREATE INDEX IF NOT EXISTS idx_fuel_driver_id ON fuel_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_filled_at ON fuel_records(filled_at);

-- Optimized routes indexes
CREATE INDEX IF NOT EXISTS idx_routes_origin_destination ON optimized_routes(origin, destination);
CREATE INDEX IF NOT EXISTS idx_routes_times_used ON optimized_routes(times_used DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_routes ENABLE ROW LEVEL SECURITY;

-- Trips Policies
CREATE POLICY "Admin can view all trips" ON trips FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin can insert trips" ON trips FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin can update trips" ON trips FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Maintenance Policies
CREATE POLICY "Admin can view all maintenance" ON maintenance_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin can insert maintenance" ON maintenance_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin can update maintenance" ON maintenance_records FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Driver Performance Policies
CREATE POLICY "Admin can view all driver performance" ON driver_performance FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin can manage driver performance" ON driver_performance FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Fuel Records Policies
CREATE POLICY "Admin can view all fuel records" ON fuel_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin can insert fuel records" ON fuel_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Routes Policies
CREATE POLICY "Admin can view all routes" ON optimized_routes FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admin can manage routes" ON optimized_routes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_performance_updated_at BEFORE UPDATE ON driver_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON optimized_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================

-- Note: Sample data insertion would go here if needed
-- This is commented out for production deployment

COMMENT ON TABLE trips IS 'Stores trip history for each truck including route, fuel, and performance data';
COMMENT ON TABLE maintenance_records IS 'Tracks maintenance schedules, records, and costs for fleet vehicles';
COMMENT ON TABLE driver_performance IS 'Aggregated performance metrics for drivers over time periods';
COMMENT ON TABLE fuel_records IS 'Individual fuel fill records with efficiency tracking';
COMMENT ON TABLE optimized_routes IS 'Pre-calculated optimal routes between common origin-destination pairs';
