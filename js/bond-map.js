/* なかよしの図（メニューの「なかよし」）：村のせいれいの顔を輪にならべ、なかよし（S.bond）30から線でつなぐ。
   線は1ドットの直線（ドット絵）：30〜59は1ドット・60〜99は2ドット・100は3ドット。けんか中（S.qr）の2人は赤い線。顔をタップすると、その子の画面。 */
const BMAPW=120,BMAPR=46,BMAPC={a:'#b58a5a',b:'#c9707f',q:'#d2473a'};
function bondMapLine(g,x0,y0,x1,y1,w){x0|=0;y0|=0;x1|=0;y1|=0;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,o=-((w-1)>>1);let e=dx+dy;
  for(;;){g.fillRect(x0+o,y0+o,w,w);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}/* ブレゼンハムの線を、w ドットの四角でならべる */
let BMSEL=null;/* えらんだせいれいの id（その子の線だけこく、なかよしの一覧を出す） */
const BMRING=12,BMR0=54,BMRD=17;/* 1つの輪にならべる数・いちばん外の輪の半径・輪のあいだ（図の点） */
function bondMapPos(n){/* 顔の場所：BMRING 人ずつ、外の輪から内へ。となりの輪は半分ずらす */const rings=Math.ceil(n/BMRING),P=[];let k=0;
  for(let g=0;g<rings;g++){const m=Math.min(BMRING,n-k)||1,rad=n<=BMRING?BMR0-8:BMR0-g*BMRD;for(let i=0;i<m;i++,k++){const a=-Math.PI/2+(i+(g%2)*.5)*2*Math.PI/m;P.push({x:Math.round(BMAPW/2+Math.cos(a)*rad),y:Math.round(BMAPW/2+Math.sin(a)*rad)})}}return P}
function bondMapSec(body){const R=S.res.slice();
  if(R.length<2){body.appendChild(nodata('heart','なかまがふえたら、ここに出るよ'));return}
  if(!R.some(r=>r.id===BMSEL))BMSEL=null;
  const sec=el('<div class="sec"><div class="bmap" style="position:relative;width:100%;max-width:420px;margin:0 auto;aspect-ratio:1"><canvas style="position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated"></canvas></div><p class="note bml" style="text-align:center"></p><div class="rows bmlist"></div></div>'),box=sec.querySelector('.bmap'),cv=sec.querySelector('canvas');
  cv.width=cv.height=BMAPW;const g=cv.getContext('2d'),n=R.length,XY=bondMapPos(n),P=R.map((r,i)=>({r,x:XY[i].x,y:XY[i].y})),sel=R.find(r=>r.id===BMSEL)||null;
  const Q=S.qr&&!S.qr.mk?S.qr:null;let pairs=0;const lines=[];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=P[i],b=P[j],v=bondOf(a.r,b.r),q=Q&&qrPair(a.r,b.r);if(v<BOND_TALK&&!q)continue;pairs++;lines.push({a,b,v,q,on:!sel||a.r===sel||b.r===sel})}
  for(const L of lines.sort((x,y)=>x.on-y.on)){g.globalAlpha=L.on?1:.22;g.fillStyle=L.q?BMAPC.q:L.v>=BOND_MAX?BMAPC.b:BMAPC.a;bondMapLine(g,L.a.x,L.a.y,L.b.x,L.b.y,L.q?2:L.v>=BOND_MAX?3:L.v>=BOND_PLAY?2:1)}g.globalAlpha=1;/* えらんだ子の線は上に、ほかはうすく */
  let dmin=BMAPW;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)dmin=Math.min(dmin,Math.hypot(P[i].x-P[j].x,P[i].y-P[j].y));
  const fu=Math.max(9,Math.min(22,Math.floor(dmin*.85))),fw=fu/BMAPW*100,names=n<=BMRING;/* 顔の大きさ：となりの顔とかさならない大きさ（図の点）。人数が多いときは、名前は下の一覧に */
  for(const p of P){const b=el('<button class="bmface" style="position:absolute;padding:0;border:0;background:none;cursor:pointer"><img alt="" style="width:100%;height:100%;image-rendering:pixelated;display:block"><small style="position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;font-size:10px"></small></button>');
    b.style.width=b.style.height=fw+'%';b.style.left=((p.x-fu/2)/BMAPW*100)+'%';b.style.top=((p.y-fu/2)/BMAPW*100)+'%';b.querySelector('img').src=spiritPort(p.r.elem,96,p.r.vr);if(names||p.r===sel)b.querySelector('small').textContent=p.r.name;b.setAttribute('aria-label',p.r.name);
    if(sel&&p.r!==sel)b.style.opacity='.5';
    b.onclick=()=>{sfx('tap');if(p.r===sel){openSheet('res',p.r.id);return}BMSEL=p.r.id;renderSheet()};box.appendChild(b)}/* 1回めは、えらぶ。えらんだ子をもう1回で、その子の画面 */
  sec.querySelector('.bml').textContent=sel?sel.name+'のなかよし':pairs?'顔をえらぶと、なかよしが出る':'なかよしの2人は、まだいない';
  if(sel){const L=sec.querySelector('.bmlist'),M=R.filter(q=>q!==sel).map(q=>({q,v:bondOf(sel,q),z:Q&&qrPair(sel,q)})).filter(o=>o.v>=BOND_TALK||o.z).sort((x,y)=>y.v-x.v);
    {const row=rowEl(sel.name,ELEM[sel.elem].name+'のせいれい'),b=el('<button class="btn">見る</button>');b.onclick=()=>{sfx('tap');openSheet('res',sel.id)};row.appendChild(b);L.appendChild(row)}
    for(const o of M)L.appendChild(rowEl(o.q.name,o.z?'けんか中':o.v>=BOND_MAX?'とてもなかよし':o.v>=BOND_PLAY?'もっとなかよし':'なかよし'));
    if(!M.length)L.appendChild(nodata('heart','なかよしは、まだいない'))}
  body.appendChild(sec)}
