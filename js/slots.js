'use strict';

/* ---------- セーブスロット（3つ）：ゲームぜんぶ（草原・火山・フリーの村と、おぼえたレシピなど）を、そのときのまましまう。
   オートセーブ（いまの localStorage のセーブ）は、そのまま。スロットは大きくしまえる IndexedDB に。
   スロットをよみこむと、オートセーブをスロットの中身でおきかえて、ページをひらきなおす（そこからオートセーブがつづく） ---------- */
const SLOTN=3,SLOTDB='hakoniwa-slots',SLOTST='slots';
const SLOTSKIP=new Set(['hakoniwa-sound','hakoniwa-test']);/* 音・テストの設定は、スロットに入れない */
const slotGameKey=k=>/^hakoniwa-/.test(k)&&!SLOTSKIP.has(k);
function slotDB(){return new Promise((ok,ng)=>{let q;try{q=indexedDB.open(SLOTDB,1)}catch(e){return ng(e)}q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains(SLOTST))d.createObjectStore(SLOTST)};q.onsuccess=()=>ok(q.result);q.onerror=()=>ng(q.error)})}
function slotReq(mode,f){return slotDB().then(d=>new Promise((ok,ng)=>{const t=d.transaction(SLOTST,mode),r=f(t.objectStore(SLOTST));t.oncomplete=()=>{d.close();ok(r&&r.result)};t.onerror=t.onabort=()=>{d.close();ng(t.error)}}))}
const slotGet=i=>slotReq('readonly',s=>s.get(i)),slotPut=(i,v)=>slotReq('readwrite',s=>s.put(v,i));
function slotKeys(){const L=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&slotGameKey(k))L.push(k)}}catch(e){}return L}
function slotSnap(){/* いまのゲームぜんぶ。動いている村は先にしまう（書き出しと同じ） */if(typeof S!=='undefined'&&S&&started)save();const d={};for(const k of slotKeys()){const v=KV.getItem(k);if(v!=null)d[k]=v}
  for(let w=0;w<LIVE.length;w++){const k=SAVE_KEYS[w];if(k&&LIVE[w]&&!LIVE[w].summary&&LIVE[w].introSeen&&d[k]==null)d[k]=JSON.stringify(LIVE[w])}return d}
function slotSum(d){/* スロットの中身の見出し：村ごとの村レベル・せいれいの人数 */const o=[];for(const w of[0,1,FREE]){const raw=d[SAVE_KEYS[w]];if(!raw||!/"introSeen"\s*:\s*true/.test(raw))continue;const lv=raw.match(/"lv"\s*:\s*(\d+)/);let n=0;try{n=(JSON.parse(raw).res||[]).length}catch(e){}o.push(WORLDS[w].name+' 村レベル'+(lv?lv[1]:1)+'・せいれい'+n+'人')}return o}
const slotTime=t=>{const d=new Date(t),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'/'+p(d.getMonth()+1)+'/'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())};
async function slotSave(i){const data=slotSnap();if(!Object.keys(data).length){toast('しまう村がありません');return false}try{await slotPut(i,{at:Date.now(),data});sfx('good');toast('スロット'+i+'にセーブしました','good');return true}catch(e){toast('セーブできませんでした');return false}}
async function slotLoad(i){let v=null;try{v=await slotGet(i)}catch(e){}if(!v||!v.data){toast('このスロットはからっぽです');return}
  const before={};for(const k of slotKeys())before[k]=KV.getItem(k);NOSAVE=true;let ok=true;
  for(const k in before)if(v.data[k]==null)KV.removeItem(k);/* スロットになかった村（あとで遊びはじめた村など）は消して、そのときにもどす */
  for(const k in v.data){if(!slotGameKey(k)||typeof v.data[k]!=='string')continue;if(!KV.setItem(k,v.data[k])){ok=false;break}}
  if(!ok){for(const k of slotKeys())if(before[k]==null)KV.removeItem(k);for(const k in before)KV.setItem(k,before[k]);NOSAVE=false;toast('ブラウザに保存できないため、よみこめません');return}
  toast('よみこみました。ひらきなおします','good');setTimeout(()=>location.reload(),900)}
function slotPop(canSave){/* メニューの「セーブ」（しまう・よみこむ）と、タイトルの「セーブをえらぶ」（よみこむだけ） */
  const o=el('<div style="position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:360px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><b style="font-size:16px">セーブ</b><p class="note" style="margin:6px 0 10px"></p><div class="rows"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>');
  o.querySelector('.note').textContent=canSave?'オートセーブは、いつもしまわれています。スロットには、いまのゲームぜんぶ（どの村も）をしまえます。':'スロットをよみこむと、そのときのゲームにもどります（いまのオートセーブは、おきかわります）。';
  const close=()=>o.remove();o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};
  const rows=o.querySelector('.rows');
  const draw=async()=>{rows.innerHTML='';for(let i=1;i<=SLOTN;i++){let v=null;try{v=await slotGet(i)}catch(e){}
    const r=el('<div class="sec" style="margin:0 0 8px"><h3></h3><p class="note" style="margin:2px 0 6px"></p><div style="display:flex;gap:8px;flex-wrap:wrap"></div></div>');r.querySelector('h3').textContent='スロット'+i+(v&&v.at?'（'+slotTime(v.at)+'）':'');
    const sm=v&&v.data?slotSum(v.data):[];r.querySelector('p').textContent=v&&v.data?(sm.join('\n')||'村なし'):'からっぽ';r.querySelector('p').style.whiteSpace='pre-line';const bt=r.lastElementChild;
    if(canSave){const b=el('<button class="btn pri">ここにセーブ</button>');b.onclick=async()=>{if(v&&!b.dataset.ok){b.dataset.ok=1;b.textContent='うわがきする（もう一度タップ）';b.style.borderColor='var(--danger)';return}sfx('tap');if(await slotSave(i))draw()};bt.appendChild(b)}
    if(v&&v.data){const b=el('<button class="btn">よみこむ</button>');b.onclick=()=>{if(!b.dataset.ok){b.dataset.ok=1;b.textContent='よみこむ（もう一度タップ）';b.style.borderColor='var(--danger)';return}sfx('tap');slotLoad(i)};bt.appendChild(b)}
    rows.appendChild(r)}};
  if(typeof indexedDB==='undefined'){toast('このブラウザでは、スロットがつかえません');return}
  document.body.appendChild(o);draw()}
