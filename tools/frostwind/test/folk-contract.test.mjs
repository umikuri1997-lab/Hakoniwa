import test from 'node:test';
import assert from 'node:assert';
import {
  FOLK, FOLK_STATES, FOLK_VIEWS, LEG_KNEE, SHIRT_DROP,
  heightPx as folkHeightPx, folkLandmarks, folkPose, folkStrikes,
} from '../src/body-folk.js';
import { makeFolk } from '../src/figure-folk.js';
import { CAST, CAST_BY_KEY, FASHION, heightPx, paintPerson } from '../src/people.js';
import { figureViewFromHeading, headingOf } from '../src/attention.js';
import { PLAYER_H } from '../src/scale.js';
import {
  NAMES, bottomRow, connectivity, topRow,
  addFailure, assertNoFailures, failureBucket,
} from './folk-helpers.mjs';

test('the proportion table is the STRANDED read: a long body over short legs', () => {
  const L = folkLandmarks(PLAYER_H);
  assert.equal(L.eye, 3);
  assert.equal(L.face, 4);
  assert.equal(L.jaw, 5);
  assert.equal(L.shoulder, 6);
  assert.equal(L.hem, 22);
  assert.equal(L.ground, 25);

  // The ten source sheets put most stature in the body.
  const head = L.shoulder;
  const body = L.hem - L.shoulder + 1;
  const legs = L.ground - L.hem;
  assert.ok(body > 2 * legs, `body ${body} rows is not clear of legs ${legs} rows`);
  assert.ok(body / PLAYER_H > 0.5, `the body is only ${body} of ${PLAYER_H} rows`);
  assert.ok(legs / PLAYER_H < 0.25, `the legs are ${legs} of ${PLAYER_H} rows`);
  assert.ok(head / PLAYER_H < 0.30, `the head is ${head} of ${PLAYER_H} rows`);
  assert.ok(L.bodyHW > L.headHW, 'the coat must outweigh the head');
  assert.ok(legs <= 4, `${legs} rows of one-pixel leg is a line, not a leg`);
  assert.ok(L.eye > L.crown + 1, 'the face is flush with the crown');
  assert.ok(L.face < L.jaw, 'the face runs into the jaw');
});

test('the gait resolves against the garment, at every reach and every leg run', () => {
  // Excursion stays within the coat and lift resolves against visible leg length.
  const REACHES = [2, 3, 4, 5];
  const RUNS = [2, 3, 7];

  for (const reach of REACHES) {
    for (const state of ['walk', 'run'])
      for (let f = 0; f < FOLK_STATES[state]; f++)
        for (const foot of folkPose({ h: PLAYER_H, state, frame: f, reach }).feet)
          assert.ok(Math.abs(foot.dx) <= reach,
            `${state}:${f} steps ${foot.dx} px past a coat that reaches ${reach}`);

    const stance = [];
    for (let f = 0; f < 5; f++)
      stance.push(folkPose({ h: PLAYER_H, state: 'walk', frame: f, reach }).feet[0].dx);
    const step = stance.slice(1).map((v, i) => v - stance[i]);
    assert.ok(step.every((v) => v < 0),
      `reach ${reach}: the planted foot stalls or reverses: ${stance}`);
    assert.ok(Math.max(...step) - Math.min(...step) <= 1,
      `reach ${reach}: the planted foot skates: ${stance} steps by ${step}`);

    const seps = [];
    for (let f = 0; f < FOLK_STATES.walk; f++) {
      const [a, b] = folkPose({ h: PLAYER_H, state: 'walk', frame: f, reach }).feet;
      seps.push(Math.abs(a.dx - b.dx));
    }
    assert.ok(Math.min(...seps) <= 1,
      `reach ${reach}: the feet never pass, closest is ${Math.min(...seps)} px`);
    assert.equal(Math.max(...seps), 2 * reach,
      `reach ${reach}: the widest step is ${Math.max(...seps)} px`);
  }

  for (const legRun of RUNS) {
    const lifts = [];
    for (let f = 0; f < FOLK_STATES.walk; f++)
      for (const foot of folkPose({ h: PLAYER_H, state: 'walk', frame: f, legRun }).feet)
        lifts.push(foot.lift);
    assert.ok(Math.max(...lifts) >= 1,
      `a ${legRun}-row leg never leaves the ground: max lift ${Math.max(...lifts)}`);

    const pass = folkPose({ h: PLAYER_H, state: 'walk', frame: 2, legRun }).feet[1];
    const thigh = Math.round(LEG_KNEE * legRun);
    assert.ok(legRun - pass.lift <= thigh + 1,
      `a ${legRun}-row leg draws ${legRun - pass.lift} rows at the pass,`
      + ` past a ${thigh}-row thigh`);
  }
});

test('footfall events occur where each pose first plants its boot',()=>{
  for(const state of ['walk','run']){
    const strikes=folkStrikes(0,8,{h:PLAYER_H,state,reach:3});
    assert.deepEqual(strikes.map((q)=>q.frame),[4,8]);
    assert.deepEqual(strikes.map((q)=>q.side),[1,-1]);
    assert.ok(strikes.every((q)=>q.event==='strike'&&q.down&&q.dx===3));
  }
});

test('the folk states and views match the shape the atlas bakes', () => {
  assert.deepEqual(FOLK_STATES, { idle: 6, walk: 8, run: 8 });
  assert.equal(FOLK_VIEWS, 5);
});

test('stature derives from PLAYER_H and the ground row lands on the anchor', () => {
  assert.equal(folkHeightPx(FOLK.traveller), PLAYER_H);
  for (const name of NAMES) {
    const delta = heightPx(CAST[name]) - folkHeightPx(FOLK[name]);
    assert.equal(delta, FASHION[name].staturePx, `${name} stature lost its fashion seed`);
    assert.ok(Math.abs(delta) <= 1, `${name} moved ${delta} px from its measured stature`);
    const sp = paintPerson(name, 0, 0, 'walk');
    // Dress is the sole garment colour authority.
    assert.equal(FOLK[name].ramp, undefined,
      `${name} anatomy row grew a garment colour back`);
    assert.equal(sp.ramp, FASHION[name].ramp,
      `${name} is painted on a ramp its culture did not choose`);
    assert.equal(sp.ay, sp.h - 1, `${name} anchor is not the ground row`);
    assert.equal(bottomRow(sp), sp.ay, `${name} does not touch its ground row`);
  }
});

test('the hop survives: ground pinned, crown exactly two rows, in every view', () => {
  for (let d = 0; d < FOLK_VIEWS; d++) {
    const tops = [], bottoms = [];
    for (let f = 0; f < FOLK_STATES.walk; f++) {
      const sp = makeFolk('traveller', d, f, 'walk');
      tops.push(topRow(sp));
      bottoms.push(bottomRow(sp));
    }
    assert.ok(bottoms.every((b) => b === bottoms[0]),
      `dir ${d}: the ground row moved across the walk: ${bottoms}`);
    assert.equal(Math.max(...tops) - Math.min(...tops), 2,
      `dir ${d}: crown lift is not 2 rows: ${tops}`);
  }
});

test('walk keeps single support on pass and gather, double on contact', () => {
  const supports = [];
  for (let f = 0; f < FOLK_STATES.walk; f++)
    supports.push(folkPose({ h: PLAYER_H, state: 'walk', frame: f })
      .feet.filter((ft) => ft.down).length);
  assert.deepEqual(supports, [2, 1, 1, 1, 2, 1, 1, 1],
    'duty 0.625 with two double-support frames is the authored schedule');
});

test('the run has flight, and never the double support a walk lives on', () => {
  // Measured failure: double-sampling the walk produced only two running poses.
  const support = [], poses = new Set();
  for (let f = 0; f < FOLK_STATES.run; f++) {
    const p = folkPose({ h: PLAYER_H, state: 'run', frame: f, reach: 3, legRun: 7 });
    support.push(p.feet.filter((ft) => ft.down).length);
    poses.add(p.feet.map((ft) => `${ft.dx},${ft.lift}`).join('/'));
    const fastWalk = folkPose({
      h: PLAYER_H, state: 'walk', reach: 3, legRun: 7,
      frame: (f * 2) % FOLK_STATES.walk,
    });
    assert.notDeepEqual(p.feet, fastWalk.feet,
      `frame ${f}: the run is still the walk sampled at double phase`);
  }
  assert.deepEqual(support, [1, 1, 1, 0, 1, 1, 1, 0],
    'the run schedule is not a run: it has double support or no flight');
  assert.equal(poses.size, FOLK_STATES.run,
    `the run bakes ${poses.size} distinct leg poses over ${FOLK_STATES.run} frames`);
});

test('the hem is pinned, so the hip never moves and the coat stretches', () => {
  // Measured failure: moving the hem made visible leg length drift out of phase.
  const bottomOf = (sp, mats) => {
    let y1 = -1;
    for (let y = 0; y < sp.h; y++)
      for (let x = 0; x < sp.w; x++)
        if (mats.includes(sp.occ[y * sp.w + x])) y1 = Math.max(y1, y);
    return y1;
  };
  const topOf = (sp) => {
    for (let y = 0; y < sp.h; y++)
      for (let x = 0; x < sp.w; x++) if (sp.occ[y * sp.w + x]) return y;
    return -1;
  };
  for (let d = 0; d < FOLK_VIEWS; d++) {
    const pinnedHems = [], movingLengths = [];
    for (const state of Object.keys(FOLK_STATES))
      for (let f = 0; f < FOLK_STATES[state]; f++) {
        const sp = makeFolk('traveller', d, f, state);
        const hem = bottomOf(sp, [5, 7]);
        pinnedHems.push(hem);
        if (state !== 'idle') movingLengths.push(hem - topOf(sp));
      }
    assert.ok(pinnedHems.every((h) => h === pinnedHems[0]),
      `dir ${d}: the hem moved: ${[...new Set(pinnedHems)]}`);
    assert.ok(new Set(movingLengths).size > 1, `dir ${d}: the coat never stretches`);
  }
});

test('the pavilion hem keeps two notches and movement flickers within one pixel', () => {
  const readHem = (sp) => {
    const y = sp.hemRow;
    const on = [...Array(sp.w)].map((_, x) => !!sp.occ[y * sp.w + x]);
    const x0 = on.indexOf(true), x1 = on.lastIndexOf(true);
    return {
      signature: on.map((v) => v ? '#' : '.').join(''),
      x0,
      x1,
      gaps: on.slice(x0, x1 + 1).filter((v) => !v).length,
    };
  };
  for (let d = 0; d < FOLK_VIEWS; d++) {
    const idle = [...Array(FOLK_STATES.idle).keys()]
      .map((f) => readHem(makeFolk('traveller', d, f, 'idle')));
    assert.equal(new Set(idle.map((r) => r.signature)).size, 1,
      `dir ${d}: still cloth flickers`);
    assert.ok(idle.every((r) => r.gaps === 2),
      `dir ${d}: the bounded hem lifts are ${idle.map((r) => r.gaps)}`);

    for (const state of ['walk', 'run']) {
      const moving = [...Array(FOLK_STATES[state]).keys()]
        .map((f) => readHem(makeFolk('traveller', d, f, state)));
      assert.ok(new Set(moving.map((r) => r.signature)).size > 1,
        `dir ${d} ${state}: the cloth never changes phase`);
      assert.ok(moving.some((r) => r.gaps === 2) &&
        moving.every((r) => r.gaps <= 2),
      `dir ${d} ${state}: the authored notches gained an extra gap`);
      assert.ok(moving.every((r) =>
        Math.abs(r.x0 - idle[0].x0) <= 1 && Math.abs(r.x1 - idle[0].x1) <= 1),
      `dir ${d} ${state}: the cloth moved more than one pixel`);
    }
  }
});

test('the diagonal projects shoulder and hem onto the same one-pixel offset', () => {
  const L = folkLandmarks(PLAYER_H);
  const rowCentre = (sp, y) => {
    const xs = [];
    for (let x = 0; x < sp.w; x++)
      if ([5, 7].includes(sp.occ[y * sp.w + x])) xs.push(x);
    return (xs[0] + xs.at(-1)) * 0.5;
  };
  for (const d of [3, 4]) {
    const sp = makeFolk('traveller', d, 0, 'idle');
    const base = sp.ay - L.ground;
    const shoulder = rowCentre(sp, base + L.shoulder);
    const hem = rowCentre(sp, base + L.hem);
    assert.equal(shoulder, sp.ax + 1, `dir ${d}: shoulder lost its depth offset`);
    assert.equal(hem, shoulder, `dir ${d}: hem ${hem} shears away from shoulder ${shoulder}`);
  }
});

test('standing still is the walk\'s contact frame, in every view', () => {
  // Idle and contact share one stance so starting and stopping cannot snap.
  const groundRun = (sp) => {
    const runs = [];
    let run = 0;
    for (let x = 0; x <= sp.w; x++) {
      const on = x < sp.w && sp.occ[sp.ay * sp.w + x];
      if (on) run++;
      else if (run) { runs.push(x - run - sp.ax); run = 0; }
    }
    return runs;
  };
  for (let d = 0; d < FOLK_VIEWS; d++) {
    const contact = groundRun(makeFolk('traveller', d, 0, 'walk'));
    assert.equal(contact.length, 2, `dir ${d}: contact does not plant two feet`);
    for (let f = 0; f < FOLK_STATES.idle; f++)
      assert.deepEqual(groundRun(makeFolk('traveller', d, f, 'idle')), contact,
        `dir ${d} idle:${f} stands differently from the walk it stops out of`);
  }
  for (let d = 0; d < FOLK_VIEWS; d++)
    for (const [state, n] of Object.entries(FOLK_STATES))
      for (let f = 0; f < n; f++) {
        const feet = groundRun(makeFolk('traveller', d, f, state));
        if (feet.length === 2) assert.ok(feet[0] < 0 && feet[1] > 0,
          `dir ${d} ${state}:${f} planted both feet on one side: ${feet}`);
      }
});

test('idle welds the feet and breathes one row', () => {
  const bottoms = [], tops = [];
  for (let f = 0; f < FOLK_STATES.idle; f++) {
    const sp = makeFolk('traveller', 0, f, 'idle');
    bottoms.push(bottomRow(sp));
    tops.push(topRow(sp));
    const pose = folkPose({ h: PLAYER_H, state: 'idle', frame: f });
    assert.ok(pose.feet.every((ft) => ft.down && ft.lift === 0),
      `idle frame ${f} moved a foot`);
  }
  assert.ok(bottoms.every((b) => b === bottoms[0]), 'idle feet slid');
  assert.equal(Math.max(...tops) - Math.min(...tops), 1,
    `the breath is one row, not ${Math.max(...tops) - Math.min(...tops)}`);
});

test('one cast list holds every human and no key is claimed twice', () => {
  const keys = Object.values(CAST).map((r) => r.key);
  assert.equal(new Set(keys).size, keys.length,
    `duplicate atlas keys in the cast: ${keys.filter((k, i) => keys.indexOf(k) !== i)}`);
  for (const name of NAMES) {
    assert.ok(CAST[name], `${name} is not in the shared cast`);
    assert.equal(CAST_BY_KEY[FOLK[name].key], CAST[name]);
    assert.deepEqual(paintPerson(name, 2, 3, 'walk').occ,
      makeFolk(name, 2, 3, 'walk', 'neutral',
        { row: CAST[name], fashion: FASHION[name] }).occ,
      `${name} is painted by the wrong raster`);
  }
  assert.equal(FOLK.traveller.key, 'walk');
  assert.equal(FOLK.swampTraveller.key, 'swampTraveller');
});

test('a heading resolves to eight facings, and sideways is the profile', () => {
  const at = (deg) =>
    figureViewFromHeading(Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180));
  assert.deepEqual(at(90), { dir: 0, flip: false });
  assert.deepEqual(at(-90), { dir: 1, flip: false });
  assert.deepEqual(at(0), { dir: 2, flip: false });
  assert.deepEqual(at(180), { dir: 2, flip: true });
  assert.deepEqual(at(45), { dir: 3, flip: false });
  assert.deepEqual(at(135), { dir: 3, flip: true });
  assert.deepEqual(at(-45), { dir: 4, flip: false });
  assert.deepEqual(at(-135), { dir: 4, flip: true });

  const seen = new Set();
  for (let deg = -180; deg < 180; deg += 1)
    seen.add(`${at(deg).dir}${at(deg).flip ? 'F' : ''}`);
  assert.deepEqual([...seen].sort(), ['0', '1', '2', '2F', '3', '3F', '4', '4F'],
    'the circle does not cover exactly eight facings');

  let worst = 0;
  for (let deg = -180; deg < 180; deg += 1) {
    const v = at(deg);
    const back = headingOf(v.dir, v.flip) * 180 / Math.PI;
    worst = Math.max(worst, Math.abs(((back - deg) % 360 + 540) % 360 - 180));
  }
  assert.ok(worst <= 23, `a facing is ${worst} degrees off the heading it stands for`);
});

test('seeded fashion covers the finite vocabulary and every styled body stays connected', () => {
  const expected = {
    bodyProfile: ['broad', 'regular', 'slim'],
    coatCut: ['long', 'mid', 'short'],
    coatBulk: ['lined', 'puffy', 'thin'],
    hat: ['brim', 'cap', 'earflap', 'felt', 'hood', 'none', 'peak', 'straw', 'turban',
      'veil', 'wool'],
    scarf: ['band', 'none', 'tail'],
    sleeveWidth: [1, 2],
    handShape: ['block', 'small', 'tall'],
    clothPattern: ['ordered', 'plain'],
    legwear: ['shorts', 'trousers'],
    shirtHem: ['tee', 'tucked', 'untucked'],
    dyePlace: ['cuffs', 'hat-band', 'hem-stripe', 'none', 'sash'],
    dyeHue: ['madder', 'ochre'],
  };
  for (const [key, want] of Object.entries(expected)) {
    const got = [...new Set(Object.values(FASHION).map((row) => row[key])
      .filter((v) => v !== null))].sort();
    assert.deepEqual(got, want, `${key} does not cover its vocabulary`);
  }

  const broken = failureBucket();
  for (const name of Object.keys(CAST))
    for (let d = 0; d < FOLK_VIEWS; d++)
      for (const [state, n] of Object.entries(FOLK_STATES))
        for (let f = 0; f < n; f++) {
          const sp = paintPerson(name, d, f, state);
          const { joined, total } = connectivity(sp);
          if (joined !== total) addFailure(broken, `${name} dir ${d} ${state}:${f}`);
        }
  assertNoFailures(broken, `${broken.count} styled bodies are disconnected`);
});

test('the traveller is dressed by the world, and the three do not converge', () => {
  const wardrobes = ['traveller', 'meadowTraveller', 'swampTraveller'];
  for (const name of wardrobes) {
    const ramp = name === 'swampTraveller' ? 'swampCoat' : 'folkCoat';
    assert.equal(FASHION[name].ramp, ramp, `${name} lost the hero coat`);
    assert.equal(FASHION[name].staturePx, 0, `${name} changed height with a coat`);
    assert.equal(heightPx(CAST[name]), PLAYER_H, `${name} is not the player`);
    assert.equal(CAST[name].ramp2, 'folkSignal', `${name} lost the shared face`);
    assert.equal(FASHION[name].dyePlace, 'none',
      `${name} bands a coat that is already the dyed mass`);
  }
  for (let i = 0; i < wardrobes.length; i++)
    for (let j = i + 1; j < wardrobes.length; j++) {
      const a = FASHION[wardrobes[i]], b = FASHION[wardrobes[j]];
      const differs = ['hat', 'coatCut', 'coatBulk', 'legwear', 'shirtHem']
        .filter((key) => a[key] !== b[key]);
      assert.ok(differs.length >= 2,
        `${wardrobes[i]} and ${wardrobes[j]} differ only in ${differs.join(',')}`);
    }

  assert.equal(FASHION.traveller.legwear, 'trousers',
    'the boreal traveller has bare legs in the snow');
  assert.notEqual(FASHION.traveller.hat, 'none', 'bare head below freezing');
  for (const name of ['meadowTraveller', 'swampTraveller'])
    assert.equal(FASHION[name].coatBulk, 'thin', `${name} is padded in a warm world`);

  for (let d = 0; d < FOLK_VIEWS; d++)
    for (const [state, n] of Object.entries(FOLK_STATES))
      for (let f = 0; f < n; f++) {
        const bytes = wardrobes.map((name) =>
          paintPerson(name, d, f, state).occ.join(''));
        assert.equal(new Set(bytes).size, 3,
          `two wardrobes bake the same pixels at dir ${d} ${state}:${f}`);
      }
});

test('a shirt ends at the hip, above the coat that covers it', () => {
  const L = folkLandmarks(PLAYER_H);
  for (const [name, drop] of Object.entries(SHIRT_DROP))
    assert.ok(drop >= 0 && L.belt + drop * PLAYER_H < L.hem,
      `a ${name} shirt hangs past the shortest coat hem`);
  const open = { ...FASHION.meadowTraveller };
  const untucked = makeFolk('meadowTraveller', 0, 0, 'idle', 'neutral',
    { row: CAST.meadowTraveller, fashion: { ...open, shirtHem: 'untucked' } });
  const tucked = makeFolk('meadowTraveller', 0, 0, 'idle', 'neutral',
    { row: CAST.meadowTraveller, fashion: { ...open, shirtHem: 'tucked' } });
  assert.notDeepEqual([...untucked.occ], [...tucked.occ],
    'the shirt hem does not reach the raster');
});

test('the cast is one list, one body, and thirty-two distinguishable people', () => {
  assert.equal(Object.keys(CAST).length, 32);
  const shapes = new Set();
  for (const name of Object.keys(CAST)) {
    const sp = paintPerson(name, 0, 0, 'walk');
    assert.equal(sp.kind, CAST[name].key);
    assert.ok(sp.ramp && sp.ramp2 === 'folkSignal', `${name} lost the shared signal`);
    shapes.add(`${sp.w}x${sp.h}:${sp.ramp}:${sp.occ.join('')}`);
  }
  assert.equal(shapes.size, 32, 'two cast rows bake to the same person');
});
