/* 出撃：火のせいれいでない子も「出撃する」で近接（属性ごと SORTIE）。火のせいれいは「出撃しない」で見張り台に立ち、矢2本・延焼。えらべるのは6時〜23時 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const h=S.res[0];h.hunger=hMax(h);h.energy=100;S.res=[h];endAct(h);h.act=null;
    const before=fighter(h);S.flags.sortie=1;h.sortie=true;const after=fighter(h);
    S.enemyOn=true;S.t=1440*2+23.5*60;S.nightHad=1;
    const out={before,after};
    for(const el of ['wood','earth','wind','water']){h.elem=el;h.fatk=0;endAct(h);h.act=null;
      const e={id:900,type:'basic',x:h.x+1.0,y:h.y,hp:EN.basic.hp,max:EN.basic.hp,spawned:true,path:[]};S.enemies=[e];const hp0=e.hp;
      for(let i=0;i<200;i++){S.t+=.05;e.x=h.x+1.0;e.y=h.y;updRes(h,.05)}
      out[el]={dmg:hp0-e.hp,stun:e.stun||0}}
    out.hit=!!S.flags.sortieHit;
    /* 火のせいれいが見張り台：延焼・矢2本 */
    h.elem='fire';h.sortie=false;out.fireFighter=fighter(h);
    const j=((h.y|0)+3)*W+(h.x|0)-6;S.obj[j]='watch';setParts('watch',j,'part');recount();
    h.act={type:'watchpost',stage:'do',cl:1,obj:j};S.inv.arrow=10;S.hp['w'+j]=0;
    const e={id:901,type:'basic',x:(j%W)+1,y:((j/W)|0)+2,hp:EN.basic.hp,max:EN.basic.hp,spawned:true,path:[]};S.enemies=[e];const hp0=e.hp;
    updTowers(.05);out.arrows=S.inv.arrow;out.brn=e.brn;out.shot=hp0-e.hp;
    S.hp['w'+j]=99;const hp1=e.hp;for(let i=0;i<200;i++){e.stun=1;updEnemy(e,.05)}out.burnDmg=hp1-e.hp;out.brnLeft=e.brn;
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.before,false,'not learned: non-fire does not fight');assert.equal(r.after,true);
  assert(r.wood.dmg>0&&r.earth.dmg>0&&r.wind.dmg>0,'non-fire melee damages');assert.equal(r.water.dmg,0,'water no damage');assert(r.water.stun>=3,'water stops');
  assert.equal(r.hit,true,'quest flag');assert.equal(r.fireFighter,false);
  assert.equal(r.arrows,8,'fire on tower uses 2 arrows');assert.equal(r.brn,3,'burn applied');assert.equal(r.burnDmg,9,'burn 3x3');assert.equal(r.brnLeft,0);
  /* 夜は切りかえられない */
  const ui=await run(`(()=>{const h=S.res[0];h.elem='wood';delete h.sortie;S.t=1440*3+23.5*60;openSheet('res',h.id);const b=Array.from(document.querySelectorAll('.sheet button')).find(x=>x.textContent==='たたかう');if(!b)return 'nobtn';b.click();const n=fighter(h);S.t=1440*4+10*60;openSheet('res',h.id);const b2=Array.from(document.querySelectorAll('.sheet button')).find(x=>x.textContent==='たたかう');b2.click();return JSON.stringify({night:n,day:fighter(h)})})()`);
  console.log(ui);const u=JSON.parse(ui);assert.equal(u.night,false);assert.equal(u.day,true);
  /* こもれびのまもり：出撃しているフタバのまわり3マスだけ。見張り台・出撃しないときは使わない */
  const g=JSON.parse(await run(`(()=>{S.flags.guard=true;S.flags.sortie=0;const f=S.res[0];f.name=POKO;f.elem='wood';delete f.sortie;f.hunger=hMax(f);endAct(f);f.act=null;f.gcd=0;f.gw=null;S.t=1440*5+23.5*60;S.enemyOn=true;
    const h=mkRes(S,'テスト火','fire',f.x+2,f.y);S.res=[f,h];const out={fdef:fighter(f),ui:sortieOK(f)};
    const try1=(dx)=>{h.x=f.x+dx;h.y=f.y;h.shU=0;f.gcd=0;f.gw=null;S.enemies=[{id:950,type:'basic',x:h.x+1,y:h.y,hp:100,max:100,spawned:true,path:[]}];guardTick();S.t+=1;guardTick();return (h.shU||0)>S.t};
    out.near=try1(2);out.far=try1(6);f.sortie=false;out.off=try1(2);delete f.sortie;return JSON.stringify(out)})()`));
  console.log(g);assert.equal(g.fdef,true,'futaba sorties after guard');assert.equal(g.ui,true);assert.equal(g.near,true,'guards within 3');assert.equal(g.far,false,'not far');assert.equal(g.off,false,'not when not sortied');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
