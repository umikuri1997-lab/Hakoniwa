import {
  FOLK, FOLK_STATES, FOLK_VIEWS, TRACK_HALF_WIDTH,
  castStates, folkStrikes, gaitCyclePx, gaitFrames, heightPx, stepPx,
} from './body-folk.js';
import { fashionFor } from './culture.js';
import { makeFolk } from './figure-folk.js';
import { PLAYER_H } from './scale.js';

/* Who is a person: one list, one body, one raster. A consumer asks here and
   gets pixels for a person without knowing which file holds the anatomy and
   which the raster. The cadence law, the cast and the painter are re-exported
   so atlas, scene, fauna, life-runtime, main and tools have one import for
   people. */

/* `FOLK` is anatomy: stature, the rung window, the accent ramp every body
   shares. `fashionFor` is dress: the fleece, the cut, the bulk, the hat, the
   dyed band. The ramp comes off the fashion row. `ramp:row.ramp` here
   overwrites the culture's choice with the body's. */
const FASHION = Object.freeze(Object.fromEntries(
  Object.keys(FOLK).map((name) => [name,fashionFor(name)]),
));
const CAST = Object.freeze(Object.fromEntries(
  Object.entries(FOLK).map(([name,row]) => {
    const px=Math.max(18,heightPx(row)+FASHION[name].staturePx);
    return [name,Object.freeze({...row,h:px/PLAYER_H,
      ramp:FASHION[name].ramp,fashion:FASHION[name]})];
  }),
));
const CAST_BY_KEY = Object.freeze(Object.fromEntries(
  Object.values(CAST).map((row) => [row.key,row]),
));

/* Which wardrobe a world draws. The traveller is one person with one set of
   clothes per world, and this is the only place that says which. `culture.js`
   owns what each row wears; this owns which row a place picks. */
const TRAVELLER_BY_BIOME = Object.freeze({
  boreal: 'traveller', meadow: 'meadowTraveller', swamp: 'swampTraveller',
  desert: 'desertTraveller', hollow: 'hollowTraveller',
});
const travellerFor = (biome) => TRAVELLER_BY_BIOME[biome] || 'traveller';
const travellerKeyFor = (biome) => CAST[travellerFor(biome)].key;

/* What a row is drawn as. `outfit` is a fashion row from src/gear.js: the
   same body under other cloth. With none, this is the row's own dress, and
   the bake is byte-identical to a bake that never heard of gear. */
const appearanceOf = (name, outfit = null) => (outfit
  ? { row:{ ...CAST[name], ramp:outfit.ramp, fashion:outfit }, fashion:outfit }
  : { row:CAST[name], fashion:FASHION[name] });

/* One person, one view, one frame. Deterministic: same arguments, same bytes,
   so the atlas can alias look variants that cannot read from a given view. */
const paintPerson = (name, dir = 0, frame = 0, state = 'walk', look = 'neutral',
  outfit = null) =>
  makeFolk(name, dir, frame, state, look, appearanceOf(name, outfit));

/* A planted boot is a world point. Pose excursion runs along the heading and
   anatomical side runs across it, off the same pelvis half-width the track
   tests use. */
function folkFootWorld(x,y,hx,hy,foot){
  const n=Math.hypot(hx,hy)||1,ux=hx/n,uy=hy/n;
  return {
    x:x+ux*foot.dx-uy*foot.side*TRACK_HALF_WIDTH,
    y:y+uy*foot.dx+ux*foot.side*TRACK_HALF_WIDTH,
  };
}

export {
  CAST, CAST_BY_KEY, FASHION, TRAVELLER_BY_BIOME,
  FOLK_STATES as PERSON_STATES, FOLK_VIEWS as PERSON_VIEWS,
  TRACK_HALF_WIDTH,
  appearanceOf, castStates, folkFootWorld, folkStrikes, gaitCyclePx, gaitFrames,
  heightPx, paintPerson, stepPx,
  travellerFor, travellerKeyFor,
};
