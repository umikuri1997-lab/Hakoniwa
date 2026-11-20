/* 風のやんだ空の村（WORLD 5）の土台：はじめの村・浮き島と雲の海・雲の海では水のふるまいをしない・神殿を直すと機能がひらく・夜にコワイノは来ない・セーブして読みなおせる・マップえらび */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:4});
  const a=JSON.parse(await run(`(()=>{const o={};const M=skyM();o.wd=WD;o.name=S.res.map(r=>r.name+':'+r.elem+':'+r.vr.tr).join();o.q=QUESTS[S.quest].id;o.enemy=!!S.enemyOn;o.fog=!!S.fog;o.ruin=RUINT>=0&&S.obj[RUINT]==='statueb';
    /* 島：陸のかたまり。まん中の島がいちばん大きい */const id=new Int32Array(W*H),sz=[0];for(let j=0;j<W*H;j++){if(id[j]||S.ground[j]===1)continue;const k=sz.length,q=[j];id[j]=k;let n=0;while(q.length){const c=q.pop();n++;for(const d of[1,-1,W,-W]){const m=c+d;if(m<0||m>=W*H||Math.abs(m%W-c%W)>1||id[m]||S.ground[m]===1)continue;id[m]=k;q.push(m)}}sz.push(n)}
    o.isles=sz.length-1;o.mid=id[CY*W+CX];o.midBig=sz[o.mid]===Math.max(...sz);o.small=Math.min(...sz.slice(1));
    /* 橋（まっすぐ10マスまで）で、どの島もまん中の島からつながる */const P=sz.map((_,i)=>i),f=i=>P[i]===i?i:P[i]=f(P[i]);const scan=(len,at)=>{for(let a=0;a<len;a++){let last=0,gap=0;for(let b=0;b<len;b++){const j=at(a,b),v=id[j];if(v){if(last&&v!==last&&gap>0&&gap<=10)P[f(v)]=f(last);last=v;gap=0}else gap=M[j]?gap+1:99}}};scan(W,(a,b)=>a*W+b);scan(W,(a,b)=>b*W+a);
    o.linked=sz.slice(1).every((_,i)=>f(i+1)===f(o.mid));
    /* はしはぜんぶ雲の海。池は雲の海ではない */let edge=true;for(let x=0;x<W;x++)if(!M[x]||!M[(H-1)*W+x]||!M[x*W]||!M[x*W+W-1])edge=false;o.edge=edge;let pond=-1,sky=-1,shore=-1;for(let j=0;j<W*H;j++){if(S.ground[j]===1&&!M[j]&&pond<0)pond=j;if(M[j]&&id[j-W]===o.mid&&sky<0){sky=j;shore=j-W}}
    o.pond=pond>=0&&waterJ(pond)&&!skyJ(pond);o.skyWater=waterJ(sky);o.walkSky=walk(sky);o.placeSky=canPlace('fence',sky%W,(sky/W)|0,true);o.lotusSky=canPlace('lotus',sky%W,(sky/W)|0,true);o.lotusPond=canPlace('lotus',pond%W,(pond/W)|0,true);o.bridgeSky=canPlace('bridge',sky%W,(sky/W)|0,true);
    S.obj[shore]='';o.fishSky=fishW(shore);o.srcSky=waterSrc(shore);
    /* 家・畑・木箱・高さ */recount();o.house=HOUSES.length;o.farm=cnt('farm');o.crate=cnt('crate');o.hi=S.hi.some(h=>h>0);o.hiSky=S.hi.some((h,j)=>h>0&&S.ground[j]===1);
    return JSON.stringify(o)})()`));
  console.log(JSON.stringify(a));
  assert.equal(a.wd,4);assert.equal(a.name,'カザネ:wind:nebari','はじめはカザネひとり（ねばりづよい）');assert.equal(a.q,'statue');assert.equal(a.enemy,false);assert.equal(a.fog,false);assert.ok(a.ruin,'こわれた神殿がある');
  assert.ok(a.isles>=10,'島が10こいじょう '+a.isles);assert.ok(a.midBig,'まん中の島がいちばん大きい');assert.ok(a.small>=30,'小さすぎる島はない '+a.small);assert.ok(a.linked,'どの島も、橋でつなげる');
  assert.ok(a.edge,'マップのはしは雲の海');assert.ok(a.pond,'島の中の池は水');assert.equal(a.skyWater,false);assert.equal(a.walkSky,false);assert.equal(a.placeSky,false);assert.equal(a.lotusSky,false,'雲の海にハスは植えられない');assert.equal(a.lotusPond,true);assert.equal(a.bridgeSky,true,'雲の海に橋はかけられる');
  assert.equal(a.fishSky,-1,'雲の海ではつりをしない');assert.equal(a.srcSky,-1,'雲の海から水はくめない');
  assert.equal(a.house,1,'はじめの家はこわれていない');assert.equal(a.farm,4);assert.equal(a.crate,1);assert.ok(a.hi,'段差がある');assert.equal(a.hiSky,false);
  /* 神殿を直すと、機能がひらく・作業台とベッドをもらう・お店に花のたね。つぎの目標はクリアにならない */
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;S.t=1440+9*60;showItemGift=()=>{};const tj=RUINT;for(const k of templeRuinCells(tj))if(S.obj[k]==='part'){S.obj[k]='';delete S.ref[k]}S.obj[tj]='statue';recount();USERPAUSE=false;checkQuest()})()`);
  await page.waitForFunction(()=>sacredEval("checkQuest(),QUESTS[S.quest].id==='windVillage'&&S.qStory==null"),{},{timeout:120000,polling:500}).catch(async e=>{console.log(await run(`JSON.stringify({q:S.quest,w:QUEST_CLEAR_WAIT&&[QUEST_CLEAR_WAIT.id,QUEST_CLEAR_WAIT.done],n:isNight(),nr:NEWRES,dlg:!document.querySelector('#dialog').hidden,res:S.res.map(r=>[r.act&&r.act.type,r.x|0,r.y|0])})`));throw e});
  const b=JSON.parse(await run(`(()=>{
    return JSON.stringify({q:QUESTS[S.quest].id,feat:['inv','remove','plant','craft','people','summon','shop'].every(k=>S.feat[k]),wb:inv('wbench'),bed:inv('bed'),fl:['clover','bellf','salvia','lily','lotus'].every(k=>S.unlocked[k]),enemy:!!S.enemyOn,chip:document.querySelector('#questChip')?document.querySelector('#questChip').textContent:''})})()`));
  console.log(JSON.stringify(b));
  assert.equal(b.q,'windVillage');assert.ok(b.feat,'機能がひらく');assert.equal(b.wb,1);assert.equal(b.bed,1);assert.ok(b.fl,'花のたねが、お店に出る');assert.equal(b.enemy,false);
  /* 夜をこえても、コワイノは来ない・止まらない */
  const c=JSON.parse(await run(`(()=>{S.t=1440+19*60;const d0=dayNo();const end=S.t+14*60;let n=0;let slept=false;while(S.t<end&&n++<40000){stepWorld(1.5);for(const r of S.res){updRes(r,1.5);r.hunger=Math.max(r.hunger,800);if(r.act&&r.act.type==='sleep')slept=true}}S.__slept=slept;return JSON.stringify({slept:S.__slept,d:dayNo()-d0,en:S.enemies.length,on:!!S.enemyOn,q:QUESTS[S.quest].id,h:Math.round(hour()),morning:S.lastMorning===dayNo(),act:S.res.map(r=>r.act&&r.act.type).join()})})()`));
  console.log(JSON.stringify(c));
  assert.equal(c.d,1,'つぎの日になる');assert.equal(c.h,9);assert.ok(c.morning,'朝が来る');assert.ok(c.slept,'夜は寝る');assert.equal(c.en,0);assert.equal(c.on,false);assert.equal(c.q,'windVillage');
  /* セーブして読みなおす：風のステージのまま、雲の海も同じ */
  const d=JSON.parse(await run(`(()=>{const n0=skyM().reduce((a,v)=>a+v,0);save();LIVE[WIND]=null;const L=loadStage(WIND);continueGame(L);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;return JSON.stringify({wd:WD,name:S.res[0].name,same:skyM().reduce((a,v)=>a+v,0)===n0,q:QUESTS[S.quest].id,writer:DYWRITER(),key:KEYS[WD].join()})})()`));
  console.log(JSON.stringify(d));
  assert.equal(d.wd,4);assert.equal(d.name,'カザネ');assert.ok(d.same);assert.equal(d.q,'windVillage');assert.equal(d.writer,'カザネ');
  /* マップえらび：風のカードは「つづきから」。水・土は、ひらかない */
  const e=JSON.parse(await run(`(()=>{save();showMaps();const C=k=>document.querySelector('#mList .wcard[data-k="'+k+'"]'),B=k=>[...C(k).querySelectorAll('.wbtns button')].map(x=>x.textContent).join('/');const o={w:B(4),w2:B(2),w3:B(3),open:C(4).classList.contains('open'),name:C(4).querySelector('h3').textContent};document.querySelector('#maps').hidden=true;return JSON.stringify(o)})()`));
  console.log(JSON.stringify(e));
  assert.equal(e.w,'つづきから/はじめから');assert.equal(e.w2,'');assert.equal(e.w3,'');assert.ok(e.open);assert.equal(e.name,'風のやんだ空の村');
  assert.deepEqual(errors,[]);await browser.close();console.log('wind-stage ok')})().catch(e=>{console.error(e);process.exit(1)});
