/* HD-2D の仕上げ（マップだけ。ふきだし・文字・UIはかえない。設定の「HD-2D」で入り・切り）
   - 時間の光の色（明け方・昼・夕方。夜はいまの暗さのまま）と、天気の光（雨・あらし・雪）
   - 空気の遠近（画面の上＝奥ほど、少し青く・うすく）
   - 明るい所のにじみ（画面を小さくして、明るい所だけをのこし、なめらかに大きくして screen でかさねる。あかりに色はかぶせない）
   - 上下のぼかし（ピントの帯の外をぼかす。帯は会話の話す子・見守る子に合わせて動く。案内の場所・置く場所・画面をひらいた子のまわりはぼかさない）
   - 見せ場（なかまが来る・オオカゲの登場・御神木が育つ、hdBig）は、ピントをせまく、にじみを強く
   - かげの向きと長さ（朝は西・夕方は東へかたむき、朝・夕方は長く、昼は短い。shadow() と落ち影が sunLen・sunLean を見る）
   - 重いとき（1コマが長いとき）は、自動で軽くする（HDQ：1 にじみなし・小さくする回数をへらす、2 ぼかしもなし）
   作業用のキャンバスは画面の1/6・1/12の大きさ（iPhone の縦画面で約0.5MB）。小さくした絵（ぼかし・にじみのもと）は2コマに1回だけ作りなおす（HDEVERY） */
let HD2D=true;try{if(KV.getItem('hakoniwa-hd2d')==='0')HD2D=false}catch(e){}
function setHd2d(v){HD2D=!!v;try{KV.setItem('hakoniwa-hd2d',HD2D?'1':'0')}catch(e){}HDQ=0;HDQT=0}
const HDBAND=.15,HDBANDBIG=.09;/* ピントの帯のはば（帯のまん中から上と下へ、画面の高さのわりあい）。見せ場はせまく */
const HDFY0=.55;/* ふだんのピントの帯のまん中（画面の高さのわりあい） */
const HDHOLE=1.8;/* ぼかさない所の半径（マス） */
const HDAIR=.16;/* 空気の遠近：画面のいちばん上のこさ */
const HDLONG=.8;/* かげの長さ：朝6時・夕方18時に、昼より 0.8 ぶん長い */
const HDLEAN=.6;/* 落ち影のかたむき：朝6時・夕方18時に、根もとから1上がるごとに、よこへ 0.6 */
const HDSLOW=26,HDFAST=19;/* 1コマの時間（ミリ秒）：これより長いのが3秒つづいたら軽く・これより短いのが10秒つづいたら1つもどす */
const HDC={a:null,b:null,c:null,d:null,n:0};
const HDA=6,HDB=12;/* 小さくした絵の大きさ：画面の1/6・1/12 */
const HDEVERY=2;/* 小さくした絵を作りなおすのは、このコマ数に1回（あいだのコマは前の絵を使う） */
let TUTWP=null;/* タップの案内がさしているマップの場所（main.js の updTut） */
let HDBIG=0,HDFY=HDFY0,HDQ=0,HDQT=0,HDLT=0,HDMS=16.7,HDLEN=1,HDSUN=0;
function hdCv(c,w,h){if(!c)c=document.createElement('canvas');if(c.width!==w||c.height!==h){c.width=w;c.height=h}return c}
function hdBig(ms){HDBIG=Math.max(HDBIG,performance.now()+ms)}/* 見せ場：そのあいだ、ピントをせまく・にじみを強く */
function sunLen(){return HDLEN}/* かげの長さ（昼1） */
function sunLean(){return HDSUN}/* かげのかたむき：−1 朝（かげは西へ）・0 昼・+1 夕方（東へ） */
function hdFrame(){/* 1コマに1回（render のはじめ） */const now=performance.now();
  if(!HD2D){HDLEN=1;HDSUN=0;HDLT=now;return}const h=hour();HDLEN=h<6||h>18?1:1+HDLONG*Math.abs(h-12)/6;HDSUN=h<6||h>18?0:(h-12)/6;
  {const dt=now-HDLT;HDLT=now;if(dt>0&&dt<200){HDMS+=(dt-HDMS)*.05;/* 1コマの時間をならす */
    if(HDMS>HDSLOW&&HDQ<2){HDQT+=dt;if(HDQT>3000){HDQ++;HDQT=0;HDMS=16.7}}else if(HDMS<HDFAST&&HDQ>0){HDQT-=dt;if(HDQT<-10000){HDQ--;HDQT=0}}else HDQT=0}}}
function hdTint(h){/* 時間の光の色（soft-light でかさねる色と、こさ） */
  if(h>=5&&h<8){const q=h<6.5?(h-5)/1.5:1-(h-6.5)/1.5;return['255,176,170',.55*q]}/* 明け方：うすいピンク */
  if(h>=8&&h<15.5)return['255,236,196',.24];/* 昼：ほんのりあたたかい */
  if(h>=15.5&&h<20){const q=h<18?(h-15.5)/2.5:1-(h-18)/2;return['255,150,72',.2+.3*q]}/* 夕方：オレンジ（光の帯がうもれないこさ） */
  return null}
function hdWx(){/* 天気の光（multiply でかさねる色と、こさ） */
  if(typeof stormNow==='function'&&stormNow())return['150,165,195',.5];/* あらし：青く暗く */
  if(S.rain)return typeof snowNow==='function'&&snowNow()?['215,225,245',.3]:['185,198,222',.42];/* 雪：つめたい白・雨：青みの灰色 */
  return null}
function hdScreenY(wy){return (wy-cam.y)*cam.z/VH}/* マップのたての場所 → 画面の高さのわりあい */
function hdFocusTarget(){/* ピントを合わせる物（マップの場所）：会話の話す子 → 見守る子 */
  const dl=document.getElementById('dialog');
  if(dl&&!dl.hidden&&typeof DLGA!=='undefined'&&DLGA.who){if(DLGA.who===GOD&&godHere())return[godX()*TS,(godY()-.5)*TS];const r=S.res.find(q=>q.name===DLGA.who&&!q.hidden);if(r)return[r.x*TS,(r.y-.5)*TS-hiAt((r.y|0)*W+(r.x|0))*LIFT]}
  if(typeof FOLLOW!=='undefined'&&FOLLOW){const r=S.res.find(q=>q.id===FOLLOW.id);if(r)return[r.x*TS,(r.y-.5)*TS-hiAt((r.y|0)*W+(r.x|0))*LIFT]}
  return null}
function hdHoles(){/* ぼかさない所（マップの場所）：案内のさす所・置く場所・画面をひらいた子 */const L=[];
  if(TUTWP)L.push(TUTWP);
  if(typeof pending!=='undefined'&&pending&&pending.x!=null)L.push([(pending.x+.5)*TS,(pending.y+.5)*TS-hiAt(pending.y*W+pending.x)*LIFT]);
  if(sheet==='res'){const r=S.res.find(q=>q.id===sheetArg);if(r)L.push([r.x*TS,(r.y-.5)*TS-hiAt((r.y|0)*W+(r.x|0))*LIFT])}
  return L}
function hdPost(dk,now){/* 夜の暗さのあと・ふきだしの前に、画面（デバイスの点）で */if(!HD2D)return;const c=ctx,cv=c.canvas,W0=cv.width,H0=cv.height;if(!W0||!H0)return;
  c.save();c.setTransform(1,0,0,1,0,0);const h=hour(),big=now<HDBIG?Math.min(1,(HDBIG-now)/600):0;
  {const t=hdTint(h);if(t&&t[1]>0){c.globalCompositeOperation='soft-light';c.fillStyle='rgba('+t[0]+','+t[1]+')';c.fillRect(0,0,W0,H0)}}
  {const w=hdWx();if(w){c.globalCompositeOperation='multiply';c.fillStyle='rgba('+w[0]+','+w[1]+')';c.fillRect(0,0,W0,H0)}}
  c.globalCompositeOperation='source-over';
  {const a=HDAIR*(1-Math.min(1,dk/.4));if(a>0){const g=c.createLinearGradient(0,0,0,H0*.55);g.addColorStop(0,'rgba(200,216,236,'+a+')');g.addColorStop(1,'rgba(200,216,236,0)');c.fillStyle=g;c.fillRect(0,0,W0,H0*.55)}}/* 空気の遠近：奥ほど少し青く・うすく（夜はなし） */
  if(HDQ>=2){c.restore();return}/* とても重いとき：色だけ */
  const aw=Math.max(1,Math.round(W0/HDA)),ah=Math.max(1,Math.round(H0/HDA)),bw=Math.max(1,Math.round(W0/HDB)),bh=Math.max(1,Math.round(H0/HDB));const fresh=!HDC.b||HDC.b.width!==bw||HDC.b.height!==bh||HDC.q!==HDQ||++HDC.n>=HDEVERY;if(fresh){HDC.n=0;HDC.q=HDQ}
  const B=HDC.b=hdCv(HDC.b,bw,bh),C=HDC.c=hdCv(HDC.c,bw,bh),D=HDC.d=hdCv(HDC.d,bw,bh),gb=B.getContext('2d'),gc=C.getContext('2d'),gd=D.getContext('2d');
  for(const g of[gb,gc,gd]){g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.globalCompositeOperation='source-over';g.globalAlpha=1}
  if(fresh){gb.clearRect(0,0,bw,bh);
  if(HDQ===0){const A=HDC.a=hdCv(HDC.a,aw,ah),ga=A.getContext('2d');ga.imageSmoothingEnabled=true;ga.imageSmoothingQuality='high';ga.drawImage(cv,0,0,aw,ah);gb.drawImage(A,0,0,bw,bh)}/* 2だんでちぢめると、なめらかなぼかしになる */
  else{if(HDC.a){HDC.a.width=HDC.a.height=0;HDC.a=null}gb.drawImage(cv,0,0,bw,bh)}}/* 軽くするときは1回で */
  c.imageSmoothingEnabled=true;
  if(HDQ===0){/* にじみ：明るい所だけ（かけ算を2回で、暗い所はほぼ黒） */
    if(fresh){gc.clearRect(0,0,bw,bh);gc.drawImage(B,0,0);gc.globalCompositeOperation='multiply';gc.drawImage(B,0,0);gc.drawImage(B,0,0);gc.globalCompositeOperation='source-over'}
    c.globalCompositeOperation='screen';c.globalAlpha=Math.min(1,(dk>.05?.7:.48)*(1+.35*big));c.drawImage(C,0,0,W0,H0);c.globalCompositeOperation='source-over';c.globalAlpha=1}
  /* ピント：帯のまん中は、ピントを合わせる物へゆっくり動く */
  {const t=hdFocusTarget(),fy=t?Math.max(.25,Math.min(.75,hdScreenY(t[1]))):HDFY0;HDFY+=(fy-HDFY)*.08}
  const bd=HDBAND+(HDBANDBIG-HDBAND)*big,f0=Math.max(.02,HDFY-bd),f1=Math.min(.98,HDFY+bd);
  gd.clearRect(0,0,bw,bh);gd.drawImage(B,0,0);gd.globalCompositeOperation='destination-in';
  {const gr=gd.createLinearGradient(0,0,0,bh),e=.12;gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(Math.max(0,f0-e),'rgba(0,0,0,1)');gr.addColorStop(f0,'rgba(0,0,0,0)');gr.addColorStop(f1,'rgba(0,0,0,0)');gr.addColorStop(Math.min(1,f1+e),'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,1)');gd.fillStyle=gr;gd.fillRect(0,0,bw,bh)}
  gd.globalCompositeOperation='destination-out';
  for(const p of hdHoles()){const sx=(p[0]-cam.x)*cam.z/VW*bw,sy=(p[1]-cam.y)*cam.z/VH*bh,R=HDHOLE*TS*cam.z/VW*bw;if(sx<-R||sy<-R||sx>bw+R||sy>bh+R)continue;const g=gd.createRadialGradient(sx,sy,R*.45,sx,sy,R);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');gd.fillStyle=g;gd.fillRect(sx-R,sy-R,R*2,R*2)}/* 大事な所はぼかさない */
  gd.globalCompositeOperation='source-over';
  c.drawImage(D,0,0,W0,H0);
  c.restore()}
function hdCastStretch(bx,by,fn){/* 落ち影：根もと（bx,by）から、かげの長さぶん奥へのばし、太陽の向きへかたむける */if(HDLEN===1&&!HDSUN)return fn();ctx.save();ctx.translate(bx,by);ctx.transform(1,0,-HDSUN*HDLEAN,1,0,0);ctx.scale(1,HDLEN);ctx.translate(-bx,-by);fn();ctx.restore()}
