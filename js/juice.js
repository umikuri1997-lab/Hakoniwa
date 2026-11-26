/* 気持ちよさ（juice.js）。見た目と音だけで、数字・せいれいの行動の計算はかえない。セーブしない。
   1. 物が上の数へ飛ぶ（juiceFly）：せいれいが箱にしまった食べ物・素材、パワーが生まれたとき（ごほうび・はたらいた・追いはらった・おたきあげ など）が、ドットの粒になって、上の欄の数へ飛ぶ。パワーは「ぽぽぽぽ」とつぎつぎ飛び、とどくたびに上の数がふえる（juicePtShow）
   2. さいごの一回の手ごたえ（juiceBreak）：木がたおれる・岩がわれる・収穫のしゅんかんに、はじける粒・輪・小さなゆれ・音・せいれいの小さなジャンプ
   3. つづけて置く気持ちよさ（juicePlace）：つづけて置くと、音の高さが1つずつ上がり、まとめて置いた物は順に着地する
   4. ごほうびのしゅんかん（juiceCheer）：目標のたっせい・村レベルアップに、ドットの紙ふぶきと、せいれいのよろこぶ動き
   どれも実時間でうごく。うごきをへらす設定では、画面をゆらさない */
const JUICE_FLYMS=560;/* 上の数へ飛ぶ時間（ミリ秒） */
const JUICE_FLYMAX=24;/* 同時に飛ぶ粒の数 */
const JUICE_PTMAX=8;/* パワーの粒は、1回に8つまで（ぽぽぽぽ、とつぎつぎ） */
const JUICE_PTGAP=70;/* パワーの粒が、つぎつぎ飛ぶ間かく（ミリ秒） */
const JUICE_COMBO=1100;/* この時間（ミリ秒）のうちに、つぎを置くと、つづきになる */
const JUICE_STAG=45;/* まとめて置いた物が、順に着地する間かく（ミリ秒） */
const JUICE_SHAKEGAP=1500;/* 画面のゆれは、この時間に1回まで */
const JUICE_SCALE=[0,2,4,7,9,12,14,16,19];/* つづけて置いたときの音の高さ（半音。ドレミソラの五音） */
const JFLY=[],JCONF=[];let JPTPEND=0,JFLYIC=null,JSHAKE=0,JCOMBO={t:0,n:0,f:0,k:0},JSND=0;
function juiceOK(){return typeof S!=='undefined'&&S&&started&&!(typeof MEMRUN!=='undefined'&&MEMRUN)&&!(typeof IS_STORY_REPLAY!=='undefined'&&IS_STORY_REPLAY)}
function juiceScreen(wx,wy){/* マップの場所（マス）→ 画面の場所（px） */const cv=document.getElementById('cv'),b=cv?cv.getBoundingClientRect():{left:0,top:0};const p=w2s(wx*TS,wy*TS);return[b.left+p.x,b.top+p.y]}
function juiceIcons(){/* 飛ぶ粒の絵（7×7ドット）：食べ物は葉・素材は木のかけら・パワーは光 */if(JFLYIC)return JFLYIC;const P={food:['..gg...','.gGGg..','gGGGGg.','gGGLGg.','.gGGg..','..gg.b.','.....b.'],mat:['..dddd.','.dWWWWd','dWWwWWd','dWwWWwd','dWWWWd.','.dddd..','.......'],pt:['...y...','...Y...','..yYy..','yYYWYYy','..yYy..','...Y...','...y...']},C={g:'#5ea24a',G:'#8fd06a',L:'#d2f0a8',b:'#8a6238',d:'#8a6238',W:'#d9a868',w:'#f0cf98',y:'#f0c04a',Y:'#ffe58a'};JFLYIC={};
  for(const k in P){const c=document.createElement('canvas');c.width=c.height=7;const g=c.getContext('2d');P[k].forEach((row,y)=>{for(let x=0;x<7;x++){const ch=row[x];if(ch==='.')continue;g.fillStyle=k==='pt'&&ch==='W'?'#fffbe6':C[ch];g.fillRect(x,y,1,1)}});JFLYIC[k]=c.toDataURL()}return JFLYIC}
function juiceFly(wx,wy,kind,n){/* kind：food・mat・pt。n：ふえた数（粒は3つまで、パワーは5つまで） */if(!juiceOK()||sheet!=null||typeof SKIP!=='undefined'&&SKIP)return;const tg=document.getElementById(kind==='food'?'food':kind==='mat'?'matN':'pt');if(!tg)return;const tb=tg.getBoundingClientRect();if(!tb.width)return;
  const p=juiceScreen(wx,wy);if(kind==='pt'){p[0]=Math.max(30,Math.min(innerWidth-30,p[0]));p[1]=Math.max(tb.bottom+60,Math.min(innerHeight-90,p[1]))}/* パワーは、生まれた所が画面の外でも、画面のはしから飛んでくる */else if(p[0]<-20||p[1]<-20||p[0]>innerWidth+20||p[1]>innerHeight+20)return;const N=Math.max(1,n|0),m=Math.min(kind==='pt'?JUICE_PTMAX:3,N,Math.max(0,JUICE_FLYMAX-JFLY.length)),now=performance.now(),ic=juiceIcons()[kind];if(!m)return;const st=kind!=='pt'&&typeof juiceStoreNote==='function'?juiceStoreNote():null;/* つづけてしまうと、とどく音が上がる */
  for(let i=0;i<m;i++){const e=document.createElement('img');e.src=ic;e.alt='';e.style.cssText='position:fixed;left:0;top:0;width:14px;height:14px;image-rendering:pixelated;pointer-events:none;z-index:58;will-change:transform;opacity:0';document.body.appendChild(e);
    /* パワーは、粒がとどくたびに、上の数がその分だけふえる（pv：この粒の分。のこりは、はじめの粒に） */const pv=kind==='pt'?Math.floor(N/m)+(i<N%m?1:0):0;JPTPEND+=pv;
    JFLY.push({e,pv,x0:p[0]+(i-(m-1)/2)*(kind==='pt'?6:9),y0:p[1]-34,x1:tb.left+tb.width/2,y1:tb.top+tb.height/2,t0:now+i*(kind==='pt'?JUICE_PTGAP:80),tg,bow:40+Math.random()*30,sx:(Math.random()-.5)*40,st:i===0?st:null})}}
function juicePtShow(){/* 上の欄に出すパワー：飛んでいるとちゅうの粒の分は、まだ足さない */return Math.max(0,S.pt-JPTPEND)}
function juiceFlyStep(now){for(let i=JFLY.length-1;i>=0;i--){const f=JFLY[i],u=(now-f.t0)/JUICE_FLYMS;if(u<0)continue;
    if(u>=1||!f.e.isConnected){f.e.remove();JFLY.splice(i,1);if(f.pv){JPTPEND=Math.max(0,JPTPEND-f.pv);const pe=document.getElementById('pt');if(pe&&S)pe.textContent=juicePtShow()}if(u>=1&&f.st!=null&&typeof juiceStoreDing==='function')juiceStoreDing(f.st);if(u>=1&&f.tg&&f.tg.isConnected&&f.tg.animate&&!(typeof uiReduced==='function'&&uiReduced())){try{(f.tg.closest('.htag')||f.tg).animate([{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(1.5px)'},{transform:'translateY(0)'}],{duration:180,easing:'steps(3)'})}catch(e){}}/* とどいたら、数の札が小さくはねる */continue}
    /* はじめに、ぽんと上へはねて、それから数へすいこまれる（だんだん速く） */const k=u<.25?0:Math.pow((u-.25)/.75,2),hop=u<.25?Math.sin(u/.25*Math.PI/2):1,x=f.x0+f.sx*hop*(1-k)+(f.x1-f.x0)*k,y=f.y0-f.bow*hop*(1-k)+(f.y1-f.y0)*k,s=u>.85?1-(u-.85)/.15*.5:1;
    f.e.style.opacity='1';f.e.style.transform='translate('+(Math.round(x/1.5)*1.5-7)+'px,'+(Math.round(y/1.5)*1.5-7)+'px) scale('+s+')'}}

/* ---------- さいごの一回の手ごたえ ---------- */
const JBRK={wood:{c:['#b98a56','#8f6238','#d9b27c','#7fc25e','#a6dd7c'],n:12,ring:'rgba(255,240,200,.9)'},stone:{c:['#b9bcc4','#8e929c','#dfe2e8','#6f737d'],n:11,ring:'rgba(235,240,250,.9)'},crop:{c:['#ffe07a','#f6b84a','#9bd66a','#fff3b0'],n:8,ring:''}};
function juiceThud(kind,x,y){if(typeof AC==='undefined'||!AC||!SND.sfx||AC.state!=='running'||typeof sfxG==='undefined'||!sfxG)return;const q=sfxPos(x,y);if(!q)return;const now=performance.now();if(now-JSND<90)return;JSND=now;const t=AC.currentTime,g=AC.createGain();g.gain.value=q.v*1.5;let o=g;if(AC.createStereoPanner){const pn=AC.createStereoPanner();pn.pan.value=q.p;g.connect(pn);o=pn}o.connect(sfxG);const r=.94+Math.random()*.12;
  if(kind==='wood'){knock(72*r,t,.16,g,.22);rustle(t+.02,.2,.05,g,2200*r,900*r,.7);knock(150*r,t+.07,.05,g,.1)}/* どさっ：低いひびきと、葉のざわっ */
  else if(kind==='stone'){knock(120*r,t,.14,g,.12);knock(310*r,t+.015,.07,g,.05);rustle(t,.1,.05,g,3400*r,1800*r,1)}/* ごとっ：かたい音と、くだける音 */
  else{knock(420*r,t,.05,g,.06);rustle(t,.07,.03,g,2600*r,1700*r,.9)}}
function juiceBreak(j,kind,r,mute){/* mute：どさっ・ごとっの音を鳴らさない（こわすモードは、こわす音だけ） */if(!juiceOK()||j==null||j<0)return;const B=JBRK[kind];if(!B)return;const n0=fx.length&&fx[fx.length-1].k==='spr'&&(fx[fx.length-1].n==='treefall'||fx[fx.length-1].n==='rockbreak')?fx.length-1:fx.length;/* すぐ前にながした、たおれる・われる絵も、ヒットストップでとめる */const x=j%W+.5,y=((j/W)|0)+.5,lift=typeof hiAt==='function'?liftOf(j):0,cx=x*TS,cy=y*TS-lift,A=typeof objFootJ==='function'&&!(typeof caveOn==='function'&&caveOn())?objFootJ(j):undefined/* 粒と輪は、その物の足もとに立てる（iso-fx.js） */,p=juiceScreen(x,y);if(p[0]<-60||p[1]<-60||p[0]>innerWidth+60||p[1]>innerHeight+60)return;
  for(let i=0;i<B.n;i++){const a=-Math.PI*(.12+.76*(i+Math.random()*.6)/B.n),sp=(kind==='crop'?55:85)+Math.random()*70;fx.push({k:'p',x:cx+(Math.random()-.5)*10,y:cy-(kind==='wood'?14:4),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(kind==='crop'?40:20),life:.75+Math.random()*.35,col:B.c[(Math.random()*B.c.length)|0],r:kind==='crop'?3:3+((Math.random()*2)|0),A})}
  if(B.ring)fx.push({k:'ring',x:cx,y:cy+4,life:1,A});if(!mute)juiceThud(kind,x,y);
  if(r&&typeof JUMP!=='undefined')JUMP.set(r,performance.now()+(kind==='crop'?0:120));/* 作業したせいれいが、小さくとびはねる */
  if(kind!=='crop'&&typeof juiceStop==='function')juiceStop(r,n0);/* さいごの一撃：一瞬とまって、ふるえてから、はじける（juice2.js） */
  if(kind==='stone'&&cam.z>=homeZ()*.7)juiceShake()}/* 木は切ったときにゆらさない：たおれきって、ドンと地面についたとき（tfThud）だけ */
/* ---------- 木がたおれる（treeFall） ----------
   さいごの一回で木がなくなったとき（useNat・守りの光 natHit）、その木の絵を、根もとを軸にまわしてたおす。音は持ち主の音（SAMPLES.treefall：ミシミシ → TFTHUD 秒にドン）。
   ミシミシのあいだ（TFWOB 秒まで）は、ゆれる。そのあと、だんだん速くかたむいて、ドンで地面につき、小さくはねて、TFLIE 秒ねてから TFOUT 秒でうすれる。
   たおれる向きは、切ったせいれいの反対がわ。見た目と音だけ（実時間・セーブしない）。奥行きの順に描く（draw-world.js の add）。 */
const TFALL=[],TFIDS=new Set(['tree','ntree','fruit','deadtree','bamboo']),TFTHUD=2.52,TFWOB=1.3,TFLIE=.6,TFOUT=.5,TFANG=Math.PI/2*.92;
function treeFall(j,o,r){if(!juiceOK()||!TFIDS.has(o))return;const x=j%W,y=(j/W)|0,d=S.dyn[j],g=d?(d.g!=null?d.g:d.p):0,
    dir=r&&Math.abs(r.x-(x+.5))>.05?(r.x<x+.5?1:-1):(hash(j*7+dayNo())<.5?-1:1),red=typeof uiReduced==='function'&&uiReduced();
  TFALL.push({j,o,g,px:x*TS,py:y*TS-(typeof hiAt==='function'?liftOf(j):0),dir,t0:performance.now(),dep:y+.5,thud:0,red,S});sfxAt('treefall',x+.5,y+.5)}
function tfAng(f,s){if(f.red)return s<TFTHUD?0:f.dir*TFANG;/* うごきをへらす設定：ゆらさず、ドンでたおれた絵に */
  if(s<TFWOB){const k=s/TFWOB;return f.dir*(.012*k+.035*k*Math.sin(s*17))}/* ミシミシ：ゆれる */
  if(s<TFTHUD){const u=(s-TFWOB)/(TFTHUD-TFWOB);return f.dir*(.012+(TFANG-.012)*Math.pow(u,2.6))}/* だんだん速く、かたむく */
  const b=s-TFTHUD;return f.dir*(TFANG-(b<.28?.09*Math.sin(Math.PI*b/.28):0))}/* ドン：小さくはねる */
function drawTreeFall(f,now){const s=(now-f.t0)/1000;if(s>=TFTHUD&&!f.thud){f.thud=1;tfThud(f)}
  const a=s<TFTHUD+TFLIE?1:Math.max(0,1-(s-TFTHUD-TFLIE)/TFOUT);if(a<=0)return;const bx=f.px+TS/2,by=f.py+TS*.82;
  ctx.save();ctx.globalAlpha*=a;ctx.translate(bx,by);ctx.rotate(tfAng(f,s));ctx.translate(-bx,-by);try{drawObj(ctx,f.o,f.px,f.py,f.j,f.g,now)}catch(e){}ctx.restore()}
function tfThud(f){const B=JBRK.wood,L=TS*2.2;for(let i=0;i<14;i++){const q=Math.random(),x=f.px+TS/2+f.dir*q*L,y=f.py+TS*.8+(Math.random()-.5)*8,a=-Math.PI*(.15+.7*Math.random()),sp=40+Math.random()*70;
    fx.push({k:'p',x,y,vx:Math.cos(a)*sp*(Math.random()<.5?-1:1),vy:Math.sin(a)*sp,life:.6+Math.random()*.4,col:B.c[(Math.random()*B.c.length)|0],r:3})}/* 地面についた所から、葉と木くず */
  fx.push({k:'ring',x:f.px+TS/2+f.dir*L*.5,y:f.py+TS*.7,life:1,col:'rgba(225,205,165,.85)'});/* 土ぼこり */
  if(!f.red&&cam.z>=homeZ()*.7)juiceShake()}
function treeFallTick(now){for(let i=TFALL.length-1;i>=0;i--){const f=TFALL[i];if((now-f.t0)/1000>TFTHUD+TFLIE+TFOUT||f.S!==S)TFALL.splice(i,1)}}/* 終わった・村がかわった */
function juiceShake(){const now=performance.now();if(now-JSHAKE<JUICE_SHAKEGAP)return;if(typeof uiReduced==='function'&&uiReduced())return;JSHAKE=now;shakeScreen('s')}

/* ---------- つづけて置く気持ちよさ ---------- */
function juicePlace(j,kind){/* burst から。かえす数：この物が着地するまでのおくれ（ミリ秒。まとめて置いたときだけ） */if(!juiceOK()||kind!=='block'&&kind!=='furn'&&kind!=='plant')return 0;const now=performance.now(),C=JCOMBO;
  if(now-C.t<8){C.k++}else{C.k=0}/* 同じコマで置いた物（まとめて置く）は、順に着地 */if(now-C.t<JUICE_COMBO)C.n++;else C.n=0;C.t=now;const d=Math.min(C.k,24)*JUICE_STAG;
  if(C.n>0&&C.k<10&&typeof AC!=='undefined'&&AC&&SND.sfx&&AC.state==='running'&&typeof sfxG!=='undefined'&&sfxG){const q=sfxPos(j%W+.5,((j/W)|0)+.5);if(q){const st=JUICE_SCALE[Math.min(C.n,JUICE_SCALE.length-1)],f=392*Math.pow(2,st/12),t=AC.currentTime+d/1000+.03,g=AC.createGain();g.gain.value=q.v;g.connect(sfxG);knock(f,t,.07,g,.11);knock(f*2,t,.02,g,.07)}}/* つづけるほど、木琴のように音が上がる */
  return d}

/* ---------- ごほうびのしゅんかん：紙ふぶきと、よろこぶ動き ---------- */
const JCONFC=['#f6a650','#ffe07a','#8fd06a','#7fc4ea','#f3aec5','#fffbe6'];
function juiceCheer(k){if(!juiceOK())return;const now=performance.now(),n=k==='lv'?70:44;if(JCONF.length<160)for(let i=0;i<n;i++)JCONF.push({x:Math.random(),y:-.05-Math.random()*.35,vx:(Math.random()-.5)*.12,vy:.28+Math.random()*.3,p:Math.random()*6.283,c:JCONFC[(Math.random()*JCONFC.length)|0],w:Math.random()<.5?2:3,t0:now,life:2600+Math.random()*900});
  if(typeof JOYU!=='undefined')for(const r of S.res){if(r.hidden||r.nap||r.act&&r.act.type==='sleep')continue;JOYU.set(r,now+1600);if(typeof JUMP!=='undefined')JUMP.set(r,now+Math.random()*250)}}
function juiceDraw(now){/* render のさいご（画面の点で）。紙ふぶきは、ドットの四角がひらひら落ちる */if(!JCONF.length)return;const c=ctx,P=1.5;for(let i=JCONF.length-1;i>=0;i--){const m=JCONF[i],e=now-m.t0;if(e>m.life){JCONF.splice(i,1);continue}const t=e/1000,x=(m.x+m.vx*t+Math.sin(t*3+m.p)*.012)*VW,y=(m.y+m.vy*t)*VH;if(y>VH+8){JCONF.splice(i,1);continue}
    const fl=Math.sin(t*9+m.p)>0;c.globalAlpha=Math.min(1,(m.life-e)/400);c.fillStyle=m.c;c.fillRect(Math.round(x/P)*P,Math.round(y/P)*P,P*(fl?m.w+1:2),P*3)}c.globalAlpha=1}
function juiceFrame(now){if(JFLY.length)juiceFlyStep(now);if(typeof juice2Frame==='function')juice2Frame(now)}
function juiceReset(){for(const f of JFLY)f.e.remove();JFLY.length=0;JPTPEND=0;JCONF.length=0;if(typeof juice2Reset==='function')juice2Reset()}
