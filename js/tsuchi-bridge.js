'use strict';
/* 土のステージ：谷をつなぐ石の大橋（tsuchi.js のつづき。設定は STORY.md・IDEAS.md の「ちいさなあなぐま」）
   ・場所：自然の岩の橋（TSBRY の2行）の南、1行あけた2行（TSBR2Y）。地われ（はば3）をこえる、はば2マス
   ・目標「谷をつなぐ石の大橋」（tuchi.js の tsbridge）で、ハニが言いだしたあと（S.flags.tsBrOpen）、地われのそのマスをタップして、かける
   ・マスごとに、砂岩 TSBRSAGAN・石材 TSBRSTONE・パワー TSBRPC。せいれいが、おそなえ箱から材料をはこんで、1マスずつ作る（工事の「site」。土のせいれいは速い）
   ・できたマスは、地面（ground 0）になる（S.ts.brd）。6マスぜんぶできたら、橋がつながる（S.flags.tsBridge）
   ・らんかんの花：できあがりの会話でえらぶ（S.ts.brFlower）。橋の両がわに、小さな花の絵（仮の絵）がならぶ
   たしかめは tools/tests/tsuchi-bridge.cjs */
const TSBR2Y=TSBRY+3/* 石の大橋の上の行（2行） */,TSBRSAGAN=6/* 1マスの砂岩 */,TSBRSTONE=2/* 1マスの石材 */,TSBRPC=4/* 1マスのパワー */,TSBRT=60/* 1マスを作る時間 */;
const TSBRFL={iwakagami:'#e6d4f2',salvia:'#e8504a',lily:'#f6f0e6'}/* らんかんの花：えらべる花と、絵の色 */;
BL.tsbridge={name:'石の大橋',solid:1,natural:1};/* 工事のあいだの名前（せいれいがはこぶ。BL の絵は使わない） */
function tsBrCells(){/* 石の大橋のマス：地われのうち、TSBR2Y からの2行。はじめて見たときに決めて、のこす（S.ts.brc） */
  if(!S.ts)return[];if(S.ts.brc)return S.ts.brc;const L=[];for(let y=TSBR2Y;y<TSBR2Y+2;y++)for(let x=0;x<W;x++){const j=y*W+x;if(S.ground[j]===1&&riftJ(j))L.push(j)}return S.ts.brc=L}
const tsBrDoneN=()=>S.ts&&S.ts.brd?S.ts.brd.length:0;
/* 地われのマスをタップ：橋をかける（目標で、ハニが言いだしたあと） */
function tsBridgeTap(j){if(WD!==TSUCHI||!S.ts||!S.flags.tsBrOpen||S.flags.tsBridge)return false;const L=tsBrCells();if(!L.includes(j))return false;
  const free=L.filter(k=>!S.obj[k]&&S.ground[k]===1);if(!free.length){toast('せいれいが、石の大橋をかけています');return true}
  const n=free.length,pc=TSBRPC*n,bm={sagan:TSBRSAGAN*n,stone:TSBRSTONE*n};sfx('tap');
  const P=pxPop('谷をつなぐ石の大橋'),t=el('<div style="line-height:1.6;margin:6px 0"></div>'),go=el('<button class="btn pri" style="width:100%">かける</button>');
  t.textContent='地われに、石の橋をかけます（'+n+'マス）。せいれいが、材料をはこびます。必要：'+matTxt(bm)+'・'+SP(pc);
  go.onclick=()=>{if(S.pt<pc)return toast('パワーが足りません（'+SP(pc)+'）');if(!matOK(bm))return toast('素材が足りません（'+matTxt(bm)+'）');P.close();S.pt-=pc;rsvAdd(bm);/* 素材は、とっておく（せいれいが箱から運ぶ） */
    for(const q of free){S.obj[q]='site';S.dyn[q]={build:'tsbridge',p:0,need:TSBRT,mat:{sagan:TSBRSAGAN,stone:TSBRSTONE},got:{}}}toast('せいれいが、石の大橋をかけにきてくれる');recount();burst(free[0],'furn')};
  P.body.append(t,go);return true}
/* 1マスできた（build.js の finishBuild から） */
function tsBridgeCell(j,r){delete S.dyn[j];S.obj[j]='';S.ground[j]=0;(S.ts.brd||(S.ts.brd=[])).push(j);RIFTS=null;TSRC=null;/* 地われの地図と、タイルの一覧を作りなおす */
  tsRiftSeal();recount();dirty=true;burst(j,'block');if(r)addSpiritXp(4,r);
  if(!S.flags.tsBridge&&tsBrCells().every(k=>S.ts.brd.includes(k)))tsBridgeDone();else if(S.flags.tsBridge&&tsFillRowDone(j))toast('地われの一行が、うまった。近道ができた')}
/* 橋やうめた所で、まわりから切りはなされた地われのマスは、水になってしまう。地われの帯の中の、そのマスもうめる */
function tsRiftSeal(){for(let y=0;y<H;y++){const br=y>=TSBRY-1&&y<=TSBRY+6,x0=tsRiftAt(br?TSBRY:y);for(let x=x0;x<x0+3;x++){const j=y*W+x;if(x<W&&S.ground[j]===1&&!riftJ(j)&&!S.obj[j]){S.ground[j]=0;(S.ts.brd||(S.ts.brd=[])).push(j)}}}}
/* ---- 地われをうめる（橋のあと）：橋のとなりの行から、北・南それぞれ TSFILLROWS 行まで。1行ずつ、橋と同じ材料と時間 ---- */
const TSFILLROWS=6/* 北・南それぞれ、うめられる行の数（地われは、のこす） */;
const tsRowRift=y=>{const L=[];if(y<0||y>=H)return L;for(let x=0;x<W;x++){const j=y*W+x;if(riftJ(j))L.push(j)}return L};
function tsFillRow(y){/* その行が、いま うめられる行か（橋に近い行から、じゅんばん） */if(!S.flags.tsBridge)return false;
  for(const[y0,d]of[[TSBRY-1,-1],[TSBR2Y+2,1]])for(let k=0;k<TSFILLROWS;k++){const yy=y0+d*k;if(yy!==y)continue;return tsRowRift(y).length>0&&(k===0||tsRowRift(y-d).length===0)}return false}
const tsFillRowDone=j=>tsRowRift((j/W)|0).length===0;
function tsFillTap(j){if(WD!==TSUCHI||!S.ts||!S.flags.tsBridge||!riftJ(j))return false;const y=(j/W)|0;
  if(!tsFillRow(y)){toast('地われ。ふかくて、底が見えない（橋のとなりの行から、うめられる）');return true}
  const free=tsRowRift(y).filter(k=>!S.obj[k]);if(!free.length){toast('せいれいが、地われをうめています');return true}
  const n=free.length,pc=TSBRPC*n,bm={sagan:TSBRSAGAN*n,stone:TSBRSTONE*n};sfx('tap');
  const P=pxPop('地われをうめる'),t=el('<div style="line-height:1.6;margin:6px 0"></div>'),go=el('<button class="btn pri" style="width:100%">うめる</button>');
  t.textContent='地われを、一行（'+n+'マス）うめます。歩ける近道ができますが、コワイノも、そこをとおります。必要：'+matTxt(bm)+'・'+SP(pc);
  go.onclick=()=>{if(S.pt<pc)return toast('パワーが足りません（'+SP(pc)+'）');if(!matOK(bm))return toast('素材が足りません（'+matTxt(bm)+'）');P.close();S.pt-=pc;rsvAdd(bm);
    for(const q of free){S.obj[q]='site';S.dyn[q]={build:'tsbridge',p:0,need:TSBRT,mat:{sagan:TSBRSAGAN,stone:TSBRSTONE},got:{}}}toast('せいれいが、地われをうめにきてくれる');recount();burst(free[0],'furn')};
  P.body.append(t,go);return true}
function tsBridgeDone(){S.flags.tsBridge=1;sfx('quest');memo('rock','谷をつなぐ石の大橋が、かかった');toast('石の大橋が、かかった！','good');checkQuest()}
/* らんかんの花：橋のマスの、北と南のふちに、小さな花（仮の絵）。tsRiftDraw から（icScreen の中） */
function tsBrFlowerDraw(){const k=S.ts&&S.ts.brFlower,col=TSBRFL[k];if(!col||!S.ts.brd||!S.flags.tsBridge)return;
  for(const j of S.ts.brd){const x=j%W,y=(j/W)|0,top=y===TSBR2Y,ix=(x-y)*IQW/2,iy=(x+y)*IQH/2+IQH/2;
    for(const s of[-1,0,1]){const px=ix+s*7+(top?-6:6),py=iy+(top?-9:5);ctx.fillStyle='#4a7a3a';ctx.fillRect(px,py+1,1,3);ctx.fillStyle=col;ctx.fillRect(px-1,py-1,3,2);ctx.fillStyle='#f2d860';ctx.fillRect(px,py,1,1)}}}
