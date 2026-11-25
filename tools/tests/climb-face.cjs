/* がけをよじのぼる・おりるときの向き（climbFace）：手前に見える面（左下・右下）は、のぼるときもおりるときもうしろ向き。おくのがけ（壁が見えない）は、ふちで待たず、低いマスのまん中から上のマスのまん中へ、歩く速さでひととび（clbHop・hopZ。歩く向き）。上がるときは、ふちをこえる前に上の高さ、おりるときは、ふちをこえてから下げる。よじのぼる動き（CLIMB）は、おりるときも */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&hiAt(j)===0;let j=-1;for(let k=(CY-10)*W+CX-10;k<(CY+10)*W;k++)if(ok(k)&&ok(k+W)&&ok(k+1)){j=k;break}const o={},r=S.res[0];r.act=null;
    const at=(A,N,k)=>{r.path=[N];CLB.delete(r);if(k==null){r.x=A%W+.5;r.y=((A/W)|0)+.5+(N-A===W?.2:N-A===-W?-.2:0);r.x+=N-A===1?.2:N-A===-1?-.2:0}else{const C=Object.assign({a:A,n:N,k},clbPt(A,N));CLB.set(r,C);r.x=C.px;r.y=C.py}CLIMB.delete(r);uLift(r);return[climbFace(r),CLIMB.has(r)]};/* k：よじのぼる進み（null は、ふちまで歩いているところ） */
    S.hi[j]=1;o.downA=at(j,j+W,.3);o.downB=at(j,j+W,.8);o.upA=at(j+W,j,.3);o.upB=at(j+W,j,.8);o.walkDown=at(j,j+W,null);o.side=at(j+1,j,.5);o.sideHop=clbHop(j+1,j);
    S.hi[j]=0;S.hi[j+W]=1;o.backHop=[clbHop(j,j+W),clbHop(j+W,j)];const y0=(j/W)|0,hz=(A,N,t)=>{r.path=[N];CLB.delete(r);r.x=j%W+.5;r.y=((A/W)|0)+.5+(((N/W)|0)-((A/W)|0))*t;return[Math.round(uLift(r)),climbFace(r)]};o.up=[0,.3,.5,.7,.95].map(t=>hz(j,j+W,t));o.dn=[.05,.3,.5,.7,.95].map(t=>hz(j+W,j,t));S.hi[j+W]=0;o.flat=at(j,j+W,null);r.path=[];CLB.delete(r);
    return JSON.stringify(o)})()`));
  console.log(r);
  for(const k of['downA','downB','upA','upB'])assert.deepEqual(r[k],[true,true],k+'：正面のがけは、うしろ向きでよじのぼる・おりる');
  assert.deepEqual(r.side,[true,true],'右下に見える面も、うしろ向きでよじのぼる');assert.equal(r.sideHop,false,'右下に見える面は、とばない');
  assert.deepEqual(r.walkDown,[null,false],'ふちまでは、ふつうに歩く向き');
  assert.deepEqual(r.backHop,[true,true],'おくのがけは、とぶ');
  assert.ok(r.up.every(v=>v[1]===null),'おくのがけをとぶときは、歩く向き');
  assert.equal(r.up[0][0],0,'まん中では、まだ低いマスの高さ');assert.ok(r.up[1][0]>0&&r.up[1][0]<32+10,'とびはじめから高さを上げる');
  assert.ok(r.up[2][0]>=32,'ふちをこえるときは、上のマスの高さより上');assert.ok(r.up[4][0]>=32&&r.up[4][0]<36,'さいごは、上のマスの高さ');
  assert.ok(r.dn[0][0]>=32&&r.dn[1][0]>=32,'おりるときは、ふちまでは上の高さ');assert.ok(r.dn[3][0]<r.dn[2][0]&&r.dn[4][0]<8,'ふちをこえてから下げる');
  assert.deepEqual(r.flat,[null,false]);
  assert.deepEqual(errors,[]);console.log('climb-face: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
