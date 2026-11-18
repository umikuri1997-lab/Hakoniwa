/* トンカチのトンの音（work-fx.js の WBEAT）：建てる・直す・もの作りで、ふりおろした所（動きの 0）で1回ずつ鳴る。村の時間ごとには鳴らない */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await boot();
const out=await run(`(()=>{const out={};const log=[];const sa=sfxAt;sfxAt=(k,x,y)=>{log.push(k)};
 const r=JSON.parse(JSON.stringify(S.res[0]));r.id=901;r.nap=false;r.act={type:'build',stage:'do',obj:0,t:0};
 for(const nm of ['build','repair','craft','wbham']){log.length=0;const m=SPM[nm],per=1/m.r,ph=[];for(let i=0;i<=Math.round(per*3.5*60);i++){const t=i/60,n=log.length;workBeat(r,nm,t);if(log.length>n)ph.push(Math.floor(((t*m.r)%1)*m.n))}out[nm]={n:log.length,snd:[...new Set(log)],frame:[...new Set(ph)]}}
 /* 建てる・直すの tick では鳴らさない */log.length=0;S.obj[0]='site';S.dyn[0]={p:0,need:{},got:{}};for(let i=0;i<100;i++)ACT.build.tick(r,r.act,.5);out.tick=log.length;sfxAt=sa;
 out.hit=typeof playHit==='function'&&NAILHIT.length===4;return out})()`);
console.log(out);
for(const nm of ['build','repair','craft','wbham']){assert.equal(out[nm].n,3,nm+' 3回ふって3回');assert.deepEqual(out[nm].frame,[0],nm+' 打つコマで')}
assert.deepEqual(out.build.snd,['bnail']);assert.deepEqual(out.repair.snd,['nail']);assert.equal(out.tick,0);assert.ok(out.hit);
assert.deepEqual(errors,[]);console.log('Hammer beat: one tok per swing, on the hit frame. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
