import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/utils/supabase/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Reject API endpoint is working',
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  });
}

export async function POST(req: Request) {
  console.log('[reject API] POST request received');
  
  // Set proper headers for JSON response
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };
  
  try {
    const body = await req.json();
    const { bookingId } = body;
    console.log('[reject API] Request body:', { bookingId });
    
    if (!bookingId) {
      console.log('[reject API] Missing bookingId');
      return NextResponse.json({ error: 'bookingId required' }, { status: 400, headers });
    }

    console.log('[reject API] Creating Supabase client');
    let supabase;
    try {
      supabase = await createServerClient();
    } catch (error) {
      console.error('[reject API] Supabase client creation failed:', error);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500, headers });
    }

    // Auth & admin check
    console.log('[reject API] Checking authentication');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[reject API] Auth error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401, headers });
    }
    
    if (!user) {
      console.log('[reject API] No user found');
      return NextResponse.json({ 
        error: 'Not authenticated - please log in'
      }, { status: 401, headers });
    }

    console.log('[reject API] Checking admin role for user:', user.id);
    const { data: me, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('[reject API] Profile lookup error:', profileError);
      return NextResponse.json({ 
        error: 'Profile lookup failed',
        details: profileError.message
      }, { status: 500, headers });
    }
    
    if (!me) {
      console.log('[reject API] No profile found for user');
      return NextResponse.json({ 
        error: 'User profile not found'
      }, { status: 404, headers });
    }
    
    if (me.role !== 'admin') {
      console.log('[reject API] User is not admin, role:', me.role);
      return NextResponse.json({ 
        error: 'Forbidden - admin access required',
        userRole: me.role
      }, { status: 403, headers });
    }

    console.log('[reject API] Looking up booking:', bookingId);
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, user_id, status')
      .eq('id', bookingId)
      .maybeSingle();
    
    if (bErr) {
      console.error('[reject API] Booking lookup error:', bErr);
      return NextResponse.json({ 
        error: 'Database error',
        details: bErr.message
      }, { status: 500, headers });
    }
    
    if (!booking) {
      console.log('[reject API] Booking not found:', bookingId);
      return NextResponse.json({ 
        error: 'Booking not found',
        bookingId
      }, { status: 404, headers });
    }

    console.log('[reject API] Booking found:', booking);
    if (booking.status !== 'submitted') {
      console.log('[reject API] Booking status is not submitted:', booking.status);
      return NextResponse.json({ 
        error: 'Booking is not in submitted status',
        currentStatus: booking.status
      }, { status: 400, headers });
    }

    console.log('[reject API] Updating booking status to rejected');
    const { error: uErr } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId);
    
    if (uErr) {
      console.error('[reject API] Update booking error:', uErr);
      return NextResponse.json({ 
        error: 'Failed to update booking status',
        details: uErr.message
      }, { status: 500, headers });
    }

    // Insert notification for the user
    console.log('[reject API] Creating notification for user:', booking.user_id);
    try {
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type: 'system',
        channel: 'inapp',
        payload: { bookingId, message: 'Your booking was rejected by the admin.' },
        status: 'queued'
      });
      console.log('[reject API] Notification created successfully');
    } catch (e) { 
      console.error('[reject API] Notification error:', e);
      // Don't fail the main operation for notification errors
    }

    console.log('[reject API] Success - booking rejected');
    return NextResponse.json({ 
      ok: true,
      message: 'Booking rejected successfully'
    }, { headers });
    
  } catch (e: any) {
    console.error('[reject API] Unexpected error:', e);
    return NextResponse.json({ 
      error: 'Unexpected server error',
      message: e?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500, headers });
  }
}
