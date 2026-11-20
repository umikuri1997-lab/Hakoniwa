import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ANIMALS } from '../src/atlas.js';
import { RIGGED, makeRigged, validateSpec } from '../src/bestiary.js';
import { ACTOR } from '../src/fauna.js';
import { IDENTITY_CLASS, LIFE, validateLifeCatalog } from '../src/life.js';
import { PLAYER_H, PX_PER_M } from '../src/scale.js';
import { SCENES } from '../src/scene.js';
import {
  BILL_M, FOLLOW_M, STORK_COMPANION, STORK_CYCLE_PX, STORK_HEIGHT_M,
  STORK_LENGTH_M,
} from '../src/stork.js';
import { DASH_STRIDE_M, EAR_M, HARE_BODY_M, HARE_GAIT, HARE_SPEED } from '../src/hare.js';
import { FILM_SCALE, REAL_BODY_M, SKIMMER_SPEED, SPAN_M } from '../src/skimmer.js';
import { KEPT_SCALE, REAL_SHELL_M, SHELL_M, SNAIL_SPEED } from '../src/lampsnail.js';
import { OLM_M } from '../src/olm.js';
import { BELL_M, LANTERN_SCALE, LANTERN_SPEC, REAL_BODY_M as REAL_LARVA_M,
  THREAD_M } from '../src/driftlantern.js';
import { makePaleDeer, makeRoeDeer } from '../src/figure-deer.js';
import { LUMEN } from '../src/sprite.js';
import { makeWorldGen } from '../src/worldgen.js';
import { extent as box, measure, rosterOf } from '../tools/lineup.mjs';
import { connectivity } from './folk-helpers.mjs';

const REPORT = process.env.FROSTWIND_TEST_REPORT === '1';

/* one painter per body, as the atlas holds them */
const [makeStork, makeHare, makeSnail, makeOlm, makeLantern, makeCarbuncle] =
  ['stork', 'hare', 'lampsnail', 'olm', 'driftlantern', 'carbuncle']
    .map((kind) => makeRigged(RIGGED.find((q) => q.kind === kind)));
/* the ramp a material resolves through, for a body with this actor row */
const rampOf = (mat, F) => ({ 1: F.ramp, 2: F.ramp2, 4: 'trunk', 6: F.ramp2 || 'accent',
  10: 'machineSignal', 11: 'machineSignal', 16: 'skin', 17: 'folkDark', 18: 'folkDye',
  19: F.ramp2 })[mat];
const DOSSIER = { boreal: 'BOREAL', meadow: 'MEADOW', swamp: 'SWAMP', desert: 'DESERT',
  hollow: 'HOLLOW' };
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/* THE RIG'S LAWS. Every body in src/bestiary.js is held to all of them; a
   new creature is a row in that list and gets these for nothing. */

test('a spec states its reasons and its size before it is drawn', () => {
  for (const spec of RIGGED) assert.deepEqual(validateSpec(spec), []);
  /* the validator refuses what it should */
  const bare = { ...RIGGED[0], brief: { cause: 'x' }, size: {} };
  assert.ok(validateSpec(bare).length >= 3, 'a spec with no reasons passed');
  const lawless = { ...RIGGED[0], brief: { ...RIGGED[0].brief, boundary: [] } };
  assert.ok(validateSpec(lawless).some((e) => /ordinary/.test(e)),
    'a fictional body with no boundary passed');
});

test('every rigged body is one piece, inside its canvas, in its own materials', () => {
  for (const spec of RIGGED) {
    const make = makeRigged(spec), keys = new Set(), views = new Set();
    let frames = 0;
    for (const [state, n] of Object.entries(spec.states))
      for (let d = 0; d < 3; d++) for (let f = 0; f < n; f++) {
        const sp = make(null, f, d, state);
        const where = `${spec.kind} ${state} dir ${d} frame ${f}`;
        frames++;
        for (let x = 0; x < sp.w; x++) {
          assert.equal(sp.occ[x], 0, `${where} clips at the top`);
          assert.equal(sp.occ[(sp.h - 1) * sp.w + x], 0, `${where} clips at the bottom`);
        }
        for (let y = 0; y < sp.h; y++) {
          assert.equal(sp.occ[y * sp.w], 0, `${where} clips at the left`);
          assert.equal(sp.occ[y * sp.w + sp.w - 1], 0, `${where} clips at the right`);
        }
        const { joined, total } = connectivity(sp);
        assert.equal(joined, total, `${where} is ${total - joined} pixels off its body`);
        for (let i = 0; i < sp.occ.length; i++)
          assert.ok(sp.occ[i] === 0 || spec.mats.includes(sp.occ[i]),
            `${where} paints material ${sp.occ[i]}, outside ${spec.mats}`);
        if (d === 2) keys.add(`${state}:${sp.occ.join('')}`);
        if (f === 0 && state === ACTOR[spec.kind].moveState) views.add(sp.occ.join(''));
      }
    /* Every frame differs in profile, and the three views are three shapes.
       An axial view may repeat a frame: a lamp at the head cannot show from
       behind, and the atlas packs the twin once. */
    assert.equal(keys.size, frames / 3, `${spec.kind}: two profile frames bake to the same pixels`);
    assert.equal(views.size, 3, `${spec.kind}: two views bake to the same pixels`);
    if (REPORT) {
      const b = box(make(null, 0, 2, ACTOR[spec.kind].moveState));
      console.log(`  RIG ${spec.kind} — ${frames} frames, profile ${b.w}x${b.h} px, ${b.n} px`);
    }
  }
});

test('a rigged body is the size it states, and rests on its ground row', () => {
  for (const spec of RIGGED) {
    const make = makeRigged(spec);
    const b = box(make(null, 0, 2, spec.size.state));
    const want = { w: spec.size.length * PX_PER_M, h: spec.size.height * PX_PER_M };
    assert.ok(Math.abs(b.w - want.w) <= 2 && Math.abs(b.h - want.h) <= 2,
      `${spec.kind} states ${spec.size.length} x ${spec.size.height} m (${want.w.toFixed(1)} x `
      + `${want.h.toFixed(1)} px) and draws ${b.w} x ${b.h}`);
    const rest = box(make(null, 0, 2, ACTOR[spec.kind].restState));
    assert.ok(rest.y1 >= spec.canvas.ay,
      `${spec.kind} at rest ends ${spec.canvas.ay - rest.y1} rows over its ground row`);
    /* Proportion to the world: in no view and no frame is a body larger
       than the traveller is tall, unless its spec says why. Measured: a
       skimmer at ten times life spanned 31 px beside a 26 px person. */
    if (spec.size.larger) continue;
    for (const [state, n] of Object.entries(spec.states))
      for (let d = 0; d < 3; d++) for (let f = 0; f < n; f++) {
        const e = box(make(null, f, d, state));
        assert.ok(Math.max(e.w, e.h) <= PLAYER_H,
          `${spec.kind} ${state} dir ${d} is ${Math.max(e.w, e.h)} px across, over the `
          + `traveller's ${PLAYER_H}: state why in size.larger or scale it down`);
      }
  }
});

test('a body does not jump between the frames of one state', () => {
  /* The mass of the sprite moves at most two pixels from one frame to the
     next, in every view. The largest today is the stork's clatter, 1.52. A
     pose table that pops shows here. */
  for (const spec of RIGGED) {
    const make = makeRigged(spec);
    for (const [state, n] of Object.entries(spec.states)) for (let d = 0; d < 3; d++)
      for (let f = 0; f < n && n > 1; f++) {
        const a = box(make(null, f, d, state)), b = box(make(null, (f + 1) % n, d, state));
        const moved = Math.hypot(a.cx - b.cx, a.cy - b.cy);
        assert.ok(moved <= 2.0, `${spec.kind} ${state} dir ${d}: frames ${f} and ${(f + 1) % n} `
          + `sit ${moved.toFixed(2)} px apart`);
      }
  }
});

test('a rigged body draws in ramps its world declares, and leaves its ground', () => {
  for (const spec of RIGGED) {
    const F = ACTOR[spec.kind];
    const scene = Object.values(SCENES).find((q) => q.biome === spec.biome);
    for (const mat of spec.mats) {
      const ramp = rampOf(mat, F);
      assert.ok(ramp, `${spec.kind} paints material ${mat} and its actor row names no ramp for it`);
      assert.ok(scene.ramps.includes(ramp),
        `${spec.kind} material ${mat} resolves through ${ramp}, which ${spec.biome} does not declare`);
    }
    if (spec.mats.includes(6))
      assert.equal(F.ramp2, undefined, `${spec.kind}: a ramp2 repaints its accent parts`);
    const body = rosterOf(spec.biome).find((q) => q.name === spec.kind);
    assert.ok(body, `${spec.kind} is not in ${spec.biome}'s roster`);
    const m = measure(body, spec.biome);
    assert.ok(m.clear >= 0.35, `only ${(m.clear * 100).toFixed(0)}% of ${spec.kind} stands clear `
      + `of the ground colours of ${spec.biome}: it has no silhouette there`);
  }
});

test('a rigged body is wired once through every authority, and written down', () => {
  const canon = read('docs/CANON.md');
  for (const spec of RIGGED) {
    assert.deepEqual(ANIMALS[spec.kind].states, spec.states);
    const F = ACTOR[spec.kind], P = LIFE[spec.kind];
    assert.ok(F && P, `${spec.kind} lacks an actor row or a life profile`);
    for (const state of [F.moveState, F.restState, F.fleeState])
      assert.ok(spec.states[state], `${spec.kind}: actor state ${state} is not baked`);
    /* a reactive action with a baked state of its name is drawn; one named
       in the profile and baked under another name is not */
    for (const action of [...P.fear.actions, ...P.aggression.actions])
      assert.ok(spec.states[action] || ['flee', 'orient', 'hold', 'freeze'].includes(action),
        `${spec.kind} answers with ${action}, which no state draws`);
    assert.deepEqual(P.biomes, [spec.biome]);
    const fictional = P.identity.class === IDENTITY_CLASS.fictional;
    assert.equal(!!spec.brief.law, fictional,
      `${spec.kind}: the brief and the life profile disagree on whether it is invented`);
    const dossier = read(`docs/life/${DOSSIER[spec.biome]}.md`).toLowerCase();
    assert.ok(dossier.includes(P.identity.common),
      `docs/life/${DOSSIER[spec.biome]}.md does not name the ${P.identity.common}`);
    if (fictional) {
      const lawName = spec.brief.law.split(':')[0].replace(/^the /, '');
      assert.ok(canon.toLowerCase().includes(lawName),
        `docs/CANON.md has no row for the ${lawName}`);
    }
  }
  assert.deepEqual(validateLifeCatalog(), []);
});

test('every rigged body finds a place to live in the world the page builds', () => {
  /* A profile with no legal anchor compiles to nothing, in silence. These
     are the options src/index.html starts with. */
  const plans = {};
  for (const spec of RIGGED) {
    plans[spec.biome] ||= makeWorldGen(20260727,
      { biome: spec.biome, lake: 0.55, density: 0.95 }).compileLifePlans();
    const cohorts = plans[spec.biome].cohorts.filter((q) => q.profileId === spec.kind);
    assert.ok(cohorts.length >= 1, `${spec.biome} compiled no ${spec.kind}`);
    for (let i = 0; i < cohorts.length; i++) for (let j = i + 1; j < cohorts.length; j++)
      assert.ok(Math.hypot(cohorts[i].anchor.x - cohorts[j].anchor.x,
        cohorts[i].anchor.y - cohorts[j].anchor.y) >= 60,
        `two ${spec.kind} cohorts anchor on one spot`);
  }
});

test('the white stork is the measured bird: height, length, bill, and where it follows', () => {
  const side = box(makeStork(null, 0, 2, 'stand'));
  assert.ok(Math.abs(side.h - STORK_HEIGHT_M * PX_PER_M) <= 2,
    `it stands ${side.h} px against ${(STORK_HEIGHT_M * PX_PER_M).toFixed(1)}`);
  assert.ok(STORK_LENGTH_M >= 1.00 && STORK_LENGTH_M <= 1.15);
  assert.ok(BILL_M >= 0.14 && BILL_M <= 0.19);
  /* red on two things only, and the black is the rear */
  const sp = makeStork(null, 0, 2, 'stalk');
  let red = 0, black = 0, blackX = 0, bodyX = 0, body = 0;
  for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
    const m = sp.occ[y * sp.w + x];
    if (m === 6) red++;
    if (m === 17) { black++; blackX += x; }
    if (m === 1) { body++; bodyX += x; }
  }
  assert.ok(red >= 8 && black >= 3 && body >= 14, `red ${red}, black ${black}, body ${body}`);
  assert.ok(blackX / black < bodyX / body, 'the black flight feathers are not at the rear');
  /* at rest it stands on one leg */
  const stand = makeStork(null, 0, 2, 'stand');
  const cols = new Set();
  for (let x = 0; x < stand.w; x++) if (stand.occ[stand.ay * stand.w + x]) cols.add(x);
  assert.equal(cols.size, 1, `${cols.size} feet are on the ground at rest`);
  /* it follows a swath behind, never at the heel */
  assert.equal(STORK_COMPANION.followDistance, Math.round(FOLLOW_M * PX_PER_M));
  assert.ok(STORK_COMPANION.followDistance > 8 * ACTOR.shadeguest.companion.followDistance);
  /* a planted leg is one column: the stork at rest shows no knee */
  for (const state of ['stand', 'greet']) {
    const s2 = makeStork(null, 0, 2, state), legCols = new Set();
    for (let y = s2.ay - 6; y <= s2.ay; y++) for (let x = 0; x < s2.w; x++)
      if (s2.occ[y * s2.w + x] === 6) legCols.add(x);
    assert.ok(legCols.size <= (state === 'stand' ? 1 : 2),
      `a standing stork's legs span ${legCols.size} columns in ${state}: a planted leg is straight`);
  }
  const F = ACTOR.stork;
  assert.ok(Math.abs(F.gait - 4 * F.speed / STORK_CYCLE_PX) < 1e-9);
  assert.equal(F.ramp2, undefined, 'a ramp2 would repaint the red bill and legs');
  for (const claim of ['flight', 'brood', 'migration'])
    assert.ok(LIFE.stork.nonClaims.includes(claim), `${claim} is not refused`);
});

test('the brown hare has a form, a raised ear, and a bound', () => {
  const lope = box(makeHare(null, 0, 2, 'lope'));
  assert.ok(Math.abs(lope.w - HARE_BODY_M * PX_PER_M) <= 2,
    `it is ${lope.w} px long against ${(HARE_BODY_M * PX_PER_M).toFixed(1)}`);
  const form = box(makeHare(null, 0, 2, 'form'));
  const up = box(makeHare(null, 0, 2, 'orient'));
  /* the ear is the difference between the two rest shapes */
  assert.ok(up.h - form.h >= Math.round(EAR_M * PX_PER_M),
    `the form is ${form.h} rows and the alert hare ${up.h}`);
  /* a form is the body on the ground: nothing under the ground row, and no
     higher than the body with its ears laid flat */
  const sp = makeHare(null, 0, 2, 'form');
  for (let x = 0; x < sp.w; x++)
    assert.equal(sp.occ[(sp.ay + 1) * sp.w + x], 0, 'a hare in its form shows a foot');
  assert.ok(form.h <= 5, `the form stands ${form.h} rows out of the grass`);
  /* cadence is ground covered per bound */
  assert.ok(Math.abs(HARE_GAIT.dash - 4 * HARE_SPEED.dash / (DASH_STRIDE_M * PX_PER_M)) < 1e-9);
  assert.ok(HARE_SPEED.dash / PX_PER_M * 3.6 <= 70, 'the dash is over the measured burst');
  assert.ok(ACTOR.hare.runSpeed > 5 * 36.4, 'a walker could keep up with a flushed hare');
  assert.deepEqual(LIFE.hare.fear.actions, ['freeze', 'flee']);
});

test('the two swamp inventions are one law each, on a real body', () => {
  assert.ok(Math.abs(SPAN_M / (REAL_BODY_M * FILM_SCALE) - 200 / 36) < 0.3,
    'the skimmer lost the real strider\'s span to body ratio');
  assert.ok(Math.abs(SKIMMER_SPEED.burst / PX_PER_M - 1.5) < 1e-9);
  assert.deepEqual(LIFE.skimmer.conditions.medium, ['shallow', 'deep']);
  assert.equal(SHELL_M, REAL_SHELL_M * KEPT_SCALE);
  assert.ok(SNAIL_SPEED / PX_PER_M <= 0.013, 'the lamp snail outruns a snail');
  /* it flashes: lit and dark frames alternate, and a hidden snail is dark */
  const lamp = (state, f) => {
    const sp = makeSnail(null, f, 2, state);
    return [...sp.occ].filter((m) => m === 11).length;
  };
  assert.ok(lamp('glide', 0) > 0 && lamp('glide', 1) === 0 && lamp('rest', 0) > 0
    && lamp('rest', 1) === 0, 'the lamp does not flash');
  assert.equal(lamp('hide', 0), 0, 'a withdrawn snail still shows its light');
});

test('the Hollow holds one real animal at life size and three bodies of one law each', () => {
  const count = (sp, mat) => [...sp.occ].filter((m) => m === mat).length;
  /* the olm: its own size, over the three-pixel floor, and never on land */
  const olm = box(makeOlm(null, 0, 2, 'rest'));
  assert.ok(OLM_M <= 0.30 && olm.w >= 3 && olm.h === 1,
    `the olm is ${OLM_M} m and draws ${olm.w} x ${olm.h}`);
  assert.equal(LIFE.olm.identity.taxon, 'Proteus anguinus');
  assert.ok(!LIFE.olm.conditions.medium.includes('dry'));
  assert.ok(LIFE.olm.nonClaims.includes('boreal-range'), 'the olm claims a boreal range');
  /* the lantern: a bell at the floor, the real snares, one lamp, a mooring */
  assert.equal(BELL_M, REAL_LARVA_M * LANTERN_SCALE);
  assert.equal(box(makeLantern(null, 0, 2, 'moor')).w, 3);
  assert.ok(Math.max(...THREAD_M) <= 0.5, 'a snare is longer than the real 0.5 m');
  for (const [state, n] of Object.entries(LANTERN_SPEC.states)) for (let f = 0; f < n; f++) {
    const sp = makeLantern(null, f, 2, state);
    const lamps = [...sp.occ].filter((m, i) => m === LUMEN && sp.shade[i] === 1).length;
    assert.equal(lamps, 1, `${state}:${f} shows ${lamps} lamps`);
    const touches = box(sp).y1 === sp.ay;
    assert.equal(touches, state === 'moor', `${state}:${f} ${touches ? 'drags' : 'hangs off'} the floor`);
  }
  assert.deepEqual(LIFE.driftlantern.fear.actions, [], 'a body with no thrust flees');
  /* the carbuncle: the hare's numbers, and one stone in every frame it faces */
  for (const key of ['speed', 'runSpeed', 'gait', 'runGait', 'states'])
    assert.equal(ACTOR.carbuncle[key], ACTOR.hare[key], `the carbuncle's ${key} left the hare's`);
  for (const [state, n] of Object.entries(ACTOR.carbuncle.states))
    for (const d of [2, 0]) for (let f = 0; f < n; f++)
      assert.equal(count(makeCarbuncle(null, f, d, state), LUMEN), 1,
        `${state}:${f} dir ${d} does not show one stone`);
  /* the pale deer: the roe deer's silhouette, a coat on the skin ramp, a
     crystal rack, and nothing on the trunk ramp or the snow deposit */
  for (const d of [2, 0, 1]) {
    const pale = makePaleDeer(null, 0, d, 'idle'), roe = makeRoeDeer(null, 0, d, 'idle');
    assert.deepEqual([...pale.occ].map(Boolean), [...roe.occ].map(Boolean),
      `dir ${d}: the pale deer left the roe deer's outline`);
    assert.deepEqual([...new Set(pale.occ)].filter(Boolean).sort(), [16, LUMEN]);
    assert.ok(count(pale, LUMEN) >= 5, `dir ${d}: the rack is ${count(pale, LUMEN)} pixels`);
  }
  assert.ok(read('docs/CANON.md').toLowerCase().includes('earth herd'));
  assert.ok(read('docs/life/HOLLOW.md').toLowerCase().includes(LIFE.paleDeer.identity.common));
  /* each keeps to its place: the herd in the hall, a stone by the crystals,
     the olm in water */
  const gen = makeWorldGen(20260727, { biome: 'hollow', lake: 0.55, density: 0.95 });
  const within = (c, kind) => gen.POI.some((p) => p.kind === kind
    && Math.hypot(c.anchor.x - p.x, c.anchor.y - p.y) <= p.r);
  for (const c of gen.compileLifePlans().cohorts) {
    const site = gen.lifeSiteAt(c.anchor.x, c.anchor.y);
    assert.ok(!site.conditions.rock, `${c.id} anchors in rock`);
    if (c.profileId === 'paleDeer') assert.ok(within(c, 'village'), 'the herd left the hall');
    if (c.profileId === 'carbuncle') assert.ok(within(c, 'geode'), `${c.id} is off the crystals`);
    if (c.profileId === 'olm') assert.ok(site.conditions.water, `${c.id} is on land`);
  }
});
