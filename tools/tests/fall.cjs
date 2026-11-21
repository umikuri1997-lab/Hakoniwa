/* 落下ダメージ：高い所からは何だんでもとびおりられ、2だんいじょうはダメージ（2だん50・1だんごとに+50）。のぼるのは1だんずつ。せいれいはおなか（0にはしない）、コワイノは体力 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{const ok=j=>!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!fogAt(j)&&walk(j)&&hiAt(j)===0;let j=-1;for(let k=(CY-10)*W+CX-10;k<(CY+10)*W;k++)if(ok(k)&&ok(k+1)&&ok(k+2)){j=k;break}const o={};
    S.hi[j]=4;o.up=cliffUp(j+1,j);o.down=cliffUp(j,j+1);const G=roadSearch(j%W,(j/W)|0);o.reach=G.dist[j+2]>=0;const G2=roadSearch((j+2)%W,((j+2)/W)|0);o.climb=G2.dist[j]>=0;
    const r=S.res[0];r.act=null;r.path=[];r.hunger=400;r.x=j%W+.5;r.y=((j/W)|0)+.5;fallTick();r.x=j%W+1.5;fallTick();o.hun=r.hunger;
    r.hunger=100;r.x=j%W+.5;fallTick();r.x=j%W+1.5;fallTick();o.hun2=r.hunger;
    const e={type:'kokage',x:j%W+.5,y:((j/W)|0)+.5,hp:300,mhp:300};S.enemies.push(e);fallTick();e.x=j%W+1.5;fallTick();o.ehp=e.hp;S.enemies.length=0;S.hi[j]=0;
    return JSON.stringify(o)})()`));
  console.log(r);
  assert.equal(r.up,true,'2だんいじょうは、のぼれない');assert.equal(r.down,false,'とびおりはできる');assert.ok(r.reach);assert.equal(r.climb,false);
  assert.equal(r.hun,250,'4だんで150');assert.equal(r.hun2,1,'0にはしない');assert.equal(r.ehp,150,'コワイノも150');
  assert.deepEqual(errors,[]);console.log('fall: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
