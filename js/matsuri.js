/* 虹と村まつり（草原）。S.rbDay：虹の日。S.matsuri：{day:まつりの日, th:お題, cook:[作った料理], res:結果} */
const rainbowToday=()=>!!S&&S.rbDay===dayNo()&&!S.rain;
const RB_FUN=.5;/* 虹の日：たのしさのへりかた0.5倍 */
const MATSURI_EVERY=7,MATSURI_HOUR=17;
const MATSURI_THEMES={flower:{t:'花を20本さかせる',n:20,now:()=>flowerN()},cook:{t:'料理を5しゅるい作る',n:5,now:()=>(S.matsuri&&S.matsuri.cook||[]).length},light:{t:'あかりを10こ置く',n:10,now:()=>CN(LIGHTQ)}};
const MATSURI_FUN=30;
const matsuriHere=()=>!!S&&WD===0&&!IS_STORY_REPLAY&&STATUE>=0;/* 神殿ができてから *//* 火山には、物語のおまつり（festDay）があるので、村まつりは草原だけ */
function matsuriNow(){const m=S&&S.matsuri;return m&&m.day!=null&&m.day>=dayNo()&&m.res==null&&MATSURI_THEMES[m.th]?m:null}
function matsuriProg(m){const T=MATSURI_THEMES[m.th];return Math.min(T.n,T.now())}
function matsuriMet(m){return matsuriProg(m)>=MATSURI_THEMES[m.th].n}
function weatherMorning(wasRain){/* morning() の雨を決めたあと */
  if(!IS_STORY_REPLAY&&wasRain&&Math.random()<.5){S.rain=false;S.rbDay=dayNo();setTimeout(()=>toast('雨あがりの空に、虹が出ている','good'),900)}
  if(!matsuriHere())return;const d=dayNo(),m=S.matsuri||(S.matsuri={});
  if(m.day===d&&m.res==null){setTimeout(()=>toast('きょうは村まつり。お題：'+MATSURI_THEMES[m.th].t,'good'),1600);return}
  if(d>=MATSURI_EVERY-1&&(d+1)%MATSURI_EVERY===0&&m.day!==d+1){const ks=Object.keys(MATSURI_THEMES).filter(k=>k!==m.th);S.matsuri={day:d+1,th:pick(ks),cook:[],res:null};setTimeout(()=>toast('あしたは村まつり。お題：'+MATSURI_THEMES[S.matsuri.th].t,'good'),1600)}}
function matsuriCook(k){const m=matsuriNow();if(m&&!m.cook.includes(k))m.cook.push(k)}/* お題の「料理」：お題が出てから作った料理のしゅるい */
function matsuriRows(rw){const m=matsuriHere()&&matsuriNow();if(!m)return 0;const T=MATSURI_THEMES[m.th],when=m.day>dayNo()?'村まつりは、あした':'村まつりは、きょうの夕方';rw.appendChild(rowEl('まつり：'+T.t,'いま '+matsuriProg(m)+' / '+T.n+'　'+when));return 1}
const MDANCE={on:false,t0:0};
function matsuriHour(h){/* 1時間に1回 */const m=matsuriHere()&&S.matsuri;if(!m||m.day!==dayNo()||m.res!=null||h<MATSURI_HOUR)return;
  if(h>=20){m.res='skip';return}/* 夜までに、はじめられなかった */
  if(isNight()||S.enemies.some(e=>e.spawned&&!e.dead)||mainGathering()||!$('#dialog').hidden)return;/* 物語の集まり・会話が先 */
  if(!matsuriMet(m)){m.res='miss';const r=pick(S.res.filter(q=>!q.hidden&&!q.dead));if(r)addFloat(r.x,r.y-1.6,'つぎのまつりも、たのしみだね','#fff3d6');toast('村まつり：お題には、とどかなかった');return}
  m.res='dance';matsuriDance()}
function matsuriCenter(){if(STATUE>=0)return [STATUE%W+1,((STATUE/W)|0)+1];return [CX,CY]}
function matsuriDance(){const [cx,cy]=matsuriCenter(),used=new Set();let n=0;MDANCE.on=true;MDANCE.t0=performance.now();
  for(const r of S.res){if(r.hidden||r.dead||r.hunger<50)continue;const at=r.act&&r.act.type;if(at&&(MAINGO.has(at)||['sleep','eat','faint','watchpost','flee','storyreturn'].includes(at)))continue;
    const G=bfs(r.x|0,r.y|0);let best=-1,bd=1e9;for(let y=cy-4;y<=cy+4;y++)for(let x=cx-4;x<=cx+4;x++){if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x,rd=Math.hypot(x-cx+.5,y-cy+.5);if(rd<2.2||rd>4.2||used.has(j)||G.dist[j]<0||!walk(j)||S.obj[j])continue;const s=G.dist[j]+Math.abs(rd-3)*4;if(s<bd){bd=s;best=j}}
    if(best<0)continue;used.add(best);endAct(r);startAct(r,G,'mdance',best,{cx,cy});n++}
  if(!n){MDANCE.on=false;matsuriReward()}else{sfx('level');toast('村まつりがはじまった！','good')}}
function matsuriTick(){/* 毎コマ：おどりがおわったら、ごほうび */const m=S&&S.matsuri;if(!m||m.res!=='dance')return;const now=performance.now();if(MDANCE.on&&now-MDANCE.t0<60000&&S.res.some(r=>r.act&&r.act.type==='mdance'))return;MDANCE.on=false;for(const r of S.res)if(r.act&&r.act.type==='mdance')endAct(r);matsuriReward()}
function matsuriReward(){const m=S.matsuri;if(!m||m.res==='done')return;m.res='done';for(const r of S.res)if(!r.dead)r.fun=Math.min(100,r.fun+MATSURI_FUN);
  const L=FURN.filter(id=>giftPoolOK(id));if(L.length){const id=pick(L);giveItem(id,1);queueItemGift({[id]:1},'うけとった！');renderPalette()}sfx('level');toast('村まつり、大せいこう！ みんなのたのしさ+'+MATSURI_FUN,'good')}
ACT.mdance={start(r,a){r.bubble='';a.r0=performance.now();a.lt=a.r0;a.h=0;r.face=a.cx+.5>=r.x?1:-1},
  tick(r,a,dt){const now=performance.now();if(a.r0>now)a.r0=now;/* 読みこんだあと */const rd=Math.max(0,Math.min(200,now-(a.lt||now)));a.lt=now;a.h=(a.h||0)+rd;if(a.h>=700){a.h=0;JUMP.set(r,now);r.face=-(r.face||1);if(Math.random()<.5)fxSpr('twinkle',r.x*TS,(r.y-.9)*TS)}},
  done:(r,a)=>performance.now()-a.r0>=9000||isNight()||S.enemies.some(e=>e.spawned&&!e.dead),end(r,a){}};/* おどりは実時間で9秒 */
ACT_LBL.mdance='村まつりでおどっている';
const RBC={c:null,w:0};
function drawRainbow(now){if(!rainbowToday())return;const h=hour();if(h<6||h>=17)return;const a=Math.min(1,(h-6)/1)*Math.min(1,(17-h)/1.5)*.55;if(a<=0)return;
  const P=3,w=Math.max(60,Math.round(Math.min(VW*.55,420)/P)),cw=w*P;if(RBC.w!==cw){if(RBC.c){RBC.c.width=RBC.c.height=0}const hh=Math.round(w*.42),c=document.createElement('canvas');c.width=cw;c.height=hh*P;const g=c.getContext('2d'),col=['#f2a7a2','#f5c79a','#f3e3a0','#b8deaa','#a8cdea','#c2b2e4'],R=w*.48,bw=Math.max(2,Math.round(w*.022));
    for(let y=0;y<hh;y++)for(let x=0;x<w;x++){const d=Math.hypot(x+.5-w/2,y+.5-(hh+w*.12)),k=Math.floor((R-d)/bw);if(k<0||k>=col.length)continue;g.globalAlpha=Math.min(1,(hh-y)/(hh*.35));g.fillStyle=col[k];g.fillRect(x*P,y*P,P,P)}RBC.c=c;RBC.w=cw}/* ドットの虹（3pxのマス目） */
  ctx.save();ctx.globalAlpha=a;ctx.drawImage(RBC.c,Math.round(VW-cw-VW*.04),Math.round(VH*.09));ctx.restore()}
