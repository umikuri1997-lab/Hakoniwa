/* 数がたまって、はじける演出（juice3.js）。見た目と音だけ（数字はかえない・セーブしない）。
   ・朝の日記の数え上げ（juiceDiaryCount）：朝に出た紙だけ、「きのうのしごと」「ゆうべの守り」の数を0から順に数え上げ、
     1つふえるごとに木の「カチッ」（notch の録音。だんだん高く）。さいごに「きのうのしごと」へ大きなハンコ「よくできました」。タップでとばす。
   ・なかよしのハート（juiceBondHeart）：なかよしが30・60・100にとどいたとき、2人のあいだにドットのハートがふくらんで、ぽんとはじける（マップの上）。
   ・守りつづけた夜のめくり（juiceStreakTick）：日の欄の、たてのアイコンの晩の数が、めくり数字で+1。節目（5の倍数）は光る。
     画面・会話・村レベルのカードが出ているあいだは、とじてから（そのあいだは前の数を出す streakShown）。
   ・はじめての料理の名前めくり（juiceNameFlip）：「？？？」が1字ずつ、くるっとめくれて名前になる。
   ・地図の切れはしがくっつく（juiceMapJoin）：3まいがまわりからよってきて、パチッと合わさり、宝の地図になって×が光る。
   ・村レベルのバーがあふれる（juiceLvUp）：村レベルが上がったら、カードをとじたあとで、上の欄のバーがいっぱいまで満ちて光り、
     光のつぶがこぼれてから、新しい数に焼き印（lvBrand）。
   うごきをへらす設定（uiReduced）では、動かさずに、さいごの形をすぐ出す。 */
const J3COUNTMS=80,J3COUNTMAX=12,J3HEARTMS=900,J3POPMS=650,J3MAPMS=1500,J3LVFILL=600,J3LVGLOW=350,J3LVDROP=400;
const J3HEARTC={30:['#e86a8a','#ffb3c6'],60:['#d84a7a','#ff8fb0'],100:['#d9a230','#ffe58a']};/* ふち・中の色 */
const J3H=[];let J3ST=null,J3LV=null;
function j3OK(){return typeof juiceOK==='function'&&juiceOK()}
function j3U(k,v,st,dl){/* 本物の録音（playU）を、st 半音だけ高く・dl 秒あとに */if(typeof AC==='undefined'||!AC||!SND.sfx||AC.state!=='running'||typeof playU!=='function')return;try{playU(k,v,Math.pow(2,(st||0)/12),dl||0)}catch(e){}}
function j3Ding(st,dt,v){j3U('tink',v?v*.6:.18,st,dt)}/* 小さな鈴の「チン」（オルゴールの録音） */

/* ---------- 朝の日記の数え上げ ---------- */
const J3WORK=[['harvest','しゅうかく'],['plant','植えた'],['craft','作った'],['build','建てた'],['fish','つり']];
function dyWorkSum(e){/* きのうのしごと：種類ごとの回数（みんなのしたこと と同じ記録。料理も「作った」） */const T={};for(const x of e.w||[]){const t=x[3]==='cook'?'craft':x[3];T[t]=(T[t]||0)+x[5]}return J3WORK.filter(k=>T[k[0]]>0).map(k=>[k[1],T[k[0]]+'回'])}
function juiceDiaryCount(body,secW,defer){/* diaryBody から（朝に出した紙だけ）。body：日記の本の1ページ。secW：きのうのしごと の欄（なければ null）。defer：数を0にしておき、はじめる関数をかえす（ページを見せたときによぶ） */
  const L=[...body.querySelectorAll('.stat b')].filter(b=>/^\d+/.test(b.textContent));if(!L.length&&!secW)return defer?cb=>{if(cb)cb()}:undefined;
  let onDone=null;/* defer のとき：はじめる関数に、おわったら呼ぶ関数をわたせる（日記の自動でめくる） */
  const st=S,items=L.map(b=>{const m=b.textContent.match(/^(\d+)(.*)$/);return{b,n:+m[1],sf:m[2]}});
  let done=false;const stamp=()=>{if(secW&&secW.isConnected&&!secW.closest('.bkstore'))uiStamp(secW,false,'よくできました',true)};
  const finish=()=>{if(done)return;done=true;for(const it of items)it.b.textContent=it.n+it.sf;body.removeEventListener('pointerdown',finish,true);setTimeout(()=>{stamp();if(onDone)setTimeout(onDone,secW?700:0)},250)};
  if(uiReduced()||!items.length){if(defer)return cb=>{onDone=cb;finish()};finish();return}
  for(const it of items)it.b.textContent='0'+it.sf;
  body.addEventListener('pointerdown',finish,true);/* タップで、すぐにさいごの数 */
  let i=0,k=0,tick=0;const step=()=>{if(done)return;if(!body.isConnected||S!==st){done=true;return}if(body.closest('.bkstore')){finish();return}/* ページをめくった：見えていない数を数えつづけない（音も） */
    const it=items[i];if(!it){finish();return}const inc=Math.max(1,Math.ceil(it.n/J3COUNTMAX));k=Math.min(it.n,k+inc);it.b.textContent=k+it.sf;
    const pop=c=>{it.b.classList.remove('ucntp','ucntd');void it.b.offsetWidth;it.b.classList.add(c)};
    if(it.n>0){sfx('xyl');tick++;pop('ucntp')}/* 1つふえるたびに、一覧のスクロールと同じ「カラッ」と、数がはねる */
    if(k>=it.n){pop('ucntd');const row=it.b.closest('.stat');if(row){row.classList.add('ucntrow');setTimeout(()=>row.classList.remove('ucntrow'),420)}if(it.n>0){j3U('tink',.3,JUICE_SCALE[Math.min(i*2+6,JUICE_SCALE.length-1)]);const q=it.b.getBoundingClientRect();if(typeof sawdust==='function'&&q.width)sawdust(q.left+q.width/2,q.top+q.height/2,6,18)}/* 数がそろった行は、大きくはねて光り、木くずがはじける */
      i++;k=0;setTimeout(step,J3COUNTMS*4)}else setTimeout(step,J3COUNTMS)};
  const go=cb=>{onDone=cb||null;setTimeout(step,450)};if(defer)return go;go()}

/* ---------- なかよしのハート ---------- */
function juiceBondHeart(a,b,lv){if(!j3OK()||!a||!b||a.hidden||b.hidden||J3H.length>3)return;J3H.push({a,b,lv,t0:performance.now(),s:0});}
function j3Mid(h){const x=(h.a.x+h.b.x)/2,y=Math.min(h.a.y,h.b.y),j=(y|0)*W+(x|0),lift=typeof hiAt==='function'?liftOf(j):0;return[x*TS,(y-1.7)*TS-lift]}
function j3Heart(c,cx,cy,P,C,a){const R=BONDHEART,w=R[0].length,h=R.length,x0=Math.round(cx-w*P/2),y0=Math.round(cy-h*P/2);c.globalAlpha=a;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=R[y][x];if(ch==='.')continue;c.fillStyle=ch==='o'?C[0]:C[1];c.fillRect(x0+x*P,y0+y*P,P,P)}c.globalAlpha=1}
function juiceBondDraw(now){const c=ctx;for(let i=J3H.length-1;i>=0;i--){const h=J3H[i],e=now-h.t0;if(e>J3HEARTMS+J3POPMS||h.a.hidden||h.b.hidden){J3H.splice(i,1);continue}
    const C=J3HEARTC[h.lv]||J3HEARTC[30],[cx,cy]=j3Mid(h);isoAt(c,(h.a.x+h.b.x)/2*TS,(h.a.y+h.b.y)/2*TS);/* クォータービュー：2人のまん中を足もとに */
    if(e<J3HEARTMS){const u=e/J3HEARTMS,P=2+Math.floor(u*4)*(h.lv>=100?1.5:1),wob=Math.floor(e/90)%2?2:0;/* 2・3・4・5ドットと、だんだんふくらむ。ふくらむたびに、ぷるっと */
      if(h.s<Math.floor(u*4)){h.s++;j3Ding(JUICE_SCALE[h.s*2],0,.25)}j3Heart(c,cx,cy-wob,Math.round(P),C,Math.min(1,u*4))}
    else{const u=(e-J3HEARTMS)/J3POPMS;if(h.s<9){h.s=9;j3Ding(12,0,.35);j3Ding(16,.03,.3);j3Ding(19,.06,.3);if(typeof buzz==='function')buzz(15)}/* ぽんっ：和音 */
      const n=h.lv>=100?14:10,r=(8+u*34)|0;for(let k=0;k<n;k++){const an=k/n*6.283+.3,x=cx+Math.cos(an)*r,y=cy+Math.sin(an)*r*.8+u*u*10;j3Heart(c,x,y,1,C,1-u)}
      if(u<.35){c.fillStyle='#fffbe8';c.globalAlpha=1-u/.35;const s=((6+u*30)|0)*2;for(let k=0;k<16;k++){const an=k/16*6.283;c.fillRect(Math.round(cx+Math.cos(an)*s/2)-1,Math.round(cy+Math.sin(an)*s/2)-1,2,2)}c.globalAlpha=1}}}isoBack(c)}

/* ---------- 守りつづけた夜のめくり ---------- */
function streakShown(){/* 日の欄に出す晩の数（めくる前は、前の数） */const v=(S&&S.streak)||0;if(!J3ST||J3ST.s!==S){J3ST={s:S,v};return v}return v>J3ST.v?J3ST.v:v}
function juiceStreakTick(){if(!S||!J3ST||J3ST.s!==S)return;const v=S.streak||0;if(v<=J3ST.v){J3ST.v=v;return}
  if(!started||sheet!=null||!$('#dialog').hidden||!$('#lvup').hidden||!$('#rlv').hidden||GIFT_ACTIVE||NEWRES!=null)return;
  const old=J3ST.v;J3ST.v=v;if(typeof updHUD==='function')updHUD();const e=document.querySelector('#dayLbl .stkn');if(!e||uiReduced())return;
  if(typeof uiRoll==='function')uiRoll(e,String(old),true);j3U('tab',.3);/* 札をめくる音（録音） */
  if(v%5===0){const tag=e.closest('.htag');villageTimeout(()=>{j3Ding(12);j3Ding(16,.05);j3Ding(19,.1);if(tag)for(let i=0;i<3;i++)setTimeout(()=>{const s=document.createElement('i');s.className='nspk';s.style.left=(e.offsetLeft+i*4)+'px';tag.appendChild(s);setTimeout(()=>s.remove(),520)},i*120);e.classList.add('ustkglow');setTimeout(()=>e.classList.remove('ustkglow'),1200)},260)}}/* 節目は光る */

/* ---------- はじめての料理の名前めくり ---------- */
function juiceNameFlip(nm,name){const ch=[...name];nm.textContent='';const sp=ch.map(()=>{const s=document.createElement('span');s.textContent='？';s.style.display='inline-block';nm.appendChild(s);return s});
  if(uiReduced()){sp.forEach((s,i)=>s.textContent=ch[i]);return}
  sp.forEach((s,i)=>setTimeout(()=>{if(!s.isConnected)return;s.textContent=ch[i];s.style.animation='none';void s.offsetWidth;s.style.animation='nrollU .24s steps(1)';j3U('tab',.28,Math.min(i,6)*2);if(i===ch.length-1)setTimeout(()=>{j3Ding(12);j3Ding(16,.04);j3Ding(19,.08)},120)},500+i*140))}

/* ---------- 地図の切れはしがくっつく ---------- */
function juiceMapJoin(){if(!j3OK()||uiReduced()||typeof TRPIX==='undefined')return;const N=96,cv=document.createElement('canvas');cv.width=cv.height=N;cv.className='j3map';document.body.appendChild(cv);
  const g=cv.getContext('2d'),t0=performance.now(),from=[[-30,-16],[30,-16],[0,30]];let snap=false;
  const draw=now=>{if(!cv.isConnected)return;const e=now-t0;if(e>J3MAPMS){cv.remove();return}g.clearRect(0,0,N,N);g.imageSmoothingEnabled=false;const cx=N/2,cy=N/2;
    g.globalAlpha=e>J3MAPMS-300?(J3MAPMS-e)/300:1;
    if(e<380){const u=Math.pow(e/380,2);/* よってくる（だんだん速く） */for(const f of from){const x=Math.round(cx-24+f[0]*(1-u)),y=Math.round(cy-24+f[1]*(1-u));pixDraw(g,TRPIX.mapPc,TRCOL.mapPc,x,y,3)}}
    else{if(!snap){snap=true;j3U('page',.34);j3Ding(7,.02,.3);j3Ding(12,.1,.3);if(typeof buzz==='function')buzz(15)}const u=(e-380)/(J3MAPMS-380);
      if(u<.25){g.fillStyle='#fff6d8';const r=(14+u*4*30)|0;for(let k=0;k<20;k++){const an=k/20*6.283;g.fillRect(Math.round(cx+Math.cos(an)*r)-1,Math.round(cy+Math.sin(an)*r)-1,2,2)}}/* パチッ：光の輪 */
      const bob=u<.1?-3:u<.2?1:0;pixDraw(g,TRPIX.tmap,TRCOL.tmap,cx-24,cy-24+bob,3);
      if(Math.floor(e/150)%2){g.fillStyle='#d6453a';for(let d=-3;d<=3;d++){g.fillRect(cx+9+d*2,cy+3+d*2,2,2);g.fillRect(cx+9+d*2,cy+3-d*2,2,2)}}/* ×が、ちかちか光る */
      for(let k=0;k<6;k++){const an=k/6*6.283+u*2,r=34+u*10;if((Math.floor(e/120)+k)%3)continue;g.fillStyle='#ffe58a';g.fillRect(Math.round(cx+Math.cos(an)*r),Math.round(cy+Math.sin(an)*r),2,2)}}
    g.globalAlpha=1;requestAnimationFrame(draw)};requestAnimationFrame(draw)}

/* ---------- つくった数のふきだしカウント ---------- */

/* ---------- 村レベルのバーがあふれる ---------- */
function juiceLvUp(e,p,v){/* lvWatch から。村レベルのカードをとじたあとで、バーが満ちる → 光る → つぶがこぼれる → 焼き印 */
  if(!started||uiReduced()||!document.getElementById('xpBar')){lvBrand(e);return}
  e.style.visibility='hidden';if(J3LV)return;const w0=JLVP&&JLVP.lv===p?JLVP.w:JLVL===p?JLVW:null;J3LV={e,w0,t0:0,st:S}}
function juiceLvTick(now){const x=document.getElementById('xpBar');if(!x)return;
  if(!J3LV){const lv=parseInt(($('#lvLbl')||{}).textContent,10),w=parseFloat(x.style.width);if(lv!==JLVL){JLVP={lv:JLVL,w:JLVW};JLVL=lv}if(isFinite(w))JLVW=w;return}/* レベルごとのバーの長さ（上がる前の長さを、あとで使う） */
  const L=J3LV;if(L.st!==S){L.e.style.visibility='';x.classList.remove('ufx');J3LV=null;return}
  if(!L.t0){if(sheet!=null||!$('#lvup').hidden||!$('#dialog').hidden||!$('#rlv').hidden||GIFT_ACTIVE)return;L.t0=now;if(L.w0==null)L.w0=0;x.classList.add('ufx')}
  const e=now-L.t0,wn=parseFloat(x.style.width)||0;let w;
  if(e<J3LVFILL){const q=Math.floor(e/J3LVFILL*10);w=L.w0+(100-L.w0)*q/10;if((L.k|0)<q&&q%2===0){L.k=q;j3Ding(JUICE_SCALE[Math.min(q/2,JUICE_SCALE.length-1)],0,.2)}}/* 満ちながら、チンがだんだん高く *//* とろっと、10だんで満ちる */
  else if(e<J3LVFILL+J3LVGLOW){w=100;if(!L.g){L.g=1;x.classList.add('uglow');j3Ding(12);j3Ding(16,.04);j3Ding(19,.08);const q=x.parentNode.getBoundingClientRect();j3Spill(q.right-2,q.top+q.height/2,12)}}/* あふれる */
  else if(e<J3LVFILL+J3LVGLOW+J3LVDROP){w=wn+(100-wn)*(1-Math.floor((e-J3LVFILL-J3LVGLOW)/J3LVDROP*5)/5);x.classList.remove('uglow')}
  else{x.classList.remove('ufx','uglow');L.e.style.visibility='';lvBrand(L.e);J3LV=null;return}
  x.style.setProperty('--uw',w.toFixed(1)+'%')}
let JLVW=null,JLVL=null,JLVP=null;
function j3Spill(x,y,n){/* 光のつぶ（UIFX の木くずと同じ動き。金色） */if(typeof UIFX==='undefined')return;let box=document.getElementById('tapFx');if(!box){box=document.createElement('div');box.id='tapFx';document.body.appendChild(box)}
  const cols=['#ffe58a','#f0c04a','#fff6d8'];for(let i=0;i<n&&UIFX.parts.length<40;i++){const d=document.createElement('i'),sz=i%3?1.5:3;d.style.width=d.style.height=sz+'px';d.style.background=cols[i%3];box.appendChild(d);
    UIFX.parts.push({d,x:x+(Math.random()-.5)*6,y,vx:.3+Math.random()*1.4,vy:-.8-Math.random()*1.2,t:0,dust:1,ph:i})}if(!UIFX.raf)UIFX.raf=requestAnimationFrame(tapFxStep)}

/* juice2 から */
function juice3Frame(now){juiceStreakTick();juiceLvTick(now);juiceResTick();if(typeof juice4Frame==='function')juice4Frame(now)}
function juice3Draw(now){if(typeof cupDraw==='function')cupDraw(now);if(typeof evShowDraw==='function')evShowDraw(now);if(typeof juice4Draw==='function')juice4Draw(now);if(J3H.length)juiceBondDraw(now);juiceFirstDraw(now);juiceDreamDraw(now);juiceSnowDraw(now)}
function juice3Reset(){if(typeof juice4Reset==='function')juice4Reset();J3H.length=0;J3ST=null;J3RN=null;J3F.length=0;J3D.length=0;J3S.clear();if(J3LV){J3LV.e.style.visibility='';const x=document.getElementById('xpBar');if(x)x.classList.remove('ufx','uglow');J3LV=null}JLVW=null;JLVL=null;JLVP=null}

/* ---------- なかまがふえた数（juiceResTick）：紹介をとじてから、上の欄のせいれいの数をふやし（めくり数字は uiNumWatch）、
   新しい子の上に「+1」、まわりのひまな子がそちらを向く。紹介のあいだは前の数（resShownN） ---------- */
let J3RN=null;
function resShownN(){const n=S.res.length;if(!J3RN||J3RN.s!==S){J3RN={s:S,v:n,ids:new Set(S.res.map(r=>r.id))};return n}return n>J3RN.v?J3RN.v:n}
function juiceResTick(){if(!S||!J3RN||J3RN.s!==S)return;const n=S.res.length;if(n<=J3RN.v){J3RN.v=n;J3RN.ids=new Set(S.res.map(r=>r.id));return}
  if(!started||NEWRES!=null||typeof NEWQ!=='undefined'&&NEWQ.length||sheet!=null||!$('#dialog').hidden||GIFT_ACTIVE)return;
  const nw=S.res.filter(r=>!J3RN.ids.has(r.id));J3RN.v=n;J3RN.ids=new Set(S.res.map(r=>r.id));if(typeof updHUD==='function')updHUD();
  const now=performance.now();for(const r of nw){if(r.hidden)continue;addFloatG(r.x,r.y,-1.6,'+1','#ffe58a');
    for(const o of S.res){if(o===r||o.hidden||Math.hypot(o.x-r.x,o.y-r.y)>8)continue;const a=o.act;if(a&&!(a.stage==='do'&&LISTEN_ACT.has(a.type)))continue;if(sacredPose(o))continue;sacredSetPose(o,{anim:'storyListen',at:now,duration:2600,...dlgLook(o,r),listen:true})}}/* そちらを向く */
  if(nw.length){j3Ding(7,.05);j3Ding(12,.12);j3Ding(16,.19)}}

/* ---------- はじめて置いた家具（juiceFirst）：着地のあと「はじめて！」の文字だけ（わく・背景なし）が1字ずつはねて出て、
   紙ふぶきと星のドットがはじける。音は、オルゴールの鈴（tink）の、かけあがるアルペジオと、キラッ（starkira：持ち主の音） ---------- */
const J3F=[],J3FMS=2600,J3FOUT=400,J3FTX='はじめて！',J3FCOL=['#ffe066','#ff8fb1','#8fd8ff','#a8f08a','#ffffff','#ffb056'];let J3FC=null;
function juiceFirst(j,id){if(!j3OK()||!BL[id]||BL[id].kind!=='furn'||J3F.length>3)return;const P=[];for(let k=0;k<28;k++){const a=hash(j*7+k*13)*6.283,v=50+hash(j+k*5)*90;P.push({vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-90-hash(k*3+j)*60,c:J3FCOL[k%J3FCOL.length],s:hash(k*11+j)>.5?2:3})}J3F.push({j,t0:performance.now()+450,s:0,P})}
function j3FirstChars(){/* 1字ずつの絵（ドットのフォント・金色・下にだけ1ドットのかげ） */if(J3FC)return J3FC;J3FC=[...J3FTX].map(ch=>{const c=document.createElement('canvas'),w=c.width=22,h=c.height=24,g=c.getContext('2d');g.font='20px PixelMplus10, sans-serif';g.textAlign='center';g.textBaseline='top';
  g.fillStyle='#a8661c';g.fillText(ch,w/2,2);g.fillStyle='#ffd23f';g.fillText(ch,w/2,0);return c});return J3FC}
function j3FirstSnd(){[0,4,7,12,16,19,24].forEach((st,k)=>j3Ding(st,k*.055,.5));j3U('starkira',.32,0,.4)}/* かけあがる鈴と、さいごにキラッ */
function juiceFirstDraw(now){
  if(!J3F.length)return;
  const c=ctx,Z=j3FirstChars(),sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
  for(let i=J3F.length-1;i>=0;i--){
    const f=J3F[i],e=now-f.t0;
    if(e<0)continue;
    if(e>J3FMS+J3FOUT){J3F.splice(i,1);continue}
    if(!f.s){f.s=1;j3FirstSnd()}
    const x=Math.round((f.j%W+.5)*TS),lift=liftOf(f.j),y=Math.round(((f.j/W)|0)*TS-30-lift),out=Math.min(1,Math.max(0,(e-J3FMS)/J3FOUT)),t=e/1000;isoAtA(c,isoOn()?cellFoot(f.j):null);/* クォータービュー：そのマスに立てて */
    /* 紙ふぶき（重さで落ちる）と、ひろがる星の十字 */
    for(const p of f.P){const u=Math.min(t,1.6),px=Math.round(x+p.vx*u),py=Math.round(y+8+p.vy*u+140*u*u);if(t>1.6)continue;c.globalAlpha=Math.max(0,1-t/1.6);c.fillStyle=p.c;c.fillRect(px,py,p.s,Math.floor(now/90+p.vx)%2?p.s:1)}
    if(e<700){const u=e/700,r=Math.round(8+u*44);c.globalAlpha=1-u;for(let k=0;k<10;k++){const a=k/10*6.283+.3,sx=Math.round(x+Math.cos(a)*r),sy=Math.round(y+6+Math.sin(a)*r*.6);c.fillStyle=k%2?'#fff6c8':'#ffd23f';c.fillRect(sx-2,sy,5,1);c.fillRect(sx,sy-2,1,5)}}
    for(let k=0;k<4;k++){const ph=((now/600)+k*.25)%1;if(e<300)break;c.globalAlpha=(1-ph)*(1-out);c.fillStyle='#fffbe0';const sx=Math.round(x-34+hash(k*17+f.j)*68),sy=Math.round(y+4-ph*18);c.fillRect(sx,sy,1,1);if(ph<.4){c.fillRect(sx-1,sy,3,1);c.fillRect(sx,sy-1,1,3)}}/* ふわっとのぼるきらめき */
    /* 文字：1字ずつ、ぽんとはねて出て、そろったら、ときどき波うつ */
    const n=Z.length,W0=17,x0=x-Math.round(n*W0/2);if(isoOn())isoUITf(c,cellFoot(f.j),x,y);/* 字は、のばさずに */
    for(let k=0;k<n;k++){const ek=e-k*70;if(ek<0)continue;const a=Math.min(1,ek/220),hop=ek<220?-Math.round(Math.sin(a*Math.PI)*12):ek<1400?0:-Math.round(Math.max(0,Math.sin((ek-1400)/160))*3);
      c.globalAlpha=(1-out)*Math.min(1,ek/80);c.drawImage(Z[k],x0+k*W0,y-10+hop-Math.round(out*8),22,24)}
  }
  c.globalAlpha=1;c.imageSmoothingEnabled=sm;isoBack(c);
}

/* ---------- ゆめがかなった（juiceDream）：頭の上で、ゆめのふきだし（その家具の絵）がふくらんで、星のつぶになってはじける ---------- */
const J3D=[],J3DSW=700,J3DPOP=700;
function juiceDream(r,id){if(!j3OK()||!r||r.hidden||J3D.length>2)return;const im=new Image();try{im.src=iconURL(id)}catch(e){}J3D.push({r,im,t0:performance.now(),s:0})}
function juiceDreamDraw(now){if(!J3D.length)return;const c=ctx,sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
  for(let i=J3D.length-1;i>=0;i--){const d=J3D[i],e=now-d.t0;if(e>J3DSW+J3DPOP||d.r.hidden){J3D.splice(i,1);continue}
    const j=(d.r.y|0)*W+(d.r.x|0),lift=typeof hiAt==='function'?liftOf(j):0,cx=Math.round(d.r.x*TS),cy=Math.round((d.r.y-2.1)*TS-lift);isoAt(c,d.r.x*TS,d.r.y*TS);
    if(e<J3DSW){const q=Math.floor(e/J3DSW*3);if(d.s<=q&&q<3){d.s=q+1;j3Ding([0,4,7][q],0,.18)}/* チン・チン・チン（だんだん高く） */
      const R=[8,11,14][Math.min(2,q)],wob=Math.floor(e/80)%2;c.fillStyle='#ffffff';for(let y=-R;y<=R;y+=2)for(let x=-R-3;x<=R+3;x+=2){if((x*x)/((R+3)*(R+3))+(y*y)/(R*R)<=1)c.fillRect(cx+x,cy+y-wob,2,2)}
      c.fillRect(cx-R+2,cy+R-wob,3,3);c.fillRect(cx-R-1,cy+R+4-wob,2,2);/* ゆめのふきだし（ドットの雲と、しっぽの丸） */
      if(d.im.complete&&d.im.naturalWidth){const s=Math.round(R*1.4);c.drawImage(d.im,cx-s/2,cy-s/2-wob,s,s)}}
    else{const u=(e-J3DSW)/J3DPOP;if(d.s<9){d.s=9;j3Ding(12);j3Ding(16,.04);j3Ding(19,.08)}const r=(6+u*30)|0,C=['#ffe58a','#fff6d8','#f3aec5'];
      for(let k=0;k<12;k++){const an=k/12*6.283+.2,x=Math.round(cx+Math.cos(an)*r),y=Math.round(cy+Math.sin(an)*r*.8+u*u*12);c.globalAlpha=1-u;c.fillStyle=C[k%3];c.fillRect(x-1,y,3,1);c.fillRect(x,y-1,1,3)}c.globalAlpha=1}}/* 星のつぶ（十字のドット） */
  c.imageSmoothingEnabled=sm;isoBack(c)}

/* ---------- 雪だるまができた（juiceSnowman）：ぽんとはねて、雪のつぶ。作った子はばんざい ---------- */
const J3S=new Map(),J3SMS=700;
function juiceSnowman(j,r){if(!j3OK())return;J3S.set(j,performance.now());j3U('fsnow',.4,3);j3U('fsnow',.3,0,.09);j3Ding(12,.12);/* 雪をふむ音（録音）でぽん */if(r&&!r.hidden)JOYU.set(r,performance.now()+1600)}
function snowHop(j){const t=J3S.get(j);if(t==null)return 0;const e=performance.now()-t;if(e>J3SMS){J3S.delete(j);return 0}return [0,6,10,12,10,6,0,3,4,3,0,0][Math.min(11,Math.floor(e/60))]||0}
function juiceSnowDraw(now){if(!J3S.size)return;const c=ctx;c.fillStyle='#ffffff';for(const[j,t]of J3S){const e=now-t;if(e<0||e>J3SMS)continue;const u=e/J3SMS,lift=typeof hiAt==='function'?liftOf(j):0,cx=(j%W+.5)*TS,cy=((j/W)|0)*TS+20-lift;isoAtA(c,isoOn()?cellFoot(j):null);
    c.globalAlpha=1-u;for(let k=0;k<10;k++){const an=-Math.PI*(k+.5)/10,r=8+u*22;c.fillRect(Math.round(cx+Math.cos(an)*r),Math.round(cy+Math.sin(an)*r*.7+u*u*16),2,2)}c.globalAlpha=1}isoBack(c)}

/* ---------- 図鑑のバー（juiceZkBar）：つぎの節目までのわりあい。前にひらいたときの数から、いまの数へ、とろっとのびる ---------- */
function juiceZkBar(body,t){if(!S)return;const q=zkNext(t),n=zkCount(t),v=q?q.v:Math.max(1,n),V=S.flags.zkBar||(S.flags.zkBar={}),p0=Math.min(n,V[t]==null?n:V[t]);V[t]=n;
  const b=el('<div class="bar zkbar"><i></i></div>'),i=b.querySelector('i');body.appendChild(b);const to=Math.min(1,n/v),fr=Math.min(1,p0/v);
  if(uiReduced()||to<=fr){i.style.width=(to*100)+'%';return}i.style.width=(fr*100)+'%';const st=S;
  for(let k=1;k<=10;k++)setTimeout(()=>{if(!i.isConnected||S!==st)return;i.style.width=((fr+(to-fr)*k/10)*100)+'%';if(k%3===0)j3U('notch',.22,k);if(k===10){i.classList.add('uglow');j3Ding(12);setTimeout(()=>i.classList.remove('uglow'),400)}},300+k*70)}
