const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 植えた花・木の芽は、つぎの朝6時に育つ（夜中の0時では育たない） */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.mtEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.mtEval);
const out=await page.evaluate(()=>mtEval(`(()=>{const out={};
S=newState(0);setWorld(0);S.enemies=[];S.enemyOn=true;USERPAUSE=true;recount();
const run=(day,h)=>{const goal=1440*(day-1)+h*60;let n=0;while(clk()<goal&&n++<40000){stepWorld(.5);S.enemies=[];S.wave=null}};
const plant=(j,id)=>{S.obj[j]=id;(S.bud||(S.bud={}))[j]=callDay()+1;recount()};
const a=(CY+6)*W+CX+6,b=(CY+6)*W+CX+8;
S.t=1440*1+14*60;S.hold=0;S.lastMorning=dayNo();plant(a,'clover');out.d14=isBud(a);
run(3,0.5);out.n0=isBud(a);run(3,5.9);out.n5=isBud(a);run(3,6.2);out.n6=isBud(a);out.del=!(a in S.bud);
plant(b,'tree');run(4,3);out.t3=isBud(b);run(4,6.2);out.t6=isBud(b);return out})()`));
console.log(out);
assert.deepEqual(out,{d14:true,n0:true,n5:true,n6:false,del:true,t3:true,t6:false});
assert.deepEqual(errors,[]);
console.log('Bud: flowers and trees grow at 6:00, not 0:00. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
