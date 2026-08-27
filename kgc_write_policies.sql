-- ================================================================
-- OAHRIS — Automated Skeletal Analysis (KGC)
-- Ensure the module can WRITE the normalised kgc_* tables
-- ================================================================
-- RUN ON: the shared project (yiamplfqhyurgxxbpeur), as the SQL editor.
--
-- WHEN YOU NEED THIS
-- ------------------
-- Only if Step 3 of a new analysis shows the amber warning
--
--     "The analysis was saved and the report is ready, but this case
--      could not be written to the normalised kgc_ tables: ..."
--
-- and the message mentions row-level security or a 42501 / PGRST301 code.
-- If new analyses already appear in kgc_cases, kgc_predictions and the
-- kgc_*_measurements tables, you do not need to run this.
--
-- WHY IT MIGHT BE NEEDED
-- ----------------------
-- kgc_database_schema.sql grants SELECT/INSERT/UPDATE on these tables to
-- the `authenticated` role. A PostgreSQL role does NOT inherit another
-- role's policies, so if the shared project ended up with only `anon`
-- policies on these tables — which is what a database that anonymous
-- clients can still read suggests — then a signed-in user is refused on
-- write even though an anonymous one can read.
--
-- These statements are the same policies kgc_database_schema.sql defines.
-- Dropping and recreating them by name is idempotent and does not touch
-- any policy the access-control lockdown added.
-- ================================================================


-- ----------------------------------------------------------------
-- 1. RLS must be on — the policies below are meaningless without it
-- ----------------------------------------------------------------
ALTER TABLE kgc_investigators       ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_cases               ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_skull_measurements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_pelvis_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_limb_measurements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_thorax_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_teeth_measurements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_predictions         ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------
-- 2. SELECT — saveKgcCase looks an investigator up before creating one
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "kgc_investigators_select" ON kgc_investigators;
CREATE POLICY "kgc_investigators_select" ON kgc_investigators
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "kgc_cases_select" ON kgc_cases;
CREATE POLICY "kgc_cases_select" ON kgc_cases
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "kgc_skull_select" ON kgc_skull_measurements;
CREATE POLICY "kgc_skull_select" ON kgc_skull_measurements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "kgc_pelvis_select" ON kgc_pelvis_measurements;
CREATE POLICY "kgc_pelvis_select" ON kgc_pelvis_measurements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "kgc_limb_select" ON kgc_limb_measurements;
CREATE POLICY "kgc_limb_select" ON kgc_limb_measurements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "kgc_thorax_select" ON kgc_thorax_measurements;
CREATE POLICY "kgc_thorax_select" ON kgc_thorax_measurements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "kgc_teeth_select" ON kgc_teeth_measurements;
CREATE POLICY "kgc_teeth_select" ON kgc_teeth_measurements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "kgc_predictions_select" ON kgc_predictions;
CREATE POLICY "kgc_predictions_select" ON kgc_predictions
    FOR SELECT TO authenticated USING (true);


-- ----------------------------------------------------------------
-- 3. INSERT — the first save of a case
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "kgc_investigators_insert" ON kgc_investigators;
CREATE POLICY "kgc_investigators_insert" ON kgc_investigators
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_cases_insert" ON kgc_cases;
CREATE POLICY "kgc_cases_insert" ON kgc_cases
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_skull_insert" ON kgc_skull_measurements;
CREATE POLICY "kgc_skull_insert" ON kgc_skull_measurements
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_pelvis_insert" ON kgc_pelvis_measurements;
CREATE POLICY "kgc_pelvis_insert" ON kgc_pelvis_measurements
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_limb_insert" ON kgc_limb_measurements;
CREATE POLICY "kgc_limb_insert" ON kgc_limb_measurements
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_thorax_insert" ON kgc_thorax_measurements;
CREATE POLICY "kgc_thorax_insert" ON kgc_thorax_measurements
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_teeth_insert" ON kgc_teeth_measurements;
CREATE POLICY "kgc_teeth_insert" ON kgc_teeth_measurements
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_predictions_insert" ON kgc_predictions;
CREATE POLICY "kgc_predictions_insert" ON kgc_predictions
    FOR INSERT TO authenticated WITH CHECK (true);


-- ----------------------------------------------------------------
-- 4. UPDATE — re-generating a report upserts the same case_id
-- ----------------------------------------------------------------
-- Without these, a second "Generate Report" for the same case is refused:
-- an upsert that hits the conflict has to UPDATE, and RLS checks the
-- UPDATE policy, not the INSERT one.

DROP POLICY IF EXISTS "kgc_cases_update" ON kgc_cases;
CREATE POLICY "kgc_cases_update" ON kgc_cases
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_skull_update" ON kgc_skull_measurements;
CREATE POLICY "kgc_skull_update" ON kgc_skull_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_pelvis_update" ON kgc_pelvis_measurements;
CREATE POLICY "kgc_pelvis_update" ON kgc_pelvis_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_limb_update" ON kgc_limb_measurements;
CREATE POLICY "kgc_limb_update" ON kgc_limb_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_thorax_update" ON kgc_thorax_measurements;
CREATE POLICY "kgc_thorax_update" ON kgc_thorax_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kgc_teeth_update" ON kgc_teeth_measurements;
CREATE POLICY "kgc_teeth_update" ON kgc_teeth_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- ================================================================
-- VERIFICATION
-- ================================================================
-- Every kgc_ table should list a policy for `authenticated` covering
-- SELECT and INSERT, and the case/measurement tables also UPDATE.

-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename LIKE 'kgc_%'
-- ORDER BY tablename, cmd;

-- Then record one analysis through the app and confirm it landed:

-- SELECT c.case_id, c.bone_type, c.status, p.predicted_sex, p.confidence
-- FROM kgc_cases c
-- LEFT JOIN kgc_predictions p ON p.case_id = c.case_id
-- ORDER BY c.created_at DESC
-- LIMIT 5;
-- ================================================================
