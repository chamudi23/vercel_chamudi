-- ============================================
-- ANON (public) ACCESS POLICIES for KGC tables
-- ============================================
-- Run this AFTER running kgc_database_schema.sql
-- Needed because the app uses the anon key (no auth)

-- SELECT
CREATE POLICY "kgc_anon_select_investigators" ON kgc_investigators FOR SELECT TO anon USING (true);
CREATE POLICY "kgc_anon_select_cases" ON kgc_cases FOR SELECT TO anon USING (true);
CREATE POLICY "kgc_anon_select_skull" ON kgc_skull_measurements FOR SELECT TO anon USING (true);
CREATE POLICY "kgc_anon_select_pelvis" ON kgc_pelvis_measurements FOR SELECT TO anon USING (true);
CREATE POLICY "kgc_anon_select_limb" ON kgc_limb_measurements FOR SELECT TO anon USING (true);
CREATE POLICY "kgc_anon_select_thorax" ON kgc_thorax_measurements FOR SELECT TO anon USING (true);
CREATE POLICY "kgc_anon_select_teeth" ON kgc_teeth_measurements FOR SELECT TO anon USING (true);
CREATE POLICY "kgc_anon_select_predictions" ON kgc_predictions FOR SELECT TO anon USING (true);
CREATE POLICY "kgc_anon_select_images" ON kgc_case_images FOR SELECT TO anon USING (true);

-- INSERT
CREATE POLICY "kgc_anon_insert_investigators" ON kgc_investigators FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kgc_anon_insert_cases" ON kgc_cases FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kgc_anon_insert_skull" ON kgc_skull_measurements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kgc_anon_insert_pelvis" ON kgc_pelvis_measurements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kgc_anon_insert_limb" ON kgc_limb_measurements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kgc_anon_insert_thorax" ON kgc_thorax_measurements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kgc_anon_insert_teeth" ON kgc_teeth_measurements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kgc_anon_insert_predictions" ON kgc_predictions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "kgc_anon_insert_images" ON kgc_case_images FOR INSERT TO anon WITH CHECK (true);

-- UPDATE
CREATE POLICY "kgc_anon_update_cases" ON kgc_cases FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "kgc_anon_update_skull" ON kgc_skull_measurements FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "kgc_anon_update_pelvis" ON kgc_pelvis_measurements FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "kgc_anon_update_limb" ON kgc_limb_measurements FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "kgc_anon_update_thorax" ON kgc_thorax_measurements FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "kgc_anon_update_teeth" ON kgc_teeth_measurements FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- DELETE
CREATE POLICY "kgc_anon_delete_cases" ON kgc_cases FOR DELETE TO anon USING (true);
CREATE POLICY "kgc_anon_delete_skull" ON kgc_skull_measurements FOR DELETE TO anon USING (true);
CREATE POLICY "kgc_anon_delete_pelvis" ON kgc_pelvis_measurements FOR DELETE TO anon USING (true);
CREATE POLICY "kgc_anon_delete_limb" ON kgc_limb_measurements FOR DELETE TO anon USING (true);
CREATE POLICY "kgc_anon_delete_thorax" ON kgc_thorax_measurements FOR DELETE TO anon USING (true);
CREATE POLICY "kgc_anon_delete_teeth" ON kgc_teeth_measurements FOR DELETE TO anon USING (true);
CREATE POLICY "kgc_anon_delete_predictions" ON kgc_predictions FOR DELETE TO anon USING (true);
CREATE POLICY "kgc_anon_delete_images" ON kgc_case_images FOR DELETE TO anon USING (true);
