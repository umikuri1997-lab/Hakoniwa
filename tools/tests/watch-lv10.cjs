/* 見張り台の強化は Lv10 まで。絵は段階ごとに1まい。Lv5 からあかり（あかりとして数える）。Lv8 から2人立てて、2人ともうつ */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;USERPAUSE=true;
    const f=S.res[0],x0=(f.x|0)+8,y0=(f.y|0)+5;if(S.fog)S.fog.fill(0);
    for(let b=-10;b<12;b++)for(let a=-10;a<12;a++){const k=(y0+b)*W+x0+a;S.obj[k]='';S.ground[k]=0;S.hi[k]=0;S.floor[k]='';delete S.ref[k];delete S.dyn[k]}
    const j=y0*W+x0;S.obj[j]='watch';setParts('watch',j,'part');const o={};
    o.chips=[1,2,3,4,5,6,7,8,9,10].map(L=>{S.hp['L'+j]=L;const c=chipOf('watch',j);return c&&c===CHIPS[L>1?'watch@'+L:'watch']}).every(Boolean);
    o.tbl=WATCH.length===11&&WUP.length===10&&!WUP[10];
    S.hp['L'+j]=4;recount();o.lit4=LITP.includes(j)||LIGHTS.includes(j)||(counts.watchlight||0)>0;
    S.hp['L'+j]=5;recount();o.lit5=LITP.includes(j)&&LIGHTS.includes(j)&&CN(LIGHTQ)>=1;
    o.cap7=(S.hp['L'+j]=7,wpCap(j));o.cap8=(S.hp['L'+j]=8,wpCap(j));recount();
    /* 夜、コワイノがいるとき、木のせいれい2人が、どちらも同じ見張り台へ */
    S.t=1440*3+23.5*60;const ws=S.res.filter(q=>q.elem!=='fire').slice(0,2);while(ws.length<2){const q=Object.assign({},S.res[0],{id:900+ws.length,elem:'wood',act:null,path:[]});S.res.push(q);ws.push(q)}
    for(const q of ws){q.act=null;q.path=[];q.hunger=900;q.meal=null;q.x=x0+0.5;q.y=y0+3.5;q.hidden=false;q.coffin=null}
    S.enemies=[{id:1,type:'basic',x:x0+5,y:y0+16,hp:9999,max:9999,spawned:true,path:[],atk:0,stun:0,flash:0}];
    for(const q of ws)decide(q);o.both=ws.map(q=>q.act&&q.act.type==='watchpost'&&q.act.obj===j);
    for(const q of ws){q.act.stage='do';ACT.watchpost.start(q,q.act);for(let i=0;i<40;i++)ACT.watchpost.tick(q,q.act,0.5)}
    o.slots=ws.map(q=>q.act.slot).sort().join(',');o.xs=ws.map(q=>Math.round((q.x-x0)*100)/100).sort().join(',');
    S.enemies[0].x=x0+1;S.enemies[0].y=y0+6;S.inv.arrow=50;S.hp['w'+j]=0;S.hp['w'+j+'_1']=0;const a0=S.inv.arrow;updTowers(0.01);o.shots=a0-S.inv.arrow;o.t0=S.hp['w'+j]>0;o.t1=S.hp['w'+j+'_1']>0;
    S.hp['L'+j]=7;for(const q of ws)endAct(q);S.enemies[0].x=x0+5;S.enemies[0].y=y0+16;for(const q of ws){q.x=x0+.5;q.y=y0+3.5;q.wpNo=0}const q0=ws[0],q1=ws[1];decide(q0);decide(q1);o.one7=[q0,q1].filter(q=>q.act&&q.act.type==='watchpost'&&q.act.obj===j).length;
    return JSON.stringify(o)})()`));
  console.log(r);
  assert.equal(r.chips,true,'chip per level');assert.equal(r.tbl,true,'10 levels');
  assert.equal(r.lit4,false,'no light below Lv5');assert.equal(r.lit5,true,'Lv5 light counts');
  assert.equal(r.cap7,1);assert.equal(r.cap8,2);
  assert.deepEqual(r.both,[true,true],'two go to Lv8 tower');assert.equal(r.slots,'0,1');assert.equal(r.xs,'0.5,1.5');
  assert.equal(r.shots,2,'both shoot');assert.equal(r.t0&&r.t1,true);
  assert.equal(r.one7,1,'Lv7 only one');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
