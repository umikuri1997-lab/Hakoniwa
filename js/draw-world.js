'use strict';
const EV=new WeakMap();let EVAP=[];/* 朝日で消える「コワイノ」：じゅわっと蒸発させる */
function drawEvap(it,now){const e=it.e,D=EN[e.type],z=D.size*2,px=e.x*TS,py=e.y*TS,p=Math.max(0,(now-it.t0)/(it.dur||1800)),v=EV.get(e)||{f:1};
  if(it.sand)return drawSand(it,now,e,D,z,px,py,v);
  if(it.die){/* たおれるモーション（やられの3コマ）→ たおれたまま、うすくなって消える */ctx.save();ctx.globalAlpha=p<.6?1:Math.max(0,1-(p-.6)/.4);drawShade(ctx,e.type,px,py+8,.27*z,v.f,{dot:1,t:now/1000+e.id*1.3,die:p<.12?0:p<.24?1:2,flash:p<.12});ctx.restore();return}
  if(p<.75){ctx.save();ctx.globalAlpha=Math.max(0,1-p/.75)*.9;ctx.translate(px,py+8);ctx.scale(1+p*.35,1-p*.55);ctx.translate(-px,-py-8);drawShade(ctx,e.type,px,py+8-p*10,.27*z,v.f,{dot:1,t:now/1000+e.id*1.3,flash:Math.sin(now/40)>0});ctx.restore()}
  for(let i=0;i<9;i++){const q=p*1.2-i*.06;if(q<0||q>1)continue;const sx=px+Math.sin(i*2.3+e.id)*14*z+Math.sin(now/300+i)*4,sy=py-6*z-q*48*z,r=(4+q*9)*z;ctx.globalAlpha=(1-q)*.55;ctx.fillStyle='#f4f0ff';ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill()}ctx.globalAlpha=1}
function drawSand(it,now,e,D,z,px,py,v){/* 砂になって消える：ひびが走る → 上から砂になってくずれ、足もとに砂山がのこって消える */
  const raw=(now-it.t0)/it.dur,p=Math.max(0,raw),Hh=34*D.size,Ww=14*D.size,top=py-Hh,SC=['#e8cf98','#d9b77a','#c9a35f','#b88d4f'];
  if(p<1){const c=p<.15?0:Math.min(1,(p-.15)/.75),cut=top+c*(Hh+14);
    const R=36*z,ox=px-R,oy=py+8-R*1.7,ww=R*2,hh=R*2.2,k=dpr*cam.z,cw=Math.ceil(ww*k)+2,ch=Math.ceil(hh*k)+2;/* 体だけを別の画面に描いて、砂の色をかさねる */
    if(EOC.width<cw||EOC.height<ch){EOC.width=EOS.width=Math.max(EOC.width,cw);EOC.height=EOS.height=Math.max(EOC.height,ch)}
    eox.setTransform(1,0,0,1,0,0);eox.clearRect(0,0,EOC.width,EOC.height);eox.setTransform(k,0,0,k,-ox*k,-oy*k);
    drawShade(eox,e.type,px+(raw<0?Math.sin(now/22)*3:0),py+8,.27*z,v.f,{dot:1,t:it.t0/1000+e.id*1.3,flash:false});/* ピシッ：一瞬ふるえる */
    eox.setTransform(1,0,0,1,0,0);eox.globalCompositeOperation='source-atop';eox.globalAlpha=Math.min(.8,c*1.3);eox.fillStyle='#c9a35f';eox.fillRect(0,0,cw,ch);eox.globalCompositeOperation='source-over';eox.globalAlpha=1;/* 体が砂の色にかわっていく */
    ctx.save();ctx.beginPath();ctx.rect(ox,cut,ww,hh);ctx.clip();ctx.drawImage(EOC,0,0,cw,ch,ox,oy,cw/k,ch/k);ctx.restore();
    if(raw<.25){ctx.save();ctx.globalAlpha=Math.min(1,(.25-raw)*6);ctx.strokeStyle='#fffbe8';ctx.lineWidth=2.2;for(let n2=0;n2<5;n2++){let x=px+(n2-2)*Ww*.35,y=top+Hh*.2;ctx.beginPath();ctx.moveTo(x,y);for(let n=0;n<5;n++){x+=Math.sin(e.id*7+n2*13+n*5)*Ww*.2;y+=Hh*.14;ctx.lineTo(x,y)}ctx.stroke()}ctx.restore()}/* ひびの線 */
    if(c>0&&c<1&&!PAUSE_FX())for(let n=0;n<3;n++)fx.push({k:'p',x:px+(Math.random()-.5)*Ww*1.8,y:cut+Math.random()*8,vx:(Math.random()-.5)*40,vy:-30+Math.random()*30,life:1.1,col:SC[(Math.random()*4)|0],r:2+Math.random()*2.5})}/* くずれたところから、砂がこぼれる */
  const m=Math.min(1,Math.max(0,(p-.2)/.6)),fade=p<1?1:Math.max(0,1-(raw-1)/.15);if(m>0&&fade>0){ctx.save();ctx.globalAlpha=fade;ctx.fillStyle='#c9a35f';ctx.beginPath();ctx.ellipse(px,py+10,Ww*1.2*m,Hh*.1*m+2,0,0,7);ctx.fill();ctx.fillStyle='#e0c487';ctx.beginPath();ctx.ellipse(px,py+7,Ww*.8*m,Hh*.06*m+1,0,0,7);ctx.fill();ctx.restore()}/* 足もとの砂山 */
  ctx.globalAlpha=1}
const PAUSE_FX=()=>started&&sheet!=null;
const GLW=document.createElement('canvas'),glx=GLW.getContext('2d');let GLWN=0;
const EOC=document.createElement('canvas'),EOS=document.createElement('canvas'),eox=EOC.getContext('2d'),eos=EOS.getContext('2d');
function enemyHidden(e,x0,y0,x1,y1){const ex=e.x|0,ey=e.y|0;
  for(let dy=0;dy<=4;dy++)for(let dx=-3;dx<=3;dx++){const x=ex+dx,y=ey+dy;if(x<0||y<0||x>=W||y>=H)continue;const a=anc(y*W+x),o=S.obj[a];if(!o||o==='part'||FLAT.has(o)||!BL[o])continue;
    const ay=(a/W)|0;if(ay<ey&&!(BL[o].sz&&ay+szAt(o,a)[1]-1>=ey))continue;const b=objBox(o,a);if(b[0]<x1&&b[2]>x0&&b[1]<y1&&b[3]>y0&&(ay>ey||dy>0||TREES.has(o)||BIG2.has(o)||BL[o].kind==='build'))return true}
  for(const h of HOUSES)if(h.set.has(ey*W+ex)||h.set.has((ey+1)*W+ex))return true;return false}
function drawEnemy(e,now){
  if(!e.spawned)return;const D=EN[e.type],z=D.size*2,px=e.x*TS,py=e.y*TS;
  if(!EV.has(e))EV.set(e,{x:e.x,y:e.y,back:false,f:1,mv:0});const v=EV.get(e),dx=e.x-v.x,dy=e.y-v.y;
  if(Math.abs(dx)+Math.abs(dy)>.001){v.mv=now;if(Math.abs(dx)>.0005)v.f=dx<0?-1:1;v.back=dy<0&&-dy>Math.abs(dx)*.6}v.x=e.x;v.y=e.y;
  shadow(ctx,px,py+8,9*z,2.6*z);
  {/* 白いふちどり：いったん別の画面に描いて、白いシルエットを少しずらして重ねる */
   const R=36*z,ox=px-R,oy=py+8-R*1.7,ww=R*2,hh=R*2.2,k=dpr*cam.z,cw=Math.ceil(ww*k)+2,ch=Math.ceil(hh*k)+2;
   if(EOC.width<cw||EOC.height<ch){EOC.width=EOS.width=Math.max(EOC.width,cw);EOC.height=EOS.height=Math.max(EOC.height,ch)}
   eox.setTransform(1,0,0,1,0,0);eox.clearRect(0,0,cw,ch);eox.setTransform(k,0,0,k,-ox*k,-oy*k);
   drawShade(eox,e.type,px,py+8,.27*z,v.f,{dot:1,t:now/1000+e.id*1.3,back:v.back,walk:now-v.mv<200,flash:false,hurt:e.flash>0?Math.max(0,1-e.flash/6):null,atk:now-(e.swing||-1e9)<300?.95+(now-e.swing)/300*.045:now-v.mv<200?0:(e.atk||0)/D.atk});
   eos.globalCompositeOperation='copy';eos.drawImage(EOC,0,0);eos.globalCompositeOperation='source-in';eos.fillStyle='#fff';eos.fillRect(0,0,cw,ch);eos.globalCompositeOperation='source-over';
   const sw=cw/k,sh=ch/k,o=1.3;ctx.globalAlpha=e.stun>0?.5:.95;
   const OFF=[[o,0],[-o,0],[0,o],[0,-o],[o*.7,o*.7],[-o*.7,o*.7],[o*.7,-o*.7],[-o*.7,-o*.7]];for(const[dx,dy]of OFF)ctx.drawImage(EOS,0,0,cw,ch,ox+dx,oy+dy,sw,sh);
   /* 夜は暗くなってふちが見えにくいので、物にかくれていなければ、暗さの上からもう一度ふちを光らせる */
   if(darkness()>0&&!enemyHidden(e,ox,oy,ox+ww,py+8)){if(GLW.width!==cv.width||GLW.height!==cv.height){GLW.width=cv.width;GLW.height=cv.height}if(!GLWN){glx.setTransform(1,0,0,1,0,0);glx.clearRect(0,0,GLW.width,GLW.height)}GLWN++;
     glx.setTransform(ctx.getTransform());/* 段差の上・よじのぼり中の高さ（liftDraw）も、本体と同じにする */for(const[dx,dy]of OFF)glx.drawImage(EOS,0,0,cw,ch,ox+dx,oy+dy,sw,sh);glx.globalCompositeOperation='destination-out';glx.drawImage(EOC,0,0,cw,ch,ox,oy,sw,sh);glx.globalCompositeOperation='source-over'}
   ctx.globalAlpha=e.stun>0?.55:1;ctx.drawImage(EOC,0,0,cw,ch,ox,oy,sw,sh);ctx.globalAlpha=1}
  const bw=Math.max(14,e.max*2.2)*Math.min(z,1.3),bx=px-bw/2,byy=py+8-27*z-6;
  const bar=()=>{let by=byy;for(const[j]of WALLHIT){const wx=(j%W)*TS,wy=((j/W)|0)*TS;if(bx<wx+TS&&bx+bw>wx&&by+3>wy-18&&by-1<wy){by=Math.min(by,wy-22)}}/* 柵などの体力ゲージと重なるときは、その上に出す */ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(bx-1,by-1,bw+2,4);ctx.fillStyle='#ff6b8a';ctx.fillRect(bx,by,bw*Math.max(0,e.hp)/e.max,2)};if(BUBQ)BUBQ.push(bar);else bar();/* 体力ゲージは物にかくれないよう最後に */
}
// 物の見た目のおおよその範囲（描き直し・重なり判定用、少し大きめ）
// 建てている足場の見た目の広さ（マス）。x0:左はし, w:はば, rows:足もとまでの行数, hf:高さの倍率
// 足場・畑の区画・芽のドット絵。足場は大きさがいろいろなので、柱・横木・ななめ木・れんが・砂山のパーツを組み立てて、1まいの絵にしておく
const SITEK=['site:post','site:cap','site:beam','site:beamL','site:beamR','site:brace','site:brick','site:walltop','site:sand','site:post2','site:cap2','site:beam2','site:beamL2','site:beamR2','site:brace2','site:sand2'],SITEC={};
const chipOK=k=>{const C=window.CHIPS;return !!(C&&C[k]&&chipImgs(C[k],k)[0].ok)};
function siteImg(Wd,Hd,seed){Wd=Math.round(Wd);Hd=Math.round(Hd);if(!SITEK.every(chipOK))return null;const key=Wd+'x'+Hd+'_'+(seed%5);if(SITEC[key])return SITEC[key];
  const cv=document.createElement('canvas');cv.width=Wd;cv.height=Hd;const g=cv.getContext('2d'),C=CHIPS,im=k=>chipImgs(C[k],k)[0],put=(k,x,y)=>g.drawImage(im(k),Math.round(x+C[k].ax),Math.round(y+C[k].ay)),B=Hd;
  // 作りかけの壁：右へいくほど低い、だんだんの形
  const x0=Math.round(Wd*.1),x1=Math.round(Wd*.9),n=Math.max(1,Math.ceil((x1-x0)/6));g.save();g.beginPath();const tops=[];
  for(let k=0;k<n;k++){const t=n>1?k/(n-1):0,h=Math.floor((Hd*(.9-.42*t)+hash(seed*7+k)*5)/6)*6;tops.push(B-h);g.rect(x0+k*6,B-h,6,h)}g.clip();
  for(let y=B-6,r=0;y>-6;y-=6,r++)for(let x=x0-12+(r%2?6:0);x<x1;x+=12)put('site:brick',x,y);g.restore();
  for(let k=0;k<n;k++)for(let x=0;x<6&&x0+k*6+x<x1;x+=6)put('site:walltop',x0+k*6,tops[k]);
  const Z=Wd>=80?'2':'',PW=Z?9:6,BW=Z?7:5;/* 大きい足場は、太い柱と横木 */
  // 柱
  const posts=[[Math.round(Wd*.12)-(Z?4:3),Hd],[Math.round(Wd*.8),Math.round(Hd*.88)]];if(Wd>90)posts.push([Math.round(Wd*.48),Math.round(Hd*.78)]);
  for(const[px,ph]of posts){for(let y=B-8;y>B-ph;y-=8)put('site:post'+Z,px,y);put('site:cap'+Z,px,B-ph)}
  // ななめ木
  {const ax=posts[0][0]+(Z?4:3),ay=B-Math.round(Hd*.5),bx=Math.round(Wd*.56),by=B-3,len=Math.max(Math.abs(bx-ax),Math.abs(by-ay));for(let s=0;s<=len;s++)put('site:brace'+Z,ax+(bx-ax)*s/len,ay+(by-ay)*s/len)}
  // 横木（柱より手前）
  for(const yy of[B-Math.round(Hd*.62),B-Math.round(Hd*.22)]){const E2=Z?3:2;put('site:beamL'+Z,0,yy);for(let x=E2;x<Wd-E2;x+=8)put('site:beam'+Z,Math.min(x,Wd-E2-8),yy);put('site:beamR'+Z,Wd-E2,yy)}
  for(const[px]of posts)put('site:sand'+Z,px+(Z?4:3),B);
  return SITEC[key]=cv}
function siteSpan(id){const b=BL[id];if(!b)return null;if(id==='statue')return{x0:-1,w:3,rows:1,hf:1.25};if(BIG2.has(id))return{x0:-.5,w:2,rows:1,hf:1.4};if(b.sz)return{x0:0,w:b.sz[0],rows:b.sz[1],hf:1};if(b.kind==='build')return{x0:-.2,w:1.4,rows:1,hf:1.1};return null}
function objBox(o,j){if(STAIRS.has(o)){const x=(j%W)*TS,y=((j/W)|0)*TS;return[x-TS-4,y-TS-30,x+2*TS+4,y+2*TS+4]}/* 階段は1×2で、どの向きにものびる */if(o==='site'&&S.dyn[j]){const sp=siteSpan(S.dyn[j].build);if(sp){const x=j%W,y=(j/W)|0,L=x*TS+sp.x0*TS-4,Wd=sp.w*TS+8,B=(y+sp.rows)*TS+3;return[L,B-Wd*91/104*sp.hf-20,L+Wd,B]}}
const x=j%W,y=(j/W)|0,b=BL[o],z=szAt(o,j)||[1,1],k=BIG2.has(o)?2:TREES.has(o)?2.25:(o==='stor'||o==='mbox')?1.25:BIG.has(o)?(BIGK[o]||1.5):1,tall=BIG2.has(o)||TREES.has(o)||b.kind==='build';
  const cx=x*TS+16*z[0],by=(y+z[1])*TS+3,hw=Math.max(16*z[0]*k,tall?28:16)+6,ht=tall?150:b.kind==='block'?44:48*k*z[1]+8;return[cx-hw,by-ht,cx+hw,by]}
const FLAT=new Set(['rug1','rug2','hoshirug','kusarug','farm','plot','sprout','spike','puddle','sticky','firetrap','gust','crack']);/* 地面に近い物：その上に立つせいれいより下に描く */
function objectDepth(o,j){const y=(j/W)|0;if(FLAT.has(o)||LADDERS.has(o))return y+.02;if(o==='bridge')return y+.01;/* 橋は、上を歩く子より下 */if(STAIRS.has(o)){const d=stairDir(j);return (d===2||d===0?y-1:y)+.02}/* 階段・坂は、いちばん上の行（のぼった先の高いマスの行）のはじめ（上に立つせいれいより下） */if(HOME_DOORS.has(o)&&HOUSES.some(h=>h.set.has(j)))return y+.3;/* 家のドアは、屋根より下の層 */
  const b=o==='site'&&S.dyn[j]&&BL[S.dyn[j].build]||BL[o];
  return y+(b&&b.sz?(o==='site'?b.sz[1]:szAt(o,j)[1]):1)+(o==='obox'?.01:0);
}

const FORDS={s:null,n:-1,glow:null,st:new Map()};/* 浅瀬の絵：砂の光（どのマスも同じ1まい）と、マスごとの小石の絵（1回だけ作っておく） */
function fordStones(j){/* マス j の小石の絵（2倍の細かさ） */let c=FORDS.st.get(j);if(c)return c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.scale(2,2);const n=4+((hash(j*3)*3)|0);
  for(let k=0;k<n;k++){const sx=4+hash(j*11+k)*24,sy=4+hash(j*17+k)*24,r=1.2+hash(j*23+k)*2.2;g.fillStyle='rgba(60,80,80,.18)';g.beginPath();g.ellipse(sx+.4,sy+.8,r,r*.7,0,0,7);g.fill();g.fillStyle=k%3?'#b4ab98':'#a39a88';g.beginPath();g.ellipse(sx,sy,r,r*.7,0,0,7);g.fill();g.fillStyle='rgba(255,252,240,.35)';g.beginPath();g.ellipse(sx-.4,sy-.4,r*.5,r*.28,0,0,7);g.fill()}/* 小さな石（大きさ・色がばらばら） */
  FORDS.st.set(j,c);return c}
function drawFords(x0,y0,x1,y1){/* 浅瀬（仮の絵）：水の底の砂がすけて見える（ふちはぼかして、となりの浅瀬とつながる）・小さな石・ゆっくり流れるさざなみ */const now=performance.now();
  if(FORDS.s!==S||FORDS.n!==STATN){FORDS.s=S;FORDS.n=STATN;for(const c of FORDS.st.values())c.width=c.height=0;FORDS.st.clear()}/* 下絵が変わったら（浅瀬が変わったかもしれない）作りなおす */
  if(!FORDS.glow){const c=FORDS.glow=document.createElement('canvas');c.width=c.height=88;const g=c.getContext('2d'),gr=g.createRadialGradient(44,44,6,44,44,44);gr.addColorStop(0,'rgba(226,214,170,.55)');gr.addColorStop(.6,'rgba(214,204,160,.32)');gr.addColorStop(1,'rgba(214,204,160,0)');g.fillStyle=gr;g.fillRect(0,0,88,88)}
  for(let y=Math.max(0,y0-1);y<Math.min(H,y1+1);y++)for(let x=Math.max(0,x0-1);x<Math.min(W,x1+1);x++){if(S.ground[y*W+x]!==2)continue;ctx.drawImage(FORDS.glow,x*TS-6,y*TS-6,44,44)}
  for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const j=y*W+x;if(S.ground[j]!==2)continue;const px=x*TS,py=y*TS;ctx.drawImage(fordStones(j),px,py,TS,TS);
    ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=.8;for(let k=0;k<2;k++){const ph=((now/2600+hash(j*29+k))%1),sx=px+6+hash(j*31+k)*20,sy=py+8+k*12+ph*4;ctx.globalAlpha=Math.sin(ph*Math.PI);ctx.beginPath();ctx.moveTo(sx-4,sy);ctx.quadraticCurveTo(sx,sy-1.6,sx+4,sy);ctx.stroke()}ctx.globalAlpha=1}}/* 石のあいだを流れるさざなみ（動くので毎コマ） */
const WCK={s:null,c:new Map(),pt:null};/* 水面の区画（16×16マス）：水ぎわの陸の地面と水のふちの絵（上にかさねる）と、水の模様をぬる所の形。区画の地面が変わったときだけ作りなおす */
function waterDirty(R){if(!R){for(const q of WCK.c.values())if(q&&q.o)q.o.width=q.o.height=0;WCK.c.clear();return}for(const r of R)for(let cy=Math.max(0,(r[1]-1)>>4);cy<=Math.min((H-1)>>4,(r[3]+1)>>4);cy++)for(let cx=Math.max(0,(r[0]-1)>>4);cx<=Math.min((W-1)>>4,(r[2]+1)>>4);cx++){const k=cy*64+cx,q=WCK.c.get(k);if(q&&q.o)q.o.width=q.o.height=0;WCK.c.delete(k)}}/* 下絵がかわった所の区画を作りなおす（R がなければ、ぜんぶ） */
function waterChunk(cx,cy){const k=cy*64+cx;if(WCK.c.has(k))return WCK.c.get(k);{const g0=GRD.c.get(k);if(GRD.s!==S||!g0||!g0.f||g0.st)return null}/* 地面の区画（くわしい絵）ができてから作る */const C=window.CHIPS,X0=cx*16,Y0=cy*16,X1=Math.min(W,X0+16),Y1=Math.min(H,Y0+16),isW=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&S.ground[y*W+x]>=1,near=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(isW(x+dx,y+dy))return true;return false};
  const P=new Path2D();let any=false;for(let y=Y0;y<Y1;y++){let x=X0;while(x<X1){if(!near(x,y)){x++;continue}let e=x;while(e+1<X1&&near(e+1,y))e++;P.rect(x*TS,y*TS,(e-x+1)*TS,TS);any=true;x=e+1}}/* 水の模様をぬる所：水のマスと、そのまわり1マス */
  if(!any){WCK.c.set(k,null);return null}
  const w=(X1-X0)*TS,h=(Y1-Y0)*TS,put=(c,ch,x,y)=>{const src=ch.src||ch,i=chipImgs(src,'water')[0];if(!i.ok)return false;if(src.g===64)c.drawImage(i,x+src.ax/2,y+src.ay/2,src.w/2,src.h/2);else c.drawImage(i,x+src.ax,y+src.ay);return true};
  const m=TMPC();m.width=w;m.height=h;const gm=m.getContext('2d');gm.translate(-X0*TS,-Y0*TS);const o=document.createElement('canvas');o.width=w;o.height=h;const g=o.getContext('2d');
  for(let y=Y0-1;y<=Y1+1;y++)for(let x=X0-1;x<=X1+1;x++){const b=(isW(x-1,y-1)?1:0)|(isW(x,y-1)?2:0)|(isW(x-1,y)?4:0)|(isW(x,y)?8:0);if(!b)continue;const ch=C['waterm:'+b];if(ch)put(gm,ch,x*TS,y*TS)}
  g.drawImage(gq(cx,cy).f,0,0);g.globalCompositeOperation='destination-out';g.drawImage(m,0,0);g.globalCompositeOperation='source-over';g.translate(-X0*TS,-Y0*TS);/* 陸の地面（下絵）のうち、水でない所（区画ぜんぶ。水の模様をぬった所のふちの、うすい線もかくれる） */
  for(let y=Y0-1;y<=Y1+1;y++)for(let x=X0-1;x<=X1+1;x++){const b=(isW(x-1,y-1)?1:0)|(isW(x,y-1)?2:0)|(isW(x-1,y)?4:0)|(isW(x,y)?8:0);if(!b)continue;const ce=C['water:'+b];if(ce)put(g,ce,x*TS,y*TS)}/* 水のふち */
  m.width=m.height=0;const q={o,P};WCK.c.set(k,q);return q}
function waterShimmer(now,x0,y0,x1,y1){/* 水面（ふつうのタイルのやり方）：水の模様（tex:water）を、水のマスとまわり1マスに、世界の座標でしきつめてぬる（ゆっくりスクロール）。その上に、区画ごとに作っておいた「水ぎわの陸の地面と水のふち」の絵をかさねる */
  if(WD===1||!waterChipsOK())return;const C=window.CHIPS,im=chipImgs(C['tex:water'],'water')[0];if(!im.ok)return;
  if(WCK.s!==S){waterDirty(null);WCK.s=S;WCK.pt=null}
  const t=now/1000,sx=Math.floor(t*4)%128,sy=Math.floor(t*2)%128;/* 1秒に よこ4・たて2ドット（テクスチャの1ドットずつ動かす） */
  const qs=[];for(let cy=Math.max(0,(y0-1)>>4);cy<=Math.min((H-1)>>4,(y1+1)>>4);cy++)for(let cx=Math.max(0,(x0-1)>>4);cx<=Math.min((W-1)>>4,(x1+1)>>4);cx++){const q=waterChunk(cx,cy);if(q)qs.push([cx,cy,q])}
  if(!qs.length)return;
  const P=new Path2D();for(const[,,q]of qs)P.addPath(q.P);/* 見えている区画の形を1つにして、1回でぬる（区画のさかいに線が出ないように） */
  const pt=WCK.pt||(WCK.pt=ctx.createPattern(im,'repeat'));pt.setTransform(new DOMMatrix().translate(sx,sy));ctx.fillStyle=pt;ctx.fill(P);
  const kz=dpr*cam.z,SX=v=>cam.x+Math.round((v-cam.x)*kz)/kz,SY=v=>cam.y+Math.round((v-cam.y)*kz)/kz;
  for(const[cx,cy,q]of qs){const a=SX(cx*16*TS),b=SY(cy*16*TS);ctx.drawImage(q.o,a,b,SX(cx*16*TS+q.o.width)-a,SY(cy*16*TS+q.o.height)-b)}}/* 区画の絵は、画面のドットのさかいに合わせておく */
function sideClip(i,f){/* 低いマスの物が、となりの高いマスの上へはみ出さないように：となりのマスが高ければ、そのマスの高い面（上の面のてっぺんより下）には描かない */const x=i%W,y=(i/W)|0,h=hiAt(i),L=x>0&&hiAt(i-1)>h?hiAt(i-1):0,R=x<W-1&&hiAt(i+1)>h?hiAt(i+1):0;if(!L&&!R){f();return}
  ctx.save();ctx.beginPath();ctx.rect(x*TS-200,y*TS-400,TS+400,600);if(L)ctx.rect(x*TS-200,y*TS-L*LIFT,200,TS+L*LIFT+200);if(R)ctx.rect((x+1)*TS,y*TS-R*LIFT,200,TS+R*LIFT+200);ctx.clip('evenodd');f();ctx.restore()}
function liftDraw(z,f){if(!z){f();return}ctx.save();ctx.translate(0,-z);f();ctx.restore()}
const WPLIFT=65;/* 見張り台の上に立つ高さ */const CLIMB=new Set();/* いま段差をよじのぼっている・おりているせいれい（uLift で入れる） */
function uLift(o){if(o&&o.act&&o.act.type==='watchpost'&&o.act.stage==='do'){const k=Math.min(1,o.act.cl||0);if(k<1)CLIMB.add(o);else CLIMB.delete(o);return (S.hi?hiAt(o.act.obj+W)*LIFT:0)+WPLIFT*k}/* 見張り台の上に立つ（ハシゴを少しずつのぼる） */if(o&&o.elem){CLIMB.delete(o);if(S&&LADDERS.has(S.obj[(o.y|0)*W+(o.x|0)])&&o.path&&o.path.length)CLIMB.add(o)}/* ハシゴの上を動いている子も、よじのぼる動き *//* 段差の上にいる子・コワイノは、LIFT だけ上に。段差を飛んでいる間は、高さを少しずつかえて、ぴょんと弧をえがく */
  if(!S.hi||!o)return 0;const cj=(o.y|0)*W+(o.x|0),n=o.path&&o.path.length?o.path[0]:-1;
  if(n>=0&&n!==cj||n>=0){const nx=n%W+.5,ny=((n/W)|0)+.5,ddx=nx-o.x,ddy=ny-o.y,d=Math.hypot(ddx,ddy);if(d>.001&&d<1.01){const sx=Math.abs(ddx)>=Math.abs(ddy)?Math.sign(ddx):0,sy=sx?0:Math.sign(ddy),a=n-sy*W-sx,ha=hiAt(a),hn=hiAt(n);if(jumpEdge(a,n)){const t=1-d;if(o.elem){CLIMB.add(o);return LIFT*(ha+(hn-ha)*t)+Math.abs(Math.sin(t*Math.PI*4))*1.5}/* せいれいは、よじのぼる・おりる（少しずつ高さをかえ、1歩ごとに小さくゆれる） */return LIFT*(ha+(hn-ha)*t)+Math.sin(Math.PI*t)*10}}}
  return zAt(o.x,o.y)}
const STPAL={slope_earth:['#c19466','#8f6642','#6e4c30'],stairs_wood:['#dcae72','#a9784b','#86593a'],stairs_brick:['#dba48c','#b8735c','#935a47'],stairs_stone:['#d3cdc2','#a59d91','#837b70']};
function drawStair(c,id,px,py,d,top,bot){/* 階段のアイコン（仮の絵）：手前へ下りる5だん */
  const P=STPAL[id]||STPAL.slope_earth,br=id.endsWith('_brick'),n=5,h=(bot-top)/n,x0=px+3,w=TS-6;
  if(SLOPES.has(id)){c.fillStyle=P[1];c.beginPath();c.moveTo(x0,bot);c.lineTo(x0+w,bot);c.lineTo(x0+w,top+4);c.closePath();c.fill();c.fillStyle=P[0];c.beginPath();c.moveTo(x0,bot);c.lineTo(x0+w,top+4);c.lineTo(x0+w,top);c.lineTo(x0,bot-4);c.closePath();c.fill();return}/* 坂のアイコン */
  for(let k=0;k<n;k++){const y=top+k*h;c.fillStyle=P[0];c.fillRect(x0,y,w,h*.5+.5);c.fillStyle=P[1];c.fillRect(x0,y+h*.5,w,h*.5+.5);if(br){c.fillStyle='rgba(235,220,205,.55)';const bw=w/4,o=k%2?bw/2:0;for(let xx=x0+o;xx<x0+w;xx+=bw)c.fillRect(xx,y+h*.5,.6,h*.5)}}}
const SN=6;/* 階段の段の数（どの向きも同じ） */
const SLTEX=new Map();function slopeTex(a,d){/* 坂の面のもようは、のぼった先の高いマスの地面と同じ（草地・あれ地・あぜ道・砂利道など）。ふちのない、その地面の絵をくりかえす */
  const t=stairTop(a,d),f=S.floor[t]||'',g=REV.has(t);let e=SLTEX.get(a);if(e&&e.t===t&&e.f===f&&e.g===g&&e.w===WD)return e.p;const C=window.CHIPS||{},mk=(ch,id)=>{if(!ch)return null;const cv=document.createElement('canvas');cv.width=cv.height=TS;drawChip(cv.getContext('2d'),ch,id,0,0,0);return cv};
  let src=f?mk(C[(f==='woodpath'?'floor':f==='brickfloor'?'brick':f==='stonefloor'?'stonefloor':f)+'#0'],f):g?(C['tex:grass']&&chipImgs(C['tex:grass'],'ground')[0]):WD===1?mk(C['groundr#0'],'ground'):(C['tex:dry']&&chipImgs(C['tex:dry'],'ground')[0]);
  if(!src||src.ok===false)return null;e={t,f,g,w:WD,p:document.createElement('canvas').getContext('2d').createPattern(src,'repeat')};SLTEX.set(a,e);return e.p}
function cliffEdgeOver(c,k,sd){/* 高いマス k の、sd がわ（0左・1右）のはし：横の岩と、がけの正面の丸いはし（段差の部品と同じ描き方） */
  const C=window.CHIPS||{},fd=(key,x,y)=>{const ch=C[key];if(ch)drawChip(c,ch,'cliff',x,y,0)},px=(k%W)*TS,py=((k/W)|0)*TS,U=hiAt(k-W)>=CLV,D=hiAt(k+W)>=CLV,L=topAt(k-1),R=topAt(k+1),cl=(x,y,w,h,f)=>{c.save();c.beginPath();c.rect(x,y,w,h);c.clip();f();c.restore()};
  cl(sd?px+TS-3:px-8,py-LIFT+(U?0:5),11,TS,()=>fd('cliff:side'+(sd?'R':'L')+(REV.has(k)?'':'~d'),px,py));
  if(!D){cl(sd?px+TS-8:px-8,py+TS-LIFT-8,16,LIFT+10,()=>fd('cliff:'+(!L&&!R?'faceLR':sd?'faceR':'faceL'),px,py))}}
const FEATHC=new Map();function slopeFeather(c,a,d){/* 坂をのぼった先：上の面の絵（下絵を LIFT 上にずらした絵）を、さかいの外6ドットから坂の上へ10ドットまで（鏡うつしで）のばして、坂の上でうすくしていく。上の面のふちの線はかくれ、さかいはなめらか。坂の面の明るさのちがいで、終わりはわかる */
  const ax=(a%W)*TS,ay=((a/W)|0)*TS,I=6,O=10,v=d===0||d===2,K=2;
  const x=d===1?ax-I:d===3?ax+TS-O:ax,y=d===0?ay-LIFT-I:d===2?ay+TS-LIFT-O:ay-LIFT,w=v?TS:I+O,h=v?I+O:TS,key=STATN+':'+d;
  let e=FEATHC.get(a);if(!e||e.k!==key){const cv=document.createElement('canvas');cv.width=w*K;cv.height=h*K;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(K,0,0,K,-x*K,-y*K);
    if(d===0){gblit(g,ax,ay-I,TS,I,ax,ay-LIFT-I,TS,I);g.save();g.translate(0,2*(ay-LIFT));g.scale(1,-1);gblit(g,ax,ay-O,TS,O,ax,ay-LIFT-O,TS,O);g.restore()}/* 上の面のはしを、さかいで鏡うつしにして、坂の上へのばす */
    else if(d===2){gblit(g,ax,ay+TS,TS,I,ax,ay+TS-LIFT,TS,I);g.save();g.translate(0,2*(ay+TS-LIFT));g.scale(1,-1);gblit(g,ax,ay+TS,TS,O,ax,ay+TS-LIFT,TS,O);g.restore()}
    else if(d===1){gblit(g,ax-I,ay,I,TS,ax-I,ay-LIFT,I,TS);g.save();g.translate(2*ax,0);g.scale(-1,1);gblit(g,ax-O,ay,O,TS,ax-O,ay-LIFT,O,TS);g.restore()}
    else{gblit(g,ax+TS,ay,I,TS,ax+TS,ay-LIFT,I,TS);g.save();g.translate(2*(ax+TS),0);g.scale(-1,1);gblit(g,ax+TS,ay,O,TS,ax+TS,ay-LIFT,O,TS);g.restore()}
    g.fillStyle='rgba(255,250,225,.10)';g.fillRect(x,y,w,h);/* 上の面と同じく少し明るく */
    g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';const W2=w*K,H2=h*K,L=I+O,gr=d===0?g.createLinearGradient(0,0,0,H2):d===2?g.createLinearGradient(0,H2,0,0):d===1?g.createLinearGradient(0,0,W2,0):g.createLinearGradient(W2,0,0,0);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop((I+2)/L,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W2,H2);e={k:key,cv};FEATHC.set(a,e)}
  c.save();if(!v){/* 横向き：坂の上は、ななめの面の中だけ */const xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,gy=ay+TS;c.beginPath();c.moveTo(xi,ay-LIFT);c.lineTo(xo,ay);c.lineTo(xo,gy);c.lineTo(xi,gy-LIFT);c.closePath();c.rect(d===1?ax-I:ax+TS,ay-LIFT,I,TS);c.clip('nonzero')}
  c.drawImage(e.cv,x,y,w,h);c.restore()}
function slopeCliff(c,x0,y,len){/* がけの正面の岩の絵を、よこにならべる（坂の横の三角） */const ch=(window.CHIPS||{})['cliff:face'];if(!ch)return;for(let x=x0;x<x0+len;x+=TS)drawChip(c,ch,'cliff',x,y,0)}
function drawStairObj(c,a,id0){/* 階段は、置いた地面の高さ（hiAt）だけ上に描く。のぼった先は、その1だん上（CLV） */const L0=hiAt(a),cv=CLV;c.save();c.translate(0,-L0*LIFT);CLV=L0+1;try{drawStairObj0(c,a,id0)}finally{CLV=cv;c.restore()}}
function drawStairObj0(c,a,id0){/* 階段（仮の絵）：段差の下の低い地面に置く。手前向きは1マス（がけの正面とあわせて2マスぶんに見える）、ほかは1×2。高いほうのはしの高さ LIFT から地面まで6だん（段の高さ LIFT/7） */
  const id=id0||S.obj[a],d=stairDir(a);if(d<0)return;/* id0：置く前の見本（マスにまだ物がない） */const P=STPAL[id]||STPAL.slope_earth,br=id.endsWith('_brick'),Dn=(d===0?TS:2*TS)/SN,z=n=>n>=SN?0:LIFT*(SN-n)/(SN+1),MO='rgba(235,220,205,.55)',ax=(a%W)*TS,ay=((a/W)|0)*TS;
  const mo=(x,y,w,h)=>{c.fillStyle=MO;c.fillRect(x,y,w,h)};
  const vjoin=(x,y,w,h,off)=>{for(let xx=Math.floor((x-off)/16)*16+off;xx<x+w;xx+=16)if(xx>x+.5)mo(xx,y,.6,h)};/* たての目地（世界の座標で16ドットごと：レンガ1こ16×8） */
  const wd=id==='stairs_wood',stn=id==='stairs_stone',hz=k=>hash(a*977+k*131);
  const sfree=ks=>ks.every(k=>{if(k<0)return false;const t=typeAt(k);return !(hiAt(k)>=CLV||HOME_WALLS.has(t)||HOME_DOORS.has(t)||FENCE_IDS.has(t))}),o2=d===2?stairOut(a,d):-1,sTop=d===0?ay-LIFT:ay-TS,sBot=d===0?ay+TS:ay+TS-LIFT;
  const vnat=SLOPES.has(id)&&(d===0||d===2)&&!['stone','brick'].includes(S.floor[stairTop(a,d)]||''),sL=vnat&&sfree(d===0?[a-1]:[a-1,o2-1]),sR=vnat&&sfree(d===0?[a+1]:[a+1,o2+1]);/* たて向きの坂（土・草地）：両わきは、がけの上の面のように、少しでこぼこのふち（外へ1〜2ドット） */
  const sje=(y,sd)=>{const k=Math.floor(y/3),f=y/3-k,h0=hz(9000+k*2+sd),h1=hz(9000+(k+1)*2+sd);return .8+(h0+(h1-h0)*f)*1.4},eX=(y,sd)=>sd?ax+TS+(sR?sje(y,1):0):ax-(sL?sje(y,0):0);
  const sPath=()=>{c.beginPath();c.moveTo(eX(sTop,0),sTop);for(let y=sTop;y<=sBot;y++)c.lineTo(eX(y,0),y);for(let y=sBot;y>=sTop;y--)c.lineTo(eX(y,1),y);c.closePath()};
  const txp=rot=>{const k=wd?'tex:planks':'tex:granite',ch=(window.CHIPS||{})[k];if(!ch)return null;const im=chipImgs(ch,k)[0];if(!im||!im.ok)return null;const p=c.createPattern(im,'repeat'),m=new DOMMatrix();if(rot)m.rotateSelf(90);m.scaleSelf(.5,.5);p.setTransform(m);return p};/* もらったテクスチャ（木は板、石はみかげ石）を、1マス64ドットの細かさでしきつめる。木は、段にそって板がならぶ向き */
  const tex=(x,y,w,h,rot,dk)=>{const p=txp(rot);if(!p)return false;c.fillStyle=p;c.fillRect(x,y,w,h);if(dk){c.fillStyle=dk;c.fillRect(x,y,w,h)}return true};
  const DK=wd?'rgba(70,42,20,.3)':'rgba(40,40,44,.24)';/* 段の手前の面・側板は、上の面より暗く */
  const riser=(x,y,w,h,n)=>{c.fillStyle=P[1];c.fillRect(x,y,w,h);if(br)vjoin(x,y,w,h,n%2?8:0);else if(wd||stn)tex(x,y,w,h,1,DK)};/* 段の手前の面（レンガは、上の段と同じならび） */
  const face=(x,y,w,h,gy)=>{c.fillStyle=P[1];c.fillRect(x,y,w,h);if(wd||stn)tex(x,y,w,h,1,DK);if(!br)return;for(let k=0;gy-8*k>y;k++){const yb=gy-8*k,yt=Math.max(y,yb-8);if(k)mo(x,yb,w,.6);vjoin(x,yt,w,yb-yt,k%2?8:0)}};/* 横の側面（地面から8ドットずつ積む） */
  const tread=(x,y,w,h,n,dark,vert)=>{c.fillStyle=P[0];c.fillRect(x,y,w,h);if(wd||stn)tex(x,y,w,h,!vert,null);if(!br)return;if(vert){for(let yy=y+(n%2?8:0);yy<y+h;yy+=16)if(yy>y+.5)mo(x,yy,w,.6)}else vjoin(x,y,w,h,n%2?8:0)};/* 段の上の面：1段に1列（レンガは、段ごとに半分ずらす） */
  const SH1='rgba(50,36,24,.5)',SH2='rgba(60,45,30,0)',HI='rgba(255,252,238,.6)';/* 段のふち：手前のふちに明るい線1ドット、段の奥に濃いかげ1ドット *//* 段のさかい：1ドットのかげと、その外がわにもう1ドットうすいかげ */
  const lat=d===0?[[a-1,a-1+W],[a+1,a+1+W]]:d===2?[[a-1,a-1-W],[a+1,a+1-W]]:null;c.save();
  {const tj=stairTop(a,d);if(tj!=null&&tj>=0&&hiAt(tj)>=CLV){const Q=new Path2D(),E=new Path2D();Q.rect(ax-3*TS,ay-3*TS,7*TS,7*TS);cliffTop(Q,E,(tj/W)|0,tj%W);c.clip(Q,'evenodd')}}/* のぼった先の高いマスの上の面（でこぼこのふち）には、階段をかぶせない */
  if(SLOPES.has(id)){/* 坂：段のない、ひとつづきの面（素材のもようは、下りる向きに6つ） */const mat=id.slice(6),X0=d===1?ax:d===3?ax-TS:ax,len=d===0?TS:2*TS,poly=pts=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const q of pts)c.lineTo(q[0],q[1]);c.closePath()};
    const surf=(x,y,w,h,along)=>{c.save();c.translate(0,-LIFT);c.fillStyle=slopeTex(a,d)||P[0];c.fillRect(x,y+LIFT,w,h);c.restore();/* もようは、のぼった先の上の面と同じ位置（上の面は下絵を LIFT 上にずらして描く） */const hi=d===0||d===1,L0=along?w:h,g=c.createLinearGradient(along?(hi?x:x+w):0,along?0:(hi?y:y+h),along?(hi?x+w:x):0,along?0:(hi?y+h:y));g.addColorStop(0,'rgba(60,45,30,0)');g.addColorStop(Math.min(1,14/L0),'rgba(60,45,30,.10)');g.addColorStop(1,'rgba(60,45,30,.16)');/* のぼった先からなめらかに少し暗く（坂の終わりがわかる） */c.fillStyle=g;c.fillRect(x,y,w,h);if(mat==='earth')return;
      const N=mat==='stone'?3:6,L='rgba(60,45,30,.18)';for(let k=1;k<N;k++){c.fillStyle=br?MO:L;if(along)c.fillRect(x+w*k/N,y,.7,h);else c.fillRect(x,y+h*k/N,w,.7)}/* 下りる向きに、板・石・レンガの列 */
      if(mat!=='wood')for(let k=0;k<N;k++){const off=k%2?8:0;if(along){for(let yy=Math.floor((y-off)/16)*16+off;yy<y+h;yy+=16)if(yy>y)mo(x+w*k/N,yy,w/N,.6)}else vjoin(x,y+h*k/N,w,h/N,off)}};/* 石・レンガの目地 */
    if(vnat){c.save();sPath();c.clip();surf(ax-3,sTop,TS+6,sBot-sTop,0);c.restore()}
    else if(d===0){surf(ax,ay-LIFT,TS,TS+LIFT,0)}
    else if(d===2){surf(ax,ay-TS,TS,2*TS-LIFT,0)}
    else{const xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,gy=ay+TS;c.save();poly([[xi,ay-LIFT],[xo,ay],[xo,gy],[xi,gy-LIFT]]);c.clip();surf(X0,ay-LIFT,len,TS+LIFT,1);c.restore();c.save();poly([[xi,gy-LIFT],[xo,gy],[xi,gy]]);c.clip();slopeCliff(c,X0,gy-TS,len);c.restore()}}/* 横向き：上の面と、手前の三角の側面（がけの岩の絵） */
  else if(d===0){/* 手前へ下りる：段の上の面と、手前の面 */riser(ax,ay-LIFT,TS,LIFT-z(0)+.5,1);for(let n=0;n<SN;n++){const ya=ay+n*Dn,yb=ya+Dn;tread(ax,ya-z(n),TS,Dn+.5,n,0,0);if(!SLOPES.has(id)){c.fillStyle=SH1;c.fillRect(ax,ya-z(n),TS,1);c.fillStyle=HI;c.fillRect(ax,yb-z(n)-1,TS,1)}riser(ax,yb-z(n),TS,z(n)-z(n+1)+.5,n)}}
  else if(d===2){/* 奥へ下りる：手前の段ほど高い。向こうの段から描いて、手前の段でかくす */const Y1=ay+TS;for(let n=SN-1;n>=0;n--){const yb=Y1-n*Dn,ya=yb-Dn;const t0=ya-z(n);tread(ax,t0,TS,Dn+.5,n,1,0);if(n<SN-1){c.fillStyle=SH1;c.fillRect(ax,t0-1,TS,1)}c.fillStyle=HI;c.fillRect(ax,t0,TS,1)}}/* 段のさかい：手前の段のふちの上（おくの段）に、かげ2ドット */
  else{/* 横へ下りる：おくの側板（うしろなので先に）→ 段の上の面・段の正面（けこみ）→ 手前の側板 */const X0=d===1?ax:ax-TS,o=stairOut(a,d),xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,zb=f=>LIFT*(1-f)+(SLOPES.has(id)?2:5)/* 階段の側板は、段より5ドット上まで（坂は2） */;let bkN=0;
    if([a-W,o-W].every(k=>{const t=typeAt(k);return !(hiAt(k)>=CLV||HOME_WALLS.has(t)||HOME_DOORS.has(t)||FENCE_IDS.has(t))})){c.beginPath();c.moveTo(xi,ay-zb(0));c.lineTo(xo,ay-zb(1));c.lineTo(xo,ay+TS);c.lineTo(xi,ay+TS);c.closePath();c.fillStyle=P[1];c.fill();c.beginPath();c.moveTo(xi,ay-zb(0));c.lineTo(xo,ay-zb(1));c.lineTo(xo,ay+3-zb(1));c.lineTo(xi,ay+3-zb(0));c.closePath();c.fillStyle=P[0];c.fill();c.beginPath();c.moveTo(xi,ay+3-zb(0));c.lineTo(xo,ay+3-zb(1));c.lineTo(xo,ay+4-zb(1));c.lineTo(xi,ay+4-zb(0));c.closePath();c.fillStyle='rgba(60,45,30,.18)';c.fill();bkN=1}/* 上の面と側面のさかいに、うすいかげ1ドット *//* おくの側板（上の面と、手前に向いた面）：段より奥なので、段の前に描く（段のぎざぎざが見える） */
    for(let n=0;n<SN;n++){const x=d===1?X0+n*Dn:X0+2*TS-(n+1)*Dn,zz=z(n),gy=ay+TS;tread(x,ay-zz,Dn+.5,TS,n,1,1);face(x,gy-zz,Dn+.5,zz,gy);if(bkN){c.fillStyle=SH1;c.fillRect(x,ay-zz,Dn+.5,1);c.fillStyle=SH2;c.fillRect(x,ay-zz+1,Dn+.5,1)}/* おくの側板に接するふちのかげ */
      if(n){const RW=3,rx=d===1?x:x+Dn-RW,sx=d===1?x+RW:x+Dn-RW-1,dx=d===1?1:-1;c.fillStyle=P[1];c.fillRect(rx,ay-zz,RW,TS);if(br){c.fillStyle=MO;for(let yy=ay-zz+8;yy<ay-zz+TS;yy+=8)c.fillRect(rx,yy,RW,.6)}c.fillStyle=SH1;c.fillRect(sx,ay-zz,1,TS);c.fillStyle=SH2;c.fillRect(sx+dx,ay-zz,1,TS);c.fillStyle=HI;c.fillRect(d===1?x-1:x+Dn,ay-z(n-1),1,TS)}}}/* 段のさかい：高い段の正面（けこみ、3ドット）・そのとなりにかげ2ドット・高い段のふちを明るく */
  {const o=d?stairOut(a,d):-1,cl=k=>{const t=typeAt(k);return hiAt(k)>=CLV||HOME_WALLS.has(t)||HOME_DOORS.has(t)||FENCE_IDS.has(t)},free=ks=>ks.every(k=>k>=0&&!cl(k)),BW=3;
  if(SLOPES.has(id)){/* 坂の横：板ではなく、がけの横の岩（横に壁・柵・がけがないがわだけ。段差にうまった坂は、横ががけなので描かない） */const tj=stairTop(a,d),dz=REV.has(tj)?'':'~d',C=window.CHIPS||{},wedge=(pts,k,x,ys)=>{const ch=C[k];if(!ch)return;c.save();c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const q of pts)c.lineTo(q[0],q[1]);c.closePath();c.clip();if(vnat){const sd=k.includes('sideR')?1:0,xo=sd?ax+TS+12:ax-12;c.beginPath();c.moveTo(xo,sTop);for(let y=sTop;y<=sBot;y++)c.lineTo(eX(y,sd),y);c.lineTo(xo,sBot);c.closePath();c.clip()}/* でこぼこのふちの外がわだけに岩 */for(const y of ys)drawChip(c,ch,'cliff',x,y,0);c.restore()};
    if(d===0||d===2){const yt=d===0?ay-LIFT:ay+TS-LIFT,yb=d===0?ay+TS:ay-TS,ys=d===0?[ay-TS+LIFT,ay,ay+TS]:[ay-TS,ay,ay+TS],fl=d===0?[a-1]:[a-1,o-1],fr=d===0?[a+1]:[a+1,o+1];
      if(free(fl))wedge([[ax-3,yt],[ax+.5,yt],[ax+.5,yb]],'cliff:sideL'+dz,ax,ys);
      if(free(fr))wedge([[ax+TS+3,yt],[ax+TS-.5,yt],[ax+TS-.5,yb]],'cliff:sideR'+dz,ax,ys)}
    {/* 坂の面のふち：がけの上の面と同じ（ふちの帯・内がわのかげ・草地ははみ出す草）。ふちのある道（石畳・レンガ道）は、道と同じへり */
      const f=S.floor[tj]||'',rd=f==='stone'||f==='brick'?f:'',gr=!f&&REV.has(tj),lat=d===1||d===3,xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,k=lat?LIFT/(xo-xi):0;
      const x0=lat?Math.min(xi,xo):ax,x1=lat?Math.max(xi,xo):ax+TS,y0=d===0?ay-LIFT:d===2?ay-TS:ay-LIFT,y1=d===0?ay+TS:d===2?ay+TS-LIFT:ay+TS-LIFT;/* 坂の面（横向きは、ななめの面をまっすぐにのばした形で） */
      const sideF=lat?[free([a-W,o-W]),free([a+W,o+W])]:d===0?[free([a-1]),free([a+1])]:[free([a-1,o-1]),free([a+1,o+1])];
      c.save();if(lat)c.transform(1,k,0,1,0,-k*xi);c.beginPath();if(vnat)sPath();else c.rect(x0,y0,x1-x0,y1-y0);c.clip();
      if(rd){const ch=C[rd+(lat?':3':':12')];if(ch){c.save();c.beginPath();c.rect(x0,y0,x1-x0,y1-y0);c.clip();if(lat)for(let x=x0-TS;x<x1+TS;x+=TS)drawChip(c,ch,rd,x,y0,0);else for(let y=y0-TS;y<y1;y+=TS)drawChip(c,ch,rd,x0,y,0);c.restore()}}/* へりは、道と同じ位置のまま、外の2ドットを切る（道も、つながっていないがわは2ドット内がわで切ってある） *//* へりの石・レンガ（よこ向きは上下、たて向きは左右） */
      else{const col=gr?'rgba(92,134,58,.5)':'rgba(110,78,46,.26)',B=2.2,ed=lat?[[x0,y0,x1-x0,B,0,1],[x0,y1-B,x1-x0,B,0,-1]]:[[x0,y0,B,y1-y0,1,0],[x1-B,y0,B,y1-y0,-1,0]];
        if(vnat){for(let y=y0;y<y1;y++)for(const sd of[0,1]){if(!sideF[sd])continue;const e=eX(y+.5,sd),dir=sd?-1:1;c.fillStyle=col;c.fillRect(sd?e-B:e,y,B,1);for(let q=0;q<3;q++){c.fillStyle='rgba(45,35,20,'+(.12-q*.04)+')';c.fillRect(sd?e-B-1-q:e+B+q,y,1,1)}}}/* でこぼこのふちにそって、帯とかげ */else ed.forEach(([x,y,w,h,dx,dy],n)=>{if(!sideF[n])return;c.fillStyle=col;c.fillRect(x,y,w,h);const g=dx?c.createLinearGradient(dx>0?x+B:x,0,dx>0?x+B+3:x-3,0):c.createLinearGradient(0,dy>0?y+B:y,0,dy>0?y+B+3:y-3);g.addColorStop(0,'rgba(45,35,20,.14)');g.addColorStop(1,'rgba(45,35,20,0)');c.fillStyle=g;if(dx)c.fillRect(dx>0?x+B:x-3,y,3,h);else c.fillRect(x,dy>0?y+B:y-3,w,3)})}/* 内がわのかげは3ドットでぼかす */
      c.restore();
      if(gr&&!rd){c.save();if(lat)c.transform(1,k,0,1,0,-k*xi);const hz=n=>hash(a*977+n*131),bl=(x,yy,dx,dy,n)=>{const len=1+hz(n)*1.6,w=.9+hz(n+90)*.8;c.fillStyle=CGR[(hz(n+7)*CGR.length)|0];c.beginPath();c.moveTo(x-dy*w,yy-dx*w);c.lineTo(x+dy*w,yy+dx*w);c.lineTo(x+dx*len,yy+dy*len);c.closePath();c.fill()};
        if(lat){if(sideF[0])for(let v=.8;v<x1-x0;v+=1.3)bl(x0+v,y0+.6,0,-1,(v*10)|0);if(sideF[1])for(let v=.8;v<x1-x0;v+=1.3)bl(x0+v,y1-.6,0,1,((v*10)|0)+1000)}
        else{if(sideF[0])for(let v=.8;v<y1-y0;v+=1.3)bl((vnat?eX(y0+v,0):x0)+.6,y0+v,-1,0,((v*10)|0)+2000);if(sideF[1])for(let v=.8;v<y1-y0;v+=1.3)bl((vnat?eX(y0+v,1):x1)-.6,y0+v,1,0,((v*10)|0)+3000)}c.restore()}/* 草地は、ふちから外へ短い草 */
    }}
  else{
    const band=(x,y0,y1)=>{c.fillStyle=P[1];c.fillRect(x,y0,BW,y1-y0);c.fillStyle='rgba(255,250,235,.3)';c.fillRect(x,y0,1,y1-y0);const ins=x<ax+TS/2?1:-1,ix=ins>0?x+BW:x-1;c.fillStyle=SH1;c.fillRect(ix,y0,1,y1-y0);c.fillStyle=SH2;c.fillRect(ix+ins,y0,1,y1-y0)};/* 側板と、板に接する面（段・坂）のかげ2ドット */
    if(d===0){if(free([a-1]))band(ax,ay-LIFT-2,ay+TS);if(free([a+1]))band(ax+TS-BW,ay-LIFT-2,ay+TS)}
    else if(d===2){if(free([a-1,o-1]))band(ax,ay-TS-2,ay+TS-LIFT);if(free([a+1,o+1]))band(ax+TS-BW,ay-TS-2,ay+TS-LIFT)}
    else{const xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,zb=f=>LIFT*(1-f)+(SLOPES.has(id)?2:5)/* 階段の側板は、段より5ドット上まで（坂は2） */,poly=pts=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const q of pts)c.lineTo(q[0],q[1]);c.closePath()};
      if(SLOPES.has(id)&&free([a-W,o-W])){poly([[xi,ay-zb(0)],[xo,ay-zb(1)],[xo,ay+BW-zb(1)],[xi,ay+BW-zb(0)]]);c.fillStyle=P[1];c.fill()}/* 階段のおくの側板は、段の前に描いてある */
      if(free([a+W,o+W])){const gy=ay+TS;for(const[k,col]of[[1,SH1],[2,SH2]]){poly([[xi,gy-BW-zb(0)-k],[xo,gy-BW-zb(1)-k],[xo,gy-BW-zb(1)-k+1],[xi,gy-BW-zb(0)-k+1]]);c.fillStyle=col;c.fill()}/* 手前の側板に接する面のかげ2ドット */c.save();poly([[xi,gy-zb(0)],[xo,gy-zb(1)],[xo,gy],[xi,gy]]);c.clip();face(Math.min(xi,xo),gy-LIFT-6,2*TS,LIFT+6,gy);c.restore();poly([[xi,gy-BW-zb(0)],[xo,gy-BW-zb(1)],[xo,gy-zb(1)],[xi,gy-zb(0)]]);c.fillStyle=P[0];c.fill()}}}}/* 側板：段にそわない、まっすぐななめの板 */
  c.restore();if(SLOPES.has(id))slopeFeather(c,a,d);if(lat){for(const k of lat[0])if(hiAt(k)>=CLV)cliffEdgeOver(c,k,1);for(const k of lat[1])if(hiAt(k)>=CLV)cliffEdgeOver(c,k,0)}}/* 左右ががけなら、階段を描いたあとに、がけの横のはし（横の岩・丸いはし）をもう一度上に描く（切りとらない） */
const CLC={n:-1,s:null,rows:null};
function cliffRuns(){if(CLC.n===STATN&&CLC.s===S&&CLC.rows)return CLC.rows;/* 行ごと・段ごとの、つづいた高いマスのかたまり（高さが変わったときだけ作りなおす） */
  const hs=S.hi?Array.from(S.hi,v=>v|0).join(''):'';CLC.n=STATN;STDIRTY=null;if(CLC.rows&&CLC.s===S&&CLC.hs===hs)return CLC.rows;CLC.s=S;CLC.hs=hs;const rows=new Map();
  for(let y=0;y<H;y++)for(let lv=1;lv<=HMAX;lv++){let x=0;while(x<W){if(hiAt(y*W+x)<lv){x++;continue}let e=x;while(e+1<W&&hiAt(y*W+e+1)>=lv)e++;if(!rows.has(y))rows.set(y,[]);rows.get(y).push({x0:x,x1:e,lv});x=e+1}}/* 低い段から順に（高い段は、あとで上に描く） */
  return CLC.rows=rows}
function cliffTop(P,E,y,k,ext){ext=ext||.6;/* 高いマスの上の面の形：ふち（となりが低い向き）は少しでこぼこ、外がわの角は丸く。P：面（ぬる形）、E：ふちの線 */
  const j=y*W+k,px=k*TS,x1=px+TS,y0=y*TS-LIFT,y1=y0+TS,r=5,nz=(a,b)=>(hash(a*131+b*7919+17)-.5)*2;
  const U=!(y>0&&topAt(j-W)),D=!(y<H-1&&topAt(j+W)),L=!(k>0&&topAt(j-1)),R=!(k<W-1&&topAt(j+1));
  const yN=x=>U?y0+.3+nz(x,y*2)*.5:y0-ext,yS=x=>D?y1+1.6+nz(x,y*2+1)*.8:y1+ext,xW=v=>L?px-2+nz(k*2,v)*.4:px-ext,xE=v=>R?x1+2+nz(k*2+1,v)*.4:x1+ext;/* 横のふちは、マスのさかいより少しだけ外（横の岩とのあいだに、下の地面が見えないように） *//* ふちは、マスのさかい（横の岩は、その外にはみ出す） */
  const TL=U&&L,TR=U&&R,BR=false,BL=false,st=[];/* 手前の角は丸めない（下のがけの正面の丸いはしにつづく） */for(let v=0;v<=TS;v+=4)st.push(v);
  const N=st.filter(v=>v>=(TL?r:0)&&v<=TS-(TR?r:0)).map(v=>[px+v,yN(px+v)]),Ea=st.filter(v=>v>=(TR?r:0)&&v<=TS-(BR?r:0)).map(v=>[xE(y0+v),y0+v]),
    So=st.filter(v=>v>=(BL?r:0)&&v<=TS-(BR?r:0)).reverse().map(v=>[px+v,yS(px+v)]),Wd=st.filter(v=>v>=(TL?r:0)&&v<=TS-(BL?r:0)).reverse().map(v=>[xW(y0+v),y0+v]);
  const side=[[N,U,TR,[xE(y0),yN(x1)]],[Ea,R,BR,[xE(y1),yS(x1)]],[So,D,BL,[xW(y1),yS(px)]],[Wd,L,TL,[xW(y0),yN(px)]]];
  P.moveTo(N[0][0],N[0][1]);
  const inner=[!U&&!R&&!(y>0&&k<W-1&&topAt(j-W+1))?[x1,y0]:null,!R&&!D&&!(y<H-1&&k<W-1&&topAt(j+W+1))?[x1,y1]:null,!D&&!L&&!(y<H-1&&k>0&&topAt(j+W-1))?[px,y1]:null,!L&&!U&&!(y>0&&k>0&&topAt(j-W-1))?[px,y0]:null];/* 入隅（となり2つは高く、ななめが低い角）は、外へのばさず、角でまっすぐ折る（となりのマスのふちの帯をけずらないように） */
  side.forEach(([pts,ex,rc,cp],n)=>{for(const p of pts)P.lineTo(p[0],p[1]);const nx=side[(n+1)%4][0][0];if(inner[n])P.lineTo(inner[n][0],inner[n][1]);if(rc)P.quadraticCurveTo(cp[0],cp[1],nx[0],nx[1]);else P.lineTo(nx[0],nx[1]);
    if(ex){E.moveTo(pts[0][0],pts[0][1]);for(const p of pts)E.lineTo(p[0],p[1]);if(rc)E.quadraticCurveTo(cp[0],cp[1],nx[0],nx[1])}});
  P.closePath()}
const CGR=['#567935','#5f8240','#6a8f45','#76994b','#4f6f30'];/* 草のはみ出し：もらった段差の絵のふちの草の明るさの差を、ゲームの草の色にあてた色 */
function cliffRim(g,P,y,k,grass){/* 上の面のふちの帯（もらった段差の絵と同じ：ふちに こい色の帯、内がわは四角いでこぼこ）。草地はこい緑、地面はこい土色 */
  const j=y*W+k,px=k*TS,x1=px+TS,y0=y*TS-LIFT,y1=y0+TS,U=!(y>0&&topAt(j-W)),D=!(y<H-1&&topAt(j+W)),L=!(k>0&&topAt(j-1)),R=!(k<W-1&&topAt(j+1)),hz=n=>hash(j*613+n*97),b=2.2;
  g.save();g.clip(P);g.fillStyle=grass?'rgba(92,134,58,.5)':'rgba(110,78,46,.26)';
  if(U){g.fillRect(px,y0-1,TS,b+1);for(let x=px;x<x1;x+=2.6)if(hz(x)<.55)g.fillRect(x,y0+b,1.8,.8+hz(x+9)*1.3)}
  if(L){g.fillRect(px-1,y0,b+1,TS+2);for(let v=y0;v<y1;v+=2.6)if(hz(v)<.55)g.fillRect(px+b,v,.8+hz(v+9)*1.3,1.8)}
  if(R){g.fillRect(x1-b,y0,b+1,TS+2);for(let v=y0;v<y1;v+=2.6)if(hz(v+500)<.55){const w=.8+hz(v+509)*1.3;g.fillRect(x1-b-w,v,w,1.8)}}
  if(D){g.fillRect(px,y1-1.2,TS,4);for(let x=px;x<x1;x+=2.6)if(hz(x+900)<.55){const h=.8+hz(x+909)*1.3;g.fillRect(x,y1-1.2-h,1.8,h)}}
  g.restore()}
function cliffGrass(g,y,k){/* 草のはみ出し：となりが低い向きのふちに、短い草の葉を外向きに。正面の上は、がけに少したれる */
  const j=y*W+k,px=k*TS,y0=y*TS-LIFT,y1=y0+TS,U=!(y>0&&topAt(j-W)),D=!(y<H-1&&topAt(j+W)),L=!(k>0&&topAt(j-1)),R=!(k<W-1&&topAt(j+1)),hz=n=>hash(j*977+n*131);
  const blade=(x,yy,dx,dy,n)=>{const sh=dy>0,len=sh?2.6+hz(n)*3.4:1+hz(n)*1.6,lean=(hz(n+50)-.5)*(sh?2.6:1.2),w=.9+hz(n+90)*.8;/* 手前は長くたれる・ほかは短く */g.fillStyle=CGR[(hz(n+7)*CGR.length)|0];g.beginPath();g.moveTo(x-dy*w,yy-dx*w);g.lineTo(x+dy*w,yy+dx*w);g.lineTo(x+dx*len+dy*lean,yy+dy*len+dx*lean);g.closePath();g.fill()};
  for(let v=.8;v<TS;v+=1.3){const n=(v*10)|0;
    if(U&&!(L&&v<5)&&!(R&&v>TS-5))blade(px+v,y0+1.2,0,-1,n);
    if(D&&!(L&&v<5)&&!(R&&v>TS-5))blade(px+v,y1+.8,0,1,n+1000);
    if(L&&!(U&&v<5)&&!(D&&v>TS-5))blade(px+.6,y0+v,-1,0,n+2000);
    if(R&&!(U&&v<5)&&!(D&&v>TS-5))blade(px+TS-.6,y0+v,1,0,n+3000)}}
let RFN=0;
const DOTT={};function dotPat(g,K){/* 段差のふちの帯の点々（104ドットごとにくりかえすもよう。1まいだけ作っておく） */let e=DOTT[K];if(!e){const N=40,T=N*2.6;e=DOTT[K]=document.createElement('canvas');e.width=e.height=Math.round(T*K);const c=e.getContext('2d');c.scale(K,K);c.fillStyle='#000';for(let i=0;i<N;i++)for(let j=0;j<N;j++){const q=hash(i*131+j*7919+3);if(q<.5)c.fillRect(i*2.6,j*2.6,1.8,.8+q*2.6)}}const p=g.createPattern(e,'repeat');if(p.setTransform)p.setTransform(new DOMMatrix().scale(1/K));return p}
function softOf(m,b){/* ぼかし（軽い作り方）：小さくして、なめらかに大きくもどす。b：ちぢめる倍率 */const t=TMPC();t.width=Math.max(1,Math.ceil(m.width/b));t.height=Math.max(1,Math.ceil(m.height/b));const c=t.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(m,0,0,t.width,t.height);return t}
const TMPL=[],TMPC=()=>{const c=document.createElement('canvas');TMPL.push(c);return c};/* 作業用のキャンバス：使いおわったら、すぐ手ばなす（iPhone は、キャンバスのメモリの上限が小さく、こえるとページが落ちる） */
function cliffPart0(y,Rn,K,k0,ext,lowC){/* 段差の部品（1マスぶん）の絵を作る：まわりのマスをまねた小さな場所で、そのマスの行のかたまり（両どなり）を描き、まん中のマスの所だけを使う。A：がけ（横の岩・正面）とそのかげ（上の面より下）。B：上の面のふちの帯・かげ・明るさ・はみ出す草（上の面より上）。上の面の地面そのものは、毎コマ、地面の下絵からずらして描く */
  const x0=Rn.x0,x1=Rn.x1,w=(x1-x0+1)*TS,ox=x0*TS-8,top=y*TS-LIFT-6,h=CPH,cv=TMPC();cv.width=(w+16)*K;cv.height=h*K;
  let g=cv.getContext('2d'),T0=[K,0,0,K,-ox*K,-top*K];g.setTransform(...T0);const C=window.CHIPS||{},dc=(k,px,py)=>{const ch=C[k];if(ch)drawChip(g,ch,'cliff',px,py,0)};
  const fc=TMPC();fc.width=cv.width;fc.height=cv.height;const f=fc.getContext('2d');f.setTransform(...T0);let miss=false;const fd=(k,px,py)=>{const ch=C[k];if(ch&&!drawChip(f,ch,'cliff',px,py,0))miss=true};/* がけ（階段・横の岩・正面）は、いったん別のキャンバスに描いて、その形でかげを作る。絵がまだ読みこみ中なら miss */
  for(let k=x0;k<=x1;k++){const j=y*W+k,L=k>0&&topAt(j-1),R=k<W-1&&topAt(j+1),D=y<H-1&&topAt(j+W),px=k*TS,py=y*TS;
    {const U=y>0&&topAt(j-W);if(!L||!R){f.save();f.beginPath();f.rect(px-8,py-LIFT+(U?0:5),TS+16,TS);f.clip();{const dz=REV.has(j)?'':'~d';if(!L)fd('cliff:sideL'+dz,px,py);if(!R)fd('cliff:sideR'+dz,px,py)}/* 上が乾いた地面なら、ふちに草のない横の岩 */f.restore()}/* 横の岩（マスの外へはみ出す。上の角の丸みより下から） */}
    if(!D){const fk='cliff:'+(!L&&!R?'faceLR':!L?'faceL':!R?'faceR':'face');if(ext)fd(fk,px,py+8);/* 下にもう1だんがけがつづくときは、岩を下へのばして、すきまをうめる */fd(fk,px,py)}}
  {const sc=TMPC();sc.width=fc.width;sc.height=fc.height;const c=sc.getContext('2d');c.drawImage(fc,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#000';c.fillRect(0,0,sc.width,sc.height);g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=.3;g.imageSmoothingEnabled=true;g.drawImage(softOf(sc,Math.round(4*K)),0,3*K,sc.width,sc.height);g.restore()}/* がけのかげ：がけの形を、下へ3ドットずらしてぼかす（filter の blur は重いので、小さくして大きくもどす softOf） */
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(fc,0,0);g.restore();


  const A=g;const bc=TMPC();bc.width=cv.width;bc.height=cv.height;g=bc.getContext('2d');g.setTransform(...T0);
  const P=new Path2D(),E=new Path2D();for(let k=x0;k<=x1;k++)cliffTop(P,E,y,k);
  {const px=k0*TS,y0=y*TS-LIFT,j0=y*W+k0,oL=!topAt(j0-1),oR=!topAt(j0+1),oD=!topAt(j0+W);g.save();g.beginPath();g.rect(px-(oL?2:0),y0,TS+(oL?2:0)+(oR?2:0),TS+(oD?2:0));g.clip();const q=TMPC();q.width=cv.width;q.height=cv.height;const c=q.getContext('2d');c.setTransform(...T0);c.fillStyle=lowC;c.fillRect(px-2,y0,TS+4,TS+2);c.globalCompositeOperation='destination-out';c.fill(P);g.setTransform(1,0,0,1,0,0);g.drawImage(q,0,0);g.restore()}
  {const px=k0*TS,y0=y*TS-LIFT,j0=y*W+k0;g.save();g.clip(P);g.fillStyle=lowC;if(!topAt(j0-1))g.fillRect(px-3,y0,3,TS);if(!topAt(j0+1))g.fillRect(px+TS,y0,3,TS);if(!topAt(j0+W))g.fillRect(px-3,y0+TS,TS+6,3);g.restore()}/* ふちのはみ出し（上の面の形の、マスの外の所）は、上の面の地面の色でぬる（毎コマ、はしの1ドットをのばして描かなくてよいように） *//* 上の面の外（丸い角・でこぼこの外）は、下の低い地面の色（上の面の地面は四角く描くので、そこをかくす） */
  {/* ふちの帯とかげは、上の面ぜんたいの形から作る（マスごとに描くと、角・内がわの角で形がずれる） */
    const mk=f2=>{const m=TMPC();m.width=cv.width;m.height=cv.height;const c=m.getContext('2d');c.setTransform(...T0);f2(c);c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';return m},er=(m,r)=>{const e=TMPC();e.width=m.width;e.height=m.height;const c=e.getContext('2d');c.drawImage(m,0,0);c.globalCompositeOperation='destination-in';for(let a=0;a<8;a++)c.drawImage(m,Math.round(Math.cos(a*Math.PI/4)*r),Math.round(Math.sin(a*Math.PI/4)*r));return e};
    const Pm=new Path2D(),Em=new Path2D();for(let k=x0;k<=x1;k++)cliffTop(Pm,Em,y,k,9);/* つながっている向きは、外へ大きくのばす（そこに帯ができないように） */
    const M=mk(c=>{c.fillStyle='#000';c.fill(Pm);});
    const E1=er(M,2.2*K),E2=er(M,3.8*K);
    const B=mk(c=>{c.fillStyle=dotPat(c,K);for(let k=x0;k<=x1;k++){if(!REV.has(y*W+k))continue;/* 乾いた地面のふちには、点々を出さない */const a=k===x0?ox:k*TS,b=k===x1?ox+w+16:(k+1)*TS;c.fillRect(a,top,b-a,h)}});/* 帯の内がわの、四角いでこぼこ（草地だけ）。点々は、前もって作ったもよう（世界の座標でしきつめる） */
    const band=mk(c=>{});{const c=band.getContext('2d');c.drawImage(E1,0,0);c.globalCompositeOperation='destination-out';c.drawImage(E2,0,0);c.globalCompositeOperation='destination-in';c.drawImage(B,0,0)}
    const col=mk(c=>{for(let k=x0;k<=x1;k++){c.fillStyle=REV.has(y*W+k)?'rgba(92,134,58,.5)':'rgba(110,78,46,.26)';c.fillRect(k*TS-(k===x0?8:0),top,TS+(k===x0?8:0)+(k===x1?8:0),h)}});
    const rim=mk(c=>{});{const c=rim.getContext('2d');c.drawImage(M,0,0);c.globalCompositeOperation='destination-out';c.drawImage(E1,0,0);c.globalCompositeOperation='source-over';c.drawImage(band,0,0);c.globalCompositeOperation='source-in';c.drawImage(col,0,0)}
    const sh=mk(c=>{});{const c=sh.getContext('2d');c.drawImage(M,0,0);c.globalCompositeOperation='source-in';c.fillStyle='rgba(45,35,20,.16)';c.fillRect(0,0,sh.width,sh.height);c.globalCompositeOperation='destination-out';c.drawImage(softOf(E1,Math.round(4.8*K)),0,0,E1.width,E1.height)}
    g.save();g.clip(P);g.setTransform(1,0,0,1,0,0);g.drawImage(sh,0,0);g.drawImage(rim,0,0);g.restore()}/* ふちに向かって少し暗くなる丸み（ぼかし）と、ふちの帯 */
  if(Rn.gb)for(let k=x0;k<=x1;k++)cliffGrass(g,y,k);/* もっと高いマスの草は、この段のふちには出さない（上の段の草が、がけのとちゅうにたれないように） *//* 上が草地なら、ふちから草がはみ出す（手前は、がけにたれる） */
  return {a:cv,b:bc,miss}}
let CPRE=null;const cliffChipsOK=()=>{const C=window.CHIPS||{};return ['cliff:face','cliff:faceL','cliff:faceR','cliff:faceLR','cliff:sideL','cliff:sideR'].every(k=>!C[k]||chipImgs(C[k],'cliff')[0].ok)};/* 段差の部品を先に作るのは、がけの絵が読みこまれてから */
const CPH=TS+LIFT+22,CPART=new Map();/* 段差の部品の絵（1マスぶん）。組み合わせと細かさ（大きく見るとき2倍・ちぢめたとき1倍）ごとに、はじめて使うときに1回だけ作って、とっておく（作りなおさない） */
let GLOD=false,CLOW=null;function cliffLowC(g){/* 地面の色のならし（草地・乾いた地面）：上の面の丸い角の外・ふちのはみ出しにぬる。地面の下絵から1回だけはかる */if(!CLOW||CLOW.s!==S){CLOW={s:S,c:{}};const t=document.createElement('canvas');t.width=t.height=1;const c=t.getContext('2d',{willReadFrequently:true});for(const gg of [1,0]){let r=0,gr=0,b=0,n=0;for(let i=0;i<4000&&n<40;i++){const j=(Math.random()*W*H)|0;if(S.ground[j]!==0||S.floor[j]||S.obj[j]||hiAt(j)||REV.has(j)!==!!gg)continue;const q=GRD.c.get((((j/W)|0)>>4)*64+((j%W)>>4));if(!q||!q.l)continue;/* できている区画（半分の絵）だけから */c.clearRect(0,0,1,1);gblit(c,(j%W)*TS,((j/W)|0)*TS,TS,TS,0,0,1,1,true);const d=c.getImageData(0,0,1,1).data;r+=d[0];gr+=d[1];b+=d[2];n++}CLOW.c[gg]=n?`rgb(${r/n|0},${gr/n|0},${b/n|0})`:(gg?'#8fb15a':'#b3a37c')}t.width=t.height=0}return CLOW.c[g?1:0]}
function cliffKey(k,y,lv){/* マスの段差の部品の組み合わせ：上下左右（低い＝ふちがある）・ななめ（となりの高いマスのつながり）・下へもう1だん・草地・草のはみ出し・2しゅるいのばらつき */const j=y*W+k,h=(dx,dy)=>{const x=k+dx,yy=y+dy;return x>=0&&yy>=0&&x<W&&yy<H&&hiAt(yy*W+x)>=lv};
  const oU=!h(0,-1),oD=!h(0,1),oL=!h(-1,0),oR=!h(1,0),tl=!oL&&h(-1,-1),tr=!oR&&h(1,-1),bl=!oL&&h(-1,1),br=!oR&&h(1,1),ext=oD&&lv>1&&y<H-1&&hiAt(j+W)<lv-1,g=REV.has(j),gb=g&&hiAt(j)===lv;
  return (oU?1:0)|(oD?2:0)|(oL?4:0)|(oR?8:0)|(tl?16:0)|(tr?32:0)|(bl?64:0)|(br?128:0)|(ext?256:0)|(g?512:0)|(gb?1024:0)|((hash(j*7+3)*2|0)<<11)}
const ATL={p:[],x:0,y:0,h:0};/* 段差の部品のアトラス：1024×1024 の大きな絵に、部品をならべて入れる（小さな絵をたくさん持たない。描くときは、大きな絵の一部を描く） */
function atlasPut(w,h){let P=ATL.p[ATL.p.length-1];if(P&&ATL.x+w>1024){ATL.x=0;ATL.y+=ATL.h+1;ATL.h=0}if(!P||ATL.y+h>1024){const c=document.createElement('canvas');c.width=c.height=1024;P={c,g:c.getContext('2d')};ATL.p.push(P);ATL.x=ATL.y=ATL.h=0}const r={c:P.c,g:P.g,x:ATL.x,y:ATL.y};ATL.x+=w+1;ATL.h=Math.max(ATL.h,h);return r}
function atlasClear(){for(const P of ATL.p)P.c.width=P.c.height=0;ATL.p=[];ATL.x=ATL.y=ATL.h=0}
function cliffPart(key,K){if(CPART.s!==S){CPART.clear();atlasClear();CPART.s=S}/* ステージ（セーブ）がかわったら、部品を作りなおす（地面の色がちがう） */const ck=key*4+K;let P=CPART.get(ck);if(P&&!(P.miss&&performance.now()-P.t>300))return P;/* 絵が読みこみ中で作れなかった部品は、0.3秒ごとに作りなおす */
  const oU=key&1,oD=key&2,oL=key&4,oR=key&8,bit=(n)=>!!(key&n),k0=20,y0=20+((key>>11)&1)*3,cv=CLV,R0=REV;
  const hi=(dx,dy)=>{if(!dx&&!dy)return true;const sx=dx<0?-1:dx>0?1:0;if(dy===0)return sx<0?!oL:!oR;if(dy===-1)return sx===0?!oU:sx<0?bit(16):bit(32);if(dy===1)return sx===0?!oD:sx<0?bit(64):bit(128);return false};/* 2マス先は、となりと同じとみる */
  TOPF=j=>hi(j%W-k0,((j/W)|0)-y0);REV={has:()=>!!(key&512)};CLV=1;
  try{const r=cliffPart0(y0,{x0:oL?k0:k0-1,x1:oR?k0:k0+1,gb:!!(key&1024)},K,k0,!!(key&256),cliffLowC(key&512)),sx=((oL?k0:k0-1)*TS-8),cx=(k0*TS-8-sx)*K,w=(TS+16)*K,h=CPH*K;
    const cut=src=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,cx,0,w,h,0,0,w,h);const d=g.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(d[(yy*w+xx)*4+3]){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy}c.width=c.height=0;if(x1<0)return null;const bw=x1-x0+1,bh=y1-y0+1,A=atlasPut(bw,bh);A.g.drawImage(src,cx+x0,y0,bw,bh,A.x,A.y,bw,bh);return {c:A.c,sx:A.x,sy:A.y,x:x0/K,y:y0/K,w:bw/K,h:bh/K}};/* 描いてある所だけに切りつめて、アトラス（大きな絵）に入れる */P={a:cut(r.a),b:cut(r.b),miss:r.miss}}/* 何も描かれていない部品は null（描かない） */
  finally{TOPF=null;REV=R0;CLV=cv;for(const c of TMPL)c.width=c.height=0;TMPL.length=0}
  P.t=performance.now();CPART.set(ck,P);return P}
function cliffPreload(){/* ステージを開くとき：このマップで使う段差の部品を、まとめて作っておく（はじめて見る所で止まらないように） */const RW=cliffRuns(),keys=new Set();for(const[y,L]of RW)for(const R of L)for(let k=R.x0;k<=R.x1;k++)keys.add(cliffKey(k,y,R.lv));for(const K of [2,1])for(const k of keys)cliffPart(k,K)}
function cliffRow(y,R,top){/* 1つのかたまり（行・段）の段差を描く：かげ・がけ（部品A）→ 上の面の地面（地面の下絵をずらす）→ ふち（部品B）。top：うしろが低い所の、上はしだけ（うしろの物の足もとをかくす） */
  const lv=R.lv,dy=(lv-1)*LIFT,oy=y*TS-LIFT-6-dy,keys=[],kz=dpr*cam.z,SX=v=>cam.x+Math.round((v-cam.x)*kz)/kz,SY=v=>cam.y+Math.round((v-cam.y)*kz)/kz,DI=(im,sx,sy,sw,sh,x,y2,w,h)=>{const a=SX(x),b=SY(y2);ctx.drawImage(im,sx,sy,sw,sh,a,b,SX(x+w)-a,SY(y2+h)-b)};/* 部品は、画面のドットのさかいに合わせておく（マスのさかいめに、うすい線やすきまが出ないように） */for(let k=R.x0;k<=R.x1;k++)keys.push(cliffKey(k,y,lv));
  const hh=top?LIFT+6:CPH,ok=k=>!top||!(y>0&&hiAt((y-1)*W+k)>=lv);
  if(!top){const m=i=>(keys[i]&2)&&!(keys[i]&256);let i=0;while(i<keys.length){if(!m(i)){i++;continue}let e=i;while(e+1<keys.length&&m(e+1))e++;const px=(R.x0+i)*TS,w=(e-i+1)*TS,py=y*TS;ctx.save();ctx.translate(0,2*(py+TS)-dy);ctx.scale(1,-1);gblit(ctx,px-6,py+TS,w+12,8,px-6,py+TS,w+12,8,GLOD);ctx.restore();i=e+1}}/* がけの下はしのすきまには、すぐ下の低い地面（下絵を上下に鏡うつし。つづいた所はまとめて1回） */
  const PK=kz>1.5?2:1,part=(L)=>{for(let i=0;i<keys.length;i++){const kk=keys[i],k=R.x0+i;if(!(kk&15)&&L==='a')continue;if(!ok(k))continue;const q=cliffPart(kk,PK)[L];if(!q)continue;const a=Math.max(q.x,(kk&4)?0:8),b=Math.min(q.x+q.w,(kk&8)?TS+16:TS+8),y2=Math.min(q.y+q.h,hh);if(b<=a||y2<=q.y)continue;DI(q.c,q.sx+(a-q.x)*PK,q.sy,(b-a)*PK,(y2-q.y)*PK,k*TS-8+a,oy+q.y,b-a,y2-q.y)}};
  part('a');
  {let k=R.x0;while(k<=R.x1){if(!ok(k)){k++;continue}let e=k;while(e+1<=R.x1&&ok(e+1))e++;const w=(e-k+1)*TS;{const a=SX(k*TS),b=SY(y*TS-lv*LIFT);gblit(ctx,k*TS,y*TS,w,top?LIFT:TS,a,b,SX(k*TS+w)-a,SY(y*TS-lv*LIFT+(top?LIFT:TS))-b,GLOD)}{ctx.fillStyle='rgba(255,250,225,.10)';const a=SX(k*TS),b=SY(y*TS-lv*LIFT);ctx.fillRect(a,b,SX(k*TS+w)-a,SY(y*TS-lv*LIFT+(top?LIFT:TS))-b)}k=e+1}}/* 上の面の地面：地面の下絵を、そのまま上へずらす。高い所は少し明るく */
  part('b')}
const natBarY=j=>((j/W)|0)*TS-(S.obj[j]==='rock'?7:30)-hiAt(j)*LIFT;/* 木・岩の上の、のこりのバーの上はし */
function drawArrowTags(x0,y0,x1,y1){/* 見張り台の上の、木の矢の本数（夜の暗さより上にかく） */
  for(const j of TOWERS){if(S.obj[j]!=='watch')continue;const tx=(j%W)*TS,ty=((j/W)|0)*TS-hiAt(j+W)*LIFT;if(j%W<x0-2||j%W>x1+1||((j/W)|0)<y0-2||((j/W)|0)>y1+3)continue;/* 見張り台の上の、木の矢の本数（せいれいが立つ所より上） */
    const n=S.inv.arrow||0,L=S.hp['L'+j]||1,cx=tx+32,cy=ty-58-(L>1?16:0),t=String(n);ctx.font='9px "PixelMplus10","Hikomi","Hiragino Maru Gothic ProN",sans-serif';const tw=ctx.measureText(t).width,w=tw+19,lx=cx-w/2;
    ctx.fillStyle='rgba(122,86,52,.82)';ctx.fillRect(lx,cy-6,w,12);ctx.fillRect(lx+1,cy-7,w-2,14);ctx.fillStyle='rgba(244,233,210,.9)';ctx.fillRect(lx+1,cy-5,w-2,10);ctx.fillRect(lx+2,cy-6,w-4,12);ctx.fillStyle='#8a5a33';ctx.fillRect(lx+3,cy-.5,9,1.4);ctx.fillStyle='#6b7480';ctx.beginPath();ctx.moveTo(lx+14,cy+.2);ctx.lineTo(lx+10.5,cy-2.6);ctx.lineTo(lx+10.5,cy+3);ctx.closePath();ctx.fill();ctx.fillStyle='#c0503a';ctx.fillRect(lx+2.5,cy-2,1.2,1.4);ctx.fillRect(lx+2.5,cy+1,1.2,1.4);/* 木の矢の絵 */
    ctx.fillStyle=n>0?'#3b2a1a':'#c0392b';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(t,lx+16,cy+.5);ctx.textAlign='start';ctx.textBaseline='alphabetic'}}
function render(now){RFN++;
  if(dirty)rebuildStatic(STATICFULL);
  if(S.hi&&CPRE!==S&&cliffChipsOK()){CPRE=S;cliffPreload()}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#8f8262';ctx.fillRect(0,0,cv.width,cv.height);
  const k=dpr*cam.z;
  ctx.setTransform(k,0,0,k,-cam.x*k,-cam.y*k);
  {GLOD=k<1.2;GRD.bt=0;if(GRD.s!==S)gclear();const fresh=!GRD.any;let built=0;/* 地面の下絵：見えている区画をならべる（ちぢめたときは半分の細かさ）。区画を作るのは1コマ GBUD ミリ秒まで（少なくとも1こ。はじめのコマは、見えている分をぜんぶ） */
    const SXg=v=>cam.x+Math.round((v-cam.x)*k)/k,SYg=v=>cam.y+Math.round((v-cam.y)*k)/k,cx0=Math.max(0,Math.floor(cam.x/GPX)),cy0=Math.max(0,Math.floor(cam.y/GPX)),cx1=Math.min((W-1)>>4,Math.floor((cam.x+VW/cam.z)/GPX)),cy1=Math.min((H-1)>>4,Math.floor((cam.y+VH/cam.z)/GPX));
    for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const q=gq(cx,cy),need=GLOD?(!q.l||q.st):(!q.f||q.st);if(need&&(fresh||built===0||GRD.bt<GBUD)){gbuild(cx,cy,q);built++}q.u=RFN;const im=GLOD?q.l:(q.f||q.l);if(!im)continue;/* まだ作っていない区画は、地面の色のまま（つぎのコマで作る） */
      const ox=cx*GPX,oy=cy*GPX,w=Math.min(GPX,W*TS-ox),h=Math.min(GPX,H*TS-oy),a=SXg(ox),b=SYg(oy);ctx.drawImage(im,a,b,SXg(ox+w)-a,SYg(oy+h)-b)}GRD.any=true}/* 区画は、画面のドットのさかいに合わせておく（さかいめに線が出ないように） */
  const x0=Math.max(0,Math.floor(cam.x/TS)-1),y0=Math.max(0,Math.floor(cam.y/TS)-2),x1=Math.min(W,Math.ceil((cam.x+VW/cam.z)/TS)+1),y1=Math.min(H,Math.ceil((cam.y+VH/cam.z)/TS)+2);
  waterShimmer(now,x0,y0,x1,y1);drawFords(x0,y0,x1,y1);drawRugsLive(x0,y0,x1,y1);
  for(const[j,t0]of pops){const a=1-(now-t0)/350;if(a<=0){pops.delete(j);continue}ctx.fillStyle='rgba(255,255,240,'+a*.6+')';const s=4*(1-a);rr(ctx,(j%W)*TS-s,((j/W)|0)*TS-s,TS+s*2,TS+s*2,6)}
  for(const d of S.drops||[]){const dz=hiAt(d.y*W+d.x)*LIFT,cx=d.x*TS+16,cy=d.y*TS+19-dz,tw=Math.sin(now/260+d.x*1.7)*.5+.5;
    if(d.id==='mat:eda'||d.id==='mat:can'){const ch=window.CHIPS&&CHIPS['drop:'+d.id.slice(4)];if(ch&&drawChip(ctx,ch,d.id,d.x*TS,d.y*TS-dz,0))continue;ctx.fillStyle='rgba(40,25,10,.18)';ctx.beginPath();ctx.ellipse(cx,cy+8,7,2.2,0,0,7);ctx.fill();drawMatIc(ctx,d.id.slice(4),cx,cy+2,18);continue}/* 枝・空き缶の落とし物 */
    if(d.id==='mebuki'){const fy=cy-4+Math.sin(now/380)*2;/* めぶきのしずく：若葉をのせた緑のしずく */
      ctx.fillStyle='rgba(40,25,10,.18)';ctx.beginPath();ctx.ellipse(cx,cy+8,6,2.2,0,0,7);ctx.fill();
      ctx.fillStyle='rgba(170,255,190,'+(.2+tw*.2)+')';ctx.beginPath();ctx.arc(cx,fy,12+tw*3,0,7);ctx.fill();
      ctx.fillStyle='#5fd88a';ctx.beginPath();ctx.moveTo(cx,fy-10);ctx.quadraticCurveTo(cx+8,fy+1,cx+6,fy+5);ctx.arc(cx,fy+4,6,0,Math.PI);ctx.quadraticCurveTo(cx-8,fy+1,cx,fy-10);ctx.fill();
      ctx.fillStyle='#d9ffe4';ctx.beginPath();ctx.ellipse(cx-2,fy+2,1.8,3,.3,0,7);ctx.fill();
      ctx.fillStyle='#3fa35a';ctx.beginPath();ctx.ellipse(cx+3,fy-10,4,1.8,-.6,0,7);ctx.fill();continue}
    if(d.id==='shard'){const fy=cy-4+Math.sin(now/400)*2;/* ヌシのかけら：ういている光る石 */
      ctx.fillStyle='rgba(40,25,10,.18)';ctx.beginPath();ctx.ellipse(cx,cy+8,7,2.5,0,0,7);ctx.fill();
      ctx.fillStyle='rgba(255,240,170,'+(.18+tw*.2)+')';ctx.beginPath();ctx.arc(cx,fy,13+tw*3,0,7);ctx.fill();
      ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.moveTo(cx,fy-11);ctx.lineTo(cx+7,fy-1);ctx.lineTo(cx,fy+10);ctx.lineTo(cx-7,fy-1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff8d8';ctx.beginPath();ctx.moveTo(cx,fy-11);ctx.lineTo(cx+3,fy-1);ctx.lineTo(cx,fy+10);ctx.lineTo(cx-2,fy-1);ctx.closePath();ctx.fill();continue}
    if(d.lt){const mk=d.id.slice(4),im=mk==='bamboo'&&ICI.bamboo&&ICI.bamboo.ok?ICI.bamboo:emoImg(mk==='stone'?'🪨':mk==='bamboo'?'🎋':'🪵')||hudIc('matN'),ih=20;/* 落ちた物のアイコン：木材・石材・竹（素材箱のアイコンにしない） */let ix=cx,iy=cy,sh=1,rot=0;const fx0=DROPFX.get(d);if(fx0){const e=(now-fx0.t0)/700;if(e>=1)DROPFX.delete(d);else{/* とびだして弧をえがき、地面で小さくはねる */const f=Math.min(1,e/.7),hop=e<.7?Math.sin(f*Math.PI)*26:Math.sin((e-.7)/.3*Math.PI)*5;ix=fx0.sx+(cx-fx0.sx)*f;iy=fx0.sy+(cy-fx0.sy)*f-hop;sh=.5+.5*f;rot=(1-f)*Math.PI*1.5}}
      ctx.fillStyle='rgba(40,25,10,'+(.18*sh)+')';ctx.beginPath();ctx.ellipse(ix,cy+6,9*sh,2.7*sh,0,0,7);ctx.fill();if(im&&im.complete&&im.naturalWidth){const iw=ih*im.naturalWidth/im.naturalHeight;if(rot){ctx.save();ctx.translate(ix,iy-1);ctx.rotate(rot);ctx.drawImage(im,Math.round(-iw/2),Math.round(-ih/2),iw,ih);ctx.restore()}else ctx.drawImage(im,Math.round(ix-iw/2),Math.round(iy-ih/2-1),iw,ih)}continue}/* 守りの光で落とした木材・石材：上の木材・石材と同じアイコン */
    if(d.id==='sand'){const ch=window.CHIPS&&CHIPS.sand;if(ch&&drawChip(ctx,ch,'sand',d.x*TS,d.y*TS,now))continue}/* やすらぎの砂：もらった絵 */
    /* 小さなふくろ */
    ctx.fillStyle='rgba(40,25,10,.22)';ctx.beginPath();ctx.ellipse(cx,cy+8,9,3,0,0,7);ctx.fill();
    ctx.fillStyle='#b5854e';ctx.beginPath();ctx.ellipse(cx,cy+1,8.5,7.5,0,0,7);ctx.fill();ctx.fillStyle='#c99a60';ctx.beginPath();ctx.ellipse(cx-2.5,cy-1,3.5,3,0,0,7);ctx.fill();
    ctx.fillStyle='#a07240';rr(ctx,cx-4,cy-10,8,5,2);ctx.fillStyle='#6b4524';ctx.fillRect(cx-5,cy-6,10,2);
    ctx.fillStyle='rgba(255,245,170,'+(.4+tw*.6)+')';const sx=cx+7,sy=cy-10,sr=2+tw*2.5;ctx.beginPath();for(let a=0;a<8;a++){const r2=a%2?sr*.35:sr,an=a*Math.PI/4;ctx.lineTo(sx+Math.cos(an)*r2,sy+Math.sin(an)*r2)}ctx.fill()}
  for(const s of S.seeds){const tw=Math.sin(now/250+s.x)*.5+.5;ctx.fillStyle='rgba(255,240,150,'+(.5+tw*.5)+')';const cx=s.x*TS+16,cy=s.y*TS+16-hiAt(s.y*W+s.x)*LIFT;ctx.beginPath();for(let a=0;a<8;a++){const r2=a%2?3:9+tw*2,an=a*Math.PI/4+now/900;ctx.lineTo(cx+Math.cos(an)*r2,cy+Math.sin(an)*r2)}ctx.fill();circ(ctx,cx,cy,3,'#fff')}
  drawHeat(now);drawRanges(now);
  if(mode==='build'&&sel&&BL[sel]&&!selRect&&!pending){const k=sel+'|'+S.placed[sel]+'|'+x0+','+y0+','+x1+','+y1;if(BADC.k!==k||now-BADC.t>600){BADC.k=k;BADC.t=now;BADC.L=[];for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(!canPlace(sel,x,y,true))BADC.L.push(y*W+x)}/* 画面に見えている所だけ */
    ctx.fillStyle='rgba(255,90,90,.16)';for(const j of BADC.L)ctx.fillRect((j%W)*TS,((j/W)|0)*TS-hiAt(j)*LIFT,TS,TS)}/* 置くものをえらんでいるときは、置けないマスをうすい赤で */
  if(mode==='bulk'&&selStamp==='move'&&MOVESRC){const m=MOVESRC,o=m.k==='obj'?S.obj[m.j]:null,L=o?fp(o,m.j%W,(m.j/W)|0).map(([x,y])=>y*W+x):rugCells(m.j);ctx.save();ctx.fillStyle='rgba(255,220,90,.32)';ctx.strokeStyle='rgba(255,200,60,.9)';ctx.lineWidth=2;for(const j of L){const z=hiAt(j)*LIFT;ctx.fillRect((j%W)*TS,((j/W)|0)*TS-z,TS,TS);ctx.strokeRect((j%W)*TS+1,((j/W)|0)*TS-z+1,TS-2,TS-2)}ctx.restore()}/* ひっこしミトンでえらんだ物を、黄色でしめす */
  if(selRect){const P=pending&&(pending.kind==='bulk'||pending.kind==='plant')?new Set(pending.cells.map(([x,y])=>y*W+x)):null;/* 「おく」を待っているときは、ほんとうにぬるマスだけを黄色に */for(const[x,y]of rectCells(selRect.a,selRect.b)){ctx.fillStyle=(P?P.has(y*W+x):canPlace(sel,x,y,true))?'rgba(255,220,90,.35)':'rgba(255,90,90,.3)';ctx.fillRect(x*TS,y*TS-hiAt(y*W+x)*LIFT,TS,TS)}}
  if(pending&&pending.kind==='one'){const z=szR(pending.id,PLROTS[pending.id]||0)||[1,1],px=pending.x*TS,py=pending.y*TS-hiAt(pending.y*W+pending.x)*LIFT;/* 高い段は、その高さに */ctx.fillStyle=pending.ok?'rgba(255,220,90,.3)':'rgba(255,90,90,.35)';const TP=pending.id==='statue'?[[-1,0,'obox'],[0,0,'statue'],[1,0,'board'],[0,1,'altar']]:[[0,0,pending.id]];if(TP.length>1)for(const[dx,dy]of TP)ctx.fillRect(px+dx*TS,py+dy*TS,TS,TS);else ctx.fillRect(px,py,z[0]*TS,z[1]*TS);
    ctx.strokeStyle=pending.ok?'rgba(255,230,120,.95)':'rgba(255,110,110,.95)';ctx.lineWidth=2;ctx.setLineDash([5,4]);if(TP.length>1)for(const[dx,dy]of TP)ctx.strokeRect(px+dx*TS+1,py+dy*TS+1,TS-2,TS-2);else ctx.strokeRect(px+1,py+1,z[0]*TS-2,z[1]*TS-2);ctx.setLineDash([])}
  if(pending&&pending.kind==='stamp'){for(const[dx,dy]of STAMPS[pending.sid].cells){ctx.fillStyle='rgba(255,220,90,.4)';ctx.fillRect((pending.x+dx)*TS,(pending.y+dy)*TS-hiAt((pending.y+dy)*W+pending.x+dx)*LIFT,TS,TS)}}
  if(pending&&pending.kind==='swap'){ctx.fillStyle='rgba(255,220,90,.4)';for(const j of pending.cells)ctx.fillRect((j%W)*TS,((j/W)|0)*TS-hiAt(j)*LIFT,TS,TS)}/* つけかえる所 */
  if(S.broken)for(const b of S.broken){if(S.obj[b.j])continue;const bx=(b.j%W)*TS,by=((b.j/W)|0)*TS,bz=(BL[b.id]&&BL[b.id].sz)||[1,1];ctx.save();ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(255,230,180,.55)';ctx.lineWidth=2;ctx.strokeRect(bx+3,by+3,bz[0]*TS-6,bz[1]*TS-6);ctx.restore()}/* こわれた見張り台は、4マスぶんの枠 */
  const vis=o=>o.x>x0-2&&o.x<x1+2&&o.y>y0-1&&o.y<y1+3;// 画面外は描かない
  // ---- 奥行きの順に描く（足もとのY座標が小さい＝奥から）----
  // せいれい・敵・置いてある物・屋根を、ぜんぶ足もとの順に描く
  const D=[];BUBQ=[];const bubs=BUBQ;
  const add=(k,t,box,draw,own)=>D.push({k,t,box,draw,own});
  for(const r of S.res)if(vis(r)){const px=r.x*TS,fy=r.y*TS,onB=r.act&&r.act.type==='rest'&&r.act.stage==='do'&&BENCHES.has(S.obj[r.act.obj]),onAl=STATUE>=0&&(r.y|0)*W+(r.x|0)===STATUE+W;/* ベンチにすわっている子は、ベンチの背もたれより手前（縦のベンチは2マスめより手前）。神殿の台座の上にいる子は、台座より手前 */const rj=(r.y|0)*W+(r.x|0),inJ=BEDSET.has(typeAt(rj))?anc(rj):r.act&&r.act.stage==='do'?(r.act.type==='sleep'&&BEDSET.has(S.obj[r.act.obj])?r.act.obj:r.act.type==='bathe'&&r.act.tub!=null?r.act.tub:-1):-1,inO=inJ>=0?S.obj[anc(inJ)]:null;/* ベッドの上にいる子（寝る子も、歩いている子も）・バスタブに入る子は、その家具より手前 */const inDr=HOME_DOORS.has(typeAt((r.y|0)*W+(r.x|0)))||GATE_IDS.has(typeAt((r.y|0)*W+(r.x|0)))||SEATS.includes(typeAt((r.y|0)*W+(r.x|0)));/* いすにすわる子も、いすより手前 *//* ドアのマスを通る子は、ドアより手前 */add(r.act&&r.act.type==='watchpost'&&r.act.stage==='do'&&S.obj[r.act.obj]==='watch'?objectDepth('watch',r.act.obj)+.02:toyR(r)?toyPose(r,now).z:inO&&BL[inO]?objectDepth(inO,anc(inJ))+.02:onB?((r.act.obj/W)|0)+(rotAt(r.act.obj)%2===1?2.05:1.05):onAl?((STATUE/W)|0)+2.03:inDr?(r.y|0)+1.02:rDepth(r),2,[px-22,fy-64,px+22,fy+13],()=>liftDraw(uLift(r),()=>drawRes(r,now)),(r.y|0)*W+(r.x|0))}
  if(EVAP.length){EVAP=EVAP.filter(it=>now-it.t0<(it.dur||1800)+600);for(const it of EVAP){const e=it.e,z=EN[e.type].size||1,px=e.x*TS,fy=e.y*TS;add(e.y,2,[px-30*z,fy-110*z,px+30*z,fy+15],()=>liftDraw(uLift(it.e),()=>drawEvap(it,now)),(e.y|0)*W+(e.x|0))}}
  for(const e of S.enemies)if(vis(e)&&!(e.dead&&EVAP.some(it=>it.e===e))){/* 消えていく途中のコワイノは、消える演出だけを描く */const s=EN[e.type].size||1,px=e.x*TS,fy=e.y*TS;add(e.y,2,[px-24*s,fy-56*s-10,px+24*s,fy+15],()=>liftDraw(uLift(e),()=>drawEnemy(e,now)),(e.y|0)*W+(e.x|0))}
  if(godHere()){const GX=godX(),GY=godY(),px=GX*TS,py=GY*TS,onA=STATUE>=0&&S.obj[STATUE+W]==='altar',gk=onA?((STATUE/W)|0)+1.02:GY+.5,gt=onA?1.5:2;add(gk,gt,/* 神殿の柱とおそなえ箱より手前 */[px-36,py-64,px+36,py+24],()=>drawGod(now),(GY|0)*W+(GX|0));}
  if(festOn())for(const st of festStalls()){const px=(st.x+.5)*TS,py=(st.y+.5)*TS-4;if(!vis({x:st.x+.5,y:st.y+.5}))continue;add(st.y+.3,2,[px-48,py-100,px+48,py+26],()=>drawYatai(px,py,0,now,st),-1);add(st.y+.75,2,[px-48,py-100,px+48,py+26],()=>drawYatai(px,py,1,now,st),-1)}/* せいれいの屋台（屋根は店番のうしろ、台は前） */
  if(S.nushi){const n=S.nushi,px=n.x*TS,py=n.y*TS;add(n.y+.2,2,[px-100,py-150,px+100,py+20],()=>drawNushi(now),-1)}
  for(let y=Math.max(0,y0-2);y<Math.min(H,y1+4);y++)for(let x=Math.max(0,x0-4);x<x1;x++){const i=y*W+x,o=S.obj[i];if(!o||o==='part'||!BL[o]||S.ground[i]===1&&o!=='lotus'&&o!=='sprout'&&o!=='bridge'||(FLAT.has(o)||BL[o].floor)&&!(BL[o].dyn||BL[o].anim||TREES.has(o)))continue;/* 立っている物は、動く物も動かない物も、毎コマ足もとの順に描く */
    if(o==='door'||o==='yozoradoor')add((i/W|0)+.01,0,null,()=>{ctx._doorBack=1;drawObj(ctx,o,x*TS,y*TS-hiAt(i)*LIFT,i);ctx._doorBack=0},i);/* ドアの奥の面 */
    add(objectDepth(o,i),BL[o].kind==='block'?0:1,null,()=>sideClip(i,()=>drawObj(ctx,o,x*TS,y*TS-hiAt(i)*LIFT,i,S.dyn[i]?(S.dyn[i].g!=null?S.dyn[i].g:S.dyn[i].p):0,now)),i)}
  for(const k in S.roof||{}){const j=+k,x=j%W,y=(j/W)|0,id=S.roof[k];if(!vis({x:x+1,y:y+1}))continue;add(y+2.001,3,[x*TS-8,y*TS-44,x*TS+72,y*TS+70],()=>drawRoofItem(ctx,id,x*TS,y*TS-hiAt(j)*LIFT),j);{const bk=window.CHIPS&&CHIPS[id+':back'];if(bk)add(y,0,[x*TS-8,y*TS-44,x*TS+72,y*TS+70],()=>drawChip(ctx,bk,id,x*TS,y*TS-hiAt(j)*LIFT,0),j)}}/* うしろの柱は、その行のはじめ（せいれいや家具より下） *//* ガゼボ・東屋：家の屋根と同じ（2マスめの行のすぐ後）。下に置いた物より上 */
  if(WD===1&&S.st2&&S.st2.fire)for(const k in S.st2.fire){const j=+k,o=S.obj[j];if(!o||!BL[o])continue;add(objectDepth(o,j)+.005,1,objBox(o,j),()=>drawFire1(j,now),j)}/* 燃えている物のほのおは、その物のすぐ手前に */
  if(festOn()){const SL=festStalls();for(const[x,y]of festPoles()){const j=y*W+x;if(S.obj[j]||S.ground[j]===1||!vis({x:x+.5,y:y+.5})||SL.some(t=>t.y===y&&Math.abs(t.x-x)<=2))continue;add(y+1,1,[x*TS,y*TS-24,x*TS+TS+8,y*TS+TS],()=>drawFestPole(x,y,now),-1)}}/* おまつりのちょうちん（木や岩・水の上、屋台のところには立てない） */
  for(const h of HOUSES){const bot=h.y1,ib=h.ib;if(bot<y0-1||h.y0>y1+1||h.x1<x0-1||h.x0>x1+1)continue;
    add(bot+1.001,3,/* 屋根は、その家の壁（手前の壁もふくむ）のすぐ後に描く。家の前にいる物は屋根より手前 */[h.x0*TS-6,h.y0*TS-40,(h.x1+1)*TS+6,(ib+1)*TS+12],()=>liftDraw((()=>{const L=[...h.set],h0=hiAt(L[0]);return L.every(j=>hiAt(j)===h0)?h0*LIFT:0})(),()=>drawRoofs(ctx,now,[h])),-1)}/* 屋根は家ごとにひとまとまり。その家の壁は屋根の上に描き直さない *//* 屋根は、横の壁より後・手前の壁より先に描く */
  if(S.hi){const RW=cliffRuns();for(let y=Math.max(0,y0-1);y<Math.min(H,y1+2);y++){const L=RW.get(y);if(!L)continue;const vs=[];for(const R of L)if(R.x1>=x0-1&&R.x0<=x1)vs.push({x0:Math.max(R.x0,x0-1),x1:Math.min(R.x1,x1),lv:R.lv});if(!vs.length)continue;/* 見えている所だけ */
    add(y-1+.0005,-1,null,()=>{for(const R of vs)cliffRow(y,R,false)},-1);/* ひとつ上の行の物より先：段差の上の物のかげが、手前の行の上の面にかくれないように */
    add(y+.001,-1,null,()=>{for(const R of vs)cliffRow(y,R,true)},-1)}}/* うしろが低い所だけ、上の面の上はしをもう1回描いて、うしろの物の足もとをかくす *//* 段差：行ごとに、その行の物より先（ひとつ上の行の物より後） */
  D.sort((a,b)=>a.k-b.k||a.t-b.t);
  for(const it of D)it.draw();
  // 置く前のプレビューは、家の壁や屋根より手前に描く
  if(pending&&pending.kind==='one'){const px=pending.x*TS,py=pending.y*TS-hiAt(pending.y*W+pending.x)*LIFT,TP=pending.id==='statue'?[[-1,0,'obox'],[0,0,'statue'],[1,0,'board'],[0,1,'altar']]:[[0,0,pending.id]];ctx.save();ctx.globalAlpha=.6+Math.sin(now/250)*.15;const rch=ROTS[pending.id]&&PLROTS[pending.id]&&chipOf(pending.id,null,PLROTS[pending.id]);if(rch)drawChip(ctx,rch,pending.id,px,py,now);/* 向きをかえられる物は、えらんだ向きの絵だけを見せる（元の向きの絵は出さない） */else for(const[dx,dy,id2]of TP)drawObj(ctx,id2,px+dx*TS,py+dy*TS,pending.y*W+pending.x+dx+dy*W,100,now);ctx.restore()}
  if(pending&&pending.kind==='one'&&FRONTS.has(pending.id)){/* すわる家具は、置くときに正面（すわった子が向く方）を矢印で出す */
    const id=pending.id,rot=PLROTS[id]||0,z=szR(id,rot)||[1,1],w=z[0]*TS,h=z[1]*TS;
    const d=[[0,1],[1,0],[0,-1],[-1,0]][rot];
    const bob=Math.sin(now/220)*2,cx=pending.x*TS+w/2+d[0]*(w/2+9+bob),cy=pending.y*TS+h/2+d[1]*(h/2+9+bob);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(d[1],d[0]));ctx.fillStyle='#ffe066';ctx.strokeStyle='#7a5a1c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-5,-8);ctx.lineTo(-5,8);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore()}
  if(S.summon&&STATUE>=0){const qx=(STATUE%W+.5)*TS,qy=((STATUE/W)|0)*TS-58+Math.sin(now/220)*4;bubs.push(()=>{ctx.fillStyle='rgba(255,236,120,.35)';ctx.beginPath();ctx.arc(qx,qy,19+Math.sin(now/300)*2,0,7);ctx.fill();circ(ctx,qx,qy,14,'#ffd84a');ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(qx,qy,14,0,7);ctx.stroke();ctx.fillStyle='#7a4a10';ctx.font='20px \"PixelMplus10\",\"Hikomi\",\"Hiragino Maru Gothic ProN\",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('！',qx,qy+1);ctx.textAlign='start';ctx.textBaseline='alphabetic'})}/* 召喚できる合図 */
  
  BUBQ=null;for(const f of bubs)f();
  for(const[j,ht]of NATHIT){if(now-ht>4000||!LIGHTNAT[S.obj[j]]){NATHIT.delete(j);continue}const v=Math.max(0,1-(S.hp['lp'+j]||0)/NATG[S.obj[j]]),a=Math.min(1,(4000-(now-ht))/600),bx=(j%W)*TS+3,byy=natBarY(j);/* 守りの光をあてた木・岩・せいれいが切っている木・ほっている岩の、のこりのバー（高いマスでは持ち上げる） */
    ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.6)';rr(ctx,bx-1,byy-1,TS-4,7,3);ctx.fillStyle='#ffe58a';rr(ctx,bx,byy,Math.max(2,(TS-6)*v),5,2.5);ctx.globalAlpha=1}
  for(const[j,ht]of WALLHIT){const o=S.obj[j];if(now-ht>4000||!o||!BL[o]||!(BL[o].hp||DEFS.has(o))){WALLHIT.delete(j);continue}const mx=BL[o].hp||defHp(o),hp=Math.max(0,S.hp[j]??mx),v=hp/mx,a=Math.min(1,(4000-(now-ht))/600);
    const bx=(j%W)*TS+3,byy=((j/W)|0)*TS-7;ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.6)';rr(ctx,bx-1,byy-1,TS-4,7,3);ctx.fillStyle=v>.5?'#7ee08a':v>.25?'#ecdcbc':'#ff6b6b';rr(ctx,bx,byy,Math.max(2,(TS-6)*v),5,2.5);
    ctx.font='8px \"PixelMplus10\",\"Hikomi\",\"Hiragino Maru Gothic ProN\",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(Math.floor(hp)+'/'+mx,bx+TS/2-3,byy-2);ctx.textAlign='start';ctx.globalAlpha=1}
  if(WD===1&&S.st2)for(const k in S.st2.ash){const ax=(k%W)*TS,ay=((k/W)|0)*TS;ctx.fillStyle='rgba(95,90,86,.6)';for(let n=0;n<5;n++){ctx.beginPath();ctx.arc(ax+6+hash(k*3+n)*20,ay+6+hash(k*5+n)*18,3.5+hash(+k+n)*3,0,7);ctx.fill()}}/* 灰でよごれた設備 */
  if(WD===1&&S.st2)for(let y=Math.max(0,y0-1);y<Math.min(H,y1+2);y++)for(let x=Math.max(0,x0-1);x<Math.min(W,x1+1);x++){const i=y*W+x;if(S.ground[i]!==1||hash(i*7)>.45||!hotW(i))continue;const ph=((now/2600+hash(i*3))%1),sx=(i%W)*TS+8+hash(i*5)*16+Math.sin(now/700+i)*3,sy=((i/W)|0)*TS+14-ph*26;/* 温泉の湯気 */
    ctx.fillStyle='rgba(255,255,255,'+(.5*(1-ph))+')';ctx.beginPath();ctx.arc(sx,sy,5+ph*7,0,7);ctx.fill()}
  drawSpotFx(now);/* スポットのかこみ・キラキラは、物より上に */
  for(const f of fx){ctx.globalAlpha=Math.max(0,Math.min(1,f.life));
    if(f.k==='pillar'){const k=Math.min(1,f.life),w=26*k+6,h=150;const g=ctx.createLinearGradient(0,f.y-h,0,f.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,f.col+'99');g.addColorStop(1,'#ffffffee');ctx.fillStyle=g;ctx.fillRect(f.x-w/2,f.y-h,w,h+4);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(f.x-w/6,f.y-h,w/3,h+4);
      const gg=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,46);gg.addColorStop(0,'rgba(255,255,255,.9)');gg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gg;ctx.fillRect(f.x-46,f.y-46,92,92)}
    else if(f.k==='ring'){ctx.strokeStyle=f.col||'rgba(255,250,220,.9)';ctx.lineWidth=2.5*f.life;ctx.beginPath();{const rr=Math.max(0,1-f.life)*(f.col?56:30)+6;ctx.ellipse(f.x,f.y+6,rr,rr*.5,0,0,7)};ctx.stroke()}
    else if(f.k==='slash'){const p=1-f.life;ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.d,1);ctx.lineCap='round';const e=-1.4+2.8*Math.min(1,p*3.2);ctx.strokeStyle='rgba(255,170,60,.9)';ctx.lineWidth=9*f.life+2;ctx.beginPath();ctx.arc(-6,0,20,-1.4,e);ctx.stroke();ctx.strokeStyle='#fffbe0';ctx.lineWidth=4*f.life+1;ctx.beginPath();ctx.arc(-6,0,20,-1.4,e);ctx.stroke();ctx.fillStyle='rgba(255,240,170,'+f.life+')';ctx.beginPath();for(let a=0;a<8;a++){const r2=(a%2?4:11)*(.6+p),an=a*Math.PI/4;ctx.lineTo(14+Math.cos(an)*r2,Math.sin(an)*r2)}ctx.fill();ctx.restore()}
    else if(f.k==='p'){ctx.fillStyle=f.col;ctx.fillRect(f.x-f.r/2,f.y-f.r/2,f.r,f.r)}
    else{ctx.fillStyle=f.col;ctx.beginPath();for(let a=0;a<8;a++){const r2=a%2?1.2:3.5,an=a*Math.PI/4;ctx.lineTo(f.x+Math.cos(an)*r2,f.y+Math.sin(an)*r2)}ctx.fill()}}
  ctx.globalAlpha=1;
  ctx.strokeStyle='#fff6b0';ctx.lineWidth=2;
  /* 見張り台の木の矢・守護の台座の光の矢：塔から敵へ飛ぶ */
  for(const s of shots){const p=1-s.life,h=Math.min(1,p*2.4),tl=Math.max(0,h-.35),X=v=>(s.x1+(s.x2-s.x1)*v)*TS,Y=v=>(s.y1+(s.y2-s.y1)*v)*TS-Math.sin(v*Math.PI)*14;
    ctx.save();ctx.lineCap='round';if(s.fire&&h<1){ctx.fillStyle='rgba(255,120,40,.5)';ctx.beginPath();ctx.arc(X(h),Y(h),7,0,7);ctx.fill();ctx.fillStyle='#ffcf6a';ctx.beginPath();ctx.arc(X(h),Y(h),4,0,7);ctx.fill()}/* ようがん台の火の玉 */
    else if(s.wood&&h<1){const ax=X(h),ay=Y(h),bx=X(Math.max(0,h-.04)),by=Y(Math.max(0,h-.04)),an=Math.atan2(ay-by,ax-bx);ctx.translate(ax,ay);ctx.rotate(an);ctx.fillStyle='#a8743f';ctx.fillRect(-12,-1,12,2);ctx.fillStyle='#cfd3d8';ctx.beginPath();ctx.moveTo(3,0);ctx.lineTo(-1,-2.5);ctx.lineTo(-1,2.5);ctx.fill();ctx.fillStyle='#d9785b';ctx.fillRect(-13,-2.5,3,1.5);ctx.fillRect(-13,1,3,1.5)}/* 見張り台の木の矢 */
    else if(s.wood){}/* 木の矢は、当たったら光らない */
    else if(h<1){ctx.strokeStyle='rgba(255,236,150,.55)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(X(tl),Y(tl));ctx.lineTo(X(h),Y(h));ctx.stroke();ctx.strokeStyle='#fffbe0';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(X(h),Y(h),4,0,7);ctx.fill()}
    else{const q=(p-1/2.4)/(1-1/2.4);ctx.globalAlpha=1-q;ctx.strokeStyle='#fff3b0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x2*TS,s.y2*TS,6+q*18,0,7);ctx.stroke();ctx.fillStyle='rgba(255,250,210,.7)';ctx.beginPath();ctx.arc(s.x2*TS,s.y2*TS,9*(1-q),0,7);ctx.fill()}ctx.restore()}ctx.globalAlpha=1;
  ctx.font='11px "PixelMplus10","Hikomi",sans-serif';ctx.textAlign='center';
  for(const f of floats){ctx.globalAlpha=Math.min(1,f.life*2);const yy=(f.y-(1-f.life)*1.2)*TS;ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='rgba(176,138,100,.9)';{const fi=emoImg(f.text);if(fi){const ih=20,iw=ih*fi.width/fi.height;ctx.drawImage(fi,f.x*TS-iw/2,yy-ih+4,iw,ih)}else{ctx.strokeText(f.text,f.x*TS,yy);ctx.fillStyle='#fff3d6';ctx.fillText(f.text,f.x*TS,yy)}}}/* 文字はぜんぶクリーム色 *//* 文字のふちどりはうすい茶色 */
  ctx.globalAlpha=1;ctx.textAlign='start';
  const dk=darkness();
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(dk>0){ctx.fillStyle=(!WD&&S.ns&&(S.ns.final||S.ns.rush)&&!S.cleared?'rgba(46,10,52,':'rgba(14,20,58,')+dk+')';ctx.fillRect(0,0,VW,VH);
    ctx.setTransform(k,0,0,k,-cam.x*k,-cam.y*k);ctx.globalCompositeOperation='lighten';/* 光が重なっても、いちばん明るい光より明るくならない */
    ctx.globalAlpha=dk;for(const j of LITP){const o=S.obj[j],L=LIGHTP[o];if(!L)continue;const x=j%W,y=(j/W)|0;if(x<x0-5||x>=x1+5||y<y0-5||y>=y1+5)continue;/* 画面の外5マスの明かりも、光がとどくので描く */if(INDL.has(o)&&roomOf(j))continue;/* 家の中の灯りは、灯りそのものは光らせず、家ぜんたいを光らせる（下） *//* 明かりの出る物は、夜にまわりを明るく：光の絵（半径ごとに1まい作っておく）をおく */
      const R=L.R;ctx.drawImage(lightSpr(R),x*TS+L.dx-R,y*TS+L.dy-R,R*2,R*2)}ctx.globalAlpha=1;
    const litH=new Set();for(const j of LIGHTS){if(INDL.has(S.obj[j])){const h=roomOf(j);if(h)litH.add(h)}}/* 灯りのある家 */
    {const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=true;ctx.globalAlpha=dk*.75;for(const h of litH)ctx.drawImage(houseGlow(h),h.x0*TS-GLOWM,h.y0*TS-GLOWM);ctx.globalAlpha=1;ctx.imageSmoothingEnabled=sm}/* 灯りのある家は、家ぜんたいを同じ明るさで照らす（ふちはぼかす） */
    ctx.globalCompositeOperation='source-over';
    {const wl=HOUSEART['wall-window-lit'];if(wl&&wl.complete&&wl.naturalWidth&&isDark()){ctx.globalAlpha=1;for(const h of litH)for(const q of h.set){if(((q/W)|0)===h.y0)continue;/* 上がわの壁の窓は、昼も夜も同じ色 */if(!S.win||S.win[q]!==1||!(HOME_WALLS.has(S.obj[q])||S.obj[q]==='window'))continue;const qx=q%W,qy=(q/W)|0;if(qx<x0-1||qx>x1||qy<y0-1||qy>y1)continue;if(winCovered(qx,qy))continue;/* 手前に背の高い物があれば、窓の光はかさねない */{const lk='window:lit',lc=window.CHIPS&&CHIPS[lk];if(!(lc&&drawChip(ctx,lc,lk,qx*TS,qy*TS-1.5,0,q)))ctx.drawImage(wl,qx*TS+3.625,qy*TS+1.5,24.75,21.7125)}}/* 明かりの絵もチップの大きさのまま */ctx.globalAlpha=1}}/* 夜（21時〜6時）だけ、灯りのある家の窓ガラスは中が明るい色に（暗さの上にかく） */
    ctx.setTransform(dpr,0,0,dpr,0,0)}
  if(GLWN){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=Math.min(1,dk*1.5);ctx.globalCompositeOperation='lighter';ctx.drawImage(GLW,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.setTransform(dpr,0,0,dpr,0,0);GLWN=0}
  ctx.setTransform(k,0,0,k,-cam.x*k,-cam.y*k);drawArrowTags(x0,y0,x1,y1);ctx.setTransform(dpr,0,0,dpr,0,0);
  // 空気の粒（昼は花粉、夜はホタル）
  for(const m of motes){const x=m.x*VW,y=m.y*VH;if(dk>.3){const a=(Math.sin(now/400+m.p)*.5+.5)*.8;ctx.globalCompositeOperation='lighter';circ(ctx,x,y,2.2*m.s,'rgba(200,255,140,'+a+')');circ(ctx,x,y,6*m.s,'rgba(200,255,140,'+a*.15+')');ctx.globalCompositeOperation='source-over'}else{circ(ctx,x,y,1.4*m.s,'rgba(255,250,220,'+(.35+.2*Math.sin(now/600+m.p))+')')}}
  drawHanabi(now);
  if(S.rain){ctx.strokeStyle='rgba(200,225,255,.45)';ctx.lineWidth=1;ctx.beginPath();for(const d of rain){const x=d.x*VW,y=d.y*VH;ctx.moveTo(x,y);ctx.lineTo(x-3,y+10*d.s)}ctx.stroke()}
  if(!VIG||VIG.w!==VW||VIG.h!==VH){const c2=document.createElement('canvas');c2.width=VW;c2.height=VH;const g2=c2.getContext('2d');const vg=g2.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.45,VW/2,VH/2,Math.max(VW,VH)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(10,20,15,.28)');g2.fillStyle=vg;g2.fillRect(0,0,VW,VH);VIG={c:c2,w:VW,h:VH}}
  ctx.drawImage(VIG.c,0,0);
}
