const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* おびきよせの石像：まわり7マスのコワイノは、先に像をこわしにくる。こわれたら消えて、直せる。火のせいれいがむかえうつ。オオカゲはひっかからない。水のステージでおぼえる */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.luEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.luEval);
await page.waitForFunction(()=>luEval('!!window.CHIPS&&!!CHIPS["kgp_basic:head"]&&!!CHIPS["kgp_brute:head"]&&!!CHIPS["kgp_fast:head"]'),null,{timeout:30000});
const out=await page.evaluate(()=>luEval(`(()=>{const o={};S=newState(0);setWorld(0);S.obj.fill('');S.hi.fill(0);if(S.fog)S.fog.fill(0);
 const w0=WD;o.lvGrass=levelUpItemsAt(6).includes('lurestatue');WD=2;o.lvWater=levelUpItemsAt(6).includes('lurestatue');WD=w0;
 grecOf().set('lurestatue',2);S.recipes=S.recipes||{};S.recipes.lurestatue=1;/* 水のステージでおぼえたことにする */
 const j=50*W+50;S.obj[j]='lurestatue';recount();o.lures=LURES.length;
 const fire=S.res.find(r=>r.elem==='fire')||S.res[0];fire.elem='fire';S.res=[Object.assign(fire,{hidden:false,x:50.5,y:36.5,act:null,hunger:999})];
 const mk=(id,type,x,y)=>({id,type,x,y,hp:99,max:99,spawned:true,path:[],atk:0,stun:0,flash:0,repath:0});
 const A=mk(1,'basic',55.5,50.5),B=mk(2,'basic',50.5,62.5),C=mk(3,'boss',54.5,51.5);S.enemies=[A,B,C];S.t=(5*24+22)*60;
 for(let i=0;i<40;i++){for(const e of S.enemies)updEnemy(e,.25);if(i===0)o.tgB=B.tg}
 o.tgA=A.tg;o.tgC=C.tg;
 for(let i=0;i<20000&&S.obj[j]==='lurestatue';i++){updEnemy(A,.25);if(i===2000)o.hpMid=S.hp[j];if(A.hitT!=null&&o.foes==null&&S.hp[j]<60)o.foes=foesNow().map(e=>e.id).join()}
 o.gone=S.obj[j]==='';o.broken=(S.broken||[]).some(b=>b.j===j&&b.id==='lurestatue');recount();o.lures2=LURES.length;
 return o})()`));
console.log(JSON.stringify(out));
assert.equal(out.lvGrass,false);assert.equal(out.lvWater,true);assert.equal(out.lures,1);
assert.equal(out.tgA,'d'+(50*108+50),'7マスの中は像をねらう');assert.notEqual(out.tgB,'d'+(50*108+50),'7マスの外はねらわない');assert.notEqual(out.tgC,'d'+(50*108+50),'オオカゲはひっかからない');
assert.ok(out.hpMid<60,'像にダメージ');assert.equal(out.foes,'1','火のせいれいは像をこわしているコワイノを先にねらう');assert.equal(out.gone,true);assert.equal(out.broken,true);assert.equal(out.lures2,0);
assert.deepEqual(errors,[]);console.log('Lure statue OK');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
