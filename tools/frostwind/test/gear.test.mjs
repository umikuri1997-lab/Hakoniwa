import assert from 'node:assert/strict';
import test from 'node:test';

import { fashionFor } from '../src/culture.js';
import { ITEMS, SLOTS, validateGear, wear } from '../src/gear.js';
import { FOLK_STATES, FOLK_VIEWS } from '../src/body-folk.js';
import { buildWorldAtlas } from '../src/atlas.js';
import { paintPerson, travellerFor, travellerKeyFor } from '../src/people.js';
import { SCENES } from '../src/scene.js';
import { connectivity } from './folk-helpers.mjs';

const REPORT = process.env.FROSTWIND_TEST_REPORT === '1';
const world = (biome) => {
  const scene = Object.values(SCENES).find((s) => s.biome === biome);
  return { biome, ramps: scene.ramps };
};

test('every item has a slot, a maker culture, a reason, and stays in its slot', () => {
  assert.deepEqual(validateGear(), []);
  for (const slot of SLOTS)
    assert.ok(Object.values(ITEMS).some((q) => q.slot === slot), `no item fills ${slot}`);
});

test('no items is the wearer\'s own dress, and an item is a named fold over it', () => {
  for (const biome of ['boreal', 'meadow', 'swamp', 'desert']) {
    const who = travellerFor(biome);
    const bare = wear(who, [], world(biome));
    assert.equal(bare.changed, false);
    assert.deepEqual(bare.fashion, fashionFor(who));
  }
  const got = wear('desertTraveller', ['felt-dome', 'windlass-rope', 'gallery-lamp'], world('desert'));
  assert.deepEqual(got.worn, ['felt-dome', 'windlass-rope', 'gallery-lamp']);
  assert.deepEqual(got.refused, []);
  assert.equal(got.fashion.hat, 'felt');
  assert.equal(got.fashion.outerLayer, 'rope-coil');
  assert.equal(got.fashion.carriedKit, 'gallery-lamp');
  /* nothing else moved: the coat is still the hero coat */
  assert.equal(got.fashion.ramp, fashionFor('desertTraveller').ramp);
});

test('the world refuses an item, and says which law', () => {
  /* weather: a knit cap is outside the desert's hats */
  const cap = wear('desertTraveller', ['wool-cap'], world('desert'));
  assert.equal(cap.changed, false);
  assert.match(cap.refused[0].reason, /outside desert's hats/);
  /* weather: bare shins below freezing */
  const shorts = wear('traveller', ['field-shorts'], world('boreal'));
  assert.match(shorts.refused[0].reason, /outside boreal's legwears/);
  /* palette: the digger's cloth is the desert's salt, and the frostwood
     declares no such ramp */
  const shift = wear('traveller', ['bleached-shift'], world('boreal'));
  assert.match(shift.refused[0].reason, /outside boreal's|does not declare/);
  /* at home the same shift is legal, though it breaks the desert's own
     cuts: the maker's reason is the exception */
  const home = wear('desertTraveller', ['bleached-shift', 'gallery-shorts'], world('desert'));
  assert.deepEqual(home.refused, []);
  assert.equal(home.fashion.ramp, 'sabkha');
  /* one thing per slot, and the first one stays */
  const two = wear('desertTraveller', ['felt-dome', 'keeper-turban'], world('desert'));
  assert.deepEqual(two.worn, ['felt-dome']);
  assert.match(two.refused[0].reason, /head slot is taken/);
  /* a medium rule: the veil and a scarf tail hang on one side */
  const tail = wear('desertTraveller', ['scarf-tail'], world('desert'));
  assert.match(tail.refused[0].reason, /hang on one side|outside desert/);
  /* the item table is the whole list: an inherited key is no item */
  for (const id of ['nonsense', 'constructor', '__proto__'])
    assert.match(wear('traveller', [id], world('boreal')).refused[0].reason, /no such item/);
  assert.throws(() => wear('traveller', ['wool-cap']), /needs a world/);
});

test('no item adds a dyed pixel where the world declares no dye', () => {
  /* Measured: the meadow declares no `folkDye`, and a lantern's flame, a
     ferrule and a sash each passed the cloth check and snapped to the
     nearest other colour. */
  const meadow = world('meadow');
  assert.ok(!meadow.ramps.includes('folkDye'));
  for (const id of Object.keys(ITEMS)) {
    const got = wear('meadowTraveller', [id], meadow);
    if (!got.changed) continue;
    for (let d = 0; d < 5; d++)
      assert.ok(!paintPerson('meadowTraveller', d, 0, 'idle', 'neutral', got.fashion).occ.includes(18),
        `${id} draws the dye material in the meadow`);
  }
  assert.match(wear('meadowTraveller', ['ochre-sash'], meadow).refused[0].reason,
    /declares no folkDye|outside meadow/);
});

test('every legal item on every traveller is one connected body in every frame', () => {
  let legal = 0, refused = 0;
  for (const biome of ['boreal', 'meadow', 'swamp', 'desert']) {
    const who = travellerFor(biome);
    for (const id of Object.keys(ITEMS)) {
      const got = wear(who, [id], world(biome));
      if (!got.changed) { refused++; assert.ok(got.refused[0].reason); continue; }
      legal++;
      for (let d = 0; d < FOLK_VIEWS; d++)
        for (const [state, n] of Object.entries(FOLK_STATES))
          for (let f = 0; f < n; f++) {
            const sp = paintPerson(who, d, f, state, 'neutral', got.fashion);
            const { joined, total } = connectivity(sp);
            assert.equal(joined, total, `${who} in ${id}, dir ${d} ${state}:${f}, comes apart`);
            for (let x = 0; x < sp.w; x++)
              assert.equal(sp.occ[x], 0, `${who} in ${id} clips at the top`);
            assert.equal(sp.ramp, got.fashion.ramp, `${id} did not reach the instance ramp`);
          }
    }
  }
  assert.ok(legal >= 40 && refused >= 20,
    `${legal} legal and ${refused} refused pairs: the laws accept or refuse too little`);
  if (REPORT) console.log(`  GEAR — ${Object.keys(ITEMS).length} items on 4 travellers: `
    + `${legal} legal, ${refused} refused with a reason`);
});

test('an outfit reaches the traveller\'s atlas rows and nobody else\'s', () => {
  const outfit = wear('desertTraveller', ['keeper-turban', 'gnomon-staff'], world('desert')).fashion;
  const plain = buildWorldAtlas(20260727, 0, 'desert');
  const worn = buildWorldAtlas(20260727, 0, 'desert', outfit);
  const key = travellerKeyFor('desert');
  const bytes = (atlas, k) => atlas.figures[k].map((bank) =>
    bank.map((sp) => `${sp.w}x${sp.h}:${sp.occ.join('')}`).join('|')).join('/');
  assert.notEqual(bytes(plain, key + '@idle'), bytes(worn, key + '@idle'),
    'the outfit did not reach the traveller');
  for (const k of Object.keys(plain.figures)) {
    if (k.startsWith(key) || k.startsWith('camelRider')) continue;
    assert.equal(bytes(plain, k), bytes(worn, k), `${k} changed with the traveller's outfit`);
  }
});
