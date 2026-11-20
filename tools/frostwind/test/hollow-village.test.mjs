/* The earth folk's village. src/hollow-village.js owns the forms,
   BIOMES.hollow.slots the plan, src/culture.js the residents. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BIOMES } from '../src/biome.js';
import { FOLK, heightPx } from '../src/body-folk.js';
import { M } from '../src/construct.js';
import { PATHW } from '../src/constants.js';
import { RESIDENTS } from '../src/culture.js';
import { CAP_HOUSE_M, CAP_HOUSE_VARIANTS, capHouseGeom, makeCapHouse } from '../src/hollow-village.js';
import { PLAYER_H } from '../src/scale.js';
import { LUMEN } from '../src/sprite.js';
import { makeWorldGen } from '../src/worldgen.js';

const FOLK_IDS = ['hollowTender', 'hollowLamplighter', 'hollowCutter', 'hollowKeeper'];
const hollow = (seed) => makeWorldGen(seed, { lake: 0.55, density: 1, snow: 1, biome: 'hollow' });

test('every slot of the village stands on open floor, off the trail', () => {
  for (const seed of [7, 1337, 20260727]) {
    const gen = hollow(seed);
    assert.deepEqual(gen.steadingDropped, [], `seed ${seed} dropped a slot`);
    assert.equal(gen.STEADING.length, BIOMES.hollow.slots.length);
    for (const s of gen.STEADING) {
      const where = `seed ${seed}: ${s.kind} at ${s.x},${s.y}`;
      /* the anchor row and the apron in front of it */
      for (const dy of [0, 8]) {
        const t = gen.traversalAt(s.x, s.y + dy);
        assert.ok(t.walk && t.medium !== 'rock' && !gen.isWater(s.x, s.y + dy), `${where} is in ${t.medium}`);
      }
      /* 40 px for a house. A post stands beside the stones. */
      const clear = s.kind === 'capHouse' ? 40 : PATHW + 8;
      assert.ok(gen.pathDist(s.x, s.y) >= clear, `${where} is ${gen.pathDist(s.x, s.y).toFixed(0)} px from the trail`);
    }
    /* an arc: each house east and south of the one before */
    const houses = gen.STEADING.filter((q) => q.kind === 'capHouse');
    for (let i = 1; i < houses.length; i++)
      assert.ok(houses[i].x > houses[i - 1].x && houses[i].y > houses[i - 1].y, `seed ${seed}: house ${i} breaks the arc`);
  }
});

test('each maker has a door, and every place of the day is one a body can stand on', () => {
  const gen = hollow(1337), plan = gen.compileLifePlans();
  const byId = new Map(plan.useNodes.map((q) => [q.id, q]));
  const doors = new Set();
  for (const id of FOLK_IDS) {
    const r = plan.residents.find((q) => q.profileId === id);
    assert.ok(r, `${id} is not resident`);
    assert.match(r.anchor.nodeId, /:threshold$/, `${id} does not anchor on a door`);
    doors.add(`${r.anchor.x},${r.anchor.y}`);
    for (const kind of new Set(RESIDENTS[id].schedule.map((q) => q.nodeKind))) {
      const bound = r.nodeBindings[kind] || [];
      assert.ok(bound.length, `${id} cannot bind ${kind}`);
      for (const nodeId of bound) {
        const n = byId.get(nodeId), t = gen.traversalAt(n.x, n.y);
        assert.ok(t.walk && !gen.isWater(n.x, n.y), `${nodeId} at ${n.x},${n.y} is in ${t.medium}`);
      }
    }
    /* six hours of rest each, and the four rests tile the day */
    const rest = RESIDENTS[id].schedule.filter((q) => q.action === 'rest');
    assert.equal(rest.reduce((sum, q) => sum + q.end - q.start, 0), 360, `${id} rest`);
  }
  assert.equal(doors.size, FOLK_IDS.length, 'two makers share a door');
  for (let m = 0; m < 1440; m += 30) {
    const resting = FOLK_IDS.filter((id) => RESIDENTS[id].schedule
      .some((q) => q.action === 'rest' && m >= q.start && m < q.end));
    assert.equal(resting.length, 1, `at minute ${m}, ${resting.length} rest`);
  }
});

test('a house fits its makers: the door is one of them tall, and one window is lit', () => {
  const small = Math.min(...FOLK_IDS.map((id) => heightPx(FOLK[id])));
  assert.equal(M(CAP_HOUSE_M.door), small, 'the door is not one maker tall');
  assert.ok(M(CAP_HOUSE_M.door) < PLAYER_H, 'the traveller fits the door');
  for (let v = 0; v < CAP_HOUSE_VARIANTS.length; v++) {
    const G = capHouseGeom(v), sp = makeCapHouse(null, v), ridge = G.wall + G.rise;
    assert.ok(ridge >= 25 && ridge <= 34, `variant ${v} stands ${ridge} px to its ridge`);
    assert.ok(G.wall - G.gill > M(CAP_HOUSE_M.door), `variant ${v}: the gills cover the door head`);
    assert.equal(sp.ramp2, 'glowcap');
    /* the window: lit pixels below the gills, right of the door */
    let lit = 0;
    for (let y = sp.ay - G.wall + G.gill + 1; y <= sp.ay; y++)
      for (let x = G.doorX + G.doorHW + 1; x <= G.cx + G.r; x++)
        if (sp.occ[y * sp.w + x] === LUMEN) lit++;
    assert.equal(lit, 9, `variant ${v} window is ${lit} lit pixels`);
    /* the door is on the anchor column and reaches the ground row band */
    assert.equal(sp.ax, G.doorX);
    assert.equal(sp.occ[(sp.ay - 3) * sp.w + sp.ax], 4, `variant ${v} has no door at its anchor`);
  }
});
