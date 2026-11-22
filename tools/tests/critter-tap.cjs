/* 小さな生き物をタップ（しらべる）：その場で反応する（小鳥は飛びたつ・うさぎはにげる・ちょうは高くまう・かえるははねる・ほたるは光る・もぐらはもぐる・てんとうむしは何かする）・
   図鑑の「いきもの」に入る（1ぴきは1回だけ数える）。せいれいのほうが近ければ、せいれいの画面 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:900,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.rain=false;S.t=1440*2+600;
for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}
for(const d of [-3,-2,-1])S.obj[CY*W+CX+d]='salvia';for(let y=CY+3;y<CY+6;y++)for(let x=CX-8;x<CX-4;x++)S.ground[y*W+x]=1;S.res=[];recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{cam.z=2;centerOn(CX*TS,CY*TS);setMode('look');const out={};
  const mk=(k,x,y,z)=>({id:CRITID++,k,x,y,hx:x,hy:y,z:z||0,vx:0,vy:0,face:1,t:0,life:999,hop:9,fl:0,ci:0,act:0,ph:0,wait:3});
  const scr=(x,y,c)=>{const q=ptS(c.x,c.y,x*TS,y*TS);return{sx:q.x,sy:q.y}};/* 生き物 c を立てて描いた絵の上の点 → 画面の点 */
  const tap=c=>{const q=scr(c.x,c.y-(c.z||0)/TS-.2,c);floats.length=0;onTap(q.sx,q.sy);return c.pk&&!floats.length?CRITN[c.k]:'x'};/* 反応した・名前は出さない */
  const one=(k,x,y,z)=>{const c=mk(k,x,y,z);CRIT=[c];S.res=[];const name=tap(c);return {c,name}};
  {const {c,name}=one('bird',CX+.5,CY-1.4);out.bird=[name,!!c.fl,!!c.go]}
  {const {c,name}=one('usagi',CX+1.5,CY+1.5);out.usagi=[name,!!c.fl,!!c.go]}
  /* 段差の上（高い段）のうさぎも、見えている所でタップできる */{for(let y=CY+6;y<CY+9;y++)for(let x=CX+5;x<CX+9;x++)S.hi[y*W+x]=1;const c=mk('usagi',CX+6.5,CY+7.6);CRIT=[c];S.res=[];const L=uLift(c)/TS,q=scr(c.x,c.y-.2,c);floats.length=0;onTap(q.sx,q.sy);out.usagiHi=[L>0,c.pk&&!floats.length?CRITN[c.k]:'x'];for(let y=CY+6;y<CY+9;y++)for(let x=CX+5;x<CX+9;x++)S.hi[y*W+x]=0}
  {const {c,name}=one('fly',CX-2.5,CY+.6,12);const z=critPokeZ(c,performance.now()+500);out.fly=[name,z]}
  {const {c,name}=one('frog',CX-4.5,CY+2.5);out.frog=[name,c.hop,critPokeZ(c,performance.now()+250)]}
  {const {c,name}=one('hotaru',CX-6.5,CY+2.5,10);out.hotaru=[name,!!c.pk]}
  {const {c,name}=one('mogura',CX+3.5,CY+2.5);out.mogura=[name,c.fade,!!c.go]}
  {const {c,name}=one('tentoumushi',CX-1.5,CY+1.5);out.ten=[name,c.act]}
  /* 同じ1ぴきは1回だけ数える */{const c=mk('tentoumushi',CX-1.5,CY+1.5);CRIT=[c];c.pk=0;tap(c);c.pk=0;tap(c);out.tenN=S.critRec.tentoumushi}
  /* せいれいのほうが近い：せいれいの画面 */{const c=mk('usagi',CX+4.5,CY+1.5);CRIT=[c];const r=mkRes(S,'a','wood',CX+4.5,CY+1.4);S.res=[r];closeSheet&&closeSheet();const q=scr(r.x,tapY(r)-.5,r);onTap(q.sx,q.sy);out.resWins=sheet==='res';closeSheet();S.res=[]}
  /* 小鳥はベリー・りすはどんぐり・うさぎはわた毛を、1ぴき1回だけ、50%で1こ落とす */{const R0=Math.random,CR0=JSON.stringify(S.critRec);S.drops=[];Math.random=()=>0;const b=mk('bird',CX+.5,CY-1.4);CRIT=[b];tap(b);b.pk=0;b.fl=0;b.go=0;b.fade=null;tap(b);const r=mk('risu',CX+1.5,CY+1.5);CRIT=[r];tap(r);const u=mk('usagi',CX+3.5,CY+1.5);CRIT=[u];tap(u);Math.random=()=>.9;const r2=mk('risu',CX+2.5,CY+1.5);CRIT=[r2];tap(r2);Math.random=R0;
    out.drops=S.drops.map(d=>d.id+':'+d.n+':'+!!d.tap);out.dIcon=!!ICONS.donguri&&FOODS.donguri.name;S.drops=[];S.critRec=JSON.parse(CR0)}
  /* どの生き物にも鳴き声がある */out.noVoice=CRITKINDS.filter(k=>!CRITV[k]||!SAMPLES[CRITV[k]]);
  /* 図鑑の「いきもの」 */openSheet('menu','zukan');ZKT=ZKTABS.indexOf('いきもの');renderSheet();const rows=[...document.querySelectorAll('#sheetBody .rows > *')].map(e=>e.textContent);out.zk=rows;out.zkImg=document.querySelectorAll('#sheetBody .rows img').length;closeSheet();
  /* 動かしてもエラーがない */CRIT=[mk('bird',CX+.5,CY-1.4),mk('fly',CX-2.5,CY+.6,12)];for(const c of CRIT){c.pk=0;tap(c)}for(let i=0;i<60;i++){critTick(.05);for(const c of CRIT)drawCritter(ctx,c,performance.now()+i*20)}drawCritGlow(ctx,performance.now());
  out.rec=S.critRec;return out})()`);
console.log(JSON.stringify(o));
assert.deepEqual([o.bird[0],o.bird[1]||o.bird[2]],['ピチュリ',true],'小鳥は飛びたつ');
assert.ok(o.usagi[0]==='ミミフワ'&&o.usagi[1]&&o.usagi[2],'うさぎはにげる');
assert.deepEqual(o.usagiHi,[true,'ミミフワ'],'段差の上のうさぎもタップできる');
assert.ok(o.fly[0]==='ヒラリ'&&o.fly[1]>8,'ちょうは高くまう');
assert.ok(o.frog[0]==='ケロッパ'&&o.frog[1]===0&&o.frog[2]>5,'かえるははねる');
assert.ok(o.hotaru[0]==='ヨルボシ'&&o.hotaru[1],'ほたるは光る');
assert.ok(o.mogura[0]==='ツチホリ'&&o.mogura[2]&&o.mogura[1]===1,'もぐらはもぐる');
assert.ok(o.ten[0]==='ポチマル'&&o.ten[1]>0,'てんとうむしは何かする');
assert.equal(o.tenN,2,'1ぴきは1回だけ（さきの1ぴき＋この1ぴき）');
assert.deepEqual(o.drops,['food:berry:1:true','food:donguri:1:true','mat:wool:1:true'],'小鳥はベリー・りすはどんぐり・うさぎはわた毛、1ぴき1回 '+o.drops);assert.equal(o.dIcon,'どんぐり');
assert.deepEqual(o.noVoice,[],'鳴き声のない生き物');
assert.ok(o.resWins,'せいれいのほうが近ければ、せいれいの画面');
assert.equal(o.zk.length,7,'図鑑に7しゅるい '+o.zk);assert.ok(o.zk.some(t=>/ピチュリ/.test(t)&&/見つけた数 1/.test(t)),'図鑑の行');assert.ok(o.zkImg>=7,'図鑑の絵 '+o.zkImg);
assert.deepEqual(errors,[]);console.log('critter-tap ok');await browser.close()})();
