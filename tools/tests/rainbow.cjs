const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 虹（雨のつぎの朝・たのしさのへりかた0.5倍）。村まつりはなくした */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.mtEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.mtEval);
const out=await page.evaluate(()=>mtEval(`(()=>{const out={};const R0=Math.random;
function setup(w,day,h){S=newState(w);setWorld(w);S.enemies=[];S.t=1440*(day-1)+h*60;USERPAUSE=true;recount();if(STATUE<0&&w===0){S.obj[CY*W+CX-10]="statue";recount()}}
setup(0,4,6);S.rain=true;Math.random=()=>.1;morning();Math.random=R0;out.rb={day:S.rbDay===dayNo(),rain:S.rain,on:rainbowToday()};
const r=S.res[0];r.hidden=false;const drop=()=>{r.fun=80;r.hunger=200;r.energy=100;r.act={type:'idle',stage:'do',t:0,dur:9999};const f=r.fun;stepWorld(1);return f-r.fun};const d1=drop();S.rbDay=-1;const d0=drop();out.ratio=Math.round(d1/d0*100)/100;
out.gone=typeof matsuriTick==='undefined'&&typeof MATSURI_THEMES==='undefined'&&!('mdance' in ACT);return out})()`));
console.log(out);
assert.deepEqual(out.rb,{day:true,rain:false,on:true});assert.equal(out.gone,true);assert.ok(out.ratio>.45&&out.ratio<.55,'ratio '+out.ratio);
assert.deepEqual(errors,[]);
console.log('Rainbow: rainbow after rain halves fun loss; festival code removed. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
