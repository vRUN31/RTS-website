import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/src/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();
    console.log('[reject route] called with', { bookingId });
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

    const supabase = await createServerClient();

    // Ensure admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: booking, error: bErr } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
    if (bErr || !booking) {
      console.error('[reject route] booking lookup failed', { err: bErr?.message, bookingId });
      return NextResponse.json({ error: bErr?.message || 'Booking not found' }, { status: 404 });
    }

    // Update booking status to rejected
    const { error: uErr } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId);
    if (uErr) {
      console.error('[reject route] update booking failed', uErr);
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    // Insert notification for the user
    try {
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type: 'booking_rejected',
        channel: 'inapp',
        payload: { bookingId, message: 'Your booking request was rejected.' } as any,
        status: 'queued'
      });
    } catch (e) { console.error('notify error', e); }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[reject route] error:', e);
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}