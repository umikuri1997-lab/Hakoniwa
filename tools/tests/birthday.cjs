/* せいれいの誕生日（birthday.js：村に来た日から20日ごと）と、草原の夏の豪華なイベント「花火の夜」（events.js の hanabi）。
   誕生日：1年に1回・前の日のないしょ話（ピンクの会話）・当日15時のお誕生日会（みんなが集まり、なかよし+3）・つぎの朝のお礼の手紙・お世話の「おいわい」・プロフィールの誕生日。
   その日のイベントのあとにつづく・時間をすぎたら、その年はやめる。
   花火の夜：夏だけ・たき火がいる・パワー300・枝20・空き缶10・攻撃力+5・スタミナ+1・花火のエフェクト・雨の日はできない。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=true;S.enemies=[];NOSAVE=true;
    for(const el of ['wood','earth','water','wind'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=60}
    S.pt=5000;S.mat.wood=60;for(let i=0;i<99;i++)addFood('apple',1);S.t=12*60;`);
  const sim=(clockMin,stopIf)=>run(`(()=>{const end=S.t+${clockMin};let n=0;while(S.t<end&&n<40000){stepWorld(1.5);for(const r of S.res){updRes(r,1.5);r.hunger=Math.max(r.hunger,800);r.energy=Math.max(r.energy,80)}S.enemies=[];S.rain=false;n++;${stopIf?'if('+stopIf+')break;':''}}return n})()`);
  const to=(d,h)=>run(`(()=>{const t=(${d}-1)*1440+(${h})*60;if(t>S.t)S.t=t;return dayNo()})()`);
  /* 誕生日のきめかた */
  const bi=JSON.parse(await run(`(()=>{const r=S.res[1];r.came=7;const on=[];for(let d=1;d<=50;d++)if(bdayOn(r,d))on.push(d);const f=S.res[0],c0=f.came;delete f.came;const fo=[];for(let d=1;d<=45;d++)if(bdayOn(f,d))fo.push(d);if(c0)f.came=c0;return JSON.stringify({on,fo,tx:bdayText(r),year:BDAYYEAR()})})()`));
  assert.equal(bi.year,20);assert.deepEqual(bi.on,[27,47],'every 20 days from the day it came');assert.deepEqual(bi.fo,[21,41],'first spirit: from day 1');assert.equal(bi.tx,'夏の2日','birthday text = the day it came');
  /* 花火の夜 */
  assert.equal(await run(`EVENTS.hanabi.stage===0&&EVENTS.hanabi.sea===1&&EVENTS.hanabi.grand===1&&evOn('hanabi')`),true,'grass summer grand');
  let d=await run(`dayNo()`);while(await run(`seasonOf(${d}+1)!==1||seasonDay(${d}+1)===CUPDAY`))d++;await to(d,15);
  await run(`S.evDone={};S.ev=null;S.mat.eda=25;S.mat.can=12;S.pt=5000;`);
  assert.equal(await run(`evWhy('hanabi')`),'たき火がありません','needs campfire');
  await run(`{const j=(CY+7)*W+CX+2;S.obj[j]='campfire';recount()}`);
  const ho=JSON.parse(await run(`(()=>{const p=S.pt;const ok=evOpen('hanabi',S.res.map(r=>r.id));return JSON.stringify({ok,pt:p-S.pt,eda:S.mat.eda,can:S.mat.can,day:S.ev&&S.ev.day})})()`));
  assert.ok(ho.ok,'hanabi opened');assert.equal(ho.pt,300);assert.equal(ho.eda,5);assert.equal(ho.can,2);
  const est0=JSON.parse(await run(`JSON.stringify(S.res.map(r=>Object.assign({},r.est)))`));
  await to(ho.day,19.9);
  const seen=await sim(60*3,`S.ev&&S.ev.ph==='do'&&fx.some(f=>f.n==='hanabi')`);
  assert.ok(await run(`S.ev&&S.ev.ph==='do'&&fx.some(f=>f.n==='hanabi'&&f.col)`),'fireworks drawn with color ('+seen+' steps)');
  if(process.env.SHOT_DIR){await run(`{const E=S.ev;cam.x=E.c[0]*TS;cam.y=(E.c[1]-3)*TS;for(let i=0;i<4;i++)fxSpr('hanabi',(E.c[0]+i*1.5-2)*TS,(E.c[1]-3)*TS,HANABIC[i]);for(const f of fx)if(f.n==='hanabi')f.life=.55}`);await page.waitForTimeout(300);await page.screenshot({path:process.env.SHOT_DIR+'/hanabi.png'})}
  await sim(60*4,'!S.ev');
  const hr=JSON.parse(await run(`JSON.stringify({ev:S.ev,est:S.res.map(r=>r.est||{}),memo:(S.memo||[]).map(m=>m[2]).filter(t=>t.includes('花火の夜'))})`));
  assert.equal(hr.ev,null,'hanabi finished');assert.ok(hr.memo.length,'hanabi memo');
  const hg=hr.est.map((e,i)=>({atk:(e.atk||0)-(est0[i].atk||0),sta:(e.sta||0)-(est0[i].sta||0)}));assert.ok(hg.every(g=>g.atk===5&&g.sta===1),'atk+5 sta+1 '+JSON.stringify(hg));
  /* 雨の日は、あげられない（つぎの日に） */
  const rn=JSON.parse(await run(`(()=>{S.evDone={};S.ev=null;S.mat.eda=20;S.mat.can=10;const d0=dayNo();evOpen('hanabi',S.res.map(r=>r.id));const day=S.ev.day;S.t=(day-1)*1440+20.2*60;S.rain=true;evTick();const r={ph:S.ev.ph,day:S.ev.day,want:day+1};evCancel();S.rain=false;return JSON.stringify(r)})()`));
  assert.equal(rn.ph,null);assert.equal(rn.day,rn.want,'rain: next day');
  /* 誕生日：誕生日がほかの子とかさならない日をさがす */
  const bd=JSON.parse(await run(`(()=>{const r=S.res[2];r.came=dayNo()-15;let d=dayNo()+2;while(!(bdayOn(r,d)&&seasonDay(d)!==CUPDAY&&S.res.every(q=>q===r||!bdayOn(q,d))))d++;return JSON.stringify({id:r.id,name:r.name,d})})()`));
  /* 前の日のないしょ話 */
  await to(bd.d-1,12);
  const ev=JSON.parse(await run(`(()=>{S.ev=null;bdayEveTick();const k='bdy_${bd.id}_'+bdayYear(${bd.d});const e=SEV1.find(x=>x.k===k);if(!e)return JSON.stringify({});const L=e.L;checkSev();return JSON.stringify({k,at:e.at(),L,q:(S.sevP||[]).includes(k)})})()`));
  assert.ok(ev.at,'eve talk ready '+JSON.stringify(ev));assert.equal(ev.L.length,3);assert.ok(ev.L.every(l=>l[0]!==bd.name),'birthday spirit does not hear it');assert.ok(ev.L[0][1].includes(bd.name),'names the birthday spirit');assert.ok(ev.q,'pink bubble queued');
  /* 当日：きまっていたイベントのあとにつづく */
  await to(bd.d,6.02);
  const ch=JSON.parse(await run(`(()=>{S.ev={id:'oni',day:dayNo(),who:[S.res[0].id],paid:{pt:0,food:[]},ph:null};bdayMorning();const r={a:S.ev.id,b:S.ev.next&&S.ev.next.id,bd:S.ev.next&&S.ev.next.bd};S.ev=null;bdayMorning();r.solo=S.ev&&S.ev.id;return JSON.stringify(r)})()`));
  assert.deepEqual(ch,{a:'oni',b:'bday',bd:bd.id,solo:'bday'},'chain after today event');
  const b0=JSON.parse(await run(`(()=>{const r=S.res.find(q=>q.id===${bd.id});return JSON.stringify(S.res.filter(q=>q!==r).map(q=>bondOf(r,q)))})()`));
  await to(bd.d,14.9);await run(`NOSAVE=false`);await sim(60*6,'!S.ev');
  const br=JSON.parse(await run(`(()=>{const r=S.res.find(q=>q.id===${bd.id});return JSON.stringify({ev:S.ev,bond:S.res.filter(q=>q!==r).map(q=>bondOf(r,q)),memo:(S.memo||[]).map(m=>m[2]).filter(t=>t.includes('誕生日を、みんなでお祝いした')),lq:(S.letterQ||[]).filter(q=>q.k==='bday').map(q=>q.who)})})()`));
  await run(`NOSAVE=true`);
  assert.equal(br.ev,null,'party finished');assert.ok(br.memo.length,'party memo');assert.deepEqual(br.lq,[bd.name],'thank-you letter queued');
  assert.ok(br.bond.every((v,i)=>v-b0[i]>=3),'bond +3 '+JSON.stringify([b0,br.bond]));
  /* プレイヤーの「おいわい」：お世話のタブに出て、食べ物をわたすと、すき・にがてがわかる */
  await run(`resTab=2;openSheet('res',${bd.id})`);await page.waitForTimeout(400);
  assert.ok(await run(`[...document.querySelectorAll('#sheetBody .btn')].some(b=>b.textContent==='おいわい')`),'care button on birthday');
  await run(`[...document.querySelectorAll('#sheetBody .btn')].find(b=>b.textContent==='おいわい').click()`);await page.waitForTimeout(300);
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/bday-pop.png'});
  const f0=await run(`S.fs.apple`);await run(`[...document.querySelectorAll('.pxpopw .slot')].find(b=>b.textContent.includes('りんご')).click()`);await page.waitForTimeout(300);
  const gv=JSON.parse(await run(`(()=>{const r=S.res.find(q=>q.id===${bd.id});return JSON.stringify({care:r.care.bday===dayNo(),known:r.fk&&r.fk.apple!=null||prefKnown(r,'fd'),apple:S.fs.apple})})()`));
  assert.ok(gv.care&&gv.known,'gift taken '+JSON.stringify(gv));assert.equal(gv.apple,f0-1);
  await run(`resTab=1;openSheet('res',${bd.id})`);await page.waitForTimeout(300);
  assert.ok(await run(`document.querySelector('#sheetBody').textContent.includes('誕生日'+bdayText(S.res.find(q=>q.id===${bd.id})))`),'profile shows birthday');
  await run(`resTab=2;openSheet('res',${bd.id})`);await page.waitForTimeout(300);
  assert.ok(await run(`[...document.querySelectorAll('#sheetBody .btn')].find(b=>b.textContent==='おいわい').classList.contains('lack')`),'once a day');await run(`closeSheet()`);
  /* つぎの朝、お礼の手紙 */
  await to(bd.d+1,6.02);const lt=JSON.parse(await run(`(letterMorning(),JSON.stringify((S.letters||[]).filter(l=>l.k==='bday')))`));
  assert.equal(lt.length,1);assert.ok(lt[0].tx.length>=3&&lt[0].tx.length<=6,'手紙は3〜6行（できごと・お世話・ひみつの行がつく）');assert.equal(lt[0].who,bd.name);
  /* 時間をすぎたら、その年はやめる */
  const ms=await run(`(()=>{S.ev={id:'bday',day:dayNo(),bd:${bd.id},who:S.res.map(r=>r.id),paid:{pt:0,food:[]},ph:null};S.t=(dayNo()-1)*1440+18.5*60;evTick();return S.ev})()`);assert.equal(ms,null,'dropped after window');
  await page.waitForTimeout(500);assert.deepEqual(errors,[]);await browser.close();console.log('Birthday & hanabi: ok');
})().catch(e=>{console.error(e);process.exit(1)});
