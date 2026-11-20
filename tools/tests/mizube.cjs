/* 水のステージ（霧のみずべの村・試作）：水門・水の流れ（同じ高さか低いほうへ・水門1つで40マス）・霧・船着き場と小舟の荷はこび・川くだり・しずんだ宝箱・ほかの土地からのお返し */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:3});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;S.t=1440+600;`);
  /* 1. はじめ：ミオがいて、まん中は晴れ、遠くは霧。水門は3つともこわれている */
  const a=await J(`{wd:WD,mio:S.res[0].name,el:S.res[0].elem,mid:fogAt(CY*W+CX),far:fogAt(5*W+5),gates:S.mz.gates.map(g=>S.obj[g.j]),gy:(S.mz.gates[1].j/W)|0,gx:S.mz.gates[1].j%W,hg:hiAt(S.mz.gates[1].j),hv:hiAt(CY*W+CX),walkFar:walk(5*W+5)}`);
  assert.equal(a.wd,3);assert.equal(a.mio,'ミオ');assert.equal(a.el,'water');assert.equal(a.mid,false);assert.equal(a.far,true);assert.equal(a.walkFar,false,'the mist cannot be walked');
  assert.deepEqual(a.gates,['mzgateb','mzgateb','mzgateb']);assert.equal(a.hg,2);assert.equal(a.hv,0);
  console.log('Mizube: Mio, the mist and three broken gates are there');
  /* 2. 水門をひらく前は、水路に水がとどかない。ひらくと、40マスまでとどく */
  /* 水路 P：水門から南へ2マス、東へ9マス、そのあと南へ（神殿・木箱をよける）。ぜんぶで45マス */
  await run(`(()=>{const g=S.mz.gates[1].j,P=[g+W,g+2*W];for(let k=1;k<=9;k++)P.push(g+2*W+k);for(let k=1;P.length<45;k++)P.push(g+2*W+9+k*W);window.__P=P;for(const j of P){S.obj[j]='';S.floor[j]='';delete S.dyn[j];S.mz.cn[j]=1}recount()})()`);
  assert.equal(await J(`MZC.wetN`),0,'no water before a gate is open');
  await run(`mzGateOpen(S.mz.gates[1].j,S.res[0])`);
  const b=await J(`(()=>{const P=__P;return {n:MZC.wetN,g40:S.ground[P[39]],g41:S.ground[P[40]],used:MZC.used[1],h1:hiAt(P[0]),h40:hiAt(P[39]),mist:fogAt(P[20]+4),mist2:fogAt(P[20]+9)}})()`);
  assert.equal(b.n,40);assert.equal(b.g40,2,'the 40th cell is wet (shallow)');assert.equal(b.g41,0,'the 41st cell is dry');assert.equal(b.used,40);assert.equal(b.h1,2);assert.equal(b.h40,0);
  assert.equal(b.mist,false,'4 cells from the water are clear');assert.equal(b.mist2,true,'9 cells away is still mist');
  console.log('Mizube: one open gate wets 40 canal cells and clears the mist 4 cells around');
  /* 3. 水は、高いほうへは流れない */
  const c=await J(`(()=>{const P=__P;for(let k=40;k<45;k++)delete S.mz.cn[P[k]];let i=10;while(hiAt(P[i+1])===2)i++;const low=P[i+1]+2,up=P[i]+2;for(const k of[low-1,low,up]){S.obj[k]='';S.mz.cn[k]=1}recount();/* up は、低い low からしかつながらない */return {hl:hiAt(low),hu:hiAt(up),wl:MZC.wet[low],wu:MZC.wet[up]}})()`);
  assert.equal(c.hl,1);assert.equal(c.hu,2);assert.equal(c.wl,1,'the branch on the lower step is wet');assert.equal(c.wu,0,'water does not climb to the higher step');
  console.log('Mizube: water does not flow uphill');
  /* 4. 船着き場2つが水でつながると小舟が行き来し、荷をはこぶ */
  const d=await J(`(()=>{const a=__P[28]+1,b=__P[33]+1;for(const j of[a,b,a+1,b+1]){S.obj[j]='';S.floor[j]='';delete S.dyn[j]}S.obj[a]='dock';S.obj[b]='dock';S.obj[a+1]='crate';S.obj[b+1]='crate';recount();
    S.mat.wood=0;boxSync();const got=boxIn(a+1,'wood',30);S.mz.send[a]={k:'wood',to:b};for(let i=0;i<600;i++)mzTick(.5);
    return {comps:MZC.comps.length,lane:!!MZLANE,got,atB:boxHas(b+1,'wood'),atA:boxHas(a+1,'wood'),wood:S.mat.wood}})()`);
  assert.equal(d.comps,1);assert.equal(d.lane,true);assert.equal(d.got,30);assert.ok(d.atB>=20,'the boat carried wood to the other dock: '+JSON.stringify(d));assert.equal(d.atA+d.atB,30);assert.equal(d.wood,30);
  console.log('Mizube: two docks joined by water get a boat that carries goods');
  /* 5. 舟の道は、歩くより安い（道さがし） */
  const e=await J(`{lane:MZLANE[__P[30]],off:MZLANE[__P[20]]}`);assert.equal(e.off,0);assert.equal(e.lane,1);
  /* 6. 川くだり：たのしさ20、コース10マスごとに+5、段差を1だん下るごとに+5（+30まで） */
  const f=await J(`(()=>{const g=S.mz.gates[1].j,j=g+2*W-1;S.obj[j]='raft';recount();const C=mzCourse(j);let dr=0;for(let i=1;i<C.length;i++)if(hiAt(C[i])<hiAt(C[i-1]))dr++;return {len:C.length,dr,fun:mzRaftFun(j)}})()`);
  assert.ok(f.len>=30,'the course follows the canal downstream: '+f.len);assert.equal(f.dr,2);assert.equal(f.fun,20+Math.min(30,Math.floor(f.len/10)*5+f.dr*5));
  console.log('Mizube: rafting fun comes from the course length and the drops');
  /* 7. 水門をひらくと、宝箱のまわりが浅瀬になり、あけられる */
  const h=await J(`(()=>{const c=S.mz.chests,g0=S.ground[c[0].j],g1=S.ground[c[1].j];mzChestOpen(c[0].j,S.res[0]);return {g0,g1,got:c[0].got,obj:S.obj[c[0].j],fk:S.fukuro||0}})()`);
  assert.equal(h.g0,2);assert.equal(h.g1,1,'the second chest is still under water');assert.equal(h.got,1);assert.equal(h.obj,'');assert.equal(h.fk,1);
  console.log('Mizube: the first sunken chest opens after one gate');
  /* 8. ほかの土地へおくった素材のお返しが、朝にとどく */
  const t=await J(`(()=>{const a0=S.fs.apple||0,b0=S.mat.bamboo||0;S.mz.trade.push({w:0},{w:1});mzMorning();return {a:(S.fs.apple||0)-a0,b:(S.mat.bamboo||0)-b0,left:S.mz.trade.length}})()`);
  assert.deepEqual(t,{a:3,b:5,left:0});
  console.log('Mizube: gifts from the other lands arrive in the morning');
  /* 9. じっさいの遊び方：霧の中の水門はタップできない。水路で霧を晴らしてからタップすると、せいれいが直しにいく。「水路をほる」は、せいれいの工事 */
  const p1=await J(`(()=>{const g0=S.mz.gates[0].j;mzTap(g0%W,(g0/W)|0);return {mist:fogAt(g0),req:S.mz.req.length}})()`);assert.deepEqual(p1,{mist:true,req:0});
  const noon=`if(hour()>=17||hour()<7)S.t=Math.floor(S.t/DAYLEN)*DAYLEN+DAYLEN*10/24;`;/* 夜にならないように、夕方になったら、その日の10時へ（毎コマもどすと、時計で待つ動きが終わらない） */
  await run(`templeRuinTap(RUINT)`);for(let k=0;k<40&&!(await J(`STATUE>=0`));k++)await run(`(()=>{${noon}S.res[0].hunger=500;S.res[0].energy=100;for(let i=0;i<200&&STATUE<0;i++)stepWorld(.25)})()`);
  assert.equal(await J(`STATUE>=0`),true,'the temple is repaired first');
  /* お礼の会話を読みおえる（読むまで、せいれいは待っている）。もうできている目標（水門・水路・船着き場・いかだ・宝箱）も、会話を読むたびに1つずつ進む */
  for(let i=0;i<120&&await J(`S.quest`)<6;i++){await page.waitForTimeout(300);/* 会話と会話のあいだは、3秒まつ（DLGWAIT） */await run(`(()=>{${noon}for(let k=0;k<40;k++)stepWorld(.25);if(document.querySelector('#dialog').hidden)startTalk()})()`);for(let k=0;k<40&&!(await J(`document.querySelector('#dialog').hidden`));k++){await run(`(()=>{const b=document.querySelector('#dlgBtns .btn[data-nx]')||document.querySelector('#dlgBtns button');if(b)b.click()})()`);await page.waitForTimeout(120)}}
  for(let k=0;k<60&&!(await J(`document.querySelector('#dialog').hidden&&!DLGQ.length`));k++){await run(`(()=>{const b=document.querySelector('#dlgBtns .btn[data-nx]')||document.querySelector('#dlgBtns button');if(b)b.click()})()`);await page.waitForTimeout(150)}/* さいごの会話をとじる */
  assert.equal(await J(`S.quest`),6,'the goals that are already met (gate, flow, docks, raft, chest) pass one by one after their talks');
  console.log('Mizube: the goals advance through their talks');
  const p2=await J(`(()=>{const g=S.mz.gates[1].j,g0=S.mz.gates[0].j;for(let k=1;k<=5;k++){const j=g+W-k;S.obj[j]='';S.mz.cn[j]=1}recount();mzTap(g0%W,(g0/W)|0);const pt=S.pt,cj=g+W-6;S.obj[cj]='';sel='canal';place('canal',cj%W,(cj/W)|0);
    return {mist:fogAt(g0),req:S.mz.req.length,site:S.obj[cj],paid:pt-S.pt,cj}})()`);
  assert.equal(p2.mist,false);assert.equal(p2.req,1);assert.equal(p2.site,'site');assert.equal(p2.paid,5);
  const pop=async()=>{await run(`(()=>{const b=document.querySelector('.idea-reveal button');if(b){b.disabled=false;b.click()}})()`);await page.waitForTimeout(250)};/* 知らせの画面（あたらしいレシピ など）は時間を止めるので、待ちながらとじる */
  let p3=null;for(let k=0;k<60;k++){await pop();p3=await J(`(()=>{${noon}S.res[0].hunger=500;S.res[0].energy=100;for(let i=0;i<200&&!(S.mz.gates[0].open&&S.mz.cn[${p2.cj}]);i++){stepWorld(.25)}return {open:S.mz.gates[0].open,canal:!!S.mz.cn[${p2.cj}],obj:S.obj[S.mz.gates[0].j],n:mzOpenN(),g1:S.ground[S.mz.chests[1].j]}})()`);if(p3.open&&p3.canal)break}
  assert.equal(p3.open,1,'the spirit repaired the gate');assert.equal(p3.canal,true,'the spirit dug the canal');assert.equal(p3.obj,'mzgate');assert.equal(p3.g1,2,'two open gates uncover the second chest');
  console.log('Mizube: a spirit opens a tapped gate and digs a canal');
  /* 10. 川くだり：せいれいが、コースを下って、たのしさがふえる */
  await pop();await pop();
  const p4=await J(`(()=>{const r=S.res[0],g=S.mz.gates[1].j,raft=g+2*W-1,f=mzRaftFun(raft),C=mzCourse(raft),st=raft-W;endAct(r);r.x=st%W+.5;r.y=((st/W)|0)+.5;r.path=[];r.fun=10;r.hunger=500;r.energy=100;
    S.t=Math.floor(S.t/DAYLEN)*DAYLEN+DAYLEN*10/24;startAct(r,roadSearch(r.x|0,r.y|0),'mzraft',st,{key:'o'+raft,obj:raft,what:'raft',fun:f,dur:50,pt:5,pw:2});let rode=false;for(let i=0;i<800&&r.act&&r.act.type==='mzraft';i++){stepWorld(.25);{const b=document.querySelector('.idea-reveal button');if(b){b.disabled=false;b.click()}}if(r.act&&r.act.type==='mzraft'&&r.act.cs)rode=true}
    const end=C[C.length-1];return {rode,fun:Math.round(r.fun),f,at:Math.abs(r.x-(end%W+.5))<1.5&&Math.abs(r.y-(((end/W)|0)+.5))<1.5,toy:!!r.lastToy}})()`);
  assert.equal(p4.rode,true);assert.ok(p4.f>=40,'the longest course is used: '+p4.f);assert.ok(p4.fun>=10+p4.f-5,'fun went up by the rafting fun: '+JSON.stringify(p4));assert.equal(p4.toy,true);
  console.log('Mizube: a spirit rides the raft down the canal');
  /* 11. セーブして読みこんでも、水のとどき方・ひらいた水門・晴れた所は、そのまま */
  const sv=await J(`(()=>{const a=[MZC.wetN,mzOpenN(),S.mz.clr.reduce((n,v)=>n+v,0)];const ok=save();LIVE[3]=null;continueGame(load(3));return {ok,a,b:[MZC.wetN,mzOpenN(),S.mz.clr.reduce((n,v)=>n+v,0)],wd:WD,far:fogAt(5*W+5)}})()`);
  assert.equal(sv.ok,true);assert.deepEqual(sv.b,sv.a);assert.equal(sv.wd,3);assert.equal(sv.far,true);
  console.log('Mizube: the canals, gates and cleared mist survive save and load');
  /* 12. 水路と池のあたりを映して、しばらく動かしても、エラーが出ない */
  await run(`centerOn(CX*TS,(CY-30)*TS)`);await page.waitForTimeout(1500);await run(`centerOn(CX*TS,(CY-2)*TS)`);await page.waitForTimeout(1500);
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
