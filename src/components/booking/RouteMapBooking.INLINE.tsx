"use client";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

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

// INLINE STYLES - Guaranteed to work!
const styles = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  inputsCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    padding: '20px',
    background: 'var(--card, #ffffff)',
    borderRadius: '16px',
    border: '1px solid var(--border, #e5e5e5)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  inputGroup: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  inputIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05))',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },
  inputWrapper: {
    position: 'relative' as const,
    flex: 1,
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    border: '2px solid #e5e5e5',
    borderRadius: '12px',
    fontSize: '1rem',
    background: '#fff',
    color: '#333',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  inputFocused: {
    borderColor: '#ff4d00',
    boxShadow: '0 0 0 4px rgba(255, 77, 0, 0.12)',
    outline: 'none',
  },
  suggestions: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    maxHeight: '240px',
    overflowY: 'auto' as const,
    zIndex: 1000,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
  },
  suggestionItem: {
    padding: '14px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '0.938rem',
    color: '#333',
    transition: 'all 0.2s ease',
  },
  suggestionItemHover: {
    background: 'linear-gradient(to right, rgba(255, 77, 0, 0.06), rgba(255, 77, 0, 0.02))',
  },
  routeInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05))',
    borderRadius: '8px',
    borderLeft: '4px solid #ff4d00',
  },
  routeInfoValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ff4d00',
  },
  clearBtn: {
    padding: '8px 16px',
    background: '#f0f0f0',
    color: '#333',
    border: '2px solid #dedede',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  mapContainer: {
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #dedede',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    display: 'inline-block',
  },
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
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null);

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
        const map = L.map(containerRef.current).setView([20.5937, 78.9629], 5);
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

  // Search for location
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
      
      if (
        sourceInputRef.current && 
        !sourceInputRef.current.contains(target) &&
        sourceSuggestionsRef.current &&
        !sourceSuggestionsRef.current.contains(target)
      ) {
        setShowSourceSuggestions(false);
      }
      
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

  // Place markers
  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;

    if (sourceMarkerRef.current) {
      map.removeLayer(sourceMarkerRef.current);
    }
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
    }

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
    }

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

  // Draw route
  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current || !source || !destination) {
      if (!source || !destination) {
        setDistance(null);
        setDuration(null);
      }
      return;
    }
    
    const L = LRef.current;
    const map = mapRef.current;
    
    if (routeLineRef.current) {
      try {
        map.removeLayer(routeLineRef.current);
        if (routeLineRef.current.outline) {
          map.removeLayer(routeLineRef.current.outline);
        }
        routeLineRef.current = null;
      } catch (e) {
        console.warn('Error removing old route:', e);
      }
    }

    setRouteLoading(true);
    
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    )
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          
          // White outline first (underneath)
          const outlinePolyline = L.polyline(coords, {
            color: '#ffffff',
            weight: 8,
            opacity: 0.5,
            lineJoin: 'round',
            lineCap: 'round',
          }).addTo(map);
          
          // Orange route line on top
          routeLineRef.current = L.polyline(coords, {
            color: '#ff4d00',
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
          }).addTo(map);
          
          routeLineRef.current.outline = outlinePolyline;
          
          const distanceKm = Math.round(route.distance / 1000);
          const durationMin = Math.round(route.duration / 60);
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;
          const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          
          setDistance(distanceKm);
          setDuration(durationStr);
          setRouteLoading(false);
          
          if (onRouteSelected) {
            onRouteSelected(source.name, destination.name, distanceKm);
          }
          
          const bounds = routeLineRef.current.getBounds();
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        } else {
          setRouteLoading(false);
        }
      })
      .catch(err => {
        console.error('Route error:', err);
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
      mapRef.current.removeLayer(routeLineRef.current);
      if (routeLineRef.current.outline) {
        mapRef.current.removeLayer(routeLineRef.current.outline);
      }
      routeLineRef.current = null;
    }
    
    if (mapRef.current) {
      mapRef.current.setView([20.5937, 78.9629], 5);
    }
  };

  const heightStyle = typeof height === 'number' ? { ...styles.mapContainer, height: `${height}px` } : { ...styles.mapContainer, height };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={styles.inputsCard}>
        <div style={styles.inputGroup}>
          <div style={styles.inputIcon}>📍</div>
          <div style={styles.inputWrapper}>
            <input
              ref={sourceInputRef}
              type="text"
              style={{
                ...styles.input,
                borderColor: source ? '#10b981' : '#e5e5e5',
              }}
              placeholder="Search pickup location (e.g., Mumbai Central, Andheri)"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              onFocus={() => {
                if (sourceSuggestions.length > 0) {
                  setShowSourceSuggestions(true);
                }
              }}
              autoComplete="off"
            />
            {searchingSource && <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', ...styles.spinner }}>🔍</span>}
            {showSourceSuggestions && (
              <div ref={sourceSuggestionsRef} style={styles.suggestions}>
                {sourceSuggestions.length > 0 ? (
                  sourceSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.suggestionItem,
                        ...(hoveredSuggestion === idx ? styles.suggestionItemHover : {}),
                      }}
                      onClick={() => selectSource(item)}
                      onMouseEnter={() => setHoveredSuggestion(idx)}
                      onMouseLeave={() => setHoveredSuggestion(null)}
                    >
                      📍 {item.name}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No locations found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={styles.inputGroup}>
          <div style={styles.inputIcon}>🎯</div>
          <div style={styles.inputWrapper}>
            <input
              ref={destInputRef}
              type="text"
              style={{
                ...styles.input,
                borderColor: destination ? '#10b981' : '#e5e5e5',
              }}
              placeholder="Search delivery location (e.g., Delhi Airport)"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              onFocus={() => {
                if (destSuggestions.length > 0) {
                  setShowDestSuggestions(true);
                }
              }}
              autoComplete="off"
            />
            {searchingDest && <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', ...styles.spinner }}>🔍</span>}
            {showDestSuggestions && (
              <div ref={destSuggestionsRef} style={styles.suggestions}>
                {destSuggestions.length > 0 ? (
                  destSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.suggestionItem,
                        ...(hoveredSuggestion === 100 + idx ? styles.suggestionItemHover : {}),
                      }}
                      onClick={() => selectDestination(item)}
                      onMouseEnter={() => setHoveredSuggestion(100 + idx)}
                      onMouseLeave={() => setHoveredSuggestion(null)}
                    >
                      🎯 {item.name}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No locations found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {(distance !== null || routeLoading) && (
          <div style={styles.routeInfo}>
            {routeLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'center' }}>
                <span style={styles.spinner}>🔄</span>
                <span>Calculating route...</span>
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: '0.813rem', color: '#666' }}>Distance</div>
                  <div style={styles.routeInfoValue}>{distance} km</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.813rem', color: '#666' }}>Est. Time</div>
                  <div style={styles.routeInfoValue}>{duration || '—'}</div>
                </div>
                <button style={styles.clearBtn} onClick={clearRoute}>
                  🗑️ Clear
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div ref={containerRef} style={heightStyle}>
        {!ready && !error && <div style={{ textAlign: 'center', padding: '20px' }}>Loading map…</div>}
        {error && <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Map error: {error}</div>}
      </div>
    </div>
  );
}
