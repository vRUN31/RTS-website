"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export type TruckProfitLoss = {
  truck_id: string;
  truck_code: string;
  plate: string;
  total_revenue: number;
  total_cost: number;
  profit_loss: number;
  shipment_count: number;
};

export type AnalyticsData = {
  shipmentsStatusCounts: Record<string, number>;
  shipmentsPerMonth: { labels: string[]; values: number[] };
  distancePerMonth: { labels: string[]; values: number[] };
  revenuePerMonth: { labels: string[]; values: number[] };
  trucksByStatus: Record<string, number>;
  profitLoss?: { labels: string[]; values: number[] };
  truckProfitLoss?: TruckProfitLoss[];
  performanceSummary?: {
    total_trucks: number;
    profitable_trucks: number;
    loss_making_trucks: number;
    total_profit: number;
    total_loss: number;
    net_profit_loss: number;
  };
};

export function useAnalyticsData() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAnalytics() {
      try {
        // Fetch trucks by status (real-time)
        const { data: trucksData } = await supabase
          .from('trucks')
          .select('status')
          .not('status', 'is', null);

        const trucksByStatus = trucksData?.reduce((acc: Record<string, number>, curr) => {
          const status = curr.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}) || {};

        // Fetch shipments status counts (real-time)
        const { data: shipmentsData } = await supabase
          .from('shipments')
          .select('status')
          .not('status', 'is', null);

        const shipmentsStatusCounts = shipmentsData?.reduce((acc: Record<string, number>, curr) => {
          const status = curr.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}) || {};

        // Fetch shipments per month (last 12 months)
        const { data: monthlyStats } = await supabase.rpc('shipments_per_month');
        const shipmentsPerMonth = monthlyStats || { 
          labels: [], 
          values: [] 
        };

        // Fetch distance per month
        const { data: distanceStats } = await supabase.rpc('distance_per_month');
        const distancePerMonth = distanceStats || {
          labels: [],
          values: []
        };

        // Fetch revenue per month
        const { data: revenueStats } = await supabase.rpc('revenue_per_month');
        const revenuePerMonth = revenueStats || {
          labels: [],
          values: []
        };

        // Fetch profit/loss
        const { data: profitLossStats } = await supabase.rpc('profit_loss_by_month');
        const profitLoss = profitLossStats || {
          labels: [],
          values: []
        };

        // Fetch truck profit/loss
        const { data: truckProfitLossData } = await supabase.rpc('profit_loss_per_truck');
        const truckProfitLoss = (truckProfitLossData as TruckProfitLoss[]) || [];

        // Fetch performance summary
        const { data: summaryData } = await supabase.rpc('truck_performance_summary');
        const performanceSummary = summaryData?.[0] || null;

        setData({
          trucksByStatus,
          shipmentsStatusCounts,
          shipmentsPerMonth,
          distancePerMonth,
          revenuePerMonth,
          profitLoss,
          truckProfitLoss,
          performanceSummary
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    // Initial fetch
    fetchAnalytics();

    // Subscribe to trucks table changes
    const trucksSubscription = supabase
      .channel('trucks_status_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trucks' },
        () => fetchAnalytics()
      )
      .subscribe();

    // Subscribe to shipments table changes
    const shipmentsSubscription = supabase
      .channel('shipments_status_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        () => fetchAnalytics()
      )
      .subscribe();

    return () => {
      trucksSubscription.unsubscribe();
      shipmentsSubscription.unsubscribe();
    };
  }, []);

  return { data, loading, error };
}