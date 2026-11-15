/* ---------- 飼う生き物（ハネマリ・モコダマ・ツノクサ） ----------
   柵・塀でかこんだ所に、とり小屋（coop）・家畜小屋（barn）を建てると、つぎの朝、生き物がすみつく（animalMorning）。
   木のせいれい（いなければ、だれでも）が箱の草を小屋へ運び（えさ：1頭に1日1こ）、水のせいれい（いなければ、だれでも）が水をくんで小屋の水入れへ。
   えさと水をもらった日の夕方（ANIPRODH 時）に、小屋にとれる物がたまり、せいれいが箱へ運ぶ（aniJob）。夜は小屋の中。コワイノにはねらわれない。
   セーブ：S.ani（生き物）・S.dyn[小屋]（feed えさ・wd 水をもらった日・pr とれた物・ak つぎに来る生き物）。 */
const ANI={hane:{name:'ハネマリ',hut:'coop',prod:'egg',cap:3,spd:.9},moko:{name:'モコダマ',hut:'barn',prod:'wool',cap:2,spd:.7},tsuno:{name:'ツノクサ',hut:'barn',prod:'milk',cap:2,spd:.8}};
const HUTK={coop:['hane'],barn:['moko','tsuno']},PENMAX=300,ANIFUN=3,ANIPRODH=17,ANIFEED=2;
let HUTS=[],PENS=new Map(),ANISUB=0;
const isHut=o=>!!HUTK[o];
function hutFront(h){const o=S.obj[h];return o==='barn'?[h+2*W,h+2*W+1]:[h+W]}/* 小屋の出入り口の前のマス */
function hutCap(h){const o=S.obj[h];return o==='coop'?ANI.hane.cap:o==='barn'?ANI.moko.cap:0}
const aniOf=h=>(S.ani||[]).filter(a=>a.h===h);
const aniPass=j=>walk(j)&&!GATE_IDS.has(S.obj[j])&&!HOME_DOORS.has(S.obj[j]);
function penOf(h){/* 小屋の前から、柵・塀・水・がけでかこまれた所（PENMAX マスまで）。外へつながっていれば null */
  const seen=new Set(),Q=[];for(const s of hutFront(h))if(s>=0&&s<W*H&&aniPass(s)&&!seen.has(s)){seen.add(s);Q.push(s)}if(!Q.length)return null;
  for(let i=0;i<Q.length;i++){const c=Q[i],x=c%W,y=(c/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)return null;const n=ny*W+nx;if(seen.has(n))continue;if(S.fog&&fogAt(n))return null;if(!aniPass(n)||cliff2(c,n))continue;seen.add(n);Q.push(n);if(Q.length>PENMAX)return null}}
  return Q}
function aniRecount(){/* recount のあと：小屋の一覧と、かこいの中のマス */HUTS=[];PENS=new Map();if(!S)return;for(let j=0;j<S.obj.length;j++)if(isHut(S.obj[j]))HUTS.push(j);for(const h of HUTS)PENS.set(h,penOf(h))}
function hutD(h){return S.dyn[h]||(S.dyn[h]={})}
function animalMorning(){if(!S||IS_STORY_REPLAY)return;S.ani=S.ani||[];
  for(const a of S.ani.slice())if(!isHut(S.obj[a.h])||!HUTK[S.obj[a.h]].includes(a.k)){S.ani.splice(S.ani.indexOf(a),1);toast(ANI[a.k].name+'が、野へかえっていった')}/* 小屋がなくなったら、野へかえる */
  for(const h of HUTS){const P=PENS.get(h);if(!P||aniOf(h).length>=hutCap(h))continue;const d=hutD(h),k=S.obj[h]==='coop'?'hane':(d.ak||'moko'),c=P[Math.floor(Math.random()*P.length)];
    S.ani.push({id:(S.aniId=(S.aniId||0)+1),k,h,x:c%W+.5,y:((c/W)|0)+.6,face:1,wt:0});toast(ANI[k].name+'がすみついた','good');if(typeof memo==='function')memo(ANI[k].name+'が村にすみついた')}}
function aniStep(a,dt){/* 道をたどって歩く */if(!a.path||!a.path.length)return false;const c=a.path[0],tx=c%W+.5,ty=((c/W)|0)+.6,dx=tx-a.x,dy=ty-a.y,L=Math.hypot(dx,dy);
  if(L<.05){a.path.shift();return true}const sp=Math.min(L,ANI[a.k].spd*dt);a.x+=dx/L*sp;a.y+=dy/L*sp;if(Math.abs(dx)>.03)a.face=dx>0?1:-1;a.mv=1;return true}
function aniPath(a,to,cells){/* かこいの中だけを通る道（cells がなければ、歩けるマス） */const s=(a.y|0)*W+(a.x|0);if(s===to)return [to];const ok=cells?new Set(cells):null,prev=new Map([[s,-1]]),Q=[s];
  for(let i=0;i<Q.length&&i<600;i++){const c=Q[i];if(c===to)break;const x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const n=ny*W+nx;if(prev.has(n)||!(ok?ok.has(n):aniPass(n)))continue;prev.set(n,c);Q.push(n)}}
  if(!prev.has(to))return null;const p=[];for(let c=to;c!==s&&c>=0;c=prev.get(c))p.unshift(c);return p}
function animalTick(dt){if(!S||!S.ani||!S.ani.length||IS_STORY_REPLAY)return;const night=isNight(),day=callDay(),h=hour();
  const sec=(ANISUB+=dt)>=1;if(sec)ANISUB=0;
  for(const a of S.ani){a.mv=0;if(a.eat>0)a.eat-=dt;if(a.pet>0){a.pet-=dt;continue}
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
  apick:{start(r,a){const gk=grassHave();a.box=keysAdj(a.stand,gk);if(a.box<0)return false;faceTo(r,a.box);r.bubble='';sfxAt('box',r.x,r.y)},done:(r,a)=>a.t>=4,
    end(r,a){const need=Math.min(roomN(r),Math.max(0,aniNeedFeed(a.h)+ANIFEED));let got=0;const m={};for(const k of GRASSK){if(got>=need)break;const t=boxOut(a.box,k,need-got);if(t>0){m[k]=t;got+=t}}if(got>0)r.apk={j:a.h,n:got,m}}},/* えさの草を、箱からとる */
  aput:{start(r,a){if(!r.apk)return false;r.bubble='';faceTo(r,a.obj)},done:(r,a)=>a.t>=4,end(r,a){const p=r.apk;r.apk=null;if(!p)return;if(!isHut(S.obj[p.j])){toHand(r,p.m);return}const d=hutD(p.j);d.feed=(d.feed||0)+p.n;sfxAt('bush',r.x,r.y)}},/* 草を小屋のえさ入れへ */
  awater:{start(r,a){if(!isHut(S.obj[a.obj])||!(r.wcan>0))return false;r.bubble='💦';faceTo(r,a.obj)},done:(r,a)=>a.t>=5,end(r,a){if(!isHut(S.obj[a.obj]))return;hutD(a.obj).wd=callDay();r.wcan=Math.max(0,(r.wcan||0)-1);r.bubble='';sfxAt('water',r.x,r.y)}},/* 水入れに水 */
  acol:{start(r,a){const d=S.dyn[a.obj];if(!d||!d.pr||!Object.keys(d.pr).length)return false;r.bubble='';faceTo(r,a.obj)},done:(r,a)=>a.t>=4,
    end(r,a){const d=S.dyn[a.obj];if(!d||!d.pr)return;for(const k of Object.keys(d.pr)){const n=Math.min(d.pr[k],roomN(r));if(n<=0)break;if(FOODS[k])addCarry(r,k,n);else addMat(r,k,n);d.pr[k]-=n;if(d.pr[k]<=0)delete d.pr[k]}sfxAt('box',r.x,r.y)}},/* とれた物をとる（箱へは、いつものしまい方で） */
  apet:{start(r,a){const b=(S.ani||[]).find(q=>q.id===a.aid);if(!b||b.in)return false;b.pet=a.dur;b.face=r.x<b.x?-1:1;r.face=b.x<r.x?-1:1;r.bubble='❗'},tick(r,a){if(a.t>2)r.bubble='🎵'},done:(r,a)=>a.t>=a.dur,end(r,a){r.fun=Math.min(100,r.fun+ANIFUN);r.wanderRestUntil=S.t+45;r.bubble=''}}});
ACT_LBL.apick='生き物のえさをとりにいく';ACT_LBL.aput='生き物にえさをあげている';ACT_LBL.awater='生き物に水をあげている';ACT_LBL.acol='生き物のとれた物をとっている';ACT_LBL.apet='生き物をなでている';
IDLE_ACTS.push('apet');
function goPetAnimal(r,G){/* ひまなとき：近くの生き物をなでにいく（かこいの中へは、柵のドアから入る） */if(!S.ani||!S.ani.length)return false;let best=null,bd=10;for(const a of S.ani){if(a.in||a.pet>0)continue;const d=Math.hypot(a.x-r.x,a.y-r.y);if(d<bd){bd=d;best=a}}if(!best)return false;
  const bx=best.x|0,by=best.y|0,st=nearest(G,j=>Math.abs(j%W-bx)+Math.abs(((j/W)|0)-by)===1&&walk(j)&&!S.obj[j],30);if(st<0)return false;startAct(r,G,'apet',st,{aid:best.id,dur:12});return true}
/* ---------- 絵 ---------- */
function aniChip(a,now){const k=a.k,C=window.CHIPS||{};if(a.in)return null;const nm=a.eat>0?'ani:'+k+'#e':a.mv?'ani:'+k+'#w'+((now/220|0)%2):'ani:'+k+'#0';return C[nm]||C['ani:'+k+'#0']||null}
function drawAnimal(g,a,now){/* 足もと（a.x, a.y）に、チップの足（下のはし58/64）をそろえる。左むきは、足もとのまん中で反転 */const ch=aniChip(a,now);if(!ch)return;const im=chipImgs(ch,'ani'+a.k)[0];if(!im.ok)return;
  const x=Math.round(a.x*TS),y=Math.round(a.y*TS),sz=a.k==='hane'?6:10;g.fillStyle='rgba(60,50,30,.18)';g.fillRect(x-sz,y-1,sz*2,2);g.fillRect(x-sz+2,y+1,sz*2-4,1);/* かげ（ドット） */
  g.save();g.translate(x,y);if(a.face<0)g.scale(-1,1);g.imageSmoothingEnabled=false;g.drawImage(im,ch.ax/2-TS/2,ch.ay/2-29,ch.w/2,ch.h/2);g.restore()}
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
  body.appendChild(sec);
  if(o==='barn'){const s2=el('<div class="sec"><h3>つぎに来る生き物</h3><div class="rows"></div></div>'),r2=s2.querySelector('.rows');
    for(const k of HUTK.barn){const row=el('<button class="row" style="text-align:left;width:100%"><div class="tx"><b></b><small></small></div></button>');ckSet(row.querySelector('b'),((d.ak||'moko')===k?'✓ ':'')+ANI[k].name);row.querySelector('small').textContent='とれる物：'+aniProdName(ANI[k].prod);row.onclick=()=>{d.ak=k;sfx('next');renderSheet()};r2.appendChild(row)}
    body.appendChild(s2)}}
