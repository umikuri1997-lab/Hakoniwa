/* もりのこだま・霧の中の手がかり・属性のはたらきあい（風の日のはたおり機・雨のたき火・火のせいれいで雪がとける）
   草原：はじめに晴れている4エリアには、なにも置かない（花の輪は霧が晴れたエリアだけ）。目標をたっせいすると1こ見つかる（kdGoal）。花の輪は、同じ花が咲く→見にいく。パワー+5と小さな物。10こめで設計図。霧が晴れると、そのエリアに花の輪が1こ。
   火山：はじめから16エリアに花の輪が1こずつ（16こ。置けなかった分は、つぎの朝に）。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;
    const out={};out.n0=S.kd.length;out.noKusa=!S.obj.some(o=>o==='kdkusa'||o==='kdkabu');out.areas=[...new Set(S.kd.map(e=>e.a))].sort((x,y)=>x-y);out.kinds=S.kd.map(e=>e.k);
    out.objOK=S.kd.every(e=>kdCells(e).every(c=>c===e.gap?!S.obj[c]||WEEDS.has(S.obj[c]):S.obj[c]===KDK[e.k].o));
    const walkN=()=>{for(let i=0;i<30000;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(!S.kd.some(e=>e.st===1))break}for(let i=0;i<20000&&(roomN(a)<1e9)&&(a.citem&&Object.keys(a.citem).some(k=>a.citem[k]>0)||a.cmat&&Object.keys(a.cmat).some(k=>a.cmat[k]>0)||a.carry&&carryN(a)>0);i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}};
    /* 箱を近くに */const bx=(a.y|0)*W+(a.x|0)+2;S.obj[bx]='crate';recount();boxSync();
    /* 目標をたっせい：お礼をする子が見つける */
    {const pt0=S.pt;kdGoal(a.name);out.kodama1=S.kodama;out.kdG=S.kdG;out.pt1=S.pt-pt0;S.res.forEach(q=>q.hidden=true);kdGoal('x');out.noRes=S.kodama;S.res.forEach(q=>q.hidden=false)}
    /* 欠けた石の輪はない */out.noIshi=!S.kd.some(e=>e.k==='ishi')&&!S.obj.includes('kdishi');
    /* 前のセーブ：まだの石の輪は、小石も記録もけす・見つけた輪は、小石だけけして記録をのこす・はこんでいた石材は箱へ */{const s={kd:[],obj:new Array(W*H).fill(''),mat:{stone:0},res:[{kdst:9}]},j1=40*W+40,j2=60*W+60;for(const[j,st,id]of[[j1,0,9],[j2,2,10]]){s.kd.push({id,k:'ishi',a:0,j,gap:j-W,st,ws:1});for(const[dx,dy]of KDRING)s.obj[j+dy*W+dx]='kdishi'}s.obj[j1-W]='';kdIshiMig(s);out.mig=[s.kd.length,s.kd[0]&&s.kd[0].st,s.obj.includes('kdishi'),s.mat.stone,s.res[0].kdst,'ws' in (s.kd[0]||{})]}
    /* 花の輪：はじめの4エリアには置かない */out.midHana=S.kd.filter(e=>e.k==='hana').length;
    /* 花の輪：すきまに同じ花が咲くと、見にいく（はじめの4エリアのそとに、ためしに置く） */
    {const h={id:S.kdN=(S.kdN||0)+1,k:'hana',a:99,j:0,gap:0,st:0,fl:'clover'};for(let tr=0;tr<4000;tr++){const x=4+((Math.random()*(W-8))|0),y=4+((Math.random()*(H-8))|0),j=y*W+x;h.j=j;h.gap=j-W;if(kdNeed(h,S.hi?S.hi[j]||0:0)&&Math.hypot(x-a.x,y-a.y)<20)break}for(const c of kdCells(h))S.obj[c]=c===h.gap?'':'kdhana';S.kd.push(h);KDMN=-1;recount();out.hanaAt=kdAt(h.j)===h}
    const e3=S.kd.find(e=>e.k==='hana'&&e.st===0);if(e3){S.obj[e3.gap]=e3.fl;recount();out.hanaSt=e3.st;walkN();out.found3=e3.st}
    out.kodama=S.kodama;
    /* こわせない */{const e1=S.kd.find(e=>e.k==='hana'),c=e1.j-W-1,before=S.obj[c];removeAt(c%W,(c/W)|0);out.keep=S.obj[c]===before}
    /* 10こめ：設計図（まだ設計図がもらえないときは、あとでわたす） */S.kodama=9;const bp0=(S.bpInv||[]).length;kdGoal(a.name);out.owe=S.kdOwe||0;out.bp=(S.bpInv||[]).length-bp0;S.flags.bpOpen=1;kdMorning();out.oweAfter=S.kdOwe||0;out.bpAfter=(S.bpInv||[]).length-bp0;
    /* 霧が晴れると、そのエリアにも3こ */const fa=[1,2,4,7,8,11,13,14].find(q=>S.fog[q]);window.__fa=fa;window.__n1=S.kd.length;fogClear(fa,true);
    /* 霧の中の手がかり：となりが晴れた霧のエリアだけ */out.hint=S.fogF.filter(f=>!f.set&&!f.done&&S.fog[f.a]).map(f=>[f.t,fogHintOn(f.a)]);const c=document.createElement('canvas').getContext('2d');drawFogHints(c,0,0,W,H,performance.now());
    /* 図鑑 */const rows=[];kdZukan(S,(n,d)=>rows.push(n+'|'+d));out.zk=rows;
    /* 風の日のはたおり機 */S.today='kaze';out.loomK=prT(PROC.loom);S.today=null;out.loom=prT(PROC.loom);out.mill=prT(PROC.mill);
    /* 雨のたき火 */const cf=(a.y|0)*W+(a.x|0)-3;S.obj[cf]='campfire';S.rain=false;recount();out.lit=LIGHTS.includes(cf)&&LITP.includes(cf);S.rain=true;recount();out.out=campOut(cf);out.litRain=LIGHTS.includes(cf)||LITP.includes(cf);out.cookRain=ACT.cook.start({cing:{rec:'x'},x:a.x,y:a.y},{obj:cf})!==false;
    S.roof=S.roof||{};S.roof[cf-W-1]='gazebo';recount();out.roofLit=!campOut(cf)&&LIGHTS.includes(cf);delete S.roof[cf-W-1];S.rain=false;recount();
    /* 火のせいれいで雪がとける */a.elem='fire';const snowS=snowCover;snowCover=()=>1;FIREMELT.clear();fireMeltTick();const t0=S.t;S.t+=40;fireMeltTick();const j0=(a.y|0)*W+(a.x|0);out.melt=FIREMELT.has(j0)&&FIREMELT.has(j0+2)&&!FIREMELT.has(j0+3);snowCover=snowS;S.t=t0;a.elem='wood';
    return JSON.stringify(out)})()`));
  await new Promise(f=>setTimeout(f,400));Object.assign(r,JSON.parse(await run(`JSON.stringify({fogAdd:S.kd.length-__n1,fogArea:S.kd.slice(__n1).every(e=>e.a===__fa)})`)));
  console.log(JSON.stringify(r));
  assert.equal(r.n0,0,'はじめに晴れている4エリアには置かない');assert.equal(r.noKusa,true,'切り株・草むらはない');
  assert.equal(r.kodama1,1,'目標をたっせいすると見つかる');assert.equal(r.kdG,1);assert.ok(r.pt1>=5,'パワー+5');assert.equal(r.noRes,1,'せいれいがいないときは見つからない');
  assert.equal(r.noIshi,true,'欠けた石の輪は出ない');assert.deepEqual(r.mig,[1,2,false,1,null,false],'前のセーブの石の輪');
  assert.equal(r.midHana,0,'はじめの4エリアに花の輪はない');assert.equal(r.hanaAt,true);
  if(r.hanaSt!==undefined){assert.equal(r.hanaSt,1);assert.equal(r.found3,2)}
  assert.equal(r.keep,true,'こわせない');
  assert.equal(r.owe+r.bp,1,'10こめで設計図');assert.equal(r.oweAfter,0);assert.equal(r.bpAfter,1);
  assert.equal(r.fogAdd,1);assert.equal(r.fogArea,true);
  assert.ok(r.zk.length>=2&&/^もりのこだま\|見つけた数/.test(r.zk[0]),JSON.stringify(r.zk));
  assert.equal(r.loomK,40);assert.equal(r.loom,60);assert.equal(r.mill,45);
  assert.equal(r.lit,true);assert.equal(r.out,true);assert.equal(r.litRain,false,'雨の日、外のたき火はあかりにならない');assert.equal(r.cookRain,false,'雨の日、外のたき火では料理しない');assert.equal(r.roofLit,true,'屋根の下はそのまま');
  assert.equal(r.melt,true,'火のせいれいのまわり2マスの雪がとける');
  assert.deepEqual(errors,[]);await browser.close();
  /* 火山：はじめから16こ */
  delete process.env.GAME_URL;const v=await require('../sim/boot.cjs')({world:1});const n=JSON.parse(await v.run(`(()=>{const a=S.kd.length,b=new Set(S.kd.map(e=>e.a)).size;kdMorning();return JSON.stringify([a,b,S.kd.length])})()`));console.log('volcano',n);assert.ok(n[0]>=14&&n[0]<=16,'火山は、はじめから16エリアに1こずつ（置けない所は、つぎの朝に）');assert.ok(n[1]>=14);assert.ok(n[2]>=n[0]&&n[2]<=16);assert.deepEqual(v.errors,[]);await v.browser.close();
  console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
