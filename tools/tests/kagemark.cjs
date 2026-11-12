/* 大きなかげのあと：まわりの空いた所に出す。あとから物が生えてかくれたら、うつす。目標の一覧から、その場所へ行ける */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.enemyOn=false;for(const q of S.res)q.nap=false;
    S.quest=qsIx('kagemark');S.qTalked=true;S.qStory=null;S.t=1440*3+600;S.flags.kgDay=2;recount();checkQuest();const k0=S.flags.kgMark,open0=kgOpen(k0);
    S.obj[k0+W]='berry';recount();checkQuest();const k1=S.flags.kgMark;
    S.bossKills=1;const draw=!(S.bossKills&&S.flags.kgLook);S.bossKills=0;
    const t=mainStoryFocusTarget();return JSON.stringify({k0,open0,k1,moved:k1!==k0,open1:kgOpen(k1),draw,focus:!!t&&Math.abs(t.x-(k1%W+.5))<.01})})()`));
  console.log(r);
  assert(r.k0!=null&&r.open0,'placed in the open');assert(r.moved&&r.open1,'moves when something grows over it');assert(r.draw,'still drawn before it is looked at');assert(r.focus,'goal list goes there');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
