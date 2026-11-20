/* 図鑑の節目のごほうび（zukanms.js）。
   図鑑のタブごとに、見つけた数が節目（ZKMS：5・10・20こ）と「ぜんぶ」（かぞえられるタブだけ：さかな・いきもの）に、とどいたら、ハンコ・紙ふぶきと、ごほうび。
   5こ：パワー50・10こ：パワー100・20こ：設計図（もらえる物がなければパワー200）・ぜんぶ：まだない特別なそうび（なければ、おそなえでない家具）。
   とどいた節目は S.flags.zkMs（タブ→いくつめの節目まで）。ステージごと（S にしまう）。5秒に1回たしかめる */
const ZKMS=[5,10,20],ZKMSPT=[50,100],ZKMS20PT=200;
function zkCount(t,d){d=d||S;const G=typeof grecOf==='function'?grecOf():new Map(),here=id=>G.get(id)===WD,placed=new Set((d.obj||[]).filter(o=>o&&BL[o])),has=id=>placed.has(id)||((d.inv||{})[id]||0)>0;let n=0;
  if(t===0){for(const sp of SPOTS)if((d.spotSeen||{})[sp.k])n++;return n}
  if(t===1||t===2||t===3){const kd=t===1?'furn':t===2?'build':null;for(const id in BL){const b=BL[id];if(!b||!b.name||b.hidden)continue;if(kd?b.kind!==kd:(b.kind==='furn'||b.kind==='build'||b.kind==='nat'))continue;if(here(id)||(t!==3&&has(id)))n++}return n}
  if(t===4){const s=d.seenEn||{};for(const k in EN)if(ZUKAN[k]&&s[k])n++;return n}
  if(t===6){const R=d.fishRec||{};for(const k of FISHK)if(R[k]>0)n++;return n}
  if(t===7){const R=d.critRec||{};for(const k of CRITKINDS)if(R[k]>0)n++;return n}
  if(t===8){const K=d.cookKn||{};return new Set(Object.values(K)).size}
  if(t===10){const R=d.fosRec||{};let c=0;for(const k in R)if(R[k]>0)c++;return c}
  const it=Object.assign({},d.seenIt||{});for(const k in d.mat||{})if(d.mat[k]>0)it['m:'+k]=1;for(const k in d.fs||{})if(d.fs[k]>0)it['f:'+k]=1;for(const k in MATN)if(it['m:'+k])n++;for(const k in FOODS)if(it['f:'+k])n++;if(it['x:horn'])n++;if(it['x:herb'])n++;return n}
function zkTotal(t){/* 「ぜんぶ」の数（このステージで見つけられる数がきまるタブだけ。ほかは0） */if(t===6)return FISHK.filter(k=>FISHI[k].w===WD).length;if(t===7)return CRITKINDS.filter(k=>k!=='mogura'||WD===3).length;if(t===10)return typeof CVFOSK!=='undefined'?CVFOSK.length:0;return 0}
function zkSteps(t){const T=zkTotal(t),L=ZKMS.filter(v=>!T||v<T);if(T)L.push(T);return L}
function zkNext(t){/* 図鑑のタブに出す：つぎの節目まで、あと何こ */const n=zkCount(t),L=zkSteps(t);for(const v of L)if(n<v)return{v,left:v-n,all:v===zkTotal(t)};return null}
function zkReward(t,v,all){const nm=ZKTABS[t];if(all&&t===10){rewardPower(CVFOSALL);toast('図鑑の「'+nm+'」をうめた','good');return}/* 化石は、そろえるとパワー（cave.js） */if(all){const G=GEAR_IDS.filter(id=>BL[id].g.sp&&!gearCount(id)&&(BL[id].g.gr||WD===1));if(G.length){const id=pick(G);giveItem(id,1);queueItemGift({[id]:1},'図鑑の「'+nm+'」をうめた！');return}
    const F=FURN.filter(id=>BL[id]&&!BL[id].offerOnly&&!BL[id].shopOnly&&stageItemOK(id));if(F.length){const id=pick(F);giveItem(id,1);queueItemGift({[id]:1},'図鑑の「'+nm+'」をうめた！')}return}
  if(v>=20){if(typeof bpNext==='function'&&bpNext()){bpGiveNext(null);toast('図鑑の「'+nm+'」が'+v+'こ：設計図をもらった','good');return}rewardPower(ZKMS20PT);toast('図鑑の「'+nm+'」が'+v+'こ','good');return}
  rewardPower(ZKMSPT[ZKMS.indexOf(v)]||50);toast('図鑑の「'+nm+'」が'+v+'こ','good')}
let ZKMST=0;
function zkMsTick(now){if(now-ZKMST<5000)return;ZKMST=now;if(!S||!started||IS_STORY_REPLAY||typeof STORY_REPLAY_SHELL!=='undefined'&&STORY_REPLAY_SHELL||typeof MEMRUN!=='undefined'&&MEMRUN||typeof NOSAVE!=='undefined'&&NOSAVE)return;if(typeof GIFT_ACTIVE!=='undefined'&&GIFT_ACTIVE)return;if(typeof calmNow==='function'&&calmNow()||typeof SCENEHOLD!=='undefined'&&SCENEHOLD||typeof sacredQuietActive==='function'&&sacredQuietActive()||!document.getElementById('dialog').hidden||typeof mainGathering==='function'&&mainGathering()||S.res.some(r=>r.act&&/^(story|field|nmeet|reunion)/.test(r.act.type))||sheet!=null&&sheet!=='zukan')return;/* 会話・場面・再会のあとの静かな時間は、まつ */
  const M=S.flags.zkMs||(S.flags.zkMs={});
  for(let t=0;t<ZKTABS.length;t++){const L=zkSteps(t),n=zkCount(t);let i=M[t]||0;if(M[t]==null){/* はじめて数える（前のセーブ）：いまとどいている節目は、ごほうびなしで、とどいたことにする */M[t]=L.filter(v=>n>=v).length;continue}
    if(i<L.length&&n>=L[i]){M[t]=i+1;zkReward(t,L[i],L[i]===zkTotal(t));if(typeof juiceCheer==='function')juiceCheer('zk');sfx('quest');memo('zukan','図鑑の「'+ZKTABS[t]+'」が'+L[i]+'こになった');return}}}/* 1回に1つずつ */
