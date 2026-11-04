// 草原でおぼえたレシピ（火山で素材がかわる物 mat1：たいまつなど）が、火山でもおぼえたままで、もう一度「あたらしいかたち」に出ないこと
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  const r=JSON.parse(await run(`(()=>{localStorage.clear();GREC=null;setWorld(0);S=newState(0);LIVE[0]=S;S.introSeen=true;
    const q=SUBQ.find(x=>x.k==='light3');inspireQuest(q);for(const id of ['stool','rug1','monstera','curtain1'])S.recipes[id]=S.guardianIdeas[id]=true;save();
    newGame(1);const ids=['torch','stool','rug1','monstera','curtain1'],out={ids:ids.map(id=>[id,grecOf().get(id),!!S.recipes[id],!!S.guardianIdeas[id]]),idea:ideaDialogue(q,[]).length};
    const g=JSON.parse(localStorage.getItem(GRECKEY2));delete g.torch;g.stool=1;localStorage.setItem(GRECKEY2,JSON.stringify(g));localStorage.removeItem(GRECFIX);GREC=null;
    out.repair=[grecOf().get('torch'),grecOf().get('stool')];out.again=(GREC=null,grecOf().get('torch'));localStorage.clear();return JSON.stringify(out)})()`));
  for(const [id,o,rec,gi] of r.ids){assert.equal(o,0,id+' should stay learned in the grassland');assert(rec&&gi,id+' should be known in the volcano')}
  assert.equal(r.idea,0,'torch is shown as a new idea again');assert.deepEqual(r.repair,[0,0],'broken old record is repaired');assert.equal(r.again,0);
  assert.deepEqual(errors,[]);console.log('Recipes with volcano materials carry over without re-learning');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
