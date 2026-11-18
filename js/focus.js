/* とくにする仕事（リムワールドの仕事の表を手本に、1つだけ）：せいれいの画面でえらぶ（r.focus）。
   goWork で、しごと場の担当（jobWork）のすぐあと、ふだんの仕事（植える・ひろう・畑・木・石・草）より先にする。
   修理（土）・食べ物が少ないとき・建てる・依頼のものづくり・設計図・しごと場の担当は、そのまま先。
   その子ができない仕事（canJob・その属性の料理がない）は、えらべない。たしかめは tools/tests/focus.cjs。 */
const FOCUS={farm:{n:'はたけ'},chop:{n:'木'},mine:{n:'石'},pick:{n:'ひろう',jobs:['drop','weed','seed']},cook:{n:'料理',jobs:['cookS']}};
function focusJobs(k){return k==='farm'?FARMJ:k==='chop'||k==='mine'?[k]:(FOCUS[k]&&FOCUS[k].jobs)||[]}
function focusOK(r,k){if(!FOCUS[k])return false;if(k==='cook')return(SPEC[r.elem]||[]).includes('cookS');return focusJobs(k).some(j=>canJob(r,j))}
function focusJob(r,G){const k=r.focus;if(!k||!focusOK(r,k))return false;for(const j of focusJobs(k))if(canJob(r,j)&&tryJob(r,G,j))return true;return false}
function focusSec(body,r){const sec=el('<div class="sec"><h3>とくにする仕事</h3><div class="btns" style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 8px"></div></div>'),bw=sec.querySelector('.btns');
  const mk=(v,t)=>{const b=el('<button class="btn"></button>');b.textContent=t;if((r.focus||null)===v)b.classList.add('pri');b.onclick=()=>{if((r.focus||null)===v)return;if(v)r.focus=v;else delete r.focus;sfx('tap');renderSheet()};bw.appendChild(b)};
  mk(null,'なし');for(const k in FOCUS)if(focusOK(r,k))mk(k,FOCUS[k].n);body.appendChild(sec)}
