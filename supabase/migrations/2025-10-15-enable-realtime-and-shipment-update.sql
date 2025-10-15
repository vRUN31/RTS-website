-- Allow admins to update shipments (needed for start/end trip buttons)
drop policy if exists "shipments admin update" on public.shipments;
create policy "shipments admin update" on public.shipments 
  for update using (public.is_admin(auth.uid())) 
  with check (public.is_admin(auth.uid()));

-- Allow admins to insert notifications (for trip start/end notifications)
drop policy if exists "notifications admin insert" on public.notifications;
create policy "notifications admin insert" on public.notifications 
  for insert with check (public.is_admin(auth.uid()));
