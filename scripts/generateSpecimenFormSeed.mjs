/**
 * Generate 100 synthetic records compatible with SpecimenFormPage.jsx.
 *
 * Twenty-five skeletons are represented by four different bones each. The
 * morphology and measurements follow the ranges documented in the supplied
 * OAHRIS Skeletal Analysis Prediction Methodology (version 4.0, May 2026).
 * These are test fixtures, not excavated people or research observations.
 *
 * Run: node scripts/generateSpecimenFormSeed.mjs
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const sites = [
  ['Mihintale', 'Anuradhapura', 'North Central', 'Early Historic'],
  ['Dorawaka Cave', 'Kegalle', 'Sabaragamuwa', 'Mesolithic'],
  ['Yapahuwa', 'Kurunegala', 'North Western', 'Medieval'],
  ['Anuradhapura Sacred City', 'Anuradhapura', 'North Central', 'Early Historic'],
  ['Ranchamadama', 'Hambantota', 'Southern', 'Iron Age'],
  ['Pomparippu', 'Puttalam', 'North Western', 'Prehistoric'],
  ['Dambulla Cave Temple', 'Matale', 'Central', 'Classical Period'],
  ['Polonnaruwa Ancient City', 'Polonnaruwa', 'North Central', 'Medieval'],
  ['Ritigala', 'Anuradhapura', 'North Central', 'Early Historic'],
  ['Sigiriya Rock Fortress', 'Matale', 'Central', 'Classical Period'],
  ['Bellanbandi Palassa', 'Monaragala', 'Uva', 'Mesolithic'],
  ['Godavaya', 'Hambantota', 'Southern', 'Early Historic'],
  ['Haldummulla', 'Badulla', 'Uva', 'Prehistoric'],
  ['Kantarodai', 'Jaffna', 'Northern', 'Early Historic'],
  ['Pallemalala Prehistoric Site', 'Hambantota', 'Southern', 'Mesolithic'],
  ['Tissamaharama', 'Hambantota', 'Southern', 'Upper Paleolithic'],
  ['Malabe', 'Colombo', 'Western', 'Classical Period'],
  ['Ibbankatuwa', 'Dambulla', 'Central', 'Iron Age'],
  ['Fa Hien Cave', 'Kalutara', 'Western', 'Upper Paleolithic'],
  ['Batadombalena', 'Ratnapura', 'Sabaragamuwa', 'Mesolithic'],
  ['Potana Cave', 'Matale', 'Central', 'Mesolithic'],
]

const stores = [
  ['LAB-01', 'A-01'], ['LAB-01', 'A-02'], ['LAB-01', 'A-03'],
  ['LAB-01', 'B-01'], ['LAB-01', 'B-02'], ['LAB-02', 'A-01'],
  ['LAB-02', 'A-02'], ['LAB-02', 'B-01'], ['LAB-03', 'C-01'],
  ['LAB-03', 'C-02'],
].map(([lab, shelf]) => `PGIAR | Lab ${lab} | Shelf ${shelf}`)

// Every set uses only the controlled bone labels exposed by the form.
const boneSets = [
  [['Skull', 'Midline'], ['Pelvis', 'Left'], ['Femur', 'Right'], ['Molar', 'Left']],
  [['Mandible', 'Midline'], ['Humerus', 'Left'], ['Rib', 'Right'], ['Tibia', 'Right']],
  [['Skull', 'Midline'], ['Pubis', 'Right'], ['Femur', 'Left'], ['Sternum', 'Midline']],
  [['Humerus', 'Right'], ['Clavicle', 'Left'], ['Premolar', 'Right'], ['Rib', 'Left']],
  [['Pelvis', 'Right'], ['Femur', 'Right'], ['Incisor', 'Left'], ['Skull', 'Midline']],
]

const ageProfiles = [
  { age: '18-25', suture: 'Open', symphysis: 'Smooth / Flat', growth: 'Partially Fused', rib: 'Smooth Edges', wear: 'Mild', eruption: 'Complete' },
  { age: '25-35', suture: 'Partially Open', symphysis: 'Moderate / Flat Ridges', growth: 'Fused', rib: 'Smooth Edges', wear: 'Mild', eruption: 'Complete' },
  { age: '35-45', suture: 'Moderately Closed', symphysis: 'Rough / Granular', growth: 'Fused', rib: 'Scalloped Edges', wear: 'Moderate', eruption: 'Complete' },
  { age: '45-55', suture: 'Mostly Closed', symphysis: 'Rough / Granular', growth: 'Fused', rib: 'Scalloped Edges', wear: 'Moderate', eruption: 'Complete' },
  { age: '55+', suture: 'Completely Closed', symphysis: 'Degenerated / Eroded', growth: 'Fused', rib: 'Irregular / Porous', wear: 'Severe', eruption: 'Complete' },
]

const q = (value) => value === null || value === undefined
  ? 'null'
  : `'${String(value).replaceAll("'", "''")}'`
const n = (value) => value === null || value === undefined ? 'null' : String(value)

function profile(index) {
  const sex = index % 5 === 4 ? 'Unknown' : index % 2 ? 'Female' : 'Male'
  const age = ageProfiles[index % ageProfiles.length]
  const femurLength = 398 + ((index * 13) % 73)
  const humerusLength = 278 + ((index * 11) % 47)
  const stature = Number((2.15 * (femurLength / 10) + 72.57).toFixed(1))
  const robusticity = sex === 'Male' ? 'Robust' : sex === 'Female' ? 'Gracile' : (index % 2 ? 'Gracile' : 'Robust')
  const head = sex === 'Male' ? 44 + (index % 4) : sex === 'Female' ? 38 + (index % 3) : 42
  return { sex, ...age, femurLength, humerusLength, stature, robusticity, head }
}

function morphology(bone, p) {
  if (bone === 'Skull') return {
    skull_brow_ridge: p.sex === 'Male' ? 'Prominent' : p.sex === 'Female' ? 'Smooth' : 'Moderate',
    mastoid_process_size: p.sex === 'Male' ? '>30 mm' : p.sex === 'Female' ? '<25 mm' : '25–30 mm',
    cranial_suture_status: p.suture,
    orbital_shape: p.sex === 'Male' ? 'Square with blunt margin' : p.sex === 'Female' ? 'Rounded with sharp margin' : 'Intermediate',
  }
  if (bone === 'Mandible') return { jaw_shape: p.sex === 'Male' ? 'Robust Jaw' : p.sex === 'Female' ? 'Rounded Jaw' : 'U-shaped' }
  if (bone === 'Pelvis' || bone === 'Pubis') return {
    subpubic_angle: p.sex === 'Male' ? 74 + (p.femurLength % 5) : p.sex === 'Female' ? 94 + (p.femurLength % 7) : 90,
    sciatic_notch_width: p.sex === 'Male' ? 'Narrow' : p.sex === 'Female' ? 'Wide' : 'Wide',
    pelvic_inlet_shape: p.sex === 'Male' ? 'Android (Heart shaped or wedge shaped)' : 'Gynecoid (Round or slightly oval)',
    pubic_symphysis_stage: p.symphysis,
    pelvis_size: p.sex === 'Male' ? 'Large and robust' : p.sex === 'Female' ? 'Broad and gracile' : 'Intermediate',
  }
  if (bone === 'Femur') return { femur_length: p.femurLength, femur_head_diameter: p.head, lower_limb_robusticity: p.robusticity, growth_plate: p.growth }
  if (bone === 'Humerus') return { humerus_length: p.humerusLength, humerus_head_diameter: p.sex === 'Male' ? 47 : p.sex === 'Female' ? 42 : 44, upper_limb_robusticity: p.robusticity, growth_plate: p.growth }
  if (bone === 'Clavicle') return { clavicle_robusticity: p.robusticity }
  if (bone === 'Rib') return { rib_shape: p.rib }
  if (bone === 'Sternum') return { sternum_length: 142 + (p.femurLength % 31), thoracic_size: p.sex === 'Male' ? 'Large' : 'Small' }
  if (['Incisor', 'Canine', 'Premolar', 'Molar'].includes(bone)) return { teeth_type: bone, tooth_eruption_stage: p.eruption, dental_wear: p.wear }
  return null
}

const specimens = []
const skeletalInputs = []
const measurements = []
for (let skeletonIndex = 0; skeletonIndex < 25; skeletonIndex += 1) {
  const skeletonCode = `SK-${String(skeletonIndex + 1).padStart(3, '0')}`
  const p = profile(skeletonIndex)
  const site = sites[skeletonIndex % sites.length]
  for (const [bone, side] of boneSets[skeletonIndex % boneSets.length]) {
    const specimenNumber = specimens.length + 1
    const specimenId = `SPEC-${String(specimenNumber).padStart(3, '0')}`
    const length = bone === 'Femur' ? p.femurLength : bone === 'Humerus' ? p.humerusLength : 55 + ((specimenNumber * 17) % 120)
    specimens.push({
      specimen_id: specimenId, skeleton_code: skeletonCode, bone_type: bone, side,
      site_name: site[0], district: site[1], province: site[2], time_period: site[3],
      preservation_state: ['Excellent', 'Good', 'Fair', 'Poor', 'Fragmentary'][specimenNumber % 5],
      location_stored: stores[(specimenNumber - 1) % stores.length],
      age_estimate: p.age, sex_estimate: p.sex, height_estimate: ['Femur', 'Humerus'].includes(bone) ? p.stature : null,
      excavation_year: 2010 + (skeletonIndex % 16),
      burial_context: 'Synthetic reference fixture; context based on the selected catalogue site.',
      notes: 'SYNTHETIC TEST DATA - methodology-aligned values; not an excavated individual.',
    })
    const input = morphology(bone, p)
    if (input) skeletalInputs.push({ input_id: `SI-${String(specimenNumber).padStart(3, '0')}`, specimen_id: specimenId, ...input })
    measurements.push({
      measurement_id: `M-${String(specimenNumber).padStart(3, '0')}`,
      specimen_id: specimenId, bone_type: bone,
      measurement_type: ['Femur', 'Humerus', 'Sternum'].includes(bone) ? 'Maximum Length' : 'Maximum Width',
      value: length, unit: 'mm', notes: 'Synthetic metric recorded for form/import testing.',
    })
  }
}

const specimenColumns = ['specimen_id', 'skeleton_code', 'bone_type', 'side', 'site_name', 'district', 'province', 'time_period', 'preservation_state', 'location_stored', 'age_estimate', 'sex_estimate', 'height_estimate', 'excavation_year', 'burial_context', 'notes']
const numericSpecimenColumns = new Set(['height_estimate', 'excavation_year'])
const specimenValues = specimens.map((row) => `  (${specimenColumns.map((column) => numericSpecimenColumns.has(column) ? n(row[column]) : q(row[column])).join(', ')})`).join(',\n')

const inputColumns = [...new Set(skeletalInputs.flatMap((row) => Object.keys(row)))]
const numericInputColumns = new Set(['subpubic_angle', 'humerus_length', 'humerus_head_diameter', 'femur_length', 'femur_head_diameter', 'sternum_length'])
const inputValues = skeletalInputs.map((row) => `  (${inputColumns.map((column) => numericInputColumns.has(column) ? n(row[column]) : q(row[column])).join(', ')})`).join(',\n')
const measurementValues = measurements.map((row) => `  (${q(row.measurement_id)}, ${q(row.specimen_id)}, ${q(row.bone_type)}, ${q(row.measurement_type)}, ${n(row.value)}, ${q(row.unit)}, ${q(row.notes)})`).join(',\n')

const sql = `-- OAHRIS SpecimenFormPage seed: 100 specimen rows / 25 skeletons
-- GENERATED by: node scripts/generateSpecimenFormSeed.mjs
-- SYNTHETIC TEST DATA. Do not represent these rows as archaeological finds.
-- Methodology alignment: OAHRIS Skeletal Analysis Prediction Methodology v4.0.
-- IDs: SPEC-001..SPEC-100; skeletons: SK-001..SK-025.
-- Each skeleton has four different bone types.
begin;

-- Refuse to overwrite genuine catalogue rows that already use the requested
-- identifier range. Re-running this generated fixture itself remains safe.
do $$
begin
  if exists (
    select 1 from public.specimens
    where specimen_id between 'SPEC-001' and 'SPEC-100'
      and coalesce(notes, '') not like 'SYNTHETIC TEST DATA%'
  ) then
    raise exception 'SPEC-001..SPEC-100 contains non-seed records; seed cancelled';
  end if;
end $$;

insert into public.specimens (${specimenColumns.join(', ')}) values
${specimenValues}
on conflict (specimen_id) do update set
  skeleton_code = excluded.skeleton_code, bone_type = excluded.bone_type,
  side = excluded.side, site_name = excluded.site_name, district = excluded.district,
  province = excluded.province, time_period = excluded.time_period,
  preservation_state = excluded.preservation_state, location_stored = excluded.location_stored,
  age_estimate = excluded.age_estimate, sex_estimate = excluded.sex_estimate,
  height_estimate = excluded.height_estimate, excavation_year = excluded.excavation_year,
  burial_context = excluded.burial_context, notes = excluded.notes;

insert into public.skeletal_inputs (${inputColumns.join(', ')}) values
${inputValues}
on conflict (input_id) do nothing;

insert into public.measurements
  (measurement_id, specimen_id, bone_type, measurement_type, value, unit, notes) values
${measurementValues}
on conflict (measurement_id) do update set
  specimen_id = excluded.specimen_id, bone_type = excluded.bone_type,
  measurement_type = excluded.measurement_type, value = excluded.value,
  unit = excluded.unit, notes = excluded.notes;

commit;

-- Verification: expected result is 100 specimens, 25 skeletons, 100 measurements.
select count(*) as specimens, count(distinct skeleton_code) as skeletons
from public.specimens where specimen_id between 'SPEC-001' and 'SPEC-100';
select count(*) as measurements from public.measurements
where measurement_id between 'M-001' and 'M-100';

-- Optional rollback (run deliberately, in this order):
-- delete from public.measurements where measurement_id between 'M-001' and 'M-100';
-- delete from public.skeletal_inputs where input_id between 'SI-001' and 'SI-100';
-- delete from public.specimens where specimen_id between 'SPEC-001' and 'SPEC-100';
`

const output = join(process.cwd(), 'specimen_form_seed_100.sql')
writeFileSync(output, sql, 'utf8')
console.log(`Wrote ${output}`)
console.log(`${specimens.length} specimens, ${new Set(specimens.map((row) => row.skeleton_code)).size} skeletons, ${skeletalInputs.length} morphology rows, ${measurements.length} measurements`)
