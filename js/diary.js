/* きのうの日記（diary.js）
   S.dy：いまつけている1日ぶん。朝6時（morning）から、つぎの朝6時まで。
     {d:はじめの日, w:{キー:[名前,属性,vr,種類,なに,回数]}, m:[できごとの文], k:{名前:[属性,vr,体]}, o:{守りの名前:体}}
     w は、作業がおわったとき（dayNote）。m は、思い出帳のメモ・きろく（memo・logEv）。k・o は、コワイノを追いはらったとき（defeat）。
   朝に S.dy をしめて、S.diary（古い順、DIARYMAX 日ぶん）に入れる。ゆうべの守り（S.ns）も、いっしょにしまう（S.ns.dd）。
   なにか書くことがあれば、紙（openSheet('diary')）を出す。思い出帳からも読める（openSheet('diary',日)）。
   思い出帳の再生（IS_STORY_REPLAY・MEMRUN）では、書かない。 */
const DYJ=new WeakSet(),DIARYMAX=60,DYWORK=new Set(['build','craft','harvest','plant','fish','cook']),DYPER=4;
function dyOff(){return !S||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN}
function dyCur(){if(dyOff())return null;if(!S.dy)S.dy={d:dayNo(),w:{},m:[],k:{},o:{}};return S.dy}
function dyWork(r,t,v){if(!DYWORK.has(t)||!r||!r.name)return;const D=dyCur();if(!D)return;const k=r.name+'|'+t+'|'+v,e=D.w[k];if(e)e[5]++;else D.w[k]=[r.name,r.elem,r.vr||null,t,v,1]}
function dyEv(t){const D=dyCur();if(!D||!t)return;if(!D.m.includes(t))D.m.push(t);if(D.m.length>30)D.m.shift()}
function dyKill(by,msg){const D=dyCur();if(!D)return;if(by&&by.name){const e=D.k[by.name]||(D.k[by.name]=[by.elem,by.vr||null,0]);e[2]++;return}
  const m=String(msg||''),k=m.includes('罠')?'罠':m.includes('まもりの光')?'まもりの光':'そのほかの守り';D.o[k]=(D.o[k]||0)+1}
function dyText(t,v){const n=t==='build'?(BL[v]?BL[v].name+'を建てた':''):t==='craft'?(BL[v]?BL[v].name+'を作った':''):t==='cook'?(fName(v)?fName(v)+'を作った':''):t==='harvest'?(fName(v)?fName(v)+'をしゅうかくした':''):t==='plant'?(tName(v)?tName(v)+'を植えた':''):t==='fish'?'つりをした':'';return n}
/* 朝：きのうの日記をしめる。書くことがあれば、紙を出す */
function diaryClose(){if(dyOff())return;const D=S.dy;S.dy={d:dayNo(),w:{},m:[],k:{},o:{}};if(!D)return;
  const N=S.ns&&!S.ns.dd?S.ns:null;if(N)N.dd=1;
  const w=Object.values(D.w).filter(e=>dyText(e[3],e[4])),e={d:D.d,w,m:D.m.slice(),k:D.k,o:D.o};
  if(N)e.ns={n:N.n,kill:N.kill,hurt:N.hurt,broke:N.broke,lost:(N.lost||[]).slice(),rw:N.rw||0,trial:!!N.trial,trialOK:!!N.trialOK,boss:N.boss||0,left:N.left||0};
  if(!w.length&&!e.m.length&&!e.ns)return;
  const L=S.diary||(S.diary=[]);L.push(e);while(L.length>DIARYMAX)L.shift();
  if(!sheet&&$('#dialog').hidden)openSheet('diary','m');else toast('きのうの日記を、思い出帳にのこした')}
function dyBest(e){let b=null,n=0;for(const k in e.k||{})if(e.k[k][2]>n){n=e.k[k][2];b=k}return n>=2?b:null}
/* 日記の紙（renderSheet から）。arg：'m' は朝に出したとき、数は思い出帳から読む日 */
function diaryBody(T,body,arg){const L=S.diary||[];const e=arg==='m'||arg==null?L[L.length-1]:L.find(q=>q.d===arg);if(!e)return closeSheet();
  T.textContent=e.d+'日めの日記';
  if(arg!=='m'){const bk=el('<button class="btn back" aria-label="思い出帳にもどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('menu','record')};T.before(bk)}
  const N=e.ns;if(N){const sec=el('<div class="sec"><h3></h3></div>');sec.querySelector('h3').textContent=N.trial?(N.trialOK?'試練をのりこえた！':'試練の夜'):N.rw?'夜をぶじに守りきった！':'ゆうべの守り';
    const g=el('<div class="stats"></div>');
    for(const[k,v]of[['来た「コワイノ」',N.n+'体'],['追いはらった',N.kill+'体'],['おそわれたせいれい',N.hurt?N.hurt+'回':'なし'],['こわされた柵・設備',N.broke?N.broke+'こ':'なし'],['ぬすまれたもの',N.lost.length?lostSum(N.lost):'なし']].concat(N.rw?[['ごほうび','パワー+'+N.rw+'・みんなのたのしさ+10']]:[]).concat(N.trialOK?[['試練のごほうび','パワー+60・めぶきのしずく']]:[])){const d=el('<div class="stat"><span></span><b></b></div>');d.firstChild.textContent=k;d.lastChild.textContent=v;g.appendChild(d)}
    sec.appendChild(g);
    const K=Object.entries(e.k||{}).sort((a,b)=>b[1][2]-a[1][2]),O=Object.entries(e.o||{});
    if(K.length||O.length){const rw=el('<div class="rows"></div>');for(const[nm,x]of K)rw.appendChild(rowEl(nm,x[2]+'体を追いはらった',ELEM[x[0]]?spiritPort(x[0],96,x[1]):null));for(const[nm,n]of O)rw.appendChild(rowEl(nm,n+'体を追いはらった'));sec.appendChild(rw)}
    const best=dyBest(e);if(best){const p=el('<p class="note"></p>');p.textContent='いちばんがんばったのは、'+best+'。';sec.appendChild(p)}
    if(N.boss===1&&!N.trial)sec.appendChild(el('<p class="note">オオカゲは、追いはらえないまま朝になった。</p>'));
    body.appendChild(sec)}
  if(e.m.length){const sec=el('<div class="sec"><h3>できごと</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');for(const t of e.m)rw.appendChild(rowEl(t,''));body.appendChild(sec)}
  if(e.w.length){const sec=el('<div class="sec"><h3>みんなのしたこと</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');const by=new Map();
    for(const x of e.w){if(!by.has(x[0]))by.set(x[0],{el:x[1],vr:x[2],L:[]});by.get(x[0]).L.push(x)}
    for(const[nm,g]of by){g.L.sort((a,b)=>b[5]-a[5]);const tx=g.L.slice(0,DYPER).map(x=>dyText(x[3],x[4])+(x[5]>1?'（'+x[5]+'回）':'')).join('\n');const r=rowEl(nm,tx,ELEM[g.el]?spiritPort(g.el,96,g.vr):null);r.querySelector('small').style.whiteSpace='pre-line';rw.appendChild(r)}
    body.appendChild(sec)}
  if(arg==='m'){const best=dyBest(e),r=best&&S.res.find(q=>q.name===best&&!q.hidden);if(r&&!DYJ.has(r)){DYJ.add(r);JUMP.set(r,performance.now());villageTimeout(()=>JUMP.set(r,performance.now()),650);addFloat(r.x,r.y-1.4,'がんばった！','#ffe7a8')}}}
/* 思い出帳の「日記」：日ごとの紙の一覧 */
function diaryList(body){const L=S.diary||[];if(!L.length)return;const sec=el('<div class="sec"><h3>日記</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
  for(const e of L.slice().reverse()){const n=e.w.length+e.m.length,best=dyBest(e);const sub=(e.ns?'ゆうべ '+e.ns.kill+'体を追いはらった':'夜は、コワイノが来なかった')+(best?'・がんばった：'+best:'')+(n?'・できごと '+n:'');const r=rowEl(e.d+'日めの日記',sub);r.style.cursor='pointer';r.onclick=()=>{sfx('tap');openSheet('diary',e.d)};rw.appendChild(r)}
  body.appendChild(sec)}
