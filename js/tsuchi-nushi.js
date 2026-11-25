'use strict';
/* 土のステージ：トトの根と、あたらしい谷のヌシ様（tsuchi.js・tsuchi-oku.js のつづき。設定は STORY.md の「土のヌシ様（トト）」）
   ・10階でトトが根になった（S.ts.totoRoot）あと、村へもどると：カメラが巣穴へ・地面がゆれて、巣穴の南に、トトの根（tsroot）がのびて出る（S.ts.rootJ）
   ・目標「トトの根のそばへ」（tsnushi）：つぎの日の昼（TSNUH0〜TSNUH1時）、みんなが根のまわりに集まる（gatherAt）。ハニが自分でえらんで、子どものあなぐま（あたらしい谷のヌシ様）になり、
     根のとなりに、だまってすわる（tsnushi。うごかない・タップでひとこと）。ハニは、せいれいとしては村からいなくなる（S.ts.haniNushi）
   ・場面のあと、目標がおわったら、クリア（S.cleared）
   ・トトが根になったあとは、夜に地われからバケモノは来ない（tsBkWave。コワイノは、クリアのあとも来る）
   ・根と子どものあなぐまは、コードの仮の絵
   たしかめは tools/tests/tsuchi-nushi.cjs */
const TSNUH0=9,TSNUH1=16/* 集まる時刻（この時から、この時の前まで） */;
TSIDS.add('tsroot');TSIDS.add('tsnushi');
BL.tsroot={name:'トトの根',solid:1};BL.tsnushi={name:'谷のヌシ様',solid:1};
/* 根の出る所：巣穴の南のとなりから近い順に、歩けて、物のない、だれもいないマス（巣穴の前の1マスは、あけておく） */
function tsRootCell(){const h=S.ts.hole;if(h==null)return -1;const fr=h+W;
  for(const k of[fr+1,fr-1,fr+W+1,fr+W-1,fr+2,fr-2,fr+W])if(k>=0&&k<W*H&&walk(k)&&!S.obj[k]&&!S.floor[k]&&!riftJ(k)&&!S.res.some(r=>(r.y|0)*W+(r.x|0)===k))return k;
  for(const k of[fr+1,fr-1,fr+W+1,fr+W-1])if(walk(k)&&!riftJ(k)){S.obj[k]='';return k}return -1}
let TSROOTA=null;
function tsRootOpen(){const k=tsRootCell();if(k<0){S.ts.rootJ=-1;return}const owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION,cx=k%W+.5,cy=((k/W)|0)+.5;
  GIFT_ACTIVE=true;showUI(false);const fin=()=>{TSROOTA=null;GIFT_ACTIVE=false;showUI(true);if(ok()){recount();checkQuest()}};
  camAnim=TSROOTA={fz:cam.z,tz:Math.max(cam.z,1.2),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:cx*TS,ty:cy*TS,t:0,dur:1.6,done:()=>{if(!ok())return fin();
    sfx('crack');shakeScreen('m');musicDuck(2400);
    later(()=>{if(!ok())return fin();shakeScreen('l');sfxAt('dust',cx,cy);S.obj[k]='tsroot';delete S.dyn[k];delete S.hp[k];S.ts.rootJ=k;spawnFX(k%W,(k/W)|0,'#8a6640');memo('leaf','巣穴の前から、トトの根がのびてきた');dirty=true;
      later(()=>{fin();if(!ok())return;const ib=S.res.some(r=>r.name===IBUKI&&!r.hidden),hn=S.res.some(r=>r.name===HANI&&!r.hidden);
        dialog([[GOD,'#surprise|おお……巣穴の前から、根が。'],...(ib?[[IBUKI,'#droop|……トトの根、か。']]:[]),...(hn?[[HANI,'……。']]:[])],null,null,GOD)},900)},900)}}}
function tsRootReset(){TSNURUN=false;if(TSROOTA){if(camAnim===TSROOTA)camAnim=null;TSROOTA=null;GIFT_ACTIVE=false}}/* 村を切りかえたとき */
const tsNushiDay=()=>tsOn()&&!!S.ts.totoRoot&&S.ts.rootJ>=0&&S.ts.rootJ!=null&&dayNo()>=S.ts.totoRoot;/* totoRoot は、根になった日+1 */
const tsNushiTime=()=>{const h=hour();return h>=TSNUH0&&h<TSNUH1};
/* 目標の進みぐあい（止まるわけ） */
function tsNushiProg(){if(!S.ts.totoRoot)return '';if(S.ts.rootJ==null)return '村で、根が出るのを待とう';if(!tsNushiDay())return 'つぎの日の昼に';if(!S.res.some(r=>r.name===HANI&&!r.hidden))return HANI+'が、村にいない';if(!tsNushiTime())return '昼に、みんなで集まる';return 'みんなが、根のそばに集まる'}
/* tsTick から（画面があいているとき）：根が出る・ハニの場面・クリア */
let TSNURUN=false;
function tsNushiTick(){if(!S.ts.totoRoot)return false;
  if(S.ts.rootJ==null){tsRootOpen();return true}
  if(S.ts.haniNushi){if(!S.cleared&&S.quest>=QUESTS.length&&S.qStory==null)tsClear();return false}
  if(TSNURUN||!tsNushiDay()||!tsNushiTime()||isNight()||(S.enemies||[]).some(e=>e.spawned&&!e.dead))return false;
  const hn=S.res.find(r=>r.name===HANI&&!r.hidden);if(!hn||questIndexOf('tsnushi')!==S.quest)return false;
  tsNushiScene();return true}
function tsNushiScene(){TSNURUN=true;const k=S.ts.rootJ,TX=k%W+.5,TY=((k/W)|0)+.5,owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION;centerOn(TX*TS,TY*TS);
  gatherAt(TX,TY,()=>{if(!ok())return;const hn=S.res.find(r=>r.name===HANI);if(!hn){TSNURUN=false;return}const ib=()=>S.res.some(r=>r.name===IBUKI&&!r.hidden);
    {const n=performance.now();for(const r of S.res)RHOLD.set(r,n+120000)}hn.face=TX>=hn.x?1:-1;
    dialog([[HANI,'#think|……トトは、ひとりで、底の神をおさえてる。'],[HANI,'……ずっと、ひとりで。'],[GOD,'#worry|ハニ……。'],[HANI,'……ゆるしたわけじゃ、ない。'],[HANI,'#nod|……でも、ひとりには、しない。']],()=>{if(!ok())return;
      /* ハニが光って、子どものあなぐまになり、根のとなりにすわる */
      const j=tsNushiCell(k,hn);sfx('sacred');shakeScreen('m');spawnFX(hn.x-.5,hn.y-.6,'#e8d8b0');
      villageTimeout(()=>{const r=S.res.find(q=>q.name===HANI);if(r){endAct(r);RHOLD.delete(r);S.res=S.res.filter(q=>q!==r)}if(j>=0){S.obj[j]='tsnushi';delete S.dyn[j];delete S.hp[j]}S.ts.haniNushi={j,d:dayNo()};spawnFX(j%W,(j/W)|0,'#c8b890');sfx('arrive');recount();dirty=true;
        villageTimeout(()=>dialog([...(ib()?[[IBUKI,'#surprise|ハニ……！ おまえ、そのすがた……。']]:[]),[GOD,'……あたらしい、谷のヌシ様じゃな。'],[GOD,'……この谷を、たのんだぞ。'],...(ib()?[[IBUKI,'……おれは、ときどき、話しに来るからな。ふたりとも。']]:[])],()=>{
          if(!ok())return;for(const r of S.res)RHOLD.delete(r);TSNURUN=false;memo('star',HANI+'が、あたらしい谷のヌシ様になって、トトの根のとなりにすわった');logEv(HANI+'が、谷のヌシ様になった');checkQuest();tsNushiTick()},null,GOD),1400)},1600)},null,HANI)},null,()=>{TSNURUN=false})}
/* 子どものあなぐまのすわる所：根のとなり（根のよこから） */
function tsNushiCell(k,hn){for(const q of[k+1,k-1,k+W,k-W,k+W+1,k+W-1])if(q>=0&&q<W*H&&walk(q)&&!S.obj[q]&&!riftJ(q)&&!S.res.some(r=>r!==hn&&(r.y|0)*W+(r.x|0)===q))return q;
  for(const q of[k+1,k-1,k+W,k-W])if(q>=0&&q<W*H&&S.ground[q]===0&&!riftJ(q)&&S.obj[q]!=='anagura'){S.obj[q]='';return q}return -1}
/* クリア：ハニがヌシ様になって、目標がおわった */
function tsClear(){if(S.cleared)return;S.cleared=true;clearSnap();reunionCalm();toast('岩の谷に、あたらしいヌシ様が生まれた','good');renderQuest();save()}
/* タップ（tsTap から） */
const TSNUSAY=[['……。'],['……トトは、ねてる。'],['#think|……オリーブ、また、葉がふえた。'],['……ここに、いる。'],['……橋、だれか、わたってた。']];
function tsNushiTap(o){if(o==='tsroot'){toast('トトの根。巣穴の、おくのおくまで、のびている');return true}
  if(o==='tsnushi'){sfx('tap');const L=pickFresh('tsnushi',TSNUSAY);dialog([[HANI,L.join('')]],null,null,HANI);return true}return false}
/* 絵（tsDrawObj から）：仮の絵 */
function tsNushiDraw(c,id,x,y,i,now){const P=(col,a,b,w,h)=>tsPx(c,col,x+a,y+b,w,h);
  if(id==='tsroot'){P('#5a4030',6,24,22,5);P('#6a4a32',8,18,4,8);P('#8a6640',9,18,2,6);P('#6a4a32',14,10,5,16);P('#8a6640',15,10,2,14);P('#6a4a32',21,16,4,10);P('#8a6640',22,16,2,8);P('#6a4a32',11,14,4,3);P('#6a4a32',18,12,4,3);P('#7f9a5a',16,7,3,3);P('#97b06a',17,7,1,1);return true}
  if(id==='tsnushi'){const br=Math.round(Math.sin((now||performance.now())/900+(i|0))*.6);/* 子どものあなぐまが、すわっている（ゆっくり息をする） */
    P('#5c5650',8,16-br,16,12+br);P('#6c665e',10,15-br,12,4);P('#2a2622',11,10-br,10,7);P('#e8e2d6',15,9-br,2,8);P('#111',12,12-br,2,2);P('#111',18,12-br,2,2);P('#3a3430',9,26,5,3);P('#3a3430',18,26,5,3);return true}
  return false}
