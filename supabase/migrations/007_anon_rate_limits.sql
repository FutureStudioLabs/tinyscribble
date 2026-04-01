-- Tracks generation attempts by non-entitled (anonymous / unsubscribed) users.
-- Used to enforce the free limit: 3 generation runs per 24 h per device or IP.
-- Written exclusively via service-role key from API routes (no user session required).

create table if not exists public.anon_generation_attempts (
  id             uuid        default gen_random_uuid() primary key,
  fingerprint_id text,        -- FingerprintJS visitorId; null when JS was blocked
  ip             text,        -- cf-connecting-ip / x-forwarded-for; null when not available
  created_at     timestamptz default now() not null
);

comment on table public.anon_generation_attempts is
  'Rate-limit log for non-subscribed users. Rows older than 24 h are irrelevant and can be pruned.';

-- fast window lookup by fingerprint
create index if not exists anon_gen_attempts_fp_idx
  on public.anon_generation_attempts (fingerprint_id, created_at desc)
  where fingerprint_id is not null;

-- fast window lookup by IP
create index if not exists anon_gen_attempts_ip_idx
  on public.anon_generation_attempts (ip, created_at desc)
  where ip is not null;

-- RLS enabled; no public policies — only service-role bypasses RLS.
alter table public.anon_generation_attempts enable row level security;
