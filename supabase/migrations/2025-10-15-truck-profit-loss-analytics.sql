-- Migration: Add Profit & Loss Per Truck Analytics
-- Created: 2025-10-15
-- Description: Creates database functions to calculate profit/loss per truck with dynamic updates

-- ==========================================
-- PROFIT/LOSS PER TRUCK ANALYSIS
-- ==========================================

-- Step 1: Create function to calculate profit/loss per truck
CREATE OR REPLACE FUNCTION profit_loss_per_truck()
RETURNS TABLE (
    truck_id UUID,
    truck_code TEXT,
    plate TEXT,
    total_revenue NUMERIC,
    total_cost NUMERIC,
    profit_loss NUMERIC,
    shipment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS truck_id,
        t.display_code AS truck_code,
        t.plate,
        COALESCE(SUM(s.cost), 0) AS total_revenue,
        COALESCE(SUM(s.operational_cost), 0) AS total_cost,
        COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0) AS profit_loss,
        COUNT(s.id) AS shipment_count
    FROM public.trucks t
    LEFT JOIN public.shipments s ON s.truck_id = t.id
    GROUP BY t.id, t.display_code, t.plate
    ORDER BY profit_loss DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION profit_loss_per_truck IS 'Returns profit/loss analysis for each truck';

-- Step 2: Create function for profit/loss per truck with date range
CREATE OR REPLACE FUNCTION profit_loss_per_truck_range(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    truck_id UUID,
    truck_code TEXT,
    plate TEXT,
    total_revenue NUMERIC,
    total_cost NUMERIC,
    profit_loss NUMERIC,
    shipment_count BIGINT,
    avg_profit_per_shipment NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS truck_id,
        t.display_code AS truck_code,
        t.plate,
        COALESCE(SUM(s.cost), 0) AS total_revenue,
        COALESCE(SUM(s.operational_cost), 0) AS total_cost,
        COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0) AS profit_loss,
        COUNT(s.id) AS shipment_count,
        CASE 
            WHEN COUNT(s.id) > 0 THEN 
                (COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0)) / COUNT(s.id)
            ELSE 0
        END AS avg_profit_per_shipment
    FROM public.trucks t
    LEFT JOIN public.shipments s ON s.truck_id = t.id
        AND (start_date IS NULL OR s.created_at >= start_date)
        AND (end_date IS NULL OR s.created_at <= end_date)
    GROUP BY t.id, t.display_code, t.plate
    ORDER BY profit_loss DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION profit_loss_per_truck_range IS 'Returns profit/loss analysis for each truck within a date range';

-- Step 3: Create function for truck profit/loss trend over time (monthly)
CREATE OR REPLACE FUNCTION truck_profit_loss_monthly(p_truck_id UUID)
RETURNS TABLE (
    month_label TEXT,
    month_date DATE,
    revenue NUMERIC,
    cost NUMERIC,
    profit_loss NUMERIC,
    shipments_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(DATE_TRUNC('month', s.created_at), 'Mon YYYY') AS month_label,
        DATE_TRUNC('month', s.created_at)::DATE AS month_date,
        COALESCE(SUM(s.cost), 0) AS revenue,
        COALESCE(SUM(s.operational_cost), 0) AS cost,
        COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0) AS profit_loss,
        COUNT(s.id) AS shipments_count
    FROM public.shipments s
    WHERE s.truck_id = p_truck_id
    GROUP BY DATE_TRUNC('month', s.created_at)
    ORDER BY month_date DESC
    LIMIT 12;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION truck_profit_loss_monthly IS 'Returns monthly profit/loss trend for a specific truck (last 12 months)';

-- Step 4: Create function for top profitable trucks
CREATE OR REPLACE FUNCTION top_profitable_trucks(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    truck_id UUID,
    truck_code TEXT,
    plate TEXT,
    profit_loss NUMERIC,
    shipment_count BIGINT,
    efficiency_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS truck_id,
        t.display_code AS truck_code,
        t.plate,
        COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0) AS profit_loss,
        COUNT(s.id) AS shipment_count,
        CASE 
            WHEN COALESCE(SUM(s.operational_cost), 0) > 0 THEN 
                ((COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0)) / COALESCE(SUM(s.operational_cost), 0)) * 100
            ELSE 0
        END AS efficiency_score
    FROM public.trucks t
    LEFT JOIN public.shipments s ON s.truck_id = t.id
    GROUP BY t.id, t.display_code, t.plate
    HAVING COUNT(s.id) > 0
    ORDER BY profit_loss DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION top_profitable_trucks IS 'Returns top N most profitable trucks with efficiency score';

-- Step 5: Create function for loss-making trucks (need attention)
CREATE OR REPLACE FUNCTION loss_making_trucks()
RETURNS TABLE (
    truck_id UUID,
    truck_code TEXT,
    plate TEXT,
    loss_amount NUMERIC,
    shipment_count BIGINT,
    avg_loss_per_shipment NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS truck_id,
        t.display_code AS truck_code,
        t.plate,
        (COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0)) AS loss_amount,
        COUNT(s.id) AS shipment_count,
        CASE 
            WHEN COUNT(s.id) > 0 THEN 
                (COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0)) / COUNT(s.id)
            ELSE 0
        END AS avg_loss_per_shipment
    FROM public.trucks t
    LEFT JOIN public.shipments s ON s.truck_id = t.id
    GROUP BY t.id, t.display_code, t.plate
    HAVING (COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0)) < 0
    ORDER BY loss_amount ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION loss_making_trucks IS 'Returns trucks that are making losses (negative profit)';

-- Step 6: Create function for overall truck performance summary
CREATE OR REPLACE FUNCTION truck_performance_summary()
RETURNS TABLE (
    total_trucks BIGINT,
    profitable_trucks BIGINT,
    loss_making_trucks BIGINT,
    break_even_trucks BIGINT,
    total_profit NUMERIC,
    total_loss NUMERIC,
    net_profit_loss NUMERIC,
    avg_profit_per_truck NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH truck_profits AS (
        SELECT 
            t.id,
            COALESCE(SUM(s.cost), 0) - COALESCE(SUM(s.operational_cost), 0) AS profit_loss
        FROM public.trucks t
        LEFT JOIN public.shipments s ON s.truck_id = t.id
        GROUP BY t.id
    )
    SELECT 
        COUNT(*) AS total_trucks,
        COUNT(*) FILTER (WHERE profit_loss > 0) AS profitable_trucks,
        COUNT(*) FILTER (WHERE profit_loss < 0) AS loss_making_trucks,
        COUNT(*) FILTER (WHERE profit_loss = 0) AS break_even_trucks,
        COALESCE(SUM(profit_loss) FILTER (WHERE profit_loss > 0), 0) AS total_profit,
        COALESCE(ABS(SUM(profit_loss)) FILTER (WHERE profit_loss < 0), 0) AS total_loss,
        COALESCE(SUM(profit_loss), 0) AS net_profit_loss,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(profit_loss), 0) / COUNT(*)
            ELSE 0
        END AS avg_profit_per_truck
    FROM truck_profits;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION truck_performance_summary IS 'Returns overall summary of truck profit/loss performance';

-- Step 7: Grant execute permissions
GRANT EXECUTE ON FUNCTION profit_loss_per_truck() TO authenticated;
GRANT EXECUTE ON FUNCTION profit_loss_per_truck_range(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION truck_profit_loss_monthly(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION top_profitable_trucks(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION loss_making_trucks() TO authenticated;
GRANT EXECUTE ON FUNCTION truck_performance_summary() TO authenticated;
