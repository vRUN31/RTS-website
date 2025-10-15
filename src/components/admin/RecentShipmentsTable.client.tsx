"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Shipment = {
    id: string;
    origin: string | null;
    destination: string | null;
    status: string | null;
    created_at: string | null;
    client_id: string | null;
};

export default function RecentShipmentsTable({ initialShipments }: { initialShipments: Shipment[] }) {
    const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const handleStartTrip = async (shipment: Shipment) => {
        if (!shipment.id) return;
        
        setLoading(prev => ({ ...prev, [shipment.id]: true }));
        
        try {
            const response = await fetch(`/api/shipments/${shipment.id}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                let errorMessage = 'Failed to start trip';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (parseError) {
                    // Response is not JSON (probably HTML error page)
                    const text = await response.text();
                    console.error('❌ Non-JSON response:', text.substring(0, 200));
                    errorMessage = `Server error (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            // Update local state
            setShipments(prev => prev.map(s => 
                s.id === shipment.id 
                    ? { ...s, status: 'in_transit' }
                    : s
            ));

            console.log('✅ Trip started successfully');
        } catch (error: any) {
            console.error('❌ Failed to start trip:', error);
            alert(`Failed to start trip: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, [shipment.id]: false }));
        }
    };

    const handleEndTrip = async (shipment: Shipment) => {
        if (!shipment.id) return;
        
        setLoading(prev => ({ ...prev, [shipment.id]: true }));
        
        try {
            const response = await fetch(`/api/shipments/${shipment.id}/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                let errorMessage = 'Failed to end trip';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (parseError) {
                    // Response is not JSON (probably HTML error page)
                    const text = await response.text();
                    console.error('❌ Non-JSON response:', text.substring(0, 200));
                    errorMessage = `Server error (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            // Update local state
            setShipments(prev => prev.map(s => 
                s.id === shipment.id 
                    ? { ...s, status: 'delivered' }
                    : s
            ));

            console.log('✅ Trip ended successfully');
        } catch (error: any) {
            console.error('❌ Failed to end trip:', error);
            alert(`Failed to end trip: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, [shipment.id]: false }));
        }
    };

    const getStatusBadge = (status: string | null) => {
        const statusLower = (status || '').toLowerCase();
        let bgColor = '#64748b';
        let textColor = '#fff';

        if (statusLower === 'delivered') {
            bgColor = '#10b981';
        } else if (statusLower === 'in_transit') {
            bgColor = '#3b82f6';
        } else if (statusLower === 'pending') {
            bgColor = '#f59e0b';
        }

        return (
            <span style={{
                background: bgColor,
                color: textColor,
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.813rem',
                fontWeight: 600,
                display: 'inline-block'
            }}>
                {status || '—'}
            </span>
        );
    };

    const renderActionButton = (shipment: Shipment) => {
        const statusLower = (shipment.status || '').toLowerCase();
        const isLoading = loading[shipment.id] || false;

        // If delivered, no button
        if (statusLower === 'delivered') {
            return (
                <span style={{ 
                    color: '#10b981', 
                    fontSize: '0.875rem',
                    fontWeight: 600 
                }}>
                    ✓ Completed
                </span>
            );
        }

        // If in_transit, show End button
        if (statusLower === 'in_transit') {
            return (
                <button
                    onClick={() => handleEndTrip(shipment)}
                    disabled={isLoading}
                    style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-small"></span>
                            Ending...
                        </>
                    ) : (
                        <>
                            🏁 End Trip
                        </>
                    )}
                </button>
            );
        }

        // Otherwise (pending or other), show Start button
        return (
            <button
                onClick={() => handleStartTrip(shipment)}
                disabled={isLoading}
                style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
                onMouseEnter={(e) => {
                    if (!isLoading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {isLoading ? (
                    <>
                        <span className="spinner-small"></span>
                        Starting...
                    </>
                ) : (
                    <>
                        🚀 Start Trip
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="table-responsive">
            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Origin</th>
                        <th>Destination</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {shipments.map((s) => (
                        <tr key={s.id}>
                            <td className="cell-id">{String(s.id).slice(0,8)}…</td>
                            <td>{s.origin ?? '—'}</td>
                            <td>{s.destination ?? '—'}</td>
                            <td>{getStatusBadge(s.status)}</td>
                            <td>{s.created_at?.slice(0,10) ?? '—'}</td>
                            <td>{renderActionButton(s)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
