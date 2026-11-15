/* 強化のイベント：ひらく → つぎの日に集まってする → さいごまでいた子の能力がふえる。夜・コワイノでつぎの日に。やめたらもどる。1季節に1回 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=true;S.enemies=[];NOSAVE=true;
    for(const el of ['wood','earth','water','wind'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=60}
    S.pt=2000;for(let i=0;i<60;i++)addFood('apple',1);`);
  /* 1日すすめる（せいれいの動き・世界） */
  const sim=(clockMin,stopIf)=>run(`(()=>{const end=S.t+${clockMin};let n=0;while(S.t<end&&n<40000){stepWorld(1.5);for(const r of S.res){updRes(r,1.5);r.hunger=Math.max(r.hunger,800);r.energy=Math.max(r.energy,80)}S.enemies=[];n++;${stopIf?'if('+stopIf+')break;':''}}return n})()`);
  const day=d=>`S.t=(${d}-1)*1440`;
  const go=async(id,n,needs)=>{
    const o=JSON.parse(await run(`(()=>{${day(3)}+12*60;${needs||''}recount();const who=S.res.slice(0,${n||99}).map(r=>r.id);const pt=S.pt,f=S.food;const ok=evOpen('${id}',who);return JSON.stringify({ok,pt:pt-S.pt,f:f-S.food,ev:!!S.ev,day:S.ev&&S.ev.day})})()`));
    assert.ok(o.ok&&o.ev,id+' opened');assert.equal(o.day,4);
    await run(`${day(4)}+EVENTS['${id}'].at*60-5`);
    await sim(60*8,'!S.ev');
    const r=JSON.parse(await run(`JSON.stringify({ev:S.ev,est:S.res.map(r=>r.est||{}),memo:(S.memo||[]).map(m=>m[2]).filter(t=>t.includes(EVENTS['${id}'].n))})`));
    assert.equal(r.ev,null,id+' finished: '+JSON.stringify(r.ev));assert.ok(r.memo.length,id+' memo');
    const g=await run(`JSON.stringify(EVENTS['${id}'].gain)`);console.log(id,'paid',o,'est',JSON.stringify(r.est),'gain',g);return r};
  const base=await run(`JSON.stringify(S.res.map(r=>Math.round(rMul(r,'move')*100)))`);
  await go('taiso',0);
  const a=await go('oni',3);assert.ok(a.est.slice(0,3).every(e=>e.move>=5),'oni gives move');
  const after=JSON.parse(await run(`JSON.stringify(S.res.map(r=>Math.round(rMul(r,'move')*100)))`));assert.ok(after[0]>=JSON.parse(base)[0]+5,'rMul uses est');
  await go('ensoku',4);
  await go('gochi',2,"{const j=(CY+5)*W+CX-6;S.obj[j]='table';S.obj[j+1]='part';S.ref[j+1]=j;}");
  await go('soji',0,"for(let i=0;i<6;i++){const j=(CY+4)*W+CX+4+i;if(!S.obj[j])S.obj[j]='weed0g'}");
  /* 同じ季節に2回はひらけない */
  assert.equal(await run(`(${day(4)}+12*60,!!evOpen('oni',[S.res[0].id]))`),false,'once per season');
  /* やめたらもどる */
  const c=JSON.parse(await run(`(()=>{${day(9)}+10*60;const p=S.pt,f=S.food;evOpen('gochi',[S.res[0].id]);const p1=S.pt;evCancel();return JSON.stringify({back:S.pt===p&&S.food===f,paid:p-p1,ev:S.ev})})()`));
  assert.ok(c.back&&c.paid===58&&c.ev===null,'cancel refunds '+JSON.stringify(c));
  /* とちゅうで暗くなったら、つぎの日に */
  const d=JSON.parse(await run(`(()=>{${day(9)}+12*60;evOpen('oni',S.res.slice(0,2).map(r=>r.id));${day(10)}+13*60;evTick();const ph=S.ev.ph;S.t=(10-1)*1440+21*60+5;evTick();return JSON.stringify({ph,after:S.ev.ph,day:S.ev.day})})()`));
  assert.equal(d.ph,'go');assert.equal(d.after,null);assert.equal(d.day,11);
  /* 上限 */
  const cap=await run(`(()=>{const r=S.res[0];r.est={move:58};const D=EVENTS.oni;S.ev={id:'oni',who:[r.id],ph:'do',t0:S.t,at:{[r.id]:1},got:{},backed:[],paid:{pt:0,food:[]}};evEnd();return r.est.move})()`);assert.equal(cap,60,'capped at 60');
  /* 画面 */
  await run(`S.ev=null;${day(16)}+10*60;openSheet('craft')`);await page.waitForTimeout(300);await run(`document.querySelector('#evBtn').click()`);await page.waitForTimeout(400);
  const rows=await run(`document.querySelectorAll('#sheetBody .row').length`);assert.ok(rows>=5,'event rows '+rows);
  await run(`document.querySelector('#sheetBody .row .btn.pri').click()`);await page.waitForTimeout(300);
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/event-pop.png'});
  await run(`document.querySelector('.pxcard .go').click()`);await page.waitForTimeout(300);
  assert.ok(await run(`!!S.ev&&S.ev.id==='taiso'`),'opened from popup');
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/event-sheet.png'});
  const rad=await run(`[...document.querySelectorAll('*')].filter(e=>parseFloat(getComputedStyle(e).borderRadius)>0).length`);assert.equal(rad,0);
  await page.waitForTimeout(500);assert.deepEqual(errors,[]);await browser.close();console.log('Events: ok');
})().catch(e=>{console.error(e);process.exit(1)});
