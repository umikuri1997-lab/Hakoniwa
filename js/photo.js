/* 村の写真・村の名前（photo.js）
   村の名前：S.vname（ひらがな・カタカナ・英数字・ー・・で VNMAX 字まで。フォントにある字だけ）。村のようす・マップえらび・写真に出す。
   村の写真：毎日、昼12時（ゲームの時計。12〜15時のあいだで、マップを描いているはじめのコマ）に、自動で写す（phNoonTick、S.phD：写した日）。
     写すのは、いまのカメラとはべつの、村（VILL）がおさまる所（phFrame）。同じコマで、写す所を描いて写しとり（phSnap）、すぐにもとのカメラで描きなおすので、
     画面のカメラはうごかない。ふきだしの文字・矢の数・置く前のわくなどは写さない（PHSNAP）。画面の UI（DOM）は、もとから入らない。
     長い辺 PHMAX ドットにちぢめて、ブラウザの IndexedDB（PHDB）にしまう。セーブ（localStorage）には入れない（大きいので）。
     ステージごとに PHN まい（いっぱいなら、いちばん古いのをけす）。その日の日記（S.dy.ph）に写真の番号をのこす。
     思い出帳の「村の写真」は、見る・けすだけ。思い出帳の再生ではしない。 */
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
function phGet(id){return phTx('readonly',(s,put)=>{const q=s.get(id);q.onsuccess=()=>put(q.result||null)})}
/* 写す所：村（VILL。霧の中はのぞく）がおさまるように。広すぎるときは、いちばんこみあった所（家は4ばいに数える）をまん中に */
const PHZMIN=.6,PHASP=4/3;
function phFrame(){const cw=Math.min(VW,VH*PHASP),ch=cw/PHASP,fog=typeof fogAt==='function',V=new Float32Array(W*H);let x0=W,y0=H,x1=-1,y1=-1,n=0;
  for(let j=0;j<VILL.length;j++)if(VILL[j]&&!(fog&&fogAt(j))){V[j]=1;const x=j%W,y=(j/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;n++}
  for(const h of HOUSES)for(const j of h.set)if(V[j])V[j]=4;
  if(!n)return{z:clamp(homeZ(),PHZMIN,3),cx:(CX+.5)*TS,cy:(CY+.5)*TS,cw,ch};
  const bw=(x1-x0+1)*TS,bh=(y1-y0+2)*TS,fit=Math.min(cw/bw,ch/bh);
  if(fit>=PHZMIN)return{z:Math.min(fit,homeZ()),cx:(x0+x1+1)/2*TS,cy:(y0+y1+1)/2*TS-TS*.5,cw,ch};/* 物の絵は上へのびるので、すこし上に */
  const fw=Math.min(W,Math.floor(cw/(PHZMIN*TS))),fh=Math.min(H,Math.floor(ch/(PHZMIN*TS))),A=new Float32Array((W+1)*(H+1));/* こみあった所：ならべた合計（summed-area）で、写すわくの中の数がいちばん多い所 */
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)A[(y+1)*(W+1)+x+1]=V[y*W+x]+A[y*(W+1)+x+1]+A[(y+1)*(W+1)+x]-A[y*(W+1)+x];
  let best=-1,bx=0,by=0;for(let y=0;y+fh<=H;y++)for(let x=0;x+fw<=W;x++){const v=A[(y+fh)*(W+1)+x+fw]-A[y*(W+1)+x+fw]-A[(y+fh)*(W+1)+x]+A[y*(W+1)+x];if(v>best){best=v;bx=x;by=y}}
  return{z:PHZMIN,cx:(bx+fw/2)*TS,cy:(by+fh/2)*TS-TS*.5,cw,ch}}
let PHSNAP=0;
/* 写す所を描いて、写しとる（同じコマで、もとのカメラで描きなおす） */
function phSnap(now){if(!cv.width||!VW)return null;const F=phFrame(),C={x:cam.x,y:cam.y,z:cam.z},keep={mode,pending,selRect,MOVESRC};
  const k=Math.min(1,PHMAX/Math.max(F.cw,F.ch)),w=Math.max(1,Math.round(F.cw*k)),h=Math.max(1,Math.round(F.ch*k)),o=document.createElement('canvas');o.width=w;o.height=h;
  const fresh=()=>{if(typeof HDC!=='undefined'&&HDC)HDC.n=99};/* HD-2D のにじみのもとを、そのコマで作りなおす */
  try{PHSNAP=1;mode='look';pending=null;selRect=null;MOVESRC=null;cam.z=F.z;cam.x=F.cx-VW/F.z/2;cam.y=F.cy-VH/F.z/2;fresh();render(now);
    const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(cv,(VW-F.cw)/2*dpr,(VH-F.ch)/2*dpr,F.cw*dpr,F.ch*dpr,0,0,w,h)}
  catch(e){o.width=o.height=0;return null}
  finally{PHSNAP=0;mode=keep.mode;pending=keep.pending;selRect=keep.selRect;MOVESRC=keep.MOVESRC;cam.x=C.x;cam.y=C.y;cam.z=C.z;fresh();try{render(now)}catch(e){}}
  return new Promise(ok=>{const fin=b=>{o.width=o.height=0;ok(b)};try{o.toBlob(b=>fin(b),'image/jpeg',.9)}catch(e){fin(null)}})}
/* 毎コマ（マップを描いたあと）：昼12時に1回だけ写す */
function phNoonTick(now){if(!S||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN||NOSAVE||!S.introSeen)return;const h=hour();
  if(typeof dyNoon==='function')dyNoon(h);
  const d=dayNo();if(h<12||h>=15||S.phD===d)return;S.phD=d;phAuto(now,d)}
function phAuto(now,d){const w=WD,st=S,vn=S.vname||'',h=hour(),P=phSnap(now);if(!P)return;
  P.then(async b=>{if(!b||S!==st)return;try{const L=await phList(w);for(let i=0;i<=L.length-PHN;i++)await phDel(L[i].id);const id=await phAdd({w,d,h,vn,at:Date.now(),b});if(S===st&&S.dy&&S.dy.d===d){S.dy.ph=id;dirty=true}}catch(e){}})}
const phCap=p=>(p.vn?p.vn+'村・':'')+p.d+'日め・'+String(Math.floor(p.h)).padStart(2,'0')+':'+String(Math.floor((p.h%1)*60)).padStart(2,'0');
/* 見る：大きく出して、けせる */
function phView(p,after){const url=URL.createObjectURL(p.b),ov=el('<div class="idea-reveal ph-reveal" role="dialog" aria-modal="true" aria-label="村の写真"></div>'),card=el('<div class="idea-card" style="min-width:0;padding:14px 12px"><img alt="" style="display:block;max-width:100%;max-height:calc(100vh - 210px);width:auto;height:auto;margin:0 auto 8px"><p style="text-align:center;margin:0 0 8px"></p><div style="display:flex;gap:8px;justify-content:center"></div></div>');
  card.querySelector('img').src=url;card.querySelector('p').textContent=phCap(p);const bx=card.lastElementChild,close=()=>{ov.remove();URL.revokeObjectURL(url)};
  const del=el('<button class="btn" type="button">けす</button>'),ok=el('<button class="btn pri" type="button">とじる</button>');del.dataset.hold=1;
  del.onclick=()=>{if(!(del.dataset.ok||del._held)){del.dataset.ok=1;del.textContent='本当にけす';return}phDel(p.id).then(()=>{close();toast('写真をけした');if(after)after()},()=>toast('けせませんでした','warn'))};
  ok.onclick=()=>{sfx('tap');close()};bx.append(del,ok);ov.append(card);document.body.append(ov)}
/* 思い出帳の「村の写真」 */
let PHURLS=[];function photoSec(body){if(IS_STORY_REPLAY)return;for(const u of PHURLS)URL.revokeObjectURL(u);PHURLS=[];/* 本のめくる写しも同じ絵を読むので、つぎに作りなおすまで手ばなさない */const sec=el('<div class="sec mph"><h3>村の写真</h3><div class="phg" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0"></div></div>'),g=sec.querySelector('.phg');
  body.appendChild(sec);
  const w=WD,st=S;phList(w).then(L=>{if(!sec.isConnected||S!==st)return;if(!L.length){g.replaceWith(el('<p class="note">毎日お昼に、村のすがたが、ここにのこります。</p>'));return}
    for(const p of L.slice().reverse()){const u=URL.createObjectURL(p.b),t=el('<button type="button" class="phT" style="padding:0;border:0;background:none;cursor:pointer"><img alt="" style="display:block;width:100%;aspect-ratio:4/3;object-fit:cover"><small style="display:block;text-align:center"></small></button>');
      const im=t.querySelector('img');im.src=u;PHURLS.push(u);t.querySelector('small').textContent=p.d+'日め';t.onclick=()=>{sfx('tap');phView(p,()=>{if(sheet==='menu'&&sheetArg==='record')renderSheet()})};g.appendChild(t)}},
    ()=>{if(sec.isConnected)g.replaceWith(el('<p class="note">このブラウザでは、写真をしまえません。</p>'))})}
