/* こよみ（メニューの「こよみ」）：今日から CALDAYS 日ぶんを、壁かけのこよみの形のます目で出す。
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
  if(S.storm===d||S.stormNext===d&&S.stormWarn)L.push(['rain','あらしの日']);
  const m=moonOf(d);if(m)L.push([m==='full'?'moonf':'moonn',m==='full'?'満月の夜':'新月の夜']);
  for(const r of S.res){if(r.hidden||r.came==null||r.back)continue;const n=d-r.came;if(ANNIV.includes(n))L.push(['heart',r.name+'が村に来て'+n+'日',r])}
  return L}
/* 見た目は壁かけのこよみ：上にとじ目のリング・上に「1日め〜5日め」・左に季節。1行が1つの季節（5日）で、きょうはその季節の何日めの列から。前・あとのあいた所は空のます。 */
const CALRING='<svg class="calrg" viewBox="0 0 8 14" width="8" height="14" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="0" width="4" height="1"/><rect x="1" y="1" width="1" height="1"/><rect x="6" y="1" width="1" height="1"/><rect x="0" y="2" width="1" height="7"/><rect x="7" y="2" width="1" height="7"/><rect x="2" y="1" width="4" height="1" fill="#fffaf0" opacity=".6"/><rect x="2" y="10" width="4" height="4" fill="#4a3826" opacity=".55"/></svg>';
function calSec(body){const t=dayNo();if(CALSEL<0||CALSEL>=CALDAYS)CALSEL=0;
  const sec=el('<div class="sec calp"><div class="calrs"></div><div class="calg"></div><h3 class="calh"></h3><div class="rows calr"></div></div>'),g=sec.querySelector('.calg');
  sec.querySelector('.calrs').innerHTML=CALRING.repeat(6);
  g.appendChild(el('<span class="calc"></span>'));for(let k=1;k<=SEASONDAYS;k++)g.appendChild(el('<span class="calc calw">'+k+'日め</span>'));
  const first=t-(seasonDay(t)-1),last=t+CALDAYS-1;
  for(let d=first;d<=last||seasonDay(d)!==1;d++){
    if(seasonDay(d)===1||d===first)g.appendChild(el('<span class="calc cals">'+SEASONS[seasonOf(d)]+'</span>'));
    const i=d-t;if(i<0||i>=CALDAYS){g.appendChild(el('<span class="calc cale"></span>'));continue}
    const E=calEvents(d),b=el('<button class="mtile calday"><span class="cdn"></span><span class="cdt"></span><span class="cdi"></span></button>');
    b.querySelector('.cdn').textContent=d;b.querySelector('.cdt').textContent=i===0?'きょう':i===1?'あした':'';
    if(i===0)b.classList.add('today');
    const ic=b.querySelector('.cdi');for(const e of E.slice(0,3))ic.insertAdjacentHTML('beforeend',e[2]?'<img alt="" src="'+spiritPort(e[2].elem,96,e[2].vr)+'">':pxi(e[0]));
    if(i===CALSEL)b.classList.add('on');b.setAttribute('aria-label',(i===0?'きょう':d+'日')+(E.length?'、'+E.map(e=>e[1]).join('、'):''));
    b.onclick=()=>{sfx('tap');CALSEL=i;renderSheet()};g.appendChild(b)}
  const d=t+CALSEL,E=calEvents(d);
  sec.querySelector('.calh').textContent=(CALSEL===0?'きょう':CALSEL===1?'あした':d+'日')+'　'+SEASONS[seasonOf(d)]+'の'+seasonDay(d)+'日め';
  const rw=sec.querySelector('.calr');
  if(!E.length)rw.appendChild(rowEl('とくべつな予定はない',''));
  for(const e of E){const r=rowEl(e[1],'',e[2]?spiritPort(e[2].elem,96,e[2].vr):null);if(!e[2])r.querySelector('b').insertAdjacentHTML('afterbegin',pxi(e[0],'calri'));rw.appendChild(r)}
  body.appendChild(sec)}
