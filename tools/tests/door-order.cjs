/* ドア・門のマスを通るせいれいの前後（3D）：ドアは、そのマスの足もとに立てた板。せいれいの足もとが、その板の面（カメラの向きの、たての面）を
   こえたときに、うしろ→手前に1回だけ入れかわる（北→南のよこ置き・西→東のたて置き）。マスに入ったとたん手前にとばない。
   屋根をはずした手前のドアのしきい（~sill）は、柱（~low）とべつの絵で、地面にはる絵（いつもせいれいの下）。 */
const assert=require('assert');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
const r=JSON.parse(await run(`(()=>{const cx=(camCX()/TS)|0,cy=(camCY()/TS)|0;let j=-1;
 for(let y=cy-6;y<cy+6&&j<0;y++)for(let x=cx-6;x<cx+6;x++){const k=y*W+x;if([k,k-1,k+1,k-W,k+W].every(q=>!S.obj[q]&&S.ground[q]!==1&&hiAt(q)===hiAt(k))){j=k;break}}
 if(j<0)return JSON.stringify({found:false});const X=j%W,Y=(j/W)|0,me=S.res[0];S.res.length=1;me.act=null;me.path=null;
 let sill=[];const s0=iqSillDraw,f0=iqFront;iqSillDraw=function(c,i,o){if(i===j)sill.push(!!G3X.rec||!!G3X.ras);return s0(c,i,o)};
 const out={found:true,g3:G3.on,chips:['iso:door:h~sill','iso:door:v~sill','iso:door:h~low','iso:door:v~low'].every(k=>!!CHIPS[k])};
 const pass=(door,wall,hz,low)=>{for(const q of[j-1,j+1,j-W,j+W])S.obj[q]=null;S.obj[j]=door;for(const q of hz?[j-1,j+1]:[j-W,j+W])S.obj[q]=wall;recount();iqFront=k=>low&&k===j;const seq=[];
   for(let t=0;t<=20;t++){const d=-.5+t/10;me.x=hz?X+.5:X+d+.5;me.y=hz?Y+d+.5:Y+.5;sill=[];render(performance.now());
     const dq=G3X.q.filter(q=>q.own===j);if(!dq.length){seq.push('?');continue}
     const a=dq[0].a,pa=R3D.project(a[0],a[1],a[2]),pm=R3D.project(me.x,a[1],me.y);seq.push(pm.z<pa.z?'F':'B');if(low&&(!sill.length||sill.some(Boolean)))seq.push('S!')}
   return seq.join('')};
 out.hdoor=pass('door','hwall',true,false);out.vdoor=pass('door','hwall',false,false);out.hgate=pass('gate','fence',true,false);out.vgate=pass('gate','fence',false,false);out.hlow=pass('door','hwall',true,true);out.vlow=pass('door','hwall',false,true);
 iqSillDraw=s0;iqFront=f0;return JSON.stringify(out)})()`));
console.log(r);
assert.equal(r.found,true);assert.equal(r.g3,true,'3Dで描いている');assert.equal(r.chips,true,'しきい（~sill）と柱（~low）の絵がある');
for(const k of['hdoor','vdoor','hgate','vgate','hlow','vlow'])assert.match(r[k],/^B+F+$/,k+'：はじめはうしろ・おわりは手前で、入れかわりは1回だけ（しきいは、地面にはる絵）');
assert.deepEqual(errors,[]);
await browser.close();console.log("ok")})().catch(e=>{console.error(e);process.exit(1)});
