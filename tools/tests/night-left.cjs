/* 夜、目標の欄に「今夜のコワイノ：のこり〇ひき」（まだ来ていない分もふくむ。先ぶれ・にげていく子・たおれた子はのぞく）。昼は出さない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const txt=()=>run(`(renderQuest(),$('#questTxt').textContent)`);
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const mk=o=>`Object.assign({id:S.nid++,type:'basic',x:CX,y:CY+20,hp:100,max:100,delay:0,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false},${o})`;
  await run(`S.enemies=[${mk('{}')},${mk('{spawned:false,delay:50}')},${mk('{scout:1}')},${mk('{flee:true}')},${mk('{dead:true}')},${mk('{hp:0}')}]`);
  assert.ok(!(await txt()).includes('のこり'),'not shown in the daytime');
  await run(`S.t=1440*2+60;S.enemies.forEach(e=>e.stun=1e9)`);/* 夜1時。コワイノはとめておく */
  const t=await txt();assert.ok(t.includes('今夜の「コワイノ」：のこり2ひき'),t);
  await run(`S.enemies.forEach(e=>e.dead=true)`);assert.ok(!(await txt()).includes('のこり'),'hidden when none are left');
  console.log('Night: the quest bar shows the enemies left tonight');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
