const assert=require('node:assert/strict');
/* 気持ちよさ（js/juice.js）：物が上の数へ飛ぶ・さいごの一回の手ごたえ・つづけて置く・ごほうびの紙ふぶき。数字はかえない */
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
const out=JSON.parse(await run(`(()=>{const out={};USERPAUSE=true;S.t=1440*2+12*60;const r=S.res[0];r.hidden=false;r.nap=false;cam.z=homeZ();cam.x=r.x*TS-VW/cam.z/2;cam.y=r.y*TS-VH/cam.z/2;camAnim=null;
 /* 1. 飛ぶ粒：画面の中からだけ出て、数は3つ（パワーは5つ）まで */
 juiceReset();juiceFly(r.x,r.y,'food',7);out.fly=JFLY.length;juiceFly(r.x,r.y,'pt',30);out.fly2=JFLY.length;out.pend=JPTPEND;juiceFly(r.x+500,r.y,'mat',3);out.flyOff=JFLY.length;juiceFlyStep(performance.now()+5000);out.flyEnd=JFLY.length;out.pend2=JPTPEND;out.dom=document.querySelectorAll('img[alt=""][style*="z-index:58"],img[style*="z-index: 58"]').length;
 /* 2. さいごの一回：粒が出て、せいれいがとびはねる。木材の数はかわらない */
 const j=(r.y|0)*W+(r.x|0)+2,n0=fx.length,w0=S.mat.wood;juiceBreak(j,'wood',r);out.brk=[fx.length-n0>=10,JUMP.has(r),S.mat.wood===w0];const n1=fx.length;juiceBreak(j,'crop',r);out.crop=fx.length-n1>=6;
 /* 3. つづけて置く：1.1秒のうちなら、つづきの数がふえる。同じコマのまとめ置きは、順におくれる */
 JCOMBO.t=0;const d=[];for(let k=0;k<4;k++)d.push(juicePlace(j+k,'block'));out.stag=d;out.combo=JCOMBO.n;JCOMBO.t=performance.now()-5000;juicePlace(j,'furn');out.comboReset=JCOMBO.n;out.other=juicePlace(j,'chop');
 /* 4. 紙ふぶきと、よろこぶ動き */
 JCONF.length=0;juiceCheer('quest');out.conf=JCONF.length;out.joy=(JOYU.get(r)||0)>performance.now();juiceCheer('lv');out.conf2=JCONF.length;
 /* なかまの紹介をとじたとき */
 JCONF.length=0;NEWRES=r.id;HOLD.add(r.id);unhold();out.newc=[JCONF.length,NEWRES,HOLD.has(r.id)];unhold();out.newc.push(JCONF.length);
 return JSON.stringify(out)})()`));
console.log(out);
assert.equal(out.fly,3);assert.equal(out.fly2,11,"パワーは8つまで、つぎつぎ");assert.equal(out.flyOff,11);assert.equal(out.pend,30,"とどくまでは上の数に足さない");assert.equal(out.pend2,0,"ぜんぶとどいたら、上の数はもとどおり");assert.equal(out.flyEnd,0);assert.equal(out.dom,0);
assert.deepEqual(out.brk,[true,true,true]);assert.ok(out.crop);
assert.deepEqual(out.stag,[0,45,90,135]);assert.equal(out.combo,3);assert.equal(out.comboReset,0);assert.equal(out.other,0);
assert.equal(out.conf,44);assert.ok(out.joy);assert.equal(out.conf2,114);assert.deepEqual(out.newc,[44,null,false,44]);
/* 描いても、エラーが出ない（紙ふぶき・粒） */
await run(`window.__fe=null;const fe0=frameErr;frameErr=function(w,e){window.__fe=w+':'+(e&&e.message);return fe0(w,e)};juiceFly(S.res[0].x,S.res[0].y,'mat',3);void 0`);await page.waitForTimeout(900);assert.equal(await run(`window.__fe`),null);
assert.deepEqual(errors,[]);
console.log('Juice: fly to HUD, break feel, place combo, cheer. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
