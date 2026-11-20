import { clamp } from './math.js';
import { newSprite } from './sprite.js';
import {
  FACE, M, N_FRONT, N_SIDE, N_TOP, SOLID,
  bayRhythm, cabinet, cabinetBox, courseFit, courseWall, doorPx, eavePx,
  groundFootprint, occlude, opening, put, roofPlane, wallSlab,
} from './construct.js';
import { sandHopHeightM, sandShear } from './weather.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The oasis hut, in earth. docs/DESERT.md owns the three derivations:

   Wall thickness is thermal lag. The daily wave's penetration depth is
   d = sqrt(alpha * P / pi) and the lag at depth x is (x/d) * (P / 2 pi). For
   adobe near 5.3e-7 m^2/s and a 24 h period, d is 12.1 cm; an eleven-hour lag
   gives 35 cm, inside the 30-60 cm built range.

   The roof is a Nubian vault because there is no timber for beams.

   The malqaf intake clears ten saltation hop heights at the strongest wind
   the control allows. src/weather.js owns the transport model.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Source: standard building-physics values for a stabilised earth wall.
   Conductivity near 0.75 W/mK, density 1900 kg/m3, specific heat 750 J/kgK. */
const ADOBE_ALPHA=5.3e-7;                 // m^2/s
const DAY_S=86400;
const WAVE_DEPTH_M=Math.sqrt(ADOBE_ALPHA*DAY_S/Math.PI);
/* Authored: the lag in hours. Outdoor peak is mid-afternoon; the inner face
   peaks when the household is asleep. */
const WALL_LAG_H=11;
const WALL_M=(WALL_LAG_H*3600)*WAVE_DEPTH_M*2*Math.PI/DAY_S;

/* The saltation layer at the strongest wind the control allows. The mass
   profile decays with a scale height of about one hop, so ten is the tail. */
const STORM_SCALE=10;
const SALTATION_TOP_M=STORM_SCALE*sandHopHeightM(sandShear(3));

const HUT_M=Object.freeze({
  /* one room, at the small end of what earth spans without an intermediate
     wall */
  w:4.60, d:4.20,
  wall:WALL_M,
  /* head height at the springing, where the vault starts */
  spring:2.05,
  /* the vault's rise over its span. Close to a semicircle: a shallower arch
     pushes its abutments outward and mud brick cannot resist that. */
  vaultRise:0.44,
  /* Openings are small and high: each is a hole in the thermal mass, and hot
     air leaves through the top of a room. */
  doorHead:1.92, doorWidth:0.86,
  windowSide:0.42, windowHead:1.86,
  /* the parapet of a flat sleeping roof */
  parapet:0.52,
  /* the shaft; its intake height is the storm's */
  malqafHead:SALTATION_TOP_M+1.10,
  malqafW:0.86, malqafD:0.70,
  /* A low windward deflector wall: it lifts the flow over the yard and drops
     the sand in front of itself, not against the door. */
  deflector:0.74, deflectorRun:5.40,
  yard:0.914,
});

/* Three households: one room, one room with a shaft, and a walled pair. */
const HUT_VARIANTS=Object.freeze([
  Object.freeze({wide:1.00, malqaf:false, court:false, flat:false}),
  Object.freeze({wide:1.14, malqaf:true,  court:false, flat:false}),
  Object.freeze({wide:1.34, malqaf:true,  court:true,  flat:true }),
]);

function hutDims(variant=0){
  const V=HUT_VARIANTS[variant%HUT_VARIANTS.length];
  const wM=HUT_M.w*V.wide;
  const box=cabinetBox({wM,dM:HUT_M.d,hM:HUT_M.spring});
  const wall=Math.max(2,M(HUT_M.wall));
  /* the rise scales with the span, so a wider hut is a taller one */
  const rise=V.flat?M(HUT_M.parapet):Math.max(3,M(wM*HUT_M.vaultRise));
  const eave=eavePx(HUT_M.wall*0.5);      // the wall head is the eave here
  return {V,box,wall,rise,eave,wM};
}

/* The roof profile, as rows above the springing line. A barrel seen end-on
   is a sine in the span; a parapet is a step. */
function hutRoofAt(D){
  const {box,rise,V}=D;
  const span=Math.max(1,box.w-1);
  if(V.flat) return (fx)=>(fx<0||fx>span)?0:rise;
  return (fx)=>{
    const t=clamp(fx/span,0,1);
    return Math.round(rise*Math.sin(Math.PI*t));
  };
}

function hutGeom(variant=0){
  const D=hutDims(variant);
  const {box,rise,eave}=D;
  const riseAt=hutRoofAt(D);
  const x0=eave;
  const malqafH=D.V.malqaf?M(HUT_M.malqafHead)-M(HUT_M.spring):0;
  const malqafW=D.V.malqaf?Math.max(3,M(HUT_M.malqafW))|1:0;
  const malqafFx=Math.round(box.w*0.70);
  const above=Math.max(rise+box.rows, riseAt(malqafFx)+malqafH+box.rows);
  const W=(x0+box.w+eave+box.cols)|1;
  const H=box.h+above+2;
  const Vb=cabinet(box,x0,H-1);
  const sp={w:W,h:H,ax:W>>1,ay:H-1};
  /* three bays: door right, window left, and a blind middle */
  const bays=bayRhythm(box.w,3,{margin:M(0.5),widthPx:M(HUT_M.windowSide)});
  const doorW=Math.max(5,M(HUT_M.doorWidth))|1;
  const doorX=x0+Math.round((bays[2][0]+bays[2][1])/2);
  return {D,box,V:Vb,sp,W,H,x0,riseAt,above,bays,doorX,doorW,
          malqafH,malqafW,malqafFx};
}

const hutFootprint=(variant=0)=>{
  const G=hutGeom(variant);
  const f=groundFootprint(G.box,G.D.eave);
  return {hx:f.hx+(G.D.V.court?M(HUT_M.deflectorRun*0.5):0),
          back:f.back, front:M(1.1), yard:M(HUT_M.yard)};
};
const hutSlab=(variant=0)=>{
  const G=hutGeom(variant);
  return wallSlab(G.box,G.x0,G.sp.ax);
};
const hutDoorDX=(variant=0)=>{
  const G=hutGeom(variant);
  return G.doorX+((G.doorW>>1))-G.sp.ax;
};

function makeHut(rnd,variant=0){
  const G=hutGeom(variant);
  const {D,box,V,W,H,x0,riseAt,bays,doorX,doorW}=G;
  const sp=newSprite(W,H);
  sp.ax=G.sp.ax; sp.ay=G.sp.ay;
  /* Earth walls take the masonry family; the openings glaze against the
     canopy ramp (shade behind a desert window at midday). */
  sp.ramp='masonry'; sp.ramp2='desertCanopy';
  sp.sMin=0.06; sp.sMax=1.00; sp.kind='hut'; sp.tilt=0;

  /* A mud brick course with its bed joint is about 9 cm, a third of the
     timber course, so an earth wall has three times the horizontal rhythm of
     a log one. */
  const brickM=0.09;
  courseWall(sp,V,{courseM:brickM,seamDrop:0.26});

  /* The vault's end wall. roofPlane draws the shell, and its depth sweep
     runs up-right, so the flank right of the crown fills itself. The arch's
     end face is wall: it takes the wall's material, value and brick rhythm
     above the springing. Without it the left half of the vault is a hole. */
  const CE=courseFit(box.h+D.rise,brickM);
  for(let fx=0;fx<box.w;fx++){
    const tRise=riseAt(fx);
    for(let q=1;q<=tRise;q++){
      const seam=CE.seam[D.rise-q]&&q<tRise;
      put(sp,x0+fx,V.yTop-q,SOLID,seam?FACE.front*0.26:FACE.front,1,N_FRONT);
    }
  }

  /* The vault is a sine in riseAt through roofPlane. Its value falls from
     the crown to the springing as the curved surface turns from the sun. */
  const span=Math.max(1,box.w-1);
  roofPlane(sp,V,{
    riseAt, fx0:-D.eave, fx1:box.w-1+D.eave,
    wallX0:0, wallX1:box.w-1,
    valueAt:(fx)=>{
      if(D.V.flat) return FACE.top;
      const t=clamp(fx/span,0,1);
      /* three bands for the posterise ladder: crown, haunch, springing */
      const lit=Math.sin(Math.PI*t);
      return lit>0.86?FACE.top:lit>0.52?FACE.top*0.78:FACE.front;
    },
    normalAt:(fx)=>{
      if(D.V.flat) return N_TOP;
      const t=clamp(fx/span,0,1);
      const slope=Math.cos(Math.PI*t)*Math.PI*D.rise/span;
      const n=Math.hypot(1,slope);
      return {x:-slope/n*0.82, y:N_TOP.y/n, z:N_TOP.z/n+0.18};
    },
    fascia:2, fasciaValue:0.10, castRows:2, cast:0.62,
  });

  /* the parapet's top edge, a lip along the front of the slab */
  if(D.V.flat){
    const yTop=V.yTop-D.rise;
    for(let fx=-D.eave;fx<=box.w-1+D.eave;fx++)
      put(sp,x0+fx,yTop,SOLID,FACE.top*1.06,1,N_TOP);
  }

  /* The openings: a door on the right and one small window high on the
     left. */
  const dh=doorPx(HUT_M.doorHead);
  opening(sp,V,{fx0:doorX-x0-(doorW>>1), fx1:doorX-x0+(doorW>>1),
                fy0:box.h-dh, fy1:box.h-1, kind:'door'});
  const winH=Math.max(3,M(HUT_M.windowSide));
  const winTop=box.h-M(HUT_M.windowHead);
  opening(sp,V,{fx0:bays[0][0], fx1:bays[0][1],
                fy0:winTop, fy1:winTop+winH-1, kind:'window', glaze:0.88});

  /* The malqaf: a box shaft on the roof, one face open to the wind. */
  if(D.V.malqaf){
    const foot=V.yTop-riseAt(G.malqafFx);
    const half=G.malqafW>>1;
    const mx=x0+G.malqafFx;
    for(let dx=-half;dx<=half;dx++)
      for(let dy=0;dy<G.malqafH;dy++){
        const face=dx===half?FACE.side:dx===-half?FACE.front*0.78:FACE.front;
        put(sp,mx+dx,foot-dy,SOLID,face,1,
            dx===half?N_SIDE:N_FRONT);
      }
    /* the intake: the top third of the windward face, recessed */
    const mouth=Math.max(2,Math.round(G.malqafH*0.34));
    for(let dx=-half+1;dx<=half-1;dx++)
      for(let dy=G.malqafH-mouth;dy<G.malqafH-1;dy++)
        put(sp,mx+dx,foot-dy,SOLID,0.07,1,N_FRONT);
    for(let dx=-half;dx<=half;dx++)
      put(sp,mx+dx,foot-G.malqafH,SOLID,FACE.top,1,N_TOP);
    occlude(sp,mx-half-1,foot-1,0.30);
  }

  /* The deflector: a low windward wall the drift meets before the house. */
  if(D.V.court){
    const h=Math.max(2,M(HUT_M.deflector));
    const run=Math.max(6,M(HUT_M.deflectorRun));
    const base=V.yBase;
    for(let i=0;i<run;i++){
      const x=x0-D.eave-2-i;
      if(x<0) break;
      /* it steps down as it runs out */
      const hh=Math.max(1,Math.round(h*(1-i/run*0.55)));
      for(let dy=0;dy<hh;dy++)
        put(sp,x,base-dy,SOLID,dy===hh-1?FACE.top:FACE.front*0.86,1,
            dy===hh-1?N_TOP:N_FRONT);
    }
  }
  return sp;
}

export {
  HUT_M, HUT_VARIANTS, SALTATION_TOP_M, WALL_LAG_H,
  hutDims, hutDoorDX, hutFootprint, hutGeom, hutSlab, makeHut,
};
