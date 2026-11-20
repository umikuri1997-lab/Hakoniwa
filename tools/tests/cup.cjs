/* 大会（cup.js）：依頼ボードからどの季節でもひらける（パワー30・同じ大会は季節に1回）。はじまりの合図 → 大会 → 表彰台。
   ものづくり・料理は作った物、木こり・釣り・採掘はとれた物を、せいれいが頭にのせてはこぶ。応援のミニゲーム（大会ごとにちがう遊び）の点で、応援した子の記録がよくなる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=false;S.enemies=[];NOSAVE=true;
    for(const el of ['wood','earth','water','wind'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=60;r.nap=false}
    for(let i=0;i<5;i++){S.obj[(CY-6)*W+CX-8+i*2]='tree';S.obj[(CY-6)*W+CX+4+i*2]='rock'}for(let y=CY+7;y<CY+10;y++)for(let x=CX-4;x<CX+4;x++){S.obj[y*W+x]='';S.ground[y*W+x]=1}
    S.recipes.stool=true;S.recipes.chair=true;S.pt=5000;for(let i=0;i<40;i++)addFood('apple',1);S.t=12*60;recount();`);
  const sim=(clockMin,stopIf)=>run(`(()=>{const end=S.t+${clockMin};let n=0;while(S.t<end&&n<40000){stepWorld(1.5);for(const r of S.res){updRes(r,1.5);r.hunger=Math.max(r.hunger,400);r.energy=Math.max(r.energy,80)}S.enemies=[];n++;${stopIf?'if('+stopIf+')break;':''}}return n})()`);
  const to=(d,h)=>run(`(()=>{const t=(${d}-1)*1440+(${h})*60;if(t>S.t)S.t=t;return dayNo()})()`);
  /* 1. ミニゲーム：うまくできたほど k が大きい（すべての大会） */
  const mg=JSON.parse(await run(`(()=>{const o={};for(const id of CUPIDS){const M=CUPMG[id];const good={},bad={};M.init(good);M.init(bad);
      const g=document.createElement('canvas').getContext('2d');let t=0;for(let i=0;i<500;i++){t+=.02;if(M.tick){M.tick(good,.02,t);M.tick(bad,.02,t)}M.draw(g,good,t);
        if(id==='cup0'&&i%3===0)M.tap(good,t);
        if(id==='cup1'&&Math.abs(Math.sin(t*3.4))<.03)M.tap(good,t);
        if(id==='cup2'&&Math.abs(t-Math.round(t/.7)*.7)<.011)M.tap(good,t);
        if(id==='cup3'&&(t-good.t0)/1.6>.84&&(t-good.t0)/1.6<.86)M.tap(good,t);
        if(id==='cup4'){if(good.h<.5+Math.sin(t*.9)*.18)M.down(good,t);else M.up(good,t)}
        if(id==='cup5'&&Math.sin(t*4.2)>.995)M.tap(good,t);
        if(id==='cup6'&&t>=good.bite+.1&&t<good.bite+.13)M.tap(good,t);
        if(id==='cup7'&&good.on>=0){const P=MGROCK[good.on];M.tap(good,t,P[0],P[1])}}
      o[id]=[Math.round(M.k(good)*100),Math.round(M.k(bad)*100)]}return JSON.stringify(o)})()`));
  console.log('minigame good/none',mg);for(const id in mg){assert.ok(mg[id][0]>=60,id+' good play '+mg[id]);assert.ok(mg[id][1]<=10,id+' no play '+mg[id])}
  /* 2. 応援がうまくいった子の記録がよくなる */
  assert.deepEqual(JSON.parse(await run(`JSON.stringify((()=>{const E={id:'cup2',cheer:5,ck:1};return [cupBoost(E,5),cupBoost(E,6),cupBoost({id:'cup0',cheer:5,ck:0,mgLive:1},5)]})())`)),[1.4,1,1.35]);
  /* 3. ひらく：どの季節でも、パワー30。同じ大会は季節に1回 */
  for(const id of ['cup2','cup4','cup5','cup6','cup7','cup1']){
    let d=await run(`dayNo()`);await to(d,15);while(await run(`seasonDay(dayNo()+1)===CUPDAY`)){d=await run(`dayNo()`)+1;await to(d,15)}
    const o=JSON.parse(await run(`(()=>{recount();const pt=S.pt,mat=Object.assign({},S.mat),fs=Object.assign({},S.fs);const ok=evOpen('${id}',S.res.map(r=>r.id));return JSON.stringify({ok:!!ok,pt:pt-S.pt,day:S.ev&&S.ev.day,again:evWhy('${id}')})})()`));
    assert.ok(o.ok,id+' opened');assert.equal(await run(`evDoneOn('${id}',dayNo()+1)`),true,id+' once per season');assert.equal(o.pt,30,id+' costs 30');
    await to(o.day,`EVENTS['${id}'].at-0.1`);
    const st0=JSON.parse(await run(`JSON.stringify({mat:Object.assign({},S.mat),fs:Object.assign({},S.fs),inv:Object.assign({},S.inv),h:S.res.map(r=>heldN(r))})`));
    await sim(60*3,"S.ev&&S.ev.ph==='go'");const ask=await run(`!!document.getElementById('cupCheer')`);await run(`{const b=document.querySelector('#cupCheer .ks button');if(b)b.click()}`);
    await sim(60*10,"S.ev&&S.ev.ph==='do'");
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));/* 旗・合図・作品を描く */
    await sim(60*12,'!S.ev');
    const r=JSON.parse(await run(`JSON.stringify({ev:S.ev,memo:(S.memo||[]).map(m=>m[2]).filter(t=>t.includes(EVENTS['${id}'].n)),aw:!!CUPV.aw,h:S.res.map(r=>heldN(r)),mat:S.mat,fs:S.fs,inv:S.inv,made:S.res.map(r=>r.cmade?Object.keys(r.cmade).length:0)})`));
    console.log(id,'ask',ask,r.memo.join(' / '),'held',r.h.join(','));
    assert.ok(ask,id+' asks who to cheer');assert.equal(r.ev,null,id+' finished');assert.ok(r.memo.some(t=>t.includes('1位')),id+' podium');assert.ok(r.aw,id+' award shown');
    if(id!=='cup1')assert.ok(r.h.reduce((a,b)=>a+b,0)>st0.h.reduce((a,b)=>a+b,0)||JSON.stringify(r.mat)!==JSON.stringify(st0.mat)||JSON.stringify(r.fs)!==JSON.stringify(st0.fs)||JSON.stringify(r.inv)!==JSON.stringify(st0.inv),id+' got loot');
    await run(`{const e=document.getElementById('cupMG');if(e)e.remove();CUPV.mg=null;for(const r of S.res){r.cmat=null;r.carry=null;r.citem=null;r.cmade=null}}`);
  }
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
