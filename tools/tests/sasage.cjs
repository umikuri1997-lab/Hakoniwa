/* 季節のささげもの：季節ごとに4つ（そのステージで手に入る物だけ・同じ季節はいつも同じ）。神殿をタップして「とどける」と、せいれいが箱から神殿へはこび、そろったらパワー。
   とどけられる物がないボタンは、押すと足りないと知らせる。季節がかわると、べつの4つになり、たのんでいた分はやめる */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const J=async s=>JSON.parse(await run(s));
  const a=await J(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;dialog=()=>{};
    const f=S.res[0];S.res=[f];endAct(f);f.act=null;S.t=1440*3+8*60;S.food=100;
    const tj=S.obj.indexOf('statueb');S.obj[tj]='statue';const x0=tj%W,y0=(tj/W|0)+3;for(let k=0;k<3;k++){const j=y0*W+x0-1+k;S.obj[j]='crate';S.ground[j]=0;if(S.fog)S.fog[j]=0}
    recount();S.mat.nuno=(S.mat.nuno||0)+5;S.mat.eda=(S.mat.eda||0)+20;boxSync();const I=n=>SASA.findIndex(b=>b.n===n);
    const out={statue:STATUE>=0};
    const P0=sasaPool(),k=seasonKey();out.pool=P0.map(i=>SASA[i].st).join('');out.same=JSON.stringify(sasaPick(k))===JSON.stringify(sasaPick(k));out.n=sasaPick(k).length;
    out.uniq=new Set(sasaPick(k)).size;out.sea=sasaPick(k).every(i=>SASA[i].sea===seasonOf(dayNo()));out.bulk=SASA.every(b=>Object.keys(b.need).length>=2);
    sasaEnsure();S.sasa.L=[{i:I('ふゆのしたく'),got:{},done:0},{i:I('てつのそなえ'),got:{},done:0}];boxSync();
    sasaPop();const bs=[...document.querySelectorAll('.sasab button')];out.btns=bs.length;out.lack1=bs[1].classList.contains('lack');
    bs[1].click();out.q1=JSON.stringify(S.sasaQ);bs[0].click();out.q=JSON.stringify(S.sasaQ);out.rsv=(S.rsv||{}).eda||0;
    const t=document.querySelector('.pxcard .t').textContent;out.title=t;document.querySelectorAll('.pxcard').forEach(c=>c.closest('div[style*="fixed"]').remove());
    const ap=addPt;addPt=()=>{};/* つりなど、ほかのパワーは数えない */const pt0=S.pt;let i=0;for(;i<200000&&!S.sasa.L[0].done;i++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;if(hour()>=19||hour()<7)S.t=(Math.floor(S.t/1440)+1)*1440+7*60;stepWorld(.1);if(!document.querySelector('#dialog').hidden)document.querySelector('#dialog').hidden=true;if(seasonKey()!==k)break}
    out.steps=i;out.done=S.sasa.L[0].done;out.got=JSON.stringify(S.sasa.L[0].got);out.pt=S.pt-pt0;addPt=ap;out.left=S.sasaQ?Object.keys(S.sasaQ).length:0;out.carry=!!f.sasa;
    S.sasa.L=[{i:I('ふゆのたくわえ'),got:{},done:0}];S.fs.imo=(S.fs.imo||0)+10;S.fs.komugiko=(S.fs.komugiko||0)+5;syncFood();boxSync();out.fq=sasaAsk(S.sasa.L[0]);let m=0;for(;m<200000&&!S.sasa.L[0].done;m++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;if(hour()>=19||hour()<7)S.t=(Math.floor(S.t/1440)+1)*1440+7*60;stepWorld(.1);if(!document.querySelector('#dialog').hidden)document.querySelector('#dialog').hidden=true}
    out.fdone=S.sasa.L[0].done;out.fgot=JSON.stringify(S.sasa.L[0].got);
    S.sasaQ={eda:3};S.t+=1440*SEASONDAYS;sasaEnsure();out.k2=S.sasa.k!==k;out.q2=Object.keys(S.sasaQ).length;out.L2=S.sasa.L.every(b=>!b.done);
    return JSON.stringify(out)})()`);
  assert.ok(a.statue,'temple');assert.ok(!a.pool.includes('v'),'no volcano items on the grassland: '+a.pool);assert.ok(a.same,'same season, same set');assert.equal(a.n,4);assert.equal(a.uniq,4);assert.ok(a.sea,'bundles of this season');assert.ok(a.bulk,'no bundle of just one material');
  assert.equal(a.btns,2);assert.equal(a.lack1,true,'no stone: the button tells what is missing');assert.equal(a.q1,'{}','pressing it asks nothing');
  assert.equal(a.q,'{"nuno":3,"eda":10}','asks only what is needed');assert.ok(a.rsv>=10,'the asked items are kept aside');assert.match(a.title,/のささげもの$/);
  assert.equal(a.done,1,'spirits carried everything ('+a.steps+' steps) '+a.got);assert.equal(a.pt,30,'power for the bundle');assert.equal(a.left,0);assert.equal(a.carry,false);
  assert.equal(a.fq,8,'asks 6 potatoes and 2 flour');assert.equal(a.fdone,1,'food is carried too: '+a.fgot);assert.ok(a.k2,'a new season gives a new set');assert.equal(a.q2,0,'old requests stop');assert.ok(a.L2);
  console.log('Sasage: delivered in '+a.steps+' steps, power +'+a.pt+', new season resets');
  assert.deepEqual(errors,[],'no page errors');await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
