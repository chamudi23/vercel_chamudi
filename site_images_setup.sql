-- ============================================================================
--  OAHRIS — GIS Module: Site Images setup (run once)
--  Supabase dashboard → SQL Editor → paste everything → Run.
--
--  Creates:
--    1. Storage bucket "site-images" (public read, for site photographs)
--    2. sites.image_url — one photo per site, stored directly on the row
--       so the "Add/Edit Site" form (with an image upload field) can just
--       write to this single column.
--
--  How the upload form should use this:
--    1. Upload the chosen file to Storage bucket "site-images"
--       (supabase.storage.from('site-images').upload(fileName, file))
--    2. Get its public URL
--       (supabase.storage.from('site-images').getPublicUrl(fileName))
--    3. Save that URL into sites.image_url for the row being added/edited
--       (supabase.from('sites').update({ image_url: publicUrl }).eq('id', siteId))
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. STORAGE BUCKET
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "site_images_bucket_public_read" on storage.objects;
drop policy if exists "site_images_bucket_anon_insert"  on storage.objects;
drop policy if exists "site_images_bucket_anon_update"  on storage.objects;
drop policy if exists "site_images_bucket_anon_delete"  on storage.objects;

create policy "site_images_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'site-images');

create policy "site_images_bucket_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'site-images');

create policy "site_images_bucket_anon_update"
  on storage.objects for update
  using (bucket_id = 'site-images')
  with check (bucket_id = 'site-images');

create policy "site_images_bucket_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'site-images');


-- ----------------------------------------------------------------------------
-- 2. SITES.IMAGE_URL  (one photo per site)
-- ----------------------------------------------------------------------------
alter table public.sites add column if not exists image_url text;


-- ----------------------------------------------------------------------------
-- 3. EXAMPLE — after uploading a file in Storage → site-images, copy its
--    public URL (Storage → site-images → file → "Get URL") and run:
-- ----------------------------------------------------------------------------
-- update public.sites
-- set image_url = 'https://<project-ref>.supabase.co/storage/v1/object/public/site-images/sigiriya-1.jpg'
-- where site_name = 'Sigiriya';
