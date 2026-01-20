'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import BackButton from '@/src/components/_back-button.client';
import './documents.css';

type DocumentCategory = {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    count?: number;
    expiring?: number;
};

type Document = {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_path: string;
    document_type: string;
    status: string;
    expiry_date?: string;
    uploaded_at: string;
    entity_name?: string;
    entity_id?: string;
};

export default function DocumentsPage() {
    const router = useRouter();
    const supabase = createClient();
    
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [categories, setCategories] = useState<DocumentCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Upload form state
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        file: null as File | null,
        documentType: '',
        entityId: '',
        clientId: '', // For contracts, invoices, and miscellaneous docs
        documentNumber: '',
        issueDate: '',
        expiryDate: '',
        description: ''
    });
    const [entities, setEntities] = useState<{ id: string; name: string }[]>([]);
    const [clients, setClients] = useState<{ id: string; name: string; email?: string }[]>([]);

    useEffect(() => {
        checkAuth();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchDocuments();
        }
    }, [selectedCategory, filterStatus]);

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        setUserRole(profile?.role || null);
    }

    async function fetchCategories() {
        setLoading(true);
        try {
            const { data: cats } = await supabase
                .from('document_categories')
                .select('*')
                .order('name');

            if (cats) {
                // Fetch counts for each category
                const categoriesWithCounts = await Promise.all(
                    cats.map(async (cat) => {
                        const count = await getDocumentCount(cat.name);
                        const expiring = await getExpiringCount(cat.name);
                        return { ...cat, count, expiring };
                    })
                );
                setCategories(categoriesWithCounts);
                if (categoriesWithCounts.length > 0) {
                    setSelectedCategory(categoriesWithCounts[0].name);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    }

    async function getDocumentCount(categoryName: string): Promise<number> {
        let count = 0;
        
        try {
            if (categoryName === 'invoice') {
                const { count: c } = await supabase
                    .from('invoices')
                    .select('*', { count: 'exact', head: true });
                count = c || 0;
            } else if (categoryName === 'driver_license') {
                const { count: c } = await supabase
                    .from('driver_documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('document_type', 'license');
                count = c || 0;
            } else if (categoryName === 'truck_insurance') {
                const { count: c } = await supabase
                    .from('truck_documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('document_type', 'insurance');
                count = c || 0;
            } else if (categoryName === 'contract') {
                const { count: c } = await supabase
                    .from('contract_documents')
                    .select('*', { count: 'exact', head: true });
                count = c || 0;
            }
        } catch (error) {
            console.error('Error counting documents:', error);
        }
        
        return count;
    }

    async function getExpiringCount(categoryName: string): Promise<number> {
        let count = 0;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        try {
            if (categoryName === 'driver_license') {
                const { count: c } = await supabase
                    .from('driver_documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('document_type', 'license')
                    .lte('expiry_date', thirtyDaysFromNow.toISOString())
                    .gte('expiry_date', new Date().toISOString());
                count = c || 0;
            } else if (categoryName === 'truck_insurance') {
                const { count: c } = await supabase
                    .from('truck_documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('document_type', 'insurance')
                    .lte('expiry_date', thirtyDaysFromNow.toISOString())
                    .gte('expiry_date', new Date().toISOString());
                count = c || 0;
            }
        } catch (error) {
            console.error('Error counting expiring documents:', error);
        }
        
        return count;
    }

    async function fetchDocuments() {
        if (!selectedCategory) return;
        
        setLoading(true);
        try {
            let docs: any[] = [];
            
            if (selectedCategory === 'invoice') {
                const { data } = await supabase
                    .from('invoices')
                    .select(`
                        *,
                        clients!inner(name)
                    `)
                    .order('created_at', { ascending: false });
                
                docs = (data || []).map(inv => ({
                    id: inv.id,
                    file_name: inv.invoice_number,
                    file_type: 'application/pdf',
                    file_size: 0,
                    file_path: inv.document_path || '',
                    document_type: 'invoice',
                    status: inv.status,
                    expiry_date: inv.due_date,
                    uploaded_at: inv.created_at,
                    entity_name: inv.clients?.name,
                    entity_id: inv.client_id
                }));
            } else if (selectedCategory === 'driver_license') {
                const { data } = await supabase
                    .from('driver_documents')
                    .select(`
                        *,
                        drivers!inner(name)
                    `)
                    .eq('document_type', 'license')
                    .order('created_at', { ascending: false });
                
                docs = (data || []).map(doc => ({
                    id: doc.id,
                    file_name: doc.file_name,
                    file_type: doc.file_type,
                    file_size: doc.file_size,
                    file_path: doc.file_path,
                    document_type: 'license',
                    status: doc.status,
                    expiry_date: doc.expiry_date,
                    uploaded_at: doc.created_at,
                    entity_name: doc.drivers?.name,
                    entity_id: doc.driver_id
                }));
            } else if (selectedCategory === 'truck_insurance') {
                const { data } = await supabase
                    .from('truck_documents')
                    .select(`
                        *,
                        trucks!inner(plate)
                    `)
                    .eq('document_type', 'insurance')
                    .order('created_at', { ascending: false });
                
                docs = (data || []).map(doc => ({
                    id: doc.id,
                    file_name: doc.file_name,
                    file_type: doc.file_type,
                    file_size: doc.file_size,
                    file_path: doc.file_path,
                    document_type: 'insurance',
                    status: doc.status,
                    expiry_date: doc.expiry_date,
                    uploaded_at: doc.created_at,
                    entity_name: doc.trucks?.plate,
                    entity_id: doc.truck_id
                }));
            } else if (selectedCategory === 'contract') {
                const { data } = await supabase
                    .from('contract_documents')
                    .select(`
                        *,
                        contracts(client_id, clients(name))
                    `)
                    .eq('document_type', 'contract')
                    .order('uploaded_at', { ascending: false });
                
                docs = (data || []).map(doc => ({
                    id: doc.id,
                    file_name: doc.file_name,
                    file_type: doc.file_type,
                    file_size: doc.file_size,
                    file_path: doc.file_path,
                    document_type: doc.document_type || 'contract',
                    status: 'active',
                    uploaded_at: doc.uploaded_at,
                    entity_name: doc.contracts?.clients?.name,
                    entity_id: doc.contract_id
                }));
            } else if (selectedCategory === 'other') {
                // Miscellaneous documents
                const { data } = await supabase
                    .from('contract_documents')
                    .select('*')
                    .eq('document_type', 'miscellaneous')
                    .order('uploaded_at', { ascending: false });
                
                docs = (data || []).map(doc => ({
                    id: doc.id,
                    file_name: doc.file_name,
                    file_type: doc.file_type,
                    file_size: doc.file_size,
                    file_path: doc.file_path,
                    document_type: 'miscellaneous',
                    status: 'active',
                    uploaded_at: doc.uploaded_at,
                    entity_name: 'General',
                    entity_id: null
                }));
            }
            
            // Apply filters
            if (filterStatus !== 'all') {
                docs = docs.filter(doc => doc.status === filterStatus);
            }
            
            if (searchQuery) {
                docs = docs.filter(doc => 
                    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    doc.entity_name?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            
            setDocuments(docs);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    }

    async function downloadDocument(doc: Document) {
        try {
            const bucketMap: Record<string, string> = {
                'invoice': 'invoices',
                'license': 'driver-documents',
                'insurance': 'truck-documents',
                'registration': 'truck-documents',
                'contract': 'contract-documents',
                'miscellaneous': 'contract-documents'
            };
            
            const bucket = bucketMap[doc.document_type];
            if (!bucket) return;
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .download(doc.file_path);
            
            if (error) throw error;
            
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Failed to download document');
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function getStatusInfo(doc: Document) {
        if (doc.expiry_date) {
            const expiryDate = new Date(doc.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry < 0) {
                return { label: 'Expired', className: 'expired' };
            } else if (daysUntilExpiry <= 30) {
                return { label: `Expiring in ${daysUntilExpiry} days`, className: 'expiring' };
            }
        }
        
        const statusMap: Record<string, { label: string; className: string }> = {
            'active': { label: 'Active', className: 'active' },
            'pending': { label: 'Pending', className: 'pending' },
            'expired': { label: 'Expired', className: 'expired' },
            'draft': { label: 'Draft', className: 'pending' },
            'sent': { label: 'Sent', className: 'active' },
            'paid': { label: 'Paid', className: 'active' },
            'overdue': { label: 'Overdue', className: 'expired' }
        };
        
        return statusMap[doc.status] || { label: doc.status, className: 'active' };
    }

    // Fetch entities based on selected category
    async function fetchEntitiesForCategory(categoryName: string) {
        try {
            if (categoryName === 'driver_license') {
                const { data } = await supabase.from('drivers').select('id, name').order('name');
                setEntities(data || []);
            } else if (categoryName === 'truck_insurance' || categoryName === 'truck_registration') {
                const { data } = await supabase.from('trucks').select('id, plate as name').order('plate');
                setEntities(    );
            } else if (categoryName === 'contract') {
                const { data } = await supabase
                    .from('contracts')
                    .select('id, client_id')
                    .order('created_at', { ascending: false });
                setEntities(data?.map(c => ({ id: c.id, name: `Contract ${c.id.substring(0, 8)}` })) || []);
            } else {
                setEntities([]);
            }

            // Fetch clients for client-specific document types
            if (['contract', 'invoice', 'other'].includes(categoryName)) {
                const { data: clientsData } = await supabase
                    .from('clients')
                    .select('id, name, email')
                    .order('name');
                setClients(clientsData || []);
            } else {
                setClients([]);
            }
        } catch (error) {
            console.error('Error fetching entities:', error);
        }
    }

    // Handle upload modal open
    function handleOpenUpload() {
        if (selectedCategory) {
            fetchEntitiesForCategory(selectedCategory);
            setUploadForm({
                file: null,
                documentType: selectedCategory,
                entityId: '',
                clientId: '',
                documentNumber: '',
                issueDate: '',
                expiryDate: '',
                description: ''
            });
            setShowUploadModal(true);
        }
    }

    // Handle file upload
    async function handleUploadDocument(e: React.FormEvent) {
        e.preventDefault();
        
        // Validate required fields
        const requiresClient = ['contract', 'invoice', 'other'].includes(uploadForm.documentType);
        const requiresEntity = ['driver_license', 'truck_insurance', 'truck_registration', 'contract'].includes(uploadForm.documentType);
        
        if (!uploadForm.file) {
            alert('Please select a file');
            return;
        }
        
        if (requiresClient && !uploadForm.clientId) {
            alert('Please select a client');
            return;
        }
        
        if (requiresEntity && !uploadForm.entityId) {
            alert('Please select an entity');
            return;
        }

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Determine bucket and table
            const bucketMap: Record<string, string> = {
                'invoice': 'invoices',
                'driver_license': 'driver-documents',
                'truck_insurance': 'truck-documents',
                'truck_registration': 'truck-documents',
                'contract': 'contract-documents',
                'other': 'contract-documents' // Miscellaneous documents
            };

            const bucket = bucketMap[uploadForm.documentType];
            if (!bucket) throw new Error('Invalid document type');

            // Upload file to storage
            const fileExt = uploadForm.file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const folderPath = uploadForm.clientId || uploadForm.entityId;
            const filePath = `${folderPath}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, uploadForm.file);

            if (uploadError) throw uploadError;

            // Insert record into appropriate table based on document type
            let documentId: string | null = null;
            
            if (uploadForm.documentType === 'driver_license') {
                const { data } = await supabase.from('driver_documents').insert({
                    driver_id: uploadForm.entityId,
                    document_type: 'license',
                    document_number: uploadForm.documentNumber,
                    file_name: uploadForm.file.name,
                    file_path: filePath,
                    file_size: uploadForm.file.size,
                    file_type: uploadForm.file.type,
                    issue_date: uploadForm.issueDate || null,
                    expiry_date: uploadForm.expiryDate || null,
                    description: uploadForm.description,
                    uploaded_by: user.id,
                    status: 'pending'
                }).select('id').single();
                documentId = data?.id;
                
            } else if (uploadForm.documentType === 'truck_insurance' || uploadForm.documentType === 'truck_registration') {
                const { data } = await supabase.from('truck_documents').insert({
                    truck_id: uploadForm.entityId,
                    document_type: uploadForm.documentType === 'truck_insurance' ? 'insurance' : 'registration',
                    document_number: uploadForm.documentNumber,
                    file_name: uploadForm.file.name,
                    file_path: filePath,
                    file_size: uploadForm.file.size,
                    file_type: uploadForm.file.type,
                    issue_date: uploadForm.issueDate || null,
                    expiry_date: uploadForm.expiryDate || null,
                    description: uploadForm.description,
                    uploaded_by: user.id,
                    status: 'active'
                }).select('id').single();
                documentId = data?.id;
                
            } else if (uploadForm.documentType === 'invoice') {
                // Create invoice record
                const { data } = await supabase.from('invoices').insert({
                    invoice_number: `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    client_id: uploadForm.clientId,
                    issue_date: uploadForm.issueDate || new Date().toISOString().split('T')[0],
                    due_date: uploadForm.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    subtotal: 0,
                    total_amount: 0,
                    status: 'draft',
                    document_path: filePath,
                    notes: uploadForm.description,
                    created_by: user.id
                }).select('id').single();
                documentId = data?.id;
                
            } else if (uploadForm.documentType === 'contract' || uploadForm.documentType === 'other') {
                const { data } = await supabase.from('contract_documents').insert({
                    contract_id: uploadForm.entityId || null,
                    file_name: uploadForm.file.name,
                    file_path: filePath,
                    file_size: uploadForm.file.size,
                    file_type: uploadForm.file.type,
                    document_type: uploadForm.documentType === 'other' ? 'miscellaneous' : 'contract',
                    uploaded_by: user.id
                }).select('id').single();
                documentId = data?.id;
            }

            // Create notification for client
            if (requiresClient && uploadForm.clientId && documentId) {
                const selectedClient = clients.find(c => c.id === uploadForm.clientId);
                const docTypeLabel = uploadForm.documentType === 'other' ? 'Miscellaneous' : 
                                    uploadForm.documentType === 'invoice' ? 'Invoice' : 'Contract';
                
                await supabase.from('notifications').insert({
                    user_id: uploadForm.clientId, // Assumes client has a user account
                    title: `New ${docTypeLabel} Document`,
                    message: `Admin has uploaded a new ${docTypeLabel.toLowerCase()} document: ${uploadForm.file.name}`,
                    type: 'document_uploaded',
                    metadata: {
                        document_id: documentId,
                        document_type: uploadForm.documentType,
                        file_name: uploadForm.file.name,
                        client_name: selectedClient?.name
                    },
                    read: false
                });
            }

            alert('Document uploaded successfully! Client has been notified.');
            setShowUploadModal(false);
            fetchDocuments();
            fetchCategories();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document: ' + (error as Error).message);
        } finally {
            setUploading(false);
        }
    }

    const selectedCat = categories.find(c => c.name === selectedCategory);

    if (loading && categories.length === 0) {
        return (
            <div className="documents-container">
                <div className="documents-header">
                    <BackButton label="Back to Dashboard" fallbackUrl={userRole === 'admin' ? '/admin' : '/dashboard/customer'} />
                    <h1 className="documents-title">Loading...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="documents-container">
            <div className="documents-header">
                <BackButton label="Back to Dashboard" fallbackUrl={userRole === 'admin' ? '/admin' : '/dashboard/customer'} />
                <h1 className="documents-title">📁 Document Management</h1>
                <div className="documents-actions">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '250px' }}
                    />
                    {userRole === 'admin' && (
                        <button className="btn-upload-doc" onClick={handleOpenUpload}>
                            <span>📤</span> Upload Document
                        </button>
                    )}
                </div>
            </div>

            {/* Document Categories */}
            <div className="document-categories">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className={`category-card ${selectedCategory === category.name ? 'active' : ''}`}
                        style={{ '--category-color': category.color } as React.CSSProperties}
                        onClick={() => setSelectedCategory(category.name)}
                    >
                        <div className="category-header">
                            <span className="category-icon">{category.icon}</span>
                            <div className="category-info">
                                <h3 className="category-name">{category.description}</h3>
                                <p className="category-description">{category.name.replace(/_/g, ' ')}</p>
                            </div>
                        </div>
                        <div className="category-stats">
                            <div>
                                <div className="category-count">{category.count || 0}</div>
                                <div className="category-label">Documents</div>
                            </div>
                            {category.expiring! > 0 && (
                                <span className="expiry-badge">{category.expiring} expiring</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Documents Section */}
            {selectedCat && (
                <div className="documents-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            {selectedCat.icon} {selectedCat.description}
                            <span className="section-count">{documents.length}</span>
                        </h2>
                        <div className="documents-filters">
                            <select
                                className="filter-select"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                    </div>

                    {documents.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <h3 className="empty-state-title">No documents found</h3>
                            <p className="empty-state-text">
                                {searchQuery
                                    ? 'Try adjusting your search or filters'
                                    : 'Upload your first document to get started'}
                            </p>
                            {userRole === 'admin' && (
                                <button className="btn-upload-doc" onClick={handleOpenUpload}>
                                    <span>📤</span> Upload Document
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="documents-grid">
                            {documents.map((doc) => {
                                const statusInfo = getStatusInfo(doc);
                                return (
                                    <div key={doc.id} className="document-card">
                                        <span className={`document-type-badge ${doc.document_type}`}>
                                            {doc.document_type}
                                        </span>
                                        <div className="document-icon-wrapper">
                                            {doc.file_type.includes('pdf') ? '📄' : '📋'}
                                        </div>
                                        <div className="document-info">
                                            <h3 className="document-name" title={doc.file_name}>
                                                {doc.file_name}
                                            </h3>
                                            <div className="document-details">
                                                {doc.entity_name && (
                                                    <div className="document-detail">
                                                        <span>👤</span> {doc.entity_name}
                                                    </div>
                                                )}
                                                <div className="document-detail">
                                                    <span>📅</span> {formatDate(doc.uploaded_at)}
                                                </div>
                                                {doc.file_size > 0 && (
                                                    <div className="document-detail">
                                                        <span>💾</span> {formatFileSize(doc.file_size)}
                                                    </div>
                                                )}
                                                {doc.expiry_date && (
                                                    <div className="document-detail">
                                                        <span>⏰</span> Expires: {formatDate(doc.expiry_date)}
                                                    </div>
                                                )}
                                                <span className={`document-status ${statusInfo.className}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="document-actions">
                                            <button
                                                className="btn-doc-action"
                                                onClick={() => downloadDocument(doc)}
                                            >
                                                <span>⬇️</span> Download
                                            </button>
                                            {userRole === 'admin' && (
                                                <button className="btn-doc-action">
                                                    <span>👁️</span> View
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">📤 Upload Document</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowUploadModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleUploadDocument} className="upload-form">
                            <div className="form-group">
                                <label className="form-label">Document Type</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={selectedCat?.description || ''}
                                    disabled
                                />
                            </div>

                            {/* Client Selection for Contract, Invoice, and Miscellaneous Documents */}
                            {['contract', 'invoice', 'other'].includes(uploadForm.documentType) && (
                                <div className="form-group">
                                    <label className="form-label">
                                        Select Client *
                                        <span className="form-label-hint"> (Document will be sent to this client)</span>
                                    </label>
                                    <select
                                        className="form-input"
                                        value={uploadForm.clientId}
                                        onChange={(e) => setUploadForm({ ...uploadForm, clientId: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Select Client --</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>
                                                {client.name} {client.email && `(${client.email})`}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="form-hint">📧 Client will be notified when document is uploaded</p>
                                </div>
                            )}

                            {/* Entity Selection for Driver and Truck Documents */}
                            {['driver_license', 'truck_insurance', 'truck_registration', 'contract'].includes(uploadForm.documentType) && (
                                <div className="form-group">
                                    <label className="form-label">
                                        Select {
                                            uploadForm.documentType === 'driver_license' ? 'Driver' :
                                            uploadForm.documentType === 'truck_insurance' || uploadForm.documentType === 'truck_registration' ? 'Truck' :
                                            uploadForm.documentType === 'contract' ? 'Contract' :
                                            'Entity'
                                        } {uploadForm.documentType === 'contract' ? '' : '*'}
                                    </label>
                                    <select
                                        className="form-input"
                                        value={uploadForm.entityId}
                                        onChange={(e) => setUploadForm({ ...uploadForm, entityId: e.target.value })}
                                        required={uploadForm.documentType !== 'contract'}
                                    >
                                        <option value="">-- Select --</option>
                                        {entities.map((entity) => (
                                            <option key={entity.id} value={entity.id}>
                                                {entity.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Document Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., License number, Policy number"
                                    value={uploadForm.documentNumber}
                                    onChange={(e) => setUploadForm({ ...uploadForm, documentNumber: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Issue Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={uploadForm.issueDate}
                                        onChange={(e) => setUploadForm({ ...uploadForm, issueDate: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={uploadForm.expiryDate}
                                        onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Additional notes..."
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Upload File *</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                                    required
                                />
                                <p className="form-hint">Max 10MB. Supported: PDF, JPG, PNG</p>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
