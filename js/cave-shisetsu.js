'use strict';
/* 7階「力を奪う施設」のしくみ（cave.js のつづき）。設定は STORY.md の「土の谷の大穴とバケモノ」
   ・くい（地図の n）：大穴のふちの3か所で、根に打ちこまれた金もののくい。管で装置につながって、根から自然の力をすいとっている
     タップすると、いちばん近いせいれいが、ひとりでぬく（CVKUIT）。ぬいているあいだ、そのせいれいは、ほかの指示をきかない（cvKuiLock）
     ぬいたくいは、ずっと、ぬけたまま（S.flags.cvKuiB：くいごとのビット）
   ・根の橋（地図の J）：3本ともぬくと、装置が止まって、かれていた根がのびて、北のふち道から、大穴の中の島（下へおりる坂）へ、根の橋がかかる。
     かかるまでは大穴。かかると、北のふち道と同じ高さの床（C.sb。たおれた石像のせなかと同じあつかい）。ずっと橋のまま
   ・ゆりかごのみはり（cave-bake.js の bk_mi）：ぬいていないくいのそばに来たせいれいをねらう（cvPatrol）
   ・炉のふいご（むかしの道具 rel_fuigo）：深い階で、いるだけでへるおなかが CVDEEPF（cave.js）
   たしかめは tools/tests/cave-shisetsu.cjs */
const CVKUIT=4;/* くいを1本ぬく時間（コードの分。ひとりで） */
const cvKuiDone=()=>!!(CV&&CV.kui&&CV.kui.done);
/* 入るとき：くい（n）と、根の橋がかかる所（J）。前にぬいていたら、ぬけたまま */
function cvKuiInit(C){C.kui=null;const L=[...C.ob].filter(([,o])=>o.k==='n').map(([j])=>j).sort((a,b)=>a-b);if(!L.length)return;
  const J=[];for(let y=0;y<CVH;y++)for(let x=0;x<CVW;x++)if(C.F.map[y][x]==='J')J.push(cvJ(x,y));
  const B=S.flags&&S.flags.cvKuiB|0;L.forEach((j,i)=>{const o=C.ob.get(j);o.i=i;if(B>>i&1)o.done=true});
  C.kui={L,J,done:false,grow:null};if(!C.sb)C.sb=new Uint8Array(CVW*CVH);if(L.every(j=>C.ob.get(j).done))cvKuiLay(C)}
/* 根の橋がかかったあと：J のマスが床になる */
function cvKuiLay(C){const K=C.kui;K.done=true;K.grow=null;for(const j of K.J){C.ab[j]=0;C.g[j]=1;C.sb[j]=1}C.shafts=null;for(const c of C.abi||[])c.width=c.height=0;C.abi=C.abp=null}
/* ぬいているせいれい（ほかの指示をきかない） */
const cvKuiLock=a=>!!(a.job&&a.job.k==='kui'&&a.job.on);
/* くいをタップ */
function cvKuiUse(j,o){const C=CV;if(!C.kui||o.done)return;if(C.party.some(a=>a.job&&a.job.k==='kui'&&a.job.j===j))return toast('いま、ぬいています');
  let ba=null,bp=null;for(const a of C.party){if(cvKuiLock(a))continue;const p=cvBfs(cvCell(a),q=>cvAdj(q,j));if(p&&(!bp||p.length<bp.length)){bp=p;ba=a}}if(!ba)return toast('そこへ行けません');
  ba.job={k:'kui',j,t:0,on:false};ba.jq=[];ba.path=bp;ba.mv=false;ba.chase=false;sfx('tap')}
/* 作業：くいをぬく（cvJobTick から。true なら、この作業をあつかった） */
function cvKuiJob(a,J,o,cj,cdt,now){if(J.k!=='kui')return false;const C=CV,K=C.kui,end=()=>{a.job=null;return true};if(!K||o.k!=='n'||o.done)return end();
  if(!cvAdj(cj,J.j)){J.on=false;const p=cvBfs(cj,q=>cvAdj(q,J.j));if(!p)return end();a.path=p;return true}
  cvFace(a,cvX(J.j)-cvX(cj),cvY(J.j)-cvY(cj));J.on=true;a.swing=now;J.t+=cdt*rMul(a.r,'work');a.r.hunger-=CVHUN.work*cdt;
  if(!J.sh||now-J.sh>800){J.sh=now;sfx('creak');cvSpark(cvX(J.j)+.5,cvY(J.j)+.4,'#8a8f96',3)}
  if(J.t<CVKUIT)return true;
  o.done=true;S.flags.cvKuiB=(S.flags.cvKuiB|0)|1<<o.i;sfx('crack');cvSpark(cvX(J.j)+.5,cvY(J.j)+.4,'#9a8a6a',14);a.joyU=now+1400;a.jumpT=now;
  const n=K.L.filter(q=>C.ob.get(q).done).length;
  if(n<K.L.length)toast('くいが、ぬけた（'+n+'/'+K.L.length+'）','good');
  else{K.grow={e:0};sfx('thunder');toast('装置が止まった…','warn')}
  cvHudUpd();return end()}
/* 毎コマ：根がのびて、橋がかかる（洞窟の時間 mv ですすめる） */
const CVKUIGROW=2;/* 根がのびきるまで（秒） */
function cvKuiTick(mv,now){const C=CV,K=C.kui;if(!K||!K.grow)return;K.grow.e+=mv;if(K.grow.e<CVKUIGROW)return;
  cvKuiLay(C);S.flags.cvKuiDone=1;sfx('good');for(const j of K.J)if(hash(j)<.35)cvSpark(cvX(j)+.5,cvY(j)+.5,'#8fd07a',8);
  for(const a of C.party){a.joyU=now+1600;a.jumpT=now;cvReveal(a.x,a.y-CVOY,cvSeeR())}toast('かれていた根がのびて、大穴に橋がかかった','good');cvHudUpd()}
/* ゆりかごのみはりが見はる物：ゆりかご・ぬいていないくい */
const cvMiGuard=o=>!!o&&(o.k==='Y'||o.k==='n'&&!o.done);
/* ---------- 絵（仮のドット絵） ---------- */
/* くい：根のこぶに打ちこまれた金もののくいと、装置へのびる管。ぬいていない根は、かれた灰色。ぬくと、くいは横にたおれ、根の色がもどる */
function cvKuiDraw(o,ox,oy,now){const F=(c,a,b,w,h)=>P4(c,ox+a,oy+b,w,h),dead=!o.done,rt=dead?['#4a4640','#66615a','#7a756c']:['#4a3424','#6a4a30','#8a6440'];
  F('rgba(10,8,6,.35)',ox+3,oy+26,26,3);
  F(rt[0],2,18,28,9);F(rt[1],4,17,24,7);F(rt[2],6,17,10,2);F(rt[0],0,22,8,3);F(rt[0],24,21,8,3);/* 根のこぶ */
  if(!o.done){F('#3a3e44',13,0,6,20);F('#6a7078',14,0,3,20);F('#9aa0a8',14,0,1,20);F('#2a2e32',11,-2,10,4);F('#7a8088',12,-2,8,1);/* くい */
    F('#2e3236',19,6,13,4);F('#5a6068',19,6,13,1);F('#2e3236',28,0,4,10);/* 装置へのびる管 */
    const p=.5+.5*Math.sin(now/260+o.i*2);ctx.globalAlpha=.3+.5*p;F('#c8f0a0',15,4+((now/90+o.i*7)%14|0),2,2);ctx.globalAlpha=1}/* 根から、すいとられていく光 */
  else{F('#3a3e44',4,13,18,4);F('#6a7078',4,13,18,1);F('#2a2e32',20,12,4,6);F('#1a1612',14,17,4,3);/* たおれたくいと、のこった穴 */
    F('#5a8a40',8,15,2,3);F('#7ab050',9,14,1,1);F('#5a8a40',22,16,2,3)}/* 根から芽 */}
/* 根の橋（地面にはる。ゲームの点で1マス）：からみあった根。左右のはしは、根のこぶ */
function cvKuiBridgeDraw(x,y){const C=CV,j=cvJ(x,y),ox=x*TS,oy=(y+CVOY)*TS,K=C.kui,left=!!K&&K.J.includes(j-1)===false,F=(c,a,b,w,h)=>P4(c,ox+a,oy+b,w,h),h=n=>hash((j*11+n*37+7)>>>0);
  F('#4a3424',0,0,TS,TS);F('#6a4a30',left?3:0,2,29,TS-4);
  for(let i=0;i<4;i++){const yy=2+i*7+((h(i)*3)|0);F('#8a6440',0,yy,TS,2);F('#a07a4c',(h(i+4)*20)|0,yy,8,1)}/* からみあう根 */
  F('#3a2818',0,(h(9)*TS)|0,TS,1);if(h(10)<.5)F('#5a8a40',(h(11)*24)|0,(h(12)*24)|0,3,2);/* 新しい芽 */
  F(left?'#3a2818':'#8a6440',left?0:TS-2,0,2,TS)}
/* 手がかり（K）：装置の管の口。どれも根のほうへのびて、はしの1つの前に、ふいごがころがっている */
function cvPipeDraw(ox,oy,end,now){P4('rgba(10,10,12,.3)',ox+2,oy+26,28,3);P4('#2e3236',ox+4,oy+4,24,22);P4('#4c535c',ox+5,oy+5,22,20);P4('#606872',ox+5,oy+5,22,2);/* 装置のかべ */
  P4('#16181c',ox+11,oy+10,10,10);P4('#3a4048',ox+12,oy+11,8,8);P4('#0a0b0e',ox+14,oy+13,4,4);/* 管の口 */P4('#6a4a32',ox+5,oy+22,22,2);
  const p=.5+.5*Math.sin(now/500+ox);ctx.globalAlpha=.25+.3*p;P4('#c8f0a0',ox+15,oy+14,2,2);ctx.globalAlpha=1;
  if(end){P4('#3a2a1c',ox+8,oy+24,14,6);P4('#6a4a30',ox+9,oy+24,12,4);P4('#8a6440',ox+10,oy+24,6,1);P4('#3a3e44',ox+21,oy+26,6,2);P4('#ff9a40',ox+12,oy+27,2,1)}/* ころがった、ふいご */}
