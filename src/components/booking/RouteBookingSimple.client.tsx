"use client";

import React, { useEffect, useRef, useState } from 'react';

// Leaflet types
type LeafletMap = any;
type LeafletMarker = any;
type LeafletPolyline = any;

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface RouteBookingProps {
  onRouteSelected?: (source: string, destination: string, distance: number) => void;
  height?: number;
}

export default function RouteBookingSimple({ onRouteSelected, height = 400 }: RouteBookingProps) {
  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<any>(null);
  const initializingRef = useRef<boolean>(false);
  
  // Marker refs
  const sourceMarkerRef = useRef<LeafletMarker | null>(null);
  const destMarkerRef = useRef<LeafletMarker | null>(null);
  const routeLineRef = useRef<LeafletPolyline | null>(null);
  const outlineLineRef = useRef<LeafletPolyline | null>(null);

  // State
  const [mapReady, setMapReady] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [destText, setDestText] = useState('');
  const [sourceSuggestions, setSourceSuggestions] = useState<Location[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Location[]>([]);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Location | null>(null);
  const [selectedDest, setSelectedDest] = useState<Location | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [searchingSource, setSearchingSource] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      
      if (mapInstanceRef.current || initializingRef.current) {
        console.log('Map already initialized, skipping...');
        return;
      }

      initializingRef.current = true;

      try {
        const L = await import('leaflet');
        leafletRef.current = L;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) {
          delete (container as any)._leaflet_id;
        }

        const map = L.map(container).setView([20.5937, 78.9629], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
        if (mounted) setMapReady(true);
        console.log('✅ Map initialized');
      } catch (error) {
        console.error('❌ Map init failed:', error);
      } finally {
        initializingRef.current = false;
      }
    }

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {}
      }
    };
  }, []);

  // Search location
  const searchLocation = async (query: string, isSource: boolean) => {
    if (!query || query.length < 3) {
      if (isSource) {
        setSourceSuggestions([]);
        setShowSourceDropdown(false);
      } else {
        setDestSuggestions([]);
        setShowDestDropdown(false);
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

      const locations: Location[] = data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: item.display_name,
      }));

      if (isSource) {
        setSourceSuggestions(locations);
        setShowSourceDropdown(true);
      } else {
        setDestSuggestions(locations);
        setShowDestDropdown(true);
      }
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      if (isSource) setSearchingSource(false);
      else setSearchingDest(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText && !selectedSource) searchLocation(sourceText, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [sourceText, selectedSource]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destText && !selectedDest) searchLocation(destText, false);
    }, 500);
    return () => clearTimeout(timer);
  }, [destText, selectedDest]);

  // Place markers
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapInstanceRef.current) return;

    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    if (sourceMarkerRef.current) {
      map.removeLayer(sourceMarkerRef.current);
      sourceMarkerRef.current = null;
    }

    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    if (selectedSource) {
      const greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      sourceMarkerRef.current = L.marker([selectedSource.lat, selectedSource.lng], { icon: greenIcon })
        .addTo(map)
        .bindPopup(`<strong>📍 Pickup</strong><br/>${selectedSource.name}`)
        .openPopup();
    }

    if (selectedDest) {
      const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      destMarkerRef.current = L.marker([selectedDest.lat, selectedDest.lng], { icon: redIcon })
        .addTo(map)
        .bindPopup(`<strong>🎯 Delivery</strong><br/>${selectedDest.name}`)
        .openPopup();
    }

    if (selectedSource && selectedDest) {
      const bounds = L.latLngBounds([
        [selectedSource.lat, selectedSource.lng],
        [selectedDest.lat, selectedDest.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (selectedSource) {
      map.setView([selectedSource.lat, selectedSource.lng], 13);
    } else if (selectedDest) {
      map.setView([selectedDest.lat, selectedDest.lng], 13);
    }
  }, [mapReady, selectedSource, selectedDest]);

  // Calculate route
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapInstanceRef.current) return;
    if (!selectedSource || !selectedDest) {
      setRouteDistance(null);
      setRouteDuration(null);
      if (routeLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      if (outlineLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(outlineLineRef.current);
        outlineLineRef.current = null;
      }
      return;
    }

    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (outlineLineRef.current) {
      map.removeLayer(outlineLineRef.current);
      outlineLineRef.current = null;
    }

    setCalculatingRoute(true);

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${selectedSource.lng},${selectedSource.lat};${selectedDest.lng},${selectedDest.lat}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [
            coord[1],
            coord[0],
          ]);

          outlineLineRef.current = L.polyline(coordinates, {
            color: '#ffffff',
            weight: 8,
            opacity: 0.6,
            lineJoin: 'round',
            lineCap: 'round',
          }).addTo(map);

          routeLineRef.current = L.polyline(coordinates, {
            color: '#ff4d00',
            weight: 6,
            opacity: 0.85,
            lineJoin: 'round',
            lineCap: 'round',
          }).addTo(map);

          const distKm = Math.round(route.distance / 1000);
          const durationMin = Math.round(route.duration / 60);
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;
          const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

          setRouteDistance(distKm);
          setRouteDuration(durationStr);
          setCalculatingRoute(false);

          if (onRouteSelected) {
            onRouteSelected(selectedSource.name, selectedDest.name, distKm);
          }

          const bounds = routeLineRef.current.getBounds();
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        } else {
          setCalculatingRoute(false);
        }
      })
      .catch((error) => {
        console.error('Route calculation failed:', error);
        setCalculatingRoute(false);
      });
  }, [mapReady, selectedSource, selectedDest, onRouteSelected]);

  const selectSource = (location: Location) => {
    setSelectedSource(location);
    setSourceText(location.name);
    setSourceSuggestions([]);
    setShowSourceDropdown(false);
  };

  const selectDest = (location: Location) => {
    setSelectedDest(location);
    setDestText(location.name);
    setDestSuggestions([]);
    setShowDestDropdown(false);
  };

  const clearRoute = () => {
    setSelectedSource(null);
    setSelectedDest(null);
    setSourceText('');
    setDestText('');
    setRouteDistance(null);
    setRouteDuration(null);

    if (mapInstanceRef.current) {
      if (sourceMarkerRef.current) {
        mapInstanceRef.current.removeLayer(sourceMarkerRef.current);
        sourceMarkerRef.current = null;
      }
      if (destMarkerRef.current) {
        mapInstanceRef.current.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      if (outlineLineRef.current) {
        mapInstanceRef.current.removeLayer(outlineLineRef.current);
        outlineLineRef.current = null;
      }
      mapInstanceRef.current.setView([20.5937, 78.9629], 5);
    }
  };

  // INLINE STYLES
  const containerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px'
  };

  const iconBoxStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(255, 77, 0, 0.12), rgba(255, 77, 0, 0.06))',
    borderRadius: '12px',
    fontSize: '1.5rem'
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1
  };

  const getInputStyle = (isSelected: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '16px 18px',
    fontSize: '1rem',
    color: '#1a1a1a',
    background: '#fafafa',
    border: isSelected ? '2px solid #10b981' : '2px solid #e5e5e5',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  });

  const loaderStyle: React.CSSProperties = {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.2rem'
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    maxHeight: '280px',
    overflowY: 'auto',
    zIndex: 1000
  };

  const dropdownItemStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: '0.95rem',
    color: '#1a1a1a',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'all 0.2s ease'
  };

  const routeInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05))',
    borderLeft: '4px solid #ff4d00',
    borderRadius: '10px'
  };

  const calculatingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    justifyContent: 'center',
    fontWeight: 600
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '0.813rem',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '1.375rem',
    fontWeight: 700,
    color: '#ff4d00',
    lineHeight: 1
  };

  const clearBtnStyle: React.CSSProperties = {
    padding: '10px 18px',
    background: '#ffffff',
    color: '#1a1a1a',
    border: '2px solid #dedede',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  };

  const mapContainerStyle: React.CSSProperties = {
    width: '100%',
    height: `${height}px`,
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #dedede',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    position: 'relative',
    background: '#f5f5f5'
  };

  const mapLoadingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '1rem',
    color: '#666',
    fontWeight: 600
  };

  return (
    <div style={containerStyle}>
      {/* Input Section */}
      <div style={cardStyle}>
        {/* Source Input */}
        <div style={inputGroupStyle}>
          <div style={iconBoxStyle}>📍</div>
          <div style={inputWrapperStyle}>
            <input
              type="text"
              style={getInputStyle(!!selectedSource)}
              placeholder="Enter pickup location (e.g., Mumbai, Andheri)"
              value={sourceText}
              onChange={(e) => {
                setSourceText(e.target.value);
                if (selectedSource) setSelectedSource(null);
              }}
              onFocus={() => {
                if (sourceSuggestions.length > 0) setShowSourceDropdown(true);
              }}
              autoComplete="off"
            />
            {searchingSource && <span style={loaderStyle}>🔍</span>}
            
            {/* Source Suggestions Dropdown */}
            {showSourceDropdown && sourceSuggestions.length > 0 && (
              <div style={dropdownStyle}>
                {sourceSuggestions.map((location, idx) => (
                  <div
                    key={idx}
                    style={dropdownItemStyle}
                    onClick={() => selectSource(location)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, rgba(255, 77, 0, 0.08), rgba(255, 77, 0, 0.03))';
                      e.currentTarget.style.color = '#ff4d00';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#1a1a1a';
                    }}
                  >
                    📍 {location.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Destination Input */}
        <div style={inputGroupStyle}>
          <div style={iconBoxStyle}>🎯</div>
          <div style={inputWrapperStyle}>
            <input
              type="text"
              style={getInputStyle(!!selectedDest)}
              placeholder="Enter delivery location (e.g., Delhi, Connaught Place)"
              value={destText}
              onChange={(e) => {
                setDestText(e.target.value);
                if (selectedDest) setSelectedDest(null);
              }}
              onFocus={() => {
                if (destSuggestions.length > 0) setShowDestDropdown(true);
              }}
              autoComplete="off"
            />
            {searchingDest && <span style={loaderStyle}>🔍</span>}
            
            {/* Destination Suggestions Dropdown */}
            {showDestDropdown && destSuggestions.length > 0 && (
              <div style={dropdownStyle}>
                {destSuggestions.map((location, idx) => (
                  <div
                    key={idx}
                    style={dropdownItemStyle}
                    onClick={() => selectDest(location)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, rgba(255, 77, 0, 0.08), rgba(255, 77, 0, 0.03))';
                      e.currentTarget.style.color = '#ff4d00';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#1a1a1a';
                    }}
                  >
                    🎯 {location.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Route Info */}
        {(calculatingRoute || routeDistance !== null) && (
          <div style={routeInfoStyle}>
            {calculatingRoute ? (
              <div style={calculatingStyle}>
                <span>🔄</span>
                <span>Calculating route...</span>
              </div>
            ) : (
              <>
                <div>
                  <div style={statLabelStyle}>Distance</div>
                  <div style={statValueStyle}>{routeDistance} km</div>
                </div>
                <div>
                  <div style={statLabelStyle}>Est. Time</div>
                  <div style={statValueStyle}>{routeDuration}</div>
                </div>
                <button type="button" style={clearBtnStyle} onClick={clearRoute}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff4d00';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#ff4d00';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#1a1a1a';
                    e.currentTarget.style.borderColor = '#dedede';
                  }}>
                  🗑️ Clear
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Map Section */}
      <div ref={mapContainerRef} style={mapContainerStyle}>
        {!mapReady && <div style={mapLoadingStyle}>Loading map...</div>}
      </div>
    </div>
  );
}
