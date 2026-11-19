/* とくにする仕事（リムワールドの仕事の表を手本に、1つだけ）：せいれいの画面でえらぶ（r.focus）。
   goWork で、しごと場の担当（jobWork）のすぐあと、ふだんの仕事（植える・ひろう・畑・木・石・草）より先にする。
   修理（土）・食べ物が少ないとき・建てる・依頼のものづくり・設計図・しごと場の担当は、そのまま先。
   その子ができない仕事（canJob・その属性の料理がない）は、えらべない。たしかめは tools/tests/focus.cjs。 */
const FOCUS={farm:{n:'はたけ'},chop:{n:'木'},mine:{n:'石'},pick:{n:'ひろう',jobs:['drop','weed','seed']},cook:{n:'料理',jobs:['cookS']}};
function focusJobs(k){return k==='farm'?FARMJ:k==='chop'||k==='mine'?[k]:(FOCUS[k]&&FOCUS[k].jobs)||[]}
function focusOK(r,k){if(!FOCUS[k])return false;if(k==='cook')return(SPEC[r.elem]||[]).includes('cookS');return focusJobs(k).some(j=>canJob(r,j))}
function focusJob(r,G){const k=r.focus;if(!k||!focusOK(r,k))return false;for(const j of focusJobs(k))if(canJob(r,j)&&tryJob(r,G,j))return true;return false}
function focusSec(body,r){/* ふだんは、いまの仕事だけ。おすとポップアップでえらぶ（focusPop） */const sec=el('<div class="sec"><h3>とくにする仕事</h3><div class="btns" style="display:flex;gap:8px;margin:4px 0 8px"></div></div>'),b=el('<button class="btn"></button>');
  b.textContent=r.focus&&focusOK(r,r.focus)?FOCUS[r.focus].n:'なし';b.onclick=()=>{sfx('tap');focusPop(r)};sec.querySelector('.btns').appendChild(b);body.appendChild(sec)}
function focusPop(r){const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:360px;width:100%;max-height:80vh;overflow:auto;color:var(--ink)"><b style="display:block;font-size:15px;margin-bottom:8px">とくにする仕事</b><div class="rows fj"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>'),rows=o.querySelector('.fj');
  const opt=(v,t)=>{const on=(r.focus&&focusOK(r,r.focus)?r.focus:null)===v,row=el('<button class="row" style="text-align:left;width:100%"><div class="tx"><b></b></div></button>');ckSet(row.querySelector('b'),(on?'✓ ':'')+t);row.onclick=()=>{if(v)r.focus=v;else delete r.focus;sfx('next');o.remove();if(sheet)renderSheet()};rows.appendChild(row)};
  opt(null,'なし');for(const k in FOCUS)if(focusOK(r,k))opt(k,FOCUS[k].n);
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
