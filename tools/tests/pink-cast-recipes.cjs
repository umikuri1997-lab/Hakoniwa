const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* ピンクの会話は、かかわる子がみんないるときだけ／とげの罠の目標でワナのレシピをおぼえる／ききょうが咲いたら昼のうちにノドカを呼べる */
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  /* 1. ピンクの会話 */
  const pink=JSON.parse(await run(`(()=>{const ev=k=>SEV1.find(e=>e.k===k);const N=S.res.find(r=>r.name===MINA);const hasN=!!N;
    S.qStory=null;const sav=S.res.slice();const free=[];for(let j=(CY+6)*W+CX-10;free.length<7;j++)if(!S.obj[j]&&!S.floor[j]&&S.ground[j]!==1)free.push(j);free.slice(0,6).forEach(j=>S.obj[j]='clover');S.obj[free[6]]='swing';S.bud={};recount();
    const pre={fl:flowerN()>=5,sw:cnt('swing')>=1};
    S.res=S.res.filter(r=>r.name!==MINA);const noN={e21:!!ev('e21').at(),e22:!!ev('e22').at()};
    const sp=S.res.find(r=>r.name===POKO);const fake=Object.assign({},sp,{name:MINA,id:99999});S.res.push(fake);
    const withN={e21:!!ev('e21').at()&&!!sevLines(ev('e21').L),e21len:(sevLines(ev('e21').L)||[]).length};S.res=sav;
    S.finalNight=1;const noH={e16:!!ev('e16').at(),e15:sevLines(ev('e15').L).some(l=>/ここにいるよ/.test(l[1]))};
    S.res.push(Object.assign({},sp,{name:keyName('fire'),elem:'fire',id:99998}));const withH={e16:!!ev('e16').at(),e15:sevLines(ev('e15').L).some(l=>/ここにいるよ/.test(l[1]))};S.finalNight=0;
    S.sev={e05:1};const e06=sevLines(ev('e06').L,'').some(l=>/ノドカが言ってた/.test(l[1]));S.res=sav;
    free.forEach(j=>S.obj[j]='');recount();return JSON.stringify({pre,noN,withN,noH,withH,e06})})()`));
  assert.deepEqual(pink.pre,{fl:true,sw:true});
  assert.deepEqual(pink.noN,{e21:false,e22:false},'flower/swing talks need ノドカ');
  assert.equal(pink.withN.e21,true);assert.equal(pink.withN.e21len,5,'all ノドカ lines are spoken');
  assert.deepEqual(pink.noH,{e16:false,e15:false},'e16 needs the fire spirit; reply only when present');assert.deepEqual(pink.withH,{e16:true,e15:true});assert.equal(pink.e06,false,'ノドカ is mentioned only when present');
  /* 2. とげの罠の目標（watch1）で、すべる水たまり・どくの罠をおぼえる。古いセーブも読みこみで */
  const rec=JSON.parse(await run(`(()=>{const ids=[...questRecipeIds(QUESTS[questIndexOf('watch1')]),...questRecipeIds(QUESTS[questIndexOf('watch1')],'clear')];/* 水たまり・どくの罠は、お礼の会話でおぼえる */const notes=[];const rn=recipeNotice;recipeNotice=L=>{notes.push(...L)};
    S.guardianIdeas={};delete S.recipes.puddle;delete S.recipes.sticky;inspireQuest(QUESTS[questIndexOf('watch1')]);inspireQuest(QUESTS[questIndexOf('watch1')],'clear');recipeNotice=rn;
    const s=JSON.parse(JSON.stringify(S));delete s.recipes.puddle;delete s.recipes.sticky;s.quest=questIndexOf('kikyo');s.qStory=null;syncQuestRecipes(s);
    return JSON.stringify({ids,notes,now:!!S.recipes.puddle&&!!S.recipes.sticky,old:!!s.recipes.puddle&&!!s.recipes.sticky})})()`));
  assert.ok(rec.ids.includes('puddle')&&rec.ids.includes('sticky'));assert.ok(rec.notes.includes('puddle')&&rec.notes.includes('sticky'),'recipe notice');assert.equal(rec.now,true);assert.equal(rec.old,true,'old save learns on load');
  /* 3. ききょうが咲いたら、朝を待たずに昼のうちに呼べる。1日1回はそのまま */
  const sm=JSON.parse(await run(`(()=>{S.flags.minaCame=false;S.res=S.res.filter(r=>r.name!==MINA);S.summon=null;S.summonNext=null;S.summonDay=-1;S.mebukiDay=-1;S.feat.summon=true;
    S.quest=questIndexOf('summon');S.qTalked=true;S.qStory=null;const bf=[];for(let j=(CY+7)*W+CX-10;bf.length<2;j++)if(!S.obj[j]&&!S.floor[j]&&S.ground[j]!==1)bf.push(j);bf.forEach(j=>S.obj[j]='bellf');S.bud={};S.t=1440*4+13*60;
    const a=storySummonNow(),day=!!(S.summon&&S.summon.elem==='earth');S.summon=null;S.summonDay=dayNo();const b=storySummonNow();S.summonDay=-1;S.t=1440*4+23*60+30;const c=storySummonNow();
    return JSON.stringify({a,day,b,c})})()`));
  assert.deepEqual(sm,{a:true,day:true,b:false,c:false},'summon available in the day right after bloom; one per day; not at night');
  assert.deepEqual(errors,[]);
  console.log('Pink talk cast, trap recipes at watch1, earth summon right after bellflowers');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
