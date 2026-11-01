/* マップチップ工房の「ゲームの中で」の見本を、ゲームそのもので描いて写す。
   つかいかた：ゲームをサーバーで開けるようにして（index.html の __game に ev:(s)=>eval(s) を足したもの）、
   node tools/gameview.js <URL> <セーブのJSON> <出力フォルダ>  → <id>.png（480×480、3倍、置いたマスがまん中）。
   そのあと tools/gameview_grid.py でマス目と黄色のわくをつけて webp にする。 */
const {chromium}=require('playwright');const fs=require('fs');const [URL0,SAVE,OUT0]=process.argv.slice(2);const sv=JSON.parse(fs.readFileSync(SAVE,'utf8'));
const OUT=OUT0.replace(/\/?$/,'/');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(sv=>{for(const k in sv.saves)localStorage.setItem(k,typeof sv.saves[k]==='string'?sv.saves[k]:JSON.stringify(sv.saves[k]))},sv);
await p.goto(URL0);await p.waitForTimeout(1500);await p.evaluate(()=>__game.ev('continueGame(loadStage(0))'));await p.waitForTimeout(6000);await p.evaluate(()=>__game.ev('S.spotSeen=Object.fromEntries(SPOTS.map(s=>[s.k,1]));SPOT_POPS.length=0;GUIDE_POPS.length=0;document.querySelectorAll(".idea-reveal").forEach(e=>e.remove());GIFT_ACTIVE=false'));/* ポップアップを出さない */
const ids=await p.evaluate(()=>__game.ev(`(()=>{const s=new Set();for(const k in CHIPS){const b=k.split(/[:#>@~.\\/]/)[0];if(BL[b]&&b!=='part'&&b!=='site')s.add(b)}return [...s]})()`));
console.log(ids.length);
await p.evaluate(()=>__game.ev(`(()=>{USERPAUSE=true;document.querySelectorAll('.hud,.dock,.quest,#qrow,.qrow,#skill,#toast').forEach(e=>e.style.visibility='hidden');S.res.forEach(r=>r.hidden=true);S.t=Math.floor(S.t/1440)*1440+12*60;S.hold=0})()`));
for(const id of ids){
 const r=await p.evaluate((id)=>__game.ev(`(()=>{const X=40,Y=40;for(let b=-4;b<7;b++)for(let a=-4;a<7;a++){const j=(Y+b)*W+X+a;S.obj[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.floor)S.floor[j]='';if(S.roof)delete S.roof[j];if(S.win)delete S.win[j];if(S.rug)delete S.rug[j]}
  const z=BL['${id}'].sz||[1,1],j=Y*W+X;const id='${id}',fl=BL[id].floor;S.rug=S.rug||{};S.roof=S.roof||{};S.win=S.win||{};if(RUGS.has(id)){S.rug[j]=id}else if(CANOPY.has(id)){S.roof[j]=id}else if(WALLD.has(id)||HOME_DOORS.has(id)){for(let a=-1;a<=1;a++)S.obj[j+a]='hwall';if(HOME_DOORS.has(id))S.obj[j]=id;else S.win[j]=id==='window'?1:id}else if(fl&&S.floor){S.floor[j]=id}else{S.obj[j]='${id}';for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)if(a||b){S.obj[j+b*W+a]='part';S.ref[j+b*W+a]=j}}
  try{recount();rebuildStatic(true)}catch(e){}cam.z=3;centerOn((X+z[0]/2)*TS,(Y+z[1]/2)*TS);dirty=true;return z})()`),id);
 await p.waitForTimeout(260);
 await p.screenshot({path:OUT+id+'.png',clip:{x:450-240,y:450-240,width:480,height:480}});
}
console.log(JSON.stringify(errs.slice(0,5)));await b.close()})();
