/* 土のステージのお話の前半（PR2a）：巣穴から洞窟へ → 1階の坂のかべの彫り絵1 → 村の、くずれた岩の山がくずれて土地がひらく → そこにいるコノハをむかえる → ひらいた土地にオリーブの苗をうえる。
   岩の山は7つ（階ごとに1つ）・こわせない・まだ見ていない彫り絵の階へはトトもいっしょ・巣穴から、見つけた彫り絵をまた見られる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  const talk=async()=>{for(let k=0;k<200;k++){const st=await run(`(()=>{if(!document.querySelector('#dialog').hidden||DLGQ.length){DLGGAP=0;DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const c=!document.querySelector('#dialog').hidden&&document.querySelector('#dialog button');if(c){c.disabled=false;c.click()}else dlgNext();return 'dlg'}return 'none'})()`);if(st==='none')return;await page.waitForTimeout(150)}throw new Error('会話がおわらない '+await run(`JSON.stringify({h:document.querySelector('#dialog').hidden,q:DLGQ.length,t:(document.querySelector('#dialog')||{}).textContent.slice(0,120),btn:[...document.querySelectorAll('#dialog button')].map(b=>b.textContent+(b.disabled?'x':''))})`))};
  const r0=await J(`(()=>{const R=S.ts.rub,j=R[1].cells[0];removeAt(j%W,(j/W)|0);return{n:R.length,cells:R.map(p=>p.cells.length),west:R[0].c%W<tsRiftAt((R[0].c/W)|0),obj:R.every(p=>p.cells.every(k=>S.obj[k]==='tsrubble')),noRm:S.obj[j]==='tsrubble',noWalk:!walk(j),quests:QUESTS.map(q=>q.id)}})()`);
  console.log(JSON.stringify(r0));assert.equal(r0.n,7,'岩の山は7つ');assert.ok(r0.cells.every(n=>n>=26));assert.ok(r0.west,'1つめは地われの西がわ');assert.ok(r0.obj&&r0.noRm&&r0.noWalk,'岩の山はこわせない・歩けない');
  assert.deepEqual(r0.quests,['statue','tscave1','tskonoha','tsolive']);
  /* 神殿のあと：トトの「巣穴のおくへ」 */
  await run(`(()=>{S.quest=1;S.qTalked=false;S.qStory=null;S.t=Math.floor(S.t/1440)*1440+1440+9*60;checkQuest();if(TALKW!==TOTO)throw new Error('TALKW '+TALKW);startTalk()})()`);await talk();
  const c0=await J(`(()=>{tsTap(S.ts.hole);const pop=document.querySelector('.pxpopw');const sel=pop&&[...pop.querySelectorAll('.slot.sel .nm')].map(e=>e.textContent);pop&&pop.remove();return{acc:qAt('tscave1'),sel}})()`);
  console.log(JSON.stringify(c0));assert.ok(c0.acc);assert.ok(c0.sel&&c0.sel[0]==='トト','トトがはじめからえらばれている');
  /* 洞窟の1階：坂のそばのかべに彫り絵。坂まで行くと、大きな1まい → トトの会話 → 「下へおりる坂を見つけた」 */
  const v0=await J(`(()=>{const t=S.res.find(r=>r.name===TOTO);caveEnter([t],{},0);const C=CV;let R=-1;for(const[j,o]of C.ob)if(o.k==='R')R=j;const a=C.party[0];a.x=cvX(R)+.5;a.y=cvY(R)+.5+CVOY;a.path=[];cvClearCheck();return{carve:!!C.carve,wall:C.carve&&!C.g[C.carve.j]&&C.g[C.carve.j+CVW],near:C.carve&&Math.hypot(cvX(C.carve.j)-cvX(R),cvY(C.carve.j)-cvY(R))<6}})()`);
  console.log(JSON.stringify(v0));assert.ok(v0.carve&&v0.wall&&v0.near,'坂のそばの、正面の見える岩に彫り絵');
  await page.waitForTimeout(1800);
  const v1=await J(`(()=>{const p=document.querySelector('.pxpopw');const t=p&&p.querySelector('.ppt').textContent,im=!!(p&&p.querySelector('canvas'));const b=p&&[...p.querySelectorAll('button')].find(b=>b.textContent==='つぎへ');b&&b.click();return{t,im}})()`);
  console.log(JSON.stringify(v1));assert.equal(v1.t,'あなぐまと子たち');assert.ok(v1.im,'大きな1まいの絵');
  await talk();await page.waitForTimeout(1800);
  const v2=await J(`(()=>{const c=document.querySelector('.idea-reveal');const h=c&&c.querySelector('h2').textContent;if(c){c.remove();GIFT_ACTIVE=false}const seen=(S.ts.carve||[]).slice();caveExit(true);document.querySelectorAll('.pxpopw').forEach(e=>e.remove());return{h,seen,clr:S.cvClr}})()`);
  console.log(JSON.stringify(v2));assert.equal(v2.h,'下へおりる坂を見つけた！');assert.deepEqual(v2.seen,[0]);assert.equal(v2.clr,1);
  /* 村にもどると、1つめの岩の山がくずれて、コノハがいる */
  await run(`(()=>{camAnim=null;tsTick()})()`);await page.waitForTimeout(5000);
  const o1=await J(`(()=>{const P=S.ts.rub[0],k=S.res.find(r=>r.name===KONOHA);return{open:P.open,left:P.cells.filter(j=>S.obj[j]==='tsrubble').length,ko:S.obj[P.c],kon:!!k&&k.tsWait===1,others:S.ts.rub.slice(1).every(p=>!p.open),q:S.quest,qs:S.qStory}})()`);
  console.log(JSON.stringify(o1));assert.equal(o1.open,1);assert.equal(o1.left,0,'岩がのこらない');assert.equal(o1.ko,'tskonoki');assert.ok(o1.kon,'コノハが待っている');assert.ok(o1.others);assert.equal(o1.q,2);assert.equal(o1.qs,1);
  await run(`startTalk()`);await talk();
  /* コノハは、話しかけるまで、たおれたオリーブのそばから動かない */
  await run(`(()=>{for(let i=0;i<60;i++)stepWorld(2)})()`);
  const k1=await J(`(()=>{const k=S.res.find(r=>r.name===KONOHA),j=S.ts.kon;checkQuest();return{at:Math.floor(k.y)*W+Math.floor(k.x)===j,talkw:TALKW}})()`);
  console.log(JSON.stringify(k1));assert.ok(k1.at,'コノハは待っている');assert.equal(k1.talkw,'コノハ');
  await run(`startTalk()`);await talk();
  const k2=await J(`(()=>{const k=S.res.find(r=>r.name===KONOHA);const nq=NEWQ.length;NEWQ.length=0;NEWRES=null;HOLD.clear();checkQuest();return{wait:k.tsWait,nq,q:QUESTS[S.quest].id}})()`);
  console.log(JSON.stringify(k2));assert.equal(k2.wait,0);assert.equal(k2.nq,1,'なかまの紹介');assert.equal(k2.q,'tsolive');
  /* オリーブの苗：コノハの会話で3本もらい、ひらいた土地に3本育ったら */
  await run(`(()=>{checkQuest();startTalk()})()`);await talk();
  const l1=await J(`(()=>{const inv=S.inv&&S.inv.tree;const P=S.ts.rub[0];let n=0;for(const j of P.cells)if(n<3&&!S.obj[j]&&j!==S.ts.kon){S.obj[j]='tree';n++}const pg=QUESTS[S.quest].prog();checkQuest();return{inv,pg,q:S.quest,qs:S.qStory}})()`);
  console.log(JSON.stringify(l1));assert.ok(l1.inv>=3,'オリーブの苗3本');assert.equal(l1.pg,'ひらいた土地のオリーブ 3/3');assert.equal(l1.qs,3);
  await run(`startTalk()`);await talk();
  /* 巣穴をタップ：洞窟へ出かける・見つけた彫り絵 */
  const h1=await J(`(()=>{document.querySelectorAll('.pxpopw').forEach(e=>e.remove());tsTap(S.ts.hole);const p=document.querySelector('.pxpopw'),b=p?[...p.querySelectorAll('button')].map(b=>b.textContent):[];p&&p.remove();return b})()`);
  console.log(JSON.stringify(h1));assert.ok(h1.includes('洞窟へ出かける')&&h1.includes('あなぐまと子たち'));
  /* 古いセーブ（岩の山のない土のセーブ）：読みかえで岩の山ができる */
  const m1=await J(`(()=>{const s=JSON.parse(JSON.stringify({ts:{hole:S.ts.hole},ground:S.ground,hi:S.hi,obj:S.obj.map(o=>o==='tsrubble'||o==='tskonoki'?'':o),floor:S.floor,dyn:{},hp:{},mig:10}));runMigrations(s);return{n:s.ts.rub&&s.ts.rub.length,mig:s.mig}})()`);
  console.log(JSON.stringify(m1));assert.equal(m1.n,7);assert.equal(m1.mig,11);
  await page.waitForTimeout(300);assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
