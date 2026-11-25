/* ブロックをこわす音：土は、ほる音の「キーン」を切った録音（digSoil）、石は石をほる音だけ（blkStone）。木はもとのほる音（dig）のまま */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume();if(sheet)closeSheet()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&['digSoil','blkStone','dig','tsoil','tstone','twood'].every(k=>(SBUF[k]||[]).some(Boolean))`),{},{timeout:30000});
const out=await run(`(()=>{const name=b=>{for(const k in SBUF)if((SBUF[k]||[]).includes(b))return k;return'?'},L=[];const st=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){L.push(name(this.buffer));return st.apply(this,a)};
 const o={},got=k=>{L.length=0;for(const q in lastSfx)delete lastSfx[q];sfx(k);return L.slice().sort().join(',')};
 o.hitSoil=got('fudedig:tsoil');o.brkSoil=got('brk_tsoil');o.hitStone=got('fudedig:tstone');o.brkStone=got('brk_tstone');o.hitWood=got('fudedig:twood');o.brkWood=got('brk_twood');
 AudioBufferSourceNode.prototype.start=st;return o})()`);
console.log(out);
assert.equal(out.hitSoil,'digSoil,tsoil','土をたたく：土の音＋キーンを切ったほる音');
assert.equal(out.brkSoil,'digSoil,tsoil','土がこわれる');
assert.equal(out.hitStone,'blkStone','石をたたく：石をほる音だけ');
assert.equal(out.brkStone,'blkStone','石がこわれる');
assert.equal(out.hitWood,'dig,twood','木はいまのまま');
assert.equal(out.brkWood,'dig,twood','木はいまのまま');
assert.deepEqual(errors,[]);console.log('Block break sound ok. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
