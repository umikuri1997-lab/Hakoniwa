/* マップの読みこみ中の曲（audio.js の ldMusicTick）：「マップを読みこみ中…」（STLD）のあいだだけ鳴り、おわったら1秒で消える。音楽を切っていれば鳴らない */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.bgm=true;audioInit();AC.resume()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&(SBUF.ldmusic||[]).some(Boolean)`),{},{timeout:30000});
const out=await run(`(()=>{const o={},L=[],P=[];const st=AudioBufferSourceNode.prototype.start,sp=AudioBufferSourceNode.prototype.stop;
 AudioBufferSourceNode.prototype.start=function(...a){if(this.buffer===SBUF.ldmusic[0])L.push(this);return st.apply(this,a)};AudioBufferSourceNode.prototype.stop=function(...a){if(this.buffer===SBUF.ldmusic[0])P.push(a[0]-AC.currentTime);return sp.apply(this,a)};
 const s0=STLD;STLD=true;ldMusicTick();ldMusicTick();o.start=L.length;o.loop=L[0]&&L[0].loop;
 STLD=false;ldMusicTick();o.stopIn=P.length?Math.round(P[0]*100)/100:null;
 SND.bgm=false;STLD=true;ldMusicTick();o.off=L.length;SND.bgm=true;STLD=s0;ldMusicTick();
 AudioBufferSourceNode.prototype.start=st;AudioBufferSourceNode.prototype.stop=sp;return o})()`);
console.log(out);
assert.equal(out.start,1,'読みこみ中に1回だけ鳴らしはじめる');assert.equal(out.loop,true,'くりかえす');
assert.ok(out.stopIn>=1&&out.stopIn<1.2,'おわったら1秒で消す');assert.equal(out.off,1,'音楽を切っていれば鳴らない');
assert.deepEqual(errors,[]);console.log('Load music: plays only while the map loads, fades in 1s. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
