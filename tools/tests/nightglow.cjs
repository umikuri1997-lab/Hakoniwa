/* 夜のたからさがし（nightglow.js）：ふつうの夜だけ、村の外に光るつぶ・オオカゲの夜は出ない・タップでたのむ・たたかうせいれいがひろう・箱にしまうと「夜のたからもの」・昼だけあける・朝に消える */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const out={};
    const night=()=>{S.t=Math.floor(S.t/1440)*1440+1440+23*60+10};night();recount();S.enemies=[];const keep=S.res.map(q=>q.elem);
    /* 火のせいれいがいなければ出ない */for(const q of S.res)q.elem='water';S.ng=null;spawnWave(['basic']);out.noFire=S.ng;S.enemies=[];S.res[0].elem='fire';
    /* ふつうの夜 */S.ng=null;spawnWave(['basic','basic']);const L=S.ng.L;out.n=L.length;out.out=L.every(g=>!VILL[g.y*W+g.x]);const G=bfs(S.res[0].x|0,S.res[0].y|0);out.reach=L.every(g=>G.dist[g.y*W+g.x]>=0);out.tiers=L.map(g=>g.t);
    out.again=(spawnWave(['basic']),S.ng.L.length===L.length);
    /* オオカゲの夜は出ない */S.ng=null;S.enemies=[];spawnWave(['boss']);out.boss=S.ng;
    /* タップ */S.ng=null;S.enemies=[];spawnWave(['basic','basic']);const g=S.ng.L[0],j=g.y*W+g.x;
    for(const q of S.res)q.elem='water';for(const q of S.res)q.sortie=false;out.noOne=(ngTap(g.x,g.y),!!g.tk);
    const f=S.res[0];f.elem='fire';f.sortie=true;f.hunger=hMax(f);out.tap=ngTap(g.x,g.y)&&!!g.tk;out.tapFar=ngTap(0,0);
    /* ひろいに行く */for(const e of S.enemies){e.spawned=false;e.delay=9999}const G2=bfs(f.x|0,f.y|0);out.job=ngJob(f,G2)&&f.act&&f.act.type;
    f.citem={};out.box=itemBoxOK();ACT.ngget.end(f,{obj:j,t:NGT});out.left=S.ng.L.length;out.carry=(f.citem||{})['ng'+g.t]||0;if(out.carry)stowItem('ng'+g.t,1,f);out.inv=S['ng'+g.t]||0;
    /* 夜はあけない */ngOpen('ng'+g.t);out.nightOpen=S['ng'+g.t];
    /* 朝6時：のこりは消える */S.t=Math.floor(S.t/1440)*1440+1440+6*60+5;ngTick();out.morning=S.ng.L.length;
    /* 昼はあける */ngOpen('ng'+g.t);out.dayOpen=S['ng'+g.t];out.pop=!!document.querySelector('.pxcard .st');
    for(let k=0;k<3;k++){const x=ngRoll(k);out['roll'+k]=x[0]}
    /* 絵 */S.ng={d:dayNo(),L:[{x:10,y:10,t:2,tk:1}]};ngDraw(performance.now());out.icon=!!ICONS.ng2&&itemIc('ng2')==='ic:ng2';
    S.res.forEach((q,i)=>q.elem=keep[i]);return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.noFire,null,'火のせいれいがいなければ出ない');assert.ok(r.n>=2&&r.n<=3,'2〜3こ');assert.equal(r.out,true,'村の外');assert.equal(r.reach,true,'歩いて行ける');assert.ok(r.tiers.includes(0)&&r.tiers.includes(1));assert.equal(r.again,true,'1晩に1回');
  assert.equal(r.boss,null,'オオカゲの夜は出ない');
  assert.equal(r.noOne,false,'たたかうせいれいがいなければ、たのめない');assert.equal(r.tap,true);assert.equal(r.tapFar,false);
  assert.equal(r.job,'ngget');assert.equal(r.left,r.n-1);assert.equal(r.carry,r.box?1:0,'箱があれば、頭の上につむ');assert.equal(r.inv,1);
  assert.equal(r.nightOpen,1,'夜はあけない');assert.equal(r.morning,0,'朝に消える');assert.equal(r.dayOpen,0);assert.equal(r.pop,true);
  assert.equal(r.roll0.startsWith('mat:'),true);assert.ok(r.roll1==='mapPc'||r.roll1.startsWith('gf_'));assert.equal(r.roll2,'fukuro');assert.equal(r.icon,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
