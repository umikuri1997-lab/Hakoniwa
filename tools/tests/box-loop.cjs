/* 箱にしまう・取るあいだのゴソゴソ（work-fx.js の boxLoop）：動きのあいだ、くりかえしの音が鳴り、おわったら止まる・近い子から2人まで・村の時間が止まったら止まる */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&(SBUF.goso||[]).some(Boolean)`),{},{timeout:30000});
const out=await run(`(()=>{const o={};const base=S.res[0];S.res=[];S.enemies=[];
 const mk=(i,type)=>{const r=JSON.parse(JSON.stringify(base));r.id=500+i;r.name='b'+i;r.nap=false;r.x=cam.x/TS+VW/cam.z/TS/2+i*.3;r.y=cam.y/TS+VH/cam.z/TS/2;r.act={type,stage:'do',t:0};S.res.push(r);return r};
 const R=[0,1,2,3,4].map(i=>mk(i,i%2?'bfetch':'store'));
 o.paused=paused();for(const r of R)boxBeat(r,0);boxLoopTick();
 const live=[...GOSOL.values()];o.n=live.length;o.playing=live.filter(e=>e.src).length;o.loop=live.filter(e=>e.src).every(e=>e.src.loop&&Math.abs(e.src.loopEnd-e.src.loopStart-BOXLOOPL)<1e-6);
 const b=SBUF.goso.find(Boolean);o.len=b.duration;
 R[0].act=null;R[1].act=null;boxBeat(R[2],0);boxBeat(R[3],0);boxBeat(R[4],0);boxLoopTick();o.after=[...GOSOL.values()].filter(e=>e.src).length;o.left=GOSOL.size;
 USERPAUSE=true;for(const r of R.slice(2))boxBeat(r,0);boxLoopTick();o.pausedPlay=[...GOSOL.values()].filter(e=>e.src).length;USERPAUSE=false;
 for(const r of R.slice(2))boxBeat(r,0);boxLoopTick();const E=[...GOSOL.values()];o.re=E.filter(e=>e.src).length;
 USERPAUSE=true;for(const r of R)r.act=null;boxLoopTick();o.orphan=E.filter(e=>e.src).length;USERPAUSE=false;/* 止まっているあいだにおわっても、音は止まる */
 for(const r of R)r.act=null;boxLoopTick();o.end=GOSOL.size;
 const z=mk(9,'store');z.nap=true;boxBeat(z,0);boxLoopTick();o.nap=[...GOSOL.values()].filter(e=>e.src).length;z.nap=false;RHOLD.set(z,performance.now()+6e4);boxBeat(z,0);boxLoopTick();o.hold=[...GOSOL.values()].filter(e=>e.src).length;RHOLD.set(z,0);z.act=null;boxLoopTick();return o})()`);
console.log(out);
assert.equal(out.paused,false);assert.equal(out.n,5);assert.equal(out.playing,2,'近い子から2人まで');assert.ok(out.loop,'1まわりをくりかえす');
assert.ok(out.len>3*1.0337-.01,'1まわりを3つならべた音');assert.equal(out.left,3);assert.equal(out.after,2,'おわった子の音は止まり、のこりの子が鳴る');
assert.equal(out.pausedPlay,0,'村の時間が止まったら止まる');assert.equal(out.re,2);assert.equal(out.orphan,0,'村の時間が止まっているあいだにおわっても、鳴りのこらない');assert.equal(out.end,0,'みんなおわったら止まる');assert.equal(out.nap,0,'寝ている子は鳴らさない');assert.equal(out.hold,0,'場面で止められた子は鳴らさない');
assert.deepEqual(errors,[]);console.log('Box loop: gosogoso plays while storing/taking, up to 2 nearest, stops on end and pause. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
