'use strict';
/* 窓：横の木の壁にはめる */
function wallArt(c,p,x,y,i,now){const ch=chipOf(p);if(!(ch&&drawChip(c,ch,p,x,y,now,i)))drawF2(c,p,x,y,i,now)}/* 壁にかけた物：ドット絵があればそれを、なければ線でかく */
const WALLD=new Set(['yonaka','window','paint1','paint2','paint3','curtain1','curtain2','wshelf','wreath','kabebukuro']);/* 壁・リースをかけるもの */
function winCovered(qx,qy){for(let dy=1;dy<=3;dy++)for(let dx=-1;dx<=1;dx++){const X=qx+dx,Y=qy+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const o=S.obj[Y*W+X];if(o&&!FLAT.has(o)&&!HOME_WALLS.has(o)&&!HOME_DOORS.has(o)&&!FENCE_IDS.has(o)&&BL[o]&&BL[o].kind!=='plant')return true}return false}
function drawWin(c,i,x,y){const C=window.CHIPS,wk='window',wt=i!=null&&!ICON&&S&&S.obj[i],wc=C&&((wt&&C[wt+'.'+wk])||C[wk]);if(wc&&drawChip(c,wc,wk,x,y,0,i))return;/* 窓のわくの木は、窓をつけた壁の色の絵（<壁>.window） *//* 窓のチップ（大きさはチップそのもの。ゲームの中では拡大しない） */c.save();c.translate(x+16,y+3);c.scale(1.125,1.125);c.translate(-x-16,-y-9);drawWin0(c,i,x,y);c.restore()}
function drawWin0(c,i,x,y){const wa=HOUSEART&&HOUSEART['wall-window'];if(wa&&wa.complete&&wa.naturalWidth){c.drawImage(wa,x+5,y+9,22,19.3);return}/* 窓は、壁のまん中に小さめに */c.fillStyle='rgba(68,43,28,.28)';rr(c,x+5,y+10,22,16,2.5);c.fillStyle='#70482e';rr(c,x+6,y+8,20,16,2.5);c.fillStyle='#d3a06c';rr(c,x+7.5,y+9.5,17,12.5,1.4);c.fillStyle='#a9d7e8';rr(c,x+9,y+11,14,9.5,1);c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.moveTo(x+10,y+12);c.lineTo(x+15,y+12);c.lineTo(x+11,y+17);c.lineTo(x+9.5,y+17);c.closePath();c.fill();c.fillStyle='#795033';rr(c,x+15.5,y+10.5,1.6,10.5,.7);rr(c,x+8.5,y+15.4,15,1.5,.7);c.fillStyle='#d8aa71';rr(c,x+5,y+21,22,3,1.4);c.fillStyle='#f0d3a3';rr(c,x+6,y+21,20,1,0.5)}

// 送ってもらった家づくりパーツ画像から切り出した質感を、壁・扉・窓に使用。
const HOUSEART={};for(const k of ['wall-log','post-log','wall-plaster','post-plaster','wall-brick','post-brick','gate-stone-left','gate-stone-right','post-stone','wall-door','wall-window','wall-wood','floor-wood','floor-brick','floor-stone','floor-wood-render','floor-brick-render','floor-stone-render','hedge-atlas','wall-window-lit']){const im=new Image();im.src='assets/'+k+'.png?v=102';im.onload=()=>artLoaded();HOUSEART[k]=im}

/* 苔の石垣は横面・縦面・柱を別々に継ぐ。画像全体を回転・反転しない。 */
function drawMossGate(c,x,y,i,ver,op){
  const p=HOUSEART['post-stone'],a=HOUSEART['gate-stone-left'],b=HOUSEART['gate-stone-right'];
  if(!p||!p.complete||!p.naturalWidth||!a||!a.complete||!a.naturalWidth||!b||!b.complete||!b.naturalWidth)return false;
  c.save();c.beginPath();c.rect(x,y,32,32);c.clip();const w=10*(1-op*.91);
  if(!ver){c.drawImage(a,x+6,y+5,w,25);c.drawImage(b,x+26-w,y+5,w,25);c.drawImage(p,x-2,y-2,8,33);c.drawImage(p,x+26,y-2,8,33)}
  else{c.drawImage(p,x+8,y-3,16,13);c.drawImage(p,x+8,y+24,16,13);const h=7*(1-op*.91);c.drawImage(a,x+8,y+10,16,h);c.drawImage(b,x+8,y+24-h,16,h)}/* たてむきも、両はしの柱のあいだにとびら */
  c.restore();return true;
}

const WALLMAT={plasterwall:'plaster',logwall:'log',brickwall:'brick',yozorawall:'night'};
function wallBand(c,mat,a,b,x,y,i){/* 壁の正面（1マスの高さ：y〜y+28が板、その下が巾木）。世界の座標で模様をつなぐので、マスのさかいめに継ぎ目が出ない */
  if(b<=a)return;const gx=(i!=null&&!ICON?(i%W)*TS:0)-x,FH=28.4;
  if(!c._noSh){c.fillStyle='rgba(0,0,0,.18)';c.fillRect(a,y+TS,b-a,2)}c.save();c.beginPath();c.rect(a,y,b-a,FH);c.clip();
  if(mat==='night'&&window.CHIPS&&CHIPS['yozorawall:band']&&(()=>{const ch=CHIPS['yozorawall:band'],ims=chipImgs(ch,'yozorawall:band'),im=ims[0];if(!im||!im.ok)return false;const pw=ch.w*FH/ch.h;let wx=Math.floor((a+gx)/pw)*pw;for(;wx<b+gx;wx+=pw)c.drawImage(im,wx-gx,y,pw,FH);return true})()){}/* よぞらの壁：もらった絵の帯をならべる */
  else if(mat==='night'){c.fillStyle='#283063';c.fillRect(a,y,b-a,FH);c.fillStyle='#1e2550';c.fillRect(a,y+FH-3,b-a,3);for(let n=Math.floor((a+gx)/7)-1;n*7<b+gx;n++){const k=hash(n*13+7);if(k<.5)continue;c.fillStyle=k>.85?'#fff3b8':'rgba(220,230,255,.8)';c.fillRect(n*7+hash(n*5)*5-gx,y+3+hash(n*29)*20,k>.85?1.6:1,k>.85?1.6:1)}}/* よぞらの壁（仮の絵）：夜空の色に星 */
  else if(mat==='plaster'){c.fillStyle='#efdfc1';c.fillRect(a,y,b-a,FH);c.fillStyle='rgba(120,84,50,.16)';c.fillRect(a,y,b-a,1.6);c.fillStyle='#f8edd4';c.fillRect(a,y+1.6,b-a,1.6);c.fillStyle='#d7c3a0';c.fillRect(a,y+FH-3,b-a,3);
    for(let n=Math.floor((a+gx)/8)-1;n*8<b+gx;n++){const k=hash(n*17+5);if(k<.45)continue;c.fillStyle=k>.75?'rgba(198,173,137,.28)':'rgba(255,250,232,.6)';c.beginPath();c.ellipse(n*8+hash(n*3)*6-gx,y+6+hash(n*31)*16,1.2+hash(n+7)*.8,.7,0,0,7);c.fill()}}
  else if(mat==='wood'){const art=HOUSEART['wall-wood'];if(art&&art.complete&&art.naturalWidth){const k=art.naturalHeight/FH,sw=art.naturalWidth-8,pw=sw/k;let wx=Math.floor((a+gx)/pw)*pw;for(;wx<b+gx;wx+=pw)c.drawImage(art,4,0,sw,art.naturalHeight,wx-gx,y,pw,FH)}else{c.fillStyle='#c6905f';c.fillRect(a,y,b-a,FH)}}
  else if(mat==='log'){const rh=FH/6;c.fillStyle='#a87650';c.fillRect(a,y,b-a,FH);for(let r=0;r<6;r++){const yy=y+r*rh;c.fillStyle='#c6905f';c.fillRect(a,yy+.6,b-a,rh-1.2);c.fillStyle='#e2ad7e';c.fillRect(a,yy+.6,b-a,.8);c.fillStyle='rgba(120,76,46,.35)';c.fillRect(a,yy+rh-1,b-a,.6);
      for(let n=Math.floor((a+gx)/13)-1;n*13<b+gx;n++)if(hash(n*7+r*13+3)>.55){c.fillStyle='rgba(150,98,62,.7)';c.fillRect(n*13+2+hash(n*3+r)*6-gx,yy+rh/2-.4,3.2,.9)}}}
  else{const rh=FH/6;c.fillStyle='#eccaad';c.fillRect(a,y,b-a,FH);for(let r=0;r<6;r++){const yy=y+r*rh+.5,off=r%2?6:0;for(let n=Math.floor((a+gx-off)/12)-1;n*12+off<b+gx;n++){const bx=n*12+off-gx;c.fillStyle=hash(n*5+r*11)>.7?'#ae6b56':'#b8725b';c.fillRect(bx+.5,yy,11,rh-1);c.fillStyle='rgba(255,205,170,.35)';c.fillRect(bx+1,yy+.3,10,.6);c.fillStyle='rgba(90,40,28,.25)';c.fillRect(bx+.5,yy+rh-1.6,11,.6)}}}
  c.restore();const nt=mat==='night';c.fillStyle=nt?'#522d1d':'#8a5e3c';c.fillRect(a,y+FH,b-a,TS-FH);c.fillStyle=nt?'#86552f':'#a8784e';c.fillRect(a,y+FH,b-a,.9);/* 巾木：よぞらの壁は、よぞらのベッドと同じ木の色 */c.fillStyle='rgba(0,0,0,.2)';c.fillRect(a,y+TS-.8,b-a,.8)}
function wallFront(c,id,x,y,i){/* 家の壁の正面：断面と形は部品の絵（drawConn）。正面は、もらった絵（正面 id:ext を世界の座標でならべる・柱 id:post）をかさねる。よぞらの壁は、家の中から見える正面だけ夜空の帯と巾木。木の壁の正面と同じ所（角は、はしまで） */
  if(i==null||ICON)return;const C=window.CHIPS,E=C&&C[id+':ext'],P=C&&C[id+':post'],ei=E&&chipImgs(E,id)[0],pi=P&&chipImgs(P,id)[0];
  const inn=id==='yozorawall'&&HOUSES.some(h=>h.inside.has(i+W)||h.inside.has(i+W-1)||h.inside.has(i+W+1));
  const isW=k=>{const t=typeAt(k);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))},L=isW(i-1),R=isW(i+1),U=isW(i-W),D=isW(i+W),hasH=L||R||!(U||D);
  const gx=(i%W)*TS-x,eh=E?E.h/2:TS,ey=y+(E?E.ay/2:0),ext=(a,b,cb)=>{if(!ei||!ei.ok)return;const pw=E.w*eh/E.h;c.save();c.beginPath();c.rect(a,ey,b-a,(cb||ey+eh)-ey);c.clip();for(let wx=Math.floor((a+gx)/pw)*pw;wx<b+gx;wx+=pw)c.drawImage(ei,wx-gx,ey,pw,eh);c.restore()};/* 外から見える正面：絵（てっぺんから正面の下まで。y−9〜y+32）を世界の座標でならべる */
  const post=()=>{if(pi&&pi.ok)c.drawImage(pi,x+P.ax/2,y+P.ay/2,P.w/2,P.h/2)};/* 柱の正面 */
  const o=.5,f=(a,b)=>{if(inn){ext(a,b,y);wallBand(c,'night',a,b,x,y,i)}else ext(a,b)};/* 家の中から見える正面：てっぺんだけ絵、その下は夜空の帯 */c._noSh=1;
  if(hasH){if(!D){if(L&&R)f(x-o,x+TS+o);else{post();if(L)f(x-o,x+5);if(R)f(x+27,x+TS+o)}}/* 上にしきりの壁がつながっていても、正面は柱を立てずにつなげる（しきりは正面から見えない） */else{if(L)f(x-o,x+5);if(R)f(x+27,x+TS+o)}}else if(!D)post();
  c._noSh=0}/* となりの壁に0.5だけ重ねて描く（拡大したとき、マスのさかいめにすきまの線が出ないように） */
function stoneFront(c,x,y,i){/* 石の塀（石垣）の正面：もらった絵（正面 wall:ext を世界の座標でならべる・柱 wall:post）を、部品の絵にかさねる */
  if(i==null||ICON)return;const C=window.CHIPS,E=C&&C['wall:ext'],P=C&&C['wall:post'],ei=E&&chipImgs(E,'wall')[0],pi=P&&chipImgs(P,'wall')[0];if(!ei||!ei.ok)return;
  const f=k=>{const o=typeAt(k);return o==='wall'||o==='stonegate'},sd=k=>typeAt(k)==='sdoor',L=f(i-1),R=f(i+1),U=f(i-W),D=f(i+W),dl=sd(i-1),dr=sd(i+1),hasH=L||R||dl||dr||!(U||D);if(!hasH)return;
  const gx=(i%W)*TS-x,eh=E.h/2,ey=y+E.ay/2,pw=E.w*eh/E.h,o=.5,ext=(a,b)=>{c.save();c.beginPath();c.rect(a,ey,b-a,eh);c.clip();for(let wx=Math.floor((a+gx)/pw)*pw;wx<b+gx;wx+=pw)c.drawImage(ei,wx-gx,ey,pw,eh);c.restore()};
  const post=cx=>{if(pi&&pi.ok)c.drawImage(pi,cx-P.w/4,y+P.ay/2,P.w/2,P.h/2)};
  if((L||dl)&&(R||dr)&&!U&&!D)ext(x-o,x+TS+o);else{if(L||dl)ext(x-o,x+16);if(R||dr)ext(x+16,x+TS+o)}
  const V=U||D;if(dl&&!V)post(x+P.w/4);if(dr&&!V)post(x+TS-P.w/4);if(V||!dl&&!dr&&!(L&&R))post(x+16);/* 石の塀のドアのとなりは、塀をドアのふちまでのばして、柱をドアにつける（角の柱があるマスは、角の柱からドアまで塀でつなぐ） */
  if(D){if(L||R||dl||dr){const a=x+16-P.w/4,b=x+16+P.w/4;c.save();c.beginPath();c.rect(a,y+12,b-a,ey+eh-y-12);c.clip();ext(a,b);c.restore()}/* 角の柱は、かさの下に横の塀の正面をのばす（もらった絵の角と同じ） */const V=C['wall:vtop'];if(V)drawChip(c,V,'wall',x,y,0,i)}}/* 下へ塀がつづく柱は、柱の正面の上に、たての塀の上面をかさねる（柱のかさの下から） */
const SEC={a:null,b:null,cache:new Map()};
function drawSection(c,ox,oy,rs){/* 断面（壁・柱のてっぺん）：形のまわりだけ少し濃く、内がわは少し薄く。つながる側へはみ出した分で、マスのさかいめにも線が出ない。形ごとに1回だけ絵にして使いまわす */
  const W0=TS+16,H0=TS+40,X=ox-8,Y=oy-8,key=rs.map(r=>r.map((v,k)=>Math.round((v-(k%2?oy:ox))*100)).join(',')).join('|');let sp=SEC.cache.get(key);
  if(!sp){if(!SEC.a){SEC.a=document.createElement('canvas');SEC.b=document.createElement('canvas');SEC.a.width=SEC.b.width=W0;SEC.a.height=SEC.b.height=H0}
    const m=SEC.a.getContext('2d'),t=SEC.b.getContext('2d');m.clearRect(0,0,W0,H0);m.fillStyle='#000';for(const r of rs)m.fillRect(r[0]-ox+8,r[1]-oy+8,r[2]-r[0],r[3]-r[1]);
    sp=document.createElement('canvas');sp.width=W0;sp.height=H0;const o=sp.getContext('2d');
    const put=(col,erode)=>{t.globalCompositeOperation='source-over';t.clearRect(0,0,W0,H0);t.drawImage(SEC.a,0,0);if(erode){t.globalCompositeOperation='destination-in';for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])t.drawImage(SEC.a,dx,dy)}t.globalCompositeOperation='source-in';t.fillStyle=col;t.fillRect(0,0,W0,H0);t.globalCompositeOperation='source-over';o.save();o.beginPath();for(const r of rs)o.rect(r[4]-ox+8,r[5]-oy+8,r[6]-r[4],r[7]-r[5]);o.clip();o.drawImage(SEC.b,0,0);o.restore()};
    put('#7f5c3d',false);put('#a77f5a',true);SEC.cache.set(key,sp)}
  c.drawImage(sp,X,Y)}
/* ドット絵（chips.js）：ある物は、プログラムの絵のかわりにこれを使う。1ドット＝ゲームの1（ぼかさない） */
function chipOf(id,i,rot,sf=''){const C=window.CHIPS;if(!C)return null;const L=(id==='watch'||id==='yogan')&&i!=null&&S&&S.hp?(S.hp['L'+i]||1):1;let ch=C[(L>1?id+'@'+L:id)+sf]||C[id+sf]||null;
  const t=ROTS[id];if(!t||t===5)return ch;const r=rot!=null?rot:i==null||!S?0:RUGS.has(id)&&S.rug&&S.rug[i]===id&&S.obj[i]!==id?((S.rugRot||{})[i]||0):S.obj[i]===id?rotAt(i):0;if(!r)return ch;
  let fl=false;if(t===1)fl=true;else if(C[id+'>'+r+sf])ch=C[id+'>'+r+sf];else if(t===4&&r===3&&C[id+'>1'+sf]){ch=C[id+'>1'+sf];fl=true}else if(sf)return null;/* sf='.front'：せいれいの手前に重ねる絵 */
  if(!ch||!fl)return ch;const fw=((szR(id,r)||[1,1])[0])*32;return ch._fl&&ch._fl.fw===fw?ch._fl:(ch._fl={src:ch,ax:ch.ax,ay:ch.ay,w:ch.w,h:ch.h,f:ch.f,flip:1,fw})}/* 向きのある家具は「id>向き」の絵。左向きは右向きの反転。左右反転だけの物は、もとの絵を反転 */
const CHA={};function chipPage(n){/* マップチップのアトラス（大きな絵）。1まいごとに1回だけ読みこむ */let a=CHA[n];if(!a){a=CHA[n]={im:new Image(),ok:false,q:[]};a.im.onload=()=>{a.ok=true;const q=a.q;a.q=[];for(const f of q)f();dirty=true};a.im.onerror=()=>{a.bad=true};a.im.src=(window.CHIPA||[])[n]}return a}
function atlasFrame(r,id){/* アトラスの (x,y,w,h) を、1まいの絵（キャンバス）に切り出す。読みこむまでは ok=0 */const[n,x,y,w,h]=r,c=document.createElement('canvas');c.width=w;c.height=h;c.ok=0;const a=chipPage(n),done=()=>{c.getContext('2d').drawImage(a.im,x,y,w,h,0,0,w,h);c.ok=1;try{delete iconCache[id]}catch(e){}};if(a.ok)done();else a.q.push(done);return c}
function chipImgs(ch,id){if(!ch._im)ch._im=ch.f.map(r=>atlasFrame(r,id));return ch._im}
const PARTMV={/* 動く部品の動き：rot＝回る角度、sx・sy＝のびちぢみ（どれも支点のまわり） */
  swing:(i,now)=>{if(ICON)return{sx:1,sy:.5};/* アイコンでは、つなを短くして座面を見やすく */const d=i!=null&&S&&toyUsers(i).length?swAng(i,now):0;return{sx:1+d*.12,sy:1+d*.3}},
  seesaw:(i,now)=>({rot:!ICON&&i!=null&&S?ssAng(i,now||0):0}),
  windmill:(i,now)=>({rot:ICON?0:(now||performance.now())/1000*.9}),
  vane:(i,now)=>({sx:ICON?1:Math.cos(Math.sin((now||performance.now())/1300+(i||0))*.6)})};
function partImg(p,id){if(!p._im)p._im=atlasFrame(p.f[0],id);return p._im}
function drawChip(c,ch,id,x,y,now,i){const src=ch.src||ch,g64=src.g===64,ims=chipImgs(src,id),n=ims.length,im=ims[n>1?Math.floor((now||performance.now())/180)%n:0];if(!im.ok)return false;const sm=c.imageSmoothingEnabled,sv=ch.flip||src.parts;c.imageSmoothingEnabled=false;if(sv)c.save();if(ch.flip){c.translate(2*x+ch.fw,0);c.scale(-1,1)}/* 反転は、マスのはばの中で */
  if(g64)c.drawImage(im,x+src.ax/2,y+src.ay/2,src.w/2,src.h/2);else c.drawImage(im,x+src.ax,y+src.ay);/* 1マス64ドットの絵（g:64）は、半分の大きさでかく */
  if(src.parts){const mv=PARTMV[id]?PARTMV[id](i,now):{};for(const p of src.parts){const pm=partImg(p,id);if(!pm.ok)continue;const q=g64?.5:1,px=x+p.px*q,py=y+p.py*q;c.save();c.translate(px,py);if(mv.rot)c.rotate(mv.rot);if(mv.sx!=null||mv.sy!=null)c.scale(mv.sx??1,mv.sy??1);c.translate(-px,-py);c.drawImage(pm,x+p.ax*q,y+p.ay*q,p.w*q,p.h*q);c.restore()}}/* 動く部品は、支点のまわりで動かして重ねる */
  if(sv)c.restore();c.imageSmoothingEnabled=sm;return true}
if(window.CHIPS)for(const k in window.CHIPS){const ch=window.CHIPS[k],id=k.split(/[@>:]/)[0];chipImgs(ch,id);for(const p of ch.parts||[])partImg(p,id)}/* 動く部品（ブランコの座面など）も *//* はじめに読みこんでおく */
const CONN={bedge:'s',fence:'f',logfence:'f',bamboofence:'f',wall:'w',hwall:'h',logwall:'h',plasterwall:'h',brickwall:'h',yozorawall:'h'},CONNR={'bedge':'HV','fence':'HV','logfence':'HV','bamboofence':'VH','wall':'HV','hwall':'HV','logwall':'HV','plasterwall':'HV','brickwall':'HV'};/* つながる物：横の部品（H0 柱・HL・HR・HLR 横板）と縦の部品（VU・VD・VUD 縦板）を、となりのつながりで組み合わせる。CONNR：角で横と縦を重ねる順 */
const LOGF=new Set(['logfence','logdoor','loggate']);
const GLX={gate:2.2,logdoor:32/3,loggate:32/3};/* 左がこのドア・門：右の柱がとなりのマスにはみ出すので、柵・塀の左はしをこのはばだけ描かない */
function connMask(id,i){if(ICON)return 3;/* アイコンは、左右につながった形で見せる */if(i==null||!S)return 0;const t=CONN[id];let f;if(t==='s')f=k=>typeAt(k)===id;/* 花壇のふちは、花壇のふちどうしだけつながる */else if(id==='logfence')f=k=>LOGF.has(typeAt(k));/* 丸太の塀は、丸太の塀・そのドア・大門とだけつながる（ほかの柵のとなりでは、はしの柱で終わる） */else if(t==='f')f=k=>FENCE_IDS.has(typeAt(k));else if(t==='w')f=k=>{const o=typeAt(k);return o==='wall'||o==='stonegate'};else f=(k,v)=>{const o=typeAt(k);return o!=='wall'&&o!=='sdoor'&&(HOME_WALLS.has(o)||!v&&HOME_DOORS.has(o))};/* 上下のドア（たて置きのドア）とはつながらない：ドアの上下の壁には、はしの柱を立てる */return (f(i-1)?1:0)|(f(i+1)?2:0)|(f(i-W,1)?4:0)|(f(i+W,1)?8:0)}/* 石の塀は、石の塀のドアのとなりでは終わる */
const FRAIL={fence:9.9,bamboofence:15.5};/* 丸太の塀は、たての帯がそのまま柱の上へつづく *//* 柵の上の横木のてっぺん（マスの上から。たての帯をここから柱にかぶせる） */
function doorVert(k){/* たて置きのドアか（左右に家の壁・ドアがなく、上か下にある） */if(!HOME_DOORS.has(typeAt(k)))return false;const isW=q=>{const t=typeAt(q);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))};return !isW(k-1)&&!isW(k+1)&&(isW(k-W)||isW(k+W))}
function drawConn(c,id,x,y,i,now){const C=window.CHIPS;if(!C)return false;const inn=!ICON&&i!=null&&HOME_WALLS.has(id)&&HOUSES.some(h=>h.inside.has(i+W)||h.inside.has(i+W-1)||h.inside.has(i+W+1)),K=k=>(inn&&C[k+'~in'])||C[k]/* 下かななめ下が家の中なら、かげのうすい絵（家の角も） */,m=connMask(id,i),hm=m&3,vm=(m&12)|(!ICON&&i!=null&&CONN[id]==='h'&&doorVert(i+W)?8:0)|(!ICON&&i!=null&&CONN[id]==='h'&&doorVert(i-W)?4:0)/* たて置きのドアの上と下の壁は、柱を立てず、断面のままドアの横の見切りまでつづける */,H=K(id+':'+['H0','HL','HR','HLR'][hm]),V=vm?K(id+':'+{4:'VU',8:'VD',12:'VUD'}[vm]):null;if(!H||vm&&!V)return false;
  if(id==='wall'&&!vm&&!ICON){const dl=!(hm&1)&&typeAt(i-1)==='sdoor',dr=!(hm&2)&&typeAt(i+1)==='sdoor';if(dl||dr){const H2=C['wall:'+['H0','HL','HR','HLR'][hm|(dl?1:0)|(dr?2:0)]];if(!H2||!drawChip(c,H2,id,x,y,now,i))return false;return true}}/* となりが石の塀のドア：塀はマスのはしまでのばす（ドアにつける柱は stoneFront でかく） */
  if(vm&&FRAIL[id]!=null&&!ICON&&i!=null){/* 板の柵・竹の柵：おくゆきの順にかさねる（生垣の見本と同じ）。北からくる たての帯は、横の柵・柱のうしろ。南へのびる たての帯は、横の柵・柱の前（下のマスが、柱の上の横木のてっぺん FRAIL から柱にかぶせる） */
    const VB=C[id+':VUD'],up=vm&4?connMask(id,i-W):0,over=vm&4&&(!(up&4)||(up&3)),t=y-32+FRAIL[id],band=(t0,b0,dy)=>{c.save();c.beginPath();c.rect(x-64,t0,192,b0-t0);c.clip();drawChip(c,VB,id,x,y+dy,now,i);c.restore()};
    if(hm){if(VB&&vm&4)band(y-64,y+16,0);/* 北からの帯は、柱のうしろで終わる */if(!drawChip(c,H,id,x,y,now,i))return false;if(hm===3&&C[id+':H0'])drawChip(c,C[id+':H0'],id,x,y,now,i)}/* 横の柵と、まじわる所の柱 */
    else if(!drawChip(c,V,id,x,y,now,i))return false;
    if(over&&VB){band(t,y,-32);c.fillStyle='rgba(70,45,25,.55)';c.fillRect(x+VB.ax/2,t,VB.w/2,1)}/* 上のマスが、はしの柱か、横の柵とまじわる柱なら、帯をその柱の横木のてっぺんからかぶせて、区切り線 */
    return true}
  if(id==='logfence'&&!ICON&&i!=null){/* 丸太の塀：おくゆきの順にかさねる。北からくる たての丸太は、横の塀・柱のうしろ。南へのびる たての丸太は、横の塀・柱の前（柱のてっぺんから） */
    const post=!((hm===3&&!vm)||(!hm&&vm===12)),VB=C['logfence:VUD'],P=C['logfence:H0'],band=(t,b,l=x-64,r=x+128)=>{c.save();c.beginPath();c.rect(l,t,r-l,b-t);c.clip();drawChip(c,VB,id,x,y,now,i);c.restore()};
    if(!post){if(hm)return drawChip(c,H,id,x,y,now,i);return drawChip(c,VB,id,x,y,now,i)}
    if(VB&&vm&4)band(y-64,y-4);/* うしろの帯は、柱のよこに y-4 まで見える */if(hm&&!drawChip(c,H,id,x,y,now,i))return false;if(P)drawChip(c,P,id,x,y,now,i);if(VB&&vm&8){band(y-4,y+.6,x+11.5,x+21.5);band(y,y+64)}/* 手前の帯は、柱のてっぺんの丸い面の下（y-4）から。はじめの丸太1本ぶんは、よこの板がなく、柱の鉄の輪が見える（お手本と同じ） */return true}
  if(!vm)return drawChip(c,H,id,x,y,now,i);if(hm&&C[id+':m'+m])return drawChip(c,K(id+':m'+m),id,x,y,now,i);/* 角・つなぎ目の絵があれば、部品を重ねずにそれを使う */if(!hm)return drawChip(c,V,id,x,y,now,i);const r=CONNR[id]||'HV';
  if(r==='VH'){if(!drawChip(c,V,id,x,y,now,i))return false;return drawChip(c,H,id,x,y,now,i)}
  if(!drawChip(c,H,id,x,y,now,i))return false;if(r==='Hclip'){c.save();c.beginPath();if(vm&4)c.rect(x-64,y-64,192,66);if(vm&8)c.rect(x-64,y+26,192,96);c.clip();drawChip(c,V,id,x,y,now,i);c.restore();return true}return drawChip(c,V,id,x,y,now,i)}
function berryOn(c,x,y){const bi=emoImg('🫐');if(!bi)return;for(const[cx,cy]of[[7,13.5],[25,19.5]]){const iw=14,ih=iw*bi.height/bi.width;c.drawImage(bi,x+cx-iw/2,y+cy-ih/2,iw,ih)}}/* 実ったベリーの茂み：運ぶときと同じベリーの絵を2つ、前の青い実と同じ位置・大きさ（はば14）にのせる */
const PCH=new Set(['tree','ntree','fruit','deadtree','berry','clover','bellf','salvia','lily','lotus','statue','volcano','hedge']);/* 植物などは、ようすで絵をえらぶ */
function plantChip(id,i,g){const C=window.CHIPS;if(!C)return null;if(!ICON&&i!=null&&S&&PLANTS.includes(id)&&isBud(i))return (id==='lotus'&&C['bud~w'])||C.bud||null;/* 芽（ハスは水の上なので、土のない芽） */
  if(id==='fruit'&&g>=100)return C[id+'#mi']||null;/* 実った絵（ベリーは、茂みの上に、運ぶときと同じベリーをのせる） */
  if(id==='hedge'){if(ICON||i==null||!S)return C.hedge||null;const t=k=>typeAt(k)==='hedge',hl=i%W>0&&t(i-1),hr=i%W<W-1&&t(i+1),m=(hl?1:0)|(hr?2:0)|(t(i-W)?4:0)|(t(i+W)?8:0);if(m&8)return C['hedge:'+m]||null;
    const rD=hr&&t(i+1+W),lD=hl&&t(i-1+W),fi=rD&&lD?18:rD?16:lD?17:m;return C['hedge:'+m+(fi!==m?'/'+fi:'')]||null}/* 生け垣は、となりとのつながりの形で */
  return C[id]||null}
function drawFarmChip(c,x,y,i,g,now){const C=window.CHIPS;if(!C)return false;if(ICON||i==null||!S){const ch=C.farm;return !!ch&&drawChip(c,ch,'farm',x,y,now,i)}
  const n=k=>S.obj[k]==='farm',gx=i%W,gy=(i/W)|0,m=(gx>0&&n(i-1)?1:0)|(gx<W-1&&n(i+1)?2:0)|(gy>0&&n(i-W)?4:0)|(gy<H-1&&n(i+W)?8:0),d=S.dyn[i],wet=!!d&&d.wet>0,base=C[(wet?'farmw:':'farm:')+m];
  if(!base||!chipImgs(base,'farm')[0].ok)return false;drawChip(c,base,'farm',x,y,now,i);/* 畑の土：となりの畑とのつながり・ぬれているか */
  const ov=k=>{const ch=(wet&&C[k+'w'])||C[k];if(ch)drawChip(c,ch,'farm',x,y,now,i)};/* ぬれている畑は、土がぬれた絵（<k>w） */
  if(d&&d.crop&&d.sown===false)ov(wet?'farm.moundw':'farm.mound');/* たねをえらんだ畑は、土がこんもり */
  if(d&&d.sown!==false&&!(g>0))ov('farm.sprout');/* 植え付けたら、土のもりあがりに小さい芽（育ちはじめたら作物の絵だけ） */
  if(g>0){const k=(d&&d.crop)||'mugi',st=g>=100?3:g>=60?2:1;ov(C['crop:'+k+st]?'crop:'+k+st:'crop:mugi'+st)}/* 作物：育ちぐあい3だん（土のもりあがりごと） */
  if(d&&d.sown!==false){if(g<100&&!workOn(i)){c.fillStyle='rgba(30,20,10,.45)';rr(c,x+4,y+TS-5,TS-8,4,2);c.fillStyle='#8fe06a';if(g>0)rr(c,x+4,y+TS-5,(TS-8)*g/100,4,2)}
    else{const tw=Math.sin((now||0)/300+i)*.5+.5;c.fillStyle='rgba(255,245,170,'+(.5+tw*.5)+')';const sx=x+TS-6,sy=y+5,r=2+tw*1.5;c.fillRect(sx-r,sy-.6,r*2,1.2);c.fillRect(sx-.6,sy-r,1.2,r*2)}}/* 育つまでのバーと、とれごろのきらきら */
  return true}
let BELLRING=-1e9;/* 村の鐘が鳴りはじめた時（4秒ゆれる） */
const DOORCH=new Set(['door','yozoradoor','gate','archedgate','stonegate','logdoor','loggate','sdoor']);/* ドア・門は、開きぐあいで絵をえらぶ */
function drawDoorChip(c,id,x,y,i,now){const C=window.CHIPS;if(!C)return false;
  if(ICON||i==null||!S){const ch=C[id];return !!ch&&drawChip(c,ch,id,x,y,now,i)}
  const pick=(o,op)=>C[id+'#'+o+Math.min(3,Math.round(op*3))],ok=o=>{const ch=C[id+'#'+o+'0'];return !!ch&&chipImgs(ch,id)[0].ok};
  if(id==='door'||id==='yozoradoor'){const isW=k=>{const t=typeAt(k);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))},L=isW(i-1),R=isW(i+1),U=isW(i-W),D=isW(i+W),hasV=U||D,hasH=L||R||!hasV;
    const wt=(hasH?[i-1,i+1,i-W,i+W]:[i-W,i+W,i-1,i+1]).map(typeAt).find(t=>t!=='wall'&&HOME_WALLS.has(t));/* 断面の色は、となりの壁に合わせる：よこ置きは左→右、たて置きは上→下 */
    if(c._doorBack){if(!hasH)return true;const m=(L?1:0)|(R?2:0)|(U?4:0)|(D?8:0),ch=(wt&&C[wt+'.'+id+':'+m])||C[id+':'+m];return !!ch&&drawChip(c,ch,id,x,y,now,i)}/* ドアの上の断面（静的な層） */
    const o=hasH?'h':'v';if(!ok(o))return false;const op=hasH?doorOp(i,x,y,.9,2.1):doorOp(i,x,y,2.1,.9),n=Math.min(3,Math.round(op*3));const sx=o==='h'&&HOUSES.some(h=>h.inside.has(i+W))?'~in':'';return drawChip(c,(wt&&(C[wt+'.'+id+'#'+o+n+sx]||C[wt+'.'+id+'#'+o+n]))||C[id+'#'+o+n+sx]||pick(o,op),id,x,y,now,i)}/* ドアの枠（よこ置き）・たて置きの断面も、となりの壁ごとの絵 */
  if(id==='stonegate'||id==='loggate'){const wide=S.obj[i]!==id||(S.obj[i+1]==='part'&&S.ref[i+1]===i);if(!wide||!ok('h'))return false;return drawChip(c,pick('h',doorOp(i,x+16,y,1.8,2.1)),id,x,y,now,i)}/* 大門は2マスはば */
  const isF=k=>{const t=typeAt(k);return FENCE_IDS.has(t)||t==='wall'||t==='sdoor'},ver=!(isF(i-1)||isF(i+1))&&(isF(i-W)||isF(i+W)),o=ver?'v':'h';if(!ok(o))return false;
  return drawChip(c,pick(o,doorOp(i,x,y,ver?2.1:.9,ver?.9:2.1)),id,x,y,now,i)}
function drawRoofItem(c,id,x,y){/* ガゼボ・東屋：2×2マス（左上が x,y）。絵（チップ）があれば、それを使う（うしろの柱 <id>:back は、べつの段でかく） */const ch=window.CHIPS&&CHIPS[id];if(ch&&drawChip(c,ch,id,x,y,0))return;
  const gz=id==='gazebo',P=gz?['#f4efe6','#d9d0c2']:['#8a5e3c','#6b4528'],R=gz?['#9cc7a3','#7fae88','#c9e3cc']:['#7d8590','#646b75','#a3abb5'];
  const post=(px,top,bot)=>{c.fillStyle=P[1];c.fillRect(px-2.5,top,5,bot-top);c.fillStyle=P[0];c.fillRect(px-2.5,top,3,bot-top)};
  post(x+8,y+4,y+34);post(x+56,y+4,y+34);/* おくの柱 */
  c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x+4,y+60,56,3);/* かげ */
  post(x+8,y+10,y+62);post(x+56,y+10,y+62);/* 手前の柱 */
  c.fillStyle=gz?'#efe7da':'#7a5232';c.fillRect(x+4,y+8,56,4);/* はり */
  c.fillStyle=R[1];c.beginPath();c.moveTo(x-2,y+10);c.lineTo(x+66,y+10);c.lineTo(x+52,y-14);c.lineTo(x+12,y-14);c.closePath();c.fill();/* 屋根（手前の面） */
  c.fillStyle=R[0];c.beginPath();c.moveTo(x+12,y-14);c.lineTo(x+52,y-14);c.lineTo(x+40,y-30);c.lineTo(x+24,y-30);c.closePath();c.fill();/* 屋根（上の面） */
  c.fillStyle=R[2];c.fillRect(x-2,y+8,68,2);c.fillRect(x+12,y-15,40,1.5);
  if(gz){c.fillStyle='#efe7da';c.fillRect(x+30,y-38,4,9);c.beginPath();c.arc(x+32,y-39,3,0,7);c.fill()}else{c.fillStyle=R[1];c.fillRect(x+22,y-33,20,4)}}
function drawObj(c,id,x,y,i,g,now){
  if(STAIRS.has(id)){if(ICON||i==null)drawStair(c,id,x,y,0,y+3,y+29);else drawStairObj(c,i);return}/* 階段は、段差といっしょに cliffStrip で描く（ここはアイコンだけ） */
  if(CANOPY.has(id)){if(ICON||i==null){const ch=window.CHIPS&&CHIPS[id],bk=window.CHIPS&&CHIPS[id+':back'];if(bk)drawChip(c,bk,id,x,y,0,i);if(ch&&drawChip(c,ch,id,x,y,0,i))return;c.save();c.translate(x+3,y+11);c.scale(.4,.4);drawRoofItem(c,id,0,0);c.restore()}else drawRoofItem(c,id,x,y);return}/* ガゼボ・東屋（アイコンは小さく） */
  if(id==='yorubed'&&!chipOf('yorubed',i)){drawObj(c,'bed',x,y,i,g,now);const v=i!=null&&S&&S.rot&&S.rot[i]%2===1;c.save();c.globalAlpha=.55;c.fillStyle='#2a3168';if(v)c.fillRect(x+6,y+8,20,-30<0?20:20);else c.fillRect(x+12,y+4,16,22);c.globalAlpha=1;c.fillStyle='#fff3b8';for(let n=0;n<4;n++)c.fillRect(x+(v?8:14)+hash((i||0)+n)*12,y+(v?10:6)+hash((i||0)*3+n)*16,1.5,1.5);c.restore();return}/* よぞらのベッド（仮の絵）：ふつうのベッドに夜空色のふとん */
  if(!c._chip&&id==='farm'&&drawFarmChip(c,x,y,i,g,now))return;/* 畑のドット絵 */
  if(!c._chip&&DOORCH.has(id)&&!(S&&S.win&&i!=null&&S.win[i]&&!c._win)&&drawDoorChip(c,id,x,y,i,now))return;/* ドア・門のドット絵（リースのあるドアは、リースの前にドアだけ） */
  if(CONN[id]&&!c._chip&&!(HOME_WALLS.has(id)&&S&&S.win&&S.win[i]&&!c._win)){const gL=CONN[id]==='f'&&!ICON&&i!=null&&GLX[typeAt(i-1)];if(gL){const gx=GLX[typeAt(i-1)];c.save();c.beginPath();c.rect(x+gx,y-64,96,160);c.clip()}/* 丸太の塀のドアの右の柱も、となりのマスにはみ出す *//* 左が柵のドア：ドアの右の柱（このマスの左はし2.4ドット。すきまが出ないよう2.2から描く）にかぶる板を描かない（横木は柱のふちから） */const ok=drawConn(c,id,x,y,i,now);if(gL)c.restore();if(ok){if(id==='wall')stoneFront(c,x,y,i);else if(HOME_WALLS.has(id)&&window.CHIPS[id+':ext'])wallFront(c,id,x,y,i);return}}/* つながる物は部品で（窓のある壁は、窓の前に壁だけ）。家の壁は、先に、となりの床を壁のふちまでのばす */
  if(!c._chip&&PCH.has(id)){const ch=plantChip(id,i,g);if(ch&&drawChip(c,ch,id,x,y,now,i)){if(id==='berry'&&g>=100)berryOn(c,x,y);if(id==='statue'&&i!=null&&!ICON)for(const q of[i-1,i+1])if(S.obj[q]==='obox'||S.obj[q]==='board')drawObj(c,S.obj[q],x+(q-i)*TS,y,q,0,now);/* 女神像の横の箱・ボードを手前に */return}}
  if(id==='andon'&&!ICON&&!c._chip&&window.CHIPS&&CHIPS['andon#on']&&darkness()>.15){if(drawChip(c,CHIPS['andon#on'],id,x,y,now,i))return}/* 行燈：暗くなったら、あかりのついた絵 */
  if(id==='onsen'&&!ICON&&!c._chip&&window.CHIPS&&CHIPS['onsen#1']){const ch=Math.floor(performance.now()/900)%2?CHIPS['onsen#1']:CHIPS.onsen;if(drawChip(c,ch,id,x,y,now,i))return}/* 露天ぶろ：湯気がゆらぐ */
  if(id==='bell'&&!ICON&&!c._chip&&window.CHIPS&&CHIPS['bell#1']){const t=performance.now()-BELLRING,ch=t<4500&&Math.floor(t/260)%2?CHIPS['bell#1']:CHIPS.bell;if(drawChip(c,ch,id,x,y,now,i))return}/* 村の鐘：朝に鳴るあいだ、ゆれる */
  if(!c._chip&&!c._win&&!SEATS.includes(id)&&!PCH.has(id)&&!DOORCH.has(id)&&id!=='farm'){const ch=chipOf(id,i);if(ch&&drawChip(c,ch,id,x,y,now,i))return}/* ドット絵があれば、それを使う（いすは、つりざおをかいてから下で） */
  if(BL[id]&&BL[id].cs&&!ICON&&!c._cs){const k=BL[id].cs;c.save();c.translate(x+16,y+20);c.scale(k,k);c.translate(-x-16,-y-20);c._cs=1;drawObj(c,id,x,y,i,g,now);c._cs=0;c.restore();return}/* ラグは、絵だけ大きく（判定はそのまま） */
  if(!ICON&&i!=null&&S&&PLANTS.includes(id)&&isBud(i)){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x+16,y+27,7,2.5,0,0,7);c.fill();c.fillStyle='#6fbf5a';c.fillRect(x+15,y+17,2,10);c.beginPath();c.ellipse(x+11,y+18,5,2.6,-.5,0,7);c.ellipse(x+21,y+18,5,2.6,.5,0,7);c.fill();return}/* 芽 */
  /* 向きをかえた家具は左右反転 */
  if(!ICON&&i!=null&&now!=null&&S&&SEATS.includes(id)){const w=spotW(i);if(w>=0&&!S.res.some(r=>r.act&&r.act.type==='fish'&&r.act.stage!=='walk'&&fishW(r.act.stand)===w)){/* 釣りスポットのうきと釣りざお（釣り中はかくす） */const px=x+(w%W-i%W)*TS+16,py=y+((w/W|0)-(i/W|0))*TS+17,bb=Math.sin(now/450+i)*1.2,vt=w%W===i%W,dx=Math.sign(px-(x+16))||1,dn=vt&&py>y,bx=vt?x+25:x+16+dx*10,by=vt?(dn?y+14:y+12):y+28,tx=vt?px+(dn?9:6):px-dx*4,ty=vt?py-(dn?8:14):py-20;/* 上下の水は竿をたてにのばす */c.save();c.lineCap='round';c.strokeStyle='#6b4a2b';c.lineWidth=2.2;c.beginPath();c.moveTo(bx,by);c.lineTo(tx,ty);c.stroke();c.strokeStyle='#a87a4a';c.lineWidth=1;c.beginPath();c.moveTo(bx+dx*.5,by-1);c.lineTo(tx,ty);c.stroke();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.6;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo(px,ty+4,px,py+bb-5);c.stroke();c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1;c.beginPath();c.ellipse(px,py+3,7+Math.sin(now/600)*1.5,2.5,0,0,7);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(px,py+bb,3.2,0,7);c.fill();c.fillStyle='#e0533d';c.beginPath();c.arc(px,py+bb,3.2,Math.PI,0);c.fill();c.fillRect(px-.6,py+bb-6,1.2,3);c.restore()}}
  if(!c._chip&&SEATS.includes(id)){const ch=chipOf(id,i);if(ch&&drawChip(c,ch,id,x,y,now,i))return}
  if((HOME_WALLS.has(id)||HOME_DOORS.has(id)&&S&&S.win&&S.win[i]==='wreath')&&!ICON&&!c._win&&S&&S.win&&S.win[i]){c._win=1;drawObj(c,id,x,y,i,g,now);c._win=0;c.save();c.translate(0,-1.5);if(S.win[i]===1)drawWin(c,i,x,y);else{const p=S.win[i];c._onWall=1;try{if(p==='curtain1'||p==='curtain2'){drawWin(c,i,x,y);const ch=chipOf(p);c.save();if(ch){if(!drawChip(c,ch,p,x,y,now,i)){c.translate(x+16,y-3);c.scale(1.35,.7);drawF2(c,p,-16,-3,i,now)}}else{c.translate(x+16,y+3);c.scale(1.07,.7);drawF2(c,p,-16,-3,i,now)}c.restore()}/* カーテンのチップを、窓の上に重ねる（大きさはチップそのもの） */else if(p==='wshelf'){c.save();c.translate(0,4);wallArt(c,p,x,y,i,now);c.restore()}else if(p==='wreath'&&HOME_DOORS.has(id)){const up=HOME_WALLS.has(S.obj[i-W])||HOME_DOORS.has(S.obj[i-W]),dn=HOME_WALLS.has(S.obj[i+W])||HOME_DOORS.has(S.obj[i+W]),lf=HOME_WALLS.has(S.obj[i-1])||HOME_DOORS.has(S.obj[i-1]),rt=HOME_WALLS.has(S.obj[i+1])||HOME_DOORS.has(S.obj[i+1]),vertical=(up||dn)&&!(lf||rt),op=DOOROP.get(i)||0;c.save();if(vertical){c.translate(x+16,y+3.5);c.rotate(op*Math.PI*.45);c.translate(-x-16,-y-3.5)}else{c.translate(x+7,y);c.scale(1-op*.78,1);c.translate(-x-7,-y)}wallArt(c,p,x,y,i,now);c.restore()}else wallArt(c,p,x,y,i,now)}finally{c._onWall=0}}c.restore();return}/* 壁にかけた絵・カーテン（窓つき）・かべ棚・ドアのリース */
  if(BL[id]&&BL[id].f2){const z=BL[id].sz;if(BL[id].dsc&&!ICON&&!c._sc){const k=BL[id].dsc;c.save();c.translate(x+16,y+31);c.scale(k,k);c._sc=1;drawF2(c,id,-16,-31,i,now);c._sc=0;c.restore();return}/* 絵だけ大きく（判定はそのまま） */if(z&&BL[id].nosc&&!ICON)return drawF2(c,id,x+16*(z[0]-1),y+32*(z[1]-1),i,now);/* マスは広いけど絵はそのまま */if(z&&!ICON&&!c._sc){c.save();c.translate(x,y);c.scale(z[0],z[1]);drawF2(c,id,0,0,i,now);c.restore();return}return drawF2(c,id,x,y,i,now)}/* 大きい家具は、マスに合わせて絵も大きく */
  if(id==='stonegate'&&!ICON&&!c._sc){
    const wide=S.obj[i]!==id||(S.obj[i+1]==='part'&&S.ref[i+1]===i),ver=!wide&&(HOME_WALLS.has(typeAt(i-W))||HOME_WALLS.has(typeAt(i+W)));
    const nw=wide?2:1,op=doorOp(i,x+(nw-1)*16,y,nw*.9,2.1);
    c.save();c.translate(x,y);c.scale(nw,1);const drawn=drawMossGate(c,0,0,i,ver,op);c.restore();if(drawn)return
  }
  if(id==='window'){drawObj(c,'hwall',x,y,i,g,now);c.save();c.translate(0,-1.5);drawWin(c,i,x,y);c.restore();return}
  if((BIG.has(id)||BIG2.has(id))&&!ICON&&!c._big){const z=BL[id].sz||[1,1],ax=x+16*z[0],ay=y+31*z[1],k=BIG2.has(id)?2:TREES.has(id)?2.25:(id==='stor'||id==='mbox')?32/26:(BIGK[id]||1.5);/* 箱は幅1マスぴったり */c.save();c.translate(ax,ay);c.scale(k,k);c.translate(-ax,-ay);c._big=1;drawObj(c,id,x+(id==='watch'||id==='yogan'?16:0),y+(id==='watch'||id==='yogan'?31:0),i,g,now);c._big=0;/* 見張り台は2×2マスのまんなかに、今までと同じ大きさで */c.restore();if(id==='statue'&&i!=null)for(const q of[i-1,i+1])if(S.obj[q]==='obox'||S.obj[q]==='board')drawObj(c,S.obj[q],x+(q-i)*TS,y,q,0,now);/* 大きな女神像の横の箱・ボードを手前に */return}
  {const FK={clover:'fl_clover',bellf:'fl_bell',salvia:'fl_salvia',lily:'fl_lily',lotus:'fl_lotus'},key=FK[id]?FK[id]:id==='tree'||id==='ntree'||id==='fruit'?'tree':id==='deadtree'?'dead':id==='rock'?'rock':id==='berry'?'bush':null,a=key&&ART[key];
   if(a&&a.ok){const w=FLOWERS.has(id)?26:id==='rock'?27:id==='deadtree'?22.5:30,h=w*a.h/a.w;if(!FLOWERS.has(id))shadow(c,x+16,y+28.5,w*.4,w*.1);/* 花は影（鉢のように見える）なし */c.drawImage(a.img,x+16-w/2,y+30-h,w,h);
     if(id==='berry'&&g>=100){const bi=emoImg('🫐');for(const[dx,dy]of[[-6,-6],[6,-2]]){if(bi){const ih=11,iw=ih*bi.width/bi.height;c.drawImage(bi,x+16+dx-iw/2,y+24+dy-ih/2,iw,ih)}else{circ(c,x+16+dx,y+24+dy,2.6,'#5b6fd1')}}}/* 実ったら、ベリーのアイコンを2つ */
     if(id==='fruit'&&g>=100){const ai=emoImg('🍎');for(const[dx,dy]of[[-6,9],[6,12],[0,3]]){if(ai){const ih=8,iw=ih*ai.width/ai.height;c.drawImage(ai,x+16+dx-iw/2,y+dy-ih/2,iw,ih)}else circ(c,x+16+dx,y+dy,2.4,'#e0453a')}}/* 果物の木：実がないときはふつうの木。実ったら、りんごのアイコン */
     return}}
  // 罠・伐採場・採石場は絵を使う（罠は使ったあと少しうすくなる）
  if(id==='windmill'&&PSPR.wmBody.ok&&PSPR.wmSail.ok){// 本体の上で羽がまわる（画像の座標系 → 1単位=k px）
    const k=.0548,bx=x+16,by=y+31,T=ICON||c._neutral?0:(now||0)/1000;if(c._part!=='part'){shadow(c,bx,by-2,12,3);c.drawImage(PSPR.wmBody.img,bx+(170-346)*k,by+(150-735)*k,360*k,595*k)}
    if(c._part!=='base'){c.save();c.translate(bx+(343-346)*k,by+(300-735)*k);c.rotate(T*.9);c.drawImage(PSPR.wmSail.img,-312*k,-312*k,624*k,624*k);c.restore()}return}
  if(SPR_OBJ.has(id)&&PSPR[id]&&PSPR[id].ok){const g=PSPR[id],T=now||0,trap=BL[id].trap,rd=!trap||ICON||!(S&&S.trapCd&&S.trapCd[i]>S.t);
    const w=trap?TS:id==='well'?42:48,h=w*g.h/g.w,bob=(id==='firetrap'||id==='gust')&&rd&&!ICON?1+Math.sin(T/180+i)*.04:1;
    shadow(c,x+16,y+28,w*.42,2.4);c.save();if(!rd)c.globalAlpha=.45;c.translate(x+16,y+(trap?32:31));c.scale(1,bob);c.drawImage(g.img,-w/2,-h,w,h);c.restore();return}
  const sz=BL[id]&&BL[id].sz;if(sz&&!ICON&&!c._sc&&id!=='bench'&&id!=='takebench'&&id!=='bed'&&id!=='yorubed'&&id!=='volcano'&&id!=='niguruma'){/* ベンチ・ベッドは絵がもともと2マスぶん */c.save();c.translate(x,y);c.scale(sz[0],sz[1]);c._sc=1;drawObj(c,id,0,0,i,g,now);c._sc=0;c.restore();return}
  const h=hash(i);
  switch(id){
  case'ntree':case'tree':shadow(c,x+16,y+28,12,4);c.fillStyle='#7a5132';c.fillRect(x+13,y+15,6,14);c.fillStyle='#5f3e25';c.fillRect(x+13,y+15,2,14);
    circ(c,x+16,y+11,13,'#2f7a3d');circ(c,x+10,y+13,8,'#2a6c36');circ(c,x+21,y+7,8,'#3f9a4c');circ(c,x+12,y+5,6,'#4cad58');circ(c,x+10,y+3,2.5,'#7fd36b');break;
  case'deadtree':{c.fillStyle='#e0c49a';c.beginPath();c.ellipse(x+16,y+28,12,3.5,0,0,7);c.fill();c.strokeStyle='#9a6a48';c.lineCap='round';
    c.fillStyle='#9a6a48';c.beginPath();c.moveTo(x+10,y+29);c.quadraticCurveTo(x+14,y+22,x+14,y+12);c.lineTo(x+18,y+12);c.quadraticCurveTo(x+18,y+22,x+23,y+29);c.fill();
    c.lineWidth=3;c.beginPath();c.moveTo(x+15,y+14);c.quadraticCurveTo(x+12,y+9,x+7,y+8);c.moveTo(x+16,y+13);c.lineTo(x+16,y+3);c.moveTo(x+17,y+15);c.quadraticCurveTo(x+21,y+10,x+26,y+9);c.stroke();
    c.lineWidth=2;c.beginPath();c.moveTo(x+16,y+5);c.lineTo(x+13,y+1);c.moveTo(x+16,y+6);c.lineTo(x+19,y+2);c.moveTo(x+8,y+8);c.lineTo(x+5,y+11);c.moveTo(x+24,y+9);c.lineTo(x+27,y+5);c.stroke();c.lineCap='butt';
    c.fillStyle='#6e4a30';c.beginPath();c.ellipse(x+17,y+20,1.6,2.6,0,0,7);c.fill();c.fillStyle='#b8865c';c.beginPath();c.ellipse(x+9,y+28,2.5,1.5,0,0,7);c.fill();break}
  case'hotstone':{shadow(c,x+16,y+27,12,3);blob(c,'#7a4a3a',[[x+5,y+27],[x+6,y+16],[x+13,y+9],[x+21,y+10],[x+27,y+17],[x+27,y+27]]);blob(c,'#a0563f',[[x+7,y+19],[x+13,y+10],[x+20,y+11],[x+17,y+17],[x+10,y+22]]);
    const gl=ICON?.8:.55+Math.sin(performance.now()/400+i)*.25;c.fillStyle='rgba(255,140,60,'+gl+')';c.beginPath();c.moveTo(x+12,y+24);c.lineTo(x+15,y+17);c.lineTo(x+14,y+13);c.lineTo(x+18,y+19);c.lineTo(x+21,y+24);c.fill();c.fillStyle='rgba(255,220,120,'+gl+')';c.fillRect(x+15,y+19,3,4);break}
  case'volcano':{const cx=x+48,by=y+94,T=(now||0)/1000;shadow(c,cx,by-2,60,8);
    c.fillStyle='#6f5a4f';c.beginPath();c.moveTo(x-22,by);c.quadraticCurveTo(x+8,y+42,cx-15,y+4);c.lineTo(cx+15,y+4);c.quadraticCurveTo(x+88,y+42,x+118,by);c.closePath();c.fill();
    c.fillStyle='#8a7062';c.beginPath();c.moveTo(x-10,by);c.quadraticCurveTo(x+16,y+46,cx-13,y+7);c.lineTo(cx-3,y+7);c.quadraticCurveTo(cx-12,y+52,cx-6,by);c.closePath();c.fill();
    c.fillStyle='#5a463d';for(const[dx,dy,r]of[[-30,70,5],[22,58,4],[34,80,6],[-12,40,3]]){c.beginPath();c.ellipse(cx+dx,y+dy,r*1.4,r*.7,0,0,7);c.fill()}
    c.fillStyle='#3f302b';c.beginPath();c.ellipse(cx,y+5,16,5,0,0,7);c.fill();
    const gl=.6+.4*Math.sin(T*2);c.fillStyle='rgba(255,'+((110+50*gl)|0)+',40,.95)';c.beginPath();c.ellipse(cx,y+5,11*(.8+.2*gl),3,0,0,7);c.fill();
    c.strokeStyle='rgba(255,'+((100+60*gl)|0)+',40,.85)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(cx+5,y+8);c.quadraticCurveTo(cx+11,y+28,cx+7,y+44);c.moveTo(cx-6,y+8);c.quadraticCurveTo(cx-12,y+22,cx-19,y+32);c.stroke();
    for(let k=0;k<4;k++){const ph=(T*.3+k/4)%1;c.fillStyle='rgba(105,96,94,'+(.5*(1-ph))+')';c.beginPath();c.arc(cx+Math.sin(T+k*2)*6+ph*16,y-2-ph*64,8+ph*16,0,7);c.fill()}
    break}
  case'boulder':{shadow(c,x+16,y+28,15,4);blob(c,'#76685f',[[x+1,y+28],[x+2,y+12],[x+10,y+3],[x+23,y+4],[x+31,y+13],[x+31,y+28]]);blob(c,'#958579',[[x+4,y+16],[x+11,y+5],[x+22,y+6],[x+18,y+14],[x+8,y+20]]);
    c.strokeStyle='#54483f';c.lineWidth=1.5;c.beginPath();c.moveTo(x+14,y+12);c.lineTo(x+18,y+20);c.lineTo(x+15,y+26);c.moveTo(x+18,y+20);c.lineTo(x+24,y+22);c.stroke();break}
  case'heatv':{const t=S&&S.st2,br=!t||(i===D2&&!t.d2fix)||!!(t.hvb&&t.hvb[i]),dir=t?(i===D1?t.d1:t.d2):1,T=(now||0)/1000;shadow(c,x+16,y+28,13,3.5);
    c.fillStyle='#665850';rr(c,x+3,y+17,26,12,3);c.fillStyle='#8a7b70';rr(c,x+5,y+13,22,8,3);
    c.fillStyle=br?'#4d4542':'#3b3330';c.beginPath();c.arc(x+16,y+12,8.5,0,7);c.fill();
    if(br){c.strokeStyle='#cbbcab';c.lineWidth=2;c.beginPath();c.moveTo(x+10,y+7);c.lineTo(x+15,y+13);c.lineTo(x+12,y+18);c.moveTo(x+21,y+6);c.lineTo(x+18,y+12);c.stroke()}
    else{const g=.6+.4*Math.sin(T*3);c.fillStyle='rgba(255,'+((120+50*g)|0)+',50,1)';c.beginPath();c.arc(x+16,y+12,5.5,0,7);c.fill();c.fillStyle='#fff3c0';c.save();c.translate(x+16,y+12);c.scale(dir===0?-1:1,1);c.beginPath();c.moveTo(4.5,0);c.lineTo(-2,-3.6);c.lineTo(-2,3.6);c.closePath();c.fill();c.restore()}
    break}
  case'crack':{const T=(now||0)/1000,g=.5+.5*Math.sin(T*2+(i||0));c.lineCap='round';c.strokeStyle='#3b2c26';c.lineWidth=4;c.beginPath();c.moveTo(x+3,y+9);c.lineTo(x+12,y+15);c.lineTo(x+9,y+22);c.lineTo(x+20,y+27);c.moveTo(x+12,y+15);c.lineTo(x+26,y+10);c.stroke();c.strokeStyle='rgba(255,'+((100+60*g)|0)+',40,.9)';c.lineWidth=1.6;c.stroke();break}
  case'rock':shadow(c,x+16,y+27,13,3);blob(c,'#b9ad9f',[[x+4,y+27],[x+5,y+15],[x+12,y+7],[x+21,y+8],[x+26,y+16],[x+27,y+27]]);blob(c,'#d3c9bd',[[x+6,y+18],[x+12,y+8],[x+20,y+9],[x+17,y+15],[x+9,y+21]]);
    blob(c,'#c5baae',[[x+19,y+29],[x+19,y+22],[x+24,y+19],[x+30,y+22],[x+30,y+29]]);blob(c,'#d9d0c5',[[x+20,y+23],[x+24,y+20],[x+28,y+22],[x+24,y+24]]);tuft(c,x+4,y+29,.7);tuft(c,x+29,y+30,.55);break;
  case'berry':{shadow(c,x+16,y+28,13,3);const B='#6ea84e',D='#5a9441',L='#8cc26a';
    for(const[dx,dy,r,col]of[[-9,-5,6,D],[9,-5,6,D],[-6,-11,7,B],[6,-11,7,B],[0,-15,7,L],[-10,0,6,B],[10,0,6,B],[0,-4,10,B]])circ(c,x+16+dx,y+24+dy,r,col);
    tuft(c,x+5,y+29,.6,D);tuft(c,x+27,y+29,.6,D);
    if(g>=100)for(const[dx,dy]of[[-6,-12],[5,-8],[-3,-2],[8,-15]]){circ(c,x+16+dx,y+24+dy,3,'#5b6fd1');c.fillStyle='#3f50a8';c.fillRect(x+15+dx,y+21.6+dy,2,1.2)}break}
  case'logwall':case'plasterwall':case'brickwall':case'yozorawall':{/* 丸太・しっくい・レンガ・よぞらの壁も、木の壁と同じ形（柱・断面・巾木・つなぎめなし）で、正面の帯だけ材質を変える */if(id==='yozorawall'&&!(i!=null&&!ICON&&HOUSES.some(h=>h.inside.has(i+W)||h.inside.has(i+W-1)||h.inside.has(i+W+1)))){drawObj(c,'hwall',x,y,i,g,now);break}/* よぞらの壁：家の外がわから見える面は、木の壁と同じ。家の角の壁も、中から見える面は夜空の色にして、はしまでつなげる */c._mat=id==='logwall'?'log':id==='plasterwall'?'plaster':id==='yozorawall'?'night':'brick';{const ck=c._chip;if(id==='yozorawall')c._chip=1;/* 家の中から見える面だけ夜空の色（木の壁のドット絵は使わない） */drawObj(c,'hwall',x,y,i,g,now);c._chip=ck}c._mat=0;break}
  case'door':case'hwall':{/* 壁：正面は1マスの高さ（y〜y+32）、断面（てっぺん）はその上（y-9〜y）にブラウン1色 */
    const door=id==='door';if(ICON&&door){const art=HOUSEART&&HOUSEART['wall-door'];if(art&&art.complete&&art.naturalWidth){c.drawImage(art,x+2,y+1,28,30);break}}
    if(ICON){c.save();c.translate(x+16,y+32);c.scale(.75,.75);c.translate(-x-16,-y-32)}
    const isW=k=>{const t=typeAt(k);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))};/* 家の壁・ドアは、柵や石の塀とはつながらない */const L=!ICON&&isW(i-1),R=!ICON&&isW(i+1),U=!ICON&&isW(i-W),D=!ICON&&isW(i+W);
    const MAT=c._mat||'wood',WT='#9a7350',T=9,hasV=U||D,hasH=L||R||!hasV,hx0=L||ICON?x:x+5,hx1=R||ICON?x+TS:x+27;
    const top=()=>{const rs=[];if(hasH)rs.push([hx0-(L?2:0),y-T,hx1+(R?2:0),y,hx0,y-T,hx1,y]);if(hasV)rs.push([x+5,y-T-(U?2:0),x+27,y-T+(D?TS+2:T),x+5,y-T,x+27,y-T+(D?TS:T)]);drawSection(c,x,y-T,rs)};/* 断面：エリア全体をひとつにつなげた輪郭（たて・よこのくぎりなし） */
    const front=(a,b)=>wallBand(c,MAT,a,b,x,y,i);
    const side=(a,b)=>{/* 柱・縦の壁のはしの正面：たて板 */c.fillStyle='rgba(0,0,0,.18)';c.fillRect(a,y+TS,b-a,2);c.fillStyle='#8a5e3c';c.fillRect(a,y,b-a,TS);c.fillStyle='#a8784e';for(const lx of[a+5,a+11,a+17])if(lx<b-2)c.fillRect(lx,y,1,TS);c.fillStyle='#b88550';c.fillRect(a,y,1.5,TS);c.fillRect(b-1.5,y,1.5,TS)};/* 柱には巾木をつけない */
    if(c._doorBack){if(door&&hasH)top();break}/* ドアの断面は、となりの壁と同じ下絵(静的な層)に描く */
    if(door&&hasV&&!hasH){let op=0;if(!ICON)op=doorOp(i,x,y,2.1,.9);/* 縦の壁のドア：断面のまま。戸口に断面の輪郭線を出し、戸板は線1本（開くと内がわへ回る） */
      drawSection(c,x,y-T,[[x+5,y-T-2,x+27,y-T+3,x+5,y-T,x+27,y-T+3],[x+5,y+TS-T-3,x+27,y+TS-T+2,x+5,y+TS-T-3,x+27,y+TS-T]]);
      {const Ln=TS-6,an=op*Math.PI*.45;c.save();c.translate(x+16,y-T+3);c.rotate(an);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-1,1,5,Ln);c.fillStyle='#8a5a33';c.fillRect(-2,0,4,Ln);c.fillStyle='#b88550';c.fillRect(-2,0,1.3,Ln);c.restore()}if(ICON)c.restore();break}
    if(door&&hasH){/* 正面のドア：1マスぴったり。絵の左はし（ちょうつがい）と右はし（取っ手）はそのまま、まん中の板だけのばす */const art=HOUSEART&&HOUSEART['wall-door'];let op=0;if(!ICON)op=doorOp(i,x,y,.9,2.1);
      c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x,y+TS,TS,2);c.fillStyle='#8a5e3c';c.fillRect(x,y,TS,TS);c.fillStyle='#a8784e';c.fillRect(x,y,TS,1);c.fillStyle='#4f3527';c.fillRect(x+2,y+2,TS-4,TS-2);
      if(art&&art.complete&&art.naturalWidth){const dw=TS-4,dy=y+2,dh=TS-2;c.save();c.translate(x+2,0);c.scale(1-op*.78,1);c.drawImage(art,19,18,26,149,0,dy,5,dh);c.drawImage(art,45,18,40,149,5,dy,dw-13,dh);c.drawImage(art,85,18,28,149,dw-8,dy,8,dh);c.restore()}
      else{c.fillStyle='#b77a49';c.fillRect(x+2,y+2,(TS-4)*(1-op*.78),TS-2)}
      if(ICON){top();c.restore()}break}
    if(ICON)front(x,x+TS);/* アイコンは、柱ではなく壁の正面を見せる */
    else if(hasH){if(!D){if(L&&R&&!U)front(x,x+TS);else{side(x+5,x+27);if(L)front(x,x+5);if(R)front(x+27,x+TS)}}else{if(L)front(x,x+5);if(R)front(x+27,x+TS)}}
    else if(!D)side(x+5,x+27);
    top();if(ICON)c.restore();break}
  case'sdoor':{const isF=k=>{const t=typeAt(k);return t==='wall'||t==='sdoor'||FENCE_IDS.has(t)};/* 木の柵・大門のとなりでも、たて置きは一本線（家の壁とはつながらない） */const L=!ICON&&isF(i-1),R=!ICON&&isF(i+1),U=!ICON&&isF(i-W),D=!ICON&&isF(i+W);const ver=!(L||R)&&(U||D);
    let op=0;if(!ICON)op=doorOp(i,x,y,ver?2.1:.9,ver?.9:2.1);if(ver&&!ICON){const an=op*Math.PI*.45;c.save();c.translate(x+16,y);c.rotate(an);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-1,1,5,TS);c.fillStyle='#8a5a33';c.fillRect(-2,0,4,TS);c.fillStyle='#b88550';c.fillRect(-2,0,1.3,TS);c.restore();break}/* たて置きは、家のドアと同じ一本線 */shadow(c,x+16,y+29,16,3);const stc='#c3bfb6',sto='#9a978f';
    if(!ver){c.fillStyle=sto;rr(c,x,y+3,7,26,2);rr(c,x+25,y+3,7,26,2);c.fillStyle=stc;rr(c,x+1,y+4,5,24,2);rr(c,x+26,y+4,5,24,2);const pw=18*(1-op*.82);c.fillStyle='#9a6a40';c.fillRect(x+7,y+8,pw,20);c.fillStyle='#b9824f';for(let k=0;k<3;k++)c.fillRect(x+7+k*pw/3+.5,y+8,pw/3-1,20);c.fillStyle='#6e4c32';c.fillRect(x+7,y+13,pw,1.5);c.fillRect(x+7,y+22,pw,1.5)}
    else{c.fillStyle=sto;rr(c,x+2,y-2,28,8,2);rr(c,x+2,y+25,28,7,2);const ph=18*(1-op*.82);c.fillStyle='#9a6a40';c.fillRect(x+9,y+6,14,ph);c.fillStyle='#6e4c32';c.fillRect(x+9,y+6+ph/2,14,1.5)}break}
  case'gate':case'archedgate':case'stonegate':case'logdoor':case'loggate':{const isF=k=>{const t=typeAt(k);return FENCE_IDS.has(t)||t==='wall'||t==='sdoor'};/* 柵・石の塀どうしはつながる。家の壁とはつながらない */const L=!ICON&&isF(i-1),R=!ICON&&isF(i+1),U=!ICON&&isF(i-W),D=!ICON&&isF(i+W);const ver=!(L||R)&&(U||D);
    let op=0;if(!ICON)op=doorOp(i,x,y,ver?2.1:.9,ver?.9:2.1);
    if(id==='stonegate'&&drawMossGate(c,x,y,i,ver,op))break;shadow(c,x+16,y+28,12,3);const P=id==='stonegate'?'#77756f':id==='archedgate'?'#704b32':'#a0703f',PC=id==='stonegate'?'#c3bfb6':id==='archedgate'?'#d8b275':'#d6a874',RL=id==='stonegate'?'#9a978f':id==='archedgate'?'#9b7049':'#c08a55',SL=id==='stonegate'?'#c3bfb6':id==='archedgate'?'#c99153':'#cf9c66';
    if(!ver){const pw=18*(1-op*.82);c.fillStyle=RL;c.fillRect(x+7,y+12,pw,4);c.fillRect(x+7,y+20,pw,4);c.fillStyle=SL;for(let k=0;k<3;k++)c.fillRect(x+7+pw*(k+.5)/3-1.5,y+10,3,16);
      c.fillStyle=P;c.fillRect(x+1,y+7,6,21);c.fillRect(x+25,y+7,6,21);c.fillStyle=PC;c.fillRect(x+1,y+7,6,3);c.fillRect(x+25,y+7,6,3)}
    else{const ph=18*(1-op*.82);c.fillStyle=RL;c.fillRect(x+12,y+7,3,ph);c.fillRect(x+17,y+7,3,ph);c.fillStyle=SL;for(let k=0;k<3;k++)c.fillRect(x+11,y+7+ph*(k+.5)/3-1.5,10,3);
      c.fillStyle=P;c.fillRect(x+12,y,8,7);c.fillRect(x+12,y+25,8,7);c.fillStyle=PC;c.fillRect(x+12,y,8,3);c.fillRect(x+12,y+25,8,3)}break}
  case'fence':case'logfence':case'bamboofence':case'wall':{const W2=id==='wall';const isF=k=>W2?(typeAt(k)==='wall'||typeAt(k)==='sdoor'||typeAt(k)==='stonegate'):FENCE_IDS.has(typeAt(k));const L=!ICON&&isF(i-1)&&!(W2&&typeAt(i-1)==='sdoor'),R=!ICON&&isF(i+1)&&!(W2&&typeAt(i+1)==='sdoor'),U=!ICON&&isF(i-W)&&!(W2&&typeAt(i-W)==='sdoor'),D=!ICON&&isF(i+W)&&!(W2&&typeAt(i+W)==='sdoor');/* 石の塀のドアの横では、塀はそこで終わって端の柱が立つ */
    if(W2)break;/* 石の塀（石垣）は部品の絵（drawConn・stoneFront）だけで描く */
    shadow(c,x+16,y+28,12,3);
    const sdL=!ICON&&!W2&&typeAt(i-1)==='sdoor',sdR=!ICON&&!W2&&typeAt(i+1)==='sdoor';/* 石の塀のドアのとなり：柵はドアのふちまでのびて、端の柱がドアにぴったりつく */
    if((sdL||sdR)&&(id==='logfence'||id==='fence')){const lg=id==='logfence';for(const px of[sdL?x:-1,sdR?x+24:-1]){if(px<0)continue;const rx=px<x+12?x+4:x+16;c.fillStyle=lg?'#85552f':'#c08a55';if(lg){rr(c,rx,y+11,12,6,2);rr(c,rx,y+20,12,6,2)}else{c.fillRect(rx,y+12,12,4);c.fillRect(rx,y+20,12,4)}c.fillStyle=lg?'#85552f':'#a0703f';c.fillRect(px,y+8,8,20);c.fillStyle=lg?'#c88c52':'#d6a874';c.fillRect(px,y+8,8,3)}}
    if(id==='logfence'){c.fillStyle='#85552f';if(L||R||!(U||D)){const x0=L?x:x+8,x1=R?x+TS:x+24;rr(c,x0,y+11,x1-x0,6,3);rr(c,x0,y+20,x1-x0,6,3)}if(U||D){rr(c,x+12,U?y:y+15,8,(U?17:0)+(D?17:0)+1,3)}c.fillStyle='#c88c52';c.fillRect(x+12,y+12,8,1.5);c.fillRect(x+12,y+21,8,1.5);break}
    if(id==='bamboofence'){c.fillStyle='#628044';for(const px of [x+5,x+13,x+21,x+29]){c.fillRect(px-1,y+7,2,22);c.fillStyle='#9fbd69';c.fillRect(px-.4,y+8,0.8,19);c.fillStyle='#628044'}c.fillStyle='#91aa5e';if(L||R||!(U||D)){const x0=L?x:x+3,x1=R?x+TS:x+29;c.fillRect(x0,y+11,x1-x0,3);c.fillRect(x0,y+21,x1-x0,3)}break}
    c.fillStyle='#c08a55';const hor=L||R||!(U||D);
    if(hor){c.fillRect(L?x:x+12,y+12,(L?16:4)+(R?16:4),4);c.fillRect(L?x:x+12,y+20,(L?16:4)+(R?16:4),4)}
    if(U||D)c.fillRect(x+13,U?y:y+14,6,(U?14:0)+(D?18:4));
    c.fillStyle='#a0703f';c.fillRect(x+12,y+8,8,20);c.fillStyle='#d6a874';c.fillRect(x+12,y+8,8,3);break}
  case'bed':if(BEDSPR.ok){shadow(c,x+16,y+30,13,3);{const bh=32*BEDSPR.h/BEDSPR.w;c.drawImage(BEDSPR.img,x,y+32-bh,32,bh)}break}/* 幅はぴったり1マス */shadow(c,x+16,y+30,13,3);c.fillStyle='#c07a48';rr(c,x+5,y+1,22,8,3);c.fillStyle='#d08a55';rr(c,x+4,y,4,10,2);rr(c,x+24,y,4,10,2);rr(c,x+8,y+1.5,16,4,2);
    c.fillStyle='#f3ead8';rr(c,x+6,y+6,20,20,3);c.fillStyle='#fbf5e8';rr(c,x+10,y+6,12,6,3);c.fillStyle='#e6dcc6';c.fillRect(x+11,y+11,10,1);
    c.fillStyle='#e4dccd';rr(c,x+5.5,y+13,21,15,3);c.fillStyle='#fbf8f1';rr(c,x+6,y+13,20,14,3);c.fillStyle='#ffffff';rr(c,x+5.5,y+13,21,4,2);c.fillStyle='#ddd4c3';c.fillRect(x+6,y+17,20,1);c.fillStyle='rgba(0,0,0,.06)';c.fillRect(x+9,y+20,8,1.2);c.fillRect(x+16,y+23,7,1.2);
    c.fillStyle='#c07a48';rr(c,x+5,y+24,22,6,2);c.fillStyle='#d08a55';rr(c,x+3,y+22,5,9,2);rr(c,x+24,y+22,5,9,2);c.fillStyle='#a8683c';c.fillRect(x+8,y+27,16,1);break;
  case'plot':{if(!chipOK('plot#0')||!drawChip(c,CHIPS['plot#'+((hash((i||0)*11+1)*4)|0)],'plot',x,y,0)){c.fillStyle='#8b6a45';rr(c,x+2,y+2,TS-4,TS-4,4);c.fillStyle='#7a5a38';for(let k=0;k<5;k++)c.fillRect(x+5+hash(i+k)*20,y+5+hash(i*3+k)*20,4,3)}/* 土はドット絵（もようちがい4つ） */
    c.strokeStyle='rgba(255,240,180,.7)';c.setLineDash([3,3]);c.lineWidth=1.5;c.strokeRect(x+3,y+3,TS-6,TS-6);c.setLineDash([]);
    if(g!=null&&g>0){c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+4,y+TS-6,TS-8,3);c.fillStyle='#ecdcbc';c.fillRect(x+4,y+TS-6,(TS-8)*Math.min(1,g/30),3)}break}
  case'farm':{const n=k=>!ICON&&S.obj[k]==='farm',gx=i%W,gy=(i/W)|0;
    const L=gx>0&&n(i-1),R=gx<W-1&&n(i+1),U=gy>0&&n(i-W),D=gy<H-1&&n(i+W);const wet=ICON?60:(S.dyn[i]?S.dyn[i].wet:0);
    c.fillStyle=wet>0?'#80553a':'#9a6a48';const fx=x+(L?0:2),fy=y+(U?0:2),fw=TS-(L?0:2)-(R?0:2),fh=TS-(U?0:2)-(D?0:2);rr(c,fx,fy,fw,fh,L&&R&&U&&D?0:5);
    if(!L)for(let k=0;k<3;k++)circ(c,x+3,y+6+k*10,3,c.fillStyle);if(!R)for(let k=0;k<3;k++)circ(c,x+29,y+6+k*10,3,c.fillStyle);
    c.fillStyle=wet>0?'#6b4630':'#835a3c';c.beginPath();c.ellipse(x+16,y+18,8,4.6,0,0,7);c.fill()
    if(wet>0){c.fillStyle='rgba(170,215,255,.3)';c.fillRect(x+6,y+4,6,1.5);c.fillRect(x+18,y+22,5,1.5)}
    if(!ICON&&S.dyn[i]&&S.dyn[i].crop&&S.dyn[i].sown===false){c.fillStyle='rgba(40,25,10,.3)';c.beginPath();c.ellipse(x+16,y+21,10,4.5,0,0,7);c.fill();c.fillStyle=wet>0?'#8a5c3e':'#a87650';c.beginPath();c.ellipse(x+16,y+18,10,6.5,0,Math.PI,0);c.ellipse(x+16,y+18,10,3,0,0,Math.PI);c.fill();c.fillStyle=wet>0?'rgba(190,140,100,.45)':'rgba(220,170,120,.5)';c.beginPath();c.ellipse(x+14,y+14.5,5,2,-.15,0,7);c.fill()/* たねをえらんだ畑は、土がこんもり */}
    if(!ICON&&S.dyn[i]&&S.dyn[i].sown!==false&&g<20){c.strokeStyle='#5fbf4f';c.lineWidth=1.6;c.beginPath();c.moveTo(x+16,y+19);c.lineTo(x+16,y+14.5);c.stroke();circ(c,x+14,y+14.5,2.2,'#7fd36b');circ(c,x+18,y+14,2.2,'#7fd36b')}/* 植え付けたら、小さい芽 */
    if(g>0)drawCrop(c,ICON?'imo':(S.dyn[i]&&S.dyn[i].crop)||'mugi',x,y,g,true);
    if(!ICON&&S.dyn[i]&&S.dyn[i].sown!==false){if(g<100&&!workOn(i)){c.fillStyle='rgba(30,20,10,.45)';rr(c,x+4,y+TS-5,TS-8,4,2);c.fillStyle='#8fe06a';if(g>0)rr(c,x+4,y+TS-5,(TS-8)*g/100,4,2)}
      else{const tw=Math.sin((now||0)/300+i)*.5+.5;c.fillStyle='rgba(255,245,170,'+(.5+tw*.5)+')';const sx=x+TS-6,sy=y+5,r=2+tw*1.5;c.fillRect(sx-r,sy-.6,r*2,1.2);c.fillRect(sx-.6,sy-r,1.2,r*2)}}
    break}
  case'sprout':{if(!ICON&&S&&i!=null&&S.ground[i]!==1&&S.dyn[i]&&S.dyn[i].userMound){const bob=Math.sin((now||0)/600+i)*.6;if(chipOK('mound#0')&&chipOK('seed#s')){drawChip(c,CHIPS['mound#'+Math.min(2,(hash(i*13+5)*3)|0)],'mound',x+16,y+28,0);drawChip(c,CHIPS['seed#s'],'seed',x+16,y+23+Math.round(bob),0);break}plantMound(c,x,y,i);drawSeedShape(c,x+16,y+23+bob,.48);break}if(S&&i!=null&&S.ground[i]===1&&!ICON){const b=Math.sin((now||0)/600+i)*1.5;if(chipOK('seedring')&&chipOK('seed')){drawChip(c,CHIPS.seedring,'seed',x+16,y+21,0);drawChip(c,CHIPS.seed,'seed',x+16,y+17+Math.round(b),0);break}c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(x+16,y+21,9,3,0,0,7);c.fill();drawSeedShape(c,x+16,y+17+b,1);break}/* 池に植える予定：種がぷかぷか */if(chipOK('sprout#plan'))drawChip(c,CHIPS['sprout#plan'],'sprout',x+16,y+22,0);else{c.fillStyle='rgba(120,90,50,.6)';c.beginPath();c.ellipse(x+16,y+22,9,5,0,0,7);c.fill();c.strokeStyle='#5fbf4f';c.lineWidth=2;c.beginPath();c.moveTo(x+16,y+21);c.lineTo(x+16,y+14);c.stroke();circ(c,x+13,y+14,3,'#7fd36b');circ(c,x+19,y+13,3,'#7fd36b')}
    c.strokeStyle='rgba(255,240,180,.8)';c.setLineDash([3,3]);c.lineWidth=1.5;c.strokeRect(x+3,y+3,TS-6,TS-6);c.setLineDash([]);break}
  case'site':{const d=ICON?null:S.dyn[i],sp=d&&siteSpan(d.build);
    if(sp&&SPR.site.ok){/* 建物の大きさに合わせた足場（見た目だけ。マスの判定は変えない） */const L=x+sp.x0*TS-2,Wd=sp.w*TS+4,Hd=Wd*91/104*sp.hf,B=y+sp.rows*TS;
      shadow(c,L+Wd/2,B-3,Wd/2-2,4);{const si=siteImg(Wd,Hd,i);if(si)c.drawImage(si,Math.round(L),Math.round(B-si.height));else c.drawImage(SPR.site.img,L,B-Hd,Wd,Hd)}
      const p=Math.min(1,d.p/d.need),bw=Math.min(Wd-8,64),bx=L+(Wd-bw)/2,by=B-Hd-10;c.fillStyle='rgba(0,0,0,.5)';rr(c,bx-1,by,bw+2,6,3);c.fillStyle='#ecdcbc';rr(c,bx,by+1,bw*p,4,2);break}
    if(SPR.site.ok){shadow(c,x+16,y+29,14,3);{const si=ICON?null:siteImg(34,30,i||0);if(si)c.drawImage(si,x-1,y+1);else c.drawImage(SPR.site.img,x-1,y+1,34,30)}if(d){const p=Math.min(1,d.p/d.need);c.fillStyle='rgba(0,0,0,.5)';rr(c,x+2,y-8,28,6,3);c.fillStyle='#ecdcbc';rr(c,x+3,y-7,26*p,4,2)}break}shadow(c,x+16,y+29,14,3);c.fillStyle='#c9a46a';c.fillRect(x+3,y+20,26,8);c.strokeStyle='#8a5a33';c.lineWidth=2.5;c.beginPath();c.moveTo(x+5,y+28);c.lineTo(x+5,y);c.moveTo(x+27,y+28);c.lineTo(x+27,y);c.moveTo(x+5,y+4);c.lineTo(x+27,y+4);c.moveTo(x+5,y+14);c.lineTo(x+27,y+14);c.moveTo(x+5,y+4);c.lineTo(x+27,y+14);c.stroke();
    if(d){const p=Math.min(1,d.p/d.need);c.fillStyle='rgba(0,0,0,.5)';rr(c,x+2,y-8,28,6,3);c.fillStyle='#ecdcbc';rr(c,x+3,y-7,26*p,4,2)}break}
  case'table':shadow(c,x+16,y+27,14,3.5);c.fillStyle='#a8703f';for(const lx of[6,23.5])rr(c,x+lx,y+16,3,12,1.5);c.fillStyle='#8f5f35';for(const lx of[10,19.5])rr(c,x+lx,y+16,2.6,9,1.3);
    c.fillStyle='#b57d4b';rr(c,x+2,y+12,28,6,3);c.fillStyle='#cf9561';rr(c,x+2,y+8,28,7,3.5);c.fillStyle='#dba872';c.fillRect(x+6,y+10,9,1);c.fillRect(x+17,y+12,8,1);break;
  case'stor':{shadow(c,x+16,y+29,14,3);circ(c,x+10,y+11,5,'#7ab35a');circ(c,x+22,y+9,5,'#8cc26a');circ(c,x+16,y+8,4,'#7ab35a');
    circ(c,x+11,y+14,5,'#e8604f');c.fillStyle='#7a4a2a';c.fillRect(x+10.5,y+7.5,1.2,3);circ(c,x+9.5,y+12.5,1.3,'rgba(255,255,255,.35)');
    c.fillStyle='#f2b24f';c.beginPath();c.ellipse(x+17,y+13,4,5,.3,0,7);c.fill();circ(c,x+22,y+14,4.4,'#f6efe2');circ(c,x+21,y+13,1.2,'#fff');crate(c,x,y);break}
  case'oven':{const on=ICON||S.res.some(q=>q.act&&q.act.type==='cook'&&q.act.stage==='do'&&q.act.obj===i),T=now||0;
    c.fillStyle='rgba(225,200,170,.6)';c.beginPath();c.ellipse(x+16,y+29,15,3.5,0,0,7);c.fill();
    c.fillStyle='#c4bbb0';c.beginPath();c.moveTo(x+2,y+28);c.quadraticCurveTo(x+1,y+6,x+16,y+5);c.quadraticCurveTo(x+31,y+6,x+30,y+28);c.closePath();c.fill();
    c.fillStyle='#d3cbc1';for(const[sx,sy,w,h]of[[4,10,9,5],[14,7,8,5],[22,10,7,5],[3,17,6,5],[24,17,6,5]])rr(c,x+sx,y+sy,w,h,2.4);
    blob(c,'#b3a99d',[[x+1,y+29],[x+1,y+22],[x+6,y+20],[x+10,y+23],[x+10,y+29]]);blob(c,'#b3a99d',[[x+22,y+29],[x+22,y+23],[x+27,y+20],[x+31,y+22],[x+31,y+29]]);
    c.fillStyle='#6e4a30';c.beginPath();c.moveTo(x+9,y+28);c.lineTo(x+9,y+20);c.quadraticCurveTo(x+16,y+11,x+23,y+20);c.lineTo(x+23,y+28);c.fill();
    c.fillStyle='#8a5a33';c.fillRect(x+10,y+26,12,2);c.fillStyle='#6b6762';rr(c,x+11,y+2,10,4,2);c.fillStyle='#57534f';rr(c,x+12,y+1,8,2,1);
    if(!on){c.fillStyle='rgba(255,120,40,.4)';c.fillRect(x+13,y+25,2,1.5);c.fillRect(x+17,y+25,2,1.5);break}
    const fl=ICON?1:.75+Math.sin(T/90+i)*.25;c.fillStyle='rgba(240,104,64,'+fl+')';c.beginPath();c.moveTo(x+11.5,y+26);c.quadraticCurveTo(x+11,y+19,x+16,y+15+Math.sin(T/80)*1);c.quadraticCurveTo(x+21,y+19,x+20.5,y+26);c.fill();
    c.fillStyle='rgba(255,196,90,'+fl+')';c.beginPath();c.moveTo(x+13.5,y+26);c.quadraticCurveTo(x+13.5,y+21,x+16,y+19);c.quadraticCurveTo(x+18.5,y+21,x+18.5,y+26);c.fill();
    c.fillStyle='rgba(255,160,80,.16)';c.beginPath();c.ellipse(x+16,y+30,15,4,0,0,7);c.fill();
    if(!ICON)for(let k=0;k<3;k++){const ph=((T/1600+k/3)%1);circ(c,x+16+Math.sin(ph*5+k)*3+ph*4,y-ph*16,2.2+ph*3.2,'rgba(240,232,215,'+(.75*(1-ph))+')')}break}
  case'mbox':{shadow(c,x+16,y+29,14,3);
    c.save();c.translate(x+12,y+11);c.rotate(-.35);c.fillStyle='#a8703f';rr(c,-8,-3,16,6,3);c.restore();circ(c,x+5.5,y+13.5,3.2,'#e8c08a');circ(c,x+5.5,y+13.5,1.6,'#d4a46a');
    c.fillStyle='#a8703f';rr(c,x+5,y+10,13,6,3);circ(c,x+6,y+13,3.2,'#ecc896');circ(c,x+6,y+13,1.5,'#d4a46a');
    blob(c,'#a9a39b',[[x+16,y+17],[x+17,y+10],[x+22,y+8],[x+25,y+12],[x+25,y+17]]);blob(c,'#8e8a84',[[x+22,y+16],[x+23,y+8],[x+28,y+7],[x+29,y+16]]);
    c.fillStyle='#7ab35a';c.beginPath();c.ellipse(x+26,y+6,1.8,4,.4,0,7);c.fill();crate(c,x,y);break}
  case'lumber':{shadow(c,x+16,y+29,15,3);c.fillStyle='#8a5a33';for(let k=0;k<3;k++){rr(c,x+3,y+18+k*-5,20,5,2.5)}c.fillStyle='#c99460';for(let k=0;k<3;k++)circ(c,x+5,y+20.5+k*-5,2.2,'#d6a36a');
    c.fillStyle='#6d4424';rr(c,x+21,y+20,9,8,2);c.fillStyle='#b07c50';c.fillRect(x+21,y+20,9,2);c.fillStyle='#6d4424';c.save();c.translate(x+26,y+20);c.rotate(-.5);c.fillRect(-1,-12,2,12);c.fillStyle='#a3a6ae';c.fillRect(-1,-13,6,4);c.restore();break}
  case'quarry':{shadow(c,x+16,y+29,15,3);circ(c,x+10,y+22,7,'#7d8088');circ(c,x+20,y+23,6,'#8d9098');circ(c,x+15,y+16,6,'#a3a6ae');circ(c,x+13,y+14,2,'#d4d5da');
    c.save();c.translate(x+24,y+14);c.rotate(.6);c.fillStyle='#6d4424';c.fillRect(-1,-2,2,14);c.strokeStyle='#5b5f68';c.lineWidth=2.5;c.beginPath();c.arc(0,4,8,Math.PI*1.15,Math.PI*1.85);c.stroke();c.restore();break}
  case'grave':{if(!ICON&&S.dyn[i]&&!S.dyn[i].buried){c.fillStyle='#6b4a2c';c.beginPath();c.ellipse(x+16,y+22,11,6,0,0,7);c.fill();c.fillStyle='#8a6644';c.beginPath();c.ellipse(x+16,y+20,9,4.5,0,0,7);c.fill();c.fillStyle='#8a5a33';c.fillRect(x+15,y+6,2.5,14);c.fillRect(x+11,y+9,10,2.5);break}shadow(c,x+16,y+28,11,3);c.fillStyle='#8d9098';c.beginPath();c.moveTo(x+8,y+27);c.lineTo(x+8,y+12);c.arc(x+16,y+12,8,Math.PI,0);c.lineTo(x+24,y+27);c.fill();c.fillStyle='#b3b6bd';c.beginPath();c.moveTo(x+9.5,y+26);c.lineTo(x+9.5,y+12);c.arc(x+16,y+12,6.5,Math.PI,0);c.lineTo(x+22.5,y+26);c.fill();
    c.fillStyle='#7d8088';c.fillRect(x+15,y+9,2,9);c.fillRect(x+12,y+12,8,2);c.fillStyle='#6b6e75';c.fillRect(x+6,y+26,20,3);circ(c,x+7,y+25,2.2,'#ff9cc0');circ(c,x+25,y+25,2.2,'#ffd35c');circ(c,x+7,y+25,.8,'#fff');circ(c,x+25,y+25,.8,'#fff');break}
  case'chair':{const tb=k=>!ICON&&typeAt(k)==='table',up=tb(i-W),lf=tb(i-1),rt=tb(i+1);shadow(c,x+16,y+28,9,2.5);
    const back=()=>{if(lf||rt){const bx=lf?x+21:x+7;c.fillStyle='#a8703f';rr(c,bx+1,y+12,2.5,12,1.2);c.fillStyle='#cf9561';rr(c,bx,y+3,5,13,2.5)}else if(up){c.fillStyle='#cf9561';rr(c,x+8,y+20,16,6,3)}else{c.fillStyle='#a8703f';rr(c,x+10,y+8,2.6,11,1.3);rr(c,x+19.5,y+8,2.6,11,1.3);c.fillStyle='#cf9561';rr(c,x+8,y+2,16,9,4);c.fillStyle='#dba872';c.fillRect(x+11,y+4,9,1.2)}};
    if(!up)back();c.fillStyle='#a8703f';rr(c,x+9,y+19,2.8,9,1.4);rr(c,x+20.2,y+19,2.8,9,1.4);c.fillStyle='#8f5f35';rr(c,x+12,y+19,2.4,6,1.2);rr(c,x+17.6,y+19,2.4,6,1.2);
    c.fillStyle='#b57d4b';rr(c,x+8,y+17,16,4,2);c.fillStyle='#cf9561';rr(c,x+8,y+14,16,5,2.5);if(up)back();break}
  case'lamp':{const T=now||0,f=Math.sin(T/110+(i||0))*.12;shadow(c,x+16,y+29,8,2.5);/* 篝火：木の三脚に鉄のかご、上で火がゆれる */
    {const g=c.createRadialGradient(x+16,y+4,1,x+16,y+4,14);g.addColorStop(0,'rgba(255,200,90,.45)');g.addColorStop(1,'rgba(255,160,60,0)');c.fillStyle=g;c.fillRect(x,y-10,32,28)}
    c.strokeStyle='#6e4a2c';c.lineWidth=2.2;c.lineCap='round';c.beginPath();c.moveTo(x+11,y+13);c.lineTo(x+7,y+29);c.moveTo(x+21,y+13);c.lineTo(x+25,y+29);c.moveTo(x+16,y+13);c.lineTo(x+16,y+28);c.stroke();c.strokeStyle='#8a6038';c.lineWidth=1.4;c.beginPath();c.moveTo(x+9,y+22);c.lineTo(x+23,y+22);c.stroke();c.lineCap='butt';
    c.fillStyle='#3e3a3a';c.beginPath();c.moveTo(x+7,y+8);c.lineTo(x+25,y+8);c.lineTo(x+22,y+15);c.lineTo(x+10,y+15);c.closePath();c.fill();c.fillStyle='#5a5452';c.fillRect(x+7,y+8,18,2);c.fillStyle='#2a2626';for(let k=0;k<3;k++)c.fillRect(x+11+k*4,y+10,1.2,5);
    const fl=(cx,h,w,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(cx-w,y+8);c.quadraticCurveTo(cx-w,y+8-h*.5,cx,y+8-h);c.quadraticCurveTo(cx+w,y+8-h*.5,cx+w,y+8);c.closePath();c.fill()};
    fl(x+16,13*(1+f),6,'#ff8a3d');fl(x+12,8*(1-f),3.5,'#ff6a2a');fl(x+20,9*(1+f*.8),3.5,'#ff6a2a');fl(x+16,8*(1-f*.5),3.5,'#ffd35c');fl(x+16,4,1.8,'#fff4c0');break}
  case'campfire':{const T=now||0;c.fillStyle='#7d5238';c.save();c.translate(x+16,y+22);c.rotate(.35);rr(c,-9,-2,18,4,2);c.rotate(-.7);rr(c,-9,-2,18,4,2);c.restore();
    for(let k=0;k<7;k++){const a=k/7*6.283+.3;const rx=x+16+Math.cos(a)*10,ry=y+22+Math.sin(a)*5;c.fillStyle=k%2?'#b3a99d':'#c4bbb0';c.beginPath();c.ellipse(rx,ry,4,3,0,0,7);c.fill()}
    const f=Math.sin(T/90+i)*1.5;c.fillStyle='#ef7b4a';c.beginPath();c.moveTo(x+10,y+21);c.quadraticCurveTo(x+9,y+12,x+13,y+9+f*.4);c.quadraticCurveTo(x+14,y+13,x+15,y+12);c.quadraticCurveTo(x+16,y+5,x+19,y+3-f);c.quadraticCurveTo(x+18,y+10,x+21,y+11);c.quadraticCurveTo(x+24,y+15,x+22,y+21);c.closePath();c.fill();
    c.fillStyle='#f9c55a';c.beginPath();c.moveTo(x+13,y+21);c.quadraticCurveTo(x+12,y+16,x+15,y+13+f*.3);c.quadraticCurveTo(x+16,y+16,x+17,y+15);c.quadraticCurveTo(x+20,y+17,x+19,y+21);c.closePath();c.fill();
    if(!ICON)for(let k=0;k<2;k++){const ph=((T/1700+k/2)%1);circ(c,x+18+Math.sin(ph*5)*3+ph*3,y+2-ph*14,1.8+ph*3,'rgba(240,232,215,'+(.7*(1-ph))+')')}break}
  case'yogan':{shadow(c,x+16,y+29,16,3.5);const L=(!ICON&&i!=null&&S&&S.hp&&S.hp['L'+i])||1,T=(now||0)/1000;
    blob(c,'#5a4038',[[x-1,y+29],[x+3,y+14],[x+9,y+5],[x+23,y+5],[x+29,y+14],[x+33,y+29]]);blob(c,'#74574c',[[x+2,y+27],[x+6,y+15],[x+11,y+8],[x+16,y+8],[x+12,y+16],[x+8,y+27]]);/* 岩の山 */
    c.fillStyle='#3a2a26';c.beginPath();c.ellipse(x+16,y+6,8,3,0,0,7);c.fill();const gl=ICON?.9:.7+Math.sin(T*3+(i||0))*.2;c.fillStyle='rgba(255,120,40,'+gl+')';c.beginPath();c.ellipse(x+16,y+6,6.5,2.2,0,0,7);c.fill();c.fillStyle='rgba(255,220,110,'+gl+')';c.beginPath();c.ellipse(x+16,y+5.6,3.5,1.1,0,0,7);c.fill();/* 火口のようがん */
    c.strokeStyle='rgba(255,130,50,'+(gl*.8)+')';c.lineWidth=1.6;c.beginPath();c.moveTo(x+13,y+8);c.lineTo(x+11,y+15);c.lineTo(x+12,y+21);c.moveTo(x+20,y+8);c.lineTo(x+22,y+14);c.stroke();c.lineWidth=1;/* ようがんのすじ */
    if(L>=2){c.fillStyle='#8a6a5c';for(const [a,b] of[[x+1,y+24],[x+27,y+23]]){c.beginPath();c.ellipse(a+2,b+2,3.5,2.5,0,0,7);c.fill()}}
    if(L>=3){c.fillStyle='#ffd84a';star4(c,x+16,y-3,3.5)}
    if(!ICON){for(let k=0;k<2;k++){const ph=((T*.5+k*.5+(i||0)*.13)%1);c.fillStyle='rgba(120,110,105,'+(.45*(1-ph))+')';c.beginPath();c.arc(x+15+k*3+Math.sin(ph*4)*2,y+2-ph*14,1.5+ph*3,0,7);c.fill()}}/* けむり */
    break}/* ようがん台（火山のふもと） */
  case'watch':{shadow(c,x+16,y+29,14,3);c.fillStyle='rgba(225,200,160,.7)';c.beginPath();c.ellipse(x+16,y+28,14,3.5,0,0,7);c.fill();
    c.strokeStyle='#a8703f';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(x+7,y+28);c.lineTo(x+9,y-2);c.moveTo(x+25,y+28);c.lineTo(x+23,y-2);c.stroke();
    c.lineWidth=2;c.beginPath();c.moveTo(x+8,y+24);c.lineTo(x+23,y+6);c.moveTo(x+24,y+24);c.lineTo(x+9,y+6);c.stroke();
    c.strokeStyle='#b8824f';c.lineWidth=1.6;c.beginPath();c.moveTo(x+26,y+28);c.lineTo(x+28,y+2);c.moveTo(x+30,y+28);c.lineTo(x+31.5,y+2);for(let k=0;k<5;k++){const yy=y+25-k*5.5;c.moveTo(x+26.2,yy);c.lineTo(x+30.3,yy)}c.stroke();c.lineCap='butt';
    c.fillStyle='#c98f5c';rr(c,x+4,y-4,24,7,2);c.fillStyle='#d9a46e';c.fillRect(x+4,y-4,24,2);c.fillStyle='#a8703f';c.fillRect(x+4,y+1,24,1.5);
    c.fillStyle='#a8703f';c.fillRect(x+7,y-14,2.5,11);c.fillRect(x+22.5,y-14,2.5,11);
    c.fillStyle='#d0694a';c.beginPath();c.moveTo(x+1,y-12);c.lineTo(x+16,y-23);c.lineTo(x+31,y-12);c.lineTo(x+29,y-10);c.lineTo(x+3,y-10);c.closePath();c.fill();c.fillStyle='#e07e5c';c.beginPath();c.moveTo(x+4,y-12.5);c.lineTo(x+16,y-21);c.lineTo(x+18,y-19.5);c.lineTo(x+7,y-12);c.closePath();c.fill();
    {const L=(!ICON&&i!=null&&S&&S.hp&&S.hp['L'+i])||1;/* 強化すると見た目が変わる：Lv2は旗、Lv3は金のかざりと星 */if(L>=2){c.fillStyle='#8a5a33';c.fillRect(x+15.4,y-34,1.5,12);c.fillStyle=L>=3?'#ffd84a':'#7fb4e8';c.beginPath();c.moveTo(x+16.9,y-34);c.lineTo(x+26,y-30.5);c.lineTo(x+16.9,y-27);c.closePath();c.fill()}
      if(L>=3){c.fillStyle='#ffd84a';c.fillRect(x+2.5,y-10.6,27,1.8);c.fillRect(x+4,y-3.6,24,1.2);star4(c,x+16,y-37,4.5)}}
    tuft(c,x+3,y+28,.6,'#7ab35a');break}
  case'torch':{const T=now||0;if(PSPR.torch&&PSPR.torch.ok){const g=PSPR.torch,h=40,w=h*g.w/g.h,fy=y+30-h*.78,fl=1+Math.sin(T/120+i)*.08;shadow(c,x+16,y+29,5,2);const gg=c.createRadialGradient(x+16,fy,1,x+16,fy,14*fl);gg.addColorStop(0,'rgba(255,200,90,.5)');gg.addColorStop(1,'rgba(255,200,90,0)');c.fillStyle=gg;c.fillRect(x+1,fy-15,30,30);c.drawImage(g.img,x+16-w/2,y+30-h,w,h);break}shadow(c,x+16,y+29,5,2);c.fillStyle='#8a5a33';c.fillRect(x+14,y+8,4,21);c.fillStyle='#6d4424';c.fillRect(x+12,y+6,8,4);
    const f=Math.sin(T/120+i)*1.5;const gg=c.createRadialGradient(x+16,y+3,1,x+16,y+3,12);gg.addColorStop(0,'rgba(255,200,90,.55)');gg.addColorStop(1,'rgba(255,200,90,0)');c.fillStyle=gg;c.fillRect(x+3,y-9,26,24);
    c.fillStyle='#ff8a3d';c.beginPath();c.moveTo(x+11,y+6);c.quadraticCurveTo(x+16+f,y-10,x+21,y+6);c.closePath();c.fill();c.fillStyle='#ffd35c';c.beginPath();c.moveTo(x+13.5,y+6);c.quadraticCurveTo(x+16+f*.6,y-3,x+18.5,y+6);c.closePath();c.fill();break}
  case'jar':shadow(c,x+16,y+29,9,3);c.fillStyle='#b5764a';c.beginPath();c.ellipse(x+16,y+19,10,10,0,0,7);c.fill();c.fillStyle='#c98a5a';c.beginPath();c.ellipse(x+14,y+17,6,6,0,0,7);c.fill();
    c.fillStyle='#9a6038';rr(c,x+10,y+5,12,5,2);c.fillStyle='#4f9fe0';c.beginPath();c.ellipse(x+16,y+7,5,1.6,0,0,7);c.fill();c.fillStyle='#8a5530';c.fillRect(x+7,y+20,18,1.5);break;
  case'basin':{const T=now||0;shadow(c,x+16,y+29,13,3);c.fillStyle='#9a978f';c.beginPath();c.ellipse(x+16,y+20,14,8,0,0,7);c.fill();c.fillStyle='#c3bfb6';c.beginPath();c.ellipse(x+16,y+18,14,7,0,0,7);c.fill();
    c.fillStyle='#4f9fe0';c.beginPath();c.ellipse(x+16,y+18,10.5,4.6,0,0,7);c.fill();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;const r2=(T/400+i)%1;c.beginPath();c.ellipse(x+16,y+18,3+r2*7,1.3+r2*3,0,0,7);c.stroke();
    c.fillStyle='#5a9441';c.beginPath();c.ellipse(x+9,y+17,3,1.6,.3,0,7);c.fill();break}
  case'bench':drawBench(c,x,y,false);break;
  case'kamizo':{/* カミサマの像：石の台に、石色のカミサマ */const pw=c._big?16:22;/* 2倍表示のとき台座は1マス幅 */shadow(c,x+16,y+29,pw/2+1,3.5);
    c.fillStyle='#8f8a82';rr(c,x+16-pw/2,y+22,pw,8,2);c.fillStyle='#b3ada3';rr(c,x+17-pw/2,y+21,pw-2,3,1.5);
    const G2=SPR.god;if(G2.ok){if(!G2.stone){const cv=document.createElement('canvas');cv.width=G2.img.naturalWidth;cv.height=G2.img.naturalHeight;const q=cv.getContext('2d');q.drawImage(G2.img,0,0);try{const d=q.getImageData(0,0,cv.width,cv.height),a=d.data;for(let i=0;i<a.length;i+=4){const l=(a[i]*.3+a[i+1]*.55+a[i+2]*.15)*.62+70;a[i]=l;a[i+1]=l*.98;a[i+2]=l*.93}q.putImageData(d,0,0)}catch(e){}G2.stone=cv}const h=24,w=h*G2.w/G2.h;c.drawImage(G2.stone,x+16-w/2,y+22-h,w,h)}
    else{circ(c,x+16,y+15,6,'#b3ada3');circ(c,x+16,y+8,4.5,'#c4beb4')}
    break}
  case'chochin':{/* おまつりのちょうちん：木の台から、赤いちょうちんをつるす */shadow(c,x+16,y+29,9,2.5);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};
    F(11,6,3,23,'#7a4f30');F(12,6,1,23,'#a8703f');F(10,26,7,3,'#5e3c24');F(11,5,12,2,'#7a4f30');F(20,7,1,3,'#3a2a20');
    F(17,10,8,2,'#3a2a20');F(16,12,10,10,'#d8452f');F(17,11,8,12,'#d8452f');F(17,14,8,1,'#a8321f');F(17,17,8,1,'#a8321f');F(17,20,8,1,'#a8321f');F(18,12,2,9,'#f08a6a');F(17,22,8,2,'#3a2a20');F(20,24,1,3,'#f9c55a');break}
  case'furin':{/* ふうりん：木のわくに、ガラスのすずと、ゆれる短冊 */shadow(c,x+16,y+29,9,2.5);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};const sw=ICON?0:Math.round(Math.sin((now||0)/380+(i||0))*2);
    F(8,6,3,23,'#7a4f30');F(21,6,3,23,'#7a4f30');F(7,4,18,3,'#5e3c24');F(9,28,14,2,'#5e3c24');F(15,7,1,3,'#3a2a20');
    F(12,10,8,6,'#9fd0ea');F(13,9,6,1,'#9fd0ea');F(13,11,2,3,'#e6f4fb');F(12,15,8,1,'#5e93b8');F(15,16,1,3,'#3a2a20');F(15+sw,19,3,7,'#f4ead8');F(15+sw,19,3,1,'#ef7b4a');break}
  case'ema':{/* えまかけ：屋根のある台に、ねがいごとの板 */shadow(c,x+16,y+29,12,2.5);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};
    F(5,9,3,20,'#7a4f30');F(24,9,3,20,'#7a4f30');F(3,6,26,3,'#5e3c24');F(2,8,28,2,'#3a2a20');F(6,14,20,2,'#a8703f');
    for(const[a,b]of[[7,16],[12,17],[17,16],[22,17],[9,22],[15,22],[20,22]]){F(a,b,4,4,'#d9a46e');F(a,b,4,1,'#f0c890');F(a+1,b-1,2,1,'#c4392e')}break}
  case'komainu':{/* こまいぬ：石の台にすわる、まもりの犬 */shadow(c,x+16,y+29,11,3);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};
    F(6,23,20,6,'#8f8a84');F(6,23,20,1,'#b3ada3');F(7,28,18,1,'#6f6a64');
    F(10,13,12,10,'#b9b3aa');F(9,8,10,8,'#c4beb4');F(18,10,5,4,'#b9b3aa');F(8,7,4,4,'#9b958c');F(16,7,4,3,'#9b958c');F(11,16,4,5,'#9b958c');F(20,18,3,5,'#a59f96');
    F(12,10,2,2,'#2b2b33');F(21,12,2,1,'#6f6a64');F(10,22,4,1,'#8f8a84');F(18,22,4,1,'#8f8a84');F(22,13,3,3,'#9b958c');break}
  case'bamboo':{/* 竹（仮の絵）：3本の竹と葉 */shadow(c,x+16,y+28,11,3);for(const[sx,top,col]of[[9,-14,'#7fb069'],[23,-8,'#76a862'],[16,-22,'#8fc078']]){c.fillStyle=col;c.fillRect(x+sx-2,y+top,4,29-top);c.fillStyle='#b5d99c';c.fillRect(x+sx-1.5,y+top,1,29-top);c.fillStyle='#5e8f4c';for(let ny=top+7;ny<27;ny+=8)c.fillRect(x+sx-2.5,y+ny,5,1.2)}c.fillStyle='#9fcf7f';for(const[lx,ly,a]of[[12,-18,-.6],[20,-24,.6],[27,-10,.5],[5,-12,-.5],[19,-14,.4]]){c.beginPath();c.ellipse(x+lx,y+ly,5,1.8,a,0,7);c.fill()}break}
  case'weed0g':case'weed0k':case'weed1g':case'weed1k':case'weedc':case'kinoko':drawWeed(c,id,x,y);break;
    case'takenoko':{/* たけのこ（仮の絵） */shadow(c,x+16,y+28,6,2);c.fillStyle='#c99c60';c.beginPath();c.moveTo(x+10.5,y+28);c.lineTo(x+16,y+13);c.lineTo(x+21.5,y+28);c.closePath();c.fill();c.fillStyle='#a87b47';c.beginPath();c.moveTo(x+10.5,y+28);c.lineTo(x+16,y+19);c.lineTo(x+13.5,y+28);c.closePath();c.fill();c.fillStyle='#e4c58f';c.beginPath();c.moveTo(x+21.5,y+28);c.lineTo(x+16,y+20);c.lineTo(x+18.5,y+28);c.closePath();c.fill();c.fillStyle='#9cc56f';c.beginPath();c.moveTo(x+14.5,y+16);c.lineTo(x+16,y+11);c.lineTo(x+17.5,y+16);c.closePath();c.fill();break}
  case'takebench':{/* 竹のベンチ（仮の絵）：横2マス */const w2=ICON?32:64,k=w2/64;shadow(c,x+w2/2,y+28,26*k,3);c.fillStyle='#6f9a52';for(const lx of[8,56])c.fillRect(x+lx*k-2,y+17,4,11);for(const[yy,col]of[[11,'#86b467'],[15.5,'#7aa95c'],[20,'#86b467']]){c.fillStyle=col;c.fillRect(x+3*k,y+yy,58*k,4);c.fillStyle='#b8dc9c';c.fillRect(x+3*k,y+yy,58*k,1);c.fillStyle='#5e8a45';for(const nx of[20,44])c.fillRect(x+nx*k,y+yy,1.2,4)}break}
  case'takeakari':{/* 竹あかり（仮の絵） */const T2=(now||0)/1000;shadow(c,x+16,y+28,6,2);c.fillStyle='#7fae62';c.fillRect(x+12,y+5,8,23);c.fillStyle='#a9d08a';c.fillRect(x+13,y+5,2,23);c.fillStyle='#5f8c47';c.fillRect(x+11.5,y+15,9,1.4);c.fillStyle='#e6f2d8';c.beginPath();c.ellipse(x+16,y+5,4,1.5,0,0,7);c.fill();const fl=.75+.25*Math.sin(T2*6+(i||0));c.fillStyle='rgba(255,214,120,'+fl+')';for(const[hx,hy]of[[16,9],[14,19],[18,21],[16,25]])c.fillRect(x+hx-.9,y+hy-.9,1.8,1.8);break}
  case'shishiodoshi':{/* ししおどし（仮の絵）：水がたまると竹がかたむく。支柱はまっすぐ */const T2=(now||0)/1000;shadow(c,x+16,y+28,12,3);c.fillStyle='#a8a8a2';c.beginPath();c.ellipse(x+21,y+25,8,3.5,0,0,7);c.fill();c.fillStyle='#a9d6ee';c.beginPath();c.ellipse(x+21,y+24.6,5.5,2,0,0,7);c.fill();c.fillStyle='#6f9a52';c.fillRect(x+7,y+11,3,17);c.fillStyle='#7fae62';c.fillRect(x+24,y+5,3,12);c.fillRect(x+18,y+5,9,3);const tl=(Math.sin(T2*.8+(i||0))>.9)?.35:-.22;c.save();c.translate(x+8.5,y+13);c.rotate(tl);c.fillStyle='#86b467';c.fillRect(-3,-2.5,15,5);c.fillStyle='#b5d99c';c.fillRect(-3,-2.5,15,1.2);c.restore();break}
  case'kadomatsu':{/* かどまつ：竹と松のかざり */shadow(c,x+16,y+29,10,3);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};
    for(const[a,b]of[[11,5],[15,2],[19,8]]){F(a,b,4,20,'#5b8f3a');F(a,b,1,20,'#7fb24f');F(a,b,4,2,'#c8e0a0');F(a,b+9,4,1,'#3f6b2a')}
    for(const[a,b]of[[7,17],[22,16],[9,13],[21,12]]){F(a,b,4,3,'#2f6b3a');F(a+1,b-1,2,1,'#3f8a4a')}
    F(8,21,16,8,'#c9a46a');F(8,21,16,1,'#e0c08a');F(8,24,16,1,'#6b4524');F(8,27,16,1,'#6b4524');F(14,24,4,4,'#c4392e');break}
  case'rockart':{/* つぼ：素焼きのつぼ */shadow(c,x+16,y+29,10,3);
    c.fillStyle='#b8643e';c.beginPath();c.moveTo(x+12,y+7);c.quadraticCurveTo(x+12,y+11,x+8,y+14);c.quadraticCurveTo(x+3,y+20,x+8,y+27);c.quadraticCurveTo(x+16,y+31,x+24,y+27);c.quadraticCurveTo(x+29,y+20,x+24,y+14);c.quadraticCurveTo(x+20,y+11,x+20,y+7);c.closePath();c.fill();
    c.fillStyle='#d27a4e';rr(c,x+10.5,y+4.5,11,3.5,1.5);c.fillStyle='#5a2e1a';c.fillRect(x+12.5,y+5.4,7,1.4);
    c.strokeStyle='#f0c9a0';c.lineWidth=1.3;c.beginPath();c.moveTo(x+7,y+18);c.quadraticCurveTo(x+16,y+21,x+25,y+18);c.stroke();
    c.beginPath();for(let k=0;k<5;k++){const xx=x+9+k*3.5;c.moveTo(xx,y+22);c.lineTo(xx+1.75,y+24.2);c.lineTo(xx+3.5,y+22)}c.stroke();
    c.fillStyle='rgba(255,255,255,.22)';c.beginPath();c.ellipse(x+11,y+19,1.6,4.5,-.3,0,7);c.fill();break}
  case'chime':{const T=now||0,sw=Math.sin(T/500+i)*.25;shadow(c,x+16,y+29,5,2);c.fillStyle='#8a5a33';c.fillRect(x+15,y+4,3,25);c.fillRect(x+9,y+4,14,3);
    c.save();c.translate(x+12,y+7);c.rotate(sw);c.strokeStyle='#ddd';c.lineWidth=.8;c.beginPath();c.moveTo(0,0);c.lineTo(0,4);c.stroke();c.fillStyle='rgba(180,225,255,.9)';c.beginPath();c.arc(0,8,4,Math.PI,0);c.lineTo(4,9);c.lineTo(-4,9);c.fill();c.fillStyle='#ff6a6a';c.fillRect(-1,9,2,6);c.fillStyle='#fff';c.fillRect(-2.5,14,5,4);c.restore();break}
  case'vane':{const T=now||0,a=c._neutral?0:Math.sin(T/1300+i)*.6;if(c._part!=='part'){shadow(c,x+16,y+29,6,2);c.fillStyle='#6d4424';c.fillRect(x+15,y+2,2.4,27);c.fillStyle='#8a8f98';c.fillRect(x+10,y+12,12,1.4);c.fillRect(x+15.5,y+7,1.4,10)}
    if(c._part!=='base'){c.save();c.translate(x+16,y+2);c.scale(Math.cos(a),1);c.fillStyle='#e0a43a';c.beginPath();c.moveTo(-9,0);c.lineTo(-3,-6);c.lineTo(4,-7);c.lineTo(8,-3);c.lineTo(4,1);c.closePath();c.fill();c.fillStyle='#e86a6a';c.fillRect(3,-9,3,3);c.fillStyle='#2b2b2b';c.fillRect(4,-5,1.5,1.5);c.restore()}break}
  case'arrow':c.save();c.translate(x+16,y+16);c.rotate(-.8);c.fillStyle='#a8743f';c.fillRect(-11,-1.5,20,3);c.fillStyle='#cfd3d8';c.beginPath();c.moveTo(14,0);c.lineTo(8,-4.5);c.lineTo(8,4.5);c.fill();c.fillStyle='#d9785b';c.fillRect(-13,-4.5,7,3);c.fillRect(-13,1.5,7,3);c.restore();break;
  case'spike':shadow(c,x+16,y+26,12,2);c.fillStyle='#7a6a55';rr(c,x+4,y+20,24,7,2);c.fillStyle='#cfd3d8';for(let k=0;k<4;k++){const sx=x+6+k*6;c.beginPath();c.moveTo(sx,y+21);c.lineTo(sx+2.5,y+12);c.lineTo(sx+5,y+21);c.closePath();c.fill()}
    c.fillStyle='rgba(0,0,0,.15)';for(let k=0;k<4;k++)c.fillRect(x+8.5+k*6,y+13,1,8);break;
  case'sticky':for(const[dx,dy,r]of[[-6,4,6],[5,2,7],[0,8,6]]){c.fillStyle='rgba(120,190,70,.75)';c.beginPath();c.ellipse(x+16+dx,y+18+dy,r,r*.55,0,0,7);c.fill()}
    c.strokeStyle='#4f8a39';c.lineWidth=1.5;for(const dx of[-7,0,7]){c.beginPath();c.moveTo(x+16+dx,y+24);c.quadraticCurveTo(x+16+dx-3,y+14,x+16+dx+1,y+9);c.stroke()}c.fillStyle='rgba(255,255,255,.5)';circ(c,x+12,y+19,1.3,'rgba(255,255,255,.6)');circ(c,x+20,y+23,1,'rgba(255,255,255,.6)');break;
  case'puddle':{const T=now||0,rd=!(S.trapCd&&S.trapCd[i]>S.t)||ICON;c.fillStyle=rd?'rgba(90,170,235,.8)':'rgba(90,170,235,.35)';c.beginPath();c.ellipse(x+16,y+20,13,7,0,0,7);c.fill();
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1;const r2=(T/700+i*.3)%1;c.beginPath();c.ellipse(x+16,y+20,3+r2*9,1.5+r2*4.5,0,0,7);c.stroke();c.fillStyle='rgba(255,255,255,.6)';c.fillRect(x+9,y+17,5,1.3);break}
  case'firetrap':{const T=now||0,rd=!(S.trapCd&&S.trapCd[i]>S.t)||ICON;shadow(c,x+16,y+26,12,2);c.fillStyle='#6b6f78';rr(c,x+4,y+16,24,11,3);c.fillStyle='#3a3f48';for(let k=0;k<3;k++)rr(c,x+7+k*7,y+19,5,5,1.5);
    if(rd){c.fillStyle='rgba(255,120,50,'+(.5+Math.sin(T/200+i)*.3)+')';for(let k=0;k<3;k++)circ(c,x+9.5+k*7,y+21.5,1.6,'rgba(255,150,60,.9)')}break}
  case'gust':{const T=now||0,rd=!(S.trapCd&&S.trapCd[i]>S.t)||ICON;c.fillStyle='rgba(63,192,160,.25)';c.beginPath();c.ellipse(x+16,y+21,13,6,0,0,7);c.fill();
    c.strokeStyle=rd?'rgba(63,192,160,.95)':'rgba(63,192,160,.4)';c.lineWidth=1.6;const a0=(rd?T/250:0)+i;for(let k=0;k<3;k++){c.beginPath();c.ellipse(x+16,y+21-k*4,10-k*2.5,4-k*.8,0,a0+k,a0+k+4.2);c.stroke()}break}
  case'swing':x+=16;/* 2マスのまん中 */if(PSPR.swing&&PSPR.swing.ok){if(c._part!=='part')shadow(c,x+16,y+29,15,3);const g=PSPR.swing,w=38,h=w*g.h/g.w;if(c._part||!ICON&&i!=null&&now!=null&&toyUsers(i).length){const s0=w/80,L0=x+16-w/2,T0=y+30-h,d=c._neutral?0:swAng(i,now),sk=1+d*.12,sy=T0+48*s0+d*6;/* わくはそのまま、つなと座面だけゆらす */if(c._part!=='part'){c.save();c.beginPath();c.rect(L0,T0,w,h);c.rect(L0+60*s0,T0+8*s0,-40*s0,48*s0);c.clip('evenodd');c.drawImage(g.img,L0,T0,w,h);c.restore()}if(c._part==='base')break;const hw=19*s0*sk;c.strokeStyle='#d8c08e';c.lineWidth=1;c.beginPath();c.moveTo(L0+25.5*s0,T0+6*s0);c.lineTo(x+16-hw+4.5*s0,sy-3*s0);c.moveTo(L0+53.5*s0,T0+6*s0);c.lineTo(x+16+hw-4.5*s0,sy-3*s0);c.stroke();c.drawImage(g.img,21,43,38,11,x+16-hw,sy-5*s0*sk,hw*2,11*s0*sk)}else c.drawImage(g.img,x+16-w/2,y+30-h,w,h);break}/* 乗っているとゆれる */shadow(c,x+16,y+29,13,3);c.strokeStyle='#6d4424';c.lineWidth=3;c.beginPath();c.moveTo(x+4,y+29);c.lineTo(x+8,y-6);c.lineTo(x+12,y+29);c.moveTo(x+20,y+29);c.lineTo(x+24,y-6);c.lineTo(x+28,y+29);c.moveTo(x+8,y-6);c.lineTo(x+24,y-6);c.stroke();c.strokeStyle='#ddd';c.lineWidth=1;c.beginPath();c.moveTo(x+12,y-6);c.lineTo(x+12,y+16);c.moveTo(x+20,y-6);c.lineTo(x+20,y+16);c.stroke();c.fillStyle='#e86a6a';c.fillRect(x+10,y+16,12,3);break;
  case'fruit':{shadow(c,x+16,y+29,12,3.5);c.fillStyle='#9a6a48';c.beginPath();c.moveTo(x+11,y+29);c.quadraticCurveTo(x+14,y+24,x+14,y+16);c.lineTo(x+18,y+16);c.quadraticCurveTo(x+18,y+24,x+21,y+29);c.fill();
    for(const[dx,dy,r,col]of[[-8,1,7.5,'#5a9441'],[8,1,7.5,'#5a9441'],[-5,-7,8,'#6ea84e'],[5,-7,8,'#6ea84e'],[0,-11,8,'#86bf63'],[0,-1,9,'#78b257'],[-3,-10,3.5,'#9fd07c']])circ(c,x+16+dx,y+13+dy,r,col);
    tuft(c,x+7,y+30,.6,'#7ab35a');tuft(c,x+25,y+30,.6,'#7ab35a');
    if(g>=100)for(const[dx,dy]of[[-6,-1],[5,-6],[7,3]]){const fx2=x+16+dx,fy=y+13+dy;circ(c,fx2,fy,3.6,'#e8604f');c.fillStyle='#7a4a2a';c.fillRect(fx2-.5,fy-5,1.1,2.4);circ(c,fx2-1.2,fy-1.2,1,'rgba(255,255,255,.4)')}break}
  case'ladder_wood':case'ladder_bamboo':{/* ハシゴ（コードの絵）：オークは木の色、竹はうすい緑で節つき。正面は、がけに立てかけて、上のマスのふちまで。横向きは、ななめに */const bb=id==='ladder_bamboo',RC=bb?'#b8c26a':'#c08f58',RD=bb?'#8e9c44':'#8a5f35',RL=bb?'#dde39a':'#dcae72',d=i!=null&&S&&!ICON?ladderDir(i):0;
    const rail=(x1,y1,x2,y2)=>{c.lineCap='round';c.strokeStyle=RD;c.lineWidth=3.2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=RC;c.lineWidth=2.2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=RL;c.lineWidth=.7;c.beginPath();c.moveTo(x1-.5,y1);c.lineTo(x2-.5,y2);c.stroke()};
    const rung=(x1,y1,x2,y2)=>{c.strokeStyle=RD;c.lineWidth=2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=bb?'#cfd683':'#cf9f66';c.lineWidth=1.1;c.beginPath();c.moveTo(x1,y1-.3);c.lineTo(x2,y2-.3);c.stroke()};
    const lad=(x1,x2,top,bot)=>{for(let yy=bot-4;yy>top+2;yy-=5)rung(x1+.5,yy,x2-.5,yy);rail(x1,top,x1,bot);rail(x2,top,x2,bot);if(bb)for(const xx of[x1,x2])for(let yy=bot-7;yy>top+1;yy-=10){c.fillStyle=RD;c.fillRect(xx-1.6,yy,3.2,1)}};/* まっすぐ立てたハシゴ（竹は節つき） */
    if(d<=0||ICON){const top=ICON?y+2:y-LIFT-1,bot=ICON?y+TS-3:y+2;if(!ICON){c.fillStyle='rgba(40,30,20,.16)';c.fillRect(x+10,top+2,15,bot-top-2)}/* がけにおちるかげ */lad(x+9,x+23,top,bot)}/* 正面：がけの正面だけ（下のマスにはみ出さない） */
    else{const x0=d===1?x+.5:x+TS-4.5,ya=y+8,yb=y+24;/* 横向き：がけのよこに立てかけたハシゴを真上から見た形。ほぼ一本の線（はばの向きに、がけのふちにそって）。両はしがレールの頭 */
      c.fillStyle='rgba(40,30,20,.18)';c.fillRect(d===1?x0+4:x0-1.5,ya+1,1.5,yb-ya);/* かげ */
      c.fillStyle=RD;c.fillRect(x0,ya,4,yb-ya);c.fillStyle=RC;c.fillRect(x0+.6,ya+.6,2.8,yb-ya-1.2);c.fillStyle=RL;c.fillRect(x0+.6,ya+.6,1,yb-ya-1.2);/* いちばん上の段（上から見ると、この線だけ見える） */
      for(const yy of[ya,yb-4]){c.fillStyle=RD;c.fillRect(x0-.5,yy,5,4);c.fillStyle=RC;c.fillRect(x0+.2,yy+.6,3.6,2.8);c.fillStyle=RL;c.fillRect(x0+.2,yy+.6,3.6,.8)}}/* レールの頭 */
    break}
  case'bridge':{/* 木の橋（仮の絵）：わたる向きに板をならべ、両がわに手すり */const wt=k=>k>=0&&k<W*H&&S.ground[k]===1&&S.obj[k]!=='bridge',hz=i==null||!S?true:(wt(i-W)||wt(i+W))&&!(wt(i-1)&&wt(i+1))||!(wt(i-W)||wt(i+W))&&!(wt(i-1)||wt(i+1));const D='#8a5f35',M='#b98a55',L='#d2a46c';
    c.fillStyle='rgba(20,40,60,.22)';if(hz)c.fillRect(x,y+24,TS,4);else c.fillRect(x+24,y,4,TS);
    if(hz){c.fillStyle=M;c.fillRect(x,y+7,TS,17);c.fillStyle=D;for(let k=0;k<=TS;k+=5)c.fillRect(x+k,y+7,.8,17);c.fillStyle=L;c.fillRect(x,y+7,TS,1.2);c.fillStyle=D;c.fillRect(x,y+4,TS,2.4);c.fillRect(x,y+23,TS,2.4)}
    else{c.fillStyle=M;c.fillRect(x+7,y,17,TS);c.fillStyle=D;for(let k=0;k<=TS;k+=5)c.fillRect(x+7,y+k,17,.8);c.fillStyle=L;c.fillRect(x+7,y,1.2,TS);c.fillStyle=D;c.fillRect(x+4,y,2.4,TS);c.fillRect(x+23,y,2.4,TS)}
    break}
  case'well':shadow(c,x+16,y+29,13,3);c.fillStyle='#7d8088';rr(c,x+5,y+14,22,15,4);c.fillStyle='#a3a6ae';rr(c,x+5,y+12,22,6,3);c.fillStyle='#3a8cc4';c.fillRect(x+8,y+13,16,3);c.fillStyle='#6d4424';c.fillRect(x+6,y-4,3,18);c.fillRect(x+23,y-4,3,18);c.fillStyle='#c4523f';c.beginPath();c.moveTo(x+2,y-2);c.lineTo(x+16,y-10);c.lineTo(x+30,y-2);c.fill();c.strokeStyle='#ddd';c.lineWidth=1;c.beginPath();c.moveTo(x+16,y-2);c.lineTo(x+16,y+9);c.stroke();c.fillStyle='#8a5a33';c.fillRect(x+13,y+8,6,4);break;
  case'windmill':{if(c._part!=='part'){shadow(c,x+16,y+29,12,3);c.fillStyle='#f1e2c4';c.beginPath();c.moveTo(x+8,y+29);c.lineTo(x+12,y-4);c.lineTo(x+20,y-4);c.lineTo(x+24,y+29);c.fill();c.fillStyle='#8a5a33';c.fillRect(x+13,y+19,6,10);c.fillStyle='#c4523f';c.beginPath();c.moveTo(x+10,y-3);c.lineTo(x+16,y-11);c.lineTo(x+22,y-3);c.fill()}
    const a=c._neutral?0:(now||0)/900;if(c._part!=='base'){c.save();c.translate(x+16,y-4);c.rotate(a);c.fillStyle='#fff';for(let k=0;k<4;k++){c.rotate(Math.PI/2);c.fillRect(-2,2,4,15);c.fillStyle='#e9e2d0';c.fillRect(-2,8,4,2);c.fillStyle='#fff'}c.restore();circ(c,x+16,y-4,2.4,'#6d4424')}break}

  case'lighthouse':{const T=now||0;shadow(c,x+16,y+29,12,3);c.fillStyle='#eadfc8';c.beginPath();c.moveTo(x+8,y+29);c.lineTo(x+12,y+2);c.lineTo(x+20,y+2);c.lineTo(x+24,y+29);c.fill();c.fillStyle='#c4523f';c.beginPath();c.moveTo(x+9.4,y+20);c.lineTo(x+10.6,y+13);c.lineTo(x+21.4,y+13);c.lineTo(x+22.6,y+20);c.fill();c.fillStyle='#8a5a33';rr(c,x+13,y+22,6,7,2);
    c.fillStyle='#3a3f4a';c.fillRect(x+10,y-3,12,6);const f=.65+.35*Math.sin(T/260);c.fillStyle='rgba(255,215,110,'+f+')';c.fillRect(x+12,y-2,8,4);c.fillStyle='#c4523f';c.beginPath();c.moveTo(x+9,y-3);c.lineTo(x+16,y-11);c.lineTo(x+23,y-3);c.fill();
    c.fillStyle='rgba(255,225,140,'+(.18*f)+')';circ(c,x+16,y,9,c.fillStyle);break}
  case'stele':{shadow(c,x+16,y+30,15,3);c.fillStyle='#8d9098';c.beginPath();c.moveTo(x,y+31);c.lineTo(x+1,y-4);c.quadraticCurveTo(x+16,y-16,x+31,y-4);c.lineTo(x+32,y+31);c.fill();c.fillStyle='#a8abb3';c.beginPath();c.moveTo(x+4,y+29);c.lineTo(x+5,y-2);c.quadraticCurveTo(x+10,y-9,x+17,y-10);c.lineTo(x+12,y+29);c.fill();
    c.strokeStyle='#5d616b';c.lineWidth=1.8;c.beginPath();c.moveTo(x+16,y+1);c.lineTo(x+16,y+18);c.moveTo(x+9,y+7);c.lineTo(x+23,y+7);c.moveTo(x+11,y+13);c.lineTo(x+21,y+13);c.stroke();
    c.fillStyle='#6ea84e';rr(c,x,y+25,9,6,3);rr(c,x+22,y+27,10,4,2);tuft(c,x+14,y+31,.6,'#7ab35a');break}
  case'fountain':{const t=(now||0)/1000;shadow(c,x+16,y+28,15,3.5);
    for(const[dx,dy]of[[-12,-2],[12,-2]])circ(c,x+16+dx,y+17+dy,4,'#5a9441');
    c.fillStyle='#b8ada0';c.beginPath();c.ellipse(x+16,y+22,14,7,0,0,7);c.fill();c.fillStyle='#cdc3b6';c.beginPath();c.ellipse(x+16,y+20,14,6.5,0,0,7);c.fill();
    c.fillStyle='#7fbde6';c.beginPath();c.ellipse(x+16,y+20,10.5,4.2,0,0,7);c.fill();c.fillStyle='#a6d4f2';c.beginPath();c.ellipse(x+14,y+19,6,2,0,0,7);c.fill();
    for(let k=0;k<8;k++){const a=k/8*6.283;c.fillStyle=k%2?'#c4b9ab':'#d6ccbf';c.beginPath();c.ellipse(x+16+Math.cos(a)*12.5,y+21+Math.sin(a)*5.6,3.4,2.4,0,0,7);c.fill()}
    c.fillStyle='#b8ada0';rr(c,x+13,y+8,6,12,2);c.fillStyle='#cdc3b6';c.beginPath();c.ellipse(x+16,y+8,7,2.6,0,0,7);c.fill();c.fillStyle='#7fbde6';c.beginPath();c.ellipse(x+16,y+7.6,5,1.6,0,0,7);c.fill();
    circ(c,x+16,y+4,2.6,'#c4b9ab');circ(c,x+15.3,y+3.4,1,'#ddd4c8');
    c.strokeStyle='rgba(168,214,245,.85)';c.lineWidth=1.4;for(const sx of[-1,1]){c.beginPath();c.moveTo(x+16+sx*5,y+8);c.quadraticCurveTo(x+16+sx*8,y+9,x+16+sx*8,y+18);c.stroke()}
    for(let k=0;k<4;k++){const ph=(t*1.6+k/4)%1,sx=k%2?1:-1;circ(c,x+16+sx*(8+ph*2),y+18-ph*1.5,.9+ph*.5,'rgba(255,255,255,'+(1-ph)+')')}break}
  case'statue':{tBase(c,x,y);const T=now||0;
    c.fillStyle=TCD;rr(c,x-6,y+12,TS+12,9,4);c.fillStyle=TCR;rr(c,x-5,y+11,TS+10,5,3);c.fillStyle='rgba(91,143,214,.35)';c.beginPath();c.ellipse(x+16,y+14,9,2.6,0,0,7);c.fill();
    for(const px of[x,x+26]){c.fillStyle=TCR;rr(c,px,y-10,6,22,2);c.fillStyle=TCD;c.fillRect(px+4,y-10,2,22);c.fillStyle=TBL;c.fillRect(px-.5,y-11,7,2.5);c.fillRect(px-.5,y+9,7,2);c.fillStyle=TGO;c.fillRect(px-.5,y-12.5,7,1.5)}
    c.fillStyle=TCD;c.beginPath();c.moveTo(x-4,y-12);c.lineTo(x+16,y-27);c.lineTo(x+36,y-12);c.closePath();c.fill();c.fillStyle=TCR;c.beginPath();c.moveTo(x-1,y-13);c.lineTo(x+16,y-25);c.lineTo(x+33,y-13);c.closePath();c.fill();
    c.fillStyle=TCS;c.fillRect(x-4,y-13,40,3);c.fillStyle=TBL;c.fillRect(x-4,y-11,40,1.5);tStar(c,x+16,y-18,4.5);
    const fy=Math.sin(T/700)*1.5,gl=.55+Math.sin(T/450)*.2;const gg=c.createRadialGradient(x+16,y+2+fy,1,x+16,y+2+fy,13);gg.addColorStop(0,'rgba(140,200,255,'+gl+')');gg.addColorStop(1,'rgba(140,200,255,0)');c.fillStyle=gg;c.fillRect(x+3,y-11,26,26);
    c.fillStyle=TBL2;c.beginPath();c.moveTo(x+16,y-8+fy);c.lineTo(x+21,y+1+fy);c.lineTo(x+16,y+10+fy);c.lineTo(x+11,y+1+fy);c.closePath();c.fill();c.fillStyle='#e6f2ff';c.beginPath();c.moveTo(x+16,y-6+fy);c.lineTo(x+18,y+1+fy);c.lineTo(x+16,y+7+fy);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.75)';c.fillRect(x+15.4,y-12+fy+Math.sin(T/300)*1,1.2,1.2);break}
  case'obox':{tBase(c,x,y);shadow(c,x+16,y+25,14,3);
    c.fillStyle=TCD;rr(c,x+3,y+4,26,20,3);c.fillStyle=TCR;rr(c,x+3,y+2,26,6,3);c.fillStyle='#6e4a30';rr(c,x+7,y+3,18,4,1.5);c.fillStyle=TGO;c.fillRect(x+7,y+3,18,1);
    for(const px of[x+3,x+25]){c.fillStyle='#e6dccb';rr(c,px,y+8,4,15,1.5);c.fillStyle=TBL;c.fillRect(px,y+9,4,1.6);c.fillStyle=TGO;c.fillRect(px,y+21,4,2)}
    tStar(c,x+16,y+15,5);c.fillStyle=TCS;c.fillRect(x+3,y+22,26,2);break}
  case'altar':{c.fillStyle=TCS;rr(c,x-2,y+1,TS+4,TS-2,6);c.fillStyle=TCR;rr(c,x-1,y,TS+2,TS-6,6);c.fillStyle=TCD;rr(c,x+1,y+TS-9,TS-2,4,2);
    const tw=now?Math.sin(now/500)*.5+.5:.6;c.fillStyle='rgba(91,143,214,'+(.25+tw*.2)+')';c.beginPath();c.ellipse(x+16,y+12,11,6,0,0,7);c.fill();c.strokeStyle=TGO;c.lineWidth=1.2;c.beginPath();c.ellipse(x+16,y+12,11,6,0,0,7);c.stroke();
    c.fillStyle='rgba(143,186,240,'+(.6+tw*.3)+')';c.beginPath();c.ellipse(x+16,y+12,5,2.6,0,0,7);c.fill();
    for(let k=0;k<4;k++){const an=k*Math.PI/2+(now||0)/1400;circ(c,x+16+Math.cos(an)*11,y+12+Math.sin(an)*6,1.1,'#bfe0ff')}break}
  case'board':{tBase(c,x,y);shadow(c,x+16,y+26,13,3);
    c.fillStyle='#6e4a30';c.fillRect(x+5,y-6,4,32);c.fillRect(x+25,y-6,4,32);circ(c,x+7,y-8,2.4,TGO);circ(c,x+27,y-8,2.4,TGO);
    c.fillStyle='#7d5238';c.beginPath();c.moveTo(x+3,y+16);c.lineTo(x+3,y-3);c.quadraticCurveTo(x+17,y-10,x+31,y-3);c.lineTo(x+31,y+16);c.closePath();c.fill();
    c.fillStyle='#b98a5e';rr(c,x+6,y-1,23,15,1.5);c.fillStyle='#a57a50';c.fillRect(x+6,y+5,23,1);
    circ(c,x+17,y-6,5,'#2f4f86');tStar(c,x+17,y-6,4);
    const n=ICON?3:S.orders.length;const px=[[7,1],[14,2],[21,1]];for(let k=0;k<Math.min(3,n);k++){const[a,b]=px[k];c.fillStyle='#f6ecd6';rr(c,x+a,y+b,6,9,1);c.fillStyle='#d4c3a2';c.fillRect(x+a+1,y+b+3,4,.8);c.fillRect(x+a+1,y+b+5,3,.8);circ(c,x+a+3,y+b+.5,.9,'#8a5a33')}
    tBanner(c,x+31,y-4,12,now);break}
  case'site2':{if(!ICON){/* 大きな足場は本体（site）がまとめて描くので、ここは足もとの資材だけ */c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.ellipse(x+16,y+27,12,3,0,0,7);c.fill();
      c.fillStyle='#b98a58';c.fillRect(x+7,y+21,18,3);c.fillStyle='#a87a4a';c.fillRect(x+9,y+18,16,3);c.fillStyle='#9a9a94';circ(c,x+24,y+24,3,'#a8a8a0');break}
    if(SPR.site.ok){shadow(c,x+16,y+29,14,3);if(i%2){c.save();c.translate(x+16,0);c.scale(-1,1);c.drawImage(SPR.site.img,-17,y+1,34,30);c.restore()}else c.drawImage(SPR.site.img,x-1,y+1,34,30);break}shadow(c,x+16,y+29,14,3);c.fillStyle='#c9a46a';c.fillRect(x+3,y+20,26,8);c.strokeStyle='#8a5a33';c.lineWidth=2.5;c.beginPath();c.moveTo(x+5,y+28);c.lineTo(x+5,y+6);c.moveTo(x+27,y+28);c.lineTo(x+27,y+6);c.moveTo(x+5,y+10);c.lineTo(x+27,y+10);c.stroke();break}
  case'tower':{shadow(c,x+16,y+29,16,4);c.fillStyle='#9ea4ad';rr(c,x+2,y+20,28,9,3);c.fillStyle='#b8bcc4';rr(c,x+4,y+18,24,5,2);c.fillStyle='#c4523f';c.fillRect(x+7,y-8,4,28);c.fillRect(x+21,y-8,4,28);c.fillRect(x+3,y-12,26,4);c.fillRect(x+5,y-4,22,3);c.fillStyle='#8a2f22';c.fillRect(x+1,y-14,30,3);
    const p=(now||0)/600;const gl=c.createRadialGradient(x+16,y+6,1,x+16,y+6,12);gl.addColorStop(0,'rgba(255,250,200,.95)');gl.addColorStop(1,'rgba(255,220,120,0)');c.fillStyle=gl;c.fillRect(x+2,y-8,28,28);circ(c,x+16,y+6+Math.sin(p)*1.5,4,'#fffbe0');break}
  }
}
