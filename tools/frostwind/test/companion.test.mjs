import assert from 'node:assert/strict';
import test from 'node:test';

import { ACTOR } from '../src/fauna.js';
import { LifeSession } from '../src/life-session.js';
import { LifeRuntime } from '../src/life-runtime.js';
import { makeWorldGen } from '../src/worldgen.js';

/* Encounters, stepped the way play steps them: a walker, a clock, and no
   hand on any commitment. test/life-runtime.test.mjs sets `endsAt` itself
   between steps, which hides what the session's own timer does. */

const SEED = 20260727, HZ = 30, WALK = 36.4;
const FRIENDLY = ['approach-traveller', 'greet', 'follow-traveller'];
const world = (biome) => {
  const session = new LifeSession(SEED);
  const gen = makeWorldGen(SEED, { biome, lake: 0.35, density: 0.50 });
  return { session, gen, life: new LifeRuntime(session, gen, biome) };
};
const at = (walker, moving = false) => ({ px: walker.x, py: walker.y, W: 480, H: 270,
  travellerMoving: moving, wind: { x: 1, y: 0 } });

function encounter(biome, profileId, path, seconds) {
  const { life } = world(biome);
  const record = life.records().find((q) => q.profileId === profileId);
  assert.ok(record, `${biome} compiled no ${profileId}`);
  const home = life.positionAt(record);
  const seen = [];
  let walker = path.start(home);
  for (let i = 0; i < seconds * HZ; i++) {
    const next = path.step(walker, i / HZ, home);
    const moving = next.x !== walker.x || next.y !== walker.y;
    walker = next;
    const actor = life.step(1 / HZ, at(walker, moving)).find((q) => q.lifeId === record.id);
    seen.push({ t: i / HZ, action: record.commitment?.action, state: actor?.motionState,
      fear: !!record.responseState?.fear, walking: moving,
      company: life.records().filter((q) => FRIENDLY.includes(q.commitment?.action)).length,
      distance: actor ? Math.hypot(actor.x - walker.x, actor.y - walker.y) : Infinity });
  }
  return seen;
}
const stand = (off) => ({ start: (home) => ({ x: home.x + off, y: home.y }), step: (w) => w });
/* stand a little way off, then walk away east */
const standThenLeave = (off, wait) => ({
  start: stand(off).start,
  step: (w, t) => (t > wait ? { x: w.x + WALK / HZ, y: w.y } : w),
});
const order = (seen) => seen.map((q) => q.action).filter((q, i, a) => q !== a[i - 1]);

test('a greeting hands over to a following, and the following ends in peace', () => {
  /* Thirty seconds beside a standing walker is the whole encounter and what
     comes after it. Measured before the route stopped short of the walker:
     the stork ended every following in `orient` and `flee`. */
  for (const [biome, who] of [['meadow', 'strider'], ['meadow', 'stork'],
    ['desert', 'shadeguest']]) {
    const seen = encounter(biome, who, stand(100), 30);
    const acts = order(seen);
    assert.deepEqual(acts.slice(0, 3), FRIENDLY,
      `${who} went ${acts.join(' > ')}: the greeting did not hand over to a following`);
    assert.ok(acts.length > 3, `${who} never ended its following`);
    assert.ok(!seen.some((q) => q.fear) && !acts.includes('flee'),
      `${who} went ${acts.join(' > ')}: it took fright at the walker it kept company with`);
    const kept = seen.filter((q) => q.action === 'follow-traveller').at(-1).distance;
    const want = ACTOR[who].companion?.followDistance ?? 46;
    assert.ok(Math.abs(kept - want) <= 3, `${who} stands ${kept.toFixed(0)} px off, not ${want}`);
  }
});

test('the shade guest keeps the heel of a walker who leaves', () => {
  const seen = encounter('desert', 'shadeguest', standThenLeave(100, 10), 15);
  const chase = seen.filter((q) => q.action === 'follow-traveller' && q.walking && q.t > 11);
  assert.ok(chase.length > HZ, 'the following ended as the walker set off');
  const worst = Math.max(...chase.map((q) => q.distance));
  assert.ok(worst <= 20, `it fell ${worst.toFixed(0)} px behind a walking traveller`);
});

test('one body keeps company at a time', () => {
  /* A walker halfway between two machines. Measured: on the step a greeting
     handed over, the second machine was chosen as well, for 18 seconds. */
  const { life } = world('meadow');
  const [a, b] = ['colossus', 'strider'].map((id) =>
    life.positionAt(life.records().find((q) => q.profileId === id)));
  const walker = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  let most = 0, followed = false;
  for (let i = 0; i < 40 * HZ; i++) {
    life.step(1 / HZ, at(walker));
    const company = life.records().filter((q) => FRIENDLY.includes(q.commitment?.action));
    most = Math.max(most, company.length);
    followed ||= company.some((q) => q.commitment.action === 'follow-traveller');
  }
  assert.ok(followed, 'neither machine came to the walker');
  assert.equal(most, 1, `${most} bodies kept company at once`);
});

test('an encounter does not outlast the body\'s absence', () => {
  const { session, gen, life } = world('meadow');
  const record = life.records().find((q) => q.profileId === 'strider');
  const home = life.positionAt(record);
  for (let i = 0; i < 20 * HZ && record.friendlyStage !== 'greet'; i++)
    life.step(1 / HZ, at({ x: home.x + 100, y: home.y }));
  assert.equal(record.friendlyStage, 'greet');
  /* the walker is in another scene for ten hours */
  life.dispose();
  session.advanceTo(session.clock.minute + 600);
  const back = new LifeRuntime(session, gen, 'meadow');
  const now = back.positionAt(record);
  back.step(1 / HZ, at({ x: now.x + 120, y: now.y }));
  assert.notEqual(record.commitment.action, 'follow-traveller',
    'it took up a following it never greeted for');
});

test('a calm body steps at the cadence its speed covers', () => {
  /* Measured: with flee and travel on one clip, the stork walked at 2.5
     times its table cadence. */
  for (const [biome, who] of [['meadow', 'stork'], ['meadow', 'hare']]) {
    const { life } = world(biome);
    const record = life.records().find((q) => q.profileId === who);
    const home = life.positionAt(record);
    let px = 0, frames = 0, last = null;
    for (let i = 0; i < 120 * HZ; i++) {
      const a = life.step(1 / HZ, at({ x: home.x + 420, y: home.y }))
        .find((q) => q.lifeId === record.id);
      if (a && last && a.moving) {
        px += Math.hypot(a.x - last.x, (a.y - last.y) / 0.66); frames += a.gait - last.gait;
      }
      last = a ? { x: a.x, y: a.y, gait: a.gait } : null;
    }
    const F = ACTOR[who], table = F.gait / F.speed;
    assert.ok(px > 50, `${who} moved ${px.toFixed(0)} px in two minutes`);
    assert.ok(Math.abs(frames / px - table) < table * 0.1,
      `${who} steps ${(frames / px).toFixed(3)} frames a pixel against a table ${table.toFixed(3)}`);
  }
});

test('a hare sits tight in its form, then goes, then lies up again', () => {
  const walkIn = {
    start: (home) => ({ x: home.x + 140, y: home.y }),
    step: (w, t, home) => (w.x > home.x + 10 ? { x: w.x - WALK / HZ, y: w.y } : w),
  };
  const seen = encounter('meadow', 'hare', walkIn, 10);
  const first = seen.findIndex((q) => q.action === 'flee');
  assert.ok(first > 0, 'the hare never flushed');
  /* it sat tight: still in its form with the walker under 100 px */
  assert.ok(seen.slice(0, first).some((q) => q.state === 'form' && q.distance < 100),
    'it left before the walker was close');
  assert.equal(seen[first + 1].state, 'lope');
  const gone = Math.max(...seen.map((q) => (Number.isFinite(q.distance) ? q.distance : 0)));
  /* ten metres: past where its fear clears, and four seconds of walking */
  assert.ok(gone > 150, `it went ${gone.toFixed(0)} px, which is not out of reach`);
  const last = seen.filter((q) => q.state).at(-1);
  assert.equal(last.state, 'form', 'it did not lie up again');
});

test('the skimmer stays on the water, and the lamp snail goes dark when crowded', () => {
  /* a walker stands on the skimmer's own position, then leaves */
  const crowd = { start: (home) => ({ x: home.x + 40, y: home.y }),
    step: (w, t, home) => (t < 3 && w.x > home.x + 4 ? { x: w.x - WALK / HZ, y: w.y } : w) };
  const { session, gen, life } = world('swamp');
  const record = life.records().find((q) => q.profileId === 'skimmer');
  assert.ok(record, 'the swamp compiled no skimmer');
  const home = life.positionAt(record);
  let dry = 0, moved = 0, last = null;
  for (let i = 0; i < 12 * HZ; i++) {
    const actors = life.step(1 / HZ, at({ x: home.x + 30, y: home.y }, i % 60 < 30));
    for (const a of actors.filter((q) => q.profileId === 'skimmer')) {
      if (gen.lifeSiteAt(a.x, a.y, session).conditions.medium === 'dry') dry++;
      if (a.lifeId === record.id) { if (last) moved += Math.hypot(a.x - last.x, a.y - last.y); last = { x: a.x, y: a.y }; }
    }
  }
  assert.equal(dry, 0, `a skimmer stood on dry ground for ${dry} steps: there is no film there`);
  assert.ok(moved > 4, 'a crowded skimmer did not row away');

  const seen = encounter('swamp', 'lampsnail', crowd, 6);
  assert.ok(seen.some((q) => q.state === 'hide'), 'a crowded lamp snail never withdrew');
  assert.ok(seen.slice(0, 20).every((q) => q.state !== 'hide'),
    'it withdrew before the walker was near');
});
