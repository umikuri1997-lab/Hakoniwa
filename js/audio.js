'use strict';


/* ---------- おと（BGM・効果音はWeb Audioで鳴らすオリジナル） ---------- */
const SND={bgm:true,sfx:true,vib:true};try{Object.assign(SND,JSON.parse(KV.getItem('hakoniwa-sound')||'{}'))}catch(e){}
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
  /* 火山のふもと：短調で、すこしひくく、ゆったり（昼）。夜はさらにゆっくり */
  dayV:{bpm:80,lead:'triangle',chords:[[45,[57,60,64]],[41,[53,57,60]],[48,[55,60,64]],[43,[55,59,62]]],
    mel:[[69,4],[72,2],[76,2],[74,4],[72,2],[69,2],[67,4],[69,2],[72,2],[74,4],[72,4],
         [76,4],[74,2],[72,2],[69,4],[72,2],[74,2],[72,2],[69,2],[67,2],[64,2],[69,6],[0,2]]},
  nightV:{bpm:58,lead:'sine',chords:[[38,[53,57,62]],[34,[50,53,58]],[41,[53,57,60]],[36,[52,55,60]]],
    mel:[[62,4],[65,2],[69,2],[67,6],[0,2],[65,4],[62,4],[64,4],[60,4],
         [62,2],[65,2],[69,2],[74,2],[72,4],[69,4],[67,4],[65,4],[62,6],[0,2]]},
  /* ヨルノオオカゲとのたたかい：短調で、はやく、ずんずん進む */
  battle:{bpm:132,lead:'square',chords:[[45,[57,60,64]],[41,[53,57,60]],[43,[55,59,62]],[40,[56,59,64]]],
    mel:[[69,2],[72,2],[76,2],[72,2],[74,2],[72,1],[71,1],[69,4],[72,2],[74,2],[76,2],[77,2],[76,2],[74,2],[72,4],
         [76,2],[79,2],[81,2],[79,2],[77,2],[76,2],[74,4],[71,2],[72,2],[74,2],[76,2],[80,2],[76,2],[71,4]]},
};
/* ヒノオオカゲの曲：火山らしい音階（フリギア）で、少し速く。たいこと、火のはぜる音（sched の hinoS） */SONGS.hino={bpm:104,lead:'triangle',chords:[[40,[52,55,59]],[41,[53,57,60]],[40,[52,55,59]],[38,[50,53,57]]],
  mel:[[64,2],[65,2],[64,2],[62,2],[64,4],[0,2],[59,2],[64,2],[65,2],[67,2],[69,2],[67,2],[65,2],[64,4],
       [71,2],[72,2],[71,2],[69,2],[67,2],[65,2],[67,2],[69,2],[67,2],[65,2],[64,2],[62,2],[64,6],[0,2]]};
/* オオカゲがいる夜：ふだんの夜の曲を、少しだけ速く、ひくい心臓の音のようなベースをかさねる（sched の bossArr） */SONGS.nightB=Object.assign({},SONGS.night,{bpm:72});SONGS.nightVB=Object.assign({},SONGS.nightV,{bpm:64});
for(const k in SONGS){const g=SONGS[k];g.at=new Array(64).fill(null);let p=0;for(const[m,l]of g.mel){if(m)g.at[p%64]=[m,l];p+=l}}
const SAMPLES={"bell":["assets/g/cb9ff20140.mp3"],"pat":["assets/g/e2b825e14e.mp3"],"voice":["assets/g/fc5ad15d4b.mp3"],"paper":["assets/g/b7b70de2d3.mp3"],"night":["assets/g/982aef2204.mp3"],"chop":["assets/g/1d86cabda1.mp3","assets/g/676cf2fa6d.mp3","assets/g/a8dd704564.mp3"],"dig":["assets/g/56f3308409.mp3"],"splash":["assets/g/05adadaa1c.mp3"],"cast":["assets/g/93da972520.mp3"],"nail":["assets/g/b121a3b6b8.mp3"],"bush":["assets/g/3c69ed59fd.mp3"],"bubble":["assets/g/3dae9cab95.mp3"],"catch":["assets/g/269701117d.mp3"],"box":["assets/g/8c8eeb8b61.mp3"],"fire":["assets/g/e54c43d515.mp3"],"boil":["assets/g/55a7541497.mp3"],"rain":["assets/g/7178ec736f.mp3"],"birds":["assets/g/c0eec144c6.mp3"]};const SBUF={};
Object.assign(SAMPLES,{"cv_bird":["assets/g/9b470b144f.mp3","assets/g/db72a6af64.mp3"],"cv_risu":["assets/g/4c78fed31b.mp3","assets/g/9edc31c156.mp3"],"cv_nezumi":["assets/g/501d60a27f.mp3","assets/g/7af1d6b1ad.mp3"],"cv_usagi":["assets/g/835baf3933.mp3","assets/g/42e4a215ff.mp3"],"cv_hari":["assets/g/2e6280bdd6.mp3","assets/g/81b9b3a8ae.mp3"],"cv_mogura":["assets/g/751ba6e7ac.mp3"],"cv_frog":["assets/g/2e14f342ca.mp3","assets/g/672e9ac7f4.mp3"],"cv_bee":["assets/g/7e04bea9e6.mp3"],"cv_bug":["assets/g/f55c26356a.mp3","assets/g/b62bdf400b.mp3"],"cv_tonbo":["assets/g/5a2cccf54c.mp3"],"cv_hotaru":["assets/g/e4d113ed5a.mp3"],"cv_snail":["assets/g/3186e4c99a.mp3"]});/* 小さな生き物の鳴き声（OpenGameArt の CC0 の録音、tools/sound/critter_voice.py） */
Object.assign(SAMPLES,{"mine":["assets/g/ba69ed4c76.mp3"]});
Object.assign(SAMPLES,{"gravel":["assets/g/1367715265.mp3"],"wdon":["assets/g/6e3c4c3694.mp3"],"arrow": ["assets/g/4020d45f73.mp3"], "bush2": ["assets/g/0f9eb4e9b6.mp3"], "door": ["assets/g/02047b788c.mp3"], "kill": ["assets/g/c3aac5194a.mp3"], "munch": ["assets/g/83541e7fe0.mp3"], "nail2": ["assets/g/f10fe51343.mp3"], "pick": ["assets/g/443dd77412.mp3"], "place": ["assets/g/c75dd30fa4.mp3"], "punch": ["assets/g/5124e82f60.mp3"], "shoot": ["assets/g/8c1be13e0e.mp3"], "trickle": ["assets/g/017cf8add7.mp3"], "wallbreak": ["assets/g/43e010b66b.mp3"], "wave": ["assets/g/241549ec96.mp3"]});/* 効果音ラボ（ユーザー提供） */
Object.assign(SAMPLES,{"tonton":["assets/g/d659bed8d7.mp3","assets/g/b635eb8871.mp3","assets/g/5c204e10f1.mp3","assets/g/ba26bd4423.mp3"],"potclk":["assets/g/17e80015f2.mp3","assets/g/585623a7e1.mp3","assets/g/64ea90268e.mp3"],"tink":["assets/g/329095dca9.mp3","assets/g/d5c75b01cb.mp3","assets/g/77a6e1091e.mp3"],"plate":["assets/g/ec6e73db00.mp3","assets/g/094fbbae9e.mp3","assets/g/a35b4f6573.mp3"],"cloth":["assets/g/aee6f07e05.mp3","assets/g/8af3bc4e78.mp3","assets/g/d6540587a2.mp3","assets/g/5f2f5f0c54.mp3"]});/* 料理・もの作りの手もとの音（Kenney CC0、tools/sound/ui_asmr.py） */
Object.assign(SAMPLES,{"spike":["assets/g/5e814bb008.mp3"],"poison":["assets/g/1b43a21e56.mp3"]});/* 効果音ラボ（ユーザー提供）：とげの罠は「芝生の上を歩く」のひと足ぶん、どくの罠は「水中で息を吐く」 */
SAMPLES.shard=['assets/g/9464bc7161.mp3'];/* ヌシのかけらをはめる音（ユーザーの音） */
SAMPLES.furniturePlace=['assets/g/e33cbd97b8.mp3'];/* 家具を置く音：ユーザー提供 */
SAMPLES.matDrop=['assets/g/ef846d878d.mp3'];SAMPLES.fireatk=['assets/g/149bc0958c.mp3'];/* 火のせいれいの攻撃：ボッ（もらった音） *//* fire：焚き火のぱちぱち（もらった音。60秒のうち12秒を切り出し） */SAMPLES.click=['assets/g/dc1fab61b3.mp3'];/* ボタンをおす音（もらった音） *//* 守りの光で木・岩をこわして、素材が落ちたときの音（もらった音） */
Object.assign(SAMPLES,{"stamp":["assets/g/5fb1653535.mp3","assets/g/9f56c224e9.mp3","assets/g/f1cb5ea1ff.mp3"],"dust":["assets/g/814fe2b628.mp3","assets/g/8189f95d0a.mp3","assets/g/6bfc4bd6ec.mp3","assets/g/ca1ad9eafa.mp3"],"creak":["assets/g/6c7654c715.mp3","assets/g/c82a840632.mp3"],"bend":["assets/g/b60262d9ed.mp3"],"tab":["assets/g/646421dca2.mp3","assets/g/8553ad0946.mp3"],"knockw":["assets/g/b16e923e81.mp3","assets/g/44cd883b60.mp3","assets/g/c00e91f7e0.mp3","assets/g/b4f4e74b6b.mp3","assets/g/ff0c586227.mp3"],"notch":["assets/g/e4390406ba.mp3","assets/g/0ab0818cbf.mp3","assets/g/bd4aa0ed1d.mp3"]});Object.assign(SAMPLES,{"lid":["assets/g/33c29f24b3.mp3","assets/g/eed154ca9c.mp3"]});/* 木箱のふたが開く音（Kenney の CC0、tools/sound/ui_asmr.py） *//* UIの手ざわりの本物の音（Kenney の CC0 の音を tools/sound/ui_asmr.py でととのえた物）：ハンコ・木くず・なわのきしみ・板のしなり・タブ・ことっ・± */
function loadSamples(){/* 音のファイル（assets/g/*.mp3）を読みこんで、鳴らせる形にしておく */for(const k in SAMPLES){SBUF[k]=[];SAMPLES[k].forEach((u,i)=>{fetch(u).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b,buf=>{SBUF[k][i]=buf},()=>{})).catch(()=>{})})}}
// セリフの声：キャラごとに高さを変える（カミサマは低め）
let VOICE=null,voxC=null;const BRAVET=new WeakMap();
function voiceStart(w,dur){voiceStop();if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF.voice||[])[0];if(!b)return;
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.loop=true;{const sr=S&&S.res&&S.res.find(q=>q.name===w),vb=sr&&sr.vr&&sr.vr.vo;src.playbackRate.value=/ヌシ/.test(w||'')?.55:(w===GOD||w==='？？？')?.78:vb||(KEYVR[w]&&KEYVR[w].vo)||1.12}/* 声の高さは一人ずつちがう */
  {const t=AC.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.8*(SND.vv??1),t+.03)}/* 声の出だしは、ぷつっと大きくならないよう、少しずつ */src.connect(g);g.connect(voxC);src.start(0,Math.random()*b.duration*.5);VOICE={src,g};if(dur)VOICE.end=setTimeout(voiceStop,dur*1000)}
/* しらべるでタップしたときの「ほにゃ？」：短く、最後が上がる声 */
function voiceHmm(r){voiceStop();if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF.voice||[])[0];if(!b)return;const vo=(r.vr&&r.vr.vo)||1.12,t=AC.currentTime;
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.playbackRate.setValueAtTime(vo*.95,t);src.playbackRate.setValueAtTime(vo*.95,t+.16);src.playbackRate.linearRampToValueAtTime(vo*1.35,t+.36);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.7*(SND.vv??1),t+.03);g.gain.setValueAtTime(.7*(SND.vv??1),t+.3);g.gain.linearRampToValueAtTime(0,t+.42);src.connect(g);g.connect(voxC);src.start(t,Math.random()*b.duration*.5);src.stop(t+.45);VOICE={src,g}}
function voiceStop(){if(!VOICE)return;const v=VOICE;VOICE=null;clearTimeout(v.end);try{const t=AC.currentTime;v.g.gain.setTargetAtTime(0,t,.04);v.src.stop(t+.2)}catch(e){}}
function playSeg(k,vol,dur){if(!AC||!SND.sfx||AC.state!=='running')return false;const L=(SBUF[k]||[]).filter(Boolean);if(!L.length)return false;const b=pick(L),src=AC.createBufferSource(),g=AC.createGain(),t=AC.currentTime;src.buffer=b;const v=vol*(SFXO?1:SFXV);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.15);g.gain.setValueAtTime(v,t+dur-.3);g.gain.linearRampToValueAtTime(0,t+dur);src.connect(g);g.connect(SFXO||sfxG);src.start(t,Math.random()*Math.max(0,b.duration-dur));src.stop(t+dur+.05);return true}
let WAVE=null;/* 水浴びの音は1つだけ。水浴びが終わったら止める */
function playWave(vol){if(WAVE||!AC)return;const L=(SBUF.wave||[]).filter(Boolean);if(!L.length)return;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=pick(L);g.gain.value=vol*SFXV;src.connect(g);g.connect(sfxG);const w={src,g};src.onended=()=>{if(WAVE===w)WAVE=null};WAVE=w;src.start()}
function stopWave(){if(!WAVE)return;const{src,g}=WAVE;WAVE=null;try{g.gain.setTargetAtTime(0,AC.currentTime,.12);src.stop(AC.currentTime+.5)}catch(e){}}
function bellRing(x,y){/* 村の鐘：教会の鐘の音を、間をあけて3回。少しずつ小さく、あとの2回は少しだけ低く。遠くても小さく聞こえる */if(!AC||!SND.sfx)return;const L=(SBUF.bell||[]).filter(Boolean);if(!L.length)return;const vw=VW/cam.z,vh=VH/cam.z,d=Math.hypot(x*TS-(cam.x+vw/2),y*TS-(cam.y+vh/2)),v=Math.max(.35,1-d/(Math.max(vw,vh)*1.5));
  [[0,1,1],[1.5,.97,.8],[3,.995,.65]].forEach(([t,rt,g0])=>{const src=AC.createBufferSource(),g=AC.createGain();src.buffer=L[0];src.playbackRate.value=rt;g.gain.value=1.6*g0*v;src.connect(g);g.connect(sfxG);src.start(AC.currentTime+t)})}
function playS(k,vol,dl,rt){const L=(SBUF[k]||[]).filter(Boolean);if(!L.length)return false;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=pick(L);src.playbackRate.value=(rt||1)*(.92+Math.random()*.16);g.gain.value=vol*(SFXO?1:SFXV);src.connect(g);g.connect(SFXO||sfxG);src.start(AC.currentTime+(dl||0));return true}
/* UIの本物の音：鳴らすたびに、ちがう録音（3〜5しゅるい）と、少しちがう高さ・大きさ（同じ音のくりかえしは機械っぽく聞こえる） */
function playU(k,vol,rt,dl){return playS(k,vol*(.85+Math.random()*.3),dl,rt||1)}
function audioInit(){
  if(AC){if(AC.state==='suspended')AC.resume().catch(()=>{});return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume().catch(()=>{})}catch(e){return}
  const comp=AC.createDynamicsCompressor();comp.connect(AC.destination);
  bgmG=AC.createGain();bgmG.gain.value=gainB();bgmF=AC.createGain();bgmF.gain.value=1;bgmG.connect(bgmF);bgmF.connect(comp);
  sfxG=AC.createGain();sfxG.gain.value=gainS();sfxG.connect(comp);
  voxC=AC.createDynamicsCompressor();voxC.threshold.value=-38;voxC.ratio.value=12;voxC.knee.value=4;voxC.attack.value=.003;voxC.release.value=.1;{const vg=AC.createGain();vg.gain.value=.5;voxC.connect(vg);vg.connect(sfxG)}/* 声の大きさ（コンプレッサーのあとで、半分に） *//* 声は、大きいところをおさえて、音の大きさをそろえる（声の音の中に、ほかより大きい所があるため） */
  noiseBuf=AC.createBuffer(1,AC.sampleRate*.3,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  nextT=AC.currentTime+.15;setInterval(sched,60);setInterval(ambTick,500);loadSamples();
}
function tone(m,t,dur,type,vol,out,f2){
  const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(typeof m==='number'&&m<200?mf(m):m,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);
}
/* やわらかい手ざわりの音（ASMRのような、小さく近い音）：木をそっとたたく「コトッ」（knock）と、紙・葉がこすれる「さらっ」（rustle） */
function knock(f,t,vol,out,dec){dec=dec||.09;const o=AC.createOscillator(),g=AC.createGain(),lp=AC.createBiquadFilter();o.type='sine';o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f,t+.012);lp.type='lowpass';lp.frequency.value=f*3;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+dec);o.connect(lp);lp.connect(g);g.connect(out);o.start(t);o.stop(t+dec+.02)}
function rustle(t,dur,vol,out,f0,f1,q){const s=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();s.buffer=noiseBuf;s.loop=true;bp.type='bandpass';bp.Q.value=q||.8;bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(f1||f0,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.03,dur*.35));g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(bp);bp.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.02)}
function noise(t,dur,vol,out,hp){const s=AC.createBufferSource(),g=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=noiseBuf;fl.type='highpass';fl.frequency.value=hp||6000;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.02)}
function bossNear(e){if(!e.spawned||e.dead)return false;if(!e.nearV&&typeof VILL!=='undefined'&&VILL&&VILL[(e.y|0)*W+(e.x|0)])e.nearV=1;return !!e.nearV}/* オオカゲの曲は、村の中（置いた物のまわり3マス）に一度入ってから。出たり入ったりで曲をかえない */
const stageSong=()=>S&&S.enemies&&S.enemies.some(e=>e.type==='boss2'&&e.spawned&&!e.dead)?'battle':S&&S.enemies&&S.enemies.some(e=>e.type==='hino'&&bossNear(e))?'hino'/* ヒノオオカゲは専用の曲 */:S&&S.enemies&&S.enemies.some(e=>(e.type==='boss'||e.type==='yama')&&bossNear(e))?(typeof WD!=='undefined'&&WD===1?'nightVB':'nightB')/* オオカゲがいるあいだは、夜の曲のアレンジ */:(isDark()?'night':'day')+(typeof WD!=='undefined'&&WD===1?'V':'');/* ヨルノオオカゲがいるあいだは、たたかいの曲 *//* ステージごとに曲をかえる（火山は dayV・nightV） */
function stageMusic(){
  curSong=wantSong=stageSong();step=0;bgmSw=0;
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
    const g=SONGS[curSong],e=60/g.bpm/2,t=nextT,bar=(step/8)|0,ch=g.chords[bar%4],night=curSong.indexOf('night')===0,bossArr=night&&curSong.slice(-1)==='B',opening=curSong==='opening',battle=curSong==='battle',hinoS=curSong==='hino';
    const n=g.at[step];if(n)tone(n[0],t,n[1]*e*.95,g.lead,battle?.045:opening?.16:night?.09:.075,bgmG);
    if(hinoS){if(n)tone(n[0]-12,t,n[1]*e*.9,'sawtooth',.018,bgmG);/* メロディに、ひくいざらついた音をかさねる */if(step%4===0)tone(ch[0],t,e*3.6,'triangle',.14,bgmG);if(step%8===0)for(const c of ch[1])tone(c,t,e*7.6,'sine',.03,bgmG);if(step%8===0||step%8===3||step%8===5)tone(45,t,.22,'sine',step%8===0?.2:.13,bgmG,36);/* たいこ：ドン・ドドン */if(step%8===6)noise(t,.06,.04,bgmG,1500);if(step%2===1&&Math.random()<.5)noise(t,.02,.012+Math.random()*.012,bgmG,4000);/* 火のはぜる音 */nextT+=e;step=(step+1)%64;continue}
    if(battle){if(step%2===0)tone(ch[0]+(step%4===2?12:0),t,e*1.7,'triangle',.15,bgmG);if(step%8===0)for(const c of ch[1])tone(c,t,e*7.5,'sawtooth',.012,bgmG);if(step%4===0)tone(45,t,.14,'sine',.16,bgmG,40);if(step%4===2)noise(t,.09,.05,bgmG,1800);else if(step%2===1)noise(t,.03,.025,bgmG);nextT+=e;step=(step+1)%64;continue}/* たたかい：ベースを8分できざみ、たいこ *//* マップ画面の曲（opening）：サインだけだとスマホのスピーカーで聞こえないので、三角波でほかの曲と同じくらいの大きさに */
    if(step%8===0)tone(ch[0],t,e*(opening?6:night?7.5:3.6),'triangle',opening?.22:.13,bgmG);
    if(!night&&step%8===4)tone(ch[0]+7,t,e*3.4,'triangle',opening?.2:.1,bgmG);
    if(opening){if(step%8===0)for(const c of ch[1])tone(c,t,e*7.2,'sine',.06,bgmG);if(step%4===2)tone(ch[1][(step>>2)%3]+24,t,e*1.8,'triangle',.05,bgmG)}
    else if(night){if(step%8===0)for(const c of ch[1])tone(c,t,e*7.8,'sine',.025,bgmG);if(step%4===2)tone(ch[1][(step>>2)%3]+12,t,e*1.6,'sine',.02,bgmG)}
    if(bossArr&&(step%8===0||step%8===1))tone(ch[0]-12,t,e*.9,'triangle',step%8===0?.16:.11,bgmG,(mf(ch[0]-12))*.8);/* オオカゲ：どくん、どくん（ひくいベースを2つ） */
    else{tone(ch[1][step%3]+12,t,e*.55,'square',opening?.024:.012,bgmG);if(step%2===1)noise(t,.03,opening?.05:.025,bgmG)}
    nextT+=e;step=(step+1)%64;
  }
}
/* 大きな場面の前の「間」：曲と環境音をしずかにして（ms ミリ秒）、少しまってから音 k を鳴らす */
let DUCKT=0;
function musicDuck(ms){if(!AC||AC.state!=='running')return;const t=AC.currentTime,end=t+ms/1000;DUCKT=Math.max(DUCKT,end);for(const g of[bgmG,ambG])if(g){const v=g===ambG?.09:gainB();g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(v*.2,t+.35);g.gain.setValueAtTime(v*.2,DUCKT);g.gain.linearRampToValueAtTime(v,DUCKT+1.2)}}
function quietBeat(ms,k){musicDuck(ms);if(k)setTimeout(()=>sfx(k),380)}
let ambG=null;const AMB={};
/* 夕方の虫の声：短い高い音を2回ずつ（のこした音の素材はつかわず、その場でつくる）。夕方（17.5〜20時）だけ、ときどき */
let AMBNEXT=0;
function ambAccent(on,h){if(!on||!ambG||!(h>=17.5&&h<20))return;const t=AC.currentTime;if(t<AMBNEXT||DUCKT>t)return;AMBNEXT=t+2.5+Math.random()*4;const f=3800+Math.random()*900;for(let i=0;i<2+(Math.random()*2|0);i++){tone(f,t+i*.11,.06,'sine',.05,ambG,f*.97)}}
let ambF=null,AMBIN=false;
/* 家の中を映しているか：画面のまん中のマスが、屋根をはずした家の中（ふだんの拡大より、ちぢめていないとき） */
function ambIndoor(){if(!S||!started||typeof HOUSES==='undefined'||!HOUSES.length||typeof cam==='undefined')return false;const vw=VW/cam.z,vh=VH/cam.z,cx=((cam.x+vw/2)/TS)|0,cy=((cam.y+vh/2)/TS)|0;if(cx<0||cy<0||cx>=W||cy>=H)return false;
  if(cam.z<homeZ()*.95)return false;const h=HOUSES.find(q=>q.set.has(cy*W+cx));return !!h&&roofAOf(h)<.5}
function ambTick(){if(!AC||AC.state!=='running')return;if(!ambG){ambG=AC.createGain();ambG.gain.value=.09;ambF=AC.createBiquadFilter();ambF.type='lowpass';ambF.frequency.value=18000;ambF.Q.value=.4;ambG.connect(ambF);ambF.connect(AC.destination)}
  {const inn=ambIndoor();if(inn!==AMBIN){AMBIN=inn;ambF.frequency.setTargetAtTime(inn?700:18000,AC.currentTime,inn?.25:.4)}}/* 家の中を映すと、外の雨・鳥・虫の音が、壁ごしにやわらかくこもる */
  const want={birds:0,rain:0,night:0};let h=12,on=false;if(S&&started&&SND.sfx&&$('#title').hidden&&$('#maps').hidden){on=true;h=hour();if(S.rain)want.rain=.45;else{/* 朝と夕方は、ゆっくり入れかわる（夜あけは鳥が少しにぎやか） */const cl=v=>Math.max(0,Math.min(1,v));want.birds=h<5||h>=18.5?0:h<6.5?cl((h-5)/1.5)*1.3:h<7.5?1.3-(h-6.5)*.3:h<17?1:cl((18.5-h)/1.5);want.night=h>=17.5?cl((h-17.5)/1.5)*3:h<5.5?cl((5.5-h)/1)*3:0/* 夜の環境音（もらった音）：大きさ3 */}}
  ambAccent(on&&!S.rain&&!(typeof paused!=='undefined'&&paused),h);
  for(const k in want){let a=AMB[k];if(!a){if(!want[k])continue;const b=(SBUF[k]||[])[0];if(!b)continue;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.loop=true;src.loopStart=.06;src.loopEnd=b.duration-.06;g.gain.value=0;src.connect(g);g.connect(ambG);src.start();a=AMB[k]={src,g}}a.g.gain.setTargetAtTime(want[k],AC.currentTime,.8)}}
const lastSfx={};
let SFXV=1,SFXP=0,SFXL=0,SFXO=null,SFXR=1,SFXTAB=0,SFXTABD=0;/* SFXP：左右（-1左〜1右）・SFXL：空気でこもる高さ（Hz、0はそのまま）・SFXR：音の高さ */
/* マップの音の出口：大きさ → 左右 → 遠いほど高い音がへる（空気の中で、遠くの音はこもって聞こえる） */
function sfxOut(){let n=AC.createGain(),h=n;n.gain.value=SFXV;if(SFXP&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=SFXP;h.connect(p);h=p}if(SFXL){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=SFXL;f.Q.value=.5;h.connect(f);h=f}h.connect(sfxG);return n}
let XYLN=0;
let TAPOBJ=0,TAPMAT=0;const TAPK=new Set(['twood','tgrass','tcan','tstone','tfoe','tweb','tani','tbell','tplace','tcloth','tsoil','twater']);
function sfx(k){
  if(k==='open'||k==='crit'||TAPK.has(k))TAPOBJ=performance.now();if(TAPK.has(k))TAPMAT=TAPOBJ;else if(k==='open'&&(TAPOBJ-TAPMAT<120||typeof TAPPEND!=='undefined'&&TAPPEND&&TAPOBJ-TAPPEND<120))return;/* 「みる」で物の音が鳴ったタップは、画面がひらく音をかさねない *//* 地図の物にさわった音が鳴ったら、葉・火の粉の音は出さない（tapFx） */
  if(!AC||!SND.sfx||AC.state!=='running')return;const now=AC.currentTime;if(lastSfx[k]&&now-lastSfx[k]<.07)return;lastSfx[k]=now;
  const t=now+.01,o=SFXV!==1||SFXP||SFXL?sfxOut():sfxG,seq=(ns,gap,type,v,d)=>ns.forEach((m,i)=>tone(m,t+i*gap,d||gap*1.6,type,v,o));
  SFXO=o===sfxG?null:o;if(SFXTAB&&(k==='tap'||k==='next')){SFXTABD=1;if(SFXTAB===2)return;k='tab'}/* タブをおしたときのボタンの音は、めくる音に */
  if(k.startsWith('cv_')){playU(k,.3);return}/* 小さな生き物の鳴き声 */
  switch(k){
  case'block':if(playS('wdon',.5))break;tone(260,t,.07,'square',.05,o,520);tone(83,t+.05,.07,'triangle',.06,o);break;
  case'plant':tone(500,t,.1,'triangle',.08,o,950);tone(88,t+.08,.1,'sine',.06,o);break;
  case'furn':seq([72,76,79,84],.06,'triangle',.07);break;
  case'furnPlace':if(playS('furniturePlace',.72))break;seq([72,76,79,84],.06,'triangle',.07);break;
  case'matDrop':if(playS('matDrop',.8))break;tone(520,t,.06,'triangle',.06,o,260);break;
  case'power':seq([79,84,88,91],.055,'sine',.07);tone(1568,t+.24,.35,'triangle',.03,o,2093);break;/* パワーをカミサマにわたした：きらっとした音 */
  case'tap':if(playS('click',.6))break;tone(1300,t,.03,'square',.07,o);tone(1950,t+.025,.03,'triangle',.05,o);break;/* ボタン：もらった音（click） */
  case'twood':{const r=.93+Math.random()*.14;knock(640*r,t,.07,o,.07);knock(980*r,t+.018,.025,o,.04)}break;/* 地図の物をタップ（ボタンの音とはべつ）。枝・木の物・宝箱：こつっ */
  case'tgrass':{const r=.92+Math.random()*.16;rustle(t,.08,.05,o,2600*r,1800*r,.9);rustle(t+.035,.06,.03,o,3400*r,2400*r,.9)}break;/* 草・きのこ：かさっ */
  case'tcan':{const r=.95+Math.random()*.1;knock(1700*r,t,.05,o,.03);tone(3200*r,t,.09,'sine',.02,o,3050*r)}break;/* 空き缶：かちっ */
  case'tstone':{const r=.94+Math.random()*.12;knock(900*r,t,.08,o,.04);knock(1500*r,t+.004,.03,o,.025);noise(t,.02,.015,o,3000)}break;/* 鉱脈・石：こんっ */
  case'tfoe':{const r=.92+Math.random()*.16;knock(160*r,t,.09,o,.12);rustle(t,.1,.03,o,500,300,.7)}break;/* コワイノ・かげの巣：ぽふっ */
  case'tweb':rustle(t,.12,.025,o,5200,4200,1.5);rustle(t+.04,.08,.015,o,6000,5000,1.5);break;/* クモの巣：さらっ */
  case'tani':{const r=.93+Math.random()*.14;tone(380*r,t,.12,'sine',.05,o,620*r)}break;/* 生き物：ぽよっ */
  case'tbell':{const r=.97+Math.random()*.06;knock(880*r,t,.06,o,.22);knock(1320*r,t+.07,.04,o,.18)}break;/* ヌシ様・お客さん・屋台：ころん */
  case'tcloth':{const r=.92+Math.random()*.16;rustle(t,.11,.05,o,900*r,600*r,.7);knock(180*r,t+.02,.05,o,.05)}break;/* 布の物：ふさっ */
  case'tsoil':{const r=.92+Math.random()*.16;rustle(t,.07,.06,o,700*r,400*r,1.1);rustle(t+.03,.05,.03,o,1600*r,1100*r,1.3);knock(120*r,t,.05,o,.06)}break;/* 畑・地面：ざくっ */
  case'twater':{const r=.92+Math.random()*.16;tone(520*r,t,.09,'sine',.045,o,1100*r);tone(900*r,t+.05,.05,'sine',.02,o,1700*r);rustle(t,.06,.02,o,3000,2200,.9)}break;/* 水：ちゃぽっ */
  case'tplace':{const r=.93+Math.random()*.14;knock(300*r,t,.09,o,.1);rustle(t,.05,.02,o,900,500,.7)}break;/* 置く場所・ひっこしミトン：とんっ */
  case'next':{const r=.96+Math.random()*.08;knock(470*r,t,.09,o,.08);rustle(t+.01,.07,.025,o,3600,2600,.6)}break;/* 会話の「つぎへ」：コトッと、紙をめくる音 */
  case'open':rustle(t,.15,.06,o,900,2600,.7);knock(340,t+.11,.06,o,.1);break;/* 画面をひらく：さらっ…コトッ */
  case'close':rustle(t,.12,.05,o,2400,800,.7);knock(270,t+.08,.06,o,.1);break;/* 画面をとじる */
  case'count':{const r=.98+Math.random()*.04;tone(2093*r,t,.07,'sine',.03,o);tone(3136*r,t+.035,.09,'sine',.018,o)}break;/* 数がふえた：小さなガラスの「チリッ」 */
  case'xyl':{/* 一覧をなでる：マリンバの「ぽろん」（XYLN が音の高さ。ドレミソラの5音なので、つづけて鳴らしてもにごらない）。木の板の音は、もとの音の3.93倍・9.2倍の音が、すぐ消える */
    const f=[262,294,330,392,440,523,587,659][XYLN&7],lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;lp.connect(o);
    const pt=(fr,d,v,f0)=>{const s=AC.createOscillator(),g=AC.createGain();s.type='sine';s.frequency.setValueAtTime(f0||fr,t);if(f0)s.frequency.exponentialRampToValueAtTime(fr,t+.012);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(g);g.connect(lp);s.start(t);s.stop(t+d+.02)};
    pt(f,.42,.03,f*1.03);pt(f*3.93,.07,.007);pt(f*9.2,.025,.002);rustle(t,.015,.015,lp,f*4,f*4,1.2)}break;
  case'pin':rustle(t,.05,.05,o,1200,600,.7);knock(300,t+.03,.06,o,.08);knock(1500,t+.16,.03,o,.03);break;/* 紙をぺたっ、ピンをぷすっ */
  case'crit':{const r=.94+Math.random()*.12;rustle(t,.08,.03,o,2600*r,4200*r,.7);knock(900*r,t+.05,.03,o,.04)}break;/* 小さな生き物をタップ：かさっ、と小さく */
  case'tile':{const r=.94+Math.random()*.12;knock(520*r,t,.045,o,.06)}break;/* 板が1まいずつ置かれる：とん、とん */
  case'flip':rustle(t,.06,.035,o,1800,3400,.8);knock(380,t+.07,.05,o,.07);break;/* 札を裏返す：ぱたっ */
  case'sizzle':rustle(t,.32,.07,o,5200,2400,1.2);rustle(t+.02,.22,.04,o,1800,900,.8);knock(210,t,.07,o,.12);break;/* 焼き印：じゅっ */
  case'leaf':rustle(t,.09,.04,o,2800,2200,.9);rustle(t+.05,.08,.028,o,3600,2600,.9);break;/* 葉が舞う：さわさわ */
  case'crackle':for(let i=0;i<3;i++)rustle(t+i*.025+Math.random()*.015,.012,.06,o,4500,4500,2);break;/* 火の粉：パチパチ */
  /* せいれいの攻撃：属性ごと。当たる音（arrow）に、属性の音をかさねる */
  case'atk_fire':if(playS('fireatk',.45))break;noise(t,.2,.15,o,300);break;/* ボッ（もらった音） */
  case'atk_earth':tone(50,t,.18,'sine',.2,o,45);noise(t,.12,.18,o,500);for(let n=0;n<3;n++)noise(t+.14+n*.07,.03,.08,o,1400);tone(42,t+.02,.12,'triangle',.08,o,60);break;/* ずしんとひびいて、石がころころ */
  case'atk_wood':{const sr=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();sr.buffer=noiseBuf;bp.type='bandpass';bp.Q.value=2;bp.frequency.setValueAtTime(1200,t);bp.frequency.exponentialRampToValueAtTime(4200,t+.12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+.08);g.gain.linearRampToValueAtTime(0,t+.14);sr.connect(bp);bp.connect(g);g.connect(o);sr.start(t);sr.stop(t+.16)}noise(t+.13,.04,.2,o,2200);tone(330,t+.13,.06,'triangle',.06,o,200);playS('bush',.25,.16);break;/* ひゅっ、ぴしっ。葉がざわっ */
  case'atk_wind':for(const[d,f0,f1]of[[0,700,2400],[.09,900,3000]]){const sr=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();sr.buffer=noiseBuf;bp.type='bandpass';bp.Q.value=3;bp.frequency.setValueAtTime(f0,t+d);bp.frequency.exponentialRampToValueAtTime(f1,t+d+.18);g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(1.3,t+d+.06);g.gain.linearRampToValueAtTime(0,t+d+.22);sr.connect(bp);bp.connect(g);g.connect(o);sr.start(t+d);sr.stop(t+d+.24)}tone(1800,t+.05,.2,'sine',.15,o,2600);break;/* ひゅんひゅん、と風が2回 */
  case'atk_water':if(!playS('splash',1.1))noise(t,.2,.2,o,2500);tone(380,t,.12,'sine',.22,o,900);[0,.07,.15].forEach(d=>tone(900+Math.random()*500,t+.08+d,.05,'sine',.09,o,1800));break;/* ぽちゃん、とはじける */
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
  case'tonton':playU('tonton',.38);break;/* 包丁でまな板 */
  case'potclk':playU('potclk',.22);break;/* おたまがなべに */
  case'tink':playU('tink',.2);break;/* あわだて器がボウルに */
  case'plate':playU('plate',.32);break;/* お皿にもりつける */
  case'cloth':playU('cloth',.3);break;/* ぬのでみがく */
  case'fry':rustle(t,.42,.055,o,5600,3200,1.1);rustle(t+.03,.3,.03,o,2300,1600,.8);break;/* フライパン：じゅっ */
  case'grill':rustle(t,.3,.035,o,4200,2600,1);break;/* くしやき：ちりちり */
  case'fanw':rustle(t,.07,.045,o,900,500,1.2);break;/* うちわ：ぱた */
  case'shuttle':rustle(t,.16,.035,o,2200,3400,1.6);break;/* はたおり：ひがよこへすべる、さらっ */
  case'loombeat':{const r=.94+Math.random()*.12;knock(420*r,t,.08,o,.08);knock(700*r,t+.015,.03,o,.05)}break;/* はたおり：おさをとんっ */
  case'grind':{const r=.93+Math.random()*.14;rustle(t,.32,.05,o,260*r,420*r,1.2);knock(110*r,t,.03,o,.12)}break;/* 粉ひき：石うすが、ごりごり */
  case'saw':rustle(t,.2,.07,o,1500,2600,2.4);knock(160,t+.02,.03,o,.06);break;/* のこぎり：ごりっ */
  case'workdone':knock(420,t,.1,o,.07);seq([79,86,91],.07,'sine',.045);break;/* できた：ぽん、きらん */
  case'cook':if(playS('boil',.35))break;noise(t,.35,.025,o,3000);tone(180,t,.08,'triangle',.03,o,140);break;
  case'crack':if(playS('mine',.25))break;playS('place',.25);break;case'rm':if(playS('gravel',.6))break;noise(t,.18,.09,o,900);break;
  case'nail':playS('nail2',.28);break;
  case'bnail':playS('nail2',.42);break;
  case'kankan':for(let i=0;i<3;i++)playS('nail2',.42,i*.22);break;/* 強化したとき：カンカンカン *//* 建てているときの音（ふつうの1.5倍） */
  case'evap':noise(t,1.4,.05,o,2500);seq([67,64,60],.18,'sine',.03,.4);break;
  case'bush':playS('bush',.35);break;
  case'sacred':{/* 御神木の場面：葉をわたる風（やわらかくふくらんで消える）と、高くすんだ鈴の音 */const sr=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();sr.buffer=noiseBuf;sr.loop=true;bp.type='bandpass';bp.Q.value=.7;bp.frequency.setValueAtTime(900,t);bp.frequency.linearRampToValueAtTime(1800,t+.6);bp.frequency.linearRampToValueAtTime(1100,t+1.4);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.45);g.gain.linearRampToValueAtTime(0,t+1.5);sr.connect(bp);bp.connect(g);g.connect(o);sr.start(t);sr.stop(t+1.55);
    [88,95,100].forEach((m,i)=>tone(m,t+.18+i*.16,1.2,'sine',.022,o));break}
  case'chime':{/* 御神木の場面の小さな音（ひづめのあと・守り神の出番）：やさしい鈴ひとつ */const m=[91,95,98,100][Math.random()*4|0];tone(m,t,.6,'sine',.03,o);tone(m+12,t,.25,'sine',.008,o);break}
  case'cast':playS('cast',.35);break;
  case'catch':playS('catch',.35);break;
  case'bubble':playS('bubble',.35);break;
  case'box':playS('box',.8);break;
  case'put':playU('knockw',.55,.9);break;/* 箱などに置く：ことっ */
  case'take':playU('cloth',.5,1.05);break;/* 箱などから取る：ごそっ */
  case'lid':playU('lid',.3,1.15);break;/* 木箱のふたが開く：ぎぃ */
  case'cookfire':playSeg('fire',.55,2.5);break;/* 焚き火・かまど：ぱちぱち（長い音のどこかを2.5秒） */
  case'door':playS('door',.25);break;
  case'wave':playWave(.2);break;
  case'wbreak':playS('wallbreak',.5);break;
  case'pour':playSeg('trickle',.4,1.8);break;
  case'shoot':playS('shoot',.5);break;
  case'clap':for(let i=0;i<6;i++){const d=t+i*.13+Math.random()*.03;noise(d,.04,.12,o,2200+Math.random()*900);noise(d+.05,.03,.08,o,1800)}break;
  case'post':if(playS('paper',1.35))break;noise(t,.06,.45,o,2500);tone(520,t+.04,.07,'triangle',.45,o);tone(880,t+.1,.08,'square',.21,o);break;
  case'repair':tone(600,t,.05,'square',.04,o);tone(600,t+.12,.05,'square',.04,o);tone(88,t+.24,.12,'triangle',.05,o);break;
  case'spike':if(playS('spike',.5))break;noise(t,.05,.06,o,2600);break;/* とげの罠でダメージ */
  case'poison':if(playS('poison',.1125))break;noise(t,.2,.0125,o,500);break;/* どくの罠：ふんだとき・ダメージ */
  case'bonk':if(playS('punch',.45))break;noise(t,.07,.1,o,600);tone(140,t,.1,'square',.05,o,90);break;
  case'stamp':if(!playU('stamp',.5,.95))knock(150,t,.12,o,.14);rustle(t+.005,.05,.012,o,1800,900,.7);break;/* ハンコ：紙ごしの、ぽむっ */
  case'dust':playU('dust',.07,1.15+Math.random()*.25);break;/* 木くずが、さらさらこぼれる */
  case'creak':playU('creak',.06,1.2);break;/* つるしたなわが、きゅ… */
  case'bend':playU('bend',.04+.08*SFXR,.85+SFXR*.15);break;/* 板がしなって、ぎぃ（SFXR：しなりの大きさ 0〜1） */
  case'tab':if(!playU('tab',.3,1.05))rustle(t,.06,.03,o,3600,2400,.6);playU('knockw',.12,1.35,.025);break;/* タブ：ぱたっとめくって、ことっ */
  case'notch':if(!playU('notch',.32,SFXR))knock(1600*SFXR,t,.04,o,.02);break;/* ±：かちっ（ねじを回す音） */
  case'rowin':playU('knockw',.07,SFXR);break;/* 一覧の行が、ことっと置かれる */
  case'glug':for(let i=0;i<2;i++){const d=i*.13,f=260+Math.random()*60;tone(f,t+d,.07,'sine',.035,o,f*2.1)}break;/* ゲージがたまる：とくとく（水があわになってのぼる音） */
  case'boing':{const f=200*SFXR;tone(f,t,.22,'sine',.045,o,f*1.6);tone(f*2,t+.01,.12,'sine',.012,o,f*3)}playU('knockw',.06,.8);break;/* 長くおしたボタンをはなした：ぽよん（長くおすほど高い） */
  case'thief':seq([76,79,76,79],.06,'square',.03);break;
  case'eat':if(playS('munch',.45))break;[0,.14,.28].forEach(d=>{noise(t+d,.06,.03,o,1800);tone(240+Math.random()*60,t+d,.06,'triangle',.05,o,150)});tone(84,t+.42,.12,'sine',.05,o);tone(88,t+.5,.16,'sine',.05,o);break;
  case'poof':noise(t,.3,.08,o,2500);seq([84,91],.08,'sine',.05);break;
  case'night':seq([57,53,50],.25,'sine',.08,.5);break;
  case'morning':seq([72,79,84],.12,'triangle',.06,.3);break;
  }
}
// 画面の中心から遠いほど小さく鳴らす
const SFXGAP={chop:1.3,cookfire:2,pour:2.5,crack:1.3,spike:.4,poison:.6},SFXLAST={};/* 同じ音が重ならないように */
function sfxAt(k,x,y,m=1){if(!S)return;if(SFXGAP[k]){const n=performance.now()/1000;if(n-(SFXLAST[k]||0)<SFXGAP[k])return;SFXLAST[k]=n}const vw=VW/cam.z,vh=VH/cam.z,d=Math.hypot(x*TS-(cam.x+vw/2),y*TS-(cam.y+vh/2)),R=Math.max(vw,vh)*.8,v=Math.pow(Math.max(0,1-d/R),1.5);if(v<.04)return;
  const zr=Math.max(.6,Math.min(1.4,cam.z/(typeof homeZ==='function'?homeZ():cam.z))),dx=(x*TS-(cam.x+vw/2))/(vw/2);/* 拡大すると近くで聞こえる（少し大きく、高い音までくっきり） */
  SFXV=v*m*(.85+.15*zr);SFXP=Math.max(-.75,Math.min(.75,dx*.75));SFXL=Math.min(18000,1100*Math.pow(15,v)*zr);/* 画面の左の音は左から。遠いほどこもる */
  try{sfx(k)}finally{SFXV=1;SFXP=0;SFXL=0;SFXO=null}}
const gainB=()=>SND.bgm?.1085*(SND.bv??1):0,gainS=()=>SND.sfx?.15*(SND.sv??1):0;/* 音楽・効果音の音量（0〜1） */
function setSnd(k,v){SND[k]=v;saveSnd();if(AC){bgmG.gain.setTargetAtTime(gainB(),AC.currentTime,.1);sfxG.gain.setTargetAtTime(gainS(),AC.currentTime,.1)}}
