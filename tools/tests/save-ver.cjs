/* セーブの版の番号（S.mig・SAVE_VER・MIGRATIONS・runMigrations）：新しいゲームは SAVE_VER からはじまる・古い版のセーブだけ、足した読みかえが順に1回ずつ走る */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{const out={};out.newVer=S.mig;out.ver=SAVE_VER;
    const keep=MIGRATIONS.slice();const log=[];
    MIGRATIONS.push({v:SAVE_VER+1,f:s=>log.push('a')},{v:SAVE_VER+2,f:s=>log.push('b')});
    const old={mig:SAVE_VER};runMigrations(old);out.log=log.join('');out.after=old.mig;
    runMigrations(old);out.twice=log.join('');
    const mid={mig:SAVE_VER+1};log.length=0;runMigrations(mid);out.mid=log.join('');
    MIGRATIONS.length=0;MIGRATIONS.push(...keep);
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.newVer,r.ver,'新しいゲームは SAVE_VER から');
  assert.equal(r.log,'ab','古い版は順に走る');assert.equal(r.after,r.ver+2);
  assert.equal(r.twice,'ab','2回読みこんでも、もう走らない');
  assert.equal(r.mid,'b','とちゅうの版は、のこりだけ');
  await page.waitForTimeout(300);assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
