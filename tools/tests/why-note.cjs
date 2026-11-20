/* 行動のわけ（whyNote）：直しにいく・食べ物を集めにいく・おなかがすいた・休みにいく、のはじめに、その物を見て、ときどきひとこと。
   くりかえさない（同じ子・同じわけは時計の6時間に1回、だれかが言ったら20秒）。会話中は出さない。セリフに画面や中のしくみの言葉がない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=600;if(sheet)closeSheet();`);
  /* セリフ：メタな言葉を入れない。どの属性の言いかたもある */
  const bad=JSON.parse(await run(`(()=>{const W0=['タップ','おつげ','タスク','予約','処理','優先','メニュー','マス','クエスト','村レベル','パワー'],out=[];for(const k in WHYL){for(const ek of['earth','wood','water','fireA','fireB','wind']){const L=WHYL[k][ek];if(!L||L.length<2)out.push(k+':'+ek+' missing');else for(const t of L)if(W0.some(w=>t.includes(w)))out.push(t)}}return JSON.stringify(out)})()`));
  assert.deepEqual(bad,[],'no meta words, every voice has lines');
  /* 直しにいく：その物を見て、ちょっと止まり、❗ */
  const rp=JSON.parse(await run(`(()=>{const r=S.res[0];r.elem='earth';r.hunger=hMax(r);r.energy=100;r.hidden=false;S.enemies=[];WHYT=-1e9;delete r.whyT;
    const x=(r.x|0)+3,y=r.y|0,j=y*W+x;S.obj[j]='fence';S.hp[j]=1;recount();r.act={type:'chop',stage:'do',t:0};const G=bfs(r.x|0,r.y|0);
    const st=nearest(G,k=>walk(k)&&Math.abs(k%W-x)+Math.abs((k/W|0)-y)===1,40);startAct(r,G,'repair',st,{key:'o'+j,obj:j});
    const a={b:r.bubble,face:r.face,hold:r.act.whyW>S.t,cd:r.whyT&&r.whyT.repair===S.t};
    /* もう1回：同じわけは、しばらく言わない */
    r.bubble='';RHOLD.delete(r);WHYT=-1e9;r.act={type:'chop',stage:'do',t:0};startAct(r,G,'repair',st,{key:'o'+j,obj:j});a.again=r.bubble;
    /* 会話中は出さない */
    delete r.whyT;WHYT=-1e9;r.bubble='';r.act={type:'chop',stage:'do',t:0};document.querySelector('#dialog').hidden=false;startAct(r,G,'repair',st,{key:'o'+j,obj:j});a.dlg=r.bubble;document.querySelector('#dialog').hidden=true;
    /* だれかが言ったら20秒は、ほかの子も言わない */
    delete r.whyT;WHYT=performance.now();r.bubble='';r.act={type:'chop',stage:'do',t:0};startAct(r,G,'repair',st,{key:'o'+j,obj:j});a.gap=r.bubble;endAct(r);RHOLD.delete(r);return JSON.stringify(a)})()`));
  assert.equal(rp.b,'❗');assert.equal(rp.face,1,'looks toward the damaged fence');assert.ok(rp.hold&&rp.cd);assert.equal(rp.again,'','not again right away');assert.equal(rp.dlg,'','not during a talk');assert.equal(rp.gap,'','not right after another spirit');
  console.log('Why-note: repair glance, cooldowns and dialog guard');
  /* 食べ物が少ない・おなかがすいた・休む */
  const k=JSON.parse(await run(`(()=>{const r=S.res[0],x=r.act;const kind=(t,prev,f)=>{f&&f();r.act={type:t,stage:'walk',t:0};return whyKind(r,r.act,prev)};
    const food=kind('harvest','chop',()=>{S.food=0});const full=kind('harvest','chop',()=>{S.food=999});
    const hungry=kind('fetch','chop',()=>{r.hunger=200});const snack=kind('fetch','idle',()=>{r.hunger=200});const fed=kind('fetch','chop',()=>{r.hunger=hMax(r)});
    S.t=600;const tired=kind('sleep','idle',()=>{r.energy=10});S.t=24*60;const night=kind('sleep','chop',()=>{r.energy=80});const nightIdle=kind('sleep','wander',()=>{});S.t=600;r.energy=100;r.act=null;return JSON.stringify({food,full,hungry,snack,fed,tired,night,nightIdle})})()`));
  assert.deepEqual(k,{food:'food',full:'',hungry:'hungry',snack:'',fed:'',tired:'rest',night:'rest',nightIdle:''});
  console.log('Why-note: food, hunger and rest only when the reason is real');
  assert.deepEqual(errors,[]);await browser.close();console.log('Why-note: ok');
})().catch(e=>{console.error(e);process.exit(1)});
