/* ---------- せいれいのゆめ ----------
   朝（morning）、夜にねてから起きたせいれいのうち1人が、30%でゆめを見る（S.dream、1つずつ）。
   - ねがいのゆめ（wish）：まだ村にない、作れる家具のゆめ。その家具が村にできたら、よろこぶ（たのしさ+30）。3日でわすれる。
   - なかよしのゆめ（mate）：なかよしのゆめ。2人のなかよし+3、たのしさ+10。
   - ふしぎなゆめ（sky）：たのしさ+10。
   ゆめの話は、その子とお話しすると聞ける（nowTopic）。せいれいの画面にも出す。 */
const DREAMP=.3,DREAMDAYS=3,DREAMWISH=30,DREAMFUN=10,DREAMBOND=3;
const DREAMSKY=[['ゆうべ、空をとぶゆめを見たんだ。','村が、おもちゃみたいに小さく見えたよ。'],['ゆうべ、雲の上でおひるねするゆめを見たんだ。','#joy|ふわふわで、とっても気持ちよかったよ。'],['ゆうべ、星をあつめるゆめを見たんだ。','ポケットが、きらきらでいっぱいになったよ。'],['ゆうべ、大きな木の上に村があるゆめを見たんだ。','どこまでも、遠くが見えたんだよ。']];
function dreamWishPick(r){/* まだ村にない、いま作れる家具（好きな家具は、こまりごとで聞くので、べつの物） */const like=typeof likeF==='function'?likeF(r):null;
  const L=FURN.filter(id=>{const b=BL[id];return b&&b.kind==='furn'&&!b.offerOnly&&id!==like&&!cnt(id)&&!inv(id)&&recipeKnown(id)&&lvOK(id)&&!(S.orders||[]).some(o=>o.type===id)&&stageItemOK(id)});return L.length?pick(L):null}
function dreamMorning(){if(!S||S.free||IS_STORY_REPLAY)return;const D=S.dream;if(D&&dayNo()-D.day>=DREAMDAYS)S.dream=null;if(S.dream)return;
  const C=S.res.filter(r=>!r.hidden&&(r.wakeStretch||r.act&&r.act.type==='sleep'));/* 夜にねていた子 */if(!C.length||Math.random()>=(S.evDream===dayNo()&&typeof EVDREAMP!=='undefined'?EVDREAMP:DREAMP))return;/* よみきかせの会のつぎの朝は、見こみがふえる */const r=pick(C),m=bestMate(r),f=dreamWishPick(r),q=Math.random();
  let k='sky';if(m&&S.res.includes(m)&&q<.35)k='mate';else if(f&&q<.8)k='wish';
  S.dream={id:r.id,k,day:dayNo(),f:k==='wish'?f:null,m:k==='mate'?m.id:null,sky:k==='sky'?(Math.random()*DREAMSKY.length)|0:null};
  if(k==='mate'){bondAdd(r,m,DREAMBOND,'dream');funAdd(r,DREAMFUN,'dream');funAdd(m,DREAMFUN,'dream')}
  if(k==='sky')funAdd(r,DREAMFUN,'dream');
  r.bubble='💭';S.flags.dreamSeen=1;if(typeof vrecAdd==='function')vrecAdd('dream');toast(r.name+'は、ゆうべ、ゆめを見たみたい','good');logEv(r.name+'がゆめを見た')}
function dreamText(r){const D=S.dream;if(!D||D.id!==r.id)return '';if(D.k==='wish')return BL[D.f]?BL[D.f].name+'のゆめ':'';if(D.k==='mate'){const m=S.res.find(q=>q.id===D.m);return m?m.name+'のゆめ':'なかよしのゆめ'}return 'ふしぎなゆめ'}
function dreamTopic(r){/* お話の話題（1回だけ） */const D=S.dream;if(!D||D.id!==r.id||D.told)return null;D.told=1;
  if(D.k==='wish'&&BL[D.f])return{u:1,L:['ゆうべ、ふしぎなゆめを見たんだ。','村に、'+BL[D.f].name+'があってね。','#joy|みんなで、つかってたんだ。……ほんとうに、あったらいいな。']};
  if(D.k==='mate'){const m=S.res.find(q=>q.id===D.m);if(m)return{u:1,L:['ゆうべ、'+m.name+'のゆめを見たんだ。','#joy|ふたりで、どこまでも歩いていくゆめ。','あとで、会いにいこうかな。']}}
  return{u:1,L:DREAMSKY[D.sky||0]}}
let DRMT=0;function dreamTick(){const D=S&&S.dream;if(!D||D.k!=='wish'||(DRMT=(DRMT+1)%5))return;/* 5秒に1回 */const r=S.res.find(q=>q.id===D.id);if(!r){S.dream=null;return}if(!BL[D.f]||!cnt(D.f))return;
  S.dream=null;funAdd(r,DREAMWISH,'dream');if(!r.hidden){if(typeof juiceDream==='function')juiceDream(r,D.f);/* ゆめのふきだしがはじける */JOYU.set(r,performance.now()+3000);addFloat(r.x,r.y-1.6,'ゆめで見たのと、おなじだ！','#fff3d6');r.bubble='💕'}sfx('good');toast(r.name+'のゆめが、ほんとうになった','good');if(typeof giftVisit==='function'){const gj=giftCell(D.f,r);if(gj>=0)giftVisit(r,gj)}if(typeof letterQ==='function')letterQ(r,'dream',{f:BL[D.f].name});logEv(r.name+'のゆめが、ほんとうになった：'+BL[D.f].name)}
