'use strict';
/* 土のステージ：洞窟のいちばんおく（10階「神の創造炉」）のトトの場面（tsuchi.js のつづき。設定は STORY.md の「土のヌシ様（トト）」「土のお話の、折り合いのつかない所」）
   ・目標「洞窟のいちばんおくへ」（tsoku。石の大橋のあと）。10階へ出かけるときは、ハニがかならずいっしょ（tsCaveMust）
   ・まん中の島の、失敗した神（N）の前に、にげたトト（S.ts.totoGone）が、ひとりでうずくまっている（パーティには入らない。cvActorsL で描く）
   ・トトに TSOKNEAR マスまで近づくと会話 → かげのゆりかご（ツチノオオカゲの2回め）が、島への道に出る
   ・ゆりかごは、なかまへ、ゆっくり近づく（TSOKSP）。ふれたせいれいは TSOKSLEEP 秒ねむって動けない（a.tsSleep）。まもりの光を TSOKHIT 回当てると、ねむる（たおさない。負けはない）
   ・ゆりかごは炉のわれめのおくへしずむ → トトが大きなあなぐまにもどる → 根がのびて、底の神とトトをくるむ → そのまま村へかえる
   ・トトは村にもどらない（お墓も、めぶきのしずくもない）。S.ts.totoGone をけして、S.ts.totoRoot（根になった日）をのこす
   ・大きなあなぐまと根は、コードの仮の絵（cvShadeDraw のあとに tsOkuShade）
   たしかめは tools/tests/tsuchi-oku.cjs */
const TSOKFL=9/* 10階 */,TSOKNEAR=6/* トトとの近さ（会話がはじまる） */,TSOKSP=1.0/* ゆりかごの速さ（マス/秒） */,TSOKTOUCH=.9/* ふれる近さ */,TSOKSLEEP=6/* ねむる秒 */,TSOKHIT=5/* まもりの光の回数 */,TSOKBACK=3/* ゆりかごが出る所：トトから南へ */,TSOKSAFE=3/* 目がさめてから、ふれない秒 */;
const tsOkuOn=()=>tsOn()&&!!S.ts.totoGone&&!!S.flags.tsBridge&&!S.ts.totoRoot;
const tsHaniOf=()=>S.res.find(r=>r.name===HANI&&!r.hidden&&!r.coffin)||null;
/* 洞窟に入ったとき（caveEnter）：10階で、目標のあいだなら、島の前にトトを置く */
function tsOkuEnter(C){C.oku=null;if(C.fl!==TSOKFL||!tsOkuOn()||!C.party.some(a=>a.r.name===HANI))return;
  let N=-1,o=null;for(const[j,q]of C.ob)if(q.k==='N'&&q.top){N=j;o=q;break}if(N<0)return;
  const tx=cvX(N)+(o.w>>1),ty=cvY(N)+o.h,j=cvJ(tx,ty),t=S.ts.totoGone;
  const a={r:t,elem:'earth',id:t.id,x:tx+.5,y:ty+.5+CVOY,path:[],face:1,back:true,turn:0,swing:0,fback:true,fatk:0,job:null,jq:[],mv:false,chase:false,rp:0,cj:j,hurtU:0,joyU:0,shockU:0,eatU:0,blowU:0,eatE:'',jumpT:0,tsDroop:1};
  C.oku={a,st:0,hit:0,e:null,big:0,root:0,sink:0}}
const tsOkuActors=C=>C.oku&&!C.oku.big&&C.seen[cvCell(C.oku.a)]?[C.oku.a]:[];
const tsOkuIb=C=>C.party.some(a=>a.r.name===IBUKI);
/* 毎コマ（caveFrame） */
function tsOkuTick(C,mv,now){const K=C.oku;if(!K)return;const t=K.a;
  if(K.st===0){if(!C.party.some(a=>Math.hypot(a.x-t.x,a.y-t.y)<=TSOKNEAR))return;K.st=1;C.focus=null;for(const q of C.party){q.path=[];q.mv=false}
    dialog([[HANI,'……トト。'],[TOTO,'#droop|……来ないで。ぼく、ヌシ様なんかじゃない。'],['？？？','……また、来たの。この子は、やっと、ねむれるところなのに。'],...(tsOkuIb(C)?[[IBUKI,'#alarm|あの影だ！ トト、さがってろ！']]:[])],()=>{if(CV===C)tsOkuSpawn(C)});return}
  if(K.sink&&K.e){K.e.y-=mv*1.5;return}/* 炉のわれめのおく（北）へ */
  if(K.st!==2||!K.e)return;const e=K.e;e.hp=e.max;if(e.stun>0){e.stun-=mv*MIN_PER_SEC;return}
  let tg=null,bd=1e9;for(const a of C.party){if(a.tsImm>0)a.tsImm-=mv;if(a.tsSleep>0||a.tsImm>0)continue;/* 目がさめてから TSOKSAFE 秒は、ふれない */const d=Math.hypot(a.x-e.x,a.y-e.y);if(d<bd){bd=d;tg=a}}if(!tg)return;
  if(bd<=TSOKTOUCH){tg.tsSleep=TSOKSLEEP;tg.tsImm=TSOKSLEEP+TSOKSAFE;tg.path=[];tg.mv=false;tg.chase=false;sfx('tbell');cvSpark(tg.x,tg.y-CVOY,'#8a7a9a',8);if(!C.note.okSleep){C.note.okSleep=1;toast('ゆりかごにふれると、ねむってしまう','warn')}return}
  const v=Math.min(bd,TSOKSP*mv);e.x+=(tg.x-e.x)/bd*v;e.y+=(tg.y-e.y)/bd*v;enAim(e,tg.x,tg.y);C.seen[cvCell(e)]=1}/* 影なので、まっすぐ */
function tsOkuSpawn(C){const K=C.oku,t=K.a,x=t.x,y=t.y+TSOKBACK,D=EN.tsuchi;
  const e={id:C.eid++,type:'tsuchi',x,y,hp:D.hp,max:D.hp,spawned:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:cvJ(x|0,(y-CVOY)|0),tsOku:1};
  C.en.push(e);K.e=e;K.st=2;C.seen[cvCell(e)]=1;cvSpark(x,y-CVOY,'#3a3028',16);sfx('bossIn');toast('まもりの光を、大きな影に当てよう（0/'+TSOKHIT+'）','warn')}
/* まもりの光が当たった（cvLightHit） */
function tsOkuLight(C,e){const K=C.oku;e.hp=e.max;if(!K||K.st!==2)return;K.hit=Math.min(TSOKHIT,K.hit+1);e.stun=gupOf('stun').v[gupLv('stun')];cvSpark(e.x,e.y-CVOY,'#e8c890',10);
  toast('まもりの光が、大きな影に当たった（'+K.hit+'/'+TSOKHIT+'）','good');if(K.hit>=TSOKHIT)tsOkuCalm(C)}
/* ゆりかごがねむる → トトの思い出 → 大きなあなぐま → 根 */
function tsOkuCalm(C){const K=C.oku,e=K.e;K.st=3;C.focus=null;for(const a of C.party){a.path=[];a.mv=false;a.tsSleep=0}shakeScreen('m');
  const go=f=>()=>{if(CV===C)f()},ib=tsOkuIb(C);
  dialog([['？？？','……わすれていれば、こわくなかったのに。'],[TOTO,'……それでも、かえしてほしかった。'],['？？？','……そう。……すこし、ねむるね。']],go(()=>{
    K.sink=performance.now();sfx('tbell');later(go(()=>{C.en=C.en.filter(q=>q!==e);K.e=null;
      dialog([[TOTO,'#droop|ぼくがささえきれなかったから、谷はわれたんだ。'],[HANI,'……われめは、もう、みんなでつないだよ。'],[TOTO,'#think|……ぜんぶ、思い出した。あの夜、ぼく、こわくて、にげたんだ。'],[TOTO,'……でも、もう、にげない。']],go(()=>{
        K.big=performance.now();sfx('sacred');shakeScreen('l');cvSpark(K.a.x,K.a.y-CVOY,'#e8d8b0',24);
        later(go(()=>{sfx('tbell');later(go(()=>{
          dialog([[TOTO,'この子も、つくられただけなんだ。ねむらせてあげなきゃ。'],[TOTO,'ハニ。……ごめんね。'],[HANI,'……。'],[TOTO,'#joy|……へっちゃらだもん。']],go(()=>{
            K.root=performance.now();sfx('crack');shakeScreen('m');
            later(go(()=>{tsOkuRooted();dialog([...(ib?[[IBUKI,'#droop|……トト。……ばかやろう。']]:[]),[HANI,'……かえろう。']],go(()=>caveExit(true)))}),TSOKROOTMS)}))}),900)}),TSOKBIGMS)}))}),TSOKSINKMS)}))}
const TSOKSINKMS=1500,TSOKBIGMS=1800,TSOKROOTMS=2600;
/* トトは根になった（もどらない） */
function tsOkuRooted(){if(!S.ts||S.ts.totoRoot)return;S.ts.totoRoot=dayNo()+1;delete S.ts.totoGone;memo('leaf','トトは、大きなあなぐまにもどって、底の神を根でくるみ、根になった');checkQuest()}
/* ゆりかごのしずむ見た目（tsOokDraw の前）：うすれて、北（炉のわれめ）へ */
function tsOkuAlpha(e,now){const C=CV;if(!C||!C.oku||C.oku.e!==e||!C.oku.sink)return 1;const p=clamp((now-C.oku.sink)/TSOKSINKMS,0,1);return 1-p}
/* 大きなあなぐまと根（cvShadeDraw のあと）。仮の絵 */
function tsOkuShade(o,ox,oy,now){const C=CV,K=C&&C.oku,done=tsOn()&&!!S.ts.totoRoot&&C.fl===TSOKFL;if(!K&&!done)return;const w=o.w*TS,h=o.h*TS,bx=Math.round(ox+w/2),by=Math.round(oy+h+TS*.55);
  const pb=K&&K.big?clamp((now-K.big)/TSOKBIGMS,0,1):done?1:0,pr=K&&K.root?clamp((now-K.root)/TSOKROOTMS,0,1):done?1:0,R=Math.round;
  if(pb>0){const s=.4+.6*pb,col=pr>.6?'#5a4030':'#5c5650',W2=Math.round(22*s),H2=Math.round(13*s);/* 大きなあなぐま（仮の絵）：まるい体・白いすじの顔 */
    ctx.globalAlpha=pb;P4('rgba(0,0,0,.35)',bx-W2,by+H2-3,W2*2,4);for(let yy=0;yy<H2*2;yy+=2){const v=(yy-H2)/H2,ww=Math.round(W2*Math.sqrt(Math.max(0,1-v*v)));P4(col,bx-ww,by-H2+yy,ww*2,2)}
    if(pr<.8){P4('#2a2622',R(bx-6*s),R(by-H2-2*s),R(12*s),R(8*s));P4('#e8e2d6',R(bx-1.5*s),R(by-H2-3*s),R(3*s),R(9*s));P4('#111',R(bx-4*s),R(by-H2+s),2,2);P4('#111',R(bx+3*s),R(by-H2+s),2,2)}
    if(pb<1){ctx.globalAlpha=(1-pb)*.7;P4('#fff4d0',bx-W2-4,by-H2-6,(W2+4)*2,(H2+6)*2)}ctx.globalAlpha=1}
  if(pr>0){const hs=n=>hash((n*37+11)>>>0),n=Math.round(18*pr);/* 根：あなぐまから、底の神へのびる */
    for(let i=0;i<n;i++){let x=bx+(hs(i)-.5)*30,y=by;const tx=ox+hs(i+50)*w,ty=oy-12+hs(i+80)*(h+4),L=Math.round(16*pr);for(let k=0;k<L;k++){P4(k%3?'#6a4a32':'#8a6640',Math.round(x),Math.round(y),3,2);x+=(tx-x)/(L-k);y+=(ty-y)/(L-k)}}}}
