/* 霧の古い宝箱の謎解き（fogpuzzle.js）。
   宝箱を「しらべる」でタップすると、その宝箱の謎（見つけたときに4しゅるいから1つ：f.pz）が出る。とけたら（f.unl）、せいれいがあけにいく。
   1. 絵あわせの錠（dial）：4つのダイヤル。1つまわすと、となりの右のダイヤルもいっしょにまわる。ふたの上の印と同じならびにする
   2. すべる石（slide）：3×3に8まいの石。空いた所へすべらせて、ヌシ様の葉のもようをそろえる
   3. 箱入り娘（kh・kh2）：4×5の箱の中の木の駒をすべらせて、大きな駒を下の口から出す。kh はやさしい形、kh2 はむずかしい形
   中身（fogChestItem）：宝箱だけの家具（CHESTF）か、草原の特別なそうび（まだない物から）。
   音は、もらった録音（playU）：ダイヤル notch・石 tstone・木の駒 twood・うごかない knockw・とけた tink・ふたが開く creak */
const PZKINDS=['dial','slide','kh','kh2'],CHESTF=['orgel','telescope','hdokei','mizubachi'],CHESTG=['gg09','gg10'];
const KHLAY={/* 箱入り娘の形（[x,y,よこ,たて]、0番が大きな駒）。手数は、1マスうごかすのを1手（tools/tests/fogpuzzle.cjs でたしかめる） */
  kh:[[0,0,2,2],[2,0,1,2],[3,0,1,1],[3,1,1,1],[0,2,2,1],[2,2,1,1],[0,3,1,1],[3,3,1,2]],
  kh2:[[1,0,2,2],[0,3,1,2],[3,1,1,2],[0,1,1,2],[3,3,1,2],[1,3,2,1],[1,2,1,1],[2,2,1,1],[3,0,1,1],[0,0,1,1]]};/* kh：14手・kh2：45手 */
const PZNAME={dial:'絵あわせの錠',slide:'すべる石',kh:'箱入り娘',kh2:'箱入り娘'};
function pzSnd(k,v,rt){try{if(typeof playU==='function')playU(k,v==null?.5:v,rt)}catch(e){}}
function fogPzKind(f){/* 見つけた宝箱の謎をきめる（同じ謎がつづかないように） */if(f.pz)return f.pz;const last=S.flags.pzLast;let L=PZKINDS.filter(k=>k!==last&&!(S.fogF||[]).some(q=>q!==f&&q.pz===k));if(!L.length)L=PZKINDS.filter(k=>k!==last);f.pz=pick(L);S.flags.pzLast=f.pz;return f.pz}
function fogChestItem(){/* 中身：まだない、宝箱だけの家具か、特別なそうび */const has=id=>BL[id].kind==='gear'?gearCount(id)>0:((S.inv[id]||0)>0||S.obj.includes(id)||S.res.some(r=>r.citem&&r.citem[id]));
  const L=CHESTF.filter(id=>!has(id)&&!(S.flags.chestGot||{})[id]).concat(CHESTG.filter(id=>!has(id)&&!(S.flags.chestGot||{})[id]));return L.length?pick(L):pick(CHESTF)}
function fogBoxTap(j,f){/* 宝箱をタップ：とけていなければ謎、とけていれば、せいれいがあけにいく */if(f.unl){if(!S.fogReq.includes(j))S.fogReq.push(j);sfx('twood');toast('古い宝箱：せいれいがあけにいく');return}
  const k=fogPzKind(f);pzSnd('twood',.4);pzOpen(k,()=>{f.unl=1;if(!S.fogReq.includes(j))S.fogReq.push(j);logEv('古い宝箱の'+PZNAME[k]+'をといた');dirty=true})}
/* ---------- 画面（わくのポップアップ）。絵は小さなキャンバスに整数の四角でかき、整数倍でのばす ---------- */
function pzShell(title,hint){const o=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:16px"><div class="pxcard" style="background:var(--panel);padding:14px 14px 12px;max-width:330px;width:100%;color:var(--ink);text-align:center"><b class="t" style="display:block;font-size:15px;margin:0 0 4px"></b><p class="note h" style="margin:0 0 8px"></p><div class="bd" style="display:flex;justify-content:center;touch-action:none"></div><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button class="btn rs">はじめから</button><button class="btn x">とじる</button></div></div></div>');
  o.querySelector('.t').textContent=title;o.querySelector('.h').textContent=hint;o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};document.body.appendChild(o);return o}
function pzCanvas(o,w,h,K){const c=document.createElement('canvas');c.width=w;c.height=h;c.style.cssText='width:'+w*K+'px;height:'+h*K+'px;image-rendering:pixelated;display:block';o.querySelector('.bd').appendChild(c);return c}
function pzK(w){return Math.max(2,Math.floor(Math.min(280,innerWidth-80)/w))}
function pzBevel(g,x,y,w,h,c,hi,sh){g.fillStyle=c;g.fillRect(x,y,w,h);g.fillStyle=hi;g.fillRect(x,y,w,1);g.fillRect(x,y,1,h);g.fillStyle=sh;g.fillRect(x,y+h-1,w,1);g.fillRect(x+w-1,y,1,h)}
function pzSolved(o,done){/* とけた：チン → ふたが開く音 → 光 → とじる */const c=o.querySelector('canvas');pzSnd('tink',.7);setTimeout(()=>pzSnd('creak',.6),320);setTimeout(()=>pzSnd('tink',.5,1.5),520);o.querySelector('.h').textContent='カチッ……ひらいた！';o.querySelector('.rs').style.display='none';
  if(c&&c.animate&&!(typeof uiReduced==='function'&&uiReduced()))c.animate([{filter:'brightness(1)'},{filter:'brightness(1.6)'},{filter:'brightness(1)'}],{duration:600,easing:'steps(6)'});
  if(typeof rvBurst==='function')rvBurst(o.querySelector('.bd'),2);setTimeout(()=>{o.remove();done();toast('古い宝箱：せいれいがあけにいく','good')},1300)}
function pzOpen(k,done){if(k==='dial')return pzDial(done);if(k==='slide')return pzSlide(done);return pzKlotski(k,done)}
/* ---------- 1. 絵あわせの錠 ---------- */
const DIALS=[/* 4つの印（9×9ドット）：葉・花・星・月 */
  ['....g....','...ggg...','..gGggg..','.gGgggg..','.gGggggg.','..ggggg..','...ggg...','....b....','....b....'],
  ['...ppp...','..pPPPp..','.ppPYPpp.','.pPYYYPp.','.ppPYPpp.','..pPPPp..','...ppp...','....g....','...gg....'],
  ['....y....','....y....','...yYy...','yyyYYYyyy','.yYYYYYy.','..yYYYy..','..yy.yy..','.yy...yy.','.y.....y.'],
  ['...bbbb..','..bBBb...','.bBBb....','.bBb.....','.bBb.....','.bBBb....','..bBBb...','...bbbb..','.........']];
const DIALC={g:'#6fae52',G:'#a6dd7c',b:'#7aa0d8',B:'#c4dcf6',p:'#e98fae',P:'#f6c4d4',Y:'#ffe58a',y:'#f0c04a'};
function pzIcon(g,i,x,y){const R=DIALS[i];for(let yy=0;yy<9;yy++)for(let xx=0;xx<9;xx++){const ch=R[yy][xx];if(ch==='.')continue;g.fillStyle=DIALC[ch]||'#888';g.fillRect(x+xx,y+yy,1,1)}}
function pzDial(done){const o=pzShell(PZNAME.dial,'ダイヤルをタップしてまわす。ふたの印と同じならびにしよう');let goal,v,ok=false;
  const reset=()=>{goal=[0,1,2,3].map(()=>Math.floor(Math.random()*4));v=goal.slice();for(let n=0;n<7+Math.floor(Math.random()*5);n++){const i=Math.floor(Math.random()*4);v[i]=(v[i]+3)%4;if(i<3)v[i+1]=(v[i+1]+3)%4}if(v.join()===goal.join())v[0]=(v[0]+1)%4};
  const Wd=4*16+8,Hd=48,K=pzK(Wd),c=pzCanvas(o,Wd,Hd,K),g=c.getContext('2d');
  const draw=(hl)=>{g.clearRect(0,0,Wd,Hd);pzBevel(g,0,0,Wd,Hd,'#a8743f','#c99a68','#6e4527');/* ふた */
    g.fillStyle='#8a5a33';g.fillRect(3,3,Wd-6,14);for(let i=0;i<4;i++)pzIcon(g,goal[i],6+i*16+3,6);/* ふたの上の印（お手本） */
    for(let i=0;i<4;i++){const x=6+i*16,y=22;pzBevel(g,x,y,14,20,hl===i?'#f4e9d2':'#e8d9b9','#fffbe6','#a8743f');pzIcon(g,v[i],x+2,y+5);g.fillStyle='#6e4527';g.fillRect(x+6,y+1,2,2);g.fillRect(x+6,y+17,2,2)}/* ダイヤル */};
  const tap=e=>{if(ok)return;const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/K,y=(e.clientY-b.top)/K;if(y<22)return;const i=Math.floor((x-6)/16);if(i<0||i>3)return;v[i]=(v[i]+1)%4;if(i<3)v[i+1]=(v[i+1]+1)%4;pzSnd('notch',.6,1+i*.06);draw(i);setTimeout(()=>{if(!ok)draw()},120);
    if(v.join()===goal.join()){ok=true;pzSolved(o,done)}};
  c.addEventListener('pointerdown',tap);o.querySelector('.rs').onclick=()=>{sfx('tap');reset();draw()};reset();draw()}
/* ---------- 2. すべる石（3×3） ---------- */
function pzSlideArt(){/* ヌシ様の葉のもよう（30×30 ドット）：石の板に、葉と光の輪 */const c=document.createElement('canvas');c.width=c.height=30;const g=c.getContext('2d');g.fillStyle='#c4c0b8';g.fillRect(0,0,30,30);
  for(let y=0;y<30;y++)for(let x=0;x<30;x++){const d=Math.hypot(x-14.5,y-14.5);if(d>11&&d<12.6){g.fillStyle='#f0c04a';g.fillRect(x,y,1,1)}const lx=x-15,ly=y-15,u=(lx+ly)/1.41,w=(lx-ly)/1.41;if(Math.abs(w)<(8.5-Math.abs(u))*0.55&&Math.abs(u)<8.5){g.fillStyle=Math.abs(w)<1?'#3f7a3a':w>0?'#6fae52':'#8fd06a';g.fillRect(x,y,1,1)}}return c}
function pzSlide(done){const o=pzShell(PZNAME.slide,'石をタップして、空いた所へすべらせる。もようをそろえよう');const T=10,N=3,Wd=N*T+4,K=pzK(Wd),c=pzCanvas(o,Wd,Wd,K),g=c.getContext('2d'),art=pzSlideArt();let b,ok=false;
  const reset=()=>{b=[0,1,2,3,4,5,6,7,8];let e=8,prev=-1;for(let n=0;n<60;n++){const ex=e%N,ey=(e/N)|0,L=[];if(ex>0)L.push(e-1);if(ex<N-1)L.push(e+1);if(ey>0)L.push(e-N);if(ey<N-1)L.push(e+N);const m=pick(L.filter(q=>q!==prev).length?L.filter(q=>q!==prev):L);b[e]=b[m];b[m]=8;prev=e;e=m}if(b.join()==='0,1,2,3,4,5,6,7,8')reset()};
  const draw=()=>{g.clearRect(0,0,Wd,Wd);pzBevel(g,0,0,Wd,Wd,'#8e929c','#b9bcc4','#6f737d');g.fillStyle='#6f737d';g.fillRect(2,2,N*T,N*T);
    for(let i=0;i<9;i++){const t=b[i];if(t===8&&!ok)continue;const x=2+(i%N)*T,y=2+((i/N)|0)*T;g.drawImage(art,(t%N)*T,((t/N)|0)*T,T,T,x,y,T,T);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x,y,T,1);g.fillRect(x,y,1,T);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x,y+T-1,T,1);g.fillRect(x+T-1,y,1,T)}};
  c.addEventListener('pointerdown',e=>{if(ok)return;const r=c.getBoundingClientRect(),x=Math.floor(((e.clientX-r.left)/K-2)/T),y=Math.floor(((e.clientY-r.top)/K-2)/T);if(x<0||y<0||x>=N||y>=N)return;const i=y*N+x,e0=b.indexOf(8);
    if(Math.abs((e0%N)-x)+Math.abs(((e0/N)|0)-y)!==1){pzSnd('knockw',.3);return}b[e0]=b[i];b[i]=8;pzSnd('tstone',.55);draw();if(b.join()==='0,1,2,3,4,5,6,7,8'){ok=true;draw();pzSolved(o,done)}});
  o.querySelector('.rs').onclick=()=>{sfx('tap');reset();draw()};reset();draw()}
/* ---------- 3. 箱入り娘（4×5） ---------- */
function pzKlotski(k,done){const o=pzShell(PZNAME[k],'木の駒をゆびですべらせて、大きな駒を下の口から出そう');const T=12,Wd=4*T+6,Hd=5*T+8,K=pzK(Wd)>5?5:pzK(Wd),c=pzCanvas(o,Wd,Hd,K),g=c.getContext('2d');let P,ok=false,drag=null,moves=0;
  const reset=()=>{P=KHLAY[k].map(p=>p.slice());moves=0};
  const occ=(skip)=>{const a=Array(20).fill(-1);P.forEach((p,i)=>{if(i===skip)return;for(let y=0;y<p[3];y++)for(let x=0;x<p[2];x++)a[(p[1]+y)*4+p[0]+x]=i});return a};
  const draw=()=>{g.clearRect(0,0,Wd,Hd);pzBevel(g,0,0,Wd,Hd,'#a8743f','#c99a68','#6e4527');g.fillStyle='#5c3a22';g.fillRect(3,3,4*T,5*T);g.fillStyle='#f4e9d2';g.fillRect(3+T,3+5*T,2*T,Hd-3-5*T);/* 下の口 */
    P.forEach((p,i)=>{const x=3+p[0]*T,y=3+p[1]*T,w=p[2]*T,h=p[3]*T;if(i===0){pzBevel(g,x+1,y+1,w-2,h-2,'#e9a65a','#ffd9a0','#a86a2c');g.fillStyle='#fff3c8';g.fillRect(x+w/2-2,y+h/2-2,4,4);g.fillStyle='#f6b84a';g.fillRect(x+w/2-1,y+h/2-1,2,2)}/* 大きな駒：ヌシ様の光の印 */
      else{pzBevel(g,x+1,y+1,w-2,h-2,'#d9b27c','#f0cf98','#8f6238');g.fillStyle='#b98a56';g.fillRect(x+3,y+((h/2)|0),w-6,1)}})};
  c.addEventListener('pointerdown',e=>{if(ok)return;const r=c.getBoundingClientRect(),x=Math.floor(((e.clientX-r.left)/K-3)/T),y=Math.floor(((e.clientY-r.top)/K-3)/T),a=occ(-1);if(x<0||y<0||x>3||y>4)return;const i=a[y*4+x];if(i<0)return;drag={i,x0:e.clientX,y0:e.clientY};c.setPointerCapture&&c.setPointerCapture(e.pointerId)});
  c.addEventListener('pointermove',e=>{if(!drag||ok)return;const dx=e.clientX-drag.x0,dy=e.clientY-drag.y0,s=T*K*.55;let mx=0,my=0;if(Math.abs(dx)>s&&Math.abs(dx)>=Math.abs(dy))mx=Math.sign(dx);else if(Math.abs(dy)>s)my=Math.sign(dy);if(!mx&&!my)return;
    const p=P[drag.i],a=occ(drag.i),nx=p[0]+mx,ny=p[1]+my;let can=nx>=0&&ny>=0&&nx+p[2]<=4&&ny+p[3]<=5;for(let yy=0;yy<p[3]&&can;yy++)for(let xx=0;xx<p[2];xx++)if(a[(ny+yy)*4+nx+xx]>=0){can=false;break}
    drag.x0=e.clientX;drag.y0=e.clientY;if(!can){if(!drag.bump){pzSnd('knockw',.3);drag.bump=1}return}drag.bump=0;p[0]=nx;p[1]=ny;moves++;pzSnd('twood',.5,.95+Math.random()*.1);draw();
    if(P[0][0]===1&&P[0][1]===3){ok=true;drag=null;pzSolved(o,done)}});
  const up=()=>{drag=null};c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
  o.querySelector('.rs').onclick=()=>{sfx('tap');reset();draw()};reset();draw()}
