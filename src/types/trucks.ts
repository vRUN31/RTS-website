export type TripRecord = {
  id: string;
  truck_id: string;
  start_location: string;
  end_location: string;
  start_time: string;
  end_time?: string;
  distance_km: number;
  fuel_consumed_liters: number;
  driver_id: string;
  status: 'ongoing' | 'completed';
  avg_speed_kmh?: number;
};

export type MaintenanceRecord = {
  id: string;
  truck_id: string;
  service_type: 'routine' | 'repair' | 'emergency';
  description: string;
  cost: number;
  service_date: string;
  next_service_date?: string;
  odometer_reading: number;
  performed_by: string;
  notes?: string;
};

export type DriverPerformance = {
  id: string;
  driver_id: string;
  trip_id: string;
  safety_score: number;
  fuel_efficiency: number;
  on_time_arrival: boolean;
  customer_rating?: number;
  notes?: string;
  date: string;
};

export type FuelRecord = {
  id: string;
  truck_id: string;
  fill_date: string;
  liters: number;
  cost_per_liter: number;
  total_cost: number;
  odometer_reading: number;
  station_location?: string;
  filled_by: string;
};

export type Route = {
  id: string;
  trip_id: string;
  waypoints: {
    lat: number;
    lng: number;
    timestamp: string;
    type: 'start' | 'stop' | 'waypoint' | 'end';
  }[];
  total_distance_km: number;
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  traffic_conditions?: 'light' | 'moderate' | 'heavy';
};