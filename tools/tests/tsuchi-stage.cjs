/* 土のステージ（ひびわれた岩の谷）の土台：地われ（北のはしから南のはしへ・歩けない・橋をかけられない）・自然の岩の橋（東西がつながる）・北のがけのあなぐまの巣穴・3Dから写した地われ・橋のタイル・巣穴・表紙の絵・
   日干しれんがの家・土の物・はじまりの地ゆれ（トトが巣穴からころがり出て、会話）・目標1「神殿」・岩をほると砂岩 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const o=JSON.parse(await run(`(()=>{const M=riftM(),top=[...Array(W).keys()].some(x=>M[x]),bot=[...Array(W).keys()].some(x=>M[(H-1)*W+x]);
    const h=S.ts.hole,G=bfs(CX,CY+2),eastL=[];for(let y=CY-10;y<CY+10;y++)for(let x=tsRiftAt(y)+4;x<tsRiftAt(y)+8;x++){const j=y*W+x;if(walk(j))eastL.push(j)}
    const nWall=[];for(let y=CY-6;y<=CY-2;y++)for(let x=0;x<W;x++){const o=S.obj[y*W+x];if(o==='adobewall'||o==='itado'||o==='hwall'||o==='door')nWall.push(o)}
    return JSON.stringify({stage:STAGES.includes(TSUCHI),top,bot,riftWalk:[...M.keys()].filter(j=>M[j]).some(j=>walk(j)),bridgeNo:!canPlace('bridge',(CY+5)*W+tsRiftAt(CY+5)+1,true),
      water:[...M.keys()].filter(j=>M[j]).some(j=>waterJ(j)),east:eastL.some(j=>G.dist[j]>=0),hole:S.obj[h],holeCliff:hiAt(h-W)>hiAt(h),holeReach:[h+W,h-1,h+1].some(j=>G.dist[j]>=0),
      walls:[...new Set(nWall)].sort(),un:['adobewall','ishigaki','iwakagami'].every(k=>S.unlocked[k]),stg:[bpWall(),bpFence(),weedSt(),stg().sx,DYWRITER()],
      ok:['adobewall','rockwall','itado','ishigaki','sagafence','ishidoor','sagadoor','rockgate'].every(id=>stageItemOK(id)),house:HOUSES.length,
      rec:QUESTS[0]&&QUESTS[0].id,time:Math.floor(hour()),calm:!!S.flags.calmNight,swing:BL.swing.mat,tree:iname('deadtree'),tiles:(()=>{const L=tsRiftCells();return{n:L.length,b:L.filter(a=>a[2].startsWith('iso:riftb:')).length,miss:[...new Set(L.filter(a=>!CHIPS[a[2]]).map(a=>a[2]))]}})(),cover:!!CHIPS['cover:tsuchi'],ana:!!(CHIPS.anagura&&CHIPS.anagura.iso),noRm:(()=>{const x=h%W,y=(h/W)|0;removeAt(x,y);return S.obj[h]==='anagura'})()})})()`));
  console.log(JSON.stringify(o));
  assert.ok(o.stage,'STAGES');assert.ok(o.top&&o.bot,'地われは北のはしから南のはしへ');assert.ok(!o.riftWalk,'地われは歩けない');assert.ok(o.bridgeNo,'地われに橋はかけられない');assert.ok(!o.water,'地われは水ではない');
  assert.ok(o.east,'岩の橋で東へわたれる');assert.equal(o.hole,'anagura');assert.ok(o.holeCliff,'巣穴は、がけのふもと');assert.ok(o.holeReach,'巣穴まで歩いて行ける');
  assert.deepEqual(o.walls,['adobewall','itado']);assert.ok(o.un,'はじめからおぼえている');assert.deepEqual(o.stg,['adobewall','ishigaki',2,'~t','トト']);assert.ok(o.ok,'土の物を作れる');assert.ok(o.house>=1,'はじめの家');
  assert.equal(o.rec,'statue');assert.equal(o.time,16);assert.ok(o.calm,'夜のコワイノはまだ来ない');assert.deepEqual(o.swing,{wood:12,iwakusa:4});assert.equal(o.tree,'オリーブ');assert.ok(o.noRm,'巣穴はこわせない');
  assert.deepEqual(o.tiles.miss,[],'地われ・橋のタイルが、ぜんぶある');assert.equal(o.tiles.b,6,'岩の橋は3列×2行');assert.ok(o.tiles.n>200,'地われのタイル');assert.ok(o.cover,'表紙の景色');assert.ok(o.ana,'巣穴の3Dの絵');
  /* はじまりの地ゆれ：トトが巣穴からころがり出て、会話 */
  const t=JSON.parse(await run(`(()=>{const t=S.res.find(r=>r.name===TOTO),h=S.ts.hole;let done=0;tsIntro(()=>{done=1});return new Promise(res=>{const y0=t.y;setTimeout(()=>res(JSON.stringify({done,dy:t.y-(((h/W)|0)+.5),gift:GIFT_ACTIVE})),5200)})})()`));
  console.log(JSON.stringify(t));assert.equal(t.done,1,'会話へ');assert.ok(t.dy>2,'巣穴からころがり出た');assert.equal(t.gift,false);
  /* 岩をほると砂岩 */
  const m=JSON.parse(await run(`(()=>{const r=S.res.find(q=>q.name===TOTO);r.cmat={};const j=S.obj.findIndex(o=>o==='rock');const a={obj:j,tgt:'rock',type:'mine'};ACT.mine.end(r,a);return JSON.stringify(r.cmat)})()`));
  console.log(JSON.stringify(m));assert.ok(m.sagan>=1,'砂岩');
  await page.waitForTimeout(300);assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
