import { clamp, lerp } from './math.js';

/* Invariant: sprites store material, unit surface normals, AO and thickness,
   never colour. The shader resolves ramp/rung at runtime. */

let LIGHT={x:-0.55,y:-0.42,z:0.72};
/* Material 13 is an airborne ground pair. Its two baked shade values select
   the endpoints of the instance's material ramp in SPRITE_FS. */
const GRAIN=13;
/* Material 14 is the same pair, emitted: a spell's own light (src/spell.js).
   SPRITE_FS gives it no aerial treatment. */
const GLOW=14;
/* a frost crystal: the plate's own ice, emitted (src/spell.js) */
const FROST=15;
/* A luminous body (src/speleo.js): `shade` is a position on the instance's
   deposit ramp, read with no light on it. It casts no shadow. */
const LUMEN=19;
function setLight(deg){
  const a=deg*Math.PI/180;
  let x=Math.cos(a), y=Math.sin(a), z=0.72;
  const l=Math.hypot(x,y);
  x=x/l*0.70; y=y/l*0.70;
  const m=Math.hypot(x,y,z); LIGHT={x:x/m,y:y/m,z:z/m};
}

/* `shade` is the baked dot product for the software compositor. `nx,ny,nz` is
   the surface normal that produced it; the GPU path relights from it. `ao` is
   geometric darkening (contact occlusion, depth into a snow mass) that
   survives a moving light. */
function newSprite(w,h){
  const n=w*h;
  const sp={w,h,ax:w>>1,ay:h-1,
    occ:new Uint8Array(n), shade:new Float32Array(n),
    horiz:new Float32Array(n), rad:new Float32Array(n),
    nx:new Float32Array(n), ny:new Float32Array(n), nz:new Float32Array(n),
    ao:new Float32Array(n), noSnow:new Uint8Array(n)};
  sp.ao.fill(1); sp.nz.fill(1);
  return sp;
}

/* Stamp one disc of a branch, recording the cylinder normal per pixel. */
function stampDisc(sp,cx,cy,r,lax,lay,horiz,material=1){
  const lat=lax*LIGHT.x+lay*LIGHT.y;
  if(r<0.72){
    const x=Math.round(cx),y=Math.round(cy);
    if(x<0||y<0||x>=sp.w||y>=sp.h) return;
    const i=y*sp.w+x;
    if(sp.occ[i]===0||sp.rad[i]<r){
      sp.occ[i]=material; sp.shade[i]=clamp(0.20+0.90*LIGHT.z,0,1);
      sp.horiz[i]=horiz; sp.rad[i]=Math.max(sp.rad[i],r);
      sp.nx[i]=0; sp.ny[i]=0; sp.nz[i]=1;              // a one-pixel twig faces us
    }
    return;
  }
  const r2=r*r;
  const x0=Math.max(0,Math.floor(cx-r)), x1=Math.min(sp.w-1,Math.ceil(cx+r));
  const y0=Math.max(0,Math.floor(cy-r)), y1=Math.min(sp.h-1,Math.ceil(cy+r));
  for(let y=y0;y<=y1;y++){
    for(let x=x0;x<=x1;x++){
      const dx=x+0.5-cx, dy=y+0.5-cy;
      if(dx*dx+dy*dy>r2) continue;
      const i=y*sp.w+x;
      const n=clamp((dx*lax+dy*lay)/r,-1,1);
      const ndl=n*lat+Math.sqrt(Math.max(0,1-n*n))*LIGHT.z;
      const sh=clamp(0.16+0.94*ndl,0,1);
      if(sp.occ[i]===0||r>=sp.rad[i]){
        sp.occ[i]=material; sp.shade[i]=sh; sp.horiz[i]=horiz; sp.rad[i]=Math.max(sp.rad[i],r);
        sp.nx[i]=lax*n; sp.ny[i]=lay*n; sp.nz[i]=Math.sqrt(Math.max(0,1-n*n));
      }
    }
  }
}

/* Invariant: CHILD_FLOOR is a raster legibility floor only. Area/pipe
   conservation uses unfloored widths; species bud termination may use the same
   drawing threshold. */
const CHILD_FLOOR=0.8;

/* Recursive branch growth. `cfg` is the species grammar. */
function grow(sp,x,y,ang,len,wid,depth,cfg,rnd,pipeW){
  /* Invariant: grow reports terminal position and unfloored pipe radius at
     rejected buds and completed apical axes. Re-deriving either loses
     grammar/RNG state. */
  const wid0=pipeW===undefined?wid:pipeW;
  /* cfg.bud terminates by unfloored thickness at CHILD_FLOOR; maxDepth is a
     guard. Winter grammars opt out. */
  if(depth>cfg.maxDepth||len<1.4||(cfg.bud&&wid0<CHILD_FLOOR)){
    if(sp.tips) sp.tips.push([x,y,wid0*0.5]);
    return;
  }
  const steps=Math.max(2,Math.round(len));
  let curl=rnd.range(-cfg.curl,cfg.curl);
  /* Branches bend back toward the trunk's axis (tiltTarget) as they rise. */
  const toUp=((cfg.tiltTarget===undefined?-Math.PI/2:cfg.tiltTarget)-ang);
  curl+=toUp*cfg.upBias;
  const children=[];
  const nKids=depth===0?cfg.trunkKids:rnd.int(cfg.kidsMin,cfg.kidsMax);
  /* On the trunk, children start above clearBole. */
  for(let k=0;k<nKids;k++) children.push(rnd.range(depth===0?cfg.clearBole:0.30,0.97));
  children.sort();
  let ci=0;
  /* The true pipe left in the apical continuation after each lateral takes
     its share, kept apart from the raster width so the terminal record does
     not inherit CHILD_FLOOR. */
  let pipeRemain=wid0, tipX=x, tipY=y, completed=true;

  for(let i=0;i<=steps;i++){
    const t=i/steps;
    /* power-form taper: a stem is a solid of revolution */
    let w=wid*Math.pow(Math.max(0,1-t),cfg.taperP!==undefined?cfg.taperP:0.62);
    const fl=cfg.flareLen||0.13;
    if(depth===0&&cfg.flare>0&&t<fl){            // root flare at the base
      const f=1-t/fl; w*=1+cfg.flare*f*f;
    }
    if(depth>=cfg.twigDepth) w=Math.min(w,1.0);
    const dx=Math.cos(ang), dy=Math.sin(ang);
    tipX=x; tipY=y;
    stampDisc(sp,x,y,Math.max(0.5,w*0.5),-dy,dx,Math.abs(dx));
    while(ci<children.length&&children[ci]<=t){
      const side=rnd.chance(0.5)?1:-1;
      /* angle sampled from the species' measured distribution */
      const spread=rnd.norm(cfg.bA.m,cfg.bA.s,cfg.bA.lo,cfg.bA.hi)*side;
      const cl=len*rnd.range(cfg.lenMin,cfg.lenMax)*(1-t*0.35);
      /* Da Vinci's rule: the child takes a share of the parent's
         cross-sectional area, so r_parent^a = r_child^a + r_continuing^a
         holds at every fork. */
      const a=cfg.alpha;
      const share=clamp(rnd.norm(0.34,0.09,0.10,0.62),0.10,0.62);
      const cwTrue=w*Math.pow(share,1/a);
      const cw=Math.max(CHILD_FLOOR,cwTrue);
      const cont=w*Math.pow(1-share,1/a);
      wid*=Math.pow(1-share,1/a);
      pipeRemain*=Math.pow(1-share,1/a);
      /* parent, child, continuing: enough to recover the exponent */
      if(sp.forks) sp.forks.push([w,cw,cont]);
      grow(sp,x,y,ang+spread,cl,cw,depth+1,cfg,rnd,cwTrue);
      ci++;
    }
    ang+=curl/steps+rnd.range(-cfg.wobble,cfg.wobble);
    x+=dx; y+=dy;
    if(y<-4||x<-8||x>sp.w+8){ completed=false; break; }
  }
  /* A completed axis has an apical bud even when it initiated no child. */
  if(completed&&sp.tips) sp.tips.push([tipX,tipY,pipeRemain*0.5]);
}

/* ── morphology helpers, used to turn scattered deposits into shapes ────── */
function dilate(m,w,h,r){
  const o=new Uint8Array(m), r2=r*r+0.1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(m[i]) continue;
    let hit=0;
    for(let dy=-r;dy<=r&&!hit;dy++)for(let dx=-r;dx<=r;dx++){
      if(dx*dx+dy*dy>r2) continue;
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=w||yy>=h) continue;
      if(m[yy*w+xx]){hit=1;break;}
    }
    if(hit) o[i]=1;
  }
  m.set(o);
}
function erode(m,w,h,r){
  const o=new Uint8Array(m), r2=r*r+0.1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(!m[i]) continue;
    let miss=0;
    for(let dy=-r;dy<=r&&!miss;dy++)for(let dx=-r;dx<=r;dx++){
      if(dx*dx+dy*dy>r2) continue;
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=w||yy>=h||!m[yy*w+xx]){miss=1;break;}
    }
    if(miss) o[i]=0;
  }
  m.set(o);
}
/* An ellipse stretched along the branch axis; a circular clump reads as a
   cotton ball. */
function stampMask(m,w,h,cx,cy,rx,ry){
  for(let y=Math.max(0,Math.floor(cy-ry));y<=Math.min(h-1,Math.ceil(cy+ry));y++)
  for(let x=Math.max(0,Math.floor(cx-rx));x<=Math.min(w-1,Math.ceil(cx+rx));x++){
    const dx=(x+0.5-cx)/rx, dy=(y+0.5-cy)/ry;
    if(dx*dx+dy*dy<=1) m[y*w+x]=1;
  }
}

/* snowPass deposits by exposure, masses neighbouring caps, then shades a
   coherent crust.

   SNOW is an object because buildWorldAtlas (src/atlas.js) overrides the knobs
   per species and restores them: an imported binding cannot be assigned, a
   property can. */
const SNOW={
  /* How far the snow ramp is compressed toward the top of the palette. */
  form:1.0,
  /* How far snow spans an empty gap along a row, in pixels. 0 keeps the
     per-column deposit; the world atlas turns it up. */
  bridge:0,
  /* How hard snow refuses a steep member. `horiz` (stampDisc) is |dx| along
     the branch: 1 horizontal, 0 vertical. At 0 the load follows every member
     including the trunk. */
  tilt:0,
  /* How dark the wood directly beneath a mass sits. */
  under:0.55,
  /* A bare branch stands against lit snow, so it shows its shaded side. A
     member of a bare twin under this radius takes this occlusion: every
     member snowPass could frost, so the bole keeps its bark. Measured
     failure: at its laden shading a bare birch crown paints within one rung
     of the snow behind it and the tree reads as removed. */
  twigRad:2.35, twigAo:0.20,
};
function snowPass(sp,rnd,amount,clumpiness,reach){
  if(amount<=0.01) return;
  /* REACH is how far up a pixel must see clear sky before snow settles. 7
     fits a bare deciduous crown. A conifer's whorls shadow each other, so it
     needs a short reach or only the outer tips load. */
  const {w,h,occ,horiz,rad}=sp, N=w*h, REACH=reach||7;
  const snow=new Uint8Array(N);
  const cl=clumpiness===undefined?1:clumpiness;

  const und=new Float32Array(w);
  {
    const k=Math.max(3,Math.round(w/9)), nc=Math.ceil(w/k)+2, ctrl=[];
    for(let i=0;i<nc;i++) ctrl.push(rnd.f());
    for(let x=0;x<w;x++){
      const f=x/k, i0=Math.min(nc-2,f|0), t=f-i0, sm=t*t*(3-2*t);
      und[x]=lerp(ctrl[i0],ctrl[i0+1],sm);
    }
  }
  const crest=(x,y)=>und[(x+y*5+((y*y)>>2))%w];

  for(let y=1;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(occ[i]!==1) continue;
    let exp=0;
    for(let k=1;k<=REACH;k++){
      const yy=y-k;
      if(yy<0){exp=REACH;break;}
      if(occ[yy*w+x]!==0) break;
      exp++;
    }
    if(exp<REACH-1) continue;                        // shaded from above
    /* Thickness is proportional to the carrying branch. An absolute cap is
       2% of a big tree and 15% of a small one. */
    const hz=horiz[i], rad0=Math.max(0.55,rad[i]);
    /* The crest applies after the radius cap. Inside the min, a thick branch
       pins th to the cap and the thick horizontal limbs get flat tops. */
    const cap=Math.round(1.4+rad0*1.25);
    let amt=amount*(0.55+1.00*hz)*(1.05+0.30*rad0)*rnd.range(0.94,1.07);
    if(SNOW.tilt>0){
      const gt=Math.pow(clamp(hz,0,1),1.35);
      /* Nothing settles on a near-vertical; the saved load goes to members
         that hold it, so total load is conserved. */
      if(gt<0.20*SNOW.tilt){
        /* a little rime on a bare stem */
        if(!(rnd.chance(0.22)&&rad0>1.0)) continue;
        amt*=0.5;
      } else amt*=(0.55+0.95*gt)*(1+0.55*SNOW.tilt);
    }
    const th=Math.max(1,Math.round(Math.min(cap,amt)*(0.46+1.06*crest(x,y))));
    for(let k=0;k<th;k++){ const yy=y-1-k; if(yy<0) break; snow[yy*w+x]=1; }
    /* Frost the wood itself only between radii 1.3 and 2.35: a one-pixel
       twig keeps its dark line and a thick trunk is not buried. */
    if((rad[i]>=1.3||th>=2)&&rad[i]<2.35&&!sp.noSnow[i]) snow[i]=1;
    /* pile at the joints, where the mass grows from */
    if(th>=1&&rnd.chance(0.16*amount*cl*(0.35+hz))){
      const r=rnd.range(1.5,1.7+amount*0.9*cl);
      stampMask(snow,w,h,x+0.5,y-r*0.50,r*rnd.range(1.35,2.0),r*rnd.range(0.62,0.85));
    }
  }

  if(SNOW.bridge>0){
    const top=new Int16Array(w).fill(-1);
    for(let x=0;x<w;x++) for(let y=0;y<h;y++) if(snow[y*w+x]){ top[x]=y; break; }
    let x=0;
    while(x<w){
      if(top[x]>=0){ x++; continue; }
      let e=x; while(e<w&&top[e]<0) e++;
      const gap=e-x;
      if(x>0&&e<w&&gap<=SNOW.bridge){
        const a=top[x-1], b=top[e];
        for(let k=x;k<e;k++){
          const f=(k-x+1)/(gap+1);
          const sag=Math.round(Math.sin(f*Math.PI)*Math.min(1.7,gap*0.6));
          const yy=Math.round(lerp(a,b,f))+sag;
          if(yy<0||yy>=h) continue;
          let sup=false;
          for(let d=1;d<=4;d++){ const q=yy+d;
            if(q<h&&(occ[q*w+k]||snow[q*w+k])){ sup=true; break; } }
          if(!sup) continue;
          /* over air only: across wood it buries the trunk */
          for(let q=yy;q<Math.min(h,yy+2);q++) if(!occ[q*w+k]) snow[q*w+k]=1;
        }
      }
      x=e;
    }
  }
  if(cl>0.05){
    const keep=new Uint8Array(snow);
    dilate(snow,w,h,1); erode(snow,w,h,1);
    for(let i=0;i<N;i++) if(keep[i]) snow[i]=1;      // closing that only adds
  }

  /* commit, then shade each mass from its own neighbourhood */
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(!snow[i]||(occ[i]!==0&&occ[i]!==1)) continue;
    occ[i]=2;
  }

  const nl=Math.hypot(LIGHT.x,LIGHT.y)||1;
  const mx=LIGHT.x/nl, my=LIGHT.y/nl;   // march TOWARD the light, not away
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(occ[i]!==2) continue;
    let depth=0, fx=x+0.5, fy=y+0.5;
    for(let k=0;k<11;k++){
      fx+=mx; fy+=my;
      const xi=Math.floor(fx), yi=Math.floor(fy);
      if(xi<0||yi<0||xi>=w||yi>=h||occ[yi*w+xi]!==2) break;
      depth++;
    }
    const dn = y<h-1 ? (occ[i+w]!==0) : true;
    let t;
    if(!dn)             t=0.38;            // overhanging air: the undercut
    else if(depth<=0)   t=1.00;            // surface facing the light
    else if(depth<=1)   t=0.87;
    else if(depth<=3)   t=0.73;
    else if(depth<=6)   t=0.59;
    else                t=0.47;

    t = (!dn) ? 0.34 : 1-(1-t)*SNOW.form;
    sp.shade[i]=clamp(t+rnd.range(-0.035,0.035),0,1);
    sp.ao[i]=t;                                  // form, not light
    /* Outward normal: sum of directions to empty neighbours. Interior pixels
       face the viewer, edges tilt. */
    let ox=0,oy=0,cnt=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy) continue;
      const xx=x+dx, yy=y+dy;
      const empty=(xx<0||yy<0||xx>=w||yy>=h)?1:(occ[yy*w+xx]===0?1:0);
      if(empty){ const l=Math.hypot(dx,dy); ox+=dx/l; oy+=dy/l; cnt++; }
    }
    const ol=Math.hypot(ox,oy);
    if(ol>0.001&&cnt<7){
      const k=clamp(ol/2.6,0,0.85);
      sp.nx[i]=(ox/ol)*k; sp.ny[i]=(oy/ol)*k; sp.nz[i]=Math.sqrt(Math.max(0,1-k*k));
    }else{ sp.nx[i]=0; sp.ny[i]=0; sp.nz[i]=1; }
  }
  /* the wood directly beneath a mass sits in its shadow */
  for(let y=1;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(occ[i]===1&&occ[i-w]===2) sp.shade[i]*=SNOW.under;
  }
}

/* The same tree with its snow gone, or null when it carries none. A deposit
   pixel over air clears. One that frosted wood is wood again: snowPass leaves
   that wood's `rad`, and it takes the shade and normal of the wood beside it.
   The canvas and the anchor are the laden sprite's, so the swap moves no
   pixel of wood. Take it before underPlate: an underside belongs to a plate. */
const TWIN_CHANNELS=['occ','shade','horiz','rad','nx','ny','nz','ao','noSnow'];
const TWIN_NEAR=[[0,1],[-1,0],[1,0],[-1,1],[1,1],[0,-1]];
function bareTwin(sp){
  const {w,h,occ}=sp;
  if(!occ.includes(2)) return null;
  const out={...sp};
  for(const ch of TWIN_CHANNELS) if(sp[ch]) out[ch]=sp[ch].slice();
  /* the shadow of a mass leaves with the mass */
  for(let i=w;i<w*h;i++)
    if(occ[i]===1&&occ[i-w]===2) out.shade[i]=Math.min(1,sp.shade[i]/SNOW.under);
  for(let i=0;i<w*h;i++){
    if(occ[i]!==2) continue;
    if(!(sp.rad[i]>0)){ out.occ[i]=0; continue; }
    out.occ[i]=1;
    const x=i%w,y=(i/w)|0;
    let from=-1;
    for(const [dx,dy] of TWIN_NEAR){
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=w||yy>=h||occ[yy*w+xx]!==1) continue;
      from=yy*w+xx; break;
    }
    if(from<0){ out.shade[i]=0.5; out.ao[i]=1; out.nx[i]=0; out.ny[i]=0; out.nz[i]=1; continue; }
    out.shade[i]=out.shade[from]; out.ao[i]=sp.ao[from];
    out.nx[i]=sp.nx[from]; out.ny[i]=sp.ny[from]; out.nz[i]=sp.nz[from];
  }
  for(let i=0;i<w*h;i++)
    if(out.occ[i]===1&&out.rad[i]<SNOW.twigRad){
      out.ao[i]=Math.min(out.ao[i],SNOW.twigAo);
      out.shade[i]=Math.min(out.shade[i],SNOW.twigAo);
    }
  return out;
}

/* Source: Monsi & Saeki 1953, I/I0=exp(-k*LAI). canopyPass converts crown
   optical depth to per-row AO without a new constant. */
function canopyPass(sp,kLAI){
  const {w,h,occ}=sp;
  let y0=h,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++) if(occ[y*w+x]===2){ if(y<y0)y0=y; if(y>y1)y1=y; break; }
  if(y1<0) return sp;
  const D=Math.max(1,y1-y0+1), kpx=kLAI/D;
  sp.crownD=D;                      // the drawn depth the optical depth is per
  for(let x=0;x<w;x++){
    let above=0;
    for(let y=0;y<h;y++){
      const i=y*w+x;
      if(occ[i]!==2) continue;
      sp.ao[i]=Math.exp(-kpx*above);
      above++;
    }
  }
  return sp;
}

/* Birch bark: short dark dashes where the branch is thick enough to read. A
   threshold of 1.7 reaches only the bottom of the bole on a 48 px birch. */
const BARK={ minR:1.35 };   // object, for the reason given at SNOW
function barkPass(sp,rnd,density){
  const {w,h,occ,rad}=sp;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(occ[i]!==1||rad[i]<BARK.minR) continue;
    if(!rnd.chance(density)) continue;
    const len=Math.max(1,Math.round(rad[i]*rnd.range(0.55,1.35)));
    const th=rnd.chance(0.45)?2:1;
    for(let k=0;k<len;k++)for(let t=0;t<th;t++){
      const xx=x+k, yy=y+t;
      if(xx>=w||yy>=h) continue;
      const j=yy*w+xx;
      if(occ[j]===1) occ[j]=3;
    }
  }
}

/* Contact darkening: pixels with many wood neighbours sit deeper in the form. */
function aoPass(sp,strength){
  const {w,h,occ,shade}=sp, out=new Float32Array(shade);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x;
    if(occ[i]!==1&&occ[i]!==3) continue;
    let n=0;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
      const o=occ[i+dy*w+dx]; if(o===1||o===3) n++;
    }
    const k=1-strength*clamp((n-9)/16,0,1);
    out[i]=shade[i]*k; sp.ao[i]=k;
  }
  sp.shade=out;
}

function trimSprite(sp){
  const {w,h,occ}=sp;
  let x0=w,x1=-1,y0=h,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++) if(occ[y*w+x]){
    if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
  }
  if(x1<0) return sp;
  const nw=x1-x0+1, nh=y1-y0+1, out=newSprite(nw,nh);
  out.ax=sp.ax-x0; out.ay=sp.ay-y0;
  for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){
    const s=(y+y0)*w+(x+x0), d=y*nw+x;
    out.occ[d]=occ[s]; out.shade[d]=sp.shade[s];
    out.horiz[d]=sp.horiz[s]; out.rad[d]=sp.rad[s];
    out.nx[d]=sp.nx[s]; out.ny[d]=sp.ny[s]; out.nz[d]=sp.nz[s]; out.ao[d]=sp.ao[s];
    out.noSnow[d]=sp.noSnow[s];
  }
  /* Invariant: trimSprite preserves every sprite tag explicitly. Optional
     tags stay absent when undefined; undefined keys break identity tests. */
  out.ramp=sp.ramp; out.sMin=sp.sMin; out.sMax=sp.sMax;

  if(sp.ramp2!==undefined){ out.ramp2=sp.ramp2; out.dMin=sp.dMin; out.dMax=sp.dMax; }
  out.kind=sp.kind; out.tilt=sp.tilt;
  out.forks=sp.forks; out.alpha=sp.alpha; out.crownR=sp.crownR; out.crownW=sp.crownW;

  if(sp.lobes!==undefined) out.lobes=sp.lobes;
  if(sp.crownD!==undefined) out.crownD=sp.crownD;
  if(sp.vol!==undefined) out.vol=sp.vol;
  return out;
}

/* trimSprite's opposite: grows the canvas and carries the anchor, for parts
   that hang outside the walker rig's box. */
function padSprite(sp,l,r,t,b){
  const nw=sp.w+l+r, nh=sp.h+t+b, out=newSprite(nw,nh);
  out.ax=sp.ax+l; out.ay=sp.ay+t;
  for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++){
    const s=y*sp.w+x, d=(y+t)*nw+(x+l);
    out.occ[d]=sp.occ[s]; out.shade[d]=sp.shade[s];
    out.horiz[d]=sp.horiz[s]; out.rad[d]=sp.rad[s];
    out.nx[d]=sp.nx[s]; out.ny[d]=sp.ny[s]; out.nz[d]=sp.nz[s];
    out.ao[d]=sp.ao[s]; out.noSnow[d]=sp.noSnow[s];
  }
  out.ramp=sp.ramp; out.sMin=sp.sMin; out.sMax=sp.sMax; out.kind=sp.kind; out.tilt=sp.tilt;
  return out;
}

/* Tall figures use projected silhouette shadows; short props use this drawn,
   Bayer-dithered contact floor.

   BAYER8 is the 8x8 ordered table palette.js bakes for the GPU, as thresholds
   in (0,1). Written out so sprite.js does not depend on the palette;
   test/tracks.test.mjs asserts the two agree. */
const BAYER8=[ 0,32, 8,40, 2,34,10,42, 48,16,56,24,50,18,58,26,
              12,44, 4,36,14,46, 6,38, 60,28,52,20,62,30,54,22,
               3,35,11,43, 1,33, 9,41, 51,19,59,27,49,17,57,25,
              15,47, 7,39,13,45, 5,37, 63,31,55,23,61,29,53,21];
const CONTACT_FALLOFF=0.65;
const bayer8=(x,y)=>(BAYER8[(((y%8)+8)%8)*8+(((x%8)+8)%8)]+0.5)/64;

/* Rasterise one ground blob from a per-column depth profile. `dep[x]` is the
   half-depth in rows at that column; zero means no shadow. */
function contactFromProfile(dep,h,core){
  const w=dep.length;
  const sp=newSprite(w,h);
  sp.ax=w>>1; sp.ay=h-1;
  const cy=(h-1)/2;
  for(let x=0;x<w;x++){
    const d=dep[x];
    if(d<=0) continue;
    for(let y=0;y<h;y++){
      /* Coverage: solid on the centre row, zero at the rim. `core` is the
         falloff exponent: below 1 the blob frays only at the edge, above 1
         it smears. */
      const t=Math.abs(y-cy)/d;
      if(t>1) continue;
      const cov=Math.pow(1-t,core);
      if(cov>=1 || bayer8(x,y)<cov){ const i=y*w+x; sp.occ[i]=1; sp.shade[i]=1; }
    }
  }
  sp.ramp='shade'; sp.sMin=0; sp.sMax=1; sp.kind='contact'; sp.tilt=0;
  return sp;                    // not trimmed: the blob is the shape
}

/* Short-prop contact ladder. Undergrowth gets an ellipse, not a projected
   shadow. The scene picks the widest rung at or below the prop's width: one
   13 px blob is two and a half times the width of a 5 px sedge tuft.

   Unit: rung heights hold 5/13, the ratio of the traveller's 13x5 contact, so
   every rung sits on one projection. */
const CONTACT_RUNGS=Object.freeze([5,9,13,17,21]);
const contactRows=(w)=>Math.max(3,Math.round(w*5/13));
const contactRung=(w)=>{
  let pick=CONTACT_RUNGS[0];
  for(const r of CONTACT_RUNGS) if(r<=w) pick=r;
  return pick;
};

/* The ground a building stands on, as a flat caster.

   The projected pass shears a sprite from its bottom row, as a billboard. A
   cabinet building's base is a parallelogram sheared `cols` right over `rows`
   up, so the pass drops the shadow under the return: on a meadow house, a lit
   wedge 34 rows deep between the back corner and the cast.

   A box's shadow is its footprint swept along the sun. The pass computes the
   sweep; this is the footprint, drawn through the contact pass, which does
   not shear. The rim is dithered like a contact blob. */
function makeFootprint(w,rows,cols,dx=0,pad=2){
  /* Padding on three sides only: the front edge is the sprite's bottom row,
     so the contact pass seats it on the building's base. `dx` moves the
     anchor to the building's front-edge centre. */
  const W=w+cols+pad*2, H=rows+pad+1;
  const sp=newSprite(W,H);
  sp.ax=Math.round(pad+(w-1)/2-dx); sp.ay=H-1;
  for(let r=0;r<=rows;r++){
    const y=H-1-r, x0=pad+Math.round(cols*(rows?r/rows:0));
    for(let x=x0;x<x0+w;x++){
      /* One pixel of fray at the rim. Two read as a checkerboard band along
         the long back edge. */
      const edge=Math.min(x-x0,x0+w-1-x,r,rows-r);
      const cov=edge>=1?1:0.55;
      if(cov>=1||bayer8(x,y)<cov){ const i=y*W+x; sp.occ[i]=1; sp.shade[i]=1; }
    }
  }
  sp.ramp='shade'; sp.sMin=0; sp.sMax=1; sp.kind='footprint'; sp.tilt=0;
  return sp;
}

function makeContact(w,h){
  const dep=new Float32Array(w);
  const cx=(w-1)/2, rx=w/2, ry=h/2;
  for(let x=0;x<w;x++){
    const dx=(x-cx)/rx;
    /* Rounded to whole rows before the dither: the outline is a staircase
       of integer runs. */
    dep[x]=Math.round(ry*Math.sqrt(Math.max(0,1-dx*dx)));
  }
  return contactFromProfile(dep,h,CONTACT_FALLOFF);
}

/* A flame tongue from a width profile: widest a quarter of the way up, one
   pixel at the tip, the tip carried `lean` columns sideways. Material GLOW:
   shade 1 is the body and shade 0 the one-pixel mantle, so one instance
   draws both ends of its ramp window. `w` is odd. */
function makeFlame(w,h,lean=0){
  const pad=Math.abs(lean),W=w+pad*2;
  const sp=newSprite(W,h);
  const half=w/2;
  const widthAt=(t)=>half*(t<0.25?0.70+1.20*t:Math.pow(1-(t-0.25)/0.75,0.8));
  for(let y=0;y<h;y++){
    const t=(h-1-y)/Math.max(1,h-1);
    const hw=widthAt(t),cx=(W-1)/2+Math.round(lean*t*t);
    for(let x=0;x<W;x++){
      const d=Math.abs(x-cx);
      if(d>hw&&d>0.01) continue;
      const i=y*W+x;
      sp.occ[i]=GLOW; sp.rad[i]=1;
      sp.shade[i]=d<=hw-1&&t<0.8?1:0;
    }
  }
  return sp;
}

/* One row of dark underside beneath every snow plate turns a laden spruce's
   whorls into tiers. */
function underPlate(sp){
  const {w,h,occ}=sp, add=[];
  for(let y=0;y<h-1;y++)for(let x=0;x<w;x++){
    if(occ[y*w+x]!==2||occ[(y+1)*w+x]!==0) continue;
    let run=1;
    for(let k=x-1;k>=0&&occ[y*w+k]===2;k--) run++;
    for(let k=x+1;k<w&&occ[y*w+k]===2;k++) run++;
    if(run<3) continue;                       // a speck is not a bough
    add.push((y+1)*w+x);
  }
  for(const i of add){
    sp.occ[i]=1; sp.shade[i]=0.05; sp.ao[i]=0.30;
    sp.nx[i]=0; sp.ny[i]=0.55; sp.nz[i]=0.835;
  }
  return sp;
}

const DROOP_MIN_RUN=3;
function droopPass(sp,rnd,density,maxLen){
  if(!(density>0)) return sp;
  const {w,h,occ}=sp, len1=Math.max(1,maxLen||2), add=[];
  /* An underside is solid with air directly beneath it. Snow counts. */
  const solid=o=>o===1||o===2||o===3;
  const under=(x,y)=>solid(occ[y*w+x])&&occ[(y+1)*w+x]===0;
  for(let y=0;y<h-1;y++)for(let x=0;x<w;x++){
    if(!under(x,y)) continue;
    let run=1;
    for(let k=x-1;k>=0&&under(k,y);k--) run++;
    for(let k=x+1;k<w&&under(k,y);k++) run++;
    if(run<DROOP_MIN_RUN) continue;
    if(!rnd.chance(density)) continue;
    const len=1+rnd.int(0,len1-1);
    for(let k=1;k<=len;k++){
      const yy=y+k; if(yy>=h) break;
      const j=yy*w+x; if(occ[j]!==0) break;      // never overwrite structure
      add.push(j);
    }
  }
  /* committed after the scan, so a stroke never seeds another stroke */
  for(const j of add){
    sp.occ[j]=1; sp.shade[j]=0.06; sp.ao[j]=0.34;
    sp.nx[j]=0; sp.ny[j]=0.42; sp.nz[j]=Math.sqrt(1-0.42*0.42);
  }
  return sp;
}

/* Delete any fragment outside the main body. A sub-pixel branch whose disc
   stamps fail to overlap leaves a detached twig tip: one atlas birch carries
   twelve pixels two pixels clear of its crown. */
function dropFragments(sp){
  const {w,h,occ}=sp, lab=new Int32Array(w*h).fill(-1), comps=[];
  for(let i=0;i<w*h;i++){
    if(!occ[i]||lab[i]>=0) continue;
    const st=[i], id=comps.length, cells=[]; lab[i]=id;
    while(st.length){ const j=st.pop(); cells.push(j);
      const x=j%w, y=(j/w)|0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx, yy=y+dy;
        if(xx<0||yy<0||xx>=w||yy>=h) continue;
        const q=yy*w+xx; if(!occ[q]||lab[q]>=0) continue;
        lab[q]=id; st.push(q);
      }
    }
    comps.push(cells);
  }
  if(comps.length<2) return sp;
  comps.sort((a,b)=>b.length-a.length);
  for(let c=1;c<comps.length;c++) for(const i of comps[c]) sp.occ[i]=0;
  return sp;
}

/* ═════════════════════════ ATLAS FOR THE WORLD ═══════════════════════════ */

function trimLeader(sp,keep){
  /* Find the crown by row span (>= 6 px), not pixel count: the snow cap on
     the leader tip is three or four pixels wide. */
  let top=-1;
  for(let y=0;y<sp.h&&top<0;y++){
    let a=-1,b=-1;
    for(let x=0;x<sp.w;x++) if(sp.occ[y*sp.w+x]){ if(a<0)a=x; b=x; }
    if(a>=0&&b-a+1>=6) top=y;
  }
  if(top<0) return sp;
  const cut=Math.max(0,top-keep);
  for(let y=0;y<cut;y++)for(let x=0;x<sp.w;x++) sp.occ[y*sp.w+x]=0;
  return trimSprite(sp);
}

/* Normalisation length in pixels, exported for consumers that convert
   thickness to optical depth. partThickness returns the local maximum
   distance-to-background divided by this, saturating at 3 px into a mass. */
const THICK_PX=3.0;
function partThickness(sp, isPart){
  const w=sp.w, h=sp.h, N=w*h, INF=1e9;
  const d=new Float32Array(N);
  for(let i=0;i<N;i++) d[i]= isPart(sp.occ[i]) ? INF : 0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x; if(d[i]===0) continue; let m=INF;
    if(x>0)        m=Math.min(m,d[i-1]+1);
    if(y>0)        m=Math.min(m,d[i-w]+1);
    if(x>0&&y>0)   m=Math.min(m,d[i-w-1]+1.414);
    if(x<w-1&&y>0) m=Math.min(m,d[i-w+1]+1.414);
    d[i]=Math.min(d[i],m);
  }
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){
    const i=y*w+x; if(d[i]===0) continue; let m=d[i];
    if(x<w-1)          m=Math.min(m,d[i+1]+1);
    if(y<h-1)          m=Math.min(m,d[i+w]+1);
    if(x<w-1&&y<h-1)   m=Math.min(m,d[i+w+1]+1.414);
    if(x>0&&y<h-1)     m=Math.min(m,d[i+w-1]+1.414);
    d[i]=m;
  }
  const out=new Float32Array(N);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let mx=0;
    for(let dy=-2;dy<=2;dy++){
      const yy=y+dy; if(yy<0||yy>=h) continue;
      for(let dx=-2;dx<=2;dx++){
        const xx=x+dx; if(xx<0||xx>=w) continue;
        const v=d[yy*w+xx]; if(v<INF&&v>mx) mx=v;
      }
    }
    out[y*w+x]=Math.min(1, mx/THICK_PX);
  }
  return out;
}

export { BARK, CHILD_FLOOR, CONTACT_RUNGS, FROST, GLOW, GRAIN, LIGHT, LUMEN, THICK_PX, SNOW, aoPass, bareTwin, barkPass, canopyPass, contactRows, contactRung, dilate, droopPass, dropFragments, erode, grow, makeContact, makeFlame, makeFootprint, newSprite, padSprite, partThickness, setLight, snowPass, stampDisc, stampMask, trimLeader, trimSprite, underPlate };
