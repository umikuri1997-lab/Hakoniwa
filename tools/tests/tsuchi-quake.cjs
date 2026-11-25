/* 土の地ゆれ（tsuchi-quake.js）：石の大橋のあと、前の日に知らせ → その日の昼にゆれて、ささえの柱のとどかない家の壁がくずれ、がけのふもとに岩が落ちる。
   ささえの柱は、土のステージの家具（BL.tspillar） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  /* ささえの柱の登録 */
  const a=await J(`({bl:!!BL.tspillar,ok:stageItemOK('tspillar'),furn:FURN.includes('tspillar'),lvl:LEVELUP_ITEMS.has('tspillar'),tab:CRAFT_TABS.some(t=>t[1].includes('tspillar')),mat:BL.tspillar.mat})`);
  console.log(JSON.stringify(a));assert.ok(a.bl&&a.ok&&a.furn&&a.lvl&&a.tab);assert.deepEqual(a.mat,{sagan:8,wood:2});
  /* 橋の前は、何も起きない */
  const b0=await J(`(()=>{document.querySelector('#dialog').hidden=true;S.flags.tapped=1;S.enemies=[];return{r:tsQuakeTick(),qk:!!S.ts.qk}})()`);assert.equal(b0.r,false);assert.equal(b0.qk,false);
  /* じゅんび：橋がかかった。壁を、柱のそばに2まい・遠くに4まい */
  const b1=await J(`(()=>{S.flags.tsBridge=1;S.t=Math.floor(S.t/1440)*1440+10*60;const r1=tsQuakeTick();const q=S.ts.qk;
    for(let j=0;j<W*H;j++)if(DECAYW.has(S.obj[j]))S.obj[j]='';const free=[];for(let y=CY-8;y<=CY+8;y++)for(let x=CX-12;x<=CX+3;x++){const j=y*W+x;if(S.ground[j]===0&&!S.obj[j]&&!S.floor[j]&&walk(j))free.push(j)}
    const pil=free.find(j=>free.includes(j+1)&&free.includes(j+2));S.obj[pil]='tspillar';const near=[pil+1,pil+2];const far=free.filter(j=>Math.hypot(j%W-pil%W,((j/W)|0)-((pil/W)|0))>TSPILR+2).slice(0,4);
    for(const j of near.concat(far))S.obj[j]='adobewall';window.__t={pil,near,far};
    return{r1,d:q.d,day:dayNo(),far:far.length,w:q.w}})()`);
  console.log(JSON.stringify(b1));assert.equal(b1.r1,false);assert.equal(b1.d,b1.day+3);assert.equal(b1.far,4);
  /* 前の日：知らせが、1回だけ */
  const c=await J(`(()=>{const q=S.ts.qk;S.t=(q.d-2)*1440+9*60;const r=[tsQuakeTick(),q.w===q.d,tsQuakeTick()];return{r,day:dayNo(),d:q.d}})()`);
  console.log(JSON.stringify(c));assert.deepEqual(c.r,[true,true,false]);assert.equal(c.day,c.d-1);
  /* その日の朝は、まだゆれない・昼にゆれる */
  const d=await J(`(()=>{const q=S.ts.qk,T=window.__t;S.t=(q.d-1)*1440+9*60;const r0=tsQuakeTick();const rocks0=0;window.__r0=new Set();for(let j=0;j<W*H;j++)if(S.obj[j]==='rock')window.__r0.add(j);S.t=(q.d-1)*1440+15*60;const r1=tsQuakeTick();
    return{r0,r1,nd:q.d,day:dayNo(),far:T.far.map(j=>S.obj[j]),near:T.near.map(j=>S.obj[j]),brk:S.broken.map(b=>b.id),rocks0}})()`);
  console.log(JSON.stringify(d));assert.equal(d.r0,false);assert.equal(d.r1,true);assert.equal(d.nd,d.day+5);
  assert.deepEqual(d.near,['adobewall','adobewall'],'柱のそばの壁は、のこる');assert.deepEqual(d.far,['','','',''],'遠い壁は、くずれる（4まい）');assert.deepEqual(d.brk,['adobewall','adobewall','adobewall','adobewall'],'建てなおしの一覧に入る');
  await page.waitForTimeout(1500);
  const e=await J(`(()=>{const T=window.__t;const L=[];for(let j=0;j<W*H;j++)if(S.obj[j]==='rock'&&!window.__r0.has(j))L.push(j);return{n:L.length,nearPil:L.some(j=>Math.hypot(j%W-T.pil%W,((j/W)|0)-((T.pil/W)|0))<=TSPILR),dec:T.far.every(j=>!!brokenAt(j))}})()`);
  console.log(JSON.stringify(e));assert.ok(e.dec,'くずれた壁は、直せる（brokenAt）');assert.ok(e.n>=1&&e.n<=3&&!e.nearPil,'岩は、柱のそばには落ちない');
  /* すぎてしまったら、あすに */
  const f=await J(`(()=>{const q=S.ts.qk;S.t=(q.d+2)*1440+9*60;const r=tsQuakeTick();return{r,ok:q.d===dayNo()+1}})()`);assert.equal(f.r,false);assert.ok(f.ok);
  /* 柱の絵が、エラーなく描ける */
  await run(`(()=>{const c=document.createElement('canvas').getContext('2d');tsDrawObj(c,'tspillar',0,0,window.__t.pil,performance.now());rebuildStatic(true);render(performance.now())})()`);
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
