/* 季節・時間の環境音（audio.js の ambTick）：朝は朝の音、昼は春・夏はもらった音／秋・冬は鳥の声、夜は夏はもらった音／ほかは虫の声。雨は雨の音だけ */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume()})()`);
const K=['birds','night','rain','amb_morn','amb_spr','amb_sum','amb_snight'];
await page.waitForFunction(k=>sacredEval(`AC.state==='running'&&${JSON.stringify(k)}.every(k=>(SBUF[k]||[]).some(Boolean))`),K,{timeout:30000});
const out=await run(`(()=>{const o={},at=h=>{S.t+=((h-hour()+24)%24)*60};
 const want=(se,h,rain)=>{const sv=seasonNow;seasonNow=()=>se;at(h);S.rain=!!rain;const L=[];const tgt=AudioParam.prototype.setTargetAtTime;AudioParam.prototype.setTargetAtTime=function(v,...a){if(v>.05)L.push(this.__k);return tgt.call(this,v,...a)};
   for(const k in AMB)AMB[k].g.gain.__k=k;ambTick();for(const k in AMB)AMB[k].g.gain.__k=k;L.length=0;ambTick();AudioParam.prototype.setTargetAtTime=tgt;seasonNow=sv;return L.sort().join(',')};
 o.morn=[0,1,2,3].map(s=>want(s,6));o.noon=[0,1,2,3].map(s=>want(s,12));o.night=[0,1,2,3].map(s=>want(s,23));o.rain=want(1,12,1);S.rain=false;return o})()`);
console.log(out);
assert.deepEqual(out.morn,['amb_morn','amb_morn','amb_morn','amb_morn'],'朝はどの季節も朝の音');
assert.deepEqual(out.noon,['amb_spr','amb_sum','birds','birds'],'昼：春・夏はもらった音、秋・冬は鳥の声');
assert.deepEqual(out.night,['night','amb_snight','night','night'],'夜：夏はもらった音、ほかは虫の声');
assert.equal(out.rain,'rain','雨の日は雨の音だけ');
assert.deepEqual(errors,[]);console.log('Season ambience: morning / spring / summer / summer night / others unchanged. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
