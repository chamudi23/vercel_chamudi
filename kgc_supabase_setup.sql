-- ============================================================================
--  OAHRIS — Skeletal Analysis: Supabase setup (run once)
--  Supabase dashboard → SQL Editor → paste everything → Run.
--
--  Creates:
--    1. analyses         — every saved skeletal analysis / report (shared)
--    2. course_progress  — per-learner Learning Path progress (per account)
--
--  After this, the app stores ALL data in Supabase (no browser storage).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. ANALYSES  (skeletal cases + reports)
--    The New Analysis flow runs without login (using the anon/publishable
--    key), so read/write is open to anon + authenticated. Tighten later if
--    you add login to the analysis flow.
-- ----------------------------------------------------------------------------
create table if not exists public.analyses (
  case_id      text primary key,
  basic_info   jsonb       not null default '{}'::jsonb,
  measurements jsonb       not null default '{}'::jsonb,
  predictions  jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

alter table public.analyses enable row level security;

drop policy if exists "analyses_read"   on public.analyses;
drop policy if exists "analyses_insert" on public.analyses;
drop policy if exists "analyses_update" on public.analyses;

create policy "analyses_read"   on public.analyses for select using (true);
create policy "analyses_insert" on public.analyses for insert with check (true);
create policy "analyses_update" on public.analyses for update using (true) with check (true);

-- Demo cases (skip silently if they already exist)
insert into public.analyses (case_id, basic_info, measurements, predictions, created_at) values
(
  'KGC-20260210-1042',
  '{"caseId":"KGC-20260210-1042","userName":"A N Perera","bonesType":"Skull","location":"Kottawa","dateFound":"2026-02-10","analysisDate":"2026-02-11","email":""}'::jsonb,
  '{"bonesType":"Skull","browRidge":"prominent","mastoidSize":"more-30mm","jawShape":"v-shaped","cranialSuture":"partially-open"}'::jsonb,
  '{"gender":"Male","ageRange":"25 - 35","height":"Unknown","confidence":"92.0%"}'::jsonb,
  '2026-02-10 09:15:00+00'
),
(
  'KGC-20260214-0387',
  '{"caseId":"KGC-20260214-0387","userName":"K Silva","bonesType":"Pelvis","location":"Anuradhapura","dateFound":"2026-02-14","analysisDate":"2026-02-15","email":""}'::jsonb,
  '{"bonesType":"Pelvis","subpubicAngle":"wide","sciaticNotch":"wide","pubicSymphysis":"rough-granular"}'::jsonb,
  '{"gender":"Female","ageRange":"40 - 55","height":"Unknown","confidence":"93.0%"}'::jsonb,
  '2026-02-14 11:40:00+00'
),
(
  'KGC-20260219-0725',
  '{"caseId":"KGC-20260219-0725","userName":"R Fernando","bonesType":"Lower Limb","location":"Polonnaruwa","dateFound":"2026-02-19","analysisDate":"2026-02-20","email":""}'::jsonb,
  '{"bonesType":"Lower Limb","femurLength":"450","femurHeadDiameter":"46","growthPlate":"fused"}'::jsonb,
  '{"gender":"Male","ageRange":"25+","height":"169.3 cm","confidence":"92.0%"}'::jsonb,
  '2026-02-19 14:05:00+00'
)
on conflict (case_id) do nothing;


-- ----------------------------------------------------------------------------
-- 2. COURSE_PROGRESS  (Learning Path — per authenticated learner)
--    RLS ensures each learner reads/writes only their own row.
-- ----------------------------------------------------------------------------
create table if not exists public.course_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  completed  jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.course_progress enable row level security;

drop policy if exists "course_progress_select_own" on public.course_progress;
drop policy if exists "course_progress_insert_own" on public.course_progress;
drop policy if exists "course_progress_update_own" on public.course_progress;

create policy "course_progress_select_own"
  on public.course_progress for select
  using (auth.uid() = user_id);

create policy "course_progress_insert_own"
  on public.course_progress for insert
  with check (auth.uid() = user_id);

create policy "course_progress_update_own"
  on public.course_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
