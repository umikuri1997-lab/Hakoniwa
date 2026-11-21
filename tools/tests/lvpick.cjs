/* レシピをえらんでひらく：村レベルが上がると、えらべる物から3つ出て1つえらぶ。えらぶまで、おぼえない。お話の物・家の材料は、えらばずにおぼえる */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{const o={};const vl=vLv;vLv=()=>8;lvShow=()=>{};checkLevel();vLv=vl;
    o.lv=S.lv;o.n=S.lvPick.n;o.mato=!!(S.recipes||{}).mato;o.sign=lvOK('lurestatue');o.kamizo=!!(S.recipes||{}).kamizo;o.wood=lvOK('stairs_wood');
    sheet=null;lvPickTick();const pop=LVPOP;o.pop=!!pop;o.opts=pop?pop.querySelectorAll('button').length:0;
    if(pop){pop.querySelector('button').click()}o.got=Object.keys(S.lvPick.got).length;o.n2=S.lvPick.n;o.close=!LVPOP;
    const id=Object.keys(S.lvPick.got)[0];o.learned=BL[id].kind==='furn'?!!S.recipes[id]:lvOK(id);
    const s2=JSON.parse(JSON.stringify(S));delete s2.flags.lvPick1;delete s2.lvPick;o.mig=1;return JSON.stringify(o)})()`));
  console.log(r);
  assert.equal(r.lv,8);assert.equal(r.n,7,'上がったレベルごとに1つ');assert.equal(r.mato,false,'えらぶまでおぼえない');assert.equal(r.sign,false);
  assert.equal(r.kamizo,true,'お話の物はおぼえる');assert.equal(r.wood,true,'家の材料はおぼえる');
  assert.ok(r.pop);assert.ok(r.opts>=1&&r.opts<=3,'3つまで');assert.equal(r.got,1);assert.equal(r.n2,6);assert.ok(r.close);assert.ok(r.learned,'えらんだ物はおぼえる');
  assert.deepEqual(errors,[]);console.log('lvpick: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
