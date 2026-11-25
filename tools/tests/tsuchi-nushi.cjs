/* 土のお話のおわり（tsuchi-nushi.js）：トトが根になったあと、村で巣穴の南にトトの根が出る → つぎの日の昼、みんなが根のそばに集まり、
   ハニが子どものあなぐま（あたらしい谷のヌシ様）になって、根のとなりにすわる → クリア。根になったあとは、夜にバケモノが来ない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  const talk=async()=>{for(let k=0;k<200;k++){const st=await run(`(()=>{if(!document.querySelector('#dialog').hidden||DLGQ.length){DLGGAP=0;DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const c=!document.querySelector('#dialog').hidden&&document.querySelector('#dialog button');if(c){c.disabled=false;c.click()}else dlgNext();return 'dlg'}return 'none'})()`);if(st==='none')return;await page.waitForTimeout(150)}throw new Error('会話がおわらない')};
  /* じゅんび：トトは根になったあと（tsoku がおわった）。ハニとイブキがいる */
  const a0=await J(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const add=(n,el)=>{if(!S.res.some(r=>r.name===n)){const q=mkRes(S,n+'-t',el,CX+.5,CY+2.5);q.name=n;q.hunger=hMax(q);S.res.push(q)}};add(HANI,'earth');add(IBUKI,'fire');
    S.res=S.res.filter(r=>r.name!==TOTO);for(const P of S.ts.rub||[])P.open=1;S.cvClr=9;S.flags.tsOokDown=1;S.flags.tsBridge=1;S.enemyOn=true;S.enemies=[];
    S.t=Math.floor(S.t/1440)*1440+15*60;S.ts.totoRoot=dayNo()+1;S.quest=questIndexOf('tsnushi');S.qTalked=true;
    const L=['basic','basic','basic','basic','basic','basic'];tsBkWave(L);
    return{q:QUESTS.map(q=>q.id).slice(-3),prog:QUESTS[S.quest].prog(),bk:L.some(t=>EN[t].bk),cleared:!!S.cleared}})()`);
  console.log(JSON.stringify(a0));assert.deepEqual(a0.q,['tsbridge','tsoku','tsnushi']);assert.ok(a0.prog.includes('根'));assert.ok(!a0.bk,'根になったあとは、バケモノは来ない');assert.ok(!a0.cleared);
  /* もどったすぐあと：巣穴の南に根が出る */
  await run(`tsTick()`);await page.waitForTimeout(4000);await talk();
  const a1=await J(`(()=>{const k=S.ts.rootJ;return{k,o:S.obj[k],hole:S.ts.hole,dy:((k/W)|0)-((S.ts.hole/W)|0),gift:GIFT_ACTIVE,prog:QUESTS[S.quest].prog(),walk:walk(k)}})()`);
  console.log(JSON.stringify(a1));assert.equal(a1.o,'tsroot');assert.ok(a1.dy>=1&&a1.dy<=2,'巣穴の南');assert.ok(!a1.gift);assert.equal(a1.prog,'つぎの日の昼に');assert.ok(!a1.walk);
  /* その日は、集まらない */
  await run(`tsTick()`);const a2=await J(`({run:TSNURUN})`);assert.equal(a2.run,false);
  /* つぎの日の昼：みんなが集まって、ハニがヌシ様になる */
  await run(`(()=>{S.t=(Math.floor(S.t/1440)+1)*1440+10*60;tsTick()})()`);
  let done=false;for(let k=0;k<120&&!done;k++){await talk();done=await J(`!!S.ts.haniNushi`);if(!done)await page.waitForTimeout(500)}
  await page.waitForTimeout(2500);await talk();await page.waitForTimeout(500);await run(`tsTick()`);
  const a3=await J(`(()=>{const N=S.ts.haniNushi;return{N:!!N,o:N&&S.obj[N.j],adj:N&&Math.abs(N.j%W-S.ts.rootJ%W)+Math.abs(((N.j/W)|0)-((S.ts.rootJ/W)|0)),hani:S.res.some(r=>r.name===HANI),cleared:!!S.cleared,clr:S.clearDay!=null,end:reflectEnd(),run:TSNURUN}})()`);
  console.log(JSON.stringify(a3));assert.ok(a3.N);assert.equal(a3.o,'tsnushi');assert.ok(a3.adj<=2,'根のとなり');assert.ok(!a3.hani,'ハニは、せいれいとしては村からいなくなる');assert.ok(a3.cleared,'クリア');assert.ok(a3.clr);assert.ok(a3.end.includes('岩の谷'));assert.equal(a3.run,false);
  /* タップでひとこと・こわせない */
  const a4=await J(`(()=>{const j=S.ts.haniNushi.j;DLGTAP=performance.now();const t=tsTap(j);const d=!document.querySelector('#dialog').hidden;return{t,d,mv:NOMOVE.has('tsnushi')&&NOMOVE.has('tsroot')}})()`);
  console.log(JSON.stringify(a4));assert.ok(a4.t&&a4.d&&a4.mv);await talk();
  /* 絵（仮の絵）がエラーなく描ける */
  await run(`(()=>{const c=document.createElement('canvas').getContext('2d');tsDrawObj(c,'tsroot',0,0,S.ts.rootJ,performance.now());tsDrawObj(c,'tsnushi',0,0,S.ts.haniNushi.j,performance.now())})()`);
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
