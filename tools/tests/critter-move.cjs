/* 生き物の向きと動き：上下へ動くときは正面・うしろの絵（横を向いたまま上下へすべらない）。
   小さな生き物（critTurn・critHead）：はねる向きは、いまの向きをゆらして進み、正面・うしろの絵のない小鳥は左右からななめ25度まで。
   飼う生き物（aniTurn・aniSee）：マス目の道のかどを切って、ななめに歩く。歩く向きで絵をえらぶ */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;USERPAUSE=true;S.rain=false;S.t=1440*2+10*60;
    const out={};for(let y=CY-10;y<CY+10;y++)for(let x=CX-10;x<CX+10;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];if(S.fog)S.fog[j]=0}
    S.res=[];recount();const C=window.CHIPS;
    const mk=(k,x,y)=>({id:CRITID++,k,x,y,hx:x,hy:y,z:0,vx:0,vy:0,face:1,t:0,life:9999,hop:0,fl:0,ci:0,act:0,ph:0,wait:0});
    /* うさぎ：上下へはねたときは、正面・うしろの絵。横へはねたときは横の絵 */
    {const c=mk('usagi',CX+5.5,CY+5.6);CRIT=[c];let vert=0,ok=0,side=0,sideOk=0,bad=[];
      for(let i=0;i<6000;i++){const x0=c.x,y0=c.y;critTick(.05);const dx=c.x-x0,dy=c.y-y0;if(c.jt==null||c.jt<.1)continue;/* 向きは1コマあとにかわる */
        const ch=critChip(c,performance.now());
        if(Math.abs(dy)>Math.abs(dx)*2){vert++;if(c.vw===(dy>0?'d':'u')&&ch&&ch===(C['critusagi#'+c.vw+critFrame(c,performance.now())]))ok++;else if(bad.length<3)bad.push([dx,dy,c.vw])}
        else if(Math.abs(dx)>Math.abs(dy)*2){side++;if(!c.vw)sideOk++}}
      out.usagi={vert,ok,side,sideOk,bad,far:Math.hypot(c.x-c.hx,c.y-c.hy)}}
    /* 正面・うしろの絵が、どの地面の生き物にもある */out.noView=CRITKINDS.filter(k=>CK[k].vw).filter(k=>{const n='crit'+(CK[k].ch||k)+'#';return !C[n+'d0']||!C[n+'u0']||!C[n+'dw1']||!C[n+'uw1']});
    out.aniNoView=['hane','moko','tsuno'].filter(k=>!C['ani:'+k+'#dw0']||!C['ani:'+k+'#uw0']||!C['ani:'+k+'#de0']||!C['ani:'+k+'#uj1']);
    /* 小鳥：はねる向きは、左右からななめ25度まで */
    {const c=mk('bird',CX+5.5,CY+5.6);CRIT=[c];let n=0,maxA=0;for(let i=0;i<6000;i++){const x0=c.x,y0=c.y;critTick(.05);const dx=c.x-x0,dy=c.y-y0;if(Math.hypot(dx,dy)>1e-4){n++;maxA=Math.max(maxA,Math.atan2(Math.abs(dy),Math.abs(dx)))}}out.bird={n,maxA}}
    /* はねる向きがつづく（となりのはねると、向きがあまりかわらない） */
    {const c=mk('risu',CX+5.5,CY+5.6);CRIT=[c];const H=[];for(let i=0;i<8000;i++){const p=c.jt;critTick(.05);if(p==null&&c.jt!=null)H.push(Math.atan2(c.ny-c.jy,c.nx-c.jx))}
      let keep=0;for(let i=1;i<H.length;i++){let d=Math.abs(H[i]-H[i-1]);d=Math.min(d,Math.PI*2-d);if(d<.6)keep++}out.risu={hops:H.length,keep}}
    /* 飼う生き物：ななめ下の所へ。マス目の道でも、かどを切って、ななめに歩く */
    {const a={id:1,k:'moko',h:-1,x:CX+.5,y:CY+.6,face:1,wt:0};S.ani=[a];const to=(CY+5)*W+CX+5;a.path=aniPath(a,to,null);let diag=0,st=0,vw={};
      for(let i=0;i<3000&&a.path&&a.path.length;i++){const x0=a.x,y0=a.y;a.mv=0;aniStep(a,.05);const dx=a.x-x0,dy=a.y-y0;if(!a.mv)continue;st++;if(Math.abs(dx)>1e-3&&Math.abs(dy)>1e-3)diag++}
      out.aniDiag={st,diag,at:[a.x,a.y]}}
    {const a={id:2,k:'tsuno',h:-1,x:CX+.5,y:CY+.6,face:1,wt:0};S.ani=[a];a.path=aniPath(a,(CY+6)*W+CX,null);for(let i=0;i<3000&&a.path&&a.path.length;i++)aniStep(a,.05);a.mv=0;a.eat=0;out.aniDown=[a.vw,aniChip(a,0)===C['ani:tsuno#d0']];
      a.path=aniPath(a,(CY+6)*W+CX+5,null);for(let i=0;i<3000&&a.path&&a.path.length;i++)aniStep(a,.05);out.aniSide=a.vw}
    /* かどを切っても、柵はとおりぬけない */
    {for(let y=CY;y<CY+4;y++)S.obj[y*W+CX+2]='fence';recount();const a={id:3,k:'hane',h:-1,x:CX+.5,y:CY+.6,face:1,wt:0};S.ani=[a];a.path=aniPath(a,(CY+1)*W+CX+4,null);let hit=0;
      for(let i=0;i<4000&&a.path&&a.path.length;i++){aniStep(a,.05);if(S.obj[(a.y|0)*W+(a.x|0)]==='fence')hit++}out.fence={hit,at:[a.x|0,a.y|0],to:[CX+4,CY+1]};S.ani=[]}
    CRIT=[];return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.deepEqual(r.noView,[],'正面・うしろの絵がない生き物');assert.deepEqual(r.aniNoView,[],'飼う生き物の正面・うしろの絵');
  assert.ok(r.usagi.vert>5&&r.usagi.ok===r.usagi.vert,'うさぎ：上下へはねるときは正面・うしろの絵 '+JSON.stringify(r.usagi));
  assert.ok(r.usagi.side>5&&r.usagi.sideOk===r.usagi.side,'うさぎ：横へはねるときは横の絵');
  assert.ok(r.usagi.far<1.6,'うさぎ：いつもの場所のそばにいる');
  assert.ok(r.bird.n>20&&r.bird.maxA<=.46,'小鳥：ななめ25度まで '+JSON.stringify(r.bird));
  assert.ok(r.risu.hops>10&&r.risu.keep/(r.risu.hops-1)>.4,'りす：はねる向きがつづく '+JSON.stringify(r.risu));
  assert.ok(r.aniDiag.diag/r.aniDiag.st>.6,'飼う生き物：ななめに歩く '+JSON.stringify(r.aniDiag));
  assert.ok(r.aniDown[0]==='d'&&r.aniDown[1],'飼う生き物：下へ歩くと正面の絵');assert.equal(r.aniSide,'','飼う生き物：横へ歩くと横の絵');
  assert.equal(r.fence.hit,0,'柵をとおりぬけない');assert.deepEqual(r.fence.at,r.fence.to,'柵をまわって着く');
  assert.deepEqual(errors,[]);console.log('ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
