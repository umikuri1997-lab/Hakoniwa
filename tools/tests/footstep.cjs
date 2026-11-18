/* せいれいの足音（audio.js の footTick）：歩いた道のりで鳴り、地面で音がかわる（草・木の床）。寝ている子・止まっている子は鳴らない */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&['fgrass','fwood','fsoil'].every(k=>(SBUF[k]||[]).some(Boolean))`),{},{timeout:30000});
const out=await run(`(()=>{const o={},name=b=>{for(const k in SBUF)if((SBUF[k]||[]).includes(b))return k;return'?'},L=[];const st=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){L.push(name(this.buffer));return st.apply(this,a)};
 const r=S.res[0];r.nap=false;RHOLD.set(r,0);S.enemies=[];const cx=Math.floor(cam.x/TS+VW/cam.z/TS/2),cy=Math.floor(cam.y/TS+VH/cam.z/TS/2);let j=cy*W+cx;
 const walkOn=(set)=>{L.length=0;r.act=null;r.x=cx+.5;r.y=cy+.5;FOOTP.delete(r);footTick();for(let i=1;i<=8;i++){set();r.x=cx+.5+i*.3;footTick()}return L.filter(k=>k[0]==='f'||k==='twater')};
 REV.add(j);for(let i=0;i<4;i++)REV.add(j+i);S.floor[j]=null;o.grass=walkOn(()=>{});
 for(let i=0;i<4;i++)S.floor[j+i]='floor';o.wood=walkOn(()=>{});for(let i=0;i<4;i++)S.floor[j+i]=null;
 L.length=0;r.x=cx+.5;footTick();for(let i=0;i<8;i++)footTick();o.still=L.filter(k=>k[0]==='f').length;
 r.act={type:'sleep',stage:'do',t:0};L.length=0;for(let i=1;i<=8;i++){r.x=cx+.5+i*.3;footTick()}o.sleep=L.filter(k=>k[0]==='f').length;r.act=null;
 AudioBufferSourceNode.prototype.start=st;return o})()`);
console.log(out);
assert.ok(out.grass.length>=3&&out.grass.every(k=>k==='fgrass'),'草の上は草の足音');
assert.ok(out.wood.length>=3&&out.wood.every(k=>k==='fwood'),'木の床は木の足音');
assert.equal(out.still,0,'止まっている子は鳴らない');assert.equal(out.sleep,0,'寝ている子は鳴らない');
assert.deepEqual(errors,[]);console.log('Footsteps: by distance, by ground, none when still or asleep. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
