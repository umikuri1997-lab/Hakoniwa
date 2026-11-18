'use strict';
/* 天気のよほう：天気を2日先まで前もってきめておき（S.wxQ：日→{r 雨・b 虹・s あらし・t その日のできごと}）、朝（morning）はそれを使う。
   画面の上の天気の札をタップすると、きょう・あした・あさっての天気（wxPop）。よほうはかならず当たる。
   きめ方は前と同じ：あらしは5日めより後・前のあらしから STORMGAP 日で STORMP。雨は WXRAIN（あらしの日は雨）。雨のつぎの日は WXBOW で虹（その日は雨にしない）。
   その日のできごとは WXEV（DAYEV から。カミサマの訪問日はのぞく）。できごとが出るのは、その朝に「コワイノ」が来るようになっていて3日めから（前と同じ）。 */
const WXAHEAD=2,WXRAIN=.22,WXBOW=.5,WXEV=.4;
function wxQ(){if(!S.wxQ||typeof S.wxQ!=='object')S.wxQ={};return S.wxQ}
function wxRoll(d){/* 日 d の天気をきめる（前の日がきまっていること） */const Q=wxQ(),p=Q[d-1];
  let last=S.storm!=null?S.storm:-99;for(const k in Q)if(Q[k].s&&+k<d)last=Math.max(last,+k);
  const s=(S.stormNext===d)||(S.stormNext==null||S.stormNext<d)&&d>=6&&d-last>=STORMGAP&&Math.random()<STORMP;
  const prevRain=p?!!p.r:!!S.rain;let r=s||Math.random()<WXRAIN,b=false;
  if(!s&&prevRain&&Math.random()<WXBOW){b=true;r=false}/* 雨のつぎの日は、虹が出ることがある */
  let t=null;if(Math.random()<WXEV){const ks=Object.keys(DAYEV).filter(k=>k!=='kami');t=pick(ks)}
  Q[d]={r:r?1:0,b:b?1:0,s:s?1:0,t};return Q[d]}
function wxFill(d){/* d から2日先まで、まだきめていない日をきめる。すぎた日はけす */const Q=wxQ();for(const k in Q)if(+k<d)delete Q[k];
  if(!Q[d-1]&&d>1)Q[d-1]={r:S.rain?1:0,b:0,s:0,t:null};/* 前の日（いまの天気） */
  for(let k=d;k<=d+WXAHEAD;k++)if(!Q[k])wxRoll(k);
  const n=Q[d+1],nx=n&&n.s?d+1:(S.stormNext===d?d:null);if(nx===d+1&&S.stormNext!==nx)S.stormWarn=0;S.stormNext=nx}/* あらしは、前の日の17時に知らせる（stormTick） */
function wxMorning(){/* morning() の天気：前もってきめた日を使う */const d=dayNo();const Q=wxQ();if(!Q[d])wxFill(d);const e=Q[d];
  const wr=S.rain;if(wr)S.wetD=d;/* 雨のつぎの日：水たまりがのこる（feel.js） */
  S.rain=!!e.r;if(e.s)S.stormNext=d;
  if(e.b&&!IS_STORY_REPLAY){S.rain=false;S.rbDay=d;setTimeout(()=>toast('雨あがりの空に、虹が出ている','good'),900)}
  if(typeof stormMorning==='function')stormMorning();/* あらしの日（S.stormNext===d） */
  wxFill(d);
  return e}
function wxDay(d){/* よほうの1日ぶん：{k:アイコン,n:名前,t:できごと} */const today=d===dayNo();let rain,storm,bow,ev;
  if(today){rain=!!S.rain;storm=typeof stormNow==='function'&&stormNow();bow=rainbowToday();ev=S.today}
  else{const e=wxQ()[d];if(!e)return null;rain=!!e.r;storm=!!e.s;bow=!!e.b;ev=S.enemyOn&&d>=3?e.t:null}
  const snow=rain&&seasonOf(d)===3;
  const w=storm?['rain','あらし','wx-rain']:rain?['rain',snow?'雪':'雨','wx-rain']:bow?['rainbow','虹','wx-bow']:['sun','晴れ','wx-sun'];
  const m=moonOf(d);return{w,ev:ev&&DAYEV[ev]?DAYEV[ev][1]:null,moon:m?MOON[m]:null}}
function wxPop(){if(!S||!started)return;wxFill(dayNo());sfx('open');const P=pxPop('天気のよほう'),d0=dayNo(),N=['きょう','あした','あさって'];
  for(let i=0;i<=WXAHEAD;i++){const D=wxDay(d0+i);if(!D)continue;const row=el('<div class="st" style="display:flex;align-items:center;gap:10px;padding:5px 0"><b style="width:70px"></b><span class="wxw"></span><span class="note" style="margin:0"></span></div>');
    row.querySelector('b').textContent=N[i];row.querySelector('.wxw').innerHTML=pxi(D.w[0],'wx '+D.w[2])+D.w[1]+(D.moon?'・'+pxi(D.moon[0],'wx '+D.moon[2])+D.moon[1]:'');
    row.querySelector('.note').textContent=D.ev||'';P.body.appendChild(row)}}
function wxTapInit(){const t=document.querySelector('.htag.wxtag');if(!t||t._wx)return;t._wx=1;t.style.cursor='pointer';t.addEventListener('click',e=>{e.stopPropagation();wxPop()})}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wxTapInit);else wxTapInit()}
