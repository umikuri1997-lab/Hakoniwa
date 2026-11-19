/* なかまのお迎え：だれも集まらず、そばの子だけがその場でよろこぶ（welcomeNear）。いす：背もたれのがわのマスから乗らない・おりない（seatBack） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;S.enemyOn=false;S.t=720;
    for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.dyn[j];if(S.rot)delete S.rot[j]}
    S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5),mkRes(S,MINA,'earth',CX+3.5,CY+.5),mkRes(S,'テスト','water',CX+11.5,CY+.5)];for(const r of S.res){r.act=null;r.nap=false;r.path=[]}recount()})()`);
  const w=JSON.parse(await run(`(()=>{const[n,a,f]=S.res;window.__w={id:n.id,t:Infinity};const acts=S.res.map(r=>r.act);welcomeNear(n,__w);return JSON.stringify({acts:acts.map(a=>a&&a.type)})})()`));
  await new Promise(r=>setTimeout(r,2200));
  const w2=JSON.parse(await run(`(()=>{const[n,a,f]=S.res,now=performance.now();return JSON.stringify({near:(JOYU.get(a)||0)>now-1000,far:(JOYU.get(f)||0)>0,face:a.face,t:__w.t<Infinity,acts:S.res.map(r=>r.act&&r.act.type),pos:Math.hypot(a.x-(CX+3.5),a.y-(CY+.5))<.01&&Math.hypot(f.x-(CX+11.5),f.y-(CY+.5))<.01})})()`));
  console.log(JSON.stringify(w),JSON.stringify(w2));
  assert.equal(w2.near,true,'そばの子はよろこぶ');assert.equal(w2.far,false,'遠い子はよろこばない');assert.equal(w2.face,-1,'新しい子のほうを向く');assert.equal(w2.t,true,'紹介の画面へすすむ');assert.equal(w2.pos,true,'だれも歩いて集まらない');assert.deepEqual(w2.acts,[null,null,null]);
  /* いす：前向き（背もたれは北）。北のマスからすわりにいく → 横か前へまわってから乗る。おりるときも北へはおりない */
  const s=JSON.parse(await run(`(()=>{const out={};for(const rot of[0,1,2,3]){const j=CY*W+CX;S.obj[j]='chair';(S.rot||(S.rot={}))[j]=rot;recount();const r=S.res[1],b=seatBack(j);r.x=b%W+.5;r.y=(b/W|0)+.5;r.act={type:'rest',stage:'walk',stand:j,t:0};r.path=[j];let prev=b,inFrom=-1;
      for(let i=0;i<600;i++){const c=(r.y|0)*W+(r.x|0);if(c===j){inFrom=prev;break}prev=c;moveR(r,.05);if(!r.path.length&&(r.y|0)*W+(r.x|0)!==j)break}
      /* おりる：すわる位置から北のマスへ行く道 */SEATLAST.set(r,{x:r.x*TS,y:r.y*TS,t:performance.now()});const g=(CY-4)*W+CX;r.act={type:'walk',stage:'walk'};r.path=[b,b-W,b-2*W,g].filter((v,i,A)=>A.indexOf(v)===i);moveR(r,.01);const out1=(r.y|0)*W+(r.x|0);
      out[rot]={back:b-j,inFrom:inFrom-j,outTo:out1-j};S.obj[j]='';delete S.rot[j]}recount();return JSON.stringify(out)})()`));
  console.log(JSON.stringify(s));
  const BK={0:-1e9,1:0,2:0,3:0};
  for(const rot of [0,1,2,3]){const o=s[rot];assert.notEqual(o.inFrom,o.back,'向き'+rot+'：背もたれのがわから乗らない');assert.notEqual(o.inFrom,0);assert.ok([-1,1,-108,108].includes(o.inFrom),'向き'+rot+'：となりから乗る '+o.inFrom);assert.notEqual(o.outTo,o.back,'向き'+rot+'：背もたれのがわへおりない');assert.notEqual(o.outTo,0,'向き'+rot+'：おりた')}
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
