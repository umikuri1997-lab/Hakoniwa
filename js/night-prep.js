'use strict';
/* 今夜のそなえ：夕方 NPFROM 時から夜（20時）まで、ポップアップを1日1回出す（持ち主がえらんだ。上の札・知らせはやめた）。会話・ほかのカードのあいだは、まつ。
   出す物：今夜のコワイノのよていの数（20時にきまる前は、いまの人数でかぞえた見こみ。見るだけで、もとにもどす）・おなかがすいたせいれい（赤い札と同じ、おなか100より下）の数・箱の食料。草原だけ・コワイノが来る村だけ。 */
const NPFROM=17,NPHUN=100;
function nightPrepData(){if(!S||WD!==KUSA||S.free||!S.enemyOn||IS_STORY_REPLAY||S.finalNight||S.trial||S.rushOn)return null;const h=hour();if(h<NPFROM||h>=20)return null;
  let w=[];const keep={bossWarn:S.bossWarn,bossOwed:S.bossOwed,lateWave:S.lateWave,bossDay:S.bossDay};try{w=waveFor(dayNo()+1)}finally{Object.assign(S,keep)}/* 見るだけで、もとにもどす */
  const boss=w.some(t=>EN[t]&&EN[t].boss),hungry=S.res.filter(r=>!r.hidden&&r.hunger<NPHUN).length;
  return{n:w.length,boss,hungry,food:Math.floor(S.food||0)}}
function nightPrepPop(D){const o=el('<div id="prepPop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b style="display:block;font-size:15px;margin-bottom:8px">今夜のそなえ</b><div class="rows" style="line-height:1.8"></div><div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button></div></div></div>');
  const row=(k,v,warn)=>{const d=document.createElement('div');d.style.cssText='display:flex;justify-content:space-between;gap:12px'+(warn?';color:#a54152':'');d.innerHTML='<span></span><b></b>';d.children[0].textContent=k;d.children[1].textContent=v;o.querySelector('.rows').appendChild(d)};
  row('今夜の「コワイノ」',D.n?D.n+'ひき'+(D.boss?'（大きな影つき）':''):'来ない見こみ');row('おなかがすいたせいれい',D.hungry+'人',D.hungry>0);row('箱の食料',String(D.food),D.food<=0);
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};document.body.appendChild(o);sfx('tap')}
function nightPrepTick(){const now=performance.now();if(now-(nightPrepTick.t||0)<1000)return;nightPrepTick.t=now;
  if(S&&S.npDay===dayNo())return;const D=nightPrepData();if(!D)return;
  if(!$('#dialog').hidden||DLGQ.length||document.querySelector('.pxcard')||!$('#lvup').hidden||typeof GIFT_ACTIVE!=='undefined'&&GIFT_ACTIVE)return;/* 会話・ほかのカード・場面のあいだは、まつ */
  S.npDay=dayNo();nightPrepPop(D)}
