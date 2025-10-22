"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// Vehicle specifications with capacity and typical use cases
const VEHICLE_SPECS = {
  'Pickup (1.5T)': {
    maxWeight: 1.5,
    minWeight: 0,
    capacity: '1.5 MT',
    dimensions: '10ft × 6ft',
    idealFor: ['Small parcels', 'Documents', 'Light goods', 'City deliveries'],
    pricePerKm: 12,
    icon: '🚐',
    description: 'Best for small loads and quick city deliveries'
  },
  'LCV (3.5T)': {
    maxWeight: 3.5,
    minWeight: 1.5,
    capacity: '3.5 MT',
    dimensions: '14ft × 7ft',
    idealFor: ['Furniture', 'Electronics', 'Medium cargo', 'Inter-city'],
    pricePerKm: 18,
    icon: '🚙',
    description: 'Perfect for medium-sized cargo and inter-city transport'
  },
  'Truck (9T)': {
    maxWeight: 9,
    minWeight: 3.5,
    capacity: '9 MT',
    dimensions: '19ft × 7.5ft',
    idealFor: ['Bulk goods', 'Construction materials', 'Industrial cargo'],
    pricePerKm: 25,
    icon: '🚚',
    description: 'Ideal for bulk goods and heavy materials'
  },
  'Truck (16T)': {
    maxWeight: 16,
    minWeight: 9,
    capacity: '16 MT',
    dimensions: '24ft × 8ft',
    idealFor: ['Heavy machinery', 'Large shipments', 'Long distance'],
    pricePerKm: 35,
    icon: '🚛',
    description: 'Heavy-duty transport for large shipments'
  },
  'Trailer (25T)': {
    maxWeight: 25,
    minWeight: 16,
    capacity: '25 MT',
    dimensions: '32ft × 8.5ft',
    idealFor: ['Container cargo', 'Full truckload', 'Industrial transport'],
    pricePerKm: 45,
    icon: '🚜',
    description: 'Maximum capacity for full truckload shipments'
  }
} as const;

type VehicleType = keyof typeof VEHICLE_SPECS;

interface VehicleRecommendationProps {
  weight: number; // in MT
  sourceCity: string;
  destCity: string;
  material?: string;
  onVehicleSelect: (vehicleType: string) => void;
  selectedVehicle?: string;
}

interface LaneAvailability {
  hasActiveContract: boolean;
  availableTrucks: number;
  preferredVehicles: string[];
  estimatedDeliveryDays: number;
}

export default function VehicleRecommendation({
  weight,
  sourceCity,
  destCity,
  material,
  onVehicleSelect,
  selectedVehicle
}: VehicleRecommendationProps) {
  const [recommendations, setRecommendations] = useState<VehicleType[]>([]);
  const [laneInfo, setLaneInfo] = useState<LaneAvailability | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate recommendations whenever weight changes
  useEffect(() => {
    if (weight > 0) {
      const recommended = getRecommendedVehicles(weight);
      setRecommendations(recommended);
    } else {
      setRecommendations([]);
    }
  }, [weight]);

  // Check lane availability when cities are provided
  useEffect(() => {
    if (sourceCity && destCity) {
      checkLaneAvailability();
    }
  }, [sourceCity, destCity]);

  const getRecommendedVehicles = (weightMT: number): VehicleType[] => {
    const suitable: VehicleType[] = [];
    
    // Find vehicles that can handle the weight with some buffer (90% capacity max for safety)
    for (const [vehicleType, spec] of Object.entries(VEHICLE_SPECS)) {
      const effectiveCapacity = spec.maxWeight * 0.9; // 90% capacity for safety
      
      if (weightMT <= effectiveCapacity && weightMT >= spec.minWeight) {
        suitable.push(vehicleType as VehicleType);
      }
    }

    // If no suitable vehicle found, recommend the smallest one that can handle it
    if (suitable.length === 0) {
      for (const [vehicleType, spec] of Object.entries(VEHICLE_SPECS)) {
        if (weightMT <= spec.maxWeight) {
          suitable.push(vehicleType as VehicleType);
          break;
        }
      }
    }

    // Sort by capacity (smallest suitable first for cost efficiency)
    return suitable.sort((a, b) => 
      VEHICLE_SPECS[a].maxWeight - VEHICLE_SPECS[b].maxWeight
    );
  };

  const checkLaneAvailability = async () => {
    if (!sourceCity || !destCity) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // Check for active contracts on this lane
      const today = new Date().toISOString().split('T')[0];
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, lanes')
        .lte('start_at', today)
        .gte('end_at', today)
        .not('lanes', 'is', null);

      // Check available trucks (not on active trips)
      const { data: activeShipments } = await supabase
        .from('shipments')
        .select('truck_id')
        .not('status', 'in', '("delivered","cancelled")')
        .not('truck_id', 'is', null);

      const busyTruckIds = new Set((activeShipments || []).map(s => s.truck_id));

      const { data: allTrucks } = await supabase
        .from('trucks')
        .select('id, vehicle_type, status');

      const availableTrucks = (allTrucks || []).filter(
        t => !busyTruckIds.has(t.id) && t.status !== 'maintenance'
      );

      // Check if this specific lane has contracts
      const hasLaneContract = (contracts || []).some(contract => {
        const lanes = contract.lanes as any[];
        return lanes?.some((lane: any) => 
          lane.origin?.toLowerCase().includes(sourceCity.toLowerCase()) &&
          lane.destination?.toLowerCase().includes(destCity.toLowerCase())
        );
      });

      // Estimate delivery days based on common routes (simplified)
      const estimatedDays = estimateDeliveryDays(sourceCity, destCity);

      // Get vehicle distribution
      const vehicleTypeCounts = availableTrucks.reduce((acc, truck) => {
        acc[truck.vehicle_type] = (acc[truck.vehicle_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const preferredVehicles = Object.entries(vehicleTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      setLaneInfo({
        hasActiveContract: hasLaneContract,
        availableTrucks: availableTrucks.length,
        preferredVehicles,
        estimatedDeliveryDays: estimatedDays
      });
    } catch (error) {
      console.error('Error checking lane availability:', error);
      setLaneInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const estimateDeliveryDays = (source: string, dest: string): number => {
    // Simplified estimation based on common Indian routes
    const longDistanceRoutes = [
      { from: 'mumbai', to: 'delhi', days: 2 },
      { from: 'delhi', to: 'bangalore', days: 3 },
      { from: 'kolkata', to: 'mumbai', days: 3 },
      { from: 'chennai', to: 'delhi', days: 3 },
      { from: 'pune', to: 'hyderabad', days: 2 }
    ];

    const sourceLower = source.toLowerCase();
    const destLower = dest.toLowerCase();

    // Check both directions
    for (const route of longDistanceRoutes) {
      if (
        (sourceLower.includes(route.from) && destLower.includes(route.to)) ||
        (sourceLower.includes(route.to) && destLower.includes(route.from))
      ) {
        return route.days;
      }
    }

    // Default estimation: 1 day for short, 2 for medium
    return 2;
  };

  const getValidationStatus = (vehicleType: VehicleType) => {
    const spec = VEHICLE_SPECS[vehicleType];
    const utilization = (weight / spec.maxWeight) * 100;
    const safeUtilization = (weight / (spec.maxWeight * 0.9)) * 100;

    if (weight > spec.maxWeight) {
      return {
        status: 'overweight',
        message: '⚠️ Exceeds capacity - Not recommended',
        color: '#ef5350',
        bgColor: '#ffebee'
      };
    } else if (safeUtilization > 100) {
      return {
        status: 'near-capacity',
        message: '⚡ Near maximum capacity - Handle with care',
        color: '#ff9800',
        bgColor: '#fff3e0'
      };
    } else if (utilization < 30) {
      return {
        status: 'underutilized',
        message: '💡 Under-utilized - Consider smaller vehicle',
        color: '#2196f3',
        bgColor: '#e3f2fd'
      };
    } else {
      return {
        status: 'optimal',
        message: '✅ Optimal capacity utilization',
        color: '#4caf50',
        bgColor: '#e8f5e9'
      };
    }
  };

  if (!weight || weight <= 0) {
    return (
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        border: '2px dashed #2196f3',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#0d47a1'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚖️</div>
        <div style={{ fontSize: '0.938rem', fontWeight: 600 }}>
          Enter weight to get vehicle recommendations
        </div>
        <div style={{ fontSize: '0.813rem', marginTop: '4px', opacity: 0.8 }}>
          We'll suggest the best vehicle based on your cargo weight
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Weight Summary & Lane Info Header */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
        border: '2px solid #9c27b0',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#6a1b9a', fontWeight: 600, marginBottom: '4px' }}>
            CARGO WEIGHT
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4a148c' }}>
            {weight} MT
          </div>
        </div>

        {laneInfo && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#6a1b9a', fontWeight: 600, marginBottom: '4px' }}>
                AVAILABLE TRUCKS
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4a148c' }}>
                {laneInfo.availableTrucks}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#6a1b9a', fontWeight: 600, marginBottom: '4px' }}>
                EST. DELIVERY
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4a148c' }}>
                {laneInfo.estimatedDeliveryDays} Days
              </div>
            </div>

            {laneInfo.hasActiveContract && (
              <div style={{
                padding: '8px 12px',
                background: '#4caf50',
                color: 'white',
                borderRadius: '20px',
                fontSize: '0.813rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ✅ Active Contract Lane
              </div>
            )}
          </>
        )}
      </div>

      {/* Recommendations Header */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)',
        border: '2px solid #fbc02d',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '1.25rem' }}>🎯</span>
        <div>
          <div style={{ fontSize: '0.938rem', fontWeight: 700, color: '#f57f17' }}>
            Recommended Vehicles
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f57f17', marginTop: '2px' }}>
            Based on weight capacity and optimization
          </div>
        </div>
      </div>

      {/* Vehicle Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommendations.map((vehicleType, index) => {
          const spec = VEHICLE_SPECS[vehicleType];
          const validation = getValidationStatus(vehicleType);
          const isSelected = selectedVehicle === vehicleType;
          const isRecommended = index === 0;
          const utilizationPercent = ((weight / spec.maxWeight) * 100).toFixed(1);

          return (
            <div
              key={vehicleType}
              onClick={() => onVehicleSelect(vehicleType)}
              style={{
                padding: '16px',
                background: isSelected 
                  ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' 
                  : 'white',
                border: isSelected 
                  ? '3px solid #4caf50' 
                  : isRecommended 
                    ? '2px solid #ff9800'
                    : '1px solid #e0e0e0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                boxShadow: isSelected 
                  ? '0 6px 16px rgba(76, 175, 80, 0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.08)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }
              }}
            >
              {/* Best Choice Badge */}
              {isRecommended && !isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 8px rgba(255, 152, 0, 0.4)',
                  zIndex: 1
                }}>
                  ⭐ BEST CHOICE
                </div>
              )}

              {/* Selected Badge */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '20px',
                  background: '#4caf50',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 8px rgba(76, 175, 80, 0.4)',
                  zIndex: 1
                }}>
                  ✓ SELECTED
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{
                  fontSize: '3rem',
                  flexShrink: 0,
                  filter: isSelected ? 'none' : 'grayscale(30%)'
                }}>
                  {spec.icon}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: isSelected ? '#2e7d32' : '#212121'
                      }}>
                        {vehicleType}
                      </div>
                      <div style={{
                        fontSize: '0.813rem',
                        color: '#757575',
                        marginTop: '2px'
                      }}>
                        {spec.description}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: isSelected ? '#2e7d32' : '#ff6f00'
                    }}>
                      ₹{spec.pricePerKm}/km
                    </div>
                  </div>

                  {/* Specs */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      padding: '8px',
                      background: isSelected ? '#c8e6c9' : '#f5f5f5',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '0.688rem', color: '#757575', marginBottom: '2px' }}>
                        MAX CAPACITY
                      </div>
                      <div style={{ fontSize: '0.938rem', fontWeight: 600 }}>
                        {spec.capacity}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px',
                      background: isSelected ? '#c8e6c9' : '#f5f5f5',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '0.688rem', color: '#757575', marginBottom: '2px' }}>
                        DIMENSIONS
                      </div>
                      <div style={{ fontSize: '0.938rem', fontWeight: 600 }}>
                        {spec.dimensions}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px',
                      background: isSelected ? '#c8e6c9' : '#f5f5f5',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '0.688rem', color: '#757575', marginBottom: '2px' }}>
                        UTILIZATION
                      </div>
                      <div style={{ fontSize: '0.938rem', fontWeight: 600 }}>
                        {utilizationPercent}%
                      </div>
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div style={{
                    padding: '10px',
                    background: validation.bgColor,
                    border: `2px solid ${validation.color}`,
                    borderRadius: '8px',
                    fontSize: '0.813rem',
                    fontWeight: 600,
                    color: validation.color,
                    marginBottom: '12px'
                  }}>
                    {validation.message}
                  </div>

                  {/* Ideal For */}
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#757575',
                      marginBottom: '6px',
                      fontWeight: 600
                    }}>
                      IDEAL FOR:
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {spec.idealFor.map((use) => (
                        <span
                          key={use}
                          style={{
                            padding: '4px 8px',
                            background: isSelected ? '#4caf50' : '#e0e0e0',
                            color: isSelected ? 'white' : '#424242',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          {use}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Recommendations Warning */}
      {recommendations.length === 0 && weight > 25 && (
        <div style={{
          padding: '16px',
          background: '#ffebee',
          border: '2px solid #ef5350',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#c62828',
            marginBottom: '8px'
          }}>
            Weight Exceeds Maximum Capacity
          </div>
          <div style={{ fontSize: '0.875rem', color: '#c62828' }}>
            Your cargo weighs {weight} MT, which exceeds our largest vehicle capacity (25 MT).
            <br />
            Please consider splitting the shipment or contact us for special arrangements.
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: '12px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#757575'
        }}>
          <div className="loading-spinner" style={{ margin: '0 auto 8px' }}></div>
          Checking lane availability...
        </div>
      )}
    </div>
  );
}
