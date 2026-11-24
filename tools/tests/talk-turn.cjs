/* 守り神が話しかけた子（talkTo）は、よろこんでいるとき（JOYU の拍手）も、のこった横向きの姿勢があっても、こちら（正面の絵 front0）を向く */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.enemyOn=false;for(const r of S.res){r.nap=false;RHOLD.set(r,0)}
    window.__cap=[];const o=drawSpirit;drawSpirit=function(c,el,x,y,s,f,op){if(c===ctx&&op&&window.__tg&&Math.abs(x-__tg.x*TS)<4&&Math.abs(y-__tg.y*TS)<20)__cap.push(!!op.front0);return o.apply(this,arguments)}})()`);
  const cases={joy:`JOYU.set(a,performance.now()+4000)`,sidepose:`sacredSetPose(a,{anim:'storyListen',at:performance.now(),duration:60000,side:true,face:1})`};
  for(const [k,c] of Object.entries(cases)){
    const r=JSON.parse(await run(`(async()=>{const wait=ms=>new Promise(f=>setTimeout(f,ms));const a=S.res[0];a.path=[];a.act={type:'idle',stage:'do',t:0,dur:9999};${c};window.__tg=a;DLGQ.length=0;DLGGAP=0;DLGTAP=0;talkTo(a);const out=[];
      for(const ms of[300,1200]){await wait(ms);__cap.length=0;await wait(80);out.push(__cap.length?__cap[__cap.length-1]:null)}
      const open=!document.querySelector('#dialog').hidden;document.querySelector('#dialog').hidden=true;DLGQ.length=0;TALKID=null;dlgGestEnd();SACRED_POSES.delete(a);JOYU.delete(a);await wait(200);return JSON.stringify({out,open})})()`));
    console.log(k,JSON.stringify(r));assert.ok(r.open,k+': dialog');for(const f of r.out)assert.equal(f,true,k+': the talker must face the player');
  }
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
