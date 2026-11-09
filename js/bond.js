'use strict';
/* せいれいどうしのなかよし：S.bond（2人の id を小さい順に「a_b」）→ 0〜200。
   ふえる：同じ遊び家具でいっしょに遊ぶ+1・おしゃべり+1.5・同じ食卓でいっしょに食べる+1・同じ夜にいっしょに守る+2.5（1晩1回）。
   60：なかよし（2人のピンクの会話が1回）。120：遊ぶときに、なかよしをさそう。200：3マス以内にいるとはたらく速さ+5%（重複なし）。
   思い出帳の再生（IS_STORY_REPLAY）では、ふやさない。 */
const BOND_TALK=60,BOND_PLAY=120,BOND_MAX=200;
const BOND5=new Set();/* なかよし200の子が3マス以内にいる子（毎秒つくりなおす） */
function bondKey(a,b){return a.id<b.id?a.id+'_'+b.id:b.id+'_'+a.id}
function bondOf(a,b){return a&&b&&a!==b&&S&&S.bond?S.bond[bondKey(a,b)]||0:0}
function bondAdd(a,b,n){if(!S||!a||!b||a===b||IS_STORY_REPLAY)return;const B=S.bond||(S.bond={}),k=bondKey(a,b),v0=B[k]||0,v=Math.min(BOND_MAX,v0+n);if(v===v0)return;B[k]=v;
  if(v0<BOND_TALK&&v>=BOND_TALK){for(const x of[a,b])addFloat(x.x,x.y-1.4,'なかよし！');memo('🤝',a.name+'と'+b.name+'がなかよしになった');logEv(a.name+'と'+b.name+'がなかよしになった');SPOT_POPS.push({bond:[a.name,b.name],pair:[a,b].map(r=>({el:r.elem,vr:r.vr})),state:S});omoiNote(a,b,false)}
  else if(v0<BOND_PLAY&&v>=BOND_PLAY)omoiNote(a,b,true)}
function bondSet(a,b,n){if(bondOf(a,b)<n)bondAdd(a,b,n-bondOf(a,b))}
/* 草原のメイン「なかよしの想い」（omoi）：依頼を受けたあとに、あたらしく「なかよし」になった組だけを数える（S.flags.omoiP）。
   村の子どうしが、もうぜんぶなかよしのときだけ、なかよし120になった組も数える（進めなくならないように） */
function omoiOn(){return !!S&&WD===0&&!S.free&&!IS_STORY_REPLAY&&typeof QUESTS!=='undefined'&&QUESTS[S.quest]?.id==='omoi'&&S.qTalked&&S.qStory==null}
function omoiN(){return (S&&S.flags.omoiP||[]).length}
function omoiAllBonded(){const R=S.res.filter(r=>!r.hidden);for(let i=0;i<R.length;i++)for(let k=i+1;k<R.length;k++)if(bondOf(R[i],R[k])<BOND_TALK)return false;return true}
function omoiNote(a,b,deep){if(!omoiOn())return;const L=S.flags.omoiP||(S.flags.omoiP=[]),k=bondKey(a,b);if(L.length>=3||L.includes(k)||deep&&!omoiAllBonded())return;
  L.push(k);towerGlow(2600);sfx('bush');toast('御神木が、ぽうっと光った（'+L.length+'/3）','good');dirty=true}
/* いちばんなかよしの子（村にいる子だけ）。{q,v} */
function bondBest(r){let q=null,v=0;if(!S||!S.bond)return null;for(const o of S.res){if(o===r)continue;const b=S.bond[bondKey(r,o)]||0;if(b>v){v=b;q=o}}return q?{q,v}:null}
function bondPair(pk){const [a,b]=pk.split('_').map(Number),A=S.res.find(r=>r.id===a),B=S.res.find(r=>r.id===b);return A&&B?[A,B]:null}

/* ---------- なかよし60の会話（2人のピンクの会話。1組に1回） ---------- */
/* 名前のある組：セリフは、その子の言いかたのまま */
const BOND_TALKS={
 'フタバ|ノドカ':[['フタバ','ノドカ、きょうも畑、いっしょに見てまわろうよ！'],['ノドカ','いいよぉ。フタバといると、時間があっというまだねぇ。'],['フタバ','#joy|えへへ。ぼくもね、ノドカのとなりだと、なんだか安心するんだ。'],['ノドカ','#joy|ふふ。じゃあ、これからも、となりにいようねぇ。']],
 'フタバ|ホノ':[['ホノ','おい、フタバ。ゆうべ、家の窓からずっとこっちを見てたろ。'],['フタバ','#surprise|えっ、気づいてたの？'],['ホノ','あたりめえだ。……見ててくれるやつがいると、なんだか力が出るんだよな。'],['フタバ','#joy|じゃあ、こんどの夜も、ずっと見てるね！']],
 'フタバ|アオ':[['アオ','フタバさん、さっきの水まき、一度もこぼしませんでしたね。'],['フタバ','#joy|えへへ、アオに教えてもらった運びかただよ！'],['アオ','#joy|ちゃんとおぼえていてくれたんですね。……なんだか、うれしいです。'],['フタバ','こんどは、ぼくがアオに、花の冠の作りかたを教えてあげる！']],
 'フタバ|フウ':[['フウ','フッ…フタバ、風が、きみの好きな花のにおいを運んできたよ。'],['フタバ','#surprise|ほんと？ どっちから？'],['フウ','日のあたる、あの丘のほうさ。……いっしょに行ってみるかい？'],['フタバ','#joy|行く行く！ フウと歩くと、どこでも楽しいんだ！']],
 'ノドカ|ホノ':[['ホノ','ノドカ、さっき運んでた石、重くなかったか？'],['ノドカ','へいきだよぉ。ホノこそ、ゆうべはおつかれさまぁ。'],['ホノ','#joy|へっ……おまえにそう言われると、つかれがとんでくぜ。'],['ノドカ','ふふ。じゃあ、きょうはいっしょに、ひなたぼっこしようねぇ。']],
 'ノドカ|アオ':[['アオ','ノドカさん、畑の土が、やわらかくなっていますね。'],['ノドカ','アオが水をあげてくれるから、土もよろこんでるんだよぉ。'],['アオ','#joy|土と水で、いっしょに畑をそだてているんですね。'],['ノドカ','そうだねぇ。アオとなら、もっといい畑になるよぉ。']],
 'ノドカ|フウ':[['フウ','ノドカ、きみのそばは、風がやさしくなる気がするよ。'],['ノドカ','そうなのぉ？ ぼくは、のんびりしてるだけだよぉ。'],['フウ','フッ…そののんびりが、いいのさ。'],['ノドカ','#joy|じゃあ、きょうは、いっしょにのんびりしようかぁ。']],
 'ホノ|アオ':[['ホノ','アオ、ゆうべのたき火、しずめてくれたのは、おまえだろ。'],['アオ','はい。風が出てきたので、念のためです。'],['ホノ','……たすかったぜ。おれ、つい火を大きくしちまうからな。'],['アオ','#joy|火と水で、ちょうどいいですね。これからも、よろしくおねがいします。']],
 'ホノ|フウ':[['フウ','ホノ、きみの火は、風にのると、よく燃えるね。'],['ホノ','へっ、おまえの風がいいからだぜ。'],['フウ','フッ…それなら、夜の見まわりも、ふたりで行こうか。'],['ホノ','#joy|おう！ たのもしいぜ。']],
 'アオ|フウ':[['フウ','アオ、池の水面が、きょうはとてもしずかだね。'],['アオ','はい。風がやさしいからだと思います。……フウさんのおかげですね。'],['フウ','フッ…ほめられると、てれるな。'],['アオ','#joy|ふふ。また、いっしょに池をながめましょう。']],
 'ホムラ|シズク':[['ホムラ','シズク、温泉の湯かげん、きょうもばっちりだったよ。'],['シズク','ホムラさんが、まきをくべてくれたからですよ。'],['ホムラ','#joy|へへっ。あんたとなら、どんな仕事も楽しいね。'],['シズク','#joy|わたしもです。これからも、よろしくおねがいしますね。']]
};
/* どの組でも：属性の組ごと。0・1 は ELEM_KEYS の順で前・うしろの子。@0・@1 は名前。言いかたは chatTone で属性に合わせる */
const BOND_GEN={
 'wood|wood':[[0,'@1、いっしょにいると、なんだか日なたにいるみたいだね。'],[1,'うん、ぽかぽかするよね。'],[0,'これからも、いっしょに村をそだてようね！']],
 'wood|earth':[[0,'@1、きのう植えた芽、もう顔を出してたよ！'],[1,'ほんと？ いい土になってきたんだね。'],[0,'@1がたがやしてくれたおかげだよ。ありがとう！']],
 'wood|fire':[[1,'@0、ゆうべは、ちゃんと家にいたよね？'],[0,'うん。@1が守ってくれるから、安心してねむれるよ。'],[1,'えへへ、まかせといて！']],
 'wood|water':[[0,'@1、畑の花が、きょうはとっても元気なんだ。'],[1,'水をたっぷりあげたからかな。'],[0,'いっしょに世話すると、花もうれしそうだね！']],
 'wood|wind':[[1,'@0、風にのって、花のたねが遠くまでとんでいったよ。'],[0,'すごい！ どこかで、新しい花がさくかな。'],[1,'こんど、いっしょに見にいこうよ。']],
 'earth|earth':[[0,'@1、この岩のそば、ひんやりして気持ちいいね。'],[1,'うん。ここで、ひと休みしようか。'],[0,'ふたりでいると、時間がゆっくりになるね。']],
 'earth|fire':[[1,'@0、ゆうべたたかれた壁、こわれなかったよ。'],[0,'よかった。なおしておいてよかったね。'],[1,'いっしょに村を守ってるんだね。']],
 'earth|water':[[0,'@1が水をくれると、土がふかふかになるよ。'],[1,'ほんと？ 土のにおいが、いいにおいだね。'],[0,'いっしょに、いい畑にしようね。']],
 'earth|wind':[[1,'@0、きょうは、どこまで風がとどいたと思う？'],[0,'村のはしっこまで、かな。'],[1,'正解！ こんど、いっしょに歩いてみようよ。']],
 'fire|fire':[[0,'@1、ゆうべの見まわり、たのもしかったよ。'],[1,'@0こそ！ ふたりなら、こわくないね。'],[0,'こんどの夜も、いっしょにがんばろうね！']],
 'fire|water':[[0,'@1、さっき、火の粉をしずめてくれて、ありがとう。'],[1,'どういたしまして。けがはなかった？'],[0,'うん！ @1がいると、安心だよ。']],
 'fire|wind':[[1,'@0、たき火の火が、風でゆらゆらしてたね。'],[0,'うん。きれいだったよね。'],[1,'こんど、いっしょにたき火をかこもうよ。']],
 'water|water':[[0,'@1、池の水、きょうはすきとおってるね。'],[1,'ほんとだ。空がうつってるよ。'],[0,'いっしょにながめると、もっときれいに見えるね。']],
 'water|wind':[[0,'@1、さっきの雨、もうやんだね。'],[1,'風が雲を運んでいったからね。'],[0,'@1のおかげで、お日さまが出てきたよ。']],
 'wind|wind':[[0,'@1、きょうの風は、どこから来たと思う？'],[1,'山のほうかな。すこし、つめたいね。'],[0,'いっしょに、風のくる道をさがしにいこうよ。']]
};
function bondLines(pk){const p=bondPair(pk);if(!p)return [];const [a,b]=p,nk=BOND_TALKS[a.name+'|'+b.name]||BOND_TALKS[b.name+'|'+a.name];if(nk)return nk.map(l=>[l[0],l[1]]);
  const o=ELEM_KEYS.indexOf(a.elem)<=ELEM_KEYS.indexOf(b.elem)?[a,b]:[b,a],G=BOND_GEN[o[0].elem+'|'+o[1].elem];if(!G)return [];
  return G.map((l,i)=>{const sp=o[l[0]];return [sp.name,chatTone(l[1].replace(/@0/g,o[0].name).replace(/@1/g,o[1].name),sp,i)]})}
/* ピンクの会話（SEV1）に、なかよし60になった組の会話を足す。キーは「bd_a_b」 */
function bondSevEntry(pk){const k='bd_'+pk;if(SEV1.some(e=>e.k===k))return;SEV1.push({k,bd:pk,at(){const p=bondPair(this.bd);return !!p&&bondOf(p[0],p[1])>=BOND_TALK&&!p[0].hidden&&!p[1].hidden&&S.qStory==null},get L(){return bondLines(this.bd)}})}
function bondTalkTick(){if(!S||!S.bond)return;const D=S.sev||{};for(const pk in S.bond)if(S.bond[pk]>=BOND_TALK&&!D['bd_'+pk])bondSevEntry(pk);
  if(!WD||sevBusy()||isNight()||(S.sevQuietUntil||0)>S.t)return;/* 草原は checkSev が出す。ほかの土地は、なかよしの会話だけここで出す */
  const P=S.sevP||(S.sevP=[]),M=S.sevMiss||{};if(!P.some(k=>/^bd_/.test(k)))for(const e of SEV1){if(!e.bd||D[e.k]||M[e.k]||P.includes(e.k)||!e.at())continue;const L=sevLines(e.L);if(L&&L.length&&sevAllHere(e)){P.push(e.k);break}}
  sevBub()}

/* ---------- 同じ夜にいっしょに守る（見張り台・夜の見まわり・こもれびのまもりについて行く） ---------- */
const BOND_DEF=new Set(['watchpost','patrol','follow']);
function bondNightTick(){if(!isNight()||!S.enemyOn)return;const n=dayNo()-(hour()<12?1:0),D=S.bondDef&&S.bondDef.n===n?S.bondDef:(S.bondDef={n,ids:[]});
  for(const r of S.res){if(r.hidden||!r.act||!BOND_DEF.has(r.act.type)||D.ids.includes(r.id))continue;for(const id of D.ids){const q=S.res.find(x=>x.id===id);if(q)bondAdd(r,q,2.5)}D.ids.push(r.id)}}
/* ---------- なかよし200：3マス以内ではたらく速さ+5% ---------- */
function bondNearTick(){BOND5.clear();if(!S.bond)return;for(const pk in S.bond){if(S.bond[pk]<BOND_MAX)continue;const p=bondPair(pk);if(!p||p[0].hidden||p[1].hidden)continue;if(Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)<=3){BOND5.add(p[0]);BOND5.add(p[1])}}}
function bondTick(){if(!S||IS_STORY_REPLAY)return;bondNightTick();bondNearTick();bondTalkTick()}

/* ---------- いっしょに遊ぶ ---------- */
/* 同じ遊び家具で遊びはじめたら、先に遊んでいる子と+2（1回の遊びで1回） */
function bondPlayStart(r,a){if(a.bd||a.obj==null)return;a.bd=1;for(const q of S.res)if(q!==r&&q.act&&q.act.type==='play'&&q.act.stage==='do'&&q.act.obj===a.obj)bondAdd(r,q,1)}
/* なかよし120：遊びに行くとき、ひまにしているなかよしをさそう */
function bondInvite(r,o){if(!S||isNight()||!o||o.obj==null||(r.bdInv||0)>S.t)return false;const bb=bondBest(r);if(!bb||bb.v<BOND_PLAY)return false;const f=bb.q,p=BL[o.what]&&BL[o.what].play;
  if(!p||!free(o.key,p.cap)||f.hidden||!f.act||!['idle','wander'].includes(f.act.type)||f.fun>=100||f.hunger<50||hungry(f)||f.energy<25||onHold(f)||HOLD.has(f.id)||storyCalled(f)||carryN(f)>0||f.meal||toyTired(f,o.obj))return false;
  const G=bfs(f.x|0,f.y|0),mine=r.act&&r.act.stand;let st=-1;if(o.what==='swing'){if(G.dist[o.obj]>=0)st=o.obj}else st=nearest(G,k=>k!==mine&&walk(k)&&adjOf(k,t=>anc(t)===o.obj)>=0,45);if(st<0)return false;
  const ng=(NIGATE[f.elem]||{})[o.what];r.bdInv=S.t+120;endAct(f);startAct(f,G,'play',st,Object.assign({},o,{fun:ng!=null?ng:p.fun,nig:ng!=null,inv:r.id}));
  addFloat(r.x,r.y-1.4,'いっしょにあそぼう！');f.bubble='♪';return true}

/* ---------- 村をあんないする（えらぶ場面 guide でえらばれた子が、新しい子をつれて村をまわる） ----------
   S.tour={g:あんないする子のid,w:ついていく子のid,i:いまの場所,at:はじめた時刻}。場所は 畑・食料箱・池・家・切り株・神殿 のうち、ある物だけ。
   あんないする子は、つぎの場所へ歩いて、着いたらその物のほうを向いて手をふる（ついていく子が来るまで待つ）。ついていく子は、あとをついて歩く。
   夜・コワイノ・どちらかがいない・ながく進まないときは、やめる。 */
const TOUR_KINDS=['farm','stor','water','house','stump','statue'],TOUR_STOP=12,TOUR_LIMIT=500;
function tourStart(g,w){if(!S||IS_STORY_REPLAY||!g||!w||g===w)return;S.tour={g:g.id,w:w.id,i:0,at:S.t};for(const r of[g,w])if(r.act&&!URGNO.includes(r.act.type))endAct(r)}
function tourPair(){const T=S&&S.tour;if(!T)return null;const g=S.res.find(r=>r.id===T.g&&!r.hidden),w=S.res.find(r=>r.id===T.w&&!r.hidden);if(!g||!w||isNight()||S.t-T.at>TOUR_LIMIT||S.enemies.some(e=>e.spawned&&!e.dead)){delete S.tour;return null}return {T,g,w}}
function tourTarget(k){const isO=id=>q=>S.obj[q]===id||S.obj[q]==='part'&&S.obj[S.ref[q]]===id;
  if(k==='farm')return {pred:j=>adjOf(j,isO('farm'))>=0,look:j=>adjOf(j,isO('farm'))};
  if(k==='water')return {pred:j=>VILL[j]&&adjOf(j,q=>S.ground[q]===1)>=0,look:j=>adjOf(j,q=>S.ground[q]===1)};
  if(k==='stor')return {pred:j=>adjOf(j,isO('stor'))>=0,look:j=>adjOf(j,isO('stor'))};
  if(k==='house'){const out=insideSet();return {pred:j=>out[j]&&adjOf(j,q=>HOME_DOORS.has(S.obj[q]))>=0,look:j=>adjOf(j,q=>HOME_DOORS.has(S.obj[q]))}}
  if(k==='statue')return {pred:j=>adjOf(j,isO('statue'))>=0,look:j=>adjOf(j,isO('statue'))};
  if(k==='stump'&&S.sacredRoot!=null){const tx=storyTreeX(S.sacredRoot),ty=storyTreeY(S.sacredRoot);return {pred:j=>{const d=Math.hypot(j%W+.5-tx,((j/W)|0)+.5-ty);return d>2.4&&d<3.4},look:()=>Math.floor(ty)*W+Math.floor(tx)}}
  return null}
/* せいれいの行動をきめるときによぶ。あんないをしたら true */
function tourTick(r,G){const P=tourPair();if(!P||r.hunger<40)return false;const {T,g,w}=P;
  if(r===g){while(T.i<TOUR_KINDS.length){const tg=tourTarget(TOUR_KINDS[T.i]);const j=tg?nearest(G,j=>walk(j)&&tg.pred(j)&&Math.hypot(j%W+.5-r.x,((j/W)|0)+.5-r.y)>=3,80):-1;if(j>=0){const lk=tg.look(j);startAct(r,G,'tourgo',j,{dur:TOUR_STOP,look:lk});return true}T.i++}
    delete S.tour;JUMP.set(g,performance.now());JOYU.set(g,performance.now()+1500);if(Math.hypot(w.x-g.x,w.y-g.y)<4){JUMP.set(w,performance.now());JOYU.set(w,performance.now()+1500)}bondAdd(g,w,1.5);return false}/* さいごまで見せたら、ふたりでよろこぶ */
  if(r===w){const here=(r.y|0)*W+(r.x|0);if(Math.hypot(g.x-r.x,g.y-r.y)<=1.8){startAct(r,G,'tourf',here,{tg:g.id});return true}
    let q=-1,bd=1e9;for(let k=0;k<W*H;k++){const d=G.dist[k];if(d<0||d>60||!walk(k))continue;const h=Math.hypot(k%W+.5-g.x,((k/W)|0)+.5-g.y);if(h<.9||h>1.8)continue;if(d<bd){bd=d;q=k}}
    if(q>=0){startAct(r,G,'tourf',q,{tg:g.id});return true}}
  return false}
function tourFace(r,j){if(j!=null&&j>=0)r.face=j%W+.5>=r.x?1:-1}
