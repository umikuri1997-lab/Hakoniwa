/* 時間の色（昼と夜の色の表）：時刻ごとに、層ごとの色の変わり方をきめる。色をかえたいときは、この表の数字だけを書きかえる。
   層：
   - dk   夜の暗さの色（ぜんたい）。こさは darkness() のまま。あかりの所はけずる（3D：あかりの地図 draw-3d.js の g3Night／2D の洞窟：draw-world.js の DMK）
   3D（地上）の光：
   - sun  日なたの色（日のあたる面にかけ算。[赤,緑,青]、255 で何もしない）。地面・せいれい・物の板・水に同じ色
   - amb  かげの色（日のあたらない面にかけ算）
   - sky  空の色 [地平線の赤,緑,青, 上の赤,緑,青]（もやの色も地平線の色）
   - el   日（夜は月）の高さ（度）。向きは、いつも左上から（物の板のかげに合わせる）
   2D（洞窟）だけ（3Dでは使わない）：
   - g    地面（ひし形の地面の区画）。物より先に、かけ算でかさねる（dcGround）
   - w    水（池・川）。水面を流すときにかけ算（iso-ground.js の igShimmer）
   - s    雲の海（風）。地面の層のかわりに、雲の海の所だけかけ算（dcGround。iso-ground.js の雲の海の形 q.k）
   - r    屋根。屋根を描いたあと、屋根の形にかけ算（iso-conn.js の iqRoofColDraw）。高い段の上の面は g（dcTop）
   - win  窓のあかりの強さ（1がふつう）
   - glow 時間の光（HD-2D の入りのときだけ。soft-light、hd2d.js の hdTint）
   色は [赤,緑,青,こさ]。かけ算の層は、こさ0で何もしない。こさ1でその色をそのままかける。時刻のあいだは、なめらかにつなぐ。 */
const DAYC=[
  {h:0,   dk:[12,16,50],  g:[120,130,200,.35],w:[70,72,92,.5],  s:[96,104,160,.4], r:[110,110,180,.35],win:1.15,sun:[196,202,240],amb:[176,184,230],sky:[34,40,82,8,12,36],el:50},/* 深夜：いちばん暗い青。窓のあかりがいちばん目立つ */
  {h:4.5, dk:[16,20,58],  g:[140,150,210,.3], w:[74,76,96,.45], s:[110,116,170,.35],r:[122,120,186,.3], win:1,sun:[204,210,242],amb:[184,192,234],sky:[44,50,96,12,16,44],el:50},/* 夜あけ前 */
  {h:5.75,dk:[64,40,92],  g:[226,186,206,.22],w:[150,134,170,.3],s:[200,170,200,.25],r:[220,176,196,.22],win:.8,glow:[255,176,170,.35],sun:[255,212,214],amb:[214,198,226],sky:[236,176,186,96,100,170],el:8},/* 夜あけ：むらさきからピンクへ */
  {h:6.5, dk:[90,60,90],  g:[255,226,210,.1], w:[220,206,214,.12],s:[240,220,226,.1],r:[255,220,206,.1], win:.4,glow:[255,176,170,.55],sun:[255,234,222],amb:[232,226,238],sky:[246,214,206,92,150,214],el:22},/* 朝：ピンクの光 */
  {h:8,   dk:[90,60,90],  win:0,glow:[255,228,180,.3],sun:[255,255,255],amb:[255,255,255],sky:[215,236,240,47,134,214],el:57},/* 昼：あたたかい日なた（かげは青い：足もとのかげ・落ち影・雲のかげ） */
  {h:15.5,dk:[90,50,40],  win:0,glow:[255,220,168,.32],sun:[255,250,240],amb:[250,248,252],sky:[215,236,240,47,134,214],el:45},
  {h:17,  dk:[96,52,44],  g:[255,190,130,.3],w:[255,184,128,.2],s:[255,196,140,.24],r:[255,190,134,.24],win:.2,glow:[255,140,60,.5],sun:[255,212,166],amb:[236,214,216],sky:[255,206,160,86,132,204],el:18},/* 夕方：あたたかい色から */
  {h:18.3,dk:[84,42,74],  g:[250,180,160,.24],w:[200,156,176,.22],s:[230,170,190,.22],r:[240,172,156,.2], win:.7,glow:[255,150,72,.5],sun:[255,182,150],amb:[220,190,212],sky:[240,150,128,70,72,150],el:6},/* 夕やけ：赤むらさきへ */
  {h:19.3,dk:[42,36,104], g:[150,150,224,.32],w:[96,104,150,.36],s:[140,140,210,.32],r:[150,140,212,.3], win:1,glow:[255,150,72,.25],sun:[190,190,240],amb:[170,172,228],sky:[86,84,150,26,32,84],el:40},/* ブルーアワー：まわりは寒色、窓はあたたかく */
  {h:21,  dk:[20,24,70],  g:[140,150,215,.3], w:[74,76,96,.45], s:[104,112,170,.36],r:[120,120,190,.3], win:1,sun:[200,206,240],amb:[180,188,232],sky:[40,46,90,10,14,40],el:50},/* 夜 */
  {h:24,  dk:[12,16,50],  g:[120,130,200,.35],w:[70,72,92,.5],  s:[96,104,160,.4], r:[110,110,180,.35],win:1.15,sun:[196,202,240],amb:[176,184,230],sky:[34,40,82,8,12,36],el:50}];
const DC={h:-1,v:null};
function dcMix(a,b,t,mul){/* 2つの色をつなぐ。かけ算の層は「かける色」（こさをとかした色）でつなぐ */
  if(mul){const m=c=>c?[255-c[3]*(255-c[0]),255-c[3]*(255-c[1]),255-c[3]*(255-c[2])]:[255,255,255],p=m(a),q=m(b);return p.map((v,i)=>v+(q[i]-v)*t)}
  if(!a&&!b)return null;const A=a||[b[0],b[1],b[2],0],B=b||[a[0],a[1],a[2],0];return A.map((v,i)=>v+(B[i]-v)*t)}
function dcNow(){/* いまの時刻の色（同じ時刻なら作りなおさない） */const h=typeof skyHour==='function'?skyHour():12,hk=Math.round(h*200)/200;if(DC.h===hk&&DC.v)return DC.v;DC.h=hk;
  let i=0;while(i<DAYC.length-2&&DAYC[i+1].h<=hk)i++;const a=DAYC[i],b=DAYC[i+1],t=Math.max(0,Math.min(1,(hk-a.h)/(b.h-a.h||1))),v={};
  v.dk=dcMix([...a.dk,1],[...b.dk,1],t).slice(0,3).map(Math.round);
  for(const k of['g','w','s','r']){const m=dcMix(a[k],b[k],t,true);v[k]=m.every(c=>c>254.5)?null:'rgb('+m.map(Math.round).join(',')+')'}/* 白（何もしない）は null */
  v.win=a.win+(b.win-a.win)*t;for(const k of['sun','amb','sky'])v[k]=a[k].map((c,i)=>c+(b[k][i]-c)*t);v.el=a.el+(b.el-a.el)*t;v.glow=dcMix(a.glow,b.glow,t);if(v.glow&&v.glow[3]<=.005)v.glow=null;
  return DC.v=v}
function dcLayer(k){return dcNow()[k]}
const DCL=document.createElement('canvas'),dcl=DCL.getContext('2d');/* 雲の海のある所だけ、色をかえるための絵（画面と同じ大きさ） */
function dcGround(){/* 地面の層：地面の下絵・水・地面の上の物（水たまりなど）を描いたあと、物より先に、画面ぜんたいにかけ算。雲の海（風）の所は、雲の海の色 s */const m=dcLayer('g'),s=dcLayer('s'),W0=ctx.canvas.width,H0=ctx.canvas.height;if(!m&&!s)return;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';
  if(typeof skyM==='function'&&skyM()){if(DCL.width!==W0||DCL.height!==H0){DCL.width=W0;DCL.height=H0}const k=dpr*cam.z;
    dcl.globalCompositeOperation='source-over';dcl.clearRect(0,0,W0,H0);if(igSkyMask(dcl,k)){
      if(s){dcl.globalCompositeOperation='source-in';dcl.fillStyle=s;dcl.fillRect(0,0,W0,H0);ctx.drawImage(DCL,0,0)}/* 雲の海 */
      if(m){dcl.globalCompositeOperation='source-over';dcl.clearRect(0,0,W0,H0);dcl.fillStyle=m;dcl.fillRect(0,0,W0,H0);dcl.globalCompositeOperation='destination-out';igSkyMask(dcl,k);ctx.drawImage(DCL,0,0)}/* 雲の海のほかの地面 */
      ctx.restore();return}}
  if(m){ctx.fillStyle=m;ctx.fillRect(0,0,W0,H0)}ctx.restore()}
/* 高い段の上の面（段ごとに奥行きの順で描くので、dcGround のあと）：その面のひし形に、地面の層の色をかけ算（iso-cliff.js の icBlock）。ix,iy：ひし形の上のかど */
function dcTop(c,ix,iy){const m=c===ctx&&dcLayer('g');if(!m)return;c.save();c.globalCompositeOperation='multiply';c.fillStyle=m;c.beginPath();c.moveTo(ix,iy);c.lineTo(ix+IQW/2,iy+IQH/2);c.lineTo(ix,iy+IQH);c.lineTo(ix-IQW/2,iy+IQH/2);c.closePath();c.fill();c.restore()}
