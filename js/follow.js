'use strict';
/* 見守る（FOLLOW）：せいれいの画面の「見守る」で、その子をカメラでゆっくり追う。せいれいの行動はかえない。
   おわるのは：画面をドラッグしたとき（input.js）・下の札をおしたとき・その子が村にいなくなったとき・村を切りかえたとき・
   物語のカメラ（おわりの処理つき・sacred のカメラ・sacredDirection）がはじまったとき・思い出帳の再生をひらいたとき。
   ほかのカメラの動き（話しかけたときの panTo など）のあいだは、まってから、また追う。セーブしない（見る人の画面だけ） */
let FOLLOW=null;
const FOLLOWK=3;/* 追う速さ（1秒あたり。大きいほど、ぴったりつく） */
function followStart(r){if(!S||!r||!S.res.includes(r))return;followEnd();if(sheet)closeSheet();FOLLOW={s:S,sess:VILLAGE_SESSION,id:r.id};
  const b=el('<button class="btn" id="followTag" aria-live="polite">見守り中</button>');b.onclick=()=>{sfx('tap');followEnd()};
  const bot=$('#botUI');if(bot)bot.insertBefore(b,bot.firstChild);else $('#app').appendChild(b)}
function followEnd(){FOLLOW=null;const t=document.getElementById('followTag');if(t)t.remove()}
function followActive(){return !!FOLLOW&&FOLLOW.s===S}
function followTick(rdt){if(!FOLLOW)return;const F=FOLLOW;
  if(S!==F.s||VILLAGE_SESSION!==F.sess||!started)return followEnd();
  const r=S.res.find(q=>q.id===F.id);if(!r)return followEnd();
  if(camAnim&&(camAnim.done||camAnim.sacred)||typeof sacredDirection==='function'&&sacredDirection()||typeof NUSHI_RUN!=='undefined'&&NUSHI_RUN||typeof DEPART_RUN!=='undefined'&&DEPART_RUN)return followEnd();/* 物語のカメラが先 */
  if(camAnim)return;/* 話しかけたときなどのカメラの動きは、おわるのをまつ */
  const tx=r.x*TS,ty=(r.y-.6)*TS-uLift(r),cx=cam.x+VW/cam.z/2,cy=cam.y+VH/cam.z/2,k=1-Math.exp(-Math.min(.25,rdt)*FOLLOWK);
  centerOn(cx+(tx-cx)*k,cy+(ty-cy)*k)}
