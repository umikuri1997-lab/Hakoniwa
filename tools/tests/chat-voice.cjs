/* せいれいどうしのおしゃべりの、小さな話し声（chatMurmur）：おしゃべり（chat）・ベンチのおしゃべり（rest）の子が、会話の声を小さく鳴らす。
   話すのは2人の、かわりばんこ。画面から遠いおしゃべりは鳴らさない。会話の画面の声が出ているあいだは鳴らさない */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});const p=await browser.newPage({viewport:{width:900,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.t=1440*2+600;SND.sfx=true;audioInit();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()&&AC&&AC.state==="running"&&!!(SBUF.voice||[])[0]'),{},{timeout:60000});
const o=await run(`(async()=>{cam.z=2;centerOn(CX*TS,CY*TS);const out={};const a=mkRes(S,'a','wood',CX+.5,CY+.5),b=mkRes(S,'b','water',CX+1.5,CY+.5);a.vr.vo=1.3;b.vr.vo=.9;S.res=[a,b];
  const SR=[];const C0=AC.createBufferSource.bind(AC);AC.createBufferSource=()=>{const s=C0();SR.push(s);return s};const rates={get length(){return SR.filter(s=>s.buffer===SBUF.voice[0]).length},set length(v){SR.length=0},map:f=>SR.filter(s=>s.buffer===SBUF.voice[0]).map(s=>f(s.playbackRate))};
  const sleep=ms=>new Promise(f=>setTimeout(f,ms));
  a.act={type:'chat',stage:'do',t:5,partner:b.id,topic:0};b.act={type:'chat',stage:'do',t:5,partner:a.id,topic:0,sub:1};
  for(let i=0;i<40;i++){ACT.chat.tick(a,a.act,.05);ACT.chat.tick(b,b.act,.05);await sleep(100)}
  out.n=rates.length;out.vo=rates.map(r=>+r.value.toFixed(2));
  /* ベンチのおしゃべり */rates.length=0;CHATVT.delete(a);a.act={type:'rest',stage:'do',t:5,obj:CY*W+CX,partner:b.id,topic:0};b.act={type:'rest',stage:'do',t:5,obj:CY*W+CX,partner:a.id,topic:0,sub:1};
  for(let i=0;i<20;i++){chatMurmur(a,b);await sleep(100)}out.bench=rates.length;
  /* 遠いおしゃべりは鳴らない */rates.length=0;CHATVT.delete(a);a.x=b.x=CX+60;for(let i=0;i<20;i++){chatMurmur(a,b);await sleep(100)}out.far=rates.length;a.x=CX+.5;b.x=CX+1.5;
  /* 会話の声が出ているあいだは鳴らない */CHATVT.delete(a);voiceStart('a',5);rates.length=0;for(let i=0;i<20;i++){chatMurmur(a,b);await sleep(100)}out.dlg=rates.length;voiceStop();
  AC.createBufferSource=C0;return out})()`);
console.log(JSON.stringify(o));
assert.ok(o.n>=3,'おしゃべりで話し声が鳴る '+o.n);
assert.ok(o.vo.some(v=>v>1.15)&&o.vo.some(v=>v<1.05),'2人がかわりばんこに話す（声の高さが2人ぶん） '+o.vo);
assert.ok(o.bench>=1,'ベンチのおしゃべりでも鳴る');
assert.equal(o.far,0,'遠いおしゃべりは鳴らない');
assert.equal(o.dlg,0,'会話の声が出ているあいだは鳴らない');
assert.deepEqual(errors,[]);console.log('ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
