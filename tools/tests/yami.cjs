/* 闇のステージの土台：はじめはだれもいない・ずっと夜・まもりの光からトモリが生まれる・トモリのまわりは歩くあかり・時計は止まらない・光は神殿で呼べない・セーブして読みなおせる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:5});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    out.wd=WD;out.res0=S.res.length;out.quests=QUESTS.map(q=>q.id);out.q0=QUESTS[S.quest].id;out.keys=ELEM_KEYS.includes('light');
    /* ずっと夜：昼の12時でも夜の暗さ。空の時刻は真夜中 */S.t=Math.floor(S.t/1440)*1440+12*60;S.hold=0;out.dark=darkness();out.sky=skyHour();out.hour=Math.round(hour());out.night=isNight();
    /* だれもいなくても、1コマ進めて描ける */stepWorld(.5);render(performance.now());
    /* 時計は18時で止まらない */S.t=Math.floor(S.t/1440)*1440+17*60+50;S.hold=0;for(let i=0;i<40;i++)stepWorld(1);out.hour2=hour()>18;
    S.t=Math.floor(S.t/1440)*1440+10*60;S.hold=0;
    /* まもりの光が地面にとどくと、トモリが生まれる（1回だけ） */glHit(CX+2,CY+2,0);out.res1=S.res.length;const t=S.res[0];out.name=t.name;out.elem=t.elem;out.flag=S.flags.tomori;glHit(CX+4,CY+2,0);out.res2=S.res.length;
    out.near=Math.hypot(t.x-CX-2.5,t.y-CY-2.5)<7;out.stat=[EL_BASE.light.work,EL_BASE.light.move,EL_BASE.light.sta];out.key=isKey(t.name);
    /* トモリのまわり4マスは、あかり */out.lit=lightAt(t.x+3.5,t.y);out.unlit=lightAt(t.x+4.5,t.y);
    /* 光は、神殿で呼べない・たたかえない */out.cands=sumCands().map(c=>c.el).includes('light');out.sortie=sortieOK(t);
    /* 描ける（かりの絵：水の形を色がえ） */for(let i=0;i<5;i++){stepWorld(.3);render(performance.now())}out.art=spArt('light');
    /* 目標：トモリが生まれたら、つぎは神殿 */checkQuest();out.story=S.qStory!=null||TALKW===TOMORI;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.wd,5);assert.equal(r.res0,0);assert.deepEqual(r.quests.slice(0,2),['tomori','statue']);assert.equal(r.q0,'tomori');assert.equal(r.keys,false);
  assert.ok(r.dark>=.5);assert.equal(r.sky,0);assert.equal(r.hour,12);assert.equal(r.night,false);assert.equal(r.hour2,true);
  assert.equal(r.res1,1);assert.equal(r.name,'トモリ');assert.equal(r.elem,'light');assert.equal(r.flag,1);assert.equal(r.res2,1);assert.equal(r.near,true);assert.deepEqual(r.stat,[20,20,20]);assert.equal(r.key,true);
  assert.equal(r.lit,true);assert.equal(r.unlit,false);assert.equal(r.cands,false);assert.equal(r.sortie,false);assert.equal(r.art,'water');assert.equal(r.story,true);
  /* お話を聞いて、神殿を直す → くらしの道具をもらう */
  const r2=JSON.parse(await run(`(async()=>{const out={};const W8=ms=>new Promise(f=>setTimeout(f,ms));
    for(let i=0;i<60&&S.quest===0;i++){checkQuest();if(S.qStory!=null&&document.querySelector('#dialog').hidden&&typeof questTalkTap==='function')questTalkTap();const d=document.querySelector('#dialog');if(!d.hidden)d.click();await W8(120)}
    out.quest=S.quest;return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r2));
  /* セーブして読みなおす */
  const r3=JSON.parse(await run(`(()=>{const out={};save();const d=load(5);out.saved=!!d&&d.world===5;continueGame(d);out.wd=WD;out.n=S.res.length;out.el=S.res[0].elem;render(performance.now());return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r3));assert.equal(r3.saved,true);assert.equal(r3.wd,5);assert.equal(r3.n,1);assert.equal(r3.el,'light');
  /* コワイノの来かた：トモリが生まれたら来はじめる・6時〜23時は1時間ごとに25%で1〜2ひき・朝6時に消えない・なかまはたたかう */
  const r4=JSON.parse(await run(`(()=>{const out={};document.querySelector('#dialog').hidden=true;const q0=Math.random,day=Math.floor(S.t/1440)*1440;out.on=S.enemyOn;S.enemies=[];S.hold=0;
    Math.random=()=>.1;yamiTick(9.99,10.01);out.n1=S.enemies.length;yamiTick(10.2,10.4);out.same=S.enemies.length;
    Math.random=()=>.6;yamiTick(10.99,11.01);out.miss=S.enemies.length;
    let c=0;Math.random=()=>(c++?.9:.1);yamiTick(11.99,12.01);out.n2=S.enemies.length-out.miss;
    Math.random=()=>.1;yamiTick(22.99,23.01);yamiTick(2.99,3.01);yamiTick(5.5,5.99);out.nightNo=S.enemies.length-out.miss-out.n2;yamiTick(5.99,6.01);out.six=S.enemies.length-out.miss-out.n2;Math.random=q0;
    out.type=S.enemies.every(e=>e.type==='basic');
    /* 朝6時：のこったコワイノは消えない */S.enemies=[{id:S.nid++,type:'basic',x:CX+.5,y:CY+9.5,hp:100,max:100,delay:0,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false}];S.nightHad=true;S.lastMorning=Math.floor((day+1440)/1440);S.t=day+1440+5*60+59;Math.random=()=>.9;/* 6時の小さな群れは、ここでは出さない */for(let i=0;i<6;i++)stepWorld(.5);Math.random=q0;out.h=hour()>=6;out.left=S.enemies.filter(e=>!e.dead).length;out.had=S.nightHad;
    /* ぜんぶ追いはらったあとの朝は、かたづく */S.enemies=[{id:S.nid++,type:'basic',x:CX+.5,y:CY+9.5,hp:0,max:100,delay:0,spawned:true,dead:1,path:[],repath:0,atk:0,stun:0,flash:0,flee:false}];S.nightHad=true;S.t=day+2880+5*60+59;S.lastMorning=Math.floor((day+2880)/1440);Math.random=()=>.9;for(let i=0;i<6;i++)stepWorld(.5);Math.random=q0;out.clean=S.enemies.length;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r4));
  assert.equal(r4.on,true);assert.equal(r4.n1,1);assert.equal(r4.same,1);assert.equal(r4.miss,1);assert.equal(r4.n2,2);assert.equal(r4.nightNo,0);assert.equal(r4.six,1);assert.equal(r4.type,true);
  assert.equal(r4.h,true);assert.equal(r4.left,1);assert.equal(r4.had,false);assert.equal(r4.clean,0);
  /* トモリは、コワイノにねらわれない・たたかれない（さいごの夜の「むかえる」「ゆりかごへ」だけは、ねらわれる） */
  const r5=JSON.parse(await run(`(()=>{const out={};document.querySelector('#dialog').hidden=true;const t=S.res.find(r=>r.name===TOMORI);t.hidden=false;t.act=null;t.hunger=400;const day=Math.floor(S.t/1440)*1440;S.t=day+10*60;S.hold=0;
    const e={id:S.nid++,type:'basic',x:t.x+.8,y:t.y,hp:100,max:100,delay:0,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false,slow:1};S.enemies=[e];
    S.nightHurt=0;hitRes(e,t,EN.basic);out.direct=t.hunger;for(let i=0;i<40;i++)stepWorld(.5);out.after=S.nightHurt===0&&!(t.hurt>0);out.tg=e.tg===t.id;out.safe=yamiSafe(t);
    const Y=yamiState(),p0=Y.ph;Y.ph='go';out.go=yamiSafe(t);Y.ph='meet';out.meet=yamiSafe(t);Y.ph=p0;S.enemies=[];return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r5));assert.equal(r5.direct,400);assert.equal(r5.after,true);assert.equal(r5.tg,false);assert.equal(r5.safe,true);assert.equal(r5.go,false);assert.equal(r5.meet,false);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
