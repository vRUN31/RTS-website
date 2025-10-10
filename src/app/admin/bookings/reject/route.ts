import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerSupabase(cookieStore as any);

    // Auth & admin check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: booking, error: bErr } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
    if (bErr || !booking) return NextResponse.json({ error: bErr?.message || 'booking not found' }, { status: 404 });

    const { error: uErr } = await supabase.from('bookings').update({ status: 'rejected' }).eq('id', bookingId);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    try {
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type: 'system',
        channel: 'inapp',
        payload: { bookingId, message: 'Your booking was rejected by the admin.' },
        status: 'queued'
      });
    } catch (e) { console.error('notify error', e); }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected' }, { status: 500 });
  }
}
