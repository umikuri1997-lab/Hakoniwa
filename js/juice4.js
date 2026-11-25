/* 気持ちよさ・その4（juice4.js）。見た目と音だけで、数字・せいれいの行動の計算はかえない。
   セーブするのは、きょうの新記録の数（S.jrec）だけ。
   1. 朝、いっせいに育つ（juiceGrowSnap・juiceGrowWave）：朝6時に育った花・作物・木の実・木が、神殿から外へ、なみのように順にぽんとはねる
   2. つりのヒット（juiceFish）：つれた魚が水から空中へとびだし、てっぺんで一瞬とまって（ヒットストップ）、せいれいの頭の上へ、ぽん
   3. かこいがとじた（juiceFenceNote）：柵・塀・そのドアで、空いた所をかこみおえたしゅんかん、かこいにそって光が1周はしる
   4. 直した（juiceMend）：朽ちた壁を直したら、ひびのかけらが落ちて、壁に光がはしる
   5. クモの巣をはらった（juiceWeb）：糸がふわっとちって、住み心地+5の数がはねる
   6. ★がふえた（juiceStarTick）：家の住み心地の★・村のすてき度の★がふえたしゅんかん、その上に★がぽんと出る
   7. きょうの新記録（juiceRec）：収穫・追いはらった数・あつめた素材・つった魚の、1日（朝6時から）の数が、いままでのいちばんをこえたしゅんかんに「さいこう」のハンコ
   どれも実時間でうごく。うごきをへらす設定（uiReduced）では、ゆらしたり、はねたりしない */
const J4GROWMS=2400;/* 育つなみが、いちばん遠い所までとどく時間（ミリ秒） */
const J4GROWR=40;/* 育つなみの、いちばん大きい半径（マス） */
const J4GROWMAX=160;/* 1回の朝に、はねさせる物の数 */
const J4FISHUP=420,J4FISHSTOP=90,J4FISHDOWN=360;/* 魚がとびあがる・とまる・頭の上へおちる時間（ミリ秒） */
const J4FENCEMAX=400;/* かこいとみる、いちばん広い所（マス） */
const J4FENCEMS=1200;/* かこいを光が1周する時間（ミリ秒） */
const J4MENDMS=520;/* 壁を光がはしる時間（ミリ秒） */
const J4STARMS=1500;/* ★が出てから消えるまで（ミリ秒） */
const J4RECMIN={hv:6,kill:3,mat:10,fish:2};/* いままでのいちばんが、この数より少ないうちは、新記録を出さない（はじめのころに毎日出ないように） */
const J4RECN={hv:'しゅうかく',kill:'追いはらった数',mat:'あつめた素材',fish:'つった魚'};
const J4WALL=new Set(['wall','sdoor','hedge']);/* 柵（FENCE_IDS）のほかに、かこいになる塀 */
const J4GROW=[],J4FISH=[],J4FENCE=[],J4MEND=[],J4THREAD=[],J4STAR=[];let J4FQ=[],J4SNAP=null,J4ST=null;
function j4OK(){return typeof juiceOK==='function'&&juiceOK()&&(typeof stageReady!=='function'||stageReady())}
function j4Lift(x,y){return typeof hiAt==='function'?liftOf((y|0)*W+(x|0)):0}
function j4Dot(c,pat,cx,cy,P,col,hi){/* ドットの絵（文字の行のならび）を、まん中 cx,cy に描く */const h=pat.length,w=pat[0].length,x0=Math.round(cx-w*P/2),y0=Math.round(cy-h*P/2);c.fillStyle=col;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pat[y][x]==='#')c.fillRect(x0+x*P,y0+y*P,P,P);if(hi){c.fillStyle=hi;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pat[y][x]==='o')c.fillRect(x0+x*P,y0+y*P,P,P)}}

/* ---------- 1. 朝、いっせいに育つ ---------- */
function j4CropSt(d){const g=d&&d.g||0;return g>=100?3:g>=60?2:g>0?1:0}/* 作物の絵の3だん（draw-objects.js と同じ） */
function juiceGrowSnap(){/* morning のはじめ：育つ前のようす */J4SNAP=null;if(!S||!j4OK())return;const sn={dyn:{},bud:[]};
  for(const k in S.dyn){const o=S.obj[k],d=S.dyn[k];if(!d)continue;if(o==='farm')sn.dyn[k]=j4CropSt(d);else if(o==='berry'||o==='fruit')sn.dyn[k]=d.g>=100?1:0}
  if(S.bud)for(const j in S.bud)if(S.bud[j]<=callDay())sn.bud.push(+j);/* この朝で、芽から花・木になる */
  J4SNAP={s:S,sn}}
function juiceGrowWave(){/* morning のおわり：育った物を、神殿から近い順にはねさせる */const P=J4SNAP;J4SNAP=null;if(!P||P.s!==S||!j4OK())return;const got=[];
  for(const k in P.sn.dyn){const o=S.obj[k],d=S.dyn[k];if(!d)continue;const v=o==='farm'?j4CropSt(d):(o==='berry'||o==='fruit')?(d.g>=100?1:0):-1;if(v>P.sn.dyn[k])got.push(+k)}
  for(const j of P.sn.bud)if(S.obj[j]&&!isBud(j))got.push(j);if(!got.length)return;
  const c=typeof evTemple==='function'?evTemple():[CX+.5,CY+.5],now=performance.now(),L=got.map(j=>({j,d:Math.hypot(j%W+.5-c[0],((j/W)|0)+.5-c[1])})).sort((a,b)=>a.d-b.d).slice(0,J4GROWMAX);
  L.forEach(q=>J4GROW.push({j:q.j,t:now+300+Math.min(1,q.d/J4GROWR)*J4GROWMS}))}
function juiceGrowStep(now){for(let i=J4GROW.length-1;i>=0;i--){const g=J4GROW[i];if(now<g.t)continue;J4GROW.splice(i,1);if(!S.obj[g.j])continue;const x=(g.j%W+.5)*TS,y=(((g.j/W)|0)+.6)*TS-j4Lift(g.j%W,(g.j/W)|0);
    if(!uiReduced())LANDFX.set(g.j,now);/* 上から少し落ちて、つぶれて、もどる（置いたときと同じ動き） */
    for(let k=0;k<4;k++){const a=-Math.PI*(.2+.6*k/3),sp=40+Math.random()*30;fx.push({k:'p',x,y:y-8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-40,life:.6+Math.random()*.2,col:['#8fd06a','#ffe58a','#d8f5c0','#fffbe6'][k],r:2})}}}/* 音は鳴らさない（持ち主がきめた） */

/* ---------- 2. つりのヒット ---------- */
function juiceFish(r,fk,w){if(!j4OK()||!r||J4FISH.length>3)return;const ic=typeof emoImg==='function'&&typeof foodEmo==='function'?emoImg(foodEmo(fk)):null;if(!ic)return;
  const sx=w>=0?w%W+.5:r.x+(r.face<0?-.8:.8),sy=w>=0?((w/W)|0)+.6:r.y;J4FISH.push({r,ic,sx,sy,t0:performance.now(),stop:0});
  for(let k=0;k<10;k++){const a=-Math.PI*(.15+.7*k/9),sp=60+Math.random()*70;fx.push({k:'p',x:sx*TS,y:sy*TS,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-70,life:.7+Math.random()*.3,col:k%2?'#cfeaff':'#fffbe6',r:3})}}/* 水しぶき */
function juiceFishDraw(now){const c=ctx,sm=c.imageSmoothingEnabled;for(let i=J4FISH.length-1;i>=0;i--){const f=J4FISH[i],e=now-f.t0,T=J4FISHUP+J4FISHSTOP+J4FISHDOWN;if(e>T+120||f.r.hidden){J4FISH.splice(i,1);continue}
    isoAt(c,f.r.x*TS,f.r.y*TS);const ex=f.r.x,ey=f.r.y-1.5,ax=(f.sx+ex)/2,ay=Math.min(f.sy,ey)-.5;let x,y,s=1,rot=0;
    if(e<J4FISHUP){const u=e/J4FISHUP,q=1-(1-u)*(1-u);x=f.sx+(ax-f.sx)*u;y=f.sy+(ay-f.sy)*q;rot=(1-u)*-.5}/* 水からとびだす */
    else if(e<J4FISHUP+J4FISHSTOP){x=ax;y=ay;s=1.25;if(!f.stop){f.stop=1;j3U('tstone',0,0);j3Ding(7,0,.3);j3Ding(12,.05,.3);if(typeof juiceStop==='function')juiceStop(f.r,fx.length)}x+=uiReduced()?0:(Math.floor(e/30)%2?.04:-.04)}/* てっぺんで一瞬とまって、ふるえる */
    else{const u=Math.min(1,(e-J4FISHUP-J4FISHSTOP)/J4FISHDOWN),q=u*u;x=ax+(ex-ax)*u;y=ay+(ey-ay)*q;rot=u*.4;if(u>=1&&!f.pop){f.pop=1;j3U('twood',.3,12);fx.push({k:'ring',x:ex*TS,y:ey*TS,life:1,col:'rgba(255,240,180,.9)'})}}/* 頭の上へ、ぽん */
    if(e>T)continue;const k=26*s/Math.max(f.ic.width,f.ic.height),iw=f.ic.width*k,ih=f.ic.height*k,px=x*TS,py=y*TS-j4Lift(f.sx,f.sy);
    c.save();c.translate(Math.round(px),Math.round(py));c.rotate(rot);c.drawImage(f.ic,-iw/2,-ih/2,iw,ih);c.restore()}c.imageSmoothingEnabled=sm}

/* ---------- 3. かこいがとじた ---------- */
function j4Fen(j){const o=S.obj[j];return!!o&&(FENCE_IDS.has(o)||J4WALL.has(o))}
function juiceFenceNote(j){/* burst から：柵・塀を置いた・建てたマス（つぎのコマで、しらべる） */if(J4FQ.length<40)J4FQ.push(j)}
function j4Flood(s,gap){/* s から、柵・塀でない所をたどる。gap のマスは通れる物とする。かこまれていれば、そのマスの一覧、外へ出たら null */
  const seen=new Set([s]),Q=[s];for(let i=0;i<Q.length;i++){const c=Q[i],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)return null;const n=ny*W+nx;if(seen.has(n))continue;if(n!==gap&&j4Fen(n))continue;seen.add(n);Q.push(n);if(Q.length>J4FENCEMAX)return null}}return Q}
function juiceFenceCheck(now){if(!J4FQ.length)return;const L=J4FQ;J4FQ=[];if(!j4OK())return;const done=new Set();
  for(const j of L){if(!j4Fen(j))continue;const x=j%W,y=(j/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const s=ny*W+nx;if(done.has(s)||j4Fen(s))continue;const R=j4Flood(s,-1);if(!R)continue;for(const q of R)done.add(q);
      if(j4Flood(s,j))continue;/* このマスがなくても、もうかこまれていた */juiceFence(R,now)}}}
function juiceFence(R,now){if(J4FENCE.length>3)return;const inn=new Set(R),edge=new Set();let sx=0,sy=0;
  for(const c of R){const x=c%W,y=(c/W)|0;sx+=x+.5;sy+=y+.5;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(!inn.has(k)&&j4Fen(k))edge.add(k)}}
  const cx=sx/R.length,cy=sy/R.length,cells=[...edge].map(j=>{const x=j%W+.5,y=((j/W)|0)+.5;return{x,y,a:(Math.atan2(y-cy,x-cx)+Math.PI*2.5)%(Math.PI*2)}});
  J4FENCE.push({cells,t0:now});for(let i=0;i<6;i++)j3Ding([0,4,7,12,16,19][i],i*J4FENCEMS/6000,.3);/* 光がまわるあいだ、鈴の音が上がっていく */
  if(typeof JOYU!=='undefined')for(const r of S.res){if(r.hidden||r.nap||r.act&&r.act.type==='sleep')continue;if(!inn.has((r.y|0)*W+(r.x|0))&&Math.hypot(r.x-cx,r.y-cy)>8)continue;JOYU.set(r,now+J4FENCEMS+1200);if(typeof JUMP!=='undefined')JUMP.set(r,now+J4FENCEMS)}}
function juiceFenceDraw(now){const P=2,h=TS/2;for(let i=J4FENCE.length-1;i>=0;i--){const F=J4FENCE[i],e=now-F.t0;if(e>J4FENCEMS+800){J4FENCE.splice(i,1);continue}const a0=Math.min(1,e/J4FENCEMS)*Math.PI*2,fade=e>J4FENCEMS?1-(e-J4FENCEMS)/800:1;
    for(const c of F.cells){const d=a0-c.a;if(d<0)continue;const hot=Math.max(0,1-d/.8),x=c.x*TS,y=c.y*TS;isoGroundLv(ctx,isoLv((c.y|0)*W+(c.x|0)));/* クォータービュー：そのマスの地面に */
      ctx.globalAlpha=Math.max(0,(.12+.35*hot)*fade);ctx.fillStyle=hot>.5?'#fffbe6':'#ffe58a';ctx.fillRect(x-h+P,y-h+P,TS-2*P,TS-2*P);
      if(hot>.3){ctx.globalAlpha=Math.min(1,hot)*fade;ctx.fillStyle='#fffbe6';ctx.fillRect(x-P,y-h-2*P,2*P,2*P);ctx.fillRect(x-h,y-P,P,2*P);ctx.fillRect(x+h-P,y-P,P,2*P)}}}/* いまの所は、白い光のつぶ */
  ctx.globalAlpha=1}

/* ---------- 4. 直した（朽ちた壁） ---------- */
function juiceMend(j,r){if(!j4OK()||J4MEND.length>4)return;const x=j%W,y=(j/W)|0,lift=j4Lift(x,y),now=performance.now();J4MEND.push({x,y,lift,t0:now});
  for(let k=0;k<8;k++){const px=(x+.15+Math.random()*.7)*TS,py=(y+.2+Math.random()*.6)*TS-lift;fx.push({k:'p',x:px,y:py,vx:(Math.random()-.5)*30,vy:-20-Math.random()*30,life:.7+Math.random()*.3,col:['#8a6a4a','#b08a62','#6e5440'][k%3],r:2})}/* ひびのかけらが、ぱらぱら落ちる */
  j3U('twood',.3,0);j3Ding(12,J4MENDMS/1000,.3);j3Ding(19,J4MENDMS/1000+.06,.3);
  if(r&&typeof JOYU!=='undefined'&&!r.hidden){JOYU.set(r,now+J4MENDMS+900);if(typeof JUMP!=='undefined')JUMP.set(r,now+J4MENDMS)}}
function juiceMendDraw(now){const P=2;for(let i=J4MEND.length-1;i>=0;i--){const m=J4MEND[i],e=now-m.t0;if(e>J4MENDMS+400){J4MEND.splice(i,1);continue}
    const x0=m.x*TS,y0=m.y*TS,hh=TS;isoGroundLv(ctx,isoLv((m.y|0)*W+(m.x|0)));/* 壁の上の面から、巾木まで（クォータービューは、そのマスの地面に） */
    if(e<J4MENDMS){const u=e/J4MENDMS,bx=Math.round((x0-4+u*(TS+8))/P)*P;ctx.globalAlpha=.85;ctx.fillStyle='#fffbe6';ctx.fillRect(bx,y0,2*P,hh);ctx.globalAlpha=.4;ctx.fillStyle='#ffe58a';ctx.fillRect(bx-2*P,y0,2*P,hh)}/* 左から右へ、光の帯がはしる */
    else{ctx.globalAlpha=.35*(1-(e-J4MENDMS)/400);ctx.fillStyle='#fffbe6';ctx.fillRect(x0,y0,TS,hh)}}/* はしりおわると、壁ぜんたいが、ふわっと光ってきえる */
  ctx.globalAlpha=1}

/* ---------- 5. クモの巣をはらった ---------- */
function juiceWeb(j,side){if(!j4OK())return;const x=j%W,y=(j/W)|0,lift=j4Lift(x,y),cx=(x+(side?.8:.2))*TS,cy=(y+.15)*TS-lift,now=performance.now();
  for(let k=0;k<10&&J4THREAD.length<40;k++)J4THREAD.push({x:cx+(Math.random()-.5)*10,y:cy+(Math.random()-.5)*6,vx:(Math.random()-.5)*14,vy:-6-Math.random()*8,ph:Math.random()*6,t0:now,len:1400+Math.random()*600,w:k%3?1:2});/* 糸のきれはし：ふわふわ、ゆっくり落ちる */
  addFloatG(x+.5,y+.5,-1.5,'住み心地+5','#ffe58a');j3U('tcloth',.25,5);j3Ding(16,.15,.25);J4ST&&(J4ST.force=1)}
function juiceThreadDraw(now,dt){const P=2;ctx.fillStyle='#fdfbf4';for(let i=J4THREAD.length-1;i>=0;i--){const t=J4THREAD[i],e=now-t.t0;if(e>t.len){J4THREAD.splice(i,1);continue}
    isoAtA(ctx,fxFoot(t));t.vy=Math.min(t.vy+20*dt,14);t.x+=(t.vx+Math.sin(now/260+t.ph)*10)*dt;t.y+=t.vy*dt;ctx.globalAlpha=.85*(1-e/t.len);ctx.fillRect(Math.round(t.x/P)*P,Math.round(t.y/P)*P,P*t.w,P)}ctx.globalAlpha=1}

/* ---------- 6. ★がふえた ---------- */
const J4STARP=['....o....','...o#o...','...###...','#########','.#######.','..#####..','..##.##..','.##...##.','.#.....#.'];
function j4HouseSig(h){let m=1e9;for(const j of h.set)if(j<m)m=j;return m+':'+h.set.size}
function j4Stars(v){return Math.min(5,Math.max(1,Math.ceil(v/60)))}/* comfyStars と同じ数 */
function juiceStarTick(now){if(!S||typeof HOUSES==='undefined')return;if(!J4ST||J4ST.s!==S)J4ST={s:S,ref:null,sk:null,h:null,su:null,force:0};const K=J4ST;
  if(K.ref===HOUSES&&K.sk===SUTEKI&&SUTEKI&&!K.force)return;K.force=0;K.ref=HOUSES;const su=suteki();K.sk=SUTEKI;const ok=j4OK(),hm=new Map();
  for(const h of HOUSES){const k=j4HouseSig(h),st=j4Stars(houseComfort(h).v);hm.set(k,st);if(ok&&K.h&&K.h.has(k)&&st>K.h.get(k))juiceStar((h.x0+h.x1+1)/2,h.y0-.4,st,0)}
  if(ok&&K.su!=null&&su.st>K.su){const c=typeof evTemple==='function'?evTemple():[CX+.5,CY+.5];juiceStar(c[0],c[1]-2.2,su.st,1);toast('村のすてき度が★'+su.st+'になった','good')}
  K.h=hm;K.su=su.st}
function juiceStar(x,y,st,big){if(J4STAR.length>5)return;J4STAR.push({x,y,st,big,t0:performance.now()});addFloatG(x,y,-.6,(big?'すてき度':'住み心地')+'★'+st,'#ffe58a');
  for(let i=0;i<3;i++)j3Ding([7,12,16][i]+(big?2:0),i*.07,.32);for(let k=0;k<10;k++){const a=Math.PI*2*k/10,sp=50+Math.random()*30;fx.push({k:'p',x:x*TS,y:y*TS,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-30,life:.7,col:k%2?'#ffe58a':'#fffbe6',r:2})}}
function juiceStarDraw(now){for(let i=J4STAR.length-1;i>=0;i--){const s=J4STAR[i],e=now-s.t0;if(e>J4STARMS){J4STAR.splice(i,1);continue}const u=e/J4STARMS,P=s.big?4:2,
    hop=uiReduced()?0:e<220?-Math.sin(e/220*Math.PI)*10:e<380?-Math.sin((e-220)/160*Math.PI)*3:0,rise=Math.min(e,600)/600*6;/* ぽんと出て、小さくもう1回はねる */
    isoAt(ctx,s.x*TS,(s.y+1)*TS);ctx.globalAlpha=u>.75?(1-u)/.25:1;j4Dot(ctx,J4STARP,s.x*TS,s.y*TS-j4Lift(s.x,s.y+1)+hop-rise,P,'#f0c040','#fffbe6');ctx.globalAlpha=1}}

/* ---------- 7. きょうの新記録 ---------- */
function juiceRec(k,n){/* k：hv（収穫）・kill（追いはらった）・mat（あつめた素材）・fish（つった魚）。n：ふえた数 */
  if(!S||!n)return;if(typeof MEMRUN!=='undefined'&&MEMRUN||typeof NOSAVE!=='undefined'&&NOSAVE)return;const d=callDay(),R=S.jrec||(S.jrec={d,c:{},b:{},s:{}});
  if(R.d!==d){for(const q in R.c)R.b[q]=Math.max(R.b[q]||0,R.c[q]);R.c={};R.s={};R.d=d}/* 日がかわったら、きのうの数をいちばんとくらべる */
  R.c[k]=(R.c[k]||0)+n;const b=R.b[k]||0;if(R.s[k]||b<J4RECMIN[k]||R.c[k]<=b)return;R.s[k]=1;
  if(!j4OK())return;
  toast('きょうの'+J4RECN[k]+'が、いままででいちばん（'+R.c[k]+'）','good','さいこう');}

/* juice3 から */
let J4T=0;
function juice4Frame(now){juiceGrowStep(now);juiceFenceCheck(now);if(now-J4T>250){J4T=now;juiceStarTick(now)}}
const FISHJUMP=.85;/* つりの、かかげる時間（a.sh）のうち、魚が水からとびだして手にとどくまで */
function fishTagDraw(){/* つった魚をかかげているあいだ、頭の上に「〇〇がつれた！」の札（はじめての魚は「はじめて！」も） */for(const r of S.res){const a=r.act;if(!a||a.type!=='fish'||a.sh==null||!a.fk||r.hidden||!FOODS[a.fk])continue;const al=(a.sh-FISHJUMP)/.2;if(al<0)continue;
  const L=a.first?['はじめて！',FOODS[a.fk].name+'がつれた！']:[FOODS[a.fk].name+'がつれた！'];isoUIAt(ctx,r.x*TS,r.y*TS,r.x*TS,(r.y-2.05)*TS);evTag(ctx,r.x*TS,(r.y-2.05)*TS,L,Math.min(1,al))}}
function juice4Draw(now){if(S&&typeof evTag==='function')fishTagDraw();const dt=J4LD?Math.min(.1,(now-J4LD)/1000):0;J4LD=now;if(J4FENCE.length)juiceFenceDraw(now);if(J4MEND.length)juiceMendDraw(now);if(J4THREAD.length)juiceThreadDraw(now,dt);if(J4STAR.length)juiceStarDraw(now);if(J4FISH.length)juiceFishDraw(now);isoBack(ctx)}/* クォータービュー：それぞれの所に立てたあと、もとの描き方に（iso-fx.js） */
let J4LD=0;
function juice4Reset(){J4GROW.length=0;J4FISH.length=0;J4FENCE.length=0;J4MEND.length=0;J4THREAD.length=0;J4STAR.length=0;J4FQ=[];J4SNAP=null;J4ST=null}
