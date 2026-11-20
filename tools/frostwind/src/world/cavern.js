import { clamp } from '../math.js';
import { fbm, hashf, makeNoise } from '../rng.js';
import { PX_PER_M } from '../scale.js';

/* The cavern: where the rock is. A plan that states `cavern` is a set of
   rooms cut in one mass of limestone, and everything else in the world is
   solid. docs/HOLLOW.md owns the sources.

   The plan is authored, as a town plan is: a hall at the common, a ring
   gallery round it, a chamber on each side, and passages that cut the mass
   between hall and ring into four blocks. SOURCE for the forms: a phreatic
   maze (rooms joined by passages along joints) and a ring of collapse
   chambers; Palmer, Cave Geology, 2007.

   `openAt` is a signed distance, in world pixels, positive in a room. The
   depth axis is compressed by ASPECT so a round room is the wide ellipse a
   round room draws as. PROJECTION.md gives 2; 1.7 is authored, and keeps the
   rooms from reading as slots. */
const ASPECT=1.7;
/* A wall stands this high on screen: 2.4 m. A body cannot stand behind it and
   be seen, so the rows a wall covers are solid too (coveredAt). */
const WALL_PX=Math.round(2.4*PX_PER_M);

function makeCavern(w){
  const {
    COMMON, PLAN, pathX, seed,
  }=w;
  const C=PLAN.cavern;
  /* a world with no cavern: no rock, nothing covered, no stated pool */
  if(!C){
    const CAVERN=null, openAt=null, coveredAt=()=>false, cavePoolAt=()=>0, caveSet=[];
    return {CAVERN, openAt, coveredAt, cavePoolAt, caveSet};
  }
  const nR=makeNoise(seed^0x2c4f);
  const cx=COMMON.x, cy=COMMON.y;
  /* rooms and pools are stated from the common, in metric pixels */
  const rooms=C.rooms.map(r=>({...r,x:cx+r.dx,y:cy+r.dy/ASPECT}));
  /* a portal stands in a room of its own, on the trail */
  for(const p of PLAN.portals||[])
    rooms.push({x:pathX(p.portalY),y:p.portalY,r:C.portalRoom});
  const pools=C.pools.map(p=>({...p,x:cx+p.dx,y:cy+p.dy/ASPECT}));
  const openAt=(wx,wy)=>{
    const dx=wx-cx, dy=(wy-cy)*ASPECT, r=Math.hypot(dx,dy);
    let d=C.hall-r;
    d=Math.max(d,C.ring.half-Math.abs(r-C.ring.r));
    for(const q of rooms)
      d=Math.max(d,q.r-Math.hypot(wx-q.x,(wy-q.y)*ASPECT));
    /* the trail's passage, north to south through everything */
    const out=C.ring.r+C.ring.half-r;
    d=Math.max(d,Math.min(C.passage-Math.abs(wx-pathX(wy)),out));
    /* the cross passage, east to west */
    const sway=fbm(nR,wx*0.004+31,7.5,2)*60;
    d=Math.max(d,Math.min(C.passage-Math.abs(dy-sway),C.reach-Math.abs(dx)));
    /* the wall wanders at two scales: a bay every few metres, a notch every
       one */
    return d+fbm(nR,wx*0.011,wy*0.011*ASPECT,3)*C.wander
            +fbm(nR,wx*0.045+90,wy*0.045*ASPECT+40,2)*C.wander*0.35;
  };
  /* Rock, or the rows a wall to the south hides. Sampled every four rows: no
     wall is thinner. */
  const coveredAt=(wx,wy)=>{
    for(let k=0;k<=WALL_PX;k+=4) if(openAt(wx,wy+k)<0) return true;
    return openAt(wx,wy+WALL_PX)<0;
  };
  /* Authored pools: the meadow's cosine bowl, one per row. */
  const cavePoolAt=(wx,wy)=>{
    let best=0;
    for(const p of pools){
      const q=Math.hypot((wx-p.x)/p.rx,(wy-p.y)/(p.rx*0.5));
      if(q<1) best=Math.max(best,0.5+0.5*Math.cos(Math.PI*clamp(q,0,1)));
    }
    return best;
  };
  /* Set pieces: the bodies the plan states one by one, so a room has a
     middle. A `heart` is the one great crystal with its lesser ones round its
     foot; a `field` a jittered lattice inside an ellipse; a `ring` n bodies
     on a ground circle. The trail keeps its gap through all three. */
  const caveSet=[];
  C.sets.forEach((s,si)=>{
    const sx=cx+s.dx, sy=cy+s.dy/ASPECT;
    const h=(k,salt)=>hashf(si*97+k,salt,seed^0x5e75);
    const stand=(mx,my,k,gap)=>{
      const x=Math.round(sx+mx), y=Math.round(sy+my/ASPECT);
      if(Math.abs(x-pathX(y))>=gap)
        caveSet.push({kind:s.kind,tier:s.tiers[Math.floor(h(k,3)*s.tiers.length)],
          x,y,r:s.solid||0,clear:s.clear||10});
    };
    if(s.form==='heart'){
      caveSet.push({kind:'heartstone',tier:s.tier,x:sx,y:sy,r:9,clear:s.clear});
      for(let k=0;k<s.kin;k++){
        const a=(k+0.5)/s.kin*Math.PI*2+h(k,1)*0.5, d=s.skirt*(0.75+0.5*h(k,2));
        caveSet.push({kind:'amethyst',tier:2+Math.floor(h(k,3)*2),
          x:Math.round(sx+Math.cos(a)*d),y:Math.round(sy+Math.sin(a)*d/ASPECT),r:3,clear:12});
      }
    }else if(s.form==='field'){
      const nx=Math.ceil(s.rx/s.pitch), ny=Math.ceil(s.ry/s.pitch);
      for(let j=-ny;j<=ny;j++)for(let i=-nx;i<=nx;i++){
        const k=(j+64)*128+(i+64);
        const mx=(i+(h(k,1)-0.5)*0.8)*s.pitch, my=(j+(h(k,2)-0.5)*0.8)*s.pitch;
        if((mx/s.rx)**2+(my/s.ry)**2<=1) stand(mx,my,k,24);
      }
    }else for(let k=0;k<s.n;k++){
      const a=(k+0.5)/s.n*Math.PI*2+(h(k,1)-0.5)*0.16, d=s.r*(0.96+0.08*h(k,2));
      stand(Math.cos(a)*d,Math.sin(a)*d,k,s.gap);
    }
  });
  const CAVERN={rooms,pools,cx,cy};
  return {CAVERN, openAt, coveredAt, cavePoolAt, caveSet};
}

export { ASPECT, WALL_PX, makeCavern };
