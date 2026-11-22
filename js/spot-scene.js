'use strict';
/* はじめてスポットができたときの場面（showSpotPop から）：
   村の時間を止め（GIFT_ACTIVE）、カメラがスポットへよる → 点線のかこみが1周はしって描かれる → スポットの物が1つずつ光って、ぽんとはねる
   → 光の柱・紙ふぶき・大きなキラキラ、近くのせいれいがよろこぶ → カード → カメラがもどる。
   絵はドット（2点の四角、sacred-scenes.js の SCN）。実時間でうごき、保存しない。村を切りかえたら消える（spotSceneReset）。 */
let SPOTSCN=null;/* いまの場面 {cam,back,ok} */
const SPOTSCN_POP=260,SPOTSCN_MAX=8;/* 物が1つずつ光る間（ミリ秒）・光らせる物の数 */
const SPOT_CONF=['#ffd76a','#ff9fb5','#9fd8ff','#b6eb8f','#fff6c8','#d9b3ff'];/* 紙ふぶきの色（明るくやわらかい色） */
function spotSceneBox(I){const C=spotCells(I);let x0=W,y0=H,x1=0,y1=0;for(const q of C){const x=q%W,y=(q/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  const z=liftOf(I.j),seen=new Set(),A=[];for(const q of[I.j,...I.found.flat()]){const a=anc(q);if(seen.has(a))continue;seen.add(a);A.push(a)}A.sort((a,b)=>(a%W)-(b%W)||a-b);
  return{x0,y0,x1,y1,z,A:A.slice(0,SPOTSCN_MAX),X:x0*TS-4,Y:y0*TS-4-z,Wd:(x1-x0+1)*TS+8,Hd:(y1-y0+1)*TS+8}}
SCN_DRAW.spotline=(e,t,now)=>{/* かこみ：はじめ e.run のわりあいで、まわりを1周はしって描かれる。そのあとは、点線がゆっくりまわる */
  const{X,Y,Wd,Hd}=e,P=2*(Wd+Hd),run=Math.min(1,t/e.run),L=P*sacredEase(run),a=scnEnv(t,.02,.08),pt=d=>{d=((d%P)+P)%P;return d<Wd?[X+d,Y]:d<Wd+Hd?[X+Wd,Y+d-Wd]:d<2*Wd+Hd?[X+Wd-(d-Wd-Hd),Y+Hd]:[X,Y+Hd-(d-2*Wd-Hd)]};
  const off=run<1?0:now/40;for(let d=0;d<L;d+=2){const on=((d+off)%10)<6;if(run>=1&&!on)continue;const[x,y]=pt(d);ctx.globalAlpha=a;scnDot(x-1,y-1,'#fff6c8');ctx.globalAlpha=a*.7;scnDot(x+1,y+1,'#e8b84a')}
  if(run<1){const[x,y]=pt(L);scnStar(x,y,a,3,'#ffe48a')}};
SCN_DRAW.spotpillar=(e,t,now)=>{/* 光の柱：まん中から、たてにのびて、うすれる。中を光の粒がのぼる */
  const up=sacredEase(Math.min(1,t/.25)),a=scnEnv(t,.05,.45),hgt=e.h*up,hw=e.w*(1-.35*t);
  for(let y=0;y<hgt;y+=2){const k=y/e.h,w=hw*(1-k*.55);ctx.globalAlpha=a*(.5-k*.35);ctx.fillStyle='#fff6c8';ctx.fillRect(q2(e.x-w),q2(e.y-y),q2(w*2),2);ctx.globalAlpha=a*(.55-k*.3);ctx.fillStyle='#ffffff';ctx.fillRect(q2(e.x-w*.35),q2(e.y-y),q2(w*.7),2)}
  for(let i=0;i<12;i++){const q=(t*1.6+hash(i*13+e.x))%1,px=e.x+(hash(i*7+e.y)-.5)*hw*1.6;ctx.globalAlpha=a*Math.sin(Math.PI*q);scnDot(px,e.y-q*e.h,i%3?'#fff2a8':'#ffffff')}};
SCN_DRAW.spotconf=(e,t,now)=>{/* 紙ふぶき：上へはじけて、ひらひら落ちる */
  const s=t*e.ms/1000;for(let i=0;i<e.n;i++){const an=-Math.PI/2+(hash(i*17+e.x)-.5)*2.4,v=120+hash(i*29+e.y)*150,vx=Math.cos(an)*v*.9,vy=Math.sin(an)*v,g=170,dr=Math.max(0,s-.35),x=e.x+vx*Math.min(s,.9)+Math.sin(s*5+i)*6,y=e.y+vy*s+g*s*s*.5-dr*dr*60,fl=Math.sin(now/90+i*1.7);
    ctx.globalAlpha=Math.min(1,(1-t)*2.5);ctx.fillStyle=SPOT_CONF[i%SPOT_CONF.length];ctx.fillRect(q2(x),q2(y),Math.abs(fl)>.5?4:2,Math.abs(fl)>.5?2:4)}};
SCN_DRAW.spotstars=(e,t,now)=>{/* 大きなキラキラ：かこみの中で、つぎつぎにまたたく */
  const a=scnEnv(t,.05,.2);for(let k=0;k<e.n;k++){const ph=(now/700+hash(k*41+e.X))%1,px=e.X+8+hash(k*31+e.Y)*(e.Wd-16),py=e.Y+8+hash(k*19+e.Wd)*(e.Hd-16),tw=Math.sin(Math.PI*ph);if(tw>.15)scnStar(px,py,a*tw,tw>.7?3:2,k%2?'#ffe48a':'#ffd0e0')}};
function spotScene(e,ready){/* e：SPOT_POPS の1つ。ready(back)：カードを出す（back はカメラをもどす） */
  const I=SPOTI.find(q=>q.sp.k===e.sp.k&&(e.j==null||q.j===e.j))||SPOTI.find(q=>q.sp.k===e.sp.k);if(!I){ready(null);return}
  const B=spotSceneBox(I),owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION&&SPOTSCN===sc;
  for(let i=SPOTFX.length-1;i>=0;i--){const f=SPOTFX[i];if(f.x0===B.x0&&f.y0===B.y0&&f.x1===B.x1&&f.y1===B.y1)SPOTFX.splice(i,1)}/* ふだんのかこみは、この場面のかこみにかえる */
  const back={z:cam.z,x:cam.x+VW/cam.z/2,y:cam.y+VH/cam.z/2},cx=B.X+B.Wd/2,cy=B.Y+B.Hd/2,fit=Math.min(VW/(B.Wd+TS*4),VH/(B.Hd+TS*6)),tz=Math.max(.6,Math.min(Math.max(cam.z*1.3,2),fit,2.8));
  const sc=SPOTSCN={back,cam:null};const at=(ms,fn)=>villageTimeout(()=>{if(ok())fn()},ms);
  musicDuck(6500);if(typeof hdBig==='function')hdBig(4200);
  sc.cam=camAnim={fz:cam.z,tz,fx:back.x,fy:back.y,tx:cx,ty:cy-TS*.8,t:0,dur:1.1,done:()=>{if(!ok())return;
    const n=B.A.length,tRun=700,tPop=tRun+120,tBig=tPop+n*SPOTSCN_POP+200,tCard=tBig+1900;
    scnAdd('spotline',tCard+400,Object.assign({run:tRun/(tCard+400)},B));sfx('chime');
    B.A.forEach((a,i)=>at(tPop+i*SPOTSCN_POP,()=>{const x=(a%W+.5)*TS,y=((a/W)|0)*TS+16-B.z,o=S.obj[a];if(o)LANDFX.set(a,performance.now());/* ぽんとはねる */
      scnAdd('glow',700,{x,y:y-6,r:22,col:'#fff6c8'});scnAdd('ring',650,{x,y,r0:4,r1:22,col:'#ffe48a',a:.9});sfx('tink')}));
    at(tBig,()=>{const bx=cx,by=B.Y+B.Hd*.75;scnAdd('spotpillar',2400,{x:bx,y:by,w:Math.max(26,Math.min(48,B.Wd*.4)),h:TS*7});scnAdd('spotconf',2600,{x:bx,y:by-TS*.5,n:80});scnAdd('spotconf',2400,{x:bx,y:by-TS,n:40},250);scnAdd('spotstars',2800,{X:B.X-TS,Y:B.Y-TS,Wd:B.Wd+TS*2,Hd:B.Hd+TS*2,n:16});
      scnAdd('ring',900,{x:bx,y:by,r0:8,r1:Math.max(40,B.Wd*.7),col:'#fff6c8',a:1});scnAdd('ring',1100,{x:bx,y:by,r0:6,r1:Math.max(30,B.Wd*.55),col:'#ffd0e0',a:.8},180);sfx('level');
      const now=performance.now(),mx=(B.x0+B.x1+1)/2,my=(B.y0+B.y1+1)/2;/* 近くの、起きているせいれいが、そちらを向いてよろこぶ */
      for(const r of S.res){if(r.hidden||Math.hypot(r.x-mx,r.y-my)>8)continue;const a=r.act;if(a&&(a.type==='sleep'||a.type==='faint'))continue;if(Math.abs(r.x-mx)>.3)r.face=r.x<mx?1:-1;JUMP.set(r,now+Math.random()*250);JOYU.set(r,now+2200);villageTimeout(()=>JUMP.set(r,performance.now()),650+Math.random()*250)}});
    at(tCard,()=>ready(done=>{if(!ok()){if(done)done();return}sc.cam=camAnim={fz:cam.z,tz:back.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:back.x,ty:back.y,t:0,dur:1,done:()=>{if(SPOTSCN===sc)SPOTSCN=null;if(done)done()}}}))}}}
function spotSceneReset(){if(!SPOTSCN)return;if(SPOTSCN.cam&&camAnim===SPOTSCN.cam)camAnim=null;/* 旧い村のカメラの動きを、新しい村にもちこさない */SPOTSCN=null;GIFT_ACTIVE=false;document.querySelectorAll('.idea-reveal[aria-label="スポットができた！"]').forEach(e=>e.remove())}/* 村を切りかえたとき */
