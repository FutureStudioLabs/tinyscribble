-- Link billing to Supabase auth so entitlement works even if Stripe email ≠ login email.
-- Run in Supabase SQL Editor or `supabase db push`.

alter table public.billing_customers
  add column if not exists auth_user_id uuid;

create index if not exists billing_customers_auth_user_id_idx
  on public.billing_customers (auth_user_id)
  where auth_user_id is not null;

drop policy if exists "billing_customers_select_own" on public.billing_customers;

create policy "billing_customers_select_own"
  on public.billing_customers
  for select
  to authenticated
  using (
    lower(email) = lower(auth.jwt() ->> 'email')
    or auth_user_id = auth.uid()
  );

comment on column public.billing_customers.auth_user_id is 'Set from Stripe checkout metadata (supabase_user_id); RLS allows select by auth.uid().';
