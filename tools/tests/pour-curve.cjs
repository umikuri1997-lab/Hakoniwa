/* 水やりの音（audio.js の playPour）と朝・夜の音（dayChimeTick）：音の大きさの予定は、曲線1本だけ。
   曲線のはしに、べつの予定（setValueAtTime など）をおくと、Safari で「Events are overlapping」のエラーになる */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'`),{},{timeout:30000});
const out=await run(`(()=>{const P=AudioParam.prototype,names=['setValueAtTime','linearRampToValueAtTime','setValueCurveAtTime','setTargetAtTime','exponentialRampToValueAtTime'],keep={},L=[];
 for(const k of names){keep[k]=P[k];P[k]=function(...a){L.push(k);return keep[k].apply(this,a)}}
 const o={};SBUF.pourw=[AC.createBuffer(1,AC.sampleRate*20,AC.sampleRate)];o.pour=playPour(1);o.pourEv=L.splice(0).join(',');
 SBUF.dawn=[AC.createBuffer(1,AC.sampleRate*8,AC.sampleRate)];CHIMES=S;CHIMEH=5.9;S.t+=((6.05-hour()+24)%24)*60;dayChimeTick();o.chimeEv=L.splice(0).join(',');
 for(const k of names)P[k]=keep[k];return o})()`);
console.log(out);
assert.equal(out.pour,true,'水やりの音が鳴る');assert.equal(out.pourEv,'setValueCurveAtTime','水やり：曲線1本だけ');assert.equal(out.chimeEv,'setValueCurveAtTime','朝の音：曲線1本だけ');
assert.deepEqual(errors,[]);console.log('Pour and chime volume: one curve each, no other events. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
