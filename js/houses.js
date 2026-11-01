'use strict';
/* ---------- 家と屋根 ---------- */
const houseRes=h=>S.res.filter(r=>h.set.has((r.y|0)*W+(r.x|0)));
const COMFMAX=300;// 住み心地の上限
// 住み心地（0〜300）：ベッド・家具・床・人数で決まる。高いとよく眠れて、低いとたのしさが下がる
const COMFR={rockart:1,jar:1,torch:1,clover:1,bellf:1,salvia:1,lily:1,lotus:1,lamp:2,vane:2};/* 家の外でも住み心地に入る範囲（マス） */
const COMFY={kabedougu:3,taru:3,asabukuro:3,makidana:3,kabebukuro:3,takebench:5,takeakari:5,andon:5,shishiodoshi:6,hoshirug:5,mimamori:6,yomawari:6,oyasumi:8,yonaka:10,toro:6,stool:2,stable:4,pouf:3,achair:5,ltable:5,rug1:5,sofa1:6,rug2:6,tub:3,sink:4,crate:6,monstera:10,shelf1:12,wreath:10,curtain1:10,cabinet:12,paint2:10,shelf2:13,curtain2:10,paint3:10,wshelf:12,paint1:14,bathtub:16,candle:3,lantern:5,flamp:6,window:5,bed:10,table:8,chair:4,oven:6,lamp:6,torch:4,bench:5,jar:5,rockart:5,chochin:6,furin:8,ema:8,komainu:10,kadomatsu:10,vane:4,clover:4,bellf:4,salvia:4,lily:4,lotus:4,stor:3,mbox:3};
function houseComfort(h){let bed=0,furn=0,fl=0,n=0;const seen=new Set();
  const kc={};for(const j of h.inside){n++;if(S.floor[j])fl++;const o=S.obj[j];if(!o)continue;if(BEDSET.has(o)){bed++;continue}/* ベッド（よぞらのベッドも）は数だけ */if(!COMFY[o])continue;{kc[o]=(kc[o]||0)+1;furn+=COMFY[o]*(kc[o]>2?.5:1);seen.add(o)}}/* 同じ家具は2つまで。3つ目からは半分 */
  for(const o of rugsIn(h.inside)){if(!COMFY[o])continue;kc[o]=(kc[o]||0)+1;furn+=COMFY[o]*(kc[o]>2?.5:1);seen.add(o)}/* ラグ（家の中に1マスでもかかっていれば） */
  {const M=2;for(let y=h.y0-M;y<=h.y1+M;y++)for(let x=h.x0-M;x<=h.x1+M;x++){if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(h.set.has(j))continue;const o=S.obj[j],rg=COMFR[o];if(!rg||!COMFY[o])continue;const d=Math.max(h.x0-x,x-h.x1,h.y0-y,y-h.y1,0);if(d>rg)continue;kc[o]=(kc[o]||0)+1;furn+=COMFY[o]*(kc[o]>2?.5:1);seen.add(o)}}/* かざりは、家のそば（ものごとの範囲）にあっても住み心地に入る */
  {let wn=0;for(const j of h.set)if(S.win&&(S.win[j]===1||S.win[j]==='curtain1'||S.win[j]==='curtain2'))wn++;/* カーテンの下にも窓がある */if(wn){furn+=COMFY.window*Math.min(wn,2)+COMFY.window*.5*Math.max(0,wn-2);seen.add('window')}}/* 窓 */
  for(const j of h.set){const p=S.win&&S.win[j];if(p&&p!==1&&COMFY[p]){kc[p]=(kc[p]||0)+1;furn+=COMFY[p]*(kc[p]>2?.5:1);seen.add(p)}}/* 壁にかけた絵 */
  const cap=houseCap(h),over=Math.max(0,bed-cap);/* きゅうくつかどうかは、ベッドの数で決まる */
  let lit=false;for(let y=h.y0-1;y<=h.y1+1&&!lit;y++)for(let x=h.x0-1;x<=h.x1+1;x++){if(x<0||y<0||x>=W||y>=H)continue;if(LIGHTF.has(S.obj[y*W+x])){lit=true;break}}/* 家の中か、すぐそばに灯り */
  let rs=0;for(const k of['shosai','living'])if(SPOTI.some(t=>t.sp.k===k&&h.inside.has(t.j)&&t.sp.need.every((nd,i)=>t.found[i].filter(q=>h.inside.has(q)).length>=nd[1])))rs++;/* そろった物が、ぜんぶその家の中にあるときだけ *//* しょさい・リビング：住み心地+5% */
  const v=Math.round(Math.max(0,Math.min(COMFMAX,(15+Math.min(210,furn)+(n?fl/n:0)*45-over*105-(lit?0:60))*(1+.05*rs))));/* 上限は300 */
  return{v,bed,cap,lit,kinds:seen.size,floorPct:n?Math.round(fl/n*100):0,over}}



const LIGHTF=new Set(['torch','lamp','lantern','candle','flamp','yomawari','toro','takeakari','andon']);/* 灯りになる家具 */
// すきな家具：その家具が家にあると、そのせいれいにとっての住み心地が上がる（名前から決まる）
const LIKEF=['rockart','jar','vane','bench','table','torch','candle','lantern','sofa1','achair','rug1','monstera','shelf1','paint1','curtain1','birdbath','parasol','stool','pouf'];
/* 新しいせいれいが来たときのひとこと。性格：木=げんき・土=のんびり・火=らんぼう（あねご／あにき）・水=知的・風=キザ・高貴 */
const HELLO={wood:["#wave|やっほー！ $だよ！ よろしくね！", "#wave|わーい、緑のにおいがする！ $だよ、よろしく！", "はじめまして、$だよ！ いっぱい植えるね！", "来たよー！ $っていうんだ。なにしてあそぶ？", "$、ただいま到着！ 今日からここのせいれいだよ！", "#surprise|わあ、ひろーい！ $だよ、走りまわってもいい？", "#wave|こんにちは！ $だよ。お花、いっぱい咲かせようね！", "$だよ！ 元気だけは、だれにも負けないよ！", "#wave|ねえねえ、ここが新しいおうち？ $だよ、よろしくね！", "$参上！ 木も花も、ぼくにおまかせ！"],
 earth:["#surprise wave|ふわぁ…。$だよぉ。よろしくねぇ。", "ここ、土があったかいねぇ。$だよぉ、のんびりいこうねぇ。", "#wave|あわてない、あわてない…。$だよぉ、よろしくねぇ。", "$だよぉ。…ちょっとお昼寝してから、はたらくねぇ。", "いい土のにおいだねぇ。$っていうんだぁ。", "ゆっくり来たら、おそくなっちゃったぁ。$だよぉ。", "$だよぉ。畑のことなら、まかせてねぇ。", "ふぅ…ついたぁ。$だよぉ。ここ、落ち着くねぇ。", "#wave|おひさまがきもちいいねぇ。$だよぉ、よろしくねぇ。", "$だよぉ。みんなで、のんびりやろうねぇ。"],
 fireA:["#alarm|あたしは$！ 「コワイノ」なんざ、ぶっとばしてやるよ！", "へえ、いい村じゃないか。$だよ、夜はあたしにまかせときな！", "$だ！ ぐずぐずしてると、置いてくよ！", "$だよ。あたしが来たからには、もう安心しな！", "ちょいと、寒いねここは。$だ、あっためてやるよ！", "$さ。弱いせいれいをいじめるやつは、あたしがゆるさないよ！", "#wave|あんたが守り神かい？ $だ、よろしく頼むよ！", "$だ！ ケンカも料理も、あたしにまかせな！", "#alarm|ふん、「コワイノ」が出るって？ $が相手してやるよ！", "$だよ。めんどうはまとめて見てやるから、ついてきな！"],
 fireB:["#alarm|おう、$だ！ 「コワイノ」が出たら、おれがぶっとばしてやる！", "#wave|へっ、おれが来たからには安心しな！ $だ、よろしくな！", "$だ！ ケンカなら、いつでも買ってやるぜ！", "$だ。夜の見回りは、おれにまかせとけ！", "#wave|おう、守り神！ $だ、よろしく頼むぜ！", "$さまのお出ましだ！ さっさと仕事をよこしな！", "へっ、しけた村だな。$が、もりあげてやるよ！", "$だ！ 弱っちいやつは、おれがまもってやる！", "#alarm|「コワイノ」？ 上等だ。$が全部たいらげてやる！", "$だ！ 腹がへったら、おれがなんか焼いてやるよ！"],
 water:["はじめまして、$です。この土地の水の流れ、興味深いですね。", "$です。水やりの効率なら、わたしにおまかせください。", "#nod wave|なるほど、ここが…。$です。よろしくおねがいします。", "$と申します。まずは、この土地の水場を調べさせてください。", "#wave|こんにちは、$です。畑の水分量が、少し気になりますね。", "$です。計算どおりなら、ここはもっと豊かになりますよ。", "#sigh|はじめまして。$です。知りたいことがあれば、なんでもどうぞ。", "$です。水は、命の源ですからね。大切に使いましょう。", "#wave|ふむ、空気が乾いていますね。$です、よろしくおねがいします。", "$です。この村の記録、あとで読ませてもらえますか？"],
 wind:["お初にお目にかかります、守り神さま。風の$と申します。", "やあ、いい風が吹いているね。$だ。以後、お見知りおきを。", "風にさそわれて参りました。$です。この村に、さわやかな風をとどけましょう。", "ごきげんよう。$と申します。どうぞよしなに。", "$です。遠い空から、まいりました。", "この丘を渡る風は、なかなか上品ですね。$と申します。", "#joy|ようこそ、ではなく…お招きありがとう、かな。$だよ。", "$です。ふしぎな種を見つけたら、真っ先にお届けしましょう。", "#wave|風のうわさで、ここを知りました。$です、よろしく。", "$と申します。この村の空、わたしが守りましょう。"]};
const BACKL={wood:["#joy|ふっかつ！ また会えてうれしいよ！", "わーい、もどってこられた！ またいっぱい遊ぼうね！", "#joy|守り神さまが呼んでくれたんだね！ ありがとう！", "もどってきたよ！ やっぱりここが大好き！", "また会えたね！ 今度は気をつけるよ！"],earth:["#surprise|ふわぁ…ながーいお昼寝してたみたいだねぇ。", "#joy|また呼んでくれたんだぁ。ありがとうねぇ。", "#wave|もどってこられたよぉ。のんびり、またよろしくねぇ。", "ん…ここは…。あぁ、みんなのところだねぇ。", "#joy|またみんなに会えて、うれしいなぁ。"],fireA:["ふん、あたしがこれくらいでくたばるもんかい！", "呼んでくれて、ありがとよ。借りは返すよ！", "#danger|もどったよ！ さあ、やられた分をとりかえすよ！", "また会えたね。今度は、だれにも負けないよ！", "ちょいと休んでただけさ。さあ、はたらくよ！"],fireB:["へっ、おれがこれくらいでくたばるかよ！", "呼んでくれて、ありがとな。この借りは返すぜ！", "#danger|もどったぜ！ やられた分、きっちりとりかえす！", "ちょっと休んでただけだ。さあ、暴れるぞ！", "また会えたな。今度こそ、負けねえ！"],water:["#joy|もどってこられたようですね。呼んでくださって、ありがとうございます。", "前回の反省は、しっかり活かします。", "#wave|ふむ…意識がもどりました。またよろしくおねがいします。", "#joy|また、みなさんと過ごせるのですね。うれしいです。", "消えていたあいだのこと、あとで教えてくださいね。"],wind:["風はまた、この村に吹きますよ。", "お呼びいただき、光栄です。ふたたびお仕えしましょう。", "ふたたび、この空を飛べるとは。感謝いたします。", "#wave|少し遠回りをしてしまいました。また、よろしくたのみます。", "風は消えません。ふたたび参上いたしました。"]};
const KEYHELLO={'ノドカ':'#surprise|ふわぁ…。よく寝たぁ。ここが新しいおうちかなぁ。','ホノ':'#wave|ホノだ！ へっ、思ったより、あったけえ村じゃねえか。よろしくな！','アオ':'アオと申します。……この土地の水の流れ、さっそく調べさせてください。','フウ':'フウだよ。……フッ、ここは風の通りが、なかなか悪くないね。','シズク':'…はじめまして。シズクと申します。温泉の湯気に、水の力を感じたものですから。'};
const DEATHL2={wood:n=>[n+'が…！','…ふつうのせいれいは、このままじゃもどってこないんだって。オオカゲが落とす「めぶきのしずく」があれば、べつだけど…。','#danger|おなかをすかせないように、「コワイノ」からも守ってあげなきゃ…。'],
 earth:n=>[n+'#teary|が…消えちゃったねぇ…。','…ふつうのせいれいは、このままだと、もどってこないんだよぉ。オオカゲが落とす「めぶきのしずく」があれば、よみがえれるかもねぇ。','みんなのこと、もっと大事にしようねぇ…。'],
 fireA:n=>[n+'#danger|！ …ちくしょう、やられちまったか。','消えたせいれいは、このままじゃもどってこない。オオカゲが落とす「めぶきのしずく」でもなけりゃね。','…二度とこんな思いはさせないよ。守りをかためな。'],
 fireB:n=>[n+'#danger|！ …くそっ、やられちまったか。','消えたやつは、このままじゃもどってこねえ。オオカゲが落とす「めぶきのしずく」があれば、話はべつだ。','…二度とこんな思いはさせねえ。守りをかためようぜ。'],
 water:n=>[n+'が…消えてしまいました。','残念ですが、このままでは、もどってきません。オオカゲが落とす「めぶきのしずく」があれば、よみがえらせられます。','食料と守りを、見なおしておきましょう。'],
 wind:n=>[n+'が…風に消えてしまった。','フッ…このままでは、もどってこない。オオカゲが落とす「めぶきのしずく」があれば、あるいは…。','…この悲しみは、もうくりかえさないさ。']};
const MEBUKIL={wood:['それ、「めぶきのしずく」だ！ オオカゲがためこんでた、いのちの力なんだって。','#teary|これを使うと、消えちゃったせいれいがもどってきてくれるんだ！'],
 earth:['それ、「めぶきのしずく」だねぇ。オオカゲがためこんでた、いのちの力なんだってぇ。','#teary|これを使うと、消えちゃったせいれいがもどってきてくれるんだよぉ。'],
 fireA:['そいつは「めぶきのしずく」だね。オオカゲがためこんでた、いのちの力さ。','こいつを使えば、消えたせいれいがもどってくるよ。大事にしな。'],
 fireB:['そいつは「めぶきのしずく」だな。オオカゲがためこんでた、いのちの力だ。','こいつを使えば、消えたせいれいがもどってくるぜ。'],
 water:['それは「めぶきのしずく」です。オオカゲがためこんでいた、いのちの力ですね。','これを使えば、消えたせいれいがもどってきてくれます。'],
 wind:['フッ…それは「めぶきのしずく」。オオカゲがためこんでいた、いのちの力さ。','これを使えば、消えたせいれいが、もどってくるよ。']};
const DEATHL={wood:n=>[n+'が…！','…でも、だいじょうぶ。','次の朝、神殿で、'+n+'を呼びもどせるんだ。','新しいなかまより先に、'+n+'がもどってくるからね。'],
 earth:n=>[n+'#teary|が…消えちゃったねぇ…。','…でも、だいじょうぶだよぉ。','次の朝、神殿で、'+n+'を呼びもどせるんだぁ。','新しいなかまより先に、'+n+'がもどってくるよぉ。'],
 fireA:n=>[n+'#danger|！ …ちくしょう、やられちまったか。','しょげてる場合じゃないよ。','次の朝、神殿で、'+n+'を呼びもどせるよ。','新しいなかまより先に、'+n+'がもどってくる。待ってな。'],
 fireB:n=>[n+'#danger|！ …くそっ、やられちまったか。','しょげてる場合じゃねえ。','次の朝、神殿で、'+n+'を呼びもどせるぜ。','新しいなかまより先に、'+n+'がもどってくる。待ってろよ。'],
 water:n=>[n+'が…消えてしまいました。','落ち着いてください。','次の朝、神殿で、'+n+'を呼びもどせます。','新しいなかまより先に、'+n+'がもどってくるはずです。'],
 wind:n=>[n+'が…風に消えてしまいました。','どうか、お気をおとさずに。','次の朝、神殿で、'+n+'を呼びもどせますよ。','新しいなかまより先に、'+n+'がもどってまいります。']};
function elemKey(r){if(KEYVR[r.name]&&KEYVR[r.name].pk)return KEYVR[r.name].pk;let h=0;for(const ch of r.name)h=(h*17+ch.charCodeAt(0))>>>0;return r.elem==='fire'?(WD===0?'fireB':h%2?'fireA':'fireB'):r.elem}/* 火のせいれいは名前で、あねご／あにき */
function sayLine(r){const L=[],fav=FOODS[favDish(r)],m=bestMate(r);
  if(r.coffin||r.act&&(r.act.type==='bury'||r.act.type==='pray'))return 'さみしいなぁ…';/* お墓へ向かう・埋葬するあいだ、タップしたときのひとこと */
  if(r.hunger<30)return 'おなかすいた…';if(r.energy<25)return 'ねむたいなぁ…';
  if(isNight()&&S.enemies.some(e=>e.spawned&&!e.dead))return r.elem==='fire'?'「コワイノ」なんて、こわくない！':'「コワイノ」、こわいね…';
  if(cnt('stor')&&S.food<3)return '食料箱が、もうすぐからっぽだよ';
  if((r.cryU||0)>S.t)return 'さみしいなぁ…';
  if(S.today)L.push({hosaku:'きょうは畑がにぎやか！',oshaberi:'きょうは、おしゃべりしたい気分！',odayaka:'今夜は静かになりそう',kaze:'風がつよいね！ 種がとんでくるよ',kami:'カミサマが来てるよ！',hoshi:'今夜は星がきれいなんだって',mono:'落とし物、さがしにいこう！'}[S.today]);
  if(S.ns&&S.ns.rw&&hour()<12)L.push('ゆうべは、ぶじでよかった！');
  if(!HOUSES.length)L.push('みんなの家、ほしいなぁ');
  if(GRASSN>=450)L.push('みどりがいっぱいで、うれしいな');else if(GRASSN<60)L.push('もっと草花がふえるといいな');
  if(m)L.push(m.name+'とあそぶの、たのしい！');
  if((S.fs[favDish(r)]||0)>0)L.push('食料箱に'+fav.name+'がある！ たのしみ');else L.push(fav.name+'が食べたいなぁ');
  if(r.fun>=80)L.push('ここでのくらし、たのしいよ');
  L.push(LIKES[r.like]+'がすき！');
  return L[(Math.floor(S.t/30)+r.id)%L.length]}/* 村のようすで、ひとことが変わる */
function helloLine(r){const k=elemKey(r);
  if(r.back)return pick(BACKL[k]);if(KEYHELLO[r.name])return KEYHELLO[r.name];return pick(HELLO[k]).replace('$',r.name)}
const likeF=r=>{if(r.lf&&BL[r.lf])return r.lf;let h=2166136261;for(const ch of r.name+(r.id||0))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;h^=h>>>13;h=Math.imul(h,2246822507)>>>0;h^=h>>>16;r.lf=LIKEF[(h>>>0)%LIKEF.length];return r.lf};/* 好きな家具：ひとりずつちらばる（一度決まったら変わらない） */
const hasLikeF=(h,r)=>{const f=likeF(r);for(const j of h.inside)if(S.obj[j]===f)return true;if(S.win)for(const j of h.set)if(S.win[j]===f)return true;/* 壁にかける物（絵・カーテン） */return RUGS.has(f)&&rugsIn(h.inside).includes(f)};
const likeExtra=(h,r)=>{const f=likeF(r),pt=COMFY[f]||0;if(!pt)return 0;let n=0,t=0;for(const j of h.inside)if(S.obj[j]===f){n++;t+=pt*(n>2?.5:1)}if(RUGS.has(f))for(const o of rugsIn(h.inside))if(o===f){n++;t+=pt*(n>2?.5:1)}if(S.win)for(const j of h.set)if(S.win[j]===f){n++;t+=pt*(n>2?.5:1)}/* 壁にかけた絵・カーテン */return t};/* 好きな家具は、その家具のぶんの住み心地ポイントが2倍 */
const comfyFor=(h,r,C)=>Math.min(COMFMAX,(C||houseComfort(h)).v+likeExtra(h,r));
const comfyStars=v=>'★'.repeat(Math.min(5,Math.max(1,Math.ceil(v/(60)))))+'☆'.repeat(5-Math.min(5,Math.max(1,Math.ceil(v/(60)))));
/* 家の広さで、ちょうどいい人数が決まる（中のマス4つで1人） */
const bedOwner=j=>{const id=(S.bedOwn||{})[j];return id!=null&&BEDSET.has(S.obj[j])?S.res.find(q=>q.id===id)||null:null},myBed=r=>{const B=S.bedOwn||{};for(const k in B)if(B[k]===r.id&&BEDSET.has(S.obj[k]))return +k;return -1},bedFor=(j,r)=>{const o=bedOwner(j);return !o||o===r};/* ベッドの持ち主（いない子のは、だれでも使える） */
const houseCap=h=>Math.max(1,Math.floor(h.inside.size/4))/* 床のマス数の1/4（壁はふくめない）。はじめの家で3人 */,roomOf=j=>HOUSES.find(h=>h.set.has(j)),roomSleepN=h=>S.res.filter(x=>x.act&&(x.act.type==='sleep'||x.act.type==='stay')&&x.act.stand>=0&&h.set.has(x.act.obj!=null?x.act.obj:x.act.stand)).length;
// 屋根がすけて中をのぞいているときは、家の中のせいれいも外と同じに見せる
const peekH=r=>HOUSES.some(h=>h.set.has((r.y|0)*W+(r.x|0))&&roofAOf(h)<.5);
// 木の壁・石垣・ドアだけで囲まれ、ドアがついた場所を家とみなす
let HOUSES=[];
function houseWhy(j0){const isB=j=>{const t=typeAt(j);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))};if(!isB(j0))return null;/* 石の塀・石の塀のドアは、家の壁ではない */findHouses();if(HOUSES.some(h=>h.set.has(j0)))return null;
  const comp=new Set([j0]),q=[j0];while(q.length&&comp.size<600){const j=q.pop(),x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(k>=0&&k<W*H&&!comp.has(k)&&isB(k)){comp.add(k);q.push(k)}}}
  if(![...comp].some(j=>HOME_DOORS.has(S.obj[j])))return 'まだ家になっていません。ドアがありません';
  if([...comp].some(j=>{const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const t=typeAt((y+b)*W+x+a);if(t==='wall'||t==='sdoor'||FENCE_IDS.has(t))return true}return false}))return 'まだ家になっていません。かべにすきまがあるか、石の塀や柵がまざっています';
  return 'まだ家になっていません。かべにすきまがあるか、中が広すぎます'}/* 家にならない理由 */
const GLOWM=60,GLOWC=new Map();/* 家の光の絵（家の形をぼかしたもの）。家の形ごとに1回だけ作る */
function houseGlow(h){const key=[...h.set].join(',');let g=GLOWC.get(key);if(g)return g;if(GLOWC.size>40)GLOWC.clear();
  const w=(h.x1-h.x0+1)*TS+GLOWM*2,hh=(h.y1-h.y0+1)*TS+GLOWM*2,D=w+hh;g=document.createElement('canvas');g.width=w;g.height=hh;const c=g.getContext('2d');
  c.beginPath();for(const q of h.set)c.rect((q%W-h.x0)*TS+GLOWM-D,(((q/W)|0)-h.y0)*TS+GLOWM,TS,TS);c.fillStyle='#000';c.shadowColor='rgb(255,205,110)';c.shadowBlur=36;c.shadowOffsetX=D;c.fill();/* canvas には「ぼかす」命令がないので、形は絵の外にかいて、ぼけた影だけを絵の中に出す */
  GLOWC.set(key,g);return g}
function findHouses(){const isB=j=>HOME_WALLS.has(typeAt(j))||HOME_DOORS.has(typeAt(j));const seen=new Uint8Array(W*H),out=[],brk=new Set();for(const b of S.broken||[])if(!S.obj[b.j]&&(HOME_WALLS.has(b.id)||HOME_DOORS.has(b.id)))brk.add(b.j);
  for(let d=0;d<W*H;d++){if(!HOME_DOORS.has(S.obj[d]))continue;const dx0=d%W,dy0=(d/W)|0;
    for(const[ox,oy]of DIRS){const sx=dx0+ox,sy=dy0+oy;if(sx<0||sy<0||sx>=W||sy>=H)continue;const s=sy*W+sx;if(seen[s]||isB(s))continue;
      const cells=[],q=[s];let ok=true;seen[s]=1;
      while(q.length){const j=q.pop();cells.push(j);if(cells.length>160){ok=false;break}const x=j%W,y=(j/W)|0;if(x===0||y===0||x===W-1||y===H-1){ok=false;break}
        for(const[a,b]of DIRS){const k=(y+b)*W+x+a;if(!seen[k]&&!isB(k)){seen[k]=1;q.push(k)}}}
      if(!ok)continue;if(brk.size&&cells.some(j=>{const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(brk.has((y+b)*W+x+a))return true;return false}))continue;/* 壁がこわれたままの所は、家ではない（なおすまで。となりの家の外壁まで屋根がかからない） */
      {const cs=new Set(cells);if(cells.some(j=>{const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(!cs.has(k)&&!isB(k))return true}return false}))continue}/* 角（ななめ）に1マスでもすきまがあれば、家ではない */
      const set=new Set(cells);
      for(const j of cells){const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(isB(k))set.add(k)}}
      {const cs=new Set(cells);if(cells.some(j=>{const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(cs.has(k))continue;const t=typeAt(k);if(t==='wall'||t==='sdoor'||FENCE_IDS.has(t))return true}return false}))continue}/* 石の塀（と石のドア）が混ざっていたら、家にならない。家は、壁とドアだけで囲む */
      let x0=W,y0=H,x1=0,y1=0;for(const j of set){const x=j%W,y=(j/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
      let ib=0;for(const j of cells)ib=Math.max(ib,(j/W)|0);/* ib：家の中のいちばん下の行 */
      out.push({set,inside:new Set(cells),x0,y0,x1,y1,ib})}}
  HOUSES=out}
// 屋根：上から見た切妻屋根。いちばん下の列は正面の壁（窓つき）。拡大すると消えて中が見える
/* 屋根は、ズームでは変えない。「みる」では屋根あり、置く・こわすときだけ外して中を見せる */
/* 屋根は家ごと。家をタップすると屋根が消えて中が見える。家の外をタップすると、もどる */
const OPENH=new Set(),ROOFS=new Map(),hKey=h=>h.x0+','+h.y0;
function roofAOf(h){const k=hKey(h);let v=ROOFS.get(k);if(!v){v={a:OPENH.has(k)?0:1};ROOFS.set(k,v)}return v.a}/* 描くときは読むだけ。すけぐあいは stepLooks で進める */
const ROOFCOL={red:{h:6,s:.42,n:'赤'},blue:{h:212,s:.36,n:'青'},green:{h:105,s:.32,n:'緑'},brown:{h:24,s:.38,n:'こげ茶'}};/* 屋根の色：色あい（0〜360）とあざやかさ。明るさは、もとの絵のまま */
function roofTint(c,cv,P){c.save();c.setTransform(1,0,0,1,0,0);const d=c.getImageData(0,0,cv.width,cv.height),p=d.data,H=P.h/360;
  const f=(q,t,v)=>{if(v<0)v+=1;if(v>1)v-=1;return v<1/6?q+(t-q)*6*v:v<1/2?t:v<2/3?q+(t-q)*(2/3-v)*6:q};
  for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,s=P.s*(1-Math.abs(2*l-1)*.6);/* 明るい所・暗い所は、あざやかさを少しおさえる */
    const t=l<.5?l*(1+s):l+s-l*s,q=2*l-t;p[i]=f(q,t,H+1/3)*255;p[i+1]=f(q,t,H)*255;p[i+2]=f(q,t,H-1/3)*255}
  c.putImageData(d,0,0);c.restore()}
function roofCache(h,sc){/* 屋根の絵は、家ごとに1回だけ描いて使い回す（形がかわるまで） */
  let minx=W,maxx=0,miny=H,maxy=0;for(const j of h.set){const x=j%W,y=(j/W)|0;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y)}
  const ox=minx*TS-3,oy=miny*TS-16,w=(maxx-minx+1)*TS+6,hh=(maxy-miny+1)*TS+26;
  const cv=document.createElement('canvas');cv.width=Math.ceil(w*sc);cv.height=Math.ceil(hh*sc);const c=cv.getContext('2d');c.setTransform(sc,0,0,sc,-ox*sc,-oy*sc);
  {const A=1;
    const top=new Map(),bot=new Map();for(const j of h.set){const x=j%W,y=(j/W)|0;if(!top.has(x)||top.get(x)>y)top.set(x,y);if(!bot.has(x)||bot.get(x)<y)bot.set(x,y)}
    let tx=-1,ty=H;const ys=Math.min(...top.values()),ye=Math.max(...bot.values()),nR=ye-ys+1;const rY=nR<=3?ys*TS+3:nR<=6?(ye-3)*TS+TS/2:(ys+Math.floor((nR-1)/2)-1)*TS+TS/2;/* 棟：3マス以下は一番上の端、6マス以下は下から4マス目、それより大きいと中心のひとつ上 */
    for(const[x,y0]of top){const y1=bot.get(x),px=x*TS,lx=top.has(x-1)?px-.6:px+1,rx=top.has(x+1)?px+TS+.6:px+TS-1,/* となりの列と少し重ねて、すき間の線を出さない */t=y0*TS-11,b=y1*TS+1;if(y0<ty||(y0===ty&&x>tx)){ty=y0;tx=x}

      // 赤茶の瓦。横の列ごとに半分ずらした四角い瓦
      const KW=WD===1;/* 火山のふもとは、黒い瓦。丸がわらを、たてにならべる */
      c.fillStyle=KW?'#2b2c32':'#a06058';c.fillRect(lx,t,rx-lx,b-t);
      c.save();c.beginPath();c.rect(lx,t,rx-lx,b-t);c.clip();
      if(KW){const CW=8,RH=9;for(let col=Math.floor(lx/CW)-1;col*CW<rx+CW;col++){const xx=col*CW;c.fillStyle='#3d3f48';c.fillRect(xx+1,t,CW-3,b-t);c.fillStyle='rgba(175,182,200,.3)';c.fillRect(xx+1.6,t,1.2,b-t);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(xx+CW-2.2,t,1.2,b-t)}
        for(let row=Math.floor(t/RH);row*RH<b+RH;row++){const yy=row*RH;c.fillStyle='rgba(0,0,0,.45)';c.fillRect(lx,yy+RH-1.2,rx-lx,1.2);for(let col=Math.floor(lx/CW)-1;col*CW<rx+CW;col++){c.fillStyle='rgba(210,215,230,.22)';c.fillRect(col*CW+1.6,yy+.8,CW-4.4,1)}}}
      else{const RH=11,SW=14;for(let row=Math.floor(t/RH)-1;row<=Math.ceil(b/RH);row++){const yy=row*RH,off=row%2?SW/2:0;
        for(let k=-1;k<4;k++){const col=Math.floor((px-off)/SW)+k,xx=col*SW+off;c.fillStyle=(hash(col*97+row*13)<.5)?'#a86858':'#9c5e52';c.fillRect(xx+.6,yy+.6,SW-1.2,RH-1.6);c.fillStyle='rgba(205,140,120,.4)';c.fillRect(xx+1.5,yy+1.2,SW-3,1.4);c.fillStyle='rgba(110,55,45,.35)';c.fillRect(xx+SW-1.4,yy+1,1,RH-2.5)}
        c.fillStyle='#7f463e';c.fillRect(lx,yy+RH-1,rx-lx,1.2)}}
      if(rY>t+6&&rY<b-6){c.fillStyle='rgba(60,20,15,.2)';c.fillRect(lx,rY,rx-lx,b-rY);c.fillStyle='rgba(255,225,205,.08)';c.fillRect(lx,t,rx-lx,rY-t);/* 棟より手前の面は少し暗く */}
      c.restore();c.fillStyle=KW?'#1d1e23':'#6e3a30';c.fillRect(lx,b-3,rx-lx,3);c.fillStyle='rgba(0,0,0,.16)';c.fillRect(lx,b,rx-lx,3);/* のき */
      if(rY>t+6&&rY<b-6){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(lx,rY+5,rx-lx,3);c.fillStyle=KW?'#22232a':'#6e3830';c.fillRect(lx,rY-5,rx-lx,10);c.fillStyle=KW?'#5a5d68':'#b06c5e';c.fillRect(lx,rY-5,rx-lx,3);for(let q=Math.floor(lx/9);q*9<rx;q++){const qx=q*9;if(qx>=lx&&qx<rx-1){c.fillStyle='rgba(50,20,15,.55)';c.fillRect(qx,rY-5,1.2,10)}}/* 棟がわら */}
      
      if(!top.has(x-1)){c.fillStyle=(KW?'rgba(15,15,20,.6)':'rgba(110,55,45,.55)');c.fillRect(lx,t,1.5,b-t)}if(!top.has(x+1)){c.fillStyle=(KW?'rgba(15,15,20,.6)':'rgba(110,55,45,.55)');c.fillRect(rx-1.5,t,1.5,b-t)}
      {c.fillStyle='rgba(255,220,200,.18)';c.fillRect(lx,t,rx-lx,1.5)}}
    let chim=null;if(tx>=0){const xr=Math.max(...top.keys()),ccx=top.has(xr-1)?xr-1:xr,yb=bot.get(ccx),ccy=yb-1>top.get(ccx)?yb-1:yb,cx=ccx*TS+TS-10,cy=ccy*TS+8;/* 屋根の右下から、1マスずつ内がわ */chim={cx,cy}}
    {const rc=S&&S.roofCol&&S.roofCol[hKey(h)],P=rc&&ROOFCOL[rc];if(P)roofTint(c,cv,P)}/* 屋根の色（村レベル13から、家をタップしてえらぶ） */
    return{cv,ox,oy,sc,chim}}}
function drawRoofs(c,now,hs,eo){if(!HOUSES.length)return;c.save();
  for(const h of (hs||HOUSES)){const A=roofAOf(h);if(A<=0)continue;const sc=Math.max(1,Math.ceil(dpr*cam.z));if(!h._rc||h._rc.sc<sc)h._rc=roofCache(h,sc);const R=h._rc;c.globalAlpha=A;c.drawImage(R.cv,R.ox,R.oy,R.cv.width/R.sc,R.cv.height/R.sc);
    if(!R.chim||eo)continue;const cx=R.chim.cx,cy=R.chim.cy;
    c.fillStyle='#8f8f8f';c.fillRect(cx-7,cy-10,14,18);
    for(let r=0;r<3;r++)for(let k=0;k<2;k++){c.fillStyle=(r+k)%2?'#b8b8b8':'#acacac';c.fillRect(cx-6+k*6.5+(r%2?-2:0),cy-9+r*5.6,6,4.8)}
    c.fillStyle='#9c9c9c';c.fillRect(cx-8.5,cy-14,17,5);c.fillStyle='#3a3a3a';c.fillRect(cx-5,cy-13,10,2.5);
    {const t=now/1000;for(let k=0;k<3;k++){const p=(t*.4+k/3)%1;c.fillStyle='rgba(240,240,240,'+(.5*(1-p)*A)+')';c.beginPath();c.arc(cx+Math.sin(p*6+k)*3,cy-16-p*18,3+p*4,0,7);c.fill()}}}
  c.restore()}
const GCH=['tex:grass','tex:dry','ground#0','groundr#0','gedge:0#0','gedger:0#0','gcorner','gcornerr'];
const WCH=[];for(const k of['water','waterr','waterh'])for(let b=1;b<16;b++)WCH.push(k+':'+b);for(let i=0;i<4;i++)WCH.push('wave#'+i);for(let b=1;b<16;b++)WCH.push('waterm:'+b);WCH.push('tex:water');
function waterChipsOK(){const C=window.CHIPS;return !!C&&WCH.every(k=>C[k]&&chipImgs(C[k],'water')[0].ok)}/* 水のドット絵が読みこめたら使う */
function groundChipsOK(){const C=window.CHIPS;return !!C&&GCH.every(k=>C[k]&&chipImgs(C[k],'ground')[0].ok)}/* 地面のドット絵が読みこめたら使う */
function drawGroundChips(sc,X0,Y0,X1,Y1){const inR=i=>{const x=i%W,y=(i/W)|0;return x>=X0&&x<=X1&&y>=Y0&&y<=Y1};const C=window.CHIPS,r=WD===1?'r':'',dc=(k,x,y,i)=>{const ch=C[k];if(ch)drawChip(sc,ch,'ground',x,y,0,i)};
  if(WD===0){const dt=chipImgs(C['tex:dry'],'ground')[0];for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const px=x*TS,py=y*TS;sc.drawImage(dt,px%288,py%288,TS,TS,px,py,TS,TS)}}/* 草原のあれ地：288×288のテクスチャを、マップの位置どおりにしきつめる */
  else for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;dc('ground'+r+'#'+((hash(i*7+1)*8)|0),x*TS,y*TS,i)}/* 火山のあれ地：8しゅるい */
  const gt=chipImgs(C['tex:grass'],'ground')[0];for(const i of REV){if(!inR(i))continue;const x=i%W*TS,y=((i/W)|0)*TS;sc.drawImage(gt,x%96,y%96,TS,TS,x,y,TS,TS)}
  {/* 水のマスの下（水のふちのすきまに見える所）：となりの陸の地面（草地・乾いた地面）を、そのマスのがわの半マスに、同じもようでしきつめる（鏡うつしはしない）。ななめだけ陸なら、その角の4分の1 */
    const land=k=>S.ground[k]===0,dpt0=WD===0?chipImgs(C['tex:dry'],'ground')[0]:null,put=(n,rx,ry,rw,rh)=>{if(REV.has(n))sc.drawImage(gt,rx%96,ry%96,rw,rh,rx,ry,rw,rh);else if(dpt0)sc.drawImage(dpt0,rx%288,ry%288,rw,rh,rx,ry,rw,rh);else{sc.save();sc.beginPath();sc.rect(rx,ry,rw,rh);sc.clip();dc('ground'+r+'#'+((hash(n*7+1)*8)|0),Math.floor(rx/TS)*TS,Math.floor(ry/TS)*TS,n);sc.restore()}},h2=TS/2;
    for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;if(S.ground[i]<1)continue;const px=x*TS,py=y*TS;/* 水のマスそのものが緑のマスでも、草はしかない（はしに見える所は、となりの陸の地面） */
      const L=x>0&&land(i-1),R=x<W-1&&land(i+1),U=y>0&&land(i-W),D=y<H-1&&land(i+W);
      if(L)put(i-1,px,py,h2,TS);if(R)put(i+1,px+h2,py,h2,TS);if(U)put(i-W,px,py,TS,h2);if(D)put(i+W,px,py+h2,TS,h2);
      if(!L&&!U&&x>0&&y>0&&land(i-W-1))put(i-W-1,px,py,h2,h2);if(!R&&!U&&x<W-1&&y>0&&land(i-W+1))put(i-W+1,px+h2,py,h2,h2);if(!L&&!D&&x>0&&y<H-1&&land(i+W-1))put(i+W-1,px,py+h2,h2,h2);if(!R&&!D&&x<W-1&&y<H-1&&land(i+W+1))put(i+W+1,px+h2,py+h2,h2,h2)}}
  {/* 草とあれ地のさかい：あぜ道のふちと同じ。あれ地のマスの、草地がわのふちに、草のふちの絵（fringeg）をかさねる（となりの草地からはみ出す草）。ななめだけ草地の角には、角の絵 */
    const G=k=>REV.has(k)&&S.ground[k]!==1/* 水のマスからは草をはみ出させない */,open=k=>!REV.has(k)&&S.ground[k]!==1;
    for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;if(!open(i))continue;const hi0=hiAt(i),g=(dx,dy)=>x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H&&G(i+dy*W+dx)&&hiAt(i+dy*W+dx)===hi0,/* 高さのちがう草地からは、はみ出さない */u=g(0,-1),d=g(0,1),l=g(-1,0),r=g(1,0),px=x*TS,py=y*TS;
      if(!(u||d||l||r||g(-1,-1)||g(1,-1)||g(1,1)||g(-1,1)))continue;const sh=(dx,dy)=>x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H&&hiAt(i+dy*W+dx)===hi0,m=4;sc.save();sc.beginPath();sc.rect(px-(sh(-1,0)?m:0),py-(sh(0,-1)?m:0),TS+(sh(-1,0)?m:0)+(sh(1,0)?m:0),TS+(sh(0,-1)?m:0)+(sh(0,1)?m:0));sc.clip();/* 草のふちの絵はマスの外へ少しはみ出すので、高さのちがうとなりのマスには出さない */
      if(u)dc('fringeg:U',px,py,i);if(d)dc('fringeg:D',px,py,i);if(l)dc('fringeg:L',px,py,i);if(r)dc('fringeg:R',px,py,i);
      if(!u&&!l&&g(-1,-1))dc('fringeg:c0',px,py,i);if(!u&&!r&&g(1,-1))dc('fringeg:c1',px,py,i);if(!d&&!r&&g(1,1))dc('fringeg:c2',px,py,i);if(!d&&!l&&g(-1,1))dc('fringeg:c3',px,py,i);sc.restore()}}}/* 草とあれ地のさかい */
function drawRug(c,id,x,y,i){const ch=chipOf(id,i);if(ch&&drawChip(c,ch,id,x,y,0,i))return;/* ドット絵のラグは、2×2マスの絵なので、そのままの大きさで */c.save();c.translate(x+32,y+32);c.scale(1.4,1.4);c.translate(-16,-20);drawObj(c,id,0,0,i);c.restore()}/* ラグ：2×2マスのまんなかに、2マスはばの大きさで */
function drawRugsLive(x0,y0,x1,y1){for(const k in S.rug||{}){const j=+k,x=j%W,y=(j/W)|0;if(x+2<x0||y+2<y0||x>x1||y>y1)continue;drawRug(ctx,S.rug[k],x*TS,y*TS,j);for(const q of rugCells(j)){const o=S.obj[q];if(o&&o!=='part'&&BL[o]&&FLAT.has(o)&&!(BL[o].dyn||BL[o].anim||TREES.has(o)))drawObj(ctx,o,(q%W)*TS,((q/W)|0)*TS,q)}}}/* ラグは毎コマ、画面の細かさで描く（地面の下絵は1マス32ドットなので、64ドットの絵があらくなる）。ラグの上の平らな物も、ラグのあとに */
function drawStaticArea(sc,X0,Y0,X1,Y1){/* 地面・床・水・動かない物を、マス(X0,Y0)〜(X1,Y1)のはんいだけ描く */const inR=i=>{const x=i%W,y=(i/W)|0;return x>=X0&&x<=X1&&y>=Y0&&y<=Y1};
  if(groundChipsOK())drawGroundChips(sc,X0,Y0,X1,Y1);else{
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;drawBarren(sc,i,x*TS,y*TS)}
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;if(REV.has(i))drawGrass(sc,i,x*TS,y*TS)}
  for(const i of REV)if(inR(i))drawGrassBoundary(sc,i,i%W*TS,((i/W)|0)*TS)}
  // 色むら：マス単位ではなく、なめらかにぼかした明暗を重ねる
  {let nc=NOISEC;if(!nc||nc.width!==W||nc.height!==H){nc=NOISEC=document.createElement('canvas');nc.width=W;nc.height=H;const nx=nc.getContext('2d'),im=nx.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=0,n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const xx=x+a,yy=y+b;if(xx<0||yy<0||xx>=W||yy>=H)continue;v+=hash((yy*W+xx)*31+7);n++}v=v/n-.5;
      const k=(y*W+x)*4;if(v>0){im.data[k]=255;im.data[k+1]=250;im.data[k+2]=220}else{im.data[k]=40;im.data[k+1]=55;im.data[k+2]=20}im.data[k+3]=Math.min(255,Math.abs(v)*2*70)}
    nx.putImageData(im,0,0)}sc.save();sc.imageSmoothingEnabled=true;sc.imageSmoothingQuality='high';sc.drawImage(nc,-TS/2,-TS/2,(W+1)*TS,(H+1)*TS);sc.restore()}
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;if(S.ground[i]!==1&&S.floor[i]&&!((HOME_WALLS.has(S.obj[i])||HOME_DOORS.has(S.obj[i]))&&!ROADF.has(S.floor[i])))drawFloor(sc,S.floor[i],x*TS,y*TS,i);/* 壁の下の床は、家の中がわだけ（wallMargで描く） */if(HOME_DOORS.has(S.obj[i])||HOME_WALLS.has(S.obj[i]))wallMarg(sc,i,x*TS,y*TS)}/* 壁・ドアの下の床（家の中がわ）も、地面の下絵に描く（毎コマ描くと、下絵とのさかいめに線が出る） */
  drawWaterAll(sc,X0,Y0,X1,Y1);
  // 固定物も、アニメーションする物と同じ足元の奥行きで並べる。
  const fixed=[];
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x,o=S.obj[i];if(!o||o==='part'||!BL[o]||BL[o].dyn||BL[o].anim||TREES.has(o)||!(FLAT.has(o)||BL[o].floor)||FLAT.has(o)&&RUGC.has(i))continue;/* 地面にやきつけるのは、平らな物だけ（ラグの上の物は、ラグといっしょに毎コマ）。立っている物は毎コマ、足もとの順に描く */fixed.push({i,o,k:objectDepth(o,i),t:BL[o].kind==='block'?0:1})}
  fixed.sort((a,b)=>a.k-b.k||a.t-b.t||a.i-b.i);
  for(const {i,o}of fixed)drawObj(sc,o,(i%W)*TS,((i/W)|0)*TS,i);
}
let SSIG=null,SSIG_S=null,SSIG_G='',NOISEC=null;
function staticSig(){/* マスごとに、地面の絵にかかわる中身を文字にしておく（前とくらべて、変わったマスだけ描き直すため） */const hs=new Set();for(const h of HOUSES)for(const j of h.set)hs.add(j);const M=WD===1&&S.st2?sprMap():null,sg=new Array(W*H);
  for(let i=0;i<W*H;i++){const o=S.obj[i],st=o&&BL[o]&&!(BL[o].dyn||BL[o].anim||TREES.has(o));sg[i]=o+'|'+(S.ref[i]??'')+'|'+S.ground[i]+'|'+(S.floor[i]||'')+'|'+(REV.has(i)?1:0)+(hs.has(i)?1:0)+(ashed(i)?1:0)+(M&&S.ground[i]===1&&springOn(M[i])?1:0)+(S.trapCd&&S.trapCd[i]>S.t?1:0)+'|'+(st&&S.dyn[i]?JSON.stringify(S.dyn[i]):'')+'|'+((S.win||{})[i]||'')+'|'+((S.rot||{})[i]||'')+'|'+(RUGC.has(i)?RUGC.get(i)+S.rug[RUGC.get(i)]+((S.rugRot||{})[RUGC.get(i)]||''):'')+'|'+(S.hp['L'+i]||'')}
  return sg}
let STATN=0,STDIRTY=null;/* STDIRTY：下絵の一部だけ描きなおしたときの行の範囲（段差の絵は、そこだけ作りなおす） */function rebuildStatic(full){STATN++;STDIRTY=null;findHouses();
  const g=[WD,CX,CY,W,H,groundChipsOK(),waterChipsOK()].join(),sg=staticSig();
  if(!full&&SSIG&&SSIG_S===S&&SSIG_G===g){/* 変わったマスのまわりだけ描き直す */
    let R=[];for(let i=0;i<W*H;i++)if(sg[i]!==SSIG[i]){const x=i%W,y=(i/W)|0;R.push([Math.max(0,x-3),Math.max(0,y-6),Math.min(W-1,x+3),Math.min(H-1,y+1)])}/* 背の高い物は上へ6マスまで、横へ3マスまで絵がはみ出す */
    SSIG=sg;
    for(let m=true;m;){m=false;for(let a=0;a<R.length&&!m;a++)for(let b=a+1;b<R.length;b++){const p=R[a],q=R[b];if(p[0]<=q[2]+1&&q[0]<=p[2]+1&&p[1]<=q[3]+1&&q[1]<=p[3]+1){R[a]=[Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[2],q[2]),Math.max(p[3],q[3])];R.splice(b,1);m=true;break}}}/* かさなる四角は1つにまとめる */
    let area=0;for(const r of R)area+=(r[2]-r[0]+1)*(r[3]-r[1]+1);
    if(area<W*H*.4){STDIRTY=R.map(r=>[r[0],r[1],r[2],r[3]]);waterDirty(R);for(const r of R){
        for(let cy=Math.max(0,(r[1]-1)>>4);cy<=Math.min((H-1)>>4,(r[3]+1)>>4);cy++)for(let cx=Math.max(0,(r[0]-1)>>4);cx<=Math.min((W-1)>>4,(r[2]+1)>>4);cx++){const q=GRD.c.get(cy*64+cx);if(q)q.st=true}}/* 変わった所にかかる区画に、作りなおすしるし（作りなおすまでは前の絵） */
      dirty=false;return}}
  SSIG=sg;SSIG_S=S;SSIG_G=g;gclear();waterDirty(null);dirty=false;STATICFULL=false;
}
const iconCache={};
let ICONTMP=null;
function iconURL(id){/* アイコンは、大きなキャンバスに2倍の細かさで描いてから、絵のある範囲だけを切り出して、144×144にきちんと入れる（全体がうつる） */
  if(typeof id==='string'&&id.startsWith('seed:'))return seedIcon(id.slice(5));
  if(iconCache[id])return iconCache[id];
  const N=576,T=ICONTMP||(ICONTMP=document.createElement('canvas'));T.width=T.height=N;const t=T.getContext('2d');t.setTransform(1,0,0,1,0,0);t.clearRect(0,0,N,N);t.setTransform(2,0,0,2,0,0);/* 2倍の細かさで描く（1マス64ドットの絵が、そのままの細かさで入る） */
  ICON=true;try{if(BL[id].floor)drawFloor(t,id,96,160,7,true);else drawObj(t,id,96,160,7,(id==='berry'||id==='fruit')?100:id==='farm'?60:0,1)}finally{ICON=false}
  const d=t.getImageData(0,0,N,N).data;let x0=N,y0=N,x1=-1,y1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(d[(y*N+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  const c=document.createElement('canvas');c.width=144;c.height=144;
  if(x1>=0){const g=c.getContext('2d'),bw=x1-x0+1,bh=y1-y0+1,sc=Math.min(132/bw,132/bh,2),dw=bw*sc,dh=bh*sc;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(T,x0,y0,bw,bh,(144-dw)/2,(144-dh)/2,dw,dh)}/* 144×144（画面では72にちぢめて出すので、細かい画面でもくっきり）。のばす・ちぢめるときは、なめらかに（がたがたにしない）。小さい物は2倍まで */
  const u=c.toDataURL();c.width=c.height=0;return iconCache[id]=u;
}
function toolIcon(k){
  const key='tool_'+k;if(iconCache[key])return iconCache[key];
  const c=document.createElement('canvas');c.width=72;c.height=72;const g=c.getContext('2d');
  if(k==='glass'){g.fillStyle='#8a5a33';g.fillRect(16,8,40,6);g.fillRect(16,58,40,6);g.fillStyle='#6d4424';g.fillRect(20,14,4,44);g.fillRect(48,14,4,44);
    g.fillStyle='rgba(200,235,255,.55)';g.beginPath();g.moveTo(24,14);g.lineTo(48,14);g.quadraticCurveTo(48,30,37,36);g.quadraticCurveTo(48,42,48,58);g.lineTo(24,58);g.quadraticCurveTo(24,42,35,36);g.quadraticCurveTo(24,30,24,14);g.fill();
    g.fillStyle='#ffcf4a';g.beginPath();g.moveTo(28,22);g.lineTo(44,22);g.lineTo(36,34);g.fill();g.beginPath();g.moveTo(36,40);g.lineTo(45,56);g.lineTo(27,56);g.fill();g.fillRect(35.5,34,1.5,8)}
  else if(k==='scoop'||k==='dig'||k==='mound'){/* だんさスコップ・けずる・もる */if(k!=='scoop'){g.fillStyle='#8cc35c';g.fillRect(12,k==='dig'?30:20,48,8);g.fillStyle='#b08a5e';g.fillRect(12,k==='dig'?38:28,48,k==='dig'?20:30);g.fillStyle='#fff6df';g.beginPath();if(k==='dig'){g.moveTo(36,26);g.lineTo(24,10);g.lineTo(48,10)}else{g.moveTo(36,4);g.lineTo(24,18);g.lineTo(48,18)}g.fill()}else{g.save();g.translate(36,36);g.rotate(.6);g.fillStyle='#b07c50';rr(g,-3,-32,6,34,3);g.fillStyle='#9aa3ad';g.beginPath();g.moveTo(-11,2);g.lineTo(11,2);g.lineTo(9,22);g.quadraticCurveTo(0,30,-9,22);g.closePath();g.fill();g.restore()}}
  else if(k==='hake'){g.save();g.translate(36,36);g.rotate(-.7);g.fillStyle='#b07c50';rr(g,-5,-30,10,30,4);g.fillStyle='#8a5a33';g.fillRect(-5,-30,3,30);
    g.fillStyle='#c4c8cf';g.fillRect(-12,0,24,7);g.fillStyle='#e9d6a8';g.fillRect(-12,7,24,16);g.fillStyle='#d4bc86';for(let i=0;i<6;i++)g.fillRect(-11+i*4,9,1.5,14);
    g.fillStyle='#86d68f';g.fillRect(-12,19,24,6);g.restore()}
  else if(k==='mover'){/* ひっこしミトン：やわらかい手ぶくろと、うつす矢印 */g.fillStyle='rgba(0,0,0,.15)';g.beginPath();g.ellipse(34,62,20,5,0,0,7);g.fill();g.fillStyle='#e9b86a';rr(g,18,20,30,36,12);rr(g,10,30,14,12,6);g.fillStyle='#f6d79a';rr(g,22,22,10,26,5);g.fillStyle='#c98a3e';g.fillRect(18,50,30,6);g.fillStyle='#86d68f';g.beginPath();g.moveTo(50,14);g.lineTo(64,22);g.lineTo(50,30);g.fill();g.fillRect(40,19,11,6)}
  else if(k==='swap'){g.save();g.translate(36,38);g.rotate(-.6);g.fillStyle='#b07c50';rr(g,-4,-6,8,34,3);g.fillStyle='#8a5a33';g.fillRect(-4,-6,3,34);g.fillStyle='#8d9098';rr(g,-16,-20,32,14,3);g.fillStyle='#c4c8cf';g.fillRect(-16,-20,32,4);g.restore();/* つけかえトンカチ：木の柄に鉄の頭 */g.fillStyle='#86d68f';g.beginPath();g.moveTo(50,48);g.lineTo(62,56);g.lineTo(50,64);g.fill();g.fillRect(40,53,11,6)}
  else{g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(36,60,24,6,0,0,7);g.fill();g.fillStyle='#b8452f';rr(g,14,40,44,16,4);g.fillStyle='#d9644a';g.fillRect(14,40,44,4);
    g.fillStyle='#8a5a33';g.fillRect(31,22,10,18);circ(g,36,18,10,'#b07c50');circ(g,33,15,3,'#d9a873');g.fillStyle='#86d68f';g.fillRect(18,56,8,4);g.fillRect(30,56,8,4);g.fillRect(42,56,8,4)}
  return iconCache[key]=c.toDataURL();
}
function stampIcon(sid){
  const k='st_'+sid;if(iconCache[k])return iconCache[k];
  const st=STAMPS[sid];const mx=Math.max(...st.cells.map(c=>c[0]))+1,my=Math.max(...st.cells.map(c=>c[1]))+1;
  const c=document.createElement('canvas');c.width=72;c.height=72;const g=c.getContext('2d');const s=64/(Math.max(mx,my)*TS);
  g.translate(4+(64-mx*TS*s)/2,4+(64-my*TS*s)/2);g.scale(s,s);ICON=true;
  for(const[x,y,id]of st.cells){if(BL[id].floor)drawFloor(g,id,x*TS,y*TS,x+y,true);else drawObj(g,id,x*TS,y*TS,x*5+y,60,1)}
  ICON=false;return iconCache[k]=c.toDataURL();
}
