/* お話の中の質問（talk-ask.js）：ボタンで答える・答えで返事がかわる・好きな答えが同じなら、たのしさ+5・あとの雑談で思い出す・ぜんぶ聞くまで同じ質問をしない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;
    const a=S.res[0];a.hunger=hMax(a);a.energy=100;a.came=0;a.grief=0;a.fun=40;a.ask={};S.t=Math.floor(S.t/1440)*1440+13*60;
    const n=askList(a).length,seen=new Set();let dup=0;
    for(let i=0;i<n;i++){const L=askLine(a),c=L[0][1];const Q=askList(a).find(q=>c.q===chatTone(q.q,a,0));if(!Q||seen.has(Q.k))dup++;seen.add(Q.k);c.pick(i%c.opts.length)}
    const allAsked=Object.keys(a.ask).length,none=askLine(a);
    a.ask={};const L=askLine(a),c=L[0][1],Q=askList(a).find(q=>c.q===chatTone(q.q,a,0)),own=askOwn(a,Q),oth=(own+1)%Q.o.length;
    const f0=a.fun;c.pick(oth);const fOther=a.fun-f0;delete a.ask[Q.k];const f1=a.fun;c.pick(own);const fSame=a.fun-f1;
    const rOwn=c.opts[own].lines.map(x=>x[1]).join('/'),rOth=c.opts[oth].lines.map(x=>x[1]).join('/');
    const P0=[];askMemTopics(a,P0);a.ask[Q.k][1]-=2;const P1=[];askMemTopics(a,P1);
    return JSON.stringify({n,dup,allAsked,none:!!none,fOther,fSame,rOwn,rOth,mem0:P0.length,mem1:P1.map(p=>p[1][0])})})()`));
  console.log(JSON.stringify(r));

  assert.equal(r.fOther,0,'different answer: no fun');assert.equal(r.fSame,5,'same answer: fun+5');
  assert.notEqual(r.rOwn,r.rOth,'reply depends on the answer');assert.ok(/おそろい/.test(r.rOwn));
  assert.equal(r.mem0,0,'not remembered on the same day');assert.equal(r.mem1.length,1,'remembered after 2 days');
  /* 会話の画面：質問が出て、ボタンで答えると返事がつづく */
  const ui=JSON.parse(await run(`(async()=>{const a=S.res[0];a.ask={};const R=Math.random;Math.random=()=>0;DLGTAP=0;try{talkTo(a)}finally{Math.random=R}
    const W=ms=>new Promise(f=>setTimeout(f,ms));let bt=[];for(let i=0;i<40&&!bt.length;i++){await W(150);const b=document.querySelector('#dlgNext')||document.querySelector('#dlgBtns button[data-nx]');bt=[...document.querySelectorAll('#dlgBtns button:not([data-nx])')];if(!bt.length&&b)b.click()}
    const q=document.querySelector('#dlgText').textContent,n=bt.length;for(let k=0;k<3&&n&&!Object.keys(a.ask).length;k++){bt[0].click();await W(300)}
    return JSON.stringify({q,n,ans:!!(a.ask&&Object.keys(a.ask).length)})})()`));
  console.log(JSON.stringify(ui));
  assert.ok(ui.n>=2,'choice buttons are shown');assert.ok(ui.ans,'answer is kept');
  assert.deepEqual(errors,[]);await browser.close();console.log('Talk: questions OK');
})().catch(e=>{console.error(e);process.exit(1)});
