/* 「おく」のしぼりこみ（PALF・palTags・最近もらった S.got）と、見守る（FOLLOW）。
   しぼりこみ：タグ・さいきん・なにもないときの案内・道具は「すべて」だけ・こわしてもどった物は最近にしない・古いセーブ（S.got なし）。
   見守る：その子へカメラがゆっくりよる・行動はかえない・ドラッグ／物語のカメラ／いなくなる／村の切りかえでおわる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=600;if(sheet)closeSheet();`);
  const P=JSON.parse(await run(`(()=>{const light=Object.keys(BL).find(id=>BL[id].kind==='furn'&&tagsOf(id).includes('あかり')&&!tagsOf(id).includes('リビング')),chair='chair';
    delete S.got;S.inv={};S.mover=true;setMode('build');palOpen=true;PALF='recent';renderPalette();const old=document.querySelector('#palItems .palnone')?.textContent||'';
    giveItem(chair,1);giveItem(light,1);giveItem('taru',1,1);/* こわしてもどった物（back）は、最近にしない */
    const chips=()=>[...document.querySelectorAll('#palItems .chip')].map(c=>c.querySelector('.nm')?.textContent||c.textContent);
    PALF='all';renderPalette();const bar=[...document.querySelectorAll('#palBar .ctab')].map(b=>b.textContent),all=chips();
    PALF='あかり';renderPalette();const lt=chips();
    PALF='recent';renderPalette();const rc=chips();
    PALF='ワナ';renderPalette();const none=document.querySelector('#palItems .palnone')?.textContent||'';document.querySelector('#palItems .palnone .btn').click();const back=PALF;
    PALF='あかり';renderPalette();[...document.querySelectorAll('#palItems .chip')][0].click();const picked={sel,palOpen};
    return JSON.stringify({light:BL[light].name,chair:BL[chair].name,old,got:S.got,bar,all,lt,rc,none,back,picked,lightId:light,taru:BL.taru.name})})()`));
  assert.ok(/これから/.test(P.old),'old save: recent is empty with a gentle note');
  assert.deepEqual(P.got,[P.lightId,'chair'],'newest first, given-back items skipped');
  assert.ok(P.bar[0]==='すべて'&&P.bar[1]==='さいきん'&&P.bar.includes('あかり'),P.bar.join());
  assert.ok(P.all.includes('ひっこしミトン')&&P.all.includes(P.chair)&&P.all.includes(P.light)&&P.all.includes(P.taru),'all keeps tools and every item');
  assert.ok(P.lt.includes(P.light)&&!P.lt.includes(P.chair)&&!P.lt.includes('ひっこしミトン'),'tag filter: '+P.lt.join());
  assert.deepEqual(P.rc,[P.light,P.chair],'recent in order');
  assert.ok(/ワナ/.test(P.none)&&/すべてを見る/.test(P.none));assert.equal(P.back,'all','clear the filter');
  assert.equal(P.picked.sel,P.lightId);assert.equal(P.picked.palOpen,false,'picking still shrinks the palette');
  console.log('Palette: tags, recent order, empty note, tools only in all, picking works');
  /* 見守る */
  await run(`(()=>{PALF='all';setMode('look');TUTPAN=S;/* はじめの目標のカメラ（神殿へ）を出さない */const r=S.res[0];endAct(r);r.x=CX+12.5;r.y=CY+6.5;cam.z=1.5;centerOn(CX*TS,CY*TS);resTab=2;openSheet('res',r.id);})()`);
  const btn=await run(`[...document.querySelectorAll('#sheetBody button')].some(b=>b.textContent==='見守る')`);assert.ok(btn,'button on the spirit sheet');
  await run(`[...document.querySelectorAll('#sheetBody button')].find(b=>b.textContent==='見守る').click()`);
  const f0=JSON.parse(await run(`JSON.stringify({on:followActive(),sheet,tag:document.querySelector('#followTag')?.textContent||'',act:S.res[0].act&&S.res[0].act.type})`));
  assert.ok(f0.on&&f0.sheet===null&&f0.tag==='見守り中',JSON.stringify(f0));
  const d0=await run(`(()=>{const r=S.res[0];return Math.hypot(cam.x+VW/cam.z/2-r.x*TS,cam.y+VH/cam.z/2-(r.y-.6)*TS)})()`);
  await page.waitForTimeout(500);const dMid=await run(`(()=>{const r=S.res[0];return Math.hypot(cam.x+VW/cam.z/2-r.x*TS,cam.y+VH/cam.z/2-(r.y-.6)*TS+uLift(r))})()`);
  await page.waitForTimeout(2500);const d1=await run(`(()=>{const r=S.res[0];return Math.hypot(cam.x+VW/cam.z/2-r.x*TS,cam.y+VH/cam.z/2-(r.y-.6)*TS+uLift(r))})()`);
  assert.ok(dMid>40&&dMid<d0,'moves smoothly, not a jump: '+d0+' '+dMid);assert.ok(d1<40,'camera reaches the spirit: '+d1);
  /* ドラッグでおわる */
  const box=await page.locator('#cv').boundingBox();await page.mouse.move(box.x+200,box.y+300);await page.mouse.down();await page.mouse.move(box.x+260,box.y+340,{steps:5});await page.mouse.up();
  assert.equal(await run('followActive()+"|"+!!document.querySelector("#followTag")'),'false|false','drag ends it');
  /* 物語のカメラ・いなくなる・村の切りかえ */
  const e=JSON.parse(await run(`(()=>{const r=S.res[0],out={};followStart(r);camAnim={fz:cam.z,tz:cam.z,fx:0,fy:0,tx:10,ty:10,t:0,dur:1,done:()=>{}};followTick(.03);out.story=followActive();camAnim=null;
    followStart(r);camAnim={fz:cam.z,tz:cam.z,fx:0,fy:0,tx:10,ty:10,t:0,dur:1};followTick(.03);out.pan=followActive();camAnim=null;followTick(.03);out.after=followActive();
    const keep=S.res;S.res=S.res.filter(q=>q!==r);followTick(.03);out.gone=followActive();S.res=keep;
    followStart(r);const S0=S;S=JSON.parse(JSON.stringify(S0));followTick(.03);out.switch=followActive();S=S0;out.tag=!!document.querySelector('#followTag');return JSON.stringify(out)})()`));
  assert.deepEqual(e,{story:false,pan:true,after:true,gone:false,switch:false,tag:false});
  console.log('Follow: smooth camera, ends on drag, story camera, missing spirit and village switch');
  assert.deepEqual(errors,[]);await browser.close();console.log('Palette & follow: ok');
})().catch(e=>{console.error(e);process.exit(1)});
