/* 洞窟のまもりの光も、村と同じ「ため」：ぴったりにはなすと（glCh）、まわり+GLCHR マス・威力は pow の vc・音は glightc。
   1回で GLMULTI ひき以上たおすと、チャージが cd の vm 秒。はなすのが早い・おそいときは、ためていない光 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  const a=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    const nw=el=>{const q=mkRes(S,'h'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q};
    S.t=Math.floor(S.t/1440)*1440+9*60;S.pt=500;S.gup={};caveEnter(['fire','water','earth'].map(nw),{},0);const C=CV;C.sc=[];C.en=[];
    out.ch=[1000,2100,2500].map(ms=>{GLHOLD=ms;const r=glCh();GLHOLD=0;return r});
    const S0=[...C.ob].find(([,o])=>o.k==='S')[0],sx=cvX(S0),sy=cvY(S0);
    const mk=(x,y,hp)=>{const e={id:C.eid++,type:'basic',x:x+.5,y:y+.5+CVOY,hp,max:hp,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:cvJ(x,y)};C.en.push(e);return e};
    const r0=Math.random;Math.random=()=>.5;/* ダメージのぶれをなくす */
    const e0=mk(sx,sy,300),e1=mk(sx+1,sy,300);
    window.__snd=[];const f0=sfxAt;sfxAt=(k,...q)=>{if(k.startsWith('glight'))__snd.push(k);return f0(k,...q)};
    LIGHTCD=0;out.cast0=caveLight(sx,sy);LIGHTCD=0;out.cast1=caveLight(sx,sy,true);window.__e=[e0,e1];window.__r0=r0;out.pt=S.pt;
    return JSON.stringify(out)})()`));
  assert.deepEqual(a.ch,[false,true,false],'ぴったりのときだけ、ためた光');assert.equal(a.cast0,true);assert.equal(a.cast1,true);assert.equal(a.pt,498);
  await page.waitForFunction(()=>sacredEval('__snd.length>=2&&__e[0].hp<300-25'),{},{timeout:4000,polling:20});
  const b=JSON.parse(await run(`(()=>{const out={snd:__snd.slice().sort(),hp:__e.map(e=>e.hp)};const C=CV,[e0,e1]=__e,x=Math.floor(e0.x),y=Math.floor(e0.y)-CVOY;
    /* まとめてたおす：3びきで、チャージが vm 秒に */C.en=[];const mk=(dx)=>{const e={id:C.eid++,type:'basic',x:x+dx+.5,y:y+.5+CVOY,hp:5,max:5,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:cvJ(x+dx,y)};C.en.push(e);return e};
    mk(-1);mk(0);mk(1);LIGHTCD=lightCdMax();out.cd0=LIGHTCD;cvLightHit(x,y,1,true);out.cd1=LIGHTCD;out.vm=gupOf('cd').vm[0];
    C.en=[];mk(0);mk(1);LIGHTCD=lightCdMax();cvLightHit(x,y,1,true);out.cd2=LIGHTCD;Math.random=__r0;return JSON.stringify(out)})()`));
  console.log(JSON.stringify({a,b}));
  assert.deepEqual(b.snd,['glight','glightc'],'ためた光の音');
  assert.equal(b.hp[1],300-20,'となりのマス：ためた光だけとどき（まわり+1マス）、威力は vc の20');assert.ok(b.hp[0]<=300-10-20,'まん中：両方の光が当たる（起きたあと、パーティもたたく）');
  assert.equal(b.cd1,b.vm,'3びきたおすと、チャージが vm 秒');assert.equal(b.cd2,b.cd0,'2ひきでは、かわらない');
  assert.deepEqual(errors,[]);console.log('cave guard light charges like the village');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
