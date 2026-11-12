'use strict';
/* 御神木のまわりの見せ場：光・輪・葉・花・ひづめの足あと・ヌシ様の光のりんかくの絵と、かけらをささげる場面・木が育つ場面・なかよしの想いのあかり。
   絵は、どれもドット（2点の四角）で描く。実時間でうごき、保存しない。村を切りかえたら消える。 */
const SCN=[];/* いま出ている絵：{k,at,ms,...}。at は、はじまる時刻（先の時刻なら、それまで待つ） */
function scnAdd(k,ms,o,delay){const e=Object.assign({k,at:performance.now()+(delay||0),ms,state:S,session:VILLAGE_SESSION},o);SCN.push(e);return e}
const q2=v=>Math.round(v/2)*2;
function scnDot(x,y,col,s){ctx.fillStyle=col;ctx.fillRect(q2(x),q2(y),s||2,s||2)}
function scnStar(cx,cy,a,n,col){/* ドットの星：まん中は白、うでは色つき */
  if(a<=.02)return;ctx.globalAlpha=a;scnDot(cx,cy,'#ffffff');for(let k=1;k<=n;k++){ctx.globalAlpha=a*(1-(k-1)*.28);for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]])scnDot(cx+dx*k*2,cy+dy*k*2,col)}
  if(n>=3){ctx.globalAlpha=a*.6;for(const[dx,dy]of[[-2,-2],[2,-2],[-2,2],[2,2]])scnDot(cx+dx,cy+dy,col)}}
function scnDisc(cx,cy,rx,ry,col){ctx.fillStyle=col;for(let y=q2(cy-ry);y<cy+ry;y+=2){const d=(y+1-cy)/ry,hw=rx*Math.sqrt(Math.max(0,1-d*d));if(hw<1)continue;ctx.fillRect(q2(cx-hw),y,Math.max(2,q2(hw*2)),2)}}/* 段々の円（2点の行を、すきまなく） */
const scnEnv=(t,a,b)=>Math.max(0,Math.min(1,t/a,(1-t)/b));/* はじめ a でうかび、さいご b で消える */
const SCN_HOOF=[[-2,0],[-3,1],[-2,1],[-3,2],[-2,2],[-3,3],[-2,3],[1,0],[1,1],[2,1],[1,2],[2,2],[1,3],[2,3]];/* [よこ,たて]（ドット）。左右2つのつめ */
const SCN_GEM=[];for(const[dy,hw]of[[-6,0],[-4,1],[-2,2],[0,2],[2,1],[4,0]])for(let k=-hw;k<=hw;k++)SCN_GEM.push([k*2,dy,hw]);/* ひし形（よこ5ドット・たて6ドット） */
const SCN_DRAW={
  orb(e,t){/* 光の玉が、弧をえがいてとぶ（しっぽつき） */
    for(let i=5;i>=0;i--){const p=sacredEase(Math.max(0,t-i*.045)),x=e.x0+(e.x1-e.x0)*p,y=e.y0+(e.y1-e.y0)*p-Math.sin(Math.PI*p)*(e.arc||0),a=scnEnv(t,.1,.12);
      if(i){ctx.globalAlpha=a*(.6-i*.09);scnDot(x-1,y-1,e.col,4)}else{ctx.globalAlpha=a*.22;scnDisc(x+1,y+1,10,8,e.col);scnStar(x,y,a,e.n||2,e.col)}}},
  twin(e,t,now){/* 2つの光が、まわりながら、ひとつになる */
    const r=14*(1-sacredEase(t)),an=now/140;ctx.globalAlpha=.2;scnDisc(e.x,e.y,16,12,'#fff8c8');scnStar(e.x+Math.cos(an)*r,e.y+Math.sin(an)*r*.6,1,3,e.col);scnStar(e.x-Math.cos(an)*r,e.y-Math.sin(an)*r*.6,1,3,e.col2)},
  gem(e,t,now){/* ヌシのかけら：光るひし形。手の上（actor）か、きまった所（x,y）で、ゆっくりうかぶ */
    const a=scnEnv(t,.15,.08),up=sacredEase(Math.min(1,t/.5))*(e.rise||0),bx=e.actor?e.actor.x*TS+(e.dx||0):e.x,by=(e.actor?e.actor.y*TS+(e.dy||0)-uLift(e.actor):e.y)-up+Math.sin(now/260)*1.5;
    ctx.globalAlpha=a*.16;scnDisc(bx+1,by,18,14,'#fff8c8');ctx.globalAlpha=a*.2;scnDisc(bx+1,by,12,9,'#fff8c8');ctx.globalAlpha=a;
    for(const[dx,dy,hw]of SCN_GEM)scnDot(bx+dx,by+dy,Math.abs(dx)===hw*2&&hw?(dy>0?'#e3bf6a':'#f3d98a'):dx<0&&dy<2?'#fffbe6':dy>=2?'#f6dd90':'#fff0a8');scnDot(bx-2,by-2,'#ffffff');scnDot(bx,by,'#bfe8ff');
    for(let i=0;i<3;i++){const q=(now/900+i/3)%1;scnStar(bx+Math.cos(i*2.1+1)*12,by+Math.sin(i*2.1+1)*9-q*6,a*Math.sin(Math.PI*q),1,'#fff6c8')}},
  ring(e,t){/* ひろがる光の輪 */
    const r=e.r0+(e.r1-e.r0)*sacredEase(t),n=Math.max(14,Math.round(r*.7));ctx.globalAlpha=(1-t)*(e.a||.9);
    const sz=r>22?4:2;for(let i=0;i<n;i++){const an=i/n*Math.PI*2;scnDot(e.x+Math.cos(an)*r-sz/2+1,e.y+Math.sin(an)*r*.5-sz/2+1,i%2?e.col:'#ffffff',sz)}},
  vein(e,t){/* 幹をのぼる光のすじ */
    const env=scnEnv(t,.15,.25);for(let i=0;i<5;i++){const q=(t*1.7+i*.21)%1,ox=(i-2)*(e.w||4);for(let k=0;k<5;k++){const y=e.y-e.h*Math.max(0,q-k*.035);ctx.globalAlpha=env*(1-k*.2);scnDot(e.x+ox+Math.round(Math.sin(y/9+i))*2,y,k?(e.col||'#fff6c8'):'#ffffff')}}},
  glow(e,t,now){/* やわらかい光のたまり（段々の円） */
    const env=scnEnv(t,.3,.3)*(.85+.15*Math.sin(now/200));for(const[k,a]of[[1,.1],[.7,.14],[.42,.2]]){ctx.globalAlpha=a*env;scnDisc(e.x,e.y,e.r*k,e.r*k*.62,e.col||'#fff8c8')}},
  leaf(e,t){/* ひらひらおちる葉 */
    const te=t*e.ms/1000,x=e.x+Math.sin(te*2.2+e.ph)*e.sway+(e.drift||0)*te,y=e.y+e.vy*te;ctx.globalAlpha=Math.min(1,(1-t)/.3);ctx.fillStyle=e.col;
    if(Math.floor(te*4+e.ph)%2)ctx.fillRect(q2(x),q2(y),4,2);else ctx.fillRect(q2(x),q2(y),2,4)},
  bloom(e,t){/* 光の花：芽 → つぼみ → ひらく → うすれる */
    const a=Math.min(1,(1-t)/.25);ctx.globalAlpha=a;const x=e.x,y=e.y;
    if(t<.1){scnDot(x,y,'#9ecf75');return}scnDot(x,y,'#7fb85a');scnDot(x,y-2,'#9ecf75');
    if(t<.2){scnDot(x,y-4,e.col);return}const o=t<.3?6:4,cy=y-8;for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]])scnDot(x-1+dx*o,cy-1+dy*o,e.col,4);scnDot(x-1,cy-1,'#fff0a8',4);
    if(t<.45)scnStar(x,cy,(.45-t)/.25,2,'#fffbe6')},
  hoof(e,t){/* 光るひづめのあと：2つにわかれた、先のとがった形（v：たて向き） */
    const a=scnEnv(t,.1,.4);ctx.globalAlpha=a*.16;scnDisc(e.x,e.y,14,9,'#fff8c8');ctx.globalAlpha=a;
    for(const[u,w]of SCN_HOOF){const col='#fffbe6';if(e.v)scnDot(e.x+u*2,e.y+w*2-4,col);else scnDot(e.x+w*2-4,e.y+u*2,col)}},
  lord(e,t,now){/* ヌシ様の光のりんかく：うっすらあらわれて、消える */
    const cv=lordSil();if(!cv)return;const a=scnEnv(t,.28,.3)*e.str*(.86+.14*Math.sin(now/170)),bob=Math.round(Math.sin(now/600));
    ctx.save();ctx.globalAlpha=a;ctx.translate(Math.round(e.x),Math.round(e.y+bob));if(e.face>0)ctx.scale(-1,1);ctx.drawImage(cv,-Math.round(cv.width/2),-cv.height);ctx.restore();
    for(let i=0;i<6;i++){const q=(now/1700+i/6)%1;scnStar(e.x+Math.cos(i*1.9)*44,e.y-20-q*110-(i%3)*8,a*Math.sin(Math.PI*q),1,i%2?'#eaffd8':'#fff6c8')}}
};
let LORDCV=null;
function lordSil(){/* ヌシ様（横向き）の絵から、光のりんかくの絵を1回だけ作る：ふちは明るく、中はうすく */
  if(LORDCV||!NSHEET.ok)return LORDCV;const[sx,sy,w,h]=NSHEET.f[2],W2=w+2,H2=h+2,cv=document.createElement('canvas');cv.width=W2;cv.height=H2;const c=cv.getContext('2d');c.drawImage(NSHEET.img,sx,sy,w,h,1,1,w,h);
  let d;try{d=c.getImageData(0,0,W2,H2)}catch(err){return null}const a=d.data,op=new Uint8Array(W2*H2),e1=new Uint8Array(W2*H2);
  for(let i=0;i<W2*H2;i++)op[i]=a[i*4+3]>60?1:0;
  const nb=(i,M)=>{const x=i%W2,y=(i/W2)|0;return x<1||y<1||x>=W2-1||y>=H2-1||!M[i-1]||!M[i+1]||!M[i-W2]||!M[i+W2]};
  for(let i=0;i<W2*H2;i++)if(op[i]&&nb(i,op))e1[i]=1;
  for(let i=0;i<W2*H2;i++){const p=i*4;if(!op[i]){a[p+3]=0;continue}const lum=(a[p]+a[p+1]+a[p+2])/3,x=i%W2,near=!e1[i]&&(e1[i-1]||e1[i+1]||(x>0&&e1[i-W2])||e1[i+W2]);
    if(e1[i]){a[p]=255;a[p+1]=255;a[p+2]=240;a[p+3]=235}else if(near){a[p]=246;a[p+1]=255;a[p+2]=226;a[p+3]=140}else{a[p]=232;a[p+1]=250;a[p+2]=214;a[p+3]=36+Math.round(lum*.2)}}
  c.putImageData(d,0,0);LORDCV=cv;return cv}
function drawSacredScenes(now){
  drawOmoiLamps(now);if(!SCN.length)return;
  for(let i=SCN.length-1;i>=0;i--){const e=SCN[i];if(e.state!==S||e.session!==VILLAGE_SESSION||now>=e.at+e.ms)SCN.splice(i,1)}
  ctx.save();ctx.imageSmoothingEnabled=false;for(const e of SCN){if(now<e.at)continue;SCN_DRAW[e.k](e,Math.min(1,(now-e.at)/e.ms),now)}ctx.restore()}
/* 木の大きさ：根もと（base）・てっぺん（top）。st は育ちぐあい（なければ、いまの育ちぐあい） */
function sacredGeo(j,st){const top=sacredTopY(j,st),base=storyTreeY(j)*TS+26-hiAt(j)*LIFT;return {cx:storyTreeX(j)*TS,base,top,h:Math.max(24,base-top)}}
function sacredNearJoy(j,ms,dist){/* 木のそばのせいれいが、木のほうを向いて、はねてよろこぶ（すわっている・場面の姿勢の子はそのまま） */
  const cx=storyTreeX(j),cy=storyTreeY(j),now=performance.now();for(const r of S.res){if(r.hidden||Math.hypot(r.x-cx,r.y-cy)>(dist||9)||sacredPose(r))continue;r.face=r.x<cx?1:-1;JUMP.set(r,now);JOYU.set(r,now+ms)}}
function sacredLeafFall(g,n,spread){for(let i=0;i<n;i++)scnAdd('leaf',2200+Math.random()*900,{x:g.cx+(Math.random()-.5)*2*spread,y:g.top+6+Math.random()*g.h*.45,vy:16+Math.random()*14,sway:5+Math.random()*5,ph:Math.random()*6,drift:(Math.random()-.5)*8,col:i%3?'#9ecf75':'#c8f5a0'},i*70)}
function sacredRings(x,y,n,r1,col,gap){for(let i=0;i<n;i++)scnAdd('ring',1200,{x,y,r0:6,r1:r1*(1-i*.16),col},i*(gap||260))}
/* 木が育つとき：ためる（根もとに光がたまり、光のすじが幹をのぼる）→ のびあがる → 葉がふり、光の輪が3つひろがって、そばのせいれいがよろこぶ。
   mode 'glow' は、姿のかわらない、ひかるだけの場面（輪1つ・葉すこし） */
function sacredGrowSparks(j,ms,stage,mode){
  musicDuck(ms+800);const owner=S,session=VILLAGE_SESSION,g=sacredGeo(j,mode==='glow'?undefined:stage),glow=mode==='glow',live=()=>S===owner&&VILLAGE_SESSION===session;
  scnAdd('glow',ms*.75,{x:g.cx,y:g.base-10,r:24+stage*9});scnAdd('vein',ms*.55,{x:g.cx,y:g.base-6,h:Math.max(20,g.h*.7),w:2+stage});
  const n=8+stage*5;for(let i=0;i<n;i++)setTimeout(()=>{if(!live())return;const a=Math.random()*Math.PI*2,r=6+Math.random()*(12+stage*4);fx.push({k:'p',x:g.cx+Math.cos(a)*r,y:g.base-4,vx:Math.cos(a)*8,vy:-120-Math.random()*80,life:1.4,col:i%3?'#fff6c8':'#c8f5a0',r:2})},ms*.08+i*(ms*.45/n));
  setTimeout(()=>{if(!live())return;const R=glow?40+stage*8:36+stage*22;sacredRings(g.cx,g.base-4,glow?1:3,R,'#fff6c8');sacredLeafFall(g,glow?3+stage:6+stage*6,12+stage*12);
    if(!glow){for(let i=0;i<14+stage*5;i++){const a=Math.random()*Math.PI*2,v=30+Math.random()*60;fx.push({k:'p',x:g.cx,y:g.top+g.h*.4,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,life:1.3,col:i%2?'#c8f5a0':'#fff6c8',r:2})}sacredNearJoy(j,1800)}
    sfx('sacred')},ms*(glow?.45:.7))}
/* ---------- かけらを御神木にささげる場面 ----------
   フタバが歩みよる → 村の時間を止めて、カメラがよる → かけらが手の上にうかぶ → 幹へとんで入る → 光のすじが根から梢へ
   → 1つめ：木のまわりに光の花が咲きひろがる／2つめ：村のせいれいから光があつまる／3つめ：3つの光が幹でひとつになって、木が大きく育つ
   → 1つめ・2つめ：木のよこに、ヌシ様の光のりんかくが少しだけあらわれる → 会話 → done（ささげたことにする）。1つめ・2つめでは、木の姿はかえない */
function shardLines(n){const N=keyName('earth'),H=keyName('fire'),M=keyName('water'),K=keyName('wind');
  const L=n===1?[[POKO,'#surprise|……いま、木のよこに……！'],[POKO,'#teary|……ヌシ様の、におい。お日さまと、草のにおいだ。'],[N,'花が、いっぺんに咲いたねぇ。土の下まで、ぽかぽかしてるよぉ。'],[GOD,'#nod|うむ。「育てる力」が、木にやどったんじゃ。……ヌシは、ちゃんと、ここにおるぞい。'],[POKO,'#joy|うん。……まっててね、ヌシ様。']]
    :[[POKO,'#surprise|みんなの光が、木に……！'],[POKO,'#teary|……こっちを、見てる。ヌシ様、みんな、なかよくしてるよ。'],[H,'……いま、木のよこに、でっけえ光が立ってなかったか？'],[M,'はい。……やさしい目でした。'],[K,'#think|フッ…風が、いっしゅん、やんだね。'],[GOD,'#joy|「想う力」も、とどいたのう。ヌシの姿が、だんだん、こくなってきておる。'],[POKO,'#joy|もうすこしだよ、ヌシ様。']];
  return sacredCastLines(L)}
function sacredCastLines(L){/* いる子の行だけ。カミサマが遠くにいるときは、はじめの行だけ「聞こえるかの？」 */
  let g=0;return L.filter(l=>l[0]&&(l[0]===GOD||spkOK(l[0]))).map(l=>{if(l[0]!==GOD||g++)return l;const m=/^(#[a-z]+\|)?(.*)$/.exec(l[1]);return [GOD,(m[1]||'')+GVOICE()+m[2]]})}
function sacredOfferShard(j,done){
  if(SHARD_OFFER&&SHARD_OFFER.state===S&&SHARD_OFFER.session===VILLAGE_SESSION)return;
  if(isNight())return toast('かけらをささげるのは、朝になってから');
  const f=S.res.find(r=>r.name===POKO&&!r.hidden);if(!f)return toast('フタバがいません');
  const owner=S,session=VILLAGE_SESSION,span=sacredSpan(),by=(j/W|0)+span-1+.5,offer={state:S,session},n=Math.min(3,(S.setSh||0)+1);SHARD_OFFER=offer;
  const alive=()=>S===owner&&VILLAGE_SESSION===session&&S.res.includes(f)&&S.obj[j]==='tower';
  const finish=()=>{if(SHARD_OFFER===offer)SHARD_OFFER=null};
  let begun=false;const act=()=>{if(begun)return;begun=true;if(!alive())return finish();
    endAct(f);f.path=[];f.act={type:'idle',stage:'do',t:0,dur:999};const hold=f.act,face=f.x<storyTreeX(j)?1:-1,T=n>=3?10600:9600,g=sacredGeo(j);f.face=face;
    const at=(ms,fn)=>setTimeout(()=>{if(alive())fn()},ms),stopAll=()=>{SCENEHOLD=0;finish();if(f.act===hold)endAct(f);SACRED_POSES.delete(f)};
    SCENEHOLD=performance.now()+T+300;musicDuck(T+900);
    const lx=g.cx+face*84,ly=g.base+8,fb=[[f.x*TS-24,f.y*TS-62-uLift(f)],[f.x*TS+24,f.y*TS+10-uLift(f)]];
    const near=[[g.cx-66,g.top-4],[g.cx+66,g.base+14],...fb];storyShot(near,{limit:2.4,seconds:1.4,full:true});
    sacredScenePose(f,'storyOffer',3300,{side:true,face});/* 両手を上げて、かけらをささげる */
    const hx=()=>f.x*TS+face*5,hy=()=>f.y*TS-42-uLift(f),tx=g.cx,ty=g.base-Math.min(40,g.h*.4);
    at(500,()=>{scnAdd('gem',2000,{actor:f,dx:face*5,dy:-42,rise:8});sfx('shard')});
    at(2400,()=>{sacredScenePose(f,'storyListen',T,{side:true,face});scnAdd('orb',900,{x0:hx(),y0:hy()-8,x1:tx,y1:ty,arc:24,col:'#fff0a8',n:3})});
    at(3300,()=>{sacredRings(tx,ty+10,1,34,'#fff6c8');scnAdd('vein',2600,{x:g.cx,y:g.base-6,h:g.h*.8,w:5});scnAdd('glow',3200,{x:g.cx,y:g.base-g.h*.4,r:Math.min(70,g.h*.6)});sacredStartEffect('sway',2600);sfx('sacred');
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2;fx.push({k:'p',x:tx,y:ty,vx:Math.cos(a)*50,vy:Math.sin(a)*40-40,life:1,col:i%2?'#fff6c8':'#bfe8ff',r:2})}});
    if(n===1)at(4100,()=>{/* 育てる力：木のまわりに、光の花が、内がわから外へ咲きひろがる */const cx=storyTreeX(j),cy=storyTreeY(j),C=['#ffd1e8','#fff2f6','#fff0a8','#d8c8ff'];let k=0;
      for(let i=0;i<70&&k<30;i++){const an=Math.random()*Math.PI*2,r=1.8+Math.random()*3.6,x=cx+Math.cos(an)*r,y=cy+.6+Math.sin(an)*r*.7,q=(y|0)*W+(x|0);if(x<0||y<0||x>=W||y>=H||S.obj[q]||S.ground[q]===1||S.ground[q]===2||(S.fog&&fogAt(q)))continue;
        scnAdd('bloom',4600,{x:x*TS,y:y*TS-hiAt(q)*LIFT,col:C[k++%4]},(r-1.8)*420+Math.random()*200)}sfx('plant')});
    if(n===2)at(4100,()=>{/* 想う力：村のせいれいから、ちいさな光が木へあつまる */const L=S.res.filter(r=>!r.hidden&&r!==f).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y)).slice(0,14);
      L.forEach((r,i)=>{const col=ELEM[r.elem].body;scnAdd('orb',1300,{x0:r.x*TS,y0:r.y*TS-18-uLift(r),x1:tx,y1:ty,arc:20,col,n:2},i*150);scnAdd('ring',700,{x:tx,y:ty+6,r0:4,r1:16,col,a:.7},i*150+1300)});sfx('power')});
    if(n>=3){/* 3つめ：育てる力・想う力・守る力の3つの光が、幹でひとつになって、木が大きく育つ（このあと、ヌシ様が帰ってくる） */
      at(4100,()=>{['#c8f5a0','#ffd1e8','#fff0a8'].forEach((col,i)=>{const a=-Math.PI/2+i*Math.PI*2/3;scnAdd('glow',1500,{x:tx+Math.cos(a)*48,y:ty-10+Math.sin(a)*30,r:10,col},i*250);scnAdd('orb',1200,{x0:tx+Math.cos(a)*48,y0:ty-10+Math.sin(a)*30,x1:tx,y1:ty,arc:14,col,n:3},i*250+300);scnAdd('ring',800,{x:tx,y:ty+6,r0:4,r1:24,col,a:.8},i*250+1500)});sfx('power')});
      at(6000,()=>{const ms=4400,g4=sacredGeo(j,4);sacredStartEffect('growth',ms,{from:3,to:4});SACRED_PREVIEW.set(S,{session:VILLAGE_SESSION,stage:4,until:Infinity});SACRED_SHOWN.set(S,{session:VILLAGE_SESSION,stage:4});
        storyShot([[g4.cx-74,g4.top-8],[g4.cx+74,g4.base+16],...fb],{limit:2.2,seconds:1.8,full:true});SACRED_POSES.delete(f);sacredScenePose(f,'lookUp',ms+400,{side:true,face});sacredGrowSparks(j,ms,4);sfx('sacred')})}
    if(n<3)at(n===1?5400:5800,()=>{/* ヌシ様の光のりんかく：木のむこうがわに立って、フタバのほうを見る */scnAdd('lord',n===1?3400:3200,{x:lx,y:ly,face:-face,str:n===1?.62:.92});storyShot([...near,[lx-60,ly-150],[lx+60,ly]],{limit:2.2,seconds:1.6,full:true});/* カメラが少し引いて、すがたが入る */SACRED_POSES.delete(f);f.face=face;sacredScenePose(f,'lookUp',4000,{side:true,face});JUMP.set(f,performance.now());sfx('sacred')});
    at(T,()=>{stopAll();if(n>=3)S.treeSeen=4;/* 育った木は、そのまま（sacredStage） */sacredNearJoy(j,1600,10);const end=()=>{if(S!==owner||VILLAGE_SESSION!==session)return;if(sacredDirection())sacredEndDirection(true);done()};
      const lines=n<3?shardLines(n):[];if(lines.length)storyShot(near,{limit:2.2,seconds:.9});if(!lines.length||dialog(lines,end,null,'')===false)end()})};
  if(!sacredSceneWalk(f,(j%W)+.5,by,{adjacentSide:true},act)&&!sacredSceneWalk(f,(j%W)+span-.5,by,{adjacentSide:true},act))act();
  setTimeout(()=>{if(!begun&&S===owner&&VILLAGE_SESSION===session)act();else if(!begun)finish()},15000);/* 歩くのをじゃまされても、止まったままにしない */
}
/* ---------- なかよしの想い：2人の光が、御神木のあかりになる ---------- */
const LAMPS_TAKEN=new WeakSet();/* あかりが、かけらになった村（お礼の会話の中。保存しない） */
function omoiLampPos(j,i){const g=sacredGeo(j),k=Math.max(.5,g.h/120),ox=sacredStage()<4?16:0;/* 若い木の葉は、切り株の右よりにある */return [g.cx+ox+[-22,24,2][i%3]*k,g.top+g.h*[.4,.34,.2][i%3]]}
function omoiCols(pk){const p=pk&&bondPair(pk);return p?[ELEM[p[0].elem].body,ELEM[p[1].elem].body]:['#fff0a8','#ffd1e8']}
function omoiLampOn(){if(!S||WD!==0||S.free||typeof QUESTS==='undefined'||LAMPS_TAKEN.has(S))return false;const j=S.sacredRoot;return j!=null&&S.obj[j]==='tower'&&(QUESTS[S.quest]?.id==='omoi'||S.qStory!=null&&QUESTS[S.qStory]?.id==='omoi')}
function drawOmoiLamps(now){/* 枝にともった、想いのあかり（とどいた組の数だけ。かけらになるまで） */
  if(!omoiLampOn())return;const j=S.sacredRoot,L=(S.flags.omoiP||[]).slice(0,3).map(omoiCols),run=typeof OMOI_RUN!=='undefined'&&OMOI_RUN&&OMOI_RUN.state===S&&OMOI_RUN.session===VILLAGE_SESSION?OMOI_RUN.lamp:null;
  if(run&&L.length<3)L.push(run);if(!L.length)return;ctx.save();ctx.imageSmoothingEnabled=false;
  L.forEach((c,i)=>{const[x,y0]=omoiLampPos(j,i),y=y0+Math.round(Math.sin(now/700+i*2)),tw=.75+.25*Math.sin(now/300+i*1.7);
    ctx.globalAlpha=.2*tw;scnDisc(x+1,y+1,14,11,'#fff8c8');ctx.globalAlpha=1;for(const[dx,dy]of[[0,-4],[-4,0],[4,0],[0,4]])scnDot(x-1+dx,y-1+dy,(dx+dy<0)?c[0]:c[1],4);scnDot(x-1,y-1,'#ffffff',4);
    const q=(now/1300+i*.37)%1;scnStar(x,y,Math.sin(Math.PI*q)*.8,4,'#fff6c8')});ctx.restore()}
function omoiLight(j,A,B,i,lit){/* 2人の胸から、属性の色の光がうかび、木の前でまわって、ひとつになり、枝にのぼって、あかりになる。ともったら lit をよぶ */
  const g=sacredGeo(j),mx=g.cx,my=g.base-Math.min(46,g.h*.45),cA=ELEM[A.elem].body,cB=ELEM[B.elem].body,[lx,ly]=omoiLampPos(j,i);
  for(const[r,c]of[[A,cA],[B,cB]])scnAdd('orb',1100,{x0:r.x*TS,y0:r.y*TS-18-uLift(r),x1:mx,y1:my,arc:16,col:c,n:3});sfx('power');
  scnAdd('twin',1000,{x:mx,y:my,col:cA,col2:cB},1050);
  villageTimeout(()=>{sacredRings(mx,my+6,1,26,'#fff6c8');scnAdd('orb',750,{x0:mx,y0:my,x1:lx,y1:ly,arc:10,col:'#fff0a8',n:3});sfx('shard')},2050);
  villageTimeout(()=>{lit([cA,cB]);scnAdd('ring',900,{x:lx,y:ly+4,r0:3,r1:22,col:cA});sacredStartEffect('sway',2200);sacredLeafFall(g,5,g.h*.3);sfx('sacred')},2800)}
function omoiShardBeat(j,ms,d){/* お礼の会話：3つのあかりが枝から根もとへおりてきて、ひとつになり、かけらになる → フタバの両手へ */
  const g=sacredGeo(j),f=S.res.find(r=>r.name===POKO&&!r.hidden),P=(S.flags.omoiP||[]).slice(0,3),rx=g.cx,ry=g.base-18,owner=S;
  for(let i=0;i<3;i++){const[x,y]=omoiLampPos(j,i),c=omoiCols(P[i]);scnAdd('glow',900+i*350,{x,y,r:8,col:c[0]});scnAdd('orb',1200,{x0:x,y0:y,x1:rx,y1:ry,arc:-12,col:c[0],n:2},i*350)}
  LAMPS_TAKEN.add(S);sfx('sacred');
  const near=f&&Math.hypot(f.x-storyTreeX(j),f.y-storyTreeY(j))<12;if(near){f.face=storyTreeX(j)>=f.x?1:-1;SACRED_POSES.delete(f);sacredScenePose(f,'storyOffer',600000,{side:true,face:f.face})}
  storyShot([[g.cx-60,g.top],[g.cx+60,g.base+14],...(near?[[f.x*TS-24,f.y*TS-60-uLift(f)],[f.x*TS+24,f.y*TS+10-uLift(f)]]:[])],{limit:2.3,seconds:1.3});
  villageTimeout(()=>{sacredRings(rx,ry+8,2,40,'#ffd1e8');scnAdd('gem',near?1500:2600,{x:rx,y:ry,rise:14});sfx('shard')},1900);
  if(near)villageTimeout(()=>{if(S!==owner||!S.res.includes(f))return;const hx=f.x*TS+f.face*5,hy=f.y*TS-42-uLift(f);scnAdd('orb',900,{x0:rx,y0:ry-14,x1:hx,y1:hy,arc:18,col:'#fff0a8',n:3});scnAdd('gem',2600,{actor:f,dx:f.face*5,dy:-42},850);
    villageTimeout(()=>{sfx('shard');for(let i=0;i<14;i++){const a=i/14*Math.PI*2;fx.push({k:'p',x:hx,y:hy,vx:Math.cos(a)*40,vy:Math.sin(a)*40-20,life:1,col:i%2?'#fff6c8':'#ffd1e8',r:2})}},900)},3300);
  d.waitUntil=Math.max(d.waitUntil||0,performance.now()+ms)}
/* ---------- ヌシ様の足あと：むかし歩いた光のひづめのあとが、1歩ずつあらわれる ---------- */
function hoofTrail(pts,gap,ms,delay){/* pts：[[x,y]...]（マスの座標）。1歩ずつ、左右にずらして出す */
  pts.forEach((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,s=i%2?1:-1,x=p[0]-dy/L*.12*s,y=p[1]+dx/L*.12*s,q=(y|0)*W+(x|0);
    scnAdd('hoof',ms,{x:x*TS,y:y*TS-(q>=0&&q<W*H?hiAt(q)*LIFT:0),v:Math.abs(dy)>Math.abs(dx)},(delay||0)+i*gap);villageTimeout(()=>sfx('chime'),(delay||0)+i*gap)})}
function hoofBlooms(x,y,n,delay){const C=['#ffd1e8','#fff2f6','#fff0a8'];for(let i=0;i<n;i++){const a=i/n*Math.PI*2+.4,r=.55+(i%3)*.22,bx=x+Math.cos(a)*r,by=y+Math.sin(a)*r*.7,q=(by|0)*W+(bx|0);scnAdd('bloom',3400,{x:bx*TS,y:by*TS-hiAt(q)*LIFT,col:C[i%3]},(delay||0)+i*130)}}
