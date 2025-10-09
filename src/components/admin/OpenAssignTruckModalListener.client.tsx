"use client";

import React from 'react';
import AssignTruckModal from '@/src/components/admin/AssignTruckModal.client';

export default function OpenAssignTruckModalListener() {
  const [bookingId, setBookingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handler = (e: any) => setBookingId(e.detail?.bookingId || null);
    window.addEventListener('open-assign-truck-modal', handler);
    return () => window.removeEventListener('open-assign-truck-modal', handler);
  }, []);

  if (!bookingId) return null;

  return (
    <AssignTruckModal
      bookingId={bookingId}
      onClose={() => setBookingId(null)}
      onAssigned={() => window.location.reload()}
    />
  );
}
