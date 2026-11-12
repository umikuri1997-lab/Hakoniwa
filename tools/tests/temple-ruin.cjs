/* 神殿は、はじめからある、こわれた神殿：草原・火山・フリーモードのどれも。「みる」でタップすると、せいれいが直して神殿になる。古いセーブにも1回だけ置く */
const assert=require('node:assert/strict');
(async()=>{for(const w of [0,1,6]){const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:w});
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+8*60;S.enemyOn=false;S.enemies=[];USERPAUSE=false})()`);
  const a=JSON.parse(await run(`(()=>{const j=RUINT,x=j%W,y=(j/W)|0;const cells=[j-1,j+1,j+W];removeAt(x,y);removeAt(x-1,y);return JSON.stringify({ruin:S.obj[j],parts:cells.map(k=>S.obj[k]+':'+(S.ref[k]===j)),statue:STATUE,usable:usable('statue'),place:cells.some(k=>canPlace('stor',k%W,(k/W)|0,true)),still:S.obj[j],q:QUESTS[S.quest].id,how:QUESTS[S.quest].how})})()`));
  assert.equal(a.ruin,'statueb',`world ${w}: ruined temple at start`);assert.deepEqual(a.parts,['part:true','part:true','part:true']);
  assert.equal(a.statue,-1);assert.equal(a.usable,false,'temple is not built from the palette');assert.equal(a.place,false,'cannot place over the ruin');assert.equal(a.still,'statueb','ruin cannot be removed');
  assert.equal(a.q,'statue');assert.match(a.how,/こわれた神殿/);
  /* 「みる」でタップ（屋根の所） */
  await run(`(()=>{setMode('look');const j=RUINT,wx=(j%W+.5)*TS,wy=((j/W)|0)*TS-2*TS;onTap((wx-cam.x)*cam.z,(wy-cam.y)*cam.z)})()`);/* 屋根の所（像のマスの2マス上）をタップ */
  const b=JSON.parse(await run(`JSON.stringify({o:S.obj[RUINT],d:S.dyn[RUINT],s2:[RUINT-1,RUINT+1,RUINT+W,RUINT+2].map(k=>S.obj[k])})`));
  assert.equal(b.o,'site');assert.equal(b.d.build,'statue');assert.equal(b.d.ruin,1);assert.deepEqual(b.s2,['site2','site2','site2','site2']);
  assert.equal(await run(`templeRuinTap(RUINT)`),false,'second tap does nothing');
  /* せいれいが直す */
  await page.waitForFunction(()=>sacredEval('STATUE>=0'),{},{timeout:120000,polling:500}).catch(async e=>{console.log(await run(`JSON.stringify({t:S.t,res:S.res.map(r=>[r.name,r.act&&r.act.type,r.x,r.y]),d:S.dyn[RUINT],dlg:!document.querySelector('#dialog').hidden})`));throw e});
  const c=JSON.parse(await run(`JSON.stringify({st:S.obj[STATUE],ob:S.obj[STATUE-1],bd:S.obj[STATUE+1],al:S.obj[STATUE+W],ruin:RUINT})`));
  assert.deepEqual(c,{st:'statue',ob:'obox',bd:'board',al:'altar',ruin:-1});
  assert.deepEqual(JSON.parse(await run(`JSON.stringify({p:S.obj[STATUE+2],r:S.ref[STATUE+2]===STATUE+1,sz:BL.board.sz})`)),{p:'part',r:true,sz:[2,1]},'依頼ボードは2マス');
  /* 前のセーブ（ボードは1マス）：右どなりの物をどけて、2マスにする */
  const bm=JSON.parse(await run(`(()=>{const k=STATUE+2;S.obj[k]='lamp';delete S.ref[k];delete S.flags.board2x1;boardMigrate();return JSON.stringify({p:S.obj[k],r:S.ref[k]===STATUE+1,flag:!!S.flags.board2x1,inv:inv('lamp')>0})})()`));
  assert.deepEqual(bm,{p:'part',r:true,flag:true,inv:true},'前のセーブの右どなりの物をもちものへ');
  /* 古いセーブ（神殿がない）：1回だけ置く。2回めは置かない */
  const m=JSON.parse(await run(`(()=>{const s=JSON.parse(JSON.stringify(S));for(let j=0;j<s.obj.length;j++)if(['statue','obox','board','altar'].includes(s.obj[j]))s.obj[j]='';delete s.flags.ruinTemple1;s.quest=0;S=s;LIVE[WD]=S;recount();templeRuinMigrate();const n1=S.obj.filter(o=>o==='statueb').length;delete S.flags.ruinTemple1;templeRuinMigrate();return JSON.stringify({n1,n2:S.obj.filter(o=>o==='statueb').length,flag:!!newState(WD).flags.ruinTemple1})})()`));
  assert.deepEqual(m,{n1:1,n2:1,flag:true});
  assert.deepEqual(errors,[]);console.log('world',w,'ruined temple: placed, tapped, repaired by spirits');await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
