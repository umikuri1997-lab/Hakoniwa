'use strict';
/* ---------- イベントの演出（依頼ボードの「イベント」。大会・誕生日会はのぞく） ----------
   流れ：集まる → はじまり（evShowBegin：カメラがよる・かざりが1つずつ出る・「せーの！」）→ 指あそびをえらぶ（evAsk：あそぶ／みてる）
   → する（イベントごとの小道具 EVD・山場 evShowClimax：すすみぐあいが EVCLXP になったとき1回）
   → おわり（evShowEnd：その場でこちらを向き、1人ずつ木の札・ハンコ → 紙ふぶき・はくしゅ → その日の写真 → カメラがもどる）。
   見た目と音は実時間（EVV はセーブしない）。ごほうび（evExtra）・お話（evTopic）・手紙（letterQ の ev）・日記（S.dy の ev）・雑談（CHATS の evc）は evEnd からよぶ。
   指あそび（EVMG）は10秒。うまくできたら（E.ek が EVOK 以上）、上がる能力が EVPLAY ずつ・たのしさが EVPLAYFUN ふえる。曲は大会の曲（audio.js の cupMusicWant）。
   文は js/ev-text.js（EVTALK・EVTALKOK・EVCHAT・EVDY・EVDYB）。 */
const EVMGT=10000,EVOK=.6,EVPLAY={work:1,move:1,sta:1,atk:5,cap:0},EVPLAYFUN=5,EVCLXP=.6,EVCLXMS=3600,EVCOMF=5,EVCOMFD=3,EVDREAMP=.6,EVTAIKOCD=2;
const EVKIND={taiso:'move',soji:'move',oni:'move',ensoku:'move',takara:'move',mizu:'move',matoate:'move',undo:'move',gochi:'eat',pikunikku:'eat',shukaku:'eat',utage:'eat',cha:'eat',ocha:'eat',yomi:'calm',hoshi:'calm',hokomairi:'calm',onsen:'calm',camp:'calm',hana:'fest',lantern:'fest',himatsuri:'fest',hanabi:'fest',taikokai:'fest'};
const EVSONGMOVE=new Set(['taiso','soji','oni','ensoku','takara','mizu','matoate','undo','taikokai','himatsuri','hana']);/* 動く曲（MusMus「BGM-141」）。ほかは、しずかな曲（魔王魂「fantasy05」） */
const EVDECO={undo:'rw',hana:'flower',pikunikku:'flower',lantern:'lamp',hanabi:'lamp',himatsuri:'lamp',camp:'lamp',hoshi:'lamp',taikokai:'lamp',utage:'lamp',onsen:'lamp',ocha:'lamp',hokomairi:'lamp',cha:'flower',gochi:'flower',shukaku:'flower',yomi:'flower'};/* かざりのしゅるい（ほかは旗） */
/* たのしさ（実数）と、能力のほかに足すごほうび（説明の文。evExtra と同じ数） */
const EVFUN={taiso:15,soji:10,oni:20,ensoku:20,gochi:15,takara:15,yomi:10,mizu:20,camp:20,cha:15,hoshi:20,onsen:15,matoate:10,pikunikku:20,taikokai:20,ocha:10,hokomairi:10,undo:30,hana:40,lantern:30,shukaku:30,himatsuri:30,utage:30,hanabi:30};
const EVBOND={oni:3,gochi:2,camp:3,pikunikku:3,utage:3,hanabi:3};
const EVEX={taiso:'きょう、はたらく速さ+2',soji:'3日、家の住み心地+5',ensoku:'ひとり1つ、木の実か花のたね',takara:'いちばん見つけたせいれいに、ふしぎなふくろ1こ',yomi:'その夜、ゆめを見る見こみ60%',mizu:'つかれ－30',camp:'その夜、火のせいれいの攻撃力+10',cha:'つかれ－20',hoshi:'その夜、流れ星',onsen:'つかれ－50',matoate:'木の矢10本',taikokai:'その夜、見張り台のうつ間かく－2',ocha:'得意な仕事「料理」の回数+10',hokomairi:'きょう、たのしさのへりかた0.5倍',undo:'かった組に花かんむり・組の中で、なかよし+3',hana:'花のたね3つ',lantern:'つぎの朝、手紙が2通',shukaku:'つぎの収穫で、畑の作物+1',himatsuri:'その夜、火のせいれいの攻撃力+20',hanabi:'思い出帳に花火の思い出'};
for(const id in EVFUN)if(EVENTS[id]){EVENTS[id].fun=EVFUN[id];if(EVBOND[id])EVENTS[id].bond=EVBOND[id];if(EVEX[id])EVENTS[id].ex=EVEX[id]}
function evShowOn(E){const D=E&&EVENTS[E.id];return !!D&&!D.cup&&!D.bday&&!!EVKIND[E.id]}
const EVV={id:null,t0:0,back:null,box:null,clx:0,cid:null,end:null,rip:[],met:[],lan:[],pet:[],shine:0,flash:0,ask:0,song:''};
function evPeople(E){return(E.who||[]).map(id=>S.res.find(r=>r.id===id)).filter(r=>r&&evHere(r))}
function evCamCenter(){return[cam.x+VW/cam.z/2,cam.y+VH/cam.z/2]}
function evCamTo(x,y,sec){if(camAnim&&camAnim.done)return;const[fx,fy]=evCamCenter();camAnim={fz:cam.z,tz:cam.z,fx,fy,tx:x,ty:y,t:0,dur:sec||1.4}}
function evBoxOf(E){const P=Object.values(E.slot||{});let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const j of P){x0=Math.min(x0,j%W);x1=Math.max(x1,j%W);y0=Math.min(y0,(j/W)|0);y1=Math.max(y1,(j/W)|0)}
  if(x0>1e8){const[cx,cy]=E.c||evTemple();x0=Math.floor(cx)-2;x1=Math.floor(cx)+2;y0=Math.floor(cy)-1;y1=Math.floor(cy)+1}if(x1-x0<3){x0--;x1++}return{x0,x1,y0,y1}}
/* ---------- はじまり ---------- */
function evShowBegin(E,P){if(!evShowOn(E)||E.shw)return;E.shw=1;const now=performance.now(),D=EVENTS[E.id];EVV.id=E.id;EVV.t0=now;EVV.clx=0;EVV.cid=null;EVV.end=null;EVV.rip=[];EVV.met=[];EVV.lan=[];EVV.pet=[];EVV.shine=0;EVV.flash=0;E.cx=0;E.ek=0;
  EVV.song=EVSONGMOVE.has(E.id)?'cupmove':'cupcalm';EVV.box=evBoxOf(E);if(typeof MEMRUN!=='undefined'&&MEMRUN)return;
  if(!EVV.back)EVV.back=evCamCenter();if(E.c)evCamTo(E.c[0]*TS,E.c[1]*TS,1.4);
  const n=evDecoN();for(let i=0;i<Math.min(n,8);i++)setTimeout(()=>{if(S.ev===E)j3Ding(i*2,0,.35)},300+i*110);
  setTimeout(()=>{if(S.ev!==E)return;sfx('stamp');j3Ding(12,.05,.6);j3Ding(19,.12,.5);for(const r of evPeople(E))JUMP.set(r,performance.now()+Math.random()*200)},1500);
  if(EVMG[E.id]&&started)setTimeout(()=>{if(S.ev===E&&E.ph)evAsk(E)},2300)}
function evDecoN(){const B=EVV.box;return B?Math.max(3,Math.floor(((B.x1-B.x0+3)*TS-16)/10)):6}
/* ---------- 指あそびをえらぶ（下のカード。えらばなければ、みてる） ---------- */
function evAsk(E){if(document.getElementById('evAsk')||document.getElementById('cupMG'))return;const M=EVMG[E.id];
  const o=el('<div id="evAsk" class="pxcard" style="position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:44;background:var(--panel);color:var(--ink);padding:10px 12px;width:280px;max-width:calc(100vw - 32px);text-align:center"><b class="t" style="display:block;font-size:15px"></b><p class="note" style="margin:2px 0 8px"></p><div style="display:flex;gap:8px;justify-content:center"><button class="btn pri a">あそぶ</button><button class="btn x">みてる</button></div></div>');
  o.querySelector('.t').textContent=EVENTS[E.id].n;o.querySelector('.note').textContent='いっしょに：'+M.t;document.body.appendChild(o);
  const tm=setTimeout(()=>o.remove(),15000);
  o.querySelector('.a').onclick=()=>{clearTimeout(tm);o.remove();sfx('stamp');if(S.ev===E&&E.ph)evMGOpen(E)};
  o.querySelector('.x').onclick=()=>{clearTimeout(tm);sfx('tap');o.remove()}}
function evMGOpen(E){const M=EVMG[E.id];if(!M||document.getElementById('cupMG'))return;const s={E};M.init(s);
  const o=el('<div id="cupMG" class="pxcard" style="position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:44;background:var(--panel);color:var(--ink);padding:10px 12px;width:280px;max-width:calc(100vw - 32px);text-align:center;touch-action:none;user-select:none"><b class="t" style="display:block;font-size:15px"></b><p class="note h" style="margin:2px 0 6px"></p><canvas width="'+MGW+'" height="'+MGH+'" style="width:240px;max-width:100%;image-rendering:pixelated;display:block;margin:0 auto"></canvas><div class="r" style="font-size:15px;min-height:20px;margin-top:4px"></div></div>');
  o.querySelector('.t').textContent=M.t;o.querySelector('.h').textContent=M.h;document.body.appendChild(o);
  const cv=o.querySelector('canvas'),g=cv.getContext('2d'),t0=performance.now();let last=t0,done=false,dn=false;
  const T=()=>(performance.now()-t0)/1000,pos=e=>{const b=cv.getBoundingClientRect();return[(e.clientX-b.left)/b.width*MGW,(e.clientY-b.top)/b.height*MGH]};
  o.addEventListener('pointerdown',e=>{e.preventDefault();if(done)return;dn=true;const[x,y]=pos(e);if(M.down)M.down(s,T(),x,y);if(M.tap)M.tap(s,T(),x,y)});
  o.addEventListener('pointermove',e=>{if(done||!M.move)return;const[x,y]=pos(e);M.move(s,T(),x,y,dn)});
  const up=()=>{dn=false;if(M.up&&!done)M.up(s,T())};o.addEventListener('pointerup',up);o.addEventListener('pointercancel',up);o.addEventListener('pointerleave',up);
  const fin=()=>{done=true;const k=Math.max(0,Math.min(1,M.k(s)));if(S.ev===E)E.ek=Math.max(E.ek||0,k);
    o.querySelector('.r').textContent=k>=.75?'すごい！ みんな大よろこび！':k>=EVOK?'いいね！ みんな、うれしそう':'ざんねん……でも、たのしかった';if(k>=.75){j3Ding(12,0,.5);j3Ding(16,.06,.5);j3Ding(19,.12,.5)}else sfx(k>=EVOK?'good':'tap');
    if(k>=EVOK&&S.ev===E)for(const r of evPeople(E))JUMP.set(r,performance.now()+Math.random()*300);setTimeout(()=>o.remove(),1300)};
  const loop=()=>{if(done||!o.isConnected)return;const now=performance.now(),dt=Math.min(.1,(now-last)/1000),t=T();last=now;if(M.tick)M.tick(s,dt,t);
    g.fillStyle='#f4e9d2';g.fillRect(0,0,MGW,MGH);M.draw(g,s,t);g.fillStyle='#d8c8a8';g.fillRect(0,MGH-3,MGW,3);g.fillStyle='#a8743f';g.fillRect(0,MGH-3,Math.round(MGW*Math.max(0,1-t*1000/EVMGT)),3);
    if(t*1000>=EVMGT||s.end&&t>=s.end||S.ev!==E||!S.ev.ph)return fin();requestAnimationFrame(loop)};requestAnimationFrame(loop)}
/* ---------- 指あそびの絵の道具（120×56のドット） ---------- */
const mR=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
function mStar(g,x,y,c){mR(g,c,x-1,y-3,2,6);mR(g,c,x-3,y-1,6,2)}
function mFx(g,s,t){for(const f of s.fx||[]){const a=t-f.t;if(a<0||a>.45)continue;const d=Math.round(2+a*16);mStar(g,f.x,f.y-a*10,'#ffd23f');mR(g,'#ffe066',f.x-d,f.y,2,2);mR(g,'#ffe066',f.x+d,f.y,2,2)}}
function mPop(s,x,y,t){(s.fx||(s.fx=[])).push({x,y,t});if(s.fx.length>12)s.fx.shift()}
/* 合図に合わせてタップ */
function mgRhythm(o){return{t:o.t,h:o.h,init(s){s.hit=0;s.last=-1;s.fl=-9;s.fx=[]},
  tap(s,t){const b=Math.round(t/o.b),d=Math.abs(t-b*o.b);if(d<.15&&b!==s.last&&b>0){s.hit++;s.last=b;s.fl=t;sfx(o.snd);mPop(s,o.cx,o.cy-14,t);evHit(s.E,1)}else sfx('notch')},
  k(s){return Math.min(1,s.hit/o.goal)},
  draw(g,s,t){const ph=(t%o.b)/o.b;o.art(g,s,t,ph);const r=Math.round((1-ph)*16);if(r>2){g.fillStyle='#ffd23f';g.fillRect(o.cx-r,o.cy-r,r*2,1);g.fillRect(o.cx-r,o.cy+r,r*2,1);g.fillRect(o.cx-r,o.cy-r,1,r*2);g.fillRect(o.cx+r,o.cy-r,1,r*2+1)}mFx(g,s,t);mgBar(g,4,4,30,4,Math.min(1,s.hit/o.goal),'#ffe066')}}}
/* 出てくる物をタップ */
function mgTargets(o){return{t:o.t,h:o.h,init(s){s.L=[];s.hit=0;s.nx=.4;s.fx=[]},
  tick(s,dt,t){if(t>=s.nx&&s.L.filter(q=>!q.dead).length<(o.n||2)){s.L.push(Object.assign({t0:t},o.make(t)));s.nx=t+o.gap*(.6+Math.random()*.8)}for(const q of s.L){if(!q.dead&&o.move)o.move(q,dt,t);if(!q.dead&&t-q.t0>o.life)q.dead=1}s.L=s.L.filter(q=>!q.dead)},
  tap(s,t,x,y){const q=s.L.find(q=>!q.dead&&Math.abs(x-q.x)<(o.rx||10)&&Math.abs(y-q.y)<(o.ry||10));if(q){q.dead=1;s.hit++;sfx(o.snd);mPop(s,q.x,q.y,t);evHit(s.E,1)}else sfx('notch')},
  k(s){return Math.min(1,s.hit/o.goal)},
  draw(g,s,t){o.bg(g,s,t);for(const q of s.L)o.item(g,q,t);mFx(g,s,t);mgBar(g,4,4,30,4,Math.min(1,s.hit/o.goal),'#ffe066')}}}
/* おしているあいだ上がる。うごく緑の所にたもつ */
function mgBand(o){return{t:o.t,h:o.h,init(s){s.h=.3;s.in=0;s.n=0;s.dn=false;s.ht=0;s.fx=[]},down(s){s.dn=true;sfx(o.snd)},up(s){s.dn=false},
  tick(s,dt,t){s.h=Math.max(0,Math.min(1,s.h+(s.dn?.75:-.5)*dt));const c=.5+Math.sin(t*o.w)*.2;s.n+=dt;if(Math.abs(s.h-c)<.12){s.in+=dt;s.ht+=dt;if(s.ht>1.2){s.ht=0;mPop(s,48,18,t);evHit(s.E,1)}}},
  k(s){return s.n?Math.min(1,s.in/s.n*1.3):0},
  draw(g,s,t){const c=.5+Math.sin(t*o.w)*.2;o.art(g,s,t);mR(g,'#e9d8b4',104,6,10,44);mR(g,'#a8f08a',104,Math.round(50-(c+.12)*44),10,Math.round(.24*44));mR(g,o.col,106,Math.round(50-s.h*44),6,Math.round(s.h*44));mFx(g,s,t)}}}
/* おしてためて、線のところではなす（n回） */
function mgFill(o){return{t:o.t,h:o.h,init(s){s.v=0;s.sc=[];s.dn=false;s.wait=0;s.fx=[]},
  down(s,t){if(s.sc.length>=o.n||t<s.wait)return;s.dn=true;sfx(o.snd)},
  up(s,t){if(!s.dn)return;s.dn=false;const q=s.v>=o.lo&&s.v<=1?Math.max(.4,1-Math.abs(s.v-o.best)*4):0;s.sc.push(q);s.last=q;s.lt=t;s.wait=t+.6;if(q>0){sfx('stamp');mPop(s,60,16,t);evHit(s.E,q)}else sfx('notch');if(s.sc.length>=o.n)s.end=t+.8},
  tick(s,dt,t){if(s.dn){s.v+=o.sp*dt;if(s.v>1.06){s.dn=false;s.sc.push(0);s.last=0;s.lt=t;s.wait=t+.8;sfx('notch');if(s.sc.length>=o.n)s.end=t+.8}}else if(t>=s.wait&&s.v>0&&s.sc.length<o.n)s.v=0},
  k(s){return s.sc.reduce((a,b)=>a+b,0)/o.n},
  draw(g,s,t){o.art(g,s,t);mgDots(g,s.sc.filter(q=>q>0).length,o.n);if(s.lt!=null&&t-s.lt<.6){const ok=s.last>0;g.fillStyle=ok?'#ffd23f':'#c9a68a';g.font='10px PixelMplus10, sans-serif';g.textAlign='center';g.fillText(ok?'ぴったり！':'あっ',60,12)}mFx(g,s,t)}}}
/* うごく印がまん中（pos が0）のときにタップ（n回） */
function mgSway(o){return{t:o.t,h:o.h,init(s){s.tr=[];s.t0=0;s.fx=[];if(o.init)o.init(s)},
  tap(s,t){if(s.tr.length>=o.n||t<s.t0)return;const p=o.pos(t,s),q=Math.max(0,1-Math.abs(p)*(o.tol||2.2));s.tr.push({q,t,p});s.t0=t+(o.cool||.4);sfx(q>.6?o.snd:'notch');if(o.land)o.land(s,p,q,t);if(q>.5){mPop(s,o.fx?o.fx(s,p)[0]:60,o.fx?o.fx(s,p)[1]:24,t);evHit(s.E,q)}if(s.tr.length>=o.n)s.end=t+.9},
  k(s){return s.tr.reduce((a,b)=>a+b.q,0)/o.n},
  draw(g,s,t){o.art(g,s,t,o.pos(t,s));mgDots(g,s.tr.filter(q=>q.q>.5).length,o.n);mFx(g,s,t)}}}
const MSKY=[[8,10],[22,6],[40,14],[58,8],[76,12],[94,6],[108,16],[30,22],[86,24]];
const EVMG={
  taiso:mgRhythm({t:'いち、に！ さん、し！',h:'わくが、せいれいにかさなったらタップ',b:.8,goal:9,snd:'tink',cx:60,cy:30,art(g,s,t,ph){mR(g,'#cfe8b0',0,40,MGW,16);const up=t-s.fl<.3;mgBlob(g,60,34,'#ffb070');mR(g,'#ffb070',up?52:53,up?22:31,2,up?6:5);mR(g,'#ffb070',up?66:65,up?22:31,2,up?6:5);mR(g,'#c9965c',48,40,24,3)}}),
  taikokai:mgRhythm({t:'どん、どん、どん！',h:'わくが、たいこにかさなったらタップ',b:.6,goal:12,snd:'bonk',cx:60,cy:30,art(g,s,t,ph){mR(g,'#8a5a32',46,28,28,16);mR(g,'#c9965c',46,26,28,4);mR(g,'#ff6a5c',48,30,24,2);const hit=t-s.fl<.15;mR(g,'#7a4a2a',hit?40:38,hit?20:12,3,12);mR(g,'#7a4a2a',hit?77:79,hit?20:12,3,12);if(hit){mR(g,'#ffe066',40,24,4,1);mR(g,'#ffe066',76,24,4,1)}}}),
  himatsuri:mgRhythm({t:'火のたいこ！',h:'わくが、たいこにかさなったらタップ。火が大きくなる',b:.7,goal:10,snd:'bonk',cx:40,cy:32,art(g,s,t,ph){mR(g,'#3a2a3a',0,0,MGW,50);mR(g,'#8a5a32',28,30,24,14);mR(g,'#c9965c',28,28,24,3);const fh=6+s.hit*3+Math.round(Math.sin(t*12)*2);mR(g,'#7a4a2a',82,44,20,4);mR(g,'#ff6a3c',86,44-fh,12,fh);mR(g,'#ffd23f',89,46-fh*.7,6,fh*.6)}}),
  soji:mgTargets({t:'ぴかぴか大作戦！',h:'光ったよごれを、タップ',n:3,gap:.5,life:1.7,goal:8,snd:'wsweep',make:()=>({x:12+Math.random()*96,y:18+Math.random()*28}),
    bg(g){mR(g,'#d9c49a',0,10,MGW,46);for(let i=0;i<10;i++)mR(g,'#cdb68a',(i*23)%MGW,14+(i*17)%36,6,2)},item(g,q,t){mR(g,'#7a5a3a',q.x-4,q.y-2,8,4);mR(g,'#5c4a32',q.x-2,q.y-3,4,1);if(Math.floor(t*6)%2)mStar(g,q.x+4,q.y-4,'#fff3a0')}}),
  ensoku:mgTargets({t:'道で、みっけ！',h:'道に落ちている物を、タップ',n:2,gap:.7,life:3.2,goal:6,snd:'tgrass',make:()=>({x:126,y:30+Math.random()*12,k:(Math.random()*3)|0}),move:(q,dt)=>{q.x-=42*dt},
    bg(g,s,t){mR(g,'#bfe0a0',0,10,MGW,46);mR(g,'#e2cfa0',0,28,MGW,18);for(let i=0;i<8;i++)mR(g,'#7fb070',((i*31-t*42)%140+140)%140-10,16,3,4)},item(g,q){const C=['#a8743f','#ff8fb1','#9a9aa0'][q.k];mR(g,C,q.x-3,q.y-3,6,6);mR(g,'#ffffff',q.x-2,q.y-2,2,1);if(q.k===1)mR(g,'#ffd23f',q.x-1,q.y-1,2,2)}}),
  hoshi:mgTargets({t:'流れ星に、おねがい！',h:'流れ星を、タップ',n:1,gap:1,life:1.3,goal:4,snd:'starkira',rx:14,ry:12,make:()=>({x:90+Math.random()*30,y:6+Math.random()*10}),move:(q,dt)=>{q.x-=62*dt;q.y+=26*dt},
    bg(g,s,t){mR(g,'#2a3058',0,0,MGW,53);for(const[x,y]of MSKY)if(Math.floor(t*2+x)%5)mR(g,'#fff3d6',x,y,1,1);mR(g,'#3a4a3a',0,44,MGW,9)},item(g,q){for(let i=0;i<10;i++)mR(g,i<4?'#ffffff':'#ffe9a8',q.x+i*2,q.y-i*.85,2,1);mStar(g,q.x,q.y,'#ffffff')}}),
  pikunikku:mgTargets({t:'ちょうちょ、こんにちは',h:'とんでいる、ちょうを、タップ',n:2,gap:.8,life:2.8,goal:6,snd:'tink',make:()=>({x:10+Math.random()*100,y:14+Math.random()*24,ph:Math.random()*6,vx:(Math.random()<.5?-1:1)*18}),move:(q,dt,t)=>{q.x+=q.vx*dt;q.y+=Math.sin(t*5+q.ph)*.6;if(q.x<6||q.x>114)q.vx*=-1},
    bg(g){mR(g,'#bfe0a0',0,10,MGW,46);mR(g,'#f0c0c8',30,38,60,12);for(let i=0;i<6;i++)mR(g,'#ffffff',34+i*10,40,4,2)},item(g,q,t){const w=Math.floor(t*10)%2;mR(g,'#ffd23f',q.x-1,q.y-1,2,4);mR(g,'#ff8fb1',q.x-(w?5:4),q.y-3,w?4:3,4);mR(g,'#ff8fb1',q.x+1,q.y-3,w?4:3,4)}}),
  hana:mgTargets({t:'花びら、ひらひら',h:'ふってくる花びらを、タップ',n:4,gap:.35,life:3,goal:10,snd:'leaf',make:()=>({x:8+Math.random()*104,y:-2,ph:Math.random()*6,c:Math.random()<.5?'#ff9fb8':'#fff0a0'}),move:(q,dt,t)=>{q.y+=18*dt;q.x+=Math.sin(t*3+q.ph)*.5},
    bg(g){mR(g,'#fff6ea',0,10,MGW,46);mR(g,'#bfe0a0',0,46,MGW,7)},item(g,q){mR(g,q.c,q.x-2,q.y-1,4,3);mR(g,q.c,q.x-1,q.y-2,2,5)}}),
  mizu:mgTargets({t:'えいっ、水かけ！',h:'顔を出したせいれいを、タップ',n:2,gap:.6,life:1.1,goal:7,snd:'water',make:()=>{const L=[[22,34],[98,34],[40,22],[80,22]],p=L[(Math.random()*4)|0];return{x:p[0],y:p[1]}},
    bg(g,s,t){mR(g,'#cfe8b0',0,10,MGW,46);mR(g,'#9fd0ea',44,30,32,14);mR(g,'#b2aca2',42,42,36,4);const h=Math.round(Math.sin(t*6)*2);mR(g,'#cfefff',58,12+h,4,20)},item(g,q){mgBlob(g,q.x,q.y,'#7fc6ff')}}),
  takara:mgTargets({t:'たからの光',h:'草の中で光った所を、タップ。ヒントになる',n:1,gap:.7,life:.95,goal:5,snd:'wsoil',make:()=>({x:12+Math.random()*96,y:20+Math.random()*26}),
    bg(g){mR(g,'#a8d088',0,10,MGW,46);for(let i=0;i<24;i++)mR(g,'#88b870',(i*37)%MGW,14+(i*13)%38,2,4)},item(g,q,t){mStar(g,q.x,q.y,Math.floor(t*8)%2?'#ffffff':'#ffe066')}}),
  oni:mgTargets({t:'まてまて～！',h:'にげるせいれいを、タップでつかまえる',n:1,gap:.4,life:1.9,goal:5,snd:'pat',rx:11,ry:11,make:()=>({x:20+Math.random()*80,y:24+Math.random()*16,vx:(Math.random()<.5?-1:1)*52,vy:(Math.random()<.5?-1:1)*26}),move:(q,dt)=>{q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.x<10||q.x>110)q.vx*=-1;if(q.y<18||q.y>46)q.vy*=-1},
    bg(g){mR(g,'#cfe8b0',0,10,MGW,46);mR(g,'#bfd898',20,18,80,30)},item(g,q){mgBlob(g,q.x,q.y,'#a8f08a')}}),
  camp:mgBand({t:'まきを、くべて！',h:'おしているあいだ、火が強くなる。緑の所にたもとう',w:.9,col:'#ff6a3c',snd:'crackle',art(g,s,t){mR(g,'#2e2a40',0,0,100,53);mR(g,'#7a4a2a',30,42,40,5);mR(g,'#5c3a22',36,38,28,4);const fh=Math.round(6+s.h*26+Math.sin(t*14)*2);mR(g,'#ff6a3c',40,40-fh,20,fh);mR(g,'#ffd23f',45,42-fh*.6,10,fh*.55);if(s.h>.7)for(let i=0;i<3;i++)mR(g,'#ffb070',36+((t*40+i*13)%28),40-fh-((t*30+i*9)%12),1,1)}}),
  onsen:mgBand({t:'いい湯かげん',h:'おしているあいだ、お湯があつくなる。緑の所にたもとう',w:1.1,col:'#ff8a5c',snd:'bubble',art(g,s,t){mR(g,'#9a9aa0',16,30,72,18);mR(g,s.h>.65?'#f0a0a0':s.h<.3?'#9fc0ea':'#a8e0e8',20,32,64,12);mgBlob(g,52,32,'#ffb070');const n=Math.round(1+s.h*5);for(let i=0;i<n;i++){const x=24+i*11,y=22-((t*8+i*4)%10);mR(g,'#ffffff',x,y,2,3)}}}),
  cha:mgFill({t:'お茶を、そそいで',h:'おしているあいだ、そそぐ。線のところで、はなす。3ぱい',n:3,sp:.42,lo:.8,best:.9,snd:'pour',art(g,s,t){mR(g,'#8a5a32',0,46,MGW,7);mR(g,'#c9965c',20,8,26,14);mR(g,'#c9965c',44,12,10,3);const x=60;if(s.dn)mR(g,'#c8a050',x-1,15,2,Math.round(24-s.v*12));mR(g,'#ffffff',x-10,26,20,20);mR(g,'#f0e0c0',x-9,27,18,18);const lv=Math.round(Math.min(1.06,s.v)*16);mR(g,'#c8a050',x-9,45-lv,18,lv);mR(g,'#a8743f',x-11,45-Math.round(.9*16),2,1);mR(g,'#a8743f',x+9,45-Math.round(.9*16),2,1);if(s.v>1)mR(g,'#c8a050',x+10,44,6,2)}}),
  hokomairi:mgFill({t:'そっと、いのる',h:'おしているあいだ、光がたまる。わくに光がとどいたら、はなす。3回',n:3,sp:.5,lo:.82,best:.92,snd:'chime',art(g,s,t){mR(g,'#e8dcc0',0,10,MGW,46);mR(g,'#8a5a32',48,30,24,16);mR(g,'#a8743f',44,26,32,5);const r=Math.round(4+Math.min(1.06,s.v)*14);mR(g,'#fff3a0',60-r,22-r,r*2,r*2);const R=Math.round(4+.9*14);g.fillStyle='#d8a040';g.fillRect(60-R,22-R,R*2,1);g.fillRect(60-R,22+R,R*2,1);g.fillRect(60-R,22-R,1,R*2);g.fillRect(60+R,22-R,1,R*2)}}),
  matoate:mgSway({t:'まんなかを、ねらって',h:'まとが、まん中に来たらタップ。5本',n:5,snd:'shoot',tol:2.2,pos:t=>Math.sin(t*2.6),land(s,p){(s.ar||(s.ar=[])).push(p)},fx:(s,p)=>[60,26],
    art(g,s,t,p){mR(g,'#cfe8b0',0,10,MGW,46);const x=Math.round(60+p*44);for(const[r,c]of[[12,'#ffffff'],[9,'#ff6a5c'],[6,'#ffffff'],[3,'#ff6a5c']])mR(g,c,x-r,26-r,r*2,r*2);for(const a of s.ar||[]){const ax=Math.round(x+(-a)*44);mR(g,'#7a4a2a',ax,20,1,8);mR(g,'#ffffff',ax-1,18,3,2)}mR(g,'#7a4a2a',59,48,2,5);mR(g,'#ffd23f',58,46,4,2)}}),
  gochi:mgSway({t:'ごちそうを、ならべよう',h:'おさらが、まん中のテーブルの上に来たらタップ。5さら',n:5,snd:'plate',tol:2,pos:t=>((t*.9)%2)-1,land(s,p,q){(s.dish||(s.dish=[])).push(q>.5?p:null)},fx:()=>[60,30],
    art(g,s,t,p){mR(g,'#e8dcc0',0,10,MGW,46);mR(g,'#c9965c',30,32,60,12);mR(g,'#8a5a32',30,44,60,2);mR(g,'#ffffff',54,30,12,2);(s.dish||[]).forEach((d,i)=>{if(d==null)return;const x=36+i*12;mR(g,'#ffffff',x-4,30,9,2);mR(g,['#ff8a5c','#a8f08a','#ffd23f','#ff8fb1','#c49cff'][i%5],x-3,27,7,3)});const x=Math.round(60+p*50);mR(g,'#ffffff',x-5,12,11,2);mR(g,'#ff8a5c',x-4,9,9,3)}}),
  utage:mgSway({t:'かんぱい！',h:'2つの湯のみがぶつかる時に、タップ。4回',n:4,snd:'tink',tol:2.4,cool:.5,pos:t=>Math.sin(t*2.8),fx:()=>[60,22],
    art(g,s,t,p){mR(g,'#3a2a3a',0,0,MGW,53);mR(g,'#ffb070',0,44,MGW,9);const d=Math.round(Math.abs(p)*40);mR(g,'#e9d8b4',52-d,24,9,12);mR(g,'#c8a050',53-d,25,7,4);mR(g,'#e9d8b4',59+d,24,9,12);mR(g,'#c8a050',60+d,25,7,4);if(d<3)mStar(g,60,20,'#ffffff')}}),
  undo:mgSway({t:'玉入れ！',h:'印が、かごのところに来たらタップ。6こ',n:6,snd:'catch',tol:2.2,cool:.55,pos:t=>Math.sin(t*3.4),land(s,p,q,t){s.ball={p,t,q}},fx:()=>[60,14],
    art(g,s,t,p){mR(g,'#cfe8b0',0,10,MGW,46);mR(g,'#9a7a5a',59,16,2,32);mR(g,'#ffffff',52,10,16,8);mR(g,'#d8c8a8',52,16,16,2);mR(g,'#e9d8b4',10,48,100,3);mR(g,'#ffd23f',53,48,14,3);mR(g,'#ff6a5c',Math.round(60+p*48)-1,46,3,6);if(s.ball){const a=Math.min(1,(t-s.ball.t)/.5),x=20+(60+s.ball.p*48-20)*a,y=44-Math.sin(a*Math.PI)*36-(s.ball.q>.5?a*20:0);if(a<1)mR(g,'#ff6a5c',x-2,y-2,4,4)}mgBlob(g,16,44,'#ffb070')}}),
  lantern:mgSway({t:'ランタン、とんでいけ',h:'風が、やんだときにタップ。5こ',n:5,snd:'chime',tol:2,cool:.5,pos:t=>Math.sin(t*1.9)*Math.cos(t*.7),land(s,p,q,t){(s.up||(s.up=[])).push({t,p,q})},fx:()=>[60,30],
    art(g,s,t,p){mR(g,'#24284a',0,0,MGW,53);for(const[x,y]of MSKY)mR(g,'#fff3d6',x,y,1,1);mR(g,'#7a5a3a',8,20,2,26);const fw=Math.round(Math.abs(p)*14);mR(g,Math.abs(p)<.25?'#a8f08a':'#ff8a5c',10,20,2+fw,4);for(const u of s.up||[]){const a=t-u.t,x=60+(u.q>.5?0:u.p*a*30),y=46-a*20;if(y<-6)continue;mR(g,'#ffb070',x-3,y-4,6,7);mR(g,'#ffe9a8',x-2,y-3,4,4)}mR(g,'#ffb070',57,42,6,7)}}),
  shukaku:mgSway({t:'山もり、しゅうかく！',h:'いちばん上の作物の上に来たらタップ。6こ',n:6,snd:'harvdone',tol:3,cool:.5,init(s){s.top=0;s.st=[]},pos:(t,s)=>Math.sin(t*2.3)*.6-s.top,land(s,p,q){const x=p+s.top;if(q>.5){s.st.push(x);s.top=x}else s.miss=x},fx:s=>[60+s.top*40,40-s.st.length*5],
    art(g,s,t,p){mR(g,'#e2cfa0',0,46,MGW,7);const C=['#ffd23f','#ff8a5c','#a8f08a'];s.st.forEach((x,i)=>{mR(g,C[i%3],Math.round(60+x*40)-6,40-i*5,12,5);mR(g,'#7fb070',Math.round(60+x*40)-1,39-i*5,2,2)});const cx=Math.round(60+(p+s.top)*40);mR(g,'#7a5a3a',cx,0,1,6);mR(g,C[s.st.length%3],cx-6,6,12,5)}}),
  hanabi:{t:'花火、どーん！',h:'タップで花火をあげる。いちばん上で、もう1回タップ。4発',init(s){s.rk=null;s.n=0;s.sc=0;s.bs=[];s.fx=[]},
    tap(s,t){if(s.n>=4)return;if(!s.rk){s.rk={t};sfx('shoot');return}const a=(t-s.rk.t)/1.1,q=Math.max(0,1-Math.abs(a-1)*3);s.bs.push({t,y:Math.round(50-Math.min(1.2,a)*40),q});s.rk=null;s.n++;s.sc+=q;sfx(q>.5?'hanabi':'notch');if(q>.5)evHit(s.E,q);if(s.n>=4)s.end=t+1.2},
    tick(s,dt,t){if(s.rk&&t-s.rk.t>1.6){s.bs.push({t,y:2,q:0});s.rk=null;s.n++;if(s.n>=4)s.end=t+.8}},k(s){return s.sc/4},
    draw(g,s,t){mR(g,'#1e2240',0,0,MGW,53);mR(g,'#2e3a2e',0,48,MGW,5);mR(g,'#d8a040',59,6,2,1);mR(g,'#d8a040',57,10,6,1);if(s.rk){const a=Math.min(1.5,(t-s.rk.t)/1.1);mR(g,'#ffe9a8',59,Math.round(50-a*40),2,3)}
      const C=['#ff8a9a','#8ac8ff','#ffd86a','#c49cff'];for(const[i,b]of s.bs.entries()){const a=t-b.t;if(a>1)continue;const r=Math.round(4+a*(b.q>.5?20:8));for(let k=0;k<12;k++){const an=k/12*Math.PI*2;mR(g,b.q>.5?C[i%4]:'#9a8a7a',60+Math.cos(an)*r,b.y+Math.sin(an)*r,2,2)}}mgDots(g,s.bs.filter(b=>b.q>.5).length,4)}},
  yomi:{t:'ページを、めくって',h:'読みおわりのしるしが右に来たら、左へなでてめくる。5ページ',init(s){s.pg=0;s.ok=0;s.t0=0;s.dx=null;s.flip=-9;s.fx=[]},
    down(s,t,x){s.dx=x},move(s,t,x,y,dn){if(!dn||s.dx==null||s.pg>=5)return;if(s.dx-x>22){s.dx=null;const a=(t-s.t0)/1.6,q=a>=.8&&a<=1.25?1:0;s.ok+=q;s.pg++;s.t0=t;s.flip=t;sfx(q?'page':'notch');if(q){mPop(s,60,14,t);evHit(s.E,1)}if(s.pg>=5)s.end=t+.8}},up(s){s.dx=null},
    k(s){return s.ok/5},
    draw(g,s,t){mR(g,'#e8dcc0',0,0,MGW,53);mR(g,'#a8743f',18,6,84,42);mR(g,'#fff6ea',20,8,39,38);mR(g,'#fff6ea',61,8,39,38);const ft=t-s.flip;if(ft<.25)mR(g,'#f4e9d2',61-Math.round(ft*160),8,Math.round(39-ft*150)>0?Math.round(39-ft*150):1,38);
      for(let i=0;i<5;i++)mR(g,'#c9b89a',24,14+i*6,30,1);const a=Math.min(1.3,(t-s.t0)/1.6);for(let i=0;i<5;i++)mR(g,'#c9b89a',65,14+i*6,Math.round(Math.max(0,Math.min(1,a*5-i))*30),1);mR(g,a>=.8&&a<=1.25?'#a8f08a':'#d8c8a8',94,40,4,4);mgDots(g,s.ok,5)}},
  ocha:{t:'しゃか、しゃか',h:'左右に、すばやくなでて、あわをたてる',init(s){s.f=0;s.sum=0;s.n=0;s.px=null;s.dir=0;s.run=0;s.fx=[];s.ht=0},
    down(s,t,x){s.px=x},move(s,t,x,y,dn){if(!dn||s.px==null)return;const d=x-s.px;s.px=x;if(Math.abs(d)<.5)return;const dir=d>0?1:-1;s.run+=Math.abs(d);if(dir!==s.dir){if(s.run>14){s.f=Math.min(1,s.f+.07);sfx('notch')}s.dir=dir;s.run=0}},up(s){s.px=null},
    tick(s,dt,t){s.f=Math.max(0,s.f-.12*dt);s.sum+=s.f*dt;s.n+=dt;if(s.f>.6){s.ht+=dt;if(s.ht>1.5){s.ht=0;mPop(s,60,22,t);evHit(s.E,1)}}},k(s){return s.n?Math.min(1,s.sum/s.n*1.8):0},
    draw(g,s,t){mR(g,'#e8dcc0',0,0,MGW,53);mR(g,'#5c4a32',36,24,48,22);mR(g,'#7a9a4a',40,26,40,8);const n=Math.round(s.f*14);for(let i=0;i<n;i++)mR(g,'#e8f0c8',42+((i*7)%36),25+((i*3)%6),3,2);mR(g,'#c9965c',58+Math.round(Math.sin(t*16)*s.f*10),6,3,20);mgBar(g,4,4,30,4,s.f,'#a8f08a');mFx(g,s,t)}}};
/* ---------- 指あそびがうまくいったとき、村の中でもおきること ---------- */
function evHit(E,q){if(!E||S.ev!==E||!E.ph)return;const P=evPeople(E),r=pick(P),c=E.c||evTemple(),now=performance.now();
  const at=(n,x,y,col)=>fxSpr(n,x*TS,y*TS,col);
  switch(E.id){
    case'taiso':case'ensoku':case'oni':case'soji':if(r){JUMP.set(r,now);at('twinkle',r.x,r.y-.6);if(E.id==='oni')addFloat(r.x,r.y-1.6,'タッチ！','#ffe7a8')}break;
    case'mizu':if(r)at('splash',r.x,r.y-.2);break;
    case'pikunikku':if(r)at('hearts',r.x,r.y-1);break;
    case'hana':if(r)at('petals',r.x,r.y-.5);break;
    case'cha':case'ocha':case'onsen':if(r)at('steam',r.x,r.y-.6);break;
    case'camp':case'himatsuri':at('embers',c[0],c[1]-.3);if(E.id==='himatsuri')EVV.rip.push({x:c[0],y:c[1],t:now});break;
    case'taikokai':EVV.rip.push({x:c[0],y:c[1],t:now});if(r)JUMP.set(r,now);break;
    case'hokomairi':at('glspark',c[0],c[1]-.4);break;
    case'matoate':at('arrowhit',c[0],c[1]-.4);break;
    case'hoshi':EVV.met.push({t:now,x:.55+Math.random()*.4,y:.05+Math.random()*.12});break;
    case'lantern':if(r)EVV.lan.push({x:r.x,y:r.y-1,t:now,s:Math.random()*6});break;
    case'hanabi':at('hanabi',c[0]+(Math.random()-.5)*6,c[1]-2.5-Math.random()*2,pick(HANABIC));break;
    case'gochi':E.dn=(E.dn||0)+1;sfx('plate');break;
    case'shukaku':E.pile=(E.pile||0)+1;break;
    case'utage':if(r){at('twinkle',r.x,r.y-1);JUMP.set(r,now)}break;
    case'undo':if(r){JUMP.set(r,now);addFloat(r.x,r.y-1.6,'はいった！','#ffe7a8')}break;
    case'yomi':E.pic=(E.pic||0)+1;break;
    case'takara':{const L=(E.tr||[]).filter(t=>!t.got);if(L.length){const t=pick(L);E.hint=t.j;at('twinkle',t.j%W+.5,((t.j/W)|0)+.3)}break}}}
/* ---------- 1秒ごと（evTick から）：山場と、ときどきの粒 ---------- */
function evShowTick(E,P){if(!evShowOn(E)||E.ph!=='do')return;const D=EVENTS[E.id],now=performance.now(),c=E.c||evTemple();
  const dur=E.legs?D.dur/E.legs.length:D.dur,p=(S.t-E.t0)/dur,lastLeg=!E.legs||E.leg>=E.legs.length-1;
  const want=E.id==='soji'?.85:E.id==='ensoku'?.5:E.id==='takara'||E.id==='undo'?2:EVCLXP;
  if(!E.cx&&lastLeg&&p>=want)evShowClimax(E,P);
  if(Math.random()<.5){const r=pick(P);if(r){const f={soji:'twinkle',cha:'steam',ocha:'steam',onsen:'steam',utage:'steam',camp:'embers',himatsuri:'embers',hana:'petals',pikunikku:'twinkle',mizu:'splash'}[E.id];if(f)fxSpr(f,(f==='embers'?c[0]:r.x)*TS,(f==='embers'?c[1]-.3:r.y-.7)*TS)}}
  if(E.id==='lantern'&&Math.random()<.4){const r=pick(P);if(r)EVV.lan.push({x:r.x,y:r.y-1,t:now,s:Math.random()*6})}
  if((E.id==='taikokai'||E.id==='himatsuri')&&Math.random()<.6)EVV.rip.push({x:c[0],y:c[1],t:now});
  if(E.id==='hoshi'&&Math.random()<.15)EVV.met.push({t:now,x:.55+Math.random()*.4,y:.05+Math.random()*.12});
  if(E.id==='shukaku'&&!E.cx&&Math.random()<.4)E.pile=(E.pile||0)+1;
  if(E.id==='gochi'&&!E.cx&&Math.random()<.35)E.dn=(E.dn||0)+1}
const EVCLXTX={taiso:'ばんざーい！',soji:'ぴっかぴか！',oni:'タッチ！',ensoku:'はい、ぱしゃっ！',gochi:'ごちそうさま！',takara:'ぜんぶ、見つけた！',yomi:'おしまい。',mizu:'にじだ！',camp:'ぼうっ！',cha:'ほっ……。',hoshi:'流れ星！',onsen:'ぽかぽか～',matoate:'まんなか！',pikunikku:'ごろーん',taikokai:'どどーん！',ocha:'いい香り',hokomairi:'光がおりてきた',undo:'',hana:'花びらの雨！',lantern:'とんでけー！',shukaku:'山もり！',himatsuri:'火がのぼる！',utage:'かんぱーい！',hanabi:'どーん！'};
const EVCLXPOSE={taiso:'qrain',soji:'talkjoy',oni:'talkjoy',ensoku:'qlookup',gochi:'pray',takara:'talkjoy',yomi:'clap',mizu:'qrain',camp:'qwarm',cha:'talkjoy',hoshi:'qlookup',onsen:'sunset',matoate:'talkjoy',pikunikku:'sunset',taikokai:'qrain',ocha:'talkthink',hokomairi:'pray',undo:'clap',hana:'dance',lantern:'qlookup',shukaku:'qrain',himatsuri:'qrain',utage:'qrain',hanabi:'qlookup'};
function evShowClimax(E,P){if(E.cx)return;E.cx=1;E.cxS=S.t;const now=performance.now(),c=E.c||evTemple();EVV.clx=now;EVV.cid=E.id;if(typeof MEMRUN!=='undefined'&&MEMRUN)return;
  for(const r of P){JUMP.set(r,now+Math.random()*250);r.reactT=Math.max(r.reactT||0,S.t)}
  const at=(n,x,y,col)=>fxSpr(n,x*TS,y*TS,col),id=E.id;
  if(id==='soji'){EVV.shine=now;sfx('chime');for(const r of P)at('twinkle',r.x,r.y-.6)}
  else if(id==='ensoku'){setTimeout(()=>{if(S.ev!==E)return;EVV.flash=performance.now();sfx('stamp');evPhoto(E,'遠足')},1400);j3Ding(7,0,.5)}
  else if(id==='hoshi'){for(let i=0;i<8;i++)setTimeout(()=>EVV.met.push({t:performance.now(),x:.4+Math.random()*.55,y:.03+Math.random()*.15}),i*320);sfx('starkira')}
  else if(id==='hanabi'){for(let i=0;i<6;i++)setTimeout(()=>{if(S.ev===E){at('hanabi',c[0]+(i-2.5)*1.6,c[1]-3-Math.random()*1.5,HANABIC[i%HANABIC.length]);sfx('hanabi')}},i*180);setTimeout(()=>{EVV.flash=performance.now()},700)}
  else if(id==='lantern'){for(const r of P)for(let k=0;k<2;k++)EVV.lan.push({x:r.x+(k-.5)*.6,y:r.y-1,t:now+k*300,s:Math.random()*6});sfx('chime')}
  else if(id==='hana'){for(let i=0;i<60;i++)EVV.pet.push({x:Math.random(),y:-Math.random()*.6,v:.04+Math.random()*.05,s:Math.random()*6,c:Math.random()<.6?'#ff9fb8':'#fff0a0'});for(const r of P)at('petals',r.x,r.y-.5)}
  else if(id==='camp'||id==='himatsuri'){for(let i=0;i<4;i++)setTimeout(()=>at('embers',c[0]+(Math.random()-.5),c[1]-.3-i*.4),i*150);sfx('crackle')}
  else if(id==='taikokai'){for(let i=0;i<3;i++)setTimeout(()=>{EVV.rip.push({x:c[0],y:c[1],t:performance.now(),big:1});sfx('bonk')},i*260)}
  else if(id==='hokomairi'||id==='matoate'||id==='takara'){at(id==='matoate'?'arrowhit':'glspark',c[0],c[1]-.4);if(typeof juiceGlowAt==='function')juiceGlowAt(c[0]-.5,c[1]-.5,2,false);sfx(id==='matoate'?'stamp':'chime')}
  else if(id==='mizu'){for(const r of P)at('splash',r.x,r.y-.3);sfx('water')}
  else if(id==='gochi'||id==='utage'||id==='cha'||id==='ocha'){for(let i=0;i<3;i++)j3Ding(12+i*4,i*.1,.45);for(const r of P)at(id==='gochi'?'twinkle':'steam',r.x,r.y-.8)}
  else{for(const r of P)at(id==='pikunikku'?'hearts':'twinkle',r.x,r.y-.8);sfx('clap')}
  if(id==='yomi'||id==='taiso'||id==='shukaku')sfx('clap');
  if(id!=='ensoku')setTimeout(()=>{if(S.ev===E)evPhoto(E)},900)}
function evShowPose(r){const E=S&&S.ev;if(!E||!EVV.clx||EVV.cid!==E.id||performance.now()-EVV.clx>EVCLXMS||!(E.who||[]).includes(r.id))return null;return EVCLXPOSE[E.id]||null}
function evPhoto(E,nm){if(typeof phWant!=='function'||!E)return;if(PHPR.ev==null)PHPR.ev=2.5;const B=EVV.box||evBoxOf(E);phWant('ev',{x0:B.x0-1,y0:B.y0-2,x1:B.x1+1,y1:B.y1+1},nm||EVENTS[E.id].n)}
/* ---------- おわり ---------- */
function evShowEnd(E,tags){const now=performance.now(),D=EVENTS[E.id];if(typeof MEMRUN!=='undefined'&&MEMRUN)return;if(E.id==='undo'||!E.cx){EVV.clx=now;EVV.cid=E.id}
  const gap=450,t1=500+tags.length*gap;EVV.end={t0:now,tags,id:E.id,c:E.c||evTemple(),t1,n:D.n};
  for(const T of tags){T.r.reactT=Math.max(T.r.reactT||0,S.t+12);JOYU.set(T.r,now+t1+2400)}
  tags.forEach((T,i)=>setTimeout(()=>{if(EVV.end&&EVV.end.tags===tags){sfx('ostamp');if(S.res.includes(T.r))JUMP.set(T.r,performance.now())}},500+i*gap+220));
  setTimeout(()=>{if(!EVV.end||EVV.end.tags!==tags)return;if(typeof juiceCheer==='function')juiceCheer();sfx('clap');sfx('level')},t1);
  setTimeout(()=>{if(!EVV.end||EVV.end.tags!==tags)return;const b=EVV.back;EVV.back=null;if(b)evCamTo(b[0],b[1],1.6)},t1+3400);
  setTimeout(()=>{if(EVV.end&&EVV.end.tags===tags){EVV.end=null;EVV.id=null}},t1+4400)}
function evShowReset(){const q=document.getElementById('evAsk');if(q)q.remove();EVV.end=null;EVV.id=null;EVV.clx=0;EVV.back=null;EVV.rip=[];EVV.met=[];EVV.lan=[];EVV.pet=[]}
/* ---------- ごほうび（能力のほかに足す物）。かえす：せいれいごとの札の文 ---------- */
function evDayBuff(r,k,v){const d=callDay();if(!r.evb||r.evb.d!==d)r.evb={d};r.evb[k]=(r.evb[k]||0)+v}
function evExtra(E,P){const X={},id=E.id,add=(r,t)=>{X[r.id]=X[r.id]?X[r.id]+'・'+t:t};
  if(id==='taiso')for(const r of P){evDayBuff(r,'work',2);add(r,'きょう、はたらく速さ+2')}
  if(id==='soji'){S.evComf=dayNo()+EVCOMFD;for(const r of P)add(r,'住み心地+5')}
  if(id==='ensoku'){const fl=FLOWERS2.filter(f=>stageItemOK(f)),fd=['berry','apple','donguri'].filter(k=>FOODS[k]);for(const r of P){if(fl.length&&Math.random()<.5){const f=pick(fl);if(!(itemBoxOK()&&addItem(r,f,1)))giveItem(f,1);add(r,BL[f].name+'のたね')}else{const k=pick(fd);if(roomN(r)>0)addCarry(r,k,1);else addFood(k,1);add(r,FOODS[k].name)}}}
  if(id==='takara'){const top=P.slice().sort((a,b)=>((E.find||{})[b.id]||0)-((E.find||{})[a.id]||0))[0];if(top&&((E.find||{})[top.id]||0)>0){if(!(itemBoxOK()&&addItem(top,'fukuro',1)))dropAt(top.x,top.y,'fukuro',1);add(top,'ふしぎなふくろ')}}
  if(id==='yomi')S.evDream=dayNo()+1;
  if(id==='mizu'||id==='cha'||id==='onsen'){const v={mizu:30,cha:20,onsen:50}[id];for(const r of P){r.energy=Math.min(100,(r.energy||0)+v);add(r,'つかれ－'+v)}}
  if(id==='camp'||id==='himatsuri'){const v=id==='camp'?10:20;for(const r of P)if(r.elem==='fire'){evDayBuff(r,'atk',v);add(r,'攻撃力+'+v)}}
  if(id==='hoshi'){const st=S.starN||(S.starN={});st.d=dayNo();st.at=hour()+.15;st.shown=-1}
  if(id==='matoate'){S.inv.arrow=(S.inv.arrow||0)+10;if(P[0])add(P[0],'木の矢10本')}
  if(id==='taikokai')S.evTaiko=callDay();
  if(id==='ocha')for(const r of P){const C=r.jc||(r.jc={});C.ryori=(C.ryori||0)+10;add(r,'料理+10回')}
  if(id==='hokomairi')for(const r of P){evDayBuff(r,'fh',.5);add(r,'たのしさのへりかた0.5倍')}
  if(id==='undo'){const w=E.win[0]>=E.win[1]?0:1,T=P.filter(r=>E.team[r.id]===w);for(const r of T){r.crown=callDay();add(r,'花かんむり')}for(let i=0;i<T.length;i++)for(let k=i+1;k<T.length;k++)bondAdd(T[i],T[k],3)}
  if(id==='hana'){const fl=FLOWERS2.filter(f=>stageItemOK(f)&&f!=='lotus');if(fl.length){const f=pick(fl);giveItem(f,3);if(P[0])add(P[0],BL[f].name+'のたね3つ')}}
  if(id==='shukaku'){for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'&&S.dyn[j])S.dyn[j].fb=(S.dyn[j].fb||0)+1}
  if(id==='hanabi')memo('','みんなで花火を見上げた');
  if(EVBOND[id])for(const r of P)add(r,'なかよし+'+EVBOND[id]);
  return X}
/* イベントの思い出（お話・手紙・日記・雑談） */
function evAfter(E,P){const id=E.id,d=dayNo(),ok=(E.ek||0)>=EVOK,D=EVENTS[id];for(const r of P)r.evm={id,d,ok,told:-1};
  {const Dy=typeof dyCur==='function'&&dyCur();if(Dy)Dy.ev=[id,D.n,P.map(r=>r.id)]}
  const L=P.slice().sort(()=>Math.random()-.5).slice(0,id==='lantern'?2:1);for(const r of L)letterQ(r,'ev',{f:D.n},id)}
function evTopic(r){const m=r.evm;if(!m||dayNo()-m.d>1||m.told===dayNo()||!EVTALK[m.id]||!EVENTS[m.id])return null;m.told=dayNo();
  const L=pickFresh('evt:'+m.id,EVTALK[m.id]).slice();if(m.ok)L.push(...pickFresh('evtok',EVTALKOK).map(t=>t.split('{e}').join(EVENTS[m.id].n)));return{u:1,L}}
function evMemBoth(r,p,id){const a=r.evm,b=p.evm;return !!a&&!!b&&a.id===id&&b.id===id&&a.d===b.d&&dayNo()-a.d<=1}
/* ---------- 見た目：世界の上の層（夜の暗さより上。juice3Draw から） ---------- */
const pR=(c,col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
function evGarland(c,B,kind,t0,now){const x0=(B.x0-1)*TS+8,x1=(B.x1+2)*TS-8,y=(B.y0-1.4)*TS,age=now-t0;pR(c,'#7a5a3a',x0,y-8,2,TS*1.5+8);pR(c,'#7a5a3a',x1-2,y-8,2,TS*1.5+8);
  const len=Math.max(0,Math.min(1,age/700));for(let x=x0+2;x<x0+2+(x1-x0-4)*len;x+=2){const t=(x-x0)/(x1-x0),sag=Math.round(Math.sin(t*Math.PI)*6);pR(c,'#5c4a32',x,y+sag,2,1)}
  const C=kind==='rw'?['#ff5a4a','#ffffff']:kind==='lamp'?['#ff8a5c','#ffb070','#ff6a5c']:kind==='flower'?['#ff9fb8','#fff0a0','#ffffff','#c49cff']:['#ff8a5c','#ffd23f','#7fc6ff','#a8f08a','#ff8fb1'];
  let i=0;for(let x=x0+6;x<x1-8;x+=10,i++){const a=age-250-i*110;if(a<0)break;const t=(x+3-x0)/(x1-x0),sag=Math.round(Math.sin(t*Math.PI)*6),drop=a<160?Math.round((1-a/160)*-6):0,yy=y+sag+1+drop,col=C[i%C.length],sw=Math.floor(now/400+i)%2;
    if(kind==='lamp'){pR(c,'#5c4a32',x+2,yy,1,2);pR(c,col,x,yy+2,6,7);pR(c,'#ffe9a8',x+1,yy+3,4,4);pR(c,'#7a4a2a',x,yy+2,6,1);pR(c,'#7a4a2a',x,yy+8,6,1)}
    else if(kind==='flower'){pR(c,'#7fb070',x+1,yy+3,4,2);pR(c,col,x+1,yy,4,4);pR(c,col,x,yy+1,6,2);pR(c,'#ffd23f',x+2,yy+1,2,2)}
    else for(let k=0;k<6;k++)pR(c,col,x+Math.ceil(k/2)+(sw&&k>3?1:0),yy+k,6-k,1)}}
function evTag(c,x,y,L,a){c.font='10px PixelMplus10, sans-serif';const w=Math.ceil(Math.max(...L.map(t=>c.measureText(t).width)))+10,h=L.length*12+5,x0=Math.round(x-w/2),y0=Math.round(y-h-(a<1?(1-a)*8:0));
  pR(c,'#5c3a22',x0+1,y0+h,w-2,2);pR(c,'#8a5a32',x0,y0,w,h);pR(c,'#c9965c',x0+1,y0+1,w-2,h-2);pR(c,'#ddb07a',x0+1,y0+1,w-2,1);pR(c,'#5c4a32',Math.round(x)-1,y0-5,2,5);
  c.textAlign='center';c.textBaseline='top';L.forEach((t,i)=>{c.fillStyle='#ecd2a4';c.fillText(t,Math.round(x),y0+4+i*12);c.fillStyle='#4a2a14';c.fillText(t,Math.round(x),y0+3+i*12)});return{x0,y0,w,h}}
function evStamp(c,x,y,a){const s=a<1?1+(1-a)*.8:1,r=Math.round(6*s);c.save();c.globalAlpha=Math.min(1,a*2);pR(c,'#d04030',x-r,y-r+1,r*2,r*2-2);pR(c,'#d04030',x-r+1,y-r,r*2-2,r*2);pR(c,'#f4e9d2',x-r+2,y-r+2,r*2-4,r*2-4);pR(c,'#d04030',x-r+3,y-r+3,r*2-6,r*2-6);pR(c,'#f4e9d2',x-1,y-1,2,2);c.restore()}
function evShowDraw(now){const E=S&&S.ev,c=ctx,sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;const live=E&&E.ph&&evShowOn(E)&&EVV.id===E.id,A=EVV.end;
  if((live&&E.ph!=='go'||A)&&EVV.box)evGarland(c,EVV.box,EVDECO[EVV.id]||'flag',EVV.t0,now);
  if(live){const cc=E.c||evTemple(),e=now-EVV.t0;if(e>1300&&e<2700){const u=Math.min(1,(e-1300)/180);cupText(c,'せーの！',cc[0]*TS,(EVV.box.y0-2.4)*TS,2.2+(1-u)*1.4,Math.max(0,Math.min(1,(2700-e)/400)))}
    evProps(c,E,evPeople(E),now);
    if(EVV.clx&&EVV.cid===E.id){const ce=now-EVV.clx,tx=EVCLXTX[E.id];if(tx&&ce<2600){const u=Math.min(1,ce/160);cupText(c,tx,cc[0]*TS,(EVV.box.y0-2.6)*TS,2.4+(1-u)*1.2,Math.max(0,Math.min(1,(2600-ce)/500)))}evClimaxDraw(c,E,cc,ce,now)}}
  if(A){const e=now-A.t0;A.tags.forEach((T,i)=>{const a=(e-500-i*450)/160;if(a<0||!S.res.includes(T.r))return;const b=evTag(c,T.r.x*TS,(T.r.y-1.45)*TS,T.L,Math.min(1,a));const sa=(e-500-i*450-220)/140;if(sa>0)evStamp(c,b.x0+b.w-2,b.y0+2,Math.min(1,sa))});
    if(e>A.t1&&e<A.t1+3000)cupText(c,A.n+'、おしまい！',A.c[0]*TS,(A.c[1]-3.2)*TS,2,Math.max(0,Math.min(1,(A.t1+3000-e)/500)))}
  for(const R of EVV.rip){const a=(now-R.t)/700;if(a>1)continue;const r=Math.round((R.big?14:6)+a*(R.big?60:30)),x=Math.round(R.x*TS),y=Math.round(R.y*TS);c.globalAlpha=1-a;for(let k=0;k<16;k++){const an=k/16*Math.PI*2;pR(c,'#ffe9a8',x+Math.cos(an)*r,y+Math.sin(an)*r*.55,2,2)}c.globalAlpha=1}
  EVV.rip=EVV.rip.filter(R=>now-R.t<700);
  for(const L of EVV.lan){const a=(now-L.t)/1000;if(a<0)continue;const x=Math.round((L.x+Math.sin(a*1.3+L.s)*.25)*TS),y=Math.round((L.y-a*.7)*TS);c.globalAlpha=Math.max(0,Math.min(1,(9-a)/2));pR(c,'#ff8a5c',x-3,y-4,6,8);pR(c,'#ffe9a8',x-2,y-3,4,5);pR(c,'#7a4a2a',x-3,y+4,6,1);c.globalAlpha=1}
  EVV.lan=EVV.lan.filter(L=>now-L.t<9000);if(EVV.lan.length>40)EVV.lan.splice(0,EVV.lan.length-40);
  c.imageSmoothingEnabled=sm;evScreenDraw(now)}
let EVDISH=null;function evDishes(){if(!EVDISH){EVDISH=(typeof COOKD!=='undefined'?COOKD:[]).filter(d=>FOODS[d.id]&&!/^fsg/.test(d.id)&&!(d.f&&d.f.bad)).map(d=>d.id).slice(0,24);if(!EVDISH.length)EVDISH=['berry','apple']}return EVDISH}
/* 小道具（する、のあいだ） */
function evProps(c,E,P,now){const cc=E.c||evTemple(),X=cc[0]*TS,Y=cc[1]*TS;
  if(E.id==='oni'&&P.length>1){const o=P[Math.floor((S.t-E.t0)/9)%P.length];if(o){const x=Math.round(o.x*TS),y=Math.round((o.y-1.55)*TS)+(Math.floor(now/300)%2);pR(c,'#d04030',x-3,y,6,4);pR(c,'#d04030',x-1,y-3,2,3);pR(c,'#ffe9a8',x-1,y+1,2,1)}if(EVV.oni!==o.id){if(EVV.oni!=null){addFloat(o.x,o.y-1.8,'タッチ！','#ffe7a8');sfx('pat')}EVV.oni=o.id}}
  if(E.id==='yomi'&&E.reader!=null){const r=P.find(q=>q.id===E.reader);if(r){const x=Math.round(r.x*TS),y=Math.round((r.y-1.9)*TS),k=(Math.floor((S.t-E.t0)/6)+(E.pic||0))%4;pR(c,'#5c4a32',x-12,y-15,24,18);pR(c,'#fff6ea',x-11,y-14,22,16);pR(c,'#fff6ea',x-2,y+3,4,2);
    if(k===0){pR(c,'#7fb070',x-6,y-11,12,8);pR(c,'#8a5a32',x-1,y-3,2,4)}else if(k===1){pR(c,'#ffd86a',x-4,y-11,8,8);pR(c,'#fff6ea',x-1,y-12,6,6)}else if(k===2){pR(c,'#9a9aa0',x-6,y-8,12,7);pR(c,'#9a9aa0',x-4,y-11,2,3);pR(c,'#9a9aa0',x+2,y-11,2,3);pR(c,'#ff6a5c',x-1,y-12,2,2)}else{pR(c,'#7fc6ff',x-7,y-5,14,3);pR(c,'#ffffff',x-3,y-9,6,4)}}}
  if(E.id==='gochi'&&E.tab){const n=Math.min(12,(E.dn||0)+2)-(E.cx?Math.floor((S.t-E.cxS)/2):0),T=[...new Set(Object.values(E.tab))];let i=0;for(const t of T){for(const[x,y]of fp(S.obj[t],t%W,(t/W)|0))for(let k=0;k<2;k++,i++){if(i>=n)break;const DL=evDishes(),im=cupImg(DL[i%DL.length],'cup4');const px=x*TS+4+k*13,py=y*TS-8;pR(c,'#ffffff',px-1,py+10,14,3);if(im.complete&&im.naturalWidth){c.imageSmoothingEnabled=true;c.drawImage(im,px,py,12,12);c.imageSmoothingEnabled=false}else pR(c,'#ff8a5c',px+2,py+4,8,6)}}}
  if(E.id==='shukaku'){const n=Math.min(10,(E.pile||0)+1),C=['mugi','imo','tomato'];for(let i=0;i<n;i++){let row=0,k=i,w=4;while(k>=w){k-=w;w--;row++}const im=cupImg(C[i%3],'cup4'),px=X-w*7+k*14,py=Y-8-row*9;if(im.complete&&im.naturalWidth){c.imageSmoothingEnabled=true;c.drawImage(im,px,py,14,14);c.imageSmoothingEnabled=false}else pR(c,'#ffd23f',px+2,py+2,10,10)}}
  if(E.id==='hokomairi'){const a=.5+Math.sin(now/500)*.2;c.globalAlpha=a*.6;pR(c,'#fff3a0',X-6,Y-120,12,110);pR(c,'#ffffff',X-2,Y-120,4,110);c.globalAlpha=1}
  if(E.id==='mizu')for(let k=0;k<2;k++){const r1=P[k],r2=P[k+1];if(!r1||!r2)continue;const a=((now/900)+k*.5)%1,x=(r1.x+(r2.x-r1.x)*a)*TS,y=(r1.y+(r2.y-r1.y)*a-.8-Math.sin(a*Math.PI)*1.2)*TS;pR(c,'#cfefff',x-1,y-1,3,3);pR(c,'#7fc6ff',x-3,y+2,2,2)}
  if(E.id==='pikunikku')for(let k=0;k<2;k++){const t=now/1000+k*2.1,x=X+Math.cos(t*.8)*40,y=Y-30+Math.sin(t*1.7)*10,w=Math.floor(now/120+k)%2;pR(c,'#ffd23f',x-1,y-1,2,4);pR(c,k?'#ff8fb1':'#ffffff',x-(w?5:4),y-3,w?4:3,4);pR(c,k?'#ff8fb1':'#ffffff',x+1,y-3,w?4:3,4)}
  if(E.id==='matoate'){const n=Math.min(8,Math.floor((S.t-E.t0)/4));for(let i=0;i<n;i++){const ax=X+((i*7)%11)-5,ay=Y-14+((i*5)%9)-4;pR(c,'#7a4a2a',ax,ay,1,7);pR(c,'#ffffff',ax-1,ay+6,3,2)}}
  if(E.id==='camp'||E.id==='himatsuri'){const h=E.id==='himatsuri'?20:12,f=Math.round(Math.sin(now/90)*2);pR(c,'#ff6a3c',X-6,Y-h-6+f,12,h);pR(c,'#ffd23f',X-3,Y-h*.6-6+f,6,h*.6)}}
function evClimaxDraw(c,E,cc,ce,now){const X=cc[0]*TS,Y=cc[1]*TS;
  if(E.id==='mizu'&&ce<6000){const a=Math.min(1,ce/600)*Math.min(1,(6000-ce)/800);c.globalAlpha=a*.85;const C=['#ff8a8a','#ffb070','#ffe066','#a8f08a','#8ac8ff','#c49cff'];C.forEach((col,i)=>{const R=70-i*4;for(let k=0;k<=40;k++){const an=Math.PI+k/40*Math.PI;pR(c,col,X+Math.cos(an)*R,Y-20+Math.sin(an)*R*.7,3,3)}});c.globalAlpha=1}
  if((E.id==='camp'||E.id==='himatsuri')&&ce<2500){const h=Math.round((E.id==='himatsuri'?70:46)*Math.sin(Math.min(1,ce/2500)*Math.PI));pR(c,'#ff6a3c',X-9,Y-6-h,18,h);pR(c,'#ffd23f',X-4,Y-6-h*.8,8,h*.7);pR(c,'#ffffff',X-1,Y-6-h*.5,2,h*.3)}
  if(E.id==='hokomairi'&&ce<3000){const a=Math.sin(Math.min(1,ce/3000)*Math.PI);c.globalAlpha=a;pR(c,'#fff3a0',X-14,Y-160,28,150);pR(c,'#ffffff',X-5,Y-160,10,150);c.globalAlpha=1}
  if(E.id==='takara'&&ce<3500){const o=Math.min(1,ce/600);pR(c,'#8a5a32',X-10,Y-10,20,12);pR(c,'#c9965c',X-9,Y-9,18,10);pR(c,'#ffd23f',X-2,Y-6,4,4);pR(c,'#8a5a32',X-10,Y-10-Math.round(o*8),20,4);c.globalAlpha=o*.7;pR(c,'#fff3a0',X-6,Y-60,12,50);c.globalAlpha=1}}
/* 画面の層：大そうじの光のすじ・流れ星・花びら・写真の光 */
function evScreenDraw(now){if(!EVV.shine&&!EVV.met.length&&!EVV.pet.length&&!EVV.flash)return;const c=ctx,T=c.getTransform();c.setTransform(dpr,0,0,dpr,0,0);const P=2;
  if(EVV.shine){const a=(now-EVV.shine)/1600;if(a>1)EVV.shine=0;else{c.globalAlpha=.35*Math.sin(a*Math.PI);c.fillStyle='#fff6d0';const x=-VH+a*(VW+VH*2);for(let y=0;y<VH;y+=P)c.fillRect(Math.round((x+y*.6)/P)*P,y,60,P);c.globalAlpha=1}}
  for(const m of EVV.met){const a=(now-m.t)/900;if(a>1)continue;const x=(m.x-a*.35)*VW,y=(m.y+a*.18)*VH;c.globalAlpha=Math.min(1,(1-a)*2);for(let i=0;i<14;i++){c.fillStyle=i<4?'#ffffff':'#ffe9a8';c.fillRect(Math.round((x+i*3*1.9)/P)*P,Math.round((y-i*3)/P)*P,P,P)}c.globalAlpha=1}
  EVV.met=EVV.met.filter(m=>now-m.t<900);
  if(EVV.pet.length){for(const p of EVV.pet){p.y+=p.v/60;p.x+=Math.sin(now/600+p.s)*.0008;c.fillStyle=p.c;c.fillRect(Math.round(p.x*VW/P)*P,Math.round(p.y*VH/P)*P,P*2,P)}EVV.pet=EVV.pet.filter(p=>p.y<1.05)}
  if(EVV.flash){const a=(now-EVV.flash)/350;if(a>1)EVV.flash=0;else{c.globalAlpha=(1-a)*.55;c.fillStyle='#ffffff';c.fillRect(0,0,VW,VH);c.globalAlpha=1}}
  c.setTransform(T)}
/* 地面の層：体そうのお立ち台 */
function evShowGround(){const E=S&&S.ev;if(!E||E.id!=='taiso'||E.ph!=='do'||!E.who)return;const r=S.res.find(q=>q.id===E.who[0]);if(!r)return;const x=Math.round(r.x*TS),y=Math.round(r.y*TS);pR(ctx,'#5c3a22',x-12,y-2,24,7);pR(ctx,'#c9965c',x-11,y-3,22,5);pR(ctx,'#ddb07a',x-11,y-3,22,1)}
/* ---------- 文をつなぐ（読みこむときに1回）：手紙・雑談・日記 ---------- */
LETTERK.ev='イベントのこと';/* イベントの手紙の文は letter-data.js の LETTERD.ev（イベント→属性→5通、1通まるごと） */
if(typeof EVCHAT!=='undefined')for(const id of Object.keys(EVCHAT).sort())for(const ch of EVCHAT[id])CHATS.push(Object.assign(ch,{evc:1,ok:(r,p)=>evMemBoth(r,p,id)}));/* CHATS の番号はセーブに入るので、うしろに足すだけ（id の名前の順） */
if(typeof EVDY!=='undefined'){Object.assign(DYFULL,EVDY);Object.assign(DYBODY,EVDYB)}
