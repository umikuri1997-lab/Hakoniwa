'use strict';
/* ---------- 土のステージ「ひびわれた岩の谷」（WD===TSUCHI）----------
   地われ：北のはしから南のはしへ、谷をたてに割る1本（ground 1。マップのはしにつながるので riftM でわかる。歩けない・置けない・橋はかけられない）。
           せまい自然の岩の橋（TSBRY の2行）が1つだけ、地われの東と西をつなぐ。
   谷    ：東・西・北のまわりは、高いがけ（tsWallK を段差のノイズにたす）。川はない。まん中にわき水。
   巣穴  ：北のがけのふもとに、あなぐまの巣穴（anagura。こわせない・うつせない）。はじまりの地ゆれで、ここからトトがころがり出る。洞窟の入口は PR2。
   セーブは S.ts（巣穴のマス・岩の橋のマス）。地われは地形から作る（セーブには入れない）。
   絵：地われと岩の橋は、3Dで写したタイルセット（tsRiftDraw）。 */
const TSIDS=new Set(['anagura']);
const TSRIFTX=CX+15/* 地われのまん中の列 */,TSBRY=CY+1/* 岩の橋の上の行（2行） */,TSSAGAN=2/* 谷の岩をほると出る砂岩 */;
const TSRUBN=10/* 岩の山の数（洞窟の階の数） */,TSRUBV=4/* 岩の山の絵のしゅるい（高い・ひくい、それぞれ） */,TSRUBHI=2.2/* まん中からこの近さまでは、高い岩の絵 */,TSRUBR=3.6/* 岩の山の半径（マス） */,TSRUBMIN=26/* 岩の山のマスの数の下限 */,TSRUBGAP=13/* 岩の山どうしの間 */,TSOLIVEN=3/* ハニが植えるオリーブの苗 */;
BL.anagura={name:'あなぐまの巣穴',solid:1,natural:1};
/* 地われの列（y ごと）：まん中の列からのずれ。はば3（ところどころ2） */
const tsRiftAt=y=>TSRIFTX+Math.round(3*Math.sin(y/9)+2*Math.sin(y/4.3+1));
function tsRift(s,R){const w2=new Set();for(let k=0;k<6;k++)w2.add((R()*H)|0);
  for(let y=0;y<H;y++){const br=y>=TSBRY-1&&y<=TSBRY+6,x0=tsRiftAt(br?TSBRY:y),wd=!br&&(w2.has(y)||w2.has(y-1))?2:3;/* 橋のまわり（岩の橋と、石の大橋）は、同じ列（橋が地われにぴったりかかる） */for(let a=0;a<wd;a++){const x=x0+a;if(x>=0&&x<W)s.ground[y*W+x]=1}}
  for(let y=TSBRY;y<TSBRY+2;y++)for(let x=TSRIFTX-6;x<=TSRIFTX+8;x++)s.ground[y*W+x]=0}/* 自然の岩の橋 */
/* 谷のまわりのがけ：まん中から東西に24マス・北はまん中から20マスより外ほど、段差のノイズを高くする */
function tsWallK(x,y){const dx=Math.abs(x+.5-CX),f1=Math.min(1,Math.max(0,(dx-24)/14)),f2=Math.min(1,Math.max(0,(CY-20-y)/12));return .5*Math.max(f1,f2)}
/* 段差のあと：岩の橋の上をかたづけ、北のがけのふもとに巣穴を置く */
function tsPost(s){const hiS=j=>s.hi?s.hi[j]|0:0;
  for(let y=TSBRY;y<TSBRY+2;y++)for(let x=TSRIFTX-6;x<=TSRIFTX+8;x++){const j=y*W+x;if(s.ground[j]!==0)continue;if(s.obj[j]&&BL[s.obj[j]]&&BL[s.obj[j]].natural){s.obj[j]='';delete s.dyn[j];delete s.hp[j]}}
  let best=-1,bd=1e9;for(let y=CY-30;y<CY-10;y++)for(let x=CX-10;x<=CX+6;x++){const j=y*W+x;if(s.ground[j]!==0||s.floor[j]||s.obj[j]&&!(BL[s.obj[j]]&&BL[s.obj[j]].natural))continue;if(hiS(j-W)<=hiS(j))continue;/* すぐ北が高い（がけの正面が見える）所 */
    let ok=true;for(let b=0;b<=2&&ok;b++)for(let a=-1;a<=1;a++){const q=j+b*W+a;if(s.ground[q]!==0||hiS(q)!==hiS(j)||s.floor[q]){ok=false;break}}if(!ok)continue;
    const d=Math.hypot(x+.5-(CX-4),y+.5-(CY-16));if(d<bd){bd=d;best=j}}
  if(best<0){/* がけが見つからないとき（ないはず）：神殿の北 */best=(CY-16)*W+CX-4}
  for(let b=0;b<=2;b++)for(let a=-1;a<=1;a++){const q=best+b*W+a;if(s.obj[q]&&BL[s.obj[q]]&&BL[s.obj[q]].natural){s.obj[q]='';delete s.dyn[q];delete s.hp[q]}}
  s.obj[best]='anagura';s.ts={hole:best};s.flags.calmNight=1;tsRubGen(s)}/* 神殿のあとも、夜のコワイノは、まだ来ない（ツチノオオカゲを追いかえしたあと、地われから来る。tsuchi-night.js） */
const tsOn=()=>!!S&&WD===TSUCHI&&!!S.ts;
/* ---- 絵（チップがないときは、コードのドットの仮の絵） ---- */
function tsPx(c,col,x,y,w,h){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)}
function tsDrawObj(c,id,x,y,i,now){if(tsNushiDraw(c,id,x,y,i,now))return;/* トトの根・子どものあなぐま（tsuchi-nushi.js） */const P=(col,a,b,w,h)=>tsPx(c,col,x+a,y+b,w,h);
  if(id==='tsrubble'){const ch=window.CHIPS&&CHIPS['tsrubble:'+tsRubTier(i)+'#'+((hash((i|0)*13+7)*TSRUBV)|0)];if(ch&&drawChip(c,ch,id,x,y,now||performance.now(),i))return;
    /* 仮の絵：かさなった砂岩の大きな石 */const h=n=>hash(((i|0)*7+n)>>>0);P('#8a6a4e',2,14,28,16);P('#a98a68',3+((h(1)*4)|0),6,16,12);P('#c4a07a',5+((h(1)*4)|0),7,10,3);P('#9c7a5a',14+((h(2)*4)|0),10,14,12);P('#b8946e',16+((h(2)*4)|0),11,8,2);P('#6f553f',4,26,24,3);return}
  if(id==='tskonoki'){const ch=window.CHIPS&&CHIPS.tskonoki;if(ch&&drawChip(c,ch,id,x,y,now||performance.now(),i))return;
    /* 仮の絵：よこにたおれたオリーブの幹と、うきあがった根 */P('#6f553f',2,18,24,7);P('#8a6a4e',3,18,22,3);P('#5a4432',24,14,5,14);P('#5a4432',27,12,3,4);P('#7f9a5a',0,13,6,5);P('#97b06a',1,13,4,2);return}
  if(id==='tspillar'){const ch=window.CHIPS&&CHIPS.tspillar;if(ch&&drawChip(c,ch,id,x,y,now||performance.now(),i))return;
    /* 仮の絵：砂岩の太い柱と、上の横木 */P('#6f553f',6,26,20,4);P('#8a6a4e',9,6,14,21);P('#a98a68',10,7,5,19);P('#c4a07a',11,8,2,16);P('#7a5a3e',20,7,3,19);P('#6f553f',5,3,22,5);P('#9c7a5a',6,3,20,2);return}
  if(id!=='anagura')return;const ch=window.CHIPS&&CHIPS.anagura;if(ch&&drawChip(c,ch,id,x,y,now||performance.now(),i))return;
  /* がけのふもとの、まるい穴：まわりの岩・おくの暗さ・ほり出した土 */
  P('#8a6a4e',3,8,26,20);P('#9c7a5a',5,6,22,4);P('#a98a68',8,4,16,3);
  P('#3a2a20',7,10,18,16);P('#2a1e16',9,9,14,2);P('#24180f',10,13,12,12);P('#1a120b',12,16,8,9);
  P('#b8946e',2,25,8,4);P('#c4a07a',22,26,8,3);P('#a88660',12,27,8,2)}
/* ---- 地われと岩の橋の絵：3Dで写したタイルセット（tools/art/tsuchi/rift3d.py）。地面の区画は、地われのマスも陸の地面に作り、その上にタイルを置く ----
   見える岩の壁は、北・西の陸の面だけなので、タイルは 北・西・北西 と、ふちにかかる 東・南 のマスの種類（p 地われ・l 陸・b 橋）でえらぶ。
   iso:rift:<北><西><北西><東><南>[-<西の橋の数><東の橋の数>]（北が橋のとき）・iso:riftb:<西の橋の数><東の橋の数><北><南>（橋の上の面） */
let TSRC=null;
function tsKind(x,y){if(x<0||x>=W)return 'l';y=Math.max(0,Math.min(H-1,y));/* マップの上・下のはしの外は、地われがつづく */const j=y*W+x;if(riftJ(j))return 'p';
  return y>=TSBRY&&y<TSBRY+2&&tsBrX().has(x)||S.ts&&S.ts.brd&&S.ts.brd.includes(j)?'b':'l'}
function tsBrX(){/* 岩の橋のマスの列：橋の上の行の、もとの地われの列（はば3）。2行とも同じ列 */const x0=tsRiftAt(TSBRY);return new Set([x0,x0+1,x0+2])}
function tsRiftKey(x,y){const g=tsKind,t=g(x,y),lb=c=>c==='p'?'p':'l',bn=(a,b)=>{let iw=0,ie=0;while(iw<2&&g(a-iw-1,b)==='b')iw++;while(ie<2&&g(a+ie+1,b)==='b')ie++;return ''+iw+ie};
  if(t==='b'){const N=g(x,y-1),S2=g(x,y+1);return 'iso:riftb:'+bn(x,y)+(N==='b'?'b'+lb(S2):lb(N)+'b')}
  if(t!=='p')return null;const N=g(x,y-1),Wk=lb(g(x-1,y)),E=lb(g(x+1,y)),S2=lb(g(x,y+1));
  if(N==='b'){const n=bn(x,y-1);return 'iso:rift:b'+Wk+(n[0]!=='0'?'b':'l')+E+S2+'-'+n}
  return 'iso:rift:'+lb(N)+Wk+lb(g(x-1,y-1))+E+S2}
function tsRiftCells(){/* 地われと橋のマスと、そのタイルの名前（ステージをひらいたときに1回） */if(TSRC&&TSRC.s===S&&TSRC.L)return TSRC.L;TSRC={s:S};const L=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=tsRiftKey(x,y);if(k)L.push([x,y,k])}return TSRC.L=L}
function tsRiftDraw(x0,y0,x1,y1){/* 地面の区画のあと・物より先（draw-world.js）。画面に見えるマスだけ */if(WD!==TSUCHI||!S||!riftM())return;const L=tsRiftCells();
  icScreen(ctx,()=>{for(const[x,y,k]of L){if(x<x0||x>x1||y<y0||y>y1)continue;const t=icBlkImg(k);if(!t)continue;const[ch,im]=t,ix=(x-y)*IQW/2,iy=(x+y)*IQH/2;ctx.drawImage(im,ix-ch.ax/2,iy+IQH/2-ch.ay/2,ch.w/2,ch.h/2)}tsBrFlowerDraw()})}
/* ---- 巣穴をタップ ---- */
function tsTap(j){if(!tsOn())return false;const o=S.obj[j];if(tsNushiTap(o))return true;if(o==='tsrubble'){toast('くずれた岩の山。おくの土地が、ふさがっている');return true}if(o!=='anagura')return false;
  if(!qAt('tscave1')){toast('あなぐまの巣穴。おくから、つめたい風がふいてくる');return true}
  const seen=(S.ts.carve||[]).slice().sort();if(!seen.length){sfx('tap');cavePrep();return true}
  sfx('tap');const P=pxPop('あなぐまの巣穴'),go=el('<button class="btn pri" style="width:100%">洞窟へ出かける</button>'),h=el('<small style="display:block;margin:12px 0 6px">見つけた彫り絵</small>'),g=el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
  go.onclick=()=>{P.close();cavePrep()};for(const n of seen){const b=el('<button class="btn" style="min-height:44px;flex:1"></button>');b.textContent=TSCARVE[n].name;b.onclick=()=>{sfx('tap');tsCarveView(n)};g.appendChild(b)}
  P.body.append(go,h,g);return true}
/* ---- 彫り絵：洞窟の階の、下へおりる坂のそばのかべ。はじめてそこまで来たとき、大きな1まいを見せて、トトたちが話す（S.ts.carve：見つけた彫り絵の番号）。巣穴をタップすると、また見られる ----
   絵は3Dから写したチップ（tools/art/tsuchi/carve3d.py）：かべの小さい絵 cave:carve#n・大きな1まい carve:big#n */
const TSCARVE=[
  {fl:0,name:'あなぐまと子たち',lines:[[TOTO,'#surprise|……かべに、なにか彫ってある。'],[TOTO,'大きなあなぐまが、ちいさな子たちを、だっこしてる。'],[TOTO,'#joy|……かっこいいなあ。'],[TOTO,'#think|ヌシ様かな。ぼくも、こんなふうに大きくなれたらいいのに。']]},
  {fl:1,name:'天井をささえるあなぐま',ok:()=>tsQDone('tsolive'),lines:ib=>[[TOTO,'#surprise|……また、彫り絵だ。'],[TOTO,'大きなあなぐまが、くずれる天井を、体でささえてる。'],[TOTO,'その下を、子たちが、にげていく……。'],
    ...(ib?[[IBUKI,'#surprise|おい、トト。……ふるえてるぞ。']]:[]),[TOTO,'#scared|……わかんない。なんでだろ。足が、とまらないの。'],...(ib?[[IBUKI,'#think|……つめたい風のせいだな。村へもどろうぜ。']]:[])]},/* 2まいめ：ハニのオリーブのあと（ok）。見た日の夜にツチノオオカゲが来る（tsOok） */
  {fl:5,name:'あなぐまの足あと',ok:()=>!!S.flags.tsOokDown,lines:ib=>[[TOTO,'#surprise|……あなぐまの、足あとだ。'],[TOTO,'大きな足あとのよこに、ちいさい足あとが、ついてる。'],[TOTO,'#scared|……ぼくの足と、おんなじかたちだ。'],
    ...(ib?[[IBUKI,'#surprise|おい、トト。何を言ってんだ。']]:[]),[TOTO,'#droop|……わかっちゃった。あの大きなあなぐまは、ぼくなんだ。'],[TOTO,'#scared|ずっと、だましてたんだ。みんなも、ぼくも。ごめん……！'],
    ...(ib?[[IBUKI,'#alarm|おい、まて、トト！']]:[])]},/* 3まいめ：ツチノオオカゲを追いはらったあと（ok）。見たあと、トトはひとりで洞窟のおくへにげる（tsTotoFlee） */
];
const tsCarveOf=fl=>WD===TSUCHI?TSCARVE.findIndex(c=>c.fl===fl&&(!c.ok||c.ok())):-1;
function tsCaveCarve(C){/* 洞窟に入ったとき：坂にいちばん近い、正面の見える岩のマスに、彫り絵を置く（caveEnter） */C.carve=null;const n=tsCarveOf(C.fl);if(n<0)return;let R=-1;for(const[j,o]of C.ob)if(o.k==='R'){R=j;break}if(R<0)return;
  const rx=cvX(R),ry=cvY(R);let best=-1,bd=1e9;for(let y=Math.max(0,ry-5);y<=Math.min(CVH-2,ry+3);y++)for(let x=Math.max(0,rx-5);x<=Math.min(CVW-1,rx+5);x++){const j=cvJ(x,y);if(C.g[j]||C.ab[j]||C.ob.has(j)||!C.g[j+CVW]||C.wt[j+CVW]||C.ab[j+CVW])continue;const d=Math.hypot(x-rx,y-ry);if(d<bd){bd=d;best=j}}
  if(best>=0){C.carve={j:best,n};C.ore.delete(best)}}
function tsCarveDraw(c,x,y,ox,oy){/* 岩の正面に（iso-cave2.js の cvqRockDeco） */const C=CV;if(!C||!C.carve||C.carve.j!==cvJ(x,y))return false;const ch=window.CHIPS&&CHIPS['cave:carve#'+C.carve.n];if(ch&&drawChip(c,ch,'carve',ox,oy,performance.now()))return true;
  const F=(col,a,b,w,h)=>{c.fillStyle=col;c.fillRect(ox+a,oy+b,w,h)};F('#8c7a66',3,4,26,24);F('#a8957e',4,5,24,22);F('#7a6957',9,9,14,12);F('#8c7a66',11,11,10,8);F('#7a6957',7,20,4,4);F('#7a6957',21,20,4,4);F('#7a6957',14,22,4,3);return true}
function tsCarveImg(n){/* 大きな1まいの絵（チップがないときは、コードの仮の絵） */const cv=document.createElement('canvas');cv.width=160;cv.height=120;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;const ch=window.CHIPS&&CHIPS['carve:big#'+n];
  if(ch){const im=chipImgs(ch,'carve:big#'+n)[0];if(im&&im.ok){cv.width=im.width;cv.height=im.height;g.drawImage(im,0,0);return cv}}
  if(n===2){/* あなぐまの足あと：大きな足あとと、よこの、ちいさな足あと（同じかたち） */const F=(col,a,b,w,h)=>{g.fillStyle=col;g.fillRect(a,b,w,h)},foot=(x,y,k,c1,c2)=>{F(c1,x,y+9*k,10*k,7*k);F(c1,x-1*k,y+4*k,3*k,5*k);F(c1,x+2*k,y,3*k,6*k);F(c1,x+5*k,y,3*k,6*k);F(c1,x+8*k,y+4*k,3*k,5*k);F(c2,x+1*k,y+10*k,8*k,2*k)};
    F('#a8957e',0,0,160,120);F('#8c7a66',4,4,152,112);F('#b5a28a',8,8,144,104);for(let i=0;i<10;i++){F('#a08a74',14+i*14,12+((i*37)%9),6,2);F('#9a8570',20+i*14,100-((i*29)%9),5,2)}
    foot(36,34,4,'#6b5b4b','#5a4b3d');foot(104,54,2,'#6b5b4b','#5a4b3d');F('#7a6957',96,50,2,2);F('#7a6957',134,50,2,2);return cv}
  const F=(col,a,b,w,h)=>{g.fillStyle=col;g.fillRect(a,b,w,h)};F('#a8957e',0,0,160,120);F('#8c7a66',4,4,152,112);F('#b5a28a',8,8,144,104);
  F('#8c7a66',50,22,60,56);F('#7a6957',58,14,14,12);F('#7a6957',88,14,14,12);F('#6b5b4b',62,40,6,4);F('#6b5b4b',92,40,6,4);
  for(let i=0;i<3;i++){F('#7a6957',40+i*30,74,20,20);F('#6b5b4b',46+i*30,80,3,3);F('#6b5b4b',53+i*30,80,3,3)}return cv}
function tsCarveView(n,done){const D=TSCARVE[n];if(!D){if(done)done();return}const P=pxPop(D.name),im=tsCarveImg(n);im.style.cssText='display:block;width:100%;image-rendering:pixelated;margin:4px 0';P.body.appendChild(im);
  if(done){const b=el('<button class="btn pri" style="width:100%;margin-top:8px">つぎへ</button>');b.onclick=()=>{sfx('tap');P.close();done()};P.body.appendChild(b);const x=P.o.querySelector('.x');if(x)x.onclick=b.onclick;P.o.onclick=null}}
function tsCarveAt(C,next){/* 坂まで来たとき（cave.js の cvClearCheck）：まだ見ていない彫り絵なら、見せて話してから next。トトがいないときは、つぎに来たとき */const n=tsCarveOf(C.fl);if(n<0||(S.ts&&S.ts.carve||[]).includes(n)||!C.party.some(a=>a.r.name===TOTO))return false;
  later(()=>{if(CV!==C)return;sfx('good');tsCarveView(n,()=>{if(CV!==C)return;const L=TSCARVE[n].lines;dialog(typeof L==='function'?L(C.party.some(a=>a.r.name===IBUKI)):L,()=>{if(CV!==C)return;(S.ts.carve||(S.ts.carve=[])).push(n);if(n===1)tsOokSet();if(n===2)tsTotoFlee(C);memo('star','洞窟のかべで、彫り絵「'+TSCARVE[n].name+'」を見つけた');next()})})},1300);return true}
function tsTotoFlee(C){/* 彫り絵3のあと：トトは、ひとりで洞窟のおくへにげる。パーティからも村からもいなくなる（S.ts.totoGone に、とっておく。お話の後半でもどる） */
  const a=C.party.find(q=>q.r.name===TOTO);if(!a)return;const t=a.r;cvSpark(a.x,a.y-CVOY,'#c8b890',12);sfx('crack');
  C.party=C.party.filter(q=>q!==a);C.all=(C.all||[]).filter(r=>r!==t);S.cvAway=(S.cvAway||[]).filter(r=>r!==t);if(C.focus&&C.focus.tg===a)C.focus.tg=null;
  t.act=null;t.path=[];S.ts.totoGone=t;toast('トトは、洞窟のおくへ、走っていった','warn');cvHudUpd()}
const tsCaveMust=()=>{/* まだ見ていない彫り絵の階があるうちは、トトもいっしょ（cave.js の cavePrep。出かける階は、そのあとでえらぶ） */if(!tsOn())return null;const top=Math.min(S.cvClr||0,cvFlOpen()-1);for(let fl=0;fl<=top;fl++){const n=tsCarveOf(fl);if(n>=0&&!(S.ts.carve||[]).includes(n))return S.res.find(r=>r.name===TOTO&&!r.hidden)||null}return tsOkuOn()&&top>=TSOKFL?tsHaniOf():null};/* 10階のトトの所へは、ハニもいっしょ（tsuchi-oku.js） */
/* ---- はじまりの地ゆれ：カメラが巣穴へ → 地面がゆれる → トトがころがり出る → 会話 ---- */
let TSINTRO=null;
function tsIntro(next){const h=S.ts&&S.ts.hole,t=S.res.find(r=>r.name===TOTO);if(h==null||!t){next();return}
  const owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION,hx=h%W+.5,hy=((h/W)|0)+.5,ex=hx,ey=hy+3;
  t.x=hx;t.y=hy+.6;t.path=[];t.act=null;t.face=1;GIFT_ACTIVE=true;showUI(false);
  const fin=()=>{TSINTRO=null;GIFT_ACTIVE=false;showUI(true);if(ok())next()};
  camAnim=TSINTRO={fz:cam.z,tz:Math.max(cam.z,1.2),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:hx*TS,ty:(hy+1.5)*TS,t:0,dur:1.6,done:()=>{if(!ok())return fin();
    sfx('crack');shakeScreen('l');musicDuck(2400);
    later(()=>{if(!ok())return fin();shakeScreen('m');sfxAt('dust',hx,hy);spawnFX(hx-.5,hy-.2,'#b8946e');
      const t0=performance.now(),dur=1300,roll=()=>{if(!ok())return fin();const q=Math.min(1,(performance.now()-t0)/dur),e=1-(1-q)*(1-q);t.x=hx+(ex-hx)*e;t.y=hy+.6+(ey-hy-.6)*e;dirty=true;
        if(q<1){if(((q*6)|0)!==((q*6-.02)|0))JUMP.set(t,performance.now());requestAnimationFrame(roll);return}
        sfxAt('bonk',t.x,t.y);JUMP.set(t,performance.now());spawnFX(t.x-.5,t.y-.4,'#c4a07a');later(fin,500)};
      requestAnimationFrame(roll)},900)}}}
function tsIntroReset(){if(TSINTRO){if(camAnim===TSINTRO)camAnim=null;TSINTRO=null;GIFT_ACTIVE=false}}/* 村を切りかえたとき */
/* ---- 会話と目標 ---- */
MAINEL[TSUCHI]='earth';SECOND[TSUCHI]={elem:'earth',name:HANI,ok:()=>false};/* ハニは、神殿でよばない。洞窟の1階のあとにひらいた土地にいる（tsKonohaCome） */
PROS[TSUCHI]=[
  [GOD,'つぎの土地は、岩の谷じゃ。'],
  [GOD,'#worry|大地がひびわれて、谷が、まっぷたつになりかけておる。'],
  [GOD,'むかしは、大きなあなぐまのヌシ様が、谷じゅうに巣穴をほって、みんなを見まもっておったそうな。'],
  [GOD,'……いまは、だれの声もせん。行ってみようかの。'],
];
INTROS[TSUCHI]=[
  [TOTO,'#surprise|わわわっ！ ……ゆ、ゆれた！ また、ゆれたぁ！'],
  [GOD,'#surprise|おお、だいじょうぶかの？ 穴から、ころがってきおったぞ。'],
  [TOTO,'#scared|だ、だれ！？ ……かみさま？'],
  [TOTO,'#think|……ふ、ふん。こわくなんか、ないもん。ちょっと、びっくりしただけだもん。'],
  [TOTO,'ぼく、トト。土のせいれい。この谷に、ずっとすんでるんだ。'],
  [GOD,'#worry|この地ゆれは、ようあるのかの？'],
  [TOTO,'#worry|……うん。夜になると、地われの下から、へんな音がするの。'],
  [TOTO,'#joy|でも、へっちゃらだもん！ ぼく、つよいから！'],
  [GOD,'ほっほ、たのもしいのう。まずは、あそこの古い神殿を直すとしようかの。'],
];
QL[TSUCHI]=[
  {id:'statue',text:'神殿を直してもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'「しらべる」で、こわれた神殿をタップ',
   story:[[GOD,'#joy|ここが、おヌシとわしの居場所じゃ。'],[TOTO,'#surprise|わあ……！ ぴかぴかだ。'],[GOD,'この谷のヌシ様は、どこにおられるのかのう。'],[TOTO,'#think|ヌシ様？ ……大きなあなぐまのこと？ ずっと前に、いなくなっちゃったって。'],[TOTO,'#worry|まえにいた子たちが、ヌシ様はぼくらを見すてたって、言ってた。……ぼくは、よく、おぼえてないけど。']],
   gives:{feat:['inv','remove','plant','craft','people','summon','shop'],recipes:['bed','crate','wbench'],items:{wbench:1,bed:1},mat:{wood:10,stone:10,sagan:10},run(){for(const k of['tree','bellf','salvia','lily','lotus','clover'])if(BL[k])S.unlocked[k]=true}}},/* 花のたね・木の苗は、カミサマのお店に出る。夜のコワイノは、まだ来ない */
  {id:'tscave1',text:'巣穴のおくへ行こう',check:()=>tsRubOpenN()>=1,how:'「しらべる」で巣穴をタップして、洞窟へ出かける。下へおりる坂まで行こう',
   talk:{who:TOTO,when:()=>true,lines:[[TOTO,'#think|ねえ、かみさま。巣穴のおくから、ずっと、つめたい風がふいてくるの。'],[GOD,'ふむ。おくは、どこまでつづいとるのかのう。'],[TOTO,'#scared|……く、くらいけど。'],[TOTO,'#proud|へっちゃらだもん！ ぼく、見てくる！']]},
   story:[[GOD,'#surprise|おお、谷のはしの岩の山が、くずれたぞい。'],[TOTO,'#surprise|ほんとだ。あそこ、ずっと、ふさがってたのに。'],[TOTO,'#think|……あれ？ だれか、いる。']]},
  {id:'tskonoha',text:'ひらいた土地へ行ってみよう',check:()=>tsKonohaIn()&&NEWRES==null&&!NEWQ.length,how:'ひらいた土地の、たおれたオリーブのそばにいる、土のせいれいに話しかけよう',
   talk:{who:HANI,when:()=>S.res.some(r=>r.name===HANI),done:()=>tsKonohaJoin(),lines:[[HANI,'……だれ。'],[TOTO,'ぼく、トト。この谷の、土のせいれい。'],[HANI,'……ハニ。……おなじ、土のせいれい。'],[HANI,'#droop|ここに、家があった。オリーブの木も。……地われの夜に、ぜんぶ、うまった。'],[TOTO,'#worry|……そうだったんだ。'],[GOD,'よう、ひとりで、がんばったのう。わしらの村へ、おいで。'],[HANI,'#nod|……うん。']]}},
  {id:'tsolive',text:'オリーブの苗をうえよう',check:()=>tsOliveN()>=TSOLIVEN,prog:()=>'ひらいた土地のオリーブ '+Math.min(TSOLIVEN,tsOliveN())+'/'+TSOLIVEN,how:'「おく」→「オリーブの苗」を、ひらいた土地に置く。せいれいが植えるのを待とう',
   talk:{who:HANI,when:()=>true,gives:{items:{tree:TSOLIVEN}},lines:[[HANI,'#think|……あの土地に、オリーブを、また植えたい。'],[TOTO,'#joy|うん！ ぼくも手伝う。'],[HANI,'……ヌシ様は、あの夜、どこにもいなかった。'],[HANI,'谷がわれても、家がうまっても。……ぼくらを、見すてたんだ。'],[TOTO,'#jolt|……そうだよ。ヌシ様なんて、ずるいよ。'],[TOTO,'#think|……なんで、いなくなっちゃったんだろ。']]},
   story:[[HANI,'#joy|……ちいさい葉が、ゆれてる。'],[HANI,'また、われるかもしれないけど。'],[TOTO,'#proud|われないもん！ ぼくが、ふんばるから！'],[HANI,'……トトじゃ、ささえられないよ。'],[TOTO,'#droop|……う。'],[GOD,'ほっほ。巣穴の、もっとおくには、なにがあるんじゃろうのう。']]},
  {id:'tscave2',text:'巣穴の、もっとおくへ行こう',check:()=>(S.ts.carve||[]).includes(1)&&S.res.some(r=>r.name===IBUKI)&&!S.ts.ibNew&&NEWRES==null&&!NEWQ.length,how:'「しらべる」で巣穴をタップして、洞窟の2階へ。下へおりる坂まで行こう',
   talk:{who:TOTO,when:()=>true,lines:[[TOTO,'#think|ねえ、かみさま。洞窟の2階にも、下へおりる坂があったよね。'],[HANI,'……もっと、おくへ行くの？'],[TOTO,'#proud|うん。へっちゃらだもん。'],[HANI,'#think|……気をつけて。']]}},
  {id:'tsookage',text:'夜の谷を守ろう',check:()=>!!S.flags.tsOokDown,how:'夜、大きな影が来たら、まもりの光を当てよう',
   story:[[HANI,'……ゆうべ、大きな影が来たって。'],[TOTO,'#think|あの声……どこかで、きいたことがある気がするの。'],[IBUKI,'#proud|また来たら、おれが追いはらってやる。まかせとけ。'],[GOD,'ふむ。巣穴の、もっとおくに、なにかありそうじゃな。']]},  {id:'tscave3',text:'巣穴の、もっとおくへ行こう',check:()=>!!S.ts.totoGone,how:'「しらべる」で巣穴をタップして、洞窟の6階へ。下へおりる坂まで行こう',
   story:[[HANI,'#droop|……トトが、いなくなった。'],[HANI,'……ぼくが、ひどいことを、言ったから。'],[IBUKI,'#think|……おれも、追いかけたかった。']]},
  {id:'tsbridge',text:'谷をつなぐ石の大橋をかけよう',check:()=>!!S.flags.tsBridge,prog:()=>'石の大橋 '+tsBrDoneN()+'/'+tsBrCells().length,how:'地われの、岩の橋のすぐ南のマスをタップして、石の大橋をかける。せいれいが、砂岩と石材をはこぶ',
   talk:{who:HANI,when:()=>true,done:()=>{S.flags.tsBrOpen=1},lines:[[HANI,'#think|……あの、地われ。'],[HANI,'あの夜から、ずっと、谷を、ふたつにわっている。'],[HANI,'トトは、ひとりで、おくへ行った。……ぼくらは、わたれない。'],[HANI,'#nod|……あのきず、みんなで、ふさごう。'],[IBUKI,'#proud|おう、まかせとけ！ 石なら、いくらでもはこぶぜ。']]},
   story:[[HANI,'……できた。'],[IBUKI,'#joy|やったな！ これなら、おくまで行けるぜ。'],
    ['@choice',{key:'tsBrFlower',who:HANI,q:'#think|……らんかんに、花をかざろう。どれがいい？',pick:v=>{S.ts.brFlower=v},opts:[
     {t:'いわかがみ',v:'iwakagami',lines:[[HANI,'……この谷の、花。']]},
     {t:'サルビア',v:'salvia',lines:[[HANI,'……あかい花。トトが、すきそう。']]},
     {t:'ユリ',v:'lily',lines:[[HANI,'……しろい花。']]}]}],
    [GOD,'ほっほ。谷が、ひとつにつながったのう。']]},
  {id:'tsoku',text:'洞窟のいちばんおくへ行こう',check:()=>!!S.ts.totoRoot,prog:()=>(S.cvClr|0)<TSOKFL?'洞窟の10階は、まだひらいていない':!tsHaniOf()&&!(S.cvAway||[]).some(r=>r.name===HANI)?HANI+'が、村にいない':'ハニといっしょに、10階のまん中の島へ',how:'「しらべる」で巣穴をタップして、洞窟の10階へ。ハニといっしょに、まん中の島へ行こう'},/* トトの場面は tsuchi-oku.js */
  {id:'tsnushi',text:'トトの根のそばへ行こう',check:()=>!!S.ts.haniNushi,prog:()=>tsNushiProg(),how:'昼、みんなが、巣穴の前のトトの根のそばに集まる'},/* ハニがあたらしいヌシ様になる（tsuchi-nushi.js）。このあとクリア */
];
/* ---- くずれた岩の山（S.ts.rub）：谷のはしの土地を、地ゆれでくずれた岩がふさいでいる。洞窟の階をはじめてクリアするたびに、1つずつくずれて、土地がひらく ----
   1つめ（ひらく順の0）は地われの西がわ。そこに、たおれたオリーブ（tskonoki）と、土のせいれいハニがいる。
   S.ts.rub[i]={c:まん中のマス, cells:[マス], keep:{マス:もとの物}, open:0|1}。岩のマスの物は tsrubble（こわせない・うつせない・歩けない） */
TSIDS.add('tsrubble');TSIDS.add('tskonoki');
BL.tsrubble={name:'くずれた岩の山',solid:1};BL.tskonoki={name:'たおれたオリーブ',solid:1};
function tsRubGen(s){/* 足りない分だけ作る（古いセーブの岩の山が7つのときは、のこりの3つを足す：MIGRATIONS の v14） */if(!s.ts)return;const old=s.ts.rub||[];if(old.length>=TSRUBN)return;const hiS=j=>s.hi?s.hi[j]|0:0,hole=s.ts.hole,hx=hole%W,hy=(hole/W)|0;
  const ok=j=>s.ground[j]===0&&!s.floor[j]&&(!s.obj[j]||!!(BL[s.obj[j]]&&BL[s.obj[j]].natural&&s.obj[j]!=='anagura'));
  const pass=j=>s.ground[j]===0&&!(s.obj[j]&&BL[s.obj[j]]&&BL[s.obj[j]].solid&&!BL[s.obj[j]].natural);
  const reach=block=>{/* 神殿の南から、歩いて行けるマスの数（段差は1だんまで） */const seen=new Uint8Array(W*H),q=[(CY+2)*W+CX];seen[q[0]]=1;let n=0;
    while(q.length){const i=q.pop();n++;const x=i%W,y=(i/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(seen[j]||block.has(j)||!pass(j)||Math.abs(hiS(j)-hiS(i))>1)continue;seen[j]=1;q.push(j)}}return n};
  const cand=[];for(let y=OFF+4;y<OFF+OW-4;y++)for(let x=OFF+4;x<OFF+OW-4;x++){const j=y*W+x;if(!ok(j))continue;if(Math.abs(x-tsRiftAt(y))<7||Math.abs(y-TSBRY)<6)continue;
    const d=Math.hypot(x-CX,y-CY);if(d<13||d>32||Math.hypot(x-hx,y-hy)<10)continue;
    let cliff=false;for(let b=-2;b<=2&&!cliff;b++)for(let a=-2;a<=2;a++){const k=j+b*W+a;if(s.ground[k]===0&&hiS(k)>hiS(j)){cliff=true;break}}if(!cliff)continue;/* がけのふもと */
    const cells=[];for(let b=-4;b<=4;b++)for(let a=-4;a<=4;a++){if(Math.hypot(a,b)>TSRUBR)continue;const k=j+b*W+a;if(ok(k)&&hiS(k)===hiS(j))cells.push(k)}if(cells.length<TSRUBMIN)continue;
    cand.push({c:j,x,y,d,cells,w:x<tsRiftAt(y)})}
  const L=old.map(P=>({c:P.c,x:P.c%W,y:(P.c/W)|0,old:1})),used=new Set(),base=reach(new Set());
  const fits=p=>{if(L.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<TSRUBGAP))return false;const B=new Set(used);for(const k of p.cells)B.add(k);return base-reach(B)<=used.size+p.cells.length+40};/* ふさいでも、ほかの土地へ行ける */
  const first=L.length?null:cand.filter(p=>p.w).sort((a,b)=>a.d-b.d).find(fits);if(first){L.push(first);for(const k of first.cells)used.add(k)}
  while(L.length<TSRUBN){let best=null,bs=-1;for(const p of cand){if(L.includes(p))continue;const g=Math.min(...L.map(q=>Math.hypot(q.x-p.x,q.y-p.y)),99);if(g<TSRUBGAP||g<=bs)continue;if(!fits(p))continue;bs=g;best=p}if(!best)break;L.push(best);for(const k of best.cells)used.add(k)}
  s.ts.rub=old.concat(L.filter(p=>!p.old).map(p=>{const keep={};for(const k of p.cells){if(s.obj[k])keep[k]=s.obj[k];s.obj[k]='tsrubble';delete s.dyn[k];delete s.hp[k]}return{c:p.c,cells:p.cells,keep,open:0}}))}
let TSRUBT=null;function tsRubTier(j){/* 岩の山のまん中のマスは高い絵（hi）、ふちはひくい絵（lo） */if(!TSRUBT||TSRUBT.s!==S){TSRUBT={s:S,m:new Map()};for(const P of(S.ts&&S.ts.rub)||[]){const cx=P.c%W,cy=(P.c/W)|0;for(const k of P.cells)TSRUBT.m.set(k,Math.hypot(k%W-cx,((k/W)|0)-cy)<TSRUBHI?'hi':'lo')}}return TSRUBT.m.get(j)||'lo'}
const tsRubOpenN=()=>tsOn()&&S.ts.rub?S.ts.rub.filter(p=>p.open).length:0;
const tsQDone=id=>{const i=questIndexOf(id);return i>=0&&S.quest>i};
let TSOPEN=null;
function tsRubOpen(i){const P=S.ts.rub[i];if(!P||P.open)return;const owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION,cx=P.c%W+.5,cy=((P.c/W)|0)+.5;
  GIFT_ACTIVE=true;showUI(false);const fin=()=>{TSOPEN=null;GIFT_ACTIVE=false;showUI(true);if(ok()){recount();checkQuest()}};
  camAnim=TSOPEN={fz:cam.z,tz:Math.max(cam.z,1.1),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:cx*TS,ty:cy*TS,t:0,dur:1.6,done:()=>{if(!ok())return fin();
    sfx('crack');shakeScreen('m');musicDuck(2400);
    later(()=>{if(!ok())return fin();shakeScreen('l');sfxAt('dust',cx,cy);
      P.open=1;for(const k of P.cells){S.obj[k]=P.keep[k]||'';delete S.dyn[k];delete S.hp[k];if(hash(k*7+3)<.35)spawnFX(k%W,(k/W)|0,'#c4a07a')}
      if(i===0)tsKonohaCome(P);
      toast('くずれた岩の山がくずれて、土地がひらいた','good');memo('leaf','くずれた岩の山がくずれて、谷のはしの土地がひらいた');dirty=true;later(fin,900)},900)}}}
function tsOpenReset(){if(TSOPEN){if(camAnim===TSOPEN)camAnim=null;TSOPEN=null;GIFT_ACTIVE=false}}
/* 洞窟からもどったら：はじめてクリアした階の数だけ、岩の山がくずれる（main.js：画面があいているとき） */
function tsTick(){if(!tsOn()||!S.ts.rub||typeof CV!=='undefined'&&CV||TSINTRO||TSOPEN||GIFT_ACTIVE||camAnim||document.querySelector('.pxpopw,.idea-reveal'))return;
  const n=Math.min(S.cvClr||0,S.ts.rub.length);for(let i=0;i<n;i++)if(!S.ts.rub[i].open){tsRubOpen(i);return}
  if(S.ts.ibNew&&NEWRES==null&&!NEWQ.length){tsIbWelcome();return}if(tsNushiTick())return;/* トトの根・あたらしいヌシ様（tsuchi-nushi.js） */if(tsQuakeTick())return;/* 地ゆれ（tsuchi-quake.js） */tsOokTick()}
/* ---- ハニ：ひらいた土地の、たおれたオリーブのそばで、すわっている（話しかけるまで、そこから動かない） ---- */
function tsKonohaCome(P){if(S.res.some(r=>r.name===HANI))return;const c=P.c;S.obj[c]='tskonoki';delete P.keep[c];
  const k=[c+W,c-1,c+1,c-W].find(q=>P.cells.includes(q)&&!S.obj[q])||c+W;S.obj[k]='';S.ts.kon=k;
  const r=mkRes(S,HANI,'earth',k%W+.5,((k/W)|0)+.5);r.tsWait=1;r.hunger=375;r.spawnT=performance.now();r.came=dayNo();S.lastCame=dayNo();S.res.push(r);spawnFX(k%W,(k/W)|0,ELEM.earth.col)}
function tsStep(){if(!tsOn())return;for(const q of S.res)if(q.tsNight){RHOLD.set(q,performance.now()+4000);q.path=[];q.nap=false;if(q.hidden)q.hidden=false}/* ツチノオオカゲの夜：トトとイブキは、その場で見はる */const r=S.res.find(q=>q.tsWait);if(!r)return;const k=S.ts.kon;if(k==null){r.tsWait=0;return}
  RHOLD.set(r,performance.now()+4000);r.path=[];r.nap=true;r.x=k%W+.5;r.y=((k/W)|0)+.5;r.hunger=Math.max(r.hunger,300)}/* 待つあいだは、おなかもへらない */
function tsKonohaJoin(){const r=S.res.find(q=>q.name===HANI);if(!r||!r.tsWait)return;r.tsWait=0;r.nap=false;RHOLD.delete(r);
  if(typeof letterQ==='function')letterQ(r,'new');memo('star',HANI+'（土のせいれい）が村にやってきた');logEv(HANI+'（土のせいれい）がやってきた');const w={id:r.id,t:Infinity};NEWQ.push(w);HOLD.add(r.id);if(typeof welcomeNear==='function')welcomeNear(r,w)}
const tsKonohaIn=()=>S.res.some(r=>r.name===HANI&&!r.tsWait);
function tsOliveN(){const P=tsOn()&&S.ts.rub&&S.ts.rub[0];if(!P||!P.open)return 0;let n=0;for(let b=-5;b<=5;b++)for(let a=-5;a<=5;a++){const k=P.c+b*W+a;if(Math.hypot(a,b)<=5&&S.obj[k]==='tree')n++}return n}/* ひらいた土地（まん中から5マス）の、オリーブ */
/* ---- 洞窟の2階：坂の手前で、火のせいれいイブキが、小さなコワイノ3びきとたたかっている（C.ib）。近づくと会話、いっしょにたおすと会話、なかまになる（S.ts.ib） ----
   イブキは、会うまで C.party に入れず、そばに立って、ねむっているコワイノにむかって火をふる（絵だけ。cvActorsL で描く）。コワイノは会話がおわるまで起きない（tsHold） */
const TSIBFL=1/* イブキがいる階 */,TSIBFOE=3,TSIBNEAR=4.5/* このマスの近さまで来たら会話 */,TSIBBACK=5/* 坂から、このマスの数だけ手前 */;
function tsCaveIbuki(C){C.ib=null;if(!tsOn()||C.fl!==TSIBFL||S.ts.ib||!tsQDone('tsolive')||cvAll().some(r=>r.name===IBUKI))return;
  let R=-1,St=-1;for(const[j,o]of C.ob){if(o.k==='R'&&R<0)R=j;if(o.k==='S'&&St<0)St=j}if(R<0||St<0)return;
  const p=cvBfs(St,q=>q===R);if(!p||p.length<TSIBBACK+3)return;const j=p[p.length-1-TSIBBACK],on=new Set(p);
  const r=mkRes(S,IBUKI,'fire',STATUE>=0?STATUE%W+.5:CX+.5,STATUE>=0?((STATUE/W)|0)+1.5:CY+.5);
  const a={r,elem:'fire',id:r.id,x:cvX(j)+.5,y:cvY(j)+.5+CVOY,path:[],face:1,back:false,turn:0,swing:0,fback:false,fatk:0,job:null,jq:[],mv:false,chase:false,rp:0,cj:j,hurtU:0,joyU:0,shockU:0,eatU:0,blowU:0,eatE:'',jumpT:0};
  const fs=cvBfsRing(j,16).filter(k=>k!==j&&!on.has(k)&&!C.ob.has(k)&&Math.hypot(cvX(k)-cvX(j),cvY(k)-cvY(j))>=1.5).slice(0,TSIBFOE);
  const ids=fs.map(k=>{const D=EN.basic,e={id:C.eid++,type:'basic',asleep:true,tsHold:1,x:cvX(k)+.5,y:cvY(k)+.5+CVOY,hp:D.hp,max:D.hp,spawned:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:k};C.en.push(e);return e.id});
  C.ib={a,ids,st:0,sw:0,k:0}}
const cvActorsL=C=>(C.ib&&C.ib.st===0&&C.seen[cvCell(C.ib.a)]?C.party.concat([C.ib.a]):C.party).concat(tsOkuActors(C));/* 10階のトト（tsuchi-oku.js） *//* 洞窟で描くせいれい：なかまと、まだ会っていないイブキ（iso-cave.js） */
function tsCaveTick(C,now){/* caveFrame から */const I=C.ib;if(!I||I.st>=3)return;const a=I.a,fs=C.en.filter(e=>I.ids.includes(e.id)&&!e.dead);
  if(I.st===0){if(fs.length&&now>=I.sw){I.sw=now+1100;const e=fs[(I.k++)%fs.length];a.face=e.x>=a.x?1:-1;a.turn=Math.abs(e.x-a.x)>Math.abs(e.y-a.y)*.6?1:0;a.back=a.fback=e.y<a.y-.3&&!a.turn;a.swing=now;later(()=>{if(CV===C&&!e.dead){atkFX(a,e);cvSpark(e.x,e.y-CVOY,'#ffb070',6)}},HIT_LAG)}/* 火をふる（絵だけ） */
    if(!C.party.some(q=>Math.hypot(q.x-a.x,q.y-a.y)<=TSIBNEAR))return;I.st=1;C.focus=null;for(const q of C.party){q.path=[];q.mv=false}
    dialog([[IBUKI,'#alarm|へっ、まだまだ！ ……ん？ だれだ、おまえら。'],[TOTO,'#surprise|わっ、火のせいれいだ！'],[IBUKI,'おれは、イブキ。こいつら、なかなか、しつこくてよ。'],[TOTO,'#proud|ぼ、ぼくも、たたかえるもん！'],[IBUKI,'#joy|ははっ、ちびすけ、ふるえてるじゃねえか。……まあいい。まかせとけ！']],()=>{if(CV!==C)return;tsIbJoin(C)});return}
  if(I.st===2&&!fs.length){I.st=3;later(()=>{if(CV!==C)return;dialog([[IBUKI,'#joy|やるじゃねえか、ちびすけ。'],[TOTO,'#jolt|ちびすけじゃないもん。トトだもん。'],[IBUKI,'おう、トト。おまえら、上の村から来たのか？ ……おれも、いっしょに行っていいか。'],[TOTO,'#joy|うん！']])},600)}}
function tsIbJoin(C){/* 会話のあと：なかまになって、コワイノが起きる */const I=C.ib,a=I.a,r=a.r;I.st=2;(S.cvAway||(S.cvAway=[])).push(r);/* 洞窟にいるあいだは、村のせいれいの外（cave.js の cvAwayBack で村へ） */r.hunger=375;r.came=dayNo();S.lastCame=dayNo();(S.keyN||(S.keyN={})).fire=IBUKI;S.ts.ib=1;S.ts.ibNew=1;
  C.party.push(a);C.all.push(r);for(const e of C.en)if(I.ids.includes(e.id)){e.tsHold=0;e.asleep=false;e.wakeT=performance.now()}sfx('arrive');toast(IBUKI+'がなかまになった','good');cvHudUpd()}
function tsIbWelcome(){/* 洞窟からもどったら：村のなかまの紹介（tsTick） */const r=S.res.find(q=>q.name===IBUKI);S.ts.ibNew=0;if(!r)return;
  if(typeof letterQ==='function')letterQ(r,'new');memo('star',IBUKI+'（火のせいれい）が村にやってきた');logEv(IBUKI+'（火のせいれい）がやってきた');const w={id:r.id,t:Infinity};NEWQ.push(w);HOLD.add(r.id);if(typeof welcomeNear==='function')welcomeNear(r,w)}
KEYVR[IBUKI]={key:true,tr:'',pk:'fireB',h:8,l:0,lash:false,cheek:false,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.0};
KEYHELLO[IBUKI]='#wave|イブキだ。よろしくな！ こまったことがあったら、おれにまかせとけ。';
/* ---- ツチノオオカゲ1回め（S.ts.ok）：彫り絵2を見た日の夜。20時に前ぶれの会話、22時に地われのそばから来て、トトへゆっくり近づく。
   トトのそばで会話（トトは動けない・イブキが前に立つ）。まもりの光を3回当てると、巣穴へにげる（負けはない）。朝までにおわらなければ、つぎの夜にまた来る ----
   体力は へらない（tsOokUpd がもどす）。うごきは updEnemy・当たりは glHit・絵は drawEnemy から（night.js・draw-world.js） */
const TSOOKEVE=20,TSOOKH=22,TSOOKHIT=3,TSOOKMEET=1.8/* トトとの近さ */;
EN.tsuchi=Object.assign({},EN.boss2,{name:'ツチノオオカゲ',hp:99999,sp:.25,tsOok:1,col:'#2a2420',eye:'#e8c890'});
BOSSFX.tsuchi={col:'#e8c890',sub:'岩とかげの、大きなゆりかご。ゆっくりゆれて、こもりうたがきこえる'};
function tsOokSet(){/* 彫り絵2を見た：その日の夜に来る */if(S.flags.tsOokDown||S.ts.ok)return;const h=hour();S.ts.ok={d:h<TSOOKH-1?dayNo():dayNo()+1,eve:0,on:0,hit:0}}
const tsOokNight=O=>{const h=hour(),d=dayNo();return h>=TSOOKEVE&&d===O.d||h<6&&d===O.d+1};
const tsOokE=()=>S.enemies.find(e=>e.type==='tsuchi'&&!e.dead);
function tsOokGuards(on){/* トトとイブキは、夜ふかしして見はる（tsStep がその場にとめる） */for(const n of[TOTO,IBUKI]){const r=S.res.find(q=>q.name===n);if(!r)continue;r.tsNight=on?1:0;if(on){if(r.act)endAct(r);r.hidden=false;r.nap=false}else RHOLD.delete(r)}}
function tsOokTick(){/* tsTick から（画面があいているとき） */const O=S.ts.ok;if(!O||S.flags.tsOokDown)return false;const h=hour();
  if(!tsOokNight(O)){if(O.on&&h>=6){const e=tsOokE();if(e)S.enemies=S.enemies.filter(q=>q!==e);tsOokGuards(false);Object.assign(O,{d:dayNo(),eve:0,on:0,hit:0});toast('大きな影は、朝日の中へ消えていった','warn')}return false}/* 朝まで守りきれなかった：今夜、また来る */
  if(!O.eve){O.eve=1;tsOokGuards(true);const t=S.res.find(q=>q.name===TOTO),ib=S.res.find(q=>q.name===IBUKI);if(t&&ib&&Math.hypot(ib.x-t.x,ib.y-t.y)>2){const k=[1,-1].map(d=>((t.y|0)*W+(t.x|0)+d)).find(k=>walk(k))??(t.y|0)*W+(t.x|0);ib.x=k%W+.5;ib.y=((k/W)|0)+.5;spawnFX(k%W,(k/W)|0,ELEM.fire.col)}
    dialog([[TOTO,'#worry|……ねえ、かみさま。今夜は、地われの音が、いつもより大きいの。'],[GOD,'#worry|ふむ……。いやな感じがするのう。'],[IBUKI,'#proud|心配すんな。今夜は、おれが起きててやる。'],[TOTO,'#proud|ぼ、ぼくも起きてる！ へっちゃらだもん！'],[IBUKI,'#joy|ははっ。じゃあ、ふたりで見はりだな。']],null,null,TOTO);return true}
  if(!O.on&&(h>=TSOOKH||h<6)){O.on=1;tsOokSpawn();return true}
  const e=tsOokE();if(!e)return false;
  if(e.met===1){e.met=2;const t=S.res.find(q=>q.name===TOTO);if(t)STRAINU.set(t,performance.now()+60000);
    dialog([['？？？','……ちいさな子。……つかれたでしょう。'],['？？？','ねむって、いいんだよ。こわいことは、ぜんぶ、わすれさせてあげる。'],[TOTO,'#scared|……あ……。'],[GOD,'#surprise|トト！ どうしたんじゃ、動けんのか！'],[IBUKI,'#alarm|トト！ さがってろ！'],[IBUKI,'おまえの相手は、おれだ！ ……守り神、光をたのむ！']],()=>{tsOokGuard(e)},null,TOTO);return true}
  if(e.gone&&!O.done){O.done=1;S.enemies=S.enemies.filter(q=>q!==e);S.flags.tsOokDown=1;S.enemyOn=true;if(hour()>=20)S.lastWarn=dayNo();/* つぎの夜から、地われからコワイノとバケモノが来る（tsuchi-night.js） */tsOokGuards(false);const t=S.res.find(q=>q.name===TOTO);if(t)STRAINU.delete(t);memo('moon','ツチノオオカゲが、巣穴のおくへにげていった');
    dialog([[IBUKI,'#think|……にげやがった。巣穴の、おくのほうへ。'],[TOTO,'#droop|……ごめん。ぼく、足が、動かなかった。'],[IBUKI,'#joy|気にすんな。そのための、おれだろ。'],[GOD,'#think|……あの影、トトに「ねむっていい」と言うておったのう。']],()=>checkQuest(),null,IBUKI);return true}
  return false}
function tsOokSpawn(){/* 地われのそばの、トトから8マスより遠い所から */const t=S.res.find(q=>q.name===TOTO),tx=t?t.x:CX,ty=t?t.y:CY;let best=-1,bs=1e9;
  for(let j=0;j<W*H;j++){if(!walk(j))continue;const x=j%W,y=(j/W)|0;if(![1,-1,W,-W].some(d=>riftJ(j+d)))continue;const d=Math.hypot(x+.5-tx,y+.5-ty);if(d<8)continue;const sc=Math.abs(d-12);if(sc<bs){bs=sc;best=j}}
  if(best<0)best=(CY+8)*W+CX;const D=EN.tsuchi,e={id:S.nid++,type:'tsuchi',x:best%W+.5,y:((best/W)|0)+.5,hp:D.hp,max:D.hp,delay:0,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false,met:0};
  S.enemies.push(e);SKIP=false;(S.seenEn||(S.seenEn={})).tsuchi=1;spawnFX(e.x-.5,e.y-.5,'#3a3028');bossEntrance(e);villageTimeout(()=>{if(S.enemies.includes(e))dialog([[IBUKI,'#alarm|地われから、なにか来るぞ！']],null,null,IBUKI)},5600)}
function tsOokGuard(e){/* 会話のあと：イブキが、トトの前に立つ */e.prot=1;const t=S.res.find(q=>q.name===TOTO),ib=S.res.find(q=>q.name===IBUKI);if(t&&ib){const dx=e.x-t.x,dy=e.y-t.y,l=Math.hypot(dx,dy)||1;ib.x=t.x+dx/l*.9;ib.y=t.y+dy/l*.9;ib.face=dx<0?-1:1;spawnFX(ib.x-.5,ib.y-.5,ELEM.fire.col);JUMP.set(ib,performance.now())}
  if(S.ts.ok.hit>=TSOOKHIT)tsOokFlee(e)}
function tsOokHit(e){/* まもりの光が当たった（glHit） */e.hp=e.max;if(e.flee)return;const O=S.ts.ok;O.hit=Math.min(TSOOKHIT,(O.hit||0)+1);toast('まもりの光が、大きな影に当たった（'+O.hit+'/'+TSOOKHIT+'）','good');if(O.hit>=TSOOKHIT&&e.prot)tsOokFlee(e)}
function tsOokFlee(e){if(e.flee)return;e.flee=true;e.stun=0;shakeScreen('m');sfx('crack');toast('大きな影が、巣穴のほうへにげていく','good')}
function tsOokUpd(e,dt){/* updEnemy から */e.hp=e.max;if(e.gone)return;if(e.stun>0){e.stun-=dt;return}
  const t=S.res.find(q=>q.name===TOTO),h=S.ts.hole;let gx,gy;if(e.flee){if(h==null){e.gone=1;return}gx=h%W+.5;gy=((h/W)|0)+.5}else{if(!t||e.met)return;gx=t.x;gy=t.y}
  const dx=gx-e.x,dy=gy-e.y,d=Math.hypot(dx,dy);if(!e.flee&&d<=TSOOKMEET){e.met=1;return}if(e.flee&&d<.6){e.gone=1;spawnFX(e.x-.5,e.y-.5,'#3a3028');return}
  const v=Math.min(d,D_TSOOK(e)*dt);e.x+=dx/d*v;e.y+=dy/d*v}/* 影なので、壁も家も、すりぬけて、まっすぐ（にげるときは速い） */
const D_TSOOK=e=>EN.tsuchi.sp*(e.flee?4:1);
function tsOokDraw(e,now){/* drawEnemy から（10階でしずむときは、うすれる tsOkuAlpha） */const al=typeof tsOkuAlpha==='function'?tsOkuAlpha(e,now):1;if(al<=0)return true;if(al>=1)return tsOokDraw0(e,now);ctx.save();ctx.globalAlpha*=al;tsOokDraw0(e,now);ctx.restore();return true}
function tsOokDraw0(e,now){/* 3Dから写したゆりかご（tsookage#0〜）。チップがないときは、コードのドットの仮の絵 */const px=e.x*TS,py=e.y*TS;shadow(ctx,px,py+6,30,8);
  const ch=window.CHIPS&&CHIPS.tsookage;if(ch&&drawChip(ctx,ch,'tsookage',px-TS/2,py-TS/2,now,e.id))return true;
  const sw=Math.round(Math.sin(now/700)*3),P=(col,a,b,w,h)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(px+a+sw*(b<-20?1:0)),Math.round(py+b),w,h)};
  P('#2a2420',-26,-8,52,10);P('#3a3028',-22,-18,44,12);P('#4a3e34',-18,-30,36,14);P('#2a2420',-30,-4,8,6);P('#2a2420',22,-4,8,6);P('#e8c890',-8,-24,4,3);P('#e8c890',4,-24,4,3);return true}
