/* デイリーのサブクエスト（順番の決まっていないサブクエスト、1日に1つ）：メインの会話や、順番の決まったサブクエストがあっても出る。たしかめるのは、デイリーどうしの重なりだけ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const o=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;S.t=1440*3+600;const f=S.res[0];
    S.res.push(mkRes(S,MINA,'earth',f.x+1,f.y),mkRes(S,keyName('fire')||'ホノ','fire',f.x+2,f.y),mkRes(S,'テスト','wood',f.x+3,f.y));for(const r of S.res){r.nap=false;r.act=null}
    S.subDone={};S.subSt={};S.subSeen={};S.randomRequestDay=-1;S.subTalkAt=null;
    const SL=subList(),daily=SL.filter(q=>subDaily(q)&&keyName(q.g)&&q.at()&&subMainOK(q));
    /* メインのお礼の会話を待っていても、順番の決まったサブがおねがいの途中でも、デイリーは出る */
    S.qStory=S.quest;const sch=SL.find(q=>!subDaily(q));S.subSt[sch.k]=1;
    checkSub();const d1=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).map(q=>q.k);
    /* 同じ日には、もう1つ出さない。デイリーを受けているあいだは、つぎの日も出さない */
    for(const k of d1)S.subSt[k]=2;checkSub();const d2=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).length;
    S.t+=1440;checkSub();const d3=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).length;
    /* デイリーがおわったら、つぎの日にまた出る */
    for(const k of d1){S.subSt[k]=4;S.subDone[k]=1}S.t+=1440;checkSub();const d4=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).length;
    S.qStory=null;return JSON.stringify({cand:daily.length,d1:d1.length,d2,d3,d4,sch:S.subSt[sch.k]})})()`));
  console.log(o);assert.ok(o.cand>=2,'candidates');assert.equal(o.d1,1);assert.equal(o.d2,0);assert.equal(o.d3,0);assert.equal(o.d4,1);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
