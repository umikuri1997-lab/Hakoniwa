/* 強化のイベント（火山だけ）：火まつり・温泉宿の大うたげ・温泉めぐりが、ひらいて最後まで動く。草原だけの花まつりは出ない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780},world:1});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=true;S.enemies=[];NOSAVE=true;
    for(const el of ['wood','earth','water','wind'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=60}
    S.pt=5000;S.mat.wood=80;S.mat.bamboo=40;for(let i=0;i<99;i++)addFood('apple',1);S.t=12*60;springOn=()=>true;/* 温泉は、よみがえったことにする */`);
  assert.equal(await run(`evOn('hana')`),false,'hana is grass only');assert.equal(await run(`evOn('himatsuri')&&evOn('utage')&&evOn('onsen')`),true);
  const sim=(m)=>run(`(()=>{const end=S.t+${m};let n=0;while(S.t<end&&n<40000){stepWorld(1.5);for(const r of S.res){updRes(r,1.5);r.hunger=Math.max(r.hunger,800);r.energy=Math.max(r.energy,80)}S.enemies=[];n++;if(!S.ev)break}return n})()`);
  const put=(id,x,y,sz)=>`{const j=(${y})*W+(${x});for(let b=0;b<${sz||1};b++)for(let a=0;a<${sz||1};a++){const k=j+b*W+a;S.obj[k]=a||b?'part':'${id}';if(a||b)S.ref[k]=j;S.ground[k]=0}}`;
  for(const [id,day,setup] of [['onsen',3,''],['himatsuri',7,put('campfire','CX+3','CY+6')+put('lamp','CX+1','CY+5')+put('lamp','CX+5','CY+5')+put('lamp','CX+3','CY+8')],['taikokai',15,put('taiko','CX-4','CY+6')],['ocha',16,put('chadogu','CX+6','CY+6')],['hokomairi',17,put('hokora','CX+6','CY-6')],['utage',18,"{const a=(CY+5)*W+CX-6;S.obj[a]='table';S.obj[a+1]='part';S.ref[a+1]=a;const b=(CY+7)*W+CX-6;S.obj[b]='table';S.obj[b+1]='part';S.ref[b+1]=b}"]]){
    const o=JSON.parse(await run(`(()=>{const t=(${day}-1)*1440+15*60;if(t>S.t)S.t=t;${setup}recount();const ok=evOpen('${id}',S.res.map(r=>r.id));return JSON.stringify({ok:!!ok,why:evWhy('${id}'),day:S.ev&&S.ev.day})})()`));
    assert.ok(o.ok,id+' opened '+JSON.stringify(o));
    const before=JSON.parse(await run(`JSON.stringify(S.res.map(r=>Object.assign({},r.est)))`));
    await run(`S.t=(S.ev.day-1)*1440+(EVENTS['${id}'].at-0.1)*60`);await sim(60*10);
    const r=JSON.parse(await run(`JSON.stringify({ev:S.ev,est:S.res.map(r=>r.est||{})})`));assert.equal(r.ev,null,id+' finished');
    const k=Object.keys(await run(`EVENTS['${id}'].gain`))[0],g=r.est.map((e,i)=>(e[k]||0)-(before[i][k]||0));console.log(id,k,JSON.stringify(g));assert.ok(g.filter(x=>x>0).length>=4,id+' most joined')}
  await page.waitForTimeout(300);assert.deepEqual(errors,[]);await browser.close();console.log('Events (volcano): ok');
})().catch(e=>{console.error(e);process.exit(1)});
