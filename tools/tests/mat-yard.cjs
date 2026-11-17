/* 運んだ素材の見せ方：依頼は、置いた作業台（o.cs、S.obj 'wbench'）で作る。そのとなりに材料置き場（'matyard'、S.dyn[j].yt）。せいれいは素材を置き場へ運び（ydrop）、置き場の絵は運んだわりあいで #0〜#3。できたら置き場はかたづく（作業台はのこる）・依頼の紙に「木材（2/5）」。足場・設計図にも置き場。依頼をやめたら、運んだ分は置き場のところに落とす */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};window.DROPLOG=[];{const e=ACT.ydrop.end;ACT.ydrop.end=(r,a)=>{DROPLOG.push(a.obj);if(Math.abs(r.x-(a.obj%W+.5))+Math.abs(r.y-((a.obj/W|0)+.5))>1.6)DROPLOG.push(-1);return e(r,a)}}true`);
  const st=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;
    const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;
    if(BOARD<0){const free=(x,y,w,h)=>{for(let b=0;b<h;b++)for(let c=0;c<w;c++){const k=(y+b)*W+x+c;if(S.obj[k]||S.ground[k]||hiAt(k)||(S.fog&&S.fog[k]))return false}return true};let p=null;for(let y=CY-12;y<CY+20&&!p;y++)for(let x=CX-14;x<CX+14;x++)if(free(x,y,8,6)){p=[x,y];break}const j=p[1]*W+p[0];S.obj[j]='statue';S.obj[j+2]='board';S.obj[j+3]='part';S.ref[j+3]=j+2;S.obj[j+W*4+6]='crate';recount()}
    for(const k of Object.keys(S.mat))S.mat[k]=0;S.mat.wood=40;S.mat.stone=20;boxSync();S.pt=999;S.recipes.chair=1;S.unlocked.chair=1;S.lv=Math.max(S.lv||1,5);
    {const G=bfs(a.x|0,a.y|0);for(let d=2;d<7;d++){const j=BOARD+d*W;if(!S.obj[j]&&walk(j)&&G.dist[j]>=0&&walk(j+W)&&!benchBoxes(j).length){S.obj[j]='wbench';window.WB=j;break}}recount()}/* となりに箱のない作業台（素材を運ぶ） */
    return JSON.stringify({board:BOARD,need:BL.chair.mat,room:roomN(a)})})()`));
  console.log(JSON.stringify(st));assert.ok(st.board>=0);
  await run(`orderFurn('chair');1`);
  const wb=JSON.parse(await run(`(()=>{const o=S.orders[0];return JSON.stringify({cs:o.cs,wb:WB,obj:S.obj[o.cs],dyn:S.dyn[o.cs],walk:walk(o.cs),front:walk(o.cs+W)})})()`));
  console.log(JSON.stringify(wb));assert.equal(wb.obj,'wbench');assert.equal(wb.cs,wb.wb,'依頼は作業台にわりあてる');assert.equal(wb.walk,false);assert.equal(wb.front,true);
  const yd=JSON.parse(await run(`(()=>{yardTick();const o=S.orders[0],y=yardAt('o'+o.id),dx=Math.abs(y%W-o.cs%W),dy=Math.abs((y/W|0)-(o.cs/W|0));return JSON.stringify({y,obj:S.obj[y],near:Math.max(dx,dy),st:yardStage('o'+o.id),stand:wbenchStand(o.cs,bfs(S.res[0].x|0,S.res[0].y|0))})})()`));
  console.log(JSON.stringify(yd));assert.equal(yd.obj,'matyard','作業台のとなりに材料置き場');assert.ok(yd.near<=2);assert.equal(yd.st,0,'はじめは空');assert.ok(yd.stand>=0,'作業台の横に立つ所がのこる');
  /* 運ぶとちゅう：作る場所がきまり、運んだ数がふえる */
  const mid=JSON.parse(await run(`(()=>{const a=S.res[0],o=S.orders[0];let n=0;for(;n<20000;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;const g=gotList(o);if(g.some(e=>e[1]>0)&&g.some(e=>e[1]<e[2]))break}
    return JSON.stringify({n,cs:o.cs,txt:gotTxt(o),act:a.act&&a.act.type,st:yardStage('o'+o.id),drops:DROPLOG})})()`));
  console.log(JSON.stringify(mid));assert.equal(mid.cs,wb.cs,'作業台で作る');assert.ok(mid.txt.length>0);assert.ok(mid.st===1||mid.st===2,'とちゅうは少し・半分の絵');assert.ok(mid.drops.length>0&&mid.drops.every(j=>j===yd.y),'素材は置き場に置く（置き場のとなりで）');
  await run(`openSheet('craft');1`);
  const paper=await page.evaluate(()=>[...document.querySelectorAll('.paper .gm')].map(e=>e.textContent));
  console.log(paper);assert.deepEqual(paper,mid.txt,'依頼の紙に運んだ数');
  await run(`closeSheet();1`);
  /* 絵：作る場所のまわりを大きくして写す */
  await run(`(()=>{const o=S.orders[0];cam.z=3;cam.x=(o.cs%W+.5)*TS-VW/cam.z/2;cam.y=((o.cs/W|0)+.5)*TS-VH/cam.z/2;USERPAUSE=true;return 1})()`);
  await page.waitForTimeout(600);if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/craft-pile.png'});
  /* つづきを運んで、作るところ：作る場所はかわらない */
  const fin=JSON.parse(await run(`(()=>{const a=S.res[0],o=S.orders[0],cs=o.cs;let n=0,moved=false;for(;n<40000&&S.orders.length;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(S.orders[0]&&S.orders[0].cs!==cs)moved=true}return JSON.stringify({n,left:S.orders.length,moved,bench:S.obj[cs]})})()`));
  console.log(JSON.stringify(fin));assert.equal(fin.bench,'wbench','できても作業台はのこる');await run(`yardTick();1`);assert.equal(await run(`S.obj[${yd.y}]`),'','できたら置き場もかたづく');assert.equal(fin.left,0);assert.equal(fin.moved,false,'作る場所はかわらない');
  /* やめたら、運んだ分は作る場所に落とす */
  await run(`orderFurn('chair');1`);
  const cx=JSON.parse(await run(`(()=>{const a=S.res[0],o=S.orders[0];for(let n=0;n<20000;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(gotList(o).some(e=>e[1]>0))break}const cs=o.cs,y=yardAt('o'+o.id),g=JSON.stringify(o.got);cancelOrder(o.id);yardTick();const d=(S.drops||[]).filter(q=>Math.abs(q.x-y%W)<=1&&Math.abs(q.y-(y/W|0))<=1);return JSON.stringify({cs,y,g,bench:S.obj[cs],yard:S.obj[y],drops:d.map(q=>q.id+':'+q.n)})})()`));
  console.log(JSON.stringify(cx));assert.ok(cx.drops.length>0,'置き場のところに落とす');assert.equal(cx.yard,'','やめたら置き場もかたづく');assert.equal(cx.bench,'wbench','やめても作業台はのこる');
  /* 前のセーブの読みこみ：依頼のない作業台はかたづく・依頼のある作業台はのこる */
  const fx=JSON.parse(await run(`(()=>{orderFurn('chair');const o=S.orders[0],cs=o.cs;const k=cs+2;S.obj[k]='wbench';S.dyn[k]={order:999};delete S.flags.wbFurn1;wbenchFix();const r={has:S.obj[o.cs]==='wbench',stray:S.obj[k]};cancelOrder(o.id);return JSON.stringify(r)})()`));
  console.log(JSON.stringify(fx));assert.equal(fx.has,true);assert.equal(fx.stray,'');
  /* 足場 */
  const site=JSON.parse(await run(`(()=>{const a=S.res[0];const free=j=>!S.obj[j]&&!S.ground[j]&&!hiAt(j)&&walk(j);let j=-1;for(let y=(a.y|0)+2;y<(a.y|0)+10&&j<0;y++)for(let x=(a.x|0)-4;x<(a.x|0)+4;x++){const k=y*W+x;if(free(k)&&free(k+1)&&free(k+W)&&free(k+W+1)){j=k;break}}
    rsvAdd({wood:6});S.obj[j]='site';S.dyn[j]={build:'watch',p:0,need:BL.watch.time,mat:{wood:6},got:{}};for(const k of[j+1,j+W,j+W+1]){S.obj[k]='site2';S.ref[k]=j}/* 見張り台は2×2 */for(let n=0;n<20000;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;const g=gotList(S.dyn[j]);if(g[0][1]>0&&g[0][1]<6)break}
    const y=yardAt('s'+j);return JSON.stringify({j,y,obj:S.obj[y],st:yardStage('s'+j),txt:gotTxt(S.dyn[j]),ytxt:yardTxt('s'+j)})})()`));
  console.log(JSON.stringify(site));assert.ok(/木材（[1-5]\/6）/.test(site.txt[0]));assert.equal(site.obj,'matyard','足場のとなりに置き場');{const W=await run('W');assert.ok(![site.j,site.j+1,site.j+W,site.j+W+1].includes(site.y),'足場の中には置かない')}assert.ok(site.st>=1);assert.equal(site.ytxt,site.txt[0]);
  await run(`(()=>{const j=${site.j};cam.z=3;cam.x=(j%W+.5)*TS-VW/cam.z/2;cam.y=((j/W|0)+.5)*TS-VH/cam.z/2;return 1})()`);
  await page.waitForTimeout(600);if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/site-pile.png'});
  assert.deepEqual(errors,[],'エラーなし');console.log('ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
