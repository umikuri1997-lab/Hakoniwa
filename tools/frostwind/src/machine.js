import { clamp, lerp } from './math.js';
import { metresToPx } from './scale.js';
import { newSprite } from './sprite.js';

/* The meadow machines (docs/MACHINES.md). The shared body is a hollow bronze
   armature around a field core, with compliant ring joints and a mantle of
   moss. One invented law: the core may change the rest curvature of contiguous
   bronze. It does not cancel mass, gravity, momentum, contact, or elastic
   response. A step still needs a planted foot and a stable centre of mass, and
   a footfall still excites a damped heavy shell.

   The visible response is the damped oscillator below. Topology and absolute
   size are authored: no external anatomy exists for a dreamed species. Rows,
   mass, support, pressure, poses, normals, moss and pixels derive. */

const DREAM_LAW = Object.freeze({
  name: 'curvature-heart',
  statement: 'A core may shift the rest curvature of contiguous bronze; ordinary mechanics governs the response.',
});

const MAT = Object.freeze({
  bronze:8,moss:2,seam:3,eye:10,helloEye:11,bloom:12,
});
const BRONZE_RHO = 8800;       // kg m^-3, representative tin bronze
const MOSS_RHO = 260;          // kg m^-3, wet bryophyte mat; informal range
const WALK_FRAMES = 8;
const IDLE_FRAMES = 4;         // settled body, four wind phases in the hanging moss
const GREET_FRAMES = 7;        // red/green/red/green/red/green/red; shape never changes

/* Profile knots are [fraction down the part, half-width / part width]:
   silhouette decisions the renderer samples at every row. */
const DOME = [[0,0.18],[0.08,0.34],[0.22,0.48],[0.58,0.50],[0.82,0.43],[1,0.22]];
const MANTLE = [[0,0.22],[0.16,0.50],[0.42,0.43],[0.78,0.30],[1,0.18]];
const BELL = [[0,0.18],[0.12,0.28],[0.55,0.40],[0.86,0.49],[1,0.42]];

/* Absolute size is authored against the traveller: the reference has no
   external metre authority. */
const MACHINE = Object.freeze({
  colossus: Object.freeze({
    key:'colossus', seed:0xc011055, heightM:5.75, canvas:1.02,
    body:{top:0.025,h:0.51,w:0.70,profile:DOME,depth:0.82},
    stance:0.155, footR:0.072, limbR:0.035, limbLength:2.23,
    limbCount:4, shellT:0.010, mossT:0.060, mossCover:0.90,
    comY:0.64, stiffness:72000, damping:0.34, shakePx:1, sway:0.70, sink:1,
    moss:{cover:0.96,depth:0.16,fringe:0.17,rate:0.44,root:0.55,bottom:0.62,wind:1.15,rampMax:0.50},
    flower:{side:1,t:0.12,stem:0.055,petals:3},
    core:{x:0.16,y:0.31,r:2},
    frames:{walk:WALK_FRAMES,idle:IDLE_FRAMES,greet:GREET_FRAMES},
    frameRate:3.2, idleRate:1.15,
    habitat:{biome:'meadow',path:44,poi:34,slope:0.18,shore:0.10},
    behavior:{count:1,speed:7,turnRate:0.42,goalNear:100,goalFar:250,arrive:12,
      restFor:[9,22],dashFor:[16,34],wary:0,fleeFor:0,faceLock:0.24},
  }),
  strider: Object.freeze({
    key:'strider', seed:0x57a1de2, heightM:4.18, canvas:0.82,
    body:{top:0.18,h:0.25,w:0.48,profile:MANTLE,depth:0.66},
    stance:0.115, footR:0.052, limbR:0.026, limbLength:2.12,
    limbCount:4, shellT:0.008, mossT:0.050, mossCover:0.82,
    comY:0.54, stiffness:39000, damping:0.27, shakePx:1, sway:0.72, sink:1,
    moss:{cover:0.90,depth:0.13,fringe:0.16,rate:0.40,root:0.55,bottom:0.54,wind:1.25,rampMax:0.48},
    core:{x:0,y:0.18,r:1},
    frames:{walk:WALK_FRAMES,idle:IDLE_FRAMES,greet:GREET_FRAMES},
    frameRate:4.0, idleRate:1.20,
    habitat:{biome:'meadow',path:38,poi:30,slope:0.22,shore:0.08},
    behavior:{count:1,speed:10,turnRate:0.58,goalNear:110,goalFar:280,arrive:10,
      restFor:[7,18],dashFor:[18,38],wary:0,fleeFor:0,faceLock:0.24},
  }),
  pilgrim: Object.freeze({
    key:'pilgrim', seed:0x91c61a, heightM:4.31, canvas:0.84,
    body:{top:0.27,h:0.53,w:0.52,profile:BELL,depth:0.78},
    stance:0.105, footR:0.060, limbR:0.025, limbLength:1.16,
    limbCount:4, shellT:0.009, mossT:0.065, mossCover:0.88,
    comY:0.49, stiffness:46000, damping:0.38, shakePx:0, sway:0.62, sink:0,
    moss:{cover:0.95,depth:0.18,fringe:0.22,rate:0.84,root:0.10,bottom:0.82,wind:1.45,rampMax:0.46},
    core:{x:0,y:0.48,r:1},
    frames:{walk:WALK_FRAMES,idle:IDLE_FRAMES,greet:GREET_FRAMES},
    frameRate:3.0, idleRate:1.10,
    habitat:{biome:'meadow',path:40,poi:32,slope:0.16,shore:0.12},
    behavior:{count:1,speed:6,turnRate:0.36,goalNear:80,goalFar:220,arrive:11,
      restFor:[11,26],dashFor:[15,30],wary:0,fleeFor:0,faceLock:0.24},
  }),
});

function machineModel(nameOrRow){
  const row=typeof nameOrRow==='string'?MACHINE[nameOrRow]:nameOrRow;
  if(!row) throw new Error(`unknown meadow machine '${nameOrRow}'`);
  const hPx=metresToPx(row.heightM);
  const bodyH=row.heightM*row.body.h, bodyW=row.heightM*row.body.w;
  /* A closed ellipsoidal shell is approximated by πwh. Pipes are hollow
     cylinders: both consume surface area × wall thickness. */
  const shellArea=Math.PI*bodyW*bodyH*0.86;
  const pipeArea=row.limbCount*Math.PI*(row.limbR*2*row.heightM)*row.limbLength;
  const bronzeVolume=(shellArea+pipeArea)*row.shellT;
  const mossVolume=bodyW*bodyH*row.mossT*row.mossCover;
  const bronzeKg=bronzeVolume*BRONZE_RHO;
  const mossKg=mossVolume*MOSS_RHO;
  const massKg=bronzeKg+mossKg;
  const omega=Math.sqrt(row.stiffness/massKg);
  const naturalHz=omega/(Math.PI*2);
  const footArea=Math.PI*Math.pow(row.footR*row.heightM,2)*2;
  const pressureKPa=massKg*9.80665/footArea/1000;
  return {row,hPx,massKg,bronzeKg,mossKg,omega,naturalHz,pressureKPa,
    canvasW:(Math.max(13,Math.round(hPx*row.canvas))|1)};
}

function springResponse(model,t){
  if(t<0) return 0;
  const z=model.row.damping, w=model.omega;
  const wd=w*Math.sqrt(Math.max(0.01,1-z*z));
  return Math.exp(-z*w*t)*Math.sin(wd*t);
}

/* One footfall every four frames. Response starts on the sample after impact,
   so the contact pose carries weight and the shell answers a beat later. */
function dampedOffset(nameOrRow,frame,lag=0){
  const model=machineModel(nameOrRow), row=model.row;
  const f=((frame-lag)%WALK_FRAMES+WALK_FRAMES)%WALK_FRAMES;
  const age=((f-1)%4+4)%4;
  if(age===0) return 0;
  const raw=springResponse(model,age/row.frameRate);
  return clamp(Math.round(raw*row.shakePx*2.2),-row.shakePx,row.shakePx);
}

const LEFT_LIFT =[0,0,2,1,0,0,0,0];
const RIGHT_LIFT=[0,0,0,0,0,0,2,1];
/* Body leans onto the planted foot; a stronger shift reads as walking
   sideways in profile without leaving the support polygon. */
const BODY_SHIFT=[0,1.35,1.35,1.15,0,-1.35,-1.35,-1.15];
const STEP_NEAR =[-1,-3,-2,0,1,3,2,0];
const STEP_FAR  =[1,3,2,0,-1,-3,-2,0];
const IDLE_WIND=[0,1,0,-1];
const WALK_WIND=[0,0.7,1,0.6,0,-0.7,-1,-0.6];

function machinePose(nameOrRow,frame=0,dir=0,state='walk'){
  const model=machineModel(nameOrRow), row=model.row, h=model.hPx;
  if(state==='idle'||state==='greet'){
    const count=state==='greet'?GREET_FRAMES:IDLE_FRAMES;
    const f=((frame%count)+count)%count;
    return {frame:f,state,bodyX:0,sink:0,shake:0,mossLag:0,
      wind:IDLE_WIND[f%IDLE_FRAMES]*row.moss.wind,
      leftLift:0,rightLift:0,leftStep:0,rightStep:0,
      feet:[-row.stance*h,row.stance*h],contacts:[-row.stance*h,row.stance*h],
      comX:0,supportMargin:row.stance*h+row.footR*h};
  }
  const f=((frame%WALK_FRAMES)+WALK_FRAMES)%WALK_FRAMES;
  const leftLift=LEFT_LIFT[f], rightLift=RIGHT_LIFT[f];
  const bodyX=BODY_SHIFT[f]*row.sway*row.stance*h;
  const feet=[-row.stance*h,row.stance*h];
  const contacts=[];
  if(!leftLift) contacts.push(feet[0]);
  if(!rightLift) contacts.push(feet[1]);
  const lo=Math.min(...contacts), hi=Math.max(...contacts);
  const comX=bodyX;
  const supportMargin=contacts.length===1
    ? row.footR*h-Math.abs(comX-contacts[0])
    : Math.min(comX-lo+row.footR*h,hi-comX+row.footR*h);
  return {frame:f,state,bodyX,sink:(f===1||f===5)?row.sink:0,
    shake:dampedOffset(row,f,0),mossLag:dampedOffset(row,f,1),
    wind:WALK_WIND[f]*row.moss.wind+dampedOffset(row,f,1)*0.18,
    leftLift,rightLift,leftStep:dir===2?STEP_NEAR[f]:0,
    rightStep:dir===2?STEP_FAR[f]:0,feet,contacts,comX,supportMargin};
}

const profileAt=(P,t)=>{
  if(t<=P[0][0]) return P[0][1];
  for(let i=1;i<P.length;i++) if(t<=P[i][0]){
    const a=P[i-1],b=P[i];
    return lerp(a[1],b[1],(t-a[0])/(b[0]-a[0]));
  }
  return P[P.length-1][1];
};

function put(sp,x,y,mat,ao=0.92,nx=0,ny=-0.1,shade=0.65){
  x=Math.round(x); y=Math.round(y);
  if(x<0||y<0||x>=sp.w||y>=sp.h) return;
  const i=y*sp.w+x;
  /* An eye is never painted over; otherwise a later structural pass wins. */
  if((sp.occ[i]===MAT.eye||sp.occ[i]===MAT.helloEye)&&
     mat!==MAT.eye&&mat!==MAT.helloEye) return;
  const l=Math.hypot(nx,ny);
  if(l>0.96){ nx*=0.96/l; ny*=0.96/l; }
  sp.occ[i]=mat; sp.ao[i]=clamp(ao,0,1); sp.shade[i]=clamp(shade,0,1);
  sp.nx[i]=nx; sp.ny[i]=ny; sp.nz[i]=Math.sqrt(Math.max(0.04,1-nx*nx-ny*ny));
  sp.rad[i]=Math.max(sp.rad[i],mat===MAT.bronze?2:1);
}

function disc(sp,cx,cy,r,mat=MAT.bronze,ao=0.92){
  const rr=Math.max(0.72,r), x0=Math.floor(cx-rr),x1=Math.ceil(cx+rr);
  const y0=Math.floor(cy-rr),y1=Math.ceil(cy+rr);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const dx=x+0.5-cx,dy=y+0.5-cy;
    if(dx*dx+dy*dy>rr*rr) continue;
    const nx=clamp(dx/rr,-0.86,0.86), ny=clamp(dy/rr,-0.55,0.55);
    put(sp,x,y,mat,ao,nx,ny,0.42+0.46*(1-Math.abs(nx)));
  }
}

function beam(sp,a,b,r,segments=4){
  const dx=b.x-a.x,dy=b.y-a.y,n=Math.max(2,Math.ceil(Math.hypot(dx,dy)*1.5));
  for(let i=0;i<=n;i++){
    const t=i/n;
    disc(sp,lerp(a.x,b.x,t),lerp(a.y,b.y,t),r,MAT.bronze,0.92);
  }
  /* Segment rings are load-path joints, spaced by member length and declared
     count. */
  for(let s=1;s<segments;s++){
    const t=s/segments;
    disc(sp,lerp(a.x,b.x,t),lerp(a.y,b.y,t),Math.max(0.72,r*0.72),MAT.seam,0.70);
  }
}

function fillProfile(sp,cx,top,height,width,P,mat=MAT.bronze,depth=1){
  const H=Math.max(2,Math.round(height)), W=Math.max(3,width);
  for(let j=0;j<H;j++){
    const t=j/Math.max(1,H-1), hw=Math.max(1,profileAt(P,t)*W*depth);
    const y=Math.round(top+j), x0=Math.ceil(cx-hw),x1=Math.floor(cx+hw);
    for(let x=x0;x<=x1;x++){
      const nx=clamp((x-cx)/Math.max(1,hw),-0.88,0.88);
      const ny=clamp((t-0.5)*0.72,-0.52,0.52);
      put(sp,x,y,mat,0.94,nx,ny,0.40+0.48*(1-Math.abs(nx)));
    }
  }
}

function noMoss(sp,x,y,r=1){
  for(let yy=Math.floor(y-r);yy<=Math.ceil(y+r);yy++)for(let xx=Math.floor(x-r);xx<=Math.ceil(x+r);xx++)
    if(xx>=0&&yy>=0&&xx<sp.w&&yy<sp.h) sp.noSnow[yy*sp.w+xx]=1;
}

function hash2(x,y,s){
  let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,2246822519);
  h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16;
  return (h>>>0)/4294967296;
}

function mossPass(sp,row,pose,originX,originY){
  const seed=row.seed^0x6d055,n=sp.w*sp.h;
  const maxY=Math.min(sp.h-3,Math.round(row.moss.bottom*sp.h));
  const reach=Math.max(5,Math.round(sp.h*0.28));
  const rays=[[-1,-0.8],[-0.5,-1],[0,-1],[0.5,-1],[1,-0.8]];
  const D=new Int16Array(n); D.fill(0x3fff);
  const Q=new Int32Array(n); let q0=0,q1=0;

  /* The moss is a pelt (Greenwake). A fan of upward rays finds the exposed
     shell, then a distance transform carries it inward. The upper exterior is
     one dark mass; randomness only perturbs its boundary by one row. */
  for(let y=0;y<=maxY;y++)for(let x=0;x<sp.w;x++){
    const i=y*sp.w+x;
    if(sp.occ[i]!==MAT.bronze||sp.noSnow[i]) continue;
    let clear=0;
    for(const [dx,dy] of rays){
      let open=true;
      for(let s=1;s<=reach;s++){
        const xx=Math.round(x+dx*s),yy=Math.round(y+dy*s);
        if(xx<0||xx>=sp.w||yy<0) break;
        if(sp.occ[yy*sp.w+xx]){ open=false; break; }
      }
      if(open) clear++;
    }
    const sky=clear/rays.length;
    const upward=clamp(-sp.ny[i]*1.25+0.28,0,1);
    const high=clamp((maxY-y)/Math.max(1,maxY),0,1);
    if(sky>=0.40&&(upward+high*0.55)>0.42){
      D[i]=0; Q[q1++]=i;
    }
  }
  while(q0<q1){
    const i=Q[q0++],x=i%sp.w,y=(i/sp.w)|0,d=D[i]+1;
    for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      if(xx<0||xx>=sp.w||yy<0||yy>maxY) continue;
      const j=yy*sp.w+xx;
      if(sp.occ[j]!==MAT.bronze||sp.noSnow[j]||D[j]<=d) continue;
      D[j]=d; Q[q1++]=j;
    }
  }

  const depthPx=Math.max(3,Math.round(sp.h*row.moss.depth));
  for(let y=0;y<=maxY;y++)for(let x=0;x<sp.w;x++){
    const i=y*sp.w+x;
    if(sp.occ[i]!==MAT.bronze||sp.noSnow[i]||D[i]===0x3fff) continue;
    const high=clamp((maxY-y)/Math.max(1,maxY),0,1);
    const upward=clamp(-sp.ny[i]*1.2+0.30,0,1);
    const localX=Math.round(x-originX),localY=Math.round(y-originY-pose.shake);
    const edge=hash2(localX,localY,seed)-0.5;
    const pelt=depthPx*row.moss.cover*(0.58+0.28*high+0.22*upward)
      +sp.h*0.18*high*high+edge*1.2;
    if(D[i]>pelt) continue;
    sp.occ[i]=MAT.moss;
    sp.ao[i]=0.80+0.15*clamp(1-D[i]/Math.max(1,pelt),0,1);
    sp.shade[i]=0.18+0.34*high;
    sp.ny[i]=Math.min(sp.ny[i],-0.26);
    sp.nz[i]=Math.sqrt(Math.max(0.04,1-sp.nx[i]*sp.nx[i]-sp.ny[i]*sp.ny[i]));
  }

  /* Strands hang from the mantle's lower envelope, never from a shin. Their
     seeded crookedness is static; `pose.wind` bends the lower half over four
     idle phases while the body stays still. */
  const hem=Math.min(maxY+2,Math.round(originY+row.body.h*sp.h)+2);
  const mantle=sp.occ.slice();
  let eligibleFringe=0,fringePixels=0;
  for(let x=1;x<sp.w-1;x++){
    let hasMoss=false,bottom=-1;
    for(let y=0;y<=hem;y++){
      const m=mantle[y*sp.w+x];
      if(m===MAT.moss) hasMoss=true;
      if(hasMoss&&m) bottom=y;
    }
    if(!hasMoss||bottom<originY+row.body.h*sp.h*row.moss.root) continue;
    eligibleFringe++;
    const localX=x-Math.round(originX);
    const pick=hash2(localX,0,seed^0x55);
    if(pick>row.moss.rate) continue;
    /* The lower envelope. A cape column may hold a ring or short leg below
       its last moss pixel; the strand starts after that solid run. */
    let root=bottom,rootX=x;
    if(root<sp.h-2&&(mantle[(root+1)*sp.w+x]||sp.noSnow[(root+1)*sp.w+x])){
      const out=x+(x<originX?-1:1);
      const oi=(root+1)*sp.w+out;
      if(out>0&&out<sp.w-1&&!mantle[oi]&&!sp.noSnow[oi]) rootX=out;
      else while(root<sp.h-2&&(mantle[(root+1)*sp.w+x]||sp.noSnow[(root+1)*sp.w+x])) root++;
    }
    if(root>=sp.h-2||root>hem+2) continue;
    const len=Math.max(4,Math.round(sp.h*row.moss.fringe*(0.68+0.48*hash2(localX,1,seed))));
    const bias=hash2(localX,2,seed)<0.28?(hash2(localX,3,seed)<0.5?-1:1):0;
    for(let d=1;d<=len;d++){
      const t=d/len;
      const wind=Math.round(pose.wind*Math.pow(t,1.65));
      const crooked=d>len*0.55&&d%2?bias:0;
      const xx=rootX+wind+crooked,yy=root+d;
      if(xx<1||xx>=sp.w-1||yy>=sp.h-1) break;
      const i=yy*sp.w+xx;
      if(mantle[i]||sp.noSnow[i]) break;
      if(sp.occ[i]===MAT.moss) continue;
      put(sp,xx,yy,MAT.moss,0.68,0.08,-0.20,0.18+0.18*(1-t));
      fringePixels++;
    }
  }
  /* A broad cape can close every column below the sampled pelt. The veil then
     attaches to the body's measured hem: the lower-envelope rule at a hard
     edge. */
  if(fringePixels===0){
    const root=Math.min(hem,Math.round(originY+row.body.h*sp.h)-1);
    for(let x=1;x<sp.w-1;x++){
      let hasMoss=false;
      for(let y=Math.max(0,Math.round(originY));y<=root;y++){
        if(mantle[y*sp.w+x]===MAT.moss){ hasMoss=true; break; }
      }
      if(!hasMoss||!mantle[root*sp.w+x]) continue;
      const localX=x-Math.round(originX);
      if(hash2(localX,0,seed^0x55)>row.moss.rate) continue;
      const len=Math.max(4,Math.round(sp.h*row.moss.fringe*(0.68+0.48*hash2(localX,1,seed))));
      const bias=hash2(localX,2,seed)<0.28?(hash2(localX,3,seed)<0.5?-1:1):0;
      let rootX=x;
      if(mantle[(root+1)*sp.w+rootX]) rootX+=x<originX?-1:1;
      for(let d=1;d<=len;d++){
        const t=d/len;
        const xx=rootX+Math.round(pose.wind*Math.pow(t,1.65))
          +(d>len*0.55&&d%2?bias:0);
        const yy=root+d,i=yy*sp.w+xx;
        if(xx<1||xx>=sp.w-1||yy>=sp.h-1||mantle[i]||sp.noSnow[i]) break;
        if(sp.occ[i]===MAT.moss) continue;
        put(sp,xx,yy,MAT.moss,0.68,0.08,-0.20,0.18+0.18*(1-t));
        fringePixels++;
      }
    }
  }
  for(const [a,{x,y}] of (sp.mossAnchors||[]).entries()){
    const rootX=Math.round(x),rootY=Math.round(y);
    put(sp,rootX,rootY,MAT.moss,0.72,0,-0.28,0.24);
    const len=Math.max(6,Math.round(sp.h*row.moss.fringe*(0.78+0.10*a)));
    const bias=a%2?-1:1;
    for(let d=1;d<=len;d++){
      const t=d/len;
      const xx=rootX+Math.round(pose.wind*Math.pow(t,1.55))
        +(d>len*0.62&&d%3===0?bias:0);
      const yy=rootY+d,i=yy*sp.w+xx;
      if(xx<1||xx>=sp.w-1||yy>=sp.h-1||sp.noSnow[i]) break;
      if(mantle[i]) break;
      if(sp.occ[i]===MAT.moss) continue;
      put(sp,xx,yy,MAT.moss,0.66,0.08,-0.20,0.16+0.20*(1-t));
      fringePixels++;
    }
  }
  sp.mossFringe={eligible:eligibleFringe,pixels:fringePixels};
}

function drawFeetAndLegs(sp,row,pose,dir,cx,ground,hips){
  const rr=Math.max(0.8,row.limbR*sp.h);
  const footR=Math.max(1,row.footR*sp.h*0.62);
  const depth=dir===2?0.56:1;
  const feet=[
    {x:cx+pose.feet[0]*depth+pose.leftStep,y:ground-pose.leftLift},
    {x:cx+pose.feet[1]*depth+pose.rightStep,y:ground-pose.rightLift},
  ];
  for(let i=0;i<2;i++){
    const hip=hips[i],foot=feet[i];
    const side=i?1:-1;
    const knee={x:lerp(hip.x,foot.x,0.50)+side*(dir===2?2:1),
                y:lerp(hip.y,foot.y,0.52)};
    beam(sp,hip,knee,rr,3); beam(sp,knee,foot,rr,3);
    disc(sp,foot.x,foot.y,footR,MAT.bronze,0.80);
    noMoss(sp,foot.x,foot.y,footR+1);
  }
  return feet;
}

function drawColossus(sp,row,pose,dir,cx,ground){
  const h=sp.h, depth=dir===2?row.body.depth:1;
  const top=Math.round(h*row.body.top)+pose.sink+pose.shake;
  const bh=Math.round(h*row.body.h),bw=h*row.body.w;
  const bx=cx+pose.bodyX*(dir===2?0.45:1);
  const hipY=top+bh-3,hips=[
    {x:bx-row.stance*h*depth,y:hipY},{x:bx+row.stance*h*depth,y:hipY},
  ];
  drawFeetAndLegs(sp,row,pose,dir,cx,ground,hips);
  const armR=Math.max(1,row.limbR*h*0.92);
  for(const side of [-1,1]){
    const sh={x:bx+side*bw*0.40*depth,y:top+bh*0.48};
    const el={x:bx+side*bw*0.46*depth,y:top+bh*0.78};
    const hand={x:bx+side*bw*0.44*depth,y:ground-h*0.10+pose.mossLag};
    beam(sp,sh,el,armR,4); beam(sp,el,hand,armR,4);
    for(const claw of [-1,0,1]) beam(sp,hand,{x:hand.x+claw*2,y:hand.y+3},0.72,1);
  }
  fillProfile(sp,bx,top,bh,bw,row.body.profile,MAT.bronze,depth);
  return {x:bx,y:top};
}

function drawStrider(sp,row,pose,dir,cx,ground){
  const h=sp.h,depth=dir===2?row.body.depth:1;
  const top=Math.round(h*row.body.top)+pose.sink+pose.shake;
  const bh=Math.round(h*row.body.h),bw=h*row.body.w,bx=cx+pose.bodyX*(dir===2?0.4:1);
  const hips=[{x:bx-row.stance*h*depth,y:top+bh-1},{x:bx+row.stance*h*depth,y:top+bh-1}];
  drawFeetAndLegs(sp,row,pose,dir,cx,ground,hips);
  const rr=Math.max(0.8,row.limbR*h);
  for(const side of [-1,1]){
    const sh={x:bx+side*bw*0.38*depth,y:top+bh*0.38};
    const hand={x:bx+side*bw*0.38*depth,y:ground-h*0.08+pose.mossLag};
    beam(sp,sh,{x:hand.x+side*1,y:lerp(sh.y,hand.y,0.52)},rr,4);
    beam(sp,{x:hand.x+side*1,y:lerp(sh.y,hand.y,0.52)},hand,rr,4);
  }
  beam(sp,{x:bx,y:top+bh},{x:bx,y:top-3},rr*1.05,3);
  fillProfile(sp,bx,top,bh,bw,row.body.profile,MAT.bronze,depth);
  /* The balancing forks are one mechanism, mirrored. */
  const crownY=top-3;
  for(const side of [-1,1]){
    beam(sp,{x:bx+side,y:crownY},{x:bx+side*bw*0.22*depth,y:crownY-4},0.72,1);
    beam(sp,{x:bx+side*bw*0.22*depth,y:crownY-4},
            {x:bx+side*bw*0.30*depth,y:crownY-7},0.72,1);
  }
  return {x:bx,y:top};
}

function drawPilgrim(sp,row,pose,dir,cx,ground){
  const h=sp.h,depth=dir===2?row.body.depth:1;
  const top=Math.round(h*row.body.top)+pose.sink+pose.shake;
  const bh=Math.round(h*row.body.h),bw=h*row.body.w,bx=cx+pose.bodyX*(dir===2?0.45:1);
  const hipY=top+bh-2,hips=[
    {x:bx-row.stance*h*depth,y:hipY},{x:bx+row.stance*h*depth,y:hipY},
  ];
  drawFeetAndLegs(sp,row,pose,dir,cx,ground,hips);
  fillProfile(sp,bx,top,bh,bw,row.body.profile,MAT.bronze,depth);
  /* A round balancing disc is the hat: width from the body, shallow depth
     from cabinet projection. */
  const brimY=Math.round(h*0.14)+pose.sink+pose.shake;
  const brimW=bw*0.42*depth;
  const brimR=Math.max(1,h*0.035);
  beam(sp,{x:bx-brimW,y:brimY},{x:bx+brimW,y:brimY},brimR,5);
  sp.mossAnchors=[-0.88,-0.58,0.58,0.88]
    .map(t=>({x:bx+brimW*t,y:brimY+brimR}));
  beam(sp,{x:bx,y:brimY+2},{x:bx,y:top+2},Math.max(0.8,h*0.026),3);
  const armR=Math.max(0.8,row.limbR*h*0.85);
  for(const side of [-1,1]){
    const sh={x:bx+side*bw*0.42*depth,y:top+bh*0.30};
    const hand={x:bx+side*bw*0.43*depth,y:top+bh*0.80+pose.mossLag};
    beam(sp,sh,hand,armR,3);
  }
  return {x:bx,y:Math.min(top,brimY-2)};
}

function flowerPass(sp,row,pose,dir,origin){
  const F=row.flower;
  if(!F) return;
  const h=sp.h,depth=dir===2?row.body.depth:1;
  /* The side belongs to the body, so the back view mirrors it. The root is a
     fraction of the measured dome profile. */
  const side=dir===1?-F.side:F.side,t=F.t;
  const edge=h*row.body.w*profileAt(row.body.profile,t)*depth;
  const rootX=origin.x+side*edge*0.92;
  const rootY=origin.y+Math.round(h*row.body.h*t);
  const stem=Math.max(3,Math.round(h*F.stem));
  const tipX=rootX+side+Math.round(pose.wind*0.45);
  const tipY=rootY-stem;
  for(let d=0;d<=stem;d++){
    const q=d/stem;
    put(sp,lerp(rootX,tipX,q),lerp(rootY,tipY,q),MAT.moss,0.82,0,-0.34,0.34);
  }
  const orbit=1.05,petalR=0.74;
  disc(sp,tipX,tipY,0.72,MAT.bloom,1);
  for(let p=0;p<F.petals;p++){
    const a=-Math.PI/2+p*Math.PI*2/F.petals;
    disc(sp,tipX+Math.cos(a)*orbit,tipY+Math.sin(a)*orbit,petalR,MAT.bloom,1);
  }
  sp.flower={rootX:Math.round(rootX),rootY:Math.round(rootY),
    x:Math.round(tipX),y:Math.round(tipY),side};
}

function eyePass(sp,row,pose,dir,ex,ey){
  if(dir===1)return;
  const green=pose.state==='greet'&&(pose.frame===1||pose.frame===3||pose.frame===5);
  const mat=green?MAT.helloEye:MAT.eye;
  disc(sp,ex,ey,row.core.r,mat,1);
  disc(sp,ex,ey,Math.max(0.72,row.core.r*0.42),mat,1);
}

function makeMachine(name,rnd,frame=0,dir=0,state='walk'){
  const model=machineModel(name),row=model.row,h=model.hPx,w=model.canvasW;
  const sp=newSprite(w,h);
  sp.ax=w>>1; sp.ay=h-1; sp.ramp='masonry'; sp.ramp2='canopy';
  sp.dMin=0.00; sp.dMax=row.moss.rampMax; sp.vol=0; sp.sMin=0.04; sp.sMax=0.98;
  sp.kind=name; sp.tilt=0;
  const pose=machinePose(row,frame,dir,state),cx=w>>1,ground=h-1;
  const origin=name==='colossus'?drawColossus(sp,row,pose,dir,cx,ground)
               :name==='strider'?drawStrider(sp,row,pose,dir,cx,ground)
               :drawPilgrim(sp,row,pose,dir,cx,ground);
  const ex=origin.x+(dir===2?Math.abs(row.core.x)*h:row.core.x*h);
  const ey=Math.round(row.core.y*h)+pose.sink+pose.shake;
  if(dir!==1) noMoss(sp,ex,ey,row.core.r+1);
  mossPass(sp,row,pose,origin.x,origin.y);
  flowerPass(sp,row,pose,dir,origin);
  /* The eye is last and owns its aperture. Away-facing sprites carry no eye. */
  eyePass(sp,row,pose,dir,ex,ey);
  return sp;
}

export {
  BRONZE_RHO, DREAM_LAW, GREET_FRAMES, IDLE_FRAMES, MACHINE, MAT, MOSS_RHO,
  WALK_FRAMES,
  dampedOffset, machineModel, machinePose, makeMachine, springResponse,
};
