-- Wavloops V3 — migration #6.
-- Adds the `beat-covers` storage bucket so producers can upload a
-- custom artwork image for each beat (Upload Beat page → "+ ARTWORK"
-- button). Same RLS shape as `avatars` + `server-covers`:
--   - Public bucket — anyone with the URL can render the cover.
--   - Producer can CRUD files under their own auth.uid() folder.
--
-- HOW TO APPLY
-- ─────────────
-- Dashboard → SQL Editor → paste this file → Run. Idempotent.

insert into storage.buckets (id, name, public)
values ('beat-covers', 'beat-covers', true)
on conflict (id) do nothing;

drop policy if exists beat_covers_read_public on storage.objects;
create policy beat_covers_read_public on storage.objects
  for select to public
  using (bucket_id = 'beat-covers');

drop policy if exists beat_covers_insert_own on storage.objects;
create policy beat_covers_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'beat-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists beat_covers_update_own on storage.objects;
create policy beat_covers_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'beat-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists beat_covers_delete_own on storage.objects;
create policy beat_covers_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'beat-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
