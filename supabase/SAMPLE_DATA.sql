-- =====================================================
-- DOCUMENT MANAGEMENT - SAMPLE DATA FOR TESTING
-- =====================================================
-- Run this AFTER the main migration to populate test data
-- This helps you verify the system is working correctly
-- =====================================================

-- 1. VERIFY CATEGORIES EXIST
SELECT name, description, icon, color FROM document_categories ORDER BY name;

-- 2. CREATE SAMPLE INVOICES (if you have clients)
-- First, check if clients exist
DO $$
DECLARE
    sample_client_id UUID;
BEGIN
    -- Get first client ID
    SELECT id INTO sample_client_id FROM clients LIMIT 1;
    
    IF sample_client_id IS NOT NULL THEN
        -- Insert sample invoice
        INSERT INTO invoices (
            invoice_number,
            client_id,
            issue_date,
            due_date,
            subtotal,
            tax_amount,
            total_amount,
            status,
            line_items,
            notes
        ) VALUES (
            generate_invoice_number(),
            sample_client_id,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            50000.00,
            9000.00,
            59000.00,
            'sent',
            '[
                {
                    "description": "Transport from Mumbai to Delhi",
                    "quantity": 1,
                    "rate": 50000,
                    "amount": 50000
                }
            ]'::jsonb,
            'Payment due within 30 days'
        );
        
        RAISE NOTICE 'Sample invoice created successfully';
    ELSE
        RAISE NOTICE 'No clients found. Skipping invoice creation.';
    END IF;
END $$;

-- 3. CREATE SAMPLE DRIVER DOCUMENT (if you have drivers)
DO $$
DECLARE
    sample_driver_id UUID;
    sample_user_id UUID;
BEGIN
    -- Get first driver ID
    SELECT id INTO sample_driver_id FROM drivers LIMIT 1;
    
    -- Get admin user for uploaded_by
    SELECT id INTO sample_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    IF sample_driver_id IS NOT NULL THEN
        -- Insert sample driver license
        INSERT INTO driver_documents (
            driver_id,
            document_type,
            document_number,
            file_name,
            file_path,
            file_size,
            file_type,
            issue_date,
            expiry_date,
            status,
            uploaded_by,
            description
        ) VALUES (
            sample_driver_id,
            'license',
            'DL-2023-12345',
            'driver_license_sample.pdf',
            'sample/driver_license_sample.pdf',
            1024000,
            'application/pdf',
            CURRENT_DATE - INTERVAL '2 years',
            CURRENT_DATE + INTERVAL '3 years',
            'approved',
            sample_user_id,
            'Commercial driving license - verified'
        );
        
        RAISE NOTICE 'Sample driver document created successfully';
    ELSE
        RAISE NOTICE 'No drivers found. Skipping driver document creation.';
    END IF;
END $$;

-- 4. CREATE SAMPLE TRUCK DOCUMENT (if you have trucks)
DO $$
DECLARE
    sample_truck_id TEXT;
    sample_user_id UUID;
BEGIN
    -- Get first truck ID
    SELECT id INTO sample_truck_id FROM trucks LIMIT 1;
    
    -- Get admin user for uploaded_by
    SELECT id INTO sample_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    IF sample_truck_id IS NOT NULL THEN
        -- Insert sample truck insurance
        INSERT INTO truck_documents (
            truck_id,
            document_type,
            document_number,
            file_name,
            file_path,
            file_size,
            file_type,
            issue_date,
            expiry_date,
            insurance_provider,
            insurance_policy_number,
            insurance_amount,
            status,
            uploaded_by,
            description
        ) VALUES (
            sample_truck_id,
            'insurance',
            'INS-2024-98765',
            'truck_insurance_sample.pdf',
            'sample/truck_insurance_sample.pdf',
            2048000,
            'application/pdf',
            CURRENT_DATE - INTERVAL '6 months',
            CURRENT_DATE + INTERVAL '6 months',
            'ICICI Lombard',
            'ICICI-VEH-2024-98765',
            500000.00,
            'active',
            sample_user_id,
            'Comprehensive vehicle insurance'
        );
        
        RAISE NOTICE 'Sample truck document created successfully';
    ELSE
        RAISE NOTICE 'No trucks found. Skipping truck document creation.';
    END IF;
END $$;

-- 5. VERIFY SAMPLE DATA WAS CREATED
SELECT 'Invoices' as table_name, COUNT(*) as count FROM invoices
UNION ALL
SELECT 'Driver Documents', COUNT(*) FROM driver_documents
UNION ALL
SELECT 'Truck Documents', COUNT(*) FROM truck_documents
UNION ALL
SELECT 'Document Categories', COUNT(*) FROM document_categories;

-- 6. CHECK EXPIRING DOCUMENTS
SELECT * FROM check_expiring_documents();

-- 7. TEST INVOICE NUMBER GENERATION
SELECT generate_invoice_number() as sample_invoice_number;

-- 8. VIEW DOCUMENT COUNTS BY CATEGORY
SELECT 
    'Invoices' as category,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status IN ('paid', 'sent', 'viewed')) as active,
    COUNT(*) FILTER (WHERE status = 'overdue') as issues
FROM invoices

UNION ALL

SELECT 
    'Driver Documents',
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status IN ('pending', 'rejected', 'expired'))
FROM driver_documents

UNION ALL

SELECT 
    'Truck Documents',
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status IN ('expired', 'pending_renewal'))
FROM truck_documents

UNION ALL

SELECT 
    'Contract Documents',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_public = true),
    0
FROM contract_documents;

-- 9. TEST RLS POLICIES (check as current user)
-- This will show what documents the current user can see
SELECT 
    'My Accessible Invoices' as type,
    COUNT(*) as count
FROM invoices

UNION ALL

SELECT 
    'My Accessible Driver Docs',
    COUNT(*)
FROM driver_documents

UNION ALL

SELECT 
    'My Accessible Truck Docs',
    COUNT(*)
FROM truck_documents;

-- 10. CHECK STORAGE BUCKETS EXIST
SELECT 
    id as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id IN ('invoices', 'driver-documents', 'truck-documents', 'contract-documents')
ORDER BY id;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- ✅ 10 document categories
-- ✅ 1+ sample invoice (if clients exist)
-- ✅ 1+ sample driver doc (if drivers exist)
-- ✅ 1+ sample truck doc (if trucks exist)
-- ✅ 4 storage buckets
-- ✅ RLS policies working (counts based on user role)
-- =====================================================

-- =====================================================
-- MANUAL TESTS TO PERFORM:
-- =====================================================
-- 1. Navigate to /documents in browser
-- 2. Verify categories appear with counts
-- 3. Click on a category
-- 4. Verify documents load
-- 5. Try downloading a document
-- 6. Try uploading (admin only)
-- 7. Test search functionality
-- 8. Test status filters
-- 9. Check dark mode
-- 10. Test on mobile device
-- =====================================================

-- =====================================================
-- CLEANUP (if you want to remove sample data)
-- =====================================================
-- DELETE FROM invoices WHERE invoice_number LIKE 'INV-%';
-- DELETE FROM driver_documents WHERE file_name LIKE '%sample%';
-- DELETE FROM truck_documents WHERE file_name LIKE '%sample%';
-- =====================================================
