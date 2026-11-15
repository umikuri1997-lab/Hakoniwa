/* しごと場の担当：伐採場・採石場は2人まで、炉は火のせいれい1人。担当がきまれば担当だけが働き、ふだんの仕事より先。なれ（時計の3時間で1つ）で、そのしごと場のはたらく速さ+10 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const a=S.res[0];a.hunger=hMax(a);a.energy=100;a.fun=100;const b=mkRes(S,'テスト木','wood',a.x+1,a.y);b.hunger=hMax(b);b.energy=100;b.fun=100;S.res=[a,b];for(const q of S.res){endAct(q);q.act=null}
    S.t=1440*3+10*60;S.food=100;const x0=a.x|0,y0=(a.y|0)+3;const j=y0*W+x0+2,c=y0*W+x0+5;for(const k of[j,c]){S.obj[k]='';delete S.ref[k]}S.obj[j]='lumber';S.obj[c]='crate';recount();
    const out={};const G=q=>bfs(q.x|0,q.y|0);
    /* 担当なし：だれでも使える */
    out.freeA=jobFor(j,a);out.freeB=jobFor(j,b);
    jobSet(j,a,true);out.own=jobOwners(j).map(q=>q.name);out.jobOf=jobOf(a)===j;out.forB=jobFor(j,b);
    /* 担当は、ふだんの仕事より先に、そのしごと場へ */
    S.food=100;endAct(a);a.act=null;out.work=goWork(a,G(a),true);out.act=a.act&&{type:a.act.type,obj:a.act.obj===j,camp:!!a.act.camp};
    /* 担当でない子は、そのしごと場を使わない */
    S.food=100;endAct(b);b.act=null;goWork(b,G(b),true);out.bCamp=!!(b.act&&b.act.camp&&b.act.obj===j);
    /* じっさいに動かすと、木材がふえ、なれがたまる */
    {const w0=matN(a)+(S.mat.wood||0),n0=(a.nare||{}).lumber||0;for(let i=0;i<4000;i++){S.food=100;a.hunger=hMax(a);a.energy=100;a.fun=100;updRes(a,.05)}out.gotWood=matN(a)+(S.mat.wood||0)>w0;out.nareUp=((a.nare||{}).lumber||0)>n0;delete a.nare}
    /* なれ */
    const fa={type:'chop',camp:true,obj:j};out.add0=nareAdd(a,fa);nareTick(a,fa,NARET);out.lv=nareLv(a,'lumber');out.add1=nareAdd(a,fa);out.addB=nareAdd(b,fa);
    nareTick(a,fa,NARET*20);out.lvMax=nareLv(a,'lumber');
    /* 画面 */
    openSheet('furn',j);const h3=Array.from(document.querySelectorAll('.sheet h3')).map(e=>e.textContent);out.sec=h3.find(t=>t.startsWith('担当のせいれい'))||'';closeSheet();
    /* 2人まで・1人1か所 */
    const q2=S.res.length;const c2=mkRes(S,'テスト土','earth',a.x,a.y+1);S.res.push(c2);jobSet(j,b,true);out.two=jobOwners(j).length;
    const k2=y0*W+x0-2;S.obj[k2]='';S.obj[k2]='quarry';recount();jobSet(k2,a,true);out.moved=jobOf(a)===k2&&!jobOwners(j).includes(a);
    /* こわしたら消える */
    clearObj(k2);out.cleared=!(S.jobOwn||{})[k2]&&jobOf(a)<0;
    /* 炉は火のせいれいだけ */
    out.smFire=jobOK({elem:'fire'},'smelter');out.smWood=jobOK({elem:'wood'},'smelter');
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.freeA,true);assert.equal(r.freeB,true);
  assert.deepEqual(r.own,[r.own[0]]);assert.equal(r.jobOf,true);assert.equal(r.forB,false,'others do not use an assigned station');
  assert.equal(r.work,true);assert.deepEqual(r.act,{type:'chop',obj:true,camp:true},'assigned spirit goes to its station first');
  assert.equal(r.bCamp,false);assert.equal(r.gotWood,true,'assigned spirit makes wood');assert.equal(r.nareUp,true,'nare grows while working');
  assert.equal(r.add0,0);assert.equal(r.lv,1);assert.ok(Math.abs(r.add1-0.1)<1e-9,'+10 work speed per nare');assert.equal(r.addB,0);assert.equal(r.lvMax,5);
  assert.ok(r.sec.startsWith('担当のせいれい（1/2）'),r.sec);
  assert.equal(r.two,2);assert.equal(r.moved,true,'one station per spirit');assert.equal(r.cleared,true);
  assert.equal(r.smFire,true);assert.equal(r.smWood,false);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
