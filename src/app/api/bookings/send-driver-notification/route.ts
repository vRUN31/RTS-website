/**
 * API Route: Send Driver Notification Email
 * POST /api/bookings/send-driver-notification
 * 
 * Sends email notification to driver when booking is approved and assigned
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';
import { 
  generateDriverNotificationEmail, 
  generateDriverNotificationText,
  type BookingEmailData 
} from '@/src/utils/email/driver-notification';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trucks:truck_id (
          id,
          plate,
          display_code,
          drivers:driver_id (
            id,
            name,
            email,
            phone
          )
        ),
        clients:client_id (
          id,
          name,
          phone
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if truck and driver are assigned
    if (!booking.truck_id || !booking.trucks || !booking.trucks.drivers) {
      return NextResponse.json(
        { error: 'No truck or driver assigned to this booking' },
        { status: 400 }
      );
    }

    const driver = booking.trucks.drivers;

    if (!driver.email) {
      return NextResponse.json(
        { error: 'Driver email not found' },
        { status: 400 }
      );
    }

    // Fetch the related shipment to get ETA
    const { data: shipment } = await supabase
      .from('shipments')
      .select('eta')
      .eq('client_id', booking.client_id)
      .eq('origin', booking.source_city)
      .eq('destination', booking.destination_city)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Prepare email data
    const emailData: BookingEmailData = {
      bookingId: booking.id,
      driverName: driver.name,
      driverEmail: driver.email,
      sourceCity: booking.source_city,
      destinationCity: booking.destination_city,
      vehicleType: booking.vehicle_type || 'Not specified',
      material: booking.material,
      weightMt: booking.weight_mt,
      pickupDate: booking.pickup_date,
      notes: booking.notes,
      truckPlate: booking.trucks.plate || booking.trucks.display_code,
      customerName: booking.clients?.name,
      customerPhone: booking.clients?.phone,
      estimatedDistance: booking.estimated_distance,
      estimatedDuration: booking.estimated_duration,
      estimatedArrival: shipment?.eta,
    };

    // Generate email HTML
    const emailHtml = generateDriverNotificationEmail(emailData);
    const emailText = generateDriverNotificationText(emailData);

    // Log the email (for development/testing)
    console.log('========================================');
    console.log('DRIVER NOTIFICATION EMAIL');
    console.log('========================================');
    console.log('To:', emailData.driverEmail);
    console.log('Driver:', emailData.driverName);
    console.log('Booking ID:', bookingId);
    console.log('Route:', `${emailData.sourceCity} → ${emailData.destinationCity}`);
    console.log('========================================');
    console.log('HTML Email Content Generated');
    console.log('========================================\n');

    // Store notification in database
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: null,
      type: 'booking_assigned',
      title: `New Trip Assignment - ${emailData.sourceCity} to ${emailData.destinationCity}`,
      message: `You have been assigned a new delivery trip. Booking ID: #${bookingId.slice(0, 8).toUpperCase()}`,
      data: {
        booking_id: bookingId,
        driver_id: driver.id,
        driver_email: driver.email,
        source_city: emailData.sourceCity,
        destination_city: emailData.destinationCity,
      },
      channel: 'email',
      sent_at: new Date().toISOString()
    });

    if (notifError) {
      console.error('Failed to store notification:', notifError);
    }

    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    // For now, we're using console logging and database notifications
    // 
    // Example integration with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'RTS Notifications <notifications@yourdomain.com>',
    //   to: emailData.driverEmail,
    //   subject: `New Trip Assignment - ${emailData.sourceCity} to ${emailData.destinationCity}`,
    //   html: emailHtml,
    //   text: emailText
    // });

    return NextResponse.json({
      success: true,
      message: 'Driver notification sent successfully',
      data: {
        driverEmail: emailData.driverEmail,
        driverName: emailData.driverName,
        bookingId: bookingId
      }
    });

  } catch (error: any) {
    console.error('Error sending driver notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    );
  }
}
