/* ---------- せいれいの手紙 ----------
   こまかいわけ：なかよしは あいての属性、記念日は 日数、こまりごとは しゅるい、季節は 春夏秋冬、つよくなったは Lv5〜10・15〜25・30〜40（a・b・c）。文は属性ごとに3通。
   ほかのきっかけ：来たつぎの朝（new）・じぶんの家（house、letterHouse）・はじめての料理（cook）・あの大きな影を追いはらった朝（boss）・仲なおり（make）。
   なかよし（mate）・村に来た記念日（anniv）・こまりごとがなおった（thx）・ゆめがかなった（dream）・よみがえった（back）・Lv5ごと（lv）・季節がかわった（season）に、せいれいが手紙を書く（letterQ → S.letterQ）。
   お礼にあたる手紙（LETTERGIFT）には、その子の属性のお礼の品（letterGift）が入っていて、はじめて読んだときにうけとる。
   つぎの朝6時に、小鳥がおそなえ箱へ手紙をとどける（letterMorning → S.letters、演出は letter-fx.js）。もちものの「手紙」で読む。読んだ手紙は、思い出帳の「手紙」で何度でも読める。
   文はその子の言いかた（chatTone）。同じ子が同じ文をくりかえさない（pickFresh）。 */
/* 文は js/letter-data.js の LETTERD（しゅるい→こまかいわけ→属性→3通）。{m} なかま・{n} 数・{f} 家具や料理・{s} 季節 */
const LETTERK={mate:'なかよしのこと',anniv:'記念日',thx:'ありがとう',dream:'ゆめがかなった',back:'もどってきた',lv:'つよくなった',season:'季節のたより',new:'はじめまして',house:'じぶんの家',cook:'はじめての料理',boss:'まもってくれて',make:'仲なおり'};
const LETTERSEA=['spring','summer','autumn','winter'];
const lvBand=n=>n<=10?'a':n<=25?'b':'c';
const LETTERGIFT={thx:1,anniv:1,dream:1,back:1,lv:1,house:1,boss:1};/* お礼の品を入れる手紙 */
function letterGift(el){/* お礼の品：その子の属性の物 */if(el==='wood'){const L=Object.keys(CROPS).filter(c=>cropOn(c));return L.length?{k:'seed:'+pick(L),n:3}:{k:'mat:wood',n:8}}
  if(el==='earth')return{k:'mat:stone',n:8};if(el==='fire')return{k:'mat:wood',n:8};if(el==='wind')return{k:'mat:eda',n:6};if(el==='water'){const L=FISHK.filter(f=>FISHI[f].w===(WD===1?1:0)&&FISHI[f].tm==='any'&&!FISHI[f].rain);return{k:'food:'+(L.length?pick(L):'fish'),n:2}}return{k:'mat:wood',n:8}}
function giftName(g){if(!g)return '';const[t,id]=[g.k.slice(0,g.k.indexOf(':')),g.k.slice(g.k.indexOf(':')+1)];return (t==='mat'?MATN[id]:t==='food'?FOODS[id].name:t==='seed'?CROPS[id].name+'のたね':id)+'×'+g.n}
function giftGive(g){if(!g)return;const t=g.k.slice(0,g.k.indexOf(':')),id=g.k.slice(g.k.indexOf(':')+1);if(t==='mat')S.mat[id]=(S.mat[id]||0)+g.n;else if(t==='food')addFood(id,g.n);else if(t==='seed')giveItem(g.k,g.n);sfx('power')}
function letterTx(k,sub,el){/* その場面・属性の手紙の文（3通）。こまかいわけがなければ '' */const K=LETTERD[k];if(!K)return null;const C=K[sub!=null&&K[sub]?sub:'']||K[Object.keys(K)[0]];return C&&(C[el]||C.wood)||null}
function letterQ(r,k,v,sub,d){/* 手紙を書く（つぎの朝にとどく）。v：{m,n,f,s}。sub：こまかいわけ */if(!r||!S||S.free||IS_STORY_REPLAY||(typeof MEMRUN!=='undefined'&&MEMRUN)||(typeof NOSAVE!=='undefined'&&NOSAVE))return;const L=letterTx(k,sub,r.elem);if(!L)return;const Q=S.letterQ||(S.letterQ=[]);if(Q.some(q=>q.id===r.id&&q.k===k))return;
  const V=v&&typeof v==='object'?v:{m:v,n:v,f:v,s:v},sb=sub!=null&&LETTERD[k][sub]?sub:'',i=L.indexOf(pickFresh('lt:'+r.id+':'+k+':'+sb,L)),fill=t=>t.replace(/\{([mnfs])\}/g,(_,c)=>V[c]!=null?V[c]:'');
  const tx=L[i<0?0:i].map(t=>chatTone(fill(t),r));Q.push({id:r.id,who:r.name,el:r.elem,k,d:d!=null?d:dayNo(),tx,g:LETTERGIFT[k]?letterGift(r.elem):null})}
function letterMorning(){/* 朝6時：きのう書いた手紙がとどく */letterHouse();const Q=S.letterQ;if(!Q||!Q.length)return;const L=S.letters||(S.letters=[]),got=[];for(const q of Q){if(q.d>=dayNo())continue;L.push({who:q.who,el:q.el,k:q.k,d:dayNo(),tx:q.tx,g:q.g||null,read:0});got.push(q.who)}S.letterQ=Q.filter(q=>q.d>=dayNo());
  if(L.length>60)L.splice(0,L.length-60);if(got.length){if(typeof letterPostArrive==='function')letterPostArrive(got);else toast((got.length>1?got.length+'通の':got[0]+'から')+'手紙がとどいた','good');if(sheet==='inv')renderSheet()}/* 小鳥がとどけにくる（letter-fx.js） */}
function letterHouse(has){/* じぶんのベッドのある家が、はじめてできた（前からある家は、手紙なし）。has：家があるか（ふだんは homeOf） */if(!S||S.free)return;const H=has||(typeof homeOf==='function'?homeOf:()=>null),first=!S.flags.lhome1;S.flags.lhome1=1;for(const r of S.res){if(r.hidden||r.lhome||!H(r))continue;r.lhome=1;if(!first)letterQ(r,'house')}}
const letterUnread=()=>(S.letters||[]).filter(l=>!l.read).length;
const LETTERPX=['................','................','................','.oooooooooooooo.','.ohhhhhhhhhhhhd.','.odhhhhhhhhhhdd.','.omdhhhhhhhhdmd.','.ommdhhhhhhdmmd.','.ommmddhhddmmmd.','.ommmmmddmmmmmd.','.ommmmmmmmmmmmd.','.ommmmmmmmmmmmd.','.oddddddddddddo.','.oooooooooooooo.','................','................'];
function letterIco(){return ICONS.letter||pixURL('letter',LETTERPX,'#f0e2c4')}/* 手紙（ふうとう）のドット絵 */
/* 手紙を読む画面（letterRead）・とどく演出は letter-fx.js */
function letterList(){/* もちものの手紙：読んでいない手紙を先に。行は名前とふうとうの絵だけ（日にち・しゅるいの説明がきは出さない） */const L=(S.letters||[]).slice().reverse().sort((a,b)=>a.read-b.read);if(L.length===1)return letterRead(L[0]);
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><b style="display:block;font-size:15px;margin-bottom:8px">手紙</b><div class="rows"></div><button class="btn x" style="width:100%;margin-top:10px">とじる</button></div></div>'),rw=o.querySelector('.rows');
  for(const l of L){const r=rowEl(l.who+'から','',envURL(l.read));r.classList.add(l.read?'lread':'lnew');r.style.cursor='pointer';r.onclick=()=>{sfx('tap');o.remove();letterRead(l)};rw.appendChild(r)}
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
function letterSec(body){/* 思い出帳：読んだ手紙 */const L=(S.letters||[]).filter(l=>l.read);if(!L.length)return;const sec=el('<div class="sec mlet"><h3>手紙</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
  for(const l of L.slice().reverse()){const r=rowEl(l.who+'から','',envURL(1));r.style.cursor='pointer';r.onclick=()=>{sfx('tap');letterRead(l)};rw.appendChild(r)}body.appendChild(sec)}
