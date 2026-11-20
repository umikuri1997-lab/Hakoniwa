import { CH, FLAG_Q, PAD, PATHW, WCA, WSA } from '../constants.js';
import { clamp, lerp, smoothstep } from '../math.js';
import { RAMP } from '../palette.js';
import { fbm, hashf } from '../rng.js';
import { PX_PER_M } from '../scale.js';
import { glowAt } from '../glow.js';
import { ALBEDO, gourT, pondT, swampT } from '../sunlight.js';
import { SURF, SURFACE, WET } from '../surface.js';
import { WALL_PX } from './cavern.js';
import { SWAMP_WADE_M, swampDepthOf } from './swamp-water.js';

/* A chunk's ground texture, RGBA per pixel:
     r = position on the surface ramp   g,b = slope   a = surface flag * FLAG_Q
   One painter per water model. Each writes tone, slope, flag and the wet mask
   from the frame the bake shares with placement. */
/* One rung of the sand ramp, in ramp position. */
const SAND_RUNG=1/(RAMP.sand.length-1);

/* The rim rule. A second state inside one surface is a rim, never an area. The
   rim sits on the edge that causes the state: the waterline for wet soil, the
   brink for a slip face. It is `solid` px of the next rung down, then `wash` px
   of the half checker, then the surface's own tone. MEASURED: a full-rung area
   put 20% of the swamp floor and every 73 px lee face on a second colour, and
   review rejected both as colour noise. PROJECTION.md, docs/DECISIONS.md. */

/* Wet soil follows the capillary fringe. Standing water keeps soil wet up to
   `capillaryM` above its table, so the wet band on a bank is that height over
   the bank's slope. Its narrowest case is a bank at repose: 0.20 m / tan 28 deg
   = 0.38 m = 5.75 ground px. The rim is cut from that narrowest band, so every
   peat waterline carries it, with no gap. Ground px: a screen row is two of
   them, so the rim is half as deep on the near and far banks (PROJECTION.md). */
const PEAT=SURFACE[SURF.peat];
const WET_BAND_PX=PEAT.capillaryM/Math.tan(PEAT.repose*Math.PI/180)*PX_PER_M;
const RIM={
  /* ground px. Saturated at the waterline, drier up the fringe. */
  wetSoil :{solid:2,wash:Math.floor(WET_BAND_PX)-2},
  /* screen px, authored. */
  slipFace:{solid:2,wash:7},
};
/* 1 inside the solid rim, a world-anchored half checker in the wash, 0 beyond.
   `dist` counts px from the edge, 0 on the first pixel. */
const rimMark=(dist,rim,wx,wy)=>
  dist<rim.solid?1:dist<rim.solid+rim.wash?((wx+wy)&1):0;
/* Peat floor and its wet rim, one rung apart at every sun: the peat row adds
   0.16*ndl, so 0.60 stays in rung 2 of four and 0.30 in rung 1. */
const PEAT_DRY=0.60, PEAT_WET=0.30;

function makeGround(w){
  const {
    GROUND, OASIS_FRINGE, PATCH_A, PLAN, POND_COURT, PORTALS, PORTAL_RING,
    RIPPLE_K, RIPPLE_N, SABKHA_PX, SWAMP_LAKEHOUSE, TH, duneAt, nD, nDW, nG,
    nK, nP2, pathX, seed, swampCompose,
  }=w;
  /* Smooth fields sample on a coarse lattice and interpolate. */
  function coarse(fn,ox,oy,n,step){
    const m=Math.ceil(n/step)+2, a=new Float32Array(m*m);
    for(let j=0;j<m;j++)for(let i=0;i<m;i++) a[j*m+i]=fn(ox+i*step,oy+j*step);
    return {a,m,step};
  }
  function csamp(c,i,j){
    const fx=i/c.step, fy=j/c.step;
    const x0=fx|0, y0=fy|0, tx=fx-x0, ty=fy-y0, p=y0*c.m+x0;
    return lerp(lerp(c.a[p],c.a[p+1],tx),lerp(c.a[p+c.m],c.a[p+c.m+1],tx),ty);
  }

  const surf=f=>(GROUND!==null&&GROUND[f]!==undefined)?GROUND[f]:f;

  /* Karst swamp: surfaces compile from the cached hydrology lattice. */
  function paintSwamp(frame,out){
    const {cx,cy,ox,oy,n,waterField,wm,dWg,es,gsamp,gx_,gy_}=frame;
    const {geom:g,water,colWater}=out;
    const bilinear=(A)=>(wx,wy)=>{
      const fx=(wx-ox)/waterField.step,fy=(wy-oy)/waterField.step;
      const x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0;
      const p=y0*waterField.size+x0,m=waterField.size;
      return lerp(lerp(A[p],A[p+1],tx),lerp(A[p+m],A[p+m+1],tx),ty);
    };
    const swampLattice=bilinear(waterField.field);
    const swampWanderLat=bilinear(waterField.wander);
    /* Smooth terms from the 8 px lattice, sections at full resolution, the
       exact field inside the lakehouse wall. Same composition rule as the water
       mask, so the drawn shore is the walked shore. */
    const swampSignalAt=(wx,wy)=>{
      const s=swampCompose(wx,wy,swampLattice(wx,wy),swampWanderLat(wx,wy));
      return SWAMP_LAKEHOUSE
        ?SWAMP_LAKEHOUSE.hydrologyAt(wx,wy,TH+s,TH)-TH
        :s;
    };
    for(let y=0;y<CH;y++){
      const wy=cy*CH+y;
      for(let x=0;x<CH;x++){
        const wx=cx*CH+x, o=(y*CH+x)*4, pi=(y+PAD)*n+(x+PAD);
        let t,flag;
        const isW=!!wm[pi];
        const depth=isW?swampDepthOf(swampSignalAt(wx,wy)):0;
        if(isW){
          /* Margin plants, not a flat duckweed band — docs/SWAMP.md. */
          /* swampT indexes the ladder swampRamps derives (src/sunlight.js), so
             the wade line lands on the rung both windows share. */
          flag=depth<=SWAMP_WADE_M?SURF.flooded:SURF.swampWater;
          t=swampT(depth,SURFACE[flag].ramp);
        }else{
          flag=SURF.peat;
          /* One floor tone, and the wet rim of the capillary fringe on every
             waterline (RIM). Hummock and hollow stay habitat conditions in
             hydrologyAt. */
          t=rimMark(dWg[pi]-1,RIM.wetSoil,wx,wy)?PEAT_WET:PEAT_DRY;
        }
        g[o]=Math.round(clamp(t,0,1)*255);
        if(WET.indexOf(flag)>=0){
          water[y*CH+x]=1;
          if(colWater[x]===255)colWater[x]=y;
        }
        const efx=(x+es)/es,efy=(y+es)/es;
        const sx=gsamp(gx_,efx,efy)*2, sy=gsamp(gy_,efx,efy)*2;
        g[o+1]=Math.round((clamp(sx*7.5,-1,1)*0.5+0.5)*255);
        g[o+2]=Math.round((clamp(sy*7.5,-1,1)*0.5+0.5)*255);
        g[o+3]=flag*FLAG_Q;
      }
    }
  }

  /* Oasis desert: pool, salt crust, pavement and dune sand. */
  function paintDesert(frame,out){
    const {cx,cy,n,wm,dW,dLg,es,gsamp,gx_,gy_}=frame;
    const {geom:g,water,colWater}=out;
    /* Sampled every 2 px. At 4 px the interpolation facets at about one rung
       and the palette snap draws the facets as rectangles. */
    const GC=coarse((x,y)=>fbm(nG,x*0.0062,y*0.011,3),cx*CH,cy*CH,CH,2);
    for(let y=0;y<CH;y++){
      const wy=cy*CH+y;
      for(let x=0;x<CH;x++){
        const wx=cx*CH+x, o=(y*CH+x)*4, pi=(y+PAD)*n+(x+PAD);
        let t,flag,d=null;   // the dune sample, taken once per dry pixel
        const isW=!!wm[pi];
        if(isW){
          /* The oasis uses the meadow's pond ramp and optics: shallow fresh
             water over a pale mineral bed. A second four-rung ladder costs four
             of the 64 snap entries for one pool. docs/DESERT.md. */
          flag=SURF.pond;
          t=pondT(dLg[pi]);
        }else{
          d=duneAt(wx,wy);
          /* The salt crust is a ring. The pool flushes its fresh fringe; salt
             concentrates at the outer limit of capillary rise. */
          /* Distance to open water is a circle, so the margin wanders at two
             scales: the water table's, and the few metres a capillary limit
             follows. One 740 px term only shifts the oval. */
          const wob=fbm(nK,wx*0.0085+61,wy*0.0085+17,2)*SABKHA_PX*0.42
                   +fbm(nK,wx*0.028+11,wy*0.028+53,2)*SABKHA_PX*0.38;
          const dw=dW[pi]+wob;
          /* MEASURED: a ramp crossing 0 to 1 in 6 px leaves a stipple one pixel
             deep, which reads as a line. Ray crossings 2.00 (hard band) against
             the figure in test/desert.test.mjs on these widths. */
          const crust=smoothstep(OASIS_FRINGE,OASIS_FRINGE+17,dw)
                     *(1-smoothstep(SABKHA_PX*0.52,SABKHA_PX,dw));
          /* A surface id cannot blend, so the smooth `crust` field is compared
             with a per-pixel hash and spent as coverage: solid core, stipple at
             both edges. */
          const bite=0.22+hashf(Math.round(wx),Math.round(wy),seed^0x5a17)*0.62;
          /* The erg's edge takes the same treatment: the thin end of `cover`
             against a hash, sand grains scattered on pavement where the sheet
             runs out. */
          const grit=hashf(Math.round(wx),Math.round(wy),seed^0x5a19)*0.12;
          const bare=d.cover<=grit;
          if(crust>bite&&bare){
            flag=SURF.sabkha;
            /* A crust in compression buckles into polygons. Walls come from the
               two nearest of a jittered set of centres: where first and second
               distances agree, two plates abut. MEASURED FAILURE: the zero-set
               of one noise octave is nested closed loops, drawn as lace and fat
               arcs. SOURCE: salt polygons converge on 1-3 m across (Lasser et
               al., Phys. Rev. X 13, 011025 (2023)); the pitch is 2.2 m. */
            const P=2.2*PX_PER_M;
            const cx=Math.floor(wx/P),cy=Math.floor(wy/P);
            let f1=1e9,f2=1e9;
            for(let jy=-1;jy<=1;jy++)for(let jx=-1;jx<=1;jx++){
              const ux=cx+jx,uy=cy+jy;
              const fx=(ux+0.5+(hashf(ux,uy,seed^0x5a70)-0.5)*0.9)*P;
              const fy=(uy+0.5+(hashf(ux,uy,seed^0x5a71)-0.5)*0.9)*P;
              const q=Math.hypot(wx-fx,wy-fy);
              if(q<f1){f2=f1;f1=q;}else if(q<f2)f2=q;
            }
            const wall=f2-f1<1.7;
            t=0.52+csamp(GC,x,y)*0.10+(wall?0.30:0);
          }else if(bare){
            flag=SURF.hamada;
            /* Dither is off on this row, so the tone stays inside one rung. The
               normal carries the varnish mottle. */
            t=0.44+csamp(GC,x,y)*0.045;
          }else{
            flag=SURF.sand;
            /* Grain sorting: the wind carries fine pale grains up the face and
               drops coarse dark ones in the troughs, so a crest is paler than
               its plinth. Squared: sorting concentrates late in the climb. */
            /* The brink is marked by a rim on its lee side (RIM), the stoss by
               a small lift. Legibility floor, stated: at noon at 24 N a 34
               degree slip face costs 17% of the cosine, a third of a rung on
               this ramp. MEASURED without a mark: 100% of lee and 98% of stoss
               pixels painted one rung, and no dune was visible. */
            t=0.30+d.crest*d.crest*0.18+csamp(GC,x,y)*0.055
             +(d.face<0?-SAND_RUNG*rimMark(d.lee,RIM.slipFace,wx,wy):d.face*0.05);
          }
        }
        g[o]=Math.round(clamp(t,0,1)*255);
        if(WET.indexOf(flag)>=0){
          water[y*CH+x]=1;
          if(colWater[x]===255)colWater[x]=y;
        }
        const efx=(x+es)/es,efy=(y+es)/es;
        let rx=0,ry=0;
        if(flag===SURF.sand){
          /* No ripples on the slip face: a lee face is a fresh avalanche, and
             saltation builds a ripple. */
          if(d.face>=0){
            const ph=(wx*WCA+wy*WSA)*RIPPLE_K
                    +fbm(nDW,wx*0.021+7,wy*0.021+13,2)*1.6;
            const rn=Math.cos(ph)*RIPPLE_N;
            rx=rn*WCA; ry=rn*WSA;
          }
        }
        g[o+1]=Math.round((clamp(gsamp(gx_,efx,efy)*2*7.5+rx,-1,1)*0.5+0.5)*255);
        g[o+2]=Math.round((clamp(gsamp(gy_,efx,efy)*2*7.5+ry,-1,1)*0.5+0.5)*255);
        g[o+3]=flag*FLAG_Q;
      }
    }
  }

  /* The Hollow: a floor under a dim ceiling, and the pools of light its
     luminous bodies throw (src/glow.js). Tone is irradiance: FLOOR is the
     ceiling alone, on the ramp's second rung, and a light lifts it toward the
     last. Rung 0 is left to the wall and to a cast shadow.

     The two lamps are two surfaces on one albedo (hollowRamps). They share
     the two resting rungs, so the surface changes with no seam; where the two
     lights are near equal the pools meet in a half checker. */
  const FLOOR=0.36, LIT=0.97, MEET=0.22, STEP=9, BED=12;
  /* the hot ramp's third rung, and the light that reaches its last */
  const HOT0=0.60, HOT=ALBEDO.calcite[1]/ALBEDO.caveRock[1];
  /* the lamps (LAMP in src/sunlight.js) and the floor each one makes */
  const LAMPS=['fungus','crystal','calcite'];
  const FLOORS=[SURF.cavestone,SURF.geode,SURF.moonfloor];
  function paintHollow(frame,out){
    const {cx,cy,n,wm,dW,dLg,es,gsamp,gx_,gy_,lights,rock}=frame;
    const {geom:g,water,colWater}=out;
    const GC=coarse((x,y)=>fbm(nG,x*0.0062,y*0.011,3),cx*CH,cy*CH,CH,2);
    /* Per window pixel: the first rock row at or below it, and the last row
       of that run (the wall's foot). A wall stands WALL_PX rows above its
       foot, so a pixel within WALL_PX of rock below it shows rock: the top of
       the mass where the mass is still under it WALL_PX rows down, else the
       face. */
    const below=rock?new Int16Array(n*n):null, foot=rock?new Int16Array(n*n):null;
    if(rock) for(let x=0;x<n;x++){
      let nb=-1, end=-1;
      for(let y=n-1;y>=0;y--){
        const i=y*n+x;
        if(rock[i]){ if(nb!==y+1) end=y; nb=y; }
        below[i]=nb; foot[i]=end;
      }
    }
    /* The strongest light of each lamp at a ground point, and the surface
       the floor takes: the strongest lamp's, or a half checker with the
       runner-up where the two are within MEET of each other. */
    const E=[0,0,0];
    const lightAt=(wx,wy)=>{
      E[0]=E[1]=E[2]=0;
      for(const L of near){
        const e=glowAt(L,wx,wy);
        if(e>0){ const k=LAMPS.indexOf(L.lamp); if(e>E[k]) E[k]=e; }
      }
      let a=0; for(let k=1;k<3;k++) if(E[k]>E[a]) a=k;
      let b=a===0?1:0; for(let k=0;k<3;k++) if(k!==a&&E[k]>E[b]) b=k;
      const lamp=E[b]>E[a]*(1-MEET)&&((wx+wy)&1)?b:a;
      return [E[a],lamp];
    };
    const PXa=new Float32Array(CH+6);
    for(let j=0;j<CH+6;j++) PXa[j]=pathX(cy*CH+j-3);
    /* only the lights that can reach this chunk's own pixels */
    const near=lights.filter(L=>L.x>cx*CH-L.reach&&L.x<(cx+1)*CH+L.reach
                              &&L.y>cy*CH-L.reach&&L.y<(cy+1)*CH+L.reach+WALL_PX);
    for(let y=0;y<CH;y++){
      const wy=cy*CH+y;
      const px=PXa[y+3], ps=(PXa[y+6]-PXa[y])/6, inv=1/Math.sqrt(1+ps*ps);
      const pw=PATHW;
      for(let x=0;x<CH;x++){
        const wx=cx*CH+x, o=(y*CH+x)*4, pi=(y+PAD)*n+(x+PAD);
        let t,flag;
        const nb=rock?below[pi]:-1;
        if(nb>=0&&nb-(y+PAD)<=WALL_PX){
          const row=y+PAD;
          if(rock[pi+WALL_PX*n]){ flag=SURF.rockroof; t=0; }
          else{
            /* The face. Its foot stands in its own contact shadow and its lip
               catches the ceiling. A lamp on the floor lights it from below,
               fading up the wall. */
            const h=foot[pi]-row, u=h/WALL_PX;
            const [top,lamp]=lightAt(wx,cy*CH+foot[pi]-PAD+2);
            const e=clamp(top*(1-0.6*u),0,1);
            t=h<2?0.05:h>=WALL_PX-1?0.60:FLOOR+(LIT-FLOOR)*e;
            /* Bedding: limestone is laid in beds, and a wall shows their
               partings as thin dark lines, a bed 0.8 m thick. Broken, so the
               face stays one mass. */
            const bed=h+Math.round(fbm(nK,wx*0.021+5,3.3,2)*4);
            if(h>3&&h<WALL_PX-2&&bed%BED===0
               &&hashf(Math.floor(wx/7),Math.floor(bed/BED),seed^0xbed5)<0.62) t=0.05;
            flag=lamp===1?SURF.cliffGeode:SURF.cliff;
          }
        }else if(wm[pi]){
          flag=SURF.gour;
          t=gourT(dLg[pi]);
        }else{
          const [top,lamp]=lightAt(wx,wy);
          const amb=FLOOR+csamp(GC,x,y)*0.05;
          const e=clamp(top,0,1);
          t=amb+(LIT-amb)*e;
          flag=FLOORS[lamp];
          /* Past one lamp's worth the crystal floor runs on up the hot ramp
             (SURF.geodeHot), to its last rung at a group's own foot. */
          if(lamp===1&&top>1){ flag=SURF.geodeHot; t=HOT0+(LIT-HOT0)*clamp((top-1)/(HOT-1),0,1); }
          /* The trail is a line of calcite flags the folk laid: a band of
             pale stone on this floor reads as a stream. One flag every
             STEP rows, 0.75 m across and half that deep on screen. */
          if(PLAN.worldTrail&&Math.abs(wx-px)*inv<pw){
            const k=Math.floor(wy/STEP), fy=(k+0.5)*STEP;
            const fx=pathX(fy)+(hashf(k,7,seed^0x57e9)-0.5)*7;
            const dx=(wx-fx)/5.6, dy=(wy-fy)/2.6;
            if(dx*dx+dy*dy<1){ flag=SURF.rimstone; t=wy-fy<-1?0.66:FLOOR; }
          }
          /* Rimstone: the dam at a pool's lip, on every waterline. */
          if(dW[pi]<=1.5){ flag=SURF.rimstone; t=0.66; }
        }
        g[o]=Math.round(clamp(t,0,1)*255);
        if(WET.indexOf(flag)>=0){
          water[y*CH+x]=1;
          if(colWater[x]===255)colWater[x]=y;
        }
        const efx=(x+es)/es,efy=(y+es)/es;
        g[o+1]=Math.round((clamp(gsamp(gx_,efx,efy)*2*7.5,-1,1)*0.5+0.5)*255);
        g[o+2]=Math.round((clamp(gsamp(gy_,efx,efy)*2*7.5,-1,1)*0.5+0.5)*255);
        g[o+3]=flag*FLAG_Q;
      }
    }
  }

  /* Boreal and meadow: one geometry, remapped to the world's surfaces by
     PLAN.ground. */
  function paintTemperate(frame,out){
    const {cx,cy,n,wm,dW,dL,dLg,es,gsamp,gx_,gy_}=frame;
    const {geom:g,water,colWater}=out;
    /* Shelf width in px. At 12 (19 with its noise in a cove) it is a band of a
       third material between land and water. */
    const shelf=5;
    /* Sampled every 2 px. At 4 px the interpolation facets at about one rung
       and the palette snap draws the facets as rectangles. */
    const GC=coarse((x,y)=>fbm(nG,x*0.0062,y*0.011,3),cx*CH,cy*CH,CH,2);
    /* Contour wander: period about 18 px, amplitude a seventh of a rung. */
    const GW=coarse((x,y)=>fbm(nG,x*0.055,y*0.11,3),cx*CH,cy*CH,CH,2);

    const CULM_A=1.35;
    const MR=(GROUND!==null&&GROUND[SURF.snow]===SURF.sward)
      ?(()=>{ const m=new Float32Array((CH+2)*(CH+2));
          for(let j=-1;j<=CH;j++) for(let i=-1;i<=CH;i++){
            const X=cx*CH+i, Y=cy*CH+j;
            const rosette=fbm(nG,X*0.205+17,Y*0.205+31,2);
            const comb=fbm(nD,(X*WCA+Y*WSA)*0.170+11,(-X*WSA+Y*WCA)*0.240+47,2);
            m[(j+1)*(CH+2)+(i+1)]=rosette*0.72+comb*0.28;
          }
          return m; })()
      :null;
    /* Where the sward is tussocky and where it is grazed short. 60 px period. */
    const GT=MR===null?null:coarse((x,y)=>fbm(nK,x*0.017+29,y*0.017+83,2),cx*CH,cy*CH,CH,2);
    const PXa=new Float32Array(CH+6);
    for(let j=0;j<CH+6;j++) PXa[j]=pathX(cy*CH+j-3);
    const pavingAt=POND_COURT?(wx,wy,worn=1)=>{
      const pv=POND_COURT.paving(wx,wy*2);
      const joint=1-smoothstep(0.012,0.070,pv.edge);
      return lerp(0.30,0.78,pv.tone)*lerp(1,0.16,joint)*worn;
    }:null;
    for(let y=0;y<CH;y++){
      const wy=cy*CH+y;
      const px=PXa[y+3], ps=(PXa[y+6]-PXa[y])/6, inv=1/Math.sqrt(1+ps*ps);
      /* Trail width depends on wy alone. The displacement noise is bounded by
         3.4, so a pixel beyond the widest trail plus that bound skips the
         noise. */
      const pwRow=PATHW*(0.80+0.60*(fbm(nP2,wy*0.013,5.5,2)+0.30));
      const pwMax=pwRow+4.2+3.4;
      for(let x=0;x<CH;x++){
        const wx=cx*CH+x, o=(y*CH+x)*4, pi=(y+PAD)*n+(x+PAD);
        let t,flag,flatMade=false;
        const pc=POND_COURT&&POND_COURT.sample(wx,wy);
        if(wm[pi]){
          const dl=dL[pi];

          let shw=shelf*(0.70+clamp(fbm(nK,wx*0.008,wy*0.008,2)+0.5,0,1)*0.60);
          /* The shelf is discontinuous: wide in coves, gone on exposed points. */
          if(fbm(nK,wx*0.006+41,wy*0.006+13,2)<-0.14) shw*=0.12;
          const wob=fbm(nK,wx*0.09,wy*0.09,3)*shw*0.45, dd=dl+wob;
          if(dl<=shw){
            /* flag 3 is the ice ramp, drawn flat with no dither — and still
               walkable, because collision follows flag 1 alone */
            flag=3;
            const su=(wx*WCA+wy*WSA);

            t=0.04+csamp(GC,x,y)*0.05;
            /* Ridged noise gives branching lines. One octave: with three the
               zero-set dots out where the field is steep. */
            const cr=Math.abs(fbm(nK,wx*0.030+17,wy*0.030+9,1));
            if(dd>2.5&&cr<0.030){ t=0.01; }
            /* floor, not %. JavaScript's % keeps the sign of the dividend: with
               % the test is always true for su<0, 1.000 density against 0.333
               for su>0. */
            else if(dd>2.5&&cr<0.044&&(su-3*Math.floor(su/3))<1){ t=0.98; }
            /* A tide crack forms where the shelf is wide and anchored. Ungated
               it outlines 97.6% of every water body's perimeter. */
            /* No dark seam where the shelf meets land: the bright lip on the
               land side is the whole line. */
          }
          /* The depth ramp saturates inside PAD, or two chunks disagree about
             deep water and the lake shows a grid. */
          else{

            flag=1;
            const fu=(wx*WCA+wy*WSA), fv=(-wx*WSA+wy*WCA);
            t=0.34*Math.exp(-dl/22)+0.145
              +0.032*smoothstep(0.10,0.34,Math.abs(fbm(nD,fu*0.0034+53,fv*0.013+7,2)));
          }
        }else{
          flag=0;

          t=0.40+csamp(GC,x,y)*PATCH_A
             +csamp(GW,x,y)*0.030
             /* Bank shading over 3 px is part of the drawn edge. Over 9 px it
                is a gradient with no shoreline. */
             -(1-smoothstep(0,3,dW[pi]))*0.20;

          const pw=pwRow;
          const near=Math.abs(wx-px)*inv;
          const pd=near<pwMax ? near+fbm(nG,wx*0.075,wy*0.075,2)*3.4 : 1e9;
          if(pd<pw+4.2){
            const gr=fbm(nG,wx*0.11,wy*0.11,2);

            /* A trough with two lips: light-dark-light across 14 px reads as a
               channel. The berm is the snow that feet push aside. */
            if(pd<pw*0.55){ t=0.52+gr*0.05; flag=2; }
            else if(pd<pw){ t=0.60+gr*0.06; flag=2; }
            /* The berm runs in broken stretches, lifted clear of the palette
               entry a lit drift crest uses. */
            else if(pd<pw*(1.20+0.20*fbm(nG,wy*0.055+3,7,2))){
              t=(fbm(nK,wy*0.035+61,3,2)>-0.22?0.95:0.72)+gr*0.11; flag=2; }
            else if(pd<pw+3.0){ t=lerp(t,0.56,0.66); flag=2; }
            else { t=lerp(t,0.50,0.40); flag=2; }
          }
          if(pc&&pc.pond<1.13){
            /* A damp living margin, not a bright collar. It stays in the grass
               family and darkens toward the waterline. */
            const bank=clamp((pc.pond-1)/0.13,0,1);
            flag=SURF.sward;
            t=lerp(0.08,0.38,bank);
          }
          if(pc&&(pc.court>0||pc.route<0)){
            const worn=pc.route<0?smoothstep(0,4.4,-pc.route):smoothstep(0,8,pc.court);
            flag=SURF.flagstone;
            t=pavingAt(wx,wy,lerp(0.95,1.04,worn));
            flatMade=true;
          }
          /* The snow bank on the land side of the waterline. It makes the shore
             read as an edge. */

          if(wm[pi+n]||wm[pi+n-1]||wm[pi+n+1]) t = 0.97;
          /* No lip on the near and side banks: there it is snow seen edge-on
             from above. */
        }
        /* Meadow circulation is one fitted-stone field. The approach starts
           inside the analytic world trail, so sharing this sampler closes the
           junction without a cap, seam, or separately authored transition. */
        if(PLAN.pavedTrail&&flag===SURF.trail){
          flag=SURF.flagstone;
          t=pavingAt(wx,wy);
          flatMade=true;
        }
        g[o]=Math.round(clamp(t,0,1)*255);
        /* INVARIANT: bake geometry first, then remap its surface flag through
           PLAN.ground. Geometry is shared; only this byte chooses the world's
           material. */
        if(GROUND!==null&&GROUND[flag]!==undefined) flag=GROUND[flag];
        /* INVARIANT: apply the flag remap before WET/colWater capture. Collision,
   shoreline reflection and the painted surface must classify the same pixels. */
        if(WET.indexOf(flag)>=0){ water[y*CH+x]=1; if(colWater[x]===255) colWater[x]=y; }

        if(flag===SURF.pond){
          const repose=pc&&pc.pond<1?POND_COURT.pond.bankRepose:undefined;
          t=pondT(dLg[pi],undefined,repose);
          const fu=(wx*WCA+wy*WSA), fv=(-wx*WSA+wy*WCA);
          t-=0.055*smoothstep(0.10,0.34,Math.abs(fbm(nD,fu*0.0034+53,fv*0.013+7,2)));
          g[o]=Math.round(clamp(t,0,1)*255);
        }
        /* Terrain normals carry sub-rung relief that albedo noise cannot
           express without confetti. Made paving stays flat. */
        const efx=(x+es)/es, efy=(y+es)/es;
        const sx=flatMade?0:gsamp(gx_,efx,efy)*2, sy=flatMade?0:gsamp(gy_,efx,efy)*2;
        let mx=0,my=0;
        if(MR!==null&&flag===SURF.sward){

          /* The gate opens across 0.08..0.40, which leaves quiet ground between
             rough patches. */
          const q=(y+1)*(CH+2)+(x+1), pa=smoothstep(0.08,0.40,csamp(GT,x,y));
          mx=(MR[q+1]-MR[q-1])*CULM_A*pa; my=(MR[q+CH+2]-MR[q-CH-2])*CULM_A*pa;
        }
        g[o+1]=Math.round((clamp(sx*7.5+mx,-1,1)*0.5+0.5)*255);
        g[o+2]=Math.round((clamp(sy*7.5+my,-1,1)*0.5+0.5)*255);
        g[o+3]=flag*FLAG_Q;
      }
    }
  }

  /* Stones along the bank, on a hashed grid so they stream. */
  function bankStones(frame,out){
    const {cx,cy,n,wm,dL}=frame, g=out.geom;
    const SC=22;
    for(let gy=Math.floor(cy*CH/SC);gy<=Math.floor(((cy+1)*CH-1)/SC);gy++)
    for(let gx=Math.floor(cx*CH/SC);gx<=Math.floor(((cx+1)*CH-1)/SC);gx++){
      if(hashf(gx,gy,seed^0x5709)>0.42) continue;
      const jx=Math.round(gx*SC+hashf(gx,gy,1)*SC), jy=Math.round(gy*SC+hashf(gx,gy,2)*SC);
      const lx=jx-cx*CH, ly=jy-cy*CH;
      if(lx<2||ly<2||lx>=CH-2||ly>=CH-2) continue;
      const pi=(ly+PAD)*n+(lx+PAD);
      if(!wm[pi]||dL[pi]<1||dL[pi]>5) continue;
      const rw=2+Math.floor(hashf(gx,gy,3)*3), rh=1+Math.floor(hashf(gx,gy,4)*2);
      for(let dy=-rh;dy<=rh;dy++)for(let dx=-rw;dx<=rw;dx++){
        if((dx*dx)/(rw*rw)+(dy*dy)/(rh*rh)>1) continue;
        const X=lx+dx, Y=ly+dy;
        if(X<0||Y<0||X>=CH||Y>=CH) continue;
        const o=(Y*CH+X)*4;
        g[o]=Math.round((dy<-rh*0.2?0.62:0.16)*255); g[o+3]=surf(4)*FLAG_Q;
      }
      for(let dx=-rw+1;dx<=rw-1;dx++){
        const X=lx+dx, Y=ly-rh;
        if(X<0||Y<0||X>=CH||Y>=CH||hashf(gx*97+dx,gy,5)>0.78) continue;
        const o=(Y*CH+X)*4; g[o]=255; g[o+3]=surf(5)*FLAG_Q;
      }
    }
  }

  function portalDiscs(frame,out){
    const {cx,cy}=frame, g=out.geom;
    for(const PORTAL of PORTALS){
      const lx=PORTAL.x-cx*CH, ly=PORTAL.y-cy*CH, R=PORTAL_RING;
      if(lx>-R-2&&ly>-R-2&&lx<CH+R+2&&ly<CH+R+2){
        for(let dy=-R-1;dy<=R+1;dy++)for(let dx=-R-1;dx<=R+1;dx++){
          const X=Math.round(lx)+dx, Y=Math.round(ly)+dy;
          if(X<0||Y<0||X>=CH||Y>=CH) continue;
          /* The disc is drawn in the oblique projection: k = 1/2 on the depth
             axis, so a ground circle is a screen ellipse. PROJECTION.md. */
          const ex=dx, ey=dy/0.5;
          const d=Math.hypot(ex,ey), u=d/R;
          if(u>1) continue;
          const o=(Y*CH+X)*4;

          const a=Math.atan2(ey,ex);
          const bright = Math.abs(u-0.44)<0.075                    // the inner ring
                      || u<0.15                                    // the boss
                      || (Math.abs(Math.sin(a*4))<0.13 && u<0.80); // eight rays
          const flag=surf(bright?SURF.trail:SURF.stone);
          const t=bright?0.97:0.16;
          g[o]=Math.round(clamp(t,0,1)*255);
          g[o+3]=flag*FLAG_Q;
          /* Kerb and paving are flat: neutral slope channel. */
          g[o+1]=128; g[o+2]=128;
        }
      }
    }
  }

  const PAINT=PLAN.glow?paintHollow
    :{karst:paintSwamp,oasis:paintDesert}[PLAN.water]||paintTemperate;
  function paintGround(frame){
    const out={geom:new Uint8Array(CH*CH*4),water:new Uint8Array(CH*CH),
               colWater:new Uint8Array(CH).fill(255)};
    PAINT(frame,out);
    if(PLAN.bankStones) bankStones(frame,out);
    portalDiscs(frame,out);
    return out;
  }

  return {paintGround};
}

export { RIM, makeGround };
