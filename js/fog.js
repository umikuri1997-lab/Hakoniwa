'use strict';
/* 霧の中の土地（草原の本編だけ）：マップを4×4の16エリア（areaOf）にわけ、はじめは、まん中の4エリアだけ見える。のこりの12エリアは霧（S.fog）。
   霧のエリアは、となり（上下左右）の晴れたエリアの、みどりのマスが200をこえると晴れる。霧の中には置けない・タップできない・せいれいもコワイノも入らない。
   霧のエリアには、1つずつ見つける物がある（S.fogF）：古い家のあと3・古い宝箱4・ヌシ様のあしあと3・きれいな泉2 */
const FOG_MID=[5,6,9,10],FOG_GREEN=200,FOG_FADE=2600,FOG_CELL=4;/* FOG_CELL：1マスを4×4のドットにわけて霧を描く */
const FOG_KINDS=['ruin','ruin','ruin','box','box','box','box','print','print','print','spring','spring'];
const FOG_PRINT_LINES=[
 [['フタバ','#surprise|守り神さま、見て！ 大きな足あと……ヌシ様のだ！'],['フタバ','#think|ヌシ様は、朝になると、ここを通って丘へのぼっていったんだ。'],['フタバ','#joy|角の小さな花が、朝日できらきらして……ぼく、うしろをついて歩くのが好きだった。']],
 [['フタバ','#think|ここにも、ヌシ様の足あと。まわりの草が、少しだけ青いね。'],['フタバ','ヌシ様が歩いたあとは、しおれた草も、また起きあがったんだって。'],['フタバ','#nod|……いまも、ここの草は元気。なんだか、ヌシ様がそばにいるみたい。']],
 [['フタバ','#think|この足あと、ふかくて大きい……。ヌシ様が、ここで立ちどまったのかな。'],['フタバ','ヌシ様はね、夕方になると、いつも村のほうをふりかえって見てたんだ。'],['フタバ','#joy|みんな、ちゃんと帰ったかなって。……やさしいヌシ様なんだ。']]];
let FOGM=null,FOGS=null,FOGV=-1;const FOGA=new Map();/* FOGA：晴れていくエリア→はじめた時刻（画面の時計） */
function fogOn(){return !!S&&WD===0&&!S.free&&Array.isArray(S.fog)}
function fogBuild(){FOGS=S;FOGV=S.fogV||0;FOGM=new Uint8Array(W*H);for(let j=0;j<W*H;j++)FOGM[j]=S.fog[areaOf(j)]?1:0}
function fogAt(j){if(!fogOn())return false;if(FOGS!==S||FOGV!==(S.fogV||0))fogBuild();return FOGM[j]===1}
function fogSouth(x){/* その列で、晴れている所のいちばん下の行（コワイノは、ここから来る）。ぜんぶ霧なら -1 */if(!fogOn())return H-1;for(let y=H-1;y>=0;y--)if(!fogAt(y*W+x))return y;return -1}
function fogBlock(id,x,y,quiet){if(!fogOn())return false;const z=(typeof szR==='function'&&szR(id,PLROTS[id]||0))||[1,1],w=RUGS.has(id)||CANOPY.has(id)?2:z[0],h=RUGS.has(id)||CANOPY.has(id)?2:z[1];for(let b=0;b<h;b++)for(let a=0;a<w;a++){const nx=x+a,ny=y+b;if(nx>=0&&ny>=0&&nx<W&&ny<H&&fogAt(ny*W+nx)){if(!quiet)toast('霧で見えない所には置けません','warn');return true}}return false}
const fogFind=j=>(S.fogF||[]).find(f=>f.j===j);
function fogArea(a){const x0=(a%AREAN)*AREAW,y0=((a/AREAN)|0)*AREAW;return {x0,y0,x1:x0+AREAW,y1:y0+AREAW}}
function fogSpotOK(s,j,hi){return s.ground[j]===0&&!s.obj[j]&&!s.floor[j]&&(hi==null||(s.hi?s.hi[j]||0:0)===hi)}
function fogShuffle(L){for(let i=L.length-1;i>0;i--){const k=(Math.random()*(i+1))|0;[L[i],L[k]]=[L[k],L[i]]}return L}
/* 古い家のあと（小屋）：しゅるいごとに大きさと、のこっている家具（こわれた家具。スポットにならない組み合わせ）がちがう。家具は中の [よこ,たて]（かべの内がわ。ドアの上のマスはあける） */
const RUIN_KINDS={naya:{w:6,h:4,n:'古い納屋のあと',furn:[['crate',1,1],['taru',2,1],['kabedougu',4,1]]},kitchen:{w:5,h:4,n:'古い台所のあと',furn:[['oven',1,1],['table',2,1],['tub',3,1]]},monooki:{w:4,h:4,n:'古い物置のあと',furn:[['makidana',1,1],['asabukuro',2,1]]}},RUIN_ORDER=['naya','kitchen','monooki'];
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
function fogAfterRecount(){/* recount のあと：となりの晴れたエリアのみどりのマスが200をこえたら、霧が晴れる。古い家のあとが家になったら、ごほうび */if(!fogOn()||MEMRUN||NOSAVE)return;/* 思い出の場面（一時の花など）では、晴らさない */const quiet=!stageReady();/* マップを作っているあいだ（はじめ・読みこみ）は、知らせを出さない */
  const G=new Array(AREAN*AREAN).fill(0);for(const k of REV)if(S.ground[k]!==1)G[areaOf(k)]++;const clr=[];
  for(let a=0;a<AREAN*AREAN;a++){if(!S.fog[a])continue;const x=a%AREAN,y=(a/AREAN)|0;if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=AREAN||ny>=AREAN)return false;const b=ny*AREAN+nx;return !S.fog[b]&&G[b]>FOG_GREEN}))clr.push(a)}
  for(const a of clr)fogClear(a,quiet);
  for(const f of S.fogF||[]){if(f.t!=='ruin'||!f.set||f.done)continue;const c=ruinDoor(f)-W,[rw,rh]=ruinWH(f);if(fogRing(f.j,rw,rh).every(k=>HOME_WALLS.has(S.obj[k])||HOME_DOORS.has(S.obj[k]))&&HOUSES.some(h=>h.inside.has(c))){f.done=1;f.find=1;/* 中のわすれ物は、せいれいが見つける（ruinFindTick） */toast((RUIN_KINDS[f.k]?RUIN_KINDS[f.k].n.replace('のあと',''):'古い家')+'が、よみがえった','good')}}}
function fogRing(j,w,h){/* 古い家のあと：w×h マスのまわり（下のまん中がドア） */w=w||5;h=h||4;const x=j%W,y=(j/W)|0,L=[];for(let b=0;b<h;b++)for(let a=0;a<w;a++)if(a===0||a===w-1||b===0||b===h-1)L.push((y+b)*W+x+a);return L}
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
function fogClear(a,quiet){if(!S.fog[a])return;S.fog[a]=0;S.fogV=(S.fogV||0)+1;if(!quiet)FOGA.set(a,performance.now());if(typeof SPRC!=='undefined')SPRC.n=-1;/* コワイノの来る所を作りなおす */
  if(!quiet){FOGA.set(a,Infinity);(FOGREV||(FOGREV=[])).push({state:S,a})}/* 知らせと演出は fogRevealTick（カメラが来てから、霧がうすれる） */
  for(const f of S.fogF||[])if(f.a===a&&f.t==='mansion'&&!f.set){fogMansionBuild(f);villageTimeout(()=>recount(),30)}
  for(const f of S.fogF||[])if(f.a===a&&f.t==='ruin'&&!f.set){if(!f.k){for(const k of RUIN_ORDER){const K=RUIN_KINDS[k];if(!(S.fogF||[]).some(g=>g!==f&&g.k===k)&&ruinFits(S,f.j,K.w,K.h)){f.k=k;break}}if(!f.k&&ruinFits(S,f.j,5,4))f.k='kitchen'}/* 前のセーブの小屋：入るしゅるいをえらぶ */
    f.set=1;const [rw,rh]=ruinWH(f),x=f.j%W,y=(f.j/W)|0,door=ruinDoor(f),rnd=fogRand(f.j*2246822519+3),brk=(id,k)=>(S.broken||(S.broken=[])).push({j:k,id,rot:0});
    fogRing(f.j,rw,rh).forEach(k=>{const o=S.obj[k];if(o&&!(BL[o]&&BL[o].natural||WEEDS.has(o)))return;if(o)S.obj[k]='';S.drops=(S.drops||[]).filter(d=>d.y*W+d.x!==k);const a0=k%W-x,b0=((k/W)|0)-y,corner=(a0===0||a0===rw-1)&&(b0===0||b0===rh-1);if(k!==door&&(corner||rnd()<.4))S.obj[k]='hwall';else brk(k===door?'door':'hwall',k)});/* のこっている壁（角と、いくつか）。ほかは、こわれたあと */
    for(const[id,a0,b0]of (RUIN_KINDS[f.k]||{furn:[]}).furn){const k=(y+b0)*W+x+a0,o=S.obj[k];if(o&&!(BL[o]&&BL[o].natural||WEEDS.has(o)))continue;if(o)S.obj[k]='';brk(id,k)}/* むかしの使いみちがわかる家具（こわれている。直すと使える） */
    villageTimeout(()=>recount(),30)}
  dirty=true}
function fogTap(tx,ty){/* 「みる」のタップ：霧の所・見つける物 */if(!fogOn())return false;let j=ty*W+tx;if(fogAt(j)){toast('霧で見えない');return true}j=anc(j);
  const o=S.obj[j],f=fogFind(j);if(!f)return false;
  if(o==='fogbox'){if(!S.fogReq.includes(j))S.fogReq.push(j);sfx('tap');toast('古い宝箱：せいれいがあけにいく');return true}
  if(o==='nushiprint'){if(f.done){toast(BL.nushiprint.name);return true}if(!S.res.some(r=>r.name===POKO&&!r.hidden)){toast('フタバがいません');return true}if(!S.fogReq.includes(j))S.fogReq.push(j);sfx('tap');toast('ヌシ様のあしあと：フタバが見にいく');return true}
  if(o==='fogspring'){toast(BL.fogspring.name+'：'+BL.fogspring.desc);return true}return false}
const FOGBUSY=new Set(['sleep','eat','flee','watchpost','patrol','bury','faint','shiver','reunion','nmeet','fogopen','foglook','bathe','cook','offer','otaki','otakiget']);
function fogFree(r){return !r.hidden&&!r.coffin&&!(r.act&&(FOGBUSY.has(r.act.type)||/^(story|field)/.test(r.act.type)))}
function fogReqFor(r){/* この子が行ける、たのまれた物 */if(!fogOn()||isNight()||!S.fogReq||!S.fogReq.length)return -1;for(const j of S.fogReq){const o=S.obj[j];if(o==='fogbox'||o==='nushiprint'&&r.name===POKO){if(free('o'+j,1))return j}}return -1}
function fogWant(r){return fogFree(r)&&fogReqFor(r)>=0}
function fogJob(r,G){const j=fogReqFor(r);if(j<0)return false;const o=S.obj[j],ad=k=>k===j&&o==='nushiprint'||[1,-1,W,-W].some(d=>k+d===j&&Math.abs(k%W-j%W)<=1),st=nearest(G,k=>ad(k)&&walk(k),9999);if(st<0)return false;startAct(r,G,o==='fogbox'?'fogopen':'foglook',st,{key:'o'+j,obj:j});return true}
const fogDone=j=>{S.fogReq=(S.fogReq||[]).filter(k=>k!==j)};
ACT.fogopen={start(r,a){if(S.obj[a.obj]!=='fogbox')return false;r.bubble='';r.face=(a.obj%W+.5)<r.x?-1:1},done:(r,a)=>a.t>=3,end(r,a){fogDone(a.obj);if(S.obj[a.obj]!=='fogbox')return;const f=fogFind(a.obj);if(f)f.done=1;clearObj(a.obj);burst(a.obj,'furn','furnPlace');const L=FURN.filter(id=>giftPoolOK(id));if(L.length){const id=pick(L);sfx('seed');toast(r.name+'が宝箱から「'+BL[id].name+'」をみつけた','good');addFloat(r.x,r.y-1.8,BL[id].name);if(!(itemBoxOK()&&addItem(r,id,1)))dropAt(r.x,r.y,id,1)}/* 箱へはこんでから、もちものに入る */addSpiritXp(1,r);recount();dirty=true}};
ACT.foglook={start(r,a){if(S.obj[a.obj]!=='nushiprint')return false;r.bubble=''},done:(r,a)=>a.t>=2,end(r,a){fogDone(a.obj);const f=fogFind(a.obj);if(!f||f.done)return;const n=(S.fogF||[]).filter(q=>q.t==='print').indexOf(f);dialog(FOG_PRINT_LINES[Math.max(0,n)%FOG_PRINT_LINES.length],()=>{f.done=1})}};
ACT_LBL.fogopen='宝箱をあけている';ACT_LBL.foglook='ヌシ様のあしあとを見ている';
/* クモの巣（S.web：マス→0 左の角・1 右の角）：お屋敷の中だけ。プレイヤーはこわせない。「みる」でタップすると、せいれいがそうじする（S.webq）。家の中の1つで住み心地-5（houseComfort） */
function webTap(tx,ty){if(!S.web)return false;let j=ty*W+tx;if(S.web[j]==null&&S.web[j+W]!=null&&(HOME_WALLS.has(S.obj[j])||HOME_DOORS.has(S.obj[j])))j+=W;/* 壁の上にかかった所をタップしても */if(S.web[j]==null)return false;if(isNight()){toast('夜のあいだは、そうじできません');return true}(S.webq||(S.webq={}))[j]=1;sfx('tap');toast('クモの巣：せいれいがそうじにいく');return true}
function webReqFor(r){if(isNight()||!S.webq||!S.web)return -1;for(const k in S.webq){const j=+k;if(S.web[j]==null){delete S.webq[k];continue}if(free('b'+j,1))return j}return -1}
const webWant=r=>fogFree(r)&&webReqFor(r)>=0;
function webJob(r,G){const j=webReqFor(r);if(j<0)return false;const st=walk(j)&&!S.obj[j]&&G.dist[j]>=0?j:nearest(G,k=>[1,-1,W].some(d=>k===j+d)&&walk(k)&&!S.obj[k],9999);/* クモの巣の下に立つ（ふさがっていれば、となり） */if(st<0)return false;startAct(r,G,'sweep',st,{key:'b'+j,obj:j});return true}
ACT.sweep={start(r,a){if(!S.web||S.web[a.obj]==null)return false;r.bubble='';if((r.x|0)!==a.obj%W)r.face=(a.obj%W+.5)<r.x?-1:1},done:(r,a)=>a.t>=2,end(r,a){if(S.webq)delete S.webq[a.obj];if(!S.web||S.web[a.obj]==null)return;delete S.web[a.obj];burst(a.obj,'block');sfxAt('tap',r.x,r.y);addFloat(r.x,r.y-1.6,'ぴかぴか');addSpiritXp(1,r);dirty=true}};
ACT_LBL.sweep='クモの巣をそうじしている';
const WEBDAY=.1,WEBMAX=3;/* 毎朝、家ごとに10%で、クモの巣が1つふえる（1つの家に3つまで） */
function webMorning(){if(typeof MEMRUN!=='undefined'&&MEMRUN||typeof NOSAVE!=='undefined'&&NOSAVE)return;findHouses();for(const h of HOUSES){let n=0;for(const j of h.inside)if(S.web&&S.web[j]!=null)n++;if(n>=WEBMAX||Math.random()>=WEBDAY)continue;
  const L=[...h.inside].filter(j=>!S.obj[j]&&(!S.web||S.web[j]==null)&&h.set.has(j-W)&&!h.inside.has(j-W));/* 上が壁の、空いた床（壁の角） */if(!L.length)continue;const j=pick(L),v=h.inside.has(j-1)&&!h.inside.has(j+1)?1:h.inside.has(j+1)&&!h.inside.has(j-1)?0:(Math.random()<.5?0:1);(S.web||(S.web={}))[j]=v}}
const WEBC=[];function webArt(v){/* クモの巣の、チップ（web#0・web#1）を読みこむ前の絵（64×64 を1マスに） */if(WEBC[v])return WEBC[v];const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d'),P=(x,y,a)=>{c.fillStyle='rgba(246,244,238,'+a+')';c.fillRect(x|0,y|0,1,1)};
  const ox=v?63:0,sx=v?-1:1;/* 角（左上か右上）から、放射の糸と、まわりの糸 */const R=[[1,0],[.92,.38],[.7,.7],[.38,.92],[0,1]];for(const[dx,dy]of R)for(let t=0;t<46;t++)P(ox+sx*dx*t,dy*t,.8-t/120);
  for(const rad of[9,17,26,36])for(let n=0;n<R.length-1;n++){const[a1,b1]=R[n],[a2,b2]=R[n+1];for(let t=0;t<=1;t+=1/(rad*.9)){const k=Math.sin(t*Math.PI)*.18*rad;/* 糸は少したるむ */const px=a1*rad+(a2*rad-a1*rad)*t-k*(a1+a2)/2,py=b1*rad+(b2*rad-b1*rad)*t-k*(b1+b2)/2;P(ox+sx*px,py,.62-rad/110)}}
  return WEBC[v]=cv}
function drawWebs(add,vis){/* 床のマスの上の角に、壁の正面にかかるように描く（そのマスの物より奥・壁より手前） */if(!S.web)return;for(const k in S.web){const j=+k,x=j%W,y=(j/W)|0;if(!vis({x:x+.5,y:y+.5}))continue;const v=S.web[k]?1:0;add(y+.015,0,null,()=>{const X=x*TS,Y=y*TS-hiAt(j)*LIFT-22,ch=window.CHIPS&&CHIPS['web#'+v];if(ch&&drawChip(ctx,ch,'web#'+v,X,Y+22,0,j))return;ctx.drawImage(webArt(v),X,Y,32,32)},j)}}
const CRACKC={};function crackArt(v,vert){/* 朽ちた壁のひびの仮の絵（64×64 を1マスに。マスの上はしが壁の正面の上はし）。あとで、マップチップ crack#0〜9（たての壁は crack:v#0〜9）に差しかえられる */const key=(vert?'v':'h')+v;if(CRACKC[key])return CRACKC[key];const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d'),rnd=fogRand(v*9973+(vert?77:3));
  const line=(x,y,n,dx)=>{for(let t=0;t<n;t++){c.fillStyle='rgba(74,52,36,.62)';c.fillRect(x|0,y|0,1,1);c.fillStyle='rgba(255,246,226,.38)';c.fillRect(x|0,(y|0)+1,1,1);y+=1;x+=dx+(rnd()<.45?(rnd()<.5?-1:1):0);if(x<(vert?12:2)||x>(vert?52:61))break;if(rnd()<.08){line(x,y,(n-t)*.5,-dx||(rnd()<.5?1:-1));}}};
  if(vert){line(24+v*6,6,26,0);line(38-v*4,30,22,0)}else{const S0=[[10,4,30,.6],[44,8,22,-.5],[28,20,26,.3]];S0.forEach(([x,y,n,dx],q)=>{if(q<=v+1)line(x+v*5,y,n,dx)})}
  return CRACKC[key]=cv}
function drawCrack(c,id,x,y,i){/* 朽ちた壁：ふつうの壁の上に、ひびの絵をかさねる */const m=connMask(id,i),vert=!(m&3)&&!!(m&12),tx=i%W,ty=(i/W)|0,v=(2*tx+3*ty)%10,h=(tx*7919+ty*104729)%3-1,k=(vert?'crack:v#':'crack#')+v,ch=window.CHIPS&&CHIPS[k];/* 5つの形を、かたむき・左右反転をかえて10しゅるい（形は v%5）。左右のとなりとは2、上下とは3ちがうので、となりと同じ形にならない。少しずらす（h：-1〜1） */if(ch&&drawChip(c,ch,k,vert?x:x+h*2,vert?y+h*2:y,0,i))return;c.drawImage(crackArt(v%3,vert),x,vert?y-10:y,32,32)}
function drawFogObj(c,id,x,y,i,now){/* 見つける物の絵（マップチップ。読みこみ前はコードでかく） */const ch=chipOf(id);
  if(ch){if(id==='fogbox')shadow(c,x+16,y+(id==='fogbox'?28:29),id==='fogbox'?16:14,id==='fogbox'?3:4);if(drawChip(c,ch,id,x,y,now,i))return}
  if(id==='fogbox'){shadow(c,x+16,y+28,12,3);c.fillStyle='#8a5a33';c.fillRect(x+5,y+14,22,13);c.fillStyle='#a8743f';c.fillRect(x+5,y+9,22,6);c.fillStyle='#c08a52';c.fillRect(x+6,y+9,20,1);c.fillStyle='#6e4527';c.fillRect(x+5,y+15,22,1);c.fillStyle='#d9b35a';c.fillRect(x+9,y+9,2,18);c.fillRect(x+21,y+9,2,18);c.fillRect(x+14,y+14,4,4);c.fillStyle='#f3dc8a';c.fillRect(x+15,y+15,2,1);return}
  if(id==='nushiprint'){const g=.35+.15*Math.sin((now||0)/700+(i||0));c.fillStyle='rgba(120,190,110,'+g+')';c.beginPath();c.ellipse(x+16,y+18,13,8,0,0,7);c.fill();c.fillStyle='rgba(92,74,52,.55)';for(const[px,py]of[[9,12],[21,20]]){c.beginPath();c.ellipse(x+px-1.6,y+py,1.6,3,-.15,0,7);c.fill();c.beginPath();c.ellipse(x+px+1.6,y+py,1.6,3,.15,0,7);c.fill()}return}
  if(id==='fogspring'){c.fillStyle='#b9b2a3';c.beginPath();c.ellipse(x+32,y+36,28,18,0,0,7);c.fill();c.fillStyle='#9fd6ee';c.beginPath();c.ellipse(x+32,y+36,23,14,0,0,7);c.fill();const t=((now||0)/900+(i||0))%1;c.strokeStyle='rgba(255,255,255,'+(.6*(1-t))+')';c.lineWidth=1;c.beginPath();c.ellipse(x+32,y+36,3+t*16,2+t*9,0,0,7);c.stroke();return}}
/* 霧の絵：マップ全体を、1マス4×4ドットの小さな絵（432×432、約0.75MB）に1回だけ作る。晴れるときだけ、そのエリアのまわりを作りなおす */
const FOGC=document.createElement('canvas');let FOGX=null,FOGN=null,FOGPV=-1,FOGPS=null;
function fogNoise(){if(FOGN)return FOGN;const n=W*FOG_CELL,N=new Float32Array(n*n),h=(a,b)=>{const v=Math.imul(a*374761393+b*668265263,1274126177)>>>0;return (v%1000)/1000},sm=t=>t*t*(3-2*t);
  const oct=(cx,cy,sz)=>{const gx=cx/sz,gy=cy/sz,ix=gx|0,iy=gy|0,fx=sm(gx-ix),fy=sm(gy-iy),a=h(ix,iy),b=h(ix+1,iy),c=h(ix,iy+1),d=h(ix+1,iy+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)N[y*n+x]=oct(x,y,14)*.65+oct(x+31,y+17,5)*.35;return FOGN=N}
function fogAlpha(a,now){if(S.fog[a])return 1;const t0=FOGA.get(a);if(t0==null)return 0;if(t0>now)return 1;/* カメラが来るまで、霧はそのまま */const p=(now-t0)/FOG_FADE;return p>=1?0:1-p}
function fogPaint(cx0,cy0,cx1,cy1,now){/* 霧の絵の一部（ドットの範囲）を作る */const n=W*FOG_CELL,N=fogNoise();if(!FOGX){FOGC.width=FOGC.height=n;FOGX=FOGC.getContext('2d')}
  cx0=Math.max(0,cx0);cy0=Math.max(0,cy0);cx1=Math.min(n,cx1);cy1=Math.min(n,cy1);if(cx1<=cx0||cy1<=cy0)return;const w=cx1-cx0,h=cy1-cy0,img=FOGX.createImageData(w,h),D=img.data,AW=AREAW*FOG_CELL,al=[];for(let a=0;a<AREAN*AREAN;a++)al[a]=fogAlpha(a,now);const ED=2.5*FOG_CELL;
  for(let y=cy0;y<cy1;y++)for(let x=cx0;x<cx1;x++){const ax=(x/AW)|0,ay=(y/AW)|0,a=ay*AREAN+ax,A=al[a];let v=A;if(A>0){const lx=x-ax*AW+.5,ly=y-ay*AW+.5;for(const[dx,dy,d]of[[-1,0,lx],[1,0,AW-lx],[0,-1,ly],[0,1,AW-ly]]){const nx=ax+dx,ny=ay+dy;if(nx<0||ny<0||nx>=AREAN||ny>=AREAN)continue;const B=al[ny*AREAN+nx];if(B<A&&d<ED)v=Math.min(v,B+(A-B)*d/ED)}}/* 晴れたエリアとのさかいは、2.5マスでうすく */
    const nz=N[y*n+x];if(A<1&&A>0)v=Math.max(0,Math.min(v,v*1.7-nz*.7));/* 晴れていくときは、うすい所からまだらに消える */let o=v*(.86+nz*.14);o=Math.round(o*10)/10;const q=((y-cy0)*w+(x-cx0))*4,s=nz>.55?1:0;D[q]=s?244:226;D[q+1]=s?246:232;D[q+2]=s?248:238;D[q+3]=o*250}
  FOGX.putImageData(img,cx0,cy0)}
function drawFog(ctx,x0,y0,x1,y1,now){/* 霧をかく（夜の暗さより下）。毎コマは、見えている所を1まいの絵からうつすだけ */if(!fogOn())return;if(FOGPS!==S||FOGPV!==(S.fogV||0)&&!FOGA.size){FOGPS=S;FOGPV=S.fogV||0;fogPaint(0,0,W*FOG_CELL,W*FOG_CELL,now)}
  for(const[a,t0]of FOGA){const R=fogArea(a),m=4;fogPaint((R.x0-m)*FOG_CELL,(R.y0-m)*FOG_CELL,(R.x1+m)*FOG_CELL,(R.y1+m)*FOG_CELL,now);if(now-t0>=FOG_FADE){FOGA.delete(a);FOGPV=S.fogV||0}}
  if(!S.fog.some(v=>v)&&!FOGA.size)return;const X0=Math.max(0,x0-1),Y0=Math.max(0,y0-1),X1=Math.min(W,x1+1),Y1=Math.min(H,y1+2);if(X1<=X0||Y1<=Y0)return;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(FOGC,X0*FOG_CELL,Y0*FOG_CELL,(X1-X0)*FOG_CELL,(Y1-Y0)*FOG_CELL,X0*TS,Y0*TS,(X1-X0)*TS,(Y1-Y0)*TS);ctx.imageSmoothingEnabled=true}

/* 霧が晴れたときの演出：カメラが晴れたエリアへゆっくり行き、霧がうすれてから、大きな知らせを出し、もとの所へもどる（そのあいだは村の時間を止める GIFT_ACTIVE） */
let FOGREV=[],FOGREVON=false;const FOG_FIND_N={box:'古い宝箱',print:'ヌシ様のあしあと',spring:'泉',mansion:'お屋敷'};
function fogRevealTick(){while(FOGREV.length&&FOGREV[0].state!==S)FOGREV.shift();if(!FOGREV.length||GIFT_ACTIVE||camAnim||!stageReady())return;
  const it=FOGREV.shift(),a=it.a,R=fogArea(a),owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION;GIFT_ACTIVE=true;FOGREVON=true;
  const back={z:cam.z,x:cam.x+VW/cam.z/2,y:cam.y+VH/cam.z/2},tz=Math.min(cam.z,1.2),tx=(R.x0+AREAW/2)*TS,ty=(R.y0+AREAW/2)*TS;
  const finish=()=>{if(!FOGREVON)return;FOGREVON=false;GIFT_ACTIVE=false;if(FOGA.get(a)===Infinity)FOGA.set(a,performance.now())};
  musicDuck(2600);camAnim={fz:cam.z,tz,fx:back.x,fy:back.y,tx,ty,t:0,dur:1.6,done:()=>{if(!ok())return finish();FOGA.set(a,performance.now());sfx('level');dirty=true;
    setTimeout(()=>{if(!ok())return finish();const overlay=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="霧が晴れた"></div>'),card=el('<div class="idea-card"><h2>霧が晴れた！</h2><div class="spotpop"><p></p></div></div>');
      card.querySelector('p').textContent='あたらしい土地に行けるようになった';/* 見つけた物は書かない（行ってみてのおたのしみ） */
      const button=el('<button class="btn pri" type="button">OK</button>');button.disabled=true;card.append(button);overlay.append(card);document.body.append(overlay);sfx('good');setTimeout(()=>{if(overlay.isConnected)button.disabled=false},650);
      button.onclick=()=>{if(button.disabled)return;overlay.remove();if(!ok())return finish();camAnim={fz:cam.z,tz:back.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:back.x,ty:back.y,t:0,dur:1.2,done:finish}}},FOG_FADE+200)}}}
function fogRevealReset(){FOGREV=[];if(FOGREVON){FOGREVON=false;GIFT_ACTIVE=false;document.querySelectorAll('.idea-reveal[aria-label="霧が晴れた"]').forEach(e=>e.remove())}}/* 村を切りかえたとき */
