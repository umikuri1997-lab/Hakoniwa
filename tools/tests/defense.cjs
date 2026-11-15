const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 守りのしくみ（defense.js）：高い所の見張り台・強化の2つの道・合図の太鼓・天気の夜・守り神の目印・朝のおくりもの・ヨロイカゲ・ヒカリカゲ・波のあいまの修理 */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.dfEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.dfEval);
await page.waitForFunction(()=>dfEval('!!window.CHIPS&&!!CHIPS["kg_basic:idle"]'),null,{timeout:30000});
const out=await page.evaluate(()=>dfEval(`(()=>{const o={};S=newState(0);setWorld(0);S.obj.fill('');S.hi.fill(0);S.t=(5*24+12)*60;S.rain=false;S.today=null;recount();
 const j=50*W+50;S.obj[j]='watch';S.hp['L'+j]=5;recount();
 o.r0=towerRng(j);S.hi[j]=2;o.rHi=towerRng(j);S.hi[j]=0;
 o.path0=wpathOf(j);wpathSet(j,'far');o.rFar=towerRng(j);wpathSet(j,'fast');o.keep=wpathOf(j);delete S.dyn[j].wp;wpathSet(j,'fast');o.cdFast=towerMod(j,WATCH[5]).cd;
 S.obj[52*W+53]='drum';recount();o.cdDrum=towerMod(j,WATCH[5]).cd;S.obj[52*W+53]='';S.obj[60*W+62]='drum';recount();o.cdFar=towerMod(j,WATCH[5]).cd;S.obj[60*W+62]='';recount();
 S.rain=true;o.ft=fireTrapDmg();o.ws=waterStunMul();S.rain=false;S.today='kaze';o.rKaze=towerRng(null);o.gust=gustDist();S.today=null;o.ft0=fireTrapDmg();o.gust0=gustDist();
 o.disp=rangeOf('watch',j).r;
 /* ヨロイカゲ */const a={type:'armor',hp:150,max:150};hurtEn(a,20,{dt:'arrow'});o.aArrow=150-a.hp;a.hp=150;hurtEn(a,20,{dt:'fire'});o.aFire=150-a.hp;a.hp=150;hurtEn(a,20,{});o.aNone=150-a.hp;const b={type:'basic',hp:100,max:100};hurtEn(b,20,{dt:'arrow'});o.bArrow=100-b.hp;
 const L=Array(14).fill('basic');S.bossKills=1;defWave(L,6);o.armorN=L.filter(t=>t==='armor').length;const L2=Array(14).fill('basic');defWave(L2,5);o.armor5=L2.filter(t=>t==='armor').length;S.bossKills=0;const L3=Array(14).fill('basic');defWave(L3,9);o.armorEarly=L3.filter(t=>t==='armor').length;
 /* 目印：見張り台は印のコワイノを先に */S.enemies=[];const near={id:1,type:'basic',x:51,y:53,hp:100,max:100,spawned:true,path:[]},far={id:2,type:'basic',x:51,y:56,hp:100,max:100,spawned:true,path:[],mark:1};S.enemies=[near,far];S.inv.arrow=10;const shots=[];towerVolley(j,51,51,{dmg:10,range:8,cd:10},null,shots);o.markHit=far.hp<100&&near.hp===100;
 S.enemies=[near];LIGHTCD=0;S.pt=99;try{guardLight(near)}catch(e){o.glErr=String(e)}o.marked=!!near.mark;
 /* ヒカリカゲ */S.enemies=[];const mr=Math.random;Math.random=()=>.05;o.shinyAdd=shinyAdd();Math.random=mr;const sh=S.enemies[0];o.shinyType=sh&&sh.type;S.ns={n:1,kill:0,lost:[]};S.drops=[];sh.spawned=true;sh.x=CX;sh.y=CY;defeat(sh,'x');o.shinyDrop=(S.drops||[]).map(d=>d.id).filter(id=>id==='sand'||id==='fukuro').length;
 /* 朝のおくりもの */S.ns={n:3,kill:3,lost:[],broke:0};S.nightHurt=0;S.enemyOn=true;mgiftMorning();o.gift=S.mgift&&S.mgift.o.length;S.ns.broke=1;const g0=S.mgift;S.mgift=null;mgiftMorning();o.giftBroke=S.mgift;S.mgift=g0;
 return o})()`));
console.log(JSON.stringify(out));
assert.equal(out.r0,0);assert.equal(out.rHi,1,'2だん上で射程+1');assert.equal(out.path0,null);assert.equal(out.rFar,1,'とおめは射程+1');assert.equal(out.keep,'far','えらんだ道はかえない');
assert.equal(out.cdFast,7,'はやうち');assert.ok(Math.abs(out.cdDrum-5.6)<1e-9,'太鼓：0.8倍');assert.equal(out.cdFar,7,'太鼓は5マスまで');
assert.equal(out.ft,20);assert.equal(out.ws,1.5);assert.equal(out.rKaze,1);assert.equal(out.gust,9);assert.equal(out.ft0,40);assert.equal(out.gust0,6);
assert.equal(out.disp,WATCHR5(),'射程の円にも入る');
assert.equal(out.aArrow,10);assert.equal(out.aFire,40);assert.equal(out.aNone,20);assert.equal(out.bArrow,20);
assert.equal(out.armorN,2);assert.equal(out.armor5,0);assert.equal(out.armorEarly,0);
assert.ok(out.markHit,'目印のコワイノを先に');assert.ok(out.marked,'まもりの光で目印');
assert.equal(out.shinyAdd,1);assert.equal(out.shinyType,'shiny');assert.ok(out.shinyDrop>=1,'ヒカリカゲの落とし物');
assert.equal(out.gift,3);assert.equal(out.giftBroke,null,'こわされた夜はなし');
function WATCHR5(){return 7}
/* ポップアップ：えらぶと受けとる */
const pop=await page.evaluate(()=>dfEval(`(async()=>{for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;S.mgift={d:dayNo(),o:['arrow','boost','spike']};const a0=S.inv.arrow||0;mgiftTick();const btn=[...document.querySelectorAll('.idea-reveal button')];const n=btn.length;btn[0].click();return {n,got:(S.inv.arrow||0)-a0,left:!!document.querySelector('.idea-reveal'),g:S.mgift}})()`));
console.log(JSON.stringify(pop));assert.equal(pop.n,3);assert.equal(pop.got,20);assert.equal(pop.left,false);assert.equal(pop.g,null);
/* 波のあいまの修理：土のせいれいが、夜でも直しにいく */
const fix=await page.evaluate(()=>dfEval(`(()=>{S=newState(0);setWorld(0);recount();S.t=(5*24+1)*60;S.bossKills=1;const q=(CY+3)*W+CX+3;S.obj[q]='fence';S.hp[q]=5;recount();
 S.enemies=[{id:1,type:'basic',wv:1,delay:50,spawned:false,path:[],hp:100,max:100}];const o={lull:waveLull()};
 const r=S.res[0];r.elem='earth';r.energy=100;r.hunger=hMax(r);r.act=null;r.nfixNo=0;const G=bfs(r.x|0,r.y|0);o.go=nightFixGo(r,G);o.act=r.act&&r.act.type;
 S.enemies[0].spawned=true;o.lull2=waveLull();return o})()`));
console.log(JSON.stringify(fix));assert.ok(fix.lull);assert.ok(fix.go,'波のあいまに直しにいく');assert.equal(fix.act,'repair');assert.equal(fix.lull2,false,'コワイノが来たら、あいまではない');
assert.equal(errors.length,0,errors.join('\n'));
console.log('Defense OK. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
