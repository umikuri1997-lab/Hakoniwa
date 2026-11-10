/* セーブデータの村で、1晩だけを何回も動かす（毎回、同じセーブを読みなおす）。じっさいに遊んだ村で、夜のバランスを見るときに使う。
   使い方：node tools/sim/night-save.cjs <書き出したセーブ.json> <回数> [守りの光 0か1] [ためしたい書きかえのコード]
   セーブは、メニューの「セーブの書き出し」で作ったファイル（草原 hakoniwa-w1-v8 を使う）。リポジトリには入れない。
   出力：1晩ごとに、敵の数・たおした数・けが・こわされた物・やられた子（名前:属性）・火のせいれいのおなかの底。さいごに合計。 */
const fs=require('fs');const file=process.argv[2],N=+process.argv[3]||5,useLight=process.argv[4]==null?1:+process.argv[4],PATCH=process.argv[5]||'';
const raw=JSON.parse(fs.readFileSync(file,'utf8')),str=(raw.saves||raw)['hakoniwa-w1-v8'];if(!str){console.error('草原のセーブ（hakoniwa-w1-v8）がありません');process.exit(1)}
(async()=>{const {browser,page,run,errors}=await require('./boot.cjs')();
await page.evaluate(s=>{window.__SAVE=s},typeof str==='string'?str:JSON.stringify(str));
if(PATCH)await run(PATCH);
const tot={n:0,fireDead:0,otherDead:0,fire:0};
for(let k=0;k<N;k++){
 const info=JSON.parse(await run(`(()=>{continueGame(JSON.parse(window.__SAVE));for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;
  for(const q of S.res){q.hunger=hMax(q);q.energy=100}S.enemies=[];S.t=Math.floor(S.t/1440)*1440+19*60;S.hold=0;S.lastWarn=null;S.lastNight=null;window.N0=S.res.map(r=>r.name+':'+r.elem);window.MINH={};window.LT=0;TESTM=true;S.speed=8;USERPAUSE=false;
  return JSON.stringify({res:S.res.length,fire:S.res.filter(r=>r.elem==='fire').map(r=>r.name+' Lv'+rLv(r)),day:dayNo(),lv:S.lv,watch:cnt('watch'),cleared:!!S.cleared})})()`));
 if(!k)console.log('村',JSON.stringify(info));
 await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:90000});
 const d0=info.day;
 for(let i=0;i<600;i++){await page.waitForTimeout(300);
  const s=await run(`(()=>{for(const sel of ['.idea-reveal button','#lvup button:last-child','#rlv button:last-child']){const b=document.querySelector(sel);if(b&&!b.disabled)b.click()}if(!document.querySelector('#dialog').hidden){try{DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0}catch(e){}const b=document.querySelector('#dlgBtns button');if(b)b.click()}if(sheet!=null)closeSheet();
   const al=S.enemies.filter(e=>e.spawned&&!e.dead);
   if(${useLight}&&al.length&&LIGHTCD<=0&&S.pt>=1){let b=null,bd=1e9;for(const e of al){let d=1e9;for(const r of S.res)d=Math.min(d,Math.hypot(e.x-r.x,e.y-r.y));if(d<bd){bd=d;b=e}}if(b&&bd<12){LT++;guardLight(b)}}
   for(const r of S.res)if(r.elem==='fire')MINH[r.name]=Math.min(MINH[r.name]??1e9,r.hunger|0);
   return (dayNo()>${d0}&&hour()>=6.5&&hour()<12)?'end':''})()`);
  if(s==='end')break}
 const r=JSON.parse(await run(`JSON.stringify({ns:S.ns,gone:N0.filter(n=>!S.res.some(r=>r.name===n.split(':')[0])),minh:MINH,lt:LT})`));
 const fd=r.gone.filter(n=>n.endsWith(':fire')).length;tot.n++;tot.fireDead+=fd;tot.otherDead+=r.gone.length-fd;tot.fire=info.fire.length;
 console.log(JSON.stringify({night:k+1,enemies:r.ns&&r.ns.n,kill:r.ns&&r.ns.kill,hurt:r.ns&&r.ns.hurt,broke:r.ns&&r.ns.broke,boss:r.ns&&r.ns.boss,gone:r.gone,fireMinHunger:r.minh,light:r.lt}));
}
console.log('合計',JSON.stringify(tot),'（fireDead：やられた火のせいれいの合計／fire：1晩にいる火のせいれいの数）');console.log('errors',errors.slice(0,3));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
