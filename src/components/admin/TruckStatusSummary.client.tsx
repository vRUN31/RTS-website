"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface StatusCount {
  status: string;
  count: number;
}

const statusConfig = {
  running: { icon: '🚚', color: '#10b981', label: 'Running' },
  halt: { icon: '⏸️', color: '#f59e0b', label: 'Halt' },
  maintenance: { icon: '🔧', color: '#ef4444', label: 'Maintenance' },
  offline: { icon: '⚫', color: '#6b7280', label: 'Offline' },
  available: { icon: '✅', color: '#3b82f6', label: 'Available' },
};

export default function TruckStatusSummary() {
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [totalTrucks, setTotalTrucks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatusCounts();
  }, []);

  async function loadStatusCounts() {
    try {
      const supabase = createClient();
      
      // Get total truck count
      const { count: total } = await supabase
        .from('trucks')
        .select('id', { count: 'exact', head: true });
      
      setTotalTrucks(total || 0);

      // Get counts by status
      const counts: StatusCount[] = [];
      for (const status of Object.keys(statusConfig)) {
        const { count } = await supabase
          .from('trucks')
          .select('id', { count: 'exact', head: true })
          .eq('status', status);
        
        counts.push({ status, count: count || 0 });
      }

      setStatusCounts(counts);
    } catch (error) {
      console.error('Error loading status counts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        padding: '1.5rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading status...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.5rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
          Fleet Status Overview
        </h3>
        <Link
          href="/admin/fleet/status"
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #ff4d00 0%, #ff7033 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Manage Status →
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1rem',
      }}>
        {statusCounts.map(({ status, count }) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          if (!config) return null;

          const percentage = totalTrucks > 0 ? ((count / totalTrucks) * 100).toFixed(0) : 0;

          return (
            <div
              key={status}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                background: `${config.color}15`,
                border: `2px solid ${config.color}30`,
                textAlign: 'center',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${config.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {config.icon}
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                color: config.color,
                marginBottom: '0.25rem',
              }}>
                {count}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: '0.25rem',
              }}>
                {config.label}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#9ca3af',
              }}>
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '6px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>
          Total Fleet: <strong style={{ color: '#1f2937' }}>{totalTrucks}</strong> trucks
        </span>
      </div>
    </div>
  );
}
