'use strict';
/* 御神木の調べ：村での準備と、守り神の出番（指でする操作）。調べは1回タップすると、その話の最後まで自動で続く。 */
const fieldNear=(j,R,f)=>{const s=fieldStump(j),sx=s%W,sy=s/W|0;for(let y=sy-R;y<=sy+R;y++)for(let x=sx-R;x<=sx+R;x++){if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x,o=S.obj[k]==='part'?S.obj[S.ref[k]]:S.obj[k];if(o&&f(o,k))return true}return false};
const FIELD_PREP={
  earthRoot:{label:'切り株のまわりの雑草をなくそう',ok:j=>!fieldNear(j,2,o=>WEEDS.has(o))},
  fireRoot:{label:'切り株のそばに、たき火を置こう',ok:j=>fieldNear(j,3,o=>o==='campfire'),learn:['campfire']},
  waterFilm:{label:'切り株のそばに、井戸かみずがめを置こう',ok:j=>fieldNear(j,3,o=>o==='well'||o==='jar'),learn:['jar']},
  windEcho:{label:'切り株のそばに、ゆりを植えよう',ok:j=>fieldNear(j,3,o=>o==='lily')}
};
function fieldPrepNeed(id){const st=fieldStoryState(id),p=FIELD_PREP[id],j=S.sacredRoot;if(IS_STORY_REPLAY||!p||j==null||(st?.step||0)>0||p.ok(j))return null;for(const k of p.learn||[])if(!S.recipes[k]){S.recipes[k]=true;dirty=true}/* 古いセーブでも、準備に使う物を作れるように */return p}
/* 守り神の出番：その話の、どの段階で、どんな操作か */
const FIELD_PLAY={
  earthListen:{phase:0,type:'find',hint:'しんとしている所を、さがしてタップ'},
  earthRoot:{phase:0,type:'root',hint:'光る根の先から、根を指でなぞって土から出す。はずれると根が切れて、はじめから',bonus:{items:{bellf:2}}},
  fireRoot:{phase:0,type:'hold',hint:'石を長おしして、ゲージが緑のときに指をはなす',bonus:{fun:10}},
  fireTrace:{phase:2,type:'cover',hint:'つめたい所に、草をかぶせる'},
  waterFilm:{phase:2,type:'trace',hint:'光る所から、水の通り道を指でなぞって根までつなぐ',bonus:{items:{lotus:2}}},
  waterLeaf:{phase:1,type:'wait',hint:'芽にふれずに、見守る'},
  windEcho:{phase:0,type:'rhythm',hint:'葉っぱが光ってゆれたら、その葉っぱをタップ',bonus:{items:{lily:2}}},
  windVoices:{phase:4,type:'gather',hint:'切り株を長おしして、みんなの力をあつめる'}
};
let SPLAY=null;
/* 遊べる出番：3回しっぱいしても、お話はそのまま進む（ごほうびだけ、なし） */
const PLAY_MISS=3;
const sacredPlayActive=()=>!!SPLAY&&SPLAY.owner===S&&SPLAY.session===VILLAGE_SESSION;
function sacredPlayHint(t){let h=$('#playHint');if(!h){h=document.createElement('div');h.id='playHint';h.className='toast';$('#toasts').appendChild(h)}h.textContent=t;h.hidden=!t}
function sacredPlayCount(){const P=SPLAY;if(!P)return '';const n=P.need?' '+P.got+'/'+P.need:'';return FIELD_PLAY[P.id]?.bonus?n+' のこり'+(PLAY_MISS-(P.fails||0))+'回':n}
function startSacredPlay(id,j,cast,done){
  const def=FIELD_PLAY[id];if(!def)return done();
  const s=fieldStump(j),cx=storyTreeX(j)*TS,cy=((s/W|0)+.8)*TS-hiAt(j)*LIFT,now=performance.now();
  const P={owner:S,session:VILLAGE_SESSION,id,type:def.type,hint:def.hint,cx,cy,t0:now,done,cast,got:0,need:0,prog:0,msg:'',msgT:0};
  const ring=(n,rx,ry,a0=0)=>Array.from({length:n},(_,i)=>{const a=a0+i/n*Math.PI*2;return{x:cx+Math.cos(a)*rx,y:cy+8+Math.sin(a)*ry}});
  if(P.type==='find'){P.spots=ring(5,34,13,.4);P.target=(hash((S.sacredRoot||0)+7)*5)|0;P.wrong=new Map()}
  if(P.type==='cover'){P.spots=ring(6,36,14,.2);const c=new Set();let k=0;while(c.size<3)c.add((hash((S.sacredRoot||0)*3+k++)*6)|0);P.cold=c;P.covered=new Set();P.need=3}
  if(P.type==='hold'){P.stone={x:cx+20,y:cy+12};P.heat=0;P.holding=false}
  if(P.type==='root'){P.path=[];for(let i=0;i<=28;i++){const u=i/28;P.path.push({x:cx+30-u*58,y:cy+26-u*20+Math.sin(u*Math.PI*3)*5})}P.reach=0;P.tip=0}/* 根の先（土の深い所）から、地面の上（切り株の根元）へ */
  if(P.type==='rhythm'){P.leaves=[-1,0,1].map(k=>({x:cx+k*20,y:cy-22-Math.abs(k)*4}));P.need=4;P.beat=null;P.nextBeat=now+900}
  if(P.type==='trace'){P.path=[];for(let i=0;i<=24;i++){const u=i/24;P.path.push({x:cx-74+u*66,y:cy+16-Math.sin(u*Math.PI)*14+u*-6})}P.reach=0}
  if(P.type==='wait'){P.ms=6000;P.since=now;P.shrink=0}
  if(P.type==='swipe'){P.need=3}
  if(P.type==='gather'){P.order=[...cast.filter(r=>r.name!==POKO),...cast.filter(r=>r.name===POKO)];P.need=P.order.length;P.prog=0;P.holding=false}/* 切り株を長おし：みんなが、じゅんに切り株へ力をおくる（フタバはさいご） */
  if(P.type==='brush'){P.area={x:cx-34,y:cy-10,w:68,h:20}}
  SPLAY=P;camAnim={fz:cam.z,tz:Math.max(cam.z,2.4),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:cx,ty:cy-10,t:0,dur:.6};
  sacredPlayHint(P.hint+sacredPlayCount());sfx('tap');
  if(IS_STORY_REPLAY)setTimeout(()=>{if(SPLAY===P)sacredPlayWin()},1600);/* 思い出帳では、守り神の手は見せるだけ */
}
function sacredPlayWin(){const P=SPLAY;if(!P)return;SPLAY=null;sacredPlayHint('');if(P.owner!==S||P.session!==VILLAGE_SESSION)return;fxSpr('lighthit',P.cx,P.cy);sfx('good');sacredPlayBonus(P);P.done()}
/* うまくできたときのごほうび（その出番で1回だけ。思い出帳ではなし） */
function sacredPlayBonus(P){const b=FIELD_PLAY[P.id]?.bonus;if(!b||IS_STORY_REPLAY)return;const F=S.flags.playWon||(S.flags.playWon={});if(F[P.id])return;F[P.id]=true;dirty=true;
  if(b.items){for(const[id,n]of Object.entries(b.items))giveItem(id,n);queueItemGift(b.items,'うまくできた！')}
  if(b.fun)for(const r of P.cast||[]){r.fun=Math.min(100,r.fun+b.fun);addFloat(r.x,r.y-1.4,'たのしさ+'+b.fun)}}
/* しっぱい：数えて、3回でおわり（お話は進む） */
function sacredPlayMiss(t){const P=SPLAY;if(!P)return;P.fails=(P.fails||0)+1;sacredPlayMsg(t);if(P.fails<PLAY_MISS){sacredPlayHint(P.hint+sacredPlayCount());return}SPLAY=null;sacredPlayHint('');if(P.owner!==S||P.session!==VILLAGE_SESSION)return;sfx('tap');P.done()}
function cancelSacredPlay(){SPLAY=null;sacredPlayHint('')}
function sacredPlayMsg(t){const P=SPLAY;if(!P)return;P.msg=t;P.msgT=performance.now()}
function sacredPlayNear(w,p,r){return Math.hypot(w.x-p.x,w.y-p.y)<=r}
/* 指の動き（世界の座標） */
function sacredPlayDown(w,now){const P=SPLAY;P.down={x:w.x,y:w.y,t:now,last:{x:w.x,y:w.y,t:now}};
  if(P.type==='find'){P.spots.forEach((s,i)=>{if(!sacredPlayNear(w,s,10))return;if(i===P.target){sfx('bush');sacredPlayWin()}else{P.wrong.set(i,now);sfx('tap')}})}
  else if(P.type==='cover'){P.spots.forEach((s,i)=>{if(!sacredPlayNear(w,s,10)||P.covered.has(i))return;if(P.cold.has(i)){P.covered.add(i);P.got=P.covered.size;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(sacredPlayWin,500)}else sacredPlayMsg('ここは、あたたかい')})}
  else if(P.type==='hold'){if(sacredPlayNear(w,P.stone,14)){P.holding=true;P.heat=0}}
  else if(P.type==='wait'){P.since=now;P.shrink=now;sacredPlayMsg('そっと……')}
  else if(P.type==='gather'){if(sacredPlayNear(w,{x:P.cx,y:P.cy-6},26))P.holding=true}
  else if(P.type==='trace'){P.tracing=sacredPlayNear(w,P.path[0],12);P.reach=0}
  else if(P.type==='root'){P.tracing=sacredPlayNear(w,P.path[P.reach],12)}/* 切れたら、根の先から（reach=0）。とちゅうではなしたら、そこからつづけられる */
  else if(P.type==='rhythm'){const b=P.beat;let hit=-1;P.leaves.forEach((l,i)=>{if(sacredPlayNear(w,l,11))hit=i});if(hit<0)return;if(b&&b.leaf===hit&&!b.hit&&now-b.t<560){b.hit=true;P.got++;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(sacredPlayWin,500)}else sacredPlayMiss(b&&!b.hit&&b.leaf!==hit?'そっちじゃない':'まだ、ゆれていない')}
}
function sacredPlayMove(w,now){const P=SPLAY,d=P.down;if(!d)return;const l=d.last,dt=Math.max(1,now-l.t)/1000,dist=Math.hypot(w.x-l.x,w.y-l.y),v=dist/dt;d.last={x:w.x,y:w.y,t:now};
  if(P.type==='brush'){const a=P.area;if(w.x<a.x||w.x>a.x+a.w||w.y<a.y-6||w.y>a.y+a.h)return;if(v>260){if(P.prog>0)sacredPlayMsg('つよすぎる。そっと');P.prog=Math.max(0,P.prog-.25);return}P.prog=Math.min(1,P.prog+dist/360);if(Math.random()<.3)fx.push({k:'p',x:w.x,y:w.y,vx:(Math.random()-.5)*30,vy:-30,life:.6,col:'#b4925e',r:2});if(P.prog>=1)sacredPlayWin()}
  else if(P.type==='root'&&P.tracing){let best=-1,bd=1e9;for(let i=Math.max(0,P.reach-2);i<=Math.min(P.path.length-1,P.reach+4);i++){const p=P.path[i],dd=Math.hypot(w.x-p.x,w.y-p.y);if(dd<bd){bd=dd;best=i}}if(bd>10){P.tracing=false;P.reach=0;P.snap=now;sfx('hit');sacredPlayMiss('根が切れちゃった');return}if(best>P.reach){P.reach=best;if(Math.random()<.4)fx.push({k:'p',x:w.x,y:w.y,vx:(Math.random()-.5)*30,vy:-30,life:.6,col:'#b4925e',r:2})}if(P.reach>=P.path.length-1)sacredPlayWin()}
  else if(P.type==='trace'&&P.tracing){let best=-1,bd=1e9;P.path.forEach((p,i)=>{const dd=Math.hypot(w.x-p.x,w.y-p.y);if(dd<bd){bd=dd;best=i}});if(bd>12){P.tracing=false;P.reach=0;sacredPlayMiss('こぼれちゃった');return}if(best>=P.reach&&best<=P.reach+3)P.reach=best;if(P.reach>=P.path.length-1)sacredPlayWin()}
}
function sacredPlayUp(w,now){const P=SPLAY,d=P.down;P.down=null;
  if(P.type==='hold'&&P.holding){P.holding=false;if(P.heat>=.58&&P.heat<=.84){sfx('bush');sacredPlayWin()}else if(P.heat<.6)sacredPlayMsg('まだ、つめたい');else sacredPlayMiss('こげちゃった')}
  else if(P.type==='swipe'&&d){const len=Math.hypot(w.x-d.x,w.y-d.y),ms=now-d.t;if(len<18)return;if(len>110||ms<140){sacredPlayMsg('つよすぎる。やさしく');P.gust=now;return}P.got++;P.sway=now;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(sacredPlayWin,600)}
  else if(P.type==='trace'||P.type==='root')P.tracing=false;
  else if(P.type==='gather'&&P.holding){P.holding=false;if(P.got<P.need)sacredPlayMsg('はなさずに……')}
}
/* 出番のあいだは、地図の操作より先に指をうけとる */
for(const [ev,fn] of [['pointerdown',sacredPlayDown],['pointermove',sacredPlayMove],['pointerup',sacredPlayUp]])cv.addEventListener(ev,e=>{if(!sacredPlayActive()||!$('#dialog').hidden)return;e.stopImmediatePropagation();e.preventDefault();if(ev==='pointerdown')cv.setPointerCapture(e.pointerId);fn({x:cam.x+e.clientX/cam.z,y:cam.y+e.clientY/cam.z},performance.now())},{capture:true});
function drawSacredPlay(now){const P=SPLAY;if(!sacredPlayActive())return;ctx.save();const t=(now-P.t0)/1000;
  const glow=(x,y,r,a,col='255,246,200')=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)};
  if(P.type==='find'){P.spots.forEach((s,i)=>{const w=P.wrong.get(i),bad=w&&now-w<500;if(i===P.target){glow(s.x,s.y,7,.35+.1*Math.sin(t*1.2))}else{for(let k=0;k<3;k++){const a=t*6+i*2+k*2.1;ctx.fillStyle=bad?'#e8a0a0':'#fff6c8';ctx.fillRect(s.x+Math.cos(a)*4-1,s.y+Math.sin(a*1.3)*3-1,2,2)}glow(s.x,s.y,7,.25)}})}
  if(P.type==='cover'){P.spots.forEach((s,i)=>{if(P.covered.has(i)){ctx.fillStyle='#c9b46a';for(let k=-2;k<=2;k++)ctx.fillRect(s.x+k*2,s.y-3+Math.abs(k),1,4)}else if(P.cold.has(i))glow(s.x,s.y,8,.45+.15*Math.sin(t*3+i),'170,215,255');else glow(s.x,s.y,7,.3,'255,214,150')})}
  if(P.type==='hold'){const s=P.stone;{const dt=Math.min(.1,(now-(P.lt||now))/1000);P.lt=now;if(P.holding)P.heat=Math.min(1.05,P.heat+dt*.55)}if(P.heat>1){P.holding=false;P.heat=0;P.scorch=now;sacredPlayMiss('こげちゃった')}
    ctx.fillStyle=`rgb(${120+P.heat*120|0},${110+P.heat*40|0},${105-P.heat*40|0})`;ctx.beginPath();ctx.ellipse(s.x,s.y,6,4,0,0,7);ctx.fill();glow(s.x,s.y,10+P.heat*8,.2+P.heat*.4,'255,170,90');
    const bx=s.x-16,by=s.y-18;ctx.fillStyle='rgba(60,40,30,.6)';ctx.fillRect(bx,by,32,4);ctx.fillStyle='#8fdc6a';ctx.fillRect(bx+32*.58,by,32*.26,4);ctx.fillStyle='#ffb347';ctx.fillRect(bx,by+1,32*Math.min(1,P.heat),2)}
  if(P.type==='brush'){const a=P.area;ctx.globalAlpha=.7*(1-P.prog);ctx.fillStyle='#9c7a52';ctx.beginPath();ctx.ellipse(a.x+a.w/2,a.y+a.h/2,a.w/2,a.h/2,0,0,7);ctx.fill();ctx.globalAlpha=P.prog;ctx.strokeStyle='#d9b98a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x+6,a.y+12);ctx.quadraticCurveTo(a.x+a.w/2,a.y+2,a.x+a.w-6,a.y+14);ctx.stroke();ctx.globalAlpha=1}
  if(P.type==='root'){const pa=P.path,sn=P.snap&&now-P.snap<500;ctx.fillStyle='rgba(120,88,52,.75)';ctx.beginPath();ctx.ellipse(P.cx,P.cy+18,40,14,0,0,7);ctx.fill();/* 根の上の土 */ctx.fillStyle=sn?'rgba(232,120,110,.8)':'rgba(255,246,200,.55)';pa.forEach((p,i)=>{if(i>P.reach&&i%2===0)ctx.fillRect(p.x-1,p.y-1,2,2)});ctx.strokeStyle='#d9b98a';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=P.reach;i++){const p=pa[i];i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.stroke();const tp=pa[P.reach];glow(tp.x,tp.y,10,.45+.15*Math.sin(t*5),'255,236,170')}
  if(P.type==='rhythm'){if(!P.beat||now-P.beat.t>700){if(now>=P.nextBeat){P.beat={t:now,leaf:(hash(now|0)*3)|0,hit:false};P.nextBeat=now+900+hash((now|0)+3)*700}}const b=P.beat;P.leaves.forEach((l,i)=>{const on=b&&b.leaf===i&&now-b.t<520,sw=on?Math.sin((now-b.t)/50)*.5:0;if(on&&!b.hit)glow(l.x,l.y,12,.55);ctx.save();ctx.translate(l.x,l.y);ctx.rotate(sw);ctx.fillStyle=b&&b.leaf===i&&b.hit?'#bfe89a':'#8fdc6a';ctx.beginPath();ctx.ellipse(0,0,4,7,0,0,7);ctx.fill();ctx.fillStyle='#5f9e3f';ctx.fillRect(-.5,-6,1,12);ctx.restore()})}
  if(P.type==='trace'){ctx.fillStyle='rgba(255,255,255,.7)';P.path.forEach((p,i)=>{if(i%2===0)ctx.fillRect(p.x-1,p.y-1,2,2)});ctx.strokeStyle='#7fc4ec';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=P.reach;i++){const p=P.path[i];i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.stroke();glow(P.path[0].x,P.path[0].y,10,.5,'150,210,255')}
  if(P.type==='wait'){const p=Math.min(1,(now-P.since)/P.ms),sh=Math.max(0,1-(now-P.shrink)/800);ctx.strokeStyle='#c8ffd0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(P.cx,P.cy-18,12,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke();ctx.fillStyle='#8fdc6a';const s=1-sh*.5;ctx.fillRect(P.cx-3*s,P.cy-20,6*s,4*s);if(p>=1)sacredPlayWin()}
  if(P.type==='swipe'){const sw=P.sway&&now-P.sway<900?Math.sin((now-P.sway)/90)*(1-(now-P.sway)/900)*4:0,gu=P.gust&&now-P.gust<600?Math.sin((now-P.gust)/30)*3:0;ctx.fillStyle='#8fdc6a';ctx.save();ctx.translate(P.cx,P.cy-20);ctx.rotate((sw+gu)*.08);ctx.beginPath();ctx.ellipse(0,-4,3,6,0,0,7);ctx.fill();ctx.restore();const d=P.down;if(d){ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.last.x,d.last.y);ctx.stroke()}}
  if(P.type==='gather'){const dt=Math.min(.1,(now-(P.lt||now))/1000);P.lt=now;if(P.holding&&P.got<P.need){P.prog+=dt*1.25;if(P.prog>=P.got+1){const r=P.order[P.got];P.got++;if(r){faceTo(r,(Math.floor(P.cy/TS))*W+Math.floor(P.cx/TS));JUMP.set(r,now);fxSpr('twinkle',r.x*TS,r.y*TS-14)}sfx('tap');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need){P.holding=false;setTimeout(sacredPlayWin,700)}}}
    ctx.strokeStyle='rgba(255,246,200,.75)';ctx.lineWidth=2;for(let i=0;i<P.got;i++){const r=P.order[i];if(!r)continue;ctx.beginPath();ctx.moveTo(r.x*TS,r.y*TS-12);ctx.lineTo(P.cx,P.cy-6);ctx.stroke();glow(r.x*TS,r.y*TS-12,10,.45)}/* 力をおくった子から、切り株へ光の線 */
    glow(P.cx,P.cy-6,18+P.got*4,.25+.1*Math.sin(t*4)+P.got*.06);if(!P.holding&&P.got<P.need){ctx.strokeStyle='rgba(255,246,200,'+(.5+.3*Math.sin(t*4))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(P.cx,P.cy-6,20+2*Math.sin(t*4),0,7);ctx.stroke()}/* 長おしする所に、光の輪 */
    if(P.holding){const f=P.prog-P.got;ctx.strokeStyle='#fff6c8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(P.cx,P.cy-6,20,-Math.PI/2,-Math.PI/2+f*Math.PI*2);ctx.stroke()}}
  if(P.msg&&now-P.msgT<1400){ctx.font='bold 10px "PixelMplus10",sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#695438';ctx.fillStyle='#fff5d4';ctx.strokeText(P.msg,P.cx,P.cy-36);ctx.fillText(P.msg,P.cx,P.cy-36)}
  ctx.restore()}
/* 調べを1回はじめたら、その話の最後まで自動で続ける（会話のあと3秒あける） */
function tryFieldAuto(r){const q=fieldStoryCurrent();if(!q||isNight()||!$('#dialog').hidden||sacredPlayActive())return false;const st=fieldStoryState(q.id);if(!st?.auto||fieldStoryDone(q.id))return false;
  const step=FIELD_STORIES[q.id][st.step];if(!step||fieldStoryActor(step)!==r)return false;if(r.act&&['eat','fetch','flee','faint','pray','bury','fieldstory','fieldassist'].includes(r.act.type))return false;/* 遊び・散歩などは、やめて調べへ */
  if(performance.now()<(FIELD_AUTO_AT.get(S)||0))return false;FIELD_AUTO_AT.set(S,performance.now()+2000);return fieldStoryStart(q,true)}
const FIELD_AUTO_AT=new WeakMap();
