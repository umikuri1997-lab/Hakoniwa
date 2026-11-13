# すわる位置のページ（Artifact「すわる位置」）を作る。
# 使い方：python3 tools/seat/build_page.py <seatview.cjs が出した json> <出力.html>
# 家具ごと（タブ）・向きごとに、すわったせいれいをドラッグ・矢じるしでずらし、ずれの数字（1マス64ドットのドット）をコピーする。
# 送られた数字は、ゲームの SEATOFF（village.js）に、÷2 して入れる（ゲームの点は1マス32）。
import json, sys
D = json.load(open(sys.argv[1]))
CSS = '''
:root{--bg:#f4e9d2;--panel:#efe0c2;--btn:#e8d9b9;--btn-hi:#f3e7cc;--accent:#a8743f;--ink:#4a3423;--sub:#7a5d40;--line:#c9a979;--ground:#d9c39c;
  --font:"DotGothic16","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;color-scheme:light}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#2a2119;--panel:#352a20;--btn:#4a3b2c;--btn-hi:#5a4836;--accent:#d29a5c;--ink:#f1e2c6;--sub:#c9ad87;--line:#6b5640;--ground:#5b4a37;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#2a2119;--panel:#352a20;--btn:#4a3b2c;--btn-hi:#5a4836;--accent:#d29a5c;--ink:#f1e2c6;--sub:#c9ad87;--line:#6b5640;--ground:#5b4a37;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font);font-size:15px;line-height:1.6;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px 40px}
.wrap{max-width:980px;margin:0 auto;display:grid;gap:18px}
h1{font-size:22px;font-weight:400;margin:0;text-wrap:balance}
.lead{margin:0;color:var(--sub)}
.bar{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center}
.bar label{display:flex;gap:6px;align-items:center;cursor:pointer}
.tabs{display:flex;flex-wrap:wrap;gap:8px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
.card{background:var(--panel);border:2px solid var(--line);padding:12px;display:grid;gap:10px;min-width:0}
.card h2{font-size:16px;font-weight:400;margin:0;display:flex;justify-content:space-between;gap:8px}
.card h2 span{color:var(--sub);font-variant-numeric:tabular-nums}
canvas{width:100%;max-width:100%;image-rendering:pixelated;background:var(--ground);touch-action:none;cursor:grab;display:block;margin:0 auto}
canvas:active{cursor:grabbing}
.pad{display:grid;grid-template-columns:repeat(3,44px);grid-template-rows:repeat(2,36px);gap:4px;justify-content:center}
.pad .u{grid-column:2}.pad .l{grid-column:1;grid-row:2}.pad .d{grid-column:2;grid-row:2}.pad .r{grid-column:3;grid-row:2}
button{font:inherit;color:var(--ink);background:linear-gradient(var(--btn-hi) 50%,var(--btn) 50%);border:2px solid var(--line);box-shadow:0 3px 0 var(--line);padding:2px 10px;cursor:pointer;min-height:32px}
button:active{transform:translateY(3px);box-shadow:none}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.tabs button[aria-pressed="true"],.main{background:linear-gradient(#c79058 50%,var(--accent) 50%);color:#fff8ec}
.reset{justify-self:center;font-size:13px}
.out{background:var(--panel);border:2px solid var(--line);padding:12px;display:grid;gap:10px}
.out pre{margin:0;padding:10px;background:var(--bg);border:1px solid var(--line);overflow-x:auto;font-size:14px;white-space:pre-wrap;word-break:break-all}
.out .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.msg{color:var(--sub);font-size:13px}
@media (prefers-reduced-motion:reduce){button:active{transform:none}}
'''
BODY = '''<div class="wrap">
  <h1>すわる位置</h1>
  <p class="lead">家具にすわったせいれいを、絵をドラッグするか矢じるしでずらします。1回で1ドットうごきます。家具は上のボタンでかえられます。きまったら、下の数字をコピーして送ってください（ぜんぶの家具の数字が入ります）。</p>
  <div class="tabs" id="tabs" role="group" aria-label="家具"></div>
  <div class="bar">
    <label><input type="checkbox" id="link" checked> 右向きと左向きを、左右反対で同じにする</label>
    <label>大きさ <select id="zoom"><option value="1">ゲームと同じくらい</option><option value="2" selected>2倍</option><option value="3">3倍</option></select></label>
  </div>
  <div class="cards" id="cards"></div>
  <div class="out">
    <div class="row"><button class="main" id="copy">数字をコピー</button><span class="msg" id="msg">ずれは、いまのゲームの位置からのドット数（右と下がプラス）。はじめは 0（いまのゲームの位置）</span></div>
    <pre id="txt"></pre>
  </div>
</div>
'''
JS = '''
const NAMES={0:'正面',1:'右向き',2:'うしろ',3:'左向き'};
const OFF={};for(const s of D.seats){OFF[s.id]={};for(const r of s.rots)OFF[s.id][r.k]=[0,0]}
try{const sv=JSON.parse(localStorage.getItem('seatoff')||'null');if(sv)for(const id in sv)if(OFF[id])for(const k in sv[id])if(OFF[id][k])OFF[id][k]=sv[id][k]}catch(e){}
let cur=D.seats[0].id;const IMG={};let CV={};
function load(src){return new Promise(r=>{if(!src)return r(null);const i=new Image();i.onload=()=>r(i);i.src=src})}
const cards=document.getElementById('cards'),txt=document.getElementById('txt'),link=document.getElementById('link'),zoom=document.getElementById('zoom'),tabs=document.getElementById('tabs');
for(const s of D.seats){const b=document.createElement('button');b.textContent=s.name;b.dataset.id=s.id;b.setAttribute('aria-pressed',String(s.id===cur));tabs.appendChild(b)}
tabs.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;cur=b.dataset.id;for(const t of tabs.children)t.setAttribute('aria-pressed',String(t.dataset.id===cur));build()});
const seat=()=>D.seats.find(s=>s.id===cur);
function build(){cards.innerHTML='';CV={};const s=seat();
  for(const r of s.rots){const k=r.k,nm=s.rots.length===1?'正面':NAMES[k];
    const c=document.createElement('div');c.className='card';
    c.innerHTML=`<h2>${nm}<span id="v${k}"></span></h2><canvas width="${D.CW*D.K}" height="${D.CH*D.K}" aria-label="${s.name}の${nm}にすわったせいれい"></canvas>
    <div class="pad"><button class="u" data-r="${k}" data-d="0,-1" aria-label="上へ">↑</button><button class="l" data-r="${k}" data-d="-1,0" aria-label="左へ">←</button><button class="d" data-r="${k}" data-d="0,1" aria-label="下へ">↓</button><button class="r" data-r="${k}" data-d="1,0" aria-label="右へ">→</button></div>
    <button class="reset" data-reset="${k}">いまのゲームの位置にもどす</button>`;
    cards.appendChild(c);const cv=c.querySelector('canvas');CV[k]=cv;let st=null;
    cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);st={x:e.clientX,y:e.clientY,o:[...OFF[cur][k]]}});
    cv.addEventListener('pointermove',e=>{if(!st)return;const q=cv.getBoundingClientRect().width/(D.CW*2);setOff(k,st.o[0]+Math.round((e.clientX-st.x)/q),st.o[1]+Math.round((e.clientY-st.y)/q))});
    cv.addEventListener('pointerup',()=>st=null);cv.addEventListener('pointercancel',()=>st=null)}
  draw()}
function setOff(k,x,y){const o=OFF[cur];o[k]=[x,y];if(link.checked&&(k===1||k===3)&&o[k===1?3:1])o[k===1?3:1]=[-x,y];try{localStorage.setItem('seatoff',JSON.stringify(OFF))}catch(e){}draw()}
function draw(){const z=+zoom.value,s=seat(),K=D.K;
  for(const r of s.rots){const k=r.k,c=CV[k];if(!c)continue;const g=c.getContext('2d'),im=IMG[cur][k],[dx,dy]=OFF[cur][k];
    c.style.maxWidth=(D.CW*z*2)+'px';g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);
    g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=2;g.strokeRect(D.OX*K,D.OY*K,32*K,32*K);
    if(im.base)g.drawImage(im.base,0,0);
    g.save();if(r.clip!=null){g.beginPath();g.rect(0,0,c.width,(D.OY+r.clip)*K);g.clip()}
    g.drawImage(im.spirit,dx*K/2,dy*K/2);g.restore();
    if(im.front)g.drawImage(im.front,0,0);
    document.getElementById('v'+k).textContent=`よこ ${dx>0?'+':''}${dx}・たて ${dy>0?'+':''}${dy}`}
  const o={};for(const s2 of D.seats){o[s2.id]={};for(const r of s2.rots)o[s2.id][r.k]=OFF[s2.id][r.k]}
  txt.textContent=JSON.stringify(o)}
cards.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.reset!=null){setOff(+b.dataset.reset,0,0);return}
  if(b.dataset.r!=null){const k=+b.dataset.r,[a,c]=b.dataset.d.split(',').map(Number),o=OFF[cur][k];setOff(k,o[0]+a,o[1]+c)}});
link.addEventListener('change',()=>{if(link.checked&&OFF[cur][1])setOff(1,OFF[cur][1][0],OFF[cur][1][1])});
zoom.addEventListener('change',draw);
document.getElementById('copy').addEventListener('click',()=>{const s=txt.textContent,m=document.getElementById('msg');
  const sel=()=>{const rg=document.createRange();rg.selectNodeContents(txt);const w=getSelection();w.removeAllRanges();w.addRange(rg);m.textContent='数字をえらびました。コピーしてください'};
  try{navigator.clipboard.writeText(s).then(()=>m.textContent='コピーしました',sel)}catch(e){sel()}});
Promise.all(D.seats.map(async s=>{IMG[s.id]={};for(const r of s.rots)IMG[s.id][r.k]={base:await load(r.base),spirit:await load(r.spirit),front:await load(r.front)}})).then(build);
'''
html = ('<title>すわる位置</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap">'
        '<style>' + CSS + '</style>' + BODY + '<script>const D=' + json.dumps(D) + ';' + JS + '</script>')   # Artifact がまわりの html・head・body をつける
open(sys.argv[2], 'w').write(html)
print(len(html))
