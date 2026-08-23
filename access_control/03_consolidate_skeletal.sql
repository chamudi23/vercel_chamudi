-- ============================================================================
--  OAHRIS Access Control — Phase 1: Consolidate the Skeletal module
--
--  RUN ON: the SHARED project (yiamplfqhyurgxxbpeur).
--
--  WHY THIS EXISTS
--  ---------------
--  The project has two Supabase databases:
--      shared    yiamplfqhyurgxxbpeur   CSRM + GIS + Images  (3 of 4 modules)
--      skeletal  jlqnqzlvpljntpnbdaci   analyses, course_progress, course_admins
--
--  A JWT is signed with its own project's secret and is REJECTED by the other
--  project. So one login cannot authorise all four modules while the data is
--  split — no amount of frontend work can fix that. The Skeletal tables have
--  to live alongside the rest.
--
--  This script creates them here, already secured. Moving the DATA is a manual
--  export/import (section 4) because it crosses two databases.
--
--  AFTER this and the data move, set in .env.local:
--      VITE_SKELETAL_CONSOLIDATED=true
--  which points the Skeletal module's client at this project. Until that flag
--  is set the app keeps using the old project and nothing changes.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. analyses — saved skeletal cases
--    Readable by every signed-in user; students may create their own, which is
--    the point of giving them the analysis module.
-- ----------------------------------------------------------------------------
create table if not exists public.analyses (
  case_id      text primary key,
  basic_info   jsonb not null default '{}'::jsonb,
  measurements jsonb not null default '{}'::jsonb,
  predictions  jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null default auth.uid()
);

alter table public.analyses enable row level security;

drop policy if exists "analyses_read"          on public.analyses;
drop policy if exists "analyses_insert"        on public.analyses;
drop policy if exists "analyses_update"        on public.analyses;
drop policy if exists "analyses_update_owner"  on public.analyses;
drop policy if exists "analyses_delete_owner"  on public.analyses;

-- Read: any active user. Analyses are shared teaching/reference material.
create policy "analyses_read" on public.analyses
  for select to authenticated
  using ((select public.is_active_user()));

-- Create: any active user, students included.
create policy "analyses_insert" on public.analyses
  for insert to authenticated
  with check ((select public.is_active_user()));

-- Update/delete: your own case, or a curator's override.
-- created_by is null for rows migrated from before identity existed; those
-- stay curator-only, which is the safe default.
create policy "analyses_update_owner" on public.analyses
  for update to authenticated
  using (created_by = (select auth.uid()) or (select public.can_write_records()))
  with check (created_by = (select auth.uid()) or (select public.can_write_records()));

create policy "analyses_delete_owner" on public.analyses
  for delete to authenticated
  using (created_by = (select auth.uid()) or (select public.can_write_records()));

create index if not exists analyses_created_by_idx on public.analyses (created_by);
create index if not exists analyses_created_at_idx on public.analyses (created_at desc);


-- ----------------------------------------------------------------------------
-- 2. course_progress — per-learner Learning Path progress
--    Each learner reads/writes only their own row; admins may read all, which
--    is what the learner-progress dashboard needs.
-- ----------------------------------------------------------------------------
create table if not exists public.course_progress (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  completed     jsonb not null default '[]'::jsonb,
  learner_email text,
  learner_name  text,
  updated_at    timestamptz not null default now()
);

alter table public.course_progress enable row level security;

drop policy if exists "course_progress_select_own"   on public.course_progress;
drop policy if exists "course_progress_select_admin" on public.course_progress;
drop policy if exists "course_progress_insert_own"   on public.course_progress;
drop policy if exists "course_progress_update_own"   on public.course_progress;

create policy "course_progress_select_own" on public.course_progress
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "course_progress_select_admin" on public.course_progress
  for select to authenticated
  using ((select public.is_admin()));

create policy "course_progress_insert_own" on public.course_progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "course_progress_update_own" on public.course_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create index if not exists course_progress_updated_at_idx
  on public.course_progress (updated_at desc);


-- ----------------------------------------------------------------------------
-- 3. course_admins is RETIRED
--
--    It was a standalone allow-list created before this role model existed.
--    `role = 'admin'` in public.profiles now supersedes it, so there is exactly
--    one notion of "admin" in the system.
--
--    The learner-progress dashboard reads is_admin() instead. Nothing to
--    create here — this note exists so the retirement is deliberate and
--    recorded rather than an oversight.
--
--    On the OLD skeletal project, after the data move, you may drop it:
--      -- drop table if exists public.course_admins;
-- ----------------------------------------------------------------------------


-- ============================================================================
--  4. MOVING THE DATA  (manual — it crosses two databases)
--
--  4a. analyses — straightforward, no identity involved.
--
--      On the OLD skeletal project, SQL Editor:
--         select * from public.analyses;
--      Export the result as CSV, then import it into this project's
--      `analyses` table via Table Editor -> Import data from CSV.
--      Leave created_by empty; migrated rows become curator-editable.
--
--  4b. course_progress — READ THIS BEFORE YOU MIGRATE
--
--      course_progress is keyed by auth.users.id. Those ids belong to the OLD
--      project. Users re-created here get BRAND NEW ids, so a straight copy
--      would produce rows that match nobody and violate the FK.
--
--      Two honest options:
--
--      OPTION 1 (recommended for this project): accept the reset.
--        There is currently a negligible number of real learners. Do not
--        migrate the table; let learners re-take the course. Simple, no risk
--        of silently wrong data.
--
--      OPTION 2: remap by e-mail.
--        1. Export the old rows INCLUDING learner_email.
--        2. Create every user in this project first (via the admin UI).
--        3. Load the export into a staging table here, then:
--
--           insert into public.course_progress (user_id, completed, learner_email, learner_name)
--           select u.id, s.completed, s.learner_email, s.learner_name
--           from   staging_course_progress s
--           join   auth.users u on lower(u.email) = lower(s.learner_email)
--           on conflict (user_id) do update
--             set completed = excluded.completed;
--
--        Rows whose e-mail does not match a user here are silently skipped —
--        check the count afterwards:
--           select count(*) from staging_course_progress s
--           where not exists (select 1 from auth.users u
--                             where lower(u.email) = lower(s.learner_email));
--
--      Rows written before learner_email existed have no e-mail and CANNOT be
--      remapped by any means. They are lost either way; option 1 is honest
--      about that.
--
--  4c. Verify, then flip the flag:
--         select count(*) from public.analyses;
--         select count(*) from public.course_progress;
--      then set VITE_SKELETAL_CONSOLIDATED=true and redeploy.
-- ============================================================================
