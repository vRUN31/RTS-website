/**
 * Operations Utility for Trip Cost and Profit Analysis
 * Calculates operational costs, fuel requirements, and profit margins
 */

import { VEHICLE_RATES, ADDITIONAL_CHARGES, calculatePrice } from './pricing';

export interface VehicleOperationalData {
  fuelEfficiency: number; // km per liter
  fuelTankCapacity: number; // liters
  maintenanceCostPerKm: number; // ₹ per km
  driverCostPerDay: number; // ₹ per day
  avgSpeedKmh: number; // average speed in km/h
}

// Operational data for different vehicle types
export const VEHICLE_OPERATIONS: Record<string, VehicleOperationalData> = {
  'Pickup (1.5T)': {
    fuelEfficiency: 12, // 12 km/liter
    fuelTankCapacity: 50, // 50 liters
    maintenanceCostPerKm: 2, // ₹2/km
    driverCostPerDay: 1500, // ₹1500/day
    avgSpeedKmh: 50, // 50 km/h average
  },
  'LCV (3.5T)': {
    fuelEfficiency: 10, // 10 km/liter
    fuelTankCapacity: 70, // 70 liters
    maintenanceCostPerKm: 3, // ₹3/km
    driverCostPerDay: 1800, // ₹1800/day
    avgSpeedKmh: 45, // 45 km/h average
  },
  'Truck (9T)': {
    fuelEfficiency: 6, // 6 km/liter
    fuelTankCapacity: 200, // 200 liters
    maintenanceCostPerKm: 5, // ₹5/km
    driverCostPerDay: 2000, // ₹2000/day
    avgSpeedKmh: 40, // 40 km/h average
  },
  'Truck (16T)': {
    fuelEfficiency: 4, // 4 km/liter
    fuelTankCapacity: 300, // 300 liters
    maintenanceCostPerKm: 7, // ₹7/km
    driverCostPerDay: 2500, // ₹2500/day
    avgSpeedKmh: 38, // 38 km/h average
  },
  'Trailer (25T)': {
    fuelEfficiency: 3, // 3 km/liter
    fuelTankCapacity: 400, // 400 liters
    maintenanceCostPerKm: 10, // ₹10/km
    driverCostPerDay: 3000, // ₹3000/day
    avgSpeedKmh: 35, // 35 km/h average
  },
};

// Current fuel price (can be updated)
export const FUEL_PRICE_PER_LITER = 105; // ₹105 per liter (average diesel price)

export interface FuelRequirements {
  totalLitersRequired: number;
  totalFuelCost: number;
  refillsNeeded: number;
  fuelEfficiency: number;
}

export interface TimeEstimate {
  drivingHours: number;
  drivingMinutes: number;
  totalDays: number;
  estimatedArrival: Date;
}

export interface OperationalCosts {
  fuelCost: number;
  driverCost: number;
  maintenanceCost: number;
  tollCost: number;
  totalOperationalCost: number;
}

export interface ProfitAnalysis {
  revenue: number; // What customer pays
  operationalCost: number; // Total cost to operate
  grossProfit: number; // Revenue - Operational Cost
  profitMargin: number; // (Gross Profit / Revenue) * 100
  profitPerKm: number; // Gross Profit / Distance
}

export interface TripAnalysis {
  distance: number;
  vehicleType: string;
  fuel: FuelRequirements;
  time: TimeEstimate;
  costs: OperationalCosts;
  profit: ProfitAnalysis;
}

/**
 * Calculate fuel requirements for a trip
 */
export function calculateFuelRequirements(
  distanceInKm: number,
  vehicleType: string
): FuelRequirements | null {
  const ops = VEHICLE_OPERATIONS[vehicleType];
  if (!ops) return null;

  const totalLitersRequired = distanceInKm / ops.fuelEfficiency;
  const totalFuelCost = totalLitersRequired * FUEL_PRICE_PER_LITER;
  const refillsNeeded = Math.ceil(totalLitersRequired / ops.fuelTankCapacity);

  return {
    totalLitersRequired: Math.round(totalLitersRequired * 10) / 10,
    totalFuelCost: Math.round(totalFuelCost),
    refillsNeeded: Math.max(0, refillsNeeded - 1), // Subtract 1 because first tank is full
    fuelEfficiency: ops.fuelEfficiency,
  };
}

/**
 * Calculate estimated time for trip
 */
export function calculateTimeEstimate(
  distanceInKm: number,
  vehicleType: string,
  pickupDate?: Date
): TimeEstimate | null {
  const ops = VEHICLE_OPERATIONS[vehicleType];
  if (!ops) return null;

  // Add 20% buffer for stops, traffic, etc.
  const totalHours = (distanceInKm / ops.avgSpeedKmh) * 1.2;
  const drivingHours = Math.floor(totalHours);
  const drivingMinutes = Math.round((totalHours - drivingHours) * 60);
  const totalDays = Math.ceil(totalHours / 10); // Assume 10 hours driving per day

  const estimatedArrival = pickupDate ? new Date(pickupDate) : new Date();
  estimatedArrival.setDate(estimatedArrival.getDate() + totalDays);

  return {
    drivingHours,
    drivingMinutes,
    totalDays,
    estimatedArrival,
  };
}

/**
 * Calculate operational costs for a trip
 */
export function calculateOperationalCosts(
  distanceInKm: number,
  vehicleType: string,
  timeEstimate: TimeEstimate
): OperationalCosts | null {
  const ops = VEHICLE_OPERATIONS[vehicleType];
  if (!ops) return null;

  const fuel = calculateFuelRequirements(distanceInKm, vehicleType);
  if (!fuel) return null;

  const fuelCost = fuel.totalFuelCost;
  const driverCost = timeEstimate.totalDays * ops.driverCostPerDay;
  const maintenanceCost = distanceInKm * ops.maintenanceCostPerKm;
  
  // Estimate toll cost (5% of base price is already in pricing, but we need actual amount)
  const basePrice = distanceInKm * VEHICLE_RATES[vehicleType].baseRate;
  const tollCost = Math.round(basePrice * ADDITIONAL_CHARGES.toll);

  const totalOperationalCost = fuelCost + driverCost + maintenanceCost + tollCost;

  return {
    fuelCost: Math.round(fuelCost),
    driverCost: Math.round(driverCost),
    maintenanceCost: Math.round(maintenanceCost),
    tollCost,
    totalOperationalCost: Math.round(totalOperationalCost),
  };
}

/**
 * Calculate profit analysis for a trip
 */
export function calculateProfitAnalysis(
  distanceInKm: number,
  vehicleType: string,
  operationalCosts: OperationalCosts
): ProfitAnalysis | null {
  const pricing = calculatePrice(distanceInKm, vehicleType);
  if (!pricing) return null;

  const revenue = pricing.total;
  const operationalCost = operationalCosts.totalOperationalCost;
  const grossProfit = revenue - operationalCost;
  const profitMargin = (grossProfit / revenue) * 100;
  const profitPerKm = grossProfit / distanceInKm;

  return {
    revenue: Math.round(revenue),
    operationalCost: Math.round(operationalCost),
    grossProfit: Math.round(grossProfit),
    profitMargin: Math.round(profitMargin * 10) / 10,
    profitPerKm: Math.round(profitPerKm * 10) / 10,
  };
}

/**
 * Comprehensive trip analysis (all calculations in one)
 */
export function analyzeTripDetails(
  distanceInKm: number,
  vehicleType: string,
  pickupDate?: Date
): TripAnalysis | null {
  if (!VEHICLE_OPERATIONS[vehicleType] || distanceInKm <= 0) {
    return null;
  }

  const fuel = calculateFuelRequirements(distanceInKm, vehicleType);
  const time = calculateTimeEstimate(distanceInKm, vehicleType, pickupDate);
  
  if (!fuel || !time) return null;

  const costs = calculateOperationalCosts(distanceInKm, vehicleType, time);
  if (!costs) return null;

  const profit = calculateProfitAnalysis(distanceInKm, vehicleType, costs);
  if (!profit) return null;

  return {
    distance: Math.round(distanceInKm * 10) / 10,
    vehicleType,
    fuel,
    time,
    costs,
    profit,
  };
}

/**
 * Format currency (Indian format)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Format date/time for display
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
