'use strict';
/* ---------- 2階建ての家 ----------
   2階は、マスごとの別の層（S.fl2：obj・floor・ref・dyn・hp・rot・win。キーはマスの番号）。
   2階への階段（stairs2f）がある家だけが2階を持てる。2階の壁は、その家（1階の壁と中）の上にだけ置ける。
   階段のマスから、2階の壁でかこまれた所（ななめのすきまもなし）が2階の部屋（h.fl2）。
   見かた（家をタップ）：屋根 → 2階 → 1階 → 屋根。2階を見せている家では、「おく」は2階に置く。
   せいれい：階段まで歩き、のぼって2階を歩く（act.up）。2階の子は、コワイノにねらわれない・こわがらない（コワイノは階段をのぼらない）。
   家がこわれたら、2階の子は1階におりる。 */
const FL2K=['obj','floor','ref','dyn','hp','rot','win'];
const FL2CLIMB=4;/* 階段をのぼる・おりる時間 */
const FL2WIN=new Set(['window','paint1','paint2','paint3','curtain1','curtain2','yonaka']);/* 2階の壁にかけられる物 */
const FL2NO=new Set(['stor','mbox','oven','cooktable','composter','jar','obox','board','altar','statue']);/* 仕事に使う物・しまう物は、1階だけ */
function fl2Init(s){const f=s.fl2&&typeof s.fl2==='object'?s.fl2:(s.fl2={});for(const k of FL2K)if(!f[k]||typeof f[k]!=='object'||Array.isArray(f[k]))f[k]={};return f}
const FL2V=new Map();/* 家ごとの見かた（屋根をはずしているとき）：1 2階・2 1階 */
const fl2View=h=>h&&h.st>=0&&OPENH.has(hKey(h))?(FL2V.get(hKey(h))||1):0;
const fl2Anc=j=>{const F=S.fl2;return F&&F.obj[j]==='part'&&F.ref[j]!=null?F.ref[j]:j};
const fl2Wall=k=>{const o=S.fl2&&S.fl2.obj[k];return !!o&&HOME_WALLS.has(o)&&o!=='wall'};
/* findHouses のあとに、家ごとの階段と2階の部屋を作る */
function fl2Houses(){const F=S&&S.fl2;for(const h of HOUSES){h.st=-1;h.fl2=null;for(const j of h.inside)if(S.obj[j]==='stairs2f'){h.st=j;break}if(h.st<0||!F||fl2Wall(h.st))continue;
    const cells=new Set([h.st]),q=[h.st];let ok=true;
    while(q.length&&ok){const j=q.pop(),x=j%W,y=(j/W)|0;for(const[a,b]of DIRS){const k=(y+b)*W+x+a;if(cells.has(k)||fl2Wall(k))continue;if(!h.set.has(k)){ok=false;break}cells.add(k);q.push(k)}}
    if(ok)for(const j of cells){const x=j%W,y=(j/W)|0;for(let b=-1;b<=1&&ok;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(!cells.has(k)&&!fl2Wall(k)){ok=false;break}}}/* ななめにも、すきまがない */
    if(!ok)continue;const set=new Set(cells);for(const j of cells){const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(fl2Wall(k))set.add(k)}}
    h.fl2={set,inside:cells,x0:h.x0,y0:h.y0,x1:h.x1,y1:h.y1,ib:h.ib}}}
const fl2HouseAt=j=>(FL2SW?FL2HS:HOUSES).find(h=>h.st===j)||null;/* 2階に入れかえているあいだも、1階の家の一覧から */
/* 2階を「いまの層」にして fn を動かす（描く・2階のスポット・置けるかの判定）。家のマスとまわり1マスの中身を、2階のものに入れかえて、さいごに必ずもどす */
let FL2SW=null,FL2HS=[];
function fl2Swap(h,fn){if(FL2SW)return fn();const F=fl2Init(S),f=h.fl2,cells=new Set();for(const j of h.set){const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const xx=x+a,yy=y+b;if(xx>=0&&yy>=0&&xx<W&&yy<H)cells.add(yy*W+xx)}}
  const SW=S.win||(S.win={}),SR=S.rot||(S.rot={}),sv=[],put=(o,k,v)=>{if(v===undefined)delete o[k];else o[k]=v};
  for(const j of cells){sv.push([j,S.obj[j],S.floor[j],S.ref[j],S.dyn[j],S.hp[j],SR[j],SW[j]]);const inH=h.set.has(j);
    S.obj[j]=inH?(F.obj[j]||''):'';S.floor[j]=inH&&f&&f.inside.has(j)&&j!==h.st?(F.floor[j]||'floor'):'';
    put(S.ref,j,inH?F.ref[j]:undefined);put(S.dyn,j,inH?F.dyn[j]:undefined);put(S.hp,j,inH?F.hp[j]:undefined);put(SR,j,inH?F.rot[j]:undefined);put(SW,j,inH?F.win[j]:undefined)}
  const hs=HOUSES,rc=RUGC,rf=RFC;HOUSES=f?[f]:[];RUGC=new Map();RFC=new Map();FL2SW=h;FL2HS=hs;
  try{return fn()}finally{for(const[j,o,fl,rf0,dy,hp,ro,wi]of sv){/* 2階で書きかわった物（dyn・hp）は、2階の層へもどす */if(h.set.has(j)){put(F.dyn,j,S.dyn[j]);put(F.hp,j,S.hp[j])}S.obj[j]=o;S.floor[j]=fl;put(S.ref,j,rf0);put(S.dyn,j,dy);put(S.hp,j,hp);put(SR,j,ro);put(SW,j,wi)}HOUSES=hs;RUGC=rc;RFC=rf;FL2SW=null}}
/* 2階の部屋のスポット（部屋だけ） */
let FL2SPOT=[];
function fl2Spots(){FL2SPOT=[];if(!S||!S.fl2)return;for(const h of HOUSES){const f=h.fl2;if(!f)continue;fl2Swap(h,()=>{for(const j of f.inside){const o=S.obj[j];if(!o||o==='part')continue;for(const sp of SPOTS){if(!sp.room||!sp.main(o,j))continue;const x0=j%W,y0=(j/W)|0,found=sp.need.map(()=>[]);
      for(let y=y0-3;y<=y0+3;y++)for(let x=x0-3;x<=x0+3;x++){const q=y*W+x;if(!f.set.has(q))continue;const t=S.obj[q],wv=S.win&&typeof S.win[q]==='string'?S.win[q]:null;if(wv&&q!==j)sp.need.forEach((nd,i)=>{if(nd[0](wv,q))found[i].push(q)});if(q===j||!t||t==='part'||!f.inside.has(q))continue;sp.need.forEach((nd,i)=>{if(nd[0](t,q))found[i].push(q)})}
      if(sp.need.every((nd,i)=>found[i].length>=nd[1]))FL2SPOT.push({sp,j,found,h})}}})}}
const fl2Room=(h,k)=>FL2SPOT.some(t=>t.h===h&&t.sp.k===k);
const fl2RoomNames=h=>FL2SPOT.filter(t=>t.h===h).map(t=>t.sp.n);
/* 2階の家具（住み心地・好きな家具） */
function fl2Objs(h){const L=[];if(!h.fl2||!S.fl2)return L;for(const j of h.fl2.inside){const o=S.fl2.obj[j];if(o&&o!=='part')L.push(o)}return L}
function fl2Wins(h){const L=[];if(!h.fl2||!S.fl2)return L;for(const j of h.fl2.set){const w=S.fl2.win[j];if(w)L.push(w)}return L}
function fl2Count(h,f){return fl2Objs(h).filter(o=>o===f).length+fl2Wins(h).filter(o=>o===f).length}
/* ---------- 置く・とる ---------- */
function fl2Target(x,y){if(!S||!HOUSES.length||x<0||y<0||x>=W||y>=H)return null;const j=y*W+x;return HOUSES.find(h=>h.st>=0&&h.set.has(j)&&fl2View(h)===1)||null}
function fl2CanPlace(h,id,x,y,quiet){const no=t=>{if(!quiet)toast(t);return false};const b=BL[id];if(!b)return false;const F=fl2Init(S),j=y*W+x,f=h.fl2;
  if(j===h.st)return no('階段の上には置けません');
  if(b.floor){if(ROADF.has(id))return no('2階には、道はしけません');if(!f||!f.inside.has(j))return no('2階の床は、2階の壁でかこんだ中にしけます');return (F.floor[j]||'floor')!==id}
  if(WALLD.has(id)){if(!FL2WIN.has(id))return no(b.name+'は、2階にはかけられません');const cur=id==='curtain1'||id==='curtain2';if(!fl2Wall(j)||fl2Wall(j-W)||fl2Wall(j+W))return no(b.name+'は、横向きの家の壁にだけかけられます');
    if(F.win[j]&&!(cur&&F.win[j]===1))return no('ここにはもう何かあります');if(cur&&!(F.win[j]===1&&f&&f.inside.has(j+W)&&!f.inside.has(j-W)))return no('カーテンは、家の上がわの窓にだけかけられます');return true}
  if(HOME_WALLS.has(id)){if(id==='wall')return no('2階には、家の壁だけ置けます');if(F.obj[j])return no('ここにはもう何かあります');if(S.res.some(r=>r.fl===1&&!r.hidden&&(r.y|0)*W+(r.x|0)===j))return no('せいれいがいるので、置けません');return true}
  if(b.kind!=='furn'||RUGS.has(id)||CANOPY.has(id)||EDGES.has(id)||FL2NO.has(id)||STORAGE[id]||b.job)return no('2階には置けません');
  if(!f)return no('2階の壁で階段のまわりをかこむと、家具を置けます');
  for(const[a,c]of fp(id,x,y,PLROTS[id]||0)){const k=c*W+a;if(!f.inside.has(k)||k===h.st)return no('2階の壁でかこんだ中に置けます');if(F.obj[k])return no('ここにはもう何かあります')}
  return true}
function fl2Place(h,id,x,y){const b=BL[id],j=y*W+x,F=fl2Init(S);if(!fl2CanPlace(h,id,x,y))return;if(inv(id)<=0)return toast(b.name+'が足りません','warn');
  S.inv[id]--;
  if(b.floor){if(F.floor[j])giveItem(F.floor[j],1);F.floor[j]=id}
  else if(WALLD.has(id))F.win[j]=id==='window'?1:id;
  else{const v=ROTS[id]?PLROTS[id]||0:0;F.obj[j]=id;if(v)F.rot[j]=v;else delete F.rot[j];if(b.dyn)F.dyn[j]={g:0};if(b.hp)F.hp[j]=b.hp;for(const[a,c]of fp(id,x,y,v)){const k=c*W+a;if(k===j)continue;F.obj[k]='part';F.ref[k]=j}}
  S.placed[id]=(S.placed[id]||0)+1;recount();burst(j,b.kind==='block'?'block':'furn',b.kind==='furn'?'furnPlace':null);renderPalette();checkQuest();dirty=true}
function fl2Remove(h,x,y){const F=fl2Init(S),j0=y*W+x,j=fl2Anc(j0),o=F.obj[j];
  if(F.win[j0]){const id=F.win[j0]===1?'window':F.win[j0];if(id==='curtain1'||id==='curtain2')F.win[j0]=1;else delete F.win[j0];giveItem(id,1);toast(BL[id].name+'をおそなえ箱にもどした');burst(j0,'furn','rm');recount();renderPalette();return}
  if(o){if(HOME_WALLS.has(o)&&S.res.some(r=>r.fl===1&&fl2HouseOf(r)===h)&&h.fl2&&h.fl2.set.has(j))return toast('2階にせいれいがいるので、こわせません');
    for(const k in F.ref)if(F.ref[k]===j){delete F.obj[k];delete F.ref[k]}delete F.obj[j];delete F.dyn[j];delete F.hp[j];delete F.rot[j];if(HOME_WALLS.has(o))delete F.win[j];giveItem(o,1);toast(BL[o].name+'をおそなえ箱にもどした');burst(j,'block','rm');recount();renderPalette();return}
  if(F.floor[j0]){giveItem(F.floor[j0],1);delete F.floor[j0];burst(j0,'block','rm');recount();renderPalette()}}
/* 2階に物がある家の階段は、こわせない */
function fl2Busy(j){const h=HOUSES.find(q=>q.st===j);if(!h||!S.fl2)return false;for(const k of h.set)if(S.fl2.obj[k]||S.fl2.win[k]||S.fl2.floor[k])return true;return S.res.some(r=>r.fl===1&&r.fl2s===j)}
function fl2CanStairs(j,quiet){const no=t=>{if(!quiet)toast(t);return false};const h=HOUSES.find(q=>q.inside.has(j));if(!h)return no('2階への階段は、家の中に置けます');if(HOME_DOORS.has(S.obj[j]))return no('ここには置けません');
  for(const k of h.inside)if(S.obj[k]==='stairs2f'||S.obj[k]==='site'&&S.dyn[k]&&S.dyn[k].build==='stairs2f')return no('2階への階段は、1つの家に1つです');return true}
/* ---------- 見かた（家をタップ） ---------- */
function fl2Tap(h,j){if(!h||h.st<0)return false;const hk=hKey(h),v=fl2View(h);
  if(v===0){OPENH.add(hk);FL2V.set(hk,1);dirty=true;return true}
  const edge=h.set.has(j)&&!h.inside.has(j);
  if(v===1){const a=fl2Anc(j),o=S.fl2&&S.fl2.obj[a];if(edge||fl2Wall(a)){FL2V.set(hk,2);dirty=true;return true}
    if(o){toast(BL[o].name);return true}openSheet('house',HOUSES.indexOf(h));return true}
  if(edge){OPENH.delete(hk);FL2V.delete(hk);dirty=true;return true}
  return false}
/* せいれいを描くか：2階の子は2階の絵の中だけ。2階を見せている家の1階の子は、かくれる */
function fl2Hid(r){if(r.fl===1)return true;if(!HOUSES.length)return false;const j=(r.y|0)*W+(r.x|0);for(const h of HOUSES)if(h.st>=0&&h.set.has(j)&&fl2View(h)===1)return true;return false}
const fl2HouseOf=r=>r.fl2s!=null?fl2HouseAt(r.fl2s):null;
const fl2Shown=r=>r.fl===1&&fl2View(fl2HouseOf(r))===1;
/* ---------- 描く ---------- */
const FL2P=['#dcae72','#a9784b','#86593a','#5e3d26','#f0cf98'];
function drawStairs2f(c,x,y,i,well){const P=FL2P;
  if(well){c.fillStyle='#2e2118';c.fillRect(x+2,y+2,28,28)}/* 2階から見た、階段の穴 */
  else{c.fillStyle='rgba(40,25,10,.2)';c.fillRect(x+3,y+29,26,2)}
  c.fillStyle=P[2];c.fillRect(x+4,y+2,3,28);c.fillRect(x+25,y+2,3,28);c.fillStyle=P[0];c.fillRect(x+4,y+2,1,28);c.fillRect(x+25,y+2,1,28);/* 側板 */
  c.fillStyle=P[3];c.fillRect(x+7,y+2,18,4);/* いちばん上は、2階の床の下へ入る */
  for(let s=0;s<6;s++){const ty=y+25-s*4;c.fillStyle=P[0];c.fillRect(x+7,ty,18,3);c.fillStyle=P[4];c.fillRect(x+7,ty,18,1);c.fillStyle=P[2];c.fillRect(x+7,ty+3,18,1)}/* 段：手前のふちに明るい線、奥にかげ */
  if(well){c.fillStyle='rgba(20,12,6,.38)';c.fillRect(x+2,y+2,28,28);/* 手すり */c.fillStyle=P[1];c.fillRect(x+1,y+1,30,2);c.fillRect(x+1,y+1,2,30);c.fillRect(x+29,y+1,2,30);c.fillStyle=P[4];c.fillRect(x+1,y+1,30,1);c.fillStyle=P[2];for(const px of[x+1,x+29])for(const py of[y+1,y+15,y+29])c.fillRect(px,py,2,2)}}
function drawFloor2(h,now){const f=h.fl2,RS=S.res.filter(r=>r.fl===1&&fl2HouseOf(r)===h);/* 入れかえる前に（入れかえ中の HOUSES は2階だけ） */fl2Swap(h,()=>{
  ctx.fillStyle='rgba(40,28,18,.45)';for(const j of h.set)if(!f||!f.set.has(j))ctx.fillRect((j%W)*TS,((j/W)|0)*TS,TS,TS);/* 2階のない所（1階が見える）は、うすく暗く */
  if(f){for(const j of f.inside)if(j!==h.st)drawFloor(ctx,S.floor[j],(j%W)*TS,((j/W)|0)*TS,j);for(const j of f.set)if(!f.inside.has(j))wallMarg(ctx,j,(j%W)*TS,((j/W)|0)*TS)}
  drawStairs2f(ctx,(h.st%W)*TS,((h.st/W)|0)*TS,h.st,true);
  const L=[];for(const j of h.set){const o=S.obj[j];if(!o||o==='part'||!BL[o])continue;const x=j%W,y=(j/W)|0;L.push({k:objectDepth(o,j),t:BL[o].kind==='block'?0:1,f:()=>drawObj(ctx,o,x*TS,y*TS,j,S.dyn[j]?(S.dyn[j].g!=null?S.dyn[j].g:S.dyn[j].p):0,now)})}
  for(const r of RS){const a=r.act,inB=a&&a.stage==='do'&&a.obj!=null&&S.obj[a.obj]&&BL[S.obj[a.obj]]?a.obj:-1;L.push({k:inB>=0?objectDepth(S.obj[inB],inB)+.02:toyR(r)?toyPose(r,now).z:rDepth(r),t:2,f:()=>drawRes(r,now)})}/* ベッド・遊び家具の子は、その家具より手前（1階と同じ） */
  L.sort((a,b)=>a.k-b.k||a.t-b.t);for(const it of L)it.f()})}
/* ---------- せいれい ---------- */
function fl2Path(h,s,g){const f=h.fl2;if(!f||s===g)return [];const ok=k=>{if(k===g)return true;if(!f.inside.has(k))return false;const o=S.fl2.obj[fl2Anc(k)];return !o||!(BL[o]&&BL[o].solid)};
  const prev=new Map([[s,-1]]),q=[s];while(q.length){const j=q.shift();if(j===g)break;const x=j%W,y=(j/W)|0;for(const[a,b]of DIRS){const k=(y+b)*W+x+a;if(prev.has(k)||!ok(k))continue;prev.set(k,j);q.push(k)}}
  if(!prev.has(g))return [g];const p=[];for(let j=g;j!==s;j=prev.get(j))p.push(j);return p.reverse()}
function fl2Down(r){if(r.fl!==1)return;r.fl=0;const s=r.fl2s;if(s!=null){r.x=s%W+.5;r.y=((s/W)|0)+.5}r.hidden=false;r.path=[]}
function fl2Walk(r,a,dt){let step=.36*dt*rMul(r,'move');while(step>0&&a.p2.length){const j=a.p2[0],tx=j%W+.5,ty=((j/W)|0)+.5,dx=tx-r.x,dy=ty-r.y,d=Math.hypot(dx,dy);if(dx)r.face=dx<0?-1:1;if(d<=step){r.x=tx;r.y=ty;a.p2.shift();step-=d}else{r.x+=dx/d*step;r.y+=dy/d*step;step=0}}}
function fl2Tick(r,a,dt,A0){const h=fl2HouseAt(a.stand);
  if(!h||!h.fl2||!h.fl2.inside.has(a.goal)){fl2Down(r);a.ph='end';return}/* 家・階段・2階がなくなったら、1階へ */
  const sx=a.stand%W+.5,sy=((a.stand/W)|0)+.5;
  if(a.ph==='climb'){a.ct+=dt;const k=Math.min(1,a.ct/FL2CLIMB);r.x=sx;r.y=sy+.3-k*.6;if(k>=1){r.fl=1;r.y=sy;a.p2=fl2Path(h,a.stand,a.goal);a.ph='walk2'}return}
  if(a.ph==='walk2'||a.ph==='back'){fl2Walk(r,a,dt);if(a.p2.length)return;
    if(a.ph==='back'){a.ph='down';a.ct=0;return}
    a.ph='do';a.stage='do';a.t=0;a.obj=a.obj2;if(fl2Swap(h,()=>A0.start?A0.start(r,a):undefined)===false){fl2Leave(r,a);return}a.did=1;
    if(a.cf!=null)a.cf=.6+comfyFor(h,r)/100*.9;/* 住み心地は、1階と2階の家ぜんたい */return}
  if(a.ph==='down'){a.ct+=dt;const k=Math.min(1,a.ct/FL2CLIMB);if(k>=1){fl2Down(r);a.ph='end'}return}
  if(a.ph==='do'&&A0.tick)fl2Swap(h,()=>A0.tick(r,a,dt))}
function fl2Leave(r,a){const h=fl2HouseAt(a.stand);a.ph='back';a.stage='f2';r.hidden=false;r.bubble='';a.p2=h&&h.fl2?fl2Path(h,(r.y|0)*W+(r.x|0),a.stand):[]}
function fl2Wrap(name){const A0=ACT[name];ACT[name]={
  start(r,a){if(a.up==null)return A0.start?A0.start(r,a):undefined;a.stage='f2';a.ph='climb';a.ct=0;r.bubble='';r.fl2s=a.stand;r.path=[]},
  tick(r,a,dt){if(a.up==null){if(A0.tick)A0.tick(r,a,dt);return}fl2Tick(r,a,dt,A0)},
  done(r,a){if(a.up==null)return A0.done(r,a);if(a.ph==='do'){const h=fl2HouseAt(a.stand);if(!h||fl2Swap(h,()=>A0.done(r,a)))fl2Leave(r,a)}return a.ph==='end'},
  end(r,a){if(a.up==null){if(A0.end)A0.end(r,a);return}if(a.did&&A0.end){const h=fl2HouseAt(a.stand);a.obj=a.obj2;if(h)fl2Swap(h,()=>A0.end(r,a));else A0.end(r,a)}}}}
fl2Wrap('sleep');fl2Wrap('play');
/* 2階のベッド：1階のベッドより近ければ、2階で眠る */
function fl2Bed(r,G,d1){let best=null,bd=d1;for(const h of HOUSES){const f=h.fl2;if(!f||G.dist[h.st]<0||G.dist[h.st]>200)continue;for(const j of f.inside){const o=S.fl2.obj[j];if(!BEDSET.has(o)||!free('u'+j,1))continue;const p=fl2Path(h,h.st,j),d=G.dist[h.st]+2+p.length;if(d<bd){bd=d;best={h,j}}}}
  if(!best)return null;const b=BL[S.fl2.obj[best.j]].sleep;return{st:best.h.st,o:{up:hKey(best.h),obj2:best.j,goal:best.j,key:'u'+best.j,rate:b.rate,pt:b.pt,cf:1}}}
/* 2階の遊び家具：goPlay と同じ点数 */
function fl2PlayBest(r,G,bs){let best=null;for(const h of HOUSES){const f=h.fl2,ds=f?G.dist[h.st]:-1;if(ds<0||ds>45)continue;for(const j of f.inside){const w=S.fl2.obj[j],p=w&&BL[w]&&BL[w].play;if(!p||!free('u'+j,p.cap))continue;
    let g=j;if(p.adj){g=-1;const x=j%W,y=(j/W)|0;for(const[a,b]of DIRS){const k=(y+b)*W+x+a;if(f.inside.has(k)&&k!==h.st&&!S.fl2.obj[k]){g=k;break}}if(g<0)continue}
    const d=ds+2+fl2Path(h,h.st,g).length,ng=(NIGATE[r.elem]||{})[w],s=p.pt*3+(r.like===w?6:0)+((FAVTOY[r.elem]||[]).includes(w)?7:0)-(ng!=null?6:0)-d*.3+Math.random()*2;
    if(s>bs){bs=s;best={s,b:{type:'play',stand:h.st,o:{up:hKey(h),obj2:j,goal:g,key:'u'+j,what:w,fun:ng!=null?ng:p.fun,dur:p.dur,pt:p.pt,pw:p.pw,nig:ng!=null}}}}}}
  return best}
NOMOVE.add('stairs2f');/* ひっこしミトンでは、うつせない */
