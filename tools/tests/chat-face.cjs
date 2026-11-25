/* おしゃべり中の2人は、あいてのほうを向く（北のあいてはうしろ・南は正面・東西はよこ）。向かい合ってはねる（faceEach）ときも */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const o=JSON.parse(await run(`(()=>{if(S.res.length<2)S.res.push(mkRes(S,'tb','fire',CX+.5,CY+2.5));const a=S.res[0],b=S.res[1];a.nap=b.nap=false;const x=CX+3,y=CY+4,out={};
    const put=(r,px,py)=>{r.x=px+.5;r.y=py+.5;r.path=[];r.bubble=''};
    const see=r=>{const v=SPV.get(r);return{back:v.back,turn:v.turn,f:r.face<0?-1:1}};
    for(const[k,dx,dy]of[['north',0,-1],['south',0,1],['east',1,0],['west',-1,0]]){endAct(a);endAct(b);put(a,x,y);put(b,x+dx,y+dy);
      a.act={type:'chat',stage:'do',t:1,partner:b.id,topic:null,sub:0};b.act={type:'chat',stage:'do',t:1,partner:a.id,topic:null,sub:1};
      render(performance.now());out[k]={a:see(a),b:see(b)}}
    endAct(a);endAct(b);a.act=null;b.act=null;put(a,x,y);put(b,x,y+1);faceEach(a,b,3000);render(performance.now());out.hop={a:see(a),b:see(b)};
    return JSON.stringify(out)})()`));
  assert.deepEqual([o.north.a.back,o.north.a.turn],[true,0],'partner north: back view');
  assert.deepEqual([o.north.b.back,o.north.b.turn],[false,0],'partner south: front view');
  assert.deepEqual([o.south.a.back,o.south.b.back],[false,true]);
  assert.deepEqual(o.east.a,{back:false,turn:1,f:1},'partner east: side, right');
  assert.deepEqual(o.east.b,{back:false,turn:1,f:-1},'partner west: side, left');
  assert.deepEqual(o.west.a,{back:false,turn:1,f:-1});
  assert.deepEqual([o.hop.a.back,o.hop.b.back],[false,true],'faceEach: face each other');
  console.log('Chat face: chatting spirits face each other');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
