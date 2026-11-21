/* 飼う生き物：柵でかこんだ所の小屋に空きがあると、朝にたまに村の外に野良が来る。おむかえすると、せいれいがつれてきて小屋にすむ。えさの草・水をせいれいが運び、夕方にとれる物を箱へ。夜は小屋へ。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const f=S.res[0];f.hunger=hMax(f);f.energy=100;f.fun=100;S.res=[f];endAct(f);f.act=null;S.t=1440*3+8*60;S.food=100;
    const out={};const x0=(f.x|0)+3,y0=(f.y|0)+2;
    /* 小屋がなく、小屋をまだひらめいていなくても、野良が来る。はじめてタップすると、その生き物の小屋をひらめく */
    {const R=Math.random,rc=S.recipes;S.recipes=Object.assign({},rc);delete S.recipes.coop;delete S.recipes.barn;S.ani=[];recount();Math.random=()=>0;strayMorning();Math.random=R;const a=S.ani[0];
      out.idea0=!!(a&&a.stray);if(a){S.flags.aniMet={hane:1,moko:1,tsuno:1};a.dr=1;document.querySelectorAll('.pxcard').forEach(c=>c.parentNode.remove());aniPop(a);out.ideaLearn=recipeKnown(ANI[a.k].hut);out.ideaNoPop=!document.querySelector('.pxcard');}
      S.recipes=rc;rc.coop=rc.barn=true;S.ani=[];S.flags.aniMet={};ITEM_GIFTS.length=0;document.querySelectorAll('.idea-reveal,.gift-reveal').forEach(e=>e.remove())}
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
    {const R=Math.random;Math.random=()=>.99;animalMorning();out.noStray=S.ani.length;Math.random=()=>0;strayMorning();Math.random=R}/* 5%：来ない日・来る日 */
    {const a=S.ani[0];out.stray=!!(a&&a.stray);out.strayOut=a?!VILL[(a.y|0)*W+(a.x|0)]:false;
      document.querySelectorAll('.pxcard').forEach(c=>c.parentNode.remove());out.atTap=aniAtTap(a.x,a.y-.3)===a;S.flags.aniMet={hane:1,moko:1,tsuno:1};/* はじめて会う演出は animal-meet.cjs */aniPop(a);const card=document.querySelector('.pxcard');out.spop=card?card.textContent:'';if(card)card.querySelector('.go').click();out.going=!!(f.act&&f.act.type==='astray');
      let led=-1,home=-1;for(let i=0;i<30000;i++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;S.t=Math.min(S.t,1440*3+12*60);stepWorld(.1);if(led<0&&f.act&&f.act.type==='alead')led=i;if(!a.stray){home=i;break}}
      out.led=led;out.home=home;out.inPen0=(PENS.get(coop)||[]).includes((a.y|0)*W+(a.x|0));out.h=a.h===coop}
    out.ani=S.ani.map(a=>a.k);out.inPen=S.ani.length?(PENS.get(coop)||[]).includes((S.ani[0].y|0)*W+(S.ani[0].x|0)):false;
    /* えさ：箱に草 */
    S.mat.shina=(S.mat.shina||0)+6;boxSync();
    const d=S.dyn[coop];const run=(n,cond)=>{for(let i=0;i<n;i++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;stepWorld(.1);if(cond())return i}return -1};
    out.feedAt=run(20000,()=>(d.feed||0)>0||S.ani[0].fd===callDay());
    out.ate=run(400,()=>S.ani[0].fd===callDay());
    out.waterAt=run(20000,()=>d.wd===callDay());
    /* 「しらべる」で生き物をタップ → 小さな画面 →「なでる」→ いちばん近いせいれいが、なでにいく → よろこぶ → たのしさ+5。1ぴき1日1回 */
    {const a0=S.ani[0];AJOY.delete(a0);S.t=1440*3+10*60;a0.path=null;a0.eat=0;f.fun=50;endAct(f);f.act=null;setMode&&setMode('look');
      document.querySelectorAll('.pxcard').forEach(c=>c.parentNode.remove());
      onTap((a0.x*TS-cam.x)*cam.z,((a0.y-.3)*TS-cam.y)*cam.z);
      const card=document.querySelector('.pxcard');out.pop=card?card.textContent:'';
      if(card)card.querySelector('.go').click();out.asked=!!(f.act&&f.act.type==='apetq');out.toastPet=[...document.querySelectorAll('#toasts > *')].map(x=>x.textContent).join('|');
      let joy=-1,chip=null;for(let i=0;i<20000;i++){S.food=100;f.hunger=hMax(f);f.energy=100;stepWorld(.1);if(AJOY.has(a0)){joy=i;chip=aniChip(a0,performance.now());break}}
      out.joy=joy;out.joyChip=chip===CHIPS['ani:hane#j0'];out.fun=f.fun;out.petD=a0.petD===callDay();
      onTap((a0.x*TS-cam.x)*cam.z,((a0.y-.3)*TS-cam.y)*cam.z);const c2=document.querySelector('.pxcard');if(c2)c2.querySelector('.go').click();
      out.again=!!(f.act&&f.act.type==='apetq');out.why=aniPetWhy(a0);if(c2)c2.parentNode.remove();
      for(const k of ['hane','moko','tsuno'])for(const j of ['j0','j1','j2'])if(!CHIPS['ani:'+k+'#'+j])out.noChip=(out.noChip||'')+k+j}
    /* 夕方：とれる物 */
    S.t=1440*3+17*60+5;out.prAt=run(200,()=>d.pr&&d.pr.egg>0);out.pr=d.pr&&d.pr.egg;out.expectedPr=aniYield(coop);
    const e0=S.fs.egg||0;out.colAt=run(30000,()=>(S.fs.egg||0)>e0);out.egg=S.fs.egg||0;
    /* 夜は小屋へ */
    S.t=1440*3+23*60+30;out.inAt=run(3000,()=>S.ani[0].in===1);
    /* 画面 */
    S.t=1440*4+9*60;openSheet('furn',coop);out.sec=Array.from(document.querySelectorAll('.sheet h3')).map(e=>e.textContent).find(t=>t.startsWith('すんでいる生き物'))||'';closeSheet();
    /* 小屋をこわすと、つぎの朝、野へかえる */
    /* 野良をタップすると、1ぴき1回だけ、50%で、とれる物を1こ落とす（小屋の生き物は落とさない） */{const R0=Math.random;Math.random=()=>0;const sd=[];for(const k of['hane','moko','tsuno']){S.drops=[];const b={id:200+sd.length,k,h:-1,stray:1,x:CX+.5,y:CY+6.6,face:1,wt:0};strayDrop(b);strayDrop(b);sd.push(S.drops.map(d=>d.id+':'+d.n+':'+!!d.tap).join())}
      S.drops=[];const hb={id:300,k:'hane',h:0,x:CX+.5,y:CY+6.6};aniPop(hb);document.querySelectorAll('.pxcard').forEach(c=>c.parentNode.remove());sd.push((S.drops||[]).length);Math.random=R0;S.drops=[];out.sdrop=sd}
    {S.ani.push({id:99,k:'hane',h:-1,stray:1,x:1.5,y:1.6,face:1,wt:0});S.hold=0;S.t=1440*4+18*60+1;run(30,()=>!S.ani.some(a=>a.id===99));out.strayGone=!S.ani.some(a=>a.id===99)}/* 野良は夕方に帰る */
    out.spots=['makiba','norakomichi','fureai','hidamari','hoshikusa'].filter(k=>SPOTS.some(p=>p.k===k)).length;out.hints=CHATS.filter(c=>['makiba','norakomichi','fureai','hidamari','hoshikusa'].includes(c.hint)).length;
    const base=S.ani[0],grass=PENS.get(coop).find(j=>!S.obj[j]);
    S.t=1440*5+8*60;base.in=0;base.pet=0;base.fd=null;base.x=grass%W+.5;base.y=(grass/W|0)+.6;
    S.obj[grass]='weed0g';animalTick(1);
    out.grazed=!S.obj[grass]&&base.fd===callDay();
    const pair={...base,id:100,fun:80};base.fun=81;S.ani.push(pair);
    const rnd=Math.random;Math.random=()=>.99;
    animalMorning();out.at80=aniOf(coop).length;
    base.fun=81;pair.fun=81;S.t+=1440;animalMorning();animalMorning();
    out.birth=aniOf(coop).filter(a=>a.born===callDay()).length;
    out.yield=aniYield(coop);Math.random=rnd;
    clearObj(coop);recount();animalMorning();out.left=S.ani.length;
    out.sub=!!SUBQ.find(q=>q.k==='animals1'&&!q.learn);
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.idea0,true,'stray comes without hut');assert.equal(r.ideaLearn,true,'tap learns hut');assert.equal(r.ideaNoPop,true,'idea instead of popup');assert.equal(r.fenceWalk,false,'fence blocks');assert.ok(r.pen>0,'pen found');assert.equal(r.huts,1);assert.equal(r.open,null,'open fence is not a pen');
  assert.equal(r.noStray,0,'no stray at 99%');assert.equal(r.stray,true,'stray came');assert.equal(r.strayOut,true,'outside village');
  assert.ok(r.spop.includes('野良のハネマリ')&&r.spop.includes('むかえる'),r.spop);assert.equal(r.atTap,true,'tap finds stray');assert.equal(r.going,true,'spirit goes');assert.ok(r.led>=0,'leading');assert.ok(r.home>=0,'settled');assert.equal(r.inPen0,true);assert.equal(r.h,true);
  assert.deepEqual(r.sdrop,['food:egg:1:true','mat:wool:1:true','food:milk:1:true',0],'stray drops '+r.sdrop);
  assert.equal(r.strayGone,true,'stray leaves at 18');assert.equal(r.spots,5);assert.equal(r.hints,5);
  assert.deepEqual(r.ani,['hane']);assert.equal(r.inPen,true);
  assert.ok(r.feedAt>=0,'feed carried');assert.ok(r.ate>=0,'animal ate');assert.ok(r.waterAt>=0,'watered');
  assert.ok(r.pop.includes('ハネマリ')&&r.pop.includes('とり小屋')&&r.pop.includes('なでる'),r.pop);assert.equal(r.asked,true,'pet asked');
  assert.ok(r.joy>=0,'animal joy');assert.equal(r.joyChip,true,'joy chip');assert.ok(r.fun>=54&&r.fun<=55,'fun +5 '+r.fun);assert.equal(r.petD,true);
  assert.equal(r.again,false,'once a day');assert.equal(r.why,'きょうは、もうなでた');assert.equal(r.noChip,undefined,'joy chips');
  assert.ok(r.prAt>=0&&r.pr===r.expectedPr,'egg produced');assert.ok(r.colAt>=0&&r.egg>0,'egg stored');assert.ok(r.inAt>=0,'goes in hut at night');
  assert.ok(r.sec.startsWith('すんでいる生き物（1/3）'),r.sec);assert.equal(r.grazed,true);assert.equal(r.at80,2);assert.equal(r.birth,1);assert.ok(r.yield>1);assert.equal(r.left,0);assert.equal(r.sub,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
