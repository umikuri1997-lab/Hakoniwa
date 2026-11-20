/* ひらめきの日（inspire.js）：前の日にたのしさが70より下にならなかった子だけ・その日だけ・属性ごとの効き目（土 建てる・直すの速さ+10、木 収穫+1、水 つりの家具5%、火 攻撃力+10、風 ひろう物+1）・せいれいの画面に出る */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*2+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-8;y<CY+8;y++)for(let x=CX-8;x<CX+8;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';delete S.ref[j];delete S.dyn[j]}S.res=['earth','wood','water','fire','wind'].map((e,i)=>mkRes(S,'s'+i,e,CX+.5+i,CY+.5));for(const r of S.res){r.fun=90;r.fd=null;r.hunger=hMax(r)}recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
/* 前の日：s0〜s3 は90のまま、s4 だけ60まで下がった */
const el=await run(`(()=>{for(const r of S.res)funAdd(r,-1,'time');funAdd(S.res[4],-29,'time');S.t+=1440;const o=Math.random;Math.random=()=>0;const ids=new Set();for(let i=0;i<40;i++){S.insp=null;const L=S.res.filter(r=>(inspPrevMin(r)??-1)>=INSPFUN);ids.add(L.length)}const L=S.res.filter(r=>(inspPrevMin(r)??-1)>=INSPFUN).map(r=>r.name);inspMorning();Math.random=o;return {L,got:S.insp&&S.res.find(r=>r.id===S.insp.id).name}})()`);
assert.deepEqual(el.L,['s0','s1','s2','s3'],'たのしさが70より下になった子は出ない '+JSON.stringify(el));assert.ok(el.got,'20%に当たれば1人');
const none=await run(`(()=>{S.insp=null;const o=Math.random;Math.random=()=>.5;inspMorning();Math.random=o;return S.insp})()`);assert.equal(none,null,'20%に当たらなければなし');
const fx=await run(`(()=>{const d=callDay(),on=i=>{S.insp={id:S.res[i].id,d}},R=S.res,out={};
on(0);out.wk=[inspWork(R[0],{type:'build'}),inspWork(R[0],{type:'repair'}),inspWork(R[0],{type:'chop'}),inspWork(R[1],{type:'build'})];
on(3);const a0=rMul(R[3],'atk');S.insp=null;const a1=rMul(R[3],'atk');out.atk=Math.round((a0-a1)*100);
on(4);S.drops=[];const d0={id:'mat:eda',n:1,x:0,y:0};let got=0;const am=addMat;addMat=(r,k,n)=>{got+=n;(r.cmat=r.cmat||{})[k]=(r.cmat[k]||0)+n;return n};const ac=addCarry;addCarry=(r,k,n)=>{got+=n;return n};try{takeDrop(d0,R[4])}finally{addMat=am;addCarry=ac;R[4].cmat=null}got+=S.drops.reduce((t,q)=>t+q.n,0);S.drops=[];out.drop=[got,d0.n];
on(0);out.other=inspOn(R[1]);S.t+=1440;out.next=inspOn(R[0]);return out})()`);
assert.deepEqual(fx.wk,[.5,.5,0,0],'土：建てる・直すだけ+10（20がふつう） '+JSON.stringify(fx));assert.equal(fx.atk,10,'火：攻撃力+10');
assert.deepEqual(fx.drop,[2,1],'風：ひろう物+1（落とし物そのものはかえない） '+JSON.stringify(fx.drop));assert.ok(fx.other===false&&fx.next===false,'その子・その日だけ');
/* 木：収穫+1 */
const hv=await run(`(()=>{const R=S.res,j=(CY+3)*W+CX;S.obj[j]='farm';S.dyn[j]={g:100,sown:true,crop:'imo'};const r=R[1];r.x=CX+.5;r.y=CY+2.5;const one=()=>{S.obj[j]='farm';S.dyn[j]={g:100,sown:true,crop:'imo'};r.carry={};S.drops=[];ACT.harvest.end(r,{type:'harvest',obj:j,t:12});let n=0;for(const k in r.carry)n+=r.carry[k];for(const q of S.drops)if(q.id.startsWith('food:'))n+=q.n;S.drops=[];return n};S.insp=null;const A=one();S.insp={id:r.id,d:callDay()};const B=one();return [A,B]})()`);
assert.equal(hv[1]-hv[0],1,'木：収穫+1 '+JSON.stringify(hv));
/* 水：つりの家具 */
const fs=await run(`(()=>{const r=S.res[2],o=Math.random;let f=0;const tt=toast;toast=(m)=>{if(/つりあげた/.test(m))f++};S.insp={id:r.id,d:callDay()};Math.random=()=>.03;try{fishLoot(r)}finally{Math.random=o;toast=tt}const a=f;f=0;S.insp=null;Math.random=()=>.03;toast=(m)=>{if(/つりあげた/.test(m))f++};try{fishLoot(r)}finally{Math.random=o;toast=tt}return [a,f]})()`);
assert.deepEqual(fs,[1,0],'水：0.03で家具（ふだんは出ない） '+JSON.stringify(fs));
const ui=await run(`(()=>{S.insp={id:S.res[0].id,d:callDay()};resTab=0;openSheet('res',S.res[0].id);const t=(document.querySelector('#sheetWrap .inspNote')||{}).textContent;closeSheet();return t})()`);
assert.equal(ui,'きょうは、はりきっている：建てる・直すの、はたらく速さ+10');
assert.deepEqual(errors,[]);console.log('inspire ok',JSON.stringify({el,fx,hv,fs}));await browser.close()})();
