/* ---------- 飼う生き物（ハネマリ・モコダマ・ツノクサ） ----------
   柵・塀でかこんだ所の、とり小屋（coop）・家畜小屋（barn）に空きがあると、朝に STRAYP（のらの小道 +STRAYSP）で、村の外に野良の生き物が1ぴき来る（strayMorning、a.stray）。
   STRAYH 時に帰る。「しらべる」でタップ →「おむかえ」で、近いせいれいが歩いて行き（astray）、つれて小屋の前まで歩く（alead。生き物は、せいれいの通った所をついていく a.tr）。着いたら、その小屋にすむ。
   木のせいれい（いなければ、だれでも）が箱の草を小屋へ運び（えさ：1頭に1日1こ）、水のせいれい（いなければ、だれでも）が水をくんで小屋の水入れへ。
   えさと水をもらった日の夕方（ANIPRODH 時）に、小屋にとれる物がたまり、せいれいが箱へ運ぶ（aniJob）。夜は小屋の中。コワイノにはねらわれない。
   セーブ：S.ani（生き物。野良は stray:1・h −1・lead つれているせいれい）・S.dyn[小屋]（feed えさ・wd 水をもらった日・pr とれた物）。 */
const ANI={hane:{name:'ハネマリ',hut:'coop',prod:'egg',cap:3,spd:.9,desc:'まんまるで、ふわふわの羽の生き物。'},moko:{name:'モコダマ',hut:'barn',prod:'wool',cap:2,spd:.7,desc:'ふかふかの毛につつまれた、まるい生き物。'},tsuno:{name:'ツノクサ',hut:'barn',prod:'milk',cap:2,spd:.8,desc:'くるんとした角の、草がすきな生き物。'}};
const HUTK={coop:['hane'],barn:['moko','tsuno']},PENMAX=300,ANIFUN=3,ANIPET=5,ANIPRODH=17,ANIFEED=2;/* ANIFUN：ひまなときに自分からなでる・ANIPET：「しらべる」でたのんでなでる（1ぴき1日1回 a.petD） */
let HUTS=[],PENS=new Map(),ANISUB=0;
const isHut=o=>!!HUTK[o];
function hutFront(h){const o=S.obj[h];return o==='barn'?[h+2*W,h+2*W+1]:[h+W]}/* 小屋の出入り口の前のマス */
function hutCap(h){const o=S.obj[h];return o==='coop'?ANI.hane.cap:o==='barn'?ANI.moko.cap:0}
const aniOf=h=>(S.ani||[]).filter(a=>a.h===h&&!a.stray);
const STRAYP=.05,STRAYSP=.05,STRAYH=18;/* 野良の生き物：朝に来る確率・のらの小道で足す確率・帰る時刻 */
const aniHome=()=>(S.ani||[]).filter(a=>!a.stray);
const aniPass=j=>walk(j)&&!GATE_IDS.has(S.obj[j])&&!HOME_DOORS.has(S.obj[j]);
function penOf(h){/* 小屋の前から、柵・塀・水・がけでかこまれた所（PENMAX マスまで）。外へつながっていれば null */
  const seen=new Set(),Q=[];for(const s of hutFront(h))if(s>=0&&s<W*H&&aniPass(s)&&!seen.has(s)){seen.add(s);Q.push(s)}if(!Q.length)return null;
  for(let i=0;i<Q.length;i++){const c=Q[i],x=c%W,y=(c/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)return null;const n=ny*W+nx;if(seen.has(n))continue;if(S.fog&&fogAt(n))return null;if(!aniPass(n)||cliff2(c,n))continue;seen.add(n);Q.push(n);if(Q.length>PENMAX)return null}}
  return Q}
function aniRecount(){/* recount のあと：小屋の一覧と、かこいの中のマス */HUTS=[];PENS=new Map();if(!S)return;for(let j=0;j<S.obj.length;j++)if(isHut(S.obj[j]))HUTS.push(j);for(const h of HUTS)PENS.set(h,penOf(h))}
function hutD(h){return S.dyn[h]||(S.dyn[h]={})}
function animalMorning(){if(!S||IS_STORY_REPLAY)return;S.ani=S.ani||[];
  for(const a of S.ani.slice())if(!a.stray&&(!isHut(S.obj[a.h])||!HUTK[S.obj[a.h]].includes(a.k))){S.ani.splice(S.ani.indexOf(a),1);toast(ANI[a.k].name+'が、野へかえっていった')}/* 小屋がなくなったら、野へかえる */
  strayMorning()}
function hutRoom(h,k){/* かこいの中で、空きがあって、その生き物がすめる小屋か */return isHut(S.obj[h])&&!!PENS.get(h)&&aniOf(h).length+S.ani.filter(a=>a.stray&&a.lead!=null&&a.lh===h).length<hutCap(h)&&(k==null||HUTK[S.obj[h]].includes(k))}
function strayMorning(){/* 野良の生き物：空きのある小屋があれば、朝にたまに、村の外に1ぴき */if(typeof MEMRUN!=='undefined'&&MEMRUN||S.ani.some(a=>a.stray))return;
  const hs=HUTS.filter(h=>hutRoom(h));if(!hs.length)return;const p=STRAYP+(hs.some(h=>spotHas(h,'norakomichi'))?STRAYSP:0);if(Math.random()>=p)return;
  const h=hs[Math.floor(Math.random()*hs.length)],K=HUTK[S.obj[h]],k=K[Math.floor(Math.random()*K.length)],f=hutFront(h).find(c=>walk(c));if(f==null)return;
  const G=bfs(f%W,(f/W)|0),C=[];for(let j=0;j<W*H;j++){const d=G.dist[j];if(d>=8&&d<=50&&!VILL[j]&&!S.obj[j]&&aniPass(j)&&S.ground[j]!==1&&!(S.fog&&fogAt(j)))C.push(j)}if(!C.length)return;
  const c=C[Math.floor(Math.random()*C.length)];S.ani.push({id:(S.aniId=(S.aniId||0)+1),k,h:-1,stray:1,x:c%W+.5,y:((c/W)|0)+.6,face:1,wt:0});toast('村の外に、野良の'+ANI[k].name+'が来ている','good')}
function strayLeave(a,why){S.ani.splice(S.ani.indexOf(a),1);toast(why||'野良の'+ANI[a.k].name+'は、どこかへ行ってしまった')}
function strayFollow(a,dt){/* つれているせいれいの、通った所をついていく */const r=S.res.find(q=>q.id===a.lead);
  const ok=r&&!r.hidden&&(r.alead&&r.alead.aid===a.id||r.act&&r.act.type==='astray'&&r.act.aid===a.id);if(!ok){a.lead=null;a.lh=null;a.tr=null;a.wt=2;return}
  if(!r.alead)return;/* まだ、むかえに来たところ */const T=a.tr||(a.tr=[]),L=T[T.length-1];if(!L||Math.hypot(r.x-L[0],r.y-L[1])>.35){T.push([r.x,r.y]);if(T.length>60)T.shift()}
  if(Math.hypot(r.x-a.x,r.y-a.y)<.9||!T.length)return;const p=T[0],dx=p[0]-a.x,dy=p[1]+.1-a.y,D=Math.hypot(dx,dy);if(D<.08){T.shift();return}
  const sp=Math.min(D,ANI[a.k].spd*(Math.hypot(r.x-a.x,r.y-a.y)>2.5?2.4:1.5)*dt);a.x+=dx/D*sp;a.y+=dy/D*sp;aniTurn(a,dx,dy);a.mv=1}
/* 歩く向きで、横・正面（d）・うしろ（u）の絵をえらぶ（a.vw。チップ ani:<k>#d<コマ>・#u<コマ>、tools/art/animals/ani_build.py）。かわりめでちらつかないように、はっきり上下・左右になったときだけかえる */
function aniTurn(a,dx,dy){const ax=Math.abs(dx),ay=Math.abs(dy);if(ax>.03)a.face=dx>0?1:-1;if(ay>ax*1.3)a.vw=dy>0?'d':'u';else if(ax>ay*1.3)a.vw=''}
/* 道のかどを切って、まっすぐ・ななめに歩く：つぎのつぎのマスまで、通れるマスだけを通って行けるなら、つぎのマスをとばす */
function aniSee(a,c){const ok=a.path.ok,tx=c%W+.5,ty=((c/W)|0)+.6,L=Math.hypot(tx-a.x,ty-a.y),n=Math.ceil(L/.2);let pj=(a.y|0)*W+(a.x|0);
  for(let i=1;i<=n;i++){const q=i/n,x=a.x+(tx-a.x)*q,y=a.y+(ty-a.y)*q;for(const[ox,oy]of[[.25,0],[-.25,0],[0,.2],[0,-.2]]){const j=((y+oy)|0)*W+((x+ox)|0);if(!(ok?ok.has(j):aniPass(j))||j!==pj&&cliff2(pj,j))return false}pj=(y|0)*W+(x|0)}return true}
function aniStep(a,dt){/* 道をたどって歩く */if(!a.path||!a.path.length)return false;while(a.path.length>1&&aniSee(a,a.path[1]))a.path.shift();const c=a.path[0],tx=c%W+.5,ty=((c/W)|0)+.6,dx=tx-a.x,dy=ty-a.y,L=Math.hypot(dx,dy);
  if(L<.05){a.path.shift();return true}const sp=Math.min(L,ANI[a.k].spd*dt);a.x+=dx/L*sp;a.y+=dy/L*sp;aniTurn(a,dx,dy);a.mv=1;return true}
function aniPath(a,to,cells){/* かこいの中だけを通る道（cells がなければ、歩けるマス） */const s=(a.y|0)*W+(a.x|0);if(s===to)return [to];const ok=cells?new Set(cells):null,prev=new Map([[s,-1]]),Q=[s];
  for(let i=0;i<Q.length&&i<600;i++){const c=Q[i];if(c===to)break;const x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const n=ny*W+nx;if(prev.has(n)||!(ok?ok.has(n):aniPass(n)))continue;prev.set(n,c);Q.push(n)}}
  if(!prev.has(to))return null;const p=[];for(let c=to;c!==s&&c>=0;c=prev.get(c))p.unshift(c);p.ok=ok;return p}
function animalTick(dt){if(!S||!S.ani||!S.ani.length||IS_STORY_REPLAY)return;const night=isNight(),day=callDay(),h=hour();
  const sec=(ANISUB+=dt)>=1;if(sec)ANISUB=0;
  for(const a of S.ani.slice()){a.mv=0;if(a.eat>0)a.eat-=dt;
    if(a.stray){if(a.lead!=null){strayFollow(a,dt);continue}if((h>=STRAYH||night)&&sec){strayLeave(a);continue}}/* 野良：つれられているあいだは、ついていく。夕方には帰る */
    if(a.pet>0){a.pet-=dt;continue}
    const P=PENS.get(a.h)||null,d=isHut(S.obj[a.h])?hutD(a.h):null;
    if(night&&d){if(a.in)continue;const f=hutFront(a.h)[0];if(!a.path||a.go!==f){a.go=f;a.path=aniPath(a,f,P)||[]}if(!aniStep(a,dt)){a.in=1;a.path=null}continue}/* 夜は小屋へ */
    if(a.in){a.in=0;const f=hutFront(a.h)[0];a.x=f%W+.5;a.y=((f/W)|0)+.6}
    if(sec&&d){if(a.fd!==day&&(d.feed||0)>0){d.feed--;a.fd=day;a.eat=3;a.path=null;a.wt=3}/* えさを食べる */
      if(h>=ANIPRODH&&a.pd!==day){a.pd=day;if(a.fd===day&&d.wd===day){const pk=ANI[a.k].prod;d.pr=d.pr||{};d.pr[pk]=(d.pr[pk]||0)+1;if(typeof addFloat==='function')addFloat(a.x,a.y-1,aniProdName(pk)+'+1','#fff2c0')}}}/* 夕方：とれる物 */
    if(a.eat>0)continue;if(aniStep(a,dt))continue;
    if((a.wt-=dt)>0)continue;a.wt=3+Math.random()*6;
    const near=(P||[]).filter(c=>Math.abs(c%W+.5-a.x)<=4&&Math.abs(((c/W)|0)+.6-a.y)<=4);
    let to=-1;if(near.length)to=near[Math.floor(Math.random()*near.length)];else{const x=(a.x|0)+Math.floor(Math.random()*5)-2,y=(a.y|0)+Math.floor(Math.random()*5)-2;if(x>=0&&y>=0&&x<W&&y<H&&aniPass(y*W+x))to=y*W+x}/* かこいがなくなったら、そのあたりを歩く */
    if(to>=0)a.path=aniPath(a,to,P)}}
const aniProdName=k=>FOODS[k]?FOODS[k].name:MATN[k];
/* ---------- せいれいの世話（えさ・水・とれた物を運ぶ） ---------- */
function aniRole(r,el){return r.elem===el||!S.res.some(q=>!q.hidden&&q.elem===el)}/* その属性のせいれいがいれば、その属性だけ */
function aniNeedFeed(h){const d=hutD(h),inb=S.res.reduce((n,q)=>n+(q.apk&&q.apk.j===h?q.apk.n:0)+(q.act&&q.act.type==='apick'&&q.act.h===h?ANIFEED:0),0);return aniOf(h).length*ANIFEED-(d.feed||0)-inb}
const grassHave=()=>GRASSK.filter(k=>totKey(k)>0);
function aniJob(r,G,dry){if(isNight()||!S.ani||!S.ani.length)return false;const day=callDay(),adj=h=>q=>adjOf(q,k=>anc(k)===h)>=0;
  if(r.apk){if(dry)return true;const h=r.apk.j;if(!isHut(S.obj[h])){toHand(r,r.apk.m);r.apk=null;return false}const j=nearest(G,adj(h),200);if(j>=0){startAct(r,G,'aput',j,{obj:h});return true}return false}/* 運んでいる草は、先に小屋へ */
  for(const h of HUTS){const d=hutD(h);if(!d.pr||!Object.keys(d.pr).length||roomN(r)<1||!free('ap'+h,1))continue;if(dry)return true;const j=nearest(G,adj(h),200);if(j>=0){startAct(r,G,'acol',j,{key:'ap'+h,obj:h});return true}}/* とれた物を、箱へ */
  if(aniRole(r,'wood')&&roomN(r)>=1){const gk=grassHave();if(gk.length)for(const h of HUTS){if(!aniOf(h).length||aniNeedFeed(h)<=0)continue;if(dry)return true;const j=nearest(G,q=>keysAdj(q,gk)>=0,200);if(j>=0){startAct(r,G,'apick',j,{h});return true}break}}/* えさの草を、箱から */
  if(aniRole(r,'water'))for(const h of HUTS){const d=hutD(h);if(!aniOf(h).length||d.wd===day||!free('aw'+h,1))continue;if(dry)return true;
    if((r.wcan||0)>0){const j=nearest(G,adj(h),200);if(j>=0){startAct(r,G,'awater',j,{key:'aw'+h,obj:h});return true}}else{const s=nearest(G,q=>waterSrc(q)>=0,80);if(s>=0){startAct(r,G,'draw',s,{src:waterSrc(s)});return true}}break}/* 水入れに水を */
  return false}
Object.assign(ACT,{
  apick:{start(r,a){const gk=grassHave();a.box=keysAdj(a.stand,gk);if(a.box<0)return false;faceTo(r,a.box);r.bubble='';},done:(r,a)=>a.t>=4/aniSpd(a.h,a.box,'hoshikusa'),
    end(r,a){const need=Math.min(roomN(r),Math.max(0,aniNeedFeed(a.h)+ANIFEED));let got=0;const m={};for(const k of GRASSK){if(got>=need)break;const t=boxOut(a.box,k,need-got);if(t>0){m[k]=t;got+=t}}if(got>0)r.apk={j:a.h,n:got,m}}},/* えさの草を、箱からとる */
  aput:{start(r,a){if(!r.apk)return false;r.bubble='';faceTo(r,a.obj)},done:(r,a)=>a.t>=4/aniSpd(a.obj),end(r,a){const p=r.apk;r.apk=null;if(!p)return;if(!isHut(S.obj[p.j])){toHand(r,p.m);return}const d=hutD(p.j);d.feed=(d.feed||0)+p.n;}},/* 草を小屋のえさ入れへ */
  awater:{start(r,a){if(!isHut(S.obj[a.obj])||!(r.wcan>0))return false;r.bubble='💦';faceTo(r,a.obj)},done:(r,a)=>a.t>=5/aniSpd(a.obj,null,'hidamari'),end(r,a){if(!isHut(S.obj[a.obj]))return;hutD(a.obj).wd=callDay();r.wcan=Math.max(0,(r.wcan||0)-1);r.bubble='';sfxAt('water',r.x,r.y)}},/* 水入れに水 */
  acol:{start(r,a){const d=S.dyn[a.obj];if(!d||!d.pr||!Object.keys(d.pr).length)return false;r.bubble='';faceTo(r,a.obj)},done:(r,a)=>a.t>=4,
    end(r,a){const d=S.dyn[a.obj];if(!d||!d.pr)return;for(const k of Object.keys(d.pr)){const n=Math.min(d.pr[k],roomN(r));if(n<=0)break;if(FOODS[k])addCarry(r,k,n);else addMat(r,k,n);d.pr[k]-=n;if(d.pr[k]<=0)delete d.pr[k]}}},/* とれた物をとる（箱へは、いつものしまい方で） */
  apet:{start(r,a){const b=(S.ani||[]).find(q=>q.id===a.aid);if(!b||b.in)return false;b.pet=a.dur;b.face=r.x<b.x?-1:1;b.vw='';r.face=b.x<r.x?-1:1;r.bubble='❗'},tick(r,a){if(a.t>2)r.bubble='🎵'},done:(r,a)=>a.t>=a.dur,
    end(r,a){const b=(S.ani||[]).find(q=>q.id===a.aid);if(a.t<a.dur){if(a.tap&&b){b.petD=null;b.pet=0}return}/* とちゅうでやめたら、たのんだなでるは、なかったことに */const n=Math.round((a.tap?ANIPET:ANIFUN)*(b&&spotNear((b.y|0)*W+(b.x|0),'fureai')?1.2:1)*10)/10;/* ふれあいひろば：+20% */r.fun=Math.min(100,r.fun+n);r.wanderRestUntil=S.t+45;r.bubble='';if(b){b.pet=0;aniJoy(b)}if(a.tap)addFloat(r.x,r.y-1.6,'たのしさ+'+n,'#ffd7e8');if(typeof spReact==='function')spReact(r,'joy',1500)/* なでおわったら、正面を向いて、よろこぶ */}}});
const aniSpd=(h,box,k2)=>1+.1*spotN(h,'makiba')+(k2==='hidamari'?.1*spotN(h,'hidamari'):0)+(k2==='hoshikusa'&&box!=null&&box>=0&&spotNear(box,'hoshikusa')?.1:0);/* まきば・ひだまりのとや・ほしくさおき場：+10% */
ACT.apetq=ACT.apet;/* 「しらべる」でたのんだ、なでる（とちゅうで仕事にうつらない） */KEEPC.add('apet');KEEPC.add('apetq');/* 荷物は持ったまま、なでにいく */
ACT_LBL.apick='生き物のえさをとりにいく';ACT_LBL.aput='生き物にえさをあげている';ACT_LBL.awater='生き物に水をあげている';ACT_LBL.acol='生き物のとれた物をとっている';ACT_LBL.apet='生き物をなでている';ACT_LBL.apetq='生き物をなでにいく';
IDLE_ACTS.push('apet');
/* ---------- 「しらべる」で生き物をタップ：小さな画面（aniPop）→「なでる」で、行けるいちばん近いせいれいが、なでにいく（aniPetAsk） ---------- */
function aniAtTap(px,py){/* 足もとのまわり（絵の大きさ） */let best=null,bd=1e9;for(const a of S.ani||[]){if(a.in)continue;const sx=a.k==='hane'?.45:.65,top=a.k==='hane'?.85:1.25,dx=px-a.x,dy=py-a.y;if(Math.abs(dx)>sx||dy>.3||dy<-top)continue;const d=Math.hypot(dx,dy+top/2);if(d<bd){bd=d;best=a}}return best}
const ANIBUSY=r=>r.hidden||r.coffin||r.hunger<500||storyCalled(r)||onHold(r)||r.act&&(URGNO.includes(r.act.type)||MAINGO.has(r.act.type)||r.act.type==='apetq'||r.act.type==='watchpost');
function aniPetWhy(a){if(!a||a.in)return 'いまは小屋の中';if(a.petD===callDay())return 'きょうは、もうなでた';if(isNight())return '夜は、なでられない';if(enemyLive())return 'コワイノがいる';if(S.res.some(r=>r.act&&r.act.type==='apetq'&&r.act.aid===a.id))return 'なでにいっている';return ''}
function aniPetAsk(a){/* 行けるせいれいのうち、道のりがいちばん近い子 */if(aniPetWhy(a))return null;const bx=a.x|0,by=a.y|0,C=S.res.filter(r=>!ANIBUSY(r)).sort((p,q)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(q.x-a.x,q.y-a.y)).slice(0,6);let best=null,bd=1e9,bG=null,bs=-1;
  for(const r of C){const G=bfs(r.x|0,r.y|0),st=nearest(G,j=>Math.abs(j%W-bx)+Math.abs(((j/W)|0)-by)===1&&walk(j)&&!S.obj[j],400);if(st<0||G.dist[st]>=bd)continue;bd=G.dist[st];best=r;bG=G;bs=st}
  if(!best)return null;a.petD=callDay();a.pet=120;a.path=null;/* 着くまで、その場で待つ */endAct(best);startAct(best,bG,'apetq',bs,{aid:a.id,dur:12,tap:1});if(!best.act||best.act.type!=='apetq'){a.petD=null;a.pet=0;return null}return best}
function aniPop(a){/* 名前・すんでいる小屋・きょうのえさと水 */if(a.stray){strayDrop(a);return (S.flags.aniMet||{})[a.k]||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN?strayPop(a):strayMeet(a);}const day=callDay(),h=a.h,d=isHut(S.obj[h])?hutD(h):null;
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:6px"></b><div class="rows"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button><button class="btn pri go">なでる</button></div></div></div>');
  o.querySelector('.t').textContent=ANI[a.k].name;const rows=o.querySelector('.rows');
  rows.appendChild(rowEl('すんでいる小屋',d?BL[S.obj[h]].name:'小屋がない'));rows.appendChild(rowEl('えさ',a.fd===day?'もらった':'まだ'));rows.appendChild(rowEl('水',d&&d.wd===day?'もらった':'まだ'));
  const g=o.querySelector('.go'),why=aniPetWhy(a);lackOn(g,why);
  g.onclick=()=>{if(aniPetWhy(a))return;const r=aniPetAsk(a);if(!r){toast('いまは、なでにいけるせいれいがいない');return}sfx('tap');o.remove();toast(r.name+'が、'+ANI[a.k].name+'をなでにいく')};
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
function goPetAnimal(r,G){/* ひまなとき：近くの生き物をなでにいく（かこいの中へは、柵のドアから入る） */if(!S.ani||!S.ani.length)return false;let best=null,bd=10;for(const a of S.ani){if(a.in||a.pet>0||a.stray)continue;const d=Math.hypot(a.x-r.x,a.y-r.y);if(d<bd){bd=d;best=a}}if(!best)return false;
  const bx=best.x|0,by=best.y|0,st=nearest(G,j=>Math.abs(j%W-bx)+Math.abs(((j/W)|0)-by)===1&&walk(j)&&!S.obj[j],30);if(st<0)return false;startAct(r,G,'apet',st,{aid:best.id,dur:12});return true}
/* ---------- 絵 ---------- */
const ANIEAT=['e0','e1','e2','e1'];/* 食べる：さげる → ついばむ → かむ → ついばむ */
const ANIJOYF=[['j0',110,0],['j1',170,6],['j2',110,2],['j0',90,0],['j1',170,6],['j2',110,2]],ANIJOYT=760,AJOY=new WeakMap();/* よろこぶ：コマ・ミリ秒・はねる高さ（ゲームの点。絵は下のはしをそろえて写したので、描く位置を上げる）。実時間。セーブしない */
function aniJoy(a){AJOY.set(a,performance.now());if(typeof sfxAt==='function')sfxAt('good',a.x,a.y)}
function aniJoyF(a,now){const t0=AJOY.get(a);if(t0==null)return null;let e=now-t0;if(e<0||e>=ANIJOYT){AJOY.delete(a);return null}for(const f of ANIJOYF){if(e<f[1])return f;e-=f[1]}return null}
function aniChip(a,now){/* ボーンで動かして写したコマ（tools/art/animals/ani_rig.py）：歩く4コマ（150ミリ秒ごと）・食べる（220ミリ秒ごと）・立つ（息をする2コマ、700ミリ秒ごと。生き物ごとにずらす） */const k=a.k,C=window.CHIPS||{};if(a.in)return null;
  const jf=aniJoyF(a,now);if(jf)return a.vw&&C['ani:'+k+'#'+a.vw+jf[0]]||C['ani:'+k+'#'+jf[0]]||C['ani:'+k+'#0']||null;
  const f=a.eat>0?ANIEAT[(now/220|0)%4]:a.mv?'w'+((now/150|0)%4):String(((now+a.id*337)/700|0)%2);return a.vw&&C['ani:'+k+'#'+a.vw+f]||C['ani:'+k+'#'+f]||C['ani:'+k+'#0']||null}
const ANISHW=.9,ANISHH=.3;/* 飼う生き物のかげ：足もとのはばに対する、だ円のよこの半径・たての半径の比 */
function drawAnimal(g,a,now){/* 足もと（a.x, a.y）に、チップの足（下のはし58/64）をそろえる。左むきは、足もとのまん中で反転 */const ch=aniChip(a,now);if(!ch)return;const im=chipImgs(ch,'ani'+a.k)[0];if(!im.ok)return;
  const x=Math.round(a.x*TS),y=Math.round(a.y*TS);{const ft=chipFoot(ch,im),sz=a.k==='hane'?6:10;/* かげ：足もとのはばに合わせた、ドットのだ円（1ドットはチップと同じ、ゲームの半分の点） */
    if(ft){const l=ft.l+ch.ax-TS,r=ft.r+ch.ax-TS,m=(l+r)/4,hw=(r-l)/4*ANISHW+1;dotShadow(g,x+(a.face<0?-m:m),y,hw,Math.max(1.5,hw*ANISHH),1,.5)}else dotShadow(g,x,y,sz,2,1,.5)}
  const jf=aniJoyF(a,now);g.save();g.translate(x,y-(jf?jf[2]:0));if(a.face<0)g.scale(-1,1);g.imageSmoothingEnabled=false;g.drawImage(im,ch.ax/2-TS/2,ch.ay/2-29,ch.w/2,ch.h/2);g.restore()}
function aniDraw(add,vis,now,ctx){for(const a of S.ani||[]){if(a.in||!vis(a))continue;const px=a.x*TS,fy=a.y*TS;add(a.y,2,[px-20,fy-34,px+20,fy+4],()=>liftDraw(uLift(a),()=>drawAnimal(ctx,a,now)),(a.y|0)*W+(a.x|0))}}
/* ---------- とれる物のアイコン（16×16のドット） ---------- */
const ANIPIX={egg:['................','................','.......oo.......','......ohho......','.....ohhmmo.....','....ohhmmmmo....','....ohmmmmmo....','...ohmmmmmmmo...','...ommmmmmmdo...','...ommmmmmmdo...','...ommmmmmddo...','....ommmmddo....','.....oddddo.....','......oooo......','................','................'],
  milk:['................','......oooo......','......ohmo......','......oooo......','.....ohmmmo.....','....ohhmmmmo....','....ohmmmmmo....','....ohmmmmmo....','....ommmmmmo....','....ommmmmdo....','....ommmmmdo....','....ommmmddo....','....oddddddo....','.....oooooo.....','................','................'],
  wool:['................','................','.....oo..oo.....','....ohhooho.....','...ohhmmhhmo....','..ohmmmmmmmmo...','..ohmmmmmmmmdo..','.ohmmmmmmmmmdo..','.ommmmmmmmmmmdo.','.ommmmmmmmmmddo.','..ommmmmmmmddo..','..oddmmmmmdddo..','...oodddddoo....','.....ooooo......','................','................']};
const ANICOL={egg:'#f4e6c8',milk:'#eef3f6',wool:'#f3ead6'};
for(const k in ANIPIX){ICONS[k]=pixURL('ani:'+k,ANIPIX[k],ANICOL[k]);const im=new Image();im.onload=()=>{im.ok=1};im.src=ICONS[k];ICI[k]=im}
/* ---------- 小屋の画面 ---------- */
function aniSec(body,j,o){if(!isHut(o)||S.obj[j]!==o)return;const d=hutD(j),L=aniOf(j),P=PENS.get(j),day=callDay();
  const sec=el('<div class="sec"><h3></h3><div class="rows"></div></div>'),rows=sec.querySelector('.rows');sec.querySelector('h3').textContent='すんでいる生き物（'+L.length+'/'+hutCap(j)+'）';
  for(const a of L)rows.appendChild(rowEl(ANI[a.k].name,a.fd===day?'えさを食べた':'おなかがすいている'));
  rows.appendChild(rowEl('かこい',P?'かこいの中':'かこいがない'));
  rows.appendChild(rowEl('えさ',(d.feed||0)+'こ'));rows.appendChild(rowEl('水',d.wd===day?'もらった':'まだ'));
  const pr=Object.keys(d.pr||{}).filter(k=>d.pr[k]>0);if(pr.length)rows.appendChild(rowEl('とれた物',pr.map(k=>aniProdName(k)+'（'+d.pr[k]+'）').join('・')));
  body.appendChild(sec)}
/* ---------- 野良の生き物の「おむかえ」 ---------- */
function strayHut(a){/* その生き物がすめる、空きのある小屋（野良のいる所から近い順） */return HUTS.filter(h=>hutRoom(h,a.k)).sort((p,q)=>Math.hypot(p%W-a.x,((p/W)|0)-a.y)-Math.hypot(q%W-a.x,((q/W)|0)-a.y))[0]}
function strayWhy(a){if(a.lead!=null)return 'むかえにいっている';if(isNight())return '夜は、むかえにいけない';if(enemyLive())return 'コワイノがいる';if(strayHut(a)==null)return 'すめる小屋がない';return ''}
function strayAsk(a){/* 行けるせいれいのうち、道のりがいちばん近い子。小屋の前まで行けることもたしかめる */if(strayWhy(a))return null;const h=strayHut(a),bx=a.x|0,by=a.y|0,C=S.res.filter(r=>!ANIBUSY(r)&&!r.alead).sort((p,q)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(q.x-a.x,q.y-a.y)).slice(0,6);let best=null,bd=1e9,bG=null,bs=-1;
  for(const r of C){const G=bfs(r.x|0,r.y|0),st=nearest(G,j=>Math.abs(j%W-bx)+Math.abs(((j/W)|0)-by)<=1&&walk(j)&&!S.obj[j],400);if(st<0||G.dist[st]>=bd)continue;const G2=bfs(st%W,(st/W)|0);if(!hutFront(h).some(c=>G2.dist[c]>=0))continue;bd=G.dist[st];best=r;bG=G;bs=st}
  if(!best)return null;a.lead=best.id;a.lh=h;a.path=null;a.tr=null;endAct(best);startAct(best,bG,'astray',bs,{aid:a.id,h});if(!best.act||best.act.type!=='astray'){a.lead=null;a.lh=null;return null}return best}
/* 野良をタップすると、1ぴき1回だけ、50%で、とれる物（たまご・わた毛・ミルク）を1こ落とす（STRAYDROPP）。落ちた物は、せいれいがどこからでもひろいに行く（tap） */
const STRAYDROPP=.5;
function strayDrop(a){if(a.dr||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN)return;a.dr=1;if(Math.random()>=STRAYDROPP)return;const pk=ANI[a.k].prod,key=(FOODS[pk]?'food:':'mat:')+pk,n0=(S.drops||[]).length;dropAt(a.x,a.y,key,1);if(!(S.drops&&S.drops.length>n0))return;
  const d=S.drops[S.drops.length-1];d.tap=1;d.cr=1;DROPFX.set(d,{sx:a.x*TS,sy:(a.y-.6)*TS-hiAt(d.y*W+d.x)*LIFT,t0:performance.now()})}
function strayPop(a){const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:6px"></b><div class="rows"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button><button class="btn pri go">おむかえ</button></div></div></div>');
  o.querySelector('.t').textContent='野良の'+ANI[a.k].name;const rows=o.querySelector('.rows'),h=strayHut(a);rows.appendChild(rowEl('すめる小屋',h!=null?BL[S.obj[h]].name:'ない'));rows.appendChild(rowEl('とれる物',aniProdName(ANI[a.k].prod)));
  const g=o.querySelector('.go');lackOn(g,strayWhy(a));
  g.onclick=()=>{if(strayWhy(a))return;const r=strayAsk(a);if(!r){toast('いまは、むかえにいけるせいれいがいない');return}sfx('tap');o.remove();toast(r.name+'が、'+ANI[a.k].name+'をむかえにいく')};
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
function aniLeadGo(r,G){/* むかえたあと：小屋の前まで歩く（生き物がついてくる） */const a=(S.ani||[]).find(q=>q.id===r.alead.aid&&q.stray);if(!a||a.lead!==r.id){r.alead=null;return false}
  let h=r.alead.h;if(!hutRoom(h,a.k)&&!(isHut(S.obj[h])&&PENS.get(h)&&a.lh===h&&aniOf(h).length<hutCap(h))){h=strayHut(a);if(h==null){r.alead=null;a.lead=null;a.lh=null;return false}r.alead.h=a.lh=h}
  const st=nearest(G,j=>hutFront(h).includes(j),400);if(st<0){r.alead=null;a.lead=null;a.lh=null;return false}startAct(r,G,'alead',st,{aid:a.id,h});return !!r.act&&r.act.type==='alead'}
Object.assign(ACT,{
  astray:{start(r,a){const b=(S.ani||[]).find(q=>q.id===a.aid);if(!b||!b.stray||b.lead!==r.id)return false;b.face=r.x<b.x?-1:1;b.vw='';r.face=b.x<r.x?-1:1;r.bubble='❗'},tick(r,a){if(a.t>1.5)r.bubble='🎵'},done:(r,a)=>a.t>=3,
    end(r,a){const b=(S.ani||[]).find(q=>q.id===a.aid);if(!b||a.t<3)return;r.alead={aid:b.id,h:a.h};b.tr=[];r.bubble='';aniJoy(b)}},/* そばで声をかけると、ついてくる */
  alead:{start(r,a){const b=(S.ani||[]).find(q=>q.id===a.aid);if(!b||b.lead!==r.id)return false;faceTo(r,a.h)},done:(r,a)=>{const b=(S.ani||[]).find(q=>q.id===a.aid);return a.t>=1&&(!b||Math.hypot(b.x-r.x,b.y-r.y)<1.3||a.t>=8)},
    end(r,a){const b=(S.ani||[]).find(q=>q.id===a.aid);r.alead=null;if(!b||!b.stray||!isHut(S.obj[a.h])||!PENS.get(a.h)||aniOf(a.h).length>=hutCap(a.h)){if(b){b.lead=null;b.lh=null;b.tr=null}return}
      b.stray=0;b.h=a.h;b.lead=null;b.lh=null;b.tr=null;b.path=null;b.wt=2;b.x=r.x;b.y=r.y+.1;aniJoy(b);toast(ANI[b.k].name+'が、'+BL[S.obj[a.h]].name+'にすみついた','good');if(typeof memo==='function')memo(ANI[b.k].name+'が村にすみついた')}}});
ACT_LBL.astray='野良の生き物をむかえにいく';ACT_LBL.alead='生き物を小屋へつれていく';KEEPC.add('astray');KEEPC.add('alead');
/* ---------- 野良の生き物に、はじめて会ったとき（しゅるいごとに1回、S.flags.aniMet）：
   村の時間を止め（GIFT_ACTIVE）、カメラが生き物へよる → ぴょんとはねて「？」・光の輪とつぶ・音 → 出会いのカード（絵はシールで、ぺたっ）→ カメラがもとの所へもどる → いつもの小さな画面。
   さいごまで見たら「会った」にする（とちゅうで村を切りかえたら、つぎにまたはじめから）。演出は実時間 ---------- */
let AMEET=null;
SCN_DRAW.aniq=(e,t,now)=>{/* 生き物の上の「？」のふきだし（ドット） */const a=e.a;if(!a||a.in)return;const env=scnEnv(t,.08,.12);if(env<=0)return;ctx.globalAlpha=env;
  const top=a.k==='hane'?30:42,px=a.x*TS,by=Math.round((a.y*TS-uLift(a)-top-Math.abs(Math.sin(now/220))*2)/1.5)*1.5,B=pxBub(ctx,px,by-19.125,20.25,19.125,'#fff','#b8a587',3.375);bubIcon(ctx,'❓',px,by-9.5,.75,B)};
function aniMeetPic(k){/* 立つ絵を、整数倍で大きく */const ch=(window.CHIPS||{})['ani:'+k+'#0'];if(!ch)return null;const im=chipImgs(ch,'ani'+k)[0];if(!im||!im.ok)return null;
  const t=document.createElement('canvas');t.width=ch.w;t.height=ch.h;const tg=t.getContext('2d');tg.drawImage(im,0,0);const d=tg.getImageData(0,0,ch.w,ch.h).data;let x0=ch.w,y0=ch.h,x1=-1,y1=-1;
  for(let y=0;y<ch.h;y++)for(let x=0;x<ch.w;x++)if(d[(y*ch.w+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}if(x1<0){t.width=t.height=0;return null}
  const w=x1-x0+1,h=y1-y0+1,c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(t,x0,y0,w,h,0,0,w,h);t.width=t.height=0;/* 透明なふちを切りつめる（作業用のキャンバスは手ばなす） */
  const sc=Math.max(1,Math.min(3,Math.floor(150/Math.max(w,h))));c.className='ampic';c.style.width=w*sc+'px';c.style.height=h*sc+'px';return c}
function strayMeet(a){if(AMEET||GIFT_ACTIVE||camAnim&&camAnim.done)return strayPop(a);
  const owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION&&S.ani.includes(a);GIFT_ACTIVE=true;AMEET={a};
  const back={z:cam.z,x:cam.x+VW/cam.z/2,y:cam.y+VH/cam.z/2},tx=a.x*TS,ty=a.y*TS-uLift(a)-20;
  const finish=open=>{if(!AMEET)return;AMEET=null;GIFT_ACTIVE=false;if(open&&ok())strayPop(a)};
  musicDuck(2600);a.path=null;a.wt=3;
  camAnim=AMEET.cam={fz:cam.z,tz:Math.min(2.6,Math.max(cam.z,2)),fx:back.x,fy:back.y,tx,ty,t:0,dur:1.2,done:()=>{if(!ok())return finish();
    const T0=performance.now();aniJoy(a);sfx('good');const x=a.x*TS,y=a.y*TS-uLift(a)-10;
    scnAdd('aniq',1500,{a});scnAdd('glow',1700,{x,y,r:26,col:'#fff6c8'});scnAdd('ring',900,{x,y:y+8,r0:6,r1:30,col:'#fff0a8'},120);scnAdd('ring',900,{x,y:y+8,r0:6,r1:40,col:'#fff6c8'},420);
    for(let i=0;i<5;i++)scnAdd('orb',700,{x0:x,y0:y,x1:x+Math.cos(i*1.26)*22,y1:y-12+Math.sin(i*1.26)*12,arc:6,col:'#fff0a8',n:1},200+i*80);
    setTimeout(()=>{if(!ok()||AMEET==null)return finish();const ov=el('<div class="idea-reveal gift-reveal anim-meet" role="dialog" aria-modal="true" aria-label="はじめて会った"></div>'),card=el('<div class="idea-card"><h2>はじめて会った！</h2><div class="pic"></div><b class="nm" style="display:block;font-size:16px"></b><p class="amrow ds"></p><p class="amrow pr"></p></div>');
      const pic=aniMeetPic(a.k);if(pic)card.querySelector('.pic').append(pic);card.querySelector('.nm').textContent=ANI[a.k].name;card.querySelector('.ds').textContent=ANI[a.k].desc;card.querySelector('.pr').textContent='とれる物：'+aniProdName(ANI[a.k].prod);
      const b=el('<button class="btn pri" type="button">OK</button>');b.disabled=true;card.append(b);ov.append(card);document.body.append(ov);sfx('level');setTimeout(()=>{if(ov.isConnected)b.disabled=false},800);
      b.onclick=()=>{if(b.disabled)return;sfx('tap');ov.remove();if(!ok())return finish();(S.flags.aniMet||(S.flags.aniMet={}))[a.k]=1;
        camAnim=AMEET.cam={fz:cam.z,tz:back.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:back.x,ty:back.y,t:0,dur:1.1,done:()=>finish(true)}}},Math.max(0,1500-(performance.now()-T0)))}}}
function aniMeetReset(){if(!AMEET)return;if(AMEET.cam&&camAnim===AMEET.cam)camAnim=null;AMEET=null;GIFT_ACTIVE=false;document.querySelectorAll('.anim-meet').forEach(e=>e.remove())}/* 村を切りかえたとき */
