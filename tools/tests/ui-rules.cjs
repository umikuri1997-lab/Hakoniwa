/* 画面の決まり：レベルアップの光は絵文字でなくドット・字の大きさは5の倍数・音のボタンはすることのことば・強化できない物は札 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  const up=JSON.parse(await run(`(()=>{upFx(S.res[0],'はたらく速さ','+1',false);const L=[...document.querySelectorAll('#upfx i')];return JSON.stringify({n:L.length,svg:L.every(e=>e.querySelector('svg')),txt:L.map(e=>e.textContent).join('')})})()`));
  assert.ok(up.n>0);assert.ok(up.svg,'dot sparks');assert.equal(up.txt,'','no emoji text');
  await page.waitForTimeout(400);
  const mv=JSON.parse(await run(`(()=>{const e=document.querySelector('#upfx i');return JSON.stringify({t:e&&e.style.transform})})()`));
  assert.ok(/translate/.test(mv.t||''),'sparks move');
  console.log('Level-up sparks are dot art');
  const fs=JSON.parse(await run(`(()=>{const bad=[];for(const el of document.querySelectorAll('body *')){const f=parseFloat(getComputedStyle(el).fontSize);if(el.offsetParent&&f&&f%5&&[...el.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim()))bad.push(el.tagName+'#'+el.id+'.'+el.className+':'+f)}return JSON.stringify(bad.slice(0,8))})()`));
  assert.deepEqual(fs,[],'visible text font sizes are multiples of 5px');
  const snd=await run(`(()=>{showMaps();return document.getElementById('mSnd').textContent+'|'+document.getElementById('mSfx').textContent})()`);
  assert.ok(/曲を(止める|ながす)/.test(snd)&&/効果音を(止める|出す)/.test(snd),snd);
  const g=await run(`(()=>{const e=gearUpBtn({id:Object.keys(BL).find(k=>BL[k].g),lv:3},()=>{});return e.tagName+'|'+e.textContent})()`);
  assert.equal(g,'SPAN|強化+3');
  console.log('Sound buttons use verbs; maxed gear shows a tag');
  if(errors.length)console.log(JSON.stringify(errors).slice(0,800));assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
