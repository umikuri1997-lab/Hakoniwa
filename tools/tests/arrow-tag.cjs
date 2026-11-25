/* 見張り台の上の、木の矢の本数の札は、見張り台の絵のてっぺんのすぐ上（絵の上はしから札の下はしまで 0〜6点） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;USERPAUSE=true;
    const f=S.res[0],x0=(f.x|0)+8,y0=(f.y|0)+5;for(let b=-3;b<4;b++)for(let a=-3;a<4;a++){const k=(y0+b)*W+x0+a;S.obj[k]='';S.hi[k]=0;delete S.dyn[k]}
    const j=y0*W+x0;S.obj[j]='watch';setParts('watch',j,'part');recount();const out=[];
    for(const L of[1,8]){S.hp['L'+j]=L;const ch=chipOf('watch',j),P=isoChipAt(ctx,j,0,0,'watch'),k=dpr*cam.z,O=isoOff(k);
      let got=null;const fr=ctx.fillText;ctx.fillText=function(t,x,y){const m=ctx.getTransform();if(got==null)got=(m.d*(y+6)+m.f-O[1])/k;return fr.apply(this,arguments)};
      try{drawArrowTags(0,0,W,H)}finally{ctx.fillText=fr}
      out.push({L,top:P.y+ch.ay/2,bottom:got})}
    return JSON.stringify(out)})()`));
  console.log(r);
  for(const o of r){const gap=o.top-o.bottom;assert.ok(gap>=0&&gap<=6,'Lv'+o.L+' gap '+gap)}
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
