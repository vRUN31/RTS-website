import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/src/utils/supabase/server';

export async function POST(req: Request) {
  try {
  const { bookingId, truckId } = await req.json();
  console.log('[approve route] called with', { bookingId, truckId });
    if (!bookingId || !truckId) return NextResponse.json({ error: 'bookingId and truckId required' }, { status: 400 });

    const supabase = await createServerClient();

    // Ensure admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: me } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).maybeSingle();
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, client_id, source_city, destination_city, weight_mt, vehicle_type, pickup_date, material, user_id, estimated_cost, estimated_distance, estimated_duration')
      .eq('id', bookingId)
      .maybeSingle();
    if (bErr || !booking) {
      console.error('[approve route] booking lookup failed', { err: bErr?.message, bookingId });
      return NextResponse.json({ error: bErr?.message || 'Booking not found' }, { status: 404 });
    }

    // Basic validation: truck should exist and not be offline/maintenance
    const { data: truck, error: tErr } = await supabase.from('trucks').select('id, status').eq('id', truckId).maybeSingle();
    if (tErr || !truck) {
      console.error('[approve route] truck lookup failed', { err: tErr?.message, truckId });
      return NextResponse.json({ error: tErr?.message || 'Truck not found' }, { status: 404 });
    }
    const badStatuses = ['offline','maintenance'];
    if (truck.status && badStatuses.includes(String(truck.status).toLowerCase())) {
      return NextResponse.json({ error: 'Truck not available' }, { status: 400 });
    }

    // Try to find an active contract for this client
    const today = new Date().toISOString().slice(0,10);
    const { data: contract } = await supabase
      .from('contracts')
      .select('id')
      .eq('client_id', booking.client_id)
      .lte('start_at', today)
      .gte('end_at', today)
      .maybeSingle();

    // TODO: compute ETA via routing service; for now, set ETA to pickup_date or +1 day
    const eta = booking.pickup_date ? new Date(booking.pickup_date) : new Date();
    if (!booking.pickup_date) eta.setDate(eta.getDate() + 1);

    // Example placeholder cost: weight * 1000 (INR) unless estimated_cost present
    const cost = booking.estimated_cost ?? (booking.weight_mt ? Number(booking.weight_mt) * 1000 : null);

    // Create a shipment and update booking
    const { data: shipment, error: sErr } = await supabase
      .from('shipments')
      .insert({
        client_id: booking.client_id,
        contract_id: contract?.id ?? null,
        truck_id: truckId,
        origin: booking.source_city,
        destination: booking.destination_city,
        weight_mt: booking.weight_mt,
        status: 'pending', // Changed from 'in_transit' - trip starts only when admin clicks "Start Trip"
        eta: eta.toISOString(),
        cost,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (sErr) {
      console.error('[approve route] create shipment failed', sErr);
      return NextResponse.json({ error: sErr.message }, { status: 500 });
    }

    const { error: uErr } = await supabase
      .from('bookings')
      .update({ 
        status: 'approved',
        truck_id: truckId,
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', bookingId);
    if (uErr) {
      console.error('[approve route] update booking failed', uErr);
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    // Insert notification for the user (customer)
    try {
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type: 'dispatch',
        channel: 'inapp',
        payload: { bookingId, shipmentId: shipment?.id, message: 'Your booking was approved and a truck was assigned.' } as any,
        status: 'queued'
      });
    } catch (e) { console.error('notify error', e); }

    // ====================================================================
    // Send email notification to driver
    // ====================================================================
    try {
      // Fetch truck and driver separately to avoid RLS/join issues
      const { data: truckWithDriver } = await supabase
        .from('trucks')
        .select('id, plate, display_code, driver_id')
        .eq('id', truckId)
        .single();

      if (truckWithDriver && truckWithDriver.driver_id) {
        // Fetch driver details
        const { data: driver } = await supabase
          .from('drivers')
          .select('id, name, email, phone')
          .eq('id', truckWithDriver.driver_id)
          .single();

        if (driver && driver.email) {
          console.log('========================================');
          console.log('📧 SENDING DRIVER NOTIFICATION EMAIL');
          console.log('========================================');
          console.log('Driver:', driver.name);
          console.log('Email:', driver.email);
          console.log('Booking ID:', bookingId);
          console.log('Route:', `${booking.source_city} → ${booking.destination_city}`);
          console.log('Truck:', truckWithDriver.plate || truckWithDriver.display_code);
          console.log('========================================\n');

          // Store email notification in database
          await supabase.from('notifications').insert({
            user_id: null, // Not linked to a user account
            type: 'booking_assigned',
            title: `New Trip Assignment - ${booking.source_city} to ${booking.destination_city}`,
            message: `Driver ${driver.name} has been assigned to booking #${bookingId.slice(0, 8).toUpperCase()}`,
            data: {
              booking_id: bookingId,
              driver_id: driver.id,
              driver_email: driver.email,
              driver_name: driver.name,
              source_city: booking.source_city,
              destination_city: booking.destination_city,
              vehicle_type: booking.vehicle_type,
              truck_plate: truckWithDriver.plate || truckWithDriver.display_code,
              weight_mt: booking.weight_mt,
              material: booking.material,
              pickup_date: booking.pickup_date,
              estimated_distance: booking.estimated_distance,
              estimated_duration: booking.estimated_duration,
              estimated_arrival: eta.toISOString(),
              shipment_id: shipment?.id,
            },
            channel: 'email',
            sent_at: new Date().toISOString()
          });

          // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
          // For now, the email content is stored in the database
          // and logged to console for development/testing.
          //
          // To send actual emails, add your email service integration here:
          // Example with Resend:
          // const resend = new Resend(process.env.RESEND_API_KEY);
          // await resend.emails.send({
          //   from: 'RTS Notifications <notifications@yourdomain.com>',
          //   to: driver.email,
          //   subject: `New Trip Assignment - ${booking.source_city} to ${booking.destination_city}`,
          //   html: generateDriverNotificationEmail({ ... }),
          // });
          
          console.log('✅ Driver notification logged to database');
          console.log('📩 Check notifications table for email details\n');
        } else {
          console.warn('⚠️ No driver email found for driver:', truckWithDriver.driver_id);
        }
      } else {
        console.warn('⚠️ No driver assigned to truck:', truckId);
      }
    } catch (emailError: any) {
      console.error('❌ Failed to send driver notification:', emailError);
      // Don't fail the approval if email fails
    }
    // ====================================================================

    return NextResponse.json({ ok: true, shipmentId: shipment?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
