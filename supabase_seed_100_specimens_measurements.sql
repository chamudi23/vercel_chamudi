-- OAHRIS specimen dataset for the Supabase SQL Editor.
-- Creates 100 specimen rows (20 skeletons x 5 elements) and 100 linked measurements.
-- Context references used to keep the prose archaeologically cautious:
--   * User-supplied "Human Bone.docx" (Pallemalala catalogue, 1998; identification recorded in 2016)
--   * https://pmc.ncbi.nlm.nih.gov/articles/PMC6774521/ (Fa-Hien Lena chronology/stratigraphy)
--   * https://pmc.ncbi.nlm.nih.gov/articles/PMC9560501/ (Sri Lankan Wet Zone cave archaeology)
--   * https://archaeology.gov.lk/index.php/about/sections/excavations (Sri Lanka Department of Archaeology)

begin;

create temporary table oahris_seed (
  specimen_id text primary key,
  skeleton_code text not null,
  site_name text,
  district text,
  province text,
  excavation_year integer,
  time_period text,
  preservation_state text,
  location_stored text,
  burial_context text,
  notes text,
  bone_type text,
  side text,
  length_cm numeric,
  width_cm numeric,
  thickness_cm numeric,
  age_estimate text,
  sex_estimate text,
  measurement_id text not null,
  measurement_type text,
  measurement_value_mm numeric,
  measurement_notes text
) on commit drop;

with site_catalog as (
  select * from (values
    (1,  'PLM', 'Pallemalala Prehistoric Site', 'Hambantota',   'Southern',       1998, 'Mesolithic',       'Fair',          'Open-air prehistoric context', 'The catalogue framework follows the supplied Pallemalala 1998 human-remains document. Provenience, element association, and surface alteration would require confirmation against the original field register.'),
    (2,  'BAT', 'Batadombalena',               'Ratnapura',    'Sabaragamuwa',   2010, 'Mesolithic',       'Fragmentary',   'Stratified cave deposit',       'Batadomba-lena is a major Wet Zone cave sequence. Isolated human elements in cave sediment should be associated with an individual only when stratigraphy, refitting, and field labels support that conclusion.'),
    (3,  'FAH', 'Fa Hien Cave',                 'Kalutara',     'Western',         2012, 'Upper Paleolithic','Fragmentary',   'Stratified cave deposit',       'Fa-Hien Lena is central to the archaeology of Late Pleistocene rainforest occupation in Sri Lanka. Skeletal interpretation depends on secure layer attribution and careful separation from faunal remains.'),
    (4,  'IBB', 'Ibbankatuwa',                  'Dambulla',     'Central',         2015, 'Iron Age',         'Good',          'Megalithic burial context',     'Ibbankatuwa is represented as a protohistoric mortuary landscape. Grave-unit, urn, and cist associations should remain separate so that commingled remains are not assigned to one person without supporting evidence.'),
    (5,  'POM', 'Pomparippu',                   'Puttalam',     'North Western',   1970, 'Prehistoric',      'Fair',          'Urn-burial context',            'Pomparippu is treated here as a coastal mortuary context. Salt exposure, sandy sediment, and later disturbance are relevant taphonomic considerations, but each must be verified from the excavation record.'),
    (6,  'KAN', 'Kantarodai',                   'Jaffna',       'Northern',        2011, 'Early Historic',   'Good',          'Burial-ground context',         'Kantarodai belongs to the Early Historic cultural landscape of the Jaffna peninsula. Interpretation should remain tied to the recorded mound or grave unit and its stratigraphic relationship.'),
    (7,  'ANU', 'Anuradhapura Sacred City',     'Anuradhapura', 'North Central',   2015, 'Early Historic',   'Good',          'Urban mortuary context',        'Anuradhapura is a long-lived urban and sacred landscape. Residual, redeposited, and formally buried remains must be distinguished through context sheets and stratigraphic documentation.'),
    (8,  'MIH', 'Mihintale',                    'Anuradhapura', 'North Central',   2018, 'Early Historic',   'Good',          'Religious-site burial context', 'Mihintale is represented as an Early Historic religious landscape. Biological observations should be kept separate from historical identity claims unless inscriptional and contextual evidence independently supports them.'),
    (9,  'TIS', 'Tissamaharama',                'Hambantota',   'Southern',        1990, 'Early Historic',   'Fair',          'Ancient urban context',         'Tissamaharama is treated as an Early Historic urban settlement. Skeletal material from occupation deposits may be redeposited, so articulation and feature boundaries are essential to interpretation.'),
    (10, 'SIG', 'Sigiriya',                     'Matale',       'Central',         2018, 'Classical Period', 'Good',          'Rock-shelter context',          'Sigiriya is a multi-period archaeological landscape. A skeletal element should be assigned to a cultural phase only through its documented stratigraphic unit and associated dating evidence.')
  ) as s(site_no, site_code, site_name, district, province, excavation_year, time_period, preservation_state, burial_context, historical_context)
),
skeletons as (
  select
    n as skeleton_no,
    ((n - 1) % 10) + 1 as site_no,
    ((n - 1) / 10) + 1 as site_sequence,
    (array['18-25','25-35','30-40','35-45','45-55'])[((n - 1) % 5) + 1] as age_estimate,
    (array['Female','Male','Indeterminate','Female','Male'])[((n - 1) % 5) + 1] as sex_estimate
  from generate_series(1, 20) as g(n)
),
bone_catalog as (
  select * from (values
    (1, 1, 'Cranium',   'Midline', 'Maximum Length', 178.0, 'Cranial vault represented; margins and sutural preservation should be recorded before biological estimation.'),
    (1, 2, 'Mandible',  'Midline', 'Bigonial Width',  96.0, 'Mandibular body represented; tooth positions, alveolar loss, and breakage should be recorded independently.'),
    (1, 3, 'Humerus',   'Left',    'Maximum Length', 305.0, 'Left humerus represented; epiphyseal completeness and cortical surface preservation should be checked before metric use.'),
    (1, 4, 'Femur',     'Right',   'Maximum Length', 420.0, 'Right femur represented; maximum length is valid only when the proximal and distal landmarks are preserved.'),
    (1, 5, 'Tibia',     'Left',    'Maximum Length', 345.0, 'Left tibia represented; the plateau, malleolus, and shaft condition should be documented before measurement.'),
    (2, 1, 'Cranium',   'Midline', 'Maximum Length', 181.0, 'Cranial vault represented; reconstruction should not be used for metric analysis unless the joins are secure and documented.'),
    (2, 2, 'Mandible',  'Midline', 'Bigonial Width',  99.0, 'Mandible represented; dental wear may support an age assessment but should not be treated as a precise calendar age.'),
    (2, 3, 'Radius',    'Right',   'Maximum Length', 230.0, 'Right radius represented; radial head and styloid preservation should be confirmed before maximum-length recording.'),
    (2, 4, 'Ulna',      'Left',    'Maximum Length', 250.0, 'Left ulna represented; olecranon and styloid landmarks should be complete before accepting the metric.'),
    (2, 5, 'Calcaneus', 'Right',   'Maximum Length',  73.0, 'Right calcaneus represented; articular erosion and soil concretion should be noted before osteometric comparison.')
  ) as b(bone_set, bone_position, bone_type, side, measurement_type, base_mm, element_observation)
),
expanded as (
  select
    row_number() over (order by sk.skeleton_no, b.bone_position) as specimen_no,
    sk.skeleton_no,
    sk.site_sequence,
    sk.age_estimate,
    sk.sex_estimate,
    sc.*,
    b.*,
    round((b.base_mm + ((sk.skeleton_no * 7 + b.bone_position * 3) % 17) - 8)::numeric, 1) as value_mm
  from skeletons sk
  join site_catalog sc on sc.site_no = sk.site_no
  join bone_catalog b on b.bone_set = case when sk.skeleton_no % 2 = 1 then 1 else 2 end
)
insert into oahris_seed (
  specimen_id, skeleton_code, site_name, district, province, excavation_year,
  time_period, preservation_state, location_stored, burial_context, notes,
  bone_type, side, length_cm, width_cm, thickness_cm, age_estimate, sex_estimate,
  measurement_id, measurement_type, measurement_value_mm, measurement_notes
)
select
  format('OAHR-%s', lpad(specimen_no::text, 3, '0')),
  format('SK-%s-%s', site_code, lpad(site_sequence::text, 2, '0')),
  site_name,
  district,
  province,
  excavation_year + site_sequence - 1,
  time_period,
  preservation_state,
  'OAHRIS Research Collection - Cabinet ' || chr(64 + ((skeleton_no - 1) / 5 + 1)::integer),
  burial_context,
  element_observation || ' ' || historical_context,
  bone_type,
  side,
  round(value_mm / 10.0, 1),
  round((case bone_type
    when 'Cranium' then 142 + (skeleton_no % 9)
    when 'Mandible' then 91 + (skeleton_no % 8)
    when 'Humerus' then 38 + (skeleton_no % 7)
    when 'Femur' then 45 + (skeleton_no % 8)
    when 'Tibia' then 36 + (skeleton_no % 7)
    when 'Radius' then 29 + (skeleton_no % 5)
    when 'Ulna' then 31 + (skeleton_no % 6)
    when 'Calcaneus' then 38 + (skeleton_no % 6)
  end)::numeric / 10.0, 1),
  round((case bone_type
    when 'Cranium' then 6 + (skeleton_no % 3)
    when 'Mandible' then 11 + (skeleton_no % 4)
    else 7 + (skeleton_no % 5)
  end)::numeric / 10.0, 1),
  age_estimate,
  sex_estimate,
  format('OAHR-M-%s', lpad(specimen_no::text, 3, '0')),
  measurement_type,
  value_mm,
  'Osteometric value recorded in millimetres. Confirm landmarks, instrument, observer, and repeatability before analytical use.'
from expanded;

insert into public.specimens (
  specimen_id, skeleton_code, site_name, district, province, excavation_year,
  time_period, preservation_state, location_stored, burial_context, notes,
  bone_type, side, length_cm, width_cm, thickness_cm, age_estimate, sex_estimate
)
select
  specimen_id, skeleton_code, site_name, district, province, excavation_year,
  time_period, preservation_state, location_stored, burial_context, notes,
  bone_type, side, length_cm, width_cm, thickness_cm, age_estimate, sex_estimate
from oahris_seed
on conflict (specimen_id) do update set
  skeleton_code = excluded.skeleton_code,
  site_name = excluded.site_name,
  district = excluded.district,
  province = excluded.province,
  excavation_year = excluded.excavation_year,
  time_period = excluded.time_period,
  preservation_state = excluded.preservation_state,
  location_stored = excluded.location_stored,
  burial_context = excluded.burial_context,
  notes = excluded.notes,
  bone_type = excluded.bone_type,
  side = excluded.side,
  length_cm = excluded.length_cm,
  width_cm = excluded.width_cm,
  thickness_cm = excluded.thickness_cm,
  age_estimate = excluded.age_estimate,
  sex_estimate = excluded.sex_estimate;

insert into public.measurements (
  measurement_id, specimen_id, bone_type, measurement_type, value, unit, notes
)
select
  measurement_id, specimen_id, bone_type, measurement_type,
  measurement_value_mm, 'mm', measurement_notes
from oahris_seed
on conflict (measurement_id) do update set
  specimen_id = excluded.specimen_id,
  bone_type = excluded.bone_type,
  measurement_type = excluded.measurement_type,
  value = excluded.value,
  unit = excluded.unit,
  notes = excluded.notes;

insert into public.bone_images (
  image_id, specimen_id, bone_name, side, condition, skeleton_region,
  image_view, view_angle, image_type, image_type_label, tags,
  notes, image_notes, special_observations, taphonomic_notes,
  annotation_text, skeleton_code, file_url, image_url, uploaded_at
)
select
  format('IMG-OAHR-%s', lpad(substring(specimen_id from '([0-9]{3})$')::integer::text, 3, '0')),
  specimen_id,
  bone_type,
  side,
  case preservation_state
    when 'Good' then 'Complete'
    when 'Fair' then 'Partially Complete'
    when 'Fragmentary' then 'Fragmented'
    when 'Poor' then 'Heavily Damaged'
    else 'Unknown'
  end,
  case
    when bone_type in ('Cranium', 'Mandible') then 'Cranial'
    when bone_type in ('Humerus', 'Radius', 'Ulna') then 'Upper Limb'
    when bone_type in ('Femur', 'Tibia') then 'Lower Limb'
    when bone_type in ('Calcaneus', 'Talus') then 'Foot'
    else 'Unknown'
  end,
  case
    when bone_type = 'Cranium' then 'Superior'
    when bone_type = 'Mandible' then 'Lateral'
    when bone_type in ('Calcaneus', 'Talus') then 'Medial'
    else 'Anterior'
  end,
  case
    when bone_type = 'Cranium' then 'Superior'
    when bone_type = 'Mandible' then 'Lateral'
    when bone_type in ('Calcaneus', 'Talus') then 'Medial'
    else 'Anterior'
  end,
  'Laboratory',
  'Laboratory',
  concat_ws(', ', 'human skeletal remains', lower(bone_type), lower(side), lower(site_name), lower(time_period)),
  'Image metadata prepared for the catalogued ' || lower(side) || ' ' || lower(bone_type) || '. Add a scale, specimen label, and orientation marker when the photograph is uploaded.',
  'Document the visible preservation, surface colour, completeness, and any alteration without inferring cause from the photograph alone.',
  'Record preserved anatomical landmarks, fracture margins, dental features, or articular surfaces visible after image upload.',
  'Assess staining, root etching, concretion, weathering, burning, and recent damage separately; confirm observations against the physical specimen.',
  'Annotate diagnostic landmarks, preserved margins, scale, and orientation after the image is uploaded.',
  skeleton_code,
  null,
  null,
  null
from oahris_seed
on conflict (image_id) do update set
  specimen_id = excluded.specimen_id,
  bone_name = excluded.bone_name,
  side = excluded.side,
  condition = excluded.condition,
  skeleton_region = excluded.skeleton_region,
  image_view = excluded.image_view,
  view_angle = excluded.view_angle,
  image_type = excluded.image_type,
  image_type_label = excluded.image_type_label,
  tags = excluded.tags,
  notes = excluded.notes,
  image_notes = excluded.image_notes,
  special_observations = excluded.special_observations,
  taphonomic_notes = excluded.taphonomic_notes,
  annotation_text = excluded.annotation_text,
  skeleton_code = excluded.skeleton_code;

commit;

-- Verification: expected result is 100 specimens, 100 measurements, 100 image-metadata rows, and 20 skeletons.
select
  (select count(*) from public.specimens where specimen_id ~ '^OAHR-[0-9]{3}$') as specimen_count,
  (select count(*) from public.measurements where measurement_id like 'OAHR-M-%') as measurement_count,
  (select count(*) from public.bone_images where image_id like 'IMG-OAHR-%') as image_metadata_count,
  (select count(distinct skeleton_code) from public.specimens where specimen_id ~ '^OAHR-[0-9]{3}$') as skeleton_count;

-- Image file URLs intentionally remain null. Use Replace File in the attachment editor
-- to upload each photograph into the pre-created metadata record.
