import * as THREE from 'three';
import { GROUND_PX_PER_ROW } from '../basin.js';
import { CH, PAD, PADW } from '../constants.js';
import { lerp } from '../math.js';
import { fbm } from '../rng.js';

function textureChunk(c){
  const tex=new THREE.DataTexture(c.geom,CH,CH,THREE.RGBAFormat);
  tex.magFilter=tex.minFilter=THREE.NearestFilter;
  tex.needsUpdate=true;tex.flipY=false;c.tex=tex;
  return c;
}

/* Two-pass chamfer distance transform. `wy` weights the vertical step: 1 gives
   a screen distance (placement windows, ice shelf), GROUND_PX_PER_ROW a ground
   distance (anything converted to metres). */
function edt(mask,W,H,target,wy=1){
  const d=new Float32Array(W*H).fill(1e9);
  for(let i=0;i<W*H;i++) if(mask[i]===target) d[i]=0;
  const D1=1, DY=wy, D2=Math.hypot(1,wy);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x; let v=d[i];
    if(x>0)          v=Math.min(v,d[i-1]+D1);
    if(y>0)          v=Math.min(v,d[i-W]+DY);
    if(x>0&&y>0)     v=Math.min(v,d[i-W-1]+D2);
    if(x<W-1&&y>0)   v=Math.min(v,d[i-W+1]+D2);
    d[i]=v;
  }
  for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){
    const i=y*W+x; let v=d[i];
    if(x<W-1)          v=Math.min(v,d[i+1]+D1);
    if(y<H-1)          v=Math.min(v,d[i+W]+DY);
    if(x<W-1&&y<H-1)   v=Math.min(v,d[i+W+1]+D2);
    if(x>0&&y<H-1)     v=Math.min(v,d[i+W-1]+D2);
    d[i]=v;
  }
  return d;
}

function makeChunkBake(w){
  const {
    CAVERN, PLAN, POND_COURT, SWAMP_LAKEHOUSE, TH, elevAt, nL, nWA, nWB, openAt,
    naturalLakeAt, paintGround, pathX, placeProps, poiKind, rimAt,
    swampCompose, swampSmooth, swampWander,
  }=w;
  /* 3×3 majority filter for lone threshold pixels. Local radius 1, so both
     sides of a border agree. */
  function despeckle(m,n){
    const o=m.slice();
    for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
      const i=y*n+x;
      const s=o[i-n-1]+o[i-n]+o[i-n+1]+o[i-1]+o[i+1]+o[i+n-1]+o[i+n]+o[i+n+1];
      if(s<=1) m[i]=0; else if(s>=7) m[i]=1;
    }
  }

  /* Remove water components below a size, in place. */
  function dropSmall(m,n,minPx){
    const lab=new Int32Array(n*n).fill(-1), sz=[];
    for(let i=0;i<n*n;i++){
      if(!m[i]||lab[i]>=0) continue;
      const st=[i], id=sz.length; lab[i]=id; let c=0; const cells=[];
      while(st.length){ const j=st.pop(); c++; cells.push(j);
        const x=j%n, y=(j/n)|0;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const xx=x+dx, yy=y+dy;
          if(xx<0||yy<0||xx>=n||yy>=n) continue;
          const q=yy*n+xx; if(!m[q]||lab[q]>=0) continue;
          lab[q]=id; st.push(q);
        }
      }
      sz.push({c,cells});
    }
    for(const s of sz) if(s.c<minPx) for(const j of s.cells) m[j]=0;
  }

  /* KARST composes sharp sections over an 8 px lattice. WARPED reconstructs the
     domain-warped fbm bilinearly. Every other model asks naturalLakeAt directly.
     Invariant: coarse water lattices are world-aligned and divide CH, so
     adjacent chunks sample identical border points. test/biome.test.mjs guards
     seams. */
  const KARST=PLAN.water==='karst', WARPED=PLAN.water==='warped';
  function waterMask(ox,oy,n){
    const ws=8, wm_=Math.ceil(n/ws)+2;
    const WA=new Float32Array(wm_*wm_), WB=new Float32Array(wm_*wm_);
    for(let j=0;j<wm_;j++)for(let i=0;i<wm_;i++){
      const x=ox+i*ws, y=oy+j*ws;
      WA[j*wm_+i]=fbm(nWA,x*0.0016,y*0.0016,3);
      WB[j*wm_+i]=fbm(nWB,x*0.0016+7.3,y*0.0016+3.1,3);
    }
    const bl=(A,fx,fy)=>{ const x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,p=y0*wm_+x0;
      return lerp(lerp(A[p],A[p+1],tx),lerp(A[p+wm_],A[p+wm_+1],tx),ty); };

    const WP=new Float32Array(wm_*wm_);
    for(let j=0;j<wm_;j++)for(let i=0;i<wm_;i++){
      const x=ox+i*ws, y=oy+j*ws;
      WP[j*wm_+i]= -poiKind(x,y,'village')*0.9 - rimAt(x,y)*0.8;
    }
    /* The swamp's fbm terms have no feature under 8 px, so the smooth field
       is reconstructed bilinearly from a coarse lattice for the frame-time
       budget. Sections are composed at full resolution below. */
    const st=KARST?8:2, m=Math.ceil(n/st)+2;
    const F=new Float32Array(m*m);
    /* Outline wander on the same lattice: a smooth field with a 30 px period.
       The wall it displaces is never interpolated. */
    const WW=KARST?new Float32Array(m*m):null;
    const PXa=new Float32Array(m+2);
    for(let j=0;j<m+2;j++) PXa[j]=pathX(oy+(j-1)*st);
    for(let j=0;j<m;j++){
      const wy=oy+j*st, px=PXa[j+1];
      const ps=(PXa[j+2]-PXa[j])/(2*st), inv=1/Math.sqrt(1+ps*ps);
      const fy=j*st/ws;
      for(let i=0;i<m;i++){
        const wx=ox+i*st, fx=i*st/ws;
        if(KARST){ F[j*m+i]=swampSmooth(wx,wy); WW[j*m+i]=swampWander(wx,wy); }
        /* Meadow and desert ask naturalLakeAt: their fields have no warp to
           reconstruct, and a second copy lets the drawn shoreline and the
           collider disagree. Measured: through the WARPED branch the desert
           mask reads the forest's lake field and 12% of an erg is open water.
           The WARPED branch below is a second copy of the boreal expression in
           naturalLakeAt, kept because rewriting it moves winter's bytes. */
        else if(!WARPED) F[j*m+i]=naturalLakeAt(wx,wy);
        else{
          const f=fbm(nL,wx*0.0021+bl(WA,fx,fy)*0.55,wy*0.0021+bl(WB,fx,fy)*0.55,4,2.05,0.52);
          F[j*m+i]=f-0.34*Math.exp(-Math.abs(wx-px)*inv/30)+bl(WP,fx,fy);
        }
      }
    }
    const mask=new Uint8Array(n*n);
    for(let j=0;j<n;j++){
      const fy=j/st, y0=fy|0, ty=fy-y0;
      for(let i=0;i<n;i++){
        const fx=i/st, x0=fx|0, tx=fx-x0, p=y0*m+x0;
        const smooth=lerp(lerp(F[p],F[p+1],tx),lerp(F[p+m],F[p+m+1],tx),ty);
        /* A wall crosses the whole depth range inside a quarter of a radius:
           two samples of the 8 px lattice for the biome's basins, one for the
           lakehouse. Interpolated, the outline is a run of 8 px facets. So
           sections are composed at full resolution here and again in
           ground.js where the colour reads depth, so mask and ramp agree. */
        let v=KARST
          ?TH+swampCompose(ox+i,oy+j,smooth,
                           lerp(lerp(WW[p],WW[p+1],tx),lerp(WW[p+m],WW[p+m+1],tx),ty))
          :smooth;
        if(POND_COURT) v=POND_COURT.hydrologyAt(ox+i,oy+j,v,TH);
        if(SWAMP_LAKEHOUSE) v=SWAMP_LAKEHOUSE.hydrologyAt(ox+i,oy+j,v,TH);
        mask[j*n+i]=v>TH?1:0;
      }
    }
    despeckle(mask,n);
    /* A pond narrower than twice the shelf width has no open water. Local to
       the padded window, so two chunks agree about any body small enough to
       be removed. */
    if(!KARST) dropSmall(mask,n,340);
    return {mask,field:KARST?F:null,wander:WW,step:st,size:m};
  }

  /* One chunk: the shared frame (water mask, shore distances, terrain slope),
     then props and ground from it. */
  function bakeChunk(cx,cy,raw=false){
    const ox=cx*CH-PAD, oy=cy*CH-PAD, n=PADW;
    const waterField=waterMask(ox,oy,n),wm=waterField.mask;
    const dW=edt(wm,n,n,1);      // land pixel -> distance to water
    const dL=edt(wm,n,n,0);      // water pixel -> distance from shore, in ROWS
    /* The same distance in ground pixels, for the reader that converts it to
       metres. A screen row is two ground pixels along the depth axis: in
       screen distance a bank declared at 30° draws its near and far sides at
       16°. */
    const dLg=PLAN.water==='basins'||PLAN.water==='oasis'
      ?edt(wm,n,n,0,GROUND_PX_PER_ROW):null;
    /* Land pixel to water in ground pixels, for the wet rim of a peat shore. */
    const dWg=KARST?edt(wm,n,n,1,GROUND_PX_PER_ROW):null;

    /* Elevation feeds the terrain normal for the ground shader's lambert
       term, on an 8 px lattice: 700 samples, not 37 000. It reads elevAt, the
       one authority, so the biome's relief scalar reaches the drawn normal. */
    const es=8, eN=Math.ceil(CH/es)+3, eO=cx*CH-es, eOy=cy*CH-es;
    const ev=new Float32Array(eN*eN);
    for(let j=0;j<eN;j++)for(let i=0;i<eN;i++)
      ev[j*eN+i]=elevAt(eO+i*es,eOy+j*es);
    /* Central differences divided by es (not 2*es), then bilinear. The
       encoded slope matches a measurement over two world pixels. */
    const gx_=new Float32Array(eN*eN), gy_=new Float32Array(eN*eN);
    for(let j=1;j<eN-1;j++)for(let i=1;i<eN-1;i++){
      gx_[j*eN+i]=(ev[j*eN+i+1]-ev[j*eN+i-1])/es;
      gy_[j*eN+(i)]=(ev[(j+1)*eN+i]-ev[(j-1)*eN+i])/es;
    }

    const gsamp=(A,fx,fy)=>{ const x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,p=y0*eN+x0;
      return lerp(lerp(A[p],A[p+1],tx),lerp(A[p+eN],A[p+eN+1],tx),ty); };
    const frame={cx,cy,ox,oy,n,waterField,wm,dW,dWg,dL,dLg,es,gsamp,gx_,gy_};
    /* Rock over the padded window: the signed room distance on a 4 px
       lattice (no wall feature is finer), thresholded at full resolution. */
    if(CAVERN){
      const st=4, m=Math.ceil(n/st)+2, F=new Float32Array(m*m);
      for(let j=0;j<m;j++)for(let i=0;i<m;i++) F[j*m+i]=openAt(ox+i*st,oy+j*st);
      const rock=new Uint8Array(n*n);
      for(let j=0;j<n;j++){
        const fy=j/st, y0=fy|0, ty=fy-y0;
        for(let i=0;i<n;i++){
          const fx=i/st, x0=fx|0, tx=fx-x0, p=y0*m+x0;
          rock[j*n+i]=lerp(lerp(F[p],F[p+1],tx),lerp(F[p+m],F[p+m+1],tx),ty)<0?1:0;
        }
      }
      frame.rock=rock;
    }
    const {props,solids,lights}=placeProps(frame);
    frame.lights=lights;
    const {geom,water,colWater}=paintGround(frame);
    /* `lights` is every luminous body that reaches this floor, for the test
       that holds two chunks to one answer. */
    const chunk={cx,cy,ox:cx*CH,oy:cy*CH,tex:null,geom,props,solids,water,colWater,lights};
    return raw?chunk:textureChunk(chunk);
  }

  return {bakeChunk};
}

export { textureChunk, makeChunkBake };
