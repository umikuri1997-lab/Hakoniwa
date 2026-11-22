/* 料理：料理の家具に材料を入れると、その組み合わせの料理ができる（表は cook-table.js）。
   家具ごとに「おまかせ」（作ったことのある料理を、せいれいが箱の材料からえらぶ）か「入れる」（えらんだ材料を作りつづける）。
   表にない組み合わせは、ふしぎな料理。作るまで名前はわからない（S.cookKn：作った組み合わせ→料理）。 */
for(const D of COOKD)if(D.f)FOODS[D.id]=D.f;
FOODS.fsg1={name:'ふしぎな料理',v:1,pt:1,pw:.45,dish:1,e:'ic:fsg',fx:'たのしさ－10',ef:{fun:-10},bad:1};
FOODS.fsg2={name:'ふしぎな料理',v:2,pt:2,pw:.9,dish:1,e:'ic:fsg',fx:'たのしさ－10',ef:{fun:-10},bad:1};
FOODS.fsg3={name:'ふしぎな料理',v:3,pt:3,pw:1.35,dish:1,e:'ic:fsg',fx:'たのしさ－10',ef:{fun:-10},bad:1};
const COOKBY=new Map(),COOKDI={};for(const D of COOKD){COOKDI[D.id]=D;for(const s of D.st)COOKBY.set(D.i.join('+')+'@'+s,D.id)}/* 組み合わせ→料理（さがすための一覧） */
const COOKIN=['mugi','imo','tomato','berry','apple','egg','milk','fish','takenoko','kinoko','komugiko','unagi','ayu','koi','namazu','yumasu'];/* 入れられる材料（さかなは、どの魚でも） */
const SPFISH=new Set(['unagi','ayu','koi','namazu','yumasu']);/* とくべつな料理のある魚 */
const COOKMAX=3;
const cookKey=(ins,st)=>[...ins].sort().join('+')+'@'+st;
function cookDish(ins,st){/* その家具で、その材料からできる料理（なければ null） */const a=COOKBY.get(cookKey(ins,st));if(a)return a;if(!ins.some(k=>SPFISH.has(k)))return null;const g=ins.map(k=>SPFISH.has(k)?'fish':k);if(new Set(g).size<g.length)return null;return COOKBY.get(cookKey(g,st))||null}/* とくべつな魚で、とくべつな料理がなければ、さかなの料理 */
const RECC=new Map();
function recOf(key){/* 料理の作り方 {key,out,need,time,el,st}。key は「材料+材料@家具」。前のセーブの料理の名前（soup など）も読める */if(!key)return null;let R=RECC.get(key);if(R)return R;
  let k=key;if(k.indexOf('@')<0){const D=COOKDI[k];if(!D)return null;k=D.i.join('+')+'@'+D.st[0]}
  const [a,st]=k.split('@'),ins=a.split('+').filter(x=>FOODS[x]);if(!ins.length||!COOKST.has(st))return null;
  const id=cookDish(ins,st),D=id&&COOKDI[id],need={};for(const x of ins)need[x]=1;
  R={key:k,out:id||'fsg'+Math.min(3,ins.length),need,time:D?D.time:42,el:D?D.el:null,st,dish:!!D};RECC.set(key,R);RECC.set(k,R);return R}
let RECIPES=COOKD.map(D=>recOf(D.i.join('+')+'@'+D.st[0]));/* 料理ごとに1つ（説明・一覧のため） */
function cingBack(r){/* 料理をやめた：持っていた材料は箱へ */if(!r.cing)return;const N=r.cing.nd||needR(recOf(r.cing.rec),r);for(const k in N)addFood(k,N[k]);r.cing=null}
function cookElOK(R,r){return !!R&&(R.el==null||R.el===r.elem)}/* ふしぎな料理は、だれでも作る */
function ovenMode(q){const M=(S.ovenSet||{})[q];return M&&typeof M==='object'?M:null}
function cookHas(R,r){/* 箱の材料（持っている分も）で作れるか */const N=needR(R,r),g=r&&r.cgot&&r.cgot.rec===R.key?r.cgot.m:{};return Object.keys(N).every(k=>(S.fs[k]||0)+(g[k]||0)>=N[k])}
function cookKnownAt(st){/* その家具で作ったことのある組み合わせ */const K=S.cookKn||{},o=[];for(const k in K)if(k.endsWith('@'+st)){const R=recOf(k);if(R)o.push(R)}return o}
function cookPick(q,r){/* その家具で、そのせいれいがいま作る料理 */const M=ovenMode(q);if(!M)return null;const st=S.obj[q];
  if(M.m==='in'){const R=M.in&&M.in.length?recOf(cookKey(M.in,st)):null;return R&&cookElOK(R,r)&&cookHas(R,r)?R:null}
  if(M.m==='auto'){const L=cookKnownAt(st).filter(R=>R.dish&&!FOODS[R.out].bad&&cookElOK(R,r)&&cookHas(R,r));if(!L.length)return null;const h=r.cgot&&L.find(R=>R.key===r.cgot.rec);return h||pick(L)}return null}/* おまかせは、作ったことのある料理だけ（ふしぎな料理・おいしくなさそうな料理はえらばない） */
const COOKNEW=[];
function cookLearn(R){/* 作った組み合わせをおぼえる。はじめての料理は、大きな知らせ */if(!R||MEMRUN)return;const K=S.cookKn||(S.cookKn={});if(K[R.key])return;const fresh=!Object.values(K).includes(R.out);K[R.key]=R.out;if(fresh)COOKNEW.push({state:S,out:R.out,key:R.key})}
function cookNewTick(){while(COOKNEW.length&&COOKNEW[0].state!==S)COOKNEW.shift();if(!COOKNEW.length||GIFT_ACTIVE)return;const g=COOKNEW.shift(),F=FOODS[g.out];if(!F)return;
  GIFT_ACTIVE=true;const ov=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="あたらしい料理"></div>'),card=el('<div class="idea-card"><div class="idea-symbol">'+pxi('paper')+'</div><h2>あたらしい料理！</h2><div class="idea-items"></div><p class="note" style="margin:6px 0 0"></p></div>');
  const it=el('<div class="idea-item"></div>'),img=document.createElement('img'),nm=document.createElement('span');img.src=foodIc(g.out)||'';img.alt='';if(typeof juiceNameFlip==='function')juiceNameFlip(nm,F.name);else nm.textContent=F.name;it.append(img,nm);/* ？？？が1字ずつめくれて名前に */card.querySelector('.idea-items').append(it);card.querySelector('.note').textContent='材料：'+cookInTxt(recOf(g.key))+(F.fx?'　'+F.fx:'');
  const b=el('<button class="btn pri" type="button">とじる</button>');b.disabled=true;card.append(b);ov.append(card);document.body.append(ov);sfx('good');setTimeout(()=>{if(ov.isConnected)b.disabled=false},650);b.onclick=()=>{if(b.disabled)return;ov.remove();GIFT_ACTIVE=false}}
function cookInTxt(R){return R?Object.keys(R.need).map(k=>FOODS[k].name).join('・'):''}
function cookStTxt(D){return D.st.map(s=>BL[s].name).join('・')}
function cookMigrate(){/* 前のセーブ：いまの17の料理は作ったことに。えらんであった料理は「入れる」に。とちゅうの料理は、材料を箱へ */if(S.flags.cook2)return;S.flags.cook2=1;const K=S.cookKn||(S.cookKn={});
  for(const D of COOKD)if(!D.f)K[D.i.join('+')+'@'+D.st[0]]=D.id;
  const O=S.ovenSet||{};for(const q in O)if(typeof O[q]==='string'){const D=COOKDI[O[q]];if(D&&COOKST.has(S.obj[q])){const s=D.st.includes(S.obj[q])?S.obj[q]:null;O[q]=s?{m:'in',in:D.i.slice()}:{m:'auto'}}else delete O[q]}
  for(const r of S.res||[]){if(r.cgot)cgBack(r);if(r.cing&&r.cing.rec&&r.cing.rec.indexOf('@')<0){const R=recOf(r.cing.rec);if(R)r.cing.rec=R.key;else cingBack(r)}}}
function cookState(j,R){/* えらんだ料理のいまのようす：作っている・作るせいれいがいない・材料が足りない・まっている */
  if(S.res.some(q=>q.act&&q.act.type==='cook'&&q.act.obj===j))return '作っている';
  const o=useOwner(j);if(!S.res.some(q=>cookElOK(R,q)&&(!o||o===q)))return '作るせいれいがいない';
  return cookHas(R,null)?'まっている':'材料が足りない'}
/* 料理の家具の画面 */
function cookSheet(body,j){if(!S.ovenSet)S.ovenSet={};const st=S.obj[j],M=ovenMode(j);
  {const tb=el('<div class="ctabs"></div>');for(const[m,nm]of[['off','やすむ'],['auto','おまかせ'],['in','入れる']]){const on=m==='off'?!M:M&&M.m===m,t=el('<button class="ctab'+(on?' on':'')+'"></button>');t.textContent=nm;t.onclick=()=>{if(m==='off')delete S.ovenSet[j];else if(m==='auto')S.ovenSet[j]={m:'auto'};else S.ovenSet[j]={m:'in',in:M&&M.m==='in'?M.in:[]};sfx('next');renderSheet()};tb.appendChild(t)}body.appendChild(tb)}
  if(M&&M.m==='auto')body.appendChild(el('<p class="story">作ったことのある料理の中から、せいれいが箱の材料でえらんで作る。</p>'));
  if(M&&M.m==='in'){const rows=el('<div class="rows"></div>'),R=M.in.length?recOf(cookKey(M.in,st)):null,kn=R&&(S.cookKn||{})[R.key];
    const r=rowEl(M.in.length?cookInTxt(R):'材料をえらんでいない',R?(kn?'できる料理：'+FOODS[R.out].name+(R.el?'／作る：'+ELEM[R.el].name:''):'できる料理：？？？'):'',R&&kn?foodIc(R.out):null);const b=el('<button class="btn">材料をえらぶ</button>');b.onclick=()=>{sfx('tap');cookInPop(j)};r.appendChild(b);rows.appendChild(r);body.appendChild(rows);
    if(R&&!cookHas(R,null))body.appendChild(el('<p class="note">材料が足りない</p>'))}
  {const ms=new Map(Object.entries(S.cookKn||{}).filter(([k])=>k.endsWith('@'+st)));body.appendChild(el('<p class="story">この家具で作った料理（'+ms.size+'）</p>'));const rows=el('<div class="rows"></div>');
    for(const[k,out]of ms){const R=recOf(k),F=FOODS[out];if(!R||!F)continue;const cur=M&&M.m==='in'&&cookKey(M.in,st)===k,has=cookHas(R,null);
      const r=rowEl(F.name+(cur?'（'+cookState(j,R)+'）':''),'材料：'+cookInTxt(R)+(R.el?'／作る：'+ELEM[R.el].name:'')+'／時間：'+R.time+'分'+(F.fx?'／'+F.fx:''),foodIc(out));const b=el('<button class="btn"></button>');b.textContent=cur?'やめる':'これを作る';if(cur)b.classList.add('pri');
      b.onclick=()=>{if(cur)delete S.ovenSet[j];else S.ovenSet[j]={m:'in',in:Object.keys(R.need)};sfx('tap');renderSheet()};r.appendChild(b);if(!has&&!cur){r.style.filter='grayscale(1)';r.style.opacity='.55'}rows.appendChild(r)}
    if(!ms.size)rows.appendChild(nodata('box','まだ作っていない'));body.appendChild(rows)}}
function cookInPop(j){/* 入れる材料をえらぶ（しゅるいごとに1こ、3しゅるいまで） */const st=S.obj[j],M=ovenMode(j),V=new Set(M&&M.m==='in'?M.in:[]);
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:15px;margin-bottom:4px">入れる材料</b><p class="note n" style="margin:0 0 10px"></p><div class="ks" style="display:flex;flex-wrap:wrap;gap:6px;max-height:50vh;overflow:auto"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button><button class="btn pri go">これで作る</button></div></div></div>');
  const seen=S.seenIt||{},fishN=()=>['fish',...FISHK].reduce((a,k)=>a+(S.fs[k]||0),0),L=COOKIN.filter(k=>k==='fish'?fishN()>0||['fish',...FISHK].some(f=>seen['f:'+f]):(S.fs[k]||0)>0||seen['f:'+k]);
  const bs=L.map(k=>{const b=el('<button class="btn"></button>'),n=k==='fish'?fishN():S.fs[k]||0,ic=foodIc(k);b.innerHTML=(ic?'<img src="'+ic+'" alt="" style="width:20px;height:20px;vertical-align:middle;image-rendering:auto"> ':'')+FOODS[k].name+'（'+n+'）';b.onclick=()=>{sfx('notch');if(V.has(k))V.delete(k);else if(V.size<COOKMAX)V.add(k);upd()};o.querySelector('.ks').appendChild(b);return[k,b]});
  const upd=()=>{for(const[k,b]of bs)b.classList.toggle('pri',V.has(k));const R=V.size?recOf(cookKey([...V],st)):null,kn=R&&(S.cookKn||{})[R.key];o.querySelector('.n').textContent=V.size?'できる料理：'+(kn?FOODS[R.out].name:'？？？'):'3しゅるいまで';lackOn(o.querySelector('.go'),V.size?'':'材料をえらんでいません')};
  if(!L.length)o.querySelector('.ks').appendChild(nodata('box','食べ物がない'));
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};o.querySelector('.go').onclick=()=>{if(!V.size)return;S.ovenSet[j]={m:'in',in:[...V]};sfx('tap');o.remove();renderSheet()};
  document.body.appendChild(o);upd()}
function cookZukan(d,add){/* 図鑑の「りょうり」：作った料理だけ */const K=d.cookKn||{},got=new Map();for(const k in K)if(!got.has(K[k]))got.set(K[k],k);
  for(const D of COOKD){if(!got.has(D.id))continue;const F=FOODS[D.id];add(F.name,'材料：'+D.i.map(k=>FOODS[k].name).join('・')+'／作る所：'+cookStTxt(D)+(F.fx?'／'+F.fx:''),foodIc(D.id),'k:plate')}
  for(const n of[1,2,3])if(got.has('fsg'+n)){add('ふしぎな料理',FOODS.fsg1.fx,foodIc('fsg1'),'k:plate');break}}
/* 料理のアイコン：しゅるいごとの16×16のドット（A=1つめの材料の色・B=2つめ・C=3つめ）を、144×144 に9倍で描く */
const CKICO={
bowl:['................','................','......BB.C......','....AAAAAAAA....','...AAABAAAACA...','..kAAAAAAAAAAk..','..wwwwwwwwwwww..','..wWWWWWWWWWWw..','...wWWWWWWWWw...','....wWWWWWWw....','.....wwwwww.....','......dddd......','................','................','................','................'],
cup:['................','.....ggggggg....','.....gBBBBBg....','.....gAAAAAg.gg.','.....gAAAAAgg.g.','.....gAAAAAg..g.','.....gAAAAAg.g..','.....gAAAAAgg...','.....gAAAAAg....','.....gAAAAAg....','.....ggggggg....','......ddddd.....','................','................','................','................'],
skewer:['................','.............tt.','...........AAAt.','..........AAAA..','..........AAAA..','.........tAAA...','.......BBBt.....','......BBBB......','......BBBB......','.....tBBB.......','...CCCt.........','..CCCC..........','..CCCC..........','.tCCC...........','t...............','................'],
plate:['................','................','................','................','.....AAAAA......','...AAAAAAAAB....','..AAAACAAAABBB..','..AAAAAAAAAABB..','.wwAAAAAAAAAAww.','wWWWWWWWWWWWWWWw','.wwwwwwwwwwwwww.','..dddddddddddd..','................','................','................','................'],
bread:['................','................','.....AAAAAA.....','...AAABAABAAA...','..AAAAAAAAAAAA..','..AAABAABAABAA..','..AAAAAAAAAAAA..','..aAAAAAAAAAAa..','..aaaaaaaaaaaa..','...aaaaaaaaaa...','....dddddddd....','................','................','................','................','................'],
cake:['................','.......BB.......','.....BBCBBB.....','....AAAAAAAA....','....aaaaaaaa....','....AAAAAAAA....','....BBBBBBBB....','....AAAAAAAA....','....aaaaaaaa....','..wwwwwwwwwwww..','..wWWWWWWWWWWw..','...wwwwwwwwww...','....dddddddd....','................','................','................'],
salad:['................','................','.....AA.BB......','...AAAABBBCA....','..AACAABBAACA...','..AAAAAAAAAAAA..','..wwwwwwwwwwww..','..wWWWWWWWWWWw..','...wWWWWWWWWw...','....wWWWWWWw....','.....wwwwww.....','......dddd......','................','................','................','................'],
sand:['................','................','........aa......','......aaAAa.....','....aaAAAAAa....','...aAAAAAAAAa...','..aAAAAAAAAAAa..','.aBBBBBBBBBBBBa.','.aCCCCCCCCCCCCa.','.aAAAAAAAAAAAAa.','.aaaaaaaaaaaaaa.','..dddddddddddd..','................','................','................','................'],
dango:['................','.............t..','............t...','..........AAt...','.........AAAA...','.........AAAA...','.......BBAA.....','......BBBB......','......BBBB......','....CCBB........','...CCCC.........','...CCCC.........','....CC..........','..t.............','.t..............','................']};
function ckShade(h,k){const n=parseInt(h.slice(1),16),f=c=>Math.max(0,Math.min(255,Math.round(c*k)));return'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'}
function cookIconsAdd(IC){if(typeof document==='undefined')return;const mk=(typ,cs)=>{const T=CKICO[typ];if(!T)return null;const c=document.createElement('canvas');c.width=c.height=144;const x=c.getContext('2d'),A=cs[0],B=cs[1]||cs[0],C=cs[2]||cs[1]||cs[0];
    const P={A,B,C,a:ckShade(A,.82),k:ckShade(A,.9),w:'#e6dccb',W:'#f4ede0',g:'#c9dbe2',d:'rgba(80,60,40,.18)',t:'#b98a5a'};
    for(let y=0;y<16;y++)for(let i=0;i<16;i++){const ch=T[y][i];if(ch==='.')continue;x.fillStyle=P[ch]||A;x.fillRect(i*9,y*9,9,9)}
    const u=c.toDataURL('image/png');c.width=c.height=0;return u};
  for(const D of COOKD)if(D.ic&&!IC[D.id]){const u=mk(D.ic[0],D.ic.slice(1));if(u)IC[D.id]=u}
  if(!IC.fsg){const u=mk('bowl',['#b58ad8','#7fd0c0','#f2c86a']);if(u)IC.fsg=u}}
