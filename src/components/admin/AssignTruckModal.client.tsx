"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/utils/supabase/client';
import TripConfirmationModal from './TripConfirmationModal.client';

type TruckRow = {
  id: string;
  plate: string | null;
  status: string | null;
  last_updated: string | null;
  driver_id: string | null;
  driver?: {
    id: string;
    name: string | null;
    phone: string | null;
    license_no: string | null;
    license_expiry: string | null;
  } | null;
};

export default function AssignTruckModal({ bookingId, onClose, onAssigned }: {
  bookingId: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const el = document.createElement('div');
    el.className = 'modal-portal';
    document.body.appendChild(el);
    setContainer(el);
    return () => {
      document.body.removeChild(el);
      setMounted(false);
      setContainer(null);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      const supabase = createClient();
      
      // Fetch booking details
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      
      if (mounted && bookingData) setBooking(bookingData);
      
      // Fetch trucks and drivers separately to avoid RLS joins
      const { data: trucksList } = await supabase
        .from('trucks')
        .select('id, plate, status, last_updated, driver_id')
        .limit(500);
      const driverIds = Array.from(new Set((trucksList ?? []).map(t => t.driver_id).filter(Boolean))) as string[];
      let driverMap: Record<string, TruckRow['driver']> = {};
      if (driverIds.length > 0) {
        const { data: driversList } = await supabase
          .from('drivers')
          .select('id, name, phone, license_no, license_expiry')
          .in('id', driverIds);
        driverMap = Object.fromEntries((driversList ?? []).map((d: any) => [d.id, d]));
      }
      const rows: TruckRow[] = (trucksList ?? []).map((t: any) => ({
        ...t,
        driver: t.driver_id ? driverMap[t.driver_id] ?? null : null,
      }));
      if (mounted) setTrucks(rows);
    })();
    return () => { mounted = false; };
  }, [bookingId]);

  async function handleAssignClick() {
    if (!selected) return;
    setShowConfirmation(true);
  }

  async function handleConfirmApproval() {
    setLoading(true);
    setError(null);
    try {
      // Use absolute URL to avoid any routing issues
      const url = `${window.location.origin}/api/bookings/approve`;
      console.debug('[AssignTruck] POST', url, { bookingId, truckId: selected });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ bookingId, truckId: selected }),
        credentials: 'same-origin',
      });
      
      console.debug('[AssignTruck] Response status:', res.status);
      console.debug('[AssignTruck] Response headers:', Object.fromEntries(res.headers.entries()));
      
      const text = await res.text();
      console.debug('[AssignTruck] Response text:', text);
      
      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(text);
          console.debug('[AssignTruck] Error response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Response is not JSON (likely HTML error page)
          console.error('[AssignTruck] Non-JSON response:', text.substring(0, 500));
          errorMessage = 'Server returned an unexpected response. Check console for details.';
        }
        
        throw new Error(errorMessage);
      }
      
      let result;
      try {
        result = JSON.parse(text);
        console.debug('[AssignTruck] Success response:', result);
      } catch (e) {
        console.error('[AssignTruck] Could not parse success response as JSON:', text);
        throw new Error('Server returned invalid JSON response');
      }
      
      onAssigned();
    } catch (e: any) {
      console.error('Assign error', e);
      setError(e?.message || 'Failed to approve');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  }

  const selectedTruck = trucks.find(t => t.id === selected);

  const overlay = (
    <>
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Assign Truck">
        <div className="modal-container">
          <div className="modal-header">
            <div className="modal-title">Assign a Truck</div>
            <button className="modal-close" onClick={onClose} aria-label="Close" disabled={showConfirmation}>×</button>
          </div>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="list-scroll">
              {trucks.map(t => (
                <label key={t.id} className={`list-row ${selected === t.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="truck"
                    value={t.id}
                    checked={selected === t.id}
                    onChange={() => setSelected(t.id)}
                    disabled={showConfirmation}
                  />
                  <div className="list-col id">{String((t as any).display_code ?? t.id).slice(0,8)}…</div>
                  <div className="list-col plate">{t.plate ?? '—'}</div>
                  <div className="list-col status">{t.status ?? '—'}</div>
                  <div className="list-col driver">
                    {t.driver ? (
                      <>
                        <div className="driver-name">{t.driver.name}</div>
                        <div className="driver-small">{t.driver.phone} • Lic: {t.driver.license_no} (exp {t.driver.license_expiry ?? '—'})</div>
                      </>
                    ) : t.driver_id ? (
                      <div className="driver-name muted-small">Driver record missing ({String(t.driver_id).slice(0,8)}…)</div>
                    ) : (
                      <div className="driver-name muted-small">No driver linked</div>
                    )}
                  </div>
                  <div className="list-col updated">{t.last_updated?.slice(0,10) ?? '—'}</div>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-dark" disabled={!selected || loading || showConfirmation} onClick={handleAssignClick}>
              {loading ? 'Processing…' : 'Continue to Confirmation'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Trip Confirmation Modal */}
      {showConfirmation && selectedTruck && booking && (
        <TripConfirmationModal
          bookingId={bookingId}
          truckId={selected!}
          truckPlate={selectedTruck.plate || 'N/A'}
          driverName={selectedTruck.driver?.name || 'Unassigned'}
          booking={{
            source_city: booking.source_city,
            destination_city: booking.destination_city,
            vehicle_type: booking.vehicle_type,
            material: booking.material,
            weight_mt: booking.weight_mt,
            pickup_date: booking.pickup_date,
            estimated_distance: booking.estimated_distance,
          }}
          onConfirm={handleConfirmApproval}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </>
  );

  if (!mounted || !container) return null;
  return createPortal(overlay, container);
}
