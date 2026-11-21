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
    setTimeout(()=>{if(!ok())return finish();const overlay=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="島がうかんだ"></div>'),card=el('<div class="idea-card"><h2>島がうかんだ！</h2><div class="spotpop"><p></p></div></div>');
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
function windTick(){if(!windOn())return;if(!WN||WNS!==S)windSync();windCarry();windRiseTick()}
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
function windRemember(r,ride){/* はじめてその遊具にのった・係をした：遊び方を1つ思い出す */r.rode=r.rode||{};if(r.rode[ride])return;r.rode[ride]=1;r.rem=r.rem||{};const L=Object.keys(BL).filter(id=>BL[id].play&&!RIDES.has(id)&&!r.rem[id]&&!nigate(r.elem,id));if(!L.length)return;const here=L.filter(id=>cnt(id)>0),t=L.includes(r.like)?r.like:here.length?here[(Math.random()*here.length)|0]:L[(Math.random()*L.length)|0];r.rem[t]=1;toast(r.name+'が、'+BL[t].name+'の遊び方を思い出した','good');if(typeof spReact==='function')spReact(r,'joy',1400)}
function windRemNote(r){if(!windFun())return '';const n=Object.keys(r.rem||{}).length;return '思い出した遊び：'+n}
/* ハヤテ：はじめにうかんだ島で目をさます（カザネのおさななじみ）。会話を読みおえてから、来たことにする */
function windHayateWake(k,after){if(S.flags.hayate||S.res.some(q=>q.name===HAYATE))return false;const I=windIsles(S),h=S.wind.holes.find(q=>I.id[q.j]===k);let c=-1,bd=1e9;for(let j=0;j<W*H;j++){if(I.id[j]!==k||!walk(j)||S.obj[j])continue;const d=h?Math.hypot(j%W-h.j%W,((j/W)|0)-((h.j/W)|0)):Math.hypot(j%W-I.cx[k],((j/W)|0)-I.cy[k]);if(d>=1&&d<bd){bd=d;c=j}}if(c<0)return false;
  const r=mkRes(S,HAYATE,'wind',c%W+.5,((c/W)|0)+.5,'merry');r.came=dayNo();S.res.push(r);S.flags.hayate=1;spawnFX(r.x-.5,r.y-.6,'#e6f4fa');recount();const kz=S.res.some(q=>q.name===KAZANE&&!q.hidden);
  dialog(kz?WIND_HAYATE.slice():WIND_HAYATE.filter(L=>L[0]!==KAZANE),()=>{S.flags.hayate=2;memo('leaf',HAYATE+'が目をさました');if(after)after()});return true}
/* のっているせいれいの位置（遊具の絵に合わせて、まわる） */
const RIDEPH=new Map();
function rideAng(j,now){let p=RIDEPH.get(j);if(!p){p={a:(j*.37)%6.28,t:now};RIDEPH.set(j,p)}const dt=Math.max(0,Math.min(.1,(now-p.t)/1000));p.t=now;if(S&&RIDES.has(S.obj[j])&&rideOn(j))p.a+=dt*1.5;return p.a}
function windRidePose(r,a,now){if(!RIDES.has(a.what))return null;const j=a.obj,X=(j%W)*TS,Y=((j/W)|0)*TS-(S.hi?S.hi[j]|0:0)*0,us=toyUsers(j),k=Math.max(0,us.indexOf(r)),A=rideAng(j,now);
  const K=RIDEK,fx=X+(a.what==='wheel'?48:32),fy=Y+56,PX=v=>fx+(v-fx)*K,PY=v=>fy+(v-fy)*K;
  if(a.what==='wheel'){const th=A*.35+k*1.5708,cx=X+48,cy=Y-6;r.face=1;return{x:PX(cx+Math.cos(th)*34),y:PY(cy+Math.sin(th)*34+12),z:Y/TS+2.06}}
  const cx=X+32,n=a.what==='cup'?2:3,th=A*(a.what==='cup'?1.3:1)+k*6.2832/n,sn=Math.sin(th),cs=Math.cos(th);r.face=sn>0?(cs>0?-1:1):(cs>0?1:-1);
  if(a.what==='skyswing')return{x:PX(cx+cs*27),y:PY(Y+30+sn*9),z:Y/TS+(sn>0?2.06:.95)};
  if(a.what==='cup')return{x:PX(cx+cs*15),y:PY(Y+47+sn*6),z:Y/TS+(sn>0?2.06:1.4)};
  return{x:PX(cx+cs*20),y:PY(Y+48+sn*7)-Math.abs(Math.sin(A*2+k))*3,z:Y/TS+(sn>0?2.06:1.4)}}
/* ---------- 絵（コードの仮のドット絵。1ドット＝世界の1ドット） ---------- */
function windCover(k,now){/* しずんだ島の雲のこさ（0〜1）。うかんだ島は、雲がわれるあいだだけ */if(!S.wind.up[k])return 1;const T=WRISE.get(S.wind),t=T&&T.get(k);if(t==null)return 0;if(t===Infinity)return 1;const p=(now-t)/WINDRISE;if(p>=1){T.delete(k);return 0}return 1-p}
const WCOVP=new WeakMap();
function drawWindCover(c,x0,y0,x1,y1,now){/* しずんだ島：島の形に、雲をかぶせる（夜の暗さより下。うっすら島が見える） */if(!windOn())return;const I=windIsles(S);let P=WCOVP.get(S);
  if(!P){P=[null];for(let k=1;k<=I.n;k++)P.push(new Path2D());for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=I.id[y*W+x];if(!k)continue;const up=y>0&&I.id[(y-1)*W+x]===k?0:44+(S.hi?S.hi[y*W+x]|0:0)*LIFT,dn=y<H-1&&I.id[(y+1)*W+x]===k?0:22;P[k].rect(x*TS,y*TS-up,TS,TS+up+dn)}WCOVP.set(S,P)}
  const pt=c.createPattern(skyTex(),'repeat');pt.setTransform(new DOMMatrix().translate(Math.floor(now/1000*3)%128,0));
  for(let k=1;k<=I.n;k++){if(k===I.mid)continue;const a=windCover(k,now);if(a<=0)continue;if(I.cx[k]<x0-30||I.cx[k]>x1+30||I.cy[k]<y0-30||I.cy[k]>y1+30)continue;c.save();c.globalAlpha=.88*a;c.fillStyle=pt;c.fill(P[k]);c.restore()}}
function drawWindGround(c,x0,y0,x1,y1,now){/* 地面の高さの絵：雲の橋と、風のすじ（物・せいれいより下） */if(!windOn()||!WN||WNS!==S)return;const t=now/1000;
  for(let y=Math.max(0,y0-1);y<Math.min(H,y1+1);y++)for(let x=Math.max(0,x0-1);x<Math.min(W,x1+1);x++){const j=y*W+x,d=WN.dir[j];if(d<0)continue;const px=x*TS,py=y*TS-(S.hi?S.hi[j]|0:0)*LIFT,hz=d===1||d===3;
    if(WN.br[j]){/* 雲の橋：白い雲の道 */c.fillStyle='#a5d2e8';if(hz)c.fillRect(px,py+9,TS,18);else c.fillRect(px+7,py,18,TS);c.fillStyle='#f4fbfd';if(hz){c.fillRect(px,py+6,TS,18);for(let q=0;q<4;q++)c.fillRect(px+q*8+((j+q)&1)*2,py+4+((q+j)&1),6,3)}else{c.fillRect(px+7,py,18,TS);for(let q=0;q<4;q++)c.fillRect(px+5+((q+j)&1),py+q*8+((j+q)&1)*2,3,6)}c.fillStyle='#ffffff';if(hz)c.fillRect(px,py+9,TS,4);else c.fillRect(px+10,py,4,TS)}
    /* 風のすじ：風の向きへ流れる、白い短い線 */for(let q=0;q<3;q++){const ph=((t*1.4+hash(j*7+q*31))%1),off=Math.floor(ph*TS),sd=5+((hash(j*13+q*5)*20)|0),col=WN.br[j]?['rgba(120,180,212,.95)','rgba(165,210,232,.9)']:['rgba(255,255,255,.95)','rgba(214,240,250,.8)'];
      for(let s=0;s<2;s++){c.fillStyle=col[s];const a=s?-8:0,len=s?8:4;/* あたまは白く、うしろは、うすい尾 */
        if(d===1)c.fillRect(px+off+a,py+sd,len,2);else if(d===3)c.fillRect(px+TS-off-len-a,py+sd,len,2);else if(d===0)c.fillRect(px+sd,py+off+a,2,len);else c.fillRect(px+sd,py+TS-off-len-a,2,len)}}}}
function drawWindObj(c,id,x,y,i,g,now){const R=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x+a),Math.round(y+b),w,h)};
  if(RIDES.has(id)||RIDEB[id]){drawRide(c,RIDEB[id]||id,!!RIDEB[id],x,y,i,now,R);return}
  if(id==='oldmill'){drawObj(c,'windmill',x,y,i,g,now);return}/* 古い風車：風があたっているときだけ、まわる */
  if(id==='kazaana'||id==='kazaanab'){/* 風穴：石でかこんだ穴。ふさがった風穴は、石の山 */
    R(5,12,22,14,'#8f8672');R(3,15,26,9,'#8f8672');R(6,11,20,2,'#b3aa94');R(4,14,3,2,'#b3aa94');R(25,14,3,2,'#b3aa94');R(5,25,22,2,'#6f6857');
    if(id==='kazaana'){R(8,14,16,9,'#3d4a5c');R(10,13,12,1,'#3d4a5c');R(10,23,12,1,'#3d4a5c');R(9,15,14,2,'#2b3442');
      if(i!=null){const h=windHoleAt(i),d=h?h.d&3:0,t=(now||0)/1000;for(let q=0;q<3;q++){const ph=(t*1.8+q/3)%1,k=Math.floor(ph*12);c.fillStyle='rgba(255,255,255,'+(.9-ph*.7)+')';c.fillRect(Math.round(x+15+WDIR[d][0]*k+(q-1)*3*Math.abs(WDIR[d][1])),Math.round(y+17+WDIR[d][1]*k+(q-1)*3*Math.abs(WDIR[d][0])),2,2)}}}
    else{R(8,10,8,8,'#a39a84');R(15,7,9,10,'#b3aa94');R(11,15,11,9,'#9a917b');R(18,16,7,7,'#a8a08a');R(9,11,6,1,'#cfc7b2');R(16,8,7,1,'#cfc7b2');R(12,16,9,1,'#c2baa4');R(8,17,1,1,'#6f6857');R(22,23,3,1,'#6f6857')}return}
  if(id==='kazami'){/* かざみ：柱の上に、風の向きをさす矢の羽 */const d=(i!=null?rotAt(i):(PLROTS.kazami||0))&3;R(12,26,8,3,'rgba(60,50,30,.25)');R(15,10,2,18,'#8a6a42');R(14,26,4,2,'#6f5433');R(14,8,4,3,'#c9a46a');
    const a='#f4fbfd',b='#7fc7b4';if(d===1){R(8,4,16,3,a);R(22,2,3,7,b);R(25,4,2,3,b);R(6,2,3,7,b)}else if(d===3){R(8,4,16,3,a);R(7,2,3,7,b);R(5,4,2,3,b);R(23,2,3,7,b)}else if(d===0){R(14,0,4,12,a);R(12,10,8,3,b);R(14,13,4,2,b);R(12,-1,8,2,b)}else{R(14,0,4,12,a);R(12,0,8,3,b);R(14,-2,4,2,b);R(12,11,8,2,b)}return}}

/* 遊具の絵（コードの仮のドット絵）。brk：こわれた遊具（色がさめて、かたむき、動かない） */
function drawRide(c,id,brk,x0,y0,i,now,R0){const fx=id==='wheel'?48:32,fy=56;c.save();c.translate(Math.round(x0+fx),Math.round(y0+fy));c.scale(RIDEK,RIDEK);const x=-fx,y=-fy,R=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x+a),Math.round(y+b),w,h)};drawRide0(c,id,brk,x,y,i,now,R);c.restore()}
function drawRide0(c,id,brk,x,y,i,now,R){const A=i!=null&&!brk?rideAng(i,now||0):.6,O=(cx,cy,rx,ry,col)=>{c.fillStyle=col;for(let q=-ry;q<=ry;q++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-q*q/(ry*ry+.01))));if(w>0)c.fillRect(Math.round(x+cx-w),Math.round(y+cy+q),w*2,1)}},
    Ln=(x0,y0,x1,y1,col,t)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0;c.fillStyle=col;for(let q=0;q<=n;q++)c.fillRect(Math.round(x+x0+(x1-x0)*q/Math.max(1,n)),Math.round(y+y0+(y1-y0)*q/Math.max(1,n)),t||1,t||1)},
    P=brk?{a:'#c9c2b4',b:'#e3ddd0',p:'#a79f90',w:'#8f8676',m:'#b3aa98'}:{a:'#f2a7b5',b:'#fff6e8',p:'#c9a46a',w:'#b08a52',m:'#8fd3c2'};
  if(id==='wheel'){const cx=48,cy=-6,RR=34;O(48,60,40,5,'rgba(60,50,30,.2)');Ln(cx,cy,cx-22,58,P.w,3);Ln(cx,cy,cx+22,58,P.w,3);R(cx-28,57,56,4,P.p);
    for(let q=0;q<8;q++){const th=A*.35+q*.7854;Ln(cx,cy,cx+Math.cos(th)*RR,cy+Math.sin(th)*RR,P.m,1)}
    for(let q=0;q<56;q++){const th=q*6.2832/56;R(cx+Math.cos(th)*RR-1,cy+Math.sin(th)*RR-1,2,2,P.p)}
    for(let q=0;q<4;q++){const th=A*.35+q*1.5708,gx=cx+Math.cos(th)*RR,gy=cy+Math.sin(th)*RR;R(gx-1,gy,2,4,P.w);R(gx-6,gy+4,12,9,q%2?P.a:P.m);R(gx-6,gy+4,12,2,P.b);R(gx-4,gy+7,8,3,brk?'#d8d2c6':'#eaf7fb')}
    O(cx,cy,4,4,P.w);O(cx,cy,2,2,P.b);if(brk){Ln(cx-30,40,cx-18,58,P.w,2);R(cx+14,50,10,3,P.a)}return}
  O(32,56,30,7,'rgba(60,50,30,.2)');
  if(id==='merry'){O(32,50,28,9,P.w);O(32,47,28,9,brk?'#d8d0bf':'#ecd9a8');R(30,6,4,42,P.p);
    for(let q=0;q<3;q++){const th=A+q*2.0944,hx=32+Math.cos(th)*20,hy=48+Math.sin(th)*7;if(Math.sin(th)<=0){R(hx,hy-30,1,26,P.b);R(hx-4,hy-13,9,6,P.b);R(hx+3,hy-17,3,5,P.b);R(hx-3,hy-7,2,4,P.b);R(hx+3,hy-7,2,4,P.b)}}
    for(let q=0;q<18;q++){const w=13+q;for(let s=-w;s<w;s+=6){const k=Math.floor((s+w+A*14)/6)&1;R(32+s,-10+q,Math.min(6,w-s),1,k?P.a:P.b)}}R(19,8,26,3,P.p);R(30,-15,4,6,P.a);R(31,-18,2,3,brk?P.w:'#ffd84a');
    for(let q=0;q<3;q++){const th=A+q*2.0944,hx=32+Math.cos(th)*20,hy=48+Math.sin(th)*7;if(Math.sin(th)>0){R(hx,hy-34,1,30,P.b);R(hx-4,hy-13,9,6,P.b);R(hx+3,hy-17,3,5,P.b);R(hx-3,hy-7,2,4,P.b);R(hx+3,hy-7,2,4,P.b);R(hx-2,hy-12,5,2,P.a)}}
    if(brk){Ln(8,38,20,52,P.w,2);R(40,52,9,5,P.b)}return}
  if(id==='cup'){O(32,50,30,10,P.w);O(32,47,30,10,brk?'#d5cfc2':'#bfe0d6');O(32,47,22,7,brk?'#c6c0b3':'#a9d3c7');
    for(let q=0;q<2;q++){const th=A*1.3+q*3.1416,ux=32+Math.cos(th)*15,uy=47+Math.sin(th)*6,col=q?P.a:(brk?P.m:'#ffe08a');R(ux-9,uy-12,18,11,col);R(ux-9,uy-12,18,2,P.b);R(ux-7,uy-1,14,2,P.w);R(ux+9,uy-9,3,6,col)}
    O(32,44,5,3,P.p);R(31,34,2,10,P.p);O(32,33,4,2,P.a);if(brk)R(6,50,12,4,P.a);return}
  if(id==='skyswing'){O(32,52,16,5,P.w);O(32,50,16,5,P.p);R(30,-34,4,84,P.p);R(31,-34,1,84,P.b);const sp=brk?0:5;
    for(let q=0;q<3;q++){const th=A+q*2.0944,sx=32+Math.cos(th)*(22+sp),sy=22+Math.sin(th)*9;Ln(32+Math.cos(th)*14,-30+Math.sin(th)*4,sx,sy,P.m,1);R(sx-4,sy,9,3,P.a);R(sx-4,sy+3,9,1,P.w)}
    O(32,-31,18,5,P.w);O(32,-33,18,5,P.a);for(let q=-16;q<16;q+=8)R(32+q,-35,4,2,P.b);R(30,-42,4,6,P.a);if(brk)Ln(44,-28,52,6,P.m,1);return}}
