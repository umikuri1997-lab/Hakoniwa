/* 気持ちよさ・その2（juice2.js）。見た目と音だけで、数字・せいれいの行動の計算はかえない。セーブしない。
   1. 家ができたしゅんかん（juiceHouse）：壁にそって光が1周はしり、家の上で光がはじけ、近くのせいれいがよろこぶ
   2. さいごの一撃のヒットストップ（juiceStop）：木がたおれる・岩がわれるとき、その物とせいれいが一瞬とまってふるえてから、はじける（村の時間はとめない）
   3. つづけてしまう音（juiceStoreNote）：せいれいがつづけて箱にしまうと、粒がとどく音が1つずつ高くなる
   4. 村レベルの光のなみ（juiceWave）：神殿から村じゅうへ光の輪がひろがり、ふれた木・花がゆれ、せいれいがよろこぶ
   どれも実時間でうごく */
const JHOUSEMS=1300;/* 家の壁を光が1周する時間（ミリ秒） */
const JSTOPMS=90;/* ヒットストップの長さ（ミリ秒） */
const JSTORECOMBO=1400;/* この時間（ミリ秒）のうちに、つぎをしまうと、つづきになる */
const JWAVEMS=2600;/* 光のなみが、ひろがりきるまで（ミリ秒） */
const JWAVER=36;/* 光のなみの、いちばん大きい半径（マス） */
const JHS=[];let JHREF=null,JHSIG=null,JSTORE={t:0,n:0},JWAVE=null;const JSTOPR=new WeakMap();
function juice2OK(){return typeof juiceOK==='function'&&juiceOK()}
function jKnock(f,dt,v,len){if(typeof AC==='undefined'||!AC||!SND.sfx||AC.state!=='running'||typeof sfxG==='undefined'||!sfxG)return;const g=AC.createGain();g.gain.value=v;g.connect(sfxG);knock(f,AC.currentTime+dt,len||.07,g,.11);knock(f*2,AC.currentTime+dt,.02,g,.06)}

/* ---------- 1. 家ができたしゅんかん ---------- */
function houseSig(h){let m=1e9;for(const j of h.set)if(j<m)m=j;return m+':'+h.set.size}
function juiceHouseWatch(now){/* HOUSES が作りなおされたら、新しい家をさがす */if(typeof HOUSES==='undefined'||HOUSES===JHREF)return;JHREF=HOUSES;const sig=new Set(HOUSES.map(houseSig));
  if(JHSIG&&juice2OK()&&stageReady())for(const h of HOUSES){const k=houseSig(h);if(!JHSIG.has(k))juiceHouse(h,now)}JHSIG=sig}
function juiceHouse(h,now){if(JHS.length>4)return;let sx=0,sy=0,n=0;for(const j of h.set){sx+=j%W+.5;sy+=((j/W)|0)+.5;n++}if(!n)return;const cx=sx/n,cy=sy/n,cells=[];
  for(const j of h.set){const x=j%W+.5,y=((j/W)|0)+.5;cells.push({x,y,a:(Math.atan2(y-cy,x-cx)+Math.PI*2.5)%(Math.PI*2)})}/* 上から時計まわりに、壁のマスの角度 */
  let top=1e9;for(const c of cells)if(c.y<top)top=c.y;JHS.push({cells,cx,cy,top,t0:now,pop:0});
  for(let i=0;i<6;i++)jKnock(392*Math.pow(2,[0,4,7,12,16,19][i]/12),i*.11,.5);/* 光がまわるあいだ、音が上がっていく */
  if(typeof JOYU!=='undefined')for(const r of S.res){if(r.hidden||r.nap||r.act&&r.act.type==='sleep')continue;if(Math.hypot(r.x-cx,r.y-cy)>9)continue;JOYU.set(r,now+JHOUSEMS+1400);if(typeof JUMP!=='undefined')JUMP.set(r,now+JHOUSEMS+Math.random()*200)}}/* 近くのせいれいは、光がまわりおわったら、よろこぶ */
function juiceHouseDraw(now){for(let i=JHS.length-1;i>=0;i--){const H=JHS[i],e=now-H.t0;if(e>JHOUSEMS+900){JHS.splice(i,1);continue}const P=2;
    const u=Math.min(1,e/JHOUSEMS),a0=u*Math.PI*2;
    for(const c of H.cells){let d=a0-c.a;if(d<0)continue;/* まだ光がとどいていない壁 */const fade=e>JHOUSEMS?1-(e-JHOUSEMS)/900:1,hot=Math.max(0,1-d/.9);ctx.globalAlpha=Math.max(0,(.18+.6*hot)*fade);ctx.fillStyle=hot>.5?'#fffbe6':'#ffe58a';
      const x=c.x*TS,y=c.y*TS-(typeof hiAt==='function'?hiAt((c.y|0)*W+(c.x|0))*LIFT:0);for(let k=0;k<4;k++){const ox=Math.round((hash(c.x*31+c.y*7+k)*TS-TS/2)/P)*P,oy=Math.round((hash(c.x*13+c.y*5+k*3)*TS*.6-TS*.5)/P)*P;ctx.fillRect(x+ox,y+oy,P*(hot>.5?2:1),P*(hot>.5?2:1))}}
    if(e>=JHOUSEMS&&!H.pop){H.pop=1;const x=H.cx*TS,y=(H.top-.6)*TS;fx.push({k:'ring',x,y,life:1,col:'rgba(255,240,180,.95)'});for(let k=0;k<14;k++){const a=-Math.PI*(k/13),sp=70+Math.random()*60;fx.push({k:'p',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-50,life:.9+Math.random()*.3,col:['#ffe58a','#fffbe6','#f6a650','#8fd06a'][k%4],r:3})}jKnock(784,0,.6,.12);jKnock(1176,.06,.45,.1)}/* 家の上で、ぽん */}
  ctx.globalAlpha=1}

/* ---------- 2. さいごの一撃のヒットストップ ---------- */
function juiceStop(r,n0){/* juiceBreak から。n0：その一撃の前の fx の数（そのあとに入れた絵と粒を、一瞬とめる） */const now=performance.now(),w=now+JSTOPMS;for(let i=Math.max(0,n0);i<fx.length;i++){fx[i].w0=w;if(fx[i].k==='spr')fx[i].jit=1}if(r)JSTOPR.set(r,now)}
function juiceStopOff(r,now){const t=JSTOPR.get(r);if(t==null)return 0;const d=now-t;if(d<0||d>JSTOPMS+60)return 0;return(Math.floor(d/30)%2?1:-1)*(d<JSTOPMS?1.5:.75)}/* とまっているあいだ、左右にふるえる */
function fxWaiting(f,now){return f.w0!=null&&now<f.w0}

/* ---------- 3. つづけてしまう音 ---------- */
function juiceStoreNote(){/* juiceFly から（食べ物・素材）。かえす数：とどいたときに鳴らす音の高さ（半音） */const now=performance.now(),C=JSTORE;if(now-C.t<JSTORECOMBO)C.n++;else C.n=0;C.t=now;return JUICE_SCALE[Math.min(C.n,JUICE_SCALE.length-1)]}
function juiceStoreDing(st){jKnock(523*Math.pow(2,st/12),0,.35,.06)}

/* ---------- 4. 村レベルの光のなみ ---------- */
function juiceWave(){if(!juice2OK())return;const c=typeof evTemple==='function'?evTemple():[CX+.5,CY+.5],now=performance.now();JWAVE={x:c[0],y:c[1],t0:now};
  if(typeof JOYU!=='undefined')for(const r of S.res){if(r.hidden||r.nap||r.act&&r.act.type==='sleep')continue;const dl=Math.hypot(r.x-c[0],r.y-c[1])/JWAVER*JWAVEMS;if(dl>JWAVEMS)continue;JOYU.set(r,now+dl+1500);if(typeof JUMP!=='undefined')JUMP.set(r,now+dl)}}/* 光がとどいたせいれいから、あおいでよろこぶ */
function waveR(now){if(!JWAVE)return-1;const e=now-JWAVE.t0;if(e>JWAVEMS+400){JWAVE=null;return-1}return Math.pow(Math.min(1,e/JWAVEMS),.8)*JWAVER}
function waveSway(j,now){/* swayK から：光のなみがふれた木・花が、ぷるっとゆれる */if(!JWAVE)return 0;const R=waveR(now);if(R<0)return 0;const d=Math.hypot(j%W+.5-JWAVE.x,((j/W)|0)+.5-JWAVE.y),q=R-d;return q>0&&q<3?Math.sin(q*5)*.06*(1-q/3):0}
function juiceWaveDraw(now){const R=waveR(now);if(R<0)return;const e=now-JWAVE.t0,fade=e>JWAVEMS?1-(e-JWAVEMS)/400:1,P=2,cx=JWAVE.x*TS,cy=JWAVE.y*TS,rr=R*TS,n=Math.max(24,Math.round(R*10));
  for(let b=0;b<3;b++){ctx.globalAlpha=Math.max(0,fade*(b?.32/b:.75));ctx.fillStyle=b?'#ffe58a':'#fffbe6';const r2=rr-b*10;if(r2<=0)continue;/* 光の輪は、ドットの点をならべる（だ円：見おろし） */
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=cx+Math.cos(a)*r2,y=cy+Math.sin(a)*r2*.62;ctx.fillRect(Math.round(x/P)*P,Math.round(y/P)*P,P*(b?1:2),P)}}
  ctx.globalAlpha=1}

function juice2Frame(now){juiceHouseWatch(now)}
function juice2Draw(now){if(JGLOW.length)juiceGlowDraw(now);if(!JHS.length&&!JWAVE)return;juiceWaveDraw(now);juiceHouseDraw(now)}
function juice2Reset(){JHS.length=0;JHREF=null;JHSIG=null;JWAVE=null;JSTORE.n=0;if(typeof JGLOW!=='undefined')JGLOW.length=0}

/* ---------- 5. 宝の光（juiceGlowAt）：つりの当たり・宝の地図の宝。光の柱と、のぼる光の粒 ---------- */
const JGLOW=[];const JGLOWMS=1800;const JGLOWC=[['#fffbe6','#e8f4ff'],['#ffe58a','#fffbe6'],['#ffd060','#fff3b0']];/* tier 0・1・2 の色 */
function juiceGlowAt(x,y,tier,big){/* x,y：マス。tier：0〜2（よい物ほど金色）。big：大きなしぶき（つり） */if(!juice2OK()||JGLOW.length>6)return;const now=performance.now();JGLOW.push({x,y,t:tier|0,t0:now});const cx=x*TS,cy=y*TS;
  for(let k=0;k<(big?18:10);k++){const a=-Math.PI*(.1+.8*k/(big?17:9)),sp=60+Math.random()*80;fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-60,life:.8+Math.random()*.3,col:big&&k%2?'#cfeaff':JGLOWC[tier|0][k%2],r:3})}
  fx.push({k:'ring',x:cx,y:cy,life:1,col:'rgba(255,240,180,.95)'});for(let i=0;i<3+tier;i++)jKnock(659*Math.pow(2,[0,4,7,12,16][i]/12),i*.08,.5)}
function juiceGlowDraw(now){const P=2;for(let i=JGLOW.length-1;i>=0;i--){const g=JGLOW[i],e=now-g.t0;if(e>JGLOWMS){JGLOW.splice(i,1);continue}const u=e/JGLOWMS,a=u<.15?u/.15:1-(u-.15)/.85,cx=g.x*TS,cy=g.y*TS,C=JGLOWC[g.t],w=10+g.t*3,h=TS*(1.6+g.t*.5);
    for(let b=0;b<3;b++){ctx.globalAlpha=Math.max(0,a*(.45-b*.13));ctx.fillStyle=b?C[0]:C[1];const ww=Math.round((w+b*8)/P)*P;ctx.fillRect(Math.round((cx-ww/2)/P)*P,Math.round((cy-h)/P)*P,ww,Math.round(h/P)*P)}/* 光の柱（3だんの四角） */
    ctx.fillStyle=C[1];for(let k=0;k<8;k++){const ph=(e/900+k/8)%1;ctx.globalAlpha=Math.max(0,a*(1-ph));ctx.fillRect(Math.round((cx+(hash(k*7+g.x)-.5)*w*2)/P)*P,Math.round((cy-ph*h)/P)*P,P,P)}}/* のぼる光の粒 */
  ctx.globalAlpha=1}
