/* どうぐたて（kabedougu）はなくした：作れない・なやは木箱・たる・あさぶくろ・古い納屋のあとはまき棚。古いセーブの物は、けして木材6・石材2（依頼中はパワー3も）をもどす（1回だけ） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true`);
  const a=JSON.parse(await run(`JSON.stringify({bl:!!BL.kabedougu,furn:FURN.includes('kabedougu'),tab:CRAFT_TABS.some(t=>t[1].includes('kabedougu')),naya:SPOTS.find(s=>s.k==='naya').need.length,ruin:RUIN_KINDS.naya.furn.map(f=>f[0]),flag:!!newState(0).flags.noTool1})`));
  assert.deepEqual(a,{bl:false,furn:false,tab:false,naya:2,ruin:['crate','taru','makidana'],flag:true});
  const b=JSON.parse(await run(`(()=>{const s=JSON.parse(JSON.stringify(S));delete s.flags.noTool1;const j=(CY+8)*W+CX+8;s.obj[j]='kabedougu';s.inv.kabedougu=1;s.win=s.win||{};s.win[j+2]='kabedougu';s.orders.push({id:998,type:'kabedougu',prog:0,need:70,worker:null});
    const pt=s.pt,wood=s.mat.wood||0,stone=s.mat.stone||0;continueGame(s);const r={left:S.obj.includes('kabedougu'),inv:S.inv.kabedougu||0,win:Object.values(S.win||{}).includes('kabedougu'),ord:S.orders.some(o=>o.type==='kabedougu'),pt:S.pt-pt,wood:(S.mat.wood||0)-wood,stone:(S.mat.stone||0)-stone};
    const w2=S.mat.wood;continueGame(JSON.parse(JSON.stringify(S)));r.again=S.mat.wood-w2;return JSON.stringify(r)})()`));
  assert.deepEqual(b,{left:false,inv:0,win:false,ord:false,pt:3,wood:24,stone:8,again:0});
  assert.deepEqual(errors,[]);console.log('kabedougu removed; naya/ruin updated; old saves refunded once');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
