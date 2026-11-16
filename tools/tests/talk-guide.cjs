/* 「タップして話を聞こう」の案内は、話したそうな吹き出しが出ているときだけ出す（吹き出しの前に出さない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;setMode('look');`);
  const guide=async pre=>JSON.parse(await run(`(()=>{${pre};S.qStory=S.quest;S.flags.talked1=false;updTut();S.qStory=null;return 1})()&&JSON.stringify({show:!$('#tutHand').hidden&&$('#tutHand').textContent.includes('タップして話を聞こう'),ready:(()=>{const r=S.res.find(q=>q.name===TALKW);return r?mainStoryBubbleReady(r)&&!(r.act&&r.act.type==='sleep'):TALKW===GOD?mainStoryBubbleReady():false})()})`));
  /* 吹き出しの出ない、ねている子に TALKW がついている */
  let g=await guide(`const r=S.res[0];TALKW=r.name;r.act={type:'sleep',stage:'do',t:0}`);assert.equal(g.ready,false);assert.equal(g.show,false,'no guide while the bubble is hidden');
  /* ねていなければ、吹き出しと案内がいっしょに出る */
  g=await guide(`const r=S.res[0];r.act=null;TALKW=r.name`);assert.equal(g.show,g.ready,'guide appears exactly when the bubble does');
  console.log('Talk guide: shown only with the talk bubble (ready='+g.ready+')');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
