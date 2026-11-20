/* The gait diagram.

   src/gait.js makes a footfall pattern a point on Hildebrand's two axes. Two
   checks:

     1  the named gaits come out of the numbers;
     2  the roe deer's two hand-typed patterns are the points docs/LIFE.md
        classifies them as, so the law reproduces the animal in the world. */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIMBS, asymmetricStrikes, contactSchedule, isSingleFoot, sequenceName,
  strikeSamples, supportCount, symmetricStrikes,
} from '../src/gait.js';
import {
  DEER_GALLOP_GAIT, DEER_WALK_GAIT, GALLOP_CONTACTS, WALK_STRIKE,
} from '../src/body-deer.js';

const report = (title, lines) => {
  if (!process.env.FROSTWIND_TEST_REPORT) return;
  console.log(`\n  ${title}\n${lines.join('\n')}`);
};

test('a symmetrical gait is named by its lag, not by a label beside it', () => {
  const lines = [];
  for (const [lag, name] of [[0, 'pace'], [0.25, 'lateral-sequence'],
                             [0.5, 'trot'], [0.75, 'diagonal-sequence']]) {
    assert.equal(sequenceName(lag), name);
    const s = symmetricStrikes(lag);
    /* Symmetrical: the two feet of a girdle are half a cycle apart, at every
       lag. */
    assert.ok(Math.abs(((s.RH - s.LH) % 1 + 1) % 1 - 0.5) < 1e-9);
    assert.ok(Math.abs(((s.RF - s.LF) % 1 + 1) % 1 - 0.5) < 1e-9);
    lines.push(`    lag ${lag.toFixed(2)}  ${name.padEnd(18)}`
      + LIMBS.map((l) => `${l} ${s[l].toFixed(3)}`).join('  '));
  }
  /* Only the quarter points put one foot down at a time. */
  assert.ok(isSingleFoot(0.25) && isSingleFoot(0.75));
  assert.ok(!isSingleFoot(0.5) && !isSingleFoot(0));
  report('symmetrical gaits by lag', lines);
});

test('rotary and transverse differ by which forefoot lands first', () => {
  const base = { firstHind: 'RH', hindLag: 0.125, foreLag: 0.125, girdleGap: 0.5 };
  const rotary = asymmetricStrikes({ ...base, couplets: 'rotary' });
  const transverse = asymmetricStrikes({ ...base, couplets: 'transverse' });
  /* Rotary sends the sequence around the body, so the first fore is opposite
     the first hind. Transverse keeps the same side order in both girdles. */
  assert.ok(rotary.LF < rotary.RF, 'rotary after RH should lead with LF');
  assert.ok(transverse.RF < transverse.LF, 'transverse after RH should lead with RF');
  assert.deepEqual(
    LIMBS.slice().sort((a, b) => rotary[a] - rotary[b]),
    ['RH', 'LH', 'LF', 'RF']);
  assert.deepEqual(
    LIMBS.slice().sort((a, b) => transverse[a] - transverse[b]),
    ['RH', 'LH', 'RF', 'LF']);
});

test('a walk always has support and only an asymmetrical gait may fly', () => {
  /* Duty above a half cannot leave the ground: every foot is planted for more
     than half a cycle, so at any phase at least two are down. */
  const walk = contactSchedule({
    samples: 8, duty: 0.75, strikes: symmetricStrikes(0.25) });
  assert.ok(Math.min(...supportCount(walk)) >= 3,
    `a 0.75-duty walk dropped to ${Math.min(...supportCount(walk))} feet`);

  const gallop = contactSchedule({
    samples: 8, duty: 0.25,
    strikes: asymmetricStrikes({ firstHind: 'RH', hindLag: 0.125,
      foreLag: 0.125, girdleGap: 0.5, couplets: 'rotary' }) });
  assert.equal(supportCount(gallop).filter((n) => n === 0).length, 2,
    'a 0.25-duty rotary gallop should spend two of eight samples in flight');
});

test('a gait whose strikes miss the sample grid says so', () => {
  /* A rig that indexes keys by frame cannot hold a strike between two of
     them, so an off-grid strike throws. */
  assert.throws(() => strikeSamples(symmetricStrikes(1 / 3), 8),
    /not a whole key/);
  assert.doesNotThrow(() => strikeSamples(symmetricStrikes(1 / 4), 8));
});

test('the roe deer walk is the lateral-sequence single-foot point', () => {
  assert.equal(sequenceName(DEER_WALK_GAIT.lag), 'lateral-sequence');
  assert.ok(isSingleFoot(DEER_WALK_GAIT.lag),
    'docs/LIFE.md calls this a single-foot walk, so the footfalls are even');
  /* The hand-typed table. */
  assert.deepEqual({ ...WALK_STRIKE }, { LH: 0, LF: 2, RH: 4, RF: 6 });

  const schedule = contactSchedule({
    samples: DEER_WALK_GAIT.samples, duty: DEER_WALK_GAIT.duty,
    strikes: symmetricStrikes(DEER_WALK_GAIT.lag) });
  const support = supportCount(schedule);
  /* docs/LIFE.md: each hoof stands for six of eight samples, one limb swings
     at a time, every sample has three supports, no flight phase. */
  assert.equal(DEER_WALK_GAIT.duty * DEER_WALK_GAIT.samples, 6);
  assert.deepEqual([...new Set(support)], [3]);
  report('roe deer walk', schedule.map((down, i) =>
    `    ${i}  ${down.slice().sort().join(' ').padEnd(14)} ${down.length} down`));
});

test('the roe deer gallop is the rotary point, and reproduces its old table', () => {
  const strikes = asymmetricStrikes(DEER_GALLOP_GAIT);
  const schedule = contactSchedule({
    samples: DEER_GALLOP_GAIT.samples, duty: DEER_GALLOP_GAIT.duty, strikes });

  /* Biancardi & Minetti classify the species as a rotary galloper, and
     docs/LIFE.md states the cycle as RH, LH, LF, RF. */
  assert.deepEqual(
    LIMBS.slice().sort((a, b) => strikes[a] - strikes[b]),
    ['RH', 'LH', 'LF', 'RF']);

  /* The hand-typed eight-entry table: the law lands on it exactly. */
  const sorted = (rows) => rows.map((r) => r.slice().sort());
  assert.deepEqual(sorted(schedule), sorted([
    [], ['RH'], ['RH', 'LH'], ['LH'], [], ['LF'], ['LF', 'RF'], ['RF'],
  ]));
  assert.deepEqual(sorted(GALLOP_CONTACTS), sorted(schedule));

  /* Two flight samples, one gathered and one extended, which docs/LIFE.md
     records as a pixel-medium choice rather than a published roe-deer timing. */
  assert.deepEqual(supportCount(schedule), [0, 1, 2, 1, 0, 1, 2, 1]);
  report('roe deer rotary gallop', schedule.map((down, i) =>
    `    ${i}  ${down.slice().sort().join(' ').padEnd(14)}`
    + `${down.length === 0 ? 'flight' : down.length + ' down'}`));
});
