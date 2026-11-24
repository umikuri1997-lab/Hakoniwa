/* 洞窟にいるあいだも村は動く（cave.js の cvAwayOut・cvAwayBack・cvVBack、main.js の VBG）・深い階は、いるだけでおなかがへる（CVDEEP）
   ・つれていった子は S.res の外（S.cvAway）。セーブでは res にもどる。もどったら巣穴の前の歩けるマスへ
   ・うしろで村を動かすあいだ（VBG）：会話はためて、もどってから・知らせは出さない。大事なこと（村で消えた など）だけ洞窟の画面に
   ・洞窟に子がいれば、村の子がいなくなっても全滅にしない */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:2});
  const r=JSON.parse(await run(`(()=>{const out={};document.querySelector('#dialog').hidden=true;S.enemies=[];
    for(const el of ['earth','fire','water'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const q of S.res){q.nap=false;q.hunger=hMax(q)}
    S.t=Math.floor(S.t/1440)*1440+21*60;/* 夜でも出かけられる */cavePrep();out.nightPop=!!document.querySelector('.pxpopw');document.querySelectorAll('.pxpopw').forEach(p=>p.remove());
    const n0=S.res.length,go=S.res.filter(q=>q.name.startsWith('t'));
    out.enter=caveEnter(go,{},0);const C=CV;out.away=[S.cvAway.length,S.res.length===n0-go.length,go.every(q=>!S.res.includes(q))];
    out.paused=paused();out.hour=Math.abs(cvHour()-hour())<1e-9;
    /* うしろで村を動かす：時計が進む */{const t0=S.t;for(let i=0;i<20;i++){VBG=true;try{stepWorld(2)}finally{VBG=false}}out.clock=S.t>t0}
    /* 会話はためる・知らせは出さない */{const nt=document.querySelectorAll('.toast').length;VBG=true;try{dialog([[GOD,'てすと']]);toast('てすとの知らせ')}finally{VBG=false}
      out.later=[DLGLATER.length,document.querySelector('#dialog').hidden,[...document.querySelectorAll('.toast')].some(t=>(t._msg||'')==='てすとの知らせ')]}
    /* 村で消えた子は、洞窟の画面に知らせる */{C.vn.res=C.vn.res.concat(['ゆめのこ']);cvVBack(cvVFront());out.note=[...document.querySelectorAll('.toast')].some(t=>(t._msg||'').includes('ゆめのこが、村で消えてしまった'))}
    /* 村のカメラの動きは、洞窟にもちこまない */{const b=cvVFront();let fin=0;camAnim={fz:1,tz:2,fx:0,fy:0,tx:0,ty:0,t:0,dur:1,done:()=>fin++};cam.x+=50;cvVBack(b);out.cam=[camAnim===b.ca,fin,cam.x===b.x]}
    /* 深い階：いるだけでへる */{const a=C.party[0];a.eatU=0;a.frzU=0;a.path=[];a.job=null;a.mv=false;const h0=a.r.hunger;C.fl=6;cvActor(a,10,0,performance.now());const d6=h0-a.r.hunger;a.r.hunger=h0;C.fl=0;cvActor(a,10,0,performance.now());const d0=h0-a.r.hunger;a.r.hunger=hMax(a.r);
      out.deep=[Math.round((d6-d0)*1000),CVDEEP.length,CVDEEP.slice(0,3).every(v=>v===0)]}
    /* セーブ：洞窟の子も res に入る */{S.introSeen=true;save();const d=JSON.parse(KV.getItem(SAVE_KEYS[S.world||0]));out.save=[go.every(q=>d.res.some(x=>x.name===q.name)),(d.cvAway||[]).length]}
    /* 村の子がみんないなくなっても、洞窟に子がいれば全滅にしない */{const keep=S.res.slice();for(const q of keep)die(q);out.wipe=!!S.wipe;S.wipe=false}
    /* もどる */caveExit(true);document.querySelectorAll('.pxpopw').forEach(p=>p.remove());out.back=[S.cvAway.length,go.every(q=>S.res.includes(q)&&walk((q.y|0)*W+(q.x|0)))];
    DLGLATER=[];return JSON.stringify(out)})()`));
  assert.equal(r.nightPop,true,'夜も出かけられる');
  assert.equal(r.enter,true);assert.deepEqual(r.away,[3,true,true],'つれていった子は村のせいれいの外');
  assert.equal(r.paused,false,'洞窟のあいだも村は止めない');assert.equal(r.hour,true,'時刻は村の時計');assert.equal(r.clock,true,'村の時計が進む');
  assert.deepEqual(r.later,[1,true,false],'会話はためる・知らせは出さない');assert.equal(r.note,true,'村で消えた子を知らせる');
  assert.deepEqual(r.cam,[true,1,true],'村のカメラの動きは、すぐおわらせる');
  assert.deepEqual(r.deep,[2000,10,true],'7階は、10分で2へる（1〜3階は0）');
  assert.deepEqual(r.save,[true,0],'セーブでは、洞窟の子も村にいる');
  assert.equal(r.wipe,false,'洞窟に子がいれば全滅にしない');
  assert.deepEqual(r.back,[0,true],'もどったら、村の歩けるマスへ');
  assert.deepEqual(errors,[]);await browser.close();console.log('cave-time ok')})().catch(e=>{console.error(e);process.exit(1)});
