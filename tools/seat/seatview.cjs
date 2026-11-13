/* すわる位置のページ（tools/seat/）につかう絵を、ゲームそのものの描き方で作る。
   node tools/seat/seatview.cjs <出力.json>
   家具ごと・向きごとに：家具だけの絵（base）・すわったせいれいだけの絵（spirit。手前に重ねる絵 .front と、足をかくす cut はのぞく）・手前に重ねる絵（front）・足をかくす行（clip）。
   せいれいは、いまのゲームの位置（SEATOFF のずれなし）。1ドット＝ゲームの 0.5（1マス64ドット） */
const path=require('path'),fs=require('fs'),boot=require(path.join(__dirname,'..','sim','boot.cjs'));
if(!process.env.CHROME_PATH)process.env.CHROME_PATH='/opt/pw-browsers/chromium';
const OUT=process.argv[2]||'seat.json';
const SEATS=[['chair','いす',4],['achair','ひじかけいす',4],['sofa1','ひとりがけソファ',4],['bench','ベンチ',4],['stool','スツール',1]];
const K=6,CW=112,CH=128,OX=40,OY=56;
(async()=>{const {browser,page,run,errors}=await boot({viewport:{width:1000,height:1000}});
await page.waitForFunction(()=>sacredEval('assetsOK&&stageReady()'));
const out=await run(`(()=>{USERPAUSE=true;const K=${K},CW=${CW},CH=${CH},OX=${OX},OY=${OY};const SE=${JSON.stringify(SEATS)};
 const X=CX+6,Y=CY+6,j=Y*W+X,x=X*TS,y=Y*TS;const now=performance.now();
 const r=S.res.find(q=>!q.dead);S.res.forEach(q=>{if(q!==r)q.hidden=true});
 const oc=window.chipOf;const res={K,CW,CH,OX,OY,seats:[]};
 const shot=f=>{const c=document.createElement('canvas');c.width=CW*K;c.height=CH*K;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(K,0,0,K,-(x-OX)*K,-(y-OY)*K);f(g);return c};
 for(const[id,name,nr] of SE){const it={id,name,rots:[]};
  for(let k=0;k<nr;k++){
   for(let b=-2;b<3;b++)for(let a=-2;a<3;a++){const q=(Y+b)*W+X+a;S.obj[q]='';delete S.ref[q]}
   S.rot=S.rot||{};S.obj[j]=id;S.rot[j]=k;const sz=(BL[id].sz||[1,1]),sw=k%2?sz[1]:sz[0],sh=k%2?sz[0]:sz[1];
   for(let b=0;b<sh;b++)for(let a=0;a<sw;a++)if(a||b){S.obj[j+b*W+a]='part';S.ref[j+b*W+a]=j}
   recount();
   const base=shot(g=>drawObj(g,id,x,y,j,null,now));
   const fch=oc(id,j,null,'.front');const front=fch?shot(g=>drawChip(g,fch,id,x,y,now,j)):null;
   const ch=oc(id,j);const clip=ch&&ch.cut!=null?ch.cut:null;
   r.hidden=false;r.x=X+.5;r.y=Y+.5;r.path=[];r.act=BENCHES.has(id)?{type:'rest',stage:'do',obj:j,seat:j,t:0,dur:9999}:{type:'ownseat',stage:'do',obj:j,key:'o'+j,t:0,dur:9999};
   window.chipOf=(a,i,ro,sf)=>{if(sf==='.front')return null;const c=oc(a,i,ro,sf);return c&&c.cut!=null?Object.assign({},c,{cut:null}):c};
   let sp;try{SPV&&SPV.delete&&SPV.delete(r);drawRes0(r,now);/* 向きの状態（SPV）をととのえる */
     const cv=document.getElementById('cv');ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.setTransform(K,0,0,K,-(x-OX)*K,-(y-OY)*K);drawRes0(r,now);ctx.restore();
     const c=document.createElement('canvas');c.width=CW*K;c.height=CH*K;c.getContext('2d').drawImage(cv,0,0,CW*K,CH*K,0,0,CW*K,CH*K);sp=c}
   finally{window.chipOf=oc}
   it.rots.push({k,base:base.toDataURL(),spirit:sp.toDataURL(),front:front?front.toDataURL():null,clip})}
  res.seats.push(it)}
 dirty=true;return res})()`);
fs.writeFileSync(OUT,JSON.stringify(out));console.log(errors.length?'エラー: '+JSON.stringify(errors):'エラーなし','→',OUT,out.seats.map(s=>s.id+':'+s.rots.length).join(' '));await browser.close()})();
