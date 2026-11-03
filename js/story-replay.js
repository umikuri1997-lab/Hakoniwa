'use strict';
/* 思い出は別フレームで再現する。元の村の状態・予約・会話待ちに触れず、子画面は保存しない。 */
const STORY_REPLAY_QUESTS=['earthListen','earthRoot','fireRoot','fireTrace','waterFilm','waterLeaf','windEcho','windVoices','tower'];
const STORY_REPLAY_EVENTS=[...STORY_REPLAY_QUESTS.map(id=>({key:'quest:'+id,id,kind:'quest'})),
  {key:'event:e16',id:'e16',kind:'event',title:'御神木を守る仲間たち'},
  {key:'event:e15',id:'e15',kind:'event',title:'フタバが仲間を守る'},
  {key:'event:e16g',id:'e16g',kind:'event',title:'守り神へ受け継ぐ力'},
  {key:'event:e09',id:'e09',kind:'event',title:'最後のかけらを、みんなで'},
  {key:'reunion',kind:'reunion',title:'ヌシ様との再会'},
  {key:'quiet',kind:'quiet',title:'再会のあと、木陰で'}];
function storyReplayTitle(e){return e.title||QUESTS1.find(q=>q.id===e.id)?.text||'物語の思い出';}
function availableStoryReplays(state=S){
  if(!state||state.free||(state.world||0)!==0)return [];
  return STORY_REPLAY_EVENTS.filter(e=>{
    if(e.kind==='quest'){const i=QUESTS1.findIndex(q=>q.id===e.id);return i>=0&&(state.cleared||state.quest>i)&&state.qStory!==i;}
    if(e.kind==='event')return !!state.sev?.[e.id];
    return e.kind==='reunion'?!!state.cleared:!!state.flags?.sacredQuietSeen;
  });
}
function appendStoryReplays(body){
  if(!S||S.free||WD!==0)return;
  const sec=el('<div class="sec"><h3>物語を見返す</h3><p class="note">動きやカメラも見返せます。村の時間・進行・報酬は変わりません。</p><div class="rows"></div></div>'),list=sec.querySelector('.rows'),episodes=availableStoryReplays();
  if(!episodes.length)list.appendChild(el('<p class="note">物語を進めると、ここで見返せます。</p>'));
  for(const e of episodes){const b=el('<button class="btn" style="width:100%;text-align:left"></button>');b.textContent='▶ '+storyReplayTitle(e);b.dataset.storyReplay=e.key;b.onclick=()=>openStoryReplay(e.key);list.appendChild(b);}
  body.appendChild(sec);
}
let STORY_REPLAY_SHELL=null;
function openStoryReplay(key){
  const episode=availableStoryReplays().find(e=>e.key===key);if(!episode||STORY_REPLAY_SHELL)return false;
  const owner=S,nonce=crypto.randomUUID(),oldFocus=document.activeElement,audio=AC?.state==='running';
  const shell=el('<div role="dialog" aria-modal="true" aria-label="物語の再生" style="position:fixed;inset:0;z-index:100;background:#faf3e3;display:flex;flex-direction:column;overflow:clip"><div style="min-height:54px;flex-shrink:0;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;box-sizing:border-box"><b></b><button class="btn">思い出帳へ戻る</button></div><iframe title="物語の再生" style="border:0;width:100%;flex:1;min-height:0" allow="autoplay"></iframe></div>');
  shell.querySelector('b').textContent=storyReplayTitle(episode);const frame=shell.querySelector('iframe'),actors=[...(S.res||[]),...(S.lost||[]),...(S.buried||[])].map(r=>({name:r.name,elem:r.elem,vr:r.vr}));
  const close=()=>{if(STORY_REPLAY_SHELL!==shell)return;window.removeEventListener('message',message);window.removeEventListener('keydown',escape);frame.src='about:blank';shell.remove();STORY_REPLAY_SHELL=null;if(audio&&AC&&!document.hidden)AC.resume().catch(()=>{});if(oldFocus?.isConnected)oldFocus.focus({preventScroll:true});};
  const escape=e=>{if(e.key==='Escape'){e.preventDefault();close();}};
  const message=e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.token!==nonce)return;if(e.data.type==='story-replay-ready')frame.contentWindow.postMessage({type:'story-replay-start',token:nonce,key,actors,sound:{bgm:SND.bgm,sfx:SND.sfx}},location.origin);if(e.data.type==='story-replay-close')close();};
  shell.querySelector('button').onclick=close;window.addEventListener('message',message);window.addEventListener('keydown',escape);STORY_REPLAY_SHELL=shell;document.body.appendChild(shell);
  if(audio)AC.suspend().catch(()=>{});
  const url=new URL(location.href);url.searchParams.set('storyReplay',key);url.searchParams.set('replayToken',nonce);url.hash='';frame.src=url.href;
  // 通常は思い出帳から開く。別の導線から呼んだ場合も、元の村を止めておく。
  if(sheet==null&&S===owner)openSheet('menu','record');return true;
}
let STORY_REPLAY_RUN=null;
function replayControls(run){
  const bar=el('<div style="position:fixed;bottom:12px;left:12px;right:12px;z-index:60;display:flex;justify-content:space-between;gap:8px"><button class="btn" aria-pressed="false">自動送り：オフ</button><button class="btn">再生を終える</button></div>');
  const [auto,close]=bar.querySelectorAll('button');auto.onclick=()=>{run.auto=!run.auto;auto.textContent='自動送り：'+(run.auto?'オン':'オフ');auto.setAttribute('aria-pressed',String(run.auto));};close.onclick=()=>parent.postMessage({type:'story-replay-close',token:run.token},location.origin);document.body.appendChild(bar);
}
function prepareStoryReplay(run,payload){
  if(payload.sound)Object.assign(SND,{bgm:payload.sound.bgm!==false,sfx:payload.sound.sfx!==false});
  const e=run.episode,at=STORY_REPLAY_QUESTS.indexOf(e.id),count=e.kind!=='quest'?5:at<2?2:at<4?3:at<6?4:5;
  setWorld(0);S=newState(0);LIVE[0]=S;S.introSeen=true;S.flags.minaCame=true;S.enemyOn=false;S.t=720;S.hold=0;S.speed=1;S.food=100;S.godShown=true;S.godGone=false;
  S.feat={build:true,plant:true,craft:true,summon:true,people:true};S.sacredRoot=(CY-3)*W+CX-2;S.fieldSites={root:S.sacredRoot};const x=S.sacredRoot%W,y=S.sacredRoot/W|0;
  for(let yy=y-9;yy<=y+10;yy++)for(let xx=x-9;xx<=x+10;xx++){const j=yy*W+xx;S.obj[j]='';S.floor[j]='';S.ground[j]=0;S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}
  const names=[POKO,MINA,FIXK0.fire,FIXK0.water,FIXK0.wind],elems=['wood','earth','fire','water','wind'],spots=[[-2.5,3.5],[4.5,3.5],[-2.5,5.5],[.5,6.5],[3.5,5.5]];
  S.res=names.slice(0,count).map((name,i)=>{const r=mkRes(S,name,elems[i],x+spots[i][0],y+spots[i][1]);const original=payload.actors?.find(a=>a.name===name&&a.elem===r.elem);if(original?.vr)r.vr=JSON.parse(JSON.stringify(original.vr));r.energy=100;r.hunger=hMax(r);r.fun=90;return r;});
  S.fieldStories={};for(const id of STORY_REPLAY_QUESTS.slice(0,e.kind==='quest'?at:9))S.fieldStories[id]={step:FIELD_STORIES[id].length};
  S.quest=QUESTS1.findIndex(q=>q.id===(e.kind==='quest'?e.id:'nushi'));S.qStory=null;S.qTalked=e.kind!=='quest';S.flags.nushiAlive=e.kind!=='quest'||at>=8;
  S.sev=Object.fromEntries(SEV1.map(v=>[v.k,1]));S.sevP=[];S.sevQ=[];S.spotSeen=Object.fromEntries(SPOTS.map(v=>[v.k,1]));
  recount();if(e.kind!=='quest'){growStoryTree();S.setSh=e.kind==='reunion'||e.kind==='quiet'?3:2;S.shards=3;S.replayMature=true;S.flags.finalWon=e.id!=='e16'&&e.id!=='e15';S.flags.areaSkill=e.id!=='e16g';S.flags.sh_boss=true;}
  if(e.id==='e15'){
    const positions=[[.5,5.5],[-1.5,5.5],[3,6],[.5,7.5],[-1.5,7.5]];S.res.forEach((r,i)=>{r.x=x+positions[i][0];r.y=y+positions[i][1];r.face=1;});
    const d=EN.boss2,enemy={id:S.nid++,type:'boss2',x:x+8.5,y:y+9.5,hp:d.hp,max:d.hp,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false};S.enemies=[enemy];S.ns={final:true,n:1,kill:0};EV.set(enemy,{x:enemy.x,y:enemy.y,back:false,f:-1,mv:0});
  }
  if(e.kind==='quiet'){S.cleared=true;S.flags.sacredReunion=true;S.flags.sacredQuietSeen=false;S.nushi={x:storyTreeX(S.sacredRoot)+2.2,y:storyTreeY(S.sacredRoot)+.95,t:6,app:1,dir:0,face:-1,path:[]};}
  USERPAUSE=true;NOSAVE=true;started=true;window.__noIdle=true;
  for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])$(id).hidden=true;showUI(true);cam.z=homeZ();centerOn(storyTreeX(S.sacredRoot)*TS,storyTreeY(S.sacredRoot)*TS);
  const style=document.createElement('style');style.textContent='#topUI,#botUI,#helpPop,#hand,#idle{display:none!important}#cv{pointer-events:none}';document.head.appendChild(style);
  const nativeCheckQuest=checkQuest;checkQuest=()=>{if(run.running)nativeCheckQuest();};checkLevel=()=>{};checkSev=()=>{};finalCheck=()=>{};updTut=()=>{};showItemGift=()=>{};showSpotPop=()=>{};openSheet=()=>{};
  replayControls(run);
}
function replayReadyActors(){for(const r of S.res){endAct(r);delete r.storyWaitHome;RHOLD.delete(r);r.hunger=hMax(r);r.energy=100;r.carry=null;r.cmat=null;r.meal=null;r.cing=null;}}
async function waitStoryReplay(run,condition){while(STORY_REPLAY_RUN===run&&!run.cancelled){if(condition())return;await new Promise(r=>setTimeout(r,80));}throw Error('replay cancelled');}
async function playStoryReplay(run){
  const e=run.episode;let last=performance.now();run.running=true;
  run.tick=setInterval(()=>{
    if(STORY_REPLAY_RUN!==run||run.cancelled)return;const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;
    if($('#dialog').hidden&&!sacredQuietActive()){for(const r of S.res){if(!r.act){tryMainStoryWait(r);if(!r.act)tryEarthIntro(r);}if(r.act&&['fieldintro','fieldstory','fieldassist','fieldwait','storywait','storyreturn','nmeet','sevreact'].includes(r.act.type))updRes(r,dt*MIN_PER_SEC);}checkQuest();}
    else if(run.auto&&DLGA.n>=DLGA.full.length&&now>=DLGA.holdUntil&&now>=DLGA.readReady&&!sacredMotionPending()&&now-DLGA.lineT>=Math.max(1700,DLGA.full.length*85+800)){const b=$('#dlgBtns button');if(b&&!b.disabled)b.click();}
  },33);
  try{
    if(e.kind==='quest'){
      checkQuest();await waitStoryReplay(run,()=>!!earthIntroSpeaker(QUESTS[S.quest]));DLGTAP=performance.now();startTalk();await waitStoryReplay(run,()=>S.qTalked);
      for(let phase=0;phase<FIELD_STORIES[e.id].length;phase++){replayReadyActors();DLGTAP=performance.now();const j=S.sacredRoot;fieldStoryTap(j%W,j/W|0);await waitStoryReplay(run,()=>fieldStoryState(e.id).step>phase);}
      await waitStoryReplay(run,()=>S.qStory!=null);await waitStoryReplay(run,()=>TALKW===GOD?mainStoryBubbleReady():!!TALKW&&mainStoryBubbleReady(S.res.find(r=>r.name===TALKW)));DLGTAP=performance.now();startTalk();await waitStoryReplay(run,()=>S.qStory==null);
    }else if(e.kind==='reunion'){DLGTAP=performance.now();nushiReturns();await waitStoryReplay(run,()=>S.cleared);}
    else if(e.kind==='quiet'){DLGTAP=performance.now();nushiTalk();await waitStoryReplay(run,()=>S.flags.sacredQuietSeen);}
    else{
      const event=SEV1.find(v=>v.k===e.id);S.sev[e.id]=0;S.t=e.id==='e15'?1440:e.id==='e16'?1320:480;
      if(['e16','e09'].includes(e.id)){S.sevP=[e.id];if(!sevBegin(event,sevLines(event.L)))throw Error('集合できませんでした');await waitStoryReplay(run,()=>!!SEV_ENCOUNTERS.get(S)?.ready);const enc=SEV_ENCOUNTERS.get(S);SEVW[enc.speaker.name]=e.id;DLGTAP=performance.now();sevTalk(e.id);}
      else{DLGTAP=performance.now();playDirectStoryEvent(event,sevLines(event.L));}
      await waitStoryReplay(run,()=>S.sev[e.id]===1);
    }
    run.finished=true;run.running=false;clearInterval(run.tick);
    const end=el('<div class="replay-end" style="position:fixed;inset:20% 10%;z-index:61;background:#fff8e9;border:2px solid #d4c29a;border-radius:18px;padding:22px;display:flex;flex-direction:column;justify-content:center;gap:16px;text-align:center"><b>再生がおわりました</b><button class="btn">もう一度</button><button class="btn">思い出帳へ戻る</button></div>');
    const [again,close]=end.querySelectorAll('button');again.onclick=()=>location.reload();close.onclick=()=>parent.postMessage({type:'story-replay-close',token:run.token},location.origin);document.body.appendChild(end);
  }catch(error){run.running=false;clearInterval(run.tick);if(!run.cancelled){run.error=String(error);toast('再生を続けられませんでした。思い出帳へ戻れます','warn');}}
}
function bootStoryReplayPage(){
  const params=new URLSearchParams(location.search),token=params.get('replayToken'),key=params.get('storyReplay'),episode=STORY_REPLAY_EVENTS.find(e=>e.key===key);
  if(parent===window||!token||!episode){$('#tStart').textContent='思い出帳から開いてください';$('#tStart').disabled=true;return;}
  const receive=async event=>{
    if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='story-replay-start'||event.data.token!==token||event.data.key!==key||STORY_REPLAY_RUN)return;
    const run={token,episode,auto:false,running:false,cancelled:false,finished:false};STORY_REPLAY_RUN=run;prepareStoryReplay(run,event.data);
    await waitStoryReplay(run,()=>stageReady());
    const start=el('<div class="replay-start" style="position:fixed;inset:12% 8%;z-index:62;border:2px solid #d4c29a;border-radius:18px;background:#fff8e9;padding:24px;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:18px"><b></b><p>村の進行を変えずに、物語を見返します。</p><button class="btn pri">再生をはじめる</button></div>');start.querySelector('b').textContent=storyReplayTitle(episode);start.querySelector('button').onclick=()=>{audioInit();start.remove();playStoryReplay(run);};document.body.appendChild(start);
  };
  window.addEventListener('message',receive);window.addEventListener('pagehide',()=>{if(STORY_REPLAY_RUN){STORY_REPLAY_RUN.cancelled=true;clearInterval(STORY_REPLAY_RUN.tick);}});
  parent.postMessage({type:'story-replay-ready',token},location.origin);
}
