-- ============================================================================
--  OAHRIS Access Control — Phase 3: RLS Lockdown
--
--  RUN ON: the SHARED project (yiamplfqhyurgxxbpeur).
--  PREREQUISITE: 01_identity_and_roles.sql, and an admin account verified.
--
--  ####  THIS IS THE CUTOVER.  ####
--
--  Everything before this script is preparation and reversible in isolation.
--  After this runs, ALL FOUR MODULES require a login:
--    - the specimen form stops working anonymously
--    - GIS site creation stops working anonymously
--    - image upload stops working anonymously
--    - anonymous browsing of any record stops
--
--  Do not run it without the other module owners' agreement and a cutover
--  date. See ACCESS_CONTROL_PLAN.md section 1.
--
--  ---------------------------------------------------------------------------
--  WHY THE DROPS MATTER MORE THAN THE CREATES
--
--  PostgreSQL OR-combines PERMISSIVE policies. Adding a strict
--  "authenticated only" policy while an old "TO anon USING (true)" policy
--  still exists changes NOTHING — the anon policy keeps granting access and
--  the lockdown silently does nothing at all.
--
--  So the drops below are the security control. The creates merely restore
--  legitimate access on top. Section 6 verifies it actually took effect.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Helper: assert the prerequisites, so this cannot half-apply
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'can_write_records') then
    raise exception 'Run 01_identity_and_roles.sql first (can_write_records() missing)';
  end if;
  if not exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'No admin profile exists. Seed one (01 section 7) before locking down, or you will be locked out.';
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 1. Drop EVERY existing policy on the tables we are securing
--
--    Done programmatically rather than by name: policies have accumulated from
--    several setup scripts over the project's life and listing them by hand
--    would certainly miss some. Missing one silently defeats the lockdown.
-- ----------------------------------------------------------------------------
do $$
declare
  target_tables text[] := array[
    'specimens', 'measurements', 'skeletal_inputs', 'excavation_records',
    'laboratory_dating_results', 'sites', 'bone_images', 'image_annotations',
    'data_import_logs', 'data_quality_log', 'site_images', 'bone_type_reference',
    'storage_locations'
  ];
  t    text;
  pol  record;
begin
  foreach t in array target_tables loop
    if to_regclass(format('public.%I', t)) is null then
      raise notice 'skipping %, not present in this project', t;
      continue;
    end if;

    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
      raise notice 'dropped policy % on %', pol.policyname, t;
    end loop;

    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 2. Curated records — everyone signed in reads; only admin/researcher writes
--
--    This is the rule from your brief: "researchers and admins can add data to
--    the Centralized Specimen Record Management system, students will only be
--    able to see the already entered data."
-- ----------------------------------------------------------------------------
do $$
declare
  curated text[] := array[
    'specimens', 'measurements', 'skeletal_inputs', 'excavation_records',
    'laboratory_dating_results', 'sites', 'bone_images', 'image_annotations',
    'site_images', 'bone_type_reference', 'storage_locations'
  ];
  t text;
begin
  foreach t in array curated loop
    if to_regclass(format('public.%I', t)) is null then continue; end if;

    -- READ: any active signed-in user, whatever their role.
    execute format($f$
      create policy "read_authenticated" on public.%I
        for select to authenticated
        using ((select public.is_active_user()))
    $f$, t);

    -- WRITE: admin + researcher only.
    execute format($f$
      create policy "insert_curator" on public.%I
        for insert to authenticated
        with check ((select public.can_write_records()))
    $f$, t);

    execute format($f$
      create policy "update_curator" on public.%I
        for update to authenticated
        using ((select public.can_write_records()))
        with check ((select public.can_write_records()))
    $f$, t);

    execute format($f$
      create policy "delete_curator" on public.%I
        for delete to authenticated
        using ((select public.can_write_records()))
    $f$, t);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 3. Operational logs — curators write, admins read
--    These record who imported or corrected what; students have no interest
--    in them and no business reading them.
-- ----------------------------------------------------------------------------
do $$
declare
  logs text[] := array['data_import_logs', 'data_quality_log'];
  t text;
begin
  foreach t in array logs loop
    if to_regclass(format('public.%I', t)) is null then continue; end if;

    execute format($f$
      create policy "read_curator" on public.%I
        for select to authenticated
        using ((select public.can_write_records()))
    $f$, t);

    execute format($f$
      create policy "insert_curator" on public.%I
        for insert to authenticated
        with check ((select public.can_write_records()))
    $f$, t);

    execute format($f$
      create policy "delete_admin" on public.%I
        for delete to authenticated
        using ((select public.is_admin()))
    $f$, t);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 4. Revoke the anon role's table privileges outright
--
--    Defence in depth. Even if a permissive policy is added by mistake later,
--    `anon` has no underlying grant to exercise it with.
--
--    NOTE: `authenticated` keeps its grants — RLS is what constrains it.
-- ----------------------------------------------------------------------------
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

-- Keep future tables closed by default too.
alter default privileges in schema public revoke all on tables from anon;


-- ----------------------------------------------------------------------------
-- 5. Storage: the half that is usually forgotten
--
--    storage.objects has its OWN row-level security, completely separate from
--    the table policies above. Locking the tables down does nothing for the
--    image files in the `bone-images` bucket — they stay world-readable until
--    this runs.
--
--    Also set the bucket to non-public in the dashboard (README manual step
--    M4); a bucket flagged `public` bypasses these policies entirely.
-- ----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like '%bone%'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

drop policy if exists "bone_images_read_authenticated" on storage.objects;
drop policy if exists "bone_images_write_curator"      on storage.objects;
drop policy if exists "bone_images_update_curator"     on storage.objects;
drop policy if exists "bone_images_delete_curator"     on storage.objects;

create policy "bone_images_read_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'bone-images' and (select public.is_active_user()));

create policy "bone_images_write_curator" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bone-images' and (select public.can_write_records()));

create policy "bone_images_update_curator" on storage.objects
  for update to authenticated
  using (bucket_id = 'bone-images' and (select public.can_write_records()));

create policy "bone_images_delete_curator" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bone-images' and (select public.can_write_records()));


-- ============================================================================
--  6. VERIFY — read this output, do not assume
-- ============================================================================

-- 6a. Every secured table must have RLS enabled and NO policy granting `anon`.
select c.relname                                     as table_name,
       c.relrowsecurity                              as rls_enabled,
       count(p.policyname)                           as policies,
       count(*) filter (where 'anon' = any (p.roles)) as anon_policies_MUST_BE_0
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'specimens', 'measurements', 'skeletal_inputs', 'excavation_records',
    'laboratory_dating_results', 'sites', 'bone_images', 'image_annotations',
    'data_import_logs', 'data_quality_log', 'profiles'
  )
group by c.relname, c.relrowsecurity
order by c.relname;

-- 6b. Any remaining anon grant anywhere in public — must return zero rows.
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public';

-- 6c. The real test cannot be run here. From a terminal, with the anon key:
--       curl -s "https://<ref>.supabase.co/rest/v1/specimens?select=*&limit=1" \
--            -H "apikey: <ANON_KEY>"
--     It must return [] or a 401 — NOT data. If it returns rows, the lockdown
--     did not take effect; check 6a for a surviving anon policy.
--
--     access_matrix_test.mjs automates this and the per-role cases.
