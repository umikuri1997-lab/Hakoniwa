/* 見張り台どうしは、あいだを5マスあけないと置けない（建てている途中の物・ひっこしミトンも同じ） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;USERPAUSE=true;
    const f=S.res[0],x0=(f.x|0)+10,y0=(f.y|0)+6,clr=()=>{for(let b=-12;b<14;b++)for(let a=-12;a<14;a++){const k=(y0+b)*W+x0+a;S.obj[k]='';S.ground[k]=0;S.hi[k]=0;S.floor[k]='';delete S.ref[k];delete S.dyn[k]}};
    clr();if(S.fog)S.fog.fill(0);const j=y0*W+x0;S.obj[j]='watch';setParts('watch',j,'part');recount();
    const T=[];const t0=toast;toast=m=>T.push(m);const c=(x,y)=>canPlace('watch',x,y,true);
    const o={r4:c(x0+6,y0),r5:c(x0+7,y0),l4:c(x0-6,y0),l5:c(x0-7,y0),d4:c(x0,y0+6),d5:c(x0,y0+7),u5:c(x0,y0-7),diag4:c(x0+6,y0+6),diag5:c(x0+7,y0+7)};
    clr();S.obj[j]='site';S.dyn[j]={build:'watch',p:0,need:150};recount();o.site4=c(x0+6,y0);o.site5=c(x0+7,y0);
    canPlace('watch',x0+6,y0,false);o.msg=T.pop();toast=t0;
    clr();S.obj[j]='watch';setParts('watch',j,'part');recount();MOVESRC=null;moveTap(x0,y0);moveTap(x0+3,y0);o.selfMove=S.obj[y0*W+x0+3]==='watch';
    return JSON.stringify(o)})()`));
  console.log(r);
  for(const k of['r4','l4','d4','diag4','site4'])assert.equal(r[k],false,k+' too close');
  for(const k of['r5','l5','d5','u5','diag5','site5'])assert.equal(r[k],true,k+' gap 5 ok');
  assert.match(r.msg,/5マス/);assert.equal(r.selfMove,true,'moving itself is not blocked by itself');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
