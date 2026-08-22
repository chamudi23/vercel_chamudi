-- ============================================================================
--  OAHRIS — GIS Module: Seed photos for well-known sites
--  Run AFTER site_images_setup.sql (needs sites.image_url to exist).
--  Supabase dashboard → SQL Editor → paste everything → Run.
--
--  Source: Wikimedia Commons (freely licensed, CC-BY / CC-BY-SA — keep the
--  "File:" page link below each row if you credit photographers in the UI).
--  Matches your sites by site_name, so no UUIDs to copy/paste by hand.
--  Safe to re-run — each UPDATE just sets the same value again.
-- ============================================================================

-- Sigiriya
-- Source: https://commons.wikimedia.org/wiki/File:Sigiriya_Rock_fortress.jpg
update public.sites
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/5/51/Sigiriya_Rock_fortress.jpg'
where site_name = 'Sigiriya';

-- Anuradhapura Sacred City
-- Source: https://commons.wikimedia.org/wiki/File:Ruwanweli_Maha_Seya_-_Anuradhapura.jpg
update public.sites
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Ruwanweli_Maha_Seya_-_Anuradhapura.jpg'
where site_name = 'Anuradhapura Sacred City';

-- Polonnaruwa Ancient City
-- Source: https://commons.wikimedia.org/wiki/File:Gal_Vihara_Polonnaruwa.jpg
update public.sites
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Gal_Vihara_Polonnaruwa.jpg'
where site_name = 'Polonnaruwa Ancient City';

-- Dambulla Cave Temple
-- Source: https://commons.wikimedia.org/wiki/File:Dhambulla_Cave_Interior.JPG
update public.sites
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Dhambulla_Cave_Interior.JPG'
where site_name = 'Dambulla Cave Temple';

-- Mihintale
-- Source: https://commons.wikimedia.org/wiki/File:The_Buddha_at_Mihintale,_Sri_Lanka.JPG
update public.sites
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/1/13/The_Buddha_at_Mihintale%2C_Sri_Lanka.JPG'
where site_name = 'Mihintale';

-- Yapahuwa
-- Source: https://commons.wikimedia.org/wiki/File:Yapahuwa_Rock_Fortress.jpg
update public.sites
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Yapahuwa_Rock_Fortress.jpg'
where site_name = 'Yapahuwa';

-- Tissamaharama
-- Source: https://commons.wikimedia.org/wiki/File:Tissamaharama_Stupa.JPG
update public.sites
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Tissamaharama_Stupa.JPG'
where site_name = 'Tissamaharama';

-- Batadombalena
-- Source: https://commons.wikimedia.org/wiki/File:Batadombalena.JPG
update public.sites
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Batadombalena.JPG'
where site_name = 'Batadombalena';

-- ----------------------------------------------------------------------------
-- Check what got set:
-- ----------------------------------------------------------------------------
-- select site_name, image_url from public.sites where image_url is not null order by site_name;

-- ----------------------------------------------------------------------------
-- Sites NOT covered above (no verified free image found — Fa Hien Cave /
-- Pahiyangala, Dorawaka Cave, Ibbankatuwa, Ranchamadama, Kaduwela,
-- Pomparippu, plus anything past the first ~15 in your 23-site table).
-- Run this to see the full list and set the rest yourself the same way
-- (Storage → site-images → upload → copy URL → update sites.image_url):
-- ----------------------------------------------------------------------------
-- select site_name, image_url from public.sites order by site_name;
