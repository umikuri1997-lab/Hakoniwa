/* 小さな生き物：昼の花にちょう・木のそばに小鳥・夕方の水べにかえる。小鳥はせいれいが近づくと飛びたつ。ひまなせいれいは見にいって、たのしさ+2。夜は出ない。
   モデルから写した生き物（うさぎ・りす・はりねずみ・ねずみ・もぐら・かたつむり・てんとうむし・みつばち・とんぼ・ほたる・かえる）：出る所・時間（critOK）・コマのチップ・動いてエラーがない・にげる・もぐらは土のステージだけ */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:900,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.rain=false;S.t=1440*2+600;
for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}
for(const d of [-3,-2,-1])S.obj[CY*W+CX+d]='salvia';S.obj[(CY-3)*W+CX+5]='tree';for(let y=CY+3;y<CY+6;y++)for(let x=CX-8;x<CX-4;x++)S.ground[y*W+x]=1;S.res=[];recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{cam.z=2;centerOn(CX*TS,(CY+.5)*TS);const ks=new Set();for(let n=0;n<15;n++){CRIT=[];for(let i=0;i<120;i++)critTick(.5);for(const c of CRIT)ks.add(c.k)}const kinds=[...ks];
  /* 小鳥は、せいれいが近づくと飛びたつ */CRIT=[];CRIT.push({id:999,k:'bird',x:CX+4.5,y:CY-2.4,hx:CX+4.5,hy:CY-2.4,z:0,face:1,t:0,life:100,hop:9,fl:0});const r=mkRes(S,'a','wind',CX+4.5,CY-1.5);S.res=[r];critTick(.1);const flew=!!critById(999).fl;
  /* 見にいく */CRIT=[{id:7,k:'fly',x:CX-2.5,y:CY+.5,hx:CX-2.5,hy:CY+.5,z:12,face:1,t:0,life:999,hop:0,fl:0,ci:3}];r.x=CX+2.5;r.y=CY+.5;r.fun=50;r.hunger=hMax(r);r.energy=100;endAct(r);const ok=goCritter(r,bfs(r.x|0,r.y|0));const f0=r.fun;
  for(let i=0;i<400&&r.act&&r.act.type==='critwatch';i++){updRes(r,.1);CRIT[0]&&(CRIT[0].life=999)}const gain=r.fun-f0;
  /* 夜は出ない */S.t=1440*3+60;CRIT=[];for(let i=0;i<100;i++)critTick(.5);const night=CRIT.length;
  return {kinds,flew,ok,gain,night}})()`);
assert.ok(o.kinds.some(k=>['fly','mitsubachi','tentoumushi'].includes(k))&&o.kinds.some(k=>['bird','risu'].includes(k)),'昼：花のそばの虫と、木のそばの生き物 '+o.kinds);assert.ok(o.flew,'小鳥は飛びたつ');assert.ok(o.ok,'見にいく');assert.ok(o.gain>=1.5,'たのしさ+2 '+o.gain);assert.equal(o.night,0,'夜は出ない');
/* よく出る（小鳥・ちょう・とんぼ）と、あまり出ない（ほか）：昼に出た回数をかぞえる */
const cnt=await run(`(()=>{S.t=1440*15+600;/* 秋（とんぼが出る） */S.res=[];const n={};const sp=critSpawn;for(let i=0;i<3000;i++){CRIT=[];critSpawn();for(const c of CRIT)n[c.k]=(n[c.k]||0)+1}return n})()`);
const often=(cnt.fly||0)+(cnt.bird||0)+(cnt.tonbo||0),rare=Object.entries(cnt).filter(([k])=>!['fly','bird','tonbo'].includes(k)).reduce((t,[,v])=>t+v,0);
assert.ok(often>rare*4,'小鳥・ちょう・とんぼが多く出る '+JSON.stringify(cnt));console.log('出た回数',JSON.stringify(cnt));
assert.equal(await run(`[CK.bird.n,CK.tonbo.n,CK.usagi.n||1].join()`),'2,2,1','同時に出る数');
/* ちょう：朝、花1本ごとに5%。その日は、その数まで（花がなければ出ない・同じ日はかわらない） */
const bf=await run(`(()=>{const sv=S.obj.slice();S.t=1440*20+600;for(let j=0;j<W*H;j++)if(FLOWERS.has(S.obj[j]))S.obj[j]=null;CRITBS=null;const none=critButterflies();let fly0=0;for(let i=0;i<500;i++){CRIT=[];critSpawn();fly0+=CRIT.filter(c=>c.k==='fly').length}
  let k=0;for(let y=4;y<W-4&&k<400;y+=2)for(let x=4;x<W-4&&k<400;x+=2){const j=y*W+x;if(!S.obj[j]&&walk(j)){S.obj[j]='clover';k++}}CRITBS=null;const a=critButterflies(),b=critButterflies();let tot=0;for(let d=0;d<30;d++){S.t=1440*(30+d)+600;tot+=critButterflies()}
  CRIT=[];for(let i=0;i<20;i++)CRIT.push({id:900+i,k:'fly',x:CX,y:CY,t:0,life:999});S.t=1440*20+600;CRITBS=null;const n=critButterflies(),cnt=CRIT.length;CRIT=CRIT.slice(0,Math.max(0,n));const before=CRIT.length;critSpawn();const over=CRIT.filter(c=>c.k==='fly').length<=n;
  S.obj=sv;CRITBS=null;CRIT=[];return {none,fly0,k,a,b,avg:tot/30,over}})()`);
assert.equal(bf.none,0,'花がなければ、ちょうは0');assert.equal(bf.fly0,0,'花がなければ出ない');assert.equal(bf.a,bf.b,'同じ日はかわらない');
assert.ok(Math.abs(bf.avg-bf.k*.05)<bf.k*.05*.35,'花1本ごとに5% '+bf.avg+' / '+bf.k);assert.ok(bf.over,'その日の数まで');console.log('ちょう',JSON.stringify(bf));
const ev=await run(`(()=>{S.t=1440*4+1080;for(let n=0;n<15;n++){CRIT=[];for(let i=0;i<120;i++)critTick(.5);if(CRIT.some(c=>c.k==='frog'))return true}return false})()`);assert.ok(ev,'夕方の水べに、かえる');
/* モデルの生き物：出る所 */
const sp=await run(`(()=>{S.obj[(CY-3)*W+CX-6]='crate';S.obj[(CY+2)*W+CX+6]='berry';S.obj[(CY+3)*W+CX+3]='farm';S.res=[];recount();REV.add((CY+1)*W+CX+1);
  const at=(k,h,rain,j,d)=>{S.t=1440*(d||5)+h*60;S.rain=!!rain;return critOK(k,j)};
  return {usagi:at('usagi',10,0,(CY+1)*W+CX+1),usagiRain:at('usagi',10,1,(CY+1)*W+CX+1),risu:at('risu',10,0,(CY-3)*W+CX+4),nezumi:at('nezumi',10,0,(CY-3)*W+CX-5),
    hari:at('harinezumi',18,0,(CY+2)*W+CX+5),hariDay:at('harinezumi',10,0,(CY+2)*W+CX+5),kata:at('katatsumuri',10,1,(CY+1)*W+CX-2),kataDry:at('katatsumuri',10,0,(CY+1)*W+CX-2),
    ten:at('tentoumushi',10,0,(CY+1)*W+CX-2),bee:at('mitsubachi',10,0,CY*W+CX-2),tonbo:at('tonbo',12,0,(CY+3)*W+CX-5,15),tonboSpring:at('tonbo',12,0,(CY+3)*W+CX-5),hotaru:at('hotaru',20,0,(CY+2)*W+CX-6),hotaruDay:at('hotaru',12,0,(CY+2)*W+CX-6),
    moguraGrass:at('mogura',10,0,(CY+3)*W+CX+4),frog:at('frog',18,0,(CY+2)*W+CX-6)}})()`);
for(const [k,v] of Object.entries({usagi:true,usagiRain:false,risu:true,nezumi:true,hari:true,hariDay:false,kata:true,kataDry:false,ten:true,bee:true,tonbo:true,tonboSpring:false,hotaru:true,hotaruDay:false,moguraGrass:false,frog:true}))assert.equal(sp[k],v,'出る所 '+k);
/* コマのチップ・動く・にげる・ほたるの光 */
const mv=await run(`(()=>{const out={miss:[],moved:{},fled:{}};S.rain=false;
  const F={usagi:['0','1','w0','w1','w2','w3','e0','e1','e2'],risu:0,harinezumi:0,nezumi:0,mogura:0,katatsumuri:0,tentoumushi:0,kaeru:0,mitsubachi:['w0','w1','e0','e1'],tonbo:['w0','w1','e0','e1'],hotaru:['w0','w1']};
  for(const k in F)for(const f of F[k]||F.usagi)if(!CHIPS['crit'+k+'#'+f])out.miss.push(k+'#'+f);
  const put=(k,x,y,h)=>{S.t=1440*6+h*60;CRIT=[];S.res=[];const c={id:50,k,x,y,hx:x,hy:y,z:CK[k].m==='fly'?12:CK[k].m==='hover'?18:CK[k].m==='drift'?10:0,vx:0,vy:0,face:1,t:0,life:999,hop:0,fl:0,ci:0,act:0,ph:0,wait:0};CRIT.push(c);return c};
  for(const [k,x,y,h] of [['usagi',CX+1.5,CY+1.5,10],['risu',CX+4.5,CY-2.5,10],['nezumi',CX-5.5,CY-2.5,10],['harinezumi',CX+5.5,CY+2.5,18],['tentoumushi',CX-1.5,CY+1.5,10],['katatsumuri',CX-1.5,CY+1.5,10],['mitsubachi',CX-2.5,CY+.5,10],['tonbo',CX-5.5,CY+3.5,12],['hotaru',CX-6.5,CY+2.5,20],['frog',CX-6.5,CY+2.5,18]]){
    if(k==='katatsumuri')S.rain=true;const c=put(k,x,y,h),x0=c.x,y0=c.y;const fr=new Set();let far=0;for(let i=0;i<600;i++){critTick(.05);if(!critById(50))break;far=Math.max(far,Math.hypot(c.x-x0,c.y-y0));fr.add(critChip(c,performance.now()+i*97)?1:0)}S.rain=false;
    out.moved[k]=Math.round(far*100)/100/* いちばん遠くまで動いた長さ（もとの場所へもどることもある） */+(fr.has(0)?' nochip':'')+(critById(50)?'':' gone')}
  for(const k of ['usagi','risu','nezumi']){const c=put(k,CX+1.5,CY+1.5,10);S.res=[mkRes(S,'a','wind',CX+1.5,CY+2.3)];critTick(.05);out.fled[k]=!!c.fl}
  put('hotaru',CX-6.5,CY+2.5,20);cam.z=2;centerOn(CX*TS,CY*TS);ctx.save();drawCritGlow(ctx,performance.now());ctx.restore();
  return out})()`);
assert.deepEqual(mv.miss,[],'チップがない '+mv.miss);
for(const k of ['usagi','risu','nezumi','harinezumi','tentoumushi','mitsubachi','tonbo','hotaru','frog'])assert.ok((parseFloat(mv.moved[k])>0.05||k==='frog'&&/gone/.test(mv.moved[k]))&&!/nochip/.test(mv.moved[k]),'動く '+k+' '+mv.moved[k]);/* かえるは、水へとびこんで、いなくなることもある */
for(const k of ['usagi','risu','nezumi'])assert.ok(mv.fled[k],'にげる '+k);
/* もぐらは土のステージ（WD 3）だけ */
const mg=await run(`(()=>{const w0=WD;WD=3;S.t=1440*7+600;const j=(CY+3)*W+CX+4,ok=critOK('mogura',j);WD=w0;return ok})()`);assert.ok(mg,'土のステージに、もぐら');
/* いなくなるとき（寿命・にげる・雨）は、画面の外へ去ってから消える（見えている所でパッと消えない） */
const lv=await run(`(()=>{S.rain=false;S.t=1440*8+600;cam.z=2;centerOn(CX*TS,(CY+.5)*TS);S.res=[];const [a,b,c,d]=critView(),bad=[];let n=0;
  const mk=(id,k,x,y,life)=>({id,k,x,y,hx:x,hy:y,z:CK[k].m==='fly'?12:0,vx:0,vy:0,face:1,t:0,life,hop:0,fl:0,ci:0,act:0,ph:0,wait:0});
  CRIT=[mk(1,'usagi',CX+1.5,CY+1.5,1),mk(2,'fly',CX-2.5,CY+.5,1),mk(3,'bird',CX+.5,CY-1.5,1),mk(4,'risu',CX+3.5,CY-1.5,999),mk(5,'tentoumushi',CX-1.5,CY+1.5,1)];S.res=[mkRes(S,'a','wind',CX+3.5,CY-.8)];
  let last=new Map();for(let i=0;i<800&&CRIT.some(c=>c.id<=5);i++){critTick(.1);S.res=[];const ids=new Set(CRIT.map(c=>c.id));for(const [id,q] of last)if(!ids.has(id)){n++;if(q.fade==null&&q.x>a&&q.x<c&&q.y-(q.z||0)/TS>b&&q.y<d)bad.push(q.k)}last=new Map(CRIT.filter(c=>c.id<=5).map(c=>[c.id,{k:c.k,x:c.x,y:c.y,z:c.z,fade:c.fade}]))}
  return {n,bad,left:CRIT.filter(c=>c.id<=5).length}})()`);
assert.equal(lv.n,5,'去っていなくなる '+JSON.stringify(lv));assert.deepEqual(lv.bad,[],'見えている所で消えない');
assert.deepEqual(errors,[]);console.log('critters ok',JSON.stringify(o),JSON.stringify(mv.moved));await browser.close()})();
