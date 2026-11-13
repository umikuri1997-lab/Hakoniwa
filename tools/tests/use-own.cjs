/* いす・ベンチ・遊び家具・おふろ・料理の家具に、つかうせいれいをきめられる。きめたせいれいだけが使う */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:800,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.t=1440*2+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}
S.res=[mkRes(S,'a','wood',CX+.5,CY+.5),mkRes(S,'b','water',CX+1.5,CY+.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=10}return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{const [a,b]=S.res,sw=(CY-3)*W+CX;S.obj[sw]='swing';S.obj[sw+1]='part';S.ref[sw+1]=sw;const bn=(CY+3)*W+CX;S.obj[bn]='bench';S.obj[bn+1]='part';S.ref[bn+1]=bn;recount();
  const plays=r=>{let n=0;for(let i=0;i<60;i++){endAct(r);r.lastToy=null;goPlay(r,bfs(r.x|0,r.y|0),true);if(r.act&&r.act.type==='play'&&r.act.obj===sw)n++;endAct(r)}return n};
  const before=[plays(a),plays(b)];S.useOwn={[sw]:b.id,[bn]:b.id};const after=[plays(a),plays(b)];
  const bench=[benchSpot(bfs(a.x|0,a.y|0),a),benchSpot(bfs(b.x|0,b.y|0),b)];
  /* 家具の画面：つかうせいれいの欄。だれでもにもどせる */openSheet('furn',sw);const txt=document.getElementById('sheet')?document.getElementById('sheet').textContent:document.body.textContent;const hasSec=txt.includes('つかうせいれい');
  const btn=[...document.querySelectorAll('button.row')].find(x=>x.textContent.includes('だれでも'));btn&&btn.click();const freed=useOwner(sw)===null;closeSheet();
  /* こわしたら、きめたせいれいも消える */S.useOwn[bn]=b.id;clearObj(bn);const cleared=!(bn in S.useOwn);
  /* いなくなった子にきめてあったら、だれでも */S.useOwn[sw]=999;const gone=useFor(sw,a);
  return {before,after,bench,hasSec,freed,cleared,gone}})()`);
assert.ok(o.before[0]>0&&o.before[1]>0,'はじめは、どちらも遊ぶ '+o.before);assert.equal(o.after[0],0,'きめていない子は遊ばない');assert.ok(o.after[1]>0,'きめた子は遊ぶ');
assert.equal(o.bench[0],-1,'きめていない子はベンチにすわらない');assert.ok(o.bench[1]>=0,'きめた子はすわる');
assert.ok(o.hasSec,'家具の画面に「つかうせいれい」');assert.ok(o.freed,'だれでもにもどせる');assert.ok(o.cleared,'こわしたら消える');assert.ok(o.gone,'いない子のは、だれでも');
assert.deepEqual(errors,[]);console.log('use-own ok',JSON.stringify(o));await browser.close()})();
