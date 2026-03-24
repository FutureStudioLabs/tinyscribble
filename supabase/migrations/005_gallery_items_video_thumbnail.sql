-- Optional still image for video rows (CGI frame) so the gallery can show a fast <img> thumbnail
-- instead of relying on <video> first-frame decode (unreliable with preload=metadata on some hosts).

alter table public.gallery_items
  add column if not exists thumbnail_r2_key text;

comment on column public.gallery_items.thumbnail_r2_key is 'R2 key under generated/ — poster frame for videos/ items; served via /api/media.';

drop policy if exists "gallery_items_update_own" on public.gallery_items;
create policy "gallery_items_update_own"
  on public.gallery_items
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
