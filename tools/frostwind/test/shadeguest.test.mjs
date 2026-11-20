import assert from 'node:assert/strict';
import test from 'node:test';

import { ANIMALS } from '../src/atlas.js';
import { makeRigged } from '../src/bestiary.js';
import { ACTOR } from '../src/fauna.js';
import { LIFE, PROVENANCE, validateLifeCatalog } from '../src/life.js';
import { MACHINE_COMPANION } from '../src/life-runtime.js';
import { HUMAN_M, PX_PER_M } from '../src/scale.js';
import {
  BODY, BODY_M, GUEST_COMPANION, GUEST_CYCLE_PX, GUEST_GAIT,
  GUEST_SPEC, GUEST_SPEED, GUEST_STATES, HEEL_PX, LEGS, NOON_SHADOW_M,
  SPAN_M, SUN_LIMIT_S, SUN_TETHER_PX,
} from '../src/shadeguest.js';
import { SUN } from '../src/sunlight.js';
import { extent as box } from '../tools/lineup.mjs';

/* The rig's own laws (clip, one piece, materials) are held for every body in
   test/skeleton.test.mjs. These are the shade guest's. */
const REPORT = process.env.FROSTWIND_TEST_REPORT === '1';
const makeShadeguest = makeRigged(GUEST_SPEC);

test('one invented law, and every other number is the real animal or a derivation', () => {
  /* the three parts make the stated body, end to end */
  const tail = BODY.abdomen.u - BODY.abdomen.ru, nose = BODY.jaws.u + BODY.jaws.ru;
  assert.ok(Math.abs((nose - tail) - BODY_M) < 0.02,
    `the body parts span ${(nose - tail).toFixed(3)} m against a stated ${BODY_M} m`);
  /* jaws near a third of the body: the order's signature */
  const jawShare = 2 * BODY.jaws.ru / BODY_M;
  assert.ok(jawShare > 0.24 && jawShare < 0.34, `jaws are ${jawShare.toFixed(2)} of the body`);
  /* the hind pair is the longest, the first pair is carried forward */
  const reach = LEGS.map((q) => Math.hypot(q.foot[0] - q.hip[0], q.foot[1] - q.hip[1]));
  assert.equal(reach.indexOf(Math.max(...reach)), 3, 'leg IV is not the longest');
  assert.ok(LEGS[0].foot[0] > BODY.jaws.u, 'leg I does not reach past the jaws');
  /* no pace with size: the dash is the real animal's 16 km/h */
  assert.ok(Math.abs(GUEST_SPEED.dash / PX_PER_M - 16 / 3.6) < 1e-9);
  /* the tether is out and back at the scuttle inside the sun limit */
  assert.ok(2 * SUN_TETHER_PX / GUEST_SPEED.scuttle <= SUN_LIMIT_S + 0.05,
    'the tether is further than it can go and come back inside the sun limit');
  /* a noon walker is shade only at the heel */
  assert.ok(NOON_SHADOW_M < 0.05,
    `a person casts ${NOON_SHADOW_M.toFixed(3)} m of shade at the desert noon`);
  assert.ok(HEEL_PX <= Math.round(BODY_M * PX_PER_M),
    'it follows from further than its own length, which is not at the heel');
  if (REPORT) console.log(`  SHADE GUEST — body ${BODY_M.toFixed(2)} m, span ${SPAN_M.toFixed(2)} m, `
    + `noon shadow ${(NOON_SHADOW_M * 100).toFixed(1)} cm, heel ${HEEL_PX} px, tether ${SUN_TETHER_PX} px`);
});

test('the raster is the skeleton projected: scale, and three views of one body', () => {
  const side = box(makeShadeguest(null, 0, 2, 'scuttle'));
  const front = box(makeShadeguest(null, 0, 0, 'scuttle'));
  /* profile length is the body plus the forward feelers, within two pixels */
  const lenPx = (BODY.jaws.u + BODY.jaws.ru + 0.20 - (LEGS[3].foot[0] - 0.075)) * PX_PER_M;
  assert.ok(Math.abs(side.w - lenPx) <= 3,
    `the profile is ${side.w} px long against a derived ${lenPx.toFixed(1)}`);
  /* head-on it is as wide as its leg span */
  assert.ok(Math.abs(front.w - SPAN_M * PX_PER_M) <= 2,
    `the front view is ${front.w} px wide against a span of ${(SPAN_M * PX_PER_M).toFixed(1)}`);
  /* cabinet projection: the leg span is depth in profile and draws half as
     many rows as it does columns head-on */
  assert.ok(side.h < front.w * 0.75,
    `profile height ${side.h} is not foreshortened against a front width of ${front.w}`);
  /* every frame of every view is its own shape */
  const keys = new Set();
  for (const [state, n] of Object.entries(GUEST_STATES))
    for (let d = 0; d < 3; d++) for (let f = 0; f < n; f++)
      keys.add(`${state}:${d}:${makeShadeguest(null, f, d, state).occ.join('')}`);
  const frames = Object.values(GUEST_STATES).reduce((a, b) => a + b, 0) * 3;
  assert.equal(keys.size, frames, 'two frames or two views bake to the same pixels');
});

test('the body is laid over its legs, and far legs stand above the near ones', () => {
  const sp = makeShadeguest(null, 0, 2, 'scuttle');
  const b = box(sp);
  /* limb pixels above the anchor row are the far side, below it the near */
  let above = 0, below = 0, body = 0;
  for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
    const m = sp.occ[y * sp.w + x];
    if (m === 6) body++;
    if (m !== 17) continue;
    if (y < sp.ay - 3) above++; else if (y > sp.ay - 3) below++;
  }
  assert.ok(above >= 4 && below >= 8,
    `the profile shows ${above} far-limb and ${below} near-limb pixels`);
  /* the wild hue is the mass: more body than leg would hide what it is */
  assert.ok(body >= 24, `only ${body} px of body in a ${b.w}x${b.h} sprite`);
});

test('it is wired as one body: atlas, actor, life, and its own companion row', () => {
  assert.deepEqual([...ANIMALS.shadeguest.make(null, 1, 2, 'scuttle').occ],
    [...makeShadeguest(null, 1, 2, 'scuttle').occ], 'the atlas bakes another body');
  assert.deepEqual(GUEST_SPEC.mats, [6, 17], 'the body is the accent, the limbs folkDark');
  assert.deepEqual(ANIMALS.shadeguest.states, GUEST_STATES);
  const F = ACTOR.shadeguest;
  for (const state of [F.moveState, F.restState, F.fleeState])
    assert.ok(GUEST_STATES[state], `actor state ${state} is not baked`);
  assert.ok(GUEST_STATES.greet, 'the runtime greets through a `greet` bank');
  /* cadence is ground covered: frames per second = frames * speed / cycle */
  assert.ok(Math.abs(F.gait - GUEST_STATES.scuttle * F.speed / GUEST_CYCLE_PX) < 1e-9);
  assert.equal(F.runGait, GUEST_GAIT.dash);
  assert.deepEqual(Object.keys(GUEST_COMPANION).sort(), Object.keys(MACHINE_COMPANION).sort(),
    'the companion row does not state every distance the runtime reads');
  assert.equal(GUEST_COMPANION.followDistance, HEEL_PX);
  assert.equal(GUEST_COMPANION.abandonRadius, SUN_TETHER_PX);
  assert.ok(GUEST_COMPANION.followDistance < MACHINE_COMPANION.followDistance / 4,
    'a machine keeps company; this one wants the heel');
  const P = LIFE.shadeguest;
  assert.equal(P.provenance.identity, PROVENANCE.fictional);
  assert.equal(P.provenance.behavior, PROVENANCE.fictional);
  assert.deepEqual(P.biomes, ['desert']);
  for (const claim of ['venom', 'silk', 'predation-on-people'])
    assert.ok(P.nonClaims.includes(claim), `${claim} is not refused`);
  assert.deepEqual(validateLifeCatalog(), []);
});
