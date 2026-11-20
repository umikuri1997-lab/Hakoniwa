import { PROVENANCE } from './life.js';
import { keyedInt } from './rng.js';

/* Authored fiction. Nature constrains a culture package, never selects its
   meanings. Kept separate from life/morphology data. */
const RELATIONSHIP_TYPES=Object.freeze([
  'household-member','work-obligation','recognizes','mutual-repair',
  'trade-obligation','host-guest',
]);

const USE_NODE_KINDS=Object.freeze([
  'hearth','seat','storage','threshold','stall','woodlot','splitting-block',
  'fuel-stack','fish-trap','drying-rack','mooring','punt','winch','boardwalk',
  'water-mark','gathering','route-marker','bask-site','refuge',
  /* Meadow steading. `drying-rack` is reused: a hay rack and a fish rack are
     one object. */
  'well','sward',
  /* Amber Waste. `shadow-stick`: the gnomon a water share is measured against.
     `pen`: a ring of thorn brush. `salt-pan`: the crust the drovers cut trade
     salt from. `well` and `drying-rack` are reused. */
  'shadow-stick','pen','salt-pan',
  /* Amethyst Hollow. `fairy-ring`: ring of caps round the Heart, a field and
     a lamp. `lamp-post`, `cutting-bench`: the village's two made things.
     `well`, `pen`, `storage` and `gathering` are reused. */
  'fairy-ring','lamp-post','cutting-bench',
]);

/* The earth folk's doors, in house order (BIOMES.hollow.slots). */
const HOLLOW_HOMES=Object.freeze([
  'hollow-tender','hollow-lamplighter','hollow-cutter','hollow-keeper',
]);

/* Home ids in resident order. A resident anchors on the first use node whose
   id starts with their home, so a shared home id is a shared spawn pixel. */
const MEADOW_HOMES=Object.freeze([
  'steading-grower','steading-tender','steading-weaver',
]);

const TOWNFOLK_IDS=Object.freeze([
  'graveWatcher','fruitBearer','headphones','thickDude','bookDude','axeman',
  'leader','featherHat','spearGuard','bearKid',
]);

const PRACTICES=Object.freeze({
  'hearth-keeping':Object.freeze({
    meaning:'Keep heat, food and household continuity visible.',
    actions:['tend-hearth','inspect-storage','sit'],provenance:PROVENANCE.authored,
  }),
  'travelling-market':Object.freeze({
    meaning:'Make arrival and departure legible through one persistent load.',
    actions:['unpack','display','attend-stall','repack'],provenance:PROVENANCE.authored,
  }),
  'winter-fuel':Object.freeze({
    meaning:'Convert a managed woodlot into a visible household fuel reserve.',
    actions:['inspect-woodlot','split-fuel','stack-fuel'],provenance:PROVENANCE.authored,
  }),
  'water-as-road':Object.freeze({
    meaning:'Treat mooring, punt and boardwalk as one circulation practice.',
    actions:['check-mooring','pole-punt','travel'],provenance:PROVENANCE.authored,
  }),
  'mutual-repair':Object.freeze({
    meaning:'Fisher and boatwright owe repair work to shared wet infrastructure.',
    actions:['inspect-trap','inspect-winch','repair-boardwalk','check-mooring'],
    provenance:PROVENANCE.authored,
  }),
  'flood-memory':Object.freeze({
    meaning:'Keep high-water marks and repair state as public material memory.',
    actions:['record-water-mark','repair-boardwalk'],provenance:PROVENANCE.authored,
  }),
  /* An open sward closes to scrub inside a decade unless it is cut every
     year. */
  'sward-round':Object.freeze({
    meaning:'Keep the open sward open by cutting and drying it each year.',
    actions:['cut-sward','turn-hay','tend-rack'],provenance:PROVENANCE.authored,
  }),
  'water-share':Object.freeze({
    meaning:'One pump serves the whole steading, so keeping it drawing is common work.',
    actions:['draw-water','inspect-storage','travel'],provenance:PROVENANCE.authored,
  }),
  /* Shade is the meadow's boreal hearth. */
  'pavilion-shade':Object.freeze({
    meaning:'Give the hottest hours to the shade, and do the seated work there.',
    actions:['work-cloth','sit','observe'],provenance:PROVENANCE.authored,
  }),
  /* Amber Waste. Two ways of living off one pool: the gardeners cannot move
     and the drovers cannot stay. */
  'timed-water':Object.freeze({
    /* A real practice: a shared channel is allotted in turns of shadow-lengths
       read off a stick. Only the sun is there to meter the flow. */
    meaning:'A share of the water is a length of time, and the shadow says when.',
    actions:['draw-water','observe','rest'],provenance:PROVENANCE.authored,
  }),
  'palm-inheritance':Object.freeze({
    meaning:'The palm was planted by somebody else and will be picked by somebody else.',
    actions:['tend-rack','sit','observe'],provenance:PROVENANCE.authored,
  }),
  /* A real practice (foggara, qanat): a gently graded tunnel carries sweet
     groundwater to the gardens before it reaches the evaporite ring, and a
     line of shafts lets its diggers in. Silt closes it unless it is walked
     and cleared every year. */
  'gallery-keeping':Object.freeze({
    meaning:'The sweet water comes by a dug road under the ground, and somebody walks it.',
    actions:['draw-water','observe','travel'],provenance:PROVENANCE.authored,
  }),
  'remembered-road':Object.freeze({
    /* The surface moves, so a cairn stands only on the pavement. */
    meaning:'The road is remembered, not marked, and the cairn is where the ground allows.',
    actions:['travel','observe','rest'],provenance:PROVENANCE.authored,
  }),
  'salt-for-dates':Object.freeze({
    meaning:'Cut salt where the water left it, and trade it where the water stayed.',
    actions:['attend-stall','display','travel'],provenance:PROVENANCE.authored,
  }),
  /* Amethyst Hollow: every practice keeps a light or what a light grows. */
  'ring-tending':Object.freeze({
    meaning:'The ring is the field and the lamp: walk it, water it, take only the ripe.',
    actions:['observe','draw-water','inspect-storage'],provenance:PROVENANCE.authored,
  }),
  'lamp-round':Object.freeze({
    meaning:'A lit post says the road is kept, so somebody walks the posts.',
    actions:['observe','travel','sit'],provenance:PROVENANCE.authored,
  }),
  'stone-cutting':Object.freeze({
    meaning:'A crystal is cut where it fell, and a lamp is a crystal with a face on it.',
    actions:['observe','resume-project','display'],provenance:PROVENANCE.authored,
  }),
  'pale-herd':Object.freeze({
    meaning:'The herd grazes where no sun reaches, and somebody counts it home.',
    actions:['observe','draw-water','travel'],provenance:PROVENANCE.authored,
  }),
});

const PROJECTS=Object.freeze({
  'elder-winter-order':project('Keep the winter household ordered',
    ['check-stores','settle-hearth','mend-threshold']),
  'merchant-market-day':project('Make one complete market visit',
    ['unpack-load','arrange-display','attend-exchange','repack-load']),
  'woodcutter-fuel-reserve':project('Build the visible fuel reserve',
    ['inspect-woodlot','split-billets','stack-billets']),
  'fisher-trap-round':project('Complete and record the trap round',
    ['inspect-traps','tend-rack','secure-punt']),
  'boatwright-flood-readiness':project('Keep the settlement ready for high water',
    ['inspect-winch','repair-walk','check-moorings','record-water']),
  'lakekeeper-datum-round':project('Keep one stable datum the mosaic is read against',
    ['read-gauge','keep-watch','carry-reading']),
  'grower-hay-round':project('Take one cut off the sward and get it dry',
    ['cut-sward','turn-hay','rack-hay']),
  'tender-water-round':project('Keep the steading in water for the day',
    ['draw-water','check-stores','carry-water']),
  'gardener-water-turn':project('Take the turn of water the shadow allots',
    ['read-shadow','open-channel','close-channel']),
  'drover-salt-run':project('Cut a load of salt and get it to the pool',
    ['cut-salt','load-out','trade-in']),
  'digger-gallery-round':project('Walk the gallery and clear a year of silt',
    ['test-air','clear-silt','carry-spoil']),
  'keeper-turn-count':project('Count every household its turn of the water',
    ['plant-staff','read-shadow','call-turn']),
  'weaver-cloth-day':project('Finish one length under the pavilion',
    ['set-warp','work-cloth','strike-loom']),
  'tender-ring-round':project('Bring one ring of caps to ripeness',
    ['walk-ring','carry-water','store-caps']),
  'lamplighter-post-round':project('Keep every lamp in the hall lit for one round',
    ['take-light','walk-posts','trim-lamps']),
  'cutter-lamp-stone':project('Cut one amethyst into a lamp',
    ['choose-stone','cut-facets','set-out']),
  'keeper-herd-count':project('Bring the herd to water and count it home',
    ['count-herd','water-herd','pen-herd']),
});

const PROJECT_ACTIONS=Object.freeze({
  'gardener-water-turn':Object.freeze({
    'read-shadow':'observe','open-channel':'draw-water','close-channel':'rest',
  }),
  'drover-salt-run':Object.freeze({
    'cut-salt':'display','load-out':'attend-stall','trade-in':'travel',
  }),
  'digger-gallery-round':Object.freeze({
    'test-air':'observe','clear-silt':'draw-water','carry-spoil':'travel',
  }),
  'keeper-turn-count':Object.freeze({
    'plant-staff':'travel','read-shadow':'observe','call-turn':'attend-stall',
  }),
  'elder-winter-order':Object.freeze({
    'check-stores':'inspect-storage','settle-hearth':'tend-hearth',
    'mend-threshold':'resume-project',
  }),
  'merchant-market-day':Object.freeze({
    'unpack-load':'unpack','arrange-display':'display',
    'attend-exchange':'attend-stall','repack-load':'repack',
  }),
  'woodcutter-fuel-reserve':Object.freeze({
    'inspect-woodlot':'inspect-woodlot','split-billets':'split-fuel',
    'stack-billets':'stack-fuel',
  }),
  'fisher-trap-round':Object.freeze({
    'inspect-traps':'inspect-trap','tend-rack':'tend-rack','secure-punt':'check-mooring',
  }),
  'boatwright-flood-readiness':Object.freeze({
    'inspect-winch':'inspect-winch','repair-walk':'repair-boardwalk',
    'check-moorings':'check-mooring','record-water':'record-water-mark',
  }),
  'lakekeeper-datum-round':Object.freeze({
    'read-gauge':'record-water-mark','keep-watch':'sit',
    'carry-reading':'travel',
  }),
  'grower-hay-round':Object.freeze({
    'cut-sward':'cut-sward','turn-hay':'turn-hay','rack-hay':'tend-rack',
  }),
  'tender-water-round':Object.freeze({
    'draw-water':'draw-water','check-stores':'inspect-storage',
    'carry-water':'travel',
  }),
  'weaver-cloth-day':Object.freeze({
    'set-warp':'work-cloth','work-cloth':'work-cloth','strike-loom':'resume-project',
  }),
  'tender-ring-round':Object.freeze({
    'walk-ring':'observe','carry-water':'draw-water','store-caps':'inspect-storage',
  }),
  'lamplighter-post-round':Object.freeze({
    'take-light':'observe','walk-posts':'travel','trim-lamps':'observe',
  }),
  'cutter-lamp-stone':Object.freeze({
    'choose-stone':'observe','cut-facets':'resume-project','set-out':'display',
  }),
  'keeper-herd-count':Object.freeze({
    'count-herd':'observe','water-herd':'draw-water','pen-herd':'travel',
  }),
});

const ACTION_EVIDENCE=Object.freeze({
  'tend-hearth':'used-hearth','inspect-storage':'store-order',
  unpack:'unpacked-load',display:'stall-arrangement','attend-stall':'attended-stall',
  repack:'packed-load','inspect-woodlot':'woodlot-mark','split-fuel':'split-billets',
  'stack-fuel':'fuel-stack','inspect-trap':'trap-state','tend-rack':'rack-state',
  'check-mooring':'mooring-state','inspect-winch':'winch-state',
  'repair-boardwalk':'repair-state','record-water-mark':'water-mark',
  'cut-sward':'sward-cut','turn-hay':'hay-row','draw-water':'water-drawn',
  'work-cloth':'cloth-length',
});

function project(aspiration,milestones){
  return Object.freeze({aspiration,milestones:Object.freeze(milestones),
    provenance:PROVENANCE.authored});
}

function projectAction(projectId,index){
  const milestone=PROJECTS[projectId]?.milestones[index];
  return milestone?PROJECT_ACTIONS[projectId]?.[milestone]||null:null;
}

function projectMilestoneForAction(projectId,index,action){
  const milestone=PROJECTS[projectId]?.milestones[index];
  return milestone&&PROJECT_ACTIONS[projectId]?.[milestone]===action?milestone:null;
}

const RESIDENTS=Object.freeze({
  elder:resident('elder','boreal-elder','elder-home',
    ['hearth-keeping'],'elder-winter-order',[
      [360,510,'tend-hearth','hearth'],[510,720,'inspect-storage','storage'],
      [720,960,'sit','seat'],[960,1140,'resume-project','threshold'],
      [1140,1440,'tend-hearth','hearth'],[0,360,'sit','seat'],
    ]),
  merchant:resident('merchant','boreal-merchant','village-common',
    ['travelling-market'],'merchant-market-day',[
      [360,480,'travel','threshold'],[480,570,'unpack','stall'],
      [570,1020,'attend-stall','stall'],[1020,1110,'repack','stall'],
      [1110,1440,'travel','threshold'],[0,360,'rest','threshold'],
    ]),
  woodcutter:resident('woodcutter','boreal-woodcutter','boreal-woodlot',
    ['winter-fuel'],'woodcutter-fuel-reserve',[
      [360,480,'travel','woodlot'],[480,720,'inspect-woodlot','woodlot'],
      [720,960,'split-fuel','splitting-block'],[960,1110,'stack-fuel','fuel-stack'],
      [1110,1440,'travel','threshold'],[0,360,'rest','threshold'],
    ]),
  graveWatcher:resident('graveWatcher','boreal-townfolk','townfolk-graveWatcher',
    ['hearth-keeping'],'elder-winter-order',[
      [330,510,'travel','route-marker'],[510,690,'observe','gathering'],
      [690,870,'travel','threshold'],[870,1080,'sit','seat'],
      [1080,1260,'inspect-storage','storage'],[1260,1440,'travel','route-marker'],
      [0,330,'rest','threshold'],
    ]),
  fruitBearer:resident('fruitBearer','boreal-townfolk','townfolk-fruitBearer',
    ['travelling-market'],'merchant-market-day',[
      [360,495,'travel','route-marker'],[495,690,'attend-stall','stall'],
      [690,840,'travel','gathering'],[840,1050,'display','stall'],
      [1050,1230,'travel','threshold'],[1230,1440,'repack','stall'],
      [0,360,'rest','threshold'],
    ]),
  headphones:resident('headphones','boreal-townfolk','townfolk-headphones',
    ['travelling-market'],'merchant-market-day',[
      [390,540,'travel','route-marker'],[540,720,'observe','gathering'],
      [720,885,'travel','threshold'],[885,1065,'sit','seat'],
      [1065,1245,'attend-stall','stall'],[1245,1440,'travel','route-marker'],
      [0,390,'rest','seat'],
    ]),
  thickDude:resident('thickDude','boreal-townfolk','townfolk-thickDude',
    ['winter-fuel'],'woodcutter-fuel-reserve',[
      [345,510,'travel','woodlot'],[510,690,'inspect-woodlot','woodlot'],
      [690,855,'travel','gathering'],[855,1050,'stack-fuel','fuel-stack'],
      [1050,1230,'sit','seat'],[1230,1440,'travel','threshold'],
      [0,345,'rest','threshold'],
    ]),
  bookDude:resident('bookDude','boreal-townfolk','townfolk-bookDude',
    ['hearth-keeping'],'elder-winter-order',[
      [375,525,'travel','route-marker'],[525,705,'sit','seat'],
      [705,870,'travel','storage'],[870,1050,'inspect-storage','storage'],
      [1050,1215,'observe','gathering'],[1215,1440,'travel','threshold'],
      [0,375,'rest','seat'],
    ]),
  axeman:resident('axeman','boreal-townfolk','townfolk-axeman',
    ['winter-fuel'],'woodcutter-fuel-reserve',[
      [315,480,'travel','woodlot'],[480,660,'split-fuel','splitting-block'],
      [660,825,'travel','fuel-stack'],[825,1020,'stack-fuel','fuel-stack'],
      [1020,1200,'observe','gathering'],[1200,1440,'travel','threshold'],
      [0,315,'rest','threshold'],
    ]),
  leader:resident('leader','boreal-townfolk','townfolk-leader',
    ['hearth-keeping'],'elder-winter-order',[
      [405,555,'travel','route-marker'],[555,735,'observe','gathering'],
      [735,900,'travel','stall'],[900,1080,'attend-stall','stall'],
      [1080,1260,'sit','seat'],[1260,1440,'travel','threshold'],
      [0,405,'rest','threshold'],
    ]),
  featherHat:resident('featherHat','boreal-townfolk','townfolk-featherHat',
    ['travelling-market'],'merchant-market-day',[
      [350,500,'travel','threshold'],[500,680,'display','stall'],
      [680,850,'travel','route-marker'],[850,1040,'observe','gathering'],
      [1040,1220,'sit','seat'],[1220,1440,'travel','stall'],
      [0,350,'rest','threshold'],
    ]),
  spearGuard:resident('spearGuard','boreal-townfolk','townfolk-spearGuard',
    ['winter-fuel'],'woodcutter-fuel-reserve',[
      [300,465,'travel','route-marker'],[465,645,'observe','threshold'],
      [645,810,'travel','route-marker'],[810,990,'observe','gathering'],
      [990,1170,'travel','woodlot'],[1170,1440,'travel','threshold'],
      [0,300,'rest','threshold'],
    ]),
  /* In by one route marker, the common, out by another. Borrows the market
     practice and project: arrival and departure made legible. */
  wayfarer:resident('wayfarer','boreal-wayfarer','village-common',
    ['travelling-market'],'merchant-market-day',[
      [330,450,'travel','route-marker'],[450,660,'observe','gathering'],
      [660,840,'sit','seat'],[840,1020,'attend-stall','stall'],
      [1020,1200,'observe','gathering'],[1200,1440,'travel','route-marker'],
      [0,330,'rest','seat'],
    ],'seat'),
  bearKid:resident('bearKid','boreal-townfolk','townfolk-bearKid',
    ['hearth-keeping'],'elder-winter-order',[
      [420,570,'travel','gathering'],[570,735,'observe','gathering'],
      [735,885,'travel','route-marker'],[885,1050,'sit','seat'],
      [1050,1200,'travel','stall'],[1200,1440,'travel','threshold'],
      [0,420,'rest','seat'],
    ]),
  desertGardener:resident('desertGardener','desert-gardener','hut-garden',
    ['timed-water','palm-inheritance'],'gardener-water-turn',[
      [270,450,'draw-water','shadow-stick'],[450,630,'tend-rack','drying-rack'],
      [630,900,'rest','threshold'],
      /* midday indoors: the eleven-hour wall in src/desert-hamlet.js */
      [900,1140,'draw-water','well'],[1140,1320,'observe','gathering'],
      [1320,1440,'sit','seat'],[0,270,'rest','threshold'],
    ]),
  desertDrover:resident('desertDrover','desert-drover','tent-camp',
    ['remembered-road','salt-for-dates'],'drover-salt-run',[
      [210,420,'travel','route-marker'],[420,600,'display','salt-pan'],
      [600,870,'rest','threshold'],
      [870,1080,'attend-stall','gathering'],[1080,1260,'observe','pen'],
      [1260,1440,'travel','route-marker'],[0,210,'rest','threshold'],
    ]),
  /* The digger is out of the sun twice: underground early and late, indoors
     at midday. The well is where the gallery surfaces. */
  desertDigger:resident('desertDigger','desert-digger','hut-digger',
    ['gallery-keeping'],'digger-gallery-round',[
      [240,420,'observe','well'],[420,630,'draw-water','well'],
      [630,900,'rest','threshold'],
      [900,1080,'draw-water','well'],[1080,1260,'observe','gathering'],
      [1260,1440,'sit','seat'],[0,240,'rest','threshold'],
    ]),
  /* The keeper stands where the turns are read. He is at the stick for the
     hours either side of noon, when the shadow is shortest and a turn is
     argued over most. */
  desertKeeper:resident('desertKeeper','desert-keeper','hut-keeper',
    ['timed-water'],'keeper-turn-count',[
      [300,480,'travel','shadow-stick'],[480,720,'observe','shadow-stick'],
      [720,840,'attend-stall','gathering'],[840,1080,'observe','shadow-stick'],
      [1080,1260,'sit','seat'],[1260,1440,'rest','threshold'],
      [0,300,'rest','threshold'],
    ]),
  /* The meadow day is split by the sun. The grower takes midday on a seat,
     not at the gathering, so the yard's one common point never holds two of
     the three at one hour. */
  meadowGrower:resident('meadowGrower','meadow-grower','steading-grower',
    ['sward-round'],'grower-hay-round',[
      [300,480,'cut-sward','sward'],[480,660,'turn-hay','sward'],
      [660,900,'sit','seat'],[900,1080,'tend-rack','drying-rack'],
      [1080,1260,'cut-sward','sward'],[1260,1440,'travel','threshold'],
      [0,300,'rest','threshold'],
    ]),
  meadowTender:resident('meadowTender','meadow-tender','steading-tender',
    ['water-share'],'tender-water-round',[
      [330,510,'draw-water','well'],[510,690,'travel','threshold'],
      [690,930,'observe','gathering'],[930,1110,'draw-water','well'],
      [1110,1290,'inspect-storage','storage'],[1290,1440,'travel','threshold'],
      [0,330,'rest','threshold'],
    ]),
  meadowWeaver:resident('meadowWeaver','meadow-weaver','steading-weaver',
    ['pavilion-shade'],'weaver-cloth-day',[
      [360,540,'travel','route-marker'],[540,780,'work-cloth','gathering'],
      [780,1020,'sit','seat'],[1020,1200,'work-cloth','gathering'],
      [1200,1380,'observe','gathering'],[1380,1440,'travel','threshold'],
      [0,360,'rest','threshold'],
    ]),
  swampFisher:resident('swampFisher','swamp-fisher','swamp-landing',
    ['water-as-road','mutual-repair'],'fisher-trap-round',[
      [240,480,'inspect-trap','fish-trap'],[480,720,'tend-rack','drying-rack'],
      [720,960,'pole-punt','punt'],[960,1140,'check-mooring','mooring'],
      [1140,1440,'rest','gathering'],[0,240,'rest','gathering'],
    ],'gathering'),
  swampBoatwright:resident('swampBoatwright','swamp-boatwright','swamp-landing',
    ['mutual-repair','flood-memory'],'boatwright-flood-readiness',[
      [360,600,'inspect-winch','winch'],[600,900,'repair-boardwalk','boardwalk'],
      [900,1080,'check-mooring','mooring'],[1080,1200,'record-water-mark','water-mark'],
      [1200,1440,'rest','gathering'],[0,360,'rest','gathering'],
    ],'water-mark'),
  /* The gauge at first light and at dusk, the porch between. `sit` binds to
     the chair and resolves to the standing idle: the retro rig has no seated
     pose. */
  swampLakekeeper:resident('swampLakekeeper','swamp-lakekeeper','swamp-sinkhole',
    ['flood-memory'],'lakekeeper-datum-round',[
      [330,450,'record-water-mark','water-mark'],[450,690,'sit','seat'],
      [690,900,'travel','threshold'],[900,1140,'sit','seat'],
      [1140,1260,'record-water-mark','water-mark'],
      [1260,1440,'rest','seat'],[0,330,'rest','seat'],
    ]),
  /* The earth folk. No sun sets a common night: the four rest in turn, six
     hours each, so three work at every hour. */
  hollowTender:resident('hollowTender','hollow-tender','hollow-tender',
    ['ring-tending'],'tender-ring-round',[
      [0,360,'rest','threshold'],[360,540,'observe','fairy-ring'],
      [540,720,'draw-water','well'],[720,930,'observe','fairy-ring'],
      [930,1110,'inspect-storage','storage'],[1110,1290,'sit','seat'],
      [1290,1440,'travel','threshold'],
    ],'threshold'),
  /* The light is taken at the Heart and carried down the posts. */
  hollowLamplighter:resident('hollowLamplighter','hollow-lamplighter',
    'hollow-lamplighter',['lamp-round'],'lamplighter-post-round',[
      [360,720,'rest','threshold'],[720,870,'observe','gathering'],
      [870,1080,'travel','lamp-post'],[1080,1260,'observe','lamp-post'],
      [1260,1440,'sit','seat'],[0,180,'travel','lamp-post'],
      [180,360,'observe','gathering'],
    ],'threshold'),
  hollowCutter:resident('hollowCutter','hollow-cutter','hollow-cutter',
    ['stone-cutting'],'cutter-lamp-stone',[
      [720,1080,'rest','threshold'],[1080,1230,'observe','gathering'],
      [1230,1440,'resume-project','cutting-bench'],
      [0,240,'resume-project','cutting-bench'],[240,390,'display','cutting-bench'],
      [390,540,'sit','seat'],[540,720,'resume-project','cutting-bench'],
    ],'threshold'),
  hollowKeeper:resident('hollowKeeper','hollow-keeper','hollow-keeper',
    ['pale-herd'],'keeper-herd-count',[
      [1080,1440,'rest','threshold'],[0,180,'observe','pen'],
      [180,360,'draw-water','well'],[360,570,'observe','pen'],
      [570,750,'sit','seat'],[750,930,'travel','pen'],
      [930,1080,'travel','threshold'],
    ],'threshold'),
});

/* `anchorKind` names which node of a shared home a resident spawns on.
   Without it a resident anchors on the first matching node, so a shared home
   puts several people on one pixel. */
function resident(id,culture,home,practices,projectId,schedule,anchorKind=null){
  return Object.freeze({
    id,culture,home,anchorKind,practices:Object.freeze(practices),project:projectId,
    schedule:Object.freeze(schedule.map(([start,end,action,nodeKind])=>
      Object.freeze({start,end,action,nodeKind}))),
    provenance:PROVENANCE.authored,
  });
}

const CULTURE_PACKAGES=Object.freeze({
  'boreal-hearth-market':Object.freeze({
    id:'boreal-hearth-market',biome:'boreal',
    conditions:Object.freeze(['winter-cold','wood-resource','walkable-common']),
    meanings:Object.freeze(['hearth-continuity','travelling-exchange','visible-fuel-reserve']),
    practices:Object.freeze(['hearth-keeping','travelling-market','winter-fuel']),
    residents:Object.freeze([
      'elder','merchant','woodcutter','wayfarer',...TOWNFOLK_IDS,
    ]),
    provenance:PROVENANCE.authored,
  }),
  /* Same nature constraints, different authored meanings: environment does
     not choose culture. */
  'boreal-coppice-counterfactual':Object.freeze({
    id:'boreal-coppice-counterfactual',biome:'boreal',
    conditions:Object.freeze(['winter-cold','wood-resource','walkable-common']),
    meanings:Object.freeze(['shared-coppice-round','seasonal-storehouse']),
    practices:Object.freeze(['winter-fuel']),
    residents:Object.freeze([]),counterfactual:true,provenance:PROVENANCE.authored,
  }),
  'meadow-steading-commons':Object.freeze({
    id:'meadow-steading-commons',biome:'meadow',
    conditions:Object.freeze(['open-sward','midday-heat','one-water-point']),
    meanings:Object.freeze(['maintained-openness','shared-water','shade-as-common']),
    practices:Object.freeze(['sward-round','water-share','pavilion-shade']),
    residents:Object.freeze(['meadowGrower','meadowTender','meadowWeaver']),
    provenance:PROVENANCE.authored,
  }),
  /* Two packages on one pool. Both are fiction and neither is a claim about
     any real people. */
  'desert-garden-hold':Object.freeze({
    id:'desert-garden-hold',biome:'desert',
    conditions:Object.freeze(['one-water-point','midday-heat','firm-pavement']),
    meanings:Object.freeze(['water-measured-in-time','shade-as-property',
                            'the-palm-is-inherited']),
    practices:Object.freeze(['timed-water','palm-inheritance','gallery-keeping']),
    residents:Object.freeze(['desertGardener','desertDigger','desertKeeper']),
    provenance:PROVENANCE.authored,
  }),
  'desert-long-road':Object.freeze({
    id:'desert-long-road',biome:'desert',
    conditions:Object.freeze(['moving-ground','one-water-point','blown-sand']),
    meanings:Object.freeze(['the-road-is-remembered','salt-for-dates',
                            'a-guest-is-owed-three-days']),
    practices:Object.freeze(['remembered-road','salt-for-dates']),
    residents:Object.freeze(['desertDrover']),
    provenance:PROVENANCE.authored,
  }),
  'swamp-water-road':Object.freeze({
    id:'swamp-water-road',biome:'swamp',
    conditions:Object.freeze(['seasonal-flood','shallow-water','raised-circulation']),
    meanings:Object.freeze(['water-as-road','cyclical-flood-memory','mutual-repair']),
    practices:Object.freeze(['water-as-road','mutual-repair','flood-memory']),
    residents:Object.freeze(['swampFisher','swampBoatwright','swampLakekeeper']),
    provenance:PROVENANCE.authored,
  }),
  /* The earth folk: small makers under the forest floor. docs/life/HOLLOW.md
     holds the sources. Fiction built on them, no claim about a tradition. */
  'hollow-earth-folk':Object.freeze({
    id:'hollow-earth-folk',biome:'hollow',
    conditions:Object.freeze(['no-sun','luminous-crop','still-water']),
    meanings:Object.freeze(['light-is-kept','the-ring-is-a-field',
                            'water-is-asked-for']),
    practices:Object.freeze(['ring-tending','lamp-round','stone-cutting','pale-herd']),
    residents:Object.freeze(['hollowTender','hollowLamplighter','hollowCutter',
                             'hollowKeeper']),
    provenance:PROVENANCE.authored,
  }),
});

/* Dress. Authority: culture is the only place a garment colour is chosen.
   body-folk.js owns anatomy only. Sources in palette.js.

   A garment's mass is undyed fleece: grey, moorit brown, or lanolin
   olive-white. Dye is imported, so it appears as a band (hat brow, cuff, sash,
   hem stripe) in madder red or weld ochre. Only the traveller wears a dyed
   mass.

   Weather selects the range, culture selects within it. The person id is the
   stable seed, so atlas order and world traversal cannot change somebody's
   clothes. */
const FASHION_SEED=0x46524f53;
const FASHION_VOCAB=Object.freeze({
  /* Snowing, below freezing. Layered, nothing short. */
  boreal:Object.freeze({
    ramps:Object.freeze(['folkWool','folkUmber','folkOat']),
    bodyProfiles:Object.freeze(['slim','regular','broad']),
    coatCuts:Object.freeze(['mid','long']),
    coatBulks:Object.freeze(['lined','puffy']),
    hats:Object.freeze(['wool','earflap','hood','cap']),
    scarves:Object.freeze(['band','tail']),
    /* Nothing bare below freezing: no `shorts`, no `short` cut, no `none`
       hat. */
    legwears:Object.freeze(['trousers']),
    shirtHems:Object.freeze(['tucked','tee']),
    dyePlaces:Object.freeze(['hat-band','cuffs','sash','hem-stripe']),
    dyeHues:Object.freeze(['madder','ochre']),
  }),
  /* Clear and warm. Short cuts, no lining, a brim against the sun.

     The fleece is borrowed. The meadow snap list sits at 63 of the 64 colours
     POST_FS iterates, so three new folk ramps do not fit. `trunk` (cool
     near-black to slate) stands for folkWool and `timber` (warm grey-brown)
     for folkUmber.

     No bands: `folkDye` is two more entries this list cannot spend. */
  meadow:Object.freeze({
    ramps:Object.freeze(['trunk','timber']),
    bodyProfiles:Object.freeze(['slim','regular','broad']),
    coatCuts:Object.freeze(['short','mid']),
    coatBulks:Object.freeze(['thin']),
    hats:Object.freeze(['none','straw','brim','cap']),
    scarves:Object.freeze(['none','band']),
    /* Field work in the sun: shorts, or trousers against stubble. The seed
       picks. */
    legwears:Object.freeze(['shorts','trousers']),
    shirtHems:Object.freeze(['untucked','tee']),
    dyePlaces:Object.freeze(['none']),
    dyeHues:Object.freeze(['ochre']),
  }),
  /* Amber Waste. Hot, dry, abrasive, windy. Climate selects looseness,
     coverage and layer count, and no colour: Shkolnik, Taylor, Finch & Borut,
     Nature 283:373-375 (1980) measured no difference in heat load between
     black and white Bedouin robes in the Sinai. So this row has no pale-only
     rule, and the drovers' indigo is allowed.

     No shorts (a bare shin burns and abrades), no lining (the design is a
     still layer of air held off the body), and no `none` hat (every head is
     covered). */
  desert:Object.freeze({
    /* undyed camel and sheep, plus the one dyed mass (Shkolnik above) */
    ramps:Object.freeze(['folkOat','folkWool','folkDye']),
    bodyProfiles:Object.freeze(['slim','regular','broad']),
    /* a robe that stops at the knee stops shading the legs */
    coatCuts:Object.freeze(['mid','long']),
    coatBulks:Object.freeze(['thin']),
    hats:Object.freeze(['veil','hood','brim']),
    scarves:Object.freeze(['band','tail']),
    legwears:Object.freeze(['trousers']),
    shirtHems:Object.freeze(['tucked','untucked']),
    /* indigo travels the salt road, so a household shows it as a band */
    dyePlaces:Object.freeze(['hem-stripe','sash','cuffs']),
    dyeHues:Object.freeze(['madder','ochre']),
  }),
  /* Warm rain. Loose and short to ventilate and dry, a brim or a hood, one
     ochre note per docs/SWAMP.md. No padding. Two fleeces: a third puts this
     snap list at 67 of 64. */
  swamp:Object.freeze({
    ramps:Object.freeze(['folkUmber','folkWool']),
    bodyProfiles:Object.freeze(['slim','regular','broad']),
    coatCuts:Object.freeze(['short','mid']),
    coatBulks:Object.freeze(['thin']),
    hats:Object.freeze(['straw','brim','hood']),
    scarves:Object.freeze(['none','band']),
    /* Trousers, not shorts: standing water is insects and sawgrass. Loose
       and short above, covered below. */
    legwears:Object.freeze(['trousers']),
    shirtHems:Object.freeze(['untucked','tee']),
    dyePlaces:Object.freeze(['none','hat-band','cuffs']),
    dyeHues:Object.freeze(['ochre']),
  }),
  /* Amethyst Hollow. Cave air holds near the mean surface temperature
     (Palmer, Cave Geology, 2007), a few degrees under this forest, still and
     saturated, and the roof drips. Lined, nothing short, every head covered.

     Blue or grey (docs/life/HOLLOW.md, Dress). The fleece is borrowed, as the
     meadow's is: `trunk` the grey, `gourWater` the blue. Both are on the
     snap list, so the cast costs the palette its dyed band only. */
  hollow:Object.freeze({
    ramps:Object.freeze(['trunk','gourWater']),
    bodyProfiles:Object.freeze(['slim','regular','broad']),
    coatCuts:Object.freeze(['mid','long']),
    coatBulks:Object.freeze(['lined']),
    /* `peak`: the makers' pointed hood (figure-folk.js capPass). Felt dome
       for falling stone. No brim: there is no sun. */
    hats:Object.freeze(['peak','hood','felt']),
    scarves:Object.freeze(['none','band']),
    legwears:Object.freeze(['trousers']),
    shirtHems:Object.freeze(['tucked']),
    dyePlaces:Object.freeze(['hat-band','sash','cuffs','hem-stripe']),
    /* Ochre is an iron earth, and a cave has it. Madder is a field root. */
    dyeHues:Object.freeze(['ochre']),
  }),
});

/* The travellers belong to no package. Their dress is authored here: a
   garment colour has one home. */
const OUTSIDER_CULTURE=Object.freeze({
  traveller:'boreal-traveller',meadowTraveller:'meadow-traveller',
  swampTraveller:'swamp-traveller',desertTraveller:'desert-traveller',
  hollowTraveller:'hollow-traveller',
});
const PRACTICE_DRESS=Object.freeze({
  'hearth-keeping':Object.freeze({
    outerLayers:Object.freeze(['mantle','shoulder-wrap']),
    closures:Object.freeze(['clasp','seam']),
  }),
  'travelling-market':Object.freeze({
    outerLayers:Object.freeze(['apron','shoulder-wrap']),
    closures:Object.freeze(['tie','seam']),
  }),
  'winter-fuel':Object.freeze({
    outerLayers:Object.freeze(['reinforced','shoulder-wrap']),
    closures:Object.freeze(['tie','seam']),
  }),
  'water-as-road':Object.freeze({
    outerLayers:Object.freeze(['shoulder-wrap']),
    closures:Object.freeze(['tie']),
  }),
  /* A shoulder cape sheds warm rain without insulating (docs/SWAMP.md), so
     both wet-work practices carry one. */
  'mutual-repair':Object.freeze({
    outerLayers:Object.freeze(['reinforced','shoulder-wrap']),
    closures:Object.freeze(['seam']),
  }),
  'flood-memory':Object.freeze({
    outerLayers:Object.freeze(['mantle','shoulder-wrap']),
    closures:Object.freeze(['clasp']),
  }),
  'sward-round':Object.freeze({
    outerLayers:Object.freeze(['reinforced','apron']),
    closures:Object.freeze(['tie']),
  }),
  'water-share':Object.freeze({
    outerLayers:Object.freeze(['apron','shoulder-wrap']),
    closures:Object.freeze(['tie','seam']),
  }),
  'pavilion-shade':Object.freeze({
    outerLayers:Object.freeze(['apron','shoulder-wrap']),
    closures:Object.freeze(['seam']),
  }),
});
/* The STRANDED sheets author these silhouettes. The names translate their
   visible equipment into the work in each schedule.

   No carried pole: a shaft from above the crown to the ground reads as a
   ceremonial stave in a village of hearths, fuel and a market. The grave
   watcher carries a hand lantern, the spear guard carries nothing, and the
   axe stays because the woodcutter's schedule splits fuel. */
const IDENTITY_DRESS=Object.freeze({
  /* The hero's silhouette is pinned, not seeded: a seed that changes his hat
     makes him two people. `null` restores the authored default in
     figure-folk.js WEAR (vertical hands, two-row shoulder). His coat is the
     dyed mass and carries no band. */
  traveller:Object.freeze({
    ramp:'folkCoat',hat:'cap',bodyProfile:'regular',coatCut:'long',
    coatBulk:'lined',scarf:'none',sleeveWidth:1,handShape:null,
    shoulderDrop:null,hemRoundRows:null,clothPattern:'plain',
    legwear:'trousers',shirtHem:'tucked',
    staturePx:0,dyePlace:'none',
  }),
  /* The short cut leaves seven leg rows, the winter coat three. */
  meadowTraveller:Object.freeze({
    ramp:'folkCoat',hat:'straw',bodyProfile:'regular',coatCut:'short',
    coatBulk:'thin',scarf:'none',sleeveWidth:1,handShape:null,
    shoulderDrop:null,hemRoundRows:null,clothPattern:'plain',
    legwear:'shorts',shirtHem:'untucked',
    staturePx:0,dyePlace:'none',
  }),
  /* The veil: blown sand strips an exposed face and dry air takes water with
     every open breath. */
  desertTraveller:Object.freeze({
    /* Sleeve 1, though a robe wants 2: a 2 px sleeve gives a 7 px shoulder on
       an 8 px chest, the square upper body docs/LIFE.md forbids. The medium
       wins. The looseness stays in the open outer robe and the long cut. */
    ramp:'folkCoat',hat:'veil',bodyProfile:'regular',coatCut:'long',
    /* Band, not tail. A scarf tail and the veil's loose end hang down the
       same side: both together put 7 px on a shoulder row every other
       traveller draws at 5. */
    coatBulk:'thin',scarf:'band',sleeveWidth:1,handShape:null,
    shoulderDrop:null,hemRoundRows:null,clothPattern:'plain',
    legwear:'trousers',shirtHem:'tucked',
    staturePx:0,dyePlace:'none',
  }),
  swampTraveller:Object.freeze({
    ramp:'swampCoat',hat:'straw',bodyProfile:'regular',coatCut:'mid',
    coatBulk:'thin',scarf:'none',sleeveWidth:1,handShape:null,
    shoulderDrop:null,hemRoundRows:null,clothPattern:'plain',
    legwear:'trousers',shirtHem:'tee',
    staturePx:0,dyePlace:'none',
  }),
  graveWatcher:Object.freeze({
    hat:'hood',coatCut:'long',outerLayer:'mantle',carriedKit:'hand-lantern',
  }),
  fruitBearer:Object.freeze({
    coatCut:'mid',outerLayer:'apron',carriedKit:'provision-basket',
  }),
  /* Cap, not earflap: an earflap draws in the columns and rows
     headAccentPass uses for `ear-wrap`, so the identity cue is lost. */
  headphones:Object.freeze({
    hat:'cap',coatCut:'mid',coatBulk:'puffy',headAccent:'ear-wrap',
  }),
  thickDude:Object.freeze({
    bodyProfile:'broad',coatBulk:'puffy',outerLayer:'reinforced',closure:'tie',
  }),
  bookDude:Object.freeze({
    coatCut:'mid',carriedKit:'winter-ledger',
  }),
  axeman:Object.freeze({
    hat:'hood',headAccent:'animal-ears',outerLayer:'reinforced',
    carriedKit:'wood-axe',
  }),
  leader:Object.freeze({
    bodyProfile:'broad',coatCut:'long',outerLayer:'mantle',closure:'clasp',
    dyePlace:'sash',dyeHue:'madder',
  }),
  featherHat:Object.freeze({
    hat:'brim',headAccent:'feather',outerLayer:'shoulder-wrap',
  }),
  spearGuard:Object.freeze({
    hat:'earflap',coatCut:'long',coatBulk:'puffy',outerLayer:'mantle',
    carriedKit:null,
  }),
  bearKid:Object.freeze({
    hat:'hood',coatCut:'mid',coatBulk:'puffy',headAccent:'animal-ears',
  }),
  /* The gallery digger breaks three rows of FASHION_VOCAB.desert, each for
     the tunnel. Bleached cotton (`sabkha`, the salt's ramp): the lamp finds a
     white body in the dark. A short cut and bare shins: he works knee-deep in
     running water, out of the sun. A felt dome: stones fall down a shaft. The
     lamp tests the air, and the rope is the windlass line. */
  desertDigger:Object.freeze({
    ramp:'sabkha',hat:'felt',capTone:'dark',bodyProfile:'regular',
    coatCut:'short',coatBulk:'thin',scarf:'none',sleeveWidth:1,
    handShape:'small',shoulderDrop:1,hemRoundRows:1,planeSplit:0,
    clothPattern:'plain',legwear:'shorts',shirtHem:'tucked',
    outerLayer:'rope-coil',closure:null,carriedKit:'gallery-lamp',
    staturePx:0,dyePlace:'none',
  }),
  /* The hour keeper is the one office in the hold, so he is the one person
     here with a mantle and the one who carries the measure. `timber` is the
     desert's second undyed mass (camel and goat hair, the tents' cloth). */
  desertKeeper:Object.freeze({
    ramp:'timber',hat:'turban',capTone:'mid',bodyProfile:'regular',
    coatCut:'long',coatBulk:'thin',scarf:'none',sleeveWidth:1,
    handShape:'tall',shoulderDrop:2,hemRoundRows:0,planeSplit:0,
    clothPattern:'plain',legwear:'trousers',shirtHem:'tucked',
    outerLayer:'mantle',closure:'clasp',carriedKit:'gnomon-staff',
    staturePx:0,dyePlace:'sash',dyeHue:'ochre',
  }),
  /* Cave wardrobe: a hood for the drip, a mid cut because a long hem drags
     in a rimstone pool. The coat stays the dyed mass. */
  hollowTraveller:Object.freeze({
    ramp:'folkCoat',hat:'hood',bodyProfile:'regular',coatCut:'mid',
    coatBulk:'lined',scarf:'none',sleeveWidth:1,handShape:null,
    shoulderDrop:null,hemRoundRows:null,clothPattern:'plain',
    legwear:'trousers',shirtHem:'tucked',
    staturePx:0,dyePlace:'none',
  }),
  /* The earth folk. Stature is pinned at the cast floor (body-folk.js). Each
     carries what the work is done with: miner's dress and a chest light
     (Britten 1884, in docs/life/HOLLOW.md). The tender's basket takes the
     ripe caps. */
  hollowTender:Object.freeze({
    ramp:'trunk',hat:'peak',capTone:'mid',bodyProfile:'regular',
    coatCut:'mid',outerLayer:'apron',closure:null,
    carriedKit:'provision-basket',
    staturePx:0,dyePlace:'hat-band',dyeHue:'ochre',
  }),
  /* Lamp rides a pole: a post's lamp hangs over a small maker's head. No
     hand lantern: on an 18 px body its foot hangs below the hem and draws
     as a third leg (docs/LIFE.md law 3). */
  hollowLamplighter:Object.freeze({
    ramp:'trunk',hat:'peak',capTone:'dark',bodyProfile:'slim',
    coatCut:'long',outerLayer:'mantle',closure:'clasp',
    carriedKit:'lamp-staff',clothPattern:'plain',
    staturePx:0,dyePlace:'sash',dyeHue:'ochre',
  }),
  hollowCutter:Object.freeze({
    ramp:'gourWater',hat:'peak',capTone:'dark',bodyProfile:'broad',
    coatCut:'mid',outerLayer:'reinforced',closure:'tie',
    carriedKit:'cutter-mallet',
    staturePx:0,dyePlace:'cuffs',dyeHue:'ochre',
  }),
  /* Lamp hangs on the coat, at the chest side: both hands work the herd. A
     hood where the makers wear the peak: he is out under the drip. */
  hollowKeeper:Object.freeze({
    ramp:'gourWater',hat:'hood',capTone:'mid',bodyProfile:'regular',
    coatCut:'long',outerLayer:'shoulder-wrap',closure:'seam',
    carriedKit:'gallery-lamp',clothPattern:'plain',
    staturePx:0,dyePlace:'hem-stripe',dyeHue:'ochre',
  }),
});
/* Shoulder drop floor is 1. A drop of 0 draws the coat at full chest width
   from the shoulder row down: seven of twenty-one rows wear a box. The raster
   raises the drop for a chest widened by profile and bulk (figure-folk.js
   `shoulderInset`). */
const FASHION_SHAPE=Object.freeze({
  shoulderDrop:Object.freeze([1,2]),
  hemRoundRows:Object.freeze([0,1,2]),
  planeSplit:Object.freeze([-1,0,1]),
});
const EMPTY_FASHION=Object.freeze({
  staturePx:0,ramp:null,bodyProfile:null,coatCut:null,coatBulk:null,
  hat:null,capTone:null,
  scarf:null,sleeveWidth:null,handShape:null,shoulderDrop:null,
  hemRoundRows:null,planeSplit:0,clothPattern:null,practice:null,
  outerLayer:null,closure:null,headAccent:null,carriedKit:null,
  legwear:null,shirtHem:null,dyePlace:null,dyeHue:null,
});

const worldOf=(cultureId)=>cultureId?.startsWith('boreal-')?'boreal'
  :cultureId?.startsWith('swamp-')?'swamp'
  :cultureId?.startsWith('meadow-')?'meadow'
  /* A missing prefix fails silently: fashionFor returns EMPTY_FASHION and the
     resident is drawn in nothing. Asserted in test/culture.test.mjs. */
  :cultureId?.startsWith('desert-')?'desert'
  :cultureId?.startsWith('hollow-')?'hollow':null;

function fashionFor(personId,
  cultureId=RESIDENTS[personId]?.culture??OUTSIDER_CULTURE[personId]){
  const world=worldOf(cultureId);
  if(!world)return EMPTY_FASHION;
  const vocab=FASHION_VOCAB[world];
  const pick=(values,key)=>values[keyedInt(FASHION_SEED,0,values.length-1,
    cultureId,personId,key)];
  const practice=RESIDENTS[personId]?.practices
    .find((id)=>PRACTICE_DRESS[id])??null;
  const practiceDress=practice?PRACTICE_DRESS[practice]:null;
  const seeded={
    staturePx:keyedInt(FASHION_SEED,-1,1,cultureId,personId,'stature'),
    ramp:pick(vocab.ramps,'ramp'),
    bodyProfile:pick(vocab.bodyProfiles,'body'),
    coatCut:pick(vocab.coatCuts,'coat-cut'),
    coatBulk:pick(vocab.coatBulks,'coat-bulk'),
    hat:pick(vocab.hats,'hat'),
    capTone:keyedInt(FASHION_SEED,0,1,cultureId,personId,'cap-tone')?'mid':'dark',
    scarf:pick(vocab.scarves,'scarf'),
    sleeveWidth:keyedInt(FASHION_SEED,1,2,cultureId,personId,'sleeve'),
    handShape:pick(['small','tall','block'],'hand'),
    legwear:pick(vocab.legwears,'legwear'),
    shirtHem:pick(vocab.shirtHems,'shirt-hem'),
    shoulderDrop:pick(FASHION_SHAPE.shoulderDrop,'shoulder'),
    hemRoundRows:pick(FASHION_SHAPE.hemRoundRows,'hem'),
    planeSplit:pick(FASHION_SHAPE.planeSplit,'plane'),
    clothPattern:keyedInt(FASHION_SEED,0,1,cultureId,personId,'cloth')
      ?'ordered':'plain',
    practice,
    outerLayer:practiceDress?pick(practiceDress.outerLayers,'outer-layer'):null,
    closure:practiceDress?pick(practiceDress.closures,'closure'):null,
    headAccent:null,
    carriedKit:null,
    dyePlace:pick(vocab.dyePlaces,'dye-place'),
    dyeHue:pick(vocab.dyeHues,'dye-hue'),
  };
  const row={...seeded,...IDENTITY_DRESS[personId]};
  /* A brow band needs a brow. Resolved here so the fashion row describes
     what is worn. */
  if(row.dyePlace==='hat-band'&&(row.hat==='none'||row.hat===null))
    row.dyePlace='sash';
  return Object.freeze(row);
}

const TIES=Object.freeze([
  Object.freeze({id:'swamp-mutual-repair',a:'swampFisher',b:'swampBoatwright',
    type:'mutual-repair',obligations:['report-damage','share-repair','keep-mooring-open'],
    provenance:PROVENANCE.authored,
    nonClaims:['kinship','friendship']}),
]);

function node(id,kind,x,y,extra={}){
  return Object.freeze({id,kind,x:Math.round(x),y:Math.round(y),...extra});
}

function compileUseNodes(gen,packageId){
  const pack=CULTURE_PACKAGES[packageId];
  if(!pack)throw new Error(`unknown culture package '${packageId}'`);
  const nodes=[];
  if(pack.biome==='boreal'){
    const common=gen.POI.find((p)=>p.kind==='village')||gen.plan.common;
    const home=nearestBuilding(gen.BUILDINGS,common);
    const door=home?gen.buildingDoor(home):{x:common.x,y:common.y};
    /* The yard is the only ground a resident can stand on. A cabin is an
       outdoor prop whose door does not open: a node at `door.y` minus a dozen
       rows spawns the elder in the log wall. `buildingDoor` reports the apron
       the site check proved dry and off the trail, clear of the keep-out
       core. */
    const apronOf=(d)=>d.y+(d.front||12)+5;
    const yard=apronOf(door);
    nodes.push(
      /* Household nodes anchor to the building and sit in front of it. */
      node('elder-home:hearth','hearth',door.x-12,yard+4,{building:home?.i??0,state:'tending-due'}),
      node('elder-home:seat','seat',door.x+12,yard,{building:home?.i??0,state:'available'}),
      node('elder-home:storage','storage',door.x-24,yard-2,{building:home?.i??0,state:'inspection-due'}),
      node('elder-home:threshold','threshold',door.x,door.y,{building:home?.i??0,state:'sound'}),
      node('village-common:stall','stall',common.x+Math.round(common.r*0.25),common.y-18,{state:'packed'}),
      node('village-common:west-stall','stall',common.x-Math.round(common.r*0.30),common.y-14,{state:'packed'}),
      node('village-common:gathering','gathering',common.x,common.y,{state:'available'}),
      node('village-common:bench-east','seat',common.x+Math.round(common.r*0.38),common.y+12,{state:'available'}),
      node('village-common:bench-west','seat',common.x-Math.round(common.r*0.36),common.y+16,{state:'available'}),
      node('village-common:north-route','route-marker',common.x,common.y-Math.round(common.r*0.58)),
      node('village-common:east-route','route-marker',common.x+Math.round(common.r*0.62),common.y),
      node('village-common:south-route','route-marker',common.x,common.y+Math.round(common.r*0.58)),
      node('village-common:west-route','route-marker',common.x-Math.round(common.r*0.62),common.y),
      node('boreal-woodlot:woodlot','woodlot',common.x-Math.round(common.r*0.72),common.y+80,{state:'inspection-due'}),
      node('boreal-woodlot:splitting','splitting-block',common.x-Math.round(common.r*0.48),common.y+50,{state:'work-due'}),
      node('boreal-woodlot:fuel','fuel-stack',door.x-34,yard+2,{state:'incomplete'}),
    );
    /* A resident belongs to a door. Townfolk take the yards the elder does
       not, two to a yard, one either side of the door, and extra pairs step
       back a row. The ring around the common is the fallback: it puts all ten
       in one knot and leaves the cabins empty. */
    const yards=(gen.BUILDINGS||[])
      .map((b,i)=>({...b,i}))
      .filter((b)=>b.kind==='cabin'&&b.i!==home?.i);
    TOWNFOLK_IDS.forEach((id,i)=>{
      if(!yards.length){
        const angle=-Math.PI/2+i*Math.PI*2/TOWNFOLK_IDS.length;
        const radius=Math.max(24,Math.round(common.r*0.28));
        nodes.push(node(`townfolk-${id}:threshold`,'threshold',
          common.x+Math.cos(angle)*radius,common.y+Math.sin(angle)*radius,
          {state:'sound'}));
        return;
      }
      const site=yards[i%yards.length],slot=Math.floor(i/yards.length);
      const d=gen.buildingDoor(site);
      const lateral=(slot%2?1:-1)*(10+12*Math.floor(slot/2));
      nodes.push(node(`townfolk-${id}:threshold`,'threshold',
        d.x+lateral,apronOf(d)+8*Math.floor(slot/2),
        {building:site.i,state:'sound'}));
    });
  }else if(pack.biome==='desert'){
    /* Both packages read the same generator output and share only the
       gathering at the water. */
    const built=gen.steading||[];
    const huts=built.filter((q)=>q.kind==='hut');
    const tents=built.filter((q)=>q.kind==='tent');
    const pool=gen.oasis;
    const centre=pool||gen.POI.find((p)=>p.kind==='village')||gen.plan.common;
    if(!centre)return Object.freeze([]);
    /* The pool's edge, not its middle: a node on open water stands a person in
       it. Every node is offset clear of the waterline the ground pass draws. */
    const edge={x:centre.x-Math.round((pool?pool.r:120)*0.62), y:centre.y+18};
    nodes.push(node('desert-water:gathering','gathering',edge.x,edge.y,
      {state:'available'}));
    if(pack.id==='desert-garden-hold'){
      const home=huts[0]||centre;
      nodes.push(
        node('hut-garden:shadow-stick','shadow-stick',edge.x+26,edge.y-22,
          {state:'available'}),
        node('hut-garden:well','well',edge.x+8,edge.y+16,{state:'available'}),
        node('hut-garden:drying-rack','drying-rack',home.x+24,home.y+10,
          {state:'available'}),
        node('hut-garden:seat','seat',home.x-22,home.y+14,{state:'available'}),
        node('hut-garden:threshold','threshold',home.x,home.y+14,{state:'sound'}),
      );
      /* A door each (the boreal `townfolk-<id>:threshold` law). The digger
         and the keeper take the second and third hut; with fewer huts sited
         they stand either side of the first. */
      ['hut-digger','hut-keeper'].forEach((id,i)=>{
        const q=huts[i+1]||{x:home.x+(i?40:-40),y:home.y};
        nodes.push(
          node(`${id}:threshold`,'threshold',q.x,q.y+14,{state:'sound'}),
          node(`${id}:seat`,'seat',q.x+(i?20:-20),q.y+16,{state:'available'}),
        );
      });
    }else{
      const camp=tents[0]||centre;
      nodes.push(
        /* salt crust on the pool's dry side */
        node('tent-camp:salt-pan','salt-pan',edge.x-34,edge.y-30,
          {state:'available'}),
        node('tent-camp:pen','pen','x' in camp?camp.x+40:centre.x,camp.y+18,
          {state:'available'}),
        node('tent-camp:threshold','threshold',camp.x,camp.y+16,{state:'sound'}),
        /* cairns on the pavement, out along the corridor both ways */
        node('tent-camp:north-route','route-marker',camp.x,camp.y-260),
        node('tent-camp:south-route','route-marker',camp.x,camp.y+260),
      );
    }
  }else if(pack.biome==='meadow'){
    /* worldgen sites the steading, so every node is read off what was placed.
       A pavilion that fails its site check leaves the weaver bound to the
       yard. */
    const steading=gen.steading||[];
    const houses=steading.filter((q)=>q.kind==='house');
    const pavilion=steading.find((q)=>q.kind==='pavilion');
    const pump=steading.find((q)=>q.kind==='pump');
    /* The hamlet's centre, not the pavilion's. The steading spreads about
       600 px along the trail and the pavilion is its southernmost slot: a yard
       anchored there puts all three residents 300 px off the arrival the
       village POI marks. */
    const centre=gen.POI.find((p)=>p.kind==='village')||gen.plan.common
      ||pavilion||houses[0];
    if(!centre)return Object.freeze([]);
    const home=houses[0]||centre;
    /* Nothing sits on the arrival pixel. The village POI is where the traveller
       walks in, so a use node on it puts a resident inside the player's sprite.
       Every yard node is offset off the centre and the two seats are apart. */
    nodes.push(
      node('steading-yard:gathering','gathering',centre.x+22,centre.y-10,{state:'available'}),
      node('steading-yard:storage','storage',home.x-16,home.y+8,{state:'inspection-due'}),
      node('steading-yard:seat','seat',centre.x-26,centre.y+14,{state:'available'}),
      node('steading-yard:seat-north','seat',centre.x+34,centre.y+20,{state:'available'}),
      node('steading-yard:north-route','route-marker',centre.x,centre.y-120),
      node('steading-yard:south-route','route-marker',centre.x,centre.y+120),
    );
    /* A door each. worldgen anchors a resident on the first node whose id
       starts with their home, so a shared home id spawns all three on one
       pixel. Same law as the boreal `townfolk-<id>:threshold`, spread over the
       houses the steading sited. */
    MEADOW_HOMES.forEach((id,i)=>{
      const q=houses[i%Math.max(1,houses.length)]||centre;
      const spread=houses.length>i?0:(i-1)*46;
      nodes.push(node(`${id}:threshold`,'threshold',
        q.x+spread,q.y+14,{state:'sound'}));
    });
    for(let i=0;i<3;i++){
      const angle=-Math.PI/2+i*Math.PI*2/3;
      nodes.push(node(`steading-grower:sward-${i+1}`,'sward',
        centre.x+Math.cos(angle)*150,centre.y+Math.sin(angle)*150,
        {state:'cut-due'}));
    }
    nodes.push(node('steading-grower:drying-rack','drying-rack',
      centre.x-52,centre.y+40,{state:'active'}));
    const well=pump?{x:pump.x,y:pump.y+10,source:'pump'}
      :{x:centre.x-34,y:centre.y+22};
    nodes.push(node('steading-tender:well','well',well.x,well.y,
      {...(well.source?{source:well.source}:{}),state:'available'}));
    /* Pavilion nodes carry the weaver's home prefix, not the building's. A
       resident prefers nodes under his own home id and falls back to the
       shared yard, so a pavilion-named node loses to the yard's gathering and
       the shade practice happens in the open. */
    if(pavilion)nodes.push(
      node('steading-weaver:gathering','gathering',pavilion.x,pavilion.y+8,
        {source:'pavilion',state:'available'}),
      node('steading-weaver:seat','seat',pavilion.x+14,pavilion.y+10,
        {source:'pavilion',state:'available'}),
    );
  }else if(pack.biome==='hollow'){
    /* Read off what the generator stood: houses, posts, bench, the Heart,
       its ring, the nearest pool. A node is where a body stands to use a
       thing, on open floor beside it. */
    const built=gen.steading||[];
    const houses=built.filter((q)=>q.kind==='capHouse');
    const bench=built.find((q)=>q.kind==='cutBench');
    const centre=gen.POI.find((p)=>p.kind==='village')||gen.plan.common;
    if(!centre)return Object.freeze([]);
    /* house `i`, or where it would stand had siting dropped it */
    const home=(i)=>houses[i]||{x:centre.x+70+i*44,y:centre.y-70};
    const set=gen.caveSet||[];
    const heart=set.find((q)=>q.kind==='heartstone');
    const ring=heart?set.filter((q)=>q.kind==='glowcap'):[];
    const at=heart||centre;
    /* the ring's two radii, off the caps the plan stood */
    const rx=Math.max(40,...ring.map((q)=>Math.abs(q.x-at.x)));
    const ry=Math.max(24,...ring.map((q)=>Math.abs(q.y-at.y)));
    nodes.push(
      /* inside the ring, clear of the Heart's lesser crystals */
      node('hollow-heart:gathering','gathering',at.x+rx*0.45,at.y+ry*0.45,
        {state:'available'}),
      /* outside the ring: the tender does not cross his own crop */
      node('hollow-tender:fairy-ring-east','fairy-ring',at.x+rx+14,at.y,
        {state:'tending-due'}),
      node('hollow-tender:fairy-ring-south','fairy-ring',at.x,at.y+ry+12,
        {state:'tending-due'}),
    );
    /* Shore of the nearest pool, on the village's side. 1.12 of the bowl's
       radius is dry at every lake setting. */
    const far=(p)=>Math.hypot(p.x-centre.x,p.y-centre.y);
    const pool=(gen.cavern?.pools||[]).reduce((best,p)=>
      !best||far(p)<far(best)?p:best,null);
    if(pool){
      const ux=(centre.x-pool.x)/pool.rx,uy=(centre.y-pool.y)/(pool.rx*0.5);
      const n=Math.hypot(ux,uy)||1;
      nodes.push(node('hollow-mirror:well','well',
        pool.x+ux/n*pool.rx*1.12,pool.y+uy/n*pool.rx*0.5*1.12,
        {state:'available'}));
    }
    /* A door each (the boreal `townfolk-<id>:threshold` law). A house anchors
       on its door, so the threshold is straight in front of it. */
    HOLLOW_HOMES.forEach((id,i)=>nodes.push(
      node(`${id}:threshold`,'threshold',home(i).x,home(i).y+14,{state:'sound'}),
      node(`${id}:seat`,'seat',home(i).x+(i%2?-16:16),home(i).y+18,
        {state:'available'}),
    ));
    /* A cave is a cellar: the caps keep beside the tender's door. */
    nodes.push(node('hollow-tender:storage','storage',home(0).x-16,home(0).y+12,
      {state:'inspection-due'}));
    built.filter((q)=>q.kind==='lampPost').forEach((q,i)=>nodes.push(
      node(`hollow-lamplighter:lamp-post-${i+1}`,'lamp-post',q.x+8,q.y+6,
        {source:'lampPost',state:'available'})));
    const work=bench?{x:bench.x-12,y:bench.y+5}:{x:home(2).x+18,y:home(2).y+14};
    nodes.push(
      node('hollow-cutter:cutting-bench','cutting-bench',work.x,work.y,
        {...(bench?{source:'cutBench'}:{}),state:'work-due'}),
      /* The herd is counted on open floor past the last house, away from the
         trail. */
      node('hollow-keeper:pen','pen',home(3).x+34,home(3).y+26,
        {state:'available'}));
  }else if(pack.biome==='swamp'){
    const s=gen.swampSettlement;
    if(!s)return Object.freeze([]);
    const byKind={swampTrap:'fish-trap',swampRack:'drying-rack',
      swampMooring:'mooring',swampSkiff:'punt',swampWinch:'winch'};
    const count={};
    for(const q of s.architecture){
      const kind=byKind[q.kind];
      if(!kind)continue;
      const i=count[kind]=(count[kind]||0)+1;
      const state=kind==='fish-trap'?'service-due'
        :kind==='drying-rack'?'active'
        :kind==='winch'?'inspection-due'
        :kind==='mooring'?'inspection-due':'available';
      nodes.push(node(`swamp-landing:${kind}-${i}`,kind,q.x,q.y,{source:q.kind,state}));
    }
    nodes.push(
      node('swamp-landing:gathering','gathering',s.landing.x,s.landing.y,{state:'available'}),
      node('swamp-landing:water-mark','water-mark',s.landing.x+18,s.landing.y-8,{state:'record-due'}),
    );
    /* The sinkhole place, when the world compiles one. All three nodes are on
       the balcony. The place declares the deck's lift, so a body bound here is
       painted a storey up and still sorts in front of the house. */
    const L=gen.swampLakehouse;
    if(L)nodes.push(
      /* The node is where a body stands to use the chair, beside it. Bound to
         the chair's own pixel, the keeper hides the sprite. */
      node('swamp-sinkhole:seat','seat',L.seatStand.x,L.seatStand.y,
        {source:'rockingChair',state:'available'}),
      /* The mark is cut into the leg nearest the water and read over the rail.
         The settlement cuts high-water memory into the left pile of every
         house; this is that practice. */
      node('swamp-sinkhole:water-mark','water-mark',L.railGauge.x,L.railGauge.y,
        {source:'lakeHouse',state:'record-due'}),
      node('swamp-sinkhole:threshold','threshold',L.ladderHead.x,L.ladderHead.y,
        {source:'houseLadder',state:'sound'}),
    );
  }
  return Object.freeze(nodes);
}

function nearestBuilding(buildings,point){
  let best=null,bestD=Infinity;
  for(let i=0;i<(buildings||[]).length;i++){
    const b=buildings[i],d=Math.hypot(b.x-point.x,b.y-point.y);
    if(d<bestD){best={...b,i};bestD=d;}
  }
  return best;
}

function activeSchedule(row,minuteOfDay){
  const m=((minuteOfDay%1440)+1440)%1440;
  return row.schedule.find((q)=>q.start<=q.end
    ?m>=q.start&&m<q.end
    :m>=q.start||m<q.end) || row.schedule[0];
}

function compileCulturePlan(gen,packageId){
  const pack=CULTURE_PACKAGES[packageId];
  if(!pack)throw new Error(`unknown culture package '${packageId}'`);
  const nodes=compileUseNodes(gen,packageId);
  const residents=pack.residents.map((id)=>{
    const row=RESIDENTS[id];
    const bindings={};
    for(const block of row.schedule){
      const all=nodes.filter((q)=>q.kind===block.nodeKind);
      /* A resident reads his own place first. The swamp has two water marks
         (the landing's and the sinkhole's), and the keeper must bind to his
         own. */
      const home=all.filter((q)=>q.id.startsWith(row.home+':'));
      const matches=home.length?home:all;
      if(matches.length)bindings[block.nodeKind]=matches.map((q)=>q.id);
    }
    return Object.freeze({...row,nodeBindings:Object.freeze(bindings)});
  });
  const residentIds=new Set(residents.map((q)=>q.id));
  const ties=TIES.filter((q)=>residentIds.has(q.a)&&residentIds.has(q.b));
  return Object.freeze({
    package:pack,nodes,residents:Object.freeze(residents),ties:Object.freeze(ties),
    households:Object.freeze(residentIds.has('elder')?[
      Object.freeze({id:'elder-home',members:['elder'],provenance:PROVENANCE.authored,
        nonClaims:['kinship-beyond-declared-membership']}),
    ]:[]),
    workGroups:Object.freeze(residentIds.has('swampFisher')?[
      Object.freeze({id:'swamp-mutual-repair',members:['swampFisher','swampBoatwright'],
        duties:['report-damage','repair-shared-infrastructure'],
        provenance:PROVENANCE.authored,nonClaims:['kinship','friendship']}),
    ]:[]),
  });
}

function validateCulture(){
  const errors=[];
  const relationTypes=new Set(RELATIONSHIP_TYPES);
  const nodeKinds=new Set(USE_NODE_KINDS);
  for(const [id,row] of Object.entries(RESIDENTS)){
    if(!PROJECTS[row.project])errors.push(`${id}.project references ${row.project}`);
    for(const practice of row.practices)
      if(!PRACTICES[practice])errors.push(`${id}.practices references ${practice}`);
    for(const block of row.schedule){
      if(!nodeKinds.has(block.nodeKind))errors.push(`${id}.schedule references ${block.nodeKind}`);
      if(block.start<0||block.start>1440||block.end<0||block.end>1440)
        errors.push(`${id}.schedule is outside one day`);
    }
  }
  for(const tie of TIES)if(!relationTypes.has(tie.type))errors.push(`${tie.id}.type is invalid`);
  for(const [id,pack] of Object.entries(CULTURE_PACKAGES)){
    for(const residentId of pack.residents)
      if(!RESIDENTS[residentId])errors.push(`${id}.residents references ${residentId}`);
  }
  return errors;
}

export {
  ACTION_EVIDENCE, CULTURE_PACKAGES, FASHION_VOCAB, IDENTITY_DRESS,
  OUTSIDER_CULTURE,
  PRACTICES, PRACTICE_DRESS, PROJECTS, PROJECT_ACTIONS,
  RELATIONSHIP_TYPES, RESIDENTS, TIES,
  USE_NODE_KINDS, activeSchedule, compileCulturePlan, compileUseNodes,
  fashionFor, projectAction, projectMilestoneForAction, validateCulture,
};
