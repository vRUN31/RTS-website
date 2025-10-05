"use client";
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Contract = {
    id: string;
    client_id: string | null;
    start_at: string;
    end_at: string;
    lanes: any;
    base_rates: any;
    documents: any;
    created_at: string;
};

export default function ContractsPage() {
    const [rows, setRows] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    useEffect(() => {
        let isMounted = true;
        async function load() {
            setError(null);
            setLoading(true);
            try {
                if (!supabaseUrl || !supabaseAnonKey) {
                    // Demo placeholder
                    if (isMounted) setRows([]);
                } else {
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from('contracts')
                        .select('*')
                        .order('start_at', { ascending: false });
                    if (error) throw error;
                    if (isMounted) setRows(data as Contract[]);
                }
            } catch (e: any) {
                if (isMounted) setError(e?.message ?? 'Failed to load contracts');
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        load();
        return () => {
            isMounted = false;
        };
    }, [supabaseUrl, supabaseAnonKey]);

    const filtered = useMemo(() => {
        if (filter === 'all') return rows;
        const today = new Date().toISOString().slice(0, 10);
        return rows.filter(c =>
            filter === 'active'
                ? c.start_at <= today && today <= c.end_at
                : c.end_at < today
        );
    }, [rows, filter]);

        return (
            <main className="dashboard-container">
                <h1 className="dashboard-header">Contracts</h1>
                <div className="row-align row-gap-12 mt-16">
                    <label htmlFor="contractsFilter">Filter:</label>
                    <select id="contractsFilter" aria-label="Contracts filter" value={filter} onChange={e=>setFilter(e.target.value as any)}>
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                </select>
            </div>
            {loading && <div>Loading…</div>}
            {error && <div role="alert" className="text-dark">{error}</div>}
            {!loading && !error && filtered.length === 0 && (
                <p>
                    {supabaseUrl && supabaseAnonKey
                        ? 'No contracts found.'
                        : 'Supabase not configured. Add .env.local to see real contracts.'}
                </p>
            )}
            {filtered.length > 0 && (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Start</th>
                            <th>End</th>
                            <th>Client</th>
                            <th>Lanes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id}>
                                <td>{c.start_at}</td>
                                <td>{c.end_at}</td>
                                <td>{c.client_id ?? '—'}</td>
                                <td>{Array.isArray(c.lanes) ? c.lanes.length : (c.lanes ? '1+' : '—')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </main>
    );
}
