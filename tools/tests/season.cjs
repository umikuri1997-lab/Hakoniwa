/* 季節と記念日：5日ごとに春・夏・秋・冬。かわった朝に知らせてのこす。冬の雨は雪。村に来て10日などの朝に、その子がよろこぶ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();`);
  const map=JSON.parse(await run(`JSON.stringify([1,5,6,10,11,16,20,21].map(seasonOf))`));
  assert.deepEqual(map,[0,0,1,1,2,3,3,0],'5 days a season, 20 days a cycle');
  const day=d=>`S.enemyOn=true;S.hold=0;S.t=(${d}-1)*1440+7*60;`;
  /* 夏になった朝 */
  const su=JSON.parse(await run(`(()=>{${day(6)}S.memo=[];seasonMorning();updateHUD&&updateHUD();return JSON.stringify({m:S.memo.map(x=>x[2]),n:seasonNow()})})()`).catch(async()=>await run(`(()=>{${day(6)}S.memo=[];seasonMorning();return JSON.stringify({m:S.memo.map(x=>x[2]),n:seasonNow()})})()`)));
  assert.equal(su.n,1);assert.deepEqual(su.m,['夏になった']);
  const same=await run(`(()=>{${day(7)}S.memo=[];seasonMorning();return S.memo.length})()`);assert.equal(same,0,'no notice inside a season');
  console.log('Season: changes every 5 days and is noted once');
  /* 冬の雨は雪 */
  await run(`${day(16)}S.rain=true;`);await page.waitForTimeout(1200);
  const lbl=await run(`document.querySelector('#dayLbl').textContent`);assert.ok(lbl.startsWith('冬・')&&lbl.includes('雪'),lbl);
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/winter.png'});
  await run(`${day(11)}S.rain=false;`);await page.waitForTimeout(1200);
  assert.ok((await run(`document.querySelector('#dayLbl').textContent`)).startsWith('秋・'));
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/autumn.png'});
  await run(`${day(2)}`);await page.waitForTimeout(1200);if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/spring.png'});
  console.log('Season: winter rain shows as snow, the day label shows the season');
  /* 記念日 */
  const an=JSON.parse(await run(`(()=>{${day(12)}const r=S.res[0];r.came=2;r.back=0;S.memo=[];annivMorning();const t=annivTopic(r);const r2=S.res[0];r2.came=3;const t2=annivTopic(r2);return JSON.stringify({m:S.memo.map(x=>x[2]),t:!!t,t2:!!t2,txt:t&&t.L.join('/')})})()`));
  assert.deepEqual(an.m,[await run(`S.res[0].name`)+'が村に来て10日']);assert.ok(an.t&&!an.t2,'only on the anniversary day');assert.ok(an.txt.includes('10日'),an.txt);
  console.log('Anniversary: noted and talked about on day 10');
  /* 季節の話がお話に入る */
  const tk=await run(`(()=>{${day(11)}const r=S.res[0];r.came=1;let hit=0;for(let i=0;i<300;i++){r.tsn=null;const L=JSON.stringify(smallTalk(r));if(/葉っぱの色|おなかがすくんだ/.test(L)){hit=1;break}}return hit})()`);
  assert.equal(tk,1,'autumn small talk can appear');
  await page.waitForTimeout(500);assert.deepEqual(errors,[]);await browser.close();console.log('Season: ok');
})().catch(e=>{console.error(e);process.exit(1)});
