/* クォータービューの前ななめの目：3Dの顔の面にはって写した目・ほっぺ・まつげの絵（SPMQ の q）を、そのまま顔にかさねる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:900,height:700}});
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+720;S.enemyOn=false;
    for(let y=CY-4;y<CY+4;y++)for(let x=CX-4;x<CX+6;x++){const j=y*W+x;S.obj[j]='';S.floor[j]='';S.hi[j]=0}
    S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5)];S.res[0].vr={...(S.res[0].vr||{}),cheek:1,lash:1};for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;r.act={type:'idle',stage:'do',t:0,dur:9999}}recount();
    window.EYEN=[];const f0=spmEyeCell;spmEyeCell=(im,Q,r,i,el,vr)=>{EYEN.push(ISOEYEK[r]+'|'+el);return f0(im,Q,r,i,el,vr)};
    const r=S.res[0];cam.z=3;cam.x=r.x*TS-VW/cam.z/2;cam.y=(r.y+.6)*TS-VH/cam.z/2})()`);
  await page.waitForTimeout(1500);
  const n=await run('[...new Set(EYEN)]');
  assert.ok(n.includes('sp:face#n|wood')||n.includes('sp:face#hap|wood')||n.includes('sp:face#shut|wood'),'wood eyes from the 3D eye sheet: '+n);
  assert.ok(n.includes('sp:cheek|wood'),'cheek from the 3D eye sheet');
  assert.ok(n.some(k=>k.startsWith('sp:lash#')&&k.endsWith('|wood')),'lashes from the 3D eye sheet');
  await run(`(()=>{S.res=[mkRes(S,MINA,'wind',CX+.5,CY+.5)];const r=S.res[0];r.hunger=hMax(r);r.energy=100;r.fun=90;r.act={type:'idle',stage:'do',t:0,dur:9999};recount();EYEN.length=0})()`);
  await page.waitForTimeout(1200);
  const w=await run('[...new Set(EYEN)]');assert.ok(w.some(k=>k.endsWith('|wind')),'wind eyes from the 3D eye sheet: '+w);
  if(process.env.SHOT)await page.screenshot({path:process.env.SHOT});
  console.log('Iso eyes: front-diagonal eyes, cheeks and lashes come from the 3D eye sheet');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
