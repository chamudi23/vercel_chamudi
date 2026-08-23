-- ============================================================================
--  OAHRIS Access Control — Phase 0: PREFLIGHT & SNAPSHOT
--
--  RUN THIS FIRST. Run it on its own, read the output, and only continue if
--  you are happy with what it reports.
--
--  WHY THIS EXISTS
--  ---------------
--  Supabase's free plan has no on-demand backups, so there is no "restore the
--  whole database" button to fall back on. This script is the substitute: it
--  records precisely the things the later scripts change — policy definitions,
--  grants, function bodies and row counts — into a snapshot table, so they can
--  be put back by 99_rollback.sql.
--
--  It is the safest script in the set:
--    - it reads everything and changes nothing except creating its own
--      snapshot table;
--    - it touches no existing table, policy, function or row;
--    - running it twice just takes a second snapshot.
--
--  It also reports COLLISIONS with anything already installed, which matters
--  here: a previous role-based-access feature (PR #25) was deployed to this
--  database and then reverted from the repository, so its database objects may
--  still be present while its code is gone.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Snapshot table
-- ----------------------------------------------------------------------------
create table if not exists public.access_control_snapshot (
  id          bigserial primary key,
  taken_at    timestamptz not null default now(),
  kind        text not null,          -- 'policy' | 'grant' | 'function' | 'rowcount' | 'column'
  object_name text not null,
  definition  text
);

comment on table public.access_control_snapshot is
  'Pre-change record of policies, grants, function bodies and row counts, '
  'taken by access_control/00_preflight.sql. Used by 99_rollback.sql. '
  'Safe to drop once the access-control work is settled and verified.';


-- ----------------------------------------------------------------------------
-- 2. Capture the current state
--    Every policy on every table the later scripts will touch, verbatim, so
--    it can be recreated exactly.
-- ----------------------------------------------------------------------------
insert into public.access_control_snapshot (kind, object_name, definition)
select
  'policy',
  format('%s.%s.%s', schemaname, tablename, policyname),
  format(
    'create policy %I on %I.%I as %s for %s to %s%s%s;',
    policyname, schemaname, tablename,
    case when permissive = 'PERMISSIVE' then 'permissive' else 'restrictive' end,
    cmd,
    array_to_string(roles, ', '),
    coalesce(' using (' || qual || ')', ''),
    coalesce(' with check (' || with_check || ')', '')
  )
from pg_policies
where schemaname in ('public', 'storage');

-- Grants held by anon and authenticated, so a revoke can be undone.
insert into public.access_control_snapshot (kind, object_name, definition)
select
  'grant',
  format('%s.%s', table_schema, table_name),
  format('grant %s on %I.%I to %I;', privilege_type, table_schema, table_name, grantee)
from information_schema.role_table_grants
where grantee in ('anon', 'authenticated')
  and table_schema = 'public';

-- Bodies of any function the later scripts CREATE OR REPLACE, so an existing
-- implementation can be restored rather than silently lost.
insert into public.access_control_snapshot (kind, object_name, definition)
select 'function', p.proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'handle_new_user', 'current_role', 'current_user_role',
    'is_admin', 'can_write_records', 'is_active_user', 'guard_profile_update'
  );

-- Row counts, so you can prove afterwards that no data was lost.
do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array[
    'specimens', 'measurements', 'skeletal_inputs', 'excavation_records',
    'laboratory_dating_results', 'sites', 'bone_images', 'image_annotations',
    'profiles'
  ] loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('select count(*) from public.%I', t) into n;
      insert into public.access_control_snapshot (kind, object_name, definition)
      values ('rowcount', t, n::text);
    end if;
  end loop;
end $$;


-- ============================================================================
--  3. COLLISION REPORT — read every line of this output
-- ============================================================================

-- 3a. Does public.profiles already exist, and with what shape?
select 'EXISTING profiles COLUMNS' as report,
       column_name,
       data_type,
       column_default,
       is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- 3b. What does its `status` CHECK constraint allow?
--     THIS IS THE CRITICAL ONE. A previously deployed feature used
--     ('pending','approved','rejected'); this project's scripts use
--     ('active','suspended'). They are incompatible, and 01 reconciles them.
select 'EXISTING CHECK CONSTRAINTS' as report,
       con.conname,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public' and rel.relname = 'profiles' and con.contype = 'c';

-- 3c. Which of "my" objects already exist (i.e. would be overwritten)?
select 'FUNCTION ALREADY EXISTS' as report, p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('handle_new_user', 'current_role', 'current_user_role',
                    'is_admin', 'can_write_records', 'is_active_user');

select 'TRIGGER ALREADY EXISTS' as report, tgname, c.relname as on_table
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and tgname in ('on_auth_user_created', 'profiles_guard_update');

-- 3d. Existing profiles rows. If this is > 0, STOP and reconcile by hand:
--     those users' status values must be migrated before locking down.
select 'EXISTING PROFILE ROWS' as report, count(*) as rows from public.profiles;

-- 3e. Tables the lockdown will affect, and how exposed they are today.
select 'CURRENT EXPOSURE' as report,
       tablename,
       count(*) filter (where 'anon' = any(roles))          as anon_policies,
       count(*) filter (where 'authenticated' = any(roles)) as authenticated_policies,
       count(*)                                             as total_policies
from pg_policies
where schemaname = 'public'
group by tablename
order by anon_policies desc, tablename;

-- 3f. What was captured.
select 'SNAPSHOT TAKEN' as report, kind, count(*) as entries
from public.access_control_snapshot
where taken_at > now() - interval '1 minute'
group by kind
order by kind;


-- ============================================================================
--  WHAT TO DO WITH THIS OUTPUT
--
--  - 3d shows rows > 0        -> STOP. Existing users must be reconciled
--                                before anything else; ask before continuing.
--  - 3b shows pending/approved-> expected; 01 reconciles it. Read 01 §0.
--  - 3c lists functions       -> they WILL be replaced. Their old definitions
--                                are now in the snapshot and restorable.
--  - 3e anon_policies > 0     -> the current wide-open state, as expected.
--
--  Nothing has been changed by this script. Continue with
--  01_identity_and_roles.sql only when the above looks as you expect.
-- ============================================================================
