/* 加工のつながり：はたおり機（草3こ・わた毛2こ→布1こ）・粉ひき小屋（こむぎ2こ→こむぎこ1こ）。タップで数をえらぶ・せいれいが箱から運ぶ・加工する（その属性のせいれい、いなければだれでも）・
   水車のまわり5マスは、せいれいがいなくても動く（できた物は、せいれいが箱へ運ぶ）・水車は水のとなりだけ・家具がなくなったら返す・レシピ（布・こむぎこ）・はじめのベッドの目標 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
  const base=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;USERPAUSE=true;S.enemyOn=false;
    const a=S.res[0];S.res=[a];endAct(a);a.act=null;S.t=1440*3+8*60;
    const free=(x,y,w,h)=>{for(let b=0;b<h;b++)for(let c=0;c<w;c++){const k=(y+b)*W+x+c;if(S.obj[k]||S.ground[k]||S.floor[k]||hiAt(k)||(S.fog&&S.fog[k]))return false}return true};
    let p=null;for(let y=CY+3;y<CY+20&&!p;y++)for(let x=CX-8;x<CX+8;x++)if(free(x,y,8,4)){p=[x,y];break}
    if(!p){/* 空き地がなければ（木の生え方しだい）、平らな空き地を作る */const x=CX-4,y=CY+6;for(let b=0;b<4;b++)for(let c=0;c<8;c++){const k=(y+b)*W+x+c;S.obj[k]='';delete S.ref[k];S.ground[k]=0;S.floor[k]='';if(S.hi)S.hi[k]=0}recount();if(!free(x,y,8,4))throw new Error('テストの空き地を作れない');p=[x,y]}const [x0,y0]=p;
    const lj=y0*W+x0,mj=y0*W+x0+3,bj=(y0+3)*W+x0+6;S.obj[lj]='loom';S.obj[mj]='mill';for(const q of[mj+1,mj+W,mj+W+1]){S.obj[q]='part';S.ref[q]=mj}S.obj[bj]='crate';S.obj[bj+1]='crate';recount();
    for(const k of Object.keys(S.mat))S.mat[k]=0;S.fs={};S.mat.kasa=7;S.mat.shina=2;addFood('mugi',5);addFood('apple',20);boxSync();
    return JSON.stringify({lj,mj,bj})})()`));
  const {lj,mj}=base;
  /* データ */
  const dt=JSON.parse(await run(`JSON.stringify({bed:BL.bed.mat,rug:BL.rug1.mat,pouf:BL.pouf.mat,cur:BL.curtain1.mat,bread:ALLRECIPES.find(R=>R.out==='bread').need,dango:ALLRECIPES.find(R=>R.out==='dango'),nuno:MATN.nuno,ko:FOODS.komugiko.name,loomLock:RLOCK.has('loom'),insp:QUEST_INSPIRATIONS.bed})`));
  assert.deepEqual(dt.bed,{wood:6,nuno:1});assert.deepEqual(dt.rug,{nuno:3});assert.deepEqual(dt.pouf,{wood:1,nuno:2});assert.deepEqual(dt.cur,{wood:10,nuno:2});
  assert.deepEqual(dt.bread,{komugiko:1});assert.equal(dt.dango.st,'cooktable');assert.deepEqual(dt.dango.need,{komugiko:1});
  assert.equal(dt.nuno,'布');assert.equal(dt.ko,'こむぎこ');assert.equal(dt.loomLock,true);assert.deepEqual(dt.insp,['bed','loom']);
  {const d=JSON.parse(await run(`(()=>{const g=S.guardianIdeas;S.guardianIdeas={};const q=QUESTS.find(q=>q.id==='bed'),L=ideaDialogue(q,q.talk.lines);S.guardianIdeas=g;return JSON.stringify(L.map(l=>l[0]==='@idea'?'@'+l[1].join(','):l[1].includes('布がいる')?'cloth':'-'))})()`));assert.deepEqual(d.filter(x=>x!=='-'),['@bed','cloth','@loom'],'ベッドを思いつき、布がいるとなってから、はたおり機')}
  /* はたおり機：タップで数をえらぶ（かさかさ草7こ→2つまで。しなやかな草2こは出ない） */
  await run(`prPop(${lj});1`);
  const pop=await page.evaluate(()=>[...document.querySelectorAll('.pxcard .nm')].map(e=>e.textContent));
  assert.deepEqual(pop,['布（かさかさ草0/7）'],'2こしかない草は出ない');
  await page.click('.pxcard .p');await page.click('.pxcard .p');
  assert.equal(await page.textContent('.pxcard .v'),'2');assert.equal(await page.evaluate(()=>document.querySelector('.pxcard .p').classList.contains('lack')),true,'7こなら2つまで');
  await page.click('.pxcard .go');
  assert.deepEqual(JSON.parse(await run(`JSON.stringify([S.mat.kasa,S.prQ])`)),[1,{[lj]:{kasa:6}}]);
  /* 粉ひき：じかにたのむ */
  await run(`prPop(${mj});1`);await page.click('.pxcard .p');await page.click('.pxcard .p');
  assert.equal(await page.textContent('.pxcard .v'),'2','こむぎ5こなら2つまで');await page.click('.pxcard .go');
  /* せいれい（木のせいれいだけ：風・土がいないので、だれでも）が運んで加工する */
  const sim=JSON.parse(await run(`(()=>{const a=S.res[0];let lit=false,bar=0,n=0;const an={};for(;n<20000&&((S.mat.nuno||0)<2||(S.fs.komugiko||0)<2);n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if(a.act&&a.act.type==='proc'&&a.act.stage==='do'){const f=WORKP.proc(a,a.act);if(f>0&&f<1)bar=1}if(prLit(${lj})||prLit(${mj}))lit=true;if(a.act&&a.act.type==='proc'&&a.act.stage==='do')an[workAnim(a)+':'+fieldStoryAnim(a)+':'+!!SPM[workAnim(a)]]=1}
    return JSON.stringify({n,nuno:S.mat.nuno||0,ko:S.fs.komugiko||0,mugi:S.fs.mugi||0,kasa:S.mat.kasa,lit,an:Object.keys(an).sort(),bar,left:Object.keys(S.prIn||{}).length+Object.keys(S.prQ||{}).length})})()`));
  console.log(JSON.stringify(sim));
  assert.equal(sim.nuno,2,'布2こ');assert.equal(sim.ko,2,'こむぎこ2こ');assert.equal(sim.mugi,1);assert.equal(sim.kasa,1);assert.equal(sim.lit,true);assert.deepEqual(sim.an,['loomweave:loomweave:true','millgrind:millgrind:true'],'はたおり・粉ひきの動き');assert.equal(sim.bar,1,'加工のあいだ、足もとに進みぐあいのバー');assert.equal(sim.left,0);
  /* 属性：風のせいれいがいれば、はたおりは風のせいれいだけ */
  const el=JSON.parse(await run(`(()=>{const a=S.res[0],w=mkRes(S,'テスト風','wind',a.x+1,a.y);S.res.push(w);const r=[procOK(a,'loom'),procOK(w,'loom'),procOK(a,'mill'),jobOK(a,'loom'),jobOK(w,'loom')];S.res.pop();return JSON.stringify(r)})()`));
  assert.deepEqual(el,[false,true,true,false,true]);
  /* 水車：水のとなりだけ。まわり5マスは、ひとりでに動き、できた物はせいれいが箱へ */
  const ws=JSON.parse(await run(`(()=>{const w=(${lj})+W*6+2;S.obj[w]='';S.obj[w+1]='';S.ground[w+1]=1;
    const dry=(${lj})+W*2;const okDry=canPlace('suisha',dry%W,(dry/W)|0,true),okWet=canPlace('suisha',w%W,(w/W)|0,true);
    S.obj[w]='suisha';let lm=-1;for(const d of[-W*2,W*2,-2,-W*3,W*3,-3,-W,W,-1])if(S.obj[w+d]===''&&S.ground[w+d]===0&&!(S.fog&&S.fog[w+d])&&adjOf(w+d,k=>walk(k))>=0){S.obj[w+d]='loom';const ok=workCells(w+d).every(k=>!S.obj[k]&&!S.ground[k]&&walk(k));S.obj[w+d]='';if(ok){lm=w+d;break}}/* 作業するマス（はたおり機の前）が空いている所（workCells・workOK） */S.obj[lm]='loom';recount();
    const a=S.res[0];S.prIn={[lm]:{kasa:6}};const t0=S.t;let n=0,auto=false;for(;n<20000&&(S.mat.nuno||0)<4;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90;if((S.prOut||{})[lm])auto=true;if(a.act&&a.act.type==='proc'&&a.act.obj===lm)return JSON.stringify({bad:'spirit wove at waterwheel'})}
    return JSON.stringify({okDry,okWet,near:suiOn(lm),auto,nuno:S.mat.nuno||0,out:Object.keys(S.prOut||{}).length,lm})})()`));
  console.log(JSON.stringify(ws));
  assert.equal(ws.bad,undefined,ws.bad);assert.equal(ws.okDry,false,'水のない所には建てられない');assert.equal(ws.okWet,true);assert.equal(ws.near,true);assert.equal(ws.auto,true,'水車で、ひとりでにできる');assert.equal(ws.nuno,4,'できた布はせいれいが箱へ');assert.equal(ws.out,0);
  /* 家具がなくなったら、入れた物・とっておいた物はもどる */
  const rf=JSON.parse(await run(`(()=>{const lm=${ws.lm};S.mat.kasa=6;boxSync();S.prIn={[lm]:{kasa:3}};S.prQ={[lm]:{kasa:3}};rsvAdd({kasa:3});S.prOut={[lm]:{nuno:1}};const n0=S.mat.nuno;clearObj(lm);stepWorld(.05);boxSync();return JSON.stringify([S.mat.kasa,S.mat.nuno-n0,Object.keys(S.prIn).length+Object.keys(S.prQ).length+Object.keys(S.prOut).length])})()`));
  assert.deepEqual(rf,[9,1,0]);
  /* はたおり機：わた毛2こで布1こ（わた毛5こ→2つまで） */
  assert.deepEqual(JSON.parse(await run(`JSON.stringify([PROC.loom.ins.includes('wool'),prN(PROC.loom,'wool'),prN(PROC.loom,'kasa'),BL.loom.desc])`)),[true,2,3,'草3こか、わた毛2こで、布1こをおる。布1こ40分。風の強い日は27分']);
  await run(`S.mat.wool=5;boxSync();prPop(${lj});1`);
  const wpop=await page.evaluate(()=>[...document.querySelectorAll('.pxcard .nm')].map(e=>e.textContent));
  const wi=wpop.indexOf('布（わた毛0/5）');assert.ok(wi>=0,JSON.stringify(wpop));
  const wv=await page.evaluate(i=>{const r=document.querySelectorAll('.pxcard .ks > div')[i];for(let n=0;n<3;n++)r.querySelector('.p').click();const v=r.querySelector('.v').textContent;document.querySelector('.pxcard .go').click();return v},wi);/* ほかの知らせが上にかさなることがあるので、じかにおす */
  assert.equal(wv,'2','わた毛5こなら2つまで');
  assert.deepEqual(JSON.parse(await run(`JSON.stringify([S.mat.wool,S.prQ[${lj}]])`)),[1,{wool:4}]);
  const wsim=JSON.parse(await run(`(()=>{const a=S.res[0],n0=S.mat.nuno||0;let n=0;for(;n<20000&&(S.mat.nuno||0)<n0+2;n++){stepWorld(.25);a.hunger=hMax(a);a.fun=90;a.energy=90}return JSON.stringify({n,got:(S.mat.nuno||0)-n0,wool:S.mat.wool||0,left:Object.keys(S.prIn||{}).length+Object.keys(S.prQ||{}).length})})()`));
  console.log(JSON.stringify(wsim));assert.equal(wsim.got,2,'わた毛4こで布2こ');assert.equal(wsim.wool,1);assert.equal(wsim.left,0);
  /* はじめのベッドの目標 */
  const bq=JSON.parse(await run(`(()=>{const q=QUESTS.find(q=>q.id==='bed');return JSON.stringify({gives:q.talk.gives,prog:typeof q.prog==='function'?q.prog():''})})()`));
  assert.deepEqual(bq.gives,{feat:['craft'],items:{loom:1},mat:{wood:6,kasa:3}});assert.equal(bq.prog,'手順 3/4 依頼ボードでベッドをたのむ','布ができたら、いまの手順だけを番号つきで（bedStep）');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
