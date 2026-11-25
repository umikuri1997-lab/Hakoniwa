/* ドア・門のマスを通るせいれいの描く順：マスに入ったとたん手前にとばさず、ほかの物と同じ足もとの順（x+y）。
   北→南（よこ置き）・西→東（たて置き）に通るあいだ、ドアとの前後が入れかわるのは1回だけ（はじめはドアのうしろ・おわりは手前）。
   屋根をはずした手前のドアのしきい（~sill）は、柱（~low）とべつの絵で、マスのどこにいても、せいれいより先（下）に描く。 */
const assert=require('assert');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
const r=JSON.parse(await run(`(()=>{const cx=(camCX()/TS)|0,cy=(camCY()/TS)|0;let j=-1;
 for(let y=cy-6;y<cy+6&&j<0;y++)for(let x=cx-6;x<cx+6;x++){const k=y*W+x;if([k,k-1,k+1,k-W,k+W].every(q=>!S.obj[q]&&S.ground[q]!==1&&hiAt(q)===hiAt(k))){j=k;break}}
 if(j<0)return JSON.stringify({found:false});const X=j%W,Y=(j/W)|0,me=S.res[0];S.res.length=1;me.act=null;me.path=null;
 let log=[];const c0=iqConnDraw,r0=drawRes,s0=iqSillDraw,f0=iqFront;
 iqConnDraw=function(c,i,o,now){if(i===j)log.push('door');return c0(c,i,o,now)};drawRes=function(q,now){if(q===me)log.push('res');return r0(q,now)};iqSillDraw=function(c,i,o){if(i===j)log.push('sill');return s0(c,i,o)};
 const out={found:true,chips:['iso:door:h~sill','iso:door:v~sill','iso:door:h~low','iso:door:v~low'].every(k=>!!CHIPS[k])};
 const pass=(door,wall,hz,low)=>{for(const q of[j-1,j+1,j-W,j+W])S.obj[q]=null;S.obj[j]=door;for(const q of hz?[j-1,j+1]:[j-W,j+W])S.obj[q]=wall;recount();iqFront=k=>low&&k===j;const seq=[];
   for(let t=0;t<=20;t++){const d=-.5+t/10;me.x=hz?X+.5:X+d+.5;me.y=hz?Y+d+.5:Y+.5;log=[];render(performance.now());const a=log.indexOf('door'),b=log.indexOf('res'),s=log.indexOf('sill');seq.push(a<0||b<0?'?':b>a?'F':'B');if(low&&!(s>=0&&s<b))seq.push('S!')}
   return seq.join('')};
 out.hdoor=pass('door','hwall',true,false);out.vdoor=pass('door','hwall',false,false);out.hgate=pass('gate','fence',true,false);out.vgate=pass('gate','fence',false,false);out.hlow=pass('door','hwall',true,true);out.vlow=pass('door','hwall',false,true);
 iqConnDraw=c0;drawRes=r0;iqSillDraw=s0;iqFront=f0;return JSON.stringify(out)})()`));
console.log(r);
assert.equal(r.found,true);assert.equal(r.chips,true,'しきい（~sill）と柱（~low）の絵がある');
for(const k of['hdoor','vdoor','hgate','vgate','hlow','vlow'])assert.match(r[k],/^B+F+$/,k+'：はじめはうしろ・おわりは手前で、入れかわりは1回だけ（しきいは、いつもせいれいの下）');
assert.deepEqual(errors,[]);
await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
