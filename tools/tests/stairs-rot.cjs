const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 階段・坂の向き：じどうはない。えらんだ向き（手前へ・右へ・左へ・奥へ）で置ける。古いセーブの S.rot=0 も読める */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.stairEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.stairEval);
const out=await page.evaluate(()=>stairEval(`(()=>{const out={labels:ROTL[5].filter(Boolean),n:ROTN([...STAIRS][0])};const id=[...STAIRS][0];out.id=id;
 function setup(){S=newState(0);setWorld(0);S.ground.fill(0);S.hi.fill(0);S.obj.fill('');S.floor.fill('');S.dyn={};S.pt=99999;for(const k in S.mat)S.mat[k]=999;S.mat.wood=999;S.mat.stone=999;S.unlocked[id]=true;S.rot={};recount()}
 /* 高いマスを (50,50) にして、そのまわりの4方向に置く */
 usable=()=>true;const res={};for(const [v,dx,dy] of [[1,0,1],[2,1,0],[3,-1,0],[4,0,-1]]){setup();S.hi[50*W+50]=1;const x=50+dx,y=50+dy,j=y*W+x;PLROTS={};out['first'+v]=stairFirst(j);PLROTS[id]=v;const ok=canPlace(id,x,y,true);let placed=false;if(ok){place(id,x,y);placed=S.obj[j]==='site'&&S.rot[j]===v}PLROTS[id]=(v%4)+1;res[v]={ok,placed,wrong:canPlace(id,x,y,true)}}out.res=res;
 setup();S.hi[50*W+50]=1;PLROTS={};pending={kind:'one',id,x:50,y:51,ok:canPlace(id,50,51,true)};confirmOne();out.txt=document.querySelector('#confirmTxt').textContent;rotPending();out.txt2=document.querySelector('#confirmTxt').textContent;pending=null;
 setup();S.hi[50*W+50]=1;const j=51*W+50;S.obj[j]=id;S.rot[j]=0;out.oldDir=stairDir(j);
 return out})()`));
console.log(out);assert.deepEqual(out.labels,['手前へ','右へ','左へ','奥へ']);assert.equal(out.n,4);for(const v of[1,2,3,4]){assert.equal(out.res[v].ok,true);assert.equal(out.res[v].placed,true);assert.equal(out.res[v].wrong,false);assert.equal(out['first'+v],v)}
assert.ok(!/じどう/.test(out.txt+out.txt2));assert.ok(/手前へ/.test(out.txt));assert.ok(/右へおりる向きには置けません/.test(out.txt2));assert.equal(out.oldDir,0);assert.deepEqual(errors,[]);
console.log('Stairs: four explicit directions place, wrong direction refused, default is first valid, old S.rot=0 still resolves. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
