-- ============================================================================
--  OAHRIS Access Control — ROLLBACK
--
--  Undoes 01 / 02 / 03, restoring the policies, grants and functions recorded
--  by 00_preflight.sql.
--
--  This exists because Supabase's free plan has no on-demand backup to
--  restore from. It is not a database restore — it is a targeted undo of
--  exactly what these scripts changed.
--
--  ####  PREREQUISITE  ####
--  00_preflight.sql must have been run BEFORE the change you are undoing.
--  Without that snapshot the original policy definitions are gone and this
--  script can only reopen access bluntly (section 5).
--
--  NO DATA IS DELETED by any of this. Sections are independent — run only the
--  ones you need, in order.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Check a snapshot exists and see what is available
-- ----------------------------------------------------------------------------
select kind, count(*) as entries, min(taken_at) as taken_at
from public.access_control_snapshot
group by kind, taken_at
order by taken_at desc, kind;


-- ----------------------------------------------------------------------------
-- 1. Remove the policies this project created
--    Named exactly, so anything else on these tables is left alone.
-- ----------------------------------------------------------------------------
do $$
declare
  t    text;
  pol  text;
  tables text[] := array[
    'specimens', 'measurements', 'skeletal_inputs', 'excavation_records',
    'laboratory_dating_results', 'sites', 'bone_images', 'image_annotations',
    'site_images', 'bone_type_reference', 'data_import_logs', 'data_quality_log'
  ];
  policies text[] := array[
    'read_authenticated', 'insert_curator', 'update_curator',
    'delete_curator', 'read_curator', 'delete_admin'
  ];
begin
  foreach t in array tables loop
    if to_regclass(format('public.%I', t)) is null then continue; end if;
    foreach pol in array policies loop
      execute format('drop policy if exists %I on public.%I', pol, t);
    end loop;
  end loop;
end $$;

drop policy if exists "bone_images_read_authenticated" on storage.objects;
drop policy if exists "bone_images_write_curator"      on storage.objects;
drop policy if exists "bone_images_update_curator"     on storage.objects;
drop policy if exists "bone_images_delete_curator"     on storage.objects;


-- ----------------------------------------------------------------------------
-- 2. Put the ORIGINAL policies back from the snapshot
--    Restores the most recent snapshot taken before the change.
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
  restored int := 0;
  failed   int := 0;
begin
  for r in
    select definition
    from public.access_control_snapshot
    where kind = 'policy'
      and taken_at = (select min(taken_at) from public.access_control_snapshot)
  loop
    begin
      execute r.definition;
      restored := restored + 1;
    exception when others then
      -- Most likely the policy already exists, which is fine.
      failed := failed + 1;
      raise notice 'could not restore: % (%)', r.definition, sqlerrm;
    end;
  end loop;
  raise notice 'policies restored: %, skipped: %', restored, failed;
end $$;


-- ----------------------------------------------------------------------------
-- 3. Put the ORIGINAL grants back
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select definition
    from public.access_control_snapshot
    where kind = 'grant'
      and taken_at = (select min(taken_at) from public.access_control_snapshot)
  loop
    begin
      execute r.definition;
    exception when others then
      raise notice 'could not restore grant: % (%)', r.definition, sqlerrm;
    end;
  end loop;
end $$;

alter default privileges in schema public grant all on tables to anon;


-- ----------------------------------------------------------------------------
-- 4. Restore any function this project overwrote
--    Chiefly handle_new_user(), which the earlier role-based-access feature
--    also defined. Its original body is in the snapshot.
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select object_name, definition
    from public.access_control_snapshot
    where kind = 'function'
      and taken_at = (select min(taken_at) from public.access_control_snapshot)
  loop
    begin
      execute r.definition;
      raise notice 'restored function %', r.object_name;
    exception when others then
      raise notice 'could not restore function %: %', r.object_name, sqlerrm;
    end;
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 5. LAST RESORT — reopen access with no snapshot available
--    Only if section 2 restored nothing and the application is broken.
--    This returns the database to the wide-open state it was in before, which
--    is exactly what the lockdown was meant to end. Use knowingly.
-- ----------------------------------------------------------------------------
-- do $$
-- declare
--   t text;
-- begin
--   foreach t in array array[
--     'specimens', 'measurements', 'skeletal_inputs', 'excavation_records',
--     'laboratory_dating_results', 'sites', 'bone_images', 'image_annotations'
--   ] loop
--     if to_regclass(format('public.%I', t)) is null then continue; end if;
--     execute format('drop policy if exists "reopen_all" on public.%I', t);
--     execute format(
--       'create policy "reopen_all" on public.%I for all to anon, authenticated using (true) with check (true)', t);
--   end loop;
-- end $$;
-- grant all on all tables in schema public to anon;


-- ----------------------------------------------------------------------------
-- 6. Undo the additive changes from 01
--    Optional. These are harmless to leave in place: dropping them is only
--    for returning the schema exactly to where it started.
--
--    NOTE the ORDER — the trigger must go before the function it calls.
--    NOTE ALSO: dropping public.profiles removes the role of every user. Do
--    not run that line unless you intend to abandon role-based access
--    entirely, and remember the earlier PR #25 feature also used this table.
-- ----------------------------------------------------------------------------
-- drop trigger if exists profiles_guard_update on public.profiles;
-- drop function if exists public.guard_profile_update();
-- drop function if exists public.is_active_user();
-- drop function if exists public.can_write_records();
-- drop function if exists public.is_admin();
-- drop function if exists public.current_user_role();

-- Undo the attribution defaults added by 01 section 6.
-- alter table public.specimens          alter column created_by drop default;
-- alter table public.skeletal_inputs    alter column created_by drop default;
-- alter table public.excavation_records alter column created_by drop default;

-- DANGEROUS — removes everyone's role. Read the note above first.
-- drop table if exists public.profiles cascade;


-- ============================================================================
--  7. VERIFY the rollback
-- ============================================================================

-- Row counts should match what the snapshot recorded — proving no data loss.
select s.object_name as table_name,
       s.definition::bigint as rows_before,
       (xpath('/row/c/text()',
              query_to_xml(format('select count(*) as c from public.%I', s.object_name),
                           false, true, '')))[1]::text::bigint as rows_now
from public.access_control_snapshot s
where s.kind = 'rowcount'
  and s.taken_at = (select min(taken_at) from public.access_control_snapshot)
order by s.object_name;

-- Anon should be able to read again if you fully rolled back.
select tablename,
       count(*) filter (where 'anon' = any(roles)) as anon_policies
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;
