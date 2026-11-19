/* UIの手ざわり：本物の音（ui_asmr.py）・マップの音の左右とこもり・家の中でこもる・タブの音・±の長おし・行がならぶ・おしこむ深さ・板がしなる・ハンコ・ゲージの音 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  await page.mouse.click(5,5);/* 音を鳴らせるように、いちどさわる */
  await run(`audioInit();AC.resume();window.REC=[];window.RECU=[];{const o=sfx;sfx=function(k){REC.push(k);return o.apply(this,arguments)};const u=playU;playU=function(k){RECU.push(k);return u.apply(this,arguments)}}`);
  await page.waitForFunction(()=>sacredEval(`['stamp','dust','creak','bend','tab','knockw','notch'].every(k=>(SBUF[k]||[]).filter(Boolean).length===SAMPLES[k].length)&&AC.state==='running'`),{},{timeout:20000});
  console.log('UI touch: the recorded sounds load');
  /* 1. マップの音：画面の左は左から、右は右から。遠いほどこもる */
  const pan=JSON.parse(await run(`(()=>{const P=[],F=[];const cp=AC.createStereoPanner.bind(AC),cf=AC.createBiquadFilter.bind(AC);AC.createStereoPanner=()=>{const p=cp();P.push(p);return p};AC.createBiquadFilter=()=>{const f=cf();F.push(f);return f};
    const vw=VW/cam.z,vh=VH/cam.z,cy=(cam.y+vh/2)/TS;lastSfx.plant=0;sfxAt('plant',(cam.x+vw*.15)/TS,cy);const l=P.length?P[P.length-1].pan.value:null,lf=F.length?F[F.length-1].frequency.value:0;lastSfx.plant=0;sfxAt('plant',(cam.x+vw*.85)/TS,cy);const r=P[P.length-1].pan.value;
    lastSfx.plant=0;sfxAt('plant',(cam.x+vw/2)/TS,cy);const cf2=F[F.length-1].frequency.value;AC.createStereoPanner=cp;AC.createBiquadFilter=cf;return JSON.stringify({l,r,lf,cf2,v:SFXV,p:SFXP})})()`));
  assert.ok(pan.l<-.3&&pan.r>.3,'left/right: '+JSON.stringify(pan));assert.ok(pan.lf<pan.cf2,'farther is more muffled');assert.equal(pan.v,1);assert.equal(pan.p,0);
  console.log('UI touch: map sounds come from the left or right, far sounds are softer');
  /* 2. 家の中を映すと、外の音がこもる */
  const ind=JSON.parse(await run(`(()=>{const z0=cam.z;cam.z=homeZ();const vw=VW/cam.z,vh=VH/cam.z,j=(((cam.y+vh/2)/TS)|0)*W+(((cam.x+vw/2)/TS)|0),H0=HOUSES;HOUSES=[{x0:-9,y0:-9,set:new Set([j]),inside:new Set([j])}];OPENH.add('-9,-9');ROOFS.delete('-9,-9');
    ambTick();const a=AMBIN;OPENH.delete('-9,-9');ROOFS.delete('-9,-9');ambTick();const b=AMBIN;HOUSES=H0;cam.z=z0;return JSON.stringify({a,b})})()`));
  assert.deepEqual(ind,{a:true,b:false});console.log('UI touch: inside a house with the roof off, outside sounds are muffled');
  /* 3. タブ：めくる音 */
  await run(`openSheet('res',S.res[0].id)`);await page.waitForTimeout(400);
  await run(`REC.length=0;RECU.length=0;lastSfx.tab=0;document.querySelectorAll('#sheetBody .ctab')[1].click()`);await page.waitForTimeout(80);
  {const r=JSON.parse(await run(`JSON.stringify({u:RECU,s:REC})`));assert.ok(r.s.includes('flip')&&!r.u.includes('tab'),'meadow: only the flip sound '+JSON.stringify(r))}
  await run(`document.body.classList.remove('wd0');REC.length=0;RECU.length=0;lastSfx.tab=0;lastSfx.next=0;document.querySelectorAll('#sheetBody .ctab')[0].click()`);await page.waitForTimeout(80);
  assert.ok(JSON.parse(await run(`JSON.stringify(RECU)`)).includes('tab'),'tab sound');await run(`UIWD=null;uiStageSync()`);console.log('UI touch: tabs flip (meadow: the flip sound only)');
  /* 4. 行が1つずつならぶ */
  await run(`closeSheet();openSheet('menu')`);const rows=+await run(`document.querySelectorAll('#sheetBody .urow').length`);assert.ok(rows>=3,'rows: '+rows);assert.equal(+await run(`document.querySelectorAll('#sheetBody .mtile.urow').length`),0,'meadow menu tiles use the tile stagger');
  await page.waitForTimeout(1200);assert.equal(+await run(`document.querySelectorAll('#sheetBody .urow').length`),0,'the class goes away');console.log('UI touch: rows are placed one by one ('+rows+')');
  /* 5. ±の長おし：だんだん速くかわる。はなしたときの1回はかぞえない */
  await run(`closeSheet();window.NCLK=0;const o=document.createElement('div');o.id='tstep';o.style.cssText='position:fixed;left:200px;top:200px;z-index:99';o.innerHTML='<button class="btn p">＋</button>';o.firstChild.onclick=()=>{sfx('notch');NCLK++};document.body.appendChild(o)`);await page.waitForTimeout(300);
  const pb=await page.$('.btn.p');const bx=await pb.boundingBox();
    await run(`REC.length=0`);await page.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2);await page.mouse.down();await page.waitForTimeout(1300);await page.mouse.up();await page.waitForTimeout(100);
  const n=+await run(`NCLK`);assert.ok(n>=4,'repeats: '+n);await page.waitForTimeout(50);assert.equal(+await run(`NCLK`),n,'the click after letting go does not count');
  console.log('UI touch: holding +/- repeats ('+n+' clicks in 1.3s)');
  await run(`document.getElementById('tstep').remove()`);
  /* 6. おしこむ深さ：長くおすと深くしずみ、はなすと、はねて、ぽよん */
  await run(`const o=document.createElement('div');o.id='tdeep';o.style.cssText='position:fixed;left:200px;top:200px;z-index:99';o.innerHTML='<button class="btn">ボタン</button>';document.body.appendChild(o)`);const mb=await page.$('#tdeep button');const q=await mb.boundingBox();
  await run(`REC.length=0`);await page.mouse.move(q.x+q.width/2,q.y+q.height/2);await page.mouse.down();await page.waitForTimeout(450);
  assert.equal(await run(`!!document.querySelector('.udeep')`),true,'sinks deeper');await page.mouse.up();
  assert.equal(await run(`!!document.querySelector('.uboing2')`),true,'bounces');assert.ok(JSON.parse(await run(`JSON.stringify(REC)`)).includes('boing'));
  await run(`document.getElementById('tdeep').remove()`);console.log('UI touch: long press sinks deeper and bounces back');
  /* 7. はしで板がしなる（ホイール） */
  await run(`closeSheet();openSheet('menu','settings')`);await page.waitForTimeout(500);
  const os=JSON.parse(await run(`(()=>{const b=document.getElementById('sheetBody');b.scrollTop=0;REC.length=0;OSB.wh=0;b.dispatchEvent(new WheelEvent('wheel',{deltaY:-40,bubbles:true}));return JSON.stringify({t:b.style.transform,s:REC.includes('bend'),big:b.scrollHeight>b.clientHeight+1})})()`));
  if(os.big){assert.ok(/translateY/.test(os.t)&&os.s,'bends: '+JSON.stringify(os));await page.waitForTimeout(400);assert.equal(await run(`document.getElementById('sheetBody').style.transform`),'');console.log('UI touch: the board bends at the end of a list and springs back')}
  else console.log('UI touch: (settings list is not long enough to scroll here, skipped the bend check)');
  /* 8. ハンコ・ゲージ */
  await run(`closeSheet();REC.length=0;RECU.length=0;uiStamp(document.querySelector('#quest')||document.body)`);await page.waitForTimeout(300);
  assert.ok(JSON.parse(await run(`JSON.stringify(REC)`)).some(k=>k==='stamp'||k==='ostamp'));
  await run(`REC.length=0;document.getElementById('xpBar').style.width='10%'`);await page.waitForTimeout(50);await run(`document.getElementById('xpBar').style.width='30%'`);await page.waitForTimeout(50);
  assert.ok(JSON.parse(await run(`JSON.stringify(REC)`)).includes('glug'));console.log('UI touch: the stamp goes pom, the gauge goes glug');
  /* 9. ふるえの設定 */
  assert.equal(await run(`SND.vib!==false`),true);
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
