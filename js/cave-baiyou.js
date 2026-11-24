'use strict';
/* 8階「異形の培養室」のしくみ（cave.js のつづき）。設定は STORY.md の「土の谷の大穴とバケモノ」
   ・ガラスの入れ物（地図の U・Q）：歩けない・見とおせる。中に、ためしのからだ（bk_tame）がねむっている（e.gj に入れ物のマス）
     U：ふち道をふさぐ入れ物。まもりの光でわれる（どのパーティでも。われると、中のためしのからだが目をさます）
     Q：ふさがない、見るだけの入れ物。火のせいれいが CVTAMER マスまで近づくと、中からわれて出てくる（まもりの光でもわれる）
   ・名ふだ（地図の K）：入れ物の前に、1まいずつ立っていた金もののふだ。読めない字が彫ってある。ならびのはしの1つだけ、ちがう字（手がかり。しらべると、むかしの道具の名ふだ）
   ・大穴の底に、ガラスの入れ物がならんで見える（iso-cave2.js の cvqAbyssDraw から cvBaiAbyss）
   たしかめは tools/tests/cave-baiyou.cjs */
const cvGlassOn=e=>!!e&&e.gj!=null&&!!CV&&CV.ob.has(e.gj);/* ガラスの入れ物の中でねむっているか */
/* 入るとき：入れ物（U・Q）と、中のためしのからだ */
function cvGlassInit(C,j,ch){C.g[j]=1;C.ob.set(j,{k:ch,done:false,home:j});const D=EN.bk_tame;
  C.en.push({id:C.eid++,type:'bk_tame',asleep:true,x:cvX(j)+.5,y:cvY(j)+.5+CVOY,hp:D.hp,max:D.hp,spawned:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:j,gj:j})}
/* 入れ物がわれる（中のためしのからだが、目をさます） */
function cvGlassBreak(j,now){const C=CV,o=C.ob.get(j);if(!o||o.k!=='U'&&o.k!=='Q')return false;C.ob.delete(j);
  for(const e of C.en)if(e.gj===j&&!e.dead){e.asleep=false;e.wakeT=now;e.gj=null}
  cvSpark(cvX(j)+.5,cvY(j)+.4,'#cfeaf6',16);cvSpark(cvX(j)+.5,cvY(j)+.6,'#8a929a',6);return true}
/* 火のせいれいが近づいたとき：Q がわれる（cvWakeOK から） */
function cvGlassWake(e,a){const o=CV.ob.get(e.gj);if(!o||o.k!=='Q'||a.elem!=='fire'||Math.hypot(a.x-e.x,a.y-e.y)>CVTAMER)return false;
  cvGlassBreak(e.gj,performance.now());sfx('crack');toast('入れ物が、われた','warn');return true}
/* はじめて、ふさいでいる入れ物のそばに来たとき：まもりの光でわれることを知らせる */
function cvGlassTick(){const C=CV;if(C.note.glassU)return;for(const[j,o]of C.ob){if(o.k!=='U')continue;
  if(C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<=3.2)){C.note.glassU=1;toast('ガラスの入れ物が、道をふさいでいる。まもりの光で、われそう');return}}}
/* ---------- 絵（仮のドット絵） ---------- */
/* 入れ物の土台：金ものの台と、管。ふさぐ入れ物 U は、金色の台 */
function cvGlassBase(ox,oy,k,now){const F=(c,a,b,w,h)=>P4(c,ox+a,oy+b,w,h),br=k==='U'?['#5a4a2a','#8a6e3a','#b89050']:['#2e3236','#4c535c','#7a8088'];
  F('rgba(8,10,14,.35)',2,26,28,3);F(br[0],3,22,26,7);F(br[1],4,22,24,5);F(br[2],4,22,24,1);F('#16181c',6,26,20,2);
  F('#3a4048',13,28,6,3);F('#6a4a32',3,27,26,1);/* 台と、さびた帯 */
  const p=.5+.5*Math.sin(now/700+ox*.1);ctx.globalAlpha=.25+.25*p;F('#9ad0ff',9,24,2,1);F('#9ad0ff',21,24,2,1);ctx.globalAlpha=1}
/* 入れ物のガラス（中のためしのからだの上にかぶせる）：x・y は足もと */
function cvGlassOver(x,y,now,e){const t=now/1000+e.id,br=Math.sin(t*.9);
  ctx.globalAlpha=.3;P4('#bfe6f6',x-11,y-38,22,38);ctx.globalAlpha=.16;P4('#8ac0e0',x-9,y-34,18,30);ctx.globalAlpha=1;
  P4('#4c535c',x-12,y-40,24,3);P4('#7a8088',x-12,y-40,24,1);P4('#3a4048',x-12,y-4,24,3);P4('#4c535c',x-12,y-4,24,1);/* ふたと、台 */
  ctx.globalAlpha=.7;P4('#f2fbff',x-10,y-36,2,28);P4('#f2fbff',x-8,y-37,1,3);ctx.globalAlpha=1;P4('rgba(70,100,120,.55)',x+9,y-36,2,32);/* 光のつや・かげ */
  for(let i=0;i<3;i++){const q=(t*.35+i/3)%1;ctx.globalAlpha=Math.sin(q*Math.PI)*.8;P4('#e6f8ff',Math.round(x-6+i*6+Math.sin(t*2+i*2)*1.5),Math.round(y-8-q*26),1,1);ctx.globalAlpha=1}/* あわ */
  P4('#5a7a60',x-5,y-2+Math.round(br),10,1)}
/* 名ふだ（K）：くいに立てた金もののふだ。読めない字が彫ってある。ならびのはしの1つだけ、ちがう字 */
function cvNafudaDraw(ox,oy,end,now){const F=(c,a,b,w,h)=>P4(c,ox+a,oy+b,w,h);
  F('rgba(8,10,14,.3)',6,27,20,3);F('#3a4048',14,14,4,14);F('#5a6068',14,14,2,14);/* 立ててある棒 */
  F('#2e3236',6,3,20,14);F('#606872',7,4,18,12);F('#7c848e',7,4,18,1);F('#4c535c',7,15,18,1);
  F('#3a4048',8,5,1,1);F('#3a4048',23,5,1,1);F('#3a4048',8,14,1,1);F('#3a4048',23,14,1,1);/* びょう */
  if(!end){for(let i=0;i<3;i++){F('#3a4048',10,7+i*3,12,1);F('#3a4048',10+((i*5)%7),8+i*3,2,1)}/* 字 */}
  else{F('#3a4048',12,6,8,1);F('#3a4048',12,13,8,1);F('#3a4048',11,7,1,6);F('#3a4048',20,7,1,6);F('#3a4048',15,8,2,4);F('#3a4048',13,9,6,2);/* 丸にばつ：ほかとちがう字 */
    const p=.5+.5*Math.sin(now/600);ctx.globalAlpha=.2+.25*p;F('#c8f0ff',12,6,8,8);ctx.globalAlpha=1}}
/* 大穴の底：ガラスの入れ物が、ずっと下に、ならんで見える（大穴のひし形の中。カメラより、おそく動く） */
function cvBaiAbyss(gx,gy,Wd,Hd,t){const par=.62,ox=gx*par,oy=gy*par,S=64;ctx.save();
  for(let iy=Math.floor((oy-60)/S);iy<=Math.ceil((oy+Hd)/S);iy++)for(let ix=Math.floor((ox-60)/S);ix<=Math.ceil((ox+Wd)/S);ix++){const h=hash((ix*131+iy*71+8)>>>0);if(h<.35)continue;
    const x=Math.round(ix*S+h*30-ox+gx),y=Math.round(iy*S+hash((ix*17+iy*29+3)>>>0)*30-oy+gy),lit=h>.8;
    ctx.globalAlpha=.55;P4('#1a2a38',x,y,9,15);ctx.globalAlpha=lit?.5:.3;P4(lit?'#9ad0ff':'#5a8aa8',x+1,y+1,7,13);ctx.globalAlpha=.7;P4('#2e3a46',x-1,y-1,11,2);P4('#2e3a46',x-1,y+14,11,2);
    if(lit){ctx.globalAlpha=.5+.3*Math.sin(t*1.3+h*20);P4('#e6f8ff',x+3,y+4+Math.round(Math.sin(t+h*9)*2),1,1)}}
  ctx.restore();ctx.globalAlpha=1}
