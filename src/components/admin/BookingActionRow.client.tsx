"use client";
import React, { useState } from "react";
import AutoAssignButton from '@/src/components/booking/AutoAssignButton.client';
// We show the modal from the page-level container via a custom event to avoid rendering inside <tbody>.

export default function BookingActionRow({ booking, displayName }: { booking: any, displayName?: string }) {
    const [rejectLoading, setRejectLoading] = useState(false);
    const [rejectError, setRejectError] = useState<string | null>(null);

    async function handleReject() {
        if (!confirm('Are you sure you want to reject this booking?')) return;
        setRejectLoading(true);
        setRejectError(null);
        try {
            console.log('[BookingActionRow] Sending reject request for booking:', booking.id);
            
            // Use absolute URL to avoid any routing issues
            const url = `${window.location.origin}/api/bookings/reject`;
            console.log('[BookingActionRow] Using URL:', url);
            
            const res = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ bookingId: booking.id }),
                credentials: 'same-origin'
            });
            
            console.log('[BookingActionRow] Response status:', res.status);
            console.log('[BookingActionRow] Response headers:', Object.fromEntries(res.headers.entries()));
            
            const text = await res.text();
            console.log('[BookingActionRow] Response text:', text);
            
            if (!res.ok) {
                let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
                
                // Try to parse as JSON
                try {
                    const errorData = JSON.parse(text);
                    console.log('[BookingActionRow] Error response:', errorData);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // Response is not JSON (likely HTML error page)
                    console.error('[BookingActionRow] Non-JSON response:', text.substring(0, 500));
                    errorMessage = 'Server returned an unexpected response. Check console for details.';
                }
                
                throw new Error(errorMessage);
            }
            
            let result;
            try {
                result = JSON.parse(text);
                console.log('[BookingActionRow] Success response:', result);
            } catch (e) {
                console.error('[BookingActionRow] Could not parse success response as JSON:', text);
                throw new Error('Server returned invalid JSON response');
            }
            
            // Refresh the page to show updated booking status
            window.location.reload();
        } catch (e: any) {
            console.error('[BookingActionRow] Reject error:', e);
            setRejectError(e?.message || 'Failed to reject booking');
        } finally {
            setRejectLoading(false);
        }
    }

    return (
        <>
        <tr>
            <td className="cell-id">{String(booking.id).slice(0,8)}…</td>
            <td className="cell-user">{displayName || booking.client_id || booking.user_id || '—'}</td>
            <td>{booking.source_city ?? '—'}</td>
            <td>{booking.destination_city ?? '—'}</td>
            <td>{booking.vehicle_type ?? '—'}</td>
            <td>{booking.weight_mt ?? '—'}</td>
            <td>{booking.pickup_date?.slice(0,10) ?? '—'}</td>
            <td>{booking.material ?? '—'}</td>
            <td>{booking.notes ?? '—'}</td>
            <td>{booking.created_at?.slice(0,10) ?? '—'}</td>
            <td className="action-cell" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <AutoAssignButton 
                    bookingId={booking.id}
                    size="small"
                    onSuccess={() => window.location.reload()}
                    onError={(err) => alert(`Auto-assign failed: ${err}`)}
                />
                <button className="btn-dark" onClick={() => {
                    const ev = new CustomEvent('open-assign-truck-modal', { detail: { bookingId: booking.id } });
                    window.dispatchEvent(ev);
                }}>Approve</button>
                <button className="btn-dark" onClick={handleReject} disabled={rejectLoading}>
                    {rejectLoading ? 'Rejecting...' : 'Reject'}
                </button>
                {rejectError && <div className="error-text">{rejectError}</div>}
            </td>
        </tr>
        {/* Modal moved to page-level container */}
        </>
    );
}
