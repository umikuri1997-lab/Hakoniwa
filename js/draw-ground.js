'use strict';

/* ---------- 描画 ---------- */
const cv=$('#cv'),ctx=cv.getContext('2d');
let dpr=1,VW=0,VH=0;const cam={x:0,y:0,z:1};let camAnim=null;
const GCS=16,GPX=GCS*TS,GFULL=64,GBUD=8;/* 地面の下絵の区画：16×16マス（512ドット）。くわしい区画は、ステージを開くときにぜんぶ作って、すてない（64こまで。マップは7×7＝49こ）。半分の細かさの区画（ちぢめたとき用、1こ約0.25MB）は、ぜんぶとっておく。区画を作る時間は1コマ8ミリ秒まで（少なくとも1こ） */
const GRD={s:null,c:new Map(),bt:0,any:false,pre:null,busy:false};/* key → {f:くわしい絵, l:半分の絵, u:さいごに使ったコマ, st:作りなおすしるし} */
function gq(cx,cy){const k=cy*64+cx;let q=GRD.c.get(k);if(!q){q={f:null,l:null,u:0,st:false};GRD.c.set(k,q)}return q}
function gbuild(cx,cy,q){/* 区画 (cx,cy) のくわしい絵を作る（まわり4マス・下へ6マスもいっしょに描いて、区画の中だけをのこす：となりのマスからはみ出す平らな物・水のふち・草のふち）。半分の細かさの絵も、ここから作る */const t0=performance.now(),X0=cx*GCS,Y0=cy*GCS,X1=Math.min(W,X0+GCS)-1,Y1=Math.min(H,Y0+GCS)-1,w=(X1-X0+1)*TS,h=(Y1-Y0+1)*TS;
  const c=q.f||document.createElement('canvas');if(c.width!==w||c.height!==h){c.width=w;c.height=h}const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.setTransform(1,0,0,1,-X0*TS,-Y0*TS);drawStaticArea(g,Math.max(0,X0-4),Math.max(0,Y0-4),Math.min(W-1,X1+4),Math.min(H-1,Y1+6));g.setTransform(1,0,0,1,0,0);
  const l=q.l||document.createElement('canvas');l.width=Math.ceil(w/2);l.height=Math.ceil(h/2);const gl=l.getContext('2d');gl.imageSmoothingEnabled=true;gl.imageSmoothingQuality='high';gl.drawImage(c,0,0,l.width,l.height);
  q.f=c;q.l=l;q.st=false;q.u=RFN;GRD.bt+=performance.now()-t0;
  let n=0;for(const v of GRD.c.values())if(v.f)n++;if(n>GFULL){const L=[...GRD.c.values()].filter(v=>v.f&&v.u<RFN-1).sort((a,b)=>a.u-b.u);for(const v of L){if(n<=GFULL)break;v.f.width=v.f.height=0;v.f=null;n--}}/* くわしい区画が多すぎたら、しばらく使っていない区画からすてる（半分の絵はのこす） */}
function stageJob(){/* マップ全体を作る仕事の一覧：地面の区画（くわしい絵と半分の絵）・水面の区画・段差の部品。1こずつ、コマをまたいで作る（読みこみの%を出すため） */const L=[()=>{if(dirty)rebuildStatic(STATICFULL);if(GRD.s!==S)gclear()}],NX=(W-1)>>4,NY=(H-1)>>4;
  for(let cy=0;cy<=NY;cy++)for(let cx=0;cx<=NX;cx++)L.push(()=>{const q=gq(cx,cy);if(!q.f||q.st)gbuild(cx,cy,q)});L.push(()=>{GRD.any=true});
  if(WD!==1&&waterChipsOK())for(let cy=0;cy<=NY;cy++)for(let cx=0;cx<=NX;cx++)L.push(()=>waterChunk(cx,cy));
  if(S.hi&&cliffChipsOK()){CPRE=S;const RW=cliffRuns(),keys=new Set();for(const[y,R0]of RW)for(const R of R0)for(let k=R.x0;k<=R.x1;k++)keys.add(cliffKey(k,y,R.lv));for(const K of [2,1])for(const k of keys)L.push(()=>cliffPart(k,K))}
  return {s:S,L,i:0}}
function stageStep(now){/* 作る仕事を、1コマに30ミリ秒ぶんだけすすめる。おわったら、マップを開く */const J=GRD.job,t0=performance.now();while(J.i<J.L.length&&performance.now()-t0<30){try{J.L[J.i]()}catch(e){frameErr('preload',e)}J.i++}if(J.i>=J.L.length){GRD.job=null;GRD.pre=J.s}}
function assetPct(){/* 絵の読みこみの進みぐあい（0〜1）。マップチップのアトラス（大きい絵）で半分、ほかの絵で半分 */let n=0,d=0,cn=0;const cp=(window.CHIPA||[]).length;for(let k=0;k<cp;k++){const a=chipPage(k);if(a.ok||a.bad)cn++}for(const k in ICI){const im=ICI[k];d++;if(im.ok||im.bad||im.complete)n++}for(const k in ART){const a=ART[k];d++;if(a.ok||a.bad)n++}return ((cp?cn/cp:1)+(d?n/d:1))/2}
function loadPct(){/* 読みこみの%：絵の読みこみが30%、マップを作るのが70% */const J=GRD.job;return Math.min(99,Math.floor(J&&J.s===S?30+70*J.i/J.L.length:30*assetPct()))}
function assetsOK(){/* 絵がぜんぶ読みこめたか（マップチップのアトラス・アイコン・そのほかの絵） */for(let n=0;n<(window.CHIPA||[]).length;n++){const a=chipPage(n);if(!a.ok&&!a.bad)return false}for(const k in ICI){const im=ICI[k];if(!im.ok&&!im.bad&&!im.complete)return false}for(const k in ART){const a=ART[k];if(!a.ok&&!a.bad)return false}return groundChipsOK()&&(WD===1||waterChipsOK())&&cliffChipsOK()}
const stageReady=()=>GRD.pre===S;/* マップ全体を作りおわったか。おわるまで、マップを見せず、時間も止める */
function stageLoading(on){/* 「マップを読みこみ中…」（作るあいだ、画面をおおう） */let d=document.getElementById('stageLd');if(!d){d=document.createElement('div');d.id='stageLd';d.style.cssText='position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:#1e1810;color:#fff3d6;font-size:16px';document.body.appendChild(d)}if(on)d.textContent='マップを読みこみ中… '+loadPct()+'%';d.hidden=!on;return d}
function gget(cx,cy){/* 区画のくわしい絵（なければ・古ければ、すぐ作る） */if(GRD.s!==S)gclear();const q=gq(cx,cy);if(!q.f||q.st)gbuild(cx,cy,q);q.u=RFN;return q.f}
function gclear(){for(const v of GRD.c.values()){if(v.f)v.f.width=v.f.height=0;if(v.l)v.l.width=v.l.height=0}GRD.c.clear();GRD.s=S;GRD.any=false}
function gblit(c,sx,sy,sw,sh,dx,dy,dw,dh,lod){/* 地面の下絵の (sx,sy,sw,sh) を、c の (dx,dy,dw,dh) へ描く（区画をまたいでもよい）。lod：半分の細かさの絵を使う */const kx=dw/sw,ky=dh/sh;
  for(let cy=Math.max(0,Math.floor(sy/GPX));cy<=Math.min((H-1)>>4,Math.floor((sy+sh-.001)/GPX));cy++)for(let cx=Math.max(0,Math.floor(sx/GPX));cx<=Math.min((W-1)>>4,Math.floor((sx+sw-.001)/GPX));cx++){
    const ox=cx*GPX,oy=cy*GPX,a=Math.max(sx,ox),b=Math.max(sy,oy),a2=Math.min(sx+sw,ox+GPX,W*TS),b2=Math.min(sy+sh,oy+GPX,H*TS);if(a2<=a||b2<=b)continue;
    const q=GRD.s===S&&GRD.c.get(cy*64+cx);if(!q)continue;let im=lod?q.l:(q.f||q.l),s=im===q.l?.5:1;if(!im)continue;q.u=RFN;/* できていない区画はとばす（つぎのコマ以降に、見えている区画から作る）。くわしい絵をすてた区画は、半分の絵で */
    c.drawImage(im,(a-ox)*s,(b-oy)*s,(a2-a)*s,(b2-b)*s,dx+(a-sx)*kx,dy+(b-sy)*ky,(a2-a)*kx,(b2-b)*ky)}}
let dirty=true,STATICFULL=false,ICON=false,VIG=null;
function artLoaded(){for(const q in iconCache)delete iconCache[q];STATICFULL=true;dirty=true}/* 絵が読みこまれたら、次に描くときに1回だけ地面を全部描きなおす */

function rr(c,x,y,w,h,r){c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h);c.fill()}
function drawSeedShape(c,x,y,k){c.save();c.translate(x,y);c.scale(k,k);c.rotate(-.35);c.fillStyle='#7a4a24';c.beginPath();c.moveTo(0,-7);c.bezierCurveTo(5.5,-4,5.5,4,0,7);c.bezierCurveTo(-5.5,4,-5.5,-4,0,-7);c.fill();c.fillStyle='#b07a44';c.beginPath();c.moveTo(0,-5.5);c.bezierCurveTo(3.6,-3,3.6,3.5,0,5.6);c.bezierCurveTo(-1.6,3,-1.6,-3,0,-5.5);c.fill();c.strokeStyle='#5c341a';c.lineWidth=.8;c.beginPath();c.moveTo(0,-6);c.lineTo(0,6);c.stroke();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(1.8,-2.5,.9,2,.2,0,7);c.fill();c.restore()}/* 種の形 */
let SEEDICO=null;const seedIco=()=>{if(SEEDICO)return SEEDICO;const cv=document.createElement('canvas');cv.width=cv.height=48;const g=cv.getContext('2d');g.fillStyle='rgba(255,236,140,.45)';g.beginPath();g.arc(24,24,17,0,7);g.fill();drawSeedShape(g,24,24,2.4);return SEEDICO=cv.toDataURL()};
function circ(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,7);c.fill()}
function drawWeed(c,id,x,y){/* 雑草・きのこ（仮の絵）。草原：しなやかな草（エノコログサ）・かさかさ草（かれたエノコログサ）。火山：くるくる草（ゼンマイ）・ちりちり草（かれたゼンマイ） */
  const h=k=>hash(((x*7+y*13)|0)+k*131),dry=id.endsWith('k');
  {const C=window.CHIPS,v=(h(7)*3)|0,ch=C&&(C[id+'#'+v]||C[id]);if(ch&&drawChip(c,ch,id,x,y,0))return}/* もらった絵（きのこ・ふんばり草は3しゅるいから、場所でえらぶ） */
  if(id==='kinoko'){shadow(c,x+16,y+27,7,2);c.fillStyle='#efe2c8';c.fillRect(x+14,y+19,4,8);c.fillStyle='#d8876a';c.beginPath();c.ellipse(x+16,y+19,7,4.5,0,Math.PI,0);c.fill();c.fillStyle='#f6e9d6';c.beginPath();c.arc(x+13.5,y+16.5,1.1,0,7);c.arc(x+18.5,y+17,1,0,7);c.fill();return}
  if(id==='weedc'){shadow(c,x+16,y+27,8,2);/* ふんばり草（オヒシバ）：ひくく広がる葉と、指のようにひらいた穂 */c.strokeStyle='#5f9a3e';c.lineWidth=1.3;for(let k=0;k<5;k++){const a=Math.PI*(.15+k*.175),L=7+h(k)*3;c.beginPath();c.moveTo(x+16,y+27);c.quadraticCurveTo(x+16+Math.cos(a+Math.PI)*L*.5,y+25,x+16-Math.cos(a)*L,y+27-Math.sin(a)*2.5);c.stroke()}
    for(let k=0;k<2;k++){const bx=x+13+k*6,top=y+14+h(k+3)*2;c.strokeStyle='#6aa34a';c.beginPath();c.moveTo(bx,y+27);c.lineTo(bx,top);c.stroke();c.strokeStyle='#8cc566';c.lineWidth=1.1;for(let f=0;f<4;f++){const a=-Math.PI/2+(f-1.5)*.42;c.beginPath();c.moveTo(bx,top);c.lineTo(bx+Math.cos(a)*5,top+Math.sin(a)*5+1.5);c.stroke()}c.lineWidth=1.3}return}
  shadow(c,x+16,y+27,7,2);const G=dry?['#c9ad78','#b39462','#dcc392']:['#7fb85a','#6aa34a','#a8d97c'];
  if(id.startsWith('weed0')){for(let k=0;k<5;k++){const bx=x+11+k*2.5,lean=(h(k)-.5)*5;c.strokeStyle=G[k%2];c.lineWidth=1.2;c.beginPath();c.moveTo(bx,y+27);c.quadraticCurveTo(bx+lean*.3,y+21,bx+lean,y+15+h(k+5)*4);c.stroke()}
    for(let k=0;k<2;k++){const tx=x+13+k*6+(h(k+9)-.5)*2,ty=y+12+h(k+3)*3;c.fillStyle=G[2];c.beginPath();c.ellipse(tx,ty,1.8,4.2,(k?.35:-.35),0,7);c.fill()}return}/* 穂のある細い草 */
  for(let k=0;k<3;k++){const bx=x+11+k*5,top=y+13+h(k)*4;c.strokeStyle=G[k%2];c.lineWidth=1.5;c.beginPath();c.moveTo(bx,y+27);c.lineTo(bx,top+3);c.stroke();c.beginPath();c.arc(bx+1.6,top+3,1.8,Math.PI,Math.PI*2.6);c.stroke();c.fillStyle=G[2];for(let v=0;v<3;v++){c.beginPath();c.ellipse(bx+(v%2?2.4:-2.4),y+24-v*3,1.6,.9,0,0,7);c.fill()}}}/* うずまきの芽のある草 */
function drawMatIc(c,k,cx,cy,sz){/* 素材のアイコン（仮の絵）：草（5しゅるい）・枝・きのこ・空き缶 */const s=sz/24;c.save();c.translate(cx,cy);c.scale(s,s);
  if(k==='shina'||k==='kasa'||k==='funba'){const G=k==='kasa'?['#c9ad78','#a98a58']:k==='funba'?['#6aa04c','#4d8636']:['#7fb85a','#5e9a3e'];for(let i=0;i<5;i++){c.strokeStyle=G[i%2];c.lineWidth=2;c.beginPath();c.moveTo(-6+i*3,9);c.quadraticCurveTo(-5+i*3,0,-8+i*4,-9+(i%2)*3);c.stroke()}if(k==='shina'){c.fillStyle='#d9e6a6';c.beginPath();c.ellipse(-7,-8,1.8,3.2,-.4,0,7);c.ellipse(4,-8,1.8,3.2,.3,0,7);c.fill()}c.fillStyle=G[1];c.fillRect(-8,6,16,3)}
  else if(k==='kuru'||k==='chiri'){const G=k==='chiri'?['#b9925f','#987247']:['#7fb85a','#5e9a3e'];c.lineWidth=2;for(let i=0;i<3;i++){const x=-6+i*6;c.strokeStyle=G[i%2];c.beginPath();c.moveTo(x,9);c.lineTo(x,-3);c.arc(x+2.5,-3,2.5,Math.PI,Math.PI*2.6);c.stroke()}c.fillStyle=G[1];c.fillRect(-8,6,16,3)}
  else if(k==='eda'){c.strokeStyle='#8a6038';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(-9,8);c.lineTo(9,-7);c.moveTo(1,1);c.lineTo(4,8);c.stroke();c.fillStyle='#86b45a';c.beginPath();c.ellipse(6,-8,3,1.6,-.5,0,7);c.fill()}
  else if(k==='kinoko'){c.fillStyle='#efe2c8';c.fillRect(-2.5,-1,5,9);c.fillStyle='#d8876a';c.beginPath();c.ellipse(0,-1,9,6,0,Math.PI,0);c.fill();c.fillStyle='#f6e9d6';c.beginPath();c.arc(-3,-4,1.4,0,7);c.arc(3,-4.5,1.3,0,7);c.fill()}
  else if(k==='can'){c.fillStyle='#b9c0c8';c.fillRect(-6,-8,12,16);c.fillStyle='#d9dee3';c.fillRect(-6,-8,12,2.5);c.fillStyle='#e7a07a';c.fillRect(-6,-2,12,5);c.fillStyle='#8f969e';c.fillRect(-6,6,12,2)}
  c.restore()}
function shadow(c,x,y,w,h){c.fillStyle='rgba(30,20,10,.22)';c.beginPath();c.ellipse(x,y,w,h,0,0,7);c.fill()}
function drawBarren(c,i,x,y){
  const h=hash(i);
  c.fillStyle=WD===1?'#a39280':'#b3a37c';c.fillRect(x,y,TS,TS);/* 火山のふもとは灰まじりの土 */
  c.fillStyle='rgba(90,70,40,.18)';c.fillRect(x+hash(i*3)*26,y+hash(i*5)*26,4,3);
  c.fillStyle='rgba(255,245,220,.18)';c.fillRect(x+hash(i*7)*28,y+hash(i*11)*28,3,2);
  if(h<.22){c.strokeStyle='rgba(80,60,35,.35)';c.lineWidth=1;c.beginPath();const sx=x+4+h*40,sy=y+6+hash(i*13)*16;c.moveTo(sx,sy);c.lineTo(sx+5,sy+4);c.lineTo(sx+3,sy+9);c.moveTo(sx+5,sy+4);c.lineTo(sx+10,sy+3);c.stroke()}
  if(h>.9){c.fillStyle='#8a7d62';c.beginPath();c.ellipse(x+20,y+22,3,2,0,0,7);c.fill()}
}
function drawGrass(c,i,x,y){
  const h=hash(i);
  // マスごとの角丸や別々のグラデーションをやめ、世界全体で色をつなぐ。
  const g=c.createLinearGradient(0,0,W*TS,H*TS);g.addColorStop(0,'#a9ce7b');g.addColorStop(.48,'#9fc571');g.addColorStop(1,'#91b966');c.fillStyle=g;c.fillRect(x,y,TS,TS);
  // 草地にやわらかな色むらと、葉の重なりを足す
  if(h<.62){const a=x+5+hash(i*11)*20,b=y+6+hash(i*13)*20,rad=4+hash(i*17)*4;c.fillStyle=h<.24?'rgba(122,170,83,.12)':'rgba(226,231,151,.13)';c.beginPath();c.ellipse(a,b,rad,2.5+hash(i*19)*2,-.35,0,7);c.fill()}
  if(hash(i*7)<.68){const a=x+7+hash(i*11)*17,b=y+8+hash(i*13)*16;c.fillStyle=hash(i*31)<.5?'#8cb262':'#91b568';c.beginPath();c.ellipse(a,b,1.5,3.2,-.45,0,7);c.ellipse(a+2.8,b-.5,1.5,3.1,.45,0,7);c.ellipse(a+1.4,b-2,1.2,3.5,0,0,7);c.fill();c.strokeStyle='rgba(224,239,171,.36)';c.lineWidth=.65;c.beginPath();c.moveTo(a+1.4,b+1);c.lineTo(a+1.4,b-4);c.stroke()}
  if(h<.09){circ(c,x+8+hash(i*23)*16,y+8+hash(i*29)*16,1.5,h<.035?'#fff3f7':'#ffe27a')}
}
function grassBoundaryEdges(i){if(!REV.has(i)||S.ground[i]===1)return [];const gx=i%W,gy=(i/W)|0;return [[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]].filter(([dx,dy])=>gx+dx>=0&&gy+dy>=0&&gx+dx<W&&gy+dy<H&&!REV.has(i+dy*W+dx)&&S.ground[i+dy*W+dx]!==1&&hiAt(i+dy*W+dx)===hiAt(i))}/* 高さのちがうとなりには、草のふちをのばさない（がけの上と下で、草地がまざらない） */
function grassBoundaryCorners(i){
  const gx=i%W,gy=(i/W)|0,hi0=hiAt(i),at=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&S.ground[y*W+x]!==1&&(hiAt(y*W+x)!==hi0?REV.has(i):REV.has(y*W+x)),corners=[/* 高さのちがうマスは、自分と同じとみなす */
    {cells:[[gx-1,gy-1],[gx,gy-1],[gx-1,gy],[gx,gy]],x:gx*TS,y:gy*TS},
    {cells:[[gx,gy-1],[gx+1,gy-1],[gx,gy],[gx+1,gy]],x:(gx+1)*TS,y:gy*TS},
    {cells:[[gx,gy],[gx+1,gy],[gx,gy+1],[gx+1,gy+1]],x:(gx+1)*TS,y:(gy+1)*TS},
    {cells:[[gx-1,gy],[gx,gy],[gx-1,gy+1],[gx,gy+1]],x:gx*TS,y:(gy+1)*TS}
  ],out=[];
  for(const q of corners){if(q.cells.some(([x,y])=>x<0||y<0||x>=W||y>=H||S.ground[y*W+x]===1))continue;/* 水のマスがまじる角には、草とあれ地の角の絵をおかない（水のそばに土の丸い穴ができるので） */const mask=q.cells.map(([x,y])=>at(x,y)),n=mask.filter(Boolean).length,diagonal=n===2&&mask[0]===mask[3]&&mask[1]===mask[2];if((n!==1&&n!==3&&!diagonal)||!mask.includes(true))continue;const owner=Math.min(...q.cells.filter((_,k)=>mask[k]).map(([x,y])=>y*W+x));if(owner===i)out.push([q.x,q.y])}
  return out
}
function drawGrassBoundary(c,i,x,y){for(const [dx,dy,side] of grassBoundaryEdges(i)){c.save();c.translate(x+(side===1||side===2?TS:0),y+(side>=2?TS:0));c.rotate(side*Math.PI/2);const gx=i%W,gy=(i/W)|0,axis=side===0||side===2?0:1,line=axis?gx+(side===1?1:0):gy+(side===2?1:0),seed=i*137+side*29,world=p=>(axis?gy*TS+p:gx*TS+p),noise=p=>{const z=world(p)/16,a=Math.floor(z),f=z-a,t=f*f*(3-2*f),key=line*7919+axis*104729;return(hash(key+a*374761393)*2-1)*(1-t)+(hash(key+(a+1)*374761393)*2-1)*t},wave=p=>noise(p)*2.6+Math.sin(world(p)*.1+line*1.7)*.55+Math.sin(world(p)*.25+line*2.3)*.2,barren=WD===1?'#a39280':'#b3a37c';c.fillStyle=barren;c.beginPath();c.moveTo(3,-17);c.lineTo(TS-3,-17);c.quadraticCurveTo(TS+1,-10,TS-3,wave(TS-3));for(let p=TS-3;p>=3;p-=2)c.lineTo(p,wave(p));c.quadraticCurveTo(-1,-10,3,-17);c.closePath();c.fill();for(let k=0;k<20;k++){const v=hash(seed*31+k*71),pos=k*1.7-1+hash(seed+k*37)*1.8,depth=2+v*4.3;c.fillStyle=k%4?'#9dc26e':'#8cb262';c.beginPath();c.ellipse(pos,wave(pos)+.6,2+hash(seed+k*17)*1.6,depth*.7,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(pos-1.7,wave(pos));c.quadraticCurveTo(pos-1.7,wave(pos)+depth*.6,pos+(v-.5)*3,wave(pos)+depth+1.5);c.quadraticCurveTo(pos+1.9,wave(pos)+depth*.4,pos+1.7,wave(pos));c.closePath();c.fill()}c.restore()}const radius=4.5;c.fillStyle=WD===1?'#a39280':'#b3a37c';for(const [cx,cy] of grassBoundaryCorners(i)){c.beginPath();c.arc(x+cx-i%W*TS,y+cy-((i/W)|0)*TS,radius,0,Math.PI*2);c.fill()}}
function drawWaterAll(c,X0=0,Y0=0,X1=W-1,Y1=H-1){
  const isW0=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&S.ground[y*W+x]>=1,h=TS/2;/* 浅瀬も水として描く（石は毎コマ上に描く） */let isW=isW0;
  const blob=(r)=>{c.beginPath();for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!isW(x,y))continue;const cx=x*TS+h,cy=y*TS+h;
      const rr=r+hash(y*W+x)*3.5-.5,rb=r-1;c.moveTo(cx+rr,cy);c.arc(cx,cy,rr,0,7);
      if(isW(x+1,y))c.rect(cx,cy-rb,TS,rb*2);if(isW(x,y+1))c.rect(cx-rb,cy,rb*2,TS);
      if(isW(x+1,y)&&isW(x,y+1)&&isW(x+1,y+1))c.rect(cx,cy,TS,TS)}c.fill();
    c.beginPath();for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){const n=isW(x,y)+isW(x+1,y)+isW(x,y+1)+isW(x+1,y+1);if(n!==3)continue;const px=(x+1)*TS,py=(y+1)*TS;c.moveTo(px+r*.9,py);c.arc(px,py,r*.9,0,7)}
    c.fill()};
  const VW2=WD===1;
  if(waterChipsOK()){/* ドット絵：マスの角ごとに、まわり4マスの水のあるなし（16通り）で形をえらぶ */
    const C=window.CHIPS,dc=(k,x,y)=>{const ch=C[k];if(ch)drawChip(c,ch,'water',x,y,0)};
    const corners=(f,k,d=dc)=>{for(let y=Y0;y<=Y1+1;y++)for(let x=X0;x<=X1+1;x++){const b=(f(x-1,y-1)?1:0)|(f(x,y-1)?2:0)|(f(x-1,y)?4:0)|(f(x,y)?8:0);if(b)d(k+':'+b,x*TS,y*TS)}};
    /* 水のふちに、となりの地面をうつす処理はしない（水の下は草地の絵） */

    if(!VW2){const t=document.createElement('canvas'),BAND=12,pti=chipImgs(C['tex:water'],'water')[0];for(let b0=Y0;b0<=Y1;b0+=BAND){const b1=Math.min(Y1,b0+BAND-1);t.width=(X1-X0+1)*TS;t.height=(b1-b0+1)*TS;const tc=t.getContext('2d');tc.setTransform(1,0,0,1,-X0*TS,-b0*TS);const dm=(k,x,y)=>{const ch=C[k];if(ch)drawChip(tc,ch,'water',x,y,0)};for(let y=b0;y<=b1+1;y++)for(let x=X0;x<=X1+1;x++){const b=(isW0(x-1,y-1)?1:0)|(isW0(x,y-1)?2:0)|(isW0(x-1,y)?4:0)|(isW0(x,y)?8:0);if(b)dm('waterm:'+b,x*TS,y*TS)}tc.globalCompositeOperation='source-in';tc.fillStyle=tc.createPattern(pti,'repeat');tc.fillRect(X0*TS,b0*TS,(X1-X0+1)*TS,(b1-b0+1)*TS);c.drawImage(t,X0*TS,b0*TS)}t.width=t.height=0}/* 水面：水の形（waterm）の中だけに、128×128の水のテクスチャをしきつめる */
    corners(isW0,VW2?'waterr':'water');
    if(VW2&&S.st2){const M=sprMap();corners((x,y)=>isW0(x,y)&&springOn(M[y*W+x]),'waterh')}/* よみがえった温泉だけ、乳白色の湯 */
    if(VW2)for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){if(!isW0(x,y))continue;const i=y*W+x,x0=isW0(x-1,y)?2:12,x1=isW0(x+1,y)?18:8,y0=isW0(x,y-1)?4:14,y1=isW0(x,y+1)?28:18;dc('wave#'+((hash(i*5+2)*4)|0),x*TS+x0+hash(i)*Math.max(0,x1-x0)|0,y*TS+y0+hash(i*3)*Math.max(0,y1-y0)|0)}/* さざなみ（水のふちは水の内がわにあるので、ふちにかからない所に） */
    return}
  c.fillStyle=VW2?'#bdb3a2':'#9fc470';blob(h+8);
  c.fillStyle=VW2?'#a69b88':'#86ad5f';blob(h+5);
  c.fillStyle=VW2?'#7d9fb0':'#4fa6dd';blob(h+3);
  c.fillStyle='rgba(255,255,255,.28)';blob(h+3-1.5);c.fillStyle=VW2?'#8fb0bf':'#5db4ea';blob(h+1);
  if(VW2&&S.st2){const M=sprMap();isW=(x,y)=>isW0(x,y)&&springOn(M[y*W+x]);c.fillStyle='#7fcfcf';blob(h+3);c.fillStyle='rgba(255,255,255,.28)';blob(h+1.5);c.fillStyle='#9fe0dc';blob(h+1);isW=isW0}/* よみがえった温泉だけ、乳白色の湯 */
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!isW(x,y))continue;const i=y*W+x,px=x*TS,py=y*TS;c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1.3;c.beginPath();const wx=px+6+hash(i)*10,wy=py+10+hash(i*3)*12;c.moveTo(wx,wy);c.quadraticCurveTo(wx+3,wy-2.5,wx+6,wy);c.quadraticCurveTo(wx+9,wy+2.5,wx+12,wy);c.stroke()}
}
const CSPR={"mugi2":{"w":73,"h":80,"src":"assets/g/19488f6512.webp"},"imo2":{"w":89,"h":80,"src":"assets/g/ac0f2df624.webp"},"mugi1":{"w":40,"h":36,"src":"assets/g/96c4019f1f.webp"},"imo1":{"w":51,"h":36,"src":"assets/g/fed730d1aa.webp"},"mugi":{"w":80,"h":90,"src":"assets/g/9fd1173dcf.webp"},"tomato":{"w":84,"h":76,"src":"assets/g/c905ee98dd.webp"},"imo":{"w":98,"h":90,"src":"assets/g/ec2d14bb42.webp"},"sprout":{"w":42,"h":40,"src":"assets/g/0d994d8d66.webp"}};
for(const k in CSPR){const g=CSPR[k];g.img=new Image();g.img.onload=()=>{g.ok=1};g.img.src=g.src}
function drawCrop(c,k,x,y,g,big){const s=Math.min(1,g/100),st=g>=100?3:s>=.6?2:s>0?1:0;
  if(big){const rp=CSPR[k]||CSPR.mugi;if(st===3&&rp.ok){const h=30,w=h*rp.w/rp.h;c.drawImage(rp.img,x+16-w/2,y+27-h,w,h);return}{const sp=CSPR[(CSPR[k+'1']?k:'mugi')+st];if(st&&st<3&&sp&&sp.ok){const h=st===1?13:27,w=h*sp.w/sp.h;c.drawImage(sp.img,x+16-w/2,y+(st===1?20:27)-h,w,h);return}}if(st&&st<3){const z=st===1?.75:1.25,bx=x+16,by=y+19;c.save();c.translate(bx,by);c.scale(z,z);c.fillStyle='#6fae4f';rr(c,-1.1,-9,2.2,9.5,1.1);c.fillStyle='#86c463';c.beginPath();c.ellipse(-5,-10,5.4,3.4,-.45,0,7);c.fill();c.beginPath();c.ellipse(5,-10.5,5.4,3.4,.45,0,7);c.fill();c.fillStyle='#9fd47c';c.beginPath();c.ellipse(-5.6,-11,2.6,1.3,-.45,0,7);c.fill();c.beginPath();c.ellipse(4.4,-11.5,2.6,1.3,.45,0,7);c.fill();c.restore();return}}const pts=big?[[16,18]]:[[8,10],[16,10],[24,10],[8,19],[16,19],[24,19],[8,28],[16,28],[24,28]];
  for(const[mx,my]of pts){const px=x+mx,py=y+my,sc=big?2.2:1;
    if(st===1){c.fillStyle='#7fd06a';c.fillRect(px-.5*sc,py-2.5*sc,1*sc,2.5*sc);c.beginPath();c.ellipse(px-1.4*sc,py-2.8*sc,1.4*sc,.8*sc,-.5,0,7);c.ellipse(px+1.4*sc,py-2.8*sc,1.4*sc,.8*sc,.5,0,7);c.fill();continue}
    if(k==='mugi'){if(st===2){c.fillStyle='#5fb34a';c.fillRect(px-1.6*sc,py-6*sc,1*sc,6*sc);c.fillRect(px+.6*sc,py-7*sc,1*sc,7*sc);c.fillRect(px-.4*sc,py-5*sc,1*sc,5*sc)}
      else{c.fillStyle='#b8923a';c.fillRect(px-.5*sc,py-7*sc,1*sc,7*sc);c.fillStyle='#f2cf5a';c.fillRect(px-1.5*sc,py-10*sc,3*sc,4.5*sc);c.fillStyle='#ffe58a';c.fillRect(px-.8*sc,py-9.5*sc,1*sc,2*sc);c.fillStyle='#d9ae3a';c.fillRect(px+1.5*sc,py-9*sc,.6*sc,3*sc)}}
    else if(k==='tomato'){c.fillStyle='#3f8a35';c.fillRect(px-.6*sc,py-6*sc,1.2*sc,6*sc);circ(c,px-2*sc,py-5*sc,1.9*sc,'#58b548');circ(c,px+2*sc,py-6*sc,1.9*sc,'#58b548');circ(c,px,py-7.5*sc,1.7*sc,'#6cc75a');
      if(st===2){circ(c,px+1.6*sc,py-2.4*sc,1.3*sc,'#a6d86a')}else{circ(c,px+1.6*sc,py-2*sc,2.4*sc,'#e8463a');circ(c,px-1.8*sc,py-1.4*sc,1.9*sc,'#f05a40');circ(c,px+1*sc,py-2.8*sc,.7*sc,'#ffc0b0')}}
    else{if(st===3){c.fillStyle='#9a5a32';c.beginPath();c.ellipse(px,py,3.2*sc,2*sc,0,0,7);c.fill();c.fillStyle='#c27a48';c.beginPath();c.ellipse(px-.6*sc,py-.4*sc,1.4*sc,.7*sc,0,0,7);c.fill()}
      const r=st===2?1.9:2.3;circ(c,px-1.8*sc,py-3*sc,r*sc,st===3?'#4f9a40':'#5aa84a');circ(c,px+1.8*sc,py-3.6*sc,r*sc,st===3?'#62b252':'#6cbf55');circ(c,px,py-5*sc,(r-.3)*sc,'#78cc62')}}}
// 壁・ドアのマスのふちに、となりの床をのばして描く
const ROADF=new Set(['path','gravel','woodpath','stone','brick']);
const shU=(c,i,iso)=>c._shU!=null?c._shU:!iso&&HOME_WALLS.has(S.obj[i-W]);/* 床の上はしの「壁の下のかげ」を描くか（壁の下にのばす床は、となりの床マスに合わせる） */
function wallMarg(c,i,x,y){const isW=k=>HOME_WALLS.has(typeAt(k))||HOME_DOORS.has(typeAt(k));const door=HOME_DOORS.has(S.obj[i]);
  {const fl=k=>S.floor[k]&&!ROADF.has(S.floor[k])&&!isW(k);/* 道（砂利・石など）は家の床とみなさない */
      const fr=door&&(isW(i-1)||isW(i+1)),dirs=door?[[-1,0,0,16,32],[1,16,0,16,32],[-W,0,0,32,fr?30:16],[W,0,fr?30:16,32,fr?2:16]].filter(d=>fl(i+d[0])):/* ドアの下は、家の中がわだけ床。外がわは外の地面のまま。正面のあるドア（よこの壁のドア）は、上の床をしきいの上の面の下まで（y+30）のばす（開いたときに外の地面が見えないように）。下の床は、しきいの下（y+30〜）だけ（上の壁のドアを開くと、外の地面だけが見える） */[[-1,0,0,16,32],[1,16,0,16,32],[-W,0,0,32,16],[W,0,16,32,16],[-W-1,0,0,16,16],[-W+1,16,0,16,16],[W-1,0,16,16,16],[W+1,16,16,16,16]].filter(d=>fl(i+d[0]));
      for(const sh of [false,true]){const D=dirs.filter(d=>HOME_WALLS.has(typeAt(i+d[0]-W))===sh);if(!D.length)continue;c.save();c.beginPath();for(const d of D)c.rect(x+d[1],y+d[2],d[3],d[4]);c.clip();c._shU=sh;drawFloor(c,S.floor[i+D[0][0]],x,y,i,true);c._shU=null;c.restore()}}/* となりの床マスの上が壁なら、床と同じ「壁の下のかげ」も、壁の下までつなげる */
}
// 道は、同じ種類どうしだけつながる（ちがう種類の道は、べつの道としてふちをかく）。マップのはし・水とはつながらない
function roadLinks(i,iso){const gx=i%W,gy=(i/W)|0,me=S.floor[i],wl=me==='path'||me==='gravel',has=(x,y)=>!iso&&x>=0&&y>=0&&x<W&&y<H&&(S.ground[y*W+x]!==1&&ROADF.has(me)&&(S.floor[y*W+x]===me||slopeFrom(y*W+x)===i||slopeExit(y*W+x)===i&&S.floor[slopeFrom(y*W+x)]===me));return {L:has(gx-1,gy),R:has(gx+1,gy),U:has(gx,gy-1),D:has(gx,gy+1)}}
function slopeExit(k){/* k が坂の低いほうのはしのマスなら、坂をおりた先のマス。ちがえば -1（おりた先の道も、坂へつづける） */const a=stairOf(k);if(a<0||!SLOPES.has(S.obj[a]))return -1;const d=stairDir(a);if(d<0)return -1;const lo=d===0?a:stairOut(a,d);return k===lo?lo+SDIR[d][1]*W+SDIR[d][0]:-1}
function slopeFrom(k){/* k が坂（のマス）なら、その坂をのぼった先の高いマス。ちがえば -1（のぼった先の道は、坂へつづける） */const a=stairOf(k);if(a<0||!SLOPES.has(S.obj[a]))return -1;const d=stairDir(a);return d<0?-1:stairTop(a,d)}
function roadCorners(i,iso){const gx=i%W,gy=(i/W)|0,q=roadLinks(i,iso),has=(dx,dy)=>!iso&&gx+dx>=0&&gy+dy>=0&&gx+dx<W&&gy+dy<H&&S.ground[i+dy*W+dx]!==1&&S.floor[i+dy*W+dx]===S.floor[i];return [q.L&&q.U&&!has(-1,-1),q.R&&q.U&&!has(1,-1),q.R&&q.D&&!has(1,1),q.L&&q.D&&!has(-1,1)]}
function roadInnerEdges(c,id,x,y,i,iso){if(id==='path'||id==='gravel'||id==='woodpath')return;const colors={path:['#bb925e','#d4b07a'],gravel:['#938775','#c2b7a1'],stone:['#817d73','#c0bdb4'],brick:['#956353','#d8a784']},p=colors[id],corners=roadCorners(i,iso);for(let k=0;k<4;k++){if(!corners[k])continue;c.save();c.translate(x+(k===1||k===2?TS:0),y+(k>=2?TS:0));c.rotate(k*Math.PI/2);const band=(outer,inner)=>{c.beginPath();c.arc(0,0,outer,0,Math.PI/2);c.lineTo(0,inner);c.arc(0,0,inner,Math.PI/2,0,true);c.closePath();c.fill()};c.fillStyle=p[0];band(9,0);c.fillStyle=p[1];band(8,2);c.restore()}}
function roadMaterialEdge(c,id,x,y,q){
  // Soil stays a continuous earthen rim; other surfaces use matching edging pieces.
  if(id==='path'||id==='gravel'||id==='woodpath')return;
  const palette=id==='brick'?['#cc9a78','#d8a784','#efcba6','#ab8065']:id==='stone'?['#aaa79f','#c0bdb4','#e5e1d7','#858278']:['#aba08a','#c2b7a1','#e0d6c2','#8d826e'];
  const piece=(bx,by,w,h,k)=>{c.fillStyle=palette[k%2];if(id==='gravel'){c.beginPath();c.ellipse(bx+w/2,by+h/2,w/2,h/2,0,0,Math.PI*2);c.fill();c.fillStyle=palette[2];c.beginPath();c.ellipse(bx+w*.42,by+h*.35,w*.23,h*.15,0,0,Math.PI*2);c.fill()}else{rr(c,bx,by,w,h,id==='stone'?1.8:1);c.fillStyle=palette[2];c.fillRect(bx+.6,by+.5,w-1.2,1);c.fillStyle=palette[3];c.fillRect(bx+.6,by+h-1,w-1.2,.7)}};
  const step=16;for(let k=0;k<TS/step;k++){const p=k*step+.2,len=step-.4;if(!q.U)piece(x+p,y+2,len,6.5,k);if(!q.D)piece(x+p,y+TS-8.5,len,6.5,k);const top=Math.max(p,q.U?0:9),bottom=Math.min(p+len,q.D?TS:TS-9);if(bottom-top>1){if(!q.L)piece(x+2,y+top,6.5,bottom-top,k);if(!q.R)piece(x+TS-8.5,y+top,6.5,bottom-top,k)}}
}

function roadTerrain(k,iso){if(iso||REV.has(k))return {grass:true,base:'#9dc26e',shade:'#8cb262'};return {grass:false,base:WD===1?'#a39280':'#b3a37c',shade:WD===1?'#938270':'#a39470'}}
function roadGrassEdge(c,id,x,y,i,q,iso){if(id!=='path'&&id!=='gravel'&&id!=='woodpath')return;const gx=i%W,gy=(i/W)|0,terrain=(dx,dy)=>{if(!iso&&(gx+dx<0||gy+dy<0||gx+dx>=W||gy+dy>=H))return null;const j=i+dy*W+dx;return !iso&&(S.ground[j]===1||S.floor[j])?null:roadTerrain(j,iso)};
  const fringe=(px,py,a,seed,t)=>{c.save();c.translate(px,py);c.rotate(a);for(let k=0;k<20;k++){const v=hash(seed*31+k*71),pos=k*1.7-1+hash(seed+k*37)*1.8,depth=2+v*4.3;c.fillStyle=t.base;c.beginPath();c.ellipse(pos,.6,2+hash(seed+k*17)*1.6,depth*.7,0,0,Math.PI*2);c.fill();if(t.grass){c.fillStyle=k%4?t.base:t.shade;c.beginPath();c.moveTo(pos-1.7,0);c.quadraticCurveTo(pos-1.7,depth*.6,pos+(v-.5)*3,depth+1.5);c.quadraticCurveTo(pos+1.9,depth*.4,pos+1.7,0);c.closePath();c.fill()}else if(v>.65){c.fillStyle=t.shade;c.beginPath();c.ellipse(pos,1+v*2,.7+v,.5+v*.4,v,0,Math.PI*2);c.fill()}}c.restore()};
  for(const [open,dx,dy,px,py,a] of [[!q.U,0,-1,x,y+2,0],[!q.D,0,1,x+TS,y+TS-2,Math.PI],[!q.L,-1,0,x+2,y+TS,-Math.PI/2],[!q.R,1,0,x+TS-2,y,Math.PI/2]]){const t=open&&terrain(dx,dy);if(t)fringe(px,py,a,i*97+(dx+2)*11+dy*7,t)}
  roadCorners(i,iso).forEach((v,k)=>{if(!v)return;const dx=k===0||k===3?-1:1,dy=k<2?-1:1,t=terrain(dx,dy);if(!t)return;c.save();c.translate(x+(dx>0?TS:0),y+(dy>0?TS:0));c.rotate(k*Math.PI/2);for(let n=0;n<9;n++){const a=n*Math.PI/16,r=2+hash(i+n*41)*2.5;c.fillStyle=t.base;c.beginPath();c.ellipse(Math.cos(a)*r,Math.sin(a)*r,2,2.5,a,0,Math.PI*2);c.fill()}c.restore()})
}

function roadShape(c,x,y,q){const l=x+(q.L?0:2),r=x+TS-(q.R?0:2),t=y+(q.U?0:2),b=y+TS-(q.D?0:2),tl=!q.L&&!q.U?6:0,tr=!q.R&&!q.U?6:0,br=!q.R&&!q.D?6:0,bl=!q.L&&!q.D?6:0;c.beginPath();c.moveTo(l+tl,t);c.lineTo(r-tr,t);c.quadraticCurveTo(r,t,r,t+tr);c.lineTo(r,b-br);c.quadraticCurveTo(r,b,r-br,b);c.lineTo(l+bl,b);c.quadraticCurveTo(l,b,l,b-bl);c.lineTo(l,t+tl);c.quadraticCurveTo(l,t,l+tl,t);c.closePath()}
function drawFloorChip(c,id0,x,y,i,iso){const C=window.CHIPS;if(!C)return false;const gx=i%W,gy=(i/W)|0,flat=id0==='brickfloor'||id0==='stonefloor',id=flat?(id0==='brickfloor'?'brick':'stone'):id0;
  const base=id==='carpet'?C.carpet:C[(id==='woodpath'?'floor':id0==='stonefloor'?'stonefloor':id)/* 木の道：絵ができるまでは、フローリングの絵。石の床は、石畳とはべつの絵 */+'#'+(id==='path'||id==='gravel'?((hash(i*13+5)*4)|0):id0==='stonefloor'?(gx%4)+(gy%4)*4:(gx%2)+(gy%2)*2)];/* 石の床は4×4マスでつながる絵 */if(!base||!chipImgs(base,id)[0].ok)return false;/* 床のもよう：土・砂利は4しゅるい、石・レンガ・板は2×2マスでつながる絵 */
  const road=!flat&&ROADF.has(id),q=road?roadLinks(i,iso):null,edged=id==='stone'||id==='brick';if(road){c.save();if(!edged){roadShape(c,x,y,q);c.clip()}}/* 石畳・レンガ道は1マスぴったりのはば（へりはマスのふちまで）。あぜ道・砂利道は、ふちを少しまるく */
  drawChip(c,base,id,x,y,0,i);
  if(id==='carpet'&&c._shU==null){const same=k=>!iso&&S.floor[k]==='carpet';/* 壁の下にのばすじゅうたん（wallMarg）には、ふちを描かない */for(const[s,k]of[['U',i-W],['D',i+W],['L',i-1],['R',i+1]])if(!same(k)&&C['carpet:'+s])drawChip(c,C['carpet:'+s],id,x,y,0,i)}/* じゅうたんのふち */
  if(road){const cn=roadCorners(i,iso);
    if(id==='stone'||id==='brick'){const m=(q.L?1:0)|(q.R?2:0)|(q.U?4:0)|(q.D?8:0);if(m<15&&C[id+':'+m])drawChip(c,C[id+':'+m],id,x,y,0,i);cn.forEach((v,k)=>{if(v&&C[id+':c'+k])drawChip(c,C[id+':c'+k],id,x,y,0,i)})}/* 道のふちの石・内がわの角 */
    else{const tr=(dx,dy)=>{const j=i+dy*W+dx;if(!iso&&(gx+dx<0||gy+dy<0||gx+dx>=W||gy+dy>=H))return null;if(!iso&&(S.floor[j]||hiAt(j)!==hiAt(i)))return null;if(!iso&&S.ground[j]>=1){const t=roadTerrain(i,iso);return t.grass?'g':WD===1?'r':'d'}/* となりが水：水ぎわのすきまに見える地面（このマスの地面）のふちを、ほかのはしと同じに *//* 高さのちがうマスの地面は、道のふちに出さない */const t=roadTerrain(j,iso);return t.grass?'g':WD===1?'r':'d'};
      for(const[s,open,dx,dy]of[['U',!q.U,0,-1],['D',!q.D,0,1],['L',!q.L,-1,0],['R',!q.R,1,0]]){const t=open&&tr(dx,dy);if(t&&C['fringe'+t+':'+s])drawChip(c,C['fringe'+t+':'+s],id,x,y,0,i)}
      cn.forEach((v,k)=>{if(!v)return;const t=tr(k===0||k===3?-1:1,k<2?-1:1);if(t&&C['fringe'+t+':c'+k])drawChip(c,C['fringe'+t+':c'+k],id,x,y,0,i)})}/* 草・地面とのさかい */
    c.restore()}
  if(shU(c,i,iso)&&!road&&id!=='floor'){c.fillStyle='rgba(60,30,10,.2)';c.fillRect(x,y,TS,4)}/* 壁の下のかげ */
  return true}
function drawFloor(c,id,x,y,i,iso){
  if(!c._chip&&drawFloorChip(c,id,x,y,i,iso))return;/* ドット絵があれば、それを使う */
  const n=k=>!iso&&!!S.floor[k],gx=i%W,gy=(i/W)|0;
  const flat=id==='brickfloor'||id==='stonefloor';if(flat)id=id==='brickfloor'?'brick':'stone';/* 家の床は、道と同じ絵で、道のふち・つなぎはなし */
  const road=!flat&&ROADF.has(id),links=road?roadLinks(i,iso):null;if(road){c.save();roadShape(c,x,y,links);c.clip()}/* 縁の外には、床の絵をはみ出させない */
  if(id==='path'){c.fillStyle='#e6c48c';c.fillRect(x,y,TS,TS);
    c.fillStyle='#d4b07a';c.beginPath();c.ellipse(x+9+hash(i)*12,y+11+hash(i+5)*6,4.5,2.6,0,0,7);c.fill();c.beginPath();c.ellipse(x+20,y+21+hash(i+3)*5,3.5,2.2,0,0,7);c.fill();c.fillStyle='rgba(255,250,235,.45)';c.beginPath();c.ellipse(x+14+hash(i+7)*8,y+16,2.5,1.4,0,0,7);c.fill()}
  else if(id==='floor'){const fw=k=>!iso&&(HOME_WALLS.has(typeAt(k))||HOME_DOORS.has(typeAt(k)))&&!S.floor[k],same=k=>n(k)&&S.floor[k]===id||fw(k),L=same(i-1),R2=same(i+1),U=same(i-W),D=same(i+W);/* 板目は座標に合わせて並べ、隣の床へ連続させる */
    c.save();c.beginPath();c.rect(x,y,TS,TS);c.clip();c.fillStyle='#805536';c.fillRect(x,y,TS,TS);
    const gx0=gx*TS,gy0=gy*TS,rh=TS/3;
    for(let row=0;row<3;row++){const gyLine=gy0+row*rh,rowId=Math.floor(gyLine/rh),off=(rowId%2)*TS,first=Math.floor((gx0-off)/(TS*2))*(TS*2)+off;
      for(let bx=first;bx<gx0+TS;bx+=TS*2){const l=x+Math.max(0,bx-gx0),r=x+Math.min(TS,bx+TS*2-gx0);if(r<=l)continue;const py=y+row*rh+1,h=rh-2;
        c.fillStyle='#bd8756';rr(c,l,py,r-l,h,1.4);c.fillStyle=row%2?'#d8a36d':'#d3a06c';rr(c,l+.7,py+.6,r-l-1.4,h-1.2,1.1);
        c.fillStyle='rgba(255,235,196,.42)';c.fillRect(l+1,py+1,r-l-2,.8);c.fillStyle='rgba(105,62,34,.22)';c.fillRect(l+1,py+h-1,r-l-2,.8);
        const grain=x+((hash(rowId*31+Math.floor(bx/TS))*Math.max(3,r-l-8))|0)+4;c.fillStyle='rgba(138,83,47,.22)';rr(c,grain,py+h*.55,Math.min(8,r-l-6),.8,.4);
      }}
    if(!iso){c.fillStyle='#8b603e';if(!L)c.fillRect(x,y,1.4,TS);if(!R2)c.fillRect(x+TS-1.4,y,1.4,TS);if(!U)c.fillRect(x,y,TS,1.2);if(!D)c.fillRect(x,y+TS-1.2,TS,1.2)}c.restore();if(shU(c,i,iso)){c.fillStyle='rgba(60,30,10,.22)';c.fillRect(x,y,TS,5)}}
  else if(id==='herrfloor'){const b=4,r=4,P=2*r*b,wp=i!=null&&!ICON,gx0=wp?gx*TS:0,gy0=wp?gy*TS:0;/* 壁の下へのばす床（iso）も、同じ世界の座標でつなげる *//* ヘリンボーン：よこ板（4×1）とたて板（1×4）を、ななめの階段にならべる。世界の座標でならべて、となりの床とつなげる */
    c.save();c.beginPath();c.rect(x,y,TS,TS);c.clip();c.fillStyle='#321f14';c.fillRect(x,y,TS,TS);
    const pl=(px,py,w,h,k)=>{const l=x+px-gx0,t=y+py-gy0;if(l>x+TS||t>y+TS||l+w<x||t+h<y)return;c.fillStyle=['#4a2a1a','#522d1d','#5a321f'][(hash(k)*3)|0];c.fillRect(l,t,w-1,h-1);c.fillStyle='rgba(134,85,47,.4)';if(w>h)c.fillRect(l,t,w-1,1);else c.fillRect(l,t,1,h-1)};/* すきま・つやは1ドットの線（地面の下絵と、壁ぎわの毎コマの絵で、見た目がそろうように） */
    for(let n=Math.floor(gy0/b)-r-1;n*b<=gy0+TS;n++)for(let m=Math.floor((gx0-n*b-r*b)/P);n*b+m*P<=gx0+TS;m++){const ox=n*b+m*P,k=n*7919+m*104729;pl(ox,n*b,r*b,b,k);pl(ox,n*b+b,b,r*b,k+1)}
    c.restore();if(shU(c,i,iso)){c.fillStyle='rgba(30,15,8,.25)';c.fillRect(x,y,TS,5)}}
  else if(id==='carpet'){const same=k=>!iso&&S.floor[k]==='carpet',L=same(i-1),R2=same(i+1),U=same(i-W),D=same(i+W);c.fillStyle='#8b4543';c.fillRect(x,y,TS,TS);c.fillStyle='#a95753';rr(c,x+1,y+1,TS-2,TS-2,3);c.fillStyle='#dfb77d';if(!U)c.fillRect(x+2,y+2,TS-4,1.6);if(!D)c.fillRect(x+2,y+TS-3.6,TS-4,1.6);if(!L)c.fillRect(x+2,y+2,1.6,TS-4);if(!R2)c.fillRect(x+TS-3.6,y+2,1.6,TS-4);
    c.save();c.beginPath();c.rect(x+3,y+3,TS-6,TS-6);c.clip();c.strokeStyle='rgba(247,208,148,.25)';c.lineWidth=.7;for(let k=0;k<7;k++){const px=x+5+k*4;c.beginPath();c.moveTo(px,y+4);c.lineTo(px+2,y+TS-4);c.stroke()}c.strokeStyle='rgba(107,45,48,.24)';for(let k=0;k<7;k++){const py=y+5+k*4;c.beginPath();c.moveTo(x+4,py);c.lineTo(x+TS-4,py+1);c.stroke()}c.restore();
    c.fillStyle='#f0d29e';c.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2,r=k%2?3.2:6;c.lineTo(x+16+Math.cos(a)*r,y+16+Math.sin(a)*r)}c.closePath();c.fill();circ(c,x+16,y+16,1.5,'#8a4947');if(shU(c,i,iso)){c.fillStyle='rgba(60,30,10,.2)';c.fillRect(x,y,TS,4)}}
  else if(id==='gravel'){c.fillStyle='#b9ad97';c.fillRect(x,y,TS,TS);
    for(let k=0;k<14;k++){const px=x+3+hash(i*7+k)*26,py=y+3+hash(i*11+k*3)*26,r=1+hash(i+k*5)*1.6;c.fillStyle=k%3?'#d8cfbe':'#9c917c';c.beginPath();c.ellipse(px,py,r*1.3,r,0,0,7);c.fill()}}
  else if(id==='brick'){c.fillStyle='#a66e5a';c.fillRect(x,y,TS,TS);for(let row=0;row<4;row++){const off=row%2?8:0;for(let k=-1;k<3;k++){const bx=x+k*16+off,w=15;const l=Math.max(x,bx+.5),r2=Math.min(x+TS,bx+w);if(r2<=l)continue;c.fillStyle=(row+k+((i*3)%2))%3?'#cb8164':'#c17760';c.fillRect(l,y+row*8+.5,r2-l,7);c.fillStyle='rgba(255,220,190,.25)';c.fillRect(l,y+row*8+.5,r2-l,1.2)}}}
  else if(id==='stone'){c.fillStyle='#a8a59d';c.fillRect(x,y,TS,TS);const t=(a,b,w,h2,k)=>{c.fillStyle=k?'#d6d3cc':'#cbc8c0';rr(c,x+a,y+b,w,h2,3);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x+a+2,y+b+1.5,w-4,1.5);c.fillStyle='rgba(90,85,78,.22)';c.fillRect(x+a+1.5,y+b+h2-2,w-3,1.5)};
    if(hash(i)<.5){t(1,1,17,13,1);t(19,1,12,9,0);t(19,11,12,10,1);t(1,15,10,16,0);t(12,15,6,16,1);t(19,22,12,9,0)}else{t(1,1,11,11,0);t(13,1,18,9,1);t(1,13,16,9,1);t(18,11,13,11,0);t(1,23,13,8,0);t(15,23,16,8,1)}}
  {const key={floor:'floor-wood-render',stone:'floor-stone-render',brick:'floor-brick-render'}[id],art=key&&HOUSEART[key];if(art&&art.complete&&art.naturalWidth){const sample=32,cols=art.naturalWidth/sample,rows=art.naturalHeight/sample;c.drawImage(art,(gx%cols)*sample,(gy%rows)*sample,sample,sample,x,y,TS,TS)}}
  if(flat&&shU(c,i,iso)){c.fillStyle='rgba(60,30,10,.2)';c.fillRect(x,y,TS,4)}
  if(road){roadMaterialEdge(c,id,x,y,links);roadInnerEdges(c,id,x,y,i,iso);roadGrassEdge(c,id,x,y,i,links,iso);c.restore()}/* 道のふち：土・砂利は草との境、レンガ・石畳はふちどりの石 */

}
function blob(c,col,pts){c.fillStyle=col;c.beginPath();const n=pts.length;for(let k=0;k<n;k++){const a=pts[k],b=pts[(k+1)%n],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;if(k===0)c.moveTo(mx,my);else c.quadraticCurveTo(a[0],a[1],mx,my)}const a=pts[0],b=pts[1];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);c.fill()}
function tuft(c,x,y,s,col){c.fillStyle=col||'#8cc26a';for(const[dx,h,r]of[[-3,7,-.35],[0,9,0],[3,6,.4]]){c.save();c.translate(x+dx*s,y);c.rotate(r);c.beginPath();c.moveTo(-1.6*s,0);c.quadraticCurveTo(-1.4*s,-h*s*.6,0,-h*s);c.quadraticCurveTo(1.4*s,-h*s*.6,1.6*s,0);c.fill();c.restore()}}
function crate(c,x,y){c.fillStyle='#a8703f';rr(c,x+3,y+15,26,14,3);c.fillStyle='#c98f5c';rr(c,x+5,y+16,22,12,2);c.fillStyle='#b57d4b';c.fillRect(x+5,y+21,22,1.6);c.fillStyle='#d9a46e';c.fillRect(x+5,y+16,22,2);c.fillStyle='#9a6638';rr(c,x+3,y+14,4,15,1.5);rr(c,x+25,y+14,4,15,1.5);c.fillStyle='#b88050';rr(c,x+3,y+14,26,3,1.5)}
const TCR='#efe7d8',TCD='#d9cdb8',TCS='#c7b9a0',TGO='#d8a943',TBL='#5b8fd6',TBL2='#8fbaf0';
function tBase(c,x,y){c.fillStyle=TCS;rr(c,x-1,y+21,TS+2,10,3);c.fillStyle=TCD;rr(c,x-1,y+19,TS+2,7,3);c.fillStyle=TCR;rr(c,x,y+18,TS,4,2)}
function tStar(c,cx,cy,r){c.fillStyle=TGO;c.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2,rr2=k%2?r*.38:r;c.lineTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2)}c.closePath();c.fill();circ(c,cx,cy,r*.22,TBL)}
function tBanner(c,x,y,h,now){const w=Math.sin((now||0)/600+x)*1;c.fillStyle='#8a5a33';c.fillRect(x-.8,y-2,1.6,h+10);circ(c,x,y-3,1.6,TGO);c.fillStyle=TBL;c.beginPath();c.moveTo(x+1,y);c.lineTo(x+8,y+w*.3);c.lineTo(x+8+w*.5,y+h);c.lineTo(x+4.5,y+h-3);c.lineTo(x+1,y+h);c.closePath();c.fill();c.fillStyle=TGO;c.fillRect(x+3.6,y+h*.4-1.6,1.6,3.2);c.fillRect(x+2.8,y+h*.4-.8,3.2,1.6)}
// 見た目だけ1.5倍にするもの（当たり判定・置けるマスはそのまま）
const ART={"fl_salvia": {"w": 91, "h": 96, "src": "assets/g/106ba40c68.webp"}, "fl_lily": {"w": 106, "h": 96, "src": "assets/g/103f17950d.webp"}, "fl_clover": {"w": 91, "h": 96, "src": "assets/g/c8b2295da8.webp"}, "fl_lotus": {"w": 150, "h": 96, "src": "assets/g/5d30b7be2f.webp"}, "fl_bell": {"w": 116, "h": 96, "src": "assets/g/8618f36cec.webp"}, "tree": {"w": 140, "h": 140, "src": "assets/g/88a858c5e3.webp"}, "bush": {"w": 146, "h": 96, "src": "assets/g/7e209f4d1b.webp"}, "dead": {"w": 138, "h": 140, "src": "assets/g/8c9a3ef253.webp"}, "rock": {"w": 122, "h": 96, "src": "assets/g/9c4f9195d8.webp"}, "bag": {"w": 88, "h": 96, "src": "assets/g/c045f0c58f.webp"}};/* ユーザー提供の花・木・岩・茂み・たね袋 */
for(const k in ART){const a=ART[k];a.img=new Image();a.img.onload=()=>{a.ok=true;artLoaded()};a.img.onerror=()=>{a.bad=true};a.img.src=a.src}
const BIG2=new Set(['windmill','statue']);/* 見張り台は2×2マスにぴったりの大きさ（拡大しない） */// 見た目2倍
const TREES=new Set(['tree','ntree','fruit','deadtree']);// 木はさらに1.5倍
const SPR_OBJ=new Set(['lumber','quarry','well','puddle','spike','firetrap','gust']);
const BIG=new Set(['table','clover','bellf','salvia','lily','lotus','tree','fruit','rock','deadtree','ntree','berry','grave','stor','mbox','oven','lamp','campfire','swing','torch','vane','kamizo','lighthouse','chair','achair','stool']);const BIGK={oven:1.2,campfire:1.2,kamizo:2,lighthouse:2,table:1.125,chair:1.125,achair:.75,stool:.75};/* 大きさの判定はそのままで、見た目だけ：いすは1.125倍、ほかの椅子とスツールは0.75倍 *//* 食卓・椅子・つぼ・石のオブジェは1マスぴったり。かまど・たき火は少しだけ大きく */// 罠は1マスぴったりなので大きくしない
/* 新しい家具（スクリプトで描く）。マスの左上が (x,y)、足もとは y+30 */
const F2C={wd:'#c08a58',wdD:'#8a5a36',wdL:'#dcae7c',ol:'#6e4a2e',cr:'#f7eedb',crD:'#e3d3b2',gr:'#8cc06a',grD:'#5e9a4a',pk:'#f2b5b5',bl:'#a8c8e6',st:'#c9c3b8',stD:'#9d968b'};
function f2rr(c,x,y,w,h,r,f,s){c.beginPath();c.roundRect(x,y,w,h,r);if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=1;c.stroke()}}
function f2leaf(c,x,y,rx,ry,a,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fill()}
function f2pot(c,x,y,w){f2rr(c,x-w/2,y-w*.75,w,w*.75,2,'#c98a5a',F2C.ol);c.fillStyle='#b5764a';c.fillRect(x-w/2,y-w*.75,w,2)}
function f2flower(c,x,y,col){for(let a=0;a<5;a++)circ(c,x+Math.cos(a*1.26)*1.6,y+Math.sin(a*1.26)*1.6,1.3,col);circ(c,x,y,.9,'#ffd35c')}
/* 生垣の絵：お手本を切って、まわりのつながり方（左右上下）ごとに16マスぶん並べた画像 */
function spOK(k){const m=HOUSEART[k];return m&&m.complete&&m.naturalWidth>0}
function spTile(c,k,m,x,y,ICON,dn,fi,vo){if(dn==null)dn=m&8;if(fi==null)fi=m;const im=HOUSEART[k];if(ICON){c.drawImage(im,m*120,0,120,144,x+5,y-1,22,33);return}
  /* 高さは0.8倍で、どのマスも同じ大きさ・同じ位置にかく（ふちの高さがそろう）。下につながるマスは、下のマスとのすきまを、絵の下のはしをのばしてうめる */
  if(dn){c.drawImage(im,m*120,0,120,96,x-.2,y-2.8,32.4,32.6);return}/* 下につながるマスは、上のふちの位置はそのままで、下のマスまで絵をのばす */c.drawImage(im,m*120,0,120,96,x-.2,y-2.8,32.4,25.8);c.drawImage(im,fi*120,96,120,48,x-.2,y+23,32.4,12.8)}
const inHouseL=(i,ICON)=>!ICON&&i!=null&&!!roomOf(i);/* 家の中の灯りは、灯りそのもののぼんやりした光をかかない（家ぜんたいが光る） */
function drawF2(c,id,x,y,i,now){const C=F2C,cx=x+16,T=(now||0)/1000;
  const sh=(w,h)=>{if(!c._onWall)shadow(c,cx,y+29,w,h||3)};
  switch(id){
  case'stool':sh(8);c.fillStyle=C.wdD;for(const dx of[-6,0,6])c.fillRect(cx+dx-1,y+17,2.4,12);f2rr(c,cx-9,y+13,18,6,3,C.wd,C.ol);c.fillStyle=C.wdL;c.fillRect(cx-7,y+14,10,1.5);break;
  case'achair':case'sofa1':{const body=id==='sofa1'?C.cr:'#f3ead6';sh(12);c.fillStyle=C.wdD;c.fillRect(cx-10,y+25,3,4);c.fillRect(cx+7,y+25,3,4);
    f2rr(c,cx-11,y+4,22,17,6,body,C.crD);f2rr(c,cx-13,y+12,6,14,3,body,C.crD);f2rr(c,cx+7,y+12,6,14,3,body,C.crD);f2rr(c,cx-8,y+17,16,9,3,'#fffaf0',C.crD);
    if(id==='sofa1'){c.save();c.translate(cx-2,y+12);c.rotate(-.25);f2rr(c,-5,-4,10,8,2.5,'#9fb4be','#7f949e');c.restore()}else f2rr(c,cx-5,y+8,10,7,3,'#fffaf0');break}
  case'pouf':sh(10);c.fillStyle=C.cr;c.beginPath();c.ellipse(cx,y+22,10,7,0,0,7);c.fill();c.strokeStyle=C.crD;c.stroke();c.fillStyle='#fffaf0';c.beginPath();c.ellipse(cx,y+18,9,4.5,0,0,7);c.fill();c.strokeStyle=C.crD;for(const a of[-.6,0,.6]){c.beginPath();c.moveTo(cx,y+18);c.lineTo(cx+Math.sin(a)*9,y+27);c.stroke()}circ(c,cx,y+18,1.4,C.crD);break;
  case'stable':sh(9);c.fillStyle=C.wdD;c.fillRect(cx-1.5,y+16,3,12);c.beginPath();c.ellipse(cx,y+28,6,2,0,0,7);c.fill();c.fillStyle=C.wd;c.beginPath();c.ellipse(cx,y+15,11,5.5,0,0,7);c.fill();c.strokeStyle=C.ol;c.stroke();c.fillStyle=C.wdL;c.beginPath();c.ellipse(cx,y+14,8,3.5,0,0,7);c.fill();
    f2rr(c,cx-6,y+8,4,5,1,'#e9f2f6','#9bb');f2flower(c,cx-4,y+6,'#fff');f2rr(c,cx+2,y+10,5,4,1,'#fff','#999');break;
  case'ltable':sh(13);c.fillStyle=C.wdD;for(const dx of[-12,10])c.fillRect(cx+dx,y+19,2.5,9);f2rr(c,cx-14,y+12,28,8,2,C.wd,C.ol);c.fillStyle=C.wdL;c.fillRect(cx-12,y+13,24,2);c.fillStyle=C.cr;c.fillRect(cx-5,y+12,10,8);c.fillStyle=C.crD;c.fillRect(cx-5,y+16,10,.8);
    c.save();c.translate(cx+7,y+14.5);c.rotate(.3);f2rr(c,-3.5,-2.5,7,5,1,'#7d6a5c');c.restore();f2pot(c,cx-9,y+15,5);f2leaf(c,cx-9,y+8,2.5,1.5,-.5,C.gr);f2leaf(c,cx-8,y+9,2.5,1.4,.6,C.grD);break;
  case'sideb':sh(13);f2rr(c,cx-14,y+11,28,18,2,C.wd,C.ol);c.fillStyle=C.wdL;c.fillRect(cx-14,y+11,28,2.5);c.strokeStyle=C.wdD;c.strokeRect(cx-12,y+15,11,11);c.strokeRect(cx+1,y+15,11,11);circ(c,cx-3,y+21,1,C.ol);circ(c,cx+3,y+21,1,C.ol);
    f2pot(c,cx-8,y+11,6);f2leaf(c,cx-10,y+4,3,1.6,-.6,C.gr);f2leaf(c,cx-6,y+4,3,1.6,.6,C.grD);f2leaf(c,cx-8,y+2,2,3,0,C.gr);f2rr(c,cx+3,y+3,7,8,1,'#f4ead2',C.wdD);f2leaf(c,cx+6.5,y+7,1.5,2.5,0,C.grD);break;
  case'rug1':f2rr(c,x+2,y+11,28,18,2,C.cr,C.crD);c.strokeStyle='#e8cfa4';c.lineWidth=1;for(const dx of[-8,0,8]){c.beginPath();c.moveTo(cx+dx-4,y+20);c.lineTo(cx+dx,y+15);c.lineTo(cx+dx+4,y+20);c.lineTo(cx+dx,y+25);c.closePath();c.stroke()}c.strokeStyle=C.crD;for(let k=0;k<7;k++){c.beginPath();c.moveTo(x+4+k*4,y+29);c.lineTo(x+4+k*4,y+31);c.stroke()}break;
  case'hoshirug':{f2rr(c,x+2,y+11,28,18,2,'#2a3168','#1d2350');c.fillStyle='#fff3b8';for(const[dx,dy]of[[6,15],[13,22],[20,14],[25,24],[9,25],[17,18]])c.fillRect(x+dx,y+dy,1.5,1.5);circ(c,x+24,y+16,2,'#fff3b8');circ(c,x+25,y+15.4,1.7,'#2a3168');break}/* ほしぞらのラグ（仮の絵） */
  case'rug2':c.fillStyle=C.cr;for(const[dx,dy,r]of[[-8,0,7],[0,-3,8],[8,0,7],[-4,4,7],[4,4,7]]){c.beginPath();c.arc(cx+dx,y+21+dy,r,0,7);c.fill()}c.strokeStyle=C.crD;c.beginPath();c.ellipse(cx,y+21,13,7,0,0,7);c.stroke();break;
  case'shelf1':case'shelf2':{sh(11);f2rr(c,cx-10,y+1,20,28,2,C.wd,C.ol);c.fillStyle=C.wdD;for(const sy of[9,17,25])c.fillRect(cx-10,y+sy,20,1.5);
    if(id==='shelf1'){const bk=['#c96a5a','#6b8fb5','#d9b45a','#7fae6a','#a07ac0'];for(let r=0;r<3;r++)for(let k=0;k<5;k++){c.fillStyle=bk[(k+r*2)%5];c.fillRect(cx-8+k*3.2,y+3+r*8,2.6,6-(k%2))}f2leaf(c,cx+6,y+1,4,2,.4,C.gr);f2leaf(c,cx+8,y+5,2,4,.2,C.grD);f2leaf(c,cx+9,y+10,1.6,3,.1,C.gr)}
    else{f2pot(c,cx-3,y+8,6);f2leaf(c,cx-5,y+1,3,1.6,-.6,C.gr);f2leaf(c,cx-1,y+1,3,1.6,.6,C.grD);f2rr(c,cx-7,y+11,6,5,1,'#e9e2d2','#999');f2rr(c,cx+1,y+12,6,4,1,'#cfe0ea','#899');c.fillStyle='#7aa0c0';c.fillRect(cx-7,y+20,3,4);c.fillStyle='#d9b45a';c.fillRect(cx-3.5,y+19,3,5);f2pot(c,cx+4,y+24,5);f2leaf(c,cx+4,y+17,2,3,0,C.gr)}break}
  case'wshelf':sh(9,2);if(!c._onWall){c.fillStyle=C.wdD;c.fillRect(cx-1,y+10,2,19)}else{c.fillStyle=C.wdD;c.fillRect(cx-9,y+11,2,4);c.fillRect(cx+7,y+11,2,4)}/* 壁にかけたときは、支えの金具だけ */f2rr(c,cx-11,y+8,22,3.5,1,C.wd,C.ol);f2pot(c,cx+5,y+8,6);for(let k=0;k<4;k++){f2leaf(c,cx+7+Math.sin(T+k)*.5,y+10+k*4,2.2,1.4,.8,k%2?C.gr:C.grD)}f2rr(c,cx-8,y+2,6,6,1,'#f4ead2',C.wdD);break;
  case'cabinet':sh(11);f2rr(c,cx-11,y+9,22,20,2,C.wd,C.ol);c.fillStyle=C.wdL;c.fillRect(cx-11,y+9,22,2.5);c.strokeStyle=C.wdD;c.strokeRect(cx-9,y+13,8.5,13);c.strokeRect(cx+.5,y+13,8.5,13);circ(c,cx-2,y+20,1,C.ol);circ(c,cx+2,y+20,1,C.ol);f2pot(c,cx-5,y+9,5);f2leaf(c,cx-5,y+3,2,3,0,C.gr);f2rr(c,cx+1,y+2,7,7,1,'#f4ead2',C.wdD);f2leaf(c,cx+4.5,y+5.5,1.4,2.2,0,C.grD);break;
  case'niguruma':sh(13);c.fillStyle='#8a5a33';c.fillRect(cx+6,y+17,9,2);f2rr(c,cx-12,y+11,18,10,1.5,'#c98f5c',C.ol);c.fillStyle='#a8743f';c.fillRect(cx-12,y+15,18,1.2);circ(c,cx-7,y+24,4.5,'#7a4a28');circ(c,cx-7,y+24,2,'#c9a46a');circ(c,cx+2,y+24,4.5,'#7a4a28');circ(c,cx+2,y+24,2,'#c9a46a');c.fillStyle='#d8c39a';c.beginPath();c.ellipse(cx-5,y+10,4,3,0,0,7);c.fill();break;/* にぐるま（仮の絵） */
  case'kabedougu':{sh(9,2);c.save();c.translate(cx,y+18);c.rotate(-.35);c.fillStyle='#9a6638';c.fillRect(-1.2,-12,2.4,22);c.fillStyle='#9aa3ab';c.beginPath();c.moveTo(1,-12);c.lineTo(7,-10);c.lineTo(7,-4);c.lineTo(1,-6);c.fill();c.restore();c.save();c.translate(cx,y+18);c.rotate(.35);c.fillStyle='#b27a46';c.fillRect(-1.2,-13,2.4,20);c.fillStyle='#8f9aa3';c.beginPath();c.moveTo(-4,7);c.lineTo(4,7);c.lineTo(3,13);c.lineTo(0,15);c.lineTo(-3,13);c.fill();c.restore();break}/* かべかけのおのとスコップ（仮の絵） */
  case'taru':sh(10);f2rr(c,cx-9,y+8,18,21,5,'#b27a46',C.ol);c.fillStyle='#c98f5c';c.fillRect(cx-6,y+9,4,19);c.fillStyle='#7d8a96';c.fillRect(cx-9,y+12,18,2);c.fillRect(cx-9,y+23,18,2);c.fillStyle='#9a6638';c.beginPath();c.ellipse(cx,y+9,8,2.6,0,0,7);c.fill();break;/* たる（仮の絵） */
  case'asabukuro':sh(11);c.fillStyle='#d8c39a';c.beginPath();c.ellipse(cx-4,y+21,8,8,0,0,7);c.fill();c.beginPath();c.ellipse(cx+5,y+22,7,7,0,0,7);c.fill();c.fillStyle='#e6d4ae';c.beginPath();c.ellipse(cx-6,y+18,3,4,0,0,7);c.fill();c.fillStyle='#b89c6c';c.fillRect(cx-6,y+12,4,2);c.fillRect(cx+3,y+14,4,2);c.fillStyle='#c9ad7a';c.beginPath();c.moveTo(cx-7,y+13);c.lineTo(cx-4,y+9);c.lineTo(cx-1,y+13);c.fill();break;/* あさぶくろ（仮の絵） */
  case'makidana':sh(11);c.fillStyle='#8a5a33';c.fillRect(cx-11,y+6,2.5,23);c.fillRect(cx+8.5,y+6,2.5,23);c.fillRect(cx-11,y+6,22,2);c.fillRect(cx-11,y+17,22,2);for(let r=0;r<2;r++)for(let k=0;k<4;k++){circ(c,cx-6+k*4.2,y+12+r*10.5,2.2,'#c98f5c');circ(c,cx-6+k*4.2,y+12+r*10.5,1,'#e8c48f')}break;/* まき棚（仮の絵） */
  case'crate':sh(11);f2rr(c,cx-11,y+10,22,19,1,C.wd,C.ol);c.strokeStyle=C.wdD;c.lineWidth=2;c.beginPath();c.moveTo(cx-10,y+11);c.lineTo(cx+10,y+28);c.moveTo(cx+10,y+11);c.lineTo(cx-10,y+28);c.stroke();c.lineWidth=1;c.strokeRect(cx-11,y+10,22,19);c.fillStyle=C.wdL;c.fillRect(cx-11,y+10,22,2);break;
  case'monstera':sh(9);f2pot(c,cx,y+29,11);for(const[dx,dy,a,col]of[[-6,-2,-.7,C.grD],[6,-3,.7,C.gr],[0,-8,0,C.gr],[-4,-11,-.3,C.grD],[5,-10,.4,C.grD]]){f2leaf(c,cx+dx,y+18+dy,6,4,a,col);c.strokeStyle='rgba(255,255,255,.5)';c.beginPath();c.moveTo(cx+dx-3,y+18+dy);c.lineTo(cx+dx+3,y+18+dy);c.stroke()}break;
  case'curtain1':case'curtain2':{const cl=id==='curtain1'?'#fbf4e4':'#7fae66',cd=id==='curtain1'?'#e6d9bd':'#55823f';sh(12,2);c.fillStyle=C.wdD;c.fillRect(cx-14,y+3,28,2.5);circ(c,cx-14,y+4.2,2,C.wdD);circ(c,cx+14,y+4.2,2,C.wdD);
    for(const sg of[-1,1]){c.fillStyle=cl;c.beginPath();c.moveTo(cx+sg*13,y+5);c.lineTo(cx+sg*2,y+5);c.quadraticCurveTo(cx+sg*7,y+16,cx+sg*9,y+29);c.lineTo(cx+sg*13,y+29);c.closePath();c.fill();c.strokeStyle=cd;c.stroke();c.beginPath();c.moveTo(cx+sg*10,y+6);c.lineTo(cx+sg*11,y+28);c.stroke();c.fillStyle=cd;c.fillRect(cx+sg*11-2,y+17,4,2)}break}
  case'mimamori':{/* みまもりのぬいぐるみ（仮の絵）：夜色のくま */const by=y+16;c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(cx,y+29,8,2.5,0,0,7);c.fill();circ(c,cx-5,by-2,3,'#3d3f6e');circ(c,cx+5,by-2,3,'#3d3f6e');f2rr(c,cx-7,by+4,14,11,5,'#4a4c80',C.ol);circ(c,cx,by+3,6.5,'#4a4c80');circ(c,cx-2.3,by+2.5,1,'#fff6d8');circ(c,cx+2.3,by+2.5,1,'#fff6d8');circ(c,cx+6,by-6,1.6,'#ffe58a');break}
  case'yomawari':{/* よまわりのランタン（仮の絵）：青白い光 */const T2=Math.sin(T*2+(i||0))*.5+.5;c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(cx,y+29,6,2,0,0,7);c.fill();c.fillStyle='#4a3a5a';c.fillRect(cx-1,y+12,2,17);f2rr(c,cx-6,y+2,12,12,2,'#2f2a48',C.ol);c.fillStyle='rgba(190,215,255,'+(.7+T2*.3)+')';c.fillRect(cx-4,y+4,8,8);c.fillStyle='#2f2a48';c.fillRect(cx-7,y+1,14,2);break}
  case'oyasumi':{/* おやすみのベル（仮の絵） */c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(cx,y+29,7,2,0,0,7);c.fill();c.fillStyle='#6b4524';c.fillRect(cx-1,y+8,2,21);c.fillRect(cx-6,y+7,12,2);c.fillStyle='#e8c25a';c.beginPath();c.moveTo(cx-5,y+20);c.quadraticCurveTo(cx-5,y+10,cx,y+10);c.quadraticCurveTo(cx+5,y+10,cx+5,y+20);c.closePath();c.fill();c.strokeStyle=C.ol;c.lineWidth=1;c.stroke();circ(c,cx,y+21,1.5,'#b8892e');break}
  case'yonaka':{/* よなかのうたの絵（仮の絵）：夜空の額 */const w=15,h=18,fx=cx-w/2,fy=y+(c._onWall?8:4);f2rr(c,fx,fy,w,h,1,C.wd,C.ol);c.fillStyle='#1d2350';c.fillRect(fx+2.5,fy+2.5,w-5,h-5);circ(c,fx+w-6,fy+6,2.2,'#fff3b8');c.fillStyle='#fff';for(const[dx,dy]of[[4,5],[6,10],[9,13],[4,13]])c.fillRect(fx+dx,fy+dy,1,1);break}
  case'toro':{/* しずけさの石どうろう（仮の絵） */const T2=Math.sin(T*1.5+(i||0))*.5+.5;c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(cx,y+29,8,2.5,0,0,7);c.fill();f2rr(c,cx-6,y+24,12,5,1,'#9a9a96',C.ol);f2rr(c,cx-2.5,y+15,5,9,1,'#a8a8a3',C.ol);f2rr(c,cx-6,y+8,12,8,1,'#b4b4ae',C.ol);c.fillStyle='rgba(255,220,140,'+(.65+T2*.35)+')';c.fillRect(cx-3,y+10,6,4);c.fillStyle='#8f8f8a';c.beginPath();c.moveTo(cx-9,y+8);c.lineTo(cx,y+2);c.lineTo(cx+9,y+8);c.closePath();c.fill();break}
  case'paint1':case'paint2':case'paint3':{const big=id==='paint1',w=big?22:15,h=big?16:18;/* 額は壁にかける物なので、脚はつけない */
    const fx=cx-w/2,fy=y+(c._onWall?(big?9:8):(big?6:4));/* 壁にかけたときは、台なしで壁の面に */f2rr(c,fx,fy,w,h,1,C.wd,C.ol);c.fillStyle=big?'#cfe6f2':'#f5ecd6';c.fillRect(fx+2.5,fy+2.5,w-5,h-5);
    if(big){c.fillStyle='#8cc06a';c.beginPath();c.moveTo(fx+2.5,fy+h-2.5);c.quadraticCurveTo(fx+8,fy+6,fx+13,fy+h-6);c.quadraticCurveTo(fx+16,fy+8,fx+w-2.5,fy+h-5);c.lineTo(fx+w-2.5,fy+h-2.5);c.fill();circ(c,fx+w-6,fy+5.5,1.8,'#fff7c0')}
    else if(id==='paint2'){c.strokeStyle=C.grD;c.beginPath();c.moveTo(cx,fy+h-4);c.lineTo(cx,fy+4);c.stroke();for(let k=0;k<3;k++){f2leaf(c,cx-2.5,fy+6+k*3.5,2.4,1.2,-.5,C.gr);f2leaf(c,cx+2.5,fy+6+k*3.5,2.4,1.2,.5,C.grD)}}
    else{c.fillStyle='#a9c98f';c.fillRect(fx+2.5,fy+2.5,w-5,h-5);f2flower(c,cx-2,fy+7,'#fff');f2flower(c,cx+2.5,fy+11,'#fff');f2leaf(c,cx,fy+13,2,1,0,C.grD)}break}
  case'wreath':for(let k=0;k<12;k++){const a=k/12*6.283;f2leaf(c,cx+Math.cos(a)*7,y+12+Math.sin(a)*7,3,1.8,a+1.57,k%2?C.gr:C.grD)}for(const a of[.6,2.2,3.8,5.2])f2flower(c,cx+Math.cos(a)*7,y+12+Math.sin(a)*7,a<3?'#fff':C.pk);c.fillStyle='#e07b6a';c.beginPath();c.moveTo(cx,y+5);c.lineTo(cx-3,y+2);c.lineTo(cx-3,y+7);c.closePath();c.moveTo(cx,y+5);c.lineTo(cx+3,y+2);c.lineTo(cx+3,y+7);c.closePath();c.fill();break;
  case'bathtub':sh(14);c.fillStyle=C.wdD;c.fillRect(cx-11,y+25,3,4);c.fillRect(cx+8,y+25,3,4);f2rr(c,cx-14,y+11,28,16,8,'#fbfbf7','#c9c4b6');c.fillStyle='#8fcbea';c.beginPath();c.ellipse(cx,y+15,11,3.5,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.ellipse(cx-4,y+14.5,4,1,0,0,7);c.fill();c.fillStyle=C.st;c.fillRect(cx+10,y+6,2,7);c.fillRect(cx+7,y+6,5,2);break;
  case'lantern':{sh(6);const fl=.75+.25*Math.sin(T*6+i);c.fillStyle='#5b4636';f2rr(c,cx-6,y+25,12,4,1,'#5b4636');if(!inHouseL(i,ICON)){c.globalAlpha=.35*fl;circ(c,cx,y+18,10,'#ffd27a');c.globalAlpha=1}f2rr(c,cx-5,y+12,10,13,2,'#ffe7a8','#5b4636');circ(c,cx,y+19,2.6*fl,'#ff9d3a');c.fillStyle='#5b4636';c.beginPath();c.moveTo(cx-7,y+12);c.lineTo(cx,y+7);c.lineTo(cx+7,y+12);c.fill();c.strokeStyle='#5b4636';c.lineWidth=1.4;c.beginPath();c.arc(cx,y+6,2.5,Math.PI,0);c.stroke();c.lineWidth=1;break}
  case'candle':{sh(6);const fl=Math.sin(T*9+i)*.6;f2rr(c,cx-6,y+25,12,4,2,C.wd,C.ol);c.fillStyle=C.wdD;c.fillRect(cx-1.5,y+18,3,8);f2rr(c,cx-4,y+16,8,3,1,C.wd,C.ol);f2rr(c,cx-2.5,y+8,5,9,1,'#fff6e0','#e0d2b0');if(!inHouseL(i,ICON)){c.globalAlpha=.3;circ(c,cx,y+5,6,'#ffd27a');c.globalAlpha=1}c.fillStyle='#ffb347';c.beginPath();c.ellipse(cx+fl*.3,y+5,1.8,3.2,0,0,7);c.fill();circ(c,cx,y+6,1,'#fff3c0');break}
  case'flamp':sh(7);c.fillStyle=C.wdD;c.beginPath();c.ellipse(cx,y+28,6,2,0,0,7);c.fill();c.fillRect(cx-1,y+9,2,19);if(!inHouseL(i,ICON)){c.globalAlpha=.3;circ(c,cx,y+8,9,'#ffe7a8');c.globalAlpha=1}c.fillStyle=C.cr;c.beginPath();c.moveTo(cx-5,y+2);c.lineTo(cx+5,y+2);c.lineTo(cx+8,y+11);c.lineTo(cx-8,y+11);c.closePath();c.fill();c.strokeStyle=C.crD;c.stroke();break;
  case'sink':sh(13);f2rr(c,cx-13,y+12,26,17,2,'#cfc9be',C.stD);c.fillStyle='#b9b2a6';c.fillRect(cx-13,y+12,26,3);f2rr(c,cx-8,y+15,16,7,2,'#8f897f');c.fillStyle='#a9d4ea';c.fillRect(cx-7,y+18,14,3);c.strokeStyle=C.stD;c.strokeRect(cx-10,y+23,20,5);c.fillStyle='#9d968b';c.fillRect(cx-1,y+5,2.5,9);c.fillRect(cx-1,y+5,7,2.2);circ(c,cx+6,y+7,1.2,'#9d968b');break;
  case'tub':sh(10);f2rr(c,cx-10,y+11,20,18,4,C.wd,C.ol);c.fillStyle='#8f97a0';c.fillRect(cx-10,y+14,20,2);c.fillRect(cx-10,y+24,20,2);c.fillStyle='#9fd0ea';c.beginPath();c.ellipse(cx,y+12,9,3,0,0,7);c.fill();c.strokeStyle=C.ol;c.beginPath();c.ellipse(cx,y+12,10,3.5,0,0,7);c.stroke();break;
  case'hedge':{/* 生垣：まるくこんもりした明るい葉のかたまりと、下の茶色い土 */const hu=!ICON&&i!=null&&typeAt(i-W)==='hedge',hd=!ICON&&i!=null&&typeAt(i+W)==='hedge',hl=!ICON&&i!=null&&i%W>0&&typeAt(i-1)==='hedge',hr=!ICON&&i!=null&&i%W<W-1&&typeAt(i+1)==='hedge',h=i||0;
    if(spOK('hedge-atlas')){{const rD=hr&&typeAt(i+1+W)==='hedge',lD=hl&&typeAt(i-1+W)==='hedge',m=(hl?1:0)|(hr?2:0)|(hu?4:0)|(hd?8:0);spTile(c,'hedge-atlas',m,x,y,ICON,null,rD&&lD?18:rD?16:lD?17:m,!hl&&!hr)}break}
    const x0=hl?x-2:x+3.6,x1=hr?x+34:x+28.4,y0=hu?y-4:y+4.6,y1=hd?y+36:y+25.6;
    if(!hd)sh(15);
    if(!hd){const bl=hl?x-1:x+2.5,br=hr?x+33:x+29.5;c.fillStyle='#a07548';rr(c,bl-.6,y+24.2,br-bl+1.2,7,3);c.fillStyle='#b98c5c';rr(c,bl,y+24.2,br-bl,6,2.6)}/* 下の土 */
    const rad=[(hu||hl)?0:6,(hu||hr)?0:6,(hd||hr)?0:6,(hd||hl)?0:6],sc=[],sp=5.0;
    if(!hu)for(let cx=x0+2.5;cx<x1-1.5;cx+=sp)sc.push([cx+(hash(h*3+((cx-x0)|0))-.5)*1.2,y0,3.2+hash(h+cx)*.9]);if(!hd)for(let cx=x0+2.5;cx<x1-1.5;cx+=sp)sc.push([cx+(hash(h*5+((cx-x0)|0))-.5)*1.2,y1,3.2+hash(h+cx*2)*.9]);if(!hl)for(let cy=y0+3;cy<y1-2;cy+=sp)sc.push([x0,cy,3.2+hash(h+cy)*.9]);if(!hr)for(let cy=y0+3;cy<y1-2;cy+=sp)sc.push([x1,cy,3.2+hash(h+cy*3)*.9]);
    const hull=new Path2D();hull.roundRect(x0,y0,x1-x0,y1-y0,rad);for(const[cx,cy,r]of sc){hull.moveTo(cx+r,cy);hull.arc(cx,cy,r,0,7)}
    c.save();c.fillStyle='#4c9231';c.fill(hull);c.save();c.beginPath();c.rect(hl?x:x-6,hu?y:y-8,(hr?x+TS:x+TS+6)-(hl?x:x-6),(hd?y+TS:y+TS+8)-(hu?y:y-8));c.clip();c.strokeStyle='#4c9231';c.lineWidth=1.6;c.stroke(hull);c.restore();/* ふちどり（つながる側には引かない） */
    c.fillStyle='#8ccb48';c.fill(hull);c.clip(hull);
    if(!hu){const g1=c.createLinearGradient(0,y0,0,y0+13);g1.addColorStop(0,'rgba(215,248,105,.6)');g1.addColorStop(1,'rgba(215,248,105,0)');c.fillStyle=g1;c.fillRect(x0-4,y0-4,x1-x0+8,17)}/* 上は明るい黄緑 */
    if(!hd){const g2=c.createLinearGradient(0,y1-14,0,y1);g2.addColorStop(0,'rgba(35,120,55,0)');g2.addColorStop(1,'rgba(35,120,55,.5)');c.fillStyle=g2;c.fillRect(x0-4,y1-14,x1-x0+8,18)}/* 下は濃い緑 */
    const nb=(hu||hd)?7:6;for(let k=0;k<nb;k++){const px=x0+4+hash(h*7+k)*(x1-x0-8),py=y0+4+hash(h*9+k+4)*(y1-y0-8),rx=(k%3===0?4:3)+hash(k+h)*1.2,ry=(k%3===0?2.8:2.2)+hash(k*2+h)*.7,an=hash(k+h*2)*1.2-.3;c.fillStyle='#5aa63a';c.beginPath();c.ellipse(px,py,rx+.6,ry+.6,an,0,7);c.fill();c.fillStyle=py<(y0+y1)/2?'#bfe85e':'#9fd652';c.beginPath();c.ellipse(px,py,rx,ry,an,0,7);c.fill()}/* ふちどりのある明るい葉っぱ */
    c.restore();break}
  case'birdbath':sh(8);f2rr(c,cx-6,y+25,12,4,1,C.st,C.stD);f2rr(c,cx-2.5,y+15,5,11,1,C.st,C.stD);c.fillStyle=C.st;c.beginPath();c.ellipse(cx,y+14,11,4.5,0,0,7);c.fill();c.strokeStyle=C.stD;c.stroke();c.fillStyle='#9fd0ea';c.beginPath();c.ellipse(cx,y+13.5,8.5,2.8,0,0,7);c.fill();
    {const hop=Math.max(0,Math.sin(T*2.2+i))*1.5;c.fillStyle='#c8955f';c.beginPath();c.ellipse(cx+8,y+8-hop,3.2,2.4,0,0,7);c.fill();circ(c,cx+10,y+6-hop,1.8,'#c8955f');c.fillStyle='#f4e6cc';c.beginPath();c.ellipse(cx+8,y+9-hop,2,1.2,0,0,7);c.fill();c.fillStyle='#e8a33a';c.fillRect(cx+11.5,y+5.6-hop,1.8,.9)}break;
  case'parasol':sh(13);c.fillStyle=C.wdD;c.fillRect(cx-1,y+6,2,23);c.beginPath();c.ellipse(cx,y+28,4,1.4,0,0,7);c.fill();
    c.fillStyle=C.cr;c.beginPath();c.moveTo(cx-15,y+11);c.quadraticCurveTo(cx,y-4,cx+15,y+11);c.closePath();c.fill();c.strokeStyle=C.crD;c.stroke();c.beginPath();for(const dx of[-8,0,8]){c.moveTo(cx,y+2);c.lineTo(cx+dx,y+11)}c.stroke();break;
  case'noren':{sh(12);c.fillStyle='#7a4f30';c.fillRect(cx-13,y+3,2.5,26);c.fillRect(cx+10.5,y+3,2.5,26);c.fillRect(cx-14,y+2,28,2.5);/* 柱と横木 */
    const sw=ICON?0:Math.sin((now||0)/700+(i||0))*.8;for(let k=0;k<3;k++){const px=cx-10.5+k*7.2;c.fillStyle=k===1?'#2f4f86':'#3a5d99';c.beginPath();c.moveTo(px,y+4.5);c.lineTo(px+6.6,y+4.5);c.lineTo(px+6.6+sw,y+18);c.lineTo(px+sw,y+18);c.closePath();c.fill()}/* 3まいの布 */
    {const mx=cx+sw*.5;c.strokeStyle='#f4ead8';c.lineWidth=1.3;c.beginPath();c.ellipse(mx,y+13.2,5,2.6,0,.15,Math.PI-.15);c.stroke();c.beginPath();for(const dx of[-2.6,0,2.6]){c.moveTo(mx+dx,y+13);c.quadraticCurveTo(mx+dx-1.4,y+10.5,mx+dx,y+9);c.quadraticCurveTo(mx+dx+1.4,y+7.5,mx+dx,y+6)}c.stroke();c.lineWidth=1}/* 湯のしるし（♨） */
    c.strokeStyle='rgba(255,255,255,.55)';c.beginPath();for(const dx of[-6,6]){c.moveTo(cx+dx,y-1);c.quadraticCurveTo(cx+dx+2,y-4,cx+dx,y-7)}c.stroke();break}/* のれん（火山のふもと） */
  case'arch':{for(const sg of[-1,1]){c.fillStyle=C.wdD;c.fillRect(cx+sg*11-1.5,y+8,3,21);}c.lineWidth=5;c.strokeStyle=C.grD;c.beginPath();c.moveTo(cx-11,y+29);c.lineTo(cx-11,y+10);c.quadraticCurveTo(cx,y-6,cx+11,y+10);c.lineTo(cx+11,y+29);c.stroke();c.lineWidth=1;
    for(let k=0;k<14;k++){const t=k/13,px=t<.3?cx-11:t>.7?cx+11:cx-11+(t-.3)/.4*22,py=t<.3?y+29-t/.3*19:t>.7?y+10+(t-.7)/.3*19:y+10-Math.sin((t-.3)/.4*Math.PI)*8;f2leaf(c,px+(k%2?2:-2),py,3,2,k,k%2?C.gr:C.grD);if(k%3===0)f2flower(c,px,py-1,k%2?C.pk:'#fff')}break}
  case'signpost':sh(6);c.fillStyle=C.wdD;c.fillRect(cx-1.5,y+5,3,24);for(const[dy,sg]of[[7,1],[15,-1]]){c.fillStyle=C.wd;c.beginPath();c.moveTo(cx-sg*7,y+dy);c.lineTo(cx+sg*8,y+dy);c.lineTo(cx+sg*11,y+dy+2.5);c.lineTo(cx+sg*8,y+dy+5);c.lineTo(cx-sg*7,y+dy+5);c.closePath();c.fill();c.strokeStyle=C.ol;c.stroke()}break;
  case'slide':sh(14);c.fillStyle=C.wdD;for(const dx of[-12,-4])c.fillRect(cx+dx,y+8,2.5,21);f2rr(c,cx-13,y+7,11,4,1,C.wd,C.ol);c.fillStyle=C.wd;for(let k=0;k<4;k++)c.fillRect(cx-11,y+13+k*4,6,1.5);
    c.fillStyle='#e88a7a';c.beginPath();c.moveTo(cx-3,y+8);c.lineTo(cx+2,y+8);c.quadraticCurveTo(cx+8,y+22,cx+15,y+27);c.lineTo(cx+15,y+30);c.lineTo(cx+10,y+30);c.quadraticCurveTo(cx+3,y+24,cx-3,y+12);c.closePath();c.fill();c.strokeStyle='#c56a5c';c.stroke();break;
  case'sandbox':{const k=ICON?1:2,sx=cx;/* 2×1マスいっぱいに描く */c.save();c.translate(sx,y);c.scale(k,1);c.translate(-sx,-y);shadow(c,sx,y+29,15,3);f2rr(c,sx-15,y+8,30,21,2,C.wd,C.ol);c.fillStyle='#f1dca8';c.fillRect(sx-13,y+11,26,15);c.fillStyle='#e6c98a';c.beginPath();c.moveTo(sx-4,y+24);c.quadraticCurveTo(sx,y+13,sx+5,y+24);c.fill();c.restore();c.strokeStyle='#4f86b5';c.lineWidth=1.6;c.beginPath();c.moveTo(sx+12,y+15);c.lineTo(sx+16,y+22);c.stroke();c.lineWidth=1;c.fillStyle='#4f86b5';c.beginPath();c.ellipse(sx+16.5,y+23,2,1.4,.6,0,7);c.fill();break}
  case'seesaw':{const a=c._neutral?0:i!=null&&S&&!ICON?ssAng(i,now||0):Math.sin(T*1.6)*.12;if(c._part!=='part'){sh(14);c.fillStyle='#8f97a0';c.beginPath();c.moveTo(cx-4,y+28);c.lineTo(cx,y+20);c.lineTo(cx+4,y+28);c.closePath();c.fill()}if(c._part!=='base'){c.save();c.translate(cx,y+20);c.rotate(a);f2rr(c,-15,-2.5,30,4.5,1.5,C.wd,C.ol);c.fillStyle='#5f8fc0';for(const sg of[-1,1]){c.fillRect(sg*10-1,-8,2,6);c.fillRect(sg*10-3,-8,6,1.6)}c.restore()}break}/* _part：ドット絵を作るとき、台（base）と板（part）を分けて描く */
  }}
