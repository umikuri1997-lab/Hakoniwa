import { GROUND_PX_PER_ROW } from './basin.js';
import { WCA, WSA } from './constants.js';
import { GRAVITY_PX_S2, flightFor, kickFor, spawnKick, stepKick } from './kickup.js';
import { CLUMP, CLUMP_TERMINAL_MPS, fireAt, flameLengthM, plantCatches } from './matter.js';
import { hashf } from './rng.js';
import { PX_PER_M } from './scale.js';
import { SURF, SURFACE } from './surface.js';
import { GRAVITY_M_S2, RAIN, SAND, rainDiameter, rainTerminalPx } from './weather.js';

/* ═══════════════════════════════════════════════════════════════════════════
   SPELLS. One invented law (docs/CANON.md):

     The traveller may put one bounded impulse into the medium he touches:
     strain into ground, heat out of water, heat into fuel, heat out of
     vapour.

   The impulse has no carrier and no colour. After it the medium's own law
   runs: a surface wave spreads and damps, ice thaws from its rim, a fuel bed
   burns as wet and as windy as it is (src/matter.js), cooled air drops its
   water. What
   one impulse meets of another answers too: heat opens ice, cold stops a
   fire, a shock breaks a plate, rain wets a bed. What moves is material the world
   already holds, drawn on that material's ramp. The cast itself shows on the
   caster's coat ramp and `folkSignal`, which every world declares for him.

   IDENTITY. A world is a pure function of seed and position, so a position is
   an identity. A cast stores one mark row. A tree, a pond or a print asks the
   live marks about its own coordinates. Nothing is tagged, so a chunk evicted
   and baked again gives the same answer. MARK_MAX rows are the whole state:
   two uniform arrays for the ground passes, one loop for the draw list. No
   texture, no render target.

   Lengths in the table are metres and speeds m/s. PX_PER_M converts once. A
   mark's distances are ground pixels: a screen row is GROUND_PX_PER_ROW of
   them (PROJECTION.md).
   ═══════════════════════════════════════════════════════════════════════════ */
const MARK_MAX=8;
const MOTE_MAX=260;
const ROWS=GROUND_PX_PER_ROW;

const SPELLS=Object.freeze({
  /* A surface wave from the planted foot. Amplitude falls by spreading over a
     growing circumference and by soil damping (Bornitz 1931). */
  tremor:Object.freeze({
    slot:1,label:'tremor',medium:'ground',impulse:'strain',cooldownS:2.5,
    footM:0.50,
    /* AUTHORED anchor: grains at the foot are thrown this high. The foot
       amplitude follows from v = a*omega and h = v^2/2g. */
    launchM:0.30,
    hz:7.5,
    /* Woods & Jedele 1985: 0.10 to 0.30 per metre for weak soil at 5 Hz,
       scaled by frequency. */
    dampPerM:0.35,
    /* AUTHORED, the medium wins: loose soil carries a Rayleigh wave at 100
       m/s and more, which crosses the frame in three frames. */
    speedMps:12,
    /* the amplitude below which no crest is drawn */
    crestM:0.001,
    /* AUTHORED: a laden branch is a lever. It sheds at under half the
       amplitude that lifts a grain. */
    shedM:0.002,
    /* shed crowns stay bare this long; falling snow covers them again */
    holdS:45,
    /* AUTHORED: a crown the crest passes under leans a pixel for this long */
    swayS:0.25,
    noise:1.6,
  }),
  /* A plate of ice on open water, thick enough to carry him. It grows from
     the point of contact and thaws from the rim. AUTHORED times. */
  frost:Object.freeze({
    slot:2,label:'frost',medium:'water',impulse:'heat out',cooldownS:2.0,
    aheadM:2.4,radiusM:3.2,frontMps:5,holdS:18,thawS:5,
    /* AUTHORED: ice crystals fall out of the chilled air over the plate for
       this long, from up to this height, at a graupel's 1.2 m/s. */
    dustS:1.6,dustM:1.1,crystalMps:1.2,
    /* ice under load holds this long after he steps off */
    loadS:1.0,
    noise:0.5,
  }),
  /* Heat into what is there. On a fuel bed the impulse lights a disc and the
     bed then runs its own fire. On ice it opens water. On open water it is
     refused. */
  kindle:Object.freeze({
    slot:3,label:'kindle',medium:'fuel',impulse:'heat in',cooldownS:3.0,
    /* the centre is further ahead than the radius: the fire stops short of
       his feet */
    aheadM:3.2,
    /* AUTHORED: the disc one impulse lights in dry sward and the rate its
       front crosses it. A wetter bed costs more heat, so its disc is smaller
       (fireAt in src/matter.js). */
    radiusM:2.6,frontMps:0.25,
    /* AUTHORED: the bed carries its head fire downwind for this long */
    runS:5,
    /* AUTHORED: the impulse as a fire front. Byram gives it a 0.78 m flame,
       a campfire. */
    impulseKWm:150,
    /* Flame residence in grass: 5 to 15 s (Cheney & Sullivan 2008), measured
       2.1 to 25.7 s (Sneeuwjagt & Frandsen 1977). AUTHORED at the short end:
       the flame zone is the front speed times this, 15 px. A bed too wet to
       carry a fire flashes for flashS and smokes. */
    flameS:4,flashS:1.2,
    /* AUTHORED: a crown is coarser fuel and burns this long (residence time
       grows with particle size, Anderson 1969) */
    crownS:9,
    /* a wet bed smoulders this long after its flames */
    emberS:8,
    /* the char holds, then regrowth closes it from the rim */
    holdS:70,healS:18,
    /* AUTHORED, the medium wins: the heat that lights 21 m2 of sward melts
       0.1 m2 of a plate that carries a man. The hole is drawn at this radius
       and steams this long. It holds and heals as a char does. */
    meltM:1.6,steamS:6,
    noise:0.9,
  }),
  /* Heat out of the air over a disc ahead: it passes its dew point and its
     water falls, as rain, or as graupel in a world of snow. */
  squall:Object.freeze({
    slot:4,label:'squall',medium:'vapour',impulse:'heat out',cooldownS:6.0,
    aheadM:4.5,radiusM:4.0,
    /* AUTHORED: the column rains out in rainS at a cloudburst's rate, and
       the bed stays wet for wetS after it. Drop size and fall speed are
       src/weather.js. */
    rainS:8,wetS:30,rateMmH:100,
    /* AUTHORED visibility: drop events over the disc, the seconds one event
       repeats in, and the same for graupel, which falls from flakeM at the
       frost crystal's speed. */
    drops:140,dropS:0.55,flakes:170,flakeS:1.5,flakeM:1.4,
    /* AUTHORED visibility: a streak is the drop's path over this long. The
       world's own rain exposes 1/24 s over a whole frame of it. */
    streakS:0.08,
    /* a bared crown carries snow again this long into the fall */
    loadS:3,
    noise:0.6,
  }),
});
const SPELL_ORDER=Object.freeze(Object.keys(SPELLS)
  .sort((a,b)=>SPELLS[a].slot-SPELLS[b].slot));

/* ── tremor: the ring ─────────────────────────────────────────────────── */
const T=SPELLS.tremor;
const TREMOR_OMEGA=2*Math.PI*T.hz;
const TREMOR_FOOT_AMP_M=Math.sqrt(2*GRAVITY_M_S2*T.launchM)/TREMOR_OMEGA;
/* Bornitz: a(r) = a0 * sqrt(r0/r) * exp(-alpha (r - r0)) */
const tremorAmpM=(rM)=>{
  const r=Math.max(rM,T.footM);
  return TREMOR_FOOT_AMP_M*Math.sqrt(T.footM/r)*Math.exp(-T.dampPerM*(r-T.footM));
};
/* A grain leaves the ground where the surface accelerates down faster than
   gravity: a*omega^2 >= g. */
const TREMOR_LIFTOFF_M=GRAVITY_M_S2/(TREMOR_OMEGA*TREMOR_OMEGA);
const tremorLaunchM=(rM)=>(tremorAmpM(rM)*TREMOR_OMEGA)**2/(2*GRAVITY_M_S2);
/* radius at which the amplitude has fallen to `ampM`: monotonic, so bisect */
function tremorRadiusM(ampM){
  let lo=T.footM,hi=400;
  for(let i=0;i<60;i++){
    const mid=(lo+hi)/2;
    if(tremorAmpM(mid)>ampM)lo=mid;else hi=mid;
  }
  return lo;
}
const TREMOR_FOOT_PX=T.footM*PX_PER_M;
const TREMOR_SPEED_PX=T.speedMps*PX_PER_M;
const TREMOR_WAVE_PX=T.speedMps/T.hz*PX_PER_M;
const TREMOR_LAUNCH_PX=tremorRadiusM(TREMOR_LIFTOFF_M)*PX_PER_M;
const TREMOR_SHED_PX=tremorRadiusM(T.shedM)*PX_PER_M;
const TREMOR_CREST_PX=tremorRadiusM(T.crestM)*PX_PER_M;
const tremorRingPx=(age)=>age<0?0:TREMOR_FOOT_PX+TREMOR_SPEED_PX*age;
/* both crests have left the drawn radius */
const TREMOR_WAVE_S=(TREMOR_CREST_PX+TREMOR_WAVE_PX-TREMOR_FOOT_PX)/TREMOR_SPEED_PX;

/* ── frost and kindle ─────────────────────────────────────────────────────
   A plate is a disc. A fire is the disc the impulse lit, carried downwind by
   the bed's own head fire: the disc swept along a run. */
const F=SPELLS.frost,K=SPELLS.kindle;
const FROST_FRONT_PX=F.frontMps*PX_PER_M;
const KINDLE_FRONT_PX=K.frontMps*PX_PER_M;
/* The prevailing wind as a ground direction (src/constants.js). The control's
   1.0 is SAND.refWindMps at 10 m (src/weather.js). */
const WIND_L=Math.hypot(WCA,WSA*ROWS);
const WIND_GX=WCA/WIND_L,WIND_GY=WSA*ROWS/WIND_L;
const windMps=(control)=>Math.max(0,control||0)*SAND.refWindMps;
const RUN_STEP_PX=6;

const heal=(m,now)=>now>m.endAt?m.r*Math.max(0,1-(now-m.endAt)/m.fadeS):m.r;
const frostRadiusPx=(m,now)=>Math.max(0,
  Math.min(m.r,FROST_FRONT_PX*(now-m.at),heal(m,now)));
const burnRadiusPx=(m,now)=>Math.max(0,
  Math.min(m.r,KINDLE_FRONT_PX*(now-m.at),heal(m,now)));
const burnRunPx=(m,now)=>Math.max(0,Math.min(m.runMax,m.runPx*(now-m.at)));

const groundDist=(ax,ay,bx,by)=>Math.hypot(bx-ax,(by-ay)*ROWS);
/* ground distance from (x, y) to the first `l` px of a fire's run */
function runDist(m,x,y,l){
  const dx=x-m.x,dy=(y-m.y)*ROWS;
  if(l<=0)return Math.hypot(dx,dy);
  const h=Math.max(0,Math.min(l,dx*m.wx+dy*m.wy));
  return Math.hypot(dx-m.wx*h,dy-m.wy*h);
}
function burntAt(m,now,x,y){
  const r=burnRadiusPx(m,now);
  return r>0&&runDist(m,x,y,burnRunPx(m,now))<=r;
}
/* Seconds after the cast at which the front reaches (x, y), Infinity if it
   never does. The burnt set only grows while the fire spreads, so bisect. */
function burnArrivalS(m,x,y){
  const T=Math.max(m.r/KINDLE_FRONT_PX,m.runPx>0?m.runMax/m.runPx:0);
  const reached=(t)=>runDist(m,x,y,Math.min(m.runMax,m.runPx*t))
    <=Math.min(m.r,KINDLE_FRONT_PX*t);
  if(!reached(T))return Infinity;
  let lo=0,hi=T;
  for(let i=0;i<14;i++){
    const mid=(lo+hi)/2;
    if(reached(mid))hi=mid;else lo=mid;
  }
  return hi;
}
/* seconds a site has been alight, negative before the front */
const litFor=(m,now,x,y)=>now-m.at-burnArrivalS(m,x,y);

/* ── squall ───────────────────────────────────────────────────────────── */
const Q=SPELLS.squall;
const SQUALL_PX=Q.radiusM*PX_PER_M;
/* Is the bed at this point wet from a squall: under the fall, or after it. */
function wetAt(state,x,y,now){
  for(const m of state.marks)
    if(m.spell==='squall'&&now>=m.at&&groundDist(m.x,m.y,x,y)<=m.r)return true;
  return false;
}
/* ── marks ────────────────────────────────────────────────────────────── */
function createSpellState(){
  return {marks:[],seq:0,emit:0,ready:{}};
}

const expiry=(m)=>m.endAt+m.fadeS;

function plateAt(state,x,y,now){
  for(const m of state.marks)
    if(m.spell==='frost'&&groundDist(m.x,m.y,x,y)<=frostRadiusPx(m,now))return true;
  return false;
}
/* Is this point inside a fire or a melt that keeps ice off it. A mark holds
   water open for its whole life: only a frost cast after it closes it.
   Measured failure: a 16 s window froze a melted plate over again under a
   man who stood on it. */
function hotAt(state,x,y,now){
  for(const m of state.marks)
    if(m.spell==='kindle'&&now<m.hotEnd&&burntAt(m,now,x,y))return true;
  return false;
}
/* Is the water at this point under ice: a plate, less what heat has opened. */
const frozenAt=(state,x,y,now)=>plateAt(state,x,y,now)&&!hotAt(state,x,y,now);

function newMark(state,spell,x,y,ox,oy,gx,gy,at){
  return {id:++state.seq,spell,x,y,ox,oy,gx,gy,at,r:0,endAt:at,fadeS:0,swept:0,tick:0};
}
/* A full table drops the mark nearest its own end. INVARIANT: a plate under
   load (holdIce) is never the one dropped, or the water opens under him. */
function addMark(state,m){
  if(state.marks.length>=MARK_MAX){
    const held=(q)=>q.loadAt!==undefined&&m.at-q.loadAt<F.loadS;
    let drop=-1;
    for(let i=0;i<state.marks.length;i++){
      const q=state.marks[i];
      if(held(q))continue;
      if(drop<0||expiry(q)<expiry(state.marks[drop]))drop=i;
    }
    state.marks.splice(Math.max(0,drop),1);
  }
  state.marks.push(m);
}

/* Heat into what lies at the mark. Fills the kindle fields and returns the
   refusal, if any. */
function ignite(state,m,env){
  const now=m.at,flag=env.flagAt?.(m.x,m.y),row=SURFACE[flag];
  Object.assign(m,{wx:WIND_GX,wy:WIND_GY,runPx:0,runMax:0,kWm:0,flankKWm:0,headKWm:0,damp:0,
    bed:null,flameS:K.flameS,rim:1,flag,flameEnd:now,hotEnd:now});
  if(row?.heat==='thaw'||plateAt(state,m.x,m.y,now)){
    m.melt=true;m.rim=0;
    m.r=K.meltM*PX_PER_M;
    m.endAt=now+m.r/KINDLE_FRONT_PX+K.holdS;
    m.fadeS=K.healS;
    m.hotEnd=m.endAt+m.fadeS;
    return null;
  }
  if(row?.wet)return 'wet';
  const fire=fireAt(row,{rain:env.rain||wetAt(state,m.x,m.y,now),
    windMps:env.windMps||0});
  m.r=K.radiusM*PX_PER_M*fire.reach;
  m.bed=fire.bed;m.damp=fire.damp;
  m.flankKWm=K.impulseKWm*fire.share;m.headKWm=fire.headKWm;
  m.kWm=Math.max(m.flankKWm,m.headKWm);
  if(fire.bed&&fire.damp<=0)m.flameS=K.flashS;
  m.runPx=fire.headMps*PX_PER_M;
  /* the run ends at the first break in the bed */
  m.runMax=m.runPx*K.runS;
  for(let l=RUN_STEP_PX;l<m.runMax;l+=RUN_STEP_PX){
    const px=m.x+m.wx*l,py=m.y+m.wy*l/ROWS;
    if(!SURFACE[env.flagAt(px,py)]?.fuel||wetAt(state,px,py,now)){
      m.runMax=l-RUN_STEP_PX;break;
    }
  }
  m.flameEnd=now+Math.max(m.r/KINDLE_FRONT_PX,m.runPx>0?m.runMax/m.runPx:0)
    +(m.flameS===K.flashS?m.flameS:Math.max(m.flameS,K.crownS));
  m.endAt=now+K.holdS;
  m.fadeS=K.healS;
  m.hotEnd=m.endAt+m.fadeS;
  return null;
}

/* One cast. `from` is the caster: world position and screen heading. `env`
   states what the world is doing there: flagAt(x,y) the surface, rain, snow,
   windMps the 10 m wind. Returns {mark} or {refused, x, y, flag}. */
function castSpell(state,id,from,now,env={}){
  const row=SPELLS[id];
  if(!row) throw new Error(`unknown spell '${id}': see SPELLS in src/spell.js`);
  if(now<(state.ready[id]||0)) return {refused:'cooldown'};
  let gx=from.hx||0,gy=(from.hy||0)*ROWS;
  const l=Math.hypot(gx,gy);
  if(l<1e-6){gx=0;gy=1;}else{gx/=l;gy/=l;}
  const ahead=(row.aheadM||0)*PX_PER_M;
  const x=from.x+gx*ahead,y=from.y+gy*ahead/ROWS;
  const m=newMark(state,id,x,y,from.x,from.y,gx,gy,now);
  if(id==='tremor'){
    m.r=TREMOR_CREST_PX;
    m.endAt=now+(env.snow?T.holdS:TREMOR_WAVE_S);
    /* a shock breaks ice when it reaches it */
    for(const q of state.marks)if(q.spell==='frost')
      q.endAt=Math.min(q.endAt,now+groundDist(x,y,q.x,q.y)/TREMOR_SPEED_PX);
  }else if(id==='frost'){
    m.r=F.radiusM*PX_PER_M;
    m.endAt=now+m.r/FROST_FRONT_PX+F.holdS;
    m.fadeS=F.thawS;
    /* heat taken out of a fire: its flames stop where they are, and what it
       opened freezes again */
    for(const q of state.marks){
      if(q.spell!=='kindle'||now>=q.hotEnd)continue;
      const r=burnRadiusPx(q,now),run=burnRunPx(q,now);
      if(runDist(q,x,y,run)>=m.r+r)continue;
      if(now<q.flameEnd){q.r=r;q.runMax=run;q.flameEnd=now;}
      q.hotEnd=now;
    }
  }else if(id==='kindle'){
    const refused=ignite(state,m,env);
    if(refused) return {refused,x,y,flag:m.flag};
    thawPlates(state,m,now);
  }else if(id==='squall'){
    m.r=SQUALL_PX;
    m.endAt=now+Q.rainS+Q.wetS;
    /* Water on a fire: RAIN_WET takes any bed past its moisture of
       extinction, so the flames stop where they are. Regrowth starts when
       the fall ends. */
    for(const q of state.marks){
      if(q.spell!=='kindle'||q.melt)continue;
      const r=burnRadiusPx(q,now),run=burnRunPx(q,now);
      if(runDist(q,x,y,run)>=m.r+r)continue;
      if(now<q.flameEnd){q.r=r;q.runMax=run;q.flameEnd=now;}
      q.endAt=Math.min(q.endAt,now+Q.rainS);
    }
  }
  state.ready[id]=now+row.cooldownS;
  addMark(state,m);
  return {mark:m};
}

function pruneMarks(state,now){
  if(state.marks.length)state.marks=state.marks.filter((m)=>now<expiry(m));
}

/* heat put into ice: the thaw of every plate it touches starts now */
function thawPlates(state,m,now){
  for(const q of state.marks)if(q.spell==='frost'
    &&groundDist(m.x,m.y,q.x,q.y)<m.r+q.r)q.endAt=Math.min(q.endAt,now);
}

const cooldownLeft=(state,id,now)=>Math.max(0,(state.ready[id]||0)-now);

/* Ice under load holds: a plate he stands on does not start its thaw. */
function holdIce(state,x,y,now){
  for(const m of state.marks)
    if(m.spell==='frost'&&groundDist(m.x,m.y,x,y)<=frostRadiusPx(m,now))
      m.endAt=Math.max(m.endAt,now+F.loadS),m.loadAt=now;
}

/* What the live marks do to a plant of `kind` standing at (x, y) with
   half-width `halfW` px. `bend` is whole pixels of crown shift, positive to
   screen right. `bare`: a laden crown has lost its snow. `char`: it burnt.
   `skip` leaves one mark out. A crown is bare when the last thing that took
   its snow came after the last fall that laid it. The returned object is
   reused: read it before the next call. */
const FX={bend:0,bare:false,char:false};
function propFx(state,now,x,y,halfW=0,snowy=false,kind=undefined,skip=null){
  FX.bend=0;FX.bare=false;FX.char=false;
  let bared=-Infinity,laden=-Infinity;
  for(const m of state.marks){
    if(m===skip)continue;
    const dx=x-m.x,dy=(y-m.y)*ROWS;
    if(m.spell==='tremor'){
      /* where the wave still sheds a branch, the crest unloads a crown and
         leans it away from the foot as it passes */
      const d=Math.hypot(dx,dy),since=now-m.at-(d-TREMOR_FOOT_PX)/TREMOR_SPEED_PX;
      if(d>TREMOR_SHED_PX||since<0)continue;
      if(snowy)bared=Math.max(bared,m.at);
      if(since<=T.swayS)FX.bend=dx>=0?1:-1;
    }else if(m.spell==='kindle'){
      if(!burntAt(m,now,x,y))continue;
      /* heat takes the snow off a crown whether or not it lights it */
      if(snowy)bared=Math.max(bared,Math.min(now,m.flameEnd));
      if(plantCatches(kind,m.kWm,m.damp))FX.char=true;
    }else if(m.spell==='squall'){
      if(snowy&&now>=m.at+Q.loadS&&Math.hypot(dx,dy)<=m.r)
        laden=Math.max(laden,m.at+Q.loadS);
    }
  }
  FX.bare=bared>laden;
  return FX;
}

/* A burnt plant: wood, and whatever it carried, on the dark end of `trunk`,
   the window placement already gives a dark birch. */
const CHAR=Object.freeze({ramp:'trunk',sMin:0.02,sMax:0.60,dMax:0.45});

/* ── the GPU side ─────────────────────────────────────────────────────────
   Kind 1 is a crest ring pair, 2 an ice plate, 3 a heat mark. A is (x, y,
   kind, radius). B is (second crest radius, first crest width in pixels) for
   a ring, (front flag) for a plate and (run x, run y, hot flag, char cover)
   for heat, the run in ground px and the cover 1 to 0 as the ground heals. The CPU owns the radii, so the shader holds no
   spell law. */
const MARK_RIM_PX=3;
const MARK_WASH_PX=3;
/* Share of a burnt area that sits one rung down, on a 4x4 ordered dither. The
   rim is whole. Owner's taste, 2026-11-16: the whole burnt area darkens.
   The share wanders by MARK_PATCH over MARK_PATCH_PX: measured, a constant
   share draws a regular lattice of unburnt dots. */
const MARK_CHAR=0.75;
const MARK_PATCH=0.22;
const MARK_PATCH_PX=7;
function markUniforms(state,now,A,B){
  let n=0;
  for(const m of state.marks){
    if(n>=MARK_MAX)break;
    if(m.spell==='tremor'){
      const ring=tremorRingPx(now-m.at),second=ring-TREMOR_WAVE_PX;
      if(second>TREMOR_CREST_PX)continue;
      A[n].set(m.x,m.y,1,ring<=TREMOR_CREST_PX?ring:-8);
      /* the leading crest is two pixels while it still lifts grains */
      B[n].set(second>TREMOR_FOOT_PX?second:-8,ring<=TREMOR_LAUNCH_PX?2:1,0,0);
    }else if(m.spell==='frost'){
      const r=frostRadiusPx(m,now);
      if(r<=0)continue;
      A[n].set(m.x,m.y,2,r);
      B[n].set(r<m.r&&now<m.endAt?1:0,0,0,0);
    }else if(m.spell==='kindle'){
      const r=burnRadiusPx(m,now);
      if(r<=0)continue;
      const run=burnRunPx(m,now);
      A[n].set(m.x,m.y,3,r);
      /* the char thins as the ground heals */
      const cover=now>m.endAt?Math.max(0,1-(now-m.endAt)/m.fadeS):1;
      B[n].set(m.wx*run,m.wy*run,now<m.hotEnd?1:0,m.rim*cover);
    }else continue;
    n++;
  }
  for(let i=n;i<MARK_MAX;i++){A[i].set(0,0,0,0);B[i].set(0,0,0,0);}
  return n;
}

const GL=(n)=>Number(n).toFixed(4);
const SPELL_GLSL=`
uniform vec4 uMarkA[${MARK_MAX}];
uniform vec4 uMarkB[${MARK_MAX}];
/* rows in use: a pass skips every mark loop when it is zero */
uniform float uMarkN;
/* One screen pixel of a ring whose radius is a ground distance: half a pixel
   of screen distance through the local gradient of the ground metric. */
bool markOnRing(vec2 g,float radius,float thick){
  float d=length(g);
  if(radius<=0.0||d<0.001) return false;
  vec2 n=g/d;
  return abs(d-radius) < 0.5*thick*length(vec2(n.x,n.y*${GL(ROWS)}));
}
/* Depth inside a heat mark: its disc swept along its run. */
float markHeat(vec4 a,vec4 b,vec2 wp){
  vec2 g=(wp-a.xy)*vec2(1.0,${GL(ROWS)});
  float l2=dot(b.xy,b.xy);
  float h=l2>0.0?clamp(dot(g,b.xy)/l2,0.0,1.0):0.0;
  return a.w-length(g-b.xy*h);
}
/* 4x4 ordered dither threshold in [0, 1). */
float markBayer2(vec2 a){ a=floor(a); return fract(a.x/2.0+a.y*a.y*0.75); }
float markBayer(vec2 a){ return markBayer2(0.5*a)*0.25+markBayer2(a); }
/* value noise over the world, so a burn is patchy and holds still */
float markHash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
float markPatch(vec2 wp){
  vec2 q=wp*vec2(1.0,${GL(ROWS)})/${GL(MARK_PATCH_PX)}, i=floor(q), f=fract(q);
  f=f*f*(3.0-2.0*f);
  return mix(mix(markHash(i),markHash(i+vec2(1.0,0.0)),f.x),
             mix(markHash(i+vec2(0.0,1.0)),markHash(i+vec2(1.0,1.0)),f.x),f.y);
}
/* Rungs the ground tone moves at wp: +1 on a crest, -1 in a burnt area. The
   rim is ${MARK_RIM_PX} px of the edge that caused it. Inside it the char is
   an ordered dither that thins as the ground heals. */
float markRung(vec2 wp,bool heat){
  float shift=0.0;
  for(int i=0;i<${MARK_MAX};i++){
    vec4 a=uMarkA[i];
    if(a.z<0.5) continue;
    vec2 g=(wp-a.xy)*vec2(1.0,${GL(ROWS)});
    if(a.z<1.5){
      if(markOnRing(g,a.w,uMarkB[i].y)||markOnRing(g,uMarkB[i].x,1.0)) shift=1.0;
    }else if(a.z<2.5){
      if(uMarkB[i].x>0.5&&markOnRing(g,a.w,1.0)) shift=1.0;
    }else if(heat&&uMarkB[i].w>0.0){
      float inset=markHeat(a,uMarkB[i],wp);
      if(inset>=0.0&&(inset<${GL(MARK_RIM_PX)}*uMarkB[i].w||
        markBayer(wp)<(${GL(MARK_CHAR)}+${GL(MARK_PATCH)}*(2.0*markPatch(wp)-1.0))*uMarkB[i].w)) shift=-1.0;
    }
  }
  return shift;
}
/* Is wp inside a mark that still holds its heat. */
bool markHot(vec2 wp){
  for(int i=0;i<${MARK_MAX};i++){
    vec4 a=uMarkA[i];
    if(a.z>2.5&&uMarkB[i].z>0.5&&markHeat(a,uMarkB[i],wp)>=0.0) return true;
  }
  return false;
}
/* Ice at wp: 0 open water, 1 plate, 2 its lip. The deepest inset wins, so
   joined plates carry one lip around their union. Heat opens a plate, so the
   hole carries the lip too. */
float markPlate(vec2 wp){
  float inset=-1.0;
  for(int i=0;i<${MARK_MAX};i++){
    vec4 a=uMarkA[i];
    if(a.z<1.5||a.z>2.5) continue;
    inset=max(inset,a.w-length((wp-a.xy)*vec2(1.0,${GL(ROWS)})));
  }
  if(inset<0.0) return 0.0;
  for(int i=0;i<${MARK_MAX};i++){
    vec4 a=uMarkA[i];
    if(a.z>2.5&&uMarkB[i].z>0.5) inset=min(inset,-markHeat(a,uMarkB[i],wp));
  }
  if(inset<0.0) return 0.0;
  if(inset<${GL(MARK_WASH_PX)}) return mod(wp.x+wp.y,2.0)<1.0?2.0:0.0;
  return inset<${GL(MARK_RIM_PX+MARK_WASH_PX)}?2.0:1.0;
}
bool markCrest(vec2 wp){
  for(int i=0;i<${MARK_MAX};i++){
    vec4 a=uMarkA[i];
    if(a.z<0.5||a.z>1.5) continue;
    vec2 g=(wp-a.xy)*vec2(1.0,${GL(ROWS)});
    if(markOnRing(g,a.w,uMarkB[i].y)||markOnRing(g,uMarkB[i].x,1.0)) return true;
  }
  return false;
}
`;

/* ── what a mark throws ───────────────────────────────────────────────────
   Motes share the kicked-grain pool shape, so stepKick integrates them and
   the draw list paints them as grains. Ground material comes through
   spawnKick and keeps its own flight. A flame or a spark has no weight worth
   drawing: g is 0 and it dies at `life`. */
const TREMOR_STEP_PX=6;
const TREMOR_ARC_PX=16;
const SHED_MIN_H=20;
const FLAME=Object.freeze({
  /* A flame puffs at 1.5/sqrt(D) Hz (Cetegen & Ahmed 1993): 2.6 Hz for a
     0.33 m tongue. AUTHORED: the field steps at 7 Hz, so one puff is three
     steps. */
  hz:7,
  /* The height field: one wave over the bed that travels downwind a lattice
     cell a step, crossed by a slower one. Ground px. */
  wavePx:10,crossPx:14,
  /* AUTHORED: the fuel-bed lattice pitch in ground px, and what a full fire
     throws a second. A bed too wet to burn gives off wetSmoke times the
     smoke. A melt gives off steam. A run faster than leanPxS lays its flames
     downwind. */
  bedPx:4,sparkHz:14,smokeHz:9,wetSmoke:3,steamHz:16,leanPxS:2,
  /* The medium wins: a head fire in grass stands 2.7 m, taller than the
     traveller, and hides the picture it burns. A flame is drawn at this
     share of Byram's length. */
  drawn:0.35,
  /* The flame zone, front to rear, as shares of the residence time: a
     tongue reaches its height in the first `rise` and sinks to the rear. A
     rear cell flames with probability `rear` at the trailing edge. */
  rise:0.12,rear:0.30,
  /* a tongue at least this size carries a pale heart and may shed a lick */
  coreSize:2,lick:0.12,
  /* a burnt cell glows with this probability each flame frame */
  glint:0.10,
  /* Share of the 10 m wind at flame height: the log profile over grass,
     ln(1.5/0.03)/ln(10/0.03). */
  windShare:0.67,
});
/* Tongue sizes, width by height in pixels, smallest first. An odd width
   keeps the tip on one column. src/sprite.js rasterises each from a width
   profile. Tongues stand FLAME.bedPx apart and are wider than that, so
   neighbours overlap and a front reads as one body. */
const FLAME_SHAPES=Object.freeze([[3,3],[5,4],[5,6],[7,8],[7,10]]);
function flameSize(kWm){
  const px=flameLengthM(kWm)*FLAME.drawn*PX_PER_M;
  let size=0;
  for(let i=1;i<FLAME_SHAPES.length;i++)if(FLAME_SHAPES[i][1]<=px)size=i;
  return size;
}
function mote(pool,state,x,y,z,vx,vy,vz,life,ramp,sMin,sMax,size,glow=true){
  if(pool.length>=MOTE_MAX)return;
  const u=hashf(state.emit++,pool.length,0x5be11);
  /* `glow`: the caster's light, drawn emitted. Smoke and steam are world
     material. */
  pool.push({x,y,z,vx,vy,vz,g:0,terminal:1,drift:0,age:0,life,maxAge:life,
    peak:z,flutter:4,flutterRate:7+u*5,flutterPhase:u*Math.PI*2,
    ramp,sMin,sMax,size,glow});
}

/* An ice crystal: the plate's own ice in the air (material FROST in
   src/sprite.js). It falls at its terminal speed and lands. */
const CRYSTAL_PX_S=F.crystalMps*PX_PER_M;
function crystal(pool,state,x,y,z,vx=0,vy=0){
  if(pool.length>=MOTE_MAX)return;
  const u=hashf(state.emit++,pool.length,0xc1a5);
  const life=z/CRYSTAL_PX_S+0.2;
  pool.push({x,y,z,vx,vy,vz:0,g:GRAVITY_PX_S2,terminal:CRYSTAL_PX_S,drift:0,age:0,
    life,maxAge:life,peak:z,flutter:2,flutterRate:5+u*4,flutterPhase:u*Math.PI*2,
    ramp:'folkSignal',sMin:0,sMax:1,size:u<0.3?2:1,frost:true});
}

/* The cast shows at the caster: a ring of his own colour, once. Frost shows
   as ice. */
function emitGlyph(pool,state,m,coat){
  for(let k=0;k<8;k++){
    const a=(k+hashf(m.id,k,0x61f))*Math.PI/4,c=Math.cos(a),s=Math.sin(a);
    if(m.spell==='frost'){
      crystal(pool,state,m.ox+c*6,m.oy+s*3+1,4+3*hashf(m.id,k,0x620),c*14,s*7);
      continue;
    }
    mote(pool,state,m.ox+c*5,m.oy+s*2.5+1,3,c*26,s*13,10,0.26,
      k&1?'folkSignal':coat.ramp,k&1?0:0.66,1,1);
  }
}

/* A laden crown lets go, once: a crown another live mark already bared has
   no snow to give. Clumps fall under gravity alone (CLUMP in src/matter.js):
   no flutter, no drift. A veil of powder leaves with them on the snow's own
   light flight. */
function shedCrown(pool,state,p,now,m){
  if(propFx(state,now,p.x,p.y,p.w*0.5,true,p.kind,m).bare)return;
  const n=Math.max(6,Math.min(16,Math.round(p.w/2)));
  for(let k=0;k<n;k++){
    const u=hashf(p.x*7+k,p.y,0x5ed),v=hashf(p.x,p.y*7+k,0x5ee);
    const z0=p.h*(0.35+0.6*v),x=p.x+(u-0.5)*p.w*0.7;
    if(pool.length<MOTE_MAX){
      const flight=flightFor(z0/PX_PER_M,CLUMP_TERMINAL_MPS,z0);
      pool.push({x,y:p.y+2,z:z0,vx:(u-0.5)*4,vy:0,vz:0,g:GRAVITY_PX_S2,
        terminal:flight.terminalPxS,drift:0,age:0,life:flight.durationS,
        maxAge:flight.durationS+0.1,peak:z0,flutter:0,flutterRate:0,flutterPhase:0,
        ramp:SURFACE[SURF.snow].ramp,sMin:0.70,sMax:1,size:2,
        heavy:true,wait:(1-v)*CLUMP.cascadeS});
    }
    if(k&1)state.emit=spawnKick(pool,x,p.y+2,SURF.snow,state.emit,'walk',
      {count:1,cap:MOTE_MAX,z0,heightM:z0/PX_PER_M,vx:(u-0.5)*6,vy:0});
  }
}

function emitTremor(pool,state,m,age,world){
  const ring=tremorRingPx(age);
  let R=Math.max(m.swept,TREMOR_FOOT_PX);
  while(R+TREMOR_STEP_PX<=Math.min(ring,TREMOR_LAUNCH_PX)){
    R+=TREMOR_STEP_PX;
    const n=Math.max(4,Math.round(R*2*Math.PI/TREMOR_ARC_PX));
    const heightM=tremorLaunchM(R/PX_PER_M);
    for(let k=0;k<n;k++){
      const a=(k+hashf(m.id,R*64+k,0x7e3))*2*Math.PI/n,c=Math.cos(a),s=Math.sin(a);
      const wx=m.x+c*R,wy=m.y+s*R/ROWS;
      const flag=world.flagAt(wx,wy);
      if(!kickFor(flag)||wetAt(state,wx,wy,m.at+age))continue;
      state.emit=spawnKick(pool,wx,wy,flag,state.emit,'run',
        {count:1,cap:MOTE_MAX,heightM,vx:c*6,vy:s*3});
    }
  }
  m.swept=R;
  if(!world.snowy)return;
  /* A crown sheds when the ring crosses it. The crossing is the event, so no
     tree stores that it shed. */
  const r0=m.ring||0,r1=Math.min(ring,TREMOR_SHED_PX);
  if(r1<=r0)return;
  for(const p of world.props(m.x,m.y,r1)){
    if(!p.plant||p.h<SHED_MIN_H)continue;
    const d=groundDist(m.x,m.y,p.x,p.y);
    if(d>r0&&d<=r1)shedCrown(pool,state,p,m.at+age,m);
  }
  m.ring=r1;
}

/* Crystals fall out of the air over the plate as it freezes: one a frame
   over the frozen disc, and one every other frame on the front while it
   grows. */
function emitFrost(pool,state,m,now){
  const r=frostRadiusPx(m,now);
  if(now-m.at>=F.dustS||now>=m.endAt||r<=0)return;
  const h=(salt)=>hashf(m.id,m.tick,salt);
  const a=h(0xf05)*2*Math.PI,d=r*Math.sqrt(h(0xf06));
  crystal(pool,state,m.x+Math.cos(a)*d,m.y+Math.sin(a)*d/ROWS,
    F.dustM*PX_PER_M*(0.25+0.75*h(0xf07)));
  if(r<m.r&&m.tick%2===0){
    const b=h(0xf08)*2*Math.PI;
    crystal(pool,state,m.x+Math.cos(b)*r,m.y+Math.sin(b)*r/ROWS,2);
  }
}

/* A site flames from when the front reaches it, for the residence time. */
const alight=(m,now,since)=>now<m.flameEnd&&since>=0&&since<m.flameS;
/* the plants a fire can reach now: one query around the middle of its run */
function firePlants(m,now,world){
  const run=burnRunPx(m,now)/2;
  return world.props(m.x+m.wx*run,m.y+m.wy*run/ROWS,burnRadiusPx(m,now)+run);
}

/* The fuel bed burns on a fixed ground lattice, so a tongue has a place and
   holds it. `visit(wx,wy,since,i,j)` is called for each lit cell on a bed. */
function bedSites(m,now,world,visit){
  const r=burnRadiusPx(m,now),run=burnRunPx(m,now),cell=FLAME.bedPx;
  const ex=m.x+m.wx*run,gy=m.y*ROWS,ey=gy+m.wy*run;
  const i0=Math.floor((Math.min(m.x,ex)-r)/cell),i1=Math.floor((Math.max(m.x,ex)+r)/cell);
  const j0=Math.floor((Math.min(gy,ey)-r)/cell),j1=Math.floor((Math.max(gy,ey)+r)/cell);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const wx=(i+hashf(i,j,0xbed1))*cell,wy=(j+hashf(i,j,0xbed2))*cell/ROWS;
    if(runDist(m,wx,wy,run)>r)continue;
    const since=litFor(m,now,wx,wy);
    if(!alight(m,now,since))continue;
    if(!SURFACE[world.flagAt(wx,wy)]?.fuel)continue;
    visit(wx,wy,since,i,j);
  }
}

/* The tongues alight at `now`, derived: nothing stores a flame. A tongue is
   {x, y, z, size, lean, core}: `size` indexes FLAME_SHAPES, `lean` is -1, 0
   or 1, `core` is the pale heart drawn inside the base. The fire's intensity
   sets the full size. A site is tallest just behind the front and sinks to
   the rear, so the flames are a band that travels with the front. Height and
   lean follow one travelling wave over the bed: neighbours rise and fall
   together. */
function flameTongues(state,now,world,out=[]){
  for(const m of state.marks){
    if(m.spell!=='kindle'||m.melt||now<m.at||now>=m.flameEnd)continue;
    const tick=Math.floor(now*FLAME.hz);
    const windy=m.runPx>=FLAME.leanPxS,laid=windy?Math.sign(m.wx):0;
    /* Head, flank and back: a head fire stands about three times a backing
       fire (savanna burns, Fire Safety Journal 2013). The flank is the
       impulse's own flame, the back one size under it. */
    const head=flameSize(m.headKWm),flank=flameSize(m.flankKWm);
    const full=Math.max(head,flank);
    const peakAt=(x,y)=>{
      if(!windy)return flank;
      const along=((x-m.x)*m.wx+(y-m.y)*ROWS*m.wy)/m.r;
      return along>=0?flank+(head-flank)*Math.min(1,along):flank-Math.min(1,-along);
    };
    const TAU=2*Math.PI;
    const tongue=(x,y,z,peak,since,key,burnS=m.flameS)=>{
      const life=since/burnS;
      if(life>=1)return;
      const zone=life<FLAME.rise?life/FLAME.rise:1-(life-FLAME.rise)/(1-FLAME.rise);
      /* the rear of the zone burns out in patches */
      if(hashf(key,0,0xbed4)>FLAME.rear+(1-FLAME.rear)*zone)return;
      const gx=x-m.x,gy=(y-m.y)*ROWS;
      const s=gx*m.wx+gy*m.wy,c=gy*m.wx-gx*m.wy;
      const wave=0.5+0.5*Math.sin(TAU*(s-tick*FLAME.bedPx)/FLAME.wavePx)
        *(0.6+0.4*Math.sin(TAU*c/FLAME.crossPx+tick*0.5));
      const size=Math.max(0,Math.min(FLAME_SHAPES.length-1,
        Math.round(peak*zone*(0.55+0.45*wave))));
      const sway=Math.sin(TAU*c/FLAME.crossPx+tick*0.8);
      const lean=laid&&hashf(key,tick,0x1ea4)<0.75?laid:sway>0.4?1:sway<-0.4?-1:0;
      out.push({x,y,z,size,lean,core:false});
      if(size<FLAME.coreSize)return;
      out.push({x,y,z,size:size-FLAME.coreSize,lean,core:true});
      /* a lick leaves the tip for one frame */
      if(hashf(key,tick,0x11c4)<FLAME.lick)
        out.push({x:x+lean,y,z:z+FLAME_SHAPES[size][1]+1,size:0,lean:0,core:false});
    };
    for(const p of firePlants(m,now,world)){
      if(!p.plant||!plantCatches(p.kind,m.kWm,m.damp))continue;
      const since=litFor(m,now,p.x,p.y);
      const key=p.x*31+p.y*17,tall=p.h>=SHED_MIN_H;
      const burnS=tall?K.crownS:m.flameS;
      if(since<0||since>=burnS)continue;
      /* a plant that caught burns on its own fuel, a crown more than a shrub */
      const peak=Math.max(full,FLAME.coreSize+(tall?1:0));
      const n=Math.max(1,Math.min(5,Math.round(p.w/5)));
      for(let k=0;k<n;k++)
        tongue(p.x+((k+0.5)/n-0.5)*p.w*0.7,p.y+1,0,peak,since,key+k,burnS);
      /* a tall plant carries fire up its crown */
      if(tall)for(let k=0;k<6;k++)
        tongue(p.x+(hashf(key,k,0xc20)-0.5)*p.w*0.45,p.y+1,p.h*(0.18+0.12*k),
          peak-(k>>2),since,key+7+k,burnS);
    }
    bedSites(m,now,world,(wx,wy,since,i,j)=>
      tongue(wx,wy,0,peakAt(wx,wy),since,i*131+j*17));
  }
  return out;
}

/* Embers: a burnt cell of the bed glows now and then while the mark keeps
   its heat. {x, y}: one pixel of the caster's signal on the ground. */
function emberGlints(state,now,world,out=[]){
  for(const m of state.marks){
    if(m.spell!=='kindle'||m.melt||!m.bed||now<m.at||now>=m.flameEnd+K.emberS)continue;
    const tick=Math.floor(now*FLAME.hz);
    const r=burnRadiusPx(m,now),run=burnRunPx(m,now),cell=FLAME.bedPx*2;
    const ex=m.x+m.wx*run,gy=m.y*ROWS,ey=gy+m.wy*run;
    for(let j=Math.floor((Math.min(gy,ey)-r)/cell);j<=Math.floor((Math.max(gy,ey)+r)/cell);j++)
    for(let i=Math.floor((Math.min(m.x,ex)-r)/cell);i<=Math.floor((Math.max(m.x,ex)+r)/cell);i++){
      if(hashf(i*131+j*17,tick,0xe3be)>=FLAME.glint)continue;
      const wx=(i+hashf(i,j,0xe3b1))*cell,wy=(j+hashf(i,j,0xe3b2))*cell/ROWS;
      if(runDist(m,wx,wy,run)>r||litFor(m,now,wx,wy)<m.flameS*FLAME.rise)continue;
      if(SURFACE[world.flagAt(wx,wy)]?.fuel)out.push({x:wx,y:wy});
    }
  }
  return out;
}

/* Sparks, smoke and steam leave the heat. Sparks carry the caster's signal.
   Smoke is drawn on CHAR.ramp, the ramp charred wood takes. Steam is the
   water, on the pale end of that water's ramp. All three ride the wind. */
function emitKindle(pool,state,m,now,dt,world){
  const air=windMps(world.wind)*FLAME.windShare*PX_PER_M;
  const ax=WCA*air,ay=WSA*air;
  const inDisc=(salt)=>{
    const a=hashf(m.id,m.tick,salt)*2*Math.PI;
    const d=burnRadiusPx(m,now)*Math.sqrt(hashf(m.id,m.tick,salt^0x55));
    return [m.x+Math.cos(a)*d,m.y+Math.sin(a)*d/ROWS];
  };
  const smoke=(x,y,z,u)=>mote(pool,state,x,y,z,ax+(u-0.5)*4,ay,12+u*8,1.0+0.6*u,
    CHAR.ramp,0.66,1,2,false);
  if(m.melt){
    if(now-m.at>=K.steamS||hashf(m.id,m.tick,0x57e)>=FLAME.steamHz*dt)return;
    const [x,y]=inDisc(0x57f),u=hashf(m.id,m.tick,0x580);
    mote(pool,state,x,y,2,ax*0.5+(u-0.5)*4,ay*0.5,14+u*10,0.7+0.5*u,
      SURFACE[m.flag]?.ramp||'folkSignal',0.80,1,1,false);
    return;
  }
  const wet=m.bed&&m.damp<=0;
  if(now>=m.flameEnd){
    /* a wet bed smoulders on its embers */
    if(wet&&now<m.flameEnd+K.emberS&&hashf(m.id,m.tick,0x5c1)<FLAME.smokeHz*dt){
      const [x,y]=inDisc(0x5c2);
      smoke(x,y,5,hashf(m.id,m.tick,0x5c3));
    }
    return;
  }
  const sites=[];
  for(const p of firePlants(m,now,world)){
    if(!p.plant||!plantCatches(p.kind,m.kWm,m.damp))continue;
    if(alight(m,now,litFor(m,now,p.x,p.y)))sites.push([p.x,p.y+2,p.h*0.6,p.w*0.5]);
  }
  bedSites(m,now,world,(wx,wy)=>sites.push([wx,wy,4,3]));
  if(!sites.length)return;
  const pick=(salt)=>sites[Math.floor(hashf(m.id,m.tick,salt)*sites.length)];
  const n=Math.min(1,sites.length/6);
  if(hashf(m.id,m.tick,0x5a1)<FLAME.sparkHz*n*dt){
    const [x,y,z,w]=pick(0x5a2),u=hashf(m.id,m.tick,0x5a3);
    mote(pool,state,x+(u-0.5)*w,y,z+2,ax*0.5+(u-0.5)*10,ay*0.5,26+u*22,0.5+0.4*u,
      'folkSignal',0,1,1);
  }
  if(hashf(m.id,m.tick,0x5b1)<FLAME.smokeHz*(wet?FLAME.wetSmoke:1)*n*dt){
    const [x,y,z,w]=pick(0x5b2),u=hashf(m.id,m.tick,0x5b3);
    smoke(x+(u-0.5)*w,y,z+7,u);
  }
}

/* The fall of a squall, derived as src/weather.js derives rain: a fixed set
   of events over the disc, each repeating on its own phase with a new hashed
   landing point every cycle. A raindrop shows for RAIN.fallWindowS as a
   streak, then as a hit on the ground. Graupel shows for
   its whole fall. Both slant with the wind. Rain is the world's own rain
   ramp. A world with none draws it as the plate's ice is drawn, `ice`: the
   snap list's pale blue. Graupel is ice: measured, snow on its own ramp
   does not show over snow. */
function squallFall(state,now,world,out=[]){
  const wind=windMps(world.wind)*PX_PER_M,snow=world.snowy;
  const n=snow?Q.flakes:Q.drops,period=snow?Q.flakeS:Q.dropS;
  const ramp=snow?SURFACE[SURF.snow].ramp:world.rainRamp||'folkSignal';
  const ice=!snow&&!world.rainRamp;
  for(const m of state.marks){
    if(m.spell!=='squall')continue;
    const age=now-m.at;
    if(age<0||age>=Q.rainS+period)continue;
    for(let k=0;k<n;k++){
      const at=age+hashf(m.id,k,0x5a1)*period,cycle=Math.floor(at/period);
      const a=at-cycle*period,born=age-a;
      if(born<0||born>=Q.rainS)continue;
      const h=(salt)=>hashf(m.id*977+k,cycle,salt);
      const b=h(1)*2*Math.PI,d=m.r*Math.sqrt(h(2));
      const gx=m.x+Math.cos(b)*d,gy=m.y+Math.sin(b)*d/ROWS;
      if(snow){
        const fall=Q.flakeM*PX_PER_M*(0.5+0.5*h(3)),left=fall/CRYSTAL_PX_S-a;
        if(left<=0)continue;
        out.push({x:gx-WCA*wind*left,y:gy-WSA*wind*left,z:CRYSTAL_PX_S*left,
          ramp,sMin:0.70,sMax:1,size:h(4)<0.25?2:1,ice:true});
        continue;
      }
      const v=rainTerminalPx(rainDiameter(h(3),Q.rateMmH));
      const left=RAIN.fallWindowS-a;
      if(left>0){
        const len=Math.max(3,Math.round(v*Q.streakS));
        for(let i=0;i<len;i++){
          const t=left+i/v;
          out.push({x:gx-WCA*wind*t,y:gy-WSA*wind*t,z:v*t,ramp,sMin:0.80,sMax:1,size:1,ice});
        }
      }else if(-left<RAIN.groundLifeS){
        out.push({x:gx,y:gy,z:0,ramp,sMin:0.80,sMax:1,size:1,ice});
        if(-left<RAIN.groundLifeS*0.5)continue;
        out.push({x:gx-1,y:gy,z:1,ramp,sMin:0.80,sMax:1,size:1,ice});
        out.push({x:gx+1,y:gy,z:1,ramp,sMin:0.80,sMax:1,size:1,ice});
      }
    }
  }
  return out;
}

/* Everything the live marks throw this frame. `world` answers for the scene:
   flagAt(x,y), props(x,y,radius), coat, snowy, wind (the control), rainRamp.
   A squall throws nothing: its fall is derived. */
function emitMarks(state,pool,now,dt,world){
  for(const m of state.marks){
    const age=now-m.at;
    if(age<0)continue;
    if(m.tick===0)emitGlyph(pool,state,m,world.coat);
    if(m.spell==='tremor')emitTremor(pool,state,m,age,world);
    else if(m.spell==='frost')emitFrost(pool,state,m,now);
    else if(m.spell==='kindle')emitKindle(pool,state,m,now,dt,world);
    m.tick++;
  }
}

/* Integrate the pool. A clump that lands throws the ground it lands on. */
const LANDED=[];
function stepMotes(state,pool,dt,wind,world){
  LANDED.length=0;
  stepKick(pool,dt,wind,LANDED);
  for(const p of LANDED)
    state.emit=spawnKick(pool,p.x,p.y,world.flagAt(p.x,p.y),state.emit,'run',
      {count:3,cap:MOTE_MAX});
}

/* A cast the medium refused: a few pale motes. Heat on open water also
   raises steam on that water's `ramp`. */
function emitFizzle(pool,state,x,y,ramp=null){
  for(let k=0;k<5;k++){
    const u=hashf(state.seq,k,0xf122);
    mote(pool,state,x+(u-0.5)*8,y,1,(u-0.5)*10,0,12+u*10,0.35,'folkSignal',0,1,1);
    if(ramp)mote(pool,state,x+(u-0.5)*14,y,1,(u-0.5)*6,0,16+u*10,0.6+0.4*u,
      ramp,0.80,1,1,false);
  }
}

export {
  CHAR, FLAME, FLAME_SHAPES, MARK_CHAR, MARK_MAX, MARK_RIM_PX, MARK_WASH_PX, MOTE_MAX,
  SPELLS, SPELL_GLSL, SPELL_ORDER,
  TREMOR_CREST_PX, TREMOR_FOOT_AMP_M, TREMOR_LAUNCH_PX, TREMOR_LIFTOFF_M,
  TREMOR_SHED_PX, TREMOR_SPEED_PX, TREMOR_WAVE_PX, TREMOR_WAVE_S, WIND_GX, WIND_GY,
  burnArrivalS, burnRadiusPx, burnRunPx, burntAt, castSpell, cooldownLeft,
  createSpellState, emberGlints, emitFizzle, emitMarks, flameSize, flameTongues,
  frostRadiusPx, frozenAt, groundDist, holdIce, hotAt, markUniforms, propFx,
  pruneMarks, squallFall, stepMotes, tremorAmpM, tremorLaunchM, tremorRadiusM,
  tremorRingPx, wetAt, windMps,
};
