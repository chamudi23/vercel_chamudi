-- ================================================================
-- OAHRIS — Automated Skeletal Analysis Module
-- Supabase SQL Schema (PostgreSQL)
-- ================================================================
-- Module Owner : Chamudi (IT22299802)
-- Module       : Automated Skeletal Analysis (KGC)
-- Prefix       : kgc_  (all tables prefixed to avoid conflicts)
-- Date         : May 2026
--
-- IMPORTANT: This SQL ONLY creates tables for the Automated
-- Skeletal Analysis module. It does NOT touch tables belonging to:
--   • Data Integration & Management  (Minuri / IT22159908)
--   • GIS & Spatial Analysis         (Parami / IT22889874)
--   • Skeletal Image Documentation   (Ilshan / IT21824210)
-- ================================================================


-- ============================================
-- 1. INVESTIGATORS
-- ============================================
-- Stores forensic investigators/analysts who perform skeletal analysis.

CREATE TABLE IF NOT EXISTS kgc_investigators (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    role            VARCHAR(50) DEFAULT 'analyst'
                    CHECK (role IN ('analyst', 'supervisor', 'admin')),
    institution     VARCHAR(200),
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_investigators IS 'KGC Module: Forensic investigators who conduct skeletal analyses';


-- ============================================
-- 2. CASES (Primary Table)
-- ============================================
-- Each row = one skeletal analysis case.
-- case_id format: KGC-YYYYMMDD-XXXX (auto-generated in frontend)

CREATE TABLE IF NOT EXISTS kgc_cases (
    case_id         VARCHAR(20) PRIMARY KEY,
    investigator_id UUID REFERENCES kgc_investigators(id) ON DELETE SET NULL,
    bone_type       VARCHAR(20) NOT NULL
                    CHECK (bone_type IN (
                        'Skull', 'Pelvis', 'Lower Limb',
                        'Upper Limb', 'Thorax', 'Teeth'
                    )),
    location        VARCHAR(200) NOT NULL,
    date_found      DATE NOT NULL,
    analysis_date   DATE DEFAULT CURRENT_DATE,
    status          VARCHAR(20) DEFAULT 'draft'
                    CHECK (status IN (
                        'draft', 'in_progress', 'completed', 'archived'
                    )),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_cases IS 'KGC Module: Primary case records for skeletal analysis';


-- ============================================
-- 3. SKULL MEASUREMENTS
-- ============================================
-- Cranial morphoscopic observations
-- Reference: Bass (2005) — The Skull

CREATE TABLE IF NOT EXISTS kgc_skull_measurements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         VARCHAR(20) UNIQUE NOT NULL
                    REFERENCES kgc_cases(case_id) ON DELETE CASCADE,
    brow_ridge      VARCHAR(20)
                    CHECK (brow_ridge IN (
                        'smooth', 'less-developed', 'moderate',
                        'prominent', 'thick'
                    )),
    mastoid_size    VARCHAR(20)
                    CHECK (mastoid_size IN (
                        'less-25mm', '25-30mm', 'more-30mm'
                    )),
    jaw_shape       VARCHAR(20)
                    CHECK (jaw_shape IN (
                        'u-shaped', 'v-shaped', 'robust', 'rounded'
                    )),
    cranial_suture  VARCHAR(30)
                    CHECK (cranial_suture IN (
                        'open', 'partially-open', 'moderate-closure',
                        'mostly-closed', 'completely-closed'
                    )),
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_skull_measurements IS 'KGC Module: Skull measurement data per case';


-- ============================================
-- 4. PELVIS MEASUREMENTS
-- ============================================
-- Innominate observations
-- Reference: Bass (2005) — The Innominate (Os Coxa)

CREATE TABLE IF NOT EXISTS kgc_pelvis_measurements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         VARCHAR(20) UNIQUE NOT NULL
                    REFERENCES kgc_cases(case_id) ON DELETE CASCADE,
    subpubic_angle  VARCHAR(10)
                    CHECK (subpubic_angle IN ('wide', 'narrow')),
    sciatic_notch   VARCHAR(10)
                    CHECK (sciatic_notch IN ('wide', 'narrow')),
    pubic_symphysis VARCHAR(30)
                    CHECK (pubic_symphysis IN (
                        'smooth-flat', 'moderate-flat-ridges',
                        'rough-granular', 'degenerated-eroded'
                    )),
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_pelvis_measurements IS 'KGC Module: Pelvis measurement data per case';


-- ============================================
-- 5. LIMB MEASUREMENTS (Lower + Upper)
-- ============================================
-- Combined table with limb_type discriminator
-- Reference: Bass (2005) — The Femur / The Humerus

CREATE TABLE IF NOT EXISTS kgc_limb_measurements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             VARCHAR(20) UNIQUE NOT NULL
                        REFERENCES kgc_cases(case_id) ON DELETE CASCADE,
    limb_type           VARCHAR(15) NOT NULL
                        CHECK (limb_type IN ('lower', 'upper')),
    -- Lower limb fields
    femur_length        DECIMAL(6,1)
                        CHECK (femur_length IS NULL OR femur_length > 0),
    femur_head_diameter DECIMAL(5,1)
                        CHECK (femur_head_diameter IS NULL OR femur_head_diameter > 0),
    growth_plate        VARCHAR(20)
                        CHECK (growth_plate IN (
                            'fused', 'partially-fused', 'unfused'
                        )),
    -- Upper limb fields
    humerus_length      DECIMAL(6,1)
                        CHECK (humerus_length IS NULL OR humerus_length > 0),
    bone_robusticity    VARCHAR(10)
                        CHECK (bone_robusticity IN ('robust', 'gracile')),
    created_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_limb_measurements IS 'KGC Module: Lower/upper limb measurement data per case';


-- ============================================
-- 6. THORAX MEASUREMENTS
-- ============================================
-- Rib and sternum observations
-- Reference: Bass (2005) — The Thorax

CREATE TABLE IF NOT EXISTS kgc_thorax_measurements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         VARCHAR(20) UNIQUE NOT NULL
                    REFERENCES kgc_cases(case_id) ON DELETE CASCADE,
    rib_shape       VARCHAR(15)
                    CHECK (rib_shape IN ('smooth', 'scalloped', 'irregular')),
    sternum_length  DECIMAL(5,1)
                    CHECK (sternum_length IS NULL OR sternum_length > 0),
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_thorax_measurements IS 'KGC Module: Thorax measurement data per case';


-- ============================================
-- 7. TEETH MEASUREMENTS
-- ============================================
-- Dental development and wear observations
-- Reference: Bass (2005) — Human Dentition

CREATE TABLE IF NOT EXISTS kgc_teeth_measurements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         VARCHAR(20) UNIQUE NOT NULL
                    REFERENCES kgc_cases(case_id) ON DELETE CASCADE,
    teeth_type      VARCHAR(15)
                    CHECK (teeth_type IN ('deciduous', 'permanent', 'mixed')),
    dental_wear     VARCHAR(15)
                    CHECK (dental_wear IN ('none', 'mild', 'moderate', 'severe')),
    eruption_stage  VARCHAR(15)
                    CHECK (eruption_stage IN ('early', 'partial', 'complete')),
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_teeth_measurements IS 'KGC Module: Teeth measurement data per case';


-- ============================================
-- 8. PREDICTIONS
-- ============================================
-- Computed biological profile predictions.
-- A case can have multiple predictions (audit trail).

CREATE TABLE IF NOT EXISTS kgc_predictions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id          VARCHAR(20) NOT NULL
                     REFERENCES kgc_cases(case_id) ON DELETE CASCADE,
    predicted_sex    VARCHAR(15) NOT NULL
                     CHECK (predicted_sex IN ('Male', 'Female', 'Indeterminate')),
    age_range        VARCHAR(20),
    estimated_height VARCHAR(20),
    confidence       DECIMAL(4,1) NOT NULL
                     CHECK (confidence >= 0 AND confidence <= 100),
    methodology      VARCHAR(50) DEFAULT 'Bass 2005',
    formula_used     VARCHAR(100),
    created_at       TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_predictions IS 'KGC Module: Prediction results (sex, age, height, confidence)';


-- ============================================
-- 9. CASE IMAGES
-- ============================================
-- References to uploaded bone images stored in Supabase Storage.

CREATE TABLE IF NOT EXISTS kgc_case_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         VARCHAR(20) NOT NULL
                    REFERENCES kgc_cases(case_id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    image_type      VARCHAR(30) DEFAULT 'evidence'
                    CHECK (image_type IN ('evidence', 'diagram', 'report')),
    description     TEXT,
    uploaded_at     TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kgc_case_images IS 'KGC Module: Evidence images linked to analysis cases';


-- ============================================
-- INDEXES
-- ============================================
-- Performance indexes for common query patterns

CREATE INDEX IF NOT EXISTS idx_kgc_cases_investigator
    ON kgc_cases(investigator_id);

CREATE INDEX IF NOT EXISTS idx_kgc_cases_bone_type
    ON kgc_cases(bone_type);

CREATE INDEX IF NOT EXISTS idx_kgc_cases_location
    ON kgc_cases(location);

CREATE INDEX IF NOT EXISTS idx_kgc_cases_status
    ON kgc_cases(status);

CREATE INDEX IF NOT EXISTS idx_kgc_cases_date_found
    ON kgc_cases(date_found DESC);

CREATE INDEX IF NOT EXISTS idx_kgc_predictions_case
    ON kgc_predictions(case_id);

CREATE INDEX IF NOT EXISTS idx_kgc_case_images_case
    ON kgc_case_images(case_id);


-- ============================================
-- AUTO-UPDATE TRIGGER for updated_at
-- ============================================
-- Automatically sets updated_at when a case row is modified.

CREATE OR REPLACE FUNCTION kgc_update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kgc_set_cases_updated_at ON kgc_cases;
CREATE TRIGGER kgc_set_cases_updated_at
    BEFORE UPDATE ON kgc_cases
    FOR EACH ROW
    EXECUTE FUNCTION kgc_update_modified_column();


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all KGC tables.
-- Policies allow all authenticated users to CRUD.
-- Adjust policies as needed for your auth setup.

ALTER TABLE kgc_investigators ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_skull_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_pelvis_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_limb_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_thorax_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_teeth_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgc_case_images ENABLE ROW LEVEL SECURITY;

-- SELECT policies (read access for all authenticated users)
CREATE POLICY "kgc_investigators_select" ON kgc_investigators
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kgc_cases_select" ON kgc_cases
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kgc_skull_select" ON kgc_skull_measurements
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kgc_pelvis_select" ON kgc_pelvis_measurements
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kgc_limb_select" ON kgc_limb_measurements
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kgc_thorax_select" ON kgc_thorax_measurements
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kgc_teeth_select" ON kgc_teeth_measurements
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kgc_predictions_select" ON kgc_predictions
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kgc_images_select" ON kgc_case_images
    FOR SELECT TO authenticated USING (true);

-- INSERT policies (all authenticated users can create)
CREATE POLICY "kgc_investigators_insert" ON kgc_investigators
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kgc_cases_insert" ON kgc_cases
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kgc_skull_insert" ON kgc_skull_measurements
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kgc_pelvis_insert" ON kgc_pelvis_measurements
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kgc_limb_insert" ON kgc_limb_measurements
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kgc_thorax_insert" ON kgc_thorax_measurements
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kgc_teeth_insert" ON kgc_teeth_measurements
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kgc_predictions_insert" ON kgc_predictions
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kgc_images_insert" ON kgc_case_images
    FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE policies
CREATE POLICY "kgc_cases_update" ON kgc_cases
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kgc_skull_update" ON kgc_skull_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kgc_pelvis_update" ON kgc_pelvis_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kgc_limb_update" ON kgc_limb_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kgc_thorax_update" ON kgc_thorax_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kgc_teeth_update" ON kgc_teeth_measurements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DELETE policies
CREATE POLICY "kgc_cases_delete" ON kgc_cases
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "kgc_skull_delete" ON kgc_skull_measurements
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "kgc_pelvis_delete" ON kgc_pelvis_measurements
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "kgc_limb_delete" ON kgc_limb_measurements
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "kgc_thorax_delete" ON kgc_thorax_measurements
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "kgc_teeth_delete" ON kgc_teeth_measurements
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "kgc_predictions_delete" ON kgc_predictions
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "kgc_images_delete" ON kgc_case_images
    FOR DELETE TO authenticated USING (true);


-- ============================================
-- ANON (public) ACCESS POLICIES
-- ============================================
-- If your app uses the anon key (no auth), enable these instead.
-- Uncomment the block below if needed.

-- CREATE POLICY "kgc_anon_select_cases" ON kgc_cases
--     FOR SELECT TO anon USING (true);
-- CREATE POLICY "kgc_anon_insert_cases" ON kgc_cases
--     FOR INSERT TO anon WITH CHECK (true);
-- (repeat for other tables as needed)


-- ============================================
-- VERIFICATION
-- ============================================
-- Run this after executing the above to verify all tables were created:

-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name LIKE 'kgc_%'
-- ORDER BY table_name;

-- Expected output:
-- kgc_case_images
-- kgc_cases
-- kgc_investigators
-- kgc_limb_measurements
-- kgc_pelvis_measurements
-- kgc_predictions
-- kgc_skull_measurements
-- kgc_teeth_measurements
-- kgc_thorax_measurements


-- ================================================================
-- END OF KGC MODULE SCHEMA
-- ================================================================
-- Total tables created: 9
-- Total indexes created: 7
-- Total triggers created: 1
-- All tables prefixed with kgc_ to avoid conflicts with
-- other OAHRIS submodules.
-- ================================================================
