"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/utils/supabase/client';
import TripConfirmationModal from './TripConfirmationModal.client';

type TruckRow = {
  id: string;
  plate: string | null;
  status: string | null;
  vehicle_type: string | null;
  last_updated: string | null;
  driver_id: string | null;
  driver?: {
    id: string;
    name: string | null;
    phone: string | null;
    license_no: string | null;
    license_expiry: string | null;
  } | null;
  // Active trip information
  isOnActiveTrip?: boolean;
  activeTripId?: string;
  activeTripDestination?: string;
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
      
      // Fetch trucks filtered by vehicle_type matching the booking
      // Only show trucks that match the vehicle type selected by the client
      const { data: trucksList } = await supabase
        .from('trucks')
        .select('id, plate, status, last_updated, driver_id, vehicle_type')
        .eq('vehicle_type', bookingData?.vehicle_type) // Filter by matching vehicle type
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

      // Fetch active shipments to check which trucks are already on trips
      const { data: activeShipments } = await supabase
        .from('shipments')
        .select('id, truck_id, destination, status')
        .not('status', 'in', '("delivered","cancelled")')
        .not('truck_id', 'is', null);

      // Create a map of truck_id -> active trip info
      const activeTripMap: Record<string, { tripId: string; destination: string }> = {};
      (activeShipments ?? []).forEach((shipment: any) => {
        if (shipment.truck_id) {
          activeTripMap[shipment.truck_id] = {
            tripId: shipment.id,
            destination: shipment.destination || 'Unknown'
          };
        }
      });

      const rows: TruckRow[] = (trucksList ?? []).map((t: any) => {
        const activeTrip = activeTripMap[t.id];
        return {
          ...t,
          driver: t.driver_id ? driverMap[t.driver_id] ?? null : null,
          isOnActiveTrip: !!activeTrip,
          activeTripId: activeTrip?.tripId,
          activeTripDestination: activeTrip?.destination,
        };
      });
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

  // Separate available and unavailable trucks
  const availableTrucks = trucks.filter(t => !t.isOnActiveTrip);
  const unavailableTrucks = trucks.filter(t => t.isOnActiveTrip);

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
            
            {/* Vehicle Type Filter Info */}
            {booking?.vehicle_type && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
                border: '2px solid #2196f3',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '32px' }}>🚚</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d47a1', marginBottom: '4px' }}>
                    Filtered by Vehicle Type
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#1565c0' }}>
                    {booking.vehicle_type}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '4px' }}>
                    Only showing trucks matching the client's selected vehicle category
                  </div>
                </div>
              </div>
            )}
            
            {/* Summary Stats */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '16px', 
              padding: '12px', 
              background: '#f6f6f6', 
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#28a745' }}>{availableTrucks.length}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>Available</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#dc3545' }}>{unavailableTrucks.length}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>On Active Trip</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>{trucks.length}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>Total Trucks</div>
              </div>
            </div>

            <div className="list-scroll">
              {/* Available Trucks Section */}
              {availableTrucks.length > 0 && (
                <>
                  <div style={{ 
                    padding: '8px 12px', 
                    background: '#e7f5ed', 
                    border: '1px solid #28a745', 
                    borderRadius: '4px',
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#155724'
                  }}>
                    ✅ Available Trucks ({availableTrucks.length})
                  </div>
                  {availableTrucks.map(t => (
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
                      <div className="list-col plate">
                        {t.plate ?? '—'}
                        {t.vehicle_type && (
                          <div style={{ 
                            fontSize: '10px', 
                            color: '#2196f3', 
                            marginTop: '2px',
                            fontWeight: 600 
                          }}>
                            {t.vehicle_type}
                          </div>
                        )}
                      </div>
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
                </>
              )}

              {/* Unavailable Trucks Section */}
              {unavailableTrucks.length > 0 && (
                <>
                  <div style={{ 
                    padding: '8px 12px', 
                    background: '#f8d7da', 
                    border: '1px solid #dc3545', 
                    borderRadius: '4px',
                    marginTop: availableTrucks.length > 0 ? '16px' : '0',
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#721c24'
                  }}>
                    🚫 Unavailable - On Active Trip ({unavailableTrucks.length})
                  </div>
                  {unavailableTrucks.map(t => (
                    <div 
                      key={t.id} 
                      className="list-row" 
                      style={{ 
                        opacity: 0.6, 
                        background: '#f8f9fa',
                        cursor: 'not-allowed',
                        position: 'relative'
                      }}
                    >
                      <input
                        type="radio"
                        name="truck"
                        value={t.id}
                        disabled={true}
                        style={{ cursor: 'not-allowed' }}
                      />
                      <div className="list-col id">{String((t as any).display_code ?? t.id).slice(0,8)}…</div>
                      <div className="list-col plate">
                        {t.plate ?? '—'}
                        {t.vehicle_type && (
                          <div style={{ 
                            fontSize: '10px', 
                            color: '#2196f3', 
                            marginTop: '2px',
                            fontWeight: 600 
                          }}>
                            {t.vehicle_type}
                          </div>
                        )}
                      </div>
                      <div className="list-col status">
                        <span style={{ color: '#dc3545', fontWeight: 600 }}>🚛 In Transit</span>
                      </div>
                      <div className="list-col driver">
                        {t.driver ? (
                          <>
                            <div className="driver-name">{t.driver.name}</div>
                            <div className="driver-small" style={{ color: '#dc3545', fontWeight: 500 }}>
                              🚨 Currently en route to: {t.activeTripDestination}
                            </div>
                          </>
                        ) : (
                          <div className="driver-name muted-small">No driver</div>
                        )}
                      </div>
                      <div className="list-col updated">
                        <span style={{ 
                          fontSize: '11px', 
                          background: '#dc3545', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '3px' 
                        }}>
                          BUSY
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {trucks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚛</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                    No trucks found for {booking?.vehicle_type || 'this vehicle type'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    The client selected <strong>{booking?.vehicle_type}</strong> but no trucks of this type exist in the system.
                  </div>
                  <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                    Please add trucks of this vehicle type in the fleet management section.
                  </div>
                </div>
              )}

              {availableTrucks.length === 0 && trucks.length > 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  background: '#fff3cd', 
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  marginTop: '16px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
                  <div style={{ fontWeight: 600, color: '#856404', marginBottom: '4px' }}>
                    All {booking?.vehicle_type} trucks are currently on active trips
                  </div>
                  <div style={{ fontSize: '13px', color: '#856404' }}>
                    Please wait for a {booking?.vehicle_type} truck to complete its delivery before assigning this booking
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="btn-dark" 
              disabled={!selected || loading || showConfirmation || (selectedTruck?.isOnActiveTrip)} 
              onClick={handleAssignClick}
            >
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
