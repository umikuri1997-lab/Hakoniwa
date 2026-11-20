import { RAMP_ID } from './palette.js';

/* INVARIANT: SURFACE index is the persisted flag byte; append rows, never insert or reorder. */
/* The Hollow's floor: wet clay over limestone. It prints, a drip splashes on
   it, and it is one albedo under each lamp (hollowRamps in src/sunlight.js),
   so its rows differ only in ramp. Dither 1: a pool of light sweeps the ramp
   over a few metres, and without dithering rampStep draws contour rings. */
const CAVE_FLOOR={dither:1,ndl:0.10,print:1,kick:'silt',rainGround:1,repose:30,
                  speed:1,reflect:0};
const SURFACE=[
  /* sinkPx is a draw-only penetration depth for a human figure. Collision and
     painter order stay on the ground plane. Compacted trail and dune sand
     lose one row, loose snow two. */
  /* heat: what a fire leaves on the ground. 'char' is fine fuel that burns
     and marks, and `fuel` names its bed (BED in src/matter.js). 'melt' is a
     snow pack that only marks. 'thaw' is ice that opens to water. Absent:
     mineral ground and made surfaces keep no record. src/spell.js reads it. */
  /* 0 */ {name:'snow',   ramp:'snow',   dither:1, ndl:0.30, print:1, kick:'snow',
           sinkPx:2, repose:38, heat:'melt', map:[72,84,98]},
  /* 1 */ {name:'water',  ramp:'water',  dither:1, ndl:0,    print:0, wet:1,     map:[30,51,82]},
  /* 2 */ {name:'trail',  ramp:'snow',   dither:1, ndl:0.30, print:1, kick:'snow',
           sinkPx:1, repose:38, heat:'melt', map:[169,182,191]},
  /* FAILED: shelf declares ice although shader prose once implied water. Preserve until a reviewed visual change; docs/DECISIONS.md. */
  /* 3 */ {name:'shelf',  ramp:'ice',    dither:0, ndl:0,    print:0, heat:'thaw', map:[120,150,170]},
  /* 4 */ {name:'stone',  ramp:'warm',   dither:0, ndl:0,    print:0,            map:[92,86,84]},
  /* 5 */ {name:'cap',    ramp:'snow',   dither:0, ndl:0,    print:0, repose:38, map:[200,210,215]},
  /* 6 is retired. The index is persisted, so the row stays. */
  /* 6 */ {name:'retired',ramp:'snow',   dither:1, ndl:0,    print:0,            map:[60,50,44]},
  /* INVARIANT: meadow surface rows extend the shared flag table; existing ids remain fixed. */
  /* WHY: sward is a continuous ground mass; vegetation sprites provide texture, so ground dithering is disabled. */
  /* 7 */ {name:'sward',  ramp:'grass',  dither:0, ndl:0.58, print:0, yieldKPa:24, repose:35,
           heat:'char', fuel:'sward', map:[74,102,58]},
  /* 8 */ {name:'dust',   ramp:'loam',   dither:0, ndl:0.22, print:1, kick:null,
           repose:34, map:[176,164,132]},
  /* INVARIANT: pond is its own surface row because material/ramp/wet behavior differ from remapped winter water. */
  /* 9 */ {name:'pond',   ramp:'pond',   dither:0, ndl:0,    print:0, wet:1,     map:[62,124,132]},
  /* 10 flagstone: a made horizontal surface. Its variation comes from the
     Voronoi cells and joints in pond-court.js. */
  /* 10 */{name:'flagstone',ramp:'masonry',dither:0,ndl:0.10, print:0,            map:[190,176,118]},
  /* Swamp rows are append-only. `wet` means reflective open surface to the
     renderer; traversal remains an explicit world-model property. */
  /* Hummock vegetation covers the walkable peat at this scale. Saturated dark
     soil is a shading state, not another persisted flag. */
  /* capillaryM: thickness of the capillary fringe, the soil that standing water
     keeps wet above its table. 0.2 to 0.5 m in peat (informal field range); the
     low end, so every consequence is a floor. */
  /* 11 */{name:'peat',ramp:'swampGround',dither:0,ndl:0.16,print:1,kick:'peat',
           rainGround:1,repose:28,capillaryM:0.20,heat:'char',fuel:'peat',
           speed:1,reflect:0,map:[122,145,78]},
  /* Open water dithers: its field is smooth, and a smooth field under
     rampStep draws contour lines. Depth is an analytic distance from the
     shore through a saturating optical curve, so an isodepth line is a smooth
     offset of the shoreline. Measured on the lakehouse basin: the rung
     boundary between the two mid teals ran 971 px as one curve. A tone
     boundary inside one body of water is a seam, never a cut.
     test/swamp.test.mjs measures it; SEAM_PX in src/shaders/world.js pays
     for it. */
  /* 12 */{name:'flooded',ramp:'swampShallow',dither:1,ndl:0,print:0,wet:1,water:1,
           depth:[0.02,0.38],speed:1,reflect:0.72,map:[139,165,146]},
  /* 13 */{name:'swampWater',ramp:'swampWater',dither:1,ndl:0,print:0,wet:1,water:1,
           depth:[0.38,1.80],speed:0,reflect:0.90,map:[74,112,105]},
  /* A plant mat is hydrologically water but optically not open water. It
     floats, so its depth window is all the water it can sit on. Shelter from
     current decides where it forms, and the bake keys on shelter. */
  /* 14 */{name:'duckweed',ramp:'duckweed',dither:0,ndl:0.12,print:0,water:1,
           depth:[0.05,1.80],speed:0,reflect:0,map:[77,101,53]},
  /* A wet board takes a pressure mark. It is a made solid with no loose
     material for the foot to throw. */
  /* 15 */{name:'boardwalk',ramp:'swampWood',dither:0,ndl:0.10,print:1,kick:null,
           rainGround:1,speed:1,reflect:0,map:[44,67,54]},
  /* Desert rows are append-only. The dune field in worldgen.js reads
     `repose` (angle of repose, docs/CANON.md).

     34 is the slip face. Dry medium sand stands at 32-34 degrees and
     avalanches above it, so a ridge crest is where the two slopes meet.
     Bagnold 1941.

     Dither 1. A windward face sweeps a whole ramp over its own length, so
     without dithering rampStep draws contour lines up the slope. The sward
     has dithering off: a near-flat field under rampStep draws geology, with
     4-9% of its pixels off the modal rung. SEAM_PX in shaders/world.js pays
     the crossing from the local gradient, so the crest stays a cut. Measured
     in test/desert.test.mjs.

     AUTHORED: speed 1. Walking on dry sand costs roughly 1.6-2.7x the
     metabolic rate of walking on a firm surface at the same speed (Lejeune,
     Willems & Heglund, J Exp Biol 201:2071-2080, 1998). The cost is not
     charged as walking speed: prints, kicked grains and dune relief say
     loose ground. */
  /* 16 */{name:'sand',ramp:'sand',dither:1,ndl:0.52,print:1,kick:'sand',sinkPx:1,repose:34,
           speed:1,reflect:0,map:[196,150,96]},
  /* Desert pavement: a clast surface that has not moved in a long time, so it
     is varnished dark and firm. `print` is 0: a boot does not mark gravel. */
  /* 17 */{name:'hamada',ramp:'hamada',dither:0,ndl:0.20,print:0,repose:37,
           speed:1,reflect:0,map:[74,63,54]},
  /* Salt crust at the evaporative margin. Brittle, so it prints. Bright, on
     its own ramp. */
  /* 18 */{name:'sabkha',ramp:'sabkha',dither:1,ndl:0.14,print:1,kick:'sabkha',repose:30,
           speed:0.88,reflect:0,map:[214,208,190]},
  /* The Hollow. `geode` is `cavestone` under crystal light. */
  /* 19 */{name:'cavestone',ramp:'caveRock',...CAVE_FLOOR,map:[41,88,68]},
  /* 20 */{name:'geode',ramp:'geodeRock',...CAVE_FLOOR,map:[74,72,109]},
  /* A gour: still water with no fetch, so the best mirror in the project. */
  /* 21 */{name:'gour',ramp:'gourWater',dither:1,ndl:0,print:0,wet:1,water:1,
           speed:0,reflect:0.92,map:[30,91,88]},
  /* Rimstone: the calcite dam a pool builds at its own lip, where water
     degasses fastest. Flat, made of the dripstone the stalagmites are. */
  /* 22 */{name:'rimstone',ramp:'dripstone',dither:0,ndl:0.08,print:0,
           speed:1,reflect:0,map:[90,181,135]},
  /* The cavern's rock (src/world/cavern.js). A wall face is limestone, the
     calcite ramp; `cliffGeode` is the same face under crystal light, as
     `geode` is to the floor. `rockroof` is the top of the mass: no light
     reaches it, so it is the floor's shadow rung, flat. */
  /* 23 */{name:'cliff',ramp:'dripstone',dither:1,ndl:0,print:0,
           speed:0,reflect:0,map:[64,91,116]},
  /* 24 */{name:'cliffGeode',ramp:'geodeStone',dither:1,ndl:0,print:0,
           speed:0,reflect:0,map:[104,84,150]},
  /* 25 */{name:'rockroof',ramp:'caveRock',dither:0,ndl:0,print:0,
           speed:0,reflect:0,map:[6,8,12]},
  /* The floor under a foxstone's pale light: `geode`'s row on a third lamp. */
  /* 26 */{name:'moonfloor',ramp:'moonRock',...CAVE_FLOOR,map:[96,112,150]},
  /* The floor at a crystal group's foot, under more light than `geode`'s last
     rung holds. Calcite reflects 2.9 times wet rock (ALBEDO), so the calcite
     wall's ramp under one lamp is this floor under 2.9. No new colour. */
  /* 27 */{name:'geodeHot',ramp:'geodeStone',...CAVE_FLOOR,map:[155,124,236]},
];

/* the flag value each name lives at, so nothing downstream writes an integer */
const SURF={};
SURFACE.forEach((s,i)=>{ SURF[s.name]=i; });

/* The generators. Both walk the same array in the same order, so the two
   emitted chains agree. */
const rampExpr=(s)=>`${RAMP_ID[s.ramp]}.0`;
const tExpr=(s)=>(s.ndl>0?`clamp(t + ${s.ndl.toFixed(2)}*ndl, 0.0, 1.0)`:'t');

/* The lit tone a surface paints at, before a spell mark shifts it. One chain
   for the mark's rung arithmetic and for the paint below. */
function glslSurfaceTone(){
  let out=tExpr(SURFACE[SURFACE.length-1]);
  for(let i=SURFACE.length-2;i>=0;i--)
    out=`flag < ${i}.5 ? ${tExpr(SURFACE[i])} : ${out}`;
  return out;
}

/* `tone` is glslSurfaceTone() plus the frame's mark shift (W_GROUND_FS). */
function glslSurfacePaint(){
  return SURFACE.map((s,i)=>{
    const call=s.dither?`rampDither(${rampExpr(s)}, tone, wp, slope)`
                       :`rampStep(${rampExpr(s)}, tone)`;
    const test=i===SURFACE.length-1?'  else':`  ${i?'else ':''}if(flag < ${i}.5)`;
    return `${test} c = ${call};`.padEnd(72)+`// ${s.name}`;
  }).join('\n');
}

/* The shadow branch needs only the ramp: it recomputes the position itself.
   Emitted as a nested ternary, one expression inside a statement. */
function glslSurfaceShadowRamp(){
  let out=rampExpr(SURFACE[SURFACE.length-1]);
  for(let i=SURFACE.length-2;i>=0;i--)
    out=`flag < ${i}.5 ? ${rampExpr(SURFACE[i])} : ${out}`;
  return out;
}

/* INVARIANT: only blend-compatible surface flags may interpolate before palette snapping. */
function glslSurfaceLerps(){
  const yes=SURFACE.map((s,i)=>s.dither?i:-1).filter(i=>i>=0);
  return yes.map(i=>`abs(flag - ${i}.0) < 0.5`).join(' || ');
}

/* "Is this pixel open water", as one expression from the `wet` column, for
   three shader sites. The literal `flag > 0.5 && flag < 1.5` means the winter
   lake and nothing else. */
function glslSurfaceWet(v){
  const yes=SURFACE.map((s,i)=>s.wet?i:-1).filter(i=>i>=0);
  return yes.map(i=>`abs(${v} - ${i}.0) < 0.5`).join(' || ');
}
/* Ground splashes are not the inverse of wetness: duckweed is optically
   non-reflective water, and stone rows belong to rainless scenes. The
   `rainGround` column states the response. */
function glslSurfaceRainGround(v){
  const yes=SURFACE.map((s,i)=>s.rainGround?i:-1).filter(i=>i>=0);
  return yes.map(i=>`abs(${v} - ${i}.0) < 0.5`).join(' || ');
}
/* Surfaces that keep a heat rim, and the ice that opens, from the `heat`
   column. */
function glslSurfaceHeat(v){
  const yes=SURFACE.map((s,i)=>s.heat&&s.heat!=='thaw'?i:-1).filter(i=>i>=0);
  return yes.map(i=>`abs(${v} - ${i}.0) < 0.5`).join(' || ');
}
function glslSurfaceThaw(v){
  const yes=SURFACE.map((s,i)=>s.heat==='thaw'?i:-1).filter(i=>i>=0);
  return yes.map(i=>`abs(${v} - ${i}.0) < 0.5`).join(' || ');
}
/* the surfaces a chunk records as water: collision, the shore column and the
   minimap all ask it on the CPU, off the same column */
const WET=SURFACE.map((s,i)=>s.wet?i:-1).filter(i=>i>=0);

export { SURFACE, SURF, WET, glslSurfaceHeat, glslSurfaceLerps, glslSurfacePaint,
         glslSurfaceRainGround, glslSurfaceShadowRamp, glslSurfaceThaw,
         glslSurfaceTone,
         glslSurfaceWet };
