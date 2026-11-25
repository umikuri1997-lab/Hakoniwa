'use strict';
/* 土のステージ：地ゆれ（tsuchi.js のつづき。村のわき役。IDEAS.md の「村のわき役」）
   ・石の大橋がかかったあと（S.flags.tsBridge）、TSQKEVERY 日ごとに地ゆれがある（S.ts.qk.d：その日）。はじめは TSQKFIRST 日あと
   ・前の日（その日の朝から）に、知らせが出る（toast・思い出帳・日記）
   ・その日の TSQKH 時（昼）に、地面がゆれる：「ささえの柱」（tspillar）から TSPILR マスより遠い家の壁のうち、TSQKWALL まいがくずれる（夜にこわされたときと同じ。S.broken に入り、せいれい・守り神が建てなおす）・
     がけのふもとの TSQKROCK か所に、岩が落ちる（柱のそばには落ちない。砂岩をほれる）
   ・tsTick（画面があいているとき）から。たしかめは tools/tests/tsuchi-quake.cjs */
const TSQKEVERY=5/* 地ゆれの間（日） */,TSQKFIRST=3/* 石の大橋のあと、はじめての地ゆれまで（日） */,TSQKH=14/* ゆれる時 */,TSQKEND=18/* この時をすぎたら、その日はなし */,TSQKWALL=4/* 朽ちる壁の数（まい） */,TSQKROCK=3/* 落ちる岩の数 */,TSPILR=6/* 柱がささえる広さ（マス） */,TSQKFAR=28/* 岩が落ちるのは、村のまん中からこの広さまで */;
TSIDS.add('tspillar');
function tsPillars(){const L=[];for(let j=0;j<W*H;j++)if(S.obj[j]==='tspillar')L.push(j);return L}
const tsPilNear=(j,P)=>P.some(p=>Math.hypot(p%W-j%W,((p/W)|0)-((j/W)|0))<=TSPILR);
function tsQuakeWalls(P){/* 柱のとどかない家の壁 */const L=[];for(let j=0;j<W*H;j++){const o=S.obj[j];if(!DECAYW.has(o)||tsPilNear(j,P))continue;L.push(j)}return L}
function tsQuakeRockCells(P){/* がけのふもとの、あいている地面（柱のそば・せいれいのそばをのぞく） */const L=[],hi=j=>S.hi?S.hi[j]|0:0;
  for(let j=W*3;j<W*(H-3);j++){const x=j%W,y=(j/W)|0;if(x<3||x>=W-3||S.ground[j]!==0||S.obj[j]||S.floor[j]||riftJ(j)||!walk(j))continue;if(Math.hypot(x+.5-CX,y+.5-CY)>TSQKFAR)continue;
    if(!(hi(j-W)>hi(j)||hi(j-1)>hi(j)||hi(j+1)>hi(j)))continue;if(tsPilNear(j,P)||S.res.some(r=>Math.hypot(r.x-x-.5,r.y-y-.5)<2))continue;L.push(j)}return L}
const tsPick=(L,n)=>{const A=L.slice(),O=[];while(A.length&&O.length<n)O.push(A.splice((Math.random()*A.length)|0,1)[0]);return O};
function tsQuake(){/* 地面がゆれる：壁が朽ち、岩が落ちる。{w:朽ちた壁の数, r:落ちた岩の数} */const P=tsPillars(),res={w:0,r:0};
  shakeScreen('l');sfx('crack');musicDuck(2000);
  for(const j of tsPick(tsQuakeWalls(P),TSQKWALL)){const o=S.obj[j],hb=HOUSES.find(h=>h.set.has(j));(S.broken||(S.broken=[])).push({j,id:o,L:S.hp['L'+j],rot:rotAt(j)});sfxAt('wbreak',j%W+.5,(j/W)|0);clearObj(j);recount();houseBreakFlee(hb);res.w++;spawnFX(j%W,(j/W)|0,'#c4a07a')}/* 夜にこわされたときと同じ（night.js） */
  later(()=>{if(!tsOn())return;for(const j of tsPick(tsQuakeRockCells(P),TSQKROCK)){if(S.obj[j])continue;S.obj[j]='rock';res.r++;spawnFX(j%W,(j/W)|0,'#c4a07a');sfxAt('dust',j%W,(j/W)|0)}if(res.r){recount();dirty=true}},900);
  const t=res.w?'地ゆれで、壁が'+res.w+'まい、くずれた':'地ゆれがあった';toast(t+'（がけから、岩も落ちた）','warn');memo('rock','地ゆれ。'+t);logEv(t);return res}
/* tsTick から：知らせ・地ゆれ。何かしたら true */
function tsQuakeTick(){if(!S.flags.tsBridge)return false;const d=dayNo(),h=hour();let q=S.ts.qk;if(!q)q=S.ts.qk={d:d+TSQKFIRST,w:0};
  if(d>q.d||d===q.d&&h>=TSQKEND){q.d=d+1;q.w=0;return false}/* すぎてしまった（ねていた・洞窟にいた）：あすに */
  if(d===q.d-1&&q.w!==q.d&&h>=6){q.w=q.d;toast('あしたは、地ゆれがありそう。地面の下から、ごろごろ音がする','warn');memo('rock','あしたは地ゆれがありそう。ささえの柱を立てておこう');return true}
  if(d===q.d&&h>=TSQKH){q.d=d+TSQKEVERY;q.w=0;tsQuake();return true}return false}
