/* ためし：クォータービュー（マップを45度まわして、マスをひし形にならべる見え方）にしたら、どう見えるかの見本。
   ゲームはかえない。新しい草原のゲームに小さな村を置き、いまの見え方（now.png）と、クォータービュー（iso.png）を写す。
   地面の下絵は、そのまま45度まわして、たてを半分につぶす。物・せいれいの絵は、いまの絵をそのまま、ひし形のマスの上に立てる。
   家の壁は、いまの絵がななめ見おろし専用なので、この見本では、壁の色の箱（上の面・左の面・右の面）で描く。
   つかいかた：node tools/art/iso/iso_mock.cjs <出力フォルダ> */
const fs=require('fs');const OUT=(process.argv[2]||'.').replace(/\/?$/,'/');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const {browser,page,run,errors}=await require('../../sim/boot.cjs')({world:0,viewport:{width:1200,height:900}});
 await run(`(()=>{USERPAUSE=true;document.querySelector('#dialog').hidden=true;document.querySelectorAll('.hud,.dock,.quest,#qrow,.qrow,#skill,#toast,#topbar,#dock').forEach(e=>e.style.visibility='hidden');
  S.t=Math.floor(S.t/1440)*1440+11*60;S.hold=0;S.enemies=[];
  const X0=60,Y0=58,N=14;window.ISO={X0,Y0,N};
  for(let b=0;b<N;b++)for(let a=0;a<N;a++){const j=(Y0+b)*W+X0+a;S.obj[j]='';delete S.ref[j];S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.floor)S.floor[j]='';if(S.roof)delete S.roof[j];if(S.win)delete S.win[j];if(S.rug)delete S.rug[j];(S.grn||(S.grn={}))[j]=1;delete S.dyn[j]}
  const put=(id,a,b)=>{const j=(Y0+b)*W+X0+a,z=BL[id]&&BL[id].sz||[1,1];S.obj[j]=id;for(let q=0;q<z[1];q++)for(let p=0;p<z[0];p++)if(p||q){S.obj[j+q*W+p]='part';S.ref[j+q*W+p]=j}};
  for(let a=2;a<=7;a++){put('hwall',a,2);put('hwall',a,6)}for(let b=3;b<=5;b++){put('hwall',2,b);put('hwall',7,b)}put('door',4,6);
  for(let a=3;a<=6;a++)for(let b=3;b<=5;b++)S.floor[(Y0+b)*W+X0+a]='floor';
  put('bed',3,3);put('crate',6,3);put('taru',6,5);
  put('tree',10,1);put('tree',12,4);put('tree',1,11);put('fruit',12,10);
  ['salvia','lily','bellf','salvia','lily'].forEach((id,k)=>put(id,8+k,8));
  put('bench',9,10);put('campfire',10,5);
  for(let a=2;a<=4;a++)for(let b=9;b<=10;b++)put('farm',a,b);
  for(let a=6;a<=13;a++)put('fence',a,13);put('gate',8,13);
  put('stone',4,7);put('stone',4,8);
  const r0=S.res[0];r0.nap=false;const mk=(el,x,y,n)=>{const r=JSON.parse(JSON.stringify(r0));r.id=900+n;r.elem=el;r.name='T'+n;r.x=x;r.y=y;r.act=null;r.path=[];r.nap=false;r.hidden=false;return r};
  S.res=[Object.assign(r0,{x:X0+5.5,y:Y0+8.6,act:null,path:[],nap:false,hidden:false}),mk('fire',X0+11.5,Y0+7.4,1),mk('water',X0+9.5,Y0+11.6,2),mk('earth',X0+3.5,Y0+11.7,3)];
  try{recount();rebuildStatic(true)}catch(e){console.error(e)}
  cam.z=1.6;centerOn((X0+N/2)*TS,(Y0+N/2)*TS);dirty=true})()`);
 for(let i=0;i<20;i++)await page.waitForTimeout(150);
 await page.screenshot({path:OUT+'now.png',clip:{x:600-360,y:450-360,width:720,height:720}});
 /* クォータービューを描く（本物の描く処理は止め、#cv をそのまま使う） */
 const url=await run(`(()=>{render=function(){};const {X0,Y0,N}=ISO,K=2,IW=Math.round(TS*Math.SQRT2),IH=IW/2,WH=TS,now=performance.now();
  const G=document.createElement('canvas');G.width=N*TS;G.height=N*TS;gblit(G.getContext('2d'),X0*TS,Y0*TS,N*TS,N*TS,0,0,N*TS,N*TS);
  const cw=N*IW+40,ch=N*IH+110,ox=cw/2,oy=90;cv.width=cw*K;cv.height=ch*K;const c=ctx;c.setTransform(1,0,0,1,0,0);c.fillStyle='#2f3b2a';c.fillRect(0,0,cv.width,cv.height);c.imageSmoothingEnabled=false;
  const iso=(gx,gy)=>[ox+(gx-gy)*IW/2,oy+(gx+gy)*IH/2];
  c.setTransform(K*IW/2/TS,K*IH/2/TS,-K*IW/2/TS,K*IH/2/TS,K*ox,K*oy);c.drawImage(G,0,0);
  /* 壁は箱、ほかの物は絵を立てる。x+y の小さい順（うしろから） */
  const L=[];for(let b=0;b<N;b++)for(let a=0;a<N;a++){const j=(Y0+b)*W+X0+a,o=S.obj[j];if(!o||o==='part'||o==='farm'||!BL[o]||BL[o].floor)continue;/* 畑は地面の下絵に入っている */const z=BL[o].sz||[1,1];L.push({d:a+z[0]-1+b+z[1]-1+.5,a,b,o,j,z})}
  for(const r of S.res){const a=r.x-X0,b=r.y-Y0;if(a>=0&&b>=0&&a<N&&b<N)L.push({d:a+b-.5,r,a,b})}
  L.sort((p,q)=>p.d-q.d);
  const box=(a,b,h,top,lf,rt)=>{const P=[iso(a,b),iso(a+1,b),iso(a+1,b+1),iso(a,b+1)].map(([x,y])=>[x*K,y*K]),U=P.map(([x,y])=>[x,y-h*K]);c.setTransform(1,0,0,1,0,0);
   const poly=(Q,f)=>{c.fillStyle=f;c.beginPath();Q.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
   poly([U[3],U[2],P[2],P[3]],lf);poly([U[2],U[1],P[1],P[2]],rt);poly(U,top)};
  for(const e of L){
   if(e.r){const [px,py]=iso(e.a,e.b);c.setTransform(K,0,0,K,K*(px-e.r.x*TS),K*(py-e.r.y*TS));try{drawRes0(e.r,now)}catch(err){}continue}
   if(HOME_WALLS.has(e.o)){box(e.a,e.b,WH,'#d9b07a','#b98652','#946538');continue}
   if(HOME_DOORS.has(e.o)){box(e.a,e.b,WH,'#d9b07a','#b98652','#946538');const [x1,y1]=iso(e.a+.25,e.b+1),[x2,y2]=iso(e.a+.75,e.b+1);c.setTransform(1,0,0,1,0,0);c.fillStyle='#7a4a2a';c.beginPath();c.moveTo(x1*K,y1*K);c.lineTo(x2*K,y2*K);c.lineTo(x2*K,(y2-WH*.8)*K);c.lineTo(x1*K,(y1-WH*.8)*K);c.closePath();c.fill();continue}
   const {a,b,z}=e,[cx,cy]=iso(a+z[0]/2,b+z[1]/2),by=iso(a+z[0],b+z[1])[1],ob=[(X0+a+z[0]/2)*TS,(Y0+b+z[1])*TS];/* いまの絵の足もと（マスの下のはし）を、ひし形の下の角より少し上へ */
   c.setTransform(K,0,0,K,K*(cx-ob[0]),K*(cy+(by-cy)*.55-ob[1]+TS*.12));try{drawObj(c,e.o,(X0+a)*TS,(Y0+b)*TS,e.j,S.dyn[e.j]?S.dyn[e.j].g||0:0,now)}catch(err){}}
  c.setTransform(1,0,0,1,0,0);return cv.toDataURL('image/png')})()`);
 fs.writeFileSync(OUT+'iso.png',Buffer.from(url.split(',')[1],'base64'));
 console.log(JSON.stringify(errors.slice(0,5)));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
