-- Sample seed script for RTS (run in Supabase SQL editor)
-- Replace the placeholders before running: <USER_UUID>, <USER_EMAIL>

-- 1) Create one demo client
insert into clients (name, contacts, gst, billing_terms)
values ('Acme Manufacturing', '{"primary":"+91-90000-00000"}', '27ABCDE1234F1Z5', 'NET30')
returning id as client_id; -- Copy the returned UUID
--- 9354c3cd-a473-47f6-ab4f-42f28961ff3

-- 2) Get your auth user id (option A: via SQL)
-- select id from auth.users where email = '<USER_EMAIL>';
-- 2) Or copy from Auth > Users in the Supabase dashboard.

-- 3) Link the user to the client and set role
-- Replace <USER_UUID> and <CLIENT_UUID>
insert into profiles (id, role, name, client_id)
values ('<USER_UUID>', 'client', 'Demo Client User', '<CLIENT_UUID>');

-- 4) Optional: create a contract that is currently active
insert into contracts (client_id, start_at, end_at, lanes, base_rates, documents)
values (
  '<CLIENT_UUID>',
  (current_date - interval '7 days'),
  (current_date + interval '30 days'),
  '{"lanes":[{"from":"Delhi","to":"Mumbai"}]}'::jsonb,
  '{"per_km":22}'::jsonb,
  '{"files":[]}'::jsonb
);

-- 5) Create a few shipments for the dashboard (statuses used by UI: pending, in_transit, delivered)
insert into shipments (client_id, origin, destination, distance_km, weight_mt, status, eta, cost)
values
  ('<CLIENT_UUID>', 'Delhi', 'Mumbai', 1440, 18.5, 'delivered', now() - interval '5 days', 12500),
  ('<CLIENT_UUID>', 'Chennai', 'Bangalore', 350, 12.0, 'in_transit', now() + interval '2 hours', 8200),
  ('<CLIENT_UUID>', 'Pune', 'Hyderabad', 560, 10.0, 'pending', now() + interval '1 day', 9800);
