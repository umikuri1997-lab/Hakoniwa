'use strict';
/* ---------- クォータービューの、つながる物と屋根（PR4） ----------
   家の壁・ドア・窓・石の塀・柵・柵のドア・生垣を、マスごとに「まん中の柱＋となりへのびる腕」で組む（つなぎ方は iqMask：左1・右2・上4・下8）。
   家の屋根は、列ごとの切妻（棟は東西）。屋根をはずした家（roofAOf が .5 より小さい）は、手前の2つの壁（南・東）をひくい壁（巾木くらい）にする（iqFront）。
   絵がとどくまでは、コードの仮の絵（面の色だけの箱）。3Dから写した絵がとどいたら、チップ iso:<id>:<つなぎ方>（ひくい壁は ~low。ドアはつなぎ方のかわりに向き h・v、開いたコマは #1〜3。壁にかける物は iso:win:<id>:<h|v>）を、そのまま描く（iqChip）。
   描くのは地面の描き方（groundTf：せかいの点）のまま。高さ z は画面の点で、せかいの点を左上へ z/(2·IQB) ずらすと、その高さに見える。 */
const IQWALLH=IQL*2,IQLOWH=6;/* 家の壁の高さ（段差2だん。せいれいの1.6倍。持ち主がきめた）・屋根をはずしたときの手前の壁の高さ（巾木くらい） */
const IQC={/* 仮の絵の色（もとの色。上の面は明るく、東の面は暗く） */
  hwall:'#c89a64',bamboowall:'#b9c46a',canvaswall:'#efe6d2',acaciawall:'#b0703f',timberwall:'#e8dcc0',canalwall:'#bcb4a6',mosswall:'#8f9a78',moonwall:'#cfd6e6',logwall:'#a8743f',plasterwall:'#efe8da',brickwall:'#c0674a',yozorawall:'#522d1d',wall:'#a9a49a',
  fence:'#c69a62',misugaki:'#c7b27a',ropefence:'#d8c49a',ashifence:'#c8b478',rankan:'#c6c0b4',ibara:'#5f7a46',kuzure:'#a8a296',logfence:'#9a6a3c',bamboofence:'#a9b85e',parkfence:'#f4efe6',hedge:'#6fae4a',
  gate:'#c69a62',logdoor:'#9a6a3c',loggate:'#9a6a3c',parkdoor:'#f4efe6',parkgate:'#f4efe6',canalgate:'#c6c0b4',irongate:'#5a5d68',sdoor:'#8a5a34',stonegate:'#a9a49a',
  door:'#8a5a34',yozoradoor:'#3a2418',canvasdoor:'#e9dfc8',archdoor:'#9a6a3c',niwadoor:'#7a6a4a'};
/* つながる物のなかま：h 家の壁とドア・w 石の塀・f 柵と柵のドア・g 生垣 */
function iqGrp(id){if(!id)return null;if(id==='wall'||id==='sdoor'||id==='stonegate')return'w';if(HOME_WALLS.has(id)||HOME_DOORS.has(id))return'h';if(FENCE_IDS.has(id))return'f';if(id==='hedge')return'g';return null}
function iqMask(i,g){const x=i%W,y=(i/W)|0,q=k=>iqGrp(typeAt(k))===g;return(x>0&&q(i-1)?1:0)|(x<W-1&&q(i+1)?2:0)|(y>0&&q(i-W)?4:0)|(y<H-1&&q(i+W)?8:0)}
function iqShade(hex,k){const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'}
const IQCOLS=new Map();function iqCols(hex,k){k=k||1;const key=hex+k;let c=IQCOLS.get(key);if(!c){c=[iqShade(hex,1.12*k),iqShade(hex,k),iqShade(hex,.8*k)];IQCOLS.set(key,c)}return c}/* 上の面・南の面・東の面 */
const iqS=z=>z/(2*IQB);
function iqPoly(c,P,f){c.fillStyle=f;c.beginPath();for(let k=0;k<P.length;k++){const[x,y,z]=P[k],s=iqS(z);k?c.lineTo(x-s,y-s):c.moveTo(x-s,y-s)}c.closePath();c.fill()}
/* 箱（せかいの点の四角 X0〜X1・Y0〜Y1、高さ z0〜z1）。見える面は、南・東・上 */
function iqPrism(c,X0,Y0,X1,Y1,z0,z1,col){iqPoly(c,[[X0,Y1,z0],[X1,Y1,z0],[X1,Y1,z1],[X0,Y1,z1]],col[1]);iqPoly(c,[[X1,Y0,z0],[X1,Y1,z0],[X1,Y1,z1],[X1,Y0,z1]],col[2]);iqPoly(c,[[X0,Y0,z1],[X1,Y0,z1],[X1,Y1,z1],[X0,Y1,z1]],col[0])}
/* まん中の柱と腕（m のむき）。うしろの腕（上・左）→ 柱 → 手前の腕（右・下）の順。腕は、となりのマスに .5 だけかさねる（さかいに線を出さない） */
function iqArms(c,x,y,m,t,z0,z1,col,post){const X=x*TS,Y=y*TS,cx=X+TS/2,cy=Y+TS/2,h=t/2,e=.5,p=post||h;
  if(m&4)iqPrism(c,cx-h,Y-e,cx+h,cy-h,z0,z1,col);if(m&1)iqPrism(c,X-e,cy-h,cx-h,cy+h,z0,z1,col);
  iqPrism(c,cx-p,cy-p,cx+p,cy+p,z0,z1,col);
  if(m&2)iqPrism(c,cx+h,cy-h,X+TS+e,cy+h,z0,z1,col);if(m&8)iqPrism(c,cx-h,cy+h,cx+h,Y+TS+e,z0,z1,col)}
/* 屋根をはずした家の、手前（南・東）の壁のマス */
const IQFRONT=new WeakMap();
function iqFront(j){for(const h of HOUSES){if(!h.set.has(j)||roofAOf(h)>=.5)continue;let F=IQFRONT.get(h);if(!F){F=new Set();for(const k of h.set)if(!(h.inside.has(k+W)||h.inside.has(k+1)||h.inside.has(k+W+1)))F.add(k);IQFRONT.set(h,F)}if(F.has(j))return true}return false}
/* 3Dから写した絵があれば、それを描く（ax・ay：絵の中の、マスのまん中の地面の点。g64） */
function iqChip(c,key,i,lv){const ch=window.CHIPS&&CHIPS[key];if(!ch)return false;const src=ch.src||ch,im=chipImgs(src,key)[0];if(!im.ok)return false;const x=i%W,y=(i/W)|0,wx=(x+.5)*TS,wy=(y+.5)*TS;
  icScreen(c,()=>{const k=src.g===64?.5:1;c.drawImage(im,Math.round(isoX(wx,wy)-src.ax*k),Math.round(isoY(wx,wy)-lv*IQL-src.ay*k),src.w*k,src.h*k)});return true}
/* 壁にかけた物（窓・カーテン・絵・棚など）：南の面（横の壁）か東の面（たての壁）に */
function iqWinDraw(c,i,hz,t,lv){const v=S.win&&S.win[i];if(!v||iqChip(c,'iso:win:'+(v===1?'window':v)+':'+(hz?'h':'v'),i,lv))return;/* 窓は S.win が 1 */const x=i%W,y=(i/W)|0,X=x*TS,Y=y*TS,cx=X+TS/2,cy=Y+TS/2,b=lv*IQL,glass=v==='window'||/^curtain/.test(v),z0=b+(glass?IQWALLH*.35:IQWALLH*.4),z1=b+IQWALLH*.8,a=TS*(glass?.28:.2),col=glass?'#d6ecf4':v==='wreath'?'#5f9a4a':/^paint/.test(v)?'#e8c86a':'#9a6a3c';
  const P=hz?[[cx-a,cy+t/2+.2,z0],[cx+a,cy+t/2+.2,z0],[cx+a,cy+t/2+.2,z1],[cx-a,cy+t/2+.2,z1]]:[[cx+t/2+.2,cy-a,z0],[cx+t/2+.2,cy+a,z0],[cx+t/2+.2,cy+a,z1],[cx+t/2+.2,cy-a,z1]];iqPoly(c,P,col);
  if(/^curtain/.test(v)){const cc=v==='curtain2'?'#8fb86a':'#e8a0a0',w=a*.35;const Q=(u0,u1)=>hz?[[cx+u0,cy+t/2+.3,z0],[cx+u1,cy+t/2+.3,z0],[cx+u1,cy+t/2+.3,z1],[cx+u0,cy+t/2+.3,z1]]:[[cx+t/2+.3,cy+u0,z0],[cx+t/2+.3,cy+u1,z0],[cx+t/2+.3,cy+u1,z1],[cx+t/2+.3,cy+u0,z1]];iqPoly(c,Q(-a,-a+w),cc);iqPoly(c,Q(a-w,a),cc)}}
/* つながる物を1マス描く（o：そのマスの物、i：マス） */
/* ドア・門の向き：となりの壁・柵・塀（ドア・門でない物）だけで決める（ドアどうしはつながらない）。2マスの門はよこだけ */
function iqDoorHz(i,o,g){if(IQBIG.has(o))return true;const q=k=>{const t=typeAt(k);return iqGrp(t)===g&&!HOME_DOORS.has(t)&&!GATE_IDS.has(t)},x=i%W;return(x>0&&q(i-1))||(x<W-1&&q(i+1))||!(q(i-W)||q(i+W))}
const IQBIG=new Set(['stonegate','loggate','parkgate','canalgate','irongate']);
/* 柵のドアは、となりの柵・塀の戸の絵があれば、それ（ロープの手すりのとなりはロープの戸 など） */
function iqGateId(i,o,hz){if(o!=='gate')return o;for(const k of hz?[i-1,i+1]:[i-W,i+W]){const t=typeAt(k);if(t&&t!=='gate'&&window.CHIPS&&CHIPS['iso:'+t+'.gate:'+(hz?'h':'v')])return t+'.gate'}return o}
/* マスのさかいにも、くいが立つ柵（ロープの柵）：となりがドアのがわは、くいをぬいた絵（~d<がわ>）。ドアの柱と2本ならばないように */
const IQSTAKE=new Set(['ropefence']);
function iqNoStake(i,o,m){if(!IQSTAKE.has(o))return m;let d=0;for(const[b,k]of[[1,i-1],[2,i+1],[4,i-W],[8,i+W]])if(m&b&&GATE_IDS.has(typeAt(k)))d|=b;
  return d&&window.CHIPS&&CHIPS['iso:'+o+':'+m+'~d'+d]?m+'~d'+d:m}
function iqConnDraw(c,i,o,now){const g=iqGrp(o);if(!g)return;const x=i%W,y=(i/W)|0,lv=Math.max(0,hiAt(i)),b=lv*IQL,m=iqMask(i,g),low=g==='h'&&iqFront(i),door=HOME_DOORS.has(o)||GATE_IDS.has(o),hz=door?iqDoorHz(i,o,g):!!(m&3)||!(m&12),
    op=door?(hz?doorOp(i,x*TS,y*TS,.9,2.1):doorOp(i,x*TS,y*TS,2.1,.9)):0,n=Math.min(3,Math.round(op*3));
  if(iqChip(c,'iso:'+(door?iqGateId(i,o,hz):o)+':'+(door?(hz?'h':'v'):iqNoStake(i,o,m))+(low?'~low':'')+(door&&n&&!low?'#'+n:''),i,lv)){if(g==='h'&&!low&&(!door||hz&&S.win&&S.win[i]==='wreath'))door?iqChip(c,'iso:win:wreath:d'+(n?'#'+n:''),i,lv):iqWinDraw(c,i,hz,TS*.3,lv);return}/* ドアは向き（h よこ・v たて）と開いたコマ。壁の絵のときも、かけた物は上にかさねる。ドアのリースは、とびらの面に */
  const col=iqCols(IQC[o]||'#c89a64'),dm=door?(hz?3:12):m;/* ドアは、つながりのむきにまっすぐ */
  if(g==='g'){iqArms(c,x,y,m,TS*.74,b,b+22,col);return}/* 生垣：こんもりした葉のかたまり（仮） */
  if(g==='f'){const pc=iqCols(IQC[o]||'#c69a62',.88),X=x*TS,Y=y*TS,ph=18,pt=TS*.09;/* 柵：柱と、2本の横木 */
    if(door){const wide=S.obj[i+1]==='part'&&S.ref[i+1]===i,L=hz?[[X+2,Y+TS/2],[X+(wide?2:1)*TS-2,Y+TS/2]]:[[X+TS/2,Y+2],[X+TS/2,Y+TS-2]];for(const[px,py]of L)iqPrism(c,px-pt,py-pt,px+pt,py+pt,b,b+ph+3,pc);/* 柵のドア：両はしの柱と、とびら */
      if(n<2){const a=TS*.05;for(const zz of[5,13])hz?iqPrism(c,X+2+pt,Y+TS/2-a,X+(wide?2:1)*TS-2-pt,Y+TS/2+a,b+zz,b+zz+3,col):iqPrism(c,X+TS/2-a,Y+2+pt,X+TS/2+a,Y+TS-2-pt,b+zz,b+zz+3,col)}return}
    for(const zz of[6,13])iqArms(c,x,y,m,TS*.07,b+zz,b+zz+3,col,.01);iqPrism(c,X+TS/2-pt,Y+TS/2-pt,X+TS/2+pt,Y+TS/2+pt,b,b+ph,pc);return}
  const t=g==='w'?TS*.4:TS*.3,zt=b+(g==='w'?IQL*.8:low?IQLOWH:IQWALLH);/* 家の壁・石の塀 */
  if(!door){iqArms(c,x,y,m,t,b,zt,col);if(g==='h'&&!low)iqWinDraw(c,i,!!(m&3)||!(m&12),t,lv);return}
  const fc=iqCols(IQC[[i-1,i+1,i-W,i+W].map(typeAt).find(k=>HOME_WALLS.has(k))]||'#c89a64'),X=x*TS,Y=y*TS,cx=X+TS/2,cy=Y+TS/2,h=t/2,jb=TS*.16;/* ドア：両わきの柱・上のかもい・とびら。わくは、となりの壁の色 */
  if(low){iqArms(c,x,y,dm,t,b,b+2,fc);return}/* 手前のドアは、しきいだけ */
  const zl=b+IQWALLH*.7;
  if(hz){iqPrism(c,X-.5,cy-h,X+jb,cy+h,b,zt,fc);if(n<2)iqPrism(c,X+jb,cy-h*.4,X+TS-jb,cy+h*.4,b,zl,col);iqPrism(c,X+TS-jb,cy-h,X+TS+.5,cy+h,b,zt,fc);iqPrism(c,X+jb,cy-h,X+TS-jb,cy+h,zl,zt,fc)}
  else{iqPrism(c,cx-h,Y-.5,cx+h,Y+jb,b,zt,fc);if(n<2)iqPrism(c,cx-h*.4,Y+jb,cx+h*.4,Y+TS-jb,b,zl,col);iqPrism(c,cx-h,Y+TS-jb,cx+h,Y+TS+.5,b,zt,fc);iqPrism(c,cx-h,Y+jb,cx+h,Y+TS-jb,zl,zt,fc)}}
/* ---- 屋根：うでごとの切妻（持ち主がえらんだ） ----
   家の形（壁と中のマス）を、いちばん大きな長方形（うで）に分けて、うでごとに切妻をかける（iqRoofRects）。棟は、うでの長いほうの向き（正方形は東西）。
   勾配はどのうでも同じなので、L字・T字の入隅には谷ができる（屋根の面は、かさなるうでの屋根の、いちばん高い所）。
   屋根は壁の外の面（壁のマスのまん中から WT/2 外）にのせる。のき（棟とならぶふち）とけらば（妻のがわのふち）を IQROOFOV 出す。妻（三角の壁）は、その下の壁の絵。
   描き方：家ごとに、画面のドットごとに、カメラからの線が屋根の形に当たる所をさがして、色をきめた絵を作っておく（家の形・屋根の色・雪・壁の絵がそろったか がかわったら作りなおす）。
   絵は、当たった所のせかいの列（x）ごとに分け、列ごとに、その列のいちばん手前の行の順番で描く（となりの物とのかさなり）。
   雪（feel.js の FEELC.snow）は、屋根の坂の上の場所できめたかたまり・つもりきったら坂ぜんたいを白く。あらしの日のぬれた点（FEELC.wet）は、またたくので毎コマ描く。
   時間の色（daycolor.js の r）は、屋根の形にかけ算する。 */
const IQROOFK=.6,IQROOFOV=.22,IQROOFT=2,IQRWT=.15;/* 勾配（水平に1マスで、画面で IQL×IQROOFK 上がる）・のきとけらばの出（マス）・屋根のあつみ（ゲームの点）・壁のあつみの半分（壁の外の面は、壁のマスのまん中から .15。iso_conn.py の WT） */
const IQRS=2;/* 屋根の絵の細かさ（ゲームの1点を2×2。チップの g64 と同じ） */
const IQRROW=.2;/* 瓦の列のはば（坂の上の長さ、マス） */
function iqRoofTone(h){const rc=S.roofCol&&S.roofCol[hKey(h)];const base=rc==='red'?'#b0584c':rc==='blue'?'#5a78a0':rc==='green'?'#6a9058':rc==='brown'?'#7a5238':WD===KAZAN?'#3d3f48':'#a86858';return{base,n:iqShade(base,1.06),s:iqShade(base,.94),l:iqShade(base,.72),e:iqShade(base,.82),r:iqShade(base,.66)}}
/* 家の形の中の、いちばん大きな長方形（ほかの長方形の中に入らない物）ぜんぶ。[x0,y0,x1,y1]（マス、両はしをふくむ） */
function iqRoofRects(F,X0,Y0,X1,Y1){const w=X1-X0+1,hh=Y1-Y0+1,P=new Int32Array((w+1)*(hh+1));
  for(let y=0;y<hh;y++)for(let x=0;x<w;x++)P[(y+1)*(w+1)+x+1]=(F.has((Y0+y)*W+X0+x)?1:0)+P[y*(w+1)+x+1]+P[(y+1)*(w+1)+x]-P[y*(w+1)+x];
  const full=(a,b,c,d)=>P[(d+1)*(w+1)+c+1]-P[b*(w+1)+c+1]-P[(d+1)*(w+1)+a]+P[b*(w+1)+a]===(c-a+1)*(d-b+1),R=[];
  for(let b=0;b<hh;b++)for(let a=0;a<w;a++){if(!F.has((Y0+b)*W+X0+a))continue;for(let d=b;d<hh;d++){if(!full(a,b,a,d))break;for(let c=a;c<w;c++){if(!full(a,b,c,d))break;
    if(a>0&&full(a-1,b,c,d)||c<w-1&&full(a,b,c+1,d)||b>0&&full(a,b-1,c,d)||d<hh-1&&full(a,b,c,d+1))continue;R.push([a+X0,b+Y0,c+X0,d+Y0])}}}
  return R}
/* 壁の絵（壁の正面の絵：<id>:ext、なければ <id>:HLR の正面の行）を、ドットの色の表に（妻の壁にはる）。絵がとどくまでは null */
const IQWTEX=new Map();
function iqWallTex(id){let t=IQWTEX.get(id);if(t)return t.d?t:null;const C=window.CHIPS;if(!C)return null;const k=C[id+':ext']?id+':ext':C[id+':HLR']?id+':HLR':null;if(!k)return null;
  const ch=C[k],im=chipImgs(ch,k)[0];if(!im||!im.ok)return null;const s=ch.g===64?1:2,w=im.width*s,hh=im.height*s,cv=document.createElement('canvas');cv.width=w;cv.height=hh;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0,w,hh);
  t={w,h:hh,y0:k.endsWith(':ext')?0:18,d:g.getImageData(0,0,w,hh).data};cv.width=cv.height=0;IQWTEX.set(id,t);return t}
function iqVN(x,y){const X=Math.floor(x),Y=Math.floor(y),fx=x-X,fy=y-Y,a=hash(X*57+Y*131),b=hash((X+1)*57+Y*131),c=hash(X*57+(Y+1)*131),d=hash((X+1)*57+(Y+1)*131),sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy}/* なめらかなむら（0〜1） */
function iqHex(s){if(s[0]==='#'){const n=parseInt(s.slice(1),16);return[n>>16,n>>8&255,n&255]}const m=s.match(/\d+/g);return[+m[0],+m[1],+m[2]]}
/* 家の屋根の絵を作る（列ごと）。もどすのは {cols:[{x,b0,cv,x0,y0}], glint:[[列,x,y]]} */
const IQROOF=new Map();
function iqRoofBuild(h){
  const F=new Set([...h.set,...h.inside]),FX0=h.x0-1,FY0=h.y0-1,FW=h.x1-h.x0+3,FH=h.y1-h.y0+3,FG=new Uint8Array(FW*FH);for(const j of F)FG[((j/W|0)-FY0)*FW+j%W-FX0]=1;const inF=(cx,cy)=>{cx-=FX0;cy-=FY0;return cx>=0&&cy>=0&&cx<FW&&cy<FH&&FG[cy*FW+cx]===1};let lv=0;for(const j of h.set)lv=Math.max(lv,hiAt(j));const base=lv*IQL+IQWALLH,KZ=IQL*IQROOFK,OV=IQROOFOV;
  const R=iqRoofRects(F,h.x0,h.y0,h.x1,h.y1).map(([a,b,c,d])=>{const X0=a+.5-IQRWT,X1=c+.5+IQRWT,Y0=b+.5-IQRWT,Y1=d+.5+IQRWT,ew=X1-X0>=Y1-Y0;return{X0,X1,Y0,Y1,ew,m:ew?(Y0+Y1)/2:(X0+X1)/2,D:ew?(Y1-Y0)/2:(X1-X0)/2}});
  if(!R.length)return null;
  const inFoot=(x,y)=>{const cx=Math.floor(x),cy=Math.floor(y);if(!inF(cx,cy))return false;const fx=x-cx,fy=y-cy;
    if(fx<.5-IQRWT&&!inF(cx-1,cy)||fx>.5+IQRWT&&!inF(cx+1,cy)||fy<.5-IQRWT&&!inF(cx,cy-1)||fy>.5+IQRWT&&!inF(cx,cy+1))return false;
    return true};
  const tops=(x,y,o)=>{let b=-1e9,bi=-1,b2=-1e9,bj=-1;for(let i=0;i<R.length;i++){const r=R[i];if(x<r.X0-OV||x>r.X1+OV||y<r.Y0-OV||y>r.Y1+OV)continue;const d=r.D-Math.abs((r.ew?y:x)-r.m),z=base+d*KZ;if(z>b){b2=b;bj=bi;b=z;bi=i}else if(z>b2){b2=z;bj=i}}o.t=b;o.i=bi;o.t2=b2;o.j=bj;return o};
  const O={t:0,i:0,t2:0,j:-1},solid=(x,y,z)=>{tops(x,y,O);if(O.i<0||z>O.t)return false;return inFoot(x,y)?z>=base-.01:z>=O.t-IQROOFT};
  /* 画面のはんい（ゲームの点）：うでのかどの、のきの高さと棟の高さ */
  let zmax=base,zmin=base-OV*KZ-IQROOFT-1,ix0=1e9,ix1=-1e9,iy0=1e9,iy1=-1e9;for(const r of R)zmax=Math.max(zmax,base+r.D*KZ+1);
  for(const r of R)for(const x of[r.X0-OV,r.X1+OV])for(const y of[r.Y0-OV,r.Y1+OV]){const ix=(x-y)*32,iy=(x+y)*24;ix0=Math.min(ix0,ix);ix1=Math.max(ix1,ix);iy0=Math.min(iy0,iy-zmax);iy1=Math.max(iy1,iy-zmin)}
  ix0=Math.floor(ix0)-1;iy0=Math.floor(iy0)-1;ix1=Math.ceil(ix1)+1;iy1=Math.ceil(iy1)+1;
  const near=(u,v)=>{const s0=zmin/48,s1=zmax/48;for(const r of R)if(u+s1>=r.X0-OV&&u+s0<=r.X1+OV&&v+s1>=r.Y0-OV&&v+s0<=r.Y1+OV)return true;return false};/* その点の線が、どのうでのはんいにも入らなければ、さがさない */
  const BW=(ix1-ix0)*IQRS,BH=(iy1-iy0)*IQRS,T=iqRoofTone(h),C={n:iqHex(T.n),s:iqHex(T.s),e:iqHex(T.e),w:iqHex(iqShade(T.base,1)),l:iqHex(T.l),r:iqHex(T.r)};
  const snow=FEELC.snow||0,sfull=snow>SNOWFULL0?Math.min(1,(snow-SNOWFULL0)/(1-SNOWFULL0)):0,sd=h.x0*7+h.y0*13;
  const px=new Uint8ClampedArray(BW*BH*4),colOf=new Int16Array(BW*BH).fill(-1),glint=[];
  const wallId=(x,y)=>{const cx=Math.floor(x),cy=Math.floor(y);for(const q of[cy*W+cx,cy*W+cx-1,cy*W+cx+1,(cy-1)*W+cx,(cy+1)*W+cx]){const o=typeAt(q);if(HOME_WALLS.has(o))return o}return'hwall'};
  /* カメラからの線（地面の点 u,v から、高さ z で u+z/48・v+z/48）と、屋根の形の面が当たる所を、式でもとめる：うでの坂（2面）・のきとけらばのあつみ（南・東の面）・妻の壁（家の形の東・南のふち）。
     当たった所が、ほんとうに形の表面か（すぐ内がわが形の中）をたしかめ、いちばんカメラに近い（高い）所をとる */
  const XE=new Set(),YS=new Set();for(const j of F){const x=j%W,y=(j/W)|0;if(!F.has(j+1))XE.add(x+.5+IQRWT);if(!F.has(j+W))YS.add(y+.5+IQRWT)}for(const r of R){XE.add(r.X1);YS.add(r.Y1)}
  const iqRayHit=(u,v)=>{let best=null;const tryS=(sv,ox,oy,oz)=>{if(best!=null&&sv*48<=best)return;const x=u+sv,y=v+sv,z=sv*48;if(z<zmin||z>zmax)return;if(solid(x+ox,y+oy,z+oz)&&!solid(x-ox,y-oy,z-oz))best=z};
    for(const r of R){const A0=r.ew?v:u;
      tryS((base+KZ*(r.D-r.m+A0))/(48-KZ),0,0,-.02);tryS((base+KZ*(r.D+r.m-A0))/(48+KZ),0,0,-.02);/* 坂（棟の手前と向こう） */
      tryS(r.Y1+OV-v,0,-.002,0);tryS(r.X1+OV-u,-.002,0,0)}/* のき・けらばのあつみ（南・東を向く面） */
    for(const X of XE)tryS(X-u,-.002,0,0);for(const Y of YS)tryS(Y-v,0,-.002,0);/* 妻の壁 */
    return best};
  for(let py=0;py<BH;py++)for(let pxx=0;pxx<BW;pxx++){
    const ix=ix0+(pxx+.5)/IQRS,iy=iy0+(py+.5)/IQRS,u=(ix/32+iy/24)/2,v=(iy/24-ix/32)/2;
    if(!near(u,v))continue;const z=iqRayHit(u,v);if(z==null)continue;
    const s=z/48,x=u+s,y=v+s;tops(x,y,O);const r=R[O.i];let c;
    if(z>=O.t-.6){/* 屋根の坂 */const d=r.D-Math.abs((r.ew?y:x)-r.m),de=d+OV,al=r.ew?x:y;
      c=r.ew?(y>r.m?C.s:C.n):(x>r.m?C.e:C.w);
      if(d>r.D-.05)c=C.r;/* 棟がわら */else if(O.t-O.t2<.7&&O.j>=0&&(R[O.j].ew!==r.ew||R[O.j].m!==r.m))c=C.l;/* 谷（2つのうでの屋根が出会う線） */else if((de/IQRROW)%1<.14)c=C.l;/* 瓦の列 */
      if(snow>0&&c!==C.l){const n=iqVN(al*2.4+sd,de*4.5+O.i*3.1);if(sfull>0||n<snow*1.2){const k=Math.max(sfull*.95,n<snow*1.2?.92:0),/* 雪：坂の上の場所できめた、ふんわりしたかたまり（つもるほど広がる）・つもりきったら坂ぜんたい */sn=r.ew?(y>r.m?[255,255,255]:[238,244,251]):(x>r.m?[228,236,247]:[243,248,255]);c=[c[0]+(sn[0]-c[0])*k,c[1]+(sn[1]-c[1])*k,c[2]+(sn[2]-c[2])*k]}}
      if(hash(pxx*7+py*13+sd)<.0016)glint.push([Math.min(h.x1,Math.max(h.x0,Math.floor(x))),pxx,py])}
    else if(inFoot(x,y)){/* 妻の壁（三角の壁）：その下の壁の絵 */const east=!inFoot(x+.03,y),tx=iqWallTex(wallId(x-(east?.2:0),y-(east?0:.2))),k=east?.8:.97,zt=(z-lv*IQL)/IQL;
      if(tx){const row=tx.y0+16+Math.floor((zt%.5)*64),col=((Math.floor((east?y:x)*64)%tx.w)+tx.w)%tx.w,q=(Math.min(tx.h-1,row)*tx.w+col)*4;c=[tx.d[q]*k,tx.d[q+1]*k,tx.d[q+2]*k]}
      else c=iqHex(iqShade(IQC[wallId(x,y)]||'#c89a64',k))}
    else c=C.l;/* のき・けらばの、屋根のあつみ */
    const q=(py*BW+pxx)*4;px[q]=c[0];px[q+1]=c[1];px[q+2]=c[2];px[q+3]=255;colOf[py*BW+pxx]=Math.min(h.x1,Math.max(h.x0,Math.floor(x)))}
  /* 列ごとの絵 */
  const cols=[];for(let cx=h.x0;cx<=h.x1;cx++){let a0=1e9,a1=-1,b0_=1e9,b1=-1;for(let p=0;p<BW*BH;p++)if(colOf[p]===cx){const X=p%BW,Y=(p/BW)|0;if(X<a0)a0=X;if(X>a1)a1=X;if(Y<b0_)b0_=Y;if(Y>b1)b1=Y}
    if(a1<0)continue;const cw=a1-a0+1,chh=b1-b0_+1,cv=document.createElement('canvas');cv.width=cw;cv.height=chh;const g=cv.getContext('2d'),id=g.createImageData(cw,chh);
    for(let Y=0;Y<chh;Y++)for(let X=0;X<cw;X++){const p=(Y+b0_)*BW+X+a0;if(colOf[p]!==cx)continue;const s4=p*4,d4=(Y*cw+X)*4;id.data[d4]=px[s4];id.data[d4+1]=px[s4+1];id.data[d4+2]=px[s4+2];id.data[d4+3]=255}
    g.putImageData(id,0,0);let rb=-1;for(const j of F)if(j%W===cx)rb=Math.max(rb,(j/W)|0);cols.push({x:cx,b0:rb,cv,x0:ix0+a0/IQRS,y0:iy0+b0_/IQRS,a0,b0p:b0_,tint:null,tk:''})}
  return{cols,glint:glint.map(([cx,X,Y])=>[cx,ix0+X/IQRS,iy0+Y/IQRS])}}
/* 屋根の絵（作りなおしが要るときだけ作る） */
function iqRoofOf(h,now){if(!h._rk){h._rw=[...h.set].map(typeAt).filter((v,i,a)=>a.indexOf(v)===i);h._rk=[...h.set,...h.inside].sort((a,b)=>a-b).join(',')+'|'+[...h.set].reduce((m,j)=>Math.max(m,hiAt(j)),0)}/* 家の形（HOUSES を作りなおすまで同じ） */
  let tx='';for(const id of h._rw)tx+=iqWallTex(id)?1:0;const key=h._rk+'|'+(S.roofCol&&S.roofCol[hKey(h)]||'')+'|'+WD+'|'+Math.round((FEELC.snow||0)*20)+'|'+tx;
  let v=IQROOF.get(hKey(h));if(v&&v.key===key)return v.r;if(!now&&IQRBF===IQRF)return v?v.r:null;/* 1コマに作りなおすのは1けんだけ（1けん約0.1秒）。それまでは前の絵 */
  IQRBF=IQRF;if(v)for(const c of v.r?v.r.cols:[]){c.cv.width=c.cv.height=0;if(c.tint)c.tint.width=c.tint.height=0}const r=iqRoofBuild(h);IQROOF.set(hKey(h),{key,r});return r}
let IQRF=0,IQRBF=-1;/* 描いたコマの番号・さいごに屋根を作ったコマ */
/* 1列ぶんの屋根を描く（時間の色・ぬれた点も） */
function iqRoofColDraw(c,h,col,G,A,now){const k=dpr*cam.z,O=isoOff(k);c.save();c.setTransform(k/IQRS,0,0,k/IQRS,O[0]+k*col.x0,O[1]+k*col.y0);c.imageSmoothingEnabled=false;c.globalAlpha=A;
  const r=c===ctx&&dcLayer('r');let im=col.cv;if(r){if(col.tk!==r){if(!col.tint){col.tint=document.createElement('canvas')}const t=col.tint;t.width=col.cv.width;t.height=col.cv.height;const g=t.getContext('2d');g.drawImage(col.cv,0,0);g.globalCompositeOperation='multiply';g.fillStyle=r;g.fillRect(0,0,t.width,t.height);g.globalCompositeOperation='destination-in';g.drawImage(col.cv,0,0);col.tk=r}im=col.tint}/* 屋根の時間の色（daycolor.js の r）：屋根の形にかけ算 */
  c.drawImage(im,0,0);
  if(FEELC.wet){c.fillStyle='#eef6ff';let n=0;for(const[cx,gx,gy]of G){if(cx!==col.x)continue;n++;const tw=.35+.25*Math.sin(now/420+h.x0+n*1.7);c.globalAlpha=A*Math.max(0,tw);c.fillRect(Math.round((gx-col.x0)*IQRS),Math.round((gy-col.y0)*IQRS),3+(n%3),2)}}/* あらしの日：ぬれて光る点が、ゆっくりまたたく */
  c.restore()}
/* 家ぜんぶの屋根を、いま描く（テスト） */
function iqRoofDraw(c,h,A){const R=iqRoofOf(h,true);if(!R)return;for(const col of R.cols)iqRoofColDraw(c,h,col,R.glint,A,performance.now())}
/* 家ごとに、列の屋根を足もとの順に足す（add は draw-world の D に足す関数）。屋根のすけぐあいは、いままでどおり roofAOf */
function iqRoofsAdd(add,x0,y0,x1,y1){IQRF++;for(const h of HOUSES){if(h.y1<y0-2||h.y0>y1+2||h.x1<x0-2||h.x0>x1+2)continue;const A=roofAOf(h);if(A<=0)continue;const R=iqRoofOf(h);if(!R)continue;for(const col of R.cols)add(col.b0+1.001,3,null,()=>iqRoofColDraw(ctx,h,col,R.glint,A,performance.now()),-1,false,col.x+col.b0+1.35)}}
/* 夜の窓のあかり：灯りのある家の、外を向いた窓（よこの壁は南の面・たての壁は東の面）を、夜の暗さの上に描く（iso:win:window:lit）。
   こさは、家ごとにともる・消える（feelWin）×時刻（DAYC の win）。手前の背の高い物の絵にかさなる窓は描かない（暗さの上なので、かくれずに出てしまう） */
function iqWinRect(key,i,lv){const ch=CHIPS[key];if(!ch)return null;const k=ch.g===64?.5:1,wx=(i%W+.5)*TS,wy=(((i/W)|0)+.5)*TS,l=isoX(wx,wy)-ch.ax*k,t=isoY(wx,wy)-lv*IQL-ch.ay*k;return[l,t,l+ch.w*k,t+ch.h*k]}
function iqWinHid(q,R){const x=q%W,y=(q/W)|0;for(let dy=-3;dy<=4;dy++)for(let dx=-3;dx<=4;dx++){if(dx+dy<1)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;
  const a=anc(Y*W+X),o=S.obj[a];if(!o||FLAT.has(o)||iqGrp(o)||!BL[o])continue;const c0=window.CHIPS&&CHIPS[o],ch=c0&&(c0.src||c0);if(!ch||!ch.iso)continue;/* クォータービューの絵（iso:1）だけ。足もとの点から ax・ay ずらして描く */
  const A=objFootJ(a);if(A.x+A.w/2+A.y+A.h/2<=x+y+1)continue;/* 窓よりおくの物 */const P=isoChipAt(ctx,a,0,0,o);if(!P)continue;const k=ch.g===64?.5:1,l=P.x+ch.ax*k,t=P.y+ch.ay*k;
  if(l<R[2]&&l+ch.w*k>R[0]&&t<R[3]&&t+ch.h*k>R[1])return true}return false}
function iqWinLit(c,litH){const a0=dcNow().win;if(!(a0>0)||!window.CHIPS||!CHIPS['iso:win:window:lit:h']||!S.win)return;
  for(const h of litH){const wa=feelWin(h);if(wa<=0)continue;c.globalAlpha=Math.min(1,wa*a0);
    for(const q of h.set){if(S.win[q]!==1)continue;const o=typeAt(q);if(iqGrp(o)!=='h'||HOME_DOORS.has(o)||iqFront(q))continue;
      const m=iqMask(q,'h'),hz=!!(m&3)||!(m&12);if(h.inside.has(hz?q+W:q+1))continue;/* 家の中を向いた窓（北・西の壁）は、屋根の下 */
      if(!isoCellVis(q%W,(q/W)|0,TS*2))continue;const key='iso:win:window:lit:'+(hz?'h':'v'),lv=Math.max(0,hiAt(q)),R=iqWinRect(key,q,lv);if(!R||iqWinHid(q,R))continue;iqChip(c,key,q,lv)}}
  c.globalAlpha=1}
