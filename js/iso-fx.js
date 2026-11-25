'use strict';
/* ---------- クォータービューの、エフェクト・夜・霧・地面の物（PR7） ----------
   描き方は2つだけ：
   1. 地面にはりつく物（水たまり・かげ・わく・霧・家のあかりの地面）：せかいの点のまま、地面の描き方（groundTf）。
      高い段の物は、段の高さだけ左上へずらす（isoGroundLv。せかいの点の y から liftOf をひかない）。
   2. 立っている物・うかぶ物（粒・輪・エフェクトの絵・落とし物・ふきだし・あかりの光）：足もとの点をきめて、
      そのまわりは、いままでの絵のまま立てて描く（standTf）。足もとは、
      - 物・マス：objFoot（マスのまん中と手前の角のあいだ。高さは段のぶん上）
      - 粒・エフェクト（fx）：うまれたときの地面の点（fx の gx・gy。なければ、うまれた点そのもの）。
        うまれた点が頭の上など、地面より上のときは、gy に地面の y を書く（fxSpr の6つめ）。
        gy を書くときは、y から段の高さ（liftOf）をひく。gy を書かないときは、ひかない（うまれた点が、その段の地面の点になる）。
        物についたエフェクト（収穫・こわれる粒）は、その物の足もと（fx の A に objFootJ。y から段の高さをひく）。 */
const IQRING=IQH/IQW*IQSX/IQSY;/* 地面の輪（たて:よこ）：ひし形の地面の円（3:4）を、立てる描き方で見たときの比 */
const IQFOGH=1.5,IQFOGN=8;/* 霧のあつみ（段の数）と、かさねる枚数 */
/* マス j の段（0 より下は 0） */
function isoLv(j){return j>=0&&j<W*H?Math.max(0,hiAt(j)):0}
/* 地面の描き方を、段 lv の高さに */
function isoGroundLv(c,lv){groundTf(c,dpr*cam.z);if(lv)c.translate(-lv*IQD,-lv*IQD)}
/* 地面の物を描くとき、せかいの点の y からひく高さ（クォータービューは0。段は isoGroundLv でつける） */
/* 足もと A で立てて描く（おわったら、もとの描き方にもどす） */
function isoStand(c,A,f){c.save();standTf(c,dpr*cam.z,A.fx,A.fy,A.px,A.py);try{f()}finally{c.restore()}}
/* マス j に立つ物（1マス）の足もと */
function cellFoot(j){return objFoot(j%W,(j/W)|0,1,1,j)}
/* マス j の物として、そのマスの足もとに立てて描く */
function isoCell(c,j,f){isoStand(c,cellFoot(j),f)}
/* せかいの地面の点 (gx,gy)（段の高さをひいていない点）を足もとにする */
function gFoot(gx,gy){if(caveOn())return cvqPt(gx,gy);/* 洞窟（iso-cave.js） */const j=clamp(Math.floor(gy/TS),0,H-1)*W+clamp(Math.floor(gx/TS),0,W-1),lv=isoLv(j);return{fx:gx,fy:gy-liftOf(j),px:isoX(gx,gy),py:isoY(gx,gy)-lv*IQL}}
/* 地面の点 (gx,gy) そのものを足もとにする（段の高さをひいていない y で描く絵。高い段の上でも、その段の地面に立つ） */
function gFoot0(gx,gy){const A=gFoot(gx,gy);A.fy=gy;return A}
/* 粒・エフェクトの足もと（うまれたときにきめて、うごいても、かえない） */
function fxFoot(f){if(f.A)return f.A;if(f.gy!=null)return f.A=gFoot(f.gx!=null?f.gx:f.x,f.gy);return f.A=gFoot0(f.gx!=null?f.gx:f.x,f.y)}
function fxStandTf(c,k,f){const A=fxFoot(f);standTf(c,k,A.fx,A.fy,A.px,A.py)}
/* 画面の点（ゲームの点）：地面の点 (gx,gy) の、高さ h（せかいの点。上がマイナス）の所 */
function isoSP(gx,gy,h){const A=gFoot(gx,gy);return{x:A.px,y:A.py+(h||0)*IQSY}}
/* 霧：地面の霧の絵を、IQFOGH だんの高さまで、かさねて描く（霧にあつみがある。うしろのマスは、霧の上の面にかくれる） */
function isoFogDraw(c,draw){for(let n=0;n<IQFOGN;n++){isoGroundLv(c,IQFOGH*n/(IQFOGN-1));draw()}groundTf(c,dpr*cam.z)}
/* 霧の上に出す手がかりの、足もと（霧の上の面の高さ） */
function fogTopFoot(gx,gy){const A=gFoot(gx,gy);A.py-=IQFOGH*IQL;return A}
/* 画面の左上の、地図の上の場所（CSS の px。雨・霧の夜の絵・雲のかげを、地図といっしょに動かすとき） */
function camScr(){const cx=camCX(),cy=camCY();return[(isoX(cx,cy)-VW/cam.z/2)*cam.z,(isoY(cx,cy)-VH/cam.z/2)*cam.z]}
/* ほった穴（地面より下、クォータービュー）：ひし形の口の中に、おくの2つのかべ（北・西。こちらを向く）と、深さのぶん下がった底。
   底は、そのマスの地面の絵を下へずらして、深いほど暗く。c は地面の描き方で来る（画面の向きにして、もどす） */
function isoPits(c,x0,y0,x1,y1){if(!S.hi)return;c.save();isoScreenTf(c);
  for(let y=Math.max(0,y0);y<=Math.min(H-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(W-1,x1);x++){const j=y*W+x,h=S.hi[j]|0;if(h>=0||S.ground[j])continue;
    const ix=(x-y)*IQW/2,iy=(x+y)*IQH/2,d=-h*IQL,dep=(a,b)=>a<0||b<0||a>=W||b>=H?0:Math.min(0,hiAt(b*W+a));
    c.save();c.beginPath();c.moveTo(ix,iy);c.lineTo(ix+IQW/2,iy+IQH/2);c.lineTo(ix,iy+IQH);c.lineTo(ix-IQW/2,iy+IQH/2);c.closePath();c.clip();/* 穴の口 */
    igTile(c,x,y,ix,iy+d);c.fillStyle='rgba(34,24,16,'+(.16*-h)+')';c.fillRect(ix-IQW/2,iy,IQW,IQH+d);/* 底：深いほど暗い */
    const wl=(ax,ay,bx,by,z,col)=>{const zd=(z-h)*IQL;if(zd<=0)return;c.fillStyle=col;c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.lineTo(bx,by+zd);c.lineTo(ax,ay+zd);c.closePath();c.fill()};
    wl(ix,iy,ix+IQW/2,iy+IQH/2,dep(x,y-1),'#7d766c');/* 北のかべ（右上の辺） */wl(ix-IQW/2,iy+IQH/2,ix,iy,dep(x-1,y),'#8f877c');/* 西のかべ（左上の辺） */
    c.restore()}
  c.restore()}
/* 夜のあかり（クォータービュー）：物のまわりの地面を、半径 R（せかいの点）の円で明るくする。円は、ひし形の地面にそった横長の形になる */
function isoLitPool(c,j,R,R0){const A=objFootJ(j),a=anc(j);isoGroundLv(c,isoLv(a));c.drawImage(lightSpr(R0),(A.x+A.w/2)*TS-R,(A.y+A.h/2)*TS-R,R*2,R*2)}
/* 字・数・ゲージなど（のばすと、ドットの字がゆがむ物）：足もと A で立てたときの点 (wx,wy) の所に、のばさずに描く（ゲームの点の大きさ） */
function isoUITf(c,A,wx,wy){const k=dpr*cam.z,O=isoOff(k),px=A.px+(wx-A.fx)*IQSX,py=A.py+(wy-A.fy)*IQSY;c.setTransform(k,0,0,k,O[0]+k*(px-wx),O[1]+k*(py-wy))}
/* 場面の光などを、足もとの点 (wx,wy)（地面の点）で立てる。save しないので、ループの中で毎回よび、おわったら isoBack でもどす */
function isoAt(c,wx,wy){const A=gFoot(wx,wy);standTf(c,dpr*cam.z,A.fx,A.fy,A.px,A.py)}
function isoAtA(c,A){if(A)standTf(c,dpr*cam.z,A.fx,A.fy,A.px,A.py)}
function isoBack(c){groundTf(c,dpr*cam.z)}
/* ひものかざり（イベントの旗・花・ちょうちん ev-show.js、大会の旗 cup.js）：3Dから写したチップ（tools/art/furn3d/items/garl.py）を、会場のおくの行 ty の北のふちにならべる。
   くい（garlk＝マスの西のはし・garlk#1＝東のはし）を、マス tx0 の西と tx1 の東に立て、そのあいだに、1マスぶんのひもの部品（旗 garl・赤白 garl#1・ちょうちん garl#2・花 garl#3）を、マスごとにならべる。
   ひもの部品は2コマでゆれる（マスごとに、ずらして） */
const GARCHIP={rw:'garl#1',lamp:'garl#2',flower:'garl#3',flag:'garl'},GARMS=400,GARPH=400;
/* チップ（g64・クォータービュー）を、マス (tx,ty) の足もとに立てて描く。t：コマの時間（ミリ秒。1コマのチップは使わない） */
function isoChipTile(c,id,tx,ty,t){if(ICON)return;const ch=chipOf(id);if(!ch)return;const src=ch.src||ch,ims=chipImgs(src,id),n=ims.length,im=ims[n>1?Math.floor(t/GARMS)%n:0];if(!im.ok){if(chipPend(src))CHPN++;return}
  const A=gFoot((tx+.5)*TS,(ty+.5)*TS),sm=c.imageSmoothingEnabled;c.save();isoScreenTf(c);c.imageSmoothingEnabled=false;c.drawImage(im,A.px+src.ax/2,A.py+src.ay/2,src.w/2,src.h/2);c.imageSmoothingEnabled=sm;c.restore()}
function isoGarland(c,tx0,tx1,ty,kind,now){const id=GARCHIP[kind]||GARCHIP.flag;isoChipTile(c,'garlk',tx0,ty,now);for(let x=tx0;x<=tx1;x++)isoChipTile(c,id,x,ty,now+(x-tx0)*GARPH);isoChipTile(c,'garlk#1',tx1,ty,now)}
/* 御神木の場面の光：切り株（4×4）を足もとに */
function treeFoot(){const j=S&&S.sacredRoot;if(j==null)return null;const n=typeof sacredSpan==='function'?sacredSpan():4;return objFoot(j%W,(j/W)|0,n,n,j)}
/* 字・ふだ（のばさない）：地面の点 (gx,gy) から立てた所の (wx,wy) に */
function isoUIAt(c,gx,gy,wx,wy){isoUITf(c,gFoot(gx,gy),wx,wy)}
/* 落ち影（いままでの見え方で写した、地面の上の影の絵）を、クォータービューの地面に描く。
   影の根もと（マスの (x+.5, y+.8)）が、立てた物の足もと（objFoot の画面の点）にくるように、地面の上でずらす。f は、いままでの点で描く */
function isoCastAt(c,i,f){const a=anc(i),A=objFootJ(i),lv=isoLv(a),G=isoInv(A.px,A.py+lv*IQL),x=a%W,y=(a/W)|0;isoGroundLv(c,lv);c.translate(G.x-(x+.5)*TS,G.y-(y+.8)*TS);f()}
