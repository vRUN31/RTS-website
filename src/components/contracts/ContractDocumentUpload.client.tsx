"use client";
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import './contract-components.css';

type Document = {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    document_type: string;
    uploaded_at: string;
    description: string | null;
    is_public: boolean;
};

type ContractDocumentUploadProps = {
    contractId: string;
    isAdmin: boolean;
    onUploadComplete?: () => void;
};

export default function ContractDocumentUpload({ contractId, isAdmin, onUploadComplete }: ContractDocumentUploadProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showUploadForm, setShowUploadForm] = useState(false);
    
    const [uploadForm, setUploadForm] = useState({
        file: null as File | null,
        document_type: 'contract_pdf' as string,
        description: '',
        is_public: true,
    });

    // Load documents
    const loadDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error: fetchError } = await supabase
                .from('contract_documents')
                .select('*')
                .eq('contract_id', contractId)
                .order('uploaded_at', { ascending: false });

            if (fetchError) throw fetchError;
            setDocuments(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    // Handle file upload
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadForm.file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const supabase = createClient();
            
            // Check file size (10MB limit)
            if (uploadForm.file.size > 10485760) {
                throw new Error('File size must be less than 10MB');
            }

            // Upload file to Supabase Storage
            const fileExt = uploadForm.file.name.split('.').pop();
            const fileName = `${contractId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `contract-documents/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('contract-documents')
                .upload(filePath, uploadForm.file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('contract-documents')
                .getPublicUrl(filePath);

            // Insert document record
            const { error: dbError } = await supabase
                .from('contract_documents')
                .insert({
                    contract_id: contractId,
                    file_name: uploadForm.file.name,
                    file_path: publicUrl,
                    file_size: uploadForm.file.size,
                    file_type: uploadForm.file.type,
                    document_type: uploadForm.document_type,
                    description: uploadForm.description || null,
                    is_public: uploadForm.is_public,
                });

            if (dbError) throw dbError;

            setSuccess('✅ Document uploaded successfully!');
            setUploadForm({
                file: null,
                document_type: 'contract_pdf',
                description: '',
                is_public: true,
            });
            setShowUploadForm(false);
            
            // Reload documents
            await loadDocuments();
            
            if (onUploadComplete) onUploadComplete();

            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            setError(err.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    // Handle file deletion
    const handleDelete = async (doc: Document) => {
        if (!confirm(`Are you sure you want to delete "${doc.file_name}"?`)) return;

        try {
            const supabase = createClient();
            
            // Extract file path from URL
            const urlParts = doc.file_path.split('/contract-documents/');
            const filePath = urlParts[1];

            // Delete from storage
            if (filePath) {
                await supabase.storage
                    .from('contract-documents')
                    .remove([`contract-documents/${filePath}`]);
            }

            // Delete from database
            const { error: dbError } = await supabase
                .from('contract_documents')
                .delete()
                .eq('id', doc.id);

            if (dbError) throw dbError;

            setSuccess('✅ Document deleted successfully!');
            await loadDocuments();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete document');
        }
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    };

    // Get document type icon
    const getDocTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            contract_pdf: '📄',
            insurance: '🛡️',
            compliance: '✅',
            amendment: '📝',
            invoice: '💰',
            other: '📎'
        };
        return icons[type] || '📎';
    };

    return (
        <div className="contract-documents-section">
            <div className="section-header">
                <h4>📁 Contract Documents</h4>
                {isAdmin && (
                    <button 
                        className="btn-upload-doc"
                        onClick={() => {
                            setShowUploadForm(!showUploadForm);
                            if (!documents.length) loadDocuments();
                        }}
                    >
                        {showUploadForm ? '✖ Close' : '📤 Upload Document'}
                    </button>
                )}
            </div>

            {/* Success/Error Messages */}
            {success && <div className="alert-success-small">{success}</div>}
            {error && <div className="alert-error-small">⚠️ {error}</div>}

            {/* Upload Form */}
            {showUploadForm && isAdmin && (
                <form className="upload-form" onSubmit={handleUpload}>
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="doc-file">
                                📎 Select File <span className="required">*</span>
                            </label>
                            <input
                                id="doc-file"
                                type="file"
                                className="form-input-file"
                                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                required
                            />
                            <small className="file-hint">Max 10MB. Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</small>
                        </div>

                        <div className="form-field">
                            <label htmlFor="doc-type">
                                🏷️ Document Type <span className="required">*</span>
                            </label>
                            <select
                                id="doc-type"
                                className="form-select-small"
                                value={uploadForm.document_type}
                                onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                                required
                            >
                                <option value="contract_pdf">Contract PDF</option>
                                <option value="insurance">Insurance Certificate</option>
                                <option value="compliance">Compliance Document</option>
                                <option value="amendment">Amendment</option>
                                <option value="invoice">Invoice</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-field">
                        <label htmlFor="doc-description">
                            📝 Description <span className="optional">(optional)</span>
                        </label>
                        <input
                            id="doc-description"
                            type="text"
                            className="form-input-small"
                            placeholder="Brief description of the document"
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                        />
                    </div>

                    <div className="form-field-checkbox">
                        <input
                            id="doc-public"
                            type="checkbox"
                            checked={uploadForm.is_public}
                            onChange={(e) => setUploadForm({ ...uploadForm, is_public: e.target.checked })}
                        />
                        <label htmlFor="doc-public">
                            👁️ Make visible to client
                        </label>
                    </div>

                    <div className="form-actions-small">
                        <button type="submit" className="btn-submit-small" disabled={uploading || !uploadForm.file}>
                            {uploading ? '⏳ Uploading...' : '📤 Upload'}
                        </button>
                        <button 
                            type="button" 
                            className="btn-cancel-small"
                            onClick={() => setShowUploadForm(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Documents List */}
            {loading ? (
                <div className="loading-small">Loading documents...</div>
            ) : documents.length === 0 ? (
                <div className="empty-docs">
                    <div className="empty-icon">📁</div>
                    <p>No documents uploaded yet</p>
                    {isAdmin && <small>Click "Upload Document" to add files</small>}
                </div>
            ) : (
                <div className="documents-list">
                    {documents.map((doc) => (
                        <div key={doc.id} className="document-card">
                            <div className="doc-icon">{getDocTypeIcon(doc.document_type)}</div>
                            <div className="doc-info">
                                <div className="doc-name">{doc.file_name}</div>
                                <div className="doc-meta">
                                    <span>{doc.document_type.replace('_', ' ')}</span>
                                    <span>•</span>
                                    <span>{formatFileSize(doc.file_size)}</span>
                                    <span>•</span>
                                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                    {!doc.is_public && <span className="private-badge">🔒 Private</span>}
                                </div>
                                {doc.description && <div className="doc-description">{doc.description}</div>}
                            </div>
                            <div className="doc-actions">
                                <a 
                                    href={doc.file_path} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn-doc-action btn-download"
                                    title="Download"
                                >
                                    📥
                                </a>
                                {isAdmin && (
                                    <button 
                                        className="btn-doc-action btn-delete-doc"
                                        onClick={() => handleDelete(doc)}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !showUploadForm && documents.length === 0 && !isAdmin && (
                <button 
                    className="btn-load-docs"
                    onClick={loadDocuments}
                >
                    🔄 Load Documents
                </button>
            )}
            
            {!loading && !showUploadForm && documents.length > 0 && (
                <button 
                    className="btn-reload-docs"
                    onClick={loadDocuments}
                >
                    🔄 Refresh
                </button>
            )}
        </div>
    );
}
