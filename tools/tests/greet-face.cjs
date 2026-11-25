/* すれちがいのあいさつ：手をふるあいだ、2人はあいてのほうを向く（北のあいてはうしろ・南は正面・東西はよこ） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const o=JSON.parse(await run(`(()=>{if(S.res.length<2)S.res.push(mkRes(S,'tb','fire',CX+.5,CY+2.5));const a=S.res[0],b=S.res[1];a.nap=b.nap=false;const x=CX+3,y=CY+4,out={};
    const see=r=>{const v=SPV.get(r);return{back:v.back,turn:v.turn,f:r.face<0?-1:1,wave:r.waveU>S.t}};
    const R=Math.random;Math.random=()=>0;
    for(const[k,dx,dy]of[['north',0,-1],['south',0,1],['east',1,0],['west',-1,0]]){endAct(a);endAct(b);for(const[r,px,py]of[[a,x,y],[b,x+dx,y+dy]]){r.x=px+.5;r.y=py+.5;r.bubble='';r.greetT=0;r.greetStop=0;r.waveU=0;r.act={type:'walk',stage:'walk',t:0};r.path=[(py+3)*W+px]}
      for(const r of S.res)if(r!==a&&r!==b)r.greetT=S.t+999;
      passGreet(1.1);render(performance.now());out[k]={a:see(a),b:see(b)}}
    Math.random=R;return JSON.stringify(out)})()`));
  assert.ok(o.north.a.wave&&o.north.b.wave,'both wave');
  assert.deepEqual([o.north.a.back,o.north.a.turn],[true,0],'partner north: back view');
  assert.deepEqual([o.north.b.back,o.north.b.turn],[false,0],'partner south: front view');
  assert.deepEqual([o.south.a.back,o.south.b.back],[false,true]);
  assert.deepEqual([o.east.a.back,o.east.a.turn,o.east.a.f],[false,1,1],'partner east: side, right');
  assert.deepEqual([o.east.b.back,o.east.b.turn,o.east.b.f],[false,1,-1],'partner west: side, left');
  assert.deepEqual([o.west.a.turn,o.west.a.f,o.west.b.f],[1,-1,1]);
  console.log('Greet face: passing spirits face each other while waving');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
