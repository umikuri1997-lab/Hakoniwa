'use strict';
function setWorld(w){WD=w||0;QUESTS=QL[WD];KEYRES=KEYS[WD];soupFilter()}
function soupFilter(){RECIPES=WD===0?ALLRECIPES.filter(R=>R.out!=='soup'):ALLRECIPES}/* キャベツスープはステージ2から（ステージごとに、使うレシピのリストをえらぶ） */
// 守護の台座を建てるための条件
const TOWER_MAT=()=>WD===1?{wood:150,stone:75}:{wood:100,stone:50};/* 台座を建てるときに使う木材・石材 */
function towerConds(){if(WD===1)return clearConds();const tm=TOWER_MAT();return [
  ['5つの属性のせいれいがそろう（いま'+ELEM_KEYS.filter(k=>elemCount(k)>=1).length+'/5）',ELEM_KEYS.every(k=>elemCount(k)>=1)],
  ['素材箱に'+(tm.wood+tm.stone)+'こ入る（いま'+matCap()+'こ）',matCap()>=tm.wood+tm.stone],/* 素材箱が小さいと、台座の素材がためられない */
  ['木材'+tm.wood+'・石材'+tm.stone+'（いま'+(S.mat.wood||0)+'・'+(S.mat.stone||0)+'）',(S.mat.wood||0)>=tm.wood&&(S.mat.stone||0)>=tm.stone]]}
const shLeft=()=>Math.max(0,(S.shards||0)-(S.usedSh||0));/* 火山のふもと：まだ使っていないかけらの数（装置と台座にはめると減る） */
const towerReady=()=>towerConds().every(c=>c[1]);
function clearConds(){if(WD===1){const tm=TOWER_MAT(),n=springDone(),fac=['bench','tub','noren'].filter(nearSp).length;return [
  ['温泉3か所をよみがえらせる（いま'+n+'）',n>=3],
  ['ヒノオオカゲを追いはらい、奥の装置を直す',!!S.flags.hinoDown&&!!(S.st2&&S.st2.d2fix)],
  ['温泉のそばに、ベンチ・水おけ・のれん（いま'+fac+'/3）',fac>=3],
  ['ホムラとシズクのおねがい',!!S.flags.hReq&&!!S.flags.sReq],
  ['台座にはめるヌシのかけら（いま'+shLeft()+'つ）',shLeft()>=1],
  ['素材箱に'+(tm.wood+tm.stone)+'こ入る（いま'+matCap()+'こ）',matCap()>=tm.wood+tm.stone],/* 素材箱が小さいと、台座の素材がためられない */
  ['木材'+tm.wood+'・石材'+tm.stone+'（いま'+(S.mat.wood||0)+'・'+(S.mat.stone||0)+'）',(S.mat.wood||0)>=tm.wood&&(S.mat.stone||0)>=tm.stone]]}
  const tm=TOWER_MAT(),[el,need,pw]=WD===1?['fire',6,750]:['wood',6,3000],nm=ELEM[el].name;return [
  [nm+'のせいれい'+need+'人（いま'+elemCount(el)+'人）',elemCount(el)>=need],
  ['守護の台座を建てる',cnt('tower')>=1],
  ['台座にヌシのかけらを2つはめる（いま'+Math.min(2,S.setSh||0)+'つ）',(S.setSh||0)>=2],
  ['みどりのマス'+GRASS_GOAL+'（いま'+GRASSN+'）',GRASSN>=GRASS_GOAL],
  ['せいれいパワーを'+pw+'集める（いま'+Math.floor(S.totalPt)+'）',S.totalPt>=pw]]}
const clearReady=()=>clearConds().every(c=>c[1]);
function finalCheck(){if(WD||!S||S.cleared||S.finalNight||S.finalOn||!S.enemyOn||S.flags.finalWon)return;/* 勝ったあとは、もう来ない */if(S.finalLost!=null&&dayNo()-S.finalLost<3)return;if(S.res.length<5)return;if(!S.res.some(r=>r.name===POKO))return;/* フタバがいるときだけ *//* ヨルノオオカゲに負けたら3日あける。せいれいが5人以上になってから */if(cnt('tower')>=1&&clearReady()){
  if(S.finalDay==null){if(isNight())return;S.finalDay=dayNo()+3;S.finalHint=3;memo('🌑','夜の空気が、すこし重くなってきた');talkOnce('finalAnn'+S.finalDay,sevLines([['F','#think|……ねえ。なんだか、夜の風がつめたくなってきた気がする。'],['N','台座の力に、なにかが気づいたのかもしれないねぇ……。',1]]),0);return}/* 予告：すぐには来ない。3日後の夜に来る */
  const left=S.finalDay-dayNo();if(left>0){if(left<S.finalHint&&!isNight()){S.finalHint=left;toast(left===2?'遠くの森が、いつもより静かだ……':'夜になると、影がざわめいている気がする……','warn')}return}/* 日ごとに、少しずつにおわせる */
  S.finalNight=true;const rn=S.rushN||0;if(!rn)memo('🌑','台座の力に、影たちがひきよせられてきた');setTimeout(()=>toast(rn===0?'台座にあつまった力に、影たちがひきよせられている……。今夜、群れがやってくる':rn===1?'影の群れは、まだあきらめていない……。今夜も来る':'今夜は、もっと大きな影の気配がする……','warn'),900)}}/* 予告から3日後の夜から：影の群れの夜が2回、3回目の夜にヨルノオオカゲ（負けたあとは、ヨルノオオカゲの夜だけ） */

/* ---------- 状態 ---------- */
let S=null;
const resv=new Map();
let STATUE=-1,OBOX=-1,BOARD=-1,counts={},LIGHTS=[],LITP=[],STELES=[],TOWERS=[],NEARFLOWER=new Set(),NEARWELL=new Set(),NEARMILL=new Set(),NEARVANE=new Set(),NEARCART=new Set(),NEARSIGN=new Set(),NEARPARA=new Set(),SPOTJ=new Map(),SPOTM=new Map(),SPOTI=[],RUGC=new Map(),RFC=new Map(),ENVG=null,REV=new Set(),ATTR={},BASEPCT=0,GRASSN=0;const GRASS_GOAL=2500;
function newState(w){w=w||0;
  const s={v:8,mig:9,flags:{berryHalf:1,berryHalf2:1,land2:1,land3:1,land4:1,arrow0:1},placed:{},feat:{build:true},inv:{},orders:[],enemyOn:false,nights:0,godGone:false,godShown:false,nushi:null,
    lv:1,bossKills:0,nightHurt:0,nightHad:false,wave:null,lastWarn:0,
    ref:{},ground:new Array(W*H).fill(0),floor:new Array(W*H).fill(''),obj:new Array(W*H).fill(''),dyn:{},hp:{},
    res:[],enemies:[],pt:25,totalPt:0,food:0,fs:{},cseed:{imo:4},crops:{imo:true},mat:{wood:0,stone:0},regrow:[],t:w===0?15*60:12*60,/* 草原は15時からはじまる */speed:1,
    unlocked:{floor:true,farm:true,fence:true,hwall:true},bulk:false,stamps:false,quest:0,cleared:false,rain:false,seeds:[],nameIdx:2,introSeen:false,lastMorning:1,lastNight:0,subDone:{},drops:[],shards:0,gotMat:{wood:0,stone:0},recipes:{},buried:[],nid:1,kills:0,deaths:0};
  s.world=w;genWorld(s,w);
  if(w===1)s.res.push(mkRes(s,HOMURA,'fire',CX+.5,CY-1.5,'campfire'));else s.res.push(mkRes(s,'フタバ','wood',CX+.5,CY-1.5,'swing'));
  if(w===FREE)freeSetup(s);
  return s;
}
function putNear(s,id,cx,cy){for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const k=(cy+dy)*W+cx+dx;if(!s.obj[k]&&s.ground[k]!==1&&!s.floor[k]){s.obj[k]=id;return}}}
function ensureStor(s){for(const id in BL){const b=BL[id];if(b&&(b.offerOnly||b.shopOnly)&&b.kind==='furn'){if(s.recipes)delete s.recipes[id];if(s.guardianIdeas)delete s.guardianIdeas[id]}}/* おそなえされる家具は、レシピとして出さない（セーブからも消す） */
  {const nm=new Set();for(let j=0;j<s.obj.length;j++)if(s.obj[j]==='grave'&&s.dyn&&s.dyn[j]&&!s.dyn[j].buried)nm.add(s.dyn[j].name);for(const r of s.res||[])if(r.coffin)nm.add(r.coffin.name);if(!s.wipe)for(const L of[s.buried||[],s.lost||[]])for(const q of L)if(nm.has(q.name))q.unb=true}/* まだ埋葬されていない子は、よみがえらせない */
  for(const k in s.hp||{})if(/^\d+$/.test(k)&&typeof s.hp[k]==='number')s.hp[k]=Math.ceil(s.hp[k]);/* 耐久は整数 */
  if(!s.lost)s.lost=[];syncQuestRecipes(s)}

/* 特性：ひとりにひとつ。キーキャラは決まっている */
const TRK=el=>Object.keys(TRAITS).filter(k=>k!=='kizuna'&&k!=='tane'&&k!=='nebari'&&(k!=='ryouri'||el==='fire'));/* たねはこびは風の子だけ（mkRes）。料理じょうずは火の子だけ（料理をするのは火の子） */const TRAITS={hayaashi:['はやあし','歩く速さ1.25倍'],hataraki:['はたらきもの','作業の速さ1.25倍'],shukaku:['しゅうかく上手','畑や木の実の収穫+1'],kikori:['木こり','木を切ると、木材+1'],ishiku:['石工','石をほると、石材+1'],chikara:['力もち','持てる数+2'],shoshoku:['小食','おなかのへる速さ0.8倍'],tafu:['タフ','つかれる速さ0.75倍'],nebari:['ねばりづよい','つかれる速さ0.75倍・つかれのとれる速さ2倍'],kizuna:['めぐり','消えても、次の朝にもどってくる'],/* ねばりづよい・めぐりは、キーキャラだけ（TRK でのぞく）。ねばりづよいは、章のはじめからいる子 */genki:['元気いっぱい','たのしさのへる速さ0.6倍'],ryouri:['料理じょうず','料理にかかる時間0.7倍'],tane:['たねはこび','外のふしぎな種を拾いに行く']};
const EL_WORK={water:1.3,earth:.75},EL_STA={water:.7,earth:1.45};/* 属性ごとの作業スピード・スタミナ */
const trt=(r,k)=>!!(r&&r.vr&&r.vr.tr===k),recK=r=>trt(r,'nebari')?2:1;/* recK：つかれのとれる速さ（ねばりづよい子は2倍） */
/* せいれいごとのばらつき：色(h色相・l明るさ)、まつ毛・ほっぺ、足の速さ・食べる量・力 */
const KEYVR={'フタバ':{key:true,tr:'nebari',h:0,l:0,lash:false,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.18},'ノドカ':{key:true,tr:'tafu',h:0,l:0,lash:false,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.02},'ホムラ':{key:true,tr:'nebari',pk:'fireA',h:0,l:0,lash:false,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.08},'シズク':{key:true,tr:'hataraki',h:0,l:0,lash:false,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.12},'ホノ':{key:true,tr:'',pk:'fireB',h:-6,l:.04,lash:false,cheek:false,spd:1,eat:1,pow:1,sta:1,vo:.95},'アオ':{key:true,tr:'shoshoku',h:8,l:0,lash:true,cheek:false,spd:1,eat:1,pow:1,sta:1,vo:1.12},'フウ':{key:true,tr:'hayaashi',h:0,l:-.03,lash:true,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.05}};
function mkVar(name,el){if(KEYVR[name])return Object.assign({},KEYVR[name]);const R=()=>Math.random()*2-1;const sg=Math.random()<.5?-1:1;return{h:Math.round(sg*(12+Math.random()*33)),l:Math.round(R()*14)/100,lash:Math.random()<.4,cheek:Math.random()<.5,spd:Math.round((1+R()*.2)*100)/100,eat:Math.round((1+R()*.2)*100)/100,pow:Math.round((1+R()*.25)*100)/100,sta:Math.round((1+R()*.2)*100)/100,vo:Math.round((1.12+R()*.16)*100)/100,tr:pick(TRK(el))}}
function mkRes(s,name,elem,x,y,like){
  return {id:s.nid++,xp:0,xpf:0,name,elem,color:ELEM[elem].body,x,y,hunger:80,energy:85,fun:70,like:like||pick(LIKE_KEYS.filter(k=>(k!=='slide'||WD===4)&&(NIGATE[elem]||{})[k]==null)),act:null,path:[],starve:0,bubble:'',face:1,hidden:false,hurt:0,vr:mkVar(name,elem)};
}

function genWorld(s,w){
  const R=mulberry(w===1?20261102:w===FREE?20261022:20261018),V=w===1;/* V：火山のふもと */
  const pond=(cx,cy,rx,ry)=>{const a=R()*6.28,b=R()*6.28,e=R()*6.28;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,th=Math.atan2(dy,dx),lim=1+.2*Math.sin(2*th+a)+.13*Math.sin(3*th+b)+.07*Math.sin(5*th+e);if(Math.hypot(dx,dy)<lim)s.ground[y*W+x]=1}};
  if(V){pond(OFF+12,OFF+58,3.4,2.4);pond(OFF+60,OFF+14,2.8,2);pond(CX+4.8,CY+4.8,2.4,1.7);pond(CX+6.4,CY+3.7,1.3,1);pond(HSPC.b[0],HSPC.b[1],2.4,1.7);pond(HSPC.c[0],HSPC.c[1],2.2,1.6)}/* 温泉（はじめは冷えている） */
  else{pond(OFF+8,OFF+10,5,3.6);pond(OFF+11.5,OFF+12.5,3,2.2);pond(OFF+62,OFF+60,6,3.6);pond(OFF+58.5,OFF+58,2.6,2);pond(OFF+60,OFF+8,3,2.4);pond(CX+4.8,CY+4.8,2.4,1.7);pond(CX+6.4,CY+3.7,1.3,1);pond(CX+3.6,CY+6.6,1.2,.9);pond(10,30,4,3);pond(96,70,4.5,3);pond(40,98,3.5,2.6);pond(80,6,3,2.2)}/* 外がわにも池 */
  for(let pass=0;pass<2;pass++){const g=s.ground.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x,n=(g[j-1]===1)+(g[j+1]===1)+(g[j-W]===1)+(g[j+W]===1);if(g[j]===1&&n<=1)s.ground[j]=0;else if(g[j]!==1&&n>=3)s.ground[j]=1}}
  for(let y=CY+12;y<H;y++)s.floor[y*W+CX]='path';
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x;if(s.ground[i]===1)continue;
    const dx=Math.max(Math.abs(x+.5-CX)-8,0),dy=Math.max(Math.abs(y+.5-CY)-8,0),out=Math.max(dx,dy);
    if(x===CX&&y>=CY+11)continue;
    const ox=x-OFF,oy=y-OFF,forest=V?(ox<14&&oy<16):(ox>54&&oy<24)||(ox<16&&oy>48);/* 森は、前からの土地の角から、外がわへつづく */
    const r=R();
    if(out<1.2){ // 基地の中：枯れ木と岩がちらばる
      const core=Math.abs(x+.5-CX)<7&&Math.abs(y+.5-CY)<7;
      if(!core&&r<(V?.03:.05))s.obj[i]='deadtree';else if(!core&&r<(V?.09:.08))s.obj[i]='rock';else if(V&&!core&&r<.12)s.obj[i]='bamboo';/* 火山：基地の中にも竹が少し */
      continue}
    if(forest){if(r<.38)s.obj[i]=V&&r>=.19?'bamboo':w===FREE?'ntree':'deadtree';/* 火山の森は、枯れ木と竹が半分ずつ *//* 敷地の外の木は、みんな枯れている（フリーモードはべつ） */else if(r<.42)s.obj[i]='rock';else if(r<.435){s.obj[i]='berry';s.dyn[i]={g:100}}}/* ベリーの茂みは、前の4分の1 */
    else if(V){if(r<.05)s.obj[i]='deadtree';else if(r<.13)s.obj[i]='rock';else if(r<.1375){s.obj[i]='berry';s.dyn[i]={g:100}}else if(r>=.16&&r<.17)s.obj[i]='deadtree';else if(r<.19)s.obj[i]='bamboo'}/* 火山のふもとは岩が多い。竹も少し */
    else{if(r<.07)s.obj[i]='deadtree';else if(r<.1)s.obj[i]='rock';else if(r<.1075){s.obj[i]='berry';s.dyn[i]={g:100}}else if(r>=.13&&r<.15)s.obj[i]=w===FREE?'ntree':'deadtree'}
  }
  for(let y=CY-8;y<CY+12;y++)s.floor[y*W+CX]='path';
  if(!V&&w!==FREE){let best=-1,bd=1e9;for(let y=CY-6;y<=CY+6;y++)for(let x=CX-6;x<=CX+6;x++){const j=y*W+x;if(s.ground[j]===1||s.obj[j]||s.floor[j]||x===CX)continue;if([j-1,j+1,j-W,j+W].some(k=>s.ground[k]===1))continue;const d=Math.hypot(x+.5-(CX-3),y+.5-(CY+3));if(d<bd){bd=d;best=j}}if(best>=0)s.obj[best]='ntree'}/* 草原の拠点に、森の木が1本だけ（ほかの木は、みんな枯れている） */
  if(V){/* 火山のふもと：南西に古い家（下の壁がくずれている）、北東に2×2の畑、砂利の道が十字に通る */
    const x0=CX-9,x1=CX-4,y0=CY+3,y1=CY+7;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const j=y*W+x;s.obj[j]='';s.ground[j]=0;const edge=x===x0||x===x1||y===y0||y===y1;if(!edge){s.floor[j]='floor';continue}if(y===y1&&x>=x0+1&&x<=x0+3){s.floor[j]='';continue}/* はじめは壁がこわれている（クエストで直す） */const door=x===x1&&y===CY+5;s.obj[j]=door?'door':'hwall';s.floor[j]=door?'gravel':'';if(!door)s.hp[j]=BL.hwall.hp}
    for(let x=x1+1;x<CX;x++){const j=(CY+5)*W+x;s.obj[j]='';s.floor[j]='gravel'}/* 家の戸口から、砂利の道へ */
    for(let x=CX-7;x<=CX+8;x++)if(!s.obj[(CY+1)*W+x])s.floor[(CY+1)*W+x]='gravel';for(let y=CY+2;y<CY+12;y++)s.floor[y*W+CX]='gravel';
    for(let y=CY-5;y<=CY-4;y++)for(let x=CX+3;x<=CX+4;x++){const j=y*W+x;s.obj[j]='farm';s.floor[j]='';s.dyn[j]={g:50,wet:0,crop:'imo'}}}/* 最初の畑は4つ（2×2）。作物は、はじめはいもだけ */
  else{const hx=dx=>CX+dx;
  for(let d=3;d<=6;d++)for(let y=CY-5;y<CY-2;y++)s.floor[y*W+hx(-d)]='floor';
  for(let d=1;d<=2;d++)s.floor[(CY-4)*W+hx(-d)]='path';
  for(let y=CY-6;y<=CY-2;y++)for(let d=2;d<=7;d++){if(d>2&&d<7&&y>CY-6&&y<CY-2)continue;const x=hx(-d),j=y*W+x;if(y===CY-2&&d>=3&&d<=5)continue;/* はじめは壁がこわれている（クエストで直す） */s.obj[j]=(d===2&&y===CY-4)?'door':'hwall';s.floor[j]=s.obj[j]==='door'?'path':'';if(s.obj[j]==='hwall')s.hp[j]=BL.hwall.hp}
  for(let d=1;d<=4;d++){const j=(CY-4)*W+hx(d);s.obj[j]='farm';s.floor[j]='';s.dyn[j]={g:50,wet:0,crop:'imo'}}/* 最初の畑は4つ。家の道をはさんだ向かいに横1列。作物は、はじめはいもだけ */
  }
  if(V){const put=id=>{let best=-1,bd=1e9;for(let y=CY-7;y<CY;y++)for(let x=CX-6;x<CX;x++){const j=y*W+x;if(s.ground[j]===1||s.obj[j]||s.floor[j])continue;if([j-1,j+1,j-W,j+W,j-W-1,j-W+1,j+W-1,j+W+1].some(k=>s.ground[k]===1||s.obj[k]==='stor'||s.obj[k]==='mbox'))continue;const d=Math.hypot(x+.5-(CX-3),y+.5-(CY-3.5));if(d<bd){bd=d;best=j}}if(best>=0)s.obj[best]=id};{const j=(CY+4)*W+CX-8;s.obj[j]='stor';s.floor[j]='floor'}put('mbox');for(let y=CY-13;y<CY-8;y++){const j=y*W+CX;if(!s.obj[j]&&s.ground[j]!==1)s.floor[j]='path'}st2Place(s)}/* 火山のふもと：食料箱は古い家の中、素材箱は村の北西に（コワイノは南から来るので） */
  genLand(s,w)/* 川と段差（いちばん最後：ほかの物をおいたあと） */
}

/* ---------- 火山のふもと（ステージ2）：温泉3か所・火山・熱の道 ---------- */
const HSPC={a:[CX+4.8,CY+4.8],b:[CX-8.5,CY-8],c:[CX+.5,CY-15]},SPN={a:'入口の温泉',b:'西の温泉',c:'奥の温泉'};
const VOLJ=(OFF+1)*W+(CX-1),D1=(OFF+9)*W+(CX-4),D2=(CY-18)*W+(CX+5),CRACKS=[-2,-1,0,1,2].map(d=>(OFF+9)*W+CX+d),BVOL=[D2-1,D2+1,D2-W,D2+W];
const ASHT=new Set(['oven','bench','takebench','tub','sink','campfire','hotstone']);
const NATK=['rock','deadtree','ntree','berry','bamboo','takenoko'];
const festOn=()=>!!S&&WD===1&&S.festDay!=null&&(S.festDay===dayNo()||S.festDay===dayNo()-1&&hour()<6);/* おまつり：その日の朝6時まで */
function festStart(){S.festN=(S.festN||0)+1;/* おまつりをひらいた回数 */const L=WD===1?[[HOMURA,'おまつりかい！ ちょうちんの火、いい色だねえ。'],[SHIZUKU,'みなさんで、おどりましょう。ごちそうもありますよ。'],[HOMURA,'たまには、こういう日もいいもんさ。']]:[[POKO,'#surprise|わあ、おまつりだ！ ちょうちんが、いっぱい！'],[MINA,'みんなで、おどろうねぇ。ごちそうもあるよぉ。'],[POKO,'ヌシ様にも、この景色を見せてあげたいな。']];talkOnce('fest1',L.filter(l=>S.res.some(r=>r.name===l[0])))}/* はじめてのおまつりの会話 */
function festBegin(){S.festAtQ=QUESTS[S.quest]&&QUESTS[S.quest].id;/* どのクエストのときにひらいたか（前にひらいたおまつりは、クエストの数に入れない） */for(const r of S.res){r.fun=100;r.energy=100;spawnFX(r.x-.5,r.y-.6,'#ffd84a')}sfx('level');toast('おまつりがはじまった！ 屋台がならんでいる','good');festStart()}/* おまつりの朝：せいれいの半分が、屋台の店番をする */
function festGift(){if(S.festDay==null||S.festDay>=dayNo()||S.festGot===S.festDay)return;S.festGot=S.festDay;const fl=['salvia','lotus','lily','clover','bellf'].filter(id=>S.unlocked[id]);/* おまつりのおみやげ：はじめはちょうちん。あとは、ちょうちんか、おぼえた花のたね5つ */
  if(!S.flags.festGift1||!fl.length||Math.random()<.4){S.flags.festGift1=1;giveItem('chochin',1);toast('おまつりのおみやげ：おまつりのちょうちん','good')}else{const id=pick(fl);giveItem(id,5);toast('おまつりのおみやげ：'+BL[id].name+'のたね5つ','good')}renderPalette()}
const FESTC={k:null,L:[]};function festPoles(){const r=12,k=WD+':'+r;if(FESTC.k!==k){FESTC.k=k;const L=[],a=CX-r-1,b=CX+r,c=CY-r-1,d=CY+r,n=b-a,m=Math.ceil(n/4);for(let i=0;i<=m;i++){const t=Math.round(i*n/m);L.push([a+t,c],[a+t,d]);if(i>0&&i<m)L.push([a,c+t],[b,c+t])}FESTC.L=L.filter(([x,y])=>x>=0&&y>=0&&x<W&&y<H)}return FESTC.L}/* おまつりのちょうちんの柱：神殿のまわり24×24マスの1マス外を、4マスくらいずつ（かどにも1本） */
function drawFestPole(x,y,now){if(!FESTA.ok)return;const h=hour(),on=h>=18||h<6,f=FESTA.F[on?'pole_on':'pole_off'],x0=x*TS+16-7,y0=y*TS+30-f[3];shadow(ctx,x*TS+16,y*TS+29,6,2);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.drawImage(FESTA.img,f[0],f[1],f[2],f[3],x0,y0,f[2],f[3]);ctx.imageSmoothingEnabled=sm;
  if(on){const lx=x0+17,ly=y0+20,g=ctx.createRadialGradient(lx,ly,1,lx,ly,14);g.addColorStop(0,'rgba(255,190,110,.35)');g.addColorStop(1,'rgba(255,190,110,0)');ctx.fillStyle=g;ctx.fillRect(lx-14,ly-14,28,28)}}/* 夕方からちょうちんがともる */
const STALLM={wood:{nm:'りんごあめ',e:'🍭',col:'#d8452f',L:[['f','ringoame',15]]},fire:{nm:'たこ焼き・焼きそば',e:'🐙',col:'#e07a2a',L:[['f','takoyaki',20],['f','yakisoba',20]]},water:{nm:'かき氷',e:'🍧',col:'#4a8fd8',L:[['f','kakigori',15],['mebuki',400]]},earth:{nm:'ポテト',e:'🍠',col:'#9a6a3a',L:[['f','yakiimo',15]]},wind:{nm:'わたあめ・わなげ',e:'🍬',col:'#3aa88a',L:[['f','wataame',15],['chochin',60]]}};/* せいれいの屋台：店番の子の属性で、売る物がかわる。['f',食べ物,パワー]は5つ。木材・石材は売らない */
const STALLSAY=['いらっしゃい！','どれにする？','できたてだよ！','おまつりだから、とくべつだよ！'];
function festStalls(){if(!festOn()||STATUE<0||hour()<7)return [];const sh=Math.min(4,Math.floor((hour()-7)/3)),k=dayNo()+':'+sh;if(S.fst&&S.fst.k===k)return S.fst.L;/* 3時間ごとに店番が交代 */
  const R=S.res.filter(r=>!r.hidden),n=Math.floor(R.length/2),r0=12,y=CY-r0-1,P=[];
  for(let d=0;P.length<n&&d<=r0;d+=3)for(const x of d?[CX-d,CX+d]:[CX]){if(P.length>=n||x-1<CX-r0||x+1>CX+r0-1)continue;if([x-1,x,x+1].every(q=>walk(y*W+q)&&!S.obj[y*W+q])&&walk((y+1)*W+x))P.push(x)}/* 屋台は、ちょうちんの柱の上がわの列に、まんなかから3マスずつならべる */
  const C=R.map(r=>({r,n:(r.fkD===dayNo()?r.fkN||0:0)+Math.random()*.5})).sort((a,b)=>a.n-b.n),K=[],el=new Set();for(const c of C)if(K.length<P.length&&!el.has(c.r.elem)){el.add(c.r.elem);K.push(c.r)}for(const c of C)if(K.length<P.length&&!K.includes(c.r))K.push(c.r);/* まだ店番をしていない子から。属性はなるべくばらばらに */
  for(const r of K){if(r.fkD!==dayNo()){r.fkD=dayNo();r.fkN=0}r.fkN++}
  S.fst={k,L:K.map((r,i)=>({x:P[i],y,id:r.id,el:r.elem}))};return S.fst.L}
function festSpot(G,f,maxD){const L=[];for(let k=0;k<W*H;k++){const d=G.dist[k];if(d<0||d>maxD||!walk(k)||S.obj[k]||roomOf(k)||(TAKEN&&TAKEN.has(k))||!f(k))continue;L.push(k)}return L.length?pick(L):-1}/* 条件にあうマスから、ランダムに1つ */
function festAct(r,G){if(STATUE<0)return false;const h=hour(),ib=k=>VILL[k];
  if(h>=20&&h<21){const j=festSpot(G,ib,12);if(j>=0){startAct(r,G,'hanabi',j);return true}return false}/* 夜8時から9時は、花火を見る */
  if(h<7||h>=22)return false;if(r.fyD!==dayNo()){r.fyD=dayNo();r.fyN=0}
  {const t=festStalls().find(t=>t.id===r.id);if(t){startAct(r,G,'shopkeep',(t.el==='wind'?t.y+1:t.y)*W+t.x,{sk:S.fst.k});return true}}/* 店番の子は、自分の屋台へ（わたあめの屋台は、屋台の前） */
  const x=Math.random();
  if(x<.3){const cx=STATUE%W+.5,cy=((STATUE/W)|0)+3.5;const j=nearest(G,k=>{const d=Math.hypot(k%W+.5-cx,((k/W)|0)+.5-cy);return d>=1.6&&d<=2.8&&walk(k)&&!S.obj[k]},80);if(j>=0){startAct(r,G,'bon',j,{cx,cy});return true}}/* 神殿の前で、おどりの輪 */
  if(x<.5&&(r.fyN||0)<3){const L=festStalls().filter(t=>{const q=S.res.find(o=>o.id===t.id);return q&&q.act&&q.act.type==='shopkeep'&&q.act.stage==='do'});if(L.length){const t=pick(L),j=nearest(G,k=>((k/W)|0)===t.y+1&&Math.abs(k%W-t.x)<=1&&!(t.el==='wind'&&k%W===t.x)&&walk(k)&&free('yt'+k,1),80);if(j>=0){startAct(r,G,'yatai',j,{key:'yt'+j,sx:t.x});return true}}}/* 店番のいる屋台（1日3回まで） */
  if(x<.72&&trySocial(r,G))return true;/* おまつりのおしゃべり */
  const j=festSpot(G,k=>ib(k)&&Math.hypot(k%W+.5-r.x,((k/W)|0)+.5-r.y)>=4,30);if(j>=0){startAct(r,G,'fwalk',j);if(r.fsnack&&Math.random()<.6)r.bubble=r.fsnack;return true}/* 村の中を、ぶらぶら見てまわる */
  return false}
for(const id in STAGEONLY)Object.defineProperty(BL[id],'offerOnly',{get:()=>WD!==STAGEONLY[id]&&!grec(id),configurable:true});/* ステージの物は、そのステージで作れる。ほかのステージでは、おぼえるまではおそなえだけ */for(const id in BL){const b=BL[id];if(b.mat1){const m0=b.mat;Object.defineProperty(b,'mat',{get:()=>WD===1?b.mat1:m0,configurable:true})}}/* mat1：火山での素材（実数で書いてある） */
const FLAM=new Set(Object.keys(BL).filter(id=>id!=='hwall'&&id!=='door'&&id!=='yozoradoor'&&(()=>{const b=BL[id],m=b.mat||{};return (b.kind==='furn'||b.kind==='block'||b.kind==='build')&&(m.wood>0||m.bamboo>0)&&!m.stone&&!b.natural&&id!=='torch'&&id!=='candle'})()));/* 火山のふもとで燃える物：木材だけで作る家具・柵・壁など（たいまつ・ろうそくは、もともと火がついている物なのでのぞく） */
const burnHp=o=>BL[o].hp||10,fireAt=j=>WD===1&&!!S.st2&&!!S.st2.fire&&S.st2.fire[j]!=null;/* じょうぶさのない家具は、燃えるときだけ10とする */
function ignite(j){if(WD!==1||!S.st2)return;const o=S.obj[j];if(!FLAM.has(o))return;const F=S.st2.fire||(S.st2.fire={});if(F[j]!=null)return;F[j]=S.t;toast(BL[o].name+'が燃えている！','warn');sfxAt('cookfire',j%W+.5,(j/W)|0)}
function fireTick(dt){if(WD!==1||!S.st2||!S.st2.fire)return;const F=S.st2.fire;for(const k in F){const j=+k,o=S.obj[j];if(!FLAM.has(o)){delete F[k];continue}S.hp[j]=(S.hp[j]??burnHp(o))-dt/15;/* 燃えているあいだ、15分ごとにじょうぶさが1へる */
  if(S.hp[j]<=0){(S.broken||(S.broken=[])).push({j,id:o,L:S.hp['L'+j],rot:rotAt(j)});delete F[k];sfxAt('wbreak',j%W+.5,(j/W)|0);clearObj(j);recount();dirty=true;toast(BL[o].name+'が燃えてこわれた','warn')}}}
function sparkTick(){if(WD!==1||!S.st2||isNight()||elemCount('water')<1||Math.random()>=.05)return;/* 火の粉：昼のあいだ、1時間に5%（水の子が来てから） */const L=[];for(let j=0;j<W*H;j++){const o=S.obj[j];if(FLAM.has(o)&&!fireAt(j)&&VILL[j]&&!HOUSES.some(h=>h.inside.has(j)))L.push(j)}if(!L.length)return;const j=L[(Math.random()*L.length)|0];
  for(let n=0;n<10;n++)fx.push({k:'p',x:(j%W+.5)*TS+rnd(-6,6),y:((j/W)|0)*TS-40-n*6,vx:rnd(-15,15),vy:rnd(60,110),life:.6,col:pick(['#ffb02e','#ff7a3d','#fff1a8']),r:rnd(1.5,2.5)});ignite(j)}/* 家の中の物には、火の粉はとどかない */
function goDouse(r,G){if(WD!==1||!S.st2||!S.st2.fire||isNight())return false;const ks=Object.keys(S.st2.fire).map(Number).filter(j=>free('fire'+j,1));if(!ks.length)return false;const hit=k=>ks.includes(anc(k));const j=nearest(G,q=>adjOf(q,hit)>=0,150);if(j<0)return false;const t=anc(adjOf(j,hit));startAct(r,G,'douse',j,{key:'fire'+t,obj:t,run:true});return true}/* 水の子は、昼のあいだ、燃えている物を消しにいく */
function drawFire1(j,now){{const o=S.obj[j];if(!o)return;const z=szAt(o,j)||[1,1],x=(j%W)*TS,y=((j/W)|0)*TS,n=z[0]*2,b=y+TS*z[1]-8;
  for(let m=0;m<n;m++){const fx=Math.round(x+6+m*(TS*z[0]-12)/Math.max(1,n-1)),h=Math.round(9+Math.sin(now/110+m*1.7+j)*3+(m%2?2:0));ctx.fillStyle='#d8431c';ctx.fillRect(fx-3,b-h,6,h);ctx.fillStyle='#ff9a2e';ctx.fillRect(fx-2,b-h+3,4,h-3);ctx.fillStyle='#fff1a8';ctx.fillRect(fx-1,b-Math.round(h*.45),2,Math.round(h*.45))}
  const sm=(now/1400+j*.37)%1;ctx.fillStyle='rgba(90,80,78,'+(.45*(1-sm))+')';ctx.fillRect(Math.round(x+TS*z[0]/2-3+Math.sin(now/500+j)*3),Math.round(b-16-sm*22),6,6)}}/* 燃えている物：ドットのほのおと、けむり（物を描いたすぐあとに重ねる） */
const burnt=q=>{const o=S.obj[q];return FLAM.has(o)&&!breakable(o)&&!DEFS.has(o)&&S.hp[q]!=null&&!fireAt(q)};/* 燃えて、じょうぶさがへった家具 */
function st2(){return S.st2||(S.st2={sp:{a:0,b:0,c:0},d1:1,d2:1,d2fix:0,hvb:{},ash:{},ashKills:0,bw:[]})}
const ashed=j=>WD===1&&!!S.st2&&S.st2.ash[j]>S.t;
function springOn(k){if(WD!==1||!k)return false;if(S.st2&&S.st2.frz&&S.st2.frz[k])return false;/* 最後の夜に冷やされた温泉 */if(k==='a')return !!S.flags.onsen;const t=S.st2;if(!t||!t.sp[k])return false;if(t.hvb[D1])return false;if(k==='c'&&t.hvb[D2])return false;return true}
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
const hotW=j=>WD===1&&S.ground[j]===1&&springOn(sprMap()[j]);
function nearHot(j,r){const x=j%W,y=(j/W)|0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;if(hotW(yy*W+xx))return true}return false}
const nearSp=id=>S.obj.some((o,j)=>(id==='bench'?BENCHES.has(o):o===id)&&nearHot(j,4));/* ベンチは竹のベンチもふくむ *//* 温泉のそば（4マス以内） */
const FLOWERS2=['clover','bellf','salvia','lily','lotus'];
function spNear(ids,k){if(!springOn(k))return 0;const M=sprMap();let n=0;for(let j=0;j<W*H;j++){if(!ids.includes(S.obj[j])||isBud(j))continue;/* 花は、さいてから数える */const x=j%W,y=(j/W)|0;let ok=false;for(let dy=-4;dy<=4&&!ok;dy++)for(let dx=-4;dx<=4;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(S.ground[q]===1&&M[q]===k){ok=true;break}}if(ok)n++}return n}/* その温泉のそば（4マス以内）にある数 */
function st2Place(s){
  const stash=j=>{const o=s.obj[j];if(o&&o!=='part'&&BL[o]&&BL[o].kind&&!BL[o].natural)s.inv[o]=(s.inv[o]||0)+1;if(o)for(const k in s.ref)if(s.ref[k]===j){s.obj[k]='';delete s.ref[k]}if(s.obj[j]==='part'){const a=s.ref[j];if(a!=null&&s.obj[a])stash(a)}s.obj[j]='';delete s.dyn[j];delete s.ref[j];s.ground[j]=0};
  for(let y=OFF;y<=OFF+6;y++)for(let x=CX-3;x<=CX+3;x++)stash(y*W+x);
  s.obj[VOLJ]='volcano';for(let b=0;b<3;b++)for(let a=0;a<3;a++){const q=VOLJ+b*W+a;if(q!==VOLJ){s.obj[q]='part';s.ref[q]=VOLJ}}
  for(const j of[D1,D2,...CRACKS,...BVOL])stash(j);
  s.obj[D1]=s.obj[D2]='heatv';CRACKS.forEach(j=>s.obj[j]='crack');BVOL.forEach(j=>s.obj[j]='boulder');
  const c=[];for(let y=CY-12;y<=CY-4;y++)for(let x=CX-13;x<=CX-3;x++){const j=y*W+x;if(s.ground[j]===1||s.floor[j])continue;if(s.obj[j]&&!NATK.includes(s.obj[j]))continue;if(![j-1,j+1,j-W,j+W].some(k=>s.ground[k]===1))continue;c.push([Math.hypot(x+.5-(CX-5.5),y+.5-(CY-8)),j])}
  c.sort((a,b)=>a[0]-b[0]);const bw=c.slice(0,3).map(q=>q[1]);bw.forEach(j=>{s.obj[j]='boulder';delete s.dyn[j]});/* 西の温泉の水路をふさぐ大岩 */
  s.st2={sp:{a:0,b:0,c:0},d1:1,d2:1,d2fix:0,hvb:{},ash:{},ashKills:0,bw}}
function springFX(k){const[cx,cy]=HSPC[k];sfx('level');toast(SPN[k]+'に、あたたかい湯がもどった！','good');logEv(SPN[k]+'がよみがえった');memo('♨️',SPN[k]+'がよみがえった');
  fx.push({k:'ring',x:cx*TS,y:cy*TS,life:1});for(let n=0;n<24;n++){const a=Math.random()*7,v=rnd(40,110);fx.push({k:'p',x:cx*TS,y:cy*TS,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,life:1,col:pick(['#fff','#bff3ec','#ffe9a0']),r:rnd(2,3.5)})}}
function st2Tick(){if(WD!==1||!S.st2)return;const t=S.st2;
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
function drawHeat(now){if(WD!==1||!S.st2)return;const c=ctx;c.save();c.lineCap='round';c.lineJoin='round';
  for(const l of heatLines()){c.beginPath();l.p.forEach((q,i)=>i?c.lineTo(q[0]*TS,q[1]*TS):c.moveTo(q[0]*TS,q[1]*TS));c.setLineDash([]);c.strokeStyle='rgba(60,45,38,.35)';c.lineWidth=9;c.stroke();c.strokeStyle='#8f7b6c';c.lineWidth=5;c.stroke();
    if(l.on){c.strokeStyle='rgba(255,140,60,.95)';c.lineWidth=3.2;c.setLineDash([7,9]);c.lineDashOffset=-now/40;c.stroke();c.setLineDash([]);
      if(l.smoke||l.leak){const e=l.smoke?l.p[l.p.length-1]:[CX+.5,OFF+9.5];for(let k=0;k<3;k++){const ph=((now/1800+k/3)%1);c.fillStyle='rgba(120,110,105,'+(.45*(1-ph))+')';c.beginPath();c.arc(e[0]*TS+Math.sin(now/600+k)*4,e[1]*TS-8-ph*30,5+ph*9,0,7);c.fill()}}}}
  c.restore()}

/* ---------- ヘルパー ---------- */
const clk=()=>S.t-(S.hold||0);/* 時計の時刻 */
const hour=()=>(clk()/60)%24;
const dayNo=()=>Math.floor(clk()/1440)+1;
const nextOK=()=>dayNo()>=(S.lastCame??Math.max(0,...S.res.map(r=>r.came||0)))+2;/* つぎのなかまをむかえるクエストは、前の子が来た日の、2日後から */
const nightLock=()=>S&&S.enemyOn&&isNight();/* 夜（コワイノの時間）は、建てることも解体もできない */
const isNight=()=>{const h=hour();return h>=23||h<6},isDark=()=>{const h=hour();return h>=21||h<6};/* せいれいが寝るのは23時 */
function foeAt(e,r){/* コワイノ e が、せいれい r の3マス以内か、r のいる家の中にいる */if(r.hidden||r.coffin)return false;if(Math.max(Math.abs(e.x-r.x),Math.abs(e.y-r.y))<=3)return true;const h=roomOf((r.y|0)*W+(r.x|0));return !!h&&h.set.has((e.y|0)*W+(e.x|0))}
function nearRes(e){return e.hitT!=null&&S.t-e.hitT<5||S.res.some(r=>foeAt(e,r))}/* だれかの3マス以内・だれかのいる家に来たコワイノと、塀・壁・建物をこうげきしているコワイノ（火の子がむかえうつ） */
const anc=j=>{if(S.obj[j]==='part'||(S.obj[j]==='site2'&&S.ref[j]!=null))return S.ref[j];if(S.obj[j]==='site2')for(const k of[j-1,j+1,j-W])if(S.obj[k]==='site')return k;return j};/* 古いセーブの神殿の足場にも対応 */
const typeAt=j=>S.obj[anc(j)];

const solidOf=j=>{const o=typeAt(j);return !!(o&&BL[o]&&BL[o].solid)};
const FRONTS=new Set(['chair','achair','sofa1','bench']);/* 正面のある家具（置くときに矢印を出す） */const ROTS={chair:4,achair:4,sofa1:4,bench:4,bed:2,yorubed:2,sandbox:2,ltable:2,bathtub:2,slide:1,seesaw:1,swing:1,signpost:1,vane:1,oven:1,stairs_wood:5,stairs_stone:5,stairs_brick:5,slope_earth:5};/* 向きをかえられる家具。4：前・右・後ろ・左　2：横・縦　1：左右反転だけ */
const BEDHX=26,BEDHY=-1,BEDVY=8.5,BEDHS=.85;/* 横のベッド：寝る子の足もと（x,y）。たてのベッド：寝る子の足もとのy。BEDHS：横向きで寝るときの、せいれいの横はば。ふとんは重ねない（ベッドの上に寝る子をかく） */
const ROTN=id=>ROTS[id]===5?5:ROTS[id]===4?4:ROTS[id]?2:1,ROTL={5:['じどう','手前へ','右へ','左へ','奥へ'],4:['前','右','後ろ','左'],2:['横','縦'],1:['そのまま','反転']};/* 5：階段の下りる向き（S.rot は 1手前 2右 3左 4奥、0は自動） */
let PLROTS={};/* 置くときにえらんでいる向き（家具ごと） */
const rotAt=j=>(S&&S.rot&&S.rot[j])||0;
const szR=(id,rot)=>{const z=BL[id]&&BL[id].sz;if(!z)return null;return (ROTS[id]===2&&rot===1||ROTS[id]===4&&rot%2===1)?[z[1],z[0]]:z};/* 向きをかえると、たて・よこが入れかわる */
const szAt=(id,j)=>szR(id,j==null?0:(S.obj[j]===id||S.obj[j]==='site'?rotAt(j):(PLROTS[id]||0)));
const fp=(id,x,y,rot)=>{const z=rot!=null?szR(id,rot):szAt(id,y*W+x);if(!z)return [[x,y]];const c=[];for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)c.push([x+a,y+b]);return c};
function walk(j){if(j<0||j>=W*H||S.ground[j]===1&&S.obj[j]!=='bridge')return false;return !solidOf(j)}/* 橋の上は歩ける。浅瀬（ground 2）は歩ける（ゆっくり） */
const wetJ=j=>S.ground[j]===1&&S.obj[j]!=='bridge';/* 歩けない水 */
const LIFT=26;/* 段差1だんの高さ（ドット）。高いマスの上の物は、これだけ上に描く */
function hiAt(j){return S.hi?S.hi[j]|0:0}
const SLOPES=new Set(['slope_earth']),STAIRS=new Set(['stairs_wood','stairs_stone','stairs_brick',...SLOPES]),/* 土は坂だけ、木・石・レンガは階段だけ */SDIR=[[0,1],[1,0],[0,-1],[-1,0]];/* 階段の向き：0下 1右 2上 3左（低いほう） */
const SROT=[-1,0,1,3,2];/* 置くときにえらんだ向き（S.rot）→ 下りる向き */
function stairOK(j,d){/* j に、d の向きに下りる階段を置けるか：j のうしろが高いマス。j と、その先のマスは、低い地面（水でない） */const x=j%W,y=(j/W)|0,bx=x-SDIR[d][0],by=y-SDIR[d][1],ox=x+SDIR[d][0],oy=y+SDIR[d][1];if(bx<0||by<0||bx>=W||by>=H||ox<0||oy<0||ox>=W||oy>=H)return false;const o=oy*W+ox;const h=hiAt(j);return hiAt(by*W+bx)===h+1&&(d===0||hiAt(o)===h&&S.ground[o]!==1)}/* うしろが、ちょうど1だん高い *//* 手前向きは1マス（がけの正面を1マスと数える）、ほかは2マス */
function stairDir(j){/* 階段は、段差の下（低い地面）に置く1×2。高いマスのほうから、はなれる向きに下りる。えらんだ向きがなければ、下・右・左・上の順にえらぶ */const v=(S.rot||{})[j];if(v)return SROT[v];for(const d of[0,1,3,2])if(stairOK(j,d))return d;return -1}
function stairOf(k){/* k が階段のマスなら、階段の本体（高いほうのはしのマス）。ちがえば -1 */if(k<0||k>=W*H||!S)return -1;const o=S.obj[k];if(STAIRS.has(o))return k;if(o==='part'){const a=S.ref[k];if(a!=null&&STAIRS.has(S.obj[a]))return a}return -1}
const stairOut=(j,d)=>j+SDIR[d][1]*W+SDIR[d][0],stairTop=(j,d)=>j-SDIR[d][1]*W-SDIR[d][0];/* 階段は1×2：本体のマスと、その先の低いほうのマス。本体のうしろが、のぼった先の高いマス */
function stairLink(a,b){/* bが階段の本体で、aがそのうしろの高いマス（のぼった先） */if(!STAIRS.has(S.obj[b]))return false;const d=stairDir(b);return d>=0&&stairTop(b,d)===a}

let CLV=1;/* いま絵を作っている段（1〜3）。がけの絵の関数は、この段より高いか同じマスを「高いマス」とみる */
let TOPF=null;function topAt(j){return TOPF?TOPF(j):hiAt(j)>=CLV}/* TOPF：段差の部品を作るあいだだけ、まわりのマスの高さをまねる *//* 「上の面がある」（CLV の段で） */
const HMAX=3;/* 段差は3だんまで */
function cliff2(a,b){return Math.abs(hiAt(a)-hiAt(b))>1}/* 2だん以上ちがう所は、とびこえられない */
const LADDERS=new Set(['ladder_wood','ladder_bamboo']);/* ハシゴ：段差の下の低い地面に置く1マス。うしろ（手前・左右）のマスが、ちょうど1だん高い。上り下りは歩く速さ×0.5 */
function ladderDir(j){/* ハシゴの向き（0：うしろが上のマス、1：左、3：右）。置いたときの向き S.rot、なければ自動 */const v=(S.rot||{})[j];if(v!=null&&LADDERS.has(S.obj[j]))return v;const h=hiAt(j),x=j%W;for(const d of[0,1,3]){const t=j-SDIR[d][1]*W-SDIR[d][0];if(t<0||t>=W*H||Math.abs(t%W-x)>1)continue;if(hiAt(t)===h+1&&S.ground[t]!==1)return d}return -1}
const ladderTop=(j,d)=>j-SDIR[d][1]*W-SDIR[d][0];
function ladderLink(a,b){/* b がハシゴで、a がその上のマス */if(!LADDERS.has(S.obj[b]))return false;const d=ladderDir(b);return d>=0&&ladderTop(b,d)===a}
const onLadder=(a,b)=>ladderLink(b,a)||ladderLink(a,b);/* ハシゴで上り下りする1歩（ハシゴと、その上のマスのあいだ）。ハシゴのマスに横から入るのは、ふつうに歩く */
function jumpEdge(a,b){return hiAt(a)!==hiAt(b)&&!stairLink(a,b)&&!stairLink(b,a)&&!ladderLink(a,b)&&!ladderLink(b,a)}/* 段差を飛ぶ所（階段で上り下りする所はちがう） */
function zAt(x,y){/* その場所の高さ（ドット）。階段の上は、高いほうのはしから低いほうへ少しずつ下がる */const c=(y|0)*W+(x|0);if(S&&LADDERS.has(S.obj[c])){const d=ladderDir(c),ax=c%W,ay=(c/W)|0,t=d===0?y-ay:d===1?x-ax:ax+1-x;return hiAt(c)*LIFT+(d<0?0:LIFT*Math.max(0,Math.min(1,1-t)))}/* ハシゴの上：うしろの高いマスへ近いほど高い */const a=stairOf(c);if(a<0)return hiAt(c)*LIFT;const d=stairDir(a);if(d<0)return hiAt(c)*LIFT;const ax=a%W,ay=(a/W)|0,t=d===0?2*(y-ay):d===1?x-ax:d===2?ay+1-y:ax+1-x;return LIFT*hiAt(a)+LIFT*Math.max(0,Math.min(1,1-t/2))}/* 2マスで下がる（手前向きは1マス） */
const HI_OK=new Set(['deadtree','rock','berry','bamboo','tree','ntree','fruit']);/* 段差を作ってよい物（自然の物） */
const LANDSEED=w=>w===1?20261102:w===FREE?20261022:20261018;
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
function genHeights(s,w){/* 段差：なめらかなノイズから、0〜3だんの台地。村のまん中（13マス）は平ら。外へいくほど高い。水・浅瀬のまわり・床・人の作った物の所には作らない。となりとの差は1だんまで（段々の台地） */
  const R=mulberry(LANDSEED(w)+77),h=new Array(W*H).fill(0);
  const ok=j=>{const x=j%W,y=(j/W)|0;if(x<2||y<2||x>=W-2||y>=H-2)return false;if(Math.max(Math.abs(x+.5-CX),Math.abs(y+.5-CY))<13)return false;if(s.floor[j])return false;const o=s.obj[j];if(o&&!HI_OK.has(o))return false;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(s.ground[j+b*W+a])return false;if(w===1&&Math.abs(x+.5-CX)<9&&y<OFF+16)return false;/* 火山：北の火口のまわりは平ら */return true};
  const oct=sc=>{const gw=Math.ceil(W/sc)+2,gh=Math.ceil(H/sc)+2,g=new Float32Array(gw*gh);for(let k=0;k<g.length;k++)g[k]=R();const sm=t=>t*t*(3-2*t);
    return (x,y)=>{const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),tx=sm(fx-ix),ty=sm(fy-iy),v=(a,b)=>g[(iy+b)*gw+ix+a];return (v(0,0)*(1-tx)+v(1,0)*tx)*(1-ty)+(v(0,1)*(1-tx)+v(1,1)*tx)*ty}};
  const V=w===1,n1=oct(V?17:30),n2=oct(V?8:13),n3=oct(V?4:6),T=V?[.50,.58,.66]:[.53,.65,.79];/* 草原：大きくゆるやかな丘（3だんは少ない）。火山：こまかく、けわしい */
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x,c=Math.max(Math.abs(x+.5-CX),Math.abs(y+.5-CY)),f=Math.min(1,Math.max(0,(c-13)/14)),nf=Math.min(1,Math.max(0,(CY+10-y)/50));let v=(.6*n1(x,y)+.3*n2(x,y)+.1*n3(x,y))*(.55+.45*f)+.12*f;if(V)v+=.2*nf-.08*(1-nf);/* 火山：北（火口がわ）へいくほど高い山 */
    h[j]=v>T[2]?3:v>T[1]?2:v>T[0]?1:0}
  for(let pass=0;pass<2;pass++)for(let lv=1;lv<=HMAX;lv++){const g=h.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x;let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&g[j+b*W+a]>=lv)n++;if(g[j]>=lv&&n<=2)h[j]=Math.min(h[j],lv-1);else if(g[j]<lv&&n>=6)h[j]=Math.max(h[j],lv)}}/* まわり8マスの多いほうにそろえて、ふちをまるく */
  for(let j=0;j<W*H;j++)if(h[j]&&!ok(j))h[j]=0;
  const fix=()=>{for(let it=0;it<6;it++){let ch=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x;let m=h[j];for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const xx=x+a,yy=y+b;if(xx<0||yy<0||xx>=W||yy>=H)continue;m=Math.min(m,h[yy*W+xx])}if(h[j]>m+1){h[j]=m+1;ch=1}}if(!ch)break}};/* 2マス以内との差は1だんまで（段と段のあいだの平らな所は2マス以上。がけが2だんつづけて見えないように） */
  fix();
  for(let pass=0;pass<3;pass++)for(let lv=HMAX;lv>=1;lv--){const g=h.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x,n=(g[j-1]>=lv)+(g[j+1]>=lv)+(g[j-W]>=lv)+(g[j+W]>=lv);if(g[j]>=lv&&n<2)h[j]=lv-1;else if(g[j]===lv-1&&n>=3&&ok(j))h[j]=lv}}/* ほそい所はけす、くぼみはうめる */
  fix();
  s.hi=h}
function genLand(s,w){genRiver(s,w);genHeights(s,w)}/* 地形：川（と浅瀬）、そのあと段差 */
