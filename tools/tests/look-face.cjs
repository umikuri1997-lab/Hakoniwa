/* となりの物で遊ぶ・見る（たき火・噴水・花で遊ぶ、新しい物を見にくる）ときは、その物のほうを向く（上の物はうしろ向き・よこはよこ・下は正面）。たき火・火にあたたまるしぐさは、ふきだしを出さない */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const o=JSON.parse(await run(`(()=>{const r=S.res[0];r.nap=false;const x=CX+3,y=CY+4,j=y*W+x,G=()=>bfs(x,y),out={};
    for(const[k,c]of[['up',j-W],['side',j+1],['down',j+W]]){for(const q of[j,j-W,j+W,j-1,j+1])S.obj[q]='';S.obj[c]='campfire';recount();r.x=x+.5;r.y=y+.5;r.path=[];endAct(r);
      startAct(r,G(),'play',j,{key:'o'+c,obj:c,what:'campfire',fun:25,dur:400,cap:3,pt:3,pw:1});render(performance.now());const v=SPV.get(r);out[k]={back:v.back,turn:v.turn,bub:r.bubble}}
    r.act={type:'quirk',stage:'do',t:8,dur:24,k:'warm',tg:j+1};ACT.quirk.tick(r,r.act,.1);out.warm=r.bubble;r.act.t=22;ACT.quirk.tick(r,r.act,.1);out.warm2=r.bubble;return JSON.stringify(out)})()`));
  assert.deepEqual(o.up,{back:true,turn:0,bub:''},'campfire above: back view');
  assert.deepEqual(o.side,{back:false,turn:1,bub:''},'campfire beside: side view');
  assert.deepEqual(o.down,{back:false,turn:0,bub:''},'campfire below: front view');
  assert.equal(o.warm,'');assert.equal(o.warm2,'');
  console.log('Look face: spirits face the campfire they play at, and warming shows no bubble');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
