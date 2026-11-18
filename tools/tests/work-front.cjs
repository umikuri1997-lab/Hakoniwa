/* 作業する向きがきまっている家具（WORKF：はたおり機・粉ひき小屋・調理台・流し台・かまど・作業台・炉）：
   4つの向き（ROTS 4、絵は id・id>1・id>2、左は右の反転）・作業するマスはその向きの前・せいれいはそのマスに立つ・前がふさがると作業しない・前のセーブのかまどの反転は前向きに・ふさがった家具を数える */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const o=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;
    const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;S.rot=S.rot||{};const out={};
    const free=(x,y,w,h)=>{for(let b=0;b<h;b++)for(let c=0;c<w;c++){const k=(y+b)*W+x+c;if(S.obj[k]||S.ground[k]||S.floor[k]||hiAt(k)||(S.fog&&S.fog[k]))return false}return true};
    const x0=CX-12,y0=CY+4;for(let y=y0-2;y<y0+8;y++)for(let x=x0-2;x<x0+12;x++){const k=y*W+x;S.obj[k]='';S.ground[k]=0;S.floor[k]='';S.hi[k]=0;delete S.ref[k];delete S.dyn[k];if(S.fog)S.fog[k]=0}/* ひろい空き地にする */
    out.rots=['loom','mill','cooktable','sink','oven','wbench','smelter'].map(id=>ROTS[id]);
    out.chips=['loom','mill','oven','wbench','smelter'].every(id=>[id,id+'>1',id+'>2'].every(n=>CHIPS[n]))&&['smelter#on','smelter>1#on','smelter>2#on'].every(n=>CHIPS[n]);
    /* 作業するマス：向きの前 */
    const j=(y0+2)*W+x0+2;out.cells=[0,1,2,3].map(r=>workCells(j,'loom',r).map(k=>[k%W-(x0+2),((k/W)|0)-(y0+2)]));
    out.mill=[0,1,2,3].map(r=>workCells(j,'mill',r).map(k=>[k%W-(x0+2),((k/W)|0)-(y0+2)]));
    out.wb=[0,1,2,3].map(r=>workCells(j,'wbench',r).map(k=>[k%W-(x0+2),((k/W)|0)-(y0+2)]));
    /* はたおり機を右向きに置いて、加工をたのむ：せいれいは右のマスに立つ */
    S.obj[j]='loom';S.rot[j]=1;const bx=(y0+5)*W+x0+6;S.obj[bx]='crate';recount();for(const k of Object.keys(S.mat))S.mat[k]=0;S.mat.kasa=6;boxSync();
    (S.prIn||(S.prIn={}))[j]={kasa:3};a.x=x0+6.5;a.y=y0+4.5;a.elem='wind';const G=bfs(a.x|0,a.y|0);out.stand=workStand(G,j);out.front=j+1;
    out.job=procJob(a,G);out.at=a.act&&a.act.stand;out.type=a.act&&a.act.type;endAct(a);a.act=null;
    /* 前に物を置くと、作業しない */S.obj[j+1]='crate';recount();out.ok2=workOK(j);out.want=procWant(a);out.job2=procJob(a,bfs(a.x|0,a.y|0));S.obj[j+1]='';delete S.prIn[j];
    /* 調理台（後ろ向き）：料理は上のマスに立つ */S.obj[j]='cooktable';S.rot[j]=2;recount();out.oven=ovenStand(bfs(a.x|0,a.y|0),j);out.ovenFront=j-W;
    /* 作業台（左向き）：台は下のマス、作業するマスは台の左 */S.obj[j]='';delete S.rot[j];wbenchAt(S,j,3);recount();out.wbs=wbenchStand(j,bfs(a.x|0,a.y|0));out.wbFront=j+W-1;
    /* 前のセーブ：かまどの反転（ROTS 1 の向き1）は、前向きにもどす。前がふさがった家具は数えるだけ */
    S.obj[j]='';S.obj[j+W]='';delete S.ref[j+W];delete S.rot[j];const k2=j+3;S.obj[k2]='oven';S.rot[k2]=1;S.obj[k2+W]='crate';delete S.flags.ovenRot4;recount();
    const sv=JSON.stringify(S);return JSON.stringify(Object.assign(out,{k2}))})()`));
  assert.deepEqual(o.rots,[4,4,4,4,4,4,4]);assert.ok(o.chips,'向きの絵');
  assert.deepEqual(o.cells,[[[0,1]],[[1,0]],[[0,-1]],[[-1,0]]],'1マス：前・右・後ろ・左');
  assert.deepEqual(o.mill,[[[0,2],[1,2]],[[2,0],[2,1]],[[0,-1],[1,-1]],[[-1,0],[-1,1]]],'2×2：前の2マス');
  assert.deepEqual(o.wb,[[[0,1]],[[1,0]],[[1,-1]],[[-1,1]]],'作業台：台のマスの前');
  assert.equal(o.stand,o.front);assert.equal(o.job,true);assert.equal(o.at,o.front,'右のマスに立つ');assert.equal(o.type,'proc');
  assert.equal(o.ok2,false);assert.equal(o.want,false);assert.equal(o.job2,false,'前がふさがると作業しない');
  assert.equal(o.oven,o.ovenFront,'後ろ向きの調理台は上のマス');assert.equal(o.wbs,o.wbFront,'左向きの作業台');
  /* セーブして読みこむ：かまどの反転は前向きに・ふさがった数 */
  const m=JSON.parse(await run(`(()=>{save();continueGame(load(WD));return JSON.stringify({rot:(S.rot||{})[${o.k2}]||0,flag:S.flags.ovenRot4,blocked:WORKBLOCKED.length,list:WORKBLOCKED.map(j=>S.obj[j])})})()`));
  assert.equal(m.rot,0);assert.equal(m.flag,1);assert.ok(m.list.includes('oven'),'前がふさがったかまどを数える '+JSON.stringify(m));
  assert.deepEqual(errors,[]);console.log('work-front ok',JSON.stringify(o),JSON.stringify(m));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
