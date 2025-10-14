# Schema Analysis and Recommendations for Bookings Feature

## Current Schema Status ✅

The existing `bookings` table in your schema is **already well-designed** for the bookings page! Here's what you have:

### Existing `bookings` Table
```sql
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  vehicle_type text,
  source_city text not null,
  destination_city text not null,
  material text,
  weight_mt numeric,
  pickup_date date,
  notes text,
  status text not null default 'submitted' check (status in ('draft','submitted','approved','rejected','in_transit','delivered')),
  created_at timestamptz default now()
);
```

### Existing RLS Policies ✅
- ✅ Admins can read all bookings
- ✅ Admins can update bookings (for status changes)
- ✅ Clients can read their own bookings
- ✅ Clients can insert new bookings

## Recommended Schema Enhancements 🚀

While the current schema works, here are **optional enhancements** to improve functionality:

### 1. Add More Tracking Fields (Optional)
```sql
-- Add these columns to bookings table for better tracking
alter table bookings
  add column if not exists updated_at timestamptz default now(),
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_reason text,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists shipment_id uuid references shipments(id);

-- Add trigger to auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_bookings_updated_at on bookings;
create trigger update_bookings_updated_at
  before update on bookings
  for each row
  execute function update_updated_at_column();
```

### 2. Add Estimated Cost Field (Optional)
```sql
-- Add estimated cost calculation
alter table bookings
  add column if not exists estimated_cost numeric,
  add column if not exists final_cost numeric,
  add column if not exists distance_km numeric;
```

### 3. Create Index for Better Performance (Recommended)
```sql
-- Already exists, but ensure these are present:
create index if not exists idx_bookings_client_created on bookings(client_id, created_at);
create index if not exists idx_bookings_user_created on bookings(user_id, created_at);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_pickup_date on bookings(pickup_date);
```

### 4. Add Booking-Shipment Link View (Optional Helper)
```sql
-- Create a view to easily join bookings with shipments
create or replace view booking_details as
select 
  b.*,
  s.id as shipment_id,
  s.truck_id,
  s.status as shipment_status,
  s.eta,
  s.delivered_at,
  t.plate as truck_plate,
  t.location as current_location
from bookings b
left join shipments s on b.client_id = s.client_id 
  and s.created_at >= b.created_at
  and b.status in ('approved', 'in_transit', 'delivered')
left join trucks t on s.truck_id = t.id
order by b.created_at desc;

-- Grant access to the view
grant select on booking_details to authenticated;
```

### 5. Add Notification Trigger (Optional)
```sql
-- Notify clients when booking status changes
create or replace function notify_booking_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into notifications (user_id, type, channel, payload, status)
    values (
      new.user_id,
      'system',
      'inapp',
      jsonb_build_object(
        'message', 'Your booking status changed from ' || old.status || ' to ' || new.status,
        'bookingId', new.id,
        'status', new.status
      ),
      'queued'
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists booking_status_notification on bookings;
create trigger booking_status_notification
  after update on bookings
  for each row
  when (old.status is distinct from new.status)
  execute function notify_booking_status_change();
```

## What to Run in Supabase SQL Editor

### Minimal (Recommended) ⭐
Just add indexes for better performance:
```sql
create index if not exists idx_bookings_user_created on bookings(user_id, created_at);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_pickup_date on bookings(pickup_date);
```

### Full Enhancement (Optional) 🚀
Run all the enhancements above for maximum functionality:
1. Additional tracking fields
2. Cost calculation fields  
3. Performance indexes
4. Booking details view
5. Status change notifications

## Testing Queries

### For Clients
```sql
-- Test: Get all bookings for a client
select * from bookings
where user_id = auth.uid()
order by created_at desc;

-- Test: Get active bookings
select * from bookings
where user_id = auth.uid()
  and status in ('submitted', 'approved', 'in_transit')
order by created_at desc;

-- Test: Get past bookings
select * from bookings
where user_id = auth.uid()
  and status in ('delivered', 'rejected')
order by created_at desc;
```

### For Admins
```sql
-- Test: Get all pending bookings
select * from bookings
where status = 'submitted'
order by created_at asc;

-- Test: Approve a booking
update bookings
set status = 'approved',
    approved_at = now(),
    approved_by = auth.uid()
where id = '<booking-id>';
```

## Summary

✅ **Your current schema already supports the bookings page!**

The bookings page I created will work with your existing schema. The optional enhancements above will:
- Improve tracking and audit trail
- Enable cost estimation
- Speed up queries with indexes
- Provide real-time notifications
- Make it easier to link bookings with shipments

You can start using the bookings page immediately with your current schema, and add enhancements incrementally as needed.
