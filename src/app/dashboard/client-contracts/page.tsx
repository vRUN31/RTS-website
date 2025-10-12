"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ThemeToggle from '@/src/components/ThemeToggle.client';
import ContractDocumentUpload from '@/src/components/contracts/ContractDocumentUpload.client';
import ContractExpiryNotifications from '@/src/components/contracts/ContractExpiryNotifications.client';
import './client-contracts.css';

type ClientContract = {
    contract_id: string;
    start_date: string;
    end_date: string;
    status: string;
    days_remaining: number;
    contract_type: string;
    value: number;
    routes: string;
    vehicle_types: string;
    document_count: number;
    unread_notifications: number;
};

export default function ClientContractsPage() {
    const [contracts, setContracts] = useState<ClientContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string | null>(null);
    const [selectedContract, setSelectedContract] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

    // Load client's contracts
    const loadContracts = async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            
            // Get current user and their client_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('client_id')
                .eq('id', user.id)
                .single();

            if (!profile?.client_id) {
                throw new Error('No client profile found');
            }

            setClientId(profile.client_id);

            // Use the helper function to get contract summary
            const { data, error: rpcError } = await supabase
                .rpc('get_client_contracts', { client_uuid: profile.client_id });

            if (rpcError) throw rpcError;

            setContracts(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load contracts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContracts();
    }, []);

    // Filter contracts
    const filteredContracts = contracts.filter(contract => {
        if (filter === 'active') return contract.status === 'active';
        if (filter === 'expired') return contract.status === 'expired';
        return true;
    });

    // Get status badge
    const getStatusBadge = (status: string) => {
        const badges: Record<string, { icon: string; class: string; label: string }> = {
            active: { icon: '✅', class: 'status-active', label: 'Active' },
            expired: { icon: '⏰', class: 'status-expired', label: 'Expired' },
            draft: { icon: '📝', class: 'status-draft', label: 'Draft' },
            terminated: { icon: '❌', class: 'status-terminated', label: 'Terminated' },
            pending_renewal: { icon: '🔄', class: 'status-pending', label: 'Pending Renewal' },
        };
        return badges[status] || badges.draft;
    };

    // Format currency
    const formatCurrency = (amount: number | null) => {
        if (!amount) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate progress percentage
    const getProgressPercentage = (contract: ClientContract) => {
        const start = new Date(contract.start_date).getTime();
        const end = new Date(contract.end_date).getTime();
        const now = Date.now();
        const total = end - start;
        const elapsed = now - start;
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    if (loading) {
        return (
            <>
                <ThemeToggle />
                <main className="client-contracts-container">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading your contracts...</p>
                    </div>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <ThemeToggle />
                <main className="client-contracts-container">
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Unable to Load Contracts</h3>
                        <p>{error}</p>
                        <button className="btn-retry" onClick={loadContracts}>
                            🔄 Try Again
                        </button>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <ThemeToggle />
            <main className="client-contracts-container">
                <div className="contracts-header">
                    <h1>📋 My Contracts</h1>
                    <p className="contracts-subtitle">
                        View and manage your transportation contracts
                    </p>
                </div>

                {/* Notifications Section */}
                <ContractExpiryNotifications clientId={clientId || undefined} />

                {/* Statistics */}
                <div className="contract-stats">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <div className="stat-value">{contracts.length}</div>
                            <div className="stat-label">Total Contracts</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {contracts.filter(c => c.status === 'active').length}
                            </div>
                            <div className="stat-label">Active</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📄</div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {contracts.reduce((sum, c) => sum + (c.document_count || 0), 0)}
                            </div>
                            <div className="stat-label">Documents</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🔔</div>
                        <div className="stat-content">
                            <div className="stat-value">
                                {contracts.reduce((sum, c) => sum + (c.unread_notifications || 0), 0)}
                            </div>
                            <div className="stat-label">Notifications</div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="filter-bar">
                    <label htmlFor="contractFilter" className="filter-label">
                        🔍 Filter:
                    </label>
                    <select
                        id="contractFilter"
                        className="filter-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                    >
                        <option value="all">All Contracts</option>
                        <option value="active">✅ Active Only</option>
                        <option value="expired">⏰ Expired Only</option>
                    </select>
                    <button className="btn-refresh" onClick={loadContracts}>
                        🔄 Refresh
                    </button>
                </div>

                {/* Contracts List */}
                {filteredContracts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No contracts found</h3>
                        <p>
                            {filter !== 'all'
                                ? 'Try changing the filter to see more contracts.'
                                : 'You don\'t have any contracts yet. Contact our sales team to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="contracts-grid">
                        {filteredContracts.map((contract) => {
                            const statusBadge = getStatusBadge(contract.status);
                            const progress = getProgressPercentage(contract);
                            const isExpanded = selectedContract === contract.contract_id;

                            return (
                                <div
                                    key={contract.contract_id}
                                    className={`contract-card ${isExpanded ? 'expanded' : ''}`}
                                >
                                    {/* Card Header */}
                                    <div className="contract-card-header">
                                        <div className="contract-status-badge">
                                            <span className={`status-indicator ${statusBadge.class}`}>
                                                {statusBadge.icon} {statusBadge.label}
                                            </span>
                                            {contract.unread_notifications > 0 && (
                                                <span className="notification-dot">
                                                    {contract.unread_notifications}
                                                </span>
                                            )}
                                        </div>
                                        <div className="contract-type">
                                            {contract.contract_type || 'Standard Contract'}
                                        </div>
                                    </div>

                                    {/* Contract Details */}
                                    <div className="contract-details">
                                        <div className="detail-row">
                                            <span className="detail-label">📅 Duration:</span>
                                            <span className="detail-value">
                                                {new Date(contract.start_date).toLocaleDateString()} →{' '}
                                                {new Date(contract.end_date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {contract.status === 'active' && (
                                            <div className="detail-row">
                                                <span className="detail-label">⏳ Days Remaining:</span>
                                                <span className={`detail-value ${contract.days_remaining <= 30 ? 'text-urgent' : ''}`}>
                                                    {contract.days_remaining} days
                                                </span>
                                            </div>
                                        )}

                                        <div className="detail-row">
                                            <span className="detail-label">💰 Value:</span>
                                            <span className="detail-value">
                                                {formatCurrency(contract.value)}
                                            </span>
                                        </div>

                                        {contract.routes && (
                                            <div className="detail-row">
                                                <span className="detail-label">🛣️ Routes:</span>
                                                <span className="detail-value">{contract.routes}</span>
                                            </div>
                                        )}

                                        {contract.vehicle_types && (
                                            <div className="detail-row">
                                                <span className="detail-label">🚚 Vehicles:</span>
                                                <span className="detail-value">{contract.vehicle_types}</span>
                                            </div>
                                        )}

                                        <div className="detail-row">
                                            <span className="detail-label">📄 Documents:</span>
                                            <span className="detail-value">
                                                {contract.document_count || 0} file{contract.document_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {contract.status === 'active' && (
                                        <div className="contract-progress">
                                            <div className="progress-label">
                                                <span>Contract Progress</span>
                                                <span>{Math.round(progress)}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="contract-actions">
                                        <button
                                            className="btn-expand"
                                            onClick={() => setSelectedContract(
                                                isExpanded ? null : contract.contract_id
                                            )}
                                        >
                                            {isExpanded ? '🔼 Hide Details' : '🔽 View Details'}
                                        </button>
                                    </div>

                                    {/* Expanded Section */}
                                    {isExpanded && (
                                        <div className="contract-expanded">
                                            <ContractDocumentUpload
                                                contractId={contract.contract_id}
                                                isAdmin={false}
                                                onUploadComplete={loadContracts}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}
