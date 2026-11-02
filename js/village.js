'use strict';
const cnt=id=>counts[id]||0;
const FOODS={mugi:{name:'こむぎ',v:1,e:'🌾'},imo:{name:'いも',v:1,e:'🥔'},tomato:{name:'キャベツ',v:1,e:'🥬'},berry:{name:'ベリー',v:1,e:'🫐',fx:'たのしさ+8'},apple:{name:'りんご',v:1,e:'🍎',fx:'たのしさ+8'},fish:{name:'さかな',v:1,e:'🐟'},takenoko:{name:'たけのこ',v:1,e:'🎍'},
  bread:{name:'パン',v:2,pt:3,pw:1.35,dish:1,e:'🍞',fx:'おなかのへる速さ×0.6'},soup:{name:'キャベツスープ',v:2,pt:3,pw:1.35,dish:1,e:'🍲',fx:'つかれ−25'},yakiimo:{name:'ベイクドポテト',v:1,pt:2,pw:.9,dish:1,e:'🍠',fx:'3時間、作業スピード×1.15'},yakizakana:{name:'焼き魚',v:1,pt:4,pw:1.8,dish:1,e:'🐠',fx:''},yakiberry:{name:'焼きベリー',v:2,pt:2,pw:.9,dish:1,e:'🍮',fx:'たのしさ+15'},yakiapple:{name:'焼きりんご',v:1,pt:2,pw:.9,dish:1,e:'🥧',fx:'3時間、移動速度×1.15'},salad:{name:'コールスローサラダ',v:2,pt:2,pw:.9,dish:1,e:'🥗',fx:'つかれ−10・たのしさ+10'},
  yakisoba:{name:'焼きそば',v:2,pt:3,pw:1.35,dish:1,fest:1,e:'🍝',fx:'つかれ−20・たのしさ+10'},takoyaki:{name:'たこ焼き',v:2,pt:3,pw:1.35,dish:1,fest:1,e:'🐙',fx:'たのしさ+25'},ringoame:{name:'りんごあめ',v:1,pt:2,pw:.9,dish:1,fest:1,e:'🍭',fx:'たのしさ+20'},kakigori:{name:'かき氷',v:1,pt:2,pw:.9,dish:1,fest:1,e:'🍧',fx:'つかれ−15・たのしさ+10'},wataame:{name:'わたあめ',v:1,pt:2,pw:.9,dish:1,fest:1,e:'🍬',fx:'たのしさ+25'}};/* fest：おまつりの日だけ、お店で交換できる（料理では作れない） */

const RAWFL={mugi:'ぷっくり実ったこむぎ。',imo:'ころんとしたおいも。',tomato:'みずみずしいキャベツ。',berry:'あまずっぱいベリー。',apple:'まっかなりんご。',fish:'とれたてのさかな。'};
const RAWD=k=>{const f=FOODS[k];return (RAWFL[k]||f.name+'。')+'/効果:お腹'+f.v+(f.pw?'、パワー+'+f.pw:'')+(f.fx?'、'+f.fx.replace(/、/g,''):'')};/* 料理していない食べ物の説明（料理の説明と同じ形） */
const DISHFL={yakisoba:'ソースのにおいの焼きそば。',takoyaki:'まるくてあつあつのたこ焼き。',ringoame:'つやつやのりんごあめ。',kakigori:'しゃりしゃりのかき氷。',wataame:'ふわふわのわたあめ。',yakiimo:'ほくほくのおいも。',bread:'こんがり焼けたパン。',soup:'からだがあたたまるスープ。',yakizakana:'こうばしい焼き魚。',yakiberry:'あまずっぱい焼きベリー。',yakiapple:'とろっと甘い焼きりんご。',salad:'しゃきしゃきのコールスローサラダ。'};
const needTxt=R=>Object.keys(R.need).map(k=>FOODS[k].name+(R.need[k]>1?'×'+R.need[k]:'')).join('・');/* 材料は1つなら数をつけない */
const DISHD=R=>{const F=FOODS[R.out];return (DISHFL[R.out]||F.name+'。')+'/材料:'+needTxt(R)+'/時間:'+R.time+'分/効果:お腹'+F.v+'、パワー+'+F.pw+(F.fx?'、'+F.fx.replace(/、/g,''):'')};/* ハテナに出す料理の説明 */
const DISHES=['bread','soup','yakiimo','yakizakana'],favDish=r=>{const ds=WD===0?DISHES.filter(d=>d!=='soup'):DISHES;return ds[[...r.name].reduce((a,c)=>a+c.charCodeAt(0),0)%ds.length]};/* すきな料理は名前できまる */
function imoSeedQuestPlots(){if(!S.imoSeedQuestPlots){S.imoSeedQuestPlots=[];for(let j=0;j<S.obj.length;j++){const d=S.dyn[j];if(S.obj[j]==='farm'&&d&&d.crop==='imo'&&(d.paid||d.sown===true))S.imoSeedQuestPlots.push(j)}}return S.imoSeedQuestPlots}
const farmsBare=()=>{let n=0;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].crop===null)n++;return n};/* たねをえらんでいない畑の数 */
const cropK=d=>d.crop===undefined?'mugi':d.crop;/* 作物。null はまだえらんでいない（前からの畑はこむぎ） */
const cropOn=k=>!!S.crops[k];/* 使える作物 */
const CROPS={mugi:{name:'こむぎ',days:2,yield:1,desc:'2日で育つ。食料+1。パンの材料'},tomato:{name:'キャベツ',days:2,yield:1,desc:'2日で育つ。食料+1'},imo:{name:'いも',days:3,yield:2,desc:'3日で育つ。食料+2'}};
/* たねは、おそなえ箱からえらんで畑にまく */
const ALLRECIPES=[{out:'soup',need:{tomato:1,imo:1},time:153,timeR:107.1},{out:'bread',need:{mugi:2},time:120,timeR:84},{out:'yakizakana',need:{fish:1},time:60,timeR:42},{out:'yakiimo',need:{imo:1},time:50,timeR:35},{out:'yakiberry',need:{berry:2},time:60,timeR:42},{out:'yakiapple',need:{apple:1},time:60,timeR:42},{out:'salad',need:{tomato:2},time:90,timeR:63}];/* time：料理にかかる時間（分）。timeR：料理がとくいな子の時間 */
const repairTime=a=>a.re?30:20;/* 修理にかかる時間（分）：建て直しは30、ふつうの修理は20（ゲームの処理と、ゲージの表示で同じものを使う） */
function cookTime(r,ov){const R=RECIPES.find(x=>x.out===(r.cing&&r.cing.rec))||{time:30,timeR:21};return (trt(r,'ryouri')?R.timeR:R.time)*ovenMul(ov)/(ov!=null?1+.1*spotN(ov,'kitchen','pan'):1)}/* キッチン：料理の速さ+10% *//* 料理にかかる時間（ゲームの処理と、ゲージの表示で同じものを使う） *//* 料理でふくれるおなか（v）は、FOODS に実数で書く（使った材料の合計と同じ） */let RECIPES=ALLRECIPES;soupFilter();/* time：料理にかかる時間（レシピごと） */
function syncFood(){let n=0;for(const k in S.fs)n+=S.fs[k]||0;S.food=n}
function addFood(k,n){S.fs[k]=(S.fs[k]||0)+n;syncFood()}
function takeFood(n,pref){let got=[];const keys=Object.keys(S.fs).filter(k=>S.fs[k]>0);if(pref==='raw')keys.sort((a,b)=>(FOODS[a].v-FOODS[b].v));else keys.sort((a,b)=>FOODS[b].v-FOODS[a].v||Math.random()-.5);
  for(const k of keys){while(n>0&&S.fs[k]>0){S.fs[k]--;n--;got.push(k)}if(n<=0)break}syncFood();return got}
const carryN=r=>!r.carry?0:typeof r.carry==='number'?r.carry:Object.values(r.carry).reduce((a,b)=>a+b,0);
const capOf=r=>rStat(r,rLv(r)).cap,matN=r=>r.cmat?Object.values(r.cmat).reduce((a,b)=>a+b,0):0,heldN=r=>carryN(r)+matN(r),roomN=r=>r.coffin?0:Math.max(0,capOf(r)-heldN(r));// 持てる数はレベルと同じ（Lv1は1こ）
function addCarry(r,k,n){if(typeof r.carry==='number')r.carry={mugi:r.carry};n=Math.min(n,roomN(r));if(n<=0)return;r.carry=r.carry||{};r.carry[k]=(r.carry[k]||0)+n;r.carryLast=k}/* アイコンは、最後に持ったもの */
function addMat(r,k,n){n=Math.min(n,roomN(r));if(n<=0)return;r.cmat=r.cmat||{};r.cmat[k]=(r.cmat[k]||0)+n}
function hYield(j,def){const o=S.obj[j],d=S.dyn[j];const cr=o==='farm'?CROPS[(d&&d.crop)||'mugi']:null;return (cr?cr.yield:def)+(NEARMILL.has(j)?1:0)+(NEARFLOWER.has(j)?1:0)}
// STORAGE: placed shelves share the village stock; wall attachments count only on standing walls.
const STORAGE={stor:{food:30},mbox:{mat:50},taru:{food:30},kabebukuro:{food:20},asabukuro:{mat:30},makidana:{mat:30},crate:{food:30,mat:30},shelf1:{mat:50},shelf2:{mat:50},wshelf:{mat:50},cabinet:{food:30}};/* しまえる数（食料・素材） */
function storageAt(j,type){const id=S.obj[anc(j)],wall=HOME_WALLS.has(id)&&(S.win||{})[j],b=STORAGE[wall]||STORAGE[id];return !!(b&&b[type])}
function storeAdj(j,type){/* マス j のとなりに、しまえる箱があるか（かべかけの物は、壁の正面＝すぐ下のマスからだけ） */return adjOf(j,k=>storageAt(k,type)&&(!(HOME_WALLS.has(S.obj[anc(k)])&&(S.win||{})[k])||k===j-W))}
function storageCapacity(type){let n=0,add=0;{const got=new Set();for(const I of SPOTI||[])if(I.sp.cap&&I.sp.cap[type]&&!got.has(I.sp.k)){got.add(I.sp.k);add+=I.sp.cap[type]}}/* しまうスポット：おなじスポットは1こ分、ちがうスポットはたし算 */for(const id in STORAGE){const c=STORAGE[id][type];if(c)n+=cnt(id)*c}for(const j in S.win||{}){const c=(STORAGE[S.win[j]]||{})[type];if(HOME_WALLS.has(S.obj[j])&&c)n+=c}return Math.floor(n*(1+add))}
const foodCap=()=>storageCapacity('food'),matCap=()=>storageCapacity('mat'),matTot=()=>Object.keys(MATN).reduce((a,k)=>a+(S.mat[k]||0),0);
let OTAKI_SEL={};/* そうこで、おたきあげにえらんでいる数 */
const MATTRADE={shina:5,kasa:5,kuru:5,chiri:5,funba:5,wood:3,stone:3,bamboo:3,eda:3,kinoko:2,can:2};/* おたきあげ：素材をパワー1にかえるのに要る数（よく手に入る物ほど多い） */
const MATN={wood:'木材',stone:'石材',bamboo:'竹',shina:'しなやかな草',kasa:'かさかさ草',kuru:'くるくる草',chiri:'ちりちり草',funba:'ふんばり草',eda:'枝',kinoko:'きのこ',can:'空き缶'},WEEDS=new Set(['weed0g','weed0k','weed1g','weed1k','weedc','kinoko']),bambooOn=()=>WD===1||(S.mat.bamboo||0)>0;/* 竹は火山の素材。ほかのステージでは、持っているときだけ出す */const matTxt=m=>Object.keys(m||{}).map(k=>MATN[k]+m[k]).join('・');/* 素材は文字ではなくアイコンで */const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);const matHTML=m=>Object.keys(m||{}).map(k=>'<span class="mic"><img src="'+(ICONS[k]||'')+'" alt="'+MATN[k]+'">'+m[k]+'</span>').join('');const matOK=m=>Object.keys(m||{}).every(k=>(S.mat[k]||0)>=m[k]);const matNeedHTML=m=>Object.keys(m||{}).map(k=>{const h=S.mat[k]||0,ok=h>=m[k];return '<span class="mneed" style="margin-right:6px;'+(ok?'':'color:#c0392b;font-weight:700')+'">'+MATN[k]+'（'+h+'/'+m[k]+'）</span>'}).join('');/* 依頼ボードの作るリスト：素材が足りるか（持っている数/いる数） */
const watchQ=()=>!!(S.qTalked&&QUESTS[S.quest]&&QUESTS[S.quest].id==='watch1'&&!cnt('watch')&&!S.obj.some((o,j)=>o==='site'&&S.dyn[j]&&S.dyn[j].build==='watch'));
const QB=new Set(['lumber','quarry','stele','fountain','lighthouse','windmill']),/* クエストでおぼえるまで建てられない建物（村レベルだけでは、使えない） */lvOK=id=>BL[id].kind==='furn'||(QB.has(id)?(!!(S.recipes||{})[id]||cnt(id)>0):id==='yogan'?(WD===1&&!!S.flags.yoganLearned):id==='watch'?(!!S.flags.watchLearned||watchQ()):id==='arrow'?(!!S.flags.watchLearned||watchQ()||cnt('watch')>0):S.lv>=(BL[id].lv||1)&&(BL[id].w||0)<=WD)||!!S.flags['lv_'+id]||grec(id);/* w：このステージから（それより前のステージでは、おぼえていないと作れない） */
const breakable=o=>o==='fence'||o==='wall'||o==='hwall'||o==='door'||o==='yozoradoor'||o==='gate'||o==='sdoor'||!!(o&&BL[o]&&BL[o].brk);

function godFix(j){/* 守り神の修理：タップして、パワーと素材を使ってすぐ直す（せいれいが直すとただ） */const o=S.obj[j],b=o?null:brokenCover(j),id=b?b.id:o,c=id&&BL[id]&&BL[id].fix;if(!c)return false;if(o==='tower'&&(S.shards||0)>(S.setSh||0))return false;/* かけらをはめるのが先 */
  if(!b&&!(breakable(o)&&(S.hp[j]??BL[o].hp)<BL[o].hp||DEFS.has(o)&&S.hp[j]!=null))return false;
  const m=BL[id].fixm||{};askYesNo(BL[id].name,(b?'建てなおす':'直す')+'？（'+SP(c)+'・'+matTxt(m)+'）',()=>{if(isNight())return toast('夜のあいだは、直せません');if(S.pt<c)return toast('パワーが足りません');if(!matOK(m))return toast('素材が足りません');
    if(b){const a={re:b.id,obj:b.j};if(!repairFree(a)||fp(b.id,b.j%W,(b.j/W)|0,b.rot||0).some(([x,y])=>S.obj[y*W+x]))return toast('じゃまな物があって、建てなおせません');S.obj[b.j]=b.id;setRot(b.j,b.rot);setParts(b.id,b.j,'part');delete S.hp[b.j];if(BL[b.id].dyn)S.dyn[b.j]={g:0};if(b.L)S.hp['L'+b.j]=b.L;S.broken=S.broken.filter(q=>q.j!==b.j);recount();burst(b.j,'block')}
    else{if(S.obj[j]!==o)return;if(DEFS.has(o))delete S.hp[j];else S.hp[j]=BL[o].hp}
    S.pt-=c;for(const k in m)S.mat[k]-=m[k];dirty=true;sfx('repair');toast(BL[id].name+'を直した','good')},()=>{});return true}
/* 防衛設備：「コワイノ」はまずこれをこわしにくる */
const DEFS=new Set(['watch','yogan','spike','puddle','sticky','firetrap','gust']),DEFHP={watch:30,yogan:30,spike:5},defHp=o=>DEFHP[o]||4;
let DEFC={t:0,l:[]};function defList(){const now=performance.now();if(now-DEFC.t>1000){DEFC.l=[];for(let j=0;j<W*H;j++)if(DEFS.has(S.obj[j]))DEFC.l.push(j);DEFC.t=now}return DEFC.l}
const brokenAt=q=>(S.broken||[]).find(b=>b.j===q);
const brokenRot=q=>{const b=brokenAt(q);return b&&b.rot||0},setRot=(j,v)=>{if(v)(S.rot||(S.rot={}))[j]=v;else if(S.rot)delete S.rot[j]};/* こわれた物の向き：建てなおすときに、もとの向きにもどす */
const repairFree=a=>fp(a.re,a.obj%W,(a.obj/W)|0,brokenRot(a.obj)).every(([cx,cy])=>{const k=cy*W+cx;return !S.obj[k]&&!S.res.some(q=>(q.y|0)*W+(q.x|0)===k)&&!S.enemies.some(e=>e.spawned&&!e.dead&&(e.y|0)*W+(e.x|0)===k)});
const brokenCover=q=>(S.broken||[]).find(b=>!S.obj[b.j]&&fp(b.id,b.j%W,(b.j/W)|0,b.rot||0).some(([x,y])=>y*W+x===q));/* 大きい物は、4マスのどこでも、こわれたあとの場所として扱う */
const canRebuild=q=>{const b=brokenAt(q);if(!b||!free('o'+q,1))return false;return fp(b.id,q%W,(q/W)|0,b.rot||0).every(([x,y])=>{const k=y*W+x;return !S.obj[k]&&!S.res.some(r=>(r.y|0)*W+(r.x|0)===k)&&!S.enemies.some(e=>e.spawned&&(e.y|0)*W+(e.x|0)===k)})};
const BAN=new Map(),free=(k,cap)=>(resv.get(k)||0)<cap&&!(BAN.get(k)>(S?S.t:0));/* 行きつけない目的地は、しばらく選ばない */
const reserve=k=>resv.set(k,(resv.get(k)||0)+1);
const release=k=>{const v=(resv.get(k)||0)-1;if(v<=0)resv.delete(k);else resv.set(k,v)};
function nearLotus(r){const x0=r.x|0,y0=r.y|0;for(let y=y0-2;y<=y0+2;y++)for(let x=x0-2;x<=x0+2;x++){if(x<0||y<0||x>=W||y>=H)continue;if(S.obj[y*W+x]==='lotus')return true}return false}
const SEATS=['chair','stool','achair','bench','takebench','pouf','sofa1'],BENCHES=new Set(['bench','takebench']);/* BENCHES：休けい（rest）ができるベンチ */function fSpot(j){const t=typeAt(j);return !!t&&SEATS.includes(t)&&spotW(j)>=0}/* 水のすぐとなり（上下左右）の椅子＝釣りスポット（椅子にすわって釣る） */
/* スポット：組み合わせて置くと、効果が少し上がる（物どうしがまわり3マス以内）。main のまわりに need がそろうとできる */
const SPOTS=[
  {k:'dining',n:'ダイニング',main:o=>o==='table',need:[[o=>SEATS.includes(o),2]],how:'食卓と、いす2つ',eff:'ここで食べたときのパワー+10%'},
  {k:'tsuriba',n:'つり場',main:(o,j)=>SEATS.includes(o)&&spotW(j)>=0,need:[],how:'水べのいす',eff:'魚がつれる確率+25%'},/* 水べのいすは、それだけでスポット（魚+25% は fSpot でつりのときに入る） */
  {k:'fishspot',n:'つりスポット',main:(o,j)=>SEATS.includes(o)&&spotW(j)>=0,need:[[o=>o==='parasol',1]],how:'水べのいすと、パラソル',eff:'魚がつれる確率+5%'},
  {k:'park',n:'ちかばの公園',main:o=>o==='swing',need:[[o=>o==='sandbox',1]],how:'ブランコと、砂場',eff:'ここで遊ぶと、たのしさ+10%'},
  {k:'park2',n:'たのしい公園',main:o=>o==='swing',need:[[o=>o==='sandbox',1],[o=>o==='seesaw',1]],how:'ブランコと、砂場と、シーソー',eff:'ここで遊ぶと、たのしさ+10%'},
  {k:'kitchen',n:'キッチン',main:o=>o==='oven',need:[[o=>o==='sink',1],[o=>o==='tub',1]],how:'かまどと、流し台と、水おけ',eff:'料理の速さ+10%'},
  {k:'yasumi',n:'やすみば',main:o=>BENCHES.has(o),need:[[o=>o==='parasol',1]],how:'ベンチと、パラソル',eff:'ベンチで休むと、つかれのとれ方+10%'},
  {k:'camp',n:'キャンプ場',main:o=>o==='campfire',need:[[o=>BENCHES.has(o),2]],how:'たき火と、ベンチ2つ',eff:'たき火で遊ぶと、たのしさ+10%'},
  {k:'funsui',n:'ふんすいひろば',main:o=>o==='fountain',need:[[o=>BENCHES.has(o),1],[(o,q)=>FLOWERS.has(o)&&!isBud(q),2]],how:'噴水と、ベンチと、花2つ',eff:'噴水で遊ぶと、たのしさ+10%'},
  {k:'monoheya',n:'ものおき部屋',room:1,main:o=>o==='mbox',need:[[o=>o==='asabukuro',1],[o=>o==='makidana',1]],how:'家の中に、素材箱と、あさぶくろと、まき棚',eff:'素材をしまえる数+15%',cap:{mat:.15}},
  {k:'chozo',n:'ちょぞう部屋',room:1,main:o=>o==='stor',need:[[o=>o==='taru',2]],how:'家の中に、食料箱と、たる2つ',eff:'食料をしまえる数+15%',cap:{food:.15}},
  {k:'naya',n:'なや',room:1,main:o=>o==='crate',need:[[o=>o==='taru',1],[o=>o==='asabukuro',1],[o=>o==='kabedougu',1]],how:'家の中に、木箱と、たると、あさぶくろと、どうぐたて',eff:'食料と素材をしまえる数+10%',cap:{food:.1,mat:.1}},
  {k:'shinshitsu',n:'しんしつ',room:1,main:o=>BEDSET.has(o),need:[[o=>o==='shelf1'||o==='shelf2',1]],how:'家の中に、ベッドと、本棚かかざり棚',eff:'眠るときの、つかれのとれ方+10%'},
  {k:'ofuro',n:'おふろば',room:1,main:o=>o==='bathtub',need:[[o=>o==='tub',1]],how:'家の中に、バスタブと、水おけ',eff:'おふろのたのしさ+10%'},
  {k:'hana',n:'花のベンチ',main:o=>BENCHES.has(o),need:[[(o,q)=>FLOWERS.has(o)&&!isBud(q),3]],how:'ベンチと、花3つ',eff:'ベンチで休むと、たのしさ+10%'},
  {k:'wa',n:'和の庭',main:o=>BENCHES.has(o),need:[[o=>o==='shishiodoshi',1],[o=>o==='toro',1]],how:'ベンチと、ししおどしと、石どうろう',eff:'ベンチで休むと、つかれのとれ方+10%'},
  {k:'chaya',n:'茶屋',main:o=>o==='takebench',need:[[o=>o==='noren',1],[o=>o==='takeakari',1]],how:'竹のベンチと、のれんと、竹あかり',eff:'ベンチで休むと、たのしさ+10%'},
  {k:'monooki',n:'ものおき',main:o=>o==='mbox',need:[[o=>o==='crate',1]],how:'素材箱と、木箱',eff:'素材をしまう速さ+10%'},
  {k:'buranko',n:'ぶらんこの庭',main:o=>o==='swing',need:[[o=>BENCHES.has(o),1],[(o,q)=>FLOWERS.has(o)&&!isBud(q),2]],how:'ブランコと、ベンチと、花2つ',eff:'ブランコで遊ぶと、たのしさ+10%'},
  {k:'doronko',n:'どろんこひろば',main:o=>o==='sandbox',need:[[o=>o==='tub',1]],how:'砂場と、水おけ',eff:'砂場で遊ぶと、たのしさ+10%'},
  {k:'mori',n:'もりのゆうぐ',main:o=>o==='swing',need:[[(o,q)=>(o==='tree'||o==='fruit')&&!isBud(q)||o==='ntree',2]],how:'ブランコと、木か果物の木2本',eff:'ブランコで遊ぶと、たのしさ+10%'},
  {k:'shokuryo',n:'食料庫',main:o=>o==='stor',need:[[o=>o==='crate',1]],how:'食料箱と、木箱',eff:'食料をしまう速さ+10%'},
  {k:'pan',n:'パンやさん',main:o=>o==='oven',need:[[o=>o==='stor',1],[o=>o==='stable',1]],how:'かまどと、食料箱と、まるいサイドテーブル',eff:'料理の速さ+10%'},
  {k:'party',n:'ガーデンパーティー',main:o=>o==='table',need:[[o=>SEATS.includes(o),1],[o=>o==='parasol',1]],how:'食卓と、いすと、パラソル',eff:'ここで食べたときのパワー+10%'},
  {k:'yoruzuri',n:'よるづり場',main:(o,j)=>SEATS.includes(o)&&spotW(j)>=0,need:[[o=>o==='toro',1]],how:'水べのいすと、石どうろう',eff:'魚がつれる確率+5%'},
  {k:'kotori',n:'小鳥の庭',main:o=>BENCHES.has(o),need:[[o=>o==='birdbath',1],[o=>o==='hedge',1]],how:'ベンチと、水飲み鳥と、生垣',eff:'ベンチで休むと、たのしさ+10%'},
  {k:'terrace',n:'よるのテラス',main:o=>BENCHES.has(o),need:[[o=>o==='lantern',1],[o=>o==='lamp',1]],how:'ベンチと、ランタンと、かがり火',eff:'ベンチで休むと、つかれのとれ方+10%'},
  {k:'oshaberi',n:'おしゃべりひろば',main:o=>o==='signpost',need:[[o=>BENCHES.has(o),2]],how:'道しるべと、ベンチ2つ',eff:'まわり3マスでおしゃべりすると、たのしさ+10%'},
  {k:'hatake',n:'はたけの水場',main:o=>o==='well',need:[[o=>o==='farm',3]],how:'井戸と、畑3つ',eff:'まわり3マスの畑の、たねまき・収穫の速さ+10%'},
  {k:'kikori',n:'きこり小屋',main:o=>o==='lumber',need:[[o=>o==='crate',1]],how:'伐採場と、木箱',eff:'まわり3マスの木を切る速さ+10%'},
  {k:'ishikiri',n:'いしきり小屋',main:o=>o==='quarry',need:[[o=>o==='crate',1]],how:'採石場と、木箱',eff:'まわり3マスの岩をほる速さ+10%'},
  {k:'takeyabu',n:'竹やぶの小道',main:o=>o==='takeakari',need:[[o=>o==='bamboo',3]],how:'竹あかりと、竹3本',eff:'まわり3マスの竹を切る速さ+10%'},
  {k:'shosai',n:'しょさい',room:1,main:o=>o==='achair',need:[[o=>o==='shelf1',1],[o=>o==='flamp',1]],how:'家の中に、ひじかけいすと、本棚と、フロアランプ',eff:'その家の住み心地+5%'},
  {k:'living',n:'リビング',room:1,main:o=>o==='sofa1',need:[[o=>o==='ltable',1],[o=>o==='monstera',1]],how:'家の中に、ひとりがけソファと、ローテーブルと、かんようしょくぶつ',eff:'その家の住み心地+5%'}];
const spotNear=(j,k)=>{if(j==null||j<0)return false;const x0=j%W,y0=(j/W)|0;for(let y=Math.max(0,y0-3);y<=Math.min(H-1,y0+3);y++)for(let x=Math.max(0,x0-3);x<=Math.min(W-1,x0+3);x++){const t=SPOTM.get(y*W+x);if(t&&t.has(k))return true}return false};/* そのマスのまわり3マスに、スポットのもとの物（伐採場・井戸・道しるべなど）があるか */
const spotN=(j,...ks)=>ks.reduce((n,k)=>n+(spotHas(j,k)?1:0),0);/* おなじスポットは重ならない（いくつできても1こ分）。ちがうスポットは、たし算で重なる */
const spotHas=(j,k)=>{const t=SPOTJ.get(anc(j));return !!t&&t.has(k)};
let SPOTPREV=null;const SPOTFX=[];/* できたスポットのかこみ {x0,y0,x1,y1,t0} */
function spotCells(I){const L=[I.j,...I.found.flat()],out=[];for(const q of L){const a=anc(q),o=S.obj[a];if(!o){out.push(q);continue}for(const[x,y]of fp(o,a%W,(a/W)|0))out.push(y*W+x)}return out}/* スポットになった物のマス（大きい物は、その大きさぶん） */
function spotFx(I){const C=spotCells(I);let x0=W,y0=H,x1=0,y1=0;for(const q of C){const x=q%W,y=(q/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}SPOTFX.push({x0,y0,x1,y1,t0:performance.now(),h:hiAt(I.j)});if(SPOTFX.length>6)SPOTFX.shift();dirty=true}
function drawSpotFx(now){for(let i=SPOTFX.length-1;i>=0;i--){const f=SPOTFX[i],e=(now-f.t0)/4000;if(e>=1){SPOTFX.splice(i,1);continue}const a=e<.1?e/.1:e>.75?(1-e)/.25:1,z=f.h*LIFT,x=f.x0*TS-3,y=f.y0*TS-3-z,w=(f.x1-f.x0+1)*TS+6,h=(f.y1-f.y0+1)*TS+6;
    ctx.save();ctx.globalAlpha=a;ctx.setLineDash([5,4]);ctx.lineDashOffset=-now/60;ctx.lineWidth=2;ctx.strokeStyle='rgba(255,246,190,.95)';ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,6):ctx.rect(x,y,w,h);ctx.stroke();ctx.strokeStyle='rgba(200,150,40,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect?ctx.roundRect(x+1.5,y+1.5,w-3,h-3,5):ctx.rect(x+1.5,y+1.5,w-3,h-3);ctx.stroke();ctx.setLineDash([]);/* 点線のかこみ（ゆっくりまわる） */
    const n=Math.min(14,4+Math.round((f.x1-f.x0+1)*(f.y1-f.y0+1)*.8));for(let k=0;k<n;k++){const px=x+6+hash(k*31+f.x0*7+f.y0)*(w-12),py=y+6+hash(k*17+f.y1*5+f.x1)*(h-12),tw=Math.sin(now/170+k*1.9);if(tw>0)star4(ctx,px,py,(2+hash(k*13)*2.5)*tw)}ctx.restore()}}/* 中でキラキラ */
function calcSpots(){findHouses();/* 部屋のスポットのために、家をいまの形で */SPOTJ=new Map();SPOTM=new Map();SPOTI=[];const add=(j,k)=>{let t=SPOTJ.get(j);if(!t)SPOTJ.set(j,t=new Set());t.add(k)};
  for(let j=0;j<W*H;j++){const o=S.obj[j];if(!o||o==='part')continue;for(const sp of SPOTS){if(!sp.main(o,j))continue;const hin=sp.room?HOUSES.find(h=>h.inside.has(j)):null;if(sp.room&&!hin)continue;/* 部屋のスポット：家の中にあるときだけ。いる物も、同じ家の中 */const x0=j%W,y0=(j/W)|0,found=sp.need.map(()=>[]);
    for(let y=Math.max(0,y0-3);y<=Math.min(H-1,y0+3);y++)for(let x=Math.max(0,x0-3);x<=Math.min(W-1,x0+3);x++){const q=y*W+x,t=S.obj[q],wv=S.win&&typeof S.win[q]==='string'?S.win[q]:null;if(wv&&q!==j&&(!hin||hin.set.has(q)))sp.need.forEach((nd,i)=>{if(nd[0](wv,q))found[i].push(q)});/* 壁にかけた物も数える */if(q===j||!t||t==='part'||hin&&!hin.inside.has(q))continue;sp.need.forEach((nd,i)=>{if(nd[0](t,q))found[i].push(q)})}
    if(sp.need.every((nd,i)=>found[i].length>=nd[1])){add(j,sp.k);for(const L of found)for(const q of L)add(q,sp.k);{let t=SPOTM.get(j);if(!t)SPOTM.set(j,t=new Set());t.add(sp.k)}SPOTI.push({sp,j,found})}/* SPOTM：スポットのもとの物（まわり3マスで効くスポットは、ここからはかる）。SPOTI：できたスポットの一覧 */}}
  {const cur=new Set(SPOTI.map(I=>I.sp.k+':'+I.j));if(SPOTPREV&&SPOTPREV.s===S)for(const I of SPOTI)if(!SPOTPREV.k.has(I.sp.k+':'+I.j))spotFx(I);SPOTPREV={s:S,k:cur}}/* 新しくできたスポットは、点線でかこんでキラキラ（読みこんだときはしない） */
  const seen=S.spotSeen||(S.spotSeen={});for(const sp of SPOTS){if(seen[sp.k])continue;let on=false;for(const t of SPOTJ.values())if(t.has(sp.k)){on=true;break}if(on){seen[sp.k]=1;SPOT_POPS.push({state:S,sp})}}}/* はじめてできたときだけ、ポップアップで説明する（showSpotPop） */
const TOYS=new Set(['swing','seesaw','sandbox','slide']);/* 平らな物のうち、毎コマかく物（ラグ・罠など）は、BL に anim:1 と書く */
const win64=i=>!!(S&&S.win&&typeof S.win[i]==='string'&&window.CHIPS&&window.CHIPS[S.win[i]]&&window.CHIPS[S.win[i]].g===64);/* 1マス64ドットの絵をかけた壁・ドアも、画面の大きさでかく */
function toyR(r){const a=r.act;return a&&a.type==='play'&&a.stage==='do'&&TOYS.has(a.what)&&a.obj!=null&&S.obj[a.obj]===a.what?a:null}
function toyUsers(j){return S.res.filter(q=>{const a=toyR(q);return a&&a.obj===j}).sort((p,q)=>p.id-q.id)}
function swAng(j,now){return Math.sin(now/1000*2.6+j)}/* -1〜1：手前に来ると下に大きく、奥に行くと上に小さく */
function ssAng(j,now){return Math.sin(now/1000*1.8+j)*(toyUsers(j).length?.28:.12)}
/* 遊具で遊ぶ子の位置（足もと）。おもちゃの絵に合わせて動く */
function toyPose(r,now){const p=toyPose0(r,now);if(!p)return p;const a=toyR(r),j=a.obj,t=ROTS[a.what],rv=rotAt(j);if(t===1&&rv){const fw=((szR(a.what,0)||[1,1])[0])*TS,X=(j%W)*TS;p.x=2*X+fw-p.x;r.face=-r.face}return p}/* 左右反転した遊具では、遊ぶ位置も反転 */
function toyPose0(r,now){const a=toyR(r);if(!a)return null;const j=a.obj,X=(j%W)*TS,Y=((j/W)|0)*TS,us=toyUsers(j),k=Math.max(0,us.indexOf(r)),T=now/1000;
  if(a.what==='swing'){const d=swAng(j,now);r.face=1;return{x:X+32,y:Y+29+d*9,z:Y/TS+1.05}}/* 座面（chips.js の swing の部品）の下に足。ゆれると、座面といっしょに前後する */
  if(a.what==='seesaw'){const sg=us.length>1?(k?1:-1):(r.x<X+16?-1:1)*(TS/TS),an=ssAng(j,now),X0=X+16,Y0=Y+7;r.face=-sg;return{x:X0+Math.cos(an)*sg*22+Math.sin(an)*5,y:Y0+Math.sin(an)*sg*22-Math.cos(an)*5+5,z:Y/TS+1.05}}
  if(a.what==='sandbox'){const o=[-15,15,0][k%3];if(rotAt(j)===1){r.face=k%2?-1:1;return{x:X+16+(k===2?0:(k?6:-6)),y:Y+32+o+8-Math.abs(Math.sin(T*5+k))*1.5,z:Y/TS+1.05+(o+16)/TS}}/* 縦の砂場では、たてにならぶ */const cx=X+32;r.face=o>0?-1:1;return{x:cx+o,y:Y+26-Math.abs(Math.sin(T*5+k))*1.5,z:Y/TS+1.05}}
  if(a.what==='slide'){const p=(T*.45+k*.5)%1;let x,y,f=1;
    if(p<.35){const q=p/.35;x=X+2+q*12.5;y=Y+54.25-q*35;f=1}/* 左の階段をのぼる（chips.js の slide の絵に合わせる） */
    else if(p<.42){x=X+14.5+(p-.35)/.07*22.5;y=Y+19.25}/* 上の台をわたる */
    else if(p<.7){const q=(p-.42)/.28,u=1-q;x=u*u*(X+38.25)+2*u*q*(X+54.5)+q*q*(X+67);y=u*u*(Y+21.75)+2*u*q*(Y+41.75)+q*q*(Y+51.75)}/* すべる */
    else{const q=(p-.7)/.3;x=X+67-q*65;y=Y+56.75+Math.sin(q*Math.PI)*2.5;f=-1}/* 階段の下へもどる */
    r.face=f;return{x,y,z:Y/TS+2.05}}
  return null}
function spotW(i){const w=sideW(i);if(w>=0)return w;const y=i/W|0;if(y>0&&S.ground[i-W]===1)return i-W;if(y+1<H&&S.ground[i+W]===1)return i+W;return -1}/* 椅子のすぐとなり（上下左右）の水マス（なければ-1） */
function fishW(j){return fSpot(j)?spotW(j):sideW(j)}/* 釣るときに見る水マス（釣りスポットは上下も） */
function sideW(j){const x=j%W;if(x+1<W&&S.ground[j+1]===1)return j+1;if(x>0&&S.ground[j-1]===1)return j-1;return -1}/* 左右どちらかが水 */
function adjOf(j,fn){const x=j%W,y=(j/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(fn(k))return k}return -1}
const elemCount=el=>S.res.filter(r=>r.elem===el).length;
const NEEDT=[8,20,36,56,80,108,140,176,216,260,308],NEEDF=[13,32,58,90,128,173,224,282,346,416,493],needFor=el=>{const T=WD===FREE?NEEDF:NEEDT;return T[Math.min(T.length-1,elemCount(el))]};/* なかまを呼ぶのに必要な力（いる人数ごと）。フリーモードは自然の力が弱いので多め */
function revRadius(o){const b=BL[o];if(!b)return 0;if(o==='tower')return 7;if(o==='statue')return 4;if(o==='farm')return 2;if(b.kind==='block')return 1;if(b.kind==='plant')return 3;if(b.kind==='furn')return 2;if(b.kind==='build')return 3;if(o==='ntree'||o==='berry'||o==='bamboo'||o==='takenoko')return 1;return 0}
/* 属性の力の表示（例：属性 木+1・土+2） */
function attrTxt(id){const b=BL[id];if(!b||!b.attr||b.kind==='block')return'';const a=Object.entries(b.attr).filter(e=>e[1]>0);return a.length?'属性 '+a.map(([k,v])=>ELEM[k].name+'+'+(+v.toFixed(2))).join('・'):''}
const withAttr=(id,t)=>{const a=attrTxt(id);return a?(t?t+'　':'')+'【'+a+'】':t||''};
function recount(){if(S.broken)S.broken=S.broken.filter(b=>!S.obj[b.j]);calcSpots();/* こわれた物の場所に、なにか置いたら、こわれた物のリストからはずす */
  for(const key in S.win||{}){const j=+key,wall=k=>HOME_WALLS.has(S.obj[k])||HOME_DOORS.has(S.obj[k]);if(S.win[j]==='wreath'&&HOME_DOORS.has(S.obj[j])&&(wall(j-W)||wall(j+W))&&!(wall(j-1)||wall(j+1))){S.inv.wreath=(S.inv.wreath||0)+1;delete S.win[j];toast('たてのドアのリースを、持ち物にもどしました')}}/* たてのドアにはリースをかけられない。まわりの壁が変わってたてになったら、知らせてもどす */
  STATUE=-1;OBOX=-1;BOARD=-1;counts={};LIGHTS=[];LITP=[];STELES=[];TOWERS=[];NEARFLOWER=new Set();NEARWELL=new Set();NEARMILL=new Set();NEARVANE=new Set();NEARCART=new Set();NEARTOOL=new Set();NEARSIGN=new Set();NEARPARA=new Set();NEARTREE=new Set();RUGC=new Map();for(const k in S.rug||{})for(const c of rugCells(+k))RUGC.set(c,+k);RFC=new Map();for(const k in S.roof||{})for(const c of rugCells(+k))RFC.set(c,+k);/* 屋根の下のマス→屋根の左上 *//* ラグがしいてあるマス→ラグの左上 */ENVG=new Float32Array(W*H);REV=new Set();ATTR={};ELEM_KEYS.forEach(k=>ATTR[k]=0);
  const around=(j,r,set)=>{const x=j%W,y=(j/W)|0,h=set===REV?hiAt(j):-1;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r+1)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&!(h>=0&&hiAt(ny*W+nx)!==h))set.add(ny*W+nx)}};/* 緑の広がり（REV）は、段差をこえない */
  const addA=a=>{if(a)for(const k in a)ATTR[k]+=a[k]};
  let baseN=0,revN=0;
  for(const k in S.rug||{}){const o=S.rug[k];counts[o]=(counts[o]||0)+1;if(BL[o])addA(BL[o].attr)}/* ラグ（床の上の層）も数える */
  for(const k in S.roof||{}){const o=S.roof[k];counts[o]=(counts[o]||0)+1;if(BL[o])addA(BL[o].attr)}/* ガゼボ・東屋（屋根の層）も数える */
  for(let j=0;j<W*H;j++){const o=S.obj[j],f=S.floor[j],x=j%W,y=(j/W)|0;
    if(f){around(j,1,REV)}/* 床・道・壁などのブロックは、属性の力をためない */
    
    if(!o||o==='part')continue;counts[o]=(counts[o]||0)+1;
    if(o==='statue')STATUE=j;if(o==='obox')OBOX=j;if(o==='board')BOARD=j;
    if(o==='stele')STELES.push(j);
    if(o==='lamp'||o==='lighthouse'||o==='tower'||o==='campfire'||o==='statue'||o==='torch'||o==='candle'||o==='lantern'||o==='flamp'||o==='yomawari'||o==='toro'||o==='takeakari'||o==='andon')LIGHTS.push(j);
    if(o==='shinboku'){const x0=j%W,y0=(j/W)|0;for(let b=-3;b<=5;b++)for(let a=-3;a<=5;a++){const nx=x0+a,ny=y0+b;if(nx>=0&&ny>=0&&nx<W&&ny<H)NEARTREE.add(ny*W+nx)}}/* ご神木のまわり3マス */
    if(LIGHTP[o])LITP.push(j);/* 夜に光をかく明かりの一覧 */
    if(o==='watch'||o==='yogan'||o==='tower')TOWERS.push(j);
    if(FLOWERS.has(o)&&o!=='lotus'&&!isBud(j))around(j,1,NEARFLOWER);/* 花：まわり1マス・かさならない */
    if(o==='well')around(j,3,NEARWELL);
    if(o==='windmill')around(j,5,NEARMILL);
    if(o==='jar')around(j,1,NEARWELL);/* みずがめ：まわり1マスの畑は水やりいらず */if(o==='vane')around(j,3,NEARVANE);if(o==='niguruma')around(j,3,NEARCART);if(o==='kabedougu')around(j,3,NEARTOOL);/* にぐるま：まわり3マスの箱は、しまうのが速い */if(o==='signpost')around(j,3,NEARSIGN);/* 風見鶏：まわり3マスは足が速い */
    const tbud=(o==='tree'||o==='fruit')&&isBud(j);/* 木も花と同じ。芽のあいだは、効果なし */
    if(o==='parasol')around(j,1,NEARPARA);/* パラソル：まわり1マス・かさならない */else if(!tbud&&BL[o]&&BL[o].env){const er=BL[o].er||3;for(let dy=-er;dy<=er;dy++)for(let dx=-er;dx<=er;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)ENVG[ny*W+nx]+=BL[o].env}}/* にわの家具：まわりの環境 */
    if(BL[o]&&BL[o].kind!=='block'&&(!FLOWERS.has(o)||!isBud(j))&&!tbud)addA(BL[o].attr);
    const rr=revRadius(o);if(rr&&!tbud)around(j,rr,REV);
  }
  {/* 村：家・置いた物（自然の物・雑草・きのこはのぞく）・ラグ・屋根のまわり3マス */const m=new Uint8Array(W*H),v=new Uint8Array(W*H);for(let j=0;j<W*H;j++){const o=S.obj[j];if(o&&(o==='part'||BL[o]&&!BL[o].natural&&!WEEDS.has(o)))m[j]=1}for(const k in S.rug||{})m[+k]=1;for(const k in S.roof||{})m[+k]=1;
    const t=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let f=0;for(let d=-3;d<=3&&!f;d++){const q=x+d;if(q>=0&&q<W&&m[y*W+q])f=1}t[y*W+x]=f}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let f=0;for(let d=-3;d<=3&&!f;d++){const q=y+d;if(q>=0&&q<H&&t[q*W+x])f=1}v[y*W+x]=f}VILL=v;
    for(let j=0;j<W*H;j++)if(v[j]&&S.ground[j]===1)ATTR.water+=.3}/* 水の力は、村の中の池・川だけ（1マス0.3） */
  if(counts.signw||counts.signs)for(const k in ATTR)ATTR[k]*=1.1;/* 村の看板：属性の力+10%（いくつあっても1回） */
  for(const k of NEARPARA)ENVG[k]+=7;/* パラソルがいくつ重なっても、1つぶん（BL.parasol.env） */
  if(WD===FREE)for(let j=0;j<W*H;j++)REV.add(j);/* フリーモードの土地は荒れていない */
  {const st=WD===1?1:0,g='weed'+st+'g',k='weed'+st+'k';for(let j=0;j<W*H;j++){const o=S.obj[j];if(o===k&&REV.has(j))S.obj[j]=g;else if((o===g||o==='weedc')&&!REV.has(j))S.obj[j]=k}}/* 雑草は土地に合わせる：よみがえった土地（緑）は緑の草、荒れた土地は枯れた草（あとから緑になった所の枯れた草も、緑の草に） */
  for(let j=0;j<W*H;j++){if(S.ground[j]===1)continue;baseN++;if(REV.has(j))revN++}
  /* 属性値は、せいれいの依頼が出る前から基地にある対象物も含めて数える。依頼開始時の基準化・差し引きはしない。 */
  BASEPCT=Math.round(revN/Math.max(1,baseN)*100);GRASSN=revN;// マップぜんぶの、みどりのマス
  dirty=true;
}
