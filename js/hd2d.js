/* HD-2D の仕上げ（マップだけ。ふきだし・文字・UIはかえない。設定の「HD-2D」で入り・切り）
   - 時間の光の色（明け方・昼・夕方。夜はいまの暗さのまま）
   - 明るい所のにじみ（画面を小さくして、明るい所だけをのこし、なめらかに大きくして screen でかさねる。あかりに色はかぶせない）
   - 上下のぼかし（小さくした絵を、上と下のはしにだけかさねる）
   - 足もとのかげの向き（shadow() が sunLean を見る）
   作業用のキャンバスは画面の1/4・1/8の大きさ（iPhone の縦画面で約1MB） */
let HD2D=true;try{if(KV.getItem('hakoniwa-hd2d')==='0')HD2D=false}catch(e){}
function setHd2d(v){HD2D=!!v;try{KV.setItem('hakoniwa-hd2d',HD2D?'1':'0')}catch(e){}}
const HDTOP=.4,HDBOT=.3;/* ぼかす所：上は画面の4わり、下は3わり（はしは上の欄・下のバーにかくれるので、見えるのは上3わり・下2わりくらい） */
const HDC={a:null,b:null,c:null,d:null,w:0,h:0};
function hdCv(c,w,h){if(!c)c=document.createElement('canvas');if(c.width!==w||c.height!==h){c.width=w;c.height=h}return c}
let HDSUN=0;/* 太陽の向き：−1 朝（東から。かげは西へ）・0 昼・+1 夕方 */
function sunLean(){return HDSUN}
function hdFrame(){/* 1コマに1回（render のはじめ） */if(!HD2D){HDSUN=0;return}const h=hour();HDSUN=h<5.5||h>19?0:Math.max(-1,Math.min(1,(h-12.25)/6))}
function hdTint(h){/* 時間の光の色（soft-light でかさねる色と、こさ） */
  if(h>=5&&h<8){const q=h<6.5?(h-5)/1.5:1-(h-6.5)/1.5;return['255,176,170',.55*q]}/* 明け方：うすいピンク */
  if(h>=8&&h<15.5)return['255,236,196',.24];/* 昼：ほんのりあたたかい */
  if(h>=15.5&&h<20){const q=h<18?(h-15.5)/2.5:1-(h-18)/2;return['255,150,72',.24+.5*q]}/* 夕方：オレンジ */
  return null}
function hdPost(dk,now){/* 夜の暗さのあと・ふきだしの前に、画面（デバイスの点）で */if(!HD2D)return;const c=ctx,cv=c.canvas,W0=cv.width,H0=cv.height;if(!W0||!H0)return;
  c.save();c.setTransform(1,0,0,1,0,0);const h=hour();
  {const t=hdTint(h);if(t&&t[1]>0){c.globalCompositeOperation='soft-light';c.fillStyle='rgba('+t[0]+','+t[1]+')';c.fillRect(0,0,W0,H0);c.globalCompositeOperation='source-over'}}
  const aw=Math.max(1,Math.round(W0/4)),ah=Math.max(1,Math.round(H0/4)),bw=Math.max(1,Math.round(W0/8)),bh=Math.max(1,Math.round(H0/8));
  const A=HDC.a=hdCv(HDC.a,aw,ah),B=HDC.b=hdCv(HDC.b,bw,bh),C=HDC.c=hdCv(HDC.c,bw,bh),D=HDC.d=hdCv(HDC.d,bw,bh);
  const ga=A.getContext('2d'),gb=B.getContext('2d'),gc=C.getContext('2d'),gd=D.getContext('2d');for(const g of[ga,gb,gc,gd]){g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.globalCompositeOperation='source-over';g.globalAlpha=1}
  ga.drawImage(cv,0,0,aw,ah);gb.clearRect(0,0,bw,bh);gb.drawImage(A,0,0,bw,bh);/* 2だんでちぢめると、なめらかなぼかしになる */
  /* にじみ：明るい所だけ（かけ算を2回で、暗い所はほぼ黒） */
  gc.clearRect(0,0,bw,bh);gc.drawImage(B,0,0);gc.globalCompositeOperation='multiply';gc.drawImage(B,0,0);gc.drawImage(B,0,0);gc.globalCompositeOperation='source-over';
  c.imageSmoothingEnabled=true;c.globalCompositeOperation='screen';c.globalAlpha=dk>.05?.7:.48;c.drawImage(C,0,0,W0,H0);c.globalCompositeOperation='source-over';c.globalAlpha=1;
  /* 上下のぼかし */
  gd.clearRect(0,0,bw,bh);gd.drawImage(B,0,0);gd.globalCompositeOperation='destination-in';const gr=gd.createLinearGradient(0,0,0,bh);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(HDTOP,'rgba(0,0,0,0)');gr.addColorStop(1-HDBOT,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');gd.fillStyle=gr;gd.fillRect(0,0,bw,bh);gd.globalCompositeOperation='source-over';
  c.drawImage(D,0,0,W0,H0);
  c.restore()}
