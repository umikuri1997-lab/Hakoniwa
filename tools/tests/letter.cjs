/* せいれいの手紙：なかよし・記念日・こまりごとがなおった → つぎの朝にとどく・その子の言いかた・くりかえさない・もちもの・思い出帳 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;USERPAUSE=true;const out={};const a=S.res[0];
    S.letters=[];S.letterQ=[];letterQ(a,'mate','ホノ');letterQ(a,'mate','ホノ');out.q=S.letterQ.length;out.mateTx=S.letterQ[0].tx.join('');
    letterMorning();out.sameDay=(S.letters||[]).length;S.t+=1440;letterMorning();out.got=S.letters.length;out.unread=letterUnread();out.qLeft=S.letterQ.length;
    /* 同じ子・同じしゅるいは、ちがう文から */const seen=new Set();for(let i=0;i<3;i++){S.letterQ=[];letterQ(a,'anniv',30);seen.add(S.letterQ[0].tx[0])}out.fresh=seen.size;
    /* こまりごとがなおった・記念日のきっかけ */S.letterQ=[];S.trouble={id:a.id,k:'dark',d:dayNo()};const D=TROUBLE.dark,ok0=D.ok;D.ok=()=>false;/* ok は「まだこまっている」 */TRBT=4;troubleTick();D.ok=ok0;out.thx=S.letterQ.some(q=>q.k==='thx'&&q.id===a.id);
    /* もちもの：手紙のわく、タップで読む */openSheet('inv');const slot=[...document.querySelectorAll('.sheet .slot')].find(b=>b.textContent.includes('手紙'));out.slot=!!slot;slot.click();const pc=document.querySelector('.pxcard');out.paper=pc&&pc.textContent;pc.querySelector('.x').click();out.read=S.letters[0].read;closeSheet();
    /* 思い出帳 */openSheet('menu','record');out.rec=[...document.querySelectorAll('.sheet h3')].some(e=>e.textContent==='手紙');closeSheet();
    /* 思い出の場面では書かない */const Q0=S.letterQ.length;S.free=true;letterQ(a,'thx','');S.free=false;out.free=S.letterQ.length-Q0;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.q,1,'同じきっかけは1通');assert.ok(r.mateTx.includes('ホノ'),r.mateTx);assert.equal(r.sameDay,0,'その日にはとどかない');assert.equal(r.got,1);assert.equal(r.unread,1);assert.equal(r.qLeft,0);
  assert.equal(r.fresh,3);assert.equal(r.thx,true);assert.equal(r.slot,true);assert.ok(r.paper.includes('守り神さまへ')&&r.paper.includes('より'),r.paper);assert.equal(r.read,1);assert.equal(r.rec,true);assert.equal(r.free,0);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
