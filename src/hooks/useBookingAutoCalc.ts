"use client";

import { useState, useEffect, useCallback } from 'react';
import { calculateRouteBetweenCities, estimateTolls } from '@/src/utils/routing';
import { recommendVehicleType, getCapacityUtilization } from '@/src/utils/vehicle-recommendation';
import { calculatePrice, type PriceBreakdown } from '@/src/utils/pricing';

export interface AutoCalcInput {
  sourceCity: string;
  destinationCity: string;
  weight_mt: number;
  material?: string | null;
  vehicleType?: string | null;
  pickupDate?: string | null;
}

export interface AutoCalcResult {
  loading: boolean;
  error: string | null;
  route: {
    distance_km: number;
    duration_seconds: number;
    duration_formatted: string;
    eta: Date;
  } | null;
  vehicle: {
    recommendedType: string;
    reason: string;
    score: number;
    capacityUtilization: number;
    alternativeTypes: string[];
  };
  pricing: PriceBreakdown | null;
  tollEstimate: number;
}

/**
 * React hook for automatic booking calculations
 * Calculates route, recommends vehicle, and estimates price as user fills the form
 */
export function useBookingAutoCalc(input: AutoCalcInput, debounceMs: number = 800): AutoCalcResult {
  const [result, setResult] = useState<AutoCalcResult>({
    loading: false,
    error: null,
    route: null,
    vehicle: {
      recommendedType: '',
      reason: '',
      score: 0,
      capacityUtilization: 0,
      alternativeTypes: [],
    },
    pricing: null,
    tollEstimate: 0,
  });

  // Debounced calculation
  const calculate = useCallback(async () => {
    // Validate minimum inputs
    if (!input.sourceCity || !input.destinationCity) {
      setResult((prev) => ({
        ...prev,
        loading: false,
        route: null,
        pricing: null,
      }));
      return;
    }

    setResult((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Calculate route
      const pickupDate = input.pickupDate ? new Date(input.pickupDate) : undefined;
      const route = await calculateRouteBetweenCities(
        input.sourceCity,
        input.destinationCity,
        pickupDate
      );

      // Get vehicle recommendation
      const vehicleRec = recommendVehicleType(input.weight_mt || 1, input.material);
      const selectedVehicle = input.vehicleType || vehicleRec.vehicleType;

      // Calculate pricing and tolls
      let pricing: PriceBreakdown | null = null;
      let tollEstimate = 0;
      
      if (route) {
        pricing = calculatePrice(route.distance_km, selectedVehicle);
        tollEstimate = estimateTolls(route.distance_km, selectedVehicle);
      }

      setResult({
        loading: false,
        error: null,
        route: route
          ? {
              distance_km: route.distance_km,
              duration_seconds: route.duration_seconds,
              duration_formatted: route.duration_formatted,
              eta: route.eta,
            }
          : null,
        vehicle: {
          recommendedType: vehicleRec.vehicleType,
          reason: vehicleRec.reason,
          score: vehicleRec.score,
          capacityUtilization: getCapacityUtilization(selectedVehicle, input.weight_mt || 1),
          alternativeTypes: vehicleRec.alternativeTypes || [],
        },
        pricing,
        tollEstimate,
      });
    } catch (error) {
      console.error('[useBookingAutoCalc] Error:', error);
      setResult((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Calculation failed',
      }));
    }
  }, [input.sourceCity, input.destinationCity, input.weight_mt, input.material, input.vehicleType, input.pickupDate]);

  // Debounced effect
  useEffect(() => {
    const timer = setTimeout(calculate, debounceMs);
    return () => clearTimeout(timer);
  }, [calculate, debounceMs]);

  return result;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${minutes} min`;
  }
}

/**
 * Format date for display
 */
export function formatETA(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
