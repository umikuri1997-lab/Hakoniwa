/* 土の粘土とやきもの（tsuchi-yaki.js）：岩をほると粘土が出る・粘土の窯で粘土3こ→やきもの1こ・つぼ（やきもの2こ）・ほかのステージでは出ない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  const a=await J(`({nendo:matHere({mat:{nendo:1}},WD),yaki:matHere({mat:{yaki:1}},WD),ok:['tskama','tsubo'].map(id=>stageItemOK(id)&&FURN.includes(id)&&LEVELUP_ITEMS.has(id)&&CRAFT_TABS.some(t=>t[1].includes(id))),proc:PROC.tskama,matn:MATN.yaki,icon:!!ICONS.yaki,comfy:COMFY.tsubo,nomat:[0,1,3,4,5,6].every(w=>NOMAT[w].includes('yaki')),n2:NOMAT[2].includes('nendo')||NOMAT[2].includes('yaki')})`);
  console.log(JSON.stringify(a));assert.ok(a.nendo&&a.yaki);assert.deepEqual(a.ok,[true,true]);assert.deepEqual(a.proc,{ins:['nendo'],n:3,out:'yaki',el:'earth',T:90,cap:10,verb:'やく',ask:'やきものをたのんだ'});assert.equal(a.matn,'やきもの');assert.ok(a.icon);assert.equal(a.comfy,6);assert.ok(a.nomat);assert.equal(a.n2,false);
  /* 岩をほる：砂岩と粘土が出る（mine の end） */
  const b=await J(`(()=>{const j=S.obj.findIndex((o,q)=>o==='rock'&&!S.obj[q+1]!==undefined);const r=S.res[0];r.xp=99999;r.cmat={};const n0=S.mat.nendo|0,s0=S.mat.sagan|0;S.obj[j]='rock';const a={obj:j,tgt:'rock',t:0};ACT.mine.end(r,a);return{n:(S.mat.nendo|0)-n0+((r.cmat&&r.cmat.nendo)|0),s:(S.mat.sagan|0)-s0+((r.cmat&&r.cmat.sagan)|0)}})()`);
  console.log(JSON.stringify(b));assert.ok(b.n>=1,'粘土が出る');
  /* 窯の絵・つぼの絵がエラーなく描ける・窯にたのめる */
  const c=await J(`(()=>{const c=document.createElement('canvas').getContext('2d');tsDrawObj(c,'tskama',0,0,0,performance.now());tsDrawObj(c,'tsubo',0,0,0,performance.now());const k=S.obj.findIndex(o=>!o);return{ok:1,proc:!!PROC.tskama,pop:typeof prPop}})()`);
  assert.ok(c.ok);
  const d=await J(`(()=>{const j=S.obj.findIndex(o=>!o&&true);S.obj[j]='tskama';S.prIn=S.prIn||{};S.prIn[j]={nendo:2};const r0=prReady(j);S.prIn[j]={nendo:3};const r1=prReady(j);const hs=S.res.find(q=>q.elem==='earth');return{r0,r1,ok:hs?procOK(hs,'tskama'):true}})()`);console.log(JSON.stringify(d));assert.equal(d.r0,null);assert.equal(d.r1,'nendo');assert.ok(d.ok);
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
