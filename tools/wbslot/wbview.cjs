/* 作業台の立つ位置のページ（tools/wbslot/）につかう絵を、ゲームそのものの描き方で作る。
   node tools/wbslot/wbview.cjs <出力.json>
   向きごとに：作業台と材料置き場だけの絵（bench）・トンカチを打ちおろした瞬間のせいれいだけの絵（spirit。WBSLOT のずれなし）。どちらも背景なし・同じ大きさ・同じ場所。
   front：せいれいが台の手前（向き0・1）。cut：台のむこう（向き2・3）で、これより下（台にかくれる所）を描かない行（ゲームの wbBehindClip）。bar：足もとのバーの上の行（ずれなしのとき）。init：いまの WBSLOT。K：ゲームの点1つが絵の何ドットか（WBSLOT の1は、よこ K*IQSX・たて K*IQSY ドット） */
const path=require('path'),fs=require('fs'),boot=require(path.join(__dirname,'..','sim','boot.cjs'));
if(!process.env.CHROME_PATH)process.env.CHROME_PATH='/opt/pw-browsers/chromium';
const OUT=process.argv[2]||'wbslot.json',Z=3,CW=640,CH=640;
(async()=>{const {browser,page,run,errors}=await boot({viewport:{width:900,height:900}});
await page.waitForFunction(()=>sacredEval('assetsOK&&stageReady()'),{},{timeout:90000});
const out=await run(`(async()=>{USERPAUSE=true;const Z=${Z},CW=${CW},CH=${CH};
 const X=CX+8,Y=CY+8,r=S.res.find(q=>!q.dead);S.res.forEach(q=>{if(q!==r)q.hidden=true});r.nap=false;
 const SO=JSON.parse(JSON.stringify(WBSLOT));const res={K:dpr*Z,IQSX,IQSY,CW,CH,init:SO,rots:[]};
 const cut=()=>{const c=document.createElement('canvas');c.width=CW;c.height=CH;c.getContext('2d').drawImage(cv,(cv.width-CW)/2,(cv.height-CH)/2,CW,CH,0,0,CW,CH);return c.toDataURL()};
 const clear=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height)};
 for(let k=0;k<4;k++){
  for(let b=-3;b<4;b++)for(let a=-3;a<4;a++){const q=(Y+b)*W+X+a;S.obj[q]='';delete S.ref[q];S.floor[q]=0}
  const j=Y*W+X;wbenchAt(S,j,k);recount();S.orders=[{id:999,type:'chair',prog:6,need:10,cs:j,got:{}}];S.dyn[j]=S.dyn[j]||{};S.dyn[j].order=999;
  const st=workCells(j)[0];r.hidden=false;r.x=st%W+.5;r.y=(st/W|0)+.5;r.path=[];r.act={type:'craft',stage:'do',obj:j,order:999,t:1,stand:st};workFace(r,r.act);
  cam.z=Z;const c=wbCells(j);camAt((c.b%W+.5)*TS,((c.b/W|0)+.5)*TS,VW/2,VH/2);dirty=true;
  const now=((Math.floor((100+r.id*1.7)*1.3)+1.06)/1.3-r.id*1.7)*1000;/* トンカチを打ちおろしたコマ（wbham のコマ0） */
  render(now);await new Promise(q=>setTimeout(q,400));render(now);await new Promise(q=>setTimeout(q,300));
  const kk=dpr*cam.z;clear();for(const[q,yd]of[[c.b,0],[c.y,1]]){const A=objFootJ(q),qx=q%W,qy=(q/W)|0;standTf(ctx,kk,A.fx,A.fy,A.px,A.py);if(yd)drawWbYard(ctx,j,qx*TS,qy*TS-liftOf(q),now,q);else drawObj(ctx,'wbench',qx*TS,qy*TS-liftOf(q),j,0,now)}const bench=cut();
  for(const q in WBSLOT)WBSLOT[q]=[0,0];clear();{const A=ptFoot(r.x*TS,r.y*TS);standTf(ctx,kk,A.fx,A.fy,A.px,A.py);drawRes(r,now)}const spirit=cut();Object.assign(WBSLOT,JSON.parse(JSON.stringify(SO)));
  const oy=(cv.height-CH)/2,ft=w2s(r.x*TS,r.y*TS).y*dpr-oy;let cutY=null;if(k>=2){const[dx,dy]=WORKD[k],ex=(c.b%W+.5+dx*WBEDGE)*TS,ey=((c.b/W|0)+.5+dy*WBEDGE)*TS;cutY=w2s(ex,ey).y*dpr-oy-WBTOPH*kk}
  res.rots.push({k,front:k<2,bench,spirit,cut:cutY,bar:ft+10*IQSY*kk,anim:workAnim(r),face:r.face})}
 clear();dirty=true;return res})()`);
fs.writeFileSync(OUT,JSON.stringify(out));console.log(errors.length?'エラー: '+JSON.stringify(errors.slice(0,3)):'エラーなし','→',OUT,out.rots.map(q=>q.k+':'+q.anim+':'+q.face).join(' '));await browser.close()})();
