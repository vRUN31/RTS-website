-- Enable real-time updates for shipments table
-- This allows clients to receive instant updates when shipments are modified

-- Enable realtime for shipments table
alter publication supabase_realtime add table shipments;

-- Note: Row Level Security (RLS) policies already exist for shipments
-- Clients can only see their own shipments based on client_id
-- Admins can see all shipments
