'use strict';
/* ---------- クォータービュー（ひし形のマス）の描き方の土台 ----------
   せかいの点（x*TS, y*TS）は、いままでのまま。画面の点（ゲームの点）は
     ix=(wx−wy)·IQA、iy=(wx+wy)·IQB
   1マスのひし形は、はば IQW・高さ IQH（ゲームの点。g64 の絵で 128×96）。段1だんは IQL 上。
   カメラは、いままでどおり cam.x・cam.y（画面のまん中のせかいの点から、画面の半分をひいた所）と cam.z。
   画面のまん中のせかいの点（camCX・camCY）を、画面のまん中にうつす。
   洞窟（cave.js）も、ひし形のマス（iso-cave.js）。 */
const IQW=64,IQH=48,IQL=36;/* 段1だんの高さは、マスの1辺（45.25）の0.8（持ち主がきめた。ほんとうの見え方の0.66より高く見せる） */
const IQA=IQW/2/TS,IQB=IQH/2/TS;/* せかいの点が1つ動くと、画面の点がいくつ動くか */
const IQD=IQL/(2*IQB);/* 段1だんぶん上に見せるとき、せかいの点を左上（x・y とも）へずらす数 */
const IQSX=IQW/Math.SQRT2/TS,IQSY=IQL/(.8*TS);/* 仮：いまの絵（ななめ見おろし）を立てるときの、よこ・たての大きさ（絵がそろうまで） */
const isoX=(wx,wy)=>(wx-wy)*IQA,isoY=(wx,wy)=>(wx+wy)*IQB;
function isoInv(ix,iy){const u=ix/IQA,v=iy/IQB;return{x:(u+v)/2,y:(v-u)/2}}
const camCX=()=>cam.x+VW/cam.z/2,camCY=()=>cam.y+VH/cam.z/2;
/* 3Dの描き方（draw-3d.js・js/3d）：G3.on のあいだ、地形・せいれいは3D、ほかの物は、この描き方で描いて3Dの板にする。G3.O：描き方の点のおき場所（板・地面にはる絵を描くとき。ゲームの点 (ax,ay) を、キャンバスの (ox,oy) に） */
const G3={_on:false,O:null,get on(){return this._on&&!(typeof caveOn==='function'&&caveOn())},set on(v){this._on=v}};/* 洞窟（まだ2D）にいるあいだは、いつも 2D の場所の計算 */
function isoOff(k){if(G3.O){const O=G3.O;return[O.ox-k*O.ax,O.oy-k*O.ay]}const cx=camCX(),cy=camCY();return[dpr*VW/2-k*isoX(cx,cy),dpr*VH/2-k*isoY(cx,cy)]}/* 画面のまん中に、カメラのまん中の点 */
/* 地面の描き方：せかいの点で描くと、ひし形に */
function groundTf(c,k){const O=isoOff(k);c.setTransform(k*IQA,k*IQB,-k*IQA,k*IQB,O[0],O[1])}
/* 立てる物の描き方：足もとのせかいの点 F（fx,fy）を、画面の点 P（px,py）にうつし、まわりは大きさだけかえて描く */
function standTf(c,k,fx,fy,px,py){if(G3.on&&!G3.O){const P=g3IsoS(px,py),kk=k/cam.z*P.s;c.setTransform(kk*IQSX,0,0,kk*IQSY,dpr*P.x-kk*IQSX*fx,dpr*P.y-kk*IQSY*fy);return}/* 3D：足もとの点を、3Dのカメラで写した所に */const O=isoOff(k);c.setTransform(k*IQSX,0,0,k*IQSY,k*(px-IQSX*fx)+O[0],k*(py-IQSY*fy)+O[1])}
/* せかいの点 (wx,wy) を足もとにして、立てる形で描く（高さ lv だんの上） */
function atPt(c,wx,wy,f,lv){c.save();standTf(c,dpr*cam.z,wx,wy,isoX(wx,wy),isoY(wx,wy)-(lv||0)*IQL);try{f()}finally{c.restore()}}
/* 画面の点（CSS の px）とせかいの点 */
function w2s(wx,wy,lv){if(G3.on){g3View();const P=R3D.project(wx/TS,(lv||0)*R3D.HSTEP,wy/TS);return{x:P.x,y:P.y}}const cx=camCX(),cy=camCY();return{x:VW/2+(isoX(wx,wy)-isoX(cx,cy))*cam.z,y:VH/2+(isoY(wx,wy)-(lv||0)*IQL-isoY(cx,cy))*cam.z}}
function s2w(sx,sy){if(G3.on){g3View();const h=R3D.pick(sx,sy);if(h)return{x:h.x*TS,y:h.z*TS,lv:Math.max(0,h.lv)};const p=R3D.plane(sx,sy);return{x:p.x*TS,y:p.z*TS,lv:0}}/* 3D：地形にあたる所（高さ lv もいっしょに） */const cx=camCX(),cy=camCY();return isoInv(isoX(cx,cy)+(sx-VW/2)/cam.z,isoY(cx,cy)+(sy-VH/2)/cam.z)}
/* せかいの点 (wx,wy) が、画面の (sx,sy) に来るように、カメラをおく */
function camAt(wx,wy,sx,sy){if(G3.on){g3View();const p=R3D.plane(sx,sy),q=R3D.plane(VW/2,VH/2);cam.x=wx-(p.x-q.x)*TS-VW/cam.z/2;cam.y=wy-(p.z-q.z)*TS-VH/cam.z/2;return}const c=isoInv(isoX(wx,wy)-(sx-VW/2)/cam.z,isoY(wx,wy)-(sy-VH/2)/cam.z);cam.x=c.x-VW/cam.z/2;cam.y=c.y-VH/cam.z/2}
/* 画面の上で (dx,dy)（CSS の px）だけ、地図をずらす */
function camShift(dx,dy){if(G3.on){g3View();const p=R3D.plane(VW/2-dx,VH/2-dy),q=R3D.plane(VW/2,VH/2);cam.x+=(p.x-q.x)*TS;cam.y+=(p.z-q.z)*TS;return}const cx=camCX(),cy=camCY(),c=isoInv(isoX(cx,cy)-dx/cam.z,isoY(cx,cy)-dy/cam.z);cam.x=c.x-VW/cam.z/2;cam.y=c.y-VH/cam.z/2}
/* タップした所に見えている、いちばん手前の高い段のマスの、せかいの点（高さのぶん、右下へもどす）。3D では s2w が高さもかえす */
function liftW(w){if(w&&w.lv!=null)return w;if(!S||!S.hi)return w;for(let lv=HMAX;lv>=1;lv--){const x=w.x+lv*IQD,y=w.y+lv*IQD,tx=Math.floor(x/TS),ty=Math.floor(y/TS);if(tx>=0&&ty>=0&&tx<W&&ty<H&&hiAt(ty*W+tx)===lv)return{x,y,lv}}return w}
/* 立っている物（足もと (fx,fy)、マス単位）の、いままでの見え方でのタップの点（せかいの点）。
   いままでの「足もとより上をタップ」の判定を、そのまま使えるようにする */
let TAPS=null;/* いまのタップ（画面の点と、地面のせかいの点） */
/* 画面に見えている、せかいのマスの四角（ひし形の画面の四すみから） */
function isoView(){if(G3.on){g3View();const P=[[0,0],[VW,0],[0,VH],[VW,VH]].map(([a,b])=>R3D.plane(a,b)),xs=P.map(p=>p.x),ys=P.map(p=>p.z);return{x0:Math.min(...xs)-1,x1:Math.max(...xs)+1,y0:Math.min(...ys)-1,y1:Math.max(...ys)+1}}const P=[s2w(0,0),s2w(VW,0),s2w(0,VH),s2w(VW,VH)],xs=P.map(p=>p.x/TS),ys=P.map(p=>p.y/TS);return{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)}}
/* マス (x,y) が画面に入るか（m：まわりのゆとり、画面の点） */
function isoCellVis(x,y,m){if(G3.on){if(G3.O)return true;g3View();const P=R3D.project(x+.5,Math.max(0,hiAt(y*W+x))*R3D.HSTEP,y+.5),M=(m+64)*P.s;return P.x>-M&&P.x<VW+M&&P.y>-M-IQL*4*P.s&&P.y<VH+M}const cx=camCX(),cy=camCY(),ix=(isoX((x+.5)*TS,(y+.5)*TS)-isoX(cx,cy))*cam.z,iy=(isoY((x+.5)*TS,(y+.5)*TS)-isoY(cx,cy))*cam.z,M=m*cam.z;return ix>-VW/2-M&&ix<VW/2+M&&iy>-VH/2-M-IQL*4*cam.z&&iy<VH/2+M+IQH*cam.z}
/* 高い段のマス（iso-cliff.js）。c は地面の描き方のまま来るので、画面の向きにして描く */
function isoTile(c,x,y){icScreen(c,()=>icBlock(c,x,y))}
/* 物（左上のマス (x,y)、大きさ w×h）の、立てる絵の足もと：
   いまの絵の足もと（下のはしのまん中）を、ひし形のまん中と手前の角のあいだにおく（仮） */
function objFoot(x,y,w,h,j){const lv=Math.max(0,hiAt(j)),t=.1375*(w+h)*TS,cx=(x+w/2)*TS,cy=(y+h/2)*TS;return{x,y,w,h,lv,fx:(x+w/2)*TS,fy:(y+h)*TS-liftOf(j),px:isoX(cx+t,cy+t),py:isoY(cx+t,cy+t)+IQSY*TS*.12-lv*IQL}}
function objFootJ(j){const a=anc(j),o=S.obj[a];if(!o||!BL[o])return objFoot(a%W,(a/W)|0,1,1,a);if(o==='lotus')return lotusFoot(a);const z=o==='site'&&S.dyn[a]&&BL[S.dyn[a].build]?BL[S.dyn[a].build].sz||[1,1]:szAt(o,a)||[1,1];return objFoot(a%W,(a/W)|0,z[0],z[1],a)}
/* ハス：水にうかぶ葉のまん中（いまの絵の LOTUSPAD、芽 bud~w も同じ所）を、マスのひし形のまん中に。
   池のはしのマスは、水の形がデュアルグリッドで丸くけずれるので、陸のある向きと反対（水のほう）へ LOTUSOFF ずらす（ななめだけ陸のマスは LOTUSOFFD） */
const LOTUSPAD=[16.5,20.5],LOTUSOFF=.36,LOTUSOFFD=.16;/* 絵の葉のまん中：マスの左上からのせかいの点（lotus の ax・ay と、葉のある行からはかった） */
function lotusFoot(a){const x=a%W,y=(a/W)|0,lv=Math.max(0,hiAt(a)),dry=(X,Y)=>X<0||Y<0||X>=W||Y>=H||!waterJ(Y*W+X);
  let ox=(dry(x-1,y)?1:0)-(dry(x+1,y)?1:0),oy=(dry(x,y-1)?1:0)-(dry(x,y+1)?1:0);ox*=LOTUSOFF;oy*=LOTUSOFF;
  if(!ox&&!oy)for(const[dx,dy]of[[-1,-1],[1,-1],[-1,1],[1,1]])if(dry(x+dx,y+dy)){ox-=dx*LOTUSOFFD;oy-=dy*LOTUSOFFD}
  const cx=(x+.5+ox)*TS,cy=(y+.5+oy)*TS;/* 絵はマスの左上から描くので、ずらすのは画面の点（px・py）だけ */return{x,y,w:1,h:1,lv,fx:x*TS+LOTUSPAD[0],fy:y*TS+LOTUSPAD[1]-liftOf(a),px:isoX(cx,cy),py:isoY(cx,cy)-lv*IQL}}
/* せいれい・コワイノなど（足もとの点）の足もと。高さは liftDraw がつける */
function ptFoot(wx,wy){return{fx:wx,fy:wy,px:isoX(wx,wy),py:isoY(wx,wy)}}
/* 足もと A で立てて描いた物の、いままでの見え方でのタップの点（せかいの点）。lv：その物の段（タップのときは、絵が上に見える高さ） */
function tapAt(A,lv){const T=TAPS;if(!T)return{x:0,y:0};if(G3.on){const P=g3AncS(A,lv);return{x:A.fx+(T.sx-P.x)/(P.s*IQSX),y:A.fy+(T.sy-P.y)/(P.s*IQSY)}}/* 3D：足もとを3Dのカメラで写した所から */const cx=camCX(),cy=camCY(),px=VW/2+(A.px-isoX(cx,cy))*cam.z,py=VH/2+(A.py-(lv||0)*IQL-isoY(cx,cy))*cam.z;return{x:A.fx+(T.sx-px)/(cam.z*IQSX),y:A.fy+(T.sy-py)/(cam.z*IQSY)}}
/* せいれいなど (fx,fy)（マス）のタップの点（その子のいるマスの段の高さで） */
function tapPt(fx,fy){const j=clamp(Math.floor(fy),0,H-1)*W+clamp(Math.floor(fx),0,W-1);return tapAt(ptFoot(fx*TS,fy*TS),Math.max(0,hiAt(j)))}
function tapObj(j){return tapAt(objFootJ(j))}
/* 地面にぬるマスのわく（高い段は、その高さに） */
function qRect(c,x,y,w,h,j,stroke){const s=Math.max(0,hiAt(j))*IQD;stroke?c.strokeRect(x-s,y-s,w,h):c.fillRect(x-s,y-s,w,h)}
/* 立てて描いた物の上の点（いままでの見え方のせかいの点 wx,wy）の、画面の点（CSS の px）。テスト・案内の指で使う */
function standS(A,wx,wy,lv){if(G3.on){const P=g3AncS(A,lv);return{x:P.x+(wx-A.fx)*IQSX*P.s,y:P.y+(wy-A.fy)*IQSY*P.s}}const cx=camCX(),cy=camCY();return{x:VW/2+(A.px-isoX(cx,cy)+(wx-A.fx)*IQSX)*cam.z,y:VH/2+(A.py-(lv||0)*IQL-isoY(cx,cy)+(wy-A.fy)*IQSY)*cam.z}}
function objS(j,wx,wy){return standS(objFootJ(j),wx,wy)}
function ptS(fx,fy,wx,wy){const j=clamp(Math.floor(fy),0,H-1)*W+clamp(Math.floor(fx),0,W-1);return standS(ptFoot(fx*TS,fy*TS),wx,wy,Math.max(0,hiAt(j)))}
