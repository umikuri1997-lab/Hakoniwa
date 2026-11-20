import { clamp } from './math.js';
import { newSprite } from './sprite.js';
import {
  FACE, M, N_FRONT, N_SIDE, N_TOP, SOLID, bayRhythm, cabinet, cabinetBox, courseWall,
  doorPx, eavePx, groundFootprint, opening, put, roofNormal, roofPlane, wallSlab,
} from './construct.js';

/* Dimensions derive from src/scale.js through `M` in src/construct.js.
   House proportions: passive-solar constraints (docs/MEADOW.md) and the
   authored meadow silhouette. */

const HOUSE_M={ w:6.0, d:4.5, head:3.2, cler:0.85, pitch:12*Math.PI/180, eave:0.74,
                glassW:2.4, glassH:1.25, mast:2.5, rotor:1.5 };
/* The roof rotor is a separate sprite, so it animates without six copies of
   the house. λ = 7 is a low-solidity three-blade rotor; 0.12 solidity implies
   a two-pixel chord at this radius, the medium floor. */
const ROOF_M={wheel:HOUSE_M.rotor, blades:3, frames:6, tsr:7, wind:6,
              solidity:0.12, member:0.060};

/* three sizes of one vernacular, for atlas.js's variant loop */
const HOUSE_SCALE=[1.00,1.18,0.86];

/* ── The house is a cabinet volume ───────────────────────────────────────────
   The shell is one box `head` metres tall and `d` metres deep, so its depth
   costs `rows` of top face and `cols` of return. src/construct.js and
   docs/CANON.md carry the projection and the concession.

   The clerestory is the top `cler` metres of the same box, not a stacked
   storey (docs/MEADOW.md). Only the roof sits above `head`. */
function houseDims(v){
  const k=HOUSE_SCALE[v];
  const eave=eavePx(HOUSE_M.eave*k);
  const box=cabinetBox({wM:HOUSE_M.w*k, dM:HOUSE_M.d*k, hM:HOUSE_M.head*k});
  const wall=M((HOUSE_M.head-HOUSE_M.cler)*k), cler=box.h-wall;
  /* the butterfly rises outward from the valley: half-span times the
     tangent */
  const rise=Math.round((box.w/2+eave)*Math.tan(HOUSE_M.pitch));
  const mast=M(HOUSE_M.mast*k), rotor=M(HOUSE_M.rotor*k);
  /* W is the drawn width: front face, both eaves, and the return. Keep-outs
     measure from it. */
  return {W:box.w+eave*2+box.cols, box, wall, cler, eave, rise, mast, rotor, k};
}
function houseDoorDX(v){ const G=houseGeom(v); return G.doorX-G.sp.ax; }

function houseGeom(v){
  const D=houseDims(v), {box}=D;
  const x0=D.eave;                                   // the left overhang's room
  const halfF=(box.w-1)/2, span=box.w/2+D.eave;
  /* rows above the shell's top edge, for a column measured on the front face.
     fx runs from -eave to w-1+eave, so the profile covers the overhang too. */
  const riseAt=(fx)=>Math.round(D.rise*Math.min(1,Math.abs(fx-halfF)/Math.max(1,span)));
  /* the mast stands on the roof, half its depth back */
  const mastFx=Math.round(box.w*0.78), mastR=box.rows>>1;
  const mastFoot=riseAt(mastFx)+mastR;
  const above=Math.max(D.rise+box.rows, mastFoot+D.mast);
  const W=x0+box.w+D.eave+box.cols, H=box.h+above+1;
  const V=cabinet(box,x0,H-1);
  const sp={w:W|1,h:H,ax:(W|1)>>1,ay:H-1};
  const mastX=x0+mastFx+mastR, mastTop=V.yTop-mastFoot-D.mast;
  /* Four bays: solid wall, two of glazing, the door. The valley drains down
     the centre of the front face, and on three bays the downpipe crosses the
     middle window. The door collider and the drawn door read this one
     rhythm. */
  const bays=bayRhythm(box.w,4,{margin:M(0.6*D.k),
                                widthPx:M(HOUSE_M.glassW*D.k)/2});
  const doorW=Math.max(5,M(0.95*D.k))|1;
  const doorX=x0+Math.round((bays[3][0]+bays[3][1])/2);
  return {D,box,V,sp,W:W|1,H,x0,riseAt,above,mastX,mastTop,mastFx,mastR,
          bays,doorX,doorW};
}
/* world offset of the rotor hub from the house's ground anchor */
function houseRotorSite(v){
  const G=houseGeom(v);
  return {x:G.mastX-G.sp.ax, y:G.mastTop-G.sp.ay};
}
/* How high the rotor stands above the ground, in rows. The projected-shadow
   pass roots a caster on its sprite's bottom edge and shears by its own
   height, which is wrong for a caster on a roof. */
function houseRotorLift(v){
  const G=houseGeom(v);
  /* The rotor's anchor is its centre, so its foot is half a sprite below the
     hub. Half the sprite, not half the rotor: makeRoofRotor pads the wheel by
     five columns for the blade tips. */
  const R=Math.max(4,M(ROOF_M.wheel)>>1), foot=((R*2+5)|1)>>1;
  /* Height terms only. Under cabinet both height and depth move a sprite up
     the screen, so `sp.ay - mastTop` also counts `mastR`, the rows the mast
     stands back on its roof. Counting that depth makes the rotor seventeen
     rows too tall and pushes its cast root past the ground it stands over. */
  return G.box.h+G.riseAt(G.mastFx)+G.D.mast-foot;
}
/* The wall's own base, as the exact figure the collider tests. */
function houseSlab(v){
  const G=houseGeom(v);
  return wallSlab(G.box,G.x0,G.sp.ax);
}

/* ── The yard is part of the geometry ────────────────────────────────────────
   Stated here, in the module that draws the widths, and read in worldgen. Two
   bands:

     core: the drawn silhouette, eave included. Nothing stands here and no
           other structure may reach into it.
     yard: core plus a person's worth of kept-clear circulation. No woody
           plant; grass grows up to the wall.

   0.914 m is the clearance for circulation (Merrell et al., ACM TOG 30(4),
   2011: a person is a disc of radius 0.457 m).

   `back` is the depth. The anchor is the base of the wall, so the building
   extends back from it and only its eave and step come forward. Hence a box:
   a radius test on a 134x60 house is wrong by a factor of two on one axis. */
const YARD_M=0.914;
/* The fallback for kinds that declare no footprint. `cabinFootprint` in
   src/cabin.js derives the cabin's own keep-out from the width it draws. */
const CABIN_YARD={hx:36, back:34, front:26, yard:0};
function steadingFootprint(kind,variant=0){
  switch(kind){
    case 'house':{
      /* Concession (docs/CANON.md): the drawn base is a parallelogram sheared
         `cols` right of the world rectangle, so the keep-out is measured off
         the drawing. */
      const D=houseDims(variant), f=groundFootprint(D.box,D.eave);
      return {hx:f.hx, back:f.back, front:M(1.2), yard:M(YARD_M)};
    }
    case 'pump':     return {hx:M(PUMP_M.baseW)>>1, back:6, front:6, yard:M(YARD_M)};
    case 'derelict': return {hx:M(DERELICT_M.w)>>1, back:6, front:4, yard:M(YARD_M)};
    case 'nestPole': return {hx:3, back:4, front:4, yard:M(YARD_M)};
    default:         return {...CABIN_YARD};
  }
}

function makeHouse(rnd,variant){
  const G=houseGeom(variant), {D,box,V,W,H,x0,riseAt}=G;
  const sp=newSprite(W,H);
  sp.ax=G.sp.ax; sp.ay=G.sp.ay;
  /* the pale shell uses birch so roof planes stay distinct from timber */
  sp.ramp='birch'; sp.ramp2='canopy'; sp.sMin=0.06; sp.sMax=1.00;
  sp.kind='house'; sp.tilt=0;
  const cler=D.cler;

  /* ── the wall, front face and return in one pass ────────────────────────
     Courses wrap the corner. The clerestory is the top `cler` rows of the
     same box and is drawn as glass below. */
  courseWall(sp,V,{skip:(fx,fy)=>fy<cler});

  /* Glazing is a light: painted at the top of the wall's own ramp. A window
     painted dark is a doorway. The band turns the corner, so the return
     carries the same glass a rung down.

     The band follows the roof line down (the stack outlet, docs/MEADOW.md).
     At one height it leaves a triangular hole of eight rows at each end,
     where the butterfly rises outward from the valley. */
  const clerTop=(fx)=>-riseAt(clamp(fx,0,box.w-1));
  for(let fx=0;fx<box.w;fx++)for(let fy=clerTop(fx);fy<cler;fy++){
    const mull=(fx%6)===0, p=V.front(fx,fy);
    put(sp,p.x,p.y,SOLID,mull?0.14:(fy===clerTop(fx)?1.00:0.92),1,N_FRONT);
  }
  /* the return's band meets the roof at its own receding column, so its head
     is a constant depth below the eave */
  for(let r=1;r<=box.rows;r++)for(let fy=clerTop(box.w-1);fy<cler;fy++){
    const mull=((box.w-1+r)%6)===0, p=V.side(fy,r);
    put(sp,p.x,p.y,SOLID,mull?0.10:(fy===clerTop(box.w-1)?0.56:0.48),1,N_SIDE);
  }

  /* ── the passive-solar glazing HOUSE_M declares ─────────────────────────
     glassW x glassH is 3.0 m2, the overlap of the daylighting and passive-solar
     rules in docs/MEADOW.md. Glazing takes the two middle bays and the door
     its own, so the door cannot land on a window. */
  const glassH=Math.max(4,M(HOUSE_M.glassH*D.k));
  const glassTop=cler+Math.round((box.h-cler)*0.22);
  for(const [a,b] of G.bays.slice(1,3))
    opening(sp,V,{fx0:a,fx1:b,fy0:glassTop,fy1:glassTop+glassH-1,kind:'window',
      /* Glazed in the shell's own material. ramp2 is `canopy` (the planter)
         and material 6 resolves against ramp2, which paints the panes foliage
         green. */
      glazeMaterial:SOLID, glaze:1.00});

  /* ── the roof ───────────────────────────────────────────────────────────
     One albedo, two normals. PROJECTION.md: a shade gradient and a normal
     across the same plane multiply two descriptions of one form.

     The PV panels are darker than the deck. They stop at the wall: the
     overhang is roofing, not array. */
  const half=(box.w-1)/2, vx=Math.round(half);
  roofPlane(sp,V,{
    riseAt, fx0:-D.eave, fx1:box.w-1+D.eave,
    wallX0:0, wallX1:box.w-1,
    normalAt:(fx)=>roofNormal(HOUSE_M.pitch,fx<half?1:-1),
    valueAt:(fx)=>{
      const onArray=fx>=0&&fx<box.w&&Math.abs(fx-vx)>2;
      /* counted off the valley column: off the half-pixel half-width the
         panel seams land one column out of step across the valley */
      const seam=(Math.abs(fx-vx)%5)===0;
      /* Posterise cuts at 1/6, 1/2 and 5/6 on lit*ao. A panel at 0.46 and a
         seam at 0.34 land on one rung at every sun angle. 0.17 is under the
         bottom cut for any lit a top face reaches. */
      return onArray?(seam?0.17:0.46):FACE.top;
    },
    fascia:2, fasciaValue:0.08, castRows:2, cast:0.56,
  });

  /* ── the valley and its downpipe ────────────────────────────────────────
     The valley runs front to back so the roof keeps its full pitch under k=1/2
     (docs/MEADOW.md). It is a gutter, drawn as a dark member: with occlusion
     alone it keeps the deck's shade of 1.00 and reads as the brightest line
     on the roof. */
  const vTop=V.yTop-riseAt(vx);
  for(let r=0;r<=box.rows;r++)for(let q=-1;q<=1;q++)
    put(sp,x0+vx+r+q,vTop-r,SOLID,q===0?0.09:0.30,1,N_TOP);
  for(let fy=0;fy<box.h-1;fy++){
    const p=V.front(vx,fy);
    put(sp,p.x,p.y,SOLID,0.20,1,N_FRONT);
  }

  /* ── the door, in the third bay ───────────────────────────────────────── */
  const dh=doorPx(2.05*D.k), dc=G.doorX-x0;
  opening(sp,V,{fx0:dc-(G.doorW>>1), fx1:dc+(G.doorW>>1),
                fy0:box.h-dh, fy1:box.h-1, kind:'door'});

  /* ── the planter along the sill (authored choice) ─────────────────────── */
  for(let fx=1;fx<box.w-1;fx++) if(rnd.chance(0.70)){
    const p=V.front(fx,box.h-1), i=p.y*sp.w+p.x;
    sp.occ[i]=2; sp.shade[i]=clamp(0.54+rnd.range(-0.14,0.20),0,1);
    sp.ao[i]=0.9; sp.nx[i]=0; sp.ny[i]=-0.35; sp.nz[i]=0.937; sp.rad[i]=1;
  }

  /* ── the roof-mounted micro-turbine's mast ───────────────────────────────
     The rotor is a separate animated sprite centred at houseRotorSite(). Two
     pixels is the medium floor: the 60 mm tube is 0.92 px at life scale. */
  const mastPx=Math.max(2,M(ROOF_M.member));
  for(let y=G.mastTop;y<V.yTop-riseAt(G.mastFx)-G.mastR;y++)
    for(let dx=0;dx<mastPx;dx++)
      put(sp,G.mastX+dx-(mastPx>>1),y,SOLID,0.88,1,N_FRONT);
  return sp;
}

/* Six-blade farm pump, proportions from tip-speed and pixel-grid
   constraints. */
const PUMP_M={ tower:10.06, bay:1.00, wheel:2.44, blades:6, frames:6,
               tsr:2, wind:6, solidity:0.34, member:0.075 };
/* `baseW` is the truss footing in metres, shared by `makeTrussBay` and the
   keep-out. `bays` is the tower height over the bay height. */
PUMP_M.baseW=1.30;
PUMP_M.bays=Math.round(PUMP_M.tower/PUMP_M.bay);
PUMP_M.memberPx=Math.max(2,M(PUMP_M.member));
ROOF_M.memberPx=Math.max(2,M(ROOF_M.member));
const ROTORS={pump:PUMP_M,roof:ROOF_M};

/* Turns per second follows directly from tip-speed ratio:
     λ = omega*R/U  ->  rev/s = λU/(2*pi*R) = λU/(pi*D).
   `wind` is the UI's multiplier around the stated 6 m/s reference. */
function rotorRps(spec,wind){
  return spec.tsr*spec.wind*Math.max(0,wind===undefined?1:wind)/(Math.PI*spec.wheel);
}
/* The atlas holds one blade period. `windSeconds` is the time-integral of the
   wind multiplier, so a slider change alters speed without a phase jump. */
function rotorFrame(spec,windSeconds,phase){
  const turns=rotorRps(spec,1)*windSeconds+(phase||0);
  const bladePhase=((turns*spec.blades)%1+1)%1;
  return Math.min(spec.frames-1,Math.floor(bladePhase*spec.frames));
}

function makeTrussBay(rnd,seg){
  const W=M(PUMP_M.baseW), H=M(PUMP_M.bay);
  const sp=newSprite(W|1,H);
  sp.ax=W>>1; sp.ay=H-1;
  sp.ramp='birch'; sp.sMin=0.14; sp.sMax=0.78; sp.kind='bay'; sp.tilt=0;
  /* the tower tapers: the legs converge toward the head. seg 0 is the ground
     bay. */
  const inset=Math.round(seg*0.55);
  const put=(x,y,sh)=>{ if(x<0||y<0||x>=W||y>=H) return; const i=y*W+x;
    sp.occ[i]=1; sp.shade[i]=clamp(sh,0,1); sp.ao[i]=0.95;
    sp.nx[i]=0; sp.ny[i]=-0.1; sp.nz[i]=0.995; sp.rad[i]=1; };
  const member=(x,y,sh)=>{
    const n=PUMP_M.memberPx;
    for(let yy=0;yy<n;yy++)for(let xx=0;xx<n;xx++)
      put(x+xx-(n>>1),y+yy-(n>>1),sh);
  };
  const l=inset, r=W-1-inset;
  for(let y=0;y<H;y++){ member(l,y,0.30); member(r,y,0.74); } // the two legs
  for(let x=l;x<=r;x++) member(x,0,0.52);                     // the horizontal
  /* one diagonal per bay, alternating */
  for(let i=0;i<H;i++){
    const t=i/Math.max(1,H-1);
    member(Math.round(seg%2?l+(r-l)*t:r-(r-l)*t),i,0.44);
  }
  return sp;
}

/* the head and the wheel, one sprite per rotor frame */
function makeWheel(rnd,frame){
  const R=Math.max(4,M(PUMP_M.wheel)>>1);
  const W=R*2+5, H=R*2+M(1.4);
  const sp=newSprite(W|1,H);
  sp.ax=W>>1; sp.ay=H-1;
  sp.ramp='birch'; sp.sMin=0.16; sp.sMax=0.94; sp.kind='wheel'; sp.tilt=0;
  const put=(x,y,sh)=>{ if(x<0||y<0||x>=W||y>=H) return; const i=y*W+x;
    sp.occ[i]=1; sp.shade[i]=clamp(sh,0,1); sp.ao[i]=0.95;
    sp.nx[i]=0; sp.ny[i]=-0.1; sp.nz[i]=0.995; sp.rad[i]=1; };
  const cx=W>>1, cy=R+1;
  /* The sails sweep one blade period across the six frames. The chord comes
     from rotor solidity: B*chord*(0.65R) = sigma*pi*R^2. At R=19 and
     sigma=0.34 this is five pixels. */
  const step=(Math.PI*2/PUMP_M.blades)*(frame/PUMP_M.frames);
  const chord=PUMP_M.solidity*Math.PI*R/(PUMP_M.blades*0.65);
  for(let b=0;b<PUMP_M.blades;b++){
    const th=b*(Math.PI*2/PUMP_M.blades)+step;
    const ct=Math.cos(th), st=Math.sin(th);
    for(let s=Math.round(R*0.35);s<=R;s++){
      const half=Math.max(1,Math.round(chord*(0.42+0.58*s/R)*0.5));
      for(let q=-half;q<=half;q++)
        put(Math.round(cx+ct*s-st*q),Math.round(cy+st*s+ct*q),q<0?0.52:0.78);
    }
  }
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)
    if(dx*dx+dy*dy<=5) put(cx+dx,cy+dy,0.34);                 // hub
  /* the tail vane of a free-yaw machine */
  for(let x=cx+2;x<cx+R;x++)for(let q=0;q<PUMP_M.memberPx;q++) put(x,cy+R+1+q,0.40);
  for(let y=cy+R;y<cy+R+5&&y<H;y++)for(let q=0;q<PUMP_M.memberPx;q++) put(cx+R-1-q,y,0.66);
  /* the pump rod, down out of the head */
  for(let y=cy+2;y<H;y++)for(let q=0;q<PUMP_M.memberPx;q++) put(cx+q-(PUMP_M.memberPx>>1),y,0.28);
  return sp;
}

/* The roof rotor only. Its centre is its anchor, so placing it at
   houseRotorSite() overlays the mast without duplicating the house. */
function makeRoofRotor(rnd,frame){
  const R=Math.max(4,M(ROOF_M.wheel)>>1), W=R*2+5, H=W;
  const sp=newSprite(W|1,H|1);
  const cx=sp.w>>1, cy=sp.h>>1;
  sp.ax=cx; sp.ay=cy;
  sp.ramp='birch'; sp.sMin=0.18; sp.sMax=0.96; sp.kind='roofRotor'; sp.tilt=0;
  const put=(x,y,sh)=>{ if(x<0||y<0||x>=sp.w||y>=sp.h) return; const i=y*sp.w+x;
    sp.occ[i]=1; sp.shade[i]=clamp(sh,0,1); sp.ao[i]=0.95;
    sp.nx[i]=0; sp.ny[i]=-0.1; sp.nz[i]=0.995; sp.rad[i]=1; };
  const step=(Math.PI*2/ROOF_M.blades)*(frame/ROOF_M.frames);
  const chord=ROOF_M.solidity*Math.PI*R/(ROOF_M.blades*0.72);
  for(let b=0;b<ROOF_M.blades;b++){
    const th=b*(Math.PI*2/ROOF_M.blades)+step, ct=Math.cos(th), st=Math.sin(th);
    for(let s=Math.round(R*0.22);s<=R;s++){
      const half=Math.max(1,Math.round(chord*(0.35+0.65*s/R)*0.5));
      for(let q=-half;q<=half;q++)
        put(Math.round(cx+ct*s-st*q),Math.round(cy+st*s+ct*q),q<0?0.56:0.88);
    }
  }
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) put(cx+dx,cy+dy,0.30);
  return sp;
}

/* the derelict's shell, in metres, read by its footprint */
const DERELICT_M={ w:2.6, h:2.9 };
/* Derelict geometry is authored damage. */
function makeDerelict(rnd){
  const W=M(DERELICT_M.w)|1, H=M(DERELICT_M.h);
  const sp=newSprite(W,H);
  sp.ax=W>>1; sp.ay=H-1;
  /* birch is the bone-white ceramic; the deposit is moss, so it takes sward */
  sp.ramp='birch'; sp.ramp2='canopy'; sp.sMin=0.18; sp.sMax=0.98;
  sp.kind='derelict'; sp.tilt=0;
  /* `sh` is the face value and reaches ao. The atlas overwrites `shade` with
     thickness for materials 1 and 3; measured, 0.86 of authored shade
     variation against an ao spread of 0.13 renders one flat silhouette. */
  const put=(x,y,m,sh,occ)=>{ if(x<0||y<0||x>=W||y>=H) return; const i=y*W+x;
    sp.occ[i]=m; sp.shade[i]=clamp(sh,0,1);
    sp.ao[i]=clamp(sh*(occ===undefined?1:occ),0.04,1);
    sp.nx[i]=(x-(W>>1))/W*0.9; sp.ny[i]=-0.25;
    sp.nz[i]=Math.sqrt(Math.max(0.04,1-sp.nx[i]*sp.nx[i]-0.0625)); sp.rad[i]=2; };
  const base=H-1, cx=W>>1;
  /* the hull: a squat seated ovoid */
  const hw=Math.round(W*0.34), hh=Math.round(H*0.42), hy=base-Math.round(H*0.46);
  for(let y=hy-hh;y<=hy+hh;y++)for(let x=cx-hw;x<=cx+hw;x++){
    const u=(x-cx)/hw, v=(y-hy)/hh;
    if(u*u+v*v>1) continue;
    /* a panel seam every few rows, and rust in it */
    const seam=((y-hy+hh)%5===0);
    put(x,y,seam?3:1,seam?0.30:clamp(0.44+0.44*(1-Math.abs(u)),0,1),0.95);
  }
  /* the single eye */
  const ey=hy-Math.round(hh*0.42), ex=cx+Math.round(hw*0.32);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)
    put(ex+dx,ey+dy,1,dx===0&&dy===0?0.06:0.92,0.9);
  /* one arm resting on the ground, and the shoulder it comes from */
  for(let s=0;s<Math.round(W*0.40);s++){
    const x=cx-hw-s, y=hy+Math.round(hh*0.5+s*0.55);
    put(x,y,1,0.36,0.92); put(x,y+1,1,0.24,0.88);
  }
  /* the knees, folded */
  for(let x=cx-hw+1;x<=cx+hw+2;x++){
    const y=base-Math.round(H*0.10)-Math.round(Math.max(0,Math.cos((x-cx)/hw*1.4))*3);
    put(x,y,1,0.58,0.9); put(x,y+1,1,0.30,0.86);
    for(let yy=y+2;yy<=base;yy++) put(x,yy,1,0.18,0.82);
  }
  /* ── moss ───────────────────────────────────────────────────────────────
     Sky exposure, the snowPass rule: a pixel with nothing above it
     accumulates. snowPass itself traverses a branch structure, so the rule is
     applied here on a solid body. */
  for(let x=0;x<W;x++){
    let hit=-1;
    for(let y=0;y<H;y++) if(sp.occ[y*W+x]===1){ hit=y; break; }
    if(hit<0) continue;
    let d=0;
    for(let y=hit;y<H&&d<2;y++){
      const i=y*W+x;
      if(sp.occ[i]!==1) break;
      if(rnd.chance(0.62-d*0.22)){
        sp.occ[i]=2; sp.shade[i]=clamp(0.46+rnd.range(-0.14,0.22),0,1);
        sp.ao[i]=0.92; sp.ny[i]=-0.34;
        sp.nz[i]=Math.sqrt(Math.max(0.04,1-sp.nx[i]*sp.nx[i]-0.1156));
      }
      d++;
    }
  }
  return sp;
}

/* ── THE NEST POLE ───────────────────────────────────────────────────────────
   A cartwheel on a post, raised to bring a stork to a steading: a real
   practice across the white stork's range, where a nest on the holding is
   kept and repaired. Measured ranges: platforms 6 to 10 m up, a wheel near
   1.2 m, a stick nest 0.8 to 1.5 m across that the pair adds to each year.

   The bird on it is one adult on the nest. src/stork.js draws the other one,
   on the ground. No chick is drawn.

   Materials: the sitting bird is the instance ramp (`loam`, as the walking
   stork), so the post, wheel and sticks take the trunk ramp (material 4):
   weathered wood. The bill is the accent, which needs ramp2 unset.

   The nest is one value. Its sticks are the ragged outline, never noise
   inside the mass (PROJECTION.md, value budget). */
const NEST_POLE_M={ pole:6.0, wheel:1.2, nest:1.4, nestH:0.55, bird:0.75 };
function makeNestPole(rnd){
  const nestW=M(NEST_POLE_M.nest)|1, nestH=M(NEST_POLE_M.nestH);
  const poleH=M(NEST_POLE_M.pole), birdH=M(NEST_POLE_M.bird);
  const W=nestW+6, H=poleH+nestH+birdH+2;
  const sp=newSprite(W,H);
  sp.ax=W>>1; sp.ay=H-1;
  sp.ramp='loam'; sp.sMin=0.30; sp.sMax=1.00; sp.kind='nestPole'; sp.tilt=0;
  const put=(x,y,m,sh,nx=0)=>{ if(x<0||y<0||x>=W||y>=H) return; const i=y*W+x;
    sp.occ[i]=m; sp.shade[i]=clamp(sh,0,1); sp.ao[i]=sp.shade[i];
    sp.nx[i]=nx; sp.ny[i]=-0.25;
    sp.nz[i]=Math.sqrt(Math.max(0.04,1-nx*nx-0.0625)); sp.rad[i]=2; };
  const cx=W>>1, base=H-1, nestBot=base-poleH, nestTop=nestBot-nestH+1;
  /* the post: two columns, lit side and shade side */
  for(let y=nestBot+1;y<=base;y++){ put(cx-1,y,4,0.62,-0.6); put(cx,y,4,0.34,0.6); }
  /* the wheel, edge on, and its two braces */
  const wheelHW=M(NEST_POLE_M.wheel)>>1;
  for(let x=cx-wheelHW;x<=cx+wheelHW;x++) put(x,nestBot+1,4,0.26,0);
  for(let k=1;k<=3;k++){ put(cx-1-k,nestBot+1+k,4,0.30,-0.4); put(cx+k,nestBot+1+k,4,0.30,0.4); }
  /* the nest: a bowl of sticks, wider at the rim, with stick ends standing
     out of its outline */
  const half=nestW>>1;
  for(let y=nestTop;y<=nestBot;y++){
    const t=(y-nestTop)/Math.max(1,nestH-1);
    const hw=Math.round(half-t*half*0.42);
    for(let x=cx-hw;x<=cx+hw;x++)
      put(x,y,4,y===nestBot?0.22:0.46,(x-cx)/half*0.6);
  }
  for(let k=0;k<7;k++){
    const side=k%2?1:-1, y=nestTop+Math.floor(rnd.f()*(nestH-2));
    const t=(y-nestTop)/Math.max(1,nestH-1);
    put(cx+side*(Math.round(half-t*half*0.42)+1),y,4,0.46,side*0.7);
  }
  /* the adult on the nest: the trunk, the black folded primaries, the neck,
     the head, the bill */
  const by=nestTop-1, bodyHW=M(0.22);
  /* the back is lit and the flank a tier down: form goes in ao, the one
     channel the wood branch reads */
  for(let y=by-2;y<=by;y++){
    const hw=y===by-2?bodyHW-1:bodyHW;
    for(let x=cx-hw;x<=cx+hw;x++) put(x,y,1,y===by-2?1.0:0.66,(x-cx)/bodyHW*0.6);
  }
  for(let x=cx-bodyHW-1;x<=cx-bodyHW+1;x++) put(x,by-1,17,1.0,-0.5);
  const neckX=cx+bodyHW-1, headY=by-birdH+2;
  for(let y=headY;y<by-2;y++) put(neckX,y,1,1.0,0.3);
  for(let k=1;k<=M(0.17);k++) put(neckX+k,headY+(k>1?1:0),6,0.66,0.5);
  return sp;
}

export { HOUSE_M, HOUSE_SCALE, NEST_POLE_M, PUMP_M, ROOF_M, ROTORS,
         makeNestPole,
         houseRotorLift, houseSlab,
         YARD_M, houseDims, houseDoorDX, houseRotorSite, makeDerelict, makeHouse,
         makeRoofRotor, makeTrussBay, makeWheel, rotorFrame, rotorRps,
         steadingFootprint };
