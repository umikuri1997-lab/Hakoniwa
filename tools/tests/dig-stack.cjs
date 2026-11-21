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
  /* つむブロック：もちものからつむと、そのだんがブロックになり、ほるとブロックがもどる。依頼ボードで作れる */
  const c=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j);let j=-1;for(let k=(CY-8)*W+CX-8;k<(CY+8)*W;k++)if(ok(k)&&ok(k+1)&&ok(k+W)){j=k;break}const x=j%W,y=(j/W)|0,h0=hiAt(j);
    S.inv.blk_stone=3;S.inv.blk_brick=1;terraNow('blk_stone',x,y);terraNow('blk_brick',x,y);const o={h:hiAt(j)-h0,c1:cubeAt(j,h0+1),c2:cubeAt(j,h0+2),inv:S.inv.blk_stone,ico:iconURL('blk_stone').slice(0,10)};
    for(let i=0;i<3;i++)render(performance.now());S.drops=[];terraNow('dig',x,y);o.back=(S.drops.find(d=>d.lt)||{}).id;o.c2b=cubeAt(j,h0+2);o.vx=JSON.stringify(S.vx[j]);
    S.drops=[];terraNow('dig',x,y);o.back2=(S.drops.find(d=>d.lt)||{}).id;o.gone=!S.vx[j];
    askTerra('blk_stone',[[x,y]]);confirmYes();o.site=S.obj[j]==='site'&&S.dyn[j].cube==='blk_stone';o.inv2=S.inv.blk_stone;
    const a=S.res[0];for(let i=0;i<30000&&S.obj[j]==='site';i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}o.built=cubeAt(j,h0+1);
    S.mat.stone=(S.mat.stone||0)+20;const n0=inv('blk_stone');{let w=-1;for(let k=j+3*W;k<j+20*W;k++)if(ok(k)&&ok(k+1)&&ok(k+W)&&ok(k+W+1)){w=k;break}wbenchAt(S,w,0);recount()}S.orders.push({id:S.nid++,type:'blk_stone',prog:0,need:BL.blk_stone.time,worker:null,mat:{stone:5},food:{},got:{}});rsvAdd({stone:5});o.ord=recipeKnown('blk_stone')&&lvOK('blk_stone')&&CRAFT_TABS.some(t=>t[1].includes('blk_stone'));/* 神殿のない村なので、依頼はじかにはる */for(let i=0;i<60000&&S.orders.some(q=>q.type==='blk_stone');i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}
    for(let i=0;i<20000&&inv('blk_stone')<n0+10;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}o.made=inv('blk_stone')-n0;return JSON.stringify(o)})()`));
  console.log(c);
  assert.equal(c.h,2);assert.equal(c.c1,'blk_stone');assert.equal(c.c2,'blk_brick');assert.equal(c.inv,2);assert.ok(c.ico.startsWith('data:'),'アイコン');
  assert.equal(c.back,'blk_brick','ほるとブロックがもどる');assert.equal(c.c2b,'');assert.equal(c.back2,'blk_stone');assert.ok(c.gone);
  assert.ok(c.site,'せいれいにたのめる');assert.equal(c.inv2,1);assert.equal(c.built,'blk_stone','せいれいがつんだ');assert.ok(c.ord,'依頼ボードでたのめる');assert.equal(c.made,10,'10こできた');
  assert.deepEqual(errors,[]);console.log('dig-stack: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
