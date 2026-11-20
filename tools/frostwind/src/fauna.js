import { CAST, castStates, gaitCyclePx, heightPx,
         stepPx } from './people.js';
import { DEER_CLIPS, DEER_SLIP, DEER_SPEED, DEER_STATES, DEER_TRAVEL_PX,
         deerPose } from './body-deer.js';
import { CAMEL_CLIPS, CAMEL_SLIP, CAMEL_SPEED, CAMEL_STATES,
         CAMEL_TRAVEL_PX, camelPose } from './body-camel.js';
import { WOLF_CLIPS, WOLF_SLIP, WOLF_SPEED, WOLF_STATES,
         WOLF_TRAVEL_PX, wolfPose } from './body-wolf.js';
import { MACHINE, machineModel } from './machine.js';
import { GUEST_COMPANION, GUEST_GAIT, GUEST_SPEED, GUEST_STATES } from './shadeguest.js';
import { STORK_COMPANION, STORK_GAIT, STORK_SPEED, STORK_STATES } from './stork.js';
import { HARE_GAIT, HARE_SPEED, HARE_STATES } from './hare.js';
import { SKIMMER_GAIT, SKIMMER_SPEED, SKIMMER_STATES } from './skimmer.js';
import { SNAIL_GAIT, SNAIL_SPEED, SNAIL_STATES } from './lampsnail.js';
import { OLM_GAIT, OLM_SPEED, OLM_STATES } from './olm.js';
import { LANTERN_GAIT, LANTERN_SPEED, LANTERN_STATES } from './driftlantern.js';
import { clamp } from './math.js';

/* Raster expression and nearby locomotion compatibility. Life/culture data,
   habitat, sociality, fear, schedules, identity and counts live elsewhere. */

/* Print spacing is one law. Ground covered per gait cycle is `TRAVEL_PX *
   SLIP` (the clip rate cancels out of speed x cycle time), and the convention
   is one print per half cycle, so the spacing is that over two. Deer:
   10 x 2.40 / 2 = 12.00. A typed 11 is 35% short of the wolf trot's 16.80,
   and the camel's typed stride is 17% short.
   Machines hold the same law as `stride:4*B.speed/row.frameRate`
   (test/machine.test.mjs). */
const strideOf = (travelPx, slip) => travelPx * slip / 2;

/* The atlas key. The state rides in the kind, so the key builder in atlas.js
   and the rects{} lookup in scene.js keep their shape. */
const stateKey = (key, state) => (state === 'walk' ? key : key + '@' + state);

const PRINT={
  boot:{rx:1.75,ry:1.15,deep:0.26,lip:0.86,hard:0.85,soft:0.70},
  hoof:{rx:1.05,ry:0.80,deep:0.14,lip:0.78,hard:0.90,soft:0.35},
  camelPad:{rx:1.80,ry:1.10,deep:0.10,lip:0.70,hard:0.40,soft:0.88},
  paw :{rx:0.85,ry:0.70,deep:0.40,lip:0.92,hard:0.55,soft:0.80},
};

function townActor(key,speed,turnRate,prepareFor=0.22){
  const cast=CAST[key];
  return {
    key,ramp:cast.ramp,...(cast.ramp2?{ramp2:cast.ramp2}:{}),
    sMin:cast.sMin,sMax:cast.sMax,
    speed,runSpeed:speed,turnRate,arrive:6,
    track:PRINT.boot,foot:1.7,faceLock:0.30,figure:true,prepareFor,
  };
}

function machinePrint(row){
  const M=machineModel(row),footPx=row.footR*M.hPx;
  const load=clamp((M.pressureKPa-20)/60,0,1);
  return {
    rx:Math.max(1.6,footPx),ry:Math.max(1.1,footPx*0.58),
    deep:0.30-load*0.22,lip:0.78+load*0.17,
    hard:0.76+load*0.20,soft:0.42+load*0.42,
    pressureKPa:M.pressureKPa,
  };
}

const ACTOR={
  boar:{
    key:'boar',ramp:'trunk',sMin:0.05,sMax:0.62,
    speed:26,runSpeed:64,turnRate:1.1,arrive:9,
    stride:9,track:PRINT.hoof,gait:5.0,foot:1.6,faceLock:0.30,
    moveState:'walk',restState:'idle',
  },
  roeDeer:{
    key:'roeDeer',ramp:'trunk',sMin:0.05,sMax:0.76,
    speed:DEER_SPEED.walk,runSpeed:DEER_SPEED.gallop,turnRate:1.6,arrive:10,
    stride:strideOf(DEER_TRAVEL_PX.walk,DEER_SLIP),track:PRINT.hoof,foot:1.2,faceLock:0.28,
    gait:DEER_CLIPS.walk.rate,runGait:DEER_CLIPS.gallop.rate,
    /* `clips` is the species clip table itself, not a copy: a rigged animal
       has states the engine never selects by speed. `states` stays because
       render.js reads frame counts. */
    states:DEER_STATES,clips:DEER_CLIPS,idleRate:DEER_CLIPS.idle.rate,
    pose:deerPose,
    moveState:'walk',restState:'idle',fleeState:'gallop',
  },
  /* Travel is the trot and the response is the sprint, so `gait` and `runGait`
     read two clips. The canter is reached by expression, not by speed: a
     threshold needs the Froude row CANON lists as available. */
  wolf:{
    key:'wolf',ramp:'trunk',sMin:0.05,sMax:0.78,
    speed:WOLF_SPEED.trot,runSpeed:WOLF_SPEED.sprint,turnRate:1.5,arrive:11,
    stride:strideOf(WOLF_TRAVEL_PX.trot,WOLF_SLIP),track:PRINT.paw,foot:1.3,faceLock:0.26,
    gait:WOLF_CLIPS.trot.rate,runGait:WOLF_CLIPS.sprint.rate,
    states:WOLF_STATES,clips:WOLF_CLIPS,idleRate:WOLF_CLIPS.idle.rate,
    pose:wolfPose,
    moveState:'trot',restState:'idle',fleeState:'sprint',
  },
  elder:townActor('elder',15,0.9,0.24),
  merchant:{...townActor('merchant',26,1.8,0.24),foot:1.8},
  woodcutter:townActor('woodcutter',30,1.6,0.20),
  /* townActor reads ramp and window off the cast row, so the figure and the
     actor cannot disagree. */
  wayfarer:townActor('wayfarer',25,1.40,0.22),
  graveWatcher:townActor('graveWatcher',17,0.95,0.26),
  fruitBearer:townActor('fruitBearer',23,1.45),
  headphones:townActor('headphones',27,1.75,0.18),
  thickDude:townActor('thickDude',20,1.10,0.25),
  bookDude:townActor('bookDude',22,1.30,0.24),
  axeman:townActor('axeman',28,1.45,0.20),
  leader:townActor('leader',25,1.25,0.22),
  featherHat:townActor('featherHat',26,1.55,0.20),
  spearGuard:townActor('spearGuard',24,1.30,0.22),
  bearKid:townActor('bearKid',30,2.00,0.16),
  meadowGrower:townActor('meadowGrower',26,1.50,0.22),
  meadowTender:townActor('meadowTender',24,1.35,0.24),
  meadowWeaver:townActor('meadowWeaver',21,1.15,0.26),
  camel:{
    key:'camel',ramp:'camelCoat',ramp2:'sand',sMin:0.10,sMax:0.86,
    /* A camel does not trot. `runSpeed` is a faster pace: travel and flee are
       one footfall pattern at two cadences. */
    speed:CAMEL_SPEED.walk,runSpeed:CAMEL_SPEED.pace,turnRate:0.75,arrive:14,
    stride:strideOf(CAMEL_TRAVEL_PX.walk,CAMEL_SLIP),
    track:PRINT.camelPad,foot:2.4,faceLock:0.26,riderKey:'camelRider',
    gait:CAMEL_CLIPS.walk.rate,runGait:CAMEL_CLIPS.pace.rate,
    states:CAMEL_STATES,clips:CAMEL_CLIPS,idleRate:CAMEL_CLIPS.idle.rate,
    pose:camelPose,
    moveState:'walk',restState:'idle',fleeState:'pace',
    /* The largest solid body in the project: a 1.63 m trunk. */
    solidRadius:15,
  },
  /* Amber Waste. The gardener works a small holding. The drover crosses open
     ground all day, so his reach and speed are larger. */
  desertGardener:{...townActor('desertGardener',20,1.30,0.26),foot:1.7,arrive:5},
  desertDrover:{...townActor('desertDrover',25,1.15,0.22),foot:1.9,arrive:7},
  /* The digger is quick and turns short; the keeper carries a staff and an
     office and does neither. */
  desertDigger:{...townActor('desertDigger',27,1.60,0.20),foot:1.7,arrive:5},
  desertKeeper:{...townActor('desertKeeper',19,1.05,0.28),foot:1.8,arrive:6},
  swampFisher:{...townActor('swampFisher',22,1.35,0.24),foot:1.8,arrive:5},
  swampBoatwright:{...townActor('swampBoatwright',24,1.45,0.22),foot:1.8,arrive:5},
  /* The lakekeeper borrows the fisher's key: he has no drawn identity of his
     own. `swampWood` is the darkest ramp in the palette and his house is made
     of it, so a keeper in the fishers' cloth is a dark figure on a dark wall.
     The linen ramp is a per-instance override that reaches the GPU without a
     cast row. He keeps the ochre brim every swamp person wears. */
  swampLakekeeper:{...townActor('swampFisher',20,1.30,0.26),
    key:'swampFisher',foot:1.8,arrive:5},
  /* The Hollow's earth folk. An 18 px body steps 7 px: the traveller's
     cadence is a slower walk. The lamp wright covers the most ground; the
     cutter stands at a bench. */
  hollowTender:{...townActor('hollowTender',18,1.50,0.24),foot:1.4,arrive:5},
  hollowLamplighter:{...townActor('hollowLamplighter',21,1.40,0.22),foot:1.4,arrive:5},
  hollowCutter:{...townActor('hollowCutter',16,1.30,0.26),foot:1.4,arrive:5},
  hollowKeeper:{...townActor('hollowKeeper',19,1.20,0.24),foot:1.4,arrive:5},
  squirrel:{
    key:'squirrel',ramp:'warm',sMin:0.18,sMax:0.90,
    speed:52,runSpeed:120,turnRate:2.6,arrive:5,
    stride:5,track:PRINT.paw,gait:11.0,faceLock:0.30,
    moveState:'walk',restState:'idle',
  },
  alligator:{
    key:'alligator',ramp:'swampWood',sMin:0.02,sMax:0.72,
    speed:18,runSpeed:34,turnRate:0.72,arrive:12,
    stride:1e9,track:PRINT.paw,gait:3.2,faceLock:0.24,solidRadius:12,
    states:{swim:4,float:1,submerge:2,bask:1,crawl:4},
    moveState:'swim',restState:'float',responseState:'submerge',
    stateByMedium:{dry:'bask',shallow:'float',deep:'float'},
    moveByMedium:{dry:'crawl',shallow:'swim',deep:'swim'},
  },
  heron:{
    key:'heron',ramp:'swampCanopy',sMin:0.10,sMax:0.92,
    speed:16,runSpeed:36,turnRate:1.4,arrive:6,
    stride:14,track:PRINT.paw,gait:3.4,faceLock:0.28,
    states:{wade:4,still:1},moveState:'wade',restState:'still',
  },
  /* Desert. All three take the trunk ramp (src/animal.js): a sand-coloured
     silhouette on sand is no silhouette. */
  fennec:{
    key:'fennec',ramp:'trunk',ramp2:'sand',sMin:0.12,sMax:0.84,
    /* a 1.5 kg canid: short bursts, tight turns */
    speed:26,runSpeed:58,turnRate:2.2,arrive:5,
    stride:9,track:PRINT.paw,gait:4.2,runGait:6.4,faceLock:0.30,
    states:{trot:4,still:1},moveState:'trot',restState:'still',fleeState:'trot',
  },
  sandgrouse:{
    key:'sandgrouse',ramp:'trunk',ramp2:'sand',sMin:0.14,sMax:0.88,
    /* it shuffles at the water; flight is not drawn */
    speed:9,runSpeed:15,turnRate:1.6,arrive:4,
    stride:5,track:PRINT.paw,gait:5.0,faceLock:0.26,
    states:{shuffle:4,still:1},moveState:'shuffle',restState:'still',
  },
  viper:{
    key:'viper',ramp:'trunk',ramp2:'sand',sMin:0.10,sMax:0.70,
    /* `buried` is the rest state. `stride` is enormous for the alligator's
       reason: this gait has no footfall. */
    speed:20,runSpeed:32,turnRate:1.1,arrive:6,
    stride:1e9,track:PRINT.paw,gait:3.6,faceLock:0.20,
    states:{sidewind:4,buried:1},moveState:'sidewind',restState:'buried',
    responseState:'buried',
  },
  /* src/shadeguest.js owns every number here. The body is the accent ramp
     (material 6) and its limbs folkDark, so `ramp` is unread. Eight feet
     leave no readable print at this scale: the stride is the alligator's. */
  shadeguest:{
    key:'shadeguest',ramp:'trunk',sMin:0.05,sMax:0.95,
    speed:GUEST_SPEED.scuttle,runSpeed:GUEST_SPEED.dash,turnRate:3.0,arrive:5,
    stride:1e9,track:PRINT.paw,gait:GUEST_GAIT.scuttle,runGait:GUEST_GAIT.dash,
    faceLock:0.22,states:GUEST_STATES,
    moveState:'scuttle',restState:'still',fleeState:'scuttle',
    companion:GUEST_COMPANION,poi:true,
  },
  /* Sun Meadow. src/stork.js and src/hare.js own every number. The stork's
     body is `loam`, the palest ramp the meadow declares; its bill and legs
     are the accent (material 6), so it sets no ramp2. */
  stork:{
    key:'stork',ramp:'loam',sMin:0.30,sMax:1.00,
    speed:STORK_SPEED.stalk,runSpeed:STORK_SPEED.stride,turnRate:1.2,arrive:8,
    stride:1e9,track:PRINT.paw,gait:STORK_GAIT.stalk,runGait:STORK_GAIT.stride,
    faceLock:0.26,states:STORK_STATES,
    moveState:'stalk',restState:'stand',fleeState:'stalk',
    companion:STORK_COMPANION,poi:true,
  },
  hare:{
    key:'hare',ramp:'timber',ramp2:'loam',sMin:0.20,sMax:0.95,
    speed:HARE_SPEED.lope,runSpeed:HARE_SPEED.dash,turnRate:2.8,arrive:6,
    stride:1e9,track:PRINT.paw,gait:HARE_GAIT.lope,runGait:HARE_GAIT.dash,
    faceLock:0.30,states:HARE_STATES,
    moveState:'lope',restState:'form',fleeState:'lope',
  },
  /* Green Swamp, the two fictional bodies. src/skimmer.js: the body is the
     trunk ramp (material 4), and `birch` is the glint at each foot.
     src/lampsnail.js: a `warm` shell on a `birch` foot. */
  skimmer:{
    key:'skimmer',ramp:'birch',sMin:0.20,sMax:1.00,
    speed:SKIMMER_SPEED.cruise,runSpeed:SKIMMER_SPEED.burst,turnRate:2.4,arrive:8,
    stride:1e9,track:PRINT.paw,gait:SKIMMER_GAIT.cruise,runGait:SKIMMER_GAIT.burst,
    faceLock:0.24,states:SKIMMER_STATES,
    moveState:'row',restState:'drift',fleeState:'row',poi:true,
  },
  lampsnail:{
    key:'lampsnail',ramp:'warm',ramp2:'birch',sMin:0.20,sMax:0.95,
    speed:SNAIL_SPEED,runSpeed:SNAIL_SPEED,turnRate:0.4,arrive:2,
    stride:1e9,track:PRINT.paw,gait:SNAIL_GAIT,idleRate:1.6,
    faceLock:0.24,states:SNAIL_STATES,
    moveState:'glide',restState:'rest',fleeState:'glide',poi:true,
  },
  turtle:{
    key:'turtle',ramp:'swampWood',sMin:0.08,sMax:0.76,
    speed:7,runSpeed:12,turnRate:0.8,arrive:4,
    stride:22,track:PRINT.paw,gait:2.0,faceLock:0.22,
    states:{crawl:4,bask:1,float:1},moveState:'crawl',restState:'bask',
    stateByMedium:{dry:'bask',shallow:'float',deep:'float'},
    moveByMedium:{dry:'crawl',shallow:'crawl',deep:'crawl'},
  },
  /* Amethyst Hollow. src/olm.js: the body is material 16, the `skin` ramp,
     so `ramp` names it and is unread. It swims, so it leaves no print. */
  olm:{
    key:'olm',ramp:'skin',sMin:0.20,sMax:1.00,
    speed:OLM_SPEED.cruise,runSpeed:OLM_SPEED.burst,turnRate:2.0,arrive:4,
    stride:1e9,track:PRINT.paw,gait:OLM_GAIT.cruise,runGait:OLM_GAIT.burst,
    faceLock:0.24,states:OLM_STATES,
    moveState:'swim',restState:'rest',fleeState:'swim',
  },
  /* src/driftlantern.js: threads on the instance ramp, bell and lamp LUMEN
     on ramp2, one ramp for both. One pace. */
  driftlantern:{
    key:'driftlantern',ramp:'glowcap',ramp2:'glowcap',sMin:0.00,sMax:1.00,
    speed:LANTERN_SPEED,runSpeed:LANTERN_SPEED,turnRate:0.6,arrive:6,
    stride:1e9,track:PRINT.paw,gait:LANTERN_GAIT,idleRate:LANTERN_GAIT,
    faceLock:0.24,states:LANTERN_STATES,
    moveState:'drift',restState:'moor',fleeState:'drift',poi:true,
  },
  /* src/carbuncle.js: the brown hare's body and numbers, a `geodeRock` coat,
     and the brow stone as LUMEN on `amethyst`. */
  carbuncle:{
    key:'carbuncle',ramp:'geodeRock',ramp2:'amethyst',sMin:0.20,sMax:1.00,
    speed:HARE_SPEED.lope,runSpeed:HARE_SPEED.dash,turnRate:2.8,arrive:6,
    stride:1e9,track:PRINT.paw,gait:HARE_GAIT.lope,runGait:HARE_GAIT.dash,
    faceLock:0.30,states:HARE_STATES,
    moveState:'lope',restState:'form',fleeState:'lope',poi:true,
  },
};
/* The earth folk's herd: the roe deer's rig and numbers. src/figure-deer.js
   paints the coat as material 16, so `ramp` names `skin` and is unread, and
   the crystal rack as LUMEN on `amethyst`. */
ACTOR.paleDeer={...ACTOR.roeDeer,key:'paleDeer',ramp:'skin',ramp2:'amethyst'};

/* A figure row takes frame counts, stride and cadence from the cast table.
   Stride spaces the boot prints and derives from the row's own height
   (STEP_OF_STATURE in body-folk.js). Gait rate is frames per second at the
   row's own walking speed. */
const CAST_BY_ACTOR=Object.fromEntries(
  Object.values(CAST).map((row)=>[row.key,row]),
);
for(const row of Object.values(ACTOR)){
  if(!row.figure)continue;
  const cast=CAST_BY_ACTOR[row.key];
  const hPx=heightPx(cast);
  row.states=castStates(cast);
  row.stride=stepPx(hPx);
  row.gait=row.states.walk*row.speed/gaitCyclePx(hPx,'walk');
  row.runGait=row.states.run
    ?row.states.run*row.runSpeed/gaitCyclePx(hPx,'run')
    :row.gait;
  row.idleRate=1.15;
  /* another person is something the traveller notices on approach */
  row.poi=true;
}

for(const name of Object.keys(MACHINE)){
  const row=MACHINE[name],M=machineModel(row),B=row.behavior;
  const track=machinePrint(row);
  PRINT[name]=track;
  ACTOR[name]={
    key:name,ramp:'masonry',ramp2:'canopy',
    dMin:0.00,dMax:row.moss.rampMax,vol:0,sMin:0.04,sMax:0.98,
    speed:B.speed,runSpeed:B.speed,turnRate:B.turnRate,arrive:B.arrive,
    stride:4*B.speed/row.frameRate,track,gait:row.frameRate,
    foot:row.stance*M.hPx,faceLock:B.faceLock,
    states:row.frames,idleRate:row.idleRate,
    solidRadius:Math.max(4,Math.round(row.body.w*M.hPx*0.28)),
    machine:true,massKg:M.massKg,pressureKPa:M.pressureKPa,
    moveState:'walk',restState:'idle',
    /* a dream machine is the other thing a head turns for */
    poi:true,
  };
}

export { ACTOR, PRINT, machinePrint, stateKey };
