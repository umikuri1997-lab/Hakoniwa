/* せいれいの名前をつける（nick.js）
   なかまが来たとき（はじめての紹介の画面 NEWRES）だけ、名前をかえられる。章のはじめからいる子（フタバ・ホムラ）と、もどってきた子はのぞく。
   ふつうの子：r.name をそのままかえる（来たばかりなので、名前を使っているのは、思い出・日記・まっている手紙・S.keyN だけ）。
   お話の子（ノドカ・ホノ・アオ・フウ・シズク、NKFIX）：お話の会話・しくみは、もとの名前で見分けるので、r.name はそのまま。
     画面に出す名前だけを S.nick（もとの名前→つけた名前）でかえる：会話は話す前に（nickTx）、ほかの画面の文字は出たときに（nickWatch）。
   つける名前は、ひらがな・カタカナ・英数字・ー・・で NKMAX 字まで。ほかの子の名前・お話の子のもとの名前と同じ名前や、
   お話の子のもとの名前をふくむ名前にはしない（おきかえが2回かかって、くずれないように）。 */
const NKMAX=6;
const NKFIX=()=>[MINA,SHIZUKU,...Object.values(FIXK0)];
let NKRX=null,NKSIG='';
function nickName(n){return S&&S.nick&&S.nick[n]||n}
function nickTx(t){const N=S&&S.nick;if(!N||typeof t!=='string')return t;const ks=Object.keys(N);if(!ks.length)return t;const sig=ks.join('|');if(sig!==NKSIG){NKSIG=sig;NKRX=new RegExp(ks.slice().sort((a,b)=>b.length-a.length).join('|'),'g')}NKRX.lastIndex=0;return NKRX.test(t)?(NKRX.lastIndex=0,t.replace(NKRX,k=>N[k]||k)):t}
function nickDom(n){if(!n)return;if(n.nodeType===3){const v=nickTx(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;return}if(n.nodeType!==1||n.tagName==='SCRIPT'||n.tagName==='STYLE')return;const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode())){const v=nickTx(t.nodeValue);if(v!==t.nodeValue)t.nodeValue=v}}
let NKOBS=null;
function nickWatch(){/* 画面に出た文字のうち、お話の子のもとの名前を、つけた名前にする（名前をつけた子がいるときだけ動く） */if(NKOBS||typeof MutationObserver==='undefined'||!document.body)return;
  NKOBS=new MutationObserver(L=>{if(!S||!S.nick||!Object.keys(S.nick).length)return;for(const m of L){if(m.type==='characterData')nickDom(m.target);else for(const a of m.addedNodes)nickDom(a)}});
  NKOBS.observe(document.body,{subtree:true,childList:true,characterData:true})}
function nickAll(){if(S&&S.nick&&Object.keys(S.nick).length)nickDom(document.body)}
function nickOK(r){return !!r&&!IS_STORY_REPLAY&&NEWRES===r.id&&!r.back&&r.name!==POKO&&r.name!==HOMURA&&S.res.includes(r)}
function nickClean(t){return String(t||'').replace(/[^ぁ-ゔァ-ヶー・0-9A-Za-z０-９]/g,'').slice(0,NKMAX)}
function nickBad(v,r){/* つけられない名前なら、そのわけ */if(!v)return '名前を入れてください';
  const fix=NKFIX(),mine=fix.includes(r.name)?r.name:'';
  if(v!==mine&&fix.some(k=>v.includes(k)))return 'その名前は、つけられません';
  if([GOD,POKO,HOMURA,...KEYS.flat()].includes(v)&&v!==mine)return 'その名前は、つけられません';
  const all=[...S.res,...(S.buried||[]),...(S.lost||[])].filter(q=>q!==r);
  if(all.some(q=>q.name===v||nickName(q.name)===v))return 'ほかのせいれいと同じ名前です';
  return ''}
function nickSet(r,v){/* 名前をきめる */const old=nickName(r.name);if(v===old)return;
  if(NKFIX().includes(r.name)){const N=S.nick||(S.nick={});if(v===r.name)delete N[r.name];else N[r.name]=v;nickAll()}
  else{const o=r.name;r.name=v;const rp=t=>typeof t==='string'?t.split(o).join(v):t;
    if(S.keyN)for(const k in S.keyN)if(S.keyN[k]===o)S.keyN[k]=v;
    for(const q of S.letterQ||[])if(q.id===r.id){q.who=v;if(Array.isArray(q.tx))q.tx=q.tx.map(rp)}
    for(const e of (S.memo||[]).slice(-4))if(e[2]&&e[2].includes(o+'（'))e[2]=rp(e[2]);
    for(const e of (S.log||[]).slice(-4))if(e[1]&&e[1].includes(o+'（'))e[1]=rp(e[1]);
    if(typeof dyCur==='function'){const D=dyCur();if(D&&D.m)D.m=D.m.map(t=>t.includes(o+'（')?rp(t):t)}}
  dirty=true}
function nickPop(r){/* 名前をつけるポップアップ */if(!nickOK(r)||document.querySelector('.nk-reveal'))return;
  const ov=el('<div class="idea-reveal nk-reveal" role="dialog" aria-modal="true" aria-label="名前"></div>'),card=el('<div class="idea-card" style="min-width:0"><h2>名前をつける</h2><div style="display:flex;align-items:center;gap:6px;margin:10px 0"><input class="vnIn nkIn" style="width:0;min-width:0;flex:1 1 auto" type="text" autocomplete="off" placeholder="ひらがな・カタカナ"></div><p class="nkErr" style="min-height:1.2em;margin:0 0 8px;color:#c0392b"></p><div style="display:flex;gap:8px;justify-content:center"></div></div>');
  const ip=card.querySelector('input'),er=card.querySelector('.nkErr'),bx=card.lastElementChild;ip.value=nickName(r.name);ip.setAttribute('maxlength',String(NKMAX*2));
  const fix=()=>{const v=nickClean(ip.value);if(v!==ip.value)ip.value=v;er.textContent=''};ip.addEventListener('input',e=>{if(!e.isComposing)fix()});ip.addEventListener('compositionend',fix);/* 日本語の入力中（変換中）は、さわらない */
  const no=el('<button class="btn" type="button">やめる</button>'),ok=el('<button class="btn pri" type="button">きめる</button>');
  no.onclick=()=>{sfx('tap');ov.remove()};
  ok.onclick=()=>{if(!nickOK(r)){ov.remove();return}const v=nickClean(ip.value),bad=nickBad(v,r);if(bad){sfx('warn');er.textContent=bad;return}nickSet(r,v);sfx('good');ov.remove();if(sheet==='res')renderSheet()};
  bx.append(no,ok);ov.append(card);document.body.append(ov);setTimeout(()=>{if(ov.isConnected)ip.focus({preventScroll:true})},60)}
function nickSec(body,r){/* 紹介の画面の、名前の行 */if(!nickOK(r))return;const row=el('<div style="display:flex;gap:8px;align-items:center;margin:6px 0"><span style="flex:1"></span><button class="btn" type="button">名前をかえる</button></div>');
  row.firstChild.textContent='名前：'+nickName(r.name);row.lastChild.onclick=()=>{sfx('tap');nickPop(r)};body.appendChild(row)}
if(document.body)nickWatch();else document.addEventListener('DOMContentLoaded',nickWatch);
