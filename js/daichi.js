'use strict';
/* フタバの特性「だいちのちから」（KEYVR の tr:'daichi'。スタミナ・つかれのとれる速さは「ねばりづよい」と同じ）：
   おなかが0になるとき、フタバに近いみどりのマス（REV）を1つずつつかって、おなか+DAICHI_H。みどりがのこっていなければ、ふつうに消える。
   つかったマスは、かれたマス（S.kare）。recount で REV からのぞく。木は枯れ木、ベリーのしげみ・花は枯れた草にする。
   もどるのは、かれたマスに植えなおしたとき（recount の daichiReplant）か、せいれいが3時間すごしたとき（stayTick）。 */
const DAICHI_H=10,DAICHI_R=30;/* DAICHI_R：さがす広さ（マス） */
const DAICHI_TREE=new Set(['tree','fruit','ntree']);
function daichiOk(j){if(!REV.has(j)||S.ground[j]===1)return false;if(S.kare&&S.kare[j])return false;const o=S.obj[j];if(o==='tower'||o==='part'&&S.ref&&S.obj[S.ref[j]]==='tower')return false;/* 御神木はかれない */if(typeof fogAt==='function'&&fogAt(j))return false;return true}
function daichiTiles(x,y,n){/* (x,y) に近いみどりのマスを n こ（近い順） */const out=[],cx=x|0,cy=y|0;
  for(let d=0;d<=DAICHI_R&&out.length<n;d++){const ring=[];for(let dy=-d;dy<=d;dy++)for(let dx=-d;dx<=d;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==d)continue;const X=cx+dx,Y=cy+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(daichiOk(j))ring.push([Math.hypot(dx,dy),j])}
    ring.sort((a,b)=>a[0]-b[0]);for(const q of ring){if(out.length>=n)break;out.push(q[1])}}
  return out}
function daichiWither(j){/* みどりのマスを、かれたマスにする */const K=S.kare||(S.kare={});K[j]=1;if(S.grn)delete S.grn[j];if(S.stay)delete S.stay[j];
  const o=S.obj[j];if(DAICHI_TREE.has(o)){S.obj[j]='deadtree';delete S.dyn[j]}else if(o==='berry'||FLOWERS.has(o)){S.obj[j]='weed'+weedSt()+'k';delete S.dyn[j]}}
function daichiTake(x,y,n){/* みどりを n マスかれさせる（いくつかれたかをかえす） */const T=daichiTiles(x,y,n);for(const j of T)daichiWither(j);if(T.length)recount();return T.length}
function daichiUse(r){/* おなかが0になったとき：みどりでもちこたえたら true */if(!trt(r,'daichi'))return false;const need=Math.max(1,Math.ceil((1-r.hunger)/DAICHI_H)),T=daichiTiles(r.x,r.y,need);if(T.length<need)return false;
  for(const j of T)daichiWither(j);r.hunger+=T.length*DAICHI_H;recount();if(typeof leafFX==='function')leafFX(r);
  if(LOGV)lgR(r,'だいちのちから：みどり'+T.length+'マス');
  const F=S.flags;if(WD===KUSA&&!F.daichi1){F.daichi1=1;(S.sevQ||(S.sevQ=[])).push('d_F')}else toast(r.name+'が、まわりのみどりで、もちこたえた','warn');
  return true}
function daichiReplant(j){/* かれたマスに植えた（recount から） */if(S.kare&&S.kare[j])delete S.kare[j]}
function daichiMig(s){/* 前のセーブ：フタバの特性「ねばりづよい」を「だいちのちから」に */for(const r of[...(s.res||[]),...(s.buried||[]),...(s.lost||[])])if(r&&r.name===FUTABA&&r.vr&&r.vr.tr==='nebari')r.vr.tr='daichi'}
