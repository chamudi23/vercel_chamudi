-- ============================================================================
--  OAHRIS — Account Approval Workflow (run AFTER role_based_access_setup.sql)
--  Supabase dashboard → SQL Editor → paste everything → Run.
--
--  Adds a pending/approved/rejected status to each account. New sign-ups
--  now need an Admin to approve them (from the new Approvals page in the
--  app) before they can use the system at all — regardless of role.
--
--  Any profile that already exists at the time you run this (e.g. the
--  admin account you already created) is automatically grandfathered in
--  as 'approved', so you won't lock yourself out.
-- ============================================================================

alter table public.profiles
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- Grandfather in every account that already exists right now
update public.profiles set status = 'approved' where status = 'pending';

-- Admin needs to see every account (not just their own) to review requests
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
  on public.profiles for select
  using (public.current_role() = 'admin');

-- Admin needs to update other accounts' role/status to approve or reject them
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
