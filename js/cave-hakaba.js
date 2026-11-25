'use strict';
/* 9階「失敗した神の墓場」のしくみ（cave.js のつづき）。設定は STORY.md の「土の谷の大穴とバケモノ」
   ・組みかけのほね（cave-bake.js の bk_hone）：たおしても、組みなおして起きる。まもりの光でとどめをさすと、ほんとうに消える
   ・ほねの橋（地図の V）：西のふち道から、大穴の中の島（下へおりる坂）まで、はば2マスの大穴。
     まもりの光で、ほねにとどめをさすたびに、そのほねが橋の足になって、西から3つ（CVHONEN）に分けた1つずつ、かかる
     とどめをさした数は S.flags.cvHoneN（ずっとのこる。かかった橋は、ずっと橋のまま）。ほねは、橋に要るより多くならんでいる
   ・手がかり（地図の K）：ならべかけのほね。しらべると、組み立ての石板
   たしかめは tools/tests/cave-hakaba.cjs */
const CVHONEN=3;/* ほねの橋が、かかりきるまでの、とどめの数（橋は3つに分けてかかる） */
const cvHoneCount=()=>Math.min(CVHONEN,(S.flags&&S.flags.cvHoneN)|0);
/* 入るとき：橋がかかる所（V）。まえにとどめをさしていたら、その分は、かかったまま */
function cvHoneInit(C){C.hone=null;const V=[];for(let y=0;y<CVH;y++)for(let x=0;x<CVW;x++)if(C.F.map[y][x]==='V')V.push(cvJ(x,y));if(!V.length)return;
  const xs=[...new Set(V.map(cvX))].sort((a,b)=>a-b),seg=new Map(V.map(j=>[j,Math.min(CVHONEN-1,(xs.indexOf(cvX(j))*CVHONEN/xs.length)|0)]));
  C.hone={V,seg,seen:false};if(!C.sb)C.sb=new Uint8Array(CVW*CVH);for(let k=0;k<cvHoneCount();k++)cvHoneLayAt(C,k)}
/* 橋の1つ（西から k ばんめ）が、かかる：その所が床になる */
function cvHoneLayAt(C,k){for(const j of C.hone.V)if(C.hone.seg.get(j)===k){C.ab[j]=0;C.g[j]=1;C.sb[j]=1}C.shafts=null;for(const c of C.abi||[])c.width=c.height=0;C.abi=C.abp=null}
/* まもりの光で、ほねにとどめをさした（cvDefeat から） */
function cvHoneLight(e){const C=CV,H=C.hone;if(!H||e.type!=='bk_hone'||!e.byLight)return;const n=cvHoneCount();if(n>=CVHONEN)return;
  S.flags.cvHoneN=n+1;cvHoneLayAt(C,n);sfx('crack');const now=performance.now();
  for(const j of H.V)if(H.seg.get(j)===n)cvSpark(cvX(j)+.5,cvY(j)+.5,hash(j)<.5?'#e8dcc0':'#b8a888',6);
  for(const a of C.party){a.joyU=now+1200;a.jumpT=now}
  toast(n+1<CVHONEN?'ほねが、橋の足になった（'+(n+1)+'/'+CVHONEN+'）':'ほねの橋が、かかった','good');cvHudUpd()}
/* 毎コマ：はじめて、とぎれた橋のそばに来たとき、知らせる */
function cvHoneTick(){const C=CV,H=C.hone;if(!H||H.seen||cvHoneCount()>=CVHONEN)return;
  for(const j of H.V)if(C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<=4)){H.seen=true;toast('大穴の橋が、とぎれている。ほねを、まもりの光でくずして、組めそう');return}}
/* ---------- 絵（仮のドット絵） ---------- */
/* ほねの橋（地面にはる。ゲームの点で1マス）：大きなほねを、よこにならべた橋 */
function cvHoneBridgeDraw(x,y){const C=CV,j=cvJ(x,y),ox=x*TS,oy=(y+CVOY)*TS,F=(c,a,b,w,h)=>P4(c,ox+a,oy+b,w,h),h=n=>hash((j*11+n*37+7)>>>0);
  F('#4a4034',0,0,TS,TS);F('#7a6e58',0,2,TS,TS-4);
  for(let i=0;i<4;i++){const yy=2+i*7;F('#b8a888',0,yy,TS,3);F('#e8dcc0',0,yy,TS,1);F('#e8dcc0',((h(i)*20)|0),yy+1,9,2);F('#8a7a62',((h(i+4)*20)|0)+3,yy+2,3,1)}/* よこたわる、ほね */
  F('#5a4e42',0,(h(9)*TS)|0,TS,1);if(h(10)<.5){F('#e8dcc0',(h(11)*22)|0,(h(12)*22)|0,4,2)}/* ひび・かけら */
  F('#e8dcc0',0,0,2,TS);F('#e8dcc0',TS-2,0,2,TS)}
/* 手がかり（K）：ならべかけのほね。どれも、大きなほねを立てかけてある。はしの1つの横に、石の板 */
function cvHonePlateDraw(ox,oy,end,now){const F=(c,a,b,w,h)=>P4(c,ox+a,oy+b,w,h);F('rgba(10,8,6,.3)',3,27,26,3);
  F('#5a4e42',4,24,24,4);F('#7a6e58',4,24,24,1);/* 台 */
  F('#b8a888',15,3,3,22);F('#e8dcc0',15,3,1,22);/* せぼね */
  for(let i=0;i<4;i++){const w=13-i*2;F('#b8a888',16-w,6+i*4,w,2);F('#b8a888',17,6+i*4,w,2);F('#e8dcc0',16-w,6+i*4,w,1);F('#e8dcc0',17,6+i*4,w,1)}/* あばら */
  F('#e8dcc0',12,0,9,5);F('#b8a888',12,4,9,1);F('#5a4e42',14,2,2,2);F('#5a4e42',18,2,2,2);/* 頭の骨 */
  if(end){F('#3a3430',1,20,12,8);F('#6a645c',1,20,12,7);F('#8a847a',1,20,12,1);F('#4a443c',3,22,8,1);F('#4a443c',3,24,6,1);F('#4a443c',3,26,7,1);/* 石の板 */
    const p=.5+.5*Math.sin(now/600);ctx.globalAlpha=.15+.2*p;F('#ffe8b0',1,20,12,7);ctx.globalAlpha=1}}
