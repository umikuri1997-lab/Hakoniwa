/* 箱がいっぱいの知らせ：木・石をあつめられないとき「箱がいっぱいです」を1回だけ。1つ空いただけでは、くりかえさない。箱がふえたら、また知らせる。
   木材が少ない（10より下）ときは、まわりに雑草があっても、木を切るのが先。
   空きのある箱へ歩いて行けないとき「木箱へ行けません」（いちばん近い箱の家具の名前）を1回だけ。しまえたら、また知らせる。ほかのせいれいが箱のそばで作業しているだけなら、知らせない。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const a=S.res[0];a.hunger=hMax(a);a.energy=100;a.fun=100;endAct(a);a.act=null;S.t=1440*3+10*60;
    const x0=a.x|0,y0=(a.y|0)+2,j=y0*W+x0+2,j2=y0*W+x0+4;for(const k of[j,j2]){S.obj[k]='';delete S.ref[k]}S.obj[j]='crate';recount();
    const T=[];const t0=toast;toast=(m,k)=>{T.push(m);return t0(m,k)};const G=()=>bfs(a.x|0,a.y|0);const cnt=()=>T.filter(m=>m==='箱がいっぱいです').length;
    const out={};
    S.mat.stone=(S.mat.stone||0)+matCap()-matTot();boxSync();out.full=matTot()>=matCap();
    out.c1=(tryJob(a,G(),'chop'),tryJob(a,G(),'mine'),cnt());
    S.mat.stone-=1;boxSync();goWork(a,G(),true);endAct(a);a.act=null;S.mat.stone+=1;boxSync();tryJob(a,G(),'chop');out.c2=cnt();/* 1つ空いて、またうまっても、くりかえさない */
    S.obj[j2]='crate';recount();goWork(a,G(),true);endAct(a);a.act=null;S.mat.stone+=matCap()-matTot();boxSync();tryJob(a,G(),'mine');out.c3=cnt();/* 箱がふえて、またいっぱいになったら、もう1回 */
    /* 木材が少ないときは、雑草より先に木を切る */
    for(const k of Object.keys(S.box))S.box[k]={};S.mat={wood:2,stone:0};S.pile={};boxSync();const wj=(a.y|0)*W+(a.x|0)-1;if(!S.obj[wj])S.obj[wj]='weed0g';
    S.food=100;const f=mkRes(S,'テスト火','fire',a.x,a.y);f.hunger=hMax(f);f.energy=100;f.fun=100;S.res.push(f);endAct(f);f.act=null;goWork(f,bfs(f.x|0,f.y|0),true);out.lowAct=f.act&&f.act.type;endAct(f);f.act=null;f.path=[];S.mat.wood=10;boxSync();addFood("berry",20);boxSync();goWork(f,bfs(f.x|0,f.y|0),true);out.okAct=f.act&&f.act.type;/* とくいな仕事の少ない火のせいれいで、木と雑草の順だけを見る */
    /* 箱へ行けない：壁でかこんだ箱だけの村 */
    S.res=[a];endAct(a);a.act=null;a.path=[];S.obj[j]='';S.obj[j2]='';const jc=(y0+4)*W+x0+8,WL=[jc-1,jc+1,jc-W,jc+W];for(const k of[jc,...WL]){S.obj[k]='';delete S.ref[k]}S.obj[jc]='crate';for(const k of WL)S.obj[k]='hwall';recount();
    const far=()=>T.filter(m=>m==='木箱へ行けません').length;a.carry={berry:1};goStore(a,G());out.farAct=a.act&&a.act.type;endAct(a);a.act=null;goStore(a,G());out.f1=far();endAct(a);a.act=null;
    S.obj[jc+W]='';recount();goStore(a,G());out.openAct=a.act&&a.act.type;endAct(a);a.act=null;a.path=[];TAKEN=new Set([jc+W]);a.carry={berry:1};goStore(a,G());TAKEN=null;out.tk=far();endAct(a);a.act=null;a.path=[];/* 箱のそばで、ほかのせいれいが作業しているだけ */S.obj[jc+W]='hwall';recount();a.carry={berry:1};goStore(a,G());out.f2=far();
    toast=t0;return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.full,true);assert.equal(r.c1,1,'notify once when full');assert.equal(r.c2,1,'no repeat when one slot opens');assert.equal(r.c3,2,'notify again after more boxes fill up');
  assert.equal(r.lowAct,'chop','low wood: chop before nearby weeds');assert.equal(r.okAct,'weed','enough wood: nearby weeds first');
  assert.equal(r.farAct,'idle');assert.equal(r.f1,1,'unreachable box: notify once');assert.equal(r.openAct,'store','reachable again: store');assert.equal(r.tk,1,'no notice when only another spirit is working by the box');assert.equal(r.f2,2,'notify again after a store');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
