"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// Defer Leaflet import to client to avoid SSR issues
type LeafletNS = typeof import('leaflet');

export type LeafletMapProps = {
  mode: 'admin' | 'client';
  clientId?: string | null;
  height?: number | string; // default 300
};

type Truck = {
  id: string;
  plate: string | null;
  model?: string | null;
  status?: string | null;
  last_lat: number | null;
  last_lng: number | null;
  speed: number | null;
  last_updated: string | null;
};

export default function LeafletMap({ mode, clientId, height = 300 }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<LeafletNS | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map()); // truck_id -> marker
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Initialize Leaflet map client-side
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

  // Load initial trucks (admin: all; client: trucks tied to client's active shipments)
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    async function loadInitial() {
      try {
        // If env not configured, just skip
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;

        let trucks: Truck[] = [];
        if (mode === 'admin') {
          const { data, error } = await supabase
            .from('trucks')
            .select('id, plate, status, last_lat, last_lng, speed, last_updated')
            .limit(500);
          if (error) throw error;
          trucks = (data ?? []) as Truck[];
        } else {
          // client mode: fetch shipments for client and join trucks by truck_id not null
          if (!clientId) return;
          // Step 1: get shipment truck_ids (no implicit FK join required)
          const { data: shipRows, error: shipErr } = await supabase
            .from('shipments')
            .select('truck_id')
            .eq('client_id', clientId)
            .not('truck_id', 'is', null)
            .limit(500);
          if (shipErr) throw shipErr;
          const ids = Array.from(new Set((shipRows ?? [])
            .map((r: any) => r.truck_id)
            .filter(Boolean)));
          if (ids.length) {
            const { data: trucksRows, error: trucksErr } = await supabase
              .from('trucks')
              .select('id, plate, status, last_lat, last_lng, speed, last_updated')
              .in('id', ids)
              .limit(500);
            if (trucksErr) throw trucksErr;
            trucks = (trucksRows ?? []) as Truck[];
          } else {
            trucks = [];
          }
        }

        if (cancelled) return;
        placeOrUpdateMarkers(trucks);
      } catch (e: any) {
        // Better diagnostics for Supabase errors or unexpected failures
        try {
          console.error('LeafletMap loadInitial error:', e?.message || e, e?.details || e?.hint || '');
        } catch {
          console.error(e);
        }
      }
    }
    loadInitial();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, clientId]);

  // Subscribe to telemetry updates and move markers
  useEffect(() => {
    if (!ready) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    // Telemetry table: expect rows with truck_id, lat, lng, speed, ts
    const channel = supabase
      .channel('telemetry-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry' },
        (payload) => {
          const row: any = payload.new;
          const truckId: string | undefined = row?.truck_id;
          if (!truckId) return;
          const t: Truck = {
            id: truckId,
            plate: null,
            last_lat: Number(row?.lat) || null,
            last_lng: Number(row?.lng) || null,
            speed: Number(row?.speed) || null,
            last_updated: row?.ts ?? null,
            status: row?.status ?? null,
          } as any;
          // In client mode, ignore updates for trucks not visible
          if (mode === 'client' && !markersRef.current.has(truckId)) return;
          placeOrUpdateMarkers([t]);
        }
      )
      .subscribe((status) => {
        // console.log('telemetry channel', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode]);

  function placeOrUpdateMarkers(trucks: Truck[]) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const bounds = L.latLngBounds([]);
    trucks.forEach((t) => {
      if (typeof t.last_lat !== 'number' || typeof t.last_lng !== 'number') return;
      let marker = markersRef.current.get(t.id);
      const pos = L.latLng(t.last_lat, t.last_lng);
      const popup = buildPopup(t);
      if (!marker) {
        marker = L.marker(pos).addTo(map);
        markersRef.current.set(t.id, marker);
      } else {
        marker.setLatLng(pos);
      }
      marker.bindPopup(popup);
      bounds.extend(pos);
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  }

  function buildPopup(t: Truck) {
    if (mode === 'admin') {
      return `
        <div>
          <strong>${t.plate ?? 'Truck'}</strong><br/>
          Status: ${t.status ?? '—'}<br/>
          Speed: ${typeof t.speed === 'number' ? `${t.speed} km/h` : '—'}<br/>
          Updated: ${t.last_updated ?? '—'}<br/>
          <details style="margin-top:6px"><summary>More info</summary>
            <div>Truck ID: ${t.id}</div>
          </details>
        </div>
      `;
    }
    // client mode: limited info
    return `
      <div>
        <strong>${t.plate ?? 'Truck'}</strong><br/>
        Location: ${
          typeof t.last_lat === 'number' && typeof t.last_lng === 'number'
            ? `${t.last_lat.toFixed(4)}, ${t.last_lng.toFixed(4)}`
            : '—'
        }
      </div>
    `;
  }

  const heightClass = typeof height === 'number'
    ? height >= 420
      ? 'h-420px'
      : height >= 300
        ? 'h-300px'
        : 'h-250px'
    : 'h-300px';
  return (
    <div
      ref={containerRef}
      className={`map-container ${heightClass}`}
      aria-label={mode === 'admin' ? 'Live Fleet Map' : 'Package Live Location Map'}
    >
      {!ready && !error && <div className="p-12">Loading map…</div>}
      {error && <div role="alert" className="p-12">Map error: {error}</div>}
    </div>
  );
}
