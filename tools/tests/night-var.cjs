const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 防衛の夜の変化：霧の夜は見張り台のとどく所が半分、群れの夜は1か所から来る、出ない夜の決まり、日ごとにしまう */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.nvEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.nvEval);
await page.waitForFunction(()=>nvEval('!!window.CHIPS&&!!CHIPS["kg_basic:idle"]'),null,{timeout:30000});
const out=await page.evaluate(()=>nvEval(`(()=>{const out={};S=newState(0);setWorld(0);recount();
 const setH=(d,h)=>{S.t=((d-1)*24+h)*60;};const realClk=clk;
 const pickAt=(opt,rv)=>{const mr=Math.random;Math.random=()=>rv;S.nightVar=null;Object.assign(S,opt);nightVarPick();Math.random=mr;return S.nightVar.k};
 const base={nights:6,wave:['basic','basic'],today:null,rushOn:false,finalOn:false,trialOn:false};
 S.t=(5*24+20.5)*60;const d=dayNo();
 out.kiri=pickAt(base,.1);out.mure=pickAt(base,.17);out.mureNo=pickAt(base,.2);out.mureCool=pickAt(base,.17);S.mureDay=d-8;out.mureAgain=pickAt(base,.17);/* 8日たてば、また出る *//* つづけて出さない：さっきの群れの夜から7日以内 */out.none=pickAt(base,.5);
 out.boss=pickAt({...base,wave:['boss','basic']},.1);out.early=pickAt({...base,nights:2},.1);out.oda=pickAt({...base,today:'odayaka'},.1);
 pickAt(base,.1);const mr=Math.random;Math.random=()=>.2;nightVarPick();Math.random=mr;out.keep=S.nightVar.k;/* 同じ日は引きなおさない */
 out.day=d;
 /* 霧の夜：見張り台の射程 */
 const st={dmg:1,range:6,cd:5};S.nightVar={d:dayNo(),k:'kiri'};const nowK=nightVarNow;
 out.nowK=nightVarNow();S.nightVar.k='mure';out.nowM=nightVarNow();
 /* 群れ：出る場所 */S.nights=7;const xs=[];let reach=0;const fog0=S.fog;S.fog=Array.from({length:AREAN*AREAN},(_,a)=>FOG_MID.includes(a)?0:1);S.nightVar.x=null;SPRC.n=-1;for(let i=0;i<30;i++){const m=mureSpot();xs.push(m[0]);const j=(m[1]|0)*W+(m[0]|0);if(walk(j)&&spawnReach()[j]>=0)reach++}out.spread=Math.max(...xs)-Math.min(...xs);out.mureReach=reach;S.fog=fog0;S.nightVar.x=null;SPRC.n=-1;/* 霧のある草原でも、村まで歩いて行ける所から出る */
 const ys=[];for(let i=0;i<30;i++)ys.push(spawnSpot()[0]);out.normal=Math.max(...ys)-Math.min(...ys);
 return out})()`));
console.log(JSON.stringify(out));
assert.equal(out.mureReach,30,'群れのコワイノは、村まで歩いて行ける所から出る');assert.equal(out.kiri,'kiri');assert.equal(out.mure,'mure');assert.equal(out.mureNo,null,'群れの夜は5%');assert.equal(out.mureCool,null,'群れの夜のあと7日は群れにしない');assert.equal(out.mureAgain,'mure');assert.equal(out.none,null);assert.equal(out.boss,null);assert.equal(out.early,null);assert.equal(out.oda,null);assert.equal(out.keep,'kiri');
assert.ok(out.spread<=6,'群れは7マスの中');assert.ok(out.normal>20);
/* 射程：見張り台の上に木のせいれい、コワイノを4.5マス先において、ふつうはうつ・霧ではうたない */
const shoot=await page.evaluate(()=>nvEval(`(()=>{const r={};for(const k of[null,'kiri']){S=newState(0);setWorld(0);S.obj.fill('');S.hi.fill(0);const j=50*W+50;S.obj[j]='watch';S.hp['L'+j]=1;recount();S.inv.arrow=10;
  const g=S.res[0]||{};S.res=[Object.assign(g,{hidden:false,x:50.5,y:50.5,act:{type:'watchpost',stage:'do',cl:1,obj:j}})];
  const R=WATCH[1].range;const e={id:1,type:'basic',x:50.5+(z0=>z0)(0)+R*0.75,y:51,hp:99,max:99,spawned:true,path:[],atk:0,stun:0,flash:0};S.enemies=[e];
  S.t=(5*24+21)*60;S.nightVar={d:dayNo(),k};S.hp['w'+j]=0;try{updTowers(.1)}catch(err){r.err=String(err)}r[k||'normal']=99-e.hp;r.R=R}return r})()`));
console.log(JSON.stringify(shoot));assert.ok(shoot.normal>0,'ふつうはうつ');assert.equal(shoot.kiri,0,'霧ではとどかない');assert.equal(out.nowK,'kiri');assert.equal(out.nowM,'mure');
assert.equal(errors.length,0,errors.join('\n'));
console.log('Night variants OK. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
