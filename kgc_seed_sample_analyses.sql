-- ============================================================================
--  OAHRIS — Automated Skeletal Analysis: SAMPLE ANALYSES
--
--  GENERATED FILE — do not edit by hand.
--    node scripts/generateSampleAnalyses.mjs
--
--  ⚠️  SYNTHETIC DATA. These 15 cases are demonstration records. They are
--      NOT real individuals and NOT drawn from any excavation. Every case id
--      is prefixed SAMPLE- so they can be told apart from real work at a
--      glance, and removed in one statement (see ROLLBACK at the foot).
--
--  WHAT THIS IS FOR
--  ----------------
--  Exercising all three key features of the module with data that reaches
--  every branch of the prediction rules:
--    Gender  10 case(s)
--    Age     13 case(s)
--    Height   5 case(s)
--
--  Bone types covered: Skull (3), Pelvis (2), Lower Limb (3), Upper Limb (2), Thorax (2), Teeth (3)
--
--  HOW THE PREDICTIONS WERE PRODUCED
--  ---------------------------------
--  Not by hand. The generator imports the real computePredictions() from
--  src/pages/NewAnalysis/KgcStep3Review.jsx and runs it over each case's
--  measurements, so these rows agree exactly with what the app computes for
--  the same input. Re-run the generator after any rule change.
--
--  MEASUREMENT VALUES
--  ------------------
--  Chosen to sit either side of the sectioning points in this project's own
--  OAHRIS_Skeletal_Analysis_Methodology.md (after Bass 2005, with the
--  documented South-Asian adjustments): femur head > 43 mm male / < 41 mm
--  female, and stature by the Trotter & Gleser formulae Bass reproduces.
--  Long-bone lengths are held inside the normal adult range so every derived
--  stature is plausible.
--
--  SAFE TO RUN TWICE — upserts on case_id.
-- ============================================================================

insert into public.analyses (case_id, basic_info, measurements, predictions) values
  -- Skull · Gender + Age
  ('SAMPLE-SKU-01', '{"caseId":"SAMPLE-SKU-01","userName":"OAHRIS Reference Set","location":"Anuradhapura","dateFound":"2024-02-11","bonesType":"Skull","analysisDate":"2024-02-11","notes":"Robust male cranium, sutures still open — young adult."}'::jsonb, '{"bonesType":"Skull","browRidge":"prominent","mastoidSize":"more-30mm","jawShape":"robust","cranialSuture":"open"}'::jsonb, '{"gender":"Male","ageRange":"18 - 25","height":"Unknown","confidence":"94.0%"}'::jsonb),
  -- Skull · Gender + Age
  ('SAMPLE-SKU-02', '{"caseId":"SAMPLE-SKU-02","userName":"OAHRIS Reference Set","location":"Mihintale","dateFound":"2024-03-04","bonesType":"Skull","analysisDate":"2024-03-04","notes":"Gracile cranium, moderate suture closure — middle adult female."}'::jsonb, '{"bonesType":"Skull","browRidge":"smooth","mastoidSize":"less-25mm","jawShape":"rounded","cranialSuture":"moderate-closure"}'::jsonb, '{"gender":"Female","ageRange":"35 - 45","height":"Unknown","confidence":"94.0%"}'::jsonb),
  -- Skull · Gender + Age
  ('SAMPLE-SKU-03', '{"caseId":"SAMPLE-SKU-03","userName":"OAHRIS Reference Set","location":"Pomparippu","dateFound":"2023-11-19","bonesType":"Skull","analysisDate":"2023-11-19","notes":"Obliterated sutures — oldest cranial case in the set."}'::jsonb, '{"bonesType":"Skull","browRidge":"thick","mastoidSize":"more-30mm","jawShape":"u-shaped","cranialSuture":"completely-closed"}'::jsonb, '{"gender":"Male","ageRange":"55+","height":"Unknown","confidence":"94.0%"}'::jsonb),
  -- Pelvis · Gender + Age
  ('SAMPLE-PEL-01', '{"caseId":"SAMPLE-PEL-01","userName":"OAHRIS Reference Set","location":"Ibbankatuwa","dateFound":"2024-01-22","bonesType":"Pelvis","analysisDate":"2024-01-22","notes":"Wide subpubic angle and sciatic notch — female; billowed symphysis."}'::jsonb, '{"bonesType":"Pelvis","subpubicAngle":"wide","sciaticNotch":"wide","pubicSymphysis":"smooth-flat"}'::jsonb, '{"gender":"Female","ageRange":"18 - 25","height":"Unknown","confidence":"93.0%"}'::jsonb),
  -- Pelvis · Gender + Age
  ('SAMPLE-PEL-02', '{"caseId":"SAMPLE-PEL-02","userName":"OAHRIS Reference Set","location":"Bellanbandi Palassa","dateFound":"2023-09-30","bonesType":"Pelvis","analysisDate":"2023-09-30","notes":"Narrow angle and notch — male; eroded symphyseal face."}'::jsonb, '{"bonesType":"Pelvis","subpubicAngle":"narrow","sciaticNotch":"narrow","pubicSymphysis":"degenerated-eroded"}'::jsonb, '{"gender":"Male","ageRange":"55+","height":"Unknown","confidence":"93.0%"}'::jsonb),
  -- Lower Limb · Gender + Age + Height
  ('SAMPLE-LOW-01', '{"caseId":"SAMPLE-LOW-01","userName":"OAHRIS Reference Set","location":"Anuradhapura","dateFound":"2024-04-08","bonesType":"Lower Limb","analysisDate":"2024-04-08","notes":"Large femoral head (> 43 mm) — male; fused plates; tall stature."}'::jsonb, '{"bonesType":"Lower Limb","femurLength":"458","femurHeadDiameter":"46.2","growthPlate":"fused"}'::jsonb, '{"gender":"Male","ageRange":"25+","height":"171.0 cm","confidence":"92.0%"}'::jsonb),
  -- Lower Limb · Gender + Age + Height
  ('SAMPLE-LOW-02', '{"caseId":"SAMPLE-LOW-02","userName":"OAHRIS Reference Set","location":"Kantarodai","dateFound":"2024-05-16","bonesType":"Lower Limb","analysisDate":"2024-05-16","notes":"Small femoral head (< 41 mm) — female; shorter stature."}'::jsonb, '{"bonesType":"Lower Limb","femurLength":"412","femurHeadDiameter":"39.4","growthPlate":"fused"}'::jsonb, '{"gender":"Female","ageRange":"25+","height":"161.1 cm","confidence":"92.0%"}'::jsonb),
  -- Lower Limb · Gender + Age + Height
  ('SAMPLE-LOW-03', '{"caseId":"SAMPLE-LOW-03","userName":"OAHRIS Reference Set","location":"Godavaya","dateFound":"2023-12-02","bonesType":"Lower Limb","analysisDate":"2023-12-02","notes":"Unfused epiphyses — subadult. Head diameter indeterminate (41-43 mm)."}'::jsonb, '{"bonesType":"Lower Limb","femurLength":"396","femurHeadDiameter":"42.0","growthPlate":"unfused"}'::jsonb, '{"gender":"Indeterminate","ageRange":"< 18","height":"157.7 cm","confidence":"92.0%"}'::jsonb),
  -- Upper Limb · Gender + Height
  ('SAMPLE-UPP-01', '{"caseId":"SAMPLE-UPP-01","userName":"OAHRIS Reference Set","location":"Mihintale","dateFound":"2024-06-21","bonesType":"Upper Limb","analysisDate":"2024-06-21","notes":"Robust humerus with marked deltoid tuberosity — male."}'::jsonb, '{"bonesType":"Upper Limb","humerusLength":"332","boneRobusticity":"robust"}'::jsonb, '{"gender":"Male","ageRange":"Unknown","height":"172.2 cm","confidence":"85.0%"}'::jsonb),
  -- Upper Limb · Gender + Height
  ('SAMPLE-UPP-02', '{"caseId":"SAMPLE-UPP-02","userName":"OAHRIS Reference Set","location":"Pomparippu","dateFound":"2024-07-03","bonesType":"Upper Limb","analysisDate":"2024-07-03","notes":"Gracile humerus, light muscle markings — female."}'::jsonb, '{"bonesType":"Upper Limb","humerusLength":"296","boneRobusticity":"gracile"}'::jsonb, '{"gender":"Female","ageRange":"Unknown","height":"162.5 cm","confidence":"85.0%"}'::jsonb),
  -- Thorax · Age
  ('SAMPLE-THO-01', '{"caseId":"SAMPLE-THO-01","userName":"OAHRIS Reference Set","location":"Ibbankatuwa","dateFound":"2024-02-27","bonesType":"Thorax","analysisDate":"2024-02-27","notes":"Smooth, billowy sternal rib end — young adult."}'::jsonb, '{"bonesType":"Thorax","ribShape":"smooth","sternumLength":"148"}'::jsonb, '{"gender":"Indeterminate","ageRange":"18 - 30","height":"Unknown","confidence":"80.0%"}'::jsonb),
  -- Thorax · Age
  ('SAMPLE-THO-02', '{"caseId":"SAMPLE-THO-02","userName":"OAHRIS Reference Set","location":"Bellanbandi Palassa","dateFound":"2023-10-14","bonesType":"Thorax","analysisDate":"2023-10-14","notes":"Irregular, porous rib end with sharp margins — older adult."}'::jsonb, '{"bonesType":"Thorax","ribShape":"irregular","sternumLength":"162"}'::jsonb, '{"gender":"Indeterminate","ageRange":"50+","height":"Unknown","confidence":"80.0%"}'::jsonb),
  -- Teeth · Age
  ('SAMPLE-TEE-01', '{"caseId":"SAMPLE-TEE-01","userName":"OAHRIS Reference Set","location":"Kantarodai","dateFound":"2024-03-19","bonesType":"Teeth","analysisDate":"2024-03-19","notes":"Deciduous dentition — infant/early child."}'::jsonb, '{"bonesType":"Teeth","teethType":"deciduous","dentalWear":"none","eruptionStage":"partial"}'::jsonb, '{"gender":"Indeterminate","ageRange":"< 6","height":"Unknown","confidence":"89.0%"}'::jsonb),
  -- Teeth · Age
  ('SAMPLE-TEE-02', '{"caseId":"SAMPLE-TEE-02","userName":"OAHRIS Reference Set","location":"Godavaya","dateFound":"2024-04-30","bonesType":"Teeth","analysisDate":"2024-04-30","notes":"Mixed dentition — child, permanent teeth erupting."}'::jsonb, '{"bonesType":"Teeth","teethType":"mixed","dentalWear":"mild","eruptionStage":"partial"}'::jsonb, '{"gender":"Indeterminate","ageRange":"6 - 12","height":"Unknown","confidence":"89.0%"}'::jsonb),
  -- Teeth · Age
  ('SAMPLE-TEE-03', '{"caseId":"SAMPLE-TEE-03","userName":"OAHRIS Reference Set","location":"Anuradhapura","dateFound":"2023-08-25","bonesType":"Teeth","analysisDate":"2023-08-25","notes":"Permanent dentition with severe occlusal wear — older adult."}'::jsonb, '{"bonesType":"Teeth","teethType":"permanent","dentalWear":"severe","eruptionStage":"complete"}'::jsonb, '{"gender":"Indeterminate","ageRange":"50+","height":"Unknown","confidence":"89.0%"}'::jsonb)

on conflict (case_id) do update
  set basic_info   = excluded.basic_info,
      measurements = excluded.measurements,
      predictions  = excluded.predictions;


-- ----------------------------------------------------------------------------
-- VERIFY — every sample case, and what it demonstrates.
-- ----------------------------------------------------------------------------
select case_id,
       basic_info ->> 'bonesType' as bone_type,
       predictions ->> 'gender'     as gender,
       predictions ->> 'ageRange'   as age_range,
       predictions ->> 'height'     as height,
       predictions ->> 'confidence' as confidence
from public.analyses
where case_id like 'SAMPLE-%'
order by case_id;


-- ----------------------------------------------------------------------------
-- ROLLBACK — removes the sample set and nothing else.
--   delete from public.analyses where case_id like 'SAMPLE-%';
-- ----------------------------------------------------------------------------
