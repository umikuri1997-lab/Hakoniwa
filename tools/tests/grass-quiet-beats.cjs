/* 草原の、セリフのない間：名前が返る前に葉がなぞった順にゆれる（echo）・「ただいま」のあと（still）・木陰でノドカが日なたへ座りなおす（sunny）。会話のわくをしまい、動きのあいだはつぎへ送れない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  const wait=ms=>page.waitForTimeout(ms);
  await run(`document.querySelector('#dialog').hidden=true;DLGQ.length=0;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=false;S.enemies=[];NOSAVE=true;S.t=12*60;
    if(!S.res.some(r=>r.name===MINA))S.res.push(mkRes(S,MINA,'earth',CX+.5,CY+4.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=60;r.nap=false;endAct(r)}recount();`);
  for(const c of ['echo','still','sunny']){
    assert.equal(await run(`SACRED_AWAY.has('${c}')&&SACRED_BEAT_MS['${c}']>0`),true,c+' hides the dialog box');
    const w=await run(`(()=>{sacredBeat('${c}');const d=sacredDirection();return d&&d.waitUntil>performance.now()+1000})()`);
    assert.equal(w,true,c+' holds the next line');await wait(c==='echo'?2800:1600);await run(`sacredEndDirection(false)`);
  }
  assert.equal(await run(`SACRED_QUIET.some(l=>String(l[3]||'').includes('stree:sunny'))&&!SACRED_QUIET.some(l=>l[1].includes('喜ぶ'))`),true);
  assert.equal(await run(`FIELD_STORIES.windEcho[0].lines.some(l=>l[3]==='stree:echo')&&!FIELD_STORIES.windEcho[0].lines.some(l=>l[1].includes('何か言った'))`),true,'the name comes back after the wait');
  assert.deepEqual(errors,[]);console.log('grass-quiet-beats ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
