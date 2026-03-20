-- Restore RLS after it was disabled in the dashboard.
-- Run: supabase db push   or paste into Supabase SQL Editor.

-- --- gallery_items ---
alter table public.gallery_items enable row level security;

drop policy if exists "gallery_items_select_own" on public.gallery_items;
create policy "gallery_items_select_own"
  on public.gallery_items
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "gallery_items_insert_own" on public.gallery_items;
create policy "gallery_items_insert_own"
  on public.gallery_items
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- --- billing_customers ---
alter table public.billing_customers enable row level security;

drop policy if exists "billing_customers_select_own" on public.billing_customers;
create policy "billing_customers_select_own"
  on public.billing_customers
  for select
  to authenticated
  using (
    lower(email) = lower(auth.jwt() ->> 'email')
    or auth_user_id = auth.uid()
  );
