-- ============================================================================
--  OAHRIS — Role-Based Access Setup (Admin / Researcher / Student)
--  Supabase dashboard → SQL Editor → paste everything → Run.
--
--  Runs against the MAIN Supabase project (the one src/supabase.js points
--  to — same project as the `specimens` and `sites` tables). This is a
--  DIFFERENT Supabase project from the Skeletal Analysis module's own
--  project (src/lib/skeletalSupabase.js) — do not run this against that one.
--
--  Creates:
--    1. profiles           — one row per signed-up user, holding their role
--    2. specimens.created_by — tracks which researcher added each specimen
--    3. RLS policies        — enforce the role rules at the database level
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. PROFILES  (role per user)
--    New accounts default to 'student'. Promote a user to 'admin' or
--    'researcher' manually afterwards, e.g.:
--      update public.profiles set role = 'admin' where user_id = '<uuid>';
--    There is deliberately no self-service way to pick your own role at
--    sign-up — that would let anyone register as admin.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'student' check (role in ('admin', 'researcher', 'student')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Auto-create a 'student' profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used by the policies below, so a role check is one line everywhere
create or replace function public.current_role()
returns text
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid();
$$;


-- ----------------------------------------------------------------------------
-- 2. SPECIMENS — ownership column
--    Nullable and not backfilled: existing specimen rows keep created_by =
--    NULL (nobody "owns" pre-existing records except Admin, who can edit
--    everything regardless of ownership). No existing data is modified.
-- ----------------------------------------------------------------------------
alter table public.specimens
  add column if not exists created_by uuid references auth.users(id);


-- ----------------------------------------------------------------------------
-- 3. RLS — specimens
--    Read: any signed-in user (Admin, Researcher, Student).
--    Insert: Admin or Researcher only.
--    Update/Delete: Admin (any row), or Researcher on their OWN rows only.
-- ----------------------------------------------------------------------------
alter table public.specimens enable row level security;

drop policy if exists "specimens_select_authenticated" on public.specimens;
drop policy if exists "specimens_insert_admin_researcher" on public.specimens;
drop policy if exists "specimens_update_owner_or_admin" on public.specimens;
drop policy if exists "specimens_delete_owner_or_admin" on public.specimens;

create policy "specimens_select_authenticated"
  on public.specimens for select
  to authenticated
  using (true);

create policy "specimens_insert_admin_researcher"
  on public.specimens for insert
  to authenticated
  with check (public.current_role() in ('admin', 'researcher'));

create policy "specimens_update_owner_or_admin"
  on public.specimens for update
  to authenticated
  using (public.current_role() = 'admin' or created_by = auth.uid())
  with check (public.current_role() = 'admin' or created_by = auth.uid());

create policy "specimens_delete_owner_or_admin"
  on public.specimens for delete
  to authenticated
  using (public.current_role() = 'admin' or created_by = auth.uid());


-- ----------------------------------------------------------------------------
-- 4. RLS — sites
--    Read: any signed-in user. Write (insert/update/delete): Admin only,
--    matching "Add Site" being an Admin-only action in the app.
-- ----------------------------------------------------------------------------
alter table public.sites enable row level security;

drop policy if exists "sites_select_authenticated" on public.sites;
drop policy if exists "sites_insert_admin" on public.sites;
drop policy if exists "sites_update_admin" on public.sites;
drop policy if exists "sites_delete_admin" on public.sites;

create policy "sites_select_authenticated"
  on public.sites for select
  to authenticated
  using (true);

create policy "sites_insert_admin"
  on public.sites for insert
  to authenticated
  with check (public.current_role() = 'admin');

create policy "sites_update_admin"
  on public.sites for update
  to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "sites_delete_admin"
  on public.sites for delete
  to authenticated
  using (public.current_role() = 'admin');


-- ----------------------------------------------------------------------------
-- 5. ONE-TIME: create your 3 test accounts
--    1. Sign up normally through the app's new Login page for each test
--       account (they'll all default to role = 'student').
--    2. Then run this to promote the ones you want as admin/researcher
--       (find the uuid in Authentication → Users in the Supabase dashboard,
--       or query: select user_id, full_name, role from public.profiles;)
--
--    update public.profiles set role = 'admin'      where user_id = '<uuid-1>';
--    update public.profiles set role = 'researcher'  where user_id = '<uuid-2>';
--    -- leave the third account as the default 'student'
-- ----------------------------------------------------------------------------
