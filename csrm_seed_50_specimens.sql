-- ============================================================================
--  OAHRIS — CSRM: 50 reference specimens with morphology and measurements
--
--  GENERATED FILE — do not edit by hand.
--    node scripts/generateSampleSpecimens.mjs
--
--  RUN ON: the shared project (yiamplfqhyurgxxbpeur).
--
--  SYNTHETIC DATA. These 50 specimens are reference records for testing.
--  They are NOT real individuals and were NOT excavated. Ids run
--  CHASA-927..CHASA-976, continuing from the catalogue's existing maximum,
--  and every one is removable in a single statement (see ROLLBACK).
--
--  WHY SYNTHETIC
--  -------------
--  No structured public dataset of Sri Lankan osteoarchaeological remains
--  exists. The nearest global sets are unusable here: the Goldman Osteometric
--  Data Set carries no morphological scores and its host refuses connections,
--  and the open San Pablo Convent series is Spanish juveniles aged 2-16.
--  Labelling foreign individuals as Anuradhapura or Mihintale finds would
--  fabricate provenance inside a research catalogue. So the structure is real
--  and the individuals are not.
--
--  WHAT IS REAL
--  ------------
--    - Sites, districts, provinces and periods are genuine Sri Lankan
--      archaeology, correctly paired: Pomparippu and Ibbankatuwa Iron Age
--      megalithic burials, Bellanbandi Palassa and Fa Hien Cave
--      Mesolithic/Late Pleistocene, Anuradhapura and Tissamaharama Early
--      Historic.
--    - Bone lengths are derived by inverting the stature regressions in
--      OAHRIS_Skeletal_Analysis_Methodology.md (Bass 2005; Trotter & Gleser),
--      so a recorded stature yields the length that would have produced it.
--    - Femur-head sectioning points are this project's own: > 43 mm male,
--      < 41 mm female, 41-43 indeterminate.
--
--  INTERNALLY CONSISTENT
--  ---------------------
--  Morphology is derived from each specimen's sex and age band, not typed in,
--  so a female specimen is gracile throughout and an older one shows advanced
--  suture closure and dental wear. Six specimens are deliberately ambiguous —
--  indeterminate sex or a femur head inside the 41-43 mm overlap — because a
--  fixture where every case resolves cleanly would flatter the model rather
--  than test it.
--
--  COVERAGE
--  --------
--    Analysis groups : Skull (12), Lower Limb (11), Upper Limb (9), Pelvis (8), Thorax (5), Teeth (5)
--    Sex estimates   : Female 27, Male 17, Unknown 6
--    Morphology rows : 50   (the catalogue had 7 before this)
--    Measurement rows: 54
--
--  The morphology rows matter most: ASA weights its feature channel at 25%,
--  and with skeletal_inputs nearly empty that channel was being dropped for
--  almost every comparison.
--
--  SAFE TO RUN TWICE — upserts on primary key.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Specimens
-- ----------------------------------------------------------------------------
insert into public.specimens
  (specimen_id, skeleton_code, bone_type, side, site_name, district, province, excavation_year, time_period, preservation_state, location_stored, burial_context, sex_estimate, age_estimate, height_estimate, notes)
values
  ('CHASA-927', 'SK-927', 'Maxilla', 'Not Applicable', 'Polonnaruwa', 'Polonnaruwa', 'North Central', 2013, 'Early Historic', 'Moderate', 'Department of Archaeology, Colombo — Bay 3', 'Habitation deposit, disturbed', 'Female', '55+', null, 'Gracile maxilla; consistent with the recorded profile.'),
  ('CHASA-928', 'SK-928', 'Cranium', 'Not Applicable', 'Pomparippu', 'Puttalam', 'North Western', 2017, 'Iron Age', 'Good', 'Department of Archaeology, Colombo — Bay 3', 'Megalithic slab-lined grave', 'Female', '12-18', null, 'Gracile cranium; consistent with the recorded profile.'),
  ('CHASA-929', 'SK-929', 'Mandible', 'Not Applicable', 'Sigiriya', 'Matale', 'Central', 2015, 'Early Historic', 'Fragmentary', 'OAHRIS Research Store — Cabinet A11', 'Primary extended inhumation', 'Male', '55+', null, 'Robust mandible; consistent with the recorded profile.'),
  ('CHASA-930', 'SK-930', 'Frontal', 'Not Applicable', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2013, 'Mesolithic', 'Fragmentary', 'OAHRIS Research Store — Cabinet B04', 'Flexed primary burial, cave floor', 'Unknown', '55+', null, 'Indicators conflict; sex left indeterminate pending further assessment.'),
  ('CHASA-931', 'SK-931', 'Mandible', 'Not Applicable', 'Pomparippu', 'Puttalam', 'North Western', 2020, 'Iron Age', 'Fair', 'OAHRIS Research Store — Cabinet B04', 'Megalithic slab-lined grave', 'Male', '18-25', null, 'Robust mandible; consistent with the recorded profile.'),
  ('CHASA-932', 'SK-932', 'Cranium', 'Not Applicable', 'Sigiriya', 'Matale', 'Central', 2021, 'Early Historic', 'Moderate', 'OAHRIS Research Store — Cabinet D02', 'Primary extended inhumation', 'Female', '18-25', null, 'Gracile cranium; consistent with the recorded profile.'),
  ('CHASA-933', 'SK-933', 'Frontal', 'Not Applicable', 'Sigiriya', 'Matale', 'Central', 2024, 'Early Historic', 'Moderate', 'Department of Archaeology, Colombo — Bay 3', 'Monastic cemetery context', 'Female', '18-25', null, 'Gracile frontal; consistent with the recorded profile.'),
  ('CHASA-934', 'SK-934', 'Mandible', 'Not Applicable', 'Anuradhapura Citadel', 'Anuradhapura', 'North Central', 2021, 'Early Historic', 'Moderate', 'Field laboratory, temporary holding', 'Monastic cemetery context', 'Female', '12-18', null, 'Gracile mandible; consistent with the recorded profile.'),
  ('CHASA-935', 'SK-935', 'Skull', 'Not Applicable', 'Fa Hien Cave', 'Kalutara', 'Western', 2016, 'Upper Paleolithic', 'Moderate', 'OAHRIS Research Store — Cabinet B04', 'Cave deposit, stratified', 'Female', '35-45', null, 'Gracile skull; consistent with the recorded profile.'),
  ('CHASA-936', 'SK-936', 'Skull', 'Not Applicable', 'Godavaya', 'Hambantota', 'Southern', 2017, 'Early Historic', 'Moderate', 'Field laboratory, temporary holding', 'Monastic cemetery context', 'Female', '12-18', null, 'Gracile skull; consistent with the recorded profile.'),
  ('CHASA-937', 'SK-937', 'Maxilla', 'Not Applicable', 'Anuradhapura Citadel', 'Anuradhapura', 'North Central', 2012, 'Early Historic', 'Moderate', 'OAHRIS Research Store — Cabinet B04', 'Habitation deposit, disturbed', 'Female', '45-55', null, 'Gracile maxilla; consistent with the recorded profile.'),
  ('CHASA-938', 'SK-938', 'Skull', 'Not Applicable', 'Mihintale', 'Anuradhapura', 'North Central', 2018, 'Early Historic', 'Good', 'OAHRIS Research Store — Cabinet B04', 'Primary extended inhumation', 'Unknown', '25-35', null, 'Indicators conflict; sex left indeterminate pending further assessment.'),
  ('CHASA-939', 'SK-939', 'Femur', 'Left', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2020, 'Mesolithic', 'Good', 'Department of Archaeology, Colombo — Bay 3', 'Flexed primary burial, cave floor', 'Male', '35-45', 173.2, 'Robust femur; consistent with the recorded profile.'),
  ('CHASA-940', 'SK-940', 'Patella', 'Right', 'Polonnaruwa', 'Polonnaruwa', 'North Central', 2017, 'Early Historic', 'Good', 'OAHRIS Research Store — Cabinet D02', 'Habitation deposit, disturbed', 'Female', '25-35', 148.9, 'Gracile patella; consistent with the recorded profile.'),
  ('CHASA-941', 'SK-941', 'Fibula', 'Left', 'Pomparippu', 'Puttalam', 'North Western', 2019, 'Iron Age', 'Moderate', 'OAHRIS Research Store — Cabinet D02', 'Megalithic cist burial', 'Female', '35-45', 161, 'Gracile fibula; consistent with the recorded profile.'),
  ('CHASA-942', 'SK-942', 'Femur', 'Left', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2015, 'Mesolithic', 'Moderate', 'OAHRIS Research Store — Cabinet C07', 'Flexed primary burial, cave floor', 'Male', '55+', 172.5, 'Robust femur; consistent with the recorded profile.'),
  ('CHASA-943', 'SK-943', 'Fibula', 'Right', 'Pomparippu', 'Puttalam', 'North Western', 2018, 'Iron Age', 'Good', 'Department of Archaeology, Colombo — Bay 3', 'Megalithic cist burial', 'Female', '45-55', 155.3, 'Gracile fibula; consistent with the recorded profile.'),
  ('CHASA-944', 'SK-944', 'Patella', 'Right', 'Batadomba Lena', 'Ratnapura', 'Sabaragamuwa', 2012, 'Upper Paleolithic', 'Fair', 'OAHRIS Research Store — Cabinet B04', 'Cave deposit, stratified', 'Female', '35-45', 159.5, 'Gracile patella; consistent with the recorded profile.'),
  ('CHASA-945', 'SK-945', 'Calcaneus', 'Right', 'Godavaya', 'Hambantota', 'Southern', 2022, 'Early Historic', 'Moderate', 'Field laboratory, temporary holding', 'Monastic cemetery context', 'Male', '45-55', 170, 'Robust calcaneus; consistent with the recorded profile.'),
  ('CHASA-946', 'SK-946', 'Fibula', 'Right', 'Batadomba Lena', 'Ratnapura', 'Sabaragamuwa', 2019, 'Upper Paleolithic', 'Fair', 'Field laboratory, temporary holding', 'Cave deposit, stratified', 'Unknown', '35-45', 159.3, 'Indicators conflict; sex left indeterminate pending further assessment.'),
  ('CHASA-947', 'SK-947', 'Calcaneus', 'Right', 'Sigiriya', 'Matale', 'Central', 2018, 'Early Historic', 'Moderate', 'Field laboratory, temporary holding', 'Primary extended inhumation', 'Male', '25-35', 160.5, 'Robust calcaneus; consistent with the recorded profile.'),
  ('CHASA-948', 'SK-948', 'Calcaneus', 'Left', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2022, 'Mesolithic', 'Moderate', 'Department of Archaeology, Colombo — Bay 3', 'Occupation layer, scattered', 'Female', '35-45', 156.6, 'Gracile calcaneus; consistent with the recorded profile.'),
  ('CHASA-949', 'SK-949', 'Fibula', 'Left', 'Kantarodai', 'Jaffna', 'Northern', 2015, 'Early Historic', 'Moderate', 'OAHRIS Research Store — Cabinet A11', 'Habitation deposit, disturbed', 'Male', '18-25', 171.2, 'Robust fibula; consistent with the recorded profile.'),
  ('CHASA-950', 'SK-950', 'Radius', 'Left', 'Ibbankatuwa', 'Matale', 'Central', 2015, 'Iron Age', 'Fragmentary', 'OAHRIS Research Store — Cabinet A11', 'Urn burial, secondary interment', 'Female', '55+', 157.8, 'Gracile radius; consistent with the recorded profile.'),
  ('CHASA-951', 'SK-951', 'Radius', 'Left', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2020, 'Mesolithic', 'Fragmentary', 'OAHRIS Research Store — Cabinet A11', 'Flexed primary burial, cave floor', 'Male', '18-25', 161.5, 'Robust radius; consistent with the recorded profile.'),
  ('CHASA-952', 'SK-952', 'Humerus', 'Left', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2013, 'Mesolithic', 'Excellent', 'OAHRIS Research Store — Cabinet A11', 'Flexed primary burial, cave floor', 'Female', '12-18', 148.1, 'Gracile humerus; consistent with the recorded profile.'),
  ('CHASA-953', 'SK-953', 'Scapula', 'Right', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2012, 'Mesolithic', 'Moderate', 'OAHRIS Research Store — Cabinet A11', 'Occupation layer, scattered', 'Male', '25-35', 163.7, 'Robust scapula; consistent with the recorded profile.'),
  ('CHASA-954', 'SK-954', 'Radius', 'Right', 'Mihintale', 'Anuradhapura', 'North Central', 2013, 'Early Historic', 'Fair', 'Field laboratory, temporary holding', 'Habitation deposit, disturbed', 'Unknown', '18-25', 155.4, 'Indicators conflict; sex left indeterminate pending further assessment.'),
  ('CHASA-955', 'SK-955', 'Radius', 'Left', 'Fa Hien Cave', 'Kalutara', 'Western', 2014, 'Upper Paleolithic', 'Good', 'Department of Archaeology, Colombo — Bay 3', 'Cave deposit, stratified', 'Female', '35-45', 159.6, 'Gracile radius; consistent with the recorded profile.'),
  ('CHASA-956', 'SK-956', 'Radius', 'Right', 'Batadomba Lena', 'Ratnapura', 'Sabaragamuwa', 2014, 'Upper Paleolithic', 'Good', 'OAHRIS Research Store — Cabinet D02', 'Cave deposit, stratified', 'Male', '12-18', 163.1, 'Robust radius; consistent with the recorded profile.'),
  ('CHASA-957', 'SK-957', 'Scapula', 'Left', 'Fa Hien Cave', 'Kalutara', 'Western', 2022, 'Upper Paleolithic', 'Moderate', 'OAHRIS Research Store — Cabinet C07', 'Cave deposit, stratified', 'Male', '18-25', 168, 'Robust scapula; consistent with the recorded profile.'),
  ('CHASA-958', 'SK-958', 'Humerus', 'Left', 'Godavaya', 'Hambantota', 'Southern', 2024, 'Early Historic', 'Moderate', 'OAHRIS Research Store — Cabinet D02', 'Primary extended inhumation', 'Female', '35-45', 151.2, 'Gracile humerus; consistent with the recorded profile.'),
  ('CHASA-959', 'SK-959', 'Ilium', 'Right', 'Kantarodai', 'Jaffna', 'Northern', 2012, 'Early Historic', 'Moderate', 'Department of Archaeology, Colombo — Bay 3', 'Habitation deposit, disturbed', 'Female', '55+', null, 'Gracile ilium; consistent with the recorded profile.'),
  ('CHASA-960', 'SK-960', 'Ilium', 'Left', 'Godavaya', 'Hambantota', 'Southern', 2017, 'Early Historic', 'Moderate', 'Field laboratory, temporary holding', 'Habitation deposit, disturbed', 'Male', '45-55', null, 'Robust ilium; consistent with the recorded profile.'),
  ('CHASA-961', 'SK-961', 'Innominate', 'Right', 'Ibbankatuwa', 'Matale', 'Central', 2013, 'Iron Age', 'Good', 'Department of Archaeology, Colombo — Bay 3', 'Urn burial, secondary interment', 'Male', '35-45', null, 'Robust innominate; consistent with the recorded profile.'),
  ('CHASA-962', 'SK-962', 'Sacrum', 'Not Applicable', 'Godavaya', 'Hambantota', 'Southern', 2019, 'Early Historic', 'Moderate', 'Department of Archaeology, Colombo — Bay 3', 'Primary extended inhumation', 'Unknown', '18-25', null, 'Indicators conflict; sex left indeterminate pending further assessment.'),
  ('CHASA-963', 'SK-963', 'Sacrum', 'Not Applicable', 'Godavaya', 'Hambantota', 'Southern', 2019, 'Early Historic', 'Moderate', 'OAHRIS Research Store — Cabinet A11', 'Monastic cemetery context', 'Female', '55+', null, 'Gracile sacrum; consistent with the recorded profile.'),
  ('CHASA-964', 'SK-964', 'Ilium', 'Right', 'Tissamaharama', 'Hambantota', 'Southern', 2015, 'Early Historic', 'Good', 'Department of Archaeology, Colombo — Bay 3', 'Habitation deposit, disturbed', 'Female', '35-45', null, 'Gracile ilium; consistent with the recorded profile.'),
  ('CHASA-965', 'SK-965', 'Pelvis', 'Not Applicable', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2016, 'Mesolithic', 'Good', 'OAHRIS Research Store — Cabinet B04', 'Flexed primary burial, cave floor', 'Female', '35-45', null, 'Gracile pelvis; consistent with the recorded profile.'),
  ('CHASA-966', 'SK-966', 'Innominate', 'Left', 'Polonnaruwa', 'Polonnaruwa', 'North Central', 2016, 'Early Historic', 'Good', 'OAHRIS Research Store — Cabinet C07', 'Habitation deposit, disturbed', 'Female', '45-55', null, 'Gracile innominate; consistent with the recorded profile.'),
  ('CHASA-967', 'SK-967', 'Vertebra', 'Not Applicable', 'Pomparippu', 'Puttalam', 'North Western', 2020, 'Iron Age', 'Moderate', 'OAHRIS Research Store — Cabinet D02', 'Megalithic cist burial', 'Female', '12-18', null, 'Gracile vertebra; consistent with the recorded profile.'),
  ('CHASA-968', 'SK-968', 'Rib', 'Right', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2024, 'Mesolithic', 'Good', 'OAHRIS Research Store — Cabinet B04', 'Flexed primary burial, cave floor', 'Female', '45-55', null, 'Gracile rib; consistent with the recorded profile.'),
  ('CHASA-969', 'SK-969', 'Vertebra', 'Not Applicable', 'Godavaya', 'Hambantota', 'Southern', 2012, 'Early Historic', 'Moderate', 'OAHRIS Research Store — Cabinet C07', 'Monastic cemetery context', 'Female', '35-45', null, 'Gracile vertebra; consistent with the recorded profile.'),
  ('CHASA-970', 'SK-970', 'Rib', 'Right', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2018, 'Mesolithic', 'Fair', 'Field laboratory, temporary holding', 'Occupation layer, scattered', 'Unknown', '18-25', null, 'Indicators conflict; sex left indeterminate pending further assessment.'),
  ('CHASA-971', 'SK-971', 'Rib', 'Right', 'Godavaya', 'Hambantota', 'Southern', 2014, 'Early Historic', 'Good', 'OAHRIS Research Store — Cabinet D02', 'Monastic cemetery context', 'Male', '18-25', null, 'Robust rib; consistent with the recorded profile.'),
  ('CHASA-972', 'SK-972', 'Premolar', 'Right', 'Fa Hien Cave', 'Kalutara', 'Western', 2024, 'Upper Paleolithic', 'Fair', 'OAHRIS Research Store — Cabinet C07', 'Cave deposit, stratified', 'Male', '45-55', null, 'Robust premolar; consistent with the recorded profile.'),
  ('CHASA-973', 'SK-973', 'Incisor', 'Right', 'Anuradhapura Citadel', 'Anuradhapura', 'North Central', 2020, 'Early Historic', 'Excellent', 'Department of Archaeology, Colombo — Bay 3', 'Habitation deposit, disturbed', 'Female', '45-55', null, 'Gracile incisor; consistent with the recorded profile.'),
  ('CHASA-974', 'SK-974', 'Canine', 'Left', 'Pomparippu', 'Puttalam', 'North Western', 2017, 'Iron Age', 'Fair', 'Field laboratory, temporary holding', 'Megalithic cist burial', 'Male', '45-55', null, 'Robust canine; consistent with the recorded profile.'),
  ('CHASA-975', 'SK-975', 'Incisor', 'Left', 'Bellanbandi Palassa', 'Ratnapura', 'Sabaragamuwa', 2021, 'Mesolithic', 'Fair', 'OAHRIS Research Store — Cabinet B04', 'Occupation layer, scattered', 'Male', '35-45', null, 'Robust incisor; consistent with the recorded profile.'),
  ('CHASA-976', 'SK-976', 'Premolar', 'Right', 'Tissamaharama', 'Hambantota', 'Southern', 2022, 'Early Historic', 'Good', 'Department of Archaeology, Colombo — Bay 3', 'Monastic cemetery context', 'Female', '35-45', null, 'Gracile premolar; consistent with the recorded profile.')
on conflict (specimen_id) do update set
  bone_type = excluded.bone_type, side = excluded.side,
  site_name = excluded.site_name, district = excluded.district,
  province = excluded.province, excavation_year = excluded.excavation_year,
  time_period = excluded.time_period, preservation_state = excluded.preservation_state,
  location_stored = excluded.location_stored, burial_context = excluded.burial_context,
  sex_estimate = excluded.sex_estimate, age_estimate = excluded.age_estimate,
  height_estimate = excluded.height_estimate, notes = excluded.notes;


-- ----------------------------------------------------------------------------
-- 2. Morphological observations — what ASA's feature channel compares against
-- ----------------------------------------------------------------------------
insert into public.skeletal_inputs
  (input_id, specimen_id, skull_brow_ridge, mastoid_process_size, jaw_shape, cranial_suture_status, skull_size, orbital_shape, femur_length, femur_head_diameter, tibia_length, lower_limb_robusticity, growth_plate, humerus_length, humerus_head_diameter, upper_limb_robusticity, clavicle_robusticity, subpubic_angle, sciatic_notch_width, pelvic_inlet_shape, pubic_symphysis_stage, pelvis_size, rib_shape, sternum_length, thoracic_size, teeth_type, dental_wear, tooth_eruption_stage)
values
  ('CH-927', 'CHASA-927', 'Smooth', 'Small, less than 25mm', 'Rounded', 'Completely closed', 'Small', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-928', 'CHASA-928', 'Smooth', 'Small, less than 25mm', 'Rounded', 'Open', 'Small', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-929', 'CHASA-929', 'Prominent', 'Large, greater than 30mm', 'Robust', 'Completely closed', 'Large', 'Square, blunt margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-930', 'CHASA-930', 'Moderate', 'Medium, 25 to 30mm', 'U-shaped', 'Completely closed', 'Medium', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-931', 'CHASA-931', 'Prominent', 'Large, greater than 30mm', 'Robust', 'Open', 'Large', 'Square, blunt margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-932', 'CHASA-932', 'Less developed', 'Small, less than 25mm', 'U-shaped', 'Open', 'Small', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-933', 'CHASA-933', 'Smooth', 'Small, less than 25mm', 'Rounded', 'Open', 'Small', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-934', 'CHASA-934', 'Smooth', 'Small, less than 25mm', 'U-shaped', 'Open', 'Small', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-935', 'CHASA-935', 'Smooth', 'Small, less than 25mm', 'Rounded', 'Moderately closed', 'Small', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-936', 'CHASA-936', 'Less developed', 'Small, less than 25mm', 'Rounded', 'Open', 'Small', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-937', 'CHASA-937', 'Smooth', 'Small, less than 25mm', 'Rounded', 'Mostly closed', 'Small', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-938', 'CHASA-938', 'Moderate', 'Medium, 25 to 30mm', 'U-shaped', 'Partially open', 'Medium', 'Rounded, sharp margin', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-939', 'CHASA-939', null, null, null, null, null, null, 468, 44.7, 379, 'Robust', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-940', 'CHASA-940', null, null, null, null, null, null, 355, 38.3, 288, 'Gracile', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-941', 'CHASA-941', null, null, null, null, null, null, 411, 39, 333, 'Gracile', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-942', 'CHASA-942', null, null, null, null, null, null, 465, 44.2, 377, 'Robust', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-943', 'CHASA-943', null, null, null, null, null, null, 385, 39.1, 312, 'Gracile', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-944', 'CHASA-944', null, null, null, null, null, null, 404, 38, 327, 'Gracile', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-945', 'CHASA-945', null, null, null, null, null, null, 453, 44.6, 367, 'Robust', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-946', 'CHASA-946', null, null, null, null, null, null, 403, 42.2, 326, 'Moderate', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-947', 'CHASA-947', null, null, null, null, null, null, 409, 44.7, 331, 'Robust', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-948', 'CHASA-948', null, null, null, null, null, null, 391, 40, 317, 'Gracile', 'Fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-949', 'CHASA-949', null, null, null, null, null, null, 459, 47.8, 372, 'Robust', 'Partially fused', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
  ('CH-950', 'CHASA-950', null, null, null, null, null, null, null, null, null, null, null, 278, 41.6, 'Gracile', 'Gracile', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-951', 'CHASA-951', null, null, null, null, null, null, null, null, null, null, null, 292, 47.7, 'Robust', 'Robust', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-952', 'CHASA-952', null, null, null, null, null, null, null, null, null, null, null, 242, 42.9, 'Gracile', 'Gracile', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-953', 'CHASA-953', null, null, null, null, null, null, null, null, null, null, null, 300, 47.7, 'Robust', 'Robust', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-954', 'CHASA-954', null, null, null, null, null, null, null, null, null, null, null, 269, 41.5, 'Moderate', 'Moderate', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-955', 'CHASA-955', null, null, null, null, null, null, null, null, null, null, null, 285, 43.6, 'Gracile', 'Gracile', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-956', 'CHASA-956', null, null, null, null, null, null, null, null, null, null, null, 298, 48.2, 'Robust', 'Robust', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-957', 'CHASA-957', null, null, null, null, null, null, null, null, null, null, null, 316, 48, 'Robust', 'Robust', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-958', 'CHASA-958', null, null, null, null, null, null, null, null, null, null, null, 254, 42.4, 'Gracile', 'Gracile', null, null, null, null, null, null, null, null, null, null, null),
  ('CH-959', 'CHASA-959', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 103.3, 'Wide and shallow', 'Circular, broad', 'Degenerated, eroded', 'Small', null, null, null, null, null, null),
  ('CH-960', 'CHASA-960', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 67.4, 'Narrow and deep', 'Heart-shaped', 'Rough, granular', 'Large', null, null, null, null, null, null),
  ('CH-961', 'CHASA-961', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 68.7, 'Narrow and deep', 'Heart-shaped', 'Rough, granular', 'Large', null, null, null, null, null, null),
  ('CH-962', 'CHASA-962', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 87.5, 'Intermediate', 'Heart-shaped', 'Smooth, billowing face', 'Small', null, null, null, null, null, null),
  ('CH-963', 'CHASA-963', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 96.1, 'Wide and shallow', 'Circular, broad', 'Degenerated, eroded', 'Small', null, null, null, null, null, null),
  ('CH-964', 'CHASA-964', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 96, 'Wide and shallow', 'Circular, broad', 'Rough, granular', 'Small', null, null, null, null, null, null),
  ('CH-965', 'CHASA-965', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 103, 'Wide and shallow', 'Circular, broad', 'Rough, granular', 'Small', null, null, null, null, null, null),
  ('CH-966', 'CHASA-966', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 98.9, 'Wide and shallow', 'Circular, broad', 'Rough, granular', 'Small', null, null, null, null, null, null),
  ('CH-967', 'CHASA-967', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Smooth', 174, 'Small', null, null, null),
  ('CH-968', 'CHASA-968', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Scalloped', 162, 'Small', null, null, null),
  ('CH-969', 'CHASA-969', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Scalloped', 142, 'Small', null, null, null),
  ('CH-970', 'CHASA-970', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Smooth', 162, 'Small', null, null, null),
  ('CH-971', 'CHASA-971', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Smooth', 165, 'Large', null, null, null),
  ('CH-972', 'CHASA-972', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Permanent', 'Moderate', 'Fully erupted'),
  ('CH-973', 'CHASA-973', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Permanent', 'Moderate', 'Fully erupted'),
  ('CH-974', 'CHASA-974', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Permanent', 'Moderate', 'Fully erupted'),
  ('CH-975', 'CHASA-975', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Permanent', 'Moderate', 'Fully erupted'),
  ('CH-976', 'CHASA-976', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Permanent', 'Moderate', 'Fully erupted')
on conflict (input_id) do nothing;


-- ----------------------------------------------------------------------------
-- 3. Metric measurements
--    Fragmentary elements carry "Maximum Preserved Length", which is a lower
--    bound rather than the bone's length; ASA excludes those from metric
--    scoring by design, so the specimen loses the channel instead of scoring
--    zero for being incomplete.
-- ----------------------------------------------------------------------------
insert into public.measurements
  (measurement_id, specimen_id, bone_type, measurement_type, value, unit, notes)
values
  ('M-CHASA-927-1', 'CHASA-927', 'Maxilla', 'Maximum Preserved Length', 129, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-928-1', 'CHASA-928', 'Cranium', 'Maximum Preserved Length', 115.6, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-929-1', 'CHASA-929', 'Mandible', 'Maximum Preserved Length', 73.6, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-930-1', 'CHASA-930', 'Frontal', 'Maximum Preserved Length', 103.5, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-931-1', 'CHASA-931', 'Mandible', 'Maximum Preserved Length', 65.5, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-932-1', 'CHASA-932', 'Cranium', 'Maximum Preserved Length', 106, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-933-1', 'CHASA-933', 'Frontal', 'Maximum Preserved Length', 49.2, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-934-1', 'CHASA-934', 'Mandible', 'Maximum Preserved Length', 77.7, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-935-1', 'CHASA-935', 'Skull', 'Maximum Preserved Length', 120.3, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-936-1', 'CHASA-936', 'Skull', 'Maximum Preserved Length', 120.2, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-937-1', 'CHASA-937', 'Maxilla', 'Maximum Preserved Length', 63.2, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-938-1', 'CHASA-938', 'Skull', 'Maximum Preserved Length', 55.7, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-939-1', 'CHASA-939', 'Femur', 'Maximum Length', 468, 'mm', 'Osteometric board, complete bone'),
  ('M-CHASA-939-2', 'CHASA-939', 'Femur', 'Head Diameter', 44.7, 'mm', 'Vertical head diameter, sliding caliper'),
  ('M-CHASA-940-1', 'CHASA-940', 'Patella', 'Maximum Preserved Length', 115.9, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-941-1', 'CHASA-941', 'Fibula', 'Maximum Preserved Length', 86.2, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-942-1', 'CHASA-942', 'Femur', 'Maximum Length', 465, 'mm', 'Osteometric board, complete bone'),
  ('M-CHASA-942-2', 'CHASA-942', 'Femur', 'Head Diameter', 44.2, 'mm', 'Vertical head diameter, sliding caliper'),
  ('M-CHASA-943-1', 'CHASA-943', 'Fibula', 'Maximum Preserved Length', 123.2, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-944-1', 'CHASA-944', 'Patella', 'Maximum Preserved Length', 97.2, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-945-1', 'CHASA-945', 'Calcaneus', 'Maximum Preserved Length', 54.7, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-946-1', 'CHASA-946', 'Fibula', 'Maximum Preserved Length', 71.8, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-947-1', 'CHASA-947', 'Calcaneus', 'Maximum Preserved Length', 75.4, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-948-1', 'CHASA-948', 'Calcaneus', 'Maximum Preserved Length', 112.7, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-949-1', 'CHASA-949', 'Fibula', 'Maximum Preserved Length', 48.5, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-950-1', 'CHASA-950', 'Radius', 'Maximum Preserved Length', 125.6, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-951-1', 'CHASA-951', 'Radius', 'Maximum Preserved Length', 124.1, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-952-1', 'CHASA-952', 'Humerus', 'Maximum Length', 242, 'mm', 'Osteometric board, complete bone'),
  ('M-CHASA-952-2', 'CHASA-952', 'Humerus', 'Head Diameter', 43.3, 'mm', 'Vertical head diameter'),
  ('M-CHASA-953-1', 'CHASA-953', 'Scapula', 'Maximum Preserved Length', 91.5, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-954-1', 'CHASA-954', 'Radius', 'Maximum Preserved Length', 68.8, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-955-1', 'CHASA-955', 'Radius', 'Maximum Preserved Length', 116.9, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-956-1', 'CHASA-956', 'Radius', 'Maximum Preserved Length', 115.4, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-957-1', 'CHASA-957', 'Scapula', 'Maximum Preserved Length', 117.9, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-958-1', 'CHASA-958', 'Humerus', 'Maximum Length', 254, 'mm', 'Osteometric board, complete bone'),
  ('M-CHASA-958-2', 'CHASA-958', 'Humerus', 'Head Diameter', 41.8, 'mm', 'Vertical head diameter'),
  ('M-CHASA-959-1', 'CHASA-959', 'Ilium', 'Maximum Preserved Length', 92.8, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-960-1', 'CHASA-960', 'Ilium', 'Maximum Preserved Length', 66.6, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-961-1', 'CHASA-961', 'Innominate', 'Maximum Preserved Length', 125.6, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-962-1', 'CHASA-962', 'Sacrum', 'Maximum Preserved Length', 121, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-963-1', 'CHASA-963', 'Sacrum', 'Maximum Preserved Length', 86.8, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-964-1', 'CHASA-964', 'Ilium', 'Maximum Preserved Length', 69.6, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-965-1', 'CHASA-965', 'Pelvis', 'Maximum Preserved Length', 54.9, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-966-1', 'CHASA-966', 'Innominate', 'Maximum Preserved Length', 65.3, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-967-1', 'CHASA-967', 'Vertebra', 'Maximum Preserved Length', 53.5, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-968-1', 'CHASA-968', 'Rib', 'Maximum Preserved Length', 44.6, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-969-1', 'CHASA-969', 'Vertebra', 'Maximum Preserved Length', 125.1, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-970-1', 'CHASA-970', 'Rib', 'Maximum Preserved Length', 59.7, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-971-1', 'CHASA-971', 'Rib', 'Maximum Preserved Length', 47, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-972-1', 'CHASA-972', 'Premolar', 'Maximum Preserved Length', 127.1, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-973-1', 'CHASA-973', 'Incisor', 'Maximum Preserved Length', 86.5, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-974-1', 'CHASA-974', 'Canine', 'Maximum Preserved Length', 73.8, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-975-1', 'CHASA-975', 'Incisor', 'Maximum Preserved Length', 96.8, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value'),
  ('M-CHASA-976-1', 'CHASA-976', 'Premolar', 'Maximum Preserved Length', 105.4, 'mm', 'Between most distant preserved landmarks; fragmentary, not a complete-bone value')
on conflict (measurement_id) do nothing;


-- ----------------------------------------------------------------------------
-- VERIFY
-- ----------------------------------------------------------------------------
select
  (select count(*) from public.specimens       where specimen_id between 'CHASA-927' and 'CHASA-976') as specimens,
  (select count(*) from public.skeletal_inputs where specimen_id between 'CHASA-927' and 'CHASA-976') as morphology,
  (select count(*) from public.measurements    where specimen_id between 'CHASA-927' and 'CHASA-976') as measurements;


-- ----------------------------------------------------------------------------
-- ROLLBACK — removes exactly what this file inserted, nothing else.
--   delete from public.measurements    where specimen_id between 'CHASA-927' and 'CHASA-976';
--   delete from public.skeletal_inputs where specimen_id between 'CHASA-927' and 'CHASA-976';
--   delete from public.specimens       where specimen_id between 'CHASA-927' and 'CHASA-976';
-- ----------------------------------------------------------------------------
