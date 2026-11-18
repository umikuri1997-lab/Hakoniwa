/* 村のしごと一覧（メニューの「しごと」）と、得意な仕事（★）を先にえらぶこと：こまっている子が上・わけ・得意・タップでその子を映す */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();NOSAVE=true;S.enemies=[];S.t=12*60;
    for(const el of ['fire','water'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90}`);
  /* わけ */
  const w=JSON.parse(await run(`(()=>{const[a,b,c]=S.res;a.hunger=100;endAct(a);a.act={type:'chop',stage:'do'};b.stk={t:S.t,n:'木箱'};c.act={type:'wander'};const o=[workWhy(a),workWhy(b),workWhy(c)];b.stk.t=S.t-999;o.push(workWhy(b));return JSON.stringify(o)})()`));
  assert.deepEqual(w[0],['おなかがすいている',2]);assert.deepEqual(w[1],['木箱へ行けません',2]);assert.deepEqual(w[2],['することがない',1]);assert.notEqual(w[3][0],'木箱へ行けません','old mark expires');
  /* 一覧：こまっている子が上 */
  await run(`(()=>{const[a,b,c]=S.res;a.hunger=hMax(a);a.act={type:'chop',stage:'do'};delete b.stk;b.act={type:'chop',stage:'do'};c.hunger=100;c.act={type:'chop',stage:'do'}})()`);
  await run(`openSheet('menu','work')`);await page.waitForTimeout(400);
  const L=JSON.parse(await run(`JSON.stringify([...document.querySelectorAll('#sheetBody .rows .row')].map(r=>r.textContent))`));
  assert.equal(L.length,3);assert.ok(L[0].includes('twater')&&L[0].includes('おなかがすいている'),L[0]);assert.ok(L.every(t=>t.includes('得意：')),'tokui on rows');
  await run(`document.querySelectorAll('#sheetBody .rows .row')[0].click()`);await page.waitForTimeout(300);
  const cl=JSON.parse(await run(`JSON.stringify({open:!!sheet,cam:!!camAnim&&Math.abs(camAnim.tx-S.res[2].x*TS)<1})`));
  assert.equal(cl.open,false,'sheet closes');assert.equal(cl.cam,true,'camera goes to the spirit');
  /* 得意な仕事を先に：木を切る・石をほるは、★の多いほうから（近くの雑草・落とし物がないとき） */
  const j=JSON.parse(await run(`(()=>{const r=S.res[1];r.vr.tk=['ishi'];r.jc={};delete r.ttl;r.hunger=hMax(r);r.energy=100;r.fun=90;r.cing=null;endAct(r);r.act=null;{let k=-1;for(let d=2;d<12&&k<0;d++)for(let x=-d;x<=d&&k<0;x++){const q=(CY+d)*W+CX+x;if(!S.obj[q]&&!S.floor[q]&&S.ground[q]!==1&&walk(q))k=q}S.obj[k]='crate'}S.mat.wood=50;S.mat.stone=100;S.oracle=null;for(let q=0;q<S.obj.length;q++)if(WEEDS.has(S.obj[q])||S.obj[q]==='kinoko')S.obj[q]='';S.drops=[];for(let i=0;i<60;i++)addFood('apple',1);recount();const G=bfs((r.x|0),(r.y|0));goWork(r,G,true);const t1=r.act&&r.act.type;endAct(r);r.act=null;r.vr.tk=['kikori'];r.jc={ishi:0};goWork(r,G,true);const t2=r.act&&r.act.type;endAct(r);r.act=null;return JSON.stringify({t1,t2})})()`));
  assert.equal(j.t1,'mine','star mine first: '+JSON.stringify(j));assert.equal(j.t2,'chop','star chop first: '+JSON.stringify(j));
  console.log('work list ok',JSON.stringify(j));
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
