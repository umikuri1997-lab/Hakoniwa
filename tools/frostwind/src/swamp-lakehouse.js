import {
  GROUND_PX_PER_ROW, basinUnion, karstProfile, lobe, lobeMetric,
} from './basin.js';
import { clamp, smoothstep } from './math.js';
import { fbm, hashf, makeNoise } from './rng.js';
import { newSprite } from './sprite.js';
import {
  CORRIDOR_M, LOG_COURSE_M, PX_PER_M, obliqueCols, obliqueRows,
} from './scale.js';
import { SWAMP_HOUSE } from './swamp-settlement.js';
/* src/construct.js owns the up-facing normal, the metre converters and the
   open-timber material. */
import { M, MEven, N_SIDE, N_TOP, OPEN, roofNormal } from './construct.js';

/* ═══════════════════════════════════════════════════════════════════════════
   THE SINKHOLE AND THE LAKEHOUSE. docs/SWAMP.md owns the geology and the
   architecture.

   A solution basin in limestone is a hole with steep rock walls: deep water,
   no wading in or out, and a level that holds while the mosaic rises and
   falls. The medium has no terrain elevation field, only hydrology on a flat
   plane, so the rim height is declared here as SWAMP_HOUSE declares its pile
   height.
   ═══════════════════════════════════════════════════════════════════════════ */

const DEG=Math.PI/180;

const LAKEHOUSE={
  /* The flood datum is the settlement's. No second copy. */
  rimM:SWAMP_HOUSE.floorM,
  /* Log trunks at the settlement's pile height. The rim already clears the
     design flood: the lift is cultural (docs/CANON.md, environment constrains
     meaning without selecting it). It is also the only visible height: with
     no terrain elevation, height exists only inside a sprite. */
  trunkM:SWAMP_HOUSE.pileM,
  widthM:5.00,wallM:2.50,
  /* The building's plan depth: 4.0 m against a 5.0 m front. Named
     `planDepthM` because `depthM` below is the basin's water depth. */
  planDepthM:4.00,
  /* Rain, not snow: the pitch drops to 6:12 and the eave grows. */
  pitch:0.50,
  eaveM:SWAMP_HOUSE.eaveM,
  /* One person seated, one passing behind. */
  deckM:CORRIDOR_M,
  /* A balcony 2.35 m up is a fall, so the rail is a 1.00 m guard. A seated
     eye at about 1.20 m clears it. Measured: at 0.55 m the rail is 8 rows,
     the depth of the deck's top face, and posts and planks share rows and
     values. */
  railM:1.00,
  /* True basin depth. The water ramp saturates at SWAMP_MAX_M = 1.80 m; the
     traversal medium reads the rest. */
  depthM:4.20,
  /* Source: OSHA 1910.23 fixed ladders. 75.5° pitch, side rails 1.07 m above
     the landing. */
  pitchDeg:75.5,rungM:0.30,railExtendM:1.07,ladderWM:0.45,
  /* Ground radius in metres. Under cabinet projection the circle draws with
     ry = rx/2 (k = 1/2). */
  pondRM:5.50,
  /* Outline wander off the ellipse, in units of the radius. Small:
     dissolution follows rock joints. rimWalkM pays for it. */
  wander:0.070,
  /* Rim shoulders the pad may occupy, all up-screen of the water: a
     reflection mirrors downward. Eleven: standing water under the building
     is a hard rejection, and on a compound basin the dry shoulders are
     narrower than a 25° step finds. */
  padArcs:[203,215,228,240,255,270,285,300,313,325,337].map(d=>d*DEG),
};
/* Rise, run and length follow from the trunk height and the pitch. */
LAKEHOUSE.ladderRiseM=LAKEHOUSE.trunkM;
LAKEHOUSE.ladderRunM=LAKEHOUSE.trunkM/Math.tan(LAKEHOUSE.pitchDeg*DEG);
LAKEHOUSE.ladderLenM=LAKEHOUSE.trunkM/Math.sin(LAKEHOUSE.pitchDeg*DEG);
LAKEHOUSE.rungs=Math.floor(LAKEHOUSE.ladderLenM/LAKEHOUSE.rungM);
LAKEHOUSE.courses=Math.round(LAKEHOUSE.wallM/LOG_COURSE_M);
/* Pad stand-off from the shore, in ground metres: the balcony depth, a
   circulation width in front of it, and the outline's wander. Measured: at
   1.70 m the deck front overhangs the water, because the projection halves a
   ground metre on the depth axis. */
LAKEHOUSE.rimWalkM=LAKEHOUSE.deckM+CORRIDOR_M+LAKEHOUSE.wander*LAKEHOUSE.pondRM;
/* Unit: one metre of ladder is sin(p) metres of rise drawn row for row, plus
   cos(p) metres of ground run foreshortened by one half. A 75.5° ladder
   draws nearly upright. */
LAKEHOUSE.ladderRowsPerM=(Math.sin(LAKEHOUSE.pitchDeg*DEG)
  +Math.cos(LAKEHOUSE.pitchDeg*DEG)/2)*PX_PER_M;

/* ── THE ROCKING CHAIR, WHICH IS A PENDULUM ───────────────────────────────
   A chair on circular rockers of radius R, centre of mass at height c, swings
   about the rockers' centre of curvature. With arm d = R - c and radius of
   gyration k about the centre of mass:

       T = 2π sqrt((k² + d²) / (g d))

   Invariant: c < R. Measured: at 15.29 px/m an 8° sweep moves the rockers
   about two pixels, the seat about one, and the head almost none, in the
   opposite direction (the shoulders sit above the centre of curvature). */
const ROCKER={
  radiusM:1.00,comM:0.62,gyrationM:0.35,amplitude:8*DEG,
  seatM:0.45,backM:1.05,lengthM:0.85,frames:4,
};
const G=9.81;
const rockerPeriodS=(r=ROCKER)=>{
  const d=r.radiusM-r.comM;
  return 2*Math.PI*Math.sqrt((r.gyrationM*r.gyrationM+d*d)/(G*d));
};
/* Horizontal travel of a point at height `heightM`, in world pixels, at a
   phase in [0,1). Points above the centre of curvature return the opposite
   sign: the counter-swing. */
const rockerShiftPx=(heightM,phase,r=ROCKER)=>
  (r.radiusM-heightM)*r.amplitude*Math.sin(2*Math.PI*phase)*PX_PER_M;
const rockerFrameAt=(seconds,phase=0,r=ROCKER)=>{
  const turns=seconds/rockerPeriodS(r)+phase;
  return Math.floor(((turns%1)+1)%1*r.frames)%r.frames;
};

/* ── SITE ─────────────────────────────────────────────────────────────────
   Deepen a basin the field already wants, as the pond court does.

   Measured over the swamp on a 41x37 lattice, eight seeds: walkable ground
   carries a signal between -0.14 and 0, tenth percentile -0.023, median
   -0.012. "Dry" is the driest tenth of walkable ground. A band at -0.105 sits
   below the first percentile, so every site scores equally. Re-measure this
   constant when the hydrology spread changes; never nudge it. */
const DRY_HUMMOCK=-0.023;
/* "Water the field already wants", a fixed fraction of the same measured
   spread. Re-measure with DRY_HUMMOCK. */
const WET_BAND=[-0.022,0.034];
/* Deep enough that `clamp(0.04 + signal*4.2, 0.04, 1.8)` sits on its ceiling
   across the whole floor. */
const FLOOR_SIGNAL=0.46;
/* Wall, not bank: basin.js's karst profile, as the biome's solution basins
   take. Across the last 14% of the radius 1.80 m of depth drops in about 8 px
   (0.53 m of ground), a gradient near 73°. Peat banks stand at 30–42°. The
   test reads the gradient back. Local to this place is the depth, 4.20 m. */
const WALL=0.14;
/* The pad is sampled over the footprint: three rows by nine columns, which
   the test reads back. Sampled along one row, the balcony's down-screen edge
   sits under 1.8 m of water at a perfect score.

   `dry` is a preference (hummock over damp peat). `flooded` is a hard
   condition: no weight on another term buys standing water under the
   building. */
function padDryness(x,y,wetness,threshold,rows){
  const half=(M(LAKEHOUSE.widthM)|1)>>1;
  let dry=0,n=0,flooded=false;
  for(let i=-4;i<=4;i++) for(const dy of [0,-6,rows]){
    const w=wetness(x+Math.round(i*half/4),y+dy);
    if(w>threshold) flooded=true;
    dry+=1-smoothstep(threshold+DRY_HUMMOCK,threshold,w);
    n++;
  }
  return {dry:dry/n,flooded};
}

function candidateScore(c,env){
  const {wetness,threshold,poi,common,alligatorHoles}=env;
  let wet=0;
  for(const [dx,dy] of [[0,0],[-34,0],[34,0],[0,-15],[0,15],[-24,-11],[24,11]])
    wet+=smoothstep(threshold+WET_BAND[0],threshold+WET_BAND[1],
                    wetness(c.pondX+dx,c.pondY+dy));
  wet/=7;
  /* Wet is asked of the untouched field; dry is asked of the composed field
     this place leaves behind. Scored against the untouched field, a pad
     measures bone dry and compiles under 1.8 m of water. */
  const pad=padDryness(c.x,c.y,env.composed(c),threshold,env.padRows);
  const dry=pad.dry;
  let clearance=1;
  for(const p of poi)
    clearance=Math.min(clearance,
      smoothstep(-70,110,Math.hypot(c.x-p.x,c.y-p.y)-(p.r||0)-150));
  /* The house keeps the settlement's 84 px margin off an alligator refuge. */
  let refuge=1;
  for(const h of alligatorHoles)
    refuge=Math.min(refuge,smoothstep(0,60,Math.hypot(c.x-h.x,c.y-h.y)-h.r-84));
  const solitude=smoothstep(300,620,Math.hypot(c.x-common.x,c.y-common.y));
  /* Share of the building with water under it. The reflection pass mirrors a
     caster straight down, so only columns shared with the pond reflect.
     Measured: a shoulder overlapping the basin by 5 of 99 sprite columns
     reflects nothing. A priced term, not a forced bearing: due north puts the
     pad inside the backwater. */
  const half=env.spriteHalf;
  const overlap=Math.min(c.x+half,c.pondX+env.pondRX)
    -Math.max(c.x-half,c.pondX-env.pondRX);
  const mirror=clamp(overlap/(2*half),0,1);
  /* Water and dry ground are both required, so they multiply: a weighted sum
     lets one buy off the other. Clearance, refuge and solitude are
     preferences and stay additive. */
  const site=(0.25+0.75*wet)*(0.25+0.75*dry);
  return {wet,dry,flooded:pad.flooded,clearance,refuge,solitude,mirror,site,
    total:site*2.60+clearance*1.05+refuge*0.85+solitude*0.60+mirror*0.55};
}

function makeSwampLakehouse(seed,env){
  /* The record states one ground radius. Screen radii are derived. */
  const rg=M(LAKEHOUSE.pondRM);
  const rimGap=M(LAKEHOUSE.rimWalkM);
  const padHalf=(M(LAKEHOUSE.widthM)|1)>>1;
  const padDeck=obliqueRows(MEven(LAKEHOUSE.deckM));
  const GY=GROUND_PX_PER_ROW;
  /* Each station's basin is shaped before it is scored: a pad's shoulder
     depends on this outline. */
  const lobeMemo=new Map();
  const lobeFor=(i)=>{
    let L=lobeMemo.get(i);
    if(L) return L;
    const u=(n)=>hashf(i,n,seed^0x5170);
    const k=Math.sqrt(0.80+0.44*u(1)),T=Math.PI*2;
    L=lobe(rg*k,rg/k,u(2)*Math.PI,
      [[0.062*(0.5+u(3)),u(4)*T],[0.085*(0.5+u(5)),u(6)*T],
       [0.048*(0.5+u(7)),u(8)*T]]);
    lobeMemo.set(i,L);
    return L;
  };
  const edgeOf=(L,ux,uy)=>1/Math.max(1e-6,lobeMetric(ux,uy/GY,L));
  /* The outline is basin.js's lobe at a third of the biome's irregularity,
     with its axes stated on the ground. */
  const nShape=makeNoise(seed^0x5170);
  const metricFor=(i,pondX,pondY)=>(x,y)=>
    lobeMetric(x-pondX,y-pondY,lobeFor(i))
    +fbm(nShape,x*0.031,y*0.062,3)*LAKEHOUSE.wander;
  /* The field this place leaves behind, for any candidate. `hydrologyAt` is
     this function with the winner's numbers, so the scored field is the
     compiled field. */
  const signalFor=(c)=>{
    const metric=metricFor(c.i,c.pondX,c.pondY);
    return (x,y,base,threshold)=>{
      const qs=metric(x,y), qn=env.basinMetric(x,y);
      const floor=env.basinFloorSignal+(FLOOR_SIGNAL-env.basinFloorSignal)
        *(1-smoothstep(-0.22,0.22,qs-qn));
      const own=threshold+floor*karstProfile(basinUnion(qs,qn),WALL);
      return own>threshold?Math.max(base,own):base;
    };
  };
  /* The pad stands out from the shoreline by the crest walk plus the
     footprint's extent along the bearing, all in ground distance; the row is
     derived at the end. Without the footprint terms a pad on a side shoulder
     puts the far end of a 5 m wall over the water. */
  const padAt=(pondX,pondY,arc,i)=>{
    const ux=Math.cos(arc),uy=Math.sin(arc);
    const bldg=1/Math.hypot(ux/Math.max(1,padHalf),uy/Math.max(1,padDeck*GY));
    /* The shoreline is the compound one: the sinkhole merges with the
       backwater it lands in. Standing back from the basin radius puts the
       house in the saddle. So the shore is found: the furthest wet sample on
       this bearing, up to 96 px past the outline, in the composed field. */
    const own=signalFor({i,pondX,pondY});
    const from=edgeOf(lobeFor(i),ux,uy);
    let shore=from;
    for(let g=from;g<=from+96;g+=6){
      const x=Math.round(pondX+ux*g), y=Math.round(pondY+uy*g/GY);
      if(own(x,y,env.wetness(x,y),env.threshold)>env.threshold) shore=g;
    }
    const out=shore+rimGap+bldg;
    return {x:Math.round(pondX+ux*out),y:Math.round(pondY+uy*out/GY)};
  };
  /* The drawn half width, not the wall's: the eave is what the water sees. */
  const scoreEnv={...env,spriteHalf:padHalf+M(LAKEHOUSE.eaveM),pondRX:rg,
    padRows:padDeck,
    composed:(c)=>{
      const own=signalFor(c);
      return (x,y)=>own(x,y,env.wetness(x,y),env.threshold);
    }};
  /* Dryness gates, it does not rank: a priced pad lets another term (the
     reflection bonus) buy a wetter pad. A pad below the floor is not
     eligible. The floor asks most of the footprint to reach DRY_HUMMOCK. */
  const DRY_FLOOR=0.65;
  let best=null,fallback=null;
  /* Twelve stations, two sides, three stand-offs, eleven shoulders. Water and
     dry ground are required together: a fourteen-site sweep settles for a
     basin cut into dry peat. */
  for(let i=0;i<12;i++){
    const py=env.common.y+(i<6?-1:1)*(360+((i%6)*196))
      +Math.round((hashf(i,5,seed^0x1a4e)-0.5)*70);
    if(Math.hypot(env.pathX(py),py)>env.worldR*0.74) continue;
    for(const side of [-1,1])for(let k=0;k<3;k++){
      const offset=126+k*62+Math.round(hashf(i,13+k,seed^0x77b2)*44);
      const pondX=Math.round(env.pathX(py)+side*offset);
      for(const arc of LAKEHOUSE.padArcs){
        const pad=padAt(pondX,py,arc,i);
        const c={pondX,pondY:py,x:pad.x,y:pad.y,arc,side,offset,i};
        c.score=candidateScore(c,scoreEnv);
        if(!fallback||c.score.total>fallback.score.total) fallback=c;
        if(c.score.flooded||c.score.dry<DRY_FLOOR) continue;
        if(!best||c.score.total>best.score.total) best=c;
      }
    }
  }
  /* A world with no dry shoulder still gets its landmark, on its least wet
     ground. */
  if(!best) best=fallback;
  if(!best){
    const py=env.common.y+520, arc=270*DEG;
    const pondX=Math.round(env.pathX(py)+168);
    const pad=padAt(pondX,py,arc,0);
    best={pondX,pondY:py,x:pad.x,y:pad.y,arc,side:1,offset:168,i:0,
      score:{wet:0,dry:1,clearance:1,refuge:1,solitude:1,mirror:1,site:0,total:1}};
  }

  const pondLobe=lobeFor(best.i);
  const rx=pondLobe.rx, ry=pondLobe.ry;
  const pondMetric=metricFor(best.i,best.pondX,best.pondY);

  const houseHalf=(M(LAKEHOUSE.widthM)|1)>>1;
  const deckPx=MEven(LAKEHOUSE.deckM);
  const deckRows=obliqueRows(deckPx);
  const trunkPx=M(LAKEHOUSE.trunkM);
  /* The balcony front edge is the house's ground anchor, so a prop on the
     deck sorts in front of the wall. The seat is at that edge, one row
     down-screen. The chair sprite carries the lift: a prop has one anchor and
     it is the sorting one. */
  const seat={x:best.x+Math.round(houseHalf*0.42),y:best.y+1};
  /* The use-node stands beside the chair, one circulation width along the
     rail. On the chair's pixel the figure hides the sprite. */
  const seatStand={x:seat.x-M(CORRIDOR_M),y:seat.y};
  /* ── THE BALCONY AS A PLACE A BODY CAN BE ────────────────────────────────
     The house is one billboard with one anchor at the deck's front edge, so
     anything a row up-screen of that anchor draws before the house and is
     covered. The whole strip therefore sits on one world row and the keeper
     patrols in x. A body's lift is a fact about the ground: `standLift`. */
  const deck={x:best.x,y:best.y+1,half:houseHalf,lift:trunkPx,rows:deckRows};
  /* The ladder stands against the balcony at the end away from the chair,
     one row down-screen so it composites in front of the deck. */
  const ladder={x:best.x-Math.round(houseHalf*0.62),y:best.y+1};
  /* The gauge is the trunk nearest the water, as the settlement cuts
     high-water marks into the left pile of every house. Its x is the first
     trunk's. */
  const gauge={x:best.x-houseHalf+M(0.22),y:best.y+1};
  /* The keeper reads the gauge over the rail, so it is a deck node. The
     ladder head is the way on and off. With the chair, the three ends of his
     patrol. */
  const railGauge={x:gauge.x,y:deck.y};
  const ladderHead={x:ladder.x,y:deck.y};

  const influenceBounds={
    x0:Math.min(best.pondX-rx,best.x-houseHalf,ladder.x-16)-40,
    x1:Math.max(best.pondX+rx,best.x+houseHalf,ladder.x+16)+40,
    y0:Math.min(best.pondY-ry,best.y)-70,
    y1:Math.max(best.pondY+ry,best.y)+40,
  };
  const influence=(x,y)=>x>influenceBounds.x0&&x<influenceBounds.x1
    &&y>influenceBounds.y0&&y<influenceBounds.y1;

  /* ── THE HOLE AND THE BACKWATER ARE ONE HOLE ──────────────────────────────
     `score.wet` lands this place on one of the biome's solution basins nearly
     every time. Measured at seed 20260727: the backwater's centre sits 51 px
     east and 41 px north of the sinkhole's, a third of a radius apart.

     Measured failures: taking the deeper signal draws a figure of eight with
     a notched waist; draining the neighbour leaves a crescent.

     So the two are a compound basin (an uvala): the metrics soft-union as the
     biome's basins do (basin.js), and the floor between them blends. One
     outline, a deeper hole inside.

     `own > threshold` is the guard: outside the union the profile is zero and
     the biome's field returns untouched. */
  const ownSignal=signalFor(best);
  const hydrologyAt=(x,y,base,threshold)=>
    influence(x,y)?ownSignal(x,y,base,threshold):base;

  const architecture=[
    {kind:'lakeHouse',x:best.x,y:best.y,variant:0},
    {kind:'houseLadder',x:ladder.x,y:ladder.y,variant:0},
    {kind:'rockingChair',x:seat.x,y:seat.y,variant:0,
      rock:true,rockPhase:hashf(seat.x,seat.y,seed^0x0c8a)},
  ];

  return {
    kind:'swampLakehouse',x:best.x,y:best.y,r:200,side:best.side,score:best.score,
    pond:{cx:best.pondX,cy:best.pondY,rx,ry,depthM:LAKEHOUSE.depthM},
    rimM:LAKEHOUSE.rimM,house:{x:best.x,y:best.y,half:houseHalf},
    seat,seatStand,ladder,gauge,deck,railGauge,ladderHead,
    deckPx,deckRows,trunkPx,trunkDX:lakeHouseTrunkDX(),
    /* Height of a standing body above the ground plane, in drawn rows. The
       draw list subtracts it from the painted row and sorts on the unlifted
       row. */
    standLift:(x,y)=>(Math.abs(x-deck.x)<deck.half
      &&y>=deck.y-deck.rows&&y<=deck.y+2)?deck.lift:0,
    architecture,pondMetric,influence,hydrologyAt,
    waterAt:(x,y)=>influence(x,y)&&pondMetric(x,y)<1,
    /* Keep-out: 2 is the core (pad and bank crest), 1 the yard, for tall
       plants only. */
    keepOut:(x,y,tall=false)=>{
      const dx=Math.abs(x-best.x),dy=y-best.y;
      if(dx<houseHalf+6&&dy>-M(3.4)&&dy<deckRows+6) return 2;
      if(!tall) return 0;
      /* The rows the house draws into are kept clear of tall plants too. The
         house draws 104 rows and the yard ellipse reaches 46 up-screen: a
         cypress 60 rows back sorts behind the house and paints its crown out
         of the roof. lakeHouseRows is the record the sprite is laid out
         from. */
      if(dx<houseHalf+M(LAKEHOUSE.eaveM)+34
         &&dy>-lakeHouseRows()&&dy<deckRows+6) return 1;
      return Math.hypot((x-best.x)/(houseHalf+34),(y-best.y)/46)<1?1:0;
    },
    sample:(x,y)=>influence(x,y)?{pond:pondMetric(x,y)}:null,
  };
}

/* ── PIXELS ───────────────────────────────────────────────────────────────
   Outdoor sun shears bottom-right, so the lit elevation face is the left
   one. Material 12 (OPEN) paints as wood and the projected-shadow pass skips
   it.

   The default normal is an elevation normal: near vertical, leaning slightly
   up-screen. A horizontal surface passes `N_TOP`: with the wall normal the
   deck lands one palette step from its back wall.

   `ao` is the face value and `occ` scales it, as in src/construct.js and
   src/ruins.js. The atlas packs thickness into channel b for materials 1, 3,
   9 and 12, so `shade` is discarded and wood resolves posterise(lit * ao).
   Measured: with ao pinned at 0.92 every part resolves to one rung, 0.86 of
   authored variation against an ao spread of 0.00. */
const put=(sp,x,y,m,t,occ=1,N=null)=>{
  x=Math.round(x);y=Math.round(y);
  if(x<0||y<0||x>=sp.w||y>=sp.h)return;
  const i=y*sp.w+x;sp.occ[i]=m;sp.shade[i]=clamp(t,0,1);
  sp.ao[i]=clamp(t*occ,0.04,1);
  if(N){sp.nx[i]=N.x;sp.ny[i]=N.y;sp.nz[i]=N.z;sp.rad[i]=2;return;}
  sp.nx[i]=(x-sp.ax)/Math.max(3,sp.w)*0.8;sp.ny[i]=-0.18;
  sp.nz[i]=Math.sqrt(Math.max(0.08,1-sp.nx[i]*sp.nx[i]-0.0324));sp.rad[i]=2;
};

/* Both rows of trunks, six legs, as offsets from the sprite anchor, for the
   collider. The columns match trunkXs in makeLakeHouse. */
const lakeHouseTrunkDX=()=>{
  const W=(M(LAKEHOUSE.widthM)|1),half=W>>1,eave=M(LAKEHOUSE.eaveM);
  const FRONT=W+eave*2+2, cx=FRONT>>1, wl=cx-half, wr=cx+half;
  const trunkR=Math.max(2,M(0.22)), depth=MEven(LAKEHOUSE.planDepthM);
  const cols=obliqueCols(depth),rows=obliqueRows(depth);
  const xs=[wl+trunkR,cx,wr-trunkR];
  return [...xs.map(x=>({dx:x-cx,dy:0})),
          ...xs.map(x=>({dx:x+cols-cx,dy:-rows}))];
};

/* Rows the building draws into, up-screen of its anchor. The baker and the
   keep-out both call it. */
const lakeHouseRows=()=>{
  const half=(M(LAKEHOUSE.widthM)|1)>>1;
  return Math.round(half*LAKEHOUSE.pitch)+M(LAKEHOUSE.wallM)+M(LAKEHOUSE.trunkM)
    +obliqueRows(MEven(LAKEHOUSE.deckM))+obliqueRows(MEven(LAKEHOUSE.planDepthM))+3;
};

function makeLakeHouse(rnd,variant=0){
  const W=(M(LAKEHOUSE.widthM)|1),half=W>>1;
  const wall=M(LAKEHOUSE.wallM),course=Math.max(2,M(LOG_COURSE_M));
  const roof=Math.round(half*LAKEHOUSE.pitch),eave=M(LAKEHOUSE.eaveM);
  const deckPx=MEven(LAKEHOUSE.deckM),deckRows=obliqueRows(deckPx);
  const trunk=M(LAKEHOUSE.trunkM),rail=M(LAKEHOUSE.railM);
  /* The anchor stays at the wall's middle: the ladder, the chair and the door
     are placed against the wall. The eaves and the return (to the right) widen
     the sheet without moving it. */
  const bodyPx=MEven(LAKEHOUSE.planDepthM);
  const bodyCols=obliqueCols(bodyPx),bodyRows=obliqueRows(bodyPx);
  const FRONT=W+eave*2+2, SW=FRONT+bodyCols;
  const H=lakeHouseRows();
  const sp=newSprite(SW,H);
  /* ramp2 paints material 6: the authored ochre, for the lit window. */
  sp.ax=FRONT>>1;sp.ay=H-1;sp.ramp='swampWood';sp.ramp2='swampAccent';
  sp.sMin=0.04;sp.sMax=0.96;sp.kind='lakeHouse';
  const lit=x=>1-x/Math.max(1,FRONT-1);
  const cx=sp.ax,wl=cx-half,wr=cx+half;
  /* Rows of the deck surface at the front edge (the anchor) and at the back,
     where the wall stands. */
  const deckFront=H-1-trunk, deckBack=deckFront-deckRows;
  const base=deckBack, wallTop=base-wall;

  /* ── the balcony: a lifted ground rectangle, drawn as its foreshortened top
     face with `N_TOP`. Board joints run toward the viewer. ──────────────── */
  for(let r=0;r<=deckRows;r++){
    const y=deckBack+r;
    for(let x=wl-eave+2;x<=wr+eave-2;x++){
      const joint=((x+r)%7)===0?-0.10:0;
      /* darker toward the front edge */
      put(sp,x,y,1,0.62+0.20*lit(x)+joint-0.10*(r/Math.max(1,deckRows)),0.92,N_TOP);
    }
  }
  /* ── the trunks: round timber, one lit column and one dark one.

     The legs are solid (material 1) and cast. Measured failure: in OPEN the
     undercroft throws nothing, the lowest caster is the floor plate 34 rows
     up, and the shadow starts fourteen rows clear of the feet. OPEN is for
     thin members whose bars fight the body's cast: the diagonals, the
     balustrade. */
  const trunkR=Math.max(2,M(0.22)),trunkXs=[wl+trunkR,cx,wr-trunkR];
  /* The back row reaches the rear floor edge. Stopping at the balcony's front
     datum leaves `deckRows` of daylight at the rear right corner. */
  for(const px of trunkXs)
    for(let y=base-bodyRows;y<=H-1-bodyRows;y++)
      for(let q=-trunkR;q<=trunkR;q++)
        put(sp,px+q+bodyCols,y,1,0.18,1,N_SIDE);
  /* Sway bracing goes down before the legs. Each diagonal ends on a trunk's
     centre column: drawn after, it punches OPEN holes through the leg. */
  for(let i=0;i<trunkXs.length-1;i++){
    const a=trunkXs[i],b=trunkXs[i+1],top=deckFront+2,bot=H-2;
    for(let y=top;y<=bot;y++){
      const t=(y-top)/Math.max(1,bot-top);
      put(sp,Math.round(a+(b-a)*t),y,OPEN,0.30);
      put(sp,Math.round(b+(a-b)*t),y,OPEN,0.22);
    }
  }
  for(const px of trunkXs)
    for(let y=deckFront+1;y<=H-1;y++)
      for(let q=-trunkR;q<=trunkR;q++){
        const u=q/trunkR;
        /* lit side left, with a terminator */
        put(sp,px+q,y,1,0.46-0.30*u-0.10*(u<-0.5?1:0)+0.10*lit(px));
      }
  /* The floor plate: the one opaque band down here, which throws the long
     undercroft shadow. */
  const plate=Math.max(2,M(0.22));
  for(let y=deckFront+1;y<deckFront+1+plate;y++)
    for(let x=wl-eave+2;x<=wr+eave-2;x++)
      put(sp,x,y,1,0.14+0.16*lit(x)+(x%5===0?-0.06:0));
  /* High-water marks on the leg nearest the basin: the gauge. Solid, like the
     leg: in OPEN they punch four bands through its shadow. */
  for(let k=0;k<4;k++)
    for(let q=-trunkR;q<=trunkR;q++)
      put(sp,trunkXs[0]+q,H-2-M(0.42+k*0.34),1,0.06);

  /* ── log walls. Courses are a carpentry size, so the stripe holds whatever
     the wall height. Openings are screened apertures with a sparse mesh, as
     on the pile houses: the wall skips those pixels.

     Small openings. Measured: at 22% of the width and 46% of the wall they
     are 17 px square and leave the log courses no wall to run across. ──── */
  const openTop=wallTop+Math.round(wall*0.26),openBot=wallTop+Math.round(wall*0.54);
  const windows=[[wl+Math.round(W*0.13),wl+Math.round(W*0.28)],
                 [wl+Math.round(W*0.72),wl+Math.round(W*0.87)]];
  const screened=(x,y)=>y>=openTop&&y<=openBot&&windows.some(([a,b])=>x>=a&&x<=b);
  for(let y=wallTop;y<=base;y++){
    const seam=((y-wallTop)%course)===course-1;
    for(let x=wl;x<=wr;x++){
      if(screened(x,y)){
        if(((x+variant)%4)===0||((y-openTop)%4)===0) put(sp,x,y,1,0.70,0.78);
        continue;
      }
      const nn=clamp((x-cx)/half,-1,1);
      put(sp,x,y,1,(seam?0.22:0.46+0.30*lit(x))-0.06*Math.abs(nn));
    }
    if(seam){ put(sp,wl-1,y,1,0.30); put(sp,wr+1,y,1,0.30); }
    /* the return, with the same courses */
    for(let r=1;r<=bodyRows;r++)
      put(sp,wr+1+r,y-r,1,seam?0.14:0.28,1,N_SIDE);
  }
  /* one dark line where the logs meet the floor */
  for(let x=wl-1;x<=wr+1;x++) put(sp,x,base,1,0.12);
  /* a lintel and a sill log at each opening */
  for(const [a,b] of windows){
    for(let x=a-1;x<=b+1;x++){
      put(sp,x,openTop-1,1,0.78+0.10*lit(x));
      put(sp,x,openBot+1,1,0.20);
    }
  }
  /* One lamp behind one screen, in the accent ramp. The accent budget
     belongs to a person, so the lamp stays this small. */
  for(let y=openTop+2;y<openTop+6;y++)
    for(let x=windows[0][0]+3;x<windows[0][0]+8;x++)
      if(((x+variant)%4)!==0&&((y-openTop)%4)!==0) put(sp,x,y,6,0.92,0.70);
  /* The doorway onto the balcony. Its bottom row stays open: the threshold
     is a gap in the wall. */
  const dW=M(0.86)|1,dx0=cx-(dW>>1)+Math.round(W*0.10),dTop=base-M(1.95);
  for(let y=dTop;y<base;y++)for(let x=dx0;x<dx0+dW;x++) put(sp,x,y,1,0.08);
  for(let y=dTop-1;y<base;y++){ put(sp,dx0-1,y,1,0.34); put(sp,dx0+dW,y,1,0.34); }
  for(let x=dx0-1;x<=dx0+dW;x++) put(sp,x,dTop-1,1,0.40);

  /* ── the balustrade. Order: drawn after the wall, which otherwise
     overwrites every rail column between wl and wr. Height is
     LAKEHOUSE.railM. The rail shares rows with the deck's top face, so tone
     separates them: posts dark against the lit deck, top rail bright against
     the dark wall. ──────────────────────────────────────────────────────── */
  const posts=[wl-eave+3,wl+Math.round(W*0.30),wr-Math.round(W*0.30),wr+eave-3];
  const railY=deckFront-rail;
  for(const px of posts)for(let y=railY;y<=deckFront;y++)
    put(sp,px,y,OPEN,0.14+0.10*lit(px));
  /* The rail opens in front of the door. One bright row; the shadowed
     underside only where it crosses the wall, because two solid rows at full
     width cut the elevation in half. */
  const gate=x=>x>=dx0-1&&x<=dx0+dW;
  for(let x=posts[0];x<=posts[3];x++){
    if(gate(x)) continue;
    put(sp,x,railY,OPEN,0.74+0.22*lit(x));
    if(x>=wl&&x<=wr) put(sp,x,railY+1,OPEN,0.10);
    if(x%3===0) put(sp,x,railY+Math.round(rail*0.45),OPEN,0.22);
  }

  /* ── the roof: shallow, with a deep eave. Split shakes lie in horizontal
     courses with staggered butt joints, offset by course index. One flat
     fill is 22 rows of dark, the largest mass in the picture. */
  const shake=Math.max(2,M(0.24));
  const topAt=(x)=>{
    const over=Math.max(0,Math.abs(x-cx)-half);
    const ry=wallTop-Math.round(roof*(1-clamp(Math.abs(x-cx)/(half+eave),0,1)));
    return over?ry+Math.round(over*0.25):ry;
  };
  /* The planes behind the gable fall left and right and recede with the
     volume. The riser term keeps the surface watertight where the profile
     steps (src/construct.js). */
  const rPitch=Math.atan(LAKEHOUSE.pitch);
  for(let x=wl-eave;x<=wr+eave;x++){
    const t0=topAt(x), riser=Math.max(0,topAt(x+1)-t0);
    const N=roofNormal(rPitch,x<cx?-1:1);
    for(let r=bodyRows;r>=1;r--)for(let q=0;q<=riser;q++){
      const course=Math.floor(r/2);
      const butt=((x+course*3+variant)%7)===0;
      put(sp,x+r,t0-r+q,1,butt?0.44:0.66,1,N);
    }
  }
  /* the ridge, receding */
  for(let r=1;r<=bodyRows;r++) put(sp,cx+r,topAt(cx)-r,1,0.22,1,N_TOP);
  for(let x=wl-eave;x<=wr+eave;x++){
    const top=topAt(x);
    for(let y=top;y<=wallTop;y++){
      const course=Math.floor((wallTop-y)/shake);
      const butt=((x+course*3+variant)%7)===0;
      const lip=((wallTop-y)%shake)===0;
      put(sp,x,y,1,(y===top?0.70:0.26+(lip?0.12:0)-(butt?0.09:0))+0.16*lit(x));
    }
  }
  /* No ridge cap: the gable is seen end-on, so its ridge is a point. The lit
     top row of each column carries the roof's edge. */
  for(let x=wl-eave;x<=wr+eave;x++) put(sp,x,wallTop+1,1,x%5?0.14:0.36);
  /* A stove flue on the lee pitch, standing on the pitch half the depth
     back. Drawn down the gable face it reads as a stripe on the roof. */
  const fx=cx+Math.round(half*0.52), fr=bodyRows>>1;
  const fFoot=topAt(fx)-fr, fTop=fFoot-M(0.75);
  for(let y=fTop;y<=fFoot;y++)for(let x=fx+fr;x<fx+fr+2;x++) put(sp,x,y,1,0.52);
  return sp;
}

/* The house ladder, ground to balcony. Pitch, rung spacing and rail extension
   come from LAKEHOUSE (OSHA 1910.23). The anchor is the foot. */
function makeHouseLadder(){
  const step=LAKEHOUSE.rungM*LAKEHOUSE.ladderRowsPerM;
  const climb=Math.round(LAKEHOUSE.ladderLenM*LAKEHOUSE.ladderRowsPerM);
  const grab=M(LAKEHOUSE.railExtendM);
  const W=Math.max(5,M(LAKEHOUSE.ladderWM)|1);
  const H=climb+grab+2;
  const sp=newSprite(W,H);
  sp.ax=W>>1;sp.ay=H-1;
  sp.ramp='swampWood';sp.sMin=0.04;sp.sMax=0.88;sp.kind='houseLadder';
  const foot=H-1,landing=foot-climb,head=landing-grab;
  for(let y=head;y<=foot;y++){
    /* the stiles lighten as they rise */
    const t=0.26+0.26*((foot-y)/Math.max(1,climb+grab));
    put(sp,1,y,OPEN,t);
    put(sp,W-2,y,OPEN,t);
  }
  /* Rung k counts from the ground, so the drawn count is LAKEHOUSE.rungs.
     The rails carry past the top rung to the grab height with no rungs. */
  for(let k=0;k<=LAKEHOUSE.rungs;k++){
    const y=foot-Math.round(k*step);
    if(y>foot||y<landing) continue;
    for(let x=1;x<=W-2;x++) put(sp,x,y,OPEN,0.66);
  }
  /* Lashings at the deck edge and at mid-span. They wrap the stiles. */
  for(const y of [landing+1,foot-Math.round(climb*0.52)])
    for(const x of [0,1,W-2,W-1]) put(sp,x,y,1,0.20);
  return sp;
}

function makeRockingChair(frame=0){
  const phase=frame/ROCKER.frames;
  const seat=M(ROCKER.seatM),back=M(ROCKER.backM),len=M(ROCKER.lengthM);
  /* The sprite carries the deck lift: a prop has one anchor, the sorting
     one, so the feet float the trunk height above it. */
  const sill=M(LAKEHOUSE.trunkM);
  const W=(len+4)|1,H=back+sill+2;
  const sp=newSprite(W,H);
  sp.ax=W>>1;sp.ay=H-1;sp.ramp='swampWood';sp.sMin=0.04;sp.sMax=0.90;
  sp.kind='rockingChair';
  const floor=H-1-sill,cx=sp.ax;
  /* Every point moves by its own (R - y)·θ, so the chair shears. Rounded per
     row: two pixels at the rockers, one at the seat, none at the shoulders. */
  const shift=rowY=>Math.round(rockerShiftPx((floor-rowY)/PX_PER_M,phase));
  const at=(x,y,m,t)=>put(sp,x+shift(y),y,m,t);
  /* rockers: the shallow chord of a 1.00 m radius across 0.85 m of length */
  for(let x=cx-(len>>1);x<=cx+(len>>1);x++){
    const u=(x-cx)/Math.max(1,len/2);
    at(x,floor-Math.round(u*u*1.6),OPEN,0.28);
  }
  const seatY=floor-seat,backX=cx-Math.round(len*0.30);
  for(let x=cx-Math.round(len*0.34);x<=cx+Math.round(len*0.30);x++)
    at(x,seatY,1,0.58);
  for(let x=cx-Math.round(len*0.34);x<=cx+Math.round(len*0.30);x++)
    at(x,seatY+1,1,0.20);
  /* legs */
  for(const lx of [cx-Math.round(len*0.30),cx+Math.round(len*0.26)])
    for(let y=seatY+1;y<floor;y++) at(lx,y,OPEN,0.30);
  /* the back */
  for(let y=floor-back;y<=seatY;y++){
    at(backX,y,OPEN,0.42);
    at(backX+2,y,OPEN,0.24);
  }
  for(let x=backX;x<=backX+2;x++) at(x,floor-back,OPEN,0.70);
  /* one arm, on the near side */
  const armY=seatY-M(0.22);
  for(let x=backX+1;x<=cx+Math.round(len*0.24);x++) at(x,armY,OPEN,0.50);
  at(cx+Math.round(len*0.24),armY+1,OPEN,0.30);
  at(cx+Math.round(len*0.24),armY+2,OPEN,0.30);
  return sp;
}

export {
  LAKEHOUSE, ROCKER, makeHouseLadder, makeLakeHouse, makeRockingChair,
  makeSwampLakehouse, rockerFrameAt, rockerPeriodS, rockerShiftPx,
};
