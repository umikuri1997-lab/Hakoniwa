/* 進行不能にならないこと：おみおくりの前のお墓をこわす／棺をはこぶ子が消える／「！」が出たままキーキャラが消える／
   切り株が家の中／かげのあとが家の中／クリアのあとの目標の文／最後のかけらへ行けないときの案内／御神木のそばがうまっているときの集まり */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const J=async s=>JSON.parse(await run(s));
  await run(`(()=>{document.querySelector('#dialog').hidden=true;USERPAUSE=true;S.introSeen=true;S.flags.tapped=1;S.flags.minaCame=true;S.hold=0;resetVillageTransient();dialog=()=>{};talkOnce=()=>{};
    S.obj[57*W+54]='statue';S.obj[55*W+44]='crate';S.fs={imo:40};S.food=40;S.enemyOn=true;S.t=1440*20+10*60;S.quest=questIndexOf('ookage');S.qTalked=true;S.qStory=null;
    for(const [el,n] of [['earth',MINA],['fire',FIXK0.fire],['water','アオ']])S.res.push(mkRes(S,n,el,44,58));recount();window.GRAVE=()=>S.obj.findIndex((o,j)=>o==='grave'&&!S.dyn[j].buried);})()`);
  /* 1. おみおくりの前のお墓をこわしても、つぎの朝に呼びもどせる */
  const a=await J(`(()=>{const r=S.res.find(q=>q.name===MINA);die(r);const g=GRAVE(),unb0=S.buried.find(q=>q.name===MINA).unb;setMode('remove');removeAt(g%W,(g/W)|0);const unb1=S.buried.find(q=>q.name===MINA).unb;S.summon=null;summonMorning();return JSON.stringify({unb0:!!unb0,unb1:!!unb1,gone:S.obj[g]!=='grave',rev:!!(S.summon&&S.summon.rev)})})()`);
  assert.deepEqual(a,{unb0:true,unb1:false,gone:true,rev:true},'removing an unburied grave must not lose the key spirit');
  console.log('Grave removed before the burial: the key spirit can still come back');
  /* 2. 棺をはこんでいる子が消えても、棺の子を呼びもどせる */
  const b=await J(`(()=>{S.summon=null;S.buried=[];const f=S.res.find(q=>q.name===POKO),h=S.res.find(q=>q.elem==='fire');die(f);h.coffin={name:POKO};die(h);const u=S.buried.find(q=>q.name===POKO).unb;return JSON.stringify({unb:!!u})})()`);
  assert.equal(b.unb,false,'a carried coffin must count as buried when its carrier is lost');
  console.log('Coffin carrier lost: the carried spirit can still come back');
  /* 3. 新しい子の「！」が出たままでも、消えたキーキャラを先に呼びもどせる */
  const c=await J(`(()=>{S.buried=[{name:MINA,elem:'earth'}];S.summon={elem:'wood'};S.summonNext=null;summonMorning();return JSON.stringify({rev:!!S.summon.rev,next:S.summonNext})})()`);
  assert.deepEqual(c,{rev:true,next:'wood'},'a pending new-spirit summon must not block the key spirit');
  console.log('Pending "!" for a new spirit: the lost key spirit comes first, the new spirit next');
  /* 3b. まわりに空きがなくて、お墓を置けなかった子も、呼びもどせる */
  const c2=await J(`(()=>{S.buried=[];S.summon=null;S.summonNext=null;const r=mkRes(S,MINA,'earth',80,80);S.res.push(r);for(let b=-4;b<=4;b++)for(let a2=-4;a2<=4;a2++){const k=(80+b)*W+80+a2;if(!S.obj[k])S.obj[k]='clover'}recount();const g0=cnt('grave');die(r);const noGrave=cnt('grave')===g0,unb0=!!S.buried.find(q=>q.name===MINA).unb;summonMorning();return JSON.stringify({noGrave,unb0,rev:!!(S.summon&&S.summon.rev)})})()`);
  assert.deepEqual(c2,{noGrave:true,unb0:true,rev:true},'a key spirit with no grave must still come back');
  console.log('No room for a grave: the key spirit can still come back');
  /* 4. 切り株が家の中だと、御神木に育たない：理由が出る */
  const d=await J(`(()=>{S.quest=questIndexOf('tower');S.qTalked=true;fieldStoryEnsure('tower');const j=S.sacredRoot,x0=j%W-2,y0=(j/W|0)-2,x1=j%W+5,y1=(j/W|0)+5;const before=(fieldPrepNeed('tower')||{}).label;
    for(let x=x0;x<=x1;x++)for(const y of [y0,y1])S.obj[y*W+x]='hwall';for(let y=y0;y<=y1;y++)for(const x of [x0,x1])S.obj[y*W+x]='hwall';S.obj[y1*W+x0+3]='door';recount();
    const inHouse=HOUSES.some(h=>h.set.has(j)),lab=(fieldPrepNeed('tower')||{}).label;for(let x=x0;x<=x1;x++)for(const y of [y0,y1])S.obj[y*W+x]='';for(let y=y0;y<=y1;y++)for(const x of [x0,x1])S.obj[y*W+x]='';recount();
    return JSON.stringify({before,inHouse,lab,after:(fieldPrepNeed('tower')||{}).label})})()`);
  assert.equal(d.inHouse,true);assert.equal(d.lab,'木のまわりを、家の中にしないでおこう');assert.equal(d.after,d.before,'the usual guide returns after the walls are removed');
  console.log('Stump inside a house: the goal says why the tree cannot grow');
  /* 5. かげのあとが家の中でも、調べられる */
  const e=await J(`(()=>{S.quest=questIndexOf('kagemark');S.qTalked=true;S.bossKills=0;const x=70,y=70;for(let b=-3;b<=3;b++)for(let a2=-3;a2<=3;a2++){const k=(y+b)*W+x+a2;S.obj[k]='';S.ground[k]=0;if(S.fog)S.fog[areaOf(k)]=0}
    for(let a2=-3;a2<=3;a2++){S.obj[(y-3)*W+x+a2]='hwall';S.obj[(y+3)*W+x+a2]='hwall';S.obj[(y+a2)*W+x-3]='hwall';S.obj[(y+a2)*W+x+3]='hwall'}S.obj[(y+3)*W+x]='door';recount();S.flags.kgMark=y*W+x;S.flags.kgLook=false;
    const inHouse=HOUSES.some(h=>h.set.has(y*W+x));setMode('look');cam.z=2;centerOn((x+.5)*TS,(y+.5)*TS);onTap(VW/2,VH/2);const first=!!S.flags.kgLook;if(!first)onTap(VW/2,VH/2);return JSON.stringify({inHouse,look:!!S.flags.kgLook})})()`);
  assert.deepEqual(e,{inHouse:true,look:true},'the shadow mark inside a house can still be examined');
  console.log('Shadow mark inside a house: it can still be examined');
  /* 6. クリアのあと：ヌシ様の話の前は「ヌシ様と話そう」 */
  const f=await J(`(()=>{const k={c:S.cleared,r:S.flags.sacredReunion,q:S.flags.sacredQuietSeen};if(!S.res.some(r=>r.name===POKO))S.res.push(mkRes(S,POKO,'wood',44,58));S.cleared=true;S.flags.sacredReunion=true;S.flags.sacredQuietSeen=false;S.t=1440*30+600;const a=nextStageGoal();S.flags.sacredQuietSeen=true;const b=nextStageGoal();S.cleared=k.c;S.flags.sacredReunion=k.r;S.flags.sacredQuietSeen=k.q;return JSON.stringify({a:a&&a.t,b:b&&b.t})})()`);
  assert.deepEqual(f,{a:'ヌシ様と話そう',b:'つぎの土地へ旅立とう'});
  console.log('After the clear: the goal asks to talk to the guardian first');
  /* 7. 最後のかけらへ行けないとき */
  const g=await J(`(()=>{const x=60,y=40;for(let b=-2;b<=2;b++)for(let a2=-2;a2<=2;a2++){const k=(y+b)*W+x+a2;S.obj[k]='';S.ground[k]=0;if(S.fog)S.fog[areaOf(k)]=0}recount();S.drops=[{x,y,id:'shard',n:1}];SHBLK.t=-1e9;const open=shardBlocked();
    for(let b=-1;b<=1;b++)for(let a2=-1;a2<=1;a2++)if(a2||b)S.obj[(y+b)*W+x+a2]='fence';recount();SHBLK.t=-1e9;const shut=shardBlocked();S.drops=[];return JSON.stringify({open,shut})})()`);
  assert.deepEqual(g,{open:false,shut:true});
  console.log('Last shard fenced in: the goal asks to open a path');
  /* 8. 御神木のそばの立つ所が物でうまっていても、メインの会話に集まれる */
  const h=await J(`(()=>{const j=S.sacredRoot,L=storySlotCells({stump:j});for(const c of L)S.obj[c.k]='fence';recount();const r=S.res.find(q=>q.name===POKO),G=bfs(r.x|0,r.y|0),k=storyWaitStand(r,G,{tree:true,obj:j,cast:[r],key:'t'});for(const c of L)S.obj[c.k]='';recount();return JSON.stringify({n:L.length>0,ok:k>=0&&!L.some(c=>c.k===k)})})()`);
  assert.deepEqual(h,{n:true,ok:true},'main talk by the tree must find a place to stand when the near cells are full');
  console.log('Cells by the sacred tree are full: the cast still finds a place to stand');
  /* 9. 御神木のまわりが花畑でも、立つ所が見つかる */
  const m=await J(`(()=>{const j=S.sacredRoot,w=storySlotCells({stump:j},5.6),L=[];for(let y=(fieldStump(j)/W|0)-6;y<=(fieldStump(j)/W|0)+6;y++)for(let x=fieldStump(j)%W-6;x<=fieldStump(j)%W+6;x++){const k=y*W+x;if(walk(k)&&!S.obj[k]&&!sacredReserved(k)&&k!==fieldStump(j)){S.obj[k]='bellf';L.push(k)}}recount();const r=S.res.find(q=>q.name===POKO),G=bfs(r.x|0,r.y|0),k=storyWaitStand(r,G,{tree:true,obj:j,cast:[r],key:'t'});const ok=k>=0&&walk(k)&&storySlotCells({stump:j}).length<storySlotCells({stump:j},5.6).length&&storySlotCells({stump:j},5.6).length>=8;/* 花でうまる前は少ない・うまったあとは花の上にも立てる */for(const q of L)S.obj[q]='';recount();return JSON.stringify({n:L.length>20,ok})})()`);
  assert.deepEqual(m,{n:true,ok:true},'main talk by the tree must find a place to stand when flowers cover the ground');
  console.log('Flowers all around the sacred tree: the cast still finds a place to stand');
  /* 10. 御神木のまわりが花畑でも、ヌシ様を迎えるときの集まる所が見つかる */
  const n10=await J(`(()=>{const TX=CX+.5,TY=CY,L=[];for(let k=0;k<W*H;k++){const d=Math.hypot(k%W+.5-TX,((k/W)|0)+.5-TY);if(d<=8.5&&walk(k)&&!S.obj[k]&&!roomOf(k)){S.obj[k]='bellf';L.push(k)}}recount();
    const r=S.res.find(q=>q.name===POKO);r.x=TX+14;r.y=TY;r.act=null;gatherWarp(r,TX,TY,{},{});const d=Math.hypot(r.x-TX,r.y-TY),on=S.obj[(r.y|0)*W+(r.x|0)];for(const k of L)S.obj[k]='';recount();return JSON.stringify({many:L.length>40,near:d<=8.5,onFlower:on==='bellf'})})()`);
  assert.deepEqual(n10,{many:true,near:true,onFlower:true},'the reunion gathering must find places to stand when flowers cover the ground');
  console.log('Flowers all around the tree at the reunion: everyone still finds a place to gather');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
