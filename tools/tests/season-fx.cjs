/* 季節の効き目（season.js の SEAFX）：属性ごとの能力1.2倍・夏のつかれ・冬の移動速度とおなか（火のせいれい・あたたかい物のそばはかわらない）・冬のコワイノ0.8倍・画面の「20→24」・知らせ。
   冬の雪だるま：ひまなせいれいが作り、できたらたのしさ+5、春にとける。前のセーブの能力は1回だけ1/5（stat5Mig） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;S.fog=null;if(sheet)closeSheet();`);
  const r=JSON.parse(await run(`(()=>{const out={};const dayOf=k=>{for(let d=1;d<60;d++)if(seasonOf(d)===k)return d};const at=k=>{S.t=(dayOf(k)-1)*1440+10*60};
    const mk=(el,x,y)=>{const q=mkRes(S,'テスト'+el,el,x,y);q.vr={pow:0,spd:0,sta:0,eat:1,iv:3};q.xp=0;if(!S.res.includes(q))S.res.push(q);return q};
    const w=mk('wood',CX+3.5,CY+6.5),f=mk('fire',CX+11.5,CY+6.5),a=mk('water',CX+19.5,CY+6.5),e=mk('earth',CX-5.5,CY+6.5),n=mk('wind',CX-13.5,CY+6.5);
    out.base=[w,f,a,e,n].map(q=>rStat(q,1).work);
    const mul=()=>[w,f,a,e,n].map(q=>+rMul(q,'work').toFixed(3));
    at(0);out.sp=mul();out.spTxt=seaTxt(w,'work',20);out.tired0=seaTired();
    at(1);out.su=mul();out.tired1=seaTired();out.suSta=staNow(f);
    at(2);out.au=mul();
    at(3);out.wi=mul();out.wiMove=[w,f,n].map(q=>+rMul(q,'move').toFixed(3));out.hunW=seaHun(w);out.hunF=seaHun(f);
    /* たき火のそばは寒くない */const j=((w.y|0))*W+(w.x|0)+2;S.obj[j]='campfire';SEAWC.delete(w);out.warmMove=+rMul(w,'move').toFixed(3);out.warmHun=seaHun(w);S.obj[j]='';SEAWC.delete(w);
    /* 火のせいれいのそばも */f.x=w.x+1;f.y=w.y;SEAWC.delete(w);out.fireNear=seaHun(w);f.x=CX+11.5;f.y=CY+6.5;SEAWC.delete(w);
    /* 冬のコワイノ */const en={type:'basic',hp:100,max:100};seaFoeInit(en);seaFoeInit(en);out.foe=[en.hp,en.max,seaFoeK(en)];
    at(0);const en2={type:'basic',hp:100,max:100};seaFoeInit(en2);out.foe2=[en2.hp,seaFoeK(en2)];
    /* 知らせ */at(3);S.memo=[];const T=toast;let msg='';toast=(t)=>{msg+=t};const st=later;later=(fn)=>fn();seasonMorning();later=st;toast=T;out.toast=msg;
    /* 雪だるま */at(3);S.snowm=[];const R=Math.random;Math.random=()=>0;const G=bfs(w.x|0,w.y|0);w.act=null;w.snowT=0;out.go=goSnowman(w,G);Math.random=R;
    out.type=w.act&&w.act.type;if(w.act){const A=w.act;if(A.stage!=='do'){w.x=A.stand%W+.5;w.y=((A.stand/W)|0)+.5;w.path=[];beginDo(w)}const fun0=w.fun=50;for(let i=0;i<40&&w.act;i++){A.t+=1;ACT.snowman.tick(w,A);if(ACT.snowman.done(w,A)){ACT.snowman.end(w,A);endAct(w)}}out.fun=w.fun-fun0}
    out.snow=JSON.stringify(S.snowm);
    /* 春にとける */{let d=2;while(!(seasonOf(d)===0&&seasonOf(d-1)===3))d++;S.t=(d-1)*1440+6*60}seasonMorning();out.melt=(S.snowm||[]).length;
    /* 前のセーブ：1回だけ1/5 */const s={flags:{stat10:1},res:[{vr:{pow:30,spd:-10,sta:20,iv:2},tst:{spd:20},sst:{pow:10,atk:20},est:{work:5,move:8,sta:3,atk:5},wkM:20,mvM:30}],enemies:[]};stat5Mig(s);stat5Mig(s);const q=s.res[0];out.mig=[q.vr.pow,q.vr.spd,q.vr.sta,q.vr.iv,q.tst.spd,q.sst.pow,q.sst.atk,q.est.work,q.est.move,q.est.sta,q.est.atk,q.wkM,q.mvM];
    out.newFlag=!!newState(0).flags.stat5;
    for(const q of[w,f,a,e,n]){const i=S.res.indexOf(q);if(i>=0)S.res.splice(i,1)}
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.deepEqual(r.base,[20,20,26,16,18],'Lv1 の はたらく速さ（20がふつう）');
  assert.deepEqual(r.sp,[1.2,1,1.3,.8,.9],'春：木だけ1.2倍');assert.equal(r.spTxt,'20→24');assert.equal(r.tired0,1);
  assert.deepEqual(r.su,[1,1.2,1.55,.8,.9],'夏：火・水1.2倍（26×1.2=31.2→31）');assert.equal(r.tired1,1.2);assert.equal(r.suSta,24);
  assert.deepEqual(r.au,[1,1,1.3,.95,.9],'秋：土1.2倍（16×1.2=19.2→19）');
  assert.deepEqual(r.wi,[1,1,1.3,.8,1.1],'冬：風1.2倍（18×1.2=21.6→22）');
  assert.deepEqual(r.wiMove,[.8,1,1.25],'冬の移動速度：0.8倍・火はそのまま・風は26×1.2×0.8=24.96→25');
  assert.equal(r.hunW,1.2);assert.equal(r.hunF,1);assert.equal(r.warmMove,1);assert.equal(r.warmHun,1);assert.equal(r.fireNear,1);
  assert.deepEqual(r.foe,[80,80,.8]);assert.deepEqual(r.foe2,[100,1]);
  assert.ok(r.toast.includes('冬になった')&&r.toast.includes('0.8倍'),r.toast);
  assert.equal(r.go,true);assert.equal(r.type,'snowman');assert.equal(r.fun,5);assert.ok(JSON.parse(r.snow).some(m=>m.g===3),r.snow);assert.equal(r.melt,0,'春にとける');
  assert.deepEqual(r.mig,[6,-2,4,3,4,2,20,1,2,1,5,4,6]);assert.equal(r.newFlag,true);
  await page.waitForTimeout(500);assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
