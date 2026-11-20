'use strict';
/* 洞窟の探検（土のステージの核。いまは、テスト用のボタンから入る1階だけ）
   ・村は止めたまま（paused）、洞窟だけを、このファイルで動かして描く。村の S はそのまま
   ・洞窟のマスは、村のマップの外（y が H より下、CVOY から）に置く。村のマスを見る共通の描き方（段差の高さなど）が、何もない所を見る
   ・パーティは、村のせいれい（S.res）そのもの。おなかは本物がへる。場所だけ、洞窟の中の物（actor）で持つ
   ・たたかいの数字は村と同じ（攻撃力・SORTIE・EN の hitF・hitN・まもりの光の GUP）。ダメージは hurtEn を通す
   ・洞窟にいた時間（CV.t、村の時間 S.t と同じ単位）は、出たときに村を進める（夜20時まで）
   たしかめは tools/tests/cave.cjs */
const CVW=30,CVH=24,CVOY=H+8;
/* # 岩・. 床・S 入口の光・R かえりの光・T 宝箱・o 石のかたまり・c コカゲ・i イワカゲ
   属性の道：e くずれた岩（土）・f あつい巣（火）・w どろ（水）・k われ目（木）・n すきま（風） */
const CVMAP=[
'##############################',
'##############.......#########',
'##########.......R..T#########',
'##########.###.......#########',
'##########.######.############',
'##########.######.######....##',
'##########.#...........#....##',
'##########.#.....i.....k..T.##',
'##########.#..c.....c..#....##',
'##########.#...........#....##',
'##########.####.##############',
'##########w####.##############',
'###......#.####.##############',
'###.o....#...........#.....o##',
'###..T...e...c.......#...o..##',
'###....o.#........c..f..c...##',
'###......#...........#....o.##',
'###############.######.o....##',
'###############.##############',
'#############.....############',
'############n.....############',
'#############..S..############',
'#############.....############',
'##############################'];
const CVPARTY=3,CVFOOD=6;/* つれていく人数・持っていく食べ物の数 */
const CVH0=6,CVH1=16,CVNIGHT=20;/* 出かけられる時刻（6時〜16時）・夜20時には村へもどる */
const CVWALK=2.6,CVFOE=1.5;/* 1秒に歩くマス：せいれい（移動速度20のとき）・コワイノ（EN の sp 1のとき） */
const CVSEE=4.2,CVLIGHT=4.8,CVWAKE=3.6,CVAGGRO=6;/* マス：見える・光の絵の半径・コワイノが目をさます・せいれいがねらう */
const CVHUN={walk:.4,stand:.1,work:3};/* おなかのへり（村と同じ数。コードの1分ごと） */
const CVGATE={
  e:{el:'earth',t:10,anim:'mine',no:'土のせいれいがいません',ok:'くずれた岩をどかした'},
  f:{el:'fire',t:6,anim:'cookfan',no:'火のせいれいがいません',ok:'あつい巣をやいた'},
  w:{el:'water',t:8,anim:'water',no:'水のせいれいがいません',ok:'どろをながした'},
  k:{el:'wood',t:10,anim:'plant',no:'木のせいれいがいません',ok:'つるの橋をかけた'},
  n:{el:'wind',t:6,anim:'fetch',no:'風のせいれいがいません',ok:'すきまの先の物をとった'}};
/* ひろえる物（実数）。宝箱は、マスの場所ごと */
const CVPILE={mat:{stone:3}},CVGAP={mapPc:1};
const CVCHEST={'20,2':{fukuro:1,pt:50},'26,7':{mat:{wood:10},pt:20},'5,14':{mat:{stone:10},pt:20}};
const CVFOES={c:'basic',i:'rockc'};
let CV=null;
const caveOn=()=>!!CV;
const cvJ=(x,y)=>y*CVW+x,cvX=j=>j%CVW,cvY=j=>(j/CVW)|0;
const cvCell=e=>cvJ(e.x|0,(e.y|0)-CVOY);
const cvAdj=(j,k)=>Math.abs(cvX(j)-cvX(k))+Math.abs(cvY(j)-cvY(k))===1;
const cvName=r=>typeof nickTx==='function'?nickTx(r.name):r.name;/* つけた名前（nick.js） */
const cvHour=()=>((clk()+(CV?CV.t:0))/60)%24;
/* 会話・ポップアップ・レベルアップの画面が出ているあいだは、洞窟も止める */
function cvHold(){return !$('#dialog').hidden||sheet!=null||!$('#rlv').hidden||!$('#lvup').hidden||!!document.querySelector('.pxpopw')||GIFT_ACTIVE||USERPAUSE}
function cvWalk(j){const C=CV;if(j<0||j>=CVW*CVH||!C.g[j])return false;const o=C.ob.get(j);return !o||o.k==='S'||o.k==='R'||o.done&&o.k!=='T'}
/* 見とおせるか：岩と、まだひらいていない岩・巣は、むこうが見えない */
function cvOpaque(j){const C=CV;if(!C.g[j])return true;const o=C.ob.get(j);return !!o&&!o.done&&(o.k==='e'||o.k==='f')}
function cvLos(x0,y0,x1,y1){/* マスのまん中からまん中へ。とちゅうのマスだけを見る（先のマスが岩でも、その岩は見える） */
  const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*3);for(let i=1;i<n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n,j=cvJ(x|0,y|0);if(j===cvJ(x1|0,y1|0))break;if(j!==cvJ(x0|0,y0|0)&&cvOpaque(j))return false}return true}
function cvReveal(cx,cy,R){const C=CV;for(let y=Math.max(0,Math.floor(cy-R));y<=Math.min(CVH-1,Math.ceil(cy+R));y++)for(let x=Math.max(0,Math.floor(cx-R));x<=Math.min(CVW-1,Math.ceil(cx+R));x++){const j=cvJ(x,y);if(C.seen[j]||Math.hypot(x+.5-cx,y+.5-cy)>R)continue;if(cvLos(cx,cy,x+.5,y+.5))C.seen[j]=1}}
/* 道さがし：goal(j) が true のマスまで。かえす：マスのならび（いまのマスはのぞく）。行けなければ null */
function cvBfs(sj,goal){const prev=new Int32Array(CVW*CVH).fill(-2),q=[sj];prev[sj]=-1;
  for(let h=0;h<q.length;h++){const j=q[h];if(goal(j)){const p=[];for(let k=j;k!==sj;k=prev[k])p.push(k);return p.reverse()}
    const x=cvX(j),y=cvY(j);for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<0||b<0||a>=CVW||b>=CVH)continue;const k=cvJ(a,b);if(prev[k]!==-2||!cvWalk(k))continue;prev[k]=j;q.push(k)}}return null}
function cvFace(e,dx,dy){if(Math.abs(dx)>Math.abs(dy)*1.2){e.turn=1;e.back=false;e.face=dx<0?-1:1}else{e.turn=0;e.back=dy<0}}
function cvMove(e,v){/* v：このコマに進むマスの数 */
  while(v>0&&e.path.length){const j=e.path[0],tx=cvX(j)+.5,ty=cvY(j)+.5+CVOY,dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d>.001)cvFace(e,dx,dy);
    if(d<=v){e.x=tx;e.y=ty;e.path.shift();v-=d}else{e.x+=dx/d*v;e.y+=dy/d*v;v=0}}}

/* ---------- 出かける前：パーティと食べ物をえらぶ ---------- */
function cavePrep(){if(!S||!started||CV)return;const h=hour();
  if(h<CVH0||h>=CVH1)return toast('洞窟へ出かけられるのは、朝6時から夕方4時までです');
  if((S.enemies||[]).some(e=>e.spawned&&!e.dead))return toast('コワイノがいるあいだは出かけられません');
  const L=S.res.filter(r=>!r.hidden&&!r.coffin&&!(r.act&&r.act.type==='faint'));if(!L.length)return toast('つれていけるせいれいがいません');
  const P=pxPop('洞窟へ出かける'),sel=[],food={};
  const h1=el('<small style="display:block;margin:2px 0 6px"></small>'),g1=el('<div class="grid"></div>'),h2=el('<small style="display:block;margin:10px 0 6px"></small>'),g2=el('<div class="grid"></div>'),go=el('<button class="btn pri" style="width:100%;margin-top:12px">出発する</button>'),rs=el('<button class="btn" style="margin-top:6px">食べ物をえらびなおす</button>');
  const fn=()=>Object.values(food).reduce((a,b)=>a+b,0);
  const upd=()=>{h1.textContent='つれていくせいれい（'+sel.length+'/'+CVPARTY+'）';h2.textContent='持っていく食べ物（'+fn()+'/'+CVFOOD+'）';
    g1.querySelectorAll('.slot').forEach(b=>b.classList.toggle('sel',sel.includes(b._r)));g2.querySelectorAll('.slot').forEach(b=>{b.querySelector('.ct').textContent=(food[b._k]||0)+'/'+S.fs[b._k];b.classList.toggle('sel',!!food[b._k])});
    lackOn(go,sel.length?'':'せいれいをえらんでください')};
  for(const r of L){const b=el('<button class="slot"><img alt="" style="width:40px;height:40px;image-rendering:pixelated"><span class="nm"></span><span class="nm"></span></button>');b._r=r;b.querySelector('img').src=spiritPort(r.elem,96,r.vr);
    const nm=b.querySelectorAll('.nm');nm[0].textContent=cvName(r);nm[1].textContent='おなか '+Math.round(r.hunger);
    b.onclick=()=>{sfx('tap');const i=sel.indexOf(r);if(i>=0)sel.splice(i,1);else if(sel.length<CVPARTY)sel.push(r);else return toast('つれていけるのは'+CVPARTY+'人までです');upd()};g1.appendChild(b)}
  const ks=Object.keys(S.fs||{}).filter(k=>S.fs[k]>0&&FOODS[k]);
  if(!ks.length)g2.appendChild(nodata('box','食べ物がないよ'));
  for(const k of ks){const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>'),im=typeof foodIc==='function'?foodIc(k):null;b._k=k;if(im)b.querySelector('img').src=im;else b.querySelector('img').remove();b.querySelector('.nm').textContent=FOODS[k].name;
    b.onclick=()=>{sfx('tap');if(fn()>=CVFOOD)return toast('食べ物は'+CVFOOD+'こまでです');if((food[k]||0)>=S.fs[k])return;food[k]=(food[k]||0)+1;upd()};g2.appendChild(b)}
  rs.onclick=()=>{sfx('tap');for(const k in food)delete food[k];upd()};
  go.onclick=()=>{if(!sel.length)return toast(go.dataset.lack);P.close();caveEnter(sel.slice(),Object.assign({},food))};
  P.body.append(h1,g1,h2,g2,rs,go);upd()}

/* ---------- 入る・出る ---------- */
function caveEnter(list,food){if(CV||!list.length)return false;
  const C=CV={g:new Uint8Array(CVW*CVH),seen:new Uint8Array(CVW*CVH),ob:new Map(),party:[],en:[],food:food||{},loot:{mat:{},pt:0,fukuro:0,mapPc:0},t:0,focus:null,askHome:-1,mark:null,sparks:[],flash:null,cam0:{x:cam.x,y:cam.y,z:cam.z},all:list.slice(),hudT:0,eve:false,img:null,dk:document.createElement('canvas'),hud:null,eid:1};
  let sx=0,sy=0;
  for(let y=0;y<CVH;y++)for(let x=0;x<CVW;x++){const ch=CVMAP[y][x],j=cvJ(x,y);if(ch==='#')continue;if(ch==='n'){C.ob.set(j,{k:'n',done:false});continue}C.g[j]=1;
    if(CVFOES[ch]){const D=EN[CVFOES[ch]];C.en.push({id:C.eid++,type:CVFOES[ch],x:x+.5,y:y+.5+CVOY,hp:D.hp,max:D.hp,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null})}
    else if(ch!=='.')C.ob.set(j,{k:ch,done:false});if(ch==='S'){sx=x;sy=y}}
  const cells=cvBfsRing(cvJ(sx,sy),list.length);
  list.forEach((r,i)=>{const j=cells[i]!=null?cells[i]:cvJ(sx,sy);C.party.push({r,elem:r.elem,id:r.id,x:cvX(j)+.5,y:cvY(j)+.5+CVOY,path:[],face:1,back:false,turn:0,swing:0,fback:false,fatk:0,job:null,mv:false,rp:0,cj:-1,hurtU:0,joyU:0,shockU:0,eatU:0,eatE:'',jumpT:0})});
  C.img=cvPaint();C.hud=cvHudMake();document.body.appendChild(C.hud);document.body.classList.add('cave');
  if(typeof followEnd==='function')followEnd();if(camAnim&&!camAnim.done)camAnim=null;LIGHTARM=false;if(typeof setMode==='function')setMode('look');
  cam.z=clamp(cam.z,1.4,2.2);cvCamTo(1);for(const a of C.party)cvReveal(a.x,a.y-CVOY,CVSEE);cvHudUpd();sfx('next');toast('洞窟に入った');return true}
function cvBfsRing(tj,n){/* tj から近い順に、歩けるマスを n こ */const out=[],seen=new Set([tj]),q=[tj];for(let h=0;h<q.length&&out.length<n;h++){const j=q[h];out.push(j);for(const[dx,dy]of DIRS){const a=cvX(j)+dx,b=cvY(j)+dy;if(a<0||b<0||a>=CVW||b>=CVH)continue;const k=cvJ(a,b);if(seen.has(k)||!cvWalk(k))continue;seen.add(k);q.push(k)}}return out}
function cvLootText(L){const t=[];for(const k in L.mat)if(L.mat[k])t.push(MATN[k]+' '+L.mat[k]+'こ');if(L.fukuro)t.push('ふしぎなふくろ '+L.fukuro+'こ');if(L.mapPc)t.push('地図の切れはし '+L.mapPc+'こ');if(L.pt)t.push('パワー '+L.pt);return t}
function cvClose(C){CV=null;document.body.classList.remove('cave');if(C.hud)C.hud.remove();for(const c of[C.img,C.dk])if(c)c.width=c.height=0;/* 作業用のキャンバスは、すぐ手ばなす */
  EVAP=[];LIGHTARM=false;if(typeof dockSync==='function')dockSync();cam.x=C.cam0.x;cam.y=C.cam0.y;cam.z=C.cam0.z;clampCam()}
function caveAbort(){if(CV)cvClose(CV)}/* 村を切りかえるとき：何もわたさずにおわる */
function caveExit(ok){const C=CV;if(!C)return;cvClose(C);const L=C.loot;
  if(ok){for(const k in L.mat)S.mat[k]=(S.mat[k]||0)+L.mat[k];if(L.pt){S.pt+=L.pt;PTW.q=true}if(L.fukuro){S.fukuro=(S.fukuro||0)+L.fukuro;(S.seenIt||(S.seenIt={}))['x:fukuro']=1}if(L.mapPc){S.mapPc=(S.mapPc||0)+L.mapPc;(S.seenIt||(S.seenIt={}))['x:mapPc']=1}}
  /* 村の時計を、洞窟にいた時間ぶん進める（夜20時まで）。つれていったせいれいは、そのあいだ何もしていない */
  const hold=C.all.filter(r=>S.res.includes(r));for(const r of hold)RHOLD.set(r,performance.now()+6e5);
  let g=C.t*DAYLEN;try{while(g>0&&!paused()&&hour()>=CVH0&&hour()<CVNIGHT){const s=Math.min(g,2);stepWorld(s);g-=s}}catch(e){if(typeof frameErr==='function')frameErr('cave',e)}
  for(const r of hold)RHOLD.delete(r);try{save()}catch(e){}
  if(!ok)return toast('洞窟から、だれももどらなかった','warn');
  sfx('arrive');const P=pxPop('洞窟からもどった'),T=cvLootText(L),R=el('<div class="recs"></div>');if(!T.length)T.push('なにもひろわなかった');for(const t of T){const d=el('<div class="st"><span></span></div>');d.firstChild.textContent=t;R.appendChild(d)}P.body.appendChild(R)}
function cvHomeAsk(){const P=pxPop('村へかえる'),T=cvLootText(CV.loot),R=el('<div class="recs"></div>'),b=el('<button class="btn pri" style="width:100%;margin-top:10px">村へかえる</button>');
  if(!T.length)T.push('まだ、なにもひろっていない');for(const t of T){const d=el('<div class="st"><span></span></div>');d.firstChild.textContent=t;R.appendChild(d)}
  b.onclick=()=>{P.close();caveExit(true)};P.body.append(R,b)}

/* ---------- ひろう・食べる ---------- */
function cvLoot(L){const T=CV.loot;for(const k in L.mat||{}){T.mat[k]=(T.mat[k]||0)+L.mat[k];toast(MATN[k]+'を'+L.mat[k]+'こひろった','good')}
  if(L.fukuro){T.fukuro+=L.fukuro;toast('ふしぎなふくろをひろった','good')}if(L.mapPc){T.mapPc+=L.mapPc;toast('地図の切れはしをひろった','good')}if(L.pt)T.pt+=L.pt}
function cvEatPop(a){const C=CV;if(!C||!C.party.includes(a))return;const P=pxPop(cvName(a.r)+'が食べる物'),g=el('<div class="grid"></div>');P.body.appendChild(g);
  const ks=Object.keys(C.food).filter(k=>C.food[k]>0&&S.fs[k]>0);if(!ks.length){g.appendChild(nodata('box','食べ物がないよ'));return}
  for(const k of ks){const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>'),im=typeof foodIc==='function'?foodIc(k):null;if(im)b.querySelector('img').src=im;else b.querySelector('img').remove();b.querySelector('.ct').textContent=C.food[k];b.querySelector('.nm').textContent=FOODS[k].name;
    b.onclick=()=>{P.close();cvEat(a,k)};g.appendChild(b)}}
function cvEat(a,k){const C=CV,r=a.r;if(!C||!(C.food[k]>0)||!(S.fs[k]>0))return false;C.food[k]--;availAdd('f:'+k,-1);/* 食べた分だけ、村の食べ物がへる */
  r.hunger=Math.min(hMax(r),r.hunger+FOODS[k].v*1000/fullN(r));a.eatU=performance.now()+1500;a.eatE=FOODS[k].e;a.path=[];a.mv=false;sfx('good');cvHudUpd();return true}

/* ---------- たたかい ---------- */
function cvSup(a){/* ならんで戦う力（support.js と同じ数）：3マス以内の、なかよしのなかま */let b=0;for(const q of CV.party)if(q!==a&&Math.hypot(q.x-a.x,q.y-a.y)<=SUPR)b=Math.max(b,supAtkOf(bondOf(a.r,q.r)));return b}
function cvDefeat(e,a){if(e.dead)return;e.dead=true;const D=EN[e.type],C=CV;EVAP.push({e,t0:performance.now()+HIT_LAG,dur:1300,die:true});setTimeout(()=>{if(CV===C)sfx('defeat')},HIT_LAG+KO_HOLD);
  C.loot.pt+=D.pw;if(a&&S.res.includes(a.r)){a.r.beat=(a.r.beat||0)+1;addSpiritXp(D.xp,a.r)}if(C.focus===e)C.focus=null}
function cvAttack(a,en){const r=a.r,C=CV,G=gearStat(r),lv=rLv(r);a.face=en.x>=a.x?1:-1;a.turn=Math.abs(en.x-a.x)>Math.abs(en.y-a.y)*.6?1:0;a.fback=en.y<a.y-.3&&Math.abs(en.y-a.y)>Math.abs(en.x-a.x)*.6;a.back=a.fback;a.swing=performance.now();a.path=[];
  if(r.elem==='fire'){a.fatk=C.t+5*G.iv/rMul(r,'work');const ba=((r.bst&&r.bst.atk)||0)+((r.sst&&r.sst.atk)||0),dmg=Math.max(5,Math.round((fAtk(r,lv)+ba+G.atk+cvSup(a))*fireMul(r)));
    for(let i=0;i<G.hit;i++)hurtEn(en,dmg,{lag:HIT_LAG+i*90,sx:a.x,sy:a.y,dt:'fire',el:'fire'});en.stun=Math.max(en.stun||0,1)}
  else{const E=SORTIE[r.elem]||SORTIE.wood;a.fatk=C.t+E.cd/rMul(r,'work');
    if(E.stop)en.stun=waterStop(r,en)*(typeof weakStun==='function'?weakStun(en,'water'):1);
    else{hurtEn(en,Math.max(1,Math.round(rMul(r,'atk')*100)+cvSup(a)),{lag:HIT_LAG,sx:a.x,sy:a.y,el:r.elem});en.stun=Math.max(en.stun||0,1)}}
  en.tg=a;en.asleep=false;setTimeout(()=>{if(CV===C){atkFX(a,en);atkSfx(a)}},HIT_LAG);if(en.hp<=0)cvDefeat(en,a)}
function cvHit(e,a){const D=EN[e.type],r=a.r,G=gearStat(r),n=Math.max(0,Math.round((r.elem==='fire'?D.hitF:D.hitN)-G.hun));
  enAim(e,a.x,a.y);sfx('hit');e.swing=performance.now();enLunge(e,a);r.hunger=Math.max(0,r.hunger-n);a.hurtU=performance.now()+3000;if(n>0)hitFx(a,n,{sx:e.x,sy:e.y,silent:1});cvHudUpd()}
function cvDie(a){const C=CV,r=a.r;C.party=C.party.filter(q=>q!==a);
  if(STATUE>=0){r.x=STATUE%W+.5;r.y=((STATUE/W)|0)+1.5}/* 村の神殿の前で消えたのと同じ */die(r);cvHudUpd();
  if(!C.party.length)setTimeout(()=>{if(CV===C)caveExit(false)},600)}
function cvTarget(a){const C=CV;let b=null,bd=CVAGGRO;const f=C.focus;if(f&&!f.dead&&!f.asleep&&Math.hypot(f.x-a.x,f.y-a.y)<CVAGGRO+4)return f;
  for(const e of C.en){if(e.dead||e.asleep)continue;const d=Math.hypot(e.x-a.x,e.y-a.y)+(a.elem==='water'&&e.stun>1?3:0);if(d<bd){bd=d;b=e}}return b}
/* まもりの光：村と同じ（パワー1・チャージ・威力・とめる時間・範囲は GUP）。光の落ちた所のまわりは、見えるようになる */
function caveLight(tx,ty){const C=CV;PTW.q=true;if(LIGHTCD>0)return toast('まもりの光は、あと'+Math.ceil(LIGHTCD/(S.speed||1))+'秒'),false;if(S.pt<1)return toast('パワーが足りません'),false;if(tx<0||ty<0||tx>=CVW||ty>=CVH)return false;
  S.pt-=1;LIGHTCD=lightCdMax();const R=gupOf('rng').v[gupLv('rng')],wy=ty+CVOY;fxSpr('godlight',tx*TS+16,wy*TS+26);
  setTimeout(()=>{if(CV===C)sfxAt('glight',tx,wy)},GLHIT);setTimeout(()=>{if(CV===C){skillFx('light');cvLightHit(tx,ty,R)}},GLFX);return true}
function cvLightHit(tx,ty,R){const C=CV,G=gupOf('stun'),gs=gupLv('stun'),pw=gupOf('pow').v[gupLv('pow')],now=performance.now();
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=CVW||y>=CVH||!dx&&!dy||!C.g[cvJ(x,y)])continue;const d=Math.max(Math.abs(dx),Math.abs(dy));if(d<R&&(dx+dy)&1)continue;setTimeout(()=>{if(CV===C)fxSpr('glspark',x*TS+16,(y+CVOY)*TS+16+GLSPY)},d*GLSTEP)}
  for(const e of C.en){if(e.dead||Math.max(Math.abs((e.x|0)-tx),Math.abs((e.y|0)-CVOY-ty))>R)continue;hurtEn(e,pw,{flash:8,k:'light',skill:1,sx:tx+.5,sy:ty+CVOY+.5});e.stun=G.v[gs];e.asleep=false;e.path=[];if(e.hp<=0)cvDefeat(e,null)}
  C.flash={x:tx+.5,y:ty+.5,t0:now};if(C.g[cvJ(tx,ty)])cvReveal(tx+.5,ty+.5,R+2.5);else for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=tx+dx,y=ty+dy;if(x>=0&&y>=0&&x<CVW&&y<CVH)C.seen[cvJ(x,y)]=1}
  for(const a of C.party)if(Math.max(Math.abs(a.x-tx-.5),Math.abs(a.y-CVOY-ty-.5))-R<=GLSHOCKR){a.shockU=now+GLSHOCKT;a.jumpT=now}}

/* ---------- 指示：歩く・物を使う ---------- */
function cvGo(tj,skip){const C=CV,L=C.party.filter(a=>a!==skip),ring=cvBfsRing(tj,L.length+(skip?1:0)).filter(j=>!skip||!skip.path.length||j!==skip.path[skip.path.length-1]);
  L.forEach((a,i)=>{const dj=ring[i]!=null?ring[i]:tj,p=cvBfs(cvCell(a),j=>j===dj);a.job=null;a.chase=false;if(p){a.path=p;a.mv=true}})}
const cvObjTap=o=>!!o&&(CVGATE[o.k]?!o.done:o.k==='o'||o.k==='S'||o.k==='R'||o.k==='T'&&!o.done);
function cvUse(j,o){const C=CV;C.focus=null;C.askHome=-1;
  if(CVGATE[o.k]){const D=CVGATE[o.k],a=C.party.find(q=>q.elem===D.el);if(!a)return toast(D.no);const p=cvBfs(cvCell(a),q=>cvAdj(q,j));if(!p)return toast('そこへ行けません');
    a.job={k:'gate',j,t:0};a.path=p;a.mv=false;a.chase=false;cvGo(p.length?p[p.length-1]:cvCell(a),a);sfx('tap');return}
  if(o.k==='S'||o.k==='R'){if(C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<1.6))return cvHomeAsk();cvGo(j);C.askHome=j;sfx('tap');return}
  let ba=null,bp=null;for(const a of C.party){const p=cvBfs(cvCell(a),q=>cvAdj(q,j));if(p&&(!bp||p.length<bp.length)){bp=p;ba=a}}if(!ba)return toast('そこへ行けません');
  ba.job={k:o.k==='o'?'pick':'chest',j,t:0};ba.path=bp;ba.mv=false;ba.chase=false;cvGo(bp.length?bp[bp.length-1]:cvCell(ba),ba);sfx('tap')}
function caveTap(sx,sy){const C=CV;if(!C||cvHold())return;const w=toWorld(sx,sy),wx=w.x/TS,wy=w.y/TS,x=Math.floor(wx),y=Math.floor(wy)-CVOY;
  if(LIGHTARM){caveLight(x,y);return}
  {let be=null,bd=1e9;for(const e of C.en){if(e.dead||!C.seen[cvCell(e)])continue;const z=EN[e.type].size,d=Math.hypot(e.x-wx,e.y-.6*z-wy);if(d<.9*Math.max(1,z)&&d<bd){bd=d;be=e}}
    if(be){C.focus=be;C.askHome=-1;for(const a of C.party){a.mv=false;a.job=null;a.rp=0}C.mark={x:be.x,y:be.y-CVOY,t0:performance.now(),foe:1};sfx('tap');return}}
  if(x<0||y<0||x>=CVW||y>=CVH)return;let j=cvJ(x,y),o=C.ob.get(j);
  if(!cvObjTap(o)&&y+1<CVH&&wy-(y+CVOY)>.45){const o2=C.ob.get(j+CVW);if(cvObjTap(o2)&&o2.k!=='S'&&o2.k!=='R'){o=o2;j+=CVW}}/* 物の絵は上へはみ出すので、すぐ上のマスの下半分でも、その物 */
  if(cvObjTap(o)&&C.seen[j])return cvUse(j,o);
  let tj=j;if(!C.seen[tj]||!cvWalk(tj)){tj=-1;let bd=1e9;for(let k=0;k<CVW*CVH;k++)if(C.seen[k]&&cvWalk(k)){const d=Math.hypot(cvX(k)-x,cvY(k)-y);if(d<bd){bd=d;tj=k}}}/* 見えている歩けるマスのうち、いちばん近い所 */
  if(tj<0)return;C.focus=null;C.askHome=-1;cvGo(tj);C.mark={x:cvX(tj)+.5,y:cvY(tj)+.5,t0:performance.now()};sfx('tap')}

/* ---------- 1コマ ---------- */
function cvJobTick(a,cdt,now){const C=CV,J=a.job,o=C.ob.get(J.j);if(!o||!cvObjTap(o)){a.job=null;return}
  const cj=cvCell(a);if(!cvAdj(cj,J.j)){const p=cvBfs(cj,q=>cvAdj(q,J.j));if(!p){a.job=null;return}a.path=p;return}
  cvFace(a,cvX(J.j)-cvX(cj),cvY(J.j)-cvY(cj));
  if(J.k==='pick'){C.ob.delete(J.j);cvLoot(CVPILE);sfxAt('pick_stone',a.x,a.y);a.job=null;return}
  if(J.k==='chest'){o.done=true;cvLoot(CVCHEST[cvX(J.j)+','+cvY(J.j)]||{});sfx('quest');cvSpark(cvX(J.j)+.5,cvY(J.j)+.4,'#ffe58a',14);a.joyU=now+1400;a.jumpT=now;a.job=null;return}
  const D=CVGATE[o.k];J.t+=cdt*rMul(a.r,'work');a.r.hunger-=CVHUN.work*cdt;
  if(J.t>=D.t){o.done=true;a.job=null;a.joyU=now+1400;a.jumpT=now;sfx('good');toast(D.ok,'good');cvSpark(cvX(J.j)+.5,cvY(J.j)+.5,o.k==='f'?'#ffb36b':o.k==='w'?'#9fd8ff':o.k==='k'?'#8fd07a':'#d9c7a8',16);if(o.k==='n')cvLoot(CVGAP);for(const q of C.party)cvReveal(q.x,q.y-CVOY,CVSEE)}}
function cvActor(a,cdt,mv,now){const C=CV,r=a.r;if(a.eatU>now)return;
  const cj=cvCell(a);if(cj!==a.cj){a.cj=cj;cvReveal(a.x,a.y-CVOY,CVSEE)}
  if(a.path.length){if(a.chase){const en=cvTarget(a),E=SORTIE[a.elem]||SORTIE.wood;if(!en)a.path=[];else if(Math.hypot(en.x-a.x,en.y-a.y)<=Math.min(E.rng,1.5)&&cvLos(a.x,a.y-CVOY,en.x,en.y-CVOY))a.path=[]}/* ねらうコワイノにとどいたら、そこで止まる */
    cvMove(a,mv*CVWALK*rMul(r,'move'));r.hunger-=CVHUN.walk*cdt;if(!a.path.length){a.mv=false;a.chase=false}}
  else{r.hunger-=CVHUN.stand*cdt;
    if(a.job)cvJobTick(a,cdt,now);
    else{const en=cvTarget(a);if(en){const E=a.elem==='fire'?SORTIE.wood:SORTIE[a.elem]||SORTIE.wood,d=Math.hypot(en.x-a.x,en.y-a.y);
      if(d<=E.rng&&cvLos(a.x,a.y-CVOY,en.x,en.y-CVOY)){if(C.t>=a.fatk&&!(E.stop&&en.stun>1))cvAttack(a,en)}
      else if((a.rp-=mv)<=0){a.rp=.4;const ej=cvCell(en),p=cvBfs(cj,q=>cvAdj(q,ej)||q===ej);if(p&&p.length){if(p[p.length-1]===ej)p.pop();a.path=p;a.chase=true}}}}}
  if(r.hunger<=0){r.hunger=0;cvDie(a)}}
function cvFoe(e,cdt,mv){const C=CV;if(e.dead)return;const D=EN[e.type];
  if(e.asleep){if(C.seen[cvCell(e)])for(const a of C.party)if(Math.hypot(a.x-e.x,a.y-e.y)<=CVWAKE&&cvLos(e.x,e.y-CVOY,a.x,a.y-CVOY)){e.asleep=false;e.wakeT=performance.now();break}return}
  if(e.stun>0){e.stun-=cdt;return}
  let tg=e.tg&&C.party.includes(e.tg)?e.tg:null,bd=1e9;if(!tg)for(const a of C.party){const d=Math.hypot(a.x-e.x,a.y-e.y);if(d<bd){bd=d;tg=a}}if(!tg)return;
  const d=Math.hypot(tg.x-e.x,tg.y-e.y);
  if(d<=Math.max(1.15,(D.rng||0))&&cvLos(e.x,e.y-CVOY,tg.x,tg.y-CVOY)){e.path=[];enAim(e,tg.x,tg.y);e.atk+=cdt;if(e.atk>=D.atk){e.atk=0;cvHit(e,tg)}}
  else{if((e.rp-=mv)<=0||!e.path.length){e.rp=.5;const tj=cvCell(tg),p=cvBfs(cvCell(e),q=>q===tj);if(p){p.pop();e.path=p}else{e.path=[];e.tg=null}}cvMove(e,mv*CVFOE*D.sp)}}
function caveFrame(rdt,now){const C=CV;if(!C||cvHold())return;const sp=S.speed||1,cdt=rdt*MIN_PER_SEC*sp,mv=rdt*sp;C.t+=cdt/DAYLEN;LIGHTCD=Math.max(0,LIGHTCD-rdt*sp);
  for(const a of C.party.slice()){cvActor(a,cdt,mv,now);if(CV!==C)return}
  for(const e of C.en)cvFoe(e,cdt,mv);if(CV!==C)return;
  if(C.en.some(e=>e.dead))C.en=C.en.filter(e=>!e.dead);
  if(C.askHome>=0&&C.party.every(a=>!a.path.length)){const j=C.askHome;C.askHome=-1;if(C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<1.6))cvHomeAsk()}
  const h=cvHour();if(!C.eve&&h>=17){C.eve=true;toast('外は夕方です','warn')}if(h>=CVNIGHT||h<CVH0){toast('夜になるので、村へもどります','warn');return caveExit(true)}
  if((C.hudT+=rdt)>.3){C.hudT=0;cvHudUpd()}}

/* ---------- 画面の部品（パーティの札・時刻・かえる） ---------- */
function cvHudMake(){const C=CV,h=el('<div id="caveHud" style="position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 132px);z-index:20;display:flex;flex-direction:column;gap:5px;align-items:flex-start"></div>');
  const tm=el('<div class="cvtm" style="background:var(--panel);color:var(--ink);font-size:10px;padding:3px 8px"></div>');h.appendChild(tm);
  for(const a of C.party){const b=el('<button class="cvc" style="display:flex;align-items:center;gap:6px;background:var(--panel);color:var(--ink);padding:4px 8px 4px 4px;font-size:10px;min-width:124px;min-height:44px;text-align:left"><span class="fc" style="width:36px;height:36px;display:block;flex:none;overflow:hidden"></span><span style="display:flex;flex-direction:column;gap:3px;flex:1"><span class="nm"></span><span style="display:block;width:70px;height:5px;background:#e8dcc0"><i style="display:block;height:100%;width:0;background:#7ee08a"></i></span><span class="hn"></span></span></button>');
    const fc=typeof spiritCanvas==='function'?spiritCanvas(a.r,72,68,92,'smile'):null;if(fc){fc.style.cssText='width:36px;height:34px;image-rendering:pixelated';b.querySelector('.fc').appendChild(fc)}
    b.querySelector('.nm').textContent=cvName(a.r);b._a=a;b.onclick=()=>{sfx('tap');cvEatPop(a)};h.appendChild(b)}
  const hm=el('<button class="btn cvhome" style="font-size:10px;min-height:44px">村へかえる</button>');hm.onclick=()=>{const C2=CV;if(!C2)return;if(hm.dataset.lack)return toast(hm.dataset.lack);sfx('tap');cvHomeAsk()};h.appendChild(hm);return h}
function cvNearHome(){const C=CV;for(const[j,o]of C.ob)if((o.k==='S'||o.k==='R')&&C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<1.6))return true;return false}
function cvHudUpd(){const C=CV;if(!C||!C.hud)return;const h=cvHour(),fn=Object.keys(C.food).reduce((n,k)=>n+Math.min(C.food[k],S.fs[k]||0),0);
  C.hud.querySelector('.cvtm').textContent=Math.floor(h)+':'+String(Math.floor(h%1*60)).padStart(2,'0')+'　食べ物 '+fn;
  C.hud.querySelectorAll('.cvc').forEach(b=>{const a=b._a,alive=C.party.includes(a),m=hMax(a.r),v=alive?clamp(a.r.hunger/m,0,1):0,i=b.querySelector('i');i.style.width=Math.round(v*100)+'%';i.style.background=v>.5?'#7ee08a':v>.25?'#e0a43a':'#ff6b6b';b.querySelector('.hn').textContent=alive?'おなか '+Math.max(0,Math.round(a.r.hunger))+'/'+m:'いない';b.style.opacity=alive?'1':'.5';b.disabled=!alive});
  lackOn(C.hud.querySelector('.cvhome'),cvNearHome()?'':'入口か、かえりの光のそばでかえれます')}

/* ---------- 絵（仮の絵：コードのドット。1マス32ドット） ---------- */
function cvPaint(){const C=CV,c=document.createElement('canvas');c.width=CVW*TS;c.height=CVH*TS;const g=c.getContext('2d'),W0=(x,y)=>x<0||y<0||x>=CVW||y>=CVH||!C.g[cvJ(x,y)];
  for(let y=0;y<CVH;y++)for(let x=0;x<CVW;x++){const ox=x*TS,oy=y*TS,h=n=>hash((cvJ(x,y)*7+n*131+977)>>>0);
    if(!W0(x,y)){g.fillStyle='#9c8b74';g.fillRect(ox,oy,TS,TS);
      for(let i=0;i<10;i++){g.fillStyle=h(i)<.5?'#8f7e68':'#a89780';g.fillRect(ox+((h(i+20)*30)|0),oy+((h(i+40)*30)|0),h(i+60)<.5?2:1,1)}
      if(h(90)<.22){const px=ox+4+((h(91)*20)|0),py=oy+6+((h(92)*18)|0);g.fillStyle='#7f705d';g.fillRect(px,py+1,5,3);g.fillRect(px+1,py,3,1);g.fillStyle='#b3a48e';g.fillRect(px+1,py+1,2,1)}
      if(W0(x,y-1)){const A=[.34,.24,.15,.07];for(let i=0;i<4;i++){g.fillStyle='rgba(58,47,38,'+A[i]+')';g.fillRect(ox,oy+i*2,TS,2)}}
      if(W0(x-1,y)){g.fillStyle='rgba(58,47,38,.14)';g.fillRect(ox,oy,2,TS)}if(W0(x+1,y)){g.fillStyle='rgba(58,47,38,.08)';g.fillRect(ox+TS-2,oy,2,TS)}}
    else{g.fillStyle='#5b4e43';g.fillRect(ox,oy,TS,TS);for(let i=0;i<8;i++){g.fillStyle=h(i)<.5?'#51453b':'#665849';g.fillRect(ox+((h(i+20)*30)|0),oy+((h(i+40)*30)|0),2,1)}
      if(!W0(x,y+1)){/* 手前に床がある岩：下の22ドットは、岩の正面 */g.fillStyle='#7d6c5a';g.fillRect(ox,oy+10,TS,22);g.fillStyle='#917f6b';g.fillRect(ox,oy+10,TS,1);g.fillStyle='#6a5c4f';g.fillRect(ox,oy+9,TS,1);
        for(let r=0;r<3;r++){const yy=oy+15+r*6,br=4+((h(70+r)*20)|0);g.fillStyle='#6c5c4c';g.fillRect(ox,yy,br,1);g.fillRect(ox+br+3,yy,TS-br-3,1);g.fillStyle='#8a7865';g.fillRect(ox+((h(80+r)*24)|0),yy+2,4,1)}
        g.fillStyle='#5f5143';g.fillRect(ox,oy+30,TS,2)}
      else{g.fillStyle='#6b5d50';if(!W0(x,y-1))g.fillRect(ox,oy,TS,2);if(!W0(x-1,y))g.fillRect(ox,oy,2,TS);if(!W0(x+1,y))g.fillRect(ox+TS-2,oy,2,TS)}}}
  return c}
function cvSpark(x,y,col,n){const C=CV,t0=performance.now();for(let i=0;i<n;i++){const an=i/n*6.283+Math.random()*.6,v=.8+Math.random()*1.6;C.sparks.push({x,y,vx:Math.cos(an)*v,vy:Math.sin(an)*v*.6-1.2,t0,col})}}
const P4=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
function cvDrawObj(j,o,now){const ox=cvX(j)*TS,oy=(cvY(j)+CVOY)*TS,k=o.k,hs=n=>hash((j*13+n*71+5)>>>0);
  if(k==='S'||k==='R'){const t=now/1000;for(let i=0;i<12;i++){const an=i/12*6.283+t*.6;P4(i%2?'#fff3c4':'#ffe08a',ox+16+Math.cos(an)*11-1,oy+18+Math.sin(an)*5-1,2,2)}
    for(let i=0;i<5;i++){const p=(t*.5+i*.2)%1;ctx.globalAlpha=1-p;P4('#fff3c4',ox+8+hs(i)*16,oy+16-p*26,2,2)}ctx.globalAlpha=1;return}
  if(k==='o'){P4('#6f6253',ox+6,oy+18,10,7);P4('#8d7f6d',ox+7,oy+17,8,2);P4('#a3957f',ox+8,oy+18,3,1);P4('#6f6253',ox+15,oy+14,11,10);P4('#8d7f6d',ox+16,oy+13,9,3);P4('#a3957f',ox+17,oy+14,4,1);P4('#5e5246',ox+11,oy+22,9,4);P4('#8d7f6d',ox+12,oy+21,7,2);return}
  if(k==='T'){P4('rgba(40,25,10,.2)',ox+5,oy+26,22,3);P4('#7a4f2a',ox+6,oy+14,20,13);P4('#96673a',ox+6,oy+14,20,2);P4('#5f3c1f',ox+6,oy+25,20,2);
    if(o.done){P4('#3a2616',ox+7,oy+10,18,5);P4('#96673a',ox+6,oy+4,20,6);P4('#b48246',ox+6,oy+4,20,2);P4('#5f3c1f',ox+6,oy+9,20,1)}
    else{P4('#96673a',ox+6,oy+8,20,7);P4('#b48246',ox+6,oy+8,20,2);P4('#5f3c1f',ox+6,oy+14,20,1);P4('#e8c45a',ox+14,oy+12,4,5);P4('#fff0b0',ox+15,oy+13,1,1);const tw=Math.sin(now/300+j)>.6;if(tw){P4('#fff3c4',ox+24,oy+5,2,2);P4('#fff3c4',ox+4,oy+10,1,1)}}return}
  if(k==='e'&&!o.done){const R=[[2,12,13,12],[13,6,14,13],[6,20,12,9],[17,17,12,12],[9,3,10,9]];for(const[a,b,w,h]of R){P4('#5e5246',ox+a,oy+b,w,h);P4('#85776a',ox+a,oy+b,w-2,h-3);P4('#a3957f',ox+a+1,oy+b+1,Math.max(2,w>>1),1)}return}
  if(k==='f'&&!o.done){ctx.globalAlpha=.9;for(let i=0;i<8;i++){const an=i/8*3.1416;for(let d=-15;d<=15;d+=2)P4(d%4?'#efe9e2':'#d6cfc6',ox+16+Math.cos(an)*d,oy+16+Math.sin(an)*d,2,1)}for(const r of[5,10,14])for(let i=0;i<20;i++){const an=i/20*6.283;P4('#f7f3ee',ox+16+Math.cos(an)*r,oy+16+Math.sin(an)*r,1,1)}ctx.globalAlpha=1;return}
  if(k==='w'&&!o.done){P4('#6b4f38',ox+3,oy+10,26,16);P4('#6b4f38',ox+6,oy+7,20,22);P4('#7d5f45',ox+6,oy+10,20,14);P4('#93755a',ox+9,oy+12,7,2);P4('#93755a',ox+19,oy+19,5,1);const b=(now/700+j)%1;ctx.globalAlpha=1-b;P4('#a98a6c',ox+13,oy+20-b*4,3,2);ctx.globalAlpha=1;return}
  if(k==='k'){for(let r=0;r<16;r++){const off=((hs(r)*5)|0)-2,w=10+((hs(r+30)*6)|0);P4('#2a211a',ox+16-w/2+off,oy+r*2,w,2);P4('#4a3d32',ox+16-w/2+off-1,oy+r*2,1,2)}
    if(o.done){for(let i=0;i<3;i++){P4('#6e8f4a',ox+2,oy+8+i*6,28,4);P4('#8fb563',ox+2,oy+8+i*6,28,1);P4('#4f6b35',ox+2,oy+11+i*6,28,1)}P4('#8fb563',ox+5,oy+5,3,2);P4('#8fb563',ox+23,oy+26,3,2)}return}
  if(k==='n'){P4('#2a211a',ox+13,oy+13,6,17);P4('#4a3d32',ox+12,oy+13,1,17);P4('#4a3d32',ox+19,oy+13,1,17);if(!o.done&&Math.sin(now/260+j)>.2){P4('#fff3c4',ox+15,oy+20,2,2);P4('#ffe08a',ox+14,oy+21,1,1);P4('#ffe08a',ox+17,oy+20,1,1)}}}
function cvDrawActor(a,now){const C=CV,r=a.r,eat=a.eatU>now,walking=a.path.length>0&&!eat,sd=now-a.swing;let px=a.x*TS,py=a.y*TS;
  if(a.swing&&sd>=0&&sd<400)px+=(a.face<0?-1:1)*atkLunge(sd);px+=hitOff(a,now,1)[0];
  const jd=now-(a.jumpT||-1e9),hop=jd>=0&&jd<1000?Math.abs(Math.sin(jd/130))*9*(1-jd/1000):0,fy=py+9-(walking?Math.abs(Math.sin(now/110+a.id))*2.5:0)-hop;
  shadow(ctx,px,py+8,12,3.6);
  const pk=a.swing&&sd>=0&&sd<420?sd/420:null,J=a.job&&!walking&&a.job.k==='gate'?C.ob.get(a.job.j):null,job=J&&CVGATE[J.k]?CVGATE[J.k].anim:'',joy=a.joyU>now,fight=C.en.some(e=>!e.dead&&!e.asleep&&Math.hypot(e.x-a.x,e.y-a.y)<CVAGGRO);
  drawSpirit(ctx,r.elem,px,fy,.435,a.face<0?-1:1,{dot:1,t:now/1000+a.id*1.7,vr:r.vr,pp:pk,anim:pk!=null?'punch':eat?'eat':joy?'clap':job,food:eat?a.eatE:'',walk:walking,work:!!job,back:joy||eat?false:a.back,turn:joy||eat?0:a.turn,mood:a.shockU>now?'shock':joy||eat?'joy':r.hunger<HUNGRYF?'hungry':fight?'brave':'',blink:(now/1000+a.id*1.3)%3.4<.13});
  if(a.hurtU>now){const m=hMax(r),v=clamp(r.hunger/m,0,1);P4('rgba(0,0,0,.6)',px-12,py+11,24,5);P4(v>.5?'#7ee08a':v>.25?'#ecdcbc':'#ff6b6b',px-11,py+12,Math.max(2,Math.round(22*v)),3)}
  if(J&&job){const f=clamp(a.job.t/CVGATE[J.k].t,0,1);P4('rgba(150,115,75,.6)',px-17,py+17,34,7);P4('#e8dcc0',px-16,py+18,32,5);P4('#e0a43a',px-16,py+18,Math.max(2,Math.round(32*f)),5)}}
function cvCamTo(k){const C=CV;if(!C||!C.party.length)return;let x=0,y=0;for(const a of C.party){x+=a.x;y+=a.y}x=x/C.party.length*TS;y=(y/C.party.length-.6)*TS;const tx=x-VW/cam.z/2,ty=y-VH/cam.z/2;cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k}
function caveClamp(){cam.z=clamp(cam.z,1.2,3)}/* 洞窟のあいだは、カメラはパーティを追う（clampCam のかわり） */
function caveRender(now){const C=CV;if(!C)return;cvCamTo(.12);const k=dpr*cam.z;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1a1511';ctx.fillRect(0,0,cv.width,cv.height);const CX=Math.round(cam.x*k),CY=Math.round(cam.y*k);ctx.setTransform(k,0,0,k,-CX,-CY);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.drawImage(C.img,0,CVOY*TS);
  /* 物・せいれい・コワイノを、足もとの順に */
  const L=[];for(const[j,o]of C.ob){if(!C.seen[j])continue;const fl=o.k==='S'||o.k==='R'||o.k==='k'||o.k==='w';L.push([fl?-1:cvY(j)+CVOY+.9,()=>cvDrawObj(j,o,now)])}
  for(const a of C.party)L.push([a.y,()=>cvDrawActor(a,now)]);
  for(const e of C.en){if(e.dead||!C.seen[cvCell(e)])continue;L.push([e.y,()=>{if(e.asleep){const s=e.stun;e.stun=1;drawEnemy(e,now);e.stun=s;const z=EN[e.type].size,t=(now/900)%1;ctx.globalAlpha=1-t;P4('#e8e0f4',e.x*TS+8,e.y*TS-30*z-t*8,4,1);P4('#e8e0f4',e.x*TS+10,e.y*TS-29*z-t*8,2,1);P4('#e8e0f4',e.x*TS+8,e.y*TS-28*z-t*8,4,1);ctx.globalAlpha=1}else drawEnemy(e,now)}])}
  L.sort((p,q)=>p[0]-q[0]);for(const d of L)d[1]();
  EVAP=EVAP.filter(it=>now-it.t0<(it.dur||1800)+600+(it.die?KO_HOLD:0));for(const it of EVAP)drawEvap(it,now);
  /* 光のつぶ（ひらいた・あけたとき） */
  C.sparks=C.sparks.filter(s=>now-s.t0<700);for(const s of C.sparks){const t=(now-s.t0)/1000;ctx.globalAlpha=1-t/.7;P4(s.col,(s.x+s.vx*t)*TS-1,(s.y+CVOY+s.vy*t+2.2*t*t)*TS-1,2,2)}ctx.globalAlpha=1;
  /* 暗さ：光のとどく所だけ明るい。まだ見ていない所は、まっくら */
  {const D=C.dk;if(D.width!==cv.width||D.height!==cv.height){D.width=cv.width;D.height=cv.height}const g=D.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,D.width,D.height);g.fillStyle='rgba(18,14,10,.74)';g.fillRect(0,0,D.width,D.height);
    g.globalCompositeOperation='destination-out';const LS=lightSpr(150),sx=x=>x*TS*k-CX,sy=y=>y*TS*k-CY,cut=(x,y,R)=>{const r=R*TS*k;g.drawImage(LS,sx(x)-r,sy(y)-r,r*2,r*2)};
    for(const a of C.party){cut(a.x,a.y-.4,CVLIGHT);cut(a.x,a.y-.4,CVLIGHT*.6)}for(const[j,o]of C.ob)if((o.k==='S'||o.k==='R')&&C.seen[j])cut(cvX(j)+.5,cvY(j)+CVOY+.5,2.2);
    if(C.flash){const t=(now-C.flash.t0)/900;if(t>=1)C.flash=null;else{g.globalAlpha=1-t;cut(C.flash.x,C.flash.y+CVOY,5);g.globalAlpha=1}}
    g.globalCompositeOperation='source-over';g.fillStyle='#1a1511';const x0=Math.max(0,Math.floor(cam.x/TS)),x1=Math.min(CVW-1,Math.ceil((cam.x+VW/cam.z)/TS)),y0=Math.max(0,Math.floor(cam.y/TS)-CVOY),y1=Math.min(CVH-1,Math.ceil((cam.y+VH/cam.z)/TS)-CVOY);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(C.seen[cvJ(x,y)])continue;let x2=x;while(x2+1<=x1&&!C.seen[cvJ(x2+1,y)])x2++;const a=Math.floor(sx(x)),b=Math.floor(sy(y+CVOY));g.fillRect(a,b,Math.ceil(sx(x2+1))-a,Math.ceil(sy(y+CVOY+1))-b);x=x2}
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(D,0,0);ctx.restore()}
  drawTopFx();drawBattleFx(now);
  if(C.mark){const t=(now-C.mark.t0)/450;if(t>=1)C.mark=null;else{ctx.globalAlpha=1-t;const cx=C.mark.x*TS,cy=(C.mark.y+CVOY)*TS+(C.mark.foe?0:4),r=6+t*8,col=C.mark.foe?'#ff9aa8':'#fff3c4';for(let i=0;i<8;i++){const an=i/8*6.283;P4(col,cx+Math.cos(an)*r-1,cy+Math.sin(an)*r*.5-1,2,2)}ctx.globalAlpha=1}}
  ctx.imageSmoothingEnabled=sm}
