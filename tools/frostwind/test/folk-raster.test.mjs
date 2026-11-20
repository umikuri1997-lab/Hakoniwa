import test from 'node:test';
import assert from 'node:assert';
import {
  FOLK, FOLK_STATES, FOLK_VIEWS,
  heightPx as folkHeightPx, folkLandmarks, folkPose,
} from '../src/body-folk.js';
import { T2, T3, makeFolk } from '../src/figure-folk.js';
import { CAST, FASHION, heightPx, paintPerson } from '../src/people.js';
import { PLAYER_H } from '../src/scale.js';
import {
  NAMES, connectivity, everyFrame,
  addFailure, assertNoFailures, failureBucket,
} from './folk-helpers.mjs';

const SOURCE_TOWNFOLK = [
  'graveWatcher', 'fruitBearer', 'headphones', 'thickDude', 'bookDude', 'axeman',
  'leader', 'featherHat', 'spearGuard', 'bearKid',
];

test('the coat stays one two-plane mass from its shoulders to the hem', () => {
  const L = folkLandmarks(PLAYER_H);
  const sp = makeFolk('traveller', 0, 0, 'idle');
  const base = sp.ay - L.ground;
  for (let y = base + L.shoulder + 2; y < base + L.hem - 1; y++) {
    const left = y * sp.w + sp.ax - 2;
    const centre = y * sp.w + sp.ax;
    const right = y * sp.w + sp.ax + 2;
    assert.equal(sp.occ[left], 5, `row ${y}: the left coat plane broke`);
    assert.equal(sp.occ[centre], 5, `row ${y}: the dark chest slot returned`);
    assert.equal(sp.occ[right], 5, `row ${y}: the right coat plane broke`);
    assert.ok(Math.abs(sp.shade[left] - T2) < 1e-6, `row ${y}: the left plane is not darker`);
    assert.ok(Math.abs(sp.shade[centre] - T3) < 1e-6, `row ${y}: the planes do not join cleanly`);
    assert.ok(Math.abs(sp.shade[right] - T3) < 1e-6, `row ${y}: the right plane is not bright`);
  }
});

test('every upper body steps in at the shoulder', () => {
  // The torso begins at least two columns narrower and grows by at most two.
  const centreRun = (sp, y, cx) => {
    const i = y * sp.w;
    if (!sp.occ[i + cx]) return 0;
    let a = cx, b = cx;
    while (a > 0 && sp.occ[i + a - 1]) a--;
    while (b < sp.w - 1 && sp.occ[i + b + 1]) b++;
    return b - a + 1;
  };
  const square = failureBucket(), jumped = failureBucket();
  for (const [name, d, state, f] of everyFrame()) {
    const sp = paintPerson(name, d, f, state);
    const h = heightPx(CAST[name]);
    const L = folkLandmarks(h);
    const pose = folkPose({ h, state, frame: f });
    const base = sp.ay - L.ground;
    const cx = sp.ax + (d === 3 || d === 4 ? 1 : 0);
    const top = base + L.shoulder - pose.lift;
    const belt = base + L.belt - pose.lift;
    const where = `${name} dir ${d} ${state}:${f}`;
    let widest = 0, prev = null;
    for (let y = top; y <= belt; y++) {
      const width = centreRun(sp, y, cx);
      widest = Math.max(widest, width);
      if (prev !== null && width - prev > 2)
        addFailure(jumped, `${where} row ${y - top}: ${prev} to ${width} px`);
      prev = width;
    }
    const shoulder = centreRun(sp, top, cx);
    if (widest - shoulder < 2)
      addFailure(square, `${where}: shoulder ${shoulder} px of a ${widest} px chest`);
  }
  assertNoFailures(square, 'square upper bodies');
  assertNoFailures(jumped, 'the taper is a chamfer, not a step');
});

test('every view of every folk row is one connected body, in every frame', () => {
  // docs/LIFE.md law 4 requires 8-connectivity.
  const broken = failureBucket();
  for (const [name, d, state, f] of everyFrame()) {
    const sp = makeFolk(name, d, f, state);
    const { joined, total } = connectivity(sp);
    if (joined !== total)
      addFailure(broken, `${name} dir ${d} ${state}:${f} ${total - joined}px`);
  }
  assertNoFailures(broken, `${broken.count} sprites have floating body`);
});

test('the leg stays one pixel and the air between the legs survives the rim', () => {
  // docs/LIFE.md law 3 declares one-pixel stems and preserves their gap.
  for (const name of NAMES) {
    const L = folkLandmarks(folkHeightPx(FOLK[name]));
    const sp = makeFolk(name, 0, 0, 'walk');
    const y = sp.ay;
    const runs = [];
    let run = 0;
    for (let x = 0; x <= sp.w; x++) {
      const on = x < sp.w && sp.occ[y * sp.w + x];
      if (on) run++;
      else if (run) { runs.push(run); run = 0; }
    }
    assert.deepEqual(runs, [1, 1],
      `${name}: expected two one-pixel legs on row ${y}, found runs ${runs}`);
    const cols = [];
    for (let x = 0; x < sp.w; x++) if (sp.occ[y * sp.w + x]) cols.push(x);
    assert.ok(cols[1] - cols[0] - 1 >= 3,
      `${name}: only ${cols[1] - cols[0] - 1} px of air between the legs`);
  }
});

test('the silhouette hands its edges to material 7, and never a narrow run', () => {
  // Material 7 on a run under three pixels erases narrow limbs into the outline.
  let edges = 0;
  for (const [name, d, state, f] of everyFrame()) {
    const sp = makeFolk(name, d, f, state);
    for (let y = 0; y < sp.h; y++) {
      let run = 0, has7 = false;
      const flush = () => {
        if (has7 && run < 3)
          assert.fail(`${name} dir ${d} ${state}:${f} row ${y}: material 7 on a ${run} px run`);
        run = 0;
        has7 = false;
      };
      for (let x = 0; x < sp.w; x++) {
        const m = sp.occ[y * sp.w + x];
        if (!m) { flush(); continue; }
        run++;
        if (m === 7) { has7 = true; edges++; }
      }
      flush();
    }
  }
  assert.ok(edges > 200, `only ${edges} rim pixels across the whole folk cast`);
  const sp = makeFolk('traveller', 2, 0, 'walk');
  for (let i = 0; i < sp.occ.length; i++)
    if (sp.occ[i] === 7)
      assert.ok(Math.abs(sp.nx[i]) > 0.8, 'an edge normal lost its sign magnitude');
});

test('the head is never rimmed', () => {
  // A five-column head cannot spare both edge columns for material 7.
  for (const [name, d, state, f] of everyFrame()) {
    const sp = makeFolk(name, d, f, state);
    const L = folkLandmarks(folkHeightPx(FOLK[name]));
    const pose = folkPose({ h: folkHeightPx(FOLK[name]), state, frame: f });
    const shoulderY = 6 + L.shoulder - pose.lift;
    for (let y = 0; y < shoulderY; y++)
      for (let x = 0; x < sp.w; x++)
        assert.notEqual(sp.occ[y * sp.w + x], 7,
          `${name} dir ${d} ${state}:${f} rimmed the head at ${x},${y}`);
  }
});

test('a look moves the face and nothing below the jaw', () => {
  for (const d of [0, 2, 3]) {
    const base = makeFolk('traveller', d, 0, 'walk');
    const L = folkLandmarks(PLAYER_H);
    const jaw = 6 + L.jaw;
    for (const look of ['left', 'right', 'up']) {
      const varied = makeFolk('traveller', d, 0, 'walk', look);
      for (let y = jaw + 1; y < base.h; y++)
        for (let x = 0; x < base.w; x++) {
          const i = y * base.w + x;
          assert.equal(varied.occ[i], base.occ[i],
            `look ${look} dir ${d} moved a pixel below the jaw at ${x},${y}`);
        }
    }
  }
  for (const d of [1, 4])
    assert.deepEqual(makeFolk('traveller', d, 0, 'walk', 'left').occ,
      makeFolk('traveller', d, 0, 'walk').occ);
});

test('the bake is deterministic and the five views are visibly five', () => {
  const a = makeFolk('traveller', 3, 5, 'run');
  const b = makeFolk('traveller', 3, 5, 'run');
  assert.deepEqual(a.occ, b.occ);
  assert.deepEqual(a.shade, b.shade);
  assert.deepEqual(a.nx, b.nx);
  const keys = [0, 1, 2, 3, 4]
    .map((d) => makeFolk('traveller', d, 0, 'walk').occ.join(','));
  for (let i = 0; i < 5; i++)
    for (let j = i + 1; j < 5; j++)
      assert.notEqual(keys[i], keys[j], `views ${i} and ${j} baked the same body`);
});

test('source-authored head and carried cues draw without clipping', () => {
  const headAccent = {
    headphones: 'ear-wrap',
    axeman: 'animal-ears',
    featherHat: 'feather',
    bearKid: 'animal-ears',
  };
  const carriedKit = {
    graveWatcher: 'hand-lantern',
    fruitBearer: 'provision-basket',
    bookDude: 'winter-ledger',
    axeman: 'wood-axe',
  };
  for (const name of SOURCE_TOWNFOLK) {
    assert.equal(FASHION[name].headAccent, headAccent[name] ?? null,
      `${name} borrowed another person's head signal`);
    assert.equal(FASHION[name].carriedKit, carriedKit[name] ?? null,
      `${name} borrowed another person's carried kit`);
  }
  for (const [key, assignments] of Object.entries({ headAccent, carriedKit }))
    for (const name of Object.keys(assignments)) {
      const withCue = paintPerson(name, 0, 0, 'idle');
      const withoutCue = makeFolk(name, 0, 0, 'idle', 'neutral', {
        row: CAST[name],
        fashion: { ...FASHION[name], [key]: null },
      });
      assert.notDeepEqual([...withCue.occ], [...withoutCue.occ],
        `${name} ${key} does not reach the raster`);
      for (let y = 0; y < withCue.h; y++) {
        assert.equal(withCue.occ[y * withCue.w], 0, `${name} clips at the left edge`);
        assert.equal(withCue.occ[y * withCue.w + withCue.w - 1], 0,
          `${name} clips at the right edge`);
      }
      for (let x = 0; x < withCue.w; x++)
        assert.equal(withCue.occ[x], 0, `${name} clips at the top edge`);
    }
});

test('a leg is dressed by changing value, never by changing width', () => {
  // docs/LIFE.md law 3 applies per row and permits one joint pixel per leg.
  for (const name of Object.keys(CAST))
    for (let d = 0; d < FOLK_VIEWS; d++)
      for (const [state, n] of Object.entries(FOLK_STATES))
        for (let f = 0; f < n; f++) {
          const sp = paintPerson(name, d, f, state);
          const cols = new Set();
          for (let y = sp.hemRow + 1; y < sp.h; y++) {
            const row = new Set();
            for (let x = 0; x < sp.w; x++)
              if (sp.occ[y * sp.w + x] === 17) { row.add(x); cols.add(x); }
            assert.ok(row.size <= 2, `${name} dir ${d} ${state}:${f} row ${y}`
              + ` spends ${row.size} columns on legs: ${[...row]}`);
          }
          assert.ok(cols.size <= 4,
            `${name} dir ${d} ${state}:${f} spends ${cols.size} columns on legs,`
            + ` which is more than one joint pixel each`);
        }

  const legOf = (name) => {
    const sp = paintPerson(name, 0, 0, 'idle');
    const seen = [];
    for (let y = sp.hemRow + 1; y < sp.h; y++)
      for (let x = 0; x < sp.w; x++) {
        const i = y * sp.w + x;
        if (sp.occ[i]) seen.push(`${sp.occ[i]}:${sp.shade[i].toFixed(2)}`);
      }
    return new Set(seen);
  };
  const trousered = legOf('traveller'), bare = legOf('meadowTraveller');
  assert.ok(trousered.size >= 2,
    'a trousered leg is one value, so the boot and the trouser are one garment');
  assert.ok([...bare].some((q) => q.startsWith('6:')),
    'a short leaves no bare shin, so the shorts are trousers with a short name');
  assert.ok([...trousered].every((q) => !q.startsWith('6:')),
    'the boreal traveller shows skin below the knee in a snowstorm');
});
