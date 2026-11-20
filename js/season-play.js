'use strict';
/* ---------- 季節の遊び（ひまなとき）：せいれいが2〜3人で、季節の遊びをする（冬：雪合戦・かまくら、夏：水あそび、春：お花見、秋：落ち葉あそび）。
   言い出した子が、近くのひまな子を1〜2人さそって、まん中（c）のまわりに立ち（ACT.splay）、SPLAYDUR のあいだ遊ぶ。おわると、たのしさ+SPLAYFUN・なかよし+SPLAYBOND。
   遊びの見た目は、ドットの粒（fx の p：雪玉・水しぶき・花びら・落ち葉）と、かまくら（S.kama、見た目だけ。春にとける）。セーブは S.kama と、言い出した日 S.splayD だけ ---------- */
const SPLAYP=.18,SPLAYDUR=40,SPLAYFUN=8,SPLAYBOND=1,SPLAYCD=360,SPLAYR=12,KAMAMAX=3;
const SPLAYN={snowball:'雪合戦',kama:'かまくら',mizu:'水あそび',hanami:'お花見',leaf:'落ち葉あそび'};
const splayFree=j=>j>=0&&j<W*H&&walk(j)&&!S.obj[j]&&!S.ground[j]&&!roomOf(j)&&!(TAKEN&&TAKEN.has(j))&&!(typeof seatJ==='function'&&seatJ(j));
function splayKind(){const se=seasonNow(),h=hour();if(isNight()||h<8||h>=17)return '';if(se===3)return Math.random()<.5?'snowball':'kama';if(S.rain)return '';return se===0?'hanami':se===1?'mizu':'leaf'}
function splayIdle(q){return !q.hidden&&!q.nap&&!q.coffin&&!q.meal&&!heldN(q)&&(!q.act||IDLE_ACTS.includes(q.act.type)&&q.act.type!=='splay'&&!((q.act.type==='fish'||q.act.type==='play')&&q.act.stage==='do'))&&q.hunger>=150&&q.energy>=25&&!isWatch(q)}
function splayCenter(G,k,r){/* 遊ぶ所：まん中と、まわりの立つ所が空いている所 */const near=(j,f,R)=>{const x=j%W,y=(j/W)|0;for(let b=-R;b<=R;b++)for(let a=-R;a<=R;a++){const q=(y+b)*W+x+a;if(q>=0&&q<W*H&&f(q))return true}return false};
  const open=j=>splayFree(j)&&splayFree(j-1)&&splayFree(j+1)&&splayFree(j-W)&&splayFree(j+W);
  if(k==='snowball')return nearest(G,j=>open(j)&&splayFree(j-2)&&splayFree(j+2),SPLAYR+6);
  if(k==='kama'){const L=S.kama||[];return nearest(G,j=>open(j)&&splayFree(j-W-1)&&splayFree(j-W+1)&&!L.some(m=>Math.abs(m.j%W-j%W)<4&&Math.abs((m.j/W|0)-(j/W|0))<4),SPLAYR+6)}
  if(k==='mizu')return nearest(G,j=>splayFree(j)&&splayFree(j-1)&&splayFree(j+1)&&near(j,q=>waterJ(q),1),SPLAYR+10);
  if(k==='hanami')return nearest(G,j=>open(j)&&near(j,q=>{const o=S.obj[q],b=BL[o];return !!b&&b.kind==='plant'&&!isBud(q)},2),SPLAYR+10);
  if(k==='leaf')return nearest(G,j=>open(j)&&near(j,q=>TREES.has(S.obj[q]),2),SPLAYR+10);return -1}
function splaySpots(k,c,n){/* 立つ所（まん中 c からのずれ） */const P=k==='snowball'?[[-2,0],[2,0],[2,1]]:k==='mizu'?[[0,0],[-1,0],[1,0]]:k==='kama'?[[-1,1],[1,1],[0,1]]:[[-1,0],[1,0],[0,1]];
  return P.slice(0,n).map(([dx,dy])=>c+dy*W+dx)}
function goSeasonPlay(r,G){if(!S||IS_STORY_REPLAY||r.splayT>S.t||Math.random()>=SPLAYP)return false;const k=splayKind();if(!k)return false;
  const d=callDay();if(S.splayD&&S.splayD.d===d&&S.splayD.n>=3)return false;/* 1日に3回まで */
  const P=S.res.filter(q=>q!==r&&splayIdle(q)&&Math.hypot(q.x-r.x,q.y-r.y)<SPLAYR).sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y)).slice(0,2);if(!P.length)return false;/* ひとりでは遊ばない */
  const c=splayCenter(G,k,r);if(c<0)return false;const who=[r,...P],sp=splaySpots(k,c,who.length);if(sp.some(j=>!splayFree(j)&&j!==c))return false;
  if(k==='kama'){const L=S.kama||(S.kama=[]);if(L.length>=KAMAMAX)L.shift();L.push({j:c-W,g:0})}
  S.splayD=S.splayD&&S.splayD.d===d?{d,n:S.splayD.n+1}:{d,n:1};const id=(S.splayId=(S.splayId||0)+1);
  who.forEach((q,i)=>{q.splayT=S.t+SPLAYCD;if(q!==r){endAct(q);q.act=null;q.path=[]}startAct(q,q===r?G:bfs(q.x|0,q.y|0),'splay',sp[i],{k,c,i,g:id,dur:SPLAYDUR,ids:who.map(x=>x.id)})});
  addFloat(r.x,r.y-1.4,SPLAYN[k]+'しよう！','#fff3d6');return true}
function splayMates(a){return (a.ids||[]).map(id=>S.res.find(q=>q.id===id)).filter(q=>q&&q.act&&q.act.type==='splay'&&q.act.g===a.g)}
ACT.splay={start(r,a){const cx=a.c%W+.5,cy=((a.c/W)|0)+.5;if(Math.abs(cx-r.x)>.1)r.face=cx>r.x?1:-1;a.beat=0},
  tick(r,a,dt){const M=splayMates(a);if(M.length<2&&a.t>4){a.t=a.dur;return}/* あいてがいなくなったら、おわり */
    const cx=a.c%W+.5,cy=((a.c/W)|0)+.5,px=r.x*TS,py=r.y*TS,ph=Math.floor((a.t+a.i*1.3)/2.4);if(ph===a.beat)return;a.beat=ph;
    if(a.k==='snowball'){const o=M.filter(q=>q!==r&&Math.sign(q.x-cx)!==Math.sign(r.x-cx))[0]||M.find(q=>q!==r);if(!o)return;r.face=o.x>r.x?1:-1;if(ph%2)return;
      const T=.7,tx=o.x*TS,ty=(o.y-.4)*TS,vx=(tx-px)/T,vy=((ty-(py-14))-.5*260*T*T)/T;fx.push({k:'p',x:px,y:py-14,vx,vy,life:T*1.4,col:'#ffffff',r:4});
      villageTimeout(()=>{if(!S.res.includes(o))return;for(let i=0;i<6;i++){const q=Math.random()*6.28;fx.push({k:'p',x:o.x*TS,y:(o.y-.4)*TS,vx:Math.cos(q)*40,vy:Math.sin(q)*40-30,life:.45,col:i%2?'#ffffff':'#dde8f6',r:2})}if(Math.random()<.5){JUMP.set(o,performance.now());o.bubble='😆'}sfxAt('fsnow',o.x,o.y)},T*1000);sfxAt('fsnow',r.x,r.y)}
    else if(a.k==='kama'){const m=(S.kama||[]).find(q=>q.j===a.c-W);if(m)m.g=Math.max(m.g,Math.min(3,Math.floor(a.t/(a.dur/4))));for(let i=0;i<3;i++)fx.push({k:'p',x:cx*TS+(Math.random()-.5)*20,y:(cy-.6)*TS,vx:(Math.random()-.5)*40,vy:-60-Math.random()*30,life:.5,col:'#ffffff',r:2});sfxAt('fsnow',r.x,r.y)}
    else if(a.k==='mizu'){for(let i=0;i<7;i++){const q=-Math.PI*(.15+.7*Math.random());fx.push({k:'p',x:px+(Math.random()-.5)*10,y:py-6,vx:Math.cos(q)*70*(Math.random()<.5?-1:1),vy:Math.sin(q)*120,life:.7,col:i%2?'#cfeeff':'#7fc6ef',r:2})}if(ph%2===0){JUMP.set(r,performance.now());sfxAt('twater',r.x,r.y)}}
    else if(a.k==='hanami'){for(let i=0;i<3;i++)fx.push({k:'p',x:cx*TS+(Math.random()-.5)*60,y:(cy-1.6)*TS,vx:(Math.random()-.5)*20,vy:5,life:1.2,col:i%2?'#ffd3e6':'#ffb4d0',r:2})}
    else if(a.k==='leaf'){if(ph%2===0){JUMP.set(r,performance.now());for(let i=0;i<9;i++){const q=-Math.PI*(.1+.8*Math.random());fx.push({k:'p',x:cx*TS+(Math.random()-.5)*16,y:cy*TS,vx:Math.cos(q)*80,vy:Math.sin(q)*110,life:.8,col:['#e98a3a','#d4632e','#f2c14e','#b8562a'][i%4],r:3})}sfxAt('tgrass',r.x,r.y)}}},
  done:(r,a)=>a.t>=a.dur,
  end(r,a){if(a.t<a.dur*.5)return;funAdd(r,SPLAYFUN,'solo');for(const q of S.res)if(q!==r&&(a.ids||[]).includes(q.id)&&q.id>r.id)bondAdd(r,q,SPLAYBOND,'splay');JOYU.set(r,performance.now()+1600);JUMP.set(r,performance.now());r.wanderRestUntil=S.t+45;
    if(a.k==='kama'){const m=(S.kama||[]).find(q=>q.j===a.c-W);if(m)m.g=3}}};
ACT_LBL.splay='季節の遊びをしている';IDLE_ACTS.push('splay');
function splayAnim(r){const a=r.act;if(!a||a.stage!=='do')return'';const ph=Math.floor((a.t+a.i*1.3)/2.4);
  if(a.k==='snowball')return ph%2?'qstone':'raise';/* 雪をすくって、なげる */if(a.k==='kama')return'qstone';if(a.k==='mizu')return ph%2?'wave':'qrain';if(a.k==='hanami')return a.i===0?'eat':'sunset';if(a.k==='leaf')return ph%2?'talkjoy':'clap';return'talk'}
/* かまくら（冬だけ・見た目だけ）：g＝できぐあい 0〜3。ドットの雪のドーム（1ドット＝ゲームの2点）。春になったらとける（splaySeason） */
function kamaDraw(add,vis,ctx){if(!S||!S.kama||!S.kama.length||seasonNow()!==3)return;
  for(const m of S.kama){const j=m.j;if(S.obj[j])continue;const o={x:j%W+.5,y:((j/W)|0)+.9};if(!vis(o))continue;const px=Math.round(o.x*TS),fy=Math.round(o.y*TS-(S.hi?hiAt(j)*LIFT:0)),g=Math.max(1,(m.g|0)+1)/4;
    add(o.y,2,[px-24,fy-30,px+24,fy+4],()=>{const R=Math.round(22*g),H=Math.round(20*g);for(let y=0;y<H;y+=2){const w=Math.round(R*Math.sqrt(1-Math.pow(y/H,2)));ctx.fillStyle=y<4?'#cad8ea':y>H-6?'#ffffff':'#eef4fb';ctx.fillRect(px-w,fy-y-2,w*2,2);ctx.fillStyle='#d7e2f0';ctx.fillRect(px+w-2,fy-y-2,2,2)}
      if(m.g>=3){ctx.fillStyle='#5b6b84';const dw=8,dh=10;for(let y=0;y<dh;y+=2){const w=Math.round(dw*Math.sqrt(1-Math.pow(y/dh,2)));ctx.fillRect(px-w,fy-y-2,w*2,2)}}},j)}}
function splaySeason(){if(S&&S.kama&&seasonNow()!==3)S.kama=[]}/* 冬がおわったら、かまくらはとける */
