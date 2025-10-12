-- ========================================
-- FLEET MANAGEMENT - VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify setup
-- ========================================

-- Check if all tables exist
SELECT 
    'trips' as table_name, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') as exists
UNION ALL
SELECT 
    'maintenance_records', 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_records')
UNION ALL
SELECT 
    'driver_performance', 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_performance')
UNION ALL
SELECT 
    'fuel_records', 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_records')
UNION ALL
SELECT 
    'optimized_routes', 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'optimized_routes');

-- Count records in each table
SELECT 'trips' as table_name, COUNT(*) as record_count FROM trips
UNION ALL
SELECT 'maintenance_records', COUNT(*) FROM maintenance_records
UNION ALL
SELECT 'driver_performance', COUNT(*) FROM driver_performance
UNION ALL
SELECT 'fuel_records', COUNT(*) FROM fuel_records
UNION ALL
SELECT 'optimized_routes', COUNT(*) FROM optimized_routes;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
    'trips',
    'maintenance_records', 
    'driver_performance',
    'fuel_records',
    'optimized_routes'
)
ORDER BY tablename;

-- Check if required foreign key tables exist
SELECT 
    'trucks' as required_table,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trucks') as exists
UNION ALL
SELECT 
    'drivers',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers')
UNION ALL
SELECT 
    'profiles',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles');

-- If all tables exist and RLS is enabled, you're ready to go! ✅
