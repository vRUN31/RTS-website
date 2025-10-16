import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/src/utils/supabase/server';
import { sendClientTripStartedEmail } from '@/src/utils/email';
import { analyzeTripDetails } from '@/src/utils/operations';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    console.log('🔍 [Start Trip] Starting request for shipment:', params.id);
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [Start Trip] Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('✅ [Start Trip] User authenticated:', user.id);

    // Get user profile to verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ [Start Trip] Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 500 }
      );
    }

    console.log('✅ [Start Trip] User role:', profile?.role);

    if (profile?.role !== 'admin') {
      console.error('❌ [Start Trip] User is not admin');
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const shipmentId = params.id;

    // Get shipment details including client_id
    const { data: shipment, error: fetchError } = await supabase
      .from('shipments')
      .select('id, client_id, status, origin, destination')
      .eq('id', shipmentId)
      .single();

    if (fetchError) {
      console.error('❌ [Start Trip] Shipment fetch error:', fetchError);
      return NextResponse.json(
        { error: `Shipment not found: ${fetchError.message}` },
        { status: 404 }
      );
    }

    if (!shipment) {
      console.error('❌ [Start Trip] Shipment is null');
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    console.log('✅ [Start Trip] Shipment found:', { id: shipment.id, status: shipment.status, client_id: shipment.client_id });

    // Update shipment status to in_transit
    const { error: updateError } = await supabase
      .from('shipments')
      .update({ 
        status: 'in_transit'
      })
      .eq('id', shipmentId);

    if (updateError) {
      console.error('❌ [Start Trip] Failed to update shipment status:', updateError);
      return NextResponse.json(
        { error: `Failed to update shipment: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ [Start Trip] Shipment status updated to in_transit`);

    // Send notification to client if client_id exists
    if (shipment.client_id) {
      console.log('📬 [Start Trip] Sending notification to client:', shipment.client_id);
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: shipment.client_id,
          type: 'trip_start',
          payload: {
            message: `Your shipment from ${shipment.origin || 'origin'} to ${shipment.destination || 'destination'} has started! Track it in real-time.`,
            shipment_id: shipmentId,
            title: '🚀 Trip Started'
          },
          channel: 'inapp',
          status: 'unread'
        });

      if (notifError) {
        console.error('⚠️ [Start Trip] Failed to send notification:', notifError);
        // Don't fail the request if notification fails
      } else {
        console.log(`✅ [Start Trip] Notification sent successfully`);
      }

      // Send email to client
      try {
        console.log('📧 [Start Trip] Sending email to client...');
        
        // Get full shipment details with truck, driver, and booking info
        const { data: fullShipment, error: shipmentError } = await supabase
          .from('shipments')
          .select(`
            id,
            origin,
            destination,
            weight_mt,
            truck_id,
            trucks (
              plate,
              driver_id,
              drivers (
                name,
                phone
              )
            )
          `)
          .eq('id', shipmentId)
          .single();

        if (shipmentError) {
          console.error('⚠️ [Start Trip] Failed to fetch full shipment details:', shipmentError);
        } else {
          // Get client profile for email and name (use 'name' not 'full_name')
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', shipment.client_id)
            .single();

          // Get booking ID from shipments - we need to add this or get it from context
          // For now, use shipmentId as reference
          const bookingId = shipmentId; // This should ideally come from the shipment record

          if (clientProfile?.email && fullShipment) {
            // Calculate trip details
            // We need distance - let's get it from the original booking or estimate
            const estimatedDistance = 500; // Fallback - should come from booking
            const vehicleType = 'Truck (9T)'; // Should come from booking
            
            const tripAnalysis = analyzeTripDetails(estimatedDistance, vehicleType);
            
            if (tripAnalysis) {
              const estimatedTime = tripAnalysis.time.totalDays > 0
                ? `${tripAnalysis.time.totalDays} day${tripAnalysis.time.totalDays > 1 ? 's' : ''}`
                : `${tripAnalysis.time.drivingHours}h ${tripAnalysis.time.drivingMinutes}m`;

              const estimatedArrival = tripAnalysis.time.estimatedArrival.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const driverName = (fullShipment.trucks as any)?.drivers?.name || 'Driver';
              const driverPhone = (fullShipment.trucks as any)?.drivers?.phone || undefined;
              const truckPlate = (fullShipment.trucks as any)?.plate || 'N/A';

              await sendClientTripStartedEmail(clientProfile.email, {
                customerName: clientProfile.name || 'Valued Customer',
                shipmentId,
                bookingId,
                sourceCity: fullShipment.origin || 'Origin',
                destinationCity: fullShipment.destination || 'Destination',
                distance: tripAnalysis.distance,
                estimatedTime,
                estimatedArrival,
                truckPlate,
                driverName,
                driverPhone,
                trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/customer`,
              });

              console.log('✅ [Start Trip] Client email sent successfully');
            }
          } else {
            console.warn('⚠️ [Start Trip] No client email available');
          }
        }
      } catch (emailError: any) {
        console.error('❌ [Start Trip] Email error:', emailError.message);
        // Don't fail the main operation
      }
    } else {
      console.log('⚠️ [Start Trip] No client_id, skipping notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Trip started successfully',
      shipment_id: shipmentId
    });

  } catch (error: any) {
    console.error('❌ [Start Trip] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
