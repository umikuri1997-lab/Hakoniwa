const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 守りの光：コワイノの絵が描いてある所ぜんぶ（頭・四すみ）があたり、外はあたらない。段差の上でも同じ */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.ltEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.ltEval);
await page.waitForFunction(()=>ltEval('!!window.CHIPS&&!!CHIPS["kgp_basic:head"]&&!!CHIPS["kgp_brute:head"]&&!!CHIPS["kgp_fast:head"]'),null,{timeout:30000});
const out=await page.evaluate(()=>ltEval(`(()=>{const out={};S=newState(0);setWorld(0);S.hi.fill(0);S.obj.fill('');S.enemies=[];cam.z=1.5;cam.x=40*TS;cam.y=40*TS;
 let hit=null;guardLight=e=>{hit=e};const tap=(wx,wy)=>{hit=null;LIGHTARM=true;onTap((wx-cam.x)*cam.z,(wy-cam.y)*cam.z);return hit};
 for(const [type,hi] of [['boss2',0],['boss',0],['basic',0],['boss',1],['hino',2]]){S.hi.fill(0);const x=50,y=50;S.hi[y*W+x]=hi;const e={id:S.nid++,type,x:x+.5,y:y+.5,hp:9,max:9,spawned:true,path:[],atk:0,stun:0,flash:0};S.enemies=[e];
  const b=enemyBox(e),px=e.x*TS,py=e.y*TS+8-uLift(e),r={};
  const pts={tl:[px+b.l+1,py+b.t+1],tr:[px+b.r-1,py+b.t+1],bl:[px+b.l+1,py+b.b-1],br:[px+b.r-1,py+b.b-1],head:[px,py+b.t+2],outR:[px+b.r+30,py+(b.t+b.b)/2],outT:[px,py+b.t-30]};
  for(const k in pts)r[k]=tap(...pts[k])===e;r.oldHead=Math.hypot(0,(py+b.t+2+hi*LIFT)/TS-e.y)<.8;r.h=b.b-b.t;out[type+hi]=r}
 /* 重なったら手前（下）の子 */S.hi.fill(0);const a={id:1,type:'boss',x:50.5,y:50.5,spawned:true,hp:1,max:1,path:[],atk:0,stun:0,flash:0},c={id:2,type:'basic',x:50.5,y:51.2,spawned:true,hp:1,max:1,path:[],atk:0,stun:0,flash:0};S.enemies=[a,c];out.front=tap(50.5*TS,51.2*TS)===c;
 return out})()`));
console.log(JSON.stringify(out));
for(const k of['boss20','boss0','basic0','boss1','hino2']){const r=out[k];for(const p of['tl','tr','bl','br','head'])assert.equal(r[p],true,k+' '+p);assert.equal(r.outR,false,k);assert.equal(r.outT,false,k)}
assert.equal(out.boss20.oldHead,false);assert.equal(out.front,true);assert.deepEqual(errors,[]);
console.log('Guard light: whole sprite area hits for small enemies and bosses (also on high tiles), outside misses, front enemy wins. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
