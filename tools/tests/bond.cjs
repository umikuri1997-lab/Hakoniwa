const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;S.introSeen=true;S.flags.minaCame=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=30;S.feat={summon:true,build:true,plant:true,craft:true,people:true};for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5),mkRes(S,MINA,'earth',CX+1.5,CY+.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,CX+i+2.5,CY+.5))];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}S.spotSeen=Object.fromEntries(SPOTS.map(x=>[x.k,1]));for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  console.log('gains',await run(`(()=>{const [f,n,h,m,k]=S.res;
    if(bondOf(f,n)!==0)throw Error('not zero at start');
    mate(f,n,3);if(bondOf(f,n)!==3)throw Error('chat +3');
    /* 同じ遊び家具 */const j=CY*W+CX+5;S.obj[j]='swing';n.act={type:'play',stage:'do',obj:j,t:0};const a={obj:j};bondPlayStart(f,a);bondPlayStart(f,a);if(bondOf(f,n)!==4)throw Error('play +1 once '+bondOf(f,n));S.obj[j]='';endAct(n);
    /* 同じ夜 */S.enemyOn=true;S.t=1440*2+60;h.act={type:'patrol',stage:'do',t:0};k.act={type:'watchpost',stage:'do',t:0};bondNightTick();bondNightTick();if(bondOf(h,k)!==2.5)throw Error('night +2.5 once '+bondOf(h,k));
    S.t=1440*3+60;bondNightTick();if(bondOf(h,k)!==5)throw Error('next night +2.5');endAct(h);endAct(k);S.enemyOn=false;S.t=1440*3+720;
    /* 思い出帳ではふえない：IS_STORY_REPLAY は const なので、セーブの値を見る */
    for(let i=0;i<40;i++)mate(f,n,3);if(bondOf(f,n)!==100)throw Error('cap 100');
    if(!/なかよし/.test(JSON.stringify(S.memo||[])))throw Error('no memo at 30');return 'chat+3 play+1 night+2.5 cap100'})()`));
  console.log('talk 30 once',await run(`(()=>{const [f,n,h,m,k]=S.res;S.bond={};bondAdd(h,m,30);bondTick();const key='bd_'+bondKey(h,m),e=SEV1.find(x=>x.k===key);if(!e)throw Error('no entry');
    const L=sevLines(e.L);if(!L||L.length<3||!L.every(l=>[h.name,m.name].includes(l[0])))throw Error('bad lines '+JSON.stringify(L));
    S.sevQuietUntil=0;S.sevTalkAt=null;checkSev();if(!(S.sevP||[]).includes(key))throw Error('not queued '+JSON.stringify(S.sevP));
    S.sev[key]=1;S.sevP=[];checkSev();if(S.sevP.includes(key))throw Error('repeated');
    /* 名前のない組は属性の会話 */const x=mkRes(S,'テスト','fire',CX+8.5,CY+.5);S.res.push(x);bondAdd(x,k,30);const g=sevLines(bondLines(bondKey(x,k)));S.res.pop();if(!g||g.length!==3)throw Error('generic');
    return L.map(l=>l.join('：')).join(' / ')})()`));
  console.log('invite 60',await run(`(()=>{const [f,n]=S.res;S.bond={};bondAdd(f,n,60);for(const r of S.res){endAct(r);r.act={type:'idle',stage:'do',t:0,dur:30}}
    const j=(CY+3)*W+CX-4;S.obj[j]='sandbox';recount();const G=bfs(f.x|0,f.y|0),st=nearest(G,k=>walk(k)&&adjOf(k,t=>anc(t)===j)>=0,45);endAct(f);
    startAct(f,G,'play',st,{key:'o'+j,obj:j,what:'sandbox',fun:40,dur:40,pt:3,pw:1,nig:false});const ok=bondInvite(f,f.act);
    if(!ok||n.act.type!=='play'||n.act.obj!==j)throw Error('no invite '+JSON.stringify(n.act));
    for(let i=0;i<200&&!(n.act&&n.act.stage==='do'&&f.act&&f.act.stage==='do');i++){updRes(f,.3);updRes(n,.3)}
    S.obj[j]='';endAct(f);endAct(n);return 'friend joined play at the same toy, bond '+bondOf(f,n)})()`));
  console.log('speed 100',await run(`(()=>{const [f,n,h]=S.res;S.bond={};const w0=rMul(f,'work');bondAdd(f,n,100);n.x=f.x+2;n.y=f.y;bondNearTick();const w1=rMul(f,'work');
    if(Math.abs(w1/w0-1.05)>1e-9)throw Error('no +5% '+w0+' '+w1);bondAdd(f,h,100);h.x=f.x+1;h.y=f.y;bondNearTick();if(Math.abs(rMul(f,'work')/w0-1.05)>1e-9)throw Error('stacked');
    n.x=f.x+6;h.x=f.x+6;bondNearTick();if(rMul(f,'work')!==w0)throw Error('far still fast');return 'x1.05 within 3, no stacking, off when apart'})()`));
  console.log('panel',await run(`(()=>{const [f,n]=S.res;S.bond={};bondAdd(f,n,63);const b=bondBest(f);return b.q.name+'（'+b.v+'）'})()`));
  console.log('volcano',await run(`(()=>{setWorld(1);S=newState(1);LIVE[1]=S;started=true;S.t=720;S.hold=0;S.sevQuietUntil=0;const [a,b]=S.res.length>=2?S.res:[S.res[0],(S.res.push(mkRes(S,SHIZUKU,'water',S.res[0].x+1,S.res[0].y)),S.res[1])];for(const r of S.res){r.hunger=hMax(r);r.energy=100}
    bondAdd(a,b,30);bondTick();const key='bd_'+bondKey(a,b);if(!(S.sevP||[]).includes(key))throw Error('volcano not queued '+JSON.stringify(S.sevP));return a.name+'・'+b.name+'：'+sevLines(SEV1.find(e=>e.k===key).L).map(l=>l[1]).join(' / ')})()`));
  /* なかよしになったら、ポップアップで知らせる（どの2人でも） */
  console.log('popup',await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5),mkRes(S,'木の子a','wood',CX+1.5,CY+.5),mkRes(S,'木の子b','wood',CX+2.5,CY+.5)];SPOT_POPS.length=0;GIFT_ACTIVE=false;document.querySelectorAll('.gift-reveal').forEach(e=>e.remove());
    const [f,a,b]=S.res;bondAdd(a,b,29);if(SPOT_POPS.length)throw Error('popup before 30');bondAdd(a,b,1);if(SPOT_POPS.length!==1)throw Error('no popup at 30');bondAdd(a,b,40);if(SPOT_POPS.length!==1)throw Error('popup again');bondSet(f,a,30);if(SPOT_POPS.length!==2)throw Error('second pair');
    showSpotPop();const c=document.querySelector('.gift-reveal');if(!c)throw Error('not shown');const t=c.textContent;if(!/なかよし！/.test(t)||!t.includes('木の子aと木の子b')||!t.includes('なかよしになった'))throw Error('text '+t);c.remove();GIFT_ACTIVE=false;showSpotPop();const t2=document.querySelector('.gift-reveal').textContent;document.querySelector('.gift-reveal').remove();GIFT_ACTIVE=false;return t+' / '+t2})()`));
  assert.deepEqual(errors,[]);await browser.close();console.log('ok');
})().catch(e=>{console.error(e);process.exit(1)});
