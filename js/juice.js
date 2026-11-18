/* 気持ちよさ（juice.js）。見た目と音だけで、数字・せいれいの行動の計算はかえない。セーブしない。
   1. 物が上の数へ飛ぶ（juiceFly）：せいれいが箱にしまった食べ物・素材、ごほうびのパワーが、ドットの粒になって、上の欄の数へ飛ぶ
   2. さいごの一回の手ごたえ（juiceBreak）：木がたおれる・岩がわれる・収穫のしゅんかんに、はじける粒・輪・小さなゆれ・音・せいれいの小さなジャンプ
   3. つづけて置く気持ちよさ（juicePlace）：つづけて置くと、音の高さが1つずつ上がり、まとめて置いた物は順に着地する
   4. ごほうびのしゅんかん（juiceCheer）：目標のたっせい・村レベルアップに、ドットの紙ふぶきと、せいれいのよろこぶ動き
   どれも実時間でうごく。うごきをへらす設定では、画面をゆらさない */
const JUICE_FLYMS=560;/* 上の数へ飛ぶ時間（ミリ秒） */
const JUICE_FLYMAX=12;/* 同時に飛ぶ粒の数 */
const JUICE_COMBO=1100;/* この時間（ミリ秒）のうちに、つぎを置くと、つづきになる */
const JUICE_STAG=45;/* まとめて置いた物が、順に着地する間かく（ミリ秒） */
const JUICE_SHAKEGAP=1500;/* 画面のゆれは、この時間に1回まで */
const JUICE_SCALE=[0,2,4,7,9,12,14,16,19];/* つづけて置いたときの音の高さ（半音。ドレミソラの五音） */
const JFLY=[],JCONF=[];let JFLYIC=null,JSHAKE=0,JCOMBO={t:0,n:0,f:0,k:0},JSND=0;
function juiceOK(){return typeof S!=='undefined'&&S&&started&&!(typeof MEMRUN!=='undefined'&&MEMRUN)&&!(typeof IS_STORY_REPLAY!=='undefined'&&IS_STORY_REPLAY)}
function juiceScreen(wx,wy){/* マップの場所（マス）→ 画面の場所（px） */const cv=document.getElementById('cv'),b=cv?cv.getBoundingClientRect():{left:0,top:0};return[b.left+(wx*TS-cam.x)*cam.z,b.top+(wy*TS-cam.y)*cam.z]}
function juiceIcons(){/* 飛ぶ粒の絵（7×7ドット）：食べ物は葉・素材は木のかけら・パワーは光 */if(JFLYIC)return JFLYIC;const P={food:['..gg...','.gGGg..','gGGGGg.','gGGLGg.','.gGGg..','..gg.b.','.....b.'],mat:['..dddd.','.dWWWWd','dWWwWWd','dWwWWwd','dWWWWd.','.dddd..','.......'],pt:['...y...','...Y...','..yYy..','yYYWYYy','..yYy..','...Y...','...y...']},C={g:'#5ea24a',G:'#8fd06a',L:'#d2f0a8',b:'#8a6238',d:'#8a6238',W:'#d9a868',w:'#f0cf98',y:'#f0c04a',Y:'#ffe58a'};JFLYIC={};
  for(const k in P){const c=document.createElement('canvas');c.width=c.height=7;const g=c.getContext('2d');P[k].forEach((row,y)=>{for(let x=0;x<7;x++){const ch=row[x];if(ch==='.')continue;g.fillStyle=k==='pt'&&ch==='W'?'#fffbe6':C[ch];g.fillRect(x,y,1,1)}});JFLYIC[k]=c.toDataURL()}return JFLYIC}
function juiceFly(wx,wy,kind,n){/* kind：food・mat・pt。n：ふえた数（粒は3つまで、パワーは5つまで） */if(!juiceOK()||sheet!=null||typeof SKIP!=='undefined'&&SKIP)return;const tg=document.getElementById(kind==='food'?'food':kind==='mat'?'matN':'pt');if(!tg)return;const tb=tg.getBoundingClientRect();if(!tb.width)return;
  const p=juiceScreen(wx,wy);if(p[0]<-20||p[1]<-20||p[0]>innerWidth+20||p[1]>innerHeight+20)return;const m=Math.min(kind==='pt'?5:3,Math.max(1,n|0)),now=performance.now(),ic=juiceIcons()[kind];
  for(let i=0;i<m&&JFLY.length<JUICE_FLYMAX;i++){const e=document.createElement('img');e.src=ic;e.alt='';e.style.cssText='position:fixed;left:0;top:0;width:14px;height:14px;image-rendering:pixelated;pointer-events:none;z-index:58;will-change:transform;opacity:0';document.body.appendChild(e);
    JFLY.push({e,x0:p[0]+(i-(m-1)/2)*9,y0:p[1]-34,x1:tb.left+tb.width/2,y1:tb.top+tb.height/2,t0:now+i*80,tg,bow:40+Math.random()*30,sx:(Math.random()-.5)*40})}}
function juiceFlyStep(now){for(let i=JFLY.length-1;i>=0;i--){const f=JFLY[i],u=(now-f.t0)/JUICE_FLYMS;if(u<0)continue;
    if(u>=1||!f.e.isConnected){f.e.remove();JFLY.splice(i,1);if(u>=1&&f.tg&&f.tg.isConnected&&f.tg.animate&&!(typeof uiReduced==='function'&&uiReduced())){try{(f.tg.closest('.htag')||f.tg).animate([{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(1.5px)'},{transform:'translateY(0)'}],{duration:180,easing:'steps(3)'})}catch(e){}}/* とどいたら、数の札が小さくはねる */continue}
    /* はじめに、ぽんと上へはねて、それから数へすいこまれる（だんだん速く） */const k=u<.25?0:Math.pow((u-.25)/.75,2),hop=u<.25?Math.sin(u/.25*Math.PI/2):1,x=f.x0+f.sx*hop*(1-k)+(f.x1-f.x0)*k,y=f.y0-f.bow*hop*(1-k)+(f.y1-f.y0)*k,s=u>.85?1-(u-.85)/.15*.5:1;
    f.e.style.opacity='1';f.e.style.transform='translate('+(Math.round(x/1.5)*1.5-7)+'px,'+(Math.round(y/1.5)*1.5-7)+'px) scale('+s+')'}}

/* ---------- さいごの一回の手ごたえ ---------- */
const JBRK={wood:{c:['#b98a56','#8f6238','#d9b27c','#7fc25e','#a6dd7c'],n:12,ring:'rgba(255,240,200,.9)'},stone:{c:['#b9bcc4','#8e929c','#dfe2e8','#6f737d'],n:11,ring:'rgba(235,240,250,.9)'},crop:{c:['#ffe07a','#f6b84a','#9bd66a','#fff3b0'],n:8,ring:''}};
function juiceThud(kind,x,y){if(typeof AC==='undefined'||!AC||!SND.sfx||AC.state!=='running'||typeof sfxG==='undefined'||!sfxG)return;const q=sfxPos(x,y);if(!q)return;const now=performance.now();if(now-JSND<90)return;JSND=now;const t=AC.currentTime,g=AC.createGain();g.gain.value=q.v*1.5;let o=g;if(AC.createStereoPanner){const pn=AC.createStereoPanner();pn.pan.value=q.p;g.connect(pn);o=pn}o.connect(sfxG);const r=.94+Math.random()*.12;
  if(kind==='wood'){knock(72*r,t,.16,g,.22);rustle(t+.02,.2,.05,g,2200*r,900*r,.7);knock(150*r,t+.07,.05,g,.1)}/* どさっ：低いひびきと、葉のざわっ */
  else if(kind==='stone'){knock(120*r,t,.14,g,.12);knock(310*r,t+.015,.07,g,.05);rustle(t,.1,.05,g,3400*r,1800*r,1)}/* ごとっ：かたい音と、くだける音 */
  else{knock(420*r,t,.05,g,.06);rustle(t,.07,.03,g,2600*r,1700*r,.9)}}
function juiceBreak(j,kind,r){if(!juiceOK()||j==null||j<0)return;const B=JBRK[kind];if(!B)return;const x=j%W+.5,y=((j/W)|0)+.5,lift=typeof hiAt==='function'?hiAt(j)*LIFT:0,cx=x*TS,cy=y*TS-lift,p=juiceScreen(x,y);if(p[0]<-60||p[1]<-60||p[0]>innerWidth+60||p[1]>innerHeight+60)return;
  for(let i=0;i<B.n;i++){const a=-Math.PI*(.12+.76*(i+Math.random()*.6)/B.n),sp=(kind==='crop'?55:85)+Math.random()*70;fx.push({k:'p',x:cx+(Math.random()-.5)*10,y:cy-(kind==='wood'?14:4),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(kind==='crop'?40:20),life:.75+Math.random()*.35,col:B.c[(Math.random()*B.c.length)|0],r:kind==='crop'?3:3+((Math.random()*2)|0)})}
  if(B.ring)fx.push({k:'ring',x:cx,y:cy+4,life:1});juiceThud(kind,x,y);
  if(r&&typeof JUMP!=='undefined')JUMP.set(r,performance.now()+(kind==='crop'?0:120));/* 作業したせいれいが、小さくとびはねる */
  if(kind!=='crop'&&cam.z>=homeZ()*.7)juiceShake()}
function juiceShake(){const now=performance.now();if(now-JSHAKE<JUICE_SHAKEGAP)return;if(typeof uiReduced==='function'&&uiReduced())return;JSHAKE=now;try{const v=document.getElementById('cv');if(v.classList.contains('shk2')||v.classList.contains('shk3'))return;v.classList.add('shk2');setTimeout(()=>v.classList.remove('shk2'),280)}catch(e){}}

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
function juiceFrame(now){if(JFLY.length)juiceFlyStep(now)}
function juiceReset(){for(const f of JFLY)f.e.remove();JFLY.length=0;JCONF.length=0}
