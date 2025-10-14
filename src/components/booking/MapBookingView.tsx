"use client";

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface RouteData {
  distance: number;
  duration: number;
  geometry: [number, number][];
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: any;
}

interface MapBookingViewProps {
  sourceLocation: LocationData | null;
  destLocation: LocationData | null;
  route: RouteData | null;
  onSourceSelect: (location: LocationData | null) => void;
  onDestSelect: (location: LocationData | null) => void;
  mapError: string | null;
  setMapError: (error: string | null) => void;
}

// Using OpenStreetMap Nominatim - no API key required
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export default function MapBookingView({
  sourceLocation,
  destLocation,
  route,
  onSourceSelect,
  onDestSelect,
  mapError,
  setMapError
}: MapBookingViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const sourceMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [sourceQuery, setSourceQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [sourceSuggestions, setSourceSuggestions] = useState<Suggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // Center of India
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update source marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (sourceMarkerRef.current) {
      mapRef.current.removeLayer(sourceMarkerRef.current);
      sourceMarkerRef.current = null;
    }

    if (sourceLocation) {
      const marker = L.marker([parseFloat(sourceLocation.lat), parseFloat(sourceLocation.lon)], {
        title: 'Source',
      }).addTo(mapRef.current);

      marker.bindPopup(`<strong>Source:</strong><br/>${sourceLocation.display_name}`);
      sourceMarkerRef.current = marker;

      // Fit bounds if both locations exist
      if (destLocation) {
        const bounds = L.latLngBounds(
          [parseFloat(sourceLocation.lat), parseFloat(sourceLocation.lon)],
          [parseFloat(destLocation.lat), parseFloat(destLocation.lon)]
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapRef.current.setView([parseFloat(sourceLocation.lat), parseFloat(sourceLocation.lon)], 13);
      }
    }
  }, [sourceLocation, destLocation]);

  // Update destination marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (destMarkerRef.current) {
      mapRef.current.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    if (destLocation) {
      const marker = L.marker([parseFloat(destLocation.lat), parseFloat(destLocation.lon)], {
        title: 'Destination',
      }).addTo(mapRef.current);

      marker.bindPopup(`<strong>Destination:</strong><br/>${destLocation.display_name}`);
      destMarkerRef.current = marker;

      // Fit bounds if both locations exist
      if (sourceLocation) {
        const bounds = L.latLngBounds(
          [parseFloat(sourceLocation.lat), parseFloat(sourceLocation.lon)],
          [parseFloat(destLocation.lat), parseFloat(destLocation.lon)]
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapRef.current.setView([parseFloat(destLocation.lat), parseFloat(destLocation.lon)], 13);
      }
    }
  }, [destLocation, sourceLocation]);

  // Update route
  useEffect(() => {
    if (!mapRef.current) return;

    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (route && route.geometry && route.geometry.length > 0) {
      const latLngs: L.LatLngExpression[] = route.geometry.map(coord => [coord[1], coord[0]]);
      
      const polyline = L.polyline(latLngs, {
        color: '#ff4d00',
        weight: 4,
        opacity: 0.8,
      }).addTo(mapRef.current);

      routeLayerRef.current = polyline;
    }
  }, [route]);

  // Fetch suggestions from OpenStreetMap Nominatim (no API key needed)
  const fetchSuggestions = async (query: string, isSource: boolean) => {
    if (query.length < 3) {
      isSource ? setSourceSuggestions([]) : setDestSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    setMapError(null);

    try {
      // Nominatim API - respect usage policy with User-Agent and rate limiting
      const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&countrycodes=in&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RTS-Website-Booking-Form/1.0' // Required by Nominatim usage policy
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      isSource ? setSourceSuggestions(data) : setDestSuggestions(data);
    } catch (error) {
      console.error('Geocoding error:', error);
      setMapError('Failed to fetch location suggestions. Please try again.');
      isSource ? setSourceSuggestions([]) : setDestSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounced search with 1 second delay (Nominatim usage policy)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceQuery) {
        fetchSuggestions(sourceQuery, true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [sourceQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destQuery) {
        fetchSuggestions(destQuery, false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [destQuery]);

  return (
    <div style={{ width: '100%' }}>
      {/* Search Inputs */}
      <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Source Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Search source location..."
            value={sourceQuery}
            onChange={(e) => setSourceQuery(e.target.value)}
            className="filter-input"
            style={{ 
              paddingRight: sourceLocation ? '40px' : '12px',
              borderColor: sourceLocation ? '#4caf50' : 'var(--border, #e5e5e5)',
            }}
          />
          {sourceLocation && (
            <button
              type="button"
              onClick={() => {
                onSourceSelect(null);
                setSourceQuery('');
                setSourceSuggestions([]);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ef5350',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
          {sourceSuggestions.length > 0 && !sourceLocation && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--card, white)',
              border: '1px solid var(--border, #e5e5e5)',
              borderRadius: '8px',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {sourceSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => {
                    onSourceSelect(suggestion);
                    setSourceQuery('');
                    setSourceSuggestions([]);
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: index < sourceSuggestions.length - 1 ? '1px solid var(--border, #f0f0f0)' : 'none',
                    fontSize: '0.875rem',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover, #f5f5f5)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  📍 {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Destination Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Search destination location..."
            value={destQuery}
            onChange={(e) => setDestQuery(e.target.value)}
            className="filter-input"
            style={{ 
              paddingRight: destLocation ? '40px' : '12px',
              borderColor: destLocation ? '#4caf50' : 'var(--border, #e5e5e5)',
            }}
          />
          {destLocation && (
            <button
              type="button"
              onClick={() => {
                onDestSelect(null);
                setDestQuery('');
                setDestSuggestions([]);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ef5350',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
          {destSuggestions.length > 0 && !destLocation && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--card, white)',
              border: '1px solid var(--border, #e5e5e5)',
              borderRadius: '8px',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {destSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => {
                    onDestSelect(suggestion);
                    setDestQuery('');
                    setDestSuggestions([]);
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: index < destSuggestions.length - 1 ? '1px solid var(--border, #f0f0f0)' : 'none',
                    fontSize: '0.875rem',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover, #f5f5f5)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  📍 {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '12px',
          border: '2px solid var(--border, #e5e5e5)',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      />

      {/* Map Error */}
      {mapError && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '6px',
          color: '#856404',
          fontSize: '0.875rem',
        }}>
          ⚠️ {mapError}
        </div>
      )}

      {/* Instructions */}
      {!sourceLocation && !destLocation && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#0d47a1',
        }}>
          💡 <strong>Tip:</strong> Type at least 3 characters in the search boxes to see location suggestions. Click on a suggestion to select it on the map.
        </div>
      )}
    </div>
  );
}
