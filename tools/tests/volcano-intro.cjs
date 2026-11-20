/* 火山の導入：ホムラが温泉の水にさわる（vol:touchA・touchH）・冷たい温泉を調べよう（西と奥の2つ）・湯のそばのベンチと夕やけのひとこと（talk.js の DAYLK） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780},world:1});
  const wait=ms=>page.waitForTimeout(ms);
  const talk=async()=>{const t0=Date.now();while(Date.now()-t0<90000){if(await run(`document.querySelector('#dialog').hidden`))return;await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=[...document.querySelectorAll('#dlgBtns button')].find(b=>!b.classList.contains('dlgSkip')&&!b.classList.contains('dlgFF')&&!b.hidden);if(b)b.click()})()`);await wait(150)}throw new Error('dialog did not end')};
  await run(`document.querySelector('#dialog').hidden=true;DLGQ.length=0;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=false;S.enemies=[];NOSAVE=true;DLGGAP=0;
    for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=50;r.nap=false;endAct(r)}S.t=12*60;recount();`);
  /* 1. 着いてからの会話：ホムラが入口の温泉の水べへ歩く */
  assert.equal(await run(`INTRO2.some(l=>String(l[2]||'').includes('vol:touchA'))&&!PROLOGUE2.some(l=>l[1].includes('温泉'))`),true,'the god no longer explains the springs in the prologue');
  await run(`(()=>{const h=S.res.find(r=>r.name===HOMURA);h.x=HSPC.a[0]-6;h.y=HSPC.a[1]+2;dialog([INTRO2[4],INTRO2[5]],()=>{window.ID=1},null,HOMURA)})()`);await wait(3500);
  assert.equal(await run(`(()=>{const h=S.res.find(r=>r.name===HOMURA),j=(h.y|0)*W+(h.x|0),M=sprMap();return [-1,0,1].some(dy=>[-1,0,1].some(dx=>{const n=j+dy*W+dx;return M[n]==='a'&&S.ground[n]===1}))})()`),true,'Homura walks to the water of the entrance spring');
  await talk();assert.equal(await run(`window.ID`),1,'the intro lines play to the end');
  /* 2. 冷たい温泉を調べよう：入口は数えない。西と奥で2/2 */
  const q=await run(`(()=>{delete S.flags.sprLook;const Q=QUESTS.find(q=>q.id==='coldSpring'),o=[];sprLookTap('a');o.push(sprLookN());sprLookTap('b');sprLookTap('b');o.push(sprLookN(),Q.check());sprLookTap('c');o.push(sprLookN(),Q.check(),S.flags.sprLast,Q.prog());S.flags.sprLook=true;o.push(Q.check());return o.join()})()`);
  assert.equal(q,'0,1,false,2,true,c,調べた水たまり 2/2,true','two springs to look at; an old save that already looked is done');
  /* 3. 湯のそばのベンチ：シズク・ホムラで、ちがうひとこと */
  const b=await run(`(()=>{S.flags.onsen=true;SPRM=null;const M=sprMap();const w=M.findIndex((k,j)=>k==='a'&&S.ground[j]===1);let bj=-1;for(let r=1;r<4&&bj<0;r++)for(let dy=-r;dy<=r&&bj<0;dy++)for(let dx=-r;dx<=r;dx++){const j=w+dy*W+dx;if(S.ground[j]!==1&&!S.obj[j]&&walk(j)){bj=j;break}}S.obj[bj]='bench';recount();
    let s=S.res.find(r=>r.name===SHIZUKU);if(!s){s=mkRes(S,SHIZUKU,'water',CX+2.5,CY+6.5);S.res.push(s)}const h=S.res.find(r=>r.name===HOMURA);
    dayNote(s,{type:'rest',obj:bj});dayNote(h,{type:'rest',obj:bj});const e=dlToday(s).find(x=>x[0]==='yubench');
    const ls=dayLine(s,e).map((t,i)=>chatTone(t,s,i)),lh=dayLine(h,['yubench','a']).map((t,i)=>chatTone(t,h,i));return JSON.stringify({e,ls,lh})})()`);
  const B=JSON.parse(b);assert.deepEqual(B.e,['yubench','a'],'resting on the bench by the spring is remembered');
  assert.ok(B.ls.join('').includes('湯のわく音'),'Shizuku listens to the spring: '+B.ls);assert.ok(B.lh.join('').includes('朝いちばんの湯気'),'Homura sees the morning steam: '+B.lh);
  /* 4. 夕やけ：木と火で、ちがうひとこと */
  const ss=await run(`(()=>{const w=mkRes(S,'テスト木','wood',CX,CY),f=mkRes(S,'テスト火','fire',CX,CY);f.vr=f.vr||{};const L=r=>dayLine(r,['sunset','']).join('');return JSON.stringify([L(w),elemKey(f)==='fireB'?L(f):'夜'])})()`);
  const SS=JSON.parse(ss);assert.ok(/葉っぱ|木のかげ/.test(SS[0]),'wood: '+SS[0]);assert.ok(/夜/.test(SS[1]),'fire: '+SS[1]);
  assert.deepEqual(errors,[]);console.log('volcano-intro ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
