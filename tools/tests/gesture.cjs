/* 会話の身ぶり：話す子はセリフの印に合った身ぶり、聞く子は反応、「わたす」は手わたし（花かんむりは頭にのる）。夢の場面の花かんむり */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:900,height:700}});
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+720;S.enemyOn=false;
    for(let y=CY-4;y<CY+4;y++)for(let x=CX-4;x<CX+6;x++){const j=y*W+x;S.obj[j]='';S.floor[j]='';S.hi[j]=0}
    S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5),mkRes(S,MINA,'earth',CX+1.5,CY+.5),mkRes(S,FIXK0.water,'water',CX+.5,CY+1.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;r.act={type:'idle',stage:'do',t:0,dur:9999}}for(const k in S.dyn)if(S.dyn[k]&&S.dyn[k].g!=null)S.dyn[k].g=0;/* 実った物をなくす：会話のあいだに、食べ物をあつめに歩き出さないように（foodLow） */recount();})()`);
  const next=async()=>{await page.waitForFunction(()=>sacredEval(`(()=>{const b=document.querySelector('#dlgBtns button[data-nx]');return !!b&&!b.disabled&&performance.now()>=DLGA.holdUntil&&!sacredMotionPending()})()`),{},{timeout:8000});
    const t0=await run('DLGA.lineT');for(let k=0;k<12;k++){await run(`(()=>{const b=document.querySelector('#dlgBtns button[data-nx]');if(b)b.click()})()`);await page.waitForTimeout(260);if(await run(`DLGA.lineT!==${t0}||document.querySelector('#dialog').hidden`))break}};/* 文字が出おわっていなければ、1回めは文字をぜんぶ出すだけ */
  const POKO=await run('POKO'),MINA=await run('MINA');
  const pose=n=>run(`(()=>{const r=S.res.find(q=>q.name===${JSON.stringify(n)});const p=sacredPose(r);return p?p.anim:''})()`);
  /* 1. 話す子の身ぶり */
  await run(`dialog([[POKO,'#tilt|ねえ、あれ、なんだろう。'],[MINA,'#giggle|ふふ、なんだろうねぇ。'],[POKO,'#give crown|はい、これ。'],[MINA,'#joy|ありがとうねぇ。']])`);
  await page.waitForTimeout(200);assert.equal(await pose(POKO),'talktilt','speaker tilts the head');
  assert.equal(await run('SPM.talktilt&&SPM.talkmouth&&SPM.weave&&SPM.dance?1:0'),1,'the new 3D motions exist');
  await next();await page.waitForTimeout(200);assert.equal(await pose(MINA),'talkmouth','second speaker giggles');
  await page.waitForTimeout(1200);const lis=await pose(POKO);assert.ok(['talkmouth','storyListen','talkjoy'].includes(lis),'listener reacts or listens: '+lis);
  /* 2. わたす：花かんむりが頭にのる。うけとるまで送れない */
  await next();await page.waitForTimeout(150);assert.equal(await pose(POKO),'crownput','giver puts the crown on');
  assert.equal(await run('sacredMotionPending()'),true,'next line waits for the hand-over');
  await page.waitForFunction(()=>sacredEval(`S.res[1].crown===callDay()`),{},{timeout:4000});
  assert.equal(await run('spCrownOn(S.res[1])'),true,'receiver wears the crown');
  await next();await next().catch(()=>{});await page.waitForTimeout(300);
  assert.equal(await run('DLGPOSE.size'),0,'gestures are cleared when the talk ends');
  /* 2b. 2人でふれあう・物をわたす・あくびがうつる・指さす・ヌシ様をなでる */
  await run('S.t=1440+720;DLGGAP=0;DLGQ.length=0');await run(`dialog([[POKO,'#pinky|小指だけ。'],[MINA,'#give stone|これ、あげる。'],[POKO,'#yawn|……ふあぁ。'],[POKO,'#point tree|見て見て！']])`);await page.waitForTimeout(200);
  assert.equal(await pose(POKO),'pinky','pinky pair (speaker)');assert.equal(await pose(MINA),'pinky','pinky pair (partner)');
  await next();await page.waitForTimeout(1500);assert.equal(await run(`(sacredPose(S.res[0])||{}).handItem`),'stone','the receiver holds the stone');
  await next();await page.waitForTimeout(1500);assert.equal(await pose(MINA),'yawn','the yawn is catching');
  await run(`S.obj[CY*W+CX-3]='tree'`);await next();await page.waitForTimeout(200);assert.equal(await pose(POKO),'point','point at the tree');assert.equal(await run('S.res[0].face'),-1,'faces the tree');
  await next();await run(`S.obj[CY*W+CX-3]=''`);
  assert.equal(await run(`(()=>{const r=S.res[2],n0=S.nushi;r.act={type:'npl',stage:'do',t:0};S.nushi={x:r.x+1.5,y:r.y,pl:{id:r.id}};nushiPet();const a=(sacredPose(r)||{}).anim;S.nushi=n0;dlgGestEnd();r.act={type:'idle',stage:'do',t:0,dur:9999};return a})()`),'headpat','pet Nushi');
  /* 3. つぎの朝6時で、はずれる */
  await run('S.t=1440*2+400');assert.equal(await run('spCrownOn(S.res[1])'),false,'the crown is gone the next morning');
  /* 4. 夢の場面：あむ → 歩いていく → のせる */
  await run(`S.t=1440+720;window.__dd=0;dreamScene(()=>{window.__dd=1})`);
  await page.waitForTimeout(900);assert.equal(await run(`(SACRED_POSES.get(EXTRA[1])||{}).anim`),'weave','a sibling weaves the crown');
  await page.waitForFunction(()=>sacredEval(`!document.querySelector('#dialog').hidden`),{},{timeout:8000});
  for(let i=0;i<6;i++){if(i===3)assert.equal(await run('!!EXTRA[0].crownT'),true,'Futaba wears the crown in the dream');await next()}
  await page.waitForFunction(()=>window.__dd===1,{},{timeout:6000});assert.equal(await run('EXTRA.length'),0,'the dream is cleaned up');
  console.log('Gestures: speaker gestures, listener reactions, hand-over with the crown, dream crown scene');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
