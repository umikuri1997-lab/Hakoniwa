/* 水やりの音（work-fx.js の pourKeep）：せいれいが水やりをやめたら（ほかの作業・作業がおわる・歩きだす）、3秒の音のおわりを待たずに、すぐ止まる */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=true;audioInit();AC.resume();if(sheet)closeSheet()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'`),{},{timeout:30000});
const out=await run(`(async()=>{SBUF.pourw=[AC.createBuffer(1,AC.sampleRate*20,AC.sampleRate)];const base=S.res[0];S.res=[];S.enemies=[];const o={};
 const mk=(i,type)=>{const r=JSON.parse(JSON.stringify(base));r.id=600+i;r.nap=false;r.x=cam.x/TS+VW/cam.z/TS/2+i*.3;r.y=cam.y/TS+VH/cam.z/TS/2;r.act={type,stage:'do',t:0};S.res.push(r);return r};
 const WB=workBeat;workBeat=()=>{};/* 止まった村で絵をかくときの音消し（workBeat）は、ここではためさない */USERPAUSE=true;const w=()=>new Promise(f=>setTimeout(f,250));const A=mk(0,'water'),B=mk(1,'tend'),C=mk(2,'water'),D=mk(3,'water');
 const chg=[r=>{r.act={type:'chop',stage:'do',t:0}},r=>{r.act=null},r=>{r.act.stage='walk'},()=>{}];o.on=[];o.after=[];
 for(const[i,r]of[A,B,C,D].entries()){await w();await w();pourKeep(r);o.on.push(!!POURS.get(r));chg[i](r);await w();o.after.push(!!POURS.get(r))}
 USERPAUSE=false;workBeat=WB;return o})()`);
console.log(out);
assert.deepEqual(out.on,[true,true,true,true],'水やりのあいだは鳴る');
assert.deepEqual(out.after,[false,false,false,true],'ほかの作業・おわり・歩きだすと、すぐ止まる。水やりをつづける子は鳴ったまま');
assert.deepEqual(errors,[]);console.log('Pour sound stops right away when watering ends. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
