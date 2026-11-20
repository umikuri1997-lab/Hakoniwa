/* 時間・温度・質感の手ざわり（feel.js）。見た目と音だけで、数字・せいれいの行動の計算はかえない。セーブするのは、雨のつぎの朝の印（S.wetD）だけ。
   時間：窓のあかりが家ごとにともる・消える（feelWin）／雲のかげ（feelClouds）／地面にのこる季節（冬の雪・秋の落ち葉 feelRow、木と岩の雪 feelCap、屋根の雪 feelRoof）／朝もや・朝つゆ
   温度：白い息（feelAir）／火のゆらめき（feelFlick）／夏のかげろう・セミ／冬の家の中のぬくもり（feelWarm）
   質感：足音（feelStep・feelStepSnd）／足もとの反応（波紋・土ぼこり・雪の足あと・草のかけら・ふんだ花がゆれる feelKick）／雨のぬれ（水面の波紋・のきのしずく・地面のはね・水たまり）／場所の音（feelAmb：川・池・温泉・火・葉・セミ）
   絵は、1マス64ドットのドット絵を1回だけ作って（feelArt）、ならべる。マスごとの出る・出ないは、マスの番号から決まる（hash）ので、しまわない */
const FEEL_SNOWP=1.6,SNOWFULL0=.3;/* 雪のかたまりは、つもるほどふえる。SNOWFULL0 より多くつもると、地面ぜんたいが、だんだん白くなる（一面の雪） */
const FEEL_LEAFP=.75;/* 落ち葉がたまりきったとき、木のまわりで落ち葉が出るわりあい */
const FEEL_PUDP=.16,FEEL_PUDG=.06;/* 水たまりが出るわりあい：乾いた地面と道・草地 */
const FEEL_DRYH=13;/* 雨のつぎの日、水たまりがかわききる時刻 */
const FEEL_MELT=2;/* 火のまわりの、雪がつもらないマスの数 */
const FEEL_WIN0=17.3,FEEL_WIN1=20,FEEL_WOFF0=4.8,FEEL_WOFF1=6.2;/* 窓のあかり：ともりはじめ〜みんなともる時刻、消えはじめ〜みんな消える時刻 */
const FEEL_STEP=.55;/* 足音の歩はば（マス） */
const FEEL_BREATH=3400;/* 白い息の間かく（ミリ秒） */
const FEEL_CLOUD=.16;/* 雲のかげのこさ */
let FEELA=null,FEELK=null,FEELIN=new Set(),FEELTREE=new Set(),FEELMELT=new Set(),FEELHK=null;
const FEELEV=[];/* 足もとの反応：{k,x,y,i,t0,life,f} */
const FEELFS=new WeakMap(),FEELKICK=new Map();
/* 足もとからとぶ粒（Frostwind の kickup.js の考え方。MIT）：材質ごとに、とぶ数・何歩ごと・上がる高さ・横へのひろがり（せかいの点）・落ちる速さの上限（点／秒）・うしろへ流れる速さ（点／秒）・ゆらゆら（点）・色。
   粒は重さ（FEELKG）で山なりにとび、落ちる速さが上限にとどいたら、その速さで落ちる。雪はふわっとただよい、土はすぐ落ちる。見た目だけ */
const FEELKG=420;/* 粒を下へひっぱる重さ（点／秒²） */
const FEELKICKM={
  dry:{n:3,every:2,h:[2.5,5],sp:[3,8],vt:60,drift:4,fl:0,col:['#d9c7a2','#c9b48d']},
  soil:{n:2,every:2,h:[1.5,3],sp:[2,5],vt:80,drift:2,fl:0,col:['#b89a72','#a4865f']},
  grass:{n:2,every:3,h:[3.5,6.5],sp:[4,9],vt:50,drift:2,fl:1,col:['#8fcf6a','#b6e08a']},
  snow:{n:3,every:2,h:[4,8],sp:[2,5],vt:7,drift:5,fl:1.5,col:['#ffffff','#e2ebf6']}};
let FEELC={snow:0,leaf:0,pud:0,dew:0,mist:0,heat:0,cold:false,rain:false,wet:false,any:false};

function feelSeasonDay(){return (Math.max(0,dayNo()-1))%SEASONDAYS}
const SNOWUP=300,SNOWMW=2880,SNOWMS=240;/* 雪がつもりきるまで（村の分。雪の日だけつもる）・冬に、ふらない日にとけきるまで・冬でなければ、とけきるまで */
function snowTick(){if(!S)return;const t=S.t,d=S.snowT==null?0:Math.max(0,Math.min(1440,t-S.snowT));S.snowT=t;if(!d)return;const a=S.snowA||0;
  if(typeof snowNow==='function'&&snowNow())S.snowA=Math.min(1,a+d/SNOWUP);else if(a>0)S.snowA=Math.max(0,a-d/(seasonNow()===3?SNOWMW:SNOWMS))}/* 雪は、ふっているあいだに、だんだんつもる。やむと、ゆっくりとける */
function snowCover(){return S&&S.snowA||0}
/* 一面の雪のこさを、マスごとに少しずつずらす（なめらかなノイズ snowN）：つもるときも、とけるときも、場所ごとにまだらに、ふちはぼかして。8だんにそろえて、となりと同じこさならまとめて描く */
const SNOWNS=7,SNOWNK=.55;
function snowN(i){const x=i%W/SNOWNS,y=(i/W|0)/SNOWNS,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sm=t=>t*t*(3-2*t),v=(a,b)=>hash((iy+b)*977+(ix+a)*131+7),u=sm(fx),w=sm(fy);return(v(0,0)*(1-u)+v(1,0)*u)*(1-w)+(v(0,1)*(1-u)+v(1,1)*u)*w}
function snowCell(i,fa){if(fa>=1)return 1;if(fa<=0)return 0;const c=(fa-SNOWNK*snowN(i))/(1-SNOWNK);return c<=0?0:c>=1?1:Math.ceil(c*8)/8}
function waterSnowA(){const a=FEELC&&FEELC.snow||0;return a>SNOWFULL0?Math.min(1,(a-SNOWFULL0)/(1-SNOWFULL0)):0}/* 水ぎわの陸の雪（draw-world.js の waterShimmer）：地面の一面の雪と同じこさ *//* 0〜1：つもった雪（S.snowA） */
function leafCover(){if(!S||seasonNow()!==2)return 0;return Math.min(1,.3+feelSeasonDay()*.15)}/* 秋：日がたつほど、たまる */
function puddleLv(){if(!S)return 0;const h=hour();if(S.rain)return h<6?1:Math.min(1,.25+(h-6)/4);/* 雨の日：朝からふえる */
  if(S.wetD===dayNo()&&h>=6&&h<FEEL_DRYH)return 1-(h-6)/(FEEL_DRYH-6);return 0}/* 雨のつぎの日：昼にかけてかわく */
function pudCell(i){/* そのマスに水たまりの絵が出るか（水たまりが出ている日のこと。見えている所と同じ決まり） */const gr=S.ground[i];if(gr===1||gr===2||S.obj[i]||FEELIN.has(i)||RUGC.has(i)||fogAt(i))return false;const f=S.floor[i];if(f&&f!=='path'&&f!=='gravel'&&f!=='stone'&&f!=='brick')return false;
  return hash(i*29+1)<(REV.has(i)&&!f?FEEL_PUDG:FEEL_PUDP)}
function rainPud(i){return !!S&&isNight()&&!(snowCover()>0&&!feelMelt(i))&&puddleLv()>0&&pudCell(i)}/* 夜（23時〜6時）、水たまりが見えているマス：せいれいもコワイノも、すべる */
const RAINSLIP=7.5,RAINSLIPB=1.5;/* 雨の水たまりで止まる時間（すべる水たまりの罠の半分：5分、オオカゲなどは1分） */
function rainSlip(r){/* せいれいが水たまりでつるっとすべって、止まる。出てから、またふむと、またすべる */if(r.slipT>S.t){r.stT=S.t;return true}const j=(r.y|0)*W+(r.x|0);
  if(!rainPud(j)){r.slipJ=-1;return false}if(r.slipJ===j)return false;r.slipJ=j;r.slipT=S.t+RAINSLIP;r.stT=S.t;sfxAt('slip',r.x,r.y);fxSpr('slip',r.x*TS,r.y*TS);SHOCKU.set(r,performance.now()+1200);return true}
function feelWin(h){/* その家の窓のあかりのこさ（0〜1）。家ごとに、ともる時刻・消える時刻がちがう */const t=skyHour(),q=hash(h.x0*31+h.y0*17+5),on=FEEL_WIN0+q*(FEEL_WIN1-FEEL_WIN0),off=FEEL_WOFF0+hash(h.x0*13+h.y0*29+2)*(FEEL_WOFF1-FEEL_WOFF0);
  if(t>=12)return Math.max(0,Math.min(1,(t-on)/.12));return Math.max(0,Math.min(1,(off-t)/.12))}
const FEELNOMELT=new Set(['statue','watch']);
const FEELFLAME={campfire:.07,torch:.06,candle:.05,lantern:.04,flamp:.03,lamp:.035,toro:.04,takeakari:.04,andon:.03,yomawari:.035,statue:.03,watch:.035};
function feelFlick(j,o,now){/* 火のあかりのゆらめき：光の大きさの倍（1のまわり）。1秒に9回くらい、こきざみにかわる */const a=FEELFLAME[o];if(!a)return 1;const t=Math.floor(now/110);return 1+(hash(t*7+j*3)-.5)*a+Math.sin(now/640+j)*a*.5}
function feelKick(j,now){/* ふまれた花のゆれ（swayK にたす） */const t0=FEELKICK.get(j);if(t0==null)return 0;const u=(now-t0)/700;if(u>=1||u<0){FEELKICK.delete(j);return 0}return Math.sin(u*Math.PI*4)*.22*(1-u)}

/* ---------- 絵（1マス64ドット。画面には半分の大きさで描く） ---------- */
function feelBlob(g,ox,oy,w,h,cols,seed){/* ドットのかたまり：行ごとのはばを、だ円に少しでこぼこをつけて決める。cols=[上の色, 中の色, 下のふちの色] */
  for(let y=0;y<h;y+=2){const u=(y+1)/h*2-1,hw=Math.sqrt(Math.max(0,1-u*u))*w/2,l=Math.round((w/2-hw+(hash(seed+y*3)-.5)*4)/2)*2,r=Math.round((w/2+hw+(hash(seed+y*5+1)-.5)*4)/2)*2;if(r-l<2)continue;
    g.fillStyle=y>=h-2?cols[2]:y<h*.45?cols[0]:cols[1];g.fillRect(ox+l,oy+y,r-l,2)}}
function feelArt(){if(FEELA)return FEELA;const c=document.createElement('canvas');c.width=512;c.height=192;const g=c.getContext('2d');const A={c,snow:[],leaf:[],pud:[],rip:[],mist:null,print:null,splash:[]};
  /* 雪のかたまり3つ（白・うすい水色のかげ） */
  [[52,22],[40,18],[30,14]].forEach(([w,h],n)=>{const ox=n*64+2,oy=2;feelBlob(g,ox,oy,w,h,['#ffffff','#f3f8ff','#cfdef0'],n*91+7);g.fillStyle='#ffffff';g.fillRect(ox+w*.3|0,oy+2,6,2);A.snow.push([ox,oy,w,h])});
  {const t=document.createElement('canvas');t.width=t.height=64;const q=t.getContext('2d');q.fillStyle='#f2f6fc';q.fillRect(0,0,64,64);/* 一面の雪：1マス64ドットの、つながる雪の面（白に、うすい水色のくぼみと、白い光のドット） */
    for(let k=0;k<26;k++){const x=((hash(k*7+3)*32)|0)*2,y=((hash(k*11+5)*32)|0)*2,w=(2+((hash(k*13)*3)|0))*2;q.fillStyle=k%3?'#e2ebf6':'#d6e2f1';q.fillRect(x,y,Math.min(w,64-x),2);if(k%2){q.fillStyle='#ffffff';q.fillRect(x,Math.max(0,y-2),Math.min(w-2,64-x),2)}}
    A.snowT=t}
  /* 落ち葉のかたまり3つ：ちらばった葉のドット */
  for(let n=0;n<3;n++){const ox=n*64+2,oy=34,w=[56,46,34][n],h=[26,22,16][n],C=['#f6a650','#ec6f45','#f5d25a','#e2884a','#c9603a'];
    for(let k=0;k<[46,32,20][n];k++){const a=hash(n*57+k*3)*6.283,d=Math.sqrt(hash(n*31+k*7)),x=Math.round((w/2+Math.cos(a)*d*(w/2-3))/2)*2,y=Math.round((h/2+Math.sin(a)*d*(h/2-2))/2)*2;g.fillStyle=C[(hash(n*13+k)*C.length)|0];g.fillRect(ox+x,oy+y,hash(k+n)>.35?4:2,hash(k*3+n)>.6?4:2)}A.leaf.push([ox,oy,w,h])}
  /* 水たまり3つ（小・中・大）：地面の形のまま（たて:よこ＝0.8:1）。水の色・明るい空のうつり・少しこいふち */
  [[20,16],[30,24],[40,32]].forEach(([w,h],n)=>{const ox=n*64+2,oy=66;g.globalAlpha=.82;feelBlob(g,ox,oy,w,h,['#a9cfe6','#9cc5df','#7fa9c8'],n*71+3);g.globalAlpha=.9;g.fillStyle='#e4f3fb';g.fillRect(ox+(w*.25|0),oy+2+(n?2:0),n?8:4,2);g.fillRect(ox+(w*.25|0)+(n?10:6),oy+2+(n?2:0),2,2);g.globalAlpha=1;A.pud.push([ox,oy,w,h])});
  /* 冬：こおった水たまり（うすい水色の氷に、白いつやのすじ） */A.ice=[];[[20,16],[30,24],[40,32]].forEach(([w,h],n)=>{const ox=300+n*64,oy=66;g.globalAlpha=.9;feelBlob(g,ox,oy,w,h,['#eef8fd','#dcedf7','#b4d2e6'],n*71+3);g.globalAlpha=1;g.fillStyle='#ffffff';const x0=ox+(w*.22|0),y0=oy+(h*.3|0);for(let k=0;k<(n?6:4);k++)g.fillRect(x0+k*2,y0+((n?6:4)-k)-2,2,1);if(n)g.fillRect(x0+(w*.4|0),y0+(h*.35|0),4,1);A.ice.push([ox,oy,w,h])});
  /* 波紋4コマ：ひろがるだ円の輪 */
  for(let n=0;n<4;n++){const ox=n*40+2,oy=98,rx=5+n*4,ry=2+n*1.6,cx=18,cy=8;g.fillStyle=n<2?'#f2fbff':'#d3ebf6';g.globalAlpha=[.9,.75,.5,.28][n];
    for(let a=0;a<40;a++){const an=a/40*6.283,x=Math.round((cx+Math.cos(an)*rx)/2)*2,y=Math.round((cy+Math.sin(an)*ry)/2)*2;g.fillRect(ox+x,oy+y,2,2)}g.globalAlpha=1;A.rip.push([ox,oy,36,18])}
  /* 朝もや：よこに長い、うすい白のかたまり（行ごとにうすさをかえる） */
  {const ox=200,oy=2,w=120,h=28;for(let y=0;y<h;y+=2){const u=(y+1)/h*2-1,hw=Math.sqrt(Math.max(0,1-u*u))*w/2,l=Math.round((w/2-hw+(hash(y*9+4)-.5)*14)/2)*2,r=Math.round((w/2+hw+(hash(y*11+8)-.5)*14)/2)*2;g.globalAlpha=.55*(1-Math.abs(u)*.6);g.fillStyle='#ffffff';g.fillRect(ox+l,oy+y,Math.max(2,r-l),2)}g.globalAlpha=1;A.mist=[ox,oy,w,h]}
  /* 雪の足あと：小さなくぼみ2つ */
  {const ox=200,oy=40;g.fillStyle='#c3d3e8';g.fillRect(ox,oy,6,4);g.fillRect(ox+10,oy+4,6,4);g.fillStyle='#aebfd8';g.fillRect(ox,oy,6,2);g.fillRect(ox+10,oy+4,6,2);A.print=[ox,oy,16,8]}
  /* 雨つぶのはね3コマ */
  for(let n=0;n<3;n++){const ox=200+n*20,oy=56;g.fillStyle='#e6f3fc';g.globalAlpha=[.9,.7,.4][n];if(n===0){g.fillRect(ox+6,oy+6,2,4)}else{const d=n*3;g.fillRect(ox+6-d,oy+8-n*2,2,2);g.fillRect(ox+6+d,oy+8-n*2,2,2);g.fillRect(ox+6,oy+10,2,2)}g.globalAlpha=1;A.splash.push([ox,oy,16,12])}
  return FEELA=A}
function feelPut(c,A,q,x,y){c.drawImage(A.c,q[0],q[1],q[2],q[3],Math.round(x*2)/2,Math.round(y*2)/2,q[2]/2,q[3]/2)}

/* ---------- 1コマに1回：いまのようす ---------- */
/* 火のせいれいが、冬の外で、ひとつのマスに FIRESTAY（時計の20分）立っていたら、まわり FIRE_MR マスの雪がとける（見た目だけ・セーブしない。つぎの朝6時にもどる） */
const FIRESTAY=30,FIRE_MR=2,FIREMELT=new Set(),FIREW=new WeakMap();let FIREDAY=-1;
const feelMelt=i=>FEELMELT.has(i)||FIREMELT.has(i);
function fireMeltTick(){const d=callDay();if(d!==FIREDAY){FIREDAY=d;FIREMELT.clear()}if(snowCover()<=0)return;
  for(const r of S.res){if(r.elem!=='fire'||r.hidden)continue;const x=r.x|0,y=r.y|0,j=y*W+x;if(roomOf(j))continue;let w=FIREW.get(r);if(!w||w.j!==j){FIREW.set(r,{j,t:S.t});continue}if(w.done||S.t-w.t<FIRESTAY)continue;w.done=1;
    for(let dy=-FIRE_MR;dy<=FIRE_MR;dy++)for(let dx=-FIRE_MR;dx<=FIRE_MR;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&dx*dx+dy*dy<=FIRE_MR*FIRE_MR+1)FIREMELT.add(Y*W+X)}}}
function feelPrep(now){snowTick();fireMeltTick();const h=hour(),k=seasonNow(),C=FEELC;C.rain=!!S.rain&&!snowNow();C.wet=C.rain&&typeof stormNow==='function'&&stormNow();C.snow=snowCover();C.leaf=leafCover();C.pud=puddleLv();
  C.dew=!S.rain&&k!==3&&h>=5&&h<8?Math.min(1,(h-5)/.6,(8-h)/.8):0;C.mist=!S.rain&&h>=4.8&&h<7.8?Math.min(1,(h-4.8)/.7,(7.8-h)/1):0;
  C.heat=k===1&&!S.rain&&h>=11&&h<15.5?Math.min(1,(h-11)/.5,(15.5-h)/.5):0;C.cold=k===3||(k!==1&&h>=4.5&&h<7);
  C.any=C.snow>0||C.leaf>0||C.pud>0||C.dew>0||C.rain||C.wet;
  if(FEELK!==counts){FEELK=counts;FEELTREE=new Set();FEELMELT=new Set();/* 木のまわり・火のまわりのマス（recount のたびに作りなおす） */
    for(let j=0;j<W*H;j++){const o=S.obj[j];if(!o||!TREES.has(o)||o==='deadtree'&&WD!==1)continue;const x=j%W,y=(j/W)|0;for(let dy=-2;dy<=2;dy++)for(let dx=-3;dx<=3;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H)FEELTREE.add(Y*W+X)}}
    for(const j of LITP){if(!FEELFLAME[S.obj[j]]||FEELNOMELT.has(S.obj[j]))continue;/* 神殿・見張り台のあかりは、地面の雪をとかさない */const x=j%W,y=(j/W)|0;for(let dy=-FEEL_MELT;dy<=FEEL_MELT;dy++)for(let dx=-FEEL_MELT;dx<=FEEL_MELT;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H)FEELMELT.add(Y*W+X)}}}
  if(FEELHK!==HOUSES){FEELHK=HOUSES;FEELIN=new Set();for(const hh of HOUSES)for(const q of hh.set)FEELIN.add(q)}
  for(let i=FEELEV.length-1;i>=0;i--)if(now-FEELEV[i].t0>FEELEV[i].life)FEELEV.splice(i,1)}

/* ---------- 地面の層（物・せいれいより下）。lifted：高い段のマスだけ（段差の絵のあとに描く） ---------- */
function snowPat(c,A){if(!A.snowP){A.snowP=c.createPattern(A.snowT,'repeat');try{A.snowP.setTransform(new DOMMatrix([.5,0,0,.5,0,0]))}catch(e){}}return A.snowP}
function feelRow(y,x0,x1,now,lifted){const C=FEELC,A=feelArt(),c=ctx,near=cam.z>=FARZ*1.6,snowA=C.snow>SNOWFULL0?Math.min(1,(C.snow-SNOWFULL0)/(1-SNOWFULL0)):0;let run=-1,runE=0,runY=0;
  let runA=0;const snowFlush=()=>{if(run<0)return;c.globalAlpha=runA*.94;c.fillStyle=snowPat(c,A);c.fillRect(run,runY,runE-run,TS);c.globalAlpha=1;run=-1};
  if(C.any)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const i=y*W+x,hi=hiAt(i);if(lifted?!hi:hi)continue;const gr=S.ground[i];if(fogAt(i))continue;const px=x*TS,py=y*TS-hi*LIFT;
    if(gr===1){if(C.rain&&near&&S.obj[i]!=='bridge'&&hash(i*7+1)<.55){const ph=(now/1100+hash(i*3+2))%1;feelPut(c,A,A.rip[Math.min(3,(ph*4)|0)],px+4+hash(i*5)*10,py+8+hash(i*11)*12)}continue}/* 雨：水面の波紋 */
    const o=S.obj[i];if(snowA>0&&gr!==2&&!FEELIN.has(i)&&!RUGC.has(i)&&o!=='farm'&&!(o==='part'&&S.obj[S.ref[i]]==='farm')&&!feelMelt(i)){const f=S.floor[i];const ca=snowCell(i,snowA);if(ca>0&&(!f||f==='path'||f==='gravel'||f==='stone'||f==='brick')){if(run>=0&&(runE!==px||runY!==py||runA!==ca))snowFlush();if(run<0){run=px;runY=py;runA=ca}runE=px+TS}else snowFlush()}else snowFlush();/* 一面の雪：物の下・道の上も（家の中・床・畑・水・火のまわりはのぞく） */
    if(gr===2||o||FEELIN.has(i)||RUGC.has(i))continue;const f=S.floor[i];if(f&&f!=='path'&&f!=='gravel'&&f!=='stone'&&f!=='brick')continue;/* 家の床・じゅうたんには出さない */
    if(C.snow>0&&!feelMelt(i)){const q=hash(i*13+5);if(q<C.snow*FEEL_SNOWP){const s=A.snow[(hash(i*3+1)*3)|0];c.globalAlpha=Math.min(1,.55+C.snow*.45);feelPut(c,A,s,px+(TS-s[2]/2)*hash(i*17+3),py+(TS-s[3]/2)*hash(i*19+7));c.globalAlpha=1}continue}
    if(C.leaf>0&&FEELTREE.has(i)&&hash(i*23+9)<C.leaf*FEEL_LEAFP){const s=A.leaf[(hash(i*3+1)*3)|0];feelPut(c,A,s,px+(TS-s[2]/2)*hash(i*17+3),py+(TS-s[3]/2)*hash(i*19+7))}
    if(C.pud>0){if(pudCell(i)){const n=C.pud>.66?2:C.pud>.33?1:0,ice=seasonNow()===3,s=(ice?A.ice:A.pud)[n],sx=px+(TS-s[2]/2)/2,sy=py+(TS-s[3]/2)/2+3;feelPut(c,A,s,sx,sy);
        if(C.rain&&near){const ph=(now/900+hash(i*3+2))%1;if(ph<.6){c.globalAlpha=.8;feelPut(c,A,A.rip[Math.min(1,(ph*3.4)|0)],sx+s[2]/4-9,sy+s[3]/4-4);c.globalAlpha=1}}}}
    if(C.wet&&near&&hash(i*37+2)<(f?.3:.12)){const tw=Math.sin(now/(260+hash(i*7+5)*200)+hash(i*9)*40);if(tw>.6){c.globalAlpha=Math.min(1,(tw-.6)*3)*(f?.75:.5);c.fillStyle='#eef6ff';const dx=Math.round(px+3+hash(i*47)*24),dy=Math.round(py+5+hash(i*53)*22);c.fillRect(dx,dy,2,1);if(tw>.9)c.fillRect(dx+(hash(i*59)<.5?-1:2),dy,1,1);c.globalAlpha=1}}/* あらし：ぬれた地面・道のつや（光る点がまたたく） */
    if(C.dew>0&&near&&!f&&REV.has(i)&&hash(i*31+4)<.3){const tw=Math.sin(now/420+hash(i*7)*40);if(tw>.55){c.globalAlpha=C.dew*Math.min(1,(tw-.55)*4);c.fillStyle='#f6fdff';const dx=Math.round(px+4+hash(i*41)*24),dy=Math.round(py+6+hash(i*43)*22);c.fillRect(dx,dy,1,1);if(tw>.85){c.fillRect(dx-1,dy,3,1);c.fillRect(dx,dy-1,1,3)}c.globalAlpha=1}}}
  snowFlush();
  for(const e of FEELEV){if(e.ry!==y||(lifted?!e.hi:e.hi))continue;const u=(now-e.t0)/e.life,ex=e.x*TS,ey=e.y*TS-e.hi*LIFT;
    if(e.k==='rip'){c.globalAlpha=1-u*.4;feelPut(c,A,A.rip[Math.min(3,(u*4)|0)],ex-9,ey-4);c.globalAlpha=1}
    else if(e.k==='print'){if(C.snow<=0)continue;c.globalAlpha=u>.75?(1-u)*4:1;c.save();c.translate(ex,ey);if(e.f<0)c.scale(-1,1);feelPut(c,A,A.print,-4,-2);c.restore();c.globalAlpha=1}
    else if(e.k==='kick')feelKickDraw(c,e,now,ex,ey)}}
function feelKickAdd(km,x,y,hi,now,f,seed){/* 粒を1歩ぶん作る：粒ごとに、とぶ時間を先に出しておく */const P=[];let life=0;
  for(let n=0;n<km.n;n++){const s=seed*13+n*5,h=km.h[0]+(km.h[1]-km.h[0])*hash(s+1),sp=km.sp[0]+(km.sp[1]-km.sp[0])*hash(s+2),a=hash(s+3)*6.283,v0=Math.sqrt(2*FEELKG*h),ta=v0/FEELKG,tv=km.vt/FEELKG,dv=km.vt*km.vt/(2*FEELKG),tf=h<=dv?Math.sqrt(2*h/FEELKG):tv+(h-dv)/km.vt;
    P.push({vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.5,v0,ta,tf,ph:hash(s+4)*6.283,c:km.col[n%km.col.length]});life=Math.max(life,(ta+tf)*1000)}
  FEELEV.push({k:'kick',x,y,ry:y|0,hi,t0:now,life,f,km,P})}
function feelKickZ(p,t,km){/* 地面からの高さ：上がるあいだは重さ、落ちるときは上限の速さまで */if(t<=p.ta)return p.v0*t-FEELKG*t*t/2;const h=p.v0*p.ta/2,d=t-p.ta,tv=km.vt/FEELKG;return Math.max(0,d<=tv?h-FEELKG*d*d/2:h-km.vt*km.vt/(2*FEELKG)-km.vt*(d-tv))}
function feelKickDraw(c,e,now,ex,ey){const t=(now-e.t0)/1000,km=e.km;for(const p of e.P){const T=p.ta+p.tf;if(t>=T)continue;const u=t/T,z=feelKickZ(p,t,km),dx=p.vx*t-e.f*km.drift*t+(km.fl?Math.sin(t*9+p.ph)*km.fl*Math.min(1,t*4):0),dy=p.vy*t-z;
  c.globalAlpha=u>.7?(1-u)/.3*.85:.85;c.fillStyle=p.c;c.fillRect(Math.round((ex+dx)*2)/2,Math.round((ey+dy)*2)/2,1,1)}c.globalAlpha=1}
function feelGround(now,x0,y0,x1,y1){if(!S)return;feelPrep(now);if(!FEELC.any&&!FEELEV.length)return;const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)feelRow(y,x0,x1,now,0);ctx.imageSmoothingEnabled=sm}
function feelLifted(add,x0,y0,x1,y1,now){if(!S||!S.hi||cam.z<FARZ||(!FEELC.any&&!FEELEV.length))return;for(let y=Math.max(0,y0);y<Math.min(H,y1);y++){let any=false;for(let x=Math.max(0,x0);x<Math.min(W,x1);x++)if(S.hi[y*W+x]){any=true;break}if(any)add(y-1+.0006,-1,null,()=>{const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;feelRow(y,x0,x1,now,1);ctx.imageSmoothingEnabled=sm},-1)}}

/* ---------- 木・岩の上の雪：チップの絵の、上のふちに白いドットをのせる（チップごとに1回だけ作る） ---------- */
const FEELCAPS=new Set(['tree','ntree','fruit','deadtree','rock','boulder','berry','bamboo']);
function feelCapOf(src,id){if(src._snow!==undefined)return src._snow;const im=chipImgs(src,id)[0];if(!im||!im.ok)return null;/* 絵が読みこみ中：あとでもう1回 */
  try{const w=src.w,h=src.h,t=document.createElement('canvas');t.width=w;t.height=h;const g=t.getContext('2d');g.drawImage(im,0,0,w,h);const d=g.getImageData(0,0,w,h).data,top=new Int16Array(w).fill(-1);
    for(let x=0;x<w;x++)for(let y=0;y<h;y++)if(d[(y*w+x)*4+3]>140){top[x]=y;break}
    g.clearRect(0,0,w,h);const Q=src.g===64?2:1;/* ゲームの1ドット */
    for(let x=0;x<w;x+=Q){const a=top[x];if(a<0)continue;const l=x>=Q*2?top[x-Q*2]:-1,r=x+Q*2<w?top[x+Q*2]:-1,sl=Math.max(l<0?99:Math.abs(l-a),r<0?99:Math.abs(r-a));if(sl>Q*5)continue;/* 切り立った横のふちには、つもらない */
      const th=(sl>Q*2?1:2+((hash(x*7+w)*2)|0))*Q,ay=Math.floor(a/Q)*Q;g.fillStyle='#ffffff';g.fillRect(x,ay,Q,th);g.fillStyle='#d3e0f1';g.fillRect(x,ay+th,Q,Q)}
    const t2=document.createElement('canvas');t2.width=w;t2.height=h;const g2=t2.getContext('2d');/* つもりきったとき：葉のかたまりの上の面ぜんぶ（上が空いているドット）に、あつく */
    for(let x=0;x<w;x+=Q)for(let y=Q;y<h*.85;y+=Q){const op=k=>d[(k*w+x)*4+3]>140;if(!op(y)||op(y-Q))continue;const th=(2+((hash(x*5+y*3+w)*2)|0))*Q;g2.fillStyle='#ffffff';g2.fillRect(x,y,Q,th);g2.fillStyle='#d3e0f1';g2.fillRect(x,y+th,Q,Q)}
    g2.globalCompositeOperation='destination-in';g2.drawImage(im,0,0,w,h);t._thick=t2;
    t._ok=true;src._snow=t}catch(e){src._snow=null}return src._snow}
const FEELCAPK=new Set(['furn','build','plant','gift']),FEELCAPNO=new Set(['site','part','matyard']);/* 外に置いた家具・建物にも、上のふちに雪（家の中・屋根の下はのぞく） */
function feelCapOK(o,i){if(FEELCAPS.has(o))return true;const b=BL[o];if(!b||!FEELCAPK.has(b.kind)||FEELCAPNO.has(o)||FEELIN.has(i))return false;if(typeof RFC!=='undefined'&&RFC.has(i))return false;return true}
function feelCap(c,o,i,x,y,g){const a=FEELC.snow;if(a<=0||!feelCapOK(o,i))return;if(feelMelt(i))return;const ch=TREES.has(o)?plantChip(o,i,g):chipOf(o,i);if(!ch)return;const src=ch.src||ch,cap=feelCapOf(src,o);if(!cap)return;
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.save();const g0=c.globalAlpha,fa=a>SNOWFULL0?Math.min(1,(a-SNOWFULL0)/(1-SNOWFULL0)):0;c.globalAlpha=g0*Math.min(1,a*2.5);if(ch.flip){c.translate(2*x+ch.fw,0);c.scale(-1,1)}const put=im=>{if(src.g===64)c.drawImage(im,x+src.ax/2,y+src.ay/2,src.w/2,src.h/2);else c.drawImage(im,x+src.ax,y+src.ay)};put(cap);if(fa>0&&cap._thick){c.globalAlpha=g0*fa;put(cap._thick)}c.restore();c.imageSmoothingEnabled=sm}
/* 屋根の雪：屋根の形の中に、よこに長い雪のすじをちらす（家ごとに1回だけ作る。1マス32ドットの細かさ） */
function feelRoof(c,h,R,A){const a=FEELC.snow;if(a<=0||!R||!R.cv||!R.cv.width)return;let sn=h._sn;if(!sn||sn.R!==R){const w=Math.ceil(R.cv.width/R.sc),hh=Math.ceil(R.cv.height/R.sc),t=document.createElement('canvas');t.width=w;t.height=hh;const g=t.getContext('2d'),sd=h.x0*7+h.y0*13;
    {const n=Math.max(4,Math.round(w*hh/900));for(let k=0;k<n;k++){const bw=18+((hash(sd+k*7)*22)|0),bh=6+((hash(sd+k*11)*5)|0),bx=Math.round(hash(sd+k*13+1)*(w-bw)),by=Math.round(hash(sd+k*17+2)*(hh-bh));/* ふんわりした雪のかたまりを、屋根のあちこちに */
      for(let y=0;y<bh;y++){const u=(y+.5)/bh*2-1,hw=Math.sqrt(Math.max(0,1-u*u))*bw/2,l=Math.round(bw/2-hw+(hash(sd+k*3+y*5)-.5)*3),r=Math.round(bw/2+hw+(hash(sd+k*5+y*7)-.5)*3);if(r<=l)continue;g.fillStyle=y>=bh-1?'#cfdef0':y<bh*.45?'#ffffff':'#f3f8ff';g.fillRect(bx+l,by+y,r-l,1)}}}
    g.globalCompositeOperation='destination-in';g.drawImage(R.cv,0,0,w,hh);
    const f=document.createElement('canvas');f.width=w;f.height=hh;const q=f.getContext('2d'),ST=feelArt().snowT;for(let y=0;y<hh;y+=32)for(let x=0;x<w;x+=32)q.drawImage(ST,0,0,64,64,x,y,32,32);/* 屋根いっぱいの雪（つもりきったとき） */
    q.fillStyle='#cfdef0';for(let y=12;y<hh;y+=16)q.fillRect(0,y,w,1);/* 屋根の段のうすいかげ */q.globalCompositeOperation='destination-in';q.drawImage(R.cv,0,0,w,hh);sn=h._sn={R,cv:t,full:f}}
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;const fa=a>SNOWFULL0?Math.min(1,(a-SNOWFULL0)/(1-SNOWFULL0)):0;
  if(fa>0){c.globalAlpha=A*fa*.95;c.drawImage(sn.full,R.ox,R.oy)}c.globalAlpha=A*Math.min(1,a*2.5);c.drawImage(sn.cv,R.ox,R.oy);c.globalAlpha=A;c.imageSmoothingEnabled=sm}/* はじめは、かたまりがちらばり、つもるほど屋根ぜんたいが白くなる */

/* 屋根のつや（あらしの日）：屋根の形の中に、ぬれて光る点をちらす（家ごとに1回だけ作る。あらしでない日は手ばなす） */
function feelRoofWet(c,h,R,A){if(!FEELC.wet||!R||!R.cv||!R.cv.width){if(h._wt){h._wt.cv.width=h._wt.cv.height=0;h._wt=null}return}let wt=h._wt;if(!wt||wt.R!==R){const w=Math.ceil(R.cv.width/R.sc),hh=Math.ceil(R.cv.height/R.sc),t=document.createElement('canvas');t.width=w;t.height=hh;const g=t.getContext('2d'),sd=h.x0*11+h.y0*17;
    const n=Math.max(6,Math.round(w*hh/260));g.fillStyle='#eef6ff';for(let k=0;k<n;k++){const x=Math.round(hash(sd+k*13+3)*(w-3)),y=Math.round(hash(sd+k*19+5)*(hh-1));g.fillRect(x,y,2+((hash(sd+k*7)*2)|0),1)}
    g.globalCompositeOperation='destination-in';g.drawImage(R.cv,0,0,w,hh);wt=h._wt={R,cv:t}}
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.globalAlpha=A*(.35+.25*Math.sin(performance.now()/420+h.x0));c.drawImage(wt.cv,R.ox,R.oy);c.globalAlpha=A;c.imageSmoothingEnabled=sm}

/* ---------- 雲のかげ（晴れた昼）：1まいの絵をくりかえして、ゆっくり流す ---------- */
let FEELCL=null;
function feelCloudPat(c){if(FEELCL)return FEELCL;const N=128,t=document.createElement('canvas');t.width=t.height=N;const g=t.getContext('2d');g.fillStyle='#1e2846';
  for(let n=0;n<5;n++){const cx=hash(n*71+3)*N,cy=hash(n*37+9)*N;for(let k=0;k<5;k++){const rx=9+hash(n*5+k)*10,ry=5+hash(n*9+k*3)*5,ex=cx+(hash(n*11+k*7)-.5)*26,ey=cy+(hash(n*13+k*5)-.5)*10;for(const ox of[-N,0,N])for(const oy of[-N,0,N]){g.beginPath();g.ellipse(ex+ox,ey+oy,rx,ry,0,0,7);g.fill()}}}
  return FEELCL=c.createPattern(t,'repeat')}
function feelClouds(c,now,dk){if(!S||S.rain||dk>.05)return;const h=hour(),a=FEEL_CLOUD*Math.min(1,(h-7)/1,(17-h)/1);if(!(a>0))return;const K=7,ox=(now*.0055)%(128*K),oy=(now*.0012)%(128*K),vw=VW/cam.z,vh=VH/cam.z;
  c.save();c.imageSmoothingEnabled=true;c.globalAlpha=a;c.globalCompositeOperation='multiply';c.fillStyle=feelCloudPat(c);c.translate(ox,oy);c.scale(K,K);c.fillRect((cam.x-ox)/K-1,(cam.y-oy)/K-1,vw/K+2,vh/K+2);c.restore()}

/* ---------- 冬の家の中のぬくもり：屋根をはずした家の中を、あたたかい色に（夜の暗さより下） ---------- */
function feelWarm(c,x0,y0,x1,y1){if(!S||seasonNow()!==3||!HOUSES.length)return;c.save();c.globalCompositeOperation='soft-light';c.fillStyle='rgb(255,168,96)';
  for(const h of HOUSES){if(h.y1<y0-1||h.y0>y1+1||h.x1<x0-1||h.x0>x1+1)continue;const A=roofAOf(h);if(A>=.98)continue;c.globalAlpha=.34*(1-A);for(const q of h.set){const z=hiAt(q)*LIFT;c.fillRect((q%W)*TS,((q/W)|0)*TS-z,TS+.5,TS+.5)}}
  c.restore()}

/* ---------- 空気の層（物・せいれいより上、夜の暗さより下）：朝もや・白い息・かげろう・のきのしずく・雨のはね ---------- */
function feelAir(now,x0,y0,x1,y1){if(!S)return;const C=FEELC,A=feelArt(),c=ctx,sm=c.imageSmoothingEnabled,near=cam.z>=FARZ*1.6;c.imageSmoothingEnabled=false;
  if(C.rain&&near){const tk=Math.floor(now/420),ph=(now/420)%1;/* 雨つぶのはね：地面のあちこちで */
    for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const i=y*W+x;if(hash(i*3+tk*7919)>.08||S.ground[i]===1||FEELIN.has(i)||fogAt(i))continue;feelPut(c,A,A.splash[Math.min(2,(ph*3)|0)],x*TS+hash(i+tk)*24,y*TS+hash(i*5+tk)*22-hiAt(i)*LIFT)}
    for(const h of HOUSES){if(h.y1<y0-2||h.y0>y1+1||h.x1<x0-1||h.x0>x1+1||roofAOf(h)<.5)continue;const by=(h.y1+1)*TS+2-hiAt(h.y1*W+h.x0)*LIFT;/* のきのしずく：手前ののきから落ちて、はねる */
      for(let x=h.x0;x<=h.x1;x++)for(let n=0;n<2;n++){const p=(now/(760+hash(x*5+n)*300)+hash(x*13+n*7+h.y0))%1,dx=x*TS+7+n*15+hash(x+n*3)*5;c.fillStyle='#d6eaf7';if(p<.7){c.globalAlpha=.85;c.fillRect(Math.round(dx),Math.round(by+p/.7*p/.7*13),1,2.5)}else{const u=(p-.7)/.3;c.globalAlpha=.8*(1-u);c.fillRect(Math.round(dx-1-u*3),Math.round(by+13-u*2),1,1);c.fillRect(Math.round(dx+1+u*3),Math.round(by+13-u*2),1,1)}}}c.globalAlpha=1}
  if(C.heat>0&&near){/* 夏のかげろう：乾いた地面・道から、ゆらゆらのぼる、うすい線 */
    for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const i=y*W+x;if(hash(i*17+6)>.22||S.ground[i]||S.obj[i]||FEELIN.has(i))continue;const f=S.floor[i];if(!f&&REV.has(i))continue;if(fogAt(i))continue;const by=y*TS+26-hiAt(i)*LIFT;
      for(let n=0;n<3;n++){const p=(now/2600+hash(i*3+n*5))%1,wx=x*TS+6+n*10+Math.sin(now/260+p*9+n*2)*1.5;c.globalAlpha=C.heat*.5*Math.sin(p*Math.PI);c.fillStyle='#fffdf0';for(let q=0;q<3;q++)c.fillRect(Math.round((wx+Math.sin(now/200+q*1.4+n)*1.2)*2)/2,Math.round((by-p*20-q*2)*2)/2,1,2)}}c.globalAlpha=1}
  if(C.cold)for(const r of S.res){/* 白い息：冬と夜あけ、外で起きているせいれい */if(r.hidden||r.nap||r.x<x0-1||r.x>x1+1||r.y<y0-1||r.y>y1+1)continue;const a=r.act;if(a&&(a.type==='sleep'||a.type==='watchpost'||a.type==='bathe')&&a.stage==='do')continue;const i=(r.y|0)*W+(r.x|0);if(FEELIN.has(i))continue;
    const u=((now+hash((r.id|0)*37+11)*FEEL_BREATH)%FEEL_BREATH)/1100;if(u>=1)continue;const f=r.face<0?-1:1,bx=r.x*TS+f*(13+u*7)-(f<0?3:0),by=r.y*TS-8-hiAt(i)*LIFT-u*5,P=v=>Math.round(v*2)/2;c.fillStyle='#ffffff';/* 口のよこから出て、ふくらみながら上へきえる（ドット3つ） */
    c.globalAlpha=(1-u)*.95;c.fillRect(P(bx),P(by),2.5+u*2,2.5+u*1.5);c.globalAlpha=(1-u)*.8;c.fillRect(P(bx+f*(3.5+u*3)),P(by-2.5-u*2),2+u*3,2+u*2.5);if(u>.2){c.globalAlpha=(1-u)*.6;c.fillRect(P(bx+f*(1.5+u*8)),P(by-5.5-u*4),2+u*2.5,2+u*2)}c.globalAlpha=1}
  if(C.mist>0&&cam.z>=FARZ){/* 朝もや：水べに、うすい白いもやが、ゆっくり流れる */const s=A.mist;
    for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0-2);x<Math.min(W,x1+2);x++){const i=y*W+x;if(!waterJ(i)||hash(i*19+3)>.3)continue;if(fogAt(i))continue;const dx=Math.sin(now/5200+hash(i*7)*6.283)*14,dy=Math.sin(now/3300+hash(i*11)*6.283)*2;c.globalAlpha=C.mist*(.45+.25*Math.sin(now/2600+hash(i*5)*6.283));feelPut(c,A,s,x*TS-14+dx,y*TS+4+dy-hiAt(i)*LIFT)}c.globalAlpha=1}
  c.imageSmoothingEnabled=sm}

/* ---------- 足音・足もとの反応 ---------- */
function feelSurf(i){/* そのマスの足もとの材質 */const g=S.ground[i];if(g===2)return 'water';if(S.obj[i]==='bridge')return 'wood';if(RUGC.has(i))return 'cloth';const f=S.floor[i];if(f==='path'||f==='gravel')return FEELC.snow>.4&&!FEELIN.has(i)?'snow':'soil';
  if(f&&BL[f]){const m=typeof tapMatOf==='function'?tapMatOf(f):'twood';return m==='tstone'?'stone':m==='tcloth'?'cloth':'wood'}
  if(S.obj[i]==='farm')return 'soil';/* 畑の上は土 */
  if(FEELC.snow>.4&&!FEELIN.has(i)&&!feelMelt(i))return 'snow';return REV.has(i)?'grass':'dry'}
let FEELSND=0;
function feelStepSnd(k,x,y,alt,follow){if(typeof AC==='undefined'||!AC||!SND.sfx||AC.state!=='running'||typeof sfxG==='undefined'||!sfxG)return;const now=performance.now();if(now-FEELSND<110)return;const q=sfxPos(x,y);if(!q||(!follow&&q.v<.5))return;/* 画面のまん中に近い子と、見守っている子だけ */
  if(typeof SKIP!=='undefined'&&SKIP||S.speed>2)return;FEELSND=now;const t=AC.currentTime,g=AC.createGain();g.gain.value=q.v*(follow?1.25:1)*1.6;let o=g;if(AC.createStereoPanner){const pn=AC.createStereoPanner();pn.pan.value=q.p;g.connect(pn);o=pn}o.connect(sfxG);const r=(alt?1.06:.95)*(.95+Math.random()*.1);
  if(k==='grass'){rustle(t,.07,.04,g,2500*r,1500*r,.9)}
  else if(k==='dry'||k==='soil'){rustle(t,.06,.045,g,820*r,460*r,1.1);knock(105*r,t,.03,g,.05)}
  else if(k==='wood'){knock(250*r,t,.07,g,.07);rustle(t,.03,.012,g,1800,1300,1)}
  else if(k==='stone'){knock(540*r,t,.04,g,.035);rustle(t,.03,.018,g,3200*r,2300*r,1)}
  else if(k==='water'){tone(500*r,t,.08,'sine',.035,g,1000*r);rustle(t,.07,.03,g,2800,1900,.9)}
  else if(k==='snow'){rustle(t,.12,.06,g,1150*r,620*r,.7);rustle(t+.03,.07,.025,g,2600*r,1900*r,1)}
  else if(k==='cloth'){rustle(t,.05,.02,g,900*r,600*r,.8)}}
function feelStep(now){if(!S||!S.res)return;const fid=typeof FOLLOW!=='undefined'&&FOLLOW?FOLLOW.id:null,vw=VW/cam.z,vh=VH/cam.z,X0=cam.x/TS-1,Y0=cam.y/TS-1,X1=(cam.x+vw)/TS+1,Y1=(cam.y+vh)/TS+1;
  for(const r of S.res){if(r.hidden){FEELFS.delete(r);continue}let st=FEELFS.get(r);if(!st){FEELFS.set(r,{x:r.x,y:r.y,d:0,n:0});continue}const d=Math.hypot(r.x-st.x,r.y-st.y),fdx=r.x-st.x;st.x=r.x;st.y=r.y;if(d<=0)continue;if(d>1.5){st.d=0;continue}/* ワープは数えない */{const ti=(r.y|0)*W+(r.x|0);if(ti!==st.i){st.i=ti;const o=S.obj[ti];if(o&&PLANTS.includes(o)&&!FEELKICK.has(ti))FEELKICK.set(ti,now)}}/* 花のマスに入ったら、花がゆれる */st.d+=d;if(st.d<FEEL_STEP)continue;st.d=0;st.n++;
    if(r.x<X0||r.x>X1||r.y<Y0||r.y>Y1)continue;const i=(r.y|0)*W+(r.x|0);if(i<0||i>=W*H)continue;if(r.act&&r.act.type==='watchpost'&&r.act.stage==='do')continue;const k=feelSurf(i),hi=hiAt(i),f=fdx<0?-1:1;
    feelStepSnd(k,r.x,r.y,st.n&1,r.id===fid);
    if(cam.z<FARZ*1.6||FEELEV.length>160)continue;const ev=(kk,life)=>FEELEV.push({k:kk,x:r.x,y:r.y,ry:r.y|0,hi,t0:now,life,f,n:st.n&1});
    if(k==='water')ev('rip',620);else if(k==='snow')ev('print',26000);const km=FEELKICKM[k];if(km&&st.n%km.every===0)feelKickAdd(km,r.x,r.y,hi,now,f,st.n+r.id*7)
}}

/* ---------- 場所の音：カメラの近くにあるときだけ聞こえる（川のせせらぎ・凪いだ池とカエル・お湯の流れこむ温泉・火のパチパチ・葉のざわめき・夏のセミ）。川・池・温泉・火は本物の録音（火は焚き火の録音 SAMPLES.fire。持ち主がきめた）、ほかはその場で作る ---------- */
const FEELAB={},FEELREC=new Set(['stream','pond','onsen','fire']),FEELRK={fire:'fire'};let FEELAT=0;
function feelBuf(k){const sr=AC.sampleRate,n=Math.floor(sr*3),b=AC.createBuffer(1,n,sr),d=b.getChannelData(0);let a=0,a2=0,m=.5,m2=.5,tm=.5,tm2=.5;
  if(k==='leaves'){for(let i=0;i<n;i++){const w=Math.random()*2-1;a+=(w-a)*.35;a2+=(w-a2)*.06;const s=Math.sin(Math.PI*i/n);d[i]=(a-a2)*(.18+.82*s*s)*.9}}
  else if(k==='semi'){for(let i=0;i<n;i++){const t=i/sr,am=.5+.5*Math.sin(6.283*52*t),sw=.55+.45*Math.sin(6.283*t/3-1.57);d[i]=(Math.sin(6.283*4180*t)+Math.sin(6.283*4420*t+1)*.8+Math.sin(6.283*4760*t+2)*.5)*.2*am*am*sw}}
  const X=Math.floor(sr*.08);for(let i=0;i<X;i++){const u=i/X;d[i]=d[i]*u+d[n-X+i]*(1-u)}/* つなぎ目をならす */return b}
function feelAmbWant(){const want={stream:0,pond:0,onsen:0,fire:0,leaves:0,semi:0};if(!S||!started||!SND.sfx||!$('#title').hidden||!$('#maps').hidden||typeof stageReady==='function'&&!stageReady())return want;
  const vw=VW/cam.z,vh=VH/cam.z,cx=(cam.x+vw/2)/TS,cy=(cam.y+vh/2)/TS,zk=Math.max(.35,Math.min(1.3,cam.z/homeZ())),R=8;const wk={river:0,pond:0,onsen:0};let tn=0;
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const x=(cx+dx)|0,y=(cy+dy)|0;if(x<0||y<0||x>=W||y>=H)continue;const i=y*W+x,dd=Math.hypot(dx,dy);if(dd>R)continue;if(fogAt(i))continue;if(waterJ(i))wk[typeof waterKind==='function'?waterKind(i):'river']+=1-dd/R;/* 川・池・温泉で、ちがう音 */else{const o=S.obj[i];if(o&&TREES.has(o)&&(o!=='deadtree'||WD===1))tn+=1-dd/R}}
  want.stream=Math.min(1,wk.river/14)*.8*zk;want.pond=Math.min(1,wk.pond/14)*.3*zk;want.onsen=Math.min(1,wk.onsen/14)*.3*zk;/* 池・温泉は、かなり小さく（持ち主がきめた） */want.leaves=Math.min(1,tn/5)*(typeof stormNow==='function'&&stormNow()?.9:S.rain?.5:.3)*zk;
  let fv=0;for(const j of LITP){const o=S.obj[j];if(o!=='campfire'&&o!=='torch')continue;const d=Math.hypot(j%W+.5-cx,((j/W)|0)+.5-cy);if(d<6)fv=Math.max(fv,Math.pow(1-d/6,1.5))}want.fire=fv*.8*zk;
  {const h=hour();if(seasonNow()===1&&!S.rain&&h>=9&&h<17)want.semi=(.12+Math.min(1,tn/3)*.2)*Math.min(1,(h-9)/1,(17-h)/1)}
  return want}
function feelAmb(){if(typeof AC==='undefined'||!AC||AC.state!=='running'||typeof ambG==='undefined'||!ambG)return;const want=feelAmbWant();
  for(const k in want){let a=FEELAB[k];if(!a){if(!want[k])continue;/* 川・池・温泉・火は本物の録音（tools/sound/stream_loop.py・water_amb.py）。読みこむまでは鳴らさない */const rec=FEELREC.has(k),rb=rec?(SBUF[FEELRK[k]||k]||[])[0]:null;if(rec&&!rb)continue;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=rb||feelBuf(k);src.loop=true;if(rb){src.loopStart=.06;src.loopEnd=rb.duration-.06}g.gain.value=0;src.connect(g);g.connect(ambG);src.start();a=FEELAB[k]={src,g}}a.g.gain.setTargetAtTime(want[k],AC.currentTime,.6)}}
function feelFrame(now){/* 1コマに1回（main.js）。村の時間が進んでいなくても、音の大きさは合わせる */if(!S||!started)return;try{feelStep(now)}catch(e){}if(now-FEELAT>500){FEELAT=now;try{feelAmb()}catch(e){}}}

/* ---------- せいれいの動き：冬は火にあたりに行く・夏はすずしい所で休む（goWeather から） ---------- */
const FEEL_WARMP=.35,FEEL_SHADEP=.35;
function feelRest(r,G){const k=seasonNow(),h=hour(),free=j=>walk(j)&&!S.obj[j]&&!(TAKEN&&TAKEN.has(j));
  if(k===3&&!(r.quirkT>S.t)&&Math.random()<FEEL_WARMP){/* 冬：たき火・たいまつに手をかざす（火のせいれいのしぐさと同じ動き） */const ok=j=>{const t=typeAt(j);return t==='campfire'||t==='torch'||t==='oven'};const st=nearest(G,j=>free(j)&&(j%W>=1&&ok(j-1)||j%W<W-1&&ok(j+1)),14);if(st>=0){const tg=st%W>=1&&ok(st-1)?st-1:st+1;r.quirkT=S.t+QUIRKCD;startAct(r,G,'quirk',st,{k:'warm',tg,dur:QUIRKDUR});return true}}
  if(k===1&&!S.rain&&h>=11&&h<15.5&&!(r.shadeT>S.t)&&Math.random()<FEEL_SHADEP){/* 夏の昼：木かげか水べにすわって、すずむ */const cool=j=>waterJ(j)||TREES.has(typeAt(j))&&!(typeAt(j)==='deadtree'&&WD!==1);const st=nearest(G,j=>free(j)&&!S.floor[j]&&!roomOf(j)&&(j%W>=1&&cool(j-1)||j%W<W-1&&cool(j+1)),14);if(st>=0){r.shadeT=S.t+180;startAct(r,G,'sunset',st===(r.y|0)*W+(r.x|0)?-1:st,{dur:36,shade:1});return true}}
  return false}
