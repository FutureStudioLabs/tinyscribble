-- Run in Supabase SQL Editor (or supabase db push) before relying on paid-state tracking.
-- Links Stripe customer/subscription to the email used at Checkout.

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'incomplete',
  updated_at timestamptz not null default now(),
  unique (email)
);

create index if not exists billing_customers_email_lower_idx
  on public.billing_customers (lower(email));

alter table public.billing_customers enable row level security;

drop policy if exists "billing_customers_select_own" on public.billing_customers;

create policy "billing_customers_select_own"
  on public.billing_customers
  for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

comment on table public.billing_customers is 'Stripe subscription snapshot; upserted from checkout.session.completed webhook (service role).';
