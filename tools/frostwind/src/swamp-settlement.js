import { GROUND_PX_PER_ROW } from './basin.js';
import { clamp } from './math.js';
import { hashf } from './rng.js';
import { newSprite } from './sprite.js';
import {
  FACE, M, MEven, N_FRONT, N_SIDE, OPEN, cabinet, cabinetBox, eavePx, occlude,
  roofNormal, roofPlane, wallSlab,
} from './construct.js';

const SWAMP_HOUSE={
  /* 5.8 x 4.2 is 24 m2, the small-dwelling basis docs/MEADOW.md cites for the
     meadow house's 6.0 x 4.5. */
  widthM:5.8,depthM:4.2,wallM:2.5,designFloodM:1.8,freeboardM:0.55,eaveM:0.65,
  pileM:2.35,roofM:1.05,screened:true,crossVent:true,rainCatchment:true,
};
SWAMP_HOUSE.floorM=SWAMP_HOUSE.designFloodM+SWAMP_HOUSE.freeboardM;
const SWAMP_PILE_HALF=Math.max(1,M(0.14));
const swampHouseFloorPx=()=>M(SWAMP_HOUSE.floorM);

/* One vernacular, three sizes. The baker, the keep-out and the pile positions
   read this one scale. */
const swampHouseScale=(v)=>0.9+v*0.08;
const swampHouseBox=(v)=>cabinetBox({wM:SWAMP_HOUSE.widthM*swampHouseScale(v),
                                     dM:SWAMP_HOUSE.depthM*swampHouseScale(v),
                                     hM:SWAMP_HOUSE.wallM});
const swampHouseOpenings=(v=0)=>{
  const box=swampHouseBox(v);
  const dW=M(0.86)|1,dH=M(1.9);
  const dx=box.w-M(1.4)-(dW>>1);
  const left=M(0.50),right=dx-M(0.20),gap=M(0.34);
  const bayW=Math.max(M(0.72),Math.floor((right-left-gap)/2));
  return {
    wTop:Math.round(M(0.42)),wBot:Math.round(M(1.58)),
    bays:[[left,left+bayW-1],[left+bayW+gap,right]],
    door:{x0:dx,x1:dx+dW-1,fy0:box.h-dH,fy1:box.h-1},
  };
};
/* Every row the sheet occupies above its anchor, including the `rows` of top
   face. A keep-out that omits them lets a tree paint its crown through the
   roof. */
const swampHouseRows=(v=0)=>{
  const box=swampHouseBox(v);
  return M(SWAMP_HOUSE.floorM)+box.h+M(SWAMP_HOUSE.roofM)+box.rows+3;
};
/* Three bays of piles, at the front face's own columns. The drawing, the brace
   geometry and the shadow test read this one list. */
const swampHousePiles=(v=0)=>{
  const box=swampHouseBox(v), x0=eavePx(SWAMP_HOUSE.eaveM);
  return [x0+3,x0+(box.w>>1),x0+box.w-4];
};
/* All six legs, as offsets from the sprite anchor, for the collider. The
   undercroft is open and walkable, so the legs stop a body. The back row
   stands under the floor's back edge, `rows` up-screen and `cols` right of
   the front row. */
const swampHousePileDX=(v=0)=>{
  const box=swampHouseBox(v), eave=eavePx(SWAMP_HOUSE.eaveM);
  const anchor=((eave+box.w+eave+box.cols)|1)>>1;
  const front=swampHousePiles(v).map(p=>({dx:p-anchor,dy:0}));
  const back=swampHousePiles(v).map(p=>({dx:p+box.cols-anchor,dy:-box.rows}));
  return [...front,...back];
};
const swampHouseSlab=(v=0)=>{
  const box=swampHouseBox(v),eave=eavePx(SWAMP_HOUSE.eaveM);
  const W=(eave+box.w+eave+box.cols)|1;
  return wallSlab(box,eave,W>>1);
};
const swampPileSlab=()=>{
  const d=MEven(0.28);
  return {hx:d/2,back:d/2,shear:d/2,dx:0};
};
/* The keep-out, off the drawn base. The 36/34/26 cabin fallback gives half the
   width this volume needs. `back` is the depth the top face occupies. */
const swampHouseFootprint=(v=0)=>{
  const box=swampHouseBox(v), eave=eavePx(SWAMP_HOUSE.eaveM);
  return {hx:(box.w+eave*2+box.cols)>>1, back:box.rows, front:M(0.8),
          yard:M(0.914)};
};

/* Hydrology → site affordance → cultural plan → candidates → composition. */
function makeSwampSettlement(seed,{pathX,common,hydrologyAt,pool,
                                   alligatorHoles=[],avoid=[]}){
  const landing={x:Math.round(pathX(common.y)),y:common.y,kind:'landing'};
  const candidates=[];
  for(let i=0;i<48;i++){
    const a=(i/48)*Math.PI*2+hashf(i,seed,0x51ae)*0.18;
    const d=165+(i%4)*62;
    const x=Math.round(landing.x+Math.cos(a)*d);
    const y=Math.round(landing.y+Math.sin(a)*d*0.72);
    /* Compiled places own their ground. The lakehouse is sited before this
       runs, so its basin and rim are already in the field. */
    if(avoid.some(q=>Math.hypot(x-q.x,y-q.y)<(q.r||0)))continue;
    const h=hydrologyAt(x,y);
    const refuge=Math.min(...alligatorHoles.map(q=>Math.hypot(x-q.x,y-q.y)-q.r),1e9);
    if(refuge<84)continue;
    const stability=(!h.water?1.2:h.depth<0.22?0.62:0);
    const access=1-Math.min(1,Math.abs(x-pathX(y))/220);
    candidates.push({x,y,score:stability+access*0.55+refuge/2600,depth:h.depth});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const houses=[];
  for(const c of candidates){
    /* Prefer sites south of the landing so pile houses do not sit on the
       meadow portal approach (north, toward portalY≈0), where a tall sprite
       covers the ground ring. */
    if(c.y<landing.y-40)continue;
    if(houses.every(h=>Math.hypot(h.x-c.x,h.y-c.y)>165)){
      houses.push({...c,kind:'swampHouse',variant:houses.length%3});
      if(houses.length===4)break;
    }
  }
  if(houses.length<4){
    for(const c of candidates){
      if(houses.some(h=>h.x===c.x&&h.y===c.y))continue;
      if(houses.every(h=>Math.hypot(h.x-c.x,h.y-c.y)>165)){
        houses.push({...c,kind:'swampHouse',variant:houses.length%3});
        if(houses.length===4)break;
      }
    }
  }
  /* Houses sit on separate hummocks; circulation is dry peat and shallow
     water. The settlement lays no boardwalk. */
  const architecture=[];
  for(const h of houses)architecture.push(h);
  const h0=houses[0]||landing,h1=houses[1]||landing;
  /* ── The boats go where the water is ──────────────────────────────────────
     Water props read off the mooring pool, which the world model states
     before this runs. `at(q, bearing)` is a point at basin metric `q` on the
     pool: exactly 1 is the waterline, under it is afloat and over it is bank,
     whatever the pool's size or shape.

     The bearing is a ground bearing, because the pool is not an ellipse: a
     fraction of a radius on a screen angle lands at the wrong radius.
     PROJECTION.md. */
  const bear=Math.atan2((pool.cy-landing.y)*GROUND_PX_PER_ROW,
                        pool.cx-landing.x)+Math.PI;
  const at=(q,lat=0)=>pool.at(bear+lat,q);
  architecture.push(
    {kind:'swampDock',...at(0.86),variant:0},
    {kind:'swampSkiff',...at(0.54,-0.24),variant:0},
    {kind:'swampRack',x:h0.x-34,y:h0.y+10,variant:0},
    {kind:'swampCistern',x:h1.x+38,y:h1.y+12,variant:0},
    {kind:'swampMooring',...at(0.70,0.28),variant:0},
    {kind:'swampTrap',...at(0.44,0.78),variant:0},
    /* the winch and the chest are shore work and stay on the bank */
    {kind:'swampWinch',...at(1.30,-0.34),variant:0},
    {kind:'swampChest',...at(1.34,-0.72),variant:0},
  );
  /* A house occupies rows as well as ground. A tree anchored up-screen of a
     pile house sorts behind it and paints its crown out of the roof, so woody
     kinds are held off the rows each house draws into (`swampHouseRows`, the
     arithmetic `makeSwampHouse` lays its sheet out with). */
  const HOUSE_ROWS=swampHouseRows(0);
  const houseHalfOf=(v)=>{
    const box=swampHouseBox(v);
    return (box.w+eavePx(SWAMP_HOUSE.eaveM)*2+box.cols)>>1;
  };
  const clearAt=(x,y,tall=false)=>{
    if(Math.hypot(x-landing.x,y-landing.y)<(tall?78:42)) return true;
    if(!tall) return false;
    return houses.some(h=>{
      const dy=y-h.y;
      return Math.abs(x-h.x)<houseHalfOf(h.variant||0)+18
        &&dy>-HOUSE_ROWS&&dy<10;
    });
  };
  return {
    kind:'swampSettlement',landing,houses,
    architecture,clearAt,
    enterable:houses[0]||null,
    ownership:{
      landing:['shared repair deck','water-level ledger'],
      threshold:['wet-gear rack','removable flood boards'],
      storage:['high shelf','buoyant tool chest'],
    },
    culture:{
      authored:['water as road','cyclical flood memory','mutual repair'],
      roles:{
        swampFisher:['fish traps','drying rack','punt mooring'],
        swampBoatwright:['repair winch','removable boardwalk','high-water ledger'],
      },
    },
  };
}

/* Face values go to ao (the src/construct.js writer rule). Measured failure
   with `node tools/houses.mjs swampHouse 0`: `t` in `shade` with ao pinned at
   0.92 gives 0.87 of authored variation and an ao spread of 0.00, a flat dark
   cutout. */
const put=(sp,x,y,m,t,occ=1,N=null)=>{
  x=Math.round(x);y=Math.round(y);
  if(x<0||y<0||x>=sp.w||y>=sp.h)return;
  const i=y*sp.w+x;sp.occ[i]=m;sp.shade[i]=clamp(t,0,1);
  sp.ao[i]=clamp(t*occ,0.04,1);
  if(N){sp.nx[i]=N.x;sp.ny[i]=N.y;sp.nz[i]=N.z;sp.rad[i]=2;return;}
  /* the default is an elevation normal */
  sp.nx[i]=(x-sp.ax)/Math.max(3,sp.w)*0.8;sp.ny[i]=-0.18;
  sp.nz[i]=Math.sqrt(Math.max(0.08,1-sp.nx[i]*sp.nx[i]-0.0324));sp.rad[i]=2;
};

/* Integer Bresenham with thickness. Fractional brace samples miss typed-array
   rows. */
const stroke=(sp,x0,y0,x1,y1,m,t,thick=2,N=null)=>{
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0);
  const sx=x0<x1?1:-1,sy=y0<y1?1:-1;
  let err=dx-dy,x=x0,y=y0;
  const r=Math.max(0,thick-1);
  for(;;){
    for(let q=-r;q<=r;q++){put(sp,x+q,y,m,t,1,N);if(r)put(sp,x,y+q,m,t,1,N);}
    if(x===x1&&y===y1)break;
    const e2=err*2;
    if(e2>-dy){err-=dy;x+=sx;}
    if(e2<dx){err+=dx;y+=sy;}
  }
};

function makeSwampHouse(rnd,variant=0){
  /* A cabinet volume on piles. docs/CANON.md carries the projection and its
     concession. Structural laws: legs cast, braces do not, floor at flood plus
     freeboard, screened apertures. */
  const box=swampHouseBox(variant);
  const floor=swampHouseFloorPx(),roof=M(SWAMP_HOUSE.roofM);
  const eave=eavePx(SWAMP_HOUSE.eaveM);
  const x0=eave, W=(x0+box.w+eave+box.cols)|1;
  const H=floor+box.h+roof+box.rows+3;
  const sp=newSprite(W,H);sp.ax=W>>1;sp.ay=H-1;sp.ramp='swampWood';
  sp.ramp2='swampCanopy';sp.sMin=0.04;sp.sMax=0.96;sp.kind='swampHouse';
  const base=H-1,fy=base-floor;
  const V=cabinet(box,x0,fy);
  /* Outdoor sun shears shadows bottom-right, so the lit elevation face is left. */
  const lit=x=>1-x/Math.max(1,W-1);
  const piles=swampHousePiles(variant);
  /* Braces are OPEN (material 12, no cast). The legs are solid and cast: with
     the legs discarded too, the lowest caster is the floor plate 36 rows up
     and the shadow lands clear of the feet (a fourteen-row gap, measured on
     the lakehouse), so the house hovers. */
  const deck=Math.max(3,M(0.22));
  /* Per-bay X braces are drawn before the legs. A thickness-3 stroke from
     `base-1` at a pile's column repaints the bottom four rows of the leg as
     material 12, the rows that tie the house to its shadow. */
  /* The back row of piles stands under the floor's back edge, `rows`
     up-screen and `cols` right of the front row, and is as long as the front
     row. Drawn first and darker. */
  const backLegs=piles.map(p=>p+box.cols);
  for(let i=0;i<backLegs.length-1;i++){
    const a=backLegs[i],b=backLegs[i+1];
    const top=fy-box.rows+deck+Math.round((base-(fy+deck))*0.10);
    stroke(sp,a,base-box.rows-1,b,top,OPEN,0.40,2);
    stroke(sp,b,base-box.rows-1,a,top,OPEN,0.40,2);
  }
  for(const x of backLegs)for(let y=fy-box.rows;y<=base-box.rows;y++)
    for(let q=-SWAMP_PILE_HALF;q<=SWAMP_PILE_HALF;q++)
      put(sp,x+q,y,1,0.16,1,N_SIDE);

  for(let i=0;i<piles.length-1;i++){
    const a=piles[i],b=piles[i+1];
    const top=fy+deck+Math.round((base-(fy+deck))*0.10);
    const braceT=0.86+0.08*lit((a+b)/2);
    stroke(sp,a,base-1,b,top,OPEN,braceT,3);
    stroke(sp,b,base-1,a,top,OPEN,braceT,3);
  }
  for(const x of piles)for(let y=fy;y<=base;y++)
    for(let q=-SWAMP_PILE_HALF;q<=SWAMP_PILE_HALF;q++)
      put(sp,x+q,y,1,0.20+0.22*lit(x));
  /* Elevated floor plate at design-flood + freeboard. Opaque deck mass throws
     the long undercroft shadow: tip ≈ |L_xy|·floorPx·(uLen/max(0.30,Lz)). */
  for(let y=fy;y<fy+deck&&y<=base;y++)for(let x=x0-2;x<x0+box.w+2;x++){
    const joist=x%5===0?-0.08:0;
    put(sp,x,y,1,0.34+0.18*lit(x)+joist,1,N_FRONT);
  }
  /* Only the plate's right end recedes. Sweeping the whole plate back draws a
     parallelogram of side face through the room, visible through the screened
     apertures. */
  for(let r=1;r<=box.rows;r++)for(let y=fy;y<fy+deck&&y<=base;y++)
    put(sp,x0+box.w+1+r,y-r,1,0.24,1,N_SIDE);
  /* The right girder joins both inset piles to the visible floor edge. Solid
     timber, so the rear support reaches the deck and casts. */
  const frontRight=piles.at(-1),backRight=backLegs.at(-1);
  const frontEdge=x0+box.w+1,backEdge=frontEdge+box.cols;
  const frontDeckY=fy+deck-2,backDeckY=frontDeckY-box.rows;
  stroke(sp,frontRight,frontDeckY,frontEdge,frontDeckY,1,0.30,2,N_FRONT);
  stroke(sp,frontEdge,frontDeckY,backEdge,backDeckY,1,0.24,2,N_SIDE);
  stroke(sp,backRight,backDeckY,backEdge,backDeckY,1,0.20,2,N_SIDE);
  stroke(sp,backRight,backDeckY+M(0.42),backEdge,backDeckY,1,0.18,2,N_SIDE);
  /* High-water memory marks on the outer pile. Solid: open marks punch
     transparent bands through the pile's shadow. */
  for(let k=0;k<4;k++)for(let q=-SWAMP_PILE_HALF;q<=SWAMP_PILE_HALF;q++)
    put(sp,piles[0]+q,base-M(0.55+k*0.36),1,0.14);
  /* Shade stays high on the open bracing (swampWood albedo is very dark). AO
     darkens only the upper third under the floor plate. */
  const aoTop=fy+deck+Math.round((base-(fy+deck))*0.38);
  for(let y=fy+deck;y<aoTop;y++)for(let x=4;x<W-4;x++){
    const i=y*sp.w+x;if(!sp.occ[i])continue;
    const under=1-0.45*((aoTop-y)/(aoTop-(fy+deck)));
    sp.shade[i]=clamp(sp.shade[i]*under,0.08,1);
    sp.ao[i]=clamp(sp.ao[i]*under,0.08,1);
  }
  /* ── the wall, front face and return ──────────────────────────────────────
     Board-and-batten runs vertically here, where the meadow house's log courses
     run horizontally. The rhythm stays with the vernacular; the volume comes
     from src/construct.js. */
  const openings=swampHouseOpenings(variant);
  const {wTop,wBot,bays}=openings;
  const screened=(fx,fy2)=>fy2>wTop&&fy2<wBot&&bays.some(([a,b])=>fx>a&&fx<b);
  for(let fy2=0;fy2<box.h;fy2++){
    for(let fx=0;fx<box.w;fx++){
      const p=V.front(fx,fy2);
      /* A screen is a sparse mesh over a dark room. Empty gaps show the grass
         through the house. */
      if(screened(fx,fy2)){
        const wire=((fx+variant)%5)===0||((fy2-wTop)%5)===0;
        put(sp,p.x,p.y,1,wire?FACE.front*0.86:0.07,1,N_FRONT);
        continue;
      }
      const batten=((fx+variant*3)%7)===0?-0.10:0;
      put(sp,p.x,p.y,1,FACE.front+batten,1,N_FRONT);
    }
    for(let r=1;r<=box.rows;r++){
      const batten=(((box.w-1+r)+variant*3)%7)===0?-0.06:0;
      const band=Math.min(2,Math.floor((r-1)*3/Math.max(1,box.rows)));
      const panel=[0.22,0.40,0.30][band];
      const p=V.side(fy2,r);
      put(sp,p.x,p.y,1,panel+batten,1,N_SIDE);
    }
  }
  /* a lintel and a sill on each screened bay */
  for(const [a,b] of bays)for(let fx=a;fx<=b;fx++){
    const t=V.front(fx,wTop),s=V.front(fx,wBot);
    put(sp,t.x,t.y,1,FACE.front*1.42,1,N_FRONT);
    put(sp,s.x,s.y,1,FACE.front*0.34,1,N_FRONT);
  }
  /* ── the roof ─────────────────────────────────────────────────────────────
     A gable ridged front-to-back, so the two planes fall left and right and
     both recede with the volume. */
  const half=(box.w-1)/2, span=box.w/2+eave;
  const riseAt=(fx)=>roof-Math.round(roof*Math.min(1,Math.abs(fx-half)/span));
  const pitch=Math.atan(roof/Math.max(1,span));
  const roofValue=(fx)=>{
    const shake=(Math.abs(Math.round(fx-half))%6)===0;
    return shake?FACE.top*0.56:FACE.top*0.88;
  };
  /* The gable end is wall, carried up to the ridge. Without it a triangular
     hole shows sky between the two roof planes. */
  for(let fx=0;fx<box.w;fx++)for(let dy=1;dy<=riseAt(fx);dy++)
    put(sp,x0+fx,V.yTop-dy,1,FACE.front*0.90,1,N_FRONT);
  roofPlane(sp,V,{
    riseAt, fx0:-eave, fx1:box.w-1+eave, wallX0:0, wallX1:box.w-1,
    normalAt:(fx)=>roofNormal(pitch,fx<half?-1:1),
    valueAt:roofValue,
    /* one row of verge at the gable: two rows around a triangle draw an
       outline */
    fascia:1, fasciaValue:0.10, castRows:2, cast:0.54,
  });
  /* Three longitudinal roof fields (the pavilion facet budget) keep the depth
     axis visible after palette quantisation. */
  const roofDepth=[1.00,0.76,0.92];
  for(let fx=-eave;fx<=box.w-1+eave;fx++){
    const yFront=V.yTop-riseAt(fx);
    for(let r=0;r<=box.rows;r++){
      const i=(yFront-r)*sp.w+V.x0+fx+r;
      if(i<0||i>=sp.occ.length||sp.occ[i]!==1)continue;
      const band=Math.min(2,Math.floor(r*3/Math.max(1,box.rows+1)));
      sp.ao[i]=clamp(roofValue(fx)*roofDepth[band],0.08,1);
    }
  }
  /* the ridge */
  for(let r=0;r<=box.rows;r++)
    occlude(sp,x0+Math.round(half)+r,V.yTop-roof-r,0.74);
  /* ── the door, on the raised wall and reachable from the ladder side ───── */
  const door=openings.door;
  for(let fy2=door.fy0;fy2<=door.fy1;fy2++)for(let fx=door.x0;fx<=door.x1;fx++){
    const p=V.front(fx,fy2);
    const frame=fy2===door.fy0||fx===door.x0||fx===door.x1;
    put(sp,p.x,p.y,1,frame?FACE.front*1.12:0.07,1,N_FRONT);
  }
  return sp;
}
const swampHouseDoorDX=(variant=0)=>{
  const box=swampHouseBox(variant), eave=eavePx(SWAMP_HOUSE.eaveM);
  const W=(eave+box.w+eave+box.cols)|1;
  return eave+box.w-M(1.4)-(W>>1);
};

function makeSwampProp(kind){
  const dims={
    /* Dock needs height: a 9px plank strip reads as a floating bar. */
    swampDock:[58,24],swampSkiff:[48,10],swampRack:[31,30],
    swampCistern:[20,38],swampMooring:[7,34],swampTrap:[20,12],
    swampWinch:[17,19],swampChest:[19,12],
  }[kind];
  const sp=newSprite(dims[0],dims[1]);sp.ax=sp.w>>1;sp.ay=sp.h-1;
  sp.ramp='swampWood';sp.sMin=0.04;sp.sMax=0.88;sp.kind=kind;
  if(kind==='swampDock'){
    const deckY=5;
    for(const x of [4,sp.w>>1,sp.w-5])for(let y=deckY;y<sp.h;y++)
      for(let q=-1;q<=1;q++)put(sp,x+q,y,OPEN,0.22+0.08*(x/sp.w));
    for(let y=deckY;y<=deckY+3;y++)for(let x=1;x<sp.w-1;x++){
      if(x%8===7)continue;
      put(sp,x,y,1,0.34+0.28*((x%8)/7)+(y===deckY?0.18:0));
    }
    for(let x=1;x<sp.w-1;x++)put(sp,x,deckY+4,1,0.12);
    put(sp,sp.w-6,deckY-3,1,0.55);put(sp,sp.w-6,deckY-2,1,0.40);
    put(sp,sp.w-5,deckY-3,1,0.55);put(sp,sp.w-7,deckY-3,1,0.55);
  }else if(kind==='swampSkiff')for(let x=1;x<sp.w-1;x++){
    const d=Math.abs(x-sp.ax)/sp.ax,y=3+Math.round(d*4);
    put(sp,x,y,1,0.68);put(sp,x,y+1,1,0.24);if(d<0.78)put(sp,x,y+3,1,0.16);
  }else if(kind==='swampRack'){
    for(const x of [3,sp.w-4])for(let y=3;y<sp.h;y++)put(sp,x,y,1,0.30);
    for(let y=5;y<18;y+=5)for(let x=3;x<sp.w-3;x++)put(sp,x,y,1,0.54);
  }else if(kind==='swampCistern'){
    for(let y=4;y<24;y++)for(let x=3;x<sp.w-3;x++)if(((x-10)/8)**2+((y-14)/11)**2<1)put(sp,x,y,1,0.36+0.3*x/sp.w);
    for(const x of [5,sp.w-6])for(let y=20;y<sp.h;y++)put(sp,x,y,1,0.24);
  }else if(kind==='swampMooring'){
    for(let y=0;y<sp.h;y++)for(let x=2;x<sp.w-2;x++)put(sp,x,y,1,y%6?0.34:0.72);
  }else if(kind==='swampTrap'){
    for(let y=2;y<sp.h-1;y++)for(let x=1;x<sp.w-1;x++)
      if(x===1||x===sp.w-2||y===2||y===sp.h-2||(x+y)%5===0)put(sp,x,y,1,0.42);
  }else if(kind==='swampWinch'){
    for(let y=5;y<sp.h;y++)for(const x of [2,sp.w-3])put(sp,x,y,1,0.30);
    for(let x=2;x<sp.w-2;x++)put(sp,x,6,1,0.58);
    for(let a=0;a<12;a++){const q=a*Math.PI/6;put(sp,sp.ax+Math.cos(q)*5,10+Math.sin(q)*5,1,0.48);}
  }else{
    for(let y=2;y<sp.h;y++)for(let x=1;x<sp.w-1;x++)put(sp,x,y,1,y===2?0.72:0.34+0.24*x/sp.w);
    for(let x=1;x<sp.w-1;x+=5)put(sp,x,sp.h-1,3,0.18); // buoyant billets
  }
  return sp;
}

export { SWAMP_HOUSE, SWAMP_PILE_HALF, swampHouseBox, swampHouseFootprint,
         swampHouseFloorPx, swampHouseOpenings, swampHousePileDX,
         swampHousePiles, swampHouseRows, swampHouseSlab,
         swampPileSlab,
         makeSwampHouse, makeSwampProp, makeSwampSettlement,
         swampHouseDoorDX };
