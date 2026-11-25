'use strict';
/* 今夜のそなえ：夕方 NPFROM 時から夜（20時）まで、ポップアップを1日1回出す（持ち主がえらんだ。上の札・知らせはやめた）。会話・ほかのカード・洞窟のあいだは、まつ。コワイノが来るどのステージも（フリーモードはのぞく）。
   出す物：今夜のコワイノのよていの数（20時にきまる前は、いまの人数でかぞえた見こみ。見るだけで、もとにもどす）・おなかがすいたせいれい（赤い札と同じ、おなか100より下）の数・箱の食料。
   かえられる物（持ち主がえらんだ）：作戦（作戦をたてようを受けてから）・たたかう／たたかわない・見張り台に立つせいれい・まよけのハーブ・角笛。 */
const NPFROM=17,NPHUN=100;
/* 作戦（持ち主がえらんだ3つ）：村ぜんたいの、今夜のたたかい方。戦いのゲームの「かまえ」（せめる／まもる）にそろえ、ふつういがいには得と損がある。えらんだ作戦は、かえるまでつづく。夜はかえられない。とくべつな夜（さいごの夜・試練・群れ）は「ふつう」。
   おぼえるのはサブクエスト（quests.js）：村に火のせいれいが来たら「作戦をたてよう」（受けたら、今夜のそなえに作戦の欄・ふつう・まもる）→ 大きな影を追いはらったら「こっちからせめよう」（受けたら、せめる）。 */
const TAC={
  futsu:{n:'ふつう',t:'たたかうせいれいは、近くの「コワイノ」とたたかう'},
  mamoru:{n:'まもる',t:'得：たたかうせいれいが受ける、おなかのへりが0.5倍。損：せいれいと家のまわり3マスより遠くの「コワイノ」は追わない・攻撃力0.8倍'},
  semeru:{n:'せめる',t:'得：たたかうせいれいの攻撃力1.3倍・「コワイノ」をたおしたときのパワー1.5倍。損：受ける、おなかのへりが1.5倍・まわり10マスの「コワイノ」まで追い、むれにもとびこむ（家のそばが手うすになる）'}};
const TACORD=['futsu','mamoru','semeru'];
const TACFX={mamoru:{hurt:.5,atk:.8},semeru:{hurt:1.5,atk:1.3,pw:1.5}};/* 作戦の効き目：その夜だけなので、季節の効き目（SEAFX）と同じく倍。hurt：たたかうせいれいが受けるおなかのへり・atk：たたかうせいれいの攻撃力・pw：たおしたときのパワー */
const TACCHASE={futsu:60,mamoru:20,semeru:120};/* 追いかける歩数（huntSpot の maxD） */
const TACNEAR=3,TACWIDE=10;/* まもる：せいれい・家からのマス／せめる：まわりのマス */
const TACQ={mamoru:'tacStart',semeru:'tacSeme'};/* その作戦をおぼえるサブクエスト（受けたら、えらべる） */
const tacOn=()=>!!(S&&S.enemyOn&&!S.free&&!IS_STORY_REPLAY);
const tacGot=k=>!!((S.subSt||{})[k]>=2||(S.subDone||{})[k]);
const tacUse=()=>!!(S&&tacOn()&&tacGot('tacStart'));/* 作戦の欄を出す（「作戦をたてよう」を受けた） */
const tacOK=k=>tacUse()&&(k==='futsu'||!!TACQ[k]&&tacGot(TACQ[k]));
const tacAny=()=>tacUse();/* ひでんのしょに出す */
function tacNow(){if(!S||!tacOn()||S.finalOn||S.rushOn||S.trialOn||S.ns&&S.ns.final)return 'futsu';const k=S.tac;return TAC[k]&&tacOK(k)?k:'futsu'}
const tacChase=()=>TACCHASE[tacNow()]||60;
const tacFx=k=>isNight()&&(TACFX[tacNow()]||{})[k]||1;/* 夜だけ */
function tacHouseNear(e,d){for(const h of HOUSES||[])for(const q of h.set){if(Math.max(Math.abs(q%W+.5-e.x),Math.abs(((q/W)|0)+.5-e.y))<=d)return true}return false}
function tacClose(e,r){/* まもる：もう攻撃がとどく・こわしている・ぬすんでいる・なかまをたたいている・たたかわないせいれいか家の3マス以内 */if(Math.hypot(e.x-r.x,e.y-r.y)<=1.5||foeBreaking(e)||foeStealing(e)||foeHitting(e,r))return true;
  if(S.res.some(q=>q!==r&&!q.hidden&&!fighter(q)&&Math.max(Math.abs(e.x-q.x),Math.abs(e.y-q.y))<=TACNEAR))return true;return tacHouseNear(e,TACNEAR)}
function tacWide(r,L){/* せめる：まわり10マスの「コワイノ」も。むれにもとびこむ。にげるコワイノは追わない（村の外へひっぱられない） */const o=new Set(L);for(const e of S.enemies)if(e.spawned&&!e.dead&&Math.hypot(e.x-r.x,e.y-r.y)<=TACWIDE)o.add(e);return [...o].filter(e=>!e.flee)}
function nightPrepData(){if(!S||!tacOn()||S.finalNight||S.trial||S.rushOn)return null;const h=hour();if(h<NPFROM||h>=20)return null;
  const w=wavePeek(dayNo()+1);/* 見るだけで、もとにもどす（night.js） */
  const boss=w.some(t=>EN[t]&&EN[t].boss),hungry=S.res.filter(r=>!r.hidden&&r.hunger<NPHUN).length;
  return{n:w.length,boss,hungry,food:Math.floor(S.food||0)}}
function wpOwnSet(j,id){/* 見張り台 j に立つせいれいをきめる（null：だれでも）。ほかの見張り台にきまっていたら、はずす */const B=S.wpOwn||(S.wpOwn={});for(const k in B)if(B[k]===id)delete B[k];if(id==null)delete B[j];else B[j]=id}
function tacTick(){/* 作戦のクエストのたっせい：まもるで、夜を朝5時までこした（quests.js の tacStart） */if(S&&hour()>=5&&hour()<6&&tacNow()==='mamoru'&&(S.subSt||{}).tacStart===2)S.flags.tacMamoru=1}
const wpWhoOK=r=>r.elem!=='fire'||sortieOn();/* 見張り台に立てるせいれい（火のせいれいは、出撃をえらべるようになってから） */
function npCard(id,w){return el('<div id="'+id+'" style="position:fixed;inset:0;z-index:'+(id==='prepPop'?45:46)+';display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:'+w+'px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"></div></div>')}
function npWpPick(j,done){/* 見張り台に立つせいれいを、ポップアップでえらぶ */const o=npCard('prepWp',320),c=o.firstChild,own=S.wpOwn||{},oid=own[j];
  c.innerHTML='<b style="display:block;font-size:15px;margin-bottom:8px">見張り台に立つせいれい</b><div class="rows"></div><div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn x">もどる</button></div>';
  const rows=c.querySelector('.rows'),add=(t,s,id,r)=>{const row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>');const dot=row.querySelector('.dot');dot.style.cssText=r?'background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col:'background:#f6f1e6';
    ckSet(row.querySelector('b'),t);row.querySelector('small').textContent=s;row.onclick=()=>{wpOwnSet(j,id);sfx('next');o.remove();done()};rows.appendChild(row)};
  const ow=oid!=null?S.res.find(q=>q.id===oid&&wpWhoOK(q)):null;add((ow?'':'✓ ')+'だれでも','あいていれば、だれでも立つ',null,null);
  for(const r of S.res){if(r.hidden||!wpWhoOK(r))continue;let mine=-1;for(const k in own)if(own[k]===r.id&&S.obj[k]==='watch')mine=+k;add((ow===r?'✓ ':'')+r.name+'  Lv'+rLv(r),ELEM[r.elem].name+'のせいれい・'+(WPTXT[r.elem]||'')+(mine>=0&&mine!==j?'・ほかの見張り台':''),r.id,r)}
  c.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
function nightPrepPop(D){const o=npCard('prepPop',360),c=o.firstChild;document.body.appendChild(o);sfx('tap');sfx('npopen');/* ポチのあとに、紙をめくる「ぱさっ」（持ち主がえらんだ） */
  const render=()=>{if(!o.isConnected)return;const night=isNight();c.innerHTML='<b style="display:block;font-size:15px;margin-bottom:8px">今夜のそなえ</b><div class="rows" style="line-height:1.8"></div><div class="np"></div><div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button></div>';
    const rows=c.querySelector('.rows'),np=c.querySelector('.np'),row=(k,v,warn)=>{const d=document.createElement('div');d.style.cssText='display:flex;justify-content:space-between;gap:12px'+(warn?';color:#a54152':'');d.innerHTML='<span></span><b></b>';d.children[0].textContent=k;d.children[1].textContent=v;rows.appendChild(d)};
    row('今夜の「コワイノ」',D.n?D.n+'ひき'+(D.boss?'（大きな影つき）':''):'来ない見こみ');row('おなかがすいたせいれい',D.hungry+'人',D.hungry>0);row('箱の食料',String(D.food),D.food<=0);
    const sec=(h)=>{const s=el('<div class="sec" style="margin-top:10px"><h3></h3></div>');s.querySelector('h3').textContent=h;np.appendChild(s);return s};
    const btns=s=>{const b=el('<div class="btns" style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0"></div>');s.appendChild(b);return b};
    if(tacUse()){/* 作戦（作戦をたてようを受けるまでは、欄を出さない） */const s=sec('作戦'),bw=btns(s),cur=S.tac&&tacOK(S.tac)?S.tac:'futsu';
      for(const k of TACORD){if(!tacOK(k))continue;const b=el('<button class="btn"></button>');b.textContent=TAC[k].n;if(k===cur)b.classList.add('pri');lackOn(b,night?'夜は、かえられない':'');b.onclick=()=>{if(isNight()||k===cur)return;S.tac=k;dirty=true;sfx('tap');render()};bw.appendChild(b)}
      const p=el('<p class="note" style="margin:4px 0 0"></p>');p.textContent=TAC[cur].t;s.appendChild(p)}
    {/* たたかう・たたかわない（せいれいの画面と同じ） */const L=S.res.filter(r=>!r.hidden&&sortieOK(r));if(L.length){const s=sec('たたかう');
      for(const r of L){const on=fighter0(r),line=el('<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0"><span></span><div class="btns" style="display:flex;gap:8px"></div></div>');line.firstChild.textContent=r.name;const bw=line.lastChild;
        const mk=(v,t)=>{const b=el('<button class="btn"></button>');b.textContent=t;if(on===v)b.classList.add('pri');lackOn(b,night?'夜は、かえられない':'');b.onclick=()=>{if(isNight()||on===v)return;r.sortie=v;if(v===sortieDef(r))delete r.sortie;dirty=true;sfx('tap');render()};bw.appendChild(b)};
        mk(true,'たたかう');mk(false,'たたかわない');s.appendChild(line)}}}
    {/* 見張り台に立つせいれい */const T=[];for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='watch')T.push(j);if(T.length){const s=sec('見張り台'),own=S.wpOwn||{};
      T.forEach((j,i)=>{const oid=own[j],ow=oid!=null?S.res.find(q=>q.id===oid&&wpWhoOK(q)):null,b=el('<button class="btn" style="width:100%;margin:4px 0;text-align:left"></button>');b.textContent='見張り台'+(i+1)+'：'+(ow?ow.name:'だれでも');b.onclick=()=>{sfx('tap');npWpPick(j,render)};s.appendChild(b)})}}
    {/* まよけのハーブ・角笛 */const hv=(S.herb||0)>0,hn=WD===KUSA&&(S.horn||0)>0;if(hv||hn){const s=sec('どうぐ'),bw=btns(s);
      if(hv){const b=el('<button class="btn"></button>');b.textContent='まよけのハーブをつかう（'+S.herb+'）';lackOn(b,herbOK()?'':herbNow()?'今夜は、もうつかった':'いまは、つかえない');b.onclick=()=>{if(!herbOK())return;herbUse();render()};bw.appendChild(b)}
      if(hn){const b=el('<button class="btn"></button>');b.textContent='よびごえの角笛をふく（'+S.horn+'）';lackOn(b,hornOK()?'':'いまは、ふけない');b.onclick=()=>{if(!hornOK())return;hornBlow();render()};bw.appendChild(b)}}}
    c.querySelector('.x').onclick=()=>{sfx('tap');o.remove()}};
  render()}
function nightPrepTick(){const now=performance.now();if(now-(nightPrepTick.t||0)<1000)return;nightPrepTick.t=now;if(!S)return;tacTick();
  if(!$('#dialog').hidden||DLGQ.length||document.querySelector('.pxcard')||!$('#lvup').hidden||typeof GIFT_ACTIVE!=='undefined'&&GIFT_ACTIVE||typeof VBG!=='undefined'&&VBG)return;/* 会話・ほかのカード・場面・洞窟のあいだは、まつ */
  if(S.npDay===dayNo())return;const D=nightPrepData();if(!D)return;
  S.npDay=dayNo();nightPrepPop(D)}
