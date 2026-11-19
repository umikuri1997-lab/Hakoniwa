/* 本（book.js：思い出帳・図鑑）と巻物（scroll.js：ひでんのしょ）のたしかめ。
   ・思い出帳：目次 → つぎへめくる・指でつまんでめくる（とちゅうではなすと、もどる）・遠くへ、ぱらぱら・前へもどる。めくるあいだの写しが、おわったらのこらない
   ・たての画面は1ページ、よこの画面は見開き
   ・×でとじると、表紙がとじてから画面がとじる
   ・図鑑：しおりで章をかえる（ページは0へ）
   ・ひでんのしょ：ひらくと紙がのびる（高さがかわる）・軸が2本・とじると、まきもどってから、とじる */
const assert=require('assert'),boot=require('../sim/boot.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const {browser,page,run,errors}=await boot({viewport:{width:420,height:780}});
  await run(`(()=>{for(let d=1;d<40;d++)memo('memo','できごと '+d);S.memo.forEach((m,i)=>m[0]=1+(i>>1))})()`);
  await run(`MEMPG=0;openSheet('menu','record')`);await wait(300);
  assert.equal(await run(`!!BK.closed&&document.querySelector('#sheetBody .mpn').textContent`),'表紙','ひらいたときは、とじた表紙');
  await run(`document.querySelector('#sheetBody .mnx').click()`);await wait(900);
  let st=await run(`({sp:BK.sp,at:BK.at,N:BK.N,toc:document.querySelectorAll('#sheetBody .mtocr').length,busy:BK.busy,closed:!!BK.closed})`);
  assert.equal(st.sp,false,'たての画面は1ページ');assert.equal(st.at,0);assert.ok(st.N>2&&st.toc>=2,'目次と章');assert.equal(st.busy,0);assert.equal(st.closed,false,'表紙をめくった');
  await run(`document.querySelector('#sheetBody .mnx').click()`);await wait(80);
  assert.ok(await run(`document.querySelectorAll('.bkwrap').length>0&&!BK.cv.hidden`),'めくっているあいだは、写しとめくれた紙');
  await wait(700);assert.deepEqual(await run(`[BK.at,document.querySelectorAll('.bkwrap').length,BK.busy]`),[1,0,0],'つぎのページ');
  /* 指でつまんで、とちゅうではなす → もどる。さいごまで引く → めくれる */
  const g=await run(`(()=>{const r=BK.R.getBoundingClientRect();return[r.left,r.right,(r.top+r.bottom)/2]})()`);
  const drag=async(n,step)=>{await page.mouse.move(g[1]-10,g[2]);await page.mouse.down();for(let i=1;i<=n;i++){await page.mouse.move(g[1]-10-i*step,g[2]);await wait(30)}await wait(120);await page.mouse.up();await wait(800)};
  await drag(3,10);assert.equal(await run(`BK.at`),1,'少しだけ引いてはなすと、もどる');
  await drag(12,28);assert.equal(await run(`BK.at`),2,'さいごまで引くと、めくれる');
  /* 遠くへ（ぱらぱら） */await run(`bkGo(BK,BK.N-1)`);await wait(2500);assert.deepEqual(await run(`[BK.at,BK.N-1,BK.busy,document.querySelectorAll('.bkwrap').length]`).then(a=>[a[0]===a[1],a[2],a[3]]),[true,0,0],'さいごのページへ');
  await run(`document.querySelector('#sheetBody .mtc').click()`);await wait(2500);assert.equal(await run(`BK.at`),0,'もくじへもどる');
  assert.ok(await run(`/できごと 1/.test(document.getElementById('sheetBody').textContent)`),'ひらいていないページも、さがせる（できごとは日記のページ）');
  /* もくじから前へ：表紙がとじる */await run(`document.querySelector('#sheetBody .mpv').click()`);await wait(800);assert.equal(await run(`!!BK.closed`),true,'もくじから前で、表紙がとじる');
  /* ×でとじる：表紙がとじてから */await run(`document.getElementById('sheetX').click()`);await wait(100);assert.equal(await run(`sheet`),'menu','表紙がとじるあいだは、まだひらいている');
  await wait(900);assert.equal(await run(`sheet`),null,'表紙がとじたら、とじる');
  /* 図鑑：しおり */await run(`ZKT=0;ZKPG=0;S.seenIt={'m:wood':1,'m:stone':1};openSheet('menu','zukan')`);await wait(300);await run(`document.querySelector('#sheetBody .mnx').click()`);await wait(900);
  await run(`[...document.querySelectorAll('.bktab')].find(t=>t.textContent==='アイテム').click()`);await wait(900);
  assert.deepEqual(await run(`[ZKTABS[ZKT],BK.at,BK.busy,/木材/.test(document.querySelector('.bkR').textContent)]`),['アイテム',0,0,true],'しおりで章をかえる');
  await run(`closeSheet()`);
  /* ひでんのしょ：巻物 */await run(`openSheet('manual')`);await wait(150);
  const h1=await run(`document.querySelector('#sheetWrap .sheet').getBoundingClientRect().height`);await wait(900);
  const h2=await run(`document.querySelector('#sheetWrap .sheet').getBoundingClientRect().height`);
  assert.ok(h1<h2-20,'ひらくと紙がのびる '+h1+' → '+h2);assert.equal(await run(`document.querySelectorAll('.scrod').length`),2,'上と下の軸');
  await run(`document.getElementById('sheetX').click()`);await wait(150);assert.equal(await run(`sheet`),'manual','まきもどるあいだは、まだひらいている');
  await wait(800);assert.deepEqual(await run(`[sheet,document.querySelectorAll('.scrod').length]`),[null,0],'まきもどったら、とじる');
  /* よこの画面は見開き */await page.setViewportSize({width:1000,height:600});await run(`MEMPG=3;openSheet('menu','record')`);await wait(300);await run(`document.querySelector('#sheetBody .mnx').click()`);await wait(900);
  assert.deepEqual(await run(`[BK.sp,BK.at%2,!BK.L.hidden]`),[true,0,true],'よこの画面は見開き');
  await run(`closeSheet()`);
  assert.deepEqual(errors,[]);console.log('book: 本・巻物 ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
