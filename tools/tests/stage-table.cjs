/* ステージごとの値の表（core.js の STAGE・stg）：設計図の壁と柵・雑草の絵・日記を書くせいれい・その土地の素材が、ステージごとにあっていること。ない土地（フリー）は草原の値 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{const w0=WD,out={};for(const w of[KUSA,KAZAN,TSUCHI,MIZU,WIND,YAMI,FREE]){WD=w;out[w]={wall:bpWall(),fence:bpFence(),weed:weedSt(),writer:w===FREE?'':DYWRITER(),mat:stg().mats.join(',')}}WD=w0;return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  const E={0:['hwall','fence',0,'フタバ','shina'],1:['bamboowall','misugaki',1,'ホムラ','bamboo'],2:['adobewall','ishigaki',2,'トト','sagan'],3:['timberwall','ashifence',3,'フタバ','ashi'],4:['canvaswall','ropefence',4,'カザネ','nabiki'],5:['mosswall','ibara',5,'トモリ','yotsuyu'],6:['hwall','fence',0,'','shina']};
  for(const w in E){const [wall,fence,weed,writer,mat]=E[w],g=r[w];assert.equal(g.wall,wall,'wall '+w);assert.equal(g.fence,fence,'fence '+w);assert.equal(g.weed,weed,'weed '+w);if(writer)assert.equal(g.writer,writer,'writer '+w);assert.ok(g.mat.split(',').includes(mat),'mats '+w)}
  await page.waitForTimeout(300);assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
