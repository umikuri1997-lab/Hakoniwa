import { WCA, WSA } from './constants.js';
import { PX_PER_M } from './scale.js';

const WATER_DENSITY_KG_M3=1000;
const WATER_SURFACE_TENSION_N_M=0.072;
const GRAVITY_M_S2=9.80665;
/* Minimum phase speed from the deep-water gravity-capillary dispersion
   relation: c_min=(4 g sigma / rho)^1/4. */
const CAPILLARY_GRAVITY_M_S=Math.pow(
  4*GRAVITY_M_S2*WATER_SURFACE_TENSION_N_M/WATER_DENSITY_KG_M3,0.25);

/* Precipitation: measured motion, authored visibility. A millimetre raindrop
   is 0.015 world pixels wide at project scale, so the event rate and the
   one-pixel response are medium choices. Diameter and velocity are measured:
   the size prior is the bounded Marshall–Palmer exponential and fall speed is
   Atlas, Srivastava & Sekhon (1973), v(D)=9.65-10.3 exp(-0.6D), D in
   millimetres.

   One allocation-free event lattice feeds streaks, ground hits, canopy ticks
   and water rings. Its cycle changes the hashed impact point. */
const RAIN=Object.freeze({
  kind:'rain',
  intensity:1,
  /* neutral pale ramp already resident in the swamp palette: no second RGB
     authority */
  ramp:'birch',
  rateMmH:12,
  cellPx:20,
  periodS:1.05,
  fallWindowS:0.24,
  exposureS:1/24,
  groundLifeS:0.15,
  leafLifeS:0.11,
  rippleLifeS:0.92,
  maxRippleRings:3,
  rippleGapPx:Object.freeze([0.90,1.20]),
  waveSpeedMps:CAPILLARY_GRAVITY_M_S,
  secondWaveDelayS:0.10,
  minDiameterMm:0.55,
  maxDiameterMm:3.50,
  waterDensityKgM3:WATER_DENSITY_KG_M3,
  surfaceTensionNm:WATER_SURFACE_TENSION_N_M,
});

/* Ceiling drip: the rain lattice at a third of its event rate, on the cave's
   own calcite ramp. SOURCE: measured cave drips run 0.01 to 2 per second at
   one site (Genty & Deflandre 1998; Genty et al. 2001). The drop is a rain
   drop here: the event lattice owns diameter and speed, and a 0.14 ml cave
   drop is larger than its ceiling. Named, not corrected. */
const DRIP=Object.freeze({kind:'rain',intensity:0.36,ramp:'dripstone'});

/* Blown sand: a transport law and one authored anchor. Grains saltate, so
   almost all of the mass is within the first few centimetres of the surface.
   Only the fine tail of the size distribution goes into suspension, a haze.

   AUTHORITY: R. A. Bagnold, The Physics of Blown Sand and Desert Dunes (1941).
   Threshold friction velocity with A near 0.1 for loose graded sand, transport
   q = C (rho/g) u*^3, and the law-of-the-wall wind profile. Each formula sits
   at its constant below.

   Derived: the threshold, the flux, the hop geometry and the grain speed.
   Authored: the reference wind at the control's 1.0 and the extinction anchor.
   An orthographic camera declares no path length, so the form of the
   extinction is Beer's law and the coefficient is a stated choice.

   The mirage is not drawn. An inferior mirage needs a grazing ray, and this
   projection has no horizon in frame and no distance axis. Refused, and
   recorded in docs/CANON.md.

   Storm extinction is the opposite case: at a visual range of a few tens of
   metres the aerosol matters over any plausible path. */
const AIR_DENSITY_KG_M3=1.225;
const QUARTZ_DENSITY_KG_M3=2650;
const VON_KARMAN=0.40;

const SAND=Object.freeze({
  kind:'sand',
  intensity:1,
  /* airborne grains are the ground, so they resolve on the ground's own ramp */
  ramp:'sand',
  /* Bagnold's dune sand: the median of a well-sorted erg. */
  grainMm:0.25,
  thresholdA:0.10,
  fluxC:1.80,
  /* z0 = d/30, the standard grain-roughness estimate for a sand bed. */
  roughnessRatio:30,
  anemometerM:10,
  /* AUTHORED: the ten-metre wind the control's 1.0 stands for. Just above the
     8.1 m/s this grain needs, so the desert's default surface already moves. */
  refWindMps:9.0,
  /* h = hopHeightC * u*^2 / g. The coefficient puts the mean hop at 5 cm for
     u* = 0.35, where wind-tunnel mass profiles put the bulk of saltation.
     Length over height is measured at 10-15. */
  hopHeightC:4.00,
  hopLengthRatio:12,
  /* AUTHORED: the flux at which the air is half opaque. Beer's law is the
     form. A coefficient, not a visual range: an orthographic camera has no
     path length. */
  hazeHalfFlux:0.020,
  /* The ceiling is a law of the medium, which wins here. Measured against the
     desert's 38-entry snap list, mixing every entry toward the sand's lit rung
     leaves 14 distinct colours at 0.50 and 8 at 0.55. Capped at the last value
     before that cliff. docs/CANON.md records the deviation: this world's worst
     weather is drawn less bad than it is. */
  hazeMax:0.50,
  /* the drawn grain: one hop is one dash, and the lattice pitch is the
     spacing the flux implies */
  cellPx:7,
  exposureS:1/24,
  maxCoverage:0.34,
});

const GRAIN_M=SAND.grainMm/1000;
/* u*t = A sqrt(((rho_s - rho)/rho) g d). At 0.25 mm this is 0.230 m/s. */
const SAND_THRESHOLD_SHEAR=SAND.thresholdA*Math.sqrt(
  (QUARTZ_DENSITY_KG_M3-AIR_DENSITY_KG_M3)/AIR_DENSITY_KG_M3
  *GRAVITY_M_S2*GRAIN_M);
const SAND_Z0=GRAIN_M/SAND.roughnessRatio;
/* U(z) = (u_star/k) ln(z/z0), inverted: the shear a ten-metre wind implies. */
const SAND_SHEAR_PER_MPS=VON_KARMAN/Math.log(SAND.anemometerM/SAND_Z0);
/* the ten-metre wind the grain needs before anything moves: 8.1 m/s, where
   field observers put the onset of visible drift */
const SAND_THRESHOLD_WIND=SAND_THRESHOLD_SHEAR/SAND_SHEAR_PER_MPS;

const sandShear=(windScale=1)=>SAND_SHEAR_PER_MPS*SAND.refWindMps*Math.max(0,windScale);
/* Bagnold: no transport below threshold, and q ~ u*^3 above it. Doubling the
   wind is eight times the sand. */
function sandFlux(shear){
  if(shear<=SAND_THRESHOLD_SHEAR) return 0;
  return SAND.fluxC*(AIR_DENSITY_KG_M3/GRAVITY_M_S2)*Math.pow(shear,3);
}
const sandHopHeightM=(shear)=>SAND.hopHeightC*shear*shear/GRAVITY_M_S2;
const sandHopLengthM=(shear)=>SAND.hopLengthRatio*sandHopHeightM(shear);
/* Ballistic: a hop of height h takes sqrt(8h/g), so the grain's mean forward
   speed is its hop length over its time of flight. The shear fixes both. */
const sandHopTimeS=(shear)=>Math.sqrt(8*sandHopHeightM(shear)/GRAVITY_M_S2);
function sandGrainSpeedMps(shear){
  const t=sandHopTimeS(shear);
  return t>0?sandHopLengthM(shear)/t:0;
}
/* Beer's law in the flux, saturating: saltation impact feeds the suspended
   fines. */
function sandHaze(shear){
  const q=sandFlux(shear);
  return SAND.hazeMax*(1-Math.exp(-q/SAND.hazeHalfFlux));
}
/* Surface share the drawn dashes may cover: the flux, under a cap that keeps
   ground visible. The cap and the dash width are the pixel choices. */
function sandCoverage(shear){
  const q=sandFlux(shear);
  return SAND.maxCoverage*(1-Math.exp(-q/(SAND.hazeHalfFlux*0.55)));
}

/* A gust is a pattern of faster air carried by the mean flow (Taylor 1938,
   frozen turbulence), so a stem meets it later the further downwind it stands.
   Both components advect at one speed along the wind axis of constants.js.
   AUTHORED: the two periods (11 s and 27 s), their weights and the scatter.
   Sway stays a one-pixel event, see windUV in shaders/sprite.js. */
const GUST=Object.freeze({
  speedMps:3.0,          // mean flow, a gentle breeze
  omega:[0.57,0.23],     // rad/s
  weight:[0.70,0.30],
  scatter:1.2,           // rad of per-stem phase scatter: a front has a ragged edge
  offset:64,             // keeps every phase positive; a negative phase means rigid
});
const GUST_K=GUST.omega[0]/(GUST.speedMps*PX_PER_M);   // rad per px downwind
const GUST_RATIO=GUST.omega[1]/GUST.omega[0];
/* Phase of a stem at world (x,y). `u` in [0,1) scatters it. */
const gustPhase=(x,y,u=0)=>GUST.offset-(x*WCA+y*WSA)*GUST_K+u*GUST.scatter;
/* CPU mirror of windGust in WIND_GLSL, for tests. */
const gustAt=(phase,timeS)=>Math.sin(timeS*GUST.omega[0]+phase)*GUST.weight[0]
  +Math.sin(timeS*GUST.omega[1]+phase*GUST_RATIO+2.1)*GUST.weight[1];

const clamp01=x=>Math.max(0,Math.min(1,x));
const fract=x=>x-Math.floor(x);
const wrap4096=x=>((x%4096)+4096)%4096;

/* CPU mirror for tests and diagnostics. Rendering uses RAIN_GLSL. Both expose
   the same clock → cycle → impact chain. */
function rainHash(x,y){
  let qx=fract(x*0.1031),qy=fract(y*0.1030),qz=fract(x*0.0973);
  const d=qx*(qy+33.33)+qy*(qz+33.33)+qz*(qx+33.33);
  qx+=d;qy+=d;qz+=d;
  return fract((qx+qy)*qz);
}

/* Marshall & Palmer (1948), Lambda in mm^-1 for R in mm h^-1. A drop-shape
   prior. The scene's 12 mm h^-1 profile is authored. */
function rainLambda(rateMmH=RAIN.rateMmH){
  return 4.1*Math.pow(Math.max(0.01,rateMmH),-0.21);
}

function rainDiameter(u,rateMmH=RAIN.rateMmH){
  const k=rainLambda(rateMmH);
  const lo=Math.exp(-k*RAIN.minDiameterMm);
  const hi=Math.exp(-k*RAIN.maxDiameterMm);
  return -Math.log(lo-clamp01(u)*(lo-hi))/k;
}

function rainTerminalMps(diameterMm){
  return Math.max(0,9.65-10.3*Math.exp(-0.6*Math.max(0,diameterMm)));
}

function rainTerminalPx(diameterMm){
  return rainTerminalMps(diameterMm)*PX_PER_M;
}

function rainWeber(diameterMm){
  const v=rainTerminalMps(diameterMm);
  return RAIN.waterDensityKgM3*v*v*(diameterMm/1000)/RAIN.surfaceTensionNm;
}

function rippleRadiusPx(ageS){
  return Math.max(0,ageS)*RAIN.waveSpeedMps*PX_PER_M;
}

/* A circle on the horizontal world plane is an ellipse on screen: the cabinet
   projection spends one screen row per two world-depth pixels. */
function projectedRippleDistance(dx,dy){
  return Math.hypot(dx,dy/0.5);
}

function rainEventRandom(cellX,cellY,cycle,salt=0){
  const c=wrap4096(cycle);
  return rainHash(
    wrap4096(cellX)+c*0.75487767+salt,
    wrap4096(cellY)+c*0.56984029+salt);
}

function rainRingCount(cellX,cellY,cycle){
  return 1+Math.floor(rainEventRandom(cellX,cellY,cycle,83.1)*RAIN.maxRippleRings);
}

function rainEventAt(cellX,cellY,timeS,intensity=RAIN.intensity,cycleOffset=0){
  const period=RAIN.periodS/Math.max(0.35,intensity);
  const hx=wrap4096(cellX),hy=wrap4096(cellY);
  const local=timeS+rainHash(hx+37.1,hy+37.1)*period;
  const clockCycle=Math.floor(local/period);
  const age=local-clockCycle*period;
  const cycle=clockCycle+cycleOffset,wrappedCycle=wrap4096(cycle);
  const sx=hx+wrappedCycle*0.75487767;
  const sy=hy+wrappedCycle*0.56984029;
  const diameterMm=rainDiameter(rainHash(sx+41.7,sy+41.7),
    RAIN.rateMmH*Math.max(0.25,intensity));
  return Object.freeze({
    age,period,cycle,
    x:(cellX+rainHash(sx+7.3,sy+7.3))*RAIN.cellPx,
    y:(cellY+rainHash(sx+19.1,sy+19.1))*RAIN.cellPx,
    diameterMm,
    speedMps:rainTerminalMps(diameterMm),
    speedPx:rainTerminalPx(diameterMm),
    ringCount:rainRingCount(cellX,cellY,cycle),
  });
}

const F=n=>Number(n).toFixed(8);

/* Shared verbatim by every consuming fragment shader. Functions take time
   explicitly: no hidden uniform dependency. */
const WIND_GLSL=`
float windGust(float phase, float time){
  return sin(time*${F(GUST.omega[0])} + phase)*${F(GUST.weight[0])}
       + sin(time*${F(GUST.omega[1])} + phase*${F(GUST_RATIO)} + 2.1)*${F(GUST.weight[1])};
}`;

const RAIN_GLSL=`
const float RAIN_RATE=${F(RAIN.rateMmH)};
const float RAIN_CELL=${F(RAIN.cellPx)};
const float RAIN_PERIOD=${F(RAIN.periodS)};
const float RAIN_FALL_WINDOW=${F(RAIN.fallWindowS)};
const float RAIN_EXPOSURE=${F(RAIN.exposureS)};
const float RAIN_GROUND_LIFE=${F(RAIN.groundLifeS)};
const float RAIN_LEAF_LIFE=${F(RAIN.leafLifeS)};
const float RAIN_RIPPLE_LIFE=${F(RAIN.rippleLifeS)};
const float RAIN_WAVE_PX_S=${F(RAIN.waveSpeedMps*PX_PER_M)};
const float RAIN_SECOND_WAVE=${F(RAIN.secondWaveDelayS)};
const float RAIN_MAX_RINGS=${F(RAIN.maxRippleRings)};
const float RAIN_RING_GAP_MIN=${F(RAIN.rippleGapPx[0])};
const float RAIN_RING_GAP_MAX=${F(RAIN.rippleGapPx[1])};
const float RAIN_D_MIN=${F(RAIN.minDiameterMm)};
const float RAIN_D_MAX=${F(RAIN.maxDiameterMm)};
const float RAIN_PX_PER_M=${F(PX_PER_M)};

float rainHash(vec2 p){
  vec3 q=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
float rainEventRandom(vec2 cell,float cycle,float salt){
  vec2 hc=mod(cell,4096.0)+mod(cycle,4096.0)*vec2(0.75487767,0.56984029);
  return rainHash(hc+salt);
}
float rainLambda(float intensity){
  return 4.1*pow(max(0.01,RAIN_RATE*max(0.25,intensity)),-0.21);
}
float rainDiameterFrom(float u,float intensity){
  float k=rainLambda(intensity);
  float lo=exp(-k*RAIN_D_MIN), hi=exp(-k*RAIN_D_MAX);
  return -log(lo-clamp(u,0.0,1.0)*(lo-hi))/k;
}
float rainTerminalPx(float diameterMm){
  return max(0.0,9.65-10.3*exp(-0.6*diameterMm))*RAIN_PX_PER_M;
}
float rainWeber(float diameterMm,float speedPx){
  float speedM=speedPx/RAIN_PX_PER_M;
  return ${F(RAIN.waterDensityKgM3)}*speedM*speedM*(diameterMm/1000.0)/
    ${F(RAIN.surfaceTensionNm)};
}
void rainClock(vec2 cell,float intensity,float time,
               out float period,out float age,out float cycle){
  period=RAIN_PERIOD/max(0.35,intensity);
  vec2 hc=mod(cell,4096.0);
  float local=time+rainHash(hc+37.1)*period;
  cycle=floor(local/period);
  age=local-cycle*period;
}
void rainDrop(vec2 cell,float cycle,float intensity,
              out vec2 centre,out float diameter,out float speedPx){
  vec2 hc=mod(cell,4096.0)+mod(cycle,4096.0)*vec2(0.75487767,0.56984029);
  centre=(cell+vec2(rainHash(hc+7.3),rainHash(hc+19.1)))*RAIN_CELL;
  diameter=rainDiameterFrom(rainHash(hc+41.7),intensity);
  speedPx=rainTerminalPx(diameter);
}
float rainSegmentDistance(vec2 p,vec2 a,vec2 b){
  vec2 ab=b-a;
  float t=clamp(dot(p-a,ab)/max(0.0001,dot(ab,ab)),0.0,1.0);
  return length(p-(a+ab*t));
}
float rainProjectedDistance(vec2 d){ return length(d*vec2(1.0,2.0)); }
float rainRippleRadius(float age){ return max(0.0,age)*RAIN_WAVE_PX_S; }
`;

/* The same chain for the fragment shader. Both sides take the wind explicitly
   and compute threshold -> shear -> flux in that order, so a frame and a test
   agree on whether the sand moves. */
const SAND_GLSL=`
const float SAND_THRESHOLD=${F(SAND_THRESHOLD_SHEAR)};
const float SAND_SHEAR_PER_MPS=${F(SAND_SHEAR_PER_MPS)};
const float SAND_REF_WIND=${F(SAND.refWindMps)};
const float SAND_FLUX_C=${F(SAND.fluxC)};
const float SAND_RHO_OVER_G=${F(AIR_DENSITY_KG_M3/GRAVITY_M_S2)};
const float SAND_HOP_C=${F(SAND.hopHeightC)};
const float SAND_HOP_RATIO=${F(SAND.hopLengthRatio)};
const float SAND_G=${F(GRAVITY_M_S2)};
const float SAND_HAZE_HALF=${F(SAND.hazeHalfFlux)};
const float SAND_HAZE_MAX=${F(SAND.hazeMax)};
const float SAND_COVER_MAX=${F(SAND.maxCoverage)};
const float SAND_CELL=${F(SAND.cellPx)};
const float SAND_PX_PER_M=${F(PX_PER_M)};

float sandHash(vec2 p){
  vec3 q=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
float sandShear(float windScale){
  return SAND_SHEAR_PER_MPS*SAND_REF_WIND*max(0.0,windScale);
}
float sandFlux(float shear){
  return shear<=SAND_THRESHOLD ? 0.0
       : SAND_FLUX_C*SAND_RHO_OVER_G*shear*shear*shear;
}
float sandHopHeightM(float shear){ return SAND_HOP_C*shear*shear/SAND_G; }
float sandHopLengthPx(float shear){
  return SAND_HOP_RATIO*sandHopHeightM(shear)*SAND_PX_PER_M;
}
float sandGrainSpeedPx(float shear){
  float h=sandHopHeightM(shear);
  if(h<=0.0) return 0.0;
  return SAND_HOP_RATIO*h/sqrt(8.0*h/SAND_G)*SAND_PX_PER_M;
}
float sandHaze(float shear){
  return SAND_HAZE_MAX*(1.0-exp(-sandFlux(shear)/SAND_HAZE_HALF));
}
float sandCoverage(float shear){
  return SAND_COVER_MAX*(1.0-exp(-sandFlux(shear)/(SAND_HAZE_HALF*0.55)));
}
float sandSegmentDistance(vec2 p,vec2 a,vec2 b){
  vec2 ab=b-a;
  float t=clamp(dot(p-a,ab)/max(0.0001,dot(ab,ab)),0.0,1.0);
  return length(p-(a+ab*t));
}
`;

export {
  GUST, GUST_K, WIND_GLSL, gustAt, gustPhase,
  GRAVITY_M_S2,
  RAIN, RAIN_GLSL, projectedRippleDistance, rainDiameter, rainEventAt, rainLambda,
  rainEventRandom, rainRingCount, rainTerminalMps, rainTerminalPx, rainWeber,
  rippleRadiusPx,
  SAND, SAND_GLSL, SAND_THRESHOLD_SHEAR, SAND_THRESHOLD_WIND, SAND_Z0,
  SAND_SHEAR_PER_MPS, sandShear, sandFlux, sandHopHeightM, sandHopLengthM,
  sandHopTimeS, sandGrainSpeedMps, sandHaze, sandCoverage, DRIP };
