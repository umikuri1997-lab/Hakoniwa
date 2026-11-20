/* QA の報告（暮らし・セーブ・会話）の直し：
   値なしの data-hold も長押しで決まる・ラグは段差をまたがない・ひっこしミトンで加工の予定もうつる・
   日記は「来たのに追いはらえなかった夜」を「来なかった」と書かない・会話の記録は話す人もくらべる・
   書き出しに写真も入り、読みこむ前にたしかめる画面が出て、写真の番号を日記に合わせる・闇のセーブがあればカードがひらく */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};document.querySelector('#dialog').hidden=true;S.hold=0;USERPAUSE=true;S.enemyOn=false;true`);
  /* 01：値なしの data-hold */
  assert.equal(await run(`(()=>{const b=el('<button data-hold>x</button>');return holdOn(b)})()`),true);
  assert.equal(await run(`(()=>{const b=el('<button>x</button>');return holdOn(b)})()`),false);
  /* 04：ラグは段差をまたがない（屋根と同じ） */
  const rug=JSON.parse(await run(`(()=>{const x=CX-6,y=CY+8,C=rugCells(y*W+x);for(const c of C){S.obj[c]='';S.ground[c]=0;S.floor[c]='';S.hi[c]=0}recount();const flat=canRug(x,y,true);S.hi[C[1]]=1;const slope=canRug(x,y,true),roof=canRoof(x,y,true);S.hi[C[1]]=0;return JSON.stringify([flat,slope,roof])})()`));
  assert.deepEqual(rug,[true,false,false]);
  /* 03：ひっこしミトンで、はたおり機の予定・中身・できた物・運ぶ行き先もうつる */
  const mv=JSON.parse(await run(`(()=>{const x=CX-6,y=CY+12,a=y*W+x,j=a+3;for(const c of[a,j]){S.obj[c]='';S.ground[c]=0;S.floor[c]='';S.hi[c]=0}S.obj[a]='loom';recount();
    S.prQ={[a]:{kasa:3}};S.prIn={[a]:{kasa:3}};S.prOut={[a]:{nuno:2}};S.ovenSet={[a]:{m:'auto'}};const r=S.res[0];r.ppk={j:a,m:{kasa:3}};
    MOVESRC=null;moveTap(x,y);moveTap(x+3,y);procTick(1);
    return JSON.stringify([S.obj[a]||'',S.obj[j],S.prQ[j],S.prIn[j],S.prOut[j],S.ovenSet[j],r.ppk.j===j,S.prQ[a]||null])})()`));
  assert.deepEqual(mv,['','loom',{kasa:3},{kasa:3},{nuno:2},{m:'auto'},true,null]);
  /* 05：来たのに追いはらえなかった夜 */
  const dy=await run(`(()=>{const sec=dyDayPage({d:3,e:{d:3,m:[],w:[],ns:{n:3,kill:0,hurt:1,broke:1,lost:[]}},ev:[]});return sec.querySelector('.dyns').textContent})()`);
  assert.ok(/3ひき来た。追いはらえなかった/.test(dy),dy);
  /* 06：同じ文でも話す人がちがえば記録する */
  const src=await page.evaluate(()=>fetch('js/dialog.js').then(r=>r.text()));
  assert.ok(src.includes('if(!last||last[0]!==w||last[1]!==tx)H.push([w,tx])'));
  /* 08・09：写真の書き出し・読みこみと、日記の番号あわせ */
  const ph=JSON.parse(await run(`(async()=>{const c=document.createElement('canvas');c.width=c.height=8;const b=await new Promise(ok=>c.toBlob(ok,'image/jpeg'));
    const id=await phAdd({w:0,d:2,h:12,vn:'',at:1,b});const X=await phExport();const mine=X.filter(p=>p.w===0);
    const M=await phImport(X,[0]);const g={dy:{ph:id},diary:[{ph:id},{ph:99999}]};phRemap(g,M[0]);const L=await phList(0);
    return JSON.stringify({n:mine.length,url:mine[0].b.slice(0,11),list:L.length,dy:g.dy.ph===M[0][id],gone:g.diary[1].ph===undefined,same:L[0].id===M[0][id]})})()`));
  assert.deepEqual(ph,{n:1,url:'data:image/',list:1,dy:true,gone:true,same:true});
  const ask=JSON.parse(await run(`(()=>{const v=JSON.stringify(S);importAsk({app:'hakoniwa',v:1,at:Date.now(),saves:{[SAVE_KEYS[0]]:v},photos:[]},[[SAVE_KEYS[0],v]]);const c=document.querySelector('.imp-reveal');
    const r=[!!c,c.querySelectorAll('.impL .sec').length,!!c.querySelector('button[data-hold]')];c.remove();return JSON.stringify(r)})()`));
  assert.deepEqual(ask,[true,1,true]);
  /* 02：闇のセーブがあれば、カードがひらく */
  const yami=await run(`(()=>{const k=KV.getItem('hakoniwa-w6open');KV.removeItem('hakoniwa-w6open');const old=LIVE[YAMI];LIVE[YAMI]={introSeen:true,res:[],lv:1};showMaps();const c=document.querySelectorAll('#mList .wcard');const t=[...c].find(x=>x.querySelector('.wn').textContent.includes('WORLD 6')||x.querySelector('h3').textContent===WORLDS[YAMI].name);const r=t&&t.classList.contains('open')&&!!t.querySelector('.wbtns .btn.pri');LIVE[YAMI]=old;if(k)KV.setItem('hakoniwa-w6open',k);$('#maps').hidden=true;return r})()`);
  assert.equal(yami,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
