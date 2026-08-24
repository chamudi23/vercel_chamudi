-- ============================================================================
--  OAHRIS — Skeletal Analysis: Learner-Progress Admin setup (run once)
--
--  Supabase dashboard (the SKELETAL project, jlqnqzlvpljntpnbdaci)
--    → SQL Editor → paste everything → Run.
--
--  Adds the admin "learner progress" dashboard capability on top of the
--  existing course_progress table created by kgc_supabase_setup.sql.
--
--  This script is ADDITIVE and NON-BREAKING:
--    • it adds two NULLABLE columns — existing rows and existing inserts
--      keep working untouched;
--    • it ADDS a second SELECT policy. PostgreSQL OR-combines permissive
--      policies, so the existing "each learner sees only their own row"
--      rule is preserved exactly; admins simply also match;
--    • it drops nothing and renames nothing.
--
--  It touches ONLY the Skeletal Analysis project. It does not go near the
--  Centralized Specimen Record Management database.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Who the learner is
--    course_progress is keyed by auth user id, so an admin view would
--    otherwise show bare UUIDs. The client writes these two from the Google
--    profile on each save. Nullable: rows saved before this migration simply
--    show "—" until that learner next saves.
-- ----------------------------------------------------------------------------
alter table public.course_progress add column if not exists learner_email text;
alter table public.course_progress add column if not exists learner_name  text;


-- ----------------------------------------------------------------------------
-- 2. Admin allow-list
--    Being an admin is an explicit row here — there is no way to self-promote
--    from the app, because the app only ever holds the anon key and the
--    policy below permits SELECT only.
-- ----------------------------------------------------------------------------
create table if not exists public.course_admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  email    text,
  added_at timestamptz not null default now()
);

alter table public.course_admins enable row level security;

drop policy if exists "course_admins_select_own" on public.course_admins;

-- A signed-in user may check whether THEY are an admin (so the UI can show or
-- hide the dashboard link). Nobody can read the full list, or write to it,
-- from the app.
create policy "course_admins_select_own"
  on public.course_admins for select
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 3. Admin check helper
--    SECURITY DEFINER so evaluating it does not re-enter course_admins' own
--    RLS (which would recurse). STABLE so the planner calls it once per query.
-- ----------------------------------------------------------------------------
create or replace function public.is_course_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.course_admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_course_admin() to anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4. Let admins read every learner's progress
--    ADDITIVE: the existing course_progress_select_own policy stays exactly as
--    it is. Permissive policies are OR-ed, so a normal learner still sees only
--    their own row and an admin sees all rows.
--    Note there is deliberately no admin INSERT/UPDATE/DELETE policy — the
--    dashboard is read-only and cannot alter anyone's progress.
-- ----------------------------------------------------------------------------
drop policy if exists "course_progress_select_admin" on public.course_progress;

create policy "course_progress_select_admin"
  on public.course_progress for select
  using (public.is_course_admin());


-- ----------------------------------------------------------------------------
-- 5. Speed up the dashboard's "most recently active first" ordering
-- ----------------------------------------------------------------------------
create index if not exists course_progress_updated_at_idx
  on public.course_progress (updated_at desc);


-- ============================================================================
--  6. GRANT YOURSELF ADMIN  ← the one step you must edit
--
--  Sign in to the Learning Path with Google at least once first, so that your
--  account exists in auth.users. Then run ONE of these:
--
--    -- by email (easiest):
--    insert into public.course_admins (user_id, email)
--    select id, email from auth.users where email = 'you@example.com'
--    on conflict (user_id) do nothing;
--
--    -- or by user id, if you already know it:
--    -- insert into public.course_admins (user_id, email)
--    -- values ('00000000-0000-0000-0000-000000000000', 'you@example.com')
--    -- on conflict (user_id) do nothing;
--
--  To check who currently has admin (run as the SQL editor, which bypasses RLS):
--    select * from public.course_admins;
--
--  To revoke:
--    delete from public.course_admins where email = 'them@example.com';
-- ============================================================================

insert into public.course_admins (user_id, email)
select id, email from auth.users
where email = 'it22299802@my.sliit.lk'   -- ← CHANGE THIS to your Google address
on conflict (user_id) do nothing;
