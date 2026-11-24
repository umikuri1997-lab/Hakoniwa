/* あそんでいるせいれいの「仕事がある？」（hasWork）と、仕事をとる（goWork）の落とし物の決まりが同じ（dropWant）。
   仕事をとれなかったら、つぎにたしかめるまで WCHKNG 分待つ（道さがしを3分ごとにくりかえさない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=Math.floor(S.t/1440)*1440+10*60;`);
  /* 入る箱がない落とし物は、hasWork も「ない」と言う */
  const st=JSON.parse(await run(`(()=>{const r=S.res[0],x=r.x|0,y=r.y|0;const wet={};for(const k in S.dyn)if(S.dyn[k]&&'wet' in S.dyn[k]){wet[k]=S.dyn[k].wet;S.dyn[k].wet=99}/* 畑の水やりの仕事を、いっとき、なくす */
    const out={none:hasWork(r)};S.drops=[{id:'mat:wood',x:x+1,y,n:1}];const o=window.dropFits;
    window.dropFits=()=>false;out.noBox=hasWork(r);window.dropFits=()=>true;out.box=hasWork(r);window.dropFits=o;S.drops=[];for(const k in wet)S.dyn[k].wet=wet[k];return JSON.stringify(out)})()`));
  assert.equal(st.none,false,'no work to start with');
  assert.equal(st.noBox,false,'a drop with no box is not work for hasWork (goWork does not take it)');
  assert.equal(st.box,true,'a drop that fits is work');
  console.log('hasWork and goWork use the same rule for drops');
  /* 仕事をとれなかったら、つぎは WCHKNG 分待つ */
  const w=JSON.parse(await run(`(()=>{const r=S.res[0],h=window.hasWork,g=window.goWork;let n=0;window.hasWork=()=>true;window.goWork=()=>(n++,false);
    r.hunger=500;r.fun=100;r.act={type:'wander',rand:0};r.wchk=0;r.wchkW=0;for(let k=0;k<40;k++){if(!r.act||r.act.type!=='wander')r.act={type:'wander'};updRes(r,.5)}
    window.hasWork=h;window.goWork=g;return JSON.stringify({n,W:r.wchkW,NG:WCHKNG})})()`));
  assert.equal(w.W,w.NG,'after failing, the next check waits WCHKNG');
  assert.ok(w.n>=1&&w.n<=2,'20 game minutes: 1 or 2 tries, not every 3 minutes (got '+w.n+')');
  console.log('After failing to take work, the next check waits '+w.NG+' minutes');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
