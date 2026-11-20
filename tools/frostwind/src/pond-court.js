import { clamp, lerp, smoothstep } from './math.js';
import { fbm, hashf, makeNoise } from './rng.js';

function segDist(px,py,ax,ay,bx,by){
  const vx=bx-ax, vy=by-ay, wx=px-ax, wy=py-ay;
  const q=vx*vx+vy*vy;
  const t=q<=0?0:clamp((wx*vx+wy*vy)/q,0,1);
  return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));
}

function polyDist(px,py,pts){
  let d=Infinity;
  for(let i=0;i+1<pts.length;i++)
    d=Math.min(d,segDist(px,py,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]));
  return d;
}

/* Jittered Voronoi flags. F2-F1 is small only at a joint, so the paving has
   irregular fitted stones without storing polygons or a tile map. */
function makePaving(seed,cell){
  const at=(gx,gy,k)=>hashf(gx,gy,seed^(k?0x19e37:0x72d4b));
  return (x,y)=>{
    const gx=Math.floor(x/cell), gy=Math.floor(y/cell);
    let f1=1e9, f2=1e9, id=0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const cx=gx+i, cy=gy+j;
      const sx=(cx+0.16+0.68*at(cx,cy,0))*cell;
      const sy=(cy+0.16+0.68*at(cx,cy,1))*cell;
      const d=Math.hypot(x-sx,y-sy);
      if(d<f1){ f2=f1; f1=d; id=((cx*73856093)^(cy*19349663))>>>0; }
      else if(d<f2) f2=d;
    }
    return {edge:(f2-f1)/cell,id,tone:((id>>>7)%1024)/1024};
  };
}

function candidateScore(c,env){
  const {wetness,threshold,poi}=env;
  let water=0;
  for(const [dx,dy] of [[0,0],[-32,0],[32,0],[0,-13],[0,13],[-24,-10],[24,10]]){
    const delta=Math.abs(wetness(c.pondX+dx,c.pondY+dy)-threshold);
    water+=1-smoothstep(0.04,0.28,delta);
  }
  water/=7;
  const dry=1-smoothstep(threshold-0.16,threshold+0.04,wetness(c.x,c.y));
  let clearance=1;
  for(const p of poi){
    const gap=Math.hypot(c.x-p.x,c.y-p.y)-(p.r||0)-250;
    clearance=Math.min(clearance,smoothstep(-80,100,gap));
  }
  const route=1-clamp(Math.abs(c.offset-190)/120,0,1);
  return {water,dry,clearance,route,total:water*1.35+dry*0.85+clearance*1.25+route*0.30};
}

/* Score several sites beside the world trail and select the one where the
   wetness field already wants a pond while the court stays dry. The small
   basin below guarantees a legible water body. */
function makePondCourt(seed,env){
  let best=null;
  for(let i=0;i<12;i++){
    const y=env.common.y+430+i*96+Math.round((hashf(i,3,seed^0x31a7)-0.5)*54);
    if(Math.hypot(env.pathX(y),y)>env.worldR*0.78) continue;
    const side=hashf(i,7,seed^0x7c15)<0.5?-1:1;
    const offset=155+Math.round(hashf(i,11,seed^0x4b91)*82);
    const x=Math.round(env.pathX(y)+side*offset);
    const c={x,y,side,offset,pondX:x+side*(35+Math.round(hashf(i,13,seed)*24)),
             pondY:y-92-Math.round(hashf(i,17,seed)*18),i};
    c.score=candidateScore(c,env);
    if(!best||c.score.total>best.score.total) best=c;
  }
  if(!best){
    const y=env.common.y+620, side=1, offset=185;
    best={x:Math.round(env.pathX(y)+side*offset),y,side,offset,i:0};
    best.pondX=best.x+48; best.pondY=y-98;
    best.score={water:0,dry:1,clearance:0,route:1,total:1};
  }

  const nShape=makeNoise(seed^0x12b7), nDetail=makeNoise(seed^0x7789);
  const rx=64+Math.round(hashf(best.i,19,seed)*14);
  const ry=23+Math.round(hashf(best.i,23,seed)*5);
  const c={x0:best.x-72,y0:best.y-27,x1:best.x+72,y1:best.y+38};
  const entryY=best.y+105;
  const entry=[Math.round(env.pathX(entryY)),entryY];
  const innerX=best.x-best.side*72, outerX=best.x+best.side*78;
  const route=[
    entry,
    [Math.round(lerp(entry[0],innerX,0.48)),Math.round(lerp(entryY,best.y+31,0.48))],
    [innerX,best.y+31],
    [best.x-best.side*30,best.y+20],
    [best.x+best.side*22,best.y+11],
    [outerX,best.y+21],
  ];
  const paving=makePaving(seed^0x44c3,14);
  const route2=route.map(p=>[p[0],p[1]*2]);

  const pondMetric=(x,y)=>{
    const warp=fbm(nShape,x*0.028,y*0.056,3)*0.115;
    const dx=(x-best.pondX+fbm(nShape,x*0.018+17,y*0.036,2)*6.0)/rx;
    const dy=(y-best.pondY+fbm(nShape,x*0.020,y*0.040+9,2)*2.8)/ry;
    return Math.hypot(dx,dy)+warp;
  };
  const courtSDF=(x,y)=>{
    const dx=Math.max(c.x0-x,x-c.x1), dy=Math.max(c.y0-y,y-c.y1);
    return -Math.max(dx,dy*1.65)+fbm(nShape,x*0.09,y*0.18,3)*3.2;
  };
  const routeD=(x,y)=>polyDist(x,y*2,route2)-9
    +fbm(nDetail,x*0.13,y*0.26,3)*2.0;
  const routeX=route.map(p=>p[0]),routeY=route.map(p=>p[1]);
  const influenceBounds={
    x0:Math.min(c.x0,best.pondX-rx,...routeX)-35,
    x1:Math.max(c.x1,best.pondX+rx,...routeX)+35,
    y0:Math.min(c.y0,best.pondY-ry,...routeY)-35,
    y1:Math.max(c.y1,best.pondY+ry,...routeY)+35,
  };
  const influence=(x,y)=>x>influenceBounds.x0&&x<influenceBounds.x1
    &&y>influenceBounds.y0&&y<influenceBounds.y1;
  const hydrologyAt=(x,y,base,threshold)=>{
    const dx=(x-best.x)/215,dy=(y-(best.y-35))/142;
    if(Math.abs(dx)>=1.08||Math.abs(dy)>=1.08) return base;
    const managed=1-smoothstep(0.76,1.08,Math.hypot(dx,dy));
    if(pondMetric(x,y)<1) return Math.max(base,threshold+0.02);
    return base-managed*0.34;
  };

  const pillar=(dx,dy,h,broken,variant)=>({
    kind:'pillar',x:best.x+best.side*dx,y:best.y+dy,h,broken,variant,r:8,
  });
  const wall=(dx,dy,variant)=>({
    kind:'ruinWall',x:best.x+best.side*dx,y:best.y+dy,variant,w:[38,31,36][variant],
  });
  const architecture=[
    pillar(-36,27,58,false,0), pillar(0,10,47,false,1), pillar(34,27,36,true,2),
    wall(-53,-17,0), wall(48,-17,1), wall(67,39,2), wall(-64,40,1),
  ];
  const treeCandidates=[];
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2+(hashf(i,29,seed)-0.5)*0.22;
    const x=Math.round(best.x+Math.cos(a)*(174+hashf(i,31,seed)*24));
    const y=Math.round(best.y+Math.sin(a)*(108+hashf(i,37,seed)*20));
    if(pondMetric(x,y)<1.28||courtSDF(x,y)>-12||routeD(x,y)<13) continue;
    if(Math.abs(x-env.pathX(y))<42) continue;
    treeCandidates.push({x,y,a,score:hashf(i,41,seed)+Math.abs(Math.cos(a))*0.28});
  }
  treeCandidates.sort((a,b)=>b.score-a.score);
  const frameTrees=[];
  for(const t of treeCandidates){
    if(frameTrees.some(q=>Math.hypot(q.x-t.x,q.y-t.y)<82)) continue;
    const i=frameTrees.length;
    frameTrees.push({kind:'meadowTree',x:t.x,y:t.y,tier:i===1?5:4,
                     vari:hashf(t.x,t.y,seed^0x707),flip:hashf(t.x,t.y,seed^0x606)<0.5});
    if(frameTrees.length===5) break;
  }

  return {
    kind:'pondCourt',x:best.x,y:best.y,r:285,side:best.side,score:best.score,
    pond:{cx:best.pondX,cy:best.pondY,rx,ry,bankRepose:42*Math.PI/180},
    court:c,route,routeW:9,flagCell:14,
    architecture,frameTrees,paving,pondMetric,courtSDF,routeD,influence,hydrologyAt,
    waterAt:(x,y)=>influence(x,y)&&pondMetric(x,y)<1,
    sample:(x,y)=>influence(x,y)
      ?{pond:pondMetric(x,y),court:courtSDF(x,y),route:routeD(x,y)}
      :null,
  };
}

export { makePaving, makePondCourt, polyDist, segDist };
