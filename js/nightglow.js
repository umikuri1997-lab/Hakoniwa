/* ---------- 夜のたからさがし ----------
   火のせいれいが村にいて、コワイノの来るふつうの夜（オオカゲ・さいごの夜・試練・群れの夜はのぞく）、群れが来たとき（spawnWave の ngSpawn）に、
   村の外の、晴れていて歩いて行ける所に、光るつぶ（S.ng.L：{x,y,t}。t は村からの遠さ 0 近い・1 中くらい・2 遠い）が2〜3こ出る。
   「しらべる」でタップすると（ngTap、印 tk）、たたかうせいれい（isWatch）が、村のまわりのコワイノを追いはらったあとで、ひろいに行く（ngJob・ACT.ngget）。
   ひろったつぶは「夜のたからもの」（ng0〜ng2）になって、頭の上につんで箱へはこぶ（addItem → stowItem の trStow）。
   もちものの「あける」は昼だけ（ngOpen）：宝箱と同じに、タップしてあける（treasureReveal）。中身は遠いほどよい（近い：素材4こ・中くらい：地図の切れはしかおくりもの・遠い：ふしぎなふくろ）。
   朝6時（isNight でなくなったら）に、ひろわなかったつぶは消える。どれも村の外なので、ひろいに行った子はコワイノにねらわれる。 */
const NGNEAR=4,NGMID=9,NGFAR=16,NGFARP=.5,NGT=3,NGMAT=4;/* 村からのマス：4〜8 近い・9〜15 中くらい・16〜 遠い。遠いつぶは半分の夜だけ。ひろう時間3（2分）。近いつぶの素材4こ */
const NGCOL=['#fff1a8','#bfe4ff','#ffc8ee'],NGID=['ng0','ng1','ng2'];/* 光の色で、よさがわかる（字では出さない） */
function ngOK(){return !!(S&&!S.free&&!MEMRUN&&!(typeof NOSAVE!=='undefined'&&NOSAVE)&&!(typeof IS_STORY_REPLAY!=='undefined'&&IS_STORY_REPLAY)&&!(typeof caveOn==='function'&&caveOn()))}
function ngSpawn(){/* spawnWave のおわりによぶ。ふつうの夜だけ */if(!ngOK()||!S.ns||S.ns.boss||S.ns.trial||S.ns.final||S.ns.rush||S.finalNight)return;if(!S.res.some(q=>!q.hidden&&q.elem==='fire'))return;/* 火のせいれいが来るまでは出さない（ひろいに行っても、守れる子がいない） */const d=dayNo();if(S.ng&&S.ng.d===d)return;S.ng={d,L:[]};
  const r0=S.res.find(q=>!q.hidden);if(!r0)return;const G=bfs(r0.x|0,r0.y|0),D=new Int16Array(W*H).fill(-1),Q=[];/* 村からのマスの数（たて・よこ・ななめ） */
  for(let j=0;j<W*H;j++)if(VILL[j]){D[j]=0;Q.push(j)}if(!Q.length)return;
  for(let h=0;h<Q.length;h++){const j=Q[h],x=j%W,y=(j/W)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const k=yy*W+xx;if(D[k]<0){D[k]=D[j]+1;Q.push(k)}}}
  const C=[[],[],[]];for(let j=0;j<W*H;j++){const v=D[j];if(v<NGNEAR||G.dist[j]<0||S.obj[j]||S.ground[j]||!walk(j)||fogAt(j))continue;const x=j%W,y=(j/W)|0;if(x<2||y<2||x>W-3||y>H-3)continue;if((S.drops||[]).some(q=>q.y*W+q.x===j)||S.tx===j)continue;C[v<NGMID?0:v<NGFAR?1:2].push(j)}
  const hk=k=>hash(d*7919+k*131+(S.nights||0));/* 乱数は、日にちからきめる（ほかの乱数の順番をかえない） */
  for(let t=0;t<3;t++){if(!C[t].length||t===2&&hk(9)>=NGFARP)continue;const j=C[t][Math.floor(hk(t)*C[t].length)];S.ng.L.push({x:j%W,y:(j/W)|0,t})}
  if(S.ng.L.length){S.flags.ngSeen=1;later(()=>{if(S&&S.ng&&S.ng.L.length)toast('村の外で、なにかが光っている','good')},2600)}dirty=true}
function ngAt(j){return S&&S.ng?S.ng.L.find(g=>g.y*W+g.x===j):null}
function ngTick(){/* 1秒に1回：朝になったら、ひろわなかったつぶは消える */if(!S||!S.ng||!S.ng.L.length)return;if(!isNight()){S.ng.L=[];dirty=true}}
function ngTap(tx,ty){/* 「しらべる」でタップ。となりのマスまで当たりにする */if(!S||!S.ng||!S.ng.L.length||!isNight())return false;let g=null,bd=9;for(const q of S.ng.L){const dd=Math.max(Math.abs(q.x-tx),Math.abs(q.y-ty));if(dd<=1&&dd<bd){bd=dd;g=q}}if(!g)return false;
  if(g.tk){toast('もう、ひろいに行くよう、たのんである');return true}if(!S.res.some(r=>!r.hidden&&isWatch(r)))return toast('ひろいに行けるせいれいがいません','warn'),true;
  g.tk=1;sfx('seed');addFloat(g.x+.5,g.y,'たのんだ',NGCOL[g.t]);toast('光るつぶを、ひろいに行く','good');dirty=true;return true}
function ngJob(r,G){/* 夜の見回りのかわりに、たのまれたつぶをひろいに行く（村のまわりのコワイノを追いはらってから） */if(!S.ng||!isNight()||r.hunger<250)return false;let best=-1,bd=1e9;
  for(const g of S.ng.L){if(!g.tk)continue;const j=g.y*W+g.x;if(!free('ng'+j,1))continue;const st=G.dist[j]>=0?j:adjOf(j,k=>G.dist[k]>=0&&walk(k));if(st<0)continue;if(G.dist[st]<bd){bd=G.dist[st];best=j}}
  if(best<0)return false;const st=G.dist[best]>=0?best:adjOf(best,k=>G.dist[k]>=0&&walk(k));startAct(r,G,'ngget',st,{key:'ng'+best,obj:best});return true}
ACT.ngget={start(r,a){if(!ngAt(a.obj))return false;r.bubble='';if(a.stand!==a.obj)r.face=(a.obj%W+.5)<r.x?-1:1},tick(r,a,dt){a.h=(a.h||0)+dt;if(a.h>=1){a.h=0;spawnFX(a.obj%W+.5,((a.obj/W)|0)+.5,NGCOL[(ngAt(a.obj)||{t:0}).t])}},done:(r,a)=>a.t>=NGT||!ngAt(a.obj),
  end(r,a){const g=ngAt(a.obj);if(!g||a.t<NGT)return;S.ng.L.splice(S.ng.L.indexOf(g),1);const id=NGID[g.t];if(!(itemBoxOK()&&addItem(r,id,1)))trStow(id,1);
    if(typeof juiceGlowAt==='function')juiceGlowAt(g.x+.5,g.y+.6,g.t);sfx('seed');addFloatG(r.x,r.y,-1.8,'たからもの！',NGCOL[g.t]);toast(r.name+'が「夜のたからもの」をひろった','good');logEv('夜のたからものをひろった');dirty=true}};
ACT_LBL.ngget='光るつぶをひろいに行く';
/* ---- あける ---- */
function ngRoll(t){/* [物,数] */if(t===0){const L=stg().mats;return['mat:'+pick(L),NGMAT]}if(t===1)return Math.random()<.5?['mapPc',1]:[pick(GIFTDROP),1];return['fukuro',1]}
function ngOpen(id){const t=NGID.indexOf(id);if(t<0||!(S[id]>0))return;if(isNight())return toast('あけるのは、朝になってから','warn');S[id]--;const[it,n]=ngRoll(t),items=[],gifts={};sfx('seed');/* 中身は、さきにわたす（とちゅうでとじても、なくならない） */
  if(it.startsWith('mat:')){const k=it.slice(4);S.mat[k]=(S.mat[k]||0)+n;let img='';try{img=ICONS[k]||''}catch(e){}items.push({img,nm:MATN[k]+'×'+n})}
  else if(it==='mapPc'||it==='fukuro'){trStow(it,n);items.push({img:trIco(it),nm:TRNAME[it]+'×'+n})}
  else{giveItem(it,n);gifts[it]=n;items.push({img:iconURL(it),nm:BL[it].name})}
  logEv('夜のたからものをあけた');if(sheet==='inv')renderSheet();
  treasureReveal({ico:trIco(id),taps:FUKUROTAPS[t],tier:t,name:'夜のたからもの',done:'夜のたからものから出てきた',items,rays:1,beam:1,confetti:1,stamp:t>=1?'あたり':null,after:()=>{if(Object.keys(gifts).length)queueItemGift(gifts,'夜のたからものから！');if(sheet==='inv')renderSheet()}})}
/* ---- 絵 ---- */
function ngDraw(now){/* 夜の暗さより上に描く（光って見える）。2点のドットの四角だけ */if(!S||!S.ng||!S.ng.L.length||PHSNAP)return;
  for(const g of S.ng.L){const j=g.y*W+g.x,cx=Math.round((g.x+.5)*TS),cy=Math.round((g.y+.5)*TS-(typeof hiAt==='function'?hiAt(j):0)*LIFT),ph=now/1000*2.4+g.x*.7+g.y*.3,p=.5+.5*Math.sin(ph),col=NGCOL[g.t];ctx.save();standTf(ctx,dpr*cam.z,cx,cy,isoX((g.x+.5)*TS,(g.y+.5)*TS),isoY((g.x+.5)*TS,(g.y+.5)*TS)-isoLv(j)*IQL);/* クォータービュー：その所に立てて */
    ctx.fillStyle=col;for(let k=g.t+1;k>=1;k--){ctx.globalAlpha=(.10+.10*p)/k;const s=4+k*4;ctx.fillRect(cx-s,cy-s,s*2,s*2)}/* まわりの光：遠いつぶほど、ひろい */
    ctx.globalAlpha=.75+.25*p;ctx.fillRect(cx-2,cy-2,4,4);ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(cx-1,cy-1,2,2);
    if(g.t>=1){const a=ph*1.3;for(let i=0;i<g.t*2;i++){const q=a+i*Math.PI/g.t,rr=8+g.t*3;ctx.globalAlpha=.5+.5*Math.sin(ph*2+i);ctx.fillStyle=col;ctx.fillRect(Math.round(cx+Math.cos(q)*rr)-1,Math.round(cy+Math.sin(q)*rr*.6)-1,2,2)}ctx.globalAlpha=1}/* 中くらい・遠いつぶは、まわりを光のつぶがまわる */
    if(g.tk){const b=Math.round(Math.sin(ph*1.5)*2);ctx.fillStyle=col;ctx.globalAlpha=.9;ctx.fillRect(cx-1,cy-16+b,2,4);ctx.fillRect(cx-3,cy-14+b,6,2);ctx.globalAlpha=1}ctx.restore()}/* たのんだつぶには、上に小さな矢じるし */}
/* もちものの絵：光る石（宝の地図と同じ16×16のドット） */
TRPIX.ng0=TRPIX.ng1=TRPIX.ng2=['................','................','.......ww.......','......owwo......','.....ohwmmo.....','....ohhmmmmo....','...ohhmmmmmdo...','...ohmmmmmmdo...','...ohmmmmmmdo...','...ommmmmmmdo...','....ommmmmddo...','.....omdddddo...','......oooooo....','................','................','................'];
TRCOL.ng0=NGCOL[0];TRCOL.ng1=NGCOL[1];TRCOL.ng2=NGCOL[2];
TRNAME.ng0=TRNAME.ng1=TRNAME.ng2='夜のたからもの';TRDESC.ng0=TRDESC.ng1=TRDESC.ng2='あけると、なにかが出てくる。';
for(const k of NGID){if(ICONS[k])continue;ICONS[k]=trIco(k);const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=ICONS[k];ICI[k]=im}
