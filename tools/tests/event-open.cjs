/* イベントのひらき方（event-open.js）：はじめは体そう・お誕生日会だけ。草原は「〇〇したい」のサブクエストをおえるとひらき、大きな知らせが出る。火山などは、じょうけんでひらく。
   前のセーブで出たことのあるイベントは、ひらいたまま。あたらしい効果（fx）の説明と、はたらき（まんぷく・その夜の攻撃力・あしたは晴れ） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({evlock:true});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  const a=await J(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;return {on:Object.keys(EVENTS).filter(evOn).sort(),subs:SUBQ.filter(q=>q.ev).map(q=>q.ev).length}})()`);
  assert.deepEqual(a.on,['bday','taiso']);assert.ok(a.subs>=15);
  /* サブクエストをおえると、ひらく */
  const b=await J(`(()=>{S.subSt=S.subSt||{};S.subDone=S.subDone||{};S.subSt.ev_oni=3;S.subSeen={ev_oni:1};subTalk('ev_oni');for(let i=0;i<30&&!document.querySelector('#dialog').hidden;i++){if(typeof DLGA!=='undefined'&&DLGA){DLGA.readReady=0;DLGA.holdUntil=0}const x=document.querySelector('#dlgBtns button');if(x){x.disabled=false;x.click()}}return {on:evOn('oni'),q:EVOPENQ.slice()}})()`);
  assert.equal(b.on,true);assert.deepEqual(b.q,['oni']);
  await run(`EVOPENT=0;evOpenTick()`);await page.waitForTimeout(300);
  assert.equal(await run(`!!document.querySelector('.idea-reveal')&&GIFT_ACTIVE`),true,'大きな知らせ');
  await run(`(()=>{const o=document.querySelector('.idea-reveal');if(o)o.remove();GIFT_ACTIVE=false})()`);
  /* じょうけんでひらく（大会：なかまが3人） */
  const c=await J(`(()=>{const f=S.res[0];while(S.res.length<3)S.res.push(mkRes(S,'t'+S.res.length,'earth',f.x+1,f.y));EVOPENQ.length=0;evOpenTick();return {cup0:evOn('cup0'),cup1:evOn('cup1')}})()`);
  assert.equal(c.cup0,true);assert.equal(c.cup1,false);
  /* 前のセーブ */
  const d=await J(`(()=>{const s={flags:{},evDone:{yomi:'x'},ev:{id:'camp',next:null}};evOpenMig(s);return s.evOpen})()`);assert.deepEqual(d,{yomi:1,camp:1});
  /* あたらしい効果 */
  const e=await J(`(()=>{const r=S.res[0];evFxApply(EVENTS.gochi,[r]);const full=r.full>S.t;evFxApply(EVENTS.camp,[r]);const atk=evSt(r,'atk');evFxApply(EVENTS.hoshi,[r]);const Q=wxQ()[dayNo()+1];return {full,atk,sunny:!!Q&&!Q.r,txt:evGainTxt('gochi')}})()`);
  assert.equal(e.full,true);assert.equal(e.atk,10);assert.equal(e.sunny,true);assert.ok(e.txt.includes('まんぷく'));
  assert.deepEqual(errors,[]);await browser.close();console.log('event-open ok')})().catch(e=>{console.error(e);process.exit(1)});
