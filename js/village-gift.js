'use strict';
/* 物語のできごとのあと、なかまが村に物をおいてくれる（草原だけ）。
   できごとの会話がおわってから1回だけ（S.vgSeen）、やることを S.vgift にためる（ロードしても残る）。
   昼・コワイノがいない・会話がないときに、その子が空いた所へ歩いていき、しゃがんで置いて、ひとこと話す。
   置ける所がなければ、なにもしない。思い出帳の再生ではしない */
const VGIFT=[
  {k:'summon',el:'earth',id:'bellf',n:3,at:'shrine',line:'ここ、ずっと土がさみしそうだったからねぇ。お花、咲かせておいたよぉ。'},
  {k:'earthListen',el:'earth',id:'bellf',n:2,at:'stump',line:'木のまわりも、にぎやかなほうが、うれしいよねぇ。'},
  {k:'fire',el:'fire',id:'campfire',n:1,at:'vill',line:{A:'夜は冷えるからね。ここで、みんなであったまりな。',B:'夜は冷えるからな。ここで、みんなであったまれ。'}},
  {k:'fireRoot',el:'fire',id:'salvia',n:2,at:'stump',line:{A:'あかい花のそばなら、根っこも、もうすこしぬくもるだろ。',B:'あかい花のそばなら、根っこも、もうすこしぬくもるだろ。'}},
  {k:'water',el:'water',id:'jar',n:1,at:'vill',line:'雨の水を、ここにためておきましょう。畑の水やりに使えます。'},
  {k:'waterFilm',el:'water',id:'lotus',n:2,at:'water',line:'水の上にも、花をうかべておきました。'},
  {k:'ookage',el:'wood',id:'signw',n:1,at:'vill',line:'#joy|ここは、ぼくたちの村だって、だれが見てもわかるようにしたかったんだ。'},
  {k:'wind',el:'wind',id:'parasol',n:1,at:'vill',line:'日ざしの強い日でも、ここなら風がすずしいはずさ。'},
  {k:'windEcho',el:'wind',id:'lily',n:2,at:'stump',line:'木のそばにも、いい風がとどくようにしておいたよ。'}
];
const vgOn=()=>!!S&&WD===0&&!S.free&&!MEMRUN&&!STORY_REPLAY_RUN&&!STORY_REPLAY_SHELL&&!S.cleared;
const vgWho=g=>g.el==='wood'?POKO:keyName(g.el);
function vgScan(){/* 会話までおわったできごとを、やることにためる（何もないときは、セーブの中身をかえない） */const add=VGIFT.filter(g=>!(S.vgSeen||{})[g.k]&&qDone(g.k));if(!add.length&&S.flags.vgift1)return;const seen=S.vgSeen||(S.vgSeen={}),P=S.vgift||(S.vgift=[]);
  if(!S.flags.vgift1){S.flags.vgift1=1;for(const g of add)seen[g.k]=1;return}/* 前のセーブで、もうおわっていたできごとは、置かない */
  for(const g of VGIFT)if(!seen[g.k]&&qDone(g.k)){seen[g.k]=1;P.push(g.k)}}
function vgCenter(g){if(g.at==='stump'||g.at==='water'){if(S.sacredRoot==null)return null;const s=fieldStump(S.sacredRoot);return [s%W,(s/W)|0]}return STATUE>=0?[STATUE%W,(STATUE/W)|0]:[CX,CY]}
function vgCellOK(g,j,G){/* その物を、j（左上）に置けるか */const x=j%W,y=(j/W)|0,b=BL[g.id];
  if(g.at==='water'){if(S.ground[j]!==1||S.obj[j]||!canPlace(g.id,x,y,true))return false;return [-1,1,-W,W].some(d=>G.dist[j+d]>=0&&walk(j+d))}
  if(!canPlace(g.id,x,y,true))return false;const cells=fp(g.id,x,y),ins=HOUSES.some(h=>cells.some(([a,c])=>h.inside.has(c*W+a)));if(ins)return false;
  for(const[a,c]of cells){const k=c*W+a;if(S.obj[k]||S.floor[k]||S.ground[k]!==0||g.at==='vill'&&!VILL[k])return false}
  if(b.solid&&!PLANTS.includes(g.id)){/* 通り道をふさがない：まわりがぜんぶ、歩けて空いている所 */for(const[a,c]of cells)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=(c+dy)*W+a+dx;if(cells.some(([p,q])=>q*W+p===k))continue;if(!walk(k)||S.obj[k]&&!WEEDS.has(S.obj[k]))return false}}
  return true}
function vgStand(G,cells0,id){const cells=cells0.flatMap(j=>fp(id,j%W,(j/W)|0).map(([a,c])=>c*W+a));let best=-1,bd=Infinity;for(const j of cells){const x=j%W,y=(j/W)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=(y+dy)*W+x+dx;if(x+dx<0||y+dy<0||x+dx>=W||y+dy>=H||cells.includes(k))continue;if(G.dist[k]>=0&&walk(k)&&G.dist[k]<bd){bd=G.dist[k];best=k}}}return best}
function vgPick(g,r){/* 置くマス（左上）。見つからなければ null */const c=vgCenter(g);if(!c)return null;const G=bfs(r.x|0,r.y|0),R=g.at==='vill'?14:g.at==='water'?12:g.at==='shrine'?6:4,L=[];
  for(let y=Math.max(0,c[1]-R);y<=Math.min(H-1,c[1]+R);y++)for(let x=Math.max(0,c[0]-R);x<=Math.min(W-1,c[0]+R);x++){const j=y*W+x,d=Math.hypot(x-c[0],y-c[1]);if(d<(g.at==='vill'?3:1.5)||!vgCellOK(g,j,G))continue;L.push([j,d+(g.at==='shrine'&&REV&&REV.has(j)?20:0)])}/* 神殿のまわりの花は、あれ地を先に */
  L.sort((a,b)=>a[1]-b[1]);if(!L.length)return null;
  const out=[L[0][0]];for(const[j]of L.slice(1)){if(out.length>=g.n)break;if(out.some(k=>Math.abs(k%W-j%W)<=2&&Math.abs(((k/W)|0)-((j/W)|0))<=2&&k!==j))out.push(j)}/* 花は、かたまって咲かせる */
  const stand=vgStand(G,out,g.id);return stand<0?null:{cells:out,stand,G}}
function vgBusy(r){const a=r.act;return r.hidden||r.hunger<50||hungry(r)||onHold(r)||HOLD.has(r.id)||!!a&&(a.type==='sleep'||URGNO.includes(a.type)||KEEPC.has(a.type)||MAINGO.has(a.type))}
function villageGiftTick(){if(!vgOn())return;vgScan();const P=S.vgift||[];
  const unsafe=isNight()||S.enemies.some(e=>!e.dead)||sacredQuietActive()||mainGathering();
  for(const r of S.res)if(r.act&&r.act.type==='vgift'&&r.act.stage==='walk'&&unsafe)endAct(r);/* 夜・コワイノで、やめる（つぎの昼に、もう一度） */
  if(!P.length||unsafe||!$('#dialog').hidden||S.res.some(r=>r.act&&r.act.type==='vgift'))return;
  for(const k of P){const g=VGIFT.find(v=>v.k===k);if(!g){P.splice(P.indexOf(k),1);return}const nm=vgWho(g),r=S.res.find(q=>q.name===nm);if(!r||vgBusy(r))continue;
    const p=vgPick(g,r);if(!p){P.splice(P.indexOf(k),1);return}/* 置ける所がない：なにもしない */
    endAct(r);startAct(r,p.G,'vgift',p.stand,{gk:k,cells:p.cells});return}}
ACT.vgift={start(r,a){const g=VGIFT.find(v=>v.k===a.gk);if(!g||!vgOn())return false;const G=bfs(r.x|0,r.y|0),cells=a.cells.filter(j=>vgCellOK(g,j,G));if(!cells.length)return false;/* 先にうまった：つぎの見回りで、べつの所をさがす（なければ、やめる） */
    S.vgift=(S.vgift||[]).filter(k=>k!==a.gk);for(const j of cells){setBlock(g.id,j);if(PLANTS.includes(g.id))plantSparkle(j,g.id);else burst(j,'furn','furnPlace')}
    a.t0=performance.now();a.placed=cells;r.face=cells[0]%W+.5>=r.x?1:-1;recount();checkQuest()},
  tick(r,a){if(!a.said&&performance.now()-a.t0>=1500){a.said=true;a.t1=performance.now();JUMP.set(r,a.t1);const g=VGIFT.find(v=>v.k===a.gk);let s=g.line;if(typeof s==='object')s=elemKey(r)==='fireB'?s.B:s.A;talkOnce('vg_'+g.k,[[r.name,s]],300)}},
  done:(r,a)=>!!a.said&&performance.now()-a.t1>=1200};
