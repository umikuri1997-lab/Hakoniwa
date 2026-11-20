/* 風のやんだ空の村（WORLD 5）：風のやんだ遊園地。はじめの村・浮き島と雲の海・雲の海では水のふるまいをしない・風穴と風の道・かざみ・雲の橋・島がうかぶ・追い風・とりのこされたせいれい・ハヤテ・こわれた遊具を直す・係・わすれた楽しさ・神殿・夜にコワイノは来ない・セーブ・マップえらび */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:4});
  /* 目標を進める：お礼・依頼の会話は、読んだことにして進める */
  const adv=(id,ms)=>page.waitForFunction(id=>sacredEval("(()=>{checkQuest();if(TALKW&&document.querySelector('#dialog').hidden)startTalk();const q=QUESTS[S.quest];return q.id==='"+id+"'&&S.qStory==null&&(!q.talk||S.qTalked)})()"),id,{timeout:ms||120000,polling:400}).catch(async e=>{console.log(await run(`JSON.stringify({q:QUESTS[S.quest].id,st:S.qStory,tk:S.qTalked,tw:TALKW,n:isNight(),dlg:!document.querySelector('#dialog').hidden,act:S.res.map(r=>r.name+':'+(r.act&&r.act.type))})`));throw e});
  const a=JSON.parse(await run(`(()=>{const o={};const M=skyM();o.wd=WD;o.name=S.res.map(r=>r.name+':'+r.elem+':'+r.vr.tr).join();o.q=QUESTS[S.quest].id;o.enemy=!!S.enemyOn;o.ruin=RUINT>=0&&S.obj[RUINT]==='statueb';
    /* 島：陸のかたまり。まん中の島がいちばん大きい */const id=new Int32Array(W*H),sz=[0];for(let j=0;j<W*H;j++){if(id[j]||S.ground[j]===1)continue;const k=sz.length,q=[j];id[j]=k;let n=0;while(q.length){const c=q.pop();n++;for(const d of[1,-1,W,-W]){const m=c+d;if(m<0||m>=W*H||Math.abs(m%W-c%W)>1||id[m]||S.ground[m]===1)continue;id[m]=k;q.push(m)}}sz.push(n)}
    o.isles=sz.length-1;o.mid=id[CY*W+CX];o.midBig=sz[o.mid]===Math.max(...sz);o.small=Math.min(...sz.slice(1));
    /* 橋（まっすぐ10マスまで）で、どの島もまん中の島からつながる */const P=sz.map((_,i)=>i),f=i=>P[i]===i?i:P[i]=f(P[i]);const scan=(len,at)=>{for(let a=0;a<len;a++){let last=0,gap=0;for(let b=0;b<len;b++){const j=at(a,b),v=id[j];if(v){if(last&&v!==last&&gap>0&&gap<=10)P[f(v)]=f(last);last=v;gap=0}else gap=M[j]?gap+1:99}}};scan(W,(a,b)=>a*W+b);scan(W,(a,b)=>b*W+a);
    o.linked=sz.slice(1).every((_,i)=>f(i+1)===f(o.mid));
    /* はしはぜんぶ雲の海。池は雲の海ではない */let edge=true;for(let x=0;x<W;x++)if(!M[x]||!M[(H-1)*W+x]||!M[x*W]||!M[x*W+W-1])edge=false;o.edge=edge;let pond=-1,sky=-1,shore=-1;for(let j=0;j<W*H;j++){if(S.ground[j]===1&&!M[j]&&pond<0&&Math.abs(j%W-CX)<16&&Math.abs(((j/W)|0)-CY)<16)pond=j;/* まん中の島の池 */if(M[j]&&id[j-W]===o.mid&&sky<0){sky=j;shore=j-W}}
    o.pond=pond>=0&&waterJ(pond)&&!skyJ(pond);o.skyWater=waterJ(sky);o.walkSky=walk(sky);o.placeSky=canPlace('fence',sky%W,(sky/W)|0,true);o.lotusSky=canPlace('lotus',sky%W,(sky/W)|0,true);o.lotusPond=canPlace('lotus',pond%W,(pond/W)|0,true);
    S.obj[shore]='';o.fishSky=fishW(shore);o.srcSky=waterSrc(shore);
    /* 家・畑・木箱・高さ */recount();o.house=HOUSES.length;o.farm=cnt('farm');o.crate=cnt('crate');o.hi=S.hi.some(h=>h>0);o.hiSky=S.hi.some((h,j)=>h>0&&S.ground[j]===1);
    return JSON.stringify(o)})()`));
  console.log(JSON.stringify(a));
  assert.equal(a.wd,4);assert.equal(a.name,'カザネ:wind:nebari','はじめはカザネひとり（ねばりづよい）');assert.equal(a.q,'windHole','はじめの目標は風穴');assert.equal(a.enemy,false);assert.ok(a.ruin,'こわれた神殿がある');
  assert.ok(a.isles>=10,'島が10こいじょう '+a.isles);assert.ok(a.midBig,'まん中の島がいちばん大きい');assert.ok(a.small>=30,'小さすぎる島はない '+a.small);assert.ok(a.linked,'どの島も、まっすぐ10マスまでのすきまでつながる');
  assert.ok(a.edge,'マップのはしは雲の海');assert.ok(a.pond,'島の中の池は水');assert.equal(a.skyWater,false);assert.equal(a.walkSky,false);assert.equal(a.placeSky,false);assert.equal(a.lotusSky,false,'雲の海にハスは植えられない');assert.equal(a.lotusPond,true);
  assert.equal(a.fishSky,-1,'雲の海ではつりをしない');assert.equal(a.srcSky,-1,'雲の海から水はくめない');
  assert.equal(a.house,1,'はじめの家はこわれていない');assert.equal(a.farm,4);assert.equal(a.crate,1);assert.ok(a.hi,'段差がある');assert.equal(a.hiSky,false);
  /* 風穴：まん中の島と大きな島に1つずつ。はじめは、どれもふさがっている。まわりの島は雲にしずんでいて、歩けない・置けない。木の橋はかけられない */
  const w0=JSON.parse(await run(`(()=>{const I=windIsles(S),H=S.wind.holes,h1=H.find(h=>I.id[h.j]!==I.mid);return JSON.stringify({n:H.length,blocked:H.every(h=>S.obj[h.j]==='kazaanab'),mid:H.filter(h=>I.id[h.j]===I.mid).length,one:new Set(H.map(h=>I.id[h.j])).size===H.length,up:Object.keys(S.wind.up).length,sunk:windSunk(h1.j),walk:walk(h1.j+1),place:canPlace('kazami',(h1.j+2)%W,((h1.j+2)/W)|0,true),midPlace:(()=>{for(let y=CY-8;y<CY+8;y++)for(let x=CX-8;x<CX+8;x++)if(canPlace('kazami',x,y,true))return true;return false})(),bridge:usable('bridge'),mill:S.obj.includes('oldmill'),stream:WN?[...WN.dir].filter(d=>d>=0).length:-1,rm:(removeAt(H[0].j%W,(H[0].j/W)|0),S.obj[H[0].j])})})()`));
  console.log(JSON.stringify(w0));
  assert.ok(w0.n>=6,'風穴の数 '+w0.n);assert.ok(w0.blocked);assert.equal(w0.mid,1);assert.ok(w0.one,'1つの島に風穴は1つ');assert.equal(w0.up,1);assert.equal(w0.sunk,true);assert.equal(w0.walk,false,'しずんだ島は歩けない');assert.equal(w0.place,false,'しずんだ島には置けない');assert.equal(w0.midPlace,true);assert.equal(w0.bridge,false,'木の橋はかけられない');assert.ok(w0.mill);assert.equal(w0.stream,0,'ふさがっているあいだ、風はふかない');assert.equal(w0.rm,'kazaanab','風穴はこわせない');
  /* 風穴をタップ → せいれいが石をどける → 風がふく・かざみを3つもらう → つぎは神殿 */
  await run(`(()=>{document.querySelector('#dialog').hidden=true;dialog=(L,after)=>{if(after)after()};setInterval(()=>{for(const id of['#lvOk','#rlv button']){const b=document.querySelector(id);if(b&&b.offsetParent)b.click()}},500);/* 村レベル・せいれいのレベルの画面は、とじて進める */S.introSeen=true;S.hold=0;S.t=1440+8*60;showItemGift=()=>{};USERPAUSE=false;setMode('look');const j=S.wind.holes[0].j,wx=(j%W+.5)*TS,wy=((j/W|0)+.5)*TS;onTap((wx-cam.x)*cam.z,(wy-cam.y)*cam.z)})()`);
  assert.equal(await run(`S.obj[S.wind.holes[0].j]`),'site','タップで、石をどけはじめる');
  await page.waitForFunction(()=>sacredEval("S.obj[S.wind.holes[0].j]==='kazaana'"),{},{timeout:120000,polling:500});await adv('statue');
  const w1=JSON.parse(await run(`(()=>{const h=S.wind.holes[0];let n=0,b=0,east=true;for(let j=0;j<W*H;j++){if(WN.dir[j]>=0){n++;if(WN.dir[j]!==1)east=false}if(WN.br[j])b++}return JSON.stringify({n,b,east,kz:inv('kazami'),rec:recipeKnown('kazami'),first:WN.dir[h.j+1]})})()`));
  console.log(JSON.stringify(w1));
  assert.equal(w1.n,40,'風の道は40マス');assert.ok(w1.east,'まっすぐ東へ');assert.equal(w1.b,0,'向こうの陸にとどかないと、橋はできない');assert.equal(w1.kz,3);assert.ok(w1.rec);
  /* 神殿を直す → 機能がひらく → つぎは、となりの島へ風をとどける */
  await run(`(()=>{const tj=RUINT;for(const k of templeRuinCells(tj))if(S.obj[k]==='part'){S.obj[k]='';delete S.ref[k]}S.obj[tj]='statue';S.t=1440+9*60;recount();checkQuest()})()`);
  await adv('windReach');
  const b=JSON.parse(await run(`JSON.stringify({feat:['inv','remove','plant','craft','people','summon','shop'].every(k=>S.feat[k]),wb:inv('wbench'),bed:inv('bed'),fl:['clover','bellf','salvia','lily','lotus'].every(k=>S.unlocked[k]),enemy:!!S.enemyOn})`));
  assert.ok(b.feat,'機能がひらく');assert.equal(b.wb,1);assert.equal(b.bed,1);assert.ok(b.fl,'花のたねが、お店に出る');assert.equal(b.enemy,false);
  /* かざみを置いて風をまげる → 雲の橋ができて、島がうかぶ（演出のあと、つぎの目標へ）。木・岩は風を止める */
  const w2=JSON.parse(await run(`(()=>{const h=S.wind.holes[0],hx=h.j%W,hy=(h.j/W)|0,I=windIsles(S);let hit=null;for(let q=-30;q<=30;q++)for(let dx=2;dx<4;dx++){const k=(hy+q)*W+hx+dx;if(k>=0&&k<W*H&&S.obj[k]&&BL[S.obj[k]]&&BL[S.obj[k]].natural){S.obj[k]='';delete S.dyn[k]}}/* 風の道にする列の木・岩を、どけておく（ランダムに生えた物で風が止まらないように） */
    for(let dx=2;dx<9&&!hit;dx++)for(const rot of[0,2]){const j=hy*W+hx+dx;if(S.obj[j]||!canPlace('kazami',hx+dx,hy,true))continue;const up0=Object.assign({},S.wind.up);PLROTS.kazami=rot;S.obj[j]='kazami';(S.rot||(S.rot={}))[j]=rot;recount();if(Object.keys(S.wind.up).length>1){hit={j,rot};break}S.obj[j]='';delete S.rot[j];S.wind.up=up0;WRISEQ.length=0;recount()}
    if(!hit)return JSON.stringify({hit:null,row:[1,2,3,4,5].map(dx=>[S.obj[hy*W+hx+dx],S.ground[hy*W+hx+dx],canPlace('kazami',hx+dx,hy,true)]),dir:[1,2,3,4,5].map(dx=>WN.dir[hy*W+hx+dx]),col:Array.from({length:20},(_,q)=>S.obj[(hy+1+q)*W+hx+3]||S.ground[(hy+1+q)*W+hx+3])});const k=+Object.keys(S.wind.up).find(q=>+q!==I.mid),br=[];for(let j=0;j<W*H;j++)if(WN.br[j])br.push(j);
    return JSON.stringify({hit,k,br:br.length,walkBr:br.every(j=>walk(j)),turn:WN.dir[hit.j+(hit.rot===0?W:-W)]===hit.rot,reach:WN.reach[k],sunk:windSunk(S.wind.holes.find(q=>I.id[q.j]===k)?S.wind.holes.find(q=>I.id[q.j]===k).j:br[0]),q:S.quest})})()`));
  console.log(JSON.stringify(w2));
  assert.ok(w2.hit,'かざみで、となりの島へとどく');assert.ok(w2.br>0,'雲の橋ができる');assert.ok(w2.walkBr,'雲の橋は歩ける');assert.ok(w2.turn,'かざみで向きがかわる');assert.equal(w2.reach,1);assert.equal(w2.sunk,false,'うかんだ島は使える');
  await page.waitForFunction(()=>!!document.querySelector('.idea-reveal[aria-label="島がうかんだ"] button:not([disabled])'),{},{timeout:30000});
  await page.click('.idea-reveal[aria-label="島がうかんだ"] button');await page.waitForFunction(()=>sacredEval("!GIFT_ACTIVE&&S.flags.hayate===2"),{},{timeout:30000,polling:300});
  /* ハヤテが目をさます → メリーゴーラウンドの依頼 */
  await adv('merryFix');
  const h1=JSON.parse(await run(`(()=>{const I=windIsles(S),h=S.res.find(r=>r.name===HAYATE),kz=S.res.find(r=>r.name===KAZANE),mj=S.obj.indexOf('merryb');return JSON.stringify({hay:!!h&&h.elem==='wind',isl:h?I.id[(h.y|0)*W+(h.x|0)]:0,mid:I.mid,merryb:mj>=0&&I.id[mj]===I.mid,parts:[mj+1,mj+W,mj+W+1].every(k=>S.obj[k]==='part'&&S.ref[k]===mj),rides:['cupb','skyswingb','wheelb'].map(id=>{const j=S.obj.indexOf(id);return j>=0&&I.id[j]!==I.mid&&windSunk(j)===!S.wind.up[I.id[j]]}),forgot:windPlayOK(kz,'swing',0),note:windRemNote(kz),known:recipeKnown('merry'),rm:(removeAt(mj%W,(mj/W)|0),S.obj[mj])})})()`));
  console.log(JSON.stringify(h1));
  assert.ok(h1.hay,'ハヤテ（風）が来る');assert.equal(h1.isl,w2.k,'うかんだ島で目をさます');assert.ok(h1.merryb,'こわれたメリーゴーラウンドは、まん中の島');assert.ok(h1.parts,'2×2');assert.deepEqual(h1.rides,[true,true,true],'ほかの遊具は、ほかの島');assert.equal(h1.forgot,false,'遊び方をわすれている');assert.equal(h1.note,'思い出した遊び：0');assert.equal(h1.known,false);assert.equal(h1.rm,'merryb','こわれた遊具はこわせない');
  /* 直す → 風のせいれいが係になる → ハヤテがのる → 遊び方を思い出す・係にごほうび → お礼の会話 */
  await run(`(()=>{const j=S.obj.indexOf('merryb'),wx=(j%W+1)*TS,wy=((j/W|0)+1)*TS;setMode('look');onTap((wx-cam.x)*cam.z,(wy-cam.y)*cam.z);for(const r of S.res){r.fun=20;r.energy=90;r.hunger=450}})()`);
  assert.equal(await run(`(()=>{const j=S.obj.findIndex((o,k)=>o==='site'&&S.dyn[k]&&S.dyn[k].wfix);return j>=0?S.dyn[j].build:''})()`),'merry','タップで、直しはじめる');
  await page.waitForFunction(()=>sacredEval("S.obj.includes('merry')"),{},{timeout:150000,polling:500}).catch(async e=>{console.log(await run(`(()=>{const j=S.obj.findIndex((o,k)=>o==='site'&&S.dyn[k]&&S.dyn[k].wfix);return JSON.stringify({j,d:S.dyn[j],t:S.t%1440/60,n:isNight(),paused,hold:S.hold,gift:GIFT_ACTIVE,dlg:!document.querySelector('#dialog').hidden,act:S.res.map(r=>r.name+':'+(r.act&&r.act.type)+':'+(r.x|0)+','+(r.y|0)+':'+r.hunger+':'+r.energy),tour:S.tour,q:QUESTS[S.quest].id,tt:S.t,a:S.res.map(r=>JSON.stringify(r.act).slice(0,300)+' path:'+(r.path||[]).length),up:USERPAUSE,cam:!!camAnim,sr:stageReady(),lv:!document.querySelector('#lvup').hidden,rlv:!document.querySelector('#rlv').hidden,nr:NEWRES!=null,sh:sheet,idle:!document.querySelector('#idle').hidden,sq:sacredQuietActive(),sc:performance.now()<SCENEHOLD})})()`));await page.waitForTimeout(3000);console.log(await run(`JSON.stringify({tt:S.t,p:S.res.map(r=>r.x.toFixed(2)+','+r.y.toFixed(2))})`));throw e});
  const h2=JSON.parse(await run(`(()=>{const j=S.obj.indexOf('merry'),kz=S.res.find(r=>r.name===KAZANE);return JSON.stringify({known:recipeKnown('merry'),parts:[j+1,j+W,j+W+1].every(k=>S.obj[k]==='part'),off:windPlayOK(kz,'merry',j),on:rideOn(j)})})()`));
  assert.ok(h2.known,'直すと、レシピをおぼえる');assert.ok(h2.parts);assert.equal(h2.off,h2.on,'係がいないと、のれない');
  await page.waitForFunction(()=>sacredEval("(()=>{for(const r of S.res){r.hunger=450;r.energy=Math.max(r.energy,60);if(!(S.flags.rideRun&&S.flags.rideRun.merry))r.fun=Math.min(r.fun,20)}if(isNight())S.t=(Math.floor(S.t/1440)+1)*1440+8*60;return !!(S.flags.rideRun&&S.flags.rideRun.merry)})()"),{},{timeout:240000,polling:400}).catch(async e=>{console.log(await run(`JSON.stringify({act:S.res.map(r=>r.name+':'+(r.act&&r.act.type+'/'+r.act.stage)+':'+Math.round(r.fun)),q:QUESTS[S.quest].id,tk:S.qTalked})`));throw e});
  const h3=JSON.parse(await run(`JSON.stringify({rem:S.res.map(r=>r.name+':'+Object.keys(r.rem||{}).length).join(),rode:S.res.filter(r=>r.rode&&r.rode.merry).length,note:S.res.map(r=>windRemNote(r)).join()})`));
  console.log(JSON.stringify(h3));
  assert.ok(h3.rode>=1,'のったせいれいが、遊び方を思い出す');assert.match(h3.note,/思い出した遊び：1/);
  await adv('rides2');
  const w3=JSON.parse(await run(`(()=>{const I=windIsles(S),k=${'${0}'},r=S.res[0],br=[];for(const q of S.res){endAct(q);q.path=[]}for(let j=0;j<W*H;j++)if(WN.br[j])br.push(j);const o={prog:'うかんだ島 '+windUpN()+'/'+windIsleN()};
    /* 追い風：風と同じ向きに歩くと1.5倍。さからうと1倍 */const d=WN.dir[br[0]],st=WDIR[d][0]+WDIR[d][1]*W;r.x=br[0]%W+.5;r.y=((br[0]/W)|0)+.5;r.path=[br[0]+st];o.tail=windTail(r);r.path=[br[0]-st];o.head=windTail(r);r.path=[];
    /* 木は風を止める */const j0=br[0]-st;const ob=S.obj[j0];S.obj[j0]='deadtree';recount();o.blocked=[...WN.br].filter(v=>v).length;S.obj[j0]=ob;recount();o.again=[...WN.br].filter(v=>v).length;
    /* とりのこされたせいれい：橋を消すと、まん中の島へはこばれる。島は、しずまない */const far=S.wind.holes.find(q=>I.id[q.j]===k),fj=far?far.j+1:-1;r.act=null;r.x=fj%W+.5;r.y=((fj/W)|0)+.5;const hj=${'${1}'};S.obj[hj]='';delete S.rot[hj];recount();o.gone=[...WN.br].filter(v=>v).length;o.reach=WN.reach[k];windTick();o.home=S.res.every(q=>I.id[(q.y|0)*W+(q.x|0)]===I.mid);o.stillUp=!windSunk(fj);
    return JSON.stringify(o)})()`.replace('${0}',w2.k).replace('${1}',w2.hit.j)));
  console.log(JSON.stringify(w3));
  assert.match(w3.prog,/^うかんだ島 1\/\d+$/);assert.equal(w3.tail,1.5,'追い風');assert.equal(w3.head,1);assert.equal(w3.blocked,0,'木は風を止める');assert.ok(w3.again>0);assert.equal(w3.gone,0,'かざみをはずすと、橋が消える');assert.equal(w3.reach,0);assert.ok(w3.home,'とりのこされたせいれいは、まん中の島へ');assert.ok(w3.stillUp,'うかんだ島は、しずまない');
  /* 夜をこえても、コワイノは来ない・止まらない */
  const c=JSON.parse(await run(`(()=>{S.t=1440+19*60;const d0=dayNo();const end=S.t+14*60;let n=0;let slept=false;while(S.t<end&&n++<40000){stepWorld(1.5);for(const r of S.res){updRes(r,1.5);r.hunger=Math.max(r.hunger,800);if(r.act&&r.act.type==='sleep')slept=true}}return JSON.stringify({slept,d:dayNo()-d0,en:S.enemies.length,on:!!S.enemyOn,h:Math.round(hour()),morning:S.lastMorning===dayNo()})})()`));
  console.log(JSON.stringify(c));
  assert.equal(c.d,1,'つぎの日になる');assert.equal(c.h,9);assert.ok(c.morning,'朝が来る');assert.ok(c.slept,'夜は寝る');assert.equal(c.en,0);assert.equal(c.on,false);
  /* セーブして読みなおす：風のステージのまま、雲の海・風穴・うかんだ島も同じ */
  const d=JSON.parse(await run(`(()=>{const n0=skyM().reduce((a,v)=>a+v,0),w0=JSON.stringify(S.wind);save();LIVE[WIND]=null;const L=loadStage(WIND);continueGame(L);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;return JSON.stringify({wd:WD,name:S.res[0].name,same:skyM().reduce((a,v)=>a+v,0)===n0,wind:JSON.stringify(S.wind)===w0,open:windOpenN(),q:QUESTS[S.quest].id,writer:DYWRITER(),hay:S.res.some(r=>r.name===HAYATE)})})()`));
  console.log(JSON.stringify(d));
  assert.equal(d.wd,4);assert.equal(d.name,'カザネ');assert.ok(d.same);assert.ok(d.wind,'風穴とうかんだ島がのこる');assert.equal(d.open,1);assert.equal(d.q,'rides2');assert.ok(d.hay,'ハヤテものこる');assert.equal(d.writer,'カザネ');
  /* マップえらび：風のカードは「つづきから」。土は、ひらかない（水は試作のあいだ、いつでも入れる） */
  const e=JSON.parse(await run(`(()=>{save();showMaps();const C=k=>document.querySelector('#mList .wcard[data-k="'+k+'"]'),B=k=>[...C(k).querySelectorAll('.wbtns button')].map(x=>x.textContent).join('/');const o={w:B(4),w2:B(2),w3:B(3),open:C(4).classList.contains('open'),name:C(4).querySelector('h3').textContent};document.querySelector('#maps').hidden=true;return JSON.stringify(o)})()`));
  console.log(JSON.stringify(e));
  assert.equal(e.w,'つづきから/はじめから');assert.equal(e.w2,'');assert.ok(e.w3,'水は試作のあいだ入れる');assert.ok(e.open);assert.equal(e.name,'風のやんだ空の村');
  assert.deepEqual(errors,[]);await browser.close();console.log('wind-stage ok')})().catch(e=>{console.error(e);process.exit(1)});
