/* がけをよじのぼる・おりるときの向き（climbFace）：ハシゴと同じく、がけのほうを向く。正面のがけは、のぼるときもおりるときもうしろ向き。おくのがけは正面。横は歩く向き（null）。よじのぼる動き（CLIMB）は、おりるときも */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&hiAt(j)===0;let j=-1;for(let k=(CY-10)*W+CX-10;k<(CY+10)*W;k++)if(ok(k)&&ok(k+W)&&ok(k+1)){j=k;break}const o={},r=S.res[0];r.act=null;
    const at=(A,N,k)=>{r.path=[N];CLB.delete(r);if(k==null){r.x=A%W+.5;r.y=((A/W)|0)+.5+(N-A===W?.2:N-A===-W?-.2:0);r.x+=N-A===1?.2:N-A===-1?-.2:0}else{const C=Object.assign({a:A,n:N,k},clbPt(A,N));CLB.set(r,C);r.x=C.px;r.y=C.py}CLIMB.delete(r);uLift(r);return[climbFace(r),CLIMB.has(r)]};/* k：よじのぼる進み（null は、ふちまで歩いているところ） */
    S.hi[j]=1;o.downA=at(j,j+W,.3);o.downB=at(j,j+W,.8);o.upA=at(j+W,j,.3);o.upB=at(j+W,j,.8);o.walkDown=at(j,j+W,null);o.side=at(j+1,j,.5);
    S.hi[j]=0;S.hi[j+W]=1;o.backDown=at(j+W,j,.5);o.backUp=at(j,j+W,.5);S.hi[j+W]=0;o.flat=at(j,j+W,null);r.path=[];CLB.delete(r);
    return JSON.stringify(o)})()`));
  console.log(r);
  for(const k of['downA','downB','upA','upB'])assert.deepEqual(r[k],[true,true],k+'：正面のがけは、うしろ向きでよじのぼる・おりる');
  assert.deepEqual(r.side,[null,true],'横のがけは歩く向き');
  assert.deepEqual(r.walkDown,[null,false],'ふちまでは、ふつうに歩く向き');
  for(const k of['backDown','backUp'])assert.deepEqual(r[k],[false,true],k+'：おくのがけは正面');
  assert.deepEqual(r.flat,[null,false]);
  assert.deepEqual(errors,[]);console.log('climb-face: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
