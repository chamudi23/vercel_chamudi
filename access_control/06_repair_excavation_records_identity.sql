-- ============================================================================
-- OAHRIS Access Control - Repair excavation_records attribution
--
-- Run on the shared Supabase project (yiamplfqhyurgxxbpeur).
-- This migration is safe whether created_by is currently text or uuid.
-- ============================================================================

begin;

alter table public.excavation_records
  drop constraint if exists excavation_records_created_by_fkey;

alter table public.excavation_records
  alter column created_by drop not null;

do $$
declare
  created_by_type text;
begin
  select data_type
    into created_by_type
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'excavation_records'
     and column_name = 'created_by';

  if created_by_type = 'text' then
    execute $sql$
      update public.excavation_records
      set created_by = null
      where created_by is not null
        and created_by !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    $sql$;

    execute $sql$
      update public.excavation_records er
      set created_by = null
      where er.created_by is not null
        and not exists (
          select 1 from auth.users au where au.id = er.created_by::uuid
        )
    $sql$;

    execute 'alter table public.excavation_records alter column created_by type uuid using created_by::uuid';
  elsif created_by_type = 'uuid' then
    update public.excavation_records er
       set created_by = null
     where er.created_by is not null
       and not exists (
         select 1 from auth.users au where au.id = er.created_by
       );
  else
    raise exception 'Unexpected public.excavation_records.created_by type: %', created_by_type;
  end if;
end $$;

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
-- where conname = 'excavation_records_created_by_fkey';
-- Expected: FOREIGN KEY (created_by) REFERENCES auth.users(id)
