'use strict';
/* ---------- 洞窟のクォータービューの、かさねる絵（PR7c） ----------
   前の下絵（区画）で描いていた物を、ひし形の描き方でもどす：
   - 大穴：底に、遠くの岩だな（カメラよりおそく動く）・もや・ちり。暗さの上に、底のあかり・光のすじ・のぼる光のつぶ。
     どちらも、大穴の底のひし形（CVQAB だん低い）の中だけ（cvqAbyssPath）。うしろのかべは、あとから上に描く。
   - 水：流れる模様・光のすじ・きらめき・のぼる光のつぶ（水のマスの地面に）。しずく（落ちる所に立てて、水の輪は地面に）。
   - 水のうつりこみ：水のそばの物・かざり・せいれい・コワイノを、足もとで上下さかさにして、水のひし形の中だけに、うすく。
   - 大穴の上の橋（水晶・ほね）・大穴の氷は、そのマスの地面に。大穴へおちる滝は、水のマスの手前のかべの上を、たてに落ちる。
   - 岩の正面の、根・こけ・光る鉱石・つらら石と、床の小石は、そのマスに立てて（床の小石は地面に）。
   絵の中身（色・数・動き）は前と同じ。描く所だけ、ひし形にした。 */
const CVQREFA=.42;/* うつりこみのこさ */
/* 画面の向き（ゲームの点）での、マスのひし形（段 lv の高さ） */
function cvqDia(P,x,y,lv){const Y=y+CVOY,ix=(x-Y)*IQW/2,iy=(x+Y)*IQH/2-lv*IQL;P.moveTo(ix,iy);P.lineTo(ix+IQW/2,iy+IQH/2);P.lineTo(ix,iy+IQH);P.lineTo(ix-IQW/2,iy+IQH/2);P.closePath()}
/* 見えている、そのしゅるいのマスのひし形をまとめた形（画面の向き） */
function cvqPath(V,f,lvf){const C=CV,P=new Path2D();let any=false;for(let y=V.y0;y<=V.y1;y++)for(let x=V.x0;x<=V.x1;x++){const j=cvJ(x,y);if(!C.seen[j]||!f(j))continue;cvqDia(P,x,y,lvf(j,x,y));any=true}return any?P:null}
const cvqAbyssPath=V=>cvqPath(V,j=>CV.ab[j],(j,x,y)=>cvqH(x,y));
const cvqWaterPath=V=>cvqPath(V,j=>CV.wt[j],j=>Math.max(0,cvqLv(j)));
/* 画面の左上の、ゲームの点（大穴の絵を、カメラよりおそく動かすときの、もとの点） */
function cvqScr0(){const cx=camCX(),cy=camCY();return[isoX(cx,cy)-VW/cam.z/2,isoY(cx,cy)-VH/cam.z/2]}
function cvqAbyssImg(){const C=CV;if(C.abi)return C.abi;const TH=cvTheme(),n=192,L=[];
  for(let k=0;k<3;k++){const c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),R=TH.rock.map(cvRGB),col=(i,a)=>'rgba('+R[i]+','+a+')';
    for(let r=0;r<(k?8:11);r++){/* 岩だな：よこにのびる、でこぼこの帯（上の面は明るく、下へ暗いがけ） */const y0=Math.floor(hash(r*31+k*7)*n),x0=Math.floor(hash(r*17+k*5)*n),w=40+Math.floor(hash(r*13+k)*70),dp=6+Math.floor(hash(r*11+k*3)*10);
      for(let i=0;i<w;i+=2){const xx=(x0+i)%n,top=Math.round(Math.sin((i+r*9)*.13)*2+Math.sin((i+r)*.31))*2,yy=(y0+top+n)%n,dd=dp-Math.round(Math.abs(Math.sin(i*.07+r))*3)*2;
        g.fillStyle=col(k+1,.35+k*.15);g.fillRect(xx,yy,2,2);g.fillStyle=col(k,.3+k*.15);g.fillRect(xx,(yy+2)%n,2,dd);if(k===2&&i%6===0){g.fillStyle=col(4,.4);g.fillRect(xx,yy,2,2)}}}/* 0 いちばん深い〜 2 いちばん近い */
    L.push(c)}
  C.abi=L;C.abp=L.map(c=>ctx.createPattern(c,'repeat'));return L}
/* 大穴の底（床のあと、かべの前）：画面の向きのまま、底のひし形の中だけ */
function cvqAbyssDraw(V,now){const C=CV;if(!C.ab.some(v=>v))return;const P=cvqAbyssPath(V);if(!P)return;cvqAbyssImg();cvMistImg();const t=now/1000,[gx,gy]=cvqScr0(),Wd=VW/cam.z,Hd=VH/cam.z;
  cvqScr(ctx,()=>{ctx.clip(P);ctx.imageSmoothingEnabled=false;
    for(const[k,par]of[[0,.82],[1,.62],[2,.42]]){/* 遠い岩だなほど、カメラより、おそく動く */const ox=Math.round(gx*par/2)*2,oy=Math.round(gy*par/2)*2;ctx.save();ctx.translate(ox,oy);ctx.fillStyle=C.abp[k];ctx.fillRect(gx-ox-4,gy-oy-4,Wd+8,Hd+8);ctx.restore()}
    {/* もや：大穴の底から、ゆっくり流れる */const ox=Math.floor(t*4)%192,oy=Math.floor(-t*2)%192;ctx.save();ctx.globalAlpha=.5;ctx.fillStyle=C.mistP;ctx.translate(ox,oy);ctx.scale(2,2);ctx.fillRect((gx-ox)/2-96,(gy-oy)/2-96,Wd/2+192,Hd/2+192);ctx.restore()}
    {/* ちり：ふちから大穴へ、ゆっくり落ちていく */for(let y=V.y0;y<=V.y1;y++)for(let x=V.x0;x<=V.x1;x++){const j=cvJ(x,y);if(!C.ab[j]||!C.seen[j])continue;const h=hash(((j*53+7)>>>0));if(h>.3)continue;
      const Y=y+CVOY,ix=(x-Y)*IQW/2,iy=(x+Y)*IQH/2-cvqH(x,y)*IQL,per=5+h*8,ph=((t+h*per*3)/per)%1;ctx.globalAlpha=Math.sin(ph*Math.PI)*.55;P4('#d8d0c0',Math.round(ix-14+h*28+Math.sin(t*.6+h*20)*3),Math.round(iy-CVQAB*IQL*.6+ph*CVQAB*IQL),1,1)}}})}
/* 大穴の底のあかり（暗さの上）：ずっと下に、なにかが光っている。カメラより、おそく動く */
function cvqAbyssLights(V,now){const C=CV;if(!C.ab.some(v=>v))return;const P=cvqAbyssPath(V);if(!P)return;const t=now/1000,G=cvTheme().glow,md=(a,b)=>((a%b)+b)%b,[gx,gy]=cvqScr0(),Hd=VH/cam.z;
  cvqScr(ctx,()=>{ctx.clip(P);ctx.globalCompositeOperation='lighter';
    for(let i=0;i<70;i++){const hx=hash(i*97+C.fl*13),hy=hash(i*61+C.fl*7),x=Math.round(gx+md(hx*1400-gx*.2,1400)-200),y=Math.round(gy+md(hy*1000-gy*.2,1000)-150),p=.5+.5*Math.sin(t*(.6+hx)+i*2.1);
      ctx.globalAlpha=.25+.45*p;P4(i%3?G:'#fff6dc',x,y,1,1);if(p>.8){ctx.globalAlpha=.25*p;P4(G,x-1,y,3,1);P4(G,x,y-1,1,3)}}
    for(let i=0;i<4;i++){/* 光のすじ：ずっと上から、大穴の中へ、ななめにさしこむ */const hx=hash(i*37+C.fl*5),x=Math.round(gx+md(hx*900-gx*.15,900)-120),y=gy-20,L=Hd+60,w=14+Math.round(hx*10)*2,p=.5+.5*Math.sin(t*.25+i*1.9);
      for(let r=0;r<L;r+=2){const f=r/L;ctx.globalAlpha=(.035+.03*p)*(1-f*.7);P4('#e8f0ff',Math.round((x+r*.35)/2)*2,y+r,Math.round(w*(1+f*.8)/2)*2,2)}}
    for(let i=0;i<40;i++){/* のぼってくる光のつぶ */const hx=hash(i*53+C.fl*3),hy=hash(i*29+C.fl*11),per=7+hx*6,ph=((t+hy*per)/per)%1,x=Math.round(gx+md(hx*1200-gx*.35,1200)-150+Math.sin(t*.7+i)*3),y=Math.round(gy+Hd+40-ph*(Hd+80));
      ctx.globalAlpha=Math.sin(ph*Math.PI)*.6;P4(i%4?G:'#ffffff',x,y,1,1)}})}
/* 水の模様が、ゆっくり流れる・光のすじ・きらめき・光のつぶ（水のマスの地面に。1マスずつ、描く順に入れる） */
function cvqWaterInit(){const C=CV,T=C.tx;if(C.wflow||!T||!T.water)return;const W=T.water,c=document.createElement('canvas');c.width=W.w;c.height=W.h;const g=c.getContext('2d'),d=g.createImageData(W.w,W.h),q=cvRGB(cvTheme().water[4]);
  for(let i=0;i<W.L.length;i++)if(W.L[i]===2){d.data[i*4]=q[0];d.data[i*4+1]=q[1];d.data[i*4+2]=q[2];d.data[i*4+3]=255}g.putImageData(d,0,0);C.wflow=c;C.wpat=ctx.createPattern(c,'repeat')}
function cvqWaterCell(x,y,now){const C=CV,TH=cvTheme();if(TH.lava)return;cvqWaterInit();const t=now/1000,hi=TH.water[4],fo=TH.water[0],j=cvJ(x,y),ox=x*TS,oy=(y+CVOY)*TS,a=hash((j*17+3)>>>0),b=hash((j*29+11)>>>0),fx=Math.floor(t*3)%128,fy=Math.floor(t*1.5)%128;
  cvqGr(ctx,Math.max(0,cvqLv(j)),()=>{
    if(C.wpat){ctx.save();ctx.beginPath();ctx.rect(ox,oy,TS,TS);ctx.clip();ctx.globalAlpha=.14;ctx.translate(fx/2,fy/2);ctx.scale(.5,.5);ctx.fillStyle=C.wpat;ctx.fillRect((ox-fx/2)*2,(oy-fy/2)*2,TS*2,TS*2);ctx.restore()}
    {const p=(t*.15+a)%1;ctx.globalAlpha=.6*Math.sin(p*Math.PI);P4(hi,ox+2+Math.floor((b*18+p*8)/2)*2,oy+8+Math.floor(a*14/2)*2,6,1);ctx.globalAlpha=1}
    {const p=(t*.45+a*7)%3;if(p<1){const s=p<.5?p*2:2-p*2,cx=ox+4+Math.floor(b*22),cy=oy+4+Math.floor(a*22);ctx.globalAlpha=s;P4(fo,cx,cy,1,1);if(s>.5){P4(fo,cx-1,cy,3,1);P4(fo,cx,cy-1,1,3)}if(s>.85){P4(hi,cx-2,cy,5,1);P4(hi,cx,cy-2,1,5);P4(fo,cx,cy,1,1)}ctx.globalAlpha=1}}});
  if(a<.35)cvqAt(ctx,cvqObj(x,y,1,1),()=>{/* 光のつぶ：水面からゆっくりのぼって、きえる */const p=(t*.18+b)%1,cx=ox+6+Math.floor(a*50)%20+Math.round(Math.sin(t*1.3+b*9)*2),cy=oy+TS-8-Math.floor(p*30);ctx.globalAlpha=Math.sin(p*Math.PI)*.9;P4(hi,cx,cy,1,1);if(p>.2&&p<.7)P4(fo,cx,cy-1,1,1);ctx.globalAlpha=1})}
/* しずく：落ちる所に立てて、天井から落ちる。水なら輪（地面に）、床ならはねる。落ちたときに音 */
function cvqDrips(now){const C=CV,fo=cvTheme().water[0];C.drips=C.drips.filter(d=>now-d.t0<1100);
  for(const d of C.drips){const u=now-d.t0,px=d.x*TS,py=(d.y+CVOY)*TS;
    if(u<320){cvqAt(ctx,cvqPt(px,py),()=>P4('#bfe3f5',px,py-(1-u/320)*(1-u/320)*70-2,1,3));continue}if(!d.s){d.s=1;if(typeof sfxAt==='function')sfxAt('cavedrip',d.x,d.y+CVOY)}
    const q=(u-320)/780;if(d.w)cvqGr(ctx,cvqLvAt(px,py),()=>{ctx.globalAlpha=(1-q)*.8;const r=2+q*9;for(let i=0;i<10;i++){const an=i/10*6.283;P4(fo,px+Math.cos(an)*r,py+Math.sin(an)*r,1,1)}ctx.globalAlpha=1});
    else cvqAt(ctx,cvqPt(px,py),()=>{ctx.globalAlpha=(1-q)*.8;P4('#bfe3f5',px-2-q*3,py-q*4,1,1);P4('#bfe3f5',px+2+q*3,py-q*4,1,1);P4('#6f8f9e',px-1,py,3,1);ctx.globalAlpha=1})}}
/* 水のうつりこみ：水のそば（手前の3マスまでに水）の物・かざり・せいれい・コワイノを、足もとで上下さかさに、水のひし形の中に、うすく */
function cvqReflect(V,now){const C=CV;if(cvTheme().lava)return;const P=cvqWaterPath(V);if(!P)return;
  const nearW=(x,y)=>{for(let d=1;d<=3;d++)for(const[a,b]of[[x,y+d],[x+d,y],[x+d,y+d]])if(cvqIn(a,b)&&C.wt[cvJ(a,b)])return true;return false},L=[];
  for(const d of C.deco||[]){const x=cvX(d.j),y=cvY(d.j);if(C.seen[d.j]&&nearW(x,y))L.push([cvqObj(x,y,1,1),()=>cvDrawDeco(d,now)])}
  for(const[j,o]of C.ob){const x=cvX(j),y=cvY(j);if(C.seen[j]&&'AtTDEbgo'.includes(o.k)&&nearW(x,y))L.push([cvqObj(x,y,1,1),()=>cvDrawObj(j,o,now)])}
  for(const a of C.party)if(nearW(Math.floor(a.x),Math.floor(a.y-CVOY)))L.push([cvqPt(a.x*TS,a.y*TS),()=>cvDrawActor(a,now)]);
  for(const e of C.en)if(!e.dead&&C.seen[cvCell(e)]&&nearW(Math.floor(e.x),Math.floor(e.y-CVOY)))L.push([cvqPt(e.x*TS,e.y*TS),()=>EN[e.type].bk?cvBkDraw(e,now):drawEnemy(e,now)]);
  if(!L.length)return;const GA=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'globalAlpha');
  cvqScr(ctx,()=>{ctx.clip(P);Object.defineProperty(ctx,'globalAlpha',{configurable:true,get(){return GA.get.call(this)/CVQREFA},set(v){GA.set.call(this,v*CVQREFA)}});ctx.globalAlpha=1;/* 描く物が globalAlpha=1 にもどしても、うすいまま */
    try{for(const[A,f]of L)cvqAt(ctx,A,()=>{ctx.translate(0,2*A.fy+Math.round(Math.sin(now/500+A.fy)));ctx.scale(1,-1);f()})}finally{delete ctx.globalAlpha}})}
/* 大穴の上の橋（水晶の橋・ほねの橋）と、大穴にはった氷（そのマスの地面に） */
function cvqBridge(c,x,y,now){const C=CV,TH=cvTheme(),th=C.F.theme,j=cvJ(x,y),b=C.br[j],t=now/1000;if(!b)return;const ox=x*TS,oy=(y+CVOY)*TS,nb=k=>k>=0&&k<CVW*CVH&&!!C.br[k],L=x>0&&nb(j-1),Rr=x<CVW-1&&nb(j+1),U=nb(j-CVW),D=nb(j+CVW);
  cvqGr(c,Math.max(0,cvqLv(j)),()=>{
    if(b===2){/* 大穴にはった氷：下の暗がりがすけて見える。白いひび */ctx.globalAlpha=.42;P4('#0a1626',ox,oy,TS,TS);ctx.globalAlpha=.5;P4('#9ccae6',ox,oy,TS,1);if(!L)P4('#e6f8ff',ox,oy,2,TS);if(!Rr)P4('#e6f8ff',ox+TS-2,oy,2,TS);ctx.globalAlpha=.8;const h=n=>hash((j*29+n*53+7)>>>0);let cx=ox+4+h(1)*20,cy=oy+4+h(2)*10;for(let i=0;i<7;i++){P4('#e6f8ff',cx,cy,2,1);cx+=2;cy+=h(i+3)<.5?1:2}if(Math.sin(t*1.3+j)>.7)P4('#ffffff',ox+6+h(9)*18,oy+6+h(8)*18,1,1);ctx.globalAlpha=1;return}
    if(th==='fossil'){/* ほねの橋：大きなほねを、よこにならべた */const B='#e8dcc0',Bs='#b8a888',Bd='#8a7a62';for(const yy of[5,19]){P4(Bd,ox,oy+yy+5,TS,2);P4(B,ox,oy+yy,TS,5);P4('#fff6e0',ox,oy+yy,TS,1);P4(Bs,ox,oy+yy+4,TS,1)}
      if(x%2===0){P4(B,ox-2,oy+3,6,9);P4(B,ox-2,oy+17,6,9);P4(Bs,ox-2,oy+11,6,1);P4(Bs,ox-2,oy+25,6,1)}return}
    const K=(TH.crys&&TH.crys[0])||['#3a2a6a','#6a4cc0','#9a7ef0','#c4b0ff','#e8deff','#ffffff'],p=.5+.5*Math.sin(t*1.1+(x+y)*.6);/* 水晶の橋：水晶の板。ふちは明るく、ゆっくり光る */
    P4(K[1],ox,oy,TS,TS);P4(K[2],ox+3,oy+3,TS-6,TS-6);for(let i=0;i<3;i++)P4(K[3],ox+6+i*8,oy+4+((i*5+y*3)%14),5,1);if(!L)P4(K[4],ox,oy,2,TS);if(!Rr)P4(K[4],ox+TS-2,oy,2,TS);if(!U)P4(K[4],ox,oy,TS,2);if(!D)P4(K[0],ox,oy+TS-2,TS,2);
    ctx.globalAlpha=.25+.3*p;P4(K[5],ox+8,oy+10,2,2);P4(K[5],ox+20,oy+20,1,1);ctx.globalAlpha=1})}
/* 大穴へおちる滝：水のマスの手前（左下・右下）が大穴なら、そのかべの上を、たてに落ちる（マグマの階は溶岩）。c は画面の向き */
function cvqFalls(c,x,y,now){const C=CV,j=cvJ(x,y),Wc=cvTheme().water,t=now/1000,Y=y+CVOY,ix=(x-Y)*IQW/2,iy=(x+Y)*IQH/2,h=cvqH(x,y);
  for(const side of[0,1]){const ax=side?x+1:x,ay=side?y:y+1;if(!cvqIn(ax,ay)||!C.ab[cvJ(ax,ay)])continue;const LH=(h-cvqH(ax,ay))*IQL;
    for(let i=0;i<8;i++){const u=(i+.5)/8,sx=side?ix+u*IQW/2:ix-IQW/2+u*IQW/2,top=iy+IQH/2+(side?IQH/2*(1-u):IQH/2*u)-h*IQL,ph=(t*1.6+hash((j*7+i*13+side*5)>>>0))%1;
      for(let q=0;q<LH;q+=4){const a=(1-q/LH)*.85;c.globalAlpha=a;P4c(c,((q/4+((ph*12)|0)+i)%5)?Wc[2]:Wc[4],sx-1,top+q,3,4)}}
    c.globalAlpha=.7;for(let i=0;i<4;i++){const u=(i+.5)/4,ph=(t*.9+i*.25+hash(j)*.5)%1,sx=side?ix+u*IQW/2:ix-IQW/2+u*IQW/2,top=iy+IQH/2+(side?IQH/2*(1-u):IQH/2*u)-h*IQL;P4c(c,Wc[4],sx,top-2+ph*4,2,1)}c.globalAlpha=1}}
const P4c=(c,col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
/* 岩の正面の、根・こけ・光る鉱石・つらら石（大岩でかこむ階の、手前が床の岩）。そのマスに立てて、いままでの絵で */
function cvqRockDeco(x,y){const C=CV,ox=x*TS,oy=(y+CVOY)*TS,IN=(a,b)=>a>=0&&b>=0&&a<CVW&&b<CVH,W0=(a,b)=>!IN(a,b)||!C.g[cvJ(a,b)],
    h=n=>hash(((y*CVW+x)*7+n*131+977)>>>0),F=(c,a,b,w,hh)=>{ctx.fillStyle=c;ctx.fillRect(ox+a,oy+b,w,hh)};if(!IN(x,y))return;const j=cvJ(x,y);
  if(typeof tsCarveDraw==='function'&&W0(x,y)&&!W0(x,y+1)&&tsCarveDraw(ctx,x,y,ox,oy))return;/* 土：坂のそばのかべの彫り絵（tsuchi.js） */
  {if(!W0(x,y)||C.ab[j]||W0(x,y+1)||C.wt[j+CVW]||cvTheme().out!=='rock')return;/* つらら石・光る鉱石は、大岩でかこむ階の岩の正面だけ */
    {const D=cvTheme().deco||{};if(D.roots&&h(120)<D.roots){/* 天井からたれる根：岩の正面の上から、まがりながら下へ。ところどころ小さな葉 */const n=1+((h(121)*2)|0);for(let r=0;r<n;r++){let px=4+((h(122+r)*22)|0),py=-12;const L=22+((h(130+r)*18)|0);for(let i=0;i<L;i++){const w=i<L*.6?2:1;F(i%6===5?'#7a5634':'#9a7046',px,py+i,w,1);if(w>1)F('#c0905a',px,py+i,1,1);if(h(140+r*31+i)<.16)px+=h(150+r+i)<.5?-1:1;if(i>8&&h(160+r*17+i)<.14){F('#4f8a30',px+w,py+i,3,2);F('#86c25a',px+w,py+i,2,1)}}F('#9a7046',px,py+L,1,2)}}
      if(D.moss&&h(170)<D.moss){const px=2+((h(171)*20)|0);F('#4f7f34',px,26,8,2);F('#6faa48',px+1,25,5,1);F('#86c25a',px+2,24,2,1)}}/* こけ：岩の正面の下 */
    if(C.ore.has(j)&&!cvChip(ctx,'cave:ore',ox,oy)){F('#3f8f8a',9,14,4,5);F('#7fe0d2',10,15,2,2);F('#3f8f8a',19,19,5,4);F('#7fe0d2',20,20,2,2);F('#7fe0d2',15,24,2,2)}
    if(h(110)<.3&&!cvChip(ctx,'cave:stalac#'+(h(111)<.5?0:1),ox,oy)){const px=5+((h(112)*18)|0);F('#5a4d43',px,7,5,6);F('#5a4d43',px+1,13,3,4);F('#5a4d43',px+2,17,1,3)}
    return}
}
/* 床のくずれた小石（そのマスの地面に） */
function cvqPebble(x,y){const C=CV,ox=x*TS,oy=(y+CVOY)*TS,j=cvJ(x,y),o=C.ob.get(j),h=n=>hash(((y*CVW+x)*7+n*131+977)>>>0),F=(c,a,b,w,hh)=>{ctx.fillStyle=c;ctx.fillRect(ox+a,oy+b,w,hh)};if(C.wt[j]||!C.g[j])return;
  if(h(90)<.16&&!o){const px=4+((h(91)*20)|0),py=8+((h(92)*16)|0);F('#6f6152',px,py+1,5,3);F('#6f6152',px+1,py,3,1);F('#a39581',px+1,py+1,2,1);if(h(93)<.5){F('#6f6152',px+7,py+3,3,2);F('#a39581',px+7,py+3,1,1)}}}
