const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 建てる場所・依頼のものづくりは、遠くても（行ける所なら）、木・石・草などのふだんの仕事より先にする */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.bpEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.bpEval);
const out=await page.evaluate(()=>bpEval(`(()=>{const out={};
 function setup(){S=newState(0);setWorld(0);S.ground.fill(0);S.hi.fill(0);S.obj.fill('');S.floor.fill('');S.dyn={};S.orders=[];S.pt=99999;S.food=99;S.t=12*60;
  S.obj[5*W+5]='crate';S.obj[5*W+7]='crate';for(let k=0;k<6;k++)S.obj[(10+k)*W+8]='ntree';/* そばに木（ふだんの仕事）がある */
  const r=S.res.find(q=>!q.hidden)||S.res[0];r.x=6.5;r.y=12.5;r.act=null;r.path=[];r.hunger=hMax(r);r.fun=100;r.energy=100;S.res=[r];recount();return r}
 /* 遠い建てる場所 */
 let r=setup();const sj=100*W+100;S.obj[sj]='site';S.dyn[sj]={build:'fence',p:0,need:5};recount();const G=bfs(r.x|0,r.y|0);out.siteDist=G.dist[100*W+99];
 goWork(r,G,true);out.build=r.act&&r.act.type;out.buildObj=r.act&&r.act.obj===sj;
 /* 遠い依頼ボード */
 r=setup();S.obj[98*W+98]='board';recount();out.board=BOARD===98*W+98;S.orders.push({id:S.nid++,type:'fence',prog:0,need:5,worker:null});BL.fence.maker=null;
 const G2=bfs(r.x|0,r.y|0);goWork(r,G2,true);out.craft=r.act&&r.act.type;out.stand=r.act?r.act.stand:-1;out.standDist=out.stand>=0?G2.dist[out.stand]:-1;out.worker=S.orders[0].worker===r.id;
 /* 行けない建てる場所は、だれも受けない */
 r=setup();const bj=100*W+100;S.obj[bj]='site';S.dyn[bj]={build:'fence',p:0,need:5};for(let y=97;y<=103;y++)for(let x=97;x<=103;x++)if(Math.max(Math.abs(x-100),Math.abs(y-100))===3)S.obj[y*W+x]='wall';recount();goWork(r,bfs(r.x|0,r.y|0),true);out.blocked=r.act&&r.act.type;const ts=[];const ot=toast;toast=(m)=>ts.push(m);JOBBLK={S:null,set:new Set(),t:0};S.t=600;jobReachTick();S.t=603;jobReachTick();S.t=606;jobReachTick();out.warn=ts.slice();out.blk=jobBlocked(bj);S.obj[97*W+100]='';recount();S.t=612;jobReachTick();out.open=jobBlocked(bj);out.warn2=ts.length;toast=ot;
 return out})()`));
console.log(out);assert.ok(out.siteDist>60);assert.equal(out.build,'build');assert.equal(out.buildObj,true);assert.equal(out.board,true);assert.equal(out.craft,'craft');assert.ok(out.standDist>80);assert.equal(out.worker,true);assert.notEqual(out.blocked,'build');assert.deepEqual(out.warn,['建てる所へ行けません']);assert.equal(out.blk,true);assert.equal(out.open,false);assert.equal(out.warn2,1);assert.deepEqual(errors,[]);
console.log('Build priority: far site and far craft order are taken before chopping; unreachable site is skipped. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
