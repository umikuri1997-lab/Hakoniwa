/* ひっこしミトンで、飼う生き物をべつの小屋へ（animals.js の aniMovePick・aniMoveTap・aniMoveAsk）：
   生き物をタップ → 小屋をタップ → せいれいがつれていき、新しい小屋にすむ。すめない小屋・同じ小屋はことわる。夜になったら、もとの小屋の前へもどる */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;
    const f=S.res[0];f.hunger=hMax(f);f.energy=100;f.fun=100;S.res=[f];endAct(f);f.act=null;S.t=1440*3+8*60;S.food=100;S.mover=1;
    const out={};const x0=(f.x|0)+3,y0=(f.y|0)+2;
    const clear=(x,y)=>{const j=y*W+x;S.obj[j]='';delete S.ref[j];S.floor[j]='';S.ground[j]=0;if(S.fog)S.fog[j]=0};
    for(let y=y0-1;y<=y0+8;y++)for(let x=x0-1;x<=x0+15;x++)clear(x,y);
    const pen=(ox)=>{for(let i=0;i<7;i++){S.obj[y0*W+ox+i]='fence';S.obj[(y0+6)*W+ox+i]='fence';S.obj[(y0+i)*W+ox]='fence';S.obj[(y0+i)*W+ox+6]='fence'}S.obj[(y0+6)*W+ox+3]='gate'};
    pen(x0);pen(x0+8);const A=(y0+2)*W+x0+2,B=(y0+2)*W+x0+10;S.obj[A]='coop';S.obj[B]='coop';recount();
    const fa=hutFront(A)[0];S.ani=[{id:1,k:'hane',h:A,x:fa%W+.5,y:(fa/W|0)+.6,face:1,wt:2,born:0,fun:60}];
    const a=S.ani[0];
    setMode('bulk');selStamp='move';MOVESRC=null;
    out.pick=aniMovePick(a.x,a.y-.3)&&MOVESRC&&MOVESRC.k==='ani';out.name=moveName(MOVESRC);
    aniMoveTap(A%W,(A/W)|0);out.same=MOVESRC===null;/* 同じ小屋をタップしたら、やめる */
    aniMovePick(a.x,a.y-.3);aniMoveTap(x0+4,y0+3);out.notHut=!!MOVESRC;
    aniMoveTap(B%W,(B/W)|0);out.asked=MOVESRC===null&&a.mvh===1&&a.lh===B&&f.act&&f.act.type==='astray';
    let home=-1;for(let i=0;i<30000;i++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;S.t=Math.min(S.t,1440*3+12*60);stepWorld(.1);if(!a.mvh){home=i;break}}
    out.home=home;out.h=a.h===B;out.inPenB=(PENS.get(B)||[]).includes((a.y|0)*W+(a.x|0));out.oldN=aniOf(A).length;out.newN=aniOf(B).length;
    /* 夜になったら、やめて、もとの小屋の前へ */
    endAct(f);f.act=null;f.alead=null;aniMovePick(a.x,a.y-.3);aniMoveTap(A%W,(A/W)|0);out.asked2=a.mvh===1&&a.lh===A;
    for(let i=0;i<40;i++){S.food=100;f.hunger=hMax(f);stepWorld(.1)}
    S.t=1440*3+23*60+30;animalTick(.1);out.back=!a.mvh&&a.h===B&&a.lead==null;
    {const d=S.res[0];out.leadOff=!d.alead}
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.pick,true,'pick animal');assert.equal(r.name,'ハネマリ');assert.equal(r.same,true,'same hut cancels');assert.equal(r.notHut,true,'not a hut');
  assert.equal(r.asked,true,'spirit goes');assert.ok(r.home>=0,'moved');assert.equal(r.h,true);assert.equal(r.inPenB,true,'in new pen');assert.equal(r.oldN,0);assert.equal(r.newN,1);
  assert.equal(r.asked2,true);assert.equal(r.back,true,'night cancels');assert.equal(r.leadOff,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
