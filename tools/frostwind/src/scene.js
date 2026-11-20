import { bakeWorldAtlas, buildWorldAtlas } from './atlas.js';
import { wear } from './gear.js';
import { createAttentionState, figureViewFromHeading, setAttentionTarget,
         updateAttention, viewFromHeading } from './attention.js';
import CHUNK_WORKER_SOURCE from './chunk-worker-source.js';
import { GROUND_PX_PER_ROW } from './basin.js';
import { CH, FLAG_Q, PRINT_LIFE, PRINT_TICK, printStrength } from './constants.js';
import { KINDS, SPECIES } from './species.js';
import { applyDisturbance, recordTravellerPresence } from './disturbance.js';
import { ACTOR, PRINT, stateKey } from './fauna.js';
import { CAST, CAST_BY_KEY, castStates, folkFootWorld, folkStrikes, gaitFrames,
         heightPx, travellerFor, travellerKeyFor } from './people.js';
import { spawnKick, stepKick } from './kickup.js';
import { LifeRuntime } from './life-runtime.js';
import { LifeSession } from './life-session.js';
import { clamp } from './math.js';
import { metresToPx } from './scale.js';
import { SUN } from './sunlight.js';
import { DESERT_FOG, FOG_BASE, HOLLOW_FOG, MEADOW_FOG, SWAMP_FOG, RAMP, RAMP_ID, repaint } from './palette.js';
import { contactRung, setLight as setAtlasSun } from './sprite.js';
import { CHAR, SPELLS, SPELL_ORDER, castSpell, createSpellState, emberGlints, emitFizzle,
         emitMarks, flameTongues, frozenAt as plateAt, holdIce, markUniforms, propFx,
         pruneMarks, squallFall, stepMotes, windMps } from './spell.js';
import { ROTORS, rotorFrame } from './steading.js';
import { rockerFrameAt } from './swamp-lakehouse.js';
import { SURFACE } from './surface.js';
import { DRIP, RAIN, SAND, gustPhase } from './weather.js';
import { makeWorldGen, textureChunk } from './worldgen.js';

/* Renderer owns frame/GPU state. Scene owns world state and asks the renderer
   for frame size. Scenes are exclusive: sprite LIGHT is a bake-time module
   global. See ARCHITECTURE.md and docs/DECISIONS.md. */

/* A circle on the ground is an ellipse on the screen (PROJECTION.md): a solid
   of radius r spans r columns and r/2 rows. Collision scales the row difference
   back up. 1.9, not 2.0, is authored: moving it moves where every world seats
   its traveller. */
const GROUND_SQUASH=1.9;

/* A rider mounts from beside the barrel: the reach is ACTOR.camel.solidRadius
   (fauna.js) plus one arm, in metres, converted by src/scale.js. */
const MOUNT_ARM_M=1.2;

/* Traveller speed, world px/s. 28 and 52 are the base cadence. TRAVELLER_PACE
   is an authored 30% on top.

   At PLAYER_H = 26 px = 1.70 m (15.3 px/m) the walk is 2.38 m/s against a
   1.4 m/s preferred adult walking speed (Bohannon 1997): an authored jog.

   Phase advances by ground covered (gaitFrames in body-folk.js), so cadence
   follows speed, from about 2.0 steps per second to 2.6. */
const TRAVELLER_PACE=1.30;
const TRAVELLER_SPEED=Object.freeze({
  walk:28*TRAVELLER_PACE, run:52*TRAVELLER_PACE,
});
/* worldgen owns biome geometry/content. SCENES owns frame palette, fog and
   aerial/reflection budgets. Ramp IDs stay global because baked data stores
   them. */

const shLum=c=>(0.30*c[0]+0.59*c[1]+0.11*c[2])/255;

/* Invariant: aerial treatment may not snap a surface off its derived rung.
   hazeCap uses the shader's own arithmetic and nearest-entry metric. */

const AER_L=[0.30,0.59,0.11], SNAP_W=[1.414,2.0,1.732];
const aerial=(c,tL,comp,desat,fogA,fogC)=>{
  let L=AER_L[0]*c[0]+AER_L[1]*c[1]+AER_L[2]*c[2];
  const a=c.map(v=>v+(L-v)*desat);
  L=AER_L[0]*a[0]+AER_L[1]*a[1]+AER_L[2]*a[2];
  const b=a.map(v=>v+(tL-L)*comp);
  return b.map((v,i)=>v+(fogC[i]-v)*fogA);
};
const snapD=(a,b)=>{ let s=0; for(let i=0;i<3;i++){ const d=(a[i]-b[i])*SNAP_W[i]; s+=d*d; } return s; };
const hazeCap=(ramp,fog,tL,comp,desat,want)=>{
  const keeps=h=>{ const c=aerial(ramp[0],tL,comp,desat,h,fog);
                   return snapD(c,ramp[0])<snapD(c,ramp[1]); };
  if(keeps(want)) return want;
  let lo=0, hi=want;
  for(let i=0;i<24;i++){ const m=(lo+hi)/2; if(keeps(m)) lo=m; else hi=m; }
  return lo;
};

const WORLD_NAMES=Object.freeze({
  frostwood:'Frostwood',
  meadow:'Sun Meadow',
  swamp:'Green Swamp',
  desert:'Amber Waste',
  hollow:'Amethyst Hollow',
});
/* windUV in shaders/sprite.js skips any instance whose phase is negative. A
   position phase or a literal 0 for actors is non-negative, so houses,
   deadfalls, animals and the traveller rock like saplings. KINDS, the species
   that grow, is the authority for what bends. Everything else is RIGID. */
const RIGID=-1;
/* A species row may say `rigid`: stone, and bodies in still air. */
const SWAYS=new Set(KINDS.filter(k=>!SPECIES[k].rigid));
const CLEAR_PRECIPITATION=Object.freeze({kind:'clear',intensity:0,ramp:null});
const SNOW_PRECIPITATION=Object.freeze({kind:'snow',intensity:1,ramp:'snow'});
const SCENES={
  frostwood:{
    name:WORLD_NAMES.frostwood,
    biome:'boreal',
    precipitation:SNOW_PRECIPITATION,
    ramps:['snow','birch','warm','trunk','water','ice','shade','twig','accent',
      'machineSignal','folkCoat','folkWool','folkUmber','folkOat','folkSignal',
      'folkDark','folkDye'],
    fog:FOG_BASE,
    /* 150 is the rung the open snowfield sits on (snow's fourth of six, 138 to
       177). Authored. */
    aer:()=>[150,0.24,0.21,0.19],
    /* The ramp a frost plate draws on (src/spell.js). A world without one
       draws the plate on the water's own ramp. */
    ice:'ice',
    /* First term: medium-legibility replacement strength above the water
       ramp's physical Fresnel return. Second: wave displacement. */
    reflection:()=>[0.34,0.82],
  },
  meadow:{
    name:WORLD_NAMES.meadow,
    biome:'meadow',
    precipitation:CLEAR_PRECIPITATION,
    /* No folk ramps beyond the hero's: this list is 63 of the 64 colours
       POST_FS iterates, so the steading cast borrows `trunk` and `timber` for
       its fleece and carries no dyed band. FASHION_VOCAB.meadow in
       src/culture.js owns the reasoning. */
    ramps:['canopy','grass','loam','masonry','bloom','pond','timber','twig','warm',
      'trunk','accent','machineSignal','pavilionCloth','pavilionTrim','folkCoat',
      'folkSignal','folkDark'],
    fog:MEADOW_FOG,

    aer:()=>{ const tL=Math.round(255*shLum(RAMP.grass[2])), comp=0.10;
              return [tL,comp,0.08,hazeCap(RAMP.canopy,MEADOW_FOG,tL,comp,0.08,0.19)]; },

    reflection:()=>[0.30,0.70],
  },
  swamp:{
    name:WORLD_NAMES.swamp,
    biome:'swamp',
    precipitation:RAIN,
    ramps:['swampCanopy','swampGround','swampWater','swampShallow','duckweed',
           'swampWood','trunk','birch','accent','warm','twig',
           'machineSignal','swampCoat','folkUmber','folkWool',
           'folkSignal','folkDark','folkDye'],
    fog:SWAMP_FOG,
    aer:()=>{ const tL=Math.round(255*shLum(RAMP.swampGround[2])),comp=0.10;
              return [tL,comp,0.06,
                hazeCap(RAMP.swampCanopy,SWAMP_FOG,tL,comp,0.06,0.15)]; },
    reflection:()=>[0.30,0.84],
  },
  desert:{
    name:WORLD_NAMES.desert,
    biome:'desert',
    precipitation:SAND,
    /* An erg is three materials and one pool: sand, the pavement the sand blew
       off, and the salt the pool left. `pond` is borrowed from the meadow
       whole. The rest are the four SPRITE_FS hardcodes plus the traveller. */
    ramps:['sand','hamada','sabkha','pond','twig','timber','camelCoat','desertCanopy','masonry',
           /* The two households' fleece and their one dyed band
              (FASHION_VOCAB.desert owns why this world pays for it). One
              fleece: both residents seed onto folkOat, and a ramp nothing
              draws still competes to be the nearest colour. test/biome.test.mjs
              names any ramp a household needs. */
           'folkOat','folkDye',
           'folkCoat','folkSignal','trunk','accent','machineSignal','folkDark'],
    fog:DESERT_FOG,
    /* The haze is ground, not sky: the aerial target luminance comes off the
       sand's own lit rung. Compression is the highest of the four worlds: at a
       24 N solstice noon the beam is near vertical and the far field loses its
       modelling. Desaturation stays low: suspended sand is the colour of the
       ground. */
    aer:()=>{ const tL=Math.round(255*shLum(RAMP.sand[2])),comp=0.14;
              return [tL,comp,0.05,
                hazeCap(RAMP.sand,DESERT_FOG,tL,comp,0.05,0.22)]; },
    /* A desert pool is still: no fetch on fifteen metres of water in a hollow,
       so the displacement term is the lowest in the project. */
    reflection:()=>[0.34,0.30],
    /* The ground moves here. src/worm.js owns the law and its boundary. */
    worm:true,
  },
  hollow:{
    name:WORLD_NAMES.hollow,
    biome:'hollow',
    precipitation:DRIP,
    /* Two floors on one albedo, one water, one calcite, two luminous bodies.
       The rest are the SPRITE_FS hardcodes and the traveller. */
    ramps:['caveRock','geodeRock','moonRock','gourWater','dripstone','geodeStone',
           'glowcap','amethyst','moonstone',
           /* No cave colour is near a face: material 16 resolves `skin`,
              and without the ramp a face snaps to the coat. */
           'skin',
           /* The earth folk wear `trunk` and `gourWater`
              (FASHION_VOCAB.hollow), so the dyed band is their one entry. */
           'folkDye',
           'folkCoat','folkSignal','trunk','accent','machineSignal','folkDark'],
    fog:HOLLOW_FOG,
    /* No sun: the light is the ceiling, constant. The renderer takes this in
       place of the clock's sun (setLight). src/sunlight.js owns the row. */
    light:SUN.hollow.dir,
    /* Still, saturated air over tens of metres veils nothing. The target is
       the floor's own resting rung, so the treatment moves no ground pixel. */
    aer:()=>{ const tL=Math.round(255*shLum(RAMP.caveRock[1])),comp=0.06;
              return [tL,comp,0.0,
                hazeCap(RAMP.caveRock,HOLLOW_FOG,tL,comp,0.0,0.06)]; },
    /* No fetch and no wind: the mirror is whole. */
    reflection:()=>[0.46,0.12],
    /* The air does not move, so nothing sways until a spell moves it. */
    still:true,
  },
};

/* A reflected sprite matters only where its mirrored screen rectangle meets an
   open-water flag resident in the streamed geometry. Four-pixel sampling
   ignores puddles too small to carry an eight-pixel caster. */
function reflectionTouchesWet(e,camX,camY,W,H,chunks){
  const r=e.r,anchorX=e.flip?r.w-1-r.ax:r.ax;
  const x0=Math.max(0,Math.floor(e.x-anchorX));
  const x1=Math.min(W-1,Math.ceil(e.x-anchorX+r.w));
  /* The waterline W_REFLECT_VS mirrors about, including the lift. max(): a
     negative lift is a ground skirt, which the mirror ignores. */
  const base=e.y+r.h-r.ay+2*Math.max(e.lift||0,0);
  const y0=Math.max(0,Math.floor(base));
  const y1=Math.min(H-1,Math.ceil(base+r.h));
  if(x0>x1||y0>y1)return false;
  const wet=(sx,sy)=>{
    const wx=Math.floor(camX+sx),wy=Math.floor(camY+sy);
    const c=chunks.get(Math.floor(wx/CH)+','+Math.floor(wy/CH));
    if(!c||!c.geom)return false;
    const lx=wx-c.ox,ly=wy-c.oy;
    if(lx<0||ly<0||lx>=CH||ly>=CH)return false;
    const flag=Math.round(c.geom[(ly*CH+lx)*4+3]/FLAG_Q);
    return !!SURFACE[flag]?.wet;
  };
  const scan=y=>{
    for(let x=x0;x<=x1;x+=4)if(wet(x,y))return true;
    return wet(x1,y);
  };
  for(let y=y0;y<=y1;y+=4)if(scan(y))return true;
  return scan(y1);
}

/* The ramps a world snaps against. POST_FS runs a fixed 64-iteration
   nearest-palette loop, so every entry costs a slot and changes which entry an
   unrelated pixel lands on. test/biome.test.mjs reads this to derive what each
   world must declare. */
const sceneRamps=(id)=>SCENES[id].ramps;

export { SCENES, TRAVELLER_SPEED, WORLD_NAMES, reflectionTouchesWet, sceneRamps };
export class Scene{
  constructor(r,seed,opt,id,lifeSession=null){
    /* the renderer this scene is resident in; it owns the frame */
    this.r=r;
    this.id=id||'frostwood';
    this.spec=SCENES[this.id];
    if(!this.spec) throw new Error(`unknown scene '${this.id}' — see SCENES in scene.js`);
    this.seed=seed; this.opt=opt;
    this.ramps=sceneRamps(this.id);
    this.lifeSession=lifeSession||new LifeSession(seed);
    /* The traveller's tracks, in world coordinates, so a print survives the
       eviction and rebuild of the chunk under it. Bounded. */
    this.prints=[]; this.printGait=0; this.printLast=0;
    this.lastTrafficPatch=null;
    /* airborne ground thrown by footfalls; src/kickup.js owns the physics */
    this.kick=[]; this.kickSeq=0;
    /* The live spell marks and what they throw (src/spell.js). `heading` is
       the last direction he walked, in screen terms: a cast goes that way. */
    this.spells=createSpellState(); this.motes=[];
    this.heading={x:0,y:1}; this.loud=null;
    /* Invariant: moving entities are scene-owned world-coordinate records;
       static props are chunk-owned bake data. */
    this.actors=[];
    this.attention=createAttentionState();

    /* The resident ground, keyed 'cx,cy'. Runtime misses compile in one worker;
       initial/Node builds keep the synchronous path. GPU textures are made
       and owned here on the main thread. */
    this.chunks=new Map();
    this.chunkPending=new Set();this.chunkWorker=null;this.chunkWorkerURL=null;
    /* Cabins and swamp houses are outdoor props, never enterable. doorLock
       guards world portals. */
    this.doorLock=null;
  }

  /* Places the traveller. Runs after generate() and after the renderer has
     resized: it needs both the generator and the frame. */
  populate(W,H,at){
    /* Start at the world's arrival point (worldgen's arrivalPoint owns it),
       unless a portal hands one over. */
    const start=this.gen.arrivalPoint();
    if(at){ this.px=at.x; this.py=at.y; }
    else if(this.opt.poi){
      const p=this.gen.POI.find(q=>q.kind===this.opt.poi);
      if(p){ this.px=p.x; this.py=p.y; }
      else { this.px=start.x; this.py=start.y; }
    }else{ this.px=start.x; this.py=start.y; }
    this.dir=0; this.faceLeft=false; this.gait=0; this.moving=false;
    this.locomotionState='idle';
    /* `mount` holds the camel actor detached from the herd while it is ridden.
       `interactHit` is the one interactable the frame offers, resolved once so
       the draw list and the prompt agree. */
    this.mount=null; this.interactHit=null;
    this.attention=createAttentionState();
    this.lastPX=this.px; this.lastPY=this.py;
    /* Invariant: each portal row owns axis, offset, sign, span and
       destination. World portals only. */
    this.portals=this.gen.portals||[];
    this.camXf=this.px-W/2; this.camYf=this.py-H*0.56;
    this.ensure(true);
    for(let i=0;i<60&&this.blocked(this.px,this.py);i++) this.py+=6;
    /* re-sync after the unblock nudge, or the first frame reads that shove as
       distance travelled and lays a row of prints */
    this.lastPX=this.px; this.lastPY=this.py; this.printGait=this.gait;
    this.camXf=this.px-W/2; this.camYf=this.py-H*0.56;
    /* H*0.56 is not a whole number: snap the lag before the first frame. */
    this.lockCamera();
    this.ensure(true);
    this.actors=this.lifeRuntime?this.lifeRuntime.reconcile(this.px,this.py,W,H):[];
  }

  regrid(W,H){
    this.outW=W; this.outH=H;
    this.grid=[W,H];
    return this.grid;
  }

  /* Invariant: setAtlasSun before rasterizing any sprite. The module-level
     bake light is why only one scene bake context may be resident. */
  generate(){
    setAtlasSun(this.opt.light);
    /* The scene chooses the world's plan. Species, places, ground and exits
       follow from this one field. */
    this.gen=makeWorldGen(this.seed,{...this.opt, biome:this.spec.biome});
    this.lifeRuntime=new LifeRuntime(this.lifeSession,this.gen,this.id,this.opt);
    this.startChunkWorker();

    /* What the traveller has put on (src/gear.js). The world's own laws
       decide what of it is worn; a refused item stays in `gear.refused` with
       its reason. No items: no outfit, and the bake is the plain one. */
    this.gear=this.opt.wear?.length
      ?wear(travellerFor(this.spec.biome),this.opt.wear,
        {biome:this.spec.biome,ramps:this.ramps}):null;
    this.outfit=this.gear?.changed?this.gear.fashion:null;
    /* Bake this world's cast only. */
    this.atlas=buildWorldAtlas(this.seed,this.opt.snow,this.spec.biome,this.outfit);
    this.baked=bakeWorldAtlas(this.atlas);
  }

  startChunkWorker(){
    if(!CHUNK_WORKER_SOURCE||typeof Worker==='undefined')return false;
    try{
      this.chunkWorkerURL=URL.createObjectURL(
        new Blob([CHUNK_WORKER_SOURCE],{type:'text/javascript'}));
      const worker=new Worker(this.chunkWorkerURL);
      this.chunkWorker=worker;
      worker.onmessage=({data})=>{
        if(data.type==='chunk')this.acceptChunk(data.key,data.chunk);
        else if(data.type==='error')this.failChunkWorker(data.error);
      };
      worker.onerror=e=>this.failChunkWorker(e.message||'chunk worker failed');
      worker.postMessage({
        type:'init',seed:this.seed,
        opt:{...this.opt,biome:this.spec.biome},
      });
      return true;
    }catch(error){
      this.failChunkWorker(error);
      return false;
    }
  }

  failChunkWorker(error){
    if(error)console.error('Chunk worker disabled:',String(error));
    if(this.chunkWorker)this.chunkWorker.terminate();
    this.chunkWorker=null;this.chunkPending.clear();
    if(this.chunkWorkerURL)URL.revokeObjectURL(this.chunkWorkerURL);
    this.chunkWorkerURL=null;
  }

  queueChunk(cx,cy){
    if(!this.chunkWorker)return false;
    const key=cx+','+cy;
    if(this.chunks.has(key)||this.chunkPending.has(key))return false;
    this.chunkPending.add(key);
    this.chunkWorker.postMessage({type:'bake',key,cx,cy});
    return true;
  }

  acceptChunk(key,c){
    this.chunkPending.delete(key);
    if(!this.chunkWorker||this.chunks.has(key))return false;
    textureChunk(c);
    this.resolve(c);
    if(this.prints)for(const p of this.prints)
      this.stampPrint(c,p[0],p[1],p[2],this.printFade(p,this.r.time));
    this.chunks.set(key,c);
    return true;
  }

  /* A scene releases its own textures when it stops being resident. */
  dispose(){
    if(this.lifeRuntime)this.lifeRuntime.dispose();
    this.lifeRuntime=null;
    if(this.chunkWorker)this.chunkWorker.terminate();
    this.chunkWorker=null;this.chunkPending.clear();
    if(this.chunkWorkerURL)URL.revokeObjectURL(this.chunkWorkerURL);
    this.chunkWorkerURL=null;
    for(const c of this.chunks.values()) c.tex.dispose();
    this.chunks.clear();
    /* The atlas textures are scene-owned. Each is 1024x512 RGBA: skipping
       this pair leaks 4 MiB per rebuild and portal crossing. */
    if(this.baked){
      this.baked.nrm.dispose();
      this.baked.mat.dispose();
      this.baked=null;
    }
  }

  blocked(wx,wy,except){
    /* The edge of the world holds at any distance, including past baked
       chunks, so the test is here and not in the chunk's solid list. */
    if(this.gen.beyondRim(wx,wy)) return true;
    const travel=this.gen.traversalAt&&this.gen.traversalAt(wx,wy);
    /* a frost plate carries the traveller over water he cannot wade */
    if(!except&&travel&&!travel.walk&&!this.frozenAt(wx,wy)) return true;
    /* Only rows that declare physical breadth enter collision. Small animals
       overlap; a multi-tonne shell cannot be crossed by the traveller or
       another shell. */
    const mounted=this.camelMounted?.();
    const own=except?((ACTOR[except.key]||{}).solidRadius||0)
      :(mounted?ACTOR.camel.solidRadius:2.5);
    const cx=Math.floor(wx/CH), cy=Math.floor(wy/CH);
    /* A body meets a wall with its breadth, and only a declared shell has
       any. An anchor-point test lets a colossus with a twenty-pixel shell put
       its mass through a roof. The traveller on foot keeps the bare point
       test: `own` is his 2.5 px only in the actor pass below, and inflating
       solids by it moves where every world seats its traveller. */
    const reach=except||mounted?own:0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const c=this.chunks.get((cx+i)+','+(cy+j)); if(!c) continue;
      for(const s of c.solids){
        /* A building is a parallelogram. Measured failure: with a row of
           discs across the front as the collider and `dy` scaled by
           GROUND_SQUASH, a 4.5 px disc blocks 2.4 rows. A meadow house draws
           34 rows deep, so 31 are walk-through.

           docs/CANON.md: a building carries its depth axis up and to the
           right, so its ground figure is sheared `shear` columns over `back`
           rows. This tests that figure exactly. */
        if(s.hx!==undefined){
          const t=s.y-wy;                       // rows up-screen from the front
          const ry=reach/GROUND_SQUASH;
          if(t<-(s.front+ry)||t>s.back+ry) continue;
          const u=s.back>0?clamp(t,0,s.back)/s.back:0;
          /* the threshold: a doorway you can stand in, on the front edge only */
          if(s.doorHW&&t<=s.front&&Math.abs(wx-(s.x+s.doorDX))<s.doorHW) continue;
          if(Math.abs(wx-(s.x+(s.shear||0)*u))<=s.hx+reach) return true;
          continue;
        }
        const dx=s.x-wx, dy=(s.y-wy)*GROUND_SQUASH;   // a ground circle is an ellipse
        const rr=s.r+reach;
        if(dx*dx+dy*dy<rr*rr) return true;
      }
    }
    for(const e of this.actors||[]){
      if(e===except) continue;
      const r=(ACTOR[e.key]||{}).solidRadius;
      if(!r) continue;
      const dx=e.x-wx,dy=(e.y-wy)*GROUND_SQUASH,rr=r+own;
      if(dx*dx+dy*dy<rr*rr) return true;
    }
    return false;
  }

  /* Invariant: transitions are directed edge crossings, not region tests. The
     previous coordinate plus axis/sign prevents immediate bounce; doorLock is
     a guard. sign<0 means decreasing across the threshold, sign>0 increasing.
     Keep the asymmetric boundary comparisons and test both portal senses. */
  crossed(prev,now,thr,sign){
    return sign<0 ? (prev>=thr && now<thr) : (prev<thr && now>=thr);
  }
  /* World portals switch scenes via the renderer. */
  cross(d){
    return this.r.gotoScene(d.to,{from:this.id,returnId:d.returnId||this.id});
  }

  releaseLock(){
    const L=this.doorLock; if(!L) return;
    const p=L.axis==='y'?this.py:this.px;
    if(L.sign>0 ? p>L.val : p<L.val) this.doorLock=null;
  }

  landOutside(x,y,lock){
    this.px=x; this.py=y;
    this.dir=0; this.faceLeft=false; this.moving=false; this.gait=0;
    this.locomotionState='idle';
    this.camXf=this.px-this.r.W/2; this.camYf=this.py-this.r.H*0.56;
    this.ensure(true);
    for(let k=0;k<20&&this.blocked(this.px,this.py);k++) this.py+=2;
    this.lastPX=this.px; this.lastPY=this.py; this.printGait=this.gait;
    this.camXf=this.px-this.r.W/2; this.camYf=this.py-this.r.H*0.56;
    this.lockCamera();
    this.doorLock=lock;
  }
  /* Called by the renderer once the target scene is generated and its sheet
     bound. He lands clear of the ring by more than its depth (15 px across,
     half that deep under the k = 1/2 projection). The lock holds until he is
     clear of it. */
  arriveAtPortal(source){
    const portals=this.gen.portals||[];
    const p=source
      ? portals.find(q=>q.id===source.returnId||q.to===source.from)
      : portals[0];
    if(!p) return null;
    const side=p.sign<0?1:-1;
    const at={x:p.x,y:p.y};
    at[p.axis]+=side*20;
    return {at,lock:{axis:p.axis,val:p[p.axis]+side*14,sign:side}};
  }
  /* `locomotionState` feeds the clip bank, prints, disturbance and the life
     layer. */
  advanceTravellerLocomotion(dx,dy,dt,wantsRun=false){
    const distance=Math.hypot(dx,dy);
    this.moving=distance>1e-4;
    if(!this.moving){
      this.locomotionState='idle';
      return 0;
    }
    const speed=distance/Math.max(dt,1e-6);
    const travelSpeed=this.travellerSpeed();
    const wasRun=this.locomotionState==='run';
    const runThreshold=wasRun?travelSpeed.walk*1.10:travelSpeed.run*0.62;
    this.locomotionState=wantsRun&&speed>=runThreshold?'run':'walk';
    /* distance owns the walk phase (docs/LIFE.md): the gait counter advances
       by post-collision ground covered, in frame units */
    if(this.camelMounted?.()){
      const F=ACTOR.camel;
      const fast=this.locomotionState==='run';
      this.gait+=distance*(fast?F.runGait:F.gait)/(fast?F.runSpeed:F.speed);
    }else{
      const row=CAST_BY_KEY[this.travellerKey()]||CAST.traveller;
      this.gait+=gaitFrames(distance,heightPx(row),this.locomotionState);
    }
    return distance;
  }

  /* ── the traveller ─────────────────────────────────────────────────────── */
  setAttention(target){
    this.attention=setAttentionTarget(this.attention,target);
    return this.attention;
  }
  /* The traveller notices the actors fauna.js marks `poi`. The nearest inside
     ATTEND_R takes the head and keeps it until it passes ATTEND_DROP
     (hysteresis). The target's coordinates refresh in place: setAttentionTarget
     resets the look dwell, so it is called only when the subject changes. */
  attendToWorld(){
    const ATTEND_R=80, ATTEND_DROP=104;
    let best=null,bestD=1e9;
    if(this.actors)for(const e of this.actors){
      const F=ACTOR[e.key];
      if(!F||!F.poi)continue;
      const d=Math.hypot(e.x-this.px,(e.y-this.py)/0.66);
      if(d<bestD){bestD=d;best=e;}
    }
    const cur=this.attention&&this.attention.target;
    const curIsPoi=cur&&cur.kind==='poi';
    const keep=curIsPoi&&best&&(best.id??best.key)===this.attendPoiId;
    if(best&&bestD<=(keep?ATTEND_DROP:ATTEND_R)){
      if(keep){ cur.x=best.x; cur.y=best.y; }
      else{
        this.attendPoiId=best.id??best.key;
        this.setAttention({x:best.x,y:best.y,z:0,kind:'poi'});
      }
    }else if(curIsPoi){
      this.attendPoiId=null;
      this.setAttention(null);
    }
  }
  updateTravellerAttention(dt){
    this.attendToWorld();
    this.attention=updateAttention(this.attention,{
      x:this.px,y:this.py,dir:this.dir,flip:this.faceLeft,moving:this.moving,
      views:5,
    },dt);
  }
  step(dt,input){
    /* One press, resolved before the move, so the frame he mounts on already
       walks at the camel's speed and with the camel's breadth. */
    if(input.interact) this.interact();
    if(input.cast) this.cast(input.cast);
    const travel=this.gen.traversalAt?this.gen.traversalAt(this.px,this.py):{speed:1,medium:'dry'};
    /* Shallow flooded floor matches dry hummock speed; deep water stays blocked
       upstream in traversalAt. Ice over it walks like firm ground. */
    const speed=this.travellerSpeed();
    const onIce=travel.walk===false&&this.frozenAt(this.px,this.py);
    const SP=(input.run?speed.run:speed.walk)*(onIce?1:(travel.speed||0));
    let vx=(input.right?1:0)-(input.left?1:0);
    let vy=(input.down?1:0)-(input.up?1:0);
    const l=Math.hypot(vx,vy);
    if(l>0){ vx/=l; vy/=l; }
    /* both previous coordinates: a crossing may run along either axis */
    const oy=this.py, ox=this.px;
    if(l>0){
      /* Eight-way input resolves through the function a villager's heading
         uses, so traveller and cast agree on the view. Views 2 to 4 mirror
         through faceLeft. */
      const v=figureViewFromHeading(vx,vy,this.faceLeft);
      this.dir=v.dir; this.faceLeft=v.flip;
      this.heading.x=vx; this.heading.y=vy;
      /* axes resolved separately, so a shoulder against a trunk slides */
      const nx=this.px+vx*SP*dt;
      if(!this.blocked(nx,this.py)) this.px=nx;
      const ny=this.py+vy*SP*dt;
      if(!this.blocked(this.px,ny)) this.py=ny;
    }
    this.advanceTravellerLocomotion(this.px-ox,this.py-oy,dt,input.run);
    this.updateTravellerAttention(dt);
    /* World-portal crossings only. */
    if(this.doorLock) this.releaseLock();
    else{
      for(const d of this.portals){
        const along = d.axis==='y' ? [oy,this.py,d.y] : [ox,this.px,d.x];
        const lat   = d.axis==='y' ? Math.abs(this.px-d.x) : Math.abs(this.py-d.y);
        if(lat<=d.span && this.crossed(along[0],along[1],along[2]+d.off,d.sign)){
          this.cross(d); return;
        }
      }
    }
    this.dropPrints();
    this.stepLife(dt);
    /* After the herd has moved, so the outline and the prompt name the same
       animal the draw list is about to paint. */
    this.interactHit=this.interactTarget();
    stepKick(this.kick,dt,this.wind||0);
    this.stepSpells(dt);
    const tx=this.px-this.r.W/2, ty=this.py-this.r.H*0.56;
    const k=Math.min(1,dt*10);
    this.camXf+=(tx-this.camXf)*k; this.camYf+=(ty-this.camYf)*k;
    this.lockCamera();
  }

  /* The camera holds an integer distance from the traveller. Measured
     failure: render.js rounds the camera once and draws every sprite at
     `round(worldX) - round(camXf)`. For the traveller both operands move every
     frame, and the error flips as either crosses a half pixel. At a walk the
     follow lags about 2.3 px, so his screen column alternates between two
     integers.

     Invariant: an integer lag makes round(camXf) = round(px) - lag exactly.
     The smooth follow runs first, then snaps to a whole-pixel offset from the
     traveller. */
  lockCamera(){
    this.camXf=this.px-Math.round(this.px-this.camXf);
    this.camYf=this.py-Math.round(this.py-this.camYf);
  }

  stepLife(dt){
    if(!this.lifeRuntime)return;
    this.actors=this.lifeRuntime.step(dt,{
      px:this.px,py:this.py,W:this.r.W,H:this.r.H,
      travellerMoving:this.moving,blocked:(x,y,e)=>this.blocked(x,y,e),
      mark:(x,y,kind,locomotion)=>this.mark(x,y,kind,locomotion),prints:this.prints,
      renderTime:this.r.time,wind:{x:this.r.wind||0,y:0},
      /* a cast is heard for a moment, louder than a footfall */
      castNoise:this.loud&&this.r.time<this.loud.until?this.loud.level:0,
    });
    if(this.prints.length>1400)this.prints.splice(0,this.prints.length-1400);
  }

  /* The first wet row is a painter-partition input: it decides which sprites
     stand beyond the far shore. Reflection has its own caster target. */
  computeShore(camX,camY){
    const W=this.r.W,H=this.r.H;
    const cy0=Math.floor((camY-CH*1.5)/CH), cy1=Math.floor((camY+H)/CH);
    for(let sx=0;sx<W;sx++){
      const wx=sx+camX, cx=Math.floor(wx/CH), lx=wx-cx*CH;
      let best=-100000;
      for(let cy=cy0;cy<=cy1;cy++){
        const c=this.chunks.get(cx+','+cy); if(!c) continue;
        const v=c.colWater[lx];
        if(v!==255){ best=cy*CH+v; break; }
      }
      this.r.shoreCol[sx]=best;
    }
  }

  /* the ramp a baked figure declared for itself, by kind */
  spriteRamp(kind,field,fallback){
    const row=CAST_BY_KEY[kind];
    return row&&row[field]!==undefined?row[field]:fallback;
  }
  camelMounted(){ return !!this.mount; }

  /* Reach. Screen rows are foreshortened by half (PROJECTION.md), so the row
     difference is scaled back up before the circle test, as in blocked(). */
  interactReach(){ return ACTOR.camel.solidRadius+metresToPx(MOUNT_ARM_M); }

  interactTarget(){
    if(this.camelMounted()||!this.actors) return null;
    const reach=this.interactReach();
    let best=null,bd=reach*reach;
    for(const e of this.actors){
      if(e.key!=='camel') continue;
      const dx=e.x-this.px, dy=(e.y-this.py)*GROUND_SQUASH;
      const d=dx*dx+dy*dy;
      if(d<=bd){ bd=d; best=e; }
    }
    return best;
  }

  /* The verb the prompt shows. Null means there is nothing to press. */
  promptLabel(){
    if(this.camelMounted()) return 'dismount';
    return this.interactHit?'ride':null;
  }

  interact(){
    if(this.camelMounted()) return this.dismount();
    const target=this.interactHit||this.interactTarget();
    return target?this.mountCamel(target):false;
  }

  /* The animal leaves the herd while it is ridden. It is held, not copied, so
     its heading, gait phase and life record return at dismount. */
  mountCamel(actor){
    const held=this.lifeRuntime&&this.lifeRuntime.detach(actor.id);
    if(!held) return false;
    this.mount=held;
    this.actors=this.lifeRuntime.actorList();
    this.interactHit=null;
    /* Seat him where the animal stood, unless a mounted body does not fit:
       breadth goes from 2.5 px to the camel's 15, and a seat inside a solid
       cannot be walked out of. */
    if(!this.blocked(held.x,held.y)){ this.px=held.x; this.py=held.y; }
    const v=figureViewFromHeading(held.hx,held.hy,this.faceLeft);
    this.dir=v.dir; this.faceLeft=v.flip;
    this.lastPX=this.px; this.lastPY=this.py;
    return true;
  }

  /* He steps down beside the animal; the camel stays where the pair stood.
     Flanks are tried in order, so a wall on one side does not hold him. */
  dismount(){
    const held=this.mount;
    if(!held) return false;
    const cx=this.px, cy=this.py;
    const gap=this.interactReach();
    this.mount=null;
    const rows=gap/GROUND_SQUASH;
    for(const [dx,dy] of [[-gap,0],[gap,0],[0,rows],[0,-rows]]){
      if(!this.blocked(cx+dx,cy+dy)){ this.px=cx+dx; this.py=cy+dy; break; }
    }
    this.lastPX=this.px; this.lastPY=this.py;
    this.lifeRuntime.attach(held,cx,cy);
    this.actors=this.lifeRuntime.actorList();
    this.interactHit=held;
    return true;
  }
  travellerSpeed(){
    return this.camelMounted()
      ? {walk:ACTOR.camel.speed,run:ACTOR.camel.runSpeed}
      : TRAVELLER_SPEED;
  }
  mountedState(){
    return this.moving?(this.locomotionState==='run'?'pace':'walk'):'idle';
  }
  mountedDir(dir){ return dir===0?0:dir===1?1:2; }
  mountedRiderClipKey(dir,look='neutral'){
    const F=ACTOR.camel,state=this.mountedState(),n=F.states[state]||1;
    const phase=this.moving?this.gait:this.r.time*(F.idleRate||1.15);
    const bank=stateKey(F.riderKey,state)
      +(look!=='neutral'&&state!=='pace'?'~'+look:'');
    return bank+':'+dir+':'+(Math.floor(phase)%n);
  }
  /* A figure is mirrored in profile and in both diagonals. The two axial
     views have their own left and right, and faceLeft persists after he
     turns to face the camera. */
  figureFlip(dir,flip){ return dir>=2&&!!flip; }
  travellerKey(){
    /* Each world dresses him for its weather. The mapping lives in people.js
       because the atlas and the life session need the same answer. */
    return travellerKeyFor(this.gen?.biome);
  }
  /* The ramp of the traveller's coat. A spell's own light is drawn on it. */
  coatRamp(){
    const row=CAST_BY_KEY[this.travellerKey()];
    return this.outfit?.ramp??(row?row.ramp:'warm');
  }
  walkRamp(){
    const row=CAST_BY_KEY[this.travellerKey()];
    const ramp=this.coatRamp();
    return {id:RAMP_ID[ramp],ramp2:row&&row.ramp2?RAMP_ID[row.ramp2]:0,
            sMin:row?row.sMin:0.05,sMax:row?row.sMax:1.00};
  }
  /* Locomotion owns the body view. Attention selects a baked head variant for
     idle and walk, so the head and eyes turn without changing body facing. */
  travellerAppearance(){
    const a=this.attention&&this.attention.appearance;
    return a
      ? {dir:a.dir,flip:a.flip,look:a.look||'neutral'}
      : {dir:this.dir,flip:this.faceLeft,look:'neutral'};
  }
  clipKey(key,dir,moving,look='neutral'){
    const states=castStates();
    const state=moving?(this.locomotionState==='run'?'run':'walk'):'idle';
    const n=states[state]||1;
    /* walk and run phase is the distance-owned gait counter; the idle breath
       is the one clock-owned phase a standing body is allowed */
    const phase=moving?this.gait:this.r.time*1.15;
    const bank=stateKey(key,state)+(look!=='neutral'&&state!=='run'?'~'+look:'');
    return bank+':'+dir+':'+(Math.floor(phase)%n);
  }
  actorClipKey(F,dir,moving,gait,stateOverride,phaseOverride,look='neutral'){
    const states=F.states||(F.figure?castStates():null);
    let state=stateOverride||(moving?(F.moveState||'walk'):(F.restState||'idle'));
    if(!states||!states[state])
      state=states&&(moving&&states.walk?'walk':states.idle?'idle':
        states.float?'float':states.still?'still':
        states.swim?'swim':states.wade?'wade':states.walk?'walk':Object.keys(states)[0]);
    const n=states&&states[state];
    /* Real animals have no idle bank and retain their authored frame zero.
       Machines carry their own state counts. */
    if(!n) return F.key+':'+dir+':'+(moving?(Math.floor(gait)%4):0);
    const phase=phaseOverride===undefined
      ? (moving?gait:this.r.time*(F.idleRate||1.15))
      : phaseOverride;
    /* only figures bake look banks, and only for idle and walk */
    const bank=stateKey(F.key,state)
      +(F.figure&&look!=='neutral'&&(state==='idle'||state==='walk')?'~'+look:'');
    return bank+':'+dir+':'+(Math.floor(phase)%n);
  }
  /* Integral of the wind control, in seconds. A slider change alters angular
     velocity without teleporting every machine to a new phase. It is a
     function of the renderer's pinned clock, so a capture does not depend on
     the live frames before it. */
  rotorWindSeconds(now,wind){
    wind=Math.max(0,wind===undefined?1:wind);
    let C=this.rotorClock;
    if(!C){ C=this.rotorClock={at:0,area:0,wind}; }
    else if(wind!==C.wind){
      C.area+=C.wind*(now-C.at); C.at=now; C.wind=wind;
    }
    return C.area+C.wind*(now-C.at);
  }

  visible(camX,camY){
    const W=this.r.W,H=this.r.H;
    const behind=[],front=[],contact=[],highlight=[];
    const contactFor=(w)=>this.baked.rects['contact:'+contactRung(w)];

    /* Cull margins follow how far a shadow reaches. With constant margins,
       29% of the in-frame shadow at elevation 12 is culled with its caster. */
    const L=this.r.shadowMat.uniforms.uLight.value;
    const reach=140*this.r.shadowMat.uniforms.uLen.value/Math.max(0.30,L.z);
    const mx=70+reach*Math.abs(L.x), my=190+reach*Math.abs(L.y)*0.55;

    /* the tallest baked sprite is a property of the atlas: memoized against
       the baked generation */
    if(this._tallestOf!==this.baked){
      let t=0;
      for(const k in this.baked.rects){ const q=this.baked.rects[k]; if(q.h>t) t=q.h; }
      this._tallestOf=this.baked; this._tallest=t;
    }
    const mb=this._tallest+24;

    /* the same four numbers the ground gets */
    const A4=this.spec.aer();
    const A={tL:A4[0], comp:A4[1], desat:A4[2], fog:A4[3]};
    const windSeconds=this.rotorWindSeconds(this.r.time,this.wind);
    /* A plant asks the live marks about its own position (src/spell.js). */
    const marked=!!this.spells&&this.spells.marks.length>0;
    const snowy=marked&&this.spec.precipitation.kind==='snow';
    /* A fixed landmark is copied into neighbouring chunks so it stays resident
       while its tall sprite or long shadow reaches into the frame. Collapse
       exact world identities across the loaded chunk set before filling the
       instance and shadow batches. */
    const seenProps=new Set();
    for(const c of this.chunks.values()){
      if(c.ox>camX+W+60||c.ox+CH<camX-60||c.oy>camY+H+mb||c.oy+CH<camY-200) continue;
      for(const p of c.props){
        if(!p.r) continue;
        let rr=p.spinRects
          ? p.spinRects[rotorFrame(ROTORS[p.rotor],windSeconds,p.spinPhase)]||p.r
          : p.rockRects
          ? p.rockRects[rockerFrameAt(this.r.time,p.rockPhase)]||p.r
          : p.r;
        /* A plant asks the marks once. A crown that shed or burnt draws its
           bare twin: the snow is gone and the wood keeps its colour. */
        let bend=0,burnt=false;
        if(marked&&SWAYS.has(p.kind)){
          const fx=propFx(this.spells,this.r.time,p.x,p.y,rr.w*0.5,snowy,p.kind);
          bend=fx.bend; burnt=fx.char;
          if((fx.bare||burnt)&&snowy&&p.bareR) rr=p.bareR;
        }
        const x=Math.round(p.x)-camX, y=Math.round(p.y)-camY;
        if(x<-mx||x>W+mx||y<-my||y>H+mb) continue;
        const identity=p.kind+':'+p.tier+':'+p.x+':'+p.y;
        if(seenProps.has(identity)) continue;
        seenProps.add(identity);
        const sc=this.r.shoreCol[clamp(x,0,W-1)];
        const isBehind=sc>-99999 && p.y<sc;
        /* dissolve over the last stretch of the cull margin, so nothing snaps
           out of the picture */
        const fade=Math.min(1, Math.min(
          (H+mb-y)/26, (y+my)/26, (x+mx)/26, (W+mx-x)/26));
        /* `lift` is drawn rows from the ground to this sprite's own foot (a
           rotor on a roof, a wheel on a tower head). Undefined for everything
           that stands on the ground. */
        const entry={x,y,r:rr,flip:p.flipR,rampId:p.rampId,ramp2:p.ramp2,dMin:p.dMin,dMax:p.dMax,vol:p.vol,fade,
          sMin:p.sMin,sMax:p.sMax,tL:A.tL,comp:A.comp,desat:A.desat,fog:A.fog,
          phase:p.phase, lift:p.lift, short:rr.h<20};
        entry.bend=bend;
        if(burnt){
          /* burnt: wood and whatever it carried on the dark end of `trunk` */
          entry.rampId=entry.ramp2=RAMP_ID[CHAR.ramp];
          entry.sMin=CHAR.sMin; entry.sMax=CHAR.sMax;
          entry.dMin=0; entry.dMax=CHAR.dMax; entry.vol=0;
        }
        (isBehind?behind:front).push(entry);
        /* Undergrowth is under the projection floor (uMinH, W_SHADOW_VS), so a
           short prop gets a contact ellipse. Only a prop touching the ground
           gets one: the windpump is ten stacked bay sprites 15 rows tall, and
           only the ground bay lays an ellipse. */
        const cr=rr.h+(p.lift||0)<20&&!p.glow?contactFor(rr.w):null;
        if(cr)
          contact.push({x,y,r:cr,flip:false,rampId:0,sMin:0,sMax:1,
            tL:A.tL,comp:0,desat:0,fog:0,phase:RIGID});
        /* The shadow of a box is its footprint swept along the sun. The
           projected pass shears the sprite from its bottom row, so it sweeps
           only the building's front edge. A cabinet base is a parallelogram
           `back` rows deep. Measured on a meadow house: seventeen rows of lit
           grass between the back corner and the cast.

           A building covers its own footprint P, so P is drawn swept: flat
           copies stepped along the sun from P to P+off. */
        const fr=p.foot&&this.baked.rects['foot:'+p.foot];
        const lr=p.legFoot&&this.baked.rects['foot:'+p.legFoot];
        if(fr||lr){
          const k=this.r.shadowMat.uniforms.uLen.value/Math.max(0.30,L.z);
          const sweep=(r,sx,sy,h0,h1)=>{
            h0=clamp(h0,0,rr.h);h1=clamp(h1,h0,rr.h);
            const ox0=-L.x*h0*k,oy0=-L.y*h0*k*0.55;
            const ox1=-L.x*h1*k,oy1=-L.y*h1*k*0.55;
            /* Stepped along the sweep so the count follows its measured length.
               The four-pixel step stays under the dithered penumbra width. */
            const n=clamp(Math.ceil(Math.hypot(ox1-ox0,oy1-oy0)/4),1,20);
            for(let s=0;s<=n;s++)contact.push({
              x:Math.round(sx+ox0+(ox1-ox0)*s/n),
              y:Math.round(sy+oy0+(oy1-oy0)*s/n),r,
              flip:false,rampId:0,sMin:0,sMax:1,
              tL:A.tL,comp:0,desat:0,fog:0,phase:RIGID});
          };
          /* An elevated body starts at its floor. Each primary pile owns a
             smaller ground-to-floor sweep, while open braces remain no-cast. */
          const floor=clamp(p.footLift||0,0,rr.h);
          if(fr)sweep(fr,x,y,floor,rr.h);
          if(lr&&p.shadowFeet)for(const q of p.shadowFeet)
            sweep(lr,x+q.dx,y+q.dy,0,floor);
        }
      }
    }
    /* the animals share the sorted list with the trees and the traveller */
    for(const e of this.actors){
      const F=ACTOR[e.key];
      /* The heading picks the view: the faster axis decides, and only the
         profile is mirrored. e.flip is untouched when the heading is near
         vertical, so the profile it returns to is the one it left. */
      let fd,fflip=e.flip,flook='neutral';
      if(F.figure){
        const v=figureViewFromHeading(e.hx,e.hy,e.flip);
        fd=v.dir;fflip=v.flip;
        /* movement keeps the body view while aim picks the baked head variant */
        if(e.attention?.appearance){
          const a=e.attention.appearance;
          fd=a.dir;fflip=a.flip;flook=a.look||'neutral';
        }
      }else fd=viewFromHeading(e.hx,e.hy);
      /* a resting animal holds frame 0 */
      const er=this.baked.rects[this.actorClipKey(F,fd,e.moving,e.gait,
                e.motionState,e.motionState==='prepare'?e.preparePhase:
                  e.motionState==='greet'?e.greetPhase:undefined,flook)]
              ||this.baked.rects[F.key+':'+fd+':0'];
      if(!er) continue;
      const x=Math.round(e.x)-camX, y=Math.round(e.y)-camY;
      /* A raised surface moves the paint, not the depth: aerial perspective,
         the shore test and the sort use where he is. The generator is asked,
         so landmarks stay out of the draw list. Zero on flat ground. */
      const standLift=this.gen.standLift?this.gen.standLift(e.x,e.y):0;
      const sink=F.figure?this.materialSinkAt(e.x,e.y):0;
      const lift=standLift-sink;
      /* culled on the row he is painted on */
      if(x<-40||x>W+40||y-lift<-40||y>H+40) continue;
      const sc=this.r.shoreCol[clamp(x,0,W-1)];
      /* The shadow falls from the ground he is over: the shadow pass takes
         the same `lift`, roots the cast on the ground and shears by the whole
         height above it. */
      const entry={x,y:y-lift,sortY:y,lift,r:er,
        flip:this.figureFlip(fd,fflip),
        /* The sprite's own ramp wins over ACTOR's row: otherwise the elder's
           sMax 0.80 draws at ACTOR's 0.66. A per-instance override (the
           merchant's three coats) wins over both. */
        rampId:RAMP_ID[e.ramp||this.spriteRamp(F.key,'ramp')||F.ramp],
        sMin:e.sMin!==undefined?e.sMin:this.spriteRamp(F.key,'sMin',F.sMin),
        sMax:e.sMax!==undefined?e.sMax:this.spriteRamp(F.key,'sMax',F.sMax),
        ramp2:F.ramp2===undefined?0:RAMP_ID[F.ramp2],
        dMin:F.dMin,dMax:F.dMax,vol:F.vol,
        tL:A.tL,comp:A.comp,desat:A.desat,fog:A.fog,phase:RIGID};
      ((sc>-99999&&e.y<sc)?behind:front).push(entry);
      /* The outline is traced from the sprite's own coverage, so the mask takes
         the instance the world pass draws. */
      if(e===this.interactHit) highlight.push(entry);
      /* A figure 20 rows or taller casts a projected shadow (uMinH) and takes
         no contact blob. An actor under the floor takes one, by the prop
         branch's test and rungs. Without it seven bodies cast nothing: fennec
         7, sandgrouse 6, viper 5, turtle 6, squirrel 6, boar 11, heron 19. */
      const ah=er.h+lift;
      if(ah<20){
        const ac=contactFor(er.w);
        if(ac) contact.push({x,y,r:ac,flip:false,rampId:0,sMin:0,sMax:1,
          tL:A.tL,comp:0,desat:0,fog:0,phase:RIGID});
      }
    }
    /* The Amber Waste traveller and camel are two palette instances on one
       ground anchor. Stable sort keeps the rider over the animal. */
    const app=this.travellerAppearance();
    const x=Math.round(this.px)-camX, y=Math.round(this.py)-camY;
    const standLift=this.gen?.standLift?this.gen.standLift(this.px,this.py):0;
    if(this.camelMounted()){
      const F=ACTOR.camel,dir=this.mountedDir(app.dir),state=this.mountedState();
      const flip=this.figureFlip(dir,app.flip);
      const camelKey=this.actorClipKey(F,dir,this.moving,this.gait,state);
      const camelRect=this.baked.rects[camelKey]
        ||this.baked.rects[stateKey(F.key,state)+':'+dir+':0'];
      const riderKey=this.mountedRiderClipKey(dir,app.look);
      const riderRect=this.baked.rects[riderKey]
        ||this.baked.rects[this.mountedRiderClipKey(dir,'neutral')];
      if(camelRect)front.push({x,y:y-standLift,sortY:y,lift:standLift,r:camelRect,
        flip,rampId:RAMP_ID[F.ramp],ramp2:RAMP_ID[F.ramp2],
        sMin:F.sMin,sMax:F.sMax,tL:A.tL,comp:A.comp,
        desat:A.desat,fog:A.fog,phase:RIGID});
      if(riderRect){
        const pw=this.walkRamp();
        /* The rider's sprite is anchored on the camel's ground row and
           cropped, so its bottom row is his boots, twenty rows up.
           `cropSprite` keeps the anchor, so an anchor below the last drawn
           row is the air under the caster: W_SHADOW_VS takes it as lift. */
        const air=Math.max(0,riderRect.ay-(riderRect.h-1));
        front.push({x,y:y-standLift,sortY:y,lift:standLift+air,r:riderRect,
          flip,rampId:pw.id,ramp2:pw.ramp2,sMin:pw.sMin,sMax:pw.sMax,
          tL:A.tL,comp:A.comp,desat:A.desat,fog:A.fog,phase:RIGID});
      }
    }else{
      const tk=this.travellerKey();
      const key=this.clipKey(tk,app.dir,this.moving,app.look);
      const r=this.baked.rects[key]||this.baked.rects[tk+':'+app.dir+':0'];
      if(r){
        const pw=this.walkRamp();
        /* Reflection geometry receives the painted row and lift separately. */
        const lift=standLift-this.materialSinkAt(this.px,this.py);
        front.push({x,y:y-lift,sortY:y,lift,r,
          flip:this.figureFlip(app.dir,app.flip),rampId:pw.id,
          ramp2:pw.ramp2,sMin:pw.sMin,sMax:pw.sMax,tL:A.tL,comp:A.comp,
          desat:A.desat,fog:A.fog,phase:RIGID});
      }
    }
    /* Kicked grains: thrown by every footfall through mark(), integrated in
       step(), drawn as ordinary sprites so the sort, the aerial treatment and
       the palette apply. A particle stands on the ground row it will land on
       and is painted its height above it. Both contrast pixels remain until
       contact. */
    for(const pool of [this.kick,this.motes])if(pool)for(const p of pool){
      if(p.wait>0) continue;
      const gr=this.baked.rects[(p.frost?'frost:':p.glow?'spark:':'grain:')+p.size];
      if(!gr) break;
      const x=Math.round(p.x)-camX, y=Math.round(p.y)-camY;
      const paintedY=y-Math.round(p.z);
      if(x<-4||x>W+4||paintedY<-4||paintedY>H+4) continue;
      front.push({x,y:paintedY,sortY:y,r:gr,flip:false,
        rampId:RAMP_ID[p.ramp]||0,sMin:p.sMin,sMax:p.sMax,
        reflect:false,tL:A.tL,comp:A.comp,desat:A.desat,fog:A.fog,phase:RIGID});
    }
    /* What the live marks draw this frame, derived from the marks and the
       clock: flame tongues, embers and a squall's fall (src/spell.js). */
    if(marked){
      const coat=this.coatRamp(),now=this.r.time;
      const dot=(q,r,rampName,sMin,sMax)=>{
        const x=Math.round(q.x)-camX,y=Math.round(q.y)-camY;
        const paintedY=y-Math.round(q.z);
        if(!r||x<-8||x>W+8||paintedY<-8||paintedY>H+16) return;
        front.push({x,y:paintedY,sortY:y,r,flip:false,rampId:RAMP_ID[rampName],
          sMin,sMax,reflect:false,tL:A.tL,comp:A.comp,desat:A.desat,fog:A.fog,
          phase:RIGID});
      };
      for(const t of flameTongues(this.spells,now,this.spellWorld()))
        dot(t,this.baked.rects['flame:'+t.size+':'+(t.lean+1)],
          t.core?'folkSignal':coat,t.core?0:0.66,1);
      const glint={z:0};
      for(const q of emberGlints(this.spells,now,this.spellWorld())){
        glint.x=q.x; glint.y=q.y;
        dot(glint,this.baked.rects['spark:1'],'folkSignal',0,1);
      }
      /* falling water is world material, so it takes the aerial treatment;
         graupel is the plate's ice */
      for(const q of squallFall(this.spells,now,this.spellWorld()))
        dot(q,this.baked.rects[(q.ice?'frost:':'grain:')+q.size],q.ramp,q.sMin,q.sMax);
    }
    /* Sort by where a thing stands, not where it is painted: a figure on a
       balcony is painted a storey up and sorts in front of the house whose
       deck he stands on. */
    const depth=e=>e.sortY===undefined?e.y:e.sortY;
    behind.sort((a,b)=>depth(a)-depth(b));
    front.sort((a,b)=>depth(a)-depth(b));
    /* The caster list is independent of near/far painter order. Tiny marks do
       not form a readable reflected silhouette and stay out by medium law. */
    const reflection=behind.concat(front).filter(e=>
      e.r.h>=8&&
      reflectionTouchesWet(e,camX,camY,W,H,this.chunks));
    return {behind,front,contact,reflection,highlight};
  }

  /* Invariant: place-specific renderer behaviour is centralized in camera,
     tick, uniforms, draw, fill, blit and shadows. A new place implements
     these boundaries. */

  camera(){ return [this.camXf,this.camYf]; }

  tick(now,dt){
    this.tickPrints(now,dt);
  }

  /* Light and weather uniforms, written every frame, because one sprite
     material draws every world. */
  uniforms(ui){
    const r=this.r, sp=r.spriteMat.uniforms, rp=r.reflectionMat.uniforms;
    this.wind=this.spec.still?0:ui.wind;
    sp.uWind.value=this.wind;
    rp.uWind.value=this.wind;
    this.r.shadowMat.uniforms.uWind.value=this.wind;
    if(this.sun){ sp.uLight.value.copy(this.sun); rp.uLight.value.copy(this.sun); }
    const p=ui.precipitation?this.spec.precipitation:CLEAR_PRECIPITATION;
    const snow=p.kind==='snow'?p.intensity:0;
    const rain=p.kind==='rain'?p.intensity:0;
    /* Sand is gated twice. This gate says the world has blown sand available.
       Whether any moves comes from the wind, through a threshold friction
       velocity, in the shader: below about 8 m/s the bed does not move. */
    const sand=p.kind==='sand'?p.intensity:0;
    r.post.mat.uniforms.uFlakes.value=snow;
    r.post.mat.uniforms.uRain.value=rain;
    r.post.mat.uniforms.uSand.value=sand;
    r.post.mat.uniforms.uRainRamp.value=p.ramp===null?0:RAMP_ID[p.ramp];
    r.ground.mat.uniforms.uRain.value=rain;
    /* The live marks: the ground and water passes share r.markA and r.markB. */
    r.ground.mat.uniforms.uMarkN.value=r.water.mat.uniforms.uMarkN.value=
      markUniforms(this.spells,r.time,r.markA,r.markB);
    r.water.mat.uniforms.uIce.value=r.spriteMat.uniforms.uIce.value=
      r.reflectionMat.uniforms.uIce.value=this.spec.ice?RAMP_ID[this.spec.ice]:-1;
    /* The worm is the world's, not the weather's. Its route is a function of
       the world seed and the clock: nothing stored, nothing stepped. */
    r.ground.mat.uniforms.uWorm.value=this.spec.worm?1:0;
    r.ground.mat.uniforms.uWormSeed.value=this.spec.worm
      ?((this.seed>>>7)%9973)/9973:0;
    r.water.mat.uniforms.uRain.value=rain;
    sp.uRain.value=rain;
    /* Reflections mirror caster radiance, not weather painted on that caster. */
    rp.uRain.value=0;
    /* the scene's aerial and reflection figures, written every frame for the
       same reason */
    const a=this.spec.aer(), k=this.spec.reflection();
    r.ground.mat.uniforms.uAer.value.set(a[0],a[1],a[2],a[3]);
    r.water.mat.uniforms.uReflect.value.set(k[0],k[1]);
    /* the sprite pass takes the same chroma figure */
    sp.uDesat.value=a[2];
    rp.uDesat.value=sp.uDesat.value;
  }

  /* The shore is an input to the draw list: visible() reads shoreCol to
     decide what stands beyond the far bank. */
  draw(camX,camY){
    this.computeShore(camX,camY);
    return this.visible(camX,camY);
  }

  /* Pass 1: every loaded chunk blitted at an integer offset. The renderer has
     already cleared the target. */
  blit(camX,camY){
    const r=this.r, R=r.renderer, bu=r.blit.mat.uniforms, W=r.W, H=r.H;
    for(const c of this.chunks.values()){
      if(c.ox>camX+W||c.ox+CH<camX||c.oy>camY+H||c.oy+CH<camY) continue;
      bu.uTex.value=c.tex;
      bu.uOrigin.value.set(c.ox-camX,c.oy-camY); bu.uSize.value.set(CH,CH);
      R.render(r.blit.sc,r.cam);
    }
  }

  /* Pass 2: shadows. */
  shadows(ui){
    const r=this.r, R=r.renderer;
    if(ui.shadows!==false){
      R.setRenderTarget(r.rtS); R.clear(true,true,true);
      R.render(r.bBehind.shadowScene,r.cam);
      R.render(r.bFront.shadowScene,r.cam);
      R.render(r.bContact.shadowScene,r.cam);
      r.ground.mat.uniforms.uShadow.value=r.rtS.texture;
    }else r.ground.mat.uniforms.uShadow.value=null;
  }

  /* The sun and the haze are the scene's. The sun is kept, because the sprite
     material is shared across worlds and uniforms() rewrites light every
     frame. */
  setSun(v){ this.sun=v; }

  haze(){
    /* a world has one sky */
    this.fog=repaint(this.spec.fog);
    return this.fog;
  }

  /* Streaming. Runtime misses are queued by distance and compiled off the
     animation thread. `force` is synchronous, for initial build, captures and
     resize. */
  ensure(force){
    const camX=Math.round(this.camXf), camY=Math.round(this.camYf);
    /* One full chunk of lead is about three seconds at walking speed: enough
       for a diagonal row+column miss on a slow compiler, inside the 60-chunk
       resident budget. */
    const x0=Math.floor((camX-CH)/CH),x1=Math.floor((camX+this.r.W+CH)/CH);
    const y0=Math.floor((camY-CH)/CH),y1=Math.floor((camY+this.r.H+CH)/CH);
    let baked=0;const missing=[];
    const mx=(x0+x1)*0.5,my=(y0+y1)*0.5;
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
      const k=cx+','+cy;
      const had=this.chunks.get(k);
      if(had){
        /* A chunk resolved against a previous atlas holds rects into an
           unbound sheet. Re-resolve, not re-bake: only the packing changed. */
        if(had.gen!==this.r.atlasGen) this.resolve(had);
        continue;
      }
      if(!force&&this.chunkWorker){
        if(!this.chunkPending.has(k))
          missing.push([cx,cy,(cx-mx)*(cx-mx)+(cy-my)*(cy-my)]);
        continue;
      }
      const c=this.gen.bakeChunk(cx,cy);
      this.resolve(c);
      /* replay every print inside this chunk, so tracks survive eviction */
      if(this.prints) for(const p of this.prints)
        this.stampPrint(c,p[0],p[1],p[2],this.printFade(p,this.r.time));
      this.chunks.set(k,c);
      baked++;
      if(!force) return baked;
    }
    if(!force&&this.chunkWorker){
      missing.sort((a,b)=>a[2]-b[2]);
      for(const [cx,cy] of missing)if(this.queueChunk(cx,cy))baked++;
    }
    /* Evict what is well out of sight. Textures are disposed explicitly: the
       GC does not know about VRAM. */
    if(this.chunks.size>60){
      for(const [k,c] of this.chunks){
        if(c.cx<x0-2||c.cx>x1+2||c.cy<y0-2||c.cy>y1+2){ c.tex.dispose(); this.chunks.delete(k); }
      }
    }
    return baked;
  }
  /* variant choice depends on the atlas, so it happens once when a chunk
     arrives */
  resolve(c){
    /* stamp which atlas bind this chunk's rects came from. See bindAtlas. */
    c.gen=this.r.atlasGen;
    const rects=this.baked.rects;
    for(const p of c.props){
      const bank=this.atlas[p.kind][p.tier];
      if(!bank||!bank.length){ p.r=null; continue; }
      let best=0, fl=p.flip, bd=1e9;
      /* A sprite with zero authored tilt scores the same for both mirror
         candidates, and the strict comparison keeps the first: every deadfall
         has its root plate on the same end. Anything symmetric picks its side
         from the placement hash. */
      for(let bi=0;bi<bank.length;bi++){
        const idx=(bi+Math.floor(p.vari*bank.length))%bank.length;
        const ct=bank[idx].tilt||0;
        for(let f=0;f<2;f++){
          const dd=Math.abs((f?-ct:ct)-p.tilt)+bi*0.0012;
          if(dd<bd){ bd=dd; best=idx; fl=!!f; }
        }
      }
      const sp=bank[best];
      p.r=rects[p.kind+':'+p.tier+':'+best]||null;
      /* the same tree with its snow shed, where it carries any */
      p.bareR=rects['bare:'+p.kind+':'+p.tier+':'+best]||null;
      p.spinRects=p.rotor
        ? bank.map((_,i)=>rects[p.kind+':'+p.tier+':'+i]||null)
        : null;
      /* A rocker is a pendulum: its bank is indexed by the clock and its own
         measured period, so it rocks in still air. */
      p.rockRects=p.rock
        ? bank.map((_,i)=>rects[p.kind+':'+p.tier+':'+i]||null)
        : null;
      p.flipR=fl;
      p.rampId=p.warm?RAMP_ID.warm:p.dark?RAMP_ID.trunk:RAMP_ID[sp.ramp];
      /* the deposit ramp, off the species row. 0 (snow) when unset. */
      p.ramp2=sp.ramp2===undefined?0:RAMP_ID[sp.ramp2];
      p.dMin=sp.dMin; p.dMax=sp.dMax;
      /* how much of the deposit's value comes from its own thickness: off for
         snow, on for a crown that is a volume */
      p.vol=sp.vol;
      p.sMin=(p.warm||p.dark)?0.02:sp.sMin;
      p.sMax=p.warm?0.68:p.dark?0.60:sp.sMax;
      /* A stem takes its gust phase from its downwind position, so sway crosses
         a stand as a front. Everything built stays still. */
      p.phase=SWAYS.has(p.kind)?gustPhase(p.x,p.y,p.vari):RIGID;
    }
  }
  chunkAt(wx,wy){ return this.chunks.get(Math.floor(wx/CH)+','+Math.floor(wy/CH)); }
  waterAt(wx,wy){
    const c=this.chunkAt(wx,wy); if(!c) return false;
    const lx=Math.floor(wx)-c.ox, ly=Math.floor(wy)-c.oy;
    if(lx<0||ly<0||lx>=CH||ly>=CH) return false;
    return !!c.water[ly*CH+lx];
  }

  printFade(p,now){ return printStrength(now-p[3]); }

  /* repaint one chunk's print layer at the current time */
  repaintPrints(c,now){
    if(!c.base0) return;
    for(let i=0;i<CH*CH;i++) c.geom[i*4]=c.base0[i];
    for(const p of this.prints) this.stampPrint(c,p[0],p[1],p[2],this.printFade(p,now));
    c.tex.needsUpdate=true;
  }

  tickPrints(now,dt){
    if(dt>0&&now-(this.printLast||0)>=PRINT_TICK){
      this.printLast=now; this.agePrints(now);
    }
  }

  /* Drop dead prints and repaint the chunks that hold live ones. Called at
     PRINT_TICK, not per frame: a print takes thirty seconds to go and the
     depth it writes is quantised to a byte. */
  agePrints(now){
    if(!this.prints.length) return;
    const before=this.prints.length;
    while(this.prints.length&&now-this.prints[0][3]>=PRINT_LIFE) this.prints.shift();
    for(const c of this.chunks.values()) if(c.base0) this.repaintPrints(c,now);
    if(before!==this.prints.length&&!this.prints.length){
      /* the last print has gone and the final repaint restored base0
         everywhere: drop the snapshots */
      for(const c of this.chunks.values()) c.base0=null;
    }
  }

  stampPrint(c,fx,fy,k,fade){
    k=k||PRINT.boot;
    if(fade===undefined) fade=1;
    if(fade<=0) return false;
    const R=Math.ceil(Math.max(k.rx,k.ry)*1.6)+1;
    const lx0=Math.floor(fx)-c.ox, ly0=Math.floor(fy)-c.oy;
    if(lx0<-R||ly0<-R||lx0>CH+R||ly0>CH+R) return false;
    let touched=false;
    for(let dy=-R;dy<=R;dy++){
      const y=ly0+dy; if(y<0||y>=CH) continue;
      for(let dx=-R;dx<=R;dx++){
        const x=lx0+dx; if(x<0||x>=CH) continue;
        const o=(y*CH+x)*4;
        const flag=Math.round(c.geom[o+3]/FLAG_Q);
        /* Whether a surface remembers a foot is a property of the surface:
           `print` and `yieldKPa` on its row in src/surface.js. */
        const surface=SURFACE[flag]||{};
        const pressurePrint=surface.yieldKPa!==undefined
          && k.pressureKPa!==undefined&&k.pressureKPa>=surface.yieldKPa;
        if(!surface.print&&!pressurePrint) continue;
        const ex=(c.ox+x-fx)/k.rx, ey=(c.oy+y-fy)/k.ry;
        const d2=ex*ex+ey*ey;
        let t=c.geom[o]/255, nt=t;
        if(d2<1.0) nt=t+(k.deep-t)*k.hard*fade;
        else if(d2<2.2&&ey<0.2) nt=t+(k.lip-t)*k.soft*fade;
        else continue;
        /* The snapshot is taken at the first pixel pressed, not on entry.
           mark() offers every print to the chunk under it and its four
           neighbours, and ensure() replays every live print into each chunk it
           bakes. A snapshot on entry charges 36 KB to every chunk asked:
           measured, fifteen chunks after two seconds of walking, against the
           three walked in. */
        if(!c.base0){
          c.base0=new Uint8Array(CH*CH);
          for(let q=0;q<CH*CH;q++) c.base0[q]=c.geom[q*4];
        }
        c.geom[o]=Math.round(Math.max(0,Math.min(1,nt))*255);
        touched=true;
      }
    }
    if(touched) c.tex.needsUpdate=true;
    return touched;
  }

  surfaceFlagAt(wx,wy,c=this.chunkAt(wx,wy)){
    if(c){
      const x=Math.floor(wx)-c.ox,y=Math.floor(wy)-c.oy;
      if(x>=0&&y>=0&&x<CH&&y<CH)
        return Math.round(c.geom[(y*CH+x)*4+3]/FLAG_Q);
    }
    return this.gen.traversalAt?.(wx,wy).surface;
  }

  materialSinkAt(wx,wy){
    const flag=this.surfaceFlagAt(wx,wy);
    return SURFACE[flag]?.sinkPx||0;
  }

  /* lay one mark and let it straddle chunk seams */
  mark(fx,fy,kind,locomotion='walk'){
    const c=this.chunkAt(fx,fy);
    const flag=this.surfaceFlagAt(fx,fy,c);
    if(c) this.stampPrint(c,fx,fy,kind);
    for(const [ox,oy] of [[-4,0],[4,0],[0,-4],[0,4]]){
      const c2=this.chunkAt(fx+ox,fy+oy);
      if(c2&&c2!==c) this.stampPrint(c2,fx,fy,kind);
    }
    /* Every footfall comes through here (the traveller's boots and every
       actor's track), so this is the one place loose ground is thrown.
       src/kickup.js owns the material physics. */
    if(this.kick&&flag!==undefined){
      this.kickSeq=spawnKick(this.kick,fx,fy,flag,this.kickSeq,locomotion);
    }
  }

  /* The traveller's boots land on the frame where the body table plants them.
     Distance still advances gait, while the crossed pose boundary supplies the
     exact forward excursion and anatomical side of the contact. */
  dropPrints(){
    const x0=this.lastPX,y0=this.lastPY;
    const dx=this.px-x0, dy=this.py-y0;
    this.lastPX=this.px; this.lastPY=this.py;
    const fromGait=this.printGait??this.gait,toGait=this.gait;
    this.printGait=toGait;
    const d=Math.hypot(dx,dy);
    if(d<=0.0001) return;
    const patchId=this.gen.lifePatchId?.(this.px,this.py);
    if(patchId&&patchId!==this.lastTrafficPatch){
      recordTravellerPresence(this.lifeSession,this.gen,this.px,this.py);
      this.lastTrafficPatch=patchId;
    }
    if(this.camelMounted?.()){
      const F=ACTOR.camel,state=this.mountedState();
      const ux=dx/d,uy=dy/d;
      for(let frame=Math.floor(fromGait)+1;frame<=Math.floor(toGait);frame++){
        const pose=F.pose({state,frame});
        const before=F.pose({state,frame:frame-1});
        const wasDown=new Map(before.feet.map((q)=>[q.limb,q.contact]));
        const at=clamp((frame-fromGait)/Math.max(1e-9,toGait-fromGait),0,1);
        const bx=x0+dx*at,by=y0+dy*at;
        for(const foot of pose.feet.filter((q)=>q.contact&&!wasDown.get(q.limb))){
          const lateral=foot.side*F.foot*0.5;
          const fx=bx+ux*foot.x-uy*lateral;
          const fy=by+uy*foot.x+ux*lateral;
          this.prints.push([fx,fy,F.track,this.r.time]);
          if(this.prints.length>900)this.prints.shift();
          this.mark(fx,fy,F.track,this.locomotionState);
        }
      }
      return;
    }
    const row=CAST_BY_KEY[this.travellerKey()]||CAST.traveller;
    const strikes=folkStrikes(fromGait,toGait,{
      h:heightPx(row),state:this.locomotionState,
    });
    for(const foot of strikes){
      const at=clamp(foot.at,0,1);
      const bx=x0+dx*at,by=y0+dy*at;
      const p=folkFootWorld(bx,by,dx,dy,foot);
      this.prints.push([p.x,p.y,PRINT.boot,this.r.time]);
      if(this.prints.length>900) this.prints.shift();
      this.mark(p.x,p.y,PRINT.boot,this.locomotionState);
    }
  }

  /* ── spells: src/spell.js owns the laws, this is the world's side ──────── */
  frozenAt(wx,wy){
    return this.spells.marks.length>0&&plateAt(this.spells,wx,wy,this.r.time||0);
  }

  /* One cast from where he stands, the way he last walked. `which` is a slot
     number (the digit keys) or a spell id. */
  cast(which){
    const id=typeof which==='number'?SPELL_ORDER[which-1]:which;
    if(!SPELLS[id]) return null;
    const now=this.r.time||0,weather=this.spec.precipitation.kind;
    const result=castSpell(this.spells,id,
      {x:this.px,y:this.py,hx:this.heading.x,hy:this.heading.y},now,{
        flagAt:(x,y)=>this.surfaceFlagAt(x,y),
        rain:weather==='rain',snow:weather==='snow',windMps:windMps(this.wind),
      });
    if(result.refused==='wet')
      emitFizzle(this.motes,this.spells,result.x,result.y,SURFACE[result.flag]?.ramp);
    if(!result.mark) return result;
    const row=SPELLS[id];
    this.loud={level:row.noise,until:now+1.2};
    /* The typed ledger remembers longer than the mark (src/disturbance.js). */
    if(this.gen.lifeSiteAt){
      if(id==='kindle') this.disturb('fire',result.mark.x,result.mark.y,0.5);
      else if(id!=='frost') this.disturb('noise',this.px,this.py,Math.min(1,row.noise*0.5));
    }
    return result;
  }

  stepSpells(dt){
    const S=this.spells,now=this.r.time||0;
    if(S.marks.length){
      const travel=this.gen.traversalAt?.(this.px,this.py);
      if(travel&&travel.walk===false) holdIce(S,this.px,this.py,now);
      pruneMarks(S,now);
      emitMarks(S,this.motes,now,dt,this.spellWorld());
    }
    if(this.motes.length)
      stepMotes(S,this.motes,dt,this.wind||0,this.spellWorld());
  }

  /* What a mark may ask the world. */
  spellWorld(){
    if(this._spellWorld) return this._spellWorld;
    const scene=this;
    this._spellWorld={
      flagAt:(x,y)=>scene.surfaceFlagAt(x,y),
      props:(x,y,radius)=>scene.plantsNear(x,y,radius),
      get coat(){ return {ramp:scene.coatRamp()}; },
      get snowy(){ return scene.spec.precipitation.kind==='snow'; },
      get wind(){ return scene.wind||0; },
      /* falling water: the world's own rain ramp, if it rains there */
      get rainRamp(){
        const p=scene.spec.precipitation;
        return p.kind==='rain'?p.ramp:null;
      },
    };
    return this._spellWorld;
  }

  /* Resident plants within `radius` ground px. A plant belongs to one chunk. */
  plantsNear(x,y,radius){
    const out=[],rows=radius/GROUND_PX_PER_ROW;
    for(let cy=Math.floor((y-rows)/CH);cy<=Math.floor((y+rows)/CH);cy++)
    for(let cx=Math.floor((x-radius)/CH);cx<=Math.floor((x+radius)/CH);cx++){
      const c=this.chunks.get(cx+','+cy);
      if(!c) continue;
      for(const p of c.props){
        if(!p.r||!SWAYS.has(p.kind)) continue;
        if(Math.abs(p.x-x)>radius||Math.abs(p.y-y)>rows) continue;
        out.push({x:p.x,y:p.y,w:p.r.w,h:p.r.h,kind:p.kind,plant:true});
      }
    }
    return out;
  }

  disturb(type,x=this.px,y=this.py,intensity=1,extra={}){
    return applyDisturbance(this.lifeSession,this.gen,{type,x,y,intensity,...extra});
  }
}
