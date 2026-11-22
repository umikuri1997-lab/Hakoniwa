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
function sawdust(x,y,n,w){if(uiReduced())return;sfx('dust');let box=document.getElementById('tapFx');if(!box){box=document.createElement('div');box.id='tapFx';document.body.appendChild(box)}
  const cols=['#b08552','#c49a62','#9a6c40'];
  for(let i=0;i<n&&UIFX.parts.length<40;i++){const d=document.createElement('i'),sz=(i%3?1.5:3);d.style.width=d.style.height=sz+'px';d.style.background=cols[i%3];box.appendChild(d);
    UIFX.parts.push({d,x:x+(Math.random()-.5)*(w||0),y,vx:(Math.random()-.5)*1.6,vy:-.4-Math.random()*.9,t:0,dust:1,ph:i})}
  if(!UIFX.raf)UIFX.raf=requestAnimationFrame(tapFxStep)}
/* 地図をタップしたところに、小さな葉（火山は火の粉）。1粒は1ドット（1.5px）のます目にそろえて動かす */
function tapFx(x,y){if(uiReduced())return;const fire=WD===KAZAN,n=fire?6:5;let box=document.getElementById('tapFx');if(!box){box=document.createElement('div');box.id='tapFx';document.body.appendChild(box)}
  const cols=fire?['#f2a43a','#f7d067','#e0663a']:['#6aa857','#8fca6b','#4f8a40'];
  for(let i=0;i<n&&UIFX.parts.length<30;i++){const d=document.createElement('i'),sz=(fire?(i%3?1:2):(i%2?2:3))*1.5;d.style.width=d.style.height=sz+'px';d.style.background=cols[i%3];box.appendChild(d);
    const a=Math.PI*2*i/n+Math.random()*.6,sp=1+Math.random()*1.4;UIFX.parts.push({d,x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(fire?1.8:1.2),t:0,fire,ph:i})}
  {const t0=performance.now();setTimeout(()=>{if(TAPOBJ<t0&&!(typeof TAPPEND!=='undefined'&&TAPPEND>=t0))sfx(fire?'crackle':'leaf')},0)}/* 物にさわったときは、その物の音だけ */if(!UIFX.raf)UIFX.raf=requestAnimationFrame(tapFxStep)}
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
  if(LDW.pat==='walk'){x=u<.5?-24+u*2*(Wd+4):Wd-20-(u-.5)*2*(Wd+4);f=u<.5?1:-1}/* 左の外から来て、もどって左の外へ（どのならびも、画面の外で切りかわる） */
  else if(LDW.pat==='chase')x=-50+u*(Wd+74);/* 前を飛ぶちょう（x+22）も、画面の外から出て外へ消える */
  else x=-24+u*(Wd+48);/* 左から右へ通りぬける（はしは、運ぶ物も見えない所） */
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
function uiSwing(e){if(uiReduced()||!e)return;{const n=performance.now();if(n-(UIFX.crk||0)>450){UIFX.crk=n;sfx('creak')}}/* なわが、きゅ… */e.classList.remove('uswing');void e.offsetWidth;e.classList.add('uswing');clearTimeout(e._swT);e._swT=setTimeout(()=>e.classList.remove('uswing'),1050)}
document.addEventListener('click',e=>{if(!document.body.classList.contains('wd0'))return;const b=e.target&&e.target.closest&&e.target.closest('.dock button,.quest');if(b)uiSwing(b)},true);
/* 草原のボタン：はなしたとき、ぽよんとはねかえる */
document.addEventListener('pointerup',e=>{if(!document.body.classList.contains('wd0')||uiReduced())return;const b=e.target&&e.target.closest&&e.target.closest('.btn,.ctab,.slot,.qbtn,.mtile,.chip,#speedBtn,#pauseBtn,#skipBtn');if(!b||b.disabled)return;b.classList.remove('uboing');void b.offsetWidth;b.classList.add('uboing');clearTimeout(b._boT);b._boT=setTimeout(()=>b.classList.remove('uboing'),360);
  const q=b.getBoundingClientRect();if(q.width){sawdust(q.left+4,q.bottom-3,3);sawdust(q.right-4,q.bottom-3,3)}},true);
/* 下のシートが「ことん」と置かれた瞬間（kotonn の55%）に、上の左右のはしから木くず */
document.addEventListener('animationstart',e=>{if(e.animationName!=='kotonn')return;const el=e.target;setTimeout(()=>{const q=el.getBoundingClientRect();if(q.width&&document.body.classList.contains('wd0')){sawdust(q.left+12,q.top+2,4,16);sawdust(q.right-12,q.top+2,4,16)}},165)});
/* ハンコ：たっせいした物（目標の札・知らせ）に、赤い「できた」をポンとおす。2.4秒でうすくなって消える */
const STAMPCS={};/* ハンコの絵：字ごと */
function stampCanvas(tx,N){tx=tx||'できた';N=N||32;const K=tx+'@'+N;if(STAMPCS[K])return STAMPCS[K];const c=document.createElement('canvas');c.width=N;c.height=N;const g=c.getContext('2d'),cx=N/2,cy=N/2,R=N/2-1;g.fillStyle='#d6453a';/* N：32（ふつう）・48（大きなハンコ。字は3行） */
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const d=Math.hypot(x+.5-cx,y+.5-cy);if(d<=R&&d>R-2.2&&(x*7+y*3)%11)g.fillRect(x,y,1,1)}/* ふちは、ところどころインクがかすれる */
  const t=document.createElement('canvas');t.width=N;t.height=N;const h=t.getContext('2d');h.font='10px PixelMplus10';h.textAlign='center';h.textBaseline='middle';h.fillStyle='#d6453a';if(N>=48){const n=Math.ceil(tx.length/3),m=Math.ceil((tx.length-n)/2);[tx.slice(0,n),tx.slice(n,n+m),tx.slice(n+m)].forEach((s,i)=>h.fillText(s,cx,cy+(i-1)*11))}/* 3行（よくで・きま・した） */else{const a=tx.slice(0,Math.ceil(tx.length/2)),b=tx.slice(Math.ceil(tx.length/2));h.fillText(a,cx,cy-5);h.fillText(b,cx,cy+6)}/* 2行に分ける（できた→でき・た、かつやく→かつ・やく） */
  const d=h.getImageData(0,0,N,N);for(let i=3;i<d.data.length;i+=4)d.data[i]=d.data[i]>110?255:0;h.putImageData(d,0,0);g.drawImage(t,0,0);t.width=t.height=0;/* 字はドットのまま（うすい所はけす） */
  return STAMPCS[K]=c}
const STAMPHIT=228;/* ハンコの動き（ustamp .6秒）の38%で紙にとどく */
function stampInk(el,c,N){/* インクのとびちり：ハンコのまわりに、赤いドットが外へはねて消える（1ドット＝ハンコと同じ大きさ、0.34秒） */if(uiReduced())return;const k=document.createElement('canvas'),M=N*2;k.width=k.height=M;k.className='uink';
  const r=c.getBoundingClientRect(),q=el.getBoundingClientRect(),sc=r.width/N;k.style.width=k.style.height=M*sc+'px';k.style.left=(r.left-q.left-N/2*sc)+'px';k.style.top=(r.top-q.top-N/2*sc)+'px';el.appendChild(k);
  const g=k.getContext('2d'),n=10+(Math.random()*4|0),D=[];for(let i=0;i<n;i++){const a=i/n*6.283+Math.random()*.4;D.push([a,N*.42+Math.random()*N*.08,1+(Math.random()*2|0),N*.12+Math.random()*N*.16])}
  const t0=performance.now(),T=340;const f=()=>{const u=(performance.now()-t0)/T;g.clearRect(0,0,M,M);if(u>=1||!k.isConnected){k.remove();return}
    g.fillStyle='#d6453a';g.globalAlpha=u<.6?1:1-(u-.6)/.4;const e=1-(1-u)*(1-u);for(const[a,r0,s,d]of D){const rr=r0+d*e;g.fillRect(Math.round(M/2+Math.cos(a)*rr-s/2),Math.round(M/2+Math.sin(a)*rr*.85-s/2),s,s)}requestAnimationFrame(f)};requestAnimationFrame(f)}
function uiStamp(el,small,tx,big){if(!el||!el.isConnected)return;const N=big?48:32,c=document.createElement('canvas');c.width=c.height=N;c.getContext('2d').drawImage(stampCanvas(tx,N),0,0);c.className='ustamp'+(big?' b':small?' s':'');/* big：大きなハンコ（48ドット） */
  if(getComputedStyle(el).position==='static')el.style.position='relative';el.appendChild(c);
  setTimeout(()=>{if(!c.isConnected)return;el.classList.remove('ushake','ustampk');void el.offsetWidth;el.classList.add('ustampk');sfx('ostamp');buzz(25);stampInk(el,c,N)},STAMPHIT);/* ふりあげて、ためて、ドンとおした瞬間に「ぽんっ」：紙がゆれて、インクが少しとびちる */
  setTimeout(()=>c.classList.add('out'),2400);setTimeout(()=>c.remove(),2850)}
/* ---- 手ざわりのつづき：ふるえ・長おし・タブの音・行がならぶ・板がしなる・ゲージの音 ---- */
/* スマホのふるえ（Android。iPhone のブラウザはふるえない）。設定の「ふるえ」でとめられる */
function buzz(ms){if(SND.vib===false||!navigator.vibrate)return;try{navigator.vibrate(ms)}catch(e){}}
/* タブをおしたら、めくる音（そのタブのボタンの音のかわり。audio.js の SFXTAB） */
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('.ctab');if(!t)return;const flip=document.body.classList.contains('wd0')&&!uiReduced()&&t.closest('.ctabs')&&!t.closest('.pxcard')&&!t.closest('.sheet[data-k="zukan"]');/* 草原で札がくるっとまわるタブは、その音（flip）だけ */
  SFXTAB=flip?2:1;SFXTABD=0;setTimeout(()=>{if(!SFXTABD&&!flip)sfx('tab');SFXTAB=0},0)},true);
/* ±のボタン：長くおすと、くりかえし数がかわり、だんだん速くなる（かち、かち、かちかちかち） */
const REP={b:null,t:0,n:0,done:0,inC:0},REPSEL='.btn.m,.btn.p';
function repStop(){clearTimeout(REP.t);REP.b=null}
document.addEventListener('pointerdown',e=>{const b=e.target&&e.target.closest&&e.target.closest(REPSEL);repStop();REP.n=0;REP.done=0;if(!b)return;REP.b=b;
  const tick=()=>{if(REP.b!==b||!b.isConnected)return repStop();REP.n++;SFXR=1+Math.min(.12,REP.n*.006);REP.inC=1;try{b.click()}finally{REP.inC=0;SFXR=1}REP.done=1;DEEP.rep=1;buzz(4);REP.t=setTimeout(tick,Math.max(50,170-REP.n*20))};REP.t=setTimeout(tick,420)},true);
for(const ev of['pointerup','pointercancel'])document.addEventListener(ev,repStop,true);
document.addEventListener('click',e=>{if(REP.inC||!REP.done)return;const b=e.target&&e.target.closest&&e.target.closest(REPSEL);if(b){REP.done=0;e.stopPropagation();e.preventDefault()}},true);/* くりかえしたあと、指をはなしたときの1回はかぞえない */
/* おしこむ深さ：0.28秒より長くおすと、もう1ドット深くしずむ。はなすと、大きくはねて「ぽよん」（長くおすほど高い） */
const DEEP={b:null,t0:0,tm:0,rep:0},DEEPT=280,PRESSSEL='.btn,.ctab,.slot,.qbtn,.mtile,.chip,#speedBtn,#pauseBtn,#skipBtn,.dock button';
document.addEventListener('pointerdown',e=>{const b=e.target&&e.target.closest&&e.target.closest(PRESSSEL);if(!b||b.disabled)return;buzz(6);if(holdOn(b))return;/* おしつづけて決めるボタンは、焼き印のほう */DEEP.b=b;DEEP.t0=performance.now();DEEP.rep=0;clearTimeout(DEEP.tm);DEEP.tm=setTimeout(()=>{if(DEEP.b===b&&!uiReduced())b.classList.add('udeep')},DEEPT)},true);
for(const ev of['pointerup','pointercancel'])document.addEventListener(ev,e=>{const b=DEEP.b;if(!b)return;DEEP.b=null;clearTimeout(DEEP.tm);const held=performance.now()-DEEP.t0,deep=b.classList.contains('udeep');b.classList.remove('udeep');
  if(ev!=='pointerup'||!deep||DEEP.rep||held<DEEPT||uiReduced())return;if(document.body.classList.contains('wd0')&&b.closest('.dock'))return;/* 草原の下のバーは、つるした木札（ゆれる） */
  b.classList.remove('uboing','uboing2');void b.offsetWidth;b.classList.add('uboing2');clearTimeout(b._bo2);b._bo2=setTimeout(()=>b.classList.remove('uboing2'),480);SFXR=1+Math.min(1,(held-DEEPT)/900)*.6;try{sfx('boing')}finally{SFXR=1}},true);
/* 下のシートを開いたとき：行が上から1つずつ、ことっと置かれる（見えている所の10行まで） */
function uiRowsIn(){if(uiReduced())return;const b=document.getElementById('sheetBody');if(!b)return;const L=[];
  for(const c of b.children){const rs=[...c.children].filter(e=>e.matches('.row,.mtile,.slot,.mtag,label,.zk'));if(rs.length>2)L.push(...rs);else L.push(c)}
  if(document.body.classList.contains('wd0'))for(let i=L.length-1;i>=0;i--)if(L[i].matches('.mtile')||L[i].querySelector('.mtile'))L.splice(i,1);/* 草原のメニューの板は「とん、とん」（tileStagger）のほう *//* 一覧・タイルのならびは、1つずつ */
  const top=b.getBoundingClientRect().top,Hh=b.clientHeight,base=document.body.classList.contains('wd0')?150:60;let i=0;
  for(const c of L){if(i>=10)break;if(!c.offsetHeight)continue;if(c.getBoundingClientRect().top-top>Hh)break;const d=base+i*55,k=i;c.style.animationDelay=d+'ms';c.classList.add('urow');setTimeout(()=>{if(!c.isConnected)return;SFXR=1.05+k*.035;try{sfx('rowin')}finally{SFXR=1}},d);setTimeout(()=>{c.classList.remove('urow');c.style.animationDelay=''},d+300);i++}}
/* 一覧のはしまでスクロールすると、板が少したわんで、もどる（1ドットずつ） */
const OSB={el:null,y:0,p:0,an:0,wh:0};
function osbSet(el,p){el.style.transform=p?'translateY('+Math.round(p/1.5)*1.5+'px)':''}
function osbSpring(el,p){const sq=[p,-p*.3,p*.12,-p*.05,0];let i=0;clearTimeout(OSB.an);const st=()=>{osbSet(el,sq[i]);if(++i<sq.length)OSB.an=setTimeout(st,55)};st()}
const osbTop=el=>el.scrollTop<=0,osbBot=el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1;
document.addEventListener('touchstart',e=>{const el=e.target&&e.target.closest&&e.target.closest('#sheetBody');OSB.el=el&&!uiReduced()?el:null;if(OSB.el){OSB.y=e.touches[0].clientY;OSB.p=0}},{capture:true,passive:true});
document.addEventListener('touchmove',e=>{const el=OSB.el;if(!el)return;const y=e.touches[0].clientY,dy=y-OSB.y;let p=0;
  if(dy>0&&osbTop(el))p=Math.min(12,dy*.2);else if(dy<0&&osbBot(el))p=Math.max(-12,dy*.2);else OSB.y=y;/* はしに着くまでは、ひっぱった分にしない */
  OSB.p=p;clearTimeout(OSB.an);osbSet(el,p)},{capture:true,passive:true});
for(const ev of['touchend','touchcancel'])document.addEventListener(ev,()=>{const el=OSB.el;if(!el)return;OSB.el=null;const p=OSB.p;OSB.p=0;if(Math.abs(p)>=4.5){SFXR=Math.min(1,Math.abs(p)/12);try{sfx('bend')}finally{SFXR=1}}if(p)osbSpring(el,p)},{capture:true,passive:true});
document.addEventListener('wheel',e=>{const el=e.target&&e.target.closest&&e.target.closest('#sheetBody');if(!el||uiReduced()||el.scrollHeight<=el.clientHeight+1)return;const n=performance.now();if(n-OSB.wh<500)return;
  const p=e.deltaY<0&&osbTop(el)?6:e.deltaY>0&&osbBot(el)?-6:0;if(!p)return;OSB.wh=n;SFXR=.4;try{sfx('bend')}finally{SFXR=1}osbSpring(el,p)},{passive:true});
/* 村レベルのゲージがたまると、とくとく */
function uiGaugeWatch(){const e=document.getElementById('xpBar');if(!e)return;let pv=parseFloat(e.style.width)||0,lt=0;new MutationObserver(()=>{const v=parseFloat(e.style.width)||0,p=pv;pv=v;if(!(v>p)||!started)return;const n=performance.now();if(n-lt<600)return;lt=n;sfx('glug')}).observe(e,{attributes:true,attributeFilter:['style']})}
uiNumWatch();uiGaugeWatch();
/* 草原：メニュー・一覧をひらくと、ボタンの板が1まいずつ「とん、とん」と置かれる（CSS の tontile・tontileR（ゆれる向きが1まいごとに左右こうご）と、おくれ --ti。下のはしを軸に、つぶれて、小さく左右にゆれる）。音は板が置かれる瞬間に */
document.addEventListener('animationstart',e=>{if((e.animationName==='tontile'||e.animationName==='tontileR')&&!uiReduced())setTimeout(()=>sfx('tile'),65)});
function tileStagger(root){if(!document.body.classList.contains('wd0')||uiReduced()||!root)return;const L=root.querySelectorAll('.mtile');let i=0;for(const b of L){if(i>=12)break;b.style.setProperty('--ti',(i*50)+'ms');b.classList.remove('utile');void b.offsetWidth;b.classList.add('utile');i++}}
function tileWatch(){const b=document.getElementById('sheetBody');if(!b)return;new MutationObserver(()=>{const n=b.querySelectorAll('.mtile').length,k=n?n+'|'+(b.firstElementChild?b.firstElementChild.textContent.slice(0,20):''):0;if(k!==b._tileN){b._tileN=k;if(n)tileStagger(b)}}).observe(b,{childList:true})}/* 下のシートの中身がかわったときだけ */
/* 草原：タブをかえると、中の板が、札をひっくり返すように、くるっとまわって中身がかわる（タブのならび .ctabs のあとの物。図鑑の本はのぞく） */
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('.ctabs .ctab');if(!t||!document.body.classList.contains('wd0')||uiReduced()||t.closest('.pxcard')||t.closest('.sheet[data-k="zukan"]'))return;
  sfx('flip');requestAnimationFrame(()=>{const tb=document.querySelector('#sheetBody .ctabs');if(!tb)return;let n=tb.nextElementSibling;while(n){n.classList.remove('uflip');void n.offsetWidth;n.classList.add('uflip');n=n.nextElementSibling}})},true);
/* もどせない決定（data-hold のボタン）は、どのステージでも、おしつづけると、焼き印のこげ色がたまって「じゅっ」と決まる（0.7秒）。ふつうのタップでは決まらない */
const HOLDMS=700;
function holdOn(b){return !!(b&&b.hasAttribute&&b.hasAttribute('data-hold'))}/* 値なしの data-hold も（値の中身では見ない。空の値は偽なので、長押しが決まらなかった） */
document.addEventListener('pointerdown',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-hold]');if(!holdOn(b)||b.disabled)return;b.classList.add('holding');b.style.setProperty('--hold',HOLDMS+'ms');
  clearTimeout(b._hT);b._hT=setTimeout(()=>{b.classList.remove('holding');b._held=1;sfx('sizzle');b.classList.add('branded');setTimeout(()=>b.classList.remove('branded'),400);b.click();b._held=0},HOLDMS)},true);
for(const ev of['pointerup','pointercancel','pointerleave'])document.addEventListener(ev,e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-hold]');if(!b||!b._hT)return;if(b.classList.contains('holding')){clearTimeout(b._hT);b._hT=0;b.classList.remove('holding')}},true);
document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-hold]');if(!holdOn(b)||b._held)return;e.preventDefault();e.stopImmediatePropagation();toast('おしつづけて決めよう')},true);
/* 草原：ゲージがふえるときは、はちみつのように、とろっとのびて、さきが少しゆれて止まる（gwob） */
function gaugeWatch(){for(const id of['xpBar','foodBar','matBar']){const i=document.getElementById(id);if(!i)continue;let p=parseFloat(i.style.width)||0;
  new MutationObserver(()=>{const v=parseFloat(i.style.width)||0;if(v>p+.5&&document.body.classList.contains('wd0')&&!uiReduced()){const g=i.parentElement;g.classList.remove('gwob');void g.offsetWidth;g.classList.add('gwob');clearTimeout(g._gT);g._gT=setTimeout(()=>g.classList.remove('gwob'),1400)}p=v}).observe(i,{attributes:true,attributeFilter:['style']})}}

/* 草原：一覧を指でなでると、行の板が通りすぎるたびに、木の歯車の「カラッ」（1行は約40px） */
document.addEventListener('scroll',e=>{const el=e.target;if(!el||!el.closest||!el.closest('#sheetWrap')||!document.body.classList.contains('wd0'))return;const k=Math.floor(el.scrollTop/40);if(el._xyl===undefined)el._xyl=0;
  if(k!==el._xyl){el._xyl=k;sfx('xyl')}},true);
/* 草原：村レベルが上がったら、上の欄の数に、新しい数が焼き印で「じゅっ」とおされて、けむりがたつ */
function smoke(x,y,n){if(uiReduced())return;let box=document.getElementById('tapFx');if(!box){box=document.createElement('div');box.id='tapFx';document.body.appendChild(box)}
  const cols=['#d8cfc0','#c4baa9','#ece4d6'];for(let i=0;i<n&&UIFX.parts.length<40;i++){const d=document.createElement('i'),sz=(i%2?3:1.5);d.style.width=d.style.height=sz+'px';d.style.background=cols[i%3];box.appendChild(d);
    UIFX.parts.push({d,x:x+(Math.random()-.5)*8,y,vx:(Math.random()-.5)*.4,vy:-.5-Math.random()*.5,t:-i*3,smoke:1,ph:i})}if(!UIFX.raf)UIFX.raf=requestAnimationFrame(tapFxStep)}
function lvWatch(){const e=document.getElementById('lvLbl');if(!e)return;let p=parseInt(e.textContent,10);new MutationObserver(()=>{const v=parseInt(e.textContent,10);
  if(v>p&&started){if(typeof juiceLvUp==='function')juiceLvUp(e,p,v);else lvBrand(e)}p=v}).observe(e,{childList:true,characterData:true,subtree:true})}/* バーがあふれてから焼き印（juice3.js） */
function lvBrand(e){if(!document.body.classList.contains('wd0')||uiReduced())return;e.classList.remove('ubrand');void e.offsetWidth;e.classList.add('ubrand');sfx('sizzle');const q=e.getBoundingClientRect();smoke(q.left+q.width/2,q.top,7);clearTimeout(e._bT);e._bT=setTimeout(()=>e.classList.remove('ubrand'),1000)}
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

/* ボタンでない所（文字・すきま・なにもない一覧の行）をタップしたら、木をそっとたたく音（uknock。やわらかく小さく）。
   地図（キャンバス）のタップ・ボタン・入力・押せる物（onclick のある物とその中）は、それぞれの音があるので鳴らさない */
addEventListener('click',e=>{try{let n=e.target;if(!n||!n.closest||n.closest('canvas')||!n.closest('#app'))return;
  for(;n&&n!==document.body;n=n.parentElement){const tg=n.tagName;if(tg==='BUTTON'||tg==='A'||tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA'||tg==='LABEL'||tg==='SUMMARY'||n.onclick||n.onpointerdown||n.hasAttribute('data-hold')||n.getAttribute('role')==='button')return}
  sfx('uknock')}catch(_){}},true);
/* おせる所を広げる：小さなボタン・タブ（44pxより小さい）のまわりの、何もない所（パネルの地）をおしたら、
   いちばん近いボタンをおしたことにする。ボタンの見た目の中・マップの上のタップはかえない。
   ならんだボタンどうしで、となりの見えている所をうばわないよう、見えない「おせる所」を重ねずに、ここで決める */
const TAPSLOP=44,TAPBOX='.sheet,.pxcard,.idea-card,.dlg,#dialog,#confirm,#palette,.paper,#topUI,.dock,.askyn,#helpPop,.wcard,#lvup,#rlv';
function tapSlopPick(t,x,y){if(!t||!t.querySelectorAll||t.id==='cv'||t.closest('canvas,input,select,textarea'))return null;
  if(t.closest('button,a[href],[role=button],[role=tab],label,[tabindex="0"]'))return null;/* もう何かをおしている */
  const box=t.closest(TAPBOX)||t;let best=null,bd=1e9;/* おした所をふくむパネルの中のボタンから */
  for(const b of box.querySelectorAll('button,[role=button],[role=tab]')){if(b.disabled||b.closest('[hidden]'))continue;
    const r=b.getBoundingClientRect();if(!r.width||!r.height)continue;
    const w=Math.max(r.width,TAPSLOP),h=Math.max(r.height,TAPSLOP),cx=r.left+r.width/2,cy=r.top+r.height/2;
    if(Math.abs(x-cx)>w/2||Math.abs(y-cy)>h/2)continue;/* 44pxにのばした所の外 */
    const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),d=dx*dx+dy*dy;if(d<bd){bd=d;best=b}}
  return best}
document.addEventListener('click',e=>{if(!e.isTrusted)return;const b=tapSlopPick(e.target,e.clientX,e.clientY);if(!b)return;
  e.preventDefault();e.stopPropagation();b.click()},true);
/* わざのボタン：チャージがたまった・パワーがそろって使えるようになった瞬間に、ぽんとはねて「ちりん」。チャージ中におしたら、ボタンが左右にふるえる */
const SKP={};function skillReady(el,k,p){if(el.hidden){SKP[k]=null;return}const q=SKP[k];SKP[k]=p;if(q==null||q>=1||p<1)return;el.classList.remove('sready');void el.offsetWidth;el.classList.add('sready');sfx('tink')}
function skillDeny(sel){const el=typeof sel==='string'?document.querySelector(sel):sel;if(!el)return;el.classList.remove('ushake');void el.offsetWidth;el.classList.add('ushake');buzz(15)}
