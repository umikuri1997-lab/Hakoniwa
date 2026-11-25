/* 土のブロックの角（iso-cliff.js の icBlock）：だんごとに、角の形のチップ（iso:blk-<だん>:<nsew>[-<ななめ>]）をならべ、
   上の面は、その所の地面を、上の面のかたち（~top）で切って描く。どんなならびでも、チップのなまえが chips.js にある */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.t=1440+720;`);
  const r=JSON.parse(await run(`(()=>{
    /* 1. どんなならびでも、なまえのチップがある（5×5 のばらばらな高さを、いくつもためす） */
    let miss=new Set(),n=0;const rnd=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(7);
    for(let t=0;t<400;t++){const G=new Map();for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)G.set(x+','+y,(rnd()*4)|0);const hv=(x,y)=>G.get(x+','+y)||0,h=Math.max(1,hv(0,0));
      for(let L=1;L<=h;L++)for(const v of L===h?['g','d','k','v']:['m']){const k=icBlkKey(0,0,L,v,hv);n++;if(!CHIPS[k])miss.add(k);if(L===h&&!CHIPS[k+'~top'])miss.add(k+'~top')}
      for(const[k]of icFils(0,0,hv(0,0),hv)){n++;if(!CHIPS[k])miss.add(k)}}/* 入隅のまるいかべ（ひくいマスがかさねる） */
    /* 2. 1マスのブロックは、4つの向きとも外に出ている。L字の内がわの角は、ななめの印つき */
    const one=icBlkKey(0,0,1,'d',(x,y)=>x===0&&y===0?1:0);
    const L1=icBlkKey(0,0,1,'d',(x,y)=>(x===0&&y===0)||(x===1&&y===0)||(x===1&&y===1)?1:0);/* 東につづき、南東もうまっている：南の面の東のはしが内がわの角 */
    const fil=icFils(0,0,0,(x,y)=>(x<=0&&y<=0&&(x||y))?1:0).map(f=>f.join('@'));/* 北・西・北西が1だん：北西の角に入隅 */
    const film=icFils(0,0,0,(x,y)=>(x<=0&&y<=0&&(x||y))?(x&&y?1:2):0).map(f=>f.join('@'));/* 北・西が2だん：1だんめは上につづくので、まるみなし */
    /* 3. ゲームで描く：草原に 2×2 の台と2だんの柱。上の面のかたちの絵をとっておく */
    const ok=j=>!S.obj[j]&&!S.floor[j]&&!(S.ground[j]>=1);let p=null;
    for(let y=8;y<H-8&&!p;y++)for(let x=8;x<W-8&&!p;x++){let g=1;for(let b=0;b<3&&g;b++)for(let a=0;a<3;a++){const j=(y+b)*W+x+a;if(!ok(j)||hiAt(j)!==0)g=0}if(g)p=[x,y]}
    for(const[a,b,h]of[[0,0,1],[1,0,1],[0,1,1],[1,1,2]])S.hi[(p[1]+b)*W+p[0]+a]=h;recount();
    camAnim=null;cam.z=3;cam.x=(p[0]+1)*TS-VW/cam.z/2;cam.y=(p[1]+1)*TS-VH/cam.z/2;
    return JSON.stringify({miss:[...miss].slice(0,10),nm:miss.size,n,one,L1,fil,film,p,top:(p[1]+1)*W+p[0]+1})})()`));
  console.log(r);
  assert.equal(r.nm,0,'チップがないなまえ：'+r.miss.join(' '));
  assert.equal(r.one,'iso:blk-d:1111','1マスのブロックは、ぜんぶの向きが外');
  assert.equal(r.L1,'iso:blk-d:1101-010','東につづき南東がうまっている所は、内がわの角の印');
  assert.equal(r.fil.length,1,'L字の内がわの角に、入隅が1つ');assert.match(r.fil[0],/^iso:blkf-[gd]:nw-111@1$/,'入隅のなまえ（A・B・C とも、いちばん上）');
  assert.deepEqual(r.film,['iso:blkf-m:nw-000@1'],'B・C が上につづくだんは、まるみのない入隅');
  for(let i=0;i<20;i++){await page.evaluate(()=>{camAnim=null});await page.waitForTimeout(100)}
  const d=JSON.parse(await run(`(()=>{const e=ICT.c.values().next().value;return JSON.stringify({ict:ICT.c.size,w:e&&e.c.width})})()`));
  console.log(d);
  assert.ok(d.ict>0&&d.w>0,'上の面のかたちで切った地面を、マスごとにとっておいた');
  assert.deepEqual(errors,[],'エラーなし');
  console.log('OK iso-cliff');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
