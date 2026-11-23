'use strict';
/* ---------- クォータービューの、つながる物と屋根（PR4） ----------
   家の壁・ドア・窓・石の塀・柵・柵のドア・生垣を、マスごとに「まん中の柱＋となりへのびる腕」で組む（つなぎ方は iqMask：左1・右2・上4・下8）。
   家の屋根は、列ごとの切妻（棟は東西）。屋根をはずした家（roofAOf が .5 より小さい）は、手前の2つの壁（南・東）をひくい壁（巾木くらい）にする（iqFront）。
   絵がとどくまでは、コードの仮の絵（面の色だけの箱）。3Dから写した絵がとどいたら、チップ iso:<id>:<つなぎ方>（ひくい壁は ~low。ドアはつなぎ方のかわりに向き h・v、開いたコマは #1〜3。壁にかける物は iso:win:<id>:<h|v>）を、そのまま描く（iqChip）。
   描くのは地面の描き方（groundTf：せかいの点）のまま。高さ z は画面の点で、せかいの点を左上へ z/(2·IQB) ずらすと、その高さに見える。 */
const IQWALLH=IQL,IQLOWH=6;/* 家の壁の高さ（段差1だんと同じ）・屋根をはずしたときの手前の壁の高さ（巾木くらい） */
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
  const t=g==='w'?TS*.4:TS*.3,zt=b+(g==='w'?IQWALLH*.8:low?IQLOWH:IQWALLH);/* 家の壁・石の塀 */
  if(!door){iqArms(c,x,y,m,t,b,zt,col);if(g==='h'&&!low)iqWinDraw(c,i,!!(m&3)||!(m&12),t,lv);return}
  const fc=iqCols(IQC[[i-1,i+1,i-W,i+W].map(typeAt).find(k=>HOME_WALLS.has(k))]||'#c89a64'),X=x*TS,Y=y*TS,cx=X+TS/2,cy=Y+TS/2,h=t/2,jb=TS*.16;/* ドア：両わきの柱・上のかもい・とびら。わくは、となりの壁の色 */
  if(low){iqArms(c,x,y,dm,t,b,b+2,fc);return}/* 手前のドアは、しきいだけ */
  const zl=b+IQWALLH*.78;
  if(hz){iqPrism(c,X-.5,cy-h,X+jb,cy+h,b,zt,fc);if(n<2)iqPrism(c,X+jb,cy-h*.4,X+TS-jb,cy+h*.4,b,zl,col);iqPrism(c,X+TS-jb,cy-h,X+TS+.5,cy+h,b,zt,fc);iqPrism(c,X+jb,cy-h,X+TS-jb,cy+h,zl,zt,fc)}
  else{iqPrism(c,cx-h,Y-.5,cx+h,Y+jb,b,zt,fc);if(n<2)iqPrism(c,cx-h*.4,Y+jb,cx+h*.4,Y+TS-jb,b,zl,col);iqPrism(c,cx-h,Y+TS-jb,cx+h,Y+TS+.5,b,zt,fc);iqPrism(c,cx-h,Y+jb,cx+h,Y+TS-jb,zl,zt,fc)}}
/* ---- 屋根：家の列（x）ごとの切妻。棟は東西にのび、南北の2面が坂 ---- */
const IQROOFK=.6,IQROOFOV=TS*.22;/* 屋根の坂（南北に1マス進むと、画面で IQL×IQROOFK 上がる）・のき（壁から外へ出る長さ） */
function iqRoofCols(h){const top=new Map(),bot=new Map();for(const j of h.set){const x=j%W,y=(j/W)|0;if(!top.has(x)||top.get(x)>y)top.set(x,y);if(!bot.has(x)||bot.get(x)<y)bot.set(x,y)}return{top,bot}}
function iqRoofTone(h){const rc=S.roofCol&&S.roofCol[hKey(h)];const base=rc==='red'?'#b0584c':rc==='blue'?'#5a78a0':rc==='green'?'#6a9058':rc==='brown'?'#7a5238':WD===KAZAN?'#3d3f48':'#a86858';return{n:iqShade(base,1.06),s:iqShade(base,.94),l:iqShade(base,.72),e:iqShade(base,.82),r:iqShade(base,.66)}}
/* 1列ぶんの屋根（足もとの段 lv）。I：iqRoofCols、x：列 */
function iqRoofCol(c,h,I,x,A){const t0=I.top.get(x),b0=I.bot.get(x);if(t0==null)return;const lv=Math.max(0,hiAt(t0*W+x)),base=lv*IQL+IQWALLH,T=iqRoofTone(h),
    yN=t0*TS-IQROOFOV,yS=(b0+1)*TS+IQROOFOV,yr=(t0*TS+(b0+1)*TS)/2,zr=base+(yr-t0*TS)/TS*IQL*IQROOFK,ze=base-IQROOFOV/TS*IQL*IQROOFK,
    x0=x*TS-(I.top.has(x-1)?.5:IQROOFOV),x1=(x+1)*TS+(I.top.has(x+1)?.5:IQROOFOV);
  c.save();c.globalAlpha=A;
  const nx=I.top.has(x+1)&&I.top.get(x+1)===t0&&I.bot.get(x+1)===b0;
  if(!nx){iqPoly(c,[[x*TS+TS,t0*TS,base],[x*TS+TS,(b0+1)*TS,base],[x*TS+TS,yr,zr]],T.e)}/* 東の妻（となりの列と形がちがえば）。のきにかくれる所があるので、坂より先 */
  iqPoly(c,[[x0,yN,ze],[x1,yN,ze],[x1,yr,zr],[x0,yr,zr]],T.n);/* 北の坂 */
  iqPoly(c,[[x0,yr,zr],[x1,yr,zr],[x1,yS,ze],[x0,yS,ze]],T.s);/* 南の坂 */
  c.lineWidth=.6;c.strokeStyle=T.l;for(let k=1;k<6;k++){const f=k/6,yy=yr+(yS-yr)*f,zz=zr+(ze-zr)*f,s=iqS(zz);c.beginPath();c.moveTo(x0-s,yy-s);c.lineTo(x1-s,yy-s);c.stroke()}/* 瓦の列（仮） */
  if(!nx)iqPoly(c,[[x1,yr,zr],[x1,yS,ze],[x1,yS,ze-2],[x1,yr,zr-2]],T.l);/* 東のはしの、のきのあつみ */
  iqPoly(c,[[x0,yS,ze],[x1,yS,ze],[x1,yS,ze-2],[x0,yS,ze-2]],T.l);/* 南の、のきのあつみ */
  iqPoly(c,[[x0,yr-1.2,zr+.6],[x1,yr-1.2,zr+.6],[x1,yr+1.2,zr+.6],[x0,yr+1.2,zr+.6]],T.r);/* 棟がわら */
  c.restore()}
/* 家ごとに、列の屋根を足もとの順に足す（add は draw-world の D に足す関数）。屋根のすけぐあいは、いままでどおり roofAOf */
function iqRoofsAdd(add,x0,y0,x1,y1){for(const h of HOUSES){if(h.y1<y0-2||h.y0>y1+2||h.x1<x0-2||h.x0>x1+2)continue;const A=roofAOf(h);if(A<=0)continue;const I=iqRoofCols(h);for(const[x,b0]of I.bot)add(b0+1.001,3,null,()=>iqRoofCol(ctx,h,I,x,A),-1,false,x+b0+1.35)}}
