/* 物を見にいく予定（QUEST_VISITS）のある子も、なかまのお迎え・お見送りの集まりには、まっすぐ向かう。集まりがおわってから見にいく */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
const run=s=>page.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;NOSAVE=true;S.introSeen=true;S.flags.minaCame=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=30;S.feat={summon:true,build:true,plant:true,craft:true,people:true};for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5),mkRes(S,MINA,'earth',CX+1.5,CY+.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);
const j=(CY+12)*W+CX+12;S.obj[j]='composter';recount();(S.subSt||(S.subSt={})).compost=2;QUEST_VISITS.set(S.res[1],[{obj:j,id:'composter',partKey:'0:sub:compost:placed'}]);
window.__done=0;window.__acts=[];gatherAt(CX-6.5,CY+.5,()=>{window.__done=1;window.__after=GATHER_HOLD},S.res[0].id,()=>{window.__done=-1});})()`);
await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
for(let i=0;i<60&&!(await run('__done'));i++){await page.waitForTimeout(500);await run(`if(!__done)__acts.push(S.res[1].act&&S.res[1].act.type)`)}
const acts=await run('__acts'),done=await run('__done');
assert.equal(done,1,'集まれた');
assert.ok(!acts.includes('questjoy'),'集まりのあいだに見にいかない: '+acts.join(','));
await page.waitForFunction(()=>sacredEval(`(S.res[1].act&&S.res[1].act.type)==='questjoy'||!!S.questPartSeen?.['0:sub:compost:placed']`),{},{timeout:20000});
assert.deepEqual(errors,[]);console.log('quest visit waits for gathering, then resumes');await browser.close()})();
