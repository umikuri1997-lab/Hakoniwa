import { clamp } from './math.js';
import { newSprite } from './sprite.js';
import {
  GLAZE, M, N_FRONT, N_SIDE, N_TOP, OPEN, SOLID,
  cabinetBox, groundFootprint, put, wallSlab,
} from './construct.js';
import {
  boundsOf, catenary, pole, project, quad, screen, stroke,
} from './pavilion.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The goat-hair tent. One cloth shell in tension over poles, drawn with the
   tensile layer of src/pavilion.js. docs/DESERT.md owns the reasons:

   Low and wide. Overturning moment in wind goes as the height of the load
   above the anchors, so the ridge sits at about two metres against the
   pavilion's five.

   The ridge hangs from a row of poles and sags in a catenary between each
   pair. A pole more is a scallop more.

   The anchors are buried deadmen, which resist a flat pull, so the guys run
   long and low and no pegs show.

   The cloth is black. Shkolnik, Taylor, Finch & Borut, Nature 283:373-375
   (1980): black and white Bedouin robes carry the same heat load, because the
   loose weave convects the excess away.

   The cloth is woven in strips about 70 cm wide (11 px), sewn edge to edge.
   ═══════════════════════════════════════════════════════════════════════════ */

const TENT_M=Object.freeze({
  /* three-pole and five-pole bays; the width follows the count */
  bayW:2.35,
  depth:3.90,
  /* A bayt al-sha'ar stands about head height at the ridge. */
  ridge:2.06,
  eave:1.24,
  /* the sag of the roof line between two poles, as a fraction of the bay. */
  sag:0.115,
  pole:0.13,
  /* the strip the cloth is woven in, and sewn along */
  strip:0.70,
  /* Guy reach on the ground from the eave, against the pavilion's 1.15 m. */
  guyReach:3.05,
  guySlack:1.045,
  /* the windward screen: a separate cloth on the closed side, weighted at
     its foot */
  screenH:1.10,
  doorHead:1.70, doorWidth:1.30,
  yard:0.914,
});

const ACCENT=GLAZE;
const add=(a,b)=>({x:a.x+b.x,d:a.d+b.d,z:a.z+b.z});
const sub=(a,b)=>({x:a.x-b.x,d:a.d-b.d,z:a.z-b.z});
const mul=(a,k)=>({x:a.x*k,d:a.d*k,z:a.z*k});
const mix=(a,b,t)=>add(a,mul(sub(b,a),t));

/* The three-pole travelling tent and the five-pole seasonal one. */
const TENT_VARIANTS=Object.freeze([
  Object.freeze({poles:3, screen:false}),
  Object.freeze({poles:5, screen:true}),
]);

function tentGeometry(variant=0){
  const V=TENT_VARIANTS[variant%TENT_VARIANTS.length];
  const bays=V.poles-1;
  const wM=TENT_M.bayW*bays;
  const box=cabinetBox({wM,dM:TENT_M.depth,hM:TENT_M.ridge});
  const halfW=M(wM)/2, halfD=M(TENT_M.depth)/2;
  const ridgeZ=M(TENT_M.ridge), eaveZ=M(TENT_M.eave);
  const sagZ=M(TENT_M.bayW*TENT_M.sag);
  const guy=M(TENT_M.guyReach);

  /* the ridge: a row of pole heads */
  const heads=[];
  for(let i=0;i<V.poles;i++){
    const t=V.poles>1?i/(V.poles-1):0.5;
    heads.push({x:Math.round(-halfW+t*halfW*2), d:0, z:ridgeZ});
  }
  /* the sampled ridge line: each pole head, and the sagged midpoint of each bay */
  const ridge=[];
  for(let i=0;i<heads.length;i++){
    ridge.push(heads[i]);
    if(i<heads.length-1){
      const m=mix(heads[i],heads[i+1],0.5);
      ridge.push({x:m.x,d:0,z:m.z-sagZ});
    }
  }
  /* Front and back hems, pulled out past the ridge line. The front (open)
     hem stops short of the ground; the back (closed) hem reaches it. */
  const hem=(sign,drop)=>ridge.map((p,i)=>({
    x:p.x+Math.round(Math.sin(i*1.7)*2),
    d:sign*halfD,
    z:eaveZ-drop-Math.round(Math.cos(i*2.1)*1.5),
  }));
  const frontHem=hem(-1,0);
  const backHem=hem(1,Math.round(eaveZ*0.62));
  /* the foot of the closed side, where the windward screen hangs */
  const backFoot=backHem.map((p)=>({x:p.x,d:p.d,z:0}));

  /* Each guy runs from a pole head out past the hem to a buried anchor,
     marked by a small heap of sand. No stakes. */
  const anchors=heads.map((h,i)=>({
    x:h.x+Math.round((i-(heads.length-1)/2)*guy*0.42),
    d:-halfD-guy, z:0,
  }));
  const backAnchors=[heads[0],heads[heads.length-1]].map((h,i)=>({
    x:h.x+(i?1:-1)*Math.round(guy*0.5), d:halfD+Math.round(guy*0.62), z:0,
  }));

  const control=[...ridge,...frontHem,...backHem,...backFoot,...anchors,
                 ...backAnchors,...heads.map((h)=>({x:h.x,d:0,z:0}))];
  const b=boundsOf(control);
  const pad=4;
  const W=(b.maxX-b.minX+pad*2)|1;
  const H=(b.maxY-b.minY+pad*2);
  const shift={x:pad-b.minX,y:pad-b.minY};
  const G={V,box,shift,heads,ridge,frontHem,backHem,backFoot,anchors,
           backAnchors,halfW,halfD,ridgeZ,eaveZ,guy,W,H,wM};
  const ground=screen(G,{x:0,d:-halfD,z:0});
  G.anchor={x:Math.round(W/2),y:Math.round(ground.y)};
  /* the door is the gap between the two middle poles on the open side */
  const midA=heads[Math.floor((heads.length-1)/2)];
  const midB=heads[Math.ceil((heads.length-1)/2)];
  G.doorX=Math.round(screen(G,{x:(midA.x+midB.x)/2,d:-halfD,z:0}).x);
  G.doorHalf=Math.max(3,M(TENT_M.doorWidth)>>1);
  return G;
}

const tentSlab=(variant=0)=>{
  const G=tentGeometry(variant);
  const left=screen(G,{x:-G.halfW,d:-G.halfD,z:0});
  return wallSlab(G.box,Math.round(left.x),G.anchor.x);
};
const tentFootprint=(variant=0)=>{
  const G=tentGeometry(variant);
  const f=groundFootprint(G.box,G.guy);
  /* The tent may stand on sand. worldgen.js reads `onSand` in siteLegal. */
  return {hx:f.hx, back:f.back+M(1.2), front:M(0.9), yard:M(TENT_M.yard),
          onSand:true};
};
const tentDoorDX=(variant=0)=>tentGeometry(variant).doorX-tentGeometry(variant).anchor.x;
const tentDoorHW=(variant=0)=>tentGeometry(variant).doorHalf;
/* The ground skirt, for the shadow pass. The guy anchors sit forward of the
   hem, so the sprite runs on below its ground line, and those rows are ground
   plane. The projected-shadow pass roots a caster at its rect bottom and
   reads rect height as height above the soil. The negative lift says the
   rect foot is this many rows below the ground. */
const tentShadowLift=(variant=0)=>{
  const G=tentGeometry(variant);
  return G.anchor.y-(G.H-1);
};

function makeTent(rnd,variant=0){
  const G=tentGeometry(variant);
  const sp=newSprite(G.W,G.H);
  sp.ax=G.anchor.x; sp.ay=G.anchor.y;
  /* dark cloth; the trim is the undyed lighter warp */
  sp.ramp='folkDark'; sp.ramp2='timber';
  sp.sMin=0.04; sp.sMax=1.00; sp.kind='tent'; sp.tilt=0;

  /* the back poles first, so the cloth wins wherever it covers them */
  for(const h of G.heads)
    pole(sp,G,{foot:{x:h.x,d:0,z:0},head:h},0.26,N_SIDE,TENT_M.pole);

  /* The closed (windward) side: cloth from the ridge to the ground, no gap. */
  for(let i=0;i<G.ridge.length-1;i++){
    quad(sp,G,G.ridge[i],G.ridge[i+1],G.backHem[i+1],G.backHem[i],
      SOLID,0.30+((i%2)?0.05:0),{x:0,d:1,z:0.2});
    quad(sp,G,G.backHem[i],G.backHem[i+1],G.backFoot[i+1],G.backFoot[i],
      SOLID,0.20+((i%2)?0.04:0),{x:0,d:1,z:0});
  }

  /* The roof, from the ridge forward. The sag makes each bay its own
     facet. */
  for(let i=0;i<G.ridge.length-1;i++){
    const t=i/(G.ridge.length-2);
    const lit=0.62+0.26*Math.sin(Math.PI*t)+((i%2)?-0.04:0.04);
    quad(sp,G,G.ridge[i],G.ridge[i+1],G.frontHem[i+1],G.frontHem[i],
      SOLID,clamp(lit,0.10,1),{x:0,d:-0.35,z:1});
  }

  /* The open side: the hem stops in the air and the shade under the cloth is
     the darkest value in the sprite. */
  for(let i=0;i<G.frontHem.length-1;i++){
    const a=G.frontHem[i], b=G.frontHem[i+1];
    const fa={x:a.x,d:a.d,z:0}, fb={x:b.x,d:b.d,z:0};
    quad(sp,G,a,b,fb,fa,SOLID,0.06,{x:0,d:-1,z:0});
  }
  /* the hem's edge */
  for(let i=0;i<G.frontHem.length-1;i++)
    stroke(sp,screen(G,G.frontHem[i]),screen(G,G.frontHem[i+1]),
      OPEN,0.44,1,N_FRONT);

  /* The windward screen of the seasonal tent stands off the closed side, so
     the drift piles against the screen. */
  if(G.V.screen){
    const h=M(TENT_M.screenH);
    for(let i=0;i<G.backFoot.length-1;i++){
      const a={x:G.backFoot[i].x,d:G.backFoot[i].d+6,z:h};
      const b={x:G.backFoot[i+1].x,d:G.backFoot[i+1].d+6,z:h};
      const fa={x:a.x,d:a.d,z:0}, fb={x:b.x,d:b.d,z:0};
      quad(sp,G,a,b,fb,fa,SOLID,0.16+((i%2)?0.05:0),{x:0,d:1,z:0.1});
    }
  }

  /* the guys, each ending in the sand heap over its buried anchor */
  for(let i=0;i<G.heads.length;i++){
    const a=screen(G,G.heads[i]), b=screen(G,G.anchors[i]);
    catenary(sp,a,b,ACCENT,0.86,TENT_M.guySlack);
    const p=screen(G,G.anchors[i]);
    for(let dx=-2;dx<=2;dx++)
      put(sp,Math.round(p.x)+dx,Math.round(p.y),SOLID,
          Math.abs(dx)>1?0.30:0.46,1,N_TOP);
  }
  for(let i=0;i<G.backAnchors.length;i++){
    const h=i?G.heads[G.heads.length-1]:G.heads[0];
    stroke(sp,screen(G,h),screen(G,G.backAnchors[i]),ACCENT,0.70);
  }

  /* The weave: seams run across the roof at the strip spacing. */
  const stripPx=Math.max(3,M(TENT_M.strip));
  for(let i=0;i<G.ridge.length-1;i++){
    const a=G.ridge[i], b=G.frontHem[i];
    const n=Math.max(1,Math.round(Math.abs(project(a).y-project(b).y)/stripPx));
    for(let k=1;k<n;k++)
      stroke(sp,screen(G,mix(a,b,k/n)),screen(G,mix(G.ridge[i+1],G.frontHem[i+1],k/n)),
        OPEN,0.52,1,N_TOP);
  }
  return sp;
}

export {
  TENT_M, TENT_VARIANTS, makeTent, tentDoorDX, tentDoorHW, tentFootprint,
  tentGeometry, tentShadowLift, tentSlab,
};
