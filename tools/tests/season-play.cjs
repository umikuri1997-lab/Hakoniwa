/* 季節の遊び（season-play.js）：冬は雪がつもっていないと雪遊びしない・夏は水べの水切り（石がはねて波紋・はねた回数）・花びら・落ち葉はゆっくり落ちる・日記の絵の話題 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;S.enemyOn=false;S.fog=null;S.rain=false;const out={};
    /* 冬：雪がないと、しない */S.t=1440*16+10*60;out.wSea=seasonNow();S.snowA=0;out.noSnow=splayKind();S.snowA=1;const K=new Set();for(let i=0;i<30;i++)K.add(splayKind());out.snow=[...K].sort();
    /* 夏：水べに、まっすぐ水がつづく所 */S.t=1440*6+10*60;out.sSea=seasonNow();out.sKind=splayKind();
    const a=S.res[0],x0=Math.round(a.x)+3,y0=Math.round(a.y);for(let y=y0-3;y<=y0+3;y++)for(let x=x0;x<=x0+8;x++){const j=y*W+x;S.obj[j]=null;S.floor[j]=null;S.ground[j]=x>=x0+3?1:0}recount();
    const c=y0*W+x0+2;out.dir=kiriDir(c);out.spots=splaySpots('kiri',c,3).map(j=>splayFree(j));
    /* 石：はねた回数だけ波紋 */SPLAYFX.length=0;const t0=performance.now();const fake={id:a.id,x:x0+2.5,y:y0+.5};S.res.push(Object.assign({},a,{id:9999,name:'テスト'}));
    SPLAYFX.push({k:'kiri',x:(x0+2.5)*TS,y:(y0+.5)*TS,dx:1,dy:0,n:3,t0,st:S,rid:a.id,ids:[a.id]});const R0=floats.length;
    for(let t=0;t<=3000;t+=16){kiriTick(t0+t)}out.rips=SPLAYFX.filter(s=>s.k==='rip').length;out.float=floats.slice(R0).map(f=>f.text);
    /* 石が水のない所へ行ったら、そこでおわり */SPLAYFX.length=0;const t1=performance.now();SPLAYFX.push({k:'kiri',x:(x0+2.5)*TS,y:(y0+.5)*TS,dx:-1,dy:0,n:5,t0:t1,st:S,rid:a.id,ids:[a.id]});const R1=floats.length;for(let t=0;t<=3000;t+=16)kiriTick(t1+t);out.dry=floats.slice(R1).map(f=>f.text);
    /* 花びら：ゆっくり落ちる（重さ・上限） */fx.length=0;hanamiPetal(10,10);const p=fx[0];out.petal={g:p.g,vt:p.vt,sw:p.sw,life:p.life};
    /* 日記の絵の話題 */out.top=dyPhTopic({ph:1,phK:'see',phS:'splayw',phN:'水切り'});out.top2=dyPhTopic({ph:1,phK:'see',phS:'splay',phN:'お花見'});out.n=[DYFULL.psplay.length,DYFULL.psplayw.length];
    out.dl=!!DAYL.splay_kiri;S.res.pop();
    /* じっさいに遊ぶ：2人で水切り → 石がとぶ・描いてもエラーなし */const b=JSON.parse(JSON.stringify(a));b.id=9998;b.name='テスト2';b.nap=false;b.act=null;b.x=a.x+1;S.res.push(b);a.nap=false;a.act=null;a.splayT=0;a.hunger=b.hunger=400;a.energy=b.energy=80;S.splayD=null;
    const R=Math.random;Math.random=()=>0;const ok=goSeasonPlay(a,bfs(a.x|0,a.y|0));Math.random=R;out.go=ok;out.k=a.act&&a.act.k;
    if(ok){for(const q of[a,b]){q.act.stage='do';const st=q.act.stand;q.x=st%W+.5;q.y=((st/W)|0)+.5}SPLAYFX.length=0;for(let i=0;i<40;i++){for(const q of[a,b]){q.act.t+=.5;ACT.splay.tick(q,q.act,.5)}render(performance.now())}out.thrown=SPLAYFX.length+floats.filter(f=>/かい！/.test(f.text)).length;out.anim=splayAnim(a)}
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.wSea,3);assert.equal(r.noSnow,'','雪がないと雪遊びしない');assert.deepEqual(r.snow,['kama','snowball']);
  assert.equal(r.sSea,1);assert.equal(r.sKind,'kiri');assert.equal(r.dir,1,'東へ水がつづく');assert.deepEqual(r.spots,[true,true,true]);
  assert.equal(r.rips,0,'波紋はきえる');assert.deepEqual(r.float,['3かい！']);assert.deepEqual(r.dry,['0かい！'],'水がないとはねない');
  assert.ok(r.petal.g<=20&&r.petal.vt<=20&&r.petal.sw>0&&r.petal.life>=3,'花びらはゆっくり');
  assert.deepEqual(r.top,['psplayw','水切り']);assert.deepEqual(r.top2,['psplay','お花見']);assert.ok(r.n[0]>=12&&r.n[1]>=12);assert.equal(r.dl,true);
  assert.equal(r.go,true);assert.equal(r.k,'kiri');assert.ok(r.thrown>0,'石をなげる');assert.ok(['raise','qstone'].includes(r.anim));
  await page.waitForTimeout(500);assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
