/* 「みる」でタップした物の音：材質で分ける（木 twood・石 tstone・金物 tcan・布 tcloth・植物 tgrass・畑 tsoil・地面は足音の録音 fsoil など・水 twater・神殿と御神木 tbell）。
   物の音が鳴ったタップでは、画面がひらく音（open）と葉の音（leaf）をかさねない。ほかの物の音（宝箱・神殿を直す など）が鳴ったら、そちらだけ */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});const p=await browser.newPage({viewport:{width:900,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.rain=false;S.t=1440*2+600;
for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}
const put=(x,y,id)=>{S.obj[(CY+y)*W+CX+x]=id};put(-6,-4,'chair');put(-4,-4,'bed');put(-2,-4,'salvia');put(0,-4,'rock');put(2,-4,'tree');put(4,-4,'farm');put(6,-4,'wall');put(-6,0,'fence');put(-4,0,'joro');
S.ground[(CY+3)*W+CX-6]=1;S.floor[(CY+3)*W+CX-2]='stone';S.res=[];S.seeds=[];S.drops=[];recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(async()=>{cam.z=2;centerOn(CX*TS,CY*TS);setMode('look');CRIT=[];const out={};
  const log=[];const sfx0=sfx;sfx=k=>{const n=performance.now();if(!(k==='open'&&(n-TAPMAT<120||TAPPEND&&n-TAPPEND<120)))log.push(k);return sfx0(k)};/* open は、物の音のあるタップでは sfx の中で止まる（同じ条件） */
  const scr=(x,y)=>({sx:(x*TS-cam.x)*cam.z,sy:(y*TS-cam.y)*cam.z});
  const tap=async(x,y)=>{log.length=0;closeSheet();const q=scr(CX+x+.5,CY+y+.6);onTap(q.sx,q.sy);await new Promise(r=>setTimeout(r,20));closeSheet();return log.filter(k=>k!=='close'&&k!=='tap'&&k!=='dust').join(',')};
  for(const [n,x,y] of [['chair',-6,-4],['bed',-4,-4],['flower',-2,-4],['rock',0,-4],['tree',2,-4],['farm',4,-4],['wall',6,-4],['fence',-6,0],['joro',-4,0],['ground',2,3],['water',-6,3],['stonefloor',-2,3]])out[n]=await tap(x,y);
  out.mat=['statue','statueb','altar','tower','takenoko','pouf','curtain','dtable','stonegate'].map(id=>BL[id]?id+':'+tapMatOf(id):id+':-').join(' ');
  sfx=sfx0;return out})()`);
console.log(JSON.stringify(o));
const want={chair:'twood',bed:'tcloth',flower:'tgrass',rock:'tstone',tree:'twood',farm:'tsoil',wall:'tstone',fence:'twood',joro:'tcan',ground:'fsoil',water:'twater',stonefloor:'fstone'};
const rec=await run(`(async()=>{audioInit();if(typeof loadSamples==='function'&&!SBUF.twood)loadSamples();const K=['twood','tstone','tcan','tcloth','tgrass','tsoil','twater','tbell','tfoe','tweb','tani','tplace','tsacred'];
  for(let i=0;i<100&&K.some(k=>!(SBUF[k]||[]).filter(Boolean).length);i++)await new Promise(r=>setTimeout(r,100));
  if(AC.state!=='running')await AC.resume();const out={};for(const k of K)out[k]=[(SAMPLES[k]||[]).length,(SBUF[k]||[]).filter(Boolean).length,playU(k,.3)];return out})()`);
console.log(JSON.stringify(rec));
for(const k in rec)assert.ok(rec[k][0]>0&&rec[k][1]===rec[k][0]&&rec[k][2],k+' の録音が読みこめて鳴る（本物の音）');
for(const k in want)assert.equal(o[k],want[k],k+' の音（open・leaf はかさねない）');
assert.ok(/statue:tstone statueb:tstone altar:tstone tower:tsacred /.test(o.mat),'神殿・台座は石、草原の御神木は太い木の音 '+o.mat);
assert.deepEqual(errors,[]);console.log('tap-sound ok');await browser.close()})();
