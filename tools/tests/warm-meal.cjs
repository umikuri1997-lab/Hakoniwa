/* 「あたたかいごはん」（warmMeal）：燃やさない火のあとのメインクエスト。ならび・会話・焼いた物の数え方・わたす動き・古いセーブの読みかえ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  /* 1. ならび */
  const ids=JSON.parse(await run(`JSON.stringify(QUESTS1.map(q=>q.id))`)),w=ids.indexOf('warmMeal');
  assert.equal(ids[w-1],'fireRoot','after fireRoot');assert.equal(ids[w+1],'water','before water');
  console.log('order: fireRoot → warmMeal → water');
  /* 2. 依頼の会話：かまどをまだ思いついていなければ、ここで思いつく */
  const t=JSON.parse(await run(`(()=>{const H=mkRes(S,keyName('fire')||'ホノ','fire',S.res[0].x+1,S.res[0].y);if(!S.res.some(r=>r.elem==='fire'))S.res.push(H);const q=QUESTS1[qsIx('warmMeal')];
    S.guardianIdeas={};S.recipes.oven=false;const a={learn:q.talk.learn,idea:q.talk.lines.some(l=>l[0]==='@idea'),who:q.talk.who};
    S.guardianIdeas={oven:1};const b={learn:q.talk.learn,idea:q.talk.lines.some(l=>l[0]==='@idea')};
    return JSON.stringify({a,b,speakers:[...new Set(q.story.map(l=>l[0]))],cue:q.story[0][3]})})()`));
  assert.deepEqual(t.a.learn,['oven']);assert.equal(t.a.idea,true);assert.deepEqual(t.b.learn,[]);assert.equal(t.b.idea,false);
  assert.equal(t.cue,'give:H>F');assert(t.speakers.every(n=>n&&n.length>1),'names resolved '+t.speakers);
  console.log('talk: idea only when oven is new; thanks speakers',t.speakers.join('・'));
  /* 3. 受けてから焼いたベイクドポテトだけ数える */
  const c=JSON.parse(await run(`(()=>{const r=S.res.find(r=>r.elem==='fire'),fake=()=>{r.cing={rec:'yakiimo'};ACT.cook.end(r,{obj:S.res[0].y*W+(S.res[0].x|0)})};
    S.quest=qsIx('warmMeal');S.qStory=null;S.qTalked=false;delete S.flags.warmYaki;fake();const before=!!S.flags.warmYaki;
    S.qTalked=true;r.cing={rec:'yakizakana'};ACT.cook.end(r,{obj:0});const fish=!!S.flags.warmYaki;fake();const after=!!S.flags.warmYaki;
    return JSON.stringify({before,fish,after,check:QUESTS1[qsIx('warmMeal')].check()})})()`));
  assert.deepEqual(c,{before:false,fish:false,after:true,check:true});
  console.log('cooking: counts only yakiimo baked after accepting');
  /* 4. わたす動き */
  const g=await run(`(()=>{const f=S.res.find(r=>r.name===POKO),h=S.res.find(r=>r.elem==='fire');h.x=f.x+1.5;h.y=f.y;dlgCue('give:H>F');return STAGEWAIT>performance.now()&&h.face===-1})()`);
  assert.equal(g,true,'give cue turns the fire spirit to Futaba and holds the line');
  console.log('give: fire spirit hands it to Futaba');
  /* 5. かまどのサブクエストは、メインで先に思いついたら出さない */
  const s=await run(`(()=>{const q=SUBQ.find(q=>q.k==='oven');S.guardianIdeas={};const a=q.at();S.guardianIdeas={oven:1};return a&&!q.at()})()`);
  assert.equal(s,true);console.log('oven side quest: hidden once the main quest showed the idea');
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
