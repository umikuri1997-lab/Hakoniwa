import { clamp, lerp } from './math.js';
import { N_FRONT, N_SIDE, N_TOP } from './construct.js';
import { newSprite } from './sprite.js';

/* The three masonry face values, the FACE ladder of src/construct.js. Masonry
   also spends the rungs on block noise. */
const S_L=1.00, S_M=0.62, S_D=0.30;

function blockNoise(bx,by,salt){
  let h=(bx*374761393+by*668265263+salt*2246822519)|0;
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
}

function put(sp,x,y,ao,N){
  if(x<0||y<0||x>=sp.w||y>=sp.h) return;
  const i=y*sp.w+x;
  sp.occ[i]=1;
  sp.ao[i]=clamp(ao,0.04,1);
  sp.nx[i]=N.x; sp.ny[i]=N.y; sp.nz[i]=N.z;
  sp.shade[i]=ao;
  sp.rad[i]=2;
}

function finish(sp,kind){
  sp.ramp='masonry';
  sp.ramp2='canopy';
  sp.sMin=0.03; sp.sMax=1.00;
  sp.kind=kind; sp.tilt=0;
  return sp;
}

/* Base, shaft and capital proportions follow the Pond Court grammar. Only
   exposed arrises chip. */
function makePillar(rnd,opts={}){
  const h=Math.max(22,Math.round(opts.h||52));
  const shaftW=Math.max(5,Math.round(opts.shaftW||h*0.14))|1;
  const baseW=Math.max(shaftW+6,Math.round(opts.baseW||shaftW*2))|1;
  const depth=Math.max(2,Math.round((opts.depth||6)/2));
  const broken=opts.broken===undefined?rnd.chance(0.42):opts.broken;
  const capitalH=broken?0:Math.max(5,Math.round(h*0.12));
  const baseH=Math.max(7,Math.round(h*0.15));
  const margin=depth+3;
  const sp=newSprite(baseW+depth+margin*2,h+depth+2);
  sp.ax=Math.round(sp.w/2); sp.ay=sp.h-1;
  const cx=sp.ax-Math.floor(depth/2), salt=opts.salt||0;
  const widthAt=z=>{
    if(z<Math.ceil(baseH*0.42)) return baseW;
    if(z<baseH) return baseW-2;
    if(!broken&&z>=h-Math.ceil(capitalH*0.42)) return baseW-1;
    if(!broken&&z>=h-capitalH) return shaftW+4;
    const taper=Math.round(lerp(1,0,clamp((z-baseH)/Math.max(1,h-baseH),0,1)));
    return shaftW+taper*2;
  };
  const topW=broken?shaftW+1:baseW-1;
  const chips=new Uint8Array(topW);
  if(broken) for(let x=0;x<topW;x++){
    const edge=Math.min(x,topW-1-x);
    chips[x]=edge<2&&rnd.chance(0.65)?rnd.int(1,3):rnd.chance(0.14)?1:0;
  }

  for(let fy=0;fy<h;fy++){
    const z=h-1-fy,w=widthAt(z),x0=cx-Math.floor(w/2),y=depth+fy;
    const v=blockNoise(z>>3,1,salt+31);
    for(let k=1;k<=depth;k++) put(sp,x0+w-1+k,y-k,S_M*lerp(0.70,0.91,v),N_SIDE);
  }
  for(let fy=0;fy<h;fy++){
    const z=h-1-fy,w=widthAt(z),x0=cx-Math.floor(w/2),y=depth+fy;
    const course=Math.max(5,Math.round(h/8));
    const onCourse=z>baseH&&z<h-capitalH&&((z-baseH)%course===0);
    for(let x=0;x<w;x++){
      if(broken&&fy<chips[Math.min(topW-1,Math.max(0,x-Math.floor((w-topW)/2)))]) continue;
      const v=blockNoise((x+x0)>>2,z>>3,salt);
      let ao=S_M*lerp(0.84,1.08,v);
      if(onCourse&&blockNoise((x+x0)>>2,(z>>3)-1,salt)-v<0.28) ao=S_D*1.08;
      if(x===w-1) ao*=0.78;
      if(z<2) ao*=0.70;
      put(sp,x0+x,y,ao,N_FRONT);
    }
  }
  const frontX=cx-Math.floor(topW/2);
  for(let row=0;row<depth;row++){
    const shift=depth-1-row;
    for(let x=0;x<topW;x++){
      if(broken&&row<chips[x]) continue;
      const v=blockNoise(x>>2,row,salt+73);
      const edge=row===depth-1||x===0||x===topW-1;
      put(sp,frontX+x+shift,row,(edge?S_L*0.82:S_L*0.96)*lerp(0.92,1.04,v),N_TOP);
    }
  }
  for(let k=0;k<Math.max(2,Math.round(h/18));k++){
    const z=rnd.int(baseH+2,Math.max(baseH+2,h-capitalH-2));
    const fy=h-1-z,w=widthAt(z),side=rnd.chance(0.5)?-1:1;
    const x=cx+side*Math.floor(w/2),y=depth+fy;
    for(let d=0;d<rnd.int(1,2);d++){
      const px=x-(side<0?0:d), py=y+d;
      if(px>=0&&px<sp.w&&py>=0&&py<sp.h) sp.occ[py*sp.w+px]=0;
    }
  }
  return finish(sp,'pillar');
}

function makeRuinWall(opts={}){
  const w=opts.w||36, h=opts.h||8, depth=2*Math.round((opts.d||6)/2);
  const cap=depth/2, course=opts.course||4, brick=opts.brick||7, salt=opts.salt||0;
  const sp=newSprite(w,h+cap);
  sp.ax=w>>1; sp.ay=sp.h-1;
  for(let y=0;y<cap;y++)for(let x=0;x<w;x++){
    const bx=Math.floor(x/(brick+2)),v=blockNoise(bx,0,salt+91);
    put(sp,x,y,x%(brick+2)===0?S_M*0.92:S_L*lerp(0.86,1,v),N_TOP);
  }
  for(let x=0;x<w;x++) put(sp,x,cap,S_D,N_FRONT);
  for(let y=cap+1;y<sp.h;y++){
    const row=y-cap-1,cy=Math.floor(row/course),off=(cy%2)*Math.round(brick/2);
    for(let x=0;x<w;x++){
      const bx=Math.floor((x+off)/brick),v=blockNoise(bx,cy,salt);
      let ao=S_M*lerp(0.82,1.10,v);
      const onV=((x+off)%brick)===0,onH=(row%course)===0&&row>0;
      if(onV||onH){
        const other=blockNoise(onV?bx-1:bx,onV?cy:cy-1,salt);
        if(Math.abs(other-v)<0.34) ao=S_D*lerp(0.90,1.25,v);
      }
      ao*=lerp(0.62,1,clamp(((sp.h-1-y)/Math.max(1,h))*2.6,0,1));
      put(sp,x,y,ao,N_FRONT);
    }
  }
  /* Missing end stones make the ruin silhouette; load-bearing courses keep
     no holes. */
  const chips=Math.max(1,Math.round(w/18));
  for(let i=0;i<chips;i++){
    const x=i%2?sp.w-1-i:i;
    for(let y=0;y<Math.min(2+i,sp.h);y++) sp.occ[y*sp.w+x]=0;
  }
  return finish(sp,'ruinWall');
}

const PILLAR_VARIANTS=[
  {h:58,shaftW:7,baseW:15,broken:false,salt:3},
  {h:47,shaftW:7,baseW:15,broken:false,salt:17},
  {h:36,shaftW:7,baseW:13,broken:true,salt:29},
  {h:43,shaftW:7,baseW:13,broken:true,salt:37},
];
const WALL_VARIANTS=[
  {w:38,h:8,d:6,course:4,brick:7,salt:41},
  {w:31,h:7,d:6,course:3,brick:7,salt:53},
  {w:36,h:6,d:8,course:3,brick:7,salt:67},
];

export { N_FRONT, N_SIDE, N_TOP, PILLAR_VARIANTS, WALL_VARIANTS,
         blockNoise, makePillar, makeRuinWall };
