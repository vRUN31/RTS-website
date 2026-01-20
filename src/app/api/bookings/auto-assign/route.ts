import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/utils/supabase/server';
import { calculateRouteBetweenCities, estimateTolls } from '@/src/utils/routing';
import { findBestTruck, recommendVehicleType, VEHICLE_TYPES } from '@/src/utils/vehicle-recommendation';
import { calculatePrice } from '@/src/utils/pricing';
import { analyzeTripDetails } from '@/src/utils/operations';
import { sendDriverAssignmentEmail, sendClientBookingApprovedEmail } from '@/src/utils/email';

export const dynamic = 'force-dynamic';

interface AutoAssignRequest {
  bookingId: string;
  autoApprove?: boolean; // If true, auto-approve if criteria met
}

interface AutoAssignResult {
  success: boolean;
  recommendation: {
    vehicleType: string;
    truckId?: string;
    truckPlate?: string;
    driverName?: string;
    reason: string;
    score: number;
  };
  routeInfo: {
    distance_km: number;
    duration_formatted: string;
    eta: string;
    estimatedCost: number;
    tollEstimate: number;
  } | null;
  autoApproved: boolean;
  message: string;
}

/**
 * POST /api/bookings/auto-assign
 * Automatically recommends and optionally assigns a truck to a booking
 */
export async function POST(req: Request) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };

  try {
    const body: AutoAssignRequest = await req.json();
    const { bookingId, autoApprove = false } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400, headers });
    }

    const supabase = await createServerClient();

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403, headers });
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers });
    }

    if (booking.status !== 'submitted') {
      return NextResponse.json(
        { error: `Booking is not in submitted status (current: ${booking.status})` },
        { status: 400, headers }
      );
    }

    // Calculate route
    let routeInfo = null;
    if (booking.source_city && booking.destination_city) {
      const route = await calculateRouteBetweenCities(
        booking.source_city,
        booking.destination_city,
        booking.pickup_date ? new Date(booking.pickup_date) : new Date()
      );

      if (route) {
        // Calculate cost using existing pricing utility
        const vehicleType = booking.vehicle_type || recommendVehicleType(booking.weight_mt || 1).vehicleType;
        const price = calculatePrice(route.distance_km, vehicleType);
        const tollEstimate = estimateTolls(route.distance_km, vehicleType);

        routeInfo = {
          distance_km: route.distance_km,
          duration_formatted: route.duration_formatted,
          eta: route.eta.toISOString(),
          estimatedCost: price.total,
          tollEstimate,
        };

        // Update booking with route info
        await supabase
          .from('bookings')
          .update({
            estimated_distance: route.distance_km,
            estimated_duration: route.duration_seconds,
            estimated_cost: price.total,
          })
          .eq('id', bookingId);
      }
    }

    // Find best truck
    const recommendation = await findBestTruck(
      supabase,
      booking.weight_mt || 1,
      booking.material
    );

    const result: AutoAssignResult = {
      success: true,
      recommendation: {
        vehicleType: recommendation.vehicleType,
        truckId: recommendation.availableTrucks[0]?.id,
        truckPlate: recommendation.availableTrucks[0]?.plate,
        driverName: recommendation.availableTrucks[0]?.driver_name,
        reason: recommendation.reason,
        score: recommendation.score,
      },
      routeInfo,
      autoApproved: false,
      message: `Recommended ${recommendation.vehicleType}`,
    };

    // Auto-approve if requested and criteria met
    const canAutoApprove = 
      autoApprove &&
      recommendation.availableTrucks.length > 0 &&
      recommendation.score >= 70 &&
      routeInfo !== null;

    if (canAutoApprove) {
      const bestTruck = recommendation.availableTrucks[0];
      
      // Create shipment
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          client_id: booking.client_id,
          truck_id: bestTruck.id,
          origin: booking.source_city,
          destination: booking.destination_city,
          distance_km: routeInfo.distance_km,
          weight_mt: booking.weight_mt,
          status: 'pending',
          eta: routeInfo.eta,
          cost: routeInfo.estimatedCost,
        })
        .select('id')
        .single();

      if (shipmentError) {
        console.error('[auto-assign] Shipment creation failed:', shipmentError);
        result.message += '. Auto-approval failed: could not create shipment';
      } else {
        // Update booking status
        await supabase
          .from('bookings')
          .update({ status: 'approved' })
          .eq('id', bookingId);

        // Update truck status
        await supabase
          .from('trucks')
          .update({ status: 'assigned' })
          .eq('id', bestTruck.id);

        result.autoApproved = true;
        result.message = `Auto-approved and assigned to ${bestTruck.plate}`;

        // Send notifications (async, don't await)
        sendNotifications(supabase, booking, bestTruck, routeInfo).catch(console.error);
      }
    } else if (autoApprove) {
      // Explain why auto-approve didn't happen
      const reasons = [];
      if (recommendation.availableTrucks.length === 0) reasons.push('no trucks available');
      if (recommendation.score < 70) reasons.push(`low confidence score (${recommendation.score})`);
      if (!routeInfo) reasons.push('route calculation failed');
      result.message += `. Auto-approval skipped: ${reasons.join(', ')}`;
    }

    return NextResponse.json(result, { status: 200, headers });
  } catch (error) {
    console.error('[auto-assign] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers }
    );
  }
}

/**
 * GET /api/bookings/auto-assign?bookingId=xxx
 * Preview auto-assignment without making changes
 */
export async function GET(req: Request) {
  const headers = { 'Content-Type': 'application/json' };
  const url = new URL(req.url);
  const bookingId = url.searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId query param required' }, { status: 400, headers });
  }

  const supabase = await createServerClient();

  // Fetch booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers });
  }

  // Get recommendation without making changes
  const recommendation = await findBestTruck(
    supabase,
    booking.weight_mt || 1,
    booking.material
  );

  // Calculate route preview
  let routePreview = null;
  if (booking.source_city && booking.destination_city) {
    const route = await calculateRouteBetweenCities(
      booking.source_city,
      booking.destination_city
    );
    if (route) {
      const vehicleType = booking.vehicle_type || recommendation.vehicleType;
      const price = calculatePrice(route.distance_km, vehicleType);
      routePreview = {
        distance_km: route.distance_km,
        duration_formatted: route.duration_formatted,
        estimatedCost: price?.total || 0,
      };
    }
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      source: booking.source_city,
      destination: booking.destination_city,
      weight_mt: booking.weight_mt,
      material: booking.material,
      vehicle_type: booking.vehicle_type,
    },
    recommendation: {
      vehicleType: recommendation.vehicleType,
      reason: recommendation.reason,
      score: recommendation.score,
      availableTrucks: recommendation.availableTrucks.slice(0, 5),
      alternativeTypes: recommendation.alternativeTypes,
    },
    routePreview,
  }, { headers });
}

/**
 * Send notifications to driver and client
 */
async function sendNotifications(
  supabase: any,
  booking: any,
  truck: any,
  routeInfo: any
) {
  try {
    // Fetch driver details
    if (truck.driver_id) {
      const { data: driver } = await supabase
        .from('drivers')
        .select('email, name, phone')
        .eq('id', truck.driver_id)
        .single();

      if (driver?.email) {
        await sendDriverAssignmentEmail(driver.email, {
          driverName: driver.name || 'Driver',
          truckPlate: truck.plate,
          bookingId: booking.id,
          sourceCity: booking.source_city,
          destinationCity: booking.destination_city,
          distance: routeInfo?.distance_km,
          estimatedTime: routeInfo?.duration_formatted,
          pickupDate: booking.pickup_date || new Date().toISOString(),
          material: booking.material,
          weight: booking.weight_mt,
          vehicleType: booking.vehicle_type || 'Truck',
        });
      }
    }

    // Fetch client details and send notification
    if (booking.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('email, name')
        .eq('id', booking.client_id)
        .single();

      // Fetch driver name for client email
      let driverName = 'Driver';
      let driverPhone: string | undefined;
      if (truck.driver_id) {
        const { data: driver } = await supabase
          .from('drivers')
          .select('name, phone')
          .eq('id', truck.driver_id)
          .single();
        if (driver) {
          driverName = driver.name || 'Driver';
          driverPhone = driver.phone;
        }
      }

      if (client?.email) {
        await sendClientBookingApprovedEmail(client.email, {
          customerName: client.name || 'Customer',
          bookingId: booking.id,
          sourceCity: booking.source_city,
          destinationCity: booking.destination_city,
          distance: routeInfo?.distance_km,
          estimatedTime: routeInfo?.duration_formatted,
          estimatedArrival: routeInfo?.eta,
          pickupDate: booking.pickup_date || new Date().toISOString(),
          material: booking.material,
          weight: booking.weight_mt,
          vehicleType: booking.vehicle_type || 'Truck',
          truckPlate: truck.plate,
          driverName,
          driverPhone,
        });
      }
    }

    // Create in-app notification
    if (booking.user_id) {
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type: 'system',
        channel: 'inapp',
        payload: {
          title: 'Booking Approved',
          message: `Your booking from ${booking.source_city} to ${booking.destination_city} has been approved. Truck ${truck.plate} assigned.`,
          bookingId: booking.id,
        },
        status: 'queued',
      });
    }
  } catch (error) {
    console.error('[auto-assign] Notification error:', error);
  }
}
