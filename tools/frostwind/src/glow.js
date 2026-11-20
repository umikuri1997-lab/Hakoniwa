import { GROUND_PX_PER_ROW } from './basin.js';
import { ATLAS_S, PAD } from './constants.js';
import { PX_PER_M } from './scale.js';
import { SPECIES, SPECIES_H, tierHeight } from './species.js';

/* The light a luminous body throws on the floor. SOURCE: a point source at
   height h over a plane gives E(d)/E(0) = (1 + (d/h)^2)^(-3/2): the inverse
   square law times Lambert's cosine (Lambert, Photometria, 1760).

   The medium wins, named: a chunk answers for its own floor from a margin of
   PAD pixels, so a light reaches REACH at most, and a cap taller than
   REACH/2.6 is treated as that tall. The kernel is shifted to end at zero on
   its reach, so no light has an edge. Distances are ground pixels: a screen
   row is two of them (PROJECTION.md). */
const REACH=PAD-2;
const H_MAX=REACH/2.6;
const fall=q=>Math.pow(1+q*q,-1.5);

const light=(lamp,tall,power,x,y)=>{
  const h=Math.min(H_MAX,Math.max(2,tall));
  const reach=Math.min(REACH,h*5.5);
  return {x,y,lamp,h,reach,power,edge:fall(reach/h)};
};

/* The light of one placed body, or null. `kind` and `tier` are the placement's
   own answer, so the light and the sprite cannot disagree. */
function lightOf(kind,tier,x,y){
  const G=SPECIES[kind].glow;
  if(!G) return null;
  const tall=tierHeight(tier)*ATLAS_S*(SPECIES_H[kind]/SPECIES_H.birch);
  return light(G.lamp,tall*G.at,G.power,x,y);
}

/* Made lights (src/hollow-village.js): the lamp's height above the floor in
   metres, its lamp and its strength at the foot. A post carries a cut
   crystal; a house glows under the eaves of its cap. */
const MADE=Object.freeze({
  lampPost:Object.freeze({lamp:'crystal',atM:1.30,power:1.50}),
  capHouse:Object.freeze({lamp:'fungus', atM:1.40,power:1.10}),
});
function madeLight(kind,x,y){
  const G=MADE[kind];
  return G?light(G.lamp,G.atM*PX_PER_M,G.power,x,y):null;
}

/* Irradiance of one light at a ground point, 1 at its foot, 0 at its reach. */
function glowAt(L,wx,wy){
  const dx=wx-L.x, dy=(wy-L.y)*GROUND_PX_PER_ROW;
  const d2=dx*dx+dy*dy;
  if(d2>=L.reach*L.reach) return 0;
  return L.power*(fall(Math.sqrt(d2)/L.h)-L.edge)/(1-L.edge);
}

export { REACH, glowAt, lightOf, madeLight };
