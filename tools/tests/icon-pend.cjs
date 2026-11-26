const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
/* 物のアイコン：先に作ってアトラスに入れた物（js/item-icons.js）は、マップを開いたときには、もう出せる（かりの空の絵にならない）・その場で作った絵と同じ。
   アトラスにない物を、チップのページを読みこみ中に作るときは、とちゅうの絵（コードの仮の絵・影だけ）にしない */
(async()=>{const {browser,page,run,errors}=await boot();
  const a=JSON.parse(await run(`(()=>{const ids=[...new Set([...CRAFT_TABS.flatMap(([,a])=>a).filter(id=>BL[id]),...Object.keys(ITIA.m)])],o={},raw={};/* 「作る」の物と、アトラスに入れた物ぜんぶ */let wait=0,baked=0,pend=0;
    for(const id of ids){delete iconCache[id];const u=iconURL(id);if(ITIA.m[id]||BL[id].kind==='gift'||BL[id].g)baked++;/* おくりもの・そうびは、べつの絵（チップのページを使わない） */if(u.startsWith('data:image/svg'))wait++;o[id]=u}
    for(const id of ids){if(PICKB.includes(id)||BL[id].kind==='gift'||BL[id].g)continue;const r=iconDraw(id);if(r)raw[id]=iconFit(ICONTMP,r[0],r[1],r[2],r[3]);else pend++}/* その場で作る道：ページを読みこみ中は null */
    window.__A=o;window.__R=raw;return JSON.stringify({n:ids.length,wait,baked,pend})})()`));
  assert.ok(a.n>=200,'craft ids '+a.n);assert.ok(a.baked>=a.n-5,'craft icons are baked '+a.baked+'/'+a.n);assert.equal(a.wait,0,'no placeholder icons when the map opens');assert.ok(a.pend>0,'runtime path waits for pages');
  await page.waitForFunction(()=>sacredEval('chaReady()'),{},{timeout:60000});
  const b=JSON.parse(await run(`(()=>{const R=window.__R,A=window.__A,early=[],diff=[];for(const id in A){if(PICKB.includes(id)){const u=cubeIcon(id);if(ITIA.m[id]&&u&&u!==A[id])diff.push([id]);continue}if(BL[id].kind==='gift'||BL[id].g)continue;const r=iconDraw(id);if(!r)return JSON.stringify({again:1});const u=iconFit(ICONTMP,r[0],r[1],r[2],r[3]);if(R[id]&&R[id]!==u)early.push(id);if(ITIA.m[id]&&A[id]!==u)diff.push([id,A[id],u])}return JSON.stringify({early,diff})})()`));
  /* すきとおった所は、絵のファイルにするときの丸めで、色が1〜2だけずれる。すきとおりをかけた色でくらべる */
  b.diff=await page.evaluate(async L=>{const px=async u=>{const im=new Image();im.src=u;await im.decode();const c=document.createElement('canvas');c.width=c.height=144;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,144,144).data},out=[];for(const[id,u,v]of L){if(typeof u!=='string'){out.push(id);continue}const a=await px(u),d=await px(v);let m=0;for(let i=0;i<a.length;i+=4){m=Math.max(m,Math.abs(a[i+3]-d[i+3]));for(let k=0;k<3;k++)m=Math.max(m,Math.abs(a[i+k]*a[i+3]-d[i+k]*d[i+3])/255)}if(m>3)out.push(id+':'+m.toFixed(1))}return out},b.diff);
  assert.ok(!b.again,'pages ready');assert.deepEqual(b.early,[],'icons made while loading are the real ones');assert.deepEqual(b.diff,[],'baked icons are the same as the ones made in the game');
  assert.deepEqual(errors,[],'no errors');console.log('icon-pend ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
