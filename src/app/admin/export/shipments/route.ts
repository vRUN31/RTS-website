import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore);

  const q = supabase
    .from('shipments')
    .select('id, client_id, origin, destination, status, eta, cost, distance_km, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);
  const { data, error } = start && end
    ? await q.gte('created_at', start).lte('created_at', end)
    : await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = data ?? [];
  const header = ['id','client_id','origin','destination','status','eta','cost','distance_km','created_at'];
  const csv = [header.join(',')].concat(
    rows.map(r => [
      r.id,
      r.client_id,
      quote(r.origin),
      quote(r.destination),
      r.status,
      r.eta,
      r.cost,
      r.distance_km,
      r.created_at,
    ].join(','))
  ).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="shipments.csv"`,
    }
  });
}

function quote(v: any) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}
