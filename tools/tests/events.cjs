/* 強化のイベント：ひらく → つぎの日に集まってする → さいごまでいた子の能力がふえる。夜・コワイノでつぎの日に。やめたらもどる。1季節に1回。季節の大会。
   時間は前にだけすすめる（もどすと、せいれいの待ち時間がおかしくなる） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=true;S.enemies=[];NOSAVE=true;
    for(const el of ['wood','earth','water','wind'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=60}
    S.pt=5000;S.mat.wood=60;for(let i=0;i<99;i++)addFood('apple',1);S.t=12*60;`);
  const sim=(clockMin,stopIf)=>run(`(()=>{const end=S.t+${clockMin};let n=0;while(S.t<end&&n<40000){stepWorld(1.5);for(const r of S.res){updRes(r,1.5);r.hunger=Math.max(r.hunger,800);r.energy=Math.max(r.energy,80)}S.enemies=[];n++;${stopIf?'if('+stopIf+')break;':''}}return n})()`);
  /* 前へすすめる：d 日めの h 時（いまより前なら、なにもしない） */
  const to=(d,h)=>run(`(()=>{const t=(${d}-1)*1440+(${h})*60;if(t>S.t)S.t=t;return dayNo()})()`);
  const go=async(id,n,needs,minDay=0)=>{
    let d=await run(`dayNo()`);if(minDay&&d<minDay-1)d=minDay-1;await to(d,15);
    while(await run(`seasonDay(dayNo()+1)===CUPDAY`)){d=await run(`dayNo()`)+1;await to(d,15)}
    const o=JSON.parse(await run(`(()=>{${needs||''}recount();const who=S.res.slice(0,${n||99}).map(r=>r.id);const pt=S.pt,f=S.food;const ok=evOpen('${id}',who);return JSON.stringify({ok,pt:pt-S.pt,f:f-S.food,ev:!!S.ev,day:S.ev&&S.ev.day,now:dayNo()})})()`));
    assert.ok(o.ok&&o.ev,id+' opened '+JSON.stringify(o));
    const before=JSON.parse(await run(`JSON.stringify(S.res.map(r=>Object.assign({},r.est)))`));
    await to(o.day,`EVENTS['${id}'].at-0.1`);await sim(60*8,'!S.ev');
    const r=JSON.parse(await run(`JSON.stringify({ev:S.ev,est:S.res.map(r=>r.est||{}),memo:(S.memo||[]).map(m=>m[2]).filter(t=>t.includes(EVENTS['${id}'].n))})`));
    assert.equal(r.ev,null,id+' finished: '+JSON.stringify(r.ev));assert.ok(r.memo.length,id+' memo');
    const gain=r.est.map((e,i)=>{const o2={};for(const k in e)if(e[k]!==(before[i][k]||0))o2[k]=e[k]-(before[i][k]||0);return o2});
    console.log(id,'paid',o.pt,o.f,'gain',JSON.stringify(gain));return gain};
  const base=JSON.parse(await run(`JSON.stringify(S.res.map(r=>Math.round(rMul(r,'move')*100)))`));
  const t=await go('taiso',0);assert.ok(t.every(g=>g.sta===1),'taiso');
  assert.equal(await run(`!!evOpen('taiso',[S.res[0].id])`),false,'once per season');
  const a=await go('oni',3);assert.ok(a.slice(0,3).every(e=>e.move===1),'oni gives move');
  const after=JSON.parse(await run(`JSON.stringify(S.res.map(r=>Math.round(rMul(r,'move')*100)))`));assert.ok(after[0]>=base[0]+5,'rMul uses est');
  await go('ensoku',4);
  await go('gochi',2,"{const j=(CY+5)*W+CX-6;S.obj[j]='table';S.obj[j+1]='part';S.ref[j+1]=j;}");
  await go('soji',0,"for(let i=0;i<6;i++){const j=(CY+4)*W+CX+4+i;if(!S.obj[j])S.obj[j]='weed0g'}");
  const tk=await go('takara',4);assert.ok(tk.slice(0,4).every(g=>g.move>=1&&g.move<=2),'takara 1..2');
  await go('yomi',0,"{const j=(CY+6)*W+CX+6;S.obj[j]='shelf1';}");
  assert.equal(await run(`!!evOpen('mizu',[S.res[0].id])`),false,'summer only');
  await go('mizu',0,"{const j=(CY+6)*W+CX-8;S.obj[j]='fountain';for(const k of[j+1,j+W,j+W+1]){S.obj[k]='part';S.ref[k]=j}}",9);
  await go('camp',0,"{const j=(CY+7)*W+CX+2;S.obj[j]='campfire';}",9);
  const b0=await run(`(S.bond&&Object.values(S.bond).reduce((a,b)=>a+b,0))||0`);
  await go('cha',3,"{const j=(CY-6)*W+CX+6;(S.roof||(S.roof={}))[j]='gazebo';}",16);
  const b1=await run(`(S.bond&&Object.values(S.bond).reduce((a,b)=>a+b,0))||0`);assert.ok(b1>=b0+10,'tea raises bond '+b0+'→'+b1);
  await go('hoshi',0,'',23);
  assert.equal(await run(`evOn('onsen')`),false,'onsen is volcano only');
  /* 季節の大会：5日めの朝にきまり、みんなが出る。順位で上がる数がかわる。4日めには、5日めのイベントをひらけない */
  await to(32,12);assert.equal(await run(`(S.ev=null,evWhy('oni'))`),'あしたはかけっこ大会です');
  for(const [id,d] of [['cup0',33],['cup1',40],['cup2',47],['cup3',54]]){
    const before=JSON.parse(await run(`JSON.stringify(S.res.map(r=>Object.assign({},r.est)))`));
    await to(d,6.02);await run(`S.ev=null;evMorning();`);assert.equal(await run(`S.ev&&S.ev.id`),id,id+' scheduled');
    await sim(60*12,'!S.ev');
    const r=JSON.parse(await run(`JSON.stringify({ev:S.ev,est:S.res.map(r=>r.est||{}),memo:(S.memo||[]).map(m=>m[2]).filter(t=>t.startsWith(EVENTS['${id}'].n))})`));
    assert.equal(r.ev,null,id+' finished');assert.ok(r.memo.length&&r.memo[0].includes('1位'),id+' podium '+r.memo);
    const st=await run(`EVENTS['${id}'].stat`),R=JSON.parse(await run(`JSON.stringify(EVENTS['${id}'].rank)`)),gains=r.est.map((e,i)=>(e[st]||0)-(before[i][st]||0)).sort((a,b)=>b-a);
    console.log(id,r.memo[0],JSON.stringify(gains));
    assert.equal(gains[0],R[0],id+' 1st');assert.equal(gains.filter(g=>g>0).length,id==='cup3'?3:5,id+' every spirit placed '+gains)}
  /* 新しい家具のイベント（草原）：弓の的・ピクニックシート。村レベルでおぼえる */
  assert.deepEqual(JSON.parse(await run(`JSON.stringify([levelUpItemsAt(6).includes('mato'),levelUpItemsAt(5).includes('picnic'),levelUpItemsAt(6).includes('taiko')])`)),[true,true,false],'level rewards (taiko is volcano)');
  await run(`S.inv.arrow=(S.inv.arrow||0)+40`);const ar0=await run(`S.inv.arrow`);
  const mg=await go('matoate',3,"{const j=(CY+6)*W+CX+3;S.obj[j]='mato';}");assert.ok(mg.slice(0,3).every(g=>g.atk===5),'matoate atk+5');assert.equal(await run(`S.inv.arrow`),ar0-15,'arrows used');
  await go('pikunikku',0,"{const j=(CY+8)*W+CX-3;for(const k of[j,j+1,j+W,j+W+1])S.obj[k]=k===j?'picnic':'part';for(const k of[j+1,j+W,j+W+1])S.ref[k]=j}",58);
  /* 豪華なイベント：決まった数をはらい、みんなが出る */
  await run(`for(const id of ['salvia','lily'])S.inv[id]=(S.inv[id]||0)+6;S.mat.shina=(S.mat.shina||0)+30;S.mat.wood=(S.mat.wood||0)+40;addFood('mugi',20);addFood('imo',15);for(let i=0;i<60;i++)addFood('apple',1);S.pt+=3000`);
  const fl="{let n=0;for(let y=CY-14;y<CY-8&&n<30;y++)for(let x=CX-12;x<CX+12&&n<30;x++){const j=y*W+x;if(!S.obj[j]&&!S.ground[j]&&walk(j)){S.obj[j]='salvia';n++}}}";
  const h0=await run(`S.inv.salvia+S.inv.lily`);
  const hg=await go('hana',0,fl,58);assert.ok(hg.every(g=>g.sta===2),'hana sta+2');assert.equal(await run(`S.inv.salvia+S.inv.lily`),h0-10,'10 flower seeds used');
  const ug=await go('undo',0,'',72);const big=ug.filter(g=>g.work===2).length,small=ug.filter(g=>g.work===1).length;assert.ok(big>=1&&big+small===ug.length,'undo +1 / winners +2 '+JSON.stringify(ug));
  const farm="{let n=0;for(let y=CY+9;y<CY+12&&n<10;y++)for(let x=CX-4;x<CX+4&&n<10;x++){const j=y*W+x;if(!S.obj[j]&&!S.ground[j]&&walk(j)){S.obj[j]='plot';S.dyn[j]={p:0};n++}}}";
  await run(`addFood('mugi',20);addFood('imo',15)`);/* 運動会の食料で作物がへっているので、たす */
  const cr0=await run(`(S.fs.mugi||0)+(S.fs.imo||0)+(S.fs.tomato||0)`);
  const sg=await go('shukaku',0,farm,73);assert.ok(sg.every(g=>g.cap===1),'shukaku cap+1');assert.equal(await run(`(S.fs.mugi||0)+(S.fs.imo||0)+(S.fs.tomato||0)`),cr0-30,'30 crops used');
  const lg=await go('lantern',0,'',79);assert.ok(lg.every(g=>g.work===2),'lantern work+2');
  assert.equal(await run(`evOn('himatsuri')||evOn('utage')`),false,'volcano only');
  /* しごとの称号：同じ仕事を100回で称号、その仕事だけ はたらく速さ+2 */
  const tt=JSON.parse(await run(`(()=>{const r=S.res[1];r.jc={kikori:98};const g0=gJob(r,'chop');titleNote(r,{type:'chop',stage:'do'});const t1=!!(r.ttl||{}).kikori;titleNote(r,{type:'chop',stage:'do'});const w=rStat(r,rLv(r)).work;return JSON.stringify({t1,t2:!!r.ttl.kikori,g0,g1:gJob(r,'chop'),gm:gJob(r,'mine'),w})})()`));
  assert.ok(!tt.t1&&tt.t2,'title at 100');assert.equal(tt.g0,1);assert.ok(Math.abs(tt.g1-(tt.w+2)/tt.w)<1e-9,'chop +2');assert.equal(tt.gm,1,'other jobs unchanged');
  await run(`openSheet('res',S.res[1].id)`);await page.waitForTimeout(400);
  const shown=await run(`document.querySelector('#sheetBody').textContent.includes('きこりの名人')`);await run(`closeSheet()`);
  assert.ok(shown,'title shown on spirit sheet');
  /* やめたらもどる */
  const c2=JSON.parse(await run(`(()=>{const p=S.pt,f=S.food,w=S.mat.wood;const ok=evOpen('camp',[S.res[0].id]);const p1=S.pt;evCancel();return JSON.stringify({ok,back:S.pt===p&&S.food===f&&S.mat.wood===w,paid:p-p1,ev:S.ev,why:evWhy('camp')})})()`));
  assert.ok(c2.back&&c2.ev===null,'cancel refunds '+JSON.stringify(c2));
  /* とちゅうで暗くなったら、つぎの日に */
  const dd=await run(`dayNo()`);
  const d=JSON.parse(await run(`(()=>{S.evDone={};evOpen('oni',S.res.slice(0,2).map(r=>r.id));S.t=(${dd})*1440+13*60;evTick();const ph=S.ev.ph;S.t=(${dd})*1440+21*60+5;evTick();return JSON.stringify({ph,after:S.ev.ph,day:S.ev.day})})()`));
  assert.equal(d.ph,'go');assert.equal(d.after,null);assert.equal(d.day,dd+2);
  /* 上限 */
  const cap=await run(`(()=>{S.ev=null;const r=S.res[0];r.est={move:11};S.ev={id:'oni',who:[r.id],ph:'do',t0:S.t,at:{[r.id]:1},got:{},backed:[],paid:{pt:0,food:[]}};evEnd();return r.est.move})()`);assert.equal(cap,12,'capped at 12');
  /* 画面 */
  await run(`S.ev=null;S.evDone={};S.t=(dayNo())*1440+7*60;while(seasonDay(dayNo()+1)===CUPDAY)S.t+=1440;S.pt+=500;openSheet('craft')`);await page.waitForTimeout(300);await run(`document.querySelector('#evBtn').click()`);await page.waitForTimeout(400);
  const rows=await run(`document.querySelectorAll('#sheetBody .row').length`);assert.ok(rows>=12,'event rows '+rows);
  await run(`[...document.querySelectorAll('#sheetBody .row .btn.pri')].find(b=>!b.classList.contains('lack')).click()`);await page.waitForTimeout(300);
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/event-pop.png'});
  await run(`document.querySelector('.pxcard .go').click()`);await page.waitForTimeout(300);
  assert.ok(await run(`!!S.ev`),'opened from popup');
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/event-sheet.png'});
  const rad=await run(`[...document.querySelectorAll('*')].filter(e=>parseFloat(getComputedStyle(e).borderRadius)>0).length`);assert.equal(rad,0);
  /* 大会（季節の大会・運動会）は、せいれいが3人から：2人だと知らせもなく、ひらかない */
  await run(`if(sheet)closeSheet()`);const dn=await run(`dayNo()`);await to(dn+((5-((dn-1)%7+1))+7)%7||7,6.02);{const o=JSON.parse(await run(`(()=>{const keep=S.res.slice();S.res=keep.slice(0,2);S.ev=null;const sd=seasonDay(dayNo());evMorning();const ev=S.ev;S.ev=null;const w=evWhy('undo');S.res=keep;return JSON.stringify({sd,ev:!!ev,w})})()`));
    assert.equal(o.sd,5,'cup day');    assert.equal(o.ev,false,'no cup with 2 spirits');assert.equal(o.w,'せいれいが3人からです','undo needs 3')}
  await page.waitForTimeout(500);assert.deepEqual(errors,[]);await browser.close();console.log('Events: ok');
})().catch(e=>{console.error(e);process.exit(1)});
