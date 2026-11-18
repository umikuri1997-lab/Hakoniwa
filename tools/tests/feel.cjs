const assert=require('node:assert/strict');
/* 時間・温度・質感の手ざわり（js/feel.js）：雪・落ち葉・水たまりの出る時期、窓のあかりの時刻、火のゆらめき、足もとの反応、冬は火にあたる・夏はすずむ、場所の音。草原と火山で、描いてもエラーが出ないこと */
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
const out=JSON.parse(await run(`(()=>{const out={};USERPAUSE=true;const T=(d,h)=>{S.t=1440*(d-1)+h*60};
 /* 季節：冬（16〜20日め）は雪、秋（11〜15日め）は落ち葉。ほかの季節は出ない */
 S.rain=false;T(3,12);out.spring=[snowCover(),leafCover()];T(12,12);out.autumn=[snowCover(),leafCover()>0];T(16,12);const s0=snowCover();T(19,12);const s1=snowCover();S.rain=true;out.winter=[s0>0,s1>s0,snowCover()];
 /* 水たまり：雨の日と、そのつぎの日の昼まで。冬は出ない */
 T(3,12);S.rain=true;out.pud=[puddleLv()];S.rain=false;S.wetD=0;out.pud.push(puddleLv());S.wetD=dayNo();T(3,8);out.pud.push(puddleLv()>0);T(3,14);out.pud.push(puddleLv());
 /* 雨のつぎの朝に印がつく */
 T(5,6);S.rain=true;S.wetD=0;const R0=Math.random;Math.random=()=>.9;morning();Math.random=R0;out.wetD=S.wetD===dayNo();
 /* 窓のあかり：昼は消えていて、夜はぜんぶともる。夕方は家ごとにちがう時刻 */
 const hs=[{x0:10,y0:10},{x0:30,y0:12},{x0:50,y0:40},{x0:20,y0:60}];T(3,12);const noon=hs.map(feelWin);T(3,22);const night=hs.map(feelWin);T(3,7);const morn=hs.map(feelWin);
 const on=hs.map(h=>{for(let t=17;t<21;t+=.05){T(3,t);if(feelWin(h)>=1)return Math.round(t*10)/10}return 99});out.win={noon,night,morn,on,diff:new Set(on).size>1,range:on.every(t=>t>=17.3&&t<=20.3)};
 /* 火のゆらめき：火のあかりは1のまわりでゆれ、ほたるの草むらなどはゆれない */
 let mn=9,mx=0;for(let t=0;t<3000;t+=37){const v=feelFlick(100,'campfire',t);mn=Math.min(mn,v);mx=Math.max(mx,v)}out.flick=[mn>.9&&mn<1,mx>1&&mx<1.1,feelFlick(100,'hotaru',500)];
 /* 足もと：歩いた場所の材質と、のこる物 */
 const r=S.res[0];r.hidden=false;r.nap=false;const hx=CX+4,hy=CY-4;for(let y=hy-2;y<hy+4;y++)for(let x=hx-2;x<hx+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';if(S.hi)S.hi[j]=0;if(S.fog)S.fog[j]=0}
 S.floor[hy*W+hx+3]='floor';S.floor[hy*W+hx+4]='path';S.ground[hy*W+hx+5]=2;S.obj[hy*W+hx+6]='clover';recount();S.rain=false;T(3,12);cam.z=homeZ();cam.x=hx*TS-VW/cam.z/2;cam.y=hy*TS-VH/cam.z/2;feelPrep(0);
 out.surf=[feelSurf(hy*W+hx+3),feelSurf(hy*W+hx+4),feelSurf(hy*W+hx+5)];
 FEELEV.length=0;r.x=hx+4.6;r.y=hy+.5;feelStep(1000);for(let k=0;k<20;k++){r.x+=.1;feelStep(1000+k*50)}out.rip=FEELEV.some(e=>e.k==='rip');out.kick=FEELKICK.has(hy*W+hx+6)&&Math.abs(feelKick(hy*W+hx+6,1700))>0;
 T(19,12);S.rain=true;feelPrep(0);FEELEV.length=0;r.x=hx+.2;r.y=hy+1.5;feelStep(3000);for(let k=0;k<14;k++){r.x+=.1;feelStep(3000+k*50)}out.print=FEELEV.filter(e=>e.k==='print').length>=2;out.snowSurf=feelSurf((hy+1)*W+hx+1);
 /* 冬は火にあたる・夏の昼は木かげか水べですずむ（どちらも、ひまなとき） */
 S.rain=false;S.obj[(hy+2)*W+hx+2]='campfire';S.obj[(hy+2)*W+hx+6]='tree';recount();r.x=hx+5.5;r.y=hy+2.5;r.path=[];r.act=null;r.quirkT=0;r.shadeT=0;const G=bfs(r.x|0,r.y|0);
 Math.random=()=>.1;T(19,12);const a=feelRest(r,G);out.warm=[a,r.act&&r.act.type,r.act&&r.act.k];r.act=null;T(10,13);const b=feelRest(r,G);out.shade=[b,r.act&&r.act.type,!!(r.act&&r.act.shade)];r.act=null;T(3,13);r.quirkT=0;r.shadeT=0;out.none=feelRest(r,G);Math.random=R0;
 /* 場所の音：水（ここは池。川・温泉とはべつの音）・木・火が近いと大きく、夏の昼だけセミ */
 for(let y=hy-1;y<hy+2;y++)for(let x=hx-2;x<hx+1;x++)S.ground[y*W+x]=1;recount();cam.x=hx*TS-VW/cam.z/2;cam.y=(hy+1)*TS-VH/cam.z/2;started=true;T(10,13);const w=feelAmbWant();T(19,13);const w2=feelAmbWant();out.amb=[w.pond>0&&w.stream===0&&w.onsen===0,w.fire>0,w.leaves>0,w.semi>0,w2.semi];
 return JSON.stringify(out)})()`));
console.log(out);
assert.deepEqual(out.spring,[0,0]);assert.deepEqual(out.autumn,[0,true]);assert.deepEqual(out.winter,[true,true,1]);
assert.deepEqual(out.pud,[1,0,true,0]);assert.equal(out.wetD,true);
assert.deepEqual(out.win.noon,[0,0,0,0]);assert.deepEqual(out.win.night,[1,1,1,1]);assert.deepEqual(out.win.morn,[0,0,0,0]);assert.ok(out.win.diff&&out.win.range,'window times '+out.win.on);
assert.deepEqual(out.flick,[true,true,1]);
assert.deepEqual(out.surf,['wood','soil','water']);assert.ok(out.rip,'ripple');assert.ok(out.kick,'flower kick');assert.ok(out.print,'snow prints');assert.equal(out.snowSurf,'snow');
assert.deepEqual(out.warm,[true,'quirk','warm']);assert.deepEqual(out.shade,[true,'sunset',true]);assert.equal(out.none,false);
assert.deepEqual(out.amb,[true,true,true,true,0]);
/* 描く：冬の雪の日・雨の日・夏の昼・夜あけ・夜を、草原と火山で1コマずつ描いて、エラーが出ないこと */
for(const w of[0,1]){if(w)await run(`newGame(1);void 0`);await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:90000});
 for(const[d,h,rain]of[[18,10,1],[3,12,1],[10,13,0],[4,6.2,0],[19,22,0],[13,12,0]]){await run(`USERPAUSE=true;S.t=1440*(${d}-1)+${h}*60;S.rain=!!${rain};cam.z=homeZ();dirty=true;window.__fe=null;const fe0=frameErr;frameErr=function(w,e){window.__fe=w+':'+(e&&e.message);return fe0(w,e)};void 0`);await page.waitForTimeout(350);const fe=await run(`window.__fe`);assert.equal(fe,null,'frame error w'+w+' d'+d+': '+fe)}}
assert.deepEqual(errors,[]);
console.log('Feel: seasons on the ground, puddles, window lights, flicker, footsteps, warm/shade rest, place sounds. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
