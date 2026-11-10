'use strict';
let PTW={s:null,v:0,q:false};/* パワーの音：前に見たパワー（q：光・はどうで使ったので鳴らさない） */
let VILLAGE_SESSION=0;
let STAGEWAIT=0;/* 会話の中の動き（わたす・押す・装置にふれる）が終わるまで、つぎのセリフへ送らない（実時間） *//* 村をひらきなおしたら、前の村の予約は動かさない */
const DLGQ=[];let DLGGAP=0,DLGTAP=-1e9,DLGCUR='';const DLGWAIT=3000;/* 会話がおわってから、つぎのべつの会話を出すまでの間（ミリ秒） */
function dlgGap(){DLGGAP=performance.now()+DLGWAIT;setTimeout(dlgNext,DLGWAIT+20)}
function dlgNext(){const d=$('#dialog');if(!d.hidden||!DLGQ.length)return;const w=DLGGAP-performance.now();if(w>0){setTimeout(dlgNext,w+20);return}{const q=DLGQ.shift();if(q[5]!==S||q[6]!==VILLAGE_SESSION)return dlgNext();dialog(q[0],q[1],q[2],q[3])}}
/* 会話の演出：shake=画面がゆれる／flash=白く光る／dim=少し暗くなる／beat=ひと呼吸おく */
function dashDemo(){/* フタバが、ヨルノオオカゲのほうへ飛び出す（会話中は世界が止まるので、ここで動かす） */const f=S.res.find(r=>r.name===POKO),e=S.enemies.find(q=>q.type==='boss2'&&q.spawned&&!q.dead);if(!f||!e||(f.dashAt!=null&&performance.now()-f.dashAt<30000))return;f.dashAt=performance.now();
  const dx=e.x-f.x,dy=e.y-f.y,d=Math.hypot(dx,dy)||1,len=Math.min(4,Math.max(0,d-3)),sx=f.x,sy=f.y;let tx=sx+dx/d*len,ty=sy+dy/d*len;
  if(!walk((ty|0)*W+(tx|0))){tx=sx;ty=sy}f.face=dx>=0?1:-1;f.path=[];JUMP.set(f,performance.now());sfx('hit');
  const t0=performance.now(),step=now=>{const p=Math.min(1,(now-t0)/450),k=1-Math.pow(1-p,3);f.x=sx+(tx-sx)*k;f.y=sy+(ty-sy)*k;if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
function stageMotion(c){/* 会話のあいだ、世界は止まっているので、ここで動きを出す：hop＝話している子がとびはねる／cheer＝みんなが、とびはねて、よろこぶ */const now=performance.now();if(c==='hop'||c==='cheer'||c==='cheerflash'){const L=c==='hop'?S.res.filter(r=>r.name===DLGA.who):S.res.filter(r=>!r.hidden);L.forEach((r,i)=>{setTimeout(()=>{if(r&&S&&S.res.includes(r)){JUMP.set(r,performance.now());if(c!=='hop')JOYU.set(r,performance.now()+2600)}},c==='hop'?0:i*120)});if(c!=='hop')sfx('level')}}
function nushiFace(c){/* ヌシ様のむき：nfF＝フタバのほう（よこむき）／nfG＝守り神（正面） */const n=S&&S.nushi;if(!n)return;n.mv=0;n.path=[];if(c==='nfG'){n.dir=1}else{const f=S.res.find(r=>r.name===POKO);n.dir=0;if(f)n.face=f.x>=n.x?1:-1}}
function dlgCue(c){if(!c)return;if(c.indexOf('+')>=0){for(const x of c.split('+'))dlgCue(x);return}if(c==='give'||c==='push'){stageHands(c);return}if(c.startsWith('heat:')){heatScene(c.slice(5));return}if(c.startsWith('stree:')){sacredCue(c.slice(6));return;}if(c.startsWith('vol:')){volBeat(c.slice(4));return;}if(c.startsWith('print:')){printCue(c.slice(6));return;}if(c==='nfF'||c==='nfG'){nushiFace(c);return}if(c==='glow'){towerGlow(6000);return}if(c==='hop'||c==='cheer'||c==='cheerflash'){stageMotion(c);if(c!=='cheerflash')return;c='flash'}if(c==='dash'){dashDemo();return}if(c==='wake'){for(const r of S.res)if(r.nap){r.nap=false;RHOLD.set(r,0);JUMP.set(r,performance.now());JOYU.set(r,performance.now()+1200)}return}/* うとうとしていた子が、はっとして起きる */if(c==='volcam'||c==='homcam'){const h=c==='homcam'&&S.res.find(r=>r.name===HOMURA);const tx=h?h.x*TS:(CX+.5)*TS,ty=h?(h.y-.7)*TS-hiAt((h.y|0)*W+(h.x|0))*LIFT:(OFF+3)*TS;camAnim={fz:cam.z,tz:Math.max(cam.z,h?2:1.2),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx,ty,t:0,dur:1.2};if(!h)sfx('bossIn');return}/* 火山のはじまり：火山へカメラをむける／ホムラへよる */if(c==='guarddemo'){const f=S.res.find(r=>r.name===POKO);if(f){leafFX(f);f.shDemo=performance.now()+3000;if(S.ns?.final)for(const r of S.res)if(r!==f&&!r.hidden&&Math.hypot(r.x-f.x,r.y-f.y)<=3){leafFX(r);r.shDemo=f.shDemo;}addFloat(f.x,f.y-1,'こもれびのまもり！','#5fbf3f')}sfx('bush');return}/* おぼえる場面：ほんとうに使ったときと同じ見た目（葉っぱ・葉のまもり・文字・音）を1回見せる。守りはかけない */if(c==='shake'){const v=$('#cv');v.classList.remove('shk');void v.offsetWidth;v.classList.add('shk');sfx('hit');setTimeout(()=>v.classList.remove('shk'),600)}else if(c==='flash'||c==='dim'){const d=document.createElement('div');const fl=c==='flash';d.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:19;opacity:0;background:'+(fl?'#fff':'#0b0f0a')+';transition:opacity '+(fl?.12:.7)+'s ease';document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity=fl?'.75':'.4'}));setTimeout(()=>{d.style.transition='opacity '+(fl?.7:1.2)+'s ease';d.style.opacity='0';setTimeout(()=>d.remove(),1300)},fl?160:1400)}}
function dialoguePause(ch,previous){return ch==='…'?(previous==='…'?90:340):/[。！？!?]/.test(ch)?220:ch==='、'?100:0}
function dialogueSpiritAnim(motion,talking,elapsed,hold,wave,reduced){if(reduced)return '';if(elapsed<950&&wave)return 'wave';if(!talking&&elapsed>=hold)return '';return ({joy:'talkjoy',shock:'talkshock',think:'talkthink',sad:'talksad'})[motion]||(talking?'talk':'')}
function dialoguePose(motion,elapsed){const durations={joy:950,shock:720,nod:650,think:1050,sad:950,phew:1400},d=durations[motion]||1,p=Math.max(0,Math.min(1,elapsed/d)),fade=Math.sin(p*Math.PI);if(p>=1)return {x:0,y:0,angle:0};if(motion==='joy')return {x:0,y:-Math.abs(Math.sin(p*Math.PI*2))*17,angle:Math.sin(p*Math.PI*4)*.045};if(motion==='shock')return {x:Math.sin(p*Math.PI*5)*4*(1-p),y:-fade*10,angle:-fade*.06};if(motion==='nod')return {x:0,y:Math.sin(p*Math.PI*2)*6,angle:Math.sin(p*Math.PI*2)*.045};if(motion==='phew')return p<.35?{x:0,y:-Math.sin(p/.35*Math.PI/2)*3,angle:0}:{x:0,y:-3+Math.sin((p-.35)/.65*Math.PI/2)*7*(1-(p-.35)/.65*.6),angle:0};/* ふぅ：すこし息をすって、肩をおとす */return {x:0,y:fade*(motion==='sad'?5:0),angle:fade*(motion==='sad'?.08:-.1)}}
let GODVOICE_T=0;/* 遠くからの声のあいさつを、さいごに出した時刻 */
function dialog(lines,after,lastLabel,who){
  if(!Array.isArray(lines)||!lines.length)return false;
  const owner=S,session=VILLAGE_SESSION,complete=after,dkey=JSON.stringify(lines);after=()=>{if(S===owner&&session===VILLAGE_SESSION){volSceneEnd(dkey);if(complete)complete()}};
  const d=$('#dialog'),key=JSON.stringify(lines);if(!d.hidden&&key===DLGCUR||DLGQ.some(q=>q[4]===key))return;/* 同じ会話を、かさねて出さない（何回かタップしても1回だけ） */
  if(!d.hidden||performance.now()<DLGGAP&&performance.now()-DLGTAP>400){DLGQ.push([lines,after,lastLabel,who,key,S,VILLAGE_SESSION]);return}/* 会話がおわってすぐの、べつの会話は、少しまってから（タップで始めた会話はすぐ） */DLGCUR=key;
  if(S&&!godHere()){/* 遠くからの声：「聞こえるかの？ 遠くから、声だけ届けておるぞい。」は、1つの会話で1回だけ。つづけて開く別の会話（90秒いない）でも出さない */const PRE='……聞こえるかの？ 遠くから、声だけ届けておるぞい。',reP=/……聞こえるかの？ 遠くから、声だけ届けておるぞい。/g;lines=lines.map(ln=>Array.isArray(ln)?ln.slice():ln);let first=true;const recent=performance.now()-GODVOICE_T<90000;for(const ln of lines){if(!Array.isArray(ln)||ln[0]!==GOD||typeof ln[1]!=='string')continue;ln[1]=ln[1].replace(reP,'');if(first){first=false;if(!recent){const m=/^(#[^|]*\|)?([\s\S]*)$/.exec(ln[1]);ln[1]=(m[1]||'')+PRE+m[2];GODVOICE_T=performance.now()}}/* 表情の印（#joy| など）は、行のはじめのまま */}}
  if(sheet&&!DLG_KEEP)closeSheet();d.classList.toggle('dtop',DLG_KEEP);requestAnimationFrame(fitTopDlg);
  let i=0;d.hidden=false;DLGN.clear();for(const ln of lines)if(Array.isArray(ln)&&ln[0])DLGN.add(ln[0]);if(who)DLGN.add(who);
  lines=lines.slice();/* えらぶ場面で、えらんだ答えのセリフを足すので、元の会話はかえない */
  const show=()=>{if(S!==owner||session!==VILLAGE_SESSION)return;let ln=lines[i],ch=null;if(Array.isArray(ln)&&ln[0]==='@choice'){ch=ln[1];ln=[ch.who,ch.q]}if(Array.isArray(ln)&&ln[0]==='@idea'){for(const id of ln[1]||[])IDEA_SHOWN.add(id);const panel=d.querySelector('.dlg');panel.style.visibility='hidden';return showGuardianIdea(ln[1],()=>{panel.style.visibility='';i++;if(i<lines.length)show();else{voiceStop();d.hidden=true;DLG_KEEP=false;dlgHush(false);d.classList.remove('dtop');fitTopDlg();if(after)after();if(d.hidden)dlgGap()}})}const w=Array.isArray(ln)?ln[0]:(who==null?LEAD():who);$('#dlgWho').textContent=w;$('#dlgWhoBox').hidden=w==='';
    const sp=$('.dlg .orb');const rw=S&&S.res.find(q=>q.name===w),spe=rw?rw.elem:KEYEL[w]||null;DLGA.vr=rw?rw.vr:null;sp.style.background=spe?'#f6f1e6 url('+spiritPort(spe,96,DLGA.vr)+') center/86% no-repeat':'';sp.style.boxShadow=spe?'inset 0 0 0 2px '+ELEM[spe].col:'';sp.style.animation=spe?'none':'';sp.style.width=sp.style.height=spe?'32px':'';sp.style.borderRadius='';$('#dlgWhoBox').className='who pxpill pm-'+(spe||(w===GOD?'god':'none'));/* 名前の札は、属性の色 */
    const p=$('#dlgText'),lk=lineLook(Array.isArray(ln)?ln[1]:ln),tx=lk.text;p.textContent='';dlgSpeak(w,spe,tx,lk);if(S){const H=S.dlog||(S.dlog=[]),last=H[H.length-1];if(!last||last[1]!==tx)H.push([w,tx]);if(H.length>120)H.splice(0,H.length-120)}const cue=Array.isArray(ln)?(typeof ln[2]==='string'?ln[2]:typeof ln[3]==='string'?ln[3]:''):'';dlgCue(cue);if(!cue&&S&&(lk.motion==='joy'||lk.motion==='shock'))stageMotion('hop');/* 会話の中で、よろこぶ・おどろくセリフは、話している子が村の中でもとびはねる（文字だけで流さない） */const bt=$('#dlgBtns');bt.innerHTML='';const b=document.createElement('button');b.className='btn pri';const hold=Math.max(lk.hold,cue==='flash'||cue==='shake'?700:0,sacredLineHold(cue),/(^|\+)(give|push|heat:)/.test(cue)?600:0);/* 光る・ゆれる場面は、すこし待つ */DLGA.motion=lk.motion;DLGA.holdUntil=DLGA.lineT+hold;DLGA.charAt=DLGA.lineT+lk.lead;DLGA.readReady=Infinity;if(hold){b.disabled=true;setTimeout(()=>{const ready=()=>{if(!b.isConnected)return;if(sacredMotionPending())return requestAnimationFrame(ready);b.disabled=false;};ready();},hold)}b.textContent=i<lines.length-1?'つぎへ':(lastLabel||'とじる');if(i<lines.length-1)b.insertAdjacentHTML('beforeend',pxi('next','nexti'));b.onclick=()=>{if(S!==owner||session!==VILLAGE_SESSION)return;const now=performance.now();if(now<DLGA.holdUntil||sacredMotionPending())return;if(DLGA.n<DLGA.full.length){DLGA.n=DLGA.full.length;dlgSet(DLGA.full,DLGA.n);DLGA.readReady=now+200;voiceStop();return}if(now<DLGA.readReady)return;sfx('next');i++;if(i<lines.length)show();else{voiceStop();d.hidden=true;DLG_KEEP=false;dlgHush(false);d.classList.remove('dtop');fitTopDlg();if(after)after();if(d.hidden)dlgGap()}};if(ch)dlgChoiceBtns(ch,bt,b,o=>{lines.splice(i+1,0,...(o.lines||[]))});else bt.appendChild(b)};
  show();
}
/* えらぶ場面：['@choice',{key,who,q,opts:[{t,v,lines}],pick}]。えらんだ答えを S.flags.choice[key] にしまい、その答えのセリフをつづけて出す。本すじはかえない */
function dlgChoiceBtns(ch,bt,next,add){for(const o of ch.opts){const c=document.createElement('button');c.className='btn';c.textContent=o.t;c.onclick=()=>{if(c.disabled||[...bt.children].some(x=>x.dataset.on))return;if(DLGA.n<DLGA.full.length){DLGA.n=DLGA.full.length;dlgSet(DLGA.full,DLGA.n);voiceStop();return}c.dataset.on='1';if(S){const F=S.flags.choice||(S.flags.choice={});F[ch.key]=o.v;dirty=true;if(ch.pick)ch.pick(o.v)}add(o);DLGA.holdUntil=0;DLGA.readReady=0;next.onclick()};bt.appendChild(c)}}
// 会話のアニメーション：話し手の大きな絵、1文字ずつの文字送り、表情
let HUSHD=null;function dlgHush(on){/* 大事なセリフのあいだだけ、音楽を小さくして、まわりを少し暗くする（つぎのふつうのセリフ・会話のおわりで、もとにもどす） */
  if(AC&&bgmG)bgmG.gain.setTargetAtTime(gainB()*(on?.25:1),AC.currentTime,on?.35:.6);
  if(on&&!HUSHD){HUSHD=document.createElement('div');HUSHD.style.cssText='position:absolute;inset:0;pointer-events:none;opacity:0;background:#0b0f0a;transition:opacity .9s ease';$('#dialog').prepend(HUSHD);/* 会話のわくより奥（村だけを暗くする） */requestAnimationFrame(()=>requestAnimationFrame(()=>{if(HUSHD)HUSHD.style.opacity='.3'}))}
  else if(!on&&HUSHD){const d=HUSHD;HUSHD=null;d.style.transition='opacity 1.1s ease';d.style.opacity='0';setTimeout(()=>d.remove(),1200)}}
let DLGEL=null;const DLGA={who:'',el:null,full:'',n:0,mood:'smile',lineT:0,enterT:0,raf:0,last:0};
const LOOKS={/* セリフの見た目。セリフの文の中に「#joy|」のように書く（空白で区切って重ねられる）。face＝顔、motion＝動き、hold＝「つぎへ」を押せるまで、lead＝文字が出はじめるまで（どちらもミリ秒）、wave＝はじめに手をふる */
  happy:{face:'joy'},sigh:{face:'sad'},shocked:{face:'shock'},teary:{face:'teary'},tear:{face:'tear'},
  hop:{motion:'joy',hold:950,lead:120},ponder:{motion:'think',hold:1050,lead:380},jolt:{motion:'shock',hold:720,lead:170},alarm:{motion:'shock',hold:850,lead:220},nod:{motion:'nod',hold:650,lead:150},droop:{motion:'sad',hold:950,lead:280},wave:{wave:true},
  joy:{face:'joy',motion:'joy',hold:950,lead:120},think:{face:'sad',motion:'think',hold:1050,lead:380},surprise:{face:'shock',motion:'shock',hold:720,lead:170},danger:{face:'shock',motion:'shock',hold:850,lead:220},
  scared:{face:'teary',motion:'shock',hold:850,lead:220},cry:{face:'teary',motion:'sad',hold:950,lead:280},worry:{face:'teary',motion:'think',hold:1050,lead:380},
  hush:{hush:true,hold:1500,lead:900,slow:1.8}};/* 大事なセリフ：音楽を小さくし、まわりを少し暗くして、ひと呼吸おいてから、ゆっくり話す */
const LOOKRX=/#([a-z ]+)\|/;
function lineLook(tx){const m=LOOKRX.exec(tx),o={face:'smile',motion:'none',hold:0,lead:0,slow:1,hush:false,wave:false,text:m?tx.replace(m[0],''):tx};if(m)for(const w of m[1].split(' '))Object.assign(o,LOOKS[w]);return o}/* セリフの印を読んで、印をのぞいた文といっしょに返す */
/* 文字送り中も、あとの文字は見えないまま場所をとっておく（枠が最初から全文の大きさになる） */
function dlgSet(full,n){const p=$('#dlgText');if(p.childNodes.length!==2||p.firstChild.nodeType!==1){p.textContent='';const a=document.createElement('span'),b=document.createElement('span');b.style.visibility='hidden';p.append(a,b)}p.firstChild.textContent=full.slice(0,n);p.lastChild.textContent=full.slice(n)}
/* 話す人ごとの文字の速さ：声の高い子は少し速く、低い声（カミサマ・ヌシ）はゆっくり（1が基本） */
function speakerPace(w){if(/ヌシ/.test(w||''))return 1.3;if(w===GOD||w==='？？？')return 1.15;const r=S&&S.res&&S.res.find(q=>q.name===w),vo=(r&&r.vr&&r.vr.vo)||(typeof KEYVR!=='undefined'&&KEYVR[w]&&KEYVR[w].vo)||1.12;return Math.max(.88,Math.min(1.12,1.12/vo))}
function dlgSpeak(w,el,tx,lk){const now=performance.now();if(w!==DLGA.who){DLGA.enterT=now}DLGA.who=w;DLGA.el=el;DLGA.full=tx;DLGA.n=0;dlgSet(tx,0);DLGA.mood=lk.face;DLGA.wave=lk.wave;DLGA.lineT=now;DLGA.last=now;DLGA.charAt=now+(lk.hush?lk.lead:0);DLGA.slow=(lk.slow||1)*speakerPace(w);DLGA.readReady=Infinity;dlgHush(lk.hush);voiceStart(w,tx.length/38+.1);
  const cv=$('#dlgPort');cv.hidden=!(el||w===GOD);
  if(S&&el){const r=S.res.find(q=>q.name===w);if(r&&!r.hidden){JUMP.set(r,now)}}/* 「…」の吹き出しは、せいれいどうしのおしゃべりだけ */
  if(!DLGA.raf)DLGA.raf=requestAnimationFrame(dlgLoop)}
// 上に出したセリフとステータスが重ならないよう、シートの高さをセリフの下までにする
function fitTopDlg(){const d=$('#dialog'),sh=document.querySelector('#sheetWrap .sheet');if(!sh)return;if(d.hidden||!d.classList.contains('dtop')){sh.style.maxHeight='';return}
  const ar=$('#app').getBoundingClientRect(),br=d.querySelector('.dlg').getBoundingClientRect();sh.style.maxHeight=Math.max(160,ar.bottom-br.bottom-8)+'px'}
function dlgLoop(now){if($('#dialog').hidden){DLGA.raf=0;return}if(DLG_KEEP)fitTopDlg();DLGA.raf=requestAnimationFrame(dlgLoop);
  const dt=Math.min(.1,(now-DLGA.last)/1000);DLGA.last=now;
  if(DLGA.n<DLGA.full.length){let changed=false;while(DLGA.n<DLGA.full.length&&now>=DLGA.charAt){const previous=DLGA.full[DLGA.n-1],ch=DLGA.full[DLGA.n++];DLGA.charAt+=(1000/38+dialoguePause(ch,previous))*(DLGA.slow||1);changed=true}if(changed)dlgSet(DLGA.full,DLGA.n);if(DLGA.n>=DLGA.full.length)DLGA.readReady=now+200}
  const cv=$('#dlgPort');if(cv.hidden)return;const c=cv.getContext('2d');c.clearRect(0,0,240,240);
  const t=now/1000,ent=Math.min(1,(now-DLGA.enterT)/260),ee=1-Math.pow(1-ent,3),talking=DLGA.n<DLGA.full.length;
  const pose=dialoguePose(DLGA.motion,now-DLGA.lineT),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches,hop=reduced?0:pose.y;
  const shake=reduced?0:pose.x,bob=Math.sin(t*2.4)*3+(talking?Math.abs(Math.sin(t*14))*-3:0);
  c.save();c.globalAlpha=ee;c.translate((1-ee)*-70+shake,0);if(!reduced){c.translate(120,190);c.rotate(pose.angle);c.translate(-120,-190)}
  if(DLGA.who===GOD){const g=SPR.god;if(g&&g.ok){const h=200,w=h*g.w/g.h;c.translate(120,232+hop+bob);c.rotate(Math.sin(t*1.6)*.04+(talking?Math.sin(t*9)*.02:0));c.drawImage(g.img,-w/2,-h,w,h)}}
  else if(DLGA.el){const md=talking?(Math.floor(now/110)%2?DLGA.mood:(DLGA.mood==='smile'?'joy':DLGA.mood==='joy'?'smile':DLGA.mood)):DLGA.mood;
    c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(120,203,44*(1-Math.min(.3,-hop/60)),8,0,0,7);c.fill();
    drawSpirit(c,DLGA.el,120,200+hop+bob,1.5,1,{t,vr:DLGA.vr,mood:md,blink:(t%3.4)<.13,anim:dialogueSpiritAnim(DLGA.motion,talking,now-DLGA.lineT,DLGA.holdUntil-DLGA.lineT,DLGA.wave,reduced),walk:false,work:false,lean:DLGA.mood==='sad'||DLGA.mood==='teary'||DLGA.mood==='tear'?.12:0})}
  c.restore()}
function shards3(){if(!S||S.cleared)return;if(WD===0&&grassReunionBlockReason())return false;/* かけらが3つそろった会話。さいごまで見てから、ヌシ様が帰ってくる（とちゅうでとじたら、つづきからでもう一度） */dialog((L=>L&&L.length?L:[[GOD,GVOICE()+'かけらが3つそろったのう。……ヌシ様が、帰ってくるぞい。']])(sevLines([['F','#hush|御神木が、光ってる……！',1,'glow'],['N','みんなの力が、ひとつにつながったねぇ。……ヌシ様が、帰ってくるよぉ。',1]])),()=>{if(S.cleared)return;if(S.res.some(q=>q.name===POKO)){S.flags.nushiDue=1;nushiReturns()}else{S.flags.nushiWait=1;toast('フタバが帰ってきたら、ヌシ様がすがたをあらわす','warn')}})}
function gameOver(){dialog(['せいれいたちが、みんな消えてしもうた…。土地もしずかになってしもうたのう。','もう一度、この土地に村をつくってみようかの。こんどは畑と食料を多めにな。'],()=>newGame(WD),'やりなおす',GOD)}/* いまのステージを、はじめから */

let hudT=0;
let PDOWN=false,craftSig='';addEventListener('pointerdown',()=>{PDOWN=true},true);for(const ev of['pointerup','pointercancel'])addEventListener(ev,()=>{setTimeout(()=>{PDOWN=false},60)},true);
let SKIP=false,ALI=-1;/* 「コワイノ」をぜんぶ追いはらった夜は、朝までとばせる */

const canSkip=()=>!SKIP&&isNight()&&S.enemyOn&&(!S.res.length||S.nightHad&&!S.enemies.length&&(S.cleared||!S.nushi));/* クリア後も、その夜のコワイノをぜんぶ追いはらってから *//* 全員いなくなったときも、朝までとばせる */
function updHUD(){
  if(S){const was=S.res4Since,tell=S.bossWarn!=null&&!S.cleared&&!S.bossKills;/* オオカゲを追いはらったあとは、言わない *//* オオカゲの来る時期を、せいれいが減ったとき・もどったときに伝える */
    const hasFire=S.res.some(q=>q.elem==='fire');/* 火の子が1人もいないときも、オオカゲは来ない */
    if(S.res.length<4||!hasFire){S.res4Since=null;if(was!=null&&tell&&S.enemyOn&&$('#dialog').hidden)dialog(S.res.length<4?[[GOD,'なかまが減ってしもうたのう…。'],[GOD,'もう少しなかまが増えて、村がおちつくまでは、オオカゲも来んはずじゃ。それまでに、なかまを集めて備えるのじゃぞ。']]:[[GOD,'火のせいれいが、いなくなってしもうたのう…。'],[GOD,'オオカゲとたたかえる火のせいれいがもどるまでは、オオカゲも来んはずじゃ。火のせいれいをむかえて、備えるのじゃぞ。']])}/* 火の子だけがいなくなったときは、なかまが減ったとは言わない */
    else if(was==null){S.res4Since=dayNo();if(tell&&S.enemyOn&&S.lastRes4!=null&&$('#dialog').hidden)dialog([[GOD,'なかまが、また増えてきたのう。'],[GOD,'村がおちついてきたころ、オオカゲがまた来るかもしれん。みんなを守る備えを、しっかり整えておくんじゃ。']])}
    S.lastRes4=S.res.length>=4&&hasFire?1:S.lastRes4}
  {const sb=$('#skipBtn'),v=canSkip();if(sb.hidden===v)sb.hidden=!v}
  const h=hour(),m=Math.floor(clk()%60);
  $('#dayLbl').innerHTML=(S.rain?pxi('rain','wx wx-rain')+'雨':rainbowToday()?pxi('rainbow','wx wx-bow')+'虹':pxi('sun','wx wx-sun')+'晴れ')+(S.today?'・'+DAYEV[S.today][1]:'')+(nightVarNow()?'・'+NIGHTVAR[nightVarNow()]:'')+(hornNow()?'・角笛の夜':'')+(herbNow()?'・まよけの夜':'');/* 何日目は出さない（きろくで見る） */
  {const tx=String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor(m/10)*10).padStart(2,'0'),el=$('#timeLbl');if(el.dataset.t!==tx){el.dataset.t=tx;el.innerHTML=[...tx].map(ch=>ch===':'?'<i class="c">:</i>':'<i>'+ch+'</i>').join('')}}/* 数字を1文字ずつ同じはばのわくに入れ、時刻で表示がずれないようにする */
  {const gs=$('#guardStatus'),night=true;/* 守りの光は、昼も夜も（昼は木や岩に） */gs.hidden=!night;if(LIGHTARM&&LIGHTCD<=0&&S.pt<1){LIGHTARM=false;dockSync()}gs.classList.toggle('armed',LIGHTARM);if(night){const gc=gs.querySelector('.gc');let p=1;if(LIGHTCD>0)p=1-LIGHTCD/(LIGHTCDL[S.lv]||10);else if(S.pt<1)p=0;gc.style.setProperty('--gp',(p*360)+'deg')}}
  {const ab=$('#areaBtn'),on=!!(S.flags&&S.flags.areaSkill)&&isNight();ab.hidden=!on;if(on){let p=1;if(AREACD>0)p=1-AREACD/5;else if(S.pt<3)p=0;if(AREAARM&&(AREACD>0||S.pt<3))AREAARM=false;ab.querySelector('.gc').style.setProperty('--gp',(p*360)+'deg');ab.classList.toggle('armed',AREAARM)}else AREAARM=false}
  const L=S.lv,a=LV_XP[L-1],b=L>=maxLv()?a:LV_XP[L]??a;$('#lvLbl').textContent=L;$('#xpBar').style.width=(b>a?clamp((S.totalPt-a)/(b-a),0,1)*100:100)+'%';$('#xpTxt').textContent=b>a?clamp(Math.floor(S.totalPt-a),0,b-a)+' / '+(b-a):'MAX';/* 入りきらない数は出さない（レベルアップを待っているとき） */
  if(PTW.s===S&&S.pt<PTW.v&&!PTW.q)sfx('power');PTW.s=S;PTW.v=S.pt;PTW.q=false;/* カミサマにパワーをわたして何かをもらったとき（光・はどうはべつの音） */
  {const it=S.seenIt||(S.seenIt={});for(const k in S.mat)if(S.mat[k]>0)it['m:'+k]=1;for(const k in S.fs||{})if(S.fs[k]>0)it['f:'+k]=1}/* 図鑑のアイテム：一度でも持った素材・食べ物 */
  $('#pt').textContent=S.pt;$('#food').textContent=S.food;$('#woodN').textContent=S.mat.wood||0;$('#matN').textContent=matTot();/* 素材は種類が多いので、上には総量だけ */$('#stoneN').textContent=S.mat.stone||0;{const bn=$('#bambooN'),bi=$('#bambooIc'),on=bambooOn();if(bn){bn.textContent=S.mat.bamboo||0;bn.hidden=!on;bi.hidden=!on;if(!bi.src)bi.src=ICONS.bamboo}}{const fc=foodCap(),mc=matCap(),fb=$('#foodBar'),mb=$('#matBar');fb.style.width=(fc?Math.min(100,S.food/fc*100):0)+'%';fb.style.background=fc&&S.food>=fc?'#d9a441':'';mb.style.width=(mc?Math.min(100,matTot()/mc*100):0)+'%';mb.style.background=mc&&matTot()>=mc?'#d9a441':'#c9a46a'}$('#resN').textContent=S.res.length;$('#revLbl').textContent='みどり '+GRASSN;
  const hungry=S.res.filter(r=>r.hunger<20).length,en=S.enemies.filter(e=>e.spawned).length;
  const al=$('#alert');const msg=[];if(en)msg.push('「コワイノ」 '+en+'体');if(hungry)msg.push('おなかがすいたせいれい '+hungry+'人');if(S.food===0&&S.enemyOn)msg.push(cnt('stor')?'食料ゼロ':'食料箱がありません');/* 足りない理由もいっしょに出す */
  al.hidden=!msg.length;al.textContent=msg.join('・');
  if(PDOWN){}/* 押している最中に作りなおすと、タップが消えてしまう */
  else if(sheet==='craft'){const sig=S.orders.map(o=>o.id+':'+o.worker).join(',')+'|'+CRAFT_TABS[craftTab][1].map(id=>(S.pt>=BL[id].pc?1:0)+''+(matOK(BL[id].mat)?1:0)+inv(id)+(lvOK(id)?1:0)).join('')+'|'+(S.mat.wood||0)+','+(S.mat.stone||0)+','+(S.mat.bamboo||0)+'|'+craftTab+'|'+S.lv+'|'+Object.keys(S.recipes).length;
    if(sig!==craftSig){craftSig=sig;renderSheet()}else document.querySelectorAll('#sheetBody .paper .bar i').forEach((b,n)=>{const o=S.orders[n];if(o)b.style.width=Math.min(100,o.prog/o.need*100)+'%'})}/* 依頼ボードは、変わったときだけ作りなおす */
  else if(sheet==='people'||sheet==='res'||sheet==='house')renderSheet();
  else if(sheet==='stock'){const sig=Object.entries(S.fs).join()+'|'+Object.entries(S.mat).join()+'|'+foodCap()+','+matCap();if(sig!==STOCKSIG){STOCKSIG=sig;renderSheet()}}/* 数が変わったときだけ、そうこを描きなおす */
}

/* ---------- はじまり ---------- */
let started=false,titleDrift=0,STOCKSIG='';
function showUI(on){$('#topUI').hidden=!on;$('#botUI').hidden=!on}
/* 引き継ぎ：便利な道具（ひろびろハケ・かたどりスタンプ・つけかえトンカチ・ひっこしミトン）だけは、ほかの土地でもらっていれば使える */
function syncTools(s){for(const L of LIVE)if(L&&L!==s){if(L.bulk)s.bulk=true;if(L.stamps)s.stamps=true;if(L.swap)s.swap=true;if(L.dig)s.dig=true;if(L.mover)s.mover=true;if((s.world||0)!==0&&(L.areaSkill||L.flags&&L.flags.areaSkill))(s.flags||(s.flags={})).areaSkill=true}}/* 「こもれびのまもり」も、草原でおぼえたら、ほかのステージで使える（草原は、はじめからやりなおしても、自分でおぼえなおす） */
function villageTimeout(fn,delay){const owner=S,session=VILLAGE_SESSION;const run=()=>{if(S!==owner||session!==VILLAGE_SESSION)return;if(typeof STORY_REPLAY_SHELL!=='undefined'&&STORY_REPLAY_SHELL){setTimeout(run,150);return;}fn();};return setTimeout(run,delay)}
function resetVillageTransient(){if(typeof fogRevealReset==='function')fogRevealReset();oreWakeReset();if(typeof cancelSacredPlay==='function')cancelSacredPlay();cancelSacredQuiet(false);sacredEndDirection(false);VILLAGE_SESSION++;if(typeof LANDFX!=='undefined')LANDFX.clear();if(camAnim?.sacred||camAnim?.storyGoal)camAnim=null;endClap();NUSHI_RUN=false;DEPART_RUN=false;GATHER_HOLD=false;STAGEWAIT=0;WELCOME_RUN=false;GUEST=null;GUESTRUN=false;resetQuestPrompts();DLGQ.length=0;DLGGAP=0;DLGCUR='';DLGTAP=-1e9;DLGN.clear();voiceStop();dlgHush(false);$('#dialog').hidden=true;$('#dlgBtns').replaceChildren();DLG_KEEP=false;NEWQ.length=0;NEWRES=null;HOLD.clear();RLVQ.length=0;LVQ=null;for(const id of['#lvup','#rlv'])$(id).hidden=true;document.querySelectorAll('.askyn').forEach(e=>e.remove());if(S)for(const r of S.res)QUEST_VISITS.delete(r)}/* もちこさない待ち状態だけを消す。途中の会話は pendTalk に残す */
function introAtStump(){/* 草原のはじめ：フタバは切り株の前で寝ている */const f=S.res.find(r=>r.name===POKO);if(!f||S.sacredRoot==null)return;const s=fieldStump(S.sacredRoot);for(const k of [s+W,s+W-1,s+W+1,s+2*W]){if(walk(k)&&!S.obj[k]){f.x=k%W+.5;f.y=(k/W|0)+.5;return}}}
function newGame(w){w=w||0;if(sheet!=null)closeSheet();recSync();resetVillageTransient();setWorld(w);try{KV.removeItem(SAVE_KEYS[w])}catch(e){}resv.clear();BAN.clear();S=newState(w);if(w===0)fogInit(S);/* 草原は、まん中のほかは霧 */LIVE[w]=S;syncTools(S);dirty=true;recount();kwrSync();recSync();if(sacredRootEnsure(S.res.find(r=>!r.hidden))!=null){recount();introAtStump()}/* 御神木の切り株は、はじめからある */weedMorning(true);/* はじめから雑草100本・枝15本がある */undoStack=[];renderQuest();applyFeats();setMode('look');$('#title').hidden=true;startPrologue()}
function startPrologue(){
  {const ov=document.getElementById('deptLd');if(ov)ov.remove()}/* 出発の画面を、まっくらなプロローグにつなぐ */
  showUI(false);started=false;let i=0;const pro=$('#pro');pro.style.transition='none';pro.hidden=false;pro.style.opacity='1';void pro.offsetWidth;pro.style.transition='';/* フェードせずに、すぐまっくらにする（前のデータの画面が一瞬見えないように） */
  cam.z=minZ();centerOn(CX*TS,CY*TS);
  const show=()=>{const p=$('#proText');const PR=PROS[WD];const tx=lineLook(PR[i][1]).text;/* 「#wave|」などの印は出さない */$('#proWho').textContent=PR[i][0];p.textContent=tx;p.style.animation='none';void p.offsetWidth;p.style.animation='';voiceStart(PR[i][0],tx.length/30+.1)};
  const end=()=>{voiceStop();pro.onclick=null;const S0=S,go=()=>{if(S!==S0)return;if(!stageReady()){setTimeout(go,100);return}/* マップを作りおわるまで、まっくらなまま待つ（プロローグのあいだに作りはじめている。ムービーの途中で読みこみが出ないように） */try{render(performance.now())}catch(e){}/* うすくなる前に、新しい村をかいておく（前のデータの画面が一瞬見えないように） */pro.style.opacity='0';setTimeout(()=>{pro.hidden=true;arrive()},800)};go()};
  pro.onclick=e=>{if(e.target.id==='proSkip')return;i++;if(i<PROS[WD].length)show();else end()};
  $('#proSkip').onclick=end;show();
}
const arriveF=()=>WD===0&&S.sacredRoot!=null&&S.res.find(r=>r.name===POKO);/* 草原のはじめは、カミサマと、切り株の前のフタバが入るように */
function arrive(){
  stageMusic();
  /* はじめての村へ降りるカメラズームは残す。タイトルの背景描画とは別の演出。 */
  camAnim={fz:cam.z,tz:homeZ(),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:arriveF()?(CX+arriveF().x)/2*TS:CX*TS,ty:arriveF()?(CY-3+arriveF().y-1)/2*TS:(CY-3)*TS,t:0,dur:2.2,done:()=>{
    S.godShown=true;burst(Math.floor(godY())*W+Math.floor(godX()),'furn');sfx('poof');
    setTimeout(()=>{started=true;showUI(true);{const f=WD===0&&S.res.find(r=>r.name===POKO);if(f){f.nap=true;RHOLD.set(f,performance.now()+6e5)}}/* 草原のはじめ：フタバは、すわってうとうと */const run=()=>dialog((WD===FREE?INTROFL():INTROS[WD]),()=>{for(const r of S.res)if(r.nap){r.nap=false;RHOLD.set(r,0)}S.introSeen=true;save()});/* さいごまで見てから「見た」に */if(WD===0){showUI(false);sceneShift('mem',dreamScene,()=>{showUI(true);run()})}else run()},500)}};/* 草原のはじめに、めざす村のすがた（夢）を見せる */
}
