/* マップの「！」のお話（dialog）：歩いているとちゅうの話す子は、立ちどまって真正面（front0）を向く（村の時間が止まっているので、歩く横向きの絵のまま止まらない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.enemyOn=false;for(const r of S.res){r.nap=false;RHOLD.set(r,0)}
    window.__cap=[];const o=drawSpirit;drawSpirit=function(c,el,x,y,s,f,op){if(c===ctx&&op&&window.__tg&&Math.abs(x-__tg.x*TS)<8&&Math.abs(y-__tg.y*TS)<30)__cap.push({front0:!!op.front0,walk:!!op.walk});return o.apply(this,arguments)}})()`);
  const r=JSON.parse(await run(`(async()=>{const wait=ms=>new Promise(f=>setTimeout(f,ms));const a=S.res[0];S.res=[a];
    for(let k=1;k<14;k++)S.obj[(a.y|0)*W+(a.x|0)+k]='';
    a.act={type:'wander',stage:'walk',t:0,obj:-1};a.path=[];for(let k=1;k<13;k++)a.path.push((a.y|0)*W+(a.x|0)+k);await wait(400);window.__tg=a;
    __cap.length=0;await wait(80);const before=__cap[__cap.length-1]||null;
    DLGQ.length=0;DLGGAP=0;DLGTAP=0;dialog([[a.name,'あのね、守り神さま。'],[a.name,'きいてほしいことがあるんだ。']]);const out=[];
    for(const ms of[300,1200]){await wait(ms);__cap.length=0;await wait(80);out.push(__cap[__cap.length-1]||null)}
    const open=!document.querySelector('#dialog').hidden;document.querySelector('#dialog').hidden=true;DLGQ.length=0;dlgGestEnd();
    return JSON.stringify({before,out,open})})()`));
  console.log(JSON.stringify(r));
  assert.ok(r.open);assert.ok(r.before&&r.before.walk,'お話の前は歩いていない');
  for(const p of r.out){assert.ok(p,'絵が描かれていない');assert.equal(p.front0,true);assert.equal(p.walk,false)}
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
