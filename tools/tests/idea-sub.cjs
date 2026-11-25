/* ひらめきのサブクエスト（idea-sub.js）：条件をみたしても、すぐにレシピをおぼえない。おねがいを聞いて受けたらおぼえ（会話に「あたらしいかたち」）、1つ作ったらたっせい。
   かさかさ草（まるクッション）・空き缶（つった子が話す）・野良の生き物（小屋）・そうび */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const o=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;S.t=1440*3+600;const f=S.res[0];
    S.res.push(mkRes(S,'テスト','wind',f.x+1,f.y));for(const r of S.res){r.nap=false;r.act=null}
    S.subSt={};S.subSeen={};S.subDone={};for(const q of SUBQ)if(!q.k.startsWith('idea_'))S.subDone[q.k]=1;S.subTalkAt=null;S.qStory=null;S.ideaQ={};
    const out={};S.mat.kasa=1;matIdea();out.pend=!!S.ideaQ.idea_pouf;out.known0=!!(S.recipes||{}).pouf;
    checkSub();out.st1=S.subSt.idea_pouf;
    const D0=dialog;let L=[];dialog=(x,cb)=>{L=x;cb&&cb()};subTalk('idea_pouf');out.idea=L.some(x=>x[0]==='@idea');out.st2=S.subSt.idea_pouf;out.known1=!!S.recipes.pouf;
    S.t+=200;(S.kb||(S.kb={done:{}})).done['f:pouf']=1;checkSub();out.st3=S.subSt.idea_pouf;S.subTalkAt=null;subTalk('idea_pouf');out.done=!!S.subDone.idea_pouf;
    ideaOffer('idea_joro','テスト');out.joroWho=SUBQ.find(q=>q.k==='idea_joro').who;out.joro0=!!(S.recipes||{}).joro;
    const a={id:950,k:'hane',h:-1,stray:1,x:f.x+3,y:f.y,face:1,wt:0};delete S.recipes.coop;out.stray=strayIdea(a);out.coop=S.ideaQ.idea_coop&&S.ideaQ.idea_coop.an;out.coop0=!!S.recipes.coop;
    out.coopL=SUBQ.find(q=>q.k==='idea_coop').L.map(x=>x[1]).join('/');
    S.gotMat=S.gotMat||{};S.gotMat.wood=100;gearIdea('wood');const gk=Object.keys(S.ideaQ).filter(k=>k.startsWith('idea_g_'));out.gear=gk.length;out.gear0=gk.some(k=>!!S.recipes[k.slice(7)]);
    dialog=D0;return JSON.stringify(out)})()`));
  console.log(o);
  assert.equal(o.pend,true,'pending');assert.equal(o.known0,false,'not learned yet');assert.equal(o.st1,1,'offered');
  assert.equal(o.idea,true,'reveal in talk');assert.equal(o.st2,2);assert.equal(o.known1,true,'learned on accept');
  assert.equal(o.st3,3,'made one');assert.equal(o.done,true);
  assert.equal(o.joroWho,'テスト','fisher speaks');assert.equal(o.joro0,false);
  assert.equal(o.stray,false,'popup still shows');assert.equal(o.coop,'hane');assert.equal(o.coop0,false);assert.ok(o.coopL.includes('ハネマリ'),o.coopL);
  assert.equal(o.gear,1,'one gear idea');assert.equal(o.gear0,false);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
