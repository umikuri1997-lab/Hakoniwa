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
  for(let n=0;n<16;n++){const P=[['o:'+wx,DYOPEN[wx]]].concat(top.map(x=>['b:'+x[0],DYBODY[x[0]],x])).concat([[clk,CL]]);
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
/* 日記の紙（renderSheet から）。arg：'m' は朝に出したとき、数は思い出帳から読む日
   ページをめくる本（思い出帳と同じ memFlip）。1ページめは絵日記（その日の絵と、その下の文。名前・アイコン・見出しはなし）、
   2ページめは点の出る所（ゆうべのかつやく・ゆうべの守り・きのうのしごと。数え上げ・ハンコは、そのページをはじめて見せたとき _show）、
   そのあとのページに、追いはらったせいれい・できごと・みんなのしたこと。ページの中はスクロールしないように、
   はかってつめる（dyPack。長い一覧は、ページをまたいで分ける）。DYBK：いま見ているページ（同じ日をかきなおしたときは、そのまま） */
const DYBK={p:0,k:null};
function diaryBody(T,body,arg){const L=S.diary||[];const e=arg==='m'||arg==null?L[L.length-1]:L.find(q=>q.d===arg);if(!e)return closeSheet();
  T.textContent=e.d+'日めの日記';
  const key=e.d+'|'+arg,first=DYBK.k!==key;if(first){DYBK.k=key;DYBK.p=0}const anim=arg==='m'&&first;/* かきなおし（画面の回転など）では、数え上げ・ハンコを2回しない */
  if(arg!=='m'){const bk=el('<button class="btn back" aria-label="思い出帳にもどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('menu','record')};T.before(bk)}
  const P0=[],P1=[],P2=[];/* P0：絵日記・P1：点・P2：そのあと */
  {const b=dyBest(e);if(b){const sec=el('<div class="sec dyMvp"><h3>ゆうべのかつやく</h3><div class="rows"></div></div>'),r=rowEl(b.nm,mvpTxt(b),ELEM[b.el]?spiritPort(b.el,96,b.vr):null);sec.querySelector('.rows').appendChild(r);P1.push(sec);
    if(anim)P1.show=()=>setTimeout(()=>{if(r.isConnected)uiStamp(r,true,'かつやく')},350);else{r.style.position='relative';const c=stampCanvas('かつやく'),k=document.createElement('canvas');k.width=k.height=32;k.getContext('2d').drawImage(c,0,0);k.className='ustamp s';k.style.animation='none';r.appendChild(k)}}}/* いちばん上に、その子の絵とハンコ */
  const N=e.ns;if(N){const sec=el('<div class="sec"><h3></h3></div>');sec.querySelector('h3').textContent=N.trial?(N.trialOK?'試練をのりこえた！':'試練の夜'):N.rw?'夜をぶじに守りきった！':'ゆうべの守り';
    const g=el('<div class="stats"></div>');
    for(const[k,v]of[['来た「コワイノ」',N.n+'ひき'],['追いはらった',N.kill+'ひき'],['おそわれたせいれい',N.hurt?N.hurt+'回':'なし'],['こわされた柵・設備',N.broke?N.broke+'こ':'なし'],['ぬすまれたもの',N.lost.length?lostSum(N.lost):'なし']].concat(N.rw?[['ごほうび','パワー+'+N.rw+'・みんなのたのしさ+10']]:[]).concat(N.trialOK?[['試練のごほうび','パワー+60・めぶきのしずく']]:[])){const d=el('<div class="stat"><span></span><b></b></div>');d.firstChild.textContent=k;d.lastChild.textContent=v;g.appendChild(d)}
    sec.appendChild(g);
    if(N.boss===1&&!N.trial)sec.appendChild(el('<p class="note">オオカゲは、追いはらえないまま朝になった。</p>'));
    P1.push(sec);
    const K=Object.entries(e.k||{}).sort((a,b)=>b[1][2]-a[1][2]),O=Object.entries(e.o||{});
    if(K.length||O.length){const s2=el('<div class="sec"><h3>ゆうべ追いはらった</h3><div class="rows"></div></div>'),rw=s2.querySelector('.rows');for(const[nm,x]of K)rw.appendChild(rowEl(nm,x[2]+'ひきを追いはらった',ELEM[x[0]]?spiritPort(x[0],96,x[1]):null));for(const[nm,n]of O)rw.appendChild(rowEl(nm,n+'ひきを追いはらった'));P2.push(s2)}}
  let secW=null;{const T=typeof dyWorkSum==='function'?dyWorkSum(e):[];if(T.length){secW=el('<div class="sec"><h3>きのうのしごと</h3></div>');const g=el('<div class="stats"></div>');for(const[k,v]of T){const d=el('<div class="stat"><span></span><b></b></div>');d.firstChild.textContent=k;d.lastChild.textContent=v;g.appendChild(d)}secW.appendChild(g);P1.push(secW)}}/* きのうのしごと：みんなのしたことの、種類ごとの合計 */
  if(e.ph!=null||e.ft&&e.ft.length){const sec=el('<div class="sec dyE"></div>'),st=S;P0.push(sec);/* 絵日記：その日の絵（けしたあとなら、出さない）と、その下に文 */
    if(e.ph!=null){const im=el('<img class="dyPic" alt="">');sec.appendChild(im);phGet(e.ph).then(p=>{if(!im.isConnected||S!==st)return;if(!p||!p.b){im.remove();return}im.src=dyPhUrl(e.ph,p.b)},()=>im.remove())}
    if(e.ft&&e.ft.length){const tx=el('<p class="dyTx"></p>');tx.textContent=e.ft.map(t=>t.replace(LOOKRX,'')).join('\n');sec.appendChild(tx)}}
  if(e.m.length){const sec=el('<div class="sec"><h3>できごと</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');for(const t of e.m)rw.appendChild(rowEl(t,''));P2.push(sec)}
  if(e.w.length){const sec=el('<div class="sec"><h3>みんなのしたこと</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');const by=new Map();
    for(const x of e.w){if(!by.has(x[0]))by.set(x[0],{el:x[1],vr:x[2],L:[]});by.get(x[0]).L.push(x)}
    for(const[nm,g]of by){g.L.sort((a,b)=>b[5]-a[5]);const tx=g.L.slice(0,DYPER).map(x=>dyText(x[3],x[4])+(x[5]>1?'（'+x[5]+'回）':'')).join('\n');const r=rowEl(nm,tx,ELEM[g.el]?spiritPort(g.el,96,g.vr):null);r.querySelector('small').style.whiteSpace='pre-line';rw.appendChild(r)}
    P2.push(sec)}
  const pages=dyPack(body,[P0,P1,P2]),pp=P1.pg;
  if(anim&&pp){const sh=P1.show,go=typeof juiceDiaryCount==='function'?juiceDiaryCount(pp,secW,true):null;pp._show=()=>{if(sh)sh();if(go)go()};if(!pp.hidden)bookShow(pp)}/* 朝の紙だけ、点のページを見せたときに、数え上げてハンコ */
  if(anim){const best=dyBest(e),r=best&&S.res.find(q=>q.name===best.nm&&!q.hidden);if(r&&!DYJ.has(r)){DYJ.add(r);JUMP.set(r,performance.now());villageTimeout(()=>JUMP.set(r,performance.now()),650);addFloat(r.x,r.y-1.4,'がんばった！','#ffe7a8')}}}
/* 欄をページにつめる：G の組（絵日記・点・そのあと）ごとに新しいページから、はみ出さないだけ入れる（組の、はじめのページは G[i].pg）。一覧（.rows・.stats）は、行ごとにページをまたいで分ける（見出しはつぎのページにも） */
function dyPack(body,G){const pages=[],nv=()=>el('<div class="mnav"><button class="btn mpv" type="button" aria-label="まえのページ">'+pxi('next','prev')+'</button><span class="mpn"></span><button class="btn mnx" type="button" aria-label="つぎのページ">'+pxi('next','nxr')+'</button></div>');
  const cs=getComputedStyle(body),lim=body.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
  let pg=null;const open=()=>{pg=el('<div class="mpg dypk"></div>');pg.appendChild(nv());body.appendChild(pg);pages.push(pg)},fits=()=>lim<=0||pg.offsetHeight<=lim+.5,nav=()=>pg.lastChild;
  const put=sec=>{pg.insertBefore(sec,nav());if(fits())return;
    const box=sec.querySelector(':scope>.rows,:scope>.stats'),it=box?[...box.children]:[];
    if(it.length<2){if(pg.children.length>2){sec.remove();open();pg.insertBefore(sec,nav())}return}/* 1つでページより大きい欄は、そのまま（スクロール） */
    for(const c of it)c.remove();let cur=sec,cb=box;
    for(const c of it){cb.appendChild(c);if(fits())continue;
      if(cb.children.length===1&&pg.children.length===2)continue;/* ページに1行だけでも入らない */
      cb.removeChild(c);if(!cb.children.length)cur.remove();
      open();cur=sec.cloneNode(false);for(const x of sec.children){if(x===box)break;cur.appendChild(x.cloneNode(true))}cb=box.cloneNode(false);cur.appendChild(cb);cb.appendChild(c);pg.insertBefore(cur,nav())}
    if(cur!==sec)for(const x of[...sec.children].slice([...sec.children].indexOf(box)+1))cur.appendChild(x)};/* 一覧のあとの文は、さいごの分へ */
  for(const g of G){if(!g.length)continue;open();g.pg=pg;for(const s of g)put(s)}/* 組ごとに、新しいページから */
  if(!pages.length)open();
  DYBK.p=Math.max(0,Math.min(pages.length-1,DYBK.p|0));const n=pages.length;
  pages.forEach((p,i)=>{p.classList.remove('dypk');p.hidden=i!==DYBK.p;const v=p.lastChild,pv=v.querySelector('.mpv'),nx=v.querySelector('.mnx');v.querySelector('.mpn').textContent=(i+1)+' / '+n;pv.disabled=i===0;nx.disabled=i>=n-1;
    pv.onclick=()=>memFlip(body,pages,i-1,DYBK);nx.onclick=()=>memFlip(body,pages,i+1,DYBK);if(n<2)v.hidden=true});
  let sx=null,sy=0;body.onpointerdown=e=>{sx=e.clientX;sy=e.clientY};body.onpointerup=e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.6)memFlip(body,pages,DYBK.p+(dx<0?1:-1),DYBK)};body.onpointercancel=()=>{sx=null};/* よこにはらうと、めくる */
  return pages}
/* 思い出帳の「日記」：日ごとの紙の一覧 */
function diaryList(body){const L=S.diary||[];if(!L.length)return;const sec=el('<div class="sec"><h3>日記</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
  for(const e of L.slice().reverse()){const n=e.w.length+e.m.length,best=dyBest(e);const sub=(e.ns?'ゆうべ '+e.ns.kill+'ひきを追いはらった':'夜は、「コワイノ」が来なかった')+(best?'・かつやく：'+best.nm:'')+(n?'・できごと '+n:'');const r=rowEl(e.d+'日めの日記',sub);r.style.cursor='pointer';r.onclick=()=>{sfx('tap');openSheet('diary',e.d)};rw.appendChild(r)}
  body.appendChild(sec)}

/* 画面の大きさがかわったら、ページをつめなおす（見ているページは、そのまま） */
addEventListener('resize',()=>{clearTimeout(DYBK.rt);DYBK.rt=setTimeout(()=>{if(sheet==='diary')renderSheet()},200)});
