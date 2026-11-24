/* がけをよじのぼる・おりるときの向き（climbFace）：ハシゴと同じく、がけのほうを向く。正面のがけは、のぼるときもおりるときもうしろ向き。おくのがけは正面。横は歩く向き（null）。よじのぼる動き（CLIMB）は、おりるときも */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&hiAt(j)===0;let j=-1;for(let k=(CY-10)*W+CX-10;k<(CY+10)*W;k++)if(ok(k)&&ok(k+W)&&ok(k+1)){j=k;break}const o={},r=S.res[0];r.act=null;const jx=j%W,jy=(j/W)|0;
    const at=(x,y,n)=>{r.x=x;r.y=y;r.path=[n];CLIMB.delete(r);uLift(r);return[climbFace(r),CLIMB.has(r)]};
    S.hi[j]=1;o.downA=at(jx+.5,jy+.8,j+W);o.downB=at(jx+.5,jy+1.3,j+W);o.upA=at(jx+.5,jy+1.3,j);o.upB=at(jx+.5,jy+.8,j);o.side=at(jx+1.3,jy+.5,j);
    S.hi[j]=0;S.hi[j+W]=1;o.backDown=at(jx+.5,jy+1.2,j);o.backUp=at(jx+.5,jy+.7,j+W);S.hi[j+W]=0;o.flat=at(jx+.5,jy+.7,j+W);r.path=[];
    return JSON.stringify(o)})()`));
  console.log(r);
  for(const k of['downA','downB','upA','upB'])assert.deepEqual(r[k],[true,true],k+'：正面のがけは、うしろ向きでよじのぼる・おりる');
  assert.deepEqual(r.side,[null,true],'横のがけは歩く向き');
  for(const k of['backDown','backUp'])assert.deepEqual(r[k],[false,true],k+'：おくのがけは正面');
  assert.deepEqual(r.flat,[null,false]);
  assert.deepEqual(errors,[]);console.log('climb-face: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
