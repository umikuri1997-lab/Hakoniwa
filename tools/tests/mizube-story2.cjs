/* 水のお話の後半（mizube-story.js）：ぶつかる → ため池の底のヌシ様 → おくりの水路 → キリノオオカゲ → さいごの霧 → 夜明け → クリア・古いセーブ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:3});
  const until=(code,ms)=>page.waitForFunction(c=>sacredEval(c),code,{timeout:ms||60000,polling:300}).catch(async e=>{console.log(await run(`JSON.stringify({q:QUESTS[S.quest]&&QUESTS[S.quest].id,tk:S.qTalked,st:S.qStory,ws:!!WSRUN,cam:!!camAnim,h:hour(),kq:S.mz.kq,sq:S.mz.sq,acts:S.res.map(r=>r.name+':'+(r.act&&r.act.type+'/'+r.act.stage))})`));throw e});
  await run(`(()=>{dialog=(L,after)=>{window.__L=(window.__L||[]).concat(L.map(x=>x[0]));if(after)setTimeout(after,0)};setInterval(()=>{for(const id of['#lvOk','#rlv button']){const b=document.querySelector(id);if(b&&b.offsetParent)b.click()}},400);
    document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;USERPAUSE=false;showItemGift=()=>{};S.t=1440*2+10*60;
    const m=S.res.find(r=>r.name===MIO);const n=mkRes(S,NOMI,'earth',m.x+1,m.y);S.res.push(n);S.godGone=true;S.enemyOn=true;S.nights=5;
    for(const g of S.mz.gates.slice(0,2))mzGateOpen(g.j,null);S.mz.clr[mzGate3()]=1;MZC.mist=null;recount();
    S.quest=questIndexOf('mzfind3');S.qTalked=true;S.qStory=null;window.__F=()=>{checkQuest();if(S.qStory!=null){document.querySelector('#dialog').hidden=true;startTalk()}};__F();return 1})()`);await new Promise(r=>setTimeout(r,500));
  const s0=JSON.parse(await run(`(()=>{const m=S.res.find(r=>r.name===MIO),n=S.res.find(r=>r.name===NOMI);
    return JSON.stringify({ids:QUESTS.map(q=>q.id).slice(-7).join(),q:QUESTS[S.quest].id,fight:!!S.flags.mzFight,qr:qrPair(m,n),prog:QUESTS[S.quest].prog()})})()`));
  console.log(JSON.stringify(s0));
  assert.equal(s0.ids,'mzgate2,mzfind3,mzpond,mzokuri,mzkiri,mzsend,mzdawn');assert.equal(s0.q,'mzpond');assert.ok(s0.fight,'ぶつかったら、口をきかない');assert.ok(s0.qr,'2人のおしゃべり・遊びを止める');assert.equal(s0.prog,'ミオとノミが、口をきかない');
  /* ため池の底：こうらをタップ → 2人が歩いて行き、そろったら話す */
  const k1=JSON.parse(await run(`(()=>{mzKameEnsure();const j=S.mz.kj;const ok=S.obj[j]==='mzkame'&&S.ground[j]===2;mzTap(j%W,(j/W)|0);return JSON.stringify({ok,kq:S.mz.kq,prog:QUESTS[S.quest].prog()})})()`));
  console.log(JSON.stringify(k1));assert.ok(k1.ok,'こうらは、水の引いたため池の底');assert.equal(k1.kq,1);
  await run(`window.__T=setInterval(()=>{for(let i=0;i<8;i++)stepWorld(.25)},30)`);
  await until(`S.flags.mzKame===1&&!WSRUN`,90000);
  const k2=JSON.parse(await run(`(()=>{return JSON.stringify({q:QUESTS[S.quest].id,L:window.__L.includes(NUSHI3),kameD:S.mz.kameD,tk:S.qTalked})})()`));
  console.log(JSON.stringify(k2));assert.equal(k2.q,'mzokuri');assert.ok(k2.L,'ヌシ様が話す');assert.equal(k2.tk,false,'ノミの話は、つぎの日');
  await run(`clearInterval(window.__T)`);
  /* おくりの水路：つぎの日にノミが話す（仲なおり）→ 3つめの水門の前から南の池まで */
  const o1=JSON.parse(await run(`(()=>{S.t=1440*(S.mz.kameD+1-1)+10*60;const q=QUESTS[S.quest];const w=q.talk.when();S.qTalked=true;questGives(q,q.talk.gives);const m=S.res.find(r=>r.name===MIO),n=S.res.find(r=>r.name===NOMI);
    const before=!!mzOkuriPath();const g=mzGate3();let x=g%W,y=(g/W)|0;const L=[];const add=(a,b)=>{const j=b*W+a;S.obj[j]='';S.floor[j]='';S.ground[j]=0;S.mz.cn[j]=1;L.push(j)};
    x-=1;add(x,y);while(y<CY+15){y++;add(x,y)}const P=(()=>{for(let a=x;a>CX-26;a--){const j=y*W+a;if(S.ground[j]===1)return a}return -1})();while(x>P+1){x--;add(x,y)}recount();
    return JSON.stringify({w,make:!!S.flags.mzMake,qr:qrPair(m,n),before,after:!!mzOkuriPath(),hs:L.every((j,i)=>i===0||hiAt(j)<=hiAt(L[i-1]))})})()`));
  console.log(JSON.stringify(o1));assert.ok(o1.w);assert.ok(o1.make);assert.equal(o1.qr,false,'仲なおり');assert.equal(o1.before,false);assert.ok(o1.hs,'水路は下りだけ');assert.ok(o1.after,'おくりの水路がつながった');
  /* キリノオオカゲ：その日の夕方に会話、その夜に来る。霧・こおる水路。追いはらえないと3日あと */
  const b1=JSON.parse(await run(`(()=>{__F();S.t=1440*(dayNo()-1)+11*60;mzStoryTick(1);const d=S.mz.kD,day=dayNo();window.__L=[];S.t=1440*(day-1)+17*60+5;mzStoryTick(1);const eve=window.__L.includes(MIO)||window.__L.includes(NOMI);
    const w=waveFor(day+1);return JSON.stringify({q:QUESTS[S.quest].id,d,day,eve,kiri:w.includes('kirino'),prog:QUESTS[S.quest].prog(),hp:EN.kirino.hp,boss2:EN.boss2.hp})})()`));
  console.log(JSON.stringify(b1));assert.equal(b1.q,'mzkiri');assert.equal(b1.d,b1.day,'きょう');assert.ok(b1.eve,'夕方の会話');assert.ok(b1.kiri,'その夜に来る');assert.equal(b1.prog,'今夜、キリノオオカゲがやってくる');assert.equal(b1.hp,b1.boss2,'ヨルノオオカゲと同じ強さ');
  const b2=JSON.parse(await run(`(()=>{const tw=S.mz.kj;S.enemies=[{id:999,type:'kirino',x:0,y:0,hp:1100,max:1100,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false}];const e=S.enemies[0];
    const c=Object.keys(S.mz.cn).map(Number).find(j=>MZC.wet&&MZC.wet[j]);let ice=null,moat0=null;if(c!=null){moat0=mzMoat(c);e.x=c%W+.5;e.y=((c/W)|0)+.5;mzIceTick();ice=mzMoat(c)}
    const fog=mzKiriFog((e.y|0)*W+(e.x|0)+2*W),far=mzKiriFog((e.y|0)*W+(e.x|0)+12);mzStoryMorning();const melt=c!=null?mzMoat(c):null;
    S.enemies=[];S.t=1440*(S.mz.kD+1-1)+7*60;mzStoryTick(1);return JSON.stringify({c,moat0,ice,melt,fog,far,kD:S.mz.kD,day:dayNo(),prog:QUESTS[S.quest].prog()})})()`));
  console.log(JSON.stringify(b2));if(b2.c!=null){assert.equal(b2.moat0,true);assert.equal(b2.ice,false,'こおった水路は堀にならない');assert.equal(b2.melt,true,'朝にとける')}
  assert.ok(b2.fog,'近くの見張り台は、とどく所が半分');assert.equal(b2.far,false);assert.equal(b2.kD,b2.day+2,'3日あとの夜');assert.match(b2.prog,/あと2日/);
  const b3=JSON.parse(await run(`(()=>{const e={id:998,type:'kirino',x:CX+.5,y:CY+.5,hp:1,max:1100,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false};S.enemies=[e];defeat(e,'');S.enemies=[];S.t=1440*(S.mz.kD+1-1)+7*60;__F();return JSON.stringify({down:S.flags.mzKiriDown,q:QUESTS[S.quest].id})})()`));
  console.log(JSON.stringify(b3));assert.equal(b3.down,1);assert.equal(b3.q,'mzsend');
  /* さいごの霧：夕方に3つめの水門をタップ → ミオが歩いて行き、水門をひらいて見おくる */
  const g1=JSON.parse(await run(`(()=>{const g=mzGate3();S.t=1440*(dayNo()-1)+10*60;mzTap(g%W,(g/W)|0);const early=S.mz.sq||0;S.t=1440*(dayNo()-1)+16*60+10;mzTap(g%W,(g/W)|0);return JSON.stringify({early,sq:S.mz.sq,req:S.mz.req.includes(g),h:hour(),o:S.obj[g],mist:mzMistAt(g),mio:!!mzHere(MIO),qq:QUESTS[S.quest].id})})()`));
  console.log(JSON.stringify(g1));assert.equal(g1.early,0,'夕方まで待つ');assert.equal(g1.sq,1);assert.equal(g1.req,false,'ほかのせいれいは直しにいかない');
  await run(`window.__T=setInterval(()=>{for(let i=0;i<8;i++)stepWorld(.25)},30)`);
  await until(`S.flags.mzSent===1&&!WSRUN`,90000);
  const g2=JSON.parse(await run(`(()=>{clearInterval(window.__T);if(isNight())S.t=1440*(dayNo()-(hour()<6?1:0))+7*60;__F();
    const e={id:997,type:'kirino',x:0,y:0,hp:1100,max:1100,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false};const c=Object.keys(S.mz.cn).map(Number).find(j=>MZC.wet[j]);const moat0=mzMoat(c);e.x=c%W+.5;e.y=((c/W)|0)+.5;S.enemies=[e];mzIceTick();const ice=mzMoat(c);S.enemies=[];mzStoryMorning();const melt=mzMoat(c);
    return JSON.stringify({open:S.mz.gates[2].open,q:QUESTS[S.quest].id,wet3:MZC.used[2],moat0,ice,melt,sentD:S.mz.sentD,day:dayNo()})})()`));
  console.log(JSON.stringify(g2));assert.equal(g2.open,1,'ミオが3つめの水門をひらく');assert.equal(g2.q,'mzdawn');assert.ok(g2.wet3>40,'おくりの水路まで水がとどく');assert.equal(g2.moat0,true);assert.equal(g2.ice,false,'こおった水路は堀にならない');assert.equal(g2.melt,true,'朝にとける');
  /* 夜明け → 夕方の食堂 → クリア */
  await run(`S.t=1440*(S.mz.sentD+1-1)+6*60+30;S.enemies=[];window.__T=setInterval(()=>{for(let i=0;i<8;i++)stepWorld(.25)},30)`);
  await until(`S.flags.mzDawn===1&&!WSRUN`,90000);
  const d1=JSON.parse(await run(`(()=>{const mist=S.mz.clr.every(v=>v===1),[x0,y0,x1,y1]=S.mz.pond;return JSON.stringify({mist,full:S.ground[y0*W+x0]===1&&S.ground[y1*W+x1]===1,fl:S.obj[S.mz.fj]})})()`));
  console.log(JSON.stringify(d1));assert.ok(d1.mist,'村じゅうの霧が晴れる');assert.ok(d1.full,'ため池に水がもどる');assert.equal(d1.fl,'lily','白い花');
  await run(`S.t=1440*(dayNo()-1)+17*60+10`);
  await until(`S.cleared===true`,90000);
  await run(`clearInterval(window.__T)`);
  /* 古いセーブ：前のならびの「つづき」まで来ていた → 3つめの水門のお礼の会話から */
  const m1=JSON.parse(await run(`(()=>{S.cleared=false;S.flags.mzq3=0;S.flags.mzFight=0;S.quest=questIndexOf('mzfind3')+1;S.qTalked=false;mzStoryMig();const a=QUESTS[S.quest].id,t=S.qTalked;mzStoryMig();return JSON.stringify({a,t,b:QUESTS[S.quest].id})})()`));
  console.log(JSON.stringify(m1));assert.equal(m1.a,'mzfind3');assert.equal(m1.t,true);assert.equal(m1.b,'mzfind3');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
