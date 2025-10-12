-- ============================================
-- CONTRACT ENHANCEMENTS MIGRATION
-- Features: Document Upload, Expiry Notifications, Client View
-- Date: 2025-10-12
-- ============================================

-- ============================================
-- 1. EXTEND CONTRACTS TABLE
-- ============================================

-- Add new columns for enhanced contract management
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated', 'pending_renewal')),
ADD COLUMN IF NOT EXISTS contract_type TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
ADD COLUMN IF NOT EXISTS rate_per_km DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS value DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS routes TEXT,
ADD COLUMN IF NOT EXISTS vehicle_types TEXT,
ADD COLUMN IF NOT EXISTS frequency TEXT,
ADD COLUMN IF NOT EXISTS additional_services TEXT,
ADD COLUMN IF NOT EXISTS penalty_clause TEXT,
ADD COLUMN IF NOT EXISTS renewal_terms TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS expiry_notification_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_notification_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index for status and expiry queries
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_at ON contracts(end_at);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);

-- Add comments for documentation
COMMENT ON COLUMN contracts.status IS 'Contract status: draft, active, expired, terminated, pending_renewal';
COMMENT ON COLUMN contracts.expiry_notification_sent IS 'Whether expiry notification has been sent to client';
COMMENT ON COLUMN contracts.last_notification_date IS 'Last date when notification was sent';

-- ============================================
-- 2. CONTRACT DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contract_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    document_type TEXT CHECK (document_type IN ('contract_pdf', 'insurance', 'compliance', 'amendment', 'invoice', 'other')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760) -- 10MB limit
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_contract_documents_contract_id ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_uploaded_at ON contract_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_documents_type ON contract_documents(document_type);

-- Add comments
COMMENT ON TABLE contract_documents IS 'Stores uploaded documents for contracts with metadata';
COMMENT ON COLUMN contract_documents.is_public IS 'Whether the document is visible to the client';

-- ============================================
-- 3. CONTRACT NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contract_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    notification_type TEXT NOT NULL CHECK (notification_type IN ('expiry_90', 'expiry_60', 'expiry_30', 'expiry_7', 'expired', 'renewal_due', 'amendment', 'payment_due')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    metadata JSONB,
    CONSTRAINT unique_notification_per_contract UNIQUE (contract_id, notification_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contract_notifications_contract ON contract_notifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_client ON contract_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_read ON contract_notifications(is_read, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_type ON contract_notifications(notification_type);

-- Add comments
COMMENT ON TABLE contract_notifications IS 'Tracks all notifications sent for contracts';
COMMENT ON COLUMN contract_notifications.metadata IS 'Additional data like days_until_expiry, contract_value, etc.';

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_notifications ENABLE ROW LEVEL SECURITY;

-- Contract Documents Policies
-- Admins can do everything
CREATE POLICY "contract_documents_admin_all"
    ON contract_documents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Clients can view their own contract documents (if public or they own it)
CREATE POLICY "contract_documents_client_view"
    ON contract_documents
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM contracts c
            JOIN profiles p ON p.client_id = c.client_id
            WHERE c.id = contract_documents.contract_id
            AND p.id = auth.uid()
            AND p.role = 'client'
            AND (contract_documents.is_public = true OR p.client_id = c.client_id)
        )
    );

-- Contract Notifications Policies
-- Admins can view all notifications
CREATE POLICY "contract_notifications_admin_view"
    ON contract_notifications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Clients can view their own notifications
CREATE POLICY "contract_notifications_client_view"
    ON contract_notifications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'client'
            AND p.client_id = contract_notifications.client_id
        )
    );

-- Clients can update read status on their notifications
CREATE POLICY "contract_notifications_client_update"
    ON contract_notifications
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'client'
            AND p.client_id = contract_notifications.client_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'client'
            AND p.client_id = contract_notifications.client_id
        )
    );

-- ============================================
-- 5. FUNCTION: AUTO-UPDATE CONTRACT STATUS
-- ============================================

CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on dates
    IF NEW.end_at < CURRENT_DATE THEN
        NEW.status := 'expired';
    ELSIF NEW.start_at <= CURRENT_DATE AND NEW.end_at >= CURRENT_DATE THEN
        IF NEW.status NOT IN ('terminated') THEN
            NEW.status := 'active';
        END IF;
    ELSIF NEW.start_at > CURRENT_DATE THEN
        IF NEW.status = 'draft' THEN
            NEW.status := 'draft';
        END IF;
    END IF;
    
    -- Update timestamp
    NEW.updated_at := now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_contract_status ON contracts;
CREATE TRIGGER trigger_update_contract_status
    BEFORE INSERT OR UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_status();

-- ============================================
-- 6. FUNCTION: CHECK EXPIRING CONTRACTS
-- ============================================

CREATE OR REPLACE FUNCTION check_expiring_contracts()
RETURNS void AS $$
DECLARE
    contract_record RECORD;
    days_until_expiry INTEGER;
    notification_type TEXT;
BEGIN
    -- Loop through active contracts
    FOR contract_record IN 
        SELECT c.id, c.client_id, c.end_at, c.expiry_notification_sent, c.last_notification_date,
               cl.name as client_name, cl.email as client_email
        FROM contracts c
        LEFT JOIN clients cl ON cl.id = c.client_id
        WHERE c.status = 'active'
        AND c.end_at >= CURRENT_DATE
    LOOP
        days_until_expiry := contract_record.end_at - CURRENT_DATE;
        notification_type := NULL;
        
        -- Determine notification type based on days
        IF days_until_expiry <= 7 THEN
            notification_type := 'expiry_7';
        ELSIF days_until_expiry <= 30 THEN
            notification_type := 'expiry_30';
        ELSIF days_until_expiry <= 60 THEN
            notification_type := 'expiry_60';
        ELSIF days_until_expiry <= 90 THEN
            notification_type := 'expiry_90';
        END IF;
        
        -- Create notification if needed
        IF notification_type IS NOT NULL THEN
            INSERT INTO contract_notifications (
                contract_id,
                client_id,
                notification_type,
                title,
                message,
                priority,
                metadata
            ) VALUES (
                contract_record.id,
                contract_record.client_id,
                notification_type,
                'Contract Expiring Soon',
                format('Your contract will expire in %s days on %s. Please contact us to discuss renewal options.',
                       days_until_expiry, to_char(contract_record.end_at, 'Month DD, YYYY')),
                CASE 
                    WHEN days_until_expiry <= 7 THEN 'urgent'
                    WHEN days_until_expiry <= 30 THEN 'high'
                    ELSE 'medium'
                END,
                jsonb_build_object(
                    'days_until_expiry', days_until_expiry,
                    'end_date', contract_record.end_at,
                    'client_name', contract_record.client_name
                )
            )
            ON CONFLICT (contract_id, notification_type) DO NOTHING;
        END IF;
    END LOOP;
    
    -- Mark expired contracts
    UPDATE contracts
    SET status = 'expired'
    WHERE end_at < CURRENT_DATE
    AND status = 'active';
    
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. REALTIME PUBLICATION
-- ============================================

-- Enable realtime for contract notifications
ALTER PUBLICATION supabase_realtime ADD TABLE contract_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE contract_documents;

-- ============================================
-- 8. HELPER FUNCTIONS FOR CLIENT VIEW
-- ============================================

-- Function to get contract summary for client
CREATE OR REPLACE FUNCTION get_client_contracts(client_uuid UUID)
RETURNS TABLE (
    contract_id UUID,
    start_date DATE,
    end_date DATE,
    status TEXT,
    days_remaining INTEGER,
    contract_type TEXT,
    value DECIMAL,
    routes TEXT,
    vehicle_types TEXT,
    document_count BIGINT,
    unread_notifications BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as contract_id,
        c.start_at::DATE as start_date,
        c.end_at::DATE as end_date,
        c.status,
        CASE 
            WHEN c.end_at >= CURRENT_DATE THEN (c.end_at - CURRENT_DATE)::INTEGER
            ELSE 0
        END as days_remaining,
        c.contract_type,
        c.value,
        c.routes,
        c.vehicle_types,
        (SELECT COUNT(*) FROM contract_documents cd WHERE cd.contract_id = c.id AND cd.is_public = true) as document_count,
        (SELECT COUNT(*) FROM contract_notifications cn WHERE cn.contract_id = c.id AND cn.is_read = false) as unread_notifications
    FROM contracts c
    WHERE c.client_id = client_uuid
    ORDER BY c.end_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_client_contracts(UUID) TO authenticated;

-- ============================================
-- 9. INITIAL DATA SETUP
-- ============================================

-- Update existing contracts to active status if within date range
UPDATE contracts
SET status = CASE
    WHEN end_at < CURRENT_DATE THEN 'expired'
    WHEN start_at <= CURRENT_DATE AND end_at >= CURRENT_DATE THEN 'active'
    ELSE 'draft'
END
WHERE status IS NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Add migration record
INSERT INTO public.migrations (name, executed_at)
VALUES ('2025-10-12-contract-enhancements', now())
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE contract_documents IS 'Enhanced contract management - document storage and tracking';
COMMENT ON TABLE contract_notifications IS 'Enhanced contract management - expiry notifications and alerts';
