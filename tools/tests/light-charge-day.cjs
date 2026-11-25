/* 守りの光の「ため」：昼も夜も、地図を2秒おしつづけて、ぴったりにはなすと、ためた光になる。昼の木は、ためた光で LIGHTHITC だけけずる */
const assert=require('node:assert/strict'),boot=require('../sim/boot.cjs');
(async()=>{const {browser,page,run,errors}=await boot();
const res={};
for(const [name,t] of [['day',720],['night',60]]){
 await run(`(()=>{S.t=${t};S.pt=50;LIGHTCD=0;window.__ch=[];if(!window.__glc0)window.__glc0=glCast;glCast=(x,y,f,ch)=>{__ch.push(!!ch);return true};setMode('look');LIGHTARM=true;dockSync();})()`);
 const box=await page.locator('canvas').first().boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(2150);await page.mouse.up();await page.waitForTimeout(100);
 res[name]=JSON.parse(await run(`JSON.stringify({ch:__ch,night:isNight(),arm:LIGHTARM})`));
 await run(`glCast=__glc0`);}
/* 昼の木：ふつうの光は LIGHTHIT、ためた光は LIGHTHITC */
await run(`(()=>{S.t=720;S.enemies=[];for(const [k,x] of [['n',CX+6],['c',CX+10]]){const j=(CY+6)*W+x;S.obj[j]='tree';delete S.hp['lp'+j];window['__j'+k]=j}S.pt=10;LIGHTCD=0;glCast(CX+6,CY+6,null,false);LIGHTCD=0;glCast(CX+10,CY+6,null,true)})()`);
await page.waitForTimeout(500);
res.tree=JSON.parse(await run(`JSON.stringify({n:S.hp['lp'+__jn]||0,c:S.hp['lp'+__jc]||0,wn:LIGHTHIT.tree,wc:LIGHTHITC.tree})`));
console.log(JSON.stringify(res));
assert.equal(res.tree.n,res.tree.wn,'ふつうの光');assert.equal(res.tree.c,res.tree.wc,'ためた光は、木を LIGHTHITC けずる');
assert.equal(res.day.night,false);assert.deepEqual(res.day.ch,[true],'昼も、ためた光');
assert.deepEqual(res.night.ch,[true],'夜も、ためた光');
assert.deepEqual(errors,[]);console.log('guard light charge works by day and night');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
