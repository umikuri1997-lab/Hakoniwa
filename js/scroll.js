/* 巻物（ひでんのしょ）：上と下の木の軸。scroll.js
   ・軸はキャンバスに1ドット（SCD）ずつ描く：まいた和紙のまるい筒・その両はしから出た軸・軸先（まるい木の頭）・上の軸から下がる巻きひも。
   ・たてに読むと、紙が下の軸からほどけて、上の軸にまきとられる見た目：軸がまわり（紙のはしの線と、すき目の点がうごく）、まいた紙のあつみが上はふえ、下はへる。
   ・ひらくと、上と下の軸がまん中からわかれて、紙がのびて出てくる（scOpen）。とじるときは、まきもどってから画面がとじる（sheetShutFx）。
   ・音：ほどける・まきとる紙のこすれ（pslide）・軸がまわる小さな音（notch）・とじて軸があたる音（twood）。
   ・見た目と音だけ。うごきをへらす設定では、ひらく・とじる動きをしない。 */
const SCD=1.5,SCMS=520,SCOVER=9;
const SCP={hi:'#fbf3dc',li:'#efe0bb',ba:'#e0cb9e',sh:'#c9b080',dk:'#ad925f',ol:'#7e6340',ln:'#b39866'};/* まいた和紙（tools/ui/colors.md の「巻物」） */
const SCW={hi:'#b98352',li:'#9c6a3e',ba:'#82552f',sh:'#674223',dk:'#4e311a',ol:'#3c2412'};/* 軸と軸先の木 */
const SCCORD=['#c8505a','#94323e','#e88088'];/* ひもと房（あかね色） */
const SCC={hi:'#d8e8bc',li:'#b7d196',ba:'#95b472',sh:'#78975c',dk:'#5c7a48',ol:'#3c5530',ln:'#e8f2d4'},SCG={hi:'#fff1b8',li:'#f0cf72',ba:'#d9aa4e',sh:'#b38532',dk:'#8a6224',ol:'#5e421a'};/* 布の表装（無地の緑）と、金の帯 */
let SC=null,SCSEEN=0;
function scSheet(){const w=document.getElementById('sheetWrap');if(!w||w.hidden)return null;const sh=w.querySelector('.sheet');return sh&&sh.dataset.k==='manual'?sh:null}
function scRods(){if(SC&&SC.top.isConnected)return SC;const mk=()=>{const c=document.createElement('canvas');c.className='scrod';c.setAttribute('aria-hidden','true');document.getElementById('sheetWrap').appendChild(c);return c};
  SC={top:mk(),bot:mk(),a:0,la:0,ls:null,sw:0,anim:0};return SC}
function scDrop(){if(!SC)return;SC.top.remove();SC.bot.remove();SC=null}
/* よこの筒を1本描く：x0〜x1（ドット）・まん中の高さ cy・半径 r・色 P・まわった角 a・すじ（点）の数 */
function scCyl(c,x0,x1,cy,r,P,a,spk){for(let y=-r;y<r;y++){const n=(y+.5)/r,col=y===-r||y===r-1?P.ol:n<-.62?P.hi:n<-.15?P.li:n<.45?P.ba:n<.78?P.sh:P.dk;c.fillStyle=col;c.fillRect(x0,cy+y,x1-x0,1)}
  if(spk){/* まわると、紙のはしの線と、すき目の点が、上へ（前の面から上の面へ）うごいていく */const ph=a%(Math.PI*2),y=Math.round(Math.sin(-ph)*r*.92);if(Math.cos(ph)>.15){c.fillStyle=P.ln;c.fillRect(x0+1,cy+y,x1-x0-2,1)}
    for(let i=0;i<spk;i++){const q=(i*2.39996)%(Math.PI*2),ph2=q-a,xx=x0+2+Math.floor(((i*97)%1000)/1000*(x1-x0-4));if(Math.cos(ph2)<.2)continue;c.fillStyle=P.sh;c.fillRect(xx,cy+Math.round(Math.sin(-ph2)*r*.85),1,1)}}}
/* 1本の軸：まいた紙（あつみ t）・はしの軸・軸先 */
function scRodDraw(cv,wD,t,a,cord){const H=31+(cord?30:0),c=cv.getContext('2d');if(cv.width!==wD||cv.height!==H){cv.width=wD;cv.height=H}c.clearRect(0,0,wD,H);
  const cy=15,rc=4,rr=rc+t,K=7,st=3,x0=K+st,x1=wD-K-st;
  scCyl(c,K,wD-K,cy,rc,SCW,a,0);/* 軸（紙のはしから出た所） */
  scCyl(c,x0,x1,cy,rr,SCC,a,0);/* まいた所：布の表装 */
  /* 布のはしの線が、筒といっしょにまわる */{const ph=(a%(Math.PI*2)+Math.PI*2)%(Math.PI*2),cs=Math.cos(ph);if(cs>.2){c.fillStyle=SCC.dk;c.fillRect(x0+5,cy+Math.round(Math.sin(-ph)*rr*.9),x1-x0-10,1)}}
  for(const gx of[x0,x0+2,x1-4,x1-2])scCyl(c,gx,gx+2,cy,rr,SCG,a,0);/* 金の帯 */c.fillStyle=SCC.ol;c.fillRect(x0,cy-rr,1,rr*2);c.fillRect(x1-1,cy-rr,1,rr*2);
  
  for(const xk of[0,wD-K]){/* 軸先：まるい木の頭（角を1ドットずつおとす） */scCyl(c,xk,xk+K,cy,7,SCW,a*.5,0);scCyl(c,xk===0?xk+K-2:xk,xk===0?xk+K:xk+2,cy,6,SCG,0,0);for(const[dx,dy,n]of[[0,-7,3],[1,-7,1],[0,5,2],[1,6,1]]){c.clearRect(xk+dx,cy+dy,1,n);c.clearRect(xk+K-1-dx,cy+dy,1,n)}c.fillStyle=SCW.hi;c.fillRect(xk+2,cy-5,2,1);c.fillRect(xk+1,cy-4,1,2)}
  if(cord){/* ひもと房：上の軸の右から下がる。よむ速さで少しゆれる */const cx=wD-K-st-8,sw=cord.sw;let x=cx;
    c.fillStyle=SCCORD[1];c.fillRect(cx-2,cy-rr-1,5,2);c.fillStyle=SCCORD[0];c.fillRect(cx-1,cy-rr-1,3,1);/* 軸にまいた結び目 */
    for(let i=0;i<16;i++){x=cx+Math.round(sw*Math.pow(i/15,1.4)*3);c.fillStyle=(i>>1)%2?SCCORD[1]:SCCORD[0];c.fillRect(x,cy+rr+i,2,1);c.fillStyle=SCCORD[2];if(i%2===0)c.fillRect(x,cy+rr+i,1,1)}/* よったひも */
    const ky=cy+rr+16;c.fillStyle=SCG.dk;c.fillRect(x-1,ky,4,3);c.fillStyle=SCG.li;c.fillRect(x,ky,2,2);c.fillStyle=SCG.hi;c.fillRect(x,ky,1,1);/* 金の玉 */
    c.fillStyle=SCCORD[1];c.fillRect(x-2,ky+3,6,2);/* 房の頭 */for(let dx=-2;dx<4;dx++){const n=6+((dx+3)%3);c.fillStyle=dx%2?SCCORD[0]:SCCORD[2];c.fillRect(x+dx,ky+5,1,n)}c.fillStyle=SCCORD[1];c.fillRect(x-2,ky+6,6,1)}}
/* 毎コマ：軸を紙の上と下にあわせて描く */
function scTick(now){const sh=scSheet();if(!sh){if(SC)scDrop();SCSEEN=0;requestAnimationFrame(scTick);return}
  const R=scRods();if(!SCSEEN){SCSEEN=1;if(!(typeof uiReduced==='function'&&uiReduced()))scOpen(sh);else bkSnd('pslide',.2)}
  const b=document.getElementById('sheetBody'),mx=Math.max(1,b.scrollHeight-b.clientHeight),s=Math.max(0,Math.min(1,b.scrollTop/mx)),r=sh.getBoundingClientRect();
  if(!R.anim){/* よむ：スクロールした長さだけ軸がまわる */if(R.ls!=null){const d=b.scrollTop-R.ls;R.a+=d/(SCD*6);R.sw=Math.max(-1,Math.min(1,R.sw*.85-d*.02));if(Math.abs(d)>.5)bkSlide(Math.min(1,Math.abs(d)/14)*.3)}R.ls=b.scrollTop}
  if(Math.abs(R.a-R.la)>Math.PI/2){R.la=R.a;bkSnd('notch',.06,.7)}/* 軸がまわる、小さなカタッ */
  R.sw*=.9;const wD=Math.round((r.width+SCOVER*2*SCD)/SCD),tT=1+Math.round(9*(mx>1?s:0)),tB=1+Math.round(9*(mx>1?1-s:1));
  scRodDraw(R.top,wD,tT,R.a,{sw:R.sw});scRodDraw(R.bot,wD,tB,R.a,null);
  const pos=(cv,y)=>{cv.style.left=Math.round((r.left-SCOVER*SCD)/SCD)*SCD+'px';cv.style.top=Math.round((y-15*SCD)/SCD)*SCD+'px';cv.style.width=cv.width*SCD+'px';cv.style.height=cv.height*SCD+'px'};
  pos(R.top,r.top);pos(R.bot,r.bottom);requestAnimationFrame(scTick)}
/* ひらく：まん中から、上と下へ紙がのびる（紙の中身はうごかさず、見える所だけ広げる） */
function scOpen(sh,back,done){const R=scRods(),b=document.getElementById('sheetBody');sh.style.animation='none';const H=sh.offsetHeight,bh=b.offsetHeight,t0=performance.now();R.anim=1;
  sh.classList.add('scrun');sh.style.overflow='hidden';b.style.flex='none';b.style.height=bh+'px';if(!back)bkSnd('bkopen',.22);
  const step=now=>{const p=Math.min(1,(now-t0)/(back?SCMS*.8:SCMS)),e=back?1-bkEase(p):bkEase(p),h=Math.max(2*SCD,Math.round(H*e/SCD)*SCD),o=Math.round((H-h)/2/SCD)*SCD;
    if(R.h!=null)R.a+=(h-R.h)/2/(SCD*5);R.h=h;bkSlide(.45*Math.sin(Math.PI*p));
    sh.style.height=h+'px';sh.style.transform='translateY('+(-o)+'px)';sh.style.setProperty('--uo',(-o)+'px');
    if(p<1&&sh.isConnected){requestAnimationFrame(step);return}
    R.anim=0;R.h=null;if(back){done&&done();return}scReset(sh)};requestAnimationFrame(step)}
function scReset(sh){const b=document.getElementById('sheetBody');sh.classList.remove('scrun');for(const k of['height','transform','overflow','animation'])sh.style[k]='';sh.style.removeProperty('--uo');if(b){b.style.flex='';b.style.height=''}}
/* とじる（×・うしろの暗い所）：本は表紙をとじてから、巻物はまきもどってから、画面をとじる。うごかさないときは false */
let SHEETQUIET=0;
function sheetShutFx(){const red=typeof uiReduced==='function'&&uiReduced(),fin=()=>{SHEETQUIET=1;closeSheet()};
  const sh=scSheet();if(sh&&!red&&SC&&!SC.anim){scOpen(sh,1,()=>{bkSnd('twood',.25);setTimeout(()=>{fin();scReset(sh);scDrop()},90)});return true}
  if(typeof bookShut==='function'&&typeof sheet!=='undefined'&&(sheet==='menu'||sheet==='diary')&&BK&&BK.el.isConnected&&bookShut(fin))return true;return false}
requestAnimationFrame(scTick);
