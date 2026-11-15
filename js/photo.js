/* 村の写真・村の名前（photo.js）
   村の名前：S.vname（ひらがな・カタカナ・英数字・ー・・で VNMAX 字まで。フォントにある字だけ）。村のようす・マップえらび・写真に出す。
   村の写真：いまの画面（#cv。UIはふくまない）を、長い辺 PHMAX ドットにちぢめて、ブラウザの IndexedDB（PHDB）にしまう。
     セーブ（localStorage）には入れない（大きいので）。ステージごとに PHN まい。思い出帳の「村の写真」から写す・見る・けす。
     思い出帳の再生ではしない。 */
const VNMAX=8,PHMAX=480,PHN=30,PHDB='hakoniwa-photo';
const VNOK=/[^ぁ-ゔァ-ヶー・0-9A-Za-z０-９]/g;
function vnClean(t){return String(t||'').replace(VNOK,'').slice(0,VNMAX)}
function vName(s){s=s||S;return s&&s.vname?s.vname+'村':''}
/* 名前をつけるポップアップ */
function vnamePop(done){if(!S||IS_STORY_REPLAY||document.querySelector('.vn-reveal'))return;
  const ov=el('<div class="idea-reveal vn-reveal" role="dialog" aria-modal="true" aria-label="村の名前"></div>'),card=el('<div class="idea-card" style="min-width:0"><h2>村の名前</h2><div style="display:flex;align-items:center;gap:6px;margin:10px 0"><input class="vnIn" style="width:0;min-width:0;flex:1 1 auto" type="text" autocomplete="off" placeholder="ひらがな・カタカナ"><span>村</span></div><div style="display:flex;gap:8px;justify-content:center"></div></div>');
  const ip=card.querySelector('input'),bx=card.lastElementChild;ip.value=S.vname||'';
  const fix=()=>{const v=vnClean(ip.value);if(v!==ip.value)ip.value=v};ip.addEventListener('input',e=>{if(!e.isComposing)fix()});ip.addEventListener('compositionend',fix);/* 日本語の入力中（変換中）は、さわらない */
  const no=el('<button class="btn" type="button">やめる</button>'),ok=el('<button class="btn pri" type="button">きめる</button>');
  no.onclick=()=>{sfx('tap');ov.remove()};ok.onclick=()=>{const v=vnClean(ip.value);S.vname=v;dirty=true;sfx('good');ov.remove();toast(v?v+'村になった':'村の名前をけした','good');if(done)done()};
  bx.append(no,ok);ov.append(card);document.body.append(ov);setTimeout(()=>{if(ov.isConnected)ip.focus({preventScroll:true})},60)}
/* IndexedDB（なければ、写真は使えない） */
let PHDBP=null;
function phDb(){if(PHDBP)return PHDBP;PHDBP=new Promise((ok,ng)=>{try{const q=indexedDB.open(PHDB,1);q.onupgradeneeded=()=>{const s=q.result.createObjectStore('p',{keyPath:'id',autoIncrement:true});s.createIndex('w','w')};q.onsuccess=()=>ok(q.result);q.onerror=()=>ng(q.error)}catch(e){ng(e)}});PHDBP.catch(()=>{PHDBP=null});return PHDBP}
function phTx(mode,fn){return phDb().then(db=>new Promise((ok,ng)=>{const t=db.transaction('p',mode),s=t.objectStore('p');let out;Promise.resolve(fn(s,v=>{out=v})).catch(ng);t.oncomplete=()=>ok(out);t.onerror=()=>ng(t.error);t.onabort=()=>ng(t.error)}))}
function phList(w){return phTx('readonly',(s,put)=>{const q=s.index('w').getAll(w);q.onsuccess=()=>put(q.result.sort((a,b)=>a.id-b.id))})}
function phDel(id){return phTx('readwrite',s=>{s.delete(id)})}
function phAdd(rec){return phTx('readwrite',(s,put)=>{const q=s.add(rec);q.onsuccess=()=>put(q.result)})}
/* いまの画面を写す */
function phShot(){const c=$('#cv');if(!c||!c.width)return null;const k=Math.min(1,PHMAX/Math.max(c.width,c.height)),w=Math.max(1,Math.round(c.width*k)),h=Math.max(1,Math.round(c.height*k));
  const o=document.createElement('canvas');o.width=w;o.height=h;const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(c,0,0,w,h);
  return new Promise(ok=>{const fin=b=>{o.width=o.height=0;ok(b)};try{o.toBlob(b=>fin(b),'image/jpeg',.9)}catch(e){fin(null)}})}
function phTake(){if(!S||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN)return;const w=WD,d=dayNo(),h=hour(),vn=S.vname||'',st=S;closeSheet();
  const go=()=>requestAnimationFrame(()=>requestAnimationFrame(async()=>{if(S!==st)return;const b=await phShot();if(!b)return toast('写せませんでした','warn');
    try{const L=await phList(w);if(L.length>=PHN)return toast('写真がいっぱいです','warn');await phAdd({w,d,h,vn,at:Date.now(),b});sfx('good');toast('村を写した！','good');phFlash()}catch(e){toast('写真をしまえませんでした','warn')}}));
  setTimeout(go,450)}/* 下のシートがとじてから写す */
function phFlash(){const f=el('<div style="position:fixed;inset:0;z-index:90;background:#fff8e9;opacity:.8;pointer-events:none;transition:opacity .5s steps(5)"></div>');document.body.append(f);requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.opacity='0'}));setTimeout(()=>f.remove(),700)}
const phCap=p=>(p.vn?p.vn+'村・':'')+p.d+'日め・'+String(Math.floor(p.h)).padStart(2,'0')+':'+String(Math.floor((p.h%1)*60)).padStart(2,'0');
/* 見る：大きく出して、けせる */
function phView(p,after){const url=URL.createObjectURL(p.b),ov=el('<div class="idea-reveal ph-reveal" role="dialog" aria-modal="true" aria-label="村の写真"></div>'),card=el('<div class="idea-card" style="min-width:0;padding:14px 12px"><img alt="" style="display:block;max-width:100%;max-height:calc(100vh - 210px);width:auto;height:auto;margin:0 auto 8px"><p style="text-align:center;margin:0 0 8px"></p><div style="display:flex;gap:8px;justify-content:center"></div></div>');
  card.querySelector('img').src=url;card.querySelector('p').textContent=phCap(p);const bx=card.lastElementChild,close=()=>{ov.remove();URL.revokeObjectURL(url)};
  const del=el('<button class="btn" type="button">けす</button>'),ok=el('<button class="btn pri" type="button">とじる</button>');del.dataset.hold=1;
  del.onclick=()=>{if(!(del.dataset.ok||del._held)){del.dataset.ok=1;del.textContent='本当にけす';return}phDel(p.id).then(()=>{close();toast('写真をけした');if(after)after()},()=>toast('けせませんでした','warn'))};
  ok.onclick=()=>{sfx('tap');close()};bx.append(del,ok);ov.append(card);document.body.append(ov)}
/* 思い出帳の「村の写真」 */
function photoSec(body){if(IS_STORY_REPLAY)return;const sec=el('<div class="sec"><h3>村の写真</h3><div class="phg" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0"></div></div>'),g=sec.querySelector('.phg');
  const b=el('<button class="btn pri" type="button">いまの村を写す</button>');b.onclick=()=>{sfx('tap');phTake()};sec.insertBefore(b,g);body.appendChild(sec);
  const w=WD,st=S;phList(w).then(L=>{if(!sec.isConnected||S!==st)return;if(!L.length){g.replaceWith(el('<p class="note">村のすがたを、ここにのこせます。</p>'));return}
    for(const p of L.slice().reverse()){const u=URL.createObjectURL(p.b),t=el('<button type="button" class="phT" style="padding:0;border:0;background:none;cursor:pointer"><img alt="" style="display:block;width:100%;aspect-ratio:4/3;object-fit:cover"><small style="display:block;text-align:center"></small></button>');
      const im=t.querySelector('img');im.src=u;im.onload=()=>URL.revokeObjectURL(u);t.querySelector('small').textContent=p.d+'日め';t.onclick=()=>{sfx('tap');phView(p,()=>{if(sheet==='menu'&&sheetArg==='record')renderSheet()})};g.appendChild(t)}},
    ()=>{if(sec.isConnected)g.replaceWith(el('<p class="note">このブラウザでは、写真をしまえません。</p>'))})}
