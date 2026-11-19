/* 見張り台の弓：うつと決まったら、まず引きはじめて、ひきしぼる音（bowdraw）。BOW_REL たって、はなすときに、矢が飛ぶ音（shoot）・矢・ダメージ。うつ間かくは引きはじめから */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;USERPAUSE=true;
    const f=S.res[0],x0=(f.x|0)+8,y0=(f.y|0)+5;if(S.fog)S.fog.fill(0);
    for(let b=-10;b<12;b++)for(let a=-10;a<12;a++){const k=(y0+b)*W+x0+a;S.obj[k]='';S.ground[k]=0;S.hi[k]=0;S.floor[k]='';delete S.ref[k];delete S.dyn[k]}
    const j=y0*W+x0;S.obj[j]='watch';setParts('watch',j,'part');S.hp['L'+j]=1;recount();
    const q=Object.assign({},S.res[0],{id:901,elem:'wood',act:null,path:[],hidden:false,coffin:null,x:x0+.5,y:y0+.5});S.res.push(q);
    q.act={type:'watchpost',obj:j,stage:'do',cl:1,slot:0};
    S.enemies=[{id:1,type:'basic',x:x0+1,y:y0+6,hp:9999,max:9999,spawned:true,path:[],atk:0,stun:0,flash:0}];
    const S0=[],o0=sfxAt;sfxAt=(k,...a)=>{S0.push(k);return o0(k,...a)};
    S.inv.arrow=50;S.hp['w'+j]=0;const a0=S.inv.arrow,hp0=S.enemies[0].hp,o={};
    updTowers(.01);o.draw={snd:S0.join(','),arrows:a0-S.inv.arrow,hp:hp0-S.enemies[0].hp,bow:!!q.bowT,q:!!BOWQ['w'+j]};S0.length=0;
    updTowers(.01);o.wait={snd:S0.join(','),arrows:a0-S.inv.arrow};
    BOWQ['w'+j].t=0;updTowers(.01);o.rel={snd:S0.join(','),arrows:a0-S.inv.arrow,hp:hp0-S.enemies[0].hp>0,cd:S.hp['w'+j],q:!!BOWQ['w'+j]};
    o.cd0=WATCH[1].cd/rMul(q,'work');o.times=[BOW_PULL,BOW_REL,BOW_ALL];sfxAt=o0;
    S.enemies[0].x=x0+30;S.hp['w'+j]=0;updTowers(.01);o.far=!BOWQ['w'+j];
    return JSON.stringify(o)})()`));
  console.log(r);
  assert.equal(r.draw.snd,'bowdraw','draw sound first');assert.equal(r.draw.arrows,0);assert.equal(r.draw.hp,0);assert.equal(r.draw.bow,true);assert.equal(r.draw.q,true);
  assert.equal(r.wait.snd,'');assert.equal(r.wait.arrows,0);
  assert.equal(r.rel.snd,'shoot','shoot at release');assert.equal(r.rel.arrows,1);assert.equal(r.rel.hp,true);assert.equal(r.rel.q,false);
  assert.ok(Math.abs(r.rel.cd-(r.cd0-.02))<1e-6,'interval counted from draw start');
  assert.deepEqual(r.times,[850,1000,1250]);assert.equal(r.far,true,'no draw when out of range');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
