/* 村レベル14のご神木（shinboku）はなくした：建てられない・レベルアップでおぼえない。古いセーブの置いてある物・建てている物は、けしてパワー160・木材40をもどす（1回だけ） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true`);
  const a=JSON.parse(await run(`JSON.stringify({bl:!!BL.shinboku,builds:BUILDS.includes('shinboku'),lv:[...Array(16).keys()].some(n=>levelUpItemsAt(n).includes('shinboku')),flag:!!newState(0).flags.shinGone1})`));
  assert.deepEqual(a,{bl:false,builds:false,lv:false,flag:true});
  const b=JSON.parse(await run(`(()=>{const s=JSON.parse(JSON.stringify(S));delete s.flags.shinGone1;const P=(j,o,ref)=>{s.obj[j]=o;if(ref!=null)s.ref[j]=ref};
    const j1=(CY+8)*W+CX+8;P(j1,'shinboku');for(let b=0;b<3;b++)for(let a=0;a<3;a++)if(a||b)P(j1+b*W+a,'part',j1);
    const j2=(CY+14)*W+CX+8;P(j2,'site');s.dyn[j2]={build:'shinboku',p:5,need:300};for(let b=0;b<3;b++)for(let a=0;a<3;a++)if(a||b)P(j2+b*W+a,'site2',j2);
    const pt=s.pt,wood=s.mat.wood||0;continueGame(s);const left=S.obj.filter((o,j)=>o==='shinboku'||o==='site'&&S.dyn[j]&&S.dyn[j].build==='shinboku').length;
    const parts=[j1,j2].flatMap(j=>[1,2,W,W*2+2].map(d=>S.obj[j+d]));const r={left,parts,pt:S.pt-pt,wood:(S.mat.wood||0)-wood};
    const pt2=S.pt;continueGame(JSON.parse(JSON.stringify(S)));r.again=S.pt-pt2;return JSON.stringify(r)})()`));
  assert.deepEqual(b,{left:0,parts:['','','','','','','',''],pt:320,wood:80,again:0});
  assert.deepEqual(errors,[]);console.log('shinboku removed: not buildable, old saves refunded once');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
