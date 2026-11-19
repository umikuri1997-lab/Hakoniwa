/* ボスが来ることがわかる：オオカゲの日数は、ほかの目標の進みぐあいといっしょに上の欄に出る／
   ヌシのかけらの2つめは、ささげる前にたしかめる（「あとで」なら、ささげない。「ささげる」でささげる） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const J=async s=>JSON.parse(await run(s));
  await run(`(()=>{document.querySelector('#dialog').hidden=true;USERPAUSE=true;S.introSeen=true;S.flags.tapped=1;S.flags.minaCame=true;S.hold=0;resetVillageTransient();dialog=()=>{};talkOnce=()=>{};
    S.enemyOn=true;S.t=1440*20+10*60;for(const [el,n] of [['earth',MINA],['fire',FIXK0.fire],['water','アオ']])S.res.push(mkRes(S,n,el,44,58));recount()})()`);
  /* 1. オオカゲ：村レベルがまだでも、来るまでの日数が出る */
  const a=await J(`(()=>{S.quest=questIndexOf('ookage');S.qTalked=true;S.qStory=null;S.lv=2;S.bossKills=0;S.bossWarn=dayNo();S.res4Since=dayNo()-5;const q=QUESTS[S.quest];return JSON.stringify({p:q.prog()})})()`);
  assert.match(a.p,/いま 村レベル2/);assert.match(a.p,/オオカゲ：あと3日/,'the boss countdown must show with the other steps');
  console.log('Ookage: the countdown shows next to the village level step: '+a.p);
  /* 2. ヌシのかけらの2つめ：たしかめる */
  const b=await J(`(()=>{if(!S.res.some(r=>r.name===POKO))S.res.push(mkRes(S,POKO,'wood',44,58));S.quest=questIndexOf('nushi');S.qTalked=true;S.shards=2;S.setSh=1;S.flags.finalReadyDay=dayNo()-1;
    while(S.res.length<5)S.res.push(mkRes(S,'ためし'+S.res.length,'wood',44,58));sacredRootEnsure();growStoryTree();recount();let off=0;sacredOfferShard=(j,d)=>{off++};
    const j=S.obj.indexOf('tower');sacredTreeTap(j);const ask=document.querySelector('.askyn'),txt=ask&&ask.querySelector('p').textContent;sacredTreeTap(j);const n=document.querySelectorAll('.askyn').length;
    ask.querySelectorAll('button')[0].click();const later=off;sacredTreeTap(j);{const y=document.querySelector('.askyn').querySelectorAll('button')[1];y._held=1;y.click();y._held=0}
    S.setSh=0;S.shards=1;sacredTreeTap(j);const first=document.querySelectorAll('.askyn').length;return JSON.stringify({txt,n,later,yes:off,first,j})})()`);
  assert.ok(b.j>=0,'the sacred tree exists');assert.match(b.txt||'',/今夜にも/);assert.equal(b.n,1,'tapping twice opens one question');assert.equal(b.later,0,'"あとで" must not offer the shard');assert.equal(b.yes,2,'"ささげる" offers the shard; the first shard is offered without the question');assert.equal(b.first,0);
  console.log('Second shard: asked once before offering ('+b.txt+')');
  assert.deepEqual(errors,[],'no page errors');await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
