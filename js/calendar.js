/* こよみ（メニューの「こよみ」）：今日から CALDAYS 日ぶんを、ます目で出す。
   出すのは、もう決まっている予定だけ：オオカゲの夜（bossDayNo、目標の欄と同じ計算）・季節の大会・季節のかわり目・満月と新月・せいれいの記念日・あしたのあらし（知らせが出たあと）。
   夕方にきまる夜の変化（霧・群れなど）と虹は、まだ決まっていないので出さない。日をタップすると、その日の予定を下に出す。 */
const CALDAYS=10;
let CALSEL=0;/* えらんでいる日（今日から何日め） */
function calBossOn(){return !!(S&&S.enemyOn&&!S.cleared&&!S.free&&!S.finalNight)}/* bossTonight と同じ（今夜かどうかをのぞく） */
function calEvents(d){/* その日の予定：[アイコン,文,顔のせいれい] */
  const t=dayNo(),L=[];
  if(calBossOn()){const b=bossDayNo();if(b!=null&&b>0&&b===d)L.push(['sword','オオカゲが来る夜'])}
  if(d>1&&seasonDay(d)===1)L.push(['leaf',SEASONS[seasonOf(d)]+'になる']);
  if(seasonDay(d)===CUPDAY&&!cupFew()&&!(d===t&&evDoneNow(cupOf(d))))L.push(['cup',EVENTS[cupOf(d)].n]);
  if(S.storm===d||S.stormNext===d&&S.stormWarn||d>t&&S.wxQ&&S.wxQ[d]&&S.wxQ[d].s)L.push(['rain','あらしの日']);/* 天気のよほうで、きまっている日（weather.js） */
  const m=moonOf(d);if(m)L.push([m==='full'?'moonf':'moonn',m==='full'?'満月の夜':'新月の夜']);
  for(const r of S.res){if(r.hidden||r.came==null||r.back)continue;const n=d-r.came;if(ANNIV.includes(n))L.push(['heart',r.name+'が村に来て'+n+'日',r])}
  return L}
function calSec(body){const t=dayNo();if(CALSEL<0||CALSEL>=CALDAYS)CALSEL=0;
  const sec=el('<div class="sec"><div class="calg"></div><h3 class="calh"></h3><div class="rows calr"></div></div>'),g=sec.querySelector('.calg');
  for(let i=0;i<CALDAYS;i++){const d=t+i,E=calEvents(d),b=el('<button class="mtile calday"><span class="cdn"></span><span class="cds"></span><span class="cdi"></span></button>');
    b.querySelector('.cdn').textContent=i===0?'きょう':i===1?'あした':d+'日';b.querySelector('.cds').textContent=SEASONS[seasonOf(d)]+seasonDay(d);
    const ic=b.querySelector('.cdi');for(const e of E.slice(0,3))ic.insertAdjacentHTML('beforeend',e[2]?'<img alt="" src="'+spiritPort(e[2].elem,96,e[2].vr)+'">':pxi(e[0]));
    if(i===CALSEL)b.classList.add('on');b.setAttribute('aria-label',(i===0?'きょう':d+'日')+(E.length?'、'+E.map(e=>e[1]).join('、'):''));
    b.onclick=()=>{sfx('tap');CALSEL=i;renderSheet()};g.appendChild(b)}
  const d=t+CALSEL,E=calEvents(d);
  sec.querySelector('.calh').textContent=(CALSEL===0?'きょう':CALSEL===1?'あした':d+'日')+'　'+SEASONS[seasonOf(d)]+'の'+seasonDay(d)+'日め';
  const rw=sec.querySelector('.calr');
  if(!E.length)rw.appendChild(rowEl('とくべつな予定はない',''));
  for(const e of E){const r=rowEl(e[1],'',e[2]?spiritPort(e[2].elem,96,e[2].vr):null);if(!e[2])r.querySelector('b').insertAdjacentHTML('afterbegin',pxi(e[0],'calri'));rw.appendChild(r)}
  body.appendChild(sec)}
