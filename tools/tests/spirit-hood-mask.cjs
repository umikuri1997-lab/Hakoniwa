/* せいれいごとの色のずれ（vr.h・vr.l）：3Dから写した絵は、ずきんの印（SPMQ の k）のドットだけ色がかわり、ほかのドット（顔・からだ・手）はかわらない */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
for(const el of ['earth','water','fire','wind','wood']){
  assert.ok(await run(`!!(SPMQ.walk.k&&SPMQ.walk.k['${el}']&&SPM.walk.k&&SPM.walk.k['${el}'])`),el+'：ずきんの印の絵がある');
  /* 絵と印を読みこむまで、くりかえす（読みこむまでは、色をかえない絵をかえす） */
  let r=null;for(let t=0;t<50;t++){r=JSON.parse(await run(`JSON.stringify((()=>{const vr={h:40,l:-.06},a=spmCell('walk','${el}',null,0,0,SPMQ),b=spmCell('walk','${el}',vr,0,0,SPMQ);if(!a||!b||b[0]===a[0])return null;
    const G=SPMQ.walk.g['${el}'],w=G[0],h=G[1],get=(c,im)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.drawImage(im[0],im[1],im[2],w,h,0,0,w,h);return g.getImageData(0,0,w,h).data};
    const km=SPMI[SPMQ.walk.k['${el}']];if(!km||!km.ok)return null;const K=get(0,[km.img,0,0]),A=get(0,a),B=get(0,b);let inK=0,chK=0,out=0,chOut=0;
    for(let q=0;q<A.length;q+=4){if(!A[q+3])continue;const ch=A[q]!==B[q]||A[q+1]!==B[q+1]||A[q+2]!==B[q+2];if(K[q]>127){inK++;if(ch)chK++}else{out++;if(ch)chOut++}}
    return {inK,chK,out,chOut}})())`));if(r)break;await p.waitForTimeout(200)}
  assert.ok(r,el+'：色をかえた絵ができる');
  assert.ok(r.inK>200&&r.chK>r.inK*0.9,el+'：ずきんの印のドットの色がかわる '+JSON.stringify(r));
  assert.ok(r.out>200&&r.chOut===0,el+'：印のないドットはかわらない '+JSON.stringify(r));
}
assert.deepEqual(errors,[]);await browser.close();console.log('ok spirit-hood-mask')})().catch(e=>{console.error(e);process.exit(1)});
