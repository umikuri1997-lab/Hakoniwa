/* 1晩だけの実験：4人の村（フタバ・ノドカ・火のキーキャラLv1・水のせいれい）で、夜のようすを追う。
   使い方：node tools/sim/night.cjs <守りの光 0か1> <回数> [n4（敵を4体に）・fence（柵でかこんだ村）・fence2（柵＋見張り台2つ・5人）・""] [ためしたい書きかえのコード]
   出力：1晩ごとに、夜の結果（ns）・火のせいれいが生きのこったか（hono）・おなかの動き（時刻:おなか/敵の数）。
   村：見張り台1・とげの罠2・木の矢60・食料40・ベッド4・夜の回数16（カタカゲ・ワナクイが出るころ）。 */
const useLight=+process.argv[2]||0,N=+process.argv[3]||3,VAR=process.argv[4]||'';const PATCH=process.argv[5]||'';/* ためしたい書きかえ（ゲームの中で1回動かすコード）。例："waveArrivalDelay=(i)=>i*60" */
(async()=>{const {browser,page,run,errors}=await require('./boot.cjs')();
const out=[];
for(let k=0;k<N;k++){
 await run(`(()=>{newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;S.introSeen=true;S.flags.tapped=1;S.flags.minaCame=true;S.hold=0;
  resetVillageTransient();S.quest=questIndexOf('ookage');S.qTalked=true;S.qStory=null;S.subDone={};S.enemyOn=true;S.nights=16;S.lv=3;S.totalPt=450;S.pt=300;
  const r=S.res[0];for(const [el,n] of [['earth',MINA],['fire',FIXK0.fire],['water','アオ']])S.res.push(mkRes(S,n,el,50,54));
  for(const [x,y] of [[49,52],[50,52],[51,52]])S.obj[y*W+x]='hwall';
  const put=(id,x,y)=>{S.obj[y*W+x]=id;if(BL[id].dyn)S.dyn[y*W+x]=S.dyn[y*W+x]||{}};
  put('statue',54,57);put('crate',50,55);put('crate',52,55);put('table',49,50);for(const x of [48,49,50,51])put('bed',x,49);
  put('watch',56,62);put('spike',54,64);put('spike',53,64);S.inv.arrow=60;S.unlocked.watch=true;
  if('${VAR}'==='fence'||'${VAR}'==='fence2'){/* 柵でかこんだ村：家・箱・神殿・見張り台を、柵の四角（44〜60,45〜66）でかこみ、南に柵のドア。罠を南の入り口の外に */
    for(let x=44;x<=60;x++)for(const y of [45,66])if(!S.obj[y*W+x])S.obj[y*W+x]='fence';for(let y=45;y<=66;y++)for(const x of [44,60])if(!S.obj[y*W+x])S.obj[y*W+x]='fence';
    S.obj[66*W+52]='gate';for(const [x,y] of [[51,68],[52,68],[53,68],[52,69]])S.obj[y*W+x]='spike';S.obj[64*W+54]='';S.obj[64*W+53]='';
    for(let y=46;y<=65;y++)for(let x=45;x<=59;x++){const o=S.obj[y*W+x];if(o&&BL[o]&&BL[o].natural)S.obj[y*W+x]=''}/* 柵の中の木・岩はどける */
    if('${VAR}'==='fence2'){put('watch',48,62);S.res.push(mkRes(S,'ハル','wood',50,54))}/* fence2：見張り台2つ・木のせいれい2人（5人の村） */
  }
  S.fs={imo:40};S.food=40;recount();for(const q of S.res){q.hunger=hMax(q);q.energy=100;q.fun=70}
  S.t=1440*20+19*60;S.lastWarn=null;S.bossWarn=dayNo()+5;TESTM=true;S.speed=8;window.TR=[];window.LT=0;window.CUT=0;${PATCH?'if(!window.PATCHED){window.PATCHED=1;'+PATCH+'}':''}USERPAUSE=false})()`);
 await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:90000});
 for(let i=0;i<400;i++){await page.waitForTimeout(300);
  const s=await run(`(()=>{for(const sel of ['.idea-reveal button','#lvup button:last-child','#rlv button:last-child']){const b=document.querySelector(sel);if(b&&!b.disabled)b.click()}if(!document.querySelector('#dialog').hidden){try{DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0}catch(e){}const b=document.querySelector('#dlgBtns button');if(b)b.click()}if(sheet!=null)closeSheet();
   if('${VAR}'==='n4'&&!CUT&&S.enemies.length>=6){CUT=1;S.enemies.length=4}const h=S.res.find(r=>r.elem==='fire');const al=S.enemies.filter(e=>!e.dead);
   if(${useLight}&&al.length&&LIGHTCD<=0){let b=null,bd=1e9;for(const e of al){let d=1e9;for(const r of S.res)d=Math.min(d,Math.hypot(e.x-r.x,e.y-r.y));if(d<bd){bd=d;b=e}}if(b&&bd<12){LT++;guardLight(b)}}
   if(al.length||isNight())TR.push([+hour().toFixed(1),al.length,al.reduce((a,e)=>a+e.hp,0)|0,h?[h.hunger|0,h.act&&h.act.type,al.filter(e=>Math.hypot(e.x-h.x,e.y-h.y)<1.6).length,al.filter(e=>Math.hypot(e.x-h.x,e.y-h.y)<3).length]:'DEAD',S.food,S.inv.arrow]);
   return (hour()>=6.5&&hour()<12&&S.t>1440*21)?'end':''})()`);
  if(s==='end')break}
 const r=JSON.parse(await run(`JSON.stringify({wave:S.wave,ns:S.ns,hono:!!S.res.find(r=>r.elem==='fire'),res:S.res.map(r=>r.name+' h'+(r.hunger|0)),lt:LT,tr:TR.filter((x,i)=>i%4===0),bur:(S.buried||[]).map(b=>b.name),hmax:200})`));
 out.push(r);console.log(JSON.stringify({ns:r.ns,hono:r.hono,res:r.res,lt:r.lt,bur:r.bur,honoTrace:r.tr.filter(x=>x[1]>0).map(x=>x[0]+':'+(x[3]==='DEAD'?'DEAD':x[3][0])+'/'+x[1]).join(' ')}).slice(0,1500));console.log('---');
}
console.log('errors',errors.slice(0,3));await browser.close()})()
