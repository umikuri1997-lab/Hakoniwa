import { clamp, lerp } from './math.js';
import { RNG } from './rng.js';
import { aoPass, barkPass, canopyPass, droopPass, grow, LIGHT, newSprite, SNOW, snowPass, stampDisc, THICK_PX, trimSprite } from './sprite.js';
/* Crown k and LAI come from the table the canopy ramp is derived from, so leaf
   colour and leaf amount change together. */
import { CANOPY } from './sunlight.js';
import { MINERAL } from './speleo.js';

/* BOTANY stores measured distributions; SPECIES stores growth grammars. grow
   conserves fork area and makeTree samples one realization. */

const SPECIES_H={ birch:0.300, spruce:0.335, snag:0.255, bramble:0.088, reed:0.048,
                  palm:0.250, meadowTree:0.267, shrub:0.163, sward:0.119,
                  cypress:0.320,tupelo:0.280,stranglerFig:0.310,buttonbush:0.125,
                  pickerel:0.070,sedge:0.052,swampRose:0.116,
                  /* Source: Phoenix dactylifera 15-25 m, Vachellia tortilis
                     4-15 m, Stipagrostis pungens tussocks 0.4-1.0 m. */
                  datePalm:0.270, acacia:0.180, duneGrass:0.075,
                  /* The Hollow. glowcap: a luminous agaric at knee to chest
                     height, 0.6-1.6 m. INVENTED scale: the real ones are 3 cm
                     (docs/HOLLOW.md), and 3 cm is a fifth of a pixel.
                     stalagmite 1.6-3.2 m and amethyst groups 1.1-2.2 m sit
                     inside measured ranges. glowlet and dripstub are
                     legibility floors. */
                  glowcap:0.105, stalagmite:0.220, amethyst:0.150, heartstone:0.260,
                  glowlet:0.062, dripstub:0.070,
                  /* foxstone: spar groups 0.5-1.25 m. INVENTED scale: measured
                     points are 2-15 cm, 40 cm at the largest. shard is a
                     legibility floor: points a hand high, drawn at 5-7 px. */
                  foxstone:0.105, shard:0.060 };
/* Source: Phoenix canariensis, 38 N, typically 10-20 m; 15/18 of the birch
   reference gives SPECIES_H.palm=0.250. See docs/MEADOW.md.
   Invariant: trees use the projection's compressed scale; sward and shrubs use
   life-scale legibility floors. test/biome.test.mjs checks placed heights. */

/* Source: da Vinci area conservation; Fagus crenata and Abies homolepis branch
   angles; McMahon elastic similarity. STYLE_WIDTH is an explicit stylization. */
const DEG=Math.PI/180;
const STYLE_WIDTH=1.34;      /* stylisation, applied openly on top of botany */
const BOTANY={
  birch : {alpha:{m:2.05,s:0.26}, branch:{m:(90-30.5)*DEG,s:15.0*DEG,lo:14*DEG,hi:82*DEG},
           crownR:{m:0.63,s:0.07}, crownW:{m:0.55,s:0.09}, taper:0.62},
  spruce: {alpha:{m:2.20,s:0.20}, branch:{m:(90-14.7)*DEG,s:7.8*DEG,lo:52*DEG,hi:90*DEG},
           crownR:{m:0.80,s:0.06}, crownW:{m:0.32,s:0.05}, taper:0.55},
  snag  : {alpha:{m:2.30,s:0.30}, branch:{m:(90-24)*DEG,s:16.0*DEG,lo:14*DEG,hi:84*DEG},
           crownR:{m:0.48,s:0.10}, crownW:{m:0.34,s:0.08}, taper:0.50},
  bramble:{alpha:{m:1.70,s:0.30}, branch:{m:(90-8)*DEG,s:22.0*DEG,lo:20*DEG,hi:88*DEG},
           crownR:{m:0.92,s:0.05}, crownW:{m:1.25,s:0.18}, taper:0.70},
  reed  : {alpha:{m:1.80,s:0.20}, branch:{m:(90-72)*DEG,s:9.0*DEG,lo:6*DEG,hi:40*DEG},
           crownR:{m:0.95,s:0.04}, crownW:{m:0.42,s:0.08}, taper:0.55},
  bough : {alpha:{m:2.05,s:0.26}, branch:{m:(90-28)*DEG,s:16.0*DEG,lo:14*DEG,hi:84*DEG},
           crownR:{m:0.95,s:0.04}, crownW:{m:1.6,s:0.2},  taper:0.62},
  /* Source: Tomlinson, Botanical Journal of the Linnean Society 151:5-14
     (2006). Palms lack secondary thickening, so an unbranched trunk has
     taper 0. */
  palm  : {alpha:{m:2.20,s:0.10}, branch:{m:90*DEG,s:6.0*DEG,lo:64*DEG,hi:102*DEG},
           crownR:{m:0.26,s:0.03}, crownW:{m:0.50,s:0.05}, taper:0.0},

  /* Date palm: the palm's untapering stem, taller, under a smaller and more
     upright crown. */
  datePalm:{alpha:{m:2.20,s:0.08}, branch:{m:90*DEG,s:5.0*DEG,lo:70*DEG,hi:104*DEG},
            crownR:{m:0.19,s:0.02}, crownW:{m:0.34,s:0.04}, taper:0.0},
  /* Vachellia tortilis: a wide flat crown on a tall bare bole. A shallow
     crownR against the widest crownW in the table. */
  acacia:{alpha:{m:2.10,s:0.22}, branch:{m:(90-68)*DEG,s:11.0*DEG,lo:4*DEG,hi:44*DEG},
          crownR:{m:0.26,s:0.04}, crownW:{m:2.35,s:0.18}, taper:0.54},
  /* Tussock grass: the sward's architecture with fewer, stiffer, longer
     blades. */
  duneGrass:{alpha:{m:1.90,s:0.18}, branch:{m:(90-58)*DEG,s:14.0*DEG,lo:10*DEG,hi:60*DEG},
             crownR:{m:0.92,s:0.05}, crownW:{m:0.54,s:0.09}, taper:0.50},

  /* Source: Hasenauer, Forest Ecology and Management 96:197-206 (1997),
     UNVERIFIED lead. Wider crown ratios follow reduced lateral shading. */
  meadowTree:{alpha:{m:2.05,s:0.24}, branch:{m:(90-34)*DEG,s:15.0*DEG,lo:16*DEG,hi:84*DEG},
              crownR:{m:0.72,s:0.06}, crownW:{m:0.92,s:0.10}, taper:0.58},
  /* Flowering shrub: bramble's architecture with fewer, longer, straighter
     stems and a domed crown. */
  shrub :{alpha:{m:1.85,s:0.26}, branch:{m:(90-22)*DEG,s:19.0*DEG,lo:18*DEG,hi:86*DEG},
          crownR:{m:0.86,s:0.06}, crownW:{m:1.05,s:0.14}, taper:0.66},
  /* Source: informal grassland-management range, 0.5-1.5 m. Sward stays
     life-scale: its height against the traveller is legible. */
  sward :{alpha:{m:1.80,s:0.20}, branch:{m:(90-64)*DEG,s:12.0*DEG,lo:8*DEG,hi:52*DEG},
          crownR:{m:0.94,s:0.04}, crownW:{m:0.62,s:0.10}, taper:0.52},
  /* Source: cypress is an excurrent conifer; tupelo is a broad-crowned swamp
     hardwood. Ratios are informal morphology authorities. */
  cypress:{alpha:{m:2.18,s:0.20},branch:{m:(90-20)*DEG,s:9*DEG,lo:48*DEG,hi:90*DEG},
           crownR:{m:0.78,s:0.06},crownW:{m:0.38,s:0.06},taper:0.54},
  tupelo:{alpha:{m:2.04,s:0.22},branch:{m:(90-37)*DEG,s:14*DEG,lo:18*DEG,hi:82*DEG},
          crownR:{m:0.68,s:0.07},crownW:{m:0.70,s:0.10},taper:0.60},
  /* Source: Ficus aurea reaches 20 m, with a broad crown on fused host and
     pillar roots. Crown ratios are informal morphology authorities; the
     aerial-root count is on the SPECIES row. */
  stranglerFig:{alpha:{m:1.92,s:0.20},branch:{m:(90-40)*DEG,s:16*DEG,lo:16*DEG,hi:84*DEG},
                crownR:{m:0.66,s:0.06},crownW:{m:1.02,s:0.11},taper:0.64},
  buttonbush:{alpha:{m:1.84,s:0.24},branch:{m:(90-25)*DEG,s:18*DEG,lo:18*DEG,hi:86*DEG},
              crownR:{m:0.88,s:0.05},crownW:{m:1.02,s:0.14},taper:0.66},
  pickerel:{alpha:{m:1.78,s:0.18},branch:{m:(90-70)*DEG,s:10*DEG,lo:7*DEG,hi:42*DEG},
            crownR:{m:0.95,s:0.03},crownW:{m:0.48,s:0.07},taper:0.50},
  /* Source: Rosa palustris, an OBL shrub of pond and swamp margins, 1-2.5 m.
     Arching canes from the base: wide branch angles, little taper, a reach
     wider than its height. */
  swampRose:{alpha:{m:1.72,s:0.26},branch:{m:(90-48)*DEG,s:20*DEG,lo:22*DEG,hi:88*DEG},
             crownR:{m:0.92,s:0.05},crownW:{m:1.18,s:0.16},taper:0.72},
  sedge:{alpha:{m:1.78,s:0.18},branch:{m:(90-66)*DEG,s:11*DEG,lo:8*DEG,hi:48*DEG},
         crownR:{m:0.95,s:0.03},crownW:{m:0.58,s:0.08},taper:0.50}
};

/* Invariant: each species owns a permanent RNG seed. A shared atlas RNG makes an
   inserted species re-roll every existing tree and baseline. */
/* Quartz: a shaft under faces 38.2 degrees from its axis (src/speleo.js). */
const QUARTZ={apex:38.2,shaft:true};
const SPECIES={
  /* Fewer, longer, thicker branches than nature: authored for legibility. */
  birch:{
    seed:0x8137a1, ramp:'birch', sMin:0.24, sMax:1.0, bark:0.105, ao:0.30, snow:0.90, clump:0.72,
    /* Measured failure: pad=0 sizes the canvas from crownW alone; grow() and
       atlas snow reach write past the box, so stampDisc drops limbs and the
       trimmed silhouette has a flat vertical cut. 1.1 is the smallest pad
       that clears side contact across 48 atlas seeds × placed tiers. */
    pad:1.1,
    cfg:{maxDepth:4,twigDepth:3,taper:0.72,flare:0.50,flareLen:0.10,curl:0.42,upBias:0.34,
         wobble:0.045,trunkKids:7,kidsMin:2,kidsMax:3,clearBole:0.30,
         angMin:0.36,angMax:0.82,lenMin:0.56,lenMax:0.94}
  },
  /* `droop` is the pendant-dark fringe (droopPass in src/sprite.js), highest
     here: whorls stacked with air under each one. */
  spruce:{
    seed:0x5c2ce7, ramp:'twig', sMin:0.06, sMax:0.52, bark:0, ao:0.26, snow:1.05, clump:0.95, reach:3,
    conifer:true, droop:0.16, droopLen:2,
    cfg:{maxDepth:2,twigDepth:1,taper:0.72,flare:0,curl:0.34,upBias:-0.16,
         wobble:0.10,trunkKids:0,kidsMin:1,kidsMax:2,clearBole:0.3,
         angMin:0.30,angMax:0.72,lenMin:0.34,lenMax:0.55,
         whorlDensity:0.150,spread:0.42,falloff:1.15,baseT:0.20,
         droopMin:0.14,droopMax:0.46}
  },
  /* Dead standing timber: dark, angular, snow-shedding. */
  snag:{
    seed:0x51a6b2, ramp:'warm', sMin:0.02, sMax:0.66, bark:0.014, ao:0.44, snow:0.62, clump:0.6,
    cfg:{maxDepth:2,twigDepth:2,taper:0.86,flare:0.60,flareLen:0.10,curl:1.05,upBias:0.04,
         wobble:0.090,trunkKids:8,kidsMin:1,kidsMax:2,clearBole:0.26,
         angMin:0.55,angMax:1.30,lenMin:0.16,lenMax:0.34}
  },
  bramble:{
    seed:0xb7a3c9, ramp:'twig', sMin:0.02, sMax:0.58, bark:0, ao:0.18, snow:0.55, clump:0.35, reach:4,
    cfg:{maxDepth:4,twigDepth:2,taper:0.72,flare:0.30,flareLen:0.22,curl:1.7,upBias:-0.08,
         wobble:0.19,trunkKids:6,kidsMin:2,kidsMax:4,clearBole:0.10,
         angMin:0.60,angMax:1.45,lenMin:0.46,lenMax:0.82}
  },
  /* Blades start two pixels wide and taper, so neighbours touch near the
     base. One-pixel strokes read as scattered dots. */
  reed:{
    seed:0x2eed44, ramp:'twig', sMin:0.16, sMax:0.84, bark:0, ao:0.08, snow:0.42, clump:0.25, reach:4,
    cfg:{maxDepth:1,twigDepth:2,taper:0.50,flare:0.45,flareLen:0.30,curl:1.0,upBias:0,
         wobble:0.08,trunkKids:6,kidsMin:0,kidsMax:1,clearBole:0.08,
         angMin:0.14,angMax:0.42,lenMin:0.62,lenMax:0.96}
  },

  bough:{
    seed:0xb00a71, ramp:'birch', sMin:0.04, sMax:0.52, bark:0.030, ao:0.34, snow:0.58, clump:1.3,
    cfg:{maxDepth:4,twigDepth:3,taper:0.76,flare:0,curl:0.50,upBias:0.05,
         wobble:0.060,trunkKids:11,kidsMin:2,kidsMax:3,clearBole:0.04,
         angMin:0.42,angMax:1.10,lenMin:0.42,lenMax:0.78}
  },
  /* Source: Halle, Oldeman & Tomlinson (1978): a terminal crown on an
     unbranched stem is Corner's model. Dispatch by model, not species name. */
  palm:{
    seed:0x9a1a03, model:'corner',
    /* ramp is the wood; ramp2 is the deposit (the fronds). Standing forms need
       a >=25 luminance gap from ground, so the trunk uses timber's dark
       half. */
    ramp:'timber', ramp2:'canopy', sMin:0.02, sMax:0.42, bark:0, ao:0.30, snow:0, clump:0,
    /* Measured failure: dMin=0.10 makes canopy rung 0 unreachable after the
       deposit transfer. Full [0,1] exposes every rung; test/biome.test.mjs
       checks use. */
    dMin:0.00, dMax:1.00, vol:1.0, pad:0.16,
    cfg:{maxDepth:0,twigDepth:9,taper:0.0,flare:0.85,flareLen:0.11,curl:0.20,
         upBias:0,wobble:0.014,trunkKids:0,kidsMin:0,kidsMax:0,clearBole:0.98,
         angMin:0,angMax:0,lenMin:0,lenMax:0,

         frondLen:0.38,      // frond length over total height

         frondDroop:0.43,    // tip deflection over frond length (Euler-Bernoulli)

         elevMin:-0.16,      // oldest frond: below horizontal, then it arches
         elevMax:1.30,       // newest frond, 75 deg, out of the spear

         pinna:0.28,         // leaflet length over frond length; sets the count
         pinnaAng:0.70,      // leaflet angle off the rachis, radians
         pinnaStep:2,        // leaflet spacing along the rachis, px
         /* Infructescence: a female P. canariensis carries three to six
            pendulous fruit stalks 1-2 m long below the crown. 1.5 m on a 15 m
            stem is 0.10 of the height. */
         dateLen:0.10, dates:3,
         /* Phyllotaxis, degrees. Bonnet 1754. 360*(1 - 1/phi) in full: the
            Fibonacci fractions need the exact value. Asserted in
            test/biome.test.mjs. */
         divergence:137.50776405,
         scarStep:3}         // drawn internode, px (scarPass)
  },
  /* ── THE DESERT ──────────────────────────────────────────────────────────── */
  datePalm:{
    seed:0xda7e91, model:'corner',
    ramp:'timber', ramp2:'desertCanopy', sMin:0.02, sMax:0.44, bark:0, ao:0.30,
    snow:0, clump:0,
    dMin:0.00, dMax:1.00, vol:1.0, pad:0.14,
    cfg:{maxDepth:0,twigDepth:11,taper:0.0,flare:0.80,flareLen:0.09,curl:0.16,
         upBias:0,wobble:0.010,trunkKids:0,kidsMin:0,kidsMax:0,clearBole:0.985,
         angMin:0,angMax:0,lenMin:0,lenMax:0,
         /* A shorter frond on a taller stem than the canary palm. */
         frondLen:0.29,
         /* It arches less: Euler-Bernoulli tip deflection goes as length^4
            over the second moment of area, and a date frond is shorter and
            stiffer. */
         frondDroop:0.26,
         elevMin:0.10, elevMax:1.42,
         pinna:0.30, pinnaAng:0.62, pinnaStep:2,
         /* More and longer fruit bunches than the ornamental palm. */
         dateLen:0.13, dates:5,
         divergence:137.50776405,
         scarStep:3}
  },
  acacia:{
    seed:0xacac1a, model:'rauh', ramp:'timber', ramp2:'desertCanopy',
    sMin:0.02, sMax:0.48, bark:0.048, ao:0.36,
    dMin:0.00, dMax:1.00, vol:1.0, pad:0.52,
    snow:0, clump:0.30,
    cfg:{maxDepth:6,bud:true,twigDepth:3,taper:0.62,flare:0.52,flareLen:0.14,
         curl:0.40,
         /* Negative up-bias turns each division back toward the horizontal,
            which makes the flat crown. */
         upBias:-0.22,
         wobble:0.048,trunkKids:5,kidsMin:2,kidsMax:3,clearBole:0.10,
         angMin:0.62,angMax:1.34,lenMin:0.54,lenMax:0.94,
         /* A tall bare bole, up to browse height. */
         boleLen:0.62, trunkW:0.095}
  },
  duneGrass:{
    seed:0xd0e64a, ramp:'desertCanopy', ramp2:'desertCanopy',
    /* Legibility floor: the dark half of its ramp, for a value gap against
       the brightest ground in the project. */
    sMin:0.04, sMax:0.52, bark:0, ao:0.12,
    dMin:0.10, dMax:0.62,
    snow:0, clump:0.20, reach:4,
    cfg:{maxDepth:1,twigDepth:2,taper:0.44,flare:0.36,flareLen:0.26,curl:0.72,
         upBias:0.10,wobble:0.09,trunkKids:9,kidsMin:0,kidsMax:1,clearBole:0.06,
         angMin:0.18,angMax:0.66,lenMin:0.58,lenMax:1.00}
  },
  /* Invariant: Rauh broadleaves stop on CHILD_FLOOR via bud:true; maxDepth is
     only a recursion guard. Snow and deposit RNG ordering stays fixed. */
  meadowTree:{
    seed:0x3ea11e, model:'rauh', ramp:'timber', ramp2:'canopy', sMin:0.02, sMax:0.46,
    bark:0.055, ao:0.34,
    dMin:0.00, dMax:1.00, vol:1.0, pad:0.42,   // see the palm's note on dMin
    snow:0, clump:0.62,
    cfg:{maxDepth:6,bud:true,twigDepth:3,taper:0.66,flare:0.44,flareLen:0.12,curl:0.52,upBias:0.20,
         wobble:0.055,trunkKids:6,kidsMin:2,kidsMax:3,clearBole:0.20,
         angMin:0.34,angMax:0.90,lenMin:0.58,lenMax:0.98,
         /* Bole length and trunk radius, as fractions of height. 0.115
            matches the default in makeTree's `else` arm. */
         boleLen:0.66, trunkW:0.115}
  },

  shrub:{
    /* Stems resolve through the vegetation ramp. Measured: on a winter grey
       ramp 18% of the meadow's pixels are snow-shade blue-grey, in the pond's
       value family. */
    seed:0x5b1005, ramp:'canopy', ramp2:'bloom', sMin:0.04, sMax:0.40, bark:0, ao:0.20,
    dMin:0.34, dMax:1.00,
    snow:0.72, clump:0.42, reach:3,
    cfg:{maxDepth:4,twigDepth:2,taper:0.66,flare:0.28,flareLen:0.20,curl:1.15,upBias:0.10,
         wobble:0.15,trunkKids:6,kidsMin:2,kidsMax:3,clearBole:0.12,
         angMin:0.50,angMax:1.25,lenMin:0.48,lenMax:0.86}
  },
  /* Sward: reed's grammar with the blades splayed wider. `snow` is the blade
     mass, so it stays high. */
  sward:{
    /* Blades reach the top of the ramp. sMax 0.44 puts every tuft in the
       bottom three rungs and leaves the light band empty. */
    seed:0x5a12d0, ramp:'grass', ramp2:'grass', sMin:0.30, sMax:1.00, bark:0, ao:0.10,
    /* A three-pixel tuft gets the top two rungs only. */
    dMin:0.72, dMax:1.00,
    snow:0.95, clump:0.28, reach:4,
    cfg:{maxDepth:1,twigDepth:2,taper:0.48,flare:0.40,flareLen:0.30,curl:1.1,upBias:0,
         wobble:0.10,trunkKids:7,kidsMin:0,kidsMax:1,clearBole:0.06,
         angMin:0.16,angMax:0.50,lenMin:0.60,lenMax:0.98}
  },
  cypress:{
    /* Bald cypress owns an excurrent spray grammar (growCypress). */
    seed:0xc7a355,model:'cypress',ramp:'swampWood',ramp2:'swampCanopy',
    sMin:0.02,sMax:0.58,dMin:0,dMax:1,vol:1,bark:0.045,ao:0.34,
    snow:0,clump:0.72,reach:2,droop:0.04,droopLen:2,pad:0.14,
    canopyKLAI:CANOPY.swamp.k*CANOPY.swamp.lai,
    swampBase:{buttress:0.16,knees:3},
    cfg:{trunkW:0.105,leader:0.94,levelStep:5.5,branchSpan:0.44,
         sprayMin:0.030,sprayMax:0.042,leaderSprayStep:0.055,leaderSprayR:0.032}
  },
  tupelo:{
    seed:0x7a9e10,model:'rauh',ramp:'swampWood',ramp2:'swampCanopy',
    sMin:0.02,sMax:0.54,dMin:0,dMax:1,vol:1,bark:0.05,ao:0.36,
    snow:0,clump:0.66,pad:0.28,swampBase:{buttress:0.22,knees:0},
    canopyKLAI:CANOPY.swamp.k*CANOPY.swamp.lai,
    cfg:{maxDepth:6,bud:true,twigDepth:3,taper:0.66,flare:0.72,flareLen:0.17,curl:0.50,upBias:0.16,
         wobble:0.05,trunkKids:6,kidsMin:2,kidsMax:3,clearBole:0.20,
         angMin:0.36,angMax:0.94,lenMin:0.56,lenMax:0.96,
         boleLen:0.64,trunkW:0.125}
  },
  stranglerFig:{
    /* Mature Ficus aurea: host and aerial-root pillars read as one fused
       bole. */
    seed:0xf1ca11,model:'strangler',ramp:'swampWood',ramp2:'swampCanopy',
    sMin:0.02,sMax:0.62,dMin:0,dMax:1,vol:1,bark:0.055,ao:0.38,
    snow:0,clump:0.62,pad:0.58,
    canopyKLAI:CANOPY.swamp.k*CANOPY.swamp.lai*0.92,
    swampBase:{buttress:0.27,knees:0},
    cfg:{maxDepth:6,bud:true,twigDepth:3,taper:0.67,flare:0.86,flareLen:0.22,
         curl:0.54,upBias:0.14,wobble:0.048,trunkKids:7,kidsMin:2,kidsMax:3,
         clearBole:0.24,angMin:0.34,angMax:0.98,lenMin:0.54,lenMax:0.96,
         boleLen:0.68,trunkW:0.155,leafArea:7.2,leafAspect:0.42,leafRag:0.10,
         leafMin:0.050,leafMax:0.078,rootCount:9,rootClear:0.16,rootSpread:1.25}
  },
  buttonbush:{
    seed:0xb07705,ramp:'swampCanopy',ramp2:'swampCanopy',
    sMin:0.04,sMax:0.52,dMin:0.18,dMax:0.92,bark:0,ao:0.22,
    snow:0.76,clump:0.46,reach:3,
    canopyKLAI:CANOPY.swamp.k*CANOPY.swamp.lai*0.55,
    cfg:{maxDepth:4,twigDepth:2,taper:0.64,flare:0.34,flareLen:0.20,curl:1.10,upBias:0.10,
         wobble:0.14,trunkKids:6,kidsMin:2,kidsMax:3,clearBole:0.10,
         angMin:0.48,angMax:1.22,lenMin:0.46,lenMax:0.82}
  },
  pickerel:{
    seed:0x91c4e1,ramp:'swampWood',ramp2:'swampCanopy',
    sMin:0.12,sMax:0.72,dMin:0.42,dMax:1,bark:0,ao:0.10,
    snow:0.82,clump:0.30,reach:3,
    cfg:{maxDepth:1,twigDepth:2,taper:0.50,flare:0.48,flareLen:0.28,curl:0.86,upBias:0,
         wobble:0.07,trunkKids:6,kidsMin:0,kidsMax:1,clearBole:0.08,
         angMin:0.12,angMax:0.38,lenMin:0.64,lenMax:0.96}
  },
  /* The margin plant. Measured failure: a painted duckweed waterline draws an
     unbroken green band at bank luminance and reads as grass over the pond.
     No bloom: the accent budget belongs to the traveller's ochre. A low
     arching thicket in the canopy ramp. */
  swampRose:{
    seed:0x2059e5,ramp:'swampCanopy',ramp2:'swampCanopy',
    sMin:0.06,sMax:0.56,dMin:0.22,dMax:0.96,bark:0,ao:0.18,
    snow:0.80,clump:0.52,reach:3,
    canopyKLAI:CANOPY.swamp.k*CANOPY.swamp.lai*0.42,
    cfg:{maxDepth:3,twigDepth:2,taper:0.70,flare:0.30,flareLen:0.18,curl:1.34,upBias:0.02,
         wobble:0.17,trunkKids:7,kidsMin:2,kidsMax:3,clearBole:0.06,
         angMin:0.58,angMax:1.36,lenMin:0.44,lenMax:0.88}
  },
  sedge:{
    seed:0x5ed6e0,ramp:'swampWood',ramp2:'duckweed',
    sMin:0.10,sMax:0.68,dMin:0.45,dMax:1,bark:0,ao:0.08,
    snow:0.90,clump:0.26,reach:3,
    cfg:{maxDepth:1,twigDepth:2,taper:0.48,flare:0.42,flareLen:0.30,curl:1.10,upBias:0,
         wobble:0.10,trunkKids:7,kidsMin:0,kidsMax:1,clearBole:0.06,
         angMin:0.15,angMax:0.48,lenMin:0.60,lenMax:0.98}
  },
  /* ── THE HOLLOW ───────────────────────────────────────────────────────────
     Deposits and fruit bodies (src/speleo.js). `rigid`: stone does not sway.
     A fruit body does, under a spell's front; the cave's own air is still
     (SCENES.hollow.still). `glow` is the light a body throws on the floor:
     its lamp (LAMP in src/sunlight.js), the share of its height the light
     sits at, and its strength at the foot. */
  glowcap:{
    seed:0x6c0ca9,model:'agaric',ramp:'dripstone',ramp2:'glowcap',
    sMin:0.20,sMax:0.95,dMin:0,dMax:1,snow:0,
    glow:{lamp:'fungus',at:0.80,power:1.15},
    cfg:{cap:[0.80,1.10],pups:2}
  },
  glowlet:{
    seed:0x610e17,model:'agaric',ramp:'caveRock',ramp2:'glowcap',
    sMin:0.30,sMax:0.80,dMin:0,dMax:1,snow:0,
    glow:{lamp:'fungus',at:0.70,power:0.62},
    cfg:{troop:[2,5]}
  },
  stalagmite:{
    seed:0x57a1a6,model:'speleothem',ramp:'dripstone',ramp2:'dripstone',rigid:true,
    /* The resting rung and the one above: a column is lit by the ceiling,
       and calcite at rest is already paler than the floor. */
    sMin:0.30,sMax:0.72,dMin:0,dMax:1,snow:0,
    cfg:{girth:[0.11,0.17],kin:2}
  },
  dripstub:{
    seed:0xd21b57,model:'speleothem',ramp:'dripstone',ramp2:'dripstone',rigid:true,
    sMin:0.30,sMax:0.60,dMin:0,dMax:1,snow:0,
    cfg:{girth:[0.20,0.30],kin:2}
  },
  amethyst:{
    seed:0xa3e741,model:'crystal',ramp:'geodeRock',ramp2:'amethyst',rigid:true,
    sMin:0.30,sMax:0.90,dMin:0,dMax:1,snow:0,
    /* A crystal group shines from its whole body, and harder than a cap:
       it is the brightest thing in the world. */
    glow:{lamp:'crystal',at:1.00,power:2.40},
    cfg:{...QUARTZ,prisms:[4,7],fan:0.95}
  },
  /* Dogtooth spar: a crust of calcite points a pool left when it drew back.
     It gives back the ceiling's light (EMISSION.calcite in src/sunlight.js):
     the crystals' law in grey stone. "Fox" is the old word for a cold light,
     as in foxfire. Count, fan and the 15 degree apex are authored
     (src/speleo.js has the measured angle and why it is not drawn). */
  foxstone:{
    seed:0xf0c57e,model:'crystal',ramp:'dripstone',ramp2:'moonstone',rigid:true,
    sMin:0.30,sMax:0.62,dMin:0,dMax:1,snow:0,
    glow:{lamp:'calcite',at:1.00,power:1.25},
    cfg:{apex:15,prisms:[4,7],fan:0.60,spread:0.18,bare:true}
  },
  /* Crystal points: the floor of a geode hall is paved with them. Too small
     to light the floor; the groups above them do that. */
  shard:{
    seed:0x5a4d21,model:'crystal',ramp:'geodeRock',ramp2:'amethyst',rigid:true,
    sMin:0.30,sMax:0.90,dMin:0,dMax:1,snow:0,
    cfg:{...QUARTZ,prisms:[1,3],fan:0.55,bare:true}
  },
  /* The Heart: one crystal group at 3.8 m, the hall's centre. It grows in no
     lattice: the plan stands it (BIOMES.hollow.cavern.sets). INVENTED scale;
     the largest measured geode crystals are near 1.8 m. */
  heartstone:{
    seed:0x4ea127,model:'crystal',ramp:'geodeRock',ramp2:'amethyst',rigid:true,
    sMin:0.30,sMax:0.90,dMin:0,dMax:1,snow:0,
    glow:{lamp:'crystal',at:1.00,power:3.00},
    cfg:{...QUARTZ,prisms:[7,9],fan:0.80}
  }
};

/* Source: Niklas 1992/1999. A frond is a built-in cantilever; normalized
   Euler-Bernoulli self-weight deflection is (u^4-4u^3+6u^2)/3. */
const droopN=u=>(u*u*u*u-4*u*u*u+6*u*u)/3;

/* Cabinet projection k=1/2 and blade width bound visible fronds by
   N<=1.12/pinna, snapped down to Fibonacci phyllotaxis with floor 5. */
const FIB=[5,8,13,21];
function frondCount(pinna){
  const cap=1.12/pinna;
  let n=FIB[0];
  for(const f of FIB) if(f<=cap) n=f;
  return n;
}

/* Conifer grammar: the triangle comes from the length falloff up the leader,
   not from the branch angles. */
function growConifer(sp,rnd,height,cfg,tilt){
  const cx=sp.ax, base=sp.h-1, lean=(tilt||0)+rnd.range(-0.04,0.04);
  let x=cx, y=base, ang=-Math.PI/2+lean;
  const steps=Math.round(height), ws=height*rnd.range(0.075,0.098);
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    let w=ws*(1-t*0.94);
    if(t<0.10){ const f=1-t/0.10; w*=1+0.55*f*f; }
    stampDisc(sp,x,y,Math.max(0.5,w*0.5),-Math.sin(ang),Math.cos(ang),0.04);
    /* The leader is snow-proof. A radius threshold cannot catch it: the
       leader tapers into the branches' range. */
    { const r=Math.max(0.5,w*0.5), xi=Math.round(x);
      for(let dy=-Math.ceil(r);dy<=Math.ceil(r);dy++)
        for(let dx=-Math.ceil(r);dx<=Math.ceil(r);dx++){
          const xx=xi+dx, yy=Math.round(y)+dy;
          if(xx<0||yy<0||xx>=sp.w||yy>=sp.h) continue;
          if(dx*dx+dy*dy<=r*r+0.3) sp.noSnow[yy*sp.w+xx]=1;
        } }
    ang+=rnd.range(-0.010,0.010);
    x+=Math.cos(ang); y+=Math.sin(ang);
  }
  const nW=Math.max(5,Math.round(height*cfg.whorlDensity));
  const maxLen=height*cfg.spread;
  /* Invariant: no whorl exceeds the one below it. The random factor alone
     breaks the cone. */
  let prevLen=1e9;
  for(let k=0;k<nW;k++){
    const t=cfg.baseT+(0.96-cfg.baseT)*(k/(nW-1));
    const wy=base-height*t, wx=cx+Math.cos(-Math.PI/2+lean)*height*t;
    let len=maxLen*Math.pow(1-t,cfg.falloff)*rnd.range(0.88,1.06);
    len=Math.min(len,prevLen*0.97); prevLen=len;
    if(len<2.2) continue;
    for(const side of [-1,1]){
      const n=len>7?2:1;
      for(let m=0;m<n;m++){
        const droop=rnd.range(cfg.droopMin,cfg.droopMax);
        const a=side>0?droop:Math.PI-droop;
        grow(sp,wx,wy+rnd.range(-0.9,0.9),a,len*rnd.range(0.72,1.0),
             Math.max(1.0,len*0.13),1,cfg,rnd);
      }
    }
  }
}

function drawSmallConifer(sp,rnd,height,tilt){
  const base=sp.h-1, cx=sp.ax;
  const leader=new Uint8Array(sp.w*sp.h);
  const tiers=Math.max(3,Math.round(height/4.6));
  const maxHalf=Math.max(2,Math.round(height*0.30));
  const lean=y=>tilt*(base-y)*0.55;
  /* leader */
  for(let y=base;y>base-height;y--){
    const t=(base-y)/height;
    const x=Math.round(cx+lean(y));
    const w=t>0.80?0:(t>0.45?0:1);
    for(let dx=-w;dx<=w;dx++){
      const xx=x+dx;
      if(xx<0||xx>=sp.w||y<0) continue;
      const i=y*sp.w+xx;
      sp.occ[i]=1; sp.shade[i]=dx<0?0.78:0.34; leader[i]=1;
      sp.rad[i]=1+w; sp.horiz[i]=0.05;
      sp.nx[i]=dx*0.55; sp.ny[i]=0; sp.nz[i]=Math.sqrt(Math.max(0,1-dx*dx*0.30));
    }
  }
  /* Boughs widen downward, each separated by a row of background. */
  for(let k=0;k<tiers;k++){
    const f=(k+1)/tiers;
    /* Lowest bough at 20% height, the BOTANY crown ratio. */
    const y=Math.round(base-height*(0.20+0.74*(1-f)));
    const half=Math.max(1,Math.round(maxHalf*Math.pow(f,0.85)));
    const x0=Math.round(cx+lean(y));
    for(let dx=-half;dx<=half;dx++){
      const droop=Math.round(Math.abs(dx)/Math.max(1,half)*1.6);
      for(let th=0;th<(Math.abs(dx)>half*0.7?1:2);th++){
        const xx=x0+dx, yy=y+droop+th;
        if(xx<0||yy<0||xx>=sp.w||yy>=sp.h) continue;
        const i=yy*sp.w+xx;
        if(sp.occ[i]===2) continue;
        sp.occ[i]=1; sp.shade[i]=dx<0?0.72:0.30;
        sp.rad[i]=1.2; sp.horiz[i]=0.95;
        sp.nx[i]=0; sp.ny[i]=-0.45; sp.nz[i]=Math.sqrt(1-0.2025);
      }
      /* A second snow row on the wider inner boughs: one pixel of snow reads
         as frost. */
      if(Math.abs(dx)<half*0.62){
        const xx2=x0+dx, yy2=y+droop-2;
        if(xx2>=0&&yy2>=0&&xx2<sp.w&&yy2<sp.h&&!leader[yy2*sp.w+xx2]&&rnd.chance(0.55)){
          const i2=yy2*sp.w+xx2;
          if(sp.occ[i2]===0){ sp.occ[i2]=2; sp.shade[i2]=clamp(0.80+rnd.range(0,0.20),0,1);
            sp.ao[i2]=0.9; sp.nx[i2]=0; sp.ny[i2]=-0.25; sp.nz[i2]=0.968; }
        }
      }
      /* the snow line on this bough */
      const xx=x0+dx, yy=y+droop-1;
      if(xx>=0&&yy>=0&&xx<sp.w&&yy<sp.h&&!leader[yy*sp.w+xx]&&rnd.chance(0.95)){
        const i=yy*sp.w+xx;
        sp.occ[i]=2; sp.shade[i]=clamp(0.72+rnd.range(0,0.24),0,1);
        sp.ao[i]=0.86; sp.nx[i]=0; sp.ny[i]=-0.30; sp.nz[i]=0.954;
      }
    }
  }
  /* cap the tip */
  const ty=Math.max(0,base-height+1);
  for(let dy=0;dy<2;dy++){
    const yy=ty+dy, xx=Math.round(cx+lean(yy));
    if(yy<0||yy>=sp.h||xx<0||xx>=sp.w) continue;
    const i=yy*sp.w+xx;
    sp.occ[i]=2; sp.shade[i]=0.95; sp.ao[i]=0.9;
    sp.nx[i]=0; sp.ny[i]=-0.2; sp.nz[i]=0.98;
  }
}

function growPalm(sp,rnd,height,cfg,tilt,alpha){
  const base=sp.h-1, cx=sp.ax, lean=(tilt||0)+rnd.range(-0.03,0.03);

  /* ── the stem ───────────────────────────────────────────────────────────
     The stem climbs all but the frond arch. */
  const arch=height*0.09;                       // how far the newest frond rises
  const stemLen=height-arch;
  const stemW=Math.max(2.2,height*0.075);
  grow(sp,cx,base,-Math.PI/2+lean,stemLen,stemW,0,cfg,rnd);

  /* The apex is the topmost occupied pixel of the drawn stem. Deriving it
     analytically is a second copy of grow()'s integration. */
  let apexY=base, apexX=cx;
  for(let y=0;y<sp.h;y++){
    let hit=-1;
    for(let x=0;x<sp.w;x++) if(sp.occ[y*sp.w+x]===1){ hit=x; break; }
    if(hit>=0){ apexY=y; let x1=hit; for(let x=sp.w-1;x>=0;x--) if(sp.occ[y*sp.w+x]===1){x1=x;break;}
                apexX=(hit+x1)/2; break; }
  }

  /* ── the crown ──────────────────────────────────────────────────────────
     Frond k is the k-th leaf the meristem produced, so k is age: the oldest
     hangs, the newest stands. One index carries azimuth and droop. */
  const fLen=height*cfg.frondLen;
  const N=frondCount(cfg.pinna);
  const DIV=cfg.divergence*DEG;
  /* Invariant: one per-tree phase orients fronds, scars and fruit together.
     Restarting any helix at zero creates identical projection artefacts. */
  const th0=rnd.range(0,Math.PI*2);

  /* Area conservation at the crown: r_stem^a = N * r_petiole^a. Recorded as
     one fork per frond, so tools/trees.mjs recovers the exponent from
     sp.forks as it does for a dicot. */
  const rStem=stemW*0.5;
  const rPet=rStem*Math.pow(N,-1/alpha);
  for(let k=0;k<N;k++) if(sp.forks) sp.forks.push([rStem,rPet,rStem*Math.pow(1-1/N,1/alpha)]);

  for(let k=0;k<N;k++){
    const age=N>1?k/(N-1):0;                    // 0 oldest, 1 newest
    const th=th0+k*DIV;
    const elev=lerp(cfg.elevMin,cfg.elevMax,age)*rnd.range(0.92,1.08);
    /* An older frond droops slightly more; most droop is elastic. */
    const droop=cfg.frondDroop*(1.10-0.20*age)*rnd.range(0.92,1.08);
    /* The newest frond is not yet full length. */
    const len=fLen*rnd.range(0.88,1.05)*(1.02-0.22*age);
    /* Cabinet projection, k = 1/2 (PROJECTION.md): a horizontal vector
       (dx,dz) lands on screen at (dx, dz/2). */
    const ux=Math.sin(th), uz=Math.cos(th)*0.5;
    frond(sp,apexX,apexY,ux,uz,elev,droop,len,rPet,cfg,rnd);
  }

  /* ── the spear ──────────────────────────────────────────────────────────
     The unopened leaf at the apex. It fills the hole in the crown's middle. */
  for(let d=0;d<Math.max(2,Math.round(height*0.045));d++){
    const yy=apexY-d, xx=Math.round(apexX);
    if(yy<0||xx<0||xx>=sp.w) continue;
    const i=yy*sp.w+xx;
    sp.occ[i]=2; sp.shade[i]=0.62; sp.ao[i]=0.94;
    sp.nx[i]=0; sp.ny[i]=-0.30; sp.nz[i]=0.954; sp.rad[i]=1;
  }

  /* Measured failure: crownMass lobes over the drawn fronds fuse the pinnae
     into a green blob with a trunk-shaped hole. A Corner palm's silhouette
     is the frond strokes; pipe area stays on sp.forks. */
  sp.lobes=[];

  const nDate=cfg.dates||0, dLen=Math.max(3,Math.round(height*(cfg.dateLen||0)));
  for(let k=0;k<nDate;k++){
    const th=th0+k*DIV, ux=Math.sin(th), uz=Math.cos(th)*0.5;
    /* Out along the axil's heading, then down. */
    const ox=apexX+ux*rPet*2.2+ux*fLen*0.14, oy=apexY+uz*fLen*0.14+rPet*1.4;
    for(let d=0;d<dLen;d++){
      /* A hanging peduncle is the frond's cantilever: droopN read sideways,
         zero slope at the axil. */
      const u=d/dLen;
      const xx=Math.round(ox+ux*dLen*0.42*droopN(u)), yy=Math.round(oy+d);
      const wide=u>0.20&&u<0.94?1:0;
      for(let dx=-wide;dx<=wide;dx++){
        const px=xx+dx;
        if(px<0||yy<0||px>=sp.w||yy>=sp.h) continue;
        const i=yy*sp.w+px;
        if(sp.occ[i]===1) continue;              // never over the stem
        sp.occ[i]=3; sp.shade[i]=clamp(0.30+0.30*u,0,1); sp.ao[i]=0.55;
        sp.nx[i]=dx*0.4; sp.ny[i]=0.2; sp.nz[i]=Math.sqrt(Math.max(0.04,1-dx*dx*0.16-0.04));
        sp.rad[i]=1; sp.horiz[i]=0.1;
      }
    }
  }

  scarPass(sp,apexY,base,cfg,rStem,th0);

  canopyPass(sp,CROWN_KLAI);
}

function frond(sp,ax,ay,ux,uz,elev,droop,len,rPet,cfg,rnd){
  const steps=Math.max(4,Math.round(len));
  const cosE=Math.cos(elev), sinE=Math.sin(elev), du=1/steps;
  /* Invariant: normalize the projected frond axis before stampDisc. Short
     axes create non-unit normals and false dimming; test/biome.test.mjs
     checks normals. */
  const am=Math.hypot(uz,ux)||1, lax=-uz/am, lay=ux/am;
  for(let i=0;i<=steps;i++){
    const u=i/steps;
    /* Out along the projected heading, up by the insertion angle, down by
       the bending. */
    const out=u*len*cosE;
    const x=ax+ux*out;
    const y=ay-sinE*u*len+uz*out+droop*len*droopN(u);
    const r=Math.max(0.5,rPet*(1-u*0.72));
    /* The rachis is wood with stampDisc's cylinder normal, so it relights. */
    stampDisc(sp,x,y,r,lax,lay,Math.abs(ux));
    if(u<=0.10) continue;                       // the bare petiole
    /* Local tangent: the blade is built across the rachis. */
    const tx=ux*len*cosE*du;
    const ty=-sinE*len*du+uz*len*cosE*du+droop*len*(droopN(u+du)-droopN(u));
    const ta=Math.atan2(ty,tx);
    /* Blade widest about a third of the way out, closing to a point. `pinna`
       also sets the frond count. */
    const shape=Math.sin(Math.min(1,u*1.35)*Math.PI*0.72);
    /* Serration: the half-width steps at pinnaStep, one tooth per leaflet. */
    const tooth=0.74+0.26*((i%cfg.pinnaStep)/Math.max(1,cfg.pinnaStep-1||1));
    const half=len*cfg.pinna*shape*tooth*rnd.range(0.94,1.06);
    for(const side of [-1,1]){
      const a=ta+side*cfg.pinnaAng;
      const ca=Math.cos(a), sa=Math.sin(a);
      /* Invariant: blade shade and GPU lighting derive from the same unit
         normal. The shader ignores `shade`, so do not tune it. */
      const FOLD=0.85, sf=Math.sin(FOLD), cf=Math.cos(FOLD);
      const nx=-Math.sin(ta)*side*sf, ny=Math.cos(ta)*side*sf, nz=cf;
      const ndl=clamp(nx*LIGHT.x+ny*LIGHT.y+nz*LIGHT.z,0,1);
      const n=Math.round(half);
      for(let s=1;s<=n;s++){
        const lx=Math.round(x+ca*s), ly=Math.round(y+sa*s);
        if(lx<0||ly<0||lx>=sp.w||ly>=sp.h) continue;
        const j=ly*sp.w+lx;
        if(sp.occ[j]===1) continue;             // never paint over a rachis
        sp.occ[j]=2;
        sp.shade[j]=clamp(0.16+0.94*ndl+rnd.range(-0.04,0.04),0,1);
        sp.ao[j]=clamp(0.70+0.26*(1-s/Math.max(1,n)),0,1);
        sp.nx[j]=nx; sp.ny[j]=ny; sp.nz[j]=nz;
        sp.rad[j]=1; sp.horiz[j]=Math.abs(ca);
      }
    }
  }
}

/* Scars reuse the crown's phased golden-angle helix. scarStep is a 2 px
   legibility floor; life-scale internodes are subpixel. */
function scarPass(sp,apexY,base,cfg,rStem,th0){
  const step=Math.max(2,cfg.scarStep);
  const DIV=cfg.divergence*DEG;
  const n=Math.floor((base-apexY)/step);
  for(let k=0;k<n;k++){
    const y=Math.round(apexY+(k+1)*step);
    if(y<0||y>=sp.h) continue;
    /* Find the drawn stem at this row. */
    let x0=-1,x1=-1;
    for(let x=0;x<sp.w;x++) if(sp.occ[y*sp.w+x]===1){ if(x0<0)x0=x; x1=x; }
    if(x0<0||x1-x0<1) continue;
    const th=(th0||0)+k*DIV;
    const cxr=(x0+x1)/2, half=(x1-x0)/2;
    /* cos of the divergence angle places the scar around the stem, so rings
       stagger up the trunk. */
    const sx=Math.round(cxr+Math.cos(th)*half*0.62);
    const wide=half>1.4?1:0;
    for(let dx=-wide;dx<=wide;dx++){
      const xx=sx+dx;
      if(xx<x0||xx>x1) continue;
      const i=y*sp.w+xx;
      if(sp.occ[i]!==1) continue;
      sp.occ[i]=3; sp.shade[i]=clamp(sp.shade[i]*0.62,0,1);
    }
  }
}

/* Source: Shinozaki et al. 1964 pipe model; Halle et al. 1978 Rauh model.
   Leaf area follows supporting cross-section; crown opacity follows k*LAI. */
const CROWN_KLAI=CANOPY.crown.k*CANOPY.crown.lai;

const LOBE_ASPECT=0.82;     /* broader than deep: a shoot system spreads to the light */
const LOBE_RAG=0.22;        /* how far the outline breaks inward, as a fraction of R */
const LOBE_MIN=1.6;         /* legibility floor, see crownMass */
function lobe(sp,cx,cy,R,rnd,aspect=LOBE_ASPECT,ragAmt=LOBE_RAG){
  const ry=Math.max(1.2,R*aspect);
  const p1=rnd.range(0,Math.PI*2), p2=rnd.range(0,Math.PI*2);
  const y0=Math.max(0,Math.floor(cy-ry-1)), y1=Math.min(sp.h-1,Math.ceil(cy+ry+1));
  const x0=Math.max(0,Math.floor(cx-R-1)),  x1=Math.min(sp.w-1,Math.ceil(cx+R+1));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const dx=(x+0.5-cx)/R, dy=(y+0.5-cy)/ry;
    const q=dx*dx+dy*dy;
    if(q>1.02) continue;
    const th=Math.atan2(dy,dx);
    const rag=1-ragAmt*(0.5+0.5*Math.sin(th*3+p1))*(0.5+0.5*Math.sin(th*5+p2));
    if(q>rag*rag) continue;
    const i=y*sp.w+x;
    /* Wood at rad >= 1.5 survives the leaves, the threshold makeTree uses to
       protect wood from snow. */
    if(sp.occ[i]===1&&sp.rad[i]>=1.5) continue;
    const l=Math.hypot(dx,dy)||1e-6, k=Math.min(0.85,l);
    const nx=dx/l*k, ny=dy/l*k, nz=Math.sqrt(Math.max(0,1-k*k));
    const ndl=clamp(nx*LIGHT.x+ny*LIGHT.y+nz*LIGHT.z,0,1);
    sp.occ[i]=2;
    sp.shade[i]=clamp(0.16+0.94*ndl,0,1);
    sp.nx[i]=nx; sp.ny[i]=ny; sp.nz[i]=nz;
    sp.rad[i]=1; sp.horiz[i]=Math.abs(dx/l);
    sp.ao[i]=1;                      // canopyPass writes the real value
  }
}

/* Invariant: solve lobe scale against drawn local Beer-Lambert coverage without
   consuming RNG. Pre-drawn deposits count toward coverage. */
function crownMass(sp,seeds,env,rnd){
  /* Local target follows ellipsoid chord depth, 1-exp(-kLAI*sqrt(1-rho^2)).
     A flat slab target overfills the crown. See docs/MEADOW.md. */
  const probe=new Uint8Array(sp.w*sp.h);
  const pre=new Uint8Array(sp.w*sp.h);
  for(let i=0;i<pre.length;i++) if(sp.occ[i]===2) pre[i]=1;
  const coverage=(c)=>{
    probe.set(pre);
    for(const [tx,ty,tr] of seeds){
      const R=Math.max(LOBE_MIN,c*tr), ry=Math.max(1.2,R*LOBE_ASPECT);
      const y0=Math.max(0,Math.floor(ty-ry)), y1=Math.min(sp.h-1,Math.ceil(ty+ry));
      const x0=Math.max(0,Math.floor(tx-R)),  x1=Math.min(sp.w-1,Math.ceil(tx+R));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const dx=(x+0.5-tx)/R, dy=(y+0.5-ty)/ry;
        if(dx*dx+dy*dy<=1) probe[y*sp.w+x]=1;
      }
    }
    let inside=0, hit=0, want=0;
    const y0=Math.max(0,Math.floor(env.cy-env.ry)), y1=Math.min(sp.h-1,Math.ceil(env.cy+env.ry));
    const x0=Math.max(0,Math.floor(env.cx-env.rx)), x1=Math.min(sp.w-1,Math.ceil(env.cx+env.rx));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const dx=(x+0.5-env.cx)/env.rx, dy=(y+0.5-env.cy)/env.ry;
      const q=dx*dx+dy*dy;
      if(q>1) continue;
      inside++; want+=1-Math.exp(-CROWN_KLAI*Math.sqrt(1-q));
      if(probe[y*sp.w+x]) hit++;
    }
    return inside?[hit/inside,want/inside]:[0,1];
  };
  let lo=0.0, hi=90;
  for(let it=0;it<22;it++){ const mid=(lo+hi)/2; const [got,want]=coverage(mid);
    if(got<want) lo=mid; else hi=mid; }
  const C=(lo+hi)/2;
  const out=[];
  for(const [tx,ty,tr] of seeds){
    /* Medium floor: a lobe under 1.6 px is one-pixel speckle, as grow()
       floors a child radius at 0.8 px. Below the floor the conservation law
       is unreachable (docs/CANON.md). The test prints how many lobes take
       it. */
    const R=Math.max(LOBE_MIN,C*tr);
    lobe(sp,tx,ty,R,rnd);
    out.push([R,tr,C*tr<LOBE_MIN?1:0]);
  }
  return out;
}

/* grow() draws the frame and reports its terminals; the pipe model sizes a
   lobe at each; Beer-Lambert lights the result. */
function growBroadleaf(sp,rnd,height,cfg,tilt,klai=CROWN_KLAI){
  const base=sp.h-1, cx=sp.ax, lean=(tilt||0)+rnd.range(-0.05,0.05);
  const baseW=Math.max(1.9,height*cfg.trunkW);

  const cfgC=Object.assign({},cfg,{clearBole:clamp(cfg.clearBole/cfg.boleLen,0.02,0.80)});
  sp.tips=[];
  grow(sp,cx,base,-Math.PI/2+lean,height*cfg.boleLen,baseW,0,cfgC,rnd);
  const tips=sp.tips; delete sp.tips;
  if(!tips.length) return;

  let bx0=1e9,bx1=-1e9,by0=1e9,by1=-1e9;
  for(const [tx,ty] of tips){
    bx0=Math.min(bx0,tx); bx1=Math.max(bx1,tx);
    by0=Math.min(by0,ty); by1=Math.max(by1,ty);
  }
  sp.lobes=crownMass(sp,tips,{cx:(bx0+bx1)/2,cy:(by0+by1)/2,
                              rx:Math.max(1.5,(bx1-bx0)/2),ry:Math.max(1.5,(by1-by0)/2)},rnd);
  canopyPass(sp,klai);
}

/* Ficus carries leaves on broad horizontal sprays. Pipe area owns leaf area;
   each terminal gets a shallow capped plate, so branch architecture stays the
   crown silhouette. */
function growStrangler(sp,rnd,height,cfg,tilt,klai=CROWN_KLAI){
  const base=sp.h-1,cx=sp.ax,lean=(tilt||0)+rnd.range(-0.04,0.04);
  const baseW=Math.max(1.9,height*cfg.trunkW);
  const cfgC=Object.assign({},cfg,{
    clearBole:clamp(cfg.clearBole/cfg.boleLen,0.02,0.80),
  });
  sp.tips=[];
  grow(sp,cx,base,-Math.PI/2+lean,height*cfg.boleLen,baseW,0,cfgC,rnd);
  const tips=sp.tips;delete sp.tips;
  /* Order: roots read bare branch undersides, then leaf sprays go over. */
  stranglerRootPass(sp,rnd,height,cfg);
  const lobes=[],areaScale=Math.sqrt(cfg.leafArea/cfg.leafAspect);
  /* Three blades make one terminal spray. Their squared radius weights sum
     to one pipe-owned area before the legibility floor. */
  const sideR=0.64,split=Math.sqrt(1+2*sideR*sideR);
  for(const [tx,ty,tr] of tips){
    const raw=tr*areaScale;
    const R=clamp(raw/split,height*cfg.leafMin,height*cfg.leafMax);
    for(const side of [-1,0,1]){
      const r=R*(side?sideR:1);
      lobe(sp,tx+side*R*0.95,ty+Math.abs(side)*R*0.12,
           r,rnd,cfg.leafAspect,cfg.leafRag);
      lobes.push([r,tr,raw/split<height*cfg.leafMin?1:0]);
    }
  }
  sp.lobes=lobes;
  canopyPass(sp,klai);
}

/* Aerial roots drop from branch undersides. A root needs a clear initial fall,
   then may merge into the fused bole; its lower fifth thickens. */
function stranglerRootPass(sp,rnd,height,cfg){
  const base=sp.h-1,minClear=Math.max(5,Math.round(height*cfg.rootClear));
  let crownX0=sp.w,crownX1=-1;
  for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++)if(sp.occ[y*sp.w+x]){
    crownX0=Math.min(crownX0,x);crownX1=Math.max(crownX1,x);
  }
  const rootInset=Math.max(3,Math.round((crownX1-crownX0)*0.16));
  const candidates=[];
  for(let x=crownX0+rootInset;x<=crownX1-rootInset;x++){
    let launch=-1;
    const y0=Math.max(1,base-Math.round(height*0.90));
    const y1=Math.min(base-minClear-1,base-Math.round(height*0.26));
    for(let y=y0;y<=y1;y++){
      const i=y*sp.w+x;
      if(sp.occ[i]!==1||sp.occ[i+sp.w])continue;
      let clear=0;
      for(let yy=y+1;yy<base-1&&clear<minClear;yy++){
        if(sp.occ[yy*sp.w+x])break;
        clear++;
      }
      if(clear>=minClear)launch=y;
    }
    if(launch>=0)candidates.push({x,y:launch,score:rnd.f()});
  }
  candidates.sort((a,b)=>a.score-b.score);
  const chosen=[];
  const take=(pool,n)=>{
    let added=0;
    for(const q of pool){
      if(chosen.some(p=>Math.abs(p.x-q.x)<3))continue;
      chosen.push(q);added++;
      if(added>=n||chosen.length>=cfg.rootCount)break;
    }
  };
  const sideN=Math.max(2,Math.floor(cfg.rootCount/3));
  take(candidates.filter(q=>q.x<sp.ax-2),sideN);
  take(candidates.filter(q=>q.x>sp.ax+2),sideN);
  take(candidates,cfg.rootCount);
  for(const q of chosen){
    const bow=rnd.range(-cfg.rootSpread,cfg.rootSpread);
    const len=base-q.y;
    for(let d=1;d<=len;d++){
      const t=d/len,x=q.x+Math.sin(Math.PI*t)*bow;
      const r=t<0.78?0.62:lerp(0.62,1.45,(t-0.78)/0.22);
      stampDisc(sp,x,q.y+d,r,1,0,0.18,t<0.78?9:1);
    }
  }
}

/* Bald cypress: one leader, fine sprays on many lateral branches. Branch count
   derives from crown length; the sinusoidal envelope closes every spray inside
   the sprite boundary. */
function growCypress(sp,rnd,height,cfg,tilt,klai,crownR,crownW){
  const base=sp.h-1,cx=sp.ax,lean=(tilt||0)+rnd.range(-0.025,0.025);
  const crownLen=height*crownR,levels=Math.max(7,Math.round(crownLen/cfg.levelStep));
  const trunkW=Math.max(2.2,height*cfg.trunkW);
  const axis=d=>cx+lean*d+Math.sin(d*0.21)*0.10;
  for(let d=0;d<=height*cfg.leader;d++){
    const u=d/(height*cfg.leader);
    stampDisc(sp,axis(d),base-d,Math.max(0.85,trunkW*(1-u)**0.72),0,1,0.38);
  }
  const lobes=[];
  for(let j=0;j<levels;j++){
    const u=j/Math.max(1,levels-1);
    const d=height*((1-crownR)+u*crownR*cfg.leader);
    const y0=base-d,x0=axis(d);
    const envelope=Math.pow(Math.sin(Math.PI*(0.08+u*0.84)),0.70)*(1-u*0.18);
    const half=Math.max(3.2,height*crownW*cfg.branchSpan*envelope);
    const rise=half*(0.10+u*0.20);
    const sprayR=Math.max(1.8,Math.min(4.2,
      height*(cfg.sprayMin+(cfg.sprayMax-cfg.sprayMin)*(1-u))));
    for(const side of [-1,1]){
      const len=half*rnd.range(0.84,1.08),steps=Math.max(2,Math.ceil(len));
      for(let q=0;q<=steps;q++){
        const t=q/steps;
        stampDisc(sp,x0+side*len*t,y0-rise*t,
          Math.max(0.65,trunkW*0.30*(1-t)**0.62),side,0,0.24);
      }
      for(const t of [0.42,0.64,0.84,1.0]){
        const R=sprayR*rnd.range(0.82,1.14);
        lobe(sp,x0+side*len*t,y0-rise*t,R,rnd);
        lobes.push([R,1,0]);
      }
    }
    const R=sprayR*rnd.range(0.78,1.02);
    lobe(sp,x0,y0-R*0.35,R,rnd);lobes.push([R,1,0]);
  }
  for(let d=height*0.82;d<=height*0.98;d+=Math.max(3,height*cfg.leaderSprayStep)){
    const R=Math.max(1.8,height*cfg.leaderSprayR);
    lobe(sp,axis(d),base-d,R,rnd);lobes.push([R,1,0]);
  }
  sp.lobes=lobes;
  canopyPass(sp,klai);
}

/* Thickness covers THICK_PX only, so its Beer-Lambert weight is
   1-exp(-kLAI*THICK_PX/crownDepth); canopyPass handles whole-crown depth. */
function volWeight(S,sp){
  if(S.vol===undefined) return undefined;
  return S.vol*(1-Math.exp(-(S.canopyKLAI||CROWN_KLAI)*THICK_PX/Math.max(1,sp.crownD||1e9)));
}

/* Buttress height is a fraction of life height. Knees connect to the trunk,
   so their contact is recoverable from the finished sprite (sp.swampBase). */
function swampBasePass(sp,rnd,height,row){
  if(!row) return;
  const base=sp.h-1,cx=sp.ax,bh=Math.max(3,Math.round(height*row.buttress));
  for(let d=0;d<=bh;d++){
    const u=1-d/bh, half=Math.max(1,Math.round(1+u*u*height*0.085));
    stampDisc(sp,cx,base-d,half,1,0,0.12);
  }
  const knees=[];
  for(let k=0;k<(row.knees||0);k++){
    const side=k%2?-1:1;
    const dx=side*Math.round(height*(0.10+0.055*k));
    const kh=Math.max(2,Math.round(height*(0.035+0.012*(k%2))));
    for(let d=0;d<=Math.abs(dx);d++){
      const x=Math.round(cx+dx*d/Math.max(1,Math.abs(dx)));
      const y=base-Math.round(Math.sin(Math.PI*d/Math.max(1,Math.abs(dx)))*1.5);
      stampDisc(sp,x,y,0.8,0,-1,0.18);
    }
    for(let d=0;d<kh;d++) stampDisc(sp,cx+dx,base-d,Math.max(0.7,1.2-d/kh*0.5),side,0,0.16);
    knees.push({x:cx+dx,y:base-kh,h:kh});
  }
  sp.swampBase={buttressPx:bh,knees};
}

function makeTree(kind,height,rnd,snowAmt,clumpMul,tilt){
  const S=SPECIES[kind];
  if(MINERAL[S.model]) return MINERAL[S.model](S,kind,height,rnd,tilt);
  const tl=tilt||0;
  const B=BOTANY[kind]||BOTANY.birch;
  /* Per-tree draws from the BOTANY distributions: branching exponent, crown
     ratio, crown width. */
  const alpha  = rnd.norm(B.alpha.m ,B.alpha.s ,1.35,3.20);
  const crownR = rnd.norm(B.crownR.m,B.crownR.s,0.25,0.98);
  const crownW = Math.max(0.10, rnd.norm(B.crownW.m,B.crownW.s,0.08,2.0))*STYLE_WIDTH;
  const cfgB   = {bA:B.branch, alpha, taperP:B.taper, clearBole:clamp(1-crownR,0.02,0.75)};

  const pad = S.pad||0;
  const wf = kind==='bough' ? 2.05 : crownW+pad;
  const w=Math.max(9,Math.round(height*wf+Math.abs(tl)*height*2.2+4));
  const h=Math.round(height*((kind==='bough'?0.72:1.06)+pad))+4;
  const sp=newSprite(w|1,h);
  sp.ax=sp.w>>1; sp.ay=h-1;
  sp.forks=[]; sp.alpha=alpha; sp.crownR=crownR; sp.crownW=crownW;

  const SMALL_CONIFER=40;
  if(S.conifer&&height<SMALL_CONIFER){
    drawSmallConifer(sp,rnd,height,tl);
    sp.ramp=S.ramp; sp.ramp2=S.ramp2; sp.dMin=S.dMin; sp.dMax=S.dMax; sp.sMin=S.sMin; sp.sMax=S.sMax; sp.vol=volWeight(S,sp); sp.kind=kind; sp.tilt=tl;
    return trimSprite(sp);
  }
  /* Dispatch on `model`, not on the kind name: a species names its
     architecture and the architecture names its builder. */
  if(S.model==='corner'){
    growPalm(sp,rnd,height,Object.assign({},S.cfg,cfgB,{tiltTarget:-Math.PI/2+tl}),tl,alpha);
  }else if(S.model==='cypress'){
    growCypress(sp,rnd,height,S.cfg,tl,S.canopyKLAI,crownR,crownW);
  }else if(S.model==='strangler'){
    growStrangler(sp,rnd,height,
      Object.assign({},S.cfg,cfgB,{tiltTarget:-Math.PI/2+tl}),tl,S.canopyKLAI);
  }else if(S.model==='rauh'){
    growBroadleaf(sp,rnd,height,Object.assign({},S.cfg,cfgB,{tiltTarget:-Math.PI/2+tl}),tl,S.canopyKLAI);
  }else if(S.conifer){
    growConifer(sp,rnd,height,Object.assign({},S.cfg,cfgB,{tiltTarget:-Math.PI/2+tl,spread:crownW*0.5}),tl);
  }else if(kind==='bough'){
    /* Grows inward from the lower-left corner: a limb entering the frame. */
    const ay=Math.round(h*0.34);
    sp.ax=1; sp.ay=ay;
    grow(sp,1,ay,rnd.range(0.16,0.58),height*rnd.range(0.78,0.98),
         Math.max(2.0,height*0.062),0,Object.assign({},S.cfg,cfgB),rnd);
  }else{
    const lean=tl+rnd.range(-0.05,0.05);
    const baseW=kind==='snag' ?Math.max(2.4,height*rnd.range(0.085,0.125))
              :kind==='birch' ?height*rnd.range(0.058,0.090)
              :kind==='reed'  ?Math.max(1.7,height*0.20)
                              :Math.max(1.9,height*0.115);
    if(height<46&&(kind==='birch'||kind==='snag'))
      cfgB.clearBole=Math.max(cfgB.clearBole,0.40);
    const boleLen=kind==='birch'?rnd.range(0.74,0.88)
                :kind==='snag' ?rnd.range(0.62,0.80)
                :rnd.range(0.55,0.75);
    grow(sp,sp.ax,h-1,-Math.PI/2+lean,height*boleLen,baseW,0,
         Object.assign({},S.cfg,cfgB,{tiltTarget:-Math.PI/2+tl}),rnd);
  }
  if(S.swampBase) swampBasePass(sp,rnd,height,S.swampBase);

  /* The lower trunk of a deciduous tree is snow-proof, as the conifer leader
     is. */
  if(!S.conifer&&!S.model&&kind!=='bramble'&&kind!=='reed'){
    const cut=Math.round(sp.h*0.52);
    for(let y=cut;y<sp.h;y++)for(let x=0;x<sp.w;x++){
      const i=y*sp.w+x;
      if(sp.occ[i]===1&&sp.rad[i]>=1.5) sp.noSnow[i]=1;
    }
  }
  aoPass(sp,S.ao);
  /* Small trees get less clumping: at 30 px a fused snow crown is a
     lollipop. Small deciduous crowns also take less snow load. */
  const sizeK=clamp((height-26)/48,0,1);
  const smallBoost=S.conifer?lerp(1.24,1.0,sizeK)
                 :(kind==='bramble'||kind==='reed')?1.35
                 :lerp(0.80,1.05,sizeK);
  snowPass(sp,rnd,snowAmt*S.snow*smallBoost*rnd.range(0.88,1.12),
           S.clump*(0.30+0.70*sizeK)*rnd.range(0.55,1.55)*(clumpMul===undefined?1:clumpMul),S.reach);
  /* Distance removes internal contrast. Small (far) sprites compress their
     shade range at bake time; haze at draw time alone leaves the far band
     busier than the middle distance. */
  if(height<38){
    const k=lerp(0.46,0.0,clamp((height-16)/22,0,1));
    for(let i=0;i<sp.w*sp.h;i++){
      if(!sp.occ[i]) continue;
      /* The software path reads `shade`. */
      sp.shade[i]=lerp(sp.shade[i],0.56,k);
      /* The GPU path shades wood and snow from the normal and ignores
         `shade`, so the normal flattens toward the viewer too. */
      sp.nx[i]*=1-k; sp.ny[i]*=1-k;
      sp.nz[i]=Math.sqrt(Math.max(0.02,1-sp.nx[i]*sp.nx[i]-sp.ny[i]*sp.ny[i]));
      sp.ao[i]=lerp(sp.ao[i],1,k*0.55);
    }
  }
  if(S.bark>0) barkPass(sp,rnd,S.bark);
  /* Invariant: optional droop uses its own deterministic RNG. Drawing from
     the shared generator re-rolls later atlas and world decisions. */
  if(S.droop>0&&height>=34){
    const dSeed=(Math.round(height*7919)^Math.round(alpha*1e4)^Math.round(crownW*1e4))>>>0;
    droopPass(sp,new RNG(dSeed),S.droop*(0.45+0.55*sizeK),S.droopLen);
  }
  sp.ramp=S.ramp; sp.ramp2=S.ramp2; sp.dMin=S.dMin; sp.dMax=S.dMax; sp.sMin=S.sMin; sp.sMax=S.sMax; sp.vol=volWeight(S,sp); sp.kind=kind; sp.tilt=tl;
  return trimSprite(sp);
}

const TIER_N=7, TIER_LO=0.058, TIER_HI=0.440;
const TIER_R=Math.pow(TIER_HI/TIER_LO,1/(TIER_N-1));
const tierHeight=i=>TIER_LO*Math.pow(TIER_R,i);
const KINDS=['birch','spruce','snag','bramble','reed','palm','meadowTree','shrub','sward',
             'cypress','tupelo','stranglerFig','buttonbush','pickerel','sedge','swampRose',
             'datePalm','acacia','duneGrass',
             'glowcap','glowlet','stalagmite','dripstub','amethyst','heartstone',
             'foxstone','shard'];
const VARIANTS={birch:6,spruce:3,snag:2,bramble:3,reed:2,palm:3,meadowTree:4,
  shrub:3,sward:3,cypress:4,tupelo:3,stranglerFig:3,buttonbush:3,pickerel:3,sedge:3,
  swampRose:3,datePalm:3,acacia:4,duneGrass:3,
  glowcap:4,glowlet:3,stalagmite:4,dripstub:3,amethyst:4,heartstone:1,
  foxstone:4,shard:4};
/* Leans are generated positive only; mirroring at draw time covers the other
   side. */
const MAX_LEAN=0.40;
/* Legibility floors: below these heights a sprite is speckle. palm:34: below
   about 34 rows the frond length falls under 12 px, the pinnae are 2 px and
   the crown fuses into a disc. The date palm carries the same floor. */
const MIN_H={birch:20,spruce:20,snag:22,bramble:12,reed:13,bough:20,palm:34,
             meadowTree:22,shrub:11,sward:7,cypress:36,tupelo:30,
             buttonbush:13,pickerel:10,sedge:8,swampRose:11,
             datePalm:34,acacia:20,duneGrass:7,
             glowcap:8,glowlet:4,stalagmite:12,dripstub:4,amethyst:9,heartstone:40,
             foxstone:6,shard:4};

/* Sideways reach from the anchor, in pixels: worst case over every tier the
   layer uses, every variant and its lean. Measured off the rasters at the
   heights atlas.js bakes, and asserted in test/biome.test.mjs.

   Keep-out is about the crown: a meadow tree anchored 46 px from a wall
   carries 69 px of canopy. The trunk radius in `solids` is the collider, a
   different question. */
const CROWN_HALF={birch:77, spruce:14, snag:8, bramble:10, reed:8,
                  palm:65, meadowTree:69, shrub:19, sward:10,
                  cypress:36, tupelo:52, stranglerFig:61,
                  buttonbush:10, pickerel:5, sedge:5, swampRose:14,
                  datePalm:48, acacia:38, duneGrass:9,
                  glowcap:16, glowlet:12, stalagmite:19, dripstub:7, amethyst:19, heartstone:27,
                  foxstone:13, shard:5,
                  /* A lying trunk reaches its half-length (`half` in
                     src/world/placement.js). */
                  log:52};

function makeLog(len,rnd,snowAmt){
  const r0=Math.max(2.4,len*0.072);
  const w=(len+14)|1, h=Math.round(r0*2)+15+Math.ceil(r0*0.9);
  const sp=newSprite(w,h);
  sp.ax=w>>1; sp.ay=h-1;
  const tilt=rnd.range(-0.34,0.34), ph=rnd.range(0,6.28);
  const y0=h-4-r0-Math.ceil(r0*0.9);
  let x=6, y=y0-tilt*len*0.5;
  for(let i=0;i<=len;i++){
    const t=i/len;
    /* taper, plus a swell at each knot */
    const rr=Math.max(1.1,r0*(1-0.40*t)*(1+0.11*Math.sin(t*8.5+ph)));
    stampDisc(sp,x,y,rr,0,1,1.0);   // lateral axis vertical: a cylinder on its side
    x+=1; y+=tilt;
  }
  /* the root plate */
  const bx=6, by=y0-tilt*len*0.5, rp=r0*1.9;
  for(let dy=-Math.ceil(rp);dy<=Math.ceil(rp);dy++)
  for(let dx=-Math.ceil(rp*0.55);dx<=Math.ceil(rp*0.55);dx++){
    const px=Math.round(bx+dx), py=Math.round(by+dy);
    if(px<0||py<0||px>=w||py>=h) continue;
    if((dx*dx)/(rp*0.55*rp*0.55)+(dy*dy)/(rp*rp)>1) continue;
    const i=py*w+px;
    sp.occ[i]=1; sp.shade[i]=clamp(0.20+0.30*rnd.f(),0,1); sp.rad[i]=1.4;

    const al=Math.hypot(1,tilt);
    const u=dx/(rp*0.55), v=dy/rp, om=Math.hypot(u,v);
    const k=Math.min(1,om)*Math.min(1,om);
    const ou=om<1e-4?0:u/om, ov=om<1e-4?0:v/om;
    const nX=clamp((-1/al)*(1-k)+ou*0.55*k,-1,1);
    const nY=clamp((-tilt/al)*(1-k)+ov*0.55*k,-1,1);
    sp.horiz[i]=0.2; sp.nx[i]=nX; sp.ny[i]=nY;
    sp.nz[i]=Math.sqrt(Math.max(0.04,1-nX*nX-nY*nY));
  }
  /* two snapped limbs */
  const cfg=Object.assign({},SPECIES.snag.cfg,{maxDepth:1,trunkKids:0,kidsMin:0,kidsMax:0,
    tiltTarget:-Math.PI/2});
  for(let k=0;k<2;k++){
    const t=rnd.range(0.25,0.85);
    grow(sp,6+len*t,y0-tilt*len*0.5+tilt*len*t-r0*0.4,
         -Math.PI/2+rnd.range(-0.85,0.85)+(k?0.55:-0.55),r0*rnd.range(2.2,4.0),
         Math.max(1.0,r0*0.42),1,cfg,rnd);
  }
  const bw=SNOW.bridge, tw=SNOW.tilt;
  SNOW.bridge=3; SNOW.tilt=0;                 // it is all horizontal; gate nothing
  /* The one horizontal member takes a heavy snow load. At a snow fraction of
     0.275 against a spruce's 0.55 it renders as a 90 px dark bar with a white
     line on it. */
  snowPass(sp,rnd,snowAmt*2.4,0.85,3);
  SNOW.bridge=bw; SNOW.tilt=tw;
  aoPass(sp,0.34);
  sp.ramp='trunk'; sp.sMin=0.10; sp.sMax=0.72; sp.kind='log';
  /* Nonzero tilt: at exactly 0 both mirror candidates score equal in the
     variant chooser and every root plate lands on the left. */
  sp.tilt=tilt;
  return trimSprite(sp);
}

export { SPECIES_H, BOTANY, CROWN_HALF, DEG, KINDS, MAX_LEAN, MIN_H, SPECIES, STYLE_WIDTH, TIER_HI, TIER_LO, TIER_N, TIER_R, VARIANTS, drawSmallConifer, growConifer, makeLog, makeTree, tierHeight };
