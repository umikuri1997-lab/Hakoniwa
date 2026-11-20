/* Biome plans, placement lattices, sprite tiers and habitat niches, as pure
   tables. makeWorldGen in worldgen.js composes them through the stages in
   src/world/. See docs/MEADOW.md, docs/SWAMP.md, docs/CANON.md. */
import { SURF } from './surface.js';

const BIOMES={
  boreal:{
    scene   :'frostwood',
    /* canopy cover of a life site: base share of stand structure, closing
       toward a driver field where one is named */
    canopy  :{by:'rim',base:0.72,gain:0.28},
    /* water: which lake field the world uses. `warped` is a threshold on a
       domain-warped fbm, `basins` a lattice of cosine bowls, `karst` the swamp
       chain, `oasis` one deflation pool. dry/deep are the traversal surfaces. */
    water   :'warped', dry:SURF.snow, deep:SURF.water,
    bankStones:true,
    cultures:['boreal-hearth-market'],
    ring    :['clearing','grove','bay','cairn','clearing','grove'],
    common  :{x:0, y:0, r:190},
    cabins  :true,
    steading:false,
    worldTrail:true,
    ground  :null,
    portals :[{id:'meadow',to:'meadow',returnId:'frostwood',
               portalY:1400,axis:'y',sign:-1},
              /* The way down. Earth folk live under the forest floor. */
              {id:'hollow',to:'hollow',returnId:'frostwood',
               portalY:-1400,axis:'y',sign:-1}],
    lat     :62,
  },
  meadow:{
    scene   :'meadow',
    canopy  :{base:0.42},
    water   :'basins', dry:SURF.snow, deep:SURF.water,
    bankStones:true,
    /* Circulation is one fitted-stone field: the world trail takes the pond
       court's paving sampler, so the junction needs no cap or seam. */
    pavedTrail:true,
    /* Tall flora gathers into stands with a lone-tree floor; shrubs bloom in
       groups. docs/DECISIONS.md. */
    stand   :{gate:3.0,floor:0.10},
    shrubPatch:true,
    cultures:['meadow-steading-commons'],
    /* No grove: a grove is birch closing in, and no birch grows here. */
    ring    :['clearing','bay','cairn','bay','clearing'],
    /* Flat (RELIEF in src/world/terrain.js). Measured: the largest value at
       which terrain lambert does not cross a grass rung boundary over open
       meadow. */
    relief  :0.22,
    /* The coarse patch field is the snowfield's drifts. docs/MEADOW.md caps
       sward colour noise at ±0.030. */
    patch   :0,
    /* Off the origin, so you arrive at the portal and walk to the hamlet.
       600 px is about two screens at the default resolution. */
    common  :{x:null, y:600, r:200},
    cabins  :false,
    steading:true,
    pondCourt:true,
    worldTrail:true,

    ground  :{[SURF.snow]:SURF.sward, [SURF.trail]:SURF.dust,
              [SURF.shelf]:SURF.pond, [SURF.water]:SURF.pond,
              [SURF.cap]:SURF.stone},
    /* The hamlet's authored intent: trail side, position along it, house
       size. The offsets are a request; src/world/siting.js resolves them.
       Measured failure: taken as answers they put the windpump 30 px from a
       house of half-width 57.

       Spacing: a house is 115 px wide against a 480 px frame, so six in a
       screen is a terrace. At ~190 px apart along the trail one or two are in
       shot. */
    slots   :[
      {kind:'house',   side:-1, dy:-250, off:118, vari:0},
      {kind:'house',   side:-1, dy:-60,  off:156, vari:1},
      {kind:'house',   side:-1, dy:130,  off:118, vari:2},
      {kind:'house',   side:+1, dy:-140, off:132, vari:2},
      {kind:'house',   side:+1, dy:70,   off:162, vari:0},
      {kind:'pump',    side:+1, dy:40,   off:168},
      {kind:'pavilion',side:+1, dy:270,  off:132, vari:0},
      {kind:'derelict',side:-1, dy:-300, off:190},
      /* The stork's pole stands clear of the roofs, at the north end across
         the trail from the derelict. src/steading.js owns it. */
      {kind:'nestPole',side:+1, dy:-300, off:176},
    ],
    portals :[
      {id:'frostwood',to:'frostwood',returnId:'meadow',
       portalY:0,axis:'y',sign:-1},
      {id:'swamp',to:'swamp',returnId:'meadow',
       portalY:1600,axis:'y',sign:1},
    ],
    lat     :38,
  },
  swamp:{
    scene   :'swamp',
    canopy  :{by:'hydroperiod',base:0.46,gain:0.54},
    water   :'karst', dry:SURF.peat, deep:SURF.swampWater,
    cultures:['swamp-water-road'],
    /* Trail clearance for tall and low flora, beyond PATHW. */
    trailClear:{tall:36,low:14},
    ring    :['bay','clearing','bay','cairn','bay'],
    common  :{x:null,y:520,r:220},
    cabins  :false,
    steading:false,
    swampSettlement:true,
    swampLakehouse:true,
    /* pathX still anchors portals and the landing. The swamp paints and
       clears no world-trail corridor. */
    worldTrail:false,
    ground  :{[SURF.snow]:SURF.peat,[SURF.trail]:SURF.peat,
              [SURF.shelf]:SURF.flooded,[SURF.water]:SURF.swampWater,
              [SURF.cap]:SURF.peat},
    portals :[{id:'meadow',to:'meadow',returnId:'swamp',
               portalY:0,axis:'y',sign:-1},
              {id:'desert',to:'desert',returnId:'swamp',
               portalY:1600,axis:'y',sign:1}],
    lat     :28,
  },
  desert:{
    scene   :'desert',
    canopy  :{base:0.42},
    water   :'oasis', dry:SURF.sand, deep:SURF.water,
    /* Two households share one pool. The first package is the plan's `culture`. */
    cultures:['desert-garden-hold','desert-long-road'],
    /* No grove and no clearing: the ground carries no stand. The oasis is not
       on this ring; src/world/dunes.js places it against the common. */
    ring    :['cairn','cairn','cairn','cairn','cairn'],
    /* The dune field (src/world/dunes.js) carries this world's relief. The
       base term is the pavement's low undulation, kept small for the meadow's
       reason. */
    relief  :0.30,
    patch   :0,
    common  :{x:null,y:640,r:210},
    cabins  :false,
    steading:false,
    desertHamlet:true,
    desertCamp:true,
    worldTrail:true,
    /* snow is the generic dry ground, trail the worn route, shelf the shallow
       margin. The desert's ground pass states all three itself; portal props,
       habitat windows and the ramp derivation in test/biome.test.mjs read
       this remap. */
    ground  :{[SURF.snow]:SURF.sand,[SURF.trail]:SURF.hamada,
              [SURF.shelf]:SURF.sabkha,[SURF.water]:SURF.pond,
              [SURF.cap]:SURF.hamada,[SURF.stone]:SURF.hamada},
    dunes   :true,
    /* The oasis hamlet's intent. About 300 px of firm pavement either side of
       the route fits three houses. They sit on the corridor: the pool margin
       is salt crust and a wet-season shore. */
    slots   :[
      {kind:'hut', side:-1, dy:-150, off:96,  vari:1},
      {kind:'hut', side:+1, dy:30,   off:104, vari:2},
      {kind:'hut', side:-1, dy:210,  off:92,  vari:0},
      /* The camp sits out along the corridor past the houses, a separate
         settlement. */
      {kind:'tent', side:+1, dy:-560, off:300, vari:1},
      {kind:'tent', side:+1, dy:-390, off:250, vari:0},
    ],
    portals :[{id:'swamp',to:'swamp',returnId:'desert',
               portalY:0,axis:'y',sign:-1}],
    /* 24 N, the subtropical high (descending limb of the Hadley cell). */
    lat     :24,
  },
  /* The Hollow: a dissolution cavern under the Frostwood. docs/HOLLOW.md. */
  hollow:{
    scene   :'hollow',
    /* No sun reaches this world, so it states no latitude. Its light is the
       lamp in SUN.hollow (src/sunlight.js) and SCENES.hollow.light. */
    sunless :true,
    /* Luminous bodies light the floor (src/glow.js). Selects the ground
       painter and the wider placement margin a light needs. */
    glow    :true,
    canopy  :{base:0.30},
    /* Gours: the meadow's cosine bowls. A rimstone pool is a closed basin
       with a level rim, which is what a cosine bowl's contour is. */
    water   :'basins', dry:SURF.cavestone, deep:SURF.gour,
    /* Surfaces the painter writes beyond the `ground` remap: the floor and
       the wall under crystal light, the wall, the top of the rock.
       test/biome.test.mjs reads this to derive the ramps the scene owes. */
    surfaces:[SURF.geode,SURF.geodeHot,SURF.moonfloor,SURF.cliff,SURF.cliffGeode,
              SURF.rockroof],
    cultures:['hollow-earth-folk'],
    /* The rooms, in pixels from the common on the cavern's own metric
       (src/world/cavern.js): a hall, a ring gallery round it, a chamber west,
       east and south, and two passages that cut the rock between hall and
       ring into four blocks. Authored, as a town plan is. */
    cavern  :{hall:380, ring:{r:930,half:92}, passage:46, reach:1090,
              wander:26, portalRoom:135,
              rooms:[{dx:-1100,dy:0,r:300},{dx:1100,dy:0,r:310},{dx:0,dy:940,r:230}],
              /* The Mirror in the hall, the Sump in the east chamber, and
                 small gours on the ring and in the west chamber. */
              pools:[{dx:170,dy:70,rx:120},{dx:1130,dy:30,rx:235},
                     {dx:-650,dy:-690,rx:92},{dx:680,dy:660,rx:92},
                     {dx:-1250,dy:150,rx:76},{dx:-90,dy:1010,rx:84}],
              /* The Heart, in a fairy ring (Tylwyth Teg dance in rings;
                 docs/HOLLOW.md), and the standing stones of the south
                 chamber. `clear` keeps the scatter off a set piece. */
              sets:[{form:'heart',dx:-170,dy:-60,tier:4,kin:6,skirt:34,clear:54},
                    {form:'ring',kind:'glowcap',tiers:[3,4],dx:-170,dy:-60,
                     r:112,n:18,gap:20,clear:9},
                    {form:'ring',kind:'stalagmite',tiers:[4],dx:0,dy:940,
                     r:128,n:9,gap:26,solid:4,clear:16},
                    /* Seas: a `field` stands one body per `pitch` over an
                       ellipse, so its pools of light join into one. The
                       Amethyst Sea fills the west chamber. */
                    {form:'field',kind:'amethyst',tiers:[2,3,3,4],dx:-1080,dy:-50,
                     rx:230,ry:170,pitch:36,solid:3,clear:9},
                    {form:'field',kind:'amethyst',tiers:[2,2,3],dx:-660,dy:660,
                     rx:150,ry:70,pitch:34,solid:3,clear:9},
                    {form:'field',kind:'foxstone',tiers:[2,3,3,4],dx:660,dy:-660,
                     rx:160,ry:72,pitch:28,solid:3,clear:8}]},
    /* Places stand in the rooms, so they are stated, not drawn round a ring:
       the Geode Hall west, the Sump east, the standing stones south, and the
       Heart in the hall. `geode` is where the crystals crowd. */
    ring    :[{kind:'geode',dx:-1100,dy:0,r:270},{kind:'bay',dx:1130,dy:30,r:270},
              {kind:'cairn',dx:0,dy:940,r:190},{kind:'geode',dx:-170,dy:-60,r:140},
              /* on the ring gallery: a second crystal sea south-west, and
                 the Spar Bed north-east, a crust of foxstones */
              {kind:'geode',dx:-660,dy:660,r:200},{kind:'sparbed',dx:660,dy:-660,r:210}],
    /* Low, for the meadow's reason: the floor is one quiet mass and a pool of
       light is the only thing that should cross a rung on it. */
    relief  :0.24,
    patch   :0,
    common  :{x:null,y:560,r:200},
    cabins  :false,
    steading:false,
    /* The earth folk's village (src/hollow-village.js): four houses in an
       arc on the hall's north-east side, open toward the Heart, three lamp
       posts down the trail and the cutter's bench. A slot is a request;
       src/world/siting.js resolves it onto open floor. House order is home
       order (HOLLOW_HOMES in src/culture.js). */
    hollowVillage:true,
    slots   :[
      {kind:'capHouse', side:+1, dy:-128, off:66,  vari:0},
      {kind:'capHouse', side:+1, dy:-104, off:150, vari:2},
      {kind:'capHouse', side:+1, dy:-62,  off:226, vari:1},
      {kind:'capHouse', side:+1, dy:-14,  off:300, vari:0},
      {kind:'lampPost', side:-1, dy:-170, off:27},
      {kind:'lampPost', side:+1, dy:-40,  off:27},
      {kind:'lampPost', side:-1, dy:100,  off:27},
      {kind:'cutBench', side:+1, dy:-34,  off:158},
    ],
    worldTrail:true,
    trailClear:{tall:16,low:6},
    ground  :{[SURF.snow]:SURF.cavestone,[SURF.trail]:SURF.rimstone,
              [SURF.shelf]:SURF.gour,[SURF.water]:SURF.gour,
              [SURF.cap]:SURF.rimstone,[SURF.stone]:SURF.cavestone},
    portals :[{id:'frostwood',to:'frostwood',returnId:'hollow',
               portalY:0,axis:'y',sign:-1}],
  },
};
const LAYERS=[
  /* Sparser worlds get a bigger cell, not a rejection rate: rejection keeps
     the survivors' spacing and punches holes in it.
     `jit` is the fraction of its cell a sample may wander in. At 1 (the
     default) adjacent-cell samples can land arbitrarily close: a 35 px
     lattice measures a nearest-neighbour minimum of 7.8 px. At 0.55 the axis
     separation is at least cell*(1-jit).
     The desert's tall layer is the sparsest: nearly three times the forest's
     cell, with jitter held down. */
  {cell:35,cells:{swamp:64,meadow:50,desert:96,hollow:52},
   jit:{meadow:0.55,desert:0.60,hollow:0.70},
   kinds:['birch','spruce','snag','palm','meadowTree','cypress','tupelo',
          'datePalm','acacia','stalagmite','foxstone'],tall:true},
  /* Crystal groups on their own lattice: they are rarer than the columns and
     must not compete with them for a cell. */
  {cell:62,jit:{hollow:0.80},kinds:['amethyst'],tall:true},
  {cell:300,kinds:['stranglerFig'],tall:true},
  {cell:26,cells:{swamp:48},kinds:['bramble','reed','shrub','buttonbush','pickerel','glowcap','glowlet'], tall:false},
  {cell:104, kinds:['log'],                                       tall:false, log:true},
  /* The margin gets its own lattice. Measured on a pond of 84x42 px: a 14 px
     shore band catches about two cells of the 48 px shrub layer and ten at
     22 px. Worlds with no swamp species drop the layer (`layers` in
     src/world/terrain.js). */
  {cell:22, kinds:['swampRose'],                                  tall:false},

  /* Ground cover gets the spacing floor too: at full-cell jitter two tufts
     land a measured 0.8 px apart. */
  {cell:30,cells:{swamp:46,meadow:34,desert:40,hollow:38},jit:{meadow:0.62},
   kinds:['sward','sedge','duneGrass','dripstub','shard'],                           tall:false, tuft:true},
];

/* Rungs of the sprite ladder each species uses. Measured: below about 45 px a
   birch loses its snow mass (snowRatio 0.09), so the small rungs are unused.
   Tier choices preserve projection scale and minimum readable crowns; open
   meadow landmarks may use larger rungs than a dense boreal stand. */
const TIERS={birch:[3,3,4,4],spruce:[3,3,4,4],snag:[3],bramble:[2,2,3],reed:[4,4,5],log:[0,0,1],
             palm:[4,5,5],sward:[2,2,3],shrub:[2,3],meadowTree:[4,4,5],
             cypress:[3,4,4],tupelo:[3,4],stranglerFig:[4,5],buttonbush:[2,3],
             pickerel:[2,3],sedge:[2,2,3],swampRose:[2,2,3],
             /* The two large rungs only: both are landmarks. */
             datePalm:[4,5,5],acacia:[4,5],duneGrass:[2,2,3],
             glowcap:[2,2,3,3,4],stalagmite:[2,3,3,4],amethyst:[2,3,3,4],
             glowlet:[1,2],dripstub:[1,1,2],heartstone:[4],
             foxstone:[2,3,3,4],shard:[1,1,2]};

/* Invariant: every layer kind needs a HABITAT row; test/biome.test.mjs enforces
   coverage. elFloor is the additive elevation floor (hostBase in
   src/world/placement.js). */
const HABITAT={
  /* Conifers carry snow as mass and give the stand its silhouette. Weighted
     up. */
  spruce :{biome:'boreal', water:[13,36], el:[-0.34,0.20],               w:1.55},
  birch  :{biome:'boreal', water:[10,32], el:[-0.20,0.25], elFloor:0.55, w:1.00},
  /* Rare: one in twenty at most. */
  snag   :{biome:'boreal', water:[16,38], el:[-0.10,0.32],               w:0.055},
  /* Measured failure: 865 bramble clumps against 146 trees is a carpet of
     scrub. */
  bramble:{biome:'boreal', water:[ 3,26],                  elFloor:1,    w:0.16},
  /* Measured: at 0.55, three deadfalls per screen against the snag's one
     every ten. */
  log    :{biome:'boreal', water:[16,40],                  elFloor:1,    w:0.035},
  /* Habitat is piecewise across the waterline, so it is two functions.
     Phragmites australis is cosmopolitan: boreal, meadow and the oasis's
     fresh margin all carry it. */
  reed   :{biome:'both',exclude:['swamp','hollow'],wet:(dL)=>dL<4?1:0,dry:(dW)=>dW<2?0.6:0},

  /* ── the sun-meadow ──────────────────────────────────────────────────────
     Palm near water but not in it; sward everywhere, up to the shore; shrub
     with the sward; meadow tree on drier, higher ground. */
  sward     :{biome:'meadow', water:[ 2,40], el:[-0.40,0.60], elFloor:0.72, w:0.78},
  shrub     :{biome:'meadow', water:[ 5,26],                  elFloor:1,    w:0.22},
  palm      :{biome:'meadow', water:[ 6,30], el:[-0.30,0.40], elFloor:0.45, w:0.34},
  meadowTree:{biome:'meadow', water:[14,40], el:[-0.05,0.45], elFloor:0.50, w:0.24},
  /* Hydroperiod and depth are the swamp's placement axes. The fixed frame is
     high water. */
  cypress   :{biome:'swamp',hydroperiod:[0.56,1.00],depth:[0.00,0.72],w:0.58},
  tupelo    :{biome:'swamp',hydroperiod:[0.72,1.00],depth:[0.16,1.10],w:0.32},
  /* Ficus aurea is FAC, of strand swamps and wet hammock margins: stable
     hummocks, out of persistent standing water. */
  stranglerFig:{biome:'swamp',hydroperiod:[0.24,0.72],depth:[0.00,0.12],w:0.30},
  buttonbush:{biome:'swamp',hydroperiod:[0.36,0.86],depth:[0.00,0.30],w:0.18},
  pickerel  :{biome:'swamp',hydroperiod:[0.62,0.98],depth:[0.02,0.38],w:0.30},
  sedge     :{biome:'swamp',hydroperiod:[0.32,0.82],depth:[0.00,0.26],w:0.28},
  /* Rosa palustris (obligate wetland) roots on the bank, so it is the one
     swamp species also placed by distance to the shore. Depth gates the
     water; the two functions thin it over 16 px inland and 4 px out, piecewise
     as `reed` is. */
  swampRose :{biome:'swamp',hydroperiod:[0.28,0.90],depth:[0.00,0.16],
              dry:(dW)=>dW<16?0.90*(1-dW/16)+0.10:0,
              wet:(dL)=>dL<4?0.34:0},

  /* ── THE DESERT ────────────────────────────────────────────────────────────
     `sand` is the dune-cover window a species tolerates: the desert's axis,
     as hydroperiod is the swamp's. `water` still gates the date palm, a
     wetland plant that lives at the oasis. */
  datePalm :{biome:'desert', sand:[0,0.02], water:[3,52], elFloor:1, w:1.05},
  /* A taproot frees the acacia from the pool. It wants firm pavement and
     stands alone, so the weight is low. */
  acacia   :{biome:'desert', sand:[0,0.34], water:[26,900], elFloor:1, w:0.24},
  /* Stipagrostis outgrows burial, so its window is moving sand. */
  duneGrass:{biome:'desert', sand:[0.30,1.00], water:[6,900], elFloor:1, w:0.62},

  /* ── THE HOLLOW ────────────────────────────────────────────────────────────
     The axis is damp, read as `hydroperiod` off the analytic pool field (0.11
     on open floor, 0.45 at a waterline). Analytic on purpose: a luminous body
     is asked for by every chunk its light reaches, and a window distance to
     water differs between two chunks. `depth` keeps all of them out of the
     water. `wall` is the gain at a cavern wall (src/world/placement.js). */
  /* A fungus fruits on wet floor: weight peaks on a pool's skirt. */
  glowcap   :{biome:'hollow',hydroperiod:[0.02,0.47],depth:[0,0.01],w:0.80},
  glowlet   :{biome:'hollow',hydroperiod:[0.06,0.47],depth:[0,0.01],w:0.66},
  /* Geodes are gas cavities in the dry rock away from the pools. */
  amethyst  :{biome:'hollow',hydroperiod:[0.00,0.30],depth:[0,0.01],w:0.70},
  /* A stalagmite stands under a drip, anywhere the roof leaks. */
  stalagmite:{biome:'hollow', water:[5,22],  elFloor:1, w:0.30, wall:3.2},
  dripstub  :{biome:'hollow', water:[3,16],  elFloor:1, w:0.50},
  /* Pool spar grows under water and stops at the waterline: it stands where
     a pool has drawn back, on the damp skirt. */
  foxstone  :{biome:'hollow',hydroperiod:[0.02,0.47],depth:[0,0.01],w:0.20},
  /* Sparse on open floor; a geode place multiplies them into a pavement
     (src/world/placement.js). */
  shard     :{biome:'hollow', water:[3,16],  elFloor:1, w:0.10},
  /* In no lattice: the plan stands the one Heart. */
  heartstone:{biome:'hollow',hydroperiod:[0,1],depth:[0,0.01],w:0},
};

/* The one answer to "does this kind grow here". src/world/terrain.js narrows
   the placement lattices with it and atlas.js picks the species to
   synthesise. */
const growsIn=(biome,kind)=>{
  const h=HABITAT[kind]||{},b=h.biome;
  return !h.exclude?.includes(biome)&&(b==='both'||b===biome);
};

export { BIOMES, HABITAT, LAYERS, TIERS, growsIn };
