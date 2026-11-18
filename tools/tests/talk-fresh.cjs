/* せいれいとのお話（talkLines）：あいさつ・おわりの文・話題は、ぜんぶ使うまで同じ物を出さない（村のせいれいみんなで、S.tkU・S.tkS におぼえる） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;
    const a=S.res[0],b=mkRes(S,'ハル','earth',a.x+1.5,a.y);S.res.push(b);for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.came=0;r.grief=0}S.t=Math.floor(S.t/1440)*1440+13*60;S.tkU={};S.tkS=[];
    const hi=[],bye=[],body=[];let dHi=0,dBody=0;const nHi=TALKHI.day.length;
    for(let i=0;i<nHi;i++){const r=i%2?b:a,L=talkLines(r);const h=L[0][1];if(hi.includes(h))dHi++;hi.push(h);body.push(L.slice(1).map(x=>x[1]).join('/'))}
    const B=[];for(let i=0;i<TALKBYE.length;i++)B.push(tkFresh('byeT',TALKBYE));
    for(let i=0;i<40;i++){const t=body[i];if(t&&body.indexOf(t)!==i)dBody++}
    const g=[];for(let i=0;i<30;i++)g.push(smallTalk(a).join('/'));
    return JSON.stringify({dHi,byeU:new Set(B).size,byeN:TALKBYE.length,dBody,gU:new Set(g).size,n:{hi:Object.fromEntries(Object.entries(TALKHI).map(([k,v])=>[k,v.length])),bye:TALKBYE.length,g:TALKG.length,u:Object.fromEntries(Object.entries(TALKU).map(([k,v])=>[k,v.length]))}})})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.dHi,0,'greetings do not repeat until all are used');
  assert.equal(r.byeU,r.byeN,'goodbye lines do not repeat until all are used');
  assert.equal(r.gU,30,'small talk does not repeat');
  for(const k in r.n.hi)assert.ok(r.n.hi[k]>=10,'greetings '+k);assert.ok(r.n.bye>=20);
  assert.deepEqual(errors,[]);await browser.close();console.log('Talk: fresh lines OK');
})().catch(e=>{console.error(e);process.exit(1)});
