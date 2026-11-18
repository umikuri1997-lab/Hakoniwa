/* 食べ物の好き・きらい（トモコレのように、あげてみてわかる）
   どの食べ物にも、せいれいごとの好み：3 だいすき（いまの「好きな料理」favDish の1つ）・2 すき・1 ふつう・0 にがて。
   好みは id と食べ物の名前から決まる（しまわない）。わかった すき・にがて（おやつであげて反応を見た物）だけ r.fk にしまう。だいすきがわかるのは prefs.js（r.kn.fd）。 */
const FLIKE=8,FHATE=5;/* すき・にがてになる%（食べ物ごと） */
const FLIKEFUN=3,FHATEFUN=-5;/* すき：たのしさ+3・にがて：たのしさ−5 */
function strH(s){let h=7;for(const c of String(s))h=Math.imul(h,31)+c.charCodeAt(0)|0;return h>>>0}
function foodLike(r,k){if(!r||!FOODS[k])return 1;if(k===favDish(r))return 3;if(FOODS[k].bad)return 1;const u=hash(((r.id||0)*977+strH(k))>>>0)*100;return u<FLIKE?2:u<FLIKE+FHATE?0:1}
const FLNAME=['にがて','ふつう','すき','だいすき'];
/* 食べおわったときの反応（eat の end から。食べた物のいちばん強い好み・いちばん弱い好み） */
function foodReact(r,items,snack){if(!r||!items||!items.length)return;let hi=1,lo=1;for(const k of items){const v=foodLike(r,k);if(v>hi)hi=v;if(v<lo)lo=v}
  if(snack&&!IS_STORY_REPLAY&&S.res.includes(r)){r.fk=r.fk||{};for(const k of items){if(!FOODS[k]||k===favDish(r)||r.fk[k]!=null)continue;const v=foodLike(r,k);r.fk[k]=v;if(v!==1)toast(r.name+'の、'+FLNAME[v]+'な食べ物がわかった','good');dirty=true}}/* おやつであげたときだけ、すき・にがてがわかる */
  if(snack){const T=S.trouble;if(T&&T.k==='want'&&T.id===r.id&&items.includes(T.f))T.ate=1}/* 「〇〇が食べたい」のこまりごと：おやつでその物をあげたら、なおる（troubleTick） */
  const now=performance.now(),still=!(typeof inBattle==='function'&&inBattle(r));
  if(lo===0&&hi<3){r.fun=clamp(r.fun+FHATEFUN,0,100);STRAINU.set(r,now+2200);if(still)RHOLD.set(r,now+2200);r.bubble='💦';addFloat(r.x,r.y-1.6,'にがて…','#c9d6e8');return}/* にがて：しかめた顔で、手をとめる */
  if(hi===2){r.fun=Math.min(100,r.fun+FLIKEFUN);JOYU.set(r,now+1400);r.bubble='😋';addFloat(r.x,r.y-1.6,'おいしい！','#ffd38a');return}
  if(hi===3){JOYU.set(r,now+2600);if(still){RHOLD.set(r,now+2600);JUMP.set(r,now)}fxSpr('hearts',r.x*TS,(r.y-.7)*TS);r.bubble='💕'}}/* だいすき：はねて、よろこぶ（数字は eat の end のまま） */
/* わかった好み（すき・にがて。だいすきは prefs.js の fd） */
function foodKnown(r,v){const K=r.fk||{};return Object.keys(K).filter(k=>FOODS[k]&&K[k]===v&&foodLike(r,k)===v)}
function foodKnownText(r,v){const L=foodKnown(r,v).map(k=>FOODS[k].name);return L.length?[...new Set(L)].join('・'):'？？？'}
/* おやつ：どれをあげるか、えらぶ */
function snackPop(r,done){const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><b class="t" style="font-size:15px;display:block;margin-bottom:8px"></b><div class="rows"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>');
  const close=()=>o.remove();o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};
  o.querySelector('.t').textContent=r.name+'に、なにをあげる？';const g=o.querySelector('.rows'),K=Object.keys(FOODS).filter(k=>(S.fs[k]||0)>0);
  if(!K.length)g.appendChild(el('<p class="note">食べ物が足りません</p>'));
  for(const k of K){const f=FOODS[k],kn=k===favDish(r)?(prefKnown(r,'fd')?3:null):(r.fk&&r.fk[k]!=null?r.fk[k]:null),row=rowEl(f.name+'　×'+S.fs[k],kn==null?'':FLNAME[kn],foodIc(k)),b=el('<button class="btn pri">あげる</button>');row.appendChild(b);
    b.onclick=()=>{if(!((S.fs[k]||0)>0))return;S.fs[k]--;syncFood();endAct(r);r.meal={u:.3*fullN(r),pt:1,e:f.e,items:[k]};startAct(r,null,'eat',-1,{snack:1});sfx('eat');close();if(done)done()};g.appendChild(row)}
  document.body.appendChild(o)}
/* 「〇〇が食べたい」のこまりごとの食べ物：すき・だいすきの物のうち、この村で一度でも持った物（S.seenIt）から */
function wantPick(r){const seen=S.seenIt||{},L=Object.keys(FOODS).filter(k=>seen['f:'+k]&&!FOODS[k].bad&&foodLike(r,k)>=2);return L.length?L[Math.floor(Math.random()*L.length)]:null}
