/* せいれいの絵は、3Dから写した動きの絵だけ（パーツのドット絵を組む描き方・線と丸の描き方は、けした）。
   どの属性・どの場面（立つ・いす・ベッド・うたたね・地面にすわる・ばんざい・つり・絵のない行動）も、その動きの絵で描ける。
   その動きの絵がまだ読めていないあいだは、立ち姿（手ばなさない）で待つ。一覧の小さい絵（spiritPort）も、3Dの立ち姿。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const els=['wood','earth','fire','water','wind','light','dark'];
  const cases=[[{},'stand'],[{sit:true},'sit'],[{bed:true,sleep:true},'bed'],[{sleep:true},'doze'],[{sleep:true,sitF:true},'sitfront'],[{banzai:true},'banzai'],[{sitF:true,anim:'ysit'},'sitfront'],[{sitF:true,anim:'sunset'},'sunset'],
    [{anim:'fish'},'fish'],[{anim:'fish',fishPull:true},'fishpull'],[{anim:'nosuch'},'stand'],[{walk:true},'walk'],[{carry:true},'carry'],[{anim:'eat_bread',sit:true},'eat_bread']];
  assert.equal(await run(`typeof spPose+typeof spProp+typeof soleImg`),'undefinedundefinedundefined','the old part drawing is gone');
  assert.equal(await run(`Object.keys(CHIPS).filter(k=>/^sp[:_]/.test(k)&&!/^sp:(face|lash|cheek)/.test(k)).length`),0,'only eye, lash and cheek chips remain');
  for(const[o,nm]of cases)assert.equal(await run(`spMotion(${JSON.stringify(o)},${JSON.stringify(o.anim||'')})`),nm,JSON.stringify(o));
  /* 立ち姿は、はじめに読んで、手ばなさない */
  await run(`for(const el of ${JSON.stringify(els)})spmPin(el)`);
  await page.waitForFunction(()=>sacredEval(`Object.keys(SPC).every(el=>[SPM,SPMQ].every(T=>SPMI[T.stand.s[el]]&&SPMI[T.stand.s[el]].ok&&SPMI[T.stand.s[el]].pin))`),{},{timeout:30000});
  const draw=`(()=>{const els=${JSON.stringify(els)},cases=${JSON.stringify(cases)},bad=[];let wait=0;const cv=document.createElement('canvas');cv.width=cv.height=300;const c=cv.getContext('2d');
    for(const el of els){if(!spDotReady(el)){wait++;continue}for(const[o0,nm]of cases)for(const iso of[0,1]){const o=Object.assign({t:1},o0);if(iso)o.iso=1;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,300,300);
      const ok=drawSpiritDot(c,el,150,250,.87,1,o),d=c.getImageData(0,0,300,300).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;
      const T=iso?SPMQ:SPM,g=SPMI[T[nm].s[el]];if(!ok||n<500)bad.push(el+' '+nm+(iso?' iso':'')+' ok='+ok+' px='+n);if(!g||!g.ok)wait++}}
    return JSON.stringify({bad,wait})})()`;
  /* 1回め：まだ読めていない動きも、立ち姿で描ける（何も描かれない・古い絵になる、がない） */
  const a=JSON.parse(await run(draw));assert.deepEqual(a.bad,[],'while a motion sheet is loading, the standing sheet is drawn');
  /* 読めたあと：どの場面も、その動きの絵 */
  let b=a;for(let i=0;i<40&&b.wait;i++){await page.waitForTimeout(500);b=JSON.parse(await run(draw))}
  assert.equal(b.wait,0,'every motion sheet loads');assert.deepEqual(b.bad,[]);
  console.log('3D sheets only: '+els.length+' elements x '+cases.length+' cases x 2 views');
  /* 一覧の小さい絵 */
  const P=JSON.parse(await run(`JSON.stringify(${JSON.stringify(els)}.map(el=>{const u=spiritPort(el,96);return[el,u.length,!!portCache[el+96]]}))`));
  for(const[el,len,cached]of P){assert.ok(len>1500,el+' portrait is drawn');assert.ok(cached,el+' portrait is kept')}
  console.log('portraits: 3D standing sheet for '+P.length+' elements');
  /* 行動で使う動きの絵は、先に読む */
  assert.deepEqual(JSON.parse(await run(`JSON.stringify(workAnims({act:{type:'fish',stage:'walk'},elem:'water'}))`)),['fishcast','fish','fishpull','raise']);
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
