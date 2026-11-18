/* ---------- 小さな生き物：見た目だけ（セーブしない） ----------
   画面の近くにだけ出す（ぜんぶで CRITMAX ひき、1しゅるい CK の n ひきまで）。夜（23時〜6時）・コワイノのいるときは出さない。
   どこに・いつ（critOK）：ちょう・みつばち＝昼の花・雨でない／小鳥・りす＝昼の木のそば／うさぎ＝昼のみどりの草地／はりねずみ＝夕方の茂みのそば／
   ねずみ＝昼の箱のそば／もぐら＝土のステージ（WD 3）の昼の畑のそば／かたつむり＝雨の日の花・草のそば／てんとうむし＝昼の花のそば（地面）／
   とんぼ＝秋の昼〜夕方の水の上／ほたる＝夜のはじめ（19〜23時）の水べ、おしりが光る／かえる＝雨の日か夕方の水べ。
   うさぎ・りす・ねずみ・小鳥は、せいれいが近づくと、にげる（小鳥は飛びたつ）。いなくなるとき（寿命・にげる・雨・夜）は、画面の外へ去ってから消える（critLeave）。
   ひまなせいれいは、ときどき見つけて、そっと見る・追いかける（critwatch、おわると たのしさ+2）。 */
const CRITMAX=6,CRITFUN=2;let CRIT=[],CRITS=null,CRITT=0,CRITID=1;
/* しゅるい：m 動き（fly 花へとぶ・hover とんで止まる・drift ふわふわ・hop はねる・walk 歩く・bird 小鳥）。ch チップの名前（crit<ch>#<コマ>、tools/art/critter3d/crit_build.py）。
   hop はねる長さ（マス）・sp 歩く速さ（マス/秒）・flee にげる・sw かげのはば・w えらばれやすさ（書いてなければ1）・n 同時に出る数（書いてなければ1）。
   小鳥・ちょう・とんぼはよく出て、ほかはあまり出ない（持ち主のきめ）。 */
const CK={fly:{m:'fly',sw:8,w:10,n:2},bird:{m:'bird',sw:8,w:10,n:2},frog:{m:'hop',ch:'kaeru',hop:.35,sw:8},usagi:{m:'hop',hop:.5,flee:1,sw:10},risu:{m:'hop',hop:.4,flee:1,sw:10},
  harinezumi:{m:'walk',sp:.25,sw:9},nezumi:{m:'walk',sp:.5,flee:1,sw:8},mogura:{m:'walk',sp:.2,sw:10},katatsumuri:{m:'walk',sp:.06,sw:8},tentoumushi:{m:'walk',sp:.15,sw:5},
  mitsubachi:{m:'fly',sw:5},tonbo:{m:'hover',sw:6,w:10,n:2},hotaru:{m:'drift',sw:4}};
const CRITKINDS=Object.keys(CK),CRITW=CRITKINDS.reduce((t,k)=>t+(CK[k].w||1),0);
function critPick(){let r=Math.random()*CRITW;for(const k of CRITKINDS){r-=CK[k].w||1;if(r<0)return k}return CRITKINDS[CRITKINDS.length-1]}
function critView(){const z=cam.z||1;return [cam.x/TS,cam.y/TS,(cam.x+VW/z)/TS,(cam.y+VH/z)/TS]}
const critOpen=j=>walk(j)&&!S.obj[j]&&!S.floor[j]&&S.ground[j]!==1;/* 地面の空いたマス */
function critNear(j,r,f){const x0=j%W,y0=(j/W)|0;for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++){if(x<0||y<0||x>=W||y>=H||(x===x0&&y===y0))continue;if(f(y*W+x))return true}return false}
function critOK(k,j){if(j<0||j>=W*H)return false;const h=hour(),day=h>=7&&h<17,dry=!S.rain,o=q=>S.obj[q];
  if(k==='fly'||k==='mitsubachi')return h>=7&&h<18&&dry&&FLOWERS.has(o(j))&&!isBud(j);
  if(k==='bird')return h>=6&&h<17&&dry&&critOpen(j)&&[1,-1,W,-W].some(d=>TREES.has(typeAt(j+d)));
  if(k==='risu')return day&&dry&&critOpen(j)&&[1,-1,W,-W].some(d=>TREES.has(typeAt(j+d)));
  if(k==='usagi')return day&&dry&&critOpen(j)&&REV.has(j);
  if(k==='harinezumi')return h>=17&&h<20&&critOpen(j)&&critNear(j,2,q=>o(q)==='berry'||o(q)==='hedge');
  if(k==='nezumi')return day&&critOpen(j)&&critNear(j,2,q=>BOXCAP[o(q)]!=null);
  if(k==='mogura')return WD===3&&day&&critOpen(j)&&critNear(j,2,q=>o(q)==='farm');/* もぐらは土のステージだけ（持ち主のきめ） */
  if(k==='katatsumuri')return S.rain&&h>=6&&h<20&&critOpen(j)&&critNear(j,1,q=>FLOWERS.has(o(q))||WEEDS.has(o(q)));
  if(k==='tentoumushi')return day&&dry&&critOpen(j)&&critNear(j,1,q=>FLOWERS.has(o(q)));
  if(k==='tonbo')return seasonNow()===2&&h>=9&&h<18&&dry&&S.ground[j]===1&&[1,-1,W,-W].some(d=>S.ground[j+d]!==1&&walk(j+d));
  if(k==='hotaru')return h>=19&&h<23&&dry&&critOpen(j)&&[1,-1,W,-W].some(d=>S.ground[j+d]===1);
  if(k==='frog')return (S.rain&&h>=6&&h<20||h>=17&&h<20)&&critOpen(j)&&[1,-1,W,-W].some(d=>S.ground[j+d]===1);
  return false}
function critSpawn(){if(CRIT.length>=CRITMAX||isNight()||enemyLive())return;const [a,b,c,d]=critView(),k=critPick(),m=CK[k].m;if(CRIT.filter(q=>q.k===k).length>=(CK[k].n||1))return;
  for(let n=0;n<40;n++){const x=Math.floor(a+Math.random()*(c-a)),y=Math.floor(b+Math.random()*(d-b)),j=y*W+x;if(x<0||y<0||x>=W||y>=H||!critOK(k,j))continue;
    CRIT.push({id:CRITID++,k,x:x+.5,y:y+.6,hx:x+.5,hy:y+.6,z:m==='fly'?12:m==='hover'?18:m==='drift'?10:0,vx:0,vy:0,face:Math.random()<.5?-1:1,t:0,life:60+Math.random()*60,hop:Math.random()*2,fl:0,ci:Math.floor(Math.random()*4),act:0,ph:0,wait:1+Math.random()*2});/* ci：ちょうの色（4しゅるい） */return}}
/* 地面の生き物がにげる：近いせいれいからはなれる向きへ、はやく。少しして、いなくなる */
function critFlee(c){if(c.fl||!CK[c.k].flee&&c.k!=='bird')return;const r=S.res.find(r=>!r.hidden&&Math.hypot(r.x-c.x,r.y-c.y)<1.6);if(!r)return;
  const L=Math.hypot(c.x-r.x,c.y-r.y)||1;c.fl=1;c.hop=0;critLeave(c,(c.x-r.x)/L,(c.y-r.y)/L)}
/* いなくなるとき：その場で消さず、画面の外へ去る（とぶ物はとんで、地面の物は歩いて・はねて）。見えなくなったら消す（critTick のさいご）。
   行けない所でとまった（3秒）・25秒たっても出られないときだけ、うすくなって消える（fade）。vx,vy をわたせば、その向き（にげる）、なければ近い画面のはしへ */
function critLeave(c,vx,vy){if(vx==null){if(c.go)return;const [a,b,cc,d]=critView(),e=[[c.x-a,-1,0],[cc-c.x,1,0],[c.y-b,0,-1],[d-c.y,0,1]].sort((p,q)=>p[0]-q[0])[0];vx=e[1];vy=e[2]}
  c.go=1;c.gt=c.gt||0;c.stk=0;c.act=0;c.rest=0;c.vx=vx;c.vy=vy;if(Math.abs(vx)>.05)c.face=vx>0?1:-1}
/* 地面の物が、去る向き（行けなければ、少しずらした向き）へ len だけ進めるか。進めたら、その向き */
function critDir(c,len){for(const t of [0,.7,-.7,1.4,-1.4]){const cs=Math.cos(t),sn=Math.sin(t),dx=c.vx*cs-c.vy*sn,dy=c.vx*sn+c.vy*cs,L=Math.hypot(dx,dy)||1;if(critGround(c.x+dx/L*Math.max(len,.3),c.y+dy/L*Math.max(len,.3)))return [dx/L,dy/L]}return null}
function critGo(c,dt,K,m){c.gt+=dt;if(c.fade!=null){c.fade-=dt/.6;return}
  if(m==='fly'||m==='hover'||m==='drift'||m==='bird'){if(m==='bird'){c.fl=1;c.jt=null;c.pre=0}
    const sp=m==='bird'?2.6:m==='hover'?2.4:m==='drift'?.6:1.4;c.x+=c.vx*sp*dt;c.y+=(c.vy-(m==='bird'?.25:0))*sp*dt;c.z=Math.min(m==='bird'?90:30,c.z+(m==='bird'?14:5)*dt);if(Math.abs(c.vx)>.05)c.face=c.vx>0?1:-1}
  else if(m==='walk'){const sp=K.sp*(c.fl?4:2)*dt,o=critDir(c,sp);if(o){c.x+=o[0]*sp;c.y+=o[1]*sp;c.ph+=sp/(c.fl?.08:Math.max(.03,K.sp*.18));c.mv=1;c.stk=0;if(Math.abs(o[0])>.05)c.face=o[0]>0?1:-1}else{c.mv=0;c.stk+=dt}}
  else{/* はねる：かがむ→とぶ→つく を、去る向きへくりかえす */
    if(c.pre>0){c.pre-=dt;if(c.pre<=0)c.jt=0}
    else if(c.jt!=null){c.jt+=dt;const q=Math.min(1,c.jt/.4);c.x=c.jx+(c.nx-c.jx)*q;c.y=c.jy+(c.ny-c.jy)*q;c.z=Math.max(0,Math.sin(q*Math.PI)*(K.hop||.35)*16);if(q>=1){c.jt=null;c.z=0;c.land=.12}}
    else{if(c.land>0)c.land-=dt;if((c.hop-=dt)<=0){c.hop=c.fl?.05:.25+Math.random()*.3;const D=K.hop||.35,o=critDir(c,D);
      if(o){c.jx=c.x;c.jy=c.y;c.nx=c.x+o[0]*D;c.ny=c.y+o[1]*D;if(Math.abs(o[0])>.1)c.face=o[0]>0?1:-1;c.pre=c.fl?.05:.12;c.stk=0}else c.stk+=c.hop}}}
  if(c.stk>3||c.gt>25)c.fade=1}
const critGround=(x,y)=>{const j=(y|0)*W+(x|0);return x>=0&&y>=0&&x<W&&y<H&&walk(j)&&!S.obj[j]&&S.ground[j]!==1};
function critTick(dt){if(!S)return;if(CRITS!==S){CRIT=[];CRITS=S}if(IS_STORY_REPLAY){CRIT=[];return}
  CRITT+=dt;if(CRITT>=2){CRITT=0;critSpawn()}
  const night=isNight();
  for(const c of CRIT){c.t+=dt;const K=CK[c.k],m=K.m;if(c.act>0)c.act-=dt;
    if(m==='walk'||m==='hop'||m==='bird')critFlee(c);if(!c.go&&c.t>=c.life)critLeave(c);if(c.go){critGo(c,dt,K,m);continue}
    if(m==='fly'){/* ちかくの花へ（みつばちは花にとまって、少しやすむ） */
      if(c.rest>0){c.rest-=dt;c.z=Math.max(3,c.z-20*dt);if(c.rest<=0)c.t5=0}
      else{if((c.t5=(c.t5||0)+dt)>5||Math.hypot(c.hx-c.x,c.hy-c.y)<.2){c.t5=0;if(c.k==='mitsubachi'&&Math.hypot(c.hx-c.x,c.hy-c.y)<.2&&Math.random()<.6)c.rest=1.5+Math.random()*2;else{const x0=c.x|0,y0=c.y|0;let ok=false;for(let n=0;n<12;n++){const x=x0+Math.floor(Math.random()*9)-4,y=y0+Math.floor(Math.random()*9)-4,j=y*W+x;if(x>=0&&y>=0&&x<W&&y<H&&FLOWERS.has(S.obj[j])){c.hx=x+.5+(Math.random()-.5)*.7;c.hy=y+.5+(Math.random()-.5)*.5;ok=true;break}}if(!ok){c.hx=x0+.5+(Math.random()-.5)*1.4;c.hy=y0+.5+(Math.random()-.5)*1}}/* 花が見つからなければ、いまの花のまわりを少しとぶ */}
        const dx=c.hx-c.x,dy=c.hy-c.y,L=Math.hypot(dx,dy)||1,sp=Math.min(L,.9*dt);c.x+=dx/L*sp+Math.sin(c.t*3+c.id)*.01;c.y+=dy/L*sp;if(Math.abs(dx)>.05)c.face=dx>0?1:-1;c.z=14+Math.sin(c.t*2.3+c.id)*5}
      if(S.rain||night)c.life=Math.min(c.life,c.t+2)}
    else if(m==='hover'){/* とんぼ：水の上で止まって（ホバリング）、すっと、つぎの所へ */
      if(c.wait>0){c.wait-=dt;c.z=18+Math.sin(c.t*4+c.id)*1.5;if(c.wait<=0){for(let n=0;n<10;n++){const x=c.hx+(Math.random()-.5)*4,y=c.hy+(Math.random()-.5)*3,j=(y|0)*W+(x|0);if(x>=0&&y>=0&&x<W&&y<H&&S.ground[j]===1){c.tx=x;c.ty=y;break}}if(c.tx==null)c.wait=1}}
      else if(c.tx==null)c.wait=.5;
      else{const dx=c.tx-c.x,dy=c.ty-c.y,L=Math.hypot(dx,dy)||1,sp=Math.min(L,2.6*dt);c.x+=dx/L*sp;c.y+=dy/L*sp;if(Math.abs(dx)>.05)c.face=dx>0?1:-1;if(L<.05){c.tx=c.ty=null;c.wait=1.2+Math.random()*2.4}}
      if(S.rain||night)c.life=Math.min(c.life,c.t+2)}
    else if(m==='drift'){/* ほたる：水べを、ゆっくり、ふわふわ */
      if(c.tx==null||Math.hypot(c.tx-c.x,c.ty-c.y)<.1){c.tx=c.hx+(Math.random()-.5)*3;c.ty=c.hy+(Math.random()-.5)*2}
      const dx=c.tx-c.x,dy=c.ty-c.y,L=Math.hypot(dx,dy)||1,sp=Math.min(L,.35*dt);c.x+=dx/L*sp;c.y+=dy/L*sp;if(Math.abs(dx)>.05)c.face=dx>0?1:-1;c.z=10+Math.sin(c.t*1.7+c.id)*4;
      if(S.rain||night||hour()<19)c.life=Math.min(c.life,c.t+2)}
    else if(m==='walk'){/* 歩く：家のまわりの空いた所へ歩いて、止まって、ときどき何かする（にげるときは、はやく） */
      if(c.fl){const sp=K.sp*4*dt;if(critGround(c.x+c.vx*sp,c.y+c.vy*sp)){c.x+=c.vx*sp;c.y+=c.vy*sp}c.ph+=sp/.08;c.mv=1}
      else if(c.tx!=null){const dx=c.tx-c.x,dy=c.ty-c.y,L=Math.hypot(dx,dy),sp=Math.min(L,K.sp*dt);if(L<.02){c.tx=c.ty=null;c.mv=0;c.wait=1+Math.random()*3;if(Math.random()<.4)c.act=1.6}else{c.x+=dx/L*sp;c.y+=dy/L*sp;c.ph+=sp/Math.max(.03,K.sp*.18);c.mv=1;if(Math.abs(dx)>.01)c.face=dx>0?1:-1}}
      else if(c.act<=0&&(c.wait-=dt)<=0){for(let n=0;n<8;n++){const x=c.hx+(Math.random()-.5)*2.4,y=c.hy+(Math.random()-.5)*2;if(critGround(x,y)){c.tx=x;c.ty=y;break}}if(c.tx==null)c.wait=1}
      if(night||c.k!=='katatsumuri'&&S.rain&&c.k!=='nezumi'||c.k==='katatsumuri'&&!S.rain||c.k==='harinezumi'&&hour()>=21)c.life=Math.min(c.life,c.t+1)}
    else{/* はねる（うさぎ・りす・かえる）・小鳥：ぴょんと、となりへ。かがむ→とぶ→つく */
      if(c.pre>0){c.pre-=dt;if(c.pre<=0){c.jt=0}}
      else if(c.jt!=null){c.jt+=dt;const T=m==='bird'?.35:.4,q=Math.min(1,c.jt/T);c.x=c.jx+(c.nx-c.jx)*q;c.y=c.jy+(c.ny-c.jy)*q;c.z=Math.max(0,Math.sin(q*Math.PI)*(m==='bird'?5:K.hop*16));if(q>=1){c.jt=null;c.z=0;c.land=.12}}
      else{if(c.land>0)c.land-=dt;c.hop-=dt;
        if(c.hop<=0&&c.act<=0){c.hop=c.fl?.05:1+Math.random()*2.5;
          if(!c.fl&&m==='hop'&&Math.random()<.3){c.act=1.6;c.hop+=1.6}/* 何かする（耳をぴくぴく・木の実をかじる・のどをふくらます） */
          else{const D=K.hop||.35,o=c.fl?[c.vx,c.vy]:[[1,0],[-1,0],[0,1],[0,-1]][Math.floor(Math.random()*4)],nx=c.x+o[0]*D,ny=c.y+o[1]*D,j=(ny|0)*W+(nx|0);
            if(c.k==='frog'&&S.ground[j]===1&&Math.random()<.25){c.dead=1;fxSpr&&fxSpr('fishsplash',nx*TS,(ny+.1)*TS)}/* 水へとびこむ */
            else if((c.fl||Math.abs(nx-c.hx)<1.2&&Math.abs(ny-c.hy)<1.2)&&critGround(nx,ny)){c.jx=c.x;c.jy=c.y;c.nx=nx;c.ny=ny;if(Math.abs(o[0])>.1)c.face=o[0]>0?1:-1;if(m==='bird')c.jt=0;else c.pre=c.fl?.05:.12}}}}
      if(night||(c.k==='bird'||c.k==='usagi'||c.k==='risu')&&S.rain)c.life=Math.min(c.life,c.t+1)}}
  /* 去っている物は、画面の外に出たら（とぶ高さもふくめて）・うすくなりおわったら消す */
  const [va,vb,vc,vd]=critView();CRIT=CRIT.filter(c=>!c.dead&&!(c.fade!=null&&c.fade<=0)&&!(c.go&&(c.x<va-1||c.x>vc+1||c.y-(c.z||0)/TS<vb-1||c.y>vd+1.5)))}
const critById=id=>CRIT.find(c=>c.id===id)||null;
/* 描く：3Dから写した絵。ちょう・小鳥は tools/art/critter3d/critter3d.py（critfly:<色>#0・1・critbird#0・#f0・#f1）、
   ほかは持ち主のモデルにボーンを入れて写したコマ（crit_build.py：crit<名前>#0・1 止まる・w0〜w3 歩く/はねる/はばたく・e0〜e2 何かする）。
   チップの ax・ay は足もとの点からのずれ（g64のドット）。右向きの絵なので、左を向くときは足もとの点で反転。地面にかげ、とぶ物は z だけ上に */
const CRITE=['e0','e1','e2','e1'];
function critFrame(c,now){const m=CK[c.k].m,br=Math.floor(now/600+c.id)%2?'1':'0';
  if(c.k==='mitsubachi')return c.rest>0?'e'+(Math.floor(now/90)%2):'w'+(Math.floor(now/50)%2);
  if(c.k==='tonbo')return c.wait>0?'e'+(Math.floor(now/60)%2):'w'+(Math.floor(now/45)%2);
  if(c.k==='hotaru')return 'w'+(Math.floor(now/70)%2);
  if(c.act>0)return CRITE[Math.floor((1.6-c.act)/.2)%4];
  if(m==='walk')return c.mv?'w'+(Math.floor(c.ph)%4):br;
  if(c.pre>0)return 'w0';if(c.jt!=null)return c.jt<.2?'w1':'w2';if(c.land>0)return 'w3';return br}
function critChip(c,now){const C=window.CHIPS;if(!C)return null;
  if(c.k==='fly'){const op=Math.floor(now/120+c.id)%2===0;return C['critfly:'+(c.ci||0)+'#'+(op?0:1)]}
  if(c.k==='bird')return C[c.fl?'critbird#f'+(Math.floor(now/90)%2):'critbird#0'];
  return C['crit'+(CK[c.k].ch||c.k)+'#'+critFrame(c,now)]||C['crit'+(CK[c.k].ch||c.k)+'#0']}
function drawCritter(g,c,now){const x=Math.round(c.x*TS),y=Math.round(c.y*TS),z=Math.round(c.z||0)+critPokeZ(c,now),f=c.face<0?-1:1,ch=critChip(c,now),sw=CK[c.k].sw;
  if(c.fade==null||c.fade>0){g.fillStyle='rgba(40,30,20,.18)';g.fillRect(x-(sw>>1),y,sw,2)}
  if(!ch)return;const im=chipImgs(ch,'crit'+c.k)[0];if(!im.ok)return;const sm=g.imageSmoothingEnabled;g.imageSmoothingEnabled=false;g.save();if(c.fade!=null)g.globalAlpha=Math.max(0,c.fade);g.translate(x,y-z);if(f<0)g.scale(-1,1);g.drawImage(im,ch.ax/2,ch.ay/2,ch.w/2,ch.h/2);g.restore();g.imageSmoothingEnabled=sm}
/* ほたるの光：夜の暗さより上に、おしりのドットの光（ゆっくり明るく・暗く）。draw-world.js が暗さのあとでよぶ */
function drawCritGlow(g,now){for(const c of CRIT){if(c.k!=='hotaru')continue;const pq=c.pk?(now-c.pk)/(CRITPK*1000):1,pb=pq>=0&&pq<1?Math.sin(pq*Math.PI):0,a=Math.max(.55+.45*Math.sin(now/520+c.id*1.7),pb);if(a<.15)continue;/* タップすると、ぽっと明るく（pb） */
  const x=Math.round(c.x*TS)-(c.face<0?-3:3),y=Math.round(c.y*TS-(c.z||0))-3;
  liftDraw(uLift(c),()=>{g.globalAlpha=a*.3;g.fillStyle='#d6f27a';g.fillRect(x-2,y-1,4,3);g.fillRect(x-1,y-2,2,5);if(pb>.05){g.globalAlpha=pb*.22;g.fillRect(x-4,y-2,8,5);g.fillRect(x-3,y-3,6,7);g.fillRect(x-2,y-4,4,9)}g.globalAlpha=a;g.fillStyle='#f2ffa8';g.fillRect(x-1,y,2,1);g.globalAlpha=1})}}
/* せいれいが見つけて、見る・追いかける */
function goCritter(r,G){if(!CRIT.length)return false;let best=null,bd=1e9;for(const c of CRIT){if(c.fl||c.go)continue;const d=Math.hypot(c.x-r.x,c.y-r.y);if(d<7&&d<bd){bd=d;best=c}}if(!best)return false;
  const cj=(best.y|0)*W+(best.x|0),st=nearest(G,j=>walk(j)&&!S.obj[j]&&Math.abs(j%W-cj%W)<=2&&Math.abs(((j/W)|0)-((cj/W)|0))<=1&&j!==cj&&!(TAKEN&&TAKEN.has(j)),14);if(st<0)return false;
  startAct(r,G,'critwatch',st,{cid:best.id,k:best.k,dur:16,chase:(r.elem==='wind'||r.elem==='wood')&&best.k==='fly'?2:0});return true}
ACT.critwatch={start(r,a){const c=critById(a.cid);if(c)r.face=c.x>=r.x?1:-1;r.bubble='❗'},
  tick(r,a,dt){const c=critById(a.cid);if(c&&!c.fl)r.face=c.x>=r.x?1:-1;if(a.t>3)r.bubble=c?'🎵':'';
    if(a.chase&&c&&!c.fl&&!c.go&&Math.hypot(c.x-r.x,c.y-r.y)>2.2&&a.t>4){a.chase--;const G=bfs(r.x|0,r.y|0),cj=(c.y|0)*W+(c.x|0),st=nearest(G,j=>walk(j)&&!S.obj[j]&&Math.abs(j%W-cj%W)<=1&&Math.abs(((j/W)|0)-((cj/W)|0))<=1&&j!==cj,10);if(st>=0){r.path=avoidPath(r,G,st);a.stand=st;a.stage='walk';a.t=0}}},
  done:(r,a)=>a.t>=a.dur||!critById(a.cid)&&a.t>2,end(r,a){r.fun=Math.min(100,r.fun+CRITFUN);r.wanderRestUntil=S.t+45;r.bubble=''}};
ACT_LBL.critwatch='小さな生き物を見ている';
/* ---------- タップしたとき（「しらべる」）：その場で反応する・図鑑の「いきもの」に入る ----------
   反応は見た目と音だけ（数字はかえない）：小鳥は飛びたつ・うさぎ/りす/ねずみはにげる・ちょう/みつばちは高くまってべつの花へ・とんぼはべつの所へ・
   かえるは大きくはねる・ほたるは明るく光る・もぐらは土にもぐる・はりねずみ/かたつむり/てんとうむしは何かする。タップした所に名前。
   図鑑は S.critRec（しゅるい→見つけた数。1ぴきは1回だけ数える c.rec） */
const CRITN={fly:'ちょう',mitsubachi:'みつばち',bird:'小鳥',risu:'りす',usagi:'うさぎ',harinezumi:'はりねずみ',nezumi:'ねずみ',mogura:'もぐら',katatsumuri:'かたつむり',tentoumushi:'てんとうむし',tonbo:'とんぼ',hotaru:'ほたる',frog:'かえる'};
const CRITD={fly:'花から花へ、ひらひらとぶ虫。',mitsubachi:'花のみつをあつめる、はたらきものの虫。',bird:'木のそばで、えさをさがす小さな鳥。',risu:'木の実が好きな、しっぽのふさふさした生き物。',
  usagi:'みどりの草地を、ぴょんぴょんはねる生き物。',harinezumi:'夕方、茂みのそばを歩く、せなかがとげとげの生き物。',nezumi:'箱のそばに、こっそりあらわれる小さな生き物。',mogura:'土の中にすむ生き物。',
  katatsumuri:'雨の日に出てくる、からをせおった生き物。',tentoumushi:'赤い羽に点のある、小さな虫。',tonbo:'水の上を、すいすいとぶ虫。',hotaru:'夜のはじめの水べで、おしりが光る虫。',frog:'水べにすむ、よくはねる生き物。'};
const CRITV={bird:'cv_bird',risu:'cv_risu',nezumi:'cv_nezumi',usagi:'cv_usagi',harinezumi:'cv_hari',mogura:'cv_mogura',frog:'cv_frog',mitsubachi:'cv_bee',fly:'cv_bug',tentoumushi:'cv_bug',tonbo:'cv_tonbo',hotaru:'cv_hotaru',katatsumuri:'cv_snail'};/* タップしたときの鳴き声（本物の録音） */
const CRITPK=1.2;/* 反応の見た目の長さ（秒、実時間） */
/* タップした所（マス）にいる生き物。絵の足もとから上へ。いちばん近い物と、そのきょり */
function critTap(px,py){let best=null,bd=1e9;for(const c of CRIT){if(c.dead||c.go||c.fade!=null)continue;const L=(typeof uLift==='function'?uLift(c):0)/TS,cy=c.y-(c.z||0)/TS-L,dx=px-c.x,dy=py-cy;
    if(Math.abs(dx)>.5||dy>.3||dy<-.7)continue;const d=Math.hypot(dx,dy+.2);if(d<bd){bd=d;best=c}}return best?{c:best,d:bd}:null}
function critPoke(c,px,py){const K=CK[c.k],now=performance.now();if(c.pk&&now-c.pk<CRITPK*1000*.6)return;c.pk=now;
  if(!c.rec){c.rec=1;const R=S.critRec||(S.critRec={});R[c.k]=(R[c.k]||0)+1}
  addFloat(c.x,c.y-(c.z||0)/TS-.7,CRITN[c.k]||'','#f4ead2');sfx('crit');if(CRITV[c.k])sfxAt(CRITV[c.k],c.x,c.y);
  const ax=c.x-px,ay=c.y-py,L=Math.hypot(ax,ay),vx=L>.05?ax/L:(Math.random()<.5?-1:1),vy=L>.05?ay/L:0;
  if(c.k==='bird'){c.fl=1;critLeave(c,vx,Math.min(0,vy))}
  else if(K.flee){c.fl=1;c.hop=0;critLeave(c,vx,vy)}
  else if(c.k==='fly'||c.k==='mitsubachi'){c.rest=0;c.t5=99}
  else if(c.k==='tonbo'){c.wait=0}
  else if(c.k==='frog'){c.act=0;c.hop=0}
  else if(c.k==='mogura'){c.go=1;c.gt=0;c.fade=1}
  else if(c.k!=='hotaru'){c.act=1.6;c.tx=c.ty=null;c.mv=0;c.wait=2}
  critDrop(c)}
/* 小鳥はベリー・りすはどんぐり・うさぎはわた毛を、1ぴき1回だけ、50%で1こ落とす（CRITDROP）。落ちた物は、せいれいがどこからでもひろいに行く（tap） */
const CRITDROP={bird:'food:berry',risu:'food:donguri',usagi:'mat:wool'},CRITDROPP=.5;
function critDrop(c){const k=CRITDROP[c.k];if(!k||c.dr)return;c.dr=1;if(Math.random()>=CRITDROPP)return;const n0=(S.drops||[]).length;dropAt(c.x,c.y,k,1);if(!(S.drops&&S.drops.length>n0))return;
  const d=S.drops[S.drops.length-1];d.tap=1;d.cr=1;DROPFX.set(d,{sx:c.x*TS,sy:(c.y-.2)*TS-(c.z||0)-hiAt(d.y*W+d.x)*LIFT,t0:performance.now()})}
/* どんぐりのアイコン（コードのドット絵。もらった絵があれば、かえる） */
const DONGURI=['................','................','.......oo.......','.......wo.......','....oooooooo....','...owwwwwwwwo...','..owwwwwwwwwwo..','..oooooooooooo..','...ohmmmmmmdo...','...ohmmmmmmdo...','...ohmmmmmmdo...','....ohmmmmdo....','....ommmmddo....','.....oddddo.....','......oooo......','................'];
ICONS.donguri=pixURL('food:donguri',DONGURI,'#b9773f');{const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=ICONS.donguri;ICI.donguri=im}
/* 反応の見た目の高さ（ドット）：ちょう・みつばちは高くまう、かえるは大きくはねる、もぐらは少ししずむ */
function critPokeZ(c,now){if(!c.pk)return 0;const q=(now-c.pk)/(CRITPK*1000);if(q<0||q>=1)return 0;
  if(c.k==='fly'||c.k==='mitsubachi')return Math.round(Math.sin(q*Math.PI)*16);
  if(c.k==='frog'){const p=Math.min(1,q/.45);return p<1?Math.round(Math.sin(p*Math.PI)*12):0}
  if(c.k==='mogura')return -Math.round(Math.min(1,q*1.6)*4);return 0}
/* 図鑑の「いきもの」：見つけた生き物だけ（絵は止まっているコマ） */
const CRITICO={};
function critIcon(k){if(CRITICO[k])return CRITICO[k];const C=window.CHIPS;if(!C)return null;const ch=k==='fly'?C['critfly:0#0']:k==='bird'?C['critbird#0']:(C['crit'+(CK[k].ch||k)+'#0']||C['crit'+(CK[k].ch||k)+'#w0']);if(!ch)return null;/* みつばち・とんぼ・ほたるは、とんでいるコマ */
  const im=chipImgs(ch,'crit'+k)[0];if(!im||!im.ok)return null;const n=Math.max(1,Math.floor(120/Math.max(ch.w,ch.h))),cv=document.createElement('canvas');cv.width=cv.height=144;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const w=ch.w*n,h=ch.h*n;g.drawImage(im,Math.round((144-w)/2),Math.round((144-h)/2),w,h);try{CRITICO[k]=cv.toDataURL()}catch(_){CRITICO[k]=null}cv.width=cv.height=0;return CRITICO[k]}
function critZukan(d,add){const R=d.critRec||{};for(const k of CRITKINDS)if(R[k]>0)add(CRITN[k],CRITD[k]+'見つけた数 '+R[k],critIcon(k))}
