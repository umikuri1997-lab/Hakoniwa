/* チップを、ゲームそのものの中に置いて写す（スキル pixel-redraw）。サーバーは自分で立てる。
   node tools/art/chipview.cjs <出力フォルダ> <id> [<となりに置く id>...]
   出る物：view_3.png・view_2.png・view_1.3.png（はじめの id と、となりの物をならべた絵。3倍・2倍・1.3倍）
           gv/<id>.png（マップチップ工房の「ゲームの中で」用。480×480・3倍・置いたマスがまん中）
   そのあと：python3 tools/gameview_grid.py <出力>/gv <出力>/gvout <gameinfo.json>   （gameinfo.json は {"<id>":{"sz":[よこ,たて]}}）
   置けるのは、S.obj に置く物（家具・建物・自然の物）。壁にかける物・床・ラグ・屋根は tools/gameview.js を見る。 */
const path=require('path'),fs=require('fs'),boot=require(path.join(__dirname,'..','sim','boot.cjs'));
const [OUT,ID,...NB]=process.argv.slice(2);if(!OUT||!ID){console.log('node tools/art/chipview.cjs <出力フォルダ> <id> [<となりに置く id>...]');process.exit(1)}
if(!process.env.CHROME_PATH)process.env.CHROME_PATH='/opt/pw-browsers/chromium';
(async()=>{fs.mkdirSync(path.join(OUT,'gv'),{recursive:true});
const {browser,page,run,errors}=await boot({viewport:{width:900,height:900}});
await page.waitForFunction(()=>sacredEval('assetsOK&&stageReady()'));
const prep=`S.spotSeen=Object.fromEntries(SPOTS.map(s=>[s.k,1]));USERPAUSE=true;document.querySelectorAll('.hud,.dock,.quest,#qrow,.qrow,#skill,#toast').forEach(e=>e.style.visibility='hidden');S.res.forEach(r=>r.hidden=true);S.t=Math.floor(S.t/1440)*1440+12*60;S.hold=0;
 const X=CX+8,Y=CY+8,clr=()=>{for(let b=-5;b<8;b++)for(let a=-5;a<14;a++){const j=(Y+b)*W+X+a;S.obj[j]='';S.ground[j]=0;if(S.hi)S.hi[j]=0;if(S.floor)S.floor[j]=''}};
 const fin=()=>{try{recount();rebuildStatic(true)}catch(e){}SPOT_POPS.length=0;document.querySelectorAll('.idea-reveal').forEach(e=>e.remove());GIFT_ACTIVE=false;dirty=true};`;
const bad=await run(`[${JSON.stringify([ID,...NB])}].flat().filter(k=>!BL[k])`);if(bad.length){console.log('BL にない id:',bad.join(' '));await browser.close();process.exit(1)}
/* 1 工房用：1つだけ */
const z=await run(`(()=>{${prep}clr();const z=BL['${ID}'].sz||[1,1];S.obj[Y*W+X]='${ID}';fin();cam.z=3;centerOn((X+z[0]/2)*TS,(Y+z[1]/2)*TS);return z})()`);
await page.waitForTimeout(700);await page.screenshot({path:path.join(OUT,'gv',ID+'.png'),clip:{x:450-240,y:450-240,width:480,height:480}});
fs.writeFileSync(path.join(OUT,'gameinfo.json'),JSON.stringify({[ID]:{sz:z}}));
/* 2 ならべて：id・となりの物・id（2マスおき） */
const row=[ID,...NB,ID];
await run(`(()=>{${prep}clr();const L=${JSON.stringify(row)};L.forEach((k,i)=>{S.obj[Y*W+X+i*2]=k});fin();window.__cv=[(X+L.length-.5)*TS,(Y+.5)*TS]})()`);
for(const k of [3,2,1.3]){await run(`cam.z=${k};centerOn(__cv[0],__cv[1]);dirty=true`);await page.waitForTimeout(500);await page.screenshot({path:path.join(OUT,'view_'+k+'.png'),clip:{x:0,y:300,width:900,height:300}})}
console.log(errors.length?'エラー: '+JSON.stringify(errors):'エラーなし');console.log('書き出した:',OUT);await browser.close()})();
