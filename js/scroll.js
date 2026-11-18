/* 巻物（ひでんのしょ）：上と下の木の軸。scroll.js
   ・軸はキャンバスに1ドット（SCD）ずつ描く：まいた和紙のまるい筒・その両はしから出た軸・軸先（まるい木の頭）・上の軸から下がる巻きひも。
   ・たてに読むと、紙が下の軸からほどけて、上の軸にまきとられる見た目：軸がまわり（紙のはしの線と、すき目の点がうごく）、まいた紙のあつみが上はふえ、下はへる。
   ・ひらくと、上と下の軸がまん中からわかれて、紙がのびて出てくる（scOpen）。とじるときは、まきもどってから画面がとじる（sheetShutFx）。
   ・音：ほどける・まきとる紙のこすれ（pslide）・軸がまわる小さな音（notch）・とじて軸があたる音（twood）。
   ・見た目と音だけ。うごきをへらす設定では、ひらく・とじる動きをしない。 */
const SCD=1.5,SCMS=520,SCOVER=9;
const SCP={hi:'#fbf3dc',li:'#efe0bb',ba:'#e0cb9e',sh:'#c9b080',dk:'#ad925f',ol:'#7e6340',ln:'#b39866'};/* まいた和紙（tools/ui/colors.md の「巻物」） */
const SCW={hi:'#b98352',li:'#9c6a3e',ba:'#82552f',sh:'#674223',dk:'#4e311a',ol:'#3c2412'};/* 軸と軸先の木 */
const SCCORD=['#6a5a8e','#4f4370','#8a7ab0'];/* 巻きひも（むらさき） */
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
function scRodDraw(cv,wD,t,a,cord){const H=22+(cord?20:0),c=cv.getContext('2d');if(cv.width!==wD||cv.height!==H){cv.width=wD;cv.height=H}c.clearRect(0,0,wD,H);
  const cy=11,rc=4,rr=rc+t,K=7,st=3,x0=K+st,x1=wD-K-st;
  scCyl(c,K,wD-K,cy,rc,SCW,a,0);/* 軸（紙のはしから出た所） */
  scCyl(c,x0,x1,cy,rr,SCP,a,Math.max(3,Math.floor((x1-x0)/14)));/* まいた紙 */c.fillStyle=SCP.ol;c.fillRect(x0,cy-rr,1,rr*2);c.fillRect(x1-1,cy-rr,1,rr*2);
  /* まいた紙のはしの面：うずまきのすじ */c.fillStyle=SCP.ln;for(let k=1;k<t;k++){c.fillRect(x0+1,cy-rc-k,1,1);c.fillRect(x1-2,cy+rc+k-1,1,1)}
  for(const xk of[0,wD-K]){/* 軸先：まるい木の頭（角を1ドットずつおとす） */scCyl(c,xk,xk+K,cy,7,SCW,a*.5,0);for(const[dx,dy,n]of[[0,-7,3],[1,-7,1],[0,5,2],[1,6,1]]){c.clearRect(xk+dx,cy+dy,1,n);c.clearRect(xk+K-1-dx,cy+dy,1,n)}c.fillStyle=SCW.hi;c.fillRect(xk+2,cy-5,2,1);c.fillRect(xk+1,cy-4,1,2)}
  if(cord){/* 巻きひも：上の軸の右から下がる。よむ速さで少しゆれる */const cx=Math.round(wD*.78),sw=cord.sw;let x=cx;for(let i=0;i<14;i++){x=cx+Math.round(sw*Math.pow(i/13,1.4)*3);c.fillStyle=i%3===2?SCCORD[1]:SCCORD[0];c.fillRect(x,cy+rr+i,1,1)}
    const ky=cy+rr+14;c.fillStyle=SCCORD[1];c.fillRect(x-1,ky,3,2);c.fillStyle=SCCORD[2];c.fillRect(x-1,ky,1,1);c.fillStyle=SCCORD[0];for(const dx of[-1,0,1])c.fillRect(x+dx,ky+2,1,3+(dx===0?1:0))}}
/* 毎コマ：軸を紙の上と下にあわせて描く */
function scTick(now){const sh=scSheet();if(!sh){if(SC)scDrop();SCSEEN=0;requestAnimationFrame(scTick);return}
  const R=scRods();if(!SCSEEN){SCSEEN=1;if(!(typeof uiReduced==='function'&&uiReduced()))scOpen(sh);else bkSnd('pslide',.2)}
  const b=document.getElementById('sheetBody'),mx=Math.max(1,b.scrollHeight-b.clientHeight),s=Math.max(0,Math.min(1,b.scrollTop/mx)),r=sh.getBoundingClientRect();
  if(!R.anim){/* よむ：スクロールした長さだけ軸がまわる */if(R.ls!=null){const d=b.scrollTop-R.ls;R.a+=d/(SCD*6);R.sw=Math.max(-1,Math.min(1,R.sw*.85-d*.02));if(Math.abs(d)>.5)bkSlide(Math.min(1,Math.abs(d)/14)*.3)}R.ls=b.scrollTop}
  if(Math.abs(R.a-R.la)>Math.PI/2){R.la=R.a;bkSnd('notch',.06,.7)}/* 軸がまわる、小さなカタッ */
  R.sw*=.9;const wD=Math.round((r.width+SCOVER*2*SCD)/SCD),tT=2+Math.round(4*(mx>1?s:0)),tB=2+Math.round(4*(mx>1?1-s:1));
  scRodDraw(R.top,wD,tT,R.a,{sw:R.sw});scRodDraw(R.bot,wD,tB,R.a,null);
  const pos=(cv,y)=>{cv.style.left=Math.round((r.left-SCOVER*SCD)/SCD)*SCD+'px';cv.style.top=Math.round((y-11*SCD)/SCD)*SCD+'px';cv.style.width=cv.width*SCD+'px';cv.style.height=cv.height*SCD+'px'};
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
  if(typeof bookShut==='function'&&typeof sheet!=='undefined'&&sheet==='menu'&&BK&&BK.el.isConnected&&bookShut(fin))return true;return false}
requestAnimationFrame(scTick);
