const assert=require('node:assert/strict');
/* こわすモードで木・岩をこわした（removeAt）：せいれいが切った・ほったときと同じ。うきあがる写しは出さず、木はたおれる。一瞬とまって、かけらがとびちる。岩は画面が小さくゆれる */
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
const out=JSON.parse(await run(`(()=>{const out={};USERPAUSE=true;const r=S.res[0];cam.z=homeZ();cam.x=r.x*TS-VW/cam.z/2;cam.y=r.y*TS-VH/cam.z/2;camAnim=null;
 const free=[];for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const j=((r.y|0)+dy)*W+(r.x|0)+dx;if(Math.abs(dx)+Math.abs(dy)>=2&&!S.obj[j]&&!S.floor[j]&&S.ground[j]===0)free.push(j)}
 const one=o=>{const j=free.shift();S.obj[j]=o;recount();RMFX.length=0;TFALL.length=0;JSHAKE=0;const n0=fx.length;removeAt(j%W,(j/W)|0);const n=fx.length-n0;return{gone:!S.obj[j],ghost:RMFX.length,fall:TFALL.some(f=>f.j===j&&f.o===o),parts:fx.slice(n0).filter(f=>f.k==='p').length,frozen:fx.slice(n0).some(f=>f.w0>performance.now()),ring:fx.slice(n0).some(f=>f.k==='ring'),shake:JSHAKE>0,n}};
 out.rock=one('rock');out.tree=one('ntree');
 /* 花（木・岩でない物）は、いままでどおり（うきあがって消える） */const j=free.shift();S.obj[j]='clover';recount();RMFX.length=0;removeAt(j%W,(j/W)|0);out.flower=RMFX.length;
 return JSON.stringify(out)})()`));
console.log(out);
for(const k of ['rock','tree']){const q=out[k];assert.ok(q.gone,k);assert.equal(q.ghost,0,k+'：うきあがる写しは出さない');assert.ok(q.parts>=10,k+'：かけら');assert.ok(q.frozen,k+'：一瞬とまる');assert.ok(q.ring,k)}
assert.ok(out.tree.fall,'木：たおれる');assert.ok(!out.rock.fall,'岩はたおれない');assert.ok(out.rock.shake,'岩：画面がゆれる');assert.ok(!out.tree.shake,'木：ゆれるのは、ドンと地面についたとき')
assert.equal(out.flower,1,'花は、いままでどおり、うきあがって消える');
/* 描いても、エラーが出ない */
await run(`window.__fe=null;const fe0=frameErr;frameErr=function(w,e){window.__fe=w+':'+(e&&e.message);return fe0(w,e)};USERPAUSE=false;const r=S.res[0];let j=-1;for(let d=2;d<6&&j<0;d++){const k=(r.y|0)*W+(r.x|0)+d;if(!S.obj[k]&&!S.floor[k]&&S.ground[k]===0)j=k}S.obj[j]='rock';recount();removeAt(j%W,(j/W)|0);S.obj[j+1]='ntree';recount();removeAt((j+1)%W,((j+1)/W)|0);void 0`);await page.waitForTimeout(3200);assert.equal(await run(`window.__fe`),null);
assert.deepEqual(errors,[]);
console.log('Juice-rm: remove rock/tree like spirit chop (tree falls, stop, shards). Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
