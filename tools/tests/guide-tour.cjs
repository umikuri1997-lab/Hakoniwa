/* 水のせいれいの案内役をえらんだら、2人で村をまわりおわるまで、つぎのメインクエストを出さない。ヨルノオオカゲがいるあいだは、たたかいの曲 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;S.enemyOn=false;
    const f=S.res[0];S.res.push(mkRes(S,MINA,'earth',f.x+1,f.y),mkRes(S,keyName('water')||'アオ','water',f.x+2,f.y));for(const r of S.res){r.nap=false;r.hunger=hMax(r);r.act=null}
    S.obj[(f.y|0)*W+(f.x|0)+5]='crate';recount();S.quest=qsIx('waterFilm');S.qTalked=false;S.qStory=null;`);
  /* 1. あんないをはじめる（えらぶ場面の pick と同じ） */
  const a=JSON.parse(await run(`(()=>{const w=S.res.find(r=>r.elem==='water');choiceGuide().pick(MINA);checkQuest();const q=QUESTS[S.quest];return JSON.stringify({tour:!!S.tour,talk:TALKW,wait:mainTalkWaitText(q),g:S.tour&&S.res.find(r=>r.id===S.tour.g).name})})()`));
  assert.equal(a.tour,true);assert.equal(a.talk,null,'no next quest talk during the tour');assert.match(a.wait,/あんない/);
  console.log('during tour:',a.wait);
  /* 2. まわりおわるまで、ゲームを進める */
  const b=JSON.parse(await run(`(()=>{let n=0,walked=0,called=0;const g=S.res.find(r=>r.name===MINA),p0=[g.x,g.y];for(;n<6000&&S.tour;n++){S.t+=.1;for(const r of S.res)updRes(r,.1);if(S.tour&&g.act&&g.act.type==='tourgo')walked=1;if(S.tour&&n%20===0){checkQuest();if(S.res.some(r=>storyCalled(r)))called=1}}
    checkQuest();return JSON.stringify({steps:n,tour:!!S.tour,walked,called,wait:mainTalkWaitText(QUESTS[S.quest]),moved:Math.hypot(g.x-p0[0],g.y-p0[1])>2})})()`));
  assert.equal(b.tour,false,'tour ends');assert.equal(b.walked,1,'guide walked the village');assert.doesNotMatch(b.wait,/あんない/,'next quest goes on after the tour');assert.equal(b.moved,true);assert.equal(b.called,0,'nobody is called to the story during the tour');
  console.log('after tour:',b.wait,'(game minutes',(b.steps*.1).toFixed(0)+')');
  /* 3. 曲 */
  const m=JSON.parse(await run(`(()=>{const a=stageSong();S.enemies=[{type:'boss2',spawned:true,dead:false,x:0,y:0}];const b=stageSong();S.enemies[0].dead=true;const c=stageSong();S.enemies=[];return JSON.stringify([a,b,c,SONGS.battle.mel.reduce((s,x)=>s+x[1],0)])})()`));
  assert.equal(m[1],'battle');assert.notEqual(m[0],'battle');assert.notEqual(m[2],'battle');assert.equal(m[3],64);
  console.log('music:',m.slice(0,3).join(' → '));
  /* オオカゲがいるあいだは、夜の曲のアレンジ（nightB）。鳴らしてもエラーにならない */
  const bm=JSON.parse(await run(`(()=>{const r0=S.res[0],bj=window.__bj=((r0.y|0)+2)*W+(r0.x|0)+2;S.obj[bj]='bench';recount();S.enemies=[{type:'boss',spawned:true,dead:false,x:2.5,y:2.5}];const far=stageSong();S.enemies[0].x=bj%W+.5;S.enemies[0].y=(bj/W|0)+1.5;const a=stageSong();S.enemies[0].x=2.5;S.enemies[0].y=2.5;const stay=stageSong();if(far==='nightB'||stay!=='nightB')throw Error('near rule '+far+' '+stay);S.enemies=[];const c=stageSong();
    let err='';try{audioInit();curSong=wantSong='nightB';step=0;if(AC&&AC.state==='running')sched()}catch(e){err=e.message}return JSON.stringify([a,c,err])})()`));
  assert.equal(bm[0],'nightB');assert.equal(await run(`(()=>{S.enemies=[{type:'hino',spawned:true,dead:false,x:window.__bj%W+.5,y:(window.__bj/W|0)+1.5}];const a=stageSong();S.enemies=[];return a+'|'+SONGS.hino.mel.reduce((s,x)=>s+x[1],0)})()`),'hino|64','hino song');assert.notEqual(bm[1],'nightB');assert.equal(bm[2],'');console.log('boss music:',bm[0]);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
