/* 「おく」の道具：えらんだ道具だけを出す（設計図をえらんだら設計図だけ・ハケならハケとぬるブロック）。「もどる」で「おく」の一覧へ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=600;if(sheet)closeSheet();`);
  const P=JSON.parse(await run(`(()=>{S.bulk=S.mover=S.stamps=S.swap=true;S.bpInv=[{k:Object.keys(BPS)[0],g:null}];
    const lbls=()=>[...document.querySelectorAll('#palItems .pallbl')].map(c=>c.textContent),tool=nm=>{setMode('build');PALF='all';renderPalette();[...document.querySelectorAll('#palItems .chip')].find(c=>(c.querySelector('.nm')?.textContent||'')===nm).click();return lbls()};
    const out={bp:tool('設計図'),hake:tool('ひろびろハケ'),stamp:tool('かたどりスタンプ'),swap:tool('つけかえトンカチ')};
    document.querySelector('#palBack').click();out.back=mode;return JSON.stringify(out)})()`));
  console.log(P);
  assert.deepEqual(P.bp,['設計図'],'設計図だけ');
  assert.equal(P.hake[0],'ハケ');assert.ok(!P.hake.includes('設計図')&&!P.hake.includes('スタンプ'),'ハケのときは、ほかの道具を出さない');
  assert.deepEqual(P.stamp,['スタンプ']);assert.deepEqual(P.swap,['つけかえ']);
  assert.equal(P.back,'build','もどるで「おく」の一覧へ');
  assert.deepEqual(errors,[]);await browser.close();console.log('Palette tool: ok');
})().catch(e=>{console.error(e);process.exit(1)});
