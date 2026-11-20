/* ═══════════════════════════════════════════════════════════════════════════
   One frame as a PNG, for visual review.

   test/frame-conformance.mjs measures the GPU output against the world's
   locked palette and keeps no image. This tool writes the same seeded,
   time-pinned, fully-streamed frame as a PNG, with captureOne's SwiftShader
   flags, pinned time and app-control path.

     node tools/shot.mjs                              -> dist/shot.png
     node tools/shot.mjs --res 960x540 --seed 7
     node tools/shot.mjs --at 120,1400 --zoom 3       walk somewhere first
     node tools/shot.mjs --scene meadow               another world
     node tools/shot.mjs --scene meadow --common      the reviewed steading frame
     node tools/shot.mjs --scene meadow --pavilion    accepted tensile pavilion
     node tools/shot.mjs --scene swamp --settlement   amphibious landing and pile houses
     node tools/shot.mjs --oasis                      the desert pool, its crust and reeds
     node tools/shot.mjs --hamlet                     the mudbrick huts on the corridor
     node tools/shot.mjs --camp                       the goat-hair tents out on the sand
     node tools/shot.mjs --worm --time 34             a passage crossing the dune field
     node tools/shot.mjs --scene desert --dunes       a dune train and its slip faces
     node tools/shot.mjs --scene swamp --lakehouse    sinkhole, log house, ladder, chair
     node tools/shot.mjs --scene swamp --alligator-hole  permanent refuge and fauna
     node tools/shot.mjs --scene swamp --strangler-fig   native fig and aerial roots
     node tools/shot.mjs --scene swamp --shoreline-reflection --wind 0
     node tools/shot.mjs --creatures --zoom 4          deterministic boreal cast lineup
     node tools/shot.mjs --deer-motion gallop --zoom 4 all eight deer gait keys
     node tools/shot.mjs --machines --zoom 4           deterministic dream-machine lineup
     node tools/shot.mjs --machines --machine-state greet --time 12.9
     node tools/shot.mjs --machines --time 13.5        inspect another moss-wind phase
     node tools/shot.mjs --scene desert --wear felt-dome,windlass-rope   gear on the traveller
     node tools/shot.mjs --scene meadow --cast kindle --cast-age 2.5   a spell, seconds after the cast
     node tools/shot.mjs --cast tremor --face 1,0 --cast-age 0.6       cast to screen right
     node tools/shot.mjs --cast frost,kindle --cast-gap 2              the second cast two seconds later
     node tools/shot.mjs --out /tmp/before.png

   Dev only. The default build does not read tools/.
   ═══════════════════════════════════════════════════════════════════════════ */

import { chromium } from 'playwright';
import { deflateSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const html = resolve(ROOT, val('html', 'dist/frostwood.html'));
const out = resolve(ROOT, val('out', 'dist/shot.png'));
const res = val('res', '320x180');
const seed = val('seed', '20260727');
const zoom = Math.max(1, parseInt(val('zoom', '3'), 10));
const at = val('at', null);
/* `?at=` is main.js's scene selector: worlds are separate Scenes, so the
   scene name goes on the URL. */
const machines = flag('machines');
const machineState=val('machine-state','idle');
const creatures = flag('creatures');
const deerMotion = val('deer-motion', null);
const figures = flag('figures')||flag('humans'); // `--humans` remains a CLI alias.
const settlement=flag('settlement');
const lakehouse=flag('lakehouse');
const pavilion=flag('pavilion');
const alligatorHole=flag('alligator-hole');
const stranglerFig=flag('strangler-fig');
const shorelineReflection=flag('shoreline-reflection');
const oasis=flag('oasis');
const hamlet=flag('hamlet');
const camp=flag('camp');
const worm=flag('worm');
const dunes=flag('dunes');
const kickup=flag('kickup');
const snowReview=val('snow-review',null);
const scene = val('scene', machines?'meadow':
  pavilion?'meadow':
  (settlement||lakehouse||alligatorHole||stranglerFig||shorelineReflection)?'swamp':
  (oasis||dunes||hamlet||camp||worm)?'desert':
  kickup?'frostwood':
  (creatures||deerMotion)?'frostwood':null);
const poi = val('poi', null);
const common = flag('common');
const PINNED_TIME = Number.parseFloat(val('time', '12.5'));
/* Spell ids from src/spell.js, comma separated, cast in order from where the
   traveller stands. `--face` is his heading on the screen. */
const cast = val('cast', null);
const castAge = Number.parseFloat(val('cast-age', '0.5'));
/* `--cast-gap` is the seconds between two casts of the list. */
const castGap = Number.parseFloat(val('cast-gap', '0'));
const face = val('face', null);
/* `--move dx,dy` walks the traveller that far from where the scene put him. */
const move = val('move', null);
const WIND = Number.parseFloat(val('wind','1'));
const SHADOWS = Number.parseFloat(val('shadows','1'));

/* A minimal PNG writer: twenty lines of CRC instead of a dependency. */
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return (buf) => { let c = -1; for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
})();
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      raw[o++] = rgba[i]; raw[o++] = rgba[i + 1]; raw[o++] = rgba[i + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('page error:', e.message));
const query=new URLSearchParams();
if(scene) query.set('at',scene);
if(poi) query.set('poi',poi);
if(snowReview) query.set('snowReview',snowReview);
if(val('wear',null)) query.set('wear',val('wear',null));
await page.goto(pathToFileURL(html).href + (query.size?`?${query}`:''));
await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });

const shot = await page.evaluate(async (o) => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__realRAF = window.__realRAF || window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = window.__realRAF;
  $('res').value = o.res; $('seed').value = String(o.seed); $('regen').click();
  for (let i = 0; i < 600 && $('load').style.display !== 'none'; i++) await sleep(50);
  if ($('load').style.display !== 'none') throw new Error('build did not finish');

  const realRAF = window.__realRAF;
  window.requestAnimationFrame = () => 0;
  await new Promise((r) => realRAF(() => r()));

  const W = window.__world;
  if (o.at) {
    const [x, y] = o.at.split(',').map(Number);
    W.px = x; W.py = y;
    W.camXf = x - W.W / 2; W.camYf = y - W.H / 2;
  } else if (o.common) {
    /* test/capture.mjs's meadow seat: the common carries the crowns, house
       and two machines this frame reviews. */
    const S = W.scene;
    const p = S.gen.POI.find((q) => q.kind === 'village');
    if (!p) throw new Error(`${S.id} has no common`);
    S.px = p.x; S.py = p.y; S.lastPX = p.x; S.lastPY = p.y;
    S.camXf = S.px - W.W / 2; S.camYf = S.py - W.H * 0.56;
  }
  if(o.settlement){
    const S=W.scene,p=S.gen.POI.find(q=>q.kind==='swampSettlement');
    if(!p)throw new Error(`${S.id} has no swamp settlement`);
    S.px=p.x;S.py=p.y;S.lastPX=p.x;S.lastPY=p.y;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  if(o.lakehouse){
    const S=W.scene,p=S.gen.swampLakehouse;
    if(!p)throw new Error(`${S.id} has no swamp lakehouse`);
    /* Stand on the rim beside the house, so one frame carries the house, the
       balcony rail, the ladder head and the basin wall below it. The camera
       drops by the trunk height so the roof and the balcony stay in frame. */
    S.px=p.x;S.py=p.y+p.deckRows+8;S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=S.px-W.W/2;S.camYf=S.py-p.trunkPx-W.H*0.55;
  }
  if(o.oasis){
    /* One frame with all four surfaces: open water, the fresh reed fringe,
       the salt ring and the dunes behind. */
    const S=W.scene,p=S.gen.oasis;
    if(!p)throw new Error(`${S.id} has no oasis`);
    S.px=p.x;S.py=p.y;S.lastPX=p.x;S.lastPY=p.y;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  if(o.hamlet){
    const S=W.scene,h=S.gen.STEADING.filter(q=>q.kind==='hut');
    if(!h.length)throw new Error(`${S.id} has no hamlet`);
    /* The middle house, so the frame carries a neighbour on each side and
       the corridor. */
    const p=h[(h.length-1)>>1];
    S.px=p.x;S.py=p.y;S.lastPX=p.x;S.lastPY=p.y;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  if(o.camp){
    const S=W.scene,t=S.gen.STEADING.filter(q=>q.kind==='tent');
    if(!t.length)throw new Error(`${S.id} has no camp`);
    const p=t[0];
    S.px=p.x;S.py=p.y;S.lastPX=p.x;S.lastPY=p.y;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  if(o.worm){
    /* Stand where a crossing passes: the route is a function of the world
       seed and the clock, so ask the model where the worm is at the pinned
       time. */
    const S=W.scene, M=window.__wormAt;
    const at=M?M(0,W.time,((S.seed>>>7)%9973)/9973):null;
    const p=at&&at.phase>0&&at.phase<1?{x:at.head.x,y:at.head.y/2}:{x:S.px,y:S.py};
    S.px=Math.round(p.x);S.py=Math.round(p.y);S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  if(o.dunes){
    /* Out on the sand, two wavelengths clear of the swept corridor, so the
       frame is the landform. */
    const S=W.scene;
    const y=S.gen.oasis?S.gen.oasis.y-900:600;
    const x=Math.round(S.gen.pathX(y)+S.gen.dune.wavePx*2.4);
    S.px=x;S.py=y;S.lastPX=x;S.lastPY=y;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  if(o.pavilion){
    const S=W.scene,p=S.gen.STEADING.find(q=>q.kind==='pavilion');
    if(!p)throw new Error(`${S.id} has no pavilion`);
    /* Keep the traveller clear of the doorway this frame judges. */
    S.px=p.x-82;S.py=p.y+30;S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=p.x-W.W/2;S.camYf=p.y-W.H*0.58;
  }
  if(o.alligatorHole){
    const S=W.scene,p=S.gen.alligatorHoles[0],cast=window.__fw.ACTOR;
    if(!p)throw new Error(`${S.id} has no alligator hole`);
    S.px=p.x;S.py=p.y-45;S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
    const row=(key,x,y,state,flip=false)=>{
      const F=cast[key];
      return {key,x,y,hx:flip?-1:1,hy:0,gx:x,gy:y,
        ramp:F.ramp,sMin:F.sMin,sMax:F.sMax,rest:99,dash:0,flee:0,
        gait:0,acc:0,flip,moving:false,motionState:state,response:0};
    };
    S.actors=[
      row('alligator',p.x,p.y,'float'),
      row('heron',p.x-42,p.y-17,'still'),
      row('turtle',p.x+45,p.y+8,'float',true),
    ];
  }
  if(o.stranglerFig){
    const S=W.scene,CH=window.__fw.CH,c=S.gen.swampSettlement?.landing||{x:0,y:0};
    const ccx=Math.floor(c.x/CH),ccy=Math.floor(c.y/CH);
    let found=null;
    for(let r=0;r<=6&&!found;r++)for(let dy=-r;dy<=r&&!found;dy++)
    for(let dx=-r;dx<=r&&!found;dx++){
      if(r&&Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      const chunk=S.gen.bakeChunk(ccx+dx,ccy+dy);
      found=chunk.props.find(p=>p.kind==='stranglerFig')||null;
      chunk.tex.dispose();
    }
    if(!found)throw new Error('no strangler fig in the review search radius');
    S.px=found.x-58;S.py=found.y+18;S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  if(o.shorelineReflection){
    const S=W.scene,settlement=S.gen.swampSettlement;
    const c=settlement?settlement.landing:{x:S.px,y:S.py};
    let found=null,best=-Infinity;
    const r0=settlement?190:12,r1=settlement?560:1200;
    for(let r=r0;r<r1;r+=8)for(let a=0;a<48;a++){
      const x=c.x+Math.cos(a*Math.PI/16)*r,y=c.y+Math.sin(a*Math.PI/16)*r;
      const h=S.gen.hydrologyAt(x,y);
      if(h.water||!S.gen.hydrologyAt(x,y+3).water)continue;
      const clear=settlement
        ?Math.min(...settlement.architecture.map(q=>Math.hypot(x-q.x,y-q.y)))
        :1e9;
      if(clear<120)continue;
      let wet=0;
      for(const dx of [-36,-18,0,18,36])for(const dy of [4,12,20,28,36])
        if(S.gen.hydrologyAt(x+dx,y+dy).water)wet++;
      const score=wet*20+Math.min(clear,260)-r*0.08;
      if(score>best){best=score;found={x,y};}
    }
    if(!found)throw new Error('no reflective shallow-water review point');
    S.px=found.x;S.py=found.y;S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  if(o.creatures){
    const S=W.scene, cast=window.__fw.ACTOR;
    const x=S.px,y=S.py+60;
    const line=['boar','roeDeer','wolf','squirrel','merchant','woodcutter'];
    S.actors=line.map((key,i)=>{
      const F=cast[key], dx=(i-(line.length-1)*0.5)*32;
      return {key,x:x+dx,y,hx:i<4?1:-1,hy:0,gx:x+dx,gy:y,
        ramp:F.ramp,sMin:F.sMin,sMax:F.sMax,rest:99,dash:0,flee:0,
        gait:i,acc:0,flip:i>=4,moving:false,motionState:F.restState||'idle'};
    });
    S.py-=W.H+40; S.lastPY=S.py;
  }
  if(o.deerMotion){
    const S=W.scene,F=window.__fw.ACTOR.roeDeer;
    const state=['idle','walk','gallop'].includes(o.deerMotion)?o.deerMotion:'walk';
    const n=8,x=S.px,y=S.py+60;
    S.actors=Array.from({length:n},(_,i)=>{
      const dx=(i-(n-1)*0.5)*32;
      return {key:'roeDeer',x:x+dx,y,hx:1,hy:0,gx:x+dx+80,gy:y,
        ramp:F.ramp,sMin:F.sMin,sMax:F.sMax,rest:state==='idle'?99:0,dash:99,flee:0,
        gait:i,acc:0,flip:false,moving:true,motionState:state};
    });
    S.py-=W.H+40;S.lastPY=S.py;
  }
  if(o.figures){
    const S=W.scene,cast=window.__fw.ACTOR;
    const x=S.px,y=S.py+42;
    S.px=x-48;S.py=y;S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
    const keys=S.gen.biome==='swamp'
      ?['swampFisher','swampBoatwright']
      :['elder','merchant','woodcutter'];
    S.actors=keys.map((key,i)=>{
      const F=cast[key],xx=[x-12,x+18,x+51][i];
      return {key,x:xx,y,hx:0,hy:1,gx:xx,gy:y,
        ramp:F.ramp,sMin:F.sMin,sMax:F.sMax,rest:99,dash:0,flee:0,
        gait:i,acc:0,flip:false,moving:false,motionState:'idle',preparePhase:0,attend:null};
    });
  }
  if(o.machines){
    const S=W.scene;
    const x=S.px,y=S.py+34;
    S.actors=[
      {key:'colossus',x:x-78,y,hx:0,hy:1,gx:x-78,gy:y,
       ramp:'masonry',sMin:0.04,sMax:0.98,rest:99,dash:0,flee:0,gait:0,acc:0,
       flip:false,moving:false,motionState:o.machineState},
      {key:'strider',x:x+5,y,hx:0,hy:1,gx:x+5,gy:y,
       ramp:'masonry',sMin:0.04,sMax:0.98,rest:99,dash:0,flee:0,gait:0,acc:0,
       flip:false,moving:false,motionState:o.machineState},
      {key:'pilgrim',x:x+72,y,hx:0,hy:1,gx:x+72,gy:y,
       ramp:'masonry',sMin:0.04,sMax:0.98,rest:99,dash:0,flee:0,gait:0,acc:0,
       flip:false,moving:false,motionState:o.machineState},
    ];
    S.py-=W.H+40; S.lastPY=S.py; // keep the traveller out of the review lineup
  }
  if(!(o.alligatorHole||o.creatures||o.deerMotion||o.machines||o.figures)){
    const S=W.scene;
    S.lifeSession.clock.setMinute(171*1440+720);
    S.lifeRuntime.dispose();
    S.actors=S.lifeRuntime.reconcile(S.px,S.py,W.W,W.H);
  }
  if(o.move){
    const S=W.scene,[dx,dy]=o.move.split(',').map(Number);
    S.px+=dx;S.py+=dy;S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
  }
  W.ensure(true);
  if(o.kickup){
    const S=W.scene,x=S.px,y=S.py+5;
    S.kick.length=0;S.wind=o.wind;
    for(let i=0;i<4;i++){
      S.mark(x+(i-1.5)*2,y,undefined,'run');
      S.step(0.03,{});
    }
    S.step(0.05,{});
  }
  if(o.shorelineReflection){
    const S=W.scene,props=[...S.chunks.values()].flatMap(c=>c.props);
    let found={x:S.px,y:S.py},best=-Infinity;
    for(let dy=-120;dy<=120;dy+=6)for(let dx=-180;dx<=180;dx+=6){
      const x=S.px+dx,y=S.py+dy;
      if(S.gen.hydrologyAt(x,y).water||!S.gen.hydrologyAt(x,y+3).water)continue;
      let wet=0;
      for(const qx of [-32,-16,0,16,32])for(const qy of [4,12,20,28,36])
        if(S.gen.hydrologyAt(x+qx,y+qy).water)wet++;
      const obscured=props.reduce((n,p)=>n+
        (Math.abs(p.x-x)<46&&p.y>y-8&&p.y<y+145?1:0),0);
      const nearest=Math.min(...props.map(p=>Math.hypot(p.x-x,(p.y-y)*0.7)),180);
      const score=wet*24+nearest*2-obscured*180;
      if(score>best){best=score;found={x,y};}
    }
    S.px=found.x;S.py=found.y;S.lastPX=S.px;S.lastPY=S.py;
    S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
    W.ensure(true);
  }
  if(o.creatures||o.deerMotion||o.machines||o.figures)
    for(const c of W.scene.chunks.values()) c.props=[];
  W.time = o.time;
  if(o.cast){
    /* The clock is pinned before the cast, then advanced with the steps, so
       the frame is the cast at exactly `castAge`. */
    const S=W.scene;
    if(o.face){ const [hx,hy]=o.face.split(',').map(Number); S.heading.x=hx; S.heading.y=hy; }
    S.wind=o.wind;
    const wait=(s)=>{ for(let i=Math.round(s*60);i>0;i--){ W.time+=1/60; S.step(1/60,{}); } };
    o.cast.split(',').forEach((id,i)=>{ if(i) wait(o.castGap); S.cast(id); });
    wait(o.castAge);
  }
  W.render(0, { fog: true, quant: true, precipitation: true,
    /* Scene.shadows tests `ui.shadows!==false`, so the CLI's numeric 0
       becomes a boolean here. */
    wind:o.wind,shadows:o.shadows!==0 });

  const gl = W.renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  /* readPixels is bottom-up; flip so the PNG is the right way round */
  const flip = new Uint8Array(buf.length);
  for (let y = 0; y < h; y++) flip.set(buf.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
  /* the snap list this frame was quantised against, as the GPU holds it */
  return { w, h, px: Array.from(flip), pal: Array.from(W.outPal.tex.image.data) };
}, { res, seed, at, common, settlement, lakehouse, pavilion, oasis, dunes, hamlet, camp, worm, alligatorHole, stranglerFig,
     shorelineReflection,
     creatures, deerMotion, figures, machines, kickup, cast, castAge, castGap, face, move, time: PINNED_TIME,
     machineState,wind:WIND,shadows:SHADOWS });

/* Nearest-neighbour zoom: bilinear would resample the grid. */
const { w, h } = shot;
const zw = w * zoom, zh = h * zoom;
const big = new Uint8Array(zw * zh * 4);
for (let y = 0; y < zh; y++) for (let x = 0; x < zw; x++) {
  const s = (((y / zoom) | 0) * w + ((x / zoom) | 0)) * 4, d = (y * zw + x) * 4;
  big[d] = shot.px[s]; big[d + 1] = shot.px[s + 1]; big[d + 2] = shot.px[s + 2]; big[d + 3] = 255;
}
await mkdir(dirname(out), { recursive: true });
await writeFile(out, png(zw, zh, big));

const seen = new Set();
for (let i = 0; i < shot.px.length; i += 4) seen.add((shot.px[i] << 16) | (shot.px[i + 1] << 8) | shot.px[i + 2]);
/* Every pixel leaves POST_FS on the world's snap list. The interaction
   outline is UI and is drawn after the snap. */
const legal = new Set();
for (let i = 0; i < shot.pal.length; i += 4) legal.add((shot.pal[i] << 16) | (shot.pal[i + 1] << 8) | shot.pal[i + 2]);
let off = 0;
for (let i = 0; i < shot.px.length; i += 4)
  if (!legal.has((shot.px[i] << 16) | (shot.px[i + 1] << 8) | shot.px[i + 2])) off++;
console.log(`${out}  ${w}x${h} at ${zoom}x = ${zw}x${zh}  ${seen.size} distinct colours  ${off} px off palette`);
await browser.close();
