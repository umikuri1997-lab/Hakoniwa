/* 朝6時・夜12時の音（audio.js の dayChimeTick）：時計がこえたときに1回だけ鳴る。読みこみ・村の切りかえでは鳴らない */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&['dawn','midnight'].every(k=>(SBUF[k]||[]).some(Boolean))`),{},{timeout:30000});
const out=await run(`(()=>{const o={},name=b=>{for(const k in SBUF)if((SBUF[k]||[]).includes(b))return k;return'?'},L=[];const st=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){L.push(name(this.buffer));return st.apply(this,a)};
 const at=h=>{S.t+=((h-hour()+24)%24)*60};const n=k=>L.filter(x=>x===k).length;
 at(5.9);dayChimeTick();at(6.05);dayChimeTick();dayChimeTick();o.dawn=n('dawn');
 at(23.9);dayChimeTick();at(0.05);dayChimeTick();dayChimeTick();o.mid=n('midnight');
 at(12);dayChimeTick();o.noon=n('dawn')+n('midnight');
 CHIMES=null;at(5.95);dayChimeTick();at(6.02);CHIMES=null;dayChimeTick();o.reload=n('dawn');
 AudioBufferSourceNode.prototype.start=st;return o})()`);
console.log(out);
assert.equal(out.dawn,1,'朝6時に1回');assert.equal(out.mid,1,'夜12時に1回');assert.equal(out.noon,2,'昼にはふえない');assert.equal(out.reload,1,'読みこみ・切りかえでは鳴らない');
assert.deepEqual(errors,[]);console.log('Day chime: dawn at 6, midnight at 0, once each, not on reload. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
