/* 食べ物の好き・きらい（food-like.js）・なかよしの図（bond-map.js）・レベルアップのごほうび（main.js の rlvPick） */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*2+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-8;y<CY+8;y++)for(let x=CX-8;x<CX+8;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';delete S.ref[j];delete S.dyn[j]}S.res=[mkRes(S,'a','wood',CX+.5,CY+.5),mkRes(S,'b','fire',CX+2.5,CY+.5),mkRes(S,'c','water',CX+.5,CY+2.5)];for(const r of S.res){r.hunger=500;r.energy=100;r.fun=50}recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
/* 好み：id と食べ物で決まる。だいすきは1つ。すき・にがてもある */
const dist=await run(`(()=>{const K=Object.keys(FOODS).filter(k=>!FOODS[k].bad);let n=[0,0,0,0];for(let id=1;id<=200;id++){const r={id,name:'n'+id,elem:'wood'};const c=[0,0,0,0];for(const k of K)c[foodLike(r,k)]++;if(c[3]!==1)return 'love:'+c[3];for(let i=0;i<4;i++)n[i]+=c[i]}const r=S.res[0];return {n,same:K.every(k=>foodLike(r,k)===foodLike(r,k))}})()`);
assert.ok(typeof dist==='object'&&dist.same&&dist.n[0]>0&&dist.n[2]>0,'好みのばらつき '+JSON.stringify(dist));
/* おやつ：えらんだ物を食べ、反応で、すき・にがてがわかる。にがては たのしさ－5 */
const sn=await run(`(()=>{const r=S.res[0],K=Object.keys(FOODS).filter(k=>!FOODS[k].bad&&k!==favDish(r)),ng=K.find(k=>foodLike(r,k)===0),lk=K.find(k=>foodLike(r,k)===2);if(!ng||!lk)return 'nofood';S.fs={};S.fs[ng]=1;S.fs[lk]=1;syncFood();
  const give=k=>{snackPop(r);const c=[...document.querySelectorAll('.pxcard .slot')].find(x=>{const t=x.querySelector('.nm').textContent;return t===FOODS[k].name||t.startsWith(FOODS[k].name+'（')});if(!c)return false;c.click();ACT.eat.tick(r,r.act,999);const f0=r.fun;ACT.eat.end(r,r.act);return r.fun};
  r.fun=50;const f1=give(ng),face1=(STRAINU.get(r)||0)>performance.now();r.fun=50;const f2=give(lk);
  return {f1,face1,f2,fk:r.fk,ng,lk,left:S.fs,txt:[foodKnownText(r,0),foodKnownText(r,2)],nm:[FOODS[ng].name,FOODS[lk].name]}})()`);
assert.ok(typeof sn==='object','おやつ '+sn);assert.equal(sn.f1,50+10-5,'にがて：おやつ+10、にがて－5');assert.ok(sn.face1,'にがての顔');assert.equal(sn.f2,50+10+3,'すき：+3');
assert.equal(sn.fk[sn.ng],0);assert.equal(sn.fk[sn.lk],2);assert.deepEqual(sn.txt,sn.nm,'プロフィールに出る');assert.equal((sn.left[sn.ng]||0)+(sn.left[sn.lk]||0),0,'えらんだ物がへる');
/* 箱からとるとき：にがては、ふつうよりあと */
const ord=await run(`(()=>{const r=S.res[0],K=Object.keys(FOODS).filter(k=>!FOODS[k].bad&&!FOODS[k].dish);const ng=K.find(k=>foodLike(r,k)===0),nm=K.find(k=>foodLike(r,k)===1&&FOODS[k].v===(FOODS[ng]||{}).v);return ng&&nm?[ng,nm].sort((a,b)=>foodLike(r,b)-foodLike(r,a))[0]===nm:'skip'})()`);
assert.ok(ord===true||ord==='skip','にがてはあと');
/* 「〇〇が食べたい」のこまりごと：すきな物（この村で持ったことのある物）。おやつでその物をあげると、なおる */
const wt=await run(`(()=>{const r=S.res[2],K=Object.keys(FOODS).filter(k=>!FOODS[k].bad&&foodLike(r,k)>=2),nm=Object.keys(FOODS).find(k=>!FOODS[k].bad&&foodLike(r,k)===1);S.seenIt={};const none=wantPick(r);S.seenIt['f:'+K[0]]=1;const f=wantPick(r);S.trouble={id:r.id,k:'want',d:dayNo(),f};const txt=troubleText(r),ok0=TROUBLE.want.ok(r);
  S.fs={};S.fs[f]=1;S.fs[nm]=1;syncFood();const give=k=>{snackPop(r);const c=[...document.querySelectorAll('.pxcard .slot')].find(x=>{const t=x.querySelector('.nm').textContent;return t===FOODS[k].name||t.startsWith(FOODS[k].name+'（')});c.click();ACT.eat.tick(r,r.act,999);ACT.eat.end(r,r.act);for(let i=0;i<6;i++)troubleTick()};
  give(nm);const still=!!S.trouble;S.letterQ=[];r.fun=50;NOSAVE=false;give(f);NOSAVE=true;return {none,f,K0:K[0],txt,ok0,still,solved:S.trouble===null,fun:r.fun,letter:(S.letterQ||[]).some(q=>q.k==='thx'&&q.tx.join('').indexOf(FOODS[f].name)>=0)}})()`);
assert.equal(wt.none,null,'持ったことがなければ出ない');assert.equal(wt.f,wt.K0);assert.ok(wt.ok0&&wt.txt.endsWith('が食べたい'),'こまりごと '+JSON.stringify(wt));assert.ok(wt.still,'ちがう物ではなおらない');assert.ok(wt.solved,'その物をあげるとなおる');assert.ok(wt.fun>=50+10+15,'たのしさ '+wt.fun);assert.ok(wt.letter,'お礼の手紙');
/* レベルアップ：上がった数だけ、えらんで +1（20がふつう） */
const lv=await run(`(()=>{const r=S.res[1],w0=rStat(r,rLv(r)).work,s0=staOf(r);addSpiritXp(LVXP[3]/.8+1,r);const n=r.lvPend;RLVQ.length=0;rlvShow({id:r.id,from:1,to:rLv(r)});const B=()=>[...document.querySelectorAll('#rlv .rpick button')];const okH=document.querySelector('#rlvOk').hidden,b0=B().length;B()[0].click();const mid=r.lvPend;B()[2]&&B()[2].click();return {n,lv:rLv(r),okH,b0,mid,pend:r.lvPend||0,lvb:r.lvb,dw:rStat(r,rLv(r)).work-w0-lvGain(r,'work',rLv(r))+lvGain(r,'work',1),ds:staOf(r)-s0,closed:document.querySelector('#rlv').hidden}})()`);
assert.ok(lv.n>=2,'2レベル以上 '+JSON.stringify(lv));assert.ok(lv.okH&&lv.b0===3,'えらぶまでOKはない');assert.equal(lv.lvb.work,1);assert.ok(lv.ds>=1,'スタミナ+1 '+JSON.stringify(lv));assert.equal(lv.dw,1,'はたらく速さ+1');
/* えらばずに読みこみなおした分は、あとで出る */
await run(`(()=>{const r=S.res[1];document.querySelector('#rlv').hidden=true;r.lvPend=1;RLVQ.length=0;return 1})()`);await run(`USERPAUSE=false`);await p.waitForTimeout(600);const again=await run(`!document.querySelector('#rlv').hidden&&document.querySelectorAll('#rlv .rpick button').length`);await run(`USERPAUSE=true`);assert.equal(again,3,'のこりのごほうびを、また出す');
await run(`document.querySelectorAll('#rlv .rpick button')[1].click()`);
/* なかよしの図：顔3つ・なかよし30から線・けんかは赤 */
const bm=await run(`(()=>{const[a,b,c]=S.res;S.bond={};S.bond[bondKey(a,b)]=40;S.bond[bondKey(a,c)]=10;S.qr=null;closeSheet();openSheet('menu','bondmap');const cv=document.querySelector('#sheetBody .bmap canvas'),faces=document.querySelectorAll('#sheetBody .bmface').length;const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let px=0;for(let i=3;i<d.length;i+=4)if(d[i])px++;document.querySelector('#sheetBody .bmface').click();return {faces,px,sheet,arg:sheetArg}})()`);
assert.equal(bm.faces,3);assert.ok(bm.px>10,'線 '+JSON.stringify(bm));assert.equal(bm.sheet,'res','顔をタップでせいれいの画面');
assert.deepEqual(errors,[]);console.log('likes ok',JSON.stringify({dist,sn,wt,lv,bm}));await browser.close()})();
