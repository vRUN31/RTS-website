"use client";
import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

export type AdminAnalyticsProps = {
  shipmentsStatusCounts: Record<string, number>;
  shipmentsPerMonth: { labels: string[]; values: number[] };
  distancePerMonth: { labels: string[]; values: number[] };
  revenuePerMonth: { labels: string[]; values: number[] };
  trucksByStatus: Record<string, number>;
};

export default function AdminAnalytics(props: AdminAnalyticsProps) {
  const refs = {
    shipmentsByStatus: useRef<HTMLCanvasElement | null>(null),
    shipmentsPerMonth: useRef<HTMLCanvasElement | null>(null),
    distancePerMonth: useRef<HTMLCanvasElement | null>(null),
    revenuePerMonth: useRef<HTMLCanvasElement | null>(null),
    trucksByStatus: useRef<HTMLCanvasElement | null>(null),
  };

  function draw() {
    // @ts-ignore
    const Chart = (window as any).Chart as any;
    if (!Chart) return;

    const teardown = [] as any[];

    function makeChart(canvas: HTMLCanvasElement | null, cfg: any) {
      if (!canvas) return;
      // eslint-disable-next-line new-cap
      const inst = new Chart(canvas, cfg);
      teardown.push(() => inst?.destroy?.());
    }

    // Shipments by Status (Doughnut)
    const statusLabels = Object.keys(props.shipmentsStatusCounts);
    const statusValues = statusLabels.map((k) => props.shipmentsStatusCounts[k] ?? 0);
    makeChart(refs.shipmentsByStatus.current, {
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [{
          data: statusValues,
          backgroundColor: ['#ff4d00', '#0ea5e9', '#10b981', '#f59e0b', '#6b7280'],
          borderWidth: 0,
        }],
      },
      options: { plugins: { legend: { position: 'bottom' } } },
    });

    // Shipments per Month (Bar)
    makeChart(refs.shipmentsPerMonth.current, {
      type: 'bar',
      data: {
        labels: props.shipmentsPerMonth.labels,
        datasets: [{ label: 'Shipments', data: props.shipmentsPerMonth.values, backgroundColor: '#0ea5e9' }],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });

    // Distance per Month (Bar)
    makeChart(refs.distancePerMonth.current, {
      type: 'bar',
      data: {
        labels: props.distancePerMonth.labels,
        datasets: [{ label: 'Distance (km)', data: props.distancePerMonth.values, backgroundColor: '#10b981' }],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });

    // Revenue per Month (Line)
    makeChart(refs.revenuePerMonth.current, {
      type: 'line',
      data: {
        labels: props.revenuePerMonth.labels,
        datasets: [{ label: 'Revenue', data: props.revenuePerMonth.values, borderColor: '#ff4d00', backgroundColor: 'rgba(255,77,0,0.1)', tension: 0.3 }],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });

    // Trucks by Status (Pie)
    const truckStatusLabels = Object.keys(props.trucksByStatus);
    const truckStatusValues = truckStatusLabels.map((k) => props.trucksByStatus[k] ?? 0);
    makeChart(refs.trucksByStatus.current, {
      type: 'pie',
      data: {
        labels: truckStatusLabels,
        datasets: [{ data: truckStatusValues, backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6b7280'] }],
      },
      options: { plugins: { legend: { position: 'bottom' } } },
    });

    return () => { teardown.forEach((t) => t()); };
  }

  useEffect(() => {
    // If Chart.js already loaded, draw immediately
    if ((window as any).Chart) return draw();
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => draw()}
      />

      <section className="grid-3 mt-16">
        <div className="panel">
          <div className="panel-title">Shipments by Status</div>
          <canvas ref={refs.shipmentsByStatus} height={160} />
        </div>
        <div className="panel">
          <div className="panel-title">Shipments per Month</div>
          <canvas ref={refs.shipmentsPerMonth} height={160} />
        </div>
        <div className="panel">
          <div className="panel-title">Trucks by Status</div>
          <canvas ref={refs.trucksByStatus} height={160} />
        </div>
      </section>

      <section className="grid-2-1 mt-16">
        <div className="panel">
          <div className="panel-title">Distance Travelled (km)</div>
          <canvas ref={refs.distancePerMonth} height={180} />
        </div>
        <div className="panel">
          <div className="panel-title">Revenue (sum of cost)</div>
          <canvas ref={refs.revenuePerMonth} height={180} />
        </div>
      </section>
    </>
  );
}
