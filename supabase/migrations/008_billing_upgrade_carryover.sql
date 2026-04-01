-- Carry unused scene/video allowance when upgrading to a higher paid tier within the same Stripe billing period.

alter table public.billing_customers
  add column if not exists upgrade_scene_bonus integer not null default 0,
  add column if not exists upgrade_video_bonus integer not null default 0,
  add column if not exists last_stripe_plan_price_id text,
  add column if not exists billing_period_end_at timestamptz;

comment on column public.billing_customers.upgrade_scene_bonus is
  'Extra scene credits from the previous paid tier''s unused allowance until the Stripe period ends.';
comment on column public.billing_customers.upgrade_video_bonus is
  'Extra video credits from the previous paid tier''s unused allowance until the Stripe period ends.';
comment on column public.billing_customers.last_stripe_plan_price_id is
  'Stripe Price id of the plan line item after the last sync; used to detect tier changes.';
comment on column public.billing_customers.billing_period_end_at is
  'End of current Stripe billing period (ISO); when it changes, carryover bonuses reset.';
