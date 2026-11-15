'use strict';
/* 強化のイベント（events.js）
   依頼ボードの「イベント」からひらく。ひらくのはつぎの日（at の時刻から3時間のあいだに、はじまる）。
   1つずつ（S.ev）・同じイベントは1季節に1回（S.evDone[id]=季節の番号）。パワー・食料は、ひらいたときにはらう（やめたらもどす）。
   すすみかた（S.ev.ph）：go 集まる → do する → back 帰る（遠足だけ）→ おわり。夜・コワイノが来たら、つぎの日にやりなおす（はらった物はそのまま）。
   ごほうびは、さいごまでいた子だけ（r.est：能力ごとの合計。EVCAP まで）。読みこんだら、とちゅうのイベントは、はじめからやりなおす。
   時間：dur は時計の分。せいれいの動きの時間（a.t）は、その1.5倍（DAYLEN）。 */
const EVCAP={work:60,move:60,sta:60,atk:60,cap:6};
const EVSTN={work:'はたらく速さ',move:'移動速度',sta:'スタミナ',atk:'攻撃力',cap:'持てる数'};
const EVENTS={
  taiso:{n:'朝の体そう',d:'神殿のまえに集まって、みんなで体そう。',at:6.5,dur:20,pt:20,per:0,max:0,gain:{sta:3},talk:['いち、に、さん、し！','のびのび〜！','#joy|からだが、ぽかぽか！']},
  soji:{n:'大そうじの日',d:'みんなで、村の草・落とし物・クモの巣をかたづける。',at:9,dur:60,pt:30,per:5,max:0,gain:{work:5},talk:['ぴかぴかにしよう！','#joy|すっきりしてきた！','このへん、まだ草があるよ。']},
  oni:{n:'おにごっこ',d:'広い所で、みんなでおいかけっこ。',at:13,dur:30,pt:30,per:5,max:6,gain:{move:5},talk:['まてまて〜！','#joy|つかまらないよ！','#surprise|わっ、つかまった！']},
  ensoku:{n:'遠足',d:'みんなで遠くまで歩いて、帰ってくる。',at:9,dur:30,pt:50,per:8,food:2,max:6,gain:{move:5},talk:['#joy|ここ、はじめて来た！','空が、ひろいね。','あ、なにか落ちてる！']},
  gochi:{n:'ごちそう会',d:'食卓のまわりに集まって、みんなでごちそうを食べる。',at:12,dur:30,pt:50,per:8,food:3,need:'table',gain:{sta:5},talk:['#joy|いただきます！','おいしいね！','おなか、いっぱい……。']}};
const EVORDER=['taiso','soji','oni','ensoku','gochi'];
const EVAT=d=>String(Math.floor(d.at))+'時'+(d.at%1?'半':'');
const seasonKey=()=>Math.floor(Math.max(0,dayNo()-1)/SEASONDAYS);/* 季節の番号（ずっとふえる） */
function evSt(r,k){return r&&r.est?(r.est[k]||0):0}/* イベントでふえた能力（rStat がたす） */
function evTables(){const L=[];for(let j=0;j<S.obj.length;j++)if(TABLES.has(S.obj[j]))L.push(j);return L}
function evMax(id){const D=EVENTS[id];if(D.need==='table')return evTables().reduce((a,j)=>a+BL[S.obj[j]].eat.cap,0);return D.max||S.res.filter(r=>!r.hidden).length}
function evNeedOK(id){const D=EVENTS[id];if(D.need==='table'&&!evTables().length)return '食卓がありません';return ''}
function evCost(id,n){const D=EVENTS[id];return{pt:D.pt+D.per*n,food:(D.food||0)*n}}
function evDoneNow(id){return(S.evDone||{})[id]===seasonKey()}
function evCostTxt(id){const D=EVENTS[id];return'パワー'+D.pt+(D.per?'＋ひとり'+D.per:'')+(D.food?'・ひとり食料'+D.food:'')}
function evGainTxt(id){const g=EVENTS[id].gain;return Object.keys(g).map(k=>EVSTN[k]+'+'+g[k]).join('・')}
/* ひらく：お金をはらって、つぎの日にきめる */
function evOpen(id,who){const D=EVENTS[id],c=evCost(id,who.length);if(S.ev)return toast('ほかのイベントがきまっています');if(evDoneNow(id))return toast('この季節は、もうひらきました');{const w=evNeedOK(id);if(w)return toast(w)}
  if(!who.length)return toast('出るせいれいがいません');if(S.pt<c.pt)return toast('パワーが足りません');if(S.food<c.food)return toast('食料が足りません');
  S.pt-=c.pt;const got=c.food?takeFood(c.food):[];S.ev={id,day:dayNo()+1,who:who.slice(),paid:{pt:c.pt,food:got},ph:null};(S.evDone||(S.evDone={}))[id]=seasonKey();
  sfx('power');toast('あしたは、'+D.n+'！','good');return true}
function evCancel(){const E=S.ev;if(!E||E.ph)return;S.pt+=E.paid.pt;for(const k of E.paid.food||[])addFood(k,1);if(S.evDone&&S.evDone[E.id]===seasonKey())delete S.evDone[E.id];S.ev=null;toast(EVENTS[E.id].n+'を、やめた')}
/* 集まる場所 */
function evSlots(G,cx,cy,n,rad,pred){const L=[];for(let y=Math.floor(cy-rad);y<=cy+rad;y++)for(let x=Math.floor(cx-rad);x<=cx+rad;x++){if(x<1||y<1||x>=W-1||y>=H-1)continue;const j=y*W+x;if(G.dist[j]<0||!walk(j)||S.obj[j]||S.ground[j]||sacredNoBuild(j))continue;if(pred&&!pred(j))continue;L.push([Math.hypot(x+.5-cx,y+.5-cy),j])}
  L.sort((a,b)=>a[0]-b[0]);const out=[];for(const[,j]of L){if(out.some(k=>Math.abs(k%W-j%W)+Math.abs(((k/W)|0)-((j/W)|0))<2))continue;out.push(j);if(out.length>=n)break}
  if(out.length<n)for(const[,j]of L){if(out.includes(j))continue;out.push(j);if(out.length>=n)break}return out}
function evTemple(){return STATUE>=0?[STATUE%W+1,((STATUE/W)|0)+3.5]:[CX+.5,CY+.5]}
function evOpenArea(G,cx,cy){/* 5×5のあいた所で、いちばん近い所（おにごっこ） */let best=null,bd=1e9;for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>40)continue;const x=j%W,y=(j/W)|0;let ok=true;for(let b=-2;b<=2&&ok;b++)for(let a=-2;a<=2;a++){const k=(y+b)*W+x+a;if(x+a<0||y+b<0||x+a>=W||y+b>=H||!walk(k)||S.obj[k]||S.ground[k]||G.dist[k]<0){ok=false;break}}if(!ok)continue;const s=Math.hypot(x-cx,y-cy);if(s<bd){bd=s;best=[x+.5,y+.5]}}return best}
function evFar(G,cx,cy){/* 遠足の行き先：神殿から12マスより遠く、歩いて18〜40の、あいた所 */const L=[];for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<18||d>40)continue;const x=j%W,y=(j/W)|0;if(Math.hypot(x-cx,y-cy)<12)continue;let ok=true;for(let b=-1;b<=1&&ok;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(!walk(k)||S.obj[k]||S.ground[k]){ok=false;break}}if(ok)L.push([x+.5,y+.5])}return L.length?L[(Math.random()*L.length)|0]:null}
/* はじめる */
const EVWAIT=40;/* 集まるのを待つ時計の分。こえたら、来られた子だけでする */
function evBusy(r){const a=r.act;return !!a&&(URGNO.includes(a.type)&&a.type!=='evt'||a.type==='play'&&a.stage==='do'||a.type==='watchpost')}
function evStart(){const E=S.ev,D=EVENTS[E.id];E.who=E.who.filter(id=>S.res.some(r=>r.id===id&&!r.hidden));if(!E.who.length){evCancel();return}
  const L=E.who.map(id=>S.res.find(r=>r.id===id)),r0=L[0],[tx,ty]=evTemple();let cx=tx,cy=ty;const G=bfs(r0.x|0,r0.y|0);
  if(E.id==='oni'){const p=evOpenArea(G,tx,ty);if(!p)return evFail('広い所が見つからない');[cx,cy]=p}
  if(E.id==='ensoku'){const p=evFar(G,tx,ty);if(!p)return evFail('行き先が見つからない');[cx,cy]=p;E.home={};{const H=evSlots(bfs(Math.floor(tx),Math.floor(ty)),tx,ty,L.length,4);L.forEach((r,i)=>{if(H[i]!=null)E.home[r.id]=H[i]})}}
  E.slot={};E.c=[cx,cy];
  if(E.id==='gochi'){const S2=[];for(const t of evTables()){const c=BL[S.obj[t]].eat.cap,P=fp(S.obj[t],t%W,(t/W)|0),near=[];for(const[x,y]of P)for(const[dx,dy]of[[-1,0],[1,0],[0,1],[0,-1]]){const k=(y+dy)*W+x+dx;if(P.some(([a,b])=>a===x+dx&&b===y+dy)||near.includes(k))continue;if(G.dist[k]>=0&&walk(k)&&(!S.obj[k]||SEATS.includes(S.obj[k])))near.push(k)}S2.push(...near.slice(0,c).map(k=>[k,t]))}E.tab={};L.forEach((r,i)=>{if(S2[i]){E.slot[r.id]=S2[i][0];E.tab[r.id]=S2[i][1]}});{const t=S2[0]&&S2[0][1];if(t!=null)E.c=[t%W+1,((t/W)|0)+.5]}}
  else if(E.id!=='soji'){const SL=evSlots(G,cx,cy,L.length,E.id==='oni'?2:5);L.forEach((r,i)=>{if(SL[i]!=null)E.slot[r.id]=SL[i]})}
  E.who=E.who.filter(id=>E.id==='soji'||E.slot[id]!=null);if(!E.who.length)return evFail('集まる所がない');
  E.ph=E.id==='soji'?'do':'go';E.t0=S.t;E.at={};E.got={};E.backed=[];
  if(E.id==='soji'){for(let j=0;j<S.obj.length;j++)if(WEEDS.has(S.obj[j])&&VILL[j])(S.wreq||(S.wreq={}))[j]=1;if(S.web)for(const k in S.web)(S.webq||(S.webq={}))[k]=1}/* 村の中の草・クモの巣を、ぜんぶたのむ */
  for(const r of L)if(r.act&&!evBusy(r)){endAct(r);r.act=null;r.path=[]}/* 出る子は、すぐ向かう（食べている・運んでいる子は、すんでから） */
  musicDuck&&musicDuck(1.5);toast(D.n+'がはじまった！','good');sfx('quest')}
function evFail(why){const E=S.ev;E.ph=null;E.day=dayNo()+1;toast(EVENTS[E.id].n+'：'+why+'。あしたまた','warn')}
function evStop(why){const E=S.ev;if(!E||!E.ph)return;for(const r of S.res)if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}E.ph=null;E.day=dayNo()+1;toast(EVENTS[E.id].n+'は、'+why+'あしたに','warn')}
/* 1秒ごと */
function evTick(){const E=S&&S.ev;if(!E||typeof MEMRUN!=='undefined'&&MEMRUN)return;const D=EVENTS[E.id];if(!D){S.ev=null;return}const h=hour(),foe=S.enemies.some(e=>e.spawned&&!e.dead);
  if(!E.ph){if(dayNo()>=E.day&&h>=D.at&&h<D.at+3&&!isNight()&&!foe&&!isDark())evStart();return}
  if(isNight()||isDark())return evStop('暗くなったので、');if(foe)return evStop('コワイノが来たので、');
  const P=E.who.map(id=>S.res.find(r=>r.id===id)).filter(r=>r&&!r.hidden);if(!P.length){S.ev=null;return}
  const here=r=>r.act&&r.act.type==='evt'&&r.act.stage==='do'&&!r.act.back;
  if(E.ph==='go'){for(const r of P)if(here(r))E.at[r.id]=1;const all=P.every(r=>E.at[r.id]);if(all||S.t-E.t0>EVWAIT){E.who=E.who.filter(id=>E.at[id]);if(!E.who.length)return evStop('だれも集まれなかったので、');E.ph='do';E.t0=S.t;sfx('good');for(const r of P)if(E.at[r.id])JUMP.set(r,performance.now()+Math.random()*300)}return}
  if(E.ph==='do'){if(E.id==='soji')for(const r of P)if(r.act&&['weed','pickdrop','sweep','evt'].includes(r.act.type))E.got[r.id]=1;
    if(S.t-E.t0>=D.dur){if(E.id==='ensoku'){E.ph='back';E.t0=S.t;for(const r of P){if(Math.random()<.5){addMat(r,'eda',1);addFloat(r.x,r.y-1.5,'枝をみつけた','#fff3d6')}if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}}return}return evEnd()}return}
  if(E.ph==='back'){for(const r of P)if(r.act&&r.act.type==='evt'&&r.act.back&&r.act.stage==='do'&&!E.backed.includes(r.id))E.backed.push(r.id);if(P.every(r=>E.backed.includes(r.id))||S.t-E.t0>EVWAIT*2)evEnd()}}
function evEnd(){const E=S.ev,D=EVENTS[E.id];const P=E.who.map(id=>S.res.find(r=>r.id===id)).filter(r=>r&&!r.hidden&&(E.id!=='soji'||E.got[r.id])&&(E.id!=='ensoku'||E.backed.includes(r.id)||E.at[r.id]));
  S.ev=null;E.ph=null;for(const r of S.res)if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}
  P.forEach((r,i)=>{const T=r.est||(r.est={}),up=[];for(const k in D.gain){const v=Math.min(EVCAP[k],(T[k]||0)+D.gain[k]),d=v-(T[k]||0);T[k]=v;if(d>0)up.push(EVSTN[k]+'+'+d)}r.estV=(r.estV||0)+1;
    if(E.id==='gochi')r.hunger=hMax(r);r.fun=Math.min(100,r.fun+10);
    villageTimeout(()=>{if(!S.res.includes(r))return;JUMP.set(r,performance.now());addFloat(r.x,r.y-1.6,up.length?up.join('・'):'たのしかった！','#ffe7a8')},300+i*350)});
  memo('',D.n+'をした');toast(D.n+'がおわった！'+(P.length?'　'+evGainTxt(E.id):''),'good');sfx('good')}
/* 出る子の行動（spirit-act の decide0 からよぶ） */
function evAct(r,G){const E=S&&S.ev;if(!E||!E.ph||isNight()||r.hidden||!E.who.includes(r.id))return false;
  if(E.ph==='back'){if(E.backed.includes(r.id))return false;const j=E.home&&E.home[r.id];if(j==null){E.backed.push(r.id);return false}startAct(r,G,'evt',j,{back:1});return true}
  if(E.id==='soji'){if(tryJob(r,G,'weed')||tryJob(r,G,'drop'))return true;{const j=webReqFor(r);if(j>=0){const st=nearest(G,k=>k===j+W||k===j-1||k===j+1,200);if(st>=0){startAct(r,G,'sweep',st,{key:'b'+j,obj:j});return true}}}
    const k=nearest(G,j=>VILL[j]&&walk(j)&&!S.obj[j]&&!S.ground[j]&&Math.random()<.05,30);startAct(r,G,'evt',k>=0?k:(r.y|0)*W+(r.x|0),{sweep:1,dur:15});return true}
  const j=E.slot&&E.slot[r.id];if(j==null)return false;startAct(r,G,'evt',j,{});return true}
const EVDISH=['🍖','🍙','🥗','🍞'];
ACT.evt={start(r,a){const E=S.ev;r.bubble='';if(!E)return false;a.ev=E.id;if(E.id==='gochi'&&E.tab&&E.tab[r.id]!=null){const c=(r.y|0)*W+(r.x|0),t=E.tab[r.id];for(const d of[-W,-1,1,W])if(anc(c+d)===t||c+d===t){a.tdir=d;break}a.e=pick(EVDISH)}else if(E.c&&!a.back)r.face=E.c[0]<r.x?-1:1},
  tick(r,a,dt){const E=S.ev;if(!E||a.back||a.sweep)return;if(E.ph!=='do'){a.h=0;return}r.fun=Math.min(100,r.fun+.2*dt);a.h=(a.h||0)+dt;
    if(E.id==='oni')evOniMove(r,a,dt);
    if(a.h>=9){a.h=0;if(Math.random()<.35){const L=EVENTS[E.id].talk;addFloat(r.x,r.y-1.5,pickFresh('ev:'+E.id,L).replace(/^#[a-z]+\|/,''),'#fff3d6')}if(E.id!=='gochi'&&E.id!=='oni'&&Math.random()<.4)JUMP.set(r,performance.now())}},
  done(r,a){const E=S.ev;if(!E||!E.ph)return true;if(a.sweep)return a.t>=(a.dur||15)||E.ph!=='do';if(a.back)return a.t>=6;return E.ph==='back'},
  end(r,a){}};
function evAnim(r){const a=r.act,E=S&&S.ev;if(!a||!E)return 'talk';if(a.sweep)return 'sweep';if(a.back)return 'wave';if(E.ph!=='do')return 'talk';
  if(E.id==='taiso')return['qstretch','qspin','qrain','qstretch'][Math.floor(a.t/9)%4];if(E.id==='oni')return 'chase';if(E.id==='gochi')return 'eat';if(E.id==='ensoku')return['point','qlookup','talkjoy'][Math.floor(a.t/12)%3];return 'talkjoy'}
function evOniMove(r,a,dt){/* おにごっこ：おに（いちばんはじめの子から、時計の6分ごとに交代）はいちばん近い子を追い、ほかの子は、おにからにげる。広場（まん中から2.4マス）の中だけ */const E=S.ev,[cx,cy]=E.c,P=E.who.map(id=>S.res.find(q=>q.id===id)).filter(q=>q&&q.act&&q.act.type==='evt'&&q.act.stage==='do');if(P.length<2)return;
  const oni=P[Math.floor((S.t-E.t0)/9)%P.length];let tx,ty;if(r===oni){const t=P.filter(q=>q!==r).sort((p,q)=>Math.hypot(p.x-r.x,p.y-r.y)-Math.hypot(q.x-r.x,q.y-r.y))[0];tx=t.x;ty=t.y}else{const dx=r.x-oni.x,dy=r.y-oni.y,L=Math.hypot(dx,dy)||1;tx=r.x+dx/L*2;ty=r.y+dy/L*2;const ang=Math.atan2(ty-cy,tx-cx)+.6;if(Math.hypot(tx-cx,ty-cy)>2.4){tx=cx+Math.cos(ang)*2.2;ty=cy+Math.sin(ang)*2.2}}
  const dx=tx-r.x,dy=ty-r.y,L=Math.hypot(dx,dy);if(L<.05)return;const m=Math.min(L,dt*.9*rMul(r,'move')),nx=r.x+dx/L*m,ny=r.y+dy/L*m,k=(ny|0)*W+(nx|0);if(Math.hypot(nx-cx,ny-cy)<=2.5&&walk(k)&&!S.obj[k]){r.face=dx>=0?1:-1;r.x=nx;r.y=ny}}
function evLoadFix(){if(S&&S.ev&&S.ev.ph){S.ev.ph=null}}/* とちゅうのイベントは、はじめから */
/* 画面：依頼ボードの「イベント」 */
function evSheet(body){$('#sheetTitle').textContent='イベント';
  {const bk=el('<button class="btn back" aria-label="依頼ボードにもどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('craft')};$('#sheetTitle').before(bk)}
  const E=S.ev;if(E){const D=EVENTS[E.id],n=el('<div class="sec"><h3>きまっているイベント</h3><div class="rows"></div></div>'),r=rowEl(D.n,(E.ph?'いま、しているよ':E.day>dayNo()?'あした　'+EVAT(D):'きょう　'+EVAT(D))+'・'+E.who.length+'人',null);if(!E.ph){const b=el('<button class="btn">やめる</button>');b.onclick=()=>{sfx('tap');evCancel();renderSheet()};r.appendChild(b)}n.querySelector('.rows').appendChild(r);body.appendChild(n)}
  const s=el('<div class="sec"><h3>ひらけるイベント</h3><div class="rows"></div></div>'),rows=s.querySelector('.rows');body.appendChild(s);
  for(const id of EVORDER){const D=EVENTS[id],r=rowEl(D.n,D.d,null,'<b style="font-weight:400">'+esc(evGainTxt(id))+'</b><br>'+esc(EVAT(D)+'から・'+evCostTxt(id))+'<br>'),b=el('<button class="btn pri">ひらく</button>');
    const why=S.ev?'ほかのイベントがきまっています':evDoneNow(id)?'この季節は、もうひらきました':evNeedOK(id);if(evDoneNow(id))r.classList.add('done');lackOn(b,why);b.onclick=()=>{if(why)return;sfx('tap');evPop(id)};r.appendChild(b);rows.appendChild(r)}}
function evPop(id){/* 出る子をえらぶ */const D=EVENTS[id],mx=evMax(id),L=S.res.filter(r=>!r.hidden),pick0=new Set(L.slice(0,mx).map(r=>r.id));
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 8px"></p><div class="ks" style="display:flex;flex-wrap:wrap;gap:6px"></div><p class="note c" style="margin:10px 0 0"></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button><button class="btn pri go">ひらく</button></div></div></div>');
  o.querySelector('.t').textContent=D.n;o.querySelector('.n').textContent=evGainTxt(id)+'（'+mx+'人まで）';
  const bs=L.map(r=>{const b=el('<button class="btn"></button>');b.textContent=r.name;b.onclick=()=>{sfx('notch');if(pick0.has(r.id))pick0.delete(r.id);else if(pick0.size<mx)pick0.add(r.id);upd()};o.querySelector('.ks').appendChild(b);return[r,b]});
  const upd=()=>{for(const[r,b]of bs)b.classList.toggle('pri',pick0.has(r.id));const c=evCost(id,pick0.size);o.querySelector('.c').textContent=pick0.size+'人・パワー（'+Math.floor(S.pt)+'/'+c.pt+'）'+(c.food?'・食料（'+S.food+'/'+c.food+'）':'');lackOn(o.querySelector('.go'),!pick0.size?'出るせいれいがいません':lackPt(c.pt)||(S.food<c.food?'食料が足りません':''))};
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelector('.go').onclick=()=>{const c=evCost(id,pick0.size);if(!pick0.size||S.pt<c.pt||S.food<c.food)return;if(evOpen(id,[...pick0])){o.remove();renderSheet()}};upd();document.body.appendChild(o)}
