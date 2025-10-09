import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    const cookieStore = await cookies();
    const supabase = createServerSupabase(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { error } = await supabase.from('bookings').update({ status: 'rejected' }).eq('id', bookingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
