"use client";
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ThemeToggle from '@/src/components/ThemeToggle.client';
import './contracts.css';

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

type Client = {
    id: string;
    name: string;
};

export default function ContractsPage() {
    const [rows, setRows] = useState<Contract[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [role, setRole] = useState<'admin' | 'client' | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newContract, setNewContract] = useState({
        client_name: '',
        client_company: '',
        client_email: '',
        client_phone: '',
        start_at: '',
        end_at: '',
        description: '',
        contract_type: '',
        payment_terms: '',
        billing_cycle: '',
        rate_per_km: '',
        value: '',
        routes: '',
        vehicle_types: '',
        frequency: '',
        additional_services: '',
        penalty_clause: '',
        renewal_terms: '',
    });
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
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user?.id) {
                            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
                            if (isMounted) setRole((profile as any)?.role ?? null);
                        }
                    } catch { /* ignore role lookup errors */ }
                    
                    // Load clients for dropdown
                    const { data: clientsData } = await supabase.from('clients').select('id, name').order('name');
                    if (isMounted && clientsData) setClients(clientsData);
                    
                    let query = supabase
                        .from('contracts')
                        .select('*')
                        .order('start_at', { ascending: false });
                    const today = new Date().toISOString().slice(0,10);
                    if (filter === 'active') {
                        query = query.lte('start_at', today).gte('end_at', today);
                    } else if (filter === 'expired') {
                        query = query.lt('end_at', today);
                    }
                    const { data, error } = await query;
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
    }, [supabaseUrl, supabaseAnonKey, filter]);

    const filtered = rows; // server-filtered above

    const stats = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return {
            total: rows.length,
            active: rows.filter(c => c.start_at <= today && c.end_at >= today).length,
            expired: rows.filter(c => c.end_at < today).length,
            upcoming: rows.filter(c => c.start_at > today).length
        };
    }, [rows]);

    async function handleCreateContract(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        setError(null);
        setSuccess(null);
        
        try {
            if (!supabaseUrl || !supabaseAnonKey) throw new Error('Configure Supabase to create contracts');
            const supabase = createClient();
            
            // First, check if client exists by email or create new client
            let clientId = null;
            
            if (newContract.client_email) {
                const { data: existingClient } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('email', newContract.client_email)
                    .single();

                if (existingClient) {
                    clientId = existingClient.id;
                } else {
                    // Create new client
                    const { data: newClient, error: clientError } = await supabase
                        .from('clients')
                        .insert({
                            name: newContract.client_name,
                            email: newContract.client_email,
                            phone: newContract.client_phone || null,
                            company: newContract.client_company || null,
                        })
                        .select('id')
                        .single();

                    if (clientError) throw clientError;
                    clientId = newClient.id;
                }
            }
            
            const { error } = await supabase
                .from('contracts')
                .insert({ 
                    client_id: clientId,
                    start_at: newContract.start_at, 
                    end_at: newContract.end_at,
                    // Store extended data in lanes/base_rates as JSON for now
                    lanes: {
                        contract_type: newContract.contract_type,
                        routes: newContract.routes,
                        vehicle_types: newContract.vehicle_types,
                        frequency: newContract.frequency,
                        additional_services: newContract.additional_services,
                    },
                    base_rates: {
                        value: newContract.value ? parseFloat(newContract.value) : null,
                        rate_per_km: newContract.rate_per_km ? parseFloat(newContract.rate_per_km) : null,
                        payment_terms: newContract.payment_terms,
                        billing_cycle: newContract.billing_cycle,
                    },
                    documents: {
                        description: newContract.description,
                        penalty_clause: newContract.penalty_clause,
                        renewal_terms: newContract.renewal_terms,
                    }
                });
            
            if (error) throw error;
            
            setSuccess('✅ Contract created successfully! ' + (clientId ? 'Client profile updated.' : ''));
            setShowCreate(false);
            setNewContract({
                client_name: '',
                client_company: '',
                client_email: '',
                client_phone: '',
                start_at: '',
                end_at: '',
                description: '',
                contract_type: '',
                payment_terms: '',
                billing_cycle: '',
                rate_per_km: '',
                value: '',
                routes: '',
                vehicle_types: '',
                frequency: '',
                additional_services: '',
                penalty_clause: '',
                renewal_terms: '',
            });
            
            // reload
            const { data } = await supabase
                .from('contracts')
                .select('*')
                .order('start_at', { ascending: false });
            setRows(data as Contract[]);
            
            setTimeout(() => setSuccess(null), 5000);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to create contract');
        } finally {
            setCreating(false);
        }
    }

    function getContractStatus(contract: Contract) {
        const today = new Date().toISOString().slice(0, 10);
        if (contract.start_at > today) return 'upcoming';
        if (contract.end_at < today) return 'expired';
        return 'active';
    }

    function getClientName(clientId: string | null) {
        if (!clientId) return '—';
        const client = clients.find(c => c.id === clientId);
        return client?.name || `ID: ${clientId.slice(0, 8)}...`;
    }

        return (
            <>
                <ThemeToggle />
                <main className="contracts-container">
                    <div className="contracts-header">
                        <h1>📋 Contracts Management</h1>
                        <p className="contracts-subtitle">Manage and track all your business contracts</p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="contracts-stats">
                        <div className="stat-card stat-total">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Total Contracts</div>
                            </div>
                        </div>
                        <div className="stat-card stat-active">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.active}</div>
                                <div className="stat-label">Active</div>
                            </div>
                        </div>
                        <div className="stat-card stat-upcoming">
                            <div className="stat-icon">⏳</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.upcoming}</div>
                                <div className="stat-label">Upcoming</div>
                            </div>
                        </div>
                        <div className="stat-card stat-expired">
                            <div className="stat-icon">⏰</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.expired}</div>
                                <div className="stat-label">Expired</div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="controls-bar">
                        <div className="filter-group">
                            <label htmlFor="contractsFilter" className="filter-label">
                                🔍 Filter:
                            </label>
                            <select 
                                id="contractsFilter" 
                                className="filter-select" 
                                value={filter} 
                                onChange={e => setFilter(e.target.value as any)}
                            >
                                <option value="all">All Contracts</option>
                                <option value="active">✅ Active Only</option>
                                <option value="expired">⏰ Expired Only</option>
                            </select>
                        </div>
                        
                        {role === 'admin' && (
                            <button 
                                className="btn-create-contract"
                                onClick={() => {
                                    setShowCreate(!showCreate);
                                    setError(null);
                                    setSuccess(null);
                                }}
                            >
                                {showCreate ? '✖ Close Form' : '➕ Create New Contract'}
                            </button>
                        )}
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="alert-success">
                            {success}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="alert-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Create Contract Form */}
                    {showCreate && role === 'admin' && (
                        <div className="create-contract-panel">
                            <div className="panel-header">
                                <h3>📝 Create New Contract</h3>
                                <p>Fill in the comprehensive contract details below</p>
                            </div>
                            <form className="contract-form" onSubmit={handleCreateContract}>
                                {/* Client Information Section */}
                                <div className="form-section">
                                    <h4 className="section-title">👥 Client Information</h4>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label htmlFor="client_name">
                                                👤 Client Name <span className="required">*</span>
                                            </label>
                                            <input
                                                id="client_name"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g., John Doe"
                                                value={newContract.client_name}
                                                onChange={(e) => setNewContract({ ...newContract, client_name: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="client_company">
                                                🏢 Company Name <span className="required">*</span>
                                            </label>
                                            <input
                                                id="client_company"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g., ABC Logistics Ltd."
                                                value={newContract.client_company}
                                                onChange={(e) => setNewContract({ ...newContract, client_company: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="client_email">
                                                📧 Email Address <span className="required">*</span>
                                            </label>
                                            <input
                                                id="client_email"
                                                type="email"
                                                className="form-input"
                                                placeholder="client@company.com"
                                                value={newContract.client_email}
                                                onChange={(e) => setNewContract({ ...newContract, client_email: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="client_phone">
                                                📞 Phone Number <span className="optional">(optional)</span>
                                            </label>
                                            <input
                                                id="client_phone"
                                                type="tel"
                                                className="form-input"
                                                placeholder="+91 98765 43210"
                                                value={newContract.client_phone}
                                                onChange={(e) => setNewContract({ ...newContract, client_phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Details Section */}
                                <div className="form-section">
                                    <h4 className="section-title">📋 Contract Details</h4>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label htmlFor="contract_type">
                                                📑 Contract Type <span className="required">*</span>
                                            </label>
                                            <select
                                                id="contract_type"
                                                className="form-select"
                                                value={newContract.contract_type}
                                                onChange={(e) => setNewContract({ ...newContract, contract_type: e.target.value })}
                                                required
                                            >
                                                <option value="">Select contract type</option>
                                                <option value="Fixed Term">Fixed Term</option>
                                                <option value="Ongoing">Ongoing</option>
                                                <option value="Project-Based">Project-Based</option>
                                                <option value="Seasonal">Seasonal</option>
                                                <option value="Dedicated Fleet">Dedicated Fleet</option>
                                            </select>
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="start_date">
                                                📅 Start Date <span className="required">*</span>
                                            </label>
                                            <input
                                                id="start_date"
                                                type="date"
                                                className="form-input"
                                                value={newContract.start_at}
                                                onChange={(e) => setNewContract({ ...newContract, start_at: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="end_date">
                                                📅 End Date <span className="required">*</span>
                                            </label>
                                            <input
                                                id="end_date"
                                                type="date"
                                                className="form-input"
                                                value={newContract.end_at}
                                                onChange={(e) => setNewContract({ ...newContract, end_at: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="frequency">
                                                🔄 Service Frequency <span className="required">*</span>
                                            </label>
                                            <select
                                                id="frequency"
                                                className="form-select"
                                                value={newContract.frequency}
                                                onChange={(e) => setNewContract({ ...newContract, frequency: e.target.value })}
                                                required
                                            >
                                                <option value="">Select frequency</option>
                                                <option value="Daily">Daily</option>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Bi-Weekly">Bi-Weekly</option>
                                                <option value="Monthly">Monthly</option>
                                                <option value="On-Demand">On-Demand</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Terms Section */}
                                <div className="form-section">
                                    <h4 className="section-title">💰 Financial Terms</h4>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label htmlFor="value">
                                                💵 Total Contract Value <span className="required">*</span>
                                            </label>
                                            <input
                                                id="value"
                                                type="number"
                                                className="form-input"
                                                placeholder="e.g., 500000"
                                                value={newContract.value}
                                                onChange={(e) => setNewContract({ ...newContract, value: e.target.value })}
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="rate_per_km">
                                                🚗 Rate per KM <span className="optional">(optional)</span>
                                            </label>
                                            <input
                                                id="rate_per_km"
                                                type="number"
                                                className="form-input"
                                                placeholder="e.g., 25.50"
                                                value={newContract.rate_per_km}
                                                onChange={(e) => setNewContract({ ...newContract, rate_per_km: e.target.value })}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="payment_terms">
                                                💳 Payment Terms <span className="required">*</span>
                                            </label>
                                            <select
                                                id="payment_terms"
                                                className="form-select"
                                                value={newContract.payment_terms}
                                                onChange={(e) => setNewContract({ ...newContract, payment_terms: e.target.value })}
                                                required
                                            >
                                                <option value="">Select payment terms</option>
                                                <option value="Net 15">Net 15 Days</option>
                                                <option value="Net 30">Net 30 Days</option>
                                                <option value="Net 45">Net 45 Days</option>
                                                <option value="Net 60">Net 60 Days</option>
                                                <option value="Advance">Advance Payment</option>
                                                <option value="50% Advance">50% Advance, 50% On Completion</option>
                                            </select>
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="billing_cycle">
                                                📊 Billing Cycle <span className="required">*</span>
                                            </label>
                                            <select
                                                id="billing_cycle"
                                                className="form-select"
                                                value={newContract.billing_cycle}
                                                onChange={(e) => setNewContract({ ...newContract, billing_cycle: e.target.value })}
                                                required
                                            >
                                                <option value="">Select billing cycle</option>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Bi-Weekly">Bi-Weekly</option>
                                                <option value="Monthly">Monthly</option>
                                                <option value="Quarterly">Quarterly</option>
                                                <option value="Per Shipment">Per Shipment</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Specifications Section */}
                                <div className="form-section">
                                    <h4 className="section-title">🚚 Service Specifications</h4>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label htmlFor="routes">
                                                🛣️ Routes Covered <span className="required">*</span>
                                            </label>
                                            <input
                                                id="routes"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g., Mumbai-Delhi, Delhi-Bangalore"
                                                value={newContract.routes}
                                                onChange={(e) => setNewContract({ ...newContract, routes: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="vehicle_types">
                                                🚛 Vehicle Types <span className="required">*</span>
                                            </label>
                                            <input
                                                id="vehicle_types"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g., Truck (9T), Trailer (25T)"
                                                value={newContract.vehicle_types}
                                                onChange={(e) => setNewContract({ ...newContract, vehicle_types: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-field form-field-full">
                                            <label htmlFor="additional_services">
                                                ➕ Additional Services <span className="optional">(optional)</span>
                                            </label>
                                            <input
                                                id="additional_services"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g., Loading/Unloading, Insurance, Warehousing"
                                                value={newContract.additional_services}
                                                onChange={(e) => setNewContract({ ...newContract, additional_services: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Legal Terms Section */}
                                <div className="form-section">
                                    <h4 className="section-title">⚖️ Legal Terms</h4>
                                    <div className="form-field">
                                        <label htmlFor="penalty_clause">
                                            ⚠️ Penalty Clause <span className="optional">(optional)</span>
                                        </label>
                                        <textarea
                                            id="penalty_clause"
                                            className="form-input"
                                            rows={3}
                                            placeholder="e.g., Late delivery penalty: ₹1000 per day or 2% of shipment value"
                                            value={newContract.penalty_clause}
                                            onChange={(e) => setNewContract({ ...newContract, penalty_clause: e.target.value })}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="renewal_terms">
                                            🔄 Renewal Terms <span className="optional">(optional)</span>
                                        </label>
                                        <textarea
                                            id="renewal_terms"
                                            className="form-input"
                                            rows={3}
                                            placeholder="e.g., Auto-renewal with 30 days notice, Rate review every 6 months"
                                            value={newContract.renewal_terms}
                                            onChange={(e) => setNewContract({ ...newContract, renewal_terms: e.target.value })}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="description">
                                            📝 Additional Terms & Conditions <span className="optional">(optional)</span>
                                        </label>
                                        <textarea
                                            id="description"
                                            className="form-input"
                                            rows={4}
                                            placeholder="Enter any additional contract terms, special conditions, SLA requirements, etc."
                                            value={newContract.description}
                                            onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button 
                                        type="submit" 
                                        className="btn-submit"
                                        disabled={creating}
                                    >
                                        {creating ? (
                                            <>⏳ Creating...</>
                                        ) : (
                                            <>💾 Create Contract</>
                                        )}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-cancel"
                                        onClick={() => {
                                            setShowCreate(false);
                                            setNewContract({
                                                client_name: '',
                                                client_company: '',
                                                client_email: '',
                                                client_phone: '',
                                                start_at: '',
                                                end_at: '',
                                                description: '',
                                                contract_type: '',
                                                payment_terms: '',
                                                billing_cycle: '',
                                                rate_per_km: '',
                                                value: '',
                                                routes: '',
                                                vehicle_types: '',
                                                frequency: '',
                                                additional_services: '',
                                                penalty_clause: '',
                                                renewal_terms: '',
                                            });
                                        }}
                                    >
                                        ✖ Cancel
                                    </button>
                                </div>

                                <div className="form-note">
                                    💡 <strong>Pro Tip:</strong> If the client email already exists in the system, their profile will be updated. Otherwise, a new client profile will be created automatically.
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Non-admin message */}
                    {role !== 'admin' && !showCreate && (
                        <div className="info-panel">
                            <div className="info-icon">ℹ️</div>
                            <div className="info-content">
                                <h4>Contract Management</h4>
                                <p>Contracts are managed by administrators. If you need a new contract or have questions about existing contracts, please contact support or your account manager.</p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading contracts...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && filtered.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <h3>No contracts found</h3>
                            <p>
                                {supabaseUrl && supabaseAnonKey
                                    ? filter !== 'all' 
                                        ? 'Try changing the filter to see more contracts.'
                                        : role === 'admin' 
                                            ? 'Get started by creating your first contract.' 
                                            : 'No contracts available yet.'
                                    : 'Supabase not configured. Add .env.local to see real contracts.'}
                            </p>
                        </div>
                    )}

                    {/* Contracts Table */}
                    {!loading && filtered.length > 0 && (
                        <div className="table-container">
                            <div className="table-header">
                                <h3>Contracts List</h3>
                                <span className="results-count">
                                    Showing {filtered.length} of {rows.length} contracts
                                </span>
                            </div>
                            <div className="table-responsive">
                                <table className="contracts-table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Client</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Duration</th>
                                            <th>Lanes</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(contract => {
                                            const status = getContractStatus(contract);
                                            const start = new Date(contract.start_at);
                                            const end = new Date(contract.end_at);
                                            const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                            
                                            return (
                                                <tr key={contract.id} className={`contract-row contract-${status}`}>
                                                    <td>
                                                        <span className={`status-badge status-${status}`}>
                                                            {status === 'active' && '✅ Active'}
                                                            {status === 'expired' && '⏰ Expired'}
                                                            {status === 'upcoming' && '⏳ Upcoming'}
                                                        </span>
                                                    </td>
                                                    <td className="client-cell">
                                                        {getClientName(contract.client_id)}
                                                    </td>
                                                    <td>{new Date(contract.start_at).toLocaleDateString()}</td>
                                                    <td>{new Date(contract.end_at).toLocaleDateString()}</td>
                                                    <td className="duration-cell">
                                                        {durationDays} days
                                                    </td>
                                                    <td>
                                                        {Array.isArray(contract.lanes) 
                                                            ? contract.lanes.length 
                                                            : (contract.lanes ? '1+' : '—')}
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button className="btn-action btn-view" title="View details">
                                                                👁️ View
                                                            </button>
                                                            {role === 'admin' && (
                                                                <>
                                                                    <button className="btn-action btn-edit" title="Edit contract">
                                                                        ✏️ Edit
                                                                    </button>
                                                                    <button className="btn-action btn-delete" title="Delete contract">
                                                                        🗑️ Delete
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
        </main>
        </>
    );
}
