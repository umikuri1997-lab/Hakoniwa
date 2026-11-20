import { SURFACE } from './surface.js';
import { hashf } from './rng.js';
import { PX_PER_M } from './scale.js';
import { GRAVITY_M_S2 } from './weather.js';

/* ═══════════════════════════════════════════════════════════════════════════
   KICKED GROUND. A foot on loose ground throws some of it into the air, and
   what it throws behaves like what it is: the one universal event is the
   footfall, and everything after it is material.

   Launch height is the authored medium-scale observation. Launch velocity
   follows from v² = 2gh. Gravity then owns the ascent and the start of the
   fall. A material's terminal speed caps the rest. Sand and salt cross their
   short hop before the cap matters. Snow and fine dust reach it and hang.

   Lengths and speeds in this table are SI quantities. `PX_PER_M` performs the
   only conversion into drawn rows. The dark and light band endpoints are the
   material's own ramp, so the pair remains inside the locked palette.
   ═══════════════════════════════════════════════════════════════════════════ */
const GRAVITY_PX_S2=GRAVITY_M_S2*PX_PER_M;
const KICK_START_PX=0.5;
const KICK_POOL_MAX=96;

const motion=(walk,run)=>Object.freeze({
  walk:Object.freeze(walk),run:Object.freeze(run),
});
const material=(count,heightM,radialMps,terminalMps,driftMps,size,extra={})=>
  Object.freeze({
    count:Object.freeze(count),
    heightM:motion(heightM.walk,heightM.run),
    radialMps:motion(radialMps.walk,radialMps.run),
    terminalMps,driftMps,size,flutterMps:extra.flutterMps||0,
    band:Object.freeze(extra.band||[0,1]),
  });

/* Temporary three-way visual review. Remove the query switch and the two
   unselected rows after FW-VR resolves. Node tests and ordinary play use A. */
const SNOW_REVIEW=Object.freeze({
  A:Object.freeze({
    count:{walk:3,run:5},heightM:{walk:[0.04,0.08],run:[0.09,0.16]},
    radialMps:{walk:[0.03,0.10],run:[0.06,0.18]},
    terminalMps:0.60,driftMps:1.05,flutterMps:0.12,
  }),
  B:Object.freeze({
    count:{walk:4,run:7},heightM:{walk:[0.05,0.10],run:[0.11,0.20]},
    radialMps:{walk:[0.02,0.08],run:[0.04,0.14]},
    terminalMps:0.45,driftMps:0.80,flutterMps:0.18,
  }),
  C:Object.freeze({
    count:{walk:2,run:4},heightM:{walk:[0.04,0.07],run:[0.08,0.13]},
    radialMps:{walk:[0.04,0.12],run:[0.08,0.20]},
    terminalMps:0.70,driftMps:1.35,flutterMps:0.26,
  }),
});
const snowReviewKey=globalThis.location
  ?new URLSearchParams(globalThis.location.search).get('snowReview')?.toUpperCase()
  :null;
const snowReview=SNOW_REVIEW[snowReviewKey]||SNOW_REVIEW.A;

const KICK=Object.freeze({
  sand:material(
    {walk:3,run:5},{walk:[0.08,0.16],run:[0.18,0.32]},
    {walk:[0.15,0.45],run:[0.30,0.80]},2.0,0.13,2),
  snow:material(
    snowReview.count,snowReview.heightM,snowReview.radialMps,
    snowReview.terminalMps,snowReview.driftMps,1,
    {band:[0.70,1],flutterMps:snowReview.flutterMps}),
  sabkha:material(
    {walk:2,run:3},{walk:[0.05,0.11],run:[0.12,0.20]},
    {walk:[0.10,0.30],run:[0.20,0.50]},2.5,0.07,1),
  peat:material(
    {walk:2,run:3},{walk:[0.04,0.09],run:[0.10,0.16]},
    {walk:[0.08,0.25],run:[0.15,0.40]},3.0,0.03,1),
  /* Cave silt: wet clay crumbs. Peat's row, heavier: nothing dries here.
     AUTHORED. */
  silt:material(
    {walk:1,run:2},{walk:[0.04,0.08],run:[0.09,0.14]},
    {walk:[0.06,0.20],run:[0.12,0.32]},3.4,0.02,1),
});

function kickFor(flag){
  const row=SURFACE[flag];
  if(!row?.kick) return null;
  const cfg=KICK[row.kick];
  if(!cfg) throw new Error(`surface '${row.name}' names unknown kick material '${row.kick}'`);
  return cfg;
}

/* Exact flight under gravity with a hard terminal-speed cap. The launch speed
   reaches the named apex from the half-pixel ground clearance. */
function flightFor(heightM,terminalMps,z0Px=KICK_START_PX){
  const peakPx=heightM*PX_PER_M;
  const risePx=Math.max(0,peakPx-z0Px);
  const launchPxS=Math.sqrt(2*GRAVITY_PX_S2*risePx);
  const terminalPxS=terminalMps*PX_PER_M;
  const ascentS=launchPxS/GRAVITY_PX_S2;
  const terminalTimeS=terminalPxS/GRAVITY_PX_S2;
  const terminalDropPx=terminalPxS*terminalPxS/(2*GRAVITY_PX_S2);
  const fallS=peakPx<=terminalDropPx
    ?Math.sqrt(2*peakPx/GRAVITY_PX_S2)
    :terminalTimeS+(peakPx-terminalDropPx)/terminalPxS;
  return {peakPx,launchPxS,terminalPxS,ascentS,fallS,durationS:ascentS+fallS};
}

/* One footfall. `seq` decorrelates particles without a runtime RNG, so a
   pinned frame with no movement in it stays byte-identical.

   `over` is another cause of the same throw (src/spell.js): its own count,
   pool cap, launch height in metres, start height in rows and carried
   velocity in px/s. The material rows stay the authority for the flight. */
function spawnKick(pool,x,y,flag,seq,locomotion='walk',over=null){
  const cfg=kickFor(flag);
  if(!cfg) return seq;
  const row=SURFACE[flag];
  const state=locomotion==='run'?'run':'walk';
  const n=over?.count??cfg.count[state];
  const cap=over?.cap??KICK_POOL_MAX;
  const z0=over?.z0??KICK_START_PX;
  for(let i=0;i<n&&pool.length<cap;i++){
    const h=(k)=>hashf(seq,i,0x21c0^k);
    const a=h(1)*Math.PI*2;
    const radial=cfg.radialMps[state];
    const vr=(radial[0]+h(2)*(radial[1]-radial[0]))*PX_PER_M;
    const heights=cfg.heightM[state];
    const heightM=over?.heightM??heights[0]+h(6)*(heights[1]-heights[0]);
    const flight=flightFor(heightM,cfg.terminalMps,z0);
    pool.push({
      x:x+(h(3)-0.5)*3, y:y+(h(4)-0.5)*2, z:z0,
      vx:Math.cos(a)*vr+(over?.vx||0), vy:Math.sin(a)*vr*0.5+(over?.vy||0),
      vz:flight.launchPxS,g:GRAVITY_PX_S2,terminal:flight.terminalPxS,
      drift:cfg.driftMps*PX_PER_M,age:0,life:flight.durationS,
      maxAge:flight.durationS*1.25+1/30,peak:flight.peakPx,
      flutter:cfg.flutterMps*PX_PER_M,
      flutterRate:4+h(8)*4,flutterPhase:h(9)*Math.PI*2,
      ramp:row.ramp, sMin:cfg.band[0], sMax:cfg.band[1], size:cfg.size,
    });
  }
  return seq+1;
}

function verticalStep(p,dt){
  const untilTerminal=Math.max(0,(p.vz+p.terminal)/p.g);
  const falling=Math.min(dt,untilTerminal);
  p.z+=p.vz*falling-0.5*p.g*falling*falling;
  p.vz-=p.g*falling;
  if(dt>falling){
    p.vz=-p.terminal;
    p.z-=p.terminal*(dt-falling);
  }
}

/* Height integrates in drawn rows. A landed grain rejoins its source surface.
   `wait` holds a particle on its perch for that many seconds. A `heavy`
   particle that reaches the ground is reported in `landed`. */
function stepKick(pool,dt,wind=0,landed=null){
  for(let i=pool.length-1;i>=0;i--){
    const p=pool[i];
    if(p.wait>0){ p.wait-=dt; continue; }
    p.age+=dt;
    const flutter=p.flutter*Math.sin(p.flutterPhase+p.age*p.flutterRate);
    p.x+=(p.vx+p.drift*wind+flutter)*dt;
    p.y+=(p.vy+flutter*0.35*Math.cos(p.flutterPhase+p.age*p.flutterRate))*dt;
    verticalStep(p,dt);
    if(p.z<=0||p.age>=p.maxAge){
      if(landed&&p.heavy&&p.z<=0) landed.push(p);
      pool[i]=pool[pool.length-1]; pool.pop();
    }
  }
}

export {
  GRAVITY_PX_S2, KICK, KICK_POOL_MAX, KICK_START_PX,
  flightFor, kickFor, spawnKick, stepKick,
};
