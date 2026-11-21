/* ほる・つむ：守り神のどうぐ「つるはし」。タップでつむ・長おしでほる（材質で時間がちがう）。8だんまでつめる。だんさスコップはない */
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
    /* つるはし：長おしでほる（土1秒）・はやくはなすとつむ。とちゅうではなすと、ほらない */
    const c=[x0+1,y0+1],cj=c[1]*W+c[0];S.hi[cj]=2;S.mat.tsuchi=3;PICKSEL='tsuchi';const now=performance.now();
    PICKH={x:c[0],y:c[1],j:cj,t0:now-300,dig:false,n:0};pickTick(now);const need=PICKH.need;pickTick(now+500);pickUp();const half=hiAt(cj);
    PICKH={x:c[0],y:c[1],j:cj,t0:now-300,dig:false,n:0};pickTick(now);pickTick(now+1000);const held=hiAt(cj);pickUp();
    PICKH={x:c[0],y:c[1],j:cj,t0:performance.now(),dig:false,n:0};pickUp();const tap=hiAt(cj);
    const tool=(()=>{setMode('build');PALF='all';palOpen=true;renderPalette();return [...document.querySelectorAll('#palette .chip')].some(e=>/つるはし/.test(e.textContent))})();
        return JSON.stringify({h1,dug,t1,top,t2,shop,need,half,held,tap,tool,HMAX})})()`));
  console.log(r);
  assert.equal(r.dug,r.h1-1,'タップで1だんほれる');assert.equal(r.t1,1,'ほると土が1こ落ちる（せいれいがはこぶ）');
  assert.equal(r.top,8,'8だんまでつめる');assert.equal(r.t2,20-(8-r.dug),'つんだぶん土がへる');
  assert.ok(r.shop,'ほる・つむにパワーはいらない');
  assert.equal(r.need,1000,'土は1秒');assert.equal(r.half,2,'とちゅうではなすと、ほらない');assert.equal(r.held,1,'長おしでほれた');assert.equal(r.tap,2,'タップでつむ');assert.ok(r.tool,'「おく」のどうぐに、つるはし');
  /* つむブロック：もちものからつむと、そのだんがブロックになり、ほるとブロックがもどる。依頼ボードで作れる */
  const c=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j);let j=-1;for(let k=(CY-8)*W+CX-8;k<(CY+8)*W;k++)if(ok(k)&&ok(k+1)&&ok(k+W)){j=k;break}const x=j%W,y=(j/W)|0,h0=hiAt(j);
    S.inv.blk_stone=3;S.inv.blk_brick=1;terraNow('blk_stone',x,y);terraNow('blk_brick',x,y);const o={h:hiAt(j)-h0,c1:cubeAt(j,h0+1),c2:cubeAt(j,h0+2),inv:S.inv.blk_stone,ico:iconURL('blk_stone').slice(0,10)};
    for(let i=0;i<3;i++)render(performance.now());S.drops=[];terraNow('dig',x,y);o.back=(S.drops.find(d=>d.lt)||{}).id;o.c2b=cubeAt(j,h0+2);o.vx=JSON.stringify(S.vx[j]);
    S.drops=[];terraNow('dig',x,y);o.back2=(S.drops.find(d=>d.lt)||{}).id;o.gone=!S.vx[j];
    PICKSEL='blk_stone';PICKH={x,y,j,t0:performance.now(),dig:false,n:0};pickUp();o.built=cubeAt(j,h0+1);o.inv2=S.inv.blk_stone;S.hi[j]=h0;delete S.vx[j];
    PICKH={x,y,j,t0:performance.now()-300,dig:false,n:0};pickTick(performance.now());o.ms=PICKH&&PICKH.need;PICKH=null;const a=S.res[0];
    S.mat.stone=(S.mat.stone||0)+20;const n0=inv('blk_stone');{let w=-1;for(let k=j+3*W;k<j+20*W;k++)if(ok(k)&&ok(k+1)&&ok(k+W)&&ok(k+W+1)){w=k;break}wbenchAt(S,w,0);recount()}S.orders.push({id:S.nid++,type:'blk_stone',prog:0,need:BL.blk_stone.time,worker:null,mat:{stone:5},food:{},got:{}});rsvAdd({stone:5});o.ord=recipeKnown('blk_stone')&&lvOK('blk_stone')&&CRAFT_TABS.some(t=>t[1].includes('blk_stone'));/* 神殿のない村なので、依頼はじかにはる */for(let i=0;i<60000&&S.orders.some(q=>q.type==='blk_stone');i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}
    for(let i=0;i<20000&&inv('blk_stone')<n0+10;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}o.made=inv('blk_stone')-n0;return JSON.stringify(o)})()`));
  console.log(c);
  assert.equal(c.h,2);assert.equal(c.c1,'blk_stone');assert.equal(c.c2,'blk_brick');assert.equal(c.inv,2);assert.ok(c.ico.startsWith('data:'),'アイコン');
  assert.equal(c.back,'blk_brick','ほるとブロックがもどる');assert.equal(c.c2b,'');assert.equal(c.back2,'blk_stone');assert.ok(c.gone);
  assert.equal(c.inv2,1);assert.equal(c.built,'blk_stone','つるはしでブロックをつむ');assert.ok(c.ord,'依頼ボードでたのめる');assert.equal(c.made,10,'10こできた');
  /* 地面より下：2だんまでほれて、石材が出る。水にとなりあうと、水がながれこんで池になる */
  const d=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&hiAt(j)===0;let j=-1;for(let k=(CY-10)*W+CX-10;k<(CY+10)*W;k++)if(ok(k)&&ok(k+1)&&ok(k+2)&&ok(k-1)&&ok(k+W)&&ok(k-W)&&ok(k+1+W)&&ok(k+1-W)){j=k;break}const x=j%W,y=(j/W)|0,o={};
    S.drops=[];terraNow('dig',x,y);o.h1=hiAt(j);o.drop=(S.drops.find(q=>q.lt)||{}).id;terraNow('dig',x,y);o.h2=hiAt(j);o.ok3=canPlace('dig',x,y,true);
    for(let i=0;i<3;i++)render(performance.now());o.stairNo=canPlace('stairs_wood',x,y,true);
    S.mat.tsuchi=1;terraNow('mound',x,y);o.back=hiAt(j);
    /* 水：となりのマスを池にして、ほる */S.ground[j+2]=1;S.drops=[];terraNow('dig',x+1,y);o.pond=S.ground[j+1]===1&&hiAt(j+1)===0;o.walk=walk(j+1);
    for(let i=0;i<3;i++)render(performance.now());return JSON.stringify(o)})()`));
  console.log(d);
  assert.equal(d.h1,-1);assert.equal(d.drop,'mat:stone','地面より下は石材');assert.equal(d.h2,-2);assert.equal(d.ok3,false,'2だんまで');assert.equal(d.stairNo,false,'穴に階段はおけない');
  assert.equal(d.back,-1,'穴にもつめる');assert.ok(d.pond,'水にとなりあうと池になる');assert.equal(d.walk,false);
  assert.deepEqual(errors,[]);console.log('dig-stack: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
