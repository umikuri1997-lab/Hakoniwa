const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 守りのしくみ2（defense.js）：コワイノの弱点・ベテランの見張り台・かげの巣・オオカゲの段階・葉のかべ・わざの枠 */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.dfEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.dfEval);
await page.waitForFunction(()=>dfEval('!!window.CHIPS&&!!CHIPS["kg_basic:idle"]'),null,{timeout:30000});
const out=await page.evaluate(()=>dfEval(`(()=>{const o={};DMGVAR=0;S=newState(0);setWorld(0);S.t=(5*24+12)*60;recount();
 /* 弱点 */const f={type:'fast',hp:100,max:100};hurtEn(f,20,{el:'earth'});o.weak=100-f.hp;f.hp=100;hurtEn(f,20,{el:'fire'});o.notWeak=100-f.hp;o.wstun=weakStun({type:'breaker'},'water');
 /* ベテラン */const j=50*W+50;S.obj.fill('');S.obj[j]='watch';S.hp['L'+j]=1;recount();for(let i=0;i<49;i++)vetKill(j);o.v49=vetBonus(j);vetKill(j);o.v50=vetBonus(j);o.dmg=towerMod(j,WATCH[1]).dmg;
 /* かげの巣 */S.bossKills=1;const mr=Math.random;Math.random=()=>.01;nestMorning();Math.random=mr;o.nest=nestCount();const L=['basic','basic'];const sf=seasonFoes;seasonFoes=()=>{};defWave(L,1);seasonFoes=sf;/* 季節のコワイノは defense3 で */o.wave=L.length;
 const nj=S.obj.indexOf('kagenest');o.nestVill=!!VILL[nj];o.tap=nestTap(nj)&&!!S.dyn[nj].nq;S.drops=[];nestBreak(nj);o.after=nestCount();o.sand=S.drops.some(d=>d.id==='sand');
 /* オオカゲの段階 */S.enemies=[];S.ns={n:1,kill:0,lost:[]};const b={id:9,type:'boss',x:CX+.5,y:CY+3.5,hp:600,max:600,spawned:true,path:[]};S.enemies.push(b);hurtEn(b,310,{});o.call=S.enemies.length-1;o.rage=rageMul(b);hurtEn(b,10,{});o.once=S.enemies.length-1;
 /* 葉のかべ */S.flags.leafSkill=0;S.pt=1000;leafLearn();o.learned=leafOK();o.pt=S.pt;S.t=(5*24+23.5)*60;S.obj.fill('');recount();let c0=-1;for(let y=CY-10;y<CY+10&&c0<0;y++)for(let x=CX-15;x<CX+15&&c0<0;x++){let ok=true;for(let i=0;i<8;i++)if(!leafCellOK(y*W+x+i))ok=false;if(ok)c0=y*W+x}o.c0=c0;LEAFDRAG=[];for(let i=0;i<8;i++)leafAdd(c0+i);o.drag=LEAFDRAG.length;const c=LEAFDRAG;LEAFDRAG=null;leafPlace(c);o.walls=S.obj.filter(x=>x==='leafwall').length;o.spiritWalk=walk(c0);o.cd=leafLeft();
 S.t+=46;leafTick();o.gone=S.obj.filter(x=>x==='leafwall').length;
 /* わざの枠 */S.flags.areaSkill=true;S.skillSet=null;o.set0=skillSetOf().join();skillToggle('light');o.set1=skillSetOf().join();o.lightOn=skillOn('light');
 o.gupLeaf=gupOf('leaf').t[0];o.zArmor=!!ZUKAN.armor&&!!ZUKAN.shiny;
 return o})()`));
console.log(JSON.stringify(out));
assert.equal(out.weak,30,'弱点で1.5倍');assert.equal(out.notWeak,20);assert.equal(out.wstun,1.5);
assert.equal(out.v49,0);assert.equal(out.v50,2);assert.equal(out.dmg,WATCH1()+2);
assert.equal(out.nest,1);assert.equal(out.wave,4,'巣1つで+2');assert.equal(out.nestVill,false,'村の外');assert.ok(out.tap);assert.equal(out.after,0);assert.ok(out.sand);
assert.equal(out.call,2,'半分でコカゲ2ひき');assert.equal(out.rage,1.3);assert.equal(out.once,2,'1回だけ');
assert.ok(out.learned);assert.equal(out.pt,700);assert.equal(out.drag,5,'はじめは5マス');assert.equal(out.walls,5);assert.ok(out.spiritWalk,'せいれいは通れる');assert.equal(out.cd,270);assert.equal(out.gone,0,'30分で消える');
assert.equal(out.set0,'light,area,leaf');assert.equal(out.set1,'area,leaf');assert.equal(out.lightOn,false);
assert.equal(out.gupLeaf,'長さ5マス・のこる30分・つかえない3時間');assert.ok(out.zArmor);
function WATCH1(){return 10}
assert.equal(errors.length,0,errors.join('\n'));
console.log('Defense2 OK. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
