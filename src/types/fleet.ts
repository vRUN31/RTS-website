// ========================================
// FLEET MANAGEMENT TYPES
// ========================================

export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type Trip = {
  id: string;
  truck_id: string | null;
  driver_id: string | null;
  shipment_id: string | null;
  
  // Trip Details
  origin: string;
  destination: string;
  start_time: string;
  end_time: string | null;
  
  // Distance & Duration
  planned_distance_km: number | null;
  actual_distance_km: number | null;
  planned_duration_hours: number | null;
  actual_duration_hours: number | null;
  
  // Status
  status: TripStatus;
  
  // Route
  route_json: any | null;
  
  // Fuel & Cost
  fuel_consumed_liters: number | null;
  fuel_cost: number | null;
  toll_cost: number | null;
  total_cost: number | null;
  
  // Performance Metrics
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  idle_time_minutes: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations (optional, populated via joins)
  truck?: {
    id: string;
    display_code: string;
    plate: string;
  };
  driver?: {
    id: string;
    name: string | null;
    phone: string | null;
  };
};

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'normal' | 'high' | 'critical';
export type MaintenanceType = 
  | 'oil_change' 
  | 'tire_rotation' 
  | 'brake_service' 
  | 'engine_repair'
  | 'transmission_service'
  | 'battery_replacement'
  | 'inspection'
  | 'other';

export type MaintenanceRecord = {
  id: string;
  truck_id: string | null;
  
  // Maintenance Details
  maintenance_type: string;
  description: string | null;
  
  // Scheduling
  scheduled_date: string;
  completed_date: string | null;
  next_service_date: string | null;
  
  // Odometer
  odometer_reading: number | null;
  
  // Status
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  
  // Cost
  estimated_cost: number | null;
  actual_cost: number | null;
  
  // Service Provider
  service_provider: string | null;
  mechanic_name: string | null;
  
  // Parts & Labor
  parts_used: any | null;
  labor_hours: number | null;
  
  // Notes
  notes: string | null;
  attachments: any | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  truck?: {
    id: string;
    display_code: string;
    plate: string;
  };
};

export type DriverPerformance = {
  id: string;
  driver_id: string | null;
  
  // Time Period
  period_start: string;
  period_end: string;
  
  // Trip Statistics
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  
  // Distance & Time
  total_distance_km: number;
  total_driving_hours: number;
  total_idle_hours: number;
  
  // Performance Metrics
  avg_speed_kmh: number | null;
  on_time_deliveries: number;
  late_deliveries: number;
  on_time_percentage: number | null;
  
  // Safety Metrics
  incidents: number;
  accidents: number;
  speeding_violations: number;
  harsh_braking_count: number;
  harsh_acceleration_count: number;
  
  // Fuel Efficiency
  total_fuel_consumed_liters: number;
  avg_fuel_efficiency_kmpl: number | null;
  
  // Ratings
  customer_rating: number | null;
  safety_score: number | null;
  efficiency_score: number | null;
  overall_score: number | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  driver?: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
};

export type FuelType = 'diesel' | 'petrol' | 'cng' | 'electric';
export type PaymentMethod = 'cash' | 'card' | 'fuel_card';

export type FuelRecord = {
  id: string;
  truck_id: string | null;
  driver_id: string | null;
  trip_id: string | null;
  
  // Fuel Details
  fuel_type: FuelType;
  quantity_liters: number;
  price_per_liter: number;
  total_cost: number;
  
  // Location
  station_name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Odometer
  odometer_reading: number | null;
  
  // Payment
  payment_method: PaymentMethod | null;
  receipt_number: string | null;
  
  // Fuel Efficiency
  distance_since_last_fill: number | null;
  fuel_efficiency_kmpl: number | null;
  
  // Timestamp
  filled_at: string;
  created_at: string;
  
  // Relations
  truck?: {
    id: string;
    display_code: string;
    plate: string;
  };
  driver?: {
    id: string;
    name: string | null;
  };
};

export type OptimizationCriteria = 'fastest' | 'shortest' | 'economical' | 'balanced';

export type OptimizedRoute = {
  id: string;
  
  // Route Details
  route_name: string | null;
  origin: string;
  destination: string;
  waypoints: any | null;
  
  // Route Coordinates
  route_coordinates: any;
  
  // Distance & Duration
  total_distance_km: number;
  estimated_duration_hours: number;
  
  // Cost Estimates
  estimated_fuel_cost: number | null;
  estimated_toll_cost: number | null;
  estimated_total_cost: number | null;
  
  // Optimization Metrics
  optimization_criteria: OptimizationCriteria;
  traffic_considered: boolean;
  toll_roads_allowed: boolean;
  
  // Alternative Routes
  alternative_routes: any | null;
  
  // Usage
  times_used: number;
  avg_actual_duration_hours: number | null;
  avg_actual_cost: number | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
};

// ========================================
// AGGREGATE TYPES FOR STATISTICS
// ========================================

export type FleetStatistics = {
  total_trips: number;
  active_trips: number;
  completed_trips: number;
  total_distance_km: number;
  avg_fuel_efficiency: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  trucks_in_maintenance: number;
  overdue_maintenance: number;
};

export type DriverStatsSummary = {
  driver_id: string;
  driver_name: string;
  total_trips: number;
  total_distance_km: number;
  avg_rating: number;
  safety_score: number;
  on_time_percentage: number;
};

export type MaintenanceSummary = {
  scheduled: number;
  in_progress: number;
  completed: number;
  overdue: number;
  total_cost_this_month: number;
  avg_cost_per_service: number;
};

export type FuelAnalytics = {
  total_fuel_consumed: number;
  total_fuel_cost: number;
  avg_fuel_efficiency: number;
  cost_per_km: number;
  trend_vs_last_month: number; // percentage
};
