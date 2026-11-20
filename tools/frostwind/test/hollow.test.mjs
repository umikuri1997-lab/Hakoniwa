/* The Hollow: lamps, pools of light, rock. docs/HOLLOW.md owns the sources. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildWorldAtlas } from '../src/atlas.js';
import { BIOMES } from '../src/biome.js';
import { CH, FLAG_Q } from '../src/constants.js';
import { REACH, glowAt, lightOf } from '../src/glow.js';
import { RAMP } from '../src/palette.js';
import { PLAYER_H } from '../src/scale.js';
import { ALBEDO, emissionRGB } from '../src/sunlight.js';
import { SURF, SURFACE } from '../src/surface.js';
import { makeWorldGen } from '../src/worldgen.js';

const SEED = 1337;
const gen = makeWorldGen(SEED, { lake: 0.55, density: 1, snow: 1, light: 215, biome: 'hollow' });
const C = gen.POI[0];
const same = (a, b) => a.join() === b.join();

test('a lamp colour is its band: none is picked', () => {
  const worm = emissionRGB('glowworm'), cap = emissionRGB('fungus'), gem = emissionRGB('crystal');
  /* 487 nm is blue-green with blue ahead, 530 nm is green, and a 425 nm band
     through a 545 nm absorber is blue with red and no green: violet. */
  assert.ok(worm[2] > worm[1] && worm[1] > worm[0], `glowworm ${worm}`);
  assert.ok(cap[1] > cap[2] && cap[1] > cap[0], `fungus ${cap}`);
  assert.ok(gem[2] > gem[0] && gem[0] > gem[1], `crystal ${gem}`);
});

test('one albedo under two lamps shares its resting rungs', () => {
  /* The seam law: where no lamp reaches, the two floors are one colour. */
  for (const i of [0, 1]) for (const lamp of ['geodeRock', 'moonRock'])
    assert.ok(same(RAMP.caveRock[i], RAMP[lamp][i]), `${lamp} rung ${i} differs`);
  assert.ok(same(RAMP.dripstone[1], RAMP.geodeStone[1]), 'calcite at rest differs');
  /* and a lamp's two rungs part them */
  assert.ok(!same(RAMP.caveRock[3], RAMP.geodeRock[3]));
});

test('a pool of light is the inverse square law, and ends at zero on its reach', () => {
  const L = lightOf('amethyst', 3, 0, 0);
  assert.ok(Math.abs(glowAt(L, 0, 0) - L.power) < 1e-9, 'the foot is not the full power');
  assert.equal(glowAt(L, L.reach, 0), 0);
  assert.ok(L.reach <= REACH, 'a light reaches past the baked margin');
  let last = Infinity;
  for (let d = 0; d < L.reach; d += 2) {
    const e = glowAt(L, d, 0);
    assert.ok(e <= last, `the pool brightens at ${d} px`);
    last = e;
  }
  /* a screen row is two ground pixels: the pool is an ellipse on screen */
  assert.ok(Math.abs(glowAt(L, 20, 0) - glowAt(L, 0, 10)) < 1e-9);
  /* a point source, Lambert 1760: (1 + (d/h)^2)^(-3/2), less its own edge */
  const raw = (d) => Math.pow(1 + (d / L.h) ** 2, -1.5);
  const want = L.power * (raw(12) - raw(L.reach)) / (1 - raw(L.reach));
  assert.ok(Math.abs(glowAt(L, 12, 0) - want) < 1e-9);
});

test('two chunks give one answer about every luminous body', () => {
  /* A light is baked into its neighbours' floors. A body one chunk places and
     another does not expect is a pool with no cap, or a cap with no pool. */
  const cx0 = Math.floor(C.x / CH) - 1, cy0 = Math.floor(C.y / CH);
  let checked = 0;
  for (let cy = cy0 - 1; cy <= cy0 + 1; cy++) for (let cx = cx0 - 1; cx <= cx0 + 1; cx++) {
    const A = gen.bakeChunk(cx, cy, true);
    const known = new Set(A.lights.map((l) => `${l.x},${l.y}`));
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const B = gen.bakeChunk(cx + i, cy + j, true);
      for (const p of B.props) {
        if (!p.glow) continue;
        const L = lightOf(p.kind, p.tier, p.x, p.y);
        const reaches = p.x > A.ox - L.reach && p.x < A.ox + CH + L.reach
          && p.y > A.oy - L.reach / 2 && p.y < A.oy + CH + L.reach / 2;
        if (!reaches) continue;
        checked++;
        assert.ok(known.has(`${p.x},${p.y}`),
          `chunk ${cx},${cy} does not know the ${p.kind} at ${p.x},${p.y}`);
      }
    }
  }
  assert.ok(checked > 40, `only ${checked} lights were checked`);
});

test('every room reaches the hall on foot', () => {
  /* Flood the walkable ground on an 8 px grid from the common. */
  const S = 8, key = (x, y) => `${x},${y}`;
  const walk = (x, y) => gen.traversalAt(x * S, y * S).walk;
  const start = [Math.round(gen.pathX(C.y) / S), Math.round(C.y / S)];
  assert.ok(walk(...start), 'the common is not walkable');
  const seen = new Set([key(...start)]), stack = [start];
  while (stack.length) {
    const [x, y] = stack.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = key(x + dx, y + dy);
      if (seen.has(k) || !walk(x + dx, y + dy)) continue;
      seen.add(k); stack.push([x + dx, y + dy]);
    }
  }
  const reached = (px, py, r) => {
    for (let y = Math.round((py - r) / S); y <= Math.round((py + r) / S); y++)
      for (let x = Math.round((px - r) / S); x <= Math.round((px + r) / S); x++)
        if (seen.has(key(x, y))) return true;
    return false;
  };
  /* A place may stand on its own pool (the Sump): the shore inside its radius
     is what must be reached. */
  for (const p of gen.POI)
    assert.ok(reached(p.x, p.y, p.r * 0.7), `the ${p.kind} at ${Math.round(p.x)},${Math.round(p.y)} is cut off`);
  /* and each side by its own passage: the cross passage is open at both ends */
  for (const side of [-1, 1])
    assert.ok(reached(C.x + side * 640, C.y, 70), `the ${side < 0 ? 'west' : 'east'} passage is closed`);
  assert.equal(gen.portals.length, BIOMES.hollow.portals.length);
  /* the rock closes the world: the flood stays inside the plan's reach */
  const far = Math.max(...[...seen].map((k) => Math.abs(k.split(',')[0] * S - C.x)));
  assert.ok(far < BIOMES.hollow.cavern.reach + 420, `open ground runs ${far} px from the common`);
});

test('the drawn rock is the walked rock, and nothing stands in it', () => {
  const cx = Math.floor((C.x - 420) / CH), cy = Math.floor(C.y / CH);
  let px = 0, off = 0, props = 0;
  for (const [i, j] of [[0, 0], [1, 0], [0, -1], [-1, 1]]) {
    const c = gen.bakeChunk(cx + i, cy + j, true);
    for (let y = 0; y < CH; y += 3) for (let x = 0; x < CH; x += 3) {
      const flag = Math.round(c.geom[(y * CH + x) * 4 + 3] / FLAG_Q);
      const rock = flag === SURF.cliff || flag === SURF.cliffGeode || flag === SURF.rockroof;
      const walk = gen.traversalAt(c.ox + x, c.oy + y).walk;
      px++;
      if (rock && walk) off++;
    }
    for (const p of c.props) {
      props++;
      assert.ok(gen.traversalAt(p.x, p.y).walk, `a ${p.kind} stands in rock or water at ${p.x},${p.y}`);
    }
  }
  /* The mask is a bilinear lattice and the collider the analytic field: they
     may part by a pixel at an edge. */
  assert.ok(off / px < 0.004, `${(100 * off / px).toFixed(2)}% of drawn rock is walkable`);
  assert.ok(props > 20);
  for (const s of [SURF.cliff, SURF.cliffGeode, SURF.rockroof])
    assert.equal(SURFACE[s].speed, 0);
});

test('a crystal group stands in a pool hotter than one lamp', () => {
  /* The hot floor borrows the calcite ramp: calcite is rock times one factor. */
  const k = ALBEDO.calcite.map((a, i) => a / ALBEDO.caveRock[i]);
  assert.ok(Math.max(...k) / Math.min(...k) < 1.06, `calcite is not a brighter rock: ${k}`);
  let feet = 0;
  for (const q of gen.caveSet) {
    if (q.kind !== 'amethyst' || feet >= 12) continue;
    const c = gen.bakeChunk(Math.floor(q.x / CH), Math.floor(q.y / CH), true);
    if (!c.props.some((p) => p.x === q.x && p.y === q.y)) continue;
    const flagAt = (x, y) => Math.round(c.geom[((y - c.oy) * CH + x - c.ox) * 4 + 3] / FLAG_Q);
    if (q.y + 3 >= c.oy + CH) continue;
    feet++;
    assert.equal(flagAt(q.x, q.y + 3), SURF.geodeHot, `the foot at ${q.x},${q.y} is cold`);
  }
  assert.ok(feet >= 8, `only ${feet} feet were checked`);
  assert.deepEqual(RAMP[SURFACE[SURF.geodeHot].ramp], RAMP.geodeStone);
});

test('a foxstone is a group of points', () => {
  /* Owner review, 2026-11-17: the stones were "too big and too round". A disc
     fills 0.79 of its box; a point's top row is a small share of its width. */
  const atlas = buildWorldAtlas(SEED, 1, 'hollow', null);
  const tall = (kind) => Math.max(...atlas[kind].flat().map((sp) => sp.h));
  for (const sp of atlas.foxstone.flat()) {
    let n = 0, top = 0;
    for (let i = 0; i < sp.w * sp.h; i++) if (sp.occ[i]) n++;
    for (let x = 0; x < sp.w; x++) if (sp.occ[x]) top++;
    assert.ok(n / (sp.w * sp.h) < 0.6, `a ${sp.w}x${sp.h} foxstone fills ${(n / sp.w / sp.h).toFixed(2)} of its box`);
    assert.ok(top * 4 <= sp.w, `a ${sp.w} px foxstone ends ${top} px wide`);
  }
  assert.ok(tall('foxstone') < tall('amethyst') && tall('foxstone') <= PLAYER_H);
});

test('a glowcap is no taller than the traveller', () => {
  /* Owner review, 2026-11-17: the mushrooms were "way too big". */
  const atlas = buildWorldAtlas(SEED, 1, 'hollow', null);
  let tallest = 0;
  for (const bank of atlas.glowcap) for (const sp of bank) tallest = Math.max(tallest, sp.h);
  assert.ok(tallest > 8 && tallest <= PLAYER_H, `the tallest glowcap is ${tallest} px`);
  /* and the Heart is the one body taller than a wall is high */
  const heart = atlas.heartstone.flat();
  assert.equal(heart.length, 1);
  assert.ok(heart[0].h > 2 * PLAYER_H * 0.9, `the Heart is ${heart[0].h} px`);
});
