/* ---------- 小さな生き物：見た目だけ（セーブしない） ----------
   ちょう：昼・雨でない日、花のそばをとぶ。小鳥：朝から夕方まで、木のそばの地面をはねる（せいれいが近づくと飛びたつ）。
   かえる：雨の日か夕方、水べをはねる（ときどき水へとびこむ）。画面の近くにだけ出す（CRITMAX ぴきまで）。
   ひまなせいれいは、ときどき見つけて、そっと見る・追いかける（critwatch、おわると たのしさ+2）。 */
const CRITMAX=6,CRITN={fly:3,bird:2,frog:2},CRITFUN=2;let CRIT=[],CRITS=null,CRITT=0,CRITID=1;
const CRITC={fly:[['#f6bfd6','#e48fb2'],['#ffe08a','#e9b84a'],['#bfe3ff','#86bde8'],['#ffffff','#d7d2c6']]};
function critView(){const z=cam.z||1;return [cam.x/TS,cam.y/TS,(cam.x+VW/z)/TS,(cam.y+VH/z)/TS]}
function critOK(k,j){if(j<0||j>=W*H)return false;const h=hour();
  if(k==='fly')return h>=7&&h<18&&!S.rain&&FLOWERS.has(S.obj[j])&&!isBud(j);
  if(k==='bird')return h>=6&&h<17&&!S.rain&&walk(j)&&!S.obj[j]&&!S.floor[j]&&[1,-1,W,-W].some(o=>TREES.has(typeAt(j+o)));
  if(k==='frog')return (S.rain&&h>=6&&h<20||h>=17&&h<20)&&walk(j)&&!S.obj[j]&&!S.floor[j]&&S.ground[j]!==1&&[1,-1,W,-W].some(o=>S.ground[j+o]===1);
  return false}
function critSpawn(){if(CRIT.length>=CRITMAX||isNight()||enemyLive())return;const [a,b,c,d]=critView(),k=['fly','bird','frog'][Math.floor(Math.random()*3)];if(CRIT.filter(q=>q.k===k).length>=CRITN[k])return;
  for(let n=0;n<40;n++){const x=Math.floor(a+Math.random()*(c-a)),y=Math.floor(b+Math.random()*(d-b)),j=y*W+x;if(x<0||y<0||x>=W||y>=H||!critOK(k,j))continue;
    const C=CRITC.fly[Math.floor(Math.random()*4)];CRIT.push({id:CRITID++,k,x:x+.5,y:y+.6,hx:x+.5,hy:y+.6,z:k==='fly'?12:0,vx:0,vy:0,face:Math.random()<.5?-1:1,t:0,life:60+Math.random()*60,hop:0,fl:0,col:C});return}}
function critTick(dt){if(!S)return;if(CRITS!==S){CRIT=[];CRITS=S}if(IS_STORY_REPLAY){CRIT=[];return}
  CRITT+=dt;if(CRITT>=2){CRITT=0;critSpawn()}
  const night=isNight();
  for(const c of CRIT){c.t+=dt;
    if(c.k==='fly'){if(c.t%5<dt||Math.hypot(c.hx-c.x,c.hy-c.y)<.2){/* ちかくの花へ */const x0=c.x|0,y0=c.y|0;let best=null;for(let n=0;n<12;n++){const x=x0+Math.floor(Math.random()*9)-4,y=y0+Math.floor(Math.random()*9)-4,j=y*W+x;if(x>=0&&y>=0&&x<W&&y<H&&FLOWERS.has(S.obj[j])){best=[x+.5,y+.5];break}}if(best){c.hx=best[0]+(Math.random()-.5)*.7;c.hy=best[1]+(Math.random()-.5)*.5}}
      const dx=c.hx-c.x,dy=c.hy-c.y,L=Math.hypot(dx,dy)||1,sp=Math.min(L,.9*dt);c.x+=dx/L*sp+Math.sin(c.t*3+c.id)*.01;c.y+=dy/L*sp;if(Math.abs(dx)>.05)c.face=dx>0?1:-1;c.z=14+Math.sin(c.t*2.3+c.id)*5;
      if(S.rain||night)c.life=Math.min(c.life,c.t+2)}
    else if(c.fl){c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=14*dt;if(c.z>60)c.life=0}/* 飛びたつ */
    else{if(c.k==='bird'&&S.res.some(r=>!r.hidden&&Math.hypot(r.x-c.x,r.y-c.y)<1.6)){c.fl=1;const r=S.res.find(r=>!r.hidden&&Math.hypot(r.x-c.x,r.y-c.y)<1.6),L=Math.hypot(c.x-r.x,c.y-r.y)||1;c.vx=(c.x-r.x)/L*2.4;c.vy=(c.y-r.y)/L*2.4-.6;c.face=c.vx>0?1:-1}
      c.hop-=dt;if(c.hop<=0){c.hop=1+Math.random()*2.5;const o=[[1,0],[-1,0],[0,1],[0,-1]][Math.floor(Math.random()*4)],nx=c.x+o[0]*.35,ny=c.y+o[1]*.35,j=(ny|0)*W+(nx|0);
        if(c.k==='frog'&&S.ground[j]===1&&Math.random()<.25){c.life=0;fxSpr&&fxSpr('fishsplash',nx*TS,(ny+.1)*TS)}/* 水へとびこむ */
        else if(Math.abs(nx-c.hx)<1.2&&Math.abs(ny-c.hy)<1.2&&walk(j)&&!S.obj[j]&&S.ground[j]!==1){c.jx=c.x;c.jy=c.y;c.x=nx;c.y=ny;c.jt=0;if(o[0])c.face=o[0]}}
      if(c.jt!=null){c.jt+=dt;c.z=Math.max(0,Math.sin(Math.min(1,c.jt/.35)*Math.PI)*5);if(c.jt>.35)c.jt=null}
      if(night||c.k==='bird'&&S.rain)c.life=Math.min(c.life,c.t+1)}}
  CRIT=CRIT.filter(c=>c.t<c.life)}
const critById=id=>CRIT.find(c=>c.id===id)||null;
/* 描く：せかいのドット（1マス32）。地面にかげ、とぶ物は上に */
function drawCritter(g,c,now){const x=Math.round(c.x*TS),y=Math.round(c.y*TS),z=Math.round(c.z||0),f=c.face<0?-1:1,P=2,R=(dx,dy,w,h,col)=>{g.fillStyle=col;g.fillRect(f>0?x+dx*P:x-(dx+w)*P,y-z+dy*P,w*P,h*P)};/* 1ドットは せかいの2 */
  g.fillStyle='rgba(40,30,20,.18)';g.fillRect(x-4,y,8,2);
  if(c.k==='fly'){const op=Math.floor(now/120+c.id)%2===0,[a,b]=c.col;if(op){R(-4,-3,3,3,a);R(1,-3,3,3,a);R(-3,0,2,2,b);R(1,0,2,2,b)}else{R(-2,-4,2,4,a);R(0,-4,2,4,a)}R(0,-3,1,4,'#6b5a4a')}
  else if(c.k==='bird'){const fl=c.fl&&Math.floor(now/90)%2===0;R(-3,-4,6,4,'#a8765a');R(-2,-2,4,2,'#f3e1c4');R(3,-3,2,1,'#f2b04a');R(1,-4,1,1,'#3a2c22');R(-4,-4,1,2,'#8d5f47');if(fl){R(-2,-7,3,3,'#8d5f47')}else{R(-2,-4,3,1,'#8d5f47')}if(!c.fl&&!z){R(-1,0,1,1,'#c98f4a');R(1,0,1,1,'#c98f4a')}}
  else{R(-3,-3,6,3,'#8fcf6a');R(-3,-1,6,1,'#6fae52');R(-2,-5,2,2,'#8fcf6a');R(1,-5,2,2,'#8fcf6a');R(-2,-5,1,1,'#f7f7e8');R(1,-5,1,1,'#f7f7e8');R(-1,-4,1,1,'#2e3a22');R(2,-4,1,1,'#2e3a22');R(-4,-1,1,1,'#6fae52');R(3,-1,1,1,'#6fae52')}}
/* せいれいが見つけて、見る・追いかける */
function goCritter(r,G){if(!CRIT.length)return false;let best=null,bd=1e9;for(const c of CRIT){if(c.fl)continue;const d=Math.hypot(c.x-r.x,c.y-r.y);if(d<7&&d<bd){bd=d;best=c}}if(!best)return false;
  const cj=(best.y|0)*W+(best.x|0),st=nearest(G,j=>walk(j)&&!S.obj[j]&&Math.abs(j%W-cj%W)<=2&&Math.abs(((j/W)|0)-((cj/W)|0))<=1&&j!==cj&&!(TAKEN&&TAKEN.has(j)),14);if(st<0)return false;
  startAct(r,G,'critwatch',st,{cid:best.id,k:best.k,dur:16,chase:(r.elem==='wind'||r.elem==='wood')&&best.k==='fly'?2:0});return true}
ACT.critwatch={start(r,a){const c=critById(a.cid);if(c)r.face=c.x>=r.x?1:-1;r.bubble='❗'},
  tick(r,a,dt){const c=critById(a.cid);if(c&&!c.fl)r.face=c.x>=r.x?1:-1;if(a.t>3)r.bubble=c?'🎵':'';
    if(a.chase&&c&&!c.fl&&Math.hypot(c.x-r.x,c.y-r.y)>2.2&&a.t>4){a.chase--;const G=bfs(r.x|0,r.y|0),cj=(c.y|0)*W+(c.x|0),st=nearest(G,j=>walk(j)&&!S.obj[j]&&Math.abs(j%W-cj%W)<=1&&Math.abs(((j/W)|0)-((cj/W)|0))<=1&&j!==cj,10);if(st>=0){r.path=avoidPath(r,G,st);a.stand=st;a.stage='walk';a.t=0}}},
  done:(r,a)=>a.t>=a.dur||!critById(a.cid)&&a.t>2,end(r,a){r.fun=Math.min(100,r.fun+CRITFUN);r.wanderRestUntil=S.t+45;r.bubble=''}};
ACT_LBL.critwatch='小さな生き物を見ている';
