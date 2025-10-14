"use client";
import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useAnalyticsData } from '@/src/hooks/useAnalyticsData';

export default function AdminAnalytics() {
  const { data, loading, error } = useAnalyticsData();
  const refs = {
    shipmentsByStatus: useRef<HTMLCanvasElement | null>(null),
    shipmentsPerMonth: useRef<HTMLCanvasElement | null>(null),
    distancePerMonth: useRef<HTMLCanvasElement | null>(null),
    revenuePerMonth: useRef<HTMLCanvasElement | null>(null),
    trucksByStatus: useRef<HTMLCanvasElement | null>(null),
    profitLoss: useRef<HTMLCanvasElement | null>(null),
    truckProfitLoss: useRef<HTMLCanvasElement | null>(null),
  };

  function draw() {
    if (!data) return;
    
    // @ts-ignore
    const Chart = (window as any).Chart as any;
    if (!Chart) return;

    const teardown = [] as any[];

    // Detect dark mode
    const isDark = document.documentElement.dataset.theme === 'dark';
    const textColor = isDark ? '#f8fafc' : '#333';
    const gridColor = isDark ? 'rgba(255, 140, 97, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    function makeChart(canvas: HTMLCanvasElement | null, cfg: any) {
      if (!canvas) return;
      
      // Apply dark mode defaults to chart options
      if (cfg.options) {
        cfg.options.plugins = cfg.options.plugins || {};
        cfg.options.plugins.legend = cfg.options.plugins.legend || {};
        cfg.options.plugins.legend.labels = cfg.options.plugins.legend.labels || {};
        cfg.options.plugins.legend.labels.color = textColor;
        
        if (cfg.options.scales) {
          Object.keys(cfg.options.scales).forEach((key) => {
            if (!cfg.options.scales[key]) cfg.options.scales[key] = {};
            cfg.options.scales[key].ticks = cfg.options.scales[key].ticks || {};
            cfg.options.scales[key].ticks.color = textColor;
            cfg.options.scales[key].grid = cfg.options.scales[key].grid || {};
            cfg.options.scales[key].grid.color = gridColor;
          });
        }
      }
      
      // eslint-disable-next-line new-cap
      const inst = new Chart(canvas, cfg);
      teardown.push(() => inst?.destroy?.());
    }

    // Shipments by Status (Doughnut)
    const statusLabels = Object.keys(data.shipmentsStatusCounts);
    const statusValues = statusLabels.map((k) => data.shipmentsStatusCounts[k] ?? 0);
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
        labels: data.shipmentsPerMonth.labels,
        datasets: [{ label: 'Shipments', data: data.shipmentsPerMonth.values, backgroundColor: '#0ea5e9' }],
      },
      options: { responsive: true, scales: { x: {}, y: { beginAtZero: true } } },
    });

    // Distance per Month (Bar)
    makeChart(refs.distancePerMonth.current, {
      type: 'bar',
      data: {
        labels: data.distancePerMonth.labels,
        datasets: [{ label: 'Distance (km)', data: data.distancePerMonth.values, backgroundColor: '#10b981' }],
      },
      options: { responsive: true, scales: { x: {}, y: { beginAtZero: true } } },
    });

    // Revenue per Month (Line)
    makeChart(refs.revenuePerMonth.current, {
      type: 'line',
      data: {
        labels: data.revenuePerMonth.labels,
        datasets: [{ label: 'Revenue', data: data.revenuePerMonth.values, borderColor: '#ff4d00', backgroundColor: 'rgba(255,77,0,0.1)', tension: 0.3 }],
      },
      options: { responsive: true, scales: { x: {}, y: { beginAtZero: true } } },
    });

    // Trucks by Status (Pie)
    const truckStatusLabels = Object.keys(data.trucksByStatus);
    const truckStatusValues = truckStatusLabels.map((k) => data.trucksByStatus[k] ?? 0);
    makeChart(refs.trucksByStatus.current, {
      type: 'pie',
      data: {
        labels: truckStatusLabels,
        datasets: [{ data: truckStatusValues, backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6b7280'] }],
      },
      options: { plugins: { legend: { position: 'bottom' } } },
    });

    // Profit / Loss (Line)
    if (data.profitLoss) {
      makeChart(refs.profitLoss.current, {
        type: 'line',
        data: {
          labels: data.profitLoss.labels,
          datasets: [{ label: 'Profit / Loss', data: data.profitLoss.values, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.08)', tension: 0.3 }],
        },
        options: { responsive: true, scales: { x: {}, y: { beginAtZero: false } } },
      });
    }

    // Truck Profit/Loss (Bar - Horizontal)
    if (data.truckProfitLoss && data.truckProfitLoss.length > 0) {
      const sortedTrucks = [...data.truckProfitLoss].sort((a, b) => b.profit_loss - a.profit_loss);
      const truckLabels = sortedTrucks.map(t => t.truck_code || t.plate);
      const truckProfitValues = sortedTrucks.map(t => t.profit_loss);
      
      makeChart(refs.truckProfitLoss.current, {
        type: 'bar',
        data: {
          labels: truckLabels,
          datasets: [{
            label: 'Profit/Loss per Truck',
            data: truckProfitValues,
            backgroundColor: truckProfitValues.map(v => v >= 0 ? '#10b981' : '#ef4444'),
            borderWidth: 0,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return '₹' + value.toLocaleString();
                }
              }
            },
            y: {}
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const truck = sortedTrucks[context.dataIndex];
                  return [
                    `Profit/Loss: ₹${context.parsed.x.toLocaleString()}`,
                    `Revenue: ₹${truck.total_revenue.toLocaleString()}`,
                    `Cost: ₹${truck.total_cost.toLocaleString()}`,
                    `Shipments: ${truck.shipment_count}`
                  ];
                }
              }
            }
          }
        },
      });
    }

    return () => { teardown.forEach((t) => t()); };
  }

  useEffect(() => {
    // If Chart.js already loaded and we have data, draw
    if ((window as any).Chart && data) return draw();
  }, [data]); // Redraw when data updates

  if (error) {
    return (
      <div className="alert alert-error">
        Error loading analytics data: {String(error)}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

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

      <section className="grid-1 mt-16">
        <div className="panel">
          <div className="panel-title">Profit / Loss</div>
          <canvas ref={refs.profitLoss} height={160} />
        </div>
      </section>

      {/* Performance Summary Cards */}
      {data?.performanceSummary && (
        <section className="grid-4 mt-16">
          <div className="stat-card stat-card-primary">
            <div className="stat-icon">🚚</div>
            <div className="stat-content">
              <div className="stat-value">{data.performanceSummary.total_trucks}</div>
              <div className="stat-label">Total Trucks</div>
            </div>
          </div>
          <div className="stat-card stat-card-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{data.performanceSummary.profitable_trucks}</div>
              <div className="stat-label">Profitable</div>
            </div>
          </div>
          <div className="stat-card stat-card-danger">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value">{data.performanceSummary.loss_making_trucks}</div>
              <div className="stat-label">Loss Making</div>
            </div>
          </div>
          <div className="stat-card stat-card-info">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">
                ₹{(data.performanceSummary.net_profit_loss / 1000).toFixed(1)}K
              </div>
              <div className="stat-label">Net Profit/Loss</div>
            </div>
          </div>
        </section>
      )}

      {/* Truck Profit/Loss Chart */}
      <section className="grid-1 mt-16">
        <div className="panel">
          <div className="panel-title">Profit/Loss Per Truck</div>
          <div style={{ height: '400px' }}>
            <canvas ref={refs.truckProfitLoss} />
          </div>
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
