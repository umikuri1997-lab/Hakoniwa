import { wormAt as __wormAtFn } from './worm.js';
import dreamMachines from '../docs/images/machines.png';
import lilyMusic from '../assets/music/lily-paddling-down-the-stream.mp3';
import sunnyMusic from '../assets/music/sunny-stroll.mp3?optional';
import veilMusic from '../assets/music/veil-of-dreams.mp3';
import pixelFont400 from '../assets/fonts/pixelify-sans-latin-400-normal.woff2';
import pixelFont700 from '../assets/fonts/pixelify-sans-latin-700-normal.woff2';
import { bakeWorldAtlas, buildWorldAtlas } from './atlas.js';
import { CAST, paintPerson } from './people.js';
import { ATLAS_S, CH, FLAG_Q, PAD, PADW, PATHW } from './constants.js';
import { SURFACE } from './surface.js';
import { ACTOR } from './fauna.js';
import { BiomeMusic, MUSIC_VOLUME, travellerMoved } from './music.js';
import { PALETTE, RAMP, RAMP_ID, warmShift } from './palette.js';
import { FrostwoodWorld } from './render.js';
import { hashf } from './rng.js';
import { PLAYER_H } from './scale.js';
import { SPELLS, SPELL_ORDER, cooldownLeft } from './spell.js';
import { solarPositionForClock, TAU } from './sunlight.js';
import { LAYERS, makeWorldGen, TIERS } from './worldgen.js';



/* ═══════════════════════════════ THE GAME LOOP ═══════════════════════════ */
const $=id=>document.getElementById(id);
const cv=$('view');
$('vision-mascot').src=dreamMachines;

/* Pixelify Sans (OFL) + authored title screenshots ship as data URLs so the
   single-file build stays offline. */
(function installTitleAssets(){
  const css=document.createElement('style');
  css.textContent=
    `@font-face{font-family:'Pixelify Sans';font-style:normal;font-weight:400;`+
    `font-display:swap;src:url(${pixelFont400}) format('woff2')}`+
    `@font-face{font-family:'Pixelify Sans';font-style:normal;font-weight:700;`+
    `font-display:swap;src:url(${pixelFont700}) format('woff2')}`;
  document.head.appendChild(css);
})();

function boom(title,detail){
  const el=$('boom');
  el.innerHTML='<b>'+title+'</b><br><br>'+detail;
  el.style.display='block'; showLoad(false);
}
function showLoad(on){
  $('load').style.display=on?'flex':'none';
  document.body.classList.toggle('loading',!!on);
  if(on) $('barf').style.width='10%';
}
function setPlaying(on){
  document.body.classList.toggle('playing',on);
  document.body.classList.toggle('menu',!on);
  if(on) document.body.classList.remove('menu-open','title-fade');
  if(!on){
    $('panel').classList.remove('open');
    for(const k in input) input[k]=0;
  }
}
function openMenuOverlay(){
  if(!playing||entering) return;
  document.body.classList.add('menu-open');
  document.body.classList.remove('title-fade');
  $('panel').classList.remove('open');
  for(const k in input) input[k]=0;
  $('menu-btn').setAttribute('aria-expanded','true');
  $('menu-btn').setAttribute('aria-label','Close menu');
}
function closeMenuOverlay(){
  document.body.classList.remove('menu-open','title-fade');
  $('menu-btn').setAttribute('aria-expanded','false');
  $('menu-btn').setAttribute('aria-label','Open menu');
}
function toggleMenuOverlay(){
  if(document.body.classList.contains('menu-open')) closeMenuOverlay();
  else openMenuOverlay();
}
function shouldSkipMenu(){
  const q=new URLSearchParams(location.search);
  return q.has('at')||q.has('poi')||q.get('menu')==='0'||!!navigator.webdriver;
}
function preferMobileRes(){
  if(!matchMedia('(pointer:coarse)').matches) return;
  const short=Math.min(innerWidth,innerHeight);
  if(short<700) $('res').value='480x270';
  else if(short<900) $('res').value='640x360';
}
preferMobileRes();
(function(){
  try{
    const t=document.createElement('canvas');
    if(!(t.getContext('webgl2')||t.getContext('webgl')))
      boom('This page needs WebGL, and this browser did not provide it.',
        'Open the file in Chrome, Edge, Safari or Firefox. If you are looking at it '+
        'inside another app’s file preview, save it to disk and open it in a real browser.');
  }catch(e){ boom('WebGL check failed.', String(e)); }
})();

let W;
try{ W=new FrostwoodWorld(cv); }
catch(e){ boom('The renderer failed to start.', String(e&&e.message||e)); throw e; }

const music=new BiomeMusic({lily:lilyMusic,sunny:sunnyMusic,veil:veilMusic});
const musicEl=$('music'),musicTrack=$('music-track');
const musicVolume=$('music-volume'),worldTitle=$('world-title'),movementHint=$('hint');
musicVolume.min=MUSIC_VOLUME.min;
musicVolume.max=MUSIC_VOLUME.max;
musicVolume.step=MUSIC_VOLUME.step;
musicVolume.value=MUSIC_VOLUME.default;
const musicBars=[...document.querySelectorAll('.music-bar')];
const musicLevels=new Float32Array(musicBars.length);
const musicShown=new Float32Array(musicBars.length);
function syncMusicControl(){
  musicEl.classList.toggle('off',!music.enabled);
  musicEl.classList.toggle('unavailable',!music.available);
  musicEl.dataset.scene=music.sceneId;
  musicEl.setAttribute('aria-pressed',String(music.enabled));
  musicEl.setAttribute('aria-label',music.enabled?'Stop music':'Play music');
  musicTrack.textContent=music.enabled?music.title:'Music off';
}
function syncMusicScene(){
  if(!W.scene) return;
  if(W.scene.id!==music.sceneId){
    music.syncScene(W.scene.id);
    syncMusicControl();
  }
  const worldChoice=document.querySelector(`.world[data-scene="${W.scene.id}"]`);
  worldTitle.dataset.scene=W.scene.id;
  movementHint.dataset.scene=W.scene.id;
  promptEl.dataset.scene=W.scene.id;
  spellBar.dataset.scene=W.scene.id;
  worldTitle.replaceChildren(
    worldChoice.querySelector('.world-icon').cloneNode(true),
    worldChoice.querySelector('.world-name').cloneNode(true),
  );
}
/* The prompt names the verb the scene is offering, and nothing else: it does
   not know what a camel is. Touched only when the verb changes. */
const promptEl=$('prompt'),promptAction=promptEl.querySelector('.hint-action');
let promptShown=null;
function syncPrompt(){
  const label=W.scene&&W.scene.promptLabel?W.scene.promptLabel():null;
  if(label===promptShown) return;
  promptShown=label;
  if(label) promptAction.textContent=label;
  promptEl.classList.toggle('on',!!label);
}
function clearPrompt(){ promptShown=null; promptEl.classList.remove('on'); }
/* Mobile has no Space, so the pill itself is the button there. */
promptEl.addEventListener('click',()=>{ if(playing) input.interact=1; });

function placeWorldTitle(){
  const top=cv.getBoundingClientRect().top;
  worldTitle.style.top=Math.round(Math.max(8,top+8))+'px';
}

/* The axes are held; `interact` is a single press. It is raised on keydown and
   cleared by the loop after one step, so a leaned-on key mounts once. */
const input={left:0,right:0,up:0,down:0,run:0,interact:0,cast:0};
const KEYS={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',
            ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
addEventListener('keydown',e=>{
  const visionOpen=$('vision').classList.contains('open');
  if(e.code==='Escape'&&visionOpen){
    closeVision(); e.preventDefault(); return;
  }
  if(visionOpen){
    if(KEYS[e.code]||e.code==='KeyM'||e.code==='Space'
      ||e.code==='ShiftLeft'||e.code==='ShiftRight'){
      e.preventDefault();
    }
    return;
  }
  if(e.code==='Escape'&&document.body.classList.contains('menu-open')){
    closeMenuOverlay(); e.preventDefault(); return;
  }
  if(!playing&&menuLive&&!entering&&KEYS[e.code]){
    music.unlock(); enterWorld('frostwood'); e.preventDefault(); return;
  }
  if(playing&&document.body.classList.contains('menu-open')&&KEYS[e.code]){
    closeMenuOverlay();
  }
  if(e.code==='ShiftLeft'||e.code==='ShiftRight') input.run=1;
  /* Space scrolls the page if it is left alone, and auto-repeat would offer
     the same mount several times a second. */
  if(e.code==='Space'){
    if(playing&&!e.repeat&&!document.body.classList.contains('menu-open'))
      input.interact=1;
    e.preventDefault();
  }
  if(e.code==='KeyM'){ mapOn=!mapOn; $('map').style.display=mapOn?'block':'none'; }
  /* A digit casts, in SPELLS slot order. One press, like Space. */
  const slot=/^Digit[1-9]$/.test(e.code)?+e.code.slice(5):0;
  /* a digit typed into the seed field is a digit */
  const typing=/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||'');
  if(slot&&slot<=SPELL_ORDER.length&&playing&&!typing&&!e.repeat
    &&!document.body.classList.contains('menu-open')){
    music.unlock(); input.cast=slot; e.preventDefault();
  }
  const k=KEYS[e.code]; if(k){ music.unlock(); input[k]=1; e.preventDefault(); hideHint(); }
});
addEventListener('keyup',e=>{
  if($('vision').classList.contains('open')){
    if(e.code==='ShiftLeft'||e.code==='ShiftRight') input.run=0;
    const k=KEYS[e.code]; if(k) input[k]=0;
    if(k||e.code==='ShiftLeft'||e.code==='ShiftRight') e.preventDefault();
    return;
  }
  if(e.code==='ShiftLeft'||e.code==='ShiftRight') input.run=0;
  if(e.code==='Space') e.preventDefault();
  const k=KEYS[e.code]; if(k){ input[k]=0; e.preventDefault(); }
});
addEventListener('blur',()=>{ for(const k in input) input[k]=0; });

/* touch: floating stick in a bottom zone — touch anywhere there, drag to walk.
   No RUN control on mobile. */
if(matchMedia('(pointer:coarse)').matches){
  document.body.classList.add('touch');
  const pad=$('pad'), stick=$('stick'), nub=$('nub');
  const REACH=34, DEAD=8, AXIS=0.38, HALF=36;
  let stickId=null, ox=0, oy=0;
  const clearAxes=()=>{
    input.left=input.right=input.up=input.down=0;
    nub.style.transform='none';
  };
  const resetStick=()=>{
    stick.style.left='50%';
    stick.style.top='auto';
    stick.style.bottom='calc(26px + env(safe-area-inset-bottom, 0px))';
    stick.style.marginLeft=(-HALF)+'px';
    stick.style.marginTop='0';
    clearAxes();
  };
  const placeStick=(clientX,clientY)=>{
    const r=pad.getBoundingClientRect();
    stick.style.left=(clientX-r.left)+'px';
    stick.style.top=(clientY-r.top)+'px';
    stick.style.bottom='auto';
    stick.style.marginLeft=(-HALF)+'px';
    stick.style.marginTop=(-HALF)+'px';
  };
  const set=(dx,dy)=>{
    const d=Math.hypot(dx,dy), m=Math.min(1,d/REACH);
    if(d<DEAD){ clearAxes(); return; }
    const a=Math.atan2(dy,dx), c=Math.cos(a), s=Math.sin(a);
    input.right=c>AXIS?1:0; input.left=c<-AXIS?1:0;
    input.down =s>AXIS?1:0; input.up  =s<-AXIS?1:0;
    nub.style.transform='translate('+(c*REACH*m)+'px,'+(s*REACH*m)+'px)';
  };
  pad.addEventListener('touchstart',e=>{
    if(stickId!=null||!playing||document.body.classList.contains('menu-open')) return;
    const t=e.changedTouches[0]; stickId=t.identifier;
    ox=t.clientX; oy=t.clientY;
    placeStick(ox,oy);
    music.unlock(); set(0,0); e.preventDefault(); hideHint();
  },{passive:false});
  pad.addEventListener('touchmove',e=>{
    for(const t of e.changedTouches) if(t.identifier===stickId) set(t.clientX-ox,t.clientY-oy);
    e.preventDefault();
  },{passive:false});
  const endStick=e=>{
    for(const t of e.changedTouches) if(t.identifier===stickId){
      stickId=null; resetStick();
    }
    e.preventDefault();
  };
  pad.addEventListener('touchend',endStick,{passive:false});
  pad.addEventListener('touchcancel',endStick,{passive:false});
  $('hint').textContent='drag anywhere along the bottom to walk';
  promptEl.querySelector('.hint-key').textContent='TAP';
}
/* The spell bar: one button per SPELLS row. It is the touch control and the
   key legend. `data-wait` dims a spell that is still cooling. */
const spellBar=$('spells');
const spellButtons=SPELL_ORDER.map((id)=>{
  const b=document.createElement('button');
  b.type='button'; b.className='spell';
  const key=document.createElement('span'); key.className='hint-key';
  key.textContent=String(SPELLS[id].slot);
  const name=document.createElement('span'); name.className='hint-action';
  name.textContent=SPELLS[id].label;
  b.append(key,name);
  b.addEventListener('click',()=>{ if(playing){ music.unlock(); input.cast=SPELLS[id].slot; } });
  spellBar.appendChild(b);
  return b;
});
function syncSpells(){
  const state=W.scene&&W.scene.spells;
  if(!state) return;
  SPELL_ORDER.forEach((id,i)=>{
    const wait=cooldownLeft(state,id,W.time)>0;
    if(spellButtons[i].classList.contains('wait')!==wait)
      spellButtons[i].classList.toggle('wait',wait);
  });
}
let hintGone=false;
function hideHint(){ if(hintGone) return; hintGone=true;
  setTimeout(()=>{ $('hint').style.opacity=0; },1400); }

function opts(){
  const query=new URLSearchParams(location.search);
  return {density:+$('den').value, snow:+$('snow').value, lake:+$('lake').value,
          light:-142, fog:+$('fog').value,
          /* INVARIANT: ?at selects the initial scene; portal arrival is explicit world state. */
          scene:query.get('at')||'frostwood',
          poi:query.get('poi')||null,
          /* ?wear=felt-dome,windlass-rope: item ids from src/gear.js */
          wear:(query.get('wear')||'').split(',').filter(Boolean)};
}
function ui(){
  return {fog:+$('fog').value, quant:$('c-quant').checked,
          precipitation:$('c-precipitation').checked, wind:+$('wind').value,
          shadows:$('c-shadows').checked};
}
function applyLight(){
  W.setLight(+$('az').value,+$('el').value,+$('warm').value);
  W.setLantern($('c-lamp').checked,0.26);
}

/* Selected resolution is the authored framing. VIEW_OUT pulls the camera back
   so cover-fit still fills the screen — a phone's tall aspect especially —
   while showing more of the world.
   Higher resolution ⇒ more world pixels in view (zoomed out); lower ⇒ closer.

   ONE — NO PULL-BACK AT ALL. The selected resolution is what gets drawn: at
   320x180 the buffer is 320x180, and the authored framing is the framing you
   see. Every pull-back trades that composition away for fit, and the two that
   were tried both cost more than they bought: 1.3 turned the close view into
   416x234, a different composition rather than the same one seen from further
   back, and even 1.1's 352x198 moved `PLAYER_H = 26 px` to a smaller fraction
   of the frame. What covers a tall phone aspect instead is `fitZoom`'s cover
   fit, which crops the long axis rather than reframing the world.

   `even()` still keeps both axes on integers so `fitZoom` stays an integer
   scale — at 1 it is already a no-op, and it is what makes any future
   VIEW_OUT safe. */
const VIEW_OUT=1;
function even(n){ return Math.max(2,Math.round(n/2)*2); }
function gridSize(){
  const [w,h]=$('res').value.split('x').map(Number);
  return [even(w*VIEW_OUT), even(h*VIEW_OUT)];
}
function fitZoom(w,h){
  return Math.max(1,Math.min(8,Math.ceil(Math.max(innerWidth/w,innerHeight/h))));
}
/* INVARIANT: frame lighting/uniforms come from the active world scene. */
function applyFit(){
  const [w0,h0]=gridSize();
  /* `w`,`h` are the live outdoor grid — the buffer about to be drawn, so the
     canvas stays a whole multiple of it. */
  const w=(W&&W.W)||w0, h=(W&&W.H)||h0;
  const z=Math.max(1,Math.min(fitZoom(w0,h0),
                              Math.ceil(Math.max(innerWidth/w,innerHeight/h))));
  cv.style.width=(w*z)+'px'; cv.style.height=(h*z)+'px';
  placeWorldTitle();
}

let stats='';
let playing=false;
let menuLive=false;
let entering=false;
const IDLE_INPUT={left:0,right:0,up:0,down:0,run:0};
const TITLE_FADE_MS=550;
function optsFor(sceneId,poi){
  const base=opts();
  return {...base,scene:sceneId||base.scene,poi:poi===undefined?base.poi:poi};
}
function buildScene(sceneId,poi,done){
  const [w,h]=gridSize();
  applyFit();
  const t0=performance.now();
  const info=W.build((+$('seed').value)>>>0,w,h,optsFor(sceneId,poi));
  syncMusicScene();
  stats=`${w}×${h} · ${(performance.now()-t0).toFixed(0)} ms\n`+
        `${info.sprites} sprites · atlas ${info.atlas}\n${info.palette} colours locked`;
  applyLight();
  if(done) done(info);
}
function rebuild(){
  showLoad(true);
  requestAnimationFrame(()=>setTimeout(()=>{
    buildScene(opts().scene,opts().poi,()=>{
      $('barf').style.width='100%';
      showLoad(false);
    });
  },30));
}
function beginPlayChrome(){
  menuLive=false;
  playing=true;
  document.body.classList.remove('title-fade');
  setPlaying(true);
  applyFit();
  window.__ready=true;
}
function fadeTitleThen(done){
  document.body.classList.add('title-fade');
  setTimeout(done,TITLE_FADE_MS);
}
function showTitleMenu(){
  playing=false;
  entering=false;
  menuLive=true;
  document.body.classList.remove('title-fade','menu','playing','menu-open');
  /* Stay on the loader until Frostwood has painted — no empty menu flash. */
  showLoad(true);
  const needBuild=!W.scene||W.scene.id!=='frostwood';
  const reveal=()=>{
    applyFit();
    requestAnimationFrame(()=>{
      document.body.classList.add('menu');
      showLoad(false);
    });
  };
  if(!needBuild){ reveal(); return; }
  requestAnimationFrame(()=>setTimeout(()=>{
    try{
      buildScene('frostwood',null,()=>{
        $('barf').style.width='100%';
        reveal();
      });
    }catch(e){ boom('World generation failed.', String(e&&e.stack||e)); throw e; }
  },30));
}
function enterWorld(sceneId){
  if(entering) return;
  entering=true;
  const url=new URL(location.href);
  if(sceneId) url.searchParams.set('at',sceneId);
  url.searchParams.delete('menu');
  history.replaceState(null,'',url);
  hintGone=false; $('hint').style.opacity=1;
  clearPrompt();
  const want=sceneId||opts().scene||'frostwood';
  const overlay=document.body.classList.contains('menu-open');
  const fromBootMenu=menuLive&&!playing;
  const sameScene=W.scene&&W.scene.id===want;

  const finishBuild=()=>{
    showLoad(true);
    requestAnimationFrame(()=>setTimeout(()=>{
      try{
        musicStarted=false;
        buildScene(want,opts().poi,()=>{
          $('barf').style.width='100%';
          showLoad(false);
          beginPlayChrome();
          entering=false;
        });
      }catch(e){ entering=false; boom('World generation failed.', String(e&&e.stack||e)); throw e; }
    },30));
  };

  /* Same world: just dismiss the overlay / boot menu onto the live scene. */
  if(sameScene&&(fromBootMenu||overlay)){
    fadeTitleThen(()=>{
      if(fromBootMenu) beginPlayChrome();
      else{ closeMenuOverlay(); document.body.classList.remove('title-fade'); }
      entering=false;
    });
    return;
  }
  if(fromBootMenu||overlay){
    fadeTitleThen(finishBuild);
    return;
  }
  musicStarted=false;
  finishBuild();
}
function returnToTitle(){
  /* In-play Menu is a non-destructive overlay on the current scene. */
  if(entering) return;
  if(playing) toggleMenuOverlay();
}
function resizeOnly(){
  const [w,h]=gridSize();
  applyFit(); W.resize(w,h); W.ensure(true); applyLight();
}

/* ── the minimap ──────────────────────────────────────────────────────────
   Read straight out of the chunks that are already resident, so it costs
   nothing to generate and can never disagree with the world you are standing
   in. It also happens to be the fastest way to see whether the streaming is
   producing a coherent landscape or a patchwork.                          */
let mapOn=false;
const mapC=document.createElement('canvas');
mapC.id='map'; mapC.width=148; mapC.height=148;
mapC.style.cssText='position:fixed;right:12px;bottom:12px;width:148px;height:148px;'+
  'image-rendering:pixelated;z-index:22;display:none;border:1px solid #2a3546;background:#0b0f16';
document.body.appendChild(mapC);
const mctx=mapC.getContext('2d');
let mapT=0;
function drawMap(){
  const S=4, N=148;
  const img=mctx.createImageData(N,N);
  const d=img.data;
  const px=W.px, py=W.py;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const wx=Math.round(px+(i-N/2)*S), wy=Math.round(py+(j-N/2)*S);
    const c=W.chunkAt(wx,wy); const o=(j*N+i)*4;
    let r=11,g=15,b=22;
    if(c){
      const lx=wx-c.ox, ly=wy-c.oy;
      if(lx>=0&&ly>=0&&lx<CH&&ly<CH){
        if(c.water[ly*CH+lx]){ r=30;g=51;b=82; }
        else{
          /* the fourth reader of the surface enum, and the last one that had a
             hardcoded colour in it. Two RGB triples became a lookup. */
          const f=Math.round(c.tex.image.data[(ly*CH+lx)*4+3]/FLAG_Q);
          const m=(SURFACE[f]||SURFACE[0]).map;
          r=m[0]; g=m[1]; b=m[2];
        }
      }
    }
    d[o]=r; d[o+1]=g; d[o+2]=b; d[o+3]=255;
  }
  const c0=(N/2|0)*N+(N/2|0);
  for(const k of [c0,c0-1,c0+1,c0-N,c0+N]){ d[k*4]=200;d[k*4+1]=90;d[k*4+2]=105;d[k*4+3]=255; }
  mctx.putImageData(img,0,0);
}

let last=performance.now(), frames=0, fpsT=0, fps=0;
let musicStarted=false,musicUiT=0;
let fitW=0, fitH=0;
function loop(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  if(!W.scene||(!playing&&!menuLive)){ requestAnimationFrame(loop); return; }
  if(playing&&W.lat===undefined){
    /* A sunless world: the scene states its light and the renderer takes it. */
    W.setLight(0,0,0);
  }else if(playing&&$('c-day').checked){
    /* SOURCE: date and time come from the same canonical clock that advances
       life schedules and off-screen commitments. */
    const sp=solarPositionForClock(W.lat,W.clock);
    const el=Math.max(4,Math.min(86,sp.altDeg));
    const az=sp.azDeg;
    const WARM_K=0.62;
    const m0=1/Math.sin(Math.max(4,90-Math.abs(W.lat-23.45))*Math.PI/180);
    const m=1/Math.sin(el*Math.PI/180);
    const warm=Math.max(-0.5,Math.min(1,WARM_K*(m-m0)*(TAU.b-TAU.r)));
    $('az').value=Math.round(az); $('v-az').textContent=Math.round(az)+'°';
    $('el').value=Math.round(el); $('v-el').textContent=Math.round(el)+'°';
    $('warm').value=warm.toFixed(2); $('v-warm').textContent=warm.toFixed(2);
    W.setLight(az,el,warm);
  }
  const px0=W.px,py0=W.py;
  if(playing){
    const move=document.body.classList.contains('menu-open')?IDLE_INPUT:input;
    W.step(dt,move);
    input.interact=0; input.cast=0;
    syncPrompt();
    syncSpells();
    syncMusicScene();
    if(!musicStarted&&travellerMoved(px0,py0,W.px,W.py)){
      musicStarted=true;
      music.begin(W.scene.id);
    }
  }else{
    /* Title: Frostwood keeps animating under the modal. */
    W.step(dt,IDLE_INPUT);
    syncMusicScene();
  }
  if(W.W!==fitW||W.H!==fitH){ fitW=W.W; fitH=W.H; applyFit(); }
  W.ensure(false);
  if(playing) W.setLantern($('c-lamp').checked,0.26);
  else W.setLantern(false,0);
  const uiState=playing?ui()
    :{fog:+$('fog').value,quant:true,precipitation:true,wind:0.55,shadows:true};
  W.render(dt,uiState);
  if(playing){
    musicUiT+=dt;
    if(musicUiT>=0.05){
      music.sampleLevels(musicLevels);
      for(let i=0;i<musicBars.length;i++){
        const rate=musicLevels[i]>musicShown[i]?13:5;
        musicShown[i]+=(musicLevels[i]-musicShown[i])*(1-Math.exp(-rate*musicUiT));
        musicBars[i].style.height=Math.min(14,2+Math.round(musicShown[i]*12))+'px';
      }
      musicUiT=0;
    }
    frames++; fpsT+=dt; mapT+=dt;
    if(mapOn&&mapT>0.25){ mapT=0; drawMap(); }
    if(fpsT>0.5){
      fps=Math.round(frames/fpsT); frames=0; fpsT=0;
      $('hud').textContent=$('c-stats').checked
        ? `${fps} fps · ${W.lastCount} sprites · ${W.chunks.size} chunks\n`+
          `x ${Math.round(W.px)}  y ${Math.round(W.py)}\n${stats}`
        : '';
    }
  }
  requestAnimationFrame(loop);
}

const bind=(id,fmt,out,fn)=>{
  const el=$(id); const sync=()=>{ if(out) $(out).textContent=fmt(el.value); };
  el.addEventListener('input',()=>{sync();(fn||rebuild)();}); sync();
};
bind('az',v=>v+'°','v-az',applyLight);
bind('el',v=>v+'°','v-el',applyLight);
bind('warm',v=>(+v).toFixed(2),'v-warm',applyLight);
bind('den',v=>(+v).toFixed(2),'v-den');
bind('snow',v=>(+v).toFixed(2),'v-snow');
bind('lake',v=>(+v).toFixed(2),'v-lake');
bind('fog',v=>(+v).toFixed(2),'v-fog',()=>{});
bind('wind',v=>(+v).toFixed(2),'v-wind',()=>{});
bind('music-volume',v=>Math.round(+v*100)+'%','v-music',()=>music.setVolume(musicVolume.value));
$('res').addEventListener('change',()=>{
  /* Resolution changes the outdoor framing — rebuild so the new view size is real. */
  if(playing||menuLive) rebuild();
  else resizeOnly();
});
$('seed').addEventListener('change',rebuild);
$('regen').addEventListener('click',rebuild);
$('rand').addEventListener('click',()=>{ $('seed').value=Math.floor(Math.random()*1e9); rebuild(); });
$('cog').addEventListener('click',()=>$('panel').classList.toggle('open'));
$('menu-btn').addEventListener('click',returnToTitle);
$('music').addEventListener('click',()=>{
  music.unlock();
  music.toggle();
  syncMusicControl();
});
$('save').addEventListener('click',()=>{
  const a=document.createElement('a');
  a.download='frostwood-world-'+$('seed').value+'.png';
  a.href=cv.toDataURL('image/png'); a.click();
});
for(const btn of document.querySelectorAll('.world')){
  btn.addEventListener('click',()=>{
    music.unlock();
    enterWorld(btn.dataset.scene);
  });
}
const visionEl=$('vision');
const visionPanel=visionEl.querySelector('.vision-panel');
const visionClose=$('vision-close');
let visionReturnFocus=null;
function syncVisionProgress(){
  const max=visionPanel.scrollHeight-visionPanel.clientHeight;
  const progress=max>0?visionPanel.scrollTop/max:1;
  visionPanel.style.setProperty('--vision-read',Math.max(0,Math.min(1,progress)).toFixed(4));
}
function openVision(){
  if(visionEl.classList.contains('open')) return;
  visionReturnFocus=document.activeElement;
  visionEl.hidden=false; visionEl.classList.add('open');
  document.body.classList.add('vision-open');
  visionPanel.scrollTop=0;
  for(const k in input) input[k]=0;
  requestAnimationFrame(()=>{
    syncVisionProgress();
    visionClose.focus({preventScroll:true});
    $('title').setAttribute('aria-hidden','true');
  });
}
function closeVision(){
  if(!visionEl.classList.contains('open')) return;
  visionEl.classList.remove('open'); visionEl.hidden=true;
  document.body.classList.remove('vision-open');
  $('title').removeAttribute('aria-hidden');
  if(visionReturnFocus&&visionReturnFocus.isConnected) visionReturnFocus.focus({preventScroll:true});
  visionReturnFocus=null;
}
$('vision-open').addEventListener('click',openVision);
for(const close of visionEl.querySelectorAll('.vision-close,[data-vision-close]')){
  close.addEventListener('click',closeVision);
}
visionEl.addEventListener('click',e=>{ if(e.target===visionEl) closeVision(); });
visionEl.addEventListener('keydown',e=>{
  if(e.key!=='Tab') return;
  const focusable=[...visionEl.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )].filter(el=>!el.hidden&&el.getClientRects().length);
  if(!focusable.length){ e.preventDefault(); visionPanel.focus(); return; }
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){
    e.preventDefault(); last.focus();
  }else if(!e.shiftKey&&document.activeElement===last){
    e.preventDefault(); first.focus();
  }
});
visionPanel.addEventListener('scroll',syncVisionProgress,{passive:true});
let rt=null;
addEventListener('resize',()=>{
  clearTimeout(rt);
  rt=setTimeout(()=>{ applyFit(); if(visionEl.classList.contains('open')) syncVisionProgress(); },120);
});
document.addEventListener('visibilitychange',()=>music.setHidden(document.hidden));
addEventListener('pagehide',(e)=>{ if(e.persisted) music.setHidden(true); else music.dispose(); });
addEventListener('pageshow',()=>music.setHidden(false));

window.__world=W;
/* the worm's route, exposed beside __world for the same reason: a capture
   has to be able to ask where a crossing is at the time it pinned. */
window.__wormAt=__wormAtFn;
/* The console surface. tools/shot.mjs and tools/preview.mjs read CH and ACTOR. */
window.__fw={CH,PAD,PADW,ATLAS_S,PATHW,PLAYER_H,makeWorldGen,RAMP,warmShift,
             CAST,makePerson:paintPerson,SPELLS,
             buildWorldAtlas,bakeWorldAtlas,hashf,RAMP_ID,PALETTE,opts,TIERS,LAYERS,ACTOR};

music.prepare().then(syncMusicControl);
requestAnimationFrame(loop);
if(shouldSkipMenu()){
  menuLive=false;
  document.body.classList.remove('menu');
  enterWorld(null);
}else{
  showTitleMenu();
}
