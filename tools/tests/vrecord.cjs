/* 村の記録：仕事のおわり・コワイノを数える・節目でパワー（思い出帳には出さない。日記におきかえた） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const out={};const a=S.res[0];
    const p0=S.pt;for(let i=0;i<9;i++)vrecNote(a,{type:'chop'});out.p9=S.pt-p0;vrecNote(a,{type:'chop'});out.p10=S.pt-p0;out.chop=S.vrec.chop;
    vrecNote(a,{type:'tag'});out.chat=S.vrec.chat;vrecNote(a,{type:'walk'});out.walk=S.vrec.walk;
    for(let i=0;i<40;i++)vrecAdd('chop');out.p50=S.pt-p0;
    /* 仕事を動かすと、数がふえる */const c0=S.vrec.chop;const act={type:'idle',t:0,dur:1,stage:'do'};a.act=act;
    openSheet('menu','record');out.sec=[...document.querySelectorAll('.sheet h3')].some(e=>e.textContent==='村の記録');closeSheet();
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.p9,0);assert.equal(r.p10,5,'10回でパワー5');assert.equal(r.chop,10);assert.equal(r.chat,1);assert.equal(r.walk,undefined);
  assert.equal(r.p50,15,'50回でパワー10');assert.equal(r.sec,false,'思い出帳に村の記録の章はない');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
