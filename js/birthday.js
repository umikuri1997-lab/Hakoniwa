'use strict';
/* せいれいの誕生日（birthday.js）
   誕生日：せいれいごとに、1年（4季節×SEASONDAYS 日＝20日）のうちの1日。id からきまるので、しまわない（bdayIdx）。
   前の日（昼）：なかよし（いなければ、ほかの子）が、ピンクの会話で「あしたは〇〇の誕生日」と、ないしょ話（SEV1 にその年のぶんを足す。キー bdy_<id>_<年>）。
   当日：強化のイベントのしくみで、お誕生日会（EVENTS.bday、BDAYAT 時から）。その子の家（ベッド）のそば、なければ神殿のまえに、村にいる子がみんな集まる。
     その日にきまっているイベント（季節の大会など）があれば、そのあと（S.ev の next）。集まれない・暗くなった・コワイノ・時間をすぎた日は、その年はやめる（ほかの日にずらさない）。
     会のあいだ、来た子が1人ずつ、その属性の物をわたす（見た目だけ。BDGIFT）。おわったら、誕生日の子はたのしさ+BDAYFUN、来た子はたのしさ+10（evEnd のぶん）、誕生日の子と来た子のなかよし+BDAYBOND。
   プレイヤー：誕生日の日だけ、お世話のタブに「おいわい」。食べ物を1つえらんでわたす（1日1回 r.care.bday）。好み（foodLike）でよろこびかたがかわり、すき・にがてがわかる（だいすきは prefKnow 'fd'）。
   つぎの朝：誕生日の子から、お礼の手紙（LETTERD.bday）。
   フリーモードでも出る。思い出帳の再生（MEMRUN）では出ない。お墓・旅の子は、その年はしない。 */
const BDAYAT=15,BDAYFUN=20,BDAYBOND=3,BDAYPOP=[5,10,20,30];/* たのしさ：evEnd の+10に BDAYFUN をたして30。おいわい：にがて・ふつう・すき・だいすき */
const BDAYYEAR=()=>SEASONDAYS*4;
function bdayIdx(r){return r&&r.id!=null?Math.floor(hash(((r.id|0)*7919+131)>>>0)*BDAYYEAR()):-1}/* 1年の何日め（0から） */
const bdayYear=d=>Math.floor(Math.max(0,d-1)/BDAYYEAR());
function bdayOn(r,d){return !!r&&bdayIdx(r)===(Math.max(0,d-1)%BDAYYEAR())}/* d の日が誕生日 */
function bdayText(r){const i=bdayIdx(r);if(i<0)return '';return SEASONS[Math.floor(i/SEASONDAYS)]+'の'+(i%SEASONDAYS+1)+'日'}
const bdayToday=r=>bdayOn(r,dayNo());
const bdayOK=r=>!!r&&!r.hidden&&!r.back&&S.res.includes(r);
/* お誕生日会（強化のイベントのしくみにのせる。ひらく画面には出さない） */
EVENTS.bday={n:'お誕生日会',bday:1,d:'誕生日のせいれいのまわりに集まって、お祝いする。',at:BDAYAT,dur:30,pt:0,per:0,gain:{},gainTxt:'',talk:['#joy|おめでとう！','うまれてきてくれて、ありがとう。','#joy|きょうは、とくべつな日だね！','これからも、よろしくね。']};
function bdayMorning(){if(!S||typeof MEMRUN!=='undefined'&&MEMRUN||IS_STORY_REPLAY)return;const d=dayNo();if(d<=1)return;
  for(const r of S.res){if(!bdayOK(r)||!bdayOn(r,d))continue;if(S.res.filter(evHere).length<2)continue;/* お祝いする子がいない */
    const B={id:'bday',day:d,bd:r.id,who:S.res.filter(evHere).map(q=>q.id),paid:{pt:0,food:[]},ph:null};
    if(!S.ev)S.ev=B;else if(S.ev.ph||S.ev.day<=d){let e=S.ev;while(e.next&&e.next.day<=d)e=e.next;B.next=e.next||null;e.next=B}/* きょうのイベントのあと */
    else{B.next=S.ev;S.ev=B}/* あしたからのイベントより先 */
    villageTimeout(()=>{if(S.res.includes(r))toast('きょうは、'+r.name+'の誕生日！','good')},3000);break}}/* 1日に1人（同じ日の子は、その年はおいわいの「おいわい」だけ） */
function bdayChild(E){return E&&E.bd!=null?S.res.find(q=>q.id===E.bd):null}
function bdayStart(E,L,G){/* 集まる所：その子のベッドのそば（家の外）、なければ神殿のまえ。誕生日の子がまん中 */const r=bdayChild(E);if(!r||!bdayOK(r))return false;const b=typeof myBed==='function'?myBed(r):-1,[tx,ty]=evTemple();let cx=tx,cy=ty;if(b>=0){cx=b%W+.5;cy=((b/W)|0)+.5}
  let SL=evSlots(G,cx,cy,L.length,6);if(SL.length<2){SL=evSlots(G,tx,ty,L.length,5);cx=tx;cy=ty}if(SL.length<2)return false;
  E.slot={};const ord=[r,...L.filter(q=>q!==r)];ord.forEach((q,i)=>{if(SL[i]!=null)E.slot[q.id]=SL[i]});const j=E.slot[r.id];E.c=[j%W+.5,((j/W)|0)+.5];return true}
function bdayDrop(E,why){/* その年は、やめる */S.ev=E.next||null;E.ph=null;for(const r of S.res)if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}const r=bdayChild(E);if(why&&r)toast(r.name+'のお誕生日会は、'+why,'warn')}
const BDGIFT={wood:'花たば',earth:'まるい石',fire:'あたたかいパン',water:'きれいな貝',wind:'鳥の羽'};
function bdayGifts(E,P){/* 会がはじまったら、来た子が1人ずつ、わたす（見た目だけ） */const r=bdayChild(E);if(!r)return;let i=0;for(const q of P){if(q===r)continue;const k=i++;villageTimeout(()=>{if(!S.ev||S.ev!==E||!S.res.includes(q)||!S.res.includes(r))return;q.face=r.x<q.x?-1:1;JUMP.set(q,performance.now());addFloat(q.x,q.y-1.5,BDGIFT[q.elem]+'をどうぞ','#fff3d6');villageTimeout(()=>{if(!S.res.includes(r))return;JUMP.set(r,performance.now());JOYU.set(r,performance.now()+1600);fxSpr('hearts',r.x*TS,(r.y-.7)*TS)},700)},1200+k*1800)}}
function bdayEnd(E,P){const r=bdayChild(E);if(!r||!S.res.includes(r))return;r.fun=Math.min(100,r.fun+BDAYFUN);for(const q of P)if(q!==r)bondAdd(r,q,BDAYBOND);
  memo('',r.name+'の誕生日を、みんなでお祝いした');letterQ(r,'bday');villageTimeout(()=>{if(S.res.includes(r))JOYU.set(r,performance.now()+3500)},400)}
/* 前の日のないしょ話（ピンクの会話） */
function bdayEveCast(r){const L=S.res.filter(q=>q!==r&&!q.hidden);if(!L.length)return null;const m=typeof bestMate==='function'?bestMate(r):null,a=m&&L.includes(m)?m:L[0],b=L.find(q=>q!==a)||null;return[a,b]}
function bdayEveLines(r){const c=bdayEveCast(r);if(!c)return[];const[a,b]=c,t=(s,q,i)=>chatTone(s.replace(/@B/g,r.name),q,i);
  if(!b)return[[a.name,t('#shy|あしたは、@Bの誕生日なんだ。こっそり、お祝いのじゅんびをしておこうっと。',a,0)]];
  return[[a.name,t('ねえ、あしたは@Bの誕生日なんだって。',a,0)],[b.name,t('#surprise|ほんと？ じゃあ、みんなでお祝いしよう！',b,1)],[a.name,t('#shy|うん。@Bには、ないしょだよ。',a,2)]]}
function bdayEveTick(){if(!S||typeof MEMRUN!=='undefined'&&MEMRUN||IS_STORY_REPLAY)return;const d=dayNo()+1;
  for(const r of S.res){if(!bdayOK(r)||!bdayOn(r,d))continue;const k='bdy_'+r.id+'_'+bdayYear(d);if((S.sev||{})[k])break;
    if(!SEV1.some(e=>e.k===k))SEV1.push({k,bdy:r.id,at(){const q=S.res.find(o=>o.id===this.bdy);return !!q&&bdayOK(q)&&bdayOn(q,dayNo()+1)&&!isNight()&&S.qStory==null&&!!bdayEveCast(q)},get L(){const q=S.res.find(o=>o.id===this.bdy);return q?bdayEveLines(q):[]}});
    if(WD&&!sevBusy()&&!isNight()){/* 草原は checkSev が出す。ほかの土地は、ここで吹き出しにする */const P=S.sevP||(S.sevP=[]),e=SEV1.find(x=>x.k===k);if(!P.includes(k)&&!(S.sevMiss||{})[k]&&e.at()){const L=sevLines(e.L);if(L&&L.length&&sevAllHere(e)){P.push(k);sevBub()}}}
    break}}
/* プレイヤーの「おいわい」（お世話のタブ） */
function bdayCareBtn(bw,r){if(!bdayToday(r)||r.hidden)return;const d=dayNo(),done=(r.care||{}).bday===d,b=el('<button class="btn pri">おいわい</button>');lackOn(b,done?'きょうは、もうした':S.food<1?'食料が足りません':'');b.onclick=()=>{if(done||S.food<1)return;sfx('tap');bdayPop(r)};bw.appendChild(b)}
function bdayPop(r){const P=pxPop('おいわいをえらぶ'),g=el('<div class="grid"></div>');P.body.appendChild(g);
  const ks=Object.keys(S.fs||{}).filter(k=>S.fs[k]>0&&FOODS[k]).sort((a,b)=>FOODS[a].v-FOODS[b].v||(S.fs[b]-S.fs[a]));if(!ks.length){g.appendChild(nodata('box','食べ物がないよ'));return}
  for(const k of ks){const c=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>'),im=foodIc(k);if(im)c.querySelector('img').src=im;else c.querySelector('img').replaceWith(Object.assign(document.createElement('span'),{className:'stockEmo',innerHTML:pxi('apple')}));c.querySelector('.ct').textContent=S.fs[k];{const kn=k===favDish(r)?(prefKnown(r,'fd')?3:null):(r.fk&&r.fk[k]!=null?r.fk[k]:null);c.querySelector('.nm').textContent=FOODS[k].name+(kn==null?'':'（'+FLNAME[kn]+'）')}
    c.onclick=()=>{if(!(S.fs[k]>0)||!S.res.includes(r)||(r.care||{}).bday===dayNo()){P.close();return}S.fs[k]--;syncFood();(r.care||(r.care={})).bday=dayNo();P.close();closeSheet();bdayGot(r,k)};g.appendChild(c)}}
function bdayGot(r,k){/* うけとって、よろこぶ。好みがわかる */const v=foodLike(r,k),now=performance.now();r.fun=Math.min(100,r.fun+BDAYPOP[v]);
  if(v===3)prefKnow(r,'fd');else if(!(r.fk&&r.fk[k]!=null)){(r.fk||(r.fk={}))[k]=v;if(v!==1)toast(r.name+'の、'+FLNAME[v]+'な食べ物がわかった','good')}
  if(v===0){r.bubble='💦';addFloat(r.x,r.y-1.6,'あ、ありがとう…','#c9d6e8');sfxAt('pat',r.x,r.y)}
  else{JUMP.set(r,now);JOYU.set(r,now+(v>=2?4000:2400));r.bubble='💕';fxSpr('hearts',r.x*TS,(r.y-.7)*TS);addFloat(r.x,r.y-1.6,v===3?'だいすき！ ありがとう！':v===2?'わあ、うれしい！':'ありがとう！','#ffd7e8');sfx(v>=2?'good':'tap')}
  addFloat(r.x,r.y-2.3,'たのしさ+'+BDAYPOP[v],'#ffe7a8');memo('',r.name+'に、誕生日のおいわいをわたした');dirty=true}
/* お礼の手紙 */
LETTERK.bday='誕生日';
LETTERD.bday={'':{
  earth:[['きのうは、お祝いしてくれてありがとう。','みんなの顔を、ひとりずつおぼえているよ。','ぼくの、たからものの1日になったよ。'],['誕生日って、ふしぎな日だね。','いつもの地面が、ふかふかに思えたんだ。','また1年、この村でがんばるね。'],['お祝いの声が、まだ耳にのこってるよ。','ぼく、ここにいていいんだなって思えた。','ほんとうに、ありがとう。']],
  wood:[['きのうは、ありがとう。','みんなのおめでとうが、花みたいにひらいたよ。','ぼくも、もっと大きくそだつね。'],['誕生日に、木の葉がさらさら鳴っていたよ。','いっしょに、お祝いしてくれたのかな。','とっても、うれしい1日だったよ。'],['みんながあつまってくれて、びっくりしたよ。','胸のあたりが、ぽかぽかしたんだ。','これからも、そばにいてね。']],
  water:[['きのうは、お祝いしてくれてありがとう。','うれしくて、すこしなみだが出ちゃった。','水べにうつるぼくも、わらってたよ。'],['誕生日の空は、すんでいてきれいだったね。','みんなの声が、しずかにひびいていたよ。','ずっと、わすれないね。'],['おめでとうって、なんどきいてもうれしいね。','心の中が、すきとおったみたいだよ。','これからも、よろしくね。']],
  fire:[['きのうは、ありがとう！','みんながいてくれて、からだがあつくなったよ。','この1年も、ぼくがみんなをまもるね！'],['誕生日って、こんなにたのしいんだね！','わらいすぎて、おなかがいたいくらいだよ。','また来年も、お祝いしようね！'],['おめでとうの声で、げんきがわいてきたよ。','きのうのぼくは、いちばんあったかかったよ。','ほんとうに、ありがとう！']],
  wind:[['きのうは、ありがとう。','旅をしていたころは、誕生日もひとりだったよ。','ここでむかえられて、うれしかったな。'],['お祝いの声が、風にのってとどいたよ。','空の上まで、ひびいていたかもしれないね。','いい1日を、ありがとう。'],['みんなのおめでとうを、ひとつずつおぼえたよ。','どこへ行っても、きっとわすれないよ。','でも、しばらくはここにいるね。']]}};
