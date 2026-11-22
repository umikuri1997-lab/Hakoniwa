/* 手ざわり：地図の慣性（flingStart・flingTick）・置く前の家具の絵をつまんでずらす（grabAt・grabMove）・わざのボタンの合図（skillReady・skillDeny）・タップしたせいれいの反応（tapReact） */
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
    pending={kind:'one',id,x:cx,y:cy,ok:true};const s=(x,y)=>({x:(x*TS+TS/2-cam.x)*cam.z,y:(y*TS+TS/2-cam.y)*cam.z});let p=s(cx,cy);const tl=tapLv(cx*TS+16,cy*TS+16);if(tl){pending=null;return JSON.stringify({skip:1})}
    const hit=grabAt(p.x,p.y),miss=grabAt(s(cx+3,cy).x,p.y);gest={type:'grab',grab:hit};REC.length=0;const q=s(cx+2,cy+1);grabMove(q.x,q.y);const r={hit:!!hit,miss:!!miss,x:pending.x-cx,y:pending.y-cy,snd:REC.includes('notch')};pending=null;gest=null;setMode('look');return JSON.stringify(r)})()`));
  if(!g.skip){assert.deepEqual(g,{hit:true,miss:false,x:2,y:1,snd:true});console.log('touch: the item waiting to be placed follows the finger, tile by tile')}
  /* 3. わざのボタン：たまった瞬間に、はねて「ちりん」。チャージ中におすと、ふるえる */
  const k=JSON.parse(await run(`(()=>{const el=document.createElement('div');document.body.appendChild(el);REC.length=0;skillReady(el,'t',.5);skillReady(el,'t',1);const a=el.classList.contains('sready')&&REC.includes('tink');REC.length=0;skillReady(el,'t',1);const b=!REC.includes('tink');skillDeny(el);const c=el.classList.contains('ushake');el.remove();return JSON.stringify({a,b,c})})()`));
  assert.deepEqual(k,{a:true,b:true,c:true});console.log('touch: skill buttons pop when ready and shake when not');
  /* 4. タップしたせいれい：ひまな子は正面を向いてはねる */
  const t=JSON.parse(await run(`(()=>{const r={id:99,act:null},w={id:98,act:{type:'chop',stage:'do'}},n=performance.now();tapReact(r);tapReact(w);const a=tapHop(r,n+TAPRMS/2),b=tapHop(w,n+TAPRMS/2),c=tapHop(r,n+TAPRMS+10);return JSON.stringify({a,b,c,gone:!TAPR.has(r)})})()`));
  assert.ok(t.a.free&&t.a.y>6&&!t.b.free&&t.b.y<3&&t.c===null&&t.gone,JSON.stringify(t));console.log('touch: a tapped spirit reacts');
  assert.deepEqual(errors.filter(e=>!/favicon/.test(e)),[]);await browser.close();console.log('touch-feel: ok')})().catch(e=>{console.error(e);process.exit(1)});
