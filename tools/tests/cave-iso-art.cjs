const assert=require('node:assert/strict');
/* 洞窟のクォータービューの絵（iso3d.py の run_band・tone_cave）：かべの面（左・右）にすきまがない。水晶・つらら石・下へおりる穴は、iso の絵で、こさの番号の色をぬったチップ（cvToneChip）になる。つらら石は、岩のマスの左の面（手前の面）の上のほうに */
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;for(const el of ['earth','fire','water'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));S.t=Math.floor(S.t/1440)*1440+9*60;window.__by=el=>S.res.find(q=>q.elem===el)})()`);
for(const fl of [0,1]){
 for(let i=0;i<30;i++){const r=await run(`(()=>{if(!CV){caveEnter([__by('earth'),__by('fire'),__by('water')],{},${fl});CV.en=[];CV.sc=[]}const T=cvqT();return !!(T&&T.face)})()`);if(r)break;await page.waitForTimeout(300)}
 const o=await run(`(()=>{const T=cvqT(),R={};for(const side of[0,1]){let hole=0,tot=0;for(let ox=0;ox<256;ox+=64){const c=cvqFace(side,T.face,ox,T.fk,1),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    for(let v=0;v<c.height;v++)for(let u=0;u<c.width;u++){const t=(u+.5)/c.width,top=side?IQH/2*(1-t):IQH/2*t,vv=v+.5-top;if(vv<0||vv>=IQL)continue;tot++;if(!d[(v*c.width+u)*4+3])hole++}}R['side'+side]=[hole,tot]}
   /* 面のさかい：となりのタイルどうしの、さかいの列の色の差 */
   const cv=document.createElement('canvas');cv.width=400;cv.height=400;const g=cv.getContext('2d');
   const put=(id,ch)=>{g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,400,400);const im=chipImgs(ch.src||ch,id)[0];if(!im.ok)return'notloaded';g.drawImage(im,200+ch.ax/2,200+ch.ay/2,ch.w/2,ch.h/2);const d=g.getImageData(0,0,400,400).data;let x0=999,y0=999,x1=-1,y1=-1;for(let p=0;p<160000;p++)if(d[p*4+3]){const x=p%400,y=(p/400)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return[x0-200,y0-200,x1-200,y1-200]};
   for(const id of ['cave:crys#1','cave:stalac#0','cave:down'])R[id]=put(id,CHIPS[id]);
   const tc=cvToneChip('cave:crys#1',cvTheme().crys?cvTheme().crys[0]:cvTheme().rock,'zz');R.tone=tc?[tc.iso,tc._im[0].ok,tc.w]:null;
   caveAbort();return JSON.stringify(R)})()`);const R=JSON.parse(o);assert.equal(R.side0[0],0,'left face has no holes');assert.equal(R.side1[0],0,'right face has no holes');
 assert.ok(R['cave:stalac#0'][2]<=0&&R['cave:stalac#0'][0]>=-32&&R['cave:stalac#0'][1]>-40,'stalactite hangs on the left (front) face '+R['cave:stalac#0']);assert.deepEqual(R.tone,[1,1,134],'toned crystal chip is an iso chip');console.log('cave iso art floor',fl,o)}
assert.deepEqual(errors,[]);await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
