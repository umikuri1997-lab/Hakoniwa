const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* ひろった物（やすらぎの砂・角笛・家具）は、せいれいが箱へはこんでから、もちものに入る。レシピはすぐおぼえる。御神木のまわりに道が置ける */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:900,height:700}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.ltEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.ltEval);
await page.waitForFunction(()=>ltEval('!!window.CHIPS&&!!CHIPS["kgp_basic:body"]'),null,{timeout:30000});
const out=JSON.parse(await page.evaluate(()=>ltEval(`(()=>{const o={};newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;showItemGift=()=>{};showSpotPop=()=>{};S.enemyOn=false;S.t=12*60;
 const r=S.res[0],x=r.x|0,y=r.y|0;for(let b=-6;b<=6;b++)for(let a=-6;a<=6;a++){const k=(y+b)*W+x+a;if(!sacredReserved(k)&&!sacredNoBuild(k)&&(S.obj[k]==='tree'||S.obj[k]==='rock'||WEEDS.has(S.obj[k])))S.obj[k]=''}
 const free=[];for(let b=-5;b<=5;b++)for(let a=-5;a<=5;a++){const k=(y+b)*W+x+a;if(!S.obj[k]&&walk(k)&&!sacredNoBuild(k)&&(a||b))free.push(k)}
 S.obj[free[0]]='mbox';S.obj[free[free.length-1]]='obox';recount();o.boxes=OBOX>=0&&matCap()>0;r.hunger=hMax(r);r.energy=100;r.fun=90;r.xp=99999;
 const sand0=S.sand||0,horn0=S.horn||0,inv0=inv('stool');
 takeDrop({id:'sand',n:1,x,y},r);takeDrop({id:'horn',n:1,x,y},r);takeDrop({id:'stool',n:1,x,y},r);
 o.notYet=(S.sand||0)===sand0&&(S.horn||0)===horn0&&inv('stool')===inv0;o.held=citemN(r);o.icons=carryIcons(r).length;
 /* レシピは、はこばずにすぐおぼえる */const rk=KWR.find(id=>!(S.recipes||{})[id]);if(rk){takeDrop({id:'recipe',n:1,x,y},r);o.recipeNow=KWR.filter(id=>S.recipes[id]).length>0&&citemN(r)===3}else o.recipeNow=true;
 endAct(r);const G=bfs(x,y);startAct(r,G,'idle',-1,{dur:15});o.firstAct=r.act.type;const dests=[];
 for(let i=0;i<4000&&citemN(r)>0;i++){if(r.act&&r.act.type==='sitem'&&!dests.includes(r.act.dest))dests.push(r.act.dest);updRes(r,.25);if(!r.act||r.act.type==='idle'&&citemN(r)>0){endAct(r);startAct(r,bfs(r.x|0,r.y|0),'idle',-1,{dur:15})}}
 o.dests=dests.sort().join();o.stored=(S.sand||0)===sand0+1&&(S.horn||0)===horn0+1&&inv('stool')===inv0+1&&!citemN(r);
 /* しまう箱がないときは、そのまま */S.obj[free[0]]='';S.obj[free[free.length-1]]='';recount();const s1=S.sand||0;takeDrop({id:'sand',n:2,x,y},r);o.noBox=(S.sand||0)===s1+2;
 /* 御神木：4方向のとなりと、上の行に道が置ける。切り株の根もとと、物（スツール）は、ことわる */const j=S.sacredRoot,sx=j%W,sy=j/W|0,n=sacredSpan(),st=fieldStump(j);let ok=0,tot=0;
 for(let a=-1;a<=n;a++)for(const b of [-1,n]){tot++;if(canPlace('path',sx+a,sy+b,true))ok++}for(let b=0;b<n;b++)for(const a of [-1,n]){tot++;if(canPlace('path',sx+a,sy+b,true))ok++}
 o.around=ok+'/'+tot;o.topRows=[0,1].every(b=>[0,1,2,3].every(a=>canPlace('path',sx+a,sy+b,true)));o.stumpNo=!canPlace('path',st%W,st/W|0,true);o.objNo=!canPlace('stool',sx,sy,true);o.near=FIELD_NEAR_R;
 return JSON.stringify(o)})()`)));
console.log(JSON.stringify(out));
assert.equal(out.boxes,true);assert.equal(out.notYet,true);assert.equal(out.held,3);assert.ok(out.icons>=3);assert.equal(out.recipeNow,true);assert.equal(out.firstAct,'sitem');assert.equal(out.dests,'mat,obox');assert.equal(out.stored,true);assert.equal(out.noBox,true);
const [a,t]=out.around.split('/');assert.equal(a,t,'paths fit on all four sides');assert.equal(out.topRows,true);assert.equal(out.stumpNo,true);assert.equal(out.objNo,true);assert.equal(out.near,6);
assert.deepEqual(errors,[]);console.log('Drops carried to boxes (sand to material box, horn and furniture to offering box), recipe immediate; sacred tree: paths on all sides and upper rows, stump and objects refused');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
