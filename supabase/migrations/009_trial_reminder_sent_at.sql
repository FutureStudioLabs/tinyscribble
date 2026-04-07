-- Track whether the trial-ending reminder email has been sent
-- so the cron job does not send duplicates.
alter table public.billing_customers
  add column if not exists trial_reminder_sent_at timestamptz;
