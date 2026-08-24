-- ============================================================================
-- OAHRIS Access Control - Repair catalogue attribution
--
-- Run this on the SHARED Supabase project (yiamplfqhyurgxxbpeur).
--
-- The deployed catalogue tables may currently have:
--   FOREIGN KEY (created_by) REFERENCES users(user_id)
--
-- The application identity model uses Supabase Auth, so catalogue attribution
-- must reference auth.users(id), just like specimens.created_by and the
-- access-control scripts expect.
-- ============================================================================

begin;

-- Remove the obsolete FK before replacing its target.
alter table public.skeletal_inputs
  drop constraint if exists skeletal_inputs_created_by_fkey;

alter table public.skeletal_inputs
  alter column created_by drop not null;

-- The deployed column is text because it previously referenced users(user_id).
-- Remove values that cannot be converted to Supabase Auth UUIDs first.
update public.skeletal_inputs si
set created_by = null
where si.created_by is not null
  and si.created_by !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Preserve legacy rows that contain a UUID from the old users table only when
-- that UUID is also a real account in Supabase Auth.
update public.skeletal_inputs si
set created_by = null
where si.created_by is not null
  and not exists (
    select 1
    from auth.users au
    where au.id = si.created_by::uuid
  );

alter table public.skeletal_inputs
  alter column created_by type uuid
  using created_by::uuid;

alter table public.skeletal_inputs
  add constraint skeletal_inputs_created_by_fkey
  foreign key (created_by)
  references auth.users(id)
  on delete set null;

alter table public.skeletal_inputs
  alter column created_by set default auth.uid();

-- Apply the same repair to excavation_records, which uses the same audit
-- column and may have been created from the legacy schema.
alter table public.excavation_records
  drop constraint if exists excavation_records_created_by_fkey;

alter table public.excavation_records
  alter column created_by drop not null;

update public.excavation_records er
set created_by = null
where er.created_by is not null
  and er.created_by !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

update public.excavation_records er
set created_by = null
where er.created_by is not null
  and not exists (
    select 1
    from auth.users au
    where au.id = er.created_by::uuid
  );

alter table public.excavation_records
  alter column created_by type uuid
  using created_by::uuid;

alter table public.excavation_records
  add constraint excavation_records_created_by_fkey
  foreign key (created_by)
  references auth.users(id)
  on delete set null;

alter table public.excavation_records
  alter column created_by set default auth.uid();

commit;

-- Verification:
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conname = 'skeletal_inputs_created_by_fkey';
-- Expected: FOREIGN KEY (created_by) REFERENCES auth.users(id)
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conname = 'excavation_records_created_by_fkey';
