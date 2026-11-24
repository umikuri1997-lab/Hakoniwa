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
BL.anagura={name:'あなぐまの巣穴',solid:1,natural:1};
/* 地われの列（y ごと）：まん中の列からのずれ。はば3（ところどころ2） */
const tsRiftAt=y=>TSRIFTX+Math.round(3*Math.sin(y/9)+2*Math.sin(y/4.3+1));
function tsRift(s,R){const w2=new Set();for(let k=0;k<6;k++)w2.add((R()*H)|0);
  for(let y=0;y<H;y++){const br=y>=TSBRY-1&&y<=TSBRY+2,x0=tsRiftAt(br?TSBRY:y),wd=!br&&(w2.has(y)||w2.has(y-1))?2:3;/* 橋のまわり4行は、同じ列（橋が地われにぴったりかかる） */for(let a=0;a<wd;a++){const x=x0+a;if(x>=0&&x<W)s.ground[y*W+x]=1}}
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
  s.obj[best]='anagura';s.ts={hole:best};s.flags.calmNight=1}/* 神殿のあとも、夜のコワイノは、まだ来ない（PR3 で地われから来る） */
const tsOn=()=>!!S&&WD===TSUCHI&&!!S.ts;
/* ---- 絵（コードのドットの仮の絵） ---- */
function tsPx(c,col,x,y,w,h){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)}
function tsDrawObj(c,id,x,y,i,now){if(id!=='anagura')return;const ch=window.CHIPS&&CHIPS.anagura;if(ch&&drawChip(c,ch,id,x,y,now||performance.now(),i))return;
  /* がけのふもとの、まるい穴：まわりの岩・おくの暗さ・ほり出した土 */const P=(col,a,b,w,h)=>tsPx(c,col,x+a,y+b,w,h);
  P('#8a6a4e',3,8,26,20);P('#9c7a5a',5,6,22,4);P('#a98a68',8,4,16,3);
  P('#3a2a20',7,10,18,16);P('#2a1e16',9,9,14,2);P('#24180f',10,13,12,12);P('#1a120b',12,16,8,9);
  P('#b8946e',2,25,8,4);P('#c4a07a',22,26,8,3);P('#a88660',12,27,8,2)}
/* ---- 地われと岩の橋の絵：3Dで写したタイルセット（tools/art/tsuchi/rift3d.py）。地面の区画は、地われのマスも陸の地面に作り、その上にタイルを置く ----
   見える岩の壁は、北・西の陸の面だけなので、タイルは 北・西・北西 と、ふちにかかる 東・南 のマスの種類（p 地われ・l 陸・b 橋）でえらぶ。
   iso:rift:<北><西><北西><東><南>[-<西の橋の数><東の橋の数>]（北が橋のとき）・iso:riftb:<西の橋の数><東の橋の数><北><南>（橋の上の面） */
let TSRC=null;
function tsKind(x,y){if(x<0||x>=W)return 'l';y=Math.max(0,Math.min(H-1,y));/* マップの上・下のはしの外は、地われがつづく */const j=y*W+x;if(riftJ(j))return 'p';
  return y>=TSBRY&&y<TSBRY+2&&tsBrX().has(x)?'b':'l'}
function tsBrX(){/* 岩の橋のマスの列：橋の上の行の、もとの地われの列（はば3）。2行とも同じ列 */const x0=tsRiftAt(TSBRY);return new Set([x0,x0+1,x0+2])}
function tsRiftKey(x,y){const g=tsKind,t=g(x,y),lb=c=>c==='p'?'p':'l',bn=(a,b)=>{let iw=0,ie=0;while(iw<2&&g(a-iw-1,b)==='b')iw++;while(ie<2&&g(a+ie+1,b)==='b')ie++;return ''+iw+ie};
  if(t==='b'){const N=g(x,y-1),S2=g(x,y+1);return 'iso:riftb:'+bn(x,y)+(N==='b'?'b'+lb(S2):lb(N)+'b')}
  if(t!=='p')return null;const N=g(x,y-1),Wk=lb(g(x-1,y)),E=lb(g(x+1,y)),S2=lb(g(x,y+1));
  if(N==='b'){const n=bn(x,y-1);return 'iso:rift:b'+Wk+(n[0]!=='0'?'b':'l')+E+S2+'-'+n}
  return 'iso:rift:'+lb(N)+Wk+lb(g(x-1,y-1))+E+S2}
function tsRiftCells(){/* 地われと橋のマスと、そのタイルの名前（ステージをひらいたときに1回） */if(TSRC&&TSRC.s===S&&TSRC.L)return TSRC.L;TSRC={s:S};const L=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=tsRiftKey(x,y);if(k)L.push([x,y,k])}return TSRC.L=L}
function tsRiftDraw(x0,y0,x1,y1){/* 地面の区画のあと・物より先（draw-world.js）。画面に見えるマスだけ */if(WD!==TSUCHI||!S||!riftM())return;const L=tsRiftCells();
  icScreen(ctx,()=>{for(const[x,y,k]of L){if(x<x0||x>x1||y<y0||y>y1)continue;const t=icBlkImg(k);if(!t)continue;const[ch,im]=t,ix=(x-y)*IQW/2,iy=(x+y)*IQH/2;ctx.drawImage(im,ix-ch.ax/2,iy+IQH/2-ch.ay/2,ch.w/2,ch.h/2)}})}
/* ---- 巣穴をタップ ---- */
function tsTap(j){if(!tsOn()||S.obj[j]!=='anagura')return false;toast('あなぐまの巣穴。おくから、つめたい風がふいてくる');return true}
/* ---- はじまりの地ゆれ：カメラが巣穴へ → 地面がゆれる → トトがころがり出る → 会話 ---- */
let TSINTRO=null;
function tsIntro(next){const h=S.ts&&S.ts.hole,t=S.res.find(r=>r.name===TOTO);if(h==null||!t){next();return}
  const owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION,hx=h%W+.5,hy=((h/W)|0)+.5,ex=hx,ey=hy+3;
  t.x=hx;t.y=hy+.6;t.path=[];t.act=null;t.face=1;GIFT_ACTIVE=true;showUI(false);
  const fin=()=>{TSINTRO=null;GIFT_ACTIVE=false;showUI(true);if(ok())next()};
  camAnim=TSINTRO={fz:cam.z,tz:Math.max(cam.z,1.2),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:hx*TS,ty:(hy+1.5)*TS,t:0,dur:1.6,done:()=>{if(!ok())return fin();
    sfx('crack');shakeScreen('l');musicDuck(2400);
    setTimeout(()=>{if(!ok())return fin();shakeScreen('m');sfxAt('dust',hx,hy);spawnFX(hx-.5,hy-.2,'#b8946e');
      const t0=performance.now(),dur=1300,roll=()=>{if(!ok())return fin();const q=Math.min(1,(performance.now()-t0)/dur),e=1-(1-q)*(1-q);t.x=hx+(ex-hx)*e;t.y=hy+.6+(ey-hy-.6)*e;dirty=true;
        if(q<1){if(((q*6)|0)!==((q*6-.02)|0))JUMP.set(t,performance.now());requestAnimationFrame(roll);return}
        sfxAt('bonk',t.x,t.y);JUMP.set(t,performance.now());spawnFX(t.x-.5,t.y-.4,'#c4a07a');setTimeout(fin,500)};
      requestAnimationFrame(roll)},900)}}}
function tsIntroReset(){if(TSINTRO){if(camAnim===TSINTRO)camAnim=null;TSINTRO=null;GIFT_ACTIVE=false}}/* 村を切りかえたとき */
/* ---- 会話と目標 ---- */
MAINEL[TSUCHI]='earth';SECOND[TSUCHI]={elem:'wood',name:KONOHA,ok:()=>false};/* コノハは、お話の前半（つぎのPR）で来る */
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
   story:[[GOD,'#joy|ここが、おヌシとわしの居場所じゃ。'],[TOTO,'#surprise|わあ……！ ぴかぴかだ。'],[GOD,'この谷のヌシ様は、どこにおられるのかのう。'],[TOTO,'#think|ヌシ様？ ……大きなあなぐまのこと？ ずっと前に、いなくなっちゃったって。'],[TOTO,'#worry|みんな、ヌシ様はぼくらを見すてたって言ってる。……ぼくは、よく、おぼえてないけど。']],
   gives:{feat:['inv','remove','plant','craft','people','summon','shop'],recipes:['bed','crate','wbench'],items:{wbench:1,bed:1},mat:{wood:10,stone:10,sagan:10},run(){for(const k of['tree','bellf','salvia','lily','lotus','clover'])if(BL[k])S.unlocked[k]=true}}},/* 花のたね・木の苗は、カミサマのお店に出る。夜のコワイノは、まだ来ない */
];
