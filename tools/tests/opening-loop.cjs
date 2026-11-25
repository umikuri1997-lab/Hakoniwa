/* オープニングの曲：はじめに1まわしの録音にして、くりかえす（読みこみで重くても、1音ずつ用意しないので、こまぎれの「カッ」「ザッ」にならない）。遊びはじめたら止める */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await page.mouse.click(450,350);await run(`(()=>{SND.sfx=SND.bgm=true;audioInit();AC.resume();if(sheet)closeSheet()})()`);
await page.waitForFunction(()=>sacredEval(`AC.state==='running'&&!!OPBUF`),{},{timeout:30000});
const o=await run(`(()=>{const d=OPBUF.getChannelData(0);let s=0;for(const v of d)s+=v*v;return{dur:+OPBUF.duration.toFixed(2),rms:Math.sqrt(s/d.length)}})()`);
await run(`(()=>{window.__O=0;const f=openStep;openStep=function(...a){__O++;return f.apply(this,a)};$('#title').hidden=false;wantSong=curSong='opening';bgmSw=0})()`);
await page.waitForTimeout(1500);o.title=await run(`({src:!!OPSRC,osc:__O})`);
await run(`$('#title').hidden=true`);await page.waitForFunction(()=>sacredEval(`curSong!=='opening'`),{},{timeout:20000}).catch(()=>{});/* うすくして（2.4秒）から曲をかえる */o.game=await run(`({src:!!OPSRC,cur:curSong,want:wantSong,sw:bgmSw,t:AC.currentTime})`);
console.log(o);
assert.equal(o.dur,24.62,'64こまぶん');assert.ok(o.rms>.01,'音が入っている');
assert.equal(o.title.src,true,'タイトルでは録音をくりかえす');assert.equal(o.title.osc,0,'1音ずつ作らない');
assert.equal(o.game.src,false,'遊びはじめたら止める');
assert.deepEqual(errors,[]);console.log('Opening loop ok. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
