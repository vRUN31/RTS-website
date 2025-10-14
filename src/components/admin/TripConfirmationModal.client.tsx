"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { analyzeTripDetails, formatCurrency, formatPercentage, formatDateTime, type TripAnalysis } from '@/src/utils/operations';
import { calculatePrice, formatPrice } from '@/src/utils/pricing';

interface TripConfirmationModalProps {
  bookingId: string;
  truckId: string;
  truckPlate: string;
  driverName: string;
  booking: {
    source_city: string;
    destination_city: string;
    vehicle_type: string;
    material: string;
    weight_mt: number;
    pickup_date: string;
    estimated_distance?: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TripConfirmationModal({
  bookingId,
  truckId,
  truckPlate,
  driverName,
  booking,
  onConfirm,
  onCancel,
}: TripConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [analysis, setAnalysis] = useState<TripAnalysis | null>(null);
  const [confirming, setConfirming] = useState(false);

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
    // Calculate trip analysis
    // Use estimated_distance from booking if available, otherwise fallback to 500km
    const distance = booking.estimated_distance || 500;
    const pickupDate = booking.pickup_date ? new Date(booking.pickup_date) : undefined;
    
    const tripAnalysis = analyzeTripDetails(distance, booking.vehicle_type, pickupDate);
    setAnalysis(tripAnalysis);
  }, [booking]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirmation failed:', error);
      setConfirming(false);
    }
  };

  const profitColor = analysis && analysis.profit.grossProfit >= 0 ? '#10b981' : '#ef4444';
  const profitIcon = analysis && analysis.profit.grossProfit >= 0 ? '📈' : '📉';

  const overlay = (
    <div className="modal-overlay trip-confirmation-overlay" role="dialog" aria-modal="true">
      <div className="trip-confirmation-modal">
        {/* Header */}
        <div className="trip-modal-header">
          <div className="trip-modal-title">
            <span className="trip-icon">🚛</span>
            Trip Confirmation
          </div>
          <button className="modal-close" onClick={onCancel} aria-label="Close" disabled={confirming}>
            ×
          </button>
        </div>

        {/* Content */}
        <div className="trip-modal-body">
          {/* Route Section */}
          <div className="trip-section route-section">
            <div className="section-icon">📍</div>
            <div className="section-content">
              <h3 className="section-title">Route Details</h3>
              <div className="route-display">
                <div className="route-point">
                  <div className="route-marker start">A</div>
                  <div className="route-location">
                    <div className="location-label">From</div>
                    <div className="location-name">{booking.source_city}</div>
                  </div>
                </div>
                <div className="route-arrow">→</div>
                <div className="route-point">
                  <div className="route-marker end">B</div>
                  <div className="route-location">
                    <div className="location-label">To</div>
                    <div className="location-name">{booking.destination_city}</div>
                  </div>
                </div>
              </div>
              {analysis && (
                <div className="route-stats">
                  <div className="stat-item">
                    <span className="stat-icon">📏</span>
                    <span className="stat-label">Distance:</span>
                    <span className="stat-value">{analysis.distance} km</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-label">Est. Time:</span>
                    <span className="stat-value">
                      {analysis.time.totalDays} day{analysis.time.totalDays > 1 ? 's' : ''} 
                      ({analysis.time.drivingHours}h {analysis.time.drivingMinutes}m)
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">📅</span>
                    <span className="stat-label">ETA:</span>
                    <span className="stat-value">{formatDateTime(analysis.time.estimatedArrival)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Section */}
          <div className="trip-section assignment-section">
            <div className="section-icon">🔑</div>
            <div className="section-content">
              <h3 className="section-title">Assignment Details</h3>
              <div className="assignment-grid">
                <div className="assign-item">
                  <div className="assign-label">Booking ID</div>
                  <div className="assign-value">{bookingId.slice(0, 8).toUpperCase()}</div>
                </div>
                <div className="assign-item">
                  <div className="assign-label">Truck</div>
                  <div className="assign-value">{truckPlate}</div>
                </div>
                <div className="assign-item">
                  <div className="assign-label">Driver</div>
                  <div className="assign-value">{driverName}</div>
                </div>
                <div className="assign-item">
                  <div className="assign-label">Vehicle Type</div>
                  <div className="assign-value">{booking.vehicle_type}</div>
                </div>
                <div className="assign-item">
                  <div className="assign-label">Material</div>
                  <div className="assign-value">{booking.material}</div>
                </div>
                <div className="assign-item">
                  <div className="assign-label">Weight</div>
                  <div className="assign-value">{booking.weight_mt} MT</div>
                </div>
              </div>
            </div>
          </div>

          {analysis && (
            <>
              {/* Fuel Requirements */}
              <div className="trip-section fuel-section">
                <div className="section-icon">⛽</div>
                <div className="section-content">
                  <h3 className="section-title">Fuel Requirements</h3>
                  <div className="fuel-grid">
                    <div className="fuel-card">
                      <div className="fuel-label">Total Fuel Needed</div>
                      <div className="fuel-value">{analysis.fuel.totalLitersRequired} L</div>
                    </div>
                    <div className="fuel-card">
                      <div className="fuel-label">Fuel Cost</div>
                      <div className="fuel-value">{formatCurrency(analysis.fuel.totalFuelCost)}</div>
                    </div>
                    <div className="fuel-card">
                      <div className="fuel-label">Refills Needed</div>
                      <div className="fuel-value">{analysis.fuel.refillsNeeded}</div>
                    </div>
                    <div className="fuel-card">
                      <div className="fuel-label">Efficiency</div>
                      <div className="fuel-value">{analysis.fuel.fuelEfficiency} km/L</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="trip-section cost-section">
                <div className="section-icon">💰</div>
                <div className="section-content">
                  <h3 className="section-title">Cost Breakdown</h3>
                  <div className="cost-table">
                    <div className="cost-row">
                      <span className="cost-label">Fuel Cost</span>
                      <span className="cost-value">{formatCurrency(analysis.costs.fuelCost)}</span>
                    </div>
                    <div className="cost-row">
                      <span className="cost-label">Driver Cost ({analysis.time.totalDays} day{analysis.time.totalDays > 1 ? 's' : ''})</span>
                      <span className="cost-value">{formatCurrency(analysis.costs.driverCost)}</span>
                    </div>
                    <div className="cost-row">
                      <span className="cost-label">Maintenance</span>
                      <span className="cost-value">{formatCurrency(analysis.costs.maintenanceCost)}</span>
                    </div>
                    <div className="cost-row">
                      <span className="cost-label">Toll Charges</span>
                      <span className="cost-value">{formatCurrency(analysis.costs.tollCost)}</span>
                    </div>
                    <div className="cost-row total">
                      <span className="cost-label">Total Operational Cost</span>
                      <span className="cost-value">{formatCurrency(analysis.costs.totalOperationalCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Analysis */}
              <div className="trip-section profit-section">
                <div className="section-icon">{profitIcon}</div>
                <div className="section-content">
                  <h3 className="section-title">Profit Analysis</h3>
                  <div className="profit-grid">
                    <div className="profit-card revenue">
                      <div className="profit-label">Customer Payment</div>
                      <div className="profit-value">{formatCurrency(analysis.profit.revenue)}</div>
                      <div className="profit-note">Total revenue from customer</div>
                    </div>
                    <div className="profit-card cost">
                      <div className="profit-label">Operational Cost</div>
                      <div className="profit-value">{formatCurrency(analysis.profit.operationalCost)}</div>
                      <div className="profit-note">Total expenses for trip</div>
                    </div>
                    <div className="profit-card profit" style={{ borderColor: profitColor }}>
                      <div className="profit-label">
                        {analysis.profit.grossProfit >= 0 ? 'Gross Profit' : 'Loss'}
                      </div>
                      <div className="profit-value" style={{ color: profitColor }}>
                        {formatCurrency(Math.abs(analysis.profit.grossProfit))}
                      </div>
                      <div className="profit-note">
                        Margin: {formatPercentage(analysis.profit.profitMargin)} • 
                        Per km: {formatCurrency(analysis.profit.profitPerKm)}/km
                      </div>
                    </div>
                  </div>

                  {/* Profit Indicator */}
                  <div className="profit-indicator" style={{ 
                    background: analysis.profit.grossProfit >= 0 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  }}>
                    <div className="indicator-icon">
                      {analysis.profit.grossProfit >= 0 ? '✅' : '⚠️'}
                    </div>
                    <div className="indicator-text">
                      {analysis.profit.grossProfit >= 0 
                        ? `This trip is profitable with a ${analysis.profit.profitMargin.toFixed(1)}% margin` 
                        : `This trip will result in a loss of ${formatCurrency(Math.abs(analysis.profit.grossProfit))}`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!analysis && (
            <div className="loading-analysis">
              <div className="spinner"></div>
              <div>Calculating trip details...</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="trip-modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onCancel}
            disabled={confirming}
          >
            Cancel
          </button>
          <button 
            className="btn-confirm" 
            onClick={handleConfirm}
            disabled={confirming || !analysis}
          >
            {confirming ? (
              <>
                <span className="spinner-small"></span>
                Confirming...
              </>
            ) : (
              <>
                <span>✓</span>
                Confirm & Approve Trip
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted || !container) return null;
  return createPortal(overlay, container);
}
