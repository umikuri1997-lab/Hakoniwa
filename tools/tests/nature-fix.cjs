/* つり・飼う生き物・畑・みずがめの直し：
   どのステージ・場所・時間・天気でも、条件に合う魚だけがつれる（晴れの火山の池でも）・つりのとちゅうで水がなくなると魚なし・
   行けない小屋があっても、行ける小屋に水をはこぶ・霧の中の水はかこいのはし・小屋をうつすと外の生き物も新しい小屋の前へ・
   畑の画面の収穫の数＝じっさいの収穫・乾いた畑は「水やりを待っている」・みずがめの水の量 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;const out={};
    const f=S.res[0];f.hunger=hMax(f);f.energy=100;f.fun=100;S.res=[f];endAct(f);f.act=null;S.food=100;
    const clear=(x,y)=>{const j=y*W+x;S.obj[j]='';delete S.ref[j];S.floor[j]='';S.ground[j]=0;if(S.fog)S.fog[j]=0};
    /* 1. 魚：川（はしまで）と池 */
    S.ground.fill(0);for(let y=0;y<H;y++)S.ground[y*W+3]=1;for(let y=50;y<53;y++)for(let x=50;x<53;x++)S.ground[y*W+x]=1;recount();
    const rs=20*W+4,ps=51*W+53,wd0=WD,bad=[];
    for(const st of [0,1,3,4,5])for(const [j,at] of [[rs,'river'],[ps,'pond']])for(const h of [10,18,22])for(const rain of [false,true]){
      WD=st;S.t=1440*3+h*60;S.rain=rain;const tm=fishTime();for(let i=0;i<40;i++){const k=fishPick(j),F=FISHI[k];if(!F||F.w!==st||(F.at!==at&&!(st===4&&at==='river'))||(!fishOK(k,at,tm,rain)&&!(st===4&&at==='river')))bad.push([st,at,h,rain,k].join(':'))}}
    WD=1;S.t=1440*3+12*60;S.rain=false;{const s=new Set();for(let i=0;i<60;i++)s.add(fishPick(ps));out.volDry=[...s].sort().join(',')}
    WD=wd0;S.rain=false;out.bad=[...new Set(bad)];
    /* 2. つりのとちゅうで水がなくなる：魚なし */
    {S.t=1440*3+10*60;const far=80*W+80;f.carry=null;const rec=JSON.stringify(S.fishRec||{});f.act={type:'fish',stand:far,t:50,stage:'do'};ACT.fish.tick(f,f.act,.1);out.lostDone=ACT.fish.done(f,f.act);ACT.fish.end(f,f.act);out.lostCarry=f.carry;out.lostRec=JSON.stringify(S.fishRec||{})===rec;f.act=null}
    S.ground.fill(0);recount();
    /* 3. かこい：3辺は柵、1辺は池。池に霧がかかっても、かこい */
    const x0=(f.x|0)+3,y0=(f.y|0)+2;for(let y=y0-2;y<=y0+12;y++)for(let x=x0-2;x<=x0+20;x++)clear(x,y);
    for(let i=0;i<=6;i++){S.obj[y0*W+x0+i]='fence';S.obj[(y0+5)*W+x0+i]='fence'}for(let i=1;i<5;i++){S.obj[(y0+i)*W+x0]='fence';S.ground[(y0+i)*W+x0+6]=1}
    const cA=(y0+2)*W+x0+2;S.obj[cA]='coop';recount();out.penA=(PENS.get(cA)||[]).length;
    {const wj=(y0+2)*W+x0+6,fa=fogAt;fogAt=j=>j===wj||fa(j);/* 池の1マスだけ霧 */recount();out.penFog=(PENS.get(cA)||[]).length;S.ground[wj]=0;recount();out.penOpenFog=PENS.get(cA)==null;S.ground[wj]=1;fogAt=fa;recount()}
    /* 4. もう1つの小屋（柵のドアで入れる）。A は入れない。A のほうが先 */
    const xb=x0+10;for(let i=0;i<6;i++){S.obj[y0*W+xb+i]='fence';S.obj[(y0+5)*W+xb+i]='fence';S.obj[(y0+i)*W+xb]='fence';S.obj[(y0+i)*W+xb+5]='fence'}S.obj[(y0+5)*W+xb+2]='gate';
    const cB=(y0+2)*W+xb+2;S.obj[cB]='coop';recount();out.penB=(PENS.get(cB)||[]).length;out.order=HUTS.indexOf(cA)<HUTS.indexOf(cB);
    S.ani=[{id:1,k:'hane',h:cA,born:1,fun:50,x:x0+2.5,y:y0+3.6,face:1,wt:2},{id:2,k:'hane',h:cB,born:1,fun:50,x:xb+2.5,y:y0+3.6,face:1,wt:2}];S.aniId=2;
    f.wcan=4;f.x=xb+2.5;f.y=y0+7.5;S.t=1440*3+9*60;let wa=null;for(let i=0;i<4000;i++){S.food=100;f.hunger=hMax(f);f.energy=100;f.fun=100;f.wcan=Math.max(f.wcan||0,1);stepWorld(.1);if(f.act&&f.act.type==='awater'){wa=f.act.obj;break}}
    out.waterTo=wa===cB;
    /* 5. 小屋をうつす：外の生き物も新しい小屋の前へ */
    endAct(f);f.act=null;const a2=S.ani[1];a2.in=0;a2.x=xb+3.5;a2.y=y0+3.6;const nb=(y0+8)*W+x0+14;MOVESRC=null;moveTap(cB%W,(cB/W)|0);moveTap(nb%W,(nb/W)|0);out.moved=S.obj[nb]==='coop'&&a2.h===nb;out.aniAt=[a2.x,a2.y].join(',');out.aniWant=[(nb+W)%W+.5,(((nb+W)/W)|0)+.6].join(',');
    /* 6. 畑：画面の数＝じっさいの収穫（木のせいれい）。乾いた畑は水やりを待っている */
    const fj=(y0+11)*W+x0;S.obj[fj]='farm';S.dyn[fj]={crop:'imo',sown:true,g:100,wet:0};recount();f.elem='wood';
    openSheet('farm',fj);out.fieldTxt=document.querySelector('.sheet').textContent;closeSheet();out.fieldN=harvN(fj,null);
    endAct(f);f.carry=null;f.act={type:'harvest',obj:fj,stage:'do',t:12};const rr=Math.random;Math.random=()=>.99;ACT.harvest.end(f,f.act);Math.random=rr;f.act=null;
    out.got=((f.carry||{}).imo||0)+(S.drops||[]).filter(d=>d.id==='food:imo').reduce((a,d)=>a+d.n,0);
    S.dyn[fj]={crop:'imo',sown:true,g:50,wet:0};openSheet('farm',fj);out.dryTxt=document.querySelector('.sheet .story').textContent;closeSheet();
    S.dyn[fj].wet=100;openSheet('farm',fj);out.wetTxt=document.querySelector('.sheet .story').textContent;closeSheet();
    /* 7. みずがめ：いまの水の量 */
    const jj=(y0+11)*W+x0+3;S.obj[jj]='jar';S.dyn[jj]={w:3};recount();openSheet('furn',jj);out.jar=document.querySelector('.sheet').textContent;closeSheet();
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.deepEqual(r.bad,[]);assert.equal(r.volDry,'hainuma,hinokobuna');
  assert.equal(r.lostDone,true);assert.equal(r.lostCarry,null);assert.equal(r.lostRec,true);
  assert.ok(r.penA>0,'penA');assert.equal(r.penFog,r.penA);assert.equal(r.penOpenFog,true);
  assert.ok(r.penB>0&&r.order,'penB');assert.equal(r.waterTo,true);
  assert.equal(r.moved,true);assert.equal(r.aniAt,r.aniWant);
  assert.ok(r.fieldTxt.includes('収穫できる数'+r.fieldN+'こ'),r.fieldTxt);assert.equal(r.got,r.fieldN);
  assert.ok(r.dryTxt.startsWith('水やりを待っている'),r.dryTxt);assert.ok(r.wetTxt.startsWith('収穫まであと'),r.wetTxt);
  assert.ok(r.jar.includes('水3 / 10マスぶん'),r.jar);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
