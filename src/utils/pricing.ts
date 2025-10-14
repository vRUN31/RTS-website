/**
 * Pricing Utility for Truck Booking System
 * Calculates estimated cost based on distance and vehicle type
 */

export interface VehicleTypeRate {
  name: string;
  baseRate: number; // Base rate per km
  minimumCharge: number; // Minimum charge for short trips
  capacity: string; // Vehicle capacity
}

// Rate card for different vehicle types (in ₹)
export const VEHICLE_RATES: Record<string, VehicleTypeRate> = {
  'Pickup (1.5T)': {
    name: 'Pickup (1.5T)',
    baseRate: 12, // ₹12 per km
    minimumCharge: 800, // Minimum ₹800
    capacity: '1.5 Ton'
  },
  'LCV (3.5T)': {
    name: 'LCV (3.5T)',
    baseRate: 18, // ₹18 per km
    minimumCharge: 1200, // Minimum ₹1200
    capacity: '3.5 Ton'
  },
  'Truck (9T)': {
    name: 'Truck (9T)',
    baseRate: 25, // ₹25 per km
    minimumCharge: 2000, // Minimum ₹2000
    capacity: '9 Ton'
  },
  'Truck (16T)': {
    name: 'Truck (16T)',
    baseRate: 35, // ₹35 per km
    minimumCharge: 3000, // Minimum ₹3000
    capacity: '16 Ton'
  },
  'Trailer (25T)': {
    name: 'Trailer (25T)',
    baseRate: 45, // ₹45 per km
    minimumCharge: 4500, // Minimum ₹4500
    capacity: '25 Ton'
  }
};

// Additional charges
export const ADDITIONAL_CHARGES = {
  gst: 0.18, // 18% GST
  toll: 0.05, // Approximate 5% for tolls
  loading: 500, // Loading/unloading charges
};

export interface PriceBreakdown {
  basePrice: number;
  gst: number;
  toll: number;
  loading: number;
  total: number;
  perKm: number;
  distance: number;
  vehicleType: string;
}

/**
 * Calculate estimated price for a shipment
 * @param distanceInKm - Distance in kilometers
 * @param vehicleType - Type of vehicle (must match keys in VEHICLE_RATES)
 * @returns Price breakdown object
 */
export function calculatePrice(
  distanceInKm: number,
  vehicleType: string
): PriceBreakdown | null {
  const rate = VEHICLE_RATES[vehicleType];
  
  if (!rate || distanceInKm <= 0) {
    return null;
  }

  // Calculate base price
  const basePrice = Math.max(
    distanceInKm * rate.baseRate,
    rate.minimumCharge
  );

  // Calculate additional charges
  const gst = basePrice * ADDITIONAL_CHARGES.gst;
  const toll = basePrice * ADDITIONAL_CHARGES.toll;
  const loading = ADDITIONAL_CHARGES.loading;

  // Total price
  const total = basePrice + gst + toll + loading;

  return {
    basePrice: Math.round(basePrice),
    gst: Math.round(gst),
    toll: Math.round(toll),
    loading,
    total: Math.round(total),
    perKm: rate.baseRate,
    distance: Math.round(distanceInKm * 10) / 10, // Round to 1 decimal
    vehicleType: rate.name
  };
}

/**
 * Calculate prices for all vehicle types
 * Useful for showing comparison
 */
export function calculateAllPrices(distanceInKm: number): Record<string, PriceBreakdown> {
  const prices: Record<string, PriceBreakdown> = {};
  
  Object.keys(VEHICLE_RATES).forEach(vehicleType => {
    const price = calculatePrice(distanceInKm, vehicleType);
    if (price) {
      prices[vehicleType] = price;
    }
  });

  return prices;
}

/**
 * Format price for display (Indian currency format)
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
