const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 虹（雨のつぎの朝・たのしさのへりかた0.5倍）と村まつり（7日ごと・前の日にお題・夕方におどってごほうび・火山にはない） */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.mtEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.mtEval);
const out=await page.evaluate(()=>mtEval(`(()=>{const out={};const R0=Math.random;
function setup(w,day,h){S=newState(w);setWorld(w);S.enemies=[];S.t=1440*(day-1)+h*60;USERPAUSE=true;recount();if(STATUE<0&&w===0){S.obj[CY*W+CX-10]="statue";recount()}}
setup(0,4,6);S.rain=true;Math.random=()=>.1;morning();Math.random=R0;out.rb={day:S.rbDay===dayNo(),rain:S.rain,on:rainbowToday()};
const r=S.res[0];r.hidden=false;const drop=()=>{r.fun=80;r.hunger=200;r.energy=100;r.act={type:'idle',stage:'do',t:0,dur:9999};const f=r.fun;stepWorld(1);return f-r.fun};const d1=drop();S.rbDay=-1;const d0=drop();out.ratio=Math.round(d1/d0*100)/100;
setup(0,6,6);S.rain=false;Math.random=()=>.9;morning();Math.random=R0;out.ann=S.matsuri&&{day:S.matsuri.day,th:!!MATSURI_THEMES[S.matsuri.th]};
S.matsuri.th='cook';matsuriCook('bread');matsuriCook('bread');matsuriCook('salad');out.cook=matsuriProg(S.matsuri);
const box=document.createElement('div');out.row=matsuriRows(box)===1&&box.textContent;
S.matsuri.th='light';const sx=STATUE>=0?STATUE%W:CX,sy=STATUE>=0?(STATUE/W|0):CY;let k=0;for(let y=sy+8;y<sy+12&&k<10;y++)for(let x=sx-6;x<sx+6&&k<10;x++){const j=y*W+x;if(!S.obj[j]&&S.ground[j]===0){S.obj[j]='torch';k++}}recount();out.met=matsuriMet(S.matsuri);
S.t=1440*6+17*60;for(const q of S.res){q.hidden=false;q.hunger=200;q.act=null}const inv0=JSON.stringify(S.inv),fun0=S.res.map(q=>q.fun=50);matsuriHour(16);out.before=S.matsuri.res;matsuriHour(17);out.res=S.matsuri.res;out.dancers=S.res.filter(q=>q.act&&q.act.type==='mdance').length;
for(let i=0;i<400&&S.res.some(q=>q.act&&q.act.type==='mdance'&&q.act.stage!=='do');i++)stepWorld(.25);out.arrived=S.res.filter(q=>q.act&&q.act.type==='mdance'&&q.act.stage==='do').length;
for(const q of S.res){q.fun=50;if(q.act&&q.act.type==="mdance")q.act.r0-=10000}stepWorld(.1);out.after=S.matsuri.res;const inv1=S.inv;out.gift=Object.keys(inv1).filter(id=>(inv1[id]||0)>(JSON.parse(inv0)[id]||0)&&BL[id].offerOnly);out.funUp=S.res.every(q=>q.fun>=79);
setup(0,7,17);S.matsuri={day:7,th:'flower',cook:[],res:null};matsuriHour(17);out.miss=S.matsuri.res;
setup(0,7,17);S.matsuri={day:7,th:'flower',cook:[],res:null};matsuriHour(20);out.late=S.matsuri.res;
setup(1,6,6);Math.random=()=>.9;morning();Math.random=R0;out.volcano=S.matsuri||null;
return out})()`));
console.log(out);
assert.deepEqual(out.rb,{day:true,rain:false,on:true});assert.ok(out.ratio>.45&&out.ratio<.55,'ratio '+out.ratio);
assert.deepEqual(out.ann,{day:7,th:true});assert.equal(out.cook,2);assert.ok(out.row.includes('料理を5しゅるい作る')&&out.row.includes('2 / 5'));
assert.equal(out.met,true);assert.equal(out.before,null);assert.equal(out.res,'dance');assert.ok(out.dancers>=1);assert.equal(out.arrived,out.dancers);assert.equal(out.after,'done');assert.equal(out.gift.length,1);assert.equal(out.funUp,true);
assert.equal(out.miss,'miss');assert.equal(out.late,'skip');assert.equal(out.volcano,null);assert.deepEqual(errors,[]);
console.log('Matsuri: rainbow after rain halves fun loss; festival announced the day before, theme progress in goals, dance then one offering furniture and fun+30; miss/late paths; none in volcano. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
