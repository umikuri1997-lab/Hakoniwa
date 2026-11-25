/* つりの演出：投げる（fishcast）→ つつく（1〜3回）→ ずぼっ → つれたら、かかげて札（raise）。にげられるとき（つりの★で 20・15・10・5%）は、つつかれたときにひいて、なにもなし（たのしさは同じ） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const out={};
    S.ground.fill(0);for(let y=50;y<53;y++)for(let x=50;x<53;x++)S.ground[y*W+x]=1;recount();S.t=1440*3+10*60;S.rain=false;
    const a=S.res[0];a.nap=false;const go=(rnd)=>{a.carry=null;a.cmat=null;a.fun=10;a.bubble='';const q0=Math.random;let i=0;Math.random=()=>rnd[Math.min(i++,rnd.length-1)];
      const A={type:'fish',stand:51*W+53,t:0,stage:'do'};a.x=53.5;a.y=51.5;centerOn(a.x*TS,a.y*TS);a.act=A;ACT.fish.start(a,A);Math.random=()=>.99;/* つったあと：魚（fishLoot） */const L={nb:A.nb.slice(),esc:A.esc,anim:[],nib:0,dt:1/30,steps:0};
      const s0=sfxAt;const snd=[];sfxAt=(k)=>snd.push(k);
      while(!ACT.fish.done(a,A)&&L.steps<5000){A.t+=L.dt;ACT.fish.tick(a,A,L.dt);L.steps++;const n=workAnim(a);if(L.anim[L.anim.length-1]!==n)L.anim.push(n);if(A.sh!=null&&!L.food)L.food=(A.sh>=FISHJUMP&&workFood(a))||'';if(L.steps%20===0)render(performance.now())/* 投げる・つつく・ずぼっ・にげる・かかげる札を描いても、エラーが出ない */}
      ACT.fish.end(a,A);sfxAt=s0;Math.random=q0;L.snd=[...new Set(snd)];L.nibN=snd.filter(k=>k==='fishnib').length;L.t=Math.round(A.t*10)/10;L.carry=Object.keys(a.carry||{});L.fun=Math.round(a.fun);L.fk=A.fk||'';L.first=!!A.first;a.act=null;return L};
    S.fishRec={};a.jc={};
    out.catch1=go([.5,.4,.99,.99,.99]);/* つつく2回・にげない・魚 */
    out.catch2=go([0,.4,.99,.99,.99]);/* つつく1回・2回めの魚 */
    out.esc=go([.99,.4,.1]);/* つつく3回・★0〜1 で 0.1 は 20%・15% より下：にげる */
    a.jc={tsuri:400};out.lv=tokuiLv(a,'tsuri');out.noEsc=go([.99,.4,.1,.99,.99,.99]).esc;/* ★3 は 5%：0.1 ではにげない */
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  const c=r.catch1;assert.equal(c.nb.length,2);assert.equal(c.nibN,2);assert.equal(c.esc,false);
  assert.equal(c.anim[0],'fishcast');assert.ok(c.anim.includes('fish')&&c.anim[c.anim.length-1]==='raise',c.anim);
  assert.ok(['fishplop','fishnib','fishbig','catch'].every(k=>c.snd.includes(k)),c.snd);assert.ok(!c.snd.includes('fishesc'));
  assert.ok(c.fk&&c.carry.includes(c.fk),c.carry);assert.equal(c.first,true);assert.ok(c.food,'かかげる魚の絵');assert.ok(c.t>=52,c.t);
  assert.equal(r.catch2.nb.length,1);assert.equal(r.catch2.nibN,1);
  assert.equal(r.catch2.first,r.catch2.fk!==c.fk);
  const e=r.esc;assert.equal(e.esc,true);assert.equal(e.nb.length,3);assert.deepEqual(e.carry,[]);assert.equal(e.fk,'');assert.ok(e.snd.includes('fishesc')&&!e.snd.includes('fishbig')&&!e.snd.includes('catch'),e.snd);
  assert.ok(!e.anim.includes('raise'));assert.ok(e.t<46,e.t);assert.ok(Math.abs(e.fun-c.fun)<=1,'たのしさは同じ '+e.fun+' '+c.fun);
  assert.equal(r.lv,3);assert.equal(r.noEsc,false);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
