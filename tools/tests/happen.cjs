/* ときどき起きるできごと（happen.js）：朝にきまる・大きなかぶをみんなでぬく・ヒナを木へとどけて親鳥のお礼・きんいろの実・きのこの輪でおどる・18時（17時）におわる */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const out={};
    const day=h=>{S.t=Math.floor(S.t/1440)*1440+1440+h*60};const at=h=>{S.t=Math.floor(S.t/1440)*1440+h*60};
    day(7);recount();S.enemies=[];S.enemyOn=false;for(const q of S.res){q.hunger=hMax(q);q.fun=90;q.energy=100}
    const run=(n,dt)=>{for(const q of S.res)q.stT=S.t;for(let i=0;i<n;i++){stepWorld(dt||.5);if(S.hap&&S.hap.ph==='end')break}};
    /* 植えた木を1本（なければ） */if(!S.obj.some(o=>o==='tree'||o==='fruit')){const G0=hapG();const j=S.obj.findIndex((o,j)=>!o&&VILL[j]&&walk(j)&&G0.dist[j]>=0&&!S.obj[j+1]&&walk(j+1)&&G0.dist[j+1]>=0&&!S.obj[j-W]);S.obj[j]='tree';recount()}
    /* 朝：何日かで1つは出る */let seen={};for(let k=0;k<40;k++){day(6);hapMorning();if(S.hap)seen[S.hap.k]=1}out.seen=Object.keys(seen).sort();
    /* 大きなかぶ */day(7);let fj=S.obj.findIndex((o,j)=>o==='farm');if(fj<0){fj=S.obj.findIndex((o,j)=>!o&&VILL[j]&&walk(j));S.obj[fj]='farm'}S.dyn[fj]={g:100,sown:true,crop:'imo'};recount();
    S.hap={d:dayNo(),k:'kabu',j:fj,ph:'wait',tk:0,crop:'imo'};out.block=hapBlock(fj);out.tap=hapTap(fj%W,(fj/W)|0)&&S.hap.tk===1;
    const f0=S.food+S.res.reduce((a,q)=>a+carryN(q),0);for(const q of S.res)endAct(q),q.act=null;run(2400);out.kabu=S.hap.ph;out.farm=S.dyn[fj].g;
    out.kabuFood=S.res.reduce((a,q)=>a+((q.carry||{}).imo||0),0)+(S.drops||[]).filter(d=>d.id==='food:imo').reduce((a,d)=>a+d.n,0)+(S.fs.imo||0);
    /* 18時にもどる */at(7);S.dyn[fj]={g:100,sown:true,crop:'imo'};S.hap={d:dayNo(),k:'kabu',j:fj,ph:'wait',tk:0,crop:'imo'};at(18.2);hapTick();out.kabu18=S.hap.ph;
    /* ヒナ */at(7);const G=hapG();let hj=-1,tj=-1;for(let j=0;j<W*H&&hj<0;j++){if(!VILL[j]||S.obj[j]||S.floor[j]||S.ground[j]||!walk(j)||G.dist[j]<0)continue;const t=hapNest(G,j);if(t>=0){hj=j;tj=t}}
    if(hj<0){for(let j=0;j<W*H&&hj<0;j++)if(VILL[j]&&!S.obj[j]&&walk(j)&&G.dist[j]>=0&&!S.obj[j+3]&&G.dist[j+4]>=0){S.obj[j+3]='tree';recount();hj=j;tj=hapNest(hapG(),j)}}
    S.drops=[];S.hap={d:dayNo(),k:'hina',j:hj,tj,ph:'wait',tk:0};out.hTap=hapTap(hj%W,(hj/W)|0);for(const q of S.res)endAct(q),q.act=null;{const q=S.res.find(q=>q.elem!=='earth')||S.res[0];S.food=Math.max(S.food,foodLow()+5);const T0=tryJob;tryJob=(r2,G2,k)=>k==='build'||k==='plant'?(r2.act={type:'busy'},true):T0(r2,G2,k);goWork(q,hapG());tryJob=T0;out.hFirst=q.act&&q.act.type;if(q.act&&q.act.type!=='busy')endAct(q);q.act=null}/* 建てる・植える仕事があっても（いそがしい村）、たのんだヒナを先に */
    for(let i=0;i<3000&&S.hap.ph!=='nest';i++)stepWorld(.5);out.hina=S.hap.ph;at(17.1);hapTick();out.par=S.hap.ph;HAPFX.t0-=3000;hapTick();out.hEnd=S.hap.ph;out.hDrop=S.drops.filter(d=>d.id==='food:berry').reduce((a,d)=>a+d.n,0);out.hSeed=S.drops.filter(d=>FLOWERS2.includes(d.id)).length;
    at(7);S.hap={d:dayNo(),k:'hina',j:hj,tj,ph:'wait',tk:0};at(18.1);hapTick();out.hBye=S.hap.ph+':'+(HAPFX&&HAPFX.k);{const F=HAPFX,n0=performance.now(),cnt=t=>{F.t0=n0-t;const D=[];hapDraw((k,t2,bb,d)=>D.push(d),()=>true,ctx,n0);D.forEach(f=>f());return D.length};out.byeIn=cnt(1000);out.byeOut=cnt(HAPBYEIN+1000);HAPFX=F;F.t0=n0-(HAPBYEIN+HAPBYEOUT+700);hapDraw(()=>{},()=>true,ctx,n0);out.byeGone=HAPFX===null}/* 帰るとき：とんで来る（地面のヒナと親鳥）・つれて行く（いっしょ）・おわると消える */
    /* きんいろの木 */at(7);let tr=S.obj.findIndex((o,j)=>(o==='tree'||o==='fruit')&&hapStands(hapG(),j).length);out.tree=tr>=0;
    if(tr>=0){S.drops=[];S.hap={d:dayNo(),k:'kin',j:tr,ph:'wait',tk:0};out.kTap=hapTap(tr%W,(tr/W)|0);for(const q of S.res)endAct(q),q.act=null;run(3000);out.kin=S.hap.ph;
      out.apple=S.res.reduce((a,q)=>a+((q.carry||{}).apple||0),0)+S.drops.filter(d=>d.id==='food:apple').reduce((a,d)=>a+d.n,0);
      at(7);S.hap={d:dayNo(),k:'kin',j:tr,ph:'wait',tk:0};hapGoldOn(ctx,0,0,tr,performance.now());at(18.2);hapTick();out.kin18=S.hap.ph+':'+(HAPFX&&HAPFX.k)}
    /* きのこの輪 */day(9);S.wetD=dayNo();{const G1=hapG();for(let j=0;j<W*H;j++)if(G1.dist[j]>=0&&!VILL[j])REV.add(j)}const L=hapRingSpots(hapG());out.ring=L.length>0;
    if(L.length){S.drops=[];S.hap={d:dayNo(),k:'kino',j:L[0],ph:'on',tk:0,dn:{}};const q=S.res[0];endAct(q);q.act=null;q.carry={};q.cmat={};q.citem={};let ok=false;for(let i=0;i<50&&!ok;i++)ok=hapDance(q,bfs(q.x|0,q.y|0));out.dance=ok&&q.act.type;
      const f1=q.fun=50;q.stT=S.t;/* 時刻をとばしたので、10分うごかない判定をもどす */for(let i=0;i<3000&&q.act&&q.act.type==='hdance';i++)stepWorld(.5);out.danced=!!S.hap.dn[q.id];out.fun=q.fun>f1;out.again=hapDance(q,bfs(q.x|0,q.y|0));
      at(17.1);hapTick();out.kino=S.hap.ph;out.kDrop=S.drops.filter(d=>d.id==='food:kinoko').length}
    /* 絵 */const D=[];S.hap={d:dayNo(),k:'kabu',j:fj,ph:'wait',tk:0,crop:'imo'};at(9);hapDraw((k,t,b,d)=>D.push(d),()=>true,ctx,performance.now());D.forEach(f=>f());out.draw=D.length;
    /* 夜は出ない・思い出帳の再生では出ない */S.hap=null;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.ok(r.seen.length>=2&&r.seen.includes('kin'),'朝に、いくつかのできごとが出る');
  assert.equal(r.block,true,'大きなかぶの畑は、ふつうに収穫しない');assert.equal(r.tap,true);assert.equal(r.kabu,'end','みんなでぬいた');assert.equal(r.farm,0);assert.ok(r.kabuFood>=8,'収穫8こ');assert.equal(r.kabu18,'end','18時にもどる');
  assert.equal(r.hTap,true);assert.equal(r.hFirst,'hhina','建てる・植えるより先に、ヒナをむかえに行く');assert.equal(r.byeIn,2,'とんで来るあいだは、地面のヒナと親鳥');assert.equal(r.byeOut,1);assert.equal(r.byeGone,true);assert.equal(r.hina,'nest','木へとどけた');assert.equal(r.par,'par','17時に親鳥');assert.equal(r.hEnd,'end');assert.equal(r.hDrop,3,'ベリー3こ');assert.equal(r.hSeed,1,'花のたね1つ');assert.equal(r.hBye,'end:bye','18時に親鳥がつれていく');
  assert.equal(r.tree,true);assert.equal(r.kTap,true);assert.equal(r.kin,'end');assert.ok(r.apple>=5,'りんご5こ');assert.equal(r.kin18,'end:fall');
  assert.equal(r.ring,true);assert.equal(r.dance,'hdance');assert.equal(r.danced,true);assert.equal(r.fun,true);assert.equal(r.again,false,'1人1回');assert.equal(r.kino,'end');assert.equal(r.kDrop,3,'きのこ3こ');
  assert.ok(r.draw>=1);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
