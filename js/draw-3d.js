'use strict';
/* ---------- 3Dの描き方とのつなぎ（js/3d の R3D をよぶ） ----------
   地形・せいれいは3D。ほかの物は、いまの描き方（drawObj など）で描いたものを、3Dの中に立てた板（ビルボード）にする。
   - 立てる物：描くあいだ、ctx の drawImage をうけとめ、チップの1コマの絵（atlasFrame）ならその絵と場所だけをおぼえる（3Dのがわで絵のページにつめる）。
     コードで描く所（色の四角・線・文字など）がある物は、その物ぜんぶを、毎コマ描く絵のページ（RASTER）に描く。
   - 地面にはる物（畑・ラグ・置ける所の色・わく・落ち影など）：地面の描き方のまま、地面の絵（クォータービューの地面の点のキャンバス）に描いて、3Dの地形にはる。
   - ふきだし・エフェクト・夜の暗さなど、上にかさねる物は、いまのキャンバス（#cv）に、3Dのカメラで写した場所へ描く。
   G3（iso.js）：on＝3Dで描く・O＝描き方の点のおき場所（板・地面の絵を描くあいだ）。 */
const G3K=1,G3RK=2,G3DMAX=2;/* 板の点の細かさ（ゲームの1点＝1）・コードで描く物を描く細かさ（ゲームの1点＝2ドット）・地面の絵の細かさの上限 */
const G3DEF=[-56,-104,56,28];/* 大きさのわからない物の、描くわく（足もとからのゲームの点） */
const G3PATH=new Set(['path','gravel','woodpath','stone','brick']);/* 道（ふちがやわらかい）。ほかの床は、マスのとおりの床 */
const G3FCOL={path:[217,185,138],gravel:[184,173,156],woodpath:[181,138,92],stone:[189,182,170],brick:[194,122,92],floor:[199,154,102],brickfloor:[184,112,90],stonefloor:[170,164,154],herrfloor:[110,64,48],carpet:[200,106,106]};/* 道・床の色（仮。3段めで、物の形といっしょに作る） */
const G3X={q:[],ras:null,rx:0,ry:0,rh:0,used:false,cur:null,dc:null,dr:null,sync:0,S:null,W:null,sp:[],spv:new WeakMap(),z0:null,dpr0:null};
const C0={};
function g3Ready(){return !!(window.R3D&&R3D.ok)}
/* 3Dのカメラを、いまの cam にあわせる（G3.O のあいだは、本当の拡大で） */
function g3View(){if(!g3Ready())return;const z=G3X.z0!=null?G3X.z0:cam.z,cx=G3X.z0!=null?G3X.cx:camCX(),cy=G3X.z0!=null?G3X.cy:camCY();const key=cx+','+cy+','+z+','+VW+','+VH;if(key===G3X.vk)return;G3X.vk=key;R3D.view(cx/TS,cy/TS,z,VW,VH)}/* かわったときだけ */
/* 足もと A（objFoot・ptFoot）の3Dの点（マス） */
function g3Anc(A,lv){let X,Z,L;if(A.lv!=null){L=A.lv;const w=isoInv(A.px,A.py+L*IQL);X=w.x/TS;Z=w.y/TS}else{X=A.fx/TS;Z=A.fy/TS;L=lv!=null?lv:Math.max(0,hiAt(clamp(Math.floor(Z),0,H-1)*W+clamp(Math.floor(X),0,W-1)))}
  let h=L*R3D.HSTEP;const tx=Math.floor(X),tz=Math.floor(Z);if(tx>=0&&tz>=0&&tx<W&&tz<H&&Math.max(0,hiAt(tz*W+tx))===L)h=R3D.groundH(X,Z);return[X,h,Z]}
function g3AncS(A,lv){g3View();const a=g3Anc(A,lv);return R3D.project(a[0],a[1],a[2])}
/* クォータービューのゲームの点 (px,py) に見えていた地面の点を、3Dで写した所（上にかさねる物） */
function g3IsoS(px,py){g3View();let w=isoInv(px,py),L=0;for(let lv=HMAX;lv>=1;lv--){const q=isoInv(px,py+lv*IQL),tx=Math.floor(q.x/TS),ty=Math.floor(q.y/TS);if(tx>=0&&ty>=0&&tx<W&&ty<H&&hiAt(ty*W+tx)===lv){w=q;L=lv;break}}
  return R3D.project(w.x/TS,L*R3D.HSTEP,w.y/TS)}
/* ctx の描く所をうけとめる（はじめに1回） */
function g3Hook(){if(C0.drawImage)return;for(const n of['drawImage','fill','fillRect','stroke','strokeRect','fillText','strokeText','putImageData','clip'])C0[n]=ctx[n];
  ctx.drawImage=function(im){if(!G3X.rec)return C0.drawImage.apply(this,arguments);g3RecImg(this,arguments)};
  for(const n of['fill','fillRect','stroke','strokeRect','fillText','strokeText','putImageData','clip'])ctx[n]=function(){if(!G3X.rec)return C0[n].apply(this,arguments);G3X.ras=1}}
function g3RecImg(c,a){const im=a[0];if(G3X.ras)return;
  const ok=im&&(im._chip===1&&im.ok===1||im instanceof HTMLImageElement&&im.complete&&im.naturalWidth>0&&im.width<=1024&&im.height<=1024);
  if(!ok||c.globalCompositeOperation!=='source-over'||c.filter&&c.filter!=='none'){G3X.ras=1;return}
  let sx=0,sy=0,sw=im.width,sh=im.height,dx,dy,dw,dh;if(a.length>=9){sx=a[1];sy=a[2];sw=a[3];sh=a[4];dx=a[5];dy=a[6];dw=a[7];dh=a[8]}else if(a.length>=5){dx=a[1];dy=a[2];dw=a[3];dh=a[4]}else{dx=a[1];dy=a[2];dw=sw;dh=sh}
  if(!(sw>0&&sh>0))return;const M=c.getTransform(),P=(x,y)=>[M.a*x+M.c*y+M.e,M.b*x+M.d*y+M.f];
  G3X.cq.push({src:im,sx,sy,sw,sh,c:[...P(dx,dy),...P(dx+dw,dy),...P(dx+dw,dy+dh),...P(dx,dy+dh)],al:c.globalAlpha})}
/* 描き方をかえる：k の細かさで、ゲームの点 (ax,ay) を、キャンバスの (ox,oy) に */
function g3Mode(k,ax,ay,ox,oy){if(G3X.z0==null){G3X.z0=cam.z;G3X.dpr0=dpr;G3X.cx=camCX();G3X.cy=camCY()}dpr=1;cam.z=k;G3.O={ax,ay,ox,oy}}
function g3Normal(){if(G3X.z0!=null){cam.z=G3X.z0;dpr=G3X.dpr0;G3X.z0=null}G3.O=null}
/* ---- 1コマのはじめ：カメラ・地形・地面の絵をはじめる ---- */
function g3Begin(){G3.on=g3Ready()&&!(typeof caveOn==='function'&&caveOn());if(window.R3D&&R3D.ok)R3D.show(G3.on);if(!G3.on)return false;g3Hook();g3View();g3World();
  G3X.q=[];G3X.sp=[];G3X.used=false;G3X.rx=G3X.ry=G3X.rh=0;if(!G3X.ras_pg)G3X.ras_pg=R3D.raster();
  /* 地面の絵：画面に見える地面の、クォータービューの点の四角 */
  const P=[[0,0],[VW,0],[0,VH],[VW,VH]].map(([a,b])=>R3D.plane(a,b)),I=[];for(const p of P)for(const lv of[0,HMAX]){const wx=p.x*TS,wy=p.y*TS;I.push([isoX(wx,wy),isoY(wx,wy)-lv*IQL])}
  const xs=I.map(q=>q[0]),ys=I.map(q=>q[1]),x0=Math.min(...xs)-16,x1=Math.max(...xs)+16,y0=Math.min(...ys)-16,y1=Math.max(...ys)+16,cw=ctx.canvas.width,ch=ctx.canvas.height;
  const kd=Math.min(G3DMAX,cw/(x1-x0),ch/(y1-y0));G3X.dr=[x0,y0,cw/kd,ch/kd];
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cw,ch);g3Mode(kd,x0,y0,0,0);return true}
/* ---- 奥行きの順の物を描く（render の D）。地面にはる物は地面の絵に、立てる物は板に、せいれいは3Dに ---- */
function g3Items(D,now){const kd=cam.z;
  for(const it of D){if(it.t===-1)continue;/* 高い段のマス（地形は3D） */
    if(it.sp){g3Spirit(it.sp,now);continue}
    if(!it.A&&it.t>0&&it.own>=0)it.A=objFoot(it.own%W,(it.own/W)|0,1,1,it.own);/* 壁・ドア・柵など（自分で描き方をきめる立つ物）は、そのマスに立てる */
    if(!it.A){groundTf(ctx,kd);it.draw();continue}/* 地面にはる物 */
    g3Cap(it,now)}
  /* 地面の絵をうつして、上にかさねるキャンバスにもどす */
  const c=ctx.canvas;if(!G3X.dc){G3X.dc=document.createElement('canvas')}const dc=G3X.dc;if(dc.width!==c.width||dc.height!==c.height){dc.width=c.width;dc.height=c.height}
  const g=dc.getContext('2d');g.clearRect(0,0,dc.width,dc.height);g.drawImage(c,0,0);g3Normal();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);R3D.drape(dc,G3X.dr);
  /* せいれいの、ふきだし・持ち物・ゲージなど（体は3D） */
  for(const r of G3X.sp)g3SpiritOver(r,now)}
/* 立てる物を板にする */
function g3Cap(it,now){const A=it.A;
  /* 1回め：チップの絵だけか、しらべながらおぼえる（ここでは描かない） */
  G3X.cq=[];G3X.ras=0;G3X.lz=0;G3X.nolift=true;g3Mode(G3K,A.px,A.py,0,0);G3X.rec=true;
  try{standTf(ctx,G3K,A.fx,A.fy,A.px,A.py);it.draw()}catch(e){G3X.ras=1}finally{G3X.rec=false}
  const anc=g3Anc(A);if(G3X.lz)anc[1]+=G3X.lz/LIFT*R3D.HSTEP;
  if(!G3X.ras){for(const q of G3X.cq){q.a=anc;q.own=it.own;G3X.q.push(q)}G3X.nolift=false;g3Back();return}
  /* 2回め：コードで描く所がある物は、その物ぜんぶを、毎コマ描く絵のページへ（地面の絵を描いているキャンバスのすみをかりて描き、うつす） */
  const R=g3Box(it,A),kr=G3RK,w=Math.ceil((R[2]-R[0])*kr),h=Math.ceil((R[3]-R[1])*kr),RS=G3X.ras_pg,RW=RS.c.width,RH=RS.c.height,c=ctx.canvas;
  if(w>0&&h>0&&w<=c.width&&h<=c.height){if(G3X.rx+w>RW){G3X.rx=0;G3X.ry+=G3X.rh+1;G3X.rh=0}
    if(G3X.ry+h<=RH){if(!G3X.kc)G3X.kc=document.createElement('canvas');const kc=G3X.kc;if(kc.width<w||kc.height<h){kc.width=Math.max(kc.width,w);kc.height=Math.max(kc.height,h)}
      const kg=kc.getContext('2d');kg.clearRect(0,0,w,h);kg.drawImage(c,0,0,w,h,0,0,w,h);/* 地面の絵の、かりる所をとっておく */
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.beginPath();ctx.rect(0,0,w,h);C0.clip.call(ctx);
      g3Mode(kr,A.px+R[0],A.py+R[1],0,0);G3X.lz=0;try{standTf(ctx,kr,A.fx,A.fy,A.px,A.py);it.draw()}catch(e){if(typeof lgErr==='function')lgErr('g3ras',e)}
      ctx.restore();ctx.save();ctx.setTransform(1,0,0,1,0,0);const rg=RS.g;if(!G3X.used){rg.clearRect(0,0,RW,RH);G3X.used=true}
      rg.clearRect(G3X.rx,G3X.ry,w,h);rg.drawImage(c,0,0,w,h,G3X.rx,G3X.ry,w,h);ctx.clearRect(0,0,w,h);C0.drawImage.call(ctx,kc,0,0,w,h,0,0,w,h);ctx.restore();
      const a2=g3Anc(A);if(G3X.lz)a2[1]+=G3X.lz/LIFT*R3D.HSTEP;
      G3X.q.push({raster:{x:G3X.rx,y:G3X.ry},sx:0,sy:0,sw:w,sh:h,c:[R[0],R[1],R[2],R[1],R[2],R[3],R[0],R[3]],a:a2,al:1,own:it.own});
      G3X.rx+=w+1;G3X.rh=Math.max(G3X.rh,h)}}
  G3X.nolift=false;g3Back()}
function g3Back(){const r=G3X.dr;g3Mode(Math.min(G3DMAX,ctx.canvas.width/r[2]),r[0],r[1],0,0)}
/* 物の描くわく（足もとからのゲームの点） */
function g3Box(it,A){let b=it.box;if(!b&&it.own>=0){const o=S.obj[anc(it.own)];if(o&&BL[o])try{b=objBox(o,anc(it.own))}catch(e){b=null}}
  if(!b)return G3DEF;const m=8;return[(b[0]-A.fx)*IQSX-m,(b[1]-A.fy)*IQSY-m-24,(b[2]-A.fx)*IQSX+m,(b[3]-A.fy)*IQSY+m]}
/* ---- せいれい（3D） ---- */
const G3ELS=new Set(['earth','water','fire','wind','wood']);
function g3Spirit(r,now){if(r.hidden&&!(typeof peekH==='function'&&peekH(r)))return;const v=G3X.spv.get(r)||{x:r.x,y:r.y,yaw:Math.PI/4,ph:0,d:0};G3X.spv.set(r,v);
  const dx=r.x-v.x,dy=r.y-v.y,dd=Math.hypot(dx,dy),walking=dd>.002;if(walking){v.yaw=Math.atan2(dx,dy);v.ph+=dd*9}else{const sv=SPV.get(r),face=sv&&sv.back?Math.PI*1.25:Math.PI/4+(r.face<0?.5:-.5)*((sv&&sv.turn)||0);let da=face-v.yaw;da=Math.atan2(Math.sin(da),Math.cos(da));v.yaw+=da*.15}
  v.x=r.x;v.y=r.y;const z=uLift(r),gy=R3D.groundH(r.x,r.y),y=z>0?Math.max(gy,z/LIFT*R3D.HSTEP):gy;
  G3X.sp.push(r);r._g3={x:r.x,y,z:r.y,gy};
  G3X.spl=G3X.spl||[];G3X.spl.push({el:G3ELS.has(r.elem)?r.elem:'earth',x:r.x,y:y+(walking?Math.abs(Math.sin(v.ph))*.04:0),z:r.y,gy,yaw:v.yaw,sw:walking?Math.sin(v.ph)*.6:0})}
function g3SpiritOver(r,now){const p=r._g3;if(!p)return;const P=R3D.project(p.x,p.y,p.z),kk=dpr*P.s,fx=r.x*TS,fy=r.y*TS;
  ctx.setTransform(kk*IQSX,0,0,kk*IQSY,dpr*P.x-kk*IQSX*fx,dpr*P.y-kk*IQSY*fy);G3X.nolift=true;G3.sp=true;try{drawRes(r,now)}catch(e){frameErr&&frameErr('g3sp',e)}finally{G3.sp=false;G3X.nolift=false}}
/* ---- 1コマのおわり：3Dを描く ---- */
function g3End(now){if(!G3.on)return;g3Normal();R3D.spirits(G3X.spl||[]);G3X.spl=[];R3D.sprites(G3X.q,G3X.used);if(navigator.webdriver&&!window.G3DRAW)return;/* 自動のテスト（GPUなしで1まい約1.2秒）では、3Dの絵は描かない。写真をとるときは window.G3DRAW=true */R3D.render(now)}
/* ---- 地形のもと（マップがかわったら、かわった所だけ3Dで作りなおす） ---- */
function g3World(){const first=G3X.S!==S;if(!first&&++G3X.sync%15)return;
  const n=W*H,hi=new Int8Array(n),kind=new Uint8Array(n),flat=new Uint8Array(n),fcol=new Uint8Array(n*3),K=R3D.K,RM=typeof riftM==='function'?riftM():null;
  for(let j=0;j<n;j++){hi[j]=S.hi?S.hi[j]|0:0;const g=S.ground[j],f=S.floor&&S.floor[j];
    kind[j]=g===1&&!(RM&&RM[j]===1)?K.WATER:g===2?K.FORD:f&&G3PATH.has(f)?K.PATH:f&&BL[f]&&BL[f].floor?K.FLOOR:REV.has(j)?K.GRASS:K.BARE;
    if(f&&G3FCOL[f]){const c=G3FCOL[f];fcol[j*3]=c[0];fcol[j*3+1]=c[1];fcol[j*3+2]=c[2]}
    flat[j]=S.obj[j]?1:0}
  if(first||!G3X.W){G3X.S=S;G3X.W={W,H,hi,kind,flat,fcol,stage:WD};R3D.setWorld(G3X.W);return}
  const o=G3X.W;let x0=W,y0=H,x1=-1,y1=-1;for(let j=0;j<n;j++){if(o.hi[j]!==hi[j]||o.kind[j]!==kind[j]||o.flat[j]!==flat[j]||o.fcol[j*3]!==fcol[j*3]){const x=j%W,y=(j/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
  if(x1<0)return;o.hi.set(hi);o.kind.set(kind);o.flat.set(flat);o.fcol.set(fcol);R3D.dirty(x0,y0,x1,y1)}
