/* 作業台（家具 wbench、よこ2マス：作業台と材料置き場 wbCells）：依頼は、置いた作業台で1つずつ作る（o.cs・S.dyn[j].order）。作業台がないと作らない（作業台そのものの依頼だけ、地面で o.gnd）。
   作業台のとなりの箱にある素材は、運ばずに使う（benchPull。材料置き場も出さない）。ない分だけ、ほかの箱から運ぶ。
   草原のメインの目標「作業台を置こう」は家の壁のあと。古いセーブは番号をずらし（wbQuestIn）、先へ進んでいれば作業台を1つもらう（wbenchFix） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  /* 目標のならび */
  const q=JSON.parse(await run(`JSON.stringify({ids:QUESTS1.slice(3,8).map(q=>q.id),inv:QUEST_INSPIRATIONS.wbench,how:QUESTS1[qsIx('wbench')].how})`));
  console.log(JSON.stringify(q));assert.deepEqual(q.ids,['table','wall','wbench','bed','path']);assert.deepEqual(q.inv,['wbench']);
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};window.FETCH=0;{const t=tryJob;tryJob=(r,G,k)=>['chop','mine','weed','drop','gather'].includes(k)?false:t(r,G,k)}/* 木を切るなどで、箱の数がかわらないように */{const s=ACT.bfetch.start;ACT.bfetch.start=(r,a)=>{FETCH++;return s(r,a)}}true`);
  const st=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;
    const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;
    if(BOARD<0){const free=(x,y,w,h)=>{for(let b=0;b<h;b++)for(let c=0;c<w;c++){const k=(y+b)*W+x+c;if(S.obj[k]||S.ground[k]||hiAt(k)||(S.fog&&S.fog[k]))return false}return true};let q=null;for(let y=CY-12;y<CY+20&&!q;y++)for(let x=CX-14;x<CX+14;x++)if(free(x,y,8,6)){q=[x,y];break}if(!q){/* まん中にも段差がある地図：木・岩・段差をどけて、場所を作る */const can=(x,y)=>{for(let b=0;b<6;b++)for(let c=0;c<8;c++){const k=(y+b)*W+x+c;if((S.fog&&S.fog[k])||sacredNoBuild(k)||S.floor[k]||S.obj[k]==='statueb'||S.obj[k]==='part')return false}return true};for(let y=CY-12;y<CY+20&&!q;y++)for(let x=CX-14;x<CX+14;x++)if(can(x,y)){q=[x,y];break}for(let b=0;b<6;b++)for(let c=0;c<8;c++){const k=(q[1]+b)*W+q[0]+c;S.obj[k]='';delete S.dyn[k];S.ground[k]=0;if(S.hi)S.hi[k]=0}}const j=q[1]*W+q[0];S.obj[j]='statue';S.obj[j+2]='board';S.obj[j+3]='part';S.ref[j+3]=j+2;recount()}
    S.quest=qsIx('path');S.qTalked=true;
    for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='wbench'||S.obj[j]==='crate'){S.obj[j]='';delete S.dyn[j]}
    const free=j=>!S.obj[j]&&!S.ground[j]&&!S.floor[j]&&!hiAt(j)&&walk(j)&&!(S.fog&&S.fog[j])&&!sacredNoBuild(j);let p=-1;/* 御神木のまわり（物をおけない所）はさける。左は2マス：木箱の左に作業台（2マス）が置けるか見るので */
    const G=bfs(a.x|0,a.y|0);for(let y=CY-20;y<CY+24&&p<0;y++)for(let x=CX-24;x<CX+12;x++){const j=y*W+x;let ok=true;for(let b=-1;b<=1&&ok;b++)for(let c=-2;c<=12;c++)if(!free(j+b*W+c)||G.dist[j+b*W+c]<0){ok=false;break}if(ok){p=j;break}}
    if(p<0){/* 空き地がない地図：木・岩などをどけて、場所を作る */const keep=new Set(['statue','statueb','board','obox','part']),can=j=>!(S.fog&&S.fog[j])&&!sacredNoBuild(j)&&!S.floor[j]&&!keep.has(S.obj[j]);for(let y=CY-10;y<CY+14&&p<0;y++)for(let x=CX-14;x<CX+2;x++){const j=y*W+x;let ok=true;for(let b=-1;b<=1&&ok;b++)for(let c=-2;c<=12;c++)if(!can(j+b*W+c)){ok=false;break}if(ok){p=j;break}}
      if(p>=0){for(let b=-1;b<=1;b++)for(let c=-2;c<=12;c++){const k=p+b*W+c;S.obj[k]='';delete S.dyn[k];S.ground[k]=0;if(S.hi)S.hi[k]=0}recount()}}
    window.P=p;S.obj[p]='crate';recount();for(const k of Object.keys(S.mat))S.mat[k]=0;S.mat.wood=40;S.mat.stone=20;boxSync();
    S.pt=999;S.recipes.chair=1;S.unlocked.chair=1;S.recipes.wbench=1;S.unlocked.wbench=1;S.lv=Math.max(S.lv||1,5);S.orders=[];
    return JSON.stringify({p,box:BOX()[p],need:BL.chair.mat})})()`));
  console.log(JSON.stringify(st));assert.ok(st.p>=0);assert.equal(st.box.wood,40,'木箱に素材');
  const step=n=>`(()=>{const a=S.res[0];for(let i=0;i<${n}&&S.orders.length;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}return 1})()`;
  /* 作業台がないと作らない */
  const nb=JSON.parse(await run(`(()=>{orderFurn('chair');${step(4000)};const o=S.orders[0];openSheet('craft');const t=[...document.querySelectorAll('.paper small')].map(e=>e.textContent);closeSheet();return JSON.stringify({cs:o.cs,prog:o.prog,got:o.got,fetch:FETCH,t})})()`));
  console.log(JSON.stringify(nb));assert.ok(nb.cs==null);assert.equal(nb.prog,0,'作業台がないと作らない');assert.equal(nb.fetch,0,'素材も運ばない');assert.ok(nb.t.includes('作業台がありません'));
  /* 木箱のとなりに作業台：運ばずに作る */
  const adj=JSON.parse(await run(`(()=>{const b=P+1,w0=BOX()[P].wood;wbenchAt(S,b,0);recount();wbenchTick();const o=S.orders[0];const cs=o.cs,bx=benchBoxes(cs);${step(40000)};yardTick();
    return JSON.stringify({cs,b,bx,left:S.orders.length,fetch:FETCH,yard:S.obj.includes('matyard'),wood:BOX()[P].wood,w0,inv:S.inv.chair||0,bench:S.obj[b],ord:S.dyn[b]&&S.dyn[b].order})})()`));
  console.log(JSON.stringify(adj));assert.equal(adj.cs,adj.b,'空いた作業台をわりあてる');assert.deepEqual(adj.bx,[st.p]);assert.equal(adj.left,0,'できた');
  assert.equal(adj.fetch,0,'となりの木箱の素材は運ばない');assert.equal(adj.yard,false,'材料置き場も出さない');assert.equal(adj.w0,40);assert.equal(adj.wood,adj.w0-st.need.wood,'となりの木箱からへる');assert.equal(adj.bench,'wbench','作業台はのこる');assert.equal(adj.ord,undefined);
  /* となりの木箱にない分だけ、ほかの箱から運ぶ */
  const part=JSON.parse(await run(`(()=>{const far=P+11;S.obj[far]='crate';recount();boxSync();const B=BOX();B[far]={wood:B[P].wood};delete B[P].wood;boxSync();FETCH=0;window.FT=[];{const e=ACT.bfetch.end;ACT.bfetch.end=(r,a)=>{FT.push(boxIdOf(a.box));return e(r,a)}}
    const nd=BL.chair.mat;window.AL=[];orderFurn('chair');{const a=S.res[0];for(let i=0;i<40000&&S.orders.length;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;const t=a.act&&a.act.type;if(t&&AL[AL.length-1]!==t)AL.push(t)}}return JSON.stringify({AL,far,nd,left:S.orders.length,ft:[...new Set(FT)],B:B[P],F:B[far]})})()`));
  console.log(JSON.stringify(part));assert.equal(part.left,0);assert.ok(part.ft.every(j=>j!==st.p),'となりの箱からは運ばない');assert.ok(part.ft.length===0||part.ft.every(j=>j===part.far),'ない分は、ほかの箱から運ぶ');
  /* 箱のとなりの作業台と、箱のない作業台：箱のない作業台の依頼は、素材を運ぶ（となりに箱のある作業台があっても、ほかの作業台は運ばずにすまない） */
  const mix=JSON.parse(await run(`(()=>{const far=P+11;bput(P,'wood',btake(far,'wood',999));boxSync();const nb=P+5;wbenchAt(S,nb,0);recount();FT=[];orderFurn('chair');orderFurn('chair');wbenchTick();
    const L=S.orders.map(o=>({cs:o.cs,bx:benchBoxes(o.cs),left:benchLeft(o),bid:'o'+o.id}));{const a=S.res[0];for(let i=0;i<60000&&S.orders.length;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}}
    const r=JSON.stringify({L,nb,left:S.orders.length,ft:FT});clearObj(nb);recount();return r})()`));
  console.log(JSON.stringify(mix));{const A=mix.L.find(o=>o.cs===st.p+1),N=mix.L.find(o=>o.cs===mix.nb);assert.ok(A&&N,'2つの作業台にわりあてる');assert.deepEqual(A.bx,[st.p]);assert.deepEqual(A.left,{},'箱のとなりの作業台は運ばない');
    assert.deepEqual(N.bx,[]);assert.ok(Object.keys(N.left).length>0,'箱のない作業台は運ぶ');assert.equal(mix.left,0);assert.ok(mix.ft.length>0&&mix.ft.every(f=>f===st.p),'運ぶのは、箱のない作業台の分だけ')}
  /* 作業台が2つ：依頼を2つ、いっしょに */
  const two=JSON.parse(await run(`(()=>{wbenchAt(S,P-2,0);recount();orderFurn('chair');orderFurn('chair');wbenchTick();const r=S.orders.map(o=>o.cs);const cs0=r[0];cancelOrder(S.orders[1].id);wbenchTick();
    const r0=S.rot[cs0];clearObj(cs0);recount();wbenchTick();const lost=S.orders[0].cs;wbenchAt(S,cs0,r0);recount();cancelOrder(S.orders[0].id);return JSON.stringify({r,lost})})()`));
  console.log(JSON.stringify(two));assert.equal(new Set(two.r).size,2,'作業台ごとに1つずつ');assert.ok(two.r.every(j=>j!=null));
  /* 作業台がないときの作業台の依頼は、地面で作る */
  const gnd=JSON.parse(await run(`(()=>{for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='wbench')clearObj(j);recount();S.mat.wood=40;S.mat.stone=20;boxSync();orderFurn('wbench');wbenchTick();const g=!!S.orders[0].gnd;window.AL=[];{const a=S.res[0];for(let i=0;i<40000&&S.orders.length;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;const t=a.act&&a.act.type;if(t&&AL[AL.length-1]!==t)AL.push(t)}}return JSON.stringify({AL:AL.slice(0,30),o:S.orders[0],g,left:S.orders.length,inv:S.inv.wbench||0})})()`));
  console.log(JSON.stringify(gnd));assert.equal(gnd.g,true);assert.equal(gnd.left,0,'作業台の依頼は、作業台がなくても作れる');
  /* 置くとき：木箱のとなりを光らせる */
  const hint=JSON.parse(await run(`(()=>{setMode('build');sel='wbench';const j=P;cam.z=2;cam.x=(j%W+.5)*TS-VW/cam.z/2;cam.y=((j/W|0)+.5)*TS-VH/cam.z/2;USERPAUSE=true;return JSON.stringify({})})()`));
  await page.waitForTimeout(700);const hl=JSON.parse(await run(`JSON.stringify(WBHINT.L)`));console.log('hint',hl.length,hl.slice(0,6));
  assert.ok(hl.includes(st.p+1)&&hl.includes(st.p-1),'木箱のとなりの置けるマス');if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/wbench-hint.png'});
  await run(`setMode('look');1`);
  /* 古いセーブ：ベッドの目標のとちゅう（足す前の番号 5）→ ベッドのまま、作業台を1つもらう */
  const old=JSON.parse(await run(`(()=>{for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='wbench')clearObj(j);delete S.inv.wbench;delete S.recipes.wbench;S.orders=[];
    const s=JSON.parse(JSON.stringify(S));delete s.flags.wbIns1;delete s.flags.wbFurn1;s.quest=5;s.qTalked=true;s.qStory=null;continueGame(s);
    const r={q:QUESTS[S.quest].id,ix:qsIx('wbench'),inv:S.inv.wbench||0,rec:!!S.recipes.wbench};
    const s2=JSON.parse(JSON.stringify(S));delete s2.flags.wbIns1;delete s2.flags.wbFurn1;s2.quest=5;s2.qStory=4;s2.qTalked=false;delete s2.inv.wbench;continueGame(s2);r.q2=QUESTS[S.quest].id;r.inv2=S.inv.wbench||0;
    const s3=JSON.parse(JSON.stringify(S));continueGame(s3);r.q3=QUESTS[S.quest].id;
    const s4=JSON.parse(JSON.stringify(S));s4.obj[P+1]='wbench';s4.dyn[P+1]={};delete s4.flags.wbYard1;continueGame(s4);r.two=[S.obj[P+1],S.obj[P+2],S.ref[P+2]===P+1];
    for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='wbench')clearObj(j);const n0=S.inv.wbench||0,s5=JSON.parse(JSON.stringify(S));s5.obj[P+1]='wbench';s5.dyn[P+1]={};s5.obj[P+2]='crate';s5.obj[P+1-W]='rock';s5.obj[P+1+W]='rock';delete s5.flags.wbYard1;continueGame(s5);r.back=[S.obj[P+1],(S.inv.wbench||0)-n0];
    return JSON.stringify(r)})()`));
  console.log(JSON.stringify(old));assert.deepEqual(old,{q:'bed',ix:5,inv:1,rec:true,q2:'wbench',inv2:0,q3:'wbench',two:['wbench','part',true],back:['',1]},'古いセーブ：番号をずらす・2回読んでもずれない・1マスの作業台は2マスに（空きがなければ、もちものへ）');
  assert.deepEqual(errors,[],'エラーなし');console.log('ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
