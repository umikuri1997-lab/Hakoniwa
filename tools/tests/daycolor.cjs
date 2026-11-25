/* 時間の色（daycolor.js）：時刻ごとに、層ごとの色がかわる。昼は地面・水・屋根に何もかけない。ブルーアワーと夜は、地面が寒色・夜の暗さが青、窓のあかりはのこる。いろいろな時刻・段差・遠くの画面で描いてもエラーが出ない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  const at=async h=>JSON.parse(await run(`(()=>{S.t=1440*3+${h}*60;DC.h=-1;const v=dcNow();render(performance.now());return JSON.stringify(v)})()`));
  const noon=await at(12);assert.equal(noon.g,null,'noon: no ground tint');assert.equal(noon.w,null);assert.equal(noon.r,null);
  const rgb=s=>s.match(/\d+/g).map(Number);
  const blue=await at(19.3);{const g=rgb(blue.g);assert.ok(g[2]>g[0],'blue hour: ground goes cool '+blue.g);assert.ok(blue.dk[2]>blue.dk[0],'blue hour: darkness is blue');assert.ok(blue.win>=1,'blue hour: windows lit')}
  const eve=await at(17.2);{const g=rgb(eve.g);assert.ok(g[0]>g[2],'evening: ground goes warm '+eve.g)}
  const night=await at(23);assert.ok(night.win>1,'deep night: windows stand out');{const g=rgb(night.g);assert.ok(g[2]>g[0])}
  for(const h of [0,3,5,6,7,9,15,16.5,18,18.8,20,21.5])await at(h);
  await run(`(()=>{for(let i=0;i<W*H;i+=97)if(!S.obj[i]&&S.ground[i]===0)S.hi[i]=1;dirty=true;recount()})()`);
  for(const z of [1.6,.4]){await run(`cam.z=${z}`);for(const h of [12,19.3,23])await at(h)}
  /* 高い段の上の面（dcTop）と屋根（iqRoofColDraw の r）にも、時間の色がかかる */
  await run(`(()=>{for(const k in CHIPS)if(k.startsWith('iso:roof-')||k.startsWith('iso:hwall:gab-'))chipImgs(CHIPS[k],k)})()`);await page.waitForFunction(()=>sacredEval('chaReady()'));/* 屋根の絵（と妻の壁の絵）は、使うときに読む（アトラスのページ）。読みおわってからはかる */
  const tint=JSON.parse(await run(`(()=>{S.t=1440*3+23*60;DC.h=-1;const v=dcNow(),px=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,40,40);dcTop(ctx,20,4);const top=px(20,20);ctx.restore();
    const f=S.res[0],X=(f.x|0)+6,Y=(f.y|0)+3;for(let y=Y-1;y<Y+7;y++)for(let x=X-1;x<X+7;x++){const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j];S.floor[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0}
    for(let y=Y;y<Y+5;y++)for(let x=X;x<X+5;x++){const j=y*W+x;if(y===Y||y===Y+4||x===X||x===X+4)S.obj[j]='hwall';else S.floor[j]='floor'}S.obj[(Y+4)*W+X+2]='door';recount();
    const h=HOUSES.find(q=>q.inside.has((Y+2)*W+X+2));cam.z=2;cam.x=(X+2.5)*TS-VW/cam.z/2;cam.y=(Y+2.5)*TS-VH/cam.z/2;
    const roofAt=()=>{ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);iqRoofDraw(ctx,h,1);ctx.restore();return px(Math.round(ctx.canvas.width/2),Math.round(ctx.canvas.height/2))};
    const rn=roofAt();S.t=1440*3+12*60;DC.h=-1;const rd=roofAt();return JSON.stringify({g:v.g,r:v.r,top,rn,rd})})()`));
  {const g=rgb(tint.g),r=rgb(tint.r);assert.ok(tint.top.every((c,i)=>Math.abs(c-g[i])<=2),'high ledge top gets the ground tint '+tint.top+' / '+tint.g);
   assert.ok(tint.rd.some(c=>c>0)&&tint.rn.every((c,i)=>Math.abs(c-Math.round(tint.rd[i]*r[i]/255))<=3),'roof gets the roof tint at night '+tint.rn+' / '+tint.rd+' * '+tint.r)}
  console.log('daycolor: layers change by hour (warm evening, cool blue hour, lit windows at night); ledge tops and roofs tinted');
  assert.deepEqual(errors,[]);
  /* 雲の海（風）：夜は、雲の海の所に s、ほかの地面に g がかかる */
  {const B=await require('../sim/boot.cjs')({world:4});await B.run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;`);
   const o=JSON.parse(await B.run(`(()=>{const M=skyM();let sj=-1,lj=-1;const cx=S.res[0].x|0,cy=S.res[0].y|0;for(let d=1;d<60&&(sj<0||lj<0);d++)for(let y=cy-d;y<=cy+d;y++)for(let x=cx-d;x<=cx+d;x++){if(x<1||y<1||x>=W-1||y>=H-1)continue;const j=y*W+x,ring=[j-1,j+1,j-W,j+W,j-W-1,j-W+1,j+W-1,j+W+1];if(sj<0&&M[j]===1&&ring.every(k=>M[k]===1))sj=j;if(lj<0&&!M[j]&&S.ground[j]===0&&!(S.hi&&S.hi[j])&&ring.every(k=>!M[k]&&S.ground[k]===0))lj=j}
     const scr=j=>{const k=dpr*cam.z,O=isoOff(k),wx=(j%W+.5)*TS,wy=((j/W|0)+.5)*TS;return[Math.round(O[0]+k*isoX(wx,wy)),Math.round(O[1]+k*isoY(wx,wy))]};cam.z=1.4;const j0=sj;cam.x=(j0%W+.5)*TS-VW/cam.z/2;cam.y=((j0/W|0)+.5)*TS-VH/cam.z/2;
     const px=(p)=>Array.from(ctx.getImageData(p[0],p[1],1,1).data).slice(0,3);
     const shot=h=>{S.t=1440*3+h*60;DC.h=-1;const k=dpr*cam.z;GLOD=k<1.2;igDraw(k,performance.now());const a=[px(scr(sj)),px(scr(lj))];dcGround();return a.concat([px(scr(sj)),px(scr(lj))])};
     for(let n=0;n<40;n++)igDraw(dpr*cam.z,performance.now());const v=(S.t=1440*3+23*60,DC.h=-1,dcNow());return JSON.stringify({sj,lj,s:v.s,g:v.g,n:shot(23),sl:isoCellVis(lj%W,lj/W|0,0)})})()`));
   assert.ok(o.sj>=0,'found a cloud-sea cell');const s=rgb(o.s),[s0,l0,s1,l1]=o.n;
   assert.ok(s1.every((c,i)=>Math.abs(c-Math.round(s0[i]*s[i]/255))<=3),'cloud sea gets the cloud-sea tint '+JSON.stringify(o));
   if(o.lj>=0&&o.sl){const g=rgb(o.g);assert.ok(l1.every((c,i)=>Math.abs(c-Math.round(l0[i]*g[i]/255))<=3),'land keeps the ground tint '+JSON.stringify(o))}
   console.log('daycolor: cloud sea tinted with its own color');assert.deepEqual(B.errors,[]);await B.browser.close()}
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
