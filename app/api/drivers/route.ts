import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore as any);

    // Verify admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Create the driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        name,
        phone: phone || null,
        email: email || null,
        created_at: new Date().toISOString()
      })
      .select('id, name')
      .single();

    if (driverError) {
      console.error('Driver creation error:', driverError);
      return NextResponse.json({ error: driverError.message }, { status: 500 });
    }

    return NextResponse.json({ id: driver.id, name: driver.name });

  } catch (error: any) {
    console.error('Unexpected error in /api/drivers:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}