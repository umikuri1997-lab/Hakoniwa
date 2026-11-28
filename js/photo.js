/* 村の写真・村の名前（photo.js）
   村の名前：S.vname（ひらがな・カタカナ・英数字・ー・・で VNMAX 字まで。フォントにある字だけ）。村のようす・マップえらび・写真に出す。
   日記の絵（絵日記の写真）：その日いちばん心にのこった物を、その場所に近よって写す（phWant → つぎのコマで phSnap）。
     写すのは昼（PHH0〜PHH1）だけ。大事さ（PHPR）：はじめてできたスポット 3（phSpot）・できた家具や建物 2（admireNote から）・
     新しいなかま 1.5・書く子（フタバ・ホムラ、dyWriter）が見にいった物・夕焼け・生き物・ひとりのしぐさ 1（phLook）・
     夕方まで何もなかった日は、書く子のまわり 0。その日の絵より大事なときだけ写しなおし、前の絵はけす。書く子が村にいなければ写さない。
     写す所は、いまのカメラとはべつ。同じコマで、写す所を描いて写しとり（phSnap）、すぐにもとのカメラで描きなおすので、
     画面のカメラはうごかない。ふきだしの文字・矢の数・置く前のわくなどは写さない（PHSNAP）。画面の UI（DOM）は、もとから入らない。
     長い辺 PHMAX ドットにちぢめて、ブラウザの IndexedDB（PHDB）にしまう。セーブ（localStorage）には入れない（大きいので）。
     ステージごとに PHN まい（いっぱいなら、いちばん古いのをけす）。その日の日記（S.dy.ph・phK・phN・phS）に、写真の番号と、なにを写したかをのこす。
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
function vkNew(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}/* 村ごとの見分け（S.vk）。はじめからにした同じ土地の、まえの村の写真をまぜない */
function phMine(p,e){return p.v?p.v===S.vk:!!S.vkOld||!!(e&&e.ph===p.id)}/* 見分けのない写真は、前のセーブの物 */
function phList(w){return phTx('readonly',(s,put)=>{const q=s.index('w').getAll(w);q.onsuccess=()=>put(q.result.sort((a,b)=>a.id-b.id))})}
function phDel(id){return phTx('readwrite',s=>{s.delete(id)})}
function phAdd(rec){return phTx('readwrite',(s,put)=>{const q=s.add(rec);q.onsuccess=()=>put(q.result)})}
/* セーブの書き出し・読みこみ（ui.js）：写真もファイルに入れて、ほかのスマホやパソコンへ移す。絵は data: の文字にする */
function phAll(){return phTx('readonly',(s,put)=>{const q=s.getAll();q.onsuccess=()=>put(q.result||[])})}
const phB64=b=>new Promise((ok,ng)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=()=>ng(f.error);f.readAsDataURL(b)});
async function phExport(){let L=[];try{L=await phAll()}catch(e){return[]}const O=[];for(const p of L){if(!(p.b instanceof Blob))continue;try{O.push({id:p.id,w:p.w,v:p.v||'',d:p.d,h:p.h,vn:p.vn||'',at:p.at,b:await phB64(p.b)})}catch(e){}}return O}
async function phImport(list,ws){/* ws の土地の写真を、ファイルの写真にいれかえる。かえす：土地→{前の番号:新しい番号} */const M={};for(const w of ws)M[w]={};
  const old=await phAll();for(const p of old)if(ws.includes(p.w))await phDel(p.id);
  for(const p of list||[]){if(!p||!ws.includes(p.w)||typeof p.b!=='string'||!p.b.startsWith('data:image/'))continue;let b;try{b=await(await fetch(p.b)).blob()}catch(e){continue}
    const id=await phAdd({w:p.w,v:p.v||'',d:p.d,h:p.h,vn:p.vn||'',at:p.at,b});M[p.w][p.id]=id}return M}
function phRemap(g,m){/* セーブの日記がさす写真の番号を、新しい番号に（ない写真はさしていない形に） */const fix=e=>{if(!e||e.ph==null)return;if(m[e.ph]!=null)e.ph=m[e.ph];else delete e.ph};fix(g.dy);for(const e of g.diary||[])fix(e)}
/* 写す所：マスのかこみ B（{x0,y0,x1,y1}）が大きく入るように、近よる */
const PHZMIN=.6,PHASP=4/3,PHZMAX=2.4;
function phFrame(B){const cw=Math.min(VW,VH*PHASP),ch=cw/PHASP,bw=(B.x1-B.x0+1)*TS,bh=(B.y1-B.y0+1)*TS,fit=Math.min(cw/(bw+TS*5),ch/(bh+TS*5));
  const z=clamp(fit,PHZMIN,Math.max(PHZMAX,homeZ())),lift=hiAt(clamp(Math.round((B.y0+B.y1)/2),0,H-1)*W+clamp(Math.round((B.x0+B.x1)/2),0,W-1))*LIFT;
  return{z,cx:(B.x0+B.x1+1)/2*TS,cy:(B.y0+B.y1+1)/2*TS-TS*.6-lift,cw,ch}}/* 物の絵は上へのびるので、すこし上に */
let PHSNAP=0;
/* 写す所を描いて、写しとる（同じコマで、もとのカメラで描きなおす） */
function phSnap(now,F){if(!cv.width||!VW)return null;const C={x:cam.x,y:cam.y,z:cam.z},keep={mode,pending,selRect,MOVESRC};
  const k=Math.min(1,PHMAX/Math.max(F.cw,F.ch)),w=Math.max(1,Math.round(F.cw*k)),h=Math.max(1,Math.round(F.ch*k)),o=document.createElement('canvas');o.width=w;o.height=h;
  const fresh=()=>{if(typeof HDC!=='undefined'&&HDC)HDC.n=99};/* HD-2D のにじみのもとを、そのコマで作りなおす */
  try{PHSNAP=1;mode='look';pending=null;selRect=null;MOVESRC=null;cam.z=F.z;cam.x=F.cx-VW/F.z/2;cam.y=F.cy-VH/F.z/2;fresh();render(now);
    const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';{const c3=G3.on&&document.getElementById('cv3');if(c3&&c3.width){const r=c3.width/VW;x.drawImage(c3,(VW-F.cw)/2*r,(VH-F.ch)/2*r,F.cw*r,F.ch*r,0,0,w,h)}}/* 3D：3Dの絵（同じコマで描いたすぐあと）の上に、かさねるキャンバス */x.drawImage(cv,(VW-F.cw)/2*dpr,(VH-F.ch)/2*dpr,F.cw*dpr,F.ch*dpr,0,0,w,h)}
  catch(e){o.width=o.height=0;return null}
  finally{PHSNAP=0;mode=keep.mode;pending=keep.pending;selRect=keep.selRect;MOVESRC=keep.MOVESRC;cam.x=C.x;cam.y=C.y;cam.z=C.z;fresh();try{render(now)}catch(e){}}
  return new Promise(ok=>{const fin=b=>{o.width=o.height=0;ok(b)};try{o.toBlob(b=>fin(b),'image/jpeg',.9)}catch(e){fin(null)}})}
/* 日記の絵の予約 */
const PHH0=6.5,PHH1=19,PHEVE=17,PHDELAY=1600,PHPR={spot:3,built:2,new:1.5,see:1,day:0},PHLOOK=new Set(['admire','sunset','critwatch','quirk']);
let PHQ=null,PHCHK=0;
function phOn(){return !!S&&!IS_STORY_REPLAY&&!(typeof MEMRUN!=='undefined'&&MEMRUN)&&!NOSAVE&&!!S.introSeen}
const phBoxOf=(x,y,r)=>({x0:Math.floor(x-r),y0:Math.floor(y-r),x1:Math.floor(x+r),y1:Math.floor(y+r)});
function phBoxJ(id,j){let x0=W,y0=H,x1=-1,y1=-1;for(const[x,y]of fp(id,j%W,(j/W)|0)){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}return x1<0?phBoxOf(j%W+.5,(j/W|0)+.5,0):{x0,y0,x1,y1}}
/* k：PHPR のしゅるい、B：写す所（マスのかこみ）、n：物の名前、sub：見た物のしゅるい（see のとき） */
function phWant(k,B,n,sub){if(!phOn()||typeof dyCur!=='function'||!dyWriter())return;const D=dyCur(),h=hour();if(!D||h<PHH0||h>=PHH1)return;
  const pr=PHPR[k];if(D.phP!=null&&pr<=D.phP)return;if(PHQ&&PHQ.st===S&&PHQ.pr>=pr)return;
  PHQ={k,B,n:n||'',sub:sub||'',pr,st:S,d:D.d,at:performance.now()+PHDELAY}}
function phSpot(sp){const I=SPOTI.find(q=>q.sp.k===sp.k);if(!I)return;let x0=W,y0=H,x1=-1,y1=-1;for(const q of spotCells(I)){const x=q%W,y=(q/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}if(x1>=0)phWant('spot',{x0,y0,x1,y1},sp.n)}
/* 1秒に1回：書く子が見にいった物・新しいなかま・夕方まで何もなかった日 */
function phLook(){const f=dyWriter(),D=S.dy;if(!f||!D||f.hidden)return;const h=hour();
  {const nw=S.res.find(r=>r.came===D.d&&r!==f&&!r.back&&!r.hidden);if(nw)phWant('new',phBoxOf(nw.x,nw.y,1),nw.name)}
  const a=f.act;if(a&&PHLOOK.has(a.type)&&a.stage!=='walk'&&a.t>=3){let B=phBoxOf(f.x,f.y,1),n='';
    if(a.type==='admire'&&a.obj!=null&&BL[a.id]){const O=phBoxJ(a.id,a.obj);B={x0:Math.min(B.x0,O.x0),y0:Math.min(B.y0,O.y0),x1:Math.max(B.x1,O.x1),y1:Math.max(B.y1,O.y1)};n=BL[a.id].name}
    else if(a.type==='critwatch'){const c=typeof critById==='function'&&critById(a.cid);if(c&&typeof CRITN!=='undefined')n=CRITN[c.k]||''}
    phWant('see',B,n,a.type)}
  if(h>=PHEVE&&D.ph==null&&!PHQ)phWant('day',phBoxOf(f.x,f.y,1.5))}
/* 毎コマ（マップを描いたあと） */
function phTick(now){if(!phOn())return;const h=hour();
  if(typeof dyNoon==='function')dyNoon(h);
  if(now>=PHCHK){PHCHK=now+1000;try{phLook()}catch(e){}}
  const q=PHQ;if(!q||now<q.at)return;if(typeof HDBIG!=='undefined'&&now<HDBIG){q.at=HDBIG+PHDELAY;return}/* 見せ場の光（召喚など）のあいだは写さない。光がおさまってから */PHQ=null;if(q.st!==S||!S.dy||S.dy.d!==q.d)return;if(q.k==='new'){const r=S.res.find(r=>r.name===q.n&&!r.hidden);if(r)q.B=phBoxOf(r.x,r.y,1)}/* まっているあいだに歩いたら、いまいる所を写す */
  const w=WD,st=S,vn=S.vname||'',P=phSnap(now,phFrame(q.B));if(!P)return;
  P.then(async b=>{if(!b||S!==st)return;try{const D=S.dy;if(!D||D.d!==q.d||D.phP!=null&&D.phP>=q.pr)return;
    const L=await phList(w);for(let i=0;i<=L.length-PHN;i++)await phDel(L[i].id);const id=await phAdd({w,v:st.vk||'',d:q.d,h,vn,at:Date.now(),b});
    if(S!==st||S.dy!==D||D.phP!=null&&D.phP>=q.pr){phDel(id).catch(()=>{});return}
    const old=D.ph;D.ph=id;D.phK=q.k;D.phN=q.n;D.phS=q.sub;D.phP=q.pr;dirty=true;{const Q=S.phDays||(S.phDays=[]);if(!Q.includes(q.d)){Q.push(q.d);if(Q.length>60)Q.shift()}}/* 思い出帳の日記に、写真のある日をのこす */if(old!=null&&old!==id)phDel(old).catch(()=>{})}catch(e){}})}
const phCap=p=>(p.vn?p.vn+'村・':'')+p.d+'日め・'+String(Math.floor(p.h)).padStart(2,'0')+':'+String(Math.floor((p.h%1)*60)).padStart(2,'0');
/* 見る：大きく出して、けせる */
function phView(p,after){const url=URL.createObjectURL(p.b),ov=el('<div class="idea-reveal ph-reveal" role="dialog" aria-modal="true" aria-label="村の写真"></div>'),card=el('<div class="idea-card" style="min-width:0;padding:14px 12px"><img alt="" style="display:block;max-width:100%;max-height:calc(100vh - 210px);width:auto;height:auto;margin:0 auto 8px"><p style="text-align:center;margin:0 0 8px"></p><div style="display:flex;gap:8px;justify-content:center"></div></div>');
  card.querySelector('img').src=url;card.querySelector('p').textContent=phCap(p);const bx=card.lastElementChild,close=()=>{ov.remove();URL.revokeObjectURL(url)};
  const del=el('<button class="btn" type="button">けす</button>'),ok=el('<button class="btn pri" type="button">とじる</button>');del.dataset.hold=1;
  del.onclick=()=>{if(!(del.dataset.ok||del._held)){del.dataset.ok=1;del.textContent='本当にけす';return}phDel(p.id).then(()=>{close();toast('写真をけした');if(after)after()},()=>toast('けせませんでした','warn'))};
  ok.onclick=()=>{sfx('tap');close()};bx.append(del,ok);ov.append(card);document.body.append(ov)}
/* 思い出帳の「村の写真」 */
