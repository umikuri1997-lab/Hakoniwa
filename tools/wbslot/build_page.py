# 作業台の立つ位置のページ（Artifact「作業台の立つ位置」）を作る。
# 使い方：python3 tools/wbslot/build_page.py <wbview.cjs が出した json> <出力.html>
# 向きごとに、トンカチを打ちおろした瞬間のせいれいを、ドラッグ・矢じるしでずらし、ずれの数字をコピーする。
# 数字は、ゲームの WBSLOT（js/work-fx.js）に、そのまま入れる（ゲームの点。よこは IQSX・たては IQSY 倍して画面にうつる）。はじめの数は、いまの WBSLOT。
import json, sys
D = json.load(open(sys.argv[1]))
NAMES = {0: '向き0（台は北・せいれいは手前でせなか）', 1: '向き1（台は西・せいれいは手前で横向き）', 2: '向き2（台は南・せいれいは台のむこう）', 3: '向き3（台は東・せいれいは台のむこう）'}
CSS = '''
:root{--bg:#f4ead6;--panel:#ecdfc4;--btn:#e3d2b0;--btn-hi:#efe2c6;--ink:#4a3423;--sub:#7a5d40;--line:#c9a979;--accent:#a8743f;--stage:#b9a27a;
  --font:"DotGothic16","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#2a2119;--panel:#352a20;--btn:#4a3b2c;--btn-hi:#5a4836;--ink:#f1e2c6;--sub:#c9ad87;--line:#6b5640;--accent:#d29a5c;--stage:#5b4a37;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#2a2119;--panel:#352a20;--btn:#4a3b2c;--btn-hi:#5a4836;--ink:#f1e2c6;--sub:#c9ad87;--line:#6b5640;--accent:#d29a5c;--stage:#5b4a37;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font);font-size:15px;line-height:1.6;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:16px 40px}
main{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
h1{font-size:1.4rem;margin:0}
p{margin:0;color:var(--sub);max-width:65ch}
.tabs{display:flex;flex-wrap:wrap;gap:8px}
.tabs button,.ctl button{font:inherit;color:var(--ink);background:var(--btn);border:1px solid var(--line);border-radius:6px;padding:6px 12px;cursor:pointer}
.tabs button[aria-pressed="true"]{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.tabs button:focus-visible,.ctl button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.stage{position:relative;width:100%;max-width:640px;aspect-ratio:1/1;background:var(--stage);border-radius:6px;overflow:hidden;touch-action:none;margin:0 auto}
.stage img{position:absolute;left:0;top:0;width:100%;height:100%;image-rendering:pixelated;pointer-events:none;user-select:none}
.stage .sp{cursor:grab}
.stage .top{position:absolute;left:0;top:0;width:100%;overflow:hidden}
.stage .top img{height:auto;aspect-ratio:1/1}
.ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center}
.num{font-variant-numeric:tabular-nums;min-width:11em;text-align:center}
.out{display:flex;flex-direction:column;gap:8px;background:var(--panel);border-radius:6px;padding:12px}
.out code{font-family:ui-monospace,Menlo,monospace;font-size:.9rem;word-break:break-all}
'''
JS = '''
const D=window.WBD,st=document.getElementById('stage'),bi=document.getElementById('bench'),si=document.getElementById('spirit'),num=document.getElementById('num'),code=document.getElementById('code'),msg=document.getElementById('msg');
const off={};for(const k in D.init)off[k]=D.init[k].slice();let cur=0;
try{const s=JSON.parse(localStorage.getItem('wbslot')||'null');if(s)for(const k in s)off[k]=s[k]}catch(e){}
const r5=v=>Math.round(v*2)/2,sx=()=>st.clientWidth/D.CW*D.K*D.IQSX,sy=()=>st.clientWidth/D.CW*D.K*D.IQSY;
const tp=document.getElementById('top'),sb=document.getElementById('sbar');
function show(){const R=D.rots[cur];bi.src=R.bench;si.src=R.spirit;sb.src=R.spirit;bi.style.zIndex=1;tp.style.zIndex=2;sb.style.zIndex=2;sb.hidden=R.front;place();
  for(const b of document.querySelectorAll('.tabs button'))b.setAttribute('aria-pressed',String(+b.dataset.k===cur))}
function place(){const o=off[cur],R=D.rots[cur],q=st.clientWidth/D.CW,t='translate('+o[0]*sx()+'px,'+o[1]*sy()+'px)';si.style.transform=t;sb.style.transform=t;
  tp.style.height=R.front?'100%':Math.max(0,R.cut*q)+'px';si.style.width=st.clientWidth+'px';sb.style.clipPath=R.front?'':'inset('+(R.bar+o[1]*D.K*D.IQSY)*q+'px 0 0 0)';num.textContent='よこ '+o[0]+' ・ たて '+o[1];
  code.textContent='const WBSLOT={'+[0,1,2,3].map(k=>k+':['+off[k][0]+','+off[k][1]+']').join(',')+'}';try{localStorage.setItem('wbslot',JSON.stringify(off))}catch(e){}}
for(const b of document.querySelectorAll('.tabs button'))b.onclick=()=>{cur=+b.dataset.k;show()};
for(const b of document.querySelectorAll('[data-d]'))b.onclick=()=>{const[d,a]=b.dataset.d.split(',').map(Number);off[cur][a]=r5(off[cur][a]+d);place()};
document.getElementById('reset').onclick=()=>{off[cur]=D.init[cur].slice();place()};
let drag=null;st.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,o:off[cur].slice()};st.setPointerCapture(e.pointerId)});
st.addEventListener('pointermove',e=>{if(!drag)return;off[cur]=[r5(drag.o[0]+(e.clientX-drag.x)/sx()),r5(drag.o[1]+(e.clientY-drag.y)/sy())];place()});
st.addEventListener('pointerup',()=>{drag=null});st.addEventListener('pointercancel',()=>{drag=null});
window.addEventListener('resize',place);
document.getElementById('copy').onclick=()=>{const t=code.textContent;const ok=()=>{msg.textContent='コピーしました。チャットにはりつけて送ってください。'};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,()=>{sel();msg.textContent='コピーできませんでした。えらんだ字を、自分でコピーしてください。'});else{sel();msg.textContent='えらんだ字を、自分でコピーしてください。'}};
function sel(){const r=document.createRange();r.selectNodeContents(code);const s=getSelection();s.removeAllRanges();s.addRange(r)}
show();
'''
tabs = ''.join('<button type="button" data-k="%d">%s</button>' % (k, '向き%d' % k) for k in range(4))
names = json.dumps({k: v for k, v in NAMES.items()}, ensure_ascii=False)
html = f'''<title>作業台の立つ位置</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap">
<style>{CSS}</style>
<main>
<h1>作業台の立つ位置</h1>
<p>トンカチを打ちおろした瞬間のせいれいです（ゲームの絵を3倍）。台のむこうに立つ向き（2・3）は、ゲームと同じく、天板より下だけが台にかくれます。向きをえらび、せいれいをドラッグするか矢じるしで、台の前でちょうど作業している位置にずらしてください。4つの向きをきめたら、下の「コピー」をおして、チャットにはりつけて送ってください。</p>
<div class="tabs" role="group" aria-label="向き">{tabs}</div>
<p id="rname"></p>
<div class="stage" id="stage"><img id="bench" alt="作業台"><div id="top" class="top"><img id="spirit" class="sp" alt="せいれい"></div><img id="sbar" class="sp" alt=""></div>
<div class="ctl">
<button type="button" data-d="-0.5,0" aria-label="左へ">←</button><button type="button" data-d="0.5,0" aria-label="右へ">→</button>
<button type="button" data-d="-0.5,1" aria-label="上へ">↑</button><button type="button" data-d="0.5,1" aria-label="下へ">↓</button>
<span class="num" id="num"></span><button type="button" id="reset">この向きをもとにもどす</button></div>
<div class="out"><code id="code"></code><div class="ctl" style="justify-content:flex-start"><button type="button" id="copy">コピー</button><span id="msg"></span></div></div>
</main>
<script>window.WBD={json.dumps(D)};const NM={names};</script>
<script>{JS}
const rn=document.getElementById('rname');const _show=show;show=function(){{_show();rn.textContent=NM[cur]}};show();
</script>
'''
open(sys.argv[2], 'w').write(html)
print('→', sys.argv[2], len(html)//1024, 'KB')
