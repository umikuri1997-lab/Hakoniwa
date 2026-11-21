/* ほる・つむ：守り神のタップでじかに1だん（土がふえる・へる）、8だんまでつめる、なぞるとせいれいにたのめる（ほった土ははこばれる）。だんさスコップはない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{
    const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j);let x0=-1,y0=-1;
    for(let y=CY-12;y<CY+12&&x0<0;y++)for(let x=CX-12;x<CX+12;x++){let g=1;for(let b=0;b<3&&g;b++)for(let a=0;a<4;a++){const j=(y+b)*W+x+a;if(!ok(j)||hiAt(j)!==hiAt(y*W+x))g=0}if(g){x0=x;y0=y;break}}
    const j=y0*W+x0,h0=hiAt(j);S.mat.tsuchi=0;
    S.hi[j]=Math.max(1,h0);const h1=hiAt(j);terraNow('dig',x0,y0);const dug=hiAt(j),t1=(S.drops||[]).filter(d=>d.id==='mat:tsuchi'&&d.lt).reduce((n,d)=>n+d.n,0)+S.mat.tsuchi;S.drops=[];
    S.mat.tsuchi=20;for(let i=0;i<12;i++)terraNow('mound',x0,y0);const top=hiAt(j),t2=S.mat.tsuchi;
    for(let i=0;i<3;i++)render(performance.now());/* 8だんでも描ける */
    S.hi[j]=h1;S.mat.tsuchi=0;
    const shop=!!BL.dig&&BL.dig.pc===0&&BL.mound.pc===0;
    /* なぞる：となりの2×1をほってもらう */
    const c=[[x0+1,y0+1],[x0+2,y0+1]];for(const[x,y]of c)S.hi[y*W+x]=2;
    askTerra('dig',c);const asked=pending&&pending.kind==='terra'&&pending.cells.length;confirmYes();
    const sites=c.filter(([x,y])=>S.obj[y*W+x]==='site').length;
    const a=S.res[0];for(let i=0;i<40000&&c.some(([x,y])=>S.obj[y*W+x]==='site'||hiAt(y*W+x)===2);i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}
        return JSON.stringify({h1,dug,t1,top,t2,shop,asked,sites,after:c.map(([x,y])=>hiAt(y*W+x)),t3:S.mat.tsuchi+S.res.reduce((n,q)=>n+((q.cmat||{}).tsuchi||0),0),HMAX})})()`));
  console.log(r);
  assert.equal(r.dug,r.h1-1,'タップで1だんほれる');assert.equal(r.t1,1,'ほると土が1こ落ちる（せいれいがはこぶ）');
  assert.equal(r.top,8,'8だんまでつめる');assert.equal(r.t2,20-(8-r.dug),'つんだぶん土がへる');
  assert.ok(r.shop,'ほる・つむにパワーはいらない');
  assert.equal(r.asked,2,'なぞった2マスをたのめる');assert.equal(r.sites,2,'建てる所ができる');
  assert.deepEqual(r.after,[1,1],'せいれいがほった');assert.equal(r.t3,2,'ほった土が手に入った（はこんでいる分も）');
  assert.deepEqual(errors,[]);console.log('dig-stack: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
