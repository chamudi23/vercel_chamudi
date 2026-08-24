-- ============================================================================
--  PROPOSAL — Centralized Specimen Record Management (CSRM)
--
--  ####  DO NOT RUN THIS FILE AS-IS.  ####
--
--  Nothing here has been applied. This accompanies CSRM_PROPOSED_CHANGES.md
--  and exists so the CSRM module owner can review, choose, and run only the
--  sections they want. Each section is INDEPENDENT and REVERSIBLE, and the
--  rollback is stated inline. Section numbers match the C-numbers in the
--  document.
--
--  Every statement obeys the same rules:
--    - additive only: nothing renamed, retyped, dropped or made NOT NULL
--    - no CHECK constraint or validated FK on a column that already holds data
--    - no existing screen, form or query changes behaviour
--
--  Reviewed against main @ PR #26 and live data on 22 Aug 2026.
--
--  NOTE: two items from an earlier draft have been WITHDRAWN after reviewing
--  the current CSRM code, which already solves them:
--    - "confirm specimens.bone_type is captured" — it is: required, validated,
--      from the CONTROLLED_BONE_CATEGORIES picklist.
--    - "add specimens.element_group" — unnecessary: bone_type already comes
--      from a controlled list whose `section` is derivable (see C2).
-- ============================================================================


-- ############################################################################
--  C1  POPULATE skeletal_inputs — DATA ONLY, no schema change
--
--  The single most valuable change, and it needs no DDL: the table and its 29
--  columns already exist and the CSRM form already writes to them.
--
--  Partial rows are genuinely useful — ASA drops empty evidence channels and
--  redistributes their weight, so ONE recorded feature already helps.
--  Existing CSRM wording is fine; ASA bridges vocabulary by keyword.
--
--  Columns ASA actually reads (the other 12 are ignored harmlessly):
--    Skull      : skull_brow_ridge, mastoid_process_size, jaw_shape,
--                 cranial_suture_status
--    Pelvis     : subpubic_angle, sciatic_notch_width, pubic_symphysis_stage
--    Upper Limb : humerus_length, upper_limb_robusticity
--    Lower Limb : femur_length, femur_head_diameter, growth_plate
--    Thorax     : rib_shape, sternum_length
--    Teeth      : teeth_type, dental_wear, tooth_eruption_stage
-- ############################################################################

-- Worklist: which catalogued specimens still have no morphology recorded?
select s.specimen_id, s.bone_type, s.site_name, s.district
from public.specimens s
left join public.skeletal_inputs si on si.specimen_id = s.specimen_id
where si.specimen_id is null
order by s.bone_type, s.specimen_id;

-- Prefer entering these through the CSRM form. This template is only for a
-- bulk import and is left commented out deliberately.
-- insert into public.skeletal_inputs
--   (input_id, specimen_id, skull_brow_ridge, mastoid_process_size,
--    jaw_shape, cranial_suture_status)
-- values
--   ('SI-EXAMPLE-001', 'SPEC-001', 'Moderate', 'Medium', 'V-shaped', 'Open')
-- on conflict do nothing;

-- ROLLBACK: delete the rows you inserted.


-- ############################################################################
--  C2  PUBLISH THE EXISTING BONE VOCABULARY TO THE DATABASE
--
--  This is NOT a new vocabulary. CSRM already defines
--  CONTROLLED_BONE_CATEGORIES in src/utils/pp1ImageModule.js — 28 categories,
--  each tagged with section / region / laterality, plus LEGACY_BONE_CATEGORIES
--  and an alias resolver. The only problem is that it lives in JavaScript, so
--  nothing outside the CSRM front-end can read it and ASA has to mirror it by
--  hand (which can drift).
--
--  Materialising it lets both systems share one source of truth.
--  Ideally CSRM generates this table from the constant it already maintains.
--
--  DELIBERATELY: no foreign key and no CHECK against specimens.bone_type.
--  The table is ADVISORY. Enforcing it would reject any value not in the list
--  and break cataloguing the moment an unusual element turns up.
-- ############################################################################

create table if not exists public.bone_type_reference (
  code           text primary key,
  label          text not null,
  section        text not null,
  region         text,
  laterality     text,
  is_legacy      boolean not null default false,
  is_ambiguous   boolean not null default false,
  notes          text
);

comment on table public.bone_type_reference is
  'Advisory mirror of CONTROLLED_BONE_CATEGORIES (src/utils/pp1ImageModule.js), '
  'published so other modules can resolve a bone_type to its section. '
  'Intentionally NOT enforced against specimens.bone_type — free text there '
  'remains valid.';

insert into public.bone_type_reference (code, label, section, region, laterality, is_legacy, is_ambiguous, notes) values
  ('SKULL',        'Skull',           'Skull',            'Cranial',    'midline', false, false, null),
  ('MANDIBLE',     'Mandible',        'Skull',            'Cranial',    'midline', false, false, 'Also bears teeth'),
  ('MAXILLA',      'Maxilla',         'Skull',            'Cranial',    'paired',  false, false, 'Also bears teeth'),
  ('INCISOR',      'Incisor',         'Teeth',            'Cranial',    'paired',  false, false, null),
  ('CANINE',       'Canine',          'Teeth',            'Cranial',    'paired',  false, false, null),
  ('PREMOLAR',     'Premolar',        'Teeth',            'Cranial',    'paired',  false, false, null),
  ('MOLAR',        'Molar',           'Teeth',            'Cranial',    'paired',  false, false, null),
  ('CLAVICLE',     'Clavicle',        'Upper Limb',       'Upper Limb', 'paired',  false, false, null),
  ('SCAPULA',      'Scapula',         'Upper Limb',       'Upper Limb', 'paired',  false, false, null),
  ('HUMERUS',      'Humerus',         'Upper Limb',       'Upper Limb', 'paired',  false, false, null),
  ('RADIUS',       'Radius',          'Upper Limb',       'Upper Limb', 'paired',  false, false, null),
  ('ULNA',         'Ulna',            'Upper Limb',       'Upper Limb', 'paired',  false, false, null),
  ('VERTEBRA',     'Vertebra',        'Vertebral Column', 'Thorax',     'midline', false, false, null),
  ('SACRUM',       'Sacrum',          'Vertebral Column', 'Pelvis',     'midline', false, false, null),
  ('COCCYX',       'Coccyx',          'Vertebral Column', 'Pelvis',     'midline', false, false, null),
  ('RIB',          'Rib',             'Thorax',           'Thorax',     'paired',  false, false, null),
  ('STERNUM',      'Sternum',         'Thorax',           'Thorax',     'midline', false, false, null),
  ('PELVIS',       'Pelvis',          'Pelvis',           'Pelvis',     'paired',  false, false, null),
  ('PUBIS',        'Pubis',           'Pelvis',           'Pelvis',     'paired',  false, false, null),
  ('FEMUR',        'Femur',           'Lower Limb',       'Lower Limb', 'paired',  false, false, null),
  ('PATELLA',      'Patella',         'Lower Limb',       'Lower Limb', 'paired',  false, false, null),
  ('TIBIA',        'Tibia',           'Lower Limb',       'Lower Limb', 'paired',  false, false, null),
  ('FIBULA',       'Fibula',          'Lower Limb',       'Lower Limb', 'paired',  false, false, null),
  ('METACARPAL',   'Metacarpal',      'Hands and Feet',   'Upper Limb', 'paired',  false, false, null),
  ('METATARSAL',   'Metatarsal',      'Hands and Feet',   'Foot',       'paired',  false, false, null),
  ('HAND_PHALANX', 'Phalanx (Hand)',  'Hands and Feet',   'Upper Limb', 'paired',  false, false, null),
  ('FOOT_PHALANX', 'Phalanx (Foot)',  'Hands and Feet',   'Foot',       'paired',  false, false, null),
  ('OTHER',        'Other',           'Unidentified',     'Unknown',    'none',    false, false, null),
  -- Legacy labels still present in catalogued data
  ('TALUS',        'Talus',           'Lower Limb',       'Foot',       'paired',  true,  false, 'legacy-removed from the picklist'),
  ('CALCANEUS',    'Calcaneus',       'Lower Limb',       'Foot',       'paired',  true,  false, 'legacy-removed from the picklist'),
  ('CARPAL',       'Carpal',          'Hands and Feet',   'Upper Limb', 'paired',  true,  false, 'legacy-removed from the picklist'),
  ('PHALANX',      'Phalanx',         'Hands and Feet',   'Unknown',    'paired',  true,  true,  'AMBIGUOUS legacy: use Phalanx (Hand) / Phalanx (Foot)'),
  ('TOOTH',        'Tooth',           'Teeth',            'Cranial',    'paired',  true,  true,  'AMBIGUOUS legacy'),
  ('TEETH',        'Teeth',           'Teeth',            'Cranial',    'paired',  true,  true,  'AMBIGUOUS legacy')
on conflict (code) do nothing;

-- ROLLBACK: drop table if exists public.bone_type_reference;


-- ############################################################################
--  C3  measurements.is_complete — additive, nullable tri-state
--
--  true  = the whole element was measured
--  false = fragmentary (e.g. "Maximum Preserved Length")
--  NULL  = not stated
--
--  WHY: 40 of 102 measurements are "Maximum Preserved Length", which is a
--  LOWER BOUND on a broken bone, not its length. ASA currently detects this by
--  string-matching "preserved length" and drops the metric comparison so
--  fragmentary specimens are not penalised. A boolean states the fact directly
--  instead of relying on wording.
-- ############################################################################

alter table public.measurements
  add column if not exists is_complete boolean;

comment on column public.measurements.is_complete is
  'true = whole element measured; false = fragmentary / preserved dimension; '
  'NULL = not stated. Consumed by the Automated Skeletal Analysis System, '
  'which will not compare a fragmentary value against a complete-bone figure.';

-- Optional backfill from the wording already in use.
-- update public.measurements
--    set is_complete = false
--  where is_complete is null and measurement_type ilike '%preserved%';
--
-- update public.measurements
--    set is_complete = true
--  where is_complete is null
--    and measurement_type in ('Maximum Length', 'Maximum Height', 'Maximum Crown Diameter');

-- ROLLBACK: alter table public.measurements drop column is_complete;


-- ############################################################################
--  C4  Indexes — invisible, zero behavioural risk
--
--  ASA issues one filtered specimens read plus two "specimen_id IN (...)"
--  reads per panel render. At ~100 rows this changes nothing measurable; it
--  matters as the catalogue grows. CSRM's own specimen-detail and
--  duplicate-check queries benefit identically.
-- ############################################################################

create index if not exists measurements_specimen_id_idx
  on public.measurements (specimen_id);

create index if not exists skeletal_inputs_specimen_id_idx
  on public.skeletal_inputs (specimen_id);

create index if not exists specimens_bone_type_idx
  on public.specimens (bone_type);

-- ROLLBACK:
--   drop index if exists public.measurements_specimen_id_idx;
--   drop index if exists public.skeletal_inputs_specimen_id_idx;
--   drop index if exists public.specimens_bone_type_idx;


-- ############################################################################
--  C5  Document the derived dimension columns — COMMENTS ONLY
--
--  Verified 22 Aug 2026: specimens.length_cm * 10 = measurements.value for all
--  98 comparable rows, exactly. The copy is lossy, because it drops the
--  measurement TYPE. Those 98 values actually represent:
--     40  Maximum Preserved Length   (a fragment, i.e. a lower bound)
--     28  Maximum Length
--     26  Maximum Crown Diameter     (a width, not a length)
--      4  Maximum Height
--      2  Recorded Elements          (a COUNT, not a dimension)
--      1  Minimum Diameter
--
--  So a column called length_cm holds counts and widths. Documenting this
--  removes the trap. DROPPING THESE COLUMNS IS EXPLICITLY NOT RECOMMENDED —
--  they are populated and something outside this repository may read them.
-- ############################################################################

comment on column public.specimens.length_cm is
  'DERIVED / LOSSY: unit-converted copy (mm/10) of the specimen''s first '
  'measurements row. Does NOT record which measurement_type it came from, so '
  'it may hold a preserved length, a crown diameter, a height or a count. '
  'Use public.measurements as the source of truth.';

comment on column public.specimens.width_cm is
  'DERIVED / LOSSY: see the note on length_cm. Use public.measurements.';

comment on column public.specimens.thickness_cm is
  'DERIVED / LOSSY: see the note on length_cm. Use public.measurements.';

-- ROLLBACK: comment on column ... is null;


-- ############################################################################
--  C6  Read-only view v_specimen_analysis_profile
--
--  One row per specimen, pre-joined. The cleanest long-term contract between
--  the two systems: CSRM can restructure the underlying tables freely and just
--  keep this view's output stable, and ASA never notices.
--
--  A view reads; it stores nothing and constrains nothing. Creating it cannot
--  affect any existing query, and no CSRM screen has to use it.
--
--  Requires C3 (is_complete). The element_group / section column is resolved by
--  joining bone_type_reference from C2 — if C2 is not adopted, delete that
--  LEFT JOIN and the r.section line before running.
-- ############################################################################

create or replace view public.v_specimen_analysis_profile as
select
  s.specimen_id,
  s.skeleton_code,
  s.bone_type,
  r.section as element_group,   -- resolved via C2; NULL if bone_type is unlisted
  s.side,
  s.site_name,
  s.district,
  s.province,
  s.excavation_year,
  s.time_period,
  s.preservation_state,
  s.sex_estimate,
  s.age_estimate,
  s.created_at,

  -- Morphology: one row per specimen expected; take the most recent.
  si.skull_brow_ridge,
  si.mastoid_process_size,
  si.jaw_shape,
  si.cranial_suture_status,
  si.subpubic_angle,
  si.sciatic_notch_width,
  si.pubic_symphysis_stage,
  si.humerus_length,
  si.upper_limb_robusticity,
  si.femur_length,
  si.femur_head_diameter,
  si.growth_plate,
  si.rib_shape,
  si.sternum_length,
  si.teeth_type,
  si.dental_wear,
  si.tooth_eruption_stage,

  -- Metrics, as a JSON array so one specimen stays one row.
  coalesce(m.metrics, '[]'::jsonb) as measurements
from public.specimens s
left join public.bone_type_reference r
       on lower(r.label) = lower(s.bone_type)
left join lateral (
  select * from public.skeletal_inputs x
   where x.specimen_id = s.specimen_id
   order by x.created_at desc nulls last
   limit 1
) si on true
left join lateral (
  select jsonb_agg(jsonb_build_object(
           'bone_type',        x.bone_type,
           'measurement_type', x.measurement_type,
           'value',            x.value,
           'unit',             x.unit,
           'is_complete',      x.is_complete
         )) as metrics
    from public.measurements x
   where x.specimen_id = s.specimen_id
) m on true;

comment on view public.v_specimen_analysis_profile is
  'Read-only interface for the Automated Skeletal Analysis System: one row per '
  'specimen with its morphology and metric measurements pre-joined. '
  'Published contract — keep the output columns stable.';

-- IMPORTANT: a view does NOT inherit the base tables' row-level security by
-- default. Set security_invoker so the view is evaluated with the querying
-- user's permissions and existing RLS on specimens / measurements /
-- skeletal_inputs continues to apply:
alter view public.v_specimen_analysis_profile set (security_invoker = on);

-- ROLLBACK: drop view if exists public.v_specimen_analysis_profile;


-- ############################################################################
--  C7  Backfill LEGACY excavation_records.specimen_id
--
--  NOT a defect in the current system: the form on main writes specimen_id
--  when creating an excavation record. The 31 unlinked rows are legacy data
--  predating that fix.
--
--  ONLY the CSRM owner knows the correct mapping. DO NOT GUESS. If it is not
--  recoverable, leave the rows alone: ASA does not read this table today and
--  nothing regresses.
-- ############################################################################

-- Inspect first:
select excavation_id, specimen_id, excavation_date, excavator_name, created_at
from public.excavation_records
where specimen_id is null
order by created_at;

-- Then link them individually, e.g.:
-- update public.excavation_records
--    set specimen_id = 'SPEC-001'
--  where excavation_id = 'EX-201';

-- Only AFTER the nulls are resolved, and only if a constraint is wanted.
-- NOT VALID means existing rows are NOT checked, so this cannot fail on legacy
-- data and cannot break the existing insert path.
-- alter table public.excavation_records
--   add constraint excavation_records_specimen_fk
--   foreign key (specimen_id) references public.specimens (specimen_id)
--   not valid;

-- ROLLBACK: set the values back to NULL / drop the constraint.


-- ############################################################################
--  C8  specimens.height_estimate — DECISION, no statement proposed
--
--  Null in all 102 rows. Either it should be populated (ASA computes stature
--  from long bones and could cross-check against it), or acknowledged as
--  unused. ASA does not read it. Nothing to run.
-- ############################################################################


-- ============================================================================
--  END OF PROPOSAL
--
--  Recommended order (see CSRM_PROPOSED_CHANGES.md section 6):
--     C1 data entry  ->  C4 indexes  ->  C5 comments  ->  C3 is_complete
--     ->  C2 vocabulary  ->  C6 view  ->  C7 / C8
--
--  C4 and C5 are free and risk-free. C1 is the one that actually moves the
--  needle. If NOTHING here is adopted, the Automated Skeletal Analysis System
--  keeps working exactly as it does today — none of this is a prerequisite.
-- ============================================================================
