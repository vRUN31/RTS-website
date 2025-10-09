"use client";
import React, { useState } from "react";
// We show the modal from the page-level container via a custom event to avoid rendering inside <tbody>.

export default function BookingActionRow({ booking, displayName }: { booking: any, displayName?: string }) {
    const [showModal, setShowModal] = useState(false);
    async function handleReject() {
        try {
            const res = await fetch('/admin/bookings/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: booking.id }) });
            if (!res.ok) throw new Error(await res.text());
            window.location.reload();
        } catch (e) {
            alert('Failed to reject');
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
            <td className="action-cell">
                <button className="btn-dark" onClick={() => {
                    const ev = new CustomEvent('open-assign-truck-modal', { detail: { bookingId: booking.id } });
                    window.dispatchEvent(ev);
                }}>Approve</button>
                <button className="btn-dark" onClick={handleReject}>Reject</button>
            </td>
        </tr>
        {/* Modal moved to page-level container */}
        </>
    );
}