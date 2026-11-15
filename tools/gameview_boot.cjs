/* マップチップ工房の「ゲームの中で」の見本を、セーブなしで（新しい草原のゲームで）写す。gameview.js と同じ写し方（480×480、3倍、置いたマスがまん中）。
   つかいかた：node tools/gameview_boot.cjs <出力フォルダ> <id...>
   id は BL の物（水車 suisha は左どなりを水にする）か、飼う生き物 ani:<hane|moko|tsuno>（S.ani に1ぴき入れて、立つ絵 #0 で写す。ファイル名は ani-<k>.png）。
   そのあと tools/gameview_grid.py でマス目と黄色のわくをつけて webp にする。 */
const fs=require('fs');const [OUT0,...IDS]=process.argv.slice(2);const OUT=OUT0.replace(/\/?$/,'/');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const {browser,page,run,errors}=await require('./sim/boot.cjs')({world:0,viewport:{width:900,height:900}});
 await run(`(()=>{S.spotSeen=Object.fromEntries(SPOTS.map(s=>[s.k,1]));SPOT_POPS.length=0;document.querySelectorAll(".idea-reveal").forEach(e=>e.remove());GIFT_ACTIVE=false;
  USERPAUSE=true;document.querySelector('#dialog').hidden=true;document.querySelectorAll('.hud,.dock,.quest,#qrow,.qrow,#skill,#toast').forEach(e=>e.style.visibility='hidden');S.res.forEach(r=>r.hidden=true);S.t=Math.floor(S.t/1440)*1440+12*60;S.hold=0;
  aniChip=(a)=>a.in?null:(CHIPS['ani:'+a.k+'#0']||null)})()`);/* 生き物は立つ絵 #0 だけ */
 for(const id of IDS){
  await run(`(()=>{const X=40,Y=40;S.ani=[];for(let b=-4;b<7;b++)for(let a=-4;a<7;a++){const j=(Y+b)*W+X+a;S.obj[j]='';delete S.ref[j];S.ground[j]=0;if(S.fog)S.fog[j]=0;if(S.hi)S.hi[j]=0;if(S.floor)S.floor[j]='';if(S.roof)delete S.roof[j];if(S.win)delete S.win[j];if(S.rug)delete S.rug[j]}
   const id=${JSON.stringify(id)},j=Y*W+X;let z=[1,1];
   if(id.startsWith('ani:')){S.ani.push({id:1,k:id.slice(4),h:j,x:X+.5,y:Y+.6,face:1,wt:0})}
   else{z=BL[id].sz||[1,1];S.obj[j]=id;for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)if(a||b){S.obj[j+b*W+a]='part';S.ref[j+b*W+a]=j}
    if(id==='suisha')S.ground[j-1]=1}
   try{recount();rebuildStatic(true)}catch(e){}cam.z=3;centerOn((X+z[0]/2)*TS,(Y+z[1]/2)*TS);dirty=true})()`);
  await page.waitForTimeout(400);
  await page.screenshot({path:OUT+id.replace(':','-')+'.png',clip:{x:450-240,y:450-240,width:480,height:480}});
 }
 console.log(JSON.stringify(errors.slice(0,5)));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
