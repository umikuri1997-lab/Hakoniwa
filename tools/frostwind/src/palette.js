import * as THREE from 'three';
import { clamp, lerp } from './math.js';
import { desertRamps, hollowRamps, meadowRamps, swampRamps } from './sunlight.js';

/* Ramps are ordered dark to light. Everything the renderer draws samples a
   ramp. */
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];

/* WHY: the locked palette reserves warm accents for people and authored focal
   points. Few rungs with wide steps force one choice per pixel. */
const SWAMP_RAMPS=swampRamps();
const DESERT_RAMPS=desertRamps();
const HOLLOW_RAMPS=hollowRamps();
const RAMP_BASE={
  snow  :['#28303f','#3f4b61','#5d6b7e','#818e9c','#a9b6bf','#d7e3e8'].map(hex),
  birch :['#2b2a33','#4c4c57','#7d8189','#bcc3c8'].map(hex),
  warm  :['#2a2028','#443440','#5f4a52','#7e646c'].map(hex),
  trunk :['#171921','#282d3b','#3d4454','#585f70'].map(hex),
  water :['#050b16','#0b1526','#132139','#1e3352','#2d4d73'].map(hex),
  ice   :['#2a4c6b','#5a86a6','#a9cee2'].map(hex),
  shade :['#1c1f2c','#2f3547','#464e63'].map(hex),
  twig  :['#14161e','#212630','#333b48','#4b5566'].map(hex),
  /* the figure: the only saturated hue in the frame */
  accent:['#5c2233','#9b3a4c','#c86b76'].map(hex),
  /* WHY: timber is a separate ramp because indoor wood must clear the floor by a shader-visible rung. */
  timber:['#342c28','#4e433c','#68594f','#826f62'].map(hex),
  /* AUTHORED, stylised. `timber` does not clear sand: its lit rung is L115
     S0.24 H24 against sand's L139 S0.32 H34. This ramp separates on all three
     axes at the lit rung: 11 luminance below sand, 0.16 more saturation, 10
     degrees further toward gold. Held under `accent` (S0.63 at its dark
     rungs). No pelage albedo stands behind the numbers: a Bactrian runs fawn
     to dark brown, and this pushes the warm end. */
  camelCoat:['#2b2616','#4d4324','#716135','#93804d'].map(hex),
  /* SOURCE: sunlight.js derives meadow ramps from scattering, measured albedo, Naka–Rushton response and Oklab spacing. */
  ...meadowRamps(),
  ...SWAMP_RAMPS,
  /* AUTHORED: one two-state machine signal. Appended so every prior ramp id is stable. */
  machineSignal:['#ef9ca5','#b9dfae'].map(hex),
  /* SOURCE: the 142x84 pavilion reference. Main cloth and fibre values were
     measured from its broad facets and trim, then widened to four legal rungs. */
  pavilionCloth:['#202b32','#394950','#475a62','#5c7b7f'].map(hex),
  pavilionTrim:['#442d35','#765044','#b98c5f','#ddd0ad'].map(hex),
  /* One skin ramp shared by every world, on material 16. Four rungs, warm and
     paler than every coat: a pale patch reads as a face only when it is paler
     than everything around it. */
  skin:['#5a4238','#8a6350','#c39a74','#eccfa2'].map(hex),
  /* The folk garments. A person on `warm` reads as a smudge on snow, and whole
     coats at 0.30 to 0.63 saturation shout against a world that tops out at
     0.09. So the mass is undyed fleece and the loud colour is a band,
     `folkDye`.

     SOURCE: undyed wool runs cream, grey, moorit brown and brown-black (Ewing,
     Viking Clothing, on natural wool ranges; the Sámi winter peski is reindeer
     hide). Madder and weld indicate trade in Late Iron Age Finland (Vajanto
     2016), so dye lands on hat bands, belts, cuffs, mitten seams and cap
     tassels.

     Value carries the read at 26 px. The fleece ramps sit below the snowfield
     (snow's fourth rung, Oklab L 0.63): the figure separates by value against
     the ground and by hue against its neighbours.

     The rung spacing is 0.09 dE_ok. The collision gate in test/biome.test.mjs
     takes its tolerance from the median step across every ramp here, so a new
     ramp re-thresholds every pair. Measured: swampGround/swampAccent 0.04709,
     swampGround/duckweed 0.04816 and loam/masonry 0.04887, against a tolerance
     of 0.04502. A ladder here may be lifted but not widened: the ceiling is a
     step of 0.094 at any rung count.

     Every declared garment clears every ramp its own scenes declare, above
     the L 0.45 floor where form is carried.

     Where each ramp is declared is a budget fact: POST_FS iterates 64 colours.
     SCENES in src/scene.js owns the lists. FASHION_VOCAB in src/culture.js
     owns the cultural reason.

     The signal is two rungs, measured off the ten STRANDED sheets: the eye
     band in #f2d3ac, the rest of the face in #f3a787. A signal pixel is one
     of exactly two colours at every sun angle. `machineSignal` has the same
     shape. */
  /* the traveller's, and the only dyed mass in the world */
  folkCoat  :['#7c4029','#9d572e','#bf6f33','#e38835'].map(hex),
  /* the swamp wardrobe keeps the hero mass while giving that world its own dye */
  swampCoat :['#382451','#56336d','#78488a','#a064a3'].map(hex),
  /* dark undyed fleece, cool: the charcoal of a black sheep */
  folkWool  :['#0a0e12','#1c222a','#303943','#46515e'].map(hex),
  /* moorit: the brown fleece, warmed toward madder */
  folkUmber :['#341411','#502722','#6e3a34','#8e4f47'].map(hex),
  /* the greasy off-white fleece as it reads outdoors: olive-grey, not cream */
  folkOat   :['#2a2d21','#404432','#575c45','#6f7558'].map(hex),
  folkSignal:['#f3a787','#f2d3ac'].map(hex),
  /* Human under-layers own a near-black instead of borrowing a world's trunk,
     water or shade. The first rung is the boot and the unlit outline. */
  folkDark  :['#07090e','#141820','#232a36'].map(hex),
  /* The dye: two rungs, madder red and weld ochre. A person picks one and
     material 18 resolves it flat, so a dyed band is one of exactly two
     colours at every sun elevation. Never the mass: figure-folk.js spends it
     on a hat band, a cuff, a sash or a mitten. */
  folkDye   :['#a8372a','#ca9d33'].map(hex),
  /* SOURCE: sunlight.js derives these from sand, salt-crust and varnished-gravel
     albedo under a 24 N sun. Appended: RAMP_ORDER is the baked ramp id. */
  ...DESERT_RAMPS,
  /* SOURCE: sunlight.js derives these from emission bands, wet limestone and
     calcite albedo and clear-water absorption. No sun reaches them. */
  ...HOLLOW_RAMPS,
};
const FOG_BASE=hex('#8d9dae');     // atmospheric haze colour, boreal
/* The meadow's haze: the sward's own lit rung warmed toward the beam. At a few
   tens of metres most of what hazes a view has bounced off the ground. */
const MEADOW_FOG=hex('#93a37a');
/* Ground-return haze, not long-range blue airlight: the open hummock field and
   pale shallow water dominate the visible hemisphere in the sparse swamp. */
const SWAMP_FOG=SWAMP_RAMPS.swampGround[2].map((v,i)=>
  Math.round(v*0.62+SWAMP_RAMPS.swampShallow[2][i]*0.38));
/* The desert haze is the ground: what dims a far dune is sand the wind lifted
   off a near one. Taken from the two lit sand rungs, weighted toward the
   brighter: the suspended fraction is the fine pale tail of the grain-size
   distribution. */
const DESERT_FOG=DESERT_RAMPS.sand[2].map((v,i)=>
  Math.round(v*0.55+DESERT_RAMPS.sand[3][i]*0.45));
/* Cave air is still and saturated: what veils a far wall is the unlit rock
   behind it. The floor's second rung, lit by the ceiling alone. */
const HOLLOW_FOG=HOLLOW_RAMPS.caveRock[1].slice();
const EXTRA_BASE=['#8fa2b8'].map(hex);
let RAMP={}, FOG=FOG_BASE.slice();
/* EXTRA_BASE[0] as bakeOutPalette writes it: a pale steel blue in every
   world's snap list that no ramp owns. A frost plate draws on it where a
   world declares no ice ramp (src/spell.js). Declared before warmShift, used
   after it. */
const extraColour=(warmth)=>
  warmShift(repaint(EXTRA_BASE[0]).map(Math.round),warmth||0).map(Math.round);

/* The palette is rebuilt, not fixed. `paint` is a luminance to chroma lookup
   learned from a reference image. It applies to the ramps, not the finished
   frame, so the repaint still ends on a small locked palette. */
let PALETTE=[], PAL_R=new Uint8Array(0), PAL_G=new Uint8Array(0), PAL_B=new Uint8Array(0);
const QCACHE=new Int16Array(32768);
let PAINT=null, PAINT_AMT=0, TONE=null;

function repaint(c){
  if(!PAINT||PAINT_AMT<=0.001) return c.slice();
  let L=c[0]*0.30+c[1]*0.59+c[2]*0.11;
  if(TONE){
    const u=Math.pow(clamp(L/255,0,1),TONE.gamma);
    L=lerp(L,TONE.loL+u*(TONE.hiL-TONE.loL),PAINT_AMT);
  }
  const nb=PAINT.length/3;
  const f=clamp(L/255,0,0.9999)*(nb-1), i=Math.floor(f), k=f-i;
  const j=Math.min(nb-1,i+1)*3, i3=i*3;
  const dr=lerp(PAINT[i3],PAINT[j],k), dg=lerp(PAINT[i3+1],PAINT[j+1],k), db=lerp(PAINT[i3+2],PAINT[j+2],k);
  return [clamp(L+dr*PAINT_AMT+(c[0]-L)*(1-PAINT_AMT),0,255),
          clamp(L+dg*PAINT_AMT+(c[1]-L)*(1-PAINT_AMT),0,255),
          clamp(L+db*PAINT_AMT+(c[2]-L)*(1-PAINT_AMT),0,255)];
}
function rebuildPalette(){
  RAMP={};
  for(const k in RAMP_BASE) RAMP[k]=RAMP_BASE[k].map(repaint);
  FOG=repaint(FOG_BASE);
  PALETTE=[];
  const seen=new Set();
  const push=c=>{
    const r=Math.round(c[0]),g=Math.round(c[1]),b=Math.round(c[2]);
    const key=(r<<16)|(g<<8)|b;
    if(!seen.has(key)){seen.add(key);PALETTE.push([r,g,b]);}
  };
  for(const k in RAMP) RAMP[k].forEach(push);
  push(FOG); EXTRA_BASE.map(repaint).forEach(push);
  PAL_R=new Uint8Array(PALETTE.map(c=>c[0]));
  PAL_G=new Uint8Array(PALETTE.map(c=>c[1]));
  PAL_B=new Uint8Array(PALETTE.map(c=>c[2]));
  QCACHE.fill(-1);
}
rebuildPalette();
/* INVARIANT: RAMP_ORDER is permanent; append ramps so baked ramp ids remain stable. */
const RAMP_ORDER=Object.keys(RAMP_BASE);
const RAMP_ID={}; RAMP_ORDER.forEach((k,i)=>RAMP_ID[k]=i);
const MAX_RUNGS=8;

/* INVARIANT: colour temperature is authored in palette ramps, not multiplied over snapped colours. */
/* WHY: luminance-signed split tone warms lights and cools darks without flattening ramp order. */
function warmShift(c,w){
  const L=c[0]*0.30+c[1]*0.59+c[2]*0.11;
  const k=clamp((L/255-0.42)*2.3,-1,1);
  return [clamp(c[0]+w*k*(19+0.055*L),0,255),
          clamp(c[1]+w*k*(4.0+0.008*L),0,255),
          clamp(c[2]-w*k*(16+0.048*L),0,255)];
}

/* palette as a lookup texture */
function bakePalette(warmth){
  const d=new Uint8Array(MAX_RUNGS*RAMP_ORDER.length*4);
  const rungs=[];
  RAMP_ORDER.forEach((name,r)=>{
    const ramp=RAMP[name]; rungs.push(ramp.length);
    for(let i=0;i<MAX_RUNGS;i++){
      const c=warmShift(ramp[Math.min(ramp.length-1,i)],warmth||0);
      const o=(r*MAX_RUNGS+i)*4;
      /* Rounded, to match bakeOutPalette. Truncated, the two differ by a
         least-significant bit, and an exact-match palette classifier written
         against uPal reports 96% failure on a legal frame. */
      d[o]=Math.round(c[0]); d[o+1]=Math.round(c[1]); d[o+2]=Math.round(c[2]); d[o+3]=255;
    }
  });
  const tex=new THREE.DataTexture(d,MAX_RUNGS,RAMP_ORDER.length,THREE.RGBAFormat);
  tex.magFilter=tex.minFilter=THREE.NearestFilter; tex.needsUpdate=true; tex.flipY=false;
  /* rung counts as a texture: dynamically indexing a uniform array from a
     fragment shader is not guaranteed on GLSL ES 1.0 */
  const rd=new Uint8Array(RAMP_ORDER.length*4);
  rungs.forEach((n,i)=>{ rd[i*4]=n; rd[i*4+3]=255; });
  const rtex=new THREE.DataTexture(rd,RAMP_ORDER.length,1,THREE.RGBAFormat);
  rtex.magFilter=rtex.minFilter=THREE.NearestFilter; rtex.needsUpdate=true; rtex.flipY=false;
  return {tex,rungs,rtex,btex:bayerTexture()};
}

/* 8x8 ordered dither, baked so the GPU matches the software path. A
   singleton: warmth rebakes the palette through a daylight cycle, bindPalette
   disposes only tex and rtex, and uBayer is bound once. A fresh texture per
   bake leaks one GPU texture per step. */
let BTEX=null;
function bayerTexture(){
  if(BTEX)return BTEX;
  const B=[0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,
           60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,
           15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
  /* INVARIANT: Bayer thresholds use the shared 8×8 table and exact integer convention. */
  const bd=new Uint8Array(64*4);
  B.forEach((v,i)=>{ bd[i*4]=Math.round((v+0.5)/64*255); bd[i*4+3]=255; });
  BTEX=new THREE.DataTexture(bd,8,8,THREE.RGBAFormat);
  BTEX.magFilter=BTEX.minFilter=THREE.NearestFilter;
  BTEX.wrapS=BTEX.wrapT=THREE.RepeatWrapping; BTEX.needsUpdate=true; BTEX.flipY=false;
  return BTEX;
}

/* the flat output palette, for the final snap */
/* INVARIANT: each scene snaps only to declared ramps; palette ceiling remains scene-local. */
function bakeOutPalette(warmth,use,fog=FOG){
  let list=PALETTE;
  if(use&&use.length){
    const seen=new Set(); list=[];
    const push=c=>{ const r=Math.round(c[0]),g=Math.round(c[1]),b=Math.round(c[2]);
      const k=(r<<16)|(g<<8)|b; if(!seen.has(k)){ seen.add(k); list.push([r,g,b]); } };
    for(const name of use) if(RAMP[name]) RAMP[name].forEach(push);
    push(fog); EXTRA_BASE.map(repaint).forEach(push);
  }
  const n=list.length;
  const d=new Uint8Array(n*4);
  for(let i=0;i<n;i++){ const c=warmShift(list[i],warmth||0);
    d[i*4]=Math.round(c[0]); d[i*4+1]=Math.round(c[1]); d[i*4+2]=Math.round(c[2]); d[i*4+3]=255; }
  const tex=new THREE.DataTexture(d,n,1,THREE.RGBAFormat);
  tex.magFilter=tex.minFilter=THREE.NearestFilter; tex.needsUpdate=true;
  return {tex,n,list};
}

export { MEADOW_FOG, SWAMP_FOG, DESERT_FOG, HOLLOW_FOG, EXTRA_BASE, FOG, FOG_BASE, MAX_RUNGS, PAINT,
         PAINT_AMT, PALETTE, PAL_B, PAL_G, PAL_R,
         QCACHE, RAMP, RAMP_BASE, RAMP_ID, RAMP_ORDER, TONE, bakeOutPalette,
         bakePalette, extraColour, hex, rebuildPalette, repaint, warmShift };
