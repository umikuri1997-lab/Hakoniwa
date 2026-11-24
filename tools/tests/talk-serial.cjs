/* お話のつづきもの（talk-serial.js）：お話しした日が3日ふえるごとに、つぎの回・読んだらすむ・5回めのあと手紙・キーキャラは話さない */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;S.letterQ=[];
    const a=S.res[0],b=mkRes(S,'ハル','earth',a.x+1.5,a.y);S.res.push(b);for(const q of S.res){q.hunger=hMax(q);q.energy=100;q.came=0;q.grief=0}
    S.t=Math.floor(S.t/1440)*1440+13*60;const P=srOf(b),key=isKey(a.name)?srOf(a):'nokey';
    b.tdN=0;b.tdD=null;b.sr=0;const seen=[];let early=0;
    for(let day=1;day<=16;day++){b.tdD=null;const L=talkLines(b).map(x=>x[1]).join('/');const hit=P.p.findIndex(ep=>L.includes(chatTone(ep[0],b,0).replace(/#[a-z ]+\\|/,'')));
      if(hit>=0){if(b.tdN<(hit+1)*3)early++;seen.push([b.tdN,hit]);srRead(b,TALKSR)}}
    return JSON.stringify({k:P&&P.k,key:key===null||key==='nokey',seen,early,sr:b.sr,lt:S.letterQ.some(q=>q.id===b.id&&q.k==='serial')})})()`));
  console.log(JSON.stringify(r));
  assert.ok(r.k,'ordinary spirit has a serial');assert.ok(r.key,'key characters have no serial');
  assert.deepEqual(r.seen.map(x=>x[1]),[0,1,2,3,4],'five episodes in order');assert.deepEqual(r.seen.map(x=>x[0]),[3,6,9,12,15],'every 3 talk days');
  assert.equal(r.early,0);assert.equal(r.sr,5);assert.ok(r.lt,'closing letter');
  assert.deepEqual(errors,[]);await browser.close();console.log('Talk: serial OK');
})().catch(e=>{console.error(e);process.exit(1)});
