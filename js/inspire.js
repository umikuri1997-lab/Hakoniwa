/* ひらめきの日（リムワールドのインスピレーションを手本に）：
   朝（morning）に、前の日（朝6時から朝6時まで）たのしさが INSPFUN より下にならなかったせいれいから、INSPP で1人だけ。
   その日（callDay）だけ、属性ごとに1つの仕事が、とくべつにうまくいく（S.insp={id,d}）。
   土：建てる・直すの、はたらく速さ+10・木：収穫+1・水：つりで家具が出る確率5%・火：攻撃力+10・風：落とし物をひろうと+1こ。
   たのしさの前の日のいちばん低い数は fun-why.js の r.fd.min・r.fdP。たしかめは tools/tests/inspire.cjs。 */
const INSPP=.2,INSPFUN=70,INSPWORK=10,INSPHARV=1,INSPFISH=.05,INSPATK=10,INSPDROP=1;
const INSPT={earth:'建てる・直すの、はたらく速さ+10',wood:'収穫+1',water:'つりで家具が出る確率5%',fire:'攻撃力+10',wind:'落とし物をひろうと+1こ'};
const INSPL={earth:'きょうは、からだがかるいよ。',wood:'きょうは、いい日になりそうだよ！',water:'きょうは、いいことがありそうだよ。',fire:'きょうは、力がみなぎってるよ！',wind:'きょうの風は、いい風だよ。'};/* ぼく・だよ で書き、言いかたは chatTone */
function inspOn(r,el){const I=S&&S.insp;return!!(r&&I&&I.id===r.id&&I.d===callDay()&&(!el||r.elem===el))}
function inspWork(r,a){return inspOn(r,'earth')&&a&&(a.type==='build'||a.type==='repair')?INSPWORK/STD:0}
function inspAtk(r){return inspOn(r,'fire')?INSPATK/100:0}
function inspPrevMin(r){const d=callDay()-1;if(r.fd&&r.fd.d===d)return r.fd.min??r.fd.f0;if(r.fdP&&r.fdP.d===d)return r.fdP.min;return null}
function inspMorning(){if(!S||IS_STORY_REPLAY)return;const d=callDay();if(S.insp&&S.insp.d===d)return;
  const L=S.res.filter(r=>!r.hidden&&!r.coffin&&INSPT[r.elem]&&(inspPrevMin(r)??-1)>=INSPFUN);if(!L.length||Math.random()>=INSPP)return;
  const r=pick(L);S.insp={id:r.id,d};r.bubble='✨';if(!r.hidden)addFloatG(r.x,r.y,-1.6,chatTone(INSPL[r.elem],r),'#fff3d6');if(typeof JOYU!=='undefined')JOYU.set(r,performance.now()+2000);
  later(()=>{if(S&&inspOn(r))toast(r.name+'は、きょう、はりきっている','good')},1800);memo('bulb',r.name+'が、はりきっていた')}
function inspTick(){/* はりきっている子は、ひまなとき、ときどき「✨」のふきだし */const I=S&&S.insp;if(!I||I.d!==callDay())return;const r=S.res.find(q=>q.id===I.id);if(!r||r.hidden||r.bubble||r.act&&r.act.type==='sleep')return;if(Math.random()<.04){r.bubble='✨';later(()=>{if(r.bubble==='✨')r.bubble=''},2500)}}
