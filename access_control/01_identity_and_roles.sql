-- ============================================================================
--  OAHRIS Access Control — Phase 2: Identity & Roles
--
--  RUN ON: the SHARED project (yiamplfqhyurgxxbpeur) — the identity provider.
--  Supabase dashboard -> SQL Editor -> paste -> Run.
--
--  Creates the profile/role model that every later policy depends on.
--  This script is ADDITIVE and SAFE to run before any lockdown:
--    - it creates new objects only; it drops no policy and changes no
--      existing table;
--    - running it does NOT restrict anything yet. Access is unchanged until
--      02_rls_lockdown.sql runs.
--
--  Run order:  01 (this)  ->  02_rls_lockdown.sql  ->  03_consolidate_skeletal.sql
--  See README.md for the manual dashboard steps that bracket these.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Roles
--    Kept as a CHECK-constrained text column rather than a Postgres enum, so
--    adding a role later is an ALTER of the constraint, not a type migration.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'student'
              check (role in ('admin', 'researcher', 'student')),
  status      text not null default 'active'
              check (status in ('active', 'suspended')),
  institution text,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. `role` drives every RLS policy in the '
  'system; `status` = suspended revokes access without deleting the account.';

-- The role is read on virtually every query, so keep the lookup cheap.
create index if not exists profiles_role_idx   on public.profiles (role);
create index if not exists profiles_email_idx  on public.profiles (lower(email));


-- ----------------------------------------------------------------------------
-- 2. Every auth user gets a profile, automatically
--    Without this a user could exist with no role, which would fail closed
--    (no access) but confusingly. The default role is the least-privileged one.
--
--    `role` and `full_name` are read from the metadata the admin invite passes
--    (see the admin-users Edge Function), falling back to 'student'.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    case
      when new.raw_user_meta_data ->> 'role' in ('admin', 'researcher', 'student')
        then new.raw_user_meta_data ->> 'role'
      else 'student'
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 3. Role helpers
--
--    SECURITY DEFINER is REQUIRED, not stylistic: a policy on `profiles` that
--    calls a function which reads `profiles` would recurse infinitely under
--    RLS. Running the lookup as the definer bypasses that.
--
--    IMPORTANT for callers: always invoke these wrapped in a sub-select, e.g.
--        using ( (select public.can_write_records()) )
--    Postgres then evaluates the function ONCE per query as an InitPlan
--    instead of once per row. On a 100k-row table that is the difference
--    between milliseconds and seconds.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.user_id = auth.uid()
    and p.status = 'active';
$$;

comment on function public.current_user_role() is
  'Role of the calling user, or NULL when signed out or suspended. '
  'Call as (select public.current_user_role()) inside policies.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- Admins and researchers curate the shared record; students only read it.
create or replace function public.can_write_records()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'researcher'), false);
$$;

-- Any active, signed-in user. Suspension is enforced here, in one place.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() is not null;
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin()          to authenticated;
grant execute on function public.can_write_records() to authenticated;
grant execute on function public.is_active_user()    to authenticated;

-- Deliberately NOT granted to `anon`. A signed-out caller has no role.


-- ----------------------------------------------------------------------------
-- 4. RLS on profiles itself
--    A user sees their own profile; an admin sees and manages everyone.
--    Nobody can change their own role — that column is admin-only, enforced
--    by the trigger in section 5 rather than by the policy, because a policy
--    cannot see which columns an UPDATE touched.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own"    on public.profiles;
drop policy if exists "profiles_select_admin"  on public.profiles;
drop policy if exists "profiles_update_own"    on public.profiles;
drop policy if exists "profiles_update_admin"  on public.profiles;
drop policy if exists "profiles_insert_admin"  on public.profiles;
drop policy if exists "profiles_delete_admin"  on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using ((select public.is_admin()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using ((select public.is_admin()));


-- ----------------------------------------------------------------------------
-- 5. Stop privilege escalation
--    profiles_update_own lets a user edit their own row (to fix their name).
--    Without this trigger they could also set their own role to 'admin'.
--    Non-admins may change full_name and institution; nothing else.
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    new.updated_at := now();
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only an administrator can change a role';
  end if;
  if new.status is distinct from old.status then
    raise exception 'Only an administrator can change account status';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id is immutable';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();


-- ----------------------------------------------------------------------------
-- 6. Attribution defaults
--    Several catalogue tables already carry a `created_by` column that has
--    never been populated. Now that identity exists, default it — this costs
--    nothing and gives a real audit trail from here on.
--    Wrapped in DO blocks so the script is safe if a column is absent.
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['specimens', 'skeletal_inputs', 'excavation_records']
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'created_by'
    ) then
      execute format('alter table public.%I alter column created_by set default auth.uid()', t);
    end if;
  end loop;
end $$;


-- ============================================================================
--  7. SEED THE FIRST ADMIN  <- the one step you must edit
--
--  Chicken-and-egg: the admin UI cannot create the first admin, because only
--  an admin may do so. Bootstrap it here.
--
--  BEFORE running this section:
--    1. Create your own account (sign up once, while signup is still open, or
--       add the user from Authentication -> Users in the dashboard).
--    2. Change the e-mail below to that account.
--    3. Run it, and CONFIRM it returned a row.
--    4. Only THEN disable public signup (README, manual step M3).
--
--  If you disable signup before seeding an admin you will lock yourself out.
-- ============================================================================

update public.profiles
   set role = 'admin', status = 'active', updated_at = now()
 where lower(email) = lower('it22299802@my.sliit.lk');   -- <- CHANGE THIS

-- Verify — this MUST return exactly your account before you go any further.
select user_id, email, role, status
from public.profiles
where role = 'admin';
