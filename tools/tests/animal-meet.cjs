/* 野良の生き物に、はじめて会ったとき：カメラがよる → はねて「？」・光 → 出会いのカード → カメラがもどる → いつもの小さな画面。2回めからは、すぐ小さな画面。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(async()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.t=1440*3+9*60;
    const wait=(f,ms)=>new Promise(res=>{const t0=performance.now();const tk=()=>{if(f()||performance.now()-t0>ms)return res(f());setTimeout(tk,50)};tk()});
    const f=S.res[0],out={};S.recipes=S.recipes||{};S.recipes.coop=true;/* 小屋をおぼえていないと、はじめのタップは小屋のひらめき（strayIdea）になる */const a={id:901,k:'hane',h:-1,stray:1,x:f.x+3,y:f.y,face:1,wt:0};S.ani.push(a);
    const z0=cam.z,c0=[cam.x+VW/cam.z/2,cam.y+VH/cam.z/2];
    aniPop(a);out.meet=!!AMEET;out.paused=paused();out.noPopYet=!document.querySelector('.pxcard');
    let q=false;out.card=await wait(()=>{q=q||SCN.some(e=>e.k==='aniq');return !!document.querySelector('.anim-meet')},6000);out.zoomed=cam.z>z0;out.q=q||SCN.some(e=>e.k==='aniq');/* 「？」は、カードが出る前に消えることがあるので、待っているあいだに出たかを見る */
    const ov=document.querySelector('.anim-meet');out.text=ov?ov.textContent:'';out.pic=!!(ov&&ov.querySelector('canvas.ampic'));
    await new Promise(r=>setTimeout(r,900));ov&&ov.querySelector('button').click();out.met=!!(S.flags.aniMet||{}).hane;
    out.pop=await wait(()=>!!document.querySelector('.pxcard'),5000);out.popText=(document.querySelector('.pxcard')||{}).textContent||'';
    out.back=Math.abs(cam.z-z0)<.01&&Math.hypot(cam.x+VW/cam.z/2-c0[0],cam.y+VH/cam.z/2-c0[1])<2;out.gift=GIFT_ACTIVE;out.am=AMEET;
    document.querySelectorAll('.pxcard').forEach(c=>c.parentNode.remove());
    aniPop(a);out.second=!AMEET&&!!document.querySelector('.pxcard');document.querySelectorAll('.pxcard').forEach(c=>c.parentNode.remove());
    const b={id:902,k:'moko',h:-1,stray:1,x:f.x+2,y:f.y+1,face:1,wt:0};S.ani.push(b);aniPop(b);await new Promise(r=>setTimeout(r,300));resetVillageTransient();out.reset=!AMEET&&!GIFT_ACTIVE&&!document.querySelector('.anim-meet')&&!(S.flags.aniMet||{}).moko;
    return JSON.stringify(out)})()`));
  console.log(r);
  assert.equal(r.meet,true);assert.equal(r.paused,true,'village time stops');assert.equal(r.noPopYet,true);
  assert.equal(r.card,true,'card');assert.equal(r.zoomed,true,'camera zooms');assert.equal(r.q,true,'? bubble');
  assert.ok(r.text.includes('はじめて会った')&&r.text.includes('ハネマリ')&&r.text.includes('とれる物：たまご'),r.text);assert.equal(r.pic,true);
  assert.equal(r.met,true);assert.equal(r.pop,true,'normal popup after');assert.ok(r.popText.includes('むかえる'));assert.equal(r.back,true,'camera back');
  assert.equal(r.gift,false);assert.equal(r.am,null);assert.equal(r.second,true,'second tap is direct');assert.equal(r.reset,true,'reset on village switch');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
