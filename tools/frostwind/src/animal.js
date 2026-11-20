import { clamp } from './math.js';
import { newSprite } from './sprite.js';

/* Sub-legibility animals: hand-placed pixels. A boar is nine rows and a
   squirrel six; a proportion table has nothing to say at that size. The roe
   deer proves a continuous quadruped in body-deer.js / figure-deer.js. Keep
   these explicit until another animal has enough rows and shared joints to
   prove an extraction.

   Material 4 is the traveller's cloth material: the TRUNK ramp off the baked
   shade value and the light. An animal is lit by the same lambert term,
   snapped to the same four rungs and dithered by the same rules as everything
   else, so it cannot introduce a colour. Identity comes from silhouette and
   value.

   Scale: PLAYER_H = 26 ≈ 1.7 m. A Japanese boar stands about 60 cm at the
   shoulder: nine pixels tall, fourteen long, low-slung, front-heavy. A red
   squirrel is 20 cm plus tail: four pixels of body and three of tail.

   Facings, as the traveller has: 0 toward the camera, 1 away, 2 in profile.
   A profile flipped by the sign of the heading makes a quadruped crab
   sideways along a vertical path. Each view leads with the feature only it
   has: snout and ear line toward, rump and tail away, the long low wedge
   across. */

function makeBoar(rnd,frame,dir){
  const w=(dir===2)?16:12, h=11;
  const sp=newSprite(w,h);
  sp.ax=w>>1; sp.ay=h-1;
  const put=(x,y,m,sh,nn)=>{
    if(x<0||y<0||x>=w||y>=h) return;
    const i=y*w+x; sp.occ[i]=m; sp.shade[i]=clamp(sh,0,1);
    if(nn!==undefined){ sp.nx[i]=nn*0.85; sp.ny[i]=-0.25;
      sp.nz[i]=Math.sqrt(Math.max(0.02,1-nn*nn*0.72-0.06)); }
  };
  const snow=(x,y)=>{ if(x<0||y<0||x>=w||y>=h) return;
    const i=y*w+x; if(sp.occ[i]===0){ sp.occ[i]=2; sp.shade[i]=0.9; } };
  /* four frames; a leg has two places, so the cycle is which diagonal pair is
     forward */
  const A=[0,1,0,-1][frame], B=[0,-1,0,1][frame];
  const bob=(frame===1||frame===3)?1:0;

  if(dir===2){
    const bodyTop=3+bob, bodyBot=7+bob;
    for(const [lx,ph,near] of [[4,A,0],[5,B,1],[11,B,0],[12,A,1]]){
      const top=bodyBot-1, bot=h-1-Math.max(0,ph);
      for(let y=top;y<=bot;y++) put(lx,y,4,near?0.30:0.14);
      put(lx,bot,4,0.06);
    }
    /* the barrel is a wedge pointing down and forward: the boar's silhouette */
    for(let x=3;x<=13;x++){
      const t=(x-3)/10, top=bodyTop+Math.round(t*1.6), bot=bodyBot;
      for(let y=top;y<=bot;y++){
        const nn=clamp((y-(top+bot)*0.5)/Math.max(1,(bot-top)*0.5),-1,1);
        put(x,y,4,0.46-0.20*Math.abs(nn)+0.10*(1-t),-nn);
      }
      if(x>4&&x<12&&rnd.chance(0.75)) put(x,top-1,4,0.62);
    }
    for(let x=0;x<=3;x++){
      const top=bodyTop+2+Math.round((3-x)*0.5), bot=bodyBot-(x<2?1:0);
      for(let y=top;y<=bot;y++) put(x,y,4,0.34-0.06*(3-x),-0.5);
    }
    put(0,bodyBot-1,4,0.10);
    put(3,bodyTop+1,4,0.66);
    put(14,bodyTop+2,4,0.20); put(15,bodyTop+1,4,0.14);
    for(let x=5;x<=12;x++) if(rnd.chance(0.55)){
      const t=(x-3)/10; snow(x,bodyTop+Math.round(t*1.6)-1); }
    return sp;
  }

  /* a boar is chest-heavy and rump-light: toward is wide at the shoulder, away
     is narrower and rounder */
  const front = dir===0;
  const top=3+bob, bot=8+bob;
  const halfTop = front?3:2, halfBot = front?3:3;
  for(let y=top;y<=bot;y++){
    const t=(y-top)/Math.max(1,bot-top);
    const hw=Math.round(halfTop+(halfBot-halfTop)*t);
    for(let x=6-hw;x<=5+hw;x++){
      const nn=clamp((x-5.5)/Math.max(1,hw),-1,1);
      put(x,y,4,0.44-0.16*Math.abs(nn)+(front?0.06*t:0.10*(1-t)),nn);
    }
  }
  if(front){
    put(4,top,4,0.68); put(7,top,4,0.68);            // ears, catching the sky
    for(let x=5;x<=6;x++) put(x,bot,4,0.16);          // the snout, low and dark
    put(5,bot-1,4,0.24); put(6,bot-1,4,0.24);
  }else{
    put(5,top-1,4,0.30); put(6,top-1,4,0.22);         // the tail, going away
    for(let x=4;x<=7;x++) put(x,bot,4,0.20);          // hams
  }
  /* legs, one diagonal pair leading */
  for(const [lx,ph] of [[4,A],[7,B]]){
    const bt=h-1-Math.max(0,ph);
    for(let y=bot;y<=bt;y++) put(lx,y,4,0.22);
    put(lx,bt,4,0.06);
  }
  for(let x=4;x<=7;x++) if(rnd.chance(0.6)) snow(x,top-1);
  return sp;
}

function makeSquirrel(rnd,frame,dir){
  /* Seven by six, mostly tail. The tail is drawn in the snow material: the
     snow ramp is the only one in the palette that goes lighter than the
     ground, and a dark dot under a light comma is legible at six pixels.
     Going away, the tail covers the body. */
  const w=7, h=6;
  const sp=newSprite(w,h);
  sp.ax=3; sp.ay=h-1;
  const put=(x,y,m,sh,nn)=>{
    if(x<0||y<0||x>=w||y>=h) return;
    const i=y*w+x; sp.occ[i]=m; sp.shade[i]=clamp(sh,0,1);
    if(nn!==undefined){ sp.nx[i]=nn*0.8; sp.ny[i]=-0.3;
      sp.nz[i]=Math.sqrt(Math.max(0.02,1-nn*nn*0.64-0.09)); }
  };
  const fur=(x,y,a)=>{ if(x<0||y<0||x>=w||y>=h) return;
    const i=y*w+x; sp.occ[i]=2; sp.ao[i]=a; sp.shade[i]=a;
    sp.nx[i]=0.2; sp.ny[i]=-0.3; sp.nz[i]=0.93; };
  /* it bounds: two of four frames are airborne and it arches */
  const air=(frame===1||frame===2)?1:0;
  const arch=(frame===1)?1:0;
  const by=4-air;

  if(dir===2){
    for(let x=1;x<=3;x++){
      const top=by-1-((x===2)?arch:0);
      for(let y=top;y<=by;y++) put(x,y,4,0.30-0.10*(y-top),0.25);
    }
    put(0,by,4,0.22,-0.7);
    put(0,by-1,4,0.55);
    fur(4,by,0.42); fur(4,by-1,0.60); fur(5,by-1,0.48);
    fur(4,by-2,0.78); fur(5,by-2,0.58);
    fur(4,by-3,0.68); fur(3,by-3,0.50);
    if(by-4>=0) fur(3,by-4,0.55);
    if(!air){ put(1,by+1,4,0.16); put(3,by+1,4,0.16); }
    return sp;
  }
  /* toward and away: a compact body with the plume behind it (on it, for the
     away view) */
  for(let x=2;x<=4;x++){
    const top=by-1-((x===3)?arch:0);
    for(let y=top;y<=by;y++) put(x,y,4,0.30-0.09*(y-top),0);
  }
  if(dir===0){
    put(3,by-2,4,0.26);                                  // head, over the chest
    put(2,by-3,4,0.55); put(4,by-3,4,0.55);              // ear tufts
    fur(5,by-2,0.52); fur(5,by-3,0.66); fur(4,by-4,0.58); // plume, behind
  }else{
    fur(2,by-2,0.58); fur(3,by-2,0.76); fur(4,by-2,0.58);
    fur(3,by-3,0.82); fur(2,by-3,0.54); fur(4,by-3,0.54);
    fur(3,by-4,0.66);
  }
  if(!air){ put(2,by+1,4,0.16); put(4,by+1,4,0.16); }
  return sp;
}

/* American alligator adult is 2.6–3.4 m; 46 px is 3.0 m at 15.294 px/m. In
   water, only eyes, nostrils and dorsal scutes clear the plane. */
function makeAlligator(rnd,frame,dir,state='swim'){
  const side=dir===2,w=side?49:19,h=state==='bask'?12:9;
  const sp=newSprite(w,h); sp.ax=w>>1; sp.ay=h-1;
  const put=(x,y,sh)=>{
    if(x<0||y<0||x>=w||y>=h)return;
    const i=y*w+x;sp.occ[i]=4;sp.shade[i]=sh;
    sp.nx[i]=clamp((x-sp.ax)/Math.max(2,w*0.45),-0.8,0.8);sp.ny[i]=-0.22;
    sp.nz[i]=Math.sqrt(Math.max(0.08,1-sp.nx[i]*sp.nx[i]-0.048));
  };
  if(state==='submerge'){
    const sink=frame%2;
    for(let x=sp.ax-3;x<=sp.ax+3;x++)put(x,h-2+sink,0.20);
    put(sp.ax-2,h-3+sink,0.78);put(sp.ax+2,h-3+sink,0.78);
    return sp;
  }
  if(side){
    const y0=state==='bask'?4:6,bob=state==='swim'&&frame%2?1:0;
    for(let x=7;x<w-8;x++){
      const u=(x-7)/(w-15),top=y0+bob-Math.round(Math.sin(u*Math.PI)*2);
      for(let y=top;y<=h-2;y++)put(x,y,0.28+0.22*Math.sin(u*Math.PI));
      if(x%5===0)put(x,top-1,0.62);
    }
    for(let x=0;x<8;x++)put(x,h-2-Math.round((7-x)*0.22),0.16);
    for(let x=w-8;x<w;x++)for(let y=y0+1;y<=h-2;y++)put(x,y,0.22);
    put(w-7,y0,0.86);put(w-3,y0+2,0.12);
    if(state==='bask')for(const x of [12,20,30,38]){put(x,h-1,0.12);put(x+(frame%2),h-2,0.22);}
  }else{
    const wide=state==='bask'?7:6,top=state==='bask'?3:5;
    for(let y=top;y<=h-2;y++){
      const hw=Math.max(2,Math.round(wide*(1-(y-top)/(h-top)*0.35)));
      for(let x=sp.ax-hw;x<=sp.ax+hw;x++)put(x,y,0.24+0.24*(1-Math.abs(x-sp.ax)/hw));
    }
    put(sp.ax-4,top-1,0.82);put(sp.ax+4,top-1,0.82);
  }
  return sp;
}

function makeHeron(rnd,frame,dir,state='wade'){
  const w=13,h=19,sp=newSprite(w,h);sp.ax=6;sp.ay=h-1;
  const put=(x,y,sh)=>{if(x<0||y<0||x>=w||y>=h)return;const i=y*w+x;
    sp.occ[i]=4;sp.shade[i]=sh;sp.nx[i]=(x-6)*0.12;sp.ny[i]=-0.2;
    sp.nz[i]=Math.sqrt(Math.max(0.08,1-sp.nx[i]*sp.nx[i]-0.04));};
  const step=frame%4,shift=state==='wade'?[0,1,0,-1][step]:0;
  for(let y=12;y<h;y++){put(4+shift,y,0.26);put(8-shift,y,0.34);}
  for(let y=4;y<=12;y++)put(6,y,0.48);
  for(let y=7;y<=13;y++)for(let x=3;x<=9;x++)
    if((x-6)*(x-6)+(y-10)*(y-10)<13)put(x,y,0.58);
  const sx=dir===2?(frame%2?1:-1):0;
  put(6+sx,3,0.72);put(6+sx,2,0.66);
  if(dir===2){put(7+sx,3,0.42);put(8+sx,3,0.30);put(9+sx,3,0.18);}
  return sp;
}

function makeTurtle(rnd,frame,dir,state='bask'){
  const w=10,h=6,sp=newSprite(w,h);sp.ax=5;sp.ay=5;
  const put=(x,y,sh)=>{if(x<0||y<0||x>=w||y>=h)return;const i=y*w+x;
    sp.occ[i]=4;sp.shade[i]=sh;sp.nx[i]=(x-5)*0.14;sp.ny[i]=-0.25;
    sp.nz[i]=Math.sqrt(Math.max(0.08,1-sp.nx[i]*sp.nx[i]-0.0625));};
  for(let y=1;y<=4;y++)for(let x=1;x<=8;x++)
    if(((x-4.5)/4)**2+((y-2.8)/2.2)**2<=1)put(x,y,0.34+0.30*(1-Math.abs(x-4.5)/4));
  const head=dir===2?(frame%2?9:0):5;put(head,3,0.48);
  if(state==='crawl'){put(2,5,0.16);put(7,5,0.16);}
  return sp;
}

/* The desert's three. A fennec stands 20 cm at the shoulder (three pixels), a
   sandgrouse is 15 cm of standing bird (two), and a horned viper is half a
   metre long, mostly buried. Hand-placed like the rest of the file.

   Drawn dark, a medium concession. All three are sand-coloured in life, and in
   the sand's own rungs at five pixels they are absent. The only clearance is
   downward, so they take the trunk ramp.

   Each carries one pale mark on material 2, which resolves on `ramp2` = `sand`
   for all three. On one ramp a five pixel animal has no value break inside it.
   The marks are real: the fennec's cream underside, the sandgrouse's wetted
   belly, the sand the viper throws. figure-camel.js makes the same argument. */

/* Vulpes zerda has the largest ear-to-body ratio of any canid, about 15 cm on
   a 40 cm body. The ears name the animal, so the silhouette is built around
   them. */
function makeFennec(rnd,frame,dir){
  /* Eight rows, for the ears: at h=7 the blade has two rows above the skull
     and the lifted trot frames push its tip onto row 0. */
  const w=9,h=8;
  const sp=newSprite(w,h);
  sp.ax=4; sp.ay=h-1;
  const put=(x,y,m,sh,nn)=>{
    if(x<0||y<0||x>=w||y>=h) return;
    const i=y*w+x; sp.occ[i]=m; sp.shade[i]=clamp(sh,0,1);
    if(nn!==undefined){ sp.nx[i]=nn*0.8; sp.ny[i]=-0.3;
      sp.nz[i]=Math.sqrt(Math.max(0.02,1-nn*nn*0.64-0.09)); }
  };
  /* trot: the body lifts one row on two of four frames, legs alternate */
  const lift=(frame===1||frame===3)?1:0;
  const by=h-1-lift;
  if(dir===2){
    /* Long low body, front-heavy, brush straight out behind: the tail is over
       half the body length and does not curl. */
    for(let x=2;x<=6;x++) put(x,by-1,4,0.34-0.03*(x-2),0.2);
    for(let x=3;x<=5;x++) put(x,by-2,4,0.46,0.2);
    put(1,by-1,4,0.24,-0.6); put(0,by-1,4,0.16,-0.7);   // the brush
    put(6,by-2,4,0.50,0.35);                             // the skull
    put(7,by-2,4,0.52,0.6);                              // muzzle
    /* the cream underside, on the sand ramp */
    put(2,by-1,2,0.76,-0.2); put(8,by-2,2,0.82,0.8);
    /* ears: three rows of blade clear of the skull, tip forward */
    put(6,by-5,4,0.78,0.5); put(6,by-4,4,0.70,0.45); put(6,by-3,4,0.62,0.4);
    put(7,by-4,4,0.66,0.7); put(7,by-3,4,0.58,0.6);
    /* legs, alternating */
    put(3,by,4,0.18,0); put(6,by,4,0.18,0);
    if(lift===0){ put(2,by,4,0.14,0); put(5,by,4,0.14,0); }
  }else{
    /* toward or away: the ears are a pair and the body a lump. Facing away
       the brush covers its middle. */
    const away=dir===1;
    for(let x=3;x<=5;x++){ put(x,by-1,4,0.32,0); put(x,by-2,4,0.44,0); }
    put(2,by-1,4,0.22,-0.6); put(6,by-1,4,0.22,0.6);
    /* the pair, splayed */
    put(2,by-4,4,0.74,-0.7); put(6,by-4,4,0.74,0.7);
    put(2,by-3,4,0.70,-0.7); put(6,by-3,4,0.70,0.7);
    put(2,by-2,4,0.58,-0.5); put(6,by-2,4,0.58,0.5);
    if(away){ for(let y=by-2;y<=by-1;y++) put(4,y,4,0.20,0); }
    else { put(4,by-2,4,0.56,0); put(4,by-1,2,0.78,0); }  // the cream front
    put(3,by,4,0.16,0); put(5,by,4,0.16,0);
  }
  return sp;
}

/* Pterocles wets its belly plumage at a pool and flies the water to chicks
   tens of kilometres away, so it arrives at an oasis at the same hour every
   morning. Pigeon-plump, very short legs, pointed tail. */
function makeSandgrouse(rnd,frame,dir){
  const w=8,h=6;
  const sp=newSprite(w,h);
  sp.ax=4; sp.ay=h-1;
  const put=(x,y,m,sh,nn)=>{
    if(x<0||y<0||x>=w||y>=h) return;
    const i=y*w+x; sp.occ[i]=m; sp.shade[i]=clamp(sh,0,1);
    if(nn!==undefined){ sp.nx[i]=nn*0.8; sp.ny[i]=-0.3;
      sp.nz[i]=Math.sqrt(Math.max(0.02,1-nn*nn*0.64-0.09)); }
  };
  /* it shuffles: a one-pixel body bob and no visible leg travel */
  const bob=(frame===1||frame===2)?1:0;
  const by=h-1-bob;
  if(dir===2){
    for(let x=2;x<=5;x++) put(x,by-1,4,0.36,0.2);
    for(let x=3;x<=5;x++) put(x,by-2,4,0.50,0.2);
    put(1,by-1,4,0.24,-0.7); put(0,by-1,4,0.14,-0.8);   // the pin tail
    put(6,by-2,4,0.58,0.6);                              // head
    put(7,by-2,4,0.40,0.8);                              // the short bill
    /* the wetted belly, on the sand ramp */
    put(3,by-1,2,0.78,0); put(4,by-1,2,0.80,0);
    put(3,by,4,0.16,0); put(5,by,4,0.16,0);
  }else{
    const away=dir===1;
    for(let x=3;x<=5;x++){ put(x,by-1,4,0.34,0); put(x,by-2,4,0.48,0); }
    put(2,by-1,4,0.24,-0.6); put(6,by-1,4,0.24,0.6);
    if(away){ put(4,by,4,0.14,0); put(3,by-1,4,0.20,-0.3); }
    else {
      put(4,by-3,4,0.60,0); put(4,by-2,4,0.54,0);
      /* head on, the wet belly is the whole underside */
      put(4,by-1,2,0.80,0); put(3,by-1,2,0.74,-0.2); put(5,by-1,2,0.74,0.2);
    }
    put(3,by,4,0.16,0); put(5,by,4,0.16,0);
  }
  return sp;
}

/* Cerastes sidewinds: it throws loops of itself forward on two short static
   contacts, travels diagonally to its heading, and leaves a ladder of separate
   J-shaped marks. Four frames are one cycle of the throw. At rest it is buried
   with the top of its head level with the surface: two horns and a line. */
function makeViper(rnd,frame,dir,state='sidewind'){
  const w=11,h=5;
  const sp=newSprite(w,h);
  sp.ax=5; sp.ay=h-1;
  const put=(x,y,m,sh,nn)=>{
    if(x<0||y<0||x>=w||y>=h) return;
    const i=y*w+x; sp.occ[i]=m; sp.shade[i]=clamp(sh,0,1);
    if(nn!==undefined){ sp.nx[i]=nn*0.8; sp.ny[i]=-0.3;
      sp.nz[i]=Math.sqrt(Math.max(0.02,1-nn*nn*0.64-0.09)); }
  };
  const by=h-1;
  if(state==='buried'){
    for(let x=4;x<=6;x++) put(x,by,4,0.30,0.1);
    put(4,by-1,4,0.62,-0.4); put(6,by-1,4,0.62,0.4);     // the two horns
    return sp;
  }
  /* the throw: a travelling sine along the body at four phases, darker at the
     two contacts */
  const ph=frame*Math.PI/2;
  for(let x=0;x<w;x++){
    const t=x/(w-1);
    const yy=by-Math.round(1.4+1.2*Math.sin(t*Math.PI*1.8+ph));
    const contact=Math.abs(Math.sin(t*Math.PI*1.8+ph))<0.34;
    put(x,yy,4,contact?0.24:0.44,Math.cos(t*Math.PI*1.8+ph)*0.6);
    /* each contact throws a heap of grains, the J mark: displaced ground, so
       the sand ramp */
    if(contact){ put(x,by,2,0.72,0); put(x,by-1,2,0.60,0.2); }
  }
  /* The head end carries two horns, one supraocular scale over each eye. One
     horn reads as damage. */
  const hx=dir===1?0:w-1;
  const inx=dir===1?1:w-2;
  put(hx,by-3,4,0.68,dir===1?-0.6:0.6);
  put(inx,by-3,4,0.60,dir===1?-0.3:0.3);
  return sp;
}

export { makeAlligator, makeBoar, makeFennec, makeHeron, makeSandgrouse,
         makeSquirrel, makeTurtle, makeViper };
