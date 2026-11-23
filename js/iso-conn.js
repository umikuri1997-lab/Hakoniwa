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
/* ---- 屋根：うでごとの切妻（持ち主がえらんだ）を、屋根のタイルセットで（持ち主がえらんだ） ----
   家の形（壁と中のマス）を、いちばん大きな長方形（うで）に分けて、うでごとに切妻。棟は、うでの長いほうの向き（正方形は東西）。
   かさなる2つのうでが同じ向きなら、小さいほうを直角に（クロスゲーブル）。低いほう（同じ高さなら小さいほう）のうでは、高いうでの棟の所で止める。
   絵は、3Dで組んで写した、マスごとの完成したチップ（tools/art/iso/iso_roof.py：坂・棟・のき・けらば・谷・妻の壁・雪。屋根の色ごと）を、
   マスごとにえらんで、棟までのきょりの高さだけ上にずらして置くだけ（かさねる計算・色の計算はしない。持ち主がきめた）。
   2つのうでがかさなって両方が見えるマス（谷・棟がぶつかる所）は、谷のチップ。ない組み合わせ（大きな家・ほかの形）は、2つの部品を低いほうから置く。
   妻は、うでのはし（東・南。西・北はカメラから見えない）に、その下の壁と同じ絵の板（iso:<壁>:gab-…）：高さ K/2 の四角（blk）をつんでから、三角の部品。
   マスの部品の決め方は iso_roof.py の cells・pick と同じ（かえるときは両方）。
   置いた絵は、家ごと・せかいの列（x）ごとに1まいの絵にまとめておき（家の形・屋根の色・雪・チップの読みこみがかわったら作りなおす。1コマに1けん）、
   列ごとに、その列のいちばん手前の行の順番で描く（となりの物とのかさなり）。時間の色（daycolor.js の r）は、その絵の形にかけ算する。
   あらしの日のぬれた点（FEELC.wet）は、またたくので毎コマ描く。 */
const IQROOFK=.5,IQROVR=.37,IQREXT=.45;/* 勾配（水平に1マスで .5 だん）・のきとけらばのふち（壁のまん中の線から）・部品をのばす長さ（iso_roof.py の K・OVR・EXT） */
const IQRS=2;/* 屋根の絵の細かさ（チップの g64 と同じ。ゲームの1点を2×2） */
function iqRoofCol(h){const rc=S.roofCol&&S.roofCol[hKey(h)];return rc&&ROOFCOL[rc]?rc:WD===KAZAN?'k':'d'}/* チップの色の名前 */
/* 家の形の中の、いちばん大きな長方形（ほかの長方形の中に入らない物）ぜんぶ。[x0,y0,x1,y1]（マス、両はしをふくむ） */
function iqRoofRects(F,X0,Y0,X1,Y1){const w=X1-X0+1,hh=Y1-Y0+1,P=new Int32Array((w+1)*(hh+1));
  for(let y=0;y<hh;y++)for(let x=0;x<w;x++)P[(y+1)*(w+1)+x+1]=(F.has((Y0+y)*W+X0+x)?1:0)+P[y*(w+1)+x+1]+P[(y+1)*(w+1)+x]-P[y*(w+1)+x];
  const full=(a,b,c,d)=>a>=0&&b>=0&&c<w&&d<hh&&P[(d+1)*(w+1)+c+1]-P[b*(w+1)+c+1]-P[(d+1)*(w+1)+a]+P[b*(w+1)+a]===(c-a+1)*(d-b+1),R=[];
  for(let b=0;b<hh;b++)for(let a=0;a<w;a++){if(!F.has((Y0+b)*W+X0+a))continue;for(let d=b;d<hh;d++){if(!full(a,b,a,d))break;for(let c=a;c<w;c++){if(!full(a,b,c,d))break;
    if(full(a-1,b,c,d)||full(a,b,c+1,d)||full(a,b-1,c,d)||full(a,b,c,d+1))continue;R.push([a+X0,b+Y0,c+X0,d+Y0])}}}
  return R}
/* 部品の切り口（iso_roof.py の prof・xr）：[y0, y1, 高さの式] と、棟の向きにそったはんい */
function iqRProf(t){const K=IQROOFK,E=IQREXT,O=IQROVR;switch(t){case'up':return[-E,1+E,y=>K*y];case'dn':return[-E,1+E,y=>K*(1-y)];case'dnc':return[-E,1+E,y=>K*(1-Math.abs(y))];
  case'tent':return[-E,1+E,y=>K*(.5-Math.abs(y-.5))];case'upe':return[.5-O,1+E,y=>K*(y-.5)];case'dne':return[-E,.5+O,y=>K*(.5-y)];case'dnec':return[-E,.5+O,y=>K*(.5-Math.abs(y))];default:return[.5-O,.5+O,()=>0]}}
function iqRXr(e){const E=IQREXT,O=IQROVR;return e==='a'?[.5-O,1+E]:e==='b'?[-E,.5+O]:e==='l'?[.5,1+E]:e==='r'?[-E,.5]:[-E,1+E]}
function iqRHgt(p,x,y){const P=iqRProf(p.t),X=p.o==='h'?x:y,Y=p.o==='h'?y:x,R=iqRXr(p.e);if(!(P[0]<=Y&&Y<=P[1]&&R[0]<=X&&X<=R[1]))return null;return p.z+P[2](Y)}
/* うでごとの部品の一覧：{cells:Map(マス→[{o,t,e,z}]), gab:[{cx,cy,o,t,z}]} */
function iqRoofCells(h,F){const K=IQROOFK,R=iqRoofRects(F,h.x0,h.y0,h.x1,h.y1).map(([a,b,c,d])=>({a,b,c,d,ew:c-a>=d-b,ar:(c-a+1)*(d-b+1)}));
  const ov=(p,q)=>!(p.c<q.a||q.c<p.a||p.d<q.b||q.d<p.b);
  for(let i=0;i<R.length;i++)for(let j=0;j<i;j++){const p=R[i],q=R[j];if(ov(p,q)&&p.ew===q.ew){const sm=p.ar<q.ar?p:q;sm.ew=!sm.ew}}/* 同じ向きでかさなる：小さいほうを直角に */
  for(const r of R){r.n=r.ew?r.d-r.b+1:r.c-r.a+1;r.m=r.ew?(r.b+r.d+1)/2:(r.a+r.c+1)/2;r.D=(r.n-1)/2}
  const pri=(p,q)=>p.D!==q.D?p.D>q.D:p.ar!==q.ar?p.ar>q.ar:p.ew&&!q.ew,cells=new Map(),gab=[];
  for(const r of R){const U0=r.ew?r.a:r.b,U1=r.ew?r.c:r.d,V0=r.ew?r.b:r.a,V1=r.ew?r.d:r.c,o=r.ew?'h':'v';let lo=U0,hi=U1,cl=null,ch=null;
    for(const q of R){if(q===r||q.ew===r.ew||!pri(q,r))continue;const qa=r.ew?q.a:q.b,qc=r.ew?q.c:q.d,qv0=r.ew?q.b:q.a,qv1=r.ew?q.d:q.c;if(qv1<V0||qv0>V1||qc<U0||qa>U1)continue;const mq=q.m;
      if(U0<qa&&U1<=qc){if(mq%1===0)hi=Math.min(hi,mq-1);else{hi=Math.min(hi,mq-.5);ch=mq-.5}}/* 高いうでの棟まで */
      else if(U1>qc&&U0>=qa){if(mq%1===0)lo=Math.max(lo,mq);else{lo=Math.max(lo,mq-.5);cl=mq-.5}}}
    const hv=v=>K*(r.D-Math.abs(v-r.m));
    for(let v=V0;v<=V1;v++){let t,z;if(r.n===1){t='fl';z=0}else if(v===V0){t='upe';z=0}else if(v===V1){t=r.n===2?'dnec':'dne';z=0}else if(r.m===v+.5){t='tent';z=hv(v)}else if(r.m===v){t='dnc';z=hv(v+1)}else if(v+1<=r.m){t='up';z=hv(v)}else{t='dn';z=hv(v+1)}
      for(let u=lo;u<=hi;u++){const e=u===cl?'l':u===ch?'r':u===U0&&U0===lo?'a':u===U1&&U1===hi?'b':'m',cx=r.ew?u:v,cy=r.ew?v:u,k=cy*W+cx;let L=cells.get(k);if(!L)cells.set(k,L=[]);L.push({o,t,e,z})}
      if(hi===U1)gab.push({cx:r.ew?U1:v,cy:r.ew?v:U1,o,t:t==='dnc'?'dn':t==='dnec'?'dne':t,z})}}
  return{cells,gab}}
/* かさなるマス：見える部品が1つならその部品、2つ以上なら谷のチップの名前（iso_roof.py の pick と同じ） */
function iqRPick(ps){const win=new Set();for(let i=0;i<8;i++)for(let j=0;j<8;j++){const x=i/8+1/16,y=j/8+1/16;let bh=null,bk=-1;for(let k=0;k<ps.length;k++){const hh=iqRHgt(ps[k],x,y);if(hh!=null&&(bh==null||hh>bh||hh===bh&&k>bk)){bh=hh;bk=k}}if(bk>=0)win.add(bk)}
  if(win.size<=1)return{p:ps[win.size?[...win][0]:0]};const vs=[...win].sort((a,b)=>a-b).map(k=>ps[k]),zm=Math.min(...vs.map(p=>p.z));
  return{j:'x-'+vs.map(p=>p.o+'-'+p.t+'-'+p.e+'-'+Math.round((p.z-zm)/(IQROOFK/2))).sort().join('+'),z:zm,vs}}
/* 家の屋根の絵を作る（列ごと）。チップがまだ読みこめていなければ null */
const IQROOF=new Map();
function iqRoofBuild(h){
  const F=new Set([...h.set,...h.inside]);let lv=0;for(const j of h.set)lv=Math.max(lv,hiAt(j));const base=lv*IQL+IQWALLH,{cells,gab}=iqRoofCells(h,F),col=iqRoofCol(h),C=window.CHIPS;if(!C)return null;
  const wallOf=(cx,cy)=>{const o=typeAt(cy*W+cx);return HOME_WALLS.has(o)?o:h._rw.find(id=>HOME_WALLS.has(id))||'hwall'};
  const snow=FEELC.snow||0,sfull=snow>SNOWFULL0?Math.min(1,(snow-SNOWFULL0)/(1-SNOWFULL0)):0;
  /* マスごとに置くチップ：[マス, チップ, 高さ（だん）, うすさ]。同じマスの中は、妻 → 屋根 → 雪の順 */
  const put=new Map(),add=(cx,cy,k,z,a)=>{const j=cy*W+cx;let L=put.get(j);if(!L)put.set(j,L=[]);L.push([k,z,a==null?1:a])};
  for(const g of gab){const wl=wallOf(g.cx,g.cy),nb=Math.round(g.z/(IQROOFK/2));for(let i=0;i<nb;i++)add(g.cx,g.cy,'iso:'+wl+':gab-'+g.o+'-blk-'+(i%2),i*IQROOFK/2);add(g.cx,g.cy,'iso:'+wl+':gab-'+g.o+'-'+g.t+'-'+(nb%2),g.z)}
  const piece=(cx,cy,k,z)=>{add(cx,cy,'iso:roof-'+col+':'+k,z);if(snow>0)add(cx,cy,'iso:roofsn:'+k+'-a',z,Math.min(1,snow*2.5));if(sfull>0)add(cx,cy,'iso:roofsn:'+k+'-f',z,sfull*.95)};
  for(const[j,ps]of cells){const cx=j%W,cy=(j/W)|0;if(ps.length===1){const p=ps[0];piece(cx,cy,p.o+'-'+p.t+'-'+p.e,p.z);continue}
    const q=iqRPick(ps);if(q.p){piece(cx,cy,q.p.o+'-'+q.p.t+'-'+q.p.e,q.p.z);continue}
    if(C['iso:roof-'+col+':'+q.j]){piece(cx,cy,q.j,q.z);continue}
    for(const p of q.vs.slice().sort((a,b)=>a.z-b.z))piece(cx,cy,p.o+'-'+p.t+'-'+p.e,p.z)}/* 谷のチップのない組み合わせ：低いほうから */
  /* 列ごとに、奥の行から置いて、1まいの絵に */
  const cols=[];for(let cx=h.x0;cx<=h.x1;cx++){const rows=[];for(let cy=h.y0;cy<=h.y1;cy++){const L=put.get(cy*W+cx);if(L)rows.push([cy,L])}if(!rows.length)continue;
    let X0=1e9,Y0=1e9,X1=-1e9,Y1=-1e9;const it=[];
    for(const[cy,L]of rows)for(const[k,z,a]of L){const ch=C[k];if(!ch)continue;const im=chipImgs(ch,k)[0];if(!im||!im.ok)return null;const ax=(cx-cy)*32*IQRS-ch.ax,ay=((cx+cy+1)*24-base-z*IQL)*IQRS-ch.ay;
      X0=Math.min(X0,ax);Y0=Math.min(Y0,ay);X1=Math.max(X1,ax+ch.w);Y1=Math.max(Y1,ay+ch.h);it.push([im,ax,ay,a])}
    if(!it.length)continue;X0=Math.floor(X0);Y0=Math.floor(Y0);const cv=document.createElement('canvas');cv.width=Math.ceil(X1)-X0;cv.height=Math.ceil(Y1)-Y0;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
    for(const[im,ax,ay,a]of it){g.globalAlpha=a;g.drawImage(im,Math.round(ax-X0),Math.round(ay-Y0))}
    let rb=-1;for(const j of F)if(j%W===cx)rb=Math.max(rb,(j/W)|0);cols.push({x:cx,b0:rb,cv,x0:X0/IQRS,y0:Y0/IQRS,tint:null,tk:''})}
  /* あらしの日のぬれた点の場所：列の絵の中の、屋根のドット（妻はのぞかない。少しだけ） */
  const glint=[];for(const c of cols){const w=c.cv.width,hh=c.cv.height,d=c.cv.getContext('2d').getImageData(0,0,w,hh).data,n=Math.max(2,Math.round(w*hh/2600));for(let i=0;i<n*3&&glint.length<1e4;i++){const X=Math.floor(hash(c.x*31+i*7+h.y0)*w),Y=Math.floor(hash(c.x*17+i*13+h.x0)*hh);if(d[(Y*w+X)*4+3]>200&&d[(Y*w+X)*4+3]<256&&i%3===0)glint.push([c.x,c.x0+X/IQRS,c.y0+Y/IQRS])}}
  return{cols,glint}}
/* 屋根の絵（作りなおしが要るときだけ作る） */
function iqRoofOf(h,now){if(!h._rk){h._rw=[...h.set].map(typeAt).filter((v,i,a)=>a.indexOf(v)===i);h._rk=[...h.set,...h.inside].sort((a,b)=>a-b).join(',')+'|'+[...h.set].reduce((m,j)=>Math.max(m,hiAt(j)),0)}/* 家の形（HOUSES を作りなおすまで同じ） */
  const key=h._rk+'|'+(S.roofCol&&S.roofCol[hKey(h)]||'')+'|'+WD+'|'+Math.round((FEELC.snow||0)*20);
  let v=IQROOF.get(hKey(h));if(v&&v.key===key)return v.r;if(!now&&IQRBF===IQRF)return v?v.r:null;/* 1コマに作りなおすのは1けんだけ。それまでは前の絵 */
  IQRBF=IQRF;const r=iqRoofBuild(h);if(!r)return v?v.r:null;/* 部品の絵がまだ読みこめていない：つぎのコマで */if(v)for(const c of v.r?v.r.cols:[]){c.cv.width=c.cv.height=0;if(c.tint)c.tint.width=c.tint.height=0}/* 前の絵を手ばなす */IQROOF.set(hKey(h),{key,r});return r}
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
