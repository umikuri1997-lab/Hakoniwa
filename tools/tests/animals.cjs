/* 飼う生き物：柵でかこんだ所の小屋に、つぎの朝すみつく。えさの草・水をせいれいが運び、夕方にとれる物を箱へ。夜は小屋へ。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const f=S.res[0];f.hunger=hMax(f);f.energy=100;f.fun=100;S.res=[f];endAct(f);f.act=null;S.t=1440*3+8*60;S.food=100;
    const out={};const x0=(f.x|0)+3,y0=(f.y|0)+2;
    /* 7×7 のかこい（柵）。中に、とり小屋（左上の近く）と水（池1マス） */
    const clear=(x,y)=>{const j=y*W+x;S.obj[j]='';delete S.ref[j];S.floor[j]='';S.ground[j]=0;if(S.fog)S.fog[j]=0};
    for(let y=y0-1;y<=y0+7;y++)for(let x=x0-1;x<=x0+7;x++)clear(x,y);
    for(let i=0;i<7;i++){S.obj[y0*W+x0+i]='fence';S.obj[(y0+6)*W+x0+i]='fence';S.obj[(y0+i)*W+x0]='fence';S.obj[(y0+i)*W+x0+6]='fence'}
    const gate=(y0+6)*W+x0+3;S.obj[gate]='gate';
    const coop=(y0+2)*W+x0+2;S.obj[coop]='coop';S.ground[(y0+2)*W+x0+4]=1;/* 水 */
    const crate=(y0+8)*W+x0+3;clear(x0+3,y0+8);S.obj[crate]='crate';
    recount();out.fenceWalk=walk(y0*W+x0);out.pen=(PENS.get(coop)||[]).length;out.huts=HUTS.length;
    /* 柵のドアを柵にかえると… → かこいはそのまま。柵を1つはずすと、かこいでない */
    S.obj[y0*W+x0+1]='';recount();out.open=PENS.get(coop);S.obj[y0*W+x0+1]='fence';recount();
    animalMorning();out.ani=S.ani.map(a=>a.k);out.inPen=S.ani.length?(PENS.get(coop)||[]).includes((S.ani[0].y|0)*W+(S.ani[0].x|0)):false;
    /* えさ：箱に草 */
    S.mat.shina=(S.mat.shina||0)+6;boxSync();
    const d=S.dyn[coop];const run=(n,cond)=>{for(let i=0;i<n;i++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;stepWorld(.1);if(cond())return i}return -1};
    out.feedAt=run(20000,()=>(d.feed||0)>0||S.ani[0].fd===callDay());
    out.ate=run(400,()=>S.ani[0].fd===callDay());
    out.waterAt=run(20000,()=>d.wd===callDay());
    /* 夕方：とれる物 */
    S.t=1440*3+17*60+5;out.prAt=run(200,()=>d.pr&&d.pr.egg>0);out.pr=d.pr&&d.pr.egg;
    const e0=S.fs.egg||0;out.colAt=run(30000,()=>(S.fs.egg||0)>e0);out.egg=S.fs.egg||0;
    /* 夜は小屋へ */
    S.t=1440*3+23*60+30;out.inAt=run(3000,()=>S.ani[0].in===1);
    /* 画面 */
    S.t=1440*4+9*60;openSheet('furn',coop);out.sec=Array.from(document.querySelectorAll('.sheet h3')).map(e=>e.textContent).find(t=>t.startsWith('すんでいる生き物'))||'';closeSheet();
    /* 小屋をこわすと、つぎの朝、野へかえる */
    clearObj(coop);recount();animalMorning();out.left=S.ani.length;
    out.sub=!!SUBQ.find(q=>q.k==='animals1'&&q.learn.includes('coop')&&q.learn.includes('barn'));
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.fenceWalk,false,'fence blocks');assert.ok(r.pen>0,'pen found');assert.equal(r.huts,1);assert.equal(r.open,null,'open fence is not a pen');
  assert.deepEqual(r.ani,['hane']);assert.equal(r.inPen,true);
  assert.ok(r.feedAt>=0,'feed carried');assert.ok(r.ate>=0,'animal ate');assert.ok(r.waterAt>=0,'watered');
  assert.ok(r.prAt>=0&&r.pr===1,'egg produced');assert.ok(r.colAt>=0&&r.egg>0,'egg stored');assert.ok(r.inAt>=0,'goes in hut at night');
  assert.ok(r.sec.startsWith('すんでいる生き物（1/3）'),r.sec);assert.equal(r.left,0);assert.equal(r.sub,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
