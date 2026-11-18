/* できごとの間（pace.js）：きのうのきびしさの点（こわされた物・おなかの少ない子・あらし・夜の変化・オオカゲ）・5点いじょうで、きょうとあしたは夜の変化とあらしなし・0点が3日で、その日は霧の夜25%・あらし10% */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*10+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;S.res=['earth','wood','fire'].map((e,i)=>mkRes(S,'s'+i,e,CX+.5+i,CY+.5));for(const r of S.res)r.hunger=hMax(r);S.nights=10;return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const sc=await run(`(()=>{const out={};const d=dayNo();S.res[0].hunger=300;S.res[1].hunger=200;paceTick();S.res[0].hunger=100;paceTick();/* 2人 */S.t+=1440;const d1=dayNo();S.ns={broke:2,boss:0};S.storm=d1-1;out.a=paceScore();S.ns={broke:0,boss:1};S.storm=null;S.nightVar={d:d1-1,k:'kiri'};out.b=paceScore();S.ns.pc=1;out.c=paceScore();return out})()`);
assert.deepEqual(sc,{a:6,b:7,c:4},'点：こわされた2+おなか2+あらし2・オオカゲ3+夜の変化2+おなか2・数えたゆうべは数えない '+JSON.stringify(sc));
/* きびしい朝のあと：きょう・あしたは夜の変化なし、あさってはもどる */
const calm=await run(`(()=>{const d=dayNo();S.ns={broke:5,boss:0};S.paceD=null;paceMorning();const o=Math.random;Math.random=()=>0;const r=[];S.wave=['basic','basic'];for(let i=0;i<3;i++){S.nightVar=null;nightVarPick();r.push(S.nightVar.k);S.stormNext=null;S.storm=null;S.wxQ={};const k=Math.max(dayNo()+2,6);S.wxQ[k-1]={r:0,b:0,s:0,t:null};r.push(!!wxRoll(k).s);S.t+=1440}Math.random=o;return {calm:S.paceCalm-d,r}})()`);
assert.equal(calm.calm,1,'きょうとあした');assert.deepEqual(calm.r,[null,false,null,false,'kiri',true],'きょうの夜・あすの夜はなし、おだやかな日には新しいあらしをきめない（天気のよほう wxRoll で2日先をきめる）、あさってはもどる '+JSON.stringify(calm));
/* おだやかが3日：その日は霧25% */
const sp=await run(`(()=>{S.paceCalm=null;S.paceQ=0;S.pcH=null;S.storm=null;S.nightVar=null;const out=[];for(let i=0;i<3;i++){S.t+=1440;S.ns={broke:0,boss:0,pc:0};S.paceD=null;paceMorning();out.push(paceSpiceNow())}const o=Math.random;Math.random=()=>.2;S.nightVar=null;S.wave=['basic'];nightVarPick();const k=S.nightVar.k;S.storm=null;S.stormNext=null;S.wxQ={};const sk=Math.max(dayNo()+2,6);S.wxQ[sk-1]={r:0,b:0,s:0,t:null};Math.random=()=>.08;const st=!!wxRoll(sk).s;S.t+=1440;S.nightVar=null;Math.random=()=>.2;nightVarPick();const k2=S.nightVar.k;Math.random=o;return {out,k,st,k2}})()`);
assert.deepEqual(sp,{out:[false,false,true],k:'kiri',st:true,k2:null},'0点が3日めで、その日だけ霧25%・あらし10% '+JSON.stringify(sp));
assert.deepEqual(errors,[]);console.log('pace ok',JSON.stringify({sc,calm,sp}));await browser.close()})();
