'use strict';
/* 今夜のそなえ：夕方 NPFROM 時から夜（20時）まで、目標の欄の下に小さな札を出す。さわると、くわしい一覧（知らせ）。
   出す物：今夜のコワイノのよていの数（20時にきまる前は、いまの人数でかぞえた見こみ。見るだけで、もとにもどす）・おなかがすいたせいれい（赤い札と同じ、おなか100より下）の数・箱の食料。草原だけ・コワイノが来る村だけ。 */
const NPFROM=17,NPHUN=100;
function nightPrepData(){if(!S||WD!==KUSA||S.free||!S.enemyOn||IS_STORY_REPLAY||S.finalNight||S.trial||S.rushOn)return null;const h=hour();if(h<NPFROM||h>=20)return null;
  let w=[];const keep={bossWarn:S.bossWarn,bossOwed:S.bossOwed,lateWave:S.lateWave,bossDay:S.bossDay};try{w=waveFor(dayNo()+1)}finally{Object.assign(S,keep)}/* 見るだけで、もとにもどす */
  const boss=w.some(t=>EN[t]&&EN[t].boss),hungry=S.res.filter(r=>!r.hidden&&r.hunger<NPHUN).length;
  return{n:w.length,boss,hungry,food:Math.floor(S.food||0)}}
function nightPrepText(D){return '今夜のそなえ：コワイノ'+(D.n?D.n+'ひき'+(D.boss?'（大きな影つき）':''):'なし')+'・おなかすいた'+D.hungry+'人・食料'+D.food}
function nightPrepTick(){const now=performance.now();if(now-(nightPrepTick.t||0)<1000)return;nightPrepTick.t=now;
  let b=document.getElementById('prepBadge');if(!b){const top=document.getElementById('topUI');if(!top)return;b=document.createElement('button');b.id='prepBadge';b.hidden=true;b.addEventListener('click',e=>{e.stopPropagation();const D=nightPrepData();if(!D)return;sfx('tap');toast('今夜の「コワイノ」：'+(D.n?D.n+'ひき'+(D.boss?'（大きな影つき）':''):'来ない見こみ')+'（20時にきまる）　おなかがすいたせいれい：'+D.hungry+'人　箱の食料：'+D.food,D.hungry||D.food<=0?'warn':'')});top.appendChild(b)}
  const D=nightPrepData();if(!D){b.hidden=true;return}b.hidden=false;const t=nightPrepText(D);if(b.textContent!==t)b.textContent=t;b.classList.toggle('warn',D.hungry>0||D.food<=0)}
