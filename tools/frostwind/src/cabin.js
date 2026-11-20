import { clamp } from './math.js';
import { N_SIDE, cabinet, roofNormal, roofPlane, wallSlab } from './construct.js';
import { newSprite } from './sprite.js';
import { PX_PER_M, obliqueCols, obliqueRows } from './scale.js';

/* ═══════════════════════════════════════════════════════════════════════════
   Cabin exteriors. worldgen reads the footprint and the door offset from
   here to place buildings.

   The drawing is a dark log block, a steep pale roof and one lit window. The
   straight-edged roof against organic forms is the silhouette, and the window
   spends the warm end of the palette.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The three cabins' dimensions, read by the drawing and the collision
   model. */
const CABIN_W=[62,74,54], CABIN_H=[76,84,66];
/* Depth: 3.2 m against a 4.05 m front is a one-room boreal cabin.
   docs/CANON.md carries the projection and its concession. */
const CABIN_D_M=3.2;
const cabinDepth=()=>2*Math.round((CABIN_D_M*PX_PER_M)/2);
/* the drawn sheet, so the keep-out and the collider read one width */
function cabinSheet(variant=0){
  const d=cabinDepth();
  return {w:CABIN_W[variant], h:CABIN_H[variant],
          cols:obliqueCols(d), rows:obliqueRows(d)};
}
function cabinFootprint(variant=0){
  const s=cabinSheet(variant);
  return {hx:(s.w+s.cols)>>1, back:s.rows, front:Math.round(0.8*PX_PER_M), yard:0};
}
/* The log wall's base, as the exact figure the collider tests. The sheet is
   `cols` wider than the wall and the anchor sits at its middle, so the wall's
   centre is half a return to the left of it. */
function cabinSlab(variant=0){
  const s=cabinSheet(variant), SW=s.w+s.cols;
  return wallSlab({w:s.w,rows:s.rows,cols:s.cols},0,SW>>1);
}
/* The doorway's centre, measured from the building's anchor. The doorway is
   drawn at 0.58 of the sprite's width, so each variant has its own offset. */
function cabinDoorDX(variant){
  const W=CABIN_W[variant];
  return Math.round(W*0.58)+4-(W>>1);
}
function makeCabin(rnd,variant){
  /* The pixel grid sets the course spacing and the one-row eave (a two-row
     eave reads as a second roof); they do not scale with the building.
     Fractions of W or H do. */
  const W=CABIN_W[variant], H=CABIN_H[variant];
  const S=cabinSheet(variant), SW=W+S.cols, SH=H+S.rows;
  const sp=newSprite(SW,SH);
  sp.ax=SW>>1; sp.ay=SH-1;
  sp.ramp='warm'; sp.sMin=0.06; sp.sMax=0.74; sp.kind='cabin'; sp.tilt=0;
  /* The front face keeps its own coordinates and this writer drops it `rows`
     down the sheet. */
  const put=(x,y,m,sh,ao,nn,N)=>{
    /* y is front-face space, and the depth sweep reaches above its origin: the
       ridge is `rows` further up than the gable's apex. Guarding y<0 in
       front-face space clips the chimney stack to a dash. */
    if(x<0||x>=SW||y+S.rows<0||y+S.rows>=SH) return;
    const i=(y+S.rows)*SW+x;
    sp.occ[i]=m; sp.shade[i]=clamp(sh,0,1); sp.ao[i]=ao===undefined?1:ao;
    if(N){ sp.nx[i]=N.x; sp.ny[i]=N.y; sp.nz[i]=N.z; return; }
    if(nn!==undefined){ sp.nx[i]=nn*0.8; sp.ny[i]=-0.2;
      sp.nz[i]=Math.sqrt(Math.max(0.04,1-nn*nn*0.64-0.04)); }
  };
  /* The roof takes 0.60 of the height: a roof pitched steep enough to shed
     snow. At 0.46 the wall dominates and the building reads as a shed. */
  const wallTop=Math.round(H*0.60), base=H-1;
  const wl=2, wr=W-3;

  /* ── walls: squared logs. Horizontal courses, two values and a darker
     course line; the log ends cross at the corners. */
  for(let y=wallTop;y<=base;y++){
    const course=(y-wallTop)%4===3;
    for(let x=wl;x<=wr;x++){
      const nn=clamp((x-(wl+wr)*0.5)/((wr-wl)*0.5),-1,1);
      put(x,y,1,0,course?0.44:0.72-0.12*Math.abs(nn),nn*0.6);
    }
    /* the crossed log ends at each corner */
    if(course){ put(wl-1,y,1,0,0.52); put(wr+1,y,1,0,0.52); }
    /* the return, carrying the same courses around the corner */
    for(let r=1;r<=S.cols;r++)
      put(wr+1+r,y-r,1,0,course?0.20:0.34,undefined,N_SIDE);
  }
  /* ── the roof: steep, straight, snow-covered ─────────────────────────── */
  const peak=1, eave=wallTop, over=3;
  const halfAt=(y)=>Math.round(((y-peak)/Math.max(1,eave-peak))*((W>>1)+over-1))+1;
  /* The roof planes behind the gable end. The ridge runs front to back, so
     the two planes fall left and right and recede with the volume.

     Swept through roofPlane. A slant edge that steps less than one column per
     row does not tile under a 1:1 shear: swept by hand it prints as
     `T T TT T T`. The riser fill in src/construct.js solves that. */
  const hw=(W>>1)+over-1;
  const roofTopY=(x)=>clamp(peak+Math.round(((Math.abs(x-(W>>1))-1)/Math.max(1,hw))
    *(eave-peak)),peak,eave);
  const RV=cabinet({w:W,h:1,cols:S.cols,rows:S.rows},0,eave+S.rows);
  roofPlane(sp,RV,{
    riseAt:(fx)=>eave-roofTopY(fx), fx0:-over, fx1:W-1+over,
    wallX0:wl, wallX1:wr, material:2, depth:S.rows,
    normalAt:(fx)=>roofNormal(Math.atan((eave-peak)/Math.max(1,hw)),
                              fx<(W>>1)?-1:1),
    valueAt:(fx)=>fx<(W>>1)?1.00:0.70,
    fascia:1, fasciaValue:0.30, castRows:2, cast:0.62,
  });
  for(let y=peak;y<=eave;y++){
    const half=halfAt(y);
    for(let x=(W>>1)-half;x<=(W>>1)+half;x++){
      /* three values: sunward snow, lee snow in shadow, the ridge line */
      const lit=x<(W>>1);
      put(x,y,2,0.9, lit?0.95:0.62);
    }
    if(y>peak+1) put(W>>1,y,2,0.9,0.40);              // the ridge line
  }
  /* the eave: one dark row under the snow separates roof from wall */
  for(let x=(W>>1)-((W>>1)+over);x<=(W>>1)+((W>>1)+over);x++) put(x,eave+1,1,0,0.22);
  /* a bank of snow slid off the eaves and piled against the wall */
  for(let x=wl-1;x<=wr+1;x++){
    const d=Math.round(2+ (rnd.chance(0.5)?1:0));
    for(let y=base-d;y<=base;y++) put(x,y,2,0.9,0.86);
  }
  /* ── the window, and the door ─────────────────────────────────────────── */
  const wW=5, wH=5;
  const wx0=Math.round(W*0.22), wy0=wallTop+Math.round((base-wallTop)*0.26);
  for(let y=wy0;y<wy0+wH;y++) for(let x=wx0;x<wx0+wW;x++) put(x,y,6,0.92);
  /* the glazing bars */
  for(let y=wy0;y<wy0+wH;y++) put(wx0+2,y,1,0,0.30);
  for(let x=wx0;x<wx0+wW;x++) put(x,wy0+2,1,0,0.30);
  for(let y=wy0-1;y<=wy0+wH;y++){ put(wx0-1,y,1,0,0.24); put(wx0+wW,y,1,0,0.24); }
  for(let x=wx0-1;x<=wx0+wW;x++){ put(x,wy0-1,1,0,0.24); put(x,wy0+wH,1,0,0.24); }
  /* The doorway, wide enough for the traveller. Its bottom row is left open
     so the threshold reads as a gap in the wall. */
  const dW2=8, dx0=Math.round(W*0.58), dTop=base-Math.round((base-wallTop)*0.66);
  for(let y=dTop;y<=base-1;y++) for(let x=dx0;x<dx0+dW2;x++) put(x,y,1,0,0.10);
  for(let y=dTop-1;y<=base-1;y++){ put(dx0-1,y,1,0,0.30); put(dx0+dW2,y,1,0,0.30); }
  for(let x=dx0-1;x<=dx0+dW2;x++) put(x,dTop-1,1,0,0.34);
  /* ── the chimney, on the lee pitch, with its own cap of snow ─────────────
     Placed at a column, half the depth back, and drawn up from the pitch it
     comes through. A bar down the gable face reads as a stripe painted on the
     roof. */
  const cw=Math.max(3,Math.round(0.55*PX_PER_M));
  const cfx=Math.round(W*0.66), cr=S.rows>>1;
  const cFoot=roofTopY(cfx)-cr, cTop=cFoot-Math.max(4,Math.round(0.9*PX_PER_M));
  for(let y=cTop;y<=cFoot;y++)for(let q=0;q<cw;q++)
    put(cfx+cr+q,y,1,0,q===cw-1?0.22:0.40);
  for(let q=-1;q<=cw;q++) put(cfx+cr+q,cTop-1,2,0.9,0.95);
  return sp;
}

export { CABIN_H, CABIN_W, cabinDoorDX, cabinFootprint, cabinSlab, makeCabin };
