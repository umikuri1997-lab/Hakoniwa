/* 光と影（js/lit.js）：チップを描くと、向きの絵（NC）に、そのチップのノーマルマップが入る。地面は上向き（から）のまま。昼も夜も、明るさの絵をかさねてもエラーにならない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;LGL.soft=false;SND.lit=true;`);
  const ok=await run(`LGL.ok`);if(!ok){console.log('lit: WebGL がないので、たしかめない');await browser.close();return}
  await run(`(()=>{const j=(CY+3)*W+CX;S.obj[j]='crate';recount();dirty=true;cam.z=2;cam.x=(CX+.5)*TS-VW/cam.z/2;cam.y=(CY+3.5)*TS-VH/cam.z/2})()`);
  await page.waitForFunction(()=>sacredEval('(p=>NPG[p]&&NPG[p].ok)(CHIPS.crate.f[0][0])'),{},{timeout:20000});
  for(const h of [9,22]){await run(`S.t=Math.floor(S.t/1440)*1440+${h}*60;dirty=true;render(performance.now())`);
    const r=JSON.parse(await run(`(()=>{const k=dpr*cam.z,j=(CY+3)*W+CX,X=Math.round(((j%W)*TS+16-cam.x)*k),Y=Math.round((((j/W)|0)*TS+8-cam.y)*k),a=nx.getImageData(Math.round(X*LITNS),Math.round(Y*LITNS),1,1).data,b=nx.getImageData(Math.round((X+200)*LITNS),Math.round((Y+200)*LITNS),1,1).data;return JSON.stringify({obj:[...a],gnd:b[3]})})()`));
    assert.ok(r.obj[3]>200,'the crate writes its normal map ('+h+'h)');assert.equal(r.gnd,0,'the ground stays empty (up)');}
  assert.deepEqual(errors,[]);console.log('lit: chips write normals; day and night overlays without errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
