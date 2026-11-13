/* 食卓は2人・大きな食卓（dtable、2×2）は4人まで食べられる・しょくたくなどのスポットの食卓になる。まるいサイドテーブル（stable）はなくした：古いセーブは、けして木材3（依頼中はパワー3も）をもどす（1回だけ） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true`);
  const a=JSON.parse(await run(`JSON.stringify({stable:!!BL.stable,sz:BL.dtable.sz,cap:BL.dtable.eat.cap,wood:BL.dtable.mat.wood,lv:BL.dtable.lv,tab:CRAFT_TABS[0][1].includes('dtable'),flag:!!newState(0).flags.noStable1})`));
  assert.deepEqual(a,{stable:false,sz:[2,2],cap:4,wood:16,lv:5,tab:true,flag:true});
  /* 古いセーブ */
  const b=JSON.parse(await run(`(()=>{const s=JSON.parse(JSON.stringify(S));delete s.flags.noStable1;const j=(CY+8)*W+CX+8;s.obj[j]='stable';s.inv.stable=2;s.orders.push({id:999,type:'stable',prog:0,need:80,worker:null});(s.broken||(s.broken=[])).push({j:j+3,id:'stable'});
    const pt=s.pt,wood=s.mat.wood||0;continueGame(s);const r={left:S.obj.includes('stable'),inv:S.inv.stable||0,ord:S.orders.some(o=>o.type==='stable'),brk:(S.broken||[]).some(q=>q.id==='stable'),pt:S.pt-pt,wood:(S.mat.wood||0)-wood};
    const w2=S.mat.wood;continueGame(JSON.parse(JSON.stringify(S)));r.again=S.mat.wood-w2;return JSON.stringify(r)})()`));
  assert.deepEqual(b,{left:false,inv:0,ord:false,brk:false,pt:3,wood:15,again:0});
  /* 食べる人数とスポット */
  const c=JSON.parse(await run(`(()=>{const X=CX+8,Y=CY+8;for(let y=Y-2;y<Y+5;y++)for(let x=X-2;x<X+5;x++){const k=y*W+x;S.obj[k]='';S.ground[k]=0;if(S.hi)S.hi[k]=0}
    const j=Y*W+X;S.obj[j]='dtable';for(const d of[1,W,W+1]){S.obj[j+d]='part';S.ref[j+d]=j}S.obj[j+2*W]='chair';S.obj[j+2*W+1]='chair';recount();
    const seats=[[j-W,W],[j-W+1,W],[j-1,1],[j+W-1,1],[j+2,-1],[j+W+2,-1]];const keep=S.res;const fake=n=>seats.slice(0,n).map(([k,t])=>({act:{type:'eat',tdir:t,key:'seat'+k}}));
    const room=n=>{S.res=keep.concat(fake(n));const v=tableRoom(j);S.res=keep;return v};
    const r={r3:room(3),r4:room(4),dining:spotHas(j,'dining'),chairTb:TABLES.has(typeAt(j+W))};
    const sp=S.res.find(q=>!q.hidden);sp.x=X+.5;sp.y=Y-1.5;sp.meal={u:1,pt:0,pw:0,e:'x'};sp.act=null;goMeal(sp,bfs(X,Y-2));r.eatAt=sp.act&&sp.act.tdir!=null&&TABLES.has(typeAt(+sp.act.key.slice(4)+sp.act.tdir));
    S.res=keep.concat(fake(4));const sp2=sp;sp2.act=null;sp2.meal={u:1,pt:0,pw:0,e:'x'};goMeal(sp2,bfs(X,Y-2));S.res=keep;r.full=!(sp2.act&&sp2.act.tdir!=null&&typeAt(+sp2.act.key.slice(4)+sp2.act.tdir)==='dtable');return JSON.stringify(r)})()`));
  assert.deepEqual(c,{r3:true,r4:false,dining:true,chairTb:true,eatAt:true,full:true});
  /* ふつうの食卓は2人まで */
  const d=JSON.parse(await run(`(()=>{const X=CX+8,Y=CY+20;for(let y=Y-2;y<Y+3;y++)for(let x=X-2;x<X+3;x++){const k=y*W+x;S.obj[k]='';S.ground[k]=0;if(S.hi)S.hi[k]=0}
    const j=Y*W+X;S.obj[j]='table';recount();const seats=[[j-W,W],[j+W,-W],[j-1,1]];const keep=S.res;
    const room=n=>{S.res=keep.concat(seats.slice(0,n).map(([k,t])=>({act:{type:'eat',tdir:t,key:'seat'+k}})));const v=tableRoom(j);S.res=keep;return v};
    return JSON.stringify({cap:BL.table.eat.cap,r1:room(1),r2:room(2)})})()`));
  assert.deepEqual(d,{cap:2,r1:true,r2:false});
  assert.deepEqual(errors,[]);console.log('table 2 / dtable 4 eaters, spots; stable removed and refunded once');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
