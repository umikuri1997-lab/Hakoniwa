import { CULTURE_PACKAGES, FASHION_VOCAB, fashionFor } from './culture.js';
import { MAT_DYE } from './figure-folk.js';
import { PERSON_VIEWS, paintPerson } from './people.js';

/* ═══════════════════════════════════════════════════════════════════════════
   Gear. A thing a person can put on, stated as the dress fields it sets.

   An item draws nothing. culture.js seeds a fashion row, figure-folk.js
   rasters it, and an item is a named fold over that row: so anything worn
   passes every raster law a villager passes, and cannot name a colour. A
   cloth is a ramp and a ramp belongs to a world.

   Three laws decide what may be worn where, and `wear` returns the reason
   for each refusal:
     1. one thing per slot;
     2. weather selects the range (FASHION_VOCAB): outside the world that
        makes it, an item is legal only where its values are in that world's
        own lists. A felt dome is legal in the gallery's desert and nowhere a
        culture has not made one;
     3. the scene snaps to its declared ramps: a cloth the world does not
        declare would draw in the nearest other colour. So would a dyed
        band, a ferrule or a flame where the world declares no `folkDye`,
        and no field names that: it is read off the raster.
   Plus the medium rules the raster already records (MEDIUM below).

   `maker` is the culture package that makes the item and `why` is the reason
   it exists. An item with no reason is a costume.
   ═══════════════════════════════════════════════════════════════════════════ */

const SLOTS = Object.freeze(['head', 'coat', 'outer', 'hand', 'legs', 'neck', 'band']);

/* Which fashion fields a slot may set. An item setting a field outside its
   slot is a second item. */
const SLOT_FIELDS = Object.freeze({
  head: ['hat', 'capTone', 'headAccent'],
  coat: ['ramp', 'coatCut', 'coatBulk', 'clothPattern'],
  outer: ['outerLayer', 'closure'],
  hand: ['carriedKit'],
  legs: ['legwear'],
  neck: ['scarf'],
  band: ['dyePlace', 'dyeHue'],
});

/* Fashion field -> the FASHION_VOCAB list that ranges it. Fields absent here
   are not weather: an axe is an axe in any climate. */
const WEATHER = Object.freeze({
  hat: 'hats', coatCut: 'coatCuts', coatBulk: 'coatBulks', scarf: 'scarves',
  legwear: 'legwears', ramp: 'ramps', dyeHue: 'dyeHues',
});

const I = (slot, maker, sets, why) => Object.freeze({ slot, maker, sets: Object.freeze(sets), why });
const ITEMS = Object.freeze({
  /* boreal hearth and market */
  'wool-cap':      I('head', 'boreal-hearth-market', { hat: 'wool' }, 'a knit cap holds heat below freezing'),
  'earflap-cap':   I('head', 'boreal-hearth-market', { hat: 'earflap' }, 'the flaps cover the ears in wind'),
  'fleece-hood':   I('head', 'boreal-hearth-market', { hat: 'hood' }, 'a hood closes the gap at the neck'),
  'hearth-mantle': I('outer', 'boreal-hearth-market', { outerLayer: 'mantle', closure: 'clasp' }, 'the keeper of a hearth wears the household wool'),
  'fuel-yoke':     I('outer', 'boreal-hearth-market', { outerLayer: 'reinforced', closure: 'tie' }, 'a carried billet wears through a shoulder'),
  'quilted-coat':  I('coat', 'boreal-hearth-market', { coatCut: 'mid', coatBulk: 'puffy' }, 'still air in channels is the insulation'),
  'hand-lantern':  I('hand', 'boreal-hearth-market', { carriedKit: 'hand-lantern' }, 'the watch walks after dark'),
  'wood-axe':      I('hand', 'boreal-hearth-market', { carriedKit: 'wood-axe' }, 'fuel is split every day of winter'),
  'market-basket': I('hand', 'boreal-hearth-market', { carriedKit: 'provision-basket' }, 'the market is carried in and carried out'),
  'scarf-tail':    I('neck', 'boreal-hearth-market', { scarf: 'tail' }, 'a wound scarf with the end left long'),
  'madder-sash':   I('band', 'boreal-hearth-market', { dyePlace: 'sash', dyeHue: 'madder' }, 'dye is imported, so it is worn as a band'),
  /* meadow steading */
  'straw-hat':     I('head', 'meadow-steading-commons', { hat: 'straw' }, 'a two-column brim shades the neck at field work'),
  'field-shorts':  I('legs', 'meadow-steading-commons', { legwear: 'shorts' }, 'cut sward does not abrade a bare shin'),
  'work-apron':    I('outer', 'meadow-steading-commons', { outerLayer: 'apron', closure: 'tie' }, 'hay and well water spoil a coat'),
  /* swamp water road */
  'oilskin-brim':  I('head', 'swamp-water-road', { hat: 'brim' }, 'warm rain runs off a brim'),
  'rain-cape':     I('outer', 'swamp-water-road', { outerLayer: 'shoulder-wrap', closure: 'tie' }, 'a shoulder cape sheds rain without insulating'),
  /* the desert's two households */
  'road-veil':     I('head', 'desert-long-road', { hat: 'veil' }, 'blown sand strips a bare face'),
  'goat-hair-robe':I('coat', 'desert-long-road', { ramp: 'timber', coatCut: 'long', coatBulk: 'thin' }, 'a loose dark robe holds a still layer of air'),
  'ochre-hem':     I('band', 'desert-long-road', { dyePlace: 'hem-stripe', dyeHue: 'ochre' }, 'a household shows its dye where the robe ends'),
  'felt-dome':     I('head', 'desert-garden-hold', { hat: 'felt', capTone: 'dark' }, 'stones fall down a shaft'),
  'keeper-turban': I('head', 'desert-garden-hold', { hat: 'turban', capTone: 'mid' }, 'the one who reads the noon stands in it'),
  'bleached-shift':I('coat', 'desert-garden-hold', { ramp: 'sabkha', coatCut: 'short', coatBulk: 'thin' }, 'the lamp finds a white body in the gallery'),
  'gallery-shorts':I('legs', 'desert-garden-hold', { legwear: 'shorts' }, 'the gallery runs knee-deep'),
  'windlass-rope': I('outer', 'desert-garden-hold', { outerLayer: 'rope-coil', closure: null }, 'the line a digger goes down on'),
  'gallery-lamp':  I('hand', 'desert-garden-hold', { carriedKit: 'gallery-lamp' }, 'a flame says whether the air can be breathed'),
  'gnomon-staff':  I('hand', 'desert-garden-hold', { carriedKit: 'gnomon-staff' }, 'a turn of water is a length of its shadow'),
  'ochre-sash':    I('band', 'desert-garden-hold', { dyePlace: 'sash', dyeHue: 'ochre' }, 'the office is marked at the belt'),
});

/* Rules the raster records as measured failures (src/culture.js,
   src/figure-folk.js). Each returns a reason, or null. */
const MEDIUM = Object.freeze([
  (row) => row.headAccent === 'ear-wrap' && row.hat === 'earflap'
    ? 'an earflap draws in the columns the ear-wrap uses' : null,
  (row) => row.scarf === 'tail' && row.hat === 'veil'
    ? 'a scarf tail and the veil end hang on one side: 7 px on a shoulder drawn at 5' : null,
  (row) => row.dyePlace === 'hat-band' && (!row.hat || row.hat === 'none')
    ? 'a brow band needs a brow' : null,
]);

const worldOfMaker = (maker) => CULTURE_PACKAGES[maker]?.biome ?? null;

/* Whether a person in this dress paints the dye material, in any view. */
const paintsDye = (personId, fashion) => {
  for (let d = 0; d < PERSON_VIEWS; d++)
    if (paintPerson(personId, d, 0, 'idle', 'neutral', fashion).occ.includes(MAT_DYE)) return true;
  return false;
};

/* Fold items over a person's own dress. Returns the fashion row to raster and
   every refusal with its reason. `biome` is the world whose laws decide.
   `ramps` is the scene's declared snap list; without it law 3 is not
   checked. Items apply in the order given, so a refusal never depends on a
   later item. */
function wear(personId, itemIds = [], { biome, ramps = null } = {}) {
  const vocab = FASHION_VOCAB[biome];
  if (!vocab) throw new Error(`wear needs a world: '${biome}' has no dress vocabulary`);
  let row = { ...fashionFor(personId) };
  const worn = [], refused = [], slots = new Set();
  /* a world that declares no dye ramp lets no item add a dyed pixel */
  const dyeless = ramps && !ramps.includes('folkDye');
  let dyed = dyeless && paintsDye(personId, row);
  for (const id of itemIds) {
    const item = Object.hasOwn(ITEMS, id) ? ITEMS[id] : null;
    const refuse = (reason) => refused.push(Object.freeze({ item: id, reason }));
    if (!item) { refuse('no such item'); continue; }
    if (slots.has(item.slot)) { refuse(`the ${item.slot} slot is taken`); continue; }
    const home = worldOfMaker(item.maker) === biome;
    let reason = null;
    for (const [field, value] of Object.entries(item.sets)) {
      if (value === null) continue;
      const list = WEATHER[field];
      if (!home && list && !vocab[list].includes(value))
        reason = `${field} '${value}' is outside ${biome}'s ${list}`;
      if (field === 'ramp' && ramps && !ramps.includes(value))
        reason = `${biome} does not declare the ${value} cloth`;
      if (reason) break;
    }
    if (!reason) {
      const next = { ...row, ...item.sets };
      reason = MEDIUM.map((rule) => rule(next)).find(Boolean) || null;
      if (!reason && dyeless && !dyed && paintsDye(personId, next))
        reason = `it draws a dyed pixel, and ${biome} declares no folkDye`;
      if (!reason) row = next;
    }
    if (reason) { refuse(reason); continue; }
    slots.add(item.slot); worn.push(id);
  }
  return Object.freeze({ fashion: Object.freeze(row), worn: Object.freeze(worn),
    refused: Object.freeze(refused), changed: worn.length > 0 });
}

function validateGear() {
  const errors = [];
  for (const [id, item] of Object.entries(ITEMS)) {
    if (!SLOTS.includes(item.slot)) errors.push(`${id}.slot is ${item.slot}`);
    if (!CULTURE_PACKAGES[item.maker]) errors.push(`${id}.maker references ${item.maker}`);
    if (!item.why) errors.push(`${id} has no reason`);
    for (const field of Object.keys(item.sets))
      if (!SLOT_FIELDS[item.slot]?.includes(field))
        errors.push(`${id} sets ${field}, which is not a ${item.slot} field`);
  }
  return errors;
}

export { ITEMS, MEDIUM, SLOTS, WEATHER, validateGear, wear };
