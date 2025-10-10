import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email } = body as { name: string; phone?: string | null; email?: string | null };
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerSupabase(cookieStore as any);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const insert = {
      name,
      phone: phone ?? null,
      email: email ?? null,
      created_at: new Date().toISOString(),
    } as any;

    const { data, error } = await supabase.from('drivers').insert(insert).select('id').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ id: data?.id, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected' }, { status: 500 });
  }
}
