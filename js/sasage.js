/* 季節のささげもの（スターデューバレーのバンドルのような物）：季節ごとに4つ、神殿に「ささげもの」が出る。
   神殿をタップ → 「とどける」で、せいれいが箱から神殿へはこぶ（おたきあげと同じはこび方：S.sasaQ → sasaget → r.sasa → sasa）。
   1つそろうごとにパワー（SASA の pt）、4つともそろうと設計図（もらえないときはパワー SASAALL）。季節がかわると、そろわなかった物もふくめて、べつの4つにかわる。
   中身は、そのステージで手に入る物だけ（SASA の st：u どこでも・g 草原・v 火山）。セーブは S.sasa（k：季節の番号 seasonKey・L：[{i,got,done}]・all）。思い出帳の場面では出さない。 */
const SASA=[/* st：u どこでも・g 草原・v 火山。sea：その季節（0 春・1 夏・2 秋・3 冬）。t：束のひとこと */
  {n:'はるのピクニック',st:'g',sea:0,need:{'f:ck58':1,'f:tamasand':1},pt:30,t:'はるの野原で食べるごはん。いっしょに、春をよろこぼう。'},
  {n:'はるの川',st:'g',sea:0,need:{'f:nijimasu':2,'f:koi':1},pt:30,t:'雪どけの水で、川がすんでいる。春いちばんの魚を。'},
  {n:'はるのおかし',st:'g',sea:0,need:{'f:dango':2,'f:ck67':1},pt:30,t:'あまいにおいは、春の風にのって、とおくまでとどく。'},
  {n:'はじめての布',st:'u',sea:0,need:{nuno:2,funba:3},pt:30,t:'ことしはじめて、おった布。草のにおいが、まだのこっている。'},
  {n:'はたけのはじまり',st:'u',sea:0,need:{'f:mugi':3,'f:tomato':3},pt:30,t:'さいしょにとれた畑のめぐみを、まず守り神へ。'},
  {n:'はるのたけのこ',st:'v',sea:0,need:{'f:takenoko':4,'f:ck13':1},pt:30,t:'土をもちあげて、ぐんぐんのびる。春の山のちから。'},
  {n:'ゆきどけの川',st:'v',sea:0,need:{'f:yamame':2,'f:iwana':1},pt:30,t:'山の雪がとけて、川がうたいはじめた。'},
  {n:'なつのすずみ',st:'g',sea:1,need:{'f:ck10':1,'f:ck60':1},pt:30,t:'あつい日に、ひんやりした物を。のどが、ほっとする。'},
  {n:'あまいなつ',st:'g',sea:1,need:{'f:ck7':2,'f:apple':3},pt:30,t:'おひさまをたっぷりあびた、あまい実。'},
  {n:'ゆうやけのつり',st:'g',sea:1,need:{'f:yumasu':2,'f:nijimasu':1},pt:30,t:'空が赤くなるころにだけ、顔を出す魚がいる。'},
  {n:'ゆうやけのつり',st:'v',sea:1,need:{'f:ayu':2,'f:yamame':1},pt:30,t:'空が赤くなるころにだけ、顔を出す魚がいる。'},
  {n:'たき火のよる',st:'u',sea:1,need:{'f:ck36':1,'f:ck5':2},pt:30,t:'みじかい夏の夜は、火をかこんで、みんなで食べる。'},
  {n:'なつのはたけ',st:'u',sea:1,need:{'f:tomato':4,'f:ck20':1},pt:30,t:'まぶしい日ざしで、葉がぴんとひらいた。'},
  {n:'温泉のさかな',st:'v',sea:1,need:{'f:yuami':2,'f:ck100':1},pt:30,t:'あたたかい湯の中で、のんびりくらす魚。'},
  {n:'火の山のかけら',st:'v',sea:1,need:{sulfur:3,crystal:1},pt:30,t:'山のおくで、熱をためてきた石。'},
  {n:'みのりのかご',st:'u',sea:2,need:{'f:imo':4,'f:mugi':4,'f:tomato':2},pt:40,t:'いっぱい実った秋の畑。かごいっぱいの、ありがとう。'},
  {n:'きのこがり',st:'u',sea:2,need:{'f:ck15':2,'f:ck97':1},pt:30,t:'木のねもとに、ひょっこり。秋の森のおくりもの。'},
  {n:'あきのパン',st:'u',sea:2,need:{'f:komugiko':3,'f:ck17':1},pt:30,t:'ひいたばかりの粉で、こんがりやいたパン。'},
  {n:'あめの日のつり',st:'g',sea:2,need:{'f:dojo':1,'f:funa':2},pt:30,t:'雨の日の池には、いつもはかくれている魚がいる。'},
  {n:'あめの日のつり',st:'v',sea:2,need:{'f:akahara':1,'f:iwana':2},pt:30,t:'雨の日の池には、いつもはかくれている魚がいる。'},
  {n:'りんごのあき',st:'g',sea:2,need:{'f:ck25':1,'f:ck8':1},pt:30,t:'赤くなったりんごを、あまく、あたたかく。'},
  {n:'やまのごちそう',st:'v',sea:2,need:{'f:ck94':1,'f:ck14':1},pt:30,t:'山でとれた物を、山の火で。'},
  {n:'あたたかいごはん',st:'g',sea:3,need:{'f:ck11':1,'f:ck40':1},pt:30,t:'さむい夜に、からだのしんまで、ぽかぽかに。'},
  {n:'あたたかいごはん',st:'v',sea:3,need:{'f:ck21':1,'f:ck95':1},pt:30,t:'さむい夜に、からだのしんまで、ぽかぽかに。'},
  {n:'ふゆのしたく',st:'u',sea:3,need:{nuno:3,eda:10},pt:30,t:'つめたい風がふく前に、あたたかい布と、たきぎを。'},
  {n:'ふゆのおやつ',st:'g',sea:3,need:{'f:ck76':1,'f:ck8':1},pt:30,t:'まどの外は雪。あまいにおいで、家の中があたたかい。'},
  {n:'たまごとミルク',st:'g',sea:3,need:{'f:egg':2,'f:milk':2,wool:2},pt:40,t:'村の生き物たちからの、やさしいめぐみ。'},
  {n:'ふゆのたくわえ',st:'u',sea:3,need:{'f:imo':6,'f:komugiko':2},pt:30,t:'春まで、みんながおなかをすかせないように。'},
  {n:'てつのそなえ',st:'v',sea:3,need:{iiron:2,icopper:2},pt:30,t:'炉の火できたえた、かたい金物。'}];
const SASAN=4,SASAALL=100;
function sasaOn(){return !!(S&&STATUE>=0&&!(typeof MEMRUN!=='undefined'&&MEMRUN)&&!(typeof IS_STORY_REPLAY!=='undefined'&&IS_STORY_REPLAY))}
function sasaPool(sea){const st=WD===KUSA?'g':WD===KAZAN?'v':null;return SASA.map((b,i)=>i).filter(i=>(SASA[i].st==='u'||SASA[i].st===st)&&(sea==null||SASA[i].sea==null||SASA[i].sea===sea))}/* その土地で手に入る、その季節の束 */
function sasaPick(k){/* 季節の番号 k から、その季節の束を4つえらぶ（同じ季節なら、いつも同じ） */const P=sasaPool(seasonOf(dayNo())),out=[];let s=k*7+WD*13;while(out.length<Math.min(SASAN,P.length)){const i=P[Math.floor(hash(s++)*P.length)%P.length];if(!out.includes(i))out.push(i)}return out}
function sasaEnsure(){/* いまの季節のささげものがなければ作る。かわったら、たのんでいた分はやめる */if(!sasaOn())return null;const k=seasonKey();if(S.sasa&&S.sasa.k===k&&S.sasa.v===2)return S.sasa;
  if(S.sasa&&S.sasa.k===k){/* 束をかえる前のセーブ：とどけた物は箱へもどし、そろえた数はそのまま（同じ季節にパワーを2回もらわない） */const o=S.sasa,nd=o.L.filter(b=>b.done).length;for(const b of o.L)if(!b.done)for(const q in b.got||{})availAdd(q,b.got[q]);S.sasa={k,v:2,L:sasaPick(k).map((i,n)=>({i,got:{},done:n<nd?1:0})),all:o.all||0};S.sasaQ={};return S.sasa}
  const fresh=!!S.sasa;S.sasa={k,v:2,L:sasaPick(k).map(i=>({i,got:{},done:0})),all:0};S.sasaQ={};if(fresh)memo('','季節のささげものが、かわった');return S.sasa}
function sasaKeyN(key){return key.startsWith('f:')?(FOODS[key.slice(2)]||{}).name||key:MATN[key]||key}
function sasaKeyIc(key){return key.startsWith('f:')?foodEmo(key.slice(2)):matIc(key)}
function sasaLeft(b){/* その束の、まだとどいていない数（たのんだ分・はこんでいる分はひかない） */const N=SASA[b.i].need,R={};for(const k in N){const v=N[k]-(b.got[k]||0);if(v>0)R[k]=v}return R}
function sasaComing(){/* たのんだ分と、はこんでいる分 */const R={};const add=o=>{for(const k in o||{})R[k]=(R[k]||0)+o[k]};add(S.sasaQ);for(const r of S.res)add(r.sasa);return R}
function sasaAsk(b){/* 「とどける」：箱にある分を、のこりの数まで、せいれいにたのむ */const L=sasaLeft(b),C=sasaComing(),Q=S.sasaQ||(S.sasaQ={});let n=0;
  for(const k in L){const want=L[k]-(C[k]||0);if(want<=0)continue;const t=Math.min(want,availOf(k));if(t>0){rsvAdd({[k]:t});Q[k]=(Q[k]||0)+t;n+=t}}return n}
function sasaGive(r){/* 神殿にとどけた：はじめの束から順にうめる。いらなくなった分は箱へもどす */const s=sasaEnsure(),m=r.sasa||{};r.sasa=null;if(!s){for(const k in m)availAdd(k,m[k]);return}
  for(const k in m){let v=m[k];for(const b of s.L){if(b.done||v<=0)continue;const need=(SASA[b.i].need[k]||0)-(b.got[k]||0);if(need<=0)continue;const t=Math.min(need,v);b.got[k]=(b.got[k]||0)+t;v-=t}if(v>0)availAdd(k,v)}
  burst(STATUE,'furn');addSpiritXp(1,r);sfx('furn');sasaDone(s)}
function sasaDone(s){/* そろった束：パワー。ぜんぶそろったら設計図 */for(const b of s.L){if(b.done||Object.keys(sasaLeft(b)).length)continue;b.done=1;const B=SASA[b.i];memo('','ささげもの「'+B.n+'」をそろえた');toast('ささげもの「'+B.n+'」がそろった','good');rewardPower(B.pt);if(typeof juiceCheer==='function')juiceCheer()}
  if(!s.all&&s.L.every(b=>b.done)){s.all=1;const k=typeof bpOpen==='function'&&bpOpen()?bpGiveNext(null):null;if(!k)rewardPower(SASAALL);toast('季節のささげものが、ぜんぶそろった','good')}}
function sasaBack(r){/* はこんでいる子がいなくなった：箱へもどす */for(const k in r.sasa||{})availAdd(k,r.sasa[k]);r.sasa=null}
function sasaTick(){if(!sasaOn())return;const s=sasaEnsure();if(s&&s.L.some(b=>!b.done&&!Object.keys(sasaLeft(b)).length))sasaDone(s)}/* 数をへらす前に、もうとどけてあった束は、そろったことにする */
/* ---------- ささげものの画面（おそなえ台）：束ごとに、いる物のくぼみがならぶ。まだの所はうすいかげ、そろった物は絵がのる。
   ひらいているあいだに物がとどくと、くぼみに、ことんとおちる（ustk）。束がそろうと「そろった」のハンコ ---------- */
const SASAMOBJ={shina:'weed0g',kasa:'weed0k',kuru:'weed1g',chiri:'weed1k',funba:'weedc'};
function sasaIcURL(k){return isFK(k)?foodIc(k.slice(2)):ICONS[k]||(SASAMOBJ[k]&&BL[SASAMOBJ[k]]?iconURL(SASAMOBJ[k]):null)}
const SASAHOLE={};
function sasaHole(){/* くぼみの絵（28×28のドット。上と左がこいかげ・下と右が光の、彫りこんだみぞ。1ドット1.5px） */const w=WD===KUSA?1:0;if(SASAHOLE[w])return SASAHOLE[w];
  const c=document.createElement('canvas');c.width=c.height=28;const g=c.getContext('2d'),C=w?['#cfae7b','#a8743f','#bf9a64','#f3dfb5']:['#dccaa6','#b49a72','#c9b48c','#fbf3df'];
  for(let y=0;y<28;y++){const i=y===0||y===27?2:y===1||y===26?1:0;g.fillStyle=C[0];g.fillRect(i,y,28-i*2,1);
    g.fillStyle=y<2?C[1]:y===2?C[2]:y===27?C[3]:C[0];if(y<3||y===27)g.fillRect(i,y,28-i*2,1);
    if(y>=2&&y<27){g.fillStyle=C[1];g.fillRect(i,y,1,1);g.fillStyle=C[2];g.fillRect(i+1,y,1,1);g.fillStyle=C[3];g.fillRect(27-i,y,1,1)}}
  return SASAHOLE[w]=c.toDataURL()}
function sasaPop(){/* 神殿をタップ：いまの季節のささげもの */const s=sasaEnsure();if(!s)return toast('神殿。守り神の居場所');
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:360px;width:100%;max-height:86vh;overflow:auto;color:var(--ink)"><b class="t" style="display:block;font-size:15px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 10px"></p><div class="ks"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button></div></div></div>');
  const prev=new Map();let sig='',first=true;
  const upd=()=>{const C=sasaComing(),ks=o.querySelector('.ks');
    const sg=JSON.stringify([s.L.map(b=>[b.got,b.done]),C,s.L.map(b=>Object.keys(SASA[b.i].need).map(availOf))]);if(sg===sig)return;sig=sg;ks.innerHTML='';
    o.querySelector('.t').textContent=SEASONS[seasonOf(dayNo())]+'のささげもの';
    o.querySelector('.n').textContent=(s.all?'ぜんぶそろった。':typeof bpOpen==='function'&&bpOpen()?'ぜんぶそろうと、設計図。':'ぜんぶそろうと、パワー+'+SASAALL+'。')+s.L.filter(b=>b.done).length+'/'+s.L.length;
    s.L.forEach((b,bi)=>{const B=SASA[b.i],row=el('<div class="row sasab" style="display:block;position:relative;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><b class="bn"></b><span class="bp note" style="position:relative;min-width:32px;min-height:15px"></span></div><div class="ft note" style="margin:2px 0 6px"></div><div class="sl" style="display:flex;flex-wrap:wrap;gap:4px 6px;margin-bottom:6px"></div></div>');
      row.querySelector('.bn').textContent=B.n;row.querySelector('.bp').textContent=b.done?'':'パワー+'+B.pt;/* そろった束は、ここにハンコ */row.querySelector('.ft').textContent=B.t||'';
      const P=prev.get(bi)||{};let drop=false;
      for(const k of Object.keys(B.need)){const n=B.need[k],g=b.done?n:Math.min(n,b.got[k]||0),full=g>=n,u=sasaIcURL(k),cell=el('<div style="width:64px;text-align:center"><div class="hole" style="width:42px;height:42px;margin:0 auto;position:relative;background-size:42px 42px;image-rendering:pixelated"></div><div class="c note" style="font-size:10px;line-height:15px"></div><div class="h note" style="font-size:10px;line-height:15px"></div></div>');
        const h=cell.querySelector('.hole');h.style.backgroundImage='url('+sasaHole()+')';h.title=sasaKeyN(k);
        if(u){const im=el('<img alt="" style="position:absolute;left:6px;top:6px;width:30px;height:30px">');im.src=u;im.alt=sasaKeyN(k);if(!g)im.style.cssText+=';opacity:.3;filter:grayscale(1) brightness(.55)';else if(!full)im.style.cssText+=';opacity:.75';h.appendChild(im);
          if(!first&&g>(P[k]||0)){im.style.animation='ustk .45s steps(1) both';drop=true}}/* とどいた：くぼみに、ことんとおちる */
        cell.querySelector('.c').textContent=sasaKeyN(k)+' '+g+'/'+n;if(!b.done)cell.querySelector('.h').textContent='もっている'+availOf(k);
        row.querySelector('.sl').appendChild(cell);P[k]=g}
      prev.set(bi,P);
      if(drop){const k0=Object.keys(B.need).find(k=>(b.got[k]||0)>0);if(k0&&typeof itemSnd==='function')itemSnd(isFK(k0)?k0.slice(2):k0)}
      if(b.done){const wasDone=P.done;P.done=1;if(!first&&!wasDone&&typeof uiStamp==='function')setTimeout(()=>uiStamp(row.querySelector('.bp'),true,'そろった'),drop?420:0);else{const st=el('<img alt="そろった" style="position:absolute;right:8px;top:2px;width:32px;height:32px;image-rendering:pixelated;opacity:.92">');st.src=stampCanvas('そろった',32).toDataURL();row.appendChild(st)}}
      else{const L=sasaLeft(b),wait=Object.keys(L).reduce((a,k)=>a+Math.min(L[k],C[k]||0),0),can=Object.keys(L).some(k=>L[k]-(C[k]||0)>0&&availOf(k)>0),bt=el('<button class="btn" style="width:100%"></button>');
        bt.textContent=wait?'とどける（はこんでいる'+wait+'）':'とどける';lackOn(bt,can?'':'とどけられる物がありません');
        bt.onclick=()=>{if(!can)return;const n=sasaAsk(b);if(n){sfx('quest');toast('ささげものをたのんだ','good')}upd()};row.appendChild(bt)}
      ks.appendChild(row)});first=false};
  const tm=setInterval(()=>{if(!o.isConnected)return clearInterval(tm);upd()},400);/* ひらいているあいだに、せいれいがとどけた物も出す */
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};upd();document.body.appendChild(o)}
