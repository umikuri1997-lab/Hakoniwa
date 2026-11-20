import { PX_PER_M } from './scale.js';
import { SURFACE, SURF } from './surface.js';

/* The sand worm's body model. docs/DESERT.md section 9 and docs/CANON.md own
   the essay.

   One invented law, held by test/worm.test.mjs:

     A body may fluidise the sand it displaces, so drag on it falls to that of
     a dense fluid rather than that of a granular solid.

   The law does not cancel mass, weight, momentum, support or contact. It is
   also the animal's boundary: gravel does not fluidise, so the worm cannot
   enter the pavement.

   Not invented:
   - Speed. Maladen, Ding, Li & Goldman, Science 325:314-318 (2009): the
     sandfish lizard moves at its wave speed times an efficiency near 0.5. Worm
     speed is body wavelength times frequency times that efficiency. There is
     no speed constant.
   - Swell. Displacement reaches the surface only inside a cone at the angle
     of repose, so the bulge over a worm at depth d is about d/tan(repose)
     wider on each side, with the same displaced volume spread over that
     width.
   - Plume. Bagnold: the storm's own suspension term at a local intensity.

   The worm is a travelling deformation of the ground: a function of position
   and time evaluated per pixel by the ground pass. No sprite, no simulation.

   A breach is bounded by the frame, the height authority: 180 rows is 11.77 m
   and nothing may exceed half of it, so about five metres of body can clear
   the sand. */

/* Maladen et al. 2009: half the travelling wave's progress is slip. */
const WAVE_EFFICIENCY=0.50;

const WORM=Object.freeze({
  /* Authored: absolute size. No external anatomy exists for an invented
     animal (docs/MACHINES.md). Eighteen metres is a dune's own drawn length. */
  bodyM:18.0,
  /* Authored, measured: at 1.6 m the displaced volume raises a 6 px swell
     whose gradient encodes at 0.23 of the ground normal against a dune's
     1.00. 3.2 m puts it at 0.70. */
  girthM:3.20,
  /* one period of the travelling wave down the body */
  waveLengthM:9.0,
  waveHz:0.55,
  /* depth at the bottom of its crossing. The shallow end is derived below
     from repose. */
  deepM:4.40,
  /* Authored: how many are in the world at once, and how long a crossing
     lasts. */
  count:2,
  crossingS:96,
  restS:150,
  /* the route's own wander, in radians of heading over a crossing */
  routeBend:0.85,
  /* a passage lifts fines the way a storm does, locally and well under the
     storm's own ceiling */
  plume:0.22,
});

const WORM_REPOSE=SURFACE[SURF.sand].repose*Math.PI/180;
/* wave speed times efficiency, both the body's own terms */
const WORM_SPEED_MPS=WORM.waveLengthM*WORM.waveHz*WAVE_EFFICIENCY;
const WORM_SPEED_PX=WORM_SPEED_MPS*PX_PER_M;
const WORM_LEN_PX=WORM.bodyM*PX_PER_M;
const WORM_GIRTH_PX=WORM.girthM*PX_PER_M;

/* Swell half-width from depth: each metre of depth buys 1/tan(repose) metres
   of half-width on each side. */
const swellHalfPx=(depthM)=>
  (WORM.girthM*0.5+depthM/Math.tan(WORM_REPOSE))*PX_PER_M;
/* Swell height: the same displaced volume spread over that width. */
const swellRisePx=(depthM)=>{
  const half=swellHalfPx(depthM);
  const area=Math.PI*Math.pow(WORM.girthM*0.5*PX_PER_M,2);
  return area/Math.max(1,half*2);
};

/* Minimum depth, derived. The mound is ground, so its flanks obey repose. A
   raised cosine of height r and half-width w has a steepest slope of
   pi*r/(2w), and r is the displaced area over 2w, so the slope goes as 1/w^2.
   Solving pi*A/(4 w^2) <= tan(repose) for w and inverting the cone gives the
   minimum depth: 0.99 m at a 3.2 m girth. Measured against the composed swell
   in test/worm.test.mjs. */
const WORM_AREA_PX=Math.PI*Math.pow(WORM.girthM*0.5*PX_PER_M,2);
const WORM_MIN_HALF_PX=Math.sqrt(Math.PI*WORM_AREA_PX
  /(4*Math.tan(WORM_REPOSE)));
const WORM_MIN_DEPTH_M=Math.max(0,
  (WORM_MIN_HALF_PX/PX_PER_M-WORM.girthM*0.5)*Math.tan(WORM_REPOSE));

/* depth over a crossing: up in the middle, then back down */
const wormDepthAt=(phase)=>{
  const t=Math.min(1,Math.max(0,phase));
  const u=Math.sin(Math.PI*t);
  return WORM.deepM+(WORM_MIN_DEPTH_M-WORM.deepM)*u*u;
};

const F=(n)=>Number(n).toFixed(8);

/* The same chain for the ground shader: explicit time, then route, depth,
   swell width and swell height in that order, so a frame and a test cannot
   disagree. */
const WORM_GLSL=`
const float WORM_COUNT=${F(WORM.count)};
const float WORM_SPEED_PX=${F(WORM_SPEED_PX)};
const float WORM_LEN_PX=${F(WORM_LEN_PX)};
const float WORM_CROSSING=${F(WORM.crossingS)};
const float WORM_REST=${F(WORM.restS)};
const float WORM_BEND=${F(WORM.routeBend)};
const float WORM_TAN_REPOSE=${F(Math.tan(WORM_REPOSE))};
const float WORM_GIRTH_PX=${F(WORM_GIRTH_PX)};
const float WORM_DEPTH_LO=${F(WORM_MIN_DEPTH_M)};
const float WORM_DEPTH_HI=${F(WORM.deepM)};
const float WORM_PX_PER_M=${F(PX_PER_M)};
const float WORM_PLUME=${F(WORM.plume)};

float wormDepthAt(float phase){
  float u=sin(3.14159265*clamp(phase,0.0,1.0));
  return WORM_DEPTH_HI+(WORM_DEPTH_LO-WORM_DEPTH_HI)*u*u;
}
float wormSwellHalf(float depthM){
  return (WORM_GIRTH_PX*0.5+depthM*WORM_PX_PER_M/WORM_TAN_REPOSE);
}
float wormSwellRise(float depthM){
  float swell=wormSwellHalf(depthM);
  float area=3.14159265*(WORM_GIRTH_PX*0.5)*(WORM_GIRTH_PX*0.5);
  return area/max(1.0,swell*2.0);
}
/* Where worm i is at this instant, and which way it is pointing. An analytic
   route: a committed heading that bends slowly over the crossing. */
void wormAt(float i,float time,float seed,out vec2 head,out vec2 dir,out float phase){
  float cycle=WORM_CROSSING+WORM_REST;
  float t=mod(time+i*cycle*0.53+seed,cycle);
  phase=clamp(t/WORM_CROSSING,0.0,1.0);
  float bearing=seed*6.2831853+i*2.399+phase*WORM_BEND;
  float run=phase*WORM_CROSSING*WORM_SPEED_PX;
  dir=vec2(cos(bearing),sin(bearing));
  vec2 start=vec2(cos(seed*13.7+i*5.1),sin(seed*9.3+i*3.7))*1400.0;
  head=start+dir*run;
}
/* The heave at a ground point: distance to the worm's own axis segment, and a
   cosine bulge across it. Returns metres of rise, and 0 when it is resting or
   the point is outside the swell. */
float wormHeave(vec2 gp,float time,float seed){
  float total=0.0;
  for(int i=0;i<4;i++){
    if(float(i)>=WORM_COUNT) break;
    vec2 head,dir; float phase;
    wormAt(float(i),time,seed,head,dir,phase);
    if(phase<=0.0||phase>=1.0) continue;
    vec2 tail=head-dir*WORM_LEN_PX;
    vec2 ab=head-tail;
    float u=clamp(dot(gp-tail,ab)/max(1.0,dot(ab,ab)),0.0,1.0);
    float d=length(gp-(tail+ab*u));
    float depthM=wormDepthAt(phase);
    float swell=wormSwellHalf(depthM);
    if(d>=swell) continue;
    /* the bulge across the axis, and a taper along it so the head and the tail
       are not a cut across the sand */
    float across=0.5+0.5*cos(3.14159265*d/swell);
    float along=smoothstep(0.0,0.12,u)*smoothstep(0.0,0.22,1.0-u);
    total+=wormSwellRise(depthM)*across*along;
  }
  return total;
}
`;

/* CPU mirror of WORM_GLSL: same order, same arithmetic. */
function wormAt(i,timeS,seed){
  const cycle=WORM.crossingS+WORM.restS;
  const t=((timeS+i*cycle*0.53+seed)%cycle+cycle)%cycle;
  const phase=Math.min(1,Math.max(0,t/WORM.crossingS));
  const bearing=seed*Math.PI*2+i*2.399+phase*WORM.routeBend;
  const run=phase*WORM.crossingS*WORM_SPEED_PX;
  const dir={x:Math.cos(bearing),y:Math.sin(bearing)};
  const start={x:Math.cos(seed*13.7+i*5.1)*1400,y:Math.sin(seed*9.3+i*3.7)*1400};
  return {phase,dir,head:{x:start.x+dir.x*run,y:start.y+dir.y*run}};
}

function wormHeavePx(gx,gy,timeS,seed){
  let total=0;
  for(let i=0;i<WORM.count;i++){
    const {phase,dir,head}=wormAt(i,timeS,seed);
    if(phase<=0||phase>=1) continue;
    const tail={x:head.x-dir.x*WORM_LEN_PX,y:head.y-dir.y*WORM_LEN_PX};
    const abx=head.x-tail.x, aby=head.y-tail.y;
    const u=Math.min(1,Math.max(0,((gx-tail.x)*abx+(gy-tail.y)*aby)
      /Math.max(1,abx*abx+aby*aby)));
    const d=Math.hypot(gx-(tail.x+abx*u),gy-(tail.y+aby*u));
    const depthM=wormDepthAt(phase);
    const half=swellHalfPx(depthM);
    if(d>=half) continue;
    const across=0.5+0.5*Math.cos(Math.PI*d/half);
    const along=smoothstep01(0,0.12,u)*smoothstep01(0,0.22,1-u);
    total+=swellRisePx(depthM)*across*along;
  }
  return total;
}
function smoothstep01(a,b,x){
  const t=Math.min(1,Math.max(0,(x-a)/Math.max(1e-9,b-a)));
  return t*t*(3-2*t);
}

export {
  WORM, WORM_GLSL, WAVE_EFFICIENCY, WORM_REPOSE, WORM_SPEED_MPS, WORM_SPEED_PX,
  WORM_LEN_PX, WORM_GIRTH_PX, WORM_MIN_DEPTH_M, WORM_MIN_HALF_PX, WORM_AREA_PX,
  swellHalfPx, swellRisePx, wormAt, wormDepthAt, wormHeavePx,
};
