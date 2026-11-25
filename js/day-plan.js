'use strict';
/* 昼の人でをわける：朝（日記のあと）に、ポップアップで、今日の役を3つからえらぶ（カミサマには言わせない。持ち主がきめた）。えらんだ役は、その日の朝6時から、つぎの朝6時までだけ効く。
   あつめる：木材・石材の集めて1回で PLGATHER こ多い。つくる：つくる（おねがい）の時間が PLCRAFT へる。守り：見張り台の威力が PLGUARD ふえる。
   S.plan={d:日,k:役}（えらばなかった日は、いままでどおり）。草原だけ。目標の欄に、えらんだ役を出す。 */
const PLGATHER=1,PLCRAFT=10,PLGUARD=5;
const PLANS=[{k:'gather',name:'あつめる',txt:'木材・石材が、1回で+'+PLGATHER+'こ多い'},{k:'craft',name:'つくる',txt:'つくる時間が'+PLCRAFT+'へる'},{k:'guard',name:'守りのじゅんび',txt:'夜の見張り台の威力が+'+PLGUARD}];
let PLASK=null;/* 問いを出しているゲーム（セーブしない） */
const planOn=()=>!!S&&WD===KUSA&&!S.free&&!IS_STORY_REPLAY&&S.lv>=2;
function planKey(){/* 今日の役（朝6時から、つぎの朝6時まで） */if(!planOn()||!S.plan)return '';const d=hour()<6?dayNo()-1:dayNo();return S.plan.d===d?S.plan.k:''}
const planGather=()=>planKey()==='gather'?PLGATHER:0,planCraft=()=>planKey()==='craft'?PLCRAFT:0,planGuard=()=>planKey()==='guard'?PLGUARD:0;
function planNote(){const k=planKey(),p=PLANS.find(x=>x.k===k);return p?'今日：'+p.name:''}
function planPop(d,done){/* 役の名前と効き目を2行に分けて、折り返しをへらす */const o=el('<div id="planPop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:16px"><div class="pxcard" style="background:var(--panel);padding:16px;max-width:360px;width:100%;color:var(--ink)"><b style="display:block;font-size:15px;margin-bottom:4px">今日の役</b><div style="font-size:15px;line-height:1.6;margin-bottom:10px">きょうは、みんなに何をしてもらう？</div><div class="rows" style="display:flex;flex-direction:column;gap:8px"></div></div></div>'),rows=o.querySelector('.rows');
  for(const p of PLANS){const b=el('<button class="row" style="text-align:left;width:100%"><div class="tx"><b></b><span style="display:block;font-size:15px;line-height:1.5;color:var(--muted)"></span></div></button>');b.querySelector('b').textContent=p.name;b.querySelector('span').textContent=p.txt;
    b.onclick=()=>{if(!o.isConnected)return;o.remove();sfx('next');S.plan={d,k:p.k};dirty=true;renderQuest();done()};rows.appendChild(b)}
  document.body.appendChild(o);sfx('tap')}
function planMorning(){if(!planOn()||PLASK===S)return;PLASK=S;const S0=S;
  const go=()=>{if(S!==S0)return;if(sheet!=null||!$('#dialog').hidden||DLGQ.length||document.querySelector('.pxcard')||!$('#lvup').hidden||typeof GIFT_ACTIVE!=='undefined'&&GIFT_ACTIVE||isNight()){later(go,300);return}/* 会話・ほかのカードのあいだは、まつ */
    planPop(dayNo(),()=>{PLASK=null})};
  later(go,2800)}/* 朝の日記のあとに出す */
