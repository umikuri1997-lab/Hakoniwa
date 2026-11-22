'use strict';
/* ---------- 大会（events.js の cup0〜cup7）の演出と、守り神が応援するミニゲーム ----------
   流れ：あつまる（会場に旗）→ 応援するせいれいを1人えらぶ（cupCheerAsk）→ はじまりの合図「3・2・1・どん！」（cupBegin、実時間 CUPCD）
   → 大会（応援した子がいれば、大会ごとのミニゲーム cupMG を実時間 CUPMGT。うまくできたほど E.ck が大きく、その子の記録が少しよくなる）
   → 実況（いまの1位）・声援 → ものづくり・料理は作品の審査 → 表彰台（cupAward）→ ごほうび（作った物・とれた物は、せいれいがはこぶ cupLoot）。
   見た目・音は実時間。大会の進み（E.sc など）は村の時間。 */
const CUPIDS=['cup0','cup1','cup2','cup3','cup4','cup5','cup6','cup7'];
const CUPCD=2600,CUPMGT=10000,CUPAWD=7000;/* 合図・ミニゲーム・表彰（ミリ秒） */
const CHEERK={cup0:.35,cup1:30,cup2:.4,cup3:.3,cup4:.4,cup5:.4,cup6:.4,cup7:.4};/* 応援がうまくいったとき（E.ck=1）の、記録のよくなり方（すもうは強さ+30、ほかは倍の増し） */
Object.assign(EVENTS,{
  cup4:{n:'料理大会',cup:1,at:10,dur:30,stat:'work',rank:[4,3,2,1],pt:30,per:0,gain:{work:4},d:'みんなで、それぞれ1皿ずつ料理を作る。作った料理をもらう',gainTxt:'はたらく速さ　1位+4・2位+3・3位+2・出ただけ+1・作った料理をもらう',talk:['とんとん、ことこと。','#joy|いいにおい！','もうすこしで、できあがり！']},
  cup5:{n:'木こり大会',cup:1,at:10,dur:30,stat:'sta',rank:[4,3,2,1],pt:30,per:0,gain:{sta:4},need:'trees',d:'木のそばで、どれだけ木材を切りだせるか、きそう。とれた木材をもらう',gainTxt:'スタミナ　1位+4・2位+3・3位+2・出ただけ+1・とれた木材をもらう',talk:['えいっ、えいっ！','#joy|まだまだ切れるよ！','ふう、いい汗！']},
  cup6:{n:'釣り大会',cup:1,at:10,dur:30,stat:'work',rank:[4,3,2,1],pt:30,per:0,fun:20,gain:{work:4},need:'water',d:'水べにならんで、どれだけ魚をつれるか、きそう。つれた魚をもらう',gainTxt:'たのしさ+20・はたらく速さ　1位+4・2位+3・3位+2・出ただけ+1・つれた魚をもらう',talk:['しーっ、しずかに……。','#joy|かかった！','つぎこそ、大物！']},
  cup7:{n:'採掘大会',cup:1,at:10,dur:30,stat:'atk',rank:[20,15,10,5],pt:30,per:0,gain:{atk:20},need:'rocks',d:'岩のそばで、どれだけ石をほりだせるか、きそう。とれた石材をもらう',gainTxt:'攻撃力　1位+20・2位+15・3位+10・出ただけ+5・とれた石材をもらう',talk:['かーん、かーん！','#joy|いい石が出た！','かたいなあ、この岩！']}});
for(const k of['cup0','cup1','cup2','cup3'])EVENTS[k].pt=30;/* 依頼ボードでひらくとき（季節の5日めの大会は、ただ） */
EVENTS.cup0.d='コースを走って、速さをきそう';EVENTS.cup1.d='ひろばで、2人ずつ勝ちぬきのすもう';EVENTS.cup2.d='みんなで、それぞれ1つずつ家具を作る。作った家具をもらう';EVENTS.cup3.d='コースを行ったり来たりして、たくさんはこぶ';
EVENTS.cup2.gainTxt+='・作った家具をもらう';
Object.assign(EVNEED,{trees:{n:'木',list:()=>cupTargets(5).length?[-1]:[],cap:()=>99},water:{n:'水べ',list:()=>cupTargets(6).length?[-1]:[],cap:()=>99},rocks:{n:'岩',list:()=>cupTargets(7).length?[-1]:[],cap:()=>99}});
const CUPTREE=new Set(['tree','ntree','deadtree','fruit']),CUPROCK=new Set(['rock','boulder']);
function cupTargets(n){/* 木こり・釣り・採掘の、そばに立つ物（マス） */const L=[];for(let j=0;j<W*H;j++){if(fogAt(j))continue;if(n===5&&CUPTREE.has(S.obj[j])||n===7&&CUPROCK.has(S.obj[j])||n===6&&S.ground[j]===1&&!S.obj[j])L.push(j)}return L}
/* 会場：木こり・釣り・採掘は、その物のとなりに1人ずつ（E.tg：向く物のマス）。events.js の cupStart からよぶ */
function cupNearStart(E,L,G,tx,ty){const n=+E.id.slice(3),T=new Set(cupTargets(n)),C=[];
  for(let j=0;j<W*H;j++){if(G.dist[j]<0||G.dist[j]>60||!walk(j)||S.obj[j]||S.ground[j]||sacredNoBuild(j))continue;const t=adjOf(j,k=>T.has(k));if(t<0)continue;C.push([Math.hypot(j%W+.5-tx,((j/W)|0)+.5-ty),j,t])}
  if(!C.length)return false;C.sort((a,b)=>a[0]-b[0]);const c0=C[0][1],X=c0%W,Y=(c0/W)|0;C.sort((a,b)=>Math.hypot(a[1]%W-X,((a[1]/W)|0)-Y)-Math.hypot(b[1]%W-X,((b[1]/W)|0)-Y));/* いちばん近い所のまわりに、まとまって */
  const used=[];E.tg={};let i=0;for(const[,j,t]of C){if(i>=L.length)break;if(used.some(k=>Math.abs(k%W-j%W)+Math.abs(((k/W)|0)-((j/W)|0))<2))continue;used.push(j);E.slot[L[i].id]=j;E.tg[L[i].id]=t;i++}
  if(i<CUPMIN)return false;let x=0,y=0;for(const j of used){x+=j%W+.5;y+=((j/W)|0)+.5}E.c=[x/used.length,y/used.length];return true}
/* 作品：ものづくり＝おぼえている家具から1つ、料理＝その子の属性の料理から1皿 */
function cupCraftPick(r){const K=Object.keys(S.recipes||{}).filter(id=>S.recipes[id]&&BL[id]&&BL[id].kind==='furn'&&!BL[id].offerOnly&&!BL[id].trap&&!BL[id].chest&&!BL[id].shopOnly&&!BL[id].kwr);return K.length?pick(K):'stool'}
function cupDishPick(r){const L=COOKD.filter(d=>FOODS[d.id]),M=L.filter(d=>d.el===r.elem);return (pick(M.length?M:L)||{id:'salad'}).id}
/* ---------- 応援するせいれいをえらぶ（あつまるとき） ---------- */
function cupCheerAsk(E){if(typeof MEMRUN!=='undefined'&&MEMRUN||!started||document.getElementById('cupCheer'))return;const D=EVENTS[E.id],L=E.who.map(id=>S.res.find(r=>r.id===id)).filter(Boolean);if(!L.length)return;
  const o=el('<div id="cupCheer" style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.3);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:15px;margin-bottom:4px"></b><p class="note" style="margin:0 0 8px">だれを応援する？</p><div class="ks" style="display:flex;flex-wrap:wrap;gap:6px"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn x">見ているだけ</button></div></div></div>');
  o.querySelector('.t').textContent=D.n;
  for(const r of L){const b=el('<button class="btn"></button>');b.textContent=r.name;b.onclick=()=>{sfx('stamp');if(S.ev===E){E.cheer=r.id;JUMP.set(r,performance.now());addFloatG(r.x,r.y,-1.6,'がんばる！','#ffe7a8')}o.remove()};o.querySelector('.ks').appendChild(b)}
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};document.body.appendChild(o)}
/* ---------- はじまりの合図・実況（実時間） ---------- */
const CUPV={cd:0,id:null,mg:null,lead:null,leadT:0,cheerT:0,aw:null,fl:null};
function cupBegin(E,P){CUPV.cd=performance.now();E.cdT=S.t;{const q=document.getElementById('cupCheer');if(q)q.remove()}/* えらばないまま、はじまったら、見ているだけ */CUPV.id=E.id;CUPV.lead=null;CUPV.leadT=performance.now()+4000;E.ck=0;E.item={};E.loot={};E.pg={};
  if(E.id==='cup2')for(const r of P)E.item[r.id]=cupCraftPick(r);if(E.id==='cup4')for(const r of P)E.item[r.id]=cupDishPick(r);
  if(!(camAnim&&camAnim.done)&&E.c)panTo(E.c[0]*TS,E.c[1]*TS);
  if(typeof AC!=='undefined'&&AC)[0,1,2].forEach(i=>j3Ding(i===2?7:0,i*.65,.5));setTimeout(()=>{if(S.ev===E){sfx('stamp');j3Ding(12,.05,.6);j3Ding(19,.12,.5);for(const r of P)JUMP.set(r,performance.now()+Math.random()*200)}},1950)}
function cupHold(){const E=S&&S.ev;return !!CUPV.cd&&performance.now()-CUPV.cd<CUPCD&&!!E&&E.cdT!=null&&S.t-E.cdT<4}/* 合図のあいだは、まだ走らない（実時間の合図か、村の時間4分の、早いほう） */
function cupLive(E,P){/* 1秒ごと（cupTick から）：ミニゲームをはじめる・いまの1位の実況・声援 */
  const now=performance.now();if(!CUPV.cd)CUPV.cd=now-CUPCD;/* 読みこみなおしたあとは、合図なし */
  if(!CUPV.mg&&!E.mgDone&&E.cheer!=null&&now-CUPV.cd>=CUPCD){E.mgDone=1;const r=P.find(q=>q.id===E.cheer);if(r)cupMGOpen(E,r)}
  if(now>CUPV.leadT&&E.id!=='cup1'){CUPV.leadT=now+6000;const R=cupRanks(E,P),r=P.find(q=>q.id===R[0]);if(r&&r.id!==CUPV.lead&&(E.id==='cup0'?r.x>E.tk.x+1:(E.sc[r.id]||0)>0)){CUPV.lead=r.id;addFloatG(E.c[0],E.c[1],-2.6,'いま、'+r.name+'が1位！','#ffe58a');sfx('tink')}}
  if(now>CUPV.cheerT){CUPV.cheerT=now+3500+Math.random()*3000;const w=S.res.filter(q=>!q.hidden&&!P.includes(q)&&Math.hypot(q.x-E.c[0],q.y-E.c[1])<9).concat(E.id==='cup1'?P.filter(q=>!(E.pairs||[]).some(p=>p.includes(q.id))):[]);const q=pick(w);if(q){addFloatG(q.x,q.y,-1.5,pick(['がんばれー！','いけいけー！','すごいすごい！','ファイトー！']),'#fff3d6');JUMP.set(q,now);sfx('clap')}}}
/* ---------- ミニゲーム（応援）：大会ごとにちがう遊び。10秒。うまくできたほど E.ck（0〜1） ---------- */
const MGW=120,MGH=56;
const CUPMG={
  cup0:{t:'連打で声援！',h:'画面をたくさんタップすると、速く走る',init(s){s.m=0;s.sum=0;s.n=0},tap(s){s.m=Math.min(1,s.m+.12);sfx('notch')},tick(s,dt){s.m=Math.max(0,s.m-.35*dt);s.sum+=s.m*dt;s.n+=dt},k(s){return s.n?Math.min(1,s.sum/s.n*1.4):0},live(s){return s.m},
    draw(g,s,t){mgBar(g,8,40,104,6,s.m,'#ff8a5c');const x=8+Math.round(((t*(30+s.m*120))%104));mgBlob(g,x,24,'#7fc6ff');for(let i=0;i<3;i++)if(s.m>.3)g.fillRect(x-6-i*4,28,2,1)}},
  cup1:{t:'気合いのゲージ！',h:'ゆれる印がまん中に来たらタップ。3回',init(s){s.tr=[]},tap(s,t){if(s.tr.length>=3)return;const p=Math.sin(t*3.4);s.tr.push(1-Math.abs(p));sfx(Math.abs(p)<.2?'stamp':'notch');if(s.tr.length>=3)s.end=t+.6},k(s){return s.tr.reduce((a,b)=>a+b,0)/3},
    draw(g,s,t){g.fillStyle='#e9d8b4';g.fillRect(8,22,104,12);g.fillStyle='#a8f08a';g.fillRect(54,22,12,12);const p=s.tr.length>=3?0:Math.sin(t*3.4);g.fillStyle='#7a4a2a';g.fillRect(59+Math.round(p*48),18,2,20);mgDots(g,s.tr.length,3)}},
  cup2:{t:'トンカチのリズム！',h:'トンカチが板にあたる合図でタップ',init(s){s.hit=0;s.beats=0;s.last=-1},tap(s,t){const b=Math.round(t/.7),d=Math.abs(t-b*.7);if(d<.13&&b!==s.last){s.hit++;s.last=b;sfx('nail')}else sfx('notch')},tick(s,dt,t){s.beats=Math.floor(t/.7)},k(s){return Math.min(1,s.hit/Math.max(1,s.beats))},
    draw(g,s,t){const ph=(t%.7)/.7,a=ph<.85?(ph/.85):1-(ph-.85)/.15*1;g.fillStyle='#c9965c';g.fillRect(30,40,60,6);g.fillStyle='#8a5a32';g.fillRect(58,Math.round(14+a*20),4,8);g.fillStyle='#6b6b6b';g.fillRect(54,Math.round(12+a*20),12,5);const r=Math.round((1-ph)*14);g.fillStyle='#ffe066';if(r>1){g.fillRect(60-r,38,2,2);g.fillRect(58+r,38,2,2)}mgDots(g,s.hit,Math.max(s.hit,s.beats))}},
  cup3:{t:'バトンわたし！',h:'走ってきたせいれいが光る線に来たらタップ。4回',init(s){s.ok=0;s.n=0;s.t0=0},tap(s,t){if(s.n>=4)return;const x=(t-s.t0)/1.6;const hit=x>.78&&x<.94;if(hit){s.ok++;sfx('stamp')}else sfx('notch');s.n++;s.t0=t+.3;if(s.n>=4)s.end=t+.5},tick(s,dt,t){if((t-s.t0)/1.6>1.1&&s.n<4){s.n++;s.t0=t+.2;if(s.n>=4)s.end=t+.4}},k(s){return s.ok/4},
    draw(g,s,t){g.fillStyle='#e9d8b4';g.fillRect(4,36,112,4);g.fillStyle='#ffe066';g.fillRect(4+Math.round(.78*104),30,Math.round(.16*104),12);const x=Math.max(0,(t-s.t0)/1.6);if(s.n<4)mgBlob(g,4+Math.round(Math.min(1.1,x)*104),26,'#ff8fb1');mgBlob(g,4+Math.round(.9*104)+6,26,'#7fc6ff');mgDots(g,s.ok,4)}},
  cup4:{t:'火かげん！',h:'おしているあいだ火が強くなる。緑の所にたもとう',init(s){s.h=.3;s.in=0;s.n=0;s.dn=false},down(s){s.dn=true},up(s){s.dn=false},tick(s,dt,t){s.h=Math.max(0,Math.min(1,s.h+(s.dn?.7:-.5)*dt));const c=.5+Math.sin(t*.9)*.18;if(Math.abs(s.h-c)<.12)s.in+=dt;s.n+=dt},k(s){return s.n?Math.min(1,s.in/s.n*1.15):0},
    draw(g,s,t){const c=.5+Math.sin(t*.9)*.18;g.fillStyle='#e9d8b4';g.fillRect(100,6,10,44);g.fillStyle='#a8f08a';g.fillRect(100,Math.round(50-(c+.12)*44),10,Math.round(.24*44));g.fillStyle='#ff6a3c';g.fillRect(102,Math.round(50-s.h*44),6,Math.round(s.h*44));g.fillStyle='#8a8a8a';g.fillRect(30,30,40,10);g.fillStyle='#5c5c5c';g.fillRect(28,28,44,3);const f=Math.round(4+s.h*8);for(let i=0;i<5;i++){g.fillStyle=i%2?'#ffb056':'#ff6a3c';g.fillRect(34+i*7,40,4,Math.max(1,f-(i%2)*2))}}},
  cup5:{t:'ねらって、ひとふり！',h:'おのが木の切れ目にとどいたらタップ。5回',init(s){s.tr=[]},tap(s,t){if(s.tr.length>=5)return;const p=Math.sin(t*4.2);s.tr.push(Math.max(0,1-Math.abs(p-1)*2.2));sfx(p>.8?'chop':'notch');if(s.tr.length>=5)s.end=t+.6},k(s){return s.tr.reduce((a,b)=>a+b,0)/5},
    draw(g,s,t){g.fillStyle='#a8743f';g.fillRect(74,6,16,46);g.fillStyle='#ffe066';g.fillRect(70,28,4,4);const p=s.tr.length>=5?1:Math.sin(t*4.2),x=Math.round(20+(p+1)/2*48);g.fillStyle='#8a5a32';g.fillRect(x-14,29,14,2);g.fillStyle='#9aa4ae';g.fillRect(x,25,5,10);mgDots(g,s.tr.length,5)}},
  cup6:{t:'うきが、しずんだら！',h:'うきがしずんだら、すぐタップ。3びき',init(s){s.ok=0;s.n=0;s.bite=1.2+Math.random()*1.6},tap(s,t){if(s.n>=3)return;if(t>=s.bite&&t<s.bite+.55){s.ok++;sfx('catch')}else sfx('fishbite');s.n++;s.bite=t+1+Math.random()*1.8;if(s.n>=3)s.end=t+.6},tick(s,dt,t){if(s.n<3&&t>s.bite+.55){s.n++;s.bite=t+1+Math.random()*1.8;if(s.n>=3)s.end=t+.4}},k(s){return s.ok/3},
    draw(g,s,t){g.fillStyle='#9fd0ea';g.fillRect(0,28,MGW,28);const b=s.n<3&&t>=s.bite&&t<s.bite+.55,y=b?34:28+Math.round(Math.sin(t*3));g.fillStyle='#ff6a3c';g.fillRect(58,y-4,4,3);g.fillStyle='#ffffff';g.fillRect(58,y-1,4,3);g.fillStyle='#7a5a3a';g.fillRect(60,4,1,y-8);if(b){g.fillStyle='#ffffff';g.fillRect(50,36,4,1);g.fillRect(66,36,4,1)}mgDots(g,s.ok,3)}},
  cup7:{t:'光った所をたたけ！',h:'岩の光った所をタップ',init(s){s.hit=0;s.on=-1;s.nx=.5},tap(s,t,x,y){if(s.on<0)return sfx('notch');const P=MGROCK[s.on];if(Math.abs(x-P[0])<12&&Math.abs(y-P[1])<10){s.hit++;s.on=-1;s.nx=t+.25;sfx('crack')}else sfx('notch')},tick(s,dt,t){if(s.on<0&&t>=s.nx){s.on=(Math.random()*MGROCK.length)|0;s.off=t+.85}else if(s.on>=0&&t>s.off){s.on=-1;s.nx=t+.2}},k(s){return Math.min(1,s.hit/8)},
    draw(g,s,t){g.fillStyle='#b2aca2';g.fillRect(14,8,92,44);g.fillStyle='#8f8a82';g.fillRect(14,44,92,8);for(const[i,P]of MGROCK.entries()){g.fillStyle=i===s.on?'#ffe066':'#8f8a82';g.fillRect(P[0]-4,P[1],8,2);g.fillRect(P[0]-1,P[1]-3,2,8)}g.fillStyle='#5c5c5c';g.fillRect(4,4,30,4);mgBar(g,4,4,30,4,Math.min(1,s.hit/8),'#ffe066')}}};
const MGROCK=[[30,18],[60,16],[90,20],[38,34],[66,32],[88,38]];
function mgBar(g,x,y,w,h,v,c){g.fillStyle='#e9d8b4';g.fillRect(x,y,w,h);g.fillStyle=c;g.fillRect(x,y,Math.round(w*v),h)}
function mgBlob(g,x,y,c){g.fillStyle=c;g.fillRect(x-4,y-6,8,10);g.fillRect(x-5,y-4,10,6);g.fillStyle='#2b2b2b';g.fillRect(x-2,y-3,1,2);g.fillRect(x+1,y-3,1,2)}
function mgDots(g,n,m){for(let i=0;i<m;i++){g.fillStyle=i<n?'#ffd23f':'#d8c8a8';g.fillRect(MGW-6-(m-i)*7,4,5,5)}}
function cupMGOpen(E,r){const M=CUPMG[E.id];if(!M||document.getElementById('cupMG'))return;const s={E,r};M.init(s);
  const o=el('<div id="cupMG" class="pxcard" style="position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:44;background:var(--panel);color:var(--ink);padding:10px 12px;width:280px;max-width:calc(100vw - 32px);text-align:center;touch-action:none;user-select:none"><b class="t" style="display:block;font-size:15px"></b><p class="note h" style="margin:2px 0 6px"></p><canvas width="'+MGW+'" height="'+MGH+'" style="width:240px;max-width:100%;image-rendering:pixelated;display:block;margin:0 auto"></canvas><div class="r" style="font-size:15px;min-height:20px;margin-top:4px"></div></div>');
  o.querySelector('.t').textContent=r.name+'を応援！　'+M.t;o.querySelector('.h').textContent=M.h;document.body.appendChild(o);
  const cv=o.querySelector('canvas'),g=cv.getContext('2d'),t0=performance.now();let last=t0,done=false;CUPV.mg={s,M,E};
  const T=()=>(performance.now()-t0)/1000,pos=e=>{const b=cv.getBoundingClientRect();return[(e.clientX-b.left)/b.width*MGW,(e.clientY-b.top)/b.height*MGH]};
  o.addEventListener('pointerdown',e=>{e.preventDefault();if(done)return;const[x,y]=pos(e);if(M.down)M.down(s,T());if(M.tap)M.tap(s,T(),x,y)});
  const up=()=>{if(M.up&&!done)M.up(s,T())};o.addEventListener('pointerup',up);o.addEventListener('pointercancel',up);o.addEventListener('pointerleave',up);
  const fin=()=>{done=true;const k=Math.max(0,Math.min(1,M.k(s)));if(S.ev===E){E.ck=k;E.mgLive=null}CUPV.mg=null;
    o.querySelector('.r').textContent=k>=.75?'すごい！ 大声援！':k>=.4?'いいね！ とどいた！':'ざんねん……でも、とどいたよ';if(k>=.75){j3Ding(12,0,.5);j3Ding(16,.06,.5);j3Ding(19,.12,.5)}else sfx(k>=.4?'good':'tap');
    if(S.res.includes(r)){JUMP.set(r,performance.now());addFloatG(r.x,r.y,-1.6,k>=.4?'とどいた！':'がんばる！','#ffe7a8')}setTimeout(()=>o.remove(),1300)};
  const loop=()=>{if(done||!o.isConnected)return;const now=performance.now(),dt=Math.min(.1,(now-last)/1000),t=T();last=now;if(M.tick)M.tick(s,dt,t);if(M.live&&S.ev===E)E.mgLive=M.live(s);
    g.fillStyle='#f4e9d2';g.fillRect(0,0,MGW,MGH);M.draw(g,s,t);g.fillStyle='#d8c8a8';g.fillRect(0,MGH-3,MGW,3);g.fillStyle='#a8743f';g.fillRect(0,MGH-3,Math.round(MGW*Math.max(0,1-t*1000/CUPMGT)),3);
    if(t*1000>=CUPMGT||s.end&&t>=s.end||S.ev!==E||!S.ev.ph)return fin();requestAnimationFrame(loop)};requestAnimationFrame(loop)}
function cupBoost(E,id){/* 応援がうまくいった子の、記録のよくなり方（倍） */if(!E||E.cheer!==id)return 1;const v=E.mgLive!=null?E.mgLive:E.ck||0;return 1+(CHEERK[E.id]||0)*v}
/* ---------- 大会のあいだの動き（events.js の cupMove からよぶ）：作る・切る・つる・ほる ---------- */
function cupWork(r,a,dt){const E=S.ev,D=EVENTS[E.id],b=cupBoost(E,r.id),n=+E.id.slice(3);E.pg[r.id]=Math.min(1,(S.t-E.t0)/D.dur);
  if(n===2||n===4){E.sc[r.id]=(E.sc[r.id]||0)+dt*rMul(r,'work')*(.8+.4*Math.random())*b;a.snd=(a.snd||0)+dt;if(a.snd>2.2){a.snd=0;sfxAt(n===2?pick(['nail','saw','nail']):pick(['cook','fry','tonton']),r.x,r.y)}return}
  const rate=n===5?staNow(r)/STD:n===7?1+rStat(r,rLv(r)).atk/100:rMul(r,'work');a.cy=(a.cy||0)+dt*rate*b*(n===6?.8+.6*Math.random():1);a.snd=(a.snd||0)+dt;
  if(a.snd>1.8&&n!==6){a.snd=0;sfxAt(n===5?'chop':'crack',r.x,r.y)}
  const per=n===6?7:5;if(a.cy<per)return;a.cy-=per;if(n===6&&Math.random()<.35)return addFloatG(r.x,r.y,-1.5,'にげられた……','#fff3d6');
  const k=n===5?'wood':n===7?'stone':(typeof fishPick==='function'?fishPick(E.slot[r.id]):'fish'),L=E.loot[r.id]||(E.loot[r.id]={});L[k]=(L[k]||0)+1;E.sc[r.id]=(E.sc[r.id]||0)+1;
  const nm=n===6?((FOODS[k]||{}).name||'さかな'):(MATN[k]||k);addFloatG(r.x,r.y,-1.6,nm+'！','#ffe7a8');JUMP.set(r,performance.now());if(n===6){sfxAt('catch',r.x,r.y);if(typeof fishGot==='function')fishGot(k)}}
/* ---------- ごほうび：作った物・とれた物は、せいれいが頭にのせて箱へ（入らない分は、すぐ入れる） ---------- */
function cupLoot(E,P){const n=+E.id.slice(3),got=[];
  for(const r of P){if(n===2){const id=(E.item||{})[r.id];if(id&&BL[id]){craftCarry({type:id},r);got.push(BL[id].name)}continue}
    if(n===4){const k=(E.item||{})[r.id];if(k&&FOODS[k]){const m=roomN(r)>0?(addCarry(r,k,1),1):0;if(!m)addFood(k,1);got.push(FOODS[k].name)}continue}
    const L=(E.loot||{})[r.id];if(!L)continue;for(const k in L){const v=L[k];if(n===6){const room=Math.min(v,roomN(r));if(room>0)addCarry(r,k,room);if(v-room>0)addFood(k,v-room)}else{const room=Math.min(v,roomN(r));if(room>0)addMat(r,k,room);if(v-room>0)S.mat[k]=(S.mat[k]||0)+v-room}}}
  if(got.length)memo('',EVENTS[E.id].n+'で、'+got.join('・')+'ができた')}
/* ---------- 表彰台（実時間）：1・2・3位が台にのぼり、ハンコと紙ふぶき。ものづくり・料理は、作品を1つずつ見せてから ---------- */
function cupAward(E,P,R){const top=[0,1,2].map(i=>P.filter(r=>cupPlace(E,R,r.id)===i));const [cx,cy]=E.c,c0=Math.floor(cy)*W+Math.floor(cx);
  const spots=[[0,0],[-1,0],[1,0]].map(([dx,dy])=>c0+dx+dy*W),now=performance.now(),art=(E.id==='cup2'||E.id==='cup4')?P.map(r=>({r,id:E.item[r.id]})):[];
  for(const L of top)for(const r of L)r.reactT=S.t+11.5;/* 表彰台にのぼる子は、表彰のあいだ、その場にいる（村の時間） */
  CUPV.aw={x:Math.floor(cx),y:Math.floor(cy),t0:now,top:top.map(L=>L[0]).filter(Boolean),art,id:E.id,stamped:0};
  const delay=art.length?Math.min(art.length,8)*450+300:0;CUPV.aw.td=delay;
  setTimeout(()=>{if(!CUPV.aw)return;CUPV.aw.top.forEach((r,i)=>{const j=spots[i];if(S.res.includes(r)&&walk(j)){r.x=j%W+.5;r.y=((j/W)|0)+.5;r.path=[];r.face=1}setTimeout(()=>{if(!CUPV.aw)return;sfx('ostamp');CUPV.aw.stamped=i+1;if(S.res.includes(r)){JUMP.set(r,performance.now());JOYU.set(r,performance.now()+3000)}},500+(2-i)*450)});
    setTimeout(()=>{if(!CUPV.aw)return;if(typeof juiceCheer==='function')juiceCheer();sfx('clap');sfx('level')},1900)},delay);
  setTimeout(()=>{CUPV.aw=null},delay+CUPAWD)}
function cupGround(now){/* 表彰台（地面の層）：台にのぼった子の足もと */const A=CUPV.aw;if(!A||now-A.t0<A.td)return;const c=ctx,H0=[14,9,6],C=['#ffd23f','#d8dfe8','#e0a46a'];
  [[0,0],[-1,1],[1,2]].forEach(([dx,i])=>{if(!A.top[i])return;const x=(A.x+dx)*TS+4,y=(A.y+.5)*TS-2,dr=()=>{c.fillStyle='#8a5a32';c.fillRect(x,y,TS-8,H0[i]+4);c.fillStyle=C[i];c.fillRect(x+1,y,TS-10,H0[i]+2);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x+1,y+H0[i],TS-10,2)};isoStand(c,gFoot((A.x+dx+.5)*TS,(A.y+.5)*TS),dr)})}/* クォータービュー：台は、その所に立てて */
function cupDraw(now){/* 会場の旗・合図・作品・表彰（世界の上の層） */const E=S&&S.ev,c=ctx,sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
  if(E&&E.ph&&EVENTS[E.id]&&EVENTS[E.id].cup&&E.c){const P=Object.values(E.slot||{});if(P.length){let x0=1e9,x1=-1e9,y0=1e9;for(const j of P){x0=Math.min(x0,j%W);x1=Math.max(x1,j%W);y0=Math.min(y0,(j/W)|0)}isoAt(c,(x0+x1+1)/2*TS,y0*TS);cupFlags(c,(x0-1)*TS,(x1+2)*TS,(y0-1.6)*TS,now)}/* クォータービュー：旗は、ならぶ所の上に立てて（iso-fx.js） */
    if(CUPV.cd&&now-CUPV.cd<CUPCD+500){const e=now-CUPV.cd,i=Math.min(3,Math.floor(e/650)),u=(e%650)/650;isoUIAt(c,E.c[0]*TS,E.c[1]*TS,E.c[0]*TS,(E.c[1]-2.2)*TS);cupText(c,['3','2','1','どん！'][i],E.c[0]*TS,(E.c[1]-2.2)*TS,i===3?3:2.6+(1-u)*1.2,i===3?Math.max(0,1-(e-1950)/1100):1)}
    if(E.ph==='do'&&E.item&&(E.id==='cup2'||E.id==='cup4'))for(const id in E.item){const r=S.res.find(q=>q.id===+id);if(!r)continue;const p=(E.pg||{})[id]||0;isoAt(c,r.x*TS,r.y*TS);cupItemDraw(c,E.item[id],E.id,r.x+(r.face||1)*.75,r.y,p,now)}}
  const A=CUPV.aw;if(A){const e=now-A.t0;A.art.slice(0,8).forEach((q,i)=>{const t=e-i*450;if(t<0||!S.res.includes(q.r))return;const s=t<200?1+(1-t/200)*.6:1;isoAt(c,q.r.x*TS,q.r.y*TS);cupItemDraw(c,q.id,A.id,q.r.x+(q.r.face||1)*.75,q.r.y,1,now,s);if(t<450&&!q.s){q.s=1;j3Ding(i*2,0,.35)}});
    if(e>=A.td)A.top.forEach((r,i)=>{if(A.stamped>i&&S.res.includes(r)){isoUIAt(c,r.x*TS,r.y*TS,r.x*TS,(r.y-2.3)*TS);cupText(c,(i+1)+'位',r.x*TS,(r.y-2.3)*TS,1.6,1)}})}
  c.imageSmoothingEnabled=sm;isoBack(c)}
const CUPIMG={};function cupImg(id,kind){const k=kind+id;if(!CUPIMG[k]){const im=new Image();try{im.src=kind==='cup4'?foodIc(id):iconURL(id)}catch(e){}CUPIMG[k]=im}return CUPIMG[k]}
function cupItemDraw(c,id,kind,x,y,p,now,s){const im=cupImg(id,kind);if(!im.complete||!im.naturalWidth)return;const z=Math.round(22*(s||1)),px=Math.round(x*TS-z/2),py=Math.round(y*TS-z+6),h=Math.max(1,Math.round(z*Math.min(1,.15+p*.85)));
  c.save();c.globalAlpha=p>=1?1:.55+p*.35;c.imageSmoothingEnabled=true;c.drawImage(im,0,im.naturalHeight*(1-h/z),im.naturalWidth,im.naturalHeight*h/z,px,py+z-h,z,h);c.restore();/* 下からだんだんできていく */
  if(p<1&&Math.floor(now/180)%3===0){c.fillStyle='#ffe066';c.fillRect(px+((now/37)%z|0),py+z-h-1,2,2)}}
function cupFlags(c,x0,x1,y,now){const C=['#ff8a5c','#ffd23f','#7fc6ff','#a8f08a','#ff8fb1'];c.fillStyle='#7a5a3a';c.fillRect(x0,y-8,2,TS*1.6+8);c.fillRect(x1-2,y-8,2,TS*1.6+8);
  for(let x=x0+2;x<x1-2;x+=2){const t=(x-x0)/(x1-x0),sag=Math.round(Math.sin(t*Math.PI)*6);c.fillStyle='#5c4a32';c.fillRect(x,y+sag,2,1)}
  let i=0;for(let x=x0+6;x<x1-8;x+=10,i++){const t=(x+3-x0)/(x1-x0),sag=Math.round(Math.sin(t*Math.PI)*6),w=Math.floor(now/400+i)%2;c.fillStyle=C[i%C.length];for(let k=0;k<6;k++)c.fillRect(x+Math.ceil(k/2)+w*0,y+sag+1+k,6-k*1,1)}}
function cupText(c,s,x,y,z,al){c.save();c.globalAlpha=al;c.font=Math.round(10*z)*2/2+'px PixelMplus10, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#8a4a1c';c.fillText(s,Math.round(x),Math.round(y)+Math.max(1,Math.round(z)));c.fillStyle='#ffd23f';c.fillText(s,Math.round(x),Math.round(y));c.restore()}
function cupReset(){if(typeof evShowReset==='function')evShowReset();CUPV.cd=0;CUPV.aw=null;CUPV.mg=null;for(const id of['cupMG','cupCheer']){const e=document.getElementById(id);if(e)e.remove()}}
