/* たっせいの報告の会話（lines.quiet）では、よろこぶ動き（cheer）の音を鳴らさない（たっせいのときに1回鳴らしている）。ほかの会話の cheer は鳴らす */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
const o=await run(`(async()=>{const log=[];const sfx0=sfx;sfx=k=>{log.push(k);return sfx0(k)};const w=()=>new Promise(r=>setTimeout(r,2000));const out={};
  const L=t=>[[POKO,t,'cheer'],[POKO,'うん。']];const shut=()=>{DLGGAP=0;let n=0;while(!$('#dialog').hidden&&n++<20){DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const b=document.querySelector('#dlgBtns button');if(b){b.disabled=false;b.click()}else dlgNext()}};
  log.length=0;dialog(Object.assign(L('できたね！'),{quiet:true}),()=>{});await w();out.quiet=log.filter(k=>k==="level").length;out.qon=DLGQUIET;shut();
  log.length=0;stageMotion('cheer',true);out.open=log.filter(k=>k==='level').length;
  out.qoff=DLGQUIET;log.length=0;dialog(L('やったね！'),()=>{});await w();out.loud=log.filter(k=>k==="level").length;shut();
  sfx=sfx0;return out})()`);
console.log(JSON.stringify(o));
assert.ok(o.qon&&!o.qoff,'報告の会話のあいだだけ');assert.equal(o.quiet,0,'報告の会話の cheer は音なし');assert.equal(o.open,0,'報告のはじめの cheer は音なし');assert.equal(o.loud,1,'ほかの会話の cheer は鳴る');
assert.deepEqual(errors,[]);console.log('report-quiet ok');await browser.close();process.exit(0)})();
