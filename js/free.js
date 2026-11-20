'use strict';
/* ---------- フリーモード（free.js） ----------
   花の谷（マップ）：高い丘がぐるりとかこむ、まるい谷。川はない。南に1か所だけ丘の切れ目。谷の中は木が少なく、野の花がむれて咲き、小さな池が4つ。丘の上は森。
     新しくはじめたフリーモードだけ（s.flags.valley）。前のセーブの地形はかえない。
   野の花（S.wild：マス→花の番号）：見た目だけの花。物・床を置いたマスの花はなくなる（wildPurge）。属性の力・みどりのマス・すてき度には数えない。
   お祭りのあと：きょうの目標（freeAfterTick）と、季節の話4つ（FSEA・S.fsea）。 */
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
    add(objectDepth(id,j),1,null,()=>sideClip(j,()=>drawObj(ctx,id,x*TS,y*TS-hiAt(j)*LIFT,j,100,now)),j)}}

/* ---------- お祭りのあと：きょうの目標と、季節の話 ----------
   季節の話（S.fsea：a 依頼を聞いた・e その季節のイベントをおえた・d お礼を聞いた・fin しめの話を聞いた。どれも季節の番号→1）：
   その季節になった昼に、依頼の会話 → その季節のうちにイベントをひらいて、さいごまでする（fseaEvEnd）→ お礼の会話（昼）。どの季節からでもよい。4つおわると、しめの会話。 */
const FSEA=[{ev:'hana',t:'春のお話：花まつりをひらこう',rw:60},{ev:'hanabi',t:'夏のお話：花火の夜をひらこう',rw:60},{ev:'shukaku',t:'秋のお話：しゅうかく祭をひらこう',rw:60},{ev:'lantern',t:'冬のお話：ランタンとばしの夜をひらこう',rw:60}],FSEAFIN=100;
const fseaHow=k=>SEASONS[k]+'のあいだに、依頼ボードの「イベント」で「'+EVENTS[FSEA[k].ev].n+'」をひらく';
function fseaAsk(k){const a=FA(),b=FB();return [
  [[a,'#joy|見て見て！ '+FVAL()+'の花が、いっせいに咲いたよ！'],[b,'ふたりきりのころは、ねころんで、ながめてるだけだったねぇ。'],[a,'ことしは、みんながいるよ。花かんむりをつけて、花の下でおどりたいな！'],[GOD,'#nod|花まつりじゃな。春のうちが、いちばんじゃぞ。']],
  [[b,'夏の夜は、ながいねぇ。ふたりのころは、火もなくて、まっくらだったよぉ。'],[a,'ねえ、カミサマ。夜の空にも、花って咲かせられる？'],[GOD,'#joy|できるとも。たき火から、花火をあげるんじゃ。夏の夜に、みんなで見上げるとよい。'],[a,'#joy|夜の花！ 見たい見たい！']],
  [[b,'畑がねぇ、ことしは、いっぱいみのりそうだよぉ。'],[a,'ふたりのころは、ベリーを半分こ、してたもんね。'],[b,'こんどは、みんなで、おなかいっぱい食べたいねぇ。畑に、ありがとうも言いたいよぉ。'],[GOD,'#nod|しゅうかく祭じゃな。秋のみのりを、みなでいわうとよい。']],
  [[a,'冬の夜は、しずかだね。……ふたりのころは、くっついて、朝をまってたっけ。'],[b,'さむくて、ながくて、ちょっと、こころぼそかったねぇ。'],[a,'ねえ、みんなのねがいごとを、あかりにして、空へとばそうよ！'],[GOD,'#nod|ランタンとばしじゃな。冬のすんだ空に、よくにあうぞ。']]][k]}
function fseaThx(k){const a=FA(),b=FB();return [
  [[a,'#joy|花まつり、たのしかったね！ 花かんむり、まだ頭にのってる気がする！'],[b,'みんなでおどると、花まで、ゆれて見えたねぇ。'],[a,'つぎの春も、またやろうね。']],
  [[a,'#joy|花火、どーんって、おなかにひびいたね！'],[b,'まっくらだった夜が、あんなにあかるくなるなんてねぇ。'],[b,'もう、夏の夜は、さみしくないよぉ。']],
  [[b,'#joy|おなか、いっぱいだねぇ……。'],[a,'半分こじゃなくて、みんなで山もり！ ゆめみたいだったね！'],[b,'畑も、うれしそうだったよぉ。']],
  [[a,'#joy|ランタン、空いっぱいにとんでったね！'],[b,'ぼくのねがいごとはねぇ……「このまま、みんなといられますように」だよぉ。'],[a,'ぼくも、おなじ！']]][k]}
function fseaFinL(){const a=FA(),b=FB();return [[a,'春も、夏も、秋も、冬も。ぜんぶ、みんなですごしたね。'],[b,'ふたりきりのころは、季節って、すぎていくだけだったのにねぇ。'],[a,'#joy|いまは、つぎの季節が、まちどおしいよ！'],[GOD,'#joy|よい村になったのう。季節は、なんどでもめぐる。これからも、たのしむがよいぞ。']]}
const fseaHere=n=>n===GOD||S.res.some(r=>r.name===n&&!r.hidden);
const fseaCast=L=>L.filter(x=>fseaHere(x[0]));/* いないせいれいの行は、はぶく */
function fseaSt(){const F=S.fsea||(S.fsea={});F.a||(F.a={});F.e||(F.e={});F.d||(F.d={});return F}
function fseaNow(){/* いまの季節の話（依頼を聞いて、まだお礼を聞いていない）。なければ −1 */if(!S||!S.free||!S.cleared||!S.fsea)return -1;const F=fseaSt(),k=seasonNow();return F.a[k]&&!F.d[k]?k:-1}
function fseaEvEnd(id,P){/* イベントを、さいごまでした（events.js の evEnd から） */if(!S||!S.free||!S.cleared||!P||!P.length)return;const F=fseaSt(),k=FSEA.findIndex(q=>q.ev===id);if(k>=0&&F.a[k]&&!F.d[k])F.e[k]=1}
let FSEABUSY=null;
function fseaTick(){/* 昼・会話のないときだけ（freeAfterTick から） */if(FSEABUSY===S||typeof DLGGAP!=='undefined'&&performance.now()<DLGGAP||S.ev&&S.ev.ph)return;const F=fseaSt();if(F.fin||!fseaHere(FA()))return;
  const say=(L,fn)=>{FSEABUSY=S;const s0=S;let once=0;dialog(fseaCast(L),()=>{if(once++)return;FSEABUSY=null;if(S!==s0)return;fn();save();renderQuest()})};
  for(let k=0;k<4;k++)if(F.e[k]&&!F.d[k])return say(fseaThx(k),()=>{F.d[k]=1;rewardPower(FSEA[k].rw);memo('ball',EVENTS[FSEA[k].ev].n+'をひらいた')});/* お礼 */
  if([0,1,2,3].every(k=>F.d[k]))return say(fseaFinL(),()=>{F.fin=1;rewardPower(FSEAFIN);memo('ball','村で、季節がひとめぐりした')});/* しめの話 */
  const k=seasonNow();if(!F.a[k]&&!F.d[k])say(fseaAsk(k),()=>{F.a[k]=1;sfx('quest');toast('目標：'+FSEA[k].t,'good')})}
function freeAfterTick(){/* お祭りのあと（quest-run.js。昼だけ。お祭りのつぎの朝から） */if(isNight()||!$('#dialog').hidden||NEWRES!=null)return;if(S.clearDay==null)S.clearDay=0;if(dayNo()<=S.clearDay)return;
  if(!S.daily||S.daily.d!==dayNo())dailySet();dailyCheck();checkFree();fseaTick()}
function fseaGoal(){/* 目標の欄：いまの季節の話 */const k=fseaNow();if(k<0)return null;const F=fseaSt(),id=FSEA[k].ev;return{t:FSEA[k].t,pr:F.e[k]?'お話がある':S.ev&&S.ev.id===id?'もうすぐ、'+EVENTS[id].n:''}}
function fseaSec(body){/* 目標の一覧：季節の話 */const F=fseaSt(),sec=el('<div class="sec"><h3>季節の話</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
  for(let k=0;k<4;k++){const r=F.d[k]?rowEl('✓ '+FSEA[k].t,'たっせい'):F.a[k]?rowEl('・'+FSEA[k].t,(F.e[k]?'お話がある。':'')+fseaHow(k)+'。ごほうび パワー+'+FSEA[k].rw):rowEl('・'+SEASONS[k]+'のお話',SEASONS[k]+'になると、はじまる');if(F.d[k])r.classList.add('done');rw.appendChild(r)}
  body.appendChild(sec)}
