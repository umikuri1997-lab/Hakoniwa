/* 村のしごと一覧（メニューの「しごと」）：だれが、いま何をしているか・止まっているわけ・得意な仕事（★）を1つの画面に。こまっている子を上にならべる。行をタップすると、画面をとじて、その子を映す */
const STKKEEP=60;/* 箱へ行けなかった印（r.stk）を、わけとして出す時間（村の時間） */
function workDoing(r){if(r.hidden)return 'いまは村にいない';const a=r.act;if(!a)return '考え中';return a.shade?'すずしい所で休んでいる':ACT_LBL[a.type]||'考え中'}
function workWhy(r){/* [わけ, 2：こまっている・1：ひま・0：ふつう] */
  if(r.hidden)return['',-1];const t=r.act&&r.act.type,eating=t==='eat'||t==='fetch',sleep=t==='sleep';
  if(hostileNow(r))return['こわがっている',2];
  if(r.stk&&S.t-r.stk.t<STKKEEP)return[r.stk.n+'へ行けません',2];
  if(r.hunger<HUNGRYF&&!eating)return['おなかがすいている',2];
  if(r.energy<TIREDF&&!sleep)return['つかれている',2];
  {const T=troubleText(r);if(T)return['こまりごと：'+T,2]}
  if(funLow(r)&&!sleep)return['たのしさが少ない',2];
  if(t==='wander'||t==='idle'||!t)return['することがない',1];
  return['',0]}
function workListSec(body){
  const L=S.res.map(r=>({r,w:workWhy(r)})).sort((a,b)=>b.w[1]-a.w[1]);
  if(!L.length){body.appendChild(nodata('spirit','まだ、せいれいがいません'));return}
  const nT=L.filter(x=>x.w[1]===2).length,nI=L.filter(x=>x.w[1]===1).length;
  body.appendChild(el(`<div class="mtags"><span class="mtag">${pxi('spirit')}こまっている <b>${nT}</b>人</span><span class="mtag">${pxi('clock')}することがない <b>${nI}</b>人</span></div>`));
  const sec=el('<div class="sec"><div class="rows"></div></div>'),rows=sec.querySelector('.rows');
  for(const{r,w}of L){const row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small class="wd" style="display:block"></small><small class="wy" style="display:block"></small><small class="wt" style="display:block"></small></div></button>');
    row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
    row.querySelector('b').textContent=r.name+'  Lv'+rLv(r);row.querySelector('.wd').textContent=workDoing(r);
    const wy=row.querySelector('.wy');if(w[0]){wy.textContent=w[0];if(w[1]===2)wy.style.color='#b0402a'}else wy.remove();
    row.querySelector('.wt').innerHTML='得意：'+tokuiHtml(r);
    row.onclick=()=>{sfx('tap');if(r.hidden||!S.res.includes(r))return toast(r.name+'は、いまは村にいません');closeSheet();panTo(r.x*TS,(r.y-.7)*TS)};rows.appendChild(row)}
  body.appendChild(sec)}
