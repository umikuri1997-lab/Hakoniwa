import {
  FACE, M, N_FRONT, N_TOP, SOLID,
  cabinet, cabinetBox, courseWall, groundFootprint, occlude, put, wallSlab,
} from './construct.js';
import { RUNG, lumen as emit } from './speleo.js';
import { newSprite } from './sprite.js';

/* Earth folk's village in the Hollow: cap house, lamp post, cutting bench.
   docs/life/HOLLOW.md owns sources and the invented roof.

   Door fits its owner: folk rows in body-folk.js stand 18 px, 1.18 m.
   construct.js floors a door at the traveller's height for a door he uses.
   He does not use this one (AGENTS.md: doors do not open into rooms). */

const CAP_HOUSE_M=Object.freeze({
  /* one maker tall */
  door:1.18, doorWidth:0.46,
  window:0.20,
  /* cap rim stands this far out from the wall: the drip falls clear */
  overhang:0.40,
  yard:0.60,
});

/* Three households. `w` room diameter, `rise` cap dome, metres. `door`: door
   position in room radii from the middle. `extra`: a chimney under its own
   small cap, or a second cap beside the house. */
const CAP_HOUSE_VARIANTS=Object.freeze([
  Object.freeze({w:2.35, rise:0.80, door:-0.30, extra:null}),
  Object.freeze({w:2.75, rise:0.72, door:-0.34, extra:'chimney'}),
  Object.freeze({w:2.00, rise:0.66, door:-0.26, extra:'pup'}),
]);

/* a luminous pixel on a wall faces the viewer */
const lumen=(sp,x,y,shade,N=N_FRONT)=>emit(sp,x,y,shade,N);

/* Calcite at rest and the rung above, as a stalagmite takes them. Anchor is
   newSprite's: bottom row, middle column. */
const stone=(w,h,kind,ramp2)=>Object.assign(newSprite(w,h),{
  ramp:'dripstone', ramp2, sMin:0.05, sMax:0.72, dMin:0, dMax:1, kind, tilt:0,
});

function capHouseGeom(variant=0){
  const V=CAP_HOUSE_VARIANTS[variant%CAP_HOUSE_VARIANTS.length];
  const r=M(V.w)>>1, capR=r+M(CAP_HOUSE_M.overhang), rise=M(V.rise);
  /* Two or three rows of gill. Measured at four: the last row lies on the
     door's head. */
  const gill=Math.max(2,Math.min(3,Math.round(capR*0.13)));
  /* wall: door, one row of lintel, gills */
  const wall=M(CAP_HOUSE_M.door)+1+gill;
  const pup=V.extra==='pup'?M(0.72):0;
  const chimney=V.extra==='chimney'?M(0.46):0;
  const H=wall+rise+chimney+3, cx=capR+1;
  /* PROJECTION.md: a ground circle draws half as deep as it is wide */
  return {r,ry:r>>1,capR,wall,rise,gill,pup,chimney,W:2*capR+3+pup,H,cx,
          base:H-1,doorHW:M(CAP_HOUSE_M.doorWidth)>>1,
          doorX:cx+Math.round(V.door*r)};
}

/* front edge of the room's ground circle, as a row per column */
const footRow=(G,dx)=>G.base-G.ry
  +Math.round(G.ry*Math.sqrt(Math.max(0,1-(dx/G.r)**2)));

const capHouseFootprint=(variant=0)=>{
  const G=capHouseGeom(variant);
  /* centred on the door, so the half-width takes the door's offset */
  return {hx:G.capR+Math.abs(G.doorX-G.cx)+1, back:2*G.ry,
          front:M(0.8), yard:M(CAP_HOUSE_M.yard)};
};
/* Drawn base: the room's ground circle, no shear. The cap overhangs it and a
   body walks under the overhang. */
const capHouseSlab=(variant=0)=>{
  const G=capHouseGeom(variant);
  return {dx:G.cx-G.doorX, hx:G.r, back:2*G.ry, front:2, shear:0};
};
const capHouseDoorHW=(variant=0)=>capHouseGeom(variant).doorHW;

/* One cap: gills, then the dome over them. The agaric's rungs
   (src/speleo.js): gills brightest, flesh on the middle rung, darker at the
   thin rim. */
function capOn(sp,cx,rimY,rx,rise,gill,spots=[]){
  for(let dy=0;dy<=gill;dy++){
    const half=Math.floor(rx*0.94*Math.sqrt(Math.max(0,1-(dy/(gill+0.5))**2)));
    for(let dx=-half;dx<=half;dx++)
      lumen(sp,cx+dx,rimY+dy,((dx+64)%3)===0&&rx>5?RUNG[2]:RUNG[3]);
  }
  for(let dy=1;dy<=rise;dy++){
    const u=dy/rise;
    /* the crown row is never one pixel: a nub on a dome reads as a stalk */
    const half=Math.max(Math.min(2,rx-1),Math.round(rx*Math.sqrt(Math.max(0,1-u*u))));
    for(let dx=-half;dx<=half;dx++){
      let s=u<0.30&&rise>3?RUNG[1]:RUNG[2];
      for(const [sx,sy,sr] of spots)
        if((dx-sx)**2+(dy-sy)**2<=sr*sr) s=RUNG[3];
      if(Math.abs(dx)>half-1.2&&u<0.75&&rx>4) s=RUNG[1];
      /* the dome's surface: a top face, leaning out toward its rim */
      const nx=0.6*dx/rx, ny=N_TOP.y*(0.55+0.45*u), nz=N_TOP.z+0.3*(1-u);
      const n=Math.hypot(nx,ny,nz);
      lumen(sp,cx+dx,rimY-dy,s,{x:nx/n,y:ny/n,z:nz/n});
    }
  }
}

/* `rnd` is unread: the atlas and test/archcast.mjs call every house as
   make(rnd, variant). */
function makeCapHouse(rnd,variant=0){
  const G=capHouseGeom(variant);
  const {r,ry,capR,wall,rise,gill,pup,chimney,cx,base,doorHW,doorX}=G;
  const sp=stone(G.W,G.H,'capHouse','glowcap');
  /* the anchor is the door: a resident's threshold is straight in front */
  sp.ax=doorX;
  const rimY=base-wall;

  /* A second cap beside the house, behind it: drawn first. */
  if(pup){
    const px=cx+capR+Math.round(pup*0.45), stem=M(0.92);
    for(let k=0;k<=stem;k++)for(const q of [0,1])
      put(sp,px+q,base-ry-k,SOLID,q?FACE.side:FACE.front,1,N_FRONT);
    capOn(sp,px,base-ry-stem,Math.round(pup*0.62),Math.round(pup*0.5),1);
  }

  /* The room: a drum. Three bands across it for the posterise ladder, as the
     desert vault takes them: face, haunch, edge. */
  for(let dx=-r;dx<=r;dx++){
    const a=Math.abs(dx)/r;
    const value=a<0.55?FACE.top:a<0.86?FACE.front:FACE.side;
    const nx=Math.min(0.95,a)*Math.sign(dx);
    const N={x:nx,y:0,z:Math.sqrt(1-nx*nx)};
    for(let y=rimY;y<=footRow(G,dx);y++) put(sp,cx+dx,y,SOLID,value,1,N);
  }
  /* The wall stands in its own film: the foot row is a rung down. */
  for(let dx=-r;dx<=r;dx++) occlude(sp,cx+dx,footRow(G,dx),0.45);

  /* The door: low, round-headed, dark. Material 4 is the `trunk` ramp. */
  const sill=footRow(G,doorX-cx);
  for(let k=-doorHW;k<=doorHW;k++){
    /* the head steps down two rows at the jamb, one beside it */
    const head=sill-M(CAP_HOUSE_M.door)+1+Math.max(0,Math.abs(k)-doorHW+2);
    for(let y=head;y<=Math.min(sill,footRow(G,doorX-cx+k));y++){
      /* the leaf, and the reveal on the head and the left jamb */
      const i=y*sp.w+doorX+k;
      sp.occ[i]=4; sp.shade[i]=y===head||k===-doorHW?0.04:0.34; sp.ao[i]=1;
      sp.nx[i]=0; sp.ny[i]=0; sp.nz[i]=1; sp.rad[i]=2;
    }
  }
  /* The window: one lit square, its head at a maker's eye height. */
  const win=Math.max(3,M(CAP_HOUSE_M.window));
  const wx=cx+Math.round(r*0.42), wy=footRow(G,wx-cx)-M(0.78);
  for(let j=0;j<win;j++)for(let k=0;k<win;k++)
    lumen(sp,wx+k,wy+j,j===1&&k===1?RUNG[3]:RUNG[2]);
  for(let k=-1;k<=win;k++) occlude(sp,wx+k,wy-1,0.30);

  /* The chimney: a calcite stack through the dome at 0.46 of its radius,
     under its own cap. */
  const sx=cx+Math.round(capR*0.46);
  const foot=rimY-Math.round(rise*Math.sqrt(1-0.46*0.46));
  if(chimney) for(let k=-2;k<=chimney;k++)for(const q of [0,1,2])
    put(sp,sx+q,foot-k,SOLID,q===2?FACE.side:q?FACE.front:FACE.top,1,N_FRONT);

  /* the cap, over the wall's head */
  let seed=0x9e37+variant*977;
  const next=()=>((seed=(seed*1103515245+12345)>>>0)/4294967296);
  const spots=[];
  for(let k=0,n=Math.round(capR/8);k<n;k++)
    spots.push([(next()*1.4-0.7)*capR,(0.30+next()*0.5)*rise,1.2]);
  capOn(sp,cx,rimY,capR,rise,gill,spots);
  if(chimney) capOn(sp,sx+1,foot-chimney,3,2,1);
  return sp;
}

/* ── the lamp post ─────────────────────────────────────────────────────────
   A calcite post under a cut amethyst, beside the trail. INVENTED: the
   cutter's lamps (src/culture.js `stone-cutting`). The lamp stands at the
   traveller's eye height, over a maker's head. */
const LAMP_POST_M=Object.freeze({post:1.45, lamp:0.34, foot:0.34});
const lampPostFootprint=()=>({hx:3, back:2, front:2, yard:4});
function makeLampPost(){
  const post=M(LAMP_POST_M.post), lamp=M(LAMP_POST_M.lamp);
  const half=Math.max(5,M(LAMP_POST_M.foot))>>1;
  const sp=stone(2*half+3,post+lamp+2,'lampPost','amethyst');
  const cx=sp.ax, base=sp.ay;
  /* a foot stone, its top face lit */
  for(let dx=-half;dx<=half;dx++){
    put(sp,cx+dx,base,SOLID,FACE.front,1,N_FRONT);
    if(Math.abs(dx)<half) put(sp,cx+dx,base-1,SOLID,FACE.top,1,N_TOP);
  }
  /* the post: two columns, the right one turned from the light */
  for(let k=2;k<=post;k++){
    put(sp,cx-1,base-k,SOLID,FACE.top,1,{x:-0.5,y:0,z:0.866});
    put(sp,cx,base-k,SOLID,FACE.side,1,{x:0.6,y:0,z:0.8});
  }
  /* the crystal: a prism under its termination, brightest at the tip */
  for(let j=0;j<lamp;j++){
    const wide=j>0&&j<lamp-1?1:0;
    for(let dx=-wide-1;dx<=wide;dx++)
      lumen(sp,cx+dx,base-post-lamp+j,j<=1?RUNG[3]:dx<0?RUNG[2]:RUNG[1]);
  }
  return sp;
}

/* ── the cutting bench ─────────────────────────────────────────────────────
   A calcite block at a maker's waist, the stone being cut on it. A box on
   src/construct.js, so its depth runs up and right. One course: the block's
   height. */
const BENCH=cabinetBox({wM:0.92, dM:0.52, hM:0.46});
const cutBenchFootprint=()=>({...groundFootprint(BENCH,1), front:2, yard:3});
const cutBenchSlab=()=>wallSlab(BENCH,1,(BENCH.W+2)>>1);
function makeCutBench(){
  const sp=stone(BENCH.W+2,BENCH.H+M(0.32)+2,'cutBench','amethyst');
  const V=cabinet(BENCH,1,sp.ay);
  courseWall(sp,V,{courseM:BENCH.hM,seamDrop:1});
  for(let r=1;r<=BENCH.rows;r++)for(let tx=0;tx<BENCH.w;tx++){
    const p=V.top(tx,r);
    put(sp,p.x,p.y,SOLID,FACE.top,1,N_TOP);
  }
  /* the stone on the bench, and two chips beside it */
  const c=V.top(Math.round(BENCH.w*0.52),Math.max(1,BENCH.rows>>1));
  for(let j=0;j<4;j++)for(let dx=(j===0?0:-1);dx<=(j===0||j===3?0:1);dx++)
    lumen(sp,c.x+dx,c.y-4+j,j===0?RUNG[3]:dx<0?RUNG[2]:RUNG[1]);
  lumen(sp,c.x-4,c.y,RUNG[1]);
  lumen(sp,c.x+3,c.y+1,RUNG[2]);
  return sp;
}

export {
  CAP_HOUSE_M, CAP_HOUSE_VARIANTS,
  capHouseDoorHW, capHouseFootprint, capHouseGeom, capHouseSlab,
  cutBenchFootprint, cutBenchSlab, lampPostFootprint,
  makeCapHouse, makeCutBench, makeLampPost,
};
