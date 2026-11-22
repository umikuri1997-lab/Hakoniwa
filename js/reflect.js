'use strict';
/* クリアのあと：村のふりかえり（reflectBody）と、クリアまでの記録（clearRecBody）。点やランクは出さない。
   ふりかえりは、そのときのセーブの記録（なかよし S.bond・見つけたスポット S.spotSeen・家と部屋・つかうせいれい・思い出 S.memo・いなくなったなかま S.gone）から、
   ある物だけを書く。数をふやすほど、よくなる書き方にしない（名前は少しだけ、数は書くだけ）。
   S.clearRec：クリアしたときの記録 {d:日,h:時,n:夜,k:コワイノ,b:オオカゲ,dt:消えた,res:せいれい,sm:よんだ,ps:あそんだ秒,lv:村レベル}。前のセーブにはない（S.score の一部だけ）。
   S.playSec：あそんだ時間（秒。ゲームの画面を見ているあいだ。毎コマは PLAYS にため、セーブのとき S に入れる）。
   S.flags.rfNote：「思い出帳にのこした」の知らせ（1回だけ）。
   CALMT：再会のあと、レベルアップ・うけとった・スポットの知らせ・ふりかえりの知らせを、すこしまつ（performance.now。セーブしない）。 */
let CALMT=0;
const CALMMS=30000;
function calmNow(){return performance.now()<CALMT&&CALMT-performance.now()<=CALMMS}/* 読みこみで時刻がずれても、まちつづけない */
function reunionCalm(){CALMT=performance.now()+CALMMS}
let PLAYS={s:null,v:0};/* あそんだ時間の、まだ S に入れていない分 */
function playFlush(){if(PLAYS.s){PLAYS.s.playSec=(PLAYS.s.playSec||0)+PLAYS.v;PLAYS.v=0}}
function playAdd(dt){if(PLAYS.s!==S){playFlush();PLAYS={s:S,v:0}}PLAYS.v+=dt}
function clearSnap(){playFlush();S.clearDay=dayNo();S.clearRec={d:dayNo(),h:Math.floor(hour()),n:S.nights||0,k:S.kills||0,b:S.bossKills||0,dt:S.deaths||0,res:S.res.length,sm:S.summons||0,ps:Math.round(S.playSec||0),lv:S.lv||1}}
function reflectOK(){return !!(S&&S.cleared&&!S.free)}
function reflectNoteTick(){if(!reflectOK()||S.flags.rfNote||IS_STORY_REPLAY||calmNow()||NUSHI_RUN||camAnim)return;if(typeof DEPART_RUN!=='undefined'&&DEPART_RUN)return;
  S.flags.rfNote=1;dirty=true;toast('村のふりかえりを、思い出帳にのこした','good')}
function playTimeText(s){s=Math.max(0,Math.round(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+'時間'+m+'分':Math.max(1,m)+'分'}
function clearDayOf(){return S.clearRec?.d||S.clearDay||dayNo()}
/* なかよしの組（村にいる2人。なかよしの強い順に3組まで） */
function reflectPairs(){const B=S.bond||{};return Object.keys(B).filter(k=>B[k]>=BOND_TALK&&bondPair(k)).sort((a,b)=>B[b]-B[a]).slice(0,3).map(k=>{const[A,C]=bondPair(k),v=B[k];
  return A.name+'と'+C.name+'は、'+(v>=BOND_MAX?'いちばんのなかよし。':v>=BOND_PLAY?'よく、いっしょに遊んでいる。':'なかよしになった。')+((S.qMem||{})[k]?'けんかをして、仲なおりもした。':'')})}
/* 整えた居場所：部屋のスポットのある家・じぶんのベッド・つかうせいれいのきまった家具 */
function reflectPlaces(){const L=[],rooms=new Set();for(const t of (typeof SPOTJ!=='undefined'?SPOTJ.values():[]))for(const k of t){const sp=SPOTS.find(s=>s.k===k);if(sp&&sp.room)rooms.add(sp.n)}
  const nh=typeof HOUSES!=='undefined'?HOUSES.length:0;if(nh)L.push('村には、家が'+nh+'けん。'+(rooms.size?[...rooms].slice(0,4).join('・')+'のある、くらしの家になった。':'みんなの帰る場所ができた。'));
  const own=new Set(Object.values(S.bedOwn||{}));const nb=S.res.filter(r=>own.has(r.id)).length;if(nb)L.push(nb===S.res.length?'どのせいれいにも、じぶんのベッドがある。':nb+'人のせいれいに、じぶんのベッドがある。');
  const seat=[];for(const j in S.useOwn||{}){const r=S.res.find(q=>q.id===S.useOwn[j]),o=S.obj[j];if(r&&o&&BL[o]&&!seat.some(s=>s[0]===r))seat.push([r,BL[o].name])}
  for(const[r,n]of seat.slice(0,2))L.push(r.name+'には、お気に入りの'+n+'がある。');return L}
/* 見つけたスポット（このステージで出る物だけ） */
function reflectSpots(){const seen=SPOTS.filter(s=>(s.st==null||s.st===WD)&&(S.spotSeen||{})[s.k]);if(!seen.length)return[];return[seen.length+'このスポットを見つけた。'+seen.slice(0,5).map(s=>s.n).join('・')+(seen.length>5?' など。':'。')]}
/* 村で生まれた思い出：思い出帳のメモから、日をちらして5つまで（村レベルの知らせはのぞく） */
function reflectMemories(){const M=(S.memo||[]).filter(([,,t])=>t&&!/^村レベル/.test(t)),seen=new Set(),U=M.filter(([,,t])=>!seen.has(t)&&seen.add(t));if(!U.length)return[];
  const n=Math.min(5,U.length),out=[];for(let i=0;i<n;i++){const e=U[Math.round(i*(U.length-1)/Math.max(1,n-1))];if(!out.includes(e))out.push(e)}return out.map(([d,,t])=>d+'日め　'+t)}
function reflectIntro(){const d=clearDayOf(),now=dayNo(),nm=S.vname?'「'+S.vname+'」は、':'',L=[];
  L.push(nm+(d<=30?'みじかい日々のなかで、みんなで力をあわせて、村を守りきった。':d<=50?'ひとつずつ、くらしをかさねながら、村を守りきった。':'ゆっくりと時間をかけて、くらしといっしょに育った村。'));
  if(now>d+1)L.push('ヌシ様が帰ってきてから、'+(now-d)+'日がたった。');return L}
function reflectEnd(){return WD===KAZAN?'火山のふもとに、あたたかい湯気と、にぎやかな声がもどった。':'草原に、花と、なかまの笑い声がもどった。'}
function reflectBody(T,body){T.textContent='村のふりかえり';const bk=el('<button class="btn back" aria-label="思い出帳にもどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('menu','record')};T.before(bk);
  const P=t=>{const p=el('<p class="story"></p>');p.textContent=t;return p};
  for(const t of reflectIntro())body.appendChild(P(t));
  const sec=(h,rows)=>{if(!rows.length)return;const s=el('<div class="sec"><h3></h3><div class="rows"></div></div>');s.querySelector('h3').textContent=h;for(const t of rows){const r=rowEl(t,'');r.querySelector('b').style.whiteSpace='normal';s.querySelector('.rows').appendChild(r)}body.appendChild(s)};
  sec('なかよしになったなかま',reflectPairs());sec('ととのえた居場所',reflectPlaces());sec('見つけたスポット',reflectSpots());sec('村で生まれた思い出',reflectMemories());
  {const G=(S.gone||[]).filter(e=>!e.back);if(G.length)sec('いっしょにいたなかま',[G.slice(-3).map(e=>e.name).join('・')+'といた日々も、この村の思い出。'])}
  body.appendChild(P(reflectEnd()));
  const b=el('<button class="btn" style="width:100%;margin-top:10px">クリアまでの記録</button>');b.onclick=()=>{sfx('tap');openSheet('clearrec')};body.appendChild(b)}
function clearRecBody(T,body){T.textContent='クリアまでの記録';const bk=el('<button class="btn back" aria-label="もどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('reflect')};T.before(bk);
  const c=S.clearRec,R=[];
  if(c){R.push(['クリアした日',c.d+'日め '+c.h+'時']);if(c.ps>0)R.push(['あそんだ時間',playTimeText(c.ps)]);R.push(['のりこえた夜',c.n+'回'],['追いはらった「コワイノ」',c.k+'ひき'],['オオカゲ',c.b+'回'],['よんだせいれい',c.sm+'人'],['いたせいれい',c.res+'人'],['消えてしまったせいれい',c.dt+'人'],['村レベル','Lv'+c.lv])}
  else{R.push(['クリアした日',clearDayOf()+'日め']);const p=S.score&&S.score.parts||[];for(const q of p)if(q[0]!=='クリアした日')R.push([q[0]==='せいれい'?'いたせいれい':q[0],q[1]])}
  const st=el('<div class="sec"><div class="recs"></div></div>'),rw=st.querySelector('.recs');for(const[a,v]of R){const d=el('<div class="st"><span></span><b></b></div>');d.firstChild.textContent=a;d.lastChild.textContent=v;rw.appendChild(d)}body.appendChild(st)}
function reflectSec(body){if(!reflectOK())return;const s=el('<div class="sec"><h3>この村のおわりに</h3><div style="display:flex;flex-direction:column;gap:8px"></div></div>'),w=s.lastElementChild;
  for(const[t,k]of[['村のふりかえり','reflect'],['クリアまでの記録','clearrec']]){const b=el('<button class="btn" style="width:100%"></button>');b.textContent=t;b.onclick=()=>{sfx('tap');openSheet(k)};w.appendChild(b)}body.appendChild(s)}
