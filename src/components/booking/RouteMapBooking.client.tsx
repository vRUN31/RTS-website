"use client";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './RouteMapBooking.module.css';

// Defer Leaflet import to client
type LeafletNS = typeof import('leaflet');

export type RouteMapBookingProps = {
  onRouteSelected?: (source: string, destination: string, distance: number) => void;
  height?: number | string;
};

type Location = {
  lat: number;
  lng: number;
  name: string;
};

export default function RouteMapBooking({ onRouteSelected, height = 400 }: RouteMapBookingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<LeafletNS | null>(null);
  const sourceMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [sourceInput, setSourceInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [searchingSource, setSearchingSource] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);
  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const sourceSuggestionsRef = useRef<HTMLDivElement>(null);
  const destSuggestionsRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => createClient(), []);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        if (typeof window === 'undefined') return;
        const L = await import('leaflet');
        LRef.current = L;
        
        // Fix default icon paths
        // @ts-ignore
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (!containerRef.current) return;
        const map = L.map(containerRef.current).setView([20.5937, 78.9629], 5); // India center
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        
        mapRef.current = map;
        if (isMounted) setReady(true);
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? 'Failed to initialize map');
      }
    }
    init();
    return () => {
      isMounted = false;
      try { mapRef.current?.remove?.(); } catch {}
    };
  }, []);

  // Search for location using Nominatim (OpenStreetMap's geocoding service)
  const searchLocation = async (query: string, isSource: boolean) => {
    if (!query || query.length < 3) {
      if (isSource) {
        setSourceSuggestions([]);
        setShowSourceSuggestions(false);
      } else {
        setDestSuggestions([]);
        setShowDestSuggestions(false);
      }
      return;
    }

    if (isSource) setSearchingSource(true);
    else setSearchingDest(true);

    try {
      // Using Nominatim API with focus on India
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`
      );
      const data = await response.json();
      
      const suggestions = data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      if (isSource) {
        setSourceSuggestions(suggestions);
        setShowSourceSuggestions(true);
      } else {
        setDestSuggestions(suggestions);
        setShowDestSuggestions(true);
      }
    } catch (e) {
      console.error('Location search failed:', e);
      if (isSource) {
        setSourceSuggestions([]);
        setShowSourceSuggestions(false);
      } else {
        setDestSuggestions([]);
        setShowDestSuggestions(false);
      }
    } finally {
      if (isSource) setSearchingSource(false);
      else setSearchingDest(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceInput) searchLocation(sourceInput, true);
      else setShowSourceSuggestions(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [sourceInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destInput) searchLocation(destInput, false);
      else setShowDestSuggestions(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [destInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Check if click is outside source input and suggestions
      if (
        sourceInputRef.current && 
        !sourceInputRef.current.contains(target) &&
        sourceSuggestionsRef.current &&
        !sourceSuggestionsRef.current.contains(target)
      ) {
        setShowSourceSuggestions(false);
      }
      
      // Check if click is outside destination input and suggestions
      if (
        destInputRef.current && 
        !destInputRef.current.contains(target) &&
        destSuggestionsRef.current &&
        !destSuggestionsRef.current.contains(target)
      ) {
        setShowDestSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Place markers when locations are selected
  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;

    // Remove old markers
    if (sourceMarkerRef.current) {
      map.removeLayer(sourceMarkerRef.current);
    }
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
    }

    // Add source marker (green)
    if (source) {
      const greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      
      sourceMarkerRef.current = L.marker([source.lat, source.lng], { icon: greenIcon })
        .addTo(map)
        .bindPopup(`<div style="text-align: center;"><strong>📍 Pickup</strong><br/><span style="font-size: 0.9em;">${source.name}</span></div>`);
      
      // Auto-open popup when both locations are set
      if (destination) {
        setTimeout(() => {
          if (sourceMarkerRef.current) {
            sourceMarkerRef.current.openPopup();
          }
        }, 500);
      }
    }

    // Add destination marker (red)
    if (destination) {
      const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      
      destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: redIcon })
        .addTo(map)
        .bindPopup(`<div style="text-align: center;"><strong>🎯 Delivery</strong><br/><span style="font-size: 0.9em;">${destination.name}</span></div>`);
    }

    // Fit bounds if both markers exist
    if (source && destination) {
      const bounds = L.latLngBounds([
        [source.lat, source.lng],
        [destination.lat, destination.lng]
      ]);
      map.fitBounds(bounds.pad(0.2));
    } else if (source) {
      map.setView([source.lat, source.lng], 13);
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 13);
    }
  }, [ready, source, destination]);

  // Draw route when both locations are selected
  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current || !source || !destination) {
      // Clear route info if locations are incomplete
      if (!source || !destination) {
        setDistance(null);
        setDuration(null);
      }
      return;
    }
    
    const L = LRef.current;
    const map = mapRef.current;
    
    // Remove old route line
    if (routeLineRef.current) {
      try {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      } catch (e) {
        console.warn('Error removing old route:', e);
      }
    }

    setRouteLoading(true);
    
    // Use OSRM (Open Source Routing Machine) for routing
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    )
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          
          // Draw route line with enhanced styling
          routeLineRef.current = L.polyline(coords, {
            color: '#ff4d00',
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
            dashArray: '0',
          }).addTo(map);
          
          // Add a white outline for better visibility
          const outlinePolyline = L.polyline(coords, {
            color: '#ffffff',
            weight: 8,
            opacity: 0.5,
            lineJoin: 'round',
            lineCap: 'round',
          }).addTo(map);
          
          // Keep reference to both lines
          routeLineRef.current.outline = outlinePolyline;
          
          // Calculate distance and duration
          const distanceKm = Math.round(route.distance / 1000);
          const durationMin = Math.round(route.duration / 60);
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;
          const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          
          setDistance(distanceKm);
          setDuration(durationStr);
          setRouteLoading(false);
          
          // Callback to parent component
          if (onRouteSelected) {
            onRouteSelected(source.name, destination.name, distanceKm);
          }
          
          // Fit map to route with padding
          const bounds = routeLineRef.current.getBounds();
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        } else {
          setRouteLoading(false);
          console.error('No route found');
        }
      })
      .catch(err => {
        console.error('Route calculation failed:', err);
        setRouteLoading(false);
        // Fall back to straight line distance
        const distanceKm = Math.round(
          L.latLng(source.lat, source.lng).distanceTo(L.latLng(destination.lat, destination.lng)) / 1000
        );
        setDistance(distanceKm);
        setDuration('—');
        
        // Draw straight line as fallback
        routeLineRef.current = L.polyline([
          [source.lat, source.lng],
          [destination.lat, destination.lng]
        ], {
          color: '#ff4d00',
          weight: 3,
          opacity: 0.5,
          dashArray: '10, 10'
        }).addTo(map);
        
        if (onRouteSelected) {
          onRouteSelected(source.name, destination.name, distanceKm);
        }
      })
      .finally(() => {
        setRouteLoading(false);
      });
  }, [ready, source, destination, onRouteSelected]);

  const selectSource = (location: any) => {
    setSource(location);
    setSourceInput(location.name);
    setSourceSuggestions([]);
    setShowSourceSuggestions(false);
  };

  const selectDestination = (location: any) => {
    setDestination(location);
    setDestInput(location.name);
    setDestSuggestions([]);
    setShowDestSuggestions(false);
  };

  const clearRoute = () => {
    setSource(null);
    setDestination(null);
    setSourceInput('');
    setDestInput('');
    setDistance(null);
    setDuration(null);
    
    if (sourceMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(sourceMarkerRef.current);
      sourceMarkerRef.current = null;
    }
    if (destMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }
    if (routeLineRef.current && mapRef.current) {
      // Remove main route line
      mapRef.current.removeLayer(routeLineRef.current);
      // Remove outline if it exists
      if (routeLineRef.current.outline) {
        mapRef.current.removeLayer(routeLineRef.current.outline);
      }
      routeLineRef.current = null;
    }
    
    if (mapRef.current) {
      mapRef.current.setView([20.5937, 78.9629], 5);
    }
  };

  const heightStyle = typeof height === 'number' ? { height: `${height}px` } : { height };

  return (
    <div className={styles.routeMapBooking}>
      <div className={styles.routeInputs}>
        <div className={styles.inputGroup}>
          <span className={styles.inputIcon}>📍</span>
          <div className={styles.inputWrapper}>
            <input
              ref={sourceInputRef}
              type="text"
              className={`${styles.locationInput} ${source ? styles.hasValue : ''}`}
              placeholder="Search pickup location (e.g., Mumbai Central, Andheri)"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              onFocus={() => {
                if (sourceSuggestions.length > 0) {
                  setShowSourceSuggestions(true);
                }
              }}
              aria-label="Source location"
              autoComplete="off"
            />
            {searchingSource && <span className={styles.searchingIndicator}>🔍</span>}
            {showSourceSuggestions && (
              <div ref={sourceSuggestionsRef} className={styles.suggestions}>
                {sourceSuggestions.length > 0 ? (
                  sourceSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className={styles.suggestionItem}
                      onClick={() => selectSource(item)}
                    >
                      {item.name}
                    </div>
                  ))
                ) : (
                  <div className={styles.noResults}>
                    No locations found. Try a different search term.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <span className={styles.inputIcon}>🎯</span>
          <div className={styles.inputWrapper}>
            <input
              ref={destInputRef}
              type="text"
              className={`${styles.locationInput} ${destination ? styles.hasValue : ''}`}
              placeholder="Search delivery location (e.g., Delhi Airport, Connaught Place)"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              onFocus={() => {
                if (destSuggestions.length > 0) {
                  setShowDestSuggestions(true);
                }
              }}
              aria-label="Destination location"
              autoComplete="off"
            />
            {searchingDest && <span className={styles.searchingIndicator}>🔍</span>}
            {showDestSuggestions && (
              <div ref={destSuggestionsRef} className={styles.suggestions}>
                {destSuggestions.length > 0 ? (
                  destSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className={styles.suggestionItem}
                      onClick={() => selectDestination(item)}
                    >
                      {item.name}
                    </div>
                  ))
                ) : (
                  <div className={styles.noResults}>
                    No locations found. Try a different search term.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {(distance !== null || routeLoading) && (
          <div className={styles.routeInfo}>
            {routeLoading ? (
              <div className={styles.routeLoading}>
                <span className={styles.routeLoadingSpinner}>🔄</span>
                <span>Calculating route...</span>
              </div>
            ) : (
              <>
                <div className={styles.routeInfoItem}>
                  <div className={styles.routeInfoLabel}>Distance</div>
                  <div className={styles.routeInfoValue}>{distance} km</div>
                </div>
                <div className={styles.routeInfoItem}>
                  <div className={styles.routeInfoLabel}>Estimated Time</div>
                  <div className={styles.routeInfoValue}>{duration || '—'}</div>
                </div>
                <button className={styles.clearRouteBtn} onClick={clearRoute}>
                  🗑️ Clear Route
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className={styles.mapContainerBooking}
        style={heightStyle}
        aria-label="Route Planning Map"
      >
        {!ready && !error && <div className={styles.loadingText}>Loading map…</div>}
        {error && <div role="alert" className={styles.loadingText}>Map error: {error}</div>}
      </div>
    </div>
  );
}
