/* 限定の家具（gift-furn.js）：プレゼントをあける場面（つつみ → 中身ごとの動き → 返事）・お返し（だいすきでかならず）・10回めの節目・大会の曲のえらび方 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*2+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-10;y<CY+10;y++)for(let x=CX-10;x<CX+10;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}S.res=[mkRes(S,'a','water',CX+.5,CY+.5),mkRes(S,'b','fire',CX+2.5,CY+.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=50;r.nap=false}recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
/* 15こ・どれもレシピにならない・属性ごとに1つずつ・動きの絵がある */
const base=await run(`(()=>{const A=[].concat(GFURN.ret,GFURN.let,GFURN.bond);return JSON.stringify({n:A.length,shop:A.every(id=>BL[id]&&BL[id].shopOnly&&BL[id].kind==='furn'),el:['ret','let','bond'].every(c=>['earth','wood','water','fire','wind'].every(e=>GFURN[c].filter(id=>BL[id].el===e).length===1)),comfy:A.every(id=>COMFY[id]>0),mot:Object.values(GFMOT).every(m=>SPM[m]),ham:!!SPM.play_g_hammock})})()`);
assert.deepEqual(JSON.parse(base),{n:15,shop:true,el:true,comfy:true,mot:true,ham:true},base);
/* だいすきの物をあげる：つつみをあける → 中身の動き → 返事の会話 → お返しのつつみ（水のせいれいの物） */
const love=await run(`(()=>{const r=S.res[0];S.flags.gfGot={};const id=GIFTIDS.find(q=>giftLike(r,q)===2);giveItem(id,1);presentGive(r,id);const ps=sacredPose(r);return JSON.stringify({id,open:ps&&ps.anim,wrap:ps&&ps.gfood})})()`);
const L=JSON.parse(love);assert.equal(L.open,'gf_open','つつみを両手でかかえる');assert.ok(/^ic:gfwrap_/.test(L.wrap),L.wrap);
await p.waitForTimeout(GFOPEN());
function GFOPEN(){return 1600}
const mid=JSON.parse(await run(`JSON.stringify({anim:(sacredPose(S.res[0])||{}).anim,food:(sacredPose(S.res[0])||{}).gfood})`));
assert.equal(mid.anim,await run(`GFMOT['${L.id}']`),'中身ごとの動き');assert.equal(mid.food,'ic:'+L.id);
await p.waitForTimeout(5200);
assert.equal(await run(`!document.querySelector('#dialog').hidden`),true,'返事の会話');
for(let i=0;i<8&&await run(`!document.querySelector('#dialog').hidden`);i++){await run(`{DLGA.typing=0;DLGA.readReady=0;DLGA.holdUntil=0;const c=document.querySelector('#dialog button');if(c){c.disabled=false;c.click()}}`);await p.waitForTimeout(250)}
await p.waitForTimeout(400);
for(let i=0;i<6&&await run(`!document.querySelector('#dialog').hidden`);i++){await run(`{DLGA.typing=0;DLGA.readReady=0;DLGA.holdUntil=0;const c=document.querySelector('#dialog button');if(c){c.disabled=false;c.click()}}`);await p.waitForTimeout(250)}
await p.waitForTimeout(400);
const ret=JSON.parse(await run(`JSON.stringify({got:!!S.flags.gfGot.g_shizuku,inv:S.inv.g_shizuku||0,card:[...document.querySelectorAll('.pxcard')].some(c=>c.textContent.includes('お返し'))})`));
assert.deepEqual(ret,{got:true,inv:1,card:true},JSON.stringify(ret));
await run(`for(const o of document.querySelectorAll('.pxcard'))o.parentNode.remove()`);
/* 10回めの節目：とくべつなつつみ（水草の水そう） */
const bond=JSON.parse(await run(`(()=>{const r=S.res[0];r.gn=10;gfAfterGift(r,0);for(let i=0;i<4&&!document.querySelector('#dialog').hidden;i++)dlgNext&&dlgNext();return JSON.stringify({got:!!S.flags.gfGot.g_suisou,b:r.gbond})})()`));
assert.deepEqual(bond,{got:true,b:1});
/* ぜんぶもらったら、もう出ない */
assert.equal(await run(`(()=>{for(const c in GFURN)for(const id of GFURN[c])S.flags.gfGot[id]=1;return gfPick('ret','water')})()`),null);
/* 大会の曲：動く大会・のんびりした大会・表彰台 */
const mu=JSON.parse(await run(`(()=>{const o=S.ev,b=SND.bgm,cs={...CUPSONG};SND.bgm=1;CUPSONG.cupaward='x';CUPSONG.cupcalm='x';S.ev={id:'cup0',ph:'do'};const a=cupMusicWant();S.ev={id:'cup6',ph:'do'};const c=cupMusicWant();S.ev={id:'cup6',ph:'go'};const g=cupMusicWant();CUPV.aw={};const w=cupMusicWant();CUPV.aw=null;S.ev=o;SND.bgm=b;delete CUPSONG.cupaward;delete CUPSONG.cupcalm;Object.assign(CUPSONG,cs);return JSON.stringify([a,c,g,w])})()`));
assert.deepEqual(mu,['cupmove','cupcalm','','cupaward']);
assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
