/* 音符・もやもや（drawHum・drawMoya）：数がかわらないあいだ、ずっと出る（歩いていても）・もやもやは大きさのちがう うずまきが、まばらに出る・
   音は画面のまん中にいちばん近い1人だけ（moodMark・moodTick・MOODP） */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
const o=await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.enemies=[];S.t=1440*2+600;
 const a=mkRes(S,POKO,'wood',CX+.5,CY+.5),b=mkRes(S,'ノドカ','earth',CX+8.5,CY+.5);S.res=[a,b];const o={};
 const c=document.createElement('canvas');c.width=c.height=200;const x=c.getContext('2d');
 /* もやもや：時間をかえても、ずっと出る。うずまきの大きさが、まざる */
 const cnt=t=>{x.clearRect(0,0,200,200);drawMoya(x,100,100,t,a.id);const d=x.getImageData(0,0,200,200).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n};
 o.moyaAll=[0,1000,5000,30000,123456].every(t=>cnt(t)>0);
 const sz=new Set();for(let i=0;i<MOYAN;i++)for(let n=0;n<40;n++){const h=moyaHash(a.id*31+i,n);sz.add(h<.4?0:h<.8?1:2)}o.sizes=sz.size;
 /* 音符：ごきげんなら、いつでも */
 a.fun=90;o.hum=[humTick(a)];a.fun=50;o.hum.push(humTick(a));
 const hc=t=>{x.clearRect(0,0,200,200);a.fun=90;drawHum(x,100,100,t,a);const d=x.getImageData(0,0,200,200).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n};o.humAll=[0,900,7000,40000].every(t=>hc(t)>0);
 /* 歩いていても：drawRes0 の条件に walking を入れていない */
 o.walkOK=!/!walking&&!ci0&&!r\\.bubble&&!front&&funLow/.test(drawRes0.toString())&&/moodMark\\(r,'moya'/.test(drawRes0.toString());
 /* 音は1人：まん中に近い子 */
 const n=performance.now();moodMark(a,'hum',n);moodMark(b,'moya',n);centerOn(a.x*TS,a.y*TS);let best=null,bv=0;for(const[r,m]of MOODM){const q=sfxPos(r.x,r.y);if(q&&q.v>bv){bv=q.v;best=r}}o.near=best===a;
 o.snd=['vowel','moya'].map(k=>(SAMPLES[k]||[]).length);o.humV=typeof humPhrase==='function'&&!SAMPLES.hum;/* 鼻歌は会話の声から */
 /* 朝の体そう：体そうしている子の声で曲。焚き火：パチパチだけの録音 */S.ev={id:'taiso',ph:'do',who:[a.id,b.id]};a.act={type:'evt',stage:'do'};b.act=null;centerOn(a.x*TS,a.y*TS);b.act={type:'evt',stage:'do'};b.x=a.x+1;o.taiso=taisoWho().map(w=>w[0].id).sort().join()===[a.id,b.id].sort().join()&&taisoLag(a)!==taisoLag(b)&&taisoLag(a)<=TAISOLAG;o.harm=taisoHarm(0,2)===4&&taisoHarm(7,-2)===4&&TAISOH.every((h,i)=>h.length===i+1)&&TAISOH[5].every(h=>[0,4,7,5,2,9,-5].every(n=>!h||TAISOK*Math.pow(2,taisoPart(n,h)/12)>=TAISOLOW));/* みんなで歌うときは、同じ調でハモる */S.ev=null;a.act=null;b.act=null;o.taisoOff=taisoWho().length===0;
 o.fire=!!(SAMPLES.firecrk||[]).length&&FEELREC.has('fire')&&FEELRK.fire==='firecrk'&&sfx.toString().includes("playSeg('firecrk'");
 /* 画面に描くと、もやもやの子がしるされる（歩いていても） */
 MOODM.clear();a.fun=10;b.fun=90;a.x=CX+.5;a.y=CY+.5;b.x=CX+2.5;b.y=CY+.5;startAct(a,bfs(a.x|0,a.y|0),'step',(CY+.5|0)*W+CX+6,{});centerOn(a.x*TS,a.y*TS);render(performance.now());o.marked=[MOODM.get(a)?.k,MOODM.get(b)?.k];
 return o})()`);
assert.deepEqual(o,{moyaAll:true,sizes:3,hum:[true,false],humAll:true,walkOK:true,near:true,snd:[1,3],humV:true,taiso:true,harm:true,taisoOff:true,fire:true,marked:['moya','hum']});
assert.deepEqual(errors,[]);console.log('mood fx ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
