/* 設計図の建てる順：床 → 壁 → 家具 → ドア。壁の外に物（はたおり機）があっても、どの段でも「建てる所へ行けません」にならず、さいごまで建つ
  （前は 家具 → 壁 の順で、外に物・中に家具のある壁へ行けず、草原の「切り株の下で」が止まった）。 */
const assert=require('assert');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
const r=JSON.parse(await run(`(()=>{const o={};for(const p of bpPieces('nemoto',0))(o[p[5]]=o[p[5]]||[]).includes(p[2])||o[p[5]].push(p[2]);
 let x0=-1,y0=-1;const j0=S.sacredRoot,rx=j0%W,ry=(j0/W)|0;S.bpInv=[{k:'nemoto'}];for(let y=ry-12;y<ry+12&&x0<0;y++)for(let x=rx-12;x<rx+12;x++)if(bpCheck('nemoto',x,y,0)[0]&&!S.obj[(y+1)*W+x-1]){x0=x;y0=y;break}
 if(x0<0)return JSON.stringify({o,place:false});S.pt=999;S.mat.wood=999;S.mat.funba=99;S.mat.stone=99;S.obj[(y0+1)*W+x0-1]='loom';bpPlace(0,x0,y0,0);const e=S.bp[0],log=[];let blocked=0;
 for(let n=0;n<40&&S.bp.includes(e);n++){const act=e.ps.filter(p=>p.s===1);if(!act.length){bpAdvance(e);continue}blocked+=jobReach().size;log.push(act[0].ph+':'+act.length);for(const p of act){S.dyn[p.j].p=S.dyn[p.j].need;finishBuild(p.j,S.res[0])}}
 return JSON.stringify({o,place:true,log,blocked,done:!S.bp.includes(e)})})()`));
console.log(r);
assert.deepEqual(r.o,{1:['floor'],2:['wall'],3:['furn'],4:['door']},'床 → 壁 → 家具 → ドア の順');
assert.equal(r.place,true);assert.equal(r.blocked,0,'行けない建てる所がない');assert.equal(r.done,true,'さいごまで建つ');assert.deepEqual(errors,[]);
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
