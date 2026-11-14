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
function uiNumChanged(id,e){const v=parseInt(e.textContent,10),p=UIFX.prev[id];UIFX.prev[id]=v;if(!(v>p)||!started||uiReduced())return;
  const now=performance.now();if(now-(UIFX.spk[id]||0)<350)return;UIFX.spk[id]=now;/* 続けてふえるときは、0.35秒に1回だけ */
  e.classList.remove('nbump');void e.offsetWidth;e.classList.add('nbump');sfx('count');
  const tag=e.closest('.htag');if(tag){const s=document.createElement('i');s.className='nspk';tag.appendChild(s);setTimeout(()=>s.remove(),520)}}
/* 地図をタップしたところに、小さな葉（火山は火の粉）。1粒は1ドット（1.5px）のます目にそろえて動かす */
function tapFx(x,y){if(uiReduced())return;const fire=WD===1,n=fire?6:5;let box=document.getElementById('tapFx');if(!box){box=document.createElement('div');box.id='tapFx';document.body.appendChild(box)}
  const cols=fire?['#f2a43a','#f7d067','#e0663a']:['#6aa857','#8fca6b','#4f8a40'];
  for(let i=0;i<n&&UIFX.parts.length<30;i++){const d=document.createElement('i'),sz=(fire?(i%3?1:2):(i%2?2:3))*1.5;d.style.width=d.style.height=sz+'px';d.style.background=cols[i%3];box.appendChild(d);
    const a=Math.PI*2*i/n+Math.random()*.6,sp=1+Math.random()*1.4;UIFX.parts.push({d,x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(fire?1.8:1.2),t:0,fire,ph:i})}
  sfx(fire?'crackle':'leaf');if(!UIFX.raf)UIFX.raf=requestAnimationFrame(tapFxStep)}
function tapFxStep(){UIFX.raf=0;const P=UIFX.parts;for(let i=P.length-1;i>=0;i--){const p=P[i];p.t++;p.x+=p.vx;p.y+=p.vy;
    if(p.fire){p.vy-=.03;p.vx*=.97}else{p.vy+=.05;p.vx*=.96;p.x+=Math.sin(p.t*.2+p.ph)*.5}/* 火の粉はのぼり、葉はゆれながら落ちる */
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
let UIWD=null;function uiStageSync(){const w=started&&typeof WD==='number'?WD:-1;if(w===UIWD)return;UIWD=w;document.body.classList.toggle('wd0',w===0)}
uiNumWatch();
