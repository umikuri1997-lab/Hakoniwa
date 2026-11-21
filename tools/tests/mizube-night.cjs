/* 水のステージの夜：神殿を直すと、夜にコワイノが来る（南のはしから）。オオカゲは来ない。水の流れる水路（堀）は、コワイノがゆっくりしか渡れない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:3});
  const r=JSON.parse(await run(`(()=>{const o={};document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;
    o.before=!!S.enemyOn;const g=QUESTS.find(q=>q.id==='statue').gives;o.gives=!!(g&&g.enemy);S.enemyOn=true;S.nights=3;
    let boss=false;for(let d=3;d<40;d++){if(waveFor(d).includes('boss'))boss=true}o.boss=boss;
    S.t=1440*2+22.9*60;let seen=0,south=0;for(let i=0;i<4000&&seen<1;i++){stepWorld(.5);for(const e of S.enemies)if(e.spawned&&!e.sp0){e.sp0=1;seen++;if((e.y|0)>=H-3||fogAt((e.y|0)*W+(e.x|0)+W))south++}if(hour()>=4&&hour()<6)break}o.seen=seen;
    /* 堀：水のとどいた水路のマスでは、歩く速さが MZMOAT 倍 */const k=Object.keys(S.mz.cn)[0];let j=k!=null?+k:null;if(j==null||!MZC.wet[j]){j=null;for(const q in S.mz.cn)if(MZC.wet[+q]){j=+q;break}}
    if(j==null){const g0=S.mz.gates[0];g0.open=1;const y=(g0.j/W|0)+1;for(let x=g0.j%W-1;x<=g0.j%W+1;x++)S.mz.cn[y*W+x]=1;S.mz.cn[g0.j+W]=1;recount();for(const q in S.mz.cn)if(MZC.wet[+q]){j=+q;break}}
    o.moat=j!=null&&mzMoat(j);o.dry=!mzMoat(0);
    save();continueGame(load(3));o.reload=!!S.enemyOn;return JSON.stringify(o)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.gives,true,'神殿を直すと、コワイノが来るようになる');assert.equal(r.boss,false,'オオカゲは来ない');assert.ok(r.seen>0,'夜にコワイノが来る');
  assert.equal(r.moat,true,'水の流れる水路は堀');assert.equal(r.dry,true);assert.equal(r.reload,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
