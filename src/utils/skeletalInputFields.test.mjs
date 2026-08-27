import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRelevantSkeletalInputFields,
  buildSkeletalInputPayload,
  buildSpecimenDimensionPayload,
  keepRelevantSkeletalValues,
} from './skeletalInputFields.js';

test('skull fields are exposed for Skull specimens', () => {
  const fields = getRelevantSkeletalInputFields('Skull');
  assert.ok(fields.some((field) => field.field === 'skull_brow_ridge'));
  assert.ok(fields.some((field) => field.field === 'cranial_suture_status'));
});

test('pelvis fields are exposed for Pelvis and Pubis', () => {
  const pelvis = getRelevantSkeletalInputFields('Pelvis');
  const pubis = getRelevantSkeletalInputFields('Pubis');
  const pelvicInletShape = pelvis.find((field) => field.field === 'pelvic_inlet_shape');
  assert.ok(pelvis.some((field) => field.field === 'subpubic_angle'));
  assert.equal(pelvicInletShape.type, 'select');
  assert.deepEqual(pelvicInletShape.options, [
    'Gynecoid (Round or slightly oval)',
    'Android (Heart shaped or wedge shaped)',
    'Anthropoid (Upright oval or egg-shaped)',
    'Platypelloid (Flattened oval)',
  ]);
  assert.ok(pubis.some((field) => field.field === 'pelvis_size'));
});

test('pelvic inlet shape is stored in skeletal input payload', () => {
  assert.deepEqual(buildSkeletalInputPayload('Pelvis', {
    pelvic_inlet_shape: 'Gynecoid (Round or slightly oval)',
  }), {
    pelvic_inlet_shape: 'Gynecoid (Round or slightly oval)',
  });
});

test('general bone measurements do not create skeletal input payloads', () => {
  const payload = buildSkeletalInputPayload('Tibia', {
    length_cm: 34,
    width_cm: 3.8,
    thickness_cm: 2.1,
  });
  assert.deepEqual(payload, {});
});

test('only relevant values remain for the selected bone type while preserving valid active fields', () => {
  const existing = {
    skull_brow_ridge: 'Moderate',
    mastoid_process_size: '25–30 mm',
    femur_length: 420,
  };
  const next = keepRelevantSkeletalValues('Femur', existing);
  assert.equal(next.skull_brow_ridge, undefined);
  assert.equal(next.femur_length, 420);
  assert.equal(next.mastoid_process_size, undefined);
});

test('build payload ignores blanks and keeps valid numeric fields', () => {
  const payload = buildSkeletalInputPayload('Femur', {
    femur_length: '420',
    femur_head_diameter: '',
    lower_limb_robusticity: 'Robust',
  });
  assert.deepEqual(payload, {
    femur_length: 420,
    lower_limb_robusticity: 'Robust',
  });
});

test('generic measurements populate existing specimen dimensions in centimetres', () => {
  assert.deepEqual(buildSpecimenDimensionPayload([
    { measurement_type: 'Maximum Length', value: '420', unit: 'mm' },
    { measurement_type: 'Maximum Width', value: '4.2', unit: 'cm' },
    { measurement_type: 'Thickness', value: '0.3', unit: 'm' },
  ]), {
    length_cm: 42,
    width_cm: 4.2,
    thickness_cm: 30,
  });
});
