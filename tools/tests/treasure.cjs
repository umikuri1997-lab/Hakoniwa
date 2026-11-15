/* 宝の地図・ふしぎなふくろ：切れはし3こで地図・ひらくと宝の場所・せいれいがほって、ふくろと家具（設計図）・ふくろをあけると何かが出る・もちものの画面・落とし物のえらび */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;
    const out={};
    /* 箱にしまうと、もちものに入る */
    stowItem('mapPc',2,a);out.pc2=S.mapPc;mapJoin();out.joinFail=S.tmap||0;stowItem('mapPc',1,a);mapJoin();out.pc=S.mapPc;out.tmap=S.tmap;
    /* もちものの画面 */
    openSheet('inv');out.slots=[...document.querySelectorAll('.sheet .slot .nm')].map(e=>e.textContent).filter(t=>/地図|ふくろ/.test(t));closeSheet();
    /* ひらく：村の外の、行ける空き地 */
    mapOpen();out.tx=S.tx;const j=S.tx;out.far=j!=null&&!VILL[j]&&!S.obj[j]&&walk(j);out.tmapLeft=S.tmap;mapOpen();out.once=S.tx===j;
    /* 箱を近くに置いて、せいれいがほる */
    const bx=(a.y|0)*W+(a.x|0)+2;S.obj[bx]='crate';recount();boxSync();
    let n=0,dug=false;for(;n<40000&&S.tx!=null;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(a.act&&a.act.type==='tdig')dug=true}
    for(let i=0;i<20000&&(a.citem&&Object.keys(a.citem).length);i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}
    out.dug=dug;out.n=n;out.txGone=S.tx;out.fuk=S.fukuro||0;
    /* ふくろをあける */
    S.fukuro=40;const m0=JSON.stringify(S.mat)+JSON.stringify(S.fs)+JSON.stringify(S.cseed)+(S.mseed||0)+(S.mapPc||0)+JSON.stringify(S.inv);let opened=0;for(let i=0;i<40;i++){fukuroOpen();opened++;document.querySelectorAll('.pxcard').forEach(e=>e.closest('[style*=fixed]').remove())}
    out.open=S.fukuro;out.changed=m0!==JSON.stringify(S.mat)+JSON.stringify(S.fs)+JSON.stringify(S.cseed)+(S.mseed||0)+(S.mapPc||0)+JSON.stringify(S.inv);
    out.rolls=[...Array(400)].map(()=>fukuroRoll()[0][0].split(':')[0]).reduce((m,k)=>(m[k]=(m[k]||0)+1,m),{});
    out.drops=dropRolls('basic').filter(x=>x[0]==='mapPc'||x[0]==='fukuro').map(x=>x[0]+':'+x[2]);
    out.name=itemName('fukuro');
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.pc2,2);assert.equal(r.joinFail,0,'2こではつなげない');assert.equal(r.pc,0);assert.equal(r.tmap,1);
  assert.deepEqual(r.slots,['宝の地図']);
  assert.notEqual(r.tx,null);assert.equal(r.far,true);assert.equal(r.tmapLeft,0);assert.equal(r.once,true);
  assert.equal(r.dug,true,'せいれいがほる');assert.equal(r.txGone,null);assert.equal(r.fuk,1,'宝からふくろ');
  assert.equal(r.open,0);assert.equal(r.changed,true);assert.ok(r.rolls.mat>100&&r.rolls.seed>40,JSON.stringify(r.rolls));
  assert.deepEqual(r.drops,['mapPc:0.02','fukuro:0.01']);assert.equal(r.name,'ふしぎなふくろ');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
