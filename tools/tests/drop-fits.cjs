/* 昼の落とし物ひろい（spirit-work.js の tryJob 'drop'・boxes.js の dropFits）：その物が入る箱がなければ、ひろわない。
   箱のあきが、ほかの素材のつみかけのわくだけ（石なら入る・木材は入らない）とき、木材はひろわず、石はひろう */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const a=S.res[0];a.hunger=hMax(a);a.energy=100;a.fun=100;a.cmat=null;a.carry=null;endAct(a);a.act=null;S.t=1440*3+10*60;
    const x0=a.x|0,y0=(a.y|0)+2,j=y0*W+x0+2;S.obj[j]='';delete S.ref[j];S.obj[j]='crate';recount();
    S.mat.stone=(S.mat.stone||0)+matCap()-matTot()-1;boxSync();/* 石のつみかけに1つだけあき */
    const out={room:matCap()-matTot(),stoneFits:dropFits({id:'mat:stone'}),woodFits:dropFits({id:'mat:wood'})};
    const dj=(a.y|0)*W+(a.x|0)+1;S.drops=[{x:dj%W,y:(dj/W)|0,id:'mat:wood',n:1}];
    out.wood=tryJob(a,bfs(a.x|0,a.y|0),'drop');endAct(a);a.act=null;
    S.drops=[{x:dj%W,y:(dj/W)|0,id:'mat:stone',n:1}];out.stone=tryJob(a,bfs(a.x|0,a.y|0),'drop');
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.ok(r.room>0,'素材のあきはある（石のつみかけ）');assert.equal(r.woodFits,false);assert.equal(r.stoneFits,true);
  assert.equal(r.wood,false,'木材は入らないので、ひろわない');assert.equal(r.stone,true,'石は入るので、ひろう');
  assert.deepEqual(errors,[]);console.log('Daytime drop pickup: skips drops with no box room for that item. Browser errors: none');
  await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
