/* 気持ちよさ・その4（juice4.js）
   - 朝：育った作物が、はねるならびに入る（育たなかった畑は入らない）
   - つり：魚がとびだす絵が出て、とまって、頭の上でおわる
   - かこい：さいごの柵を置いたときだけ光る（かこまれていない柵・もうかこまれていた所に置いた柵では光らない）
   - 朽ちた壁を直す・クモの巣をはらう：光・糸が出る
   - ★：家の住み心地の★がふえたら、★が出る
   - 新記録：きのうのいちばんをこえたら、1日に1回だけハンコ
   どれも、エラーが出ないこと */
const assert=require('node:assert/strict');
(async()=>{
  const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;true`);
  const W8=ms=>page.waitForTimeout(ms);
  /* 朝、いっせいに育つ */
  const g=JSON.parse(await run(`(()=>{const a=(CY+6)*W+CX+6,b=a+2;for(const j of[a,b]){S.obj[j]='farm';S.dyn[j]={g:50,crop:'mugi',sown:true,wet:0}}S.dyn[a].wet=1;
    juiceGrowSnap();S.dyn[a].g=70;juiceGrowWave();return JSON.stringify({n:J4GROW.length,j:J4GROW.map(q=>q.j),a,b})})()`));
  console.log('grow',JSON.stringify(g));assert.deepEqual(g.j,[g.a],'育った畑だけ');
  await W8(2900);assert.equal(+await run(`J4GROW.length`),0,'はねおわった');
  /* つり */
  const f=JSON.parse(await run(`(()=>{const r=S.res[0];juiceFish(r,'fish1'in FOODS?'fish1':Object.keys(FOODS).find(k=>FOODS[k].fish),-1);return JSON.stringify({n:J4FISH.length})})()`));
  console.log('fish',JSON.stringify(f));assert.equal(f.n,1);await W8(300);
  await run(`juice4Draw(performance.now());true`);await W8(800);await run(`juice4Draw(performance.now());true`);assert.equal(+await run(`J4FISH.length`),0,'魚はおわった');
  /* かこい：5×5の柵の輪。さいごの1つで光る */
  const fe=JSON.parse(await run(`(()=>{const x0=CX+14,y0=CY+14,L=[];for(let y=y0;y<y0+5;y++)for(let x=x0;x<x0+5;x++)if(y===y0||y===y0+4||x===x0||x===x0+4)L.push(y*W+x);
    for(const j of L){S.obj[j]=null}const last=L.splice(2,1)[0];/* 上の辺のまん中（角があいていても、上下左右では、もうかこまれている） */for(const j of L){S.obj[j]='fence';juiceFenceNote(j)}juiceFenceCheck(performance.now());const n0=J4FENCE.length;
    S.obj[last]='fence';juiceFenceNote(last);juiceFenceCheck(performance.now());const n1=J4FENCE.length;
    const mid=(y0+2)*W+x0+2;S.obj[mid]='fence';juiceFenceNote(mid);juiceFenceCheck(performance.now());const n2=J4FENCE.length;
    return JSON.stringify({n0,n1,n2,cells:J4FENCE[0]&&J4FENCE[0].cells.length})})()`));
  console.log('fence',JSON.stringify(fe));assert.equal(fe.n0,0,'まだあいている');assert.equal(fe.n1,1,'とじたとき');assert.equal(fe.n2,1,'中に置いても光らない');assert.equal(fe.cells,16,'かこいの柵ぜんぶ');
  /* 直す・クモの巣 */
  const m=JSON.parse(await run(`(()=>{const j=(CY+20)*W+CX;juiceMend(j,S.res[0]);juiceWeb(j,1);return JSON.stringify({m:J4MEND.length,t:J4THREAD.length})})()`));
  console.log('mend/web',JSON.stringify(m));assert.equal(m.m,1);assert.ok(m.t>0);
  for(let i=0;i<10;i++){await run(`juice4Draw(performance.now());true`);await W8(200)}
  assert.equal(+await run(`J4MEND.length+J4THREAD.length`),0,'消えた');
  /* ★：住み心地の★がふえたら */
  const s=JSON.parse(await run(`(()=>{J4ST=null;HOUSES=[{set:new Set([1,2]),inside:new Set([2]),x0:1,y0:1,x1:2,y1:1,ib:1}];const hc=houseComfort;let v=50;houseComfort=()=>({v});
    juiceStarTick(performance.now());const n0=J4STAR.length;v=130;J4ST.force=1;juiceStarTick(performance.now());const n1=J4STAR.length;J4ST.force=1;juiceStarTick(performance.now());const n2=J4STAR.length;houseComfort=hc;recount();return JSON.stringify({n0,n1,n2})})()`));
  console.log('star',JSON.stringify(s));assert.equal(s.n0,0,'はじめは出さない');assert.equal(s.n1,1,'ふえたら出る');assert.equal(s.n2,1,'かわらなければ出ない');
  /* 新記録 */
  const r=JSON.parse(await run(`(()=>{
    const box=document.querySelector('#toasts');box.replaceChildren();TOASTQ.length=0;
    S.jrec={d:callDay(),c:{},b:{hv:10},s:{}};
    const msg='きょうの'+J4RECN.hv+'が、いままででいちばん（11）';
    const stamps=()=>box.querySelectorAll('.ttx > .ustamp').length;
    juiceRec('hv',8);const a=stamps();
    toast('知らせ1');toast('知らせ2');
    juiceRec('hv',3);const queued=TOASTQ.some(it=>it.msg===msg&&it.stamp==='さいこう');
    box.firstElementChild.remove();toastNext();const b=stamps();
    juiceRec('hv',5);const c=stamps();
    toast(msg,'good','さいこう');
    const text=box.querySelector('.ttx:has(.ustamp)').textContent, merged=stamps();
    S.jrec.d=callDay()-1;juiceRec('hv',1);
    return JSON.stringify({a,b,c,queued,merged,text,msg,best:S.jrec.b.hv,now:S.jrec.c.hv});
  })()`));
  console.log('rec',JSON.stringify(r));assert.equal(r.a,0);assert.equal(r.queued,true);
  assert.equal(r.b,1,'新記録の文字に押す');assert.equal(r.c,1,'1日に1回');
  assert.equal(r.merged,1);assert.equal(r.text,r.msg+'（2）');
  assert.equal(r.best,16,'つぎの日に、いちばんになる');assert.equal(r.now,1);
  /* ふつうに動かしても、エラーが出ない */
  await W8(1500);
  console.log('errors',errors);assert.equal(errors.length,0);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
