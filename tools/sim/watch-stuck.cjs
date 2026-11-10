/* せいれいが止まったままにならないかを見はる。セーブデータの村（なければ新しい草原）を何日か動かして、
   同じマス・同じ行動のまま長く動かない子、歩こうとして進まない子を、行動のしゅるいごとに出す。
   使い方：node tools/sim/watch-stuck.cjs <日数> [書き出したセーブ.json] [ためしたい書きかえのコード]
   出力：stuck（長く同じ所にいた記録。行動:段階・時間（ゲームの分）・時刻・場所）、walkStuck（歩く段階のまま60分進まない）、
         toasts（行けない・足りないなどの知らせの回数）、errors（画面のエラー）。
   ねむる・見張り台・お話の待ちなど、止まっていてよい行動も出るので、行動の名前で見分ける。 */
const fs=require('fs');const DAYS=+process.argv[2]||3,file=process.argv[3]||'',PATCH=process.argv[4]||'';
(async()=>{const {browser,page,run,errors}=await require('./boot.cjs')();
if(file){const raw=JSON.parse(fs.readFileSync(file,'utf8')),str=(raw.saves||raw)['hakoniwa-w1-v8'];await page.evaluate(s=>{window.__SAVE=s},typeof str==='string'?str:JSON.stringify(str));
  await run(`(()=>{continueGame(JSON.parse(window.__SAVE));for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true})()`);await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:90000})}
if(PATCH)await run(PATCH);
await run(`(()=>{window.W0={t0:S.t,seen:{},stuck:[],walk:[],toasts:{},acts:{}};const t0=toast;toast=function(m,k){const key=String(m).replace(/[0-9]+/g,'#').slice(0,40);W0.toasts[key]=(W0.toasts[key]||0)+1;return t0.apply(this,arguments)};TESTM=true;S.speed=12;S.introSeen=true;S.flags.tapped=1;
 window.W0tick=()=>{for(const sel of ['.idea-reveal button','#lvup button:last-child','#rlv button:last-child']){const b=document.querySelector(sel);if(b&&!b.disabled)b.click()}if(!document.querySelector('#dialog').hidden){try{DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0}catch(e){}const b=document.querySelector('#dlgBtns button');if(b)b.click()}if(sheet!=null)closeSheet();
  const al=S.enemies.filter(e=>e.spawned&&!e.dead);if(al.length&&LIGHTCD<=0&&S.pt>=1){let b=null,bd=1e9;for(const e of al){let d=1e9;for(const r of S.res)d=Math.min(d,Math.hypot(e.x-r.x,e.y-r.y));if(d<bd){bd=d;b=e}}if(b&&bd<12)guardLight(b)}
  for(const r of S.res){const a=r.act,k=(a?a.type+':'+(a.stage||''):'null')+'@'+(r.x|0)+','+(r.y|0),o=W0.seen[r.id];W0.acts[a?a.type:'null']=(W0.acts[a?a.type:'null']||0)+1;
   if(!o||o.k!==k){if(o){const dur=S.t-o.t;if(dur>=180||(o.k.includes(':walk@')&&dur>=60))(o.k.includes(':walk@')?W0.walk:W0.stuck).push([r.name+'('+r.elem[0]+')',o.k,Math.round(dur),'D'+dayNo()+' '+hour().toFixed(1)])}W0.seen[r.id]={k,t:S.t}}}};
 window.W0iv=setInterval(W0tick,200);return 1})()`);
const t0=Date.now();for(;;){await page.waitForTimeout(5000);const st=JSON.parse(await run(`JSON.stringify([(S.t-W0.t0)/1440,S.res.length,paused()])`));if(st[0]>=DAYS||Date.now()-t0>DAYS*12*60000)break}
const out=JSON.parse(await run(`(()=>{for(const r of S.res){const o=W0.seen[r.id];if(o){const dur=S.t-o.t;if(dur>=180)W0.stuck.push([r.name+'('+r.elem[0]+')',o.k,Math.round(dur),'いまも'])}}return JSON.stringify({days:(S.t-W0.t0)/1440,res:S.res.length,stuck:W0.stuck,walk:W0.walk,toasts:W0.toasts,acts:W0.acts})})()`));
const by={};for(const s of out.stuck){const k=s[1].split('@')[0];(by[k]=by[k]||[]).push(s)}
console.log('動かした日数',out.days.toFixed(1),'せいれい',out.res);
console.log('長く同じ所にいた（行動ごとの回数と、長い順に3つ）');for(const k of Object.keys(by).sort((a,b)=>by[b].length-by[a].length))console.log('  ',k,by[k].length+'回',JSON.stringify(by[k].sort((a,b)=>b[2]-a[2]).slice(0,3)));
console.log('歩く段階のまま60分進まない',out.walk.length+'回',JSON.stringify(out.walk.sort((a,b)=>b[2]-a[2]).slice(0,12)));
console.log('知らせ',JSON.stringify(Object.entries(out.toasts).sort((a,b)=>b[1]-a[1]).slice(0,25)));
console.log('errors',JSON.stringify(errors.slice(0,8)));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
