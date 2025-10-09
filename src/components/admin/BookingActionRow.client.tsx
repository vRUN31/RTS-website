"use client";
import React from "react";

export default function BookingActionRow({ booking }: { booking: any }) {
    function handleBookingAction(id: string, action: string) {
        // TODO: Implement booking approval/rejection logic (API call, etc.)
        alert(`Booking ${id} ${action}`);
    }
    return (
        <tr>
            <td>{String(booking.id).slice(0,8)}…</td>
            <td>{booking.client_id || booking.user_id || '—'}</td>
            <td>{booking.source_city ?? '—'}</td>
            <td>{booking.destination_city ?? '—'}</td>
            <td>{booking.vehicle_type ?? '—'}</td>
            <td>{booking.weight_mt ?? '—'}</td>
            <td>{booking.pickup_date?.slice(0,10) ?? '—'}</td>
            <td>{booking.material ?? '—'}</td>
            <td>{booking.notes ?? '—'}</td>
            <td>{booking.created_at?.slice(0,10) ?? '—'}</td>
            <td className="action-cell">
                <form onSubmit={e => { e.preventDefault(); handleBookingAction(booking.id, 'approved'); }}>
                    <button className="btn-dark" type="submit">Approve</button>
                </form>
                <form onSubmit={e => { e.preventDefault(); handleBookingAction(booking.id, 'rejected'); }}>
                    <button className="btn-dark" type="submit">Reject</button>
                </form>
            </td>
        </tr>
    );
}