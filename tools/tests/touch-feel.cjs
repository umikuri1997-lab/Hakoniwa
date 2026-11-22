/* 手ざわり：体力ゲージのへった分（hpGhost）・作業のバーのできた（workBarDone）・シートをなでてとじる・ズームのはし（zoomRubber・zoomSettle）・地図の慣性（flingStart・flingTick）・置く前の家具の絵をつまんでずらす（grabAt・grabMove）・わざのボタンの合図（skillReady・skillDeny）・タップしたせいれいの反応（tapReact） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  await run(`window.REC=[];{const o=sfx;sfx=function(k){REC.push(k);return o.apply(this,arguments)}}`);
  /* 1. 地図の慣性：はやくはなすと、すべって止まる。ゆっくりはなすと、すべらない */
  const f=JSON.parse(await run(`(()=>{cam.z=1.5;centerOn(W*TS/2,H*TS/2);camAnim=null;const t=performance.now(),x0=cam.x;flingStart([{t:t-50,x:400,y:300},{t:t-5,x:300,y:300}]);const on=!!FLING;let n=0;while(FLING&&n<200){flingTick(1/30);n++}const moved=cam.x-x0;
    flingStart([{t:t-50,x:400,y:300},{t:t-5,x:398,y:300}]);const slow=!!FLING;FLING=null;return JSON.stringify({on,moved,n,slow})})()`));
  assert.ok(f.on&&f.moved>20&&f.n<200&&!f.slow,'fling '+JSON.stringify(f));console.log('touch: the map glides after a fast flick and stops ('+Math.round(f.moved)+' pts, '+f.n+' frames)');
  /* 2. 置く前の絵をつまんで、ずらす */
  const g=JSON.parse(await run(`(()=>{setMode('build');const id=Object.keys(BL).find(k=>BL[k].kind==='furn'&&!ROTS[k]&&(szR(k,0)||[1,1])[0]===1&&(szR(k,0)||[1,1])[1]===1);sel=id;S.unlocked[id]=true;const cx=Math.floor((cam.x+VW/cam.z/2)/TS),cy=Math.floor((cam.y+VH/cam.z/2)/TS);
    pending={kind:'one',id,x:cx,y:cy,ok:true};const s=(x,y)=>w2s(x*TS+TS/2,y*TS+TS/2);let p=s(cx,cy);const tl=hiAt(cy*W+cx)>0;if(tl){pending=null;return JSON.stringify({skip:1})}
    const hit=grabAt(p.x,p.y),miss=grabAt(s(cx+3,cy).x,s(cx+3,cy).y);gest={type:'grab',grab:hit};REC.length=0;const q=s(cx+2,cy+1);grabMove(q.x,q.y);const r={hit:!!hit,miss:!!miss,x:pending.x-cx,y:pending.y-cy,snd:REC.includes('notch')};pending=null;gest=null;setMode('look');return JSON.stringify(r)})()`));
  if(!g.skip){assert.deepEqual(g,{hit:true,miss:false,x:2,y:1,snd:true});console.log('touch: the item waiting to be placed follows the finger, tile by tile')}
  /* 3. わざのボタン：たまった瞬間に、はねて「ちりん」。チャージ中におすと、ふるえる */
  const k=JSON.parse(await run(`(()=>{const el=document.createElement('div');document.body.appendChild(el);REC.length=0;skillReady(el,'t',.5);skillReady(el,'t',1);const a=el.classList.contains('sready')&&REC.includes('tink');REC.length=0;skillReady(el,'t',1);const b=!REC.includes('tink');skillDeny(el);const c=el.classList.contains('ushake');el.remove();return JSON.stringify({a,b,c})})()`));
  assert.deepEqual(k,{a:true,b:true,c:true});console.log('touch: skill buttons pop when ready and shake when not');
  /* 4. タップしたせいれい：ひまな子は正面を向いてはねる */
  const t=JSON.parse(await run(`(()=>{const r={id:99,act:null},w={id:98,act:{type:'chop',stage:'do'}},n=performance.now();tapReact(r);tapReact(w);const a=tapHop(r,n+TAPRMS/2),b=tapHop(w,n+TAPRMS/2),c=tapHop(r,n+TAPRMS+10);return JSON.stringify({a,b,c,gone:!TAPR.has(r)})})()`));
  assert.ok(t.a.free&&t.a.y>6&&!t.b.free&&t.b.y<3&&t.c===null&&t.gone,JSON.stringify(t));console.log('touch: a tapped spirit reacts');
  /* 5. 体力ゲージ：へった分は、しばらくのこってから、ちぢむ */
  const h=JSON.parse(await run(`(()=>{const e={},n=1e6;hpGhost(e,1,n);const a=hpGhost(e,.5,n+10),b=hpGhost(e,.5,n+HPGHOLD-10),c=[];for(let t=n+HPGHOLD;t<n+HPGHOLD+2000;t+=50)c.push(hpGhost(e,.5,t));return JSON.stringify({a,b,end:c[c.length-1]})})()`));
  assert.ok(h.a===1&&h.b===1&&h.end===.5,JSON.stringify(h));console.log('touch: lost health stays white for a moment, then shrinks');
  /* 6. 作業のバー：いっぱいでおわったら光って消える。とちゅうでやめたら、すぐ消える */
  const w=JSON.parse(await run(`(()=>{const a={},b={},n=performance.now();WBAR.set(a,{f:.97,dx:0,dy:0,t:n-20,done:0});WBAR.set(b,{f:.3,dx:0,dy:0,t:n-20,done:0});workBarDone(a,0,0,n);workBarDone(b,0,0,n);const r={a:WBAR.has(a),b:WBAR.has(b)};workBarDone(a,0,0,n+WBDONE+5);r.a2=WBAR.has(a);return JSON.stringify(r)})()`));
  assert.deepEqual(w,{a:true,b:false,a2:false});console.log('touch: a finished work bar flashes, then goes away');
  /* 7. ズーム：はしをこえてもう少しのび、はなすと、もどる */
  const z=JSON.parse(await run(`(()=>{FLING=null;camAnim=null;const big=zoomRubber(ZMAX*2),small=zoomRubber(minZ()/2);cam.z=big;zoomSettle(VW/2,VH/2);let n=0;while(ZBACK&&n<60){zoomBackTick(1/30);n++}return JSON.stringify({big,small,mn:minZ(),after:cam.z,n})})()`));
  assert.ok(z.big>3&&z.big<=3*1.1+1e-6&&z.small<z.mn&&z.small>=z.mn*.9-1e-6&&Math.abs(z.after-3)<1e-6&&z.n<60,JSON.stringify(z));console.log('touch: zoom goes a little past the limit and springs back');
  /* 8. シート：見出しを下へなでると、とじる。少しだけなら、もどる */
  await run(`openSheet('res',S.res[0].id)`);await page.waitForTimeout(500);
  const hb=await (await page.$('#sheetWrap .sheet>header h2')).boundingBox();const sx=hb.x+hb.width/2,sy=hb.y+hb.height/2;
  await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx,sy+30,{steps:4});await page.mouse.up();await page.waitForTimeout(400);
  assert.equal(await run(`!document.querySelector('#sheetWrap').hidden&&!document.querySelector('#sheetWrap .sheet').style.transform`),true,'a short drag springs back');
  await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx,sy+160,{steps:6});await page.mouse.up();await page.waitForTimeout(500);
  assert.equal(await run(`document.querySelector('#sheetWrap').hidden&&sheet==null`),true,'a long drag closes');console.log('touch: the sheet closes with a downward swipe');
  assert.deepEqual(errors.filter(e=>!/favicon/.test(e)),[]);await browser.close();console.log('touch-feel: ok')})().catch(e=>{console.error(e);process.exit(1)});
