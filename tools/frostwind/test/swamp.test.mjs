import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { bakeWorldAtlas, buildWorldAtlas } from '../src/atlas.js';
import { M, eavePx } from '../src/construct.js';
import { CAST } from '../src/people.js';
import { ATLAS_S, CH, FLAG_Q } from '../src/constants.js';
import { RESIDENTS } from '../src/culture.js';
import { LIFE } from '../src/life.js';
import { RNG } from '../src/rng.js';
import { SPRITE_FS } from '../src/shaders/sprite.js';
import { W_SHADOW_FS } from '../src/shaders/world.js';
import { SPECIES, SPECIES_H, makeTree, tierHeight } from '../src/species.js';
import { SWAMP_HOUSE, SWAMP_PILE_HALF, makeSwampHouse, makeSwampProp,
         swampHouseBox, swampHouseOpenings, swampHousePileDX,
         swampHouseFloorPx, swampHousePiles,
         swampHouseSlab, swampPileSlab } from '../src/swamp-settlement.js';
import { PX_PER_M } from '../src/scale.js';
import { RAMP, rebuildPalette } from '../src/palette.js';
import { SWAMP_LADDER } from '../src/sunlight.js';
import { SURFACE, SURF } from '../src/surface.js';
import { clamp } from '../src/math.js';
import { HABITAT, LAYERS, makeWorldGen } from '../src/worldgen.js';
import { RIM } from '../src/world/ground.js';
import { MERGE_Q, basinUnion } from '../src/basin.js';
import { REPORT_ENABLED, reportConsole as console } from './report.mjs';

const SEED=20260727;
const OPT={biome:'swamp',lake:0.55,density:0.65};
const SWAMP_WADE_M=SURFACE[SURF.flooded].depth[1];

test('hydroperiod, depth and alligator refugia are deterministic authorities',()=>{
  const a=makeWorldGen(SEED,OPT),b=makeWorldGen(SEED,OPT);
  assert.deepEqual(a.alligatorHoles,b.alligatorHoles);
  assert.equal(a.alligatorHoles.length,5);
  for(const h of a.alligatorHoles){
    const q=a.hydrologyAt(h.x,h.y);
    assert.equal(q.water,true,`alligator hole ${h.x},${h.y} dried out`);
    assert.ok(q.depth>=0.72,`alligator refuge is only ${q.depth.toFixed(2)} m deep`);
    assert.ok(q.hydroperiod>=0.96,'a permanent refuge lost its hydroperiod');
    assert.equal(a.entityAffordance(LIFE.alligator,h.x,h.y),true);
  }
  const dry=a.hydrologyAt(a.swampSettlement.houses[0].x,a.swampSettlement.houses[0].y);
  assert.ok(dry.depth<=0.22,'the selected house site is not a hummock or bounded shallow site');
});

/* Section profiles. A backwater is a limestone solution basin: a floor with a
   wall, the lakehouse sinkhole's profile. A slough is a channel: a bed with
   banks at peat's angle. A cosine bowl or a Gaussian is flattest at the shore.
   Measured: 28 px of wade-depth margin across the width and 42 rows down the
   depth axis, a pond that is mostly margin.

   Neumann's volume development D_V = 3 * z_mean / z_max: 1.0 is a cone,
   flat-floored basins run well above it (Hutchinson 1957, A Treatise on
   Limnology I; Neumann 1959). */
test('a backwater is a solution basin, and its edge is an edge',()=>{
  const g=makeWorldGen(SEED,OPT);
  const WADE=SWAMP_WADE_M;
  const rows=[];
  /* Basins come from the generator's swampChain. */
  let found=0;
  for(const b of g.swampChain(-1300,1300)){
    if(found>=4) break;
    if(b.kind!=='basin') continue;
    const cx=Math.round(b.cx),cy=Math.round(b.cy);
    if(!g.hydrologyAt(cx,cy).water) continue;
    /* The lakehouse sinkhole has its own test. */
    const L=g.swampLakehouse;
    if(L&&Math.hypot(cx-L.pond.cx,cy-L.pond.cy)<320) continue;
    /* The basin's own water only. The ankle-deep flooded forest touches it
       and would drag the mean toward a cone, so the extent grows from the
       basin's deep core by the allowed margin. */
    const reach=(dx,dy)=>{
      let n2=0;
      while(n2<200){
        const h=g.hydrologyAt(cx+dx*(n2+2),cy+dy*(n2+2));
        if(!h.water||h.depth<=WADE) break;
        n2+=2;
      }
      return n2;
    };
    const ax=Math.min(reach(1,0),reach(-1,0)), ay=Math.min(reach(0,1),reach(0,-1));
    if(ax<40||ay<24) continue;
    const MARGIN=10;                      // the wall's own width, and no more
    let sum=0,max=0,n=0;
    for(let y=cy-ay-MARGIN;y<=cy+ay+MARGIN;y+=2)
    for(let x=cx-ax-MARGIN;x<=cx+ax+MARGIN;x+=2){
      if(Math.hypot((x-cx)/(ax+MARGIN),(y-cy)/(ay+MARGIN))>1) continue;
      const h=g.hydrologyAt(x,y);
      if(!h.water) continue;
      sum+=h.depth; if(h.depth>max) max=h.depth; n++;
    }
    if(!n||max<WADE*2) continue;
    found++;
    const dv=3*(sum/n)/max;
    assert.ok(dv>=1.7&&dv<=2.9,
      `a backwater's volume development is ${dv.toFixed(2)}. Below 1.7 it is `
      +`sliding back towards the cone the cosine bowl drew; above 2.9 it has no `
      +`margin left at all and is a cylinder.`);
    /* and the margin itself, walked in from the shore along each axis */
    const walk=(dx,dy)=>{
      let x=cx,y=cy,n2=0;
      while(g.hydrologyAt(x,y).water&&n2<400){x+=dx*2;y+=dy*2;n2+=2;}
      let band=0;
      while(band<200){
        x-=dx*2;y-=dy*2;band+=2;
        const h=g.hydrologyAt(x,y);
        if(h.water&&h.depth>WADE) break;
      }
      return band;
    };
    const mx=Math.min(walk(1,0),walk(-1,0)), my=Math.min(walk(0,1),walk(0,-1));
    assert.ok(mx<=12,
      `the wade-depth margin is ${mx} px across the basin's width. A dissolved `
      +`wall crosses the whole depth range inside a quarter of the radius; this `
      +`is the shelf coming back.`);
    rows.push(`  basin ${String(cx).padStart(6)},${String(cy).padStart(6)}  `
      +`z_max ${max.toFixed(2)} m  D_V ${dv.toFixed(2)}  margin ${mx}px x ${my}px`);
  }
  assert.ok(found>=3,`only ${found} backwaters were found to measure`);
  console.log(`\n  SWAMP BASIN FORM — D_V = 3 z_mean / z_max, 1.0 is a cone\n${rows.join('\n')}`);
});

/* Taking the deeper of two basins unions them as sets: the waist keeps a
   notch where neither is deep. `basinUnion` (src/basin.js) blends at the
   waist and is exact elsewhere, so a lone basin keeps its outline. */
test('two basins that touch merge into one, and a lone basin is untouched',()=>{
  const K=MERGE_Q;
  for(const [a,b] of [[1.0,4.2],[0.3,2.0],[2.6,1.0]]){
    /* Exact to the last bit of the subtraction. */
    assert.ok(Math.abs(basinUnion(a,b,K)-Math.min(a,b))<1e-12,
      `metrics ${a} and ${b} are more than ${K} apart and still got blended; a `
      +`pond on its own must keep the outline it had`);
  }
  /* Waist: two touching shores make water. */
  const waist=basinUnion(1,1,K);
  assert.ok(waist<1&&waist>=1-K/4-1e-12,
    `two shorelines that touch produce metric ${waist.toFixed(4)}; at or above 1 `
    +`the waist stays dry and the pair draws as a figure of eight`);
  /* Never deeper than the blend width allows. */
  let worst=0;
  for(let a=0;a<=3;a+=0.01)for(let d=-K;d<=K;d+=0.01)
    worst=Math.max(worst,Math.min(a,a+d)-basinUnion(a,a+d,K));
  assert.ok(worst<=K/4+1e-9,
    `basinUnion pulls a metric down by ${worst.toFixed(4)}, past its own ${(K/4).toFixed(4)} bound`);
  console.log(`\n  BASIN UNION — exact beyond ${K}, waist at ${waist.toFixed(3)}, `
    +`worst pull ${worst.toFixed(4)}`);
});

/* ── Allowed water-body shapes ──────────────────────────
   Three rejected pictures, one number each.

   · Figure of eight. Two overlapping basins cut with the deeper depth keep
     both outlines, crossing at a waist. `basinUnion` above fixes it.
   · Half moon. A sinkhole draining its backwater leaves a crescent, whose
     area centroid lies outside it.
   · Stamp. An ellipse has two axes of symmetry. Hutchinson's shoreline
     development D_L = P/2√(πA) does not catch it: 1.00 for a circle, 1.02 for
     an ellipse of aspect 1.6. The stamp is caught by departure from the
     body's best-fit ellipse (second moments). D_L holds the other end: over
     1.45 the outline is no longer one pond.

   Proportion is separate: eleven lakes at D_L 1.2 can be eleven copies. The
   spread of aspect and bearing shows the lattice is not printing one pond. */
const GY=2;
function deepWaterField(g,x0,x1,y0,y1,step){
  const W=Math.ceil((x1-x0)/step),H=Math.ceil((y1-y0)/(step/GY));
  const wet=new Uint8Array(W*H);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const h=g.hydrologyAt(Math.round(x0+i*step),Math.round(y0+j*step/GY));
    wet[j*W+i]=h.water&&h.depth>SWAMP_WADE_M?1:0;
  }
  return {wet,W,H,x0,y0,step};
}
function bodiesIn(f,minCells){
  const {wet,W,H}=f,seen=new Uint8Array(W*H),out=[];
  for(let s=0;s<W*H;s++){
    if(!wet[s]||seen[s]) continue;
    const cells=[],stack=[s];seen[s]=1;
    while(stack.length){
      const p=stack.pop();cells.push(p);
      const i=p%W,j=(p/W)|0;
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const a=i+di,b=j+dj,q=b*W+a;
        if(a<0||b<0||a>=W||b>=H||seen[q]||!wet[q]) continue;
        seen[q]=1;stack.push(q);
      }
    }
    if(cells.length<minCells) continue;
    /* ground coordinates throughout: the grid is square on the ground */
    let mx=0,my=0;
    for(const p of cells){mx+=(p%W);my+=((p/W)|0);}
    mx/=cells.length;my/=cells.length;
    let sxx=0,syy=0,sxy=0;
    for(const p of cells){
      const dx=(p%W)-mx,dy=((p/W)|0)-my;
      sxx+=dx*dx;syy+=dy*dy;sxy+=dx*dy;
    }
    sxx/=cells.length;syy/=cells.length;sxy/=cells.length;
    const tr=sxx+syy,det=sxx*syy-sxy*sxy;
    const l1=tr/2+Math.sqrt(Math.max(0,tr*tr/4-det));
    const l2=tr/2-Math.sqrt(Math.max(0,tr*tr/4-det));
    out.push({cells:cells.length,
      cx:Math.round(f.x0+mx*f.step),cy:Math.round(f.y0+my*f.step/GY),
      inside:!!f.wet[Math.round(my)*W+Math.round(mx)],
      /* the ellipse the second moments name: for a uniform one, l = (semi/2)² */
      semiA:2*Math.sqrt(l1)*f.step, semiB:2*Math.sqrt(l2)*f.step,
      aspect:Math.sqrt(l1/Math.max(1e-6,l2)),
      bearing:0.5*Math.atan2(2*sxy,sxx-syy)});
  }
  return out;
}
function outlineOf(g,b,N=128){
  const r=new Array(N).fill(0);
  for(let i=0;i<N;i++){
    const a=i/N*Math.PI*2,ux=Math.cos(a),uy=Math.sin(a);
    for(let d=0;d<=560;d+=2){
      const h=g.hydrologyAt(Math.round(b.cx+ux*d),Math.round(b.cy+uy*d/GY));
      if(h.water&&h.depth>SWAMP_WADE_M) r[i]=d;
      else if(r[i]&&d-r[i]>26) break;
    }
  }
  let P=0,A=0,mean=0,dev=0;
  for(let i=0;i<N;i++){
    const a=i/N*Math.PI*2,c=(i+1)/N*Math.PI*2,rn=r[(i+1)%N];
    P+=Math.hypot(rn*Math.cos(c)-r[i]*Math.cos(a),rn*Math.sin(c)-r[i]*Math.sin(a));
    A+=0.5*Math.abs(r[i]*rn*Math.sin(c-a));
    const t=a-b.bearing;
    const fit=1/Math.hypot(Math.cos(t)/b.semiA,Math.sin(t)/b.semiB);
    dev+=Math.abs(r[i]-fit)/N; mean+=r[i]/N;
  }
  return {DL:A>0?P/(2*Math.sqrt(Math.PI*A)):0, ellipseDev:dev/Math.max(1,mean)};
}

test('no body of water is a stamp, a crescent, or two ponds',()=>{
  const rows=[];
  for(const seed of [SEED,7,999666333]){
    const g=makeWorldGen(seed,OPT);
    const f=deepWaterField(g,-620,620,-1080,1080,8);
    const bodies=bodiesIn(f,120);
    assert.ok(bodies.length>=5,
      `seed ${seed}: only ${bodies.length} bodies of open water in the window`);
    const aspects=[],bearings=[];
    for(const b of bodies){
      assert.ok(b.inside,
        `seed ${seed}: the body at ${b.cx},${b.cy} does not contain its own `
        +`area centroid. That is what a crescent is — a pond with a bite taken `
        +`out of the side facing something else.`);
      const o=outlineOf(g,b);
      assert.ok(o.ellipseDev>=0.06,
        `seed ${seed}: the body at ${b.cx},${b.cy} sits within `
        +`${(o.ellipseDev*100).toFixed(1)}% of its own best-fit ellipse. That `
        +`is a stamp: two axes of symmetry, and the projection drew both.`);
      assert.ok(o.DL<=1.45,
        `seed ${seed}: the body at ${b.cx},${b.cy} has shoreline development `
        +`${o.DL.toFixed(3)}; past 1.45 an outline has stopped being one pond.`);
      aspects.push(b.aspect);bearings.push(b.bearing);
      rows.push(`  ${String(b.cx).padStart(6)},${String(b.cy).padStart(6)}  `
        +`D_L ${o.DL.toFixed(3)}  off-ellipse ${(o.ellipseDev*100).toFixed(0).padStart(2)}%  `
        +`aspect ${b.aspect.toFixed(2)}  bearing ${(b.bearing*180/Math.PI).toFixed(0).padStart(4)}°`);
    }
    /* Proportion varies. Authored as two screen radii, every basin is the
       same 1.55 wide: a halved depth axis on a round hollow. */
    const spread=Math.max(...aspects)/Math.min(...aspects);
    assert.ok(spread>=1.35,
      `seed ${seed}: the widest body is only ${spread.toFixed(2)}x the `
      +`proportion of the narrowest. A field of ponds all built to one `
      +`proportion is a field of stamps.`);
    const bs=[...bearings].sort((a,b)=>a-b);
    const arc=(bs[bs.length-1]-bs[0])*180/Math.PI;
    assert.ok(arc>=60,
      `seed ${seed}: every body lies within ${arc.toFixed(0)}° of the same `
      +`bearing; they are one shape rotated by nothing.`);
  }
  console.log(`\n  OUTLINES — off its own ellipse by 6%+, D_L under 1.45, `
    +`centroid inside\n${rows.join('\n')}`);
});

/* ── A tone boundary inside one body of water is a seam ─────────
   Measured failure: a bright line against a dark one across the lakehouse
   basin's open water, following the shore for 971 px with flat teal either
   side. A pond bottom is continuous.

   Two causes. The smaller is the quantiser. The larger is two straight-line
   fits in place of the derived ladder: they stack both of a pond's tone
   boundaries inside the 3 px the solution wall spends crossing them and leave
   the two darkest of five rungs unused. See swampT in src/sunlight.js and
   SEAM_PX in src/shaders/world.js.

   Rule: flat, seam, flat. A plateau meeting a plateau with no dithered pixels
   between is a bare cut, illegal only where the field is gentle enough for a
   seam. A wall crossing a rung inside a pixel can only draw a clean step. The
   bound is on the longest connected bare run. */
const BARE_CUT_PX=40;
test('no tone boundary inside one body of water runs as a line',()=>{
  const shader=readFileSync(new URL('../src/shaders/world.js',import.meta.url),'utf8');
  const seam=(n)=>{
    const m=shader.match(new RegExp(`${n}\\s*=\\s*([0-9.]+)`));
    assert.ok(m,`${n} is gone from the ground shader; the seam has no budget`);
    return +m[1];
  };
  const SEAM_PX=seam('SEAM_PX'),SEAM_MIN=seam('SEAM_MIN'),SEAM_MAX=seam('SEAM_MAX');
  assert.ok(SEAM_MIN<=0.08,`gentle terrain seam floor ${SEAM_MIN} is too wide`);
  /* The 8x8 Bayer table the GPU gets, read from src/palette.js. */
  const bay=readFileSync(new URL('../src/palette.js',import.meta.url),'utf8')
    .match(/const B=\[([^\]]*)\]/)[1].split(',').map(v=>+v.trim());
  assert.equal(bay.length,64,'the Bayer table is not 64 entries');
  const bayer=(x,y)=>Math.round((bay[((y%8+8)%8)*8+((x%8+8)%8)]+0.5)/64*255)/255;

  rebuildPalette();
  const g=makeWorldGen(SEED,OPT);
  const WATER=[SURF.flooded,SURF.swampWater];
  const W=320,H=180,PLATEAU=4;
  const rows=[];
  const settlement=g.POI.find(q=>q.kind==='swampSettlement');
  for(const [name,p] of [['lakehouse',g.swampLakehouse],['settlement',settlement]]){
    const x0=Math.round(p.x-W/2), y0=Math.round(p.y-H*0.55);
    const chunks=new Map();
    const at=(wx,wy)=>{
      const kx=Math.floor(wx/CH),ky=Math.floor(wy/CH),k=`${kx},${ky}`;
      if(!chunks.has(k))chunks.set(k,g.bakeChunk(kx,ky));
      const c=chunks.get(k),o=((wy-ky*CH)*CH+(wx-kx*CH))*4;
      return {t:c.geom[o]/255,flag:Math.round(c.geom[o+3]/FLAG_Q)};
    };
    const T=new Float64Array(W*H), FL=new Int16Array(W*H).fill(-1);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const s=at(x0+x,y0+y);
      if(WATER.indexOf(s.flag)<0) continue;
      FL[y*W+x]=s.flag; T[y*W+x]=s.t;
    }
    /* fieldSlope, then the ground pass quantiser. A rung is keyed by colour:
       the two windows overlap by three rungs, so the wade line where the flag
       changes is usually no change of tone. */
    const axis=(bk,fw,t0)=>{
      const n=(bk!==null?1:0)+(fw!==null?1:0);
      return n?((bk!==null?t0-bk:0)+(fw!==null?fw-t0:0))/n:0;
    };
    const tone=new Int32Array(W*H).fill(-1), gentle=new Uint8Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const fl=FL[y*W+x]; if(fl<0) continue;
      const ramp=RAMP[SURFACE[fl].ramp], n=ramp.length, t=T[y*W+x];
      const nb=(dx,dy)=>{
        const xx=x+dx,yy=y+dy;
        return (xx<0||yy<0||xx>=W||yy>=H||FL[yy*W+xx]!==fl)?null:T[yy*W+xx];
      };
      const slope=Math.hypot(axis(nb(-1,0),nb(1,0),t),axis(nb(0,-1),nb(0,1),t));
      const want=SEAM_PX*slope*(n-1);
      gentle[y*W+x]=want<=SEAM_MAX?1:0;
      const f=clamp(t,0,1)*(n-1);
      /* SURFACE picks the quantiser: glslSurfacePaint emits rampDither only
         for a row whose dither column is set, so a row losing it fails here. */
      let r;
      if(SURFACE[fl].dither){
        let e=clamp((f-Math.floor(f)-0.5)/Math.min(SEAM_MAX,Math.max(SEAM_MIN,want))+0.5,0,1);
        e=Math.floor(e*2+0.5)/2;
        r=Math.floor(f)+(bayer(x0+x,y0+y)<e?1:0);
      }else r=Math.floor(f+0.5);
      const c=ramp[clamp(r,0,n-1)];
      tone[y*W+x]=(Math.round(c[0])<<16)|(Math.round(c[1])<<8)|Math.round(c[2]);
    }
    /* The ladder is spent. The straight-line fits draw three tones of five. */
    const tones=new Set(); for(const k of tone) if(k>=0) tones.add(k);
    assert.ok(tones.size>=SWAMP_LADDER,
      `${name}: open water draws ${tones.size} of the ${SWAMP_LADDER} tones its\n`
      +`    optical ladder derives. Rungs the depth axis never reaches are a ramp\n`
      +`    the physics paid for and the bake declined to index.`);

    const K=(x,y)=>(x<0||y<0||x>=W||y>=H)?-1:tone[y*W+x];
    const run=(x,y,dx,dy,v)=>{
      let k=0; while(k<PLATEAU&&K(x+dx*k,y+dy*k)===v) k++;
      return k;
    };
    const bare=new Uint8Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const a=tone[y*W+x]; if(a<0||!gentle[y*W+x]) continue;
      for(const [dx,dy] of [[1,0],[0,1]]){
        const b=K(x+dx,y+dy);
        if(b<0||b===a||!gentle[(y+dy)*W+x+dx]) continue;
        if(run(x,y,-dx,-dy,a)<PLATEAU||run(x+dx,y+dy,dx,dy,b)<PLATEAU) continue;
        bare[y*W+x]=1; bare[(y+dy)*W+x+dx]=1;
      }
    }
    const seen=new Uint8Array(W*H);
    let longest=0, worst=null;
    for(let i=0;i<W*H;i++){
      if(!bare[i]||seen[i]) continue;
      const stack=[i]; seen[i]=1; let size=0;
      while(stack.length){
        const j=stack.pop(); size++;
        const x=j%W, y=(j/W)|0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const xx=x+dx,yy=y+dy;
          if(xx<0||yy<0||xx>=W||yy>=H) continue;
          const k=yy*W+xx;
          if(bare[k]&&!seen[k]){ seen[k]=1; stack.push(k); }
        }
      }
      if(size>longest){ longest=size; worst=[x0+i%W,y0+((i/W)|0)]; }
    }
    rows.push(`    ${name.padEnd(11)} ${tones.size} tones, longest bare cut `
      +`${String(longest).padStart(3)} px${worst?` at ${worst[0]},${worst[1]}`:''}`);
    assert.ok(longest<=BARE_CUT_PX,
      `${name}: ${longest} px of one tone boundary runs bare at ${worst}, on a field\n`
      +`    gentle enough to have carried a seam. Two flat tones meeting along a\n`
      +`    line the eye can follow is a hard cut, and open water has no edge in it.`);
  }
  console.log(`\n  WATER TONES — flat, seam, flat; a bare cut stays under `
    +`${BARE_CUT_PX} px\n${rows.join('\n')}`);
});

/* A reach is a crossing. One slough the length of the world beside the trail,
   0.86 m deep, is `walk:false` throughout: a wall down the map. Karst drainage
   is discontinuous (water sinks at swallets and resurges at springs), so the
   channel is short reaches between basins, with a floor under the wade line
   by construction. */
test('a reach is a channel you can wade, and it links one basin to the next',()=>{
  const g=makeWorldGen(SEED,OPT);
  const rows=[];
  for(const b of g.swampChain(-1400,1400)){
    if(b.kind!=='basin') continue;
    const vx=b.reach.x-b.cx, vy=b.reach.y-b.cy, L=Math.hypot(vx,vy);
    const nx=-vy/L, ny=vx/L;
    /* The ford is the riffle, not the halfway mark. A reach is graded: pool
       floor at each mouth, a riffle between. Mouths of different sizes put
       the sill off centre, and one reach runs past the mooring pool, so the
       halfway mark measures a pond. Some station along the run must have
       wadeable deepest water. */
    let ford=Infinity,at=0,wide=0;
    for(let i=6;i<=34;i++){
      const t=i/40, cx=b.cx+vx*t, cy=b.cy+vy*t;
      let deepest=0,wet=0;
      for(let s=-140;s<=140;s++){
        const h=g.hydrologyAt(Math.round(cx+nx*s),Math.round(cy+ny*s));
        if(h.water){deepest=Math.max(deepest,h.depth);wet++;}
      }
      if(wet<8) continue;                   // a dry station between dry bands
      if(deepest<ford){ford=deepest;at=t;wide=wet;}
    }
    if(!Number.isFinite(ford)) continue;    // a dry reach between two dry bands
    assert.ok(ford<=SWAMP_WADE_M,
      `the reach out of the basin at ${Math.round(b.cx)},${Math.round(b.cy)} is `
      +`${ford.toFixed(2)} m deep at its shallowest crossing. Anything past `
      +`${SWAMP_WADE_M} m is water the traveller cannot cross, and a channel `
      +`with no ford anywhere along it divides the world.`);
    rows.push(`  basin ${String(Math.round(b.cx)).padStart(6)},`
      +`${String(Math.round(b.cy)).padStart(6)}  ford at ${at.toFixed(2)} of the run  `
      +`${String(wide).padStart(3)} px across  z ${ford.toFixed(2)} m`);
  }
  assert.ok(rows.length>=4,`only ${rows.length} reaches were found to measure`);
  console.log(`\n  REACHES — pool, riffle, pool; the riffle is the crossing`
    +`\n${rows.join('\n')}`);
});

test('nothing in the swamp divides the map',()=>{
  const g=makeWorldGen(SEED,OPT);
  /* Connectivity: walkable ground on an 8 px grid, flood-filled from every
     walkable cell on the west edge. A barrier leaves the east edge
     unreachable and the component a fraction of the walkable ground. */
  const S=8,R=1400,N=(R*2/S)|0;
  const walk=new Uint8Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)
    walk[j*N+i]=g.traversalAt(-R+i*S,-R+j*S).walk?1:0;
  let total=0; for(let i=0;i<walk.length;i++) total+=walk[i];
  const seen=new Uint8Array(N*N),stack=[];
  for(let j=0;j<N;j++) if(walk[j*N]){seen[j*N]=1;stack.push(j*N);}
  let reached=0,east=0;
  while(stack.length){
    const p=stack.pop(),i=p%N,j=(p/N)|0;
    reached++;
    if(i===N-1) east++;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const a=i+di,b=j+dj;
      if(a<0||b<0||a>=N||b>=N) continue;
      const q=b*N+a;
      if(walk[q]&&!seen[q]){seen[q]=1;stack.push(q);}
    }
  }
  assert.ok(east>0,'the west edge of the swamp cannot reach the east edge on foot');
  const share=reached/total;
  assert.ok(share>=0.97,
    `the walkable swamp is in pieces: the component holding the west edge is `
    +`${(share*100).toFixed(1)}% of it. Deep water is allowed to be an obstacle `
    +`to walk around and is not allowed to be a wall.`);
  console.log(`\n  CONNECTIVITY — ${(share*100).toFixed(1)}% of walkable ground is one `
    +`component, ${east} cells of the east edge reachable from the west`);
});

test('the swamp is a sparse walkable land-water mosaic',()=>{
  const g=makeWorldGen(SEED,OPT),p=g.swampSettlement.landing;
  let water=0,walkable=0,shallow=0,deep=0,n=0;
  for(let y=p.y-480;y<=p.y+480;y+=8)
  for(let x=p.x-640;x<=p.x+640;x+=8){
    const h=g.hydrologyAt(x,y),t=g.traversalAt(x,y);
    n++;water+=h.water?1:0;walkable+=t.walk?1:0;
    shallow+=t.medium==='shallow'?1:0;deep+=t.medium==='deep'?1:0;
  }
  const cover={water:water/n,walkable:walkable/n,shallow:shallow/n,deep:deep/n};
  /* Two bounds. The wadeable forest floor carries the water and the sections
     carry the depth, so wet cover and uncrossable cover are separate. Measured
     over eight seeds: standing water 15-26%, walkable 92.6-93.5%, wadeable
     1.2-2.6x deep. */
  assert.ok(cover.water>=0.12&&cover.water<=0.30,
    `standing water covers ${(cover.water*100).toFixed(1)}% instead of a wetland mosaic`);
  assert.ok(cover.walkable>=0.92,
    `only ${(cover.walkable*100).toFixed(1)}% of the sampled swamp is traversable`);
  assert.ok(cover.shallow>cover.deep,
    `wadeable water is ${(cover.shallow*100).toFixed(1)}% against ${(cover.deep*100).toFixed(1)}% `
    +`deep. A forested wetland is water you stand in with holes in it, not holes `
    +`with a rim of water you stand in.`);
  /* The flooded forest cannot reach the wade line: bias plus both fbm
     amplitudes stay under it. Every deep pixel is a section: a channel bed, a
     solution basin or a wallow. */
  let floorMax=0;
  const chain=g.swampChain(-1800,1800);
  /* Sections come from the generator's swampChain. */
  const L=g.swampLakehouse&&g.swampLakehouse.pond;
  const MARGIN=30;
  const onSection=(x,y)=>{
    /* The lakehouse owns its own hole. */
    if(L&&Math.hypot((x-L.cx)/(L.rx+MARGIN),(y-L.cy)/(L.ry+MARGIN))<1) return true;
    for(const b of chain){
      if(Math.hypot((x-b.cx)/(b.rx+MARGIN),(y-b.cy)/(b.ry+MARGIN))<1) return true;
      if(!b.reach) continue;
      const vx=b.reach.x-b.cx,vy=b.reach.y-b.cy;
      const t=Math.max(0,Math.min(1,((x-b.cx)*vx+(y-b.cy)*vy)/(vx*vx+vy*vy)));
      if(Math.hypot(x-(b.cx+vx*t),y-(b.cy+vy*t))<b.reach.halfW+MARGIN) return true;
    }
    return false;
  };
  for(let y=-1800;y<=1800;y+=6)for(let x=-1800;x<=1800;x+=6){
    if(onSection(x,y)) continue;
    const d=g.hydrologyAt(x,y).depth;
    if(d>floorMax) floorMax=d;
  }
  assert.ok(floorMax<=SWAMP_WADE_M,
    `the seasonally flooded forest reaches ${floorMax.toFixed(2)} m, past the `
    +`${SWAMP_WADE_M} m wade line. Deep water is supposed to be a section and `
    +`only a section; the floor has grown a hole of its own.`);
  assert.ok((SURFACE.length-1)*FLAG_Q<=255,'surface flags exceed their persisted byte');

  const inherited=new Set(['birch','spruce','snag','bramble','reed','log',
                           'palm','meadowTree','shrub','sward']);
  const cx=Math.floor(p.x/CH),cy=Math.floor(p.y/CH),seen=new Set();
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const c=g.bakeChunk(cx+dx,cy+dy);
    for(const q of c.props)seen.add(q.kind);
    c.tex.dispose();
  }
  assert.deepEqual([...seen].filter(k=>inherited.has(k)),[],
    'the swamp inherited plant assets from an earlier habitat');
});

/* The margin is planted. A duckweed mat drawn as a surface flag measures an
   unbroken 10-20 px green band around every pond, 0.53% of ground in one ring,
   at a relative luminance within 4% of the bank (duckweed 0.265, swampGround
   0.276): one material to the eye. A surface has no silhouette, shadow or top.
   The margin carries Rosa palustris. */
test('the waterline is planted with a plant, not painted with a surface',()=>{
  const g=makeWorldGen(SEED,OPT);
  assert.ok(HABITAT.swampRose.dry&&HABITAT.swampRose.wet,
    'the margin shrub lost the shore falloff that puts it on the waterline');
  const c0=Math.floor(-576/CH);
  let roses=0,onMargin=0,duckweed=0,pixels=0;
  const shoreDist=(x,y)=>{
    const wet=g.hydrologyAt(x,y).water;
    for(let r=1;r<=40;r++)for(let a=0;a<12;a++){
      const X=Math.round(x+Math.cos(a/12*Math.PI*2)*r);
      const Y=Math.round(y+Math.sin(a/12*Math.PI*2)*r);
      if(g.hydrologyAt(X,Y).water!==wet) return r;
    }
    return 99;
  };
  for(let cy=c0;cy<c0+5;cy++)for(let cx=-2;cx<=2;cx++){
    const c=g.bakeChunk(cx,cy);
    for(let i=0;i<CH*CH;i++){
      pixels++;
      if(Math.round(c.geom[i*4+3]/FLAG_Q)===SURF.duckweed) duckweed++;
    }
    for(const q of c.props){
      if(q.kind!=='swampRose') continue;
      roses++;
      if(shoreDist(q.x,q.y)<=16) onMargin++;
    }
    c.tex.dispose();
  }
  assert.equal(duckweed,0,
    `${duckweed} of ${pixels} baked pixels are still a painted duckweed mat`);
  assert.ok(roses>=20,`only ${roses} swamp roses grew across 25 chunks`);
  assert.ok(onMargin/roses>=0.80,
    `only ${(onMargin/roses*100).toFixed(0)}% of the swamp roses stand within 16 px `
    +`of a waterline. A margin shrub scattered over the whole biome is not a `
    +`margin shrub, it is undergrowth.`);
  /* The duckweed ramp stays in use on the sedge. */
  assert.equal(SPECIES.sedge.ramp2,'duckweed');
  console.log(`\n  MARGIN — ${roses} swamp roses, ${onMargin} of them on a waterline, `
    +`${duckweed} painted duckweed pixels`);
});

test('bald cypress owns a bounded excurrent spray grammar',()=>{
  assert.equal(SPECIES.cypress.model,'cypress');
  for(const tier of [3,4])for(let seed=0;seed<24;seed++){
    const h=Math.round(tierHeight(tier)*ATLAS_S*
      (SPECIES_H.cypress/SPECIES_H.birch));
    const sp=makeTree('cypress',h,new RNG((SEED^(seed*7919))>>>0),1,0.78,0);
    let left=0,right=0;
    for(let y=0;y<sp.h;y++){
      left+=sp.occ[y*sp.w]?1:0;
      right+=sp.occ[y*sp.w+sp.w-1]?1:0;
    }
    assert.ok(Math.max(left,right)/sp.h<0.25,
      `cypress tier ${tier} seed ${seed} is clipped along a sprite side`);
  }
});

test('Florida strangler fig compiles a broad crown and grounded root curtain',()=>{
  assert.equal(SPECIES.stranglerFig.model,'strangler');
  assert.ok(SPECIES.stranglerFig.cfg.leafAspect<=0.45,
    'strangler fig reverted to round generic broadleaf lobes');
  assert.deepEqual(HABITAT.stranglerFig.depth,[0,0.12]);
  assert.ok(LAYERS.find(L=>L.kinds.length===1&&L.kinds[0]==='stranglerFig').cell>=300,
    'strangler figs no longer read as rare habitat landmarks');
  for(const tier of [4,5])for(let seed=0;seed<24;seed++){
    const h=Math.round(tierHeight(tier)*ATLAS_S*
      (SPECIES_H.stranglerFig/SPECIES_H.birch));
    const sp=makeTree('stranglerFig',h,
      new RNG((SEED^(seed*7919))>>>0),1,0.78,0);
    const groups=[];
    for(let y=Math.floor(sp.h*0.58);y<Math.floor(sp.h*0.82);y++){
      let n=0,on=false;
      for(let x=0;x<sp.w;x++){
        const m=sp.occ[y*sp.w+x],wood=m===1||m===9;
        if(wood&&!on)n++;
        on=wood;
      }
      groups.push(n);
    }
    groups.sort((a,b)=>a-b);
    let left=0,right=0;
    for(let y=0;y<sp.h;y++){
      left+=sp.occ[y*sp.w]?1:0;
      right+=sp.occ[y*sp.w+sp.w-1]?1:0;
    }
    assert.ok(groups[Math.floor(groups.length/2)]>=3,
      `strangler fig tier ${tier} seed ${seed} lost its root curtain`);
    assert.ok(sp.occ.some(m=>m===9),
      `strangler fig tier ${tier} seed ${seed} lost its wind-flexible aerial roots`);
    assert.ok(Math.max(left,right)/sp.h<0.25,
      `strangler fig tier ${tier} seed ${seed} clips a sprite side`);
    assert.ok(sp.w/sp.h>0.45,'strangler fig lost its broad-crown silhouette');
    assert.ok(Math.max(...sp.lobes.map(q=>q[0]))<=h*SPECIES.stranglerFig.cfg.leafMax+1e-9,
      'strangler fig reverted to oversized spherical foliage lobes');
  }
});

test('aerial roots share wind deformation with a legible projected shadow',()=>{
  assert.match(SPRITE_FS,/aerialRoot/);
  assert.match(SPRITE_FS,/rootShift/);
  assert.match(W_SHADOW_FS,/rootSampleAt\(0\.0\)/);
  assert.match(W_SHADOW_FS,/rootSampleAt\(-1\.0\)/);
  assert.match(W_SHADOW_FS,/rootSampleAt\(1\.0\)/);
  assert.match(W_SHADOW_FS,/vPhase<0\.0/);
});

test('open undercroft timber paints but does not cast projected shadow',()=>{
  assert.match(W_SHADOW_FS,/matId>11\.5&&matId<12\.5/);
  assert.match(SPRITE_FS,/mat > 11\.5 && mat < 12\.5/);
});

test('pile houses keep readable X braces and a height-correct floor shadow cast',()=>{
  const floorPx=Math.round(SWAMP_HOUSE.floorM*PX_PER_M);
  const wallPx=Math.round(SWAMP_HOUSE.wallM*PX_PER_M);
  const roofPx=Math.round(1.05*PX_PER_M);
  /* Same shear as W_SHADOW_VS / setLight: uLen = 0.55/Lz, k = uLen/Lz,
     tip = |(-Lx,-Ly)·hAbove·k| with outdoor squash 0.55 on y. */
  const tipAt=(hAbove,Lx,Ly,Lz)=>{
    const uLen=clamp(0.55/Math.max(0.13,Lz),0.4,4.0);
    const k=uLen/Math.max(0.30,Lz);
    return Math.hypot(Math.abs(-Lx*hAbove*k),Math.abs(-Ly*hAbove*k)*0.55);
  };
  const L={x:-0.55,y:-0.43,z:0.72};
  const n=Math.hypot(L.x,L.y,L.z),Lx=L.x/n,Ly=L.y/n,Lz=L.z/n;
  const tipFloor=tipAt(floorPx,Lx,Ly,Lz);
  const tipHouse=tipAt(floorPx+wallPx+roofPx,Lx,Ly,Lz);
  assert.ok(floorPx>=34&&floorPx<=38,
    `floor ${floorPx}px is not design-flood+freeboard at project scale`);
  assert.ok(Math.abs(tipAt(2*floorPx,Lx,Ly,Lz)-2*tipFloor)<0.05,
    'shadow tip must scale linearly with caster height');
  assert.ok(tipFloor>18,
    `elevated deck at ${floorPx}px throws only ${tipFloor.toFixed(1)}px`);
  assert.ok(tipHouse>tipFloor*1.8,
    `full house tip ${tipHouse.toFixed(1)}px should outrun the deck tip ${tipFloor.toFixed(1)}px`);
  console.log(`swamp house floor ${SWAMP_HOUSE.floorM.toFixed(2)} m = ${floorPx}px; `
    +`deck tip ≈ ${tipFloor.toFixed(1)}px, roof tip ≈ ${tipHouse.toFixed(1)}px `
    +`(L=(${Lx.toFixed(2)},${Ly.toFixed(2)},${Lz.toFixed(2)}))`);

  for(let v=0;v<3;v++){
    const sp=makeSwampHouse(new RNG(SEED^v),v);
    const base=sp.h-1,fy=base-floorPx;
    /* Piles come from swampHousePiles, shared with the drawing and braces.
       The house is a cabinet volume: its sheet is wider than its front face
       by the return, so `sp.w-8` is a column of side face. */
    const piles=swampHousePiles(v);
    const box=swampHouseBox(v),x0=Math.max(2,Math.round(SWAMP_HOUSE.eaveM*PX_PER_M));
    const wallL=x0,wallR=x0+box.w-1;
    let deck=0;
    for(let y=fy;y<fy+3&&y<sp.h;y++)for(let x=wallL;x<=wallR;x++)
      if(sp.occ[y*sp.w+x])deck++;
    assert.ok(deck>=box.w*2,
      `variant ${v}: elevated deck is only ${deck} opaque px across a ${box.w}px face`);
    /* Legs cast, braces do not. Material 12 is for thin members whose bars
       fight the elevated body's sun cast. Applied to the stilts too, the
       lowest caster is the floor plate 36 rows up. Measured on the lakehouse:
       the shadow begins fourteen rows clear of the building's feet with lit
       ground between, and the house hovers. */
    let open=0,legCast=0,strayCast=0;
    /* Both rows. The back legs stand on the ground under the floor's back
       edge and are solid timber, so they cast (docs/CANON.md: a structure is
       tied to the ground by the members that touch it). */
    const legXs=[...piles,...piles.map(p=>p+box.cols)];
    const onLeg=x=>legXs.some(p=>Math.abs(x-p)<=SWAMP_PILE_HALF);
    for(let y=fy+3;y<base;y++)for(let x=0;x<sp.w;x++){
      const m=sp.occ[y*sp.w+x];
      if(m===12)open++;
      else if(m===1){ if(onLeg(x))legCast++; else strayCast++; }
    }
    assert.ok(open>150,`variant ${v}: the braces should be no-cast timber (got ${open})`);
    assert.ok(legCast>0,`variant ${v}: the stilts cast nothing, so the house hovers`);
    assert.equal(strayCast,0,
      `variant ${v}: ${strayCast} px of open bracing still casts bars`);
    /* The ground row: braces spring from `base-1`, so their endpoints there
       are material 12 by design. The foot must cast. */
    for(const p of piles) assert.equal(sp.occ[base*sp.w+p],1,
      `variant ${v}: the pile foot on the ground is not casting timber`);
    /* Four corners. One row of posts under the front edge of a floor 4.2 m
       deep hovers over its back half. The back row stands under the floor's
       back edge: `rows` up-screen, `cols` right, the same length. */
    for(const p of piles) assert.equal(sp.occ[(base-box.rows)*sp.w+p+box.cols],1,
      `variant ${v}: there is no back leg under the floor's back edge, so the `
      +`house is carried on a single line of posts`);
    for(const p of piles)for(let q=-SWAMP_PILE_HALF;q<=SWAMP_PILE_HALF;q++)
      assert.equal(sp.occ[(base-box.rows)*sp.w+p+box.cols+q],1,
        `variant ${v}: rear pile ${p} is too narrow to cast a readable shadow`);
    const deckPx=Math.max(3,M(0.22));
    const backRight=piles.at(-1)+box.cols;
    const backEdge=x0+box.w+1+box.cols;
    const connectionY=fy+deckPx-2-box.rows;
    for(let x=backRight;x<=backEdge;x++)
      assert.equal(sp.occ[connectionY*sp.w+x],1,
        `variant ${v}: the rear-right pile leaves a gap before the floor return`);
    const legs=swampHousePileDX(v);
    assert.equal(legs.length,6,
      `the collider knows ${legs.length} legs and the house draws six`);
    assert.ok(legs.some(q=>q.dy!==0),
      'every collider leg sits on the front row, so you walk through the back');
    for(let x=wallL;x<=wallR;x++)
      assert.equal(sp.occ[fy*sp.w+x],1,`variant ${v}: deck must remain a casting plate`);
    for(let i=0;i<piles.length-1;i++){
      const a=piles[i],b=piles[i+1];
      const deck=Math.max(3,Math.round(0.22*PX_PER_M));
      const top=fy+deck+Math.round((base-(fy+deck))*0.10);
      for(const [x0,x1] of [[a,b],[b,a]]){
        let hit=0,samples=0;
        const steps=Math.max(Math.abs(x1-x0),Math.abs(top-(base-1)));
        for(let s=0;s<=steps;s++){
          const t=s/steps;
          const x=Math.round(x0+(x1-x0)*t),y=Math.round((base-1)+(top-(base-1))*t);
          samples++;
          for(let q=-1;q<=1;q++)if(sp.occ[y*sp.w+(x+q)]||sp.occ[(y+q)*sp.w+x]){hit++;break;}
        }
        assert.ok(hit/samples>=0.85,
          `variant ${v} bay ${i}: diagonal ${x0}->${x1} only covers ${(hit/samples*100).toFixed(0)}%`);
      }
    }
    /* The sun picks the lit side from the normals. shade is discarded for
       wood, and a planar wall is one value (PIXEL-ART.md section 6), so no
       gradient is asserted across the front. The face ladder holds: the
       front is brighter than the return under any sun. */
    const front=sp.ao[fy*sp.w+wallL+2];
    let side=0,sideN=0;
    for(let i=0;i<sp.w*sp.h;i++)
      if(sp.occ[i]&&sp.nx[i]>0.6){side+=sp.ao[i];sideN++;}
    assert.ok(sideN>0,`variant ${v}: the house has no return at all`);
    assert.ok(front>side/sideN,
      `variant ${v}: the front face reads ${front.toFixed(2)} and the return `
      +`${(side/sideN).toFixed(2)}. Top lightest, side darkest, or the corner `
      +`stops being a corner.`);
    /* The volume has a roof top face. */
    let top=0;
    for(let i=0;i<sp.w*sp.h;i++)
      if(sp.occ[i]&&sp.ny[i]<-0.6&&sp.nz[i]>0.2&&Math.abs(sp.nx[i])<0.5)top++;
    assert.ok(top>box.w*box.rows*0.5,
      `variant ${v}: the roof draws ${top} top-face px over a ${box.w}x${box.rows} `
      +`plan. docs/CANON.md: a building carries its own depth axis.`);
  }
});

test('pile-house doors occupy their own framed facade bay',()=>{
  for(let v=0;v<3;v++){
    const box=swampHouseBox(v),openings=swampHouseOpenings(v);
    for(const [a,b] of openings.bays)
      assert.ok(b<openings.door.x0-1,
        `variant ${v}: screened bay ${a}-${b} runs into door ${openings.door.x0}`);
    assert.equal(openings.door.fy1,box.h-1,
      `variant ${v}: the door stops above the raised floor`);
    const sp=makeSwampHouse(new RNG(SEED^v),v);
    const x0=eavePx(SWAMP_HOUSE.eaveM),fy=sp.h-1-M(SWAMP_HOUSE.floorM);
    const yTop=fy-box.h+1,door=openings.door;
    const head=(yTop+door.fy0)*sp.w+x0+door.x0+(door.x1-door.x0>>1);
    const inside=(yTop+door.fy0+3)*sp.w+x0+door.x0+2;
    assert.ok(sp.ao[head]>sp.ao[inside]*4,
      `variant ${v}: door frame and opening resolve as one window value`);
  }
});

test('pile-house return and roof spend discrete depth facets',()=>{
  for(let v=0;v<3;v++){
    const sp=makeSwampHouse(new RNG(SEED^v),v);
    const box=swampHouseBox(v),x0=eavePx(SWAMP_HOUSE.eaveM);
    const floor=M(SWAMP_HOUSE.floorM),roof=M(SWAMP_HOUSE.roofM);
    const fy=sp.h-1-floor,yTop=fy-box.h+1;
    const side=[];
    for(let band=0;band<3;band++){
      const values=[];
      for(let r=1;r<=box.rows;r++){
        if(Math.floor((r-1)*3/box.rows)!==band)continue;
        const x=x0+box.w-1+r,y=yTop+(box.h>>1)-r;
        values.push(sp.ao[y*sp.w+x]);
      }
      side.push(Math.max(...values));
    }
    assert.ok(side[1]-side[0]>0.15&&side[2]-side[0]>0.06,
      `variant ${v}: return facets ${side.map(q=>q.toFixed(2)).join('/')} collapse flat`);

    const half=(box.w-1)/2,span=box.w/2+x0;
    let fx=3;
    while(Math.abs(Math.round(fx-half))%6===0)fx++;
    const rise=roof-Math.round(roof*Math.min(1,Math.abs(fx-half)/span));
    const yFront=yTop-rise;
    const values=[0,Math.floor(box.rows*0.45),Math.floor(box.rows*0.80)]
      .map(r=>sp.ao[(yFront-r)*sp.w+x0+fx+r]);
    assert.ok(values[0]-values[1]>0.15&&values[2]-values[1]>0.10,
      `variant ${v}: roof depth facets ${values.map(q=>q.toFixed(2)).join('/')} collapse flat`);
  }
});

test('the meadow portal stays clear of pile-house sprites',()=>{
  const g=makeWorldGen(SEED,OPT),s=g.swampSettlement;
  const portal=g.portals.find(p=>p.id==='meadow');
  assert.ok(portal,'swamp meadow portal is missing');
  for(const h of s.houses){
    const under=Math.abs(portal.x-h.x)<78&&portal.y<=h.y+8&&portal.y>=h.y-110;
    assert.equal(under,false,
      `portal at ${portal.x},${portal.y} sits under house at ${h.x},${h.y}`);
  }
  assert.ok(portal.y<s.landing.y-120,
    `portal y=${portal.y} is not on the north approach clear of the landing`);
});

test('the dock reads as pilings and a plank deck, not a floating bar',()=>{
  const sp=makeSwampProp('swampDock');
  assert.ok(sp.h>=20,`dock height ${sp.h} is still a flat bar`);
  let piles=0,deck=0;
  for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++){
    const m=sp.occ[y*sp.w+x];
    if(m===12&&y>8)piles++;
    if(m===1&&y<=8)deck++;
  }
  assert.ok(piles>20,'dock lost its piles');
  assert.ok(deck>40,'dock lost its plank deck');
});

test('the settlement compiles flood clearance and shared inventions without timber corridors',()=>{
  const g=makeWorldGen(SEED,OPT),s=g.swampSettlement;
  assert.ok(s);
  assert.equal(s.houses.length,4);
  /* No timber corridor: the settlement states no boardwalk and no made surface. */
  assert.equal(s.boardwalks,undefined);
  assert.equal(s.surfaceAt,undefined);
  assert.ok(SWAMP_HOUSE.floorM>=SWAMP_HOUSE.designFloodM+SWAMP_HOUSE.freeboardM);
  assert.ok(SWAMP_HOUSE.freeboardM>=0.5);
  for(const h of s.houses){
    for(const q of g.alligatorHoles)
      assert.ok(Math.hypot(h.x-q.x,h.y-q.y)>=q.r+84,
        'a pile house entered an alligator core refuge');
  }
  const kinds=new Set(s.architecture.map(x=>x.kind));
  for(const k of ['swampHouse','swampDock','swampSkiff','swampRack','swampCistern',
                   'swampMooring','swampTrap','swampWinch','swampChest'])
    assert.ok(kinds.has(k),`${k} is absent from the cultural plan`);
  assert.deepEqual(Object.keys(s.culture.roles).sort(),
    ['swampBoatwright','swampFisher']);
});

test('compiled settlement pixels keep planned props and no forced trail corridor',()=>{
  const g=makeWorldGen(SEED,OPT),s=g.swampSettlement;
  assert.equal(g.plan.worldTrail,false);
  const anchors=[...s.architecture,s.landing],chunks=new Map();
  const chunk=(x,y)=>{
    const cx=Math.floor(x/CH),cy=Math.floor(y/CH),key=`${cx},${cy}`;
    if(!chunks.has(key))chunks.set(key,g.bakeChunk(cx,cy));
    return chunks.get(key);
  };
  const props=new Map();
  for(const a of anchors)for(const p of chunk(a.x,a.y).props)
    props.set(`${p.kind}:${p.x}:${p.y}`,p);
  for(const a of s.architecture){
    const p=props.get(`${a.kind}:${a.x}:${a.y}`);
    assert.ok(p,`${a.kind} was not emitted`);
    if(a.kind==='swampHouse')
      assert.equal(p.foot,`swampHouse:${a.variant||0}`,
        `swamp house variant ${a.variant||0} omitted its floor shadow caster`);
    if(a.kind==='swampHouse')
      assert.equal(p.footLift,swampHouseFloorPx(),
        `swamp house variant ${a.variant||0} starts its body shadow on the ground`);
    if(a.kind==='swampHouse'){
      assert.equal(p.legFoot,'swampPile');
      assert.deepEqual(p.shadowFeet,swampHousePileDX(a.variant||0));
    }
  }
  /* Spine points past the landing follow hydrology: no bright peat or
     boardwalk from a world-trail corridor. */
  for(const dy of [80,160,240]){
    const x=Math.round(g.pathX(s.landing.y+dy)),y=s.landing.y+dy,c=chunk(x,y);
    const o=((y-c.oy)*CH+(x-c.ox))*4+3;
    const flag=Math.round(c.geom[o]/FLAG_Q);
    assert.notEqual(flag,SURF.boardwalk,
      `spine ${x},${y} baked as boardwalk`);
    if(flag===SURF.peat){
      const t=c.geom[o-3]/255;
      assert.ok(t<0.70,`spine peat at ${x},${y} still reads as a bright trail (t=${t.toFixed(2)})`);
    }
  }
  for(const c of chunks.values())c.tex.dispose();
});

test('shallow flooded floor matches dry hummock travel speed',()=>{
  const g=makeWorldGen(SEED,OPT),p=g.swampSettlement.landing;
  let shallow=0;
  for(let y=p.y-240;y<=p.y+240;y+=12)
  for(let x=p.x-320;x<=p.x+320;x+=12){
    const t=g.traversalAt(x,y);
    if(t.medium!=='shallow')continue;
    shallow++;
    assert.equal(t.speed,1,`shallow at ${x},${y} still slows travel`);
    assert.equal(t.walk,true);
  }
  assert.ok(shallow>0,'no shallow water sampled near the landing');
  assert.equal(SURFACE[SURF.peat].speed,1);
  assert.equal(SURFACE[SURF.flooded].speed,1);
});

test('swamp clothing and semantic roles use separate executable authorities',()=>{
  /* `swampWood` is the palette's darkest ramp and builds the houses and
     piles, so a resident in it takes the landing's colour. Residents wear
     undyed fleece with an ochre band. FASHION_VOCAB.swamp in src/culture.js
     is the authority; docs/SWAMP.md carries the weather reasoning (short and
     loose, a brim or a hood, nothing padded).

     The traveller keeps one identity while culture dresses him per world:
     `swampCoat` is his warm-rain outerwear, `folkSignal` his face and hands
     in every wardrobe. */
  const SWAMP_FLEECE=new Set(['folkUmber','folkWool']);
  for(const name of ['swampFisher','swampBoatwright']){
    const row=CAST[name];
    assert.ok(SWAMP_FLEECE.has(row.ramp),
      `${name} wears ${row.ramp}, which is not one of this world's fleeces`);
    assert.notEqual(row.ramp,'swampWood',
      `${name} is drawn in the colour of the boardwalk he is standing on`);
    /* warm rain: nothing this world wears is padded, and every head is covered */
    assert.equal(row.fashion.coatBulk,'thin',
      `${name} is padded in a warm swamp`);
    assert.ok(['brim','hood','straw'].includes(row.fashion.hat),
      `${name} has no cover over his face in the rain`);
    /* covered below, loose above: standing water is insects and sawgrass */
    assert.equal(row.fashion.legwear,'trousers',
      `${name} wades this swamp with bare legs`);
  }
  assert.equal(CAST.swampTraveller.ramp,'swampCoat');
  /* Every person in every world has face and hands on `folkSignal`. */
  for(const name of ['swampFisher','swampBoatwright','swampTraveller'])
    assert.equal(CAST[name].ramp2,'folkSignal');
  assert.ok(RESIDENTS.swampFisher.schedule.some((q)=>q.nodeKind==='fish-trap'));
  assert.ok(RESIDENTS.swampBoatwright.schedule.some((q)=>q.nodeKind==='water-mark'));
  const plans=makeWorldGen(SEED,OPT).compileLifePlans().residents;
  assert.ok(plans.find((q)=>q.profileId==='swampFisher').duties.includes('report-damage'));
  assert.ok(plans.find((q)=>q.profileId==='swampBoatwright').duties.includes('repair-shared-infrastructure'));
});

test('swamp chunk work and atlas growth stay deterministically bounded',t=>{
  const g=makeWorldGen(SEED,OPT),s=g.swampSettlement,chunks=[];
  for(const [x,y] of [[s.landing.x,s.landing.y],
                       [g.alligatorHoles[0].x,g.alligatorHoles[0].y],
                       [s.houses[0].x,s.houses[0].y]]){
    const c=g.bakeChunk(Math.floor(x/CH),Math.floor(y/CH));
    chunks.push({geom:c.geom.length,props:c.props.length,solids:c.solids.length,
      water:c.water.length,columns:c.colWater.length});
    c.tex.dispose();
  }
  const packed=bakeWorldAtlas(buildWorldAtlas(SEED,0,'swamp'));
  const pile=swampPileSlab(),pileRect=packed.rects['foot:swampPile'];
  assert.ok(pileRect,'primary swamp piles have no packed shadow footprint');
  assert.ok(pileRect.w>=pile.hx*2+pile.shear&&pileRect.h>=pile.back);
  for(let v=0;v<3;v++){
    const slab=swampHouseSlab(v),r=packed.rects[`foot:swampHouse:${v}`];
    assert.ok(r,`swamp house variant ${v} has no packed floor shadow caster`);
    assert.ok(r.w>=Math.round(slab.hx*2)+slab.shear&&r.h>=slab.back,
      `swamp house variant ${v} floor caster is smaller than its slab`);
  }
  const swampRects=Object.keys(packed.rects).filter(k=>
    /^(swamp|alligator|heron|turtle)/.test(k)).length;
  const figRects=Object.keys(packed.rects).filter(k=>k.startsWith('stranglerFig:')).length;
  const reflectionBytes=320*180*4;
  if(REPORT_ENABLED)
    t.diagnostic(`swamp chunk work ${chunks.map(q=>`${q.props}p/${q.solids}s`).join(' ')} `+
      `atlas ${packed.W}x${packed.H}; `+
      `${swampRects} swamp rects, ${figRects} fig rects; `+
      `320x180 reflection target ${reflectionBytes} bytes`);
  console.log({chunks,atlas:[packed.W,packed.H],swampRects,figRects,reflectionBytes});
  for(const chunk of chunks){
    assert.deepEqual([chunk.geom,chunk.water,chunk.columns],
      [CH*CH*4,CH*CH,CH],'a streamed chunk changed its fixed raster work');
    assert.ok(chunk.props<=64&&chunk.solids<=64,
      'a streamed chunk exceeded its bounded placement work');
  }
  assert.ok(packed.W<=2048&&packed.H<=2048,'the swamp atlas exceeded its texture budget');
  assert.ok(swampRects>=80,'the reported atlas omitted swamp banks');
  assert.ok(figRects>=3,'the atlas omitted the strangler fig bank');
  packed.nrm.dispose();packed.mat.dispose();
});

test('wet soil is a rim on every waterline, and the floor is one tone',()=>{
  /* AUTHORITY: RIM and paintSwamp in src/world/ground.js, the peat row in
     src/surface.js. Standing water keeps soil wet up to the capillary fringe
     above its table, so the wet band on a bank is that height over the bank's
     slope, and its narrowest case is a bank at repose. The rim is cut from that
     narrowest band, so no peat waterline lacks it. MEASURED with the wet state
     as an area: 20% of the floor on a second colour, rejected in review.
     MEASURED with the rim on low ground only: gaps along one shore, rejected as
     inconsistent. The paint is the ground shader's `t + ndl*gain` on a flat
     floor. */
  const g=makeWorldGen(SEED,OPT),peat=SURFACE[SURF.peat];
  const rungs=RAMP[peat.ramp].length,reach=RIM.wetSoil.solid+RIM.wetSoil.wash;
  const narrowest=peat.capillaryM/Math.tan(peat.repose*Math.PI/180)*PX_PER_M;
  assert.ok(reach<=narrowest,
    `the rim reaches ${reach} ground px; the capillary band at repose is ${narrowest.toFixed(2)}`);
  const tones=new Map();
  let wet=0,stray=0,shore=0,gaps=0;
  for(const [cx,cy] of [[0,2],[1,2],[0,3],[-1,3]]){
    const c=g.bakeChunk(cx,cy,true),geom=c.geom;
    const flag=(x,y)=>Math.round(geom[(y*CH+x)*4+3]/FLAG_Q);
    for(let y=0;y<CH;y++)for(let x=0;x<CH;x++){
      if(flag(x,y)!==SURF.peat) continue;
      const t=geom[(y*CH+x)*4];
      tones.set(t,(tones.get(t)||0)+1);
    }
    const dry=Math.max(...tones.keys());
    /* interior pixels only: the water that wets a border pixel may lie in the
       next chunk */
    for(let y=reach+1;y<CH-reach-1;y++)for(let x=reach+1;x<CH-reach-1;x++){
      if(flag(x,y)!==SURF.peat) continue;
      const isWet=geom[(y*CH+x)*4]!==dry;
      let touches=false,near=false;
      for(let dy=-reach;dy<=reach;dy++)for(let dx=-reach;dx<=reach;dx++){
        if(!c.water[(y+dy)*CH+x+dx]) continue;
        near=true;
        if(Math.abs(dx)<=1&&Math.abs(dy)<=1) touches=true;
      }
      if(isWet){ wet++; if(!near) stray++; }
      if(touches){ shore++; if(!isWet) gaps++; }
    }
  }
  const states=[...tones.keys()].sort((a,b)=>a-b);
  assert.equal(states.length,2,`peat carries ${states.length} tones, expected floor and wet rim`);
  assert.ok(shore>500,`only ${shore} shore pixels sampled`);
  assert.equal(gaps,0,`${gaps} of ${shore} peat pixels touch water and are not wet: the rim has a gap`);
  assert.equal(stray,0,`${stray} of ${wet} wet pixels lie more than ${reach} px from water`);
  const share=tones.get(states[0])/(tones.get(states[0])+tones.get(states[1]));
  console.log(`  WET RIM: ${(share*100).toFixed(2)}% of the swamp floor, ${shore} shore pixels, no gap`);
  assert.ok(share<0.08,`the wet rim is ${(share*100).toFixed(1)}% of the floor; a rim stays under 8%`);
  for(const el of [4,25,40,60,86]){
    const ndl=Math.sin(el*Math.PI/180);
    const [rim,floor]=states.map((t)=>Math.round(Math.min(1,t/255+peat.ndl*ndl)*(rungs-1)));
    assert.equal(floor-rim,1,`sun at ${el} degrees: rim paints rung ${rim}, floor rung ${floor}`);
  }
});
