/* くわしいログ（log.js）：エラー・せいれいの行動のわけ・クエストと会話の進みを、あとから原因をたどれるようにためる。
   エラーはいつも。量の多い物（せいれい・会話・クエスト）は、設定の「くわしいログ」が入りのときだけ（LOGV）。
   さいごの LOGMAX 行をメモリにため、LOGKEEP 行を localStorage（LOGKEY）にのこす（ページが落ちても、つぎにひらいたとき見られる）。
   思い出帳の再生（IS_STORY_REPLAY）では、のこさない（子の画面から、ずっとのこる所をさわらない）。
   KV.setItem は、入りきらないと「保存できない」になるので使わない（localStorage をじかに、しっぱいしても何もしない）。 */
const LOGMAX=3000,LOGKEEP=1500,LOGKEY='hakoniwa-log',LOGVKEY='hk-logv',LOGFLUSH=10000;
let LOGV=false,LOGB=[],LOGDIRTY=0,LOGLAST=0;
try{LOGV=localStorage.getItem(LOGVKEY)==='1'}catch(e){}
if(!IS_STORY_REPLAY)try{const t=localStorage.getItem(LOGKEY);if(t)LOGB=t.split('\n').slice(-LOGKEEP)}catch(e){}
function lgWhen(){/* 本当の時刻・ステージ・村の日と時計 */let s=new Date().toTimeString().slice(0,8);
  try{if(typeof S!=='undefined'&&S&&typeof clk==='function'){const m=clk(),h=Math.floor(m/60)%24,mi=Math.floor(m%60);s+=' W'+WD+' '+dayNo()+'日'+String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0')}}catch(e){}return s}
function lgPut(kind,msg){LOGB.push(lgWhen()+' ['+kind+'] '+msg);if(LOGB.length>LOGMAX)LOGB.splice(0,LOGB.length-LOGMAX);LOGDIRTY=1}
function lgFlush(now){if(!LOGDIRTY||IS_STORY_REPLAY)return;const t=Date.now();if(!now&&t-LOGLAST<LOGFLUSH)return;LOGLAST=t;LOGDIRTY=0;try{localStorage.setItem(LOGKEY,LOGB.slice(-LOGKEEP).join('\n'))}catch(e){}}
function lgClear(){LOGB=[];LOGDIRTY=1;lgFlush(true)}
function lgSetV(v){LOGV=!!v;try{localStorage.setItem(LOGVKEY,LOGV?'1':'')}catch(e){}lgPut('ログ','くわしいログ '+(LOGV?'入り':'切り'));lgFlush(true)}
function lgText(){return 'はこにわ ログ　バージョン '+(typeof APP_VER!=='undefined'?APP_VER:'?')+'　'+new Date().toLocaleString('ja-JP')+'\n'+navigator.userAgent+'\n\n'+LOGB.join('\n')}
function lgStack(e,n){/* スタックの上から n 行を、ファイル名:行:列 だけにする */return String(e&&e.stack||'').split('\n').map(s=>s.trim()).filter(s=>s&&!/^\w*Error\b/.test(s)).slice(0,n||5).map(s=>s.replace(/\(?(?:[^\s()@]*\/)?([^\/\s()?@]+\.(?:js|html))(?:\?[^:\s)]*)?(:\d+:\d+)\)?/g,'$1$2').replace(/^at /,'')).join(' < ')}
function lgCtx(){/* エラーのときの、まわりのようす */const o=[];
  try{if(typeof S!=='undefined'&&S){const q=typeof QUESTS!=='undefined'&&QUESTS[S.quest];o.push('目標='+(q?q.id:S.quest));if(S.qStory!=null)o.push('qStory='+S.qStory);if(S.qTalked)o.push('qTalked');o.push('せいれい='+(S.res||[]).length);if(S.enemies&&S.enemies.length)o.push('コワイノ='+S.enemies.length)}
    if(typeof sheet!=='undefined'&&sheet)o.push('画面='+sheet+(typeof sheetArg!=='undefined'&&sheetArg?':'+sheetArg:''));const d=document.getElementById('dialog');if(d&&!d.hidden)o.push('会話中');if(typeof paused==='function'&&paused())o.push('止まっている')}catch(e){}return o.join(' ')}
function lgErr(where,e){/* エラー：いつも記録。同じエラーが5秒のうちにつづいたら、数だけかぞえる */const m=where+': '+(e&&e.message||e),t=Date.now(),L=lgErr;
  if(L.m===m&&t-L.t<5000){L.n++;L.t=t;return}if(L.n>1)lgPut('エラー','（前のエラーが、あと'+(L.n-1)+'回）');L.m=m;L.t=t;L.n=1;
  lgPut('エラー',m+' | '+lgStack(e,6)+' | '+lgCtx());lgFlush(true)}
lgErr.n=0;
window.addEventListener('error',ev=>{const tg=ev.target;if(tg&&tg!==window&&(tg.src||tg.href)){lgErr('読みこめない',{message:String(tg.src||tg.href).replace(/^.*\//,'')});return}
  lgErr('window',ev.error||{message:ev.message,stack:(ev.filename||'')+':'+ev.lineno+':'+ev.colno})},true);/* true：絵・音のファイルが読めないのもひろう */
window.addEventListener('unhandledrejection',ev=>{const e=ev.reason;lgErr('promise',e&&e.message?e:{message:String(e)})});
window.addEventListener('pagehide',()=>lgFlush(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)lgFlush(true)});
/* ---------- せいれいの行動（くわしいログのときだけ） ---------- */
function lgWho(skip){/* よんだ所（関数@ファイル:行）。skip：log.js のあと、とばす数 */const s=String(new Error().stack||'').split('\n').map(x=>x.trim()).filter(x=>x&&!/^\w*Error\b/.test(x)&&!/(^|[\/\s(@])log\.js/.test(x));const f=s[skip||0];return f?lgStack({stack:f},1):'?'}
function lgCell(j){return j==null||j<0?'-':(j%W)+','+((j/W)|0)}
function lgName(r){return r?(r.name||'?')+'#'+r.id:'?'}
function lgR(r,msg){if(LOGV)lgPut('せいれい',lgName(r)+' '+msg)}
function lgActTxt(a){if(!a)return'なし';let s=a.type;if(a.stand>=0)s+=' →'+lgCell(a.stand);if(a.obj!=null&&a.obj!==a.stand)s+=' 物='+(S.obj[a.obj]||'')+'@'+lgCell(a.obj);if(a.key)s+=' key='+a.key;if(a.order)s+=' 依頼='+a.order;return s}
function lgStart(r,prevT){if(!LOGV)return;lgR(r,'はじめる '+lgActTxt(r.act)+(prevT?' （前：'+prevT+'）':'')+' 道'+(r.path?r.path.length:0)+'マス おなか'+Math.round(r.hunger)+' たのしさ'+Math.round(r.fun)+' つかれ'+Math.round(r.energy)+' ← '+lgWho(1))}
function lgEnd(r){if(!LOGV||!r.act)return;const a=r.act;if(a.fin)lgR(r,'おわった '+a.type);else lgR(r,'やめた '+lgActTxt(a)+' '+a.stage+' t'+Math.round(a.t||0)+' ← '+lgWho(1))}
/* ---------- クエスト・会話（くわしいログのときだけ） ---------- */
function lgQ(msg){if(LOGV)lgPut('クエスト',msg)}
function lgDlg(msg){if(LOGV)lgPut('会話',msg)}
function lgLine(l){/* 会話の行を、短く */if(!l)return'';if(Array.isArray(l))return(typeof l[0]==='string'?l[0]:'')+'「'+String(l[1]==null?'':typeof l[1]==='string'?l[1]:JSON.stringify(l[1])).slice(0,30)+'」';return String(l).slice(0,40)}
let LGQS='',LGQT=0;
function lgTick(now){/* 1秒に1回：目標・お話を待つわけがかわったら記録する。ためた物は10秒ごとにのこす */if(now-LGQT<1000)return;LGQT=now;lgFlush();if(!LOGV||typeof S==='undefined'||!S||typeof QUESTS==='undefined')return;
  try{const q=QUESTS[Math.min(S.quest,QUESTS.length-1)],qt=document.getElementById('questTxt');let w='';try{w=q&&typeof mainTalkWaitText==='function'?mainTalkWaitText(q):''}catch(e){w='（わけをしらべられない：'+e.message+'）'}
    const s='目標='+(q?q.id:'-')+'#'+S.quest+' qStory='+S.qStory+' qTalked='+!!S.qTalked+(S.cleared?' クリア':'')+' 表示「'+(qt?qt.textContent:'')+'」'+(w?' 待つわけ「'+w+'」':'');
    if(s!==LGQS){LGQS=s;lgQ(s)}}catch(e){lgErr('lgTick',e)}}
/* ---------- 設定の「ログ」：見る・書き出す ---------- */
async function lgExport(){lgFlush(true);const txt=lgText(),dt=new Date(),p=n=>String(n).padStart(2,'0'),nm='hakoniwa-log-'+dt.getFullYear()+p(dt.getMonth()+1)+p(dt.getDate())+'-'+p(dt.getHours())+p(dt.getMinutes())+'.txt';
  let dl=null;try{dl=window.claude&&await window.claude.use('downloads')}catch(e){}
  if(dl){try{await dl.save({filename:nm,data:new Blob([txt],{type:'text/plain'})});toast('ログを書き出した','good')}catch(e){if(e&&e.code!=='declined')toast('書き出せませんでした')}return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download=nm;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),10000);toast('ログを書き出した','good')}catch(e){toast('書き出せませんでした')}}
function lgPop(){/* さいごの400行を、あたらしい物を上に */const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:16px"><div class="pxcard" style="background:var(--panel);padding:14px 16px;max-width:640px;width:100%;color:var(--ink);display:flex;flex-direction:column;max-height:85vh"><b style="font-size:15px">ログ</b><pre style="flex:1;overflow:auto;margin:8px 0 12px;font-size:10px;line-height:1.6;white-space:pre-wrap;word-break:break-all"></pre><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ex">書き出す</button><button class="btn x">とじる</button></div></div></div>');
  o.querySelector('pre').textContent=LOGB.length?LOGB.slice(-400).reverse().join('\n'):'まだ ありません';
  o.querySelector('.ex').onclick=()=>{sfx('tap');lgExport()};o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
function lgSec(body){const sc=el('<div class="sec"><h3>ログ</h3><p class="note">エラーは、いつも のこる。くわしいログを入りにすると、せいれいの行動のわけ・会話・目標の進みも のこる。</p><div style="display:flex;gap:8px;flex-wrap:wrap"></div></div>'),rw=sc.lastElementChild;
  const v=el('<button class="btn"></button>');v.textContent='くわしいログ：'+(LOGV?'オン':'オフ');v.onclick=()=>{lgSetV(!LOGV);renderSheet()};
  const sh=el('<button class="btn">見る</button>');sh.onclick=()=>{sfx('tap');lgPop()};
  const ex=el('<button class="btn">書き出す</button>');ex.onclick=()=>{sfx('tap');lgExport()};
  const cl=el('<button class="btn" data-hold>けす</button>');cl.onclick=()=>{if(cl._held){lgClear();toast('ログをけした')}};
  for(const b of[v,sh,ex,cl])rw.appendChild(b);body.appendChild(sc)}
