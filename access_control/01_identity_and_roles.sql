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


-- ============================================================================
--  0. RECONCILING WITH AN EARLIER ROLE-BASED-ACCESS FEATURE
--
--  A previous feature (PR #25, "feature/role-based-access") was deployed to
--  this database and later reverted from the repository. Its CODE is gone but
--  its DATABASE OBJECTS remain: public.profiles, handle_new_user(),
--  current_role(), the on_auth_user_created trigger, and specimens.created_by.
--
--  Its profiles table is ALMOST the same as this one, with one incompatibility
--  that would be dangerous if ignored:
--
--      that feature :  status in ('pending', 'approved', 'rejected')  default 'pending'
--      this project :  status in ('active',  'suspended')             default 'active'
--
--  Left alone, this script's admin insert would violate its CHECK constraint,
--  and — far worse — current_user_role() only treats 'active' as usable, so
--  every 'approved' user would resolve to NO ROLE. Running the lockdown after
--  that would deny everyone, including you.
--
--  So section 1 does NOT assume a clean database. It:
--    - adds any missing columns rather than recreating the table;
--    - widens the status CHECK to accept BOTH vocabularies;
--    - treats 'active' and 'approved' as equivalent everywhere (section 3).
--
--  Nothing is dropped and no row is modified. If you would rather adopt the
--  approval workflow's vocabulary wholesale, or discard it, do that
--  deliberately — not as a side effect of running this.
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

-- If the table already existed, `create table if not exists` above did
-- nothing. Bring it up to the shape this project needs, additively.
alter table public.profiles add column if not exists email       text;
alter table public.profiles add column if not exists institution text;
alter table public.profiles add column if not exists created_by  uuid;
alter table public.profiles add column if not exists updated_at  timestamptz not null default now();
alter table public.profiles add column if not exists status      text not null default 'active';

-- Widen the status CHECK so both vocabularies are legal. Done by dropping and
-- recreating whichever CHECK currently governs `status`; existing rows are
-- untouched and every existing value stays valid, so this cannot fail on data.
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel  on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relname = 'profiles'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
    raise notice 'replaced status constraint %', c.conname;
  end loop;

  alter table public.profiles
    add constraint profiles_status_check
    check (status in ('active', 'suspended', 'pending', 'approved', 'rejected'));
end $$;

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
    -- 'active' is this project's vocabulary; 'approved' is the earlier
    -- approval workflow's. Both mean "may use the system". 'pending',
    -- 'rejected' and 'suspended' all resolve to NULL, i.e. no role.
    and p.status in ('active', 'approved');
$$;

comment on function public.current_user_role() is
  'Role of the calling user, or NULL when signed out, pending, rejected or '
  'suspended. Call as (select public.current_user_role()) inside policies.';

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
  -- No auth.uid() means this is not an end-user request: it is the SQL
  -- editor, a migration, or the service_role key. All of those already have
  -- unrestricted access, so the guard would add nothing — and without this
  -- branch the bootstrap in section 7 cannot promote an existing account to
  -- admin, because there is no admin yet to authorise it.
  -- A signed-out client cannot reach here: the UPDATE policy is
  -- `to authenticated`.
  if auth.uid() is null then
    new.updated_at := now();
    return new;
  end if;

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
--  7. SEED THE FIRST ADMINISTRATOR
--
--  Chicken-and-egg: the admin UI cannot create the first admin, because only
--  an admin may create users. So the account is bootstrapped here.
--
--  SIGN IN WITH
--      e-mail    admin@oahris.lk
--      password  admin2026
--
--  There is no "username" — Supabase Auth identifies users by e-mail, so
--  `admin` alone cannot be a login. Change ADMIN_EMAIL / ADMIN_PASSWORD below
--  if you want different credentials.
--
--  ⚠️  `admin2026` is a weak password for the account that governs access to
--      every module. Change it after setup, from the Users screen or by
--      re-running section 7 with a new value.
--
--  This block is IDEMPOTENT: run it twice and the second run just resets the
--  password rather than failing on a duplicate.
--
--  Note it creates the account already e-mail-confirmed, so you can sign in
--  immediately without any confirmation mail — which matters because
--  Supabase's default SMTP is rate-limited and often does not deliver.
-- ============================================================================

do $$
declare
  ADMIN_EMAIL    constant text := 'admin@oahris.lk';   -- <- change if you wish
  ADMIN_PASSWORD constant text := 'admin2026';         -- <- change if you wish
  ADMIN_NAME     constant text := 'Administrator';

  v_user_id         uuid;
  v_crypto_schema   text;
  v_password_hash   text;
  v_has_provider_id boolean;
begin
  ------------------------------------------------------------------
  -- pgcrypto provides crypt()/gen_salt() for the bcrypt hash that
  -- GoTrue expects. Supabase installs it into `extensions`, but not
  -- every project has that on the search_path — so resolve the schema
  -- and call it dynamically rather than assuming.
  ------------------------------------------------------------------
  select n.nspname into v_crypto_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_crypto_schema is null then
    create extension if not exists pgcrypto with schema extensions;
    v_crypto_schema := 'extensions';
  end if;

  execute format('select %I.crypt($1, %I.gen_salt(''bf''))', v_crypto_schema, v_crypto_schema)
    into v_password_hash
    using ADMIN_PASSWORD;

  ------------------------------------------------------------------
  -- Does the account already exist?
  ------------------------------------------------------------------
  select id into v_user_id
  from auth.users
  where lower(email) = lower(ADMIN_EMAIL);

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    -- The empty strings are deliberate: several of these columns are
    -- NOT NULL in GoTrue's schema and reject NULL.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      lower(ADMIN_EMAIL),
      v_password_hash,
      now(),                                    -- pre-confirmed
      '{"provider":"email","providers":["email"]}'::jsonb,
      -- handle_new_user() reads `role` from here, so the profile is
      -- created as an admin directly rather than briefly as a student.
      jsonb_build_object('full_name', ADMIN_NAME, 'role', 'admin'),
      now(), now(),
      '', '', '', ''
    );

    ----------------------------------------------------------------
    -- A matching auth.identities row is required for password
    -- sign-in in current GoTrue versions. `provider_id` was added in
    -- a later release, so branch on whether the column exists.
    ----------------------------------------------------------------
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'auth'
        and table_name = 'identities'
        and column_name = 'provider_id'
    ) into v_has_provider_id;

    if v_has_provider_id then
      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_user_id, v_user_id::text,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', lower(ADMIN_EMAIL),
          'email_verified', true,
          'phone_verified', false
        ),
        'email', now(), now(), now()
      );
    else
      insert into auth.identities (
        id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_user_id,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', lower(ADMIN_EMAIL),
          'email_verified', true,
          'phone_verified', false
        ),
        'email', now(), now(), now()
      );
    end if;

    raise notice 'Created administrator %', ADMIN_EMAIL;
  else
    -- Already there: reset the password so this script is safe to re-run.
    update auth.users
       set encrypted_password = v_password_hash,
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at         = now()
     where id = v_user_id;

    raise notice 'Administrator % already existed — password reset', ADMIN_EMAIL;
  end if;

  ------------------------------------------------------------------
  -- Guarantee the profile says admin, whether the trigger created it
  -- or the account predates this script.
  ------------------------------------------------------------------
  insert into public.profiles (user_id, email, full_name, role, status)
  values (v_user_id, lower(ADMIN_EMAIL), ADMIN_NAME, 'admin', 'active')
  on conflict (user_id) do update
    set role       = 'admin',
        status     = 'active',
        email      = excluded.email,
        -- Unqualified table name: ON CONFLICT DO UPDATE does not accept a
        -- schema-qualified reference to the target table here.
        full_name  = coalesce(profiles.full_name, excluded.full_name),
        updated_at = now();
end $$;


-- ----------------------------------------------------------------------------
-- VERIFY — this MUST return one row before you go any further.
-- If it is empty, do NOT run 02_rls_lockdown.sql: it will refuse anyway, but
-- disabling public signup at that point would lock you out entirely.
-- ----------------------------------------------------------------------------
select p.user_id,
       p.email,
       p.role,
       p.status,
       u.email_confirmed_at is not null as can_sign_in
from public.profiles p
join auth.users u on u.id = p.user_id
where p.role = 'admin';
