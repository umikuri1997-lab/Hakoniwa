/* 「しらべる」でタップした落とし物（枝など）は、近くのタップしていない落とし物より先にひろいに行く */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  const o=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.enemyOn=false;S.t=1440+600;USERPAUSE=true;
    const r=S.res[0],x=r.x|0,y=r.y|0;S.obj[(y-2)*W+x+2]='crate';S.food=99;recount();r.hunger=hMax(r);r.energy=100;r.fun=90;
    const cells=[];for(let d=2;d<14;d++)for(let a=-d;a<=d;a++){const k=(y+d)*W+x+a;if(!S.obj[k]&&walk(k)&&!cells.includes(k))cells.push(k)}
    for(const k of cells.slice(0,4))dropAt(k%W,k/W|0,'mat:eda',1);/* 近くの、タップしていない枝 */
    const far=cells[cells.length-1];dropAt(far%W,far/W|0,'mat:eda',1);const d=S.drops.find(q=>q.y*W+q.x===far);d.tap=1;
    let first=null;for(let i=0;i<8000&&first==null;i++){for(const q of S.res)updRes(q,.25);if(r.act&&r.act.type==='pickdrop')first=r.act.obj}
    return JSON.stringify({first,far,near:cells.slice(0,4)})})()`));
  console.log(JSON.stringify(o));
  assert.equal(o.first,o.far,'the tapped drop is picked before nearer untapped drops');
  assert.deepEqual(errors,[]);console.log('Tapped drop is picked up first');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
