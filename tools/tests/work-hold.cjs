/* 話している子（onHold）・村の時間が止まっているときは、作業の手もとの音（水やりもふくむ）を鳴らさない。鳴っている水やりの音は止める */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await boot();
const out=await run(`(()=>{const out={};const log=[];const sa=sfxAt;sfxAt=(k,x,y)=>{log.push(k)};
 const r=S.res[0];r.nap=false;r.act={type:'water',stage:'do',obj:0,t:0};
 const beat=n=>{for(let i=0;i<n;i++)workBeat(r,'water',i/60)};
 beat(10);out.free=log.length;
 /* 話しているあいだ */log.length=0;DLGN.add(r.name);const d=document.getElementById('dialog'),h=d.hidden;d.hidden=false;
 let cut=0;const pc=pourCut;pourCut=p=>{cut++};POURS.set(r,[{src:{stop(){}},k:{gain:{setTargetAtTime(){}}}}]);
 for(let i=0;i<600;i++){POURU.delete(r);workBeat(r,'water',i/60)}out.hold=log.length;out.cut=cut;out.left=POURS.has(r);
 for(let i=0;i<600;i++)workBeat(r,'build',i/60);out.holdBuild=log.length;
 pourCut=pc;d.hidden=h;DLGN.delete(r.name);
 /* 話しおわったら、また鳴る */log.length=0;beat(10);out.after=log.length;
 sfxAt=sa;return out})()`);
console.log(out);
assert.ok(out.free>=1,'ふだんは鳴る');assert.equal(out.hold,0,'話しているあいだ水やりの音は鳴らない');assert.equal(out.holdBuild,0,'ほかの作業の音も鳴らない');
assert.equal(out.cut,1,'鳴っていた水の音を止める');assert.equal(out.left,false);assert.ok(out.after>=1,'話しおわったら鳴る');
assert.deepEqual(errors,[]);console.log('Work hold: no work sounds while talking. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
