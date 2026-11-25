'use strict';
/* 6階「忘れられた神殿」のしくみ（cave.js のつづき）。設定は STORY.md の「土の谷の大穴とバケモノ」
   ・大きな石像（地図の G：2×2）：北のふち道の、大穴のきわに立っている。東と西のふち道は切ってあり、坂へ行くには、石像をおしてたおし、せなかを橋にする
     タップすると、パーティのみんな（3人そろって）が石像のうしろ（北がわ）にならんでおす。CVSKPUSH おすと、南へたおれる
     たおれる所（地図の B）は、たおれるまでは大穴。たおれると、北のふち道と同じ高さの床（せなか）。いちど、たおしたら、ずっと、たおれたまま（S.flags.cvSkDown）
   ・光をおがむせきぞう（cave-bake.js の bk_seki、pray）：光をしぼっていないせいれいが CVSKSEE マスより近く（見とおせる所）にいると、よってきてたたく
     しぼると、その場でおがむ（動かない）。おがんでいるのをたたくと起きて、しぼっていても、たたきかえす。CVSKLOST 秒、だれも CVAGGRO マスより近くにいなければ、また、おがむ
     夜の村では、いちばん近い村のあかりへよってきて、その前でおがんで止まる（tsuchi-night.js の tsPrayGoal）
   ・おひさまのかがみ（むかしの道具 rel_kagami）：光をしぼっていないとき、見える広さ CVSEEK・光の絵の半径 CVLIGHTK
   たしかめは tools/tests/cave-shinden.cjs */
const CVSKPUSH=6;/* 石像をおす時間（コードの分。3人でおして） */
const CVSKN=3;/* おすのに、いる人数 */
const CVSKFALL=1.6;/* 石像がたおれる時間（秒） */
const CVSKSEE=7;/* せきぞうが、光をしぼっていないせいれいに気づく広さ（マス） */
const CVSKLOST=5;/* せきぞう：だれもそばにいなくなってから、また、おがむまで（秒） */
const CVSEEK=5.4,CVLIGHTK=5.6;/* おひさまのかがみ：光をしぼっていないときの、見える広さ・光の絵の半径（マス） */
/* 入るとき：石像（G）と、たおれる所（B）。前にたおしていたら、はじめから橋 */
function cvSkInit(C){C.sk=null;C.sb=null;const G=[...C.ob].filter(([,o])=>o.k==='G').map(([j])=>j).sort((a,b)=>a-b);if(!G.length)return;
  const B=[];for(let y=0;y<CVH;y++)for(let x=0;x<CVW;x++)if(C.F.map[y][x]==='B')B.push(cvJ(x,y));
  const o=C.ob.get(G[0]);o.top=true;o.w=2;o.h=2;for(const j of G.slice(1))C.ob.get(j).sub=true;
  const gx=cvX(G[0]),gy=cvY(G[0]),spots=[];for(let x=gx-1;x<=gx+2;x++){const j=cvJ(x,gy-1);if(cvWalk(j))spots.push(j)}/* おす所：石像のうしろ（北がわ）の1列 */
  C.sk={G,B,spots,t:0,fall:null,down:false};C.sb=new Uint8Array(CVW*CVH);
  if(S.flags&&S.flags.cvSkDown)cvSkLay(C)}
/* たおれたあと：石像のマスとたおれる所が、せなか（床）になる */
function cvSkLay(C){const K=C.sk;K.down=true;K.fall=null;for(const j of K.G){C.ob.delete(j);C.g[j]=1;C.sb[j]=1}for(const j of K.B){C.ab[j]=0;C.g[j]=1;C.sb[j]=1}C.shafts=null;for(const c of C.abi||[])c.width=c.height=0;C.abi=C.abp=null}
/* 石像をタップ */
function cvSkUse(j){const C=CV,K=C.sk;if(!K||K.down||K.fall)return;
  if(C.party.length<CVSKN){sfx('creak');return toast(C.party.length<2?'ひとりでは、びくともしない':'ふたりでは、びくともしない')}
  const free=K.spots.slice(),plan=[];for(const a of C.party){let best=null,bq=-1;for(const q of free){const p=cvBfs(cvCell(a),k=>k===q);if(p&&(!best||p.length<best.length)){best=p;bq=q}}if(!best)return toast('石像のうしろへ行けません');free.splice(free.indexOf(bq),1);plan.push([a,best,bq])}
  for(const[a,p,q]of plan){a.job={k:'topple',j,s:q,t:0};a.jq=[];a.path=p;a.mv=false;a.chase=false}sfx('tap')}
/* 作業：石像をおす（cvJobTick から。true なら、この作業をあつかった）。みんながおす所にそろったら、すすむ */
function cvSkJob(a,J,o,cj,cdt,now){if(J.k!=='topple')return false;const C=CV,K=C.sk,end=()=>{a.job=null;return true};if(!K||K.down||K.fall)return end();
  if(cj!==J.s){const p=cvBfs(cj,q=>q===J.s);if(!p)return end();a.path=p;return true}
  cvFace(a,0,1);const N=C.party.filter(q=>q.job&&q.job.k==='topple'&&cvCell(q)===q.job.s&&!q.path.length);J.t=K.t;
  if(N.length<CVSKN||N.length<C.party.length)return true;/* なかまがそろうまで待つ */
  a.r.hunger-=CVHUN.work*cdt;K.t+=cdt*rMul(a.r,'work')/N.length;if(!K.sh||now-K.sh>900){K.sh=now;sfx('crank');cvSpark(cvX(K.G[0])+1,cvY(K.G[0])+1,'#a8a090',4)}
  if(K.t<CVSKPUSH)return true;
  K.fall={e:0};for(const q of C.party)if(q.job&&q.job.k==='topple')q.job=null;sfx('crack');toast('石像が、かたむいた…','warn');return true}
/* 毎コマ：たおれる（洞窟の時間 mv ですすめる） */
function cvSkTick(mv,now){const C=CV,K=C.sk;if(!K||!K.fall)return;K.fall.e+=mv;if(K.fall.e<CVSKFALL)return;
  cvSkLay(C);S.flags.cvSkDown=1;sfx('thunder');sfx('tstone');for(const j of K.B)if(hash(j)<.4)cvSpark(cvX(j)+.5,cvY(j)+.5,'#b8ae98',10);
  for(const a of C.party){a.shockU=now+900;a.jumpT=now;cvReveal(a.x,a.y-CVOY,cvSeeR())}toast('石像がたおれて、大穴に橋がかかった','good');cvHudUpd()}
/* 光をおがむせきぞう：起きているとき（cvFoe から）。true なら、おがんでいる（ほかの動きをしない） */
function cvSkPray(e,mv,now){const C=CV;if(!EN[e.type].pray)return false;const near=C.party.some(a=>Math.hypot(a.x-e.x,a.y-e.y)<CVAGGRO);
  if(near)e.lost=0;else e.lost=(e.lost||0)+mv;if(e.prov&&e.lost>=CVSKLOST)e.prov=0;
  if(C.dim&&!e.prov||!near&&e.lost>=CVSKLOST){e.asleep=true;e.path=[];e.tg=null;e.atk=0;e.nx=-1;if(C.focus===e)C.focus=null;return true}return false}
/* ねむり（おがむ）からさめる広さ・さめるか */
const cvSkWakeR=()=>CVSKSEE;
const cvSkWakeOK=()=>!CV.dim;
/* ---------- 絵（仮のドット絵） ---------- */
/* 立っている石像（立てて描く。2×2のマスのまん中の足もとから、上へ）：おがむ人の大きな像。うしろに、おひさまの輪 */
function cvSkStandDraw(o,ox,oy,now){const C=CV,K=C.sk;let sx=0;if(K&&K.fall){const p=Math.min(1,K.fall.e/CVSKFALL);sx=Math.round(Math.sin(now/40)*2*(1-p));if(p>.6)ctx.globalAlpha=1-(p-.6)/.4}
  const cx=ox+TS+sx,b=oy+2*TS,F=(c,a,y,w,h)=>P4(c,cx+a,b+y,w,h),dk='#5e5a52',md='#8a857a',lt='#aaa597',hi='#c8c3b2';
  P4('rgba(10,8,6,.35)',cx-26,b-6,52,8);
  F(dk,-22,-24,44,24);F(md,-20,-24,38,22);F(lt,-20,-24,38,3);/* 台座 */
  F(dk,-18,-150,36,128);F(md,-16,-150,30,126);F(lt,-16,-150,6,126);for(let i=0;i<5;i++)F(dk,-12+i*6,-110,1,86);/* ひざをついた体と、衣のひだ */
  F(dk,-8,-128,16,26);F(lt,-6,-126,12,22);F(hi,-4,-126,3,20);/* 胸の前で合わせた手 */
  F(dk,-28,-214,56,56);F('#9a9484',-26,-212,52,52);F(md,-20,-206,40,40);/* うしろの、おひさまの輪 */
  F(dk,-12,-196,24,26);F(md,-11,-195,22,24);F(lt,-11,-195,6,24);F('#3a3830',-7,-184,4,2);F('#3a3830',3,-184,4,2);/* 頭・とじた目 */
  F('#4e6a3e',8,-150,6,10);F('#4e6a3e',-18,-60,5,8);F('#3a3428',-2,-90,1,14);F('#3a3428',-1,-77,3,1);/* こけ・ひび */
  ctx.globalAlpha=1}
/* たおれた石像のせなか（地面にはる。ゲームの点で1マス）。北のはしが足もと、南のはしが頭 */
function cvSkBackDraw(x,y){const C=CV,K=C.sk;if(!K)return;const j=cvJ(x,y),ox=x*TS,oy=(y+CVOY)*TS,L=K.G.concat(K.B),y0=Math.min(...L.map(cvY)),y1=Math.max(...L.map(cvY)),i=y-y0,n=y1-y0,left=x===cvX(K.G[0]),F=(c,a,b,w,h)=>P4(c,ox+a,oy+b,w,h);
  F('#7c776c',0,0,TS,TS);F('#8e897c',left?4:0,0,left?28:28,TS);
  if(i>=n-2){/* 頭とおひさまの輪 */F('#9a9484',left?6:0,2,left?26:26,28);F('#6e695e',left?12:0,8,left?20:20,16);if(i===n){F('#5e5a52',left?8:0,26,left?24:24,4)}}
  else if(i<2){/* 足もと：台座のかけら */F('#6a655a',0,0,TS,6);F('#5e5a52',left?2:26,8,4,18)}
  else{for(let k=0;k<4;k++)F('#6e695e',left?6+k*7:k*7,4,1,TS-8);/* 衣のひだ */if(i===((n/2)|0))F('#a8a394',left?20:0,6,left?12:10,18)/* 合わせた手 */}
  if(hash(j*3+1)<.35)F('#5a7a48',(hash(j)*20)|0,(hash(j+7)*20)|0,6,4);/* こけ */
  F(left?'#5e5a52':'#9a9484',left?0:TS-2,0,2,TS)}
/* 光をおがむせきぞう（バケモノ・仮の絵）：ひざをついて、手を合わせた小さな石の像。おがんでいるあいだは、目が光らない */
function cvSkFoeDraw(e,R,D,bob,t){const pray=e.asleep||e.pray,/* 村では e.pray（tsuchi-night.js） */b=pray?0:bob;R('#5e5a52',-8,-24+b,16,24);R(D.col,-7,-23+b,14,22);R('#aaa597',-7,-23+b,3,20);
  R('#5e5a52',-10,-36+b,20,14);R('#9a9484',-9,-35+b,18,12);/* おひさまの輪 */R('#5e5a52',-5,-33+b,10,10);R(D.col,-4,-32+b,8,8);
  R('#aaa597',-2,-18+b,4,7);/* 手 */if(!pray){R(D.eye,-3,-29+b,2,1);R(D.eye,1,-29+b,2,1)}else{R('#3a3830',-3,-29,2,1);R('#3a3830',1,-29,2,1)}
  R('#4e6a3e',3,-10+b,3,3);if(Math.sin(t*2)>.8&&!pray)R('#fff6d0',-1,-38+b,1,1)}
/* 手がかり（K）：こわれた祭壇の、かがみの台。どれもからっぽで、はしの1つだけ、まるいかがみがのこっている */
function cvMirrorDraw(ox,oy,end,now){P4('rgba(20,14,10,.3)',ox+3,oy+26,26,3);P4('#5e5a52',ox+2,oy+18,28,9);P4('#8a857a',ox+2,oy+18,28,2);P4('#4a463e',ox+8,oy+22,2,5);/* 祭壇の石 */
  P4('#6a4a2c',ox+9,oy+2,2,17);P4('#6a4a2c',ox+21,oy+2,2,17);P4('#8a6440',ox+8,oy+2,16,2);/* 木のかがみかけ */
  if(end){const p=.5+.5*Math.sin(now/600);P4('#8a6a3a',ox+10,oy+4,12,12);P4('#c8a860',ox+11,oy+5,10,10);P4('#efe2b0',ox+13,oy+7,5,5);ctx.globalAlpha=.4+.5*p;P4('#fffbe8',ox+14,oy+8,2,2);P4('#fff3c4',ox+6,oy+3,1,1);P4('#fff3c4',ox+25,oy+9,1,1);ctx.globalAlpha=1}
  else{P4('#3a3428',ox+15,oy+4,2,1);P4('#3a3428',ox+14,oy+10,4,1)}/* からっぽ：ひもの切れはし */}
