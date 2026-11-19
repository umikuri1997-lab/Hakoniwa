/* せいれいの足音（audio.js の footTick）：歩く動きの、足がつくコマ（1/4・3/4）に合わせて鳴り、地面で音がかわる（草・木の床・石畳、雨の日の外の草地・道はぬれた地面の音、家の中・橋・石畳はふつう）。寝ている子・止まっている子は鳴らない。コワイノも、とても小さく鳴る */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&['fgrass','fwood','fsoil','fstone','fwet','fsnow'].every(k=>(SBUF[k]||[]).some(Boolean))`),{},{timeout:30000});
const out=await run(`(()=>{const o={},name=b=>{for(const k in SBUF)if((SBUF[k]||[]).includes(b))return k;return'?'},L=[];const st=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){L.push(name(this.buffer));return st.apply(this,a)};
 const r=S.res[0];r.nap=false;RHOLD.set(r,0);S.enemies=[];const cx=Math.floor(cam.x/TS+VW/cam.z/TS/2),cy=Math.floor(cam.y/TS+VH/cam.z/TS/2);let j=cy*W+cx;
 const walkOn=(set)=>{L.length=0;r.act=null;r.x=cx+.5;r.y=cy+.5;FOOTP.delete(r);const T0=performance.now();footTick(T0);for(let i=1;i<=8;i++){set();r.x=cx+.5+i*.3;footTick(T0+i*100)}return L.filter(k=>k[0]==='f'||k==='twater')};
 REV.add(j);for(let i=0;i<4;i++)REV.add(j+i);S.floor[j]=null;o.grass=walkOn(()=>{});
 for(let i=0;i<4;i++)S.floor[j+i]='floor';o.wood=walkOn(()=>{});for(let i=0;i<4;i++)S.floor[j+i]=null;
 {const rn=S.rain,sn=window.seasonNow;window.seasonNow=()=>0;S.rain=true;o.wet=walkOn(()=>{});/* 雨の日の外の草地 */
  for(let i=0;i<4;i++)S.floor[j+i]='path';o.wetPath=walkOn(()=>{});for(let i=0;i<4;i++)S.floor[j+i]='stone';o.wetStone=walkOn(()=>{});for(let i=0;i<4;i++)S.floor[j+i]=null;
  const fh={set:new Set([0,1,2,3,4].map(i=>j+i)),inside:new Set()};HOUSES.push(fh);o.wetIn=walkOn(()=>{});HOUSES.splice(HOUSES.indexOf(fh),1);/* 家の中（かりの家） */
  const ob=S.obj[j];S.obj[j]='bridge';o.wetBridge=footMat(cx+.5,cy+.5);S.obj[j]=ob;
  window.seasonNow=()=>3;const sa=S.snowA;S.snowA=1;o.snow=footMat(cx+.5,cy+.5);S.snowA=sa;window.seasonNow=sn;S.rain=rn}
 L.length=0;r.x=cx+.5;footTick();for(let i=0;i<8;i++)footTick();o.still=L.filter(k=>k[0]==='f').length;
 r.act={type:'sleep',stage:'do',t:0};L.length=0;for(let i=1;i<=8;i++){r.x=cx+.5+i*.3;footTick()}o.sleep=L.filter(k=>k[0]==='f').length;r.act=null;
 AudioBufferSourceNode.prototype.start=st;return o})()`);
console.log(out);
assert.ok(out.grass.length>=2&&out.grass.every(k=>k==='fgrass'),'草の上は草の足音');
assert.ok(out.wood.length>=2&&out.wood.every(k=>k==='fwood'),'木の床は木の足音');
assert.ok(out.wet.length>=2&&out.wet.every(k=>k==='fwet'),'雨の日の外の草地は、ぬれた地面の足音');
assert.ok(out.wetPath.length>=2&&out.wetPath.every(k=>k==='fwet'),'雨の日の外のあぜ道は、ぬれた地面の足音');
assert.ok(out.wetStone.length>=2&&out.wetStone.every(k=>k==='fstone'),'雨の日でも石畳は石の足音');
assert.ok(out.wetIn.length>=2&&out.wetIn.every(k=>k==='fgrass'),'雨の日でも家の中はふつうの足音');
assert.equal(out.wetBridge,'fwood','雨の日でも橋は木の足音');assert.equal(out.snow,'fsnow','雪がつもった所は雪の足音');
assert.equal(out.still,0,'止まっている子は鳴らない');assert.equal(out.sleep,0,'寝ている子は鳴らない');
assert.deepEqual(errors,[]);console.log('Footsteps: by distance, by ground, wet ground on rainy days, none when still or asleep. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
