/* The second rigged quadruped. Most of this file is the structural gate any
   rig passes. The last test measures the deer and the wolf against each
   other and fails if they stop disagreeing: a shared quadruped module that
   merged their postures would pass every test above it. */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  WOLF_CANTER_GAIT, WOLF_CLIPS, WOLF_CONTACTS, WOLF_GAITS, WOLF_LIFE,
  WOLF_SLIP, WOLF_SPEED, WOLF_SPRINT_GAIT, WOLF_TRAVEL_PX, WOLF_TROT_GAIT,
  measureWolf, wolfPose,
} from '../src/body-wolf.js';
import { makeWolf, projectLeg } from '../src/figure-wolf.js';
import { ROE_DEER_LIFE, measureDeer } from '../src/body-deer.js';
import { asymmetricStrikes, sequenceName, supportCount } from '../src/gait.js';
import { PX_PER_M } from '../src/scale.js';
import { RNG } from '../src/rng.js';

const STATES = ['idle', 'walk', 'trot', 'canter', 'sprint'];
const DIRS = [0, 1, 2];
const sprite = (state, dir, frame) => makeWolf(new RNG(0x0c1f7a), frame, dir, state);
const materialKey = (sp) => `${sp.w}x${sp.h}:` + Array.from(sp.occ).join(',');
const f2 = (v) => v.toFixed(2);

function connectedFraction(sp) {
  const start = sp.occ.findIndex(Boolean);
  if (start < 0) return 1;
  const seen = new Uint8Array(sp.occ.length), stack = [start];
  seen[start] = 1;
  let count = 0, total = 0;
  for (const m of sp.occ) if (m) total++;
  while (stack.length) {
    const i = stack.pop(), x = i % sp.w, y = (i - x)/sp.w;
    count++;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= sp.w || yy >= sp.h) continue;
      const j = yy*sp.w + xx;
      if (!seen[j] && sp.occ[j]) { seen[j] = 1; stack.push(j); }
    }
  }
  return count/total;
}

test('boreal wolf measurements resolve from life through the shared scale', () => {
  const L = WOLF_LIFE.borealMale, M = measureWolf();
  for (const [key, range] of [['bodyLengthM', WOLF_LIFE.bodyLengthM],
                              ['withersM', WOLF_LIFE.shoulderM],
                              ['skullM', WOLF_LIFE.skullM],
                              ['earM', WOLF_LIFE.earM],
                              ['tailM', WOLF_LIFE.tailM]])
    assert.ok(L[key] >= range[0] && L[key] <= range[1],
      `${key} ${L[key]} falls outside the published ${range.join('-')}`);
  assert.equal(M.withers, Math.round(L.withersM*PX_PER_M),
    'withers must come through metresToPx, not a literal');

  /* The topline runs the other way from the deer's. */
  assert.ok(M.withers > M.sacrum,
    `a wolf is withers-high; got withers ${f2(M.withers)} sacrum ${f2(M.sacrum)}`);
  const deer = measureDeer();
  assert.ok(deer.sacrum > deer.withers,
    'the roe deer is rump-high, which is the comparison this rig exists against');
});

test('every clip closes its limb chains without telescoping a segment', () => {
  let worst = 0, where = '';
  for (const state of STATES)
    for (let frame = 0; frame < WOLF_CLIPS[state].n; frame++)
      for (const lead of [1, -1]) {
        const pose = wolfPose({ state, frame, lead });
        for (const leg of pose.legs) {
          const err = Math.max(leg.segmentError, leg.reachError);
          if (err > worst) { worst = err; where = `${state} f${frame} ${leg.limb}`; }
        }
      }
  /* Measured failure: a segment set summing to 10.8 px against a 10.4 px
     standing height clamps at 7.76, a paw off the ground. */
  assert.ok(worst < 1e-6,
    `${where} telescoped by ${worst.toFixed(4)} px; see the segment note in measureWolf`);
});

test('the pose puts down exactly the feet its gait row schedules', () => {
  /* The excursion code reads the schedule, not a parallel table. */
  for (const state of ['walk', 'trot', 'canter', 'sprint'])
    for (let frame = 0; frame < WOLF_CLIPS[state].n; frame++) {
      const got = wolfPose({ state, frame }).contacts.map((c) => c.limb).sort();
      const want = [...WOLF_CONTACTS[state][frame]].sort();
      assert.deepEqual(got, want, `${state} f${frame} contacts drifted from the schedule`);
    }
});

test('the wolf travels at a suspended trot and never flies at a walk', () => {
  assert.equal(sequenceName(WOLF_TROT_GAIT.lag), 'trot');
  const trot = supportCount(WOLF_CONTACTS.trot);
  assert.equal(trot.filter((n) => n === 0).length, 2,
    'a travelling trot carries a suspension');
  assert.deepEqual([...new Set(trot.filter((n) => n > 0))], [2],
    'a trot stands on diagonal pairs');
  const walk = supportCount(WOLF_CONTACTS.walk);
  assert.deepEqual([...new Set(walk)], [3], 'a walk never leaves the ground');
});

test('the canter is transverse and the sprint is rotary, as one species', () => {
  /* Biancardi & Minetti put most Canidae, and wolf and coyote by name, in the
     speed-dependent class: transverse at the canter, rotary at the sprint.
     The roe deer in the same study is rotary at every speed, so `couplets`
     sits on a clip, not on a species. */
  assert.equal(WOLF_CANTER_GAIT.couplets, 'transverse');
  assert.equal(WOLF_SPRINT_GAIT.couplets, 'rotary');

  /* Read the strike phases, never the schedule. A stance that wraps past the
     last key reports sample 0 as its strike, and scanning calls the wolf
     transverse when it is rotary. The same wrap puts a paw 14 px behind the
     animal. */
  const leadPair = (gait) => {
    const s = asymmetricStrikes(gait);
    const later = (a, b) => (s[a] > s[b] ? a : b);
    return [later('LH', 'RH'), later('LF', 'RF')];
  };
  const [ch, cf] = leadPair(WOLF_CANTER_GAIT);
  assert.equal(ch[0], cf[0],
    `transverse puts the leading hind and fore on one side; got ${ch} and ${cf}`);
  const [sh, sf] = leadPair(WOLF_SPRINT_GAIT);
  assert.notEqual(sh[0], sf[0],
    `rotary puts them on opposite sides; got ${sh} and ${sf}`);

  assert.equal(supportCount(WOLF_CONTACTS.sprint).filter((n) => n === 0).length, 2,
    'the sprint carries a gathered and an extended suspension');
});

test('changing lead swaps the side that leads, rather than reordering an array', () => {
  /* A mirror that renames the limb and relabels it gives the same four
     contacts in a different order, which is no lead change. */
  let differed = 0;
  for (const state of ['canter', 'sprint'])
    for (let frame = 0; frame < WOLF_CLIPS[state].n; frame++) {
      const a = wolfPose({ state, frame, lead: 1 }).contacts.map((c) => c.limb).sort().join();
      const b = wolfPose({ state, frame, lead: -1 }).contacts.map((c) => c.limb).sort().join();
      if (a !== b) differed++;
    }
  assert.ok(differed >= 8,
    `only ${differed} of 16 asymmetrical frames changed with the lead`);
});

test('cadence for every gait derives from one declared wolf slip', () => {
  for (const state of Object.keys(WOLF_GAITS)) {
    const clip = WOLF_CLIPS[state];
    const slip = clip.n*WOLF_SPEED[state]/(WOLF_TRAVEL_PX[state]*clip.rate);
    assert.ok(Math.abs(slip - WOLF_SLIP) < 1e-9, `${state} slip ${slip} != ${WOLF_SLIP}`);
  }
});

test('the raster stays grounded, connected, normalised and state-complete', () => {
  for (const state of STATES) for (const dir of DIRS) {
    const frames = [];
    for (let frame = 0; frame < WOLF_CLIPS[state].n; frame++) {
      const sp = sprite(state, dir, frame);
      frames.push(materialKey(sp));
      assert.deepEqual([sp.w, sp.h, sp.ax, sp.ay], [31, 19, 15, 18]);
      assert.ok(sp.poseWolf, `${state} dir${dir} f${frame} lost pose metadata`);
      assert.equal(connectedFraction(sp), 1, `${state} dir${dir} f${frame} disconnected`);
      for (let i = 0; i < sp.occ.length; i++) if (sp.occ[i]) {
        assert.ok(sp.occ[i] === 2 || sp.occ[i] === 4, `unknown wolf material ${sp.occ[i]}`);
        const n = Math.hypot(sp.nx[i], sp.ny[i], sp.nz[i]);
        assert.ok(Number.isFinite(n) && Math.abs(n - 1) < 2e-5,
          `${state} dir${dir} f${frame} normal ${i} has length ${n}`);
      }
    }
    assert.equal(new Set(frames).size, WOLF_CLIPS[state].n,
      `${state} dir${dir} collapsed ${WOLF_CLIPS[state].n - new Set(frames).size} frames`);
  }
});

test('the profile carries a brush, and the alert envelope is the declared height', () => {
  const sp = sprite('idle', 2, 0);
  const rows = [];
  for (let i = 0; i < sp.occ.length; i++) if (sp.occ[i]) rows.push((i/sp.w) | 0);
  assert.equal(Math.max(...rows) - Math.min(...rows) + 1, measureWolf().alertHeight);

  /* A roe deer's tail is almost absent; the wolf's is a third of its body,
     the fastest silhouette difference at nineteen rows. */
  const P = sp.poseWolf;
  const tailX = Math.round(sp.ax + P.tail.tip.x);
  let behind = 0;
  for (let i = 0; i < sp.occ.length; i++)
    if (sp.occ[i] && (i % sp.w) <= tailX + 1) behind++;
  assert.ok(behind >= 4, `the brush collapsed to ${behind} pixels`);
});

test('profile legs raster as straight load lines with one joint pixel', () => {
  const sp = sprite('walk', 2, 0), P = sp.poseWolf;
  for (const leg of P.legs) {
    const R = projectLeg({ cx: sp.ax, dir: 2 }, leg);
    const runs = [R.root, R.joint, R.ankle, R.foot];
    for (const p of runs)
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), 'a projected joint is not finite');
    assert.ok(Math.abs(R.joint.x - Math.round(lerpX(R.root, R.foot, 0.42))) <= 1,
      `${leg.limb} broke its knee by more than one pixel`);
  }
  function lerpX(a, b, t) { return a.x + (b.x - a.x)*t; }
});

test('wolf synthesis is byte-deterministic for every declared bank', () => {
  for (const state of STATES) for (const dir of DIRS)
    for (let frame = 0; frame < WOLF_CLIPS[state].n; frame++)
      assert.equal(materialKey(sprite(state, dir, frame)),
        materialKey(sprite(state, dir, frame)),
        `${state} dir${dir} f${frame} is not reproducible`);
});

/* ── the experiment ──────────────────────────────────────────────────────── */

test('the deer and the wolf disagree everywhere the shared module does not reach', () => {
  const deer = measureDeer(), wolf = measureWolf();
  const rows = [];
  const note = (label, a, b) => rows.push(
    `    ${label.padEnd(30)} deer ${String(a).padStart(8)}   wolf ${String(b).padStart(8)}`);

  /* 1. Size is not the difference: both land within a pixel of each other at
        this scale, so silhouette and gait carry the read. */
  note('nose to rump, px', f2(deer.bodyLength), f2(wolf.bodyLength));
  assert.ok(Math.abs(deer.bodyLength - wolf.bodyLength) < 1.0,
    'the two animals are the same length in pixels; if that changes, say so');

  /* 2. Topline: opposite signs. */
  note('sacrum minus withers, px', f2(deer.sacrum - deer.withers),
    f2(wolf.sacrum - wolf.withers));
  assert.ok((deer.sacrum - deer.withers) > 0 && (wolf.sacrum - wolf.withers) < 0);

  /* 3. Unguligrade against digitigrade, as a distal fraction of the limb. */
  const distal = (seg) => seg[2]/(seg[0] + seg[1] + seg[2]);
  const dFore = distal(deer.segments.fore), wFore = distal(wolf.segments.fore);
  note('distal share of fore limb', f2(dFore), f2(wFore));
  assert.ok(dFore - wFore > 0.08,
    `the deer's distal share is ${f2(dFore)} against the wolf's ${f2(wFore)}; `
    + 'if these converge, one of the two postures has been merged away');

  /* 4. The published ratio behind it. Biancardi & Minetti: the
        metatarsus/femur ratio separates the gallop classes, highest in rotary
        gallopers. Each rig carries its own bone rows. */
  const ratio = (b) => b.metatarsus/b.femur;
  const dR = ratio(ROE_DEER_LIFE.provisionalBonesM);
  const wR = ratio(WOLF_LIFE.provisionalBonesM);
  note('metatarsus / femur', f2(dR), f2(wR));
  assert.ok(dR > wR,
    'the rotary galloper should carry the longer distal segment');

  /* 5. The escape gait: one couplet order against two. */
  note('gallop clips', 1, 2);
  assert.equal(WOLF_CANTER_GAIT.couplets, 'transverse');
  assert.equal(WOLF_SPRINT_GAIT.couplets, 'rotary');

  if (process.env.FROSTWIND_TEST_REPORT)
    console.log('\n  WHAT THE SECOND RIG MEASURED\n' + rows.join('\n')
      + '\n    shared: two-bone solver, three-segment limb, contact schedule, scale'
      + '\n    local:  segments, canvas, topline, foot, head carriage, tail, clips');
});
