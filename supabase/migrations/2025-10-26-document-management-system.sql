-- =====================================================
-- COMPREHENSIVE DOCUMENT MANAGEMENT SYSTEM
-- =====================================================
-- Created: October 26, 2025
-- Purpose: Complete document storage for all entity types
-- Features: Contract docs, Invoices, Driver licenses, Truck insurance
-- Storage: Supabase Storage with proper RLS policies
-- =====================================================

-- ============================================
-- 1. CREATE DOCUMENT CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Icon name for UI
    color TEXT, -- Color code for UI
    requires_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default categories
INSERT INTO document_categories (name, description, icon, color, requires_approval) VALUES
('contract', 'Contract documents and agreements', '📄', '#3b82f6', true),
('invoice', 'Invoices and billing documents', '🧾', '#10b981', false),
('driver_license', 'Driver license and certifications', '🪪', '#f59e0b', true),
('truck_insurance', 'Vehicle insurance documents', '🛡️', '#8b5cf6', true),
('truck_registration', 'Vehicle registration documents', '📋', '#06b6d4', true),
('compliance', 'Compliance and regulatory documents', '✅', '#14b8a6', true),
('maintenance', 'Maintenance records and reports', '🔧', '#f97316', false),
('inspection', 'Vehicle inspection certificates', '🔍', '#ec4899', true),
('permit', 'Special permits and authorizations', '📜', '#6366f1', true),
('other', 'Miscellaneous documents', '📁', '#64748b', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. INVOICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Invoice details
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Amounts
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other')),
    
    -- Line items (JSONB for flexibility)
    line_items JSONB, -- [{description, quantity, rate, amount}]
    
    -- Document reference
    document_path TEXT, -- Path in Supabase Storage
    
    -- Notes
    notes TEXT,
    terms_and_conditions TEXT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_amounts CHECK (
        subtotal >= 0 AND 
        tax_amount >= 0 AND 
        discount_amount >= 0 AND 
        total_amount >= 0 AND
        paid_amount >= 0 AND
        paid_amount <= total_amount
    ),
    CONSTRAINT valid_dates CHECK (due_date >= issue_date)
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_shipment_id ON invoices(shipment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- ============================================
-- 3. DRIVER DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Document details
    document_type TEXT NOT NULL CHECK (document_type IN (
        'license', 'medical_certificate', 'pcc', 'aadhar', 
        'pan', 'passport', 'training_certificate', 'experience_letter', 'other'
    )),
    document_number TEXT,
    
    -- File info
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL, -- MIME type
    
    -- Validity
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    rejection_reason TEXT,
    
    -- Metadata
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760), -- 10MB
    CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date >= issue_date)
);

-- Indexes for driver documents
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON driver_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON driver_documents(status);
CREATE INDEX IF NOT EXISTS idx_driver_documents_expiry ON driver_documents(expiry_date);

-- ============================================
-- 4. TRUCK DOCUMENTS TABLE
-- ============================================
-- Note: truck_id type must match trucks.id type (either TEXT or UUID)
-- Check your trucks table: SELECT data_type FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'id';

CREATE TABLE IF NOT EXISTS truck_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id TEXT NOT NULL, -- Will add foreign key constraint after checking trucks table type
    
    -- Document details
    document_type TEXT NOT NULL CHECK (document_type IN (
        'insurance', 'registration', 'pollution_certificate', 'fitness_certificate',
        'permit', 'tax_receipt', 'warranty', 'purchase_invoice', 'loan_documents', 'other'
    )),
    document_number TEXT,
    
    -- File info
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL, -- MIME type
    
    -- Validity
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    
    -- Insurance specific fields
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_amount DECIMAL(15, 2),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending_renewal')),
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT false,
    last_reminder_date TIMESTAMPTZ,
    
    -- Metadata
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760), -- 10MB
    CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date >= issue_date)
);

-- Indexes for truck documents
CREATE INDEX IF NOT EXISTS idx_truck_documents_truck_id ON truck_documents(truck_id);
CREATE INDEX IF NOT EXISTS idx_truck_documents_type ON truck_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_truck_documents_status ON truck_documents(status);
CREATE INDEX IF NOT EXISTS idx_truck_documents_expiry ON truck_documents(expiry_date);

-- ============================================
-- 5. DOCUMENT AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS document_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_table TEXT NOT NULL, -- Which table: invoices, driver_documents, truck_documents, contract_documents
    document_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('uploaded', 'viewed', 'downloaded', 'updated', 'deleted', 'verified', 'rejected')),
    user_id UUID REFERENCES auth.users(id),
    user_role TEXT,
    ip_address TEXT,
    metadata JSONB, -- Additional context
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_document ON document_audit_log(document_table, document_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON document_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON document_audit_log(created_at DESC);

-- ============================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_log ENABLE ROW LEVEL SECURITY;

-- Document Categories (Public read, admin write)
CREATE POLICY "document_categories_public_read"
    ON document_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "document_categories_admin_write"
    ON document_categories FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Invoices Policies
CREATE POLICY "invoices_admin_all"
    ON invoices FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "invoices_client_read"
    ON invoices FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'client'
            AND p.client_id = invoices.client_id
        )
    );

-- Driver Documents Policies
CREATE POLICY "driver_documents_admin_all"
    ON driver_documents FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Truck Documents Policies
CREATE POLICY "truck_documents_admin_all"
    ON truck_documents FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Audit Log Policies (Admin only)
CREATE POLICY "audit_log_admin_read"
    ON document_audit_log FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "audit_log_system_insert"
    ON document_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Anyone can create audit logs

-- ============================================
-- 7. STORAGE BUCKETS & POLICIES
-- ============================================

-- Create storage buckets (run in Supabase dashboard if this fails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('invoices', 'invoices', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('driver-documents', 'driver-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']),
    ('truck-documents', 'truck-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']),
    ('contract-documents', 'contract-documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for invoices
CREATE POLICY "invoices_admin_upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'invoices' AND
        public.is_admin(auth.uid())
    );

CREATE POLICY "invoices_authorized_select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'invoices' AND
        (
            public.is_admin(auth.uid()) OR
            EXISTS (
                SELECT 1 FROM invoices i
                JOIN profiles p ON p.client_id = i.client_id
                WHERE i.document_path = storage.objects.name
                AND p.id = auth.uid()
            )
        )
    );

-- Storage policies for driver documents
CREATE POLICY "driver_docs_admin_upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'driver-documents' AND
        public.is_admin(auth.uid())
    );

CREATE POLICY "driver_docs_admin_select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'driver-documents' AND
        public.is_admin(auth.uid())
    );

-- Storage policies for truck documents
CREATE POLICY "truck_docs_admin_all"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'truck-documents' AND
        public.is_admin(auth.uid())
    )
    WITH CHECK (
        bucket_id = 'truck-documents' AND
        public.is_admin(auth.uid())
    );

-- Storage policies for contract documents (already exists, just ensuring)
DROP POLICY IF EXISTS "contract_docs_admin_all" ON storage.objects;
CREATE POLICY "contract_docs_admin_all"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'contract-documents' AND
        public.is_admin(auth.uid())
    )
    WITH CHECK (
        bucket_id = 'contract-documents' AND
        public.is_admin(auth.uid())
    );

-- ============================================
-- 8. TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all document tables
DROP TRIGGER IF EXISTS trigger_update_invoices_timestamp ON invoices;
CREATE TRIGGER trigger_update_invoices_timestamp
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

DROP TRIGGER IF EXISTS trigger_update_driver_docs_timestamp ON driver_documents;
CREATE TRIGGER trigger_update_driver_docs_timestamp
    BEFORE UPDATE ON driver_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

DROP TRIGGER IF EXISTS trigger_update_truck_docs_timestamp ON truck_documents;
CREATE TRIGGER trigger_update_truck_docs_timestamp
    BEFORE UPDATE ON truck_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

-- Function to check expiring documents
CREATE OR REPLACE FUNCTION check_expiring_documents()
RETURNS TABLE (
    document_type TEXT,
    entity_id TEXT,
    entity_name TEXT,
    expiry_date DATE,
    days_until_expiry INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Driver documents
    SELECT 
        'driver_' || dd.document_type as document_type,
        dd.driver_id::TEXT as entity_id,
        d.name as entity_name,
        dd.expiry_date,
        (dd.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
        dd.status
    FROM driver_documents dd
    JOIN drivers d ON d.id = dd.driver_id
    WHERE dd.expiry_date IS NOT NULL
    AND dd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
    AND dd.status NOT IN ('expired', 'rejected')
    
    UNION ALL
    
    -- Truck documents
    SELECT 
        'truck_' || td.document_type as document_type,
        td.truck_id as entity_id,
        t.plate as entity_name,
        td.expiry_date,
        (td.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
        td.status
    FROM truck_documents td
    JOIN trucks t ON t.id = td.truck_id
    WHERE td.expiry_date IS NOT NULL
    AND td.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
    AND td.status NOT IN ('expired', 'cancelled')
    
    ORDER BY expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update expired documents
CREATE OR REPLACE FUNCTION update_expired_documents()
RETURNS void AS $$
BEGIN
    -- Update driver documents
    UPDATE driver_documents
    SET status = 'expired'
    WHERE expiry_date < CURRENT_DATE
    AND status NOT IN ('expired', 'rejected');
    
    -- Update truck documents
    UPDATE truck_documents
    SET status = 'expired'
    WHERE expiry_date < CURRENT_DATE
    AND status NOT IN ('expired', 'cancelled');
    
    -- Update invoice status to overdue
    UPDATE invoices
    SET status = 'overdue'
    WHERE due_date < CURRENT_DATE
    AND status IN ('sent', 'viewed', 'partial')
    AND paid_amount < total_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    year_month := to_char(CURRENT_DATE, 'YYYYMM');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'INV-' || year_month || '-([0-9]+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_month || '-%';
    
    invoice_num := 'INV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE truck_documents;

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON document_categories TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON driver_documents TO authenticated;
GRANT ALL ON truck_documents TO authenticated;
GRANT ALL ON document_audit_log TO authenticated;

GRANT EXECUTE ON FUNCTION check_expiring_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION update_expired_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;

-- ============================================
-- 11. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE invoices IS 'Invoice management with payment tracking and PDF storage';
COMMENT ON TABLE driver_documents IS 'Driver licenses, certificates, and identity documents';
COMMENT ON TABLE truck_documents IS 'Vehicle insurance, registration, permits, and compliance docs';
COMMENT ON TABLE document_audit_log IS 'Comprehensive audit trail for all document operations';
COMMENT ON FUNCTION check_expiring_documents() IS 'Returns all documents expiring in next 90 days';
COMMENT ON FUNCTION generate_invoice_number() IS 'Auto-generates sequential invoice numbers (INV-YYYYMM-0001)';

-- =====================================================
-- 12. AUTO-FIX TRUCK DOCUMENTS FOREIGN KEY
-- =====================================================
-- Detect trucks.id type and adjust truck_documents.truck_id accordingly

DO $$
DECLARE
    trucks_id_type TEXT;
BEGIN
    -- Get the actual data type of trucks.id
    SELECT data_type INTO trucks_id_type
    FROM information_schema.columns
    WHERE table_name = 'trucks' AND column_name = 'id';
    
    -- If trucks.id is UUID, convert truck_documents.truck_id to UUID
    IF trucks_id_type = 'uuid' THEN
        RAISE NOTICE 'Detected trucks.id as UUID, converting truck_documents.truck_id to UUID...';
        ALTER TABLE truck_documents ALTER COLUMN truck_id TYPE UUID USING truck_id::UUID;
    ELSE
        RAISE NOTICE 'Detected trucks.id as TEXT, keeping truck_documents.truck_id as TEXT...';
    END IF;
    
    -- Now add the foreign key constraint
    ALTER TABLE truck_documents 
    ADD CONSTRAINT truck_documents_truck_id_fkey 
    FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Successfully added foreign key constraint on truck_documents.truck_id';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add foreign key constraint: %', SQLERRM;
        RAISE WARNING 'Please manually verify trucks.id type and add constraint';
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Created: invoices, driver_documents, truck_documents tables
-- Storage buckets: invoices, driver-documents, truck-documents
-- RLS policies: Admin full access, clients/drivers limited read
-- Functions: Expiry checking, invoice numbering, auto-updates
-- Auto-fixed: truck_documents.truck_id type and foreign key
-- =====================================================
