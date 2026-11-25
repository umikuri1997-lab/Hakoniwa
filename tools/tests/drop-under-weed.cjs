/* 草の下の落とし物：タップすると、草と落とし物の両方に「とりにいく」の印。草を入れる箱がなくても、落とし物は印がつく。罠のマスの落とし物も印がつき、せいれいが拾う */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
const one=kind=>run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.enemyOn=false;S.t=1440+10*60;mode='look';if(typeof spotSceneReset==='function')spotSceneReset();
 const r=S.res[0];r.nap=false;r.hunger=hMax(r);r.energy=100;r.fun=90;const x=r.x|0,y=r.y|0;let k=-1;for(let b=3;b<=6&&k<0;b++)for(let a=-3;a<=3;a++){const q=(y+b)*W+x+a;if(!S.obj[q]&&!S.floor[q]&&walk(q)&&!S.ground[q]){k=q;break}}
 if('${kind}'==='weedbox')S.obj[k-2]='crate';S.obj[k]='${kind}'.startsWith('weed')?[...WEEDS][0]:'${kind}';recount();if(typeof spotSceneReset==='function')spotSceneReset();S.wreq={};
 const d={x:k%W,y:(k/W)|0,id:'${kind}'==='weedbox'?'mat:wood':'sand',n:1};S.drops=[d];
 const X=k%W+.5,Y=((k/W)|0)+.5,q=ptS(X,Y,X*TS,(Y-.1)*TS);onTap(q.x,q.y);const o={tap:!!d.tap,wreq:Object.keys(S.wreq).length};
 const here=()=>S.drops.some(q=>q.y*W+q.x===k);r.act=null;r.path=[];for(let i=0;i<3000&&here();i++)updRes(r,.25);o.left=here()?1:0;if('${kind}'==='weedbox')S.obj[k-2]='';S.obj[k]='';recount();return JSON.stringify(o)})()`).then(JSON.parse);
const w=await one('weed');assert.equal(w.tap,true,'drop under grass is marked even without a box for grass');assert.equal(w.left,0);
const sp=await one('spike');assert.equal(sp.tap,true);assert.equal(sp.left,0);
const wb=await one('weedbox');assert.equal(wb.tap,true);assert.equal(wb.wreq,1,'grass is also marked');assert.equal(wb.left,0);
assert.deepEqual(errors,[]);console.log('Drops under grass and on traps: tap marks them and spirits pick them up');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
