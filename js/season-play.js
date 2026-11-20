'use strict';
/* ---------- 季節の遊び（ひまなとき）：せいれいが2〜3人で、季節の遊びをする（冬：雪合戦・かまくら、夏：水切り、春：お花見、秋：落ち葉あそび）。
   言い出した子が、近くのひまな子を1〜2人さそって、まん中（c）のまわりに立ち（ACT.splay）、SPLAYDUR のあいだ遊ぶ。おわると、たのしさ+SPLAYFUN・なかよし+SPLAYBOND。
   冬の遊びは、雪がつもっているとき（snowCover が SPLAYSNOW より多い）だけ。夏は、イベントの「水あそびの日」とかぶらないように、水べで石をなげる水切り。
   遊びの見た目は、ドットの粒（fx の p：雪玉・花びら・落ち葉）と、水切りの石・波紋・落ち葉の山（SPLAYFX、見た目だけ）と、かまくら（S.kama、見た目だけ。春か、雪がとけたら消える）。
   半分すぎたら、その日の日記の絵の候補（phWant の see、sub は splay か、書く子もいっしょなら splayw）。セーブは S.kama と、言い出した日 S.splayD だけ ---------- */
const SPLAYP=.18,SPLAYDUR=40,SPLAYFUN=8,SPLAYBOND=1,SPLAYCD=360,SPLAYR=12,KAMAMAX=3,SPLAYSNOW=.3,KAMAPEEK=6;
const SPLAYN={snowball:'雪合戦',kama:'かまくら',kiri:'水切り',mizu:'水切り',hanami:'お花見',leaf:'落ち葉あそび'};
const SPLAYFX=[];/* 見た目だけ：水切りの石 {k:'kiri'}・波紋 {k:'rip'} */
const splayFree=j=>j>=0&&j<W*H&&walk(j)&&!S.obj[j]&&!S.ground[j]&&!roomOf(j)&&!(TAKEN&&TAKEN.has(j))&&!(typeof seatJ==='function'&&seatJ(j));
const SPDIR=[[0,1],[1,0],[0,-1],[-1,0]];
function splayKind(){const se=seasonNow(),h=hour();if(isNight()||h<8||h>=17)return '';if(se===3){if(snowCover()<SPLAYSNOW)return '';return Math.random()<.5?'snowball':'kama'}/* 雪がつもっていないと、雪遊びはしない */if(S.rain)return '';return se===0?'hanami':se===1?'kiri':'leaf'}
function splayIdle(q){return !q.hidden&&!q.nap&&!q.coffin&&!q.meal&&!heldN(q)&&(!q.act||IDLE_ACTS.includes(q.act.type)&&q.act.type!=='splay'&&!((q.act.type==='fish'||q.act.type==='play')&&q.act.stage==='do'))&&q.hunger>=250&&q.energy>=30&&!isWatch(q)}
/* 水切りの向き：岸のマス c から、まっすぐ3マスいじょう水がつづく向き（なければ −1） */
function kiriDir(c){const x=c%W,y=(c/W)|0;for(let d=0;d<4;d++){const[dx,dy]=SPDIR[d];let n=0;for(let k=1;k<=4;k++){const q=(y+dy*k)*W+x+dx*k;if(x+dx*k<0||x+dx*k>=W||y+dy*k<0||y+dy*k>=H||!waterJ(q))break;n++}if(n>=3)return d}return -1}
function splayCenter(G,k,r){/* 遊ぶ所：まん中と、まわりの立つ所が空いている所 */const near=(j,f,R)=>{const x=j%W,y=(j/W)|0;for(let b=-R;b<=R;b++)for(let a=-R;a<=R;a++){const q=(y+b)*W+x+a;if(q>=0&&q<W*H&&f(q))return true}return false};
  const open=j=>splayFree(j)&&splayFree(j-1)&&splayFree(j+1)&&splayFree(j-W)&&splayFree(j+W);
  if(k==='snowball')return nearest(G,j=>open(j)&&splayFree(j-2)&&splayFree(j+2),SPLAYR+6);
  if(k==='kama'){const L=S.kama||[];return nearest(G,j=>open(j)&&splayFree(j-W-1)&&splayFree(j-W+1)&&!L.some(m=>Math.abs(m.j%W-j%W)<4&&Math.abs((m.j/W|0)-(j/W|0))<4),SPLAYR+6)}
  if(k==='kiri')return nearest(G,j=>{if(!splayFree(j))return false;const d=kiriDir(j);if(d<0)return false;const[dx,dy]=SPDIR[d];return splayFree(j+dx*W+dy)&&splayFree(j-dx*W-dy)},SPLAYR+10);/* 岸に、水へ向いて3人ならぶ */
  if(k==='hanami')return nearest(G,j=>open(j)&&near(j,q=>{const o=S.obj[q],b=BL[o];return !!b&&b.kind==='plant'&&!isBud(q)},2),SPLAYR+10);
  if(k==='leaf')return nearest(G,j=>open(j)&&near(j,q=>TREES.has(S.obj[q]),2),SPLAYR+10);return -1}
function splaySpots(k,c,n){/* 立つ所（まん中 c からのずれ） */
  if(k==='kiri'){const d=kiriDir(c),[dx,dy]=SPDIR[Math.max(0,d)];return [c,c+dx*W+dy,c-dx*W-dy].slice(0,n)}/* 水の向きとよこにならぶ */
  const P=k==='snowball'?[[-2,0],[2,0],[2,1]]:k==='kama'?[[-1,0],[1,0],[0,1]]:[[-1,0],[1,0],[0,1]];
  return P.slice(0,n).map(([dx,dy])=>c+dy*W+dx)}
function goSeasonPlay(r,G){if(!S||IS_STORY_REPLAY||r.splayT>S.t||Math.random()>=SPLAYP)return false;if(S.kama&&S.kama.length&&snowCover()<.05)S.kama=[];/* 雪がとけたら、かまくらもとける */const k=splayKind();if(!k)return false;
  const d=callDay();if(S.splayD&&S.splayD.d===d&&S.splayD.n>=3)return false;/* 1日に3回まで */
  const P=S.res.filter(q=>q!==r&&splayIdle(q)&&Math.hypot(q.x-r.x,q.y-r.y)<SPLAYR).sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y)).slice(0,2);if(!P.length)return false;/* ひとりでは遊ばない */
  const c=splayCenter(G,k,r);if(c<0)return false;const who=[r,...P],sp=splaySpots(k,c,who.length);if(sp.some(j=>!splayFree(j)&&j!==c))return false;
  if(k==='kama'){const L=S.kama||(S.kama=[]);if(L.length>=KAMAMAX)L.shift();L.push({j:c-W,g:0})}
  S.splayD=S.splayD&&S.splayD.d===d?{d,n:S.splayD.n+1}:{d,n:1};const id=(S.splayId=(S.splayId||0)+1);
  who.forEach((q,i)=>{q.splayT=S.t+SPLAYCD;if(q!==r){endAct(q);q.act=null;q.path=[]}startAct(q,q===r?G:bfs(q.x|0,q.y|0),'splay',sp[i],{k,c,i,g:id,dur:SPLAYDUR,ids:who.map(x=>x.id)})});
  addFloat(r.x,r.y-1.4,SPLAYN[k]+'しよう！','#fff3d6');return true}
function splayMates(a){return (a.ids||[]).map(id=>S.res.find(q=>q.id===id)).filter(q=>q&&q.act&&q.act.type==='splay'&&q.act.g===a.g)}
/* 水切りの石をなげる：はねる回数 n（1〜5）。石は水の上を、だんだん短く・低くはねて、さいごにしずむ（kiriFx） */
function kiriThrow(r,a,M){const d=kiriDir(a.c);if(d<0)return;const[dx,dy]=SPDIR[d],u=Math.random(),n=u<.15?1:u<.4?2:u<.7?3:u<.9?4:5;
  SPLAYFX.push({k:'kiri',x:r.x*TS,y:r.y*TS,dx,dy,n,t0:performance.now(),st:S,rid:r.id,ids:M.map(q=>q.id)});sfx('tap')}
const KIRIHOP=[46,36,28,21,15],KIRIT=[240,200,170,140,120];/* 1回ごとにはねる長さ（ゲームの点）と時間（ミリ秒） */
function kiriPos(s,now){/* 石の場所と、さいごまでいったか */let t=now-s.t0,dist=0,lift=0;const fly=180;/* はじめに手から水へとぶ時間 */
  if(t<fly){const p=t/fly;return{x:s.x+s.dx*24*p,y:s.y+s.dy*24*p-14+6*p-Math.sin(p*Math.PI)*6,touch:-1}}t-=fly;dist=24;
  for(let i=0;i<s.n;i++){const T=KIRIT[i],L=KIRIHOP[i];if(t<T){const p=t/T;lift=Math.sin(p*Math.PI)*L*.22;return{x:s.x+s.dx*(dist+L*p),y:s.y+s.dy*(dist+L*p)-lift,touch:i}}t-=T;dist+=L}
  return{x:s.x+s.dx*dist,y:s.y+s.dy*dist,touch:s.n,end:true}}
function kiriTick(now){for(let i=SPLAYFX.length-1;i>=0;i--){const s=SPLAYFX[i];if(s.st!==S){SPLAYFX.splice(i,1);continue}
    if(s.k==='rip'){if(now-s.t0>s.dur)SPLAYFX.splice(i,1);continue}
    const p=kiriPos(s,now);if(p.touch!==s.lt){s.lt=p.touch;if(p.touch>=0){const j=((p.y/TS)|0)*W+((p.x/TS)|0);if(!waterJ(j)){s.done=1}else{SPLAYFX.push({k:'rip',x:p.x,y:p.y,t0:now,dur:p.end?900:600,big:!!p.end,st:S});sfxAt('twater',p.x/TS,p.y/TS)}}}/* 水にふれたら波紋。水がなくなったら、そこでおわり */
    if(p.end||s.done){SPLAYFX.splice(i,1);const r=S.res.find(q=>q.id===s.rid),n=s.done?Math.max(0,p.touch):s.n;if(!r)continue;addFloat(r.x,r.y-1.4,n+'かい！','#fff3d6');
      if(n>=4){JUMP.set(r,now);r.bubble='😆';for(const id of s.ids){const q=S.res.find(z=>z.id===id);if(q&&q!==r)JOYU.set(q,now+1400)}}/* よくはねたら、みんなでよろこぶ */
      else if(n<=1)r.bubble='💦'}}}
ACT.splay={start(r,a){if(a.k==='mizu')a.k='kiri';/* 前のセーブの水あそび */const cx=a.c%W+.5;if(Math.abs(cx-r.x)>.1)r.face=cx>r.x?1:-1;a.beat=0;
    if(a.k==='kiri'){const d=kiriDir(a.c);if(d===1)r.face=1;else if(d===3)r.face=-1}},
  tick(r,a,dt){const M=splayMates(a);if(M.length<2&&a.t>4){a.t=a.dur;return}/* あいてがいなくなったら、おわり */
    const cx=a.c%W+.5,cy=((a.c/W)|0)+.5,px=r.x*TS,py=r.y*TS,ph=Math.floor((a.t+a.i*1.3)/2.4);
    if(a.i===0&&!a.ph&&a.t>=a.dur*.5&&typeof phWant==='function'){a.ph=1;const f=typeof dyWriter==='function'&&dyWriter();phWant('see',phBoxOf(cx,cy-.5,1.6),SPLAYN[a.k],f&&(a.ids||[]).includes(f.id)?'splayw':'splay')}/* 日記の絵の候補 */
    if(a.k==='hanami'&&Math.random()<dt*1.5)hanamiPetal(cx,cy);/* 花びらは、いつも少しずつ */
    if(a.k==='kama'&&a.t>a.dur-KAMAPEEK){const kx=cx;if(Math.abs(kx-r.x)>.1)r.face=kx>r.x?1:-1}/* できたら、みんなで、かまくらをのぞく */
    if(ph===a.beat)return;a.beat=ph;
    if(a.k==='snowball'){const o=M.filter(q=>q!==r&&Math.sign(q.x-cx)!==Math.sign(r.x-cx))[0]||M.find(q=>q!==r);if(!o)return;r.face=o.x>r.x?1:-1;if(ph%2)return;
      const T=.7,tx=o.x*TS,ty=(o.y-.4)*TS,g=260,vx=(tx-px)/T,vy=((ty-(py-14))-.5*g*T*T)/T;fx.push({k:'p',x:px,y:py-14,vx,vy,g,nd:1,life:T*1.4,col:'#ffffff',r:4});/* 雪玉は、ねらった子にとどく */
      villageTimeout(()=>{if(!S.res.includes(o))return;for(let i=0;i<8;i++){const q=Math.random()*6.28;fx.push({k:'p',x:o.x*TS,y:(o.y-.4)*TS,vx:Math.cos(q)*50,vy:Math.sin(q)*45-40,life:.5,col:i%2?'#ffffff':'#dde8f6',r:2})}
        JUMP.set(o,performance.now());o.bubble=Math.random()<.5?'😆':'💦';sfxAt('fsnow',o.x,o.y)},T*1000);sfxAt('fsnow',r.x,r.y)}/* 当たった子は、かならず、はねる */
    else if(a.k==='kama'){if(a.t>a.dur-KAMAPEEK)return;const m=(S.kama||[]).find(q=>q.j===a.c-W);if(m)m.g=Math.max(m.g,Math.min(3,Math.floor(a.t/((a.dur-KAMAPEEK)/4))));for(let i=0;i<3;i++)fx.push({k:'p',x:cx*TS+(Math.random()-.5)*20,y:(cy-.6)*TS,vx:(Math.random()-.5)*40,vy:-60-Math.random()*30,life:.5,col:'#ffffff',r:2});sfxAt('fsnow',r.x,r.y)}
    else if(a.k==='kiri'){if(ph%2)kiriThrow(r,a,M)}/* すくって、なげる */
    else if(a.k==='hanami'){if(a.i===ph%M.length)JOYU.set(r,performance.now()+900)}/* ときどき、だれかが花を見上げてよろこぶ */
    else if(a.k==='leaf'){if(a.t<a.dur*.5){for(let i=0;i<3;i++){const q=Math.random()*6.28,R=18+Math.random()*10;fx.push({k:'p',x:cx*TS+Math.cos(q)*R,y:cy*TS+Math.sin(q)*R*.5,vx:-Math.cos(q)*R*1.2,vy:-20,g:60,life:.7,col:LEAFC[i%4],r:2})}sfxAt('tgrass',r.x,r.y);return}/* はじめは、落ち葉をあつめて山にする */
      if(ph%2===0){JUMP.set(r,performance.now());for(let i=0;i<12;i++){const q=-Math.PI*(.1+.8*Math.random());fx.push({k:'p',x:cx*TS+(Math.random()-.5)*16,y:cy*TS,vx:Math.cos(q)*70,vy:Math.sin(q)*150,g:110,vt:28,sw:22,ph:Math.random()*6,life:2.6,col:LEAFC[i%4],r:3})}sfxAt('tgrass',r.x,r.y)}}},/* 山にとびこむと、落ち葉がまいあがって、ひらひら落ちる */
  done:(r,a)=>a.t>=a.dur,
  end(r,a){if(a.t<a.dur*.5)return;funAdd(r,SPLAYFUN,'solo');for(const q of S.res)if(q!==r&&(a.ids||[]).includes(q.id)&&q.id>r.id)bondAdd(r,q,SPLAYBOND,'splay');JOYU.set(r,performance.now()+1600);JUMP.set(r,performance.now());r.wanderRestUntil=S.t+45;
    if(a.k==='snowball')r.bubble='😆';/* さいごは、みんなで笑う */
    if(a.k==='kama'){const m=(S.kama||[]).find(q=>q.j===a.c-W);if(m)m.g=3}}};
ACT_LBL.splay='季節の遊びをしている';IDLE_ACTS.push('splay');
const LEAFC=['#e98a3a','#d4632e','#f2c14e','#b8562a'];
function hanamiPetal(cx,cy){fx.push({k:'p',x:cx*TS+(Math.random()-.5)*72,y:(cy-1.7)*TS+(Math.random()-.5)*12,vx:(Math.random()-.5)*10+6,vy:4,g:12,vt:16,sw:16,ph:Math.random()*6,life:3.2,col:Math.random()<.5?'#ffd3e6':'#ffb4d0',r:2})}/* 花びらは、ひらひら、ゆっくり落ちる */
function splayAnim(r){const a=r.act;if(!a||a.stage!=='do')return'';const ph=Math.floor((a.t+a.i*1.3)/2.4);
  if(a.k==='snowball')return ph%2?'qstone':'raise';/* 雪をすくって、なげる */
  if(a.k==='kama')return a.t>a.dur-KAMAPEEK?(a.t>a.dur-KAMAPEEK/2?'talkjoy':'point'):'qstone';/* できたら、指さして、よろこぶ */
  if(a.k==='kiri'||a.k==='mizu')return ph%2?'raise':'qstone';/* 石をひろって、なげる */
  if(a.k==='hanami')return JOYU.has(r)&&JOYU.get(r)>performance.now()?'point':'sunset';/* すわって花を見る。ときどき指さす */
  if(a.k==='leaf')return a.t<a.dur*.5?'qstone':ph%2?'talkjoy':'clap';return'talk'}
/* 見た目だけの物を描く：かまくら（冬だけ）・落ち葉の山・水切りの石と波紋。どれもドット（1ドット＝ゲームの2点） */
function kamaDraw(add,vis,ctx){if(!S)return;const now=performance.now();kiriTick(now);
  if(S.kama&&S.kama.length&&seasonNow()===3&&snowCover()>=.05)for(const m of S.kama){const j=m.j;if(S.obj[j])continue;const o={x:j%W+.5,y:((j/W)|0)+.9};if(!vis(o))continue;const px=Math.round(o.x*TS/2)*2,fy=Math.round((o.y*TS-(S.hi?hiAt(j)*LIFT:0))/2)*2,g=Math.max(1,(m.g|0)+1)/4;
    add(o.y,2,[px-26,fy-32,px+26,fy+4],()=>{const R=Math.round(11*g)*2,Hh=Math.round(10*g)*2;
      for(let y=0;y<Hh;y+=2){const w=Math.round(R*Math.sqrt(1-Math.pow(y/Hh,2))/2)*2;if(w<=0)continue;ctx.fillStyle='#b9c8dc';ctx.fillRect(px-w-2,fy-y-2,w*2+4,2)}/* ふち：中の色より少しこい色 */
      for(let y=0;y<Hh-2;y+=2){const w=Math.round(R*Math.sqrt(1-Math.pow((y+2)/Hh,2))/2)*2;if(w<=0)continue;ctx.fillStyle=y<4?'#dbe5f1':'#eef4fb';ctx.fillRect(px-w,fy-y-2,w*2,2);ctx.fillStyle='#d3dfec';ctx.fillRect(px+w-4,fy-y-2,4,2);if(y>Hh/2){ctx.fillStyle='#ffffff';ctx.fillRect(px-w+4,fy-y-2,Math.max(2,w-6),2)}}/* 右はかげ、上は光 */
      for(let i=0;i<4;i++){const q=(j*7+i*13)%17;ctx.fillStyle='#dde7f2';ctx.fillRect(px-R+6+((q*5)%(R*2-10)),fy-4-((q*3)%Math.max(2,Hh-8)),4,2)}/* 雪のブロックのつなぎ目 */
      if(m.g>=3){const dw=5,dh=6;for(let y=0;y<dh*2;y+=2){const w=Math.round(dw*Math.sqrt(1-Math.pow(y/(dh*2),2)))*2;ctx.fillStyle='#93a5bf';ctx.fillRect(px-w-2,fy-y-2,w*2+4,2);ctx.fillStyle=y<4?'#4a5873':'#5b6b84';ctx.fillRect(px-w,fy-y-2,w*2,2)}/* 入口：ふちは少しこい、中はかげ */
        ctx.fillStyle='#f0b860';ctx.fillRect(px-2,fy-4,4,2)}},j)}/* 中に、小さなあかり */
  for(const r of S.res){const a=r.act;if(!a||a.type!=='splay'||a.k!=='leaf'||a.i!==0||a.stage!=='do')continue;const j=a.c,o={x:j%W+.5,y:((j/W)|0)+.7};if(!vis(o))continue;/* 落ち葉の山：あつめるほど大きく、とびこむと少しひくく */
    const p=Math.min(1,a.t/(a.dur*.5)),g=a.t<a.dur*.5?p:1-.25*Math.min(1,(a.t-a.dur*.5)/(a.dur*.5)),px=Math.round(o.x*TS/2)*2,fy=Math.round((o.y*TS-(S.hi?hiAt(j)*LIFT:0))/2)*2;if(g<.08)continue;
    add(o.y-.05,2,[px-20,fy-14,px+20,fy+2],()=>{const R=Math.round(9*g)*2,Hh=Math.max(2,Math.round(5*g)*2);for(let y=0;y<Hh;y+=2){const w=Math.round(R*Math.sqrt(1-Math.pow(y/Hh,2))/2)*2;for(let x=-w;x<w;x+=2){const h=hash(j*31+x*7+y*13);ctx.fillStyle=y===0&&h<.5?'#a04a24':LEAFC[(h*4)|0];ctx.fillRect(px+x,fy-y,2,2)}}},j)}
  for(const s of SPLAYFX){const now2=now;if(s.k==='rip'){const p=(now2-s.t0)/s.dur;if(p>=1)continue;const o={x:s.x/TS,y:s.y/TS};if(!vis(o))continue;
      add(o.y-.4,2,[s.x-24,s.y-8,s.x+24,s.y+8],()=>{const rx=Math.round((3+p*(s.big?11:8)))*2,ry=Math.max(2,Math.round(rx/4)*2),n=Math.max(8,rx*2);ctx.globalAlpha=1-p;ctx.fillStyle='#e8f6ff';for(let i=0;i<n;i++){const q=i/n*6.283;ctx.fillRect(Math.round((s.x+Math.cos(q)*rx)/2)*2,Math.round((s.y+Math.sin(q)*ry)/2)*2,2,2)}ctx.globalAlpha=1})}/* 波紋：ひろがりながら、うすくなるドットの輪 */
    else if(s.k==='kiri'){const q=kiriPos(s,now2);if(q.end)continue;const o={x:q.x/TS,y:q.y/TS};if(!vis(o))continue;add(o.y,3,[q.x-4,q.y-4,q.x+4,q.y+4],()=>{const x=Math.round(q.x/2)*2,y=Math.round(q.y/2)*2;ctx.fillStyle='#8c8f96';ctx.fillRect(x-2,y-2,4,2);ctx.fillStyle='#6f727a';ctx.fillRect(x-2,y,4,2)})}}}
function splaySeason(){if(S&&S.kama&&seasonNow()!==3)S.kama=[]}/* 冬がおわったら、かまくらはとける */
