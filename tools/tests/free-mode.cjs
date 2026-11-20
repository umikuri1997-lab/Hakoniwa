/* フリーモード：花の谷（川がない・丘がかこむ・南の切れ目・野の花）／神殿もカミサマもない・おそなえ箱と依頼ボードはべつべつ／なかまは自分でやってくる／
   火山をクリアすると開く物（火と水のせいれい・火山の物・竹・鉱脈・おまつり・イベント）／お話「谷で生まれた小さなせいれい」（つぼみ → 生まれる → まねっこ → 水やり → 大きくなる → 旅立ち）／
   旅のあいだ：きょうの目標・季節の話4つと旅先からの手紙 → おかえり／第2章／旅のお客さんのお店 */
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
  assert.deepEqual(m.ids,['fbud','fborn','ffirst','fcant','fgrow','fdepart']);assert.equal(m.key,'hakoniwa-free-v2');
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
  /* 4. お話：谷で生まれた小さなせいれい */
  const day=d=>`S.t=(${d}-1)*1440+11*60;S.lastMorning=${d};DLGGAP=0;`;
  const tk=async()=>{const o=await run(`(()=>{${calm}DLGGAP=0;startTalk();return $('#dialog').hidden?0:1})()`);assert.equal(o,1,'a talk opens');await talk()};
  const st=()=>J(`JSON.stringify({q:S.quest,qs:S.qStory,tk:S.qTalked,k:S.kid&&{st:S.kid.st,name:S.kid.name||'',bj:S.kid.bj},kr:!!KR&&{kid:KR.kid,m:KR.kidM||''}})`);
  const ck=c=>run(`(()=>{${calm}DLGGAP=0;${c||''};checkQuest();return 1})()`);
  await ck(day(1));let k=await st();assert.equal(k.k.st,'bud','a glowing bud appears');assert.equal(k.q,0);
  await tk();await ck(`const j=S.kid.bj;for(const[d,id]of[[2,'chair'],[-2,'stool'],[2*W,'torch']])S.obj[j+d]=id;recount()`);k=await st();assert.equal(k.qs,0,'three things beside the bud');await tk();
  await ck();await tk();k=await st();assert.equal(k.q,1);assert.equal(k.tk,true);
  await ck(day(2)+'kidTick(.1)');await page.waitForTimeout(4600);
  const pop=await run(`(()=>{const i=document.querySelector('.vn-reveal input');if(!i)return 0;i.value='ハナ';document.querySelector('.vn-reveal .btn.pri').click();return 1})()`);assert.equal(pop,1,'name popup after the bud opens');
  await ck();k=await st();assert.equal(k.k.st,'baby');assert.equal(k.k.name,'ハナ');assert.equal(k.kr.kid,true,'small');assert.equal(k.qs,1);await tk();
  const fo=await J(`(()=>{const L=kidLeader();KR.x=L.x+3;KR.y=L.y;KR.kT=0;kidTick(.1);const far=KR.path.length>0;for(let i=0;i<600&&KR.path.length;i++)kidTick(.2);return JSON.stringify({far,d:Math.hypot(KR.x-L.x,KR.y-L.y)})})()`);
  assert.ok(fo.far&&fo.d<2.5,'the little spirit follows: '+fo.d);
  await ck();await tk();await ck(`freeEvEnd('taiso',[S.res[0]])`);k=await st();assert.equal(k.qs,2,'first event');await tk();
  await ck();const cry=await J(`(()=>{const m=[];for(let i=0;i<2;i++){KR.kT=0;kidThink(KR);m.push(KR.kidM)}return JSON.stringify(m)})()`);assert.deepEqual(cry.sort(),['kid_carry','kid_talksad'],'tries to carry and cries');
  await tk();const fl=await J(`(()=>{const c=(KR.y|0)*W+(KR.x|0),L=[];for(let r=2;r<8&&L.length<3;r++)for(let d=-r;d<=r&&L.length<3;d++){const j=c+r*W+d;if(!S.obj[j]&&walk(j)&&S.ground[j]===0){S.obj[j]='clover';L.push(j)}}recount();
    for(let i=0;i<3000&&kidBloomN()<3;i++){if(!KR.path.length&&KR.kT>0)KR.kT=0;kidTick(.2)}return JSON.stringify({n:kidBloomN(),w:Object.keys(S.kid.wat).length})})()`);
  assert.equal(fl.n,3,'the little spirit waters the three flowers by itself');
  await ck();k=await st();assert.equal(k.qs,3);await tk();
  await ck(`kidMorning()`);k=await st();assert.equal(k.k.st,'grown');assert.equal(k.kr.kid,false,'grown up');
  await ck();await tk();await ck(`window._st=suteki;suteki=()=>({st:3,v:0})`);k=await st();assert.equal(k.qs,4);await run(`suteki=window._st`);await tk();
  await ck();await tk();await ck(`S.inv.gf_kirei=1`);k=await st();assert.equal(k.qs,5);await tk();
  const go=await J(`(()=>{for(let i=0;i<6000&&S.kid.st==='leave';i++)kidTick(.2);return JSON.stringify({st:S.kid.st,cl:S.cleared,gift:S.inv.gf_kirei||0,kr:!!KR})})()`);
  assert.equal(go.st,'away','the little spirit left the valley');assert.equal(go.cl,true);assert.equal(go.gift,0,'the gift went with it');assert.equal(go.kr,false);
  console.log('Story: bud, birth and name, following, crying, watering, growing up, departure');
  /* 5. おまつりのあと：きょうの目標・季節の話（谷のあつまり） */
  const a=await J(`(()=>{S.clearDay=1;${day(2)}checkQuest();return JSON.stringify({daily:S.daily&&S.daily.k,all:dailyHere().map(g=>g.k),dlg:!$('#dialog').hidden,pl:[fplWild().length,fplPond().length,fplGrove().length,fplHill().length]})})()`);
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
  assert.equal(h.fin,1);assert.equal(h.dlg,false);
  const lt=await J(`JSON.stringify((S.letterQ||[]).filter(q=>/^kid/.test(q.k)).map(q=>q.who+q.tx.length))`);assert.deepEqual(lt,['ハナ3','ハナ3','ハナ3','ハナ3'],'a letter after each season');assert.ok(h.sec);assert.equal(h.vol,false,'chapter 2 is hidden before the volcano is cleared');assert.equal(h.bad,false);assert.match(h.q,/きょうの目標/);
  const bk=await J(`(()=>{${day(17)}kidMorning();const o={st:S.kid.st};for(let i=0;i<6000&&!S.kid.arr;i++){if(!KR.path.length)KR.kT=0;kidTick(.2)}o.arr=S.kid.arr;DLGGAP=0;checkQuest();o.dlg=!$('#dialog').hidden;return JSON.stringify(o)})()`);
  assert.equal(bk.st,'back');assert.equal(bk.arr,1);assert.ok(bk.dlg,'welcome home talk');await talk();
  const hm=await J(`JSON.stringify({st:S.kid.st,res:S.res.some(r=>r.name==='ハナ'&&r.elem==='wood'),lily:S.inv.lily||0})`);assert.equal(hm.st,'home');assert.ok(hm.res,'joins the valley');assert.ok(hm.lily>=3,'seeds from the journey');
  console.log('While away: daily goals, four valley gatherings with letters, the closing talk and the return');
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
