/* 自動プレイを動かして、進みぐあいを JSON に書き出す。
   使い方：node tools/sim/autoplay.cjs <出力.json> <実時間の分> [--supply] [--no-light] [--speed=20] [--from=<セーブ.json>] [--won]
   --from：書き出したセーブから続ける（はじめからでなく）。--won：最後の防衛に勝った村にして続ける（かけらの話から出発までを通す）。
   出力：log（クエスト・レベル・人数）・days（[日,村Lv,合計パワー,パワー,食料,人数,やられた数,たのしさ平均,おなか%平均,クエスト,畑,夜の回数,光の回数,みどり]）・nights・now・errors。
   <出力>.save.json に、いまの村のセーブも書き出す（止まった所を、あとで読みこんで調べられる）。
   クリアしたら、少し待って終わる。 */
const fs=require('fs'),path=require('path');const out=process.argv[2]||'autoplay.json',mins=+process.argv[3]||30,A=process.argv.slice(4);
const FROM=(A.find(a=>a.startsWith('--from='))||'').slice(7),WON=A.includes('--won');
const opts={supply:A.includes('--supply'),light:!A.includes('--no-light'),speed:+((A.find(a=>a.startsWith('--speed='))||'').slice(8))||20};
(async()=>{const {browser,page,run,errors}=await require('./boot.cjs')();
if(FROM){const raw=JSON.parse(fs.readFileSync(FROM,'utf8')),str=(raw.saves||raw)['hakoniwa-w1-v8'];await page.evaluate(s=>{window.__SN=s},typeof str==='string'?str:JSON.stringify(str));
  await run(`(()=>{continueGame(JSON.parse(window.__SN));for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;TESTM=true;S.speed=${opts.speed}})()`);await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:90000});
  if(WON)await run(`(()=>{S.flags.finalWon=1;S.finalNight=false;S.finalOn=false;S.finalDay=null;S.finalLost=null;S.t=Math.floor(S.t/1440)*1440+7*60;const b=S.b2At||{x:CX+.5,y:CY+.5};dropAt(b.x,b.y,'shard')})()`)}
await run('window.BOT_OPTS='+JSON.stringify(opts));console.log(await run(fs.readFileSync(path.join(__dirname,'autoplay-bot.js'),'utf8')),opts);
const t0=Date.now();let done=0;
while(Date.now()-t0<mins*60000){await page.waitForTimeout(20000);
  try{const s=JSON.parse(await run(`JSON.stringify({log:BOT.log,days:BOT.days,nights:BOT.nights,now:['D'+dayNo(),hour().toFixed(1),QUESTS[S.quest]?QUESTS[S.quest].id:'-',paused(),S.cleared?1:0],res:S.res.map(r=>r.name+':'+r.elem[0]+' h'+(r.hunger|0)+' f'+(r.fun|0)+' '+(r.act&&r.act.type)),mat:S.mat,pt:S.pt|0,orders:S.orders.map(o=>o.type),dbg:{gift:GIFT_ACTIVE,pops:SPOT_POPS.length,sheet:sheet,newres:NEWRES,newq:NEWQ.length,dlgq:DLGQ.length,dlg:!$('#dialog').hidden,lvup:!$('#lvup').hidden,rlv:!$('#rlv').hidden,pro:!$('#pro').hidden,menu:!$('#title').hidden||!$('#maps').hidden,nrun:NUSHI_RUN,quiet:sacredQuietActive()},ending:[S.setSh||0,S.shards||0,S.finalDay||0,S.rushN||0,S.finalNight?1:0],dialog:!document.querySelector('#dialog').hidden,wait:(()=>{try{const q=QUESTS[S.qStory!=null?S.qStory:S.quest];if(!q)return '';const p=q.field&&typeof fieldPrepNeed==='function'?fieldPrepNeed(fieldActiveId(q)):null;return [mainTalkWaitText(q)||'',p?p.label:'',qMissing(q).join(','),TALKW||'',S.qTalked?1:0,S.qStory].join(' / ')}catch(e){return 'ERR '+e.message}})(),lost:[(S.buried||[]).map(b=>b.name).join(','),(S.lost||[]).map(b=>b.name).join(',')],events:(S.log||[]).slice(-40)})`));
  s.errors=errors;fs.writeFileSync(out,JSON.stringify(s));try{fs.writeFileSync(out.replace(/\.json$/,'')+'.save.json',JSON.stringify({app:'hakoniwa',v:1,at:Date.now(),saves:{'hakoniwa-w1-v8':await run('JSON.stringify(S)')}}))}catch(e){}/* いまの村も書き出す（止まったとき、あとで読みこんで調べられる。night-save.cjs・watch-stuck.cjs で使える形） */if(s.now[4]&&++done>12)break}catch(e){console.log('read error',String(e.message).slice(0,200))}}
await browser.close()})()
