/* UIの手ざわり：上の数がふえたら、はねて光る（uiNumWatch）・地図をタップしたら、葉（火山は火の粉）が舞う（tapFx）・
   知らせにせいれいの顔（toastFace）・なにもない一覧のせいれい（nodataSpirit）・読みこみ中に歩くせいれい（ldWalk）。
   どれも見た目だけ。セーブ・ゲームの進みにはさわらない。うごきをへらす設定では、うごかさない */
const UIFX={prev:{},spk:{},parts:[],raf:0};
function uiReduced(){return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)}
/* せいれいを小さなキャンバスに描く。.87 で、せいれいの絵の1ドットがキャンバスの1ドット（表示はその半分の大きさにして、ゲームの1ドットを画面の1ドットにする） */
function spiritCanvas(r,w,h,foot,mood){const el=r?r.elem:'wood';if(typeof spDotReady!=='function'||!spDotReady(el))return null;
  const c=document.createElement('canvas');c.width=w;c.height=h;drawSpirit(c.getContext('2d'),el,w/2,foot,.87,1,{dot:1,t:0,vr:r?r.vr:KEYVR['フタバ'],mood:mood||'smile',walk:false,work:false});return c}
/* 上の数（パワー・せいれい・食料・素材）：ふえたら、数字がはねて、キラッと光る */
function uiNumWatch(){for(const id of['pt','resN','food','matN']){const e=document.getElementById(id);if(!e)continue;UIFX.prev[id]=parseInt(e.textContent,10);new MutationObserver(()=>uiNumChanged(id,e)).observe(e,{childList:true,characterData:true,subtree:true})}}
function uiNumChanged(id,e){const v=parseInt(e.textContent,10),p=UIFX.prev[id],pt=UIFX.prevT&&UIFX.prevT[id];(UIFX.prevT=UIFX.prevT||{})[id]=e.textContent;UIFX.prev[id]=v;
  if(document.body.classList.contains('wd0')&&started&&!uiReduced()&&isFinite(p)&&isFinite(v)&&v!==p&&pt!=null)uiRoll(e,pt,v>p);/* 草原は、数がかわるたびに、木のめくり数字のように、くるっとまわる */
  if(!(v>p)||!started||uiReduced())return;
  const now=performance.now();if(now-(UIFX.spk[id]||0)<350)return;UIFX.spk[id]=now;/* 続けてふえるときは、0.35秒に1回だけ */
  if(!document.body.classList.contains('wd0')){e.classList.remove('nbump');void e.offsetWidth;e.classList.add('nbump')}sfx('count');
  const tag=e.closest('.htag');if(tag){const s=document.createElement('i');s.className='nspk';tag.appendChild(s);setTimeout(()=>s.remove(),520)}}
/* 草原の数字：前の数が上（へったときは下）へまわってきえ、新しい数が下（上）からまわって出る。前の数は、同じ所にかさねた写し */
function uiRoll(e,old,up){const tag=e.closest('.htag');if(!tag)return;for(const o of tag.querySelectorAll('.nold'))o.remove();
  const o=document.createElement('b');o.className='nold '+(up?'u':'d');o.textContent=old;o.style.left=e.offsetLeft+'px';o.style.top=e.offsetTop+'px';o.style.color=getComputedStyle(e).color;tag.appendChild(o);setTimeout(()=>o.remove(),260);
  e.classList.remove('nrollU','nrollD');void e.offsetWidth;e.classList.add(up?'nrollU':'nrollD');clearTimeout(e._roT);e._roT=setTimeout(()=>e.classList.remove('nrollU','nrollD'),260)}
/* 木くず：草原のボタンをはなしたとき・下のシートが「ことん」と置かれたとき、板のはしから、小さな木くずがこぼれる */
function sawdust(x,y,n,w){if(uiReduced())return;let box=document.getElementById('tapFx');if(!box){box=document.createElement('div');box.id='tapFx';document.body.appendChild(box)}
  const cols=['#b08552','#c49a62','#9a6c40'];
  for(let i=0;i<n&&UIFX.parts.length<40;i++){const d=document.createElement('i'),sz=(i%3?1.5:3);d.style.width=d.style.height=sz+'px';d.style.background=cols[i%3];box.appendChild(d);
    UIFX.parts.push({d,x:x+(Math.random()-.5)*(w||0),y,vx:(Math.random()-.5)*1.6,vy:-.4-Math.random()*.9,t:0,dust:1,ph:i})}
  if(!UIFX.raf)UIFX.raf=requestAnimationFrame(tapFxStep)}
/* 地図をタップしたところに、小さな葉（火山は火の粉）。1粒は1ドット（1.5px）のます目にそろえて動かす */
function tapFx(x,y){if(uiReduced())return;const fire=WD===1,n=fire?6:5;let box=document.getElementById('tapFx');if(!box){box=document.createElement('div');box.id='tapFx';document.body.appendChild(box)}
  const cols=fire?['#f2a43a','#f7d067','#e0663a']:['#6aa857','#8fca6b','#4f8a40'];
  for(let i=0;i<n&&UIFX.parts.length<30;i++){const d=document.createElement('i'),sz=(fire?(i%3?1:2):(i%2?2:3))*1.5;d.style.width=d.style.height=sz+'px';d.style.background=cols[i%3];box.appendChild(d);
    const a=Math.PI*2*i/n+Math.random()*.6,sp=1+Math.random()*1.4;UIFX.parts.push({d,x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(fire?1.8:1.2),t:0,fire,ph:i})}
  sfx(fire?'crackle':'leaf');if(!UIFX.raf)UIFX.raf=requestAnimationFrame(tapFxStep)}
function tapFxStep(){UIFX.raf=0;const P=UIFX.parts;for(let i=P.length-1;i>=0;i--){const p=P[i];p.t++;p.x+=p.vx;p.y+=p.vy;
    if(p.smoke){p.vy*=.97;p.vx+=Math.sin(p.t*.25+p.ph)*.04}else if(p.dust){p.vy+=.14;p.vx*=.94}else if(p.fire){p.vy-=.03;p.vx*=.97}else{p.vy+=.05;p.vx*=.96;p.x+=Math.sin(p.t*.2+p.ph)*.5}/* 火の粉はのぼり、葉はゆれながら落ちる */
    p.d.style.transform='translate('+Math.round(p.x/1.5)*1.5+'px,'+Math.round(p.y/1.5)*1.5+'px)';if(p.t>32)p.d.style.opacity=String(Math.max(0,(48-p.t)/16));if(p.t>=48){p.d.remove();P.splice(i,1)}}
  if(P.length)UIFX.raf=requestAnimationFrame(tapFxStep)}
/* 知らせに名前が出るせいれいがいれば、その顔（よい知らせはにっこり・注意はおどろき） */
function toastFace(msg,kind){if(!S||!S.res||!msg)return null;let r=null;for(const q of S.res)if(q.name&&q.name.length>=2&&msg.includes(q.name)&&(!r||q.name.length>r.name.length))r=q;if(!r)return null;
  const c=spiritCanvas(r,72,68,92,kind==='warn'?'shock':kind==='good'?'joy':'smile');if(c)c.className='tface';return c}
/* なにもない一覧：村のせいれいが1人、そばに立つ（文ごとに同じせいれい） */
function nodataSpirit(t){if(!S||!S.res)return null;const L=S.res.filter(q=>!q.hidden);if(!L.length)return null;let h=0;for(const ch of String(t))h=(h*31+ch.charCodeAt(0))|0;
  const c=spiritCanvas(L[Math.abs(h)%L.length],80,112,108,'smile');if(c)c.className='nspr';return c}
/* 「マップを読みこみ中…」：せいれいが歩く（stageLoading が、読みこみ中は毎コマよぶ）。ひとめぐりごとに、パターンをかえる：
   ぶらぶら行ったり来たり（walk）・頭に物をのせて運ぶ（carry）・ちょうを追いかける（chase）。キャンバスは、ゲームの2倍の細かさ（世界の1ドット＝2） */
const LDW={pat:'',t0:0,item:''},LDPAT=['carry','chase','walk'],LDITEM=['ic:wood','ic:stone','chip:drop:eda'];
function ldWalk(c){const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);const r=S&&S.res&&S.res.find(q=>!q.hidden),el=r?r.elem:'wood';if(typeof spDotReady!=='function'||!spDotReady(el))return;
  const now=performance.now(),Wd=c.width/2,FY=70,P=4.6;/* 1めぐり4.6秒 */
  if(!LDW.pat||now-LDW.t0>P*1000){const k=LDW.pat?(LDPAT.indexOf(LDW.pat)+1)%LDPAT.length:Math.floor(Math.random()*LDPAT.length);LDW.pat=LDPAT[k];LDW.t0=now;LDW.item=LDITEM[Math.floor(Math.random()*LDITEM.length)]}
  const u=(now-LDW.t0)/(P*1000),t=now/1000;g.setTransform(2,0,0,2,0,0);g.imageSmoothingEnabled=false;
  let x,f=1;
  if(LDW.pat==='walk'){x=u<.5?20+u*2*(Wd-40):Wd-20-(u-.5)*2*(Wd-40);f=u<.5?1:-1}/* 行って、もどる */
  else x=-14+u*(Wd+28);/* 左から右へ通りぬける */
  x=Math.round(x);
  if(LDW.pat==='chase'){/* ちょうは、せいれいの少し前を、ふわふわ上下しながら飛ぶ */const C=window.CHIPS,op=Math.floor(now/120)%2===0,ch=C&&C['critfly:'+(Math.floor(LDW.t0)%4)+'#'+(op?0:1)];
    if(ch){const im=chipImgs(ch,'critfly')[0];if(im.ok){const bx=Math.round(x+22+Math.sin(t*2.3)*5),by=Math.round(FY-40+Math.sin(t*4.1)*7);g.drawImage(im,bx+ch.ax/2,by+ch.ay/2,ch.w/2,ch.h/2)}}}
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x-8,FY,16,2);
  const hop=LDW.pat==='chase'?Math.round(Math.abs(Math.sin(t*5))*3):0;/* 追いかけるときは、ぴょんぴょん */
  drawSpirit(g,el,x,FY-hop,.435,f,{dot:1,t,vr:r?r.vr:KEYVR['フタバ'],walk:true,turn:1,mood:'joy'});
  if(LDW.pat==='carry'){const ei=typeof emoImg==='function'?emoImg(LDW.item):null;if(ei){const k=22/Math.max(ei.width,ei.height),iw=ei.width*k,ih=ei.height*k,cb=Math.round(Math.abs(Math.sin(t*9))*1);g.drawImage(ei,Math.round(x-iw/2),Math.round(FY-54-cb-ih/2),Math.round(iw),Math.round(ih))}}/* 頭の上に、運ぶ物（村で運ぶときと同じ絵） */
  g.setTransform(1,0,0,1,0,0)}
/* ステージごとのUIの見た目：草原（WD 0）は木のわく（body.wd0）。毎コマよばれるが、かわったときだけさわる */
let UIWD=null,UIRAIN=null;function uiStageSync(){const w=started&&typeof WD==='number'?WD:-1,rn=!!(started&&S&&S.rain);if(rn!==UIRAIN){UIRAIN=rn;document.body.classList.toggle('wrain',rn)}/* 雨の日は、木札が少し大きくゆれる */if(w===UIWD)return;UIWD=w;document.body.classList.toggle('wd0',w===0)}
/* つるした木札（草原の下のバー・目標）：タップすると、ぶらんとゆれる */
function uiSwing(e){if(uiReduced()||!e)return;e.classList.remove('uswing');void e.offsetWidth;e.classList.add('uswing');clearTimeout(e._swT);e._swT=setTimeout(()=>e.classList.remove('uswing'),1050)}
document.addEventListener('click',e=>{if(!document.body.classList.contains('wd0'))return;const b=e.target&&e.target.closest&&e.target.closest('.dock button,.quest');if(b)uiSwing(b)},true);
/* 草原のボタン：はなしたとき、ぽよんとはねかえる */
document.addEventListener('pointerup',e=>{if(!document.body.classList.contains('wd0')||uiReduced())return;const b=e.target&&e.target.closest&&e.target.closest('.btn,.ctab,.slot,.qbtn,.mtile,.chip,#speedBtn,#pauseBtn,#skipBtn');if(!b||b.disabled)return;b.classList.remove('uboing');void b.offsetWidth;b.classList.add('uboing');clearTimeout(b._boT);b._boT=setTimeout(()=>b.classList.remove('uboing'),360);
  const q=b.getBoundingClientRect();if(q.width){sawdust(q.left+4,q.bottom-3,3);sawdust(q.right-4,q.bottom-3,3)}},true);
/* 下のシートが「ことん」と置かれた瞬間（kotonn の55%）に、上の左右のはしから木くず */
document.addEventListener('animationstart',e=>{if(e.animationName!=='kotonn')return;const el=e.target;setTimeout(()=>{const q=el.getBoundingClientRect();if(q.width&&document.body.classList.contains('wd0')){sawdust(q.left+12,q.top+2,4,16);sawdust(q.right-12,q.top+2,4,16)}},165)});
/* ハンコ：たっせいした物（目標の札・知らせ）に、赤い「できた」をポンとおす。2.4秒でうすくなって消える */
let STAMPC=null;
function stampCanvas(){if(STAMPC)return STAMPC;const c=document.createElement('canvas');c.width=32;c.height=32;const g=c.getContext('2d'),cx=16,cy=16,R=15;g.fillStyle='#d6453a';
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){const d=Math.hypot(x+.5-cx,y+.5-cy);if(d<=R&&d>R-2.2&&(x*7+y*3)%11)g.fillRect(x,y,1,1)}/* ふちは、ところどころインクがかすれる */
  const t=document.createElement('canvas');t.width=32;t.height=32;const h=t.getContext('2d');h.font='10px PixelMplus10';h.textAlign='center';h.textBaseline='middle';h.fillStyle='#d6453a';h.fillText('でき',cx,cy-5);h.fillText('た',cx,cy+6);
  const d=h.getImageData(0,0,32,32);for(let i=3;i<d.data.length;i+=4)d.data[i]=d.data[i]>110?255:0;h.putImageData(d,0,0);g.drawImage(t,0,0);t.width=t.height=0;/* 字はドットのまま（うすい所はけす） */
  return STAMPC=c}
function uiStamp(el,small){if(!el||!el.isConnected)return;const c=document.createElement('canvas');c.width=c.height=32;c.getContext('2d').drawImage(stampCanvas(),0,0);c.className='ustamp'+(small?' s':'');
  if(getComputedStyle(el).position==='static')el.style.position='relative';el.appendChild(c);setTimeout(()=>{el.classList.remove('ushake');void el.offsetWidth;el.classList.add('ushake')},180);
  setTimeout(()=>c.classList.add('out'),2400);setTimeout(()=>c.remove(),2850)}
uiNumWatch();
/* 草原：メニュー・一覧をひらくと、ボタンの板が1まいずつ「とん、とん」と置かれる（kotonn と同じ動き。CSS の tontile と、おくれ --ti）。音は板が置かれる瞬間に */
document.addEventListener('animationstart',e=>{if(e.animationName==='tontile'&&!uiReduced())setTimeout(()=>sfx('tile'),90)});
function tileStagger(root){if(!document.body.classList.contains('wd0')||uiReduced()||!root)return;const L=root.querySelectorAll('.mtile');let i=0;for(const b of L){if(i>=12)break;b.style.setProperty('--ti',(i*45)+'ms');b.classList.remove('utile');void b.offsetWidth;b.classList.add('utile');i++}}
function tileWatch(){const b=document.getElementById('sheetBody');if(!b)return;new MutationObserver(()=>{const n=b.querySelectorAll('.mtile').length,k=n?n+'|'+(b.firstElementChild?b.firstElementChild.textContent.slice(0,20):''):0;if(k!==b._tileN){b._tileN=k;if(n)tileStagger(b)}}).observe(b,{childList:true})}/* 下のシートの中身がかわったときだけ */
/* 草原：タブをかえると、中の板が、札をひっくり返すように、くるっとまわって中身がかわる（タブのならび .ctabs のあとの物。図鑑の本はのぞく） */
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('.ctabs .ctab');if(!t||!document.body.classList.contains('wd0')||uiReduced()||t.closest('.pxcard')||t.closest('.sheet[data-k="zukan"]'))return;
  sfx('flip');requestAnimationFrame(()=>{const tb=document.querySelector('#sheetBody .ctabs');if(!tb)return;let n=tb.nextElementSibling;while(n){n.classList.remove('uflip');void n.offsetWidth;n.classList.add('uflip');n=n.nextElementSibling}})},true);
/* 草原：もどせない決定（data-hold のボタン）は、おしつづけると、焼き印のこげ色がたまって「じゅっ」と決まる（0.7秒）。ふつうのタップでは決まらない */
const HOLDMS=700;
function holdOn(b){return b&&b.dataset&&b.dataset.hold&&document.body.classList.contains('wd0')}
document.addEventListener('pointerdown',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-hold]');if(!holdOn(b)||b.disabled)return;b.classList.add('holding');b.style.setProperty('--hold',HOLDMS+'ms');
  clearTimeout(b._hT);b._hT=setTimeout(()=>{b.classList.remove('holding');b._held=1;sfx('sizzle');b.classList.add('branded');setTimeout(()=>b.classList.remove('branded'),400);b.click();b._held=0},HOLDMS)},true);
for(const ev of['pointerup','pointercancel','pointerleave'])document.addEventListener(ev,e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-hold]');if(!b||!b._hT)return;if(b.classList.contains('holding')){clearTimeout(b._hT);b._hT=0;b.classList.remove('holding')}},true);
document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-hold]');if(!holdOn(b)||b._held)return;e.preventDefault();e.stopImmediatePropagation();toast('おしつづけて決めよう')},true);
/* 草原：ゲージがふえるときは、はちみつのように、とろっとのびて、さきが少しゆれて止まる（gwob） */
function gaugeWatch(){for(const id of['xpBar','foodBar','matBar']){const i=document.getElementById(id);if(!i)continue;let p=parseFloat(i.style.width)||0;
  new MutationObserver(()=>{const v=parseFloat(i.style.width)||0;if(v>p+.5&&document.body.classList.contains('wd0')&&!uiReduced()){const g=i.parentElement;g.classList.remove('gwob');void g.offsetWidth;g.classList.add('gwob');clearTimeout(g._gT);g._gT=setTimeout(()=>g.classList.remove('gwob'),1400)}p=v}).observe(i,{attributes:true,attributeFilter:['style']})}}

/* 草原：一覧を指でなでると、行の板が通りすぎるたびに、木琴の音（行ごとに音の高さがかわる。1行は約40px） */
document.addEventListener('scroll',e=>{const el=e.target;if(!el||!el.closest||!el.closest('#sheetWrap')||!document.body.classList.contains('wd0'))return;const k=Math.floor(el.scrollTop/40);if(el._xyl===undefined)el._xyl=0;
  if(k!==el._xyl){XYLN=((k%8)+8)%8;el._xyl=k;sfx('xyl')}},true);
/* 草原：村レベルが上がったら、上の欄の数に、新しい数が焼き印で「じゅっ」とおされて、けむりがたつ */
function smoke(x,y,n){if(uiReduced())return;let box=document.getElementById('tapFx');if(!box){box=document.createElement('div');box.id='tapFx';document.body.appendChild(box)}
  const cols=['#d8cfc0','#c4baa9','#ece4d6'];for(let i=0;i<n&&UIFX.parts.length<40;i++){const d=document.createElement('i'),sz=(i%2?3:1.5);d.style.width=d.style.height=sz+'px';d.style.background=cols[i%3];box.appendChild(d);
    UIFX.parts.push({d,x:x+(Math.random()-.5)*8,y,vx:(Math.random()-.5)*.4,vy:-.5-Math.random()*.5,t:-i*3,smoke:1,ph:i})}if(!UIFX.raf)UIFX.raf=requestAnimationFrame(tapFxStep)}
function lvWatch(){const e=document.getElementById('lvLbl');if(!e)return;let p=parseInt(e.textContent,10);new MutationObserver(()=>{const v=parseInt(e.textContent,10);
  if(v>p&&started&&document.body.classList.contains('wd0')&&!uiReduced()){e.classList.remove('ubrand');void e.offsetWidth;e.classList.add('ubrand');sfx('sizzle');const q=e.getBoundingClientRect();smoke(q.left+q.width/2,q.top,7);clearTimeout(e._bT);e._bT=setTimeout(()=>e.classList.remove('ubrand'),1000)}p=v}).observe(e,{childList:true,characterData:true,subtree:true})}
/* 草原：下のシートをとじるとき、板が少しうきあがってから、下へすべっていく（とじた画面の写しを動かす。本物は、すぐとじる） */
function sheetGhost(){if(!document.body.classList.contains('wd0')||uiReduced())return;const w=document.getElementById('sheetWrap');if(!w||w.hidden)return;const s=w.querySelector('.sheet');if(!s)return;
  const g=w.cloneNode(true);/* 同じ id の写しは、本物のすぐあとに置くので、id でさがすと本物が先に見つかる */
  const cs=w.querySelectorAll('canvas'),cg=g.querySelectorAll('canvas');cs.forEach((c,i)=>{try{if(cg[i]&&c.width)cg[i].getContext('2d').drawImage(c,0,0)}catch(e){}});
  g.classList.add('ughostw');g.style.pointerEvents='none';const gs=g.querySelector('.sheet');gs.classList.add('ughost');const gb=g.querySelector('.sheet [id="sheetBody"]');
  w.after(g);if(gb)gb.scrollTop=(w.querySelector('#sheetBody')||{}).scrollTop||0;setTimeout(()=>g.remove(),300)}
/* 草原：依頼ボードの新しい紙は、ぺたっとおかれて、赤いピンがぷすっとささる（このページをひらいてから、新しくたのんだ依頼だけ） */
let PINMAX=null;function boardPinFx(bd){const ps=[...bd.querySelectorAll('.paper[data-oid]')],ids=ps.map(p=>+p.dataset.oid);if(PINMAX===null){PINMAX=Math.max(-1,...ids);return}
  let hit=false;for(const p of ps)if(+p.dataset.oid>PINMAX&&document.body.classList.contains('wd0')&&!uiReduced()){p.classList.add('upin');hit=true}PINMAX=Math.max(PINMAX,...ids);if(hit)setTimeout(()=>sfx('pin'),60)}

if(document.readyState!=='loading'){gaugeWatch();tileWatch();lvWatch()}else document.addEventListener('DOMContentLoaded',()=>{gaugeWatch();tileWatch();lvWatch()});
