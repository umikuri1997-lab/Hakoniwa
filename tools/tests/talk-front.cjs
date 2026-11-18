/* 守り神が話しかけたお話（talkTo）：話す子は、そばに子がいても正面を向く（横・うしろを向かない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(async()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const wait=ms=>new Promise(f=>setTimeout(f,ms));
    const a=S.res[0];a.act=null;a.nap=false;const b=mkRes(S,'ハル','wood',a.x+1.5,a.y);S.res.push(b);b.act=null;
    DLGQ.length=0;DLGGAP=0;DLGTAP=0;talkTo(a);const out=[];for(let k=0;k<8;k++){await wait(500);const p=SACRED_POSES.get(a);out.push(p?{side:p.side,back:p.back}:null)}
    const pb=SACRED_POSES.get(b);return JSON.stringify({out,b:pb?pb.anim:null,open:!document.querySelector('#dialog').hidden})})()`));
  console.log(JSON.stringify(r));
  assert.ok(r.open);for(const p of r.out)if(p){assert.equal(p.side,false);assert.ok(!p.back)}
  assert.ok(r.out.some(p=>p),'身ぶりが出ていない');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
