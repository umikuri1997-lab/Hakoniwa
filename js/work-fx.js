/* 料理・もの作りの手ざわり：進みぐあいで動きをかえる・手に持つ物・動きに合わせた音と粒・できたらかかげる。
   動きの絵は spirit3d（cookprep・cookcut・cookmix・cook・cookfry・cookfan・cookgrill・cookplate・raise・craftprep・saw・craft・polish）。
   音と粒は、描くときの時刻（drawSpiritDot の t）と同じ時刻で、動きの決まった所（WBEAT）をこえたときに出す（手の動きとずれない）。 */
const WORKSHOW=4;
const WBWORKZ=36;/* 作業台の天板の高さ（wbwork の絵は天板の上に置く形。地面に置くときは、このぶん下げる） *//* できたらかかげる時間（せいれいの時間。1倍で約1.6秒） */
/* 料理の作り方（かまど・たき火）。調理台の料理は、ぜんぶ「まぜる」 */
const KSTYLE={soup:'pot',fishsoup:'pot',pancake:'pan',yakizakana:'pan',kabayaki:'pan',bread:'bake',yakiimo:'bake',foil:'bake',kushiyaki:'grill'};
const KMAIN={pot:'cook',pan:'cookfry',bake:'cookfan',grill:'cookgrill',mix:'cookmix'};
/* 動きの名前 → [音を出す所（1回の動きの中の0〜1）, 音, 粒] */
const WBEAT={cookcut:[[0,'tonton']],cook:[[0,'potclk']],cookmix:[[.25,'tink']],cookfry:[[.47,'fry'],[.62,'fry']],cookfan:[[.25,'fanw','embers']],cookgrill:[[0,'grill','embers']],cookplate:[[.5,'plate']],
  saw:[[.25,'saw','chips'],[.75,'saw']],craft:[[0,'nail','chips']],polish:[[0,'cloth'],[.5,'cloth']]};
function cookStyle(r){const a=r.act;if(!a||!r.cing)return'mix';if(a.tb)return'mix';return KSTYLE[r.cing.rec]||'pot'}
function cookP(r){const a=r.act;if(!a||a.obj==null)return 0;return Math.min(1,(a.t||0)/Math.max(1,cookTime(r,a.obj)))}
function craftOrder(r){return r.act&&r.act.type==='craft'?S.orders.find(q=>q.id===r.act.order):null}
function craftP(r){const o=craftOrder(r);return o?Math.min(1,o.prog/Math.max(1,o.need)):0}
/* いまの動き（料理・もの作りでないときは、行動の名前のまま） */
function workAnim(r){const a=r.act;if(!a)return'';
  if(a.type==='cook'){if(a.sh!=null)return'raise';const p=cookP(r),st=cookStyle(r);if(p<.12)return'cookprep';if(a.tb&&p<.45)return'cookcut';return p<.88?KMAIN[st]:'cookplate'}
  if(a.type==='craft'){if(a.sh!=null)return'raise';const p=craftP(r);return p<.1?'craftprep':p<.45?'saw':p<.85?'craft':'polish'}
  return a.type}
/* 手に持つ物の絵（材料・できた料理・作った物） */
function workFood(r){const a=r.act;if(!a||a.stage!=='do')return'';
  if(a.type==='cook'&&r.cing){const nm=workAnim(r),R=RECIPES.find(x=>x.out===r.cing.rec);if(nm==='cookprep')return R?foodEmo(Object.keys(R.need)[0]):'';if(nm==='cookplate'||nm==='raise'||nm==='cookfry')return FOODS[r.cing.rec]?FOODS[r.cing.rec].e:'';return''}
  if(a.type==='craft'&&a.sh!=null){const o=craftOrder(r)||a.made;return o?itemIc(o.type||o):''}
  return''}
/* 作業台の上の形（0 板の山・1 木のわく・2 布をかけた形）。素材がそろうまでは、なし（運んだ素材の山） */
function wbworkStage(o){if(!o||hasNeed(o))return -1;const p=o.prog/Math.max(1,o.need);return p<.45?0:p<.85?1:2}
/* 音と粒：描くたびに、動きの決まった所をこえたら出す */
const WBEATP=new WeakMap();
function workBeat(r,nm,t){const B=WBEAT[nm],m=typeof SPM!=='undefined'&&SPM[nm];if(!B||!m||typeof m.r!=='number')return;const ph=((t*m.r)%1+1)%1,last=WBEATP.get(r);WBEATP.set(r,{nm,ph});if(!last||last.nm!==nm)return;
  for(const[b,snd,fx]of B){const crossed=last.ph<=ph?(last.ph<b&&b<=ph):(b>last.ph||b<=ph);if(!crossed)continue;sfxAt(snd,r.x,r.y);if(fx&&Math.random()<.5){const j=r.act&&r.act.type==='craft'?((craftOrder(r)||{}).cs??null):r.act&&r.act.obj!=null?r.act.obj:null,x=j!=null?(j%W+.5)*TS:r.x*TS+(r.face<0?-14:14),y=j!=null?((j/W|0)+.4)*TS:r.y*TS;fxSpr(fx,x,y)}}}
/* できあがり：1回だけ、ぽん・きらきら */
function workShowStart(r,a){a.sh=0;r.bubble='';/* 頭の上の物とかさならないように */sfxAt('workdone',r.x,r.y);fxSpr('twinkle',r.x*TS,(r.y-.9)*TS)}
