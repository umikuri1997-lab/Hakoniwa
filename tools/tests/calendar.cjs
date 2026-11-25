/* こよみ：オオカゲの夜は目標の欄と同じ日・季節のかわり目と大会・満月と新月・記念日・知らせたあらしだけ出る／10日ぶんのます目・タップでその日の予定 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const J=async s=>JSON.parse(await run(s));
  await run(`(()=>{document.querySelector('#dialog').hidden=true;USERPAUSE=true;S.introSeen=true;S.flags.tapped=1;S.flags.nodokaCame=true;S.hold=0;resetVillageTransient();dialog=()=>{};talkOnce=()=>{};
    S.enemyOn=true;S.t=1440*20+10*60;for(const [el,n] of [['earth',NODOKA],['fire',FIXK0.fire],['water','アオ']])S.res.push(mkRes(S,n,el,44,58));recount()})()`);
  /* 1. オオカゲ：目標の欄の「あと〇日」と同じ日に出る */
  const a=await J(`(()=>{S.bossKills=0;S.bossWarn=dayNo();S.res4Since=dayNo()-5;const t=dayNo(),txt=bossDays(),n=+(txt.match(/あと(\\d+)日/)||[0,txt.includes('今夜')?0:-1])[1];
    const days=[];for(let i=0;i<10;i++)if(calEvents(t+i).some(e=>e[1]==='オオカゲが来る夜'))days.push(i);
    S.cleared=true;const cl=[];for(let i=0;i<10;i++)if(calEvents(t+i).some(e=>e[1]==='オオカゲが来る夜'))cl.push(i);S.cleared=false;
    const keep=S.bossWarn;S.bossWarn=null;const nw=[];for(let i=0;i<10;i++)if(calEvents(t+i).some(e=>e[1]==='オオカゲが来る夜'))nw.push(i);S.bossWarn=keep;
    return JSON.stringify({txt,n,days,cl,nw})})()`);
  assert.ok(a.n>=0,'the goal shows a countdown: '+a.txt);assert.deepEqual(a.days,[a.n],'the boss night is the same day as the goal countdown');assert.deepEqual(a.cl,[],'no boss after the stage is cleared');assert.deepEqual(a.nw,[],'no boss before it is announced');
  console.log('Boss: '+a.txt+' -> calendar day +'+a.days[0]);
  /* 2. 季節・大会・月・記念日・あらし */
  const b=await J(`(()=>{const t=dayNo(),f=d=>calEvents(d).map(e=>e[1]);let sd=t;while(seasonDay(sd)!==1)sd++;let cd=t;while(seasonDay(cd)!==CUPDAY)cd++;let fm=t;while(moonOf(fm)!=='full')fm++;
    const r=S.res[0];r.came=t+3-10;r.back=false;S.stormNext=t+1;S.stormWarn=0;const st0=f(t+1).includes('あらしの日');S.stormWarn=1;const st1=f(t+1).includes('あらしの日');
    while(S.res.length<3)S.res.push(mkRes(S,'ためし'+S.res.length,'wood',44,58));
    return JSON.stringify({sea:f(sd),seaName:SEASONS[seasonOf(sd)],cup:f(cd),cupName:EVENTS[cupOf(cd)].n,moon:f(fm),an:f(t+3),anName:r.name,st0,st1})})()`);
  assert.ok(b.sea.includes(b.seaName+'になる'),'season change');assert.ok(b.cup.includes(b.cupName),'season cup');assert.ok(b.moon.includes('満月の夜'),'full moon');
  assert.ok(b.an.includes(b.anName+'が村に来て10日'),'anniversary');assert.equal(b.st0,false,'a storm is not shown before it is announced');assert.equal(b.st1,true,'an announced storm is shown');
  console.log('Season, cup, moon, anniversary and storm show on their days');
  /* 3. 画面：10日ぶんのます目・タップでその日の予定 */
  const c=await J(`(()=>{openSheet('menu','cal');const cells=[...document.querySelectorAll('.calday')];const h0=document.querySelector('.calh').textContent;cells[1].click();const h1=document.querySelector('.calh').textContent;
    const rows=[...document.querySelectorAll('.calr .row b')].map(b=>b.textContent);const tile=!!document.querySelector('.mtile[data-menu]');closeSheet();openSheet('menu');const has=[...document.querySelectorAll('.mtile')].some(b=>b.dataset.menu==='cal');closeSheet();
    return JSON.stringify({n:cells.length,h0,h1,rows,has})})()`);
  assert.equal(c.n,10,'ten days');assert.match(c.h0,/^きょう/);assert.match(c.h1,/^あした/);assert.ok(c.rows.includes('あらしの日'),'tapped day shows its plans: '+c.rows.join('/'));assert.ok(c.has,'menu has the calendar');
  console.log('Sheet: 10 cells, tapping shows the day ('+c.h1+': '+c.rows.join('・')+')');
  assert.deepEqual(errors,[],'no page errors');await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
