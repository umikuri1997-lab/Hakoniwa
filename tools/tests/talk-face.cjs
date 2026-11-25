/* 会話の向き：上下にならんだ2人は、上の子が正面（下）、下の子がうしろ（上）を向く。横にならんだら横向き */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:900,height:700}});
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+720;S.enemyOn=false;
    for(let y=CY-4;y<CY+4;y++)for(let x=CX-4;x<CX+6;x++){const j=y*W+x;S.obj[j]='';S.floor[j]='';S.hi[j]=0}
    S.res=[mkRes(S,FUTABA,'wood',CX+.5,CY+.5),mkRes(S,NODOKA,'earth',CX+.5,CY+1.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;r.act={type:'idle',stage:'do',t:0,dur:9999}}recount();})()`);
  const look=i=>run(`(()=>{const p=sacredPose(S.res[${i}])||{};return {side:!!p.side,back:!!p.back}})()`);
  await run(`dialog([[NODOKA,'あれぇ、もうこんな時間かぁ。'],[FUTABA,'うん。']])`);await page.waitForTimeout(400);
  assert.deepEqual(await look(1),{side:false,back:true},'lower speaker looks up');
  assert.deepEqual(await look(0),{side:false,back:false},'upper listener looks down');
  if(process.env.SHOT){await run(`(()=>{const r=S.res[0];cam.z=3;cam.x=r.x*TS-VW/cam.z/2;cam.y=(r.y+.6)*TS-VH/cam.z/2})()`).catch(()=>{});await page.waitForTimeout(300);await page.screenshot({path:process.env.SHOT})}
  await run(`document.querySelector('#dialog').hidden=true;dlgGestEnd();S.res[1].x=CX+1.5;S.res[1].y=CY+.5`);
  await run(`dialog([[NODOKA,'となりだねぇ。'],[FUTABA,'うん。']])`);await page.waitForTimeout(400);
  assert.deepEqual(await look(1),{side:true,back:false},'side by side: sideways');
  assert.equal(await run('(sacredPose(S.res[1])||{}).face'),-1,'faces the partner on the left');
  console.log('Talk facing: vertical pairs face up/down, side pairs face sideways');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
