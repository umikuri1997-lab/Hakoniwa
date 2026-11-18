/* もりのこだま・霧の中の手がかり・属性のはたらきあい（風の日のはたおり機・雨のたき火・火のせいれいで雪がとける）
   草原：はじめは晴れた4エリアに3こずつ。草むら（タップ→見にいく）・石の輪（石材をはこぶ）・花の輪（同じ花が咲く→見にいく）で見つかり、パワー+5と小さな物。10こめで設計図。霧が晴れると、そのエリアにも3こ。
   火山：はじめから16エリアに3こずつ（48こ。置けなかった分は、つぎの朝に）。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;
    const out={};out.n0=S.kd.length;out.areas=[...new Set(S.kd.map(e=>e.a))].sort((x,y)=>x-y);out.kinds=S.kd.map(e=>e.k);
    out.objOK=S.kd.every(e=>kdCells(e).every(c=>c===e.gap?!S.obj[c]||WEEDS.has(S.obj[c]):S.obj[c]===KDK[e.k].o));
    const walkN=()=>{for(let i=0;i<30000;i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(!S.kd.some(e=>e.st===1||e.ws))break}for(let i=0;i<20000&&(roomN(a)<1e9)&&(a.citem&&Object.keys(a.citem).some(k=>a.citem[k]>0)||a.cmat&&Object.keys(a.cmat).some(k=>a.cmat[k]>0)||a.carry&&carryN(a)>0);i++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}};
    /* 箱を近くに */const bx=(a.y|0)*W+(a.x|0)+2;S.obj[bx]='crate';recount();boxSync();
    /* 草むら・切り株：タップで見にいく */
    const e1=S.kd.find(e=>e.k==='kusa'||e.k==='kabu');out.k1=e1.k;const pt0=S.pt;kdTap(e1.j%W,(e1.j/W)|0);out.st1=e1.st;walkN();out.found1=e1.st;out.kodama1=S.kodama;out.pt1=S.pt-pt0;
    /* もう一度タップ：なにもしない */kdTap(e1.j%W,(e1.j/W)|0);out.again=S.kodama;
    /* 石の輪：石材がないと、はこばない */
    let e2=S.kd.find(e=>e.k==='ishi');if(!e2){e2=S.kd.find(e=>e.st===0);}
    if(e2&&e2.k==='ishi'){const st0=S.mat.stone||0;S.mat.stone=0;boxSync();kdTap(e2.j%W,(e2.j/W)|0);out.noStone=e2.ws||0;S.mat.stone=st0+5;boxSync();const s1=availOf('stone');kdTap(e2.j%W,(e2.j/W)|0);out.ws=e2.ws;out.rsv=s1-availOf('stone');walkN();out.found2=e2.st;out.gapObj=S.obj[e2.gap];out.stoneUsed=st0+5-(S.mat.stone||0)}
    /* 花の輪：すきまに同じ花が咲くと、見にいく */
    const e3=S.kd.find(e=>e.k==='hana'&&e.st===0);if(e3){S.obj[e3.gap]=e3.fl;recount();out.hanaSt=e3.st;walkN();out.found3=e3.st}
    out.kodama=S.kodama;
    /* こわせない */const before=S.obj[e1.j];removeAt(e1.j%W,(e1.j/W)|0);out.keep=S.obj[e1.j]===before;
    /* 10こめ：設計図（まだ設計図がもらえないときは、あとでわたす） */S.kodama=9;const e4=S.kd.find(e=>e.st===0);const bp0=(S.bpInv||[]).length;kdFound(e4,a);out.owe=S.kdOwe||0;out.bp=(S.bpInv||[]).length-bp0;S.flags.bpOpen=1;kdMorning();out.oweAfter=S.kdOwe||0;out.bpAfter=(S.bpInv||[]).length-bp0;
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
  assert.equal(r.n0,12,'はじめは晴れた4エリアに3こずつ');assert.deepEqual(r.areas,[5,6,9,10]);assert.equal(r.objOK,true);
  assert.equal(r.st1,1);assert.equal(r.found1,2,'せいれいが見つける');assert.equal(r.kodama1,1);assert.ok(r.pt1>=5,'パワー+5');assert.equal(r.again,1);
  if(r.ws!==undefined){assert.equal(r.noStone,0,'石材がないと、はこばない');assert.equal(r.ws,1);assert.equal(r.rsv,1,'石材を1こ、とっておく');assert.equal(r.found2,2);assert.equal(r.gapObj,'kdishi');assert.equal(r.stoneUsed,1)}
  if(r.hanaSt!==undefined){assert.equal(r.hanaSt,1);assert.equal(r.found3,2)}
  assert.equal(r.keep,true,'こわせない');
  assert.equal(r.owe+r.bp,1,'10こめで設計図');assert.equal(r.oweAfter,0);assert.equal(r.bpAfter,1);
  assert.equal(r.fogAdd,3);assert.equal(r.fogArea,true);
  assert.ok(r.zk.length>=2&&/^もりのこだま\|見つけた数/.test(r.zk[0]),JSON.stringify(r.zk));
  assert.equal(r.loomK,40);assert.equal(r.loom,60);assert.equal(r.mill,45);
  assert.equal(r.lit,true);assert.equal(r.out,true);assert.equal(r.litRain,false,'雨の日、外のたき火はあかりにならない');assert.equal(r.cookRain,false,'雨の日、外のたき火では料理しない');assert.equal(r.roofLit,true,'屋根の下はそのまま');
  assert.equal(r.melt,true,'火のせいれいのまわり2マスの雪がとける');
  assert.deepEqual(errors,[]);await browser.close();
  /* 火山：はじめから48こ */
  delete process.env.GAME_URL;const v=await require('../sim/boot.cjs')({world:1});const n=JSON.parse(await v.run(`(()=>{const a=S.kd.length,b=new Set(S.kd.map(e=>e.a)).size;kdMorning();return JSON.stringify([a,b,S.kd.length])})()`));console.log('volcano',n);assert.ok(n[0]>=45&&n[0]<=48,'火山は、はじめから16エリアに3こずつ（置けない所は、つぎの朝に）');assert.equal(n[1],16);assert.ok(n[2]>=n[0]&&n[2]<=48);assert.deepEqual(v.errors,[]);await v.browser.close();
  console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
