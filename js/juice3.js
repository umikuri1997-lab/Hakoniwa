/* 数がたまって、はじける演出（juice3.js）。見た目と音だけ（数字はかえない・セーブしない）。
   ・朝の日記の数え上げ（juiceDiaryCount）：朝に出た紙だけ、「きのうのしごと」「ゆうべの守り」の数を0から順に数え上げ、
     1つふえるごとに木の「カチッ」（notch の録音。だんだん高く）。さいごに「きのうのしごと」へ大きなハンコ「よくできました」。タップでとばす。
   ・なかよしのハート（juiceBondHeart）：なかよしが30・60・100にとどいたとき、2人のあいだにドットのハートがふくらんで、ぽんとはじける（マップの上）。
   ・守りつづけた夜のめくり（juiceStreakTick）：日の欄の、たてのアイコンの晩の数が、めくり数字で+1。節目（5の倍数）は光る。
     画面・会話・村レベルのカードが出ているあいだは、とじてから（そのあいだは前の数を出す streakShown）。
   ・はじめての料理の名前めくり（juiceNameFlip）：「？？？」が1字ずつ、くるっとめくれて名前になる。
   ・地図の切れはしがくっつく（juiceMapJoin）：3まいがまわりからよってきて、パチッと合わさり、宝の地図になって×が光る。
   ・つくった数のふきだしカウント（juiceMadeCount）：依頼ボードでまとめてできた物をしまうとき、せいれいの上で 1・2・3… とふえて、さいごの数ではねる。
   ・村レベルのバーがあふれる（juiceLvUp）：村レベルが上がったら、カードをとじたあとで、上の欄のバーがいっぱいまで満ちて光り、
     光のつぶがこぼれてから、新しい数に焼き印（lvBrand）。
   うごきをへらす設定（uiReduced）では、動かさずに、さいごの形をすぐ出す。 */
const J3COUNTMS=80,J3COUNTMAX=12,J3HEARTMS=900,J3POPMS=650,J3MAPMS=1500,J3MADEMS=70,J3LVFILL=600,J3LVGLOW=350,J3LVDROP=400;
const J3HEARTC={30:['#e86a8a','#ffb3c6'],60:['#d84a7a','#ff8fb0'],100:['#d9a230','#ffe58a']};/* ふち・中の色 */
const J3H=[],J3M=[];let J3ST=null,J3LV=null;
function j3OK(){return typeof juiceOK==='function'&&juiceOK()}
function j3U(k,v,st,dl){/* 本物の録音（playU）を、st 半音だけ高く・dl 秒あとに */if(typeof AC==='undefined'||!AC||!SND.sfx||AC.state!=='running'||typeof playU!=='function')return;try{playU(k,v,Math.pow(2,(st||0)/12),dl||0)}catch(e){}}
function j3Ding(st,dt,v){j3U('tink',v?v*.6:.18,st,dt)}/* 小さな鈴の「チン」（オルゴールの録音） */

/* ---------- 朝の日記の数え上げ ---------- */
const J3WORK=[['harvest','しゅうかく'],['plant','植えた'],['craft','作った'],['build','建てた'],['fish','つり']];
function dyWorkSum(e){/* きのうのしごと：種類ごとの回数（みんなのしたこと と同じ記録。料理も「作った」） */const T={};for(const x of e.w||[]){const t=x[3]==='cook'?'craft':x[3];T[t]=(T[t]||0)+x[5]}return J3WORK.filter(k=>T[k[0]]>0).map(k=>[k[1],T[k[0]]+'回'])}
function juiceDiaryCount(body,secW){/* diaryBody から（朝に出した紙だけ）。secW：きのうのしごと の欄（なければ null） */
  const L=[...body.querySelectorAll('.stat b')].filter(b=>/^\d+/.test(b.textContent));if(!L.length&&!secW)return;
  const st=S,items=L.map(b=>{const m=b.textContent.match(/^(\d+)(.*)$/);return{b,n:+m[1],sf:m[2]}});
  let done=false;const stamp=()=>{if(secW&&secW.isConnected)uiStamp(secW,false,'よくできました',true)};
  const finish=()=>{if(done)return;done=true;for(const it of items)it.b.textContent=it.n+it.sf;body.removeEventListener('pointerdown',finish,true);setTimeout(stamp,250)};
  if(uiReduced()||!items.length){finish();return}
  for(const it of items)it.b.textContent='0'+it.sf;
  body.addEventListener('pointerdown',finish,true);/* タップで、すぐにさいごの数 */
  let i=0,k=0,tick=0;const step=()=>{if(done)return;if(!body.isConnected||S!==st){done=true;return}
    const it=items[i];if(!it){finish();return}const inc=Math.max(1,Math.ceil(it.n/J3COUNTMAX));k=Math.min(it.n,k+inc);it.b.textContent=k+it.sf;
    if(it.n>0){j3U('notch',.32,JUICE_SCALE[Math.min(tick,JUICE_SCALE.length-1)]);tick++}
    if(k>=it.n){i++;k=0;setTimeout(step,J3COUNTMS*3)}else setTimeout(step,J3COUNTMS)};
  setTimeout(step,450)}

/* ---------- なかよしのハート ---------- */
function juiceBondHeart(a,b,lv){if(!j3OK()||!a||!b||a.hidden||b.hidden||J3H.length>3)return;J3H.push({a,b,lv,t0:performance.now(),s:0});}
function j3Mid(h){const x=(h.a.x+h.b.x)/2,y=Math.min(h.a.y,h.b.y),j=(y|0)*W+(x|0),lift=typeof hiAt==='function'?hiAt(j)*LIFT:0;return[x*TS,(y-1.7)*TS-lift]}
function j3Heart(c,cx,cy,P,C,a){const R=BONDHEART,w=R[0].length,h=R.length,x0=Math.round(cx-w*P/2),y0=Math.round(cy-h*P/2);c.globalAlpha=a;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=R[y][x];if(ch==='.')continue;c.fillStyle=ch==='o'?C[0]:C[1];c.fillRect(x0+x*P,y0+y*P,P,P)}c.globalAlpha=1}
function juiceBondDraw(now){const c=ctx;for(let i=J3H.length-1;i>=0;i--){const h=J3H[i],e=now-h.t0;if(e>J3HEARTMS+J3POPMS||h.a.hidden||h.b.hidden){J3H.splice(i,1);continue}
    const C=J3HEARTC[h.lv]||J3HEARTC[30],[cx,cy]=j3Mid(h);
    if(e<J3HEARTMS){const u=e/J3HEARTMS,P=2+Math.floor(u*4)*(h.lv>=100?1.5:1),wob=Math.floor(e/90)%2?2:0;/* 2・3・4・5ドットと、だんだんふくらむ。ふくらむたびに、ぷるっと */
      if(h.s<Math.floor(u*4)){h.s++;j3Ding(JUICE_SCALE[h.s*2],0,.25)}j3Heart(c,cx,cy-wob,Math.round(P),C,Math.min(1,u*4))}
    else{const u=(e-J3HEARTMS)/J3POPMS;if(h.s<9){h.s=9;j3Ding(12,0,.35);j3Ding(16,.03,.3);j3Ding(19,.06,.3);if(typeof buzz==='function')buzz(15)}/* ぽんっ：和音 */
      const n=h.lv>=100?14:10,r=(8+u*34)|0;for(let k=0;k<n;k++){const an=k/n*6.283+.3,x=cx+Math.cos(an)*r,y=cy+Math.sin(an)*r*.8+u*u*10;j3Heart(c,x,y,1,C,1-u)}
      if(u<.35){c.fillStyle='#fffbe8';c.globalAlpha=1-u/.35;const s=((6+u*30)|0)*2;for(let k=0;k<16;k++){const an=k/16*6.283;c.fillRect(Math.round(cx+Math.cos(an)*s/2)-1,Math.round(cy+Math.sin(an)*s/2)-1,2,2)}c.globalAlpha=1}}}}

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
function juiceMadeCount(r,k){if(!j3OK()||!r||k<2||J3M.length>3)return;J3M.push({r,k,t0:performance.now(),n:0})}
function juiceMadeDraw(now){if(!J3M.length)return;const c=ctx,A=typeof dgAtlas==='function'?dgAtlas():null;if(!A)return;const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
  for(let i=J3M.length-1;i>=0;i--){const m=J3M[i],e=now-m.t0,steps=Math.min(m.k,J3COUNTMAX),inc=Math.ceil(m.k/steps),last=Math.ceil(m.k/inc)*J3MADEMS;
    if(e>last+900||m.r.hidden){J3M.splice(i,1);continue}
    const n=Math.min(m.k,(Math.floor(e/J3MADEMS)+1)*inc);if(n>m.n){m.n=n;j3U('twood',.36,JUICE_SCALE[Math.min(Math.round(n/inc)-1,JUICE_SCALE.length-1)])}/* 木をたたく音（録音） */
    const fin=e>=last,ue=fin?(e-last)/900:0,bump=fin&&ue<.25?-4:fin&&ue<.4?1:0,P=fin&&ue<.25?3:2;/* さいごの数で、ぴょんとはねて大きくなる */
    const s=String(n),j=(m.r.y|0)*W+(m.r.x|0),lift=typeof hiAt==='function'?hiAt(j)*LIFT:0,cx=m.r.x*TS,cy=(m.r.y-1.9)*TS-lift+bump-Math.round(Math.min(e,300)/300*6);
    c.globalAlpha=fin&&ue>.7?(1-ue)/.3:1;const w=s.length*6*P,x0=Math.round(cx-w/2);
    for(let d=0;d<s.length;d++)c.drawImage(A,(+s[d])*7,9,7,9,x0+d*6*P-P,Math.round(cy)-P,7*P,9*P);c.globalAlpha=1}
  c.imageSmoothingEnabled=sm}

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
function juice3Frame(now){juiceStreakTick();juiceLvTick(now);if(typeof juice4Frame==='function')juice4Frame(now)}
function juice3Draw(now){if(typeof juice4Draw==='function')juice4Draw(now);if(J3H.length)juiceBondDraw(now);juiceMadeDraw(now)}
function juice3Reset(){if(typeof juice4Reset==='function')juice4Reset();J3H.length=0;J3M.length=0;J3ST=null;if(J3LV){J3LV.e.style.visibility='';const x=document.getElementById('xpBar');if(x)x.classList.remove('ufx','uglow');J3LV=null}JLVW=null;JLVL=null;JLVP=null}
