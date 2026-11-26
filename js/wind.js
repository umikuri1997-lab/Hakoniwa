'use strict';
/* ---------- 風のしくみ（風のやんだ空の村）----------
   風穴（kazaana。はじめは石でふさがった kazaanab）から、きまった向きへ風がまっすぐふく（風の道）。1つの風穴の風は、曲げた分もあわせて WINDMAX マスまで。
   風の道に「かざみ」（kazami）を置くと、そこで向きがかわる。家の壁・木・岩・建物に当たると止まる。段差はこえる。
   風が雲の海をこえて、向こうの陸にとどいた所だけ、歩ける雲の橋になる（風の向きをかえると消える）。
   風の道が雲にしずんだ島にふれると、島がうかぶ（S.wind.up。いちどうかんだら、しずまない）。しずんだ島は、霧と同じく歩けない・置けない（fogAt）。
   橋が消えて、まん中の島へもどれなくなったせいれいは、風にのって、まん中の島へはこばれる。
   風の道の上を、風と同じ向きに歩くと、移動速度 WINDTAIL 倍。
   セーブに入るのは S.wind（風穴のマスと向き・うかんだ島）だけ。風の道・雲の橋・島の番号は、地形と置いた物から作る（windSync。recount のたび）。
   絵は、どれもコードの仮のドット絵。 */
const WINDMAX=40,WINDTAIL=1.5,WDIR=[[0,1],[1,0],[0,-1],[-1,0]];/* 向き：0 手前（南）・1 右（東）・2 奥（北）・3 左（西）。置く家具の向き（rotAt）と同じ */
const RIDES=new Set(['merry','cup','skyswing','wheel']),RIDEB={merryb:'merry',cupb:'cup',skyswingb:'skyswing',wheelb:'wheel'};/* 遊園地の遊具と、こわれた遊具→直した遊具 */
const WINDIDS=new Set(['kazaana','kazaanab','kazami','oldmill',...RIDES,...Object.keys(RIDEB)]),WINDHOLET=60/* 風穴をひらく時間 */,WINDRISE=2600/* 島の雲がわれる時間（ミリ秒） */;
const windOn=()=>!!S&&WD===WIND&&!!S.wind;
/* 島の番号（1〜）。雲の海は0。島の中の池は、その島。地形はかわらないので、ステートごとに1回だけ作る */
const WISLE=new WeakMap();
function windIsles(s){let I=WISLE.get(s);if(I)return I;const M=skyOf(s.ground),id=new Int16Array(W*H),size=[0],cx=[0],cy=[0];
  for(let j=0;j<W*H;j++){if(id[j]||M[j])continue;const k=size.length,q=[j];id[j]=k;let n=0,sx=0,sy=0;while(q.length){const c=q.pop(),x=c%W,y=(c/W)|0;n++;sx+=x;sy+=y;for(const m of[x>0?c-1:-1,x<W-1?c+1:-1,c-W,c+W]){if(m<0||m>=W*H||id[m]||M[m])continue;id[m]=k;q.push(m)}}size.push(n);cx.push(sx/n);cy.push(sy/n)}
  I={id,size,cx,cy,mid:id[CY*W+CX],n:size.length-1};WISLE.set(s,I);return I}
/* あたらしい風の村：風穴（まん中の島と、大きな島に1つずつ。どれも石でふさがっている）と、まん中の風穴のそばの古い風車 */
function windGen(s,R){const I=windIsles(s),holes=[],land=j=>j>=0&&j<W*H&&I.id[j]>0&&s.ground[j]===0,free=j=>land(j)&&!s.floor[j]&&(!s.obj[j]||BL[s.obj[j]]&&BL[s.obj[j]].natural);
  const put=(k,tx,ty,d)=>{let best=-1,bd=1e9;for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const j=y*W+x;if(I.id[j]!==k||!free(j))continue;let ok=true;for(let b=-2;b<=2&&ok;b++)for(let a=-2;a<=2;a++)if(!land(j+b*W+a)||s.floor[j+b*W+a]||s.obj[j+b*W+a]&&!BL[s.obj[j+b*W+a]].natural){ok=false;break}if(!ok)continue;const dd=Math.hypot(x-tx,y-ty);if(dd<bd){bd=dd;best=j}}
    if(best<0)return -1;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const q=best+b*W+a;s.obj[q]='';delete s.dyn[q];delete s.hp[q]}s.obj[best]='kazaanab';holes.push({j:best,d});return best};
  const h0=put(I.mid,CX+11,CY+2,1);if(h0>=0){const m=h0-W+2;if(land(m)&&!s.floor[m]){s.obj[m]='oldmill';delete s.dyn[m];delete s.hp[m]}}/* まん中の風穴は、東へふく。そのすぐ北東に古い風車 */
  for(let k=1;k<=I.n;k++)if(k!==I.mid&&I.size[k]>=150)put(k,I.cx[k],I.cy[k],(R()*4)|0);
  /* こわれた遊具：メリーゴーラウンドはまん中の島、ほかは大きな島に1つずつ（観覧車は、いちばん大きな島） */
  const ride=(k,id,tx,ty)=>{const z=BL[id].sz;let best=-1,bd=1e9;for(let y=3;y<H-4;y++)for(let x=3;x<W-4;x++){let ok=true;for(let b=-1;b<=z[1]&&ok;b++)for(let a=-1;a<=z[0];a++){const q=(y+b)*W+x+a;if(I.id[q]!==k||!land(q)||s.floor[q]||s.obj[q]&&!BL[s.obj[q]].natural){ok=false;break}}if(!ok)continue;const dd=Math.hypot(x+z[0]/2-tx,y+z[1]/2-ty);if(dd<bd){bd=dd;best=y*W+x}}
    if(best<0)return;for(let b=-1;b<=z[1];b++)for(let a=-1;a<=z[0];a++){const q=best+b*W+a;s.obj[q]='';delete s.dyn[q];delete s.hp[q]}for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++){const q=best+b*W+a;if(a||b){s.obj[q]='part';s.ref[q]=best}}s.obj[best]=id};
  ride(I.mid,'merryb',CX+9,CY+9);const big=[];for(let k=1;k<=I.n;k++)if(k!==I.mid&&I.size[k]>=150)big.push(k);big.sort((a,b)=>I.size[b]-I.size[a]);
  if(big[0])ride(big[0],'wheelb',I.cx[big[0]]+4,I.cy[big[0]]+3);if(big[1])ride(big[1],'cupb',I.cx[big[1]]+4,I.cy[big[1]]+3);if(big[2])ride(big[2],'skyswingb',I.cx[big[2]]+4,I.cy[big[2]]+3);
  s.wind={holes,up:{[I.mid]:1}};s.fog=[]}/* s.fog：しずんだ島を、霧と同じ「歩けない・置けない」にするための印（fogAt が windSunk を見る） */
const windSunk=j=>{if(!windOn())return false;const k=windIsles(S).id[j];return k>0&&!S.wind.up[k]};
const windHoleAt=j=>windOn()?S.wind.holes.find(h=>h.j===j):null;
const windOpenN=()=>windOn()?S.wind.holes.filter(h=>S.obj[h.j]==='kazaana').length:0;
const windUpN=()=>windOn()?Object.keys(S.wind.up).length-1:0,windIsleN=()=>windOn()?windIsles(S).n-1:0;/* うかんだ島の数・うかせる島の数（まん中の島はのぞく） */
function windBlock(j){const o=typeAt(j);if(!o||o==='kazami')return false;const b=BL[o];if(!b)return false;return !!(b.natural&&b.solid||b.kind==='build'||HOME_WALLS.has(o)||HOME_DOORS.has(o)||o==='site'||o==='site2'||WINDIDS.has(o)||o==='statue'||o==='statueb'||o==='obox'||o==='board'||o==='altar')}/* 風を止める物：木・岩・茂み・建物・家の壁とドア・神殿・風穴 */
/* 風の道を作る：dir（マス→向き。なければ −1）・br（雲の橋）・うかせる島・つながった島 */
let WN=null,WNS=null;const WRISEQ=[],WRISE=new WeakMap();/* WRISE：島→雲がわれはじめた時刻（Infinity：演出まち） */
function windSync(){if(!windOn()){WN=null;WNS=null;return}if(!Array.isArray(S.fog))S.fog=[];
  const M=skyM(),I=windIsles(S),dir=new Int8Array(W*H).fill(-1),br=new Uint8Array(W*H),P=[];for(let k=0;k<=I.n;k++)P.push(k);const find=k=>P[k]===k?k:P[k]=find(P[k]);let rose=false;
  for(const h of S.wind.holes){if(S.obj[h.j]!=='kazaana')continue;let x=h.j%W,y=(h.j/W)|0,d=h.d&3,n=0,seg=[],from=I.id[h.j];const seen=new Set();
    while(n<WINDMAX){x+=WDIR[d][0];y+=WDIR[d][1];if(x<1||y<1||x>=W-1||y>=H-1)break;const j=y*W+x,key=j*4+d;if(seen.has(key))break;seen.add(key);
      if(M[j]){seg.push(j);dir[j]=d;n++;continue}
      if(windBlock(j))break;
      const k=I.id[j];if(seg.length){for(const q of seg)br[q]=1;P[find(from)]=find(k);seg=[]}from=k;dir[j]=d;n++;
      if(!S.wind.up[k]){S.wind.up[k]=1;rose=true;WRISE.set(S.wind,(WRISE.get(S.wind)||new Map()).set(k,Infinity));WRISEQ.push({state:S,k})}
      if(S.obj[j]==='kazami')d=rotAt(j)&3}}
  const reach=new Uint8Array(I.n+1),m=find(I.mid);for(let k=1;k<=I.n;k++)if(find(k)===m)reach[k]=1;
  WN={dir,br,reach,v:(WN&&WNS===S?WN.v:0)+1};WNS=S;
  if(rose){if(typeof waterDirty==='function')waterDirty(null);dirty=true}}
const windBr=j=>WD===WIND&&!!WN&&WNS===S&&WN.br[j]===1;
const windDirAt=j=>WD===WIND&&WN&&WNS===S?WN.dir[j]:-1;
function windNear(j,r){if(WD!==WIND||!WN||WNS!==S)return false;const x0=j%W,y0=(j/W)|0;for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++)if(x>=0&&y>=0&&x<W&&y<H&&WN.dir[y*W+x]>=0)return true;return false}
function windTail(r){/* 追い風：風の道の上を、風と同じ向きに歩いている */if(WD!==WIND||!WN||WNS!==S||!r.path||!r.path.length)return 1;const j=(r.y|0)*W+(r.x|0),d=WN.dir[j];if(d<0)return 1;const n=r.path[0],dx=Math.sign(n%W-(j%W)),dy=Math.sign(((n/W)|0)-((j/W)|0));return dx===WDIR[d][0]&&dy===WDIR[d][1]?WINDTAIL:1}
/* 風穴を「しらべる」でタップ：せいれいが石をどけにくる（建てる所のしくみ） */
function windHoleTap(j){if(!windOn()||S.obj[j]!=='kazaanab')return false;S.obj[j]='site';S.dyn[j]={build:'kazaana',p:0,need:WINDHOLET,hole:1};sfx('tstone');toast('せいれいが石をどけにきてくれる');recount();dirty=true;renderQuest();return true}
/* とりのこされたせいれい：橋が消えて、まん中の島へもどれなくなったら、風にのって、まん中の島へ */
let WCARV=-1,WCARS=null;
function windCarry(){if(!WN||WNS!==S||WCARS===S&&WCARV===WN.v)return;WCARS=S;WCARV=WN.v;const M=skyM(),I=windIsles(S);let home=null;
  for(const r of S.res){if(r.hidden||r.coffin)continue;const j=(r.y|0)*W+(r.x|0),k=I.id[j];if(M[j]?WN.br[j]===1:WN.reach[k]===1)continue;
    if(!home){const h=S.wind.holes.find(q=>I.id[q.j]===I.mid),c=STATUE>=0?STATUE+2*W:h?h.j:CY*W+CX,cx=c%W,cy=(c/W)|0;home=[];for(let rr=1;rr<7&&home.length<12;rr++)for(let b=-rr;b<=rr;b++)for(let a=-rr;a<=rr;a++){const q=(cy+b)*W+cx+a;if(Math.max(Math.abs(a),Math.abs(b))===rr&&I.id[q]===I.mid&&walk(q)&&!S.obj[q])home.push(q)}}
    const q=home.length?home[(Math.random()*home.length)|0]:CY*W+CX;spawnFX(r.x-.5,r.y-.6,'#e6f4fa');if(typeof endAct==='function')endAct(r);r.path=[];r.x=q%W+.5;r.y=((q/W)|0)+.5;spawnFX(r.x-.5,r.y-.6,'#e6f4fa');sfxAt('leaf',r.x,r.y);toast(r.name+'が、風にのって帰ってきた')}}
/* 島がうかぶ演出：村の時間を止め、カメラが島へ行ってから雲がわれ、大きな知らせを出し、もとの所へもどる（霧が晴れる演出と同じ作り） */
let WRISEON=false,WRISECAM=null;
function windRiseTick(){while(WRISEQ.length&&WRISEQ[0].state!==S)WRISEQ.shift();if(!WRISEQ.length||GIFT_ACTIVE||camAnim||!stageReady()||!$('#dialog').hidden)return;
  const it=WRISEQ.shift(),k=it.k,I=windIsles(S),T=WRISE.get(S.wind)||new Map(),owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION;GIFT_ACTIVE=true;WRISEON=true;
  const back={z:cam.z,x:cam.x+VW/cam.z/2,y:cam.y+VH/cam.z/2},tz=Math.min(cam.z,1.2),tx=(I.cx[k]+.5)*TS,ty=(I.cy[k]+.5)*TS;
  const finish=()=>{if(!WRISEON)return;WRISEON=false;GIFT_ACTIVE=false;if(T.get(k)===Infinity)T.set(k,performance.now())};
  musicDuck(2600);camAnim=WRISECAM={fz:cam.z,tz,fx:back.x,fy:back.y,tx,ty,t:0,dur:1.6,done:()=>{if(!ok())return finish();T.set(k,performance.now());sfx('level');dirty=true;
    later(()=>{if(!ok())return finish();const overlay=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="島がうかんだ"></div>'),card=el('<div class="idea-card"><h2>島がうかんだ！</h2><div class="spotpop"><p></p></div></div>');
      card.querySelector('p').textContent='風がとどいて、雲の下から島があらわれた';
      const button=el('<button class="btn pri" type="button">とじる</button>');button.disabled=true;card.append(button);overlay.append(card);document.body.append(overlay);sfx('good');setTimeout(()=>{if(overlay.isConnected)button.disabled=false},650);
      button.onclick=()=>{if(button.disabled)return;overlay.remove();if(!ok())return finish();memo('leaf','風がとどいて、島がうかんだ');const go=()=>{checkQuest();camAnim=WRISECAM={fz:cam.z,tz:back.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:back.x,ty:back.y,t:0,dur:1.2,done:finish}};if(!windHayateWake(k,go))go()}},WINDRISE+200)}}}
function windRiseReset(){WRISEQ.length=0;if(WRISEON){if(WRISECAM&&camAnim===WRISECAM)camAnim=null;WRISECAM=null;WRISEON=false;GIFT_ACTIVE=false;document.querySelectorAll('.idea-reveal[aria-label="島がうかんだ"]').forEach(e=>e.remove())}}/* 村を切りかえたとき */
const KUMODAY=6,KUMOMAX=20,HANEDAY=3,HANEMAX=10;/* 雲わた：毎朝、雲の海のふちに6こ（地面に20こまで）。風の羽：毎朝、風の道の上に3まい（10まいまで） */
function windMatMorning(){if(!windOn())return;if(!WN||WNS!==S)windSync();if(!S.drops)S.drops=[];const M=skyM(),I=windIsles(S),r0=S.res.find(q=>!q.hidden),G=r0?bfs(r0.x|0,r0.y|0):null,has=new Set(S.drops.map(d=>d.y*W+d.x)),cnt=id=>S.drops.filter(d=>d.id===id).length;
  const ok=j=>j>=0&&j<W*H&&S.ground[j]===0&&!S.obj[j]&&!S.floor[j]&&walk(j)&&!has.has(j)&&!fogAt(j)&&(!G||G.dist[j]>=0)&&I.id[j]>0;
  const put=(L,id,n,max)=>{for(let k=cnt(id);n>0&&k<max&&L.length;){const i=(Math.random()*L.length)|0,j=L[i];L.splice(i,1);if(!ok(j))continue;S.drops.push({x:j%W,y:(j/W)|0,id,n:1});has.add(j);n--;k++}};
  const edge=[],path=[];for(let j=0;j<W*H;j++){if(!ok(j))continue;if([j-1,j+1,j-W,j+W].some(q=>q>=0&&q<W*H&&M[q]))edge.push(j);if(WN.dir[j]>=0)path.push(j)}
  put(edge,'mat:kumowata',KUMODAY,KUMOMAX);put(path,'mat:hane',HANEDAY,HANEMAX)}
function windTick(){if(!windOn())return;if(!WN||WNS!==S)windSync();windCarry();windRiseTick();if(typeof windStoryTick==='function')windStoryTick()}
/* ---------- 風の遊園地 ----------
   遊具（RIDES）は、風のせいれいが係（rideop）になって風を送っているあいだだけ動き、ほかのせいれいがのれる。係は、のったせいれいが遊びおわるたびに、たのしさ+RIDEOPFUN。風の道が2マス以内にとどいている遊具は、係がつかれない。
   わすれた楽しさ：この土地のせいれいは、遊び家具の遊び方をわすれている（r.rem にない遊び家具へは、自分から行かない）。動いている遊具にはのる。遊具にはじめてのる・係をつとめると、遊び方を1つ思い出す。
   こわれた遊具（RIDEB）は「しらべる」でタップすると、せいれいが直す（建てる所のしくみ S.dyn[j].wfix）。直すと、その遊具のレシピをおぼえる。 */
const RIDEK=1.5/* 遊具の絵の大きさ（足もとのまん中から） */,RIDEFIXT=90,RIDEOPT=120,RIDEOPFUN=5,RIDETIRE=.08/* 係のつかれ（1秒あたり。風の道がとどいていれば0） */;
const rideOn=j=>!!S&&S.res.some(q=>!q.hidden&&q.act&&q.act.type==='rideop'&&q.act.obj===j&&q.act.stage==='do');
const rideOp=j=>S.res.find(q=>!q.hidden&&q.act&&q.act.type==='rideop'&&q.act.obj===j&&q.act.stage==='do');
const windFun=()=>WD===WIND&&!!S&&!S.free;
function windPlayOK(r,t,j){if(!windFun())return true;if(RIDES.has(t))return rideOn(j);return !!(r.rem&&r.rem[t])}
function windRideTap(j){j=anc(j);const o=S.obj[j],id=RIDEB[o];if(!windOn()||!id)return false;S.obj[j]='site';S.dyn[j]={build:id,p:0,need:RIDEFIXT,wfix:1};for(const k in S.ref)if(S.ref[k]===j)S.obj[k]='site2';sfx('twood');toast('せいれいが直しにきてくれる');recount();dirty=true;renderQuest();return true}
function windFixDone(j,d,r){const id=d.build;delete S.dyn[j];S.obj[j]=id;for(const k in S.ref)if(S.ref[k]===j)S.obj[k]='part';S.recipes=S.recipes||{};const isNew=!S.recipes[id];S.recipes[id]=true;S.unlocked[id]=true;recount();burst(j,'furn');sfx('level');if(r)addSpiritXp(4,r);toast(BL[id].name+'が直った！','good');memo('leaf',BL[id].name+'が直った');if(isNew)recipeNotice([id]);if(typeof juiceCheer==='function')juiceCheer('quest');checkQuest()}
function windOpGo(r,G){/* 風のせいれい：係のいない遊具があれば、係になりにいく */if(!windFun()||r.elem!=='wind'||isNight()||S.res.filter(q=>!q.hidden).length<2||r.energy<30)return false;if(r.name===HAYATE&&typeof qNow==='function'&&qNow('merryFix')&&S.res.some(q=>q.name===KAZANE&&!q.hidden))return false;/* はじめのメリーゴーラウンドは、カザネがまわす */
  let best=-1,bs=1e9,bj=-1;for(let j=0;j<W*H;j++){const o=S.obj[j];if(!RIDES.has(o)||!free('op'+j,1))continue;const z=BL[o].sz;for(let b=-1;b<=z[1];b++)for(let a=-1;a<=z[0];a++){if(a>=0&&a<z[0]&&b>=0&&b<z[1])continue;if((a<0||a>=z[0])&&(b<0||b>=z[1]))continue;const q=j+b*W+a,d=G.dist[q];if(d>=0&&d<bs&&walk(q)&&!S.obj[q]){bs=d;best=q;bj=j}}}
  if(best<0||bs>60)return false;startAct(r,G,'rideop',best,{key:'op'+bj,obj:bj,what:S.obj[bj]});return true}
ACT.rideop={start(r,a){if(!RIDES.has(S.obj[a.obj]))return false;r.bubble='';r.faceObj=a.obj;r.face=a.obj%W+1>=r.x?1:-1;sfxAt('leaf',r.x,r.y)},tick(r,a,dt){if(!windNear(a.obj,2))r.energy=Math.max(0,r.energy-RIDETIRE*dt)},done:(r,a)=>a.t>=RIDEOPT||r.energy<15||isNight()||!RIDES.has(S.obj[a.obj]),end(r,a){if(a.t>=20)windRemember(r,a.what)}};
for(const id of RIDES)TOYS.add(id);/* のっているせいれいを、遊具の上に描く（toyR・toyPose） */
if(typeof ACT_LBL!=='undefined')ACT_LBL.rideop='遊具を動かしている';if(typeof WORKFACE!=='undefined')WORKFACE.add('rideop');
function windPlayEnd(r,a){if(!windFun()||!RIDES.has(a.what))return;windRemember(r,a.what);const F=S.flags.rideRun||(S.flags.rideRun={});F[a.what]=(F[a.what]||0)+1;const op=rideOp(a.obj);if(op){funAdd(op,RIDEOPFUN,'play');op.bubble='🎵'}}
function windRemember(r,ride){/* はじめてその遊具にのった・係をした：遊び方を1つ思い出す */r.rode=r.rode||{};if(r.rode[ride])return;r.rode[ride]=1;r.rem=r.rem||{};const L=Object.keys(BL).filter(id=>BL[id].play&&!RIDES.has(id)&&!r.rem[id]&&!nigate(r.elem,id));if(!L.length)return;const here=L.filter(id=>cnt(id)>0),t=L.includes(r.like)?r.like:here.length?here[(Math.random()*here.length)|0]:L[(Math.random()*L.length)|0];r.rem[t]=1;toast(r.name+'が、'+BL[t].name+'の遊び方を思い出した','good');if(typeof spReact==='function')spReact(r,'joy',1400);windRemFx(r,t)}
/* 思い出した：頭の上に、その遊び家具の絵がふわっとうかんで光り、風のつぶがあつまる。その子の言いかたのひとこと（見た目と音だけ。実時間） */
const WREMLINE=['そうだ、こうやって遊んだんだ！','思い出した！ 体がおぼえてる。','あっ、この遊び、すきだったなあ。','風がふいたら、思い出したよ。','なつかしい……もう一回やりたい！','わすれてたのが、うそみたい！'],WREMIMG=new Map(),WREMMS=3200;
function windRemFx(r,t){if(!r||r.hidden||IS_STORY_REPLAY)return;let im=WREMIMG.get(t);if(!im){im=new Image();im.src=iconURL(t);WREMIMG.set(t,im)}
  const x=r.x*TS,y=r.y*TS-uLift(r)-58;scnAdd('windrem',WREMMS,{r,im});scnAdd('glow',WREMMS*.8,{x,y,r:22,col:'#e8f6ff'},150);scnAdd('ring',900,{x,y,r0:6,r1:30,col:'#dff4ff'},150);
  for(let i=0;i<6;i++){const a=i*1.047;scnAdd('orb',700,{x0:x+Math.cos(a)*34,y0:y+Math.sin(a)*20,x1:x,y1:y,arc:i%2?10:-10,col:i%2?'#dff4ff':'#fff6c8',n:1},i*80)}
  sfx('good');addFloatG(r.x,r.y,-1.7,chatTone(pickFresh('wrem',WREMLINE),r),'#e8f6ff')}
SCN_DRAW.windrem=(e,t,now)=>{/* 頭の上の遊び家具の絵（144のアイコンを30の大きさに。うかんでから、ゆっくりゆれる） */const r=e.r,im=e.im;if(!r||r.hidden||!im.complete||!im.naturalWidth)return;const env=scnEnv(t,.1,.18);if(env<=0)return;
  const s=30,rise=Math.min(1,t/.12),x=Math.round(r.x*TS-s/2),y=Math.round((r.y*TS-uLift(r)-44-rise*14-s/2+Math.sin(now/320)*2)/2)*2;ctx.save();ctx.globalAlpha=env;ctx.imageSmoothingEnabled=true;ctx.drawImage(im,x,y,s,s);ctx.restore()}
function windRemNote(r){if(!windFun())return '';const n=Object.keys(r.rem||{}).length;return '思い出した遊び：'+n}
/* ハヤテ：はじめにうかんだ島で目をさます（カザネのむかしからのなかま）。会話を読みおえてから、来たことにする */
function windHayateWake(k,after){if(S.flags.hayate||S.res.some(q=>q.name===HAYATE))return false;const I=windIsles(S),h=S.wind.holes.find(q=>I.id[q.j]===k);let c=-1,bd=1e9;for(let j=0;j<W*H;j++){if(I.id[j]!==k||!walk(j)||S.obj[j])continue;const d=h?Math.hypot(j%W-h.j%W,((j/W)|0)-((h.j/W)|0)):Math.hypot(j%W-I.cx[k],((j/W)|0)-I.cy[k]);if(d>=1&&d<bd){bd=d;c=j}}if(c<0)return false;
  const r=mkRes(S,HAYATE,'wind',c%W+.5,((c/W)|0)+.5,'merry');r.came=dayNo();S.res.push(r);S.flags.hayate=1;spawnFX(r.x-.5,r.y-.6,'#e6f4fa');recount();const kz=S.res.some(q=>q.name===KAZANE&&!q.hidden);
  dialog(kz?WIND_HAYATE.slice():WIND_HAYATE.filter(L=>L[0]!==KAZANE),()=>{S.flags.hayate=2;memo('leaf',HAYATE+'が目をさました');if(after)after()});return true}
/* のっているせいれいの位置（遊具の絵に合わせて、まわる） */
const RIDEPH=new Map();
function rideAng(j,now){let p=RIDEPH.get(j);if(!p){p={a:(j*.37)%6.28,t:now};RIDEPH.set(j,p)}const dt=Math.max(0,Math.min(.1,(now-p.t)/1000));p.t=now;if(S&&RIDES.has(S.obj[j])&&rideOn(j))p.a+=dt*1.5;return p.a}
/* 3Dから写した遊具（チップに iso）の座席：床の中心から、座る点までの向き a（ラジアン）・はなれ r（マス）・高さ h（マス）。3Dの設計図（tools/art/handoff3d/rides.py）の式と同じ。A＝遊具のまわる角度（rideAng） */
const RIDESEAT={merry:(k,A)=>{const i=k%3;return{a:A+i*2.0944,r:.94,h:1.124+.12*Math.sin(4*(A+i*.5236))}}/* 馬i：床の角度から120度ずつ。馬の高さ .96（柱の上下 .12 を、馬ごとに30度ずつずらして1周に4回）＋鞍 .164 */,
  cup:(k,A)=>({a:A*1.3-1.5708+(k%2+1)*2.0944,r:.71,h:.477})/* カップ1・2ばん（3つのうち、0ばんにはのらない）：軌道の角度は床の1.3倍。高さは皿の上 .30＋底 .087＋.09 */,
  skyswing:(k,A)=>({a:A+(k%3)*2.0944,r:1.35,h:1.138})/* 座席6つのうち、1つおき（0・2・4ばん）にのる。半径1.35・高さ 1.07＋座面 .068 */};
function windRidePose(r,a,now){r._toyH=0;if(!RIDES.has(a.what))return null;const j=a.obj,X=(j%W)*TS,Y=((j/W)|0)*TS-(S.hi?S.hi[j]|0:0)*0,us=toyUsers(j),k=Math.max(0,us.indexOf(r)),A=rideAng(j,now);
  {const sf=RIDESEAT[a.what],ic=window.CHIPS&&CHIPS[a.what];if(sf&&ic&&ic.iso){/* 3Dの絵（クォータービュー）：座る点を、床の中心から、せかいの点で。高さは、せいれいを画面で上へ（uLift） */const q=sf(k,A),sz=BL[a.what].sz,dx=Math.cos(q.a)*q.r,dy=Math.sin(q.a)*q.r;r.face=-Math.sin(q.a)-Math.cos(q.a)>0?1:-1;/* 進む向きが、画面の右なら右向き */r._toyH=q.h;const wx=X+(sz[0]/2+dx)*TS,wy=Y+(sz[1]/2+dy)*TS,rx=r.x*TS,ry=r.y*TS;return{x:rx+(isoX(wx,wy)-isoX(rx,ry))/IQSX,y:ry+(isoY(wx,wy)-isoY(rx,ry))/IQSY/* せいれいの絵は、いまいる点を足もとに、立てる形（standTf）で描くので、せかいの点の画面でのずれを、立てる形のずれにして返す */,z:Y/TS+(dx+dy>0?sz[1]+.06:sz[1]-.6)/* 手前の半分は遊具より手前・奥の半分は遊具のうしろ */}}}
  const K=RIDEK,fx=X+(a.what==='wheel'?48:32),fy=Y+56,PX=v=>fx+(v-fx)*K,PY=v=>fy+(v-fy)*K;
  const ch=window.CHIPS&&CHIPS[a.what];if(ch&&ch.seats){/* 3Dの絵の座席（コマごと、足もとからの g64）。そのコマの座席の、うしろ半分にいるときは、遊具の奥に描く */const F=ch.seats,f=rideFrame(a.what,j,now),n=F[0].length,q=k%n,p=F[f][q],nx=F[(f+1)%16][q];let my=0;for(const L of F)my+=L[q][1];my/=16;
    r.face=a.what==='wheel'?1:nx[0]>p[0]?1:nx[0]<p[0]?-1:r.face||1;const front=p[1]>=my;return{x:fx+p[0]/2,y:fy+p[1]/2,z:Y/TS+(front?2.06:a.what==='skyswing'?.95:1.4)}}
  if(a.what==='wheel'){const th=A*.35+k*1.5708,cx=X+48,cy=Y-6;r.face=1;return{x:PX(cx+Math.cos(th)*34),y:PY(cy+Math.sin(th)*34+12),z:Y/TS+2.06}}
  const cx=X+32,n=a.what==='cup'?2:3,th=A*(a.what==='cup'?1.3:1)+k*6.2832/n,sn=Math.sin(th),cs=Math.cos(th);r.face=sn>0?(cs>0?-1:1):(cs>0?1:-1);
  if(a.what==='skyswing')return{x:PX(cx+cs*27),y:PY(Y+30+sn*9),z:Y/TS+(sn>0?2.06:.95)};
  if(a.what==='cup')return{x:PX(cx+cs*15),y:PY(Y+47+sn*6),z:Y/TS+(sn>0?2.06:1.4)};
  return{x:PX(cx+cs*20),y:PY(Y+48+sn*7)-Math.abs(Math.sin(A*2+k))*3,z:Y/TS+(sn>0?2.06:1.4)}}
/* ---------- 絵（コードの仮のドット絵。1ドット＝世界の1ドット） ---------- */
function windCover(k,now){/* しずんだ島の雲のこさ（0〜1）。うかんだ島は、雲がわれるあいだだけ */if(!S.wind.up[k])return 1;const T=WRISE.get(S.wind),t=T&&T.get(k);if(t==null)return 0;if(t===Infinity)return 1;const p=(now-t)/WINDRISE;if(p>=1){T.delete(k);return 0}return 1-p}
const WCOVPI=new WeakMap();
function drawWindCover(c,x0,y0,x1,y1,now){/* しずんだ島：島の形に、雲をかぶせる（夜の暗さより下。うっすら島が見える） */if(!windOn())return;const I=windIsles(S),PM=WCOVPI;let P=PM.get(S);
  if(!P){P=[null];for(let k=1;k<=I.n;k++)P.push(new Path2D());for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=I.id[y*W+x];if(!k)continue;P[k].rect(x*TS,y*TS,TS,TS)/* 地面の形だけ（高さは、かさねて描く） */}PM.set(S,P)}
  const pt=c.createPattern(skyTex(),'repeat');pt.setTransform(new DOMMatrix().translate(Math.floor(now/1000*3)%128,0));
  for(let k=1;k<=I.n;k++){if(k===I.mid)continue;const a=windCover(k,now);if(a<=0)continue;if(I.cx[k]<x0-30||I.cx[k]>x1+30||I.cy[k]<y0-30||I.cy[k]>y1+30)continue;c.save();c.globalAlpha=.88*a;c.fillStyle=pt;c.globalAlpha=1-Math.pow(1-.88*a,1/IQFOGN);isoFogDraw(c,()=>c.fill(P[k]));c.restore()}}/* クォータービュー：雲は、あつみのある形（霧と同じ） */
function drawWindGround(c,x0,y0,x1,y1,now){/* 地面の高さの絵：雲の橋と、風のすじ（物・せいれいより下） */if(!windOn()||!WN||WNS!==S)return;const t=now/1000;
  for(let y=Math.max(0,y0-1);y<Math.min(H,y1+1);y++)for(let x=Math.max(0,x0-1);x<Math.min(W,x1+1);x++){const j=y*W+x,d=WN.dir[j];if(d<0)continue;const px=x*TS,py=y*TS,hz=d===1||d===3;isoGroundLv(c,isoLv(j));/* その段の高さの地面に */
    if(WN.br[j]){/* 雲の橋：白い雲の道 */c.fillStyle='#a5d2e8';if(hz)c.fillRect(px,py+9,TS,18);else c.fillRect(px+7,py,18,TS);c.fillStyle='#f4fbfd';if(hz){c.fillRect(px,py+6,TS,18);for(let q=0;q<4;q++)c.fillRect(px+q*8+((j+q)&1)*2,py+4+((q+j)&1),6,3)}else{c.fillRect(px+7,py,18,TS);for(let q=0;q<4;q++)c.fillRect(px+5+((q+j)&1),py+q*8+((j+q)&1)*2,3,6)}c.fillStyle='#ffffff';if(hz)c.fillRect(px,py+9,TS,4);else c.fillRect(px+10,py,4,TS)}
    /* 風のすじ：風の向きへ流れる、白い短い線 */for(let q=0;q<3;q++){const ph=((t*1.4+hash(j*7+q*31))%1),off=Math.floor(ph*TS),sd=5+((hash(j*13+q*5)*20)|0),col=WN.br[j]?['rgba(120,180,212,.95)','rgba(165,210,232,.9)']:['rgba(255,255,255,.95)','rgba(214,240,250,.8)'];
      for(let s=0;s<2;s++){c.fillStyle=col[s];const a=s?-8:0,len=s?8:4;/* あたまは白く、うしろは、うすい尾 */
        if(d===1)c.fillRect(px+off+a,py+sd,len,2);else if(d===3)c.fillRect(px+TS-off-len-a,py+sd,len,2);else if(d===0)c.fillRect(px+sd,py+off+a,2,len);else c.fillRect(px+sd,py+TS-off-len-a,2,len)}}}groundTf(c,dpr*cam.z)}
function drawWindObj(c,id,x,y,i,g,now){const R=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x+a),Math.round(y+b),w,h)};
  if(RIDES.has(id)||RIDEB[id]){drawRide(c,RIDEB[id]||id,!!RIDEB[id],x,y,i,now,R);return}
  if(id==='oldmill'){drawObj(c,'windmill',x,y,i,g,now);return}/* 古い風車：風があたっているときだけ、まわる */
  if(id==='kazaana'||id==='kazaanab'){/* 風穴：石でかこんだ穴。ふさがった風穴は、石の山（3Dから写したチップ。ないときはコードの仮の絵） */const ch=window.CHIPS&&CHIPS[id];
    if(ch&&drawChip(c,ch,id,x,y,now,i)){if(id==='kazaana')windHoleDots(c,x,y,i,now);return}
    R(5,12,22,14,'#8f8672');R(3,15,26,9,'#8f8672');R(6,11,20,2,'#b3aa94');R(4,14,3,2,'#b3aa94');R(25,14,3,2,'#b3aa94');R(5,25,22,2,'#6f6857');
    if(id==='kazaana'){R(8,14,16,9,'#3d4a5c');R(10,13,12,1,'#3d4a5c');R(10,23,12,1,'#3d4a5c');R(9,15,14,2,'#2b3442');
      windHoleDots(c,x,y,i,now)}
    else{R(8,10,8,8,'#a39a84');R(15,7,9,10,'#b3aa94');R(11,15,11,9,'#9a917b');R(18,16,7,7,'#a8a08a');R(9,11,6,1,'#cfc7b2');R(16,8,7,1,'#cfc7b2');R(12,16,9,1,'#c2baa4');R(8,17,1,1,'#6f6857');R(22,23,3,1,'#6f6857')}return}
  if(id==='kazami'){/* かざみ：柱の上に、風の向きをさす矢の羽 */const d=(i!=null?rotAt(i):(PLROTS.kazami||0))&3,ch=chipOf('kazami',i,i!=null?null:d);if(ch&&drawChip(c,ch,id,x,y,now,i))return;R(12,26,8,3,'rgba(60,50,30,.25)');R(15,10,2,18,'#8a6a42');R(14,26,4,2,'#6f5433');R(14,8,4,3,'#c9a46a');
    const a='#f4fbfd',b='#7fc7b4';if(d===1){R(8,4,16,3,a);R(22,2,3,7,b);R(25,4,2,3,b);R(6,2,3,7,b)}else if(d===3){R(8,4,16,3,a);R(7,2,3,7,b);R(5,4,2,3,b);R(23,2,3,7,b)}else if(d===0){R(14,0,4,12,a);R(12,10,8,3,b);R(14,13,4,2,b);R(12,-1,8,2,b)}else{R(14,0,4,12,a);R(12,0,8,3,b);R(14,-2,4,2,b);R(12,11,8,2,b)}return}}

function windHoleDots(c,x,y,i,now){/* 風穴から、風の向きへ出る白いつぶ */if(i==null)return;const h=windHoleAt(i),d=h?h.d&3:0,t=(now||0)/1000;for(let q=0;q<3;q++){const ph=(t*1.8+q/3)%1,k=Math.floor(ph*12);c.fillStyle='rgba(255,255,255,'+(.9-ph*.7)+')';c.fillRect(Math.round(x+15+WDIR[d][0]*k+(q-1)*3*Math.abs(WDIR[d][1])),Math.round(y+17+WDIR[d][1]*k+(q-1)*3*Math.abs(WDIR[d][0])),2,2)}}

/* 遊具の絵（コードの仮のドット絵。観覧車いがいは3Dのチップだけ）。brk：こわれた遊具（色がさめて、かたむき、動かない） */
function rideFrame(id,i,now){/* 遊具の絵のコマ（16コマでひとまわり。チップの pf がまわる速さの倍） */const ch=window.CHIPS&&CHIPS[id];if(!ch||!ch.pf||i==null)return 0;const a=rideAng(i,now||0)*ch.pf/6.2832*16;return((Math.round(a)%16)+16)%16}
function drawRide(c,id,brk,x0,y0,i,now,R0){/* 3Dから写したチップ：動かない所 :s に、そのコマの動く所 :m<コマ> をかさねる。こわれた遊具は <id>b の1まい。ないときはコードの仮の絵 */const C=window.CHIPS;
  if(C){if(brk){const ch=C[id+'b'];if(ch&&drawChip(c,ch,id+'b',x0,y0,now,i))return}else if(i==null||ICON){const ch=C[id];if(ch&&drawChip(c,ch,id,x0,y0,now,i))return}else{const st=C[id+':s'],mv=C[id+':m'+rideFrame(id,i,now)];if(st&&mv&&drawChip(c,st,id,x0,y0,now,i)){drawChip(c,mv,id,x0,y0,now,i);return}}}
const fx=id==='wheel'?48:32,fy=56;c.save();c.translate(Math.round(x0+fx),Math.round(y0+fy));c.scale(RIDEK,RIDEK);const x=-fx,y=-fy,R=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x+a),Math.round(y+b),w,h)};drawRide0(c,id,brk,x,y,i,now,R);c.restore()}
function drawRide0(c,id,brk,x,y,i,now,R){const A=i!=null&&!brk?rideAng(i,now||0):.6,O=(cx,cy,rx,ry,col)=>{c.fillStyle=col;for(let q=-ry;q<=ry;q++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-q*q/(ry*ry+.01))));if(w>0)c.fillRect(Math.round(x+cx-w),Math.round(y+cy+q),w*2,1)}},
    Ln=(x0,y0,x1,y1,col,t)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0;c.fillStyle=col;for(let q=0;q<=n;q++)c.fillRect(Math.round(x+x0+(x1-x0)*q/Math.max(1,n)),Math.round(y+y0+(y1-y0)*q/Math.max(1,n)),t||1,t||1)},
    P=brk?{a:'#c9c2b4',b:'#e3ddd0',p:'#a79f90',w:'#8f8676',m:'#b3aa98'}:{a:'#f2a7b5',b:'#fff6e8',p:'#c9a46a',w:'#b08a52',m:'#8fd3c2'};
  if(id==='wheel'){const cx=48,cy=-6,RR=34;O(48,60,40,5,'rgba(60,50,30,.2)');Ln(cx,cy,cx-22,58,P.w,3);Ln(cx,cy,cx+22,58,P.w,3);R(cx-28,57,56,4,P.p);
    for(let q=0;q<8;q++){const th=A*.35+q*.7854;Ln(cx,cy,cx+Math.cos(th)*RR,cy+Math.sin(th)*RR,P.m,1)}
    for(let q=0;q<56;q++){const th=q*6.2832/56;R(cx+Math.cos(th)*RR-1,cy+Math.sin(th)*RR-1,2,2,P.p)}
    for(let q=0;q<4;q++){const th=A*.35+q*1.5708,gx=cx+Math.cos(th)*RR,gy=cy+Math.sin(th)*RR;R(gx-1,gy,2,4,P.w);R(gx-6,gy+4,12,9,q%2?P.a:P.m);R(gx-6,gy+4,12,2,P.b);R(gx-4,gy+7,8,3,brk?'#d8d2c6':'#eaf7fb')}
    O(cx,cy,4,4,P.w);O(cx,cy,2,2,P.b);if(brk){Ln(cx-30,40,cx-18,58,P.w,2);R(cx+14,50,10,3,P.a)}return}
  O(32,56,30,7,'rgba(60,50,30,.2)');}
/* ---------- 観覧車の山場・雲の下（目標6・7）：観覧車のてっぺんから、雲のすきまにヌシ様のつばさが見える（wind:peek）。
   雲の海のはしでカザネたちが待つ所に、まもりの光を落とすと、雲がひらいて、つばさ・ヌシ様の顔・つばさのかげでねむる影が見え、ヌシ様が話す（windGlHit・windPartScene）。
   絵はコードで描くかりのドット絵（drawWindScene）。場面の動き・カメラは実時間、ひらく場面のあいだは村の時間を止める（SCENEHOLD） ---------- */
const NUSHI4='風のヌシ',WIND_BEAT_MS={peek:3200},WPARTMS=4200,WKUMOR=2/* まもりの光が、印のまわり何マスまでなら、とどく */;
let WSCN=[];/* {k:'peek'|'part',x,y,t0,end,s} 世界の点・実時間 */
function windKumoSpot(){/* 雲の海のはしの印：観覧車にいちばん近い、雲の海にとなりあう、歩ける陸のマス（1回きめて S.wind.kj に） */if(!windOn())return null;if(S.wind.kj!=null&&walk(S.wind.kj))return S.wind.kj;if(WKNULL.s===S&&performance.now()<WKNULL.t)return null;/* 行けないときは、2秒に1回だけさがしなおす */
  let w=-1;for(let j=0;j<W*H&&w<0;j++)if(S.obj[j]==='wheel'||S.obj[j]==='wheelb'||S.obj[j]==='site'&&S.dyn[j]&&S.dyn[j].build==='wheel')w=j;const wx=w<0?CX:w%W,wy=w<0?CY:(w/W)|0;
  const r0=S.res.find(q=>q.name===KAZANE&&!q.hidden)||S.res.find(q=>!q.hidden);if(!r0)return null;const G=bfs(r0.x|0,r0.y|0);/* せいれいが歩いて行ける所だけ */
  let best=-1,bd=1e9;for(let j=0;j<W*H;j++){if(!walk(j)||S.obj[j]||skyJ(j)||windSunk(j)||!(G.dist[j]>=0))continue;const x=j%W,y=(j/W)|0;if(!(skyJ(j+W)&&y<H-1))continue;/* 南が雲の海（見おろすので南のはし） */const d=Math.hypot(x-wx,y-wy);if(d<bd){bd=d;best=j}}
  S.wind.kj=best<0?null:best;if(best<0){WKNULL.s=S;WKNULL.t=performance.now()+2000}return S.wind.kj}
const WKNULL={s:null,t:0};
function windKumoOn(){return windOn()&&!S.free&&qAt('kumoshita')&&!S.flags.kumo}
function windKumoWait(n){const r=S.res.find(q=>q.name===n&&!q.hidden);return !!(r&&r.act&&r.act.type==='wwait'&&r.act.stage==='do')}
function windKumoProg(){if(!S.qTalked)return '';if(isNight())return '朝を待とう';if(windKumoSpot()==null)return '雲の海のはしへ行けない';const k=S.res.find(q=>q.name===KAZANE&&!q.hidden);if(!k)return 'カザネが村にいない';return windKumoWait(KAZANE)?'カザネが雲の海のはしで待っている':'カザネが雲の海のはしへ向かっている'}
function windDecide(r,G){/* 雲の海のはしで待つ：カザネ（いなくてもよいのはハヤテ）。昼だけ。待っているあいだ、おなか・たのしさ・つかれはへらない（wwait） */
  if(!windKumoOn()||WPART||!S.qTalked||isNight()||r.name!==KAZANE&&r.name!==HAYATE)return false;if(r.hunger<250||r.meal||r.carry||r.bm)return false;
  const kj=windKumoSpot();if(kj==null)return false;const here=(r.y|0)*W+(r.x|0),k=yamiFreeNear(kj,r,G);if(k<0)return false;
  if(k===here)return startAct(r,G,'wwait',-1,{dur:30,kj}),true;return startAct(r,G,'ywalk',k,{}),true}
ACT.wwait={start(r,a){r.bubble='';r.nap=false;a.h0=r.hunger;a.f0=r.fun;a.e0=r.energy;r.face=(a.kj%W)+.5>=r.x?1:-1},tick(r,a){r.hunger=Math.max(r.hunger,a.h0);r.fun=Math.max(r.fun,a.f0);r.energy=Math.max(r.energy,a.e0)},done:(r,a)=>a.t>=a.dur||isNight()||!windKumoOn()||!!WPART};
ACT_LBL.wwait='雲の海のはしで待っている';
let WPART=null;
function windGlHit(tx,ty){/* まもりの光が、雲の海のはしの印にとどいた */if(!windKumoOn()||WPART||isNight()||!S.qTalked)return;const kj=windKumoSpot();if(kj==null)return;if(Math.max(Math.abs(tx-kj%W),Math.abs(ty-((kj/W)|0)))>WKUMOR)return;
  if(!windKumoWait(KAZANE)){toast('カザネが来るのを待とう');return}windPartScene(kj)}
function windPartScene(kj){const S0=S,x=(kj%W+.5)*TS,y=((kj/W|0)+2.2)*TS,now=performance.now();WPART={S:S0,t0:now};SCENEHOLD=now+WPARTMS+600;
  camAnim={fz:cam.z,tz:Math.max(cam.z,1.4),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:x,ty:y-TS,t:0,dur:1.4};if(typeof musicDuck==='function')musicDuck(WPARTMS);
  WSCN.push({k:'part',x,y,t0:now+GLFX,end:Infinity});sfx('wave');for(const r of S.res)if(!r.hidden&&Math.hypot(r.x*TS-x,r.y*TS-y)<6*TS){r.face=x>=r.x*TS?1:-1;SHOCKU.set(r,now+1600)}if(typeof hdBig==='function')hdBig();
  villageTimeout(()=>{if(S!==S0){WPART=null;return}const H2=S.res.some(q=>q.name===HAYATE&&!q.hidden);
    dialog([[NUSHI4,'……風の子らか。よく、ここまで来たな。'],[KAZANE,'#surprise|ヌシ様……！ どうして、風を止めたんですか。'],[NUSHI4,'見よ。わたしのつばさのかげで、影たちがねむっている。'],[NUSHI4,'夜に休む場所をなくした子らだ。風がふけば、目をさまして、さまよってしまう。'],[NUSHI4,'だから、わたしは風をたたみ、つばさで島をささえて、ここにいた。'],[HAYATE,'#worry|……だから、遊び場も止まったんだ。'],[NUSHI4,'すまぬ。おまえたちから、楽しむことまで、うばってしまったな。'],[KAZANE,'#think|……いいえ。思い出しましたよ。ハヤテと、守り神のおかげでね。'],[NUSHI4,'……そうか。笑い声は、ここまでとどいていた。あたたかかった。']].filter(l=>H2||l[0]!==HAYATE),
      ()=>{WPART=null;for(const s of WSCN)if(s.k==='part')s.end=performance.now()+1500;if(S!==S0)return;S.flags.kumo=1;for(const r of S.res)if(r.act&&r.act.type==='wwait')endAct(r);memo('spirit','雲の海のはしで、風のヌシ様に会った');checkQuest();renderQuest();save()},null,NUSHI4)},WPARTMS)}
function windBeat(k){/* 会話の合図 wind:<場面> */if(k!=='peek'||!windOn())return;const kj=windKumoSpot();if(kj==null)return;const x=(kj%W+.5)*TS,y=((kj/W|0)+2.2)*TS,now=performance.now();
  camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:x,ty:y-TS,t:0,dur:1.2};WSCN.push({k:'peek',x,y,t0:now+900,end:now+WIND_BEAT_MS.peek+2200});sfx('wave')}
function windSceneReset(){WSCN=[];WPART=null}
function drawWindScene(c,now){/* つばさ・ヌシ様の顔・ねむる影（雲の上、夜の暗さより下） */if(!WSCN.length)return;WSCN=WSCN.filter(s=>now<s.end+1500);
  for(const s of WSCN){if(now<s.t0)continue;const fin=Math.min(1,(now-s.t0)/1500),out=s.end===Infinity?1:Math.max(0,1-(now-s.end)/1500),a=fin*out;if(a<=0)continue;isoAt(c,s.x,s.y);/* クォータービュー：その所に立てて（iso-fx.js） */
    if(s.k==='peek'){const tw=.55+.45*Math.sin((now-s.t0)/260);if(!(typeof wnDraw==='function'&&wnDraw(c,'support',s.x,s.y+8,a*.6*tw,false,.5)))wingDots(c,s.x,s.y,1,a*.6*tw,now)}/* 雲のすきまに見えるつばさ */
    else{c.save();c.globalAlpha=a*.85;c.fillStyle='#eef6ff';const R=4*TS;for(let i=-R;i<=R;i+=8){const h=Math.round(Math.sqrt(Math.max(0,R*R-i*i))*.45/4)*4;c.fillRect(Math.round(s.x+i),Math.round(s.y-h),8,h*2)}c.restore();/* 雲がひらいた所：うすい空の色のだ円（段々） */
      const art=typeof wnDraw==='function'&&wnDraw(c,'support',s.x,s.y+10,a);if(!art)wingDots(c,s.x,s.y+10,1.6,a,now);/* つばさで島をささえる姿（3Dの絵） */for(const[dx,dy]of[[-46,18],[-14,26],[22,20]])if(typeof drawShade==='function'){c.save();c.globalAlpha=a*.8;drawShade(c,'basic',s.x+dx,s.y+dy,.18,1,{dot:1,t:0});c.restore()}/* つばさのかげで、ねむる影 */
      if(!art)nushiFaceDots(c,s.x,s.y-30,a,now)}}isoBack(c)}/* 3Dの絵には顔もある */
function wingDots(c,x,y,k,a,now){/* 白いつばさ（2点の四角のドット）：羽根を、ゆっくりはばたく角度でならべる */const P=2*Math.max(1,Math.round(k)),fl=Math.sin(now/900)*.08;c.save();c.globalAlpha=a;
  for(const sd of[-1,1])for(let f=0;f<9;f++){const L=(44-f*3)*k,ang=(-.25+f*.11+fl)*sd,bx=x+sd*(10+f*7)*k,by=y-f*2*k;for(let t=0;t<L;t+=P){const px=Math.round((bx+Math.sin(ang)*t*.3*sd+sd*t*.55)/P)*P,py=Math.round((by+t*.25)/P)*P;c.fillStyle=t<P*2?'#d6deef':'#f8fbff';c.fillRect(px,py,P,P*2)}}c.restore()}
function nushiFaceDots(c,x,y,a,now){/* 風のヌシ様の顔：白い大きな鳥の頭（かりのドット絵） */const P=4,R=(dx,dy,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round((x+dx*P)/2)*2,Math.round((y+dy*P)/2)*2,w*P,h*P)};c.save();c.globalAlpha=a;
  R(-5,-4,10,8,'#f8fbff');R(-4,-5,8,1,'#f8fbff');R(-6,-2,1,5,'#e2e8f4');R(5,-2,1,5,'#e2e8f4');R(-4,4,8,1,'#e2e8f4');const bl=Math.floor(now/2600)%7===0?1:0;R(-3,-1,2,bl?1:2,'#5a6a8a');R(1,-1,2,bl?1:2,'#5a6a8a');R(-1,1,2,2,'#f0c46a');R(-1,3,2,1,'#d9a64a');c.restore()}
/* 風の夜のコワイノ：雲の海のふち（雲の海にとなりあう陸）の、村まで歩いて行ける所から来る（つばさの下から、のぼってくる） */
const WSPC={n:-1,s:null,L:null};
function windSpawnSpot(R){if(!windOn())return null;if(WSPC.n!==STATN||WSPC.s!==S){WSPC.n=STATN;WSPC.s=S;const L=[];for(let j=0;j<W*H;j++){if(S.ground[j]===1||windSunk(j)||!walk(j)||R[j]<0)continue;const x=j%W,y=(j/W)|0;if(skyJ(j-1)&&x>0||skyJ(j+1)&&x<W-1||skyJ(j-W)&&y>0||skyJ(j+W)&&y<H-1)L.push(j)}WSPC.L=L}
  const L=WSPC.L;if(!L.length)return null;for(let t=0;t<60;t++){const j=L[(Math.random()*L.length)|0],x=j%W,y=(j/W)|0;if(solidOf(j)||lightAt(x+.5,y+.5))continue;return [x+.5,y+.5]}return null}
