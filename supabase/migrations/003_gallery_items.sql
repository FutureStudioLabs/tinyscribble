-- Gallery items: uploads linked to authenticated users for display in dashboard.
-- R2 key is stored; we serve via /api/media?key=...

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  r2_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists gallery_items_user_id_idx
  on public.gallery_items(user_id);

create index if not exists gallery_items_created_at_idx
  on public.gallery_items(created_at desc);

alter table public.gallery_items enable row level security;

drop policy if exists "gallery_items_select_own" on public.gallery_items;
create policy "gallery_items_select_own"
  on public.gallery_items for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "gallery_items_insert_own" on public.gallery_items;
create policy "gallery_items_insert_own"
  on public.gallery_items for insert
  to authenticated
  with check (user_id = auth.uid());

comment on table public.gallery_items is 'User uploads for gallery; r2_key is served via /api/media.';
