'use strict';
/* ---------- クォータービュー（ひし形のマス）の描き方の土台 ----------
   せかいの点（x*TS, y*TS）は、いままでのまま。画面の点（ゲームの点）は
     ix=(wx−wy)·IQA、iy=(wx+wy)·IQB
   1マスのひし形は、はば IQW・高さ IQH（ゲームの点。g64 の絵で 128×96）。段1だんは IQL 上。
   カメラは、いままでどおり cam.x・cam.y（画面のまん中のせかいの点から、画面の半分をひいた所）と cam.z。
   画面のまん中のせかいの点（camCX・camCY）を、画面のまん中にうつす。
   洞窟（cave.js）は、まだいままでの見え方のまま（isoOn）。 */
const IQW=64,IQH=48,IQL=30;
const IQA=IQW/2/TS,IQB=IQH/2/TS;/* せかいの点が1つ動くと、画面の点がいくつ動くか */
const IQD=IQL/(2*IQB);/* 段1だんぶん上に見せるとき、せかいの点を左上（x・y とも）へずらす数 */
const IQSX=IQW/Math.SQRT2/TS,IQSY=IQL/(.8*TS);/* 仮：いまの絵（ななめ見おろし）を立てるときの、よこ・たての大きさ（絵がそろうまで） */
function isoOn(){return !(typeof caveOn==='function'&&caveOn())}
const isoX=(wx,wy)=>(wx-wy)*IQA,isoY=(wx,wy)=>(wx+wy)*IQB;
function isoInv(ix,iy){const u=ix/IQA,v=iy/IQB;return{x:(u+v)/2,y:(v-u)/2}}
const camCX=()=>cam.x+VW/cam.z/2,camCY=()=>cam.y+VH/cam.z/2;
function isoOff(k){const cx=camCX(),cy=camCY();return[dpr*VW/2-k*isoX(cx,cy),dpr*VH/2-k*isoY(cx,cy)]}/* 画面のまん中に、カメラのまん中の点 */
/* 地面の描き方：せかいの点で描くと、ひし形に */
function groundTf(c,k){const O=isoOff(k);c.setTransform(k*IQA,k*IQB,-k*IQA,k*IQB,O[0],O[1])}
/* 立てる物の描き方：足もとのせかいの点 F（fx,fy）を、画面の点 P（px,py）にうつし、まわりは大きさだけかえて描く */
function standTf(c,k,fx,fy,px,py){const O=isoOff(k);c.setTransform(k*IQSX,0,0,k*IQSY,k*(px-IQSX*fx)+O[0],k*(py-IQSY*fy)+O[1])}
/* せかいの点 (wx,wy) を足もとにして、立てる形で描く（高さ lv だんの上） */
function atPt(c,wx,wy,f,lv){c.save();standTf(c,dpr*cam.z,wx,wy,isoX(wx,wy),isoY(wx,wy)-(lv||0)*IQL);try{f()}finally{c.restore()}}
/* 画面の点（CSS の px）とせかいの点 */
function w2s(wx,wy,lv){if(!isoOn())return{x:(wx-cam.x)*cam.z,y:(wy-cam.y)*cam.z};const cx=camCX(),cy=camCY();return{x:VW/2+(isoX(wx,wy)-isoX(cx,cy))*cam.z,y:VH/2+(isoY(wx,wy)-(lv||0)*IQL-isoY(cx,cy))*cam.z}}
function s2w(sx,sy){const cx=camCX(),cy=camCY();return isoInv(isoX(cx,cy)+(sx-VW/2)/cam.z,isoY(cx,cy)+(sy-VH/2)/cam.z)}
/* せかいの点 (wx,wy) が、画面の (sx,sy) に来るように、カメラをおく */
function camAt(wx,wy,sx,sy){const c=isoInv(isoX(wx,wy)-(sx-VW/2)/cam.z,isoY(wx,wy)-(sy-VH/2)/cam.z);cam.x=c.x-VW/cam.z/2;cam.y=c.y-VH/cam.z/2}
/* 画面の上で (dx,dy)（CSS の px）だけ、地図をずらす */
function camShift(dx,dy){const cx=camCX(),cy=camCY(),c=isoInv(isoX(cx,cy)-dx/cam.z,isoY(cx,cy)-dy/cam.z);cam.x=c.x-VW/cam.z/2;cam.y=c.y-VH/cam.z/2}
/* タップした所に見えている、いちばん手前の高い段のマスの、せかいの点（高さのぶん、右下へもどす） */
function liftW(w){if(!S||!S.hi)return w;for(let lv=HMAX;lv>=1;lv--){const x=w.x+lv*IQD,y=w.y+lv*IQD,tx=Math.floor(x/TS),ty=Math.floor(y/TS);if(tx>=0&&ty>=0&&tx<W&&ty<H&&hiAt(ty*W+tx)===lv)return{x,y,lv}}return w}
/* 立っている物（足もと (fx,fy)、マス単位）の、いままでの見え方でのタップの点（せかいの点）。
   いままでの「足もとより上をタップ」の判定を、そのまま使えるようにする */
let TAPS=null;/* いまのタップ（画面の点と、地面のせかいの点） */
/* 画面に見えている、せかいのマスの四角（ひし形の画面の四すみから） */
function isoView(){const P=[s2w(0,0),s2w(VW,0),s2w(0,VH),s2w(VW,VH)],xs=P.map(p=>p.x/TS),ys=P.map(p=>p.y/TS);return{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)}}
/* マス (x,y) が画面に入るか（m：まわりのゆとり、画面の点） */
function isoCellVis(x,y,m){const cx=camCX(),cy=camCY(),ix=(isoX((x+.5)*TS,(y+.5)*TS)-isoX(cx,cy))*cam.z,iy=(isoY((x+.5)*TS,(y+.5)*TS)-isoY(cx,cy))*cam.z,M=m*cam.z;return ix>-VW/2-M&&ix<VW/2+M&&iy>-VH/2-M-IQL*4*cam.z&&iy<VH/2+M+IQH*cam.z}
/* 仮：家の壁・ドアは、箱（上の面・手前左の面・手前右の面）。地面の描き方（groundTf）のまま描く */
const IQWH=30;
function isoBox(c,x,y,lv,h,top,lf,rt){const s0=lv*IQD,s1=(lv*IQL+h)/(2*IQB),X=x*TS,Y=y*TS;
  const poly=(P,f)=>{c.fillStyle=f;c.beginPath();P.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill()};
  poly([[X-s1,Y+TS-s1],[X+TS-s1,Y+TS-s1],[X+TS-s0,Y+TS-s0],[X-s0,Y+TS-s0]],lf);
  poly([[X+TS-s1,Y-s1],[X+TS-s1,Y+TS-s1],[X+TS-s0,Y+TS-s0],[X+TS-s0,Y-s0]],rt);
  c.fillStyle=top;c.fillRect(X-s1,Y-s1,TS,TS)}
/* 仮：高い段のマス：そのマスの地面（ひし形の区画の絵）を段の高さだけ上に描き、手前のとなりが低ければ、土の横の面（段差の絵は PR3） */
function isoTile(c,x,y,now){const j=y*W+x,h=hiAt(j);if(h<=0)return;const k=dpr*cam.z,O=isoOff(k),hv=(a,b)=>a<0||b<0||a>=W||b>=H?0:Math.max(0,hiAt(b*W+a)),ix=(x-y)*IQW/2,iy=(x+y)*IQH/2,s=h*IQL;
  const dl=h-hv(x,y+1),dr=h-hv(x+1,y);const poly=(P,f)=>{c.fillStyle=f;c.beginPath();P.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill()};
  c.save();c.setTransform(k,0,0,k,O[0],O[1]);/* 画面の向き（ゲームの点） */
  if(dl>0){const s0=(h-dl)*IQL;poly([[ix-IQW/2,iy+IQH/2-s],[ix,iy+IQH-s],[ix,iy+IQH-s0],[ix-IQW/2,iy+IQH/2-s0]],'#9b9384')}
  if(dr>0){const s0=(h-dr)*IQL;poly([[ix,iy+IQH-s],[ix+IQW/2,iy+IQH/2-s],[ix+IQW/2,iy+IQH/2-s0],[ix,iy+IQH-s0]],'#7d7568')}
  igTile(c,x,y,ix,iy-s);c.restore()}
/* 物（左上のマス (x,y)、大きさ w×h）の、立てる絵の足もと：
   いまの絵の足もと（下のはしのまん中）を、ひし形のまん中と手前の角のあいだにおく（仮） */
function objFoot(x,y,w,h,j){const lv=Math.max(0,hiAt(j)),t=.1375*(w+h)*TS,cx=(x+w/2)*TS,cy=(y+h/2)*TS;return{x,y,w,h,fx:(x+w/2)*TS,fy:(y+h)*TS-liftOf(j),px:isoX(cx+t,cy+t),py:isoY(cx+t,cy+t)+IQSY*TS*.12-lv*IQL}}
function objFootJ(j){const a=anc(j),o=S.obj[a];if(!o||!BL[o])return objFoot(a%W,(a/W)|0,1,1,a);const z=o==='site'&&S.dyn[a]&&BL[S.dyn[a].build]?BL[S.dyn[a].build].sz||[1,1]:szAt(o,a)||[1,1];return objFoot(a%W,(a/W)|0,z[0],z[1],a)}
/* せいれい・コワイノなど（足もとの点）の足もと。高さは liftDraw がつける */
function ptFoot(wx,wy){return{fx:wx,fy:wy,px:isoX(wx,wy),py:isoY(wx,wy)}}
/* 足もと A で立てて描いた物の、いままでの見え方でのタップの点（せかいの点）。lv：その物の段（タップのときは、絵が上に見える高さ） */
function tapAt(A,lv){const T=TAPS;if(!T)return{x:0,y:0};if(!isoOn())return T.w;const cx=camCX(),cy=camCY(),px=VW/2+(A.px-isoX(cx,cy))*cam.z,py=VH/2+(A.py-(lv||0)*IQL-isoY(cx,cy))*cam.z;return{x:A.fx+(T.sx-px)/(cam.z*IQSX),y:A.fy+(T.sy-py)/(cam.z*IQSY)}}
/* せいれいなど (fx,fy)（マス）のタップの点（その子のいるマスの段の高さで） */
function tapPt(fx,fy){if(!isoOn())return TAPS?TAPS.w:{x:0,y:0};const j=clamp(Math.floor(fy),0,H-1)*W+clamp(Math.floor(fx),0,W-1);return tapAt(ptFoot(fx*TS,fy*TS),Math.max(0,hiAt(j)))}
function tapObj(j){return isoOn()?tapAt(objFootJ(j)):TAPS?TAPS.w:{x:0,y:0}}
/* 地面にぬるマスのわく（高い段は、その高さに） */
function qRect(c,x,y,w,h,j,stroke){if(isoOn()){const s=Math.max(0,hiAt(j))*IQD;stroke?c.strokeRect(x-s,y-s,w,h):c.fillRect(x-s,y-s,w,h)}else{const z=liftOf(j);stroke?c.strokeRect(x,y-z,w,h):c.fillRect(x,y-z,w,h)}}
/* 仮：ドアの箱の、手前左の面のとびら */
function isoBoxDoor(c,x,y,lv){const s0=lv*IQD,s1=(lv*IQL+IQWH*.8)/(2*IQB),X=x*TS,Y=y*TS+TS;c.beginPath();c.moveTo(X+TS*.25-s0,Y-s0);c.lineTo(X+TS*.75-s0,Y-s0);c.lineTo(X+TS*.75-s1,Y-s1);c.lineTo(X+TS*.25-s1,Y-s1);c.closePath();c.fill()}
/* 立てて描いた物の上の点（いままでの見え方のせかいの点 wx,wy）の、画面の点（CSS の px）。テスト・案内の指で使う */
function standS(A,wx,wy,lv){if(!isoOn())return{x:(wx-cam.x)*cam.z,y:(wy-cam.y)*cam.z};const cx=camCX(),cy=camCY();return{x:VW/2+(A.px-isoX(cx,cy)+(wx-A.fx)*IQSX)*cam.z,y:VH/2+(A.py-(lv||0)*IQL-isoY(cx,cy)+(wy-A.fy)*IQSY)*cam.z}}
function objS(j,wx,wy){return standS(objFootJ(j),wx,wy)}
function ptS(fx,fy,wx,wy){const j=clamp(Math.floor(fy),0,H-1)*W+clamp(Math.floor(fx),0,W-1);return standS(ptFoot(fx*TS,fy*TS),wx,wy,Math.max(0,hiAt(j)))}
