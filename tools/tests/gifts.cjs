/* おくりもの・たからもの（gifts.js）・2人でおでかけ（outing.js） */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*2+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-10;y<CY+10;y++)for(let x=CX-10;x<CX+10;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}S.res=[mkRes(S,'a','wood',CX+.5,CY+.5),mkRes(S,'b','fire',CX+2.5,CY+.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=50;r.nap=false}recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
/* 13しゅるい・アイコン・好み（だいすきは1つ） */
const base=await run(`(()=>{const r=S.res[0];return {n:GIFTIDS.length,kind:GIFTIDS.every(id=>BL[id].kind==='gift'),ico:GIFTIDS.every(id=>typeof giftIco(id)==='string'&&giftIco(id).length>20),love:GIFTIDS.filter(id=>giftLike(r,id)===2).length,craft:CRAFT_TABS.find(t=>t[0]==='おくりもの')[1].length,shop:giftShopToday().length,drop:dropRolls('basic').some(e=>BL[e[0]]&&BL[e[0]].kind==='gift'),fish:fishLoot.toString().indexOf('GIFTFISH')>0}})()`);
assert.deepEqual(base,{n:13,kind:true,ico:true,love:1,craft:4,shop:1,drop:true,fish:true},JSON.stringify(base));
/* あげる：たのしさ+20（だいすき+40）・たからもの・1日1回・3こまで */
const gv=await run(`(()=>{const r=S.res[0],love=GIFTIDS.find(id=>giftLike(r,id)===2),nm=GIFTIDS.find(id=>giftLike(r,id)===0);for(const id of GIFTIDS)giveItem(id,1);r.fun=10;const ok1=presentGive(r,nm),f1=r.fun,again=presentGive(r,love),f2=r.fun;r.care.gift=0;presentGive(r,love);const f3=r.fun;
  for(const id of GIFTIDS.filter(id=>id!==love&&id!==nm).slice(0,3)){r.care.gift=0;presentGive(r,id)}return {ok1,f1,again,f2,f3,trs:r.trs.length,old:r.trs.includes(nm),left:inv(nm),gk:r.gk[love],txt:giftTrText(r).split('・').length,know:giftKnownText(r,2)===BL[love].name}})()`);
assert.ok(gv.ok1);assert.equal(gv.f1,30,'ふつう+20');assert.equal(gv.again,false,'1日1回');assert.equal(gv.f3,70,'だいすき+40');assert.equal(gv.trs,3);assert.equal(gv.old,false,'いちばん古い物といれかわる');assert.equal(gv.left,0);assert.equal(gv.gk,2);assert.ok(gv.know);
/* もちものの「あげる」・お世話の「プレゼント」 */
const ui=await run(`(()=>{const r=S.res[1];giveItem('gf_kai',1);itemPop('gf_kai');const btn=[...document.querySelectorAll('.pxcard .btn')].find(b=>b.textContent==='あげる');btn.click();const rows=document.querySelectorAll('.pxcard .row').length;const row=[...document.querySelectorAll('.pxcard .row')].find(x=>x.querySelector('b').textContent===r.name);row.querySelector('button').click();document.querySelectorAll('.pxcard').forEach(e=>e.closest('div[style*=fixed]').remove());
  resTab=2;openSheet('res',S.res[0].id);const pb=[...document.querySelectorAll('#sheetWrap button.btn')].find(b=>b.textContent==='プレゼント');const lack=pb&&pb.classList.contains('lack');closeSheet();return {rows,trs:r.trs,lack}})()`);
assert.ok(ui.rows>=2&&ui.trs[0]==='gf_kai','もちものからあげる '+JSON.stringify(ui));assert.equal(ui.lack,true,'きょうはもうあげた子は、プレゼントが灰色');
/* お店：パワーで買える・1日1こ */
const sh=await run(`(()=>{S.pt=500;const id=giftShopToday()[0],p=BL[id].shop,n0=inv(id);const a=giftShopBuy(id),b=giftShopBuy(id);return {a,b,pt:S.pt,p,got:inv(id)-n0}})()`);
assert.equal(sh.a,true);assert.equal(sh.b,false,'1日1こ');assert.equal(sh.pt,500-sh.p);assert.equal(sh.got,1);
/* おでかけ：なかよし60の2人が、花のそばへ。すごしたら、なかよし+3・たのしさ+10。タップで会話 */
const out=await run(`(()=>{const[a,b]=S.res;S.bond={};S.bond[bondKey(a,b)]=70;for(const r of S.res){r.act=null;r.path=[];r.fun=40}S.obj[(CY+3)*W+CX+5]='flower';S.t=1440*3+11*60;S.rain=false;const R=Math.random;Math.random=()=>0;let ok;try{ok=goOuting(a,bfs(a.x|0,a.y|0))}finally{Math.random=R}
  const t1=a.act&&a.act.type,t2=b.act&&b.act.type;for(let i=0;i<4000&&(a.act&&a.act.type==='outing');i++){for(const r of S.res){if(r.act&&r.act.type==='outing'){if(r.act.stage==='walk'&&r.path.length){const n=r.path[0];r.x=n%W+.5;r.y=((n/W)|0)+.5;r.path.shift();if(!r.path.length)beginDo(r)}else if(r.act.stage==='walk')beginDo(r);if(r.act.stage==='do'){if(i===50&&r===a)r.talked=outingTalk(r);r.act.t+=1;ACT.outing.tick(r,r.act,1);if(ACT.outing.done(r,r.act)){ACT.outing.end(r,r.act);r.act=null}}}}}
  return {dbg:JSON.stringify(S.bondDid),ok,t1,t2,bond:bondOf(a,b),fa:a.fun,fb:b.fun,talked:a.talked,dlg:!document.querySelector('#dialog').hidden,day:S.outD===callDay(),again:(()=>{const R=Math.random;Math.random=()=>0;try{return goOuting(a,bfs(a.x|0,a.y|0))}finally{Math.random=R}})()}})()`);
assert.ok(out.ok&&out.t1==='outing'&&out.t2==='outing','出かける '+JSON.stringify(out));assert.equal(out.bond,73,'なかよし+3');assert.equal(out.fa,50);assert.equal(out.fb,50);assert.ok(out.talked&&out.dlg,'タップで会話');assert.ok(out.day&&out.again===false,'1日1組');
/* 素材もあげられる：たのしさ+5・たからものにしない */
const mg=await run(`(()=>{const r=S.res[1];r.care.gift=0;r.fun=10;const t0=r.trs.slice();S.mat.stone=(S.mat.stone||0)+3;boxSync();const n0=S.mat.stone;const ok=presentGive(r,'m:stone');boxSync();return {ok,fun:r.fun,left:n0-S.mat.stone,trs:r.trs.join()===t0.join(),any:giftAny()}})()`);
assert.deepEqual(mg,{ok:true,fun:15,left:1,trs:true,any:true},JSON.stringify(mg));
/* 木箱の画面から、その箱のおたきあげ：S.otakiB にたのみ、せいれいがその箱からとる */
const ob=await run(`(()=>{const a=(CY-4)*W+CX;S.obj[a]='crate';recount();const k='kasa';boxIn(a,k,10);boxSync();openSheet('box',a);const slot=[...document.querySelectorAll('#sheetWrap .box-contents .row')].find(c=>c.querySelector('.tx b').textContent===MATN[k]);if(!slot)return {slot:false};slot.click();const go=document.querySelector('.pxcard .go');go.onclick();closeSheet();const q=S.otakiB&&S.otakiB[a]&&S.otakiB[a][k];
  const st0=STATUE;if(STATUE<0){S.obj[(CY+6)*W+CX]='statue';recount()}const r=S.res[0];r.act=null;r.path=[];r.otaki=null;r.x=CX+.5;r.y=CY-2.5;const G=bfs(r.x|0,r.y|0),ok=tryJob(r,G,'otaki');const A=r.act;let got=null;if(A){A.stage='do';ACT.otakiget.start(r,A);ACT.otakiget.end(r,A);got=r.otaki}return {slot:true,q,ok,box:A&&A.bq===a,got,left:boxHas(a,k),gone:!(S.otakiB||{})[a]}})()`);
assert.ok(ob.slot&&ob.q===5&&ob.ok&&ob.box&&ob.got&&ob.got.kasa>0,'箱からおたきあげ '+JSON.stringify(ob));
/* 作業台をタップしても、依頼ボードはひらかない */
assert.equal(await run(`String(onTap).includes("o==='wbench')return openSheet('craft')")`),false);
assert.deepEqual(errors,[]);console.log('gifts ok',JSON.stringify({base,gv,ui,sh,out}));await browser.close()})();
