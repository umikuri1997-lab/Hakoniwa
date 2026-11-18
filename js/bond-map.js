/* なかよしの図（メニューの「なかよし」）：村のせいれいの顔を輪にならべ、なかよし（S.bond）30から線でつなぐ。
   線は1ドットの直線（ドット絵）：30〜59は1ドット・60〜99は2ドット・100は3ドット。けんか中（S.qr）の2人は赤い線。顔をタップすると、その子の画面。 */
const BMAPW=120,BMAPR=46,BMAPC={a:'#b58a5a',b:'#c9707f',q:'#d2473a'};
function bondMapLine(g,x0,y0,x1,y1,w){x0|=0;y0|=0;x1|=0;y1|=0;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,o=-((w-1)>>1);let e=dx+dy;
  for(;;){g.fillRect(x0+o,y0+o,w,w);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}/* ブレゼンハムの線を、w ドットの四角でならべる */
function bondMapSec(body){const R=S.res.slice();
  if(R.length<2){body.appendChild(nodata('heart','なかまがふえたら、ここに出るよ'));return}
  const sec=el('<div class="sec"><div class="bmap" style="position:relative;width:100%;max-width:420px;margin:0 auto;aspect-ratio:1"><canvas style="position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated"></canvas></div><p class="note bml" style="text-align:center"></p></div>'),box=sec.querySelector('.bmap'),cv=sec.querySelector('canvas');
  cv.width=cv.height=BMAPW;const g=cv.getContext('2d'),n=R.length,P=R.map((r,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return{r,x:Math.round(BMAPW/2+Math.cos(a)*BMAPR),y:Math.round(BMAPW/2+Math.sin(a)*BMAPR)}});
  const Q=S.qr&&!S.qr.mk?S.qr:null;let pairs=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=P[i],b=P[j],v=bondOf(a.r,b.r),q=Q&&qrPair(a.r,b.r);if(v<BOND_TALK&&!q)continue;pairs++;g.fillStyle=q?BMAPC.q:v>=BOND_MAX?BMAPC.b:BMAPC.a;bondMapLine(g,a.x,a.y,b.x,b.y,q?2:v>=BOND_MAX?3:v>=BOND_PLAY?2:1)}
  const fs=Math.max(28,Math.min(52,Math.round(300/n)));/* 顔の大きさ（人数が多いほど小さく） */
  for(const p of P){const b=el('<button class="bmface" style="position:absolute;padding:0;border:0;background:none;cursor:pointer"><img alt="" style="width:100%;height:100%;image-rendering:pixelated;display:block"><small style="position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;font-size:10px"></small></button>');
    b.style.width=b.style.height=fs+'px';b.style.left='calc('+(p.x/BMAPW*100)+'% - '+fs/2+'px)';b.style.top='calc('+(p.y/BMAPW*100)+'% - '+fs/2+'px)';b.querySelector('img').src=spiritPort(p.r.elem,96,p.r.vr);b.querySelector('small').textContent=p.r.name;b.setAttribute('aria-label',p.r.name);
    b.onclick=()=>{sfx('tap');openSheet('res',p.r.id)};box.appendChild(b)}
  sec.querySelector('.bml').textContent=pairs?'線：なかよし・太い線：もっとなかよし'+(Q?'・赤い線：けんか中':''):'なかよしの2人は、まだいない';
  body.appendChild(sec)}
