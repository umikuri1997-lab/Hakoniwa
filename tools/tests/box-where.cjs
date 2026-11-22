const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
/* どの箱に入っているか（boxWhere・boxWhereSec・boxWherePop・boxLook）と、図鑑の弱点が WEAKKN ひきで出ること */
(async()=>{const {browser,run,errors}=await boot();
  const a=JSON.parse(await run(`(()=>{S.introSeen=true;USERPAUSE=true;const r=S.res[0],x0=r.x|0,y0=r.y|0,A=(y0+2)*W+x0+3,B=(y0+2)*W+x0+6;S.obj[A]='crate';S.obj[B]='crate';recount();
    S.mat.wood=0;S.fs.berry=0;syncFood();boxSync();S.box[A]={};S.box[B]={};S.pile={};bput(A,'wood',3);bput(B,'wood',7);availAdd('wood',10);bput(B,fkey('berry'),2);availAdd(fkey('berry'),2);boxSync();
    const w=boxWhere('wood'),f=boxWhere(fkey('berry'));
    otakiPop('wood');const pop=[...document.querySelectorAll('.bwhere')].pop(),rows=pop?pop.querySelectorAll('.btn').length:0,txt=pop?pop.textContent:'';
    const z0=SPOTFX.length;pop.querySelector('.btn').click();const look=SPOTFX.length-z0,gone=!document.querySelector('.bwhere');
    boxWherePop(fkey('berry'),'ベリー 2こ',null);const fp=document.querySelector('.bwhere').textContent;document.querySelector('.bwhere').closest('[style*="fixed"]').remove();
    boxWherePop('stone','石材 0こ',null);const none=document.querySelector('.bwhere').textContent;document.querySelector('.bwhere').closest('[style*="fixed"]').remove();
    return JSON.stringify({w:w.L.map(x=>[x[0]===B?'B':'A',x[1]]),f:f.L.length,rows,txt,look,gone,fp,none})})()`));
  assert.deepEqual(a.w,[['B',7],['A',3]],'boxes, most first');assert.equal(a.f,1);assert.equal(a.rows,2,'a look button per box');assert.ok(/木箱/.test(a.txt)&&/7こ/.test(a.txt),a.txt);
  assert.equal(a.look,1,'look lights the box');assert.ok(a.gone,'look closes the popup');assert.ok(/2こ/.test(a.fp),a.fp);assert.ok(/入っていません/.test(a.none),a.none);
  /* 弱点：WEAKKN ひき追いはらうまでは「？？？」 */
  const z=JSON.parse(await run(`(()=>{S.seenEn=S.seenEn||{};S.seenEn.hana=1;S.enKills=S.enKills||{};const t=()=>{openSheet('menu','zukan');ZKW=WD;ZKT=4;renderSheet();const s=document.getElementById('sheetWrap').textContent;closeSheet();return s};
    S.enKills.hana=WEAKKN-1;const s0=t();S.enKills.hana=WEAKKN;const s1=t();return JSON.stringify({q:/弱点 ？？？/.test(s0),n:s1.includes('弱点 '+ELEM[WEAK.hana].name),k:WEAKKN})})()`));
  assert.deepEqual(z,{q:true,n:true,k:10},'weak point: '+JSON.stringify(z));
  assert.deepEqual(errors,[],'no errors');console.log('box-where ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
