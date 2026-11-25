/* せいれいの名前：来たときの紹介の画面でだけ名前をかえられる（フタバ・もどってきた子はのぞく）。
   ふつうの子は r.name がかわる。お話の子（ノドカ）は r.name はそのままで、会話・知らせ・シートの文字がつけた名前になる */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(async()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const out={};const wait=ms=>new Promise(f=>setTimeout(f,ms));
    const pick=()=>document.querySelector('#sheetBody .btn:not(.ctab)')&&[...document.querySelectorAll('#sheetBody button')].find(b=>b.textContent==='名前をかえる');
    const name=(r,v)=>{pick().click();const ip=document.querySelector('.nk-reveal input');ip.value=v;ip.dispatchEvent(new Event('input'));[...document.querySelectorAll('.nk-reveal .btn')].find(b=>b.textContent==='きめる').click();const e=document.querySelector('.nk-reveal .nkErr');return e?e.textContent:''};
    /* フタバ：紹介の画面でも、名前の行は出ない */const f=S.res.find(q=>q.name===FUTABA);NEWRES=f.id;openSheet('res',f.id);out.futaba=!!pick();closeSheet();
    /* ふつうの子 */const g=mkRes(S,'ハル','wood',CX+.5,CY+.5);S.res.push(g);S.keyN=S.keyN||{};S.keyN.wood2='ハル';memo('x','ハル（木のせいれい）が村にやってきた');NEWRES=g.id;openSheet('res',g.id);out.gBtn=!!pick();
    out.dup=name(g,FUTABA);document.querySelector('.nk-reveal')&&document.querySelector('.nk-reveal').remove();
    out.ok=name(g,'ミドリ');out.gName=g.name;out.keyN=S.keyN.wood2;out.memo=S.memo[S.memo.length-1][2];
    /* お話の子：ノドカ */const n=mkRes(S,NODOKA,'earth',CX+1.5,CY+.5);S.res.push(n);NEWRES=n.id;openSheet('res',n.id);out.contain=name(n,'ノドカちゃん');document.querySelector('.nk-reveal')&&document.querySelector('.nk-reveal').remove();
    out.nok=name(n,'ツチコ');out.nName=n.name;out.nick=S.nick&&S.nick[NODOKA];await wait(30);out.title=document.querySelector('#sheetTitle')?document.querySelector('#sheetTitle').textContent:document.querySelector('#sheetWrap').textContent.slice(0,40);
    closeSheet();NEWRES=null;
    toast('ノドカがやってきた');await wait(30);out.toast=[...document.querySelectorAll('#toasts .toast')].map(t=>t.textContent).join('|');
    DLGQ.length=0;document.querySelector('#dialog').hidden=true;DLGGAP=0;DLGTAP=0;dialog([[NODOKA,'ノドカだよぉ。よろしくねぇ。']]);await wait(1500);out.who=document.querySelector('#dlgWho').textContent;out.text=document.querySelector('#dlgText').textContent;
    /* もどってきた子：名前の行は出ない */document.querySelector('#dialog').hidden=true;g.back=1;NEWRES=g.id;openSheet('res',g.id);out.back=!!pick();closeSheet();NEWRES=null;
    /* 紹介の画面のあとは、かえられない */openSheet('res',n.id);out.later=!!pick();closeSheet();
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.futaba,false);assert.equal(r.gBtn,true);assert.ok(r.dup);assert.equal(r.ok,'');assert.equal(r.gName,'ミドリ');assert.equal(r.keyN,'ミドリ');assert.ok(r.memo.includes('ミドリ'));
  assert.ok(r.contain);assert.equal(r.nok,'');assert.equal(r.nName,'ノドカ');assert.equal(r.nick,'ツチコ');assert.ok(r.title.includes('ツチコ'),r.title);
  assert.ok(r.toast.includes('ツチコ')&&!r.toast.includes('ノドカ'),r.toast);assert.equal(r.who,'ツチコ');assert.ok(r.text.includes('ツチコ')&&!r.text.includes('ノドカ'),r.text);
  assert.equal(r.back,false);assert.equal(r.later,false);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
