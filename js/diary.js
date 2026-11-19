/* きのうの日記（diary.js）
   S.dy：いまつけている1日ぶん。朝6時（morning）から、つぎの朝6時まで。
     {d:はじめの日, w:{キー:[名前,属性,vr,種類,なに,回数]}, m:[できごとの文], k:{名前:[属性,vr,体]}, o:{守りの名前:体}}
     w は、作業がおわったとき（dayNote）。m は、思い出帳のメモ・きろく（memo・logEv）。k・o は、コワイノを追いはらったとき（defeat）。
   朝に S.dy をしめて、S.diary（古い順、DIARYMAX 日ぶん）に入れる。ゆうべの守り（S.ns）も、いっしょにしまう（S.ns.dd）。
   なにか書くことがあれば、紙（openSheet('diary')）を出す。思い出帳からも読める（openSheet('diary',日)）。
   絵日記（日記のいちばん上）：その日の絵（photo.js の phTick → S.dy.ph、なにを写したかは phK・phN・phS）と、その下の文（dyNote、文は diary-data.js）。しまうのは e.ph・e.phK・e.phN・e.phS・e.ft。
     書くのは章のはじめからいる子（草原はフタバ、火山はホムラ。言いかたは chatTone）。その子が村にいない（いなくなった）朝は、文も絵ものせない（DYWRITER）。
     絵を写した日は、文のはじめのできごとを、絵の物のこと（dyPhTopic）にする。
     文は、しゅるいごとに、ぜんぶ使うまで同じ文を出さない（S.dyU）。できた文がまったく同じ日記は作らない（S.dyTx）。
   思い出帳の再生（IS_STORY_REPLAY・MEMRUN）では、書かない。 */
const DYJ=new WeakSet(),DIARYMAX=60,DYWORK=new Set(['build','craft','harvest','plant','fish','cook']),DYPER=4;
function dyOff(){return !S||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN}
function dyCur(){if(dyOff())return null;if(!S.dy)S.dy={d:dayNo(),w:{},m:[],k:{},o:{},g:{}};return S.dy}
/* 守った数（助けてにげる・こもれびのまもり）：ゆうべのかつやくの点にたす */
function dyGuard(r){const D=dyCur();if(!D||!r||!r.name)return;const G=D.g||(D.g={}),e=G[r.name]||(G[r.name]=[r.elem,r.vr||null,0]);e[2]++}
function dyWork(r,t,v){if(!DYWORK.has(t)||!r||!r.name)return;const D=dyCur();if(!D)return;const k=r.name+'|'+t+'|'+v,e=D.w[k];if(e)e[5]++;else D.w[k]=[r.name,r.elem,r.vr||null,t,v,1]}
function dyEv(t){const D=dyCur();if(!D||!t)return;if(!D.m.includes(t))D.m.push(t);if(D.m.length>30)D.m.shift()}
function dyKill(by,msg){const D=dyCur();if(!D)return;if(by&&by.name){const e=D.k[by.name]||(D.k[by.name]=[by.elem,by.vr||null,0]);e[2]++;return}
  const m=String(msg||''),k=m.includes('罠')?'罠':m.includes('まもりの光')?'まもりの光':'そのほかの守り';D.o[k]=(D.o[k]||0)+1}
function dyText(t,v){const n=t==='build'?(BL[v]?BL[v].name+'を建てた':''):t==='craft'?(BL[v]?BL[v].name+'を作った':''):t==='cook'?(fName(v)?fName(v)+'を作った':''):t==='harvest'?(fName(v)?fName(v)+'をしゅうかくした':''):t==='plant'?(tName(v)?tName(v)+'を植えた':''):t==='fish'?'つりをした':'';return n}
/* 昼のようす（photo.js の phTick から毎コマ）：その日の天気・できごとの日を1回だけおぼえる */
function dyNoon(h){if(h<9||h>=18)return;const D=dyCur();if(D&&D.wx==null)D.wx=dyWx()}
function dyWx(){return typeof stormNow==='function'&&stormNow()?'storm':S.today&&DYOPEN[S.today]?S.today:festOn()?'fest':snowNow()?'snow':S.rain?'rain':rainbowToday()?'rainbow':'sun'+seasonNow()}
const DYWRITER=()=>WD===1?HOMURA:POKO;/* ひとことを書くせいれい：章のはじめからいる子 */
const dyWriter=()=>{if(!S)return null;const n=DYWRITER();return S.res.find(r=>r.name===n)||null};
/* しゅるい k の文 A から、まだ出していない文の番号をえらぶ（きめるのは dyUse） */
function dyIdx(k,A,no){const u=(S.dyU||{})[k]||[];let C=[];for(let i=0;i<A.length;i++)if(!u.includes(i)&&!(no&&no.has(k+i)))C.push(i);
  if(!C.length)for(let i=0;i<A.length;i++)if(i!==u[u.length-1]&&!(no&&no.has(k+i)))C.push(i);/* ぜんぶ出したら、さいごに出した文のほかから */
  if(!C.length)C=A.map((_,i)=>i);return C[Math.random()*C.length|0]}
function dyUse(k,i,n){const U=S.dyU||(S.dyU={});let u=U[k]||(U[k]=[]);if(u.length>=n)u=U[k]=u.slice(-1);if(!u.includes(i))u.push(i)}
const dyHash=t=>{let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return h};
/* その日のできごとから、ひとことの話題をあつめる：[しゅるい, @N, @W] */
function dyTopics(e,f){const M=[],O=[],N=e.ns;
  const gone=(S.gone||[]).filter(g=>g.day>=e.d&&g.day<=dayNo()&&g.name!==f.name);if(gone.length)M.push(['gone',gone[gone.length-1].name]);
  const nw=S.res.filter(r=>r.came===e.d&&r!==f&&!r.back);if(nw.length)M.push(['new',nw[nw.length-1].name]);
  if(N&&N.trial)M.push([N.trialOK?'trialOK':'trial']);else if(N&&N.boss)M.push([N.boss===1?'bossLose':'bossWin']);
  if(N&&!N.trial){const best=dyBest(e);O.push(N.hurt?['nightHurt']:N.lost&&N.lost.length?['nightLost']:N.broke?['nightBroke']:best&&best.nm!==f.name?['nightBest',best.nm]:N.kill>=6?['nightBig']:N.kill?['nightSome']:['nightQuiet'])}
  else if(!N&&!Object.keys(e.k||{}).length&&!Object.keys(e.o||{}).length)O.push(['nightQuiet']);
  const mine=e.w.filter(x=>x[0]===f.name).sort((a,b)=>b[5]-a[5]);if(mine.length)O.push(['self',dyText(mine[0][3],mine[0][4])]);
  for(const t of['build','craft','harvest','cook','plant','fish']){const L=e.w.filter(x=>x[3]===t&&x[0]!==f.name).sort((a,b)=>b[5]-a[5]);if(!L.length)continue;const v=L[0][4],n=t==='build'||t==='craft'?(BL[v]&&BL[v].name):t==='plant'?tName(v):t==='fish'?'':fName(v);if(n!=null&&(n||t==='fish'))O.push([t,n,L[0][0]])}
  if(new Set(e.w.map(x=>x[0])).size>=3)O.push(['busy']);if(e.m.length>=2)O.push(['events']);
  {const m=bestMate(f);if(m)O.push(['mate',m.name])}
  O.push(['calm']);return{M,O}}
/* 日記の絵に写した物の話題 */
function dyPhTopic(e){const k=e.phK,n=e.phN||'';if(!e.ph||!k)return null;
  if(k==='spot')return n?['pspot',n]:null;if(k==='built')return n?['pbuilt',n]:null;if(k==='new')return n?['new',n]:null;if(k==='day')return['pday'];
  if(k==='see')return e.phS==='admire'?(n?['padm',n]:null):e.phS==='sunset'?['psun']:e.phS==='critwatch'?(n?['pcrit',n]:['psee']):['pquirk'];return null}
/* 絵日記の文（3〜4行） */
function dyNote(e,f){const{M:M0,O}=dyTopics(e,f),sad=M0.some(t=>t[0]==='gone'||t[0]==='bossLose'||t[0]==='trial');
  const pt=dyPhTopic(e),M=pt?(sad?M0.filter(t=>!(t[0]==='new'&&pt[0]==='new')).concat([pt]):[pt].concat(M0.filter(t=>!(t[0]==='new'&&pt[0]==='new')))):M0;/* 絵の物の話を、はじめに（かなしい日は、かなしいことのあと） */
  const cr=S.dyCat||[],old=k=>{const i=cr.lastIndexOf(k);return i<0?-1:i};/* 前に書いた話題は、あとまわし */
  const rest=O.slice().sort((a,b)=>old(a[0])-old(b[0])||(a[0]==='calm')-(b[0]==='calm')||Math.random()-.5);
  const top=M.slice(0,pt&&M.length>1?2:1).concat(rest.filter(t=>t[0]!=='calm'||!M.length).slice(0,M.length>1&&pt?0:M.length?1:2));if(top.length>1&&top.some(t=>t[0]==='calm'))top.splice(top.findIndex(t=>t[0]==='calm'),1);
  const wx=e.wx&&DYOPEN[e.wx]?e.wx:'sun'+seasonOf(e.d),sd=sad||top.some(t=>/^night(Hurt|Lost|Broke)$/.test(t[0])),CL=sd?DYCLOSE_SAD:DYCLOSE,clk=sd?'cs':'c',/* かなしい日・こまった夜のあとは、しずかなおわり */sub=(t,x)=>t.split('@N').join(x[1]||'').split('@W').join(x[2]||'');
  const seen=new Set(S.dyTx||[]);let best=null;
  if(typeof DYFULL!=='undefined')for(const t0 of top.concat(M,rest)){const A=DYFULL[t0[0]];if(!A||!A.length)continue;/* 通しの文：その日のいちばんの話題1つについて、はじめからおわりまでつながった日記（diary-full.js）。その話題の日記をぜんぶ書いたら、つぎの話題 */
    let ok=null;for(let n=0;n<A.length*2&&!ok;n++){const k='f:'+t0[0],i=dyIdx(k,A),L=A[i].map((t,j)=>chatTone(sub(t,t0),f,j)),h=dyHash(L.join('\n'));dyUse(k,i,A.length);if(!seen.has(h))ok={P:[[k,A]],I:[i],L,h}}
    if(ok){best=ok;break}}
  if(!best)for(let n=0;n<16;n++){const P=[['o:'+wx,DYOPEN[wx]]].concat(top.map(x=>['b:'+x[0],DYBODY[x[0]],x])).concat([[clk,CL]]);
    const I=P.map(p=>dyIdx(p[0],p[1])),L=P.map((p,i)=>chatTone(p[2]?sub(p[1][I[i]],p[2]):p[1][I[i]],f,i)),h=dyHash(L.join('\n'));
    best={P,I,L,h};if(!seen.has(h))break}
  best.P.forEach((p,i)=>dyUse(p[0],best.I[i],p[1].length));
  const tx=S.dyTx||(S.dyTx=[]);tx.push(best.h);if(tx.length>2000)tx.splice(0,tx.length-2000);
  const c=S.dyCat||(S.dyCat=[]);for(const t of top){const i=c.indexOf(t[0]);if(i>=0)c.splice(i,1);c.push(t[0])}
  return best.L}
/* 朝：きのうの日記をしめる。書くことがあれば、紙を出す */
function diaryClose(){if(dyOff())return;const D=S.dy;S.dy={d:dayNo(),w:{},m:[],k:{},o:{},g:{}};if(!D)return;
  const N=S.ns&&!S.ns.dd?S.ns:null;if(N)N.dd=1;
  const w=Object.values(D.w).filter(e=>dyText(e[3],e[4])),e={d:D.d,w,m:D.m.slice(),k:D.k,o:D.o,g:D.g||{}};
  if(N)e.ns={n:N.n,kill:N.kill,hurt:N.hurt,broke:N.broke,lost:(N.lost||[]).slice(),rw:N.rw||0,trial:!!N.trial,trialOK:!!N.trialOK,boss:N.boss||0,left:N.left||0};
  e.wx=D.wx||null;const f=dyWriter();if(f&&D.ph!=null){e.ph=D.ph;e.phK=D.phK||'';e.phN=D.phN||'';e.phS=D.phS||''}/* 書く子がいないときは、絵ものせない */
  if(!w.length&&!e.m.length&&!e.ns&&!e.ph)return;
  if(f){e.ft=dyNote(e,f);e.fw=[f.name,f.elem,f.vr||null]}
  {const b=dyBest(e),r=b&&S.res.find(q=>q.name===b.nm);if(b){e.mvp=b;if(r){funAdd(r,MVPFUN,'mvp');{const M=S.memo||(S.memo=[]);M.push([dayNo(),'cup',b.nm+'が、ゆうべのかつやくにえらばれた']);if(M.length>200)M.shift()}/* memo() だと、つぎの日の日記のできごとにも入るので、思い出帳だけに書く */}}}/* ゆうべのかつやく：たのしさ+10・思い出帳 */
  const L=S.diary||(S.diary=[]);L.push(e);while(L.length>DIARYMAX)L.shift();
  if(!sheet&&$('#dialog').hidden)openSheet('diary','m');else toast('きのうの日記を、思い出帳にのこした')}
/* ゆうべのかつやく：追いはらった数＋守った数が MVPMIN 点以上で、いちばん多い子（おなじ点なら、追いはらった数が多い子）。{nm,el,vr,k,g} */
const MVPMIN=2,MVPFUN=10;
function dyBest(e){if(e.mvp!==undefined&&e.mvp!==null&&typeof e.mvp==='object')return e.mvp;const P={};
  for(const[nm,x]of Object.entries(e.k||{})){P[nm]={nm,el:x[0],vr:x[1],k:x[2],g:0}}
  for(const[nm,x]of Object.entries(e.g||{})){const p=P[nm]||(P[nm]={nm,el:x[0],vr:x[1],k:0,g:0});p.g=x[2]}
  let b=null;for(const nm in P){const p=P[nm],s=p.k+p.g;if(s<MVPMIN)continue;if(!b||s>b.k+b.g||s===b.k+b.g&&p.k>b.k)b=p}return b}
function mvpTxt(b){return [b.k?b.k+'ひきを追いはらった':'',b.g?b.g+'回まもった':''].filter(Boolean).join('・')}
/* 日記の写真の URL：とじるときの写しの板（sheetGhost）も同じ絵を読むので、すぐには手ばなさない（さいごの DYPHN まいだけ） */
const DYPHU=new Map(),DYPHN=6;
function dyPhUrl(id,b){let u=DYPHU.get(id);if(u)return u;u=URL.createObjectURL(b);DYPHU.set(id,u);if(DYPHU.size>DYPHN){const[k,v]=DYPHU.entries().next().value;DYPHU.delete(k);setTimeout(()=>URL.revokeObjectURL(v),3000)}return u}
/* 日記の1日のページ（思い出帳の「日記」と、朝の日記の1ページめ。同じ物）：日記帳の形。
   日づけ（テープ）・天気・その日の絵（テープではる。タップで大きく）・絵の下に、けい線の紙の文（名前・アイコンなし）・できごと・ゆうべのひとこと。
   x = {d, e：S.diary の1日（なければ null）, ev：[印,文]}。h3：章の見出し（思い出帳の1ページめだけ） */
const DYWXN={storm:['あらし','rain'],snow:['雪','rain'],rain:['雨','rain'],rainbow:['虹','rainbow'],fest:['おまつり','sun']};
function dyDayPage(x,h3){const e=x.e,sec=el('<div class="sec mone mdy">'+(h3?'<h3>日記</h3>':'')+'<div class="dyhd"><span class="dyd tape"></span><span class="dywx"></span></div><div class="dyphs"></div></div>');
  sec.querySelector('.dyd').textContent=x.d+'日め';if(e){const w=DYWXN[e.wx]||['晴れ','sun'],wx=sec.querySelector('.dywx');wx.innerHTML=pxi(w[1]);wx.appendChild(document.createTextNode(w[0]))}
  if(e&&e.ph!=null||(S.phDays||[]).includes(x.d)){const f=el('<figure class="dyph dyph0" role="button" tabindex="0"><img alt=""></figure>');sec.querySelector('.dyphs').appendChild(f)}/* 絵の場所を先にとっておく（ページわけのあとで絵が入る） */
  if(e&&e.ft&&e.ft.length){const n=el('<p class="dyTx"></p>');n.textContent=e.ft.map(t=>t.replace(LOOKRX,'')).join('\n');sec.appendChild(n);sec.classList.add('dyw')}/* 文のある日は、絵日記の形（絵は上の半分、下にけい線の文） */
  const X=x.ev||[],ev=(e?e.m.map(t=>{const m=X.find(v=>v[1]===t);return[m?m[0]:'',t]}):X).filter((v,i,A)=>A.findIndex(w=>w[1]===v[1])===i);/* 日記のある日は、その日の日記のできごと（印は思い出のメモから）。同じ文は1つ */const more=el('<div class="dyMore"></div>');/* できごと・ゆうべのひとことは、絵と文のあと（入らなければ、つぎのページ） */if(ev.length){const u=el('<ul class="dyev"></ul>');for(const[ic,t]of ev){const li=document.createElement('li'),k=memoIc(ic);if(k)li.insertAdjacentHTML('afterbegin',pxi(k,'wx'));li.appendChild(document.createTextNode(t));u.appendChild(li)}more.appendChild(u)}
  const N=e&&e.ns,b=e&&dyBest(e);if(N){const p=el('<p class="dyns"></p>');p.textContent=(N.kill?'ゆうべは、コワイノを'+N.kill+'体追いはらった。':'ゆうべは、コワイノが来なかった。')+(b?b.nm+'が、かつやくした。':'');more.appendChild(p)}
  if(more.children.length)sec.appendChild(more);return sec}
/* 日のページに絵をはる：その日の絵（e.ph）があれば、それだけ。古いセーブの、その日の写真はぜんぶ */
function dyFillPh(secs,after){if(IS_STORY_REPLAY||typeof phList!=='function')return;const st=S;
  phList(WD).then(L=>{if(S!==st)return;for(const p of L){const x=secs.get(p.d);if(!x)continue;const sec=x.sec,e=x.e;if(e&&e.ph!=null&&p.id!==e.ph)continue;const box=sec.querySelector('.dyphs'),u=dyPhUrl(p.id,p.b);let f=sec.querySelector('.dyph0');if(f)f.classList.remove('dyph0');else{f=el('<figure class="dyph" role="button" tabindex="0"><img alt=""></figure>');box.appendChild(f)}f.querySelector('img').src=u;f.onclick=()=>{sfx('tap');phView(p,after)}}
    for(const s of secs.values())for(const f of s.sec.querySelectorAll('.dyph0'))f.remove()},()=>{})}
/* 日記の紙（renderSheet から）。arg：'m' は朝に出したとき、数は思い出帳から読む日。
   思い出帳と同じ本（book.js の bookMake）：1ページめは、思い出帳のその日のページと同じ絵日記（dyDayPage）。
   めくると、点のページ（ゆうべのかつやく・ゆうべの守り・きのうのしごと。数え上げ・ハンコは、そのページを見せたとき）、そのあと、追いはらったせいれい・みんなのしたこと。 */
const DYBK={k:null};
function diaryBody(T,body,arg){const L=S.diary||[];const e=arg==='m'||arg==null?L[L.length-1]:L.find(q=>q.d===arg);if(!e)return closeSheet();
  T.textContent=e.d+'日めの日記';
  const key=e.d+'|'+arg,first=DYBK.k!==key;if(first)DYBK.k=key;const anim=arg==='m'&&first;/* かきなおし（画面の回転など）では、数え上げ・ハンコを2回しない */
  if(arg!=='m'){const bk=el('<button class="btn back" aria-label="思い出帳にもどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('menu','record')};T.before(bk)}
  const x={d:e.d,e,ev:(S.memo||[]).filter(m=>m[0]===e.d).map(m=>[m[1],m[2]]).concat((S.log||[]).filter(m=>m[0]===e.d).map(m=>['',m[1]]))}/* できごとは、思い出帳の日のページと同じ */,day=dyDayPage(x,false),P1=el('<div class="mpg"></div>'),P2=el('<div class="mpg"></div>');
  let stampR=null;{const b=dyBest(e);if(b){const sec=el('<div class="sec dyMvp"><h3>ゆうべのかつやく</h3><div class="rows"></div></div>'),r=rowEl(b.nm,mvpTxt(b),ELEM[b.el]?spiritPort(b.el,96,b.vr):null);sec.querySelector('.rows').appendChild(r);P1.appendChild(sec);
    if(anim)stampR=r;else{r.style.position='relative';const c=stampCanvas('かつやく'),k=document.createElement('canvas');k.width=k.height=32;k.getContext('2d').drawImage(c,0,0);k.className='ustamp s';k.style.animation='none';r.appendChild(k)}}}
  const N=e.ns;if(N){const sec=el('<div class="sec"><h3></h3></div>');sec.querySelector('h3').textContent=N.trial?(N.trialOK?'試練をのりこえた！':'試練の夜'):N.rw?'夜をぶじに守りきった！':'ゆうべの守り';
    const g=el('<div class="stats"></div>');
    for(const[k,v]of[['来た「コワイノ」',N.n+'ひき'],['追いはらった',N.kill+'ひき'],['おそわれたせいれい',N.hurt?N.hurt+'回':'なし'],['こわされた柵・設備',N.broke?N.broke+'こ':'なし'],['ぬすまれたもの',N.lost.length?lostSum(N.lost):'なし']].concat(N.rw?[['ごほうび','パワー+'+N.rw+'・みんなのたのしさ+10']]:[]).concat(N.trialOK?[['試練のごほうび','パワー+60・めぶきのしずく']]:[])){const d=el('<div class="stat"><span></span><b></b></div>');d.firstChild.textContent=k;d.lastChild.textContent=v;g.appendChild(d)}
    sec.appendChild(g);
    if(N.boss===1&&!N.trial)sec.appendChild(el('<p class="note">オオカゲは、追いはらえないまま朝になった。</p>'));
    P1.appendChild(sec);
    const K=Object.entries(e.k||{}).sort((a,b)=>b[1][2]-a[1][2]),O=Object.entries(e.o||{});
    if(K.length||O.length){const s2=el('<div class="sec"><h3>ゆうべ追いはらった</h3><div class="rows"></div></div>'),rw=s2.querySelector('.rows');for(const[nm,x]of K)rw.appendChild(rowEl(nm,x[2]+'ひきを追いはらった',ELEM[x[0]]?spiritPort(x[0],96,x[1]):null));for(const[nm,n]of O)rw.appendChild(rowEl(nm,n+'ひきを追いはらった'));P2.appendChild(s2)}}
  let secW=null;{const T=typeof dyWorkSum==='function'?dyWorkSum(e):[];if(T.length){secW=el('<div class="sec"><h3>きのうのしごと</h3></div>');const g=el('<div class="stats"></div>');for(const[k,v]of T){const d=el('<div class="stat"><span></span><b></b></div>');d.firstChild.textContent=k;d.lastChild.textContent=v;g.appendChild(d)}secW.appendChild(g);P1.appendChild(secW)}}/* きのうのしごと：みんなのしたことの、種類ごとの合計 */
  if(e.w.length){const sec=el('<div class="sec"><h3>みんなのしたこと</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');const by=new Map();
    for(const x of e.w){if(!by.has(x[0]))by.set(x[0],{el:x[1],vr:x[2],L:[]});by.get(x[0]).L.push(x)}
    for(const[nm,g]of by){g.L.sort((a,b)=>b[5]-a[5]);const tx=g.L.slice(0,DYPER).map(x=>dyText(x[3],x[4])+(x[5]>1?'（'+x[5]+'回）':'')).join('\n');const r=rowEl(nm,tx,ELEM[g.el]?spiritPort(g.el,96,g.vr):null);r.querySelector('small').style.whiteSpace='pre-line';rw.appendChild(r)}
    P2.appendChild(sec)}
  const pages=[day].concat(P1.children.length?[P1]:[],P2.children.length?[P2]:[]);
  /* 点のページ（P1）は、入りきらないと2ページ以上にわかれる。わかれたページごとに、見せたときに数え上げてハンコ（見えていないページで数えない・ハンコをおさない）。
     わかれたページは、数えおわったら、つぎのページへ自動でめくる（DYAUTOMS。じぶんでページをかえていたら、めくらない） */
  let map=null;const PT=[],pi=P1.children.length?1:-1;let busy=false;
  const onAt=at=>{if(busy||!PT.length)return;const vis=BKd.sp?[at,at+1]:[at],L=PT.filter(q=>vis.includes(q.i)&&!q.on);if(!L.length)return;busy=true;
    const next=k=>{const q=L[k];if(!q){busy=false;const nx=PT.find(x=>!x.on);/* 見えていないページがのこっていたら、つぎへめくる */if(nx&&nx.i>Math.max(...vis))setTimeout(()=>{if(BKd.el.isConnected&&BKd.at===at&&!BKd.busy)bkGo(BKd,at+(BKd.sp?2:1))},DYAUTOMS);return}
      q.on=1;if(q.st)setTimeout(()=>{if(q.st.isConnected)uiStamp(q.st,true,'かつやく')},350);const after=()=>setTimeout(()=>next(k+1),q.st?700:0);if(q.go)q.go(after);else after()};next(0)};
  const BKd=bookMake(body,pages,{key:'diary',at:0,onPaged:m=>{map=m},onAt:at=>setTimeout(()=>onAt(at),0)});
  if(anim&&pi>=0&&map){const end=map[pi+1]!=null?map[pi+1]:BKd.N;for(let i=map[pi];i<end;i++){const pg=BKd.pages[i],q={i,st:stampR&&pg.contains(stampR)?stampR:null};
      if(typeof juiceDiaryCount==='function')q.go=juiceDiaryCount(pg,secW&&pg.contains(secW)?secW:null,true);PT.push(q)}}
  dyFillPh(new Map([[e.d,{sec:day,e}]]));
  if(anim)setTimeout(()=>dyWrite(body),420);/* 朝の日記：文を、書く音といっしょに、ちょっとずつ出す */
  if(anim){const best=dyBest(e),r=best&&S.res.find(q=>q.name===best.nm&&!q.hidden);if(r&&!DYJ.has(r)){DYJ.add(r);JUMP.set(r,performance.now());villageTimeout(()=>JUMP.set(r,performance.now()),650);addFloat(r.x,r.y-1.4,'がんばった！','#ffe7a8')}}}
/* 書いているように、文を1字ずつ出す（場所は先にとってある：字は見えないだけ）。「、」「。」と行のおわりで、ひと息。書く音（持ち主の音）を数字ごとに。タップで、すぐさいごまで */
const DYWMS=25,DYWPAUSE=100,DYWLINE=150,DYAUTOMS=900;/* 1字・「、」「。」のあと・行のおわり（ミリ秒）。わかれた点のページを自動でめくるまでの間 */
function dyWrite(root){const L=[...root.querySelectorAll('.dyTx')].filter(p=>!p.dataset.w&&p.textContent);if(!L.length)return;const st=S;
  const P=L.map(p=>{p.dataset.w=1;const t=p.textContent;p.textContent='';const C=[];for(const ch of t){if(ch==='\n'){p.appendChild(document.createTextNode('\n'));C.push(null);continue}const sp=document.createElement('span');sp.className='dyc';sp.textContent=ch;p.appendChild(sp);C.push(sp)}return C});
  const C=P[0],all=()=>{for(const A of P)for(const sp of A)if(sp)sp.classList.add('on');writeLoop(false)};if(uiReduced()){all();return}
  let i=0,n=0,done=false;const fin=()=>{if(done)return;done=true;all();root.removeEventListener('pointerdown',fin,true)};root.addEventListener('pointerdown',fin,true);writeLoop(true);/* 書く音を、書きおわるまで */
  const gone=()=>{const q=C.find(Boolean);return!q||!q.isConnected||!!q.closest('.bkstore')};/* 紙をとじた・ページをめくった：見えていない字を書きつづけない（書く音も止める） */
  const step=()=>{if(done)return;if(!root.isConnected||S!==st){done=true;writeLoop(false);return}if(gone()){fin();return}if(i>=C.length){fin();return}
    const sp=C[i];for(const A of P){const q=A[i];if(q)q.classList.add('on')}i++;let w=DYWMS;
    if(!sp)w=DYWLINE;else{n++;if('、。！？…'.includes(sp.textContent))w=DYWPAUSE}setTimeout(step,w)};step()}
/* 思い出帳の「日記」：1日1ページの日記帳（古い日から。dyDayPage）。できごと（S.memo・S.log）と村の写真も、ここにまとめる。さいごのページは「きょうまで」（tail：これまでの合計） */
function diaryList(body,tail){const E=new Map(),day=d=>E.get(d)||(E.set(d,{d,ev:[]}),E.get(d));
  for(const e of S.diary||[])day(e.d).e=e;
  (S.memo||[]).forEach(([d,ic,t])=>day(d).ev.push([ic,t]));for(const d of S.phDays||[])day(d);(S.log||[]).forEach(([d,t])=>day(d).ev.push(['',t]));
  const D=[...E.values()].filter(x=>x.d>0).sort((a,b)=>a.d-b.d);if(!D.length&&!tail)return;const pg=new Map();
  D.forEach((x,i)=>{const sec=dyDayPage(x,!i);pg.set(x.d,{sec,e:x.e});body.appendChild(sec)});
  if(tail){tail.classList.add('mone');if(!D.length)tail.insertAdjacentHTML('afterbegin','<h3>日記</h3>');body.appendChild(tail)}
  dyFillPh(pg,()=>{if(sheet==='menu'&&sheetArg==='record')renderSheet()})}
