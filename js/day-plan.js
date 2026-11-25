'use strict';
/* 昼の人でをわける：朝（日記のあと）に、カミサマの問いで、今日の役を3つからえらぶ。えらんだ役は、その日の朝6時から、つぎの朝6時までだけ効く。
   あつめる：木材・石材の集めて1回で PLGATHER こ多い。つくる：つくる（おねがい）の時間が PLCRAFT へる。守り：見張り台の威力が PLGUARD ふえる。
   S.plan={d:日,k:役}（えらばなかった日は、いままでどおり）。草原だけ。目標の欄に、えらんだ役を出す。 */
const PLGATHER=1,PLCRAFT=10,PLGUARD=5;
const PLANS=[{k:'gather',name:'あつめる',txt:'木材・石材が、1回で+'+PLGATHER+'こ多い'},{k:'craft',name:'つくる',txt:'つくる時間が'+PLCRAFT+'へる'},{k:'guard',name:'守りのじゅんび',txt:'夜の見張り台の威力が+'+PLGUARD}];
let PLASK=null;/* 問いを出しているゲーム（セーブしない） */
const planOn=()=>!!S&&WD===KUSA&&!S.free&&!IS_STORY_REPLAY&&S.lv>=2;
function planKey(){/* 今日の役（朝6時から、つぎの朝6時まで） */if(!planOn()||!S.plan)return '';const d=hour()<6?dayNo()-1:dayNo();return S.plan.d===d?S.plan.k:''}
const planGather=()=>planKey()==='gather'?PLGATHER:0,planCraft=()=>planKey()==='craft'?PLCRAFT:0,planGuard=()=>planKey()==='guard'?PLGUARD:0;
function planNote(){const k=planKey(),p=PLANS.find(x=>x.k===k);return p?'今日：'+p.name:''}
function planMorning(){if(!planOn()||PLASK===S)return;PLASK=S;const S0=S;
  const go=()=>{if(S!==S0)return;if(sheet!=null||!$('#dialog').hidden||isNight()){later(go,300);return}
    const d=dayNo(),opts=PLANS.map(p=>({t:p.name+'：'+p.txt,v:p.k,lines:[[GOD,'#nod|よし、きょうは「'+p.name+'」じゃな。']]}));
    dialog([['@choice',{key:'plan'+d,who:GOD,q:'#think|さて、きょうは、みんなに何をしてもらうかのう。',pick:v=>{S.plan={d,k:v};PLASK=null;dirty=true;renderQuest()},opts}]],()=>{PLASK=null})};
  later(go,2800)}/* 朝の日記のあとに出す */
