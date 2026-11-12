/* ヌシ様の足あと（lv5）：ぜんぶ霧の中なら、1つを晴れた所（村の外の、フタバが歩いて行ける所）へうつす。目標の一覧から、その足あとへ行ける。霧の中の足あとの印は、霧の上に描く。タップすると、フタバが歩いて行って、たどる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  /* 依頼の会話：フウがいれば、フウが足あとを見たと話す。聞きおえたら printFuu */
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.enemyOn=false;for(const q of S.res)q.nap=false;
    const p=S.res[0];S.res.push(mkRes(S,FIXK0.wind,'wind',p.x+1,p.y));S.quest=qsIx('lv5');S.qTalked=false;S.qStory=null;S.t=1440*3+480;recount();window.LOG=[];const d0=dialog;dialog=(L,cb)=>{LOG.push(...L.map(l=>l[0]+':'+l[1]));return d0(L,cb)}})()`);
  const tl=JSON.parse(await run(`JSON.stringify(QUESTS[S.quest].talk.lines.map(l=>l[0]))`));assert(tl.includes('フウ'),'Fuu speaks in the request');
  await run(`S.qTalked=true;QUESTS[S.quest].talk.done()`);assert.equal(await run('S.flags.printFuu'),1);
  const r=JSON.parse(await run(`(()=>{const fog0=printList().every(f=>fogAt(f.j));QUESTS[S.quest].check();
    const L=printList(),open=L.filter(f=>!fogAt(f.j)),k=open.length?open[0].j:-1,t=mainStoryFocusTarget();
    const p=S.res.find(r=>r.name===POKO),G=bfs(p.x|0,p.y|0);QUESTS[S.quest].check();
    return JSON.stringify({fog0,n:L.length,open:open.length,vill:k>=0&&!!VILL[k],reach:k>=0&&G.dist[k]>=0,focus:!!t&&Math.abs(t.x-(k%W+.5))<.01,flag:S.flags.printNear,open2:printList().filter(f=>!fogAt(f.j)).length,k})})()`));
  console.log(r);
  assert.equal(r.n,3);assert.equal(r.open,1,'one moved out of the fog');assert(!r.vill,'outside the village');assert(r.reach,'Futaba can walk there');
  assert(r.focus,'goal list goes there');assert.equal(r.open2,1,'moves only once');
  /* あしあとの絵は、つぎのあしあとのほうを向く（さいごは、来た向きのまま） */
  const dir=JSON.parse(await run(`(()=>{const C=printChain(),d=(a,b)=>{const dx=b%W-a%W,dy=(b/W|0)-(a/W|0);return Math.abs(dx)>Math.abs(dy)?(dx>0?'~r':'~l'):(dy>0?'~d':'')};
    return JSON.stringify({first:C[0]===S.flags.printNearJ,ok:C.every((j,n)=>printDir(j)===(n<C.length-1?d(j,C[n+1]):d(C[n-1],j))),chips:['~r','~d','~l'].every(k=>!!chipOf('nushiprint'+k)),next:printNext(C[0])===C[1]})})()`));
  console.log(dir);assert(dir.first&&dir.ok&&dir.chips&&dir.next,'footprints face the next one');
  /* つぎの足あとは、向いているほうのまっすぐ先（15〜40マス・横へのずれは3割まで）にある */
  const line=JSON.parse(await run(`(()=>{const C=printChain(),U={'':[0,-1],'~r':[1,0],'~d':[0,1],'~l':[-1,0]};return JSON.stringify({ord:!!S.flags.printLine&&JSON.stringify(S.flags.printOrd)===JSON.stringify(C),n:C.length,
    ok:C.slice(0,-1).every((j,n)=>{const q=C[n+1],[ux,uy]=U[printDir(j)],dx=q%W-j%W,dy=(q/W|0)-(j/W|0),a=dx*ux+dy*uy,b=Math.abs(dx*uy-dy*ux);return a>=15&&a<=40&&b<=a*.3}),fog:C.slice(1).map(j=>fogAt(j))})})()`));
  console.log(line);assert(line.ord&&line.n===3&&line.ok,'next footprint lies ahead in the facing direction');
  /* 霧の上の印（描いてもエラーにならない） */
  await run(`(()=>{const f=printList().find(f=>fogAt(f.j));panTo(f.j%W+.5,(f.j/W|0)+.5)})()`);await page.waitForTimeout(800);
  /* タップすると、フタバが歩いて行って、たどる */
  assert(await run(`fogTap(${r.k%108},${(r.k/108)|0})`)!==false);
  const t0=Date.now();let done=false;while(Date.now()-t0<120000){if(await run('printN()')>=1){done=true;break}
    await run(`(()=>{S.enemyOn=false;if(isNight())S.t=Math.ceil(S.t/1440)*1440+480;if(!document.querySelector('#dialog').hidden){DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil)b.click()}})()`);await page.waitForTimeout(100)}
  assert(done,'Futaba traced the moved footprint');
  const lg=JSON.parse(await run('JSON.stringify(LOG)'));assert(lg.some(l=>l.includes('フウが見たのは'))&&lg.some(l=>l.includes('こっちへ歩いていった')),'first footprint: Fuu found it, this way');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
