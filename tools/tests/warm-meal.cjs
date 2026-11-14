/* 「芽のそばのごはん」（warmMeal）：燃やさない火のあとのメインクエスト。ならび・会話・切り株のそばの食卓・フタバが食べる・わたす動き・古いセーブの読みかえ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  /* 1. ならび */
  const ids=JSON.parse(await run(`JSON.stringify(QUESTS1.map(q=>q.id))`)),w=ids.indexOf('warmMeal');
  assert.equal(ids[w-1],'fireRoot','after fireRoot');assert.equal(ids[w+1],'water','before water');
  console.log('order: fireRoot → warmMeal → water');
  /* 2. 依頼の会話：かまどは思いつかない（かまどは火山から） */
  const t=JSON.parse(await run(`(()=>{const H=mkRes(S,keyName('fire')||'ホノ','fire',S.res[0].x+1,S.res[0].y);if(!S.res.some(r=>r.elem==='fire'))S.res.push(H);const q=QUESTS1[qsIx('warmMeal')];
    return JSON.stringify({learn:q.talk.learn||[],idea:q.talk.lines.some(l=>l[0]==='@idea'),oven:JSON.stringify([q.talk.lines,q.story]).includes('かまど'),speakers:[...new Set(q.story.map(l=>l[0]))],w:BL.oven.w})})()`));
  assert.deepEqual(t.learn,[]);assert.equal(t.idea,false);assert.equal(t.oven,false);assert.equal(t.w,1,'oven is from the volcano');
  assert(t.speakers.every(n=>n&&n.length>1),'names resolved '+t.speakers);
  console.log('talk: no oven; thanks speakers',t.speakers.join('・'));
  /* 3. 切り株のそばの食卓と、受けてからフタバがそこで食べたことだけ数える */
  const c=JSON.parse(await run(`(()=>{S.quest=qsIx('warmMeal');S.qStory=null;S.qTalked=true;delete S.flags.warmEat;delete S.flags.warmYaki;
    const R=S.sacredRoot,x=R%W,y=R/W|0,far=(y+20)*W+x+20,near=(y+sacredSpan()+2)*W+x+1;S.obj[far]='table';const t0=QUESTS1[qsIx('warmMeal')].steps[0].check();S.obj[far]='';S.obj[near]='table';const t1=QUESTS1[qsIx('warmMeal')].steps[0].check();
    const f=S.res.find(r=>r.name===POKO),eat=(cx,cy)=>{f.x=cx+.5;f.y=cy+.5;f.meal={u:1,pt:0,pw:0,e:'🍙'};ACT.eat.start(f,{tdir:-W})};
    eat(x+20,y+21);const e0=!!S.flags.warmEat;eat(x+1,y+sacredSpan()+3);const e1=!!S.flags.warmEat;
    return JSON.stringify({t0,t1,e0,e1,check:QUESTS1[qsIx('warmMeal')].check()})})()`));
  assert.deepEqual(c,{t0:false,t1:true,e0:false,e1:true,check:true});
  console.log('table near the stump, Futaba eats there');
  /* 5. かまどのサブクエストはない */
  assert.equal(await run(`SUBQ.some(q=>q.k==='oven')`),false);console.log('oven side quest: removed');
  /* 6. 古いセーブ：今のならびで warmMeal がない番号を読みかえる（2回でもずれない） */
  const m=JSON.parse(await run(`(()=>{const w=qsIx('warmMeal'),mk=(q,st,tk)=>({free:false,world:0,quest:q,qStory:st,qTalked:tk,flags:{}});
    const a=mk(w,null,true);migrateWarmIns(a,true);/* 前は water が w */const a2=a.quest;migrateWarmIns(a,true);
    const b=mk(w,w-1,false);migrateWarmIns(b,true);/* 燃やさない火のお礼待ち */
    const c=mk(w-1,null,true);migrateWarmIns(c,true);/* 燃やさない火のとちゅう */
    const d=mk(w+1,null,true);migrateWarmIns(d,false);/* もう今の番号 */
    return JSON.stringify({w,a:a2,a2:a.quest,b:[b.quest,b.qStory,b.qTalked],c:c.quest,d:d.quest})})()`));
  assert.equal(m.a,m.w+1);assert.equal(m.a2,m.w+1);assert.deepEqual(m.b,[m.w,m.w-1,false]);assert.equal(m.c,m.w-1);assert.equal(m.d,m.w+1);
  console.log('old saves: water stays water, waiting fireRoot thanks goes to warmMeal next');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
