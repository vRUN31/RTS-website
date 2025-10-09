import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import AdminAnalytics from '@/src/components/admin/AdminAnalytics.client';

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

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>Analytics</h1>
      {/* @ts-ignore Server -> Client props passing */}
      <AdminAnalytics shipmentsStatusCounts={shipmentsStatusCounts} shipmentsPerMonth={shipmentsPerMonth} distancePerMonth={distancePerMonth} revenuePerMonth={revenuePerMonth} trucksByStatus={trucksByStatus} />
    </main>
  );
}
