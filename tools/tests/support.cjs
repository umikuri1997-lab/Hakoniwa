/* なかよし60・100の会話・ならんで戦う力・助けてにげる・コワイノのねらい線（js/support.js・js/bond.js） */
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
  /* 会話の表：どの組にも60・100の会話がある・名前の組は2人だけが話す */
  console.log('tables',await run(`(()=>{for(const k in BOND_TALKS)for(const T of[BOND_TALKS2,BOND_TALKS3]){const L=T[k];if(!L||L.length<3)throw Error('no talk '+k);const nm=k.split('|');if(!L.every(l=>nm.includes(l[0])))throw Error('other speaker '+k)}
    for(const k in BOND_GEN)for(const T of[BOND_GEN2,BOND_GEN3])if(!T[k]||T[k].length<3)throw Error('no gen '+k);
    const all=JSON.stringify([BOND_TALKS2,BOND_TALKS3,BOND_GEN2,BOND_GEN3]);if(/オオカゲ|タップ|メニュー|最後の夜/.test(all))throw Error('meta word');return Object.keys(BOND_TALKS).length+' named, '+Object.keys(BOND_GEN).length+' elem pairs'})()`));
  /* 30 → 60 → 100 の順に、1回ずつ */
  console.log('stages',await run(`(()=>{const [f,n,h,m,k]=S.res;S.bond={};S.sev={};S.sevP=[];bondAdd(h,m,100);const pk=bondKey(h,m);
    bondTick();S.sevQuietUntil=0;checkSev();if(!(S.sevP||[]).includes('bd_'+pk))throw Error('30 first '+JSON.stringify(S.sevP));if(S.sevP.some(x=>/^bd[23]_/.test(x)))throw Error('skipped ahead');
    const e2=()=>SEV1.find(x=>x.k==='bd2_'+pk),e3=()=>SEV1.find(x=>x.k==='bd3_'+pk);if(e2()&&e2().at())throw Error('60 before 30 seen');
    S.sev['bd_'+pk]=1;S.sevP=[];bondTick();if(!e2()||!e2().at())throw Error('no 60');checkSev();if(!S.sevP.includes('bd2_'+pk))throw Error('60 not queued '+JSON.stringify(S.sevP));
    const L2=sevLines(e2().L);if(!L2.every(l=>[h.name,m.name].includes(l[0])))throw Error('bad 60 lines');if(e3()&&e3().at())throw Error('100 before 60 seen');
    S.sev['bd2_'+pk]=1;S.sevP=[];bondTick();if(!e3()||!e3().at())throw Error('no 100');checkSev();if(!S.sevP.includes('bd3_'+pk))throw Error('100 not queued');
    /* 60のままなら、100の会話は出ない */const x=mkRes(S,'テスト','fire',CX+8.5,CY+.5);S.res.push(x);bondAdd(x,k,60);const q=bondKey(x,k);S.sev['bd_'+q]=1;bondTick();const e=SEV1.find(y=>y.k==='bd3_'+q);if(e&&e.at())throw Error('100 at 60');
    const g=sevLines(bondLines(q,2));S.res.pop();if(g.length!==3||g.some(l=>/@/.test(l[1])))throw Error('gen lines '+JSON.stringify(g));
    S.sevP=[];return sevLines(e3().L).map(l=>l[0]+'：'+l[1]).join(' / ')})()`));
  /* ならんで戦う力：+2・+3・+5、いちばん高い1人ぶん、はなれたら0 */
  console.log('atk',await run(`(()=>{const [f,n,h,m,k]=S.res;S.bond={};const a=h,b=mkRes(S,'テスト火','fire',h.x+2,h.y);S.res.push(b);for(const r of[a,b])endAct(r);
    S.t=1440*2+60;S.enemyOn=true;S.enemies=[{type:'basic',x:a.x+6,y:a.y,hp:EN.basic.hp,spawned:true,path:[]}];
    const base=rMul(a,'atk');const got=v=>{S.bond={};if(v)bondAdd(a,b,v);supportTick();return Math.round((rMul(a,'atk')-base)*100)};
    const r=[got(0),got(29),got(30),got(60),got(100)].join(',');if(r!=='0,0,2,3,5')throw Error('bonus '+r);
    const c=mkRes(S,'テスト火2','fire',h.x-1,h.y);S.res.push(c);S.bond={};bondAdd(a,b,30);bondAdd(a,c,100);supportTick();if(supAtk(a)!==5)throw Error('best one '+supAtk(a));
    S.res.pop();S.bond={};bondAdd(a,b,100);b.x=a.x+4;supportTick();if(supAtk(a))throw Error('far still');b.x=a.x+2;
    /* こわがって、にげている子とは、ならばない */b.hunger=200;supportTick();if(supAtk(a))throw Error('hungry partner');b.hunger=hMax(b);
    S.enemies=[];supportTick();if(supAtk(a))throw Error('no enemy still');
    /* 火の攻撃にたされる */S.enemies=[{type:'basic',x:a.x+1,y:a.y,hp:999,max:999,spawned:true,path:[]}];supportTick();a.fatk=0;const e=S.enemies[0],h0=e.hp;updRes(a,.1);const d1=h0-e.hp;
    S.bond={};supportTick();e.hp=999;a.fatk=0;updRes(a,.1);const d0=999-e.hp;S.res.pop();S.enemies=[];S.enemyOn=false;S.t=720;if(!(d1>d0))throw Error('fire dmg '+d0+' '+d1);
    return '0/+2/+3/+5, best one, off apart; fire hit '+d0+'→'+d1})()`));
  /* 助けてにげる：にげる子のとなりにつき、攻撃をかわりにうけ、とどけたら なかよし+2 */
  console.log('escort',await run(`(()=>{const [f,n,h]=S.res;S.bond={};const w=h,g=mkRes(S,'テスト火','fire',h.x+1,h.y);S.res.push(g);for(const r of[w,g])endAct(r);
    S.t=1440*2+60;S.enemyOn=true;S.ns=S.ns||{};S.enemies=[{type:'basic',x:w.x+2,y:w.y+1,hp:EN.basic.hp,spawned:true,path:[]}];bondAdd(w,g,40);
    w.hunger=200;const G=bfs(w.x|0,w.y|0),st=(w.y|0)*W+(w.x|0)-8;startAct(w,G,'flee',st,{run:true});if(!w.act||w.act.type!=='flee')throw Error('no flee');
    escTick();if(!g.act||g.act.type!=='escort'||g.act.who!==w.id||w.escBy!==g.id)throw Error('no escort '+JSON.stringify(g.act&&g.act.type));
    /* なかよし30より下なら助けない */
    if(escGuard(w)!==g)throw Error('no guard');const wh=w.hunger,gh=g.hunger;hitRes(S.enemies[0],w,EN.basic);if(w.hunger!==wh||!(g.hunger<gh))throw Error('not covered '+wh+'/'+w.hunger+' '+gh+'/'+g.hunger);
    g.x=w.x+3;if(escGuard(w))throw Error('guard far');g.x=w.x+1;
    /* とどいた */w.x=st%W+.5;w.y=((st/W)|0)+.5;w.path=[];w.act.stage='do';g.x=w.x+1;g.y=w.y;const b0=bondOf(w,g);escTick();if(bondOf(w,g)!==b0+2)throw Error('no bond '+bondOf(w,g));if(g.act&&g.act.type==='escort')throw Error('still escort');if(w.escBy!=null)throw Error('ward keeps');
    /* なかよしが低いと助けない */endAct(w);endAct(g);S.bond={};bondAdd(w,g,20);g.x=w.x+1;startAct(w,bfs(w.x|0,w.y|0),'flee',(w.y|0)*W+(w.x|0)+6,{run:true});escTick();if(g.act&&g.act.type==='escort')throw Error('helped at 20');
    endAct(w);endAct(g);S.res.pop();S.enemies=[];S.enemyOn=false;S.t=720;w.hunger=hMax(w);return 'escort, covers hits within 2, bond+2 on arrival, not under 30'})()`));
  /* 時間をすすめても、助ける子は、にげる子のとなりのまま、にげる先までつく（火のせいれいの「コワイノが来たらたたかいに行く」でやめない） */
  console.log('escort live',await run(`(()=>{const [f,n,h]=S.res;const x0=CX-12,y0=CY-3;for(let y=y0;y<y0+5;y++)for(let x=x0;x<x0+5;x++){if(x===x0||x===x0+4||y===y0||y===y0+4)S.obj[y*W+x]='hwall'}S.obj[(y0+4)*W+x0+2]='door';
    recount();const g=mkRes(S,'テスト火','fire',h.x+1,h.y);S.res.push(g);S.bond={};bondAdd(h,g,50);S.t=1440*2+60;S.enemyOn=true;S.ns={};
    S.enemies=[{type:'basic',x:h.x+3,y:h.y+.4,hp:999,max:999,spawned:true,path:[]}];h.hunger=210;h.fleeNow=true;let esc=0,maxd=0;
    for(let i=0;i<240;i++){for(const r of S.res)updRes(r,.25);supportTick();if(g.act&&g.act.type==='escort'){esc++;maxd=Math.max(maxd,Math.hypot(g.x-h.x,g.y-h.y))}}
    const b=bondOf(h,g);for(let y=y0;y<y0+5;y++)for(let x=x0;x<x0+5;x++)S.obj[y*W+x]='';S.res.pop();S.enemies=[];S.enemyOn=false;S.t=720;h.hunger=hMax(h);endAct(h);recount();
    if(esc<20)throw Error('escort ended early '+esc);if(maxd>2.5)throw Error('fell behind '+maxd.toFixed(1));if(b!==52)throw Error('no bond on arrival '+b);return 'beside (max '+maxd.toFixed(1)+'), arrived, bond 50→52'})()`));
  /* ねらい線：タップしたコワイノのねらいへ、4秒だけ */
  console.log('target',await run(`(()=>{const [f,n,h]=S.res;const e={type:'basic',x:h.x+4,y:h.y,hp:EN.basic.hp,spawned:true,path:[],tg:h.id};S.enemies=[e];
    tgtShow(e);const p=tgtPoint(e);if(!p||Math.abs(p.x-h.x)>1e-9)throw Error('point');e.tg='d'+((h.y|0)*W+(h.x|0)+2);if(tgtPoint(e).j!==(h.y|0)*W+(h.x|0)+2)throw Error('cell');
    const now=performance.now();drawTgtLine(now);if(!TGTL)throw Error('gone early');drawTgtLine(now+TGTMS+10);if(TGTL)throw Error('not gone');
    tgtShow(e);e.dead=true;drawTgtLine(performance.now());if(TGTL)throw Error('dead keeps');S.enemies=[];return 'spirit & cell targets, 4s, off when dead'})()`));
  assert.deepEqual(errors,[]);await browser.close();console.log('ok');
})().catch(e=>{console.error(e);process.exit(1)});
