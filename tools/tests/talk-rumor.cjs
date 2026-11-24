/* お話のうわさ（talk-rumor.js）：ほかのせいれいが、きょうしたことを話す・じぶんといっしょにしたことは話さない・けんかを先に話す */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;
    const a=S.res[0],b=mkRes(S,'ハル','earth',a.x+1.5,a.y),c=mkRes(S,'ミナ','water',a.x+2.5,a.y);S.res.push(b,c);for(const q of S.res){q.dl=null;q.hunger=hMax(q);q.energy=100;q.came=0;q.grief=0}
    S.t=Math.floor(S.t/1440)*1440+13*60;S.qr=null;S.tkU={};
    const none=rumorOK(a);dayNote(b,{type:'chat',partner:a.id});const self=rumorOK(a);
    dayNote(b,{type:'chop'});const L=rumorLine(a);
    S.qr={a:b.id,b:c.id};const Lq=rumorLine(a),Lq2=rumorLine(a),inQr=rumorOK(b)&&rumorLine(b)[0].includes('けんか');
    const T=[];for(let i=0;i<30;i++){a.tlk=null;const t=talkLines(a).map(x=>x[1]).join('/');T.push(t)}
    return JSON.stringify({none,self,L,Lq,Lq2,inQr,said:T.some(t=>t.includes('ハル'))})})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.none,false,'no rumor when nobody did anything');assert.equal(r.self,false,'chat with the speaker is not a rumor');
  assert.ok(r.L&&r.L[0].includes('ハル')&&r.L[0].includes('木'),'rumor about chopping');
  assert.ok(r.Lq[0].includes('ハル')&&r.Lq[0].includes('ミナ'),'quarrel first');assert.ok(!r.Lq2[0].includes('けんか')&&!r.Lq2[0].includes('目も合わせない'),'quarrel once a day');
  assert.equal(r.inQr,false,'one of the quarrel does not gossip about it');
  assert.ok(r.said,'rumor shows up in talk');
  assert.deepEqual(errors,[]);await browser.close();console.log('Talk: rumors OK');
})().catch(e=>{console.error(e);process.exit(1)});
