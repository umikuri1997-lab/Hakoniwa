'use strict';
/* むかしの道具・洞窟の図鑑（cave.js・cave-bake.js のつづき）。設定は STORY.md の「土の谷の大穴とバケモノ」
   ・むかしの道具（CVREL）：階ごとに1つ。手がかりの物（K）をしらべると見つかる。見つけた道具は、
     図鑑の「むかしの道具」に出る・村にかざれる家具（BL の rel_<k>、relic:1）・洞窟でふしぎな力（relOn）・お話の手がかり（しらべたときの、せいれいのひとこと CVRELSEE）
   ・せいれいは人間の字を読めない。図鑑にも、道具の意味は書かない（形だけ）
   ・バケモノの図鑑（S.bkRec）：会った、たたかえるバケモノと、こわい物
   たしかめは tools/tests/cave-relic.cjs */
const CVREL=['kui','bin','suisho','tsuru','ningyo','kagami','fuigo','nafuda','sekiban','suzu'];/* 階（1〜10階） → 道具（STORY.md） */
const CVRELFOS=.5,CVRELSUZU=3;/* 組み立ての石板：化石がもう1つ出るわりあい・ゆりかごのすず：えさが正体をあらわすマス */
/* 図鑑の文（形だけ。意味は書かない） */
const CVRELD={kui:'木の根に、まっすぐ打ちこまれていた鉄のくい。細い管が、根の中へのびている。',
  suisho:'台にはめられた水晶。ならんだ水晶は、みんな、からっぽで光らない。',
  tsuru:'つるはしかけの、はしにのこっていた、かけたつるはし。柄が、手の形にすりへっている。',
  kagami:'祭壇の台に、ひとつだけのこっていた、まるい銅のかがみ。うらに、おひさまのもようがある。',
  ningyo:'食卓のいすに、ひとつだけすわっていた木のにんぎょう。だれかの手で、なんどもなでられて、つるつるになっている。',
  bin:'黒い水の入ったびん。のぞきこむと、光が、すいこまれていく。',
  nafuda:'ガラスの入れ物の前に、1まいずつ立っていた金もののふだ。読めない字が彫ってある。',
  sekiban:'ならべかけのほねの横にあった石の板。ほねの組み方が彫ってある。',
  fuigo:'装置のそばに、ころがっていた、小さなふいご。いまも、あたたかい。',
  suzu:'ゆりかごのそばに、さげてあったすず。そっとふれると、遠くまでひびく。'};
/* しらべたときの、せいれいのひとこと（くりかえすたびに、つぎ。道具を見つけたあとも、手がかりをしらべられる） */
const CVRELSEE={kui:['根に、なにかが打ちこまれてる…','根が、ここだけ、しおれてる','このくい、どこへつながってるのかな'],
  crystal:['水晶が、ずらっとならんでる','光ってるのは、はしの1つだけ…','ほかのは、灰色だね'],
  mine:['つるはしが、ずらっとかけてある','どれも、すりへってる','はしの1つだけ、かけたまま、のこってる'],
  shinden:['台が、ならんでる','どれも、からっぽ…','はしの1つだけ、まぶしい'],
  shisetsu:['管が、ならんでる','どれも、根のほうへ のびてる…','はしの1つの前に、なにか ころがってる'],
  haison:['いすが、ならんでる','みんな、からっぽ…','はしの1つにだけ、だれかが すわってる'],
  lake:['この水、まっくら','水の中のしみが、光をのんでる','さわらないほうが、いいよね'],
  hakaba:['ほねが、ならんでる','どれも、とても大きい…','はしの1つの横に、石の板が ある'],
  cradle:['ふだが、ずらっとならんでる','読めない字が、彫ってあるね','はしの1つだけ、ちがう字だ…']};
CVRELSEE.roots=CVRELSEE.kui;
function relOn(k){return !!(S&&S.flags&&S.flags.cvItem&&S.flags.cvItem['rel_'+k])||!!(typeof CV!=='undefined'&&CV&&CV.loot&&CV.loot.items&&CV.loot.items['rel_'+k])}
/* 手がかりの物をしらべた */
function cvRelicLook(a,j,now){const C=CV,th=C.F.theme,k=CVREL[C.fl],L=CVRELSEE[th]||[];a.joyU=0;a.shockU=now+500;
  C.relI=(C.relI||0);if(L.length){toast(L[C.relI%L.length]);C.relI++}
  if(k&&!relOn(k)&&BL['rel_'+k]){C.loot.items['rel_'+k]=1;bkNote();later(()=>{if(CV!==C)return;toast(BL['rel_'+k].name+'を見つけた','good');sfx('quest');cvSpark(cvX(j)+.5,cvY(j)+.4,'#ffe58a',14);a.joyU=performance.now()+1400;a.jumpT=performance.now()},900)}}
function bkNote(){}/* 見つけた数のメモ（いまは何もしない。図鑑は caveExit の S.relRec） */
/* バケモノに会った（図鑑） */
function bkSeen(k){if(!S||typeof MEMRUN!=='undefined'&&MEMRUN)return;const R=S.bkRec||(S.bkRec={});if(!R[k]){R[k]=1}}
const BKZK={bk_seki:'ひざをついて、光をおがむ石の像。光をしぼらないと、よってきて、たたく。かたく、おそい。',bk_kui:'くいがささったまま歩く、土と根の人形。じょうぶで、おそい。',bk_sui:'中がからっぽの、くらいゼリー。そばにいると、光が小さくなる。',bk_yoru:'黒い水のかたまり。たたくと、2つにわかれる。',bk_tame:'ガラスの入れ物でねむる、つくりかけのからだ。入れ物がわれると、目をさます。',bk_hone:'ほねを組みあわせた生き物。くずれても、また組みあがる。まもりの光で、ねむる。',bk_ro:'こげたからだに、ひびが光る。通ったあとが、あつくなる。',bk_mi:'ゆりかごや装置のくいのそばを見回る、石と金ものの番人。',bk_kuzu:'ほった土と石くずが、人の形になったもの。くずれると、岩がのこる。',bk_nezu:'村でかわれていて、おいていかれたねずみ。いつもうえていて、3びきでかみついてくる。',
  sc_koe:'すがたはない。足音と声だけが、近づいてくる。光をあてると、うすいすがたが見える。',sc_me:'暗がりから、じっと見ている目。光がとどくと消える。',sc_esa:'かわいい生き物のふりをして、よってくる。光をあてると、正体をあらわす。',sc_te:'大穴のふちを、ほりつづける大きな手。光をしぼると、見つかりにくい。'};
const BKSC={sc_koe:'声のこだま',sc_me:'見はりの目',sc_esa:'えさ',sc_te:'ほりつづける手'},BKSCCH={sc_esa:'bkesa#a0',sc_te:'bkte#0'};
const BKSCPX={/* チップのない物の図鑑の絵（16×16。o ふち・h 明るい・m 中・d かげ） */
  sc_koe:['................','................','...o........o...','..o..o....o..o.','.o..o..oo..o..o','.o.o..ohho..o.o','.o.o.ohmmho.o.o','.o.o.ohmmho.o.o','.o.o..ohho..o.o','.o..o..oo..o..o','..o..o....o..o.','...o........o...','................','................','................','................'],
  sc_me:['................','................','................','................','..oooo....oooo..','.ohhhho..ohhhho.','.ohmmdo..ohmmdo.','.ohmmdo..ohmmdo.','..oooo....oooo..','................','................','................','................','................','................','................']};
function bkChipURL(id){const g=typeof GICON!=='undefined'?GICON:{};if(g['bkz:'+id])return g['bkz:'+id];const ch=typeof cvChipOf==='function'?cvChipOf(id):null;if(!ch)return null;const im=chipImgs(ch,id)[0];if(!im||!im.ok)return null;
  const c=document.createElement('canvas');c.width=c.height=144;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const s=Math.max(1,Math.floor(Math.min(132/ch.w,132/ch.h)*2)/2);x.drawImage(im,(144-ch.w*s)/2,(144-ch.h*s)/2,ch.w*s,ch.h*s);const u=c.toDataURL();c.width=c.height=0;return g['bkz:'+id]=u}
function relZukan(d,add){const R=d.relRec||{};for(const k of CVREL){if(!k)continue;const id='rel_'+k;if(R[id]&&BL[id])add(BL[id].name,CVRELD[k]+' 洞窟で：'+BL[id].desc.split('洞窟で：')[1],iconURL(id),'i:'+id)}}
function bkZukan(d,add){const R=d.bkRec||{};for(const k in CVBK)if(R[k])add(EN[k].name,BKZK[k],bkChipURL('bk'+k.slice(3)+'#0'),'k:tfoe');for(const k in BKSC)if(R[k])add(BKSC[k],BKZK[k],BKSCCH[k]?bkChipURL(BKSCCH[k]):pixURL('bkz:'+k,BKSCPX[k],k==='sc_me'?'#ffe08a':'#b8b0e0'),'k:tfoe')}
