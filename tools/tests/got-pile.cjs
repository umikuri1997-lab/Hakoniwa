/* 運んだ素材の見せ方：依頼をはると、依頼ボードのそばに作業台（o.cs、S.obj 'wbench'）。素材は作業台の上に積む・作る子は作業台の前に立つ・できたら作業台はかたづく・依頼の紙に「木材（2/5）」。足場にも素材の山・タップの知らせに数。依頼をやめたら、運んだ分は作る場所に落とす */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const st=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;
    const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;
    if(BOARD<0){const free=(x,y,w,h)=>{for(let b=0;b<h;b++)for(let c=0;c<w;c++){const k=(y+b)*W+x+c;if(S.obj[k]||S.ground[k]||hiAt(k)||(S.fog&&S.fog[k]))return false}return true};let p=null;for(let y=CY-12;y<CY+20&&!p;y++)for(let x=CX-14;x<CX+14;x++)if(free(x,y,8,6)){p=[x,y];break}const j=p[1]*W+p[0];S.obj[j]='statue';S.obj[j+2]='board';S.obj[j+3]='part';S.ref[j+3]=j+2;S.obj[j+W*4+6]='crate';recount()}
    for(const k of Object.keys(S.mat))S.mat[k]=0;S.mat.wood=40;S.mat.stone=20;boxSync();S.pt=999;S.recipes.chair=1;S.unlocked.chair=1;S.lv=Math.max(S.lv||1,5);
    return JSON.stringify({board:BOARD,need:BL.chair.mat,room:roomN(a)})})()`));
  console.log(JSON.stringify(st));assert.ok(st.board>=0);
  await run(`orderFurn('chair');1`);
  const wb=JSON.parse(await run(`(()=>{const o=S.orders[0];return JSON.stringify({cs:o.cs,obj:S.obj[o.cs],dyn:S.dyn[o.cs],walk:walk(o.cs),front:walk(o.cs+W)})})()`));
  console.log(JSON.stringify(wb));assert.equal(wb.obj,'wbench','依頼をはると作業台が出る');assert.equal(wb.walk,false);assert.equal(wb.front,true);
  /* 運ぶとちゅう：作る場所がきまり、運んだ数がふえる */
  const mid=JSON.parse(await run(`(()=>{const a=S.res[0],o=S.orders[0];let n=0;for(;n<20000;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;const g=gotList(o);if(g.some(e=>e[1]>0)&&g.some(e=>e[1]<e[2]))break}
    return JSON.stringify({n,cs:o.cs,txt:gotTxt(o),act:a.act&&a.act.type})})()`));
  console.log(JSON.stringify(mid));assert.equal(mid.cs,wb.cs,'作業台で作る');assert.ok(mid.txt.length>0);
  await run(`openSheet('craft');1`);
  const paper=await page.evaluate(()=>[...document.querySelectorAll('.paper .gm')].map(e=>e.textContent));
  console.log(paper);assert.deepEqual(paper,mid.txt,'依頼の紙に運んだ数');
  await run(`closeSheet();1`);
  /* 絵：作る場所のまわりを大きくして写す */
  await run(`(()=>{const o=S.orders[0];cam.z=3;cam.x=(o.cs%W+.5)*TS-VW/cam.z/2;cam.y=((o.cs/W|0)+.5)*TS-VH/cam.z/2;USERPAUSE=true;return 1})()`);
  await page.waitForTimeout(600);if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/craft-pile.png'});
  /* つづきを運んで、作るところ：作る場所はかわらない */
  const fin=JSON.parse(await run(`(()=>{const a=S.res[0],o=S.orders[0],cs=o.cs;let n=0,moved=false;for(;n<40000&&S.orders.length;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(S.orders[0]&&S.orders[0].cs!==cs)moved=true}return JSON.stringify({n,left:S.orders.length,moved,bench:S.obj[cs]})})()`));
  console.log(JSON.stringify(fin));assert.equal(fin.bench,'','できたら作業台はかたづく');assert.equal(fin.left,0);assert.equal(fin.moved,false,'作る場所はかわらない');
  /* やめたら、運んだ分は作る場所に落とす */
  await run(`orderFurn('chair');1`);
  const cx=JSON.parse(await run(`(()=>{const a=S.res[0],o=S.orders[0];for(let n=0;n<20000;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(gotList(o).some(e=>e[1]>0))break}const cs=o.cs,g=JSON.stringify(o.got);cancelOrder(o.id);const d=(S.drops||[]).filter(q=>q.y*W+q.x===cs||Math.abs(q.x-cs%W)<=1&&Math.abs(q.y-(cs/W|0))<=1);return JSON.stringify({cs,g,bench:S.obj[cs],drops:d.map(q=>q.id+':'+q.n)})})()`));
  console.log(JSON.stringify(cx));assert.ok(cx.drops.length>0,'作業台のところに落とす');assert.equal(cx.bench,'','やめたら作業台はかたづく');
  /* 読みこみ：依頼のない作業台はかたづく・作業台のない依頼には出す */
  const fx=JSON.parse(await run(`(()=>{orderFurn('chair');const o=S.orders[0],cs=o.cs;S.obj[cs]='';delete S.dyn[cs];o.cs=null;const k=cs+2;S.obj[k]='wbench';S.dyn[k]={order:999};wbenchFix();const r={has:S.obj[o.cs]==='wbench',stray:S.obj[k]};cancelOrder(o.id);return JSON.stringify(r)})()`));
  console.log(JSON.stringify(fx));assert.equal(fx.has,true);assert.equal(fx.stray,'');
  /* 足場 */
  const site=JSON.parse(await run(`(()=>{const a=S.res[0];const free=j=>!S.obj[j]&&!S.ground[j]&&!hiAt(j)&&walk(j);let j=-1;for(let y=(a.y|0)+2;y<(a.y|0)+10&&j<0;y++)for(let x=(a.x|0)-4;x<(a.x|0)+4;x++){const k=y*W+x;if(free(k)&&free(k+1)){j=k;break}}
    rsvAdd({wood:6});S.obj[j]='site';S.dyn[j]={build:'watch',p:0,need:BL.watch.time,mat:{wood:6},got:{}};for(let n=0;n<20000;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;const g=gotList(S.dyn[j]);if(g[0][1]>0&&g[0][1]<6)break}
    const t=[];const o=toast;toast=(m)=>t.push(m);onTap&&0;toast=o;return JSON.stringify({j,txt:gotTxt(S.dyn[j])})})()`));
  console.log(JSON.stringify(site));assert.ok(/木材（[1-5]\/6）/.test(site.txt[0]));
  await run(`(()=>{const j=${site.j};cam.z=3;cam.x=(j%W+.5)*TS-VW/cam.z/2;cam.y=((j/W|0)+.5)*TS-VH/cam.z/2;return 1})()`);
  await page.waitForTimeout(600);if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/site-pile.png'});
  assert.deepEqual(errors,[],'エラーなし');console.log('ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
