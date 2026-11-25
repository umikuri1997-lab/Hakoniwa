/* 流れ星の夜：20〜23時・雨でない夜に流れる・星そのものをタップでおねがい・つぎの朝にかなう・ひまなせいれいは見上げる */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const out={};const q0=Math.random;
    const day=dayNo();S.t=Math.floor(S.t/1440)*1440+20*60+10;S.rain=false;S.starN=null;Math.random=()=>.1;starTick();Math.random=q0;out.at=S.starN.at>20&&S.starN.at<23;
    S.t=Math.floor(S.t/1440)*1440+22*60+50;starTick();out.star=!!STAR;out.once=(STAR=null,starTick(),!!STAR);
    /* 雨の夜は流れない */S.starN=null;S.rain=true;S.t=Math.floor(S.t/1440)*1440+20*60+10;Math.random=()=>.1;starTick();Math.random=q0;S.t=Math.floor(S.t/1440)*1440+22*60+50;starTick();out.rain=!!STAR;S.rain=false;
    /* 流れたあと2晩は流れない・3晩目は流れる */{const t0=Math.floor(S.t/1440)*1440+20*60+10,d0=dayNo();S.starN={last:d0};out.gap=[1,2,3].map(k=>{S.t=t0+k*1440;starTick();return S.starN.at>0});S.t=t0}
    /* 望遠鏡：つぎの1晩だけ */{const j=S.obj.indexOf(''),t0=S.t,d0=dayNo();S.obj[j]='telescope';S.starN={last:d0};out.gapT=[1,2].map(k=>{S.t=t0+k*1440;starTick();return S.starN.at>0});S.obj[j]='';S.t=t0}
    /* 雨で流れなかったら、つぎの夜に流れる */{const t0=S.t,d0=dayNo();S.starN={last:d0-5};S.rain=true;starTick();S.t=t0+160;starTick();const r1=!!STAR;S.rain=false;S.t=t0+1440;starTick();out.rainNext=[r1,S.starN.at>0];STAR=null;S.t=t0}
    /* 見上げる */starStart();const a=S.res[0];a.act={type:'idle',stage:'do',t:0,dur:9};out.look=starLook(a,performance.now());a.act={type:'chop',stage:'do',t:0};out.workLook=starLook(a,performance.now());
    /* 星そのものをタップしたときだけ、おねがい */{const n=performance.now(),pp=Math.min(1,(n-STAR.t0)/STARMS),hx=(STAR.x0+(STAR.x1-STAR.x0)*pp)*VW,hy=(STAR.y0+(STAR.y1-STAR.y0)*pp)*VH;out.miss=starTap(hx,hy+200);out.missPop=!!document.querySelector('.idea-reveal');out.tap=starTap(hx,hy)}const bs=[...document.querySelectorAll('.idea-reveal .btn')];out.opts=bs.map(b=>b.textContent);bs[2].click();out.wish=S.starW&&S.starW.k;out.tap2=starTap(0,0);
    /* つぎの朝：げんきに */for(const q of S.res)q.fun=50;S.t+=1440;starMorning();out.fun=S.res[0].fun;out.cleared=S.starW;
    /* ゆたかに：素材15こ */const m0=Object.values(S.mat).reduce((x,y)=>x+y,0);S.starW={d:dayNo()-1,k:'yutaka'};starMorning();out.mat=Object.values(S.mat).reduce((x,y)=>x+y,0)-m0;
    /* 前の日でないおねがいは、かなわない */S.starW={d:dayNo()-3,k:'genki'};for(const q of S.res)q.fun=50;starMorning();out.old=S.res[0].fun;
    /* 絵 */STAR={t0:performance.now()-1000,x0:.8,y0:.1,x1:.3,y1:.35,tap:true};drawStar(performance.now());out.drawn=!!STAR;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.at,true);assert.equal(r.star,true);assert.equal(r.once,false,'1晩に1回');assert.equal(r.rain,false);assert.deepEqual(r.gap,[false,false,true],'2晩あける');assert.deepEqual(r.gapT,[false,true],'望遠鏡は1晩');assert.deepEqual(r.rainNext,[false,true],'雨のつぎの夜');
  assert.equal(r.look,true);assert.equal(r.workLook,false);assert.equal(r.miss,false,'星でない所のタップは、ふつうのタップ');assert.equal(r.missPop,false);assert.equal(r.tap,true);assert.equal(r.opts.length,3);assert.equal(r.wish,'genki');assert.equal(r.tap2,false);
  assert.equal(r.fun,70);assert.equal(r.cleared,null);assert.equal(r.mat,15);assert.equal(r.old,50);assert.equal(r.drawn,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
