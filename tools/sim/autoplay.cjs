/* 自動プレイを動かして、進みぐあいを JSON に書き出す。
   使い方：node tools/sim/autoplay.cjs <出力.json> <実時間の分> [--supply] [--no-light] [--speed=20]
   出力：log（クエスト・レベル・人数）・days（[日,村Lv,合計パワー,パワー,食料,人数,やられた数,たのしさ平均,おなか%平均,クエスト,畑,夜の回数,光の回数,みどり]）・nights・now・errors。
   クリアしたら、少し待って終わる。 */
const fs=require('fs'),path=require('path');const out=process.argv[2]||'autoplay.json',mins=+process.argv[3]||30,A=process.argv.slice(4);
const opts={supply:A.includes('--supply'),light:!A.includes('--no-light'),speed:+((A.find(a=>a.startsWith('--speed='))||'').slice(8))||20};
(async()=>{const {browser,page,run,errors}=await require('./boot.cjs')();
await run('window.BOT_OPTS='+JSON.stringify(opts));console.log(await run(fs.readFileSync(path.join(__dirname,'autoplay-bot.js'),'utf8')),opts);
const t0=Date.now();let done=0;
while(Date.now()-t0<mins*60000){await page.waitForTimeout(20000);
  try{const s=JSON.parse(await run(`JSON.stringify({log:BOT.log,days:BOT.days,nights:BOT.nights,now:['D'+dayNo(),hour().toFixed(1),QUESTS[S.quest]?QUESTS[S.quest].id:'-',paused(),S.cleared?1:0],res:S.res.map(r=>r.name+':'+r.elem[0]+' h'+(r.hunger|0)+' f'+(r.fun|0)+' '+(r.act&&r.act.type)),mat:S.mat,pt:S.pt|0,orders:S.orders.map(o=>o.type),ending:[S.setSh||0,S.shards||0,S.finalDay||0,S.rushN||0,S.finalNight?1:0],dialog:!document.querySelector('#dialog').hidden,events:(S.log||[]).slice(-40)})`));
  s.errors=errors;fs.writeFileSync(out,JSON.stringify(s));if(s.now[4]&&++done>12)break}catch(e){console.log('read error',String(e.message).slice(0,200))}}
await browser.close()})()
