import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/src/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    console.log('🔍 [End Trip] Starting request for shipment:', params.id);
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [End Trip] Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('✅ [End Trip] User authenticated:', user.id);

    // Get user profile to verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ [End Trip] Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 500 }
      );
    }

    console.log('✅ [End Trip] User role:', profile?.role);

    if (profile?.role !== 'admin') {
      console.error('❌ [End Trip] User is not admin');
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const shipmentId = params.id;

    // Get shipment details including client_id
    const { data: shipment, error: fetchError } = await supabase
      .from('shipments')
      .select('id, client_id, status, origin, destination')
      .eq('id', shipmentId)
      .single();

    if (fetchError) {
      console.error('❌ [End Trip] Shipment fetch error:', fetchError);
      return NextResponse.json(
        { error: `Shipment not found: ${fetchError.message}` },
        { status: 404 }
      );
    }

    if (!shipment) {
      console.error('❌ [End Trip] Shipment is null');
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    console.log('✅ [End Trip] Shipment found:', { id: shipment.id, status: shipment.status, client_id: shipment.client_id });

    // Update shipment status to delivered
    const { error: updateError } = await supabase
      .from('shipments')
      .update({ 
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', shipmentId);

    if (updateError) {
      console.error('❌ [End Trip] Failed to update shipment status:', updateError);
      return NextResponse.json(
        { error: `Failed to update shipment: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ [End Trip] Shipment status updated to delivered`);

    // Send notification to client if client_id exists
    if (shipment.client_id) {
      console.log('📬 [End Trip] Sending notification to client:', shipment.client_id);
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: shipment.client_id,
          type: 'trip_end',
          payload: {
            message: `Your shipment from ${shipment.origin || 'origin'} to ${shipment.destination || 'destination'} has been delivered successfully! 🎉`,
            shipment_id: shipmentId,
            title: '🏁 Trip Completed'
          },
          channel: 'notifications',
          status: 'unread'
        });

      if (notifError) {
        console.error('⚠️ [End Trip] Failed to send notification:', notifError);
        // Don't fail the request if notification fails
      } else {
        console.log(`✅ [End Trip] Notification sent successfully`);
      }
    } else {
      console.log('⚠️ [End Trip] No client_id, skipping notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Trip ended successfully',
      shipment_id: shipmentId
    });

  } catch (error: any) {
    console.error('❌ [End Trip] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
