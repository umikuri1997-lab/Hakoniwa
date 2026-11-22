/* 音の優先順位（audio.js の lowG・lowDuck・lowOK）：足音・作業の音などの「うしろの音」は lowG を通り、同時に LOWN こまで（いっぱいなら、いちばん小さい音より大きいときだけ入れかえる）。
   大事な音（DUCKK）が鳴ると、うしろの音と場所の音が LOWDUCK の大きさになり、LOWREL 秒かけてもどる。大事でない音では下げない */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume();if(sheet)closeSheet()})()`);/* まん中の御神木をクリックしてひらいた画面をとじる（ひらいたままだと村が止まり、音が鳴らない） */
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&(SBUF.fgrass||[]).some(Boolean)&&(SBUF.epon||[]).some(Boolean)&&(SBUF.tsoil||[]).some(Boolean)`),{},{timeout:30000});
const out=await run(`(async()=>{const o={};const wait=ms=>new Promise(r=>setTimeout(r,ms));ambTick();
 o.bus=!!lowG&&!!ambD;
 /* うしろの音を12こ鳴らす：大きさ 0.01〜0.12。のこるのは大きいほうの8こ */
 LOWL.length=0;const q=v=>({v,p:0,l:18000}),rnd=Math.random;Math.random=()=>.5;for(let i=1;i<=12;i++)footSoft('fgrass',q(i/100),1,1,.5);Math.random=rnd;
 o.n=LOWL.length;o.min=Math.min(...LOWL.map(e=>e.v));o.smallDrop=(footSoft('fgrass',q(.001),1,1,.5),LOWL.length===LOWN&&!LOWL.some(e=>e.v<.002));
 /* 作業の音は sfxLow でうしろの音へ */
 LOWL.length=0;const r=S.res[0];const cx=cam.x/TS+VW/cam.z/TS/2,cy=cam.y/TS+VH/cam.z/TS/2;lastSfx.wsoil=0;sfxLow('wsoil',cx,cy);o.work=LOWL.length;
 /* 大事でない音では下げない */
 await wait(900);sfx('tap');await wait(60);o.tap=lowG.gain.value;
 /* 大事な音で半分にして、もどす */
 sfx('ehit');await wait(80);o.duck=lowG.gain.value;o.duckAmb=ambD.gain.value;await wait(900);o.back=lowG.gain.value;
 sfx('quest');await wait(80);o.quest=lowG.gain.value;
 return o})()`);
console.log(out);
assert.ok(out.bus,'うしろの音と場所の音の出口がある');
assert.equal(out.n,8,'うしろの音は同時に8こまで');assert.ok(out.min>=.05-1e-9,'のこるのは、大きい（近い）音');
assert.ok(out.smallDrop,'いっぱいのとき、いちばん小さい音より小さい音は鳴らさない');
assert.equal(out.work,1,'作業の音はうしろの音');
assert.ok(out.tap>.98,'ボタンの音では下げない');
assert.ok(Math.abs(out.duck-.5)<.05&&Math.abs(out.duckAmb-.5)<.05,'大事な音のあいだ、うしろの音と場所の音は半分');
assert.ok(out.back>.98,'0.6秒かけてもどる');assert.ok(Math.abs(out.quest-.5)<.05,'たっせいの音でも下げる');
assert.deepEqual(errors,[]);console.log('Sound priority: background sounds capped at 8, nearest kept, ducked to half by important sounds. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
