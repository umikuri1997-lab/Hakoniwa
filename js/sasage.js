/* 季節のささげもの（スターデューバレーのバンドルのような物）：季節ごとに4つ、神殿に「ささげもの」が出る。
   神殿をタップ → 「とどける」で、せいれいが箱から神殿へはこぶ（おたきあげと同じはこび方：S.sasaQ → sasaget → r.sasa → sasa）。
   1つそろうごとにパワー（SASA の pt）、4つともそろうと設計図（もらえないときはパワー SASAALL）。季節がかわると、そろわなかった物もふくめて、べつの4つにかわる。
   中身は、そのステージで手に入る物だけ（SASA の st：u どこでも・g 草原・v 火山）。セーブは S.sasa（k：季節の番号 seasonKey・L：[{i,got,done}]・all）。思い出帳の場面では出さない。 */
const SASA=[
  {n:'もりのめぐみ',st:'u',need:{wood:20,eda:10},pt:30},
  {n:'いしのつみき',st:'u',need:{stone:20},pt:30},
  {n:'はたけのめぐみ',st:'u',need:{'f:imo':8},pt:30},
  {n:'こかげのきのこ',st:'u',need:{'f:kinoko':4,funba:6},pt:30},
  {n:'ふんばりのたば',st:'u',need:{funba:12},pt:20},
  {n:'くさはらのたば',st:'g',need:{shina:6,kasa:6},pt:30},
  {n:'あまいベリー',st:'g',need:{'f:berry':8},pt:30},
  {n:'たけのたば',st:'v',need:{bamboo:12},pt:30},
  {n:'たけのこのごちそう',st:'v',need:{'f:takenoko':6},pt:30},
  {n:'ほのおの草',st:'v',need:{kuru:6,chiri:6},pt:30}];
const SASAN=4,SASAALL=100;
function sasaOn(){return !!(S&&STATUE>=0&&!(typeof MEMRUN!=='undefined'&&MEMRUN)&&!(typeof IS_STORY_REPLAY!=='undefined'&&IS_STORY_REPLAY))}
function sasaPool(){const st=WD===0?'g':WD===1?'v':null;return SASA.map((b,i)=>i).filter(i=>SASA[i].st==='u'||SASA[i].st===st)}
function sasaPick(k){/* 季節の番号 k から、4つをえらぶ（同じ季節なら、いつも同じ） */const P=sasaPool(),out=[];let s=k*7+WD*13;while(out.length<Math.min(SASAN,P.length)){const i=P[Math.floor(hash(s++)*P.length)%P.length];if(!out.includes(i))out.push(i)}return out}
function sasaEnsure(){/* いまの季節のささげものがなければ作る。かわったら、たのんでいた分はやめる */if(!sasaOn())return null;const k=seasonKey();if(S.sasa&&S.sasa.k===k)return S.sasa;
  const fresh=!!S.sasa;S.sasa={k,L:sasaPick(k).map(i=>({i,got:{},done:0})),all:0};S.sasaQ={};if(fresh)memo('','季節のささげものが、かわった');return S.sasa}
function sasaKeyN(key){return key.startsWith('f:')?(FOODS[key.slice(2)]||{}).name||key:MATN[key]||key}
function sasaKeyIc(key){return key.startsWith('f:')?foodEmo(key.slice(2)):matIc(key)}
function sasaLeft(b){/* その束の、まだとどいていない数（たのんだ分・はこんでいる分はひかない） */const N=SASA[b.i].need,R={};for(const k in N){const v=N[k]-(b.got[k]||0);if(v>0)R[k]=v}return R}
function sasaComing(){/* たのんだ分と、はこんでいる分 */const R={};const add=o=>{for(const k in o||{})R[k]=(R[k]||0)+o[k]};add(S.sasaQ);for(const r of S.res)add(r.sasa);return R}
function sasaAsk(b){/* 「とどける」：箱にある分を、のこりの数まで、せいれいにたのむ */const L=sasaLeft(b),C=sasaComing(),Q=S.sasaQ||(S.sasaQ={});let n=0;
  for(const k in L){const want=L[k]-(C[k]||0);if(want<=0)continue;const t=Math.min(want,availOf(k));if(t>0){rsvAdd({[k]:t});Q[k]=(Q[k]||0)+t;n+=t}}return n}
function sasaGive(r){/* 神殿にとどけた：はじめの束から順にうめる。いらなくなった分は箱へもどす */const s=sasaEnsure(),m=r.sasa||{};r.sasa=null;if(!s){for(const k in m)availAdd(k,m[k]);return}
  for(const k in m){let v=m[k];for(const b of s.L){if(b.done||v<=0)continue;const need=(SASA[b.i].need[k]||0)-(b.got[k]||0);if(need<=0)continue;const t=Math.min(need,v);b.got[k]=(b.got[k]||0)+t;v-=t}if(v>0)availAdd(k,v)}
  burst(STATUE,'furn');addSpiritXp(1,r);sfx('furn');
  for(const b of s.L){if(b.done||Object.keys(sasaLeft(b)).length)continue;b.done=1;const B=SASA[b.i];memo('','ささげもの「'+B.n+'」をそろえた');toast('ささげもの「'+B.n+'」がそろった','good');rewardPower(B.pt);if(typeof juiceCheer==='function')juiceCheer()}
  if(!s.all&&s.L.every(b=>b.done)){s.all=1;const k=typeof bpOpen==='function'&&bpOpen()?bpGiveNext(null):null;if(!k)rewardPower(SASAALL);toast('季節のささげものが、ぜんぶそろった','good')}}
function sasaBack(r){/* はこんでいる子がいなくなった：箱へもどす */for(const k in r.sasa||{})availAdd(k,r.sasa[k]);r.sasa=null}
function sasaTick(){if(!sasaOn())return;sasaEnsure()}
function sasaPop(){/* 神殿をタップ：いまの季節のささげもの */const s=sasaEnsure();if(!s)return toast('女神像。守り神の居場所');
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;max-height:86vh;overflow:auto;color:var(--ink)"><b class="t" style="display:block;font-size:15px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 10px"></p><div class="ks"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button></div></div></div>');
  const upd=()=>{const C=sasaComing(),ks=o.querySelector('.ks');ks.innerHTML='';o.querySelector('.t').textContent=SEASONS[seasonOf(dayNo())]+'のささげもの';
    o.querySelector('.n').textContent=(s.all?'ぜんぶそろった。':typeof bpOpen==='function'&&bpOpen()?'ぜんぶそろうと、設計図。':'ぜんぶそろうと、パワー+'+SASAALL+'。')+s.L.filter(b=>b.done).length+'/'+s.L.length;
    for(const b of s.L){const B=SASA[b.i],row=el('<div class="sasab" style="margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><b class="bn"></b><span class="bp note"></span></div><div class="its note" style="margin:2px 0 4px"></div></div>');
      ckSet(row.querySelector('.bn'),(b.done?'✓ ':'')+B.n);row.querySelector('.bp').textContent='パワー+'+B.pt;
      row.querySelector('.its').textContent=Object.keys(B.need).map(k=>sasaKeyN(k)+'（'+Math.min(B.need[k],b.got[k]||0)+'/'+B.need[k]+'）').join('・');
      if(!b.done){const L=sasaLeft(b),wait=Object.keys(L).reduce((a,k)=>a+Math.min(L[k],C[k]||0),0),can=Object.keys(L).some(k=>L[k]-(C[k]||0)>0&&availOf(k)>0),bt=el('<button class="btn" style="width:100%"></button>');
        bt.textContent='とどける';if(wait)row.querySelector('.its').textContent+='　はこんでいる'+wait;/* 運んでいる数は、ボタンでなく行に出す */lackOn(bt,can?'':'とどけられる物がありません');
        bt.onclick=()=>{if(!can)return;const n=sasaAsk(b);if(n){sfx('quest');toast('ささげものをたのんだ','good')}upd()};row.appendChild(bt)}
      ks.appendChild(row)}};
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};upd();document.body.appendChild(o)}
