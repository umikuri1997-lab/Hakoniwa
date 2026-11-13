const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
/* 箱ごとの中身：木箱にしまう・入れる物をえらぶ・箱から食べる・建てる素材を箱から運ぶ・依頼の素材を運ぶ・神殿のまえから運ぶ・箱をこわす・古いセーブの読みかえ */
(async()=>{const {browser,run,errors}=await boot();
  const setup=`S.introSeen=true;S.t=1440*2+540;S.enemies=[];S.drops=[];USERPAUSE=true;updTut=()=>{};showItemGift=()=>{};showSpotPop=()=>{};finalCheck=()=>{};checkQuest=()=>{};
    const r=S.res[0];S.res=[r];r.hunger=hMax(r);r.fun=90;r.energy=100;r.act=null;r.path=[];
    for(let j=0;j<W*H;j++){const o=S.obj[j];if(o&&BL[o]&&(BL[o].natural||WEEDS.has(o)))S.obj[j]=''}S.farm=null;/* 木・岩・草をのぞいて、ほかの仕事でふえないように */const x0=r.x|0,y0=r.y|0,A=(y0+2)*W+x0+3,B=(y0+2)*W+x0+6;for(const j of[A,B]){S.obj[j]='crate'}window.BA=A;window.BB=B;recount();`;
  const step=n=>`for(let i=0;i<${n};i++){stepWorld(.25);for(const q of S.res){q.fun=90;q.energy=100}}`;
  /* しまう：じかにふえた分は、あいた箱へ。入らなければ神殿のまえ。食べ物だけの箱には素材を入れない */
  const a=JSON.parse(await run(`(()=>{${setup}S.mat={wood:0,stone:0};S.fs={};syncFood();boxSync();S.boxF={[B]:{food:1}};
    S.mat.wood=100;S.fs.berry=10;syncFood();boxSync();return JSON.stringify({A:S.box[A],B:S.box[B]||{},pile:S.pile,wood:S.mat.wood,food:S.food,cap:boxCapTot()})})()`));
  assert.deepEqual(a.A,{wood:80});assert.deepEqual(a.B,{'f:berry':10});assert.deepEqual(a.pile,{wood:20});assert.equal(a.wood,100);assert.equal(a.food,10);assert.equal(a.cap,160);
  /* 神殿のまえの物は、せいれいがあいた箱へ運ぶ。食べ物だけの箱には入れない */
  const b=JSON.parse(await run(`(()=>{const A=window.BA,B=window.BB;S.boxF={};${step(2400)}return JSON.stringify({A:S.box[A],B:S.box[B],pile:S.pile,wood:S.mat.wood})})()`));
  assert.equal(b.wood,100);assert.equal(b.pile.wood||0,0,'pile hauled: '+JSON.stringify(b));assert.equal((b.A.wood||0)+(b.B.wood||0),100);
  /* 食べる：その箱の食べ物をへらす */
  const c=JSON.parse(await run(`(()=>{const A=window.BA,B=window.BB;const r=S.res[0];r.hunger=300;const f0=S.box[B]['f:berry'];${step(400)}let fa=0;for(const k in S.fs)fa+=totKey(fkey(k));return JSON.stringify({f0,f1:(S.box[B]||{})['f:berry']||0,food:S.food,inBoxes:fa,h:r.hunger})})()`));
  assert.ok(c.f1<c.f0,'ate from the box: '+JSON.stringify(c));assert.equal(c.food,c.inBoxes,'food count is what the boxes hold');
  /* 建てる：たのんだときは、とっておくだけ。せいれいが箱から運んで、とどけてから建てる */
  const d=JSON.parse(await run(`(()=>{const A=window.BA,B=window.BB;const r=S.res[0],j=(r.y|0)*W+(r.x|0)-4;S.obj[j]='site';S.dyn[j]={build:'torch',p:0,need:30,mat:{wood:5},got:{}};rsvAdd({wood:5});recount();boxSync();
    const at={wood:S.mat.wood,rsv:S.rsv.wood,box:(S.box[A].wood||0)+(S.box[B].wood||0)};${step(1200)}
    return JSON.stringify({at,done:S.obj[j],wood:S.mat.wood,rsv:S.rsv.wood||0,box:(S.box[A].wood||0)+(S.box[B].wood||0)})})()`));
  assert.deepEqual(d.at,{wood:95,rsv:5,box:100},'reserved, still in the box');assert.equal(d.done,'torch');assert.equal(d.box,95,'taken out of the box');assert.equal(d.rsv,0);assert.equal(d.wood,95);
  /* 依頼のものづくりも、素材を運んでから作る */
  const e=JSON.parse(await run(`(()=>{const A=window.BA,B=window.BB;const r=S.res[0],bj=(r.y|0)*W+(r.x|0)+10;S.obj[bj]='board';S.obj[bj+1]='part';S.ref[bj+1]=bj;recount();BL.crate.maker=null;
    S.orders.push({id:S.nid++,type:'crate',prog:0,need:20,worker:null,mat:{wood:8},food:{},got:{}});rsvAdd({wood:8});const n0=inv('crate');${step(2400)}
    return JSON.stringify({made:inv('crate')-n0,wood:S.mat.wood,orders:S.orders.length,box:(S.box[A].wood||0)+(S.box[B].wood||0)})})()`));
  assert.equal(e.made,1,'order crafted: '+JSON.stringify(e));assert.equal(e.box,87);assert.equal(e.wood,87);
  /* やめる：とっておいた分は、使える数にもどる */
  const f=JSON.parse(await run(`(()=>{const A=window.BA,B=window.BB;const j=(S.res[0].y|0)*W+(S.res[0].x|0)-6;S.obj[j]='site';S.dyn[j]={build:'torch',p:0,need:30,mat:{wood:5},got:{}};rsvAdd({wood:5});const w0=S.mat.wood;siteRefund(S.dyn[j],j);clearObj(j);recount();boxSync();return JSON.stringify({w0,w1:S.mat.wood,rsv:S.rsv.wood||0})})()`));
  assert.deepEqual(f,{w0:82,w1:87,rsv:0});
  /* 箱がなくなったら、中身はその場所に落ちる */
  const g=JSON.parse(await run(`(()=>{const A=window.BA,B=window.BB;const n=S.box[A].wood||0;S.obj[A]='';recount();boxSync();const dp=(S.drops||[]).find(q=>q.id==='mat:wood'&&q.tap);return JSON.stringify({n,drop:dp?dp.n:0,box:!!S.box[A],wood:S.mat.wood})})()`));
  assert.equal(g.drop,g.n);assert.equal(g.box,false);assert.equal(g.wood,87-g.n);
  /* まき棚：木材と枝だけ、200まで */
  const mk=JSON.parse(await run(`(()=>{const A=window.BA,j=A+W*3;S.obj[j]='makidana';recount();return JSON.stringify({cap:boxCap(j),wood:boxRoom(j,'wood'),eda:boxRoom(j,'eda'),stone:boxRoom(j,'stone'),food:boxRoom(j,'f:berry'),catMat:boxCat(j,false)})})()`));
  assert.deepEqual(mk,{cap:200,wood:200,eda:200,stone:0,food:0,catMat:false});
  /* 箱の画面：中身と、入れる物 */
  const h=await run(`(()=>{const A=window.BA,B=window.BB;openSheet('furn',B);const t=document.querySelector('#sheetBody').innerText;closeSheet();return t})()`);
  assert.match(h,/中身/);assert.match(h,/入れる物/);assert.match(h,/なんでも/);
  /* 古いセーブ：食料箱・素材箱は木箱に。持っていた数はそのまま。2回読みこんでも同じ */
  const m=JSON.parse(await run(`(()=>{const A=window.BA,B=window.BB;const s=JSON.parse(JSON.stringify(S));delete s.flags.box1;delete s.box;delete s.pile;delete s.rsv;s.orders=[{id:999,type:'stor',prog:0,need:120,worker:null}];
    s.obj=s.obj.map(o=>o==='crate'?'':o);const r=s.res[0],a=((r.y|0)+2)*W+(r.x|0)+3,b=a+3;s.obj[a]='stor';s.obj[b]='mbox';s.inv.mbox=1;s.inv.crate=0;s.mat={wood:70,stone:40};s.fs={berry:30};s.food=30;s.otakiQ={wood:6};s.cmpQ={};s.smQ={};
    continueGame(s);for(const id of['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;USERPAUSE=true;boxSync();const o1={obj:[S.obj[a],S.obj[b]],crate:S.inv.crate||0,wood:S.mat.wood,rsv:S.rsv.wood,stone:S.mat.stone,food:S.food,inBox:totKey('wood'),ord:S.orders[0].type,got:S.orders[0].got};
    continueGame(JSON.parse(JSON.stringify(S)));for(const id of['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;USERPAUSE=true;boxSync();return JSON.stringify({o1,o2:{wood:S.mat.wood,rsv:S.rsv.wood,inBox:totKey('wood'),food:S.food}})})()`));
  assert.deepEqual(m.o1,{obj:['crate','crate'],crate:1,wood:70,rsv:6,stone:40,food:30,inBox:76,ord:'crate',got:{wood:8}});
  assert.deepEqual(m.o2,{wood:70,rsv:6,inBox:76,food:30});
  assert.deepEqual(errors,[]);
  console.log('Boxes: per-box contents, filters, hauling from the temple, eating from a box, building and crafting fetch materials, cancel refunds, spilled boxes, old saves migrated twice');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
