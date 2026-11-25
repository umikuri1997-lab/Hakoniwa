/* がけをよじのぼる・おりるときの向き（climbFace）：手前に見える面（左下・右下）は、のぼるときもおりるときもうしろ向き。おくのがけ（壁が見えない）は、ぴょんととぶ（clbHop・hopAt）：上がるときは正面、おりるときはうしろ向き。よじのぼる動き（CLIMB）は、おりるときも */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&hiAt(j)===0;let j=-1;for(let k=(CY-10)*W+CX-10;k<(CY+10)*W;k++)if(ok(k)&&ok(k+W)&&ok(k+1)){j=k;break}const o={},r=S.res[0];r.act=null;
    const at=(A,N,k)=>{r.path=[N];CLB.delete(r);if(k==null){r.x=A%W+.5;r.y=((A/W)|0)+.5+(N-A===W?.2:N-A===-W?-.2:0);r.x+=N-A===1?.2:N-A===-1?-.2:0}else{const C=Object.assign({a:A,n:N,k},clbPt(A,N));CLB.set(r,C);r.x=C.px;r.y=C.py}CLIMB.delete(r);uLift(r);return[climbFace(r),CLIMB.has(r)]};/* k：よじのぼる進み（null は、ふちまで歩いているところ） */
    S.hi[j]=1;o.downA=at(j,j+W,.3);o.downB=at(j,j+W,.8);o.upA=at(j+W,j,.3);o.upB=at(j+W,j,.8);o.walkDown=at(j,j+W,null);o.side=at(j+1,j,.5);o.sideHop=clbPt(j+1,j).hop||false;
    S.hi[j]=0;S.hi[j+W]=1;o.backDown=at(j+W,j,.5);o.backUp=at(j,j+W,.5);{const C=Object.assign({a:j,n:j+W,k:0},clbPt(j,j+W)),Z=[];for(const k of[0,.5,HOPCROUCH+.12*(1-HOPCROUCH),HOPCROUCH+.5*(1-HOPCROUCH),1]){C.k=k;const P=hopAt(C);Z.push([+(P.y-((j/W)|0)).toFixed(3),+P.z.toFixed(1)])}o.hop=Z;o.hopFlag=!!C.hop}S.hi[j+W]=0;o.flat=at(j,j+W,null);r.path=[];CLB.delete(r);
    return JSON.stringify(o)})()`));
  console.log(r);
  for(const k of['downA','downB','upA','upB'])assert.deepEqual(r[k],[true,true],k+'：正面のがけは、うしろ向きでよじのぼる・おりる');
  assert.deepEqual(r.side,[true,true],'右下に見える面も、うしろ向きでよじのぼる');assert.equal(r.sideHop,false,'右下に見える面は、とばない');
  assert.deepEqual(r.walkDown,[null,false],'ふちまでは、ふつうに歩く向き');
  assert.deepEqual(r.backUp,[false,true],'おくのがけを上がるときは、がけのほう（正面）');assert.deepEqual(r.backDown,[true,true],'おくのがけをおりるときは、とぶほう（うしろ向き）');
  assert.ok(r.hopFlag,'おくのがけは、とぶ');const h=r.hop;
  assert.ok(h[0][0]<1&&h[1][0]<1&&h[0][1]===0&&h[1][1]===0,'ふみきるまでは、ふちの手前の低いマスで待つ');
  assert.ok(h[2][0]<1&&h[2][1]>0,'とびはじめは、ふちをこえる前に高さを上げる');
  assert.ok(h[3][1]>=32,'ふちをこえるまでに、上のマスの高さ');assert.ok(h[4][0]>1&&h[4][1]===32,'さいごは、上のマスの上');
  assert.deepEqual(r.flat,[null,false]);
  assert.deepEqual(errors,[]);console.log('climb-face: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
