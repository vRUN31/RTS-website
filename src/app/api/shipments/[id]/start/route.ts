import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/src/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    console.log('🔍 [Start Trip] Starting request for shipment:', params.id);
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [Start Trip] Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('✅ [Start Trip] User authenticated:', user.id);

    // Get user profile to verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ [Start Trip] Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 500 }
      );
    }

    console.log('✅ [Start Trip] User role:', profile?.role);

    if (profile?.role !== 'admin') {
      console.error('❌ [Start Trip] User is not admin');
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
      console.error('❌ [Start Trip] Shipment fetch error:', fetchError);
      return NextResponse.json(
        { error: `Shipment not found: ${fetchError.message}` },
        { status: 404 }
      );
    }

    if (!shipment) {
      console.error('❌ [Start Trip] Shipment is null');
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    console.log('✅ [Start Trip] Shipment found:', { id: shipment.id, status: shipment.status, client_id: shipment.client_id });

    // Update shipment status to in_transit
    const { error: updateError } = await supabase
      .from('shipments')
      .update({ 
        status: 'in_transit'
      })
      .eq('id', shipmentId);

    if (updateError) {
      console.error('❌ [Start Trip] Failed to update shipment status:', updateError);
      return NextResponse.json(
        { error: `Failed to update shipment: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ [Start Trip] Shipment status updated to in_transit`);

    // Send notification to client if client_id exists
    if (shipment.client_id) {
      console.log('📬 [Start Trip] Sending notification to client:', shipment.client_id);
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: shipment.client_id,
          type: 'trip_start',
          payload: {
            message: `Your shipment from ${shipment.origin || 'origin'} to ${shipment.destination || 'destination'} has started! Track it in real-time.`,
            shipment_id: shipmentId,
            title: '🚀 Trip Started'
          },
          channel: 'notifications',
          status: 'unread'
        });

      if (notifError) {
        console.error('⚠️ [Start Trip] Failed to send notification:', notifError);
        // Don't fail the request if notification fails
      } else {
        console.log(`✅ [Start Trip] Notification sent successfully`);
      }
    } else {
      console.log('⚠️ [Start Trip] No client_id, skipping notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Trip started successfully',
      shipment_id: shipmentId
    });

  } catch (error: any) {
    console.error('❌ [Start Trip] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
