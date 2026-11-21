/* 風のお話の目標6・7：観覧車を動かすと、てっぺんから雲のすきまにつばさが見える → 雲の海のはしでカザネが待つ所に、まもりの光を落とすと雲がひらき、風のヌシ様が話す */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:4});
  const r=JSON.parse(await run(`(async()=>{const o={},W8=ms=>new Promise(f=>setTimeout(f,ms)),L=[];document.querySelector('#dialog').hidden=true;
    const dlg0=dialog;dialog=(lines,after)=>{L.push(lines);if(after)after()};
    const I=windIsles(S);for(let k=1;k<=I.n;k++)S.wind.up[k]=1;recount();windSync();
    S.quest=questIndexOf('wheelTop');S.qTalked=true;S.qStory=null;S.flags.hayate=2;
    let hy=S.res.find(q=>q.name===HAYATE);if(!hy){hy=mkRes(S,HAYATE,'wind',S.res[0].x+1,S.res[0].y);S.res.push(hy)}
    S.t=Math.floor(S.t/1440)*1440+10*60;S.hold=0;
    (S.flags.rideRun=S.flags.rideRun||{}).wheel=1;checkQuest();for(let i=0;i<20&&S.qStory!=null;i++){if(TALKW)startTalk();checkQuest();await W8(20)}
    o.after6=QUESTS[S.quest].id;o.peekLine=L.some(ls=>ls.some(l=>l[2]==='wind:peek'));windBeat('peek');o.peek=WSCN.some(s=>s.k==='peek');render(performance.now());
    o.kj=windKumoSpot();o.kjSky=o.kj!=null&&skyJ(o.kj+W);
    if(!S.qTalked){if(TALKW)startTalk();S.qTalked=true}o.prog0=QUESTS[S.quest].prog();
    const k=S.res.find(q=>q.name===KAZANE);k.nap=false;S.enemies=[];endAct(k);
    for(let i=0;i<1200&&!windKumoWait(KAZANE);i++)stepWorld(.5);o.wait=windKumoWait(KAZANE);o.prog1=QUESTS[S.quest].prog();
    const h0=k.hunger;for(let i=0;i<20;i++)stepWorld(.5);o.noHun=k.hunger>=h0;
    glHit(o.kj%W,(o.kj/W)|0,1);o.part=!!WPART;render(performance.now());
    await W8(WPARTMS+400);o.nushi=L.some(ls=>ls.some(l=>l[0]===NUSHI4));o.kumo=!!S.flags.kumo;
    for(let i=0;i<20&&S.qStory!=null||i<2;i++){if(TALKW)startTalk();checkQuest();await W8(20)}o.after7=QUESTS[S.quest].id;
    render(performance.now());dialog=dlg0;save();continueGame(load(4));o.reload=!!S.flags.kumo&&QUESTS[S.quest].id==='windVillage';return JSON.stringify(o)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.after6,'kumoshita','観覧車が動いたら、つぎは雲の下');assert.equal(r.peekLine,true);assert.equal(r.peek,true,'つばさが見える');
  assert.ok(r.kj!=null&&r.kjSky,'雲の海のはしの印');assert.equal(r.wait,true,'カザネが雲の海のはしで待つ');assert.match(r.prog1,/待っている/);assert.equal(r.noHun,true,'待っているあいだ、おなかがへらない');
  assert.equal(r.part,true,'まもりの光で雲がひらく');assert.equal(r.nushi,true,'風のヌシ様が話す');assert.equal(r.kumo,true);assert.equal(r.after7,'windVillage');assert.equal(r.reload,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
