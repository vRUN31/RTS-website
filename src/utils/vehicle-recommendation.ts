/**
 * Vehicle Recommendation Utility
 * Auto-recommends vehicles based on weight, material type, and availability
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface VehicleType {
  name: string;
  capacity_mt: number; // Maximum capacity in metric tons
  minWeight_mt: number; // Minimum recommended weight for efficiency
  materialTypes: string[]; // Suitable material types
  priority: number; // Lower = higher priority for selection
}

// Vehicle types with their capacities
export const VEHICLE_TYPES: VehicleType[] = [
  {
    name: 'Pickup (1.5T)',
    capacity_mt: 1.5,
    minWeight_mt: 0.1,
    materialTypes: ['Small Parcels', 'Electronics', 'Documents', 'Light Goods', 'Perishables'],
    priority: 1,
  },
  {
    name: 'LCV (3.5T)',
    capacity_mt: 3.5,
    minWeight_mt: 1.0,
    materialTypes: ['General Cargo', 'Furniture', 'Appliances', 'FMCG', 'Perishables', 'Small Parcels'],
    priority: 2,
  },
  {
    name: 'Truck (9T)',
    capacity_mt: 9,
    minWeight_mt: 3.0,
    materialTypes: ['General Cargo', 'Industrial Goods', 'Construction Materials', 'Machinery', 'FMCG', 'Agricultural'],
    priority: 3,
  },
  {
    name: 'Truck (16T)',
    capacity_mt: 16,
    minWeight_mt: 8.0,
    materialTypes: ['Heavy Machinery', 'Construction Materials', 'Steel', 'Industrial Goods', 'Bulk Cargo', 'Agricultural'],
    priority: 4,
  },
  {
    name: 'Trailer (25T)',
    capacity_mt: 25,
    minWeight_mt: 15.0,
    materialTypes: ['Heavy Machinery', 'Bulk Cargo', 'Steel', 'Containers', 'Industrial Goods', 'Construction Materials'],
    priority: 5,
  },
];

export interface TruckAvailability {
  id: string;
  plate: string;
  vehicle_type: string | null;
  status: string;
  driver_id: string | null;
  driver_name?: string;
  last_lat?: number;
  last_lng?: number;
  location?: string;
}

export interface VehicleRecommendation {
  vehicleType: string;
  reason: string;
  score: number; // 0-100, higher is better match
  availableTrucks: TruckAvailability[];
  alternativeTypes?: string[];
}

/**
 * Recommend the best vehicle type based on weight and material
 */
export function recommendVehicleType(
  weight_mt: number,
  material?: string | null
): VehicleRecommendation {
  // Find vehicles that can handle the weight
  const suitableVehicles = VEHICLE_TYPES.filter(
    (v) => v.capacity_mt >= weight_mt
  ).sort((a, b) => a.priority - b.priority);

  if (suitableVehicles.length === 0) {
    // Weight exceeds all vehicle capacities
    return {
      vehicleType: 'Trailer (25T)',
      reason: `Weight (${weight_mt}MT) exceeds standard capacity. Consider multiple trips or specialized transport.`,
      score: 30,
      availableTrucks: [],
      alternativeTypes: [],
    };
  }

  // Score each suitable vehicle
  const scoredVehicles = suitableVehicles.map((vehicle) => {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Capacity utilization score (optimal: 60-90% utilization)
    const utilization = (weight_mt / vehicle.capacity_mt) * 100;
    if (utilization >= 60 && utilization <= 90) {
      score += 30;
      reasons.push(`Optimal capacity utilization (${utilization.toFixed(0)}%)`);
    } else if (utilization >= 40 && utilization < 60) {
      score += 20;
      reasons.push(`Good capacity utilization (${utilization.toFixed(0)}%)`);
    } else if (utilization < 40) {
      score += 5;
      reasons.push(`Low utilization (${utilization.toFixed(0)}%) - consider smaller vehicle`);
    } else {
      score += 25;
      reasons.push(`High utilization (${utilization.toFixed(0)}%)`);
    }

    // Material type match
    if (material) {
      const materialLower = material.toLowerCase();
      const isMatch = vehicle.materialTypes.some(
        (m) => m.toLowerCase().includes(materialLower) || materialLower.includes(m.toLowerCase())
      );
      if (isMatch) {
        score += 20;
        reasons.push('Material type matches vehicle specialty');
      }
    }

    // Minimum weight efficiency
    if (weight_mt >= vehicle.minWeight_mt) {
      score += 10;
      reasons.push('Weight meets minimum efficiency threshold');
    }

    return {
      vehicle,
      score,
      reasons,
    };
  });

  // Sort by score (highest first)
  scoredVehicles.sort((a, b) => b.score - a.score);
  const best = scoredVehicles[0];

  return {
    vehicleType: best.vehicle.name,
    reason: best.reasons.join('. '),
    score: Math.min(best.score, 100),
    availableTrucks: [],
    alternativeTypes: scoredVehicles.slice(1, 3).map((v) => v.vehicle.name),
  };
}

/**
 * Get available trucks of a specific type from the database
 */
export async function getAvailableTrucks(
  supabase: SupabaseClient,
  vehicleType?: string,
  excludeStatuses: string[] = ['offline', 'maintenance', 'in_transit']
): Promise<TruckAvailability[]> {
  let query = supabase
    .from('trucks')
    .select(`
      id,
      plate,
      vehicle_type,
      status,
      driver_id,
      last_lat,
      last_lng,
      location,
      drivers:driver_id (name)
    `)
    .not('status', 'in', `(${excludeStatuses.join(',')})`);

  if (vehicleType) {
    query = query.eq('vehicle_type', vehicleType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[VehicleRec] Failed to fetch trucks:', error);
    return [];
  }

  return (data || []).map((truck: any) => ({
    id: truck.id,
    plate: truck.plate,
    vehicle_type: truck.vehicle_type,
    status: truck.status,
    driver_id: truck.driver_id,
    driver_name: truck.drivers?.name,
    last_lat: truck.last_lat,
    last_lng: truck.last_lng,
    location: truck.location,
  }));
}

/**
 * Find the best available truck based on weight, material, and optionally proximity
 */
export async function findBestTruck(
  supabase: SupabaseClient,
  weight_mt: number,
  material?: string | null,
  originLat?: number,
  originLng?: number
): Promise<VehicleRecommendation> {
  // Get vehicle type recommendation
  const recommendation = recommendVehicleType(weight_mt, material);

  // Fetch available trucks of the recommended type
  let availableTrucks = await getAvailableTrucks(supabase, recommendation.vehicleType);

  // If no trucks of recommended type, try alternatives
  if (availableTrucks.length === 0 && recommendation.alternativeTypes) {
    for (const altType of recommendation.alternativeTypes) {
      availableTrucks = await getAvailableTrucks(supabase, altType);
      if (availableTrucks.length > 0) {
        recommendation.vehicleType = altType;
        recommendation.reason += ` (Using alternative: ${altType} due to availability)`;
        recommendation.score -= 10;
        break;
      }
    }
  }

  // If still no trucks, get any available truck that can handle the weight
  if (availableTrucks.length === 0) {
    const allTrucks = await getAvailableTrucks(supabase);
    availableTrucks = allTrucks.filter((truck) => {
      const vehicleType = VEHICLE_TYPES.find((v) => v.name === truck.vehicle_type);
      return vehicleType && vehicleType.capacity_mt >= weight_mt;
    });
    if (availableTrucks.length > 0) {
      recommendation.reason += ' (Using any available truck due to limited availability)';
      recommendation.score -= 20;
    }
  }

  // Sort by proximity if origin coordinates provided
  if (originLat && originLng && availableTrucks.length > 1) {
    availableTrucks.sort((a, b) => {
      const distA = calculateDistance(originLat, originLng, a.last_lat || 0, a.last_lng || 0);
      const distB = calculateDistance(originLat, originLng, b.last_lat || 0, b.last_lng || 0);
      return distA - distB;
    });
  }

  recommendation.availableTrucks = availableTrucks;
  return recommendation;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a truck is available for a specific date range
 */
export async function checkTruckAvailability(
  supabase: SupabaseClient,
  truckId: string,
  pickupDate: Date,
  estimatedDeliveryDate: Date
): Promise<{ available: boolean; conflictingBookings: any[] }> {
  const { data: conflictingBookings, error } = await supabase
    .from('shipments')
    .select('id, origin, destination, eta, status')
    .eq('truck_id', truckId)
    .in('status', ['pending', 'in_transit'])
    .or(`eta.gte.${pickupDate.toISOString()},created_at.lte.${estimatedDeliveryDate.toISOString()}`);

  if (error) {
    console.error('[VehicleRec] Error checking availability:', error);
    return { available: false, conflictingBookings: [] };
  }

  return {
    available: !conflictingBookings || conflictingBookings.length === 0,
    conflictingBookings: conflictingBookings || [],
  };
}

/**
 * Get capacity utilization for a vehicle type
 */
export function getCapacityUtilization(vehicleType: string, weight_mt: number): number {
  const vehicle = VEHICLE_TYPES.find((v) => v.name === vehicleType);
  if (!vehicle) return 0;
  return Math.round((weight_mt / vehicle.capacity_mt) * 100);
}

/**
 * Validate if weight is within vehicle capacity
 */
export function validateWeight(vehicleType: string, weight_mt: number): { valid: boolean; message: string } {
  const vehicle = VEHICLE_TYPES.find((v) => v.name === vehicleType);
  
  if (!vehicle) {
    return { valid: false, message: `Unknown vehicle type: ${vehicleType}` };
  }

  if (weight_mt > vehicle.capacity_mt) {
    return {
      valid: false,
      message: `Weight (${weight_mt}MT) exceeds ${vehicleType} capacity (${vehicle.capacity_mt}MT)`,
    };
  }

  if (weight_mt < vehicle.minWeight_mt * 0.5) {
    return {
      valid: true,
      message: `Consider a smaller vehicle. ${vehicleType} is underutilized for ${weight_mt}MT`,
    };
  }

  return { valid: true, message: 'Weight is within capacity' };
}
