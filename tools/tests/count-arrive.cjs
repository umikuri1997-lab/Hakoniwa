/* 上の数の音：上の欄がかくれているあいだと、出てから1.5秒（村に着くカメラのあと、はじめに数が入るとき）は鳴らさない。そのあとは鳴る */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume();if(sheet)closeSheet()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&(SBUF.tab||[]).some(Boolean)`),{},{timeout:30000});
await page.waitForTimeout(1700);/* 読みこみおわりから1.5秒より後 */
await run(`(()=>{window.__C=0;const o=sfx;window.__o=o;sfx=function(k,...a){if(k==='count')window.__C++;return o(k,...a)}})()`);
const up=async()=>{await run(`(()=>{UIFX.spk={};const e=document.getElementById('food');e.textContent=String((parseInt(e.textContent,10)||0)+1)})()`);await page.waitForTimeout(50);return run('window.__C')};
const o={};
await run(`showUI(false)`);o.hidden=await up();
await run(`showUI(true)`);o.justShown=await up();
await page.waitForTimeout(1600);o.later=await up();
console.log(o);
assert.equal(o.hidden,0,'上の欄がかくれているあいだは鳴らさない');assert.equal(o.justShown,0,'上の欄が出てすぐは鳴らさない');assert.equal(o.later,1,'1.5秒たったら鳴る');
assert.deepEqual(errors,[]);console.log('Count arrive ok. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
