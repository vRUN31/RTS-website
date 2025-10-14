"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

type Driver = {
  id: string;
  name: string;
  phone?: string | null;
  license_no?: string | null;
  salary_amount?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  last_salary_update?: string | null;
};

type DriverSalaryProps = {
  truckId?: string | null;
  driverId?: string | null;
};

export default function DriverSalaryClient({ truckId, driverId }: DriverSalaryProps = {}) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit form state
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    salary_amount: '',
    salary_currency: 'INR',
    salary_period: 'monthly',
    notes: ''
  });

  useEffect(() => {
    loadDrivers();
  }, [truckId, driverId]);

  async function loadDrivers() {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading drivers from database...');
      
      let query = supabase
        .from('drivers')
        .select('id, name, phone, license_no, salary_amount, salary_currency, salary_period, last_salary_update')
        .order('name', { ascending: true });

      // If we have a specific driver ID (from truck selection), load just that driver
      if (driverId) {
        query = query.eq('id', driverId);
      }

      const { data: driversData, error: driversError } = await query.limit(100);

      if (driversError) {
        console.error('❌ Database error:', driversError);
        
        // Check if the error is about missing columns (migration not run)
        if (driversError.message?.includes('column') && 
            (driversError.message?.includes('salary_amount') || 
             driversError.message?.includes('salary_currency') ||
             driversError.message?.includes('salary_period'))) {
          setError('MIGRATION_REQUIRED');
        } else {
          setError(driversError.message);
        }
        return;
      }

      console.log('✅ Loaded drivers:', driversData);
      console.log('📊 Total drivers found:', driversData?.length || 0);
      
      if (driversData && driversData.length > 0) {
        console.log('👤 First driver details:', driversData[0]);
      }
      
      setDrivers((driversData as Driver[]) || []);
    } catch (e: any) {
      console.error('❌ Error loading drivers:', e);
      setError(e.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSalary(e: React.FormEvent) {
    e.preventDefault();
    
    if (!editingDriver) {
      alert('Please select a driver first');
      return;
    }

    const supabase = createClient();
    
    try {
      console.log('🔄 Updating salary for driver:', editingDriver.name);
      console.log('📝 Salary data:', salaryForm);

      const { error, data } = await supabase
        .from('drivers')
        .update({
          salary_amount: salaryForm.salary_amount ? parseFloat(salaryForm.salary_amount) : null,
          salary_currency: salaryForm.salary_currency,
          salary_period: salaryForm.salary_period,
          last_salary_update: new Date().toISOString(),
        })
        .eq('id', editingDriver.id)
        .select();

      if (error) {
        console.error('❌ Update error:', error);
        alert('Failed to update salary: ' + error.message);
        return;
      }

      console.log('✅ Salary updated successfully:', data);

      // Reset form state FIRST
      setEditingDriver(null);
      setShowAddModal(false);
      setSalaryForm({
        salary_amount: '',
        salary_currency: 'INR',
        salary_period: 'monthly',
        notes: ''
      });

      // Reload drivers to get fresh data
      await loadDrivers();
      
      // Show success message AFTER data is loaded
      alert('✅ Salary updated successfully!');
    } catch (e: any) {
      console.error('❌ Error updating salary:', e);
      alert('Failed to update salary: ' + e.message);
    }
  }

  function handleEditClick(driver: Driver) {
    setEditingDriver(driver);
    setSalaryForm({
      salary_amount: driver.salary_amount?.toString() || '',
      salary_currency: driver.salary_currency || 'INR',
      salary_period: driver.salary_period || 'monthly',
      notes: ''
    });
  }

  function handleCancelEdit() {
    setEditingDriver(null);
    setShowAddModal(false);
    setSalaryForm({
      salary_amount: '',
      salary_currency: 'INR',
      salary_period: 'monthly',
      notes: ''
    });
  }

  function handleAddClick() {
    setShowAddModal(true);
    setEditingDriver(null);
    setSalaryForm({
      salary_amount: '',
      salary_currency: 'INR',
      salary_period: 'monthly',
      notes: ''
    });
  }

  // Statistics
  const stats = useMemo(() => {
    const driversWithSalary = drivers.filter(d => d.salary_amount && d.salary_amount > 0);
    const totalMonthlySalary = driversWithSalary.reduce((sum, d) => {
      const amount = d.salary_amount || 0;
      // Convert to monthly for consistency
      if (d.salary_period === 'weekly') return sum + (amount * 4.33);
      if (d.salary_period === 'daily') return sum + (amount * 30);
      return sum + amount;
    }, 0);

    const avgSalary = driversWithSalary.length > 0 ? totalMonthlySalary / driversWithSalary.length : 0;

    return {
      total_drivers: drivers.length,
      with_salary: driversWithSalary.length,
      without_salary: drivers.length - driversWithSalary.length,
      total_monthly: totalMonthlySalary,
      avg_monthly: avgSalary,
      yearly_cost: totalMonthlySalary * 12,
    };
  }, [drivers]);

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    const filtered = drivers.filter(driver => {
      const matchesSearch = 
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.license_no?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
    
    console.log('🔍 Filtered drivers:', filtered);
    console.log('Total drivers:', drivers.length, 'Filtered:', filtered.length);
    
    return filtered;
  }, [drivers, searchQuery]);

  if (loading) return <div className="loading-spinner">Loading driver salary data...</div>;
  
  if (error === 'MIGRATION_REQUIRED') {
    return (
      <div className="migration-required-message">
        <div className="migration-icon">⚠️</div>
        <h3>Database Migration Required</h3>
        <p>The salary management feature requires additional database columns.</p>
        <div className="migration-steps">
          <h4>Quick Setup (2 minutes):</h4>
          <ol>
            <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">Supabase Dashboard</a></li>
            <li>Go to <strong>SQL Editor</strong> → <strong>New Query</strong></li>
            <li>Copy the migration file: <code>supabase/migrations/2025-01-15-add-driver-salary-fields.sql</code></li>
            <li>Paste the SQL and click <strong>"Run"</strong></li>
            <li>Refresh this page</li>
          </ol>
          <p className="migration-note">
            Or run these commands in SQL Editor:
          </p>
          <pre className="migration-sql">{`ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS salary_amount numeric(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS salary_period text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS last_salary_update timestamptz DEFAULT NULL;`}</pre>
        </div>
      </div>
    );
  }
  
  if (error) return (
    <div className="error-message">
      <div className="error-icon">❌</div>
      <h3>Error Loading Driver Data</h3>
      <p>{error}</p>
      <button onClick={loadDrivers} className="btn-retry">Retry</button>
    </div>
  );

  return (
    <div className="driver-salary-container">
      {/* Info Banner */}
      {(truckId && driverId) && (
        <div className="filter-info-banner">
          <span className="info-icon">👨‍✈️</span>
          <span>Showing salary information for the driver assigned to the selected truck</span>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">👨‍✈️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_drivers}</div>
            <div className="stat-label">Total Drivers</div>
          </div>
        </div>
        <div className="stat-card stat-card-with-salary">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{stats.with_salary}</div>
            <div className="stat-label">With Salary Set</div>
          </div>
        </div>
        <div className="stat-card stat-card-pending">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.without_salary}</div>
            <div className="stat-label">Pending Setup</div>
          </div>
        </div>
        <div className="stat-card stat-card-monthly">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">₹{(stats.total_monthly / 1000).toFixed(1)}K</div>
            <div className="stat-label">Total Monthly</div>
          </div>
        </div>
        <div className="stat-card stat-card-average">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">₹{(stats.avg_monthly / 1000).toFixed(1)}K</div>
            <div className="stat-label">Avg Monthly</div>
          </div>
        </div>
        <div className="stat-card stat-card-yearly">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">₹{(stats.yearly_cost / 100000).toFixed(1)}L</div>
            <div className="stat-label">Yearly Cost</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="info-text">
          <span className="info-icon">ℹ️</span>
          <span>Click "Edit Salary" to set or update driver compensation</span>
        </div>

        <div className="controls-right">
          <button 
            className="btn-add-salary"
            onClick={handleAddClick}
            title="Add salary details for a driver"
          >
            <span className="btn-icon">➕</span>
            <span className="btn-text">Add Salary Details</span>
          </button>

          <button 
            className="btn-refresh"
            onClick={() => loadDrivers()}
            title="Refresh driver data"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
              marginRight: '1rem'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🔄</span>
            <span>Refresh</span>
          </button>

          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search driver by name, phone, or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      <div className="results-info">
        <h3>Driver Salary Management</h3>
        <span>Showing {filteredDrivers.length} of {drivers.length} drivers</span>
      </div>

      {/* Edit Salary Modal */}
      {editingDriver && (
        <div className="edit-form-overlay">
          <div className="edit-form-modal">
            <div className="modal-header">
              <h3>💰 Update Salary - {editingDriver.name}</h3>
              <button className="btn-close" onClick={handleCancelEdit}>✕</button>
            </div>

            <form className="salary-form" onSubmit={handleUpdateSalary}>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">💵</span>
                  Salary Amount
                </label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount (e.g., 25000)"
                  value={salaryForm.salary_amount}
                  onChange={(e) => setSalaryForm({...salaryForm, salary_amount: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🌍</span>
                    Currency
                  </label>
                  <select
                    className="form-select"
                    value={salaryForm.salary_currency}
                    onChange={(e) => setSalaryForm({...salaryForm, salary_currency: e.target.value})}
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📅</span>
                    Payment Period
                  </label>
                  <select
                    className="form-select"
                    value={salaryForm.salary_period}
                    onChange={(e) => setSalaryForm({...salaryForm, salary_period: e.target.value})}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📝</span>
                  Notes (Optional)
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Add any notes about this salary update..."
                  value={salaryForm.notes}
                  onChange={(e) => setSalaryForm({...salaryForm, notes: e.target.value})}
                  rows={3}
                />
              </div>

              {editingDriver.last_salary_update && (
                <div className="last-update-info">
                  <span className="info-icon">🕒</span>
                  <span>Last updated: {new Date(editingDriver.last_salary_update).toLocaleString()}</span>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  <span className="btn-icon">💾</span>
                  <span className="btn-text">Save Salary</span>
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                  <span className="btn-icon">✖</span>
                  <span className="btn-text">Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Salary Modal */}
      {showAddModal && (
        <div className="edit-form-overlay">
          <div className="edit-form-modal">
            <div className="modal-header">
              <h3>➕ Add Salary Details</h3>
              <button className="btn-close" onClick={handleCancelEdit}>✕</button>
            </div>

            <form className="salary-form" onSubmit={handleUpdateSalary}>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">👨‍✈️</span>
                  Select Driver
                </label>
                <select
                  className="form-select"
                  value={editingDriver?.id || ''}
                  onChange={(e) => {
                    const driver = drivers.find(d => d.id === e.target.value);
                    if (driver) {
                      setEditingDriver(driver);
                    }
                  }}
                  required
                >
                  <option value="">-- Select a driver --</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} {driver.phone ? `(${driver.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">💵</span>
                  Salary Amount
                </label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount (e.g., 25000)"
                  value={salaryForm.salary_amount}
                  onChange={(e) => setSalaryForm({...salaryForm, salary_amount: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🌍</span>
                    Currency
                  </label>
                  <select
                    className="form-select"
                    value={salaryForm.salary_currency}
                    onChange={(e) => setSalaryForm({...salaryForm, salary_currency: e.target.value})}
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📅</span>
                    Payment Period
                  </label>
                  <select
                    className="form-select"
                    value={salaryForm.salary_period}
                    onChange={(e) => setSalaryForm({...salaryForm, salary_period: e.target.value})}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📝</span>
                  Notes (Optional)
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Add any notes about this salary..."
                  value={salaryForm.notes}
                  onChange={(e) => setSalaryForm({...salaryForm, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={!editingDriver}>
                  <span className="btn-icon">💾</span>
                  <span className="btn-text">Add Salary</span>
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                  <span className="btn-icon">✖</span>
                  <span className="btn-text">Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drivers Table */}
      {filteredDrivers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👨‍✈️</div>
          <h3>No drivers found</h3>
          <p>
            {drivers.length === 0 ? (
              <>
                No drivers exist in the system yet. Please add drivers first via the{' '}
                <strong>Manage Trucks</strong> feature.
              </>
            ) : searchQuery ? (
              <>
                No drivers match your search "{searchQuery}". Try a different search term.
              </>
            ) : truckId && driverId ? (
              'The selected truck does not have a driver assigned yet'
            ) : (
              'No drivers available'
            )}
          </p>
          {drivers.length === 0 && (
            <div className="empty-actions">
              <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                💡 <strong>Tip:</strong> Drivers are created when you assign them to trucks in the Manage Trucks section.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Phone</th>
                <th>License No.</th>
                <th>Current Salary</th>
                <th>Period</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver, index) => (
                <tr key={driver.id} className="data-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>
                    <div className="driver-name">
                      <span className="name-icon">👨‍✈️</span>
                      <strong>{driver.name}</strong>
                    </div>
                  </td>
                  <td>{driver.phone || '—'}</td>
                  <td>
                    {driver.license_no ? (
                      <span className="license-badge">{driver.license_no}</span>
                    ) : '—'}
                  </td>
                  <td>
                    {driver.salary_amount ? (
                      <span className="salary-amount">
                        {driver.salary_currency === 'USD' && '$'}
                        {driver.salary_currency === 'EUR' && '€'}
                        {driver.salary_currency === 'INR' && '₹'}
                        {driver.salary_amount.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="no-salary">Not Set</span>
                    )}
                  </td>
                  <td>
                    {driver.salary_period ? (
                      <span className="period-badge">
                        {driver.salary_period.charAt(0).toUpperCase() + driver.salary_period.slice(1)}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {driver.last_salary_update ? (
                      <span className="update-date">
                        {new Date(driver.last_salary_update).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <button
                      className="btn-edit-salary"
                      onClick={() => handleEditClick(driver)}
                      title="Edit driver salary"
                    >
                      <span className="btn-icon">✏️</span>
                      <span className="btn-text">Edit Salary</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
