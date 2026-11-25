'use strict';
/* ---------- 洞窟のクォータービュー（PR7b） ----------
   村の段差と同じ、ふつうのアイソメトリックの作り方（持ち主がえらんだ）：
   - 床は、その段の高さ（C.lv）のひし形のタイル。岩のかべは、床より CVQL だん高いブロック（持ち主がきめた：1だん）。
   - 手前のとなり（左下 y+1・右下 x+1）が低い所だけ、1だんずつかべのタイル（左の面・右の面）をならべる。
     大穴は CVQAB だん低い穴で、うしろのマスのかべが、穴の底まで下へのびる（下ほど暗い）。
   - 描く順は x+y。まわりより低くない平らな床は、先にまとめて描く（足もとのかげが、手前の床にけされないように）。
   - タイルの絵は、洞窟のテクスチャ（cave:ground など、こさの番号 cvTexData）に、その階の色をぬって作り、とっておく（CVQK）。
   - 物・かざり・せいれい・コワイノは、いままでの絵を足もとで立てる（standTf）。地面にはりつく物は、地面の描き方を、その段の高さに。
   - 見ていないマスは描かない（まっくら）。大穴・水・橋・滝・岩の正面のかざりは iso-cave2.js。 */
const CVQL=1,CVQAB=3;/* 岩のかべの高さ・大穴の深さ（段） */
const CVQK=new Map();/* 作ったタイルと、色をぬったテクスチャ（洞窟を出たら手ばなす） */
function cvqFree(){for(const c of CVQK.values())if(c&&c.getContext)c.width=c.height=0;CVQK.clear()}
const cvqIn=(x,y)=>x>=0&&y>=0&&x<CVW&&y<CVH;
/* マスの床の段（その階のいちばん低い床が0） */
function cvqLv(j){const C=CV;if(!C||j<0||j>=CVW*CVH)return 0;if(C.lv0==null){let m=99;for(let i=0;i<CVW*CVH;i++)if(C.g[i]||C.ab[i])m=Math.min(m,C.lv[i]);C.lv0=m<99?m:0}if(C.lift&&C.lift.set.has(j))return C.lift.h-C.lv0;/* まきあげの足場（うごいているあいだは、とちゅうの高さ） */return C.lv[j]-C.lv0}
const cvqRock=j=>{const C=CV;return !C.g[j]&&!C.ab[j]&&!C.ob.has(j)};
/* マスの上の面の高さ（段）：岩は床より CVQL 高い・大穴は CVQAB 低い。洞窟の外は、かべを出さない高さ */
function cvqH(x,y){if(!cvqIn(x,y))return 99;const C=CV,j=cvJ(x,y);if(C.lift&&C.lift.set.has(j)){cvqLv(0);return C.lift.b-C.lv0-CVQAB}/* 足場の下は、たて穴 */const l=cvqLv(j);return C.ab[j]?l-CVQAB:cvqRock(j)?l+CVQL:l}
/* せかいの点 (wx,wy)（y は CVOY をふくむ）の床の段 */
function cvqLvAt(wx,wy){const x=Math.floor(wx/TS),y=Math.floor(wy/TS)-CVOY;return cvqIn(x,y)?Math.max(0,cvqLv(cvJ(x,y))):0}
/* 足もと：点（せいれい・コワイノ・粒）と、物（マス x,y から w×h） */
function cvqPt(wx,wy,lv){if(lv==null)lv=cvqLvAt(wx,wy);return{fx:wx,fy:wy,px:isoX(wx,wy),py:isoY(wx,wy)-lv*IQL}}
function cvqObj(x,y,w,h){const lv=cvqIn(x,y)?Math.max(0,cvqLv(cvJ(x,y))):0,t=.1375*(w+h)*TS,cx=(x+w/2)*TS,cy=(y+CVOY+h/2)*TS;return{fx:cx,fy:(y+CVOY+h)*TS,px:isoX(cx+t,cy+t),py:isoY(cx+t,cy+t)+IQSY*TS*.12-lv*IQL}}
function cvqAt(c,A,f){c.save();standTf(c,dpr*cam.z,A.fx,A.fy,A.px,A.py);try{f()}finally{c.restore()}}
function cvqGr(c,lv,f){c.save();groundTf(c,dpr*cam.z);if(lv)c.translate(-lv*IQD,-lv*IQD);try{f()}finally{c.restore()}}
function cvqScr(c,f){const k=dpr*cam.z,O=isoOff(k);c.save();c.setTransform(k,0,0,k,O[0],O[1]);try{f()}finally{c.restore()}}
/* テクスチャ（こさの番号）に色をぬる：{w,h,d,top} */
function cvqTex(k,pal){const X=cvTexData();if(!X||!X[k]||!pal)return null;const K='x'+k+pal.join('');let P=CVQK.get(K);if(P)return P;const S0=X[k],d=new Uint8ClampedArray(S0.w*S0.h*4),R=pal.map(cvRGB);
  for(let i=0;i<S0.L.length;i++){const l=S0.L[i];if(l<0)continue;const q=R[Math.min(R.length-1,l)];d[i*4]=q[0];d[i*4+1]=q[1];d[i*4+2]=q[2];d[i*4+3]=255}
  P={w:S0.w,h:S0.h,d,top:S0.top||0};CVQK.set(K,P);return P}
/* その階のタイルのもと。テクスチャの読みこみ中は null */
function cvqT(){const C=CV;if(C.qT)return C.qT;const X=cvTexData();if(!X)return null;const TH=cvTheme(),cw=TH.wall==='crys'&&!!X.ccols,fl=TH.ptex&&X[TH.ptex]?TH.ptex:'ground',R=TH.rock;
  return C.qT={face:cvqTex(cw?'ccols':'cols',cw?TH.crys[0]:R),fk:cw?'c':'r',floor:cvqTex(fl,TH.floor),rock:cvqTex('ground',R.slice(1).concat(R[R.length-1])),moss:X.moss?cvqTex('moss',TH.mossc):null,
    water:X.water?cvqTex('water',[TH.water[3],TH.water[2],TH.water[1]]):null,
    br:cvqTex('ground',['#3a2a1c','#5a4028','#6e4e30','#80603c','#946f46','#a88356']),hface:TH.hwall?cvqTex('cols',TH.hwall):null,hwtop:TH.hwall?cvqTex('ground',TH.hwall.slice(1).concat(TH.hwall[TH.hwall.length-1])):null,/* 廃村の家の壁 */void:TH.void,glow:TH.glow}}
/* 上の面のタイル（64×48 のひし形）：テクスチャの (ox,oy) から1マスぶん（64ドット） */
function cvqTop(P,ox,oy,key){const K='t'+key+'|'+ox+','+oy;let c=CVQK.get(K);if(c)return c;c=document.createElement('canvas');c.width=IQW;c.height=IQH;const g=c.getContext('2d'),id=g.createImageData(IQW,IQH),d=id.data;
  for(let v=0;v<IQH;v++)for(let u=0;u<IQW;u++){const ix=u-IQW/2+.5,iy=v+.5,wx=(ix/IQA+iy/IQB)/2,wy=(iy/IQB-ix/IQA)/2;if(wx<0||wy<0||wx>=TS||wy>=TS)continue;
    const si=(((oy+((wy*2)|0))%P.h)*P.w+((ox+((wx*2)|0))%P.w))*4,o=(v*IQW+u)*4;d[o]=P.d[si];d[o+1]=P.d[si+1];d[o+2]=P.d[si+2];d[o+3]=255}
  g.putImageData(id,0,0);CVQK.set(K,c);return c}
/* かべのタイル（1だんぶん）：side 0 左の面（y+1 がわ）・1 右の面（x+1 がわ）。帯の絵（cave:cols）は、クォータービューで写した左の面を、マスごとに、この絵と同じわく（g64）でならべた物（iso3d.py の run_band）。
   右の面は、左右反対にして使う。k は明るさ */
function cvqFace(side,P,ox,key,k){const K='f'+side+key+'|'+ox+'|'+k;let c=CVQK.get(K);if(c)return c;const w=IQW/2,h=IQH/2+IQL;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),id=g.createImageData(w,h),d=id.data;
  for(let v=0;v<h;v++)for(let u=0;u<w;u++){const t=(u+.5)/w,top=side?IQH/2*(1-t):IQH/2*t,vv=v+.5-top;if(vv<0||vv>=IQL)continue;
    const du=(t*64)|0,si=(Math.min(P.h-1,((v+.5)*2)|0)*P.w+((ox+(side?63-du:du))%P.w))*4,o=(v*w+u)*4;if(!P.d[si+3])continue;d[o]=P.d[si]*k;d[o+1]=P.d[si+1]*k;d[o+2]=P.d[si+2]*k;d[o+3]=255}
  g.putImageData(id,0,0);CVQK.set(K,c);return c}
/* まわりより低くない平らな床（先にまとめて描いてよい） */
function cvqFlat(x,y){const C=CV,j=cvJ(x,y);if(!C.g[j])return false;const h=cvqH(x,y);for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1],[-1,-1]])if(cvqH(x+dx,y+dy)<h)return false;return true}
/* マス (x,y) を描く（c は画面の向き、ゲームの点） */
function cvqCell(c,x,y,now,T){const C=CV,j=cvJ(x,y),Y=y+CVOY,ix=(x-Y)*IQW/2,iy=(x+Y)*IQH/2,h=cvqH(x,y);
  if(C.ab[j]||C.lift&&C.lift.set.has(j)){/* 大穴の底・足場のたて穴の底：暗い（かべは、うしろのマスが下へのばす） */c.fillStyle=T.void;c.beginPath();c.moveTo(ix,iy-h*IQL);c.lineTo(ix+IQW/2,iy+IQH/2-h*IQL);c.lineTo(ix,iy+IQH-h*IQL);c.lineTo(ix-IQW/2,iy+IQH/2-h*IQL);c.closePath();c.fill();return}
  const hw=C.hw[j]&&T.hface,F=hw?T.hface:T.face,fk=hw?'h':T.fk;if(F)for(const side of[0,1]){const n=side?cvqH(x+1,y):cvqH(x,y+1);for(let L=h,lim=C.sb&&C.sb[j]?1:8;L>n&&L>h-lim;L--){const kk=(side?ICRT:ICLF)*(L<=0?Math.max(.2,1+(L-1)*.24):1);
    c.drawImage(cvqFace(side,F,((side?y:x)*64)%F.w,fk,Math.round(kk*100)/100),side?ix:ix-IQW/2,iy+IQH/2-L*IQL)}}
  let P=T.floor,key='fl';if(cvqRock(j)){P=hw?T.hwtop:T.rock;key=hw?'hw':'rk'}else if(C.wt[j]){P=T.water;key='wt'}else if(C.br[j]===1||C.hf[j]){P=T.br;key='br'}else if(T.moss&&cvMossAt(x,y)){P=T.moss;key='ms'}
  if(!P)return;let ox=(x*64)%P.w,oy=(y*64)%P.h;if(key==='wt'){ox=(ox+((now/180)|0)*2)%P.w;ox-=ox%4}/* 水は、ゆっくり流れる */
  c.drawImage(cvqTop(P,ox,oy,key+cvTheme().name),ix-IQW/2,iy-h*IQL)}
/* 坂（^）：うしろの1だん高い床へのぼる、岩の段（村の階段と同じ形 icStairPolys。色は、その階の岩） */
function cvqSteps(c,x,y){const C=CV,l=cvqH(x,y);let d=-1;for(const q of[0,1,3,2]){const bx=x-SDIR[q][0],by=y-SDIR[q][1];if(cvqIn(bx,by)&&C.g[cvJ(bx,by)]&&cvqH(bx,by)===l+1){d=q;break}}if(d<0)return;
  const TH=cvTheme(),R=TH.rock,id='cv_'+C.F.theme;if(!STPAL[id])STPAL[id]=[R[4],R[2],R[1]];const sh=icShape('s'+id+d+1,icStairPolys(id,d,1)),P=icP(x*TS,(y+CVOY)*TS,l);c.drawImage(sh,P[0]+sh.ox,P[1]+sh.oy)}
/* タップした画面の点の、せかいの点（見えている、いちばん手前の高い段のマスで、高さのぶん右下へもどす） */
function cvqTapW(sx,sy){const w=s2w(sx,sy),C=CV;if(!C)return w;cvqLv(0);for(let lv=(C.top-(C.lv0||0))+CVQL;lv>=-CVQAB;lv--){const x=w.x+lv*IQD,y=w.y+lv*IQD,tx=Math.floor(x/TS),ty=Math.floor(y/TS)-CVOY;if(cvqIn(tx,ty)&&C.seen[cvJ(tx,ty)]&&(cvqH(tx,ty)===lv||cvIsP(cvJ(tx,ty))&&Math.round(cvqLv(cvJ(tx,ty)))===lv))return{x,y,lv}}return w}
/* せいれい・コワイノの、画面の点（CSS の px）：足もとから h マス上 */
function cvqScrPt(wx,wy,h){const A=cvqPt(wx,wy),cx=camCX(),cy=camCY();return{x:VW/2+(A.px-isoX(cx,cy))*cam.z,y:VH/2+(A.py-(h||0)*TS*IQSY-isoY(cx,cy))*cam.z}}
/* カメラ：パーティのまん中（段の高さのぶん、左上へずらした地面の点）を、画面のまん中へ */
function cvqCamTo(k){const C=CV;if(!C||!C.party.length)return;let x=0,y=0;for(const a of C.party){x+=a.x;y+=a.y}x=x/C.party.length*TS;y=y/C.party.length*TS;const l=cvqLvAt(x,y)*IQD+.3*TS,tx=x-l-VW/cam.z/2,ty=y-l-VH/cam.z/2;cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k}
function cvqClamp(){const vw=VW/cam.z,vh=VH/cam.z,cx=clamp(camCX(),0,CVW*TS),cy=clamp(camCY(),CVOY*TS,(CVOY+CVH)*TS);cam.x=cx-vw/2;cam.y=cy-vh/2}
/* 1コマ */
function caveRender(now){const C=CV;if(!C)return;if(!(C.lookU>now))cvCamTo(.12);const k=dpr*cam.z;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1a1511';ctx.fillRect(0,0,cv.width,cv.height);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;const T=cvqT();if(!T)CVMISS=true;
  const IV=isoView(),M=5,x0=Math.max(0,Math.floor(IV.x0)-M),x1=Math.min(CVW-1,Math.ceil(IV.x1)+M),y0=Math.max(0,Math.floor(IV.y0)-CVOY-M),y1=Math.min(CVH-1,Math.ceil(IV.y1)-CVOY+M);
  const L=[],add=(key,f)=>L.push([key,f]),inV=(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1,V={x0,x1,y0,y1};
  /* 床と岩：平らな床は先に、ほかは x+y の順に */
  if(T)cvqScr(ctx,()=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(!C.seen[cvJ(x,y)])continue;const j=cvJ(x,y);if(cvqFlat(x,y)||C.ab[j]){cvqCell(ctx,x,y,now,T);if(C.g[j])cvqGr(ctx,Math.max(0,cvqLv(j)),()=>cvqPebble(x,y))}else{add(x+y+.5,()=>cvqScr(ctx,()=>cvqCell(ctx,x,y,now,T)));if(C.g[j])add(x+y+.51,()=>cvqGr(ctx,Math.max(0,cvqLv(j)),()=>cvqPebble(x,y)))}
    /* マスにかさねる絵（iso-cave2.js）：水・橋・滝・岩の正面のかざり */
    if(C.wt[j]){add(x+y+.52,()=>cvqWaterCell(x,y,now));if(cvqIn(x,y+1)&&C.ab[j+CVW]||cvqIn(x+1,y)&&C.ab[j+1])add(x+y+.53,()=>cvqScr(ctx,()=>cvqFalls(ctx,x,y,now)))}
    if(C.br[j])add(x+y+.52,()=>cvqBridge(ctx,x,y,now));if(C.sb&&C.sb[j])add(x+y+.52,()=>cvqGr(ctx,Math.max(0,cvqLv(j)),()=>C.kui?cvKuiBridgeDraw(x,y):C.hone?cvHoneBridgeDraw(x,y):cvSkBackDraw(x,y)));/* たおれた石像のせなか（cave-shinden.js）・根の橋（cave-shisetsu.js） */if(cvqRock(j)&&cvqIn(x,y+1)&&C.g[j+CVW])add(x+y+.52,()=>cvqAt(ctx,cvqObj(x,y,1,1),()=>cvqRockDeco(x,y)))}});
  if(T){cvqAbyssDraw(V,now);cvqReflect(V,now)}/* 大穴の底・水のうつりこみ（うしろのかべ・物は、このあと上に） */
  /* 物（地面にはりつく物は、地面の描き方で） */
  const FL='SRkh12q!^LVHz';for(const[j,o]of C.ob){if(!C.seen[j]&&!(o.k==='g'&&cvLureOn(j)))continue;if(o.k==='N'&&!o.top||o.sub)continue;const x=cvX(j),y=cvY(j);if(!inV(x,y))continue;
    if(o.k==='^'){add(x+y+.55,()=>cvqScr(ctx,()=>cvqSteps(ctx,x,y)));continue}
    if(o.k==='P'){if(o.top)add(x+y+.58,()=>cvqScr(ctx,()=>cvLiftDraw(ctx,now)));continue}/* まきあげの足場（cave-mine.js） */
    if(FL.includes(o.k)&&!(o.k==='!'&&o.fall))add(x+y+.6,()=>cvqGr(ctx,Math.max(0,cvqLv(j)),()=>cvDrawObj(j,o,now)));
    else{const w=o.k==='N'||o.k==='G'?o.w:1,h=o.k==='N'||o.k==='G'?o.h:1;add(x+y+w+h-2+.8,()=>cvqAt(ctx,cvqObj(x,y,w,h),()=>cvDrawObj(j,o,now)))}}
  for(const d of C.deco||[]){const x=cvX(d.j),y=cvY(d.j);if(C.seen[d.j]&&inV(x,y))add(x+y+.7,()=>cvqAt(ctx,cvqObj(x,y,1,1),()=>cvDrawDeco(d,now)))}
  const ckey=(wx,wy)=>Math.floor(wx)+Math.floor(wy-CVOY)+.9;
  for(const a of(typeof cvActorsL==='function'?cvActorsL(C):C.party))add(ckey(a.x,a.y),()=>cvqAt(ctx,cvqPt(a.x*TS,a.y*TS),()=>cvDrawActor(a,now)));
  cvBakeL((x,y,flat,f)=>{if(!inV(x,y))return;const j=cvJ(x,y);if(flat)add(x+y+.6,()=>cvqGr(ctx,Math.max(0,cvqLv(j)),f));else add(x+y+.95,()=>cvqAt(ctx,cvqObj(x,y,1,1),f))},now);
  for(const e of C.en){if(e.dead||!C.seen[cvCell(e)])continue;add(ckey(e.x,e.y),()=>cvqAt(ctx,cvqPt(e.x*TS,e.y*TS),()=>{if(EN[e.type].bk){cvBkDraw(e,now);return}if(e.asleep){const s=e.stun;e.stun=1;drawEnemy(e,now);e.stun=s;const z=EN[e.type].size,t=(now/900)%1;ctx.globalAlpha=1-t;P4('#e8e0f4',e.x*TS+8,e.y*TS-30*z-t*8,4,1);P4('#e8e0f4',e.x*TS+10,e.y*TS-29*z-t*8,2,1);P4('#e8e0f4',e.x*TS+8,e.y*TS-28*z-t*8,4,1);ctx.globalAlpha=1}else drawEnemy(e,now)}))}
  EVAP=EVAP.filter(it=>now-it.t0<(it.dur||1800)+600+(it.die?KO_HOLD:0));for(const it of EVAP)add(ckey(it.e.x,it.e.y)+.01,()=>cvqAt(ctx,cvqPt(it.e.x*TS,it.e.y*TS),()=>drawEvap(it,now)));
  L.sort((p,q)=>p[0]-q[0]);for(const d of L)d[1]();cvqDrips(now);
  /* 岩をおせる向き・風車のえらんだマス（地面に） */
  if(C.sel&&C.sel.k==='b'){const sj=C.sel.j,p=Math.sin(now/180)*2;cvqGr(ctx,Math.max(0,cvqLv(sj)),()=>{for(const d of cvPushDirs(sj)){const dx=cvX(d.t)-cvX(sj),dy=cvY(d.t)-cvY(sj),cx=cvX(d.t)*TS+16+dx*p,cy=(cvY(d.t)+CVOY)*TS+16+dy*p;for(let i=0;i<5;i++){const w=(4-i)*2+2;if(dx)P4(i%2?'#ffe08a':'#fff3c4',cx-dx*6+dx*i*3-1,cy-w/2,3,w);else P4(i%2?'#ffe08a':'#fff3c4',cx-w/2,cy-dy*6+dy*i*3-1,w,3)}}
    const bx=cvX(sj)*TS,by=(cvY(sj)+CVOY)*TS;for(let i=0;i<4;i++){P4('#fff3c4',bx+i*10,by,5,1);P4('#fff3c4',bx+i*10,by+31,5,1);P4('#fff3c4',bx,by+i*10,1,5);P4('#fff3c4',bx+31,by+i*10,1,5)}})}
  if(C.sel&&C.sel.k==='m'){const sj=C.sel.j,bx=cvX(sj)*TS,by=(cvY(sj)+CVOY)*TS;cvqGr(ctx,Math.max(0,cvqLv(sj)),()=>{for(let i=0;i<4;i++){P4('#e6f4ec',bx+i*10,by,5,1);P4('#e6f4ec',bx+i*10,by+31,5,1);P4('#e6f4ec',bx,by+i*10,1,5);P4('#e6f4ec',bx+31,by+i*10,1,5)}})}
  /* 風（地面の上を、まっすぐ） */
  if(C.gust){const G=C.gust,d=Math.min(G.n,(now-G.t0)/1000*CVGUST);cvqGr(ctx,cvqLvAt(G.x*TS,(G.y+CVOY)*TS),()=>{for(let i=0;i<6;i++){const q=d-i*.35;if(q<0)continue;const wob=Math.sin(now/60+i*2)*4;P4(i%2?'#e6f4ec':'#a9c8b6',(G.x+G.dx*q)*TS+(G.dy?wob:0)-2,(G.y+CVOY+G.dy*q)*TS+(G.dx?wob:0)-2,G.dx?7:2,G.dx?2:7)}})}
  /* 光のつぶ（ひらいた・あけたとき）：うまれた所に立てて */
  C.sparks=C.sparks.filter(s=>now-s.t0<700);for(const s of C.sparks){const t=(now-s.t0)/1000;cvqAt(ctx,cvqPt(s.x*TS,(s.y+CVOY)*TS),()=>{ctx.globalAlpha=1-t/.7;P4(s.col,(s.x+s.vx*t)*TS-1,(s.y+CVOY+s.vy*t+2.2*t*t)*TS-1,2,2)})}ctx.globalAlpha=1;
  cvMistDraw(now);
  /* 暗さ：光のとどく所だけ明るい（地面の円は、ひし形の地面にそった横長の形）。見ていない所は描いていないので、まっくら */
  {const D=C.dk;if(D.width!==cv.width||D.height!==cv.height){D.width=cv.width;D.height=cv.height}const g=D.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,D.width,D.height);g.fillStyle='rgba('+(cvTheme().dark||'4,7,16')+','+CVDARK+')';g.fillRect(0,0,D.width,D.height);
    g.globalCompositeOperation='destination-out';const LS=lightSpr(150),cut=(x,y,R)=>{const p=w2s(x*TS,y*TS,cvqLvAt(x*TS,y*TS)),rx=R*TS*cam.z*dpr*IQA*Math.SQRT2,ry=R*TS*cam.z*dpr*IQB*Math.SQRT2;g.drawImage(LS,p.x*dpr-rx,p.y*dpr-ry,rx*2,ry*2)},LR=cvLR()*(1+.03*Math.sin(now/900)+.015*Math.sin(now/370));/* 光は、ゆっくりゆらぐ */
    for(const a of C.party){cut(a.x,a.y-.2,LR);cut(a.x,a.y-.2,LR*.6)}
    for(const[j,o]of C.ob){if(!C.seen[j])continue;if(o.k==='S'||o.k==='R')cut(cvX(j)+.5,cvY(j)+CVOY+.5,2.2);else if(o.k==='t'&&o.until>C.t)cut(cvX(j)+.5,cvY(j)+CVOY+.5,3+.12*Math.sin(now/130+j))
      else if(o.k==='g'){g.globalAlpha=.75+.2*Math.sin(now/700+j);cut(cvX(j)+.5,cvY(j)+CVOY+.5,CVGLOW);g.globalAlpha=1}}
    for(let j=0;j<CVW*CVH;j++)if(C.wt[j]&&C.seen[j]&&(cvX(j)+cvY(j))%2===0){g.globalAlpha=.5+.08*Math.sin(now/1300+j);cut(cvX(j)+.5,cvY(j)+CVOY+.5,1.9);g.globalAlpha=1}/* 地底の水は、まわりを照らす */
    for(const d of C.deco||[])if(C.seen[d.j]&&(d.k==='crys'||d.k==='shroom')){g.globalAlpha=.7+.15*Math.sin(now/900+d.j);cut(cvX(d.j)+.5,cvY(d.j)+CVOY+.5,d.k==='crys'?2.2:1.8);g.globalAlpha=1}
    for(const j of cvShafts())if(C.seen[j]){g.globalAlpha=.25;cut(cvX(j)+.5,cvY(j)+CVOY+.5,1.2);g.globalAlpha=1}
    for(const j of C.ore)if(C.seen[j]){g.globalAlpha=.6+.15*Math.sin(now/900+j);cut(cvX(j)+.5,cvY(j)+CVOY+.9,CVOREGLOW);g.globalAlpha=1}
    if(C.flash){const t=(now-C.flash.t0)/900;if(t>=1)C.flash=null;else{g.globalAlpha=1-t;cut(C.flash.x,C.flash.y+CVOY,5);g.globalAlpha=1}}
    /* まだ見ていない所でも、近くの光るきのこ・鉱石は、ぼんやり見える */
    g.globalAlpha=.7;for(const[j,o]of C.ob)if(o.k==='g'&&!C.seen[j]&&cvLureOn(j))cut(cvX(j)+.5,cvY(j)+CVOY+.5,.8);g.globalAlpha=1;g.globalCompositeOperation='source-over';
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(D,0,0);ctx.restore()}
  cvqAbyssLights(V,now);cvGlowDraw(now);cvAirDraw(now);
  drawTopFx();drawBattleFx(now);cvPillDraw(now);
  if(C.mark){const t=(now-C.mark.t0)/450;if(t>=1)C.mark=null;else{const m=C.mark;cvqGr(ctx,cvqLvAt(m.x*TS,(m.y+CVOY)*TS),()=>{ctx.globalAlpha=1-t;const cx=m.x*TS,cy=(m.y+CVOY)*TS,r=6+t*8,col=m.foe?'#ff9aa8':'#fff3c4';for(let i=0;i<8;i++){const an=i/8*6.283;P4(col,cx+Math.cos(an)*r-1,cy+Math.sin(an)*r-1,2,2)}ctx.globalAlpha=1})}}
  ctx.imageSmoothingEnabled=sm;if(typeof juiceDraw==='function'){ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);juiceDraw(now);ctx.restore()}/* 紙ふぶき（画面の点で） */}
