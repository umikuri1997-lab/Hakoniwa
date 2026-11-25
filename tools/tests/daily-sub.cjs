/* デイリーのサブクエスト（順番の決まっていないサブクエスト、1日に3つまで・受けているのも3つまで・同じ子は1つずつ）：メインの会話や、順番の決まったサブクエストがあっても出る。話しかけなかったおねがいは、つぎの朝にかわる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const o=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;S.t=1440*3+600;const f=S.res[0];
    S.res.push(mkRes(S,NODOKA,'earth',f.x+1,f.y),mkRes(S,keyName('fire')||'ホノ','fire',f.x+2,f.y),mkRes(S,'テスト','wood',f.x+3,f.y));for(const r of S.res){r.nap=false;r.act=null}
    S.subDone={};S.subSt={};S.subSeen={};S.randomRequestDay=-1;S.dailyDay=null;S.dailyN=0;S.subTalkAt=null;
    const SL=subList(),daily=SL.filter(q=>subDaily(q)&&keyName(q.g)&&q.at()&&subMainOK(q)),gv=new Set(daily.map(q=>subWho(q))).size;
    /* メインのお礼の会話を待っていても、順番の決まったサブがおねがいの途中でも、デイリーは出る */
    S.qStory=S.quest;const sch=SL.find(q=>!subDaily(q));S.subSt[sch.k]=1;
    checkSub();const d1=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).map(q=>q.k);
    const givers=new Set(d1.map(k=>subWho(SL.find(q=>q.k===k)))).size;
    /* 同じ日には、もう出さない。3つ受けているあいだは、つぎの日も出さない */
    for(const k of d1)S.subSt[k]=2;checkSub();const d2=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).length;
    S.t+=1440;checkSub();const d3=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).length;
    /* 1つおわったら、つぎの日に1つ出る */
    S.subSt[d1[0]]=4;S.subDone[d1[0]]=1;S.t+=1440;checkSub();const n4=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).map(q=>q.k),d4=n4.length;
    /* 話しかけなかったおねがいは、つぎの朝にほかの物にかわる */
    S.t+=1440;checkSub();const n5=SL.filter(q=>subDaily(q)&&S.subSt[q.k]===1).map(q=>q.k),swap=n5.length===1;
    S.qStory=null;return JSON.stringify({cand:daily.length,gv,d1:d1.length,givers,d2,d3,d4,swap,sch:S.subSt[sch.k]})})()`));
  console.log(o);assert.ok(o.cand>=2,'candidates');assert.equal(o.d1,Math.min(3,o.gv));assert.equal(o.givers,o.d1,'同じ子は1つずつ');assert.equal(o.d2,0);assert.equal(o.d3,0);assert.equal(o.d4,1);assert.ok(o.swap);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
