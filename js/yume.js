/* ---------- やりこみ目標 ----------
   メニューの「やりこみ」から、自分でえらんだやりこみ目標を3つまでえらぶ（どのステージでも、はじめから）。
   えらんだ目標は、たっせいしたら、ごほうび（むずかしさでパワー50・100・200、むずかしい目標は設計図も）とハンコ。思い出帳にものこる。
   S.yume：{on:[id,...], done:{id:日}}。目標の数はどれも実数で書く。 */
const YUMEMAX=3,YUMEPT=[50,100,200];/* えらべる数・むずかしさごとのパワー */
const yCnt=(o,f)=>{let n=0;for(const k in o||{})if(!f||f(o[k]))n++;return n};
const yHouseStar=()=>{let m=0;for(const h of typeof HOUSES!=='undefined'?HOUSES:[])m=Math.max(m,j4Stars(houseComfort(h).v));return m};
const ySpots=()=>new Set((SPOTI||[]).map(x=>x.sp.k)).size;
const yHigh=lv=>{let n=0;if(S.hi)for(let j=0;j<W*H;j++)if((S.hi[j]|0)>=lv)n++;return n};
const yCubes=()=>{let n=0;for(const k in S.vx||{})for(const c of S.vx[k])if(c)n++;return n};
const yMates=()=>yCnt(S.bond,v=>v>=30);
const yFunAll=()=>S.res.length>0&&S.res.every(r=>(r.fun||0)>=80)?1:0;
const YUME=[/* c：しゅるい、d：むずかしさ（0・1・2）、n：目標、now：いまの数、need：いる数 */
  {id:'hst3',c:'村づくり',d:1,n:'住み心地★3の家を作ろう',now:yHouseStar,need:3},
  {id:'hst5',c:'村づくり',d:2,n:'住み心地★5の家を作ろう',now:yHouseStar,need:5},
  {id:'sut3',c:'村づくり',d:1,n:'村のすてき度を★3にしよう',now:()=>suteki().st,need:3},
  {id:'sut5',c:'村づくり',d:2,n:'村のすてき度を★5にしよう',now:()=>suteki().st,need:5},
  {id:'spot5',c:'村づくり',d:1,n:'スポットを5しゅるい作ろう',now:ySpots,need:5},
  {id:'house4',c:'村づくり',d:1,n:'家を4けん建てよう',now:()=>typeof HOUSES!=='undefined'?HOUSES.length:0,need:4},
  {id:'high8',c:'地形づくり',d:1,n:'8だんの高台を作ろう',now:()=>yHigh(8),need:1},
  {id:'high8w',c:'地形づくり',d:2,n:'8だんの高台を20マス作ろう',now:()=>yHigh(8),need:20},
  {id:'pond',c:'地形づくり',d:0,n:'ほって池を作ろう',now:()=>(S.cnt||{}).pond||0,need:1},
  {id:'pond30',c:'地形づくり',d:1,n:'ほって作った池を30マスにしよう',now:()=>(S.cnt||{}).pond||0,need:30},
  {id:'cube50',c:'地形づくり',d:1,n:'ブロックを50こつもう',now:yCubes,need:50},
  {id:'mate3',c:'せいれい',d:1,n:'なかよしの組を3つにしよう',now:yMates,need:3},
  {id:'fun',c:'せいれい',d:1,n:'みんなのたのしさを80いじょうにしよう',now:yFunAll,need:1},
  {id:'pop8',c:'せいれい',d:2,n:'せいれいを8人にしよう',now:()=>S.res.length,need:8},
  {id:'fish10',c:'あつめる',d:1,n:'さかなを10しゅるいつろう',now:()=>yCnt(S.fishRec),need:10},
  {id:'cook10',c:'あつめる',d:1,n:'料理を10しゅるい作ろう',now:()=>yCnt(S.cookKn),need:10},
  {id:'crit8',c:'あつめる',d:1,n:'いきものを8しゅるい見つけよう',now:()=>yCnt(S.critRec),need:8},
  {id:'zk60',c:'あつめる',d:2,n:'図鑑のアイテムを60こにしよう',now:()=>yCnt(S.seenIt),need:60}];
const YUMEBY={};for(const Y of YUME)YUMEBY[Y.id]=Y;
const YM=()=>S.yume||(S.yume={on:[],done:{}});
function yumeNow(Y){try{return Math.min(Y.need,Y.now()|0)}catch(e){return 0}}
function yumeOn(id){const M=YM();if(M.on.includes(id)||M.done[id]||M.on.length>=YUMEMAX)return false;M.on.push(id);dirty=true;return true}
function yumeOff(id){const M=YM();M.on=M.on.filter(k=>k!==id)}
let YUMET=0;
function yumeTick(){if(!S||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN)return;const t=performance.now();if(t-YUMET<2000)return;YUMET=t;const M=YM();if(!M.on.length)return;/* 2秒に1回たしかめる */
  for(const id of M.on.slice()){const Y=YUMEBY[id];if(!Y){yumeOff(id);continue}if(yumeNow(Y)<Y.need)continue;yumeOff(id);M.done[id]=dayNo();yumeReward(Y);break}}
function yumeReward(Y){const pt=YUMEPT[Y.d];rewardPower(pt);let bp=null;if(Y.d===2&&typeof bpGiveNext==='function')bp=bpGiveNext(null);if(Y.d===2&&!bp)rewardPower(YUMEPT[1]);/* 設計図がもう出ないときは、かわりにパワー */
  memo('star','目標「'+Y.n+'」をたっせいした');toast('目標たっせい！「'+Y.n+'」','good');if(typeof juiceCheer==='function')juiceCheer();if(sheet==='yume')renderSheet()}
function yumeSheet(body){$('#sheetTitle').textContent='やりこみ目標';
  {const bk=el('<button class="btn back" aria-label="メニューにもどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('menu')};$('#sheetTitle').before(bk)}
  const M=YM();
  {const s=el('<div class="sec"><h3>えらんだ目標（'+M.on.length+'/'+YUMEMAX+'）</h3><div class="rows"></div></div>'),R=s.querySelector('.rows');
    if(!M.on.length)R.appendChild(nodata('paper','まだ、えらんでいないよ'));
    for(const id of M.on){const Y=YUMEBY[id];if(!Y)continue;const r=rowEl(Y.n,Y.c+'　'+yumeNow(Y)+'/'+Y.need,null),b=el('<button class="btn">やめる</button>');b.onclick=()=>{sfx('tap');yumeOff(id);renderSheet()};r.appendChild(b);R.appendChild(r)}body.appendChild(s)}
  for(const c of['村づくり','地形づくり','せいれい','あつめる']){const s=el('<div class="sec"><h3></h3><div class="rows"></div></div>'),R=s.querySelector('.rows');s.querySelector('h3').textContent=c;
    for(const Y of YUME){if(Y.c!==c||M.on.includes(Y.id))continue;const done=!!M.done[Y.id],r=rowEl(Y.n,done?'たっせいした':'ごほうび：パワー'+YUMEPT[Y.d]+(Y.d===2?'・設計図':''),null);
      if(done)r.classList.add('done');else{const b=el('<button class="btn pri">えらぶ</button>');lackOn(b,M.on.length>=YUMEMAX?'えらべるのは'+YUMEMAX+'つまで':'');b.onclick=()=>{if(M.on.length>=YUMEMAX)return;sfx('tap');yumeOn(Y.id);renderSheet()};r.appendChild(b)}R.appendChild(r)}body.appendChild(s)}}
