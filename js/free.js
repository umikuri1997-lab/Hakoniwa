'use strict';
/* ---------- フリーモード（free.js） ----------
   花の谷（マップ）：高い丘がぐるりとかこむ、まるい谷。川はない。南に1か所だけ丘の切れ目。谷の中は木が少なく、野の花がむれて咲き、小さな池が4つ。丘の上は森。
     新しくはじめたフリーモードだけ（s.flags.valley）。前のセーブの地形はかえない。
   野の花（S.wild：マス→花の番号）：見た目だけの花。物・床を置いたマスの花はなくなる（wildPurge）。属性の力・みどりのマス・すてき度には数えない。
   神殿はない（noTemple）。おそなえ箱と依頼ボードは、はじめから村にべつべつにある。カミサマは出ない。なかまは呼ばず、属性の力がたまると朝に谷の南からやってくる（freeArrive）。
   土地をクリアすると開く（freeTier・WT・VOLK）：火山をクリアすると、火と水のせいれい・火山の物・竹・鉱脈と炉とそうび・おまつり・火山のイベントと魚（freeVolOpen）。
   お話：第1章（QUESTSF、story.js）。おまつりのあとは、第2章（FCH2・S.fc2：火山をクリアしてから）・季節の話4つ（FSEA・S.fsea）・きょうの目標（freeAfterTick）。
   交換は、旅のお客さん（freeVisitors、quest-run.js の visit*）。 */
const VPONDS=[[-13,-15,3,2.2],[18,3,3.4,2.4],[-10,16,2.6,1.9],[9,-19,2.2,1.6]];/* 谷の中の池（まん中からの場所・よこ・たての半径） */
const VGROVE=[[16,-10,4],[-19,2,4],[5,21,3.5]];/* 谷の中の木立（まん中からの場所・半径） */
const WILDK=['clover','bellf','salvia','lily'];/* 野の花の絵（花のチップをかりる） */
const VGAP=4.5;/* 南の丘の切れ目の、はばの半分 */
function valleyOn(s,w){return w===FREE&&!!(s&&s.flags&&s.flags.valley)}
let VRIMP=null;
function valleyRim(th){/* 谷のふちまでの道のり（まん中から。向きごとに少しでこぼこ） */if(!VRIMP){const R=mulberry(LANDSEED(FREE)+555);VRIMP=[R()*6.28,R()*6.28,R()*6.28]}return 30+2.2*Math.sin(2*th+VRIMP[0])+1.4*Math.sin(3*th+VRIMP[1])+.8*Math.sin(5*th+VRIMP[2])}
function valleyEdge(x,y){/* 谷のふちからの道のり（マイナスは谷の中） */const dx=x+.5-CX,dy=y+.5-CY;return Math.hypot(dx,dy)-valleyRim(Math.atan2(dy,dx))}
const valleyGap=(x,y)=>Math.abs(x+.5-CX)<VGAP&&y>CY;/* 南の切れ目 */
function valleyLv(x,y,v){/* 段の高さ：谷の中は0、ふちから外へ1・2・3だん。v：なめらかなノイズ（外がわの丘の上を2〜3だんに） */if(valleyGap(x,y))return 0;const e=valleyEdge(x,y);return e<0?0:e<3.5?1:e<8?2:e<14||v>.42?3:2}
function valleyCell(s,x,y,i,r){/* 1マスの自然の物（genWorld から。r：0〜1の乱数） */
  const dx=x+.5-CX,dy=y+.5-CY,berry=()=>{s.obj[i]='berry';s.dyn[i]={g:100}};
  if(Math.abs(dx)<9&&Math.abs(dy)<9){if(!(Math.abs(dx)<7&&Math.abs(dy)<7)&&r<.03)s.obj[i]='rock';return}/* 村のまん中 */
  if(valleyEdge(x,y)>=0){if(valleyGap(x,y))return;if(r<.22)s.obj[i]='ntree';else if(r<.255)s.obj[i]='rock';else if(r<.265)berry();return}/* 丘の上は森 */
  if(VGROVE.some(g=>Math.hypot(dx-g[0],dy-g[1])<g[2])){if(r<.5)s.obj[i]='ntree';else if(r<.54)berry();return}/* 木立 */
  if(r<.008)s.obj[i]='ntree';else if(r<.03)s.obj[i]='rock';else if(r<.036)berry()}
function valleyPlace(s,VR){/* 花の谷の自然の物：段差を作ったあとに置く。木（まわり2マス）は、まわりに自分より高い段がある所には置かない。岩・茂みは、まわり1マスが同じ高さの所だけ（あとで木のまわりをならすと、丘がけずれて平らになるため） */
  const hA=k=>s.hi&&s.hi[k]||0;
  for(let i=0;i<W*H;i++){if(VR[i]<0||s.obj[i]||s.floor[i]||s.ground[i])continue;const x=i%W,y=(i/W)|0;valleyCell(s,x,y,i,VR[i]);const o=s.obj[i];if(!o)continue;
    const fl=FLATR.has(o)||o==='rock',R=hiRad(o)||(fl?1:0);if(!R)continue;const h=hA(i);let bad=false;
    for(let b=-R;b<=R&&!bad;b++)for(let a=-R;a<=R;a++){const X=x+a,Y=y+b;if(X<0||Y<0||X>=W||Y>=H)continue;const g=hA(Y*W+X);if(fl?g!==h:g>h){bad=true;break}}
    if(bad){s.obj[i]='';if(s.dyn)delete s.dyn[i]}}}
function wildNoise(R,sc){const gw=Math.ceil(W/sc)+2,gh=Math.ceil(H/sc)+2,g=new Float32Array(gw*gh);for(let k=0;k<g.length;k++)g[k]=R();const sm=t=>t*t*(3-2*t);
  return (x,y)=>{const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),tx=sm(fx-ix),ty=sm(fy-iy),v=(a,b)=>g[(iy+b)*gw+ix+a];return (v(0,0)*(1-tx)+v(1,0)*tx)*(1-ty)+(v(0,1)*(1-tx)+v(1,1)*tx)*ty}}
function wildGen(s){/* 野の花：谷の中に、むれになって咲く。むれごとに花のしゅるいがちがう */
  const R=mulberry(LANDSEED(FREE)+909),n1=wildNoise(R,7),n2=wildNoise(R,15);s.wild={};
  for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const j=y*W+x,r=R();if(s.ground[j]||s.obj[j]||s.floor[j]||valleyEdge(x,y)>-1.5)continue;
    if(n1(x,y)>.56&&r<.6)s.wild[j]=Math.floor(n2(x,y)*8)%4}}
function wildPurge(s){/* 物・床・ラグ・花壇のふちを置いたマスの野の花は、なくなる（雑草・きのこの下の花はのこる） */s=s||S;const Wd=s&&s.wild;if(!Wd)return;
  for(const k in Wd){const j=+k,o=s.obj[j];if(s.floor[j]||s.ground[j]||o&&!WEEDS.has(o)||s.rug&&s.rug[j]||s.edge&&s.edge[j])delete Wd[k]}WILDL=null}
let WILDL=null,WILDS=null;
function wildDraw(add,vis,ctx,now){/* 奥行きの順に、ほかの物といっしょに描く（draw-world.js） */if(!S||!S.wild)return;
  if(WILDS!==S||!WILDL){WILDS=S;WILDL=Object.keys(S.wild).map(Number)}
  for(const j of WILDL){if(S.obj[j]||S.floor[j])continue;const x=j%W,y=(j/W)|0;if(!vis({x:x+.5,y:y+.5}))continue;const id=WILDK[S.wild[j]]||WILDK[0];
    add(objectDepth(id,j),1,null,()=>drawObj(ctx,id,x*TS,y*TS-liftOf(j),j,100,now),j)}}

/* ---------- 土地をクリアすると開く ---------- */
let FTS=null,FTV=0;
function freeTier(){/* クリアした土地の番号（0：草原まで・1：火山まで）。村を開いたときに1回しらべる */if(FTS===S&&S)return FTV;FTS=S;let c=false;try{const d=typeof LIVE!=='undefined'&&LIVE[1];if(d)c=!!d.cleared;else{const t=KV.getItem(SAVE_KEYS[1]);c=!!(t&&JSON.parse(t).cleared)}}catch(e){}FTV=c?1:0;return FTV}
function WT(){return WD===FREE?freeTier():WD}/* その土地までの物が使える */
function VOLK(){return WD===KAZAN||WD===FREE&&freeTier()>=1}/* 火山のしくみ（鉱脈・そうび・おまつり）が使える */
function noTemple(){return STATUE<0&&!(S&&S.free)}/* 神殿がまだない（フリーモードは、神殿なしで何でもできる） */
function festBase(){return STATUE>=0?STATUE:S&&S.free?OBOX:-1}
const freeElems=()=>freeTier()>=1?['wood','earth','fire','water']:['wood','earth'];
function freeVolOpen(){/* 火山をクリアしたあと、はじめて谷を開いたとき（1回） */S.flags.fvol=1;S.recipes||(S.recipes={});S.recipes.smelter=true;syncQuestRecipes(S);
  st2().ore=OREWAKE.length;placeVeins(S,null);/* 丘と谷の岩のいくつかが、鉱脈になる */
  for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const j=y*W+x,e=valleyEdge(x,y);if(S.obj[j]==='ntree'&&e>=-1&&e<6&&x>CX+6&&y<CY-6){S.obj[j]='bamboo';delete S.dyn[j];delete S.hp['n'+j]}}/* 北東の丘のふもとに竹 */
  recount();dirty=true;toast('火山の物が、谷でも使えるようになった','good');memo('ball','火山から、あたらしい風がとどいた')}
/* ---------- なかま：呼ばない。属性の力がたまると、朝に谷の南からやってくる（1日1人） ---------- */
function freeGate(){/* 谷の南の切れ目の、歩ける所 */for(let y=CY+27;y>CY+8;y--)for(const dx of[1,-1,2,-2,0]){const j=y*W+CX+dx;if(walk(j)&&!S.obj[j])return[CX+dx,y]}return[CX,CY+6]}
function freeArrive(){if(!S||!S.free)return;if(typeof unbFix==='function')unbFix();if(S.summonDay===callDay()||isNight())return;
  const C=freeElems().filter(el=>elemCount(el)<(el==='wood'?6:3)&&(ATTR[el]||0)>=needFor(el));if(!C.length)return;
  C.sort((a,b)=>(ATTR[b]||0)/needFor(b)-(ATTR[a]||0)/needFor(a));const n0=S.res.length;S.summon={elem:C[0],pick:1,at:freeGate()};doSummon();S.summon=null;if(S.res.length>n0)S.farr=(S.farr||0)+1}
/* ---------- 旅のお客さん：3日に1回、朝に来て、つぎの朝に帰る。タップで交換 ---------- */
function freeVisitors(){const L=[[FUTABA,'wood','#joy|あそびに来たよ！ 花のたねと苗、もってきたんだ。ほしいのある？'],[NODOKA,'earth','谷の花、きれいだねぇ。草原のたねと苗、いるかねぇ？']];
  if(freeTier()>=1)L.push([HOMURA,'fire','#joy|よっ、来たよ！ 火山のみやげも、もってきたからね。'],[SHIZUKU,'water','こんにちは。いい谷ですね。ほしい物があれば、どうぞ。']);return L}
function freeVisitMorning(){const t=st2();if(dayNo()<2||t.visit&&dayNo()-t.visit.day<VISIT_EVERY)return;const n=t.visitN||0,L=freeVisitors();t.visitN=n+1;t.visit={day:dayNo(),who:n%L.length};VISITOR=null;toast(L[t.visit.who][0]+'が、谷へあそびに来た','good')}
/* ---------- 季節のあつまり：谷の場所でひらく、フリーモードだけのイベント ---------- */
const nearC=(L)=>{let b=-1,bd=1e9;for(const j of L){const d=Math.hypot(j%W-CX,((j/W)|0)-CY);if(d<bd){bd=d;b=j}}return b>=0?[b]:[]};/* 村のまん中にいちばん近い1か所 */
const landOK=j=>S.ground[j]===0&&!S.obj[j]&&walk(j);
function fplWild(){const Wd=S.wild||{},L=[];for(const k in Wd){const j=+k;if(S.obj[j]||S.floor[j])continue;let n=0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const q=j+b*W+a;if(Wd[q]!=null&&!S.obj[q]&&!S.floor[q])n++}if(n>=6&&walk(j))L.push(j)}return nearC(L)}
function fplPond(){const L=[];for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++){const j=y*W+x;if(landOK(j)&&[j-1,j+1,j-W,j+W].some(q=>S.ground[q]===1))L.push(j)}return nearC(L)}
function fplGrove(){const L=[],T=o=>o==='ntree'||o==='tree'||o==='fruit';for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++){const j=y*W+x;if(!landOK(j)||valleyEdge(x,y)>-1)continue;let n=0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(T(S.obj[j+b*W+a]))n++;if(n>=4)L.push(j)}return nearC(L)}
function fplHill(){const L=[];for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++){const j=y*W+x;if(landOK(j)&&hiAt(j)>=1&&y>CY)L.push(j)}return nearC(L)}
const fplAt=j=>[j%W+.5,((j/W)|0)+.5];
Object.assign(EVNEED,{fwild:{n:'野の花のむれ',list:fplWild,cap:()=>99,at:fplAt},fpond:{n:'池',list:fplPond,cap:()=>99,at:fplAt},fgrove:{n:'木立',list:fplGrove,cap:()=>99,at:fplAt},fhill:{n:'丘の上',list:fplHill,cap:()=>99,at:fplAt}});
Object.assign(EVENTS,{
  fhanami:{n:'花見',d:'野の花のむれのそばで、おべんとうをひろげて、花をながめる。',stage:6,sea:0,at:11,dur:40,pt:50,per:8,food:2,need:'fwild',gain:{sta:1},fun:20,talk:['#joy|花が、いっぱい！','いいにおい……。','おべんとう、おいしいね。']},
  fsuzumi:{n:'夕すずみ',d:'池のそばで、夕方のすずしい風にあたる。',stage:6,sea:1,at:17,dur:40,pt:50,per:8,need:'fpond',gain:{},fx:'rest',talk:['すずしい……。','池に、夕やけがうつってる。','#joy|風が、きもちいいね。']},
  fdonguri:{n:'どんぐりひろい',d:'木立で、どんぐりをひろって、数をくらべっこする。',stage:6,sea:2,at:13,dur:40,pt:50,per:8,need:'fgrove',gain:{},fxv:3,fx:'donguri',talk:['あった！ ここにも！','#joy|ぼうしつきの、どんぐりだ！','いくつ、ひろえた？']},
  fhoshi:{n:'丘の星見',d:'丘の上にのぼって、みんなで星を見る。',stage:6,sea:3,at:19,late:1,dur:50,pt:50,per:8,need:'fhill',gain:{},fx:'sunny',talk:['#surprise|星が、ちかい！','空が、すんでるね。','くっついてると、あったかい。']}});
EVORDER.push('fhanami','fsuzumi','fdonguri','fhoshi');
/* ---------- おまつりのあと：第2章（火山のたより）・季節の話・きょうの目標 ----------
   どれも「依頼の会話 → その話でした行動 → お礼の会話」。いないせいれいの行ははぶき、FA がいなければはじめない。昼・会話のないときだけ。 */
const fHere=n=>S.res.some(r=>r.name===n&&!r.hidden),fCast=L=>L.filter(x=>fHere(x[0]));
let FBUSY=null;
function fSay(L,fn){FBUSY=S;const s0=S;let once=0;dialog(fCast(L),()=>{if(once++)return;FBUSY=null;if(S!==s0)return;fn();save();renderQuest()})}
const fGearN=()=>(S.gear||[]).length+S.res.reduce((n,r)=>n+Object.keys(r.gear||{}).filter(k=>r.gear[k]).length,0);/* 持っている・つけているそうびの数 */
const FCH2=[
  {t:'火山のたより：火か水のなかまをむかえる',how:'花や家具で、火か水の力をためると、朝、谷の南からやってくる',rw:60,done:()=>S.res.some(r=>r.elem==='fire'||r.elem==='water'),
   ask:(a,b)=>[[a,'ねえ、風があったかい！ 火山のほうから、ふいてくるよ。'],[b,'あっちの土地も、げんきになったんだねぇ。'],[a,'#joy|火や水のせいれいも、来てくれるかな！']],thx:(a,b)=>[[a,'#joy|ようこそ！ 遠くから、よく来てくれたね！'],[b,'谷が、またにぎやかになるねぇ。']]},
  {t:'谷の湯：露天ぶろに入る',how:'「おく」の「建てる」から露天ぶろを建てる。せいれいが入るのを待つ',rw:60,done:()=>!!S.fc2.bath,
   ask:(a,b)=>[[b,'火山には、あったかいお湯がわくんだってねぇ。'],[a,'#joy|この谷にも、ほしいな！ みんなで、つかってみたい！']],thx:(a,b)=>[[b,'#joy|はぁ……。ごくらくだねぇ……。'],[a,'ぽかぽかで、ねむくなっちゃう……。']]},
  {t:'丘のひかり：鉱脈から、そうびを1つ作る',how:'光る岩（鉱脈）を「しらべる」でタップしてほり、炉で延べ棒にして、依頼ボードの「そうび」で作る',rw:80,start:()=>{S.fc2.g0=fGearN()},done:()=>fGearN()>(S.fc2.g0||0),
   ask:(a,b)=>[[a,'#surprise|丘の岩が、きらっと光ったよ！'],[b,'火山の岩と、おなじ光だねぇ。ほってみたら、なにか作れるかもしれないよぉ。']],thx:(a,b)=>[[a,'#joy|ぴかぴかだ！ にあう？'],[b,'にあってるよぉ。']]},
  {t:'谷の火まつり：火まつりをひらく',how:'夏のあいだに、依頼ボードの「イベント」で「火まつり」をひらく',rw:100,done:()=>!!S.fc2.hi,
   ask:(a,b)=>[[a,'火のせいれいって、おどるのがすきなんだって！'],[b,'火をかこんで、たいこにあわせて、おどるらしいねぇ。'],[a,'#joy|やりたい！ 谷でも、やろうよ！']],thx:(a,b)=>[[a,'#joy|どん、どん！ まだ、からだがはずんでる！'],[b,'火が、空まであがったねぇ。']]}];
function fc2St(){return S.fc2||(S.fc2={i:0,on:0})}
function fc2Now(){/* いまの第2章の話（依頼を聞いたあと）。なければ null */if(!S||!S.free||!S.cleared||freeTier()<1)return null;const F=fc2St();return F.on&&FCH2[F.i]?FCH2[F.i]:null}
function fc2Tick(){if(freeTier()<1)return false;const F=fc2St(),q=FCH2[F.i];if(!q)return false;const a=FA(),b=FB();
  if(!F.on){fSay(q.ask(a,b),()=>{F.on=1;if(q.start)q.start();sfx('quest');toast('目標：'+q.t,'good')});return true}
  if(q.done()){fSay(q.thx(a,b),()=>{F.i++;F.on=0;rewardPower(q.rw);memo('ball',q.t.split('：')[0]);if(typeof juiceCheer==='function')juiceCheer()});return true}
  return false}
const FSEA=[{ev:'fhanami',t:'春のお話：野の花のそばで花見をしよう',rw:60},{ev:'fsuzumi',t:'夏のお話：池のそばで夕すずみをしよう',rw:60},{ev:'fdonguri',t:'秋のお話：木立でどんぐりをひろおう',rw:60},{ev:'fhoshi',t:'冬のお話：丘の上で星を見よう',rw:60}],FSEAFIN=100;
const fseaHow=k=>SEASONS[k]+'のあいだに、依頼ボードの「イベント」で「'+EVENTS[FSEA[k].ev].n+'」をひらく';
function fseaAsk(k){const a=FA(),b=FB();return [
  [[a,'#joy|見て見て！ 谷の花が、いっせいに咲いたよ！'],[b,'ふたりきりのころは、ねころんで、ながめてるだけだったねぇ。'],[a,'ことしは、みんなで見たいな。花のそばで、おべんとうも食べよう！']],
  [[b,'夏は、あついねぇ……。ふたりのころは、池のそばで、じっとしてたよぉ。'],[a,'夕方になると、池から、すずしい風がふくんだよね。'],[a,'#joy|みんなにも、おしえてあげたい！']],
  [[a,'木立に、どんぐりがいっぱい落ちてたよ！'],[b,'ふたりのころは、どっちが多くひろえるか、くらべっこしたねぇ。'],[a,'#joy|こんどは、みんなでくらべっこだ！']],
  [[a,'冬の夜は、空がすんでるね。'],[b,'丘の上からだと、星が、もっと近いんだよぉ。ふたりのころ、いちどだけ、のぼったねぇ。'],[a,'#joy|みんなで、のぼってみたい！']]][k]}
function fseaThx(k){const a=FA(),b=FB();return [
  [[a,'#joy|花見、たのしかったね！ 花びらが、おべんとうにのっちゃった！'],[b,'みんなで見ると、花まで、うれしそうだったねぇ。']],
  [[a,'#joy|すずしかったー！'],[b,'池にうつる夕やけ、みんなで見ると、きれいだったねぇ。']],
  [[a,'#joy|ぼく、いちばんひろえたかも！'],[b,'かぞえてるうちに、わからなくなっちゃったねぇ。']],
  [[a,'#joy|星、つかめそうだったね！'],[b,'みんなでくっついてたから、さむくなかったよぉ。']]][k]}
function fseaFinL(){const a=FA(),b=FB();return [[a,'春も、夏も、秋も、冬も。ぜんぶ、みんなですごしたね。'],[b,'ふたりきりのころは、季節って、すぎていくだけだったのにねぇ。'],[a,'#joy|いまは、つぎの季節が、まちどおしいよ！']]}
function fseaSt(){const F=S.fsea||(S.fsea={});F.a||(F.a={});F.e||(F.e={});F.d||(F.d={});return F}
function fseaNow(){/* いまの季節の話（依頼を聞いて、まだお礼を聞いていない）。なければ −1 */if(!S||!S.free||!S.cleared||!S.fsea)return -1;const F=fseaSt(),k=seasonNow();return F.a[k]&&!F.d[k]?k:-1}
function freeEvEnd(id,P){/* イベントを、さいごまでした（events.js の evEnd から）。その話を受けているときだけ数える */if(!S||!S.free||!P||!P.length)return;
  const q=QUESTS[S.quest];if(!S.cleared&&q&&q.id==='fevent'&&S.qTalked)S.fevN=(S.fevN||0)+1;
  if(!S.cleared)return;const F=fseaSt(),k=FSEA.findIndex(x=>x.ev===id);if(k>=0&&F.a[k]&&!F.d[k])F.e[k]=1;
  if(id==='himatsuri'&&fc2Now()===FCH2[3])S.fc2.hi=1}
function fseaTick(){const F=fseaSt();if(F.fin)return;
  for(let k=0;k<4;k++)if(F.e[k]&&!F.d[k])return fSay(fseaThx(k),()=>{F.d[k]=1;rewardPower(FSEA[k].rw);memo('ball',FSEA[k].t.split('：')[0])});/* お礼 */
  if([0,1,2,3].every(k=>F.d[k]))return fSay(fseaFinL(),()=>{F.fin=1;rewardPower(FSEAFIN);memo('ball','谷で、季節がひとめぐりした')});/* しめの話 */
  const k=seasonNow();if(!F.a[k]&&!F.d[k])fSay(fseaAsk(k),()=>{F.a[k]=1;sfx('quest');toast('目標：'+FSEA[k].t,'good')})}
function freeTick(){/* 毎秒くらい（quest-run.js の checkQuest から） */if(freeTier()>=1&&!S.flags.fvol&&stageReady())freeVolOpen();
  if(S.fc2&&S.fc2.on&&S.fc2.i===1&&!S.fc2.bath&&S.res.some(r=>r.act&&r.act.type==='bathe'&&r.act.stage==='do'&&S.obj[anc(r.act.obj)]==='onsen'))S.fc2.bath=1}/* 露天ぶろに入った */
function freeAfterTick(){/* おまつりのあと（昼だけ。おまつりのつぎの朝から） */if(isNight()||!$('#dialog').hidden||NEWRES!=null)return;if(S.clearDay==null)S.clearDay=0;if(dayNo()<=S.clearDay)return;
  if(!S.daily||S.daily.d!==dayNo())dailySet();dailyCheck();checkFree();
  if(FBUSY===S||typeof DLGGAP!=='undefined'&&performance.now()<DLGGAP||S.ev&&S.ev.ph||!fHere(FA()))return;
  if(!fc2Tick())fseaTick()}
function freeGoal(){/* 目標の欄：第2章 → 季節の話 */const q=fc2Now();if(q)return{t:q.t,pr:q.done()?'お話がある':''};const k=fseaNow();if(k<0)return null;const F=fseaSt(),id=FSEA[k].ev;return{t:FSEA[k].t,pr:F.e[k]?'お話がある':S.ev&&S.ev.id===id?'もうすぐ、'+EVENTS[id].n:''}}
function freeSec(body){/* 目標の一覧：第2章と季節の話 */
  if(freeTier()>=1){const F=fc2St(),sec=el('<div class="sec"><h3>火山のたより</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');FCH2.forEach((q,i)=>{if(i>F.i)return;const r=i<F.i?rowEl('✓ '+q.t,'たっせい'):F.on?rowEl('・'+q.t,q.how+'。ごほうび パワー+'+q.rw):rowEl('・つぎのお話','昼になると、はじまる');if(i<F.i)r.classList.add('done');rw.appendChild(r)});body.appendChild(sec)}
  const F=fseaSt(),sec=el('<div class="sec"><h3>季節の話</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
  for(let k=0;k<4;k++){const r=F.d[k]?rowEl('✓ '+FSEA[k].t,'たっせい'):F.a[k]?rowEl('・'+FSEA[k].t,(F.e[k]?'お話がある。':'')+fseaHow(k)+'。ごほうび パワー+'+FSEA[k].rw):rowEl('・'+SEASONS[k]+'のお話',SEASONS[k]+'になると、はじまる');if(F.d[k])r.classList.add('done');rw.appendChild(r)}
  body.appendChild(sec)}
