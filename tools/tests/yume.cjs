/* やりこみ目標：メニューの「やりこみ」から3つまでえらび、たっせいしたらごほうび（パワー・むずかしい目標は設計図）。4つめはえらべない。依頼ボードには出さない */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{const o={};openSheet('craft');o.board=!!document.querySelector('#yumeBtn');openSheet('menu');const t=document.querySelector('.mtile[data-menu="yume"]');o.tile=!!t;t.click();o.title=document.querySelector('#sheetTitle').textContent;o.txt=document.querySelector('#sheetBody').innerText;
    o.a=yumeOn('pond');o.b=yumeOn('fun');o.c=yumeOn('pop8');o.d=yumeOn('cube50');o.on=S.yume.on.length;
    const pt0=S.pt;S.cnt={pond:1};YUMET=0;stepWorld(.25);o.dbg=JSON.stringify(S.yume)+yumeNow(YUMEBY.pond);o.pond=!!S.yume.done.pond&&!S.yume.on.includes('pond');o.pt=S.pt-pt0;
    const pt1=S.pt,bp0=(S.bpInv||[]).length;while(S.res.length<8)S.res.push(Object.assign({},S.res[0],{id:900+S.res.length}));YUMET=0;stepWorld(.25);o.pop=!!S.yume.done.pop8;o.pt2=S.pt-pt1;o.bp=(S.bpInv||[]).length-bp0;
    renderSheet();o.txt2=document.querySelector('#sheetBody').innerText;closeSheet();return JSON.stringify(o)})()`));
  console.log(r.dbg,r.pt,r.pt2,r.bp);
  assert.equal(r.board,false,'依頼ボードには出さない');assert.ok(r.tile,'メニューに「やりこみ」');assert.equal(r.title,'やりこみ目標');assert.match(r.txt,/えらぶ/);assert.match(r.txt,/地形づくり/);
  assert.ok(r.a&&r.b&&r.c);assert.equal(r.d,false,'4つめはえらべない');assert.equal(r.on,3);
  assert.ok(r.pond,'たっせいでおりる');assert.ok(r.pt>=50,'パワー50');
  assert.ok(r.pop,'せいれい8人');assert.ok(r.bp===1||r.pt2>=300,'むずかしい目標は設計図（なければパワー）');assert.match(r.txt2,/たっせいした/);
  assert.deepEqual(errors,[]);console.log('yume: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
