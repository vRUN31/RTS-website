import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import AdminAnalytics from '@/src/components/admin/AdminAnalytics.client';
import AdminShell from '../_admin-shell.client';

export default async function AnalyticsPage() {
  // server side metrics collection
  const supabase = createServerSupabase(undefined as any);

  // Simple example metrics using Supabase RPCs or queries—fallbacks used if RPCs are not present
  async function safeRpc(name: string) {
    try {
      const { data } = await supabase.rpc(name);
      return data;
    } catch {
      return null;
    }
  }

  const shipmentsStatusCounts = (await safeRpc('shipments_status_counts')) ?? { pending: 10, approved: 5, rejected: 2, delivered: 25 };
  const shipmentsPerMonth = (await safeRpc('shipments_per_month')) ?? { labels: ['Jan','Feb','Mar'], values: [10,20,15] };
  const distancePerMonth = (await safeRpc('distance_per_month')) ?? { labels: ['Jan','Feb','Mar'], values: [1200,1500,1100] };
  const revenuePerMonth = (await safeRpc('revenue_per_month')) ?? { labels: ['Jan','Feb','Mar'], values: [12000,15000,11000] };
  const trucksByStatus = (await safeRpc('trucks_by_status')) ?? { Running: 8, Halt: 2, Maintenance: 1 };

  // Profit/Loss aggregation: compute sum(cost) - sum(operational_cost) grouped by month (or week/year)
  async function profitLossBy(grain: 'week'|'month'|'year') {
    try {
      if (grain === 'month') {
        const { data } = await supabase.rpc('profit_loss_by_month');
        return data;
      }
      if (grain === 'week') {
        const { data } = await supabase.rpc('profit_loss_by_week');
        return data;
      }
      const { data } = await supabase.rpc('profit_loss_by_year');
      return data;
    } catch {
      return null;
    }
  }

  const grain: 'week'|'month'|'year' = 'month';
  const profitLoss = (await profitLossBy(grain)) ?? { labels: ['Jan','Feb','Mar'], values: [2000, 1500, -300] };

  return (
    <AdminShell>
      <main style={{ padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>Analytics</h1>
        {/* @ts-ignore Server -> Client props passing */}
    <AdminAnalytics shipmentsStatusCounts={shipmentsStatusCounts} shipmentsPerMonth={shipmentsPerMonth} distancePerMonth={distancePerMonth} revenuePerMonth={revenuePerMonth} trucksByStatus={trucksByStatus} profitLoss={profitLoss} />
      </main>
    </AdminShell>
  );
}
