/* 3Dの試作（proto3d）の地面の絵を、ゲームそのものに描かせて写す。
     python3 -m http.server 8000 --bind 127.0.0.1 --directory . &
     GAME_URL=http://127.0.0.1:8000 node proto3d/bake_ground.cjs
   ゲーム（草原）をヘッドレスで開き、物・せいれい・霧・雲のかげをけして、下の地形（24×24マス）を作り、昼・晴れ・HD-2D 切りで、キャンバスをそのまま写す。
   出す物：proto3d/tex/ground.webp（画面の絵）と ground.json（地形と、絵の中の原点の場所）。試作は、この絵を3Dの地面に、画面の向きからはる。 */
const fs=require('fs'),path=require('path');
const N=24,X0=42,Y0=42;            // 地形の大きさ（マス）と、ゲームの地図の中の場所
const VWP=1800,VHP=1500;           // 写す画面（1ドット＝1px）
// 地形：hm 段の高さ・kind（g 地面・p 道・w 池）・grass（みどりになっている所）
const hm=[],kind=[],grass=[];
for(let z=0;z<N;z++){hm.push([]);kind.push([]);grass.push([]);for(let x=0;x<N;x++){
  let h=0;if(z<7)h=1;if(x>17&&z<12)h=1;if(x<5&&z<4)h=2;
  let k='g';if(z===14||(x===11&&z>=7))k='p';
  if(Math.hypot(x+.5-5,z+.5-18.5)<2.6){k='w';h=0}
  const d=Math.hypot(x+.5-12,z+.5-13),a=Math.atan2(z-13,x-12);
  hm[z].push(h);kind[z].push(k);grass[z].push(d<11+1.6*Math.sin(a*3)+1.1*Math.sin(a*5+1)?1:0)}}
(async()=>{
  const {browser,page,run,errors}=await require('../tools/sim/boot.cjs')({viewport:{width:VWP,height:VHP}});
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;
    const N=${N},X0=${X0},Y0=${Y0},hm=${JSON.stringify(hm)},kind=${JSON.stringify(kind)},grass=${JSON.stringify(grass)};
    S.obj.fill('');S.floor.fill('');S.ground.fill(0);S.ref={};S.dyn={};S.hp={};S.res=[];S.enemies=[];S.ani=[];S.drops=[];S.grn={};S.hi=new Array(W*H).fill(0);S.vx={};S.rain=false;S.fog=null;S.sacredRoot=null;feelClouds=function(){};
    for(let z=0;z<N;z++)for(let x=0;x<N;x++){const j=(Y0+z)*W+X0+x;
      if(kind[z][x]==='w')S.ground[j]=1;if(kind[z][x]==='p')S.floor[j]='path';
      for(let i=0;i<hm[z][x];i++)terraUp(j,'');if(grass[z][x])S.grn[j]=1}
    S.t=1440*2+12*60;S.speed=0;setHd2d(false);recount();dirty=true;cam.z=1;camAt((X0+N/2)*TS,(Y0+N/2)*TS,VW/2,VH/2);
  })()`);
  await page.waitForTimeout(6000);
  const info=JSON.parse(await run(`JSON.stringify({o:w2s(${X0}*TS,${Y0}*TS,0),dpr,VW,VH,z:cam.z,cw:document.getElementById('cv').width,ch:document.getElementById('cv').height,glow:dcNow().glow||null,hour:skyHour()})`));
  const url=await run(`document.getElementById('cv').toDataURL('image/png')`);
  const out=path.join(__dirname,'tex');
  fs.writeFileSync(path.join(out,'ground.png'),Buffer.from(url.split(',')[1],'base64'));require('child_process').execFileSync('python3',['-c',"from PIL import Image;import sys;Image.open(sys.argv[1]+'/ground.png').save(sys.argv[1]+'/ground.webp',lossless=True,method=6)",out]);fs.unlinkSync(path.join(out,'ground.png'));
  fs.writeFileSync(path.join(out,'ground.json'),JSON.stringify({n:N,hm,kind,grass,ox:info.o.x,oy:info.o.y,w:info.cw,h:info.ch,glow:info.glow}));
  console.log(info,errors);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
