"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface AutoAssignButtonProps {
  bookingId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

interface AutoAssignResult {
  success: boolean;
  recommendation: {
    vehicleType: string;
    truckId?: string;
    truckPlate?: string;
    driverName?: string;
    reason: string;
    score: number;
  };
  routeInfo: {
    distance_km: number;
    duration_formatted: string;
    eta: string;
    estimatedCost: number;
    tollEstimate: number;
  } | null;
  autoApproved: boolean;
  message: string;
}

// Inject animation styles once
const injectStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('auto-assign-modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'auto-assign-modal-styles';
  style.textContent = `
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes modalSlideIn {
      from { 
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      to { 
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    @keyframes modalSlideOut {
      from { 
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      to { 
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
    }
    @keyframes toastSlideIn {
      from { 
        opacity: 0;
        transform: translateX(100%);
      }
      to { 
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .auto-assign-backdrop {
      animation: modalFadeIn 0.25s ease-out forwards;
    }
    .auto-assign-backdrop.closing {
      animation: modalFadeOut 0.2s ease-in forwards;
    }
    .auto-assign-modal {
      animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .auto-assign-modal.closing {
      animation: modalSlideOut 0.2s ease-in forwards;
    }
    .auto-assign-toast {
      animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .auto-assign-btn-main {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .auto-assign-btn-main:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 77, 0, 0.4) !important;
    }
    .auto-assign-btn-main:active:not(:disabled) {
      transform: translateY(0);
    }
    .auto-assign-action-btn {
      transition: all 0.2s ease;
    }
    .auto-assign-action-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.05);
    }
    .auto-assign-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
    }
    .auto-assign-truck-card {
      transition: all 0.2s ease;
    }
    .auto-assign-truck-card:hover {
      transform: translateX(4px);
    }
  `;
  document.head.appendChild(style);
};

export default function AutoAssignButton({
  bookingId,
  onSuccess,
  onError,
  disabled = false,
  variant = 'primary',
  size = 'medium',
}: AutoAssignButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [result, setResult] = useState<AutoAssignResult | null>(null);

  // Inject styles on mount
  useEffect(() => {
    injectStyles();
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPreview && !isClosing) {
        handleCloseModal();
      }
    };
    if (showPreview) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [showPreview, isClosing]);

  const handleCloseModal = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setShowPreview(false);
      setIsClosing(false);
    }, 200);
  }, [isClosing]);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/auto-assign?bookingId=${bookingId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preview');
      }

      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('[AutoAssign] Preview error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  const executeAutoAssign = async (autoApprove: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, autoApprove }),
      });

      const data: AutoAssignResult = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || 'Auto-assign failed');
      }

      setResult(data);
      handleCloseModal();
      onSuccess?.(data);

      // Auto-dismiss toast after 5s
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      console.error('[AutoAssign] Error:', error);
      onError?.(error instanceof Error ? error.message : 'Auto-assign failed');
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      fontWeight: 600,
      borderRadius: '8px',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      border: 'none',
      opacity: disabled || loading ? 0.6 : 1,
    };

    const sizes = {
      small: { padding: '6px 12px', fontSize: '0.75rem' },
      medium: { padding: '10px 16px', fontSize: '0.875rem' },
      large: { padding: '12px 20px', fontSize: '1rem' },
    };

    // Brand orange colors instead of purple
    const variants = {
      primary: {
        background: 'linear-gradient(135deg, #ff4d00 0%, #cc3d00 100%)',
        color: 'white',
        boxShadow: '0 3px 12px rgba(255, 77, 0, 0.3)',
      },
      secondary: {
        background: 'linear-gradient(135deg, #ff6b35 0%, #f54d00 100%)',
        color: 'white',
        boxShadow: '0 3px 12px rgba(255, 107, 53, 0.3)',
      },
      outline: {
        background: 'transparent',
        color: '#ff4d00',
        border: '2px solid #ff4d00',
        boxShadow: 'none',
      },
    };

    return { ...base, ...sizes[size], ...variants[variant] };
  };

  return (
    <>
      <button
        onClick={fetchPreview}
        disabled={disabled || loading}
        className="auto-assign-btn-main"
        style={getButtonStyles()}
        title="Auto-assign a truck to this booking"
      >
        {loading ? (
          <>
            <span style={{ 
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
              fontSize: '0.875em'
            }}>⏳</span>
            Processing...
          </>
        ) : (
          <>
            🤖 Auto-Assign
          </>
        )}
      </button>

      {/* Preview Modal with smooth animations */}
      {showPreview && previewData && (
        <div
          className={`auto-assign-backdrop ${isClosing ? 'closing' : ''}`}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={handleCloseModal}
        >
          <div
            className={`auto-assign-modal ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card, #ffffff)',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35), 0 10px 30px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header - Brand Orange Gradient */}
            <div
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #ff4d00 0%, #e04400 50%, #cc3d00 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {/* Decorative glow */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <h3 style={{ 
                  margin: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}>
                  <span style={{ fontSize: '1.4rem' }}>🤖</span>
                  Auto-Assignment Preview
                </h3>
                <button
                  onClick={handleCloseModal}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.875rem', position: 'relative' }}>
                Review the assignment details before confirming
              </p>
            </div>

            {/* Scrollable Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Booking Info Card */}
              <div style={{ 
                marginBottom: '20px',
                padding: '16px',
                background: 'var(--bg-secondary, #f8f9fa)',
                borderRadius: '12px',
                border: '1px solid var(--border, #e5e7eb)',
              }}>
                <h4 style={{ 
                  margin: '0 0 12px', 
                  color: 'var(--text-secondary, #6b7280)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}>📦 Booking Details</h4>
                <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem', color: 'var(--text, #1f2937)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#ff4d00' }}>📍</span>
                    <strong>Route:</strong> 
                    <span>{previewData.booking?.source} → {previewData.booking?.destination}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#ff4d00' }}>⚖️</span>
                    <strong>Weight:</strong> {previewData.booking?.weight_mt} MT
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#ff4d00' }}>📋</span>
                    <strong>Material:</strong> {previewData.booking?.material || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Recommendation Card */}
              <div
                style={{
                  padding: '16px',
                  background: previewData.recommendation?.score >= 70 
                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                    : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: previewData.recommendation?.score >= 70 
                    ? '1px solid #6ee7b7'
                    : '1px solid #fcd34d',
                }}
              >
                <h4 style={{ 
                  margin: '0 0 12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: previewData.recommendation?.score >= 70 ? '#065f46' : '#92400e',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}>
                  {previewData.recommendation?.score >= 70 ? '✅' : '⚠️'} 
                  AI Recommendation
                </h4>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: previewData.recommendation?.score >= 70 ? '#047857' : '#b45309',
                  display: 'grid',
                  gap: '6px',
                }}>
                  <div><strong>Vehicle Type:</strong> {previewData.recommendation?.vehicleType}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Confidence:</strong> 
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '12px',
                      background: previewData.recommendation?.score >= 70 ? '#059669' : '#d97706',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      {previewData.recommendation?.score}%
                    </span>
                  </div>
                  <div><strong>Reason:</strong> {previewData.recommendation?.reason}</div>
                </div>
              </div>

              {/* Available Trucks */}
              {previewData.recommendation?.availableTrucks?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: '0 0 12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text, #1f2937)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    🚚 Available Trucks 
                    <span style={{
                      background: '#ff4d00',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                    }}>
                      {previewData.recommendation.availableTrucks.length}
                    </span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {previewData.recommendation.availableTrucks.slice(0, 3).map((truck: any, i: number) => (
                      <div
                        key={truck.id}
                        className="auto-assign-truck-card"
                        style={{
                          padding: '12px 16px',
                          background: i === 0 
                            ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' 
                            : 'var(--bg-secondary, #f9fafb)',
                          borderRadius: '10px',
                          fontSize: '0.9rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: i === 0 ? '2px solid #ff4d00' : '1px solid var(--border, #e5e7eb)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>🚚</span>
                          <strong>{truck.plate}</strong>
                          {truck.driver_name && (
                            <span style={{ color: 'var(--text-secondary, #6b7280)' }}>
                              • {truck.driver_name}
                            </span>
                          )}
                        </span>
                        {i === 0 && (
                          <span style={{ 
                            color: '#ff4d00', 
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            background: '#fff7ed',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}>
                            ⭐ Best Match
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Route Stats */}
              {previewData.routePreview && (
                <div
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    borderRadius: '12px',
                    border: '1px solid #bae6fd',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: '#0369a1', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                      Distance
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0c4a6e' }}>
                      {previewData.routePreview.distance_km} km
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid #bae6fd', borderRight: '1px solid #bae6fd', paddingLeft: '12px', paddingRight: '12px' }}>
                    <div style={{ color: '#0369a1', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                      Duration
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0c4a6e' }}>
                      {previewData.routePreview.duration_formatted}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#0369a1', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                      Est. Cost
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0c4a6e' }}>
                      ₹{previewData.routePreview.estimatedCost?.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border, #e5e7eb)',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                background: 'var(--bg-secondary, #f9fafb)',
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleCloseModal}
                className="auto-assign-action-btn"
                style={{
                  padding: '12px 24px',
                  background: 'var(--card, white)',
                  border: '1px solid var(--border, #d1d5db)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'var(--text, #374151)',
                  fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeAutoAssign(false)}
                disabled={loading || !previewData.recommendation?.availableTrucks?.length}
                className="auto-assign-action-btn"
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  color: '#0369a1',
                  border: '1px solid #7dd3fc',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                💡 Recommend Only
              </button>
              <button
                onClick={() => executeAutoAssign(true)}
                disabled={loading || previewData.recommendation?.score < 70 || !previewData.recommendation?.availableTrucks?.length}
                className="auto-assign-action-btn"
                style={{
                  padding: '12px 24px',
                  background: previewData.recommendation?.score >= 70 
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: previewData.recommendation?.score >= 70 ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  boxShadow: previewData.recommendation?.score >= 70 
                    ? '0 4px 14px rgba(34, 197, 94, 0.4)' 
                    : 'none',
                }}
              >
                ✓ Auto-Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Toast */}
      {result && (
        <div
          className="auto-assign-toast"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '16px 20px',
            background: result.autoApproved 
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            maxWidth: '400px',
          }}
          onClick={() => setResult(null)}
        >
          <span style={{ fontSize: '2rem' }}>{result.autoApproved ? '✅' : '💡'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>
              {result.autoApproved ? 'Auto-Approved!' : 'Recommendation Ready'}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.95 }}>{result.message}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setResult(null); }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '8px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
