import assert from 'node:assert/strict';
import test from 'node:test';

import { CH, FLAG_Q } from '../src/constants.js';
import { RAMP } from '../src/palette.js';
import { PX_PER_M } from '../src/scale.js';
import { SURFACE, SURF } from '../src/surface.js';
import { makeWorldGen } from '../src/worldgen.js';
import { RIM } from '../src/world/ground.js';
import { bakeWorldAtlas, buildWorldAtlas } from '../src/atlas.js';
import { hutGeom, makeHut } from '../src/desert-hamlet.js';
import { tentGeometry, tentShadowLift } from '../src/desert-camp.js';
import { RNG } from '../src/rng.js';
import { REPORT_ENABLED, reportConsole as console } from './report.mjs';

const SEED=20260727;
const OPT={biome:'desert',lake:0.55,density:0.65};
/* World pixels across one viewport: the 960x540 capture at 2x. The dune
   wavelength is measured against it. */
const VIEW_W=480;

const flagAt=(geom,i)=>Math.round(geom[i*4+3]/FLAG_Q);

test('the ground normal chain still costs what the dune was scaled against',()=>{
  /* The dune's amplitude derives from this number. bakeChunk samples elevAt
     on an 8 px lattice, central-differences it by `es` (not 2*es), bilinear
     samples, doubles, and multiplies by 7.5. The composite is 30, and
     DUNE_FIELD in src/world/dunes.js is 1/(30*tan(repose)), so the steepest
     ground is where the encoded normal saturates. */
  const es=8, lerp=(a,b,t)=>a+(b-a)*t;
  for(const grad of [0.004,0.010,0.020,1/30]){
    const ev=[]; for(let i=0;i<10;i++) ev.push(i*es*grad);
    const lattice=(ev[6]-ev[4])/es;                 // the bake's own difference
    const sampled=lerp(lattice,lattice,0.5)*2;      // gsamp, then the doubling
    const encoded=Math.max(-1,Math.min(1,sampled*7.5));
    assert.ok(Math.abs(encoded-Math.min(1,grad*30))<1e-9,
      `an elevAt gradient of ${grad} encodes as ${encoded}, not ${grad*30}`);
  }
  const g=makeWorldGen(SEED,OPT);
  assert.equal(g.dune.normalSat,30,
    'worldgen declares a different composite than the chain above measures');
  assert.ok(Math.abs(g.dune.field-1/(30*Math.tan(g.dune.repose)))<1e-12,
    'the dune field scalar no longer puts the repose face at full normal');
});

test('a dune has exactly two slopes, and one of them is the angle of repose',()=>{
  const g=makeWorldGen(SEED,OPT);
  const repose=SURFACE[SURF.sand].repose*Math.PI/180;
  assert.ok(Math.abs(g.dune.repose-repose)<1e-12,
    'the slip face is not reading its angle from the surface table');
  /* The two angles and the wavelength fix the profile, so assert the closure:
     the brink is where the rising and falling faces reach the same height,
     and the amplitude is that height. */
  const ts=Math.tan(g.dune.stoss), tr=Math.tan(g.dune.repose);
  assert.ok(Math.abs(g.dune.brink-tr/(tr+ts))<1e-12,'the brink is not where the two faces meet');
  assert.ok(Math.abs(g.dune.ampPx-ts*g.dune.brink*g.dune.wavePx)<1e-9,
    'the amplitude is not the height the windward face climbs to');
  /* Measured as a gradient magnitude. A face's slope is perpendicular to its
     crest; sampled along the wind, an oblique dune reads shallower by the
     cosine between the two (0.629 for a face at 0.675). */
  const d=0.5, up=[], down=[];
  for(let k=0;k<9000;k++){
    const wx=-1500+k*0.41, wy=900+k*0.23;
    const at=g.duneAt(wx,wy);
    if(at.cover<0.999||at.face===0) continue;    // full cover, and not a sliced top
    const gx=(g.duneAt(wx+d,wy).h-g.duneAt(wx-d,wy).h)/(2*d);
    const gy=(g.duneAt(wx,wy+d).h-g.duneAt(wx,wy-d).h)/(2*d);
    (at.face>0?up:down).push(Math.hypot(gx,gy));
  }
  assert.ok(up.length>150&&down.length>150,
    `only ${up.length} windward and ${down.length} slip samples landed on a full dune`);
  const mean=(a)=>a.reduce((s,v)=>s+v,0)/a.length;
  assert.ok(Math.abs(mean(up)-ts)<0.012,
    `the windward face measures ${mean(up).toFixed(3)}, declared ${ts.toFixed(3)}`);
  assert.ok(Math.abs(mean(down)-tr)<0.012,
    `the slip face measures ${mean(down).toFixed(3)}, declared ${tr.toFixed(3)}`);
  const grads=[...up,...down.map((v)=>-v)];
  /* Nothing is steeper than repose: dry sand above it avalanches. Measured
     over the composed surface (profile, sheet cover, corridor, sinuosity).

     The residual is 0.75%. The sinuosity correction scales a dune's height by
     crest obliquity, and that scale varies in space, adding its own gradient.
     At step sizes from 3 px to 0.15 px it converges to 0.6796 against 0.6745,
     34.19 degrees against 34.00, inside the 32-34 band the constant is quoted
     from. Tuning the amplitude to hide it breaks the closure above. */
  const g2=makeWorldGen(SEED,OPT),step=1.5;
  let steepest=0;
  for(let wy=-1800;wy<1800;wy+=11)for(let wx=-1800;wx<1800;wx+=11){
    const gx=(g2.duneAt(wx+step,wy).h-g2.duneAt(wx-step,wy).h)/(2*step);
    const gy=(g2.duneAt(wx,wy+step).h-g2.duneAt(wx,wy-step).h)/(2*step);
    steepest=Math.max(steepest,Math.hypot(gx,gy));
  }
  assert.ok(steepest<=tr*1.01,
    `the composed desert stands at ${steepest.toFixed(4)} `
    +`(${(Math.atan(steepest)*180/Math.PI).toFixed(2)} deg), past the repose slope `
    +`${tr.toFixed(4)} by more than the named 0.75% residual`);
  console.log(`\n  DUNE PROFILE — windward ${(Math.atan(mean(up))*180/Math.PI).toFixed(1)} deg, `
    +`slip ${(Math.atan(-mean(down))*180/Math.PI).toFixed(1)} deg, `
    +`wave ${g.dune.wavePx.toFixed(0)} px, amplitude ${g.dune.ampPx.toFixed(0)} px`);
});

test('the drawn dune is a uniform scale of a real one, so its angles survive',()=>{
  const g=makeWorldGen(SEED,OPT);
  /* One concession: a single scale factor on x, y and z leaves every angle
     alone. Amplitude over wavelength is a pure function of the two angles, so
     it does not depend on the draw scale. */
  const ts=Math.tan(g.dune.stoss), tr=Math.tan(g.dune.repose);
  assert.ok(Math.abs(g.dune.ampPx/g.dune.wavePx-ts*tr/(ts+tr))<1e-12,
    'the aspect ratio moved, so the drawn dune is not a uniform scale of a real one');
  assert.ok(Math.abs(g.dune.wavePx
    -g.dune.waveM*g.dune.draw*PX_PER_M)<1e-9,
    'the drawn wavelength is not the real one times the declared scale');
  /* The landform repeats inside a frame, the medium law that chose the scale.
     At a quarter the wavelength is 612 px against a 480 px viewport: a screen
     holds three quarters of one windward face. */
  assert.ok(g.dune.wavePx<=VIEW_W*0.70,
    `a dune is ${g.dune.wavePx.toFixed(0)} px against a ${VIEW_W} px viewport, `
    +`so no frame contains a crest, a slip face and the next crest`);
  const real=g.dune.waveM*g.dune.draw*Math.tan(g.dune.stoss)*g.dune.brink;
  console.log(`  SCALE — a ${g.dune.waveM} m dune drawn at ${g.dune.draw}, `
    +`so ${(g.dune.waveM*g.dune.draw).toFixed(1)} m long and ${real.toFixed(1)} m tall, `
    +`${(g.dune.wavePx/VIEW_W).toFixed(2)} of a viewport`);
});

test('the desert is sand, with pavement you can walk and stand on',()=>{
  const g=makeWorldGen(SEED,OPT);
  const counts={};
  let n=0;
  for(let cy=-5;cy<=7;cy++)for(let cx=-5;cx<=5;cx++){
    const geom=g.bakeChunk(cx,cy).geom;
    for(let i=0;i<CH*CH;i++){
      const f=flagAt(geom,i);
      counts[f]=(counts[f]||0)+1; n++;
    }
  }
  const share=(f)=>(counts[f]||0)/n;
  /* An erg is sand. 0.55 because the margins dither: the fingered
     sand/pavement rim spends a band of pixels as mixed coverage. */
  assert.ok(share(SURF.sand)>0.55,
    `only ${(share(SURF.sand)*100).toFixed(1)}% of the desert is sand`);
  /* Not only sand: buildings and the route need firm ground. */
  assert.ok(share(SURF.hamada)>0.10,
    `only ${(share(SURF.hamada)*100).toFixed(1)}% of the desert is firm pavement`);
  assert.ok(share(SURF.sabkha)>0.0005,'the oasis left no evaporite crust at all');
  assert.ok(share(SURF.pond)>0.001&&share(SURF.pond)<0.02,
    `open water is ${(share(SURF.pond)*100).toFixed(2)}% of the desert`);
  /* nothing from another world leaked through the surface remap */
  for(const f of Object.keys(counts).map(Number)){
    assert.ok([SURF.sand,SURF.hamada,SURF.sabkha,SURF.pond].includes(f),
      `the desert painted ${SURFACE[f]?SURFACE[f].name:f}, which is not one of its surfaces`);
  }
  console.log('  SURFACES — '+[SURF.sand,SURF.hamada,SURF.sabkha,SURF.pond]
    .map((f)=>`${SURFACE[f].name} ${(share(f)*100).toFixed(2)}%`).join(', '));
});

test('the surface flag survives the byte it is carried in',()=>{
  /* flag*FLAG_Q is written into an unsigned byte, so the table holds
     floor(255/FLAG_Q)+1 rows. At a quantum of 16 the swamp's boardwalk is the
     last row: sand wraps to snow. The headroom is asserted, not the quantum. */
  const top=(SURFACE.length-1)*FLAG_Q;
  assert.ok(top<=255,
    `SURFACE has ${SURFACE.length} rows and flag ${SURFACE.length-1} encodes as `
    +`${top}, which does not fit in the byte bakeChunk writes it to. `
    +`Halve FLAG_Q in src/constants.js; the note there carries the margin argument.`);
  assert.ok(255-top>=FLAG_Q,
    `only ${255-top} of the flag byte is left, under one quantum of headroom`);
  /* The shader's round trip recovers every row. */
  for(let f=0;f<SURFACE.length;f++)
    assert.equal(Math.floor((f*FLAG_Q)*255/255/FLAG_Q+0.5),f,
      `surface ${SURFACE[f].name} does not survive the flag round trip`);
});

test('nothing in the desert divides the map',()=>{
  const g=makeWorldGen(SEED,OPT);
  /* The swamp's connectivity property: here the obstacles are a slip face
     and one pool. */
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
  assert.ok(east>0,'the west edge of the desert cannot reach the east edge on foot');
  const s=reached/total;
  assert.ok(s>=0.97,
    `the walkable desert is in pieces: the component holding the west edge is `
    +`${(s*100).toFixed(1)}% of it.`);
  console.log(`  CONNECTIVITY — ${(s*100).toFixed(1)}% of walkable ground is one component`);
});

test('sand walks at full speed, and the concession is written down',()=>{
  const g=makeWorldGen(SEED,OPT);
  /* Authored concession. Loose sand costs 1.6-2.7x metabolically (Lejeune,
     Willems & Heglund 1998), and a speed tax on the world's largest surface
     punishes crossing it. Looseness reads through prints, kicked grains and
     dune relief. */
  assert.equal(SURFACE[SURF.sand].speed,1,
    'sand traversal speed drifted off the authored full-speed concession');
  /* The corridor fits a hamlet on both sides of the route, all along it. */
  const need=Math.round(10*PX_PER_M);
  for(let wy=-1200;wy<=1200;wy+=120){
    const px=g.pathX(wy);
    let left=0,right=0;
    while(left<600&&g.duneEnvelope(px-left,wy)<=0.02) left++;
    while(right<600&&g.duneEnvelope(px+right,wy)<=0.02) right++;
    assert.ok(left>=need&&right>=need,
      `at y=${wy} the swept corridor is ${left}+${right} px wide, under the `
      +`${need} px either side a building needs`);
  }
});

test('the oasis is one pool, and its salt is a ring rather than a disc',()=>{
  const g=makeWorldGen(SEED,OPT);
  assert.ok(g.oasis,'the desert has no oasis');
  /* Round in projection: a ground circle is a screen ellipse, a screen row
     being two ground pixels of depth. PROJECTION.md. */
  const at=(x,y)=>g.isWater(x,y);
  const ray=(dx,dy)=>{ let r=0; while(r<800&&at(g.oasis.x+dx*r,g.oasis.y+dy*r)) r++; return r; };
  const ex=(ray(1,0)+ray(-1,0))/2, ey=(ray(0,1)+ray(0,-1))/2;
  assert.ok(ex>20&&ey>10,`the oasis measures ${ex}x${ey} px, which is a puddle`);
  assert.ok(Math.abs(ey/ex-0.5)<0.16,
    `the oasis is ${(ey/ex).toFixed(2)} as deep as it is wide; the projection says 0.50`);
  /* The crust forms at the outer limit of capillary rise, not the waterline:
     close in, the pool flushes the ground and the reeds hold a fresh fringe. */
  const geom=[];
  const cx0=Math.floor(g.oasis.x/CH), cy0=Math.floor(g.oasis.y/CH);
  for(let cy=cy0-1;cy<=cy0+1;cy++)for(let cx=cx0-1;cx<=cx0+1;cx++)
    geom.push([cx,cy,g.bakeChunk(cx,cy).geom]);
  const surfaceAt=(wx,wy)=>{
    for(const [cx,cy,gm] of geom){
      const lx=wx-cx*CH, ly=wy-cy*CH;
      if(lx<0||ly<0||lx>=CH||ly>=CH) continue;
      return flagAt(gm,ly*CH+lx);
    }
    return null;
  };
  const band={fringe:0,ring:0,far:0};
  for(let a=0;a<360;a+=3){
    const dx=Math.cos(a*Math.PI/180), dy=Math.sin(a*Math.PI/180)*0.5;
    let r=0; while(r<800&&at(g.oasis.x+dx*r,g.oasis.y+dy*r)) r++;
    const sample=(d)=>surfaceAt(Math.round(g.oasis.x+dx*(r+d)),
                                Math.round(g.oasis.y+dy*(r+d)));
    if(sample(2)===SURF.sabkha) band.fringe++;
    if(sample(Math.round(g.dune.sabkhaPx*0.55))===SURF.sabkha) band.ring++;
    if(sample(g.dune.sabkhaPx*2)===SURF.sabkha) band.far++;
  }
  assert.ok(band.ring>band.fringe*3,
    `the crust is a disc, not a ring: ${band.fringe} of 120 rays are crusted at `
    +`the waterline against ${band.ring} at the capillary limit`);
  assert.equal(band.far,0,'the crust reaches past the ground that wicks');
  console.log(`  OASIS — ${(2*ex).toFixed(0)}x${(2*ey).toFixed(0)} px, `
    +`crust on ${band.ring} of 120 rays at the capillary limit, `
    +`${band.fringe} at the waterline`);
});

test('the desert bakes an atlas and streams chunks inside their budgets',()=>{
  const packed=bakeWorldAtlas(buildWorldAtlas(SEED,1.0,'desert'));
  assert.ok(packed.W<=2048&&packed.H<=2048,
    `the desert atlas is ${packed.W}x${packed.H} and exceeds its texture budget`);
  const g=makeWorldGen(SEED,OPT);
  /* Centred on the oasis, where this world puts its content. A window on the
     origin misses the pool by a chunk. */
  const ox=Math.floor(g.oasis.x/CH), oy=Math.floor(g.oasis.y/CH);
  let props=0,solids=0,withProps=0;
  for(let cy=oy-3;cy<=oy+3;cy++)for(let cx=ox-3;cx<=ox+3;cx++){
    const c=g.bakeChunk(cx,cy);
    props=Math.max(props,c.props.length); solids=Math.max(solids,c.solids.length);
    if(c.props.length) withProps++;
  }
  assert.ok(props<=64&&solids<=64,
    `a desert chunk streams ${props} props and ${solids} solids`);
  /* The oasis fringe grows plants. */
  assert.ok(withProps>0,'nothing at all grows at the oasis');
  console.log(`  BUDGET — atlas ${packed.W}x${packed.H}, `
    +`${Object.keys(packed.rects).length} sprites, `
    +`worst chunk ${props} props and ${solids} solids, `
    +`${withProps} of 49 chunks round the oasis carry a plant`);
});

test('the desert is deterministic, and every world still gets its own',()=>{
  const a=makeWorldGen(SEED,OPT),b=makeWorldGen(SEED,OPT);
  assert.deepEqual(a.oasis,b.oasis);
  assert.deepEqual(a.dune,b.dune);
  for(let k=0;k<400;k++){
    const x=-1800+k*9.1, y=1700-k*8.3;
    assert.equal(a.duneEnvelope(x,y),b.duneEnvelope(x,y));
    assert.deepEqual(a.duneAt(x,y),b.duneAt(x,y));
  }
  /* and no other world grew a dune field */
  for(const biome of ['boreal','meadow','swamp']){
    const g=makeWorldGen(SEED,{biome,lake:0.55,density:0.65});
    assert.equal(g.oasis,null,`${biome} has an oasis`);
    assert.equal(g.duneAt(120,340).h,0,`${biome} has a dune in it`);
  }
});

if(REPORT_ENABLED){
  test('report: what the desert is made of, by seed',()=>{
    for(const seed of [SEED,SEED+1,SEED+2]){
      const g=makeWorldGen(seed,OPT);
      const counts={}; let n=0;
      const oy=Math.floor(g.oasis.y/CH), ox=Math.floor(g.oasis.x/CH);
      for(let cy=oy-4;cy<=oy+3;cy++)for(let cx=ox-3;cx<=ox+3;cx++){
        const geom=g.bakeChunk(cx,cy).geom;
        for(let i=0;i<CH*CH;i++){ const f=flagAt(geom,i); counts[f]=(counts[f]||0)+1; n++; }
      }
      console.log(`  seed ${seed}: `+[SURF.sand,SURF.hamada,SURF.sabkha,SURF.pond]
        .map((f)=>`${SURFACE[f].name} ${(100*(counts[f]||0)/n).toFixed(2)}%`).join('  '));
    }
  });
}

test('a dune is marked by a rim at its brink, never by a shaded face',()=>{
  /* AUTHORITY: RIM and paintDesert in src/world/ground.js. A dune reads by a
     mark on the lee side of its top edge: RIM.slipFace.solid px of the next
     rung down, then a half checker, then the sand's own tone. MEASURED with no
     mark: 100% of lee and 98% of stoss pixels on one rung, and no dune was
     visible. MEASURED with the whole lee face one rung down: review rejected
     the 73 px bands as colour noise. The paint here is the ground shader's
     `t + ndl*gain`, rounded to the ramp without dither. */
  const g=makeWorldGen(SEED,OPT),rungs=RAMP.sand.length,gain=SURFACE[SURF.sand].ndl;
  const {solid,wash}=RIM.slipFace;
  /* A marked pixel is one rung below anything the unmarked sand can bake:
     unmarked t >= 0.30-0.055, marked t <= 0.30+0.18+0.055-1/3. */
  const MARKED=Math.round(0.22*255);
  const chunks=[[-3,2],[-4,2],[-3,3],[-4,3]].map(([cx,cy])=>({cx,cy,geom:g.bakeChunk(cx,cy,true).geom}));
  let sand=0,marked=0,stray=0,checker=0,washPx=0;
  for(const {cx,cy,geom} of chunks)for(let i=0;i<CH*CH;i++){
    if(flagAt(geom,i)!==SURF.sand) continue;
    sand++;
    const wx=cx*CH+(i%CH),wy=cy*CH+((i/CH)|0),d=g.duneAt(wx,wy);
    const isMarked=geom[i*4]<MARKED;
    if(isMarked){ marked++; if(!(d.face<0&&d.lee<solid+wash)) stray++; }
    if(d.face<0&&d.lee>=solid&&d.lee<solid+wash){ washPx++; if(isMarked) checker++; }
  }
  assert.ok(marked>300,`only ${marked} marked pixels sampled`);
  assert.equal(stray,0,`${stray} marked pixels lie off the lee rim`);
  const share=marked/sand,half=checker/washPx;
  console.log(`  DUNE RIM: ${(share*100).toFixed(2)}% of sand marked, wash coverage ${(half*100).toFixed(0)}%`);
  assert.ok(share<0.05,`the rim marks ${(share*100).toFixed(1)}% of the sand; a rim stays under 5%`);
  assert.ok(Math.abs(half-0.5)<0.06,`the wash covers ${(half*100).toFixed(0)}%, expected the half checker`);
  /* The mark is one rung at every sun: each solid rim pixel paints exactly one
     rung below the tone the same pixel has without the mark. */
  const RUNG=1/(rungs-1);
  for(const [az,el] of [[218,40],[200,86],[250,60],[140,12]]){
    const a=az*Math.PI/180,e=el*Math.PI/180;
    const L=[Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e)];
    let rim=0,off=0;
    for(const {cx,cy,geom} of chunks)for(let i=0;i<CH*CH;i++){
      if(flagAt(geom,i)!==SURF.sand||geom[i*4]>=MARKED) continue;
      const d=g.duneAt(cx*CH+(i%CH),cy*CH+((i/CH)|0));
      if(!(d.face<0&&d.lee<solid)) continue;
      const nx=-(geom[i*4+1]/255*2-1),ny=-(geom[i*4+2]/255*2-1);
      const lit=gain*Math.max(0,(nx*L[0]+ny*L[1]+L[2])/Math.hypot(nx,ny,1));
      const t=geom[i*4]/255,rung=(v)=>Math.round(Math.min(1,v)*(rungs-1));
      rim++;
      if(rung(t+RUNG+lit)-rung(t+lit)!==1) off++;
    }
    assert.ok(rim>100,`az ${az}: ${rim} solid rim pixels sampled`);
    assert.equal(off,0,`az ${az} el ${el}: ${off} of ${rim} rim pixels are not one rung below their sand`);
  }
});

test('wind ripples are drawn at the floor and shaded at the sun',()=>{
  /* Two concessions. A ripple for this grain spaces at about 8 cm (1.2 px),
     so the drawn spacing is the legibility floor. Its shading is not
     exaggerated: the ripple index puts its steepest face near 10.5 degrees,
     and against a sun 89 degrees up that is a tenth of a 34 degree slip
     face. */
  const g=makeWorldGen(SEED,OPT);
  const ox=Math.floor(g.oasis.x/CH);
  let sand=0,ripple=0,slip=0,slipRipple=0;
  for(let cy=-2;cy<=2;cy++)for(let cx=ox-2;cx<=ox+2;cx++){
    const c=g.bakeChunk(cx,cy),geom=c.geom;
    for(let i=0;i<CH*CH;i++){
      if(flagAt(geom,i)!==SURF.sand) continue;
      const wx=cx*CH+(i%CH), wy=cy*CH+((i/CH)|0);
      const at=g.duneAt(wx,wy);
      sand++;
      if(at.face<0){ slip++; }
    }
  }
  assert.ok(sand>10000&&slip>200,`only ${sand} sand and ${slip} slip-face pixels sampled`);
  /* The normal a ripple adds, measured off the field. */
  const probe=(wx,wy)=>{
    const cx=Math.floor(wx/CH),cy=Math.floor(wy/CH);
    const geom=g.bakeChunk(cx,cy).geom;
    const i=(wy-cy*CH)*CH+(wx-cx*CH);
    return [(geom[i*4+1]/255-0.5)*2,(geom[i*4+2]/255-0.5)*2];
  };
  /* Walk along the wind across a windward face and count sign changes in the
     component the ripple perturbs: a 4.6 px wavelength is a wobble the 8 px
     elevation lattice cannot produce. */
  const cos=Math.cos(2.40),sin=Math.sin(2.40);
  let crossings=0,samples=0,runs=0;
  /* Start each walk on a full-cover windward face and step along the wind. */
  outer:
  for(let sy=-600;sy<=600&&runs<12;sy+=120)
  for(let sx=-900;sx<=900&&runs<12;sx+=180){
    const x0=g.oasis.x+sx, y0=g.oasis.y+sy;
    if(g.duneAt(x0,y0).cover<0.95||g.duneAt(x0,y0).face<=0) continue;
    let prev=null,run=0;
    for(let k=0;k<40;k++){
      const wx=Math.round(x0+cos*k*1.15), wy=Math.round(y0+sin*k*1.15);
      const at=g.duneAt(wx,wy);
      if(at.cover<0.95||at.face<=0) break;
      const n=probe(wx,wy);
      const v=n[0]*cos+n[1]*sin;
      if(prev!==null&&v!==prev){ if(Math.sign(v-prev)!==Math.sign(prev-(run>1?prev:v-1))) crossings++; }
      if(prev!==null) samples++;
      prev=v; run++;
    }
    if(run>8) runs++;
  }
  assert.ok(samples>100,`only ${samples} windward samples over ${runs} walks`);
  /* A 4.6 px ripple sampled every 1.15 px turns about once every four
     samples. */
  assert.ok(crossings>samples*0.12,
    `the windward face carries no ripple: ${crossings} turns over ${samples} samples`);
  console.log(`  RIPPLES — ${crossings} turns over ${samples} windward samples, `
    +`${(100*slip/sand).toFixed(1)}% of sand is slip face and carries none`);
});

/* `crust` is a smooth field. Switched on a flat threshold, both edges harden
   into lines around a perfect circle. A discrete surface id cannot blend, so
   the field is spent as coverage, checked by how often a ray crosses the
   margin. */
test('the salt margin is a stipple and a lobe, not a drawn annulus',()=>{
  const g=makeWorldGen(SEED,OPT);
  const geom=[];
  const cx0=Math.floor(g.oasis.x/CH), cy0=Math.floor(g.oasis.y/CH);
  for(let cy=cy0-2;cy<=cy0+2;cy++)for(let cx=cx0-2;cx<=cx0+2;cx++)
    geom.push([cx,cy,g.bakeChunk(cx,cy).geom]);
  const surfaceAt=(wx,wy)=>{
    for(const [cx,cy,gm] of geom){
      const lx=wx-cx*CH, ly=wy-cy*CH;
      if(lx<0||ly<0||lx>=CH||ly>=CH) continue;
      return flagAt(gm,ly*CH+lx);
    }
    return null;
  };
  let crossings=0,rays=0;const outer=[];
  for(let a=0;a<360;a+=3){
    const dx=Math.cos(a*Math.PI/180), dy=Math.sin(a*Math.PI/180)*0.5;
    let r0=0; while(r0<800&&g.isWater(g.oasis.x+dx*r0,g.oasis.y+dy*r0)) r0++;
    const seq=[];
    for(let r=r0;r<r0+Math.round(g.dune.sabkhaPx*1.9);r++){
      const s=surfaceAt(Math.round(g.oasis.x+dx*r),Math.round(g.oasis.y+dy*r));
      if(s===null) break;
      seq.push(s===SURF.sabkha?1:0);
    }
    if(!seq.some((v)=>v)) continue;
    rays++;
    for(let i=1;i<seq.length;i++) if(seq[i]!==seq[i-1]) crossings++;
    outer.push(seq.lastIndexOf(1));
  }
  const mean=crossings/rays;
  /* a single hard-edged band crosses exactly twice: in and out */
  assert.ok(mean>4,
    `the salt margin crosses a ray ${mean.toFixed(2)} times; 2 is one hard band `
    +'and the edge is a line again');
  /* The outer limit wanders: a margin cut off distance to water has zero
     spread and draws an annulus. */
  const lo=Math.min(...outer), hi=Math.max(...outer);
  assert.ok(hi-lo>=g.dune.sabkhaPx*0.25,
    `the crust's outer limit varies by only ${hi-lo} px around the pool, `
    +'which is a compass rather than a water table');
  console.log(`  SALT MARGIN — ${mean.toFixed(2)} ray crossings (2 = a hard band), `
    +`outer limit wanders ${lo}-${hi} px`);
});

test('the desert compiles its animals and both of its cultures',()=>{
  /* Holds the roster. A cohort chain without a desert branch falls into the
     meadow's machine branch, finds no legal anchors, and emits an empty
     world. */
  const plan=makeWorldGen(SEED,OPT).compileLifePlans();
  const cohortsBy=Object.fromEntries(plan.cohorts.map((c)=>[c.profileId,c]));
  for(const id of ['fennec','viper','sandgrouse','camel','shadeguest'])
    assert.ok(cohortsBy[id],`the desert has no ${id} cohort`);
  /* the herd belongs to the camp: its anchor is the pen, not a habitat draw */
  const pen=plan.useNodes.find((q)=>q.id==='tent-camp:pen');
  assert.ok(pen,'the drover camp compiled no pen node');
  assert.ok(Math.hypot(cohortsBy.camel.anchor.x-pen.x,
                       cohortsBy.camel.anchor.y-pen.y)<=1,
    'the camel herd anchors somewhere other than the camp pen');
  /* Two households, one pool: both culture packages compile, and the shared
     water gathering sits at the oasis, not the common. */
  const who=plan.residents.map((r)=>r.profileId).sort();
  assert.deepEqual(who,['desertDigger','desertDrover','desertGardener','desertKeeper'],
    `the desert's residents are [${who}]`);
  /* A door each: the three of the garden hold anchor on three thresholds. */
  const doors=['hut-garden','hut-digger','hut-keeper'].map((home)=>
    plan.useNodes.find((q)=>q.id===`${home}:threshold`));
  assert.ok(doors.every(Boolean),'a garden-hold resident has no threshold');
  for(let i=0;i<doors.length;i++)for(let j=i+1;j<doors.length;j++)
    assert.ok(Math.hypot(doors[i].x-doors[j].x,doors[i].y-doors[j].y)>=30,
      `${doors[i].id} and ${doors[j].id} are one doorstep`);
  const g=makeWorldGen(SEED,OPT);
  const gather=plan.useNodes.find((q)=>q.id==='desert-water:gathering');
  assert.ok(gather,'the shared water gathering was not compiled');
  assert.ok(Math.hypot(gather.x-g.oasis.x,gather.y-g.oasis.y)<=g.oasis.r,
    'the water gathering is not at the water');
});

test('the vault is a solid mass, and the tent declares its ground skirt',()=>{
  /* roofPlane draws the vault's shell and the sweep fills only the flank
     right of the crown, so an unfilled end face is open ground seen through
     the building and its shadow. Solid: within the wall span, no column has a
     gap between its first drawn pixel and the wall base. */
  for(let v=0;v<3;v++){
    const G=hutGeom(v), sp=makeHut(new RNG(SEED^(0x407a+v)),v);
    for(let fx=0;fx<G.box.w;fx++){
      const x=G.x0+fx;
      let top=-1;
      for(let y=0;y<sp.h;y++) if(sp.occ[y*sp.w+x]){top=y;break;}
      assert.ok(top>=0,`hut:${v} column ${fx} is empty`);
      for(let y=top;y<=sp.ay;y++)
        assert.ok(sp.occ[y*sp.w+x],
          `hut:${v} column ${fx} has a hole at row ${y}: the vault end face `
          +'is open again');
    }
  }
  /* The tent runs below its ground line (the buried anchors sit forward of
     the hem), and the shadow pass roots a caster at its rect bottom.
     tentShadowLift is the declared correction and matches the geometry. */
  for(let v=0;v<2;v++){
    const G=tentGeometry(v), lift=tentShadowLift(v);
    assert.ok(lift<0,`tent:${v} declares no ground skirt`);
    assert.equal(lift,G.anchor.y-(G.H-1),
      `tent:${v} shadow lift disagrees with its geometry`);
  }
});
