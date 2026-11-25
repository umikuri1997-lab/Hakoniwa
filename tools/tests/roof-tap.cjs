/* 家の中のせいれいは、屋根を外すまでタップできない（ステータスの画面も、話したそうなふきだしも）。
   1回めのタップは屋根を外すだけ。屋根を外したあとは、タップできる。家の外のせいれいは、いつでもタップできる。 */
const assert=require('assert');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
const r=JSON.parse(await run(`(()=>{const o={};USERPAUSE=true;setMode('look');cam.z=2;const hx=CX+4,hy=CY+4;for(let y=hy-2;y<hy+8;y++)for(let x=hx-4;x<hx+8;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.dyn[j]}
 for(let y=hy;y<hy+5;y++)for(let x=hx;x<hx+5;x++)S.obj[y*W+x]=(y===hy||y===hy+4||x===hx||x===hx+4)?'hwall':'';S.obj[(hy+4)*W+hx+2]='door';recount();findHouses();const h=HOUSES.find(q=>q.set.has((hy+2)*W+hx+2));o.house=!!h;if(!h)return JSON.stringify(o);
 const k=hKey(h),j=[...h.inside].find(q=>!S.obj[q]),x=j%W+.5,y=((j/W)|0)+.5;centerOn(x*TS,y*TS);
 const a=S.res[0];S.res=[a];a.hidden=false;a.act=null;a.x=x;a.y=y;if(typeof spotSceneReset==='function')spotSceneReset();
 const tap=()=>{const q=ptS(a.x,a.y,tapX(a)*TS,(tapY(a)-.5)*TS);closeSheet();onTap(q.x,q.y);return sheet};
 OPENH.delete(k);o.over=roofOver(a);o.first=tap();o.opened=OPENH.has(k);/* 1回め：屋根が外れるだけ */
 o.second=tap();/* 屋根を外したあと：せいれいの画面 */closeSheet();
 OPENH.delete(k);SUBW[a.name]='x';let called=0;const st=subTalk;window.subTalk=()=>{called++};tap();o.bubRoof=called;o.bubOpened=OPENH.has(k);tap();o.bubOpen=called;window.subTalk=st;delete SUBW[a.name];closeSheet();
 /* 家の外 */let ox=h.x0-3,oy=h.y1+3;a.x=ox+.5;a.y=oy+.5;OPENH.delete(k);centerOn(a.x*TS,a.y*TS);o.outOver=roofOver(a);o.out=tap();closeSheet();
 return JSON.stringify(o)})()`));
console.log(r);
assert.equal(r.house,true,'はじめの家がある');assert.equal(r.over,true);
assert.notEqual(r.first,'res','屋根があるとタップできない');assert.equal(r.opened,true,'1回めで屋根が外れる');assert.equal(r.second,'res','屋根を外すとタップできる');
assert.equal(r.bubRoof,0,'屋根があると、ふきだしもタップできない');assert.equal(r.bubOpened,true);assert.equal(r.bubOpen,1,'屋根を外すと、ふきだしから会話');
assert.equal(r.outOver,false);assert.equal(r.out,'res','家の外のせいれいはタップできる');assert.deepEqual(errors,[]);
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
