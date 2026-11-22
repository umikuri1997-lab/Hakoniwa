'use strict';
/* 霧の中の土地（草原の本編だけ）：マップを4×4の16エリア（areaOf）にわけ、はじめは、まん中の4エリアだけ見える。のこりの12エリアは霧（S.fog）。
   霧のエリアは、となり（上下左右）の晴れたエリアの、みどりのマスが200をこえると晴れる。霧の中には置けない・タップできない・せいれいもコワイノも入らない。
   霧のエリアには、1つずつ見つける物がある（S.fogF）：古い家のあと3・古い宝箱4・ヌシ様のあしあと3・きれいな泉2 */
const FOG_MID=[5,6,9,10],FOG_R=3,FOG_AREA_DONE=.9,FOG_HINTR=6,FOG_FADE=2600,FOG_CELL=4;/* FOG_R：みどりのマス1つで、まわり3マスの霧が晴れる。FOG_AREA_DONE：エリアの9わりが晴れたら、のこりも晴れる（晴れたエリア）。FOG_HINTR：見つける物の手がかりが出る、晴れた所からのマス。FOG_CELL：1マスを4×4のドットにわけて霧を描く */
const FOG_KINDS=['ruin','ruin','ruin','box','box','box','box','print','print','print','spring','spring'];
const FOG_PRINT_LINES=[
 [['フタバ','#surprise|守り神さま、見て！ 大きなあしあと……ヌシ様のだ！'],['フタバ','#think|ヌシ様は、朝になると、ここを通って丘へのぼっていったんだ。'],['フタバ','#joy|角の小さな花が、朝日できらきらして……ぼく、うしろをついて歩くのが好きだった。']],
 [['フタバ','#think|ここにも、ヌシ様のあしあと。まわりの草が、少しだけ青いね。'],['フタバ','ヌシ様が歩いたあとは、しおれた草も、また起きあがったんだって。'],['フタバ','#nod|……いまも、ここの草は元気。なんだか、ヌシ様がそばにいるみたい。']],
 [['フタバ','#think|このあしあと、ふかくて大きい……。ヌシ様が、ここで立ちどまったのかな。'],['フタバ','ヌシ様はね、夕方になると、いつも村のほうをふりかえって見てたんだ。'],['フタバ','#joy|みんな、ちゃんと帰ったかなって。……やさしいヌシ様なんだ。']]];
let FOGM=null,FOGS=null,FOGV=-1;const FOGT=new Map();/* FOGT：うすれていくマス→はじめた時刻（画面の時計） */
/* 晴れたマス（霧のエリアの中）：S.fogc（6マスで1字）。S.fog はエリアごとの印（0：晴れたエリア。中のマスはぜんぶ晴れ） */
const FCA='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';let FCB=null,FCBS=null,FCBT=null;
function fcBits(){if(FCBS!==S||FCBT!==(S.fogc||'')){FCBS=S;FCBT=S.fogc||'';FCB=new Uint8Array(W*H);const t=FCBT;for(let i=0;i<t.length;i++){const v=FCA.indexOf(t[i]);for(let b=0;b<6;b++)if(v>>b&1&&i*6+b<W*H)FCB[i*6+b]=1}}return FCB}
function fcSave(){const B=FCB,n=Math.ceil(W*H/6);let t='';for(let i=0;i<n;i++){let v=0;for(let b=0;b<6;b++)if(B[i*6+b])v|=1<<b;t+=FCA[v]}S.fogc=t.replace(/A+$/,'');FCBT=S.fogc}
const fogOut=f=>!!(f.out||f.set);/* 見つける物が霧から出た（古い家のあと・お屋敷は建った set） */
function fogItemCells(f){const[x,y,w,h]=fogHintBox(f),L=[];for(let b=0;b<h;b++)for(let a=0;a<w;a++)if(x+a<W&&y+b<H)L.push((y+b)*W+x+a);return L}
function fogOn(){return !!S&&WD===0&&!S.free&&Array.isArray(S.fog)}
function fogBuild(){FOGS=S;FOGV=S.fogV||0;const B=fcBits();FOGM=new Uint8Array(W*H);for(let j=0;j<W*H;j++)FOGM[j]=S.fog[areaOf(j)]&&!B[j]?1:0;
  for(const f of S.fogF||[]){if(fogOut(f))continue;const C=fogItemCells(f);if(C.some(k=>FOGM[k]))for(const k of C)if(S.fog[areaOf(k)])FOGM[k]=1}}/* 見つける物は、そのマスがぜんぶ晴れるまで、霧の中（半分だけ見えない） */
function fogAt(j){if(WD===WIND)return windSunk(j);/* 風：雲にしずんだ島（wind.js） */if(WD===MIZU)return !!S&&!!S.mz&&mzMistAt(j);/* 水のステージの霧は、マスごと（mizube.js） */if(!fogOn())return false;if(FOGS!==S||FOGV!==(S.fogV||0))fogBuild();return FOGM[j]===1}
function fogSouth(x){/* その列で、晴れている所のいちばん下の行（コワイノは、ここから来る）。ぜんぶ霧なら -1 */if(!fogOn())return H-1;for(let y=H-1;y>=0;y--)if(!fogAt(y*W+x))return y;return -1}
function fogBlock(id,x,y,quiet){if(!fogOn()&&WD!==WIND&&!(WD===MIZU&&S&&S.mz))return false;/* 風：雲にしずんだ島にも置けない */const z=(typeof szR==='function'&&szR(id,PLROTS[id]||0))||[1,1],w=RUGS.has(id)||CANOPY.has(id)?2:z[0],h=RUGS.has(id)||CANOPY.has(id)?2:z[1];for(let b=0;b<h;b++)for(let a=0;a<w;a++){const nx=x+a,ny=y+b;if(nx>=0&&ny>=0&&nx<W&&ny<H&&fogAt(ny*W+nx)){if(!quiet)toast(WD===WIND?'雲にしずんだ島には置けません':'霧で見えない所には置けません','warn');return true}}return false}
const fogFind=j=>(S.fogF||[]).find(f=>f.j===j);
function fogArea(a){const x0=(a%AREAN)*AREAW,y0=((a/AREAN)|0)*AREAW;return {x0,y0,x1:x0+AREAW,y1:y0+AREAW}}
function fogSpotOK(s,j,hi){return s.ground[j]===0&&!s.obj[j]&&!s.floor[j]&&(hi==null||(s.hi?s.hi[j]||0:0)===hi)}
function fogShuffle(L){for(let i=L.length-1;i>0;i--){const k=(Math.random()*(i+1))|0;[L[i],L[k]]=[L[k],L[i]]}return L}
/* 古い家のあと（小屋）：しゅるいごとに大きさと、のこっている家具（こわれた家具。スポットにならない組み合わせ）がちがう。家具は中の [よこ,たて]（かべの内がわ。ドアの上のマスはあける） */
const RUIN_KINDS={naya:{w:6,h:4,n:'古い納屋のあと',furn:[['crate',1,1],['taru',2,1],['makidana',4,1]]},kitchen:{w:5,h:4,n:'古い台所のあと',furn:[['oven',1,1],['table',2,1],['tub',3,1]]},monooki:{w:4,h:4,n:'古い物置のあと',furn:[['makidana',1,1],['asabukuro',2,1]]}},RUIN_ORDER=['naya','kitchen','monooki'];
const ruinWH=f=>{const k=RUIN_KINDS[f.k];return k?[k.w,k.h]:[5,4]};/* しゅるいのない前の小屋は5×4 */
function ruinFits(s,j,w,h){const x=j%W,y=(j/W)|0,hi=s.hi?s.hi[j]||0:0;for(let q=0;q<=h;q++)for(let c=0;c<w;c++){const k=(y+q)*W+x+c;if(x+c>=W||y+q>=H||!fogSpotOK(s,k,hi))return false}return true}
function fogRuinAt(s,R,w,h){/* 古い家のあと：w×h と、ドアの前の1行が、平らで空いている所 */w=w||5;h=h||4;for(let tr=0;tr<3000;tr++){const x=R.x0+3+((Math.random()*(AREAW-6-w))|0),y=R.y0+3+((Math.random()*(AREAW-6-h))|0);if(ruinFits(s,y*W+x,w,h))return y*W+x}return -1}
function fogGen(s,areas){/* 霧のエリアに、見つける物を1つずつ置く（作るのはいちど。セーブにのこる）。古い家のあとは、置ける所のあるエリアから先にえらぶ */const out=[],rest=[];let ruins=0;
  const used=new Set();for(const k of fogShuffle(RUIN_ORDER.slice())){const K=RUIN_KINDS[k];for(const a of fogShuffle(areas.filter(a=>!used.has(a)))){const j=fogRuinAt(s,fogArea(a),K.w,K.h);if(j>=0){out.push({t:'ruin',a,j,k});used.add(a);ruins++;break}}}/* 小屋のしゅるいごとに、置ける所のあるエリアをさがす */
  for(const a of areas)if(!used.has(a))rest.push(a);
  const K=fogShuffle(FOG_KINDS.filter(t=>t!=='ruin').concat(Array(3-ruins).fill('box')));
  rest.forEach((a,n)=>{const t=K[n%K.length],R=fogArea(a);for(let tr=0;tr<400;tr++){const x=R.x0+4+((Math.random()*(AREAW-8))|0),y=R.y0+4+((Math.random()*(AREAW-8))|0),j=y*W+x;const n=t==='spring'?2:1;let ok=true;for(let b=0;b<=n&&ok;b++)for(let c=0;c<n&&ok;c++)if(!fogSpotOK(s,j+b*W+c,s.hi?s.hi[j]||0:0)&&(b<n||t!=='print'))ok=false;if(!ok)continue;/* 泉は2×2。前に1マスあけて、せいれいが近よれるように */
    s.obj[j]=t==='box'?'fogbox':t==='print'?'nushiprint':'fogspring';if(n>1)fogParts(s,j);out.push({t,a,j});return}});
  s.fogF=out;fogMansionAdd(s)}
function fogParts(s,j){for(const k of [j+1,j+W,j+W+1]){s.obj[k]='part';s.ref[k]=j}}
function fogSpring2(s){/* 前のセーブの1×1の泉を2×2へ（そのマスをふくむ4とおりのどれかで、3マスが空いていれば）。空いていなければ、そのまま、あとの recount でまたためす */
  if(s.flags.spring2||!s.fogF)return;let left=0;
  for(const f of s.fogF){if(f.t!=='spring'||s.obj[f.j]!=='fogspring'||s.obj[f.j+1]==='part'&&s.ref[f.j+1]===f.j)continue;const x=f.j%W,y=(f.j/W)|0,hi=s.hi?s.hi[f.j]||0:0;
    const a=[[0,0],[-1,0],[0,-1],[-1,-1]].map(([dx,dy])=>[x+dx,y+dy]).find(([ax,ay])=>ax>=0&&ay>=0&&ax<W-1&&ay<H-1&&[0,1,W,W+1].every(d=>{const k=ay*W+ax+d;return k===f.j||fogSpotOK(s,k,hi)&&!(s.res||[]).some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===k)}));
    if(!a){left++;continue}const j=a[1]*W+a[0];s.obj[f.j]='';s.obj[j]='fogspring';fogParts(s,j);f.j=j}
  if(!left)s.flags.spring2=1}
function fogInit(s){/* あたらしい草原：まん中の4エリアだけ晴れている */s.fog=Array.from({length:AREAN*AREAN},(_,a)=>FOG_MID.includes(a)?0:1);s.fogV=0;s.fogReq=[];s.flags.fog1=1;fogGen(s,s.fog.map((v,a)=>v?a:-1).filter(a=>a>=0))}
function fogMigrate(s){/* 前からのセーブ（いちどだけ）：村のマス・置いた物があるエリアは、晴れたまま */if(s.flags.fog1)return;s.flags.fog1=1;if((s.world||0)!==0||s.free)return;
  const open=new Set(FOG_MID),mark=j=>{const x=j%W,y=(j/W)|0;for(let b=-3;b<=3;b++)for(let a=-3;a<=3;a++){const nx=x+a,ny=y+b;if(nx>=0&&ny>=0&&nx<W&&ny<H)open.add(areaOf(ny*W+nx))}};/* 村は、置いた物のまわり3マス */
  for(let j=0;j<W*H;j++){const o=s.obj[j];if(s.floor[j]||o&&(o==='part'||BL[o]&&!BL[o].natural&&!WEEDS.has(o)))mark(j)}for(const k in s.rug||{})mark(+k);for(const k in s.roof||{})mark(+k);
  for(const r of s.res||[])open.add(areaOf(((r.y|0)*W)+(r.x|0)));if(s.sacredRoot!=null)mark(s.sacredRoot);
  s.fog=Array.from({length:AREAN*AREAN},(_,a)=>open.has(a)?0:1);s.fogV=0;s.fogReq=[];const fa=s.fog.map((v,a)=>v?a:-1).filter(a=>a>=0);if(!fa.length){delete s.fog;return}fogGen(s,fa)}
function fogAfterRecount(){/* recount のあと：晴れた所のみどりのマス（水はのぞく）のまわり3マスの霧が晴れる。古い家のあとが家になったら、ごほうび */if(!fogOn()||MEMRUN||NOSAVE)return;/* 思い出の場面（一時の花など）では、晴らさない */const quiet=!stageReady();/* マップを作っているあいだ（はじめ・読みこみ）は、うすれずに晴れる */
  if(FOGS!==S||FOGV!==(S.fogV||0))fogBuild();const B=fcBits(),add=[],R=FOG_R;
  if(S.fog.some(v=>v))for(const k of REV){if(S.ground[k]===1||FOGM[k])continue;const x=k%W,y=(k/W)|0,ax0=(Math.max(0,x-R)/AREAW)|0,ax1=(Math.min(W-1,x+R)/AREAW)|0,ay0=(Math.max(0,y-R)/AREAW)|0,ay1=(Math.min(H-1,y+R)/AREAW)|0;let near=false;
    for(let ay=ay0;ay<=ay1&&!near;ay++)for(let ax=ax0;ax<=ax1;ax++)if(S.fog[ay*AREAN+ax]){near=true;break}if(!near)continue;/* まわりが晴れたエリアだけなら、しらべない */
    for(let b=-R;b<=R;b++){const ny=y+b;if(ny<0||ny>=H)continue;for(let a=-R;a<=R;a++){const nx=x+a;if(nx<0||nx>=W)continue;const q=ny*W+nx;if(!B[q]&&S.fog[areaOf(q)]){B[q]=1;add.push(q)}}}}
  fogCellsDone(add,quiet);
  for(const f of S.fogF||[]){if(f.t!=='ruin'||!f.set||f.done)continue;const c=ruinDoor(f)-W,[rw,rh]=ruinWH(f);if(fogRing(f.j,rw,rh).every(k=>HOME_WALLS.has(S.obj[k])||HOME_DOORS.has(S.obj[k]))&&HOUSES.some(h=>h.inside.has(c))){f.done=1;f.find=1;/* 中のわすれ物は、せいれいが見つける（ruinFindTick） */toast((RUIN_KINDS[f.k]?RUIN_KINDS[f.k].n.replace('のあと',''):'古い家')+'が、よみがえった','good')}}}
function fogRing(j,w,h){/* 古い家のあと：w×h マスのまわり（下のまん中がドア） */w=w||5;h=h||4;const x=j%W,y=(j/W)|0,L=[];for(let b=0;b<h;b++)for(let a=0;a<w;a++)if(a===0||a===w-1||b===0||b===h-1)L.push((y+b)*W+x+a);return L}
function ruinGap(f,rnd){/* 古い家のあとの、角でもドアでもない壁のマスを1つ、なにもない所にする（こわれたあとの印もけす）。もうなにもない所があれば、そのまま */
  const [rw,rh]=ruinWH(f),x=f.j%W,y=(f.j/W)|0,door=ruinDoor(f),B=S.broken||(S.broken=[]),L=fogRing(f.j,rw,rh).filter(k=>{const a0=k%W-x,b0=((k/W)|0)-y;return k!==door&&!((a0===0||a0===rw-1)&&(b0===0||b0===rh-1))});
  if(L.some(k=>!S.obj[k]&&!B.some(b=>b.j===k)))return;const C=L.filter(k=>S.obj[k]==='hwall'||!S.obj[k]&&B.some(b=>b.j===k&&b.id==='hwall'));if(!C.length)return;
  const k=C[Math.min(C.length-1,(rnd()*C.length)|0)];if(S.obj[k]==='hwall'){S.obj[k]='';if(S.hp)delete S.hp[k]}S.broken=B.filter(b=>b.j!==k)}
function ruinGapMigrate(){/* 前のセーブ（いちどだけ）：晴れていて、まだ家にもどっていない古い家のあとにも、なくなった壁を1つ */if(S.flags.ruinGap1)return;S.flags.ruinGap1=1;for(const f of S.fogF||[])if(f.t==='ruin'&&f.set&&!f.done){const r=fogRand(f.j*2246822519+7);ruinGap(f,r)}}
const ruinDoor=(f)=>{const [w,h]=ruinWH(f);return f.j+(h-1)*W+(w>>1)};
/* お屋敷：霧のエリアの1つに、そのまま住める大きな家（よこ12×たて9。部屋は3つ）。晴れたときに建つ。場所は、はじめに1回だけきめる */
const MANSION_W=12,MANSION_H=9,MANSION_DOORS=[[3,8],[6,6],[8,4]],MANSION_WIN=[[2,0],[4,0],[8,0],[10,0]],
  MANSION_FURN=[['shelf1',1,1],['monstera',5,1],['table',3,3],['chair',2,3],['chair',4,3],['lantern',5,4],['stool',1,7],/* 居間 */
    ['bed',7,2],['bed',10,2],['lantern',9,1],/* 寝室 */['cooktable',7,5],['sink',9,5],['taru',10,5],['crate',10,7],['stool',8,7]],/* 台所 */
  MANSION_RUG=[['rug1',1,5]];
function mansionWall(a,b){return a===0||a===MANSION_W-1||b===0||b===MANSION_H-1||a===6||b===4&&a>6}
const fogHi=(s,k)=>s.hi?s.hi[k]||0:0;
function fogMansionAt(s,R,busy,move){/* 水も見つける物もない所（ドアの前の1行も）。段差がいちばん少ない所。move：ずらせる見つける物（あれば、そのマスも使ってよい） */let best=-1,bs=1e9;
  for(let y=R.y0+2;y+MANSION_H+1<=R.y1-1;y++)for(let x=R.x0+2;x+MANSION_W<=R.x1-2;x++){let ok=true,t=9;
    for(let b=-1;b<=MANSION_H+1&&ok;b++)for(let a=-1;a<=MANSION_W&&ok;a++){const k=(y+b)*W+x+a;if(s.ground[k]!==0)ok=false;else t=Math.min(t,fogHi(s,k))}
    let sc=0;for(let b=0;b<=MANSION_H&&ok;b++)for(let a=0;a<MANSION_W&&ok;a++){const k=(y+b)*W+x+a,o=s.obj[k];if(s.floor[k]||busy.has(k)&&!(move&&move.has(k))||o&&!(WEEDS.has(o)||BL[o]&&BL[o].natural&&!BL[o].sz||move&&move.has(k)))ok=false;else sc+=fogHi(s,k)-t}
    if(ok&&sc<bs){bs=sc;best=y*W+x}}return best}
function fogFlatten(s,j){/* お屋敷の所（まわり1マスも）を、いちばん低い高さにそろえ、まわりの段差は、2マス以内の差が1だんまでになるよう低くする */if(!s.hi)return;const x=j%W,y=(j/W)|0;let t=9;const box=[];for(let b=-1;b<=MANSION_H+1;b++)for(let a=-1;a<=MANSION_W;a++){const k=(y+b)*W+x+a;box.push(k);t=Math.min(t,fogHi(s,k))}
  const lock=new Set(box);for(const k of box)s.hi[k]=t;let ch=true;for(let n=0;ch&&n<20;n++){ch=false;for(let b=-8;b<=MANSION_H+9;b++)for(let a=-8;a<=MANSION_W+8;a++){const X=x+a,Y=y+b;if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(lock.has(k))continue;let m=9;for(let q=-2;q<=2;q++)for(let p=-2;p<=2;p++){const U=X+p,V=Y+q;if(U<0||V<0||U>=W||V>=H)continue;m=Math.min(m,fogHi(s,V*W+U))}if(fogHi(s,k)>m+1){s.hi[k]=m+1;ch=true}}}}
const MANSION_AREA=AREAN-1;/* お屋敷は、いつもマップの右上のエリア */
function fogMansionAdd(s){/* 新しい草原と、前のセーブ（いちどだけ）：右上のエリアが霧なら、お屋敷の場所をそこにきめる。前のセーブで、ほかのエリアにきめてあって、まだ建っていない物は、右上へうつす（右上が晴れているか、置ける所がなければ、そのまま） */
  if(s.flags.mansion2||!s.fogF)return;s.flags.mansion1=s.flags.mansion2=1;if((s.world||0)!==0||s.free)return;
  const a=MANSION_AREA,old=s.fogF.find(f=>f.t==='mansion');if(old&&(old.set||old.a===a)||!s.fog[a])return;
  const busy=new Set(),own=new Map();for(const f of s.fogF){if(f===old)continue;const x=f.j%W,y=(f.j/W)|0,n=f.t==='ruin'?Math.max(...ruinWH(f)):f.t==='spring'?2:1;for(let b=-1;b<=n+1;b++)for(let c=-1;c<=n;c++){busy.add((y+b)*W+x+c);if(f.t!=='ruin'&&f.a===a)own.set((y+b)*W+x+c,f)}}
  let j=fogMansionAt(s,fogArea(a),busy);if(j<0){j=fogMansionAt(s,fogArea(a),busy,new Set(own.keys()));if(j<0)return;/* 見つける物が、じゃまなら、同じエリアの空いた所へずらす */
    const R=fogArea(a),mx=j%W,my=(j/W)|0,inM=k=>{const X=k%W,Y=(k/W)|0;return X>=mx-1&&X<=mx+MANSION_W&&Y>=my-1&&Y<=my+MANSION_H+1};
    for(const f of new Set(own.values())){const n=f.t==='spring'?2:1;let nj=-1;for(let tr=0;tr<2000&&nj<0;tr++){const x=R.x0+2+((Math.random()*(AREAW-5))|0),y=R.y0+2+((Math.random()*(AREAW-5))|0),k=y*W+x;let ok=true;for(let b=0;b<=n&&ok;b++)for(let c=0;c<n&&ok;c++){const q=k+b*W+c;if(inM(q)||!fogSpotOK(s,q,fogHi(s,k)))ok=false}if(ok)nj=k}
      if(nj<0)return;const o=s.obj[f.j];for(const q of [f.j,f.j+1,f.j+W,f.j+W+1])if(q===f.j||s.obj[q]==='part'&&s.ref[q]===f.j){s.obj[q]='';delete s.ref[q]}s.obj[nj]=o;if(n>1)fogParts(s,nj);f.j=nj}}
  fogFlatten(s,j);if(old){old.a=a;old.j=j}else s.fogF.push({t:'mansion',a,j})}
const MANSION_WEB=[[2,1,0],[4,1,1],[7,1,0],[10,1,1],[8,5,0]];/* クモの巣（部屋の上の角。0：左の角・1：右の角） */
function fogRand(seed){let v=seed>>>0||1;return ()=>{v^=v<<13;v>>>=0;v^=v>>>17;v^=v<<5;v>>>=0;return v/4294967296}}
function fogMansionBuild(f){/* 晴れたとき：古くてボロボロのお屋敷。朽ちた壁・こわれた壁・こわれた家具・クモの巣 */const x=f.j%W,y=(f.j/W)|0,rnd=fogRand(f.j*2654435761+7);
  for(let b=0;b<=MANSION_H;b++)for(let a=0;a<MANSION_W;a++){const k=(y+b)*W+x+a;if(S.obj[k]&&S.obj[k]!=='part'&&!(BL[S.obj[k]]&&BL[S.obj[k]].natural||WEEDS.has(S.obj[k])))continue;S.obj[k]='';delete S.dyn[k];delete S.hp[k];delete S.hp['lp'+k];delete S.ref[k]}
  S.drops=(S.drops||[]).filter(d=>!(d.x>=x&&d.x<x+MANSION_W&&d.y>=y&&d.y<=y+MANSION_H));const brk=(id,k)=>(S.broken||(S.broken=[])).push({j:k,id,rot:0});
  for(let b=0;b<MANSION_H;b++)for(let a=0;a<MANSION_W;a++){const k=(y+b)*W+x+a;if(!mansionWall(a,b)){S.floor[k]='floor';continue}
    if(MANSION_DOORS.some(([da,db])=>da===a&&db===b)){setBlock('door',k);continue}
    const corner=(a===0||a===MANSION_W-1)&&(b===0||b===MANSION_H-1),win=MANSION_WIN.some(([wa,wb])=>wa===a&&wb===b),r=rnd();
    if(!corner&&!win&&r<.14){brk('hwall',k);continue}/* こわれて、なくなった壁 */
    setBlock('hwall',k);if(r<.62)S.hp[k]=Math.max(1,Math.floor(BL.hwall.hp*(.15+rnd()*.3)))}/* 朽ちた壁（じょうぶさ半分以下） */
  for(const[a,b]of MANSION_WIN)(S.win||(S.win={}))[(y+b)*W+x+a]=1;
  let beds=0;for(const[id,a,b]of MANSION_FURN){const k=(y+b)*W+x+a,r=rnd(),keep=id==='bed'&&!beds;if(id==='bed')beds++;if(!keep&&r<.18)continue;/* なくなった家具 */if(!keep&&r<.42&&BL[id].brk){brk(id,k);continue}/* こわれた家具 */setBlock(id,k);if(BL[id].brk&&BL[id].hp&&rnd()<.4)S.hp[k]=Math.max(1,Math.floor(BL[id].hp/2))}/* いたんだ家具 */
  for(const[id,a,b]of MANSION_RUG)(S.rug||(S.rug={}))[(y+b)*W+x+a]=id;
  for(const[a,b,v]of MANSION_WEB){const k=(y+b)*W+x+a;if(S.floor[k]&&!S.obj[k])(S.web||(S.web={}))[k]=v}
  f.set=1;f.done=1}
function fogCellsDone(add,quiet,force){/* 晴れたマス add：うすれていく・エリアの9わりで、のこりも晴れる・見つける物はマスがぜんぶ晴れたら出る */const B=fcBits(),now=performance.now(),areas=new Set(add.map(areaOf));if(force!=null)areas.add(force);if(!quiet)for(const q of add)FOGT.set(q,now);
  for(const a of areas){if(!S.fog[a])continue;const R=fogArea(a);let n=0;for(let y=R.y0;y<R.y1;y++)for(let x=R.x0;x<R.x1;x++)if(B[y*W+x])n++;if(a!==force&&n<AREAW*AREAW*FOG_AREA_DONE)continue;
    for(let y=R.y0;y<R.y1;y++)for(let x=R.x0;x<R.x1;x++){const k=y*W+x;if(!B[k]){B[k]=1;add.push(k);if(!quiet)FOGT.set(k,now)}}fogAreaDone(a)}
  if(!add.length&&force==null)return;fcSave();S.fogV=(S.fogV||0)+1;fogBuild();if(typeof SPRC!=='undefined')SPRC.n=-1;/* コワイノの来る所を作りなおす */
  for(const f of S.fogF||[])if(!fogOut(f)&&fogItemCells(f).every(k=>B[k]||!S.fog[areaOf(k)]))fogItemOut(f);
  fogBuild();dirty=true}
function fogAreaDone(a){S.fog[a]=0;villageTimeout(()=>{recount();if(typeof kdInit==='function')kdInit()},60)}/* 晴れたエリア：もりのこだまを置く（晴れて、歩けるようになってから） */
function fogClear(a,quiet){/* エリアぜんぶを晴らす（前のセーブ・テスト） */if(!S.fog||!S.fog[a])return;const R=fogArea(a),B=fcBits(),add=[];for(let y=R.y0;y<R.y1;y++)for(let x=R.x0;x<R.x1;x++){const k=y*W+x;if(!B[k]){B[k]=1;add.push(k)}}fogCellsDone(add,quiet,a)}
function fogItemOut(f){/* 見つける物のマスが、ぜんぶ晴れた */f.out=1;
  if(f.t==='mansion'&&!f.set){fogMansionBuild(f);villageTimeout(()=>recount(),30)}
  if(f.t==='ruin'&&!f.set){if(!f.k){for(const k of RUIN_ORDER){const K=RUIN_KINDS[k];if(!(S.fogF||[]).some(g=>g!==f&&g.k===k)&&ruinFits(S,f.j,K.w,K.h)){f.k=k;break}}if(!f.k&&ruinFits(S,f.j,5,4))f.k='kitchen'}/* 前のセーブの小屋：入るしゅるいをえらぶ */
    f.set=1;const [rw,rh]=ruinWH(f),x=f.j%W,y=(f.j/W)|0,door=ruinDoor(f),rnd=fogRand(f.j*2246822519+3),brk=(id,k)=>(S.broken||(S.broken=[])).push({j:k,id,rot:0});
    fogRing(f.j,rw,rh).forEach(k=>{const o=S.obj[k];if(o&&!(BL[o]&&BL[o].natural||WEEDS.has(o)))return;if(o)S.obj[k]='';S.drops=(S.drops||[]).filter(d=>d.y*W+d.x!==k);const a0=k%W-x,b0=((k/W)|0)-y,corner=(a0===0||a0===rw-1)&&(b0===0||b0===rh-1);if(k!==door&&(corner||rnd()<.4))S.obj[k]='hwall';else brk(k===door?'door':'hwall',k)});/* のこっている壁（角と、いくつか）。ほかは、こわれたあと */
    ruinGap(f,rnd);/* 壁が1つは、こわれたあとものこらずに、なくなっている（直すだけでは家にならない） */
    for(const[id,a0,b0]of (RUIN_KINDS[f.k]||{furn:[]}).furn){const k=(y+b0)*W+x+a0,o=S.obj[k];if(o&&!(BL[o]&&BL[o].natural||WEEDS.has(o)))continue;if(o)S.obj[k]='';brk(id,k)}/* むかしの使いみちがわかる家具（こわれている。直すと使える） */
    villageTimeout(()=>recount(),30)}}
const FOGC=document.createElement('canvas');let FOGX=null,FOGN=null,FOGPV=-1,FOGPS=null;
function fogNoise(){if(FOGN)return FOGN;const n=W*FOG_CELL,N=new Float32Array(n*n),h=(a,b)=>{const v=Math.imul(a*374761393+b*668265263,1274126177)>>>0;return (v%1000)/1000},sm=t=>t*t*(3-2*t);
  const oct=(cx,cy,sz)=>{const gx=cx/sz,gy=cy/sz,ix=gx|0,iy=gy|0,fx=sm(gx-ix),fy=sm(gy-iy),a=h(ix,iy),b=h(ix+1,iy),c=h(ix,iy+1),d=h(ix+1,iy+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)N[y*n+x]=oct(x,y,14)*.65+oct(x+31,y+17,5)*.35;return FOGN=N}
function fogCellA(j,now){if(FOGM[j])return 1;const t0=FOGT.get(j);if(t0==null)return 0;const p=(now-t0)/FOG_FADE;return p>=1?0:1-p}
function fogPaint(cx0,cy0,cx1,cy1,now){/* 霧の絵の一部（ドットの範囲）を作る。霧のマスは、うすいマスとのさかいを2.5マスでうすく */const n=W*FOG_CELL,N=fogNoise();if(!FOGX){FOGC.width=FOGC.height=n;FOGX=FOGC.getContext('2d')}
  cx0=Math.max(0,cx0);cy0=Math.max(0,cy0);cx1=Math.min(n,cx1);cy1=Math.min(n,cy1);if(cx1<=cx0||cy1<=cy0)return;if(FOGS!==S||FOGV!==(S.fogV||0))fogBuild();const w=cx1-cx0,h=cy1-cy0,img=FOGX.createImageData(w,h),D=img.data,FC=FOG_CELL,ED=2.5*FC,M=3;
  const tx0=Math.max(0,((cx0/FC)|0)-M),ty0=Math.max(0,((cy0/FC)|0)-M),tx1=Math.min(W,(((cx1-1)/FC)|0)+M+1),ty1=Math.min(H,(((cy1-1)/FC)|0)+M+1),tw=tx1-tx0,AL=new Float32Array(tw*(ty1-ty0)),ED2=new Uint8Array(tw*(ty1-ty0));
  for(let y=ty0;y<ty1;y++)for(let x=tx0;x<tx1;x++)AL[(y-ty0)*tw+x-tx0]=fogCellA(y*W+x,now);
  for(let y=ty0;y<ty1;y++)for(let x=tx0;x<tx1;x++){const A=AL[(y-ty0)*tw+x-tx0];if(A<=0)continue;let e=0;for(let b=-M;b<=M&&!e;b++){const yy=y+b;if(yy<ty0||yy>=ty1)continue;for(let a=-M;a<=M;a++){const xx=x+a;if(xx>=tx0&&xx<tx1&&AL[(yy-ty0)*tw+xx-tx0]<A){e=1;break}}}ED2[(y-ty0)*tw+x-tx0]=e}/* うすいマスが3マス以内にある霧のマスだけ、さかいをしらべる */
  for(let y=cy0;y<cy1;y++){const cy=(y/FC)|0;for(let x=cx0;x<cx1;x++){const c=(x/FC)|0,i=(cy-ty0)*tw+c-tx0,A=AL[i];let v=A;
    if(A>0&&ED2[i]){const px=x+.5,py=y+.5;for(let b=-M;b<=M;b++){const yy=cy+b;if(yy<ty0||yy>=ty1)continue;for(let a=-M;a<=M;a++){const xx=c+a;if(xx<tx0||xx>=tx1)continue;const B=AL[(yy-ty0)*tw+xx-tx0];if(B>=A)continue;const dx=Math.max(xx*FC-px,0,px-(xx+1)*FC),dy=Math.max(yy*FC-py,0,py-(yy+1)*FC),d=Math.max(dx,dy);if(d<ED)v=Math.min(v,B+(A-B)*d/ED)}}}
    const nz=N[y*n+x];if(A<1&&A>0)v=Math.max(0,Math.min(v,v*1.7-nz*.7));/* 晴れていくときは、うすい所からまだらに消える */let o=v*(.86+nz*.14);o=Math.round(o*10)/10;const q=((y-cy0)*w+(x-cx0))*4,s2=nz>.55?1:0;D[q]=s2?244:226;D[q+1]=s2?246:232;D[q+2]=s2?248:238;D[q+3]=o*250}}
  FOGX.putImageData(img,cx0,cy0)}
function drawFog(ctx,x0,y0,x1,y1,now){/* 霧をかく（夜の暗さより下）。毎コマは、見えている所を1まいの絵からうつすだけ。うすれていくマスのまわりだけ、作りなおす */if(!fogOn())return;fogAt(0);if(FOGPS!==S||FOGPV!==(S.fogV||0)&&!FOGT.size){FOGPS=S;FOGPV=S.fogV||0;FOGT.clear();fogPaint(0,0,W*FOG_CELL,W*FOG_CELL,now)}
  if(FOGT.size){let a0=W,b0=H,a1=-1,b1=-1;for(const[k,t0]of FOGT){const x=k%W,y=(k/W)|0;if(x<a0)a0=x;if(x>a1)a1=x;if(y<b0)b0=y;if(y>b1)b1=y;if(now-t0>=FOG_FADE)FOGT.delete(k)}const m=3;fogPaint((a0-m)*FOG_CELL,(b0-m)*FOG_CELL,(a1+m+1)*FOG_CELL,(b1+m+1)*FOG_CELL,now);if(!FOGT.size)FOGPV=S.fogV||0}
  if(!S.fog.some(v=>v)&&!FOGT.size)return;const X0=Math.max(0,x0-1),Y0=Math.max(0,y0-1),X1=Math.min(W,x1+1),Y1=Math.min(H,y1+2);if(X1<=X0||Y1<=Y0)return;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(FOGC,X0*FOG_CELL,Y0*FOG_CELL,(X1-X0)*FOG_CELL,(Y1-Y0)*FOG_CELL,X0*TS,Y0*TS,(X1-X0)*TS,(Y1-Y0)*TS);ctx.imageSmoothingEnabled=true}

/* 霧の中の手がかり：晴れた所から6マス（FOG_HINTR）にある、まだ霧の中の見つける物の所に、しゅるいごとのしるしを、霧の上にうすく出す（drawFogHints）。
   お屋敷：屋根の先と煙突の影・泉：水色のきらめき・ヌシ様のあしあと：青い光のつぶがたちのぼる・宝箱：うすい影・古い家のあと：くずれた小さな屋根の影。どれも2点のドット。晴れたら消える（霧の中の物だけ描く） */
const FOGHINT_A=.85;
const FOGHC=new Map();function fogHintNear(f){/* 見つける物のまわり6マスに、晴れたマスがある */const v=S.fogV||0,c=FOGHC.get(f);if(c&&c.s===S&&c.v===v)return c.r;const[x,y,w,h]=fogHintBox(f),R=FOG_HINTR;let r=false;for(let b=y-R;b<y+h+R&&!r;b++){if(b<0||b>=H)continue;for(let a=x-R;a<x+w+R;a++){if(a<0||a>=W)continue;if(!fogAt(b*W+a)){r=true;break}}}FOGHC.set(f,{s:S,v,r});return r}
function fogHintOn(a){if(!S.fog[a])return false;const ax=a%AREAN,ay=(a/AREAN)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=ax+dx,ny=ay+dy;if(nx<0||ny<0||nx>=AREAN||ny>=AREAN)continue;if(!S.fog[ny*AREAN+nx])return true}return false}
function fogHintBox(f){const x=f.j%W,y=(f.j/W)|0;if(f.t==='mansion')return[x,y,MANSION_W,MANSION_H];if(f.t==='ruin'){const[w,h]=ruinWH(f);return[x,y,w,h]}if(f.t==='spring')return[x,y,2,2];return[x,y,1,1]}
function fhPx(c,col,x,y,w,h){c.fillStyle=col;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w*2,h*2)}/* 2点のます目（w・h はます目の数） */
function fhStar(c,x,y,n,core,arm){fhPx(c,core,x-1,y-1,1,1);for(let k=1;k<=n;k++){fhPx(c,arm,x-1,y-1-k*2,1,1);fhPx(c,arm,x-1,y-1+k*2,1,1);fhPx(c,arm,x-1-k*2,y-1,1,1);fhPx(c,arm,x-1+k*2,y-1,1,1)}}
function drawFogHints(c,x0,y0,x1,y1,now){if(!fogOn()||!S.fogF||!S.fog.some(v=>v))return;
  for(const f of S.fogF){if(fogOut(f)||f.done||!fogAt(f.j)||!fogHintNear(f))continue;if(f.t==='print'&&printOn())continue;/* あしあとをたどる依頼のあいだは、その印（drawPrintMarks）だけ */
    const[bx,by,bw,bh]=fogHintBox(f);if(bx+bw<x0-1||bx>x1+1||by+bh<y0-1||by>y1+2)continue;const cx=(bx+bw/2)*TS,cy=(by+bh/2)*TS,ph=(now/2400+f.j*.173)%1,pul=.7+.3*Math.sin(ph*Math.PI*2);c.save();
    if(f.t==='mansion'){c.globalAlpha=FOGHINT_A*pul;const col='#7d778c',top=by*TS+10;for(let k=0;k<12;k++)fhPx(c,col,cx-2-k*2,top+k*2,1+k*2,1);fhPx(c,col,cx-24,top+24,24,3);fhPx(c,col,cx+10,top+2,3,7);/* 屋根の先と煙突 */
      for(let m=0;m<4;m++){const q=(now/2600+m/4)%1;c.globalAlpha=FOGHINT_A*pul*Math.sin(Math.PI*q);fhPx(c,'#a59fb1',cx+12+Math.round(Math.sin(q*6.3)*2),top-2-q*28,2,2)}}/* 煙突のけむり */
    else if(f.t==='spring'){for(let m=0;m<5;m++){const q=(now/1400+m/5+f.j*.37)%1,a=Math.sin(Math.PI*q);if(a<.15)continue;c.globalAlpha=FOGHINT_A*a;fhStar(c,cx+[-16,12,-4,18,2][m],cy+[-6,-14,10,6,-2][m],a>.75?2:1,'#ffffff','#5fbde6')}}/* 水色のきらめき */
    else if(f.t==='print'){for(let m=0;m<5;m++){const q=(now/1800+m/5+f.j*.13)%1;c.globalAlpha=FOGHINT_A*Math.sin(Math.PI*q);fhPx(c,m%2?'#7cc0f2':'#3f97dc',cx+(m-2)*6+Math.round(Math.sin(q*6.3+m*2)*3),cy+6-q*34,2,2)}}/* 青い光のつぶ */
    else{c.globalAlpha=FOGHINT_A*.7*pul;const col='#6a6e78';if(f.t==='box'){fhPx(c,col,cx-12,cy-6,12,7);fhPx(c,col,cx-10,cy-10,10,2)}/* 宝箱の影 */
      else{const top=cy-14;for(let k=0;k<7;k++){fhPx(c,col,cx-2-k*2,top+k*2,1+k,1);if(k<3||k>4)fhPx(c,col,cx,top+k*2,1+k,1)}fhPx(c,col,cx-12,top+14,5,4);fhPx(c,col,cx+4,top+14,4,2)}}/* 古い家のあと：右がくずれた、小さな屋根と壁の影 */
    c.restore()}}
function fogRevealReset(){FOGT.clear()}/* 村を切りかえたとき（うすれていくマスを、のこさない） */
