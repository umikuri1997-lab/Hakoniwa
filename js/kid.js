'use strict';
/* ---------- 谷で生まれた小さなせいれい（kid.js、フリーモードだけ） ----------
   S.kid：{st,bj,x,y,name,vr,bornD,f0,wat,finD,arr}。st：'bud' つぼみ → 'baby' 小さなせいれい → 'grown' 大きくなった → 'leave' 旅立つ → 'away' 旅のあいだ → 'back' 帰ってくる → 'home' 谷のなかま。
   小さなせいれいは、村のせいれいの一覧（S.res）に入れない（仕事・イベント・夜の見回りにまきこまない）。KR：描く・話すための写し（セーブしない）。
   'home' になったら、ふつうの木のせいれいとして S.res に入る（kidHome）。
   動き：はじめの2人（FA）のあとをついて歩き、まねをする（kidThink）。絵は小さな3Dの動き（spirit-motions.js の kid_*。draw-spirits.js の spMotion で o.kid のとき）。 */
let KR=null,KRS=null;
ACT.kidgo={start(){},done(){return true}};/* 歩くだけ（moveR が着いたときに beginDo をよぶので、何もしない行動） */
const KIDBUDR=3;/* つぼみのまわりの、物を置くマス（たて・よこ・ななめ） */
const KIDNAT=new Set(['ntree','rock','bigrock','berry','deadtree','bamboo','takenoko','kinoko','part']);/* 自然の物（置いた物に数えない） */
const kidSt=()=>S&&S.free&&S.kid?S.kid.st:'';
const KN=()=>S&&S.kid&&S.kid.name||'ちいさなせいれい';
function kidRes(w){/* 会話の話し手（dialog.js）：小さなせいれいの写し */return KR&&KRS===S&&S.kid&&S.kid.name&&w===S.kid.name&&!['bud','away','home'].includes(S.kid.st)?KR:null}
function kidMake(){/* 写しを作る（村をひらいたとき・生まれたとき） */const K=S.kid;KRS=S;KR=null;if(!K||['bud','away','home'].includes(K.st))return;
  const g=mkRes({nid:-950},K.name||'？','wood',K.x,K.y);g.vr=K.vr||(K.vr=mkVar(K.name||'kid','wood'));g.id=-950;g.kid=K.st==='baby';g.path=[];g.kT=0;g.face=1;KR=g}
function kidBudSpot(){/* つぼみの場所：村のまん中に近い、野の花のむれの中で、まわりが空いている所 */const ok=j=>j>=0&&j<W*H&&!S.obj[j]&&!S.floor[j]&&S.ground[j]===0&&walk(j);let best=-1,bd=1e9;
  for(let y=CY-16;y<=CY+16;y++)for(let x=CX-16;x<=CX+16;x++){const j=y*W+x;if(!ok(j))continue;const d=Math.hypot(x-CX,y-CY);if(d<7)continue;let n=0,wl=0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const q=j+b*W+a;if(ok(q))n++;if(S.wild&&S.wild[q]!=null)wl++}
    if(n<20)continue;const sc=d-wl*1.5;if(sc<bd){bd=sc;best=j}}return best>=0?best:(CY-4)*W+CX+6}
function kidBudFix(){/* つぼみの上に物・床を置いたら、となりの空いた所へうつす */const K=S.kid,j=K.bj;if(!S.obj[j]&&!S.floor[j]&&walk(j))return;
  for(let r=1;r<6;r++)for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const q=j+b*W+a;if(q>=0&&q<W*H&&!S.obj[q]&&!S.floor[q]&&S.ground[q]===0&&walk(q)){K.bj=q;return}}}
function kidNear(){/* つぼみのまわりに置いた物の数（自然の物・野の花はのぞく） */const K=S.kid;if(!K||K.bj==null)return 0;const x0=K.bj%W,y0=(K.bj/W)|0;let n=0;
  for(let b=-KIDBUDR;b<=KIDBUDR;b++)for(let a=-KIDBUDR;a<=KIDBUDR;a++){const j=(y0+b)*W+x0+a,o=S.obj[j];if(!o||KIDNAT.has(o)||!BL[o])continue;const k=BL[o].kind;if(k==='furn'||k==='plant'||k==='deco'||k==='build')n++}return n}
function kidEnsure(){/* 第1話：つぼみを置く */if(!S||!S.free||S.kid)return;const j=kidBudSpot();S.kid={st:'bud',bj:j,x:j%W+.5,y:((j/W)|0)+.5}}
/* ---------- 生まれる：つぼみがふくらんで、ひらく → 名前をつける ---------- */
let KIDSCENE=null;
function kidBirth(){const K=S.kid,s0=S,x=K.bj%W+.5,y=((K.bj/W)|0)+.5;KIDSCENE={t:performance.now(),S};panTo(x*TS,y*TS);
  villageTimeout(()=>{KIDSCENE.shk=performance.now();sfx('bush')},700);
  villageTimeout(()=>{if(S!==s0)return;K.st='baby';K.x=x;K.y=y;kidMake();for(let i=0;i<5;i++)spawnFX(x-.5+(i%3-1)*.4,y-.8,['#ffd84a','#ff9cc0','#fff4ee','#b8ff9a','#9ff0ff'][i]);if(typeof juiceGlowAt==='function')juiceGlowAt(x,y,2);sfx('level');
    if(KR){JUMP.set(KR,performance.now());JOYU.set(KR,performance.now()+1600)}
    villageTimeout(()=>{if(S!==s0)return;kidNamePop(()=>{KIDSCENE=null;save();checkQuest()})},1700)},2300)}
function kidNamePop(done){/* 名前をつける：きめないときは、ふつうの名前から */
  const ov=el('<div class="idea-reveal vn-reveal" role="dialog" aria-modal="true" aria-label="名前"></div>'),card=el('<div class="idea-card" style="min-width:0"><h2>名前をつけよう</h2><div style="display:flex;align-items:center;gap:6px;margin:10px 0"><input class="vnIn" style="width:0;min-width:0;flex:1 1 auto" type="text" autocomplete="off" placeholder="ひらがな・カタカナ"></div><div style="display:flex;gap:8px;justify-content:center"></div></div>');
  const ip=card.querySelector('input'),bx=card.lastElementChild,used=new Set(S.res.map(r=>r.name).concat([GOD,'フタバ','ノドカ','ホノ','アオ','フウ','シズク']));
  const fix=()=>{const v=vnClean(ip.value);if(v!==ip.value)ip.value=v};ip.addEventListener('input',e=>{if(!e.isComposing)fix()});ip.addEventListener('compositionend',fix);
  const ok=el('<button class="btn pri" type="button">きめる</button>');
  ok.onclick=()=>{let v=vnClean(ip.value);if(!v||used.has(v)){let i=S.nameIdx||0;do{v=NAMES[i%NAMES.length];i++}while(used.has(v)&&i<(S.nameIdx||0)+NAMES.length*2);S.nameIdx=i}
    S.kid.name=v;S.kid.vr=mkVar(v,'wood');kidMake();sfx('good');ov.remove();memo('ball',v+'が、谷で生まれた');logEv(v+'が生まれた');done()};
  bx.append(ok);ov.append(card);document.body.append(ov);setTimeout(()=>{if(ov.isConnected)ip.focus({preventScroll:true})},60)}
/* ---------- 毎コマ（level.js の stepWorld から） ---------- */
function kidTick(dt){if(!S||!S.free||!S.kid)return;const K=S.kid;if(KRS!==S)kidMake();
  if(K.st==='bud'){kidBudFix();if(K.bornD!=null&&callDay()>=K.bornD&&!isNight()&&!KIDSCENE&&$('#dialog').hidden&&sheet==null&&!document.querySelector('.idea-reveal'))kidBirth();return}
  const r=KR;if(!r)return;
  if(r.path&&r.path.length){r.kidM='';r.kidZ=0;r.kidMood='';r.act=r.act||{type:'kidgo',stage:'walk'};moveR(r,dt);K.x=r.x;K.y=r.y;if(!r.path.length){r.act=null;kidArrive(r)}return}
  if(KIDSCENE)return;if((r.kT-=dt)>0)return;kidThink(r)}
function kidGo(r,j){/* j のマスへ歩く。行けなければ false */if(j<0)return false;const G=roadSearch(r.x|0,r.y|0);if(G.dist[j]<0)return false;r.path=pathTo(G,j);if(!r.path.length)return false;r.act={type:'kidgo',stage:'walk'};return true}
function kidBeside(L,rad){/* L のそばの、空いて歩けるマス（近い所から） */rad=rad||2;const lj=(L.y|0)*W+(L.x|0),occ=new Set(S.res.filter(q=>!q.hidden).map(q=>(q.y|0)*W+(q.x|0)));let best=-1,bd=1e9;
  for(let b=-rad;b<=rad;b++)for(let a=-rad;a<=rad;a++){if(!a&&!b)continue;const j=lj+b*W+a;if(j<0||j>=W*H||!walk(j)||occ.has(j)||S.obj[j]&&!FLOWERS.has(S.obj[j]))continue;const d=Math.hypot(a,b)+(b<0?.3:0);if(d<bd){bd=d;best=j}}return best}
function kidLeader(){const a=S.res.find(q=>q.name===FA()&&!q.hidden)||S.res.find(q=>q.name===FB()&&!q.hidden)||S.res.find(q=>!q.hidden);return a||null}
function kidFace(r,x){r.face=x>=r.x?1:-1}
function kidThink(r){const K=S.kid,L=kidLeader(),q=QUESTS[S.quest];r.kidM='';r.kidZ=0;r.kidMood='';
  if(K.st==='leave'||K.st==='back')return;
  if(isNight()){/* 夜：なかまのそばで、すわってねむる */if(L&&Math.hypot(L.x-r.x,L.y-r.y)>2.2&&kidGo(r,kidBeside(L,2))){r.kT=0;return}r.kidM=r.kid?'kid_sitfront':'sitfront';r.kidZ=1;r.kT=20;return}
  if(K.st==='baby'&&q&&q.id==='fcant'){
    if(!S.qTalked){/* できない：木箱をはこぼうとして、ころんで、泣く */r.kph=(r.kph||0)+1;if(r.kph%2){r.kidM='kid_carry';r.kT=4}else{r.kidM='kid_talksad';r.kidMood='cry';r.kT=5;JUMP.set(r,performance.now())}return}
    const f=kidWaterNext();if(f>=0){const fx=f%W+.5,fy=((f/W)|0)+.5;/* 植えた花に、じぶんで水をやる */
      if(Math.hypot(fx-r.x,fy-r.y)<1.6){kidFace(r,fx);r.kidM='kid_water';r.kT=6;K.wat[f]=1;return}
      if(kidGo(r,kidBeside({x:fx,y:fy},1)))return}}
  if(K.st==='grown'&&Math.random()<.3){/* 丘のむこうを見つめる */const g=freeGate(),j=kidBeside({x:g[0]+.5,y:g[1]-3.5},2);if(j>=0&&Math.hypot(j%W-r.x,((j/W)|0)-r.y)>1.5&&kidGo(r,j)){r.kgz=1;return}}
  if(L&&Math.hypot(L.x-r.x,L.y-r.y)>(K.st==='baby'?2.2:3.5)){const j=kidBeside(L,K.st==='baby'?1:2);if(kidGo(r,j))return}
  if(L)kidFace(r,L.x);
  if(r.kid){/* まねっこ：となりの子が手を動かしていれば、同じ動き */const a=L&&L.act&&L.act.stage==='do'?L.act.type:'';if(a&&SPM['kid_'+a]&&Math.random()<.7){r.kidM='kid_'+a;r.kT=5;return}
    const R=Math.random();r.kidM=R<.55?'kid_lnod':R<.7?'kid_wave':R<.82?'kid_clap':R<.92?'kid_talkjoy':'kid_yawn';r.kT=3+Math.random()*4;return}
  r.kidM=R0(['lnod','lnod','qlookup','wave']);r.kT=4+Math.random()*4}
const R0=L=>L[Math.floor(Math.random()*L.length)];
function kidArrive(r){const K=S.kid;if(r.kgz){r.kgz=0;r.kidM='qlookup';r.kT=8;return}
  if(K.st==='leave'){K.st='away';KR=null;S.cleared=true;S.clearDay=dayNo();toast(KN()+'が、旅に出た','good');memo('ball',KN()+'が、旅に出た');logEv(KN()+'が旅に出た');save();return}
  if(K.st==='back')K.arr=1}
function kidWaterNext(){/* 第4話：植えたあとの、まだ水をやっていない花 */const K=S.kid,f0=new Set(K.f0||[]);for(let j=0;j<W*H;j++)if(FLOWERS.has(S.obj[j])&&!f0.has(j)&&!K.wat[j])return j;return -1}
function kidBloomN(){/* 第4話：小さなせいれいが水をやって、咲いた花の数 */const K=S.kid;if(!K||!K.wat)return 0;let n=0;for(const k in K.wat){const j=+k;if(FLOWERS.has(S.obj[j])&&!isBud(j))n++}return n}
/* ---------- 朝（quests.js の morning から） ---------- */
function kidMorning(){if(!S||!S.free||!S.kid)return;const K=S.kid,i=QUESTS.findIndex(q=>q.id==='fcant');
  if(K.st==='baby'&&i>=0&&S.quest>i&&S.qStory==null){K.st='grown';kidMake();toast(KN()+'が、大きくなった','good');memo('ball',KN()+'が、大きくなった')}
  if(K.st==='away'&&K.finD!=null&&dayNo()>K.finD){K.st='back';const g=freeGate();K.x=g[0]+.5;K.y=g[1]+.5;kidMake();K.arr=0;KR.kT=0;const L=kidLeader();if(L)kidGo(KR,kidBeside(L,2));toast('谷の南に、だれか来た','good')}}
/* ---------- 旅立ち（第6話のお礼のあと。quest-run.js の questGives の kidGo） ---------- */
function kidDepart(){const K=S.kid;if(!K||!KR)return;const g=Object.keys(S.inv||{}).find(k=>BL[k]&&BL[k].kind==='gift'&&S.inv[k]>0);if(g){S.inv[g]--;if(!S.inv[g])delete S.inv[g];K.gift=g}
  K.st='leave';let j=-1;for(let y=H-3;y>CY;y--){const q=y*W+freeGate()[0];if(walk(q)){j=q;break}}if(!kidGo(KR,j)){kidArrive(KR)}
  for(const r of S.res)if(!r.hidden&&Math.hypot(r.x-KR.x,r.y-KR.y)<8)JOYU.set(r,performance.now()+2400)}
/* ---------- 旅のあいだの手紙：季節の話のお礼のつぎの朝（free.js の fseaTick から） ---------- */
const KIDLET=[
  ['丘のむこうにも、花がさいていたよ。','でもね、谷の花のにおいとは、ちょっとちがうんだ。','みんなで花見、したのかな。いいなあ。'],
  ['大きな川を見たよ。こわくて、なかなか、わたれなかった。','三日めに、石の上をとんで、わたれたんだ。','花に水をやった日のこと、思い出したよ。'],
  ['旅のとちゅうで、木のせいれいに会ったよ。','どこから来たのってきかれたから、花の谷だよって言ったんだ。','ちょっと、むねをはっちゃった。'],
  ['さむい夜、星を見ていたら、谷の丘を思い出した。','みんなの顔も、ひとりずつ、ちゃんと思い出せたよ。','春になったら、帰るね。']];
function kidLetter(k){const K=S.kid;if(!K||K.st!=='away'||!KIDLET[k])return;const Q=S.letterQ||(S.letterQ=[]);if(Q.some(q=>q.id===-950&&q.k==='kid'+k))return;Q.push({id:-950,who:KN(),el:'wood',k:'kid'+k,d:dayNo(),tx:KIDLET[k].slice(),g:null})}
/* ---------- おかえり（free.js の freeAfterTick から） ---------- */
function kidBackTick(){const K=S.kid;if(K.st!=='back')return false;if(!K.arr){if(KR&&!KR.path.length&&KR.kT<=0){const L=kidLeader();if(L&&!kidGo(KR,kidBeside(L,2)))K.arr=1}return true}
  const a=FA(),b=FB(),k=KN();fSay([[k,'#joy big|ただいま！'],[a,'#joy|おかえり、'+k+'！'],[b,'#cry hush|おかえりぃ……。旅の顔に、なったねぇ。'],[k,'丘のむこうは、ひろかったよ。きれいな所も、こわい所も、いっぱいあった。'],[k,'でもね、どこにいても、谷のことを思い出してた。'],[k,'これ、おみやげ。旅先で見つけた、花のたね。'],[a,'#joy|おまつりだ！ '+k+'が帰ってきた、おまつり！']],kidHome);return true}
function kidHome(){/* 帰ってきた：谷のなかまになる。旅先の花のたねと、おまつり */const K=S.kid,x=KR?KR.x:K.x,y=KR?KR.y:K.y;K.st='home';KR=null;
  const r=mkRes(S,K.name,'wood',x,y,'chat');r.vr=K.vr||mkVar(K.name,'wood');r.came=dayNo();S.res.push(r);
  for(const f of['lily','salvia','bellf']){S.unlocked[f]=true;giveItem(f,3)}queueItemGift({lily:3,salvia:3,bellf:3});
  for(const q of S.res){q.fun=100;spawnFX(q.x-.5,q.y-.6,pick(['#ffd84a','#ff9cc0','#9ff0ff','#b8ff9a']))}startClap();villageTimeout(endClap,3200);
  memo('ball',K.name+'が、旅から帰ってきた');omo('fest');logEv('谷のおまつりをひらいた');if(typeof juiceCheer==='function')juiceCheer();recount()}
/* ---------- 描く（draw-world.js から） ---------- */
const KBUD=['....pp....','...pPPp...','..pPWPPp..','..pPPPPp..','..pPPPPp..','...pPPp...','....gg....','.ll.gg.ll.','lLLlggLLl.','.lLlgglL..','....gg....','....gg....'],KBUDC={P:'#ffd6e6',p:'#e9a8c4',W:'#fff6fb',g:'#6fae52',L:'#8fcf6a',l:'#5e9a3e'};
function kidBudDraw(ctx,j,now){const K=S.kid,x0=j%W*TS+TS/2,y0=((j/W)|0)*TS+TS*.82-hiAt(j)*LIFT,big=K.bornD!=null,sh=KIDSCENE&&KIDSCENE.shk?Math.round(Math.sin((now-KIDSCENE.shk)/40)*1.5):0;
  const t=now/1000,gl=(Math.sin(t*(big?3.2:1.6))+1)/2;ctx.save();ctx.fillStyle='rgba(255,240,200,'+(.18+gl*.22)+')';const R=big?7:5;for(let b=-R;b<=R;b++){const w=Math.round(Math.sqrt(R*R-b*b));ctx.fillRect(x0-w,y0-14+b,w*2,1)}/* 光（ドットの丸） */
  const g=1;KBUD.forEach((row,yy)=>[...row].forEach((c,xx)=>{const col=KBUDC[c];if(!col)return;ctx.fillStyle=col;ctx.fillRect(x0-5*g+xx*g+sh,y0-12*g+yy*g,g,g)}));
  ctx.fillStyle='rgba(255,255,255,'+(.5+gl*.5)+')';for(let i=0;i<3;i++){const a=t*.9+i*2.1,px=Math.round(x0+Math.cos(a)*(R+2)),py=Math.round(y0-14+Math.sin(a)*(R-1));ctx.fillRect(px,py,1,1)}ctx.restore()}
function kidDraw(add,vis,ctx,now){if(!S||!S.free||!S.kid)return;const K=S.kid;
  if(K.st==='bud'){const j=K.bj;if(vis({x:j%W+.5,y:((j/W)|0)+.5}))add(((j/W)|0)+.5,1,null,()=>kidBudDraw(ctx,j,now),j);return}
  const g=KR;if(!g||KRS!==S)return;const px=g.x*TS,fy=g.y*TS;add(g.y,2,[px-30,fy-70,px+30,fy+15],()=>drawRes(g,now),(g.y|0)*W+(g.x|0))}
