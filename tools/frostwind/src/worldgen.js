/* The world model. One generator per resident world, composed from the field
   owners in src/world/. Each stage reads the stages before it through `w`, so
   the order below is the dependency order: a stage may only ask a field that
   already exists.

   INVARIANT: elevation, water, trails, collision and spawning query the same
   analytic world-coordinate fields. Equal seed and coordinates return equal
   answers, so the second generator in src/chunk-worker.js agrees with this one. */
import { BIOMES, HABITAT, LAYERS, TIERS } from './biome.js';
import { makeCavern } from './world/cavern.js';
import { makeChunkBake, textureChunk } from './world/chunk-bake.js';
import { makeDunes } from './world/dunes.js';
import { makeGround } from './world/ground.js';
import { LIFE_PATCH_SIZE, LIFE_SITE_SIZE, makeLifeField } from './world/life-field.js';
import { makePlacement } from './world/placement.js';
import { makeSiting } from './world/siting.js';
import { makeSwampWater } from './world/swamp-water.js';
import { makeTerrain } from './world/terrain.js';
import { makeWater } from './world/water.js';

const STAGES=[
  makeTerrain,     // plan, noise, trail, rim, places, base relief
  makeCavern,      // rooms cut in rock; solid and covered ground
  makeDunes,       // oasis and dune field; relief every world reads
  makeSwampWater,  // karst chain, reaches, wallows
  makeWater,       // lake field, compiled wet places, hydrology, traversal
  makeSiting,      // cabins, portals, steading, keep-out, arrival
  makeLifeField,   // life sites, patches, plans
  makePlacement,   // affordance and the prop list of a chunk
  makeGround,      // ground surface, tone and slope of a chunk
  makeChunkBake,   // water mask and the frame both passes share
];

function makeWorldGen(seed,opt){
  const w={seed,opt};
  for(const stage of STAGES) Object.assign(w,stage(w));
  /* Height of a standing body above the ground plane, in drawn rows. Compiled
     places declare raised surfaces; the draw list asks the world, so scene.js
     keeps no branch per landmark. */
  const standLift=(x,y)=>w.SWAMP_LAKEHOUSE?w.SWAMP_LAKEHOUSE.standLift(x,y):0;
  return {
    seed,biome:w.BIOME,plan:w.PLAN,lat:w.PLAN.lat,TH:w.TH,WORLD_R:w.WORLD_R,
    bakeChunk:w.bakeChunk,host:w.host,
    pathX:w.pathX,pathSlope:w.pathSlope,pathDist:w.pathDist,
    elevAt:w.elevAt,lakeAt:w.lakeAt,isWater:w.isWater,
    hydrologyAt:w.hydrologyAt,traversalAt:w.traversalAt,standLift,
    POI:w.POI,poiAt:w.poiAt,poiKind:w.poiKind,rimAt:w.rimAt,beyondRim:w.beyondRim,
    portals:w.POI.filter(p=>p.kind==='portal'),
    BUILDINGS:w.BUILDINGS,buildingDoor:w.buildingDoor,arrivalPoint:w.arrivalPoint,
    STEADING:w.STEADING,steadingDropped:w.STEADING_DROPPED,keepOutAt:w.keepOutAt,
    BASIN:w.BASIN,meadowBasins:w.meadowBasins,
    pondCourt:w.POND_COURT,swampSettlement:w.SWAMP_SETTLEMENT,
    swampLakehouse:w.SWAMP_LAKEHOUSE,
    alligatorHoles:w.ALLIGATOR_HOLES,swampChain:w.swampChain,
    duneAt:w.duneAt,duneEnvelope:w.duneEnvelope,oasis:w.OASIS,dune:w.dune,
    cavern:w.CAVERN,caveSet:w.caveSet,
    entityAffordance:w.entityAffordance,
    lifePatchId:w.lifePatchId,lifeSiteId:w.lifeSiteId,
    lifePatchAt:w.lifePatchAt,lifeSiteAt:w.lifeSiteAt,
    profileSuitability:w.profileSuitability,occupancyInput:w.occupancyInput,
    resourceWebAt:w.resourceWebAt,encounterAt:w.encounterAt,
    compileLifePlans:w.compileLifePlans,
  };
}

export {
  BIOMES, HABITAT, LAYERS, LIFE_PATCH_SIZE, LIFE_SITE_SIZE, TIERS,
  makeWorldGen, textureChunk,
};
