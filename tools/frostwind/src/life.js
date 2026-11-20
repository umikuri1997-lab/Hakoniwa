import { clamp, lerp } from './math.js';

/* Life is semantic authority only. Morphology modules own dimensions, cadence,
   materials and pixels. Culture owns authored human meanings. */
const PROVENANCE=Object.freeze({
  measured:'measured',
  derived:'derived',
  inferred:'inferred-transfer',
  authored:'authored-gameplay',
  medium:'medium-constraint',
  fictional:'fictional-law',
});

const IDENTITY_CLASS=Object.freeze({
  taxon:'exact-taxon',
  guild:'functional-guild',
  person:'human-person',
  fictional:'fictional-species',
});

const LIFE_NON_GOALS=Object.freeze([
  'birth-death-and-genetics',
  'population-equations',
  'opaque-personality-or-emotion-scores',
  'omniscient-perception',
  'per-frame-offscreen-kinematics',
  'combat-and-damage',
  'save-ui-or-storage',
]);

/* Resource rows are executable relations. Worldgen reads `field`; life plans
   and behavior read `supports`. */
const RESOURCE_GUILDS=Object.freeze({
  'spruce-cones':Object.freeze({
    field:'coneMast',kind:'food',biomes:['boreal'],supports:['squirrel'],
    provenance:PROVENANCE.inferred,
  }),
  'birch-rubus-browse':Object.freeze({
    field:'browse',kind:'food',biomes:['boreal'],supports:['roeDeer'],
    provenance:PROVENANCE.inferred,
  }),
  'sheltered-snow':Object.freeze({
    field:'snowShelter',kind:'condition',biomes:['boreal'],supports:['roeDeer'],
    provenance:PROVENANCE.inferred,
  }),
  'rooting-substrate':Object.freeze({
    field:'rooting',kind:'food',biomes:['boreal'],supports:['boar'],
    provenance:PROVENANCE.inferred,
  }),
  deadwood:Object.freeze({
    field:'deadwood',kind:'cover',biomes:['boreal','swamp'],
    supports:['boar','squirrel','heron','wolf','lampsnail'],provenance:PROVENANCE.inferred,
  }),
  'reed-cover':Object.freeze({
    field:'reedCover',kind:'cover',biomes:['boreal','swamp'],
    supports:['roeDeer','heron','turtle','wolf'],provenance:PROVENANCE.inferred,
  }),
  'shallow-prey':Object.freeze({
    field:'shallowPrey',kind:'food',biomes:['swamp','hollow'],
    supports:['alligator','heron','turtle','skimmer','olm'],provenance:PROVENANCE.inferred,
  }),
  'alligator-refuge':Object.freeze({
    field:'refuge',kind:'refuge',biomes:['swamp'],supports:['alligator'],
    provenance:PROVENANCE.measured,
  }),
  'bask-structure':Object.freeze({
    field:'bask',kind:'thermal',biomes:['swamp'],supports:['alligator','turtle'],
    provenance:PROVENANCE.inferred,
  }),
  /* Desert. `desertShade`: where a fennec spends midday. `openWater`: the one
     pool, a resource and not a medium, because its users arrive, drink and
     leave. `looseSand`: a viper's cover and ambush. `desertForage`: sub-sprite
     prey and seed with no drawn body. */
  'desert-shade':Object.freeze({
    field:'desertShade',kind:'cover',biomes:['desert'],
    supports:['fennec','shadeguest'],provenance:PROVENANCE.inferred,
  }),
  'open-water':Object.freeze({
    field:'openWater',kind:'condition',biomes:['desert'],
    supports:['sandgrouse'],provenance:PROVENANCE.measured,
  }),
  'loose-sand':Object.freeze({
    field:'looseSand',kind:'cover',biomes:['desert'],
    supports:['viper'],provenance:PROVENANCE.measured,
  }),
  'desert-forage':Object.freeze({
    field:'desertForage',kind:'food',biomes:['desert'],
    supports:['fennec','sandgrouse','viper'],provenance:PROVENANCE.inferred,
  }),
  /* Sun Meadow. `pondMargin`: the wet edge of a basin, where a stork takes
     frogs. `openSward`: open, quiet grass, a hare's form and a stork's
     grasshoppers. */
  'pond-margin':Object.freeze({
    field:'pondMargin',kind:'food',biomes:['meadow'],
    supports:['stork'],provenance:PROVENANCE.inferred,
  }),
  'open-sward':Object.freeze({
    field:'openSward',kind:'food',biomes:['meadow'],
    supports:['stork','hare'],provenance:PROVENANCE.inferred,
  }),
  'meadow-thermal':Object.freeze({
    field:'thermal',kind:'condition',biomes:['meadow'],
    supports:['colossus','strider','pilgrim'],provenance:PROVENANCE.fictional,
  }),
  'meadow-substrate':Object.freeze({
    field:'firmSubstrate',kind:'condition',biomes:['meadow'],
    supports:['colossus','strider','pilgrim'],provenance:PROVENANCE.derived,
  }),
  /* Amethyst Hollow. `fungus`: damp floor a glowcap fruits on, off
     HABITAT.glowcap. `crystal`: nearness to a geode place. The olm reads the
     swamp's `shallowPrey`: sub-sprite prey in a pool's margin. */
  'glowcap-troops':Object.freeze({
    field:'fungus',kind:'food',biomes:['hollow'],
    supports:['paleDeer','driftlantern'],provenance:PROVENANCE.fictional,
  }),
  'crystal-cover':Object.freeze({
    field:'crystal',kind:'cover',biomes:['hollow'],
    supports:['carbuncle'],provenance:PROVENANCE.fictional,
  }),
});

/* Semantic actions consume specific affordances. Profile suitability answers
   "can this animal use this site"; this table answers "can it do this action
   here". */
const ACTION_AFFORDANCES=Object.freeze({
  browse:Object.freeze({resources:Object.freeze(['birch-rubus-browse'])}),
  root:Object.freeze({resources:Object.freeze(['rooting-substrate'])}),
  forage:Object.freeze({resourceKinds:Object.freeze(['food'])}),
  cache:Object.freeze({resources:Object.freeze(['spruce-cones'])}),
  bask:Object.freeze({
    resources:Object.freeze(['bask-structure']),
    medium:Object.freeze(['dry','shallow']),
  }),
  float:Object.freeze({medium:Object.freeze(['shallow','deep'])}),
  submerge:Object.freeze({medium:Object.freeze(['shallow','deep'])}),
});

const P=(identity,rest)=>Object.freeze({
  identity:Object.freeze(identity),
  ...rest,
});
const channels=(sight,sound,scent=0)=>Object.freeze({
  sight:Object.freeze({range:sight,uncertainty:0.12,cover:true,motion:true}),
  sound:Object.freeze({range:sound,uncertainty:0.20}),
  ...(scent?{scent:Object.freeze({range:scent,uncertainty:0.34,wind:true})}:{}),
});
const activity=(...knots)=>Object.freeze(knots.map(([minute,value])=>Object.freeze({minute,value})));
const provenance=(identity,habitat,social,behavior,expression=PROVENANCE.authored)=>Object.freeze({
  identity,habitat,social,behavior,expression,
});
const response=(enter,clear,actions)=>Object.freeze({enter,clear,actions:Object.freeze(actions)});

const townPerson=(id,common)=>P(
  {class:IDENTITY_CLASS.person,person:id,common},
  {
    morphology:id,culture:'boreal-townfolk',biomes:['boreal'],
    provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
      PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
    spatial:Object.freeze({patchRadius:280,siteRadius:140,homeAnchor:'village-common'}),
    conditions:Object.freeze({medium:['dry']}),
    resources:[],activity:activity([0,0.08],[360,0.42],[720,0.92],[1080,0.62],[1440,0.08]),
    seasons:Object.freeze({current:'town-round'}),
    social:Object.freeze({form:'town-resident',cohort:{min:1,max:1}}),
    drives:['duty','project','rest','observe','travel'],
    actions:['tend-hearth','inspect-storage','sit','observe','travel','resume-project',
      'unpack','display','attend-stall','repack','inspect-woodlot','split-fuel',
      'stack-fuel','rest','orient','withdraw','hold'],
    perception:channels(45,40,0),
    fear:response(0.88,0.52,['orient','withdraw']),
    aggression:response(0.98,0.72,['hold']),
    disturbance:Object.freeze({repeatedPresence:'remember-witnessed-facts'}),
    traces:['boot-print'],expressions:['idle','prepare','walk','look'],
    nonClaims:['personality-score','inferred-kinship'],
  });

/* The earth folk of the Hollow (culture.js `hollow-earth-folk`). `rest`:
   the minute the six-hour rest starts. Fear: sight 120 px in the risk law
   of behavior.js, 1.14 * (1 - d / 120) = 0.80 at 36 px, so one turns to the
   traveller at 2.3 m and steps back. */
const earthFolk=(id,common,rest,actions,traces,nonClaims)=>P(
  {class:IDENTITY_CLASS.person,person:id,common},
  {
    morphology:id,culture:'hollow-earth-folk',biomes:['hollow'],
    provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
      PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
    spatial:Object.freeze({patchRadius:260,siteRadius:120,
      homeAnchor:id.replace('hollow','hollow-').toLowerCase()}),
    conditions:Object.freeze({medium:['dry']}),
    resources:[],
    activity:activity(...(rest
      ?[[0,0.84],[rest-30,0.84],[rest,0.06],[rest+330,0.06],[rest+360,0.84],
        [1440,0.84]]
      :[[0,0.06],[330,0.06],[360,0.84],[1410,0.84],[1440,0.06]])),
    seasons:Object.freeze({current:'hall-round'}),
    social:Object.freeze({form:'household',cohort:{min:1,max:1}}),
    drives:['duty','project','rest','travel'],
    actions:[...actions,'sit','rest','travel','observe','hold','orient','withdraw'],
    perception:channels(120,120,0),
    fear:response(0.80,0.46,['orient','withdraw']),
    aggression:response(0.96,0.68,['hold']),
    disturbance:Object.freeze({repeatedPresence:'remember-witnessed-facts'}),
    traces:['boot-print',...traces],expressions:['walk','idle'],
    nonClaims:['kinship','magic','guest-rules-enforced',...nonClaims],
  });

/* Circular activity values are relative propensity, not encounter counts.
   Spatial ranges are authored planning radii in world pixels unless the field
   carries another unit. */
const LIFE=Object.freeze({
  roeDeer:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Capreolus capreolus',common:'European roe deer'},
    {
      morphology:'roeDeer',biomes:['boreal'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:420,siteRadius:260,homeAnchor:'browse'}),
      conditions:Object.freeze({medium:['dry'],coverMin:0.20,quietMin:0.28}),
      resources:['birch-rubus-browse','sheltered-snow','reed-cover'],
      activity:activity([0,0.50],[300,0.82],[720,0.32],[1020,0.78],[1440,0.50]),
      seasons:Object.freeze({winter:'solitary-buck'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['safety','browse','rest','observe','travel'],
      actions:['browse','rest','observe','travel','orient','freeze','flee','hold'],
      perception:channels(150,110,90),
      fear:response(0.62,0.32,['orient','freeze','flee']),
      aggression:response(0.92,0.58,['hold']),
      disturbance:Object.freeze({traffic:'timing-shift',noise:'avoid',
        cutting:'staged-cover-and-browse-response',repeatedPresence:'limited-habituation'}),
      traces:['hoof-print','browse-sign'],expressions:['idle','walk','gallop','look'],
      nonClaims:['herd-dynamics','population-density','snow-energetics'],
    }),
  /* One wide-ranging animal that travels, rests, watches and leaves.
     Predation, pack structure, territory and prey response are not modelled:
     nothing here makes a deer afraid of him. */
  wolf:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Canis lupus',common:'Eurasian wolf'},
    {
      morphology:'wolf',biomes:['boreal'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.inferred,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      /* The widest patch in the world. A planning radius in world pixels, not
         a territory claim. */
      spatial:Object.freeze({patchRadius:900,siteRadius:340,homeAnchor:'travel'}),
      conditions:Object.freeze({medium:['dry'],coverMin:0.16,quietMin:0.42}),
      resources:['deadwood','reed-cover'],
      /* Crepuscular: rotary and speed-dependent gallopers skew crepuscular. */
      activity:activity([0,0.72],[300,0.88],[720,0.20],[1080,0.86],[1440,0.72]),
      seasons:Object.freeze({winter:'wide-ranging-single-animal'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['safety','rest','observe','travel'],
      actions:['travel','rest','observe','orient','freeze','flee','hold'],
      perception:channels(165,190,240),
      fear:response(0.74,0.40,['orient','freeze','flee']),
      aggression:response(0.96,0.66,['hold']),
      disturbance:Object.freeze({traffic:'avoid',noise:'avoid',
        cutting:'avoid-active-work',repeatedPresence:'limited-habituation'}),
      traces:['paw-print'],expressions:['idle','walk','trot','canter','sprint','look'],
      nonClaims:['predation','pack-structure','territory','prey-response',
        'population-density'],
    }),
  boar:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Sus scrofa',common:'Eurasian wild boar'},
    {
      morphology:'boar',biomes:['boreal'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.inferred,
        PROVENANCE.measured,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:560,siteRadius:230,homeAnchor:'rooting'}),
      conditions:Object.freeze({medium:['dry'],coverMin:0.34,quietMin:0.36,edgeBias:0.72}),
      resources:['rooting-substrate','deadwood'],
      activity:activity([0,0.90],[360,0.36],[720,0.18],[1080,0.72],[1440,0.90]),
      seasons:Object.freeze({winter:'solitary-adult-or-matrilineal-unit'}),
      social:Object.freeze({form:'declared-cohort',cohort:{min:1,max:4},
        allowed:['solitary-adult','matrilineal-unit']}),
      drives:['safety','root','rest','travel'],
      actions:['root','rest','travel','orient','flee','hold','display','defend'],
      perception:channels(105,125,145),
      fear:response(0.68,0.34,['orient','flee']),
      aggression:response(0.72,0.38,['hold','display','defend']),
      disturbance:Object.freeze({traffic:'avoid',noise:'avoid',
        cutting:'avoid-active-work-use-later-rooting',foodSubsidy:'approach-with-risk'}),
      traces:['hoof-print','rooting-scar'],expressions:['idle','walk','look'],
      nonClaims:['two-unrelated-generic-wanderers','fixed-carrying-capacity'],
    }),
  squirrel:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Sciurus vulgaris',common:'Eurasian red squirrel'},
    {
      morphology:'squirrel',biomes:['boreal'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.inferred,
        PROVENANCE.measured,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:260,siteRadius:95,homeAnchor:'coneMast'}),
      conditions:Object.freeze({medium:['dry'],canopyMin:0.38,quietMin:0.20}),
      resources:['spruce-cones','deadwood'],
      activity:activity([0,0.08],[540,0.30],[660,0.82],[840,0.58],[960,0.22],[1440,0.08]),
      seasons:Object.freeze({winter:'solitary-overlapping-ranges'}),
      social:Object.freeze({form:'solitary-overlap',cohort:{min:1,max:1}}),
      drives:['safety','forage','cache','rest','travel'],
      actions:['forage','cache','rest','travel','orient','freeze','flee','hide','hold'],
      perception:channels(135,105,55),
      fear:response(0.56,0.26,['orient','freeze','flee','hide']),
      aggression:response(0.90,0.55,['hold']),
      disturbance:Object.freeze({cutting:'leave-after-cone-and-canopy-loss',
        traffic:'avoid-ground',noise:'freeze-or-hide'}),
      traces:['paw-print','cone-scale'],expressions:['idle','walk','look'],
      nonClaims:['pair-bond','generic-herd'],
    }),
  alligator:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Alligator mississippiensis',common:'American alligator'},
    {
      morphology:'alligator',biomes:['swamp'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.measured,
        PROVENANCE.measured,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:510,siteRadius:260,homeAnchor:'refuge',
        localRefugeInfluenceM:17}),
      conditions:Object.freeze({medium:['dry','shallow','deep'],hydroperiodMin:0.56}),
      resources:['alligator-refuge','shallow-prey','bask-structure'],
      activity:activity([0,0.70],[360,0.45],[720,0.38],[1080,0.72],[1440,0.70]),
      seasons:Object.freeze({warm:'forage-and-bask',cool:'refuge-and-bask'}),
      social:Object.freeze({form:'local-aggregation',cohort:{min:1,max:1}}),
      drives:['thermoregulate','forage','rest','refuge','travel'],
      actions:['bask','forage','float','rest','travel','orient','submerge','hold','display','defend'],
      perception:channels(175,150,70),
      fear:response(0.66,0.34,['orient','submerge']),
      aggression:response(0.62,0.30,['hold','display','defend']),
      disturbance:Object.freeze({drawdown:'concentrate-at-refuge',traffic:'submerge',
        noise:'submerge',repeatedPresence:'limited-habituation'}),
      traces:['slide','bank-rest'],expressions:['bask','crawl','float','swim','submerge'],
      nonClaims:['17m-biological-home-range','stable-social-group'],
    }),
  heron:P(
    {class:IDENTITY_CLASS.guild,guild:'large-ardeid-wader',common:'large ardeid wader'},
    {
      morphology:'heron',biomes:['swamp'],
      provenance:provenance(PROVENANCE.inferred,PROVENANCE.inferred,
        PROVENANCE.measured,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:460,siteRadius:150,homeAnchor:'shallowPrey'}),
      conditions:Object.freeze({medium:['dry','shallow'],maxDepthM:0.30,quietMin:0.34}),
      resources:['shallow-prey','reed-cover','deadwood'],
      activity:activity([0,0.16],[360,0.72],[720,0.54],[1080,0.68],[1440,0.16]),
      seasons:Object.freeze({current:'resource-aggregation'}),
      social:Object.freeze({form:'resource-aggregation',cohort:{min:1,max:1}}),
      drives:['safety','forage','rest','travel'],
      actions:['forage','rest','travel','orient','freeze','flee','hold'],
      perception:channels(220,130,0),
      fear:response(0.48,0.22,['orient','freeze','flee']),
      aggression:response(0.88,0.50,['hold']),
      disturbance:Object.freeze({drawdown:'follow-prey-concentration',traffic:'leave-site',
        noise:'leave-site'}),
      traces:['wader-print'],expressions:['still','wade','look'],
      nonClaims:['species-precision','pair-bond','colony-dynamics'],
    }),
  turtle:P(
    {class:IDENTITY_CLASS.guild,guild:'large-basking-emydid',common:'large basking emydid'},
    {
      morphology:'turtle',biomes:['swamp'],
      provenance:provenance(PROVENANCE.inferred,PROVENANCE.inferred,
        PROVENANCE.measured,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:240,siteRadius:75,homeAnchor:'bask'}),
      conditions:Object.freeze({medium:['dry','shallow'],maxDepthM:0.32}),
      resources:['bask-structure','shallow-prey','reed-cover'],
      activity:activity([0,0.05],[420,0.36],[720,0.92],[1020,0.46],[1440,0.05]),
      seasons:Object.freeze({current:'bask-site-aggregation'}),
      social:Object.freeze({form:'bask-site-aggregation',cohort:{min:1,max:1}}),
      drives:['thermoregulate','forage','rest','travel'],
      actions:['bask','forage','rest','travel','orient','submerge','hold'],
      perception:channels(75,45,0),
      fear:response(0.44,0.18,['orient','submerge']),
      aggression:response(0.96,0.70,['hold']),
      disturbance:Object.freeze({drawdown:'shift-bask-and-feeding-sites',traffic:'submerge'}),
      traces:['bank-rest'],expressions:['bask','crawl','float'],
      nonClaims:['species-precision','pair-bond'],
    }),
  /* src/skimmer.js states the one invented law. It is on open water or
     nowhere: `entityAffordance` holds it off the bank. */
  skimmer:P(
    {class:IDENTITY_CLASS.fictional,species:'skimmer',common:'skimmer'},
    {
      morphology:'skimmer',biomes:['swamp'],
      provenance:provenance(PROVENANCE.fictional,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.fictional,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:320,siteRadius:120,homeAnchor:'open-water'}),
      conditions:Object.freeze({medium:['shallow','deep']}),
      resources:['shallow-prey'],
      activity:activity([0,0.30],[360,0.70],[720,0.80],[1080,0.74],[1440,0.30]),
      seasons:Object.freeze({current:'high-water'}),
      social:Object.freeze({form:'water-site-aggregation',cohort:{min:2,max:3}}),
      drives:['forage','safety','rest','travel'],
      actions:['forage','rest','travel','observe','orient','flee','hold'],
      /* it reads ripples: a wide, short-ranged sense */
      perception:channels(110,150,0),
      fear:response(0.62,0.34,['orient','flee']),
      aggression:response(0.99,0.90,['hold']),
      disturbance:Object.freeze({traffic:'avoid',drawdown:'follow-the-water'}),
      traces:['ring-ripples'],expressions:['drift','row'],
      nonClaims:['flight','predation-on-people','reproduction',
                 'population-density'],
    }),
  /* src/lampsnail.js states the one invented law. Its answer to anything is
     the shell: `hide` is a baked state. */
  lampsnail:P(
    {class:IDENTITY_CLASS.fictional,species:'lampsnail',common:'lamp snail'},
    {
      morphology:'lampsnail',biomes:['swamp'],
      provenance:provenance(PROVENANCE.fictional,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.fictional,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:160,siteRadius:60,homeAnchor:'deadwood'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['deadwood'],
      /* wet and dark suit it: active through the rain, most at night */
      activity:activity([0,0.90],[360,0.70],[720,0.50],[1080,0.66],[1440,0.90]),
      seasons:Object.freeze({current:'wet-season'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['safety','rest','travel'],
      actions:['rest','travel','observe','hide','hold'],
      perception:channels(60,40,0),
      /* Risk is 1.14*(1 - distance/sight): 0.85 enters at 15 px, one metre. */
      fear:response(0.85,0.50,['hide']),
      aggression:response(0.99,0.90,['hold']),
      disturbance:Object.freeze({traffic:'withdraw',drawdown:'no-response'}),
      traces:['slime-trail'],expressions:['rest','glide','hide'],
      nonClaims:['toxicity','reproduction','population-density',
                 'fungus-species'],
    }),
  /* Desert. */
  fennec:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Vulpes zerda',common:'fennec fox'},
    {
      morphology:'fennec',biomes:['desert'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:320,siteRadius:120,homeAnchor:'shade'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['desert-shade','desert-forage'],
      /* Crepuscular, and the world is pinned at noon. The curve is not
         flattened to keep the animal on screen: at midday it lies in shade. */
      activity:activity([0,0.72],[300,0.88],[720,0.06],[1080,0.62],[1440,0.72]),
      seasons:Object.freeze({current:'shade-round'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['thermoregulate','safety','forage','rest','travel'],
      actions:['rest','forage','travel','observe','orient','flee','hold'],
      perception:channels(120,140,70),
      fear:response(0.38,0.20,['orient','flee']),
      aggression:response(0.98,0.80,['hold']),
      disturbance:Object.freeze({traffic:'avoid',sandBurial:'shelter-and-wait'}),
      traces:['paw-print','burrow-mouth'],expressions:['trot','still'],
      nonClaims:['den-structure','pair-bond','population-density'],
    }),
  sandgrouse:P(
    {class:IDENTITY_CLASS.guild,guild:'sandgrouse',common:'sandgrouse'},
    {
      morphology:'sandgrouse',biomes:['desert'],
      provenance:provenance(PROVENANCE.inferred,PROVENANCE.measured,
        PROVENANCE.measured,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:420,siteRadius:90,homeAnchor:'open-water'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['open-water','desert-forage'],
      /* Pterocles carries water to its chicks in its belly feathers and comes
         to a pool at the same hour every morning, in numbers. The knots are
         that schedule: a spike at the water, near zero after. */
      activity:activity([0,0.02],[390,0.30],[450,0.96],[540,0.24],[1440,0.02]),
      seasons:Object.freeze({current:'morning-water-flight'}),
      /* a resource aggregation, not a claim about flock social structure */
      social:Object.freeze({form:'water-site-aggregation',cohort:{min:2,max:5}}),
      drives:['forage','safety','travel'],
      actions:['forage','travel','observe','orient','flee','rest','hold'],
      perception:channels(150,90,0),
      fear:response(0.30,0.16,['orient','flee']),
      aggression:response(0.99,0.90,['hold']),
      disturbance:Object.freeze({traffic:'avoid',drawdown:'shift-water-site'}),
      traces:['water-edge-tracks'],expressions:['shuffle','still'],
      /* the raster supports no species and the compiler draws no flight */
      nonClaims:['species-precision','flight','colony','brood-provisioning-range'],
    }),
  viper:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Cerastes cerastes',common:'horned viper'},
    {
      morphology:'viper',biomes:['desert'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:260,siteRadius:70,homeAnchor:'loose-sand'}),
      /* it needs sand it can sink into: the field the dune cover is read from */
      conditions:Object.freeze({medium:['dry']}),
      resources:['loose-sand','desert-forage'],
      activity:activity([0,0.66],[300,0.44],[720,0.04],[1140,0.70],[1440,0.66]),
      seasons:Object.freeze({current:'ambush-round'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['thermoregulate','safety','rest','travel'],
      actions:['rest','travel','orient','hold','flee'],
      /* a pit-less viper hunts by vibration and heat at short range */
      perception:channels(40,70,0),
      /* The response is to bury: `buried` is the rest state and the answer to
         disturbance. */
      fear:response(0.52,0.30,['orient','hold']),
      aggression:response(0.86,0.52,['hold']),
      disturbance:Object.freeze({traffic:'bury',sandBurial:'no-response'}),
      traces:['sidewind-track','coil-pit'],expressions:['sidewind','buried'],
      nonClaims:['venom','strike','prey-selection','population-density'],
    }),
  /* src/shadeguest.js states the one invented law and its boundary. What is
     left is a solifuge: it flees the sun, so its home is shade and its whole
     interest in a walker is the shade at the heel. */
  shadeguest:P(
    {class:IDENTITY_CLASS.fictional,species:'shadeguest',common:'shade guest'},
    {
      morphology:'shadeguest',biomes:['desert'],
      provenance:provenance(PROVENANCE.fictional,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.fictional,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:300,siteRadius:110,homeAnchor:'shade'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['desert-shade'],
      /* Nocturnal. At the pinned noon it is under a crown, and what brings it
         out is a walker. */
      activity:activity([0,0.90],[300,0.64],[720,0.08],[1140,0.72],[1440,0.90]),
      seasons:Object.freeze({current:'shade-round'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['settle','rest','travel'],
      actions:['rest','travel','observe','approach-traveller','greet',
               'follow-traveller'],
      perception:channels(120,150,0),
      /* A solifuge does not give ground. Thresholds above one: a walker never
         produces mammalian fear or defence, as for the machines. */
      fear:response(2,1.5,[]),aggression:response(2,1.5,[]),
      disturbance:Object.freeze({traffic:'approach-for-shade',
        sandBurial:'shelter-and-wait'}),
      traces:['pin-print','shade-scrape'],expressions:['still','scuttle','greet'],
      nonClaims:['venom','silk','predation-on-people','reproduction',
                 'population-density','gallery-ecology'],
    }),
  camel:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Camelus bactrianus',common:'bactrian camel'},
    {
      morphology:'camel',biomes:['desert'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      /* An owned herd animal, not wildlife: its anchor is the camp, not a
         habitat feature. */
      spatial:Object.freeze({patchRadius:520,siteRadius:190,homeAnchor:'tent-camp'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['desert-forage','open-water'],
      /* it browses through the cool ends of the day and stands through the
         middle */
      activity:activity([0,0.20],[300,0.78],[720,0.26],[1020,0.74],[1440,0.20]),
      seasons:Object.freeze({current:'herd-round'}),
      /* several together at a resource, with no further social structure */
      social:Object.freeze({form:'herd-aggregation',cohort:{min:2,max:4}}),
      drives:['forage','rest','travel','safety'],
      actions:['forage','rest','travel','observe','orient','hold','flee'],
      perception:channels(200,130,60),
      /* A 500 kg animal in this heat does not spook easily or run far: the
         highest enter threshold of any animal here. */
      fear:response(0.86,0.52,['orient','flee']),
      aggression:response(0.90,0.60,['hold']),
      disturbance:Object.freeze({traffic:'no-response',sandBurial:'shelter-and-wait'}),
      traces:['pad-print','browse-sign'],expressions:['idle','walk','pace'],
      nonClaims:['herd-hierarchy','ownership-marks','rumination-cycle',
                 'thermoregulatory-physiology'],
    }),
  desertGardener:P(
    {class:IDENTITY_CLASS.person,person:'desertGardener',common:'oasis gardener'},
    {
      morphology:'desertGardener',culture:'desert-garden-hold',biomes:['desert'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:240,siteRadius:110,homeAnchor:'hut-garden'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['open-water','desert-shade'],
      /* She works either side of midday and spends it behind the eleven-hour
         wall. */
      activity:activity([0,0.06],[300,0.82],[660,0.90],[780,0.10],[960,0.86],
                        [1320,0.44],[1440,0.06]),
      seasons:Object.freeze({current:'water-turn'}),
      social:Object.freeze({form:'household',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['draw-water','tend-rack','sit','rest','travel','observe','hold',
               'orient','withdraw'],
      perception:channels(140,100,0),
      fear:response(0.72,0.40,['orient','withdraw']),
      aggression:response(0.94,0.66,['hold']),
      disturbance:Object.freeze({sandBurial:'shelter-and-clear',traffic:'timing-shift'}),
      traces:['boot-print','cleared-channel'],expressions:['walk','idle'],
      nonClaims:['kinship','literacy','water-rights-law'],
    }),
  desertDrover:P(
    {class:IDENTITY_CLASS.person,person:'desertDrover',common:'dune drover'},
    {
      morphology:'desertDrover',culture:'desert-long-road',biomes:['desert'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:520,siteRadius:180,homeAnchor:'tent-camp'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['open-water','loose-sand'],
      /* one long crossing that starts before light */
      activity:activity([0,0.18],[210,0.88],[600,0.30],[840,0.72],[1260,0.56],
                        [1440,0.18]),
      seasons:Object.freeze({current:'salt-run'}),
      social:Object.freeze({form:'household',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['travel','display','attend-stall','observe','rest','sit','hold',
               'orient','withdraw'],
      perception:channels(190,120,0),
      fear:response(0.70,0.38,['orient','withdraw']),
      aggression:response(0.94,0.66,['hold']),
      disturbance:Object.freeze({sandBurial:'shelter-and-wait',traffic:'no-response'}),
      traces:['boot-print','camp-ring'],expressions:['walk','idle'],
      nonClaims:['kinship','herd-size','trade-network'],
    }),
  desertDigger:P(
    {class:IDENTITY_CLASS.person,person:'desertDigger',common:'gallery digger'},
    {
      morphology:'desertDigger',culture:'desert-garden-hold',biomes:['desert'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:240,siteRadius:110,homeAnchor:'hut-digger'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['open-water','desert-shade'],
      /* Two shifts with the sun between them: the gallery is 19 C at noon and
         the ground over it is not. */
      activity:activity([0,0.06],[240,0.84],[630,0.88],[720,0.08],[900,0.86],
                        [1260,0.40],[1440,0.06]),
      seasons:Object.freeze({current:'silt-round'}),
      social:Object.freeze({form:'household',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['draw-water','sit','rest','travel','observe','hold','orient',
               'withdraw'],
      perception:channels(120,130,0),
      fear:response(0.74,0.42,['orient','withdraw']),
      aggression:response(0.94,0.66,['hold']),
      disturbance:Object.freeze({sandBurial:'shelter-and-clear',traffic:'no-response'}),
      traces:['boot-print','spoil-ring'],expressions:['walk','idle'],
      nonClaims:['kinship','gallery-length','guild','water-rights-law'],
    }),
  desertKeeper:P(
    {class:IDENTITY_CLASS.person,person:'desertKeeper',common:'hour keeper'},
    {
      morphology:'desertKeeper',culture:'desert-garden-hold',biomes:['desert'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:200,siteRadius:90,homeAnchor:'hut-keeper'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['open-water'],
      /* He works through the noon the others shelter from: a turn is a length
         of shadow, and somebody reads it. */
      activity:activity([0,0.04],[300,0.60],[480,0.90],[840,0.92],[1080,0.50],
                        [1260,0.20],[1440,0.04]),
      seasons:Object.freeze({current:'water-turn'}),
      social:Object.freeze({form:'household',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['attend-stall','sit','rest','travel','observe','hold','orient',
               'withdraw'],
      perception:channels(170,110,0),
      fear:response(0.78,0.44,['orient','withdraw']),
      aggression:response(0.94,0.66,['hold']),
      disturbance:Object.freeze({sandBurial:'shelter-and-wait',traffic:'no-response'}),
      traces:['boot-print','staff-mark'],expressions:['walk','idle'],
      nonClaims:['kinship','literacy','water-rights-law','calendar'],
    }),
  hollowTender:earthFolk('hollowTender','ring tender',0,
    ['draw-water','inspect-storage'],['water-drawn','store-order'],
    ['fungal-biology','food-taboo']),
  hollowLamplighter:earthFolk('hollowLamplighter','lamp wright',360,
    [],['lamp-trimmed'],['lamp-chemistry']),
  hollowCutter:earthFolk('hollowCutter','crystal cutter',720,
    ['resume-project','display'],['cut-chips'],['lapidary-method','trade']),
  hollowKeeper:earthFolk('hollowKeeper','herd keeper',1080,
    ['draw-water'],['water-drawn'],['herd-size','ownership-marks']),
  graveWatcher:townPerson('graveWatcher','grave watcher'),
  fruitBearer:townPerson('fruitBearer','fruit bearer'),
  headphones:townPerson('headphones','listener'),
  thickDude:townPerson('thickDude','strong townsperson'),
  bookDude:townPerson('bookDude','reader'),
  axeman:townPerson('axeman','axeman'),
  leader:townPerson('leader','town leader'),
  featherHat:townPerson('featherHat','feather-hatted townsperson'),
  spearGuard:townPerson('spearGuard','spear guard'),
  bearKid:townPerson('bearKid','bear-hooded child'),
  /* The wayfarer has no household or work role: his day is arrival, the
     common, and departure. He perceives further than the townfolk. */
  wayfarer:P(
    {class:IDENTITY_CLASS.person,person:'wayfarer',common:'wayfarer'},
    {
      morphology:'wayfarer',culture:'boreal-wayfarer',biomes:['boreal'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:340,siteRadius:150,homeAnchor:'village-common'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:[],activity:activity([0,0.06],[390,0.58],[720,0.90],[1140,0.50],[1440,0.06]),
      seasons:Object.freeze({current:'road-round'}),
      social:Object.freeze({form:'person',cohort:{min:1,max:1}}),
      drives:['travel','observe','rest','project'],
      actions:['travel','observe','sit','rest','attend-stall','display',
        'unpack','repack','orient','withdraw','hold'],
      perception:channels(135,110,0),
      fear:response(0.86,0.50,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({repeatedPresence:'remember-witnessed-facts'}),
      traces:['boot-print'],expressions:['idle','prepare','walk','look'],
      nonClaims:['random-pacing','inferred-household'],
    }),
  elder:P(
    {class:IDENTITY_CLASS.person,person:'elder',common:'elder'},
    {
      morphology:'elder',culture:'boreal-elder',biomes:['boreal'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:60,siteRadius:45,homeAnchor:'elder-home'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:[],activity:activity([0,0.20],[420,0.70],[720,0.88],[1260,0.42],[1440,0.20]),
      seasons:Object.freeze({current:'household-routine'}),
      social:Object.freeze({form:'household',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','observe'],
      actions:['tend-hearth','inspect-storage','sit','observe','travel','resume-project',
        'orient','withdraw','hold'],
      perception:channels(100,85,0),
      fear:response(0.82,0.48,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({repeatedPresence:'remember-witnessed-facts'}),
      traces:['used-hearth','moved-object'],expressions:['idle','prepare','walk','look'],
      nonClaims:['personality-score','inferred-kinship'],
    }),
  merchant:P(
    {class:IDENTITY_CLASS.person,person:'merchant',common:'merchant'},
    {
      morphology:'merchant',culture:'boreal-merchant',biomes:['boreal'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:220,siteRadius:110,homeAnchor:'village-common'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:[],activity:activity([0,0.05],[420,0.42],[720,0.94],[1140,0.48],[1440,0.05]),
      seasons:Object.freeze({current:'travel-and-market'}),
      social:Object.freeze({form:'person',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','observe','travel'],
      actions:['unpack','display','attend-stall','repack','rest','observe','travel',
        'orient','withdraw','hold'],
      perception:channels(125,105,0),
      fear:response(0.88,0.52,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({repeatedPresence:'remember-witnessed-facts'}),
      traces:['stall-arrangement','boot-print'],expressions:['idle','prepare','walk','look'],
      nonClaims:['random-pacing','personality-score'],
    }),
  woodcutter:P(
    {class:IDENTITY_CLASS.person,person:'woodcutter',common:'woodcutter'},
    {
      morphology:'woodcutter',culture:'boreal-woodcutter',biomes:['boreal'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:300,siteRadius:150,homeAnchor:'woodlot'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['deadwood'],activity:activity([0,0.04],[420,0.44],[720,0.92],[1080,0.52],[1440,0.04]),
      seasons:Object.freeze({winter:'fuel-circuit'}),
      social:Object.freeze({form:'work-role',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['inspect-woodlot','split-fuel','stack-fuel','rest','travel',
        'orient','withdraw','hold'],
      perception:channels(115,125,0),
      fear:response(0.90,0.56,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({cutting:'author-and-witness-work',repeatedPresence:'remember-witnessed-facts'}),
      traces:['stump','slash','fuel-stack','boot-print'],expressions:['idle','prepare','walk','look'],
      nonClaims:['random-pacing','inferred-household'],
    }),
  meadowGrower:P(
    {class:IDENTITY_CLASS.person,person:'meadowGrower',common:'grower'},
    {
      morphology:'meadowGrower',culture:'meadow-grower',biomes:['meadow'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:320,siteRadius:200,homeAnchor:'steading-grower'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:[],activity:activity([0,0.10],[300,0.86],[660,0.40],[1080,0.78],[1440,0.10]),
      seasons:Object.freeze({current:'hay-round'}),
      social:Object.freeze({form:'steading-household',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['cut-sward','turn-hay','tend-rack','sit','rest','travel',
        'orient','withdraw','hold'],
      perception:channels(140,120,0),
      fear:response(0.90,0.56,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({cutting:'author-and-witness-work',
        repeatedPresence:'remember-witnessed-facts'}),
      traces:['sward-cut','hay-row','boot-print'],
      expressions:['idle','prepare','walk','look'],
      nonClaims:['inferred-kinship','crop-simulation'],
    }),
  meadowTender:P(
    {class:IDENTITY_CLASS.person,person:'meadowTender',common:'water tender'},
    {
      morphology:'meadowTender',culture:'meadow-tender',biomes:['meadow'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:260,siteRadius:160,homeAnchor:'steading-tender'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:[],activity:activity([0,0.12],[330,0.80],[690,0.52],[930,0.84],[1440,0.12]),
      seasons:Object.freeze({current:'water-round'}),
      social:Object.freeze({form:'steading-household',cohort:{min:1,max:1}}),
      drives:['duty','observe','rest','travel'],
      actions:['draw-water','inspect-storage','observe','rest','travel',
        'orient','withdraw','hold'],
      perception:channels(150,125,0),
      fear:response(0.90,0.56,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({construction:'inspect',
        repeatedPresence:'remember-witnessed-facts'}),
      traces:['water-drawn','store-order','boot-print'],
      expressions:['idle','prepare','walk','look'],
      nonClaims:['inferred-kinship','hydrological-simulation'],
    }),
  meadowWeaver:P(
    {class:IDENTITY_CLASS.person,person:'meadowWeaver',common:'weaver'},
    {
      morphology:'meadowWeaver',culture:'meadow-weaver',biomes:['meadow'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:240,siteRadius:150,homeAnchor:'steading-weaver'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:[],activity:activity([0,0.08],[360,0.62],[540,0.88],[1020,0.80],[1440,0.08]),
      seasons:Object.freeze({current:'cloth-day'}),
      social:Object.freeze({form:'steading-household',cohort:{min:1,max:1}}),
      drives:['duty','project','observe','rest','travel'],
      actions:['work-cloth','resume-project','sit','observe','rest','travel',
        'orient','withdraw','hold'],
      perception:channels(140,118,0),
      fear:response(0.90,0.56,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({repeatedPresence:'remember-witnessed-facts'}),
      traces:['cloth-length','boot-print'],
      expressions:['idle','prepare','walk','look'],
      nonClaims:['inferred-kinship','textile-simulation'],
    }),
  swampFisher:P(
    {class:IDENTITY_CLASS.person,person:'swampFisher',common:'fisher'},
    {
      morphology:'swampFisher',culture:'swamp-fisher',biomes:['swamp'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:300,siteRadius:180,homeAnchor:'swamp-landing'}),
      conditions:Object.freeze({medium:['dry','boardwalk','shallow']}),
      resources:['shallow-prey'],activity:activity([0,0.22],[300,0.78],[720,0.66],[1020,0.82],[1440,0.22]),
      seasons:Object.freeze({current:'trap-rack-mooring-circuit'}),
      social:Object.freeze({form:'mutual-repair-work-group',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['inspect-trap','tend-rack','check-mooring','pole-punt','rest','travel',
        'orient','withdraw','hold'],
      perception:channels(130,115,0),
      fear:response(0.90,0.56,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({flood:'repair-and-record',repeatedPresence:'remember-witnessed-facts'}),
      traces:['trap-state','rack-state','mooring-state'],expressions:['idle','prepare','walk','look'],
      nonClaims:['inferred-kinship','inferred-friendship'],
    }),
  swampBoatwright:P(
    {class:IDENTITY_CLASS.person,person:'swampBoatwright',common:'boatwright'},
    {
      morphology:'swampBoatwright',culture:'swamp-boatwright',biomes:['swamp'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:300,siteRadius:180,homeAnchor:'swamp-landing'}),
      conditions:Object.freeze({medium:['dry','boardwalk','shallow']}),
      resources:[],activity:activity([0,0.08],[420,0.46],[720,0.90],[1080,0.62],[1440,0.08]),
      seasons:Object.freeze({current:'repair-circuit'}),
      social:Object.freeze({form:'mutual-repair-work-group',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['inspect-winch','repair-boardwalk','check-mooring','record-water-mark','rest','travel',
        'orient','withdraw','hold'],
      perception:channels(130,120,0),
      fear:response(0.90,0.56,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({flood:'repair-and-record',construction:'inspect',
        repeatedPresence:'remember-witnessed-facts'}),
      traces:['repair-state','water-mark'],expressions:['idle','prepare','walk','look'],
      nonClaims:['inferred-kinship','inferred-friendship'],
    }),
  /* The boatwright records water marks across the mosaic, which rises and
     falls. The lakekeeper reads one rock basin that does not, so the
     settlement has a datum to measure the mosaic against. */
  swampLakekeeper:P(
    {class:IDENTITY_CLASS.person,person:'swampLakekeeper',common:'lakekeeper'},
    {
      morphology:'swampLakekeeper',culture:'swamp-lakekeeper',biomes:['swamp'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:240,siteRadius:150,homeAnchor:'swamp-sinkhole'}),
      conditions:Object.freeze({medium:['dry','boardwalk','shallow']}),
      resources:[],activity:activity([0,0.16],[330,0.74],[720,0.58],[1080,0.80],[1440,0.16]),
      seasons:Object.freeze({current:'gauge-and-porch-round'}),
      /* One household of one. His tie to the settlement is the reading he
         carries, not membership in its work group. */
      social:Object.freeze({form:'solitary-keeper',cohort:{min:1,max:1}}),
      drives:['duty','project','rest','travel'],
      actions:['record-water-mark','sit','check-mooring','rest','travel',
        'orient','withdraw','hold'],
      perception:channels(140,120,0),
      fear:response(0.90,0.56,['orient','withdraw']),
      aggression:response(0.98,0.72,['hold']),
      disturbance:Object.freeze({flood:'record-against-datum',
        repeatedPresence:'remember-witnessed-facts'}),
      traces:['water-mark','boot-print'],expressions:['idle','prepare','walk','look'],
      nonClaims:['inferred-kinship','seated-pose-exists'],
    }),
  traveller:P(
    {class:IDENTITY_CLASS.person,person:'traveller',common:'traveller'},
    {
      morphology:'traveller',culture:'traveller',biomes:['boreal','meadow','swamp'],
      provenance:provenance(PROVENANCE.authored,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:0,siteRadius:0,homeAnchor:'player-position'}),
      conditions:Object.freeze({medium:['dry','boardwalk','shallow']}),
      resources:[],activity:activity([0,1],[1440,1]),
      seasons:Object.freeze({current:'player-directed'}),
      social:Object.freeze({form:'person',cohort:{min:1,max:1}}),
      drives:['player-directed'],
      actions:['player-directed','observe'],
      perception:channels(150,120,0),
      fear:response(1,0.8,[]),aggression:response(1,0.8,[]),
      disturbance:Object.freeze({traffic:'emit',repeatedPresence:'emit'}),
      traces:['boot-print'],expressions:['idle','walk','run','look'],
      nonClaims:['scheduler-controls-player-locomotion','player-intent-is-known'],
    }),
  /* src/stork.js. It follows what disturbs the grass: the mower, and a
     walker. `approach-traveller` and the two after it are that following. */
  stork:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Ciconia ciconia',common:'white stork'},
    {
      morphology:'stork',biomes:['meadow'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:420,siteRadius:150,homeAnchor:'nest-pole'}),
      conditions:Object.freeze({medium:['dry','shallow']}),
      resources:['pond-margin','open-sward'],
      activity:activity([0,0.04],[300,0.52],[480,0.90],[720,0.70],[1080,0.86],
                        [1260,0.20],[1440,0.04]),
      seasons:Object.freeze({current:'brood-provisioning'}),
      /* the adult off the nest; the pole in src/steading.js draws the other */
      social:Object.freeze({form:'nest-site-adult',cohort:{min:1,max:1}}),
      drives:['forage','safety','rest','travel'],
      actions:['forage','rest','travel','observe','orient','flee','hold',
               'approach-traveller','greet','follow-traveller'],
      perception:channels(220,120,0),
      /* Village storks tolerate people at a few metres. Risk is
         1.14*(1 - distance/sight) (src/behavior.js), so 0.97 enters at 33 px,
         2.1 m: inside the 3 m it follows at, or fear ends the following. */
      fear:response(0.97,0.80,['orient','flee']),
      aggression:response(0.98,0.80,['hold']),
      disturbance:Object.freeze({traffic:'follow-the-disturbance',
        activeWork:'follow-the-disturbance'}),
      traces:['three-toed-print'],expressions:['stand','stalk','greet'],
      nonClaims:['flight','brood','nest-relief','migration','pair-bond',
                 'population-density'],
    }),
  /* src/hare.js. By day it lies in a form and sits tight. */
  hare:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Lepus europaeus',common:'brown hare'},
    {
      morphology:'hare',biomes:['meadow'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:360,siteRadius:120,homeAnchor:'form'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['open-sward'],
      /* Crepuscular and nocturnal. The curve is not flattened: at the pinned
         noon it is in its form. */
      activity:activity([0,0.80],[330,0.72],[480,0.20],[720,0.05],[1080,0.30],
                        [1260,0.80],[1440,0.80]),
      seasons:Object.freeze({current:'summer-form'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['safety','rest','forage','travel'],
      actions:['rest','forage','travel','observe','orient','freeze','flee','hold'],
      perception:channels(160,180,90),
      /* It sits tight, then goes. By the same risk law 0.85 enters at 40 px,
         2.6 m, where a fennec's 0.38 enters at 80. */
      fear:response(0.85,0.50,['freeze','flee']),
      aggression:response(0.99,0.90,['hold']),
      disturbance:Object.freeze({traffic:'avoid',activeWork:'shift-form'}),
      traces:['paw-print','form-hollow'],expressions:['form','lope','orient'],
      nonClaims:['leverets','boxing','home-range','population-density'],
    }),
  /* Amethyst Hollow (docs/life/HOLLOW.md). No sun sets a day below ground:
     each activity curve is one level. Fear distances are the risk law of
     src/behavior.js, 1.14*(1 - distance/sight).
     The earth folk's herd: the roe deer's body on the deer rig. A kept
     animal: its anchor is the hall, as the camel's is the camp. 0.80 enters
     at 45 px, 2.9 m. */
  paleDeer:P(
    {class:IDENTITY_CLASS.fictional,species:'paleDeer',common:'pale deer'},
    {
      morphology:'paleDeer',biomes:['hollow'],
      provenance:provenance(PROVENANCE.fictional,PROVENANCE.authored,
        PROVENANCE.authored,PROVENANCE.fictional,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:380,siteRadius:170,homeAnchor:'hall'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['glowcap-troops'],
      activity:activity([0,0.62],[1440,0.62]),
      seasons:Object.freeze({current:'kept-herd'}),
      social:Object.freeze({form:'herd-aggregation',cohort:{min:3,max:4}}),
      drives:['safety','forage','rest','observe','travel'],
      actions:['forage','rest','observe','travel','orient','flee','hold'],
      perception:channels(150,110,90),
      fear:response(0.80,0.48,['orient','flee']),
      aggression:response(0.96,0.66,['hold']),
      disturbance:Object.freeze({traffic:'limited-habituation',noise:'avoid'}),
      traces:['hoof-print','grazed-troop'],expressions:['idle','walk','gallop'],
      nonClaims:['milk-and-meat','ownership-marks','herd-hierarchy',
                 'sex-and-antler-cycle','crystal-mineralogy','population-density'],
    }),
  /* src/olm.js. Real animal, life size, out of its range. Blind, reads the
     water: 0.60 enters at 19 px, 1.2 m. The two depths are the margin: past
     the rimstone the painter draws on the waterline, in water a walker's
     waist would clear. */
  olm:P(
    {class:IDENTITY_CLASS.taxon,taxon:'Proteus anguinus',common:'olm'},
    {
      morphology:'olm',biomes:['hollow'],
      provenance:provenance(PROVENANCE.measured,PROVENANCE.authored,
        PROVENANCE.inferred,PROVENANCE.authored,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:160,siteRadius:60,homeAnchor:'gour-margin'}),
      conditions:Object.freeze({medium:['shallow','deep'],minDepthM:0.10,maxDepthM:0.90}),
      resources:['shallow-prey'],
      activity:activity([0,0.40],[1440,0.40]),
      seasons:Object.freeze({current:'constant-cave'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['safety','forage','rest','travel'],
      actions:['forage','rest','travel','orient','flee','hold'],
      perception:channels(40,60,0),
      fear:response(0.60,0.30,['flee']),
      aggression:response(0.99,0.90,['hold']),
      disturbance:Object.freeze({traffic:'avoid',drawdown:'follow-the-water'}),
      traces:['ring-ripples'],expressions:['rest','swim'],
      nonClaims:['boreal-range','neoteny-and-breeding','lifespan',
                 'shelter-stone','population-density'],
    }),
  /* src/driftlantern.js states the one invented law. No thrust to flee
     with: thresholds above one, as for the machines. */
  driftlantern:P(
    {class:IDENTITY_CLASS.fictional,species:'driftlantern',common:'drift lantern'},
    {
      morphology:'driftlantern',biomes:['hollow'],
      provenance:provenance(PROVENANCE.fictional,PROVENANCE.inferred,
        PROVENANCE.inferred,PROVENANCE.fictional,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:260,siteRadius:90,homeAnchor:'glowcap-troop'}),
      conditions:Object.freeze({medium:['dry','shallow','deep']}),
      resources:['glowcap-troops'],
      activity:activity([0,0.70],[1440,0.70]),
      seasons:Object.freeze({current:'constant-cave'}),
      social:Object.freeze({form:'resource-aggregation',cohort:{min:2,max:3}}),
      drives:['forage','rest','travel'],
      actions:['forage','rest','travel','observe'],
      perception:channels(40,40,0),
      fear:response(2,1.5,[]),aggression:response(2,1.5,[]),
      disturbance:Object.freeze({traffic:'no-response',wind:'carried-off'}),
      traces:['snare-thread'],expressions:['moor','drift'],
      nonClaims:['flight','sting','predation-on-people','reproduction',
                 'lifting-gas','wind-response-is-simulated','population-density'],
    }),
  /* src/carbuncle.js states the one invented law. Shy: 0.45 enters at 97 px,
     6.3 m, where the brown hare's 0.85 enters at 40. `orient` is a baked
     state: it sits up before it goes. */
  carbuncle:P(
    {class:IDENTITY_CLASS.fictional,species:'carbuncle',common:'carbuncle'},
    {
      morphology:'carbuncle',biomes:['hollow'],
      provenance:provenance(PROVENANCE.fictional,PROVENANCE.authored,
        PROVENANCE.inferred,PROVENANCE.fictional,PROVENANCE.medium),
      spatial:Object.freeze({patchRadius:300,siteRadius:110,homeAnchor:'geode'}),
      conditions:Object.freeze({medium:['dry']}),
      resources:['crystal-cover'],
      activity:activity([0,0.50],[1440,0.50]),
      seasons:Object.freeze({current:'constant-cave'}),
      social:Object.freeze({form:'solitary-current-proof',cohort:{min:1,max:1}}),
      drives:['safety','rest','observe','travel'],
      actions:['rest','observe','travel','orient','flee','hold'],
      perception:channels(160,180,90),
      fear:response(0.45,0.22,['orient','flee']),
      aggression:response(0.99,0.90,['hold']),
      disturbance:Object.freeze({traffic:'avoid',noise:'avoid'}),
      traces:['paw-print'],expressions:['form','lope','orient'],
      nonClaims:['stone-as-treasure','luck-or-wealth','chronicle-species',
                 'lit-floor','reproduction','population-density'],
    }),
  colossus:P(
    {class:IDENTITY_CLASS.fictional,species:'colossus',common:'colossus'},
    machine('colossus',520,260,['survey','rest','travel'],['meadow-thermal','meadow-substrate'])),
  strider:P(
    {class:IDENTITY_CLASS.fictional,species:'strider',common:'strider'},
    machine('strider',620,280,['follow-route','rest','travel'],['meadow-thermal','meadow-substrate'])),
  pilgrim:P(
    {class:IDENTITY_CLASS.fictional,species:'pilgrim',common:'pilgrim'},
    machine('pilgrim',480,220,['attend-court','rest','travel'],['meadow-thermal','meadow-substrate'])),
});

function machine(morphology,patchRadius,siteRadius,actions,resources){
  return {
    morphology,biomes:['meadow'],
    provenance:provenance(PROVENANCE.fictional,PROVENANCE.derived,
      PROVENANCE.fictional,PROVENANCE.fictional,PROVENANCE.medium),
    spatial:Object.freeze({patchRadius,siteRadius,homeAnchor:'route-tradition'}),
    conditions:Object.freeze({medium:['dry'],firmSubstrateMin:0.58}),
    resources,activity:activity([0,0.30],[360,0.44],[720,0.86],[1080,0.56],[1440,0.30]),
    seasons:Object.freeze({current:'curvature-heart-route-tradition'}),
    social:Object.freeze({form:'stigmergic-route-tradition',cohort:{min:1,max:1}}),
    drives:['route-tradition','settle','travel'],
    actions:[...actions,'approach-traveller','greet','follow-traveller'],
    perception:channels(180,155,0),
    /* Risk scores are bounded to one. A threshold above one means traveller
       proximity never produces mammalian fear or defence. */
    fear:response(2,1.5,[]),aggression:response(2,1.5,[]),
    disturbance:Object.freeze({machinePressure:'follow-or-reinforce-route',
      repeatedPresence:'observe-without-mammal-emotion'}),
    traces:['pressure-print','compacted-route'],expressions:['idle','walk','greet'],
    nonClaims:['mammal-emotion','hunger','reproduction'],
  };
}

const REQUIRED_FIELDS=Object.freeze([
  'identity','morphology','biomes','provenance','spatial','conditions','resources',
  'activity','seasons','social','drives','actions','perception','fear','aggression',
  'disturbance','traces','expressions','nonClaims',
]);

function validateLifeCatalog(catalog=LIFE){
  const errors=[];
  const provenanceValues=new Set(Object.values(PROVENANCE));
  const identityValues=new Set(Object.values(IDENTITY_CLASS));
  for(const [id,row] of Object.entries(catalog)){
    for(const field of REQUIRED_FIELDS) if(row[field]===undefined)
      errors.push(`${id}.${field} is required`);
    if(!identityValues.has(row.identity?.class))errors.push(`${id}.identity.class is invalid`);
    for(const [claim,value] of Object.entries(row.provenance||{}))
      if(!provenanceValues.has(value))errors.push(`${id}.provenance.${claim} is invalid`);
    for(const resource of row.resources||[])
      if(!RESOURCE_GUILDS[resource])errors.push(`${id}.resources references ${resource}`);
    const actions=new Set(row.actions||[]);
    if(actions.size!==(row.actions||[]).length)errors.push(`${id}.actions contains duplicates`);
    if(!actions.size)errors.push(`${id}.actions is empty`);
    for(const drive of row.drives||[])if(!actions.has(drive)&&!DRIVE_ACTIONS[drive])
      errors.push(`${id}.drives references unmapped drive ${drive}`);
    if(!(row.expressions||[]).length)errors.push(`${id}.expressions is empty`);
    for(const name of ['fear','aggression']){
      const q=row[name];
      if(q&&q.enter<q.clear)errors.push(`${id}.${name} enter must be >= clear`);
      for(const action of q?.actions||[])
        if(!actions.has(action))errors.push(`${id}.${name} references missing action ${action}`);
    }
    if(row.identity?.class===IDENTITY_CLASS.person&&id!=='traveller'&&!row.culture)
      errors.push(`${id}.culture is required for residents`);
    if(row.identity?.class===IDENTITY_CLASS.fictional&&
       row.provenance?.behavior!==PROVENANCE.fictional)
      errors.push(`${id}.behavior must declare fictional law`);
    let last=-1;
    for(const knot of row.activity||[]){
      if(knot.minute<last||knot.minute<0||knot.minute>1440)
        errors.push(`${id}.activity must be ordered inside one day`);
      last=knot.minute;
    }
  }
  return errors;
}

function lifeProfile(id){
  const row=LIFE[id];
  if(!row)throw new Error(`unknown life profile '${id}'`);
  return row;
}

function actionResourceIds(profileOrId,action){
  const profile=typeof profileOrId==='string'?lifeProfile(profileOrId):profileOrId;
  const contract=ACTION_AFFORDANCES[action];
  if(!contract)return [];
  if(contract.resources)return contract.resources.filter((id)=>profile.resources.includes(id));
  if(contract.resourceKinds)return profile.resources.filter((id)=>
    contract.resourceKinds.includes(RESOURCE_GUILDS[id]?.kind));
  return [];
}

function actionSiteAffinity(profileOrId,action,site){
  const profile=typeof profileOrId==='string'?lifeProfile(profileOrId):profileOrId;
  const contract=ACTION_AFFORDANCES[action];
  if(!contract)return 0;
  if(contract.medium&&!contract.medium.includes(site?.conditions?.medium))return -1;
  const resources=actionResourceIds(profile,action);
  const requiresResource=!!(contract.resources||contract.resourceKinds);
  if(requiresResource&&!resources.length)return -1;
  const value=resources.reduce((best,id)=>{
    const field=RESOURCE_GUILDS[id]?.field;
    return Math.max(best,field?(site?.resources?.[field]||0):0);
  },0);
  return requiresResource&&value<=0?-1:value;
}

function activityAt(profileOrId,minuteOfDay){
  const row=typeof profileOrId==='string'?lifeProfile(profileOrId):profileOrId;
  const a=row.activity,m=((minuteOfDay%1440)+1440)%1440;
  if(a.length===1)return a[0].value;
  for(let i=1;i<a.length;i++)if(m<=a[i].minute){
    const p=a[i-1],q=a[i],t=(m-p.minute)/Math.max(1,q.minute-p.minute);
    return clamp(lerp(p.value,q.value,t),0,1);
  }
  const p=a[a.length-1],q=a[0],end=q.minute+1440;
  return clamp(lerp(p.value,q.value,(m-p.minute)/Math.max(1,end-p.minute)),0,1);
}

function responseAt(profileOrId,kind,perceivedRisk,active=false){
  const row=typeof profileOrId==='string'?lifeProfile(profileOrId):profileOrId;
  const contract=row[kind];
  if(!contract)return false;
  return active?perceivedRisk>contract.clear:perceivedRisk>=contract.enter;
}

const driveActions=(...actions)=>Object.freeze(actions);
const DRIVE_ACTIONS=Object.freeze({
  safety:driveActions('orient','freeze','flee','hide','submerge','withdraw','hold','display','defend'),
  browse:driveActions('browse'),root:driveActions('root'),forage:driveActions('forage'),
  cache:driveActions('cache'),thermoregulate:driveActions('bask'),
  refuge:driveActions('submerge','float'),rest:driveActions('rest','sit','float'),
  observe:driveActions('observe','survey','attend-court','orient'),
  travel:driveActions('travel','follow-route','pole-punt'),
  duty:driveActions('tend-hearth','inspect-storage','unpack','display','attend-stall','repack',
    'inspect-woodlot','split-fuel','stack-fuel','inspect-trap','tend-rack','check-mooring',
    'inspect-winch','repair-boardwalk','record-water-mark',
    'cut-sward','turn-hay','draw-water','work-cloth'),
  project:driveActions('resume-project','survey','attend-court'),
  'route-tradition':driveActions('survey','follow-route','attend-court'),
  settle:driveActions('rest'),'player-directed':driveActions('player-directed'),
});

function drivePriority(profileOrId,action){
  const row=typeof profileOrId==='string'?lifeProfile(profileOrId):profileOrId;
  const index=row.drives.findIndex((drive)=>drive===action||DRIVE_ACTIONS[drive]?.includes(action));
  return index<0?0:(row.drives.length-index)/Math.max(1,row.drives.length);
}

function seasonModeAt(profileOrId,dayOfYear=172){
  const row=typeof profileOrId==='string'?lifeProfile(profileOrId):profileOrId;
  const modes=row.seasons||{};
  if(modes.current)return modes.current;
  if(modes.winter)return modes.winter; // frostwood's visible season is authoritative
  const day=((Math.floor(dayOfYear)-1)%365+365)%365+1;
  if(day>=90&&day<=273&&modes.warm)return modes.warm;
  if(modes.cool)return modes.cool;
  if(modes.warm)return modes.warm;
  return modes[Object.keys(modes)[0]]||'current';
}

const LIFE_FIELD_READERS=Object.freeze({
  identity:'lifeProfile/compileLifePlans',
  morphology:'life-runtime/materialize',
  culture:'culture/compileResidentPlans',
  biomes:'worldgen/compileLifePlans',
  provenance:'validateLifeCatalog',
  spatial:'worldgen/compileLifePlans',
  conditions:'worldgen/lifeSiteAt',
  resources:'worldgen/resourceWeb',
  activity:'activityAt/life-session',
  seasons:'seasonModeAt/life-session',
  social:'worldgen/compileLifePlans',
  drives:'drivePriority/behavior/life-session',
  actions:'behavior/chooseAction',
  perception:'behavior/observeActor',
  fear:'responseAt/behavior',
  aggression:'responseAt/behavior',
  disturbance:'disturbance/speciesResponses',
  traces:'life-runtime/stepActor',
  expressions:'life-runtime/expressionIntent',
  nonClaims:'validateLifeCatalog',
});

/* Which bodies a world may have to draw. LIFE decides where a profile lives,
   so the atlas asks here and keeps no second roster. */
const morphologiesIn=(biome)=>Object.freeze([...new Set(
  Object.values(LIFE).filter((p)=>p.biomes.includes(biome))
    .map((p)=>p.morphology))]);

export {
  ACTION_AFFORDANCES, DRIVE_ACTIONS, IDENTITY_CLASS, LIFE, LIFE_FIELD_READERS, LIFE_NON_GOALS,
  PROVENANCE, REQUIRED_FIELDS, RESOURCE_GUILDS, activityAt, drivePriority,
  actionResourceIds, actionSiteAffinity, lifeProfile, morphologiesIn, responseAt,
  seasonModeAt, validateLifeCatalog,
};
