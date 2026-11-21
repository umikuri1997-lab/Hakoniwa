/* 闇のステージのクリアのあと：クリアした日の夜にツキミ（闇のせいれい）が生まれる → 夜はねむるせいれいのそばで見守る（つかれのとれる速さ1.5倍） → 朝ねむる。追いはらったコワイノは夜のほうへかえる見た目 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:5});
  await run(`window.__dlg=async(max)=>{const W8=ms=>new Promise(f=>setTimeout(f,ms));for(let i=0;i<(max||80);i++){if(typeof sheet!=='undefined'&&sheet!=null)closeSheet();const d=document.querySelector('#dialog');if(d.hidden){await W8(30);if(document.querySelector('#dialog').hidden)return}DLGA&&(DLGA.ff=1);const b=document.querySelector('#dlgBtns button')||document.querySelector('#dialog');b.click();await W8(40)}};
    window.__at=(d,h)=>{S.t=(d-1)*1440+h*60;S.hold=0};`);
  const r=JSON.parse(await run(`(async()=>{const out={};S=newState(5);LIVE[5]=S;setWorld(5);document.querySelector('#dialog').hidden=true;S.introSeen=true;S.t=10*60;glHit(CX+2,CY+2,0);await __dlg();
    const t=S.res.find(x=>x.name===TOMORI);const h2=mkRes(S,HIIRO,'fire',CX+3.5,CY+3.5);S.res.push(h2);S.enemyOn=false;S.enemies=[];const Y=yamiState();Y.cr=(CY-16)*W+CX-1;
    S.quest=QUESTS.length;S.qStory=null;S.cleared=true;S.flags.yamiEnd=1;S.flags.yamiEndD=dayNo();recount();
    __at(dayNo(),19.9);for(let i=0;i<6;i++)stepWorld(.5);out.before=!S.res.some(q=>q.name===TSUKIMI);
    __at(dayNo(),20.2);stepWorld(.5);out.dlg=!document.querySelector('#dialog').hidden;await __dlg();const k=S.res.find(q=>q.name===TSUKIMI);out.born=!!k&&k.elem;out.flag=S.flags.tsukimi;out.fight=sortieOK(k);out.keys=ELEM_KEYS.includes('dark');
    __at(dayNo(),23.2);let ok=false;for(let i=0;i<600&&!ok;i++){stepWorld(.5);ok=k.act&&k.act.type==='tkwatch'&&k.act.stage==='do'&&S.res.some(q=>q!==k&&q.act&&q.act.type==='sleep'&&tkWatchK(q)===TKWK)}out.watch=ok;
    out.notSleep=!(k.act&&k.act.type==='sleep');k.energy=10;stepWorld(.5);out.floor=k.energy>=TKFLOOR;
    __at(dayNo()+1,5.99);for(let i=0;i<30&&!(k.act&&k.act.type==='sleep');i++)stepWorld(.5);out.nap=!!(k.act&&k.act.type==='sleep');
    out.homeOn=yamiHomeOn();const e={id:999,type:'basic',x:CX+.5,y:CY+6.5,hp:1,max:100,spawned:true,path:[],stun:0,flash:0};S.enemies.push(e);defeat(e,'',k);const it=EVAP.find(q=>q.e===e);out.home=!!(it&&it.home);
    const t0=performance.now();for(const d of [0,900,1800,2800,3600]){it.t0=performance.now()-d;render(performance.now())}
    save();continueGame(load(5));out.reload=S.flags.tsukimi===1&&S.res.filter(q=>q.name===TSUKIMI).length===1;return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.before,true,'20時より前は生まれない');assert.equal(r.dlg,true);assert.equal(r.born,'dark');assert.equal(r.flag,1);assert.equal(r.fight,false,'たたかわない');assert.equal(r.keys,false,'神殿で呼べない');
  assert.equal(r.watch,true,'夜、ねむるせいれいのそばで見守る');assert.equal(r.notSleep,true);assert.equal(r.floor,true);assert.equal(r.nap,true,'朝ねむる');
  assert.equal(r.homeOn,true);assert.equal(r.home,true,'夜のほうへかえる');assert.equal(r.reload,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
