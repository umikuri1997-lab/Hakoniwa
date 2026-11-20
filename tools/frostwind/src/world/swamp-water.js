import { GROUND_PX_PER_ROW, KARST_WALL, PEAT_REPOSE, basinUnion, karstDepth, lobe, lobeMetric, lobeRun, reposeDepth } from '../basin.js';
import { clamp, lerp, smoothstep } from '../math.js';
import { fbm, hashf } from '../rng.js';
import { SWAMP_MAX_M } from '../sunlight.js';
import { SURF, SURFACE } from '../surface.js';

const SWAMP_WADE_M=SURFACE[SURF.flooded].depth[1];
/* Invariant: one conversion between the swamp's field and its depth.
   hydrologyAt, the chunk bake and the cross-sections read it here.
   Cross-sections state floors in metres, the unit a bank angle is checked in. */
const SWAMP_DEPTH_BASE=0.04, SWAMP_DEPTH_GAIN=4.2;
const swampDepthOf=(signal)=>clamp(SWAMP_DEPTH_BASE+signal*SWAMP_DEPTH_GAIN,
                                   SWAMP_DEPTH_BASE,SWAMP_MAX_M);
const swampSignalOf=(depthM)=>depthM/SWAMP_DEPTH_GAIN;

function makeSwampWater(w){
  const {
    COMMON, PLAN, nK, nL, nSW, pathX, poiKind, rimAt, seed,
  }=w;
  /* Ecosystem engineers are world facts. Their deterministic refugia deepen
     local hydroperiod and remain when the animal is off-screen or absent. */
  const KARST=PLAN.water==='karst';
  const ALLIGATOR_HOLES=KARST?Array.from({length:5},(_,i)=>{
    const y=-820+i*610;
    const side=i%2?-1:1;
    return {kind:'alligatorHole',id:i,
      x:Math.round(pathX(y)+side*(105+hashf(i,seed,0xa110)*95)),
      y:y+Math.round((hashf(i,seed,0xa111)-0.5)*90),
      r:34+Math.round(hashf(i,seed,0xa112)*16),influenceRadius:260};
  }):[];

  /* Swamp mosaic: reaches / karst backwaters / wallows; sharp sections at full
     res. Reaches are wadeable by construction. See docs/SWAMP.md, docs/CANON.md. */
  const SWAMP_WATER={
    /* 1.76 m + SWAMP_DEPTH_BASE sits the depth ramp on its 1.80 m ceiling
       across the whole floor. */
    karstFloorM :1.76,
    /* Outline wander in radius units, applied to the metric, as BASIN.wobble.
       A wall crossing the whole depth range inside a quarter of a radius moves
       under a pixel for a ±0.045 field term. Measured: at 0.075 no backwater
       in three seeds reads as a stamped ellipse and none grows an arm. */
    wander      :0.075,
    /* A reach floor sits below the wade line, so no reach divides the swamp.
       At 36° peat repose a 0.30 m floor spends 6 px of the 26 px half-width
       on each bank and leaves about 40 px of flat bed. */
    reachFloorM :0.30, reachHalfPx:26,
    /* Dry-season refuge: test/swamp.test.mjs holds 0.72 m or more. Dug, so it
       is bank all the way down at r = 34-50 px. */
    wallowFloorM:1.60,
    /* Worn trail between a wallow and its water: a shallow V, under the wade
       line. At 0.45 m peat repose puts the middle two pixels at 0.43 m, a
       hairline of uncrossable water along the whole trail. */
    trailFloorM :0.34, trailHalfPx:9,
  };
  /* Flooded forest floor, wadeable by construction. Invariant: the two
     amplitudes on top of the bias cannot reach the wade line, so standing
     water outside a section is walkable. Deep water is only a section: channel
     bed, solution basin, wallow. The test reads that headroom back.

     The floor carries the swamp's shallow water: a walled basin gives an 8 px
     margin against the 30-40 px of a cosine shelf.

     Measured over the settlement region, eight seeds: walkable 92.6-93.5%
     against a 92% floor, wadeable water 1.2-2.6x deep water, standing water
     15-26% of ground. The water budget sets all three constants.

     · FLOOR_BIAS: floor height relative to the waterline.
     · FLOOD_AMP: inundated share per reach. 0.045 swings it by three.
     · BACKWATER_R: basins keep spacing, lose 15% of radius. A floored basin is
       deep across nearly all of itself: full radius puts 8.3% of the mosaic
       under uncrossable water. */
  const FLOOR_BIAS=-0.0095, FLOOD_AMP=0.020, BACKWATER_PITCH=430,
        BACKWATER_R=0.85;
  const swampSmooth=(wx,wy)=>{
    const basin=FLOOR_BIAS+fbm(nL,wx*0.00115+19,wy*0.00115+7,4)*FLOOD_AMP;
    const micro=fbm(nK,wx*0.014+73,wy*0.014+29,3)*0.045;
    /* The landing sits on raised ground. */
    const landing=poiKind(wx,wy,'village')*0.095;
    return basin-micro-landing-rimAt(wx,wy)*0.22;
  };
  const swampWander=(wx,wy)=>
    fbm(nSW,wx*0.031,wy*0.062,3)*SWAMP_WATER.wander;
  /* The chain. Each lattice band holds one solution basin, and its reach runs
     to the next basin down-world. Both are closed forms of the band index, so
     a pixel pays for the three bands that can reach it.

     The mooring pool is stated here and the settlement reads it. Measured
     failure: dock, punt, mooring and trap authored as offsets from the landing
     go dry when their water moves. The pool centre sits off the path, so the
     landing stays walkable ground on its shore.

     `basin.js` owns the lobe outline. waterLobe states how much each kind of
     hollow varies. */
  const waterLobe=(key,salt,groundR,aspectLo,aspectHi,crenel)=>{
    const u=(n)=>hashf(key,n,seed^salt);
    const rho=Math.exp(Math.log(aspectLo)
      +(Math.log(aspectHi)-Math.log(aspectLo))*u(1));
    const k=Math.sqrt(rho),T=Math.PI*2;
    return lobe(groundR*k,groundR/k,u(2)*Math.PI,
      [[crenel*(0.34+0.42*u(3)),u(4)*T],
       [crenel*(0.52+0.48*u(5)),u(6)*T],
       [crenel*(0.26+0.40*u(7)),u(8)*T]]);
  };
  /* Ground distance from a lobe's centre to its shoreline along a ground
     bearing. Channel mouths and settlement moorings read it. */
  const GY=GROUND_PX_PER_ROW;
  const lobeEdge=(L,ux,uy)=>1/Math.max(1e-6,lobeMetric(ux,uy/GY,L));
  const MOORING=KARST?(()=>{
    const cx=pathX(COMMON.y)+96,cy=COMMON.y+40;
    /* As irregular as a backwater. Measured: at 0.11 it sits within 4% of its
       best-fit ellipse. */
    const L=waterLobe(7,0x30015,98,0.78,1.34,0.21);
    return {cx,cy,lobe:L,rx:L.rx,ry:L.ry,
      /* Point at fraction `q` from centre to shore on bearing `a` (ground
         radians), in screen pixels. */
      at:(a,q)=>{
        const ux=Math.cos(a),uy=Math.sin(a),e=lobeEdge(L,ux,uy)*q;
        return {x:Math.round(cx+ux*e),y:Math.round(cy+uy*e/GY)};
      }};
  })():null;
  const basinMemo=new Map();
  const swampBasin=k=>{
    let b=basinMemo.get(k);
    if(b) return b;
    const cy=k*BACKWATER_PITCH+Math.sin(k*1.73+0.4)*62;
    const side=k%2?-1:1;
    /* The outline is stated in ground pixels, so size and aspect vary
       separately and a basin can be long across the depth axis. */
    const L=waterLobe(k,0xba51,(110+24*(0.5+0.5*Math.sin(k*2.11)))*BACKWATER_R,
                      0.62,1.55,0.20);
    b={cx:pathX(cy)+side*(122+34*Math.cos(k*1.19)), cy, lobe:L,
       rx:L.rx, ry:L.ry, floorM:SWAMP_WATER.karstFloorM,
       /* Half-width of the reach leaving this basin. */
       halfW:SWAMP_WATER.reachHalfPx*(0.82+0.36*(0.5+0.5*Math.sin(k*1.51)))};
    basinMemo.set(k,b);
    return b;
  };
  /* Channel long profile: bend, flare, thalweg/sill in ground pixels.
     See docs/SWAMP.md, docs/CANON.md, PROJECTION.md. */
  const BEND_FRAC=0.055;
  const channelDepth=(wx,wy,A,B,cfg,wander)=>{
    const ax=A.x,ay=A.y*GY,bx=B.x,by=B.y*GY,px=wx,py=wy*GY;
    const vx=bx-ax,vy=by-ay,L2=Math.max(1,vx*vx+vy*vy),L=Math.sqrt(L2);
    const t=clamp(((px-ax)*vx+(py-ay)*vy)/L2,0,1),s=t*L;
    const off=fbm(nSW,s*0.0105+11.3,4.7,2)*L*BEND_FRAC;
    const dist=Math.hypot(px-(ax+vx*t-vy/L*off),py-(ay+vy*t+vx/L*off));
    const outA=s-A.edge,outB=L-s-B.edge;
    const mouth=smoothstep(0,cfg.entry,Math.min(outA,outB));
    const bed=lerp(outA<outB?A.floorM:B.floorM,cfg.sill,mouth);
    const half=cfg.halfW*(0.74+0.52*(0.5+0.5*Math.sin(s*0.021+1.9))+wander*4)
      *(1+cfg.flare*(1-mouth));
    return reposeDepth(half-dist,bed,PEAT_REPOSE);
  };
  /* Channel endpoint: position, body floor, and shore distance from the
     centre along the run. */
  const mouthOf=(body,other)=>{
    const ux=other.cx-body.cx,uy=(other.cy-body.cy)*GY,m=Math.hypot(ux,uy)||1;
    return {x:body.cx,y:body.cy,floorM:body.floorM,
            edge:lobeEdge(body.lobe,ux/m,uy/m*GY)};
  };
  /* A channel between two bodies, resolved once. Both shoreline radii are
     properties of the pair, so nothing here is rebuilt per pixel.

     The entry grade is a fraction of the gap, capped. Measured failure: a
     fixed length runs out of channel when two bodies sit close, and the bed
     stays at pool floor: a 1.01 m reach with no riffle between basins 200 px
     apart. Scaled with spacing, every channel has its sill. */
  const channel=(a,b,cfg)=>{
    const A=mouthOf(a,b),B=mouthOf(b,a);
    const gap=Math.hypot(a.cx-b.cx,(a.cy-b.cy)*GY)-A.edge-B.edge;
    return {A,B,cfg:{...cfg,entry:clamp(gap*0.42,8,cfg.entry)}};
  };
  const TRAIL={sill:SWAMP_WATER.trailFloorM,entry:52,flare:1.3,
               halfW:SWAMP_WATER.trailHalfPx};
  const reachMemo=new Map();
  const swampReach=k=>{
    let r=reachMemo.get(k);
    if(r) return r;
    r=channel(swampBasin(k),swampBasin(k+1),
      {sill:SWAMP_WATER.reachFloorM,entry:120,flare:2.0,
       halfW:swampBasin(k).halfW});
    reachMemo.set(k,r);
    return r;
  };
  /* Wallows carry the lobe outline. An `r, r` screen circle is a 1:2 slot on
     the ground; √2·r keeps the area of that circle. */
  const WALLOWS=ALLIGATOR_HOLES.map(h=>({
    id:h.id,cx:h.x,cy:h.y,floorM:SWAMP_WATER.wallowFloorM,
    lobe:waterLobe(h.id,0x9a110,h.r*Math.SQRT2,0.72,1.38,0.17),
  }));
  /* Each wallow drains to the nearest basin in the chain. Both mouths are
     resolved once. */
  const holeLink=WALLOWS.map(h=>{
    const band=Math.round(h.cy/BACKWATER_PITCH);
    let best=null,bd=Infinity;
    for(let k=band-1;k<=band+1;k++){
      const b=swampBasin(k),d=Math.hypot(h.cx-b.cx,(h.cy-b.cy)*GY);
      if(d<bd){bd=d;best=b;}
    }
    return {basin:best,...channel(h,best,TRAIL),
            /* Reach of this wallow and its trail, for the cull box. */
            cull:h.lobe.rx+bd+TRAIL.halfW*3};
  });
  /* Basins merge before they are cut: the metrics soft-union (basin.js owns
     the rule). Taking the deeper of two overlapping outlines draws a figure of
     eight with two shores crossing inside it.

     Exported because the compiled sinkhole unions with it too. A place that
     cannot see the basin it landed in erases part of it and leaves a
     crescent. */
  const swampBasinMetric=(wx,wy,wander)=>{
    const band=Math.round(wy/BACKWATER_PITCH);
    let q=0;
    for(let k=band-1;k<=band+1;k++){
      const b=swampBasin(k);
      const bq=lobeMetric(wx-b.cx,wy-b.cy,b.lobe)+wander;
      q=k===band-1?bq:basinUnion(q,bq);
    }
    if(MOORING) q=basinUnion(q,lobeMetric(wx-MOORING.cx,wy-MOORING.cy,
                                          MOORING.lobe)+wander);
    return q;
  };
  /* Sections: analytic, sharp, in metres of depth, converted once. */
  const swampSections=(wx,wy,wander)=>{
    const band=Math.round(wy/BACKWATER_PITCH);
    let d=karstDepth(swampBasinMetric(wx,wy,wander),
                     SWAMP_WATER.karstFloorM,KARST_WALL);
    for(let k=band-1;k<=band+1;k++){
      /* Bank wobble reads the basins' outline term, at four times the weight
         (channelDepth): 0.075 of a 34 px half-width is two pixels, which does
         not break a 500 px edge. */
      const r=swampReach(k);
      d=Math.max(d,channelDepth(wx,wy,r.A,r.B,r.cfg,wander));
    }
    for(let i=0;i<WALLOWS.length;i++){
      const h=WALLOWS[i],L=holeLink[i];
      if(Math.abs(wx-h.cx)>L.cull||Math.abs(wy-h.cy)*GY>L.cull) continue;
      /* A dug hollow is peat at its angle of repose. */
      d=Math.max(d,reposeDepth(lobeRun(wx-h.cx,wy-h.cy,h.lobe,wander),
                               h.floorM,PEAT_REPOSE));
      /* The trail is a reach channel with a wallow at one end. */
      d=Math.max(d,channelDepth(wx,wy,L.A,L.B,L.cfg,wander));
    }
    return swampSignalOf(d);
  };
  /* swampChain: enumerable deep-water bodies (bounds + optional reach). See docs/SWAMP.md. */
  const swampChain=(y0,y1)=>{
    if(!KARST) return [];
    const body=(kind,c,reach)=>({kind,cx:c.cx,cy:c.cy,rx:c.lobe.rx,ry:c.lobe.ry,
                                 lobe:c.lobe,reach:reach||null});
    const span=(a,b,cfg)=>({x:b.cx,y:b.cy,
      halfW:cfg.halfW*1.26*(1+cfg.flare)
        +Math.hypot(a.cx-b.cx,(a.cy-b.cy)*GY)*BEND_FRAC});
    const out=[body('mooring',MOORING)];
    for(let k=Math.round(y0/BACKWATER_PITCH)-1;k<=Math.round(y1/BACKWATER_PITCH)+1;k++){
      const b=swampBasin(k),n=swampBasin(k+1);
      out.push(body('basin',b,span(b,n,swampReach(k).cfg)));
    }
    for(let i=0;i<WALLOWS.length;i++)
      out.push(body('wallow',WALLOWS[i],
        span(WALLOWS[i],holeLink[i].basin,holeLink[i].cfg)));
    return out;
  };
  /* Invariant: one composition rule. The analytic field, the water mask and the
     chunk bake differ only in where the two smooth terms come from.
     A bed is an elevation, so the two terms take a max, never a sum. Summing
     makes a 0.30 m reach bed measure 0.41 m across a wet hollow. docs/SWAMP.md
     owns the derivation. */
  const swampCompose=(wx,wy,smooth,wander)=>{
    const sec=swampSections(wx,wy,wander);
    return sec>0?Math.max(smooth,sec):smooth;
  };
  const swampSignal=(wx,wy)=>
    swampCompose(wx,wy,swampSmooth(wx,wy),swampWander(wx,wy));

  return {
    ALLIGATOR_HOLES, SWAMP_WATER, swampSmooth, swampWander, MOORING,
    swampBasinMetric, swampChain, swampCompose, swampSignal,
  };
}

export { SWAMP_WADE_M, swampDepthOf, swampSignalOf, makeSwampWater };
