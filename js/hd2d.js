/* HD-2D の仕上げ（マップだけ。ふきだし・文字・UIはかえない。設定の「HD-2D」で入り・切り）
   - 時間の光の色（明け方・昼・夕方。夜はいまの暗さのまま）と、天気の光（雨・あらし・雪）
   - 空気の遠近（画面の上＝奥ほど、少し青く・うすく）
   - 明るい所のにじみ（画面を小さくして、明るい所だけをのこし、なめらかに大きくして screen でかさねる。あかりに色はかぶせない）
   - 見せ場（なかまが来る・オオカゲの登場・御神木が育つ、hdBig）は、にじみを強く
   - かげの向きと長さ（朝は西・夕方は東へかたむき、朝・夕方は長く、昼は短い。shadow() と落ち影が sunLen・sunLean を見る）
   - にじみは、設定の「にじみ」で入り・切り（HDGLOW。自動ではかえない。持ち主がきめた。上下のぼかしは、持ち主がきめてなくした）
   作業用のキャンバスは画面の1/6・1/12の大きさ（iPhone の縦画面で約0.5MB）。小さくした絵（にじみのもと）は2コマに1回だけ作りなおす（HDEVERY） */
let HD2D=true;try{if(KV.getItem('hakoniwa-hd2d')==='0')HD2D=false}catch(e){}
function setHd2d(v){HD2D=!!v;try{KV.setItem('hakoniwa-hd2d',HD2D?'1':'0')}catch(e){}}
let HDGLOW=true;try{if(KV.getItem('hakoniwa-hdglow')==='0')HDGLOW=false}catch(e){}
function setHdGlow(v){HDGLOW=!!v;try{KV.setItem('hakoniwa-hdglow',HDGLOW?'1':'0')}catch(e){}}
const HDAIR=.16;/* 空気の遠近：画面のいちばん上のこさ */
const HDLONG=.8;/* かげの長さ：朝6時・夕方18時に、昼より 0.8 ぶん長い */
const HDLEAN=.6;/* 落ち影のかたむき：朝6時・夕方18時に、根もとから1上がるごとに、よこへ 0.6 */
const HDC={a:null,b:null,c:null,n:0};
const HDA=6,HDB=12;/* 小さくした絵の大きさ：画面の1/6・1/12 */
const HDEVERY=2;/* 小さくした絵を作りなおすのは、このコマ数に1回（あいだのコマは前の絵を使う） */
let HDBIG=0,HDLEN=1,HDSUN=0;
function hdCv(c,w,h){if(!c)c=document.createElement('canvas');if(c.width!==w||c.height!==h){c.width=w;c.height=h}return c}
function hdBig(ms){HDBIG=Math.max(HDBIG,performance.now()+ms)}/* 見せ場：そのあいだ、にじみを強く */
function sunLen(){return HDLEN}/* かげの長さ（昼1） */
function sunLean(){return HDSUN}/* かげのかたむき：－1 朝（かげは西へ）・0 昼・+1 夕方（東へ） */
function hdFrame(){/* 1コマに1回（render のはじめ） */
  if(!HD2D){HDLEN=1;HDSUN=0;return}const h=hour();HDLEN=h<6||h>18?1:1+HDLONG*Math.abs(h-12)/6;HDSUN=h<6||h>18?0:(h-12)/6}
function hdTint(h){/* 時間の光の色（soft-light でかさねる色と、こさ） */
  if(h>=5&&h<8){const q=h<6.5?(h-5)/1.5:1-(h-6.5)/1.5;return['255,176,170',.55*q]}/* 明け方：うすいピンク */
  if(h>=8&&h<15.5)return['255,236,196',.24];/* 昼：ほんのりあたたかい */
  if(h>=15.5&&h<20){const q=h<18?(h-15.5)/2.5:1-(h-18)/2;return['255,150,72',.2+.3*q]}/* 夕方：オレンジ（光の帯がうもれないこさ） */
  return null}
function hdWx(){/* 天気の光（multiply でかさねる色と、こさ） */
  if(typeof stormNow==='function'&&stormNow())return['150,165,195',.5];/* あらし：青く暗く */
  if(S.rain)return typeof snowNow==='function'&&snowNow()?['215,225,245',.3]:['185,198,222',.42];/* 雪：つめたい白・雨：青みの灰色 */
  return null}
function hdPost(dk,now){/* 夜の暗さのあと・ふきだしの前に、画面（デバイスの点）で */if(!HD2D)return;const c=ctx,cv=c.canvas,W0=cv.width,H0=cv.height;if(!W0||!H0)return;
  c.save();c.setTransform(1,0,0,1,0,0);const h=hour(),big=now<HDBIG?Math.min(1,(HDBIG-now)/600):0;
  {const t=hdTint(h);if(t&&t[1]>0){c.globalCompositeOperation='soft-light';c.fillStyle='rgba('+t[0]+','+t[1]+')';c.fillRect(0,0,W0,H0)}}
  {const w=hdWx();if(w){c.globalCompositeOperation='multiply';c.fillStyle='rgba('+w[0]+','+w[1]+')';c.fillRect(0,0,W0,H0)}}
  c.globalCompositeOperation='source-over';
  {const a=HDAIR*(1-Math.min(1,dk/.4));if(a>0){const g=c.createLinearGradient(0,0,0,H0*.55);g.addColorStop(0,'rgba(200,216,236,'+a+')');g.addColorStop(1,'rgba(200,216,236,0)');c.fillStyle=g;c.fillRect(0,0,W0,H0*.55)}}/* 空気の遠近：奥ほど少し青く・うすく（夜はなし） */
  if(!HDGLOW){c.restore();return}/* にじみ：切り */
  const aw=Math.max(1,Math.round(W0/HDA)),ah=Math.max(1,Math.round(H0/HDA)),bw=Math.max(1,Math.round(W0/HDB)),bh=Math.max(1,Math.round(H0/HDB));const fresh=!HDC.b||HDC.b.width!==bw||HDC.b.height!==bh||++HDC.n>=HDEVERY;if(fresh)HDC.n=0;
  const B=HDC.b=hdCv(HDC.b,bw,bh),C=HDC.c=hdCv(HDC.c,bw,bh),gb=B.getContext('2d'),gc=C.getContext('2d');
  for(const g of[gb,gc]){g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.globalCompositeOperation='source-over';g.globalAlpha=1}
  if(fresh){gb.clearRect(0,0,bw,bh);const A=HDC.a=hdCv(HDC.a,aw,ah),ga=A.getContext('2d');ga.imageSmoothingEnabled=true;ga.imageSmoothingQuality='high';ga.drawImage(cv,0,0,aw,ah);gb.drawImage(A,0,0,bw,bh)}/* 2だんでちぢめると、なめらかになる */
  c.imageSmoothingEnabled=true;
  {/* にじみ：明るい所だけ（かけ算を2回で、暗い所はほぼ黒） */
    if(fresh){gc.clearRect(0,0,bw,bh);gc.drawImage(B,0,0);gc.globalCompositeOperation='multiply';gc.drawImage(B,0,0);gc.drawImage(B,0,0);gc.globalCompositeOperation='source-over'}
    c.globalCompositeOperation='screen';c.globalAlpha=Math.min(1,(dk>.05?.7:.48)*(1+.35*big));c.drawImage(C,0,0,W0,H0);c.globalCompositeOperation='source-over';c.globalAlpha=1}
  c.restore()}
function hdCastStretch(bx,by,fn){/* 落ち影：根もと（bx,by）から、かげの長さぶん奥へのばし、太陽の向きへかたむける */if(HDLEN===1&&!HDSUN)return fn();ctx.save();ctx.translate(bx,by);ctx.transform(1,0,-HDSUN*HDLEAN,1,0,0);ctx.scale(1,HDLEN);ctx.translate(-bx,-by);fn();ctx.restore()}
