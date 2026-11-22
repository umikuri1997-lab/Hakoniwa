/* 闇のステージのお話の前半：あかり → ヒイロ（はじめに来る火のせいれい）→ ヨリ（夜、トモリのそばの影）→ 夜の仕事のあと3つ → あさやけ（ヨリが朝の光で消える）。朝の空が段階ごとに明るくなる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:5});
  await run(`window.__step=async(id)=>{for(let k=0;k<300;k++){if(typeof id==='function'?id():qDone(id))return;const h=hour();if(h<7||h>21){S.t=Math.floor(S.t/1440)*1440+(h>21?1440:0)+9*60;S.hold=0}stepWorld(.5);checkQuest();if(TALKW&&document.querySelector('#dialog').hidden){startTalk()}await __dlg(20)}};window.__dlg=async(max)=>{const W8=ms=>new Promise(f=>setTimeout(f,ms));for(let i=0;i<(max||80);i++){if(typeof sheet!=='undefined'&&sheet!=null)closeSheet();/* 朝の日記の紙をとじる */const d=document.querySelector('#dialog');if(d.hidden){await W8(30);if(document.querySelector('#dialog').hidden)return;continue}const bs=[...document.querySelectorAll('#dlgBtns button')].filter(b=>b.offsetParent!==null);try{DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0}catch(e){}if(bs.length)bs[0].click();await W8(30)}}/* 会話を送る（自動プレイと同じ） */`);
  const r=JSON.parse(await run(`(async()=>{const out={};document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const day0=Math.floor(S.t/1440)*1440;S.t=day0+10*60;S.hold=0;
    glHit(CX+2,CY+2,0);await __dlg();
    /* 神殿のあとまで進める */const qi=id=>questIndexOf(id);S.quest=qi('akari');S.qTalked=true;S.qStory=null;S.feat.summon=true;
    const dk=h=>{S.t=day0+h*60;S.hold=0;return darkness()};out.sky0=yamiSky();out.dark0=dk(6.5);
    /* あかり3つ */let n=0;for(let j=(CY+4)*W+CX-6;n<3;j++){if(walk(j)&&!S.obj[j]&&!S.floor[j]){S.obj[j]='torch';n++}}recount();out.light=CN(LIGHTQ);
    dk(12);await __step('akari');out.akari=qDone('akari');out.sky1=yamiSky();out.dark1=dk(6.5);dk(12);
    /* ヒイロ：はじめに来るのは火のせいれい */await __step(()=>qAt('hiiro'));out.hTalk=qAt('hiiro');recount();out.elem=sumElem();S.summon={elem:'fire'};doSummon();out.hiiro=S.res.some(x=>x.name===HIIRO);out.key=isKey(HIIRO);
    NEWRES=null;NEWQ.length=0;await __step('hiiro');out.hiiroDone=qDone('hiiro');
    /* ヨリ：昼は見えない、夜はトモリのとなり */await __step(()=>qAt('yori'));out.yTalk=qAt('yori');const t=S.res.find(x=>x.name===TOMORI);out.dayYori=!!yoriPos();dk(23.5);const p=yoriPos();out.nightYori=!!p&&Math.abs(p.x-t.x-.9)<.01;if(!p){out.q=QUESTS[S.quest].id;out.qs=S.qStory;out.qt=S.qTalked;out.night=isNight();return JSON.stringify(out)}
    render(performance.now());DLGTAP=performance.now();out.tap=yamiTap(p.x,p.y);for(let i=0;i<60&&!S.flags.yoriMet;i++)await __dlg();out.met=!!S.flags.yoriMet;/* タップで始める会話は、またずにすぐ出る（DLGTAP は onTap が入れる） */
    dk(12);await __step('yori');out.yoriDone=qDone('yori');
    /* 夜の仕事のあと：昼、ヨリがまだ見ていないあとで待つ。3つ見ると、闇のせいれいのことがわかる */await __step(()=>qAt('shigoto'));out.sTalk=qAt('shigoto');out.marks=yamiMarks().length;const seen=[];
    for(let i=0;i<3;i++){const m=yamiNextMark(),q=yoriPos();seen.push(m.k+':'+(!!q&&Math.abs(q.x-(m.j%W+.5+.7))<.01));DLGTAP=performance.now();const ok=yamiTap(m.j%W+.5,((m.j/W)|0)+.5);await __dlg();if(!ok||!m.seen)break}
    out.seen=seen;out.nSeen=yamiMarksSeen();render(performance.now());await __step('shigoto');out.shigoto=qDone('shigoto');out.sky3=yamiSky();
    /* あさやけ：聞いたつぎの朝6時。ヨリが消えて、空は本当の朝に */await __step(()=>qAt('asayake'));out.aTalk=qAt('asayake');S.t=Math.floor(S.t/1440)*1440+1440+5*60+59.5;S.hold=0;const q0=Math.random;Math.random=()=>.9;for(let i=0;i<8&&!YDAWN;i++)stepWorld(.5);Math.random=q0;out.scene=!!YDAWN;
    let fadeSeen=false;for(let i=0;i<120&&!S.flags.asayake;i++){await __dlg(5);if(YDAWN&&YDAWN.f&&(yoriPos()||{a:1}).a<1)fadeSeen=true;await new Promise(f=>setTimeout(f,100))}out.fade=fadeSeen;out.asayake=!!S.flags.asayake;out.gone=!yoriPos();out.sky4=yamiSky();out.skyH=yamiSkyHour(6.5);out.darkDawn=dk(6.5);out.darkNoon=dk(12);
    await __step('asayake');out.done=qDone('asayake');out.dbg=[S.quest,QUESTS.length,S.qStory,String(TALKW),String(QUESTCLEARW),hour(),!document.querySelector('#dialog').hidden,typeof sheet!=='undefined'&&sheet];
    /* セーブして読みなおしても、すすみがのこる */save();continueGame(load(5));out.reload=[qDone('shigoto'),!!S.flags.asayake,yamiMarksSeen()];
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.sky0,0);assert.equal(r.light,3);assert.equal(r.akari,true);assert.equal(r.sky1,1);assert.ok(r.dark1<r.dark0,'朝の空が明るくなる');
  assert.equal(r.hTalk,true);assert.equal(r.elem,'fire');assert.equal(r.hiiro,true);assert.equal(r.key,true);assert.equal(r.hiiroDone,true);
  assert.equal(r.yTalk,true);assert.equal(r.dayYori,false);assert.equal(r.nightYori,true);assert.equal(r.tap,true);assert.equal(r.met,true);assert.equal(r.yoriDone,true);
  assert.equal(r.sTalk,true);assert.equal(r.marks,3);assert.deepEqual(r.seen,['nedoko:true','uzumi:true','toguchi:true']);assert.equal(r.nSeen,3);assert.equal(r.shigoto,true);assert.equal(r.sky3,3);
  assert.equal(r.aTalk,true);assert.equal(r.scene,true);assert.equal(r.fade,true,'ヨリがうすれて消える');assert.equal(r.asayake,true);assert.equal(r.gone,true);assert.equal(r.sky4,4);assert.equal(r.skyH,6.5);assert.ok(r.darkDawn<r.darkNoon);assert.equal(r.done,true);
  assert.deepEqual(r.reload,[true,true,3]);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
