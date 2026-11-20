import { CABIN_H, CABIN_W, cabinDoorDX, cabinFootprint } from '../cabin.js';
import { PATHW } from '../constants.js';
import { tentFootprint } from '../desert-camp.js';
import { hutFootprint } from '../desert-hamlet.js';
import { capHouseFootprint, cutBenchFootprint, lampPostFootprint } from '../hollow-village.js';
import { pavilionFootprint } from '../pavilion.js';
import { fbm, hashf, makeNoise } from '../rng.js';
import { PX_PER_M } from '../scale.js';
import { CROWN_HALF } from '../species.js';
import { steadingFootprint } from '../steading.js';
import { swampHouseDoorDX, swampHouseFootprint } from '../swamp-settlement.js';

function makeSiting(w){
  const {
    CAVERN, COMMON, PLAN, POI, SWAMP_LAKEHOUSE, SWAMP_SETTLEMENT, caveSet,
    coveredAt, duneAt, duneEnvelope, isWater, pathDist, pathX, rimAt, seed, wet,
  }=w;
  const SLOTS=PLAN.slots||[];
  const steadingSiteFoot=(kind,variant=0)=>kind==='pavilion'
    ? pavilionFootprint()
    : kind==='hut' ? hutFootprint(variant)
    : kind==='tent' ? tentFootprint(variant)
    : kind==='capHouse' ? capHouseFootprint(variant)
    : kind==='lampPost' ? lampPostFootprint()
    : kind==='cutBench' ? cutBenchFootprint()
    : steadingFootprint(kind,variant);
  /* Relaxation ladder, in order. `gap` is a margin on top of the two
     footprints; the footprint sum is never relaxed. */
  const RELAX=[{name:'none',   trail:10, gap:16, poi:0.92},
               {name:'margin', trail:10, gap:0,  poi:0.92},
               {name:'places', trail:4,  gap:0,  poi:0.55}];
  /* Site legality for a footprint, given the structures already placed. Every
     term is a pure function of seed and position, so the second generator in
     src/chunk-worker.js reaches the same answer. */
  const siteLegal=(x,y,f,out,R)=>{
    if(rimAt(x,y)>0.02) return false;
    /* A dune migrates, so an earth house needs pavement over its whole
       footprint. A tent (`onSand`) may stand on sand. Neither stands on a slip
       face. */
    if(PLAN.dunes){
      for(const dx of [-f.hx,0,f.hx])
        for(const dy of [-f.front,0,f.back]){
          if(!f.onSand&&duneEnvelope(x+dx,y+dy)>0.05) return false;
          if(duneAt(x+dx,y+dy).face<0) return false;
        }
    }
    /* A cavern is solid outside its rooms and a wall hides the rows north of
       it (src/world/cavern.js). The whole footprint stands on open floor,
       clear of every body the plan stood. */
    if(CAVERN){
      for(const dx of [-f.hx,0,f.hx])
        for(const dy of [-f.back,0,f.front])
          if(coveredAt(x+dx,y+dy)) return false;
      for(const q of caveSet)
        if(Math.abs(x-q.x)<f.hx+q.clear&&q.y>y-f.back-q.clear&&q.y<y+f.front+q.clear)
          return false;
    }
    if(pathDist(x,y)<PATHW+f.hx+R.trail) return false;
    /* Water is tested over the footprint area. A house draws 34 rows deep:
       sampling only front, back and step rows lets a stream cross its middle
       and the house stands over open water. */
    const step=Math.max(8,f.hx>>2);
    const rowStep=Math.max(6,f.back>>2);
    for(let q=-f.hx;q<=f.hx;q+=step){
      if(isWater(x+q,y+f.front)) return false;
      for(let d=0;d<=f.back;d+=rowStep) if(isWater(x+q,y-d)) return false;
      if(isWater(x+q,y-f.back)) return false;
    }
    /* The trail bends: it can clear the anchor by the half-width and still run
       through the back corner, so every row is tested. */
    for(let d=0;d<=f.back;d+=rowStep)
      if(pathDist(x,y-d)<PATHW+f.hx+R.trail) return false;
    /* The steading is the village, so its own POI is not a conflict. The pond
       court, the ring places and the portals are. */
    for(const p of POI)
      if(p.kind!=='village'&&Math.hypot(x-p.x,y-p.y)<p.r*R.poi) return false;
    /* Separation by the sum of the two footprints, as rectangles. A radius
       test on 134x60 is wrong by a factor of two on one axis. */
    for(const q of out){
      const g=steadingSiteFoot(q.kind,q.vari||0);
      if(Math.abs(x-q.x)<f.hx+g.hx+R.gap&&
         Math.abs(y-q.y)<Math.max(f.back+g.front,g.back+f.front)+R.gap) return false;
    }
    return true;
  };
  let STEADING_DROPPED=[];
  const steadingAt=()=>{
    const out=[], dropped=[];
    for(const s of SLOTS){
      const f=steadingSiteFoot(s.kind,s.vari||0);
      let placed=null;
      for(const R of RELAX){
        /* Slide along the trail first, then push away from it. */
        for(let k=0;k<15&&!placed;k++){
          const ty=COMMON.y+s.dy+((k%2)?1:-1)*Math.ceil(k/2)*26;
          for(const push of [0,26,52,78]){
            const x=Math.round(pathX(ty))+s.side*(s.off+push);
            if(!siteLegal(x,ty,f,out,R)) continue;
            placed={kind:s.kind, x, y:ty, vari:s.vari, relaxed:R.name};
            break;
          }
        }
        if(placed) break;
      }
      /* A slot with no legal site is not built. It is recorded with its reason
         so a test can assert the absence. */
      if(placed) out.push(placed);
      else dropped.push({...s, reason:'no legal site in any relaxation'});
    }
    STEADING_DROPPED=dropped;
    return out;
  };

  /* Settlements are authored arrangements. Sites clear the analytic trail,
     neighbours and each building's full wet footprint. Cabins gate on
     `PLAN.cabins`, not the biome name; the meadow's settlement is STEADING
     (props).
     cabinVariantAt is the one variant pick: siting, door offset, keep-out and
     collider all read it. */
  const cabinVariantAt=(x,y)=>Math.floor(
    hashf(Math.round(x),Math.round(y),seed^0xcab1)*CABIN_W.length)%CABIN_W.length;

  const BUILDINGS=(()=>{
    const out=[];
    if(PLAN.cabins){
      const rr=makeNoise(seed^0xb1d6);
      for(const p of POI){
        if(p.kind!=='village') continue;
        const n=6;
        for(let i=0;i<n;i++){
        const a0=-Math.PI*0.5 + 0.85 + (i/(n-1))*(Math.PI*2-1.70)
                 + fbm(rr,i*4.3,0.5,2)*0.22;
        const d=p.r*(0.58+0.22*(fbm(rr,i*9.1+5,1.5,2)*0.5+0.5));
        let a=a0, x=0, y=0, found=false;
        /* Angle first, then distance. A ring that grazes the trail grazes it at
           every angle: an angle-only sweep loses two of six cabins. The radius
           steps are the boreal RELAX ladder. */
        for(const ds of [1.00,0.86,1.14,0.74]){
        for(let k=0;k<48&&!found;k++){
          a=a0+k*0.13;
          x=p.x+Math.cos(a)*d*ds; y=p.y+Math.sin(a)*d*ds*0.82;
          /* Clearance reads cabinFootprint, sampled over the footprint as in
             siteLegal. A clearance short of the building puts the path through
             the wall; `wet(x,y)` on the anchor alone lets the back corner
             stand in water. */
          const cf=cabinFootprint(cabinVariantAt(x,y));
          if(pathDist(x,y)<=PATHW+cf.hx) continue;
          let bad=false;
          for(let q=-cf.hx;q<=cf.hx&&!bad;q+=Math.max(8,cf.hx>>2))
            for(let d=-cf.front;d<=cf.back&&!bad;d+=Math.max(6,cf.back>>2))
              if(wet(x+q,y-d)||pathDist(x+q,y-d)<=PATHW+4) bad=true;
          if(!bad&&out.every(q=>Math.hypot(q.x-x,q.y-y)>cf.hx*2+10)) found=true;
        }
        if(found) break;
        }
        /* An unplaceable cabin is dropped. Pushing the last angle tried ships a
           cabin on the trail (test/steading.test.mjs). */
        if(found) out.push({x,y,kind:'cabin'});
        }
      }
    }
    if(SWAMP_SETTLEMENT&&SWAMP_SETTLEMENT.enterable){
      const h=SWAMP_SETTLEMENT.enterable;
      out.push({x:h.x,y:h.y,kind:'swampHouse',variant:h.variant,profile:'swamp'});
    }
    return out;
  })();

  /* Portals are authored POI. poiAt masking requires portal sites to clear
     existing POI and water. */
  const PORTAL_R=150;
  /* Legibility floor: the spokes and inner ring collapse below 22 px. */
  const PORTAL_RING=22;
  const portalSite=(row,taken)=>{
    const blocked=(x,y)=>{
      if(rimAt(x,y)>0.02)return 'rim';
      if(wet(x,y))return 'wet';
      if(POI.some(p=>Math.hypot(x-p.x,y-p.y)<p.r+PORTAL_R*0.55))return 'poi';
      if(taken.some(p=>Math.hypot(x-p.x,y-p.y)<PORTAL_R*1.25))return 'taken';
      /* A swamp pile house draws north from its foot. Reject sites under a
         house body so the gate is never hidden. */
      if(SWAMP_SETTLEMENT&&SWAMP_SETTLEMENT.houses.some(h=>
        Math.abs(x-h.x)<78&&y<=h.y+8&&y>=h.y-110))return 'house';
      return null;
    };
    let fallback=null;
    for(let k=0;k<40;k++){
      const y=row.axis==='x'?Math.round(pathX(row.portalY)):row.portalY+k*45;
      const x0=row.axis==='x'?row.portalY+k*45:Math.round(pathX(y));
      /* Swamp path samples are often flooded: try lateral steps onto dry
         peat before the next row. */
      const laterals=PLAN.worldTrail?[0]:[0,-56,56,-112,112];
      for(const dx of laterals){
        const x=x0+dx,why=blocked(x,y);
        if(why==='rim'&&dx===0)return fallback||{x:Math.round(pathX(row.portalY)),y:row.portalY};
        if(why)continue;
        if(!fallback)fallback={x,y};
        return {x,y};
      }
    }
    /* Swamp last resort: walk north of the landing until a clear dry pad
       appears, never under a house sprite. */
    if(SWAMP_SETTLEMENT){
      const ly=SWAMP_SETTLEMENT.landing.y;
      for(let y=ly-260;y>=ly-980;y-=36){
        const x0=Math.round(pathX(y));
        for(const dx of [0,-56,56,-112,112,-168,168]){
          const x=x0+dx;
          if(!blocked(x,y))return {x,y};
        }
      }
    }
    return fallback||{x:Math.round(pathX(row.portalY)), y:row.portalY};
  };
  /* Order is forced: the site walk asks `wet`, `isWater`, `lakeAt`, then
     `poiKind`, so POI must be complete before a portal site is chosen. Every
     POI reader reads at call time, so appending here reaches all of them. */
  const PORTALS=[];
  for(const row of PLAN.portals||[]){
    const s=portalSite(row,PORTALS);
    /* Invariant: axis selects the threshold coordinate, sign the crossing
       sense, identity the matching return edge. */
    PORTALS.push({kind:'portal',id:row.id,returnId:row.returnId,
      x:s.x,y:s.y,r:PORTAL_R,to:row.to,axis:row.axis||'y',
      sign:row.sign===undefined?-1:row.sign,span:PORTAL_RING-3,off:row.off||0});
  }
  POI.push(...PORTALS);

  /* The steading is sited after the portals: the walk asks `isWater`, `lakeAt`
     and POI, which is complete only once the portals are on it. A portal
     outranks a shed, so the shed moves. */
  const STEADING=steadingAt();

  /* A ground-sitting structure blocks its whole footprint slab. Scene.blocked
     scales the row difference by the ground squash, so a 4.5 px disc covers
     2.4 rows and a row of discs leaves deeper structures walk-through. `shear`
     is zero without a cabinet return. */
  const slabAt=(out,cx,cy,f,shear=0)=>{
    out.push({x:cx, y:cy, hx:f.hx, back:f.back, front:f.front, shear});
  };

  /* Graded keep-out: 2 core / 1 yard / 0 free (+ crown). Cabin row frozen.
     See docs/DECISIONS.md, docs/CANON.md, docs/MEADOW.md.
     A pile house carries its own footprint: the frozen 36/34/26 cabin box is
     half the width of the sheet it draws. */
  const footOf=(s)=>(s.kind==='swampHouse'
    ? swampHouseFootprint(s.variant||0)
    : s.kind==='cabin'
      ? cabinFootprint(cabinVariantAt(s.x,s.y))
      : steadingSiteFoot(s.kind,s.vari===undefined?(s.variant||0):s.vari));
  const KEEP=[...BUILDINGS,...STEADING].map(s=>({s,f:footOf(s)}));
  /* Cheap rejection box over both lists, widened by the largest crown. */
  const CROWN_MAX=Math.max(...Object.values(CROWN_HALF));
  const KEEP_BOX=KEEP.length?{
    x0:Math.min(...KEEP.map(k=>k.s.x-k.f.hx-k.f.yard))-CROWN_MAX,
    x1:Math.max(...KEEP.map(k=>k.s.x+k.f.hx+k.f.yard))+CROWN_MAX,
    y0:Math.min(...KEEP.map(k=>k.s.y-k.f.back-k.f.yard))-CROWN_MAX,
    y1:Math.max(...KEEP.map(k=>k.s.y+k.f.front+k.f.yard))+CROWN_MAX,
  }:null;
  const keepOutAt=(x,y,reach)=>{
    /* The lakehouse owns its footprint (SWAMP_LAKEHOUSE.keepOut). No second
       copy of its width here. */
    if(SWAMP_LAKEHOUSE){
      const own=SWAMP_LAKEHOUSE.keepOut(x,y,(reach||0)>0);
      if(own===2) return 2;
      if(own===1&&!KEEP_BOX) return 1;
      if(own===1) return Math.max(1,keepOutBuilt(x,y,reach));
    }
    return keepOutBuilt(x,y,reach);
  };
  const keepOutBuilt=(x,y,reach)=>{
    if(!KEEP_BOX||x<KEEP_BOX.x0||x>KEEP_BOX.x1||y<KEEP_BOX.y0||y>KEEP_BOX.y1) return 0;
    let worst=0;
    for(const {s,f} of KEEP){
      if(x>s.x-f.hx&&x<s.x+f.hx&&y>s.y-f.back&&y<s.y+f.front) return 2;
      /* A frozen kind (yard 0) carries no band, so winter's bytes cannot
         move. */
      const band=f.yard===0?0:f.yard+(reach||0);
      if(band>0&&x>s.x-f.hx-band&&x<s.x+f.hx+band
         &&y>s.y-f.back-band&&y<s.y+f.front+band) worst=Math.max(worst,1);
    }
    return worst;
  };

  /* A building's variant and door. `resolve` picks the variant with the same
     expression, so the collision model and the picture agree. */
  const buildingDoor=(b)=>{
    const bx=Math.round(b.x), by=Math.round(b.y);
    if(b.kind==='swampHouse'){
      const v=b.variant||0,dx=swampHouseDoorDX(v);
      return {x:bx+dx,y:by,dx,v,profile:'swamp',front:swampHouseFootprint(v).front};
    }
    const v=cabinVariantAt(bx,by);
    const dx=cabinDoorDX(v);
    /* `front` is the apron the site check proved dry and off-trail. It clears
       the keep-out core without a second copy of the footprint. */
    return {x:bx+dx, y:by, dx, v, front:cabinFootprint(v).front};
  };

  /* Arrival. The frostwood arrives on the trail, up the trail from its village.

     On the trail: cabin siting rejects any site within PATHW plus the cabin's
     half width. Measured failure: the village axis puts a roof over the
     traveller on six of eight seeds, because a cabin's anchor is its wall base
     and 84 px of gable draws above it.

     Up the trail: `pathX(0)` lands inside the common on every seed measured.
     Three metres north of the northernmost house puts the ring ahead and
     below. The step loop walks further up the trail until the point is not
     drawn over.

     The other worlds keep the origin: biome.js puts their commons 500-600 px
     down-trail. */
  const ARRIVAL_MARGIN=Math.round(3*PX_PER_M);
  /* A world row is a screen row for drawing (scene.js: camYf = py - H*0.56), so
     a cabin covers the rows from its ridge down to its anchor. */
  const drawnOver=(x,y)=>BUILDINGS.some((b)=>{
    if(b.kind!=='cabin'||b.y<=y) return false;
    const v=cabinVariantAt(Math.round(b.x),Math.round(b.y));
    return Math.abs(x-b.x)<cabinFootprint(v).hx+5 && y>b.y-CABIN_H[v];
  });
  const arrivalPoint=()=>{
    const cabins=BUILDINGS.filter((b)=>b.kind==='cabin');
    if(!cabins.length) return {x:Math.round(pathX(0)),y:0};
    let y=Math.round(Math.min(...cabins.map((b)=>b.y)))-ARRIVAL_MARGIN;
    for(let i=0;i<12&&drawnOver(Math.round(pathX(y)),y);i++) y-=ARRIVAL_MARGIN;
    return {x:Math.round(pathX(y)),y};
  };

  return {
    STEADING_DROPPED, BUILDINGS, PORTAL_RING, PORTALS, STEADING, slabAt,
    keepOutAt, buildingDoor, arrivalPoint,
  };
}

export { makeSiting };
