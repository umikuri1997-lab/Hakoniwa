import { clamp, lerp } from './math.js';
import { LUMEN, newSprite, stampDisc, trimSprite } from './sprite.js';

/* The Hollow's three growth forms. Each is a deposit or a fruit body, so none
   branches: `grow` in src/sprite.js is the wrong grammar. docs/HOLLOW.md owns
   the sources. A luminous part is material LUMEN: its `shade` is a position on
   the species' ramp2, read with no light on it. Rungs of a four-rung ramp. */
const RUNG=[0.08,0.36,0.66,1.00];

const UP={x:0,y:0,z:1};
const lumen=(sp,x,y,shade,N=UP)=>{
  x|=0; y|=0;
  if(x<0||y<0||x>=sp.w||y>=sp.h) return;
  const i=y*sp.w+x;
  sp.occ[i]=LUMEN; sp.shade[i]=shade; sp.ao[i]=1; sp.rad[i]=1;
  sp.nx[i]=N.x; sp.ny[i]=N.y; sp.nz[i]=N.z;
};
const tag=(sp,S,kind,tilt)=>{
  sp.ramp=S.ramp; sp.ramp2=S.ramp2; sp.sMin=S.sMin; sp.sMax=S.sMax;
  sp.dMin=S.dMin; sp.dMax=S.dMax; sp.kind=kind; sp.tilt=tilt||0;
  return trimSprite(sp);
};

/* One agaric: a stipe and a cap. SOURCE: gill edges give over 90% of a
   luminous agaric's light (O'Kane et al. 1990), so the underside is the
   brightest rung and the dome is flesh seen by its own glow. The underside
   shows as the near half of the cap's rim ellipse (PROJECTION.md, k = 1/2). */
function agaric(sp,bx,by,height,capW,lean,rnd){
  const rx=Math.max(1.5,capW/2);
  const dome=Math.max(2,Math.round(rx*rnd.range(0.62,0.80)));
  const gill=Math.max(1,Math.round(rx*0.16));
  const stemH=Math.max(1,height-dome);
  const topX=bx+lean*stemH;
  const r0=Math.max(0.5,height*0.060);
  for(let k=0;k<=stemH;k++){
    const t=k/Math.max(1,stemH);
    const x=lerp(bx,topX,t*t), y=by-k;
    /* a bulb at the foot, a neck under the cap */
    const r=r0*(1+0.55*Math.pow(1-t,3))*(1-0.25*t);
    stampDisc(sp,x,y,Math.max(0.5,r),1,0,0);
  }
  const cx=Math.round(topX), cy=by-stemH;
  /* the underside, drawn first so the dome's rim row covers its top */
  for(let dy=0;dy<=gill;dy++){
    const half=rx*0.94*Math.sqrt(Math.max(0,1-(dy/(gill+0.5))**2));
    for(let dx=-Math.floor(half);dx<=Math.floor(half);dx++){
      /* The stipe stays in front of the far gills only. */
      const i=(cy+dy)*sp.w+(cx+dx);
      if(dy>0&&sp.occ[i]===1&&Math.abs(dx)<=r0*0.75+0.5) continue;
      lumen(sp,cx+dx,cy+dy,rx<=4||(((dx+64)%3)===0&&rx>5)?RUNG[2]:RUNG[3]);
    }
  }
  const spots=[];
  for(let k=0,n=Math.round(rx/3);k<n;k++)
    spots.push([rnd.range(-0.7,0.7)*rx,rnd.range(0.25,0.85)*dome,rx>7?1.2:0.6]);
  for(let dy=1;dy<=dome;dy++){
    const u=dy/dome;
    const half=rx*Math.sqrt(Math.max(0,1-u*u));
    for(let dx=-Math.round(half);dx<=Math.round(half);dx++){
      /* Flesh darkens toward the rim, where it is thinnest over the gills'
         shadow side; the crown is the thick, bright part. */
      let s=u<0.30&&dome>3?RUNG[1]:RUNG[2];
      for(const [sx,sy,sr] of spots)
        if((dx-sx)**2+(dy-sy)**2<=sr*sr) s=rx>5?RUNG[3]:RUNG[2];
      if(Math.abs(dx)>half-1.2&&u<0.75&&rx>4) s=RUNG[1];
      /* a small cap is one rung and its crown: the floor of what reads */
      if(rx<=4) s=dy===dome&&dx===0?RUNG[3]:RUNG[2];
      lumen(sp,cx+dx,cy-dy,s);
    }
  }
}

function growAgaric(S,kind,height,rnd,tilt){
  const cfg=S.cfg;
  if(cfg.troop){
    /* A troop on one mat of mycelium: the mat joins the fruit bodies, so the
       sprite is one connected body. */
    const n=rnd.int(cfg.troop[0],cfg.troop[1]);
    const w=Math.round(height*2.6)+6, h=height+4;
    const sp=newSprite(w|1,h); sp.ax=sp.w>>1; sp.ay=h-1;
    const span=Math.round(height*0.95);
    for(let x=-span;x<=span;x++) stampDisc(sp,sp.ax+x,h-1,0.5,0,-1,1);
    for(let k=0;k<n;k++){
      const u=n>1?k/(n-1):0.5;
      const hh=Math.max(3,Math.round(height*rnd.range(0.55,1.0)));
      agaric(sp,sp.ax+Math.round(lerp(-span+2,span-2,u)+rnd.range(-1,1)),h-1,hh,
             Math.max(3,Math.round(hh*rnd.range(0.75,1.05))),rnd.range(-0.12,0.12),rnd);
    }
    return tag(sp,S,kind,0);
  }
  const capW=Math.round(height*rnd.range(cfg.cap[0],cfg.cap[1]));
  const lean=(tilt||0)*0.5;
  const w=capW+Math.round(Math.abs(lean)*height)+8, h=height+6;
  const sp=newSprite(w|1,h); sp.ax=sp.w>>1; sp.ay=h-1;
  agaric(sp,sp.ax-Math.round(lean*height*0.5),h-1,height,capW,lean,rnd);
  /* A giant fruits with its young at its foot. */
  if(height>=28&&cfg.pups){
    for(let k=0,n=rnd.int(0,cfg.pups);k<n;k++){
      const side=rnd.chance(0.5)?1:-1, hh=Math.round(height*rnd.range(0.20,0.34));
      agaric(sp,sp.ax+side*Math.round(height*rnd.range(0.10,0.20)),h-1,hh,
             Math.round(hh*rnd.range(0.8,1.0)),side*0.10,rnd);
    }
  }
  return tag(sp,S,kind,tilt);
}

/* A stalagmite: a stack of drip caps, so the profile steps and the tip is
   round. SOURCE: minimum diameter about 3 cm, set by the drop's splash (Curl
   1973); a constant drip rate gives a constant width, and the shoulders are
   where the rate changed. Width here is a legibility floor: two pixels. */
function column(sp,bx,by,height,r0,rnd){
  let shoulder=1, next=rnd.range(0.18,0.34);
  for(let k=0;k<=height;k++){
    const t=k/Math.max(1,height);
    if(t>next){ shoulder*=rnd.range(0.74,0.90); next+=rnd.range(0.16,0.30); }
    const skirt=1+0.5*Math.pow(Math.max(0,1-t*8),2);
    const r=Math.max(0.9,r0*shoulder*skirt*(t>0.86?Math.sqrt(Math.max(0.05,(1-t)/0.14)):1));
    stampDisc(sp,bx,by-k,r,1,0,0);
  }
}
function growSpeleothem(S,kind,height,rnd){
  const cfg=S.cfg;
  const r0=Math.max(1.0,height*rnd.range(cfg.girth[0],cfg.girth[1]));
  const w=Math.round(r0*8)+8, h=height+3;
  const sp=newSprite(w|1,h); sp.ax=sp.w>>1; sp.ay=h-1;
  column(sp,sp.ax,h-1,height,r0,rnd);
  for(let k=0,n=rnd.int(0,cfg.kin);k<n;k++){
    const side=k%2?-1:1, hh=Math.max(2,Math.round(height*rnd.range(0.25,0.55)));
    column(sp,sp.ax+side*Math.round(r0*rnd.range(1.3,2.0)),h-1,hh,
           Math.max(0.9,r0*rnd.range(0.50,0.75)),rnd);
  }
  /* A wet column is darkest at its foot, where it stands in its own film. */
  for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++){
    const i=y*sp.w+x;
    if(sp.occ[i]) sp.ao[i]=clamp(0.62+0.38*(sp.h-1-y)/Math.max(6,height*0.5),0,1);
  }
  return tag(sp,S,kind,0);
}

/* A crystal group. One crystal is a taper under `apex`, the half-angle of its
   termination in side view, on a shaft or on none. Angles are computed from
   the axial ratio; docs/HOLLOW.md carries the sources.
     quartz   a hexagonal prism under six faces 38.2 deg from the c-axis
              (c/a 1.100). Prisms radiate from one seed in a geode's wall,
              longest where they started first, and stand in host rock.
     calcite  dogtooth spar, the scalenohedron {21-31}: no prism, polar edges
              22.1 and 26.9 deg from the c-axis (c/a 0.8543). Points stand
              side by side in a crust (`spread`). The medium wins, named: at
              24.5 deg a 12 px point is 11 px wide and five draw one lump, so
              SPECIES.foxstone states a steeper scalenohedron.
   The faces are the form, so each takes one rung. */
function prism(sp,bx,by,ang,len,wd,tip){
  const ux=Math.sin(ang), uy=-Math.cos(ang);      // axis, up-screen at ang 0
  const vx=-uy, vy=ux;                             // across, to screen right
  const R=len+wd, shaft=tip<len;
  for(let y=Math.floor(by-R);y<=Math.ceil(by+1);y++)
  for(let x=Math.floor(bx-R);x<=Math.ceil(bx+R);x++){
    const px=x+0.5-bx, py=y+0.5-by;
    const a=px*ux+py*uy, c=px*vx+py*vy;
    if(a<-0.5||a>len) continue;
    const half=(wd/2)*Math.min(1,(len-a)/tip);
    if(Math.abs(c)>half+0.01) continue;
    /* The left face catches the eye and the right one turns away. A shaft
       shows two faces under a termination one rung brighter; a scalenohedron
       shows three, one rung apart. */
    lumen(sp,x,y,RUNG[shaft?(c<-wd*0.08?2:1)+(a>len-tip?1:0)
                           :c<-0.5?3:c<0.5?2:1]);
  }
}
function growCrystal(S,kind,height,rnd){
  const cfg=S.cfg, n=rnd.int(cfg.prisms[0],cfg.prisms[1]);
  const slope=Math.tan(cfg.apex*Math.PI/180), span=height*(cfg.spread||0);
  const w=Math.round(height*1.9+span*2)+8, h=height+5;
  const sp=newSprite(w|1,h); sp.ax=sp.w>>1; sp.ay=h-1;
  const list=[];
  for(let k=0;k<n;k++){
    const u=n>1?k/(n-1):0.5, ang=lerp(-cfg.fan,cfg.fan,u)+rnd.range(-0.10,0.10);
    const len=height*(1-0.55*Math.abs(ang)/cfg.fan)*rnd.range(0.78,1.0);
    /* a shaft's width is drawn; a bare taper's follows from its apex */
    const wd=Math.max(2,Math.round(len*(cfg.shaft?rnd.range(0.20,0.30):2*slope)));
    list.push({ang,len,wd,tip:cfg.shaft?Math.max(1.5,wd/2/slope):len,
               off:Math.round(Math.sin(ang)*height*0.16+(2*u-1)*span)});
  }
  /* shorter crystals first: the tall ones stand in front */
  list.sort((a,b)=>a.len-b.len);
  for(const p of list) prism(sp,sp.ax+p.off,h-2,p.ang,p.len,p.wd,p.tip);
  /* the host rock: a low mound the group stands in */
  const half=Math.max(2,Math.round(height*0.42));
  if(!cfg.bare) for(let dx=-half;dx<=half;dx++){
    const t=Math.sqrt(Math.max(0,1-(dx/half)**2));
    const rows=Math.max(1,Math.round(t*Math.max(1.5,height*0.10)));
    for(let k=0;k<rows;k++) stampDisc(sp,sp.ax+dx,h-1-k,0.5,0,-1,1);
  }
  return tag(sp,S,kind,0);
}

const MINERAL={agaric:growAgaric,speleothem:growSpeleothem,crystal:growCrystal};

export { MINERAL, RUNG, lumen };
