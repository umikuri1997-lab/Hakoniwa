/* フリーモード：花の谷（川がない・丘がかこむ・南の切れ目・野の花）／神殿もカミサマもない・おそなえ箱と依頼ボードはべつべつ／なかまは自分でやってくる／
   火山をクリアすると開く物（火と水のせいれい・火山の物・竹・鉱脈・おまつり・イベント）／第1章の目標／おまつりのあと：きょうの目標・季節の話4つ・第2章／旅のお客さんのお店 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:6});
  const J=async s=>JSON.parse(await run(s));
  const talk=async()=>{for(let i=0;i<80;i++){const on=await run(`(()=>{if($('#dialog').hidden)return 0;if(typeof DLGA!=='undefined'&&DLGA){DLGA.readReady=0;DLGA.holdUntil=0}const b=document.querySelector('#dlgBtns button');if(b){b.disabled=false;b.click()}return 1})()`);if(!on)return;await page.waitForTimeout(60)}throw new Error('dialog did not close')};
  const calm=`for(const b of document.querySelectorAll('.pxcard button,.idea-card button'))b.click();GIFT_ACTIVE=false;S.hold=0;NEWQ.length=0;NEWRES=null;try{HOLD.clear()}catch(e){}if(sheet)closeSheet();DLGGAP=0;`;
  await run(`(()=>{document.querySelector('#dialog').hidden=true;USERPAUSE=true;S.introSeen=true;S.hold=0;resetVillageTransient();recount()})()`);
  /* 1. 花の谷・神殿なし */
  const m=await J(`(()=>{let ford=0,water=0,ring=0,n=0;for(let j=0;j<W*H;j++){if(S.ground[j]===2)ford++;if(S.ground[j]===1)water++}
    for(let a=0;a<360;a+=10){const t=a*Math.PI/180,x=Math.round(CX+40*Math.cos(t)),y=Math.round(CY+40*Math.sin(t));if(Math.abs(x+.5-CX)<8&&y>CY)continue;n++;if(hiAt(y*W+x)>=2)ring++}
    return JSON.stringify({ford,water,ring,n,mid:hiAt(CY*W+CX+10),gap:hiAt((CY+38)*W+CX+2),wild:Object.keys(S.wild).length,houses:HOUSES.length,
      statue:STATUE,ruin:RUINT,obox:OBOX,board:BOARD,part:S.obj[BOARD+1],god:godHere(),noT:noTemple(),shop:!!S.feat.shop,ids:QUESTS.map(q=>q.id),key:SAVE_KEYS[FREE]})})()`);
  assert.equal(m.ford,0,'no river');assert.ok(m.water>20,'ponds');assert.ok(m.ring>=m.n-2,'hills all around');assert.equal(m.mid,0);assert.equal(m.gap,0,'south gap');assert.ok(m.wild>300,'wild flowers');assert.equal(m.houses,1);
  assert.equal(m.statue,-1,'no temple');assert.equal(m.ruin,-1,'no broken temple');assert.ok(m.obox>=0&&m.board>=0&&m.board!==m.obox+1,'offering box and board stand apart');assert.equal(m.part,'part');assert.equal(m.god,false,'no god');assert.equal(m.noT,false,'building works without a temple');assert.equal(m.shop,false);
  assert.deepEqual(m.ids,['fhome','fspot','ffriend','fevent','fsuteki']);assert.equal(m.key,'hakoniwa-free-v2');
  console.log('Valley: hills '+m.ring+'/'+m.n+', wild flowers '+m.wild+', no temple, box and board placed');
  /* 2. 野の花：物を置くとなくなる。雑草の下ではのこる */
  const w=await J(`(()=>{const ks=Object.keys(S.wild).map(Number).filter(j=>!S.obj[j]),a=ks[0],b=ks[1];S.obj[a]='rock';S.obj[b]='weed0g';recount();const r={a:a in S.wild,b:b in S.wild};S.obj[a]='';S.obj[b]='';recount();return JSON.stringify(r)})()`);
  assert.equal(w.a,false);assert.equal(w.b,true);
  /* 3. はじめの土地の物だけ・守りの物は出ない・なかまは木と土だけ */
  const t0=await J(`(()=>{S.recipes.spike=true;S.recipes.oven=true;const o={tier:freeTier(),bed:recipeKnown('bed'),spike:recipeKnown('spike'),oven:recipeKnown('oven'),bw:stageItemOK('bamboowall'),hw:stageItemOK('hwall'),hi:evOn('himatsuri'),ha:evOn('hana'),fh:evOn('fhanami'),volk:VOLK(),el:freeElems()};
    const n0=S.res.length;ATTR.fire=99999;freeArrive();o.fire=S.res.length-n0;ATTR.fire=0;ATTR.earth=99999;freeArrive();o.came=S.res.length-n0;const r=S.res[S.res.length-1];o.elem=r.elem;o.y=r.y-CY;o.farr=S.farr;freeArrive();o.again=S.res.length-n0;return JSON.stringify(o)})()`);
  assert.equal(t0.tier,0);assert.ok(t0.bed,'basic recipes');assert.equal(t0.spike,false,'no traps');assert.equal(t0.oven,false,'volcano furniture is locked');assert.equal(t0.bw,false);assert.ok(t0.hw);assert.equal(t0.hi,false,'volcano events are locked');assert.ok(t0.ha&&t0.fh,'grass and valley events');assert.equal(t0.volk,false);
  assert.deepEqual(t0.el,['wood','earth']);assert.equal(t0.fire,0,'no fire spirit before the volcano is cleared');assert.equal(t0.came,1,'a spirit arrives by itself');assert.equal(t0.elem,'earth');assert.ok(t0.y>8,'from the south gap: '+t0.y);assert.equal(t0.farr,1);assert.equal(t0.again,1,'one a day');
  console.log('Tier 0: grass things only, an earth spirit walked in from the south');
  await page.waitForTimeout(300);await run(`(()=>{${calm}})()`);
  /* 4. 第1章：その話でしたイベントだけ数える・目標の判定が動く */
  const q=await J(`(()=>{const o={};freeEvEnd('taiso',[S.res[0]]);o.before=S.fevN||0;S.quest=3;S.qTalked=true;freeEvEnd('taiso',[S.res[0]]);o.after=S.fevN;S.quest=0;S.qTalked=false;o.chk=QUESTS.map(q=>!!q.check());o.prog=QUESTS.map(q=>q.prog());return JSON.stringify(o)})()`);
  assert.equal(q.before,0);assert.equal(q.after,1);assert.equal(q.chk[2],true,'the arrival counts');assert.match(q.prog[0],/住み心地 ★/);assert.match(q.prog[4],/すてき度 ★/);
  /* 5. おまつりのあと：きょうの目標・季節の話（谷のあつまり） */
  const day=d=>`S.t=(${d}-1)*1440+11*60;S.lastMorning=${d};DLGGAP=0;`;
  const a=await J(`(()=>{S.quest=QUESTS.length-1;S.qTalked=false;S.qStory=null;S.cleared=true;S.clearDay=1;${day(2)}checkQuest();return JSON.stringify({daily:S.daily&&S.daily.k,all:dailyHere().map(g=>g.k),dlg:!$('#dialog').hidden,pl:[fplWild().length,fplPond().length,fplGrove().length,fplHill().length]})})()`);
  assert.ok(a.daily&&a.daily.length===2);assert.ok(!a.all.includes('kill')&&!a.all.includes('bamboo'));assert.ok(a.dlg,'the spring request starts');assert.deepEqual(a.pl,[1,1,1,1],'valley places for the gatherings');
  await talk();await run(`dailyCheck=()=>{}`);
  const b=await J(`JSON.stringify({a:S.fsea.a,q:$('#questTxt').textContent})`);assert.equal(b.a[0],1);assert.match(b.q,/花見/);
  const c0=await J(`(()=>{DLGGAP=0;checkQuest();return JSON.stringify({dlg:!$('#dialog').hidden})})()`);assert.equal(c0.dlg,false,'no thanks before the gathering');
  for(let k=0;k<4;k++){
    if(k){const s=await J(`(()=>{${day(1+k*5)}checkQuest();return JSON.stringify({dlg:!$('#dialog').hidden,sea:seasonNow()})})()`);assert.equal(s.sea,k);assert.ok(s.dlg,'request of season '+k);await talk();}
    const e=await J(`(()=>{const p0=S.pt;freeEvEnd(FSEA[${k}].ev,[S.res[0]]);DLGGAP=0;checkQuest();return JSON.stringify({dlg:!$('#dialog').hidden,p0})})()`);assert.ok(e.dlg,'thanks of season '+k);await talk();
    const f=await J(`JSON.stringify({d:S.fsea.d[${k}],pt:S.pt})`);assert.equal(f.d,1);assert.equal(f.pt,e.p0+60)}
  const g=await J(`(()=>{DLGGAP=0;checkQuest();return JSON.stringify({dlg:!$('#dialog').hidden})})()`);assert.ok(g.dlg,'closing talk');await talk();
  const h=await J(`(()=>{DLGGAP=0;checkQuest();openSheet('menu','goal');const t=$('#sheetBody').textContent;closeSheet();return JSON.stringify({fin:S.fsea.fin,dlg:!$('#dialog').hidden,sec:t.includes('季節の話'),vol:t.includes('火山のたより'),bad:/試練|コワイノ|オオカゲ|守られた/.test(t),q:$('#questTxt').textContent})})()`);
  assert.equal(h.fin,1);assert.equal(h.dlg,false);assert.ok(h.sec);assert.equal(h.vol,false,'chapter 2 is hidden before the volcano is cleared');assert.equal(h.bad,false);assert.match(h.q,/きょうの目標/);
  console.log('After the festival: daily goals, four valley gatherings and the closing talk');
  /* 6. 旅のお客さん */
  const v=await J(`(()=>{freeVisitMorning();const o={visit:!!S.st2.visit,here:visitHere(),name:visitor()&&visitor().name};openSheet('shop');o.title=$('#sheetTitle').textContent;o.txt=$('#sheetBody').textContent.slice(0,60);closeSheet();S.st2.visit=null;VISITOR=null;openSheet('shop');o.closed=sheet==null;return JSON.stringify(o)})()`);
  assert.ok(v.visit&&v.here,'a visitor is in the valley');assert.match(v.title,/のお店/);assert.ok(!/カミサマ/.test(v.title+v.txt),'no god in the shop: '+v.txt);assert.ok(v.closed,'no shop without a visitor');
  /* 7. 火山をクリアすると開く */
  const t1=await J(`(()=>{LIVE[1]={cleared:true,summary:1};FTS=null;checkQuest();const c={};for(const o of S.obj)if(o)c[o]=(c[o]||0)+1;let veins=0;for(const k in c)if(VEINS[k])veins+=c[k];
    return JSON.stringify({tier:freeTier(),fvol:S.flags.fvol,veins,bamboo:c.bamboo||0,smelter:lvOK('smelter'),bw:stageItemOK('bamboowall'),hi:evOn('himatsuri'),on:evOn('onsen'),volk:VOLK(),el:freeElems(),vis:freeVisitors().length,onsen:lvOK('onsen')||S.lv,dlg:!$('#dialog').hidden})})()`);
  assert.equal(t1.tier,1);assert.equal(t1.fvol,1);assert.ok(t1.veins>0,'veins: '+t1.veins);assert.ok(t1.bamboo>0,'bamboo: '+t1.bamboo);assert.ok(t1.smelter);assert.ok(t1.bw);assert.ok(t1.hi);assert.equal(t1.on,false,'no hot-spring tour');assert.ok(t1.volk);assert.equal(t1.el.length,4);assert.equal(t1.vis,4);
  console.log('Tier 1: veins '+t1.veins+', bamboo '+t1.bamboo+', fire and water spirits, volcano events');
  /* 8. 第2章 */
  await page.waitForTimeout(300);await run(`(()=>{${calm}checkQuest()})()`);
  for(let i=0;i<4;i++){const s=await J(`(()=>{DLGGAP=0;if($('#dialog').hidden)checkQuest();return JSON.stringify({dlg:!$('#dialog').hidden,i:S.fc2.i,on:S.fc2.on})})()`);assert.ok(s.dlg,'request of chapter 2 step '+i);assert.equal(s.i,i);await talk();
    const u=await J(`(()=>{const o={q:$('#questTxt').textContent,on:S.fc2.on,done0:FCH2[${i}].done()};${['S.res.push(mkRes(S,"ヒ","fire",CX+2,CY+2));recount();','S.fc2.bath=1;','(S.gear||(S.gear=[])).push({id:"gw01",lv:0});','freeEvEnd("himatsuri",[S.res[0]]);'][i]}DLGGAP=0;const p0=S.pt;checkQuest();o.dlg=!$('#dialog').hidden;o.p0=p0;return JSON.stringify(o)})()`);
    assert.equal(u.on,1);assert.equal(u.done0,false,'step '+i+' needs the action');assert.ok(u.dlg,'thanks of step '+i);await talk();
    const x=await J(`JSON.stringify({i:S.fc2.i,pt:S.pt})`);assert.equal(x.i,i+1);assert.equal(x.pt,u.p0+[60,60,80,100][i])}
  const z=await J(`(()=>{DLGGAP=0;checkQuest();openSheet('menu','goal');const t=$('#sheetBody').textContent;closeSheet();return JSON.stringify({dlg:!$('#dialog').hidden,vol:t.includes('火山のたより')})})()`);assert.equal(z.dlg,false);assert.ok(z.vol);
  console.log('Chapter 2: four stories after the volcano is cleared');
  /* 9. くらしのしくみ */
  const l=await J(`(()=>{const o={kd:kdOn()};dreamMorning();troubleMorning();bpMorning();kdMorning();letterQ(S.res[0],'new',{});openSheet('menu','zukan');o.zk=$('#sheetBody').textContent.length;closeSheet();return JSON.stringify(o)})()`);
  assert.ok(l.kd);assert.ok(l.zk>0);
  await page.waitForTimeout(400);
  assert.deepEqual(errors,[],'no page errors');await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
