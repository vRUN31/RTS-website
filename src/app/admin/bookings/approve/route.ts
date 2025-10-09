import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { bookingId, truckId } = await req.json();
    if (!bookingId || !truckId) return NextResponse.json({ error: 'bookingId and truckId required' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerSupabase(cookieStore);

    // Ensure admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: me } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).maybeSingle();
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, client_id, source_city, destination_city, weight_mt, vehicle_type, pickup_date, material')
      .eq('id', bookingId)
      .maybeSingle();
    if (bErr || !booking) return NextResponse.json({ error: bErr?.message || 'Booking not found' }, { status: 404 });

    // Basic validation: truck should exist and not be offline/maintenance
    const { data: truck } = await supabase.from('trucks').select('id, status').eq('id', truckId).maybeSingle();
    if (!truck) return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
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

    // Example placeholder cost: weight * 1000 (INR)
    const cost = booking.weight_mt ? Number(booking.weight_mt) * 1000 : null;

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
        status: 'in_transit',
        eta: eta.toISOString(),
        cost,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    const { error: uErr } = await supabase
      .from('bookings')
      .update({ status: 'approved' })
      .eq('id', bookingId);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, shipmentId: shipment?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
