/* 夜、ひろった物を持ったせいれいは、箱にしまってから見張り台へ行く（しまいにいく行動を夜にやめさせると、くりかえして動けなくなる） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.enemyOn=true;USERPAUSE=true;
    const f=S.res[0];f.nap=false;const w=mkRes(S,'テスト','earth',f.x+1.5,f.y+.5);S.res.push(w);w.hunger=hMax(w);w.energy=100;
    const cx=f.x|0,cy=f.y|0;S.obj[(cy+3)*W+cx+4]='mbox';const wj=(cy+8)*W+cx+4;S.obj[wj]='watch';setParts('watch',wj,'part');S.inv.arrow=20;recount();
    S.t=1440*2+23.5*60;w.citem={'seed:mugi':1};endAct(w);w.act=null;
    const L=[];for(let i=0;i<2000&&!(w.act&&w.act.type==='watchpost');i++){S.t+=.05;updRes(w,.05);if(w.act&&L[L.length-1]!==w.act.type)L.push(w.act.type)}
    return JSON.stringify({seq:L,left:w.citem,inv:S.inv['seed:mugi']||(S.cseed||{}).mugi||0,act:w.act&&w.act.type})})()`));
  console.log(r);
  assert.equal(r.act,'watchpost','reaches the watch tower');assert(r.seq.includes('sitem'),'stores the item first');assert(!r.left||!r.left['seed:mugi'],'item stored');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
