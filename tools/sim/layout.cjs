/* 配置の実験：同じ村で、箱・家・食卓・ベッドの場所だけをかえて、昼と夜をくりかえし、集まる素材・食べ物と、歩いた時間をくらべる。
   使い方：node tools/sim/layout.cjs [日数] [配置の名前,…]
   配置：near（素材箱・食料箱が仕事場と家のそば）・far（箱が26マスはなれる）・split（家と食卓と食料箱がばらばら）・home（家の中に食卓・ベッド、すぐ外に食料箱）
   出力：配置ごとに、木材・石材のふえた数、食べ物のへった数、せいれい1人あたりの、歩いた時間（時計の分）と、何のために歩いたか、しごとの時間の内わけ。 */
const DAYS=+process.argv[2]||3,ONLY=(process.argv[3]||'').split(',').filter(Boolean);
const L={
 near:{mbox:[47,44],stor:[52,52],table:[52,50],beds:[[50,48],[51,48],[52,48],[53,48]]},
 far:{mbox:[47,70],stor:[52,74],table:[52,50],beds:[[50,48],[51,48],[52,48],[53,48]]},
 split:{mbox:[47,44],stor:[70,66],table:[36,62],beds:[[66,34],[67,34],[68,34],[69,34]]},
 home:{mbox:[47,44],stor:[52,53],table:[52,50],beds:[[50,48],[51,48],[52,48],[53,48]],house:[48,46,56,52,52]}};
(async()=>{const {browser,run,errors}=await require('./boot.cjs')();
for(const [name,P] of Object.entries(L)){if(ONLY.length&&!ONLY.includes(name))continue;
 await run(`(()=>{newGame(0);USERPAUSE=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;resetVillageTransient();S.enemyOn=false;S.quest=99;S.qStory=null;
  for(let y=28;y<80;y++)for(let x=28;x<80;x++){const j=y*W+x;S.obj[j]='';S.floor[j]='';S.hi[j]=0;S.ground[j]=0}
  const put=(id,x,y)=>{S.obj[y*W+x]=id;if(BL[id].dyn)S.dyn[y*W+x]=S.dyn[y*W+x]||{}};
  const P=${JSON.stringify(P)};
  if(P.house){const [x0,y0,x1,y1,dx]=P.house;for(let x=x0;x<=x1;x++){put('hwall',x,y0);put('hwall',x,y1)}for(let y=y0;y<=y1;y++){put('hwall',x0,y);put('hwall',x1,y)}S.obj[y1*W+dx]='door';for(let y=y0+1;y<y1;y++)for(let x=x0+1;x<x1;x++)S.floor[y*W+x]='floor'}
  for(let y=38;y<48;y+=2)for(let x=36;x<44;x+=2)put('ntree',x,y);for(let y=38;y<46;y+=2)for(let x=40;x<44;x+=2)put('rock',x+10,y-8);
  put('statue',54,30);put('crate',...P.mbox);put('crate',...P.stor);put('table',...P.table);for(const b of P.beds)put('bed',...b);
  S.res=S.res.slice(0,1);for(const [el,n] of [['earth',MINA],['wood','ハル'],['water','アオ']])S.res.push(mkRes(S,n,el,54,56));
  for(const q of S.res){q.x=54.5;q.y=56.5;q.act=null;q.path=[];q.hunger=hMax(q);q.energy=100;q.fun=100;q.walkT=0}
  S.mat={};S.fs={imo:60};syncFood();S.t=1440*3+6*60;S.lv=3;recount();window.TT={};window.WK={};return 1})()`);
 const res=JSON.parse(await run(`(()=>{const f0=S.food;
  for(let i=0;i<${DAYS}*1440/2;i++){stepWorld(2);for(const q of S.res){const a=q.act,k=a?a.type:'none';if(a&&a.stage==='walk'){const g=['fetch','eat','eatwait','meal'].includes(k)?'ごはん':['sleep','rest'].includes(k)?'ねる':['smat','store','sitem'].includes(k)?'しまう':['chop','mine','weed','gather','drop','harvest','till','water','plant'].includes(k)?'しごと':'あそぶ・ほか';WK[g]=(WK[g]||0)+2}else TT[k]=(TT[k]||0)+2}}
  const n=S.res.length,c=v=>Math.round(v/DAYLEN/n/${DAYS});
  return JSON.stringify({wood:S.mat.wood||0,stone:S.mat.stone||0,foodUsed:f0-S.food,walk:c(Object.values(WK).reduce((a,b)=>a+b,0)),why:Object.fromEntries(Object.entries(WK).map(([k,v])=>[k,c(v)])),act:Object.fromEntries(Object.entries(TT).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>[k,c(v)])),energy:S.res.map(q=>q.energy|0)})})()`));
 console.log(name,JSON.stringify(res));
}
console.log('errors',errors.slice(0,3));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
