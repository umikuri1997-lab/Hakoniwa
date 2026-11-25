/* 料理・もの作りの動き（work-fx.js）：進みぐあいで動きがかわる・置いた道具にあわせた動き・家具の上の物（道具・材料・できた料理）・できたらかかげてから終わる・作業台の上の形・手に持つ物 */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await boot();
const out=await run(`(()=>{const out={};const cx=54,cy=64;for(let y=cy-4;y<cy+6;y++)for(let x=cx-10;x<cx+12;x++){const j=y*W+x;S.obj[j]='';S.floor[j]='';S.hi[j]=0;S.ground[j]=0}
 S.t=1440*2+600;S.enemies=[];const tb=cy*W+cx-8,ov=cy*W+cx-3,cf=cy*W+cx+2,wb=cy*W+cx+7;S.obj[tb]='cooktable';S.obj[ov]='oven';S.obj[cf]='campfire';S.obj[wb]='wbench';S.dyn[wb]={order:777};recount();
 const base=S.res[0];S.res=[];const mk=(el,x)=>{const r=JSON.parse(JSON.stringify(base));r.id=300+x;r.name='t'+x;r.elem=el;r.x=x+.5;r.y=cy+.5;r.act=null;r.hunger=900;r.fun=90;r.energy=100;r.hidden=false;r.nap=false;S.res.push(r);return r};
 const go=(r,rec,st)=>{r.cing={rec,ov:st,prog:0};r.act={type:'cook',stage:'do',obj:st,t:0};ACT.cook.start(r,r.act);return r};
 const at=(r,p)=>{r.act.t=p*cookTime(r,r.act.obj);return workAnim(r)};
 const a=go(mk('wood',cx-9),'salad',tb),b=go(mk('fire',cx-4),'pancake',ov),c=go(mk('fire',cx+1),'kushiyaki',cf),s=go(mk('water',cx-2),'soup',ov),s2=go(mk('water',cx+3),'soup',cf),br=go(mk('earth',cx-5),'bread',ov);
 out.table=[.05,.3,.6,.95].map(p=>at(a,p));out.pan=[.05,.3,.6,.95].map(p=>at(b,p));out.grill=at(c,.5);out.pot=at(s,.5);out.potFire=[at(s2,.5),cookTool(s2)];/* たき火の上のなべは、高い所でかきまぜる */out.bake=at(br,.5);
 out.foods=[at(a,.05)&&workFood(a),(at(b,.95),b.act.sh=0,workFood(b))];b.act.sh=null;out.noHold=[at(b,.5)&&workFood(b),at(b,.95)&&workFood(b)];/* 作るあいだ・もりつけた料理は、家具の上（手に持たない） */
 out.tools=[a,b,c,s,br].map(r=>(at(r,.5),cookTool(r)));out.ph=[.05,.5,.95].map(p=>(at(b,p),cookPh(b)));
 /* 家具の上の絵：どの料理・材料・道具にもある */out.topMiss=[...COOKD.map(D=>'ckdish_'+D.id),'ckdish_fsg',...[...CKING].flatMap(k=>['L','S','K'].map(z=>'ckin_'+k+'.'+z)),...['board','boardk','bowl','pitcher','knead'].flatMap(t=>['','>1','>2','>3'].map(v=>'cktool_cooktable_'+t+v)),'cktool_oven_pot','cktool_oven_pan','cktool_oven_tray','cktool_campfire_pot','cktool_campfire_net'].filter(k=>!CHIPS[k]);
 out.topPos=['cooktable','oven','campfire'].map(f=>!!(CKTOP[f]&&CKTOP[f][0]&&CKTOP[f][0].D));
 /* 描いてもエラーにならない（どの段階でも） */ctx.save();for(const r of [a,b,c,s,br])for(const p of[.05,.5,.95]){at(r,p);cookTopDraw(ctx,S.obj[r.act.obj],0,0,r.act.obj,0)}ctx.restore();/* クォータービューの絵の足もと（isoChipAt）は、画面の ctx のときだけ */out.topD=[a,b].map(r=>{const D=cookTopD(r.act.obj);return !!D&&D.length===3&&D[2]>=D[1]});
 /* 組み合わせでできる、あたらしい料理（COOKD の ic で作り方をきめる） */const nd={};for(const D of COOKD){if(!D.ic||D.st[0]==='cooktable')continue;const t=D.ic[0];if(nd[t])continue;const r=go(mk(D.el||'fire',cx-1),D.id,D.st[0]==='campfire'?cf:ov);r.act.t=.5*cookTime(r,r.act.obj);const f=(r.act.t=.95*cookTime(r,r.act.obj),r.act.sh=0,workFood(r));r.act.sh=null;nd[t]={st:(r.act.t=.5*cookTime(r,r.act.obj),cookStyle(r)),img:!!emoImg(f)};S.res.pop()}out.newDish=nd;
 out.motions=['cookprep','cookcut','cookstir','cook','cookhi','cookfan','raise','craftprep','saw','craft','polish','wbprep','wbsaw','wbham','wbpolish'].filter(k=>!SPM[k]);
 /* できたら、かかげてから終わる */
 b.act.t=cookTime(b,b.act.obj)-.1;let n=0;const c0=S.cookN||0;while(b.act&&b.act.type==='cook'&&n<200){const a0=b.act;a0.t+=.25;ACT.cook.tick(b,a0,.25);if(n===2)out.raiseAnim=workAnim(b);if(ACT.cook.done(b,a0)){ACT.cook.end(b,a0);b.act=null}n++}
 out.cookShowSteps=n;out.cooked=(S.cookN||0)-c0;
 /* もの作り */
 const d=mk('earth',cx+6);S.orders=[{id:777,type:'chair',prog:0,need:100,worker:d.id,mat:{},food:{},got:{},cs:wb}];d.act={type:'craft',stage:'do',order:777,t:0,stand:cy*W+cx+6};ACT.craft.start(d,d.act);
 const o=S.orders[0];out.craft=[5,30,60,95].map(p=>{o.prog=p;return workAnim(d)});S.obj[wb]='';out.craftGround=[5,30,60,95].map(p=>{o.prog=p;return workAnim(d)});S.obj[wb]='wbench';out.wb=[5,50,90].map(p=>{o.prog=p;return wbworkStage(o)});out.faceBench=d.face;
 o.prog=99.9;let m=0;while(S.orders.length&&m<200){const a0=d.act;a0.t+=.25;ACT.craft.tick(d,a0,.25);if(m===2)out.craftRaise=[workAnim(d),workFood(d)];if(ACT.craft.done(d,a0)){ACT.craft.end(d,a0);break}m++}
 out.craftShowSteps=m;out.made=S.orders.length===0&&!!S.unlocked.chair;out.chips=['wbwork#0','wbwork#1','wbwork#2'].filter(k=>!CHIPS[k]);
 return out})()`);
console.log(out);
assert.deepEqual(out.table,['cookprep','cookcut','cookcut','cookprep']);
assert.deepEqual(out.pan,['cookprep','cookfan','cookfan','cookprep']);
assert.equal(out.grill,'cookfan');assert.equal(out.pot,'cook');assert.deepEqual(out.potFire,['cookhi','pot']);assert.deepEqual(out.tools,['board','pan','K','pot','tray']);assert.deepEqual(out.ph,['prep','work','plate']);assert.deepEqual(out.noHold,['','']);assert.deepEqual(out.topMiss,[]);assert.deepEqual(out.topPos,[true,true,true]);assert.deepEqual(out.topD,[true,true],'steam point: world x, y and ground y');for(const t in out.newDish){assert.ok(['pot','pan','bake','grill'].includes(out.newDish[t].st),t);assert.ok(out.newDish[t].img,t+' の絵')}assert.equal(out.pot,'cook');assert.equal(out.bake,'cookfan');
assert.ok(out.foods.every(Boolean),'手に持つ物');assert.deepEqual(out.motions,[]);
assert.equal(out.raiseAnim,'raise');assert.ok(out.cookShowSteps>=15,'かかげてから終わる');assert.equal(out.cooked,1);
assert.deepEqual(out.craft,['wbprep','wbsaw','wbham','wbpolish']);assert.deepEqual(out.craftGround,['craftprep','saw','craft','polish']);assert.deepEqual(out.wb,[0,1,2]);assert.equal(out.faceBench,1);
assert.equal(out.craftRaise[0],'raise');assert.ok(out.craftRaise[1]);assert.ok(out.craftShowSteps>=15);assert.equal(out.made,true);assert.deepEqual(out.chips,[]);
assert.deepEqual(errors,[]);console.log('Work motion: stages by progress, style per dish, raise before finishing (cook and craft), workbench stages, items in hands. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
