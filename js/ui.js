'use strict';

/* ---------- UI ---------- */
function toast(msg,kind){if(kind==='good')sfx('good');else if(kind==='warn')sfx('warn');const t=document.createElement('div');t.className='toast'+(kind?' '+kind:'');t.textContent=msg;const box=$('#toasts');box.appendChild(t);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>t.remove(),2800)}
const FEATS={inv:'#dockInv',build:'[data-mode="build"]',remove:'[data-mode="remove"]',craft:'[data-sheet="craft"]',people:'[data-sheet="people"]'};
function applyFeats(){
  if(S.glassT==null&&glassUnlocked())S.glassT=600;/* はじめの10分は無料 */$('#speedBtn').hidden=!(glassUnlocked()||TESTSPD||TESTM);if(!(hasGlass()||TESTM))S.speed=1;if(!TESTM&&S.speed>2)S.speed=1;glassUI();
  for(const k in FEATS)document.querySelector(k==='inv'?FEATS[k]:'#dock '+FEATS[k]).hidden=!S.feat[k]||k==='craft';/* 依頼は依頼ボードから。おそなえ箱は下のバーにも出す */
  document.querySelector('#dock [data-mode="bulk"]').hidden=true;/* 道具は「おく」の中からえらぶ（下のバーには出さない） *//* おそなえ箱のボタン */
  const n=[...document.querySelectorAll('#dock button')].filter(b=>!b.hidden).length;
  $('#dock').style.gridTemplateColumns='repeat('+n+',1fr)';
}
let palOpen=false;/* 「おく」をおすと、アイテム欄が大きくひらく。えらぶと小さくなる */
function setMode(m){
  mode=m;palOpen=m==='build'||m==='bulk';pending=null;selRect=null;$('#confirm').hidden=true;
  if(S&&STATUE<0&&m==='build'&&usable('statue'))sel='statue';else if(sel==='statue'&&STATUE>=0)sel='farm';
  document.querySelectorAll('#dock [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===(m==='bulk'?'build':m)));/* 道具を使っているあいだは「おく」を光らせる */
  $('#palette').hidden=!(m==='build'||m==='bulk');renderPalette();
}
function chip(img,name,cost,cls,onClick,mat){
  const b=document.createElement('button');b.className='chip '+cls;
  b.innerHTML='<img alt=""><span class="nm"></span><span class="cs"></span>';
  b.querySelector('img').src=img;b.querySelector('.nm').textContent=name;const cs=b.querySelector('.cs');cs.textContent=cost;b.onclick=onClick;
  if(mat&&Object.keys(mat).length){const m=document.createElement('span');m.className='mt';m.innerHTML=Object.keys(mat).map(k=>{const h=S.mat[k]||0;return '<span class="mic'+(h>=mat[k]?'':' ng')+'"><img src="'+(ICONS[k]||'')+'" alt="'+MATN[k]+'">'+h+'/'+mat[k]+'</span>'}).join('');b.appendChild(m)}/* 建物に使う素材：持っている数/いる数（足りない素材は赤） */
  return b;
}
function lbl(box,t){const s=document.createElement('span');s.className='pallbl';s.textContent=t;box.appendChild(s)}

function updItemInfo(){const ii=$('#itemInfo');if(!(mode==='build'||mode==='bulk')||!S){ii.hidden=true;return}
  let nm='',ds='';if(mode==='bulk'&&selStamp==='move'){nm='ひっこしミトン';ds=MOVESRC?moveName(MOVESRC)+'を、うつしたい所をタップ':'うつしたい家具・建物をタップ'}else if(mode==='bulk'&&selStamp){if(selStamp.startsWith('swap:')){nm=BL[selStamp.slice(5)].name+'につけかえ';ds='つけかえたい物をタップ'}else{nm=STAMPS[selStamp].name;ds='置きたい場所の左上をタップ'}}
  else if(sel&&BL[sel]){const b=BL[sel];nm=iname(sel);const bm=sel==='tower'?TOWER_MAT():b.mat;ds=(b.kind==='build'?(b.pc?SP(b.pc)+(bm?' '+matHTML(bm):''):''):'所持：'+inv(sel));const hp=withAttr(sel,b.desc||'');if(hp)ds+=' <button class="qbtn" id="iiQ">?</button>';}else ds=esc(ds);
  ii.hidden=!nm;$('#iiName').textContent=nm;$('#iiDesc').innerHTML=ds;const q=$('#iiQ');if(q)q.onclick=e=>{e.stopPropagation();sfx('tap');helpPop(nm,withAttr(sel,BL[sel].desc||''))}}
function renderPalette(){
  if(!S)return;updItemInfo();const box=$('#palItems');box.innerHTML='';
  $('#undoBtn').hidden=mode!=='build';
  const pickItem=id=>()=>{sfx('tap');sel=id;if(pending&&pending.kind==='one'){pending=null;$('#confirm').hidden=true}selStamp=null;renderPalette();const b=BL[id];
    if(mode==='bulk'){if(!S.bulk)return toast('下から道具をえらんでください');toast('ハケで、なぞった範囲をぬれます');palOpen=false;renderPalette();return}
    if(b.kind==='furn'&&!inv(id))toast(b.name+'が足りません','warn');
    else if(b.kind==='block'&&!inv(id))toast(b.name+'がありません');
    else if(b.kind==='plant')toast(inv(id)?'置いた場所にせいれいが植えてくれる':iname(id)+'がありません');
    else if(b.kind==='seed')toast(inv(id)?'たねをまきたい畑をタップ':iname(id)+'がありません');
    else if(b.kind==='build')toast(id==='statue'?'好きな場所をタップ。せいれいが神殿を建ててくれる':'置いた場所にせいれいが建ててくれる');
    if(b.kind==='build'||inv(id)>0){palOpen=false;renderPalette()}};
  $('#palette').classList.toggle('open',palOpen);
  if(!palOpen&&mode==='bulk'){/* ハケ・スタンプ・つけかえも、えらんだら小さくして、マップを見えるように */
    if(selStamp==='move')box.appendChild(chip(toolIcon('mover'),'ひっこしミトン',MOVESRC?moveName(MOVESRC):'うつす','sel',()=>{}));
    else if(selStamp)box.appendChild(chip(selStamp.startsWith('swap:')?iconURL(selStamp.slice(5)):stampIcon(selStamp),selStamp.startsWith('swap:')?BL[selStamp.slice(5)].name:STAMPS[selStamp].name,selStamp.startsWith('swap:')?'×'+inv(selStamp.slice(5)):'スタンプ','sel',()=>{}));
    else if(sel&&BL[sel])box.appendChild(chip(iconURL(sel),iname(sel),'×'+inv(sel),'sel',()=>{}));
    const mb=document.createElement('button');mb.className='chip more';mb.id='palMore';mb.textContent='ほかをえらぶ';mb.onclick=()=>{sfx('tap');palOpen=true;renderPalette()};box.appendChild(mb);return}
  if(!palOpen&&mode==='build'){/* えらんだ物だけを小さく出す */
    if(sel&&BL[sel]){const id=sel,b=BL[id];box.appendChild(chip(iconURL(id),iname(id),b.kind==='build'?(id==='statue'||(id==='watch'&&watchQ())?'むりょう':SP(b.pc)):'×'+inv(id),'sel',()=>{}))}
    const mb=document.createElement('button');mb.className='chip more';mb.id='palMore';mb.textContent='ほかをえらぶ';mb.onclick=()=>{sfx('tap');palOpen=true;renderPalette()};box.appendChild(mb);return}
  if(mode==='bulk'){
    if(S.bulk){lbl(box,'ハケ');box.appendChild(chip(toolIcon('hake'),'ひろびろハケ','下からえらぶ','wide',()=>toast('ぬりたいブロックや種をえらんで、指でなぞろう')))}/* もらった道具だけ出す */
    if(S.mover){lbl(box,'ひっこし');box.appendChild(chip(toolIcon('mover'),'ひっこしミトン','うつす','wide'+(selStamp==='move'?' sel':''),()=>{selStamp='move';MOVESRC=null;palOpen=false;renderPalette();toast('うつしたい家具・建物をタップ')}))}/* ひっこしミトン：家具・建物を、すぐべつの場所へ */
    if(S.stamps){lbl(box,'スタンプ');for(const sid in STAMPS)box.appendChild(chip(stampIcon(sid),STAMPS[sid].name,'スタンプ','wide'+(selStamp===sid?' sel':''),()=>{selStamp=sid;palOpen=false;renderPalette();toast('置きたい場所の左上をタップ')}))}
    if(S.swap){lbl(box,'つけかえ');for(const id of SWAPG.flat().filter(id=>S.unlocked[id])){const k='swap:'+id;box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),selStamp===k?'sel':'',()=>{selStamp=k;palOpen=false;renderPalette();toast('つけかえたい物をタップ')}))}}/* つけかえトンカチ：つながっている柵・塀・家の壁・道・床を、えらんだ種類にまとめてかえる */
    if(!S.bulk)return/* ハケがなければ、ぬるブロック・種は出さない */
  }
  if(mode==='build'&&(S.bulk||S.stamps||S.swap||S.mover)){lbl(box,'どうぐ');/* 道具は「おく」の中でえらぶ */
    if(S.mover)box.appendChild(chip(toolIcon('mover'),'ひっこしミトン','うつす','wide',()=>{sfx('tap');setMode('bulk');selStamp='move';MOVESRC=null;palOpen=false;renderPalette();toast('うつしたい家具・建物をタップ')}));
    if(S.bulk)box.appendChild(chip(toolIcon('hake'),'ひろびろハケ','まとめてぬる','wide',()=>{sfx('tap');setMode('bulk');selStamp=null;toast('ぬりたいブロックや種をえらんで、指でなぞろう')}));
    if(S.stamps)box.appendChild(chip(toolIcon('stamp'),'かたどりスタンプ','スタンプ','wide',()=>{sfx('tap');setMode('bulk');selStamp=null}));
    if(S.swap)box.appendChild(chip(toolIcon('swap'),'つけかえトンカチ','つけかえ','wide',()=>{sfx('tap');setMode('bulk');selStamp=null}))}
  const blocks=STATUE<0?[]:BLOCKS.filter(id=>inv(id)>0&&!(mode==='bulk'&&WALLD.has(id)));
  if(mode==='bulk'&&STATUE>=0&&inv('spike')>0)blocks.push('spike');/* とげの罠も、なぞってまとめて置ける */
  if(blocks.length){lbl(box,'ブロック');for(const id of blocks){const n=inv(id);box.appendChild(chip(iconURL(id),BL[id].name,'×'+n,(n?'':'zero')+(sel===id&&!selStamp?' sel':''),pickItem(id)))}}
  if(mode==='build'){
    for(const [name,ids]of furnitureGroups(FURN.filter(id=>inv(id)>0))){lbl(box,name);for(const id of ids)box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),sel===id?'sel':'',pickItem(id)))}
    {const g=GIFTF.filter(id=>inv(id)>0);if(g.length){lbl(box,'かざり・おみやげ');for(const id of g)box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),sel===id?'sel':'',pickItem(id)))}}/* カミサマのかざり・おまつりのちょうちん（依頼ボードでは作らない物） */
  }
  const plants=S.feat.plant?PLANTS.filter(id=>inv(id)>0):[];
  if(plants.length){lbl(box,'うえる');for(const id of plants)box.appendChild(chip(iconURL(id),iname(id),'×'+inv(id),(inv(id)?'':'zero')+(sel===id&&!selStamp?' sel':''),pickItem(id)))}
  if(mode==='build'&&cnt('farm')){const sd=Object.keys(CROPS).filter(k=>cropOn(k)&&cseed(k)>0);if(sd.length){lbl(box,'たね');for(const k of sd){const id='seed:'+k,n=cseed(k);box.appendChild(chip(iconURL(id),iname(id),'×'+n,(n?'':'zero')+(sel===id?' sel':''),pickItem(id)))}}}
  if(mode==='build'){
    const bLock=id=>STATUE>=0&&BREQ[id]&&lvOK(id)&&!elemCount(BREQ[id]),builds=BUILDS.filter(id=>usable(id)||bLock(id));/* 属性の子がいなくても、ならべて見せる */
    if(builds.length){lbl(box,'建てる');for(const id of builds)box.appendChild(chip(iconURL(id),BL[id].name,id==='statue'||(id==='watch'&&watchQ())?'むりょう':SP(BL[id].pc),(sel===id?'sel':'')+(bLock(id)?' zero':''),bLock(id)?()=>toast(ELEM[BREQ[id]].name+'のせいれいがいると建てられます'):pickItem(id),id==='tower'?TOWER_MAT():(id==='watch'&&watchQ())?null:BL[id].mat))}
    if(S.dig){lbl(box,'だんさ');for(const id of['dig','mound'])box.appendChild(chip(toolIcon(id),BL[id].name,SP(BL[id].pc),sel===id?'sel':'',pickItem(id)))}/* だんさスコップ：けずる・もるを、せいれいにたのむ（建てるのと同じ） */
  }
}
function gaugeHTML(r){
  const g=(l,v,c)=>`<span>${l}</span><div class="bar"><i style="width:${clamp(v,0,100)|0}%;background:${c}"></i></div>`;
  return `<div class="gauges">${g('おなか '+Math.round(r.hunger)+'/'+hMax(r),r.hunger/hMax(r)*100,r.hunger<25?'var(--danger)':'#ffb35c')}${g('たのしさ',r.fun,'var(--pink)')}${g(S.t-(r.eUp||-9)<3?'つかれ（回復中）':'つかれ',100-r.energy,S.t-(r.eUp||-9)<3?'#7ed99a':r.energy<25?'var(--danger)':'#c9a7ff')}</div>`;
}
let sheet=null,sheetArg=null;
function attrPop(k){
  const src={};const add=(name,v)=>{const r=src[name]||(src[name]={n:0,v:0});r.n++;r.v+=v};
  for(let j=0;j<W*H;j++){if(k==='water'&&S.ground[j]===1&&VILL[j])add('池・水べ（1マス0.3）',.3);const id=S.obj[j],b=BL[id];if(!b||b.kind==='block'||(FLOWERS.has(id)||id==='tree'||id==='fruit')&&isBud(j))continue;if((b.attr||{})[k]>0)add(b.name,b.attr[k])}
  const ov=el('<div style="position:absolute;inset:0;z-index:30;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:24px"></div>');
  const card=el('<div class="sec pxcard" style="background:var(--panel);border:2px solid var(--line);border-radius:16px;padding:14px;width:100%;max-width:340px;max-height:70%;overflow:auto"></div>');
  const h=document.createElement('h3');h.textContent=ELEM[k].name+'の力：'+Number(ATTR[k].toFixed(1))+' / '+needFor(k);card.appendChild(h);
  for(const[name,r]of Object.entries(src))card.appendChild(rowEl(name+' ×'+r.n,'+'+Number(r.v.toFixed(1))));
  if(!Object.keys(src).length)card.appendChild(el('<p class="note">まだありません</p>'));
  card.appendChild(el('<p class="note">マップにあるものを集計。花と木は育ってから加算されます。</p>'));
  ov.appendChild(card);ov.onclick=()=>ov.remove();$('#app').appendChild(ov)}/* 属性の内訳ポップアップ */
function placeFromInv(id){/* もちものから「置く」：ウィンドウをとじて、「おく」でえらんだときと同じにする */closeSheet();setMode('build');sel=id;selStamp=null;palOpen=false;renderPalette();const b=BL[id];if(id.startsWith('seed:'))toast('たねをまきたい畑をタップ');else if(b&&b.kind==='plant')toast('置いた場所にせいれいが植えてくれる');else if(b&&b.kind==='build')toast('置いた場所にせいれいが建ててくれる')}
function itemPop(id){/* もちもの：おそなえ箱の物・たね・ふしぎな種をタップしたときのメニュー */const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><div style="display:flex;gap:10px;align-items:center;margin-bottom:6px"><img alt="" style="width:44px;height:44px"><b class="t" style="font-size:16px"></b></div><p class="note n" style="margin:0 0 12px"></p><div class="rows"></div><div class="bt" style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>');
  const close=()=>o.remove(),bt=o.querySelector('.bt'),add=(t,f,dis)=>{const b=el('<button class="btn pri"></button>');b.textContent=t;b.disabled=!!dis;b.onclick=()=>{sfx('tap');close();f()};bt.appendChild(b)};
  o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};
  if(id==='mseed'){o.querySelector('img').src=seedIco();o.querySelector('.t').textContent='ふしぎな種 '+(S.mseed||0)+'こ';o.querySelector('.n').textContent='せいれいにあげると、能力のどれかが+1上がる。25%で+2。';
    for(const r of S.res){const row=rowEl(r.name,ELEM[r.elem].name+'のせいれい'),b=el('<button class="btn pri">あげる</button>');row.appendChild(b);b.onclick=()=>{giveSeed(r);if((S.mseed||0)<1)close();else o.querySelector('.t').textContent='ふしぎな種 '+(S.mseed||0)+'こ';if(sheet==='inv')renderSheet()};o.querySelector('.rows').appendChild(row)}}
  else if(id.startsWith('seed:')){const k=id.slice(5),c=CROPS[k];o.querySelector('img').src=seedIcon(k);o.querySelector('.t').textContent=c.name+'のたね '+cseed(k)+'こ';o.querySelector('.n').textContent=c.desc;add('畑にまく',()=>placeFromInv(id),cseed(k)<1)}
  else{const b=BL[id];o.querySelector('img').src=iconURL(id);o.querySelector('.t').textContent=iname(id)+' '+inv(id)+(b.kind==='ammo'?'本':'こ');o.querySelector('.n').textContent=b.desc||'';if(b.kind!=='ammo')add('これを置く',()=>placeFromInv(id),!inv(id))}
  document.body.appendChild(o)}
function otakiPop(k){/* もちもの：素材をタップしたときのメニュー（おたきあげ）。数をえらんでたのむと、せいれいが素材箱から神殿へもっていく */const tr=MATTRADE[k]||5;let v=0;const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 10px"></p><div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-bottom:12px"><button class="btn m">−</button><b class="v" style="min-width:3em;text-align:center;font-size:16px"></b><button class="btn p">＋</button></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn x">とじる</button><button class="btn pri go"></button></div></div></div>');
  const upd=()=>{const n=S.mat[k]||0,mx=Math.floor(n/tr)*tr;v=Math.max(0,Math.min(v,mx));o.querySelector('.t').textContent=MATN[k]+' '+n+'こ';o.querySelector('.n').textContent='おたきあげ：'+tr+'こでパワー1';o.querySelector('.v').textContent=v;o.querySelector('.m').disabled=v<=0;o.querySelector('.p').disabled=v+tr>mx;const g=o.querySelector('.go');g.textContent='おたきあげ（パワー+'+v/tr+'）';g.disabled=!v};
  o.querySelector('.m').onclick=()=>{sfx('tap');v-=tr;upd()};o.querySelector('.p').onclick=()=>{sfx('tap');v+=tr;upd()};o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelector('.go').onclick=()=>{if(!v||(S.mat[k]||0)<v)return;sfx('quest');S.mat[k]-=v;const Q=S.otakiQ||(S.otakiQ={});Q[k]=(Q[k]||0)+v;toast('おたきあげをたのんだ','good');o.remove();if(sheet==='inv')renderSheet()};
  v=(S.mat[k]||0)>=tr?tr:0;upd();document.body.appendChild(o)}
function openSheet(k,arg){if(NEWRES!=null&&!(k==='res'&&arg===NEWRES))unhold();if(k==='shop')shopSay=pick(S.pt<2?GOD_POOR:GOD_SHOP);sheet=k;sheetArg=arg;$('#sheetWrap').hidden=false;renderSheet()}
let resTab=0,tapPend=false,DLG_KEEP=false,NEWQ=[],NEWRES=null,HOLD=new Set();// 新しいせいれいが来たら、ステータスを見せてから進める
function unhold(){if(NEWRES!=null){HOLD.delete(NEWRES);const r=S&&S.res.find(x=>x.id===NEWRES);if(r)JUMP.set(r,performance.now())}NEWRES=null}
function closeSheet(){if(S&&S.flags){if(sheet==='shop'&&S.flags.traded)S.flags.tradedSeen=1;if(sheet==='menu'&&S.flags.oracleSet)S.flags.oracleSeen=1}/* おつげをえらんだあと、メニューをとじたら（もどってからとじても） */sheet=null;unhold();$('#sheetWrap').hidden=true;if(LVQ){const q=LVQ;LVQ=null;setTimeout(()=>{if(sheet)LVQ=q;else lvShow(...q)},250)}if(S&&S.flags.tapPend&&!S.flags.tapped&&!(S.pendTalk&&S.pendTalk.tapped)){talkOnce('tapped',[[GOD,'#joy|うむ。フタバは、元気そうじゃのう。'],[GOD,'おなかをすかせとったり、しょんぼりしとったら、気にかけてやっておくれ。'],[POKO,'#joy|えへへ、見られちゃった。']],250);setTimeout(checkQuest,400)}}
function el(html){const d=document.createElement('div');d.innerHTML=html.trim();return d.firstElementChild}
/* たね：たね袋の絵＋作物の小さな絵 */
const CROPIC={};function cropIcon(k){if(CROPIC[k])return CROPIC[k];const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.translate(32,30);g.scale(1.7,1.7);drawCrop(g,k,0,0,100,true);const u=c.toDataURL();c.width=c.height=0;return CROPIC[k]=u}/* 作物の絵だけのアイコン（図鑑） */
function seedIcon(k){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const a=ART.bag;if(a&&a.ok){const h=56,w=h*a.w/a.h;g.drawImage(a.img,(64-w)/2-4,4,w,h)}g.save();g.translate(30,26);g.scale(1.1,1.1);drawCrop(g,k,0,0,100,true);g.restore();return c.toDataURL()}/* たねは、たねのふくろ（もらった絵）と、育つ作物の絵のセット */
function cropIcon(k){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.scale(2,2);drawCrop(g,k,0,0,100,true);return c.toDataURL()}
/* 説明は❓をおしたときだけ出す */
function helpify(r,text){if(!r||!text)return r;const tx=r.querySelector('.tx');if(!tx)return r;const q=document.createElement('button');q.className='qbtn';q.textContent='?';q.setAttribute('aria-label','説明');const nm=tx.querySelector('b').textContent;q.onclick=e=>{e.stopPropagation();sfx('tap');helpPop(nm,text)};tx.querySelector('b').appendChild(q);return r}
const GENRE_TAB={'家具':'家具','収納':'収納','遊び':'あそび道具','庭':'庭の家具','あかり':'あかり','ごはん':'料理家具','ワナ':'ワナ','家づくり':'家づくり','道・囲い':'道・囲い'};
function genreOf(id){const b=BL[id];if(!b)return'';if(b.cat==='living')return'ダイニング家具';if(b.cat==='cook')return'料理家具';for(const[t,ids]of CRAFT_TABS)if(ids.includes(id))return GENRE_TAB[t]||t;return''}/* アイテムのジャンル（名前のとなりに出す） */
const nameG=id=>{const g=genreOf(id);return BL[id].name+(g?'　【'+g+'】':'')};
const CAT_TAG={living:'リビング',cook:'キッチン',toy:'遊び',light:'あかり',env:'ガーデン'},TAB_TAG={'家具':'家具','収納':'収納','遊び':'遊び','庭':'ガーデン','あかり':'あかり','ごはん':'キッチン','ワナ':'ワナ','家づくり':'家づくり','道・囲い':'道・囲い'};
const TAGMAP={stool:'リビング,キッチン',chair:'リビング,キッチン',achair:'リビング',pouf:'リビング',stable:'リビング',ltable:'リビング',table:'リビング,キッチン',sofa1:'リビング',rug1:'リビング,寝室',rug2:'リビング,寝室',bed:'寝室',
tub:'キッチン,お風呂',sink:'キッチン',oven:'キッチン',bathtub:'お風呂',hotstone:'お風呂,ガーデン',crate:'収納',stor:'収納',mbox:'収納',shelf1:'収納,リビング',shelf2:'収納,かざり',cabinet:'収納,リビング',wshelf:'収納,かざり',
monstera:'かざり,リビング',wreath:'かざり,リビング',curtain1:'かざり,リビング,寝室',curtain2:'かざり,リビング,寝室',paint1:'かざり,リビング',paint2:'かざり,リビング',paint3:'かざり,リビング',
candle:'あかり,リビング',lantern:'あかり,リビング',flamp:'あかり,リビング',lamp:'あかり,ガーデン',torch:'あかり,ガーデン',
signpost:'ガーデン',hedge:'ガーデン',birdbath:'ガーデン,かざり',arch:'ガーデン,かざり',parasol:'ガーデン,遊び',noren:'ガーデン,かざり',bench:'ガーデン,リビング',jar:'ガーデン,キッチン',kamizo:'ガーデン',rockart:'ガーデン,かざり',chochin:'かざり',furin:'かざり',ema:'かざり',komainu:'かざり,ガーデン',kadomatsu:'かざり,ガーデン',vane:'ガーデン,かざり',basin:'ガーデン',
slide:'遊び,ガーデン',sandbox:'遊び,ガーデン',seesaw:'遊び,ガーデン',swing:'遊び,ガーデン',campfire:'遊び,あかり',fountain:'遊び,ガーデン',
spike:'ワナ',puddle:'ワナ',sticky:'ワナ',firetrap:'ワナ',gust:'ワナ',watch:'防衛',tower:'防衛',lighthouse:'あかり,防衛',stele:'防衛',well:'水まわり,ガーデン',windmill:'作業,ガーデン',lumber:'作業',quarry:'作業',statue:'神殿'};/* ジャンルのタグ（複数あるものは、すべて書く） */
function tagsOf(id){const b=BL[id];if(!b)return[];if(TAGMAP[id])return TAGMAP[id].split(',');const t=[];if(CAT_TAG[b.cat])t.push(CAT_TAG[b.cat]);for(const[n,ids]of CRAFT_TABS)if(ids.includes(id)){const g=TAB_TAG[n]||n;if(!t.includes(g)&&!(g==='家具'&&t.length))t.push(g)}if(b.play&&!t.includes('遊び'))t.push('遊び');if(!t.length&&b.kind==='furn')t.push('家具');return t}/* 説明に出す、ジャンルのタグ */
function tagsEl(id){const tg=tagsOf(id);if(!tg.length)return null;const d=document.createElement('div');d.className='tags';for(const g of tg){const sp=document.createElement('span');sp.className='tag';sp.textContent=g;d.appendChild(sp)}return d}
function helpPop(t,text){const o=$('#helpPop');let tg=[];{const id=Object.keys(BL).find(k=>BL[k].name===t);if(id)tg=tagsOf(id)}{const bx=o.querySelector('.tags');if(bx){bx.innerHTML='';for(const g of tg){const sp=document.createElement('span');sp.className='tag';sp.textContent=g;bx.appendChild(sp)}bx.hidden=!tg.length}}o.querySelector('b').textContent=t;o.querySelector('p').textContent=text;o.hidden=false}
function lostSec(body){if(!(S.lost||[]).some(q=>!q.unb)||!(S.mebuki>0))return;const ls=el('<div class="sec"><h3>消えてしまったせいれい（めぶきのしずく '+S.mebuki+'こ）</h3><div class="rows"></div></div>');/* めぶきのしずくで、よみがえらせる（「せいれい」と「だれを呼ぶ？」の両方から） */
  for(const q of S.lost.filter(q=>!q.unb)){const row=rowEl(q.name,ELEM[q.elem].name+'のせいれい',spiritPort(q.elem,96,q.vr));const bt=el('<button class="btn pri">よみがえらせる</button>');bt.onclick=()=>{if(!(S.mebuki>0))return;S.mebuki--;closeSheet();{const pv=S.summon;S.summon={rev:1,lost:q.name};doSummon();S.summon=pv}sfx('level')};row.appendChild(bt);ls.querySelector('.rows').appendChild(row)}
  body.appendChild(ls)}
function rowEl(title,desc,img,html){const r=el(`<div class="row">${img?'<img alt="">':''}<div class="tx"><b></b><small></small></div></div>`);if(img)r.querySelector('img').src=img;r.querySelector('b').textContent=title;if(html)r.querySelector('small').innerHTML=html+esc(desc||'');else r.querySelector('small').textContent=desc||'';return r}
/* カミサマの値段：花は高め、畑・果物の苗は買うごとに上がる（果物の苗は10から、1本ごとに+2） */
function shopPrice(id,k){let t=0;for(let i=0;i<k;i++){if(id==='farm')t+=4+Math.floor(((S.farmBuy||0)+i)/3);/* 畑は3こ買うごとに1ポイント上がる */else if(id==='fruit')t+=10+2*((S.fruitBuy||0)+i);else if(FLOWERS.has(id))t+=BL[id].sp;/* 花の種の値段は、表の sp */else t+=BL[id].cost}return t}
function renderSheet(){
  if(!sheet)return;const body=$('#sheetBody');body.innerHTML='';const T=$('#sheetTitle');
  if(sheet==='shop'){
    T.textContent='カミサマと交換';
    {const sb=el('<div class="godSay"><b>カミサマ</b><span></span></div>');sb.querySelector('span').textContent='「'+shopSay+'」';body.appendChild(sb)}
    body.appendChild(el('<p class="note">カミサマの持ち物と、パワーを交換します。</p>'));
    if(S.flags.traded&&QUESTS[S.quest]&&QUESTS[S.quest].id==='trade'){const eb=el('<button class="btn" id="shopEnd" style="width:100%;margin-bottom:8px">交換をおわる</button>');eb.onclick=()=>{sfx('next');closeSheet();checkQuest()};body.appendChild(eb)}// チュートリアル：買いおわったら帰る
    const sec=(t)=>{const d=el('<div class="sec"><h3></h3><div class="rows"></div></div>');d.querySelector('h3').textContent=t;body.appendChild(d);return d.querySelector('.rows')};
    const trade=()=>{shopSay=pick(GOD_BUY);S.flags.traded=true;sfx('furn');checkQuest();renderSheet();renderPalette()};
    const row=(rows,title,desc,img,done)=>{const r=rowEl(title,desc,img);if(done)r.classList.add('done');const bx=el('<div style="display:flex;flex-direction:column;gap:4px;flex:none"></div>');r.appendChild(bx);rows.appendChild(r);return bx};
    const btn=(bx,label,dis,fn,pri)=>{const b=el('<button class="btn'+(pri?' pri':'')+'"></button>');b.textContent=label;b.disabled=!!dis;if(fn)b.onclick=fn;bx.appendChild(b)};
    const r1=sec('ブロック・種・苗');
    for(const id of BLOCKS.filter(i=>S.unlocked[i]&&!BL[i].qty&&i!=='window').concat(S.feat.plant?PLANTS.filter(id=>lvOK(id)&&plantOK(id)):[])){const b=BL[id];
      const bx=row(r1,iname(id),'所持：'+inv(id),iconURL(id));helpify(bx.parentNode,withAttr(id,b.desc||''));
      for(const k of [1,5]){const c=shopPrice(id,k);btn(bx,'×'+k+'　'+SP(c),S.pt<c,()=>{S.pt-=c;if(id==='farm')S.farmBuy=(S.farmBuy||0)+k;if(id==='fruit')S.fruitBuy=(S.fruitBuy||0)+k;giveItem(id,k);trade()},k===1)}}
    if(cnt('farm')||inv('farm')){const rs=sec('作物のたね');for(const k in CROPS){if(!cropOn(k))continue;const c=CROPS[k];const bx=row(rs,c.name+'のたね','所持：'+cseed(k)+'・'+c.desc,seedIcon(k));for(const n of [1,5]){const cst=2*n;btn(bx,'×'+n+'　'+SP(cst),S.pt<cst,()=>{S.pt-=cst;giveItem('seed:'+k,n);trade()},n===1)}}}
    const r2=sec('新しいブロック');
    for(const id of BLOCKS){const b=BL[id];if(!b.unlock)continue;
      const bx=row(r2,b.name,'',iconURL(id),S.unlocked[id]);helpify(bx.parentNode,withAttr(id,b.desc));
      if(S.unlocked[id])btn(bx,'もらった',true);else if(!lvOK(id))btn(bx,'村Lv'+b.lv,true);else btn(bx,SP(b.unlock),S.pt<b.unlock,()=>{S.pt-=b.unlock;S.unlocked[id]=true;giveItem(id,2);toast(b.name+'をもらった！ おそなえ箱に2こ入った','good');trade()},1)}
    {const TL=WD===0?[['mover','ひっこしミトン','家具・建物をタップして、うつしたい所をタップすると、すぐそこへうつる','mover']]:WD===1?[['bulk','ひろびろハケ','指でなぞった範囲を、ブロックでまとめてぬれる。種もまとめて植えてもらえる','hake'],['swap','つけかえトンカチ','つながっている柵・塀・家の壁・道・床を、まとめてべつの種類にかえる。はずした物は、おそなえ箱にもどる','swap']]:[];/* 道具は土地ごと（草原：ひっこしミトン・だんさスコップ、火山：ひろびろハケ・つけかえトンカチ）。もらった道具は、ほかの土地でも使える */
      if(TL.length){const r3=sec('道具');for(const T of TL){const bx=row(r3,T[1],T[2],toolIcon(T[3]),S[T[0]]);if(S[T[0]])btn(bx,'もらった',true);else btn(bx,SP(3000),S.pt<3000,()=>{S.pt-=3000;S[T[0]]=true;applyFeats();toast(T[1]+'をもらった！「どうぐ」から使える','good');trade()},1)}
        if(WD===0){const b2=row(r3,'だんさスコップ','段差をけずる・もる工事を、せいれいにたのめる。1マスでパワー10',toolIcon('scoop'),S.dig);if(S.dig)btn(b2,'もらった',true);else btn(b2,SP(1000),S.pt<1000,()=>{S.pt-=1000;S.dig=true;applyFeats();toast('だんさスコップをもらった！「おく」から使える','good');trade()},1)}}}/* だんさスコップは草原のカミサマから（ほかの土地でも使える） */
    if(WD===0&&(S.bossKills||0)>=1){const r5=sec('とくべつな交換'),bx=row(r5,'めぶきのしずく','消えてしまったせいれいを、よみがえらせる（所持：'+(S.mebuki||0)+'）',null);btn(bx,SP(400),S.pt<400,()=>{S.pt-=400;S.mebuki=(S.mebuki||0)+1;toast('めぶきのしずくをもらった','good');trade()},1)}/* 草原には、おまつりがない。しずくはカミサマから */
    if(WD===1&&(qAt('fest')||S.cleared)){const r5=sec('とくべつな交換');/* 火山のふもと：「おまつりをひらこう」のあとから、いつでもおまつり。めぶきのしずく・ごちそうは、おまつりの日に、せいれいの屋台で */
      {const done=S.festDay!=null&&S.festDay>=dayNo(),bx=row(r5,'おまつり','つぎの日が、おまつりになる',null,done);btn(bx,done?(S.festDay>dayNo()?'あしたはおまつり':'きょうはおまつり'):SP(200),done||S.pt<200,()=>{S.pt-=200;S.festDay=dayNo()+1;sfx('good');toast('あしたは、おまつり！','good');trade()},1)}/* たのんだつぎの日の朝7時に、おまつりがはじまる */
      }
    if(S.lv>=5||(S.bossKills||0)>=1||S.flags.hinoDown){const r6=sec('カミサマのかざり');const DECO=[['furin',120],['ema',150],['kadomatsu',180],['komainu',200]],d=dayNo();
      for(const[id,c]of[DECO[d%4],DECO[(d+1)%4]]){const bx=row(r6,BL[id].name,BL[id].desc+'（持っている数：'+(inv(id)||0)+'）',iconURL(id));btn(bx,SP(c),S.pt<c,()=>{S.pt-=c;giveItem(id,1);toast(BL[id].name+'をもらった','good');trade()},1)}
      }/* 終盤のパワーの使い道 */
  }else if(sheet==='inv'){
    T.textContent='もちもの';
    {/* 素材と食べ物も、ここで見られる */const MEMO={wood:'🪵',stone:'🪨',eda:'🥢',can:'🥫'},MOBJ={shina:'weed0g',kasa:'weed0k',kuru:'weed1g',chiri:'weed1k',funba:'weedc',kinoko:'kinoko'},mic=k=>ICONS[k]||(MOBJ[k]&&BL[MOBJ[k]]?iconURL(MOBJ[k]):null);
      const sec=(title,items,empty)=>{const g=el('<div class="grid"></div>'),hd=el('<b style="grid-column:1/-1;margin-top:4px"></b>');hd.textContent=title;g.appendChild(hd);if(!items.length){const p=el('<p class="note" style="grid-column:1/-1"></p>');p.textContent=empty;g.appendChild(p)}for(const[img,emo,nm,ct,tap]of items){const b=el(tap?'<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>':'<div class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></div>');if(tap)b.onclick=()=>{sfx('tap');tap()};if(img)b.querySelector('img').src=img;else b.querySelector('img').replaceWith(Object.assign(document.createElement('span'),{className:'stockEmo',textContent:emo||'・'}));b.querySelector('.nm').textContent=nm;b.querySelector('.ct').textContent=ct;g.appendChild(b)}body.appendChild(g)};
      sec('素材（'+matTot()+'/'+matCap()+'）',Object.keys(MATN).filter(k=>(S.mat[k]||0)>0).map(k=>[mic(k),MEMO[k]||'🌿',MATN[k],S.mat[k],()=>otakiPop(k)]),'素材は、ありません');/* 素材をタップすると、おたきあげのメニュー */
      {const q=S.otakiQ||{},L=[];const add=o=>{for(const k in o)if(o[k])L.push(MATN[k]+o[k])};add(q);S.res.forEach(r=>r.otaki&&add(r.otaki));if(L.length){const p=el('<p class="note"></p>');p.textContent='おたきあげまち：'+L.join('・');body.appendChild(p)}}
      sec('食べ物（'+S.food+'/'+foodCap()+'）',Object.keys(FOODS).filter(k=>(S.fs[k]||0)>0).map(k=>[ICONS[k]||null,FOODS[k].e,FOODS[k].name,S.fs[k]]),'食べ物は、ありません')}
    const grid=el('<div class="grid"></div>');grid.appendChild(Object.assign(el('<b style="grid-column:1/-1;margin-top:10px"></b>'),{textContent:'おそなえ箱'}));
    const groups=[['ブロック',BLOCKS.filter(id=>inv(id)>0)],['うえる',PLANTS.filter(id=>inv(id)>0)],...furnitureGroups(FURN.filter(id=>inv(id)>0)),['まもり',['arrow'].filter(id=>inv(id)>0)]];
    const ids=groups.flatMap(([,items])=>items);
    for(const [name,ids]of groups){if(!ids.length)continue;const heading=el('<b style="grid-column:1/-1;margin-top:8px"></b>');heading.textContent=name;grid.appendChild(heading);for(const id of ids){
      const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>');
      b.querySelector('img').src=iconURL(id);b.querySelector('.nm').textContent=iname(id);b.querySelector('.ct').textContent=inv(id);
      if(!inv(id))b.classList.add('zero');
      b.onclick=()=>{sfx('tap');itemPop(id)};grid.appendChild(b)}}
    for(const k of Object.keys(CROPS).filter(k=>cropOn(k)&&cseed(k)>0)){const sid='seed:'+k,b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>');/* たねも、ほかのアイテムと同じくアイコンで */
      b.querySelector('img').src=seedIcon(k);b.querySelector('.nm').textContent=CROPS[k].name+'のたね';b.querySelector('.ct').textContent=cseed(k);if(!cseed(k))b.classList.add('zero');b.onclick=()=>{sfx('tap');itemPop(sid)};grid.appendChild(b)}
    if((S.mseed||0)>0){const b=el('<button class="slot"><span class="ct"></span><img src="'+seedIco()+'" style="width:40px;height:40px;display:block;margin:0 auto"><span class="nm">ふしぎな種</span></button>');b.querySelector('.ct').textContent=S.mseed;b.onclick=()=>{sfx('tap');itemPop('mseed')};grid.appendChild(b)}
    body.appendChild(grid);
    if(typeof sheetArg==='string'&&(sheetArg==='mseed'?(S.mseed||0)>0:sheetArg.startsWith('seed:')?!!CROPS[sheetArg.slice(5)]:ids.includes(sheetArg))){const a=sheetArg;sheetArg=null;itemPop(a)}/* ほかの画面から、物をえらんで開いたときは、そのメニューも出す */
  }else if(sheet==='craft'){
    T.textContent='依頼ボード';
    body.appendChild(el('<p class="note">'+(orderLock()?'いまは「'+BL[orderLock()].name+'」だけたのめます。':'できたものはおそなえ箱に入ります。')+'</p>'));
    const bd=el('<div class="board"></div>');
    for(let n=0;n<boardMax();n++){const o=S.orders[n];
      if(!o){bd.appendChild(el('<div class="paper empty">あき</div>'));continue}
      const w=S.res.find(r=>r.id===o.worker);const p=el(`<div class="paper" style="--r:${[-2,1.5,-1,1,-1.5][n]}deg"><img alt=""><b></b><small></small><div class="bar"><i></i></div></div>`);
      p.querySelector('img').src=iconURL(o.type);p.querySelector('b').textContent=BL[o.type].name+'をつくって';p.querySelector('small').textContent=w?w.name+'が作っています':makerOf(o.type)?ELEM[BL[o.type].maker].name+'のせいれいを待っています':'作り手を待っています';
      {const cx=el('<button class="cx" aria-label="やめる">×</button>');cx.onclick=e=>{e.stopPropagation();cancelOrder(o.id)};p.appendChild(cx)}/* 依頼をやめる */
      const bi=p.querySelector('.bar i');bi.style.width=Math.min(100,o.prog/o.need*100)+'%';bi.style.background='#e0a43a';bd.appendChild(p)}
    body.appendChild(bd);
    const s2=el('<div class="sec"><h3>依頼を書く</h3><div class="ctabs"></div><div class="rows"></div></div>');
    CRAFT_TABS.forEach(([nm],i)=>{const t=el('<button class="ctab'+(i===craftTab?' on':'')+'"></button>');t.textContent=nm;t.onclick=()=>{craftTab=i;renderSheet()};s2.querySelector('.ctabs').appendChild(t)});
    for(const id of CRAFT_TABS[craftTab][1]){const b=BL[id];
      if(!recipeKnown(id)||!lvOK(id)&&!S.recipes[id])continue;/* 思いついていない・レベル不足は出さない */
      /* レシピをまだ知らない */
      const r=helpify(rowEl(b.name+(b.qty?'×'+b.qty:'')+'　所持：'+inv(id),'',iconURL(id),b.mat?matNeedHTML(b.mat)+(b.sand?'<span class="mneed" style="margin-right:6px;'+((S.sand||0)>=b.sand?'':'color:#c0392b;font-weight:700')+'">やすらぎの砂（'+(S.sand||0)+'/'+b.sand+'）</span>':'')+' ':''),withAttr(id,b.desc));
      if(makerOf(id)){const has=elemCount(b.maker)>0,mk=el('<span class="pxpill" style="display:inline-flex;align-items:center;vertical-align:middle;margin-right:4px;border-radius:9px;padding:0 5px 0 1px;font-size:10px;line-height:16px;color:#fff"><img alt="" style="width:16px;height:16px;margin:0"><b style="font-weight:700"></b></span>');mk.classList.add(has?'pm-'+b.maker:'pm-none');/* 色は、わくの絵（index.html の .pxpill.pm-〇〇） */mk.querySelector('img').src=spiritPort(b.maker,48);if(!has)mk.querySelector('img').style.filter='grayscale(1) opacity(.7)';mk.querySelector('b').textContent=ELEM[b.maker].name+(has?'':'・いない');r.querySelector('small').prepend(mk)}/* 作るせいれいの属性：アイコンで短く */
      const bt=el('<button class="btn pri"></button>');
      if(!lvOK(id)){bt.textContent='村Lv'+b.lv;bt.disabled=true;r.classList.add('done')}else{bt.textContent='はる　'+SP(b.pc);bt.disabled=S.pt<b.pc||S.orders.length>=boardMax()||!matOK(b.mat)||!!(orderLock()&&orderLock()!==id);bt.onclick=()=>orderFurn(id)}
      r.appendChild(bt);s2.querySelector('.rows').appendChild(r)}
    if(!s2.querySelector('.rows').children.length)s2.querySelector('.rows').appendChild(el('<div class="empty" style="padding:8px;opacity:.7">まだ作れるものがない</div>'));
    body.appendChild(s2);
    if(S.feat.inv){const ib=el('<button class="btn">もちものを見る</button>');ib.onclick=()=>openSheet('inv');body.appendChild(ib)}
  }else if(sheet==='vill'){
    T.textContent='村のようす';
    /* 項目ごとにまとめる：レベル／目標の進みぐあい／たくわえ／きょう */
    const L=S.lv,a=LV_XP[L-1],b=L>=maxLv()?a:LV_XP[L]??a,ic=q=>{const n=document.querySelector('.hud '+q);return n?n.cloneNode(true).outerHTML:''},bar=(v,c)=>'<div class="vlBar"><i style="width:'+clamp(v,0,1)*100+'%;background:'+c+'"></i></div>';
    const V=el('<div class="vl"></div>');
    V.appendChild(el('<div class="vlHero"><div class="vlLv">'+ic('.lvb svg')+'<small>村レベル</small><b>'+L+'</b></div><div class="vlHw">'+(b>a?bar((S.totalPt-a)/(b-a),'#7ee08a')+'<small>つぎのレベルまで　あと '+Math.max(0,Math.ceil(b-S.totalPt))+'</small>':bar(1,'#7ee08a')+'<small>さいこうレベル</small>')+'</div></div>'));
    const sh=Math.min(3,S.shards||0);
    V.appendChild(el('<div class="vlSec"><h4>目標</h4><div class="vlRow"><span>みどりのマス</span><b>'+GRASSN+'<small> / '+GRASS_GOAL+'</small></b></div>'+bar(GRASSN/GRASS_GOAL,'#8fd16a')+'<div class="vlRow"><span>ヌシのかけら</span><b class="vlSh">'+[0,1,2].map(k=>'<i class="'+(k<sh?'on':'')+'"></i>').join('')+'</b></div></div>'));
    const tile=(icon,lb,v,sub,br)=>'<div class="vlT"><div class="hd">'+icon+'<span>'+lb+'</span></div><div class="v">'+v+'</div>'+(br||'')+(sub?'<small>'+sub+'</small>':'')+'</div>';
    const fc=foodCap(),mc=matCap();
    V.appendChild(el('<div class="vlGrid">'+tile(ic('.stk[title="食料"] svg'),'食料',S.food+'<small> / '+fc+'</small>','',bar(fc?S.food/fc:0,'#f3d27a'))+tile('','素材',(()=>{const im=[...document.querySelectorAll('.hud .stk[title="素材"] .ic')].map(n=>{const c=n.cloneNode(true);c.classList.add('vlMi');return c.outerHTML});return (im[0]||'')+(S.mat.wood||0)+'<span style="display:inline-block;width:10px"></span>'+(im[1]||'')+(S.mat.stone||0)+(bambooOn()?'<span style="display:inline-block;width:10px"></span>'+(im[2]||'')+(S.mat.bamboo||0):'')})(),'素材箱 '+matTot()+' / '+mc,bar(mc?matTot()/mc:0,'#c9a27a'))+tile(ic('.stat[title="パワー"] img'),'パワー',S.pt,'ためた合計 '+Math.floor(S.totalPt))+tile(ic('.stat[title="せいれい"] svg'),'せいれい',S.res.length+'<small> 人</small>','')+'</div>'));
    V.appendChild(el('<div class="vlDay"><span>きょう</span><b>'+(S.today?DAYEV[S.today][0]+' '+DAYEV[S.today][1]:(S.rain?'☔ 雨':'ふつうの日'))+'</b></div>'));
    body.appendChild(V);
  }else if(sheet==='attrdetail'){
    T.textContent='属性の内訳';
    const sources={};for(const k of ELEM_KEYS)sources[k]={};
    const add=(k,name,v)=>{const a=sources[k];if(!a)return;const r=a[name]||(a[name]={n:0,v:0});r.n++;r.v+=v};
    for(let j=0;j<W*H;j++){if(S.ground[j]===1&&VILL[j])add('water','池・水べ（1マス0.3）',.3);const id=S.obj[j],b=BL[id];if(!b||b.kind==='block'||FLOWERS.has(id)&&isBud(j))continue;for(const k in b.attr||{})if(b.attr[k]>0)add(k,b.name,b.attr[k])}
    body.appendChild(el('<p class="note">マップにあるものを集計。花は咲いてから加算されます。</p>'));
    for(const k of ELEM_KEYS){const sec=el('<div class="sec"></div>');const h=document.createElement('h3');h.textContent=ELEM[k].name+'の力：'+Number(ATTR[k].toFixed(1));sec.appendChild(h);for(const [name,r]of Object.entries(sources[k]))sec.appendChild(rowEl(name+' ×'+r.n,'+'+Number(r.v.toFixed(1))));if(!Object.keys(sources[k]).length)sec.appendChild(el('<p class="note">まだありません</p>'));body.appendChild(sec)}
  }else if(sheet==='stock'){/* そうこ：いま、なにがいくつあるか */
    T.textContent='そうこ';
    const box=(title,n,cap,items,empty)=>{const sec=el('<div class="sec stockSec"><div class="stockHead"><h3></h3><span class="stockN"></span></div><div class="gauge stockBar"><i></i></div><div class="grid"></div></div>');sec.querySelector('h3').textContent=title;sec.querySelector('.stockN').textContent=cap>0?n+' / '+cap:'箱がありません';sec.querySelector('.stockBar i').style.width=(cap>0?Math.min(100,n/cap*100):0)+'%';const g=sec.querySelector('.grid');
      if(!items.length){const p=el('<p class="note" style="grid-column:1/-1"></p>');p.textContent=empty;g.appendChild(p)}
      for(const[img,emo,nm,ct]of items){const b=el('<div class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></div>');if(img)b.querySelector('img').src=img;else{const im=b.querySelector('img');im.replaceWith(Object.assign(document.createElement('span'),{className:'stockEmo',textContent:emo}))}b.querySelector('.nm').textContent=nm;b.querySelector('.ct').textContent=ct;g.appendChild(b)}body.appendChild(sec)};
    const fk=Object.keys(FOODS).filter(k=>(S.fs[k]||0)>0),raw=fk.filter(k=>!FOODS[k].dish),dish=fk.filter(k=>FOODS[k].dish),fi=k=>[ICONS[k]||null,FOODS[k].e,FOODS[k].name,S.fs[k]];
    box('食料箱',S.food,foodCap(),[...raw.map(fi),...dish.map(fi)],'食べ物は、ありません');
    const mk=Object.keys(S.mat).filter(k=>(S.mat[k]||0)>0&&MATN[k]);box('素材箱',matTot(),matCap(),mk.map(k=>[ICONS[k]||null,'',MATN[k],S.mat[k]]),'素材は、ありません');
    if(S.sand){const p=el('<p class="note"></p>');p.textContent='やすらぎの砂：'+S.sand;body.appendChild(p)}
    const hold=S.res.filter(r=>heldN(r)>0);if(hold.length){const p=el('<p class="note"></p>');p.textContent='せいれいが運んでいるとちゅう：'+hold.map(r=>r.name+'（'+[...Object.entries(r.carry&&typeof r.carry==='object'?r.carry:{}).map(([k,n])=>FOODS[k].name+n),...Object.entries(r.cmat||{}).map(([k,n])=>MATN[k]+n)].join('・')+'）').join('、');body.appendChild(p)}
  }else if(sheet==='people'){
    T.textContent='せいれい '+S.res.length+'人';
    const a=el('<div class="sec"><h3>この土地の属性</h3><div class="attr"></div></div>');const g=a.querySelector('.attr');
    for(const k of ELEM_KEYS){const v=ATTR[k],n=needFor(k),p=Math.min(100,v/n*100);
      g.insertAdjacentHTML('beforeend',`<span class="el" style="background:${ELEM[k].col}">${ELEM[k].name}</span><div class="bar"><i style="width:${p|0}%;background:${ELEM[k].col}"></i></div><small>${Math.floor(v)}/${n}</small>`);
      for(const c of[...g.children].slice(-3)){c.style.cursor='pointer';c.onclick=()=>{sfx('tap');attrPop(k)}}}/* 属性をタップすると、内訳のポップアップ */
    body.appendChild(a);
    body.appendChild(el('<p class="note">属性をタップすると内訳が見られます。目もりに届いた次の朝、神殿の「！」から呼べます。いくつか届いていれば、呼ぶ属性をえらべます。池・植物・家具・建物から属性の力が集まります。</p>'));
    const rows=el('<div class="rows"></div>');
    for(const r of S.res){const row=el(`<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>`);
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      row.querySelector('b').textContent=r.name+'  Lv'+rLv(r);row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中');
      row.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r));row.onclick=()=>{closeSheet();setMode('look');centerOn(r.x*TS,r.y*TS)};rows.appendChild(row)}
    body.appendChild(rows);
    lostSec(body);
  }else if(sheet==='grave'){
    const j=sheetArg,d=S.dyn[j]||{},nm=d.name||'せいれい';T.textContent=nm+'のお墓';
    body.appendChild(el('<p class="story">'+nm+'は、なかまが神殿へはこんで、おみおくりしてくれます。<br>よみがえらせられるのは、おみおくりのあとです。</p>'));
  }else if(sheet==='house'){
    const h=HOUSES[sheetArg],L=h?houseRes(h):[];if(!h)return closeSheet();
    {const cap=houseCap(h),C=houseComfort(h);T.textContent='おうち';
     const cs=el('<div class="sec"><h3>住み心地</h3><p class="comfy"><span class="stars"></span><b></b></p><div class="recs"></div><p class="note" style="margin-top:8px"></p></div>');
     cs.querySelector('.stars').textContent=comfyStars(C.v);cs.querySelector('b').textContent=C.v+' / '+COMFMAX;
     for(const[a,b]of[['ベッド',C.bed+' / '+cap+'こ'],['家具・かざり',C.kinds+'しゅるい'],['床',C.floorPct+'%'],['いまの人数',L.length+'人']]){const d=el('<div class="st"><span></span><b></b></div>');d.firstChild.textContent=a;d.lastChild.textContent=b;cs.querySelector('.recs').appendChild(d)}
     cs.querySelector('.note').textContent=C.over?'ベッドが多すぎて、きゅうくつ！ 住み心地が大きく下がる':'つかれのとれる速さ・起きたときのパワー：'+(.6+C.v/100*.9).toFixed(1)+'倍'+(C.v>=180?'・ぐっすり眠れて、朝にたのしさ+10':C.v<90?'・たのしさ-5':'');/* 効果は数字で */
     body.appendChild(cs)}
    {const bs=[...h.inside].filter(j=>BEDSET.has(S.obj[j]));if(bs.length){const sec=el('<div class="sec"><h3>ベッド</h3><div class="rows"></div></div>');bs.forEach((j,k)=>{const o=bedOwner(j),row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>');row.querySelector('.dot').style.cssText=o?'background:#f6f1e6 url('+spiritPort(o.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[o.elem].col:'background:#efe6d2';row.querySelector('b').textContent='ベッド'+(k+1);row.querySelector('small').textContent=o?o.name+'のベッド':'だれでも使える';row.onclick=()=>openSheet('bed',j);sec.querySelector('.rows').appendChild(row)});body.appendChild(sec)}}
    if((S.lv||1)>=13){const sec=el('<div class="sec"><h3>屋根の色</h3><div class="roofc" style="display:flex;flex-wrap:wrap;gap:6px"></div></div>'),k=hKey(h),cur=(S.roofCol||{})[k]||'';
      for(const[id,nm]of[['','もとの色'],...Object.entries(ROOFCOL).map(([a,b])=>[a,b.n])]){const b=el('<button class="btn'+(cur===id?' pri':'')+'"></button>');b.textContent=nm;b.onclick=()=>{sfx('tap');S.roofCol||(S.roofCol={});if(id)S.roofCol[k]=id;else delete S.roofCol[k];h._rc=null;dirty=true;renderSheet()};sec.querySelector('.roofc').appendChild(b)}
      body.appendChild(sec)}/* 屋根の色（村レベル13から） */
    if(!L.length)body.appendChild(el('<p class="story">いまは、だれもいない</p>'));
    const rows=el('<div class="rows"></div>');
    for(const r of L){const row=el(`<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>`);
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      row.querySelector('b').textContent=r.name+'  Lv'+rLv(r);row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中')+'・好きな家具：'+BL[likeF(r)].name+(hasLikeF(h,r)?' ♥あり'+(COMFY[likeF(r)]?'（その家具のポイント2倍）':''):'');
      row.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r));row.onclick=()=>openSheet('res',r.id);rows.appendChild(row)}
    body.appendChild(rows);
  }else if(sheet==='clear'){T.textContent='守護の台座';
    const rows=el('<div class="rows"></div>');for(const[t,ok]of(WD||cnt('tower')>=1?clearConds():towerConds())){const r=el('<div class="row"><div class="tx"><b></b></div></div>');r.querySelector('b').textContent=(ok?'✓ ':'・')+t;if(ok)r.classList.add('done');rows.appendChild(r)}body.appendChild(rows);
  }else if(sheet==='bed'){const j=sheetArg;if(!BEDSET.has(S.obj[j]))return closeSheet();/* よぞらのベッドも */
    const o=bedOwner(j);T.textContent='ベッド';

    const rows=el('<div class="rows"></div>'),set=id=>{const B=S.bedOwn||(S.bedOwn={});for(const k in B)if(B[k]===id)delete B[k];if(id==null)delete B[j];else B[j]=id;sfx('next');renderSheet()};
    {const row=el('<button class="row" style="text-align:left;width:100%"><span class="dot" style="background:#efe6d2"></span><div class="tx"><b></b><small></small></div></button>');row.querySelector('b').textContent=(o?'':'✓ ')+'だれでも';row.querySelector('small').textContent='あいていれば、だれでも眠れる';row.onclick=()=>set(null);rows.appendChild(row)}
    for(const r of S.res){const mb=myBed(r),row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>');
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      row.querySelector('b').textContent=(o===r?'✓ ':'')+r.name+'  Lv'+rLv(r);row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(mb===j?'このベッド':mb>=0?'ほかのベッドがある':'ベッドなし');
      row.onclick=()=>set(r.id);rows.appendChild(row)}
    body.appendChild(rows);
  }else if(sheet==='res'){
    const r=S.res.find(q=>q.id===sheetArg);if(!r)return closeSheet();
    const isNew=sheetArg===NEWRES;T.textContent=isNew&&r.back?r.name+'がもどってきた！  Lv'+rLv(r):(isNew?'あたらしいなかま！ ':'')+r.name+'  Lv'+rLv(r);
    const box=el(`<div class="row"><span class="dot"></span><div class="tx"><b></b><small></small></div></div>`);
    box.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96,r.vr)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
    box.querySelector('b').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中');
    box.querySelector('small').textContent=r.hunger<20?'おなか：危険！':r.hunger<50?'おなか：少なめ':'';
    box.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r));body.appendChild(box);
    if(!isNew){const sy=el('<p class="story" style="margin:6px 0 2px"></p>');sy.textContent='「'+sayLine(r)+'」';body.appendChild(sy)}
    {const lv=rLv(r);
     const tb=el('<div class="ctabs"></div>');['ステータス','プロフィール','強化'].forEach((nm,i)=>{const t=el('<button class="ctab'+(i===resTab?' on':'')+'"></button>');t.textContent=nm;t.onclick=()=>{resTab=i;sfx('next');renderSheet()};tb.appendChild(t)});body.appendChild(tb);/* ステータスと、得意・好きなものは別のタブ */
     if(resTab===2){const sec=el('<div class="sec"></div>'),cost=15+10*(r.boost||0),B=r.bst||(r.bst={}),ST=[['atk','攻撃力'],['pow','作業スピード'],['spd','移動速度'],['sta','スタミナ'],['cap','持てる数']].filter(([k])=>k!=='atk'||r.elem==='fire');/* 攻撃力は火の子だけ */
       for(const[k,nm]of ST){const n=B[k]||0;const row=el('<div class="row" style="align-items:center"><div class="tx"><b></b><small></small></div></div>');row.querySelector('b').textContent=nm+'  +'+n+(n>=6?'（最大）':'');sec.appendChild(row)}
       const left=ST.filter(([k])=>(B[k]||0)<6),bw=el('<div class="row" style="justify-content:center"><button class="btn pri"></button></div>'),b=bw.querySelector('button');
       b.textContent=left.length?'パワーをそそぐ（'+SP(cost)+'）':'ぜんぶ最大';b.disabled=!left.length||S.pt<cost;
       b.onclick=()=>{if(S.pt<cost)return toast('パワーが足りません（'+SP(cost)+'）');const L=ST.filter(([k])=>(B[k]||0)<6);if(!L.length)return;S.pt-=cost;const[k,nm]=L[(Math.random()*L.length)|0],n=B[k]||0,inc=Math.min(Math.random()<.75?1:2,6-n);B[k]=n+inc;/* どこが上がるかはランダム */
         if(k==='pow'||k==='spd'||k==='sta')r.vr[k]=Math.round(((r.vr[k]||1)+.1*inc)*100)/100;
         r.boost=(r.boost||0)+1;RSC.delete(r);addFloat(r.x,r.y-1.6,nm+'+'+inc,'#9fe8ff');upFx(r,nm,'+'+inc,inc>1);renderSheet()};
       bw.style.gap='8px';bw.style.flexWrap='wrap';sec.appendChild(bw);
       {const sb=el('<button class="btn"></button>'),sn=S.mseed||0;sb.textContent='ふしぎな種をあげる（'+sn+'こ）';sb.disabled=sn<1;sb.onclick=()=>giveSeed(r);bw.appendChild(sb)}/* ふしぎな種も、パワーのとなりからあげられる */
       body.appendChild(sec)}/* パワーで、せいれいを強化 */
     else if(resTab===1){const pf=el('<div class="sec"><div class="stats"></div></div>'),pg=pf.querySelector('.stats');
       for(const[k,v]of[['得意なこと',ELEM[r.elem].can],['好きな遊び',LIKES[r.like]],['にがてな遊び',Object.keys(NIGATE[r.elem]||{}).map(k=>BL[k].name).join('・')||'とくにない'],['好きな家具',BL[likeF(r)].name],['好きな料理',FOODS[favDish(r)].name],['なかよし',(bestMate(r)||{}).name||'まだいない'],['村に来た日',r.came?r.came+'日目':'はじめから'],['作ったもの',(r.made||0)+'こ'],['追いはらった「コワイノ」',(r.beat||0)+'体'],['ベッド',myBed(r)>=0?'じぶんのベッドがある':'きまっていない']]){const d=el('<div class="stat" style="display:block"><span style="display:block"></span><b style="display:block;text-align:left;margin-top:2px"></b></div>');d.firstChild.textContent=k;d.lastChild.textContent=v;pg.appendChild(d)}
       body.appendChild(pf)}
     else{
     const st=el('<div class="sec"><div class="stats"></div></div>'),g=st.querySelector('.stats');
     for(const tk of[(r.vr||{}).tr,isKey(r.name)?'kizuna':null]){const T2=TRAITS[tk];if(T2){const d=el('<div class="stat" style="display:block"><span style="display:block">特性</span><b style="display:block;text-align:left;margin-top:2px"></b><small style="display:block;color:var(--sub,#888);margin-top:2px"></small></div>');d.querySelector('b').textContent=T2[0];d.querySelector('small').textContent=T2[1];g.appendChild(d)}}/* キーキャラは「きずな」も持つ */
     const Z=rStat(r,lv);for(const[k,v]of[['攻撃力',Z.atk?String(Z.atk):'なし'],['作業スピード',String(Math.floor(Z.work))],['移動速度',String(Math.floor(Z.move))],['スタミナ',String(Math.floor(Z.sta))],['持てる数',heldN(r)+' / '+Z.cap]])g.appendChild(el('<div class="stat"><span>'+k+'</span><b>'+v+'</b></div>'));
     body.appendChild(st)}}
    if(isNew){const nb=el('<button class="btn pri">つぎへ</button>');nb.onclick=()=>{sfx('next');closeSheet();dialog([[r.name,helloLine(r)]],()=>checkQuest())};/* 来た子が、ひとことあいさつ */body.appendChild(nb);return}
    const b=el('<button class="btn pri">おやつをあげる（食料1）</button>');b.disabled=S.food<1;b.onclick=()=>{const it=takeFood(1,'raw')[0];endAct(r);r.meal={u:.3*fullN(r),pt:1,e:FOODS[it]?FOODS[it].e:'🍙',items:[it]};startAct(r,null,'eat',-1,{snack:1});addFloat(r.x,r.y-1.6,'わーい！','#ffd38a');sfx('eat');closeSheet()}/* おやつ：よろこんで、その場で食べる */;body.appendChild(b);
  }else if(sheet==='night'){const N=S.ns;if(!N)return closeSheet();T.textContent=N.trial?(N.trialOK?'試練をのりこえた！':'試練の夜'):N.rw?'夜をぶじに守りきった！':'ゆうべの守り';
    const g=el('<div class="stats"></div>');
    for(const[k,v]of[['来た「コワイノ」',N.n+'体'],['追いはらった',N.kill+'体'],['おそわれたせいれい',N.hurt?N.hurt+'回':'なし'],['こわされた柵・設備',N.broke?N.broke+'こ':'なし'],['ぬすまれたもの',N.lost.length?N.lost.join('、'):'なし']].concat(N.rw?[['ごほうび','パワー+'+N.rw+'・みんなのたのしさ+10']]:[]).concat(N.trialOK?[['試練のごほうび','パワー+60・めぶきのしずく']]:[]))g.appendChild(el('<div class="stat"><span>'+k+'</span><b>'+v+'</b></div>'));
    body.appendChild(g);
    if(N.boss===1&&!N.trial)body.appendChild(el('<p class="note">オオカゲは、追いはらえないまま朝になった。</p>'));
  }else if(sheet==='summon'){T.textContent='だれを呼ぶ？';
    body.appendChild(el('<p class="note">力が目もりに届いている属性から、ひとり呼べます。のこりは、つぎの朝にまた呼べます。</p>'));
    const rows=el('<div class="rows"></div>');
    for(const c of sumCands()){const row=rowEl(ELEM[c.el].name+'のせいれい',c.cap?'もう村にいっぱいいる':'属性の力 '+Math.floor(c.v)+' / '+c.n+(c.ok?'':'（まだ足りない）'),spiritPort(c.el,96));if(!c.ok)row.style.opacity=.55;
      const bt=el('<button class="btn pri">呼ぶ</button>');bt.disabled=!c.ok||!S.summon;bt.onclick=()=>{if(!S.summon)return;S.summon={elem:c.el,pick:1};closeSheet();doSummon()};row.appendChild(bt);rows.appendChild(row)}
    body.appendChild(rows);
    lostSec(body);/* しずくを持っていたら、ここからもよみがえらせられる */
  }else if(sheet==='enemy'){const e=S.enemies.find(q=>q.id===sheetArg);if(!e||e.dead){closeSheet();return}const D=EN[e.type];
    T.textContent=D.name;
    const FEAT={yama:'火山のふもとの最後の夜に来る。温泉を冷やす',boss2:'ヌシ様をむかえる準備ができたあと、オオカゲのかわりに来る。とても強い',basic:'せいれいをおそう',fast:'足が速い',thief:'食料や素材をぬすむ',brute:'体力が多い',boss:WD?'5日目の夜、そのあと3日ごとに来る。追いはらうと「ヌシのかけら」があらわれ、そのあとは5日ごとに来る。当たると目をまわす':'クエストが出てから3日目の夜、そのあと2日ごとに来る。一度追いはらうと、そのあとは5日ごと。とても強い。当たると目をまわす'};
    const st=el('<div class="sec"><h3>ステータス</h3><div class="stats"></div></div>'),g=st.querySelector('.stats');
    for(const[k,v]of[['体力',Math.max(0,Math.ceil(e.hp))+' / '+e.max],['移動速度','×'+D.sp],['壁への攻撃',D.atk+'秒ごとに1'],['せいれいへの攻撃','おなか −'+D.hitN],['特徴',FEAT[e.type]||'']])g.appendChild(el('<div class="stat"><span style="white-space:nowrap">'+k+'</span><b>'+v+'</b></div>'));
    body.appendChild(st);
  }else if(sheet==='farm'){const j=sheetArg,d=S.dyn[j];if(!d||S.obj[j]!=='farm'){closeSheet();return}
    const cr=CROPS[cropK(d)];T.textContent=cr?'畑：'+cr.name:'畑';
    body.appendChild(el('<p class="story">'+(!cr?'まだ、なにも植えていない':d.sown===false?(d.paid||cseed(cropK(d))>0?'種まきを待っている':'たねがなくて植えられない'):d.g>=100?'収穫できる':'収穫まであと'+Math.ceil((100-d.g)/(100/cr.days)-.01)+'日・きょうの水やり'+(d.wet>0?'ずみ':'まだ'))+'</p>'));
    if(cr){const n=cr.yield+(NEARMILL.has(j)?1:0)+(NEARFLOWER.has(j)?1:0)+(S.today==='hosaku'?1:0);const yr=el('<div class="sec"><div class="stats"><div class="stat"><span>収穫できる数</span><b></b></div></div></div>');yr.querySelector('b').textContent=n+'こ';body.appendChild(yr)}/* いま収穫すると、いくつとれるか */
    if(!cr){const b2=el('<button class="btn pri">おそなえ箱からたねをえらぶ</button>');b2.onclick=()=>{sfx('tap');openSheet('inv',Object.keys(CROPS).filter(cropOn).map(k=>'seed:'+k).find(id=>inv(id)>0)||'seed:imo')};body.appendChild(b2)}
  }else if(sheet==='food'){T.textContent='食料箱';
    body.appendChild(el('<p class="story">'+S.food+'/'+foodCap()+'</p>'));
    const g=el('<div class="rows"></div>');for(const k in FOODS){const n=S.fs[k]||0;if(!n)continue;const f=FOODS[k];const rc=RECIPES.find(R=>R.out===k),r=helpify(rowEl((icURL(f.e)?'':f.e+' ')+f.name+'　×'+n,(f.dish?'料理・':'')+'おなか'+f.v+(f.pw?'・パワー+'+f.pw:'')+(f.fx?'・'+f.fx:''),icURL(f.e)),rc?DISHD(rc):RAWD(k));g.appendChild(r)}body.appendChild(g);
  }else if(sheet==='oven'){
    const j=sheetArg;if(S.obj[j]!=='oven')return closeSheet();if(!S.ovenSet)S.ovenSet={};const cur=S.ovenSet[j];T.textContent='かまど';
    body.appendChild(el('<p class="story">作る料理をえらぶと、火のせいれいが食料箱の材料で作ってくれる。</p>'));
    {const m=ovenMul(j),pc=Math.round((1-m)*100);body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('料理の速さ（いま）',pc>0?'料理の時間 -'+pc+'%（まわり3マスの料理家具）':'ふつう'))}/* かまど：いまの料理の速さ */
    const rows=el('<div class="rows"></div>');
    for(const R of RECIPES){const F=FOODS[R.out],need=needTxt(R),has=Object.keys(R.need).every(k=>(S.fs[k]||0)>=R.need[k]);
      const r=helpify(rowEl((icURL(F.e)?'':F.e+' ')+F.name+(cur===R.out?'（作っている）':''),'材料：'+need+' / 時間：'+R.time+'分'+(F.fx?' / 効果：'+F.fx:'')+(has?'':'・材料が足りない'),icURL(F.e)),DISHD(R));
      const b=el('<button class="btn"></button>');b.textContent=cur===R.out?'やめる':'これを作る';if(cur===R.out)b.classList.add('pri');
      b.onclick=()=>{if(cur===R.out)delete S.ovenSet[j];else S.ovenSet[j]=R.out;sfx('tap');renderSheet()};r.appendChild(b);if(!has&&cur!==R.out){r.style.filter='grayscale(1)';r.style.opacity='.55'}/* 材料が足りない料理はグレー */rows.appendChild(r)}
    body.appendChild(rows);
  }else if(sheet==='manual'){
    T.textContent='ひでんのしょ';
    {const bk=el('<button class="btn back">‹ メニュー</button>');bk.onclick=()=>{sfx('tap');openSheet('menu')};body.appendChild(bk)}
    body.appendChild(el(`<div class="sec"><h3>あそびかた</h3><p class="story">あなたはこの土地の新しい<b>守り神</b>。せいれいをふやして土地をよみがえらせ、<b>守護の台座</b>を建てて<b>ヌシ様</b>をむかえましょう。<br>せいれいが食べたり眠ったり遊んだりすると<b>せいれいパワー</b>がたまります。<br>せいれいのおそなえは<b>おそなえ箱</b>に入ります。家具は<b>依頼ボード</b>でたのみます。カミサマが来たら<b>交換</b>ができます。<br>夜は<b>「コワイノ」</b>に気をつけて。<br>1本指でドラッグ：移動／2本指：ズーム。</p></div>`));/* あそびかたも、ひでんのしょにまとめる */
    {const CAT=[['あそびかた',[]],['せいれい',['せいれいのようす','ステータス','属性と得意なこと']],['くらし・家具',['家具の種類','くらし']],['守り神',['守り神のちから']],['夜と戦い',['夜と「コワイノ」']]];
      if(!CAT.some(c=>c[0]===MANC))MANC='あそびかた';
      const bar=el('<div class="mtabs" style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0"></div>');for(const c of CAT){const b=el('<button class="btn"></button>');b.textContent=c[0];if(c[0]===MANC)b.classList.add('pri');b.onclick=()=>{sfx('tap');MANC=c[0];openSheet('manual')};bar.appendChild(b)}
      body.insertBefore(bar,body.children[1]);
      const how=body.querySelector('.story').parentNode;how.hidden=MANC!=='あそびかた';
      const cur=CAT.find(c=>c[0]===MANC);
      for(const[t,items]of MANUAL){if(!cur[1].includes(t))continue;const sec=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sec.querySelector('h3').textContent=t;for(const[a,b]of items)sec.querySelector('.rows').appendChild(rowEl(a,b));body.appendChild(sec)}
      if(cur[0]==='くらし・家具'){const sec=el('<div class="sec"><h3>スポット</h3><div class="rows"></div></div>');const on=new Set();for(const t of SPOTJ.values())for(const k of t)on.add(k);for(const sp of SPOTS)sec.querySelector('.rows').appendChild(rowEl(sp.n+(on.has(sp.k)?'（村にある）':''),sp.how+'を、まわり3マスに置く。'+sp.eff));body.appendChild(sec)}}/* スポットの一覧 */
    {const b=el('<button class="btn">もどる</button>');b.onclick=()=>{sfx('tap');openSheet('menu')};body.appendChild(b)}
  }else if(sheet==='furn'){const j=sheetArg,o=S.obj[j]||(S.rug||{})[j];if(!o||!BL[o])return closeSheet();T.textContent=BL[o].name;{const te=tagsEl(o);if(te)body.appendChild(te)}
    body.appendChild(rowEl(BL[o].name,withAttr(o,BL[o].desc||''),iconURL(o)));
    if(BL[o].hp&&S.obj[j]===o)body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('じょうぶさ',Math.floor(S.hp[j]??BL[o].hp)+' / '+BL[o].hp));/* 建物などのじょうぶさ */
    {const R=rangeOf(o,j);if(R&&!BL[o].env&&!BENCHES.has(o))body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('効果のはんい','まわり'+(R.cells||R.r)+'マス'))}
    if(SEATS.includes(o)&&spotW(j)>=0)body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('つりができるいす','せいれいがすわってつりをする。魚がつれる確率+25%'));/* 池のそばの椅子＝釣りスポット */
    {const t=SPOTJ.get(j);if(t){for(const I of SPOTI)if(t.has(I.sp.k)&&spotCells(I).includes(j))spotFx(I)}/* 家具をタップしたときも、そのスポットを点線でかこむ */if(t)for(const sp of SPOTS){if(!t.has(sp.k))continue;body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('スポット：'+sp.n,sp.eff))}}/* スポット */
    if(o==='table'){const h=roomOf(j);let n=0;if(h)for(const q of h.inside){const oo=S.obj[q];if(oo&&BL[oo]&&BL[oo].cat==='living')n+=BL[oo].dw||1}if(h)for(const oo of rugsIn(h.inside))n+=BL[oo].dw||1;const bon=h?DINEPT[Math.min(6,n)]:0;
      body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('ここで食べたときのパワー（いま）',h?'+'+bon+'（家の中の食卓 +1・ダイニング家具で +'+(DINEPT[Math.min(6,n)]-1)+(n/2<3?'。ダイニング家具をふやすと、まだふえる':'。いちばん多い')+'）':'家の外なので、ふえない'))}/* 食卓：いまのパワーのボーナス */
    if(BENCHES.has(o)){const ev=ENVG?Math.min(12,Math.max(ENVG[j]||0,ENVG[j+1]||0)):0;/* ベンチ：まわりのかざりで上がった回復 */
      body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('すわって休むと（1時間あたり）','つかれ −'+(Math.round((20+ev*.36)*10)/10)+' / たのしさ +'+(Math.round((4.8+ev*.36)*10)/10)+(ev>0?'':'')))}

  }else if(sheet==='score'){const sc=S.score||calcScore();T.textContent='クリアスコア';
    body.appendChild(el('<div style="text-align:center;margin:6px 0 10px"><div style="font-size:44px;font-weight:900;color:#e0a43a;line-height:1">'+sc.rank+'</div><div style="font-size:24px;font-weight:800;margin-top:4px">'+sc.tot+' てん</div></div>'));
    const g=el('<div class="rows"></div>');for(const[a,b,c]of sc.parts)g.appendChild(rowEl(a+'：'+b,(c>=0?'+':'')+c+' てん'));body.appendChild(g);
    const b=el('<button class="btn pri" style="width:100%;margin-top:10px">とじる</button>');b.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(b);
  }else if(sheet==='heatv'){const j=sheetArg,t=st2();T.textContent=j===D1?'手前の熱の装置':'奥の熱の装置';
    const P=tx=>{body.appendChild(el('<p class="story"></p>')).textContent=tx};
    const dir=j===D1?t.d1:t.d2;
    if(j===D2&&!t.d2fix){const clr=BVOL.every(q=>S.obj[q]!=='boulder'),ok=clr&&(S.mat.stone||0)>=8&&(S.mat.wood||0)>=5&&shLeft()>=1;
      P('こわれて止まっている。直すには、石材8・木材5と、ヌシのかけら1つがいる。'+(clr?'':'まわりの大岩をどかさないと、近づけない。')+(shLeft()?'':'ヌシのかけらを、まだ持っていない。'));
      const b=el('<button class="btn pri">直す</button>');b.disabled=!ok;b.onclick=()=>{S.mat.stone-=8;S.mat.wood-=5;S.usedSh=(S.usedSh||0)+1;t.d2fix=1;sfx('shard');burst(j,'block');toast('かけらが熱を通した！ 奥の装置が動きだした','good');dirty=true;closeSheet();checkQuest()};body.appendChild(b)}
    else if(t.hvb[j]){P('ヒノオオカゲにこわされて、止まっている。石材3で直せる。');const b=el('<button class="btn pri">直す（石材3）</button>');b.disabled=(S.mat.stone||0)<3;b.onclick=()=>{S.mat.stone-=3;delete t.hvb[j];dirty=true;sfx('level');burst(j,'block');toast('装置を直した','good');dirty=true;closeSheet()};body.appendChild(b)}
    else{P(j===D1?'火山の熱を、左（西の温泉）と右（奥の装置）のどちらに流すか切りかえる。':'熱を、左（奥の温泉）と右（けむり穴）のどちらに流すか切りかえる。');
      P('いまは「'+(dir===0?'左':'右')+'」に流している。');
      const b=el('<button class="btn pri">向きをかえる</button>');b.onclick=()=>{if(j===D1)t.d1=1-t.d1;else t.d2=1-t.d2;sfx('tap');renderSheet();checkQuest()};body.appendChild(b)}
    const c2=el('<button class="btn">とじる</button>');c2.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(c2);
  }else if(sheet==='stall'){const st=festStalls().find(t=>t.x===sheetArg);if(!st)return closeSheet();const M=STALLM[st.el],kp=S.res.find(r=>r.id===st.id);T.textContent=M.nm+'の屋台';
    {const sb=el('<div class="godSay"><b></b><span></span></div>');sb.querySelector('b').textContent=kp?kp.name:'';sb.querySelector('span').textContent='「'+(kp?chatTone(pick(STALLSAY),kp):pick(STALLSAY))+'」';body.appendChild(sb)}
    body.appendChild(el('<p class="note">店番の子と、パワーで交換します。</p>'));const rows=el('<div class="rows"></div>');body.appendChild(rows);
    const add=(title,desc,img,label,dis,fn)=>{const r=rowEl(title,desc,img),b=el('<button class="btn pri"></button>');b.textContent=label;b.disabled=!!dis;b.onclick=()=>{fn();sfx('furn');renderSheet();renderPalette()};r.appendChild(b);rows.appendChild(r)};
    for(const it of M.L){const c=it[it.length-1];
      if(it[0]==='f'){const f=FOODS[it[1]],room=foodCap()-S.food;add(f.e+' '+f.name+'×5',f.fx||'',null,room<5?'食料箱がいっぱい':SP(c),room<5||S.pt<c,()=>{S.pt-=c;addFood(it[1],5);toast(f.name+'を5つもらった','good')})}
      else if(it[0]==='m'){const nm=MATN[it[1]],room=matCap()-matTot();add(nm+'×10','素材箱に入る（いま'+(S.mat[it[1]]||0)+'）',null,room<10?'素材箱がいっぱい':SP(c),room<10||S.pt<c,()=>{S.pt-=c;S.mat[it[1]]=(S.mat[it[1]]||0)+10;S.gotMat&&(S.gotMat[it[1]]=(S.gotMat[it[1]]||0)+10);toast(nm+'を10こもらった','good')})}
      else if(it[0]==='mebuki'){if(!((S.bossKills||0)>=1||S.flags.hinoDown))continue;add('めぶきのしずく','消えてしまったせいれいを、よみがえらせる（所持：'+(S.mebuki||0)+'）',null,SP(c),S.pt<c,()=>{S.pt-=c;S.mebuki=(S.mebuki||0)+1;toast('めぶきのしずくをもらった','good')})}
      else if(it[0]==='chochin')add(BL.chochin.name,BL.chochin.desc+'（持っている数：'+(inv('chochin')||0)+'）',iconURL('chochin'),SP(c),S.pt<c,()=>{S.pt-=c;giveItem('chochin',1);toast(BL.chochin.name+'をもらった','good')})}
  }else if(sheet==='travel'){T.textContent='守護の台座';
    const nx=WORLDS[WD+1];body.appendChild(el('<p class="story"></p>')).textContent='台座から、ほかの土地へ行ける。'+(nx?'つぎは「'+nx.name+'」。':'');
    const b=el('<button class="btn pri">マップをひらく</button>');b.onclick=()=>{sfx('tap');save();closeSheet();showMaps()};body.appendChild(b);
    const c=el('<button class="btn">やめる</button>');c.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(c);
  }else if(sheet==='watch'){
    const j=sheetArg,o=S.obj[j];if(o!=='watch'&&o!=='yogan')return closeSheet();
    const yg=o==='yogan',TB=yg?YOGAN:WATCH,L=S.hp['L'+j]||1,st=TB[L];T.textContent=BL[o].name;
    body.appendChild(el(`<p class="story">Lv${L}：威力 ${st.dmg}${yg?'（まわり '+st.sdmg+'）':''}・射程 ${st.range}マス・${st.cd}分ごとに${yg?'火の玉':'木の矢'}を放つ</p>`));if(!yg)body.appendChild(el(`<p class="story">木の矢：${inv('arrow')}本</p>`));
    const U=(yg?YUP:WUP)[L];if(U){const n=TB[L+1];body.appendChild(el(`<p class="note">強化するとLv${L+1}：威力 ${n.dmg}${yg?'（まわり '+n.sdmg+'）':''}・射程 ${n.range}マス・${n.cd}分ごと<br>${SP(U.pc)}</p>`));{const m=document.createElement('div');m.className='mt upmt';m.innerHTML=Object.keys(U.mat).map(k=>{const h=S.mat[k]||0;return '<span class="mic'+(h>=U.mat[k]?'':' ng')+'"><img src="'+(ICONS[k]||'')+'" alt="'+MATN[k]+'">'+h+'/'+U.mat[k]+'</span>'}).join('')+(U.sand?'<span class="mic'+((S.sand||0)>=U.sand?'':' ng')+'">やすらぎの砂（'+(S.sand||0)+'/'+U.sand+'）</span>':'');body.appendChild(m)}/* 強化に使う素材：持っている数/いる数（足りない素材は赤） */
      const b=el('<button class="btn pri">強化する</button>');b.onclick=()=>{if(S.pt<U.pc)return toast('パワーが足りません（'+SP(U.pc)+'）');if(!matOK(U.mat))return toast('素材が足りません（'+matTxt(U.mat)+'）');if(U.sand&&(S.sand||0)<U.sand)return toast('やすらぎの砂が足りません（'+U.sand+'）');S.pt-=U.pc;for(const k in U.mat)S.mat[k]-=U.mat[k];if(U.sand)S.sand-=U.sand;S.hp['L'+j]=L+1;dirty=true;try{rebuildStatic()}catch(e){}sfx('kankan');burst(j,'block','offer');toast(BL[o].name+'をLv'+(L+1)+'に強化した','good');renderSheet()};body.appendChild(b)}
    else body.appendChild(el('<p class="note">これ以上は強化できない</p>'));
  }else if(sheet==='menu'){
    T.textContent=WORLDS[WD].name;
    const MI=[['oracle','🍃','おつげ'],['manual','📜','ひでんのしょ'],['goal','🎯','目標'],['record','📔','思い出帳'],['maps','🧭','マップ選択'],['zukan','👻','図鑑'],['settings','⚙️','設定'],['support','☕','応援する']];
    const sub=MI.find(m=>m[0]===sheetArg);
    if(!sub){/* メニューはアイコンを並べるだけ。タップで中身を開く */
      body.appendChild(el(`<p class="story">みどりのマス <b>${GRASSN}</b>・村レベル ${S.lv}・せいれい ${S.res.length}人</p>`));
      const g=el('<div class="mgrid"></div>');
      for(const[k,ic,nm]of MI){const b=el('<button class="mtile"><span class="mi"></span><span class="mn"></span></button>');if(ICONS['m_'+k])b.querySelector('.mi').innerHTML='<img alt="" src="'+ICONS['m_'+k]+'">';else b.querySelector('.mi').textContent=ic;b.querySelector('.mn').textContent=nm;b.dataset.menu=k;
        b.onclick=()=>{sfx('tap');if(k==='manual')return openSheet('manual');if(k==='maps'){save();closeSheet();return showMaps()}openSheet('menu',k)};g.appendChild(b)}
      body.appendChild(g);return}
    T.textContent=sub[2];
    {const bk=el('<button class="btn back">‹ メニュー</button>');bk.onclick=()=>{sfx('tap');openSheet('menu')};body.appendChild(bk)}
    if(sheetArg==='oracle'){
      {const sec=el('<div class="sec"><h3>おつげ</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
       for(const k of [null,...Object.keys(ORACLE).filter(oracleOK)]){const O=k?ORACLE[k]:{name:'じゆうにすごす',e:'🍃'},on=(S.oracle||null)===k;const b=el('<button class="btn"></button>');b.dataset.oracle=k||'';b.textContent=O.e+' '+O.name+(on?'（いま）':'');if(on)b.classList.add('pri');
         b.onclick=()=>{S.oracle=k;if(k){S.flags.oracleSet=true;checkQuest()}sfx('quest');toast(k?'おつげ：'+O.name:'おつげをやめた','good');for(const r of S.res)if(!r.hidden&&r.act&&r.act.stage==='do'&&IDLE_ACTS.includes(r.act.type))endAct(r);renderSheet()};rw.appendChild(b)}
       body.appendChild(sec)}
    }else if(sheetArg==='goal'&&S.cleared){
      body.appendChild(el('<p class="note">この土地は守られた。ここからは、クエストや目標で村をそだてよう。たっせいすると、パワーがもらえます。</p>'));
      if(WD!==FREE){const a=AFTERQ[S.aq||0],qs=el('<div class="sec"><h3>クエスト</h3><div class="rows"></div></div>');
        if(!a)qs.querySelector('.rows').appendChild(rowEl('✓ ぜんぶたっせい','カミサマからのおねがいは、ぜんぶかなえた'));
        else if(S.aqOn===(S.aq||0))qs.querySelector('.rows').appendChild(rowEl('・'+a.t,aqProg(a)+'　ごほうび パワー+'+a.rw+'。'+a.how));
        else qs.querySelector('.rows').appendChild(rowEl('・つぎのクエスト','昼になると、カミサマからおねがいがある'));
        body.appendChild(qs);
        const d=S.daily,ds=el('<div class="sec"><h3>きょうの目標</h3><div class="rows"></div></div>');
        if(d)for(const k of d.k){const g=DAILYG.find(x=>x.k===k),ok=!!d.done[k],r=rowEl((ok?'✓ ':'・')+g.t,ok?'たっせい':'いま '+Math.min(g.n,dailyNow(g,d))+' / '+g.n+'　ごほうび パワー+'+g.rw);if(ok)r.classList.add('done');ds.querySelector('.rows').appendChild(r)}
        else ds.querySelector('.rows').appendChild(rowEl('・あしたの朝から','毎朝、2つの目標が出る'));
        body.appendChild(ds)}
      const f=el('<div class="sec"><h3>長い目標</h3><div class="rows"></div></div>');for(const g of [...FREEG.filter(g=>!(S.freeDone||{})[g.k]),...FREEG.filter(g=>(S.freeDone||{})[g.k])]){const ok=!!(S.freeDone||{})[g.k],r=rowEl((ok?'✓ ':'・')+g.t,ok?'たっせい':'いま '+g.now()+'　ごほうび パワー+'+g.rw);if(ok)r.classList.add('done');f.querySelector('.rows').appendChild(r)}body.appendChild(f);
      const tr=el('<div class="sec"><h3>「コワイノ」の試練</h3><p class="note">ふだんより多く、強い「コワイノ」と、オオカゲがいっしょにやってくる夜。ぜんぶ追いはらうと、パワー+60と「めぶきのしずく」。</p></div>');
      const b=el('<button class="btn pri" style="width:100%"></button>');b.textContent=S.trial?'今夜、試練の夜がくる':'今夜、試練をうける';b.disabled=!!S.trial||isNight();b.onclick=()=>{S.trial=true;sfx('night');toast('今夜は「コワイノの試練」','warn');renderSheet()};tr.appendChild(b);
      tr.appendChild(el('<p class="note">のりこえた試練：'+(S.trials||0)+'回</p>'));body.appendChild(tr);subSec(body);/* クリア後は、新しい目標を上に。サブクエストは下に */
    }else if(sheetArg==='goal'){subSec(body,true);
    }else if(sheetArg==='zukan'){zukanBody(body)
    }else if(sheetArg==='record'){
      const st=el('<div class="sec"><h3>これまで</h3><div class="recs"></div></div>'),rw=st.querySelector('.recs');
      for(const[a,b]of[['すごした日',dayNo()+'日'],...(S.score?[['クリアスコア',S.score.rank+'（'+S.score.tot+'てん）']]:[]),['のりこえた夜',(S.nights||0)+'回'],['いまのせいれい',S.res.length+'人'],['よんだせいれい',(S.summons||0)+'人'],['消えてしまったせいれい',(S.deaths||0)+'人'],
        ['追いはらった「コワイノ」',(S.kills||0)+'体'],['オオカゲ',(S.bossKills||0)+'回'],['ヌシのかけら',(S.shards||0)+'つ'],['めぶきのしずく',(S.mebuki||0)+'こ'],['ためたせいれいパワー',Math.floor(S.totalPt||0)+''],['みどりのマス',GRASSN+'マス'],['村レベル','Lv'+S.lv],['たっせいした目標',S.quest+'こ']]){const d=el('<div class="st"><span></span><b></b></div>');d.firstChild.textContent=a;d.lastChild.textContent=b;rw.appendChild(d)}
      body.appendChild(st);
      /* 思い出帳ときろくをひとつに：日ごとのできごと */
      const E=[];(S.memo||[]).forEach(([d,e,t],i)=>E.push([d,i,e+' '+t]));(S.log||[]).forEach(([d,t],i)=>E.push([d,1e4+i,t]));E.sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
      if(!E.length)body.appendChild(el('<p class="note">はじめての出来事が、ここにのこります。</p>'));
      let cur=null,rows=null;for(const[d,,t]of E){if(d!==cur){cur=d;const sc=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sc.querySelector('h3').textContent=d+'日め';rows=sc.querySelector('.rows');body.appendChild(sc)}rows.appendChild(rowEl(t,''))}
    }else if(sheetArg==='talks'){
      const H=(S.dlog||[]).slice().reverse();if(!H.length)body.appendChild(el('<p class="note">まだありません</p>'));
      const rows=el('<div class="rows"></div>');for(const[w,t]of H){const r=el('<div class="row"><div class="tx"><b></b><small style="white-space:normal"></small></div></div>');r.querySelector('b').textContent=w||'';r.querySelector('small').textContent=t;rows.appendChild(r)}body.appendChild(rows);
    }else if(sheetArg==='memo'){
      const M=(S.memo||[]).slice().reverse();if(!M.length)body.appendChild(el('<p class="note">はじめての出来事が、ここにのこります。</p>'));
      let cur=null,rows=null;for(const[d,e,t]of M){if(d!==cur){cur=d;const sc=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sc.querySelector('h3').textContent=d+'日め';rows=sc.querySelector('.rows');body.appendChild(sc)}rows.appendChild(rowEl(e+' '+t,''))}
    }else if(sheetArg==='support'){/* 広告とコーヒー（まだ準備中） */
      {const sec=el('<div class="sec"><div style="display:flex;flex-direction:column;gap:8px"></div></div>');for(const t of['📺 広告をみる','☕ 作者にコーヒーをおごる']){const b=el('<button class="btn"></button>');b.textContent=t;b.onclick=()=>toast('準備中です');sec.firstChild.appendChild(b)}body.appendChild(sec)}
    }else if(sheetArg==='settings'){
      {const t=el('<div class="sec"><h3>テスト用</h3></div>'),b=el('<button class="btn"></button>');b.textContent='5倍速：'+(TESTM?'オン':'オフ');b.onclick=()=>{TESTM=!TESTM;try{localStorage.setItem('hk-test',TESTM?'1':'')}catch(_){}if(!TESTM&&S.speed>3)S.speed=1;renderSheet();applyFeats()};t.appendChild(b);body.appendChild(t)}/* テストのときだけ5倍速 */
      const so=el('<div class="sec"><h3>おと</h3><div style="display:flex;gap:8px;flex-wrap:wrap"></div></div>');
      for(const[k,l]of[['bgm','音楽'],['sfx','効果音']]){const b=el('<button class="btn"></button>');b.textContent=l+'：'+(SND[k]?'オン':'オフ');b.onclick=()=>{audioInit();setSnd(k,!SND[k]);renderSheet()};so.lastElementChild.appendChild(b)}
      body.appendChild(so);
      {const vs=el('<div class="sec"><h3>音量</h3></div>');for(const[k,l]of[['bv','音楽'],['sv','効果音'],['vv','せいれいの声']]){const row=el('<label style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="width:7em;flex:none"></span><input type="range" min="0" max="100" step="5" style="flex:1"><b style="width:3em;text-align:right"></b></label>');row.querySelector('span').textContent=l;const ip=row.querySelector('input'),bv=row.querySelector('b');ip.value=Math.round((SND[k]??1)*100);bv.textContent=ip.value;ip.addEventListener('input',()=>{bv.textContent=ip.value;audioInit();setSnd(k,ip.value/100)});vs.appendChild(row)}body.appendChild(vs)}
      body.appendChild(el('<p class="note">効果音：効果音ラボ／夜の環境音：音人／木を切る音：minetest_game より（Sheyvan, CC0）</p>'));
      {const ts=el('<div class="sec"><h3>テスト用</h3></div>');const b=el('<button class="btn"></button>');b.textContent='倍速（砂時計なし）：'+(TESTSPD?'オン':'オフ');b.onclick=()=>{TESTSPD=!TESTSPD;try{KV.setItem('hakoniwa-test',TESTSPD?'1':'0')}catch(e){}applyFeats();renderSheet()};ts.appendChild(b);body.appendChild(ts)}
      const rs=el('<div class="sec"><h3>データ</h3></div>');const rb=el('<button class="btn">最初からやりなおす</button>');
      rb.onclick=()=>{if(rb.dataset.ok){closeSheet();newGame(WD)}/* いまのステージだけをやりなおす */else{rb.dataset.ok=1;rb.textContent='本当にやりなおす（もう一度タップ）';rb.style.borderColor='var(--danger)'}};rs.appendChild(rb);body.appendChild(rs);
      {const section=el('<div class="sec"><h3>セーブ</h3><p class="note"></p></div>');
        const status=section.querySelector('p');
        const update=()=>{const st=KV.status();status.textContent=st.available?''+(st.lastSaved?' 最終保存：'+new Date(st.lastSaved).toLocaleTimeString('ja-JP'):''):'このブラウザに保存できません。下の「書き出す」でセーブファイルを保存してください。';};
        const button=el('<button class="btn pri">今すぐセーブ</button>');button.onclick=()=>{const ok=save();update();toast(ok?'セーブしました':'このブラウザには保存できません',ok?'good':undefined)};
        update();section.appendChild(button);body.appendChild(section)}
      /* セーブの書き出し・読みこみ（ブラウザのデータが消えたときのそなえ） */
      {const sv=el('<div class="sec"><h3>セーブの書き出し</h3><p class="note">ファイルにして保存できます。別の端末でも「読みこむ」で続きから遊べます。読みこむと、ファイルに含まれる土地のセーブを上書きします。ブラウザのデータを消す前に書き出してください。</p></div>');
        const ex=el('<button class="btn">書き出す</button>'),im=el('<button class="btn">読みこむ</button>'),fi=el('<input type="file" accept=".json,application/json" hidden>');
        ex.onclick=async()=>{save();const d={app:'hakoniwa',v:1,at:Date.now(),saves:{}};try{for(const k of SAVE_KEYS.filter(Boolean)){const t=KV.getItem(k);if(t)d.saves[k]=t}}catch(e){}
          for(let w=0;w<LIVE.length;w++)if(LIVE[w]&&!d.saves[SAVE_KEYS[w]]&&LIVE[w].introSeen)d.saves[SAVE_KEYS[w]]=JSON.stringify(LIVE[w]);
          const txt=JSON.stringify(d),dt=new Date(),nm='hakoniwa-save-'+dt.getFullYear()+String(dt.getMonth()+1).padStart(2,'0')+String(dt.getDate()).padStart(2,'0')+'.json';
          let dl=null;try{dl=window.claude&&await window.claude.use('downloads')}catch(e){}
          if(dl){try{await dl.save({filename:nm,data:new Blob([txt],{type:'application/json'})});toast('セーブを書き出した','good')}catch(e){if(e&&e.code!=='declined')toast('書き出せませんでした')}return}
          try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=nm;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),10000);toast('セーブを書き出した','good')}catch(e){toast('書き出せませんでした')}};
        im.onclick=()=>fi.click();
        fi.onchange=()=>{const f=fi.files&&fi.files[0];if(!f)return;if(f.size>20*1024*1024){toast('ファイルが大きすぎます');fi.value='';return}const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d||d.app!=='hakoniwa'||d.v!==1||!d.saves||typeof d.saves!=='object'||Array.isArray(d.saves))throw 0;
            const entries=Object.entries(d.saves).filter(([k])=>SAVE_KEYS.includes(k));if(!entries.length)throw 0;
            for(const [k,value] of entries){if(typeof value!=='string')throw 0;const g=JSON.parse(value);if(!g||g.v!==8||(g.world||0)!==SAVE_KEYS.indexOf(k)||!g.introSeen||!Array.isArray(g.res)||!Array.isArray(g.orders)||!Array.isArray(g.ground)||(g.ground.length!==W*H&&g.ground.length!==OW*OW)||!Array.isArray(g.obj)||(g.obj.length!==W*H&&g.obj.length!==OW*OW)||!g.flags)throw 0}
            const before=entries.map(([k])=>[k,KV.getItem(k)]);NOSAVE=true;
            if(!entries.every(([k,value])=>KV.setItem(k,value))){for(const [k,value]of before){if(value===null)KV.removeItem(k);else KV.setItem(k,value)}NOSAVE=false;toast('ブラウザに保存できないため読みこめません');return}
            toast('読みこみました。はじめからひらきなおします','good');setTimeout(()=>location.reload(),900)}catch(e){toast('このファイルは読みこめません')}};rd.readAsText(f)};
        ex.style.marginBottom='8px';sv.appendChild(ex);sv.appendChild(im);sv.appendChild(fi);body.appendChild(sv)}
    }
  }
}

/* 図鑑：マップごとに、見つけた・おぼえた物だけ（スポット・家具・建物・レシピ・コワイノ・アイテム） */
let ZKW=null,ZKT=0;const ZKTABS=['スポット','家具','建物','レシピ','コワイノ','アイテム'];
function zukanBody(body){
  const ws=[0,1,2,3,4,5].filter(w=>(w===WD&&!S.free)||savedStage(w));if(!ws.length){body.appendChild(el('<p class="note">まだありません</p>'));return}
  if(ZKW==null||!ws.includes(ZKW))ZKW=ws.includes(WD)?WD:ws[0];
  if(ws.length>1){const tb=el('<div class="ctabs"></div>');for(const w of ws){const t=el('<button class="ctab'+(w===ZKW?' on':'')+'"></button>');t.textContent=WORLDS[w].name;t.onclick=()=>{ZKW=w;sfx('next');renderSheet()};tb.appendChild(t)}body.appendChild(tb)}
  {const tb=el('<div class="ctabs"></div>');ZKTABS.forEach((nm,i)=>{const t=el('<button class="ctab'+(i===ZKT?' on':'')+'"></button>');t.textContent=nm;t.onclick=()=>{ZKT=i;sfx('next');renderSheet()};tb.appendChild(t)});body.appendChild(tb)}
  const d=ZKW===WD?S:savedStage(ZKW);if(!d)return;
  const G=grecOf(),here=id=>G.get(id)===ZKW,placed=new Set((d.obj||[]).filter(o=>o&&BL[o])),has=id=>placed.has(id)||((d.inv||{})[id]||0)>0;
  const rows=el('<div class="rows"></div>'),list=[];
  const add=(nm,desc,img)=>list.push([nm,desc,img]);
  if(ZKT===0){for(const sp of SPOTS)if((d.spotSeen||{})[sp.k])add(sp.n,sp.how+'：'+sp.eff,null)}
  else if(ZKT===1||ZKT===2||ZKT===3){const kd=ZKT===1?'furn':ZKT===2?'build':null;
    for(const id in BL){const b=BL[id];if(!b||!b.name||b.hidden)continue;if(kd?b.kind!==kd:(b.kind==='furn'||b.kind==='build'||b.kind==='nat'))continue;if(!(here(id)||(ZKT!==3&&has(id))))continue;add(b.name,b.desc||'',iconURL(id))}}
  else if(ZKT===4){const seen=d.seenEn||{},K=d.enKills||{};for(const k of Object.keys(EN).filter(k=>ZUKAN[k]&&seen[k])){const D=EN[k],row=el('<div class="zk"><canvas width="144" height="144"></canvas><div class="zt"><b></b><p></p><small></small></div></div>');
      const c=row.querySelector('canvas').getContext('2d');c.scale(2,2);try{drawShade(c,k,36,64,(k==='boss'||k==='hino'||k==='yama'||k==='boss2'?.46:.56),1,{t:0,dot:1})}catch(_){}
      row.querySelector('b').textContent=D.name;row.querySelector('p').textContent=ZUKAN[k];row.querySelector('small').textContent='体力 '+D.hp+'・はやさ '+D.sp+'・追いはらった '+(K[k]||0)+'回';if(d.cleared&&ZURA[k]){const u=el('<p class="note"></p>');u.textContent='もとのすがた：'+ZURA[k];row.querySelector('.zt').appendChild(u)}rows.appendChild(row);list.push(null)}}
  else{const it=Object.assign({},d.seenIt||{});for(const k in d.mat||{})if(d.mat[k]>0)it['m:'+k]=1;for(const k in d.fs||{})if(d.fs[k]>0)it['f:'+k]=1;
    for(const k in MATN)if(it['m:'+k])add(MATN[k],'素材',ICONS[k]||null);for(const k in FOODS)if(it['f:'+k])add(FOODS[k].name,FOODS[k].fx||'食べ物',ICONS[k]||icURL(FOODS[k].e)||(CROPS[k]?cropIcon(k):null))}
  body.appendChild(el('<p class="story">'+list.length+'こ</p>'));
  for(const q of list){if(!q)continue;rows.appendChild(rowEl(q[0],q[1],q[2]))}
  if(!list.length)body.appendChild(el('<p class="note">まだありません</p>'));body.appendChild(rows)}
