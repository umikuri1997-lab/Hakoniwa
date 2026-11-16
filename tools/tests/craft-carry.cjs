/* 依頼ボードでできた物：作ったせいれいが頭の上につんで、おそなえ箱へはこぶ（しまってから、もちものに入る）。持てる数をこえた分（木の矢10本など）は、その場において、じゅんにはこぶ。箱がひとつもないときは、すぐ入る */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const st=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;
    const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;
    if(BOARD<0||OBOX<0){const free=(x,y,w,h)=>{for(let b=0;b<h;b++)for(let c=0;c<w;c++){const k=(y+b)*W+x+c;if(S.obj[k]||S.ground[k]||hiAt(k)||(S.fog&&S.fog[k]))return false}return true};let p=null;for(let y=CY-12;y<CY+20&&!p;y++)for(let x=CX-14;x<CX+14;x++)if(free(x,y,8,6)){p=[x,y];break}const j=p[1]*W+p[0]+1;S.obj[j]='statue';S.obj[j-1]='obox';S.obj[j+1]='board';S.obj[j+2]='part';S.ref[j+2]=j+1;S.obj[j+W*4+5]='crate';recount()}
    for(const k of Object.keys(S.mat))S.mat[k]=0;S.mat.wood=60;S.mat.stone=30;S.mat.eda=10;boxSync();S.pt=999;S.recipes.chair=1;S.unlocked.chair=1;S.recipes.arrow=1;S.lv=Math.max(S.lv||1,5);
    return JSON.stringify({board:BOARD,obox:OBOX,room:roomN(a)})})()`));
  console.log(JSON.stringify(st));assert.ok(st.board>=0&&st.obox>=0);
  const toasts=`(window.__T=[],(()=>{const o=toast;toast=(m,...x)=>{__T.push(m);return o(m,...x)}})(),1)`;await run(toasts);
  /* いす：できたら頭の上 → おそなえ箱へ */
  const c=JSON.parse(await run(`(()=>{const a=S.res[0],inv0=inv('chair');orderFurn('chair');let n=0,head=null;for(;n<60000;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(!S.orders.length&&head==null)head={inv:inv('chair'),c:JSON.stringify(a.citem),ic:carryIcons(a).filter(i=>i==='obj:chair').length};if(head&&!citemN(a))break}
    return JSON.stringify({n,inv0,head,inv:inv('chair'),citem:a.citem,cmade:a.cmade,T:__T.filter(t=>/いす/.test(t))})})()`));
  console.log(JSON.stringify(c));assert.ok(c.head,'できた');assert.equal(c.head.inv,c.inv0,'できたときは、まだもちものに入らない');assert.equal(c.head.ic,1,'頭の上に、いすのアイコン');assert.equal(c.inv,c.inv0+1,'しまったら入る');assert.equal(c.citem,null);
  assert.ok(c.T.some(t=>/おそなえ箱に入れた/.test(t)),'しまったときの知らせ');assert.ok(!c.T.some(t=>/ひろった/.test(t)),'ひろったとは言わない');
  /* 木の矢：持てる数（1）をこえた分は、その場において、じゅんにはこぶ */
  const ar=JSON.parse(await run(`(()=>{const a=S.res[0],inv0=inv('arrow');S.orders=[];finishCraft({type:'arrow',id:'a1'},a);const room=capOf(a),head=citemN(a),dr=(S.drops||[]).filter(d=>d.made).map(d=>d.id+':'+d.n+':'+d.tap);let n=0;for(;n<80000;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(!citemN(a)&&!(S.drops||[]).some(d=>d.made))break}
    return JSON.stringify({n,room,head,dr,inv0,inv:inv('arrow'),qty:BL.arrow.qty})})()`));
  console.log(JSON.stringify(ar));assert.equal(ar.head,Math.min(ar.room,ar.qty));assert.deepEqual(ar.dr,['arrow:'+(ar.qty-ar.head)+':1']);assert.equal(ar.inv,ar.inv0+ar.qty,'ぜんぶ運んで入る');
  /* 箱がひとつもないとき：すぐ入る */
  const nb=JSON.parse(await run(`(()=>{const a=S.res[0];endAct(a);a.citem=null;const inv0=inv('chair'),ob=OBOX,bl=BOXL.slice();OBOX=-1;BOXL.length=0;finishCraft({type:'chair',id:'x'},a);const r={inv:inv('chair')-inv0,c:citemN(a)};OBOX=ob;BOXL.push(...bl);return JSON.stringify(r)})()`));
  console.log(JSON.stringify(nb));assert.deepEqual(nb,{inv:1,c:0});
  assert.deepEqual(errors,[]);await browser.close();console.log('Craft carry: crafted items ride on the head to the offering box, overflow waits on the ground and is carried in turns, no box means straight in');
})().catch(e=>{console.error(e);process.exit(1)});
