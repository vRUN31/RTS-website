import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/utils/supabase/server';
import { sendDriverAssignmentEmail } from '@/src/utils/email';

export async function GET() {
	return NextResponse.json({ 
		message: 'Approve API endpoint is working',
		env: {
			hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
			hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
		}
	});
}

export async function POST(req: Request) {
	console.log('[API approve] Request received');
	
	// Set proper headers for JSON response
	const headers = {
		'Content-Type': 'application/json',
		'Cache-Control': 'no-cache'
	};
	
	try {
		const body = await req.json();
		const { bookingId, truckId } = body;
		console.log('[API approve] Body:', { bookingId, truckId });
		
		if (!bookingId || !truckId) {
			console.log('[API approve] Missing required fields');
			return NextResponse.json({ error: 'bookingId and truckId required' }, { status: 400, headers });
		}

		console.log('[API approve] Creating Supabase client');
		let supabase;
		try {
			supabase = await createServerClient();
		} catch (error) {
			console.error('[API approve] Supabase client creation failed:', error);
			return NextResponse.json({ 
				error: 'Database connection failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			}, { status: 500, headers });
		}

		// Ensure admin
		console.log('[API approve] Checking auth');
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		
		if (authError) {
			console.error('[API approve] Auth error:', authError);
			return NextResponse.json({ 
				error: 'Authentication failed',
				details: authError.message
			}, { status: 401, headers });
		}
		
		if (!user) {
			console.log('[API approve] No user found');
			return NextResponse.json({ 
				error: 'Not authenticated - please log in'
			}, { status: 401, headers });
		}
		
		console.log('[API approve] Checking admin role for user:', user.id);
		const { data: me, error: profileError } = await supabase
			.from('profiles')
			.select('role, client_id')
			.eq('id', user.id)
			.maybeSingle();
		
		if (profileError) {
			console.error('[API approve] Profile error:', profileError);
			return NextResponse.json({ 
				error: 'Profile lookup failed',
				details: profileError.message
			}, { status: 500, headers });
		}
		
		if (!me) {
			console.log('[API approve] No profile found for user');
			return NextResponse.json({ 
				error: 'User profile not found'
			}, { status: 404, headers });
		}
		
		if (me.role !== 'admin') {
			console.log('[API approve] User not admin:', me.role);
			return NextResponse.json({ 
				error: 'Forbidden - admin access required',
				userRole: me.role
			}, { status: 403, headers });
		}

		const { data: booking, error: bErr } = await supabase
			.from('bookings')
			.select('id, client_id, source_city, destination_city, weight_mt, vehicle_type, pickup_date, material, user_id, estimated_cost, status')
			.eq('id', bookingId)
			.maybeSingle();
			
		if (bErr) {
			console.error('[approve api] booking lookup failed', { err: bErr.message, bookingId });
			return NextResponse.json({ 
				error: 'Database error',
				details: bErr.message
			}, { status: 500, headers });
		}
		
		if (!booking) {
			console.error('[approve api] booking not found', { bookingId });
			return NextResponse.json({ 
				error: 'Booking not found',
				bookingId
			}, { status: 404, headers });
		}

		if (booking.status !== 'submitted') {
			return NextResponse.json({ 
				error: 'Booking is not in submitted status',
				currentStatus: booking.status
			}, { status: 400, headers });
		}

		// Basic validation: truck should exist and not be offline/maintenance
		// Also fetch truck details including driver information for email
		const { data: truck, error: tErr } = await supabase
			.from('trucks')
			.select('id, status, plate, driver_id')
			.eq('id', truckId)
			.maybeSingle();
			
		if (tErr) {
			console.error('[approve api] truck lookup failed', { err: tErr.message, truckId });
			return NextResponse.json({ 
				error: 'Database error during truck lookup',
				details: tErr.message
			}, { status: 500, headers });
		}
		
		if (!truck) {
			console.error('[approve api] truck not found', { truckId });
			return NextResponse.json({ 
				error: 'Truck not found',
				truckId
			}, { status: 404, headers });
		}
		
		const badStatuses = ['offline','maintenance'];
		if (truck.status && badStatuses.includes(String(truck.status).toLowerCase())) {
			return NextResponse.json({ 
				error: 'Truck not available',
				truckStatus: truck.status
			}, { status: 400, headers });
		}

		// Fetch driver details for email notification
		let driverEmail: string | null = null;
		let driverName = 'Driver';
		
		if (truck.driver_id) {
			const { data: driver, error: driverErr } = await supabase
				.from('drivers')
				.select('email, name')
				.eq('id', truck.driver_id)
				.maybeSingle();
				
			if (!driverErr && driver) {
				driverEmail = driver.email;
				driverName = driver.name || 'Driver';
				console.log('[approve api] Driver found:', { name: driverName, email: driverEmail ? '✓' : '✗' });
			} else {
				console.warn('[approve api] Could not fetch driver details:', driverErr?.message);
			}
		} else {
			console.warn('[approve api] Truck has no driver assigned');
		}

		// Example placeholder cost and ETA
		const eta = booking.pickup_date ? new Date(booking.pickup_date) : new Date();
		if (!booking.pickup_date) eta.setDate(eta.getDate() + 1);
		const cost = booking.estimated_cost ?? (booking.weight_mt ? Number(booking.weight_mt) * 1000 : null);

		const { data: shipment, error: sErr } = await supabase
			.from('shipments')
			.insert({
				client_id: booking.client_id,
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
			
		if (sErr) {
			console.error('[approve api] create shipment failed', sErr);
			return NextResponse.json({ 
				error: 'Failed to create shipment',
				details: sErr.message
			}, { status: 500, headers });
		}

		const { error: uErr } = await supabase.from('bookings').update({ status: 'approved' }).eq('id', bookingId);
		if (uErr) {
			console.error('[approve api] update booking failed', uErr);
			return NextResponse.json({ 
				error: 'Failed to update booking status',
				details: uErr.message
			}, { status: 500, headers });
		}

		try {
			await supabase.from('notifications').insert({
				user_id: booking.user_id,
				type: 'dispatch',
				channel: 'inapp',
				payload: { bookingId, shipmentId: shipment?.id, message: 'Your booking was approved and a truck was assigned.' } as any,
				status: 'queued'
			});
		} catch (e) { 
			console.error('notify error', e); 
			// Don't fail the main operation for notification errors
		}

		// Send email notification to driver
		if (driverEmail) {
			console.log('[approve api] Sending email notification to driver...');
			try {
				// Calculate estimated time based on distance
				const distance = booking.estimated_distance || 500;
				const avgSpeed = 50; // km/h average
				const totalHours = distance / avgSpeed;
				const days = Math.floor(totalHours / 24);
				const hours = Math.floor(totalHours % 24);
				const estimatedTime = days > 0 
					? `${days} day${days > 1 ? 's' : ''} ${hours}h`
					: `${hours}h ${Math.round((totalHours % 1) * 60)}m`;

				const emailResult = await sendDriverAssignmentEmail(driverEmail, {
					driverName,
					truckPlate: truck.plate || truckId.slice(0, 8).toUpperCase(),
					bookingId,
					sourceCity: booking.source_city,
					destinationCity: booking.destination_city,
					distance,
					estimatedTime,
					pickupDate: booking.pickup_date 
						? new Date(booking.pickup_date).toLocaleDateString('en-IN', { 
							day: 'numeric', 
							month: 'short', 
							year: 'numeric' 
						})
						: 'TBD',
					material: booking.material || undefined,
					weight: booking.weight_mt || undefined,
					vehicleType: booking.vehicle_type || 'Standard Truck',
					specialInstructions: undefined, // Can be added if needed
				});

				if (emailResult.success) {
					console.log('✅ [approve api] Email sent successfully to driver:', driverEmail);
				} else {
					console.warn('⚠️ [approve api] Email send failed:', emailResult.error);
				}
			} catch (emailError: any) {
				console.error('❌ [approve api] Email error:', emailError.message);
				// Don't fail the main operation for email errors
			}
		} else {
			console.warn('⚠️ [approve api] No driver email available, skipping email notification');
		}

		console.log('[API approve] Success - booking approved');
		return NextResponse.json({ 
			ok: true, 
			shipmentId: shipment?.id,
			message: 'Booking approved successfully'
		}, { headers });
		
	} catch (e: any) {
		console.error('[API approve] Unexpected error:', e);
		return NextResponse.json({ 
			error: 'Unexpected server error',
			message: e?.message || 'Unknown error',
			details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
		}, { status: 500, headers });
	}
}
