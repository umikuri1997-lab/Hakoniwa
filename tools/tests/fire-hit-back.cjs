/* 火のせいれいは、自分やほかの火のせいれいを、とどかない所からたたくコワイノ（オオカゲなど）に近よって攻撃する */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:1});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.enemyOn=true;USERPAUSE=true;S.t=1440*2+23.5*60;
    const h=S.res[0];h.nap=false;h.hunger=hMax(h);h.energy=100;S.res=[h];endAct(h);h.act=null;
    const e={type:'boss',x:h.x+2.0,y:h.y,hp:EN.boss.hp,spawned:true,path:[],tg:h.id};S.enemies=[e];
    const g0=foeGuard(e,h),hp0=e.hp;let walked=0;
    for(let i=0;i<400;i++){S.t+=.05;updRes(h,.05);if(h.act&&h.act.type==='patrol'&&h.act.hunt!=null)walked=1}
    return JSON.stringify({guard:g0,walked,hit:hp0-e.hp})})()`));
  console.log(r);
  assert.equal(r.guard,true,'enemy hitting the fire spirit is a target');assert.equal(r.walked,1,'moves toward it');assert(r.hit>0,'attacks it');
  /* 壁をこわしているコワイノは、むれ（3びき）でも近よって攻撃する */
  const w=JSON.parse(await run(`(()=>{const h=S.res[0];const wx=(h.x|0)+6,wy=h.y|0,wj=wy*W+wx;S.obj[wj]='hwall';recount();
    S.enemies=[];for(let i=0;i<3;i++)S.enemies.push({type:'basic',x:wx+1.5,y:wy+.5+i*.4,hp:EN.basic.hp,spawned:true,path:[],hitT:S.t});
    endAct(h);h.act=null;h.x=wx-4+.5;h.y=wy+.5;h.fatk=0;let go=0;const hp0=S.enemies.map(e=>e.hp);
    for(let i=0;i<300;i++){S.t+=.05;for(const e of S.enemies)e.hitT=S.t;updRes(h,.05);if(h.act&&h.act.hunt!=null)go=1}
    return JSON.stringify({mob:foeMobbed(S.enemies[0]),go,hit:S.enemies.reduce((s,e,i)=>s+hp0[i]-e.hp,0)})})()`));
  console.log(w);assert.equal(w.mob,true);assert.equal(w.go,1,'goes to the wall breakers');assert(w.hit>0,'attacks them');
  /* 箱からぬすんでいるカゲドロボウは、むれでも近よって攻撃する */
  const th=JSON.parse(await run(`(()=>{const h=S.res[0];const bx=(h.x|0)+6,by=h.y|0;S.obj[by*W+bx]='crate';recount();
    S.enemies=[];for(let i=0;i<3;i++)S.enemies.push({type:'thief',x:bx+1.5,y:by+.5+i*.4,hp:EN.thief.hp,spawned:true,path:[],stealKey:'box:'+(by*W+bx),busyT:S.t});
    endAct(h);h.act=null;h.x=bx-4+.5;h.y=by+.5;h.fatk=0;let go=0;const hp0=S.enemies.map(e=>e.hp);const g=foeGuard(S.enemies[0],h);
    for(let i=0;i<800;i++){S.t+=.05;for(const e of S.enemies)e.busyT=S.t;updRes(h,.05);if(h.act&&h.act.hunt!=null)go=1}
    return JSON.stringify({g,go,hit:S.enemies.reduce((s,e,i)=>s+hp0[i]-e.hp,0)})})()`));
  console.log(th);assert.equal(th.g,true);assert.equal(th.go,1,'goes to the thieves');assert(th.hit>0,'attacks them');
  /* 見張り台の画面：強化するボタンがいちばん上 */
  const ui=await run(`(()=>{const h=S.res[0];const j=((h.y|0)+3)*W+(h.x|0)-6;S.obj[j]='watch';setParts('watch',j,'part');recount();openSheet('watch',j);const f=document.querySelector('#sheetBody,.sheet .body')||document.querySelector('.sheet');const b=Array.from(document.querySelectorAll('.sheet button')).find(x=>x.textContent==='強化する');const all=Array.from(b.parentNode.children);return all.indexOf(b)})()`);
  console.log('upgrade button index',ui);assert.equal(ui,0,'upgrade button first');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
