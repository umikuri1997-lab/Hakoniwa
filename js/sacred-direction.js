'use strict';
/* 物語の演出は実時間で進める。保存する調査進行とは別にし、村を切り替えたら残さない。 */
const SACRED_DIRECTION=new WeakMap();
const sacredEase=p=>{p=Math.max(0,Math.min(1,p));return p*p*(3-2*p)};
function sacredDirection(create=false){
  if(!S||WD!==0||S.free)return null;
  let d=SACRED_DIRECTION.get(S);
  if(d?.session!==VILLAGE_SESSION)d=null;
  if(!d&&create){d={session:VILLAGE_SESSION,effects:new Map(),home:{x:cam.x+VW/cam.z/2,y:cam.y+VH/cam.z/2,z:cam.z}};SACRED_DIRECTION.set(S,d);}
  return d;
}
function sacredEffect(k){const e=sacredDirection()?.effects.get(k);return e&&performance.now()<e.at+e.ms?e:null;}
function sacredStartEffect(k,ms,extra={}){const d=sacredDirection(true);if(!d)return null;const e={at:performance.now(),ms,...extra};d.effects.set(k,e);return e;}
function sacredCast(){return S.res.filter(r=>!r.hidden&&r.act&&['fieldintro','fieldstory','fieldassist','fieldgather','fieldwait','storywait','nmeet'].includes(r.act.type));}
function sacredShot(mode,cast=sacredCast(),seconds=1.1){
  if(!S||WD!==0||S.sacredRoot==null)return;
  sacredDirection(true);const j=S.sacredRoot,x=storyTreeX(j)*TS,y=storyTreeY(j)*TS-hiAt(j)*LIFT;
  let points=[[x-38,y-55],[x+38,y+20]],limit=mode==='detail'?3:2.5;
  if(mode==='face'){const f=S.res.find(r=>r.name===POKO);if(f)points=[[f.x*TS-24,f.y*TS-55-uLift(f)],[f.x*TS+24,f.y*TS+8-uLift(f)]];limit=3;}
  else if(mode==='reunion'&&S.nushi){const f=S.res.find(r=>r.name===POKO),n=S.nushi;points=[[n.x*TS-110,n.y*TS-160],[n.x*TS+100,n.y*TS+12]];if(f)points.push([f.x*TS-25,f.y*TS-48],[f.x*TS+25,f.y*TS+8]);limit=2.4;}
  else if(mode!=='detail'){
    for(const r of cast)points.push([r.x*TS-23,r.y*TS-55-uLift(r)],[r.x*TS+23,r.y*TS+10-uLift(r)]);
    if(S.obj.includes('tower'))points.push([x-80,y-170],[x+80,y+10]);
    if(mode==='group'&&S.nushi)points.push([S.nushi.x*TS-110,S.nushi.y*TS-160],[S.nushi.x*TS+100,S.nushi.y*TS+12]);
  }
  if(mode==='battle')for(const e of S.enemies.filter(e=>e.spawned&&!e.dead&&e.type==='boss2'))points.push([e.x*TS-120,e.y*TS-240],[e.x*TS+120,e.y*TS+16]);
  const left=Math.min(...points.map(p=>p[0])),right=Math.max(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
  // 会話欄を避けた、上側の見える範囲に収める。縦長・横長どちらでも同じ構図を保つ。
  const side=VW>VH&&VH<500;$('#dialog').classList.toggle('sacred-side',side);
  const panel=$('#dialog .dlg'),rect=panel?.getBoundingClientRect(),panelH=rect?.height||200,safeTop=side?(IS_STORY_REPLAY?16:76):76,dialogueTop=!$('#dialog').hidden&&rect?.height?rect.top:VH-Math.max(200,panelH)-90,safeBottom=side?VH-60:Math.min(VH-56,Math.max(safeTop+100,dialogueTop-110)),height=safeBottom-safeTop,safeLeft=side?16:28,safeRight=side?VW*.54-12:VW-28;
  const z=Math.max(minZ(),Math.min(limit,(safeRight-safeLeft)/(right-left+36),height/(bottom-top+28)));
  const tx=(left+right)/2+(VW/2-(safeLeft+safeRight)/2)/z,ty=(top+bottom)/2+(VH/2-(safeTop+safeBottom)/2)/z;
  camAnim={fz:cam.z,tz:z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx,ty,t:0,dur:seconds,sacred:true};
  sacredDirection().shot={mode,cast,left,right,top,bottom,z,safeTop,safeBottom};
}
function sacredEndDirection(restore=true){
  $('#dialog').classList.remove('sacred-side');const d=sacredDirection();if(!d)return;
  for(const r of S.res)SACRED_POSES.delete(r);
  SACRED_DIRECTION.delete(S);SACRED_PREVIEW.delete(S);
  if(restore){const h=d.home;camAnim={fz:cam.z,tz:h.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:h.x,ty:h.y,t:0,dur:1.1,sacred:true};}
}
function sacredScenePose(r,anim,ms=2400,extra={}){if(r)sacredSetPose(r,{anim,at:performance.now(),duration:ms,...extra});}
function sacredBody(r,now){
  const p=sacredPose(r);if(!p)return null;const t=Math.max(0,(now-(p.at??now))/1000),q=Math.min(1,t/((p.duration||2400)/1000));
  return {...p,p:q,t,dx:p.anim==='storyBump'?(r.face||1)*3*Math.sin(Math.PI*q):0,dy:0};
}
const SACRED_BEAT_MS={soil:1800,touch:1700,stone:2400,bump:2600,cover:1900,water:2600,runoff:2400,wind:2200,bud:2000,leaf:3000,grow:3300,reply:2200,hug:4800,group:1300,sit:1500,quiet:1400,face:1000};
function sacredLineHold(cue){return String(cue||'').split('+').reduce((ms,c)=>Math.max(ms,c.startsWith('stree:')?(SACRED_BEAT_MS[c.slice(6)]||0):0),0);}
function sacredDirectedLines(step,a){
  const beats={earthListen:['touch'],earthRoot:['soil','touch'],fireRoot:['stone','bump'],fireTrace:['soil','stone','cover'],waterFilm:['runoff','soil','water'],waterLeaf:['water','sit'],windEcho:['wind','soil','wind'],windVoices:['soil','touch','water','wind','quiet'],tower:['group']};
  const k=beats[a.fieldId]?.[a.phase];if(!k)return step.lines;
  return step.lines.map((ln,i)=>i?ln:[ln[0],ln[1],ln[2]||0,[ln[3],`stree:${k}`].filter(Boolean).join('+')]);
}
function sacredBeat(c){
  const ms=SACRED_BEAT_MS[c];if(!ms||!S||WD!==0||S.sacredRoot==null)return;
  const d=sacredDirection(true),cast=sacredCast(),j=S.sacredRoot;
  const f=S.res.find(r=>r.name===POKO),n=S.res.find(r=>r.name===MINA),h=cast.find(r=>r.elem==='fire'),m=cast.find(r=>r.elem==='water'),k=cast.find(r=>r.elem==='wind');
  const lead=cast.find(r=>r.act?.type==='fieldstory')||f;
  if(['soil','touch','cover','stone','water','runoff','wind'].includes(c)){
    const actor=c==='soil'?n:c==='stone'?h:c==='water'||c==='runoff'?m:c==='wind'?k:lead;
    const anim={soil:'storySoil',touch:'storyTouch',cover:'storyCover',stone:'storyStone',water:'storyPour',runoff:'storyPour',wind:'storyWind'}[c];
    sacredScenePose(actor,anim,ms,{side:true,target:j});sacredStartEffect(c,ms,{actor,warming:c==='stone'&&QUESTS[S.quest]?.id==='fireRoot'});sacredShot('care',cast);
  }
  if(c==='bump'&&f&&n){
    sacredShot('care',[f,n]);const owner=S,session=VILLAGE_SESSION;
    const bump=()=>{if(S!==owner||session!==VILLAGE_SESSION)return;f.face=f.x<n.x?1:-1;n.face=-f.face;for(const r of[f,n])sacredScenePose(r,'storyBump',1800,{side:true,face:r.face});sacredStartEffect('bump',1800,{actor:f,other:n});d.waitUntil=performance.now()+1800;};
    if(Math.abs(f.y-n.y)<.6&&Math.abs(f.x-n.x)<1.6)bump();/* もうとなりにいれば、その場で */
    else{d.waitUntil=performance.now()+4000;if(!sacredSceneWalk(f,n.x,n.y,{adjacentSide:true},bump))bump();}/* となりへ行けないときも、止まらずに、その場で */
  }
  if(c==='sit'||c==='quiet'){for(const r of cast)sacredScenePose(r,'storyListen',600000,{sit:true,side:true,target:j});sacredShot('care',cast,1.4);}
  if(c==='bud'||c==='leaf'||c==='grow'){
    const from=sacredStage(),stage=c==='bud'?1:c==='leaf'?2:3;
    sacredStartEffect('growth',ms,{from:Math.min(from,stage-1),to:stage});SACRED_PREVIEW.set(S,{session:VILLAGE_SESSION,stage,until:Infinity});
    sacredShot(c==='grow'?'group':'detail',cast,1.4);sfx('bush');
  }
  if(c==='reply'){sacredStartEffect('reply',ms);sacredShot('face',cast,1.2);sfx('bush');for(const r of cast)sacredScenePose(r,'storyListen',600000,{side:true,target:j});}
  if(c==='face')sacredShot('face',cast);
  if(c==='group'){d.effects.delete('hug');d.effects.delete('embrace');for(const r of cast)SACRED_POSES.delete(r);sacredShot('group',cast,1.7);}
  if(c==='hug'&&f&&S.nushi){d.waitUntil=performance.now()+8000;
    const lord=S.nushi;lord.path=[];lord.mv=0;lord.dir=0;lord.face=f.x<lord.x?-1:1;
    sacredShot('reunion',[f],1.5);sacredStartEffect('hug',600000,{actor:f,lord});
    sacredSceneWalk(f,lord.x-.65,lord.y-.1,{anim:'storyHug',side:true,face:1,duration:600000,at:performance.now()},()=>{
      f.face=f.x<lord.x?1:-1;sacredScenePose(f,'storyHug',600000,{side:true,face:f.face});sacredStartEffect('embrace',600000,{actor:f,lord});d.waitUntil=performance.now()+1000;sacredShot('reunion',[f],1.1);
    });
  }
  d.beat=c;
}
function sacredTreeMotion(now){
  const growth=sacredEffect('growth');const wind=sacredEffect('wind')||sacredEffect('reply');
  return {growth,progress:growth?sacredEase((now-growth.at)/growth.ms):1,sway:wind?Math.sin((now-wind.at)/350)*.025*Math.sin(Math.PI*Math.min(1,(now-wind.at)/wind.ms)):0};
}
function sacredStone(c,x,y,warm=0){const art=window.CHIPS?.['story:stone'];if(art&&drawChip(c,art,'story:stone',Math.round(x),Math.round(y),performance.now()))return;c.fillStyle=warm?'#cbb69b':'#b9b6aa';c.fillRect(Math.round(x-4),Math.round(y-2),8,4);c.fillStyle=warm?'#e5cdb0':'#d7d3c6';c.fillRect(Math.round(x-3),Math.round(y-3),6,2);}
function drawSacredCare(now){
  if(!S||WD!==0||S.sacredRoot==null)return;const j=S.sacredRoot,x=storyTreeX(j)*TS,y=(storyTreeY(j)+.5)*TS-hiAt(j)*LIFT;
  const d=sacredDirection();if(!d)return;ctx.save();ctx.lineCap='round';
  for(const [kind,e]of d.effects){const p=Math.max(0,Math.min(1,(now-e.at)/e.ms));if(p>=1)continue;const a=e.actor,sx=a?a.x*TS:x,sy=a?a.y*TS-(kind==='stone'?8:16)-uLift(a):y;
    if(kind==='stone'){if(e.warming&&p<.3){ctx.fillStyle='#edbd8b';ctx.beginPath();ctx.moveTo(sx+8,sy+4);ctx.quadraticCurveTo(sx+6,sy-3,sx+12,sy-7);ctx.quadraticCurveTo(sx+11,sy-1,sx+15,sy+4);ctx.fill();}const q=sacredEase((p-.3)/.6);sacredStone(ctx,sx+(x+17-sx)*q,sy+(y+4-sy)*q-Math.sin(Math.PI*q)*7,1);}
    if(kind==='soil'||kind==='cover'){for(let i=0;i<4;i++){const q=(p+i*.16)%1;ctx.fillStyle=kind==='soil'?'#c5aa82':'#d7c891';ctx.fillRect(x-17+i*9+q*3,y+7-q*5,kind==='soil'?3:5,2);}}
    if(kind==='water'||kind==='runoff'){
      const targetX=kind==='runoff'?x-24:x+3,targetY=kind==='runoff'?y+15:y+3,q=sacredEase(p/.65);
      ctx.strokeStyle='#b3dce0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+(a?.face||1)*8,sy+2);ctx.quadraticCurveTo((sx+targetX)/2,sy+12,sx+(targetX-sx)*q,sy+(targetY-sy)*q);ctx.stroke();
      if(p>.35){ctx.globalAlpha=Math.sin(Math.PI*(p-.35)/.65)*.6;ctx.fillStyle=kind==='runoff'?'#b7d5d4':'#a3b9a2';ctx.beginPath();ctx.ellipse(targetX,targetY,kind==='runoff'?12:8,4,0,0,7);ctx.fill();ctx.globalAlpha=1;}
    }
    if(kind==='wind'||kind==='reply'){ctx.globalAlpha=Math.sin(Math.PI*p)*.7;ctx.strokeStyle='#cde6c0';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-30+p*25,y-25-i*7);ctx.quadraticCurveTo(x,y-30-i*7,x+25+p*12,y-24-i*7);ctx.stroke();}ctx.globalAlpha=1;}
  }
  ctx.restore();
}

function sacredMotionPending(){const d=sacredDirection();return !!d&&performance.now()<(d.waitUntil||0);}
function sacredResizeShot(){const q=sacredDirection()?.shot;if(q)sacredShot(q.mode,q.cast,.6);}
