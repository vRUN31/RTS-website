/**
 * Booking Automation Service
 * Orchestrates all automated booking processes
 */

import { calculateRouteBetweenCities, estimateTolls, formatDuration } from './routing';
import { recommendVehicleType, findBestTruck, checkTruckAvailability, getCapacityUtilization, VEHICLE_TYPES } from './vehicle-recommendation';
import { calculatePrice, type PriceBreakdown } from './pricing';
import { analyzeTripDetails, type TripAnalysis } from './operations';
import { SupabaseClient } from '@supabase/supabase-js';

export interface BookingAutomationInput {
  sourceCity: string;
  destinationCity: string;
  weight_mt: number;
  material?: string | null;
  pickupDate?: Date;
  vehicleType?: string | null;
}

export interface AutoCalculationResult {
  route: {
    distance_km: number;
    duration_seconds: number;
    duration_formatted: string;
    eta: Date;
  } | null;
  vehicle: {
    recommendedType: string;
    reason: string;
    score: number;
    capacityUtilization: number;
    alternativeTypes: string[];
  };
  pricing: PriceBreakdown | null;
  operations: {
    tollEstimate: number;
    fuelCost: number;
    estimatedProfit: number;
    driverCost: number;
  } | null;
  availableTrucks: Array<{
    id: string;
    plate: string;
    driverName?: string;
    status: string;
  }>;
  canAutoApprove: boolean;
  autoApproveReasons: string[];
}

/**
 * Perform full booking automation calculation
 * This is the main entry point for the automation service
 */
export async function calculateBookingAutomation(
  input: BookingAutomationInput,
  supabase?: SupabaseClient
): Promise<AutoCalculationResult> {
  const result: AutoCalculationResult = {
    route: null,
    vehicle: {
      recommendedType: '',
      reason: '',
      score: 0,
      capacityUtilization: 0,
      alternativeTypes: [],
    },
    pricing: null,
    operations: null,
    availableTrucks: [],
    canAutoApprove: false,
    autoApproveReasons: [],
  };

  // Step 1: Calculate route
  if (input.sourceCity && input.destinationCity) {
    const route = await calculateRouteBetweenCities(
      input.sourceCity,
      input.destinationCity,
      input.pickupDate
    );

    if (route) {
      result.route = {
        distance_km: route.distance_km,
        duration_seconds: route.duration_seconds,
        duration_formatted: route.duration_formatted,
        eta: route.eta,
      };
    }
  }

  // Step 2: Get vehicle recommendation
  const vehicleRec = recommendVehicleType(input.weight_mt, input.material);
  const selectedVehicle = input.vehicleType || vehicleRec.vehicleType;
  
  result.vehicle = {
    recommendedType: vehicleRec.vehicleType,
    reason: vehicleRec.reason,
    score: vehicleRec.score,
    capacityUtilization: getCapacityUtilization(selectedVehicle, input.weight_mt),
    alternativeTypes: vehicleRec.alternativeTypes || [],
  };

  // Step 3: Calculate pricing
  if (result.route) {
    const pricing = calculatePrice(
      result.route.distance_km,
      selectedVehicle
    );
    result.pricing = pricing;

    // Step 4: Calculate operational costs
    const tollEstimate = estimateTolls(result.route.distance_km, selectedVehicle);
    
    // Get operational data from operations.ts
    try {
      const tripAnalysis = analyzeTripDetails(
        result.route.distance_km,
        selectedVehicle,
        input.pickupDate || new Date()
      );
      
      result.operations = {
        tollEstimate,
        fuelCost: tripAnalysis?.costs?.fuelCost || 0,
        estimatedProfit: tripAnalysis?.profit?.grossProfit || 0,
        driverCost: tripAnalysis?.costs?.driverCost || 0,
      };
    } catch {
      result.operations = {
        tollEstimate,
        fuelCost: 0,
        estimatedProfit: 0,
        driverCost: 0,
      };
    }
  }

  // Step 5: Find available trucks (if Supabase client provided)
  if (supabase) {
    const truckRec = await findBestTruck(
      supabase,
      input.weight_mt,
      input.material
    );
    
    result.availableTrucks = truckRec.availableTrucks.slice(0, 5).map((t) => ({
      id: t.id,
      plate: t.plate,
      driverName: t.driver_name,
      status: t.status,
    }));

    // Update score based on availability
    if (truckRec.availableTrucks.length > 0) {
      result.vehicle.score = Math.max(result.vehicle.score, truckRec.score);
    }
  }

  // Step 6: Determine if auto-approve is possible
  const reasons: string[] = [];
  
  if (result.route) {
    reasons.push('✓ Route calculated successfully');
  } else {
    reasons.push('✗ Could not calculate route');
  }
  
  if (result.vehicle.score >= 70) {
    reasons.push(`✓ High confidence vehicle match (${result.vehicle.score}%)`);
  } else if (result.vehicle.score >= 50) {
    reasons.push(`~ Medium confidence vehicle match (${result.vehicle.score}%)`);
  } else {
    reasons.push(`✗ Low confidence vehicle match (${result.vehicle.score}%)`);
  }
  
  if (result.availableTrucks.length > 0) {
    reasons.push(`✓ ${result.availableTrucks.length} truck(s) available`);
  } else {
    reasons.push('✗ No trucks currently available');
  }
  
  if (result.vehicle.capacityUtilization >= 40 && result.vehicle.capacityUtilization <= 95) {
    reasons.push(`✓ Good capacity utilization (${result.vehicle.capacityUtilization}%)`);
  } else if (result.vehicle.capacityUtilization < 40) {
    reasons.push(`~ Low capacity utilization (${result.vehicle.capacityUtilization}%)`);
  } else {
    reasons.push(`✗ Near/over capacity (${result.vehicle.capacityUtilization}%)`);
  }

  result.autoApproveReasons = reasons;
  result.canAutoApprove = 
    result.route !== null &&
    result.vehicle.score >= 70 &&
    result.availableTrucks.length > 0 &&
    result.vehicle.capacityUtilization <= 95;

  return result;
}

/**
 * Client-side auto-calculation (without Supabase, for form previews)
 */
export async function calculateBookingPreview(
  input: BookingAutomationInput
): Promise<Partial<AutoCalculationResult>> {
  const result: Partial<AutoCalculationResult> = {
    route: null,
    vehicle: {
      recommendedType: '',
      reason: '',
      score: 0,
      capacityUtilization: 0,
      alternativeTypes: [],
    },
    pricing: null,
  };

  // Calculate route
  if (input.sourceCity && input.destinationCity) {
    const route = await calculateRouteBetweenCities(
      input.sourceCity,
      input.destinationCity,
      input.pickupDate
    );

    if (route) {
      result.route = {
        distance_km: route.distance_km,
        duration_seconds: route.duration_seconds,
        duration_formatted: route.duration_formatted,
        eta: route.eta,
      };
    }
  }

  // Get vehicle recommendation
  const vehicleRec = recommendVehicleType(input.weight_mt, input.material);
  const selectedVehicle = input.vehicleType || vehicleRec.vehicleType;
  
  result.vehicle = {
    recommendedType: vehicleRec.vehicleType,
    reason: vehicleRec.reason,
    score: vehicleRec.score,
    capacityUtilization: getCapacityUtilization(selectedVehicle, input.weight_mt),
    alternativeTypes: vehicleRec.alternativeTypes || [],
  };

  // Calculate pricing
  if (result.route) {
    result.pricing = calculatePrice(
      result.route.distance_km,
      selectedVehicle
    );
  }

  return result;
}

/**
 * Auto-approve a booking if it meets criteria
 */
export async function autoApproveBooking(
  supabase: SupabaseClient,
  bookingId: string,
  automationResult: AutoCalculationResult
): Promise<{ success: boolean; message: string; shipmentId?: string }> {
  if (!automationResult.canAutoApprove) {
    return {
      success: false,
      message: 'Booking does not meet auto-approval criteria',
    };
  }

  if (automationResult.availableTrucks.length === 0) {
    return {
      success: false,
      message: 'No trucks available for assignment',
    };
  }

  const selectedTruck = automationResult.availableTrucks[0];

  try {
    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return { success: false, message: 'Booking not found' };
    }

    // Create shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        client_id: booking.client_id,
        truck_id: selectedTruck.id,
        origin: booking.source_city,
        destination: booking.destination_city,
        distance_km: automationResult.route?.distance_km,
        weight_mt: booking.weight_mt,
        status: 'pending',
        eta: automationResult.route?.eta?.toISOString(),
        cost: automationResult.pricing?.total,
      })
      .select('id')
      .single();

    if (shipmentError) {
      console.error('Failed to create shipment:', shipmentError);
      return { success: false, message: 'Failed to create shipment' };
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'approved',
        auto_assigned: true,
        assigned_at: new Date().toISOString(),
        assignment_score: automationResult.vehicle.score,
        assignment_reason: automationResult.vehicle.reason,
        estimated_distance: automationResult.route?.distance_km,
        estimated_duration: automationResult.route?.duration_seconds,
        estimated_cost: automationResult.pricing?.total,
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return { success: false, message: 'Failed to update booking status' };
    }

    // Update truck status
    await supabase
      .from('trucks')
      .update({ status: 'assigned' })
      .eq('id', selectedTruck.id);

    return {
      success: true,
      message: `Auto-approved and assigned to ${selectedTruck.plate}`,
      shipmentId: shipment.id,
    };
  } catch (error) {
    console.error('Auto-approve error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a booking qualifies for express processing
 */
export function checkExpressEligibility(
  automationResult: AutoCalculationResult
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let eligible = true;

  // Distance check (under 500km for express)
  if (automationResult.route) {
    if (automationResult.route.distance_km <= 500) {
      reasons.push('✓ Short distance route (≤500km)');
    } else {
      reasons.push('✗ Long distance route (>500km)');
      eligible = false;
    }
  } else {
    reasons.push('✗ Route not calculated');
    eligible = false;
  }

  // Vehicle availability check
  if (automationResult.availableTrucks.length >= 2) {
    reasons.push('✓ Multiple trucks available');
  } else if (automationResult.availableTrucks.length === 1) {
    reasons.push('~ Single truck available');
  } else {
    reasons.push('✗ No trucks available');
    eligible = false;
  }

  // Score check
  if (automationResult.vehicle.score >= 80) {
    reasons.push('✓ Excellent vehicle match');
  } else if (automationResult.vehicle.score >= 60) {
    reasons.push('~ Good vehicle match');
  } else {
    reasons.push('✗ Poor vehicle match');
    eligible = false;
  }

  return { eligible, reasons };
}
