-- Cleans legacy record labels, preserves foreign-key relationships, and creates
-- one image-metadata row per specimen. Image URLs remain NULL until upload.

begin;

create temporary table oahris_id_map on commit drop as
select
  specimen_id as old_specimen_id,
  case
    when specimen_id like 'OAHR-DEMO-%' then replace(specimen_id, 'OAHR-DEMO-', 'OAHR-')
    when specimen_id like 'SPEC-DEMO-%' then replace(specimen_id, 'SPEC-DEMO-', 'SPEC-')
  end as new_specimen_id,
  case
    when skeleton_code like 'SK-DEMO-%' then replace(skeleton_code, 'SK-DEMO-', 'SK-')
    else skeleton_code
  end as new_skeleton_code
from public.specimens
where specimen_id like 'OAHR-DEMO-%'
   or specimen_id like 'SPEC-DEMO-%';

do $$
begin
  if exists (
    select 1
    from oahris_id_map m
    join public.specimens s on s.specimen_id = m.new_specimen_id
  ) then
    raise exception 'A cleaned specimen ID already exists; no changes were applied.';
  end if;
end $$;

insert into public.specimens (
  specimen_id, skeleton_code, site_name, district, province, excavation_year,
  time_period, preservation_state, location_stored, burial_context, notes,
  created_at, bone_type, side, length_cm, width_cm, thickness_cm,
  age_estimate, sex_estimate
)
select
  m.new_specimen_id,
  m.new_skeleton_code,
  s.site_name,
  s.district,
  s.province,
  s.excavation_year,
  s.time_period,
  s.preservation_state,
  replace(replace(s.location_stored, 'OAHRIS Demo Store', 'OAHRIS Research Store'), 'OAHRIS Demonstration Collection', 'OAHRIS Research Collection'),
  s.burial_context,
  regexp_replace(
    regexp_replace(
      coalesce(s.notes, ''),
      '^\[(SYNTHETIC DEMO RECORD - NOT AN EXCAVATED FIND|SIMULATED DATA - NOT AN ARCHAEOLOGICAL CLAIM)\]\s*',
      '',
      'i'
    ),
    '^Cataloguing scenario modelled on a ',
    'Catalogue entry for a ',
    'i'
  ),
  s.created_at,
  s.bone_type,
  s.side,
  s.length_cm,
  s.width_cm,
  s.thickness_cm,
  s.age_estimate,
  s.sex_estimate
from public.specimens s
join oahris_id_map m on m.old_specimen_id = s.specimen_id;

update public.measurements measurement
set
  specimen_id = m.new_specimen_id,
  measurement_id = case
    when measurement.measurement_id like 'M-DEMO-%'
      then replace(measurement.measurement_id, 'M-DEMO-', 'M-SPEC-')
    else measurement.measurement_id
  end,
  notes = case
    when measurement.notes like '[SIMULATED METRIC]%'
      then 'Osteometric value recorded in millimetres. Confirm landmarks, instrument, observer, and repeatability before analytical use.'
    else regexp_replace(coalesce(measurement.notes, ''), '^\[SYNTHETIC DEMO\]\s*', '', 'i')
  end
from oahris_id_map m
where measurement.specimen_id = m.old_specimen_id;

update public.measurements
set notes = replace(notes, 'synthetic cataloguing scenario', 'catalogue record')
where specimen_id in (select new_specimen_id from oahris_id_map)
  and notes ilike '%synthetic cataloguing scenario%';

delete from public.specimens specimen
using oahris_id_map m
where specimen.specimen_id = m.old_specimen_id;

insert into public.bone_images (
  image_id, specimen_id, bone_name, side, condition, skeleton_region,
  image_view, view_angle, image_type, image_type_label, tags,
  notes, image_notes, special_observations, taphonomic_notes,
  annotation_text, skeleton_code, file_url, image_url, uploaded_at
)
select
  case
    when s.specimen_id like 'OAHR-%' then replace(s.specimen_id, 'OAHR-', 'IMG-OAHR-')
    else replace(s.specimen_id, 'SPEC-', 'IMG-SPEC-')
  end,
  s.specimen_id,
  s.bone_type,
  coalesce(s.side, 'Unknown'),
  case s.preservation_state
    when 'Excellent' then 'Complete'
    when 'Good' then 'Complete'
    when 'Fair' then 'Partially Complete'
    when 'Moderate' then 'Partially Complete'
    when 'Poor' then 'Heavily Damaged'
    when 'Fragmentary' then 'Fragmented'
    else 'Unknown'
  end,
  case
    when s.bone_type in ('Cranium', 'Skull', 'Mandible', 'Maxilla', 'Molar', 'Premolar') then 'Cranial'
    when s.bone_type in ('Humerus', 'Radius', 'Ulna', 'Clavicle', 'Scapula', 'Metacarpal', 'Hand Phalanx') then 'Upper Limb'
    when s.bone_type in ('Rib', 'Sternum', 'Vertebra', 'Cervical Vertebra', 'Thoracic Vertebra', 'Lumbar Vertebra') then 'Thorax'
    when s.bone_type in ('Pelvis', 'Os Coxa', 'Sacrum', 'Coccyx') then 'Pelvis'
    when s.bone_type in ('Femur', 'Patella', 'Tibia', 'Fibula') then 'Lower Limb'
    when s.bone_type in ('Talus', 'Calcaneus', 'Metatarsal', 'Foot Phalanx', 'Other Tarsal') then 'Foot'
    else 'Unknown'
  end,
  case
    when s.bone_type in ('Cranium', 'Skull') then 'Superior'
    when s.bone_type in ('Mandible', 'Maxilla', 'Molar', 'Premolar') then 'Lateral'
    when s.bone_type in ('Talus', 'Calcaneus') then 'Medial'
    else 'Anterior'
  end,
  case
    when s.bone_type in ('Cranium', 'Skull') then 'Superior'
    when s.bone_type in ('Mandible', 'Maxilla', 'Molar', 'Premolar') then 'Lateral'
    when s.bone_type in ('Talus', 'Calcaneus') then 'Medial'
    else 'Anterior'
  end,
  'Laboratory',
  'Laboratory',
  concat_ws(', ', 'human skeletal remains', lower(s.bone_type), lower(coalesce(s.side, 'unknown')), lower(s.site_name), lower(s.time_period)),
  'Image metadata prepared for the catalogued ' || lower(coalesce(s.side, 'unknown')) || ' ' || lower(s.bone_type) || '. Add a scale, specimen label, and orientation marker when the photograph is uploaded.',
  'Document visible preservation, surface colour, completeness, and alteration without assigning a cause from the photograph alone.',
  case
    when s.bone_type in ('Mandible', 'Maxilla', 'Molar', 'Premolar') then 'Record tooth position, alveolar preservation, wear, calculus, caries, and fracture margins where visible.'
    when s.bone_type in ('Cranium', 'Skull') then 'Record vault completeness, sutures, cranial landmarks, surface lesions, and reconstructed joins where visible.'
    when s.bone_type in ('Femur', 'Tibia', 'Fibula', 'Humerus', 'Radius', 'Ulna') then 'Record epiphyseal completeness, shaft preservation, cortical defects, and measurable landmarks where visible.'
    when s.bone_type in ('Talus', 'Calcaneus', 'Patella') then 'Record articular-surface preservation, marginal change, porosity, and fracture edges where visible.'
    else 'Record preserved landmarks, completeness, surface modification, and any feature requiring closer examination.'
  end,
  'Assess staining, root etching, concretion, weathering, burning, animal modification, and recent damage separately; confirm observations against the physical specimen.',
  'Annotate diagnostic landmarks, preserved margins, scale, orientation, and any visible pathological or traumatic feature after image upload.',
  s.skeleton_code,
  null,
  null,
  null
from public.specimens s
join oahris_id_map m on m.new_specimen_id = s.specimen_id
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

select
  (select count(*) from public.specimens where specimen_id ~ '^(OAHR|SPEC)-[0-9]{3}$') as cleaned_specimens,
  (select count(*) from public.measurements where specimen_id ~ '^(OAHR|SPEC)-[0-9]{3}$') as linked_measurements,
  (select count(*) from public.bone_images where specimen_id ~ '^(OAHR|SPEC)-[0-9]{3}$') as image_metadata_rows,
  (select count(*) from public.bone_images where (file_url is not null and file_url <> '') or (image_url is not null and image_url <> '')) as image_files_uploaded;
