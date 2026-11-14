/* カミサマの立つマスは、せいれいもコワイノも通らない（こわれた神殿の前・直した神殿の左の柱の前） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.godShown=true;S.godGone=false;S.hold=0;stepWorld(.1)`);
  const chk=async(tag)=>{const o=JSON.parse(await run(`(()=>{const j=Math.floor(godY())*W+Math.floor(godX()),x=j%W,y=(j/W)|0;
    const G=roadSearch(x-1,y),p=pathTo(G,y*W+x+1),E=bfsE(x-1,y,0,1),pe=pathTo(E,y*W+x+1);
    return JSON.stringify({j,G:GODJ,walk:walk(j),via:p.includes(j),viaE:pe.includes(j),reach:G.dist[y*W+x+1]>=0})})()`));
    assert.equal(o.G,o.j,tag+': GODJ is the god cell');assert.equal(o.walk,false,tag+': god cell is not walkable');
    assert.equal(o.via,false,tag+': spirit path avoids the god');assert.equal(o.viaE,false,tag+': enemy path avoids the god');
    console.log(tag+': god cell',o.j,'is blocked; detour reachable =',o.reach)};
  await chk('ruin');
  await run(`(()=>{const j=RUINT;S.dyn[j]={build:'statue',ruin:1};finishBuild(j,S.res[0]);recount();stepWorld(.1)})()`);
  await chk('temple');
  await run(`S.godGone=true;S.godVisit=false;stepWorld(.1)`);
  assert.equal(await run(`GODJ`),-1,'no block when the god is away');console.log('god away: no block');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
