-- When set, paid monthly video/scene counts only include gallery rows with created_at >= this time.
-- Set once on trialing → active (early Starter upgrade) so trial usage does not consume Starter credits.

alter table public.billing_customers
  add column if not exists paid_quota_reset_at timestamptz null;

comment on column public.billing_customers.paid_quota_reset_at is
  'Start of paid monthly quota window after trial; set once when subscription becomes active from trialing.';
