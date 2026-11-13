const assert=require('node:assert/strict');
/* くらしの動線：しごとば・ごはんどころ・ねどこのスポットと、昼に歩くとつかれること */
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
const out=JSON.parse(await run(`(()=>{USERPAUSE=true;const o={};
 for(let y=30;y<80;y++)for(let x=30;x<80;x++){const j=y*W+x;S.obj[j]='';S.floor[j]='';S.hi[j]=0;S.ground[j]=0}
 const put=(id,x,y)=>{S.obj[y*W+x]=id;if(BL[id].dyn)S.dyn[y*W+x]=S.dyn[y*W+x]||{}};
 put('crate',40,40);put('ntree',42,40);put('ntree',42,42);put('rock',38,41);
 put('crate',50,40);put('table',52,40);
 for(let x=44;x<=50;x++){put('hwall',x,50);put('hwall',x,55)}for(let y=50;y<=55;y++){put('hwall',44,y);put('hwall',50,y)}S.obj[55*W+47]='door';put('bed',46,52);put('candle',49,54);for(let y=51;y<55;y++)for(let x=45;x<50;x++)S.floor[y*W+x]='floor';
 recount();o.shig=spotHas(40*W+40,'shigotoba');o.shigNear=spotNear(42*W+40,'shigotoba');o.gohan=spotHas(40*W+50,'gohan');o.gohanNear=spotNear(41*W+51,'gohan');
 const h=HOUSES.find(h=>h.inside.has(52*W+46));o.c0=houseComfort(h).v;put('table',48,52);recount();const h2=HOUSES.find(h=>h.inside.has(52*W+46));o.nedoko=spotHas(52*W+46,'nedoko');o.c1=houseComfort(h2).v;
 put('crate',40,40);S.obj[42*W+40]='';S.obj[42*W+42]='';recount();o.shig2=spotHas(40*W+40,'shigotoba');
 const r=S.res[0];const go=(t)=>{S.t=1440*3+t*60;r.x=60.5;r.y=60.5;r.energy=80;r.act=null;r.path=[];for(let k=1;k<=20;k++)r.path.push(60*W+60+k);moveR(r,10);return r.energy};
 o.dayE=go(12);o.nightE=go(23);
 return JSON.stringify(o)})()`));
console.log(out);
assert.equal(out.shig,true);assert.equal(out.shigNear,true);assert.equal(out.gohan,true);assert.equal(out.gohanNear,true);
assert.equal(out.nedoko,true);assert.ok(out.c1>out.c0,'ねどこで住み心地が上がる');assert.equal(out.shig2,false);
assert.ok(out.dayE<80,'昼に歩くとつかれる');assert.equal(out.nightE,80,'夜はかわらない');
assert.deepEqual(errors,[]);console.log('life-spots: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
