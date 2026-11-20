/* フリーモード：花の谷（川がない・丘がかこむ・南の切れ目・野の花）／野の花は物を置くとなくなる／家具のレシピをお話と村レベルでおぼえる・守りの物は出ない／
   お祭りのあと：きょうの目標（コワイノの目標はない）・季節の話4つ（依頼 → イベントをおえる → お礼。4つでしめの話）・目標の一覧／くらしのしくみが動く */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:6});
  const J=async s=>JSON.parse(await run(s));
  const talk=async()=>{for(let i=0;i<60;i++){const on=await run(`(()=>{if($('#dialog').hidden)return 0;if(typeof DLGA!=='undefined'&&DLGA){DLGA.readReady=0;DLGA.holdUntil=0}const b=document.querySelector('#dlgBtns button');if(b){b.disabled=false;b.click()}return 1})()`);if(!on)return;await page.waitForTimeout(60)}throw new Error('dialog did not close')};
  await run(`(()=>{document.querySelector('#dialog').hidden=true;USERPAUSE=true;S.introSeen=true;S.hold=0;resetVillageTransient();recount()})()`);
  /* 1. 花の谷 */
  const m=await J(`(()=>{let ford=0,water=0,ring=0,n=0;for(let j=0;j<W*H;j++){if(S.ground[j]===2)ford++;if(S.ground[j]===1)water++}
    for(let a=0;a<360;a+=10){const t=a*Math.PI/180,x=Math.round(CX+40*Math.cos(t)),y=Math.round(CY+40*Math.sin(t));if(Math.abs(x+.5-CX)<8&&y>CY)continue;n++;if(hiAt(y*W+x)>=2)ring++}
    let edge=0;for(let x=0;x<W;x++)for(const y of[0,H-1])if(S.ground[y*W+x]===1)edge++;
    return JSON.stringify({valley:S.flags.valley,ford,water,edge,ring,n,mid:hiAt(CY*W+CX+10),gap:hiAt((CY+38)*W+CX+2),wild:Object.keys(S.wild).length,houses:HOUSES.length,old:valleyOn({flags:{}},FREE)})})()`);
  assert.equal(m.valley,1);assert.equal(m.ford,0,'no river fords');assert.equal(m.edge,0,'no water reaches the map edge');assert.ok(m.water>20,'ponds');assert.ok(m.ring>=m.n-2,'hills all around: '+m.ring+'/'+m.n);assert.equal(m.mid,0,'flat valley');assert.equal(m.gap,0,'south gap');assert.ok(m.wild>300,'wild flowers: '+m.wild);assert.equal(m.houses,1);assert.equal(m.old,false,'old saves keep their land');
  console.log('Valley: hills '+m.ring+'/'+m.n+', water '+m.water+', wild flowers '+m.wild);
  /* 2. 野の花：物を置くとなくなる。雑草の下ではのこる */
  const w=await J(`(()=>{const ks=Object.keys(S.wild).map(Number).filter(j=>!S.obj[j]),a=ks[0],b=ks[1];S.obj[a]='rock';S.obj[b]='weed0g';recount();const r={a:a in S.wild,b:b in S.wild,attr:ATTR.wood};S.obj[a]='';S.obj[b]='';recount();return JSON.stringify(r)})()`);
  assert.equal(w.a,false,'a rock removes the wild flower');assert.equal(w.b,true,'a weed keeps it');
  /* 3. レシピ：お話でおぼえる・守りの物は出ない・第1話の説明 */
  const r=await J(`(()=>{const b0=recipeKnown('bed');S.quest=1;S.qTalked=true;syncQuestRecipes(S);const o={b0,bed:recipeKnown('bed'),loom:recipeKnown('loom'),how:QUESTS[1].how};
    S.recipes.spike=true;o.spike=recipeKnown('spike');S.totalPt=99999;checkLevel();o.lv=S.lv;o.lure=lvOK('lurestatue');o.watch=lvOK('watch');o.cook=!!S.recipes.cooktable;o.bl=!!S.unlocked.ladder_bamboo;o.lvl6=visibleLevelRewardsAt(6).includes('lurestatue');return JSON.stringify(o)})()`);
  assert.equal(r.b0,false);assert.ok(r.bed&&r.loom,'ep1 teaches the loom and the bed');assert.ok(!/すきま/.test(r.how),'ep1 text matches the finished house');assert.equal(r.spike,false,'no traps');assert.equal(r.lure,false);assert.equal(r.watch,false);assert.equal(r.lvl6,false);assert.ok(r.cook,'furniture is learned by village level');assert.equal(r.bl,false,'no bamboo things');
  console.log('Recipes: ep1 teaches loom+bed, level '+r.lv+' teaches furniture, defense items hidden');
  await page.waitForTimeout(300);await run(`(()=>{for(const b of document.querySelectorAll('.pxcard button,.idea-card button'))b.click();GIFT_ACTIVE=false;S.hold=0;$('#dialog').hidden=true;DLGQ.length=0})()`);
  /* 4. お祭りのあと：きょうの目標と季節の話 */
  const day=d=>`S.t=${'('+d+'-1)*1440+11*60'};S.lastMorning=${d};DLGGAP=0;`;
  const a=await J(`(()=>{S.quest=QUESTS.length-1;S.qTalked=false;S.qStory=null;S.cleared=true;S.clearDay=1;${day(2)}checkQuest();return JSON.stringify({daily:S.daily&&S.daily.k,all:dailyHere().map(g=>g.k),dlg:!$('#dialog').hidden,sea:seasonNow()})})()`);
  assert.ok(a.daily&&a.daily.length===2,'two daily goals');assert.ok(!a.all.includes('kill')&&!a.all.includes('bamboo'),'no foe/bamboo goals: '+a.all);assert.ok(a.dlg,'the spring request starts');assert.equal(a.sea,0);
  await talk();
  const b=await J(`JSON.stringify({a:S.fsea.a,q:$('#questTxt').textContent,on:evOn('hana'),pt:S.pt})`);
  assert.equal(b.a[0],1);assert.match(b.q,/花まつり/);assert.ok(b.on,'grass events open in free mode');
  /* イベントをおえる前は、お礼が出ない */
  const c0=await J(`(()=>{DLGGAP=0;checkQuest();return JSON.stringify({dlg:!$('#dialog').hidden})})()`);assert.equal(c0.dlg,false,'no thanks before the event');
  for(let k=0;k<4;k++){const d=2+k*5+(k?0:0);
    if(k){const q=await J(`(()=>{${day(1+k*5)}checkQuest();return JSON.stringify({dlg:!$('#dialog').hidden,sea:seasonNow()})})()`);assert.equal(q.sea,k);assert.ok(q.dlg,'request of season '+k);await talk();}
    const e=await J(`(()=>{const p0=S.pt;fseaEvEnd(FSEA[${k}].ev,[S.res[0]]);DLGGAP=0;checkQuest();return JSON.stringify({e:S.fsea.e[${k}],dlg:!$('#dialog').hidden,p0})})()`);
    assert.equal(e.e,1);assert.ok(e.dlg,'thanks of season '+k);await talk();
    const f=await J(`JSON.stringify({d:S.fsea.d[${k}],pt:S.pt})`);assert.equal(f.d,1);assert.equal(f.pt,e.p0+60,'reward of season '+k)}
  const g=await J(`(()=>{DLGGAP=0;checkQuest();return JSON.stringify({dlg:!$('#dialog').hidden})})()`);assert.ok(g.dlg,'closing talk');await talk();
  const h=await J(`(()=>{DLGGAP=0;checkQuest();openSheet('menu','goal');const t=$('#sheetBody').textContent;closeSheet();return JSON.stringify({fin:S.fsea.fin,dlg:!$('#dialog').hidden,sec:t.includes('季節の話'),daily:t.includes('きょうの目標'),trial:/試練|コワイノ|オオカゲ/.test(t),q:$('#questTxt').textContent})})()`);
  assert.equal(h.fin,1);assert.equal(h.dlg,false,'nothing repeats');assert.ok(h.sec&&h.daily,'goal sheet');assert.equal(h.trial,false,'no trial in free mode');assert.match(h.q,/きょうの目標/);
  console.log('After the festival: daily goals '+a.daily.join('・')+', four season stories and the closing talk');
  /* 5. くらしのしくみ */
  const l=await J(`(()=>{const o={kd:kdOn()};S.res.push(mkRes(S,'テスト','fire',CX+2,CY+2));recount();dreamMorning();troubleMorning();bpMorning();kdMorning();letterQ(S.res[0],'new',{});o.letter=(S.letQ||S.letters||[]).length!=null;openSheet('menu','zukan');o.zk=$('#sheetBody').textContent.length;closeSheet();return JSON.stringify(o)})()`);
  assert.ok(l.kd,'kodama on');assert.ok(l.zk>0,'zukan opens');
  await page.waitForTimeout(400);
  assert.deepEqual(errors,[],'no page errors');await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
