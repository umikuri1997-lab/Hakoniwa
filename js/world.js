'use strict';
function setWorld(w){WD=w||0;QUESTS=QL[WD];KEYRES=KEYS[WD];BL.tower=WD===KUSA?TOWER_TREE:TOWER_STONE;if(typeof iconCache!=='undefined')delete iconCache.tower;soupFilter()}
function soupFilter(){}/* 料理の表はどのステージも同じ（作れる家具がちがう） */
// 守護の台座を建てるための条件
const TOWER_MAT=()=>WD===KAZAN?{wood:150,stone:75}:{};
function towerConds(){if(WD===KAZAN)return clearConds();return [
  ['5つの属性のせいれいがそろう（いま'+ELEM_KEYS.filter(k=>elemCount(k)>=1).length+'/5）',ELEM_KEYS.every(k=>elemCount(k)>=1)],
  ['切り株に声を届け、ヌシ様の返事を聞く',!!S.flags.nushiAlive]];}
const SHN=()=>WD===KAZAN?'ヌシ様の火だね':'ヌシのかけら';/* 火山のヌシ様は熱をうばわれたので、かけらではなく火だね */
const shLeft=()=>Math.max(0,(S.shards||0)-(S.usedSh||0));/* 火山のふもと：まだ使っていないかけらの数（装置と台座にはめると減る） */
const towerReady=()=>towerConds().every(c=>c[1]);
function clearConds(){if(WD===KAZAN){const tm=TOWER_MAT(),n=springDone(),fac=['bench','tub','noren'].filter(nearSp).length;return [
  ['温泉3か所をよみがえらせる（いま'+n+'）',n>=3],
  ['ヒノオオカゲを追いはらい、奥の装置を直す',!!S.flags.hinoDown&&!!(S.st2&&S.st2.d2fix)],
  ['温泉のそばに、ベンチ・水おけ・のれん（いま'+fac+'/3）',fac>=3],
  ['ホムラとシズクのおねがい',!!S.flags.hReq&&!!S.flags.sReq],
  ['台座にはめるヌシ様の火だね（いま'+shLeft()+'つ）',shLeft()>=1],
  ['しまう家具のわく'+(Math.ceil(tm.wood/STACK)+Math.ceil(tm.stone/STACK))+'（いま'+boxSlotTot()+'）',boxSlotTot()>=Math.ceil(tm.wood/STACK)+Math.ceil(tm.stone/STACK)],/* 箱が小さいと、台座の素材がためられない */
  ['木材'+tm.wood+'・石材'+tm.stone+'（いま'+(S.mat.wood||0)+'・'+(S.mat.stone||0)+'）',(S.mat.wood||0)>=tm.wood&&(S.mat.stone||0)>=tm.stone]]}
  return [['御神木にヌシのかけらを2つ届ける（いま'+Math.min(2,S.setSh||0)+'つ）',(S.setSh||0)>=2]]}/* 草原：かけらがそろえば、さいごの防衛へ */
const clearReady=()=>clearConds().every(c=>c[1]);
const finalDefenseBegun=()=>!!(S.finalOn||S.finalNight||(S.rushN||0)>0||S.finalLost!=null||S.flags.finalWon);
function acceptFinalDefense(){if(WD!==KUSA||finalDefenseBegun()||S.flags.finalReadyDay!=null)return;S.flags.finalReadyDay=dayNo()+3;S.finalDay=null;S.finalHint=null}
function finalCheck(){if(WD!==KUSA||!S||S.cleared||S.finalNight||S.finalOn||!S.enemyOn||S.flags.finalWon)return;/* 勝ったあとは、もう来ない */if(S.finalLost!=null&&dayNo()-S.finalLost<3)return;if(S.res.length<5)return;if(!S.res.some(r=>r.name===POKO))return;/* フタバがいるときだけ *//* ヨルノオオカゲに負けたら3日あける。せいれいが5人以上になってから */if(!finalDefenseBegun()){if(!qAt('nushi')||!S.qTalked){S.finalDay=null;S.finalHint=null;return}acceptFinalDefense()}if(cnt('tower')>=1&&clearReady()){
  if(S.finalDay==null){if(isNight())return;S.finalDay=Math.max(dayNo(),S.flags.finalReadyDay??dayNo()+3);S.finalHint=3;memo('moonn','夜の空気が、すこし重くなってきた');talkOnce('finalAnn'+S.finalDay,sevLines([['F','#think|……ねえ。なんだか、夜の風がつめたくなってきた気がする。'],['N','御神木の力に、なにかが気づいたのかもしれないねぇ……。',1]]),0);return}/* 予告：すぐには来ない。3日後の夜に来る */
  const left=S.finalDay-dayNo();if(left>0){if(left<S.finalHint&&!isNight()){S.finalHint=left;toast(left===2?'遠くの森が、いつもより静かだ……':'夜になると、影がざわめいている気がする……','warn')}return}/* 日ごとに、少しずつにおわせる */
  S.finalNight=true;const rn=S.rushN||0;if(!rn)memo('moonn','御神木の力に、影たちがひきよせられてきた');later(()=>toast(rn===0?'御神木にあつまった力に、影たちがひきよせられている……。今夜、群れがやってくる':rn===1?'影の群れは、まだあきらめていない……。今夜も来る':'今夜は、もっと大きな影の気配がする……','warn'),900)}}/* 予告から3日後の夜から：影の群れの夜が2回、3回目の夜にヨルノオオカゲ（負けたあとは、ヨルノオオカゲの夜だけ） */

/* ---------- 状態 ---------- */
let S=null;
const resv=new Map();
let RUINT=-1/* こわれた神殿（直している途中もふくむ）のマス。recount で作る */,STATUE=-1,OBOX=-1,BOARD=-1,counts={},LIGHTS=[],HOTL=[]/* ほたるの草むらのマス */,DRUMS=[]/* 合図の太鼓のマス */,JARS=[],COMPS=[],LITP=[],STELES=[],LURES=[],TOWERS=[],ENVE={},NEARMILL=new Set(),NEARSUI=new Set(),STUMPB=new Set(),NEARVANE=new Set(),NEARCART=new Set(),NEARJORO=new Set(),NEARMIZU=new Set()/* 苔むした石の水ばちのまわり5マス：芽が、植えたその日に育つ */,NEARSIGN=new Set(),NEARPARA=new Set(),SPOTJ=new Map(),SPOTM=new Map(),SPOTI=[],RUGC=new Map(),RFC=new Map(),ENVG=null,REV=new Set(),ATTR={},BASEPCT=0,GRASSN=0;
function newState(w){w=w||0;
  const s={v:8,mig:SAVE_VER,box:{},pile:{},rsv:{},flags:{blk2:1,route:[],ltWhole1:1,lvPick1:1,dig2:1,gf25:1,windFoe1:1,mizuFoe1:1,mzq3:1,mzq2:1,mzGate3:1,wseed1:1,altarLit1:1,volSub1:1,ovenRot4:1,wbIns1:1,wbFurn1:1,wbYard1:1,cook2:1,tableSub1:1,bread2:1,talkq1:1,ovenW1:1,swingRot2:1,box1:1,gup1:1,gup5:1,stat10:1,tokui1:1,stat5:1,hun2:1,evOpen1:1,trapSub1:1,board2x1:1,board4:1,board3:1,bondX2:1,spring2:1,juice1:1,berryHalf:1,berryHalf2:1,land2:1,land3:1,land4:1,arrow0:1,q3ins:1,qmerge1:1,qsplit1:1,earthMerge1:1,fieldMerge1:1,tutSub1:1,farmFirst1:1,omoiIns1:1,warmIns1:1,story3ins1:1,vgift1:1,companionStory:1,fieldStoryV2:1,sacredStoryV1:1,sacredFootprint3:1,sacredFootprint4:1,sacredLeft1:1,fieldBuild1:1,trfit1:1,cookfit1:1,watch5:1,xp12:1,veins1:1,ore2:1,noBerry1:1,yogan2:1,bwall1:1,misu1:1,fl2v1:1,no2f1:1,vq1:1,kgIns1:1,fog1:1,ruinGap1:1,festq2:1,shin3:1,shinGone1:1,noStable1:1,noTool1:1,rec3:1,ruinTemple1:1,vpath2:1},placed:{},feat:{build:true},inv:{},orders:[],enemyOn:false,nights:0,godGone:false,godShown:false,nushi:null,
    lv:1,bossKills:0,nightHurt:0,nightHad:false,wave:null,lastWarn:0,
    ref:{},ground:new Array(W*H).fill(0),floor:new Array(W*H).fill(''),obj:new Array(W*H).fill(''),dyn:{},hp:{},
    res:[],enemies:[],pt:25,totalPt:0,food:0,fs:{},cseed:{imo:4},crops:{imo:true},mat:{wood:0,stone:0},regrow:[],t:w===0?15*60:w===YAMI?8*60:w===TSUCHI?16*60:12*60,/* 草原は15時・土は夕方16時（はじまりの地ゆれ）からはじまる */speed:1,
    unlocked:{floor:true,farm:true,[w===1?'misugaki':w===WIND?'ropefence':w===MIZU?'ashifence':w===TSUCHI?'ishigaki':w===YAMI?'ibara':'fence']:true,[w===1?'bamboowall':w===WIND?'canvaswall':w===MIZU?'timberwall':w===TSUCHI?'adobewall':w===YAMI?'mosswall':'hwall']:true,...(w===WIND?{tanpopo:true}:w===TSUCHI?{iwakagami:true}:{})},bulk:false,stamps:false,quest:0,cleared:false,rain:false,seeds:[],nameIdx:2,introSeen:false,lastMorning:1,lastNight:0,subDone:{},drops:[],ani:[],shards:0,gotMat:{wood:0,stone:0},recipes:{},buried:[],nid:1,kills:0,deaths:0};
  s.world=w;s.vk=vkNew();/* 村の見分け（photo.js） */if(w===FREE)s.flags.valley=1;/* フリーモード：花の谷（free.js。前のセーブの地形はそのまま） */if(w===MIZU)mzGenWorld(s);else genWorld(s,w);
  if(w===YAMI){}/* 闇のステージ：はじめは、だれもいない（yami.js の yamiBirth でトモリが生まれる）。はじめに来るのは火のせいれいヒイロ（SECOND） */else if(w===1)s.res.push(mkRes(s,HOMURA,'fire',CX+.5,CY-1.5,'campfire'));else if(w===MIZU)s.res.push(mkRes(s,MIO,'water',CX+.5,CY-1.5,'fountain'));else if(w===WIND){s.res.push(mkRes(s,KAZANE,'wind',CX+.5,CY-1.5,'slide'));s.flags.minaCame=true}else if(w===TSUCHI){s.res.push(mkRes(s,TOTO,'earth',CX+.5,CY-1.5,'swing'));s.flags.minaCame=true}/* 土：はじめはトトひとり（巣穴からころがり出る。tsuchi.js の tsIntro） *//* 風（土台）：はじめはカザネひとり。2人めのキーキャラは、お話を作るときに */else s.res.push(mkRes(s,'フタバ','wood',CX+.5,CY-1.5,'swing'));
  if(w===0)s.res[0].nap=true;/* 初回のマップ描画から眠っている */
  if(w===FREE)freeSetup(s);if(w===MIZU)mzSetup(s);
  if(w!==FREE)templeRuinPlace(s);/* こわれた神殿は、はじめからある（フリーモードに神殿はない） */
  return s;
}
/* こわれた神殿：まん中の道（x=CX）の北のはしの先に置く。像のマスと左右（おそなえ箱・依頼ボードになる所）、手前（台座になる所）の4マス。
   水・浅瀬・道や床・人の作った物があるときや、高さがそろわないときは、北のはしに近い所をさがす。自然の物（木・岩・草）はどける */
function templeRuinCells(j){return [j,j-1,j+1,j+W,j-W+2,j-W+3,...templeBack(j)]}/* 神殿・おそなえ箱・神殿の右（神殿の絵の下）・台・依頼ボード（2マス。神殿から2つ右・3つ右の、うしろの列。持ち主がきめた）・神殿のうしろの列 */
const templeBack=j=>[j-W-1,j-W,j-W+1];/* 神殿は3×2マス（持ち主がきめた）：像のマスの列と、そのうしろ（北）の列 */
const RUIN_CLEAR=new Set(['deadtree','rock','bamboo','berry','ntree','takenoko','kinoko']),ruinClearable=o=>!o||RUIN_CLEAR.has(o)||WEEDS.has(o);/* こわれた神殿のためにどけてよい自然の物 */
function templeRuinOK(s,j){const x=j%W,y=(j/W)|0;if(x<2||x>W-3||y<3||y>H-3)return false;const h=s.hi?s.hi[j]|0:0;
  for(const k of templeRuinCells(j)){const o=s.obj[k];if(s.ground[k]||s.floor[k]||(s.hi?s.hi[k]|0:0)!==h)return false;if(!ruinClearable(o))return false}
  for(let dy=-3;dy<=1;dy++)for(let dx=-2;dx<=3;dx++)if(s.ground[j+dy*W+dx]===1)return false;/* 絵は3マス上・左右へはみ出すので、そこも水でない所 */return true}
function templeRuinPlace(s){if(s.obj.includes('statue')||s.obj.includes('statueb'))return -1;
  let y=(s.world||0)===0?CY-4:CY;/* 草原は、まん中が御神木の切り株なので、切り株のうしろの道から */while(y>1&&s.floor[(y-1)*W+CX])y--;/* 道の北のはし */
  const ty=y-2;let best=-1,bd=1e9;for(let dy=-12;dy<=12;dy++)for(let dx=-12;dx<=12;dx++){const j=(ty+dy)*W+CX+dx;if(!templeRuinOK(s,j))continue;const d=Math.hypot(dx,dy*2);if(d<bd){bd=d;best=j}}/* 道のはしからずれるときは、北や南より、よこ */
  if(best<0)return -1;
  const bx=best%W,by=(best/W)|0;for(let y=by-3;y<=by+1;y++)for(let x=bx-2;x<=bx+2;x++){const k=y*W+x,o=s.obj[k];if(!o||!ruinClearable(o))continue;/* 絵がかかる所の自然の物（木・岩・草）もどける */s.obj[k]='';if(s.dyn)delete s.dyn[k];if(s.hp){delete s.hp[k];delete s.hp['n'+k]}if(s.regrow)s.regrow=s.regrow.filter(g=>g.j!==k)}
  s.obj[best]='statueb';for(const k of templeRuinCells(best).slice(1)){s.obj[k]='part';s.ref[k]=best}return best}
function boardMigrate(){/* 依頼ボードは神殿の右の2マス。前のセーブは、右どなりの1マスを1回だけあける（どかせない物があれば、つぎの読みこみでまたためす） */
  if(S.flags.board2x1)return;const t=STATUE>=0?STATUE:RUINT;if(t<0)return;const k=t+2,site=S.obj[t]==='site';
  if(S.ground[k]===1){S.flags.board2x1=1;return}
  if(S.obj[k]&&!ruinClearable(S.obj[k]))removeAt(k%W,(k/W)|0);/* おいてあった物は、もちものへ */
  if(S.obj[k]&&!ruinClearable(S.obj[k]))return;
  S.obj[k]=STATUE>=0?'part':site?'site2':'part';S.ref[k]=STATUE>=0?t+1:t;delete S.dyn[k];delete S.hp[k];if(S.hp)delete S.hp['n'+k];S.flags.board2x1=1;recount()}
function boardFree(k,t=k-3){/* 依頼ボードのマスをあける（t は神殿）。どかせない物は、もちものへ。水ならあけられない */
  if(S.ground[k]===1)return false;const mine=()=>(S.obj[k]==='part'||S.obj[k]==='site2')&&S.ref[k]===t;/* もう神殿のマス */if(S.obj[k]&&!ruinClearable(S.obj[k])&&!mine())removeAt(k%W,(k/W)|0);
  if(S.obj[k]&&!ruinClearable(S.obj[k])&&!mine())return false;delete S.dyn[k];delete S.hp[k];if(S.hp)delete S.hp['n'+k];return true}
function boardShift(){/* 依頼ボードの2マスを、絵のある所（神殿から2つ右・3つ右）へ。神殿のすぐ右は、神殿の絵の下なので神殿のマス（前は、ボードの絵の右はしの下を歩けた）。1回だけ（あけられなければ、つぎの読みこみでまた） */
  if(S.flags.board3)return;const t=STATUE>=0?STATUE:RUINT;if(t<0)return;const k=t+3;
  if(STATUE>=0){if(S.obj[t+1]!=='board'||S.ground[t+2]===1){S.flags.board3=1;return}if(!boardFree(k))return;
    const dy=S.dyn[t+1],hp=S.hp[t+1];S.obj[t+1]='part';S.ref[t+1]=t;delete S.dyn[t+1];delete S.hp[t+1];S.obj[t+2]='board';delete S.ref[t+2];if(dy)S.dyn[t+2]=dy;if(hp!=null)S.hp[t+2]=hp;S.obj[k]='part';S.ref[k]=t+2}
  else{if(!boardFree(k))return;S.obj[k]=S.obj[t]==='site'?'site2':'part';S.ref[k]=t}/* こわれた神殿：直すまでは神殿のマス */
  S.flags.board3=1;recount()}
function boardBackOK(t){const a=t-W+2,h=S.hi?S.hi[t]|0:0;return a>=0&&[a,a+1].every(k=>S.ground[k]!==1&&(S.hi?S.hi[k]|0:0)===h)}/* ボードをうしろの列におけるか（水でなく、神殿と同じ高さ） */
function boardBack(){/* 依頼ボードの2マスを、1マスうしろ（北）の列へ（持ち主がきめた）。前の2マスは、あいて歩ける。1回だけ（どかせない物がのこれば、つぎの読みこみでまた） */
  if(S.flags.board4)return;const t=STATUE>=0?STATUE:RUINT;if(t<0){S.flags.board4=1;return}const a=t-W+2,b=a+1;
  if(STATUE>=0&&S.obj[t+2]!=='board'||!boardBackOK(t)){S.flags.board4=1;return}/* 前の列にボードがない（1つ右の古いならび）・うしろが水や段差なら、そのまま */
  for(const k of[a,b]){const o=S.obj[k];if(!o||ruinClearable(o)||(o==='part'||o==='site2')&&S.ref[k]===t)continue;
    const mv=o!=='part'&&o!=='site2'&&!NOMOVE.has(o)&&!(BL[o]&&BL[o].sz)&&!iqGrp(o)&&templeMoveTo(k);if(!mv)removeAt(k%W,(k/W)|0);if(S.obj[k]&&!ruinClearable(S.obj[k]))return}/* 置いてあった物は近くへうつす（うつせない物は、もちものへ） */
  for(const k of[a,b]){delete S.dyn[k];if(S.hp){delete S.hp[k];delete S.hp['n'+k]}if(S.rot)delete S.rot[k]}
  if(STATUE>=0){const dy=S.dyn[t+2],hp=S.hp[t+2];S.obj[a]='board';delete S.ref[a];if(dy)S.dyn[a]=dy;if(hp!=null)S.hp[a]=hp;S.obj[b]='part';S.ref[b]=a}
  else{const pt=S.obj[t]==='site'?'site2':'part';for(const k of[a,b]){S.obj[k]=pt;S.ref[k]=t}}/* こわれた神殿：直すまでは神殿のマス */
  for(const k of[t+2,t+3])if(S.obj[k]==='board'||(S.obj[k]==='part'||S.obj[k]==='site2')&&(S.ref[k]===t||S.ref[k]===t+2)){S.obj[k]='';delete S.ref[k];delete S.dyn[k];if(S.hp)delete S.hp[k]}
  S.flags.board4=1;recount()}
function templeDeepMigrate(){/* 神殿を3×2マスにした（うしろの列も神殿のマス）。前のセーブは1回だけ：うしろの列の物は、近くのあいた所へうつす（うつせない物は、もちものへ） */
  if(S.flags.temple2row)return;const t=STATUE>=0?STATUE:RUINT;if(t<0){S.flags.temple2row=1;return}const site=S.obj[t]==='site',pt=site?'site2':'part';
  for(const k of templeBack(t)){if((S.obj[k]==='part'||S.obj[k]==='site2')&&S.ref[k]===t)continue;const o=S.obj[k];
    if(o&&!ruinClearable(o)){const mv=o!=='part'&&o!=='site2'&&!NOMOVE.has(o)&&!(BL[o]&&BL[o].sz)&&!iqGrp(o)&&templeMoveTo(k);if(!mv)removeAt(k%W,(k/W)|0);if(S.obj[k]&&!ruinClearable(S.obj[k]))return}/* どかせない物がのこれば、つぎの読みこみでまた */
    S.obj[k]=pt;S.ref[k]=t;delete S.dyn[k];if(S.hp){delete S.hp[k];delete S.hp['n'+k]}if(S.rot)delete S.rot[k]}
  S.flags.temple2row=1;recount()}
function templeMoveTo(k){/* 1マスの物を、近くのあいた所へ（向き・状態・じょうぶさもいっしょに） */const x=k%W,y=(k/W)|0;
  for(let r=1;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const q=(y+dy)*W+x+dx;if(q<0||q>=W*H||S.obj[q]||S.ground[q]===1||S.floor[q]||(S.hi?S.hi[q]|0:0)!==(S.hi?S.hi[k]|0:0))continue;
    S.obj[q]=S.obj[k];S.obj[k]='';for(const T of[S.dyn,S.hp,S.rot])if(T&&T[k]!=null){T[q]=T[k];delete T[k]}if(S.hp&&S.hp['n'+k]!=null){S.hp['n'+q]=S.hp['n'+k];delete S.hp['n'+k]}return true}
  return false}
function templeRuinMigrate(){if(S.flags.ruinTemple1)return;S.flags.ruinTemple1=1;if(STATUE<0&&!statueSite()&&templeRuinPlace(S)>=0)recount()}/* 神殿を建てる前の古いセーブに、こわれた神殿を1回だけ（recount のあとによぶ） */
/* 「しらべる」でこわれた神殿をタップ：せいれいが直しにいく（神殿を建てる足場と同じ。絵は、こわれた神殿のまま） */
function templeRuinTap(j){j=anc(j);if(S.obj[j]!=='statueb')return false;
  S.obj[j]='site';S.dyn[j]={build:'statue',p:0,need:BL.statue.time,ruin:1};for(const k of templeRuinCells(j).slice(1)){S.obj[k]='site2';S.ref[k]=j}
  sfx('twood');toast('せいれいが神殿を直しにきてくれる');recount();dirty=true;renderQuest();return true}
function putNear(s,id,cx,cy){for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const k=(cy+dy)*W+cx+dx;if(!s.obj[k]&&s.ground[k]!==1&&!s.floor[k]){s.obj[k]=id;return}}}
function ensureStor(s){for(const id in BL){const b=BL[id];if(b&&(b.offerOnly||b.shopOnly)&&b.kind==='furn'){if(s.recipes)delete s.recipes[id];if(s.guardianIdeas)delete s.guardianIdeas[id]}}/* おそなえされる家具は、レシピとして出さない（セーブからも消す） */
  {const nm=new Set();for(let j=0;j<s.obj.length;j++)if(s.obj[j]==='grave'&&s.dyn&&s.dyn[j]&&!s.dyn[j].buried)nm.add(s.dyn[j].name);for(const r of s.res||[])if(r.coffin)nm.add(r.coffin.name);if(!s.wipe)for(const L of[s.buried||[],s.lost||[]])for(const q of L)if(nm.has(q.name))q.unb=true}/* まだ埋葬されていない子は、よみがえらせない */
  for(const k in s.hp||{})if(/^\d+$/.test(k)&&typeof s.hp[k]==='number')s.hp[k]=Math.ceil(s.hp[k]);/* 耐久は整数 */
  if(!s.lost)s.lost=[];syncQuestRecipes(s)}

/* 特性：ひとりにひとつ。キーキャラは決まっている */
const TRK=el=>Object.keys(TRAITS).filter(k=>k!=='kizuna'&&k!=='tane'&&k!=='nebari'&&k!=='daichi'&&(k!=='shukaku'||el==='wood'));/* しゅうかく上手は木の子だけ（収穫をするのは木の子） *//* たねはこびは風の子だけ（mkRes）。料理じょうずはなくした（料理は、その属性の子だけが作り、時間はいつも料理の time） */const TRAITS={hayaashi:['はやあし','移動速度+6'],hataraki:['はたらきもの','はたらく速さ+6'],shukaku:['しゅうかく上手','畑や木の実の収穫+1'],kikori:['木こり','木を切ると、木材+1'],ishiku:['石工','石をほると、石材+1'],chikara:['力もち','持てる数+2'],shoshoku:['小食','おなかのへる速さ0.8倍'],tafu:['タフ','スタミナ+6'],nebari:['ねばりづよい','スタミナ+10・つかれのとれる速さ2倍'],daichi:['だいちのちから','スタミナ+10・つかれのとれる速さ2倍・おなかが0になるとき、近くのみどりのマス1つで、おなか+10'],/* だいちのちからは、フタバだけ（daichi.js） */kizuna:['めぐり','消えても、つぎの朝にもどってくる'],/* ねばりづよい・めぐりは、キーキャラだけ（TRK でのぞく）。ねばりづよいは、章のはじめからいる子 */genki:['元気いっぱい','たのしさのへる速さ0.6倍'],tane:['たねはこび','外のふしぎな種をひろいに行く']};
const EL_BASE={wood:{work:20,move:20,sta:20,cap:1},water:{work:26,move:20,sta:14,cap:1},fire:{work:20,move:20,sta:20,cap:1},earth:{work:16,move:18,sta:26,cap:1},wind:{work:18,move:26,sta:16,cap:1}};/* Lv1の能力（属性ごと。はたらく速さ・移動速度・スタミナの合計は、どれも60）。20がふつうの速さ（STD） */
const EL_GROW={fire:{atk:[1,20],work:80,move:80,cap:25},earth:{atk:[1,10],work:120,move:60,cap:45},wood:{atk:[1,8],work:90,move:80,cap:30},water:{atk:[1,4],work:110,move:70,cap:25},wind:{atk:[1,6],work:70,move:120,cap:25}};/* レベルが上がるたびに、[いちばん少ない,いちばん多い] のどれかだけふえる。数だけの物は、この%で+1（100をこえた分は、かならず+1。120なら+1と、20%でもう+1） */
const EL_ATK={fire:10,earth:8,wood:5,water:0,wind:3};/* Lv1の攻撃力 */
const GRDEV=20;/* せいれいごとの、のびやすさ：能力ごとに－20〜+20（1きざみ） */
const VRDEV=[-6,-4,-2,0,2,4,6];/* 個体ごとのばらつき：はたらく速さ・移動速度・スタミナを、それぞれ、この中から */
function vrInt(V){if(V&&V.iv!==3){const K=['pow','spd','sta'];if(V.iv!==2){if(!V.iv)for(const k of K)V[k]=Math.round(((V[k]==null?1:V[k])-1)*10);for(const k of K)V[k]=(V[k]||0)*10}for(const k of K)V[k]=Math.round((V[k]||0)/5);V.iv=3}return V}/* 前のセーブ：倍率（1がふつう）・10がふつう・100がふつうだったころの数を、20がふつうの、たす数にかえる（iv が 3 なら、もうかえてある。100がふつうの数（iv 2）は÷5してまるめる） */
const trt=(r,k)=>!!(r&&r.vr&&r.vr.tr===k),recK=r=>(trt(r,'nebari')||trt(r,'daichi')?2:1)*gearStat(r).rec*(1+(typeof pathA==='function'?pathA('rec'):0)/100);/* recK：つかれのとれる速さ（ねばりづよい子は2倍） */
/* せいれいごとのばらつき：色(h色相・l明るさ)、まつ毛・ほっぺ、足の速さ・食べる量・力 */
const KEYVR={'フタバ':{key:true,tr:'daichi',h:0,l:0,lash:false,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.18},'ノドカ':{key:true,tr:'tafu',h:0,l:0,lash:false,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.02},'ホムラ':{key:true,tr:'nebari',pk:'fireA',h:0,l:0,lash:false,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.08},'ハヤテ':{key:true,tr:'hayaashi',pk:'wind',h:10,l:.02,lash:false,cheek:false,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.16},'カザネ':{key:true,tr:'nebari',pk:'wind',h:0,l:0,lash:false,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.1},'トト':{key:true,tr:'nebari',h:0,l:0,lash:false,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.32},'ハニ':{key:true,tr:'tafu',h:0,l:.02,lash:true,cheek:false,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.06},'シズク':{key:true,tr:'hataraki',h:0,l:0,lash:false,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.12},'ミオ':{key:true,tr:'nebari',h:-10,l:.03,lash:true,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.2},'カガリ':{key:true,tr:'',pk:'fireA',h:4,l:.03,lash:true,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.2},'ホノ':{key:true,tr:'',pk:'fireB',h:-6,l:.04,lash:false,cheek:false,spd:0,eat:1,pow:0,sta:0,iv:3,vo:.95},'アオ':{key:true,tr:'shoshoku',h:8,l:0,lash:true,cheek:false,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.12},'フウ':{key:true,tr:'hayaashi',pk:'wind',h:0,l:-.03,lash:true,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.05}};
function mkVar(name,el){if(KEYVR[name])return Object.assign({},KEYVR[name]);const R=()=>Math.random()*2-1,D=()=>pick(VRDEV);const sg=Math.random()<.5?-1:1;return{h:Math.round(sg*(12+Math.random()*33)),l:Math.round(R()*14)/100,lash:Math.random()<.4,cheek:Math.random()<.5,spd:D(),eat:Math.round((1+R()*.2)*100)/100,pow:D(),sta:D(),iv:3,vo:Math.round((1.12+R()*.16)*100)/100,tr:pick(TRK(el))}}
function mkRes(s,name,elem,x,y,like){
  return {id:s.nid++,xp:0,xpf:0,name,elem,color:ELEM[elem].body,x,y,hunger:400,energy:85,fun:70,like:like||pick(LIKE_KEYS.filter(k=>(k!=='slide'||WD===WIND)&&!nigate(elem,k))),act:null,path:[],starve:0,bubble:'',face:1,hidden:false,hurt:0,vr:Object.assign(mkVar(name,elem),{tk:tokuiPick(elem)})};/* tk：はじめからの得意な仕事（events.js） */
}

function genWorld(s,w){
  const R=mulberry(w===1?20261102:w===FREE?20261022:w===YAMI?20261120:w===WIND?20261120:w===TSUCHI?20261123:20261018),V=w===1,K=w===WIND,T=w===TSUCHI;/* T：ひびわれた岩の谷（地われと、まわりのがけ） *//* V：火山のふもと。K：風のやんだ空の村（浮き島と雲の海） */
  const pond=(cx,cy,rx,ry)=>{const a=R()*6.28,b=R()*6.28,e=R()*6.28;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,th=Math.atan2(dy,dx),lim=1+.2*Math.sin(2*th+a)+.13*Math.sin(3*th+b)+.07*Math.sin(5*th+e);if(Math.hypot(dx,dy)<lim)s.ground[y*W+x]=1}};
  const VL=valleyOn(s,w);/* フリーモードの花の谷（free.js） */
  if(VL){for(const[px,py,rx,ry]of VPONDS)pond(CX+px,CY+py,rx,ry)}
  else if(K){/* 風：まん中の大きな島・そのまわりの7つの島・すみの小さな島。島でない所は、ぜんぶ雲の海（ground 1。歩けない・橋はかけられる。skyJ） */
    const land=new Uint8Array(W*H);let nI=0;const isle=(cx,cy,rx,ry)=>{const a=R()*6.28,b=R()*6.28,e=R()*6.28,id=++nI,far=(x,y)=>{for(let q=-4;q<=4;q++)for(let p=-4;p<=4;p++){const v=land[(y+q)*W+x+p];if(v&&v!==id)return false}return true};/* ほかの島とは、4マスあける（島どうしが、くっつかないように） */for(let y=5;y<H-5;y++)for(let x=5;x<W-5;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,th=Math.atan2(dy,dx),lim=1+.14*Math.sin(2*th+a)+.1*Math.sin(3*th+b)+.06*Math.sin(5*th+e);if(Math.hypot(dx,dy)<lim&&far(x,y))land[y*W+x]=id}};
    isle(CX,CY,19,18);const ring=[];for(let k=0;k<7;k++){const an=.45+k*6.2832/7+(R()-.5)*.25,ds=35.5+R()*2.5,r=9+R()*3.5,cx=CX+Math.cos(an)*ds,cy=CY+Math.sin(an)*ds;ring.push([cx,cy]);isle(cx,cy,r,r*(.82+R()*.2))}
    for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){/* 四すみの小さな島（入る所だけ）：そのすみにいちばん近い島の、たてか、よこの先に5マスあけて置く（橋はまっすぐ10マスまでなので、ななめの先には置かない） */
      let bk=0,bv=-1e9;ring.forEach((p,k)=>{const v=(p[0]-CX)*sx+(p[1]-CY)*sy;if(v>bv){bv=v;bk=k}});const id=bk+2;let x0=W,x1=0,y0=H,y1=0;for(let j=0;j<W*H;j++)if(land[j]===id){const x=j%W,y=(j/W)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
      const rx=4.5+R()*1.5,ry=4+R()*1.5,vy=(sy>0?y1+1:y0)+sy*(5+ry),hx=(sx>0?x1+1:x0)+sx*(5+rx);
      if(vy-ry>=6&&vy+ry<=H-6)isle((sx>0?x1-3:x0+4),vy,rx,ry);else if(hx-rx>=6&&hx+rx<=W-6)isle(hx,(sy>0?y1-3:y0+4),rx,ry)}
    for(let j=0;j<W*H;j++)s.ground[j]=land[j]?0:1;
    pond(CX+4.8,CY+4.8,2.4,1.7);pond(CX+6.4,CY+3.7,1.3,1);pond(ring[1][0],ring[1][1],2.6,2);pond(ring[4][0],ring[4][1],2.4,1.9)}/* 島の中の池（本物の水） */
  else if(T){pond(CX+4.8,CY+4.8,2.4,1.7);pond(CX+6.4,CY+3.7,1.3,1);tsRift(s,R)}/* 土：まん中のわき水と、谷をたてに割る地われ（tsuchi.js） */
  else if(V){pond(OFF+12,OFF+58,3.4,2.4);pond(OFF+60,OFF+14,2.8,2);pond(CX+4.8,CY+4.8,2.4,1.7);pond(CX+6.4,CY+3.7,1.3,1);pond(HSPC.b[0],HSPC.b[1],2.4,1.7);pond(HSPC.c[0],HSPC.c[1],2.2,1.6)}/* 温泉（はじめは冷えている） */
  else{pond(OFF+8,OFF+10,5,3.6);pond(OFF+11.5,OFF+12.5,3,2.2);pond(OFF+62,OFF+60,6,3.6);pond(OFF+58.5,OFF+58,2.6,2);pond(OFF+60,OFF+8,3,2.4);pond(CX+4.8,CY+4.8,2.4,1.7);pond(CX+6.4,CY+3.7,1.3,1);pond(CX+3.6,CY+6.6,1.2,.9);pond(10,30,4,3);pond(96,70,4.5,3);pond(40,98,3.5,2.6);pond(80,6,3,2.2)}/* 外がわにも池 */
  for(let pass=0;pass<2;pass++){const g=s.ground.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x,n=(g[j-1]===1)+(g[j+1]===1)+(g[j-W]===1)+(g[j+W]===1);if(g[j]===1&&n<=1)s.ground[j]=0;else if(g[j]!==1&&n>=3)s.ground[j]=1}}
  if(!K)for(let y=CY+12;y<H;y++)s.floor[y*W+CX]='path';/* 風：島の外（雲の海）へは、道をのばさない */
  const VR=VL?new Float64Array(W*H).fill(-1):null;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x;if(s.ground[i]===1)continue;
    const dx=Math.max(Math.abs(x+.5-CX)-8,0),dy=Math.max(Math.abs(y+.5-CY)-8,0),out=Math.max(dx,dy);
    if(x===CX&&y>=CY+11&&!K)continue;
    if(VL){VR[i]=R();continue}/* 花の谷の自然の物は、段差を作ったあとに置く（valleyPlace） */
    const ox=x-OFF,oy=y-OFF,forest=V?(ox<14&&oy<16):(ox>54&&oy<24)||(ox<16&&oy>48);/* 森は、前からの土地の角から、外がわへつづく */
    const r=R();
    if(out<1.2){ // 基地の中：枯れ木と岩がちらばる
      const core=Math.abs(x+.5-CX)<7&&Math.abs(y+.5-CY)<7;
      if(!core&&r<(V?.03:.05))s.obj[i]='deadtree';else if(!core&&r<(V?.09:.08))s.obj[i]='rock';else if(V&&!core&&r<.12)s.obj[i]='bamboo';/* 火山：基地の中にも竹が少し */
      continue}
    if(forest){if(r<.38)s.obj[i]=V&&r>=.19?'bamboo':w===FREE?'ntree':'deadtree';/* 火山の森は、枯れ木と竹が半分ずつ *//* 敷地の外の木は、みんな枯れている（フリーモードはべつ） */else if(r<.42)s.obj[i]='rock';else if(r<.435&&!V){s.obj[i]='berry';s.dyn[i]={g:100}}}/* ベリーの茂みは、前の4分の1（火山にはない） */
    else if(T){if(r<.05)s.obj[i]='deadtree';else if(r<.16)s.obj[i]='rock'}/* 土：岩が多い。木はオリーブ（STAGE の sx） */
    else if(V){if(r<.05)s.obj[i]='deadtree';else if(r<.13)s.obj[i]='rock';else if(r>=.16&&r<.17)s.obj[i]='deadtree';/* 火山にベリーの茂みはない */else if(r<.19)s.obj[i]='bamboo'}/* 火山のふもとは岩が多い。竹も少し */
    else{if(r<.07)s.obj[i]='deadtree';else if(r<.1)s.obj[i]='rock';else if(r<.1075){s.obj[i]='berry';s.dyn[i]={g:100}}else if(r>=.13&&r<.15)s.obj[i]=w===FREE?'ntree':'deadtree'}
  }
  for(let y=CY-8;y<CY+12;y++)if(w!==0||y<CY-3||y>CY+2)s.floor[y*W+CX]='path';/* 草原：まん中は御神木の切り株（4×4）。道は、南から切り株の前まで・北は神殿から切り株のうしろまで */
  if(VL)wildGen(s);/* 野の花（家・畑を置く前。置いたあとで、もう1回かたづける） */
  if(!V&&!K&&w!==FREE){let best=-1,bd=1e9;for(let y=CY-6;y<=CY+6;y++)for(let x=CX-6;x<=CX+6;x++){const j=y*W+x;if(s.ground[j]===1||s.obj[j]||s.floor[j]||x===CX)continue;if([j-1,j+1,j-W,j+W].some(k=>s.ground[k]===1))continue;const d=Math.hypot(x+.5-(CX-3),y+.5-(CY+3));if(d<bd){bd=d;best=j}}if(best>=0)s.obj[best]='ntree'}/* 草原の拠点に、森の木が1本だけ（ほかの木は、みんな枯れている） */
  if(V){/* 火山のふもと：南西に古い家（下の壁がくずれている）、北東に2×2の畑、砂利の道が十字に通る */
    const x0=CX-9,x1=CX-4,y0=CY+3,y1=CY+7;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const j=y*W+x;s.obj[j]='';s.ground[j]=0;const edge=x===x0||x===x1||y===y0||y===y1;if(!edge){s.floor[j]='floor';continue}if(y===y1&&x>=x0+1&&x<=x0+3){s.floor[j]='';continue}/* はじめは壁がこわれている（クエストで直す） */const door=x===x1&&y===CY+5;s.obj[j]=door?'door':'bamboowall';s.floor[j]=door?'gravel':'';if(!door)s.hp[j]=BL.bamboowall.hp}/* 火山の古い家は竹の壁 */
    for(let x=x1+1;x<CX;x++){const j=(CY+5)*W+x;s.obj[j]='';s.floor[j]='gravel'}/* 家の戸口から、砂利の道へ */
    for(let x=CX-7;x<=CX+8;x++)if(!s.obj[(CY+1)*W+x])s.floor[(CY+1)*W+x]='gravel';for(let y=CY+2;y<CY+12;y++)s.floor[y*W+CX]='gravel';
    for(let y=CY-5;y<=CY-4;y++)for(let x=CX+3;x<=CX+4;x++){const j=y*W+x;s.obj[j]='farm';s.floor[j]='';s.dyn[j]={g:50,wet:0,crop:'imo'}}}/* 最初の畑は4つ（2×2）。作物は、はじめはいもだけ */
  else{const G0=w===0,ox=G0?-2:0,oy=G0?-1:0,hx=dx=>CX+dx+(dx<0?ox:0),hy=y=>y+oy;/* 草原：家は北西（切り株のななめうしろ）、畑はその戸口の向かい（北東）。ほかのステージは前のまま */
  for(let d=3;d<=6;d++)for(let y=CY-5;y<CY-2;y++){const j=hy(y)*W+hx(-d);s.floor[j]='floor';if(G0)s.obj[j]=''}/* 草原の家は、まん中の7マスの外にもかかるので、家の中の枯れ木・岩をどける */
  for(let d=1;d<=2+(G0?-ox:0);d++)s.floor[hy(CY-4)*W+CX-d]='path';/* 戸口から、まん中の道まで */
  for(let y=CY-6;y<=CY-2;y++)for(let d=2;d<=7;d++){if(d>2&&d<7&&y>CY-6&&y<CY-2)continue;const x=hx(-d),j=hy(y)*W+x;if(y===CY-2&&d>=3&&d<=5){if(G0)s.obj[j]='';continue}/* はじめは壁がこわれている（クエストで直す） */s.obj[j]=(d===2&&y===CY-4)?'door':'hwall';s.floor[j]=s.obj[j]==='door'?'path':'';if(s.obj[j]==='hwall')s.hp[j]=BL.hwall.hp}
  for(let d=1;d<=4;d++){const j=hy(CY-4)*W+CX+d;s.obj[j]='farm';s.floor[j]='';s.dyn[j]={g:50,wet:0,crop:'imo'}}/* 最初の畑は4つ。家の道をはさんだ向かいに横1列。作物は、はじめはいもだけ */
  if(G0){const gap=new Set([(CY)*W+CX-3,(CY-2)*W+CX+2,(CY+2)*W+CX-1,(CY-3)*W+CX-2]);for(let y=CY-3;y<=CY+2;y++)for(let x=CX-3;x<=CX+2;x++){const e=(y===CY-3||y===CY+2)+(x===CX-3||x===CX+2);if(!e||e===2)continue;const j=y*W+x;if(gap.has(j)||s.ground[j]||s.obj[j]==='ntree')continue;if(s.obj[j]&&HI_OK.has(s.obj[j]))s.obj[j]='';if(!s.obj[j])s.floor[j]='path'}}/* 草原：御神木の切り株をかこむ、あぜ道の輪（まわり1マス。角はまるく、ところどころとぎれる。南北のまん中の道とつながる） */
  if(G0)s.flags.home2=1;/* 家・畑・切り株の、まん中のならび（starterGapCells） */
  if(T){for(let y=CY-6;y<=CY-2;y++)for(let d=2;d<=7;d++){const j=y*W+hx(-d);if(s.obj[j]==='hwall'||y===CY-2&&d>=3&&d<=5){s.obj[j]='adobewall';s.floor[j]='';s.hp[j]=BL.adobewall.hp}else if(s.obj[j]==='door')s.obj[j]='itado'}}/* 土：家は日干しれんがの壁と木のいた戸。こわれていない */
  if(K||T){if(K)for(let d=3;d<=5;d++){const j=(CY-2)*W+hx(-d);s.obj[j]='canvaswall';s.floor[j]='';s.hp[j]=BL.canvaswall.hp}/* 風（土台）：家はこわれていない。木箱は、道の東に1つ */
    const fr=k=>!s.obj[k]&&s.ground[k]!==1&&!s.floor[k];let p=-1;for(let r=0;r<8&&p<0;r++)for(let dy=-r;dy<=r&&p<0;dy++)for(let dx=-r;dx<=r;dx++){const k=(CY+1+dy)*W+CX+3+dx;if(fr(k)&&fr(k-1)&&fr(k+1)){p=k;break}}if(p>=0)s.obj[p]='crate'}
  }
  if(V){const put=id=>{let best=-1,bd=1e9;for(let y=CY-7;y<CY;y++)for(let x=CX-6;x<CX;x++){const j=y*W+x;if(s.ground[j]===1||s.obj[j]||s.floor[j])continue;if([j-1,j+1,j-W,j+W,j-W-1,j-W+1,j+W-1,j+W+1].some(k=>s.ground[k]===1||s.obj[k]==='crate'))continue;const d=Math.hypot(x+.5-(CX-3),y+.5-(CY-3.5));if(d<bd){bd=d;best=j}}if(best>=0)s.obj[best]=id};{const j=(CY+4)*W+CX-8;s.obj[j]='crate';s.floor[j]='floor'}put('crate');for(let y=CY-13;y<CY-8;y++){const j=y*W+CX;if(!s.obj[j]&&s.ground[j]!==1)s.floor[j]='path'}st2Place(s)}/* 火山のふもと：木箱は古い家の中と、村の北西に（コワイノは南から来るので） */
  if(VL)wildPurge(s);
  if(K)windGen(s,R);/* 風穴と古い風車（wind.js） */
  genLand(s,w);if(T)tsPost(s)/* 土：北のがけのあなぐまの巣穴・自然の岩の橋（段差のあと） *//* 川と段差（いちばん最後：ほかの物をおいたあと） */;if(VL){valleyPlace(s,VR);wildPurge(s)}/* 火山の鉱脈は、お話が進むと目をさます（oreWakeTick） */
}

/* ---------- 火山のふもと（ステージ2）：温泉3か所・火山・熱の道 ---------- */
const SPR_EFF={a:.3,b:.7,c:.8};/* 温泉の効き目：入口はつかれ－0.3/秒、西はたのしさ+0.7/秒、奥は出たあと、その日のおなかのへりかた0.8倍 */
const SPR_TXT={a:'入っているあいだ、つかれ－27／1時間',b:'入っているあいだ、たのしさ+63／1時間',c:'出たあと、その日のおなかのへりかた0.8倍'};
const HSPC={a:[CX+4.8,CY+4.8],b:[CX-8.5,CY-8],c:[CX+.5,CY-15]},SPN={a:'入口の温泉',b:'西の温泉',c:'奥の温泉'};
const VOLJ=(OFF+1)*W+(CX-1),D1=(OFF+9)*W+(CX-4),D2=(CY-18)*W+(CX+5),CRACKS=[-2,-1,0,1,2].map(d=>(OFF+9)*W+CX+d),BVOL=[D2-1,D2+1,D2-W,D2+W];
const ASHT=new Set(['oven','bench','takebench','tub','sink','campfire','hotstone']);
const NATK=['rock','vcopper','viron','vobsid','vsilver','vgold','deadtree','ntree','berry','bamboo','takenoko'];
const festOn=()=>!!S&&VOLK()&&S.festDay!=null&&(S.festDay===dayNo()||S.festDay===dayNo()-1&&hour()<6);/* おまつり：その日の朝6時まで */
function festStart(){S.festN=(S.festN||0)+1;/* おまつりをひらいた回数 */const L=WD===KAZAN?[[HOMURA,'おまつりかい！ ちょうちんの火、いい色だねえ。'],[SHIZUKU,'みなさんで、おどりましょう。ごちそうもありますよ。'],[HOMURA,'たまには、こういう日もいいもんさ。']]:[[POKO,'#surprise|わあ、おまつりだ！ ちょうちんが、いっぱい！'],[MINA,'みんなで、おどろうねぇ。ごちそうもあるよぉ。'],[POKO,'ヌシ様にも、この景色を見せてあげたいな。']];talkOnce('fest1',L.filter(l=>S.res.some(r=>r.name===l[0])))}/* はじめてのおまつりの会話 */
function festBegin(){S.festAtQ=QUESTS[S.quest]&&QUESTS[S.quest].id;/* どのクエストのときにひらいたか（前にひらいたおまつりは、クエストの数に入れない） */for(const r of S.res){r.fun=100;r.energy=100;spawnFX(r.x-.5,r.y-.6,'#ffd84a')}sfx('level');toast('おまつりがはじまった！ 屋台がならんでいる','good');festStart()}/* おまつりの朝：せいれいの半分が、屋台の店番をする */
function festGift(){if(S.festDay==null||S.festDay>=dayNo()||S.festGot===S.festDay)return;S.festGot=S.festDay;const fl=['salvia','lotus','lily','clover','bellf'].filter(id=>S.unlocked[id]);/* おまつりのおみやげ：はじめはちょうちん。あとは、ちょうちんか、おぼえた花のたね5つ */
  if(!S.flags.festGift1||!fl.length||Math.random()<.4){S.flags.festGift1=1;giveItem('chochin',1);toast('おまつりのおみやげ：おまつりのちょうちん','good')}else{const id=pick(fl);giveItem(id,5);toast('おまつりのおみやげ：'+BL[id].name+'のたね5つ','good')}renderPalette()}
const FESTC={k:null,L:[]};function festPoles(){const r=12,k=WD+':'+r;if(FESTC.k!==k){FESTC.k=k;const L=[],a=CX-r-1,b=CX+r,c=CY-r-1,d=CY+r,n=b-a,m=Math.ceil(n/4);for(let i=0;i<=m;i++){const t=Math.round(i*n/m);L.push([a+t,c],[a+t,d]);if(i>0&&i<m)L.push([a,c+t],[b,c+t])}FESTC.L=L.filter(([x,y])=>x>=0&&y>=0&&x<W&&y<H)}return FESTC.L}/* おまつりのちょうちんの柱：神殿のまわり24×24マスの1マス外を、4マスくらいずつ（かどにも1本） */
function drawFestPole(x,y,now){if(!FESTA.ok)return;const h=hour(),on=h>=18||h<6,f=FESTA.F[on?'pole_on':'pole_off'],x0=x*TS+16-7,y0=y*TS+30-f[3];shadow(ctx,x*TS+16,y*TS+29,6,2);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.drawImage(FESTA.img,f[0],f[1],f[2],f[3],x0,y0,f[2],f[3]);ctx.imageSmoothingEnabled=sm;
  if(on){const lx=x0+17,ly=y0+20,g=ctx.createRadialGradient(lx,ly,1,lx,ly,14);g.addColorStop(0,'rgba(255,190,110,.35)');g.addColorStop(1,'rgba(255,190,110,0)');ctx.fillStyle=g;ctx.fillRect(lx-14,ly-14,28,28)}}/* 夕方からちょうちんがともる */
/* おまつり（屋台・ちょうちん）は火山だけ（festOn の WD===KAZAN）。草原にはない */const STALLM={wood:{nm:'りんごあめ',e:'🍭',col:'#d8452f',L:[['f','ringoame',15]]},fire:{nm:'たこ焼き・焼きそば',e:'🐙',col:'#e07a2a',L:[['f','takoyaki',20],['f','yakisoba',20]]},water:{nm:'かき氷',e:'🍧',col:'#4a8fd8',L:[['f','kakigori',15],['mebuki',400]]},earth:{nm:'ポテト',e:'🍠',col:'#9a6a3a',L:[['f','yakiimo',15]]},wind:{nm:'わたあめ・わなげ',e:'🍬',col:'#3aa88a',L:[['f','wataame',15],['chochin',60]]}};/* せいれいの屋台：店番の子の属性で、売る物がかわる。['f',食べ物,パワー]は5つ。木材・石材は売らない */
const STALLSAY=['いらっしゃい！','どれにする？','できたてだよ！','おまつりだから、とくべつだよ！'];
function festStalls(){if(!festOn()||festBase()<0||hour()<7)return [];const sh=Math.min(4,Math.floor((hour()-7)/3)),k=dayNo()+':'+sh;if(S.fst&&S.fst.k===k)return S.fst.L;/* 3時間ごとに店番が交代 */
  const R=S.res.filter(r=>!r.hidden),n=Math.floor(R.length/2),r0=12,y=CY-r0-1,P=[];
  for(let d=0;P.length<n&&d<=r0;d+=3)for(const x of d?[CX-d,CX+d]:[CX]){if(P.length>=n||x-1<CX-r0||x+1>CX+r0-1)continue;if([x-1,x,x+1].every(q=>walk(y*W+q)&&!S.obj[y*W+q])&&walk((y+1)*W+x))P.push(x)}/* 屋台は、ちょうちんの柱の上がわの列に、まんなかから3マスずつならべる */
  const C=R.map(r=>({r,n:(r.fkD===dayNo()?r.fkN||0:0)+Math.random()*.5})).sort((a,b)=>a.n-b.n),K=[],el=new Set();for(const c of C)if(K.length<P.length&&!el.has(c.r.elem)){el.add(c.r.elem);K.push(c.r)}for(const c of C)if(K.length<P.length&&!K.includes(c.r))K.push(c.r);/* まだ店番をしていない子から。属性はなるべくばらばらに */
  for(const r of K){if(r.fkD!==dayNo()){r.fkD=dayNo();r.fkN=0}r.fkN++}
  S.fst={k,L:K.map((r,i)=>({x:P[i],y,id:r.id,el:r.elem}))};return S.fst.L}
function festSpot(G,f,maxD){const L=[];for(let k=0;k<W*H;k++){const d=G.dist[k];if(d<0||d>maxD||!walk(k)||S.obj[k]||roomOf(k)||(TAKEN&&TAKEN.has(k))||!f(k))continue;L.push(k)}return L.length?pick(L):-1}/* 条件にあうマスから、ランダムに1つ */
function festAct(r,G){if(festBase()<0)return false;const h=hour(),ib=k=>VILL[k];
  if(h>=20&&h<21){const j=festSpot(G,ib,12);if(j>=0){startAct(r,G,'hanabi',j);return true}return false}/* 夜8時から9時は、花火を見る */
  if(h<7||h>=22)return false;if(r.fyD!==dayNo()){r.fyD=dayNo();r.fyN=0}
  {const t=festStalls().find(t=>t.id===r.id);if(t){startAct(r,G,'shopkeep',(t.el==='wind'?t.y+1:t.y)*W+t.x,{sk:S.fst.k});return true}}/* 店番の子は、自分の屋台へ（わたあめの屋台は、屋台の前） */
  const x=Math.random();
  if(x<.3){const FBJ=festBase(),cx=FBJ%W+.5,cy=((FBJ/W)|0)+3.5;const j=nearest(G,k=>{const d=Math.hypot(k%W+.5-cx,((k/W)|0)+.5-cy);return d>=1.6&&d<=2.8&&walk(k)&&!S.obj[k]},80);if(j>=0){startAct(r,G,'bon',j,{cx,cy});return true}}/* 神殿の前で、おどりの輪 */
  if(x<.5&&(r.fyN||0)<3){const L=festStalls().filter(t=>{const q=S.res.find(o=>o.id===t.id);return q&&q.act&&q.act.type==='shopkeep'&&q.act.stage==='do'});if(L.length){const t=pick(L),j=nearest(G,k=>((k/W)|0)===t.y+1&&Math.abs(k%W-t.x)<=1&&!(t.el==='wind'&&k%W===t.x)&&walk(k)&&free('yt'+k,1),80);if(j>=0){startAct(r,G,'yatai',j,{key:'yt'+j,sx:t.x});return true}}}/* 店番のいる屋台（1日3回まで） */
  if(x<.72&&trySocial(r,G))return true;/* おまつりのおしゃべり */
  const j=festSpot(G,k=>ib(k)&&Math.hypot(k%W+.5-r.x,((k/W)|0)+.5-r.y)>=4,30);if(j>=0){startAct(r,G,'fwalk',j);if(r.fsnack&&Math.random()<.6)r.bubble=r.fsnack;return true}/* 村の中を、ぶらぶら見てまわる */
  return false}
for(const id in STAGEONLY)Object.defineProperty(BL[id],'offerOnly',{get:()=>WD!==STAGEONLY[id]&&!grec(id),configurable:true});/* ステージの物は、そのステージで作れる。ほかのステージでは、おぼえるまではおそなえだけ */for(const id in BL){const b=BL[id];if(b.mat1||b.mat3||b.mat4||b.mat5){const m0=b.mat;b.mat0=m0;Object.defineProperty(b,'mat',{get:()=>WD===KAZAN&&b.mat1?b.mat1:WD>1&&b['mat'+WD]?b['mat'+WD]:m0,configurable:true})}}/* mat1：火山・mat3：水・mat4：風・mat5：闇での素材（実数で書いてある）。mat0：ほかのステージの素材（matHere がステージにかかわらず読む） */
const FLAM=new Set(Object.keys(BL).filter(id=>id!=='hwall'&&id!=='door'&&id!=='yozoradoor'&&(()=>{const b=BL[id],m=b.mat||{};return (b.kind==='furn'||b.kind==='block'||b.kind==='build')&&(m.wood>0||m.bamboo>0)&&!m.stone&&!b.natural&&id!=='torch'&&id!=='candle'})()));/* 火山のふもとで燃える物：木材だけで作る家具・柵・壁など（たいまつ・ろうそくは、もともと火がついている物なのでのぞく） */
const burnHp=o=>BL[o].hp||10,fireAt=j=>WD===KAZAN&&!!S.st2&&!!S.st2.fire&&S.st2.fire[j]!=null;/* じょうぶさのない家具は、燃えるときだけ10とする */
function ignite(j){if(WD!==KAZAN||!S.st2)return;const o=S.obj[j];if(!FLAM.has(o))return;const F=S.st2.fire||(S.st2.fire={});if(F[j]!=null)return;F[j]=S.t;toast(BL[o].name+'が燃えている！','warn');sfxAt('cookfire',j%W+.5,(j/W)|0)}
function fireTick(dt){if(WD!==KAZAN||!S.st2||!S.st2.fire)return;const F=S.st2.fire;for(const k in F){const j=+k,o=S.obj[j];if(!FLAM.has(o)){delete F[k];continue}S.hp[j]=(S.hp[j]??burnHp(o))-dt/15;/* 燃えているあいだ、15分ごとにじょうぶさが1へる */
  if(S.hp[j]<=0){(S.broken||(S.broken=[])).push({j,id:o,L:S.hp['L'+j],rot:rotAt(j)});delete F[k];sfxAt('wbreak',j%W+.5,(j/W)|0);clearObj(j);recount();dirty=true;toast(BL[o].name+'が燃えてこわれた','warn')}}}
function sparkTick(){if(WD!==KAZAN||!S.st2||isNight()||elemCount('water')<1||Math.random()>=.05)return;/* 火の粉：昼のあいだ、1時間に5%（水の子が来てから） */const L=[];for(let j=0;j<W*H;j++){const o=S.obj[j];if(FLAM.has(o)&&!fireAt(j)&&VILL[j]&&!HOUSES.some(h=>h.inside.has(j)))L.push(j)}if(!L.length)return;const j=L[(Math.random()*L.length)|0];
  fxSpr('cinder',(j%W+.5)*TS,((j/W)|0)*TS+24);ignite(j)}/* 家の中の物には、火の粉はとどかない */
/* 奥の装置のまわりの大岩（BVOL）は、かたくて、たたいてもくだけない。まもりの光で熱すると赤くなり（S.st2.hot：マス→さめる時刻 S.t）、赤いあいだに、せいれいが水をかけると、われる（quench）。
   水をかけるのは水のせいれい（村にいなければ、だれでも）。赤いあいだは時計の2時間（ROCKHOT） */
/* たけのこをタップ：とる・そだてる をえらぶ。そだてる印（S.dyn[j].keep）のたけのこは、せいれいがとらず（g を0にする）、3日で竹になる */
function takenokoPop(j){const d=S.dyn[j]||(S.dyn[j]={g:100,age:0}),left=Math.max(1,3-(d.age||0)),P=pxPop('たけのこ'),p=el('<p class="note" style="margin:0 0 10px"></p>');p.textContent='あと'+left+'日で竹になる。'+(d.keep?'いまは、そだてている。':'いまは、せいれいがとる。');P.body.appendChild(p);
  const row=el('<div style="display:flex;gap:8px"></div>'),mk=(tx,keep)=>{const b=el('<button class="btn"></button>');b.textContent=tx;if(!!d.keep===keep)b.classList.add('pri');b.onclick=()=>{sfx('tap');if(S.obj[j]==='takenoko'){const q=S.dyn[j]||(S.dyn[j]={g:100,age:0});if(keep){q.keep=1;q.g=0}else{delete q.keep;q.g=100}dirty=true}P.close()};row.appendChild(b)};mk('とる',false);mk('そだてる',true);P.body.appendChild(row)}
function takenokoKeepDraw(c,x,y){c.save();c.fillStyle='#6fae4a';c.fillRect(x+15,y+9,2,4);c.fillRect(x+13,y+10,2,2);c.fillRect(x+17,y+10,2,2);c.fillStyle='#a9d77a';c.fillRect(x+15,y+9,1,2);c.restore()}/* そだてる印：先に小さな葉 */
const yuN=()=>['a','b','c'].filter(k=>S.st2&&S.st2.yuS&&S.st2.yuS[k]).length;/* 湯めぐり：だれかが入った温泉の数 */
const ROCKHOT=120;
const rockHard=j=>WD===KAZAN&&!S.free&&S.obj[j]==='boulder'&&BVOL.includes(j);
const rockHot=j=>rockHard(j)&&!!(S.st2&&S.st2.hot&&S.st2.hot[j]>S.t);
function rockHeat(j){const t=st2();(t.hot||(t.hot={}))[j]=S.t+ROCKHOT;const x=j%W,y=(j/W)|0;burstAt(x+.5,y+.5,'furn');sfxAt('cookfire',x,y);dirty=true}
function goQuench(r,G){if(WD!==KAZAN||!S.st2||!S.st2.hot||isNight())return false;if(r.elem!=='water'&&S.res.some(q=>q.elem==='water'&&!q.hidden&&!q.coffin))return false;const ks=BVOL.filter(j=>rockHot(j)&&free('hot'+j,1));if(!ks.length)return false;const hit=k=>ks.includes(k);const j=nearest(G,q=>adjOf(q,hit)>=0,150);if(j<0)return false;const t=adjOf(j,hit);startAct(r,G,'quench',j,{key:'hot'+t,obj:t,run:true});return true}
function rockCrack(j){const t=st2();if(t.hot)delete t.hot[j];delete S.hp['n'+j];const x=j%W,y=(j/W)|0;fxSpr('rockbreak',(x+.5)*TS,(y+.8)*TS);sfxAt('pour',x,y);for(let i=0;i<8;i++)fx.push({k:'p',x:(x+.2+Math.random()*.6)*TS,y:(y+.4)*TS,vx:(Math.random()-.5)*12,vy:-22-Math.random()*16,life:1.1,col:'#ffffff',r:2});/* 湯気 */if(typeof juiceBreak==='function')juiceBreak(j,'stone');clearObj(j);burst(j,'block');recount();checkQuest()}
function rockHotDraw(c,x,y,now){const f=(Math.sin(now/260)+1)/2;c.save();c.globalAlpha=.45+.3*f;c.fillStyle='#ff7a3a';for(const[a,b,w,h]of[[13,11,2,3],[14,14,2,3],[16,17,2,3],[15,20,2,4],[18,19,4,2],[22,21,3,2],[8,17,3,2],[6,19,2,3]])c.fillRect(x+a,y+b,w,h);c.globalAlpha=.6+.3*f;c.fillStyle='#ffd27a';for(const[a,b]of[[14,13],[16,18],[20,20],[8,18]])c.fillRect(x+a,y+b,1,1);c.restore()}
function goDouse(r,G){if(WD!==KAZAN||!S.st2||!S.st2.fire||isNight())return false;const ks=Object.keys(S.st2.fire).map(Number).filter(j=>free('fire'+j,1));if(!ks.length)return false;const hit=k=>ks.includes(anc(k));const j=nearest(G,q=>adjOf(q,hit)>=0,150);if(j<0)return false;const t=anc(adjOf(j,hit));startAct(r,G,'douse',j,{key:'fire'+t,obj:t,run:true});return true}/* 水の子は、昼のあいだ、燃えている物を消しにいく */
function drawFire1(j,now){{const o=S.obj[j];if(!o)return;const z=szAt(o,j)||[1,1],x=(j%W)*TS,y=((j/W)|0)*TS,n=z[0]*2,b=y+TS*z[1]-8;
  for(let m=0;m<n;m++){const fx=Math.round(x+6+m*(TS*z[0]-12)/Math.max(1,n-1)),h=Math.round(9+Math.sin(now/110+m*1.7+j)*3+(m%2?2:0));ctx.fillStyle='#d8431c';ctx.fillRect(fx-3,b-h,6,h);ctx.fillStyle='#ff9a2e';ctx.fillRect(fx-2,b-h+3,4,h-3);ctx.fillStyle='#fff1a8';ctx.fillRect(fx-1,b-Math.round(h*.45),2,Math.round(h*.45))}
  const sm=(now/1400+j*.37)%1;ctx.fillStyle='rgba(90,80,78,'+(.45*(1-sm))+')';ctx.fillRect(Math.round(x+TS*z[0]/2-3+Math.sin(now/500+j)*3),Math.round(b-16-sm*22),6,6)}}/* 燃えている物：ドットのほのおと、けむり（物を描いたすぐあとに重ねる） */
const burnt=q=>{const o=S.obj[q];return FLAM.has(o)&&!breakable(o)&&!DEFS.has(o)&&S.hp[q]!=null&&!fireAt(q)};/* 燃えて、じょうぶさがへった家具 */
function st2(){return S.st2||(S.st2={sp:{a:0,b:0,c:0},d1:1,d2:1,d2fix:0,hvb:{},ash:{},ashKills:0,bw:[]})}
const ashed=j=>WD===KAZAN&&!!S.st2&&S.st2.ash[j]>S.t;
function springOn(k){if(WD!==KAZAN||!k)return false;if(S.st2&&S.st2.frz&&S.st2.frz[k])return false;/* 最後の夜に冷やされた温泉 */if(k==='a')return !!S.flags.onsen;const t=S.st2;if(!t||!t.sp[k])return false;if(t.hvb[D1])return false;if(k==='c'&&t.hvb[D2])return false;return true}
const SPEDGE=new Map();function springEdge(k){const M=sprMap();let c=SPEDGE.get(M);if(!c){c={};SPEDGE.clear();SPEDGE.set(M,c)}if(!c[k]){const L=[];for(let j=0;j<W*H;j++){if(M[j]!==k)continue;for(const q of[j-1,j+1,j-W,j+W])if(q>=0&&q<W*H&&walk(q)&&!L.includes(q))L.push(q)}c[k]=L}return c[k]}/* 温泉のふち（歩けるマス） */
const springN=()=>['a','b','c'].filter(springOn).length;
const springDone=()=>(S.flags.onsen?1:0)+(S.st2&&S.st2.sp.b?1:0)+(S.st2&&S.st2.sp.c?1:0);
let SPRM=null,SPRS=null;
function sprMap(){if(SPRS===S&&SPRM)return SPRM;SPRS=S;SPRM=new Array(W*H).fill('');const seen=new Uint8Array(W*H);
  for(let j=0;j<W*H;j++){if(S.ground[j]!==1||seen[j])continue;const comp=[],q=[j];seen[j]=1;
    while(q.length){const k=q.pop();comp.push(k);const x=k%W;for(const n of[x>0?k-1:-1,x<W-1?k+1:-1,k-W,k+W]){if(n<0||n>=W*H||seen[n]||S.ground[n]!==1)continue;seen[n]=1;q.push(n)}}
    let best='',bd=4;for(const key in HSPC){const[cx,cy]=HSPC[key];for(const k of comp){const d=Math.hypot(k%W+.5-cx,((k/W)|0)+.5-cy);if(d<bd){bd=d;best=key}}}
    if(best)for(const k of comp)SPRM[k]=best}
  return SPRM}
const hotW=j=>WD===KAZAN&&S.ground[j]===1&&springOn(sprMap()[j]);
function nearHot(j,r){const x=j%W,y=(j/W)|0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;if(hotW(yy*W+xx))return true}return false}
const nearSp=id=>S.obj.some((o,j)=>(id==='bench'?BENCHES.has(o):o===id)&&nearHot(j,4));/* ベンチは竹のベンチもふくむ *//* 温泉のそば（4マス以内） */
const FLOWERS2=['clover','bellf','salvia','lily','lotus'];
/* 冷たい温泉を調べよう：調べた水たまり（西 b・奥 c）。前のセーブの true は、調べおわったことにする。sprLast は、さいごに調べた温泉（vol:touchH でホムラが歩いていく所） */
function sprLookN(){const f=S.flags.sprLook;if(f===true)return 2;return f&&typeof f==='object'?(f.b?1:0)+(f.c?1:0):0}
function sprLookTap(k){if(WD!==KAZAN)return;const f=S.flags.sprLook;if(f===true)return;const o=f&&typeof f==='object'?f:(S.flags.sprLook={});if(k==='a'||o[k])return;o[k]=1;S.flags.sprLast=k;checkQuest()}
function spNear(ids,k){if(!springOn(k))return 0;const M=sprMap();let n=0;for(let j=0;j<W*H;j++){if(!ids.includes(S.obj[j])||isBud(j))continue;/* 花は、さいてから数える */const x=j%W,y=(j/W)|0;let ok=false;for(let dy=-4;dy<=4&&!ok;dy++)for(let dx=-4;dx<=4;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(S.ground[q]===1&&M[q]===k){ok=true;break}}if(ok)n++}return n}/* その温泉のそば（4マス以内）にある数 */
const tkGot=()=>{const t=st2();return Math.max(0,(t.tkGot||0)-(t.tkBase||0))};/* たけのこのクエスト：うけてから、せいれいがとった、たけのこの数 */
function takenokoSpawn(n){/* 村に近い竹のとなりに、たけのこを生やす（すでに生えている分もかぞえる） */if(WD!==KAZAN)return;let have=0;for(let j=0;j<W*H;j++)if(S.obj[j]==='takenoko')have++;const c=[];for(let j=0;j<W*H;j++){if(S.obj[j]!=='bamboo')continue;const x=j%W;for(const k of[j-1,j+1,j-W,j+W])if(k>=0&&k<W*H&&Math.abs(k%W-x)<=1&&!S.obj[k]&&!S.floor[k]&&S.ground[k]===0&&!RFC.has(k)&&flatAt(k)&&!c.some(q=>q[1]===k))c.push([Math.hypot(k%W-CX,((k/W)|0)-CY),k])}c.sort((a,b)=>a[0]-b[0]);for(const[,k]of c){if(have>=n)break;S.obj[k]='takenoko';S.dyn[k]={g:100,age:0};have++}recount();dirty=true}
function takenokoStart(){const t=st2();t.tkBase=t.tkGot||0;takenokoSpawn(3)}/* たけのこのクエストをうけたとき：数えはじめを決めて、近くに生やす */
function yoganHeatN(){/* 熱が流れている熱の道から3マス以内にある、ようがん台の数 */if(WD!==KAZAN||!S.st2)return 0;const L=heatLines().filter(l=>l.on&&!l.smoke);let n=0;for(let j=0;j<W*H;j++){if(S.obj[j]!=='yogan')continue;const x=j%W+1,y=((j/W)|0)+1;const sd=(a,b)=>Math.max(Math.max(Math.min(a[0],b[0])-x,0,x-Math.max(a[0],b[0])),Math.max(Math.min(a[1],b[1])-y,0,y-Math.max(a[1],b[1])));if(L.some(l=>l.p.some((q,i)=>i&&sd(l.p[i-1],q)<=3)))n++}return n}
function innHouse(){/* 温泉宿：あたたかい温泉のそばの家で、家から4マス以内に露天ぶろがある */if(WD!==KAZAN)return null;const ons=[];for(let j=0;j<W*H;j++)if(S.obj[j]==='onsen')ons.push(j);if(!ons.length)return null;for(const h of HOUSES){const ins=[...h.inside];if(!ins.some(j=>nearHot(j,6)))continue;const cells=h.set?[...h.set]:ins;for(const o of ons){const ox=o%W,oy=(o/W)|0;if(cells.some(j=>{const x=j%W,y=(j/W)|0;return Math.max(Math.max(ox-x,0,x-(ox+1)),Math.max(oy-y,0,y-(oy+1)))<=4}))return {h,onsen:o}}}return null}
function st2Place(s){
  const stash=j=>{const o=s.obj[j];if(o&&o!=='part'&&BL[o]&&BL[o].kind&&!BL[o].natural)s.inv[o]=(s.inv[o]||0)+1;if(o)for(const k in s.ref)if(s.ref[k]===j){s.obj[k]='';delete s.ref[k]}if(s.obj[j]==='part'){const a=s.ref[j];if(a!=null&&s.obj[a])stash(a)}s.obj[j]='';delete s.dyn[j];delete s.ref[j];s.ground[j]=0};
  for(let y=OFF;y<=OFF+6;y++)for(let x=CX-3;x<=CX+3;x++)stash(y*W+x);
  s.obj[VOLJ]='volcano';for(let b=0;b<3;b++)for(let a=0;a<3;a++){const q=VOLJ+b*W+a;if(q!==VOLJ){s.obj[q]='part';s.ref[q]=VOLJ}}
  for(const j of[D1,D2,...CRACKS,...BVOL])stash(j);
  s.obj[D1]=s.obj[D2]='heatv';CRACKS.forEach(j=>s.obj[j]='crack');BVOL.forEach(j=>s.obj[j]='boulder');
  const c=[];for(let y=CY-12;y<=CY-4;y++)for(let x=CX-13;x<=CX-3;x++){const j=y*W+x;if(s.ground[j]===1||s.floor[j])continue;if(s.obj[j]&&!NATK.includes(s.obj[j]))continue;if(![j-1,j+1,j-W,j+W].some(k=>s.ground[k]===1))continue;c.push([Math.hypot(x+.5-(CX-5.5),y+.5-(CY-8)),j])}
  c.sort((a,b)=>a[0]-b[0]);const bw=c.slice(0,3).map(q=>q[1]);bw.forEach(j=>{s.obj[j]='boulder';delete s.dyn[j]});/* 西の温泉の水路をふさぐ大岩 */
  s.st2={sp:{a:0,b:0,c:0},d1:1,d2:1,d2fix:0,hvb:{},ash:{},ashKills:0,bw}}
function springFX(k){const[cx,cy]=HSPC[k];sfx('level');toast(SPN[k]+'に、あたたかい湯がもどった！','good');logEv(SPN[k]+'がよみがえった');memo('sun',SPN[k]+'がよみがえった');
  fxSpr('spring',cx*TS,cy*TS);}
function st2Tick(){if(WD!==KAZAN||!S.st2)return;const t=S.st2;
  if(!t.sp.b&&t.d1===0&&t.bw.every(j=>S.obj[j]!=='boulder')&&!t.hvb[D1]){t.sp.b=1;dirty=true;springFX('b');checkQuest()}
  if(!t.sp.c&&t.d1===1&&t.d2fix&&t.d2===0&&CRACKS.every(j=>S.obj[j]!=='crack')&&!t.hvb[D1]&&!t.hvb[D2]){t.sp.c=1;dirty=true;springFX('c');checkQuest()}
  for(const k in t.ash)if(t.ash[k]<=S.t||!S.obj[k])delete t.ash[k]}
function volSpot(){for(let r=0;r<8;r++)for(let k=0;k<30;k++){const x=CX+Math.round((Math.random()*2-1)*(r+1)),y=OFF+6+Math.round(Math.random()*(r+1)),j=y*W+x;if(x>0&&y>0&&x<W&&y<H&&walk(j))return [x+.5,y+.5]}return spawnSpot()}
function heatLines(){const t=S.st2,ok=k=>!t.hvb[k],L=[],h1=ok(D1),cr=CRACKS.every(j=>S.obj[j]!=='crack'),h2=h1&&t.d1===1&&cr&&t.d2fix&&ok(D2);
  L.push({p:[[CX+.5,OFF+4.4],[CX+.5,OFF+7],[CX-3.5,OFF+7],[CX-3.5,OFF+9.5]],on:true});
  L.push({p:[[CX-3.5,OFF+9.5],[HSPC.b[0],OFF+9.5],[HSPC.b[0],HSPC.b[1]-1.6]],on:h1&&t.d1===0});
  L.push({p:[[CX-3.5,OFF+9.5],[CX+5.5,OFF+9.5],[CX+5.5,CY-17.5]],on:h1&&t.d1===1,leak:!cr});
  L.push({p:[[CX+5.5,CY-17.5],[CX+1.5,CY-17.5],[CX+1.5,HSPC.c[1]-1.4]],on:h2&&t.d2===0});
  L.push({p:[[CX+5.5,CY-17.5],[CX+8.5,CY-17.5]],on:h2&&t.d2===1,smoke:1});return L}
let WARMK='',WARM=new Set();function warmSet(){/* 熱の道（熱が流れている線）から3マス以内の畑は、あたたかい畑 */if(WD!==KAZAN||!S.st2)return WARM;const t=S.st2,k=[t.d1,t.d2,t.d2fix,JSON.stringify(t.hvb),CRACKS.map(j=>S.obj[j]==='crack'?1:0).join(''),counts.farm||0,S===WARM.s].join('|');if(k===WARMK)return WARM;WARMK=k;WARM=new Set();WARM.s=S;const L=heatLines().filter(l=>l.on);for(let j=0;j<W*H;j++){if(S.obj[j]!=='farm')continue;const x=j%W+.5,y=((j/W)|0)+.5;const sd=(a,b)=>Math.max(Math.max(Math.min(a[0],b[0])-x,0,x-Math.max(a[0],b[0])),Math.max(Math.min(a[1],b[1])-y,0,y-Math.max(a[1],b[1])));if(L.some(l=>l.p.some((q,i)=>i&&sd(l.p[i-1],q)<=3)))WARM.add(j)}return WARM}
let HGK='',HGP=[];function heatPts(){/* 熱が流れている熱の道の上に、1マスごとの点（夜の光） */const t=S.st2,k=[S===HGP.s,t.d1,t.d2,t.d2fix,JSON.stringify(t.hvb),CRACKS.map(j=>S.obj[j]==='crack'?1:0).join(''),S.flags.onsen?1:0].join('|');if(k===HGK)return HGP;HGK=k;HGP=[];HGP.s=S;for(const l of heatLines()){if(!l.on)continue;for(let i=1;i<l.p.length;i++){const a=l.p[i-1],b=l.p[i],n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])));for(let s=i===1?0:1;s<=n;s++)HGP.push([a[0]+(b[0]-a[0])*s/n,a[1]+(b[1]-a[1])*s/n])}}return HGP}
function heatGlow(c,x0,x1,y0,y1,cut){/* cut：暗さをけずる。0：あたたかい色をほんの少し */if(WD!==KAZAN||!S.st2)return;const R=cut?30:22;c.save();if(cut)c.globalAlpha=.5;else c.globalAlpha*=.8;for(const[x,y]of heatPts()){if(x<x0-2||x>x1+2||y<y0-2||y>y1+2)continue;c.drawImage(lightSpr(R),x*TS-R,y*TS-R,R*2,R*2)}c.restore()}
/* よみがえった温泉の石組み：水のマスの形を、角を丸めたなめらかな形（あけしめ：けずってからふくらませ、ふくらませてからけずる。半径 RIMR）にして、そのふちに石（rim:c0〜3）を1こずつならべる。石が、水のマスの角をかくすので、温泉が丸く見える。温泉の水・よみがえりがかわったときだけ作りなおす */
const RIMR=16,RIMG=2,RIMSP=11;/* 丸める半径・しらべる細かさ・石の間かく（世界のドット） */
let RIMK='',RIMS=[],RIMN=-1,RIMW='';
function rimStones(){const t=S.st2,M=sprMap();if(RIMN!==STATN||RIMS.s!==S){RIMN=STATN;let h=0,c=0;for(let j=0;j<W*H;j++)if(M[j]&&S.ground[j]===1){h=(h*31+j)|0;c++}RIMW=c+':'+h}/* 下絵が作りなおされたときだけ、温泉の水のマスを数えなおす */const key=[RIMW,S.flags.onsen?1:0,t.sp.b,t.sp.c,JSON.stringify(t.frz||{}),JSON.stringify(t.hvb||{})].join('|');if(key===RIMK&&RIMS.s===S)return RIMS;RIMK=key;RIMS=[];RIMS.s=S;
  for(const k of['a','b','c']){if(!springOn(k))continue;const T=[];for(let j=0;j<W*H;j++)if(M[j]===k&&S.ground[j]===1)T.push(j);if(!T.length)continue;
    let x0=1e9,y0=1e9,x1=-1,y1=-1;for(const j of T){const x=j%W,y=(j/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}x0--;y0--;x1+=2;y1+=2;
    const n=TS/RIMG,gw=(x1-x0)*n,gh=(y1-y0)*n,g=new Uint8Array(gw*gh);for(const j of T){const tx=(j%W-x0)*n,ty=(((j/W)|0)-y0)*n;for(let b=0;b<n;b++)for(let a=0;a<n;a++)g[(ty+b)*gw+tx+a]=1}
    const r=RIMR/RIMG,D=[];for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++)if(a*a+b*b<=r*r)D.push([a,b]);
    const morph=(src,grow)=>{const o=new Uint8Array(gw*gh);for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){let v=grow?0:1;for(const[a,b]of D){const xx=x+a,yy=y+b,s=xx<0||yy<0||xx>=gw||yy>=gh?0:src[yy*gw+xx];if(grow?s:!s){v=grow?1:0;break}}o[y*gw+x]=v}return o};
    const m=morph(morph(morph(morph(g,false),true),true),false);/* 角を丸める（出た角も、へこんだ角も） */
    const B=[];for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){const i=y*gw+x;if(m[i]&&(!m[i-1]||!m[i+1]||!m[i-gw]||!m[i+gw]))B.push([x0*TS+(x+.5)*RIMG,y0*TS+(y+.5)*RIMG])}
    const P=[];for(const q of B)if(!P.some(p=>Math.hypot(p[0]-q[0],p[1]-q[1])<RIMSP))P.push(q);
    for(const q of P)RIMS.push({x:Math.round(q[0]),y:Math.round(q[1]),v:(hash(q[0]*7+q[1]*13)*4)|0})}
  RIMS.sort((p,q)=>p.y-q.y);return RIMS}
function drawOnsenRim(x0,x1,y0,y1,now){if(WD!==KAZAN||!S.st2)return;const C=window.CHIPS;if(!C||!C['rim:c0'])return;
  for(const s of rimStones()){if(s.x<x0*TS-32||s.x>(x1+1)*TS+32||s.y<y0*TS-32||s.y>(y1+1)*TS+32)continue;isoStand(ctx,gFoot(s.x+16,s.y+16),()=>drawChip(ctx,C['rim:c'+s.v],'rim',s.x,s.y,now))}}/* クォータービュー：石は、その所に立てて */
function drawHeat(now){if(WD!==KAZAN||!S.st2)return;const c=ctx;c.save();for(const j of warmSet()){const x=(j%W)*TS,y=((j/W)|0)*TS,ph=((now/1600+j*.13)%1);c.fillStyle='rgba(255,170,90,'+(.35*(1-ph))+')';isoCell(c,j,()=>c.fillRect(Math.round(x+8+((j*7)%16)),Math.round(y+22-ph*16),3,3))}/* あたたかい畑：ゆらゆらと熱がのぼる */c.lineCap='round';c.lineJoin='round';
  for(const l of heatLines()){c.beginPath();l.p.forEach((q,i)=>i?c.lineTo(q[0]*TS,q[1]*TS):c.moveTo(q[0]*TS,q[1]*TS));c.setLineDash([]);c.strokeStyle='rgba(60,45,38,.35)';c.lineWidth=9;c.stroke();c.strokeStyle='#8f7b6c';c.lineWidth=5;c.stroke();
    if(l.on){c.strokeStyle='rgba(255,140,60,.95)';c.lineWidth=3.2;c.setLineDash([7,9]);c.lineDashOffset=-now/40;c.stroke();c.setLineDash([]);
      if(l.smoke||l.leak){const e=l.smoke?l.p[l.p.length-1]:[CX+.5,OFF+9.5];const sm=()=>{for(let k=0;k<3;k++){const ph=((now/1800+k/3)%1);c.fillStyle='rgba(120,110,105,'+(.45*(1-ph))+')';c.beginPath();c.arc(e[0]*TS+Math.sin(now/600+k)*4,e[1]*TS-8-ph*30,5+ph*9,0,7);c.fill()}};isoStand(c,gFoot(e[0]*TS,e[1]*TS),sm)}}}/* けむりは、立てて */
  c.restore()}

/* ---------- ヘルパー ---------- */
const clk=()=>S.t-(S.hold||0);/* 時計の時刻 */
const hour=()=>(clk()/60)%24;function skyHour(){const h=hour();return WD===YAMI&&!S.cleared?yamiSkyHour(h):h}/* 空・光・環境音に使う時刻（闇のステージは、ずっと夜） */
const dayNo=()=>Math.floor(clk()/1440)+1;
const callDay=()=>Math.floor((clk()-360)/1440)+1;/* なかまを呼ぶ「1日」は、朝6時から朝6時まで（夜中の0時でかわらない） */

const nightLock=()=>S&&S.enemyOn&&isNight();/* 夜（コワイノの時間）は、建てることも解体もできない */
const isNight=()=>{const h=hour();return h>=23||h<6},isDark=()=>{const h=hour();return h>=21||h<6};/* せいれいが寝るのは23時 */
function foeAt(e,r){/* コワイノ e が、せいれい r の3マス以内か、r のいる家の中にいる */if(r.hidden||r.coffin)return false;if(Math.max(Math.abs(e.x-r.x),Math.abs(e.y-r.y))<=(r.gear&&gearStat(r).fear?2:3))return true;/* そうび：こわがるきょり2マス */const h=roomOf((r.y|0)*W+(r.x|0));return !!h&&h.set.has((e.y|0)*W+(e.x|0))}
function nearRes(e){return e.hitT!=null&&S.t-e.hitT<5||S.res.some(r=>foeAt(e,r))||foeHitsFire(e)||foeStealing(e)}
function foeStealing(e){return e.stealKey!=null&&S.t-(e.busyT??-1e9)<1}/* 箱・畑からぬすんでいる（カゲドロボウ） */
function sortieOn(){return !!(S&&(S.free||S.flags&&S.flags.sortie))}/* 出撃（サブクエスト sortie を受けたら、えらべる。草原でおぼえたら、ほかのステージでも） */
function sortieGuard(r){return !!r&&WD===KUSA&&!!S&&r.name===POKO&&!!(S.flags&&S.flags.guard)}/* こもれびのまもりをおぼえたフタバは、出撃をえらべる（はじめは出撃する） */
function sortieOK(r){return r.elem!=='light'&&r.elem!=='dark'&&(sortieOn()||sortieGuard(r))}/* 光・闇のせいれいは、たたかわない */
function sortieDef(r){return r.elem==='fire'||sortieGuard(r)}/* はじめの出撃：火のせいれいと、こもれびのまもりをおぼえたフタバ */
function fighter(r){if(!r)return false;if(kiriSitting(r))return false;/* 草原の転のあと、花畑がおわるまで、フタバはたたかわない（kiri.js） */if(r.name===POKO&&WD===KUSA&&S.ns&&S.ns.final&&isNight())return true;/* 草原のさいごの夜は、フタバはかならず出撃 */if(!sortieOK(r))return r.elem==='fire';return r.sortie==null?sortieDef(r):r.sortie===true}/* 夜にコワイノと近接でたたかう子。r.sortie：えらんだ出撃（なければ sortieDef） */
function foeHitsFire(e){if(typeof e.tg!=='number')return false;const q=S.res.find(q=>q.id===e.tg);return !!q&&fighter(q)&&!q.hidden&&Math.hypot(q.x-e.x,q.y-e.y)<((EN[e.type]||{}).rng||1)+.5}/* 火のせいれいをたたいているコワイノ（とどかない所からでも、火のせいれいが近よって攻撃する） *//* だれかの3マス以内・だれかのいる家に来たコワイノと、塀・壁・建物をこうげきしているコワイノ（火の子がむかえうつ） */
const anc=j=>{if(S.obj[j]==='part'||(S.obj[j]==='site2'&&S.ref[j]!=null))return S.ref[j];if(S.obj[j]==='site2')for(const k of[j-1,j+1,j-W])if(S.obj[k]==='site')return k;return j};/* 古いセーブの神殿の足場にも対応 */
const typeAt=j=>S.obj[anc(j)];

const solidOf=j=>{const o=typeAt(j);return !!(o&&BL[o]&&BL[o].solid)};
const FRONTS=new Set(['chair','achair','sofa1','bench','g_w_stump','g_k_egg','g_f_sofa','g_s_sofa']);/* 正面のある家具（置くときに矢印を出す） */const ROTS={chair:4,achair:4,sofa1:4,bench:4,bed:2,yorubed:2,sandbox:2,arch:2,ltable:2,bathtub:2,slide:1,seesaw:1,swing:2,signpost:1,vane:1,kazami:4,oven:4,stairs_wood:5,stairs_stone:5,stairs_brick:5,slope_earth:5,cabinet:3,shelf1:3,shelf2:3,makidana:3,crate:4,wbench:4,cooktable:4,sink:4,loom:4,mill:4,smelter:4,g_w_kinoko:4,g_w_acorn:4,g_w_clover:4,g_w_shelf:4,g_w_stump:4,g_e_planter:4,g_e_lantern:4,g_e_bath:4,g_e_arch:4,g_e_geode:4,g_f_hanger:4,g_f_lamp:4,g_f_table:4,g_f_screen:4,g_f_sofa:4,g_k_fan:4,g_k_egg:4,g_k_screen:4,g_k_chest:4,g_s_jelly:4,g_s_vanity:4,g_s_table:4,g_s_tank:4,g_s_sofa:4,g_k_bed:2};/* 限定の家具：前・右・後ろ・左（雲のベッドは、ふつうのベッドと同じ横・縦） *//* 向きをかえられる家具。4：前・右・後ろ・左　3：前・右・左（右は「id>1」の絵、左はその反転）　2：横・縦　1：左右反転だけ */
const BEDHX=31,BEDHY=-1,BEDVY=8.5,BEDHS=.85;const BEDXY={g_k_bed:[[32,5],[31,41]]};/* 1マスでないベッド：寝る子の足もと（置いたマスの左上から。[たて,横]） *//* 横のベッド：寝る子の足もと（x,y）。たてのベッド：寝る子の足もとのy。BEDHS：横向きで寝るときの、せいれいの横はば。ふとんは重ねない（ベッドの上に寝る子をかく） */
const ROTN=id=>ROTS[id]===5?4:ROTS[id]===4?4:ROTS[id]===3?3:ROTS[id]?2:1,ROTL={5:[,'手前へ','右へ','左へ','奥へ'],4:['前','右','後ろ','左'],3:['前','右','左'],2:['横','縦'],1:['そのまま','反転']};/* 5：階段の下りる向き（S.rot は 1手前 2右 3左 4奥。0は古いセーブだけ） */
let PLROTS={};/* 置くときにえらんでいる向き（家具ごと） */
const rotAt=j=>(S&&S.rot&&S.rot[j])||0;
const szR=(id,rot)=>{const z=id==='tower'&&WD===KUSA&&S?.sacredLegacy2?[2,2]:id==='tower'&&WD===KUSA&&S?.sacredLegacy3?[3,3]:BL[id]&&BL[id].sz;if(!z)return null;return (ROTS[id]===2&&rot===1||ROTS[id]===4&&rot%2===1||ROTS[id]===3&&rot>=1)?[z[1],z[0]]:z};/* 向きをかえると、たて・よこが入れかわる */
const szAt=(id,j)=>szR(id,j==null?0:(S.obj[j]===id||S.obj[j]==='site'?rotAt(j):(PLROTS[id]||0)));
const fp=(id,x,y,rot)=>{const z=rot!=null?szR(id,rot):szAt(id,y*W+x);if(!z)return [[x,y]];const c=[];for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)c.push([x+a,y+b]);return c};
let GODJ=-1;/* カミサマの立つマス（stepWorld で毎回きめる）。だれも通れない */
/* 作業する向きがきまっている家具（WORKF）：作業するマスは、その向きの前（向き0 前＝下・1 右・2 後ろ＝上・3 左）。2×2は前の2マス、作業台は台のマス（wbCells の b）の前。
   せいれいは、そのマスに立って家具のほうを向く。どのマスも歩けない（物がある・水など）と作業できない。流し台は、せいれいの作業はないが、置くときに同じく出す */
const WORKF=new Set(['loom','mill','cooktable','sink','oven','wbench','smelter']),WORKD=[[0,1],[1,0],[0,-1],[-1,0]];
function workCells(j,id,rot){/* j：左上のマス。id・rot をわたすと、置く前の場所でも */id=id||S.obj[j];if(rot==null)rot=rotAt(j);rot&=3;const[dx,dy]=WORKD[rot];
  const cells=id==='wbench'?[rot>=2?(rot%2?j+W:j+1):j].map(b=>[b%W,(b/W)|0]):fp(id,j%W,(j/W)|0,rot),own=new Set(cells.map(([x,y])=>y*W+x)),L=[];
  for(const[x,y]of cells){const nx=x+dx,ny=y+dy,k=ny*W+nx;if(nx<0||ny<0||nx>=W||ny>=H||own.has(k)||(id==='wbench'&&own.size===1&&fp(id,j%W,(j/W)|0,rot).some(([a,b])=>b*W+a===k)))continue;L.push(k)}return L}
const workOK=j=>workCells(j).some(k=>walk(k));
let WORKBLOCKED=[];function workBlockedList(){/* 作業するマスが、どれもふさがっている家具（流し台はのぞく）の左上のマス */const L=[];for(let j=0;j<W*H;j++){const o=S.obj[j];if(o&&o!=='sink'&&WORKF.has(o)&&!workOK(j))L.push(j)}return L}/* 作業するマスが1つでも空いているか */
function workStand(G,j){/* 作業するマスのうち、いちばん近い行ける所（なければ -1） */let b=-1,bd=1e9;for(const k of workCells(j)){const d=G.dist[k];if(d<0||!walk(k)||d>=bd)continue;b=k;bd=d}return b}
/* すわる・ねる・遊ぶ家具とお墓（通れる家具）は、使うときだけ上に乗る。道さがしでは、上を通るのを大きな手間（SEATCOST）にして、ほかに道がないときだけ通る。行き先にするのは、その家具を使う行動だけ（startAct の seatStand） */
const SEATF=new Set(['bed','yorubed','chair','achair','stool','pouf','kagoisu','bench','takebench','swing','grave','g_w_kinoko','g_w_stump','g_k_egg','g_f_sofa','g_s_sofa','g_k_bed']),SEATCOST=600;
const seatJ=j=>j>=0&&j<W*H&&SEATF.has(typeAt(j));
function walkR(j){return walk(j)&&!seatJ(j)}/* せいれいが、使わずに立ってよいマス */
function seatBackStep(i,j){/* i→j が、いす・ベンチの背もたれのがわからの乗りおり（その家具のマスどうしは、のぞく） */if(typeof seatBack!=='function')return false;const ci=seatCell(i),cj=seatCell(j);if(cj&&!ci&&seatBack(j)===i)return true;if(ci&&!cj&&seatBack(i)===j)return true;return false}
function noPassJ(j){return STUMPB.has(j)||j===GODJ}/* だれも通れないマス（切り株の根もと・守り神の像）。せいれい（walk）とコワイノ（bfs0・bfsE）で同じ */
function walk(j){if(j<0||j>=W*H||S.ground[j]===1&&S.obj[j]!=='bridge'&&!windBr(j)||noPassJ(j)||fogAt(j))return false;/* 霧の中は歩かない *//* 切り株の上は歩かない */return !solidOf(j)}/* 橋の上は歩ける。浅瀬（ground 2）は歩ける（ゆっくり） */
/* 雲の海（風のステージ）：マップのはしにつながる ground 1 のマス。歩けない・置けない・橋はかけられるのは水と同じ。水としてのふるまい（水をくむ・つり・水あび・水べの生き物など）は waterJ で見て、雲の海ではしない */
let SKYS=null,SKYM=null;
function skyOf(g){const M=new Uint8Array(W*H),Q=[];const put=j=>{if(g[j]===1&&!M[j]){M[j]=1;Q.push(j)}};for(let x=0;x<W;x++){put(x);put((H-1)*W+x)}for(let y=0;y<H;y++){put(y*W);put(y*W+W-1)}
  while(Q.length){const j=Q.pop(),x=j%W;if(x>0)put(j-1);if(x<W-1)put(j+1);if(j>=W)put(j-W);if(j<W*(H-1))put(j+W)}return M}
function skyM(){if(WD!==WIND||!S)return null;if(SKYS===S)return SKYM;SKYS=S;SKYM=skyOf(S.ground);return SKYM}
let RIFTS=null,RIFTM=null;function riftM(){if(WD!==TSUCHI||!S)return null;if(RIFTS===S)return RIFTM;RIFTS=S;RIFTM=skyOf(S.ground);return RIFTM}/* 土の地われ：マップのはしにつながる ground 1（雲の海と同じ作り。セーブには入れず、地形から作る） */
const skyJ=j=>{const M=skyM();return !!M&&M[j]===1},riftJ=j=>{const M=riftM();return !!M&&M[j]===1},waterJ=j=>S.ground[j]===1&&!skyJ(j)&&!riftJ(j);/* waterJ：本物の水（池・川） */
const wetJ=j=>S.ground[j]===1&&S.obj[j]!=='bridge'&&!windBr(j)||!!fogAt(j);/* 歩けない水 */
const LIFT=32;/* 段差1だんの高さ（ドット）。正面も1マスの正方形（持ち主がきめた）。高いマスの上の物は、これだけ上に描く */
function hiAt(j){return S.hi?S.hi[j]|0:0}
function liftOf(j){const h=S.hi?S.hi[j]|0:0;return h>0?h*LIFT:0}/* 描くときに上へずらす高さ。地面より下（ほった穴）は、地面の高さのまま描く（穴の絵は pitDraw） */
const SLOPES=new Set(['slope_earth']),STAIRS=new Set(['stairs_wood','stairs_stone','stairs_brick',...SLOPES]),/* 土は坂だけ、木・石・レンガは階段だけ */SDIR=[[0,1],[1,0],[0,-1],[-1,0]];/* 階段の向き：0下 1右 2上 3左（低いほう） */
const SROT=[-1,0,1,3,2];/* 置くときにえらんだ向き（S.rot）→ 下りる向き */
function stairOK(j,d){/* j に、d の向きに下りる階段を置けるか：j のうしろが高いマス。j と、その先のマスは、低い地面（水でない） */const x=j%W,y=(j/W)|0,bx=x-SDIR[d][0],by=y-SDIR[d][1],ox=x+SDIR[d][0],oy=y+SDIR[d][1];if(bx<0||by<0||bx>=W||by>=H||ox<0||oy<0||ox>=W||oy>=H)return false;const o=oy*W+ox;const h=hiAt(j);return hiAt(by*W+bx)===h+1&&(d===0||hiAt(o)===h&&S.ground[o]!==1)}/* うしろが、ちょうど1だん高い *//* 手前向きは1マス（がけの正面を1マスと数える）、ほかは2マス */
function stairFirst(j){/* 置くときの向き：手前へ、置けなければ置ける向きのはじめ */for(let v=1;v<=4;v++){const d=SROT[v];if(!stairOK(j,d))continue;if(d){const o=stairOut(j,d);if(o<0||o>=W*H||S.obj[o]&&!WEEDS.has(S.obj[o]))continue}return v}return 1}
const stairRot=(id,j)=>PLROTS[id]>=1&&PLROTS[id]<=4?PLROTS[id]:stairFirst(j);
function stairDir(j){/* 階段は、段差の下（低い地面）に置く1×2。高いマスのほうから、はなれる向きに下りる。えらんだ向きがなければ、下・右・左・上の順にえらぶ */const v=(S.rot||{})[j];if(v)return SROT[v];for(const d of[0,1,3,2])if(stairOK(j,d))return d;return -1}
function stairOf(k){/* k が階段のマスなら、階段の本体（高いほうのはしのマス）。ちがえば -1 */if(k<0||k>=W*H||!S)return -1;const o=S.obj[k];if(STAIRS.has(o))return k;if(o==='part'){const a=S.ref[k];if(a!=null&&STAIRS.has(S.obj[a]))return a}return -1}
const stairOut=(j,d)=>j+SDIR[d][1]*W+SDIR[d][0],stairTop=(j,d)=>j-SDIR[d][1]*W-SDIR[d][0];/* 階段は1×2：本体のマスと、その先の低いほうのマス。本体のうしろが、のぼった先の高いマス */
function stairLink(a,b){/* bが階段の本体で、aがそのうしろの高いマス（のぼった先） */if(!STAIRS.has(S.obj[b]))return false;const d=stairDir(b);return d>=0&&stairTop(b,d)===a}

const HMAX=8,HMIN=-2;/* 段差は8だんまで（ほる・つむ）。地面より2だん下まで、ほれる */
function cliff2(a,b){return Math.abs(hiAt(a)-hiAt(b))>1}/* 2だん以上ちがう所（飼う生き物のかこい） */
function cliffUp(a,b){return hiAt(b)-hiAt(a)>1}/* a から b へ：2だん以上のぼれない（とびおりるのは、何だんでもできる。落下ダメージ fall.js） */
const LADDERS=new Set(['ladder_wood','ladder_bamboo']);/* ハシゴ：段差の下の低い地面に置く1マス。うしろ（手前・左右）のマスが、ちょうど1だん高い。上り下りは歩く速さ×0.5 */
function ladderDir(j){/* ハシゴの向き（0：うしろが上のマス、1：左、3：右）。置いたときの向き S.rot、なければ自動 */const v=(S.rot||{})[j];if(v!=null&&LADDERS.has(S.obj[j]))return v;const h=hiAt(j),x=j%W;for(const d of[0,1,3]){const t=j-SDIR[d][1]*W-SDIR[d][0];if(t<0||t>=W*H||Math.abs(t%W-x)>1)continue;if(hiAt(t)===h+1&&S.ground[t]!==1)return d}return -1}
const ladderTop=(j,d)=>j-SDIR[d][1]*W-SDIR[d][0];
function ladderLink(a,b){/* b がハシゴで、a がその上のマス */if(!LADDERS.has(S.obj[b]))return false;const d=ladderDir(b);return d>=0&&ladderTop(b,d)===a}
const onLadder=(a,b)=>ladderLink(b,a)||ladderLink(a,b);/* ハシゴで上り下りする1歩（ハシゴと、その上のマスのあいだ）。ハシゴのマスに横から入るのは、ふつうに歩く */
const CLB=new WeakMap(),CLBM=.1,CLBD=4;/* 段差をよじのぼる・おりるせいれい：{a:もとのマス,n:つぎのマス,px,py:よじのぼる所,k:0〜1}。ふちまでふつうに歩き、低いマスのがわ（壁の前、マスのさかいから CLBM）で、まっすぐ上・下へよじのぼる（歩く CLBD マスぶんの時間。歩く1マスとあわせて5倍） */
function clbPt(a,n){/* よじのぼる所：マスのさかいから、低いマスのがわへ CLBM */const ax=a%W+.5,ay=((a/W)|0)+.5,sx=n%W-a%W,sy=((n/W)|0)-((a/W)|0),m=hiAt(a)<hiAt(n)?-CLBM:CLBM;return{px:ax+sx*(.5+m),py:ay+sy*(.5+m)}}
function jumpEdge(a,b){return hiAt(a)!==hiAt(b)&&!stairLink(a,b)&&!stairLink(b,a)&&!ladderLink(a,b)&&!ladderLink(b,a)}/* 段差を飛ぶ所（階段で上り下りする所はちがう） */
function zAt(x,y){/* その場所の高さ（ドット）。階段の上は、高いほうのはしから低いほうへ少しずつ下がる */const c=(y|0)*W+(x|0);if(S&&LADDERS.has(S.obj[c])){const d=ladderDir(c),ax=c%W,ay=(c/W)|0,t=d===0?y-ay:d===1?x-ax:ax+1-x;return liftOf(c)+(d<0?0:LIFT*Math.max(0,Math.min(1,1-t)))}/* ハシゴの上：うしろの高いマスへ近いほど高い */const a=stairOf(c);if(a<0)return liftOf(c);const d=stairDir(a);if(d<0)return liftOf(c);const ax=a%W,ay=(a/W)|0,t=d===0?2*(y-ay):d===1?x-ax:d===2?ay+1-y:ax+1-x;return LIFT*hiAt(a)+LIFT*Math.max(0,Math.min(1,1-t/2))}/* 2マスで下がる（手前向きは1マス） */
const HI_OK=new Set(['deadtree','rock','vcopper','viron','vobsid','vsilver','vgold','berry','bamboo','tree','ntree','fruit']);/* 段差を作ってよい物（自然の物） */
const LANDSEED=w=>w===1?20261102:w===FREE?20261022:w===YAMI?20261120:w===WIND?20261120:w===TSUCHI?20261123:20261018;
function landMade(s,j){const o=s.obj[j];return !!s.floor[j]||o==='part'||!!o&&!!BL[o]&&!BL[o].natural&&!WEEDS.has(o)}/* 人の作った物（床・道・家具・建物）がある */
function genRiver(s,w,o){/* 川：草原（とフリー）は北のはしから南のはしへ、火山は西のはしから東のはしへ（南がわを横切る）。村のまん中から26〜30マスはなれて、くねくね流れる。支流が1本。浅瀬（ground 2）は、本流に3か所・支流に1か所。o.ns：火山でも南北（前の川のマスをしらべるとき）。o.dry：マスをしらべるだけ */
  o=o||{};const R=mulberry(LANDSEED(w)+333),tr=w===1&&!o.ns,side0=R()<.5?-1:1,side=tr?1:side0,base=CX+side*(26+R()*4),p1=R()*6.28,p2=R()*6.28,p3=R()*6.28,riv=new Uint8Array(W*H);
  const J=(u,v)=>tr?u*W+v:v*W+u;/* u：川をよこぎる向き、v：川の流れる向き（火山は、たてとよこを入れかえる） */
  const set=(u,v)=>{if(u<0||v<0||u>=W||v>=H)return;const j=J(u,v);if(landMade(s,j)||!o.dry&&s.ground[j]===1&&!riv[j])return;riv[j]=1};/* しらべるだけのときは、いま水のマスもかぞえる（前の川は、もう水なので） */
  const xc=v=>base+5*Math.sin(v*.09+p1)+2.5*Math.sin(v*.23+p2);
  for(let v=0;v<H;v++){const c=xc(v),wd=2.3+.9*Math.sin(v*.13+p3),a=Math.round(c-wd/2),b=Math.round(c+wd/2);for(let u=a;u<b;u++)set(u,v);const c2=xc(v+1);for(let u=Math.min(Math.round(c2-wd/2),a);u<Math.max(Math.round(c2+wd/2),b);u++)if(Math.abs(u+.5-(c+c2)/2)<wd/2+.6)set(u,v)}/* となりの行とつながるように、あいだもうめる */
  const yt=Math.round(CY+(R()<.5?-1:1)*(14+R()*14)),p4=R()*6.28,ex=side<0?0:W-1,mx=Math.round(xc(yt));/* 支流：外がわのはしから、本流へ */
  for(let u=Math.min(ex,mx);u<=Math.max(ex,mx);u++){const c=yt+3*Math.sin(u*.15+p4);for(let v=Math.round(c-1);v<Math.round(c+1);v++)set(u,v);const c2=yt+3*Math.sin((u+1)*.15+p4);if(Math.abs(c2-c)>.6)set(u,Math.round((c+c2)/2))}
  if(o.dry)return riv;
  for(let j=0;j<W*H;j++)if(riv[j]){const ob=s.obj[j];if(ob){s.obj[j]='';delete s.dyn[j];delete s.hp[j];delete s.hp['n'+j]}s.ground[j]=1}
  const ford=v=>{for(let u=0;u<W;u++){const j=J(u,v);if(riv[j]&&Math.abs(u-xc(v))<4)s.ground[j]=2}};
  for(const v of[Math.round(CY-26+R()*8),Math.round(CY-3+R()*6),Math.round(CY+20+R()*8)]){ford(v);ford(v+1)}
  {const fu=Math.round((ex+mx)/2);for(let v=0;v<H;v++){const j=J(fu,v);if(riv[j])s.ground[j]=2;const k=J(fu+(side<0?1:-1),v);if(riv[k])s.ground[k]=2}}
  return riv}
function genHeights(s,w){/* 段差：なめらかなノイズから、0〜3だんの台地。まん中も外と同じ（はじめからある物のマスと、そのまわり1マス・神殿と御神木の置き場だけ平ら）。水・浅瀬のまわり・床・人の作った物の所には作らない。となりとの差は1だんまで（段々の台地） */
  const R=mulberry(LANDSEED(w)+77),h=new Array(W*H).fill(0);
  const keep=new Uint8Array(W*H),box=(x0,y0,x1,y1)=>{for(let y=Math.max(0,y0);y<=Math.min(H-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(W-1,x1);x++)keep[y*W+x]=1};/* 平らにのこす所：はじめからある物のマスと、そのまわり1マス */
  for(let j=0;j<W*H;j++){const o=s.obj[j];if(s.floor[j]||o&&!HI_OK.has(o))box(j%W-1,((j/W)|0)-1,j%W+1,((j/W)|0)+1)}
  {let y=w===0?CY-4:CY;while(y>1&&s.floor[(y-1)*W+CX])y--;box(CX-2,y-4,CX+4,y)}/* こわれた神殿の置き場（templeRuinPlace と同じ所） */
  if(w===0)box(CX-4,CY-4,CX+3,CY+3);/* 草原：御神木の切り株（sacredRootEnsure） */box(CX-1,CY-3,CX+1,CY);/* はじめのせいれいの立つ所 */
  const ok=j=>{const x=j%W,y=(j/W)|0;if(x<2||y<2||x>=W-2||y>=H-2)return false;if(keep[j])return false;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(s.ground[j+b*W+a])return false;if(w===1&&Math.abs(x+.5-CX)<9&&y<OFF+16)return false;/* 火山：北の火口のまわりは平ら */return true};
  const oct=sc=>{const gw=Math.ceil(W/sc)+2,gh=Math.ceil(H/sc)+2,g=new Float32Array(gw*gh);for(let k=0;k<g.length;k++)g[k]=R();const sm=t=>t*t*(3-2*t);
    return (x,y)=>{const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),tx=sm(fx-ix),ty=sm(fy-iy),v=(a,b)=>g[(iy+b)*gw+ix+a];return (v(0,0)*(1-tx)+v(1,0)*tx)*(1-ty)+(v(0,1)*(1-tx)+v(1,1)*tx)*ty}};
  const VL=valleyOn(s,w),V=w===1,n1=oct(V?17:30),n2=oct(V?8:13),n3=oct(V?4:6),T=V?[.50,.58,.66]:[.53,.65,.79];/* 草原：大きくゆるやかな丘（3だんは少ない）。火山：こまかく、けわしい */
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x,f=1/* まん中も外と同じ（持ち主がきめた） */,nf=Math.min(1,Math.max(0,(CY+10-y)/50));let v=(.6*n1(x,y)+.3*n2(x,y)+.1*n3(x,y))*(.55+.45*f)+.12*f;if(V)v+=.2*nf-.08*(1-nf);/* 火山：北（火口がわ）へいくほど高い山 */if(w===TSUCHI)v+=tsWallK(x,y);/* 土：谷のまわり（東・西・北）は高いがけ */
    h[j]=VL?valleyLv(x,y,v):v>T[2]?3:v>T[1]?2:v>T[0]?1:0}
  for(let pass=0;pass<2;pass++)for(let lv=1;lv<=HMAX;lv++){const g=h.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x;let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&g[j+b*W+a]>=lv)n++;if(g[j]>=lv&&n<=2)h[j]=Math.min(h[j],lv-1);else if(g[j]<lv&&n>=6)h[j]=Math.max(h[j],lv)}}/* まわり8マスの多いほうにそろえて、ふちをまるく */
  for(let j=0;j<W*H;j++)if(h[j]&&!ok(j))h[j]=0;
  const fix=()=>{for(let it=0;it<6;it++){let ch=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x;let m=h[j];for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const xx=x+a,yy=y+b;if(xx<0||yy<0||xx>=W||yy>=H)continue;m=Math.min(m,h[yy*W+xx])}if(h[j]>m+1){h[j]=m+1;ch=1}}if(!ch)break}};/* 2マス以内との差は1だんまで（段と段のあいだの平らな所は2マス以上。がけが2だんつづけて見えないように） */
  fix();
  for(let pass=0;pass<3;pass++)for(let lv=HMAX;lv>=1;lv--){const g=h.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x,n=(g[j-1]>=lv)+(g[j+1]>=lv)+(g[j-W]>=lv)+(g[j+W]>=lv);if(g[j]>=lv&&n<2)h[j]=lv-1;else if(g[j]===lv-1&&n>=3&&ok(j))h[j]=lv}}/* ほそい所はけす、くぼみはうめる */
  fix();
  s.hi=h;treeHighFix(s)}
function treeHighFix(s){/* 木のまわり2マス・岩のまわり1マス（hiRad）は、その物より高くしない。茂み・竹（FLATR）と岩・枯れ木のまわり1マスは同じ高さ（岩・枯れ木は、はじめの地形だけ。ほる・つむの決まりは treeNextHigh）。新しいゲームの地形を作ったあと（霧・お屋敷で高さがかわったあとも）によぶ。がけのそばの枯れ木はけし、生きた木・岩は、まわりをその高さにならして、その外を2マスに1だんずつ上げる（段々。2マス以内との差は1だんまでの決まりのまま） */const h=s.hi;if(!h)return;const hi=n=>h[n]|0;const high=(j,R)=>{const x=j%W,y=(j/W)|0,hh=hi(j);for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<W&&yy>=0&&yy<H&&hi(yy*W+xx)>hh)return true}return false};
  for(let round=0;round<6;round++){/* 1マスはばの段（hiThinFix）をけすと、木・岩のまわりがかわるので、かわらなくなるまで */for(let j=0;j<W*H;j++)if(s.obj[j]==='deadtree'&&high(j,TREER)){s.obj[j]='';if(s.dyn)delete s.dyn[j]}/* 枯れ木はけす */
  for(let pass=0;pass<8;pass++){let ch=0;for(let j=0;j<W*H;j++){const R=hiRad(s.obj[j]);if(!R||!high(j,R))continue;const F=R+2*(HMAX-HMIN),x=j%W,y=(j/W)|0,hh=hi(j);for(let dy=-F;dy<=F;dy++){const yy=y+dy;if(yy<0||yy>=H)continue;for(let dx=-F;dx<=F;dx++){const xx=x+dx;if(xx<0||xx>=W)continue;const d=Math.max(Math.abs(dx),Math.abs(dy)),cap=hh+(d<=R?0:Math.ceil((d-R)/2)),n=yy*W+xx;if(hi(n)>cap){h[n]=cap;ch=1}}}}if(!ch)break}
  /* 茂み・竹（FLATR）・岩・枯れ木：まわり1マスを同じ高さにならす（岩・枯れ木のとなりに段差を作らない）。ならせない（水・物がある・2マス以内の差が1だんをこえる・木と岩の決まりにあわない）ときは、その物をけす */
  const flat=o=>FLATR.has(o)||o==='rock'||o==='deadtree',at=(x,y)=>x>=0&&x<W&&y>=0&&y<H;for(let j=0;j<W*H;j++){if(!flat(s.obj[j]))continue;const x=j%W,y=(j/W)|0,hh=hi(j),chg=[];let bad=false;
    for(let dy=-1;dy<=1&&!bad;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;if(!at(x+dx,y+dy)){bad=true;break}const n=(y+dy)*W+x+dx;if(hi(n)===hh)continue;const o=s.obj[n];if((o&&!WEEDS.has(o))||(s.floor&&s.floor[n])||s.ground[n]!==0){bad=true;break}chg.push([n,hi(n)])}
    if(!bad&&chg.length){for(const[n]of chg)h[n]=hh;for(const[n]of chg){const nx=n%W,ny=(n/W)|0;for(let dy=-2;dy<=2&&!bad;dy++)for(let dx=-2;dx<=2;dx++){if(!at(nx+dx,ny+dy))continue;const m=(ny+dy)*W+nx+dx,d=Math.max(Math.abs(dx),Math.abs(dy)),R=hiRad(s.obj[m]);if(Math.abs(hi(m)-hh)>1||(R&&d<=R&&hi(m)<hh)||(flat(s.obj[m])&&d<=1&&hi(m)!==hh)){bad=true;break}}if(bad)break}if(bad)for(const[n,v]of chg)h[n]=v}
    if(bad){s.obj[j]='';if(s.dyn)delete s.dyn[j]}}/* ならすと、ほかの木・岩のまわりが高くなることがあるので、かわらなくなるまで */
  if(!hiThinFix(s))break}}
function hiThinFix(s){/* はじめの地形：1マスはばの段（2×2のかたまりに入らない高いマス。1マスのブロックが1つ・2つならぶ所など）を1だん下げる。オートタイルの地形と同じく、段はどこも2×2以上。下げたあと、2マス以内との差は1だんまで（genHeights の fix と同じ）。かえたら true */
  const h=s.hi,hv=(x,y)=>x<0||y<0||x>=W||y>=H?-99:h[y*W+x]|0;let any=false;
  for(let it=0;it<20;it++){let ch=0;const g=h.slice(),gv=(x,y)=>x<0||y<0||x>=W||y>=H?-99:g[y*W+x]|0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=gv(x,y);if(v<=0)continue;let ok=false;for(let b=-1;b<=0&&!ok;b++)for(let a=-1;a<=0;a++)if(gv(x+a,y+b)>=v&&gv(x+a+1,y+b)>=v&&gv(x+a,y+b+1)>=v&&gv(x+a+1,y+b+1)>=v){ok=true;break}if(!ok){h[y*W+x]=v-1;ch=1}}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x;let m=h[j]|0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const q=hv(x+a,y+b);if(q!==-99&&q<m)m=q}if((h[j]|0)>m+1){h[j]=m+1;ch=1}}
    if(!ch)break;any=true}
  return any}
function genLand(s,w){if(!valleyOn(s,w)&&w!==WIND&&w!==TSUCHI)genRiver(s,w);/* 花の谷・風（島のあいだは雲の海）・土（地われ）に川はない */genHeights(s,w)}/* 地形：川（と浅瀬）、そのあと段差 */
