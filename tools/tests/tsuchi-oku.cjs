/* 土のお話：洞窟のいちばんおく（10階）のトト（tsuchi-oku.js）。石の大橋のあと、ハニといっしょに10階へ → 島の前のトトに近づくと会話 →
   かげのゆりかご（ふれるとねむる・まもりの光5回でねむる）→ トトが大きなあなぐまにもどって根になる → 村へかえる。トトはもどらない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  const talk=async()=>{for(let k=0;k<200;k++){const st=await run(`(()=>{if(!document.querySelector('#dialog').hidden||DLGQ.length){DLGGAP=0;DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const c=!document.querySelector('#dialog').hidden&&document.querySelector('#dialog button');if(c){c.disabled=false;c.click()}else dlgNext();return 'dlg'}return 'none'})()`);if(st==='none')return;await page.waitForTimeout(150)}throw new Error('会話がおわらない')};
  const enter=names=>J(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.t=Math.floor(S.t/1440)*1440+9*60;S.enemies=[];for(const P of S.ts.rub||[])P.open=1;tsOpenReset();GIFT_ACTIVE=false;document.querySelectorAll('.idea-reveal,.pxpopw').forEach(e=>e.remove());const L=${JSON.stringify(names)}.map(n=>S.res.find(r=>r.name===n)).filter(Boolean);caveEnter(L,{},9);const C=CV;C.en=[];return{oku:!!C.oku,party:C.party.map(a=>a.r.name)}})()`);
  const tick=sec=>run(`(()=>{for(let i=0;i<${sec}*30;i++)caveFrame(1/30,performance.now());CV.seen.fill(1);caveRender(performance.now())})()`);
  /* じゅんび：トトはにげたあと（totoGone）。ハニとイブキがいる */
  const a0=await J(`(()=>{const add=(n,el)=>{if(!S.res.some(r=>r.name===n)){const q=mkRes(S,n+'-t',el,CX+.5,CY+2.5);q.name=n;q.hunger=hMax(q);S.res.push(q)}};add(HANI,'earth');add(IBUKI,'fire');
    const t=S.res.find(r=>r.name===TOTO);S.res=S.res.filter(r=>r!==t);S.ts.totoGone=t;S.ts.carve=[0,1,2];S.cvClr=9;S.flags.tsOokDown=1;for(const r of S.res)r.hunger=hMax(r);
    return{q:QUESTS.map(q=>q.id).slice(-2),must:(tsCaveMust()||{}).name}})()`);
  console.log(JSON.stringify(a0));assert.deepEqual(a0.q,['tsbridge','tsoku']);assert.equal(a0.must,undefined,'大橋の前は、ハニはかならずでない');
  /* 大橋の前は、10階にトトはいない */
  const a1=await enter(['ハニ','イブキ']);assert.equal(a1.oku,false);await run(`caveAbort()`);
  /* 大橋のあと：ハニがかならずいっしょ。ハニがいないと、トトはいない */
  await run(`(()=>{S.flags.tsBridge=1;S.quest=questIndexOf('tsoku')})()`);
  const a2=await J(`(()=>({must:(tsCaveMust()||{}).name,prog:QUESTS[questIndexOf('tsoku')].prog()}))()`);console.log(JSON.stringify(a2));assert.equal(a2.must,'ハニ');assert.ok(a2.prog.includes('島'));
  const a3=await enter(['イブキ']);assert.equal(a3.oku,false,'ハニがいないと、場面ははじまらない');await run(`caveAbort()`);
  const a4=await enter(['ハニ','イブキ']);assert.ok(a4.oku);
  const b0=await J(`(()=>{const C=CV,t=C.oku.a;C.seen.fill(1);const shown=cvActorsL(C).includes(t);for(const a of C.party){a.x=t.x;a.y=t.y+4;a.path=[]}return{shown,name:t.r.name}})()`);
  console.log(JSON.stringify(b0));assert.ok(b0.shown);assert.equal(b0.name,'トト');
  await tick(.2);await talk();
  const b1=await J(`(()=>{const C=CV,K=C.oku;return{st:K.st,e:!!K.e&&C.en.includes(K.e)}})()`);console.log(JSON.stringify(b1));assert.equal(b1.st,2);assert.ok(b1.e);
  /* ふれると、ねむる（6秒） */
  const b2=await J(`(()=>{const C=CV,e=C.oku.e,a=C.party[0];a.x=e.x;a.y=e.y+.5;a.path=[];for(let i=0;i<30;i++)caveFrame(1/30,performance.now());const s=a.tsSleep;for(let i=0;i<30*7;i++)caveFrame(1/30,performance.now());return{s,after:a.tsSleep,tgt:cvTarget(C.party[1])===e}})()`);
  console.log(JSON.stringify(b2));assert.ok(b2.s>4);assert.equal(b2.after,0);assert.ok(!b2.tgt,'せいれいは、ゆりかごをねらわない');
  /* まもりの光5回 */
  const b3=await J(`(()=>{const C=CV,e=C.oku.e;const n=[];for(let i=0;i<5;i++){cvLightHit(e.x|0,(e.y-CVOY)|0,1);n.push(C.oku.hit)}return{n,st:C.oku.st,hp:e.hp===e.max}})()`);
  console.log(JSON.stringify(b3));assert.deepEqual(b3.n,[1,2,3,4,5]);assert.equal(b3.st,3);assert.ok(b3.hp,'たおさない');
  for(let k=0;k<40;k++){await talk();const g=await J(`(()=>{if(CV){CV.seen.fill(1);caveRender(performance.now())}return{cv:!!CV}})()`);if(!g.cv)break;await page.waitForTimeout(400)}
  const c1=await J(`(()=>{document.querySelectorAll('.pxpopw').forEach(e=>e.remove());checkQuest();return{cv:!!CV,root:S.ts.totoRoot,gone:!!S.ts.totoGone,toto:cvAll().some(r=>r.name===TOTO),hani:S.res.some(r=>r.name===HANI),done:S.quest>questIndexOf('tsoku'),must:tsCaveMust()}})()`);
  console.log(JSON.stringify(c1));assert.equal(c1.cv,false,'そのまま村へかえる');assert.ok(c1.root>0);assert.ok(!c1.gone&&!c1.toto,'トトはもどらない');assert.ok(c1.hani);assert.ok(c1.done);assert.equal(c1.must,null);
  /* もう一度10階へ：トトはいない・根の絵 */
  const c2=await enter(['ハニ']);assert.equal(c2.oku,false);await tick(.1);await run(`caveAbort()`);
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
