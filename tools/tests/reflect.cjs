/* クリアのふりかえり：点やランクを出さない。記録の少ない古いセーブでも、空や undefined を出さない。思い出帳から何度でも開ける。
   知らせは1回だけ（再会のあとの、しずかな時間がおわってから）。フリーモードには出さない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();`);
  const txt=`document.querySelector('#sheetBody').textContent+document.querySelector('#sheetTitle').textContent`;
  const bad=t=>/undefined|NaN|null|てん|ランク|スコア/.test(t);
  /* クリア前は、思い出帳にも出さない */
  assert.equal(await run(`(()=>{openSheet('menu','record');const t=${txt};closeSheet();return /この村のおわりに/.test(t)})()`),false);
  /* 古いセーブ：クリアの記録がなく、なかよし・メモ・スポットもない */
  const old=JSON.parse(await run(`(()=>{S.cleared=true;S.clearDay=40;delete S.clearRec;S.score={tot:1500,rank:'C',parts:[['クリアした日','40日目',2000],['せいれい','5人',500],['消えてしまったせいれい','1人',-50]]};S.bond={};S.memo=[];S.spotSeen={};S.gone=[];
    openSheet('menu','record');const rec=${txt};[...document.querySelectorAll('#sheetBody button')].find(b=>b.textContent==='村のふりかえり').click();const a=${txt},k=sheet;
    [...document.querySelectorAll('#sheetBody button')].find(b=>b.textContent==='クリアまでの記録').click();const b=${txt},k2=sheet;closeSheet();return JSON.stringify({rec,a,b,k,k2})})()`));
  assert.ok(/この村のおわりに/.test(old.rec)&&!/クリアスコア/.test(old.rec),'memory book: reflection entry, no score row');
  assert.equal(old.k,'reflect');assert.equal(old.k2,'clearrec');
  assert.ok(!bad(old.a),'old save reflection has no blanks or score words: '+old.a);assert.ok(/村を守りきった|育った村/.test(old.a));
  assert.ok(/40日め/.test(old.b)&&/いたせいれい5人/.test(old.b)&&!bad(old.b),'old save clear record: '+old.b);
  console.log('Reflection: old save without records shows natural text and the clear record');
  /* 記録のある村：なかよし・スポット・思い出が、その村から出る。長く暮らした村も、低い評価にしない */
  const full=JSON.parse(await run(`(()=>{if(S.res.length<2)S.res.push(mkRes(S,'テスト','earth',CX+1.5,CY+.5));const[a,b]=S.res;S.bond={[bondKey(a,b)]:70};S.memo=[[3,'x','はじめて家ができた'],[5,'x','村レベル3になった'],[9,'x','ブランコで遊んだ']];S.spotSeen={park:1};S.t=80*1440+600;
    clearSnap();S.playSec=0;S.clearRec.ps=4000;openSheet('reflect');const t=${txt};openSheet('clearrec');const c=${txt};closeSheet();return JSON.stringify({t,c,a:a.name,b:b.name})})()`));
  assert.ok(full.t.includes(full.a+'と'+full.b)&&/ちかばの公園/.test(full.t)&&/はじめて家ができた/.test(full.t)&&!/村レベル3/.test(full.t),full.t);
  assert.ok(/ゆっくりと時間をかけて/.test(full.t)&&!bad(full.t));
  assert.ok(/81日め/.test(full.c)&&/1時間6分/.test(full.c)&&!bad(full.c),full.c);
  console.log('Reflection: built from this village\'s records; long stay is not judged');
  /* 知らせ：再会のあと、しずかなあいだはまつ。1回だけ */
  const n=JSON.parse(await run(`(()=>{delete S.flags.rfNote;camAnim=null;reunionCalm();/* カメラが動いているあいだは知らせをまつので、止めておく */const q=document.querySelector('#toasts');q.innerHTML='';reflectNoteTick();const w=!!S.flags.rfNote;CALMT=0;reflectNoteTick();const t1=q.textContent;q.innerHTML='';reflectNoteTick();return JSON.stringify({w,on:!!S.flags.rfNote,t1,t2:q.textContent})})()`));
  assert.equal(n.w,false,'waits during the calm');assert.ok(n.on&&/思い出帳/.test(n.t1));assert.equal(n.t2,'','only once');
  /* 再会のあとのしずかなあいだは、レベルアップの知らせもまつ */
  assert.equal(await run(`(()=>{const l=S.lv;S.lv=1;reunionCalm();checkLevel();const r=S.lv;CALMT=0;S.lv=l;return r})()`),1);
  /* フリーモードには出さない */
  assert.equal(await run(`(()=>{const f=S.free;S.free=true;const r=reflectOK();S.free=f;return r})()`),false);
  assert.deepEqual(errors,[]);await browser.close();console.log('Reflection: ok');
})().catch(e=>{console.error(e);process.exit(1)});
