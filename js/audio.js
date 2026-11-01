'use strict';


/* ---------- おと（BGM・効果音はWeb Audioで鳴らすオリジナル） ---------- */
const SND={bgm:true,sfx:true};try{Object.assign(SND,JSON.parse(KV.getItem('hakoniwa-sound')||'{}'))}catch(e){}
const saveSnd=()=>{try{KV.setItem('hakoniwa-sound',JSON.stringify(SND))}catch(e){}};
let bgmF=null,bgmSw=0,AC=null,bgmG=null,sfxG=null,noiseBuf=null,curSong='day',wantSong='day',nextT=0,step=0;
const mf=m=>440*Math.pow(2,(m-69)/12);
// [音, 長さ(8分音符)]。0は休み
const SONGS={
  opening:{bpm:78,lead:'triangle',chords:[[48,[60,64,67]],[43,[55,59,62]],[45,[57,60,64]],[41,[53,57,60]]],
    mel:[[72,4],[76,4],[79,4],[84,4],[83,4],[79,4],[76,4],[74,4],[72,4],[76,4],[81,4],[79,4],[76,4],[74,4],[72,8]]},
  day:{bpm:92,lead:'triangle',chords:[[48,[60,64,67]],[45,[57,60,64]],[41,[53,57,60]],[43,[55,59,62]]],
    mel:[[76,2],[79,2],[81,2],[79,2],[76,2],[74,1],[72,1],[74,4],[72,2],[74,2],[76,2],[81,2],[79,6],[0,2],
         [76,2],[79,2],[84,2],[81,2],[79,2],[76,2],[74,2],[76,2],[72,2],[69,2],[72,2],[74,2],[72,6],[0,2]]},
  night:{bpm:66,lead:'sine',chords:[[45,[57,60,64]],[41,[53,57,60]],[48,[55,60,64]],[43,[55,59,62]]],
    mel:[[69,4],[72,2],[76,2],[74,6],[0,2],[72,2],[74,2],[76,4],[74,4],[71,4],
         [69,2],[72,2],[76,2],[81,2],[79,4],[76,4],[74,4],[71,4],[69,6],[0,2]]},
};
for(const k in SONGS){const g=SONGS[k];g.at=new Array(64).fill(null);let p=0;for(const[m,l]of g.mel){if(m)g.at[p%64]=[m,l];p+=l}}
const SAMPLES={"bell":["assets/g/cb9ff20140.mp3"],"pat":["assets/g/e2b825e14e.mp3"],"voice":["assets/g/fc5ad15d4b.mp3"],"paper":["assets/g/b7b70de2d3.mp3"],"night":["assets/g/b8fa05062a.mp3"],"chop":["assets/g/1d86cabda1.mp3","assets/g/676cf2fa6d.mp3","assets/g/a8dd704564.mp3"],"dig":["assets/g/56f3308409.mp3"],"splash":["assets/g/05adadaa1c.mp3"],"cast":["assets/g/93da972520.mp3"],"nail":["assets/g/b121a3b6b8.mp3"],"bush":["assets/g/3c69ed59fd.mp3"],"bubble":["assets/g/3dae9cab95.mp3"],"catch":["assets/g/269701117d.mp3"],"box":["assets/g/8c8eeb8b61.mp3"],"fire":["assets/g/e8ad50e6e8.mp3"],"boil":["assets/g/55a7541497.mp3"],"rain":["assets/g/7178ec736f.mp3"],"birds":["assets/g/c0eec144c6.mp3"]};const SBUF={};
Object.assign(SAMPLES,{"mine":["assets/g/ba69ed4c76.mp3"]});
Object.assign(SAMPLES,{"gravel":["assets/g/1367715265.mp3"],"wdon":["assets/g/6e3c4c3694.mp3"],"arrow": ["assets/g/4020d45f73.mp3"], "bush2": ["assets/g/0f9eb4e9b6.mp3"], "door": ["assets/g/02047b788c.mp3"], "kill": ["assets/g/c3aac5194a.mp3"], "munch": ["assets/g/83541e7fe0.mp3"], "nail2": ["assets/g/f10fe51343.mp3"], "pick": ["assets/g/443dd77412.mp3"], "place": ["assets/g/c75dd30fa4.mp3"], "punch": ["assets/g/5124e82f60.mp3"], "shoot": ["assets/g/8c1be13e0e.mp3"], "trickle": ["assets/g/017cf8add7.mp3"], "wallbreak": ["assets/g/43e010b66b.mp3"], "wave": ["assets/g/241549ec96.mp3"]});/* 効果音ラボ（ユーザー提供） */
SAMPLES.shard=['assets/g/9464bc7161.mp3'];/* ヌシのかけらをはめる音（ユーザーの音） */
SAMPLES.furniturePlace=['assets/g/e33cbd97b8.mp3'];/* 家具を置く音：ユーザー提供 */
SAMPLES.matDrop=['assets/g/ef846d878d.mp3'];/* 守りの光で木・岩をこわして、素材が落ちたときの音（もらった音） */
function loadSamples(){/* 音のファイル（assets/g/*.mp3）を読みこんで、鳴らせる形にしておく */for(const k in SAMPLES){SBUF[k]=[];SAMPLES[k].forEach((u,i)=>{fetch(u).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b,buf=>{SBUF[k][i]=buf},()=>{})).catch(()=>{})})}}
// セリフの声：キャラごとに高さを変える（カミサマは低め）
let VOICE=null,voxC=null;const BRAVET=new WeakMap();
function voiceStart(w,dur){voiceStop();if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF.voice||[])[0];if(!b)return;
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.loop=true;{const sr=S&&S.res&&S.res.find(q=>q.name===w),vb=sr&&sr.vr&&sr.vr.vo;src.playbackRate.value=/ヌシ/.test(w||'')?.55:(w===GOD||w==='？？？')?.78:vb||(KEYVR[w]&&KEYVR[w].vo)||1.12}/* 声の高さは一人ずつちがう */
  {const t=AC.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.8*(SND.vv??1),t+.03)}/* 声の出だしは、ぷつっと大きくならないよう、少しずつ */src.connect(g);g.connect(voxC);src.start(0,Math.random()*b.duration*.5);VOICE={src,g};if(dur)VOICE.end=setTimeout(voiceStop,dur*1000)}
/* みるでタップしたときの「ほにゃ？」：短く、最後が上がる声 */
function voiceHmm(r){voiceStop();if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF.voice||[])[0];if(!b)return;const vo=(r.vr&&r.vr.vo)||1.12,t=AC.currentTime;
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.playbackRate.setValueAtTime(vo*.95,t);src.playbackRate.setValueAtTime(vo*.95,t+.16);src.playbackRate.linearRampToValueAtTime(vo*1.35,t+.36);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.7*(SND.vv??1),t+.03);g.gain.setValueAtTime(.7*(SND.vv??1),t+.3);g.gain.linearRampToValueAtTime(0,t+.42);src.connect(g);g.connect(voxC);src.start(t,Math.random()*b.duration*.5);src.stop(t+.45);VOICE={src,g}}
function voiceStop(){if(!VOICE)return;const v=VOICE;VOICE=null;clearTimeout(v.end);try{const t=AC.currentTime;v.g.gain.setTargetAtTime(0,t,.04);v.src.stop(t+.2)}catch(e){}}
function playSeg(k,vol,dur){if(!AC||!SND.sfx||AC.state!=='running')return false;const L=(SBUF[k]||[]).filter(Boolean);if(!L.length)return false;const b=pick(L),src=AC.createBufferSource(),g=AC.createGain(),t=AC.currentTime;src.buffer=b;const v=vol*SFXV;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.15);g.gain.setValueAtTime(v,t+dur-.3);g.gain.linearRampToValueAtTime(0,t+dur);src.connect(g);g.connect(sfxG);src.start(t,Math.random()*Math.max(0,b.duration-dur));src.stop(t+dur+.05);return true}
let WAVE=null;/* 水浴びの音は1つだけ。水浴びが終わったら止める */
function playWave(vol){if(WAVE||!AC)return;const L=(SBUF.wave||[]).filter(Boolean);if(!L.length)return;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=pick(L);g.gain.value=vol*SFXV;src.connect(g);g.connect(sfxG);const w={src,g};src.onended=()=>{if(WAVE===w)WAVE=null};WAVE=w;src.start()}
function stopWave(){if(!WAVE)return;const{src,g}=WAVE;WAVE=null;try{g.gain.setTargetAtTime(0,AC.currentTime,.12);src.stop(AC.currentTime+.5)}catch(e){}}
function bellRing(x,y){/* 村の鐘：教会の鐘の音を、間をあけて3回。少しずつ小さく、あとの2回は少しだけ低く。遠くても小さく聞こえる */if(!AC||!SND.sfx)return;const L=(SBUF.bell||[]).filter(Boolean);if(!L.length)return;const vw=VW/cam.z,vh=VH/cam.z,d=Math.hypot(x*TS-(cam.x+vw/2),y*TS-(cam.y+vh/2)),v=Math.max(.35,1-d/(Math.max(vw,vh)*1.5));
  [[0,1,1],[1.5,.97,.8],[3,.995,.65]].forEach(([t,rt,g0])=>{const src=AC.createBufferSource(),g=AC.createGain();src.buffer=L[0];src.playbackRate.value=rt;g.gain.value=1.6*g0*v;src.connect(g);g.connect(sfxG);src.start(AC.currentTime+t)})}
function playS(k,vol,dl){const L=(SBUF[k]||[]).filter(Boolean);if(!L.length)return false;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=pick(L);src.playbackRate.value=.92+Math.random()*.16;g.gain.value=vol*SFXV;src.connect(g);g.connect(sfxG);src.start(AC.currentTime+(dl||0));return true}
function audioInit(){
  if(AC){if(AC.state==='suspended')AC.resume().catch(()=>{});return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume().catch(()=>{})}catch(e){return}
  const comp=AC.createDynamicsCompressor();comp.connect(AC.destination);
  bgmG=AC.createGain();bgmG.gain.value=gainB();bgmF=AC.createGain();bgmF.gain.value=1;bgmG.connect(bgmF);bgmF.connect(comp);
  sfxG=AC.createGain();sfxG.gain.value=gainS();sfxG.connect(comp);
  voxC=AC.createDynamicsCompressor();voxC.threshold.value=-38;voxC.ratio.value=12;voxC.knee.value=4;voxC.attack.value=.003;voxC.release.value=.1;voxC.connect(sfxG);/* 声は、大きいところをおさえて、音の大きさをそろえる（声の音の中に、ほかより大きい所があるため） */
  noiseBuf=AC.createBuffer(1,AC.sampleRate*.3,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  nextT=AC.currentTime+.15;setInterval(sched,60);setInterval(ambTick,500);loadSamples();
}
function tone(m,t,dur,type,vol,out,f2){
  const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(typeof m==='number'&&m<200?mf(m):m,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);
}
function noise(t,dur,vol,out,hp){const s=AC.createBufferSource(),g=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=noiseBuf;fl.type='highpass';fl.frequency.value=hp||6000;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.02)}
function stageMusic(){
  curSong=wantSong=isDark()?'night':'day';step=0;bgmSw=0;
  if(!AC)return;
  bgmG.disconnect();bgmG=AC.createGain();bgmG.gain.value=gainB();bgmG.connect(bgmF);
  bgmF.gain.cancelScheduledValues(AC.currentTime);bgmF.gain.setValueAtTime(1,AC.currentTime);
  nextT=AC.currentTime+.01;sched();
}
function sched(){
  if(!AC||AC.state!=='running')return;
  if(nextT<AC.currentTime)nextT=AC.currentTime+.05;
  // 昼夜の曲は、フェードアウト→切り替え→フェードインでつなぐ
  {const now=AC.currentTime;if(wantSong!==curSong&&!bgmSw){bgmSw=now+2.4;bgmF.gain.cancelScheduledValues(now);bgmF.gain.setValueAtTime(bgmF.gain.value,now);bgmF.gain.linearRampToValueAtTime(0,now+2.2)}
   else if(bgmSw&&now>=bgmSw){bgmSw=0;curSong=wantSong;step=0;nextT=now+.05;bgmF.gain.cancelScheduledValues(now);bgmF.gain.setValueAtTime(0,now);bgmF.gain.linearRampToValueAtTime(1,now+3)}}
  while(nextT<AC.currentTime+.3){
    const g=SONGS[curSong],e=60/g.bpm/2,t=nextT,bar=(step/8)|0,ch=g.chords[bar%4],night=curSong==='night',opening=curSong==='opening';
    const n=g.at[step];if(n)tone(n[0],t,n[1]*e*.95,g.lead,opening?.08:night?.09:.075,bgmG);/* マップ画面の曲（opening）：サインだけだとスマホのスピーカーで聞こえないので、三角波でほかの曲と同じくらいの大きさに */
    if(step%8===0)tone(ch[0],t,e*(opening?6:night?7.5:3.6),'triangle',opening?.11:.13,bgmG);
    if(!night&&step%8===4)tone(ch[0]+7,t,e*3.4,'triangle',.1,bgmG);
    if(opening){if(step%8===0)for(const c of ch[1])tone(c,t,e*7.2,'sine',.03,bgmG);if(step%4===2)tone(ch[1][(step>>2)%3]+24,t,e*1.8,'triangle',.025,bgmG)}
    else if(night){if(step%8===0)for(const c of ch[1])tone(c,t,e*7.8,'sine',.025,bgmG);if(step%4===2)tone(ch[1][(step>>2)%3]+12,t,e*1.6,'sine',.02,bgmG)}
    else{tone(ch[1][step%3]+12,t,e*.55,'square',.012,bgmG);if(step%2===1)noise(t,.03,.025,bgmG)}
    nextT+=e;step=(step+1)%64;
  }
}
let ambG=null;const AMB={};
function ambTick(){if(!AC||AC.state!=='running')return;if(!ambG){ambG=AC.createGain();ambG.gain.value=.12;ambG.connect(AC.destination)}
  const want={birds:0,rain:0,night:0};if(S&&started&&SND.sfx&&$('#title').hidden&&$('#maps').hidden){const h=hour();if(S.rain)want.rain=.45;else if(h>=5.5&&h<18)want.birds=1;else if(h>=19||h<5)want.night=1}
  for(const k in want){let a=AMB[k];if(!a){if(!want[k])continue;const b=(SBUF[k]||[])[0];if(!b)continue;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.loop=true;src.loopStart=.06;src.loopEnd=b.duration-.06;g.gain.value=0;src.connect(g);g.connect(ambG);src.start();a=AMB[k]={src,g}}a.g.gain.setTargetAtTime(want[k],AC.currentTime,.8)}}
const lastSfx={};
let SFXV=1;
function sfx(k){
  if(!AC||!SND.sfx||AC.state!=='running')return;const now=AC.currentTime;if(lastSfx[k]&&now-lastSfx[k]<.07)return;lastSfx[k]=now;
  const t=now+.01,o=SFXV!==1?(()=>{const g=AC.createGain();g.gain.value=SFXV;g.connect(sfxG);return g})():sfxG,seq=(ns,gap,type,v,d)=>ns.forEach((m,i)=>tone(m,t+i*gap,d||gap*1.6,type,v,o));
  switch(k){
  case'block':if(playS('wdon',.5))break;tone(260,t,.07,'square',.05,o,520);tone(83,t+.05,.07,'triangle',.06,o);break;
  case'plant':tone(500,t,.1,'triangle',.08,o,950);tone(88,t+.08,.1,'sine',.06,o);break;
  case'furn':seq([72,76,79,84],.06,'triangle',.07);break;
  case'furnPlace':if(playS('furniturePlace',.72))break;seq([72,76,79,84],.06,'triangle',.07);break;
  case'matDrop':if(playS('matDrop',.8))break;tone(520,t,.06,'triangle',.06,o,260);break;
  case'tap':tone(1300,t,.03,'square',.1,o);tone(1950,t+.025,.03,'triangle',.08,o);break;
  case'next':tone(88,t,.04,'triangle',.05,o);break;
  case'good':seq([84,88],.07,'sine',.06);break;
  case'warn':seq([62,57],.14,'square',.035,.22);break;
  case'quest':seq([72,76,79,84,79,84],.09,'triangle',.08,.16);break;
  case'level':seq([67,72,76,79],.09,'triangle',.08,.16);[72,76,79,84].forEach(m=>tone(m,t+.4,1.1,'sine',.035,o));[96,100,103,108].forEach((m,i)=>tone(m,t+.7+i*.05,.25,'triangle',.025,o));break;
  case'bossIn':noise(t,1.6,.16,o,60);tone(110,t,1.6,'sawtooth',.06,o,40);tone(55,t,2.2,'sine',.12,o,35);[45,46,51].forEach((m,i)=>tone(m,t+.25+i*.02,2.4,'triangle',.05,o));break;/* オオカゲの登場：ひくい地ひびきと、にごった和音 */
  case'shard':if(playS('shard',.8))break;seq([67,72,76,79],.09,'triangle',.08,.16);break;/* かけらをはめる */
case'bossKO':noise(t,.5,.3,o,200);tone(70,t,1.4,'sine',.2,o,30);tone(900,t,.35,'square',.05,o,120);noise(t+.12,.9,.08,o,3000);[72,79,84,88,91,96].forEach((m,i)=>tone(m,t+.35+i*.08,1.4,'triangle',.06,o));[96,103,108].forEach((m,i)=>tone(m,t+.9+i*.06,1.2,'sine',.04,o));break;/* オオカゲへのさいごの一撃：ドーンとひびいて、光の音がかけあがる */
  case'hit':if(playS('arrow',.6))break;noise(t,.08,.15,o,800);tone(220,t,.12,'square',.05,o,70);break;
  case'defeat':if(playS('kill',.5))break;tone(400,t,.18,'triangle',.08,o,1300);noise(t+.05,.12,.04,o,4000);break;
  case'offer':seq([88,91,96],.05,'sine',.05);break;
  case'hanabi':noise(t,.5,.1,o,400);tone(62,t,.35,'sine',.18,o);break;/* 花火の音 */
  case'arrive':seq([79,84,88,91,96],.08,'sine',.06,.2);break;
  case'zap':if(playS('shoot',.45))break;tone(1500,t,.07,'sawtooth',.015,o,500);break;
  case'seed':seq([84,91,96,100],.05,'triangle',.05);break;
  case'pat':if(playS('pat',.8))break;noise(t,.08,.05,o,2500);break;
  case'sow':noise(t,.12,.05,o,4000);seq([79,84,88],.06,'triangle',.05);break;
  case'till':noise(t,.08,.12,o,400);noise(t+.14,.08,.12,o,400);tone(110,t,.08,'triangle',.06,o);break;
  case'harvest':if(playS('bush2',.45))break;seq([72,79,84,91],.05,'triangle',.06);break;
  case'water':if(playS('splash',.32))break;{const sr=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();sr.buffer=noiseBuf;sr.loop=true;bp.type='bandpass';bp.frequency.setValueAtTime(3200,t);bp.frequency.linearRampToValueAtTime(2200,t+.7);bp.Q.value=.8;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.1);g.gain.setValueAtTime(.06,t+.45);g.gain.linearRampToValueAtTime(0,t+.75);sr.connect(bp);bp.connect(g);g.connect(o);sr.start(t);sr.stop(t+.8);
    for(let n=0;n<4;n++){const d=t+.12+n*.13+Math.random()*.05;tone(1400+Math.random()*600,d,.05,'sine',.012,o,2600)}break}
  case'chop':playS('nail2',.3);break;/* 木を切る音＝釘を打つ音 */
  case'cook':if(playS('boil',.35))break;noise(t,.35,.025,o,3000);tone(180,t,.08,'triangle',.03,o,140);break;
  case'crack':if(playS('mine',.25))break;playS('place',.25);break;case'rm':if(playS('gravel',.6))break;noise(t,.18,.09,o,900);break;
  case'nail':playS('nail2',.28);break;
  case'bnail':playS('nail2',.42);break;
  case'kankan':for(let i=0;i<3;i++)playS('nail2',.42,i*.22);break;/* 強化したとき：カンカンカン *//* 建てているときの音（ふつうの1.5倍） */
  case'evap':noise(t,1.4,.05,o,2500);seq([67,64,60],.18,'sine',.03,.4);break;
  case'bush':playS('bush',.35);break;
  case'cast':playS('cast',.35);break;
  case'catch':playS('catch',.35);break;
  case'bubble':playS('bubble',.35);break;
  case'box':playS('box',.8);break;
  case'cookfire':playS('fire',.35);break;
  case'door':playS('door',.25);break;
  case'wave':playWave(.2);break;
  case'wbreak':playS('wallbreak',.5);break;
  case'pour':playSeg('trickle',.4,1.8);break;
  case'shoot':playS('shoot',.5);break;
  case'clap':for(let i=0;i<6;i++){const d=t+i*.13+Math.random()*.03;noise(d,.04,.12,o,2200+Math.random()*900);noise(d+.05,.03,.08,o,1800)}break;
  case'post':if(playS('paper',1.35))break;noise(t,.06,.45,o,2500);tone(520,t+.04,.07,'triangle',.45,o);tone(880,t+.1,.08,'square',.21,o);break;
  case'repair':tone(600,t,.05,'square',.04,o);tone(600,t+.12,.05,'square',.04,o);tone(88,t+.24,.12,'triangle',.05,o);break;
  case'bonk':if(playS('punch',.45))break;noise(t,.07,.1,o,600);tone(140,t,.1,'square',.05,o,90);break;
  case'thief':seq([76,79,76,79],.06,'square',.03);break;
  case'eat':if(playS('munch',.45))break;[0,.14,.28].forEach(d=>{noise(t+d,.06,.03,o,1800);tone(240+Math.random()*60,t+d,.06,'triangle',.05,o,150)});tone(84,t+.42,.12,'sine',.05,o);tone(88,t+.5,.16,'sine',.05,o);break;
  case'poof':noise(t,.3,.08,o,2500);seq([84,91],.08,'sine',.05);break;
  case'night':seq([57,53,50],.25,'sine',.08,.5);break;
  case'morning':seq([72,79,84],.12,'triangle',.06,.3);break;
  }
}
// 画面の中心から遠いほど小さく鳴らす
const SFXGAP={chop:1.3,pour:2.5,crack:1.3},SFXLAST={};/* 同じ音が重ならないように */
function sfxAt(k,x,y,m=1){if(!S)return;if(SFXGAP[k]){const n=performance.now()/1000;if(n-(SFXLAST[k]||0)<SFXGAP[k])return;SFXLAST[k]=n}const vw=VW/cam.z,vh=VH/cam.z,d=Math.hypot(x*TS-(cam.x+vw/2),y*TS-(cam.y+vh/2)),R=Math.max(vw,vh)*.8,v=Math.pow(Math.max(0,1-d/R),1.5);if(v<.04)return;SFXV=v*m;try{sfx(k)}finally{SFXV=1}}
const gainB=()=>SND.bgm?.55*(SND.bv??1):0,gainS=()=>SND.sfx?.15*(SND.sv??1):0;/* 音楽・効果音の音量（0〜1） */
function setSnd(k,v){SND[k]=v;saveSnd();if(AC){bgmG.gain.setTargetAtTime(gainB(),AC.currentTime,.1);sfxG.gain.setTargetAtTime(gainS(),AC.currentTime,.1)}}
