/* 草原の夜の来かた（はじめてオオカゲを追いはらったあと）と、植物の守り。
   波：コワイノは0時10分から約50分ごとの5つの波（WAVES）で、2わりずつ（WAVEPART）、のこりはさいごの波。波の中は WAVEGAP ごとに1ぴき。オオカゲはさいごの波。
   先ぶれ：0時にハヤカゲが1ぴき（平均レベル5から2ひき、SCOUTLV）。村（VILL）に入ったら南へ帰る。帰りつく前にたおすと、1ぴきごとに、まだ来ていない本隊を SCOUTCUT へらす。
   横から：3晩に1回くらい（SIDEP）、その夜の3分の1が、東か西のはし（晴れている所のはし）から来る。夜20時に知らせる（nightSidePick）。
   ねばり草（nebari）：上を歩くコワイノの速さ NEBARISP 倍。ほたるの草むら（hotaru）：まわり2マスのあかり。はじめて光に入ったコワイノを HOTARUSTUN 止める（1ぴきに1晩1回）。 */
const WAVES=[15,90,165,240,315],WAVEGAP=4.5,WAVEPART=.2,SCOUTCUT=.2,SCOUTLV=[3,5],SIDEP=1/3,NEBARISP=.5,HOTARUSTUN=3,HOTARUSTUNB=1.5,HOTARUR2=4;
function wavesOn(){/* 波に分けて来る夜：草原、はじめてオオカゲを追いはらったあと、ふつうの夜だけ（最後の夜の前の群れ・最後の夜・試練・かげのうしおはのぞく） */
  return WD===KUSA&&!S.free&&(S.bossKills||0)>0&&!S.rushOn&&!S.finalOn&&!S.trialOn&&nightVarNow()!=='ushio'}
function villAvgLv(){return Math.floor(S.res.reduce((a,r)=>a+rLv(r),0)/Math.max(1,S.res.length))}
function waveApply(es){/* spawnWave で入れたコワイノを、3つの波にならべかえる。先ぶれを足す */
  const ord=es.filter(e=>!EN[e.type].boss).concat(es.filter(e=>EN[e.type].boss)),n=ord.length,p=Math.floor(n*WAVEPART),last=WAVES.length-1;
  const side=nightSideNow();let k=0;
  ord.forEach((e,i)=>{const g=p>0?Math.min(last,Math.floor(i/p)):last,ix=i-g*p;e.wv=g;e.delay=WAVES[g]+ix*WAVEGAP;if(side&&!EN[e.type].boss&&(k++)%3===2)e.side=side});/* 横から来るのは、3びきに1ぴき */
  const lv=villAvgLv(),ns=lv>=SCOUTLV[1]?2:lv>=SCOUTLV[0]?1:0;
  for(let i=0;i<ns;i++){const hp=EN.fast.hp;S.enemies.push({id:S.nid++,type:'fast',x:0,y:0,hp,max:hp,delay:i*6,scout:1,spawned:false,path:[],repath:0,atk:0,stun:0,flash:0,flee:false})}
  return ns+(typeof shinyAdd==='function'?shinyAdd():0)}
function waveNote(){/* 目標の欄：つぎの波まで */
  if(!S||WD!==KUSA||!S.enemies||!S.enemies.length)return '';const L=S.enemies.filter(e=>e.wv!=null&&!e.dead);if(!L.length)return '';
  const wait=L.filter(e=>!e.spawned);if(!wait.length)return '';const g=Math.min(...wait.map(e=>e.wv));
  if(L.some(e=>e.wv===g&&e.spawned))return '影の波 '+(g+1)+'/'+WAVES.length;
  const m=Math.max(1,Math.ceil(Math.min(...wait.filter(e=>e.wv===g).map(e=>e.delay))/DAYLEN));return 'つぎの波まで：あと'+(m>=60?Math.floor(m/60)+'時間'+(m%60?m%60+'分':''):m+'分')}
function nightLeftNote(){/* 目標の欄：今夜のコワイノの、のこり（まだ来ていない分もふくむ。先ぶれ・にげていく子・たおれた子はのぞく） */
  if(!S||!S.enemies||!S.enemies.length||!isNight())return '';const n=S.enemies.filter(e=>!e.dead&&!e.scout&&!e.flee&&!(e.spawned&&e.hp<=0)).length;return n>0?'今夜の「コワイノ」：のこり'+n+'ひき':''}
/* ---------- 先ぶれ ---------- */
function scoutTick(e){/* 先ぶれは、村に入ったら、のぞいて南へ帰る（たたかわない）。帰る道は、にげるコワイノと同じ */
  if(!e.scout||e.flee)return false;const c=(e.y|0)*W+(e.x|0);
  if(VILL[c]){e.flee=true;e.scoutBack=1;e.path=[];e.repath=0;if(!S.ns||!S.ns.scT){if(S.ns)S.ns.scT=1;toast('先ぶれの「コワイノ」が、村をのぞいて、もどっていく','warn')}return false}
  return true}
function scoutGoal(e){/* 先ぶれの行き先：歩いて行ける、いちばん近い村のマス */
  const G=bfsE(e.x|0,e.y|0,40,e.sd||(e.sd=(Math.random()*1e9)|0));let b=-1,bd=1e9;for(let j=0;j<W*H;j++){if(!VILL[j]||G.dist[j]<0)continue;if(G.dist[j]<bd){bd=G.dist[j];b=j}}return b}
function scoutDown(e){/* 先ぶれをたおした：まだ来ていない本隊（オオカゲはのぞく）を2わりへらす */
  const wait=S.enemies.filter(q=>!q.spawned&&!q.dead&&!q.scout&&!EN[q.type].boss),all=S.enemies.filter(q=>!q.scout&&!EN[q.type].boss).length,cut=Math.min(wait.length,Math.floor(all*SCOUTCUT));
  if(cut>0){wait.sort((p,q)=>q.delay-p.delay);for(const q of wait.slice(0,cut))q.dead=true;/* まだ来ていないので、そっと消す */if(S.ns)S.ns.n=Math.max(0,S.ns.n-cut)}
  if(S.ns)S.ns.scK=(S.ns.scK||0)+1;toast(cut>0?'先ぶれを追いはらった。今夜の影が、すこしへった':'先ぶれを追いはらった','good')}
/* ---------- 横から来る ---------- */
function nightSideNow(){const v=S&&S.nightSide;if(!v)return null;const h=hour(),d=dayNo();return v.d===d&&h>=20||v.d===d-1&&h<6?v.s:null}
function nightSidePick(){/* 夜20時、今夜のコワイノが決まったあと（nightVarPick のあと）に1回 */const d=dayNo();if(S.nightSide&&S.nightSide.d===d)return;S.nightSide=null;
  if(WD!==KUSA||S.free||!((S.bossKills||0)>0)||S.finalNight||S.trial||S.today==='odayaka'||S.rushOn||S.finalOn||S.trialOn||nightVarNow()||S.hornD===d)return;
  const w=S.wave||[];if(!w.length||w.some(t=>EN[t].boss))return;if(Math.random()>=SIDEP)return;
  const s=Math.random()<.5?'e':'w';S.nightSide={d,s};sfx('bush');toast((s==='e'?'東':'西')+'の草むらが、ざわざわしている','warn')}
function sideEdge(y,s){if(!fogOn())return s==='e'?W-1:0;if(s==='e'){for(let x=W-1;x>=0;x--)if(!fogAt(y*W+x))return x}else for(let x=0;x<W;x++)if(!fogAt(y*W+x))return x;return -1}
function sideSpot(s){const R=spawnReach();for(let t=0;t<300;t++){const y=(Math.random()*H)|0,x=sideEdge(y,s),j=y*W+x;if(x<0||S.ground[j]===1||solidOf(j)||lightAt(x+.5,y+.5)||R[j]<0)continue;return [x+.5,y+.5]}return spawnSpot()}/* 見つからなければ、南のはし */
/* ---------- 植物の守り ---------- */
function nebariMul(e){const j=(e.y|0)*W+(e.x|0);return !(EN[e.type]&&EN[e.type].nosl)&&S.obj[j]==='nebari'&&!isBud(j)?NEBARISP:1}
function hotaruTick(e){/* はじめて、ほたるの草むらの光に入ったら止まる。止めたら true */
  if(!HOTL.length||e.flee)return false;for(const j of HOTL){if(S.obj[j]!=='hotaru'||isBud(j))continue;const dx=j%W+.5-e.x,dy=((j/W)|0)+.5-e.y;if(dx*dx+dy*dy>=HOTARUR2)continue;const H0=e.htr||(e.htr=[]);if(H0.includes(j))continue;
    H0.push(j);e.stun=EN[e.type].boss?HOTARUSTUNB:HOTARUSTUN;e.path=[];fxSpr('twinkle',e.x*TS,e.y*TS-8);sfxAt('bonk',e.x,e.y);return true}return false}
function hotaruDots(c,x,y,i,now){/* ほたる：夜だけ、ドットの光が、ゆっくり点めつ */if(!isNight()||i!=null&&isBud(i))return;const s=(i||0)*7.13;
  for(let k=0;k<4;k++){const ph=(now/1000*.6+k*.27+s)%1,a=Math.max(0,Math.sin(ph*Math.PI));if(a<.15)continue;const px=Math.round(x+6+((k*11+(i||0)*3)%21)+Math.sin(now/1300+k)*2),py=Math.round(y+6+((k*7+(i||0))%14)+Math.cos(now/1700+k*2)*2);
    c.globalAlpha=a*.5;c.fillStyle='#f4ffb0';c.fillRect(px-1,py-1,4,4);c.globalAlpha=a;c.fillStyle='#fbffd8';c.fillRect(px,py,2,2)}c.globalAlpha=1}
function nebariDots(c,x,y,i){/* ねばり草：葉の上の、ねばねばのしずく（ドット） */if(i!=null&&isBud(i))return;c.fillStyle='#f3f6c8';for(const[dx,dy]of[[11,20],[19,18],[15,23],[22,22]])c.fillRect(x+dx,y+dy,2,2)}
