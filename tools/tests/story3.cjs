/* メインに足した3つ：こもれびのまもり（guardLearn）・みんなでジュース（aoFish）・空からのながめ（kite）。ならび・会話・進み・古いセーブ・たこの絵 */
const assert=require('node:assert/strict');
const lines=async(run,page)=>{for(let i=0;i<120;i++){const st=await run(`(()=>{DLGGAP=0;const b=document.querySelector('.idea-reveal button');if(b){b.disabled=false;b.click();return 'idea'}const d=document.querySelector('#dialog');if(!d.hidden){if(STAGEWAIT>performance.now())return 'wait';DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const c=document.querySelector('#dialog button');if(c){c.disabled=false;c.click()}else dlgNext();return 'dlg'}return 'none'})()`);if(st==='none')return i;await page.waitForTimeout(150)}return -1};
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440*3+600;S.enemyOn=false;
    const f=S.res[0];S.res.push(mkRes(S,MINA,'earth',f.x+1,f.y),mkRes(S,'ホノ','fire',f.x+2,f.y),mkRes(S,'アオ','water',f.x+1,f.y+1),mkRes(S,'フウ','wind',f.x+2,f.y+1));for(const r of S.res){r.nap=false;r.hunger=hMax(r)}recount();`);
  /* 1. ならび */
  const ids=JSON.parse(await run(`JSON.stringify(QUESTS1.map(q=>q.id))`)),at=id=>ids.indexOf(id);
  assert.equal(ids[at('guardLearn')-1],'ookage');assert.equal(ids[at('aoFish')-1],'waterFilm');assert.equal(ids[at('kite')-1],'windEcho');
  console.log('order ok');
  /* 2. こもれびのまもり：会話でおぼえ、夜に守ったらクリア。家でふるえていた前提の文はない */
  const g=JSON.parse(await run(`(()=>{const q=QUESTS1[qsIx('guardLearn')];const L=q.talk.lines;S.flags.hDied=1;const L2=q.talk.lines;delete S.flags.hDied;return JSON.stringify({n:L.length,n2:L2.length,house:[...L,...L2].some(l=>/家で/.test(l[1])),old:guardSevOld()})})()`));
  assert(g.n>5&&g.n2>5);assert.equal(g.house,false,'no "trembling at home"');assert.equal(g.old,false,'pink talk off before the main quest');
  await run(`S.quest=qsIx('guardLearn');S.qTalked=false;S.qStory=null;startTalk()`);await lines(run,page);
  const g2=JSON.parse(await run(`JSON.stringify({talked:S.qTalked,guard:!!S.flags.guard})`));assert.deepEqual(g2,{talked:true,guard:true});
  await run(`(()=>{const f=S.res.find(r=>r.name===POKO),h=S.res.find(r=>r.elem==='fire');f.gw={t:S.t,tg:h};h.shU=0;S.enemies=[{type:'basic',x:h.x+1,y:h.y,spawned:true,hp:5,path:[]}];guardTick();S.enemies=[]})()`);
  assert.equal(await run(`!!S.flags.guardUsed&&QUESTS1[qsIx('guardLearn')].check()`),true);console.log('guardLearn: learn by talk, clear by guarding');
  /* 3. ジュース：受けてから水のせいれいが作った3つ */
  const a=JSON.parse(await run(`(()=>{S.quest=qsIx('aoFish');S.qTalked=true;S.qStory=null;delete S.flags.aoJuiceN;delete S.flags.aoGrill;const w=S.res.find(r=>r.elem==='water'),h=S.res.find(r=>r.elem==='fire');
    h.cing={rec:'yakizakana'};ACT.cook.end(h,{obj:0});const n0=S.flags.aoJuiceN||0;for(let i=0;i<3;i++){w.cing={rec:i?'applejuice':'berryjuice'};ACT.cook.end(w,{obj:0})}
    return JSON.stringify({n0,n:S.flags.aoJuiceN,ok:QUESTS1[qsIx('aoFish')].check()})})()`));
  assert.deepEqual(a,{n0:0,n:3,ok:true});console.log('aoFish (juice):',a);
  /* 4. たこ：材料がそろうとクリア、お礼で材料をつかい、たこの絵 */
  await run(`S.quest=qsIx('kite');S.qTalked=true;S.qStory=null;S.mat.eda=5;S.mat.shina=6;checkQuest()`);await page.waitForTimeout(300);const ask=await run(`(()=>{const t=document.body.innerText;return /もらってもいい/.test(t)})()`);assert.equal(ask,true,'asks to take the materials');await run(`(()=>{document.querySelectorAll('.askyn').forEach(e=>e.remove());ASKING=false;PAYOK=true;checkQuest()})()`);for(let i=0;i<40&&await run('S.qStory==null');i++){await page.waitForTimeout(250);await run('checkQuest()')}
  const k0=JSON.parse(await run(`JSON.stringify({qs:S.qStory,k:qsIx('kite')})`));assert.equal(k0.qs,k0.k,'kite cleared, waiting thanks');
  await run(`startTalk()`);await page.waitForTimeout(400);
  let saw=false;for(let i=0;i<120;i++){if(await run('!!KITE'))saw=true;const st=await run(`(()=>{DLGGAP=0;const d=document.querySelector('#dialog');if(d.hidden)return 'none';if(STAGEWAIT>performance.now())return 'wait';DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const c=document.querySelector('#dialog button');if(c){c.disabled=false;c.click()}return 'dlg'})()`);if(process.env.DBG)console.log(i,st,await run('JSON.stringify({qs:S.qStory,n:DLGA&&DLGA.full&&DLGA.full.slice(0,20),btn:Array.from(document.querySelectorAll("#dialog button")).map(b=>b.id+":"+b.textContent+":"+b.disabled),pend:sacredMotionPending(),hu:DLGA.holdUntil-performance.now()})'));if(st==='none')break;await page.waitForTimeout(200)}
  await page.waitForTimeout(1500);const k1=JSON.parse(await run(`JSON.stringify({next:QUESTS1[S.quest].id,eda:S.mat.eda,shina:S.mat.shina,qs:S.qStory})`));
  assert.equal(saw,true,'kite drawn');assert.deepEqual(k1,{next:'tower',eda:2,shina:2,qs:null});console.log('kite: thanks with kite, materials used, next tower');
  /* 5. 古いセーブ：足す前のならびの番号を名前で読みかえる（2回でもずれない） */
  const m=JSON.parse(await run(`(()=>{const old=QUESTS1.map(q=>q.id).filter(id=>!STORY3_NEW.includes(id)),oi=id=>old.indexOf(id),mk=(q,st,fl)=>({free:false,world:0,quest:q,qStory:st,qTalked:true,flags:fl||{}});
    const a=mk(oi('wind'),null);migrateStory3Ins(a,true);const a2=a.quest;migrateStory3Ins(a,true);
    const b=mk(oi('wind'),oi('ookage'));migrateStory3Ins(b,true);
    const c=mk(oi('wind'),oi('ookage'),{guard:true});migrateStory3Ins(c,true);
    const d=mk(oi('tower'),oi('windEcho'));migrateStory3Ins(d,true);
    return JSON.stringify({a:QUESTS1[a2].id,a2:QUESTS1[a.quest].id,b:QUESTS1[b.quest].id,c:QUESTS1[c.quest].id,d:QUESTS1[d.quest].id})})()`));
  assert.deepEqual(m,{a:'wind',a2:'wind',b:'guardLearn',c:'wind',d:'kite'});console.log('old saves:',m);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
