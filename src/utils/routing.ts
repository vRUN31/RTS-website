/**
 * Routing Utility - OSRM-based distance and ETA calculation
 * Uses the free Open Source Routing Machine API for route calculations
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distance_km: number;
  duration_seconds: number;
  duration_formatted: string;
  eta: Date;
  polyline?: string;
  waypoints?: Coordinates[];
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  confidence: number;
}

// OSRM Demo Server (for development) - Use your own server in production
const OSRM_BASE_URL = process.env.NEXT_PUBLIC_OSRM_URL || 'https://router.project-osrm.org';

// Nominatim for geocoding (free, rate-limited)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Geocode a city/address to coordinates
 * @param address - City name or full address
 * @param country - Country code (default: 'in' for India)
 */
export async function geocodeAddress(
  address: string,
  country: string = 'in'
): Promise<GeocodingResult | null> {
  try {
    const query = encodeURIComponent(`${address}, ${country}`);
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?q=${query}&format=json&limit=1&countrycodes=${country}`,
      {
        headers: {
          'User-Agent': 'RTS-Website-Booking-System/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('[Routing] Geocoding failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.length === 0) {
      console.warn('[Routing] No geocoding results for:', address);
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      confidence: parseFloat(result.importance) || 0.5,
    };
  } catch (error) {
    console.error('[Routing] Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate route between two coordinates using OSRM
 */
export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates,
  departureTime?: Date
): Promise<RouteResult | null> {
  try {
    // OSRM expects coordinates as lng,lat
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const response = await fetch(
      `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=polyline`,
      {
        headers: {
          'User-Agent': 'RTS-Website-Booking-System/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('[Routing] OSRM request failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('[Routing] No route found:', data.code);
      return null;
    }

    const route = data.routes[0];
    const distance_km = route.distance / 1000; // Convert meters to km
    const duration_seconds = route.duration;

    // Calculate ETA
    const departure = departureTime || new Date();
    const eta = new Date(departure.getTime() + duration_seconds * 1000);

    return {
      distance_km: Math.round(distance_km * 100) / 100,
      duration_seconds: Math.round(duration_seconds),
      duration_formatted: formatDuration(duration_seconds),
      eta,
      polyline: route.geometry,
      waypoints: data.waypoints?.map((wp: any) => ({
        lat: wp.location[1],
        lng: wp.location[0],
      })),
    };
  } catch (error) {
    console.error('[Routing] Route calculation error:', error);
    return null;
  }
}

/**
 * Calculate route between two city names
 */
export async function calculateRouteBetweenCities(
  originCity: string,
  destinationCity: string,
  departureTime?: Date
): Promise<RouteResult | null> {
  // Geocode both cities
  const [originCoords, destCoords] = await Promise.all([
    geocodeAddress(originCity),
    geocodeAddress(destinationCity),
  ]);

  if (!originCoords) {
    console.error('[Routing] Could not geocode origin:', originCity);
    return null;
  }

  if (!destCoords) {
    console.error('[Routing] Could not geocode destination:', destinationCity);
    return null;
  }

  return calculateRoute(
    { lat: originCoords.lat, lng: originCoords.lng },
    { lat: destCoords.lat, lng: destCoords.lng },
    departureTime
  );
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
 * Estimate arrival time based on distance and vehicle type
 * Uses average speeds from operations.ts as fallback
 */
export function estimateArrival(
  distance_km: number,
  vehicleType: string,
  departureTime?: Date
): Date {
  // Average speeds by vehicle type (km/h) - accounting for stops, traffic, regulations
  const avgSpeeds: Record<string, number> = {
    'Pickup (1.5T)': 50,
    'LCV (3.5T)': 45,
    'Truck (9T)': 40,
    'Truck (16T)': 38,
    'Trailer (25T)': 35,
    default: 40,
  };

  const speed = avgSpeeds[vehicleType] || avgSpeeds.default;
  const hours = distance_km / speed;
  
  // Add buffer for breaks, loading/unloading (10% extra time)
  const totalHours = hours * 1.1;
  
  const departure = departureTime || new Date();
  return new Date(departure.getTime() + totalHours * 3600 * 1000);
}

/**
 * Check if a route passes through toll roads (simplified estimation)
 * In production, use a toll API or database
 */
export function estimateTolls(distance_km: number, vehicleType: string): number {
  // Simplified toll estimation based on Indian highway tolls
  // ~₹1.5-3 per km depending on vehicle type
  const tollRates: Record<string, number> = {
    'Pickup (1.5T)': 1.0,
    'LCV (3.5T)': 1.5,
    'Truck (9T)': 2.0,
    'Truck (16T)': 2.5,
    'Trailer (25T)': 3.0,
    default: 2.0,
  };

  const rate = tollRates[vehicleType] || tollRates.default;
  // Assume ~60% of distance is on toll roads for long distances
  const tollDistance = distance_km > 100 ? distance_km * 0.6 : distance_km * 0.3;
  
  return Math.round(tollDistance * rate);
}

/**
 * Batch geocode multiple addresses
 */
export async function batchGeocode(
  addresses: string[]
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();
  
  // Rate limit: 1 request per second for Nominatim
  for (const address of addresses) {
    results.set(address, await geocodeAddress(address));
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
  
  return results;
}
