/* まもりの光：画面のゆれと光は、光の槌が地面に当たるとき（GLFX 0.25秒）。音は余韻のある音（1.5秒より長い）。
   ダメージ・とめる・木や岩のゲージ・素材が落ちるのは、当たってから（glHit）。地図のどこをタップしても落ちる。近くのせいれいはおどろいて、はねる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;cam.z=2;`);await page.waitForTimeout(2500);/* cam.z=2：ちぢめた画面は描くのが重く、タイマーがおくれる *//* 読みこみのあとの重い仕事がおわるまで。村の時間は止める（コワイノが動かない） */
  /* 画面のゆれ（skillFx）がよばれた時刻を、ゲームの中ではかる（テストの往復の待ちを入れない） */
  await run(`window.__fx=0;const f0=skillFx;skillFx=k=>{if(!__fx)__fx=performance.now();f0(k)};window.__t0=performance.now();lightSnd(CX,CY)`);
  await page.waitForFunction(()=>sacredEval('__fx>0'),{},{timeout:3000,polling:10});
  const dt=Number(await run(`__fx-__t0`));
  assert.ok(dt>=250-5&&dt<250+150,'shake at the hit: '+dt);
  const len=Number(await run(`(async()=>{const r=await fetch(SAMPLES.glight[0]);const b=await new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,44100,44100).decodeAudioData(await r.arrayBuffer());return b.duration})()`));
  assert.ok(len>1.5,'long tail: '+len);
  /* 当たる前と後 */
  const before=JSON.parse(await run(`(()=>{const x=CX+6,y=CY+6,j=y*W+x;S.obj[j]='rock';S.hp['lp'+j]=LIGHTHIT.rock*2;S.drops=[];const e={id:S.nid++,type:'basic',x:CX+6.5,y:CY+3.5,hp:999,max:999,spawned:true,path:[],atk:0,stun:0,flash:0};S.enemies=[e];window.__e=e;window.__j=j;
    const r=S.res[0];r.hidden=false;r.nap=false;r.x=CX+7.5;r.y=CY+7.5;window.__r=r;S.pt=10;LIGHTCD=0;
    const ok=glCast(x,y);const ok2=(LIGHTCD=0,glCast(CX+6,CY+3));/* 地面とコワイノのマス */
    return JSON.stringify({ok,ok2,hp:e.hp,lp:S.hp['lp'+j],drops:S.drops.length,pt:S.pt,shock:(SHOCKU.get(r)||0)>performance.now()})})()`));
  assert.deepEqual(before,{ok:true,ok2:true,hp:999,lp:24,drops:0,pt:8,shock:false},'当たる前は、なにもかわらない');
  await page.waitForTimeout(450);
  const after=JSON.parse(await run(`JSON.stringify({hp:__e.hp,stun:__e.stun>0,lp:S.hp['lp'+__j]||0,obj:S.obj[__j],drops:S.drops.map(d=>d.id),shock:(SHOCKU.get(__r)||0)>performance.now(),jump:JUMP.has(__r),fx:fx.filter(f=>f.n==='skillhit').length})`));
  console.log(JSON.stringify({before,after}));
  assert.equal(after.hp,999-10,'当たってからダメージ');assert.equal(after.stun,true);
  assert.equal(after.drops.length,1,'当たってから素材が落ちる');assert.ok(after.drops[0].startsWith('mat:'));
  assert.equal(after.shock,true,'近くのせいれいは、おどろく');assert.equal(after.jump,true);assert.ok(after.fx>=1,'わざが当たったコワイノに光');
  console.log('Guard light: shake at '+Math.round(dt)+'ms, sound '+len.toFixed(2)+'s, damage and drops after the hit');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
