/* ブロック：「おく」でタップしてつむ・「こわす」で長おし（材質で時間がちがう）。8だんまでつめる。かたちの筆・だんさスコップはない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{
    const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&!treeNextHigh(j,99);let x0=-1,y0=-1;
    for(let y=CY-12;y<CY+12&&x0<0;y++)for(let x=CX-12;x<CX+12;x++){let g=1;for(let b=0;b<3&&g;b++)for(let a=0;a<4;a++){const j=(y+b)*W+x+a;if(!ok(j)||hiAt(j)!==hiAt(y*W+x))g=0}if(g){x0=x;y0=y;break}}
    const j=y0*W+x0,h0=hiAt(j);S.inv.blk_soil=0;
    S.hi[j]=Math.max(1,h0);const h1=hiAt(j);terraNow('dig',x0,y0);const dug=hiAt(j),t1=(S.drops||[]).filter(d=>d.id==='blk_soil'&&d.lt).reduce((n,d)=>n+d.n,0);S.drops=[];
    S.inv.blk_soil=20;for(let i=0;i<12;i++)terraNow('mound',x0,y0);const top=hiAt(j),t2=S.inv.blk_soil;
    for(let i=0;i<3;i++)render(performance.now());/* 8だんでも描ける */
    S.hi[j]=h1;S.inv.blk_soil=0;
    const shop=!!BL.dig&&BL.dig.pc===0&&BL.mound.pc===0;
    /* こわす：長おしでこわす（土1秒）。とちゅうではなすと、こわさない。おく：タップした所に1だんつむ */
    const c=[x0+1,y0+1],cj=c[1]*W+c[0];S.hi[cj]=2;S.inv.blk_soil=3;const now=performance.now();
    PICKH={x:c[0],y:c[1],j:cj,t0:now-300,dig:false,n:0};pickTick(now);const need=PICKH.need;pickTick(now+500);const was=pickEnd();const half=hiAt(cj);
    PICKH={x:c[0],y:c[1],j:cj,t0:now-300,dig:false,n:0};pickTick(now);pickTick(now+1000);const held=hiAt(cj),chips=fx.filter(f=>f.k==='bc').length;pickEnd();
    PICKH={x:c[0],y:c[1],j:cj,t0:now-100,dig:false,n:0};pickTick(now);const quick=pickEnd();
    setMode('build');sel=SOIL;place(SOIL,c[0],c[1]);const tap=hiAt(cj),dust=fx.some(f=>f.k==='spr'&&f.n==='bdust');
    const pal=(()=>{PALF='all';palOpen=true;renderPalette();const t=[...document.querySelectorAll('#palette .chip')].map(e=>e.textContent);return {fude:t.some(x=>/かたちの筆/.test(x)),blk:t.some(x=>/土のブロック/.test(x))}})();setMode('look');const tool=!pal.fude&&pal.blk;
        return JSON.stringify({h1,dug,t1,top,t2,shop,need,half,held,tap,tool,HMAX,was,quick,chips,dust})})()`));
  console.log(r);
  assert.equal(r.dug,r.h1-1,'タップで1だんほれる');assert.equal(r.t1,1,'ほると土のブロックが1こ落ちる（せいれいがはこぶ）');
  assert.equal(r.top,8,'8だんまでつめる');assert.equal(r.t2,20-(8-r.dug),'つんだぶん土のブロックがへる');
  assert.ok(r.shop,'ほる・つむにパワーはいらない');
  assert.equal(r.need,1000,'土は1秒');assert.equal(r.half,2,'とちゅうではなすと、こわさない');assert.ok(r.was,'こわしかけたら、はなしてもタップにしない');assert.equal(r.held,1,'長おしでこわれた');assert.ok(r.chips>=10,'こわれると、かけらがとぶ');assert.equal(r.quick,false,'短くおしたら、ふつうのタップ');assert.equal(r.tap,2,'「おく」でタップしてつむ');assert.ok(r.dust,'おくと、足もとに砂ぼこり');assert.ok(r.tool,'「おく」に土のブロックがあり、かたちの筆はない');
  /* つむブロック：もちものからつむと、そのだんがブロックになり、ほるとブロックがもどる。依頼ボードで作れる */
  const c=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&!treeNextHigh(j,99);let j=-1;for(let k=(CY-8)*W+CX-8;k<(CY+8)*W;k++)if(ok(k)&&ok(k+1)&&ok(k+W)){j=k;break}const x=j%W,y=(j/W)|0,h0=hiAt(j);
    S.inv.blk_stone=3;S.inv.blk_soil=1;terraNow('blk_stone',x,y);terraNow('blk_soil',x,y);const o={h:hiAt(j)-h0,c1:cubeAt(j,h0+1),c2:cubeAt(j,h0+2),inv:S.inv.blk_stone,ico:iconURL('blk_stone').slice(0,10)};
    for(let i=0;i<3;i++)render(performance.now());S.drops=[];terraNow('dig',x,y);o.back=(S.drops.find(d=>d.lt)||{}).id;o.c2b=cubeAt(j,h0+2);o.vx=JSON.stringify(S.vx[j]);
    S.drops=[];terraNow('dig',x,y);o.back2=(S.drops.find(d=>d.lt)||{}).id;o.gone=!S.vx[j];
    place('blk_stone',x,y);o.built=cubeAt(j,h0+1);o.inv2=S.inv.blk_stone;S.hi[j]=h0;delete S.vx[j];
    PICKH={x,y,j,t0:performance.now()-300,dig:false,n:0};pickTick(performance.now());o.ms=PICKH&&PICKH.need;PICKH=null;const a=S.res[0];
    S.mat.stone=(S.mat.stone||0)+20;const n0=inv('blk_stone');{let w=-1;for(let k=j+3*W;k<j+20*W;k++)if(ok(k)&&ok(k+1)&&ok(k+W)&&ok(k+W+1)){w=k;break}wbenchAt(S,w,0);recount()}S.orders.push({id:S.nid++,type:'blk_stone',prog:0,need:BL.blk_stone.time,worker:null,mat:{stone:5},food:{},got:{}});rsvAdd({stone:5});o.ord=recipeKnown('blk_stone')&&lvOK('blk_stone')&&CRAFT_TABS.some(t=>t[1].includes('blk_stone'));/* 神殿のない村なので、依頼はじかにはる */for(let i=0;i<60000&&S.orders.some(q=>q.type==='blk_stone');i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}
    for(let i=0;i<20000&&inv('blk_stone')<n0+10;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}o.made=inv('blk_stone')-n0;return JSON.stringify(o)})()`));
  console.log(c);
  assert.equal(c.h,2);assert.equal(c.c1,'blk_stone');assert.equal(c.c2,'','土のブロックをつんだだんは土');assert.equal(c.inv,2);assert.ok(c.ico.startsWith('data:'),'アイコン');
  assert.equal(c.back,'blk_soil','ほるとブロックがもどる');assert.equal(c.c2b,'');assert.equal(c.back2,'blk_stone');assert.ok(c.gone);
  assert.equal(c.inv2,1);assert.equal(c.built,'blk_stone','「おく」でブロックをつむ');assert.ok(c.ord,'依頼ボードでたのめる');assert.equal(c.made,10,'10こできた');
  /* 地面より下：2だんまでほれて、石のブロックが出る。水にとなりあうと、水がながれこんで池になる */
  const d=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&hiAt(j)===0;let j=-1;for(let k=(CY-10)*W+CX-10;k<(CY+10)*W;k++)if(ok(k)&&ok(k+1)&&ok(k+2)&&ok(k-1)&&ok(k+W)&&ok(k-W)&&ok(k+1+W)&&ok(k+1-W)){j=k;break}const x=j%W,y=(j/W)|0,o={};
    S.drops=[];terraNow('dig',x,y);o.h1=hiAt(j);o.drop=(S.drops.find(q=>q.lt)||{}).id;terraNow('dig',x,y);o.h2=hiAt(j);o.ok3=canPlace('dig',x,y,true);
    for(let i=0;i<3;i++)render(performance.now());o.stairNo=canPlace('stairs_wood',x,y,true);
    S.inv.blk_soil=1;terraNow('mound',x,y);o.back=hiAt(j);
    /* 水：となりのマスを池にして、ほる */S.ground[j+2]=1;S.drops=[];terraNow('dig',x+1,y);o.pond=S.ground[j+1]===1&&hiAt(j+1)===0;o.walk=walk(j+1);
    for(let i=0;i<3;i++)render(performance.now());return JSON.stringify(o)})()`));
  console.log(d);
  assert.equal(d.h1,-1);assert.equal(d.drop,'blk_stone','地面より下は石のブロック');assert.equal(d.h2,-2);assert.equal(d.ok3,false,'2だんまで');assert.equal(d.stairNo,false,'穴に階段はおけない');
  assert.equal(d.back,-1,'穴にもつめる');assert.ok(d.pond,'水にとなりあうと池になる');assert.equal(d.walk,false);
  /* かたちの筆のサブクエストはない。前のセーブの素材「土」は、土のブロックに */
  const f=JSON.parse(await run(`(()=>{const o={};o.noq=!SUBQ.some(q=>q.k==='fude');
    S.mat.tsuchi=4;S.inv.blk_soil=1;S.drops=[{id:'mat:tsuchi',x:1,y:1,n:1}];soilMigrate();o.soil=S.inv.blk_soil;o.mat=S.mat.tsuchi;o.drop=S.drops[0].id;S.drops=[];S.flags.blk2=0;const jj=(CY+30)*W+CX;S.vx[jj]=['blk_stone','blk_brick','blk_wood'];S.inv.blk_brick=10;S.inv.blk_wood=3;const st0=S.mat.stone|0,wd0=S.mat.wood|0;blockMig();o.vxm=JSON.stringify(S.vx[jj]);delete S.vx[jj];o.stb=(S.mat.stone|0)-st0;o.wdb=(S.mat.wood|0)-wd0;o.inv3=(S.inv.blk_brick|0)+(S.inv.blk_wood|0);o.tab=JSON.stringify(CRAFT_TABS.find(t=>t[0]==='ブロック')[1]);o.pickb=JSON.stringify(PICKB);
    return JSON.stringify(o)})()`));
  console.log(f);
  assert.ok(f.noq,'かたちの筆のサブクエストはない');
  assert.equal(f.soil,5,'前の土は土のブロックに');assert.equal(f.mat,0);assert.equal(f.drop,'blk_soil');assert.equal(f.vxm,'["blk_stone","blk_stone","blk_stone"]','前のレンガ・木のブロックは石のブロックに');assert.equal(f.stb,3,'レンガ10こは石材3');assert.equal(f.wdb,2+2,'木材：レンガ2・木のブロック3こで2');assert.equal(f.inv3,0);
  assert.equal(f.tab,'["blk_stone"]','依頼ボードは石のブロックだけ');assert.equal(f.pickb,'["blk_soil","blk_stone"]','つめるのは土と石');
  const tr=JSON.parse(await run(`(()=>{let bad=0;for(let j=W;j<W*H-W;j++){const R=hiRad(S.obj[j]);if(!R)continue;const h=hiAt(j);for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const x=j%W+dx,y=((j/W)|0)+dy;if(x>=0&&x<W&&y>=0&&y<H&&hiAt(y*W+x)>h){bad++;dy=dx=9}}}let k=-1;for(let j=(CY-20)*W;j<(CY+20)*W;j++)if(TREES.has(S.obj[j])&&!S.obj[j+1]&&!S.floor[j+1]&&!S.ground[j+1]&&!fogAt(j+1)&&hiAt(j+1)===hiAt(j)){k=j;break}S.inv.blk_soil=5;const b=hiAt(k+1),k2=k+2-W;const ok2=!S.obj[k2]&&!S.floor[k2]&&!S.ground[k2]&&!fogAt(k2)&&hiAt(k2)===hiAt(k);terraNow('blk_soil',(k+1)%W,((k+1)/W)|0);const b2=hiAt(k2);if(ok2)terraNow('blk_soil',k2%W,(k2/W)|0);return JSON.stringify({bad,k,same:hiAt(k+1)===b,same2:!ok2||hiAt(k2)===b2})})()`));
  assert.equal(tr.bad,0,'はじめの地形：木のまわり2マス・岩のまわり1マスは、それより高くない');assert.ok(tr.k>=0&&tr.same&&tr.same2,'木のまわり2マスには、つめない');
  const fl=JSON.parse(await run(`(()=>{let bad=0,n=0;for(let j=W;j<W*H-W;j++){if(!FLATR.has(S.obj[j]))continue;n++;if(!flatAt(j))bad++}let k=-1;for(let j=(CY-30)*W;j<(CY+30)*W;j++)if(S.obj[j]==='berry'&&!S.obj[j+1]&&!S.floor[j+1]&&!S.ground[j+1]&&!fogAt(j+1)){k=j;break}let up=null,dn=null;if(k>=0){S.inv.blk_soil=5;const b=hiAt(k+1);terraNow('blk_soil',(k+1)%W,((k+1)/W)|0);up=hiAt(k+1)===b;dn=canPlace('dig',(k+1)%W,((k+1)/W)|0,true)}return JSON.stringify({bad,n,k,up,dn})})()`));
  assert.equal(fl.bad,0,'はじめの地形：茂み・竹のまわり1マスは同じ高さ');assert.ok(fl.n>0,'茂みがある');assert.ok(fl.k>=0&&fl.up===true&&fl.dn===false,'茂みのとなりは、つめない・ほれない');
  /* こわすモード：タップではこわさず、長おしで1だんこわす。こわしているあいだのひび（10まいの絵）が描ける。ブロックのアイコンは立方体 */
  const rm=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&!treeNextHigh(j,99);let j=-1;for(let k=(CY-10)*W+CX-10;k<(CY+10)*W;k++)if(ok(k)&&ok(k+1)&&ok(k+W)&&hiAt(k)===hiAt(k+1)&&hiAt(k)===hiAt(k+W)){j=k;break}
    let o0=false;const x=j%W,y=(j/W)|0,h0=hiAt(j);S.hi[j]=h0+2;S.drops=[];setMode('remove');removeAt(x,y);const tapNo=hiAt(j)-h0;PICKH={x,y,j,t0:performance.now()-1300,dig:false,n:0};pickTick(performance.now());pickTick(performance.now()+1300);pickEnd();const dug=h0+2-hiAt(j);const drop=(S.drops.find(d=>d.lt)||{}).id;
    PICKH={x,y,j,t0:performance.now()-600,dig:true,n:0,need:1000};o0=!!crackImg(3);for(let i=0;i<2;i++)render(performance.now());PICKH=null;S.hi[j]=h0;setMode('look');
    return JSON.stringify({dug,tapNo,o0,drop,soil:iconURL('blk_soil').slice(0,10),stone:iconURL('blk_stone').slice(0,10)})})()`));
  console.log(rm);assert.equal(rm.tapNo,2,'タップではこわさない');assert.equal(rm.dug,1,'長おしで1だんこわせる');assert.ok(rm.o0,'ひびの絵');assert.equal(rm.drop,'blk_soil');assert.ok(rm.soil.startsWith('data:')&&rm.stone.startsWith('data:'),'ブロックのアイコン');
  assert.deepEqual(errors,[]);console.log('dig-stack: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
